/**
 * npm に出すときに変わったところ（文言の差し替え・専用の CSS）のテスト。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EN_LABELS, JA_LABELS, ZoomableVideo } from '../index'

// テストはリポジトリの直下で動く
const SRC = resolve(process.cwd(), 'src')

describe('ボタンの文言', () => {
  it('既定は日本語', () => {
    render(
      <ZoomableVideo expandable frame="medium" onCycleFrame={() => {}}>
        <div />
      </ZoomableVideo>,
    )
    expect(screen.getByRole('button', { name: '動画を拡大' })).toBeInTheDocument()
    expect(screen.getByTestId('video-frame-toggle')).toHaveAccessibleName('動画の枠の大きさ（今: 中。押すと大）')
    expect(screen.getByTestId('video-frame-toggle')).toHaveTextContent('中')
  })

  it('変えたいものだけ差し替えられる（残りは日本語のまま）', () => {
    render(
      <ZoomableVideo labels={{ zoomIn: 'Zoom in', reset: (s) => `${s}x reset` }}>
        <div />
      </ZoomableVideo>,
    )
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' })
    expect(zoomIn).toHaveAttribute('title', JA_LABELS.zoomInTitle)
    fireEvent.click(zoomIn)
    expect(screen.getByTestId('zoom-reset')).toHaveTextContent(/x reset$/)
    expect(screen.getByRole('button', { name: '動画を縮小' })).toBeInTheDocument()
  })

  it('英語の文言（EN_LABELS）も用意してある', () => {
    render(
      <ZoomableVideo labels={EN_LABELS} expandable onCycleFrame={() => {}}>
        <div />
      </ZoomableVideo>,
    )
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByTestId('video-frame-toggle')).toHaveAccessibleName(/now: Normal; press for M/)
  })
})

describe('iPhone の Safari', () => {
  it('枠ではブラウザ自身のピンチ（ページ全体の拡大）を止める。style で上書きされない', () => {
    render(
      <ZoomableVideo style={{ touchAction: 'auto' }}>
        <div />
      </ZoomableVideo>,
    )
    expect(screen.getByTestId('zoomable-video').style.touchAction).toBe('none')
  })
})

describe('部品専用の CSS', () => {
  const css = readFileSync(resolve(SRC, 'style.css'), 'utf8')

  it('すべての決まりが .video-zoom の中だけに効く（使う側のページの見た目を変えない）', () => {
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    // { の前にある選択子を取り出す（@media の行は除く）
    const selectors = [...noComments.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
      .flatMap((s) => s.split(',').map((x) => x.trim()))
    expect(selectors.length).toBeGreaterThan(5)
    for (const s of selectors) {
      expect(s, s).toMatch(/^(:where\(\.video-zoom\)|\.video-zoom)(\s|$)/)
    }
  })

  it('部品が使うクラスは、すべて CSS に書いてある', () => {
    const tsx = readFileSync(resolve(SRC, 'ZoomableVideo.tsx'), 'utf8') + readFileSync(resolve(SRC, 'icons.tsx'), 'utf8')
    const used = new Set([...tsx.matchAll(/video-zoom__[a-z0-9-]+/g)].map((m) => m[0]))
    expect(used.size).toBeGreaterThan(5)
    for (const cls of used) expect(css, cls).toContain(`.${cls}`)
  })
})
