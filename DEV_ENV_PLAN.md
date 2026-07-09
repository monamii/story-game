# 開発環境の改善計画

方針: 「保存→ブラウザで即確認」のループを最速に保つことを最優先にする。
ビルドステップ（保存してから画面に反映されるまでの工程）を増やす道具は、
1日10分の開発リズムと「完成・公開が最優先」という目的に対してマイナスなので入れない。

## 結論サマリ

| 提案 | 判断 | 理由 |
|---|---|---|
| Live Server（自動リロード） | ✅ 入れる | 効果最大・コストほぼゼロ |
| Prettier（自動整形） | ✅ 入れる | 整形を考える時間が消える |
| jsconfig.json の強化 | ✅ 入れる | 3行足すだけ |
| ESLint | ✅ 入れる（軽量構成） | `!=` のようなバグの芽を自動検出 |
| TypeScript化 | ❌ 今はしない | 下記参照。公開後・次回作で再検討 |
| Vite | ❌ 今はしない | ビルド工程が増える。素のJSはそのままPagesに置ける |
| テスト（Vitest） | ❌ 今はしない | 公開後、DialogueRunner等の純ロジックができたら |
| CI・Git hooks | ❌ しない | 一人開発では過剰 |

---

## ✅ 1. Live Server（VS Code拡張）— 最優先

ES Modules化した時点でローカルサーバが必須になっているが、Live Serverなら
**ファイル保存のたびにブラウザが自動リロード**される。「保存→Alt+Tab→結果が見えている」
になり、10分セッションの体感効率が一番上がる。

- VS Code拡張 `ritwickdey.LiveServer` をインストール
- `index.html` を右クリック → "Open with Live Server"
- 設定不要。npmも不要

## ✅ 2. Prettier（保存時に自動整形）

コードの整形（インデント・改行位置・クォート）を一切考えなくてよくなる。
VS Code拡張 `esbenp.prettier-vscode` を入れ、プロジェクトに以下の2ファイルを置く:

```jsonc
// .vscode/settings.json（このリポジトリ内だけの設定。コミットしてよい）
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

```json
// .prettierrc（デフォルト設定で使う宣言。中身は空でよい）
{}
```

現在のコードはすでにPrettierスタイルとほぼ一致しているので、導入時の差分はほぼ出ないはず。

## ✅ 3. jsconfig.json の強化（3行）

すでに `checkJs: true` が入っていて土台はできている。以下を足す:

```jsonc
{
  "compilerOptions": {
    "checkJs": true,
    "strict": false,
    "noUnusedLocals": true,          // 使っていない変数を検出
    "noFallthroughCasesInSwitch": true,
    "target": "ES2022",              // #private フィールド等を正しく認識させる
    "module": "ES2022"
  },
  "exclude": ["node_modules"]
}
```

`strict: true` は今は上げない（JSDocでの型注釈量が一気に増えて手が止まる）。
リファクタ第2弾が終わって型注釈が揃ってきたら、`strictNullChecks: true` だけ
先に上げてみるのがおすすめ（`onComplete = null` まわりのミスを検出できる）。

## ✅ 4. ESLint（軽量構成）

型チェック（checkJs）が拾えない「書き方のバグの芽」を拾う。実例として、
DialogueSystem.js に `!=`（`!==` でなく）が1箇所あり、これはESLintの `eqeqeq`
ルールなら保存した瞬間に赤線が引かれていた。

セットアップ（1回だけ、5分）:

```
npm init -y
npm install -D eslint @eslint/js globals
```

```js
// eslint.config.js
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    rules: {
      eqeqeq: "error",        // == / != を禁止
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
```

- VS Code拡張 `dbaeumer.vscode-eslint` を入れるとエディタ上に赤線が出る
- `package.json` の scripts に `"lint": "eslint src"` を足しておくと `npm run lint` で一括チェック
- `node_modules/` ができるので `.gitignore`（`node_modules` の1行）を作ってコミット

ルールは上記3つ程度から始める。recommendedが騒がしいと感じたら個別にoffにする。
「ルールを整えること」自体が目的化しないよう、最初の構成のまま当分いじらない。

---

## ❌ TypeScript化を今しない理由

TS自体は良い選択肢で、実務経験もあるので移行自体はいつでもできる。今やらないのは:

1. **すでに8割の恩恵を得ている**: `checkJs` + JSDocで、エディタ上の型チェック・補完・
   リネームは既に効いている。TS化で追加されるのは主に「構文が少し短くなる」こと
2. **ビルドステップが生まれる**: 今は「保存→リロード」だけ。TS化すると
   tsc watch か Vite が常駐する前提になり、環境の故障点が増える
3. **公開がワンステップ遠くなる**: 今は GitHub Pages にファイルを置くだけで公開できる。
   ビルドが挟まると「dist をデプロイする」設定が必要になる
4. **CLAUDE.mdの原則**: 「Vanilla JS + HTML + canvas」「完璧より公開」。
   環境整備はスコープ拡大の一種で、いま時間を使う場所ではない

**再検討のタイミング**: 最初の作品を公開したあと、次の（より大きい）作品を
始めるとき。そのときは Vite + TypeScript をセットで導入するのが定番で、
今のJSDocコメントはほぼそのままTSの型注釈に書き換えられる。

## ❌ Vite を今入れない理由

HMR（リロードなしで反映）は快適だが、Live Serverの自動リロードとの差は
このプロジェクト規模では体感数秒。一方でビルド設定・デプロイ設定という
新しい管理対象が増える。TS化と同じタイミング（次回作）で入れるのが良い。

---

## 導入順序（1セッション=1項目でOK）

1. Live Server 拡張を入れて自動リロードを体験する（5分）
2. Prettier 拡張 + `.vscode/settings.json` + `.prettierrc`、全ファイル保存し直してコミット（10分）
3. jsconfig.json に3行追加、出てきた警告があれば直す（10分）
4. ESLint セットアップ + `.gitignore`、`npm run lint` が通るまで直してコミット（15〜20分）

4つ全部入れても合計1時間弱。リファクタ第2弾（Step 8〜）の前にやっておくと、
以降の書き換え作業全部がこの環境の恩恵を受けられる。
