import React from 'react'

/** Radiating rays centred at (cx, cy) with radius r. */
export function RaysArt({ cx, cy, r, rays = 16, color = '#f3d484', opacity = 0.55 }) {
  const items = []
  for (let i = 0; i < rays; i++) {
    items.push(
      <path key={i} d={`M0 0 L${-r * 0.09} ${-r} L${r * 0.09} ${-r} Z`} fill={color} opacity={opacity} transform={`rotate(${(360 / rays) * i})`} />
    )
  }
  return <g transform={`translate(${cx} ${cy})`}>{items}</g>
}

/** Radiating rays from center — used behind medals, badges and photo frames. */
export default function StarBurst({ size = 460, rays = 16, color = '#f3d484', opacity = 0.55, style }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', ...style }}>
      <RaysArt cx={size / 2} cy={size / 2} r={size / 2} rays={rays} color={color} opacity={opacity} />
    </svg>
  )
}
