import React from 'react'
import { POSTER_W, POSTER_H } from '../lib/constants.js'

// Tiny helpers for writing template backgrounds.

export const W = POSTER_W
export const H = POSTER_H

/** Full-poster absolutely positioned layer. */
export function Layer({ style, children }) {
  return <div style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>
}

/** Full-poster SVG layer (1080 × 1350 user units). */
export function Art({ children, style }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0, ...style }}>
      {children}
    </svg>
  )
}

/** Ornamental divider (line – diamond – line) centred at (cx, y). */
export function Ornament({ cx, y, width, color, size = 12, stroke = 2.5 }) {
  return (
    <g>
      <line x1={cx - width / 2} y1={y} x2={cx - size * 2.2} y2={y} stroke={color} strokeWidth={stroke} />
      <line x1={cx + size * 2.2} y1={y} x2={cx + width / 2} y2={y} stroke={color} strokeWidth={stroke} />
      <polygon points={`${cx},${y - size} ${cx + size},${y} ${cx},${y + size} ${cx - size},${y}`} fill={color} />
      <circle cx={cx - size * 1.6} cy={y} r={size * 0.3} fill={color} />
      <circle cx={cx + size * 1.6} cy={y} r={size * 0.3} fill={color} />
    </g>
  )
}

/** Square/inset double frame around the whole poster. */
export function FrameLines({ inset = 34, gap = 12, color, outer = 3, inner = 1.5 }) {
  return (
    <g fill="none" stroke={color}>
      <rect x={inset} y={inset} width={W - inset * 2} height={H - inset * 2} strokeWidth={outer} />
      <rect x={inset + gap} y={inset + gap} width={W - (inset + gap) * 2} height={H - (inset + gap) * 2} strokeWidth={inner} />
    </g>
  )
}

/** Small diamonds on the four corners of a frame. */
export function CornerDiamonds({ inset = 34, color, size = 14 }) {
  const pts = [
    [inset, inset],
    [W - inset, inset],
    [inset, H - inset],
    [W - inset, H - inset],
  ]
  return (
    <g>
      {pts.map(([x, y], i) => (
        <polygon key={i} points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`} fill={color} />
      ))}
    </g>
  )
}
