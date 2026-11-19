# npm への公開の手順

公開は、あなた（持ち主）の npm のアカウントで行います。Claude からはできません。

## はじめての公開（v0.1.0）

1. **main に最新のものがあるか確かめる**（PR をマージしたあと）

   ```bash
   git checkout main
   git pull
   ```

2. **部品を入れ直して、確かめる**

   ```bash
   npm ci
   npm run typecheck
   npm test
   npm run build
   ```

   `dist/` に `index.js`・`index.d.ts`・`style.css` ができていれば OK。

3. **npm に入るファイルを見る**（実際には公開しない「ためし」）

   ```bash
   npm publish --dry-run --access public
   ```

   出てくる一覧が `dist/`・`README.md`・`LICENSE`・`package.json` だけなら OK。

4. **npm にログインする**（はじめてのときだけ。ブラウザが開きます）

   ```bash
   npm login
   ```

   `npm whoami` で、自分の名前（`shiodome47`）が出れば OK。

5. **公開する**

   ```bash
   npm publish --access public
   ```

   - `@shiodome47/…` のように、名前の頭に `@持ち主/` が付いたパッケージ（スコープ付きパッケージ）は、
     何も付けないと「有料の非公開パッケージ」として出そうとして、失敗します。
     **`--access public`（だれでも使える公開）を必ず付けます。** 2 回目からは付けなくても公開のままですが、付けておいても困りません。
   - 公開の前に、`prepublishOnly`（型の確かめ・テスト・ビルド）が自動で動きます。どれかが失敗したら公開されません。
   - 2 段階認証を使っていると、ワンタイムパスワードを聞かれます。

6. **確かめる**: https://www.npmjs.com/package/@shiodome47/video-zoom が開ければ公開できています。

## 2 回目からの公開（直したとき）

1. 版を上げる（どれか 1 つ）。`package.json` の `version` が変わり、コミットとタグもできます。

   ```bash
   npm version patch   # 0.1.0 → 0.1.1（まちがいを直しただけ）
   npm version minor   # 0.1.0 → 0.2.0（できることを足した）
   npm version major   # 0.1.0 → 1.0.0（使い方が変わり、使う側の書き換えが要る）
   ```

2. 公開して、コミットとタグを GitHub に送る。

   ```bash
   npm publish --access public
   git push --follow-tags
   ```

一度公開した版の番号は、消しても二度と使えません。まちがえたら、版を上げて出し直します。

## 見本のページ（Vercel）

1. Vercel で「Add New… → Project」から、GitHub の `shiodome47/video-zoom` を選ぶ
2. 設定はリポジトリの `vercel.json` に書いてあるので、そのまま「Deploy」
   （ビルド: `npm run build:demo`、出力: `examples/web/dist`）
3. できた URL を、README のいちばん上の「見本」に書く
