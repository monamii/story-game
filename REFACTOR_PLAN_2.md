# リファクタリング計画 第2弾

第1弾（Step 0〜7）のレビュー結果と、次に直すべき箇所の計画。
対象コミット: `bb9835c` 時点 + 未コミットの `src/core/Game.js`。

## 第1弾の評価

Entity/Player/Npc/Item、GameMap+Forest/Beach（exitsの宣言化）、Inventory、InputManager
（isDown/consumePressedの分離）、DialogueSystem（UI状態機械）はいずれも計画通りで、
DialogueSystemが「内容を知らないUI部品」になっているのは特に良い。

一方、第1弾計画のうち **未着手なのは以下** で、今回の気になっている点はほぼこれに起因する:

- `content/`（会話データの外出し）→ セリフが `Game.update()` に文字列で埋まったまま
- `core/HUD.js` → メッセージトースト・Press Spaceヒントが `Game.draw()` にベタ書きのまま
- `Player.update()` / `Npc.follow()` → 移動・追従ロジックが `Game.update()` にあるまま
- `Item.drawInWorld()` / `drawIcon()` → カバンの描画コードが Game と Inventory に**重複**している

つまり「Gameクラスがまだ何でも屋」という状態。第2弾はこれを解消する。

---

## Q1. storyPhase と gameState は1つのStateにまとめるべき？

**まとめない方がよい。この2つは種類の違う状態。**

| | dialogue の state | storyPhase |
|---|---|---|
| 意味 | 「今この瞬間、画面が何モードか」（UIモード） | 「物語がどこまで進んだか」（進行度） |
| 寿命 | 一時的。会話が終われば idle に戻る | 永続的。セーブデータに入るもの |
| 遷移 | 状態機械（talking→asking→…） | 一方向に進む・積み重なる |

これを1つのenumに合成すると「talking かつ bag入手済み」のような組み合わせが
状態数の爆発を起こし、かえってバグの温床になる。**UIモードと進行フラグを分けて持つのは
ゲーム開発の定石**（RPGツクールの「スイッチ」、UNDERTALEの内部フラグも同じ考え方）。

ただし、**storyPhase を1つの数値で持つのはやめるべき**。今の実装は
`0, 1, 3`（2が欠番）というマジックナンバーで、以下の弱点がある:

- 数値の大小に意味を持たせている（`storyPhase >= 3`）ので、途中に段階を挿入できない
- 並行する進行（例: 別NPCのクエスト）を表現できない
- 読んでも意味が分からない（コメント頼み）

### 推奨: 名前付きストーリーフラグ（`StoryFlags`）

「簡単にフラグを増やせて、バグが出にくい」構造の定番はこれ:

```js
// src/core/StoryFlags.js

/** ストーリー進行フラグの定義。増やすときはここに1行足すだけ。 @enum {string} */
export const StoryFlag = Object.freeze({
  BAG_QUEST_STARTED: "bag_quest_started", // ヒカリグモに膝の怪我を打ち明けられた
  BECAME_COMPANIONS: "became_companions", // カバンを届けて仲間になった
});

export class StoryFlags {
  #flags = new Set();

  /** @param {string} flag */
  set(flag) {
    this.#flags.add(flag);
  }

  /** @param {string} flag @returns {boolean} */
  has(flag) {
    return this.#flags.has(flag);
  }

  // 将来セーブ機能を作るときは this.#flags を配列にして JSON.stringify するだけ
}
```

使う側の対応表:

| 現在 | 変更後 |
|---|---|
| `storyPhase === 0` | `!flags.has(StoryFlag.BAG_QUEST_STARTED)` |
| `storyPhase = 1` | `flags.set(StoryFlag.BAG_QUEST_STARTED)` |
| `storyPhase === 1` | `flags.has(BAG_QUEST_STARTED) && !flags.has(BECAME_COMPANIONS)` |
| `storyPhase = 3` / `>= 3` | `flags.set(...)` / `flags.has(StoryFlag.BECAME_COMPANIONS)` |

