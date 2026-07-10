# Verify skill — story-game

## How to run

1. Start the dev server in background:
   ```
   cd story-game && npx --yes serve -l 8384 .
   ```
2. Confirm it responds: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8384/` → 200
3. Run the script:
   ```
   cd story-game && npm run verify
   ```

## What it tests

Drives the full story scenario via headless Playwright (Chromium):

1. Page loads in Forest, no console errors
2. Navigate Forest → Beach → Shore
3. Return to Beach, approach Hikarigumo, start dialogue
4. Select "Goodbye." → `bag_quest_started` flag set; talk again → "Did you find my bag?"
5. Navigate to Shore, pick up bag → `inventory.has('bag')` = true
6. Return to Beach, talk to Hikarigumo → `became_companions` flag set
7. Walk Forest → Beach → Shore with Hikarigumo following

## Key notes

- `window.game` is the debug hook set in `src/main.js` (`window.game = game`)
- `navigateToMap(key, targetMap)` holds the key and releases the moment `currentMap` matches — prevents zipping through multiple maps
- `moveNear(getTarget, threshold)` taps keys in both axes toward target center
- `advanceUntilDone(maxPresses)` presses Space only while `dialogue.isActive()` — stops immediately to prevent re-triggering greeting after dialogue ends
- All `window.game` errors in IDE are false positives (browser context inside `page.evaluate`)
- Player speed = 3px/frame; NPC at (340, 230); item (bag) at (80, 200); player spawns at y=30
- Playwright must be installed: `npm install -D playwright` (already in devDependencies)
