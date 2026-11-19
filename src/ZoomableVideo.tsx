import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { FrameIcon, MinusIcon, PlusIcon, ZoomIcon } from './icons'
import { JA_LABELS, type VideoZoomLabels } from './labels'
import { clampZoom, FRAME_BOTTOM, MAX_SCALE, nextFrame, panBy, ZOOM_IDENTITY, zoomAt, type VideoFrame, type ZoomState } from './zoom'

/** className を条件付きで結合する */
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export interface ZoomableVideoProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** 変わったら等倍に戻す（動画ソースの切り替えなど） */
  resetKey?: string
  /**
   * 中身が iframe（YouTube）のとき。iframe の上で指を動かすと YouTube（とブラウザ）が受け取ってしまい、
   * ピンチするとアプリ全体が拡大されるので、動画の上に透明な面を置いて、ピンチ・ドラッグ・タップをこちらで受ける。
   * 1 回タップすると再生・一時停止（onTap）し、その後しばらくは面をどけて、YouTube のボタン（シーク・全画面など）を触れるようにする。
   */
  iframe?: boolean
  /** 動画を 1 回タップしたとき（YouTube では再生・一時停止。透明な面がタップを受けるため） */
  onTap?: () => void
  /**
   * 動画の枠を縦に広げられるようにする（右上のボタンで 標準・中・大 を切り替え。拡大の倍率では変わらない）。
   * 指定すると、標準は 16:9 の枠になる（シアターモードでは使わない）
   */
  expandable?: boolean
  /** 変わるたびに右上のボタンを出す（YouTube の再生・一時停止など、こちらで指の操作を受け取れないときの手がかり） */
  activityKey?: number
  /** 枠の大きさ（標準・中・大）。expandable のときに使う。使う側で覚えておく（ふつうは標準） */
  frame?: VideoFrame
  /** 右上の「枠の大きさ」ボタンを押したとき（使う側で frame を次の大きさにする）。無ければボタンを出さない */
  onCycleFrame?: () => void
  /** ボタンの文言。変えたいものだけ渡す（既定は日本語。英語は EN_LABELS） */
  labels?: Partial<VideoZoomLabels>
}

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_SCALE = 2.5
const STEP = 1.5
/** YouTube でタップしたあと、YouTube のボタンを触れるよう透明な面をどけておく時間（ミリ秒） */
export const YT_PASS_MS = 3000
/** 触らなくなってから右上のボタンを隠すまで（ミリ秒） */
export const HIDE_CONTROLS_MS = 2500

/**
 * 動画だけを拡大する枠（ページ全体や、下のブックマークの文字は動かさない）。
 * - スマホ: 2 本指でピンチ、拡大中は 1 本指でドラッグ、ダブルタップで拡大／等倍
 * - PC: トラックパッドのピンチ（Ctrl + ホイール）、右上の ＋ − ボタン
 */