この方式が強い理由:
- フラグ追加＝定数1行。番号の振り直し・欠番が発生しない
- 条件が `flags.has(BECAME_COMPANIONS)` と自然文で読める
- フラグ同士が独立なので、クエストAとBが並行しても干渉しない
- フラグ名が `StoryFlag.` 経由なので、typoは `checkJs` が検出してくれる
  （素の文字列 `"became_companion"`(sなし) のようなバグを型チェックで防げる）

---

## Q2. Stateは文字列でなくENUMにすべき？

**その通り。ただしJSにenum構文はないので、`Object.freeze` + JSDocの `@enum` が定番。**

```js
// src/dialogue/DialogueSystem.js の先頭

/** @enum {string} */
export const DialogueState = Object.freeze({
  IDLE: "idle",
  TALKING: "talking",
  ASKING: "asking",
  ANSWERING: "answering",
});
```

使用箇所は `this._state = DialogueState.TALKING`、比較は
`this._state === DialogueState.ASKING` に置き換える。

- 値を数値でなく文字列のままにしておくのはおすすめ（`console.log` したとき
  `"asking"` と出て即座に分かる。数値enumだと `2` が出て逆に困る）
- `jsconfig.json` の `checkJs` が効いているので、`DialogueState.ASKNG` のような
  typoはエディタが即座に赤線を引く。素の文字列比較 `=== "askng"` は誰も気づけない
- マップIDも同様に enum 化する: `this.currentMap = 1` → `MapId.FOREST`。
  `maps/GameMap.js` あたりに `export const MapId = Object.freeze({ FOREST: "forest", BEACH: "beach" })`
  を置き、`Game.maps` のキーと `checkExit` の戻り値をこれに揃える

---

## Q3. セリフがソースコードに散らばっている問題（今回の本丸）

`Game.update()` の対話処理は現在、**4段ネストのコールバック**の中にセリフが直書きされている
（`startLines` → `startMenu` → `onSelect` → `startLines`…）。これはご指摘の
「深い分岐」「巨大メソッド」の主犯でもあるので、**データ駆動の会話スクリプト**に置き換えて
両方まとめて解決する。市販ゲームの会話システム（Ink、Yarn Spinner等）もこの
「会話＝ノードのグラフ＋それを再生するランナー」という構造。

### content/hikarigumo.js（会話データ。セリフはすべてここに集約）

```js
import { StoryFlag } from "../core/StoryFlags.js";

// 会話ノード。lines を表示し終えたら setFlags を立てて next へ進む。
// menu ノードは選択肢を出し、選ばれた項目の answer(ページ送り) か next(別ノード) へ。
export const hikarigumoDialogue = {
  greeting: {
    lines: ["..."],
    next: "questions",
  },
  questions: {
    menu: [
      {
        label: "Who are you?",
        answer:
          "I am Hikarigumo. I am from the cloud people. We live where the sky turns white and soft. I have never been down here before.",
      },
      {
        label: "Where did you come from?",
        answer:
          "I fell from up there, past the clouds. There is a town up there — that is where I am from. I was looking over the edge and then... I need to find a way back.",
      },
      { label: "Goodbye.", next: "goodbye" },
    ],
  },
  goodbye: {
    lines: [
      "Ah...",
      "My knee. I hurt it when I landed.",
      "I have a bandaid in my bag...",
      "...Wait. Where is my bag?",
      "I had it when I fell. It must be somewhere on the beach.",
      "Bakezaru: I will find it.",
    ],
    setFlags: [StoryFlag.BAG_QUEST_STARTED],
  },
  goodbyeAgain: {
    lines: [
      "You are still looking?",
      "Take your time. I am not going anywhere like this.",
    ],
  },
  bagNotFound: {
    lines: ["Did you find my bag?", "My knee really hurts..."],
  },
  bagFound: {
    lines: [
      "That is it! That is my bag!",
      "Thank you, Bakezaru.",
      "...",
      "Bandaid on. There.",
      "Good as new.",
      "Hey... do you want to walk together for a while?",
      "I do not know where I am going. But that is okay.",
    ],
    setFlags: [StoryFlag.BECAME_COMPANIONS],
  },
};

// 話しかけた瞬間の状況から、どのノードで会話を始めるかを決める。
// 「状況→入口ノード」の判断もセリフと同じファイルに置き、ゲーム本体から追い出す。
export function selectHikarigumoNode(flags, inventory) {
  if (
    flags.has(StoryFlag.BAG_QUEST_STARTED) &&
    !flags.has(StoryFlag.BECAME_COMPANIONS)
  ) {
    return inventory.has("bag") ? "bagFound" : "bagNotFound";
  }
  return "greeting";
}
```

