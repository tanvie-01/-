import React from 'react'

/** Award-medal art (star disc on two ribbon tails) in a 100 × 160 box. */
export function MedalArt({ discColor = '#d8a53c', ribbonA = '#b8323f', ribbonB = '#233b6e' }) {
  return (
    <g>
      <polygon points="30,0 46,0 50,70 26,70" fill={ribbonA} />
      <polygon points="54,0 70,0 74,70 50,70" fill={ribbonB} />
      <circle cx="50" cy="95" r="42" fill={discColor} stroke="#fff" strokeWidth="4" />
      <circle cx="50" cy="95" r="32" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
      <polygon points="50,74 56,88 71,88 59,97 64,112 50,103 36,112 41,97 29,88 44,88" fill="#fff" />
    </g>
  )
}

/** A small award-medal glyph. Purely decorative. */
export default function MedalBadge({ size = 90, style, ...colors }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160" style={{ overflow: 'visible', ...style }}>
      <MedalArt {...colors} />
    </svg>
  )
}
