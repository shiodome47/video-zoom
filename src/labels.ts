import type { VideoFrame } from './zoom'

/**
 * ボタンの文言（読み上げ用の名前・マウスを乗せたときの説明も）。
 * 既定は日本語（JA_LABELS）。`<ZoomableVideo labels={...}>` で、変えたいものだけ渡せば差し替えられる。
 */
export interface VideoZoomLabels {
  /** 「拡大」ボタンの名前（読み上げ用） */
  zoomIn: string
  /** 「拡大」ボタンにマウスを乗せたときの説明 */
  zoomInTitle: string
  /** 「縮小」ボタンの名前（読み上げ用） */
  zoomOut: string
  /** 「等倍に戻す」ボタンの文字。scale は「2.5」のような今の倍率 */
  reset: (scale: string) => string
  /** 「等倍に戻す」ボタンにマウスを乗せたときの説明 */
  resetTitle: string
  /** 枠の大きさのボタンの名前（読み上げ用）。current・next は frames の文言 */
  frameToggle: (current: string, next: string) => string
  /** 枠の大きさのボタンにマウスを乗せたときの説明 */
  frameToggleTitle: string
  /** 枠の大きさの名前（標準・中・大）。中・大のときはボタンにも出る */
  frames: Record<VideoFrame, string>
}

/** 日本語（既定） */
export const JA_LABELS: VideoZoomLabels = {
  zoomIn: '動画を拡大',
  zoomInTitle: '動画を拡大（スマホはピンチ、PC はトラックパッドのピンチでも）',
  zoomOut: '動画を縮小',
  reset: (scale) => `${scale}× 戻す`,
  resetTitle: '等倍に戻す（ダブルタップでも戻せます）',
  frameToggle: (current, next) => `動画の枠の大きさ（今: ${current}。押すと${next}）`,
  frameToggleTitle: '動画の枠を縦に広げる（標準 → 中 → 大）',
  frames: { normal: '標準', medium: '中', large: '大' },
}

/** 英語（使うときは `labels={EN_LABELS}`） */
export const EN_LABELS: VideoZoomLabels = {
  zoomIn: 'Zoom in',
  zoomInTitle: 'Zoom in (pinch on phones, trackpad pinch on computers)',
  zoomOut: 'Zoom out',
  reset: (scale) => `${scale}× Reset`,
  resetTitle: 'Back to 1× (or double-tap)',
  frameToggle: (current, next) => `Video frame size (now: ${current}; press for ${next})`,
  frameToggleTitle: 'Make the video frame taller (normal → medium → large)',
  frames: { normal: 'Normal', medium: 'M', large: 'L' },
}
