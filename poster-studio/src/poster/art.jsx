import React, { useId } from 'react'

// Small SVG art primitives shared by template backgrounds, photo backdrops
// and the design-elements library.

/** Unique, url()-safe id for SVG gradients/patterns (one per component instance). */
export function useSvgId(prefix) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** Organic blob path in a 0..100 box. */
export const BLOB_PATH =
  'M50 2 C68 1 86 10 94 27 C102 44 99 63 91 77 C82 92 64 100 47 98 C29 97 12 88 5 72 C-2 56 2 36 11 22 C20 9 33 2 50 2 Z'

/** Scalloped seal outline centred in a size × size box. */
export function sealPath(size, bumps = 24, depth = 0.06) {
  const r = size / 2
  const pts = []
  const n = bumps * 2
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * (1 - depth)
    pts.push(`${(r + Math.cos(a) * rr).toFixed(1)},${(r + Math.sin(a) * rr).toFixed(1)}`)
  }
  return `M${pts.join(' L')} Z`
}

/** n-point star polygon points inside a w × h box. */
export function starPoints(w, h, points = 5, inner = 0.45) {
  const out = []
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? 0.5 : 0.5 * inner
    out.push(`${(w / 2 + Math.cos(a) * r * w).toFixed(1)},${(h / 2 + Math.sin(a) * r * h).toFixed(1)}`)
  }
  return out.join(' ')
}

/** Four-point sparkle centred at (x, y). */
export function Sparkle({ x, y, r, color, opacity = 1 }) {
  const k = r * 0.22
  return (
    <path
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`}
      fill={color}
      opacity={opacity}
    />
  )
}

/** Crescent moon centred at (x, y). */
export function Crescent({ x, y, r, color, bg }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x + r * 0.42} cy={y - r * 0.18} r={r * 0.86} fill={bg} />
    </g>
  )
}

/** Balloon with string; (x, y) is the balloon centre. */
export function Balloon({ x, y, r, color, string = '#8a8f9c' }) {
  return (
    <g>
      <path d={`M${x} ${y + r * 1.18} C ${x - r * 0.3} ${y + r * 1.8}, ${x + r * 0.3} ${y + r * 2.3}, ${x - r * 0.1} ${y + r * 3.1}`} stroke={string} strokeWidth="2" fill="none" />
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.18} fill={color} />
      <path d={`M${x - 6} ${y + r * 1.18} L${x + 6} ${y + r * 1.18} L${x} ${y + r * 1.08} Z`} fill={color} />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.45} rx={r * 0.18} ry={r * 0.3} fill="#fff" opacity="0.45" transform={`rotate(-25 ${x - r * 0.35} ${y - r * 0.45})`} />
    </g>
  )
}

/** Bunting flags hanging along a shallow curve across width w. */
export function Bunting({ w, y = 0, sag = 60, flags = 11, colors, size = 46 }) {
  const items = []
  for (let i = 0; i < flags; i++) {
    const t = (i + 0.5) / flags
    const x = t * w
    const yy = y + Math.sin(t * Math.PI) * sag
    items.push(
      <polygon key={i} points={`${x - size / 2},${yy} ${x + size / 2},${yy} ${x},${yy + size * 1.15}`} fill={colors[i % colors.length]} />
    )
  }
  return (
    <g>
      <path d={`M0 ${y} Q ${w / 2} ${y + sag * 2} ${w} ${y}`} stroke="#8a8f9c" strokeWidth="2" fill="none" />
      {items}
    </g>
  )
}

/** Soft wave band along the bottom of a w × h area (top edge at y). */
export function wavePath(w, h, y, amp = 30, waves = 2) {
  const seg = w / (waves * 2)
  let d = `M0 ${y}`
  for (let i = 0; i < waves * 2; i++) {
    const x1 = seg * i + seg / 2
    const dir = i % 2 === 0 ? -1 : 1
    d += ` Q ${x1} ${y + amp * dir} ${seg * (i + 1)} ${y}`
  }
  return `${d} L ${w} ${h} L 0 ${h} Z`
}
