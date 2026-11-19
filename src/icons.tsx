/**
 * ボタンのアイコン（線の絵）。外のライブラリに頼らないよう、部品の中に持っている。
 *
 * 絵の形は Lucide（https://lucide.dev）の Minus・Plus・ScanSearch・UnfoldVertical と同じ。
 * Lucide は ISC ライセンス: Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022
 * as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 */
import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="video-zoom__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const MinusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
)

export const PlusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
)

/** 等倍のときの「拡大」ボタン（虫めがね） */
export const ZoomIcon = () => (
  <Icon>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
    <path d="m16 16-1.9-1.9" />
  </Icon>
)

/** 枠を縦に広げるボタン */
export const FrameIcon = () => (
  <Icon>
    <path d="M12 22v-6" />
    <path d="M12 8V2" />
    <path d="M4 12H2" />
    <path d="M10 12H8" />
    <path d="M16 12h-2" />
    <path d="M22 12h-2" />
    <path d="m15 19-3 3-3-3" />
    <path d="m15 5-3-3-3 3" />
  </Icon>
)
