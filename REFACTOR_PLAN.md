# main.js リファクタリング計画

対象: 現在594行の `main.js`（グローバル変数 + 巨大な keydown ハンドラ + update/draw 関数群）を、
機能ごとのクラス/モジュールに分割し、「マップやキャラを増やすときはファイルを1つ足すだけ」にする。

ビルドツールやTypeScriptは導入しない。ES Modules（`<script type="module">`）+ JSDoc型注釈
（`jsconfig.json` の `checkJs` を活用）だけで多ファイル化する。過剰な抽象化はしない。

## 前提: ES Modules化について
- `index.html` の `<script src="main.js">` を `<script type="module" src="src/main.js">` に変更する。
- ES Modulesは `file://` で開くとCORSエラーになるので、VS Codeの Live Server 拡張か
  `npx serve` などローカルサーバー経由で開く必要がある（すでに何かのサーバーで確認しているなら影響なし）。

## 全体像（フォルダ構成案）

```
src/
  main.js                 // エントリポイント。Gameを作ってstartするだけ（数行）
  core/
    Game.js               // 全体のオーケストレーター（update/draw ループ、状態の受け皿）
    InputManager.js        // キー入力の管理
    TextUtils.js            // buildLines（テキスト折り返し）
    HUD.js                 // メッセージトースト・インベントリパネル・「Press Space」ヒント
  entities/
    Entity.js               // x, y, width, height の基底クラス + isNear
    Player.js
    Npc.js
    Item.js
  maps/
    GameMap.js              // マップの基底クラス（背景・出口・配置エンティティ）
    ForestMap.js
    BeachMap.js
  dialogue/
    DialogueSystem.js       // 会話/選択肢/ページ送りの状態機械（内容には依存しない）
  content/
    hikarigumoConversation.js // ヒカリグモの会話データ（セリフ・質問・分岐）
  sprites/
    bakezaru.js             // drawBakezaru を移設
    hikarigumo.js            // drawHikarigumo を移設
  inventory/
    Inventory.js
```

## 各クラスの役割

### `entities/Entity.js`
- `x, y, width, height` を持つ基底クラス。
- `isNear(other, distance)` を移設（現状の`isNear`関数はプレイヤー/NPC/アイテムどれにも使うので、
  Entity同士のメソッドにするのが自然）。

### `entities/Player.js extends Entity`
- `speed` を持つ。
- `update(input, bounds)`: 現状の `update()` 内の移動処理（ArrowキーでX/Y更新 + canvas境界clamp）をここに。
- `draw(ctx)`: `drawBakezaru` を呼ぶだけ。

### `entities/Npc.js extends Entity`
- `name`, スプライト描画関数を持つ。
- `followTarget(target, speed)`: storyPhase3の「プレイヤーを追いかける」ロジック（distance計算 + 徐々に接近）。
- `draw(ctx)`。
- 会話データ（questions, storyPhase別のセリフ）は後述のDialogueSystem/contentに持たせ、
  Npc自体は「誰と何のスプライトで喋るか」だけを知っていればよい。

### `entities/Item.js extends Entity`
- `id`, `collected` フラグ。
- `drawInWorld(ctx)`, `drawIcon(ctx, x, y)`（インベントリパネル用の小さい描画）。
- 今は「カバン」だけだが、この形にしておけばアイテム追加時はインスタンスを増やすだけで済む。

### `maps/GameMap.js`（基底） / `ForestMap.js` / `BeachMap.js`
- `drawBackground(ctx)`: 現状 `draw()` 内の `if (currentMap === 1) {...} else {...}` の中身をそれぞれ移設。
- `exits`: `[{ edge: 'right', targetMapId: 2, spawnX: 10 }, ...]` のような宣言的な配列。
  現状ハードコードされている「右端に着いたらマップ2へ」「マップ2の左端に着いたらマップ1へ」を
  データ化することで、マップが3つ以上に増えても`GameMap`側のロジックは変えずに済む。
- `entities`: そのマップに配置するnpc/itemの配列（今回で言うと `beach` マップにnpcとitemがいる）。
- **新しいマップを増やすときは `maps/` に1ファイル追加して `GameMap` を継承するだけ**、というのは
  最初のアイデア通りで、これがそのまま実現できる。

### `core/InputManager.js`
- `keys` のフラットな状態を保持し、`isDown(key)` で継続的な移動判定に使う（Player.update用）。
- 加えて `consumePressed(key)`: 物理的な1回のkeydownにつき1回だけtrueを返す仕組みを用意する。
  現状は「歩行中のArrow=連続移動」「メニュー中のArrow=1回だけカーソル移動」が
  同じ `keydown` イベント内でstate分岐しており、今後モードが増えるほど分岐が複雑化しやすい。
  継続入力と単発入力を分けておくと、DialogueSystemやメニュー機能を足すときに事故りにくい。

### `dialogue/DialogueSystem.js`
- 現状 `gameState`(`talking`/`asking`/`answering`) と、`dialogueLines/dialogueIndex/questions/
  visited/answerLines/answerPage/selectedOption/dialogueCallback` をすべてここに集約。
