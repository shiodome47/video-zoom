import { useEffect, useRef, useState } from 'react'
import { EN_LABELS, nextFrame, ZoomableVideo, type VideoFrame, type VideoZoomLabels } from '@shiodome47/video-zoom'
import { loadYouTubeApi, youTubeId, type YTPlayer } from './youtube'

/** ふつうの動画の見本（MDN が配っている、著作権のない CC0 の動画） */
const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
/** YouTube の見本（Blender 財団の公開映画「Big Buck Bunny」） */
const SAMPLE_YOUTUBE = 'aqz-KE-bpKQ'

type Lang = 'ja' | 'en'

const TEXT = {
  ja: {
    lead: '動画（YouTube の埋め込みも）を 2 本指で拡大・移動できる React の部品。',
    how: 'スマホ: 2 本指でピンチ・拡大中は 1 本指で移動・ダブルタップ。PC: トラックパッドのピンチ・右上の ＋ − ボタン。',
    video: 'ふつうの動画（<video>）',
    videoNote: '1 回タップで再生・一時停止。',
    youtube: 'YouTube の埋め込み',
    ytNote: '1 回タップで再生・一時停止。そのあと 3 秒は、下の帯で YouTube のボタンを触れます。',
    ytInput: 'YouTube の URL を貼って試す',
    show: '表示',
    labels: 'ボタンの文言',
    frameNote: '右上の枠のボタン（標準 → 中 → 大）は、枠の下の端を、画面の 55%・3 分の 2 の高さまで伸ばします。動画を画面の上のほうに出してから押してください。',
  },
  en: {
    lead: 'A React frame that lets you pinch-zoom and pan a video — YouTube embeds included.',
    how: 'Phones: pinch with two fingers, drag with one while zoomed, double-tap. Computers: trackpad pinch or the + − buttons.',
    video: 'Plain video (<video>)',
    videoNote: 'Tap once to play / pause.',
    youtube: 'YouTube embed',
    ytNote: 'Tap once to play / pause. For 3 seconds after that, the bottom strip passes touches to YouTube’s own controls.',
    ytInput: 'Paste a YouTube URL to try',
    show: 'Show',
    labels: 'Button labels',
    frameNote: 'The frame button (normal → medium → large) stretches the frame down to 55% / two-thirds of the screen height. Scroll the video near the top of the screen before pressing it.',
  },
} as const

export function App() {
  const [lang, setLang] = useState<Lang>('ja')
  const t = TEXT[lang]
  const labels: Partial<VideoZoomLabels> | undefined = lang === 'en' ? EN_LABELS : undefined

  return (
    <main className="demo">
      <header className="demo__header">
        <h1>video-zoom</h1>
        <p>{t.lead}</p>
        <p className="demo__muted">{t.how}</p>
        <p className="demo__muted">{t.frameNote}</p>
        <pre className="demo__code">
          <code>npm install @shiodome47/video-zoom</code>
        </pre>
        <div className="demo__lang" role="group" aria-label={t.labels}>
          <span className="demo__muted">{t.labels}:</span>
          <button type="button" aria-pressed={lang === 'ja'} onClick={() => setLang('ja')}>
            日本語
          </button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            English
          </button>
        </div>
      </header>

      <section>
        <h2>{t.video}</h2>
        <p className="demo__muted">{t.videoNote}</p>
        <PlainVideoDemo labels={labels} />
      </section>

      <section>
        <h2>{t.youtube}</h2>
        <p className="demo__muted">{t.ytNote}</p>
        <YouTubeDemo labels={labels} inputLabel={t.ytInput} showLabel={t.show} />
      </section>

      <footer className="demo__footer">
        <a href="https://github.com/shiodome47/video-zoom">GitHub</a>
        <a href="https://www.npmjs.com/package/@shiodome47/video-zoom">npm</a>
      </footer>
    </main>
  )
}

function PlainVideoDemo({ labels }: { labels?: Partial<VideoZoomLabels> }) {
  const [frame, setFrame] = useState<VideoFrame>('normal')
  const videoRef = useRef<HTMLVideoElement>(null)
  // 枠が指の操作を受けるので、再生・一時停止は 1 回タップ（onTap）で行う
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }
  return (
    <div className="demo__player">
      <ZoomableVideo resetKey={SAMPLE_VIDEO} expandable frame={frame} onCycleFrame={() => setFrame(nextFrame)} onTap={togglePlay} labels={labels}>
        <video ref={videoRef} src={SAMPLE_VIDEO} className="demo__fill" playsInline loop muted autoPlay preload="metadata" />
      </ZoomableVideo>
    </div>
  )
}

function YouTubeDemo({ labels, inputLabel, showLabel }: { labels?: Partial<VideoZoomLabels>; inputLabel: string; showLabel: string }) {
  const [videoId, setVideoId] = useState(SAMPLE_YOUTUBE)
  const [input, setInput] = useState('')
  const [frame, setFrame] = useState<VideoFrame>('normal')
  const [stateTick, setStateTick] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadYouTubeApi().then(() => {
      const box = boxRef.current
      if (cancelled || !box || !window.YT) return
      // YT.Player は渡した要素を iframe に置き換えるので、毎回、中に新しい要素を作って渡す
      box.innerHTML = ''
      const placeholder = document.createElement('div')
      box.appendChild(placeholder)
      playerRef.current = new window.YT.Player(placeholder, {
        videoId,
        playerVars: { rel: 0, playsinline: 1 },
        // 再生・一時停止などが変わったら、右上のボタンを一度出す（activityKey）
        events: { onStateChange: () => setStateTick((n) => n + 1) },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  // 透明な面がタップを受けるので、再生・一時停止はこちらで行う
  const togglePlay = () => {
    const p = playerRef.current
    if (!p || typeof p.getPlayerState !== 'function') return
    if (p.getPlayerState() === 1) p.pauseVideo()
    else p.playVideo()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = youTubeId(input)
    if (id) setVideoId(id)
  }
  const inputId = youTubeId(input)

  return (
    <>
      <div className="demo__player">
        <ZoomableVideo
          resetKey={videoId}
          iframe
          expandable
          frame={frame}
          onCycleFrame={() => setFrame(nextFrame)}
          activityKey={stateTick}
          onTap={togglePlay}
          labels={labels}
        >
          <div ref={boxRef} className="demo__fill demo__yt" />
        </ZoomableVideo>
      </div>
      <form className="demo__form" onSubmit={submit}>
        <label htmlFor="yt-url" className="demo__muted">
          {inputLabel}
        </label>
        <div className="demo__row">
          <input
            id="yt-url"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!inputId}>
            {showLabel}
          </button>
        </div>
      </form>
    </>
  )
}
