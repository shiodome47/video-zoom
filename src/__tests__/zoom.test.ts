import { describe, expect, it } from 'vitest'
import { clampZoom, FRAME_BOTTOM, nextFrame, panBy, ZOOM_IDENTITY, zoomAt } from '../zoom'

const W = 400
const H = 225

describe('動画の拡大', () => {
  it('指の位置を動かさずに拡大する（その位置の手元が大きくなる）', () => {
    const z = zoomAt(ZOOM_IDENTITY, 2, 300, 100, W, H)
    expect(z.scale).toBe(2)
    // 拡大前の (300, 100) は、拡大後も画面の (300, 100) に来る
    expect(300 * z.scale + z.x).toBeCloseTo(300)
    expect(100 * z.scale + z.y).toBeCloseTo(100)
  })

  it('動画の外に余白が出るほどはずらせない', () => {
    const z = panBy(zoomAt(ZOOM_IDENTITY, 2, 0, 0, W, H), 500, 500, W, H)
    expect([z.x, z.y]).toEqual([0, 0])
    const far = panBy(z, -5000, -5000, W, H)
    expect([far.x, far.y]).toEqual([W - W * 2, H - H * 2])
  })

  it('倍率は 1〜5 倍。1 倍に戻すと位置も元どおり', () => {
    expect(zoomAt(ZOOM_IDENTITY, 20, 0, 0, W, H).scale).toBe(5)
    expect(clampZoom({ scale: 0.5, x: -30, y: -30 }, W, H)).toEqual(ZOOM_IDENTITY)
  })

  it('枠の大きさは、ボタンで 標準 → 中 → 大 → 標準 と切り替わる', () => {
    expect(nextFrame('normal')).toBe('medium')
    expect(nextFrame('medium')).toBe('large')
    expect(nextFrame('large')).toBe('normal')
    expect(FRAME_BOTTOM.normal).toBeNull()
    expect(FRAME_BOTTOM.medium).toBe(55)
    expect(FRAME_BOTTOM.large).toBeCloseTo(66.7)
  })

  it('枠を縦に広げているとき、等倍の動画は上下まん中に置き、拡大して枠より大きくなったら上下にもずらせる', () => {
    const FH = 400 // 枠の高さ（動画は 225）
    const one = clampZoom(ZOOM_IDENTITY, W, FH, W, H)
    expect(one).toEqual({ scale: 1, x: 0, y: (FH - H) / 2 })
    // 1.5 倍（高さ 337.5）ではまだ枠より小さいので、上下まん中のまま
    const mid = panBy(zoomAt(one, 1.5, 200, 200, W, FH, W, H), 0, -999, W, FH, W, H)
    expect(mid.y).toBeCloseTo((FH - H * 1.5) / 2)
    // 3 倍（高さ 675）では、上下の端までずらせる
    const big = zoomAt(one, 3, 200, 200, W, FH, W, H)
    expect(panBy(big, 0, 9999, W, FH, W, H).y).toBe(0)
    expect(panBy(big, 0, -9999, W, FH, W, H).y).toBeCloseTo(FH - H * 3)
  })
})
