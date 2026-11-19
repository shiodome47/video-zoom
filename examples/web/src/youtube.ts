/** YouTube IFrame API（https://developers.google.com/youtube/iframe_api_reference）の、見本で使うところだけ */
export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  getPlayerState(): number
  destroy(): void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars?: Record<string, string | number>
          events?: { onStateChange?: (e: { data: number }) => void }
        },
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

const API = 'https://www.youtube.com/iframe_api'
let loading: Promise<void> | null = null

/** IFrame API を 1 回だけ読み込む */
export function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (!loading) {
    loading = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      const tag = document.createElement('script')
      tag.src = API
      document.head.appendChild(tag)
    })
  }
  return loading
}

/** URL（watch?v=・youtu.be・shorts・embed）か、11 文字の ID から、動画の ID を取り出す */
export function youTubeId(input: string): string | null {
  const s = input.trim()
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^(www|m)\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1, 12) || null
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v) return v
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)
      return m ? m[1] : null
    }
  } catch {
    // URL ではない
  }
  return null
}