注意点が1つ: 現在の挙動では「Goodbye.」の結果がstoryPhaseで分岐する
（初回=膝の告白 / クエスト開始後=You are still looking?）。これはmenu項目の `next` を
状況で切り替える必要があるので、menu項目に `next: (flags) => flags.has(...) ? "goodbyeAgain" : "goodbye"`
のように**関数も許す**か、`condition` フィールド付きの項目を2つ並べるかのどちらかにする。
関数を許す方が記述量が少なくおすすめ（データファイル内に閉じているので害も小さい）。

### dialogue/DialogueRunner.js（ノードを解釈してDialogueSystemを動かす）

```js
export class DialogueRunner {
  constructor(dialogueSystem, flags) { ... }

  /** @param {object} nodes 会話データ @param {string} startId 開始ノード */
  start(nodes, startId) { ... }
}
```

- `lines` ノード → `dialogueSystem.startLines(node.lines, () => 完了時にsetFlagsを立ててnextへ)`
- `menu` ノード → `dialogueSystem.startMenu(...)`、`answer` 持ちの選択肢は
  `showAnswer` でページ送りして menu に戻る
- ノードのデータ形式を知っているのはRunnerだけ。DialogueSystemは今のまま変更ほぼ不要

これで `Game.update()` の対話部分は最終的にこうなる:

```js
if (this.player.isNear(this.npc)) {
  const nodeId = selectHikarigumoNode(this.flags, this.inventory);
  this.runner.start(hikarigumoDialogue, nodeId);
}
```

**4段ネスト約60行 → 3行。** 次のNPCを足すときは `content/` にファイルを1つ足し、
NPCとデータを紐付けるだけ。エンジン側（DialogueSystem/Runner）は触らない。

---

## Q4. 分岐が深い・1メソッドが大きい問題

上のQ3でネストの主犯（会話コールバック地獄）は消えるが、残りも整理する。
方針は「**Gameは各システムを呼ぶだけの指揮者にする**」。

### Game.update() の分解（現在 約120行 → 各10行前後のメソッド5つ）

```js
update() {
  this.dialogue.handleInput(this.input);
  if (!this.dialogue.isActive()) {
    this.player.update(this.input, this.canvas);   // 移動+境界clamp → Player へ移設
    this.handleMapTransition();                     // checkExit と仲間のワープ
    this.handleInteraction();                       // Space押下→会話 or アイテム取得
  }
  this.npc.update(this.player, this.flags);         // 追従ロジック → Npc.update へ移設
  this.hud.update();                                // messageTimer 減算 → HUD へ移設
}
```

- `Player.update(input, canvas)`: Arrowキーでの移動とclamp（第1弾計画にあった未実施分）
- `Npc.update(player, flags)`: `BECAME_COMPANIONS` が立っていたら追従。
  距離計算はすでに `Entity.isNear` があるので `if (!this.isNear(player, 40))` で書ける

### Game.draw() の分解

- **HUD クラスを新設**（第1弾計画の未実施分）: メッセージトースト
  （`message`/`messageTimer`）と「Press Space」ヒントを移設。
  `hud.showMessage("You found ...", 180)` のようなAPIにする