export function ZoomableVideo({
  children,
  className,
  style,
  resetKey,
  iframe = false,
  expandable = false,
  activityKey,
  onTap,
  frame: frameProp = 'normal',
  onCycleFrame,
  labels: labelsProp,
}: ZoomableVideoProps) {
  const labels: VideoZoomLabels = { ...JA_LABELS, ...labelsProp }
  const frameRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<ZoomState>(ZOOM_IDENTITY)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; midX: number; midY: number; start: ZoomState } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  /** 1 回のタップ（onTap）は、ダブルタップでないと分かってから呼ぶ */
  const tapTimer = useRef<ReturnType<typeof setTimeout>>()
  const onTapRef = useRef(onTap)
  onTapRef.current = onTap
  useEffect(() => () => clearTimeout(tapTimer.current), [])

  /** YouTube: タップのあと、透明な面をどけて YouTube のボタンを触れるようにしている間 */
  const [passThrough, setPassThrough] = useState(false)
  const passTimerActive = useRef(false)
  passTimerActive.current = passThrough
  const passTimer = useRef<ReturnType<typeof setTimeout>>()
  const openPass = useCallback(() => {
    setPassThrough(true)
    clearTimeout(passTimer.current)
    passTimer.current = setTimeout(() => setPassThrough(false), YT_PASS_MS)
  }, [])
  useEffect(() => () => clearTimeout(passTimer.current), [])
  const moved = useRef(false)

  const frame: VideoFrame = expandable ? frameProp : 'normal'
  const frameBottom = FRAME_BOTTOM[frame]

  /** 枠の大きさと、中身（動画）の大きさ。枠を縦に広げているときも、動画は 16:9 のまま */
  const size = () => {
    const r = frameRef.current?.getBoundingClientRect()
    const w = r?.width ?? 0
    const h = r?.height ?? 0
    return { w, h, cw: w, ch: expandable ? Math.min(h, (w * 9) / 16) : h, left: r?.left ?? 0, top: r?.top ?? 0 }
  }
  const fit = (z: ZoomState) => {
    const { w, h, cw, ch } = size()
    return clampZoom(z, w, h, cw, ch)
  }

  /**
   * 右上のボタン（枠の大きさ・拡大）は、動画を触っていないときはしばらくして隠す。
   * 動画に触る（タップ・ピンチ・ドラッグ）、マウスを乗せる、ボタンを押すと、また出る。
   */
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const showControls = useCallback(() => {
    setControlsVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), HIDE_CONTROLS_MS)
  }, [])
  useEffect(() => () => clearTimeout(hideTimer.current), [])

  // 動画が替わったら等倍に戻す（ボタンも一度出す）
  useEffect(() => {
    setZoom(fit(ZOOM_IDENTITY))
    showControls()
  }, [resetKey])

  /**
   * YouTube（iframe）は、等倍のときは指の操作が YouTube に渡って、こちらでは受け取れない。
   * 動画を触ると YouTube の側にフォーカスが移るので、それを手がかりにボタンを出し、フォーカスをこちらに戻す
   * （戻しておくと、次に触ったときもまた分かる）。
   * window の blur だけだと、全画面表示から戻ったあとなどに取りこぼすので、
   * 全画面の切り替えのときと、短い間隔の見回りでも確かめる。
   */
  useEffect(() => {
    if (!iframe) return
    const check = () => {
      const el = frameRef.current
      const active = document.activeElement
      if (!el || !(active instanceof HTMLIFrameElement) || !el.contains(active)) return
      showControls()
      // YouTube のボタンを触っている間は、透明な面をどけたままにする
      if (passTimerActive.current) openPass()
      // 全画面の間はフォーカスを動かさない（YouTube の全画面の操作をじゃましない）
      if (!document.fullscreenElement) el.focus({ preventScroll: true })
    }
    const onBlur = () => setTimeout(check, 0)
    const onFullscreen = () => {
      if (document.fullscreenElement) return
      // 全画面から戻ったら、ボタンを一度出して、フォーカスをこちらに戻す
      showControls()
      setTimeout(check, 0)
    }
    const timer = setInterval(check, 500)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('webkitfullscreenchange', onFullscreen)
    return () => {
      clearInterval(timer)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('webkitfullscreenchange', onFullscreen)
    }
  }, [iframe, showControls, openPass])

  // 再生・一時停止など、動画の状態が変わったときにもボタンを出す（YouTube で確実に分かる手がかり）
  useEffect(() => {
    if (activityKey !== undefined) showControls()
  }, [activityKey, showControls])

  /**
   * 枠を広げるとき、枠の下の端を画面の上からこの位置まで下げる（中: 55%、大: 3 分の 2）。
   * 枠が変わるのはボタンを押したときだけ（ピンチ中に枠が伸び縮みして画面が揺れないように）。
   */
  const [expandTop, setExpandTop] = useState<number | null>(null)
  useEffect(() => {
    if (frameBottom == null) {
      setExpandTop(null)
      return
    }
    const measure = () => setExpandTop(Math.max(0, frameRef.current?.getBoundingClientRect().top ?? 0))
    measure()
    window.addEventListener('orientationchange', measure)
    return () => window.removeEventListener('orientationchange', measure)
  }, [frameBottom])

  // 枠の大きさが変わったら（広げた・画面を回した）、はみ出さないように位置を直す
  useEffect(() => {
    const el = frameRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setZoom((z) => fit(z)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const local = (e: { clientX: number; clientY: number }) => {
    const { left, top } = size()
    return { x: e.clientX - left, y: e.clientY - top }
  }

  // トラックパッドのピンチ（Chrome・Safari では Ctrl + ホイールとして届く）。ページの拡大を止めるため passive にしない
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const { w, h, cw, ch } = size()
      const p = local(e)
      setZoom((z) => zoomAt(z, z.scale * Math.exp(-e.deltaY * 0.01), p.x, p.y, w, h, cw, ch))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, local(e))
    moved.current = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
        start: zoomRef.current,
      }
    }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    const { w, h, cw, ch } = size()
    if (pointers.current.size >= 2 && pinch.current) {
      moved.current = true
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const s = pinch.current
      const z = zoomAt(s.start, s.start.scale * (dist / s.dist), s.midX, s.midY, w, h, cw, ch)
      setZoom(panBy(z, midX - s.midX, midY - s.midY, w, h, cw, ch))
      return
    }
    if (zoomRef.current.scale > 1) {
      const dx = p.x - prev.x
      const dy = p.y - prev.y
      if (Math.abs(dx) + Math.abs(dy) > 0) moved.current = true
      setZoom((z) => panBy(z, dx, dy, w, h, cw, ch))
    }
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    const p = pointers.current.get(e.pointerId)
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    // ダブルタップ（指・マウスとも）: 拡大していなければその位置を拡大、拡大していれば等倍
    if (!p || moved.current || pointers.current.size > 0) return
    const now = Date.now()
    const last = lastTap.current
    if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(p.x - last.x, p.y - last.y) < 30) {
      lastTap.current = null
      clearTimeout(tapTimer.current)
      const { w, h, cw, ch } = size()
      setZoom((z) => (z.scale > 1 ? fit(ZOOM_IDENTITY) : zoomAt(z, DOUBLE_TAP_SCALE, p.x, p.y, w, h, cw, ch)))
    } else {
      lastTap.current = { t: now, ...p }
      if (onTapRef.current) {
        clearTimeout(tapTimer.current)
        tapTimer.current = setTimeout(() => {
          onTapRef.current?.()
          // 等倍のときは、続けて YouTube のボタン（シーク・全画面など）を触れるようにする
          if (iframe && zoomRef.current.scale <= 1.001) openPass()
        }, DOUBLE_TAP_MS)
      }
    }
  }

  const step = (k: number) => {
    const { w, h, cw, ch } = size()
    setZoom((z) => zoomAt(z, z.scale * k, w / 2, h / 2, w, h, cw, ch))
  }

  const zoomed = zoom.scale > 1.001
  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }

  return (
    <div
      ref={frameRef}
      className={cn('video-zoom', className)}
      style={{
        ...(expandable ? { aspectRatio: '16 / 9' } : {}),
        ...(frameBottom != null && expandTop != null
          ? { minHeight: `max(0px, calc(${frameBottom}dvh - ${Math.round(expandTop)}px))` }
          : {}),
        ...style,
        // ブラウザ自身のピンチ（ページ全体の拡大）・スクロールを止めて、指の動きをこちらで受ける
        touchAction: 'none',
      }}
      data-testid="zoomable-video"
      data-frame={frame}
      data-expandable={expandable || undefined}
      data-zoomed={zoomed || undefined}
      tabIndex={iframe ? -1 : undefined}
      onPointerDownCapture={showControls}
      onPointerMoveCapture={showControls}
      onPointerEnter={showControls}
      {...handlers}
    >
      <div
        // 動画（16:9）。枠を縦に広げているときは、等倍では上下まん中に出て、拡大すると枠いっぱいに広がる
        className={cn('video-zoom__content', expandable && 'video-zoom__content--16x9')}
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          transformOrigin: '0 0',
          willChange: zoomed ? 'transform' : undefined,
        }}
      >
        {children}
      </div>

      {/* YouTube: 動画全体を透明な面で覆って、ピンチ・ドラッグ・タップを受ける。
          タップの直後は、YouTube のボタンがある下の帯だけをどける（全体をどけると、そのあいだのピンチで
          iPhone ではアプリ全体が拡大されてしまうため） */}
      {iframe && (
        <div
          className={cn('video-zoom__gesture-layer', passThrough && !zoomed && 'video-zoom__gesture-layer--pass')}
          data-testid="gesture-layer"
          data-pass={passThrough && !zoomed ? 'bottom' : undefined}
        />
      )}

      {/* 拡大のボタン（右上） */}
      <div
        className={cn('video-zoom__controls', !controlsVisible && 'video-zoom__controls--hidden')}
        onPointerDown={(e) => e.stopPropagation()}
        onFocusCapture={showControls}
        data-testid="zoom-controls"
        data-visible={controlsVisible}
      >
        {expandable && onCycleFrame && (
          <button
            type="button"
            onClick={onCycleFrame}
            aria-label={labels.frameToggle(labels.frames[frame], labels.frames[nextFrame(frame)])}
            title={labels.frameToggleTitle}
            data-testid="video-frame-toggle"
            className="video-zoom__button"
          >
            <FrameIcon />
            {frame !== 'normal' && <span className="video-zoom__frame-name">{labels.frames[frame]}</span>}
          </button>
        )}
        {zoomed && (
          <button
            type="button"
            onClick={() => setZoom(fit(ZOOM_IDENTITY))}
            className="video-zoom__button video-zoom__button--reset"
            title={labels.resetTitle}
            data-testid="zoom-reset"
          >
            {labels.reset(zoom.scale.toFixed(1))}
          </button>
        )}
        {zoomed && (
          <button
            type="button"
            onClick={() => step(1 / STEP)}
            aria-label={labels.zoomOut}
            className="video-zoom__button"
            data-testid="zoom-out"
          >
            <MinusIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => step(STEP)}
          disabled={zoom.scale >= MAX_SCALE}
          aria-label={labels.zoomIn}
          title={labels.zoomInTitle}
          className="video-zoom__button"
          data-testid="zoom-in"
        >
          {zoomed ? <PlusIcon /> : <ZoomIcon />}
        </button>
      </div>
    </div>
  )
}