- 公開インターフェース例:
  - `startLines(lines, onComplete)` — 1行ずつSpaceで送る会話
  - `startMenu(options, onSelect)` — 選択肢メニュー
  - `startPaged(text)` — 長文を2行ずつページ送り
  - `handleInput(input)` — Space/Arrowを受けて上記の状態を進める
  - `isActive()` — 会話中かどうか（`Game`はこれを見てPlayerの移動を止めるかどうか判断するだけでよい）
  - `draw(ctx)` — 吹き出し/メニュー/ページ送りの描画（現状`draw()`後半の3つの`else if`ブロック）
- **これが今回の一番のおすすめ変更点**（後述）。

### `content/hikarigumoConversation.js`
- `questions`配列と、`storyPhase`ごとのセリフ・遷移先を「データ」として書き出す。
- 例: `{ phase: 0, onTalk: () => dialogueSystem.startMenu(questions, ...) }`
  `{ phase: 1, itemCollected: false, lines: [...], next: 1 }` のような形。
- ゲームロジック（DialogueSystem, Npc）とストーリー本文を分離することで、
  今後セリフを直す・NPCを増やすときにmain.js相当を触らずに済む。UNDERTALEらしい
  「会話とキャラでプレイヤーの感情を動かす」ゲームなら、ここが一番育つ場所になるはず。

### `inventory/Inventory.js`
- `items: Item[]`, `add(item)`, `has(id)`, `drawPanel(ctx)`。
- 現状「カバンを持っているかどうか」の1bitがベタ書きだが、Inventoryクラスにしておけば
  アイテムが増えてもパネルの描画ロジックを1箇所直すだけで済む。

### `core/HUD.js`
- メッセージトースト（`message`/`messageTimer`）、「Press Space」ヒント表示、
  インベントリパネルの外枠描画など、会話ボックス以外のUI要素をまとめる。

### `core/Game.js`
- `canvas`, `ctx`, `player`, `currentMap`（マップIDからGameMapインスタンスを引くレジストリ）,
  `inputManager`, `dialogueSystem`, `inventory`, `message/messageTimer`, `storyPhase` を保持。
- `update()`, `draw()`, `start()`（`requestAnimationFrame`ループ）。
- `main.js` は `new Game(document.getElementById("game")).start();` くらいまで縮む。

## 最初の提案からさらにおすすめしたい点

1. **DialogueSystemを「内容に依存しない状態機械」として切り出す**
   今のコードは「ヒカリグモの会話」と「会話UIの進め方（1行ずつ送る/メニュー選択/ページ送り）」が
   混ざっている。後者を汎用化しておくと、次に別のNPCを足したときにDialogueSystemは一切変更せず、
   `content/`に新しいセリフデータを1ファイル足すだけで済む。ここが一番効くリファクタリング。

2. **マップの出口(exits)を宣言的データにする**
   `currentMap === 1 && player.x >= canvas.width - player.width` のような境界判定を
   `GameMap`に`exits`配列として持たせておくと、マップが3つ以上・上下方向の移動が増えても
   分岐が増殖しない。

3. **InputManagerで「押しっぱなし」と「1回押し」を分離する**
   現状すでに「歩行中は連続移動、メニュー中は単発移動」が同じイベントハンドラで
   混在しており、今後モード（例: インベントリ画面を開く等）が増えるほど壊れやすい箇所。
   ここだけ早めに整理しておくと後が楽。

4. **StatusManager的なものは今はまだ作らない**
   `storyPhase`は今のところ1つのnumberで十分機能している。フラグが増えてきたら
   （例: 複数NPCの好感度、複数の解決済みイベント等）そのタイミングで
   `StoryFlags`のような小さいクラスに昇格させれば良く、今は`Game`のフィールドのままでOK。
   先回りして作ると「使われない骨組み」になりがちなので後回しにする。

## 移行手順（小さいステップに分割）

一気に書き換えず、各ステップごとに**動作確認してからコミット**する想定。

1. **Step 0**: `src/`フォルダを作り、`main.js`を`src/main.js`に移動。`index.html`を
   `type="module"`に変更。中身は一切変えずに動くことだけ確認。
2. **Step 1**: `TextUtils.buildLines`と`Entity.isNear`を切り出す。純粋関数の移動のみ、挙動変化なし。
3. **Step 2**: `drawBakezaru`/`drawHikarigumo`を`sprites/`に移設。これも純粋な移動。
4. **Step 3**: `Entity`/`Player`/`Npc`/`Item`クラスを作り、オブジェクトリテラルを置き換える。
   移動・接近判定が今まで通り動くか確認。
5. **Step 4**: `GameMap`/`ForestMap`/`BeachMap`を作り、背景描画とマップ切り替え判定を移設。
6. **Step 5**: `Inventory`クラスを作り、`item.collected`直参照をなくす。
7. **Step 6**: `InputManager`を作り、`keys`グローバルとイベントリスナーを置き換える。
8. **Step 7**（一番大きい）: `DialogueSystem`と`content/hikarigumoConversation.js`を作り、
   keydownハンドラの`talking`/`asking`/`answering`分岐をすべて移設。
9. **Step 8**: 全部を`Game`クラスにまとめ、`main.js`を数行にする。

各ステップは大体30分前後で収まるサイズを想定。1日に1ステップずつでも十分進む。
Step 3以降は「歩く→話しかける→選択肢を選ぶ→カバンを拾う→マップを跨ぐ→追従」を
毎回ひととおり触って壊れていないか確認しながら進めるのがおすすめ。
