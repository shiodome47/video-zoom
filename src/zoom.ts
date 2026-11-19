/**
 * 動画の拡大（ピンチ・ドラッグ）の計算。画面の部品とは切り離した、純粋な関数だけ。
 *
 * 表示: 画面上の位置 = 元の位置 × scale + (x, y)（左上を基準に拡大）
 */
export interface ZoomState {
  scale: number
  x: number
  y: number
}

export const MIN_SCALE = 1
export const MAX_SCALE = 5
export const ZOOM_IDENTITY: ZoomState = { scale: 1, x: 0, y: 0 }

/**
 * 動画の外に余白が出ないように、ずらす量を枠の中に収める。
 * 中身（動画）が枠より小さい向きは、枠のまん中に置く（枠を縦に広げているとき、等倍の動画は上下まん中に出る）。
 * contentW / contentH を省くと、中身は枠と同じ大きさ。
 */
export function clampZoom(z: ZoomState, width: number, height: number, contentW = width, contentH = height): ZoomState {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, z.scale))
  const fit = (pos: number, frame: number, content: number) => {
    const size = content * scale
    if (size <= frame + 0.5) return (frame - size) / 2
    return Math.min(0, Math.max(frame - size, pos))
  }
  const x = fit(z.x, width, contentW)
  const y = fit(z.y, height, contentH)
  return { scale, x: Math.abs(x) < 1e-9 ? 0 : x, y: Math.abs(y) < 1e-9 ? 0 : y }
}

/** 画面上の点 (cx, cy) を動かさずに、倍率を nextScale にする（ピンチの中心・ダブルタップの位置） */
export function zoomAt(
  z: ZoomState,
  nextScale: number,
  cx: number,
  cy: number,
  width: number,
  height: number,
  contentW = width,
  contentH = height,
): ZoomState {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
  const k = scale / z.scale
  return clampZoom({ scale, x: cx - (cx - z.x) * k, y: cy - (cy - z.y) * k }, width, height, contentW, contentH)
}

/** ずらす（ドラッグ） */
export function panBy(
  z: ZoomState,
  dx: number,
  dy: number,
  width: number,
  height: number,
  contentW = width,
  contentH = height,
): ZoomState {
  return clampZoom({ scale: z.scale, x: z.x + dx, y: z.y + dy }, width, height, contentW, contentH)
}

/**
 * 動画の枠の大きさ（スマホで手元を大きく見たいとき用）。拡大の倍率とは別に、ボタンで切り替える。
 * - normal: 動画の形（16:9）のまま
 * - medium: 枠の下の端を、画面の上から 55% まで
 * - large: 枠の下の端を、画面の上から 3 分の 2 まで
 */
export type VideoFrame = 'normal' | 'medium' | 'large'

export const FRAME_ORDER: readonly VideoFrame[] = ['normal', 'medium', 'large']

/** 枠の下の端（画面の高さに対する %）。normal は広げない */
export const FRAME_BOTTOM: Record<VideoFrame, number | null> = { normal: null, medium: 55, large: 66.7 }

/** 枠の大きさの名前（日本語）。ボタンの文言を変えるときは、ZoomableVideo の labels.frames を使う */
export const FRAME_LABEL: Record<VideoFrame, string> = { normal: '標準', medium: '中', large: '大' }

/** ボタンを押したときの次の大きさ（標準 → 中 → 大 → 標準） */
export const nextFrame = (f: VideoFrame): VideoFrame => FRAME_ORDER[(FRAME_ORDER.indexOf(f) + 1) % FRAME_ORDER.length]
