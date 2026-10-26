import React from 'react'

/** One laurel branch in a 60 × 220 box (curving left). */
export function LaurelBranchArt({ color }) {
  const leaves = []
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const y = 10 + t * 190
    const x = 26 - Math.sin(t * Math.PI) * 20
    const rot = -30 + t * 55
    leaves.push(<ellipse key={i} cx={x} cy={y} rx="13" ry="7" fill={color} opacity={0.55 + t * 0.35} transform={`rotate(${rot} ${x} ${y})`} />)
  }
  return (
    <g>
      <path d="M28 8 C10 60, 10 160, 28 212" stroke={color} strokeWidth="3" fill="none" opacity="0.7" />
      {leaves}
    </g>
  )
}

/** Two mirrored branches filling a w × h SVG area (a wreath around a photo/medal). */
export function LaurelPairArt({ w, h, color }) {
  const k = h / 220
  return (
    <g>
      <g transform={`scale(${k})`}>
        <LaurelBranchArt color={color} />
      </g>
      <g transform={`translate(${w} 0) scale(${-k} ${k})`}>
        <LaurelBranchArt color={color} />
      </g>
    </g>
  )
}

export default function LaurelWreath({ color = '#d8a53c', width = 420, height = 300, style }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', overflow: 'visible', ...style }}>
      <LaurelPairArt w={width} h={height} color={color} />
    </svg>
  )
}
