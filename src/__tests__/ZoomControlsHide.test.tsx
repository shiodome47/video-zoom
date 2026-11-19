import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HIDE_CONTROLS_MS, YT_PASS_MS, ZoomableVideo } from '../ZoomableVideo'

describe('動画の右上のボタン', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('しばらく触らないと隠れ、動画に触る（ピンチ・タップ）とまた出る', () => {
    render(
      <ZoomableVideo expandable>
        <div />
      </ZoomableVideo>,
    )
    const controls = screen.getByTestId('zoom-controls')
    expect(controls.dataset.visible).toBe('true')

    act(() => vi.advanceTimersByTime(HIDE_CONTROLS_MS + 10))
    expect(controls.dataset.visible).toBe('false')
    // 隠れている間は押せない（誤って押さない）
    expect(controls.className).toContain('video-zoom__controls--hidden')

    fireEvent.pointerDown(screen.getByTestId('zoomable-video'), { pointerId: 1, pointerType: 'touch' })
    expect(controls.dataset.visible).toBe('true')

    // 触り続けている間は出たまま
    act(() => vi.advanceTimersByTime(HIDE_CONTROLS_MS - 500))
    fireEvent.pointerMove(screen.getByTestId('zoomable-video'), { pointerId: 1, pointerType: 'touch' })
    act(() => vi.advanceTimersByTime(HIDE_CONTROLS_MS - 500))
    expect(controls.dataset.visible).toBe('true')
    act(() => vi.advanceTimersByTime(1000))
    expect(controls.dataset.visible).toBe('false')
  })

  it('YouTube（iframe）: 動画に触ってフォーカスが YouTube に移ったら出す（全画面から戻ったあとも見回りで分かる）', () => {
    render(
      <ZoomableVideo iframe expandable>
        <iframe title="yt" />
      </ZoomableVideo>,
    )
    const controls = screen.getByTestId('zoom-controls')
    act(() => vi.advanceTimersByTime(HIDE_CONTROLS_MS + 10))
    expect(controls.dataset.visible).toBe('false')

    // blur が来なくても（全画面から戻ったあとなど）、見回りで気づく
    act(() => (screen.getByTitle('yt') as HTMLIFrameElement).focus())
    act(() => vi.advanceTimersByTime(600))
    expect(controls.dataset.visible).toBe('true')
    // フォーカスはこちらに戻すので、次に触ったときもまた分かる
    expect(document.activeElement).toBe(screen.getByTestId('zoomable-video'))
  })

  it('再生・一時停止など、動画の状態が変わったときにも出す', () => {
    const { rerender } = render(
      <ZoomableVideo iframe activityKey={0}>
        <div />
      </ZoomableVideo>,
    )
    const controls = screen.getByTestId('zoom-controls')
    act(() => vi.advanceTimersByTime(HIDE_CONTROLS_MS + 10))
    expect(controls.dataset.visible).toBe('false')
    rerender(
      <ZoomableVideo iframe activityKey={1}>
        <div />
      </ZoomableVideo>,
    )
    expect(controls.dataset.visible).toBe('true')
  })

  it('YouTube: 動画の上の透明な面がタップを受けて再生・一時停止し、しばらく下の帯だけ面をどけて YouTube のボタンを触れるようにする', () => {
    const onTap = vi.fn()
    render(
      <ZoomableVideo iframe onTap={onTap}>
        <iframe title="yt" />
      </ZoomableVideo>,
    )
    const layer = () => screen.queryByTestId('gesture-layer')
    expect(layer()).toBeInTheDocument()
    fireEvent.pointerDown(layer()!, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50 })
    fireEvent.pointerUp(layer()!, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50 })
    // ダブルタップでないと分かるまで待ってから
    expect(onTap).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(350))
    expect(onTap).toHaveBeenCalledTimes(1)
    // YouTube のボタンがある下の帯だけをどける（動画の大部分は覆ったまま。ピンチでアプリ全体が拡大されないように）
    expect(layer()).toHaveAttribute('data-pass', 'bottom')
    act(() => vi.advanceTimersByTime(YT_PASS_MS + 10))
    expect(layer()).not.toHaveAttribute('data-pass')
  })
})