- ついでに直る潜在バグ: 現在ピックアップメッセージの描画が
  `if (currentMap === 2 || storyPhase >= 3)` ブロックの**中**にあるので、
  将来フォレスト側でアイテムを拾うとメッセージが表示されない。
  トーストは全画面共通UIなのでHUDに移せば自然に解消する
- **Item に描画を持たせる**: `drawInWorld(ctx)` と `drawIcon(ctx, x, y)`。
  現在カバンの絵（#8B4513の矩形+#DAA520の持ち手）が `Game.draw` と
  `Inventory.drawPanel` に**コピペ重複**していて、絵を変えると2箇所直しになる。
  Inventory は `itemIds` でなく `Item` そのものを保持するように変え、
  パネル描画は `item.drawIcon(...)` を呼ぶだけにする
- **NPCとアイテムの表示可否はマップに寄せる**: `currentMap === 2 || storyPhase >= 3`
  という判定は「ビーチにヒカリグモとカバンが居る」+「仲間になったら一緒に移動」の合成。
  マップが `npcs`/`items` の配列を持ち、`map.draw(ctx)` が背景→アイテム→NPCを描く形にすると、
  Game.draw はループを回すだけになり、マップ追加時に Game を触らずに済む
  （仲間NPCだけは「マップ所属でなくプレイヤー所属」なので Game 直下に残してよい）

### 細かい指摘（ついでに直すとよいもの）

- `DialogueSystem.isActive()` の `!=` は `!==` に（プロジェクト内で唯一の緩い比較）
- `Game.js` の `storyPhase` のコメント `// 0:questions, 1: find bag, 3: companion` は
  2が欠番になっている時点で数値方式の限界が出ている（StoryFlags移行で消える）
- `buildLines` が `ctx.font` を書き換えたまま戻さないので、フォント設定は
  「描画直前に毎回セットする」流儀で統一されているか意識しておく（現状は各draw内で
  セットしているので実害なし）

---

## やらないこと（今はまだ不要）

ゲーム開発でよく聞く以下のパターンは、**この規模では過剰**なので導入しない。
「完璧より公開」の原則で、必要になったときに導入する:

- **ECS（Entity Component System）**: エンティティが数百個・振る舞いの組み合わせが
  爆発してから。今のクラス継承で十分
- **イベントバス / Observer**: システム間の依存が絡まってから。今はGameが指揮者で足りる
- **シーンマネージャ**: タイトル画面・エンディング画面を作るときに導入
  （その時はDialogueStateと同じ要領で `Scene` enumから始めれば十分）
- **deltaTime（可変フレームレート対応）**: 公開後、動作報告で問題が出たら

---

## 移行手順（第2弾）

各ステップ後に「歩く→話す→選択肢→カバン→マップ跨ぎ→追従」を一通り確認してコミット。

1. **Step 8**: `DialogueState` / `MapId` の enum 化（挙動変化なし、置換のみ）
2. **Step 9**: `StoryFlags` クラスを作り、`storyPhase` を全廃
3. **Step 10**: `HUD` クラスを新設し、message/messageTimer/ヒント描画を移設
4. **Step 11**: `Player.update` / `Npc.update` を作り、移動・追従を Game から移設
5. **Step 12**: `Item.drawInWorld` / `drawIcon` を作り、描画の重複を解消。
   Inventory を Item 保持に変更
6. **Step 13**（本丸）: `content/hikarigumo.js` + `DialogueRunner` を作り、
   Game.update から会話コールバックとセリフを全撤去
7. **Step 14**: マップに `npcs`/`items` を持たせ、Game.draw をループ化（任意。
   マップを3つ目に増やす直前でも良い）

Step 13 が終わった時点で、当初の目的である
「新しいNPC・新しい会話は content/ に1ファイル足すだけ」が達成される。
