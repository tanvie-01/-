import React from 'react'

// Fixed pseudo-random layout (percentage-based) so every export/preview is
// pixel-identical — no Math.random() at render time.
const PIECES = [
  { x: 6, y: 8, r: 18, s: 'rect', c: 0 },
  { x: 14, y: 22, r: -30, s: 'circle', c: 1 },
  { x: 22, y: 6, r: 45, s: 'rect', c: 2 },
  { x: 30, y: 16, r: -10, s: 'tri', c: 3 },
  { x: 9, y: 34, r: 60, s: 'rect', c: 1 },
  { x: 38, y: 8, r: 15, s: 'circle', c: 0 },
  { x: 46, y: 20, r: -45, s: 'rect', c: 2 },
  { x: 62, y: 7, r: 20, s: 'tri', c: 1 },
  { x: 70, y: 18, r: -20, s: 'circle', c: 3 },
  { x: 78, y: 8, r: 35, s: 'rect', c: 0 },
  { x: 86, y: 22, r: -15, s: 'rect', c: 2 },
  { x: 92, y: 10, r: 50, s: 'circle', c: 1 },
  { x: 94, y: 32, r: -35, s: 'tri', c: 3 },
  { x: 4, y: 46, r: 25, s: 'circle', c: 2 },
  { x: 96, y: 48, r: 40, s: 'rect', c: 0 },
  { x: 12, y: 60, r: -25, s: 'rect', c: 3 },
  { x: 88, y: 62, r: 18, s: 'circle', c: 1 },
  { x: 5, y: 74, r: 40, s: 'tri', c: 0 },
  { x: 95, y: 76, r: -40, s: 'rect', c: 2 },
  { x: 20, y: 90, r: 20, s: 'circle', c: 3 },
  { x: 80, y: 90, r: -20, s: 'rect', c: 1 },
  { x: 54, y: 12, r: -12, s: 'circle', c: 2 },
]

function Piece({ s, size, color }) {
  if (s === 'circle') return <circle cx={0} cy={0} r={size / 2} fill={color} />
  if (s === 'tri') return <polygon points={`0,${-size / 2} ${size / 2},${size / 2} ${-size / 2},${size / 2}`} fill={color} />
  return <rect x={-size / 2} y={-size * 0.2} width={size} height={size * 0.4} rx={2} fill={color} />
}

/** Confetti pieces scattered over a w × h SVG area. */
export function ConfettiArt({ w, h, colors = ['#d8a53c', '#b8323f', '#1c9c6e', '#233b6e'], size = 16 }) {
  return (
    <g>
      {PIECES.map((p, i) => (
        <g key={i} transform={`translate(${(p.x / 100) * w} ${(p.y / 100) * h}) rotate(${p.r})`}>
          <Piece s={p.s} size={size} color={colors[p.c % colors.length]} />
        </g>
      ))}
    </g>
  )
}

/** Absolutely-positioned confetti field covering the top `area` % of a w × h poster. */
export default function Confetti({ colors, area = 100, opacity = 0.9, w = 1080, h = 1350, size = 16 }) {
  const ah = (h * area) / 100
  return (
    <svg width={w} height={ah} viewBox={`0 0 ${w} ${ah}`} style={{ position: 'absolute', left: 0, top: 0, opacity, pointerEvents: 'none' }}>
      <ConfettiArt w={w} h={ah} colors={colors} size={size} />
    </svg>
  )
}
