import React from 'react'

function Flower({ x, y, r, petal, center }) {
  const petals = []
  for (let i = 0; i < 6; i++) {
    const angle = (360 / 6) * i
    petals.push(<ellipse key={i} cx={x} cy={y - r} rx={r * 0.55} ry={r} fill={petal} transform={`rotate(${angle} ${x} ${y})`} opacity="0.92" />)
  }
  return (
    <g>
      {petals}
      <circle cx={x} cy={y} r={r * 0.45} fill={center} />
    </g>
  )
}

/** Floral spray art in a 220 × 220 box, anchored to the top-left corner. */
export function FloralCornerArt({ petal = '#e0693f', petal2 = '#f2b134', leaf = '#3f7a4a', center = '#b8323f' }) {
  return (
    <g>
      <path d="M0 40 C 40 10, 90 10, 110 50 C 70 40, 30 60, 0 90 Z" fill={leaf} opacity="0.85" />
      <path d="M20 0 C 60 20, 70 60, 40 100 C 30 60, 10 40, 20 0 Z" fill={leaf} opacity="0.7" />
      <Flower x={55} y={55} r={22} petal={petal} center="#fff6df" />
      <Flower x={100} y={30} r={16} petal={petal2} center="#fff6df" />
      <Flower x={30} y={95} r={14} petal={center} center="#fff6df" />
      <circle cx={78} cy={78} r={5} fill={petal2} />
      <circle cx={10} cy={65} r={4} fill={petal} />
    </g>
  )
}

/** Floral spray for a poster corner; `corner` mirrors it into 'tl' | 'tr' | 'bl' | 'br'. */
export default function FloralCorner({ size = 220, corner = 'tl', style, ...colors }) {
  const sx = corner === 'tr' || corner === 'br' ? -1 : 1
  const sy = corner === 'bl' || corner === 'br' ? -1 : 1
  const pos = {
    left: sx === 1 ? 0 : undefined,
    right: sx === -1 ? 0 : undefined,
    top: sy === 1 ? 0 : undefined,
    bottom: sy === -1 ? 0 : undefined,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" style={{ position: 'absolute', ...pos, transform: `scale(${sx},${sy})`, ...style }}>
      <FloralCornerArt {...colors} />
    </svg>
  )
}
