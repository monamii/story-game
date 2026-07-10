import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-results');
mkdirSync(OUT_DIR, { recursive: true });

const URL = 'http://localhost:8384/';

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  try {
    assert.equal(actual, expected);
    console.log(`✅ ${label}`);
    passed++;
  } catch {
    console.log(`❌ ${label} | expected: ${expected}, actual: ${actual}`);
    failed++;
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push(err.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.click('canvas');
await page.waitForTimeout(300);

// Hold key until map changes, then release immediately
async function navigateToMap(key, targetMap) {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      (m) => window.game?.currentMap === m,
      targetMap,
      { timeout: 10000 }
    );
  } finally {
    await page.keyboard.up(key);
    await page.waitForTimeout(400);
  }
}

// Move player toward target using both axes, tap key by key
async function moveNear(getTarget, threshold = 35) {
  for (let i = 0; i < 120; i++) {
    const state = await page.evaluate(() => {
      const g = window.game;
      if (!g) return null;
      const pcx = g.player.x + g.player.width / 2;
      const pcy = g.player.y + g.player.height / 2;
      return { pcx, pcy };
    });
    const target = await getTarget();
    if (!state || !target) break;

    const dx = target.cx - state.pcx;
    const dy = target.cy - state.pcy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < threshold) break;

    let key;
    if (Math.abs(dy) > Math.abs(dx)) {
      key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
    } else {
      key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    }
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(200);
}

// Press Space until dialogue ends — stops immediately when idle to avoid re-triggering
async function advanceUntilDone(maxPresses = 15) {
  for (let i = 0; i < maxPresses; i++) {
    const active = await page.evaluate(() => window.game?.dialogue?.isActive());
    if (!active) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(200);
}

async function getNpcCenter() {
  return page.evaluate(() => {
    const g = window.game;
    if (!g) return null;
    return { cx: g.npc.x + g.npc.width / 2, cy: g.npc.y + g.npc.height / 2 };
  });
}

async function getItemCenter() {
  return page.evaluate(() => {
    const g = window.game;
    if (!g) return null;
    return { cx: g.item.x + g.item.width / 2, cy: g.item.y + g.item.height / 2 };
  });
}

// --- Step 1: page loads ---
await page.screenshot({ path: join(OUT_DIR, 'step1_load.png') });
const step1Map = await page.evaluate(() => window.game?.currentMap);
check('Step1 initial map', step1Map, 'forest');

// --- Step 2: Forest → Beach → Shore ---
await navigateToMap('ArrowRight', 'beach');
check('Step2 arrived at beach', await page.evaluate(() => window.game?.currentMap), 'beach');

await navigateToMap('ArrowRight', 'shore');
await page.screenshot({ path: join(OUT_DIR, 'step2_shore.png') });
check('Step2 arrived at shore', await page.evaluate(() => window.game?.currentMap), 'shore');

// --- Step 3: Shore → Beach, approach NPC (x=340 y=230), start dialogue ---
await navigateToMap('ArrowLeft', 'beach');

await moveNear(getNpcCenter, 35);
const distToNpc = await page.evaluate(() => {
  const g = window.game;
  const dx = (g.player.x + 16) - (g.npc.x + 16);
  const dy = (g.player.y + 16) - (g.npc.y + 16);
  return Math.round(Math.sqrt(dx * dx + dy * dy));
});
console.log(`   dist to NPC: ${distToNpc} (threshold 40)`);

await page.keyboard.press('Space');
await page.waitForTimeout(600);
const dialogueActive = await page.evaluate(() => window.game?.dialogue?.isActive());
await page.screenshot({ path: join(OUT_DIR, 'step3_dialogue_start.png') });
check('Step3 dialogue active', dialogueActive, true);

// Advance past greeting ("...") → choices menu
await advanceUntilDone(3);
const stateAtChoices = await page.evaluate(() => window.game?.dialogue?._state);
await page.screenshot({ path: join(OUT_DIR, 'step3_choices.png') });
check('Step3 dialogue state', stateAtChoices, 'answering');

// --- Step 4: Choose "Goodbye." (index 2) ---
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(150);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(150);
await page.keyboard.press('Space');
await page.waitForTimeout(400);

await advanceUntilDone(8);
const bagQuestStarted = await page.evaluate(() => window.game?.flags?.has('bag_quest_started'));
await page.screenshot({ path: join(OUT_DIR, 'step4_after_goodbye.png') });
check('Step4 bag_quest_started', bagQuestStarted, true);

// Talk to Hikarigumo again → "Did you find my bag?"
await page.keyboard.press('Space');
await page.waitForTimeout(600);
const talkAgainActive = await page.evaluate(() => window.game?.dialogue?.isActive());
await page.screenshot({ path: join(OUT_DIR, 'step4_talk_again.png') });
check('Step4 talk again active', talkAgainActive, true);
await advanceUntilDone(4);

// --- Step 5: Beach → Shore, pick up bag (x=80 y=200) ---
await navigateToMap('ArrowRight', 'shore');

await moveNear(getItemCenter, 25);
const distToBag = await page.evaluate(() => {
  const g = window.game;
  const dx = (g.player.x + 16) - (g.item.x + 8);
  const dy = (g.player.y + 16) - (g.item.y + 8);
  return Math.round(Math.sqrt(dx * dx + dy * dy));
});
console.log(`   dist to bag: ${distToBag} (threshold 30)`);

await page.keyboard.press('Space');
await page.waitForTimeout(500);
const hasBag = await page.evaluate(() => window.game?.inventory?.has('bag'));
await page.screenshot({ path: join(OUT_DIR, 'step5_bag_pickup.png') });
check('Step5 hasBag', hasBag, true);

// --- Step 6: Shore → Beach, deliver bag ---
await navigateToMap('ArrowLeft', 'beach');

await moveNear(getNpcCenter, 35);
await page.keyboard.press('Space');
await page.waitForTimeout(600);
const bagFoundActive = await page.evaluate(() => window.game?.dialogue?.isActive());
await page.screenshot({ path: join(OUT_DIR, 'step6_bag_found_start.png') });
check('Step6 bagFound dialogue active', bagFoundActive, true);

await advanceUntilDone(10);
const becameCompanions = await page.evaluate(() => window.game?.flags?.has('became_companions'));
await page.screenshot({ path: join(OUT_DIR, 'step6_companions.png') });
check('Step6 became_companions', becameCompanions, true);

// --- Step 7: Walk all maps with Hikarigumo ---
await navigateToMap('ArrowLeft', 'forest');
const forestFollowing = await page.evaluate(() => window.game?.npc?.isFollowing);
await page.screenshot({ path: join(OUT_DIR, 'step7_forest.png') });
check('Step7 forest npc following', forestFollowing, true);

await navigateToMap('ArrowRight', 'beach');
await navigateToMap('ArrowRight', 'shore');
const shoreFollowing = await page.evaluate(() => window.game?.npc?.isFollowing);
await page.screenshot({ path: join(OUT_DIR, 'step7_shore.png') });
check('Step7 shore npc following', shoreFollowing, true);

check('No console errors', consoleErrors.length, 0);
if (consoleErrors.length) console.log('  errors:', JSON.stringify(consoleErrors));

await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
