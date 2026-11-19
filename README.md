# @shiodome47/video-zoom

動画（**YouTube の埋め込みも**）を、2 本指で拡大・移動できる React の部品です。
ページ全体や、まわりの文字は動かさず、**動画だけ**が大きくなります。

- 見本: https://video-zoom-ruddy.vercel.app/ （ふつうの動画と YouTube。スマホで開いてピンチしてみてください）
- English: [see below](#english)

## できること

- スマホ: 2 本指でピンチ、拡大中は 1 本指で移動、ダブルタップで拡大／等倍
- PC: トラックパッドのピンチ（Ctrl + ホイール）、右上の ＋ − ボタン
- **iPhone の Safari でも、ピンチでページ全体が拡大されない**
- **YouTube の埋め込み（iframe）にも使える**。iframe の上の指の操作は、ふつうは YouTube（とブラウザ）に取られて、
  ピンチするとページ全体が拡大されてしまいます。この部品は動画の上に透明な面を置いて、指の操作をこちらで受けます。
  1 回タップで `onTap`（再生・一時停止など）。そのあと 3 秒は、YouTube のボタンがある**下の帯だけ**指を YouTube に通します
- 枠を縦に広げる（標準・中・大）。拡大の倍率とは別
- 右上のボタンは、触っていないと隠れる
- ボタンの文言は日本語が既定。英語（`EN_LABELS`）や、自分の言葉に差し替えられる

## 入れ方

```bash
npm install @shiodome47/video-zoom
```

React 18 が必要です（`peerDependencies`。使う側のアプリに入っている React を使います）。
ほかに入れるものはありません（アイコンも部品の中に持っています）。

## 使い方

```tsx
import { useState } from 'react'
import { ZoomableVideo, nextFrame, type VideoFrame } from '@shiodome47/video-zoom'
import '@shiodome47/video-zoom/style.css' // 見た目（1 回だけ読み込む）

export function Player({ src }: { src: string }) {
  const [frame, setFrame] = useState<VideoFrame>('normal')
  return (
    <ZoomableVideo resetKey={src} expandable frame={frame} onCycleFrame={() => setFrame(nextFrame)}>
      <video src={src} style={{ width: '100%', height: '100%' }} playsInline />
    </ZoomableVideo>
  )
}
```

### YouTube の埋め込み

`iframe` を付けます。透明な面がタップを受けるので、再生・一時停止は `onTap` で自分で行います
（YouTube IFrame API の `playVideo()`・`pauseVideo()` など）。
再生の状態が変わったら `activityKey` を変えると、右上のボタンを一度出します。

```tsx
<ZoomableVideo resetKey={videoId} iframe onTap={togglePlay} activityKey={stateTick}>
  <div ref={playerBoxRef} style={{ width: '100%', height: '100%' }} />
</ZoomableVideo>
```

まとまった例は [`examples/web/src/App.tsx`](examples/web/src/App.tsx) にあります。

## props

| 名前 | 型 | 説明 |
|---|---|---|
| `children` | `ReactNode` | 動画（`<video>` や YouTube の iframe を入れた箱）。枠いっぱいに広げてください |
| `className` / `style` | | いちばん外の枠に付く。大きさ（幅・高さ）はここで決める |
| `resetKey` | `string` | 変わったら等倍に戻す（動画を切り替えたとき） |
| `iframe` | `boolean` | 中身が iframe（YouTube）のとき |
| `onTap` | `() => void` | 1 回タップしたとき（ダブルタップでないと分かってから呼ぶ） |
| `expandable` | `boolean` | 枠を縦に広げられるようにする。標準は 16:9 の枠になる |
| `frame` | `'normal' \| 'medium' \| 'large'` | 枠の大きさ（`expandable` のとき）。使う側で覚えておく |
| `onCycleFrame` | `() => void` | 「枠の大きさ」ボタンを押したとき。無ければボタンを出さない |
| `activityKey` | `number` | 変わるたびに右上のボタンを出す |
| `labels` | `Partial<VideoZoomLabels>` | ボタンの文言。変えたいものだけ渡す |

### ボタンの文言を変える

```tsx
import { EN_LABELS } from '@shiodome47/video-zoom'

<ZoomableVideo labels={EN_LABELS}>…</ZoomableVideo>             // 英語
<ZoomableVideo labels={{ zoomIn: 'ズーム' }}>…</ZoomableVideo>   // 1 つだけ変える（残りは日本語）
```

| キー | 既定（日本語） |
|---|---|
| `zoomIn` / `zoomInTitle` | 動画を拡大 / 動画を拡大（スマホはピンチ、PC はトラックパッドのピンチでも） |
| `zoomOut` | 動画を縮小 |
| `reset(scale)` / `resetTitle` | `2.5× 戻す` / 等倍に戻す（ダブルタップでも戻せます） |
| `frameToggle(current, next)` / `frameToggleTitle` | 動画の枠の大きさ（今: 標準。押すと中） / 動画の枠を縦に広げる（標準 → 中 → 大） |
| `frames` | `{ normal: '標準', medium: '中', large: '大' }` |

## 見た目（CSS）

`@shiodome47/video-zoom/style.css` は、部品の枠（`.video-zoom`）の**中だけ**に効きます。使う側のページの見た目は変えません。
Tailwind などは要りません。

色や大きさは、CSS の変数で変えられます。

```css
.video-zoom {
  --vz-accent: rgba(37, 99, 235, 0.9); /* ボタンの色 */
  --vz-accent-hover: #3b82f6;          /* マウスを乗せたときの色 */
  --vz-text: #fff;                     /* ボタンの文字・アイコンの色 */
  --vz-radius: 0.375rem;               /* ボタンの角の丸み */
  --vz-gap: 0.375rem;                  /* ボタンどうしの間 */
  --vz-inset: 0.5rem;                  /* 枠の右上からボタンまでの間 */
  --vz-icon-size: 1.25rem;             /* アイコンの大きさ */
  --vz-pass-band: 3.5rem;              /* YouTube で指を通す下の帯の高さ */
}
```

いちばん外の枠の決まり（`position: relative` など）は「強さ」を 0 にしてあるので、`className` で渡したクラスがいつも勝ちます。

## 計算だけ使う

拡大・移動の計算は、画面の部品とは別の関数になっています。

```ts
import { zoomAt, panBy, clampZoom, ZOOM_IDENTITY } from '@shiodome47/video-zoom'
```

## 開発

```bash
npm install
npm test          # テスト（vitest）
npm run typecheck # 型の確かめ
npm run build     # dist/ を作る（JS・型・style.css）
npm run dev       # 見本のページを手元で開く
```

npm への公開の手順は [PUBLISHING.md](PUBLISHING.md) にあります。

## ライセンス

MIT。ボタンのアイコンは [Lucide](https://lucide.dev)（ISC）と同じ形です（[LICENSE](LICENSE)）。

---

## English

Demo: https://video-zoom-ruddy.vercel.app/

A React frame that lets users pinch-zoom and pan a video — **including YouTube embeds** — without zooming the whole page (works on iPhone Safari).

```bash
npm install @shiodome47/video-zoom
```

```tsx
import { ZoomableVideo, EN_LABELS } from '@shiodome47/video-zoom'
import '@shiodome47/video-zoom/style.css'

<ZoomableVideo labels={EN_LABELS} resetKey={src}>
  <video src={src} style={{ width: '100%', height: '100%' }} playsInline />
</ZoomableVideo>
```

- Pinch with two fingers, drag with one finger while zoomed, double-tap to zoom in / reset. Trackpad pinch and +/− buttons on desktop.
- For YouTube, pass `iframe` and handle play/pause in `onTap`: a transparent layer receives touches so the browser doesn't zoom the page; after a tap, the bottom strip lets touches through to YouTube's own controls for 3 seconds.
- Button labels default to Japanese; pass `labels={EN_LABELS}` or any partial override.
- The stylesheet only affects elements inside `.video-zoom`. Customize with the `--vz-*` CSS variables.
- Peer dependency: React 18. MIT licensed.
