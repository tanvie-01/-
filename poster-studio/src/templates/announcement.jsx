import React from 'react'
import { Art, Layer, Ornament, FrameLines, CornerDiamonds, W, H } from './kit.jsx'
import { useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// রয়েল ঘোষণা — formal proclamation: maroon & gold, logo inside a seal, big
// heading, long message, dated, signed. No person photo by design (an image
// frame can still be added from the এলিমেন্ট panel).
// ---------------------------------------------------------------------------
function RoyalBg({ c }) {
  const p = useSvgId('ra')
  return (
    <>
      <Layer style={{ background: `radial-gradient(100% 75% at 50% 30%, ${c.secondary} 0%, ${c.bg} 75%)` }} />
      <Art>
        <defs>
          <pattern id={p} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="40" fill={c.accent} opacity="0.07" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={`url(#${p})`} />
        <FrameLines inset={30} gap={14} color={c.accent} outer={3} inner={1.5} />
        <CornerDiamonds inset={30} color={c.accent} size={14} />
        <Ornament cx={W / 2} y={432} width={600} color={c.accent} size={11} />
        <Ornament cx={W / 2} y={1012} width={600} color={withAlpha(c.accent, 0.7)} size={9} stroke={1.5} />
        <line x1="600" y1="1118" x2="940" y2="1118" stroke={withAlpha(c.accent, 0.6)} strokeWidth="1.5" strokeDasharray="4 6" />
      </Art>
    </>
  )
}

const royalAnnouncement = {
  id: 'royal-announcement',
  category: 'announcement',
  name: 'রয়েল ঘোষণা',
  en: 'Royal Announcement',
  palette: { primary: '#6d0f1a', secondary: '#8e1b28', accent: '#e2b857', bg: '#55091a', text: '#fbf1dc' },
  Background: RoyalBg,
  slots: [
    { id: 'topLine', kind: 'text', field: 'topLine', x: 140, y: 74, w: 800, h: 42, size: 24, weight: 600, color: '$accent', wrap: false },
    { id: 'logo', kind: 'logo', x: 470, y: 134, w: 140, h: 140, ring: { width: 4, color: '$accent', gap: 3, gapColor: '$bg' }, backdrop: { type: 'seal', color: '$accent', color2: '#ffffff', scale: 1.3 } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 110, y: 312, w: 860, h: 100, font: 'tiro', size: 40, weight: 700, color: '$accent', lineHeight: 1.3 },
    { id: 'title', kind: 'text', field: 'title', x: 150, y: 460, w: 780, h: 116, font: 'baloo', size: 84, weight: 800, color: '$text', wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 110, y: 598, w: 860, h: 390, size: 38, weight: 500, color: '$text', lineHeight: 1.65 },
    { id: 'date', kind: 'text', field: 'date', prefix: 'তারিখ: ', x: 110, y: 1040, w: 460, h: 50, size: 28, weight: 600, color: '$accent', align: 'left', wrap: false },
    { id: 'name', kind: 'text', field: 'name', x: 560, y: 1124, w: 420, h: 58, font: 'tiro', size: 38, weight: 700, color: '$text', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 560, y: 1180, w: 420, h: 44, size: 26, weight: 600, color: '$accent', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 140, y: 1252, w: 800, h: 40, size: 22, weight: 500, color: '$text', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// বোল্ড ঘোষণা — loud and clear: slanted banner heading, large message,
// date chip, optional photo card that only appears once a photo is added.
// ---------------------------------------------------------------------------
function BoldBg({ c }) {
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Art>
        <circle cx={W + 40} cy="-40" r="300" fill={c.primary} />
        <circle cx={W + 40} cy="-40" r="230" fill={withAlpha('#ffffff', 0.12)} />
        <polygon points={`40,236 860,206 840,368 20,380`} fill={c.secondary} />
        <polygon points={`20,380 840,368 836,384 18,396`} fill={c.primary} />
        <g transform="translate(860 230) rotate(-8)">
          <path d="M0 40 L70 10 L70 120 L0 90 Z" fill={c.primary} />
          <rect x="-26" y="40" width="30" height="50" rx="6" fill={c.primary} />
          <path d="M88 40 q20 25 0 50 M100 26 q34 39 0 78" stroke={c.primary} strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
        <g fill={withAlpha(c.secondary, 0.14)}>
          {Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, k) => <circle key={`${r}${k}`} cx={820 + k * 36} cy={900 + r * 36} r="5" />))}
        </g>
        <rect y={H - 100} width={W} height="100" fill={c.secondary} />
        <rect y={H - 108} width={W} height="8" fill={c.primary} />
      </Art>
    </>
  )
}

const boldAnnouncement = {
  id: 'bold-announcement',
  category: 'announcement',
  name: 'বোল্ড ঘোষণা',
  en: 'Bold Announcement',
  palette: { primary: '#d9462f', secondary: '#16225c', accent: '#ffd166', bg: '#fff8f0', text: '#1c1c1c' },
  Background: BoldBg,
  slots: [
    { id: 'logo', kind: 'logo', x: 60, y: 60, w: 116, h: 116, ring: { width: 4, color: '$primary' } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 196, y: 64, w: 600, h: 108, size: 31, weight: 700, color: '$secondary', align: 'left', lineHeight: 1.25 },
    { id: 'title', kind: 'text', field: 'title', x: 80, y: 246, w: 740, h: 124, font: 'baloo', size: 92, weight: 800, color: '#ffffff', align: 'left', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      optional: true,
      x: 770,
      y: 440,
      w: 250,
      h: 310,
      shape: 'rounded',
      ring: { width: 8, color: '#ffffff' },
      backdrop: { type: 'offset', color: '$primary', dx: 16, dy: 16 },
      shadow: 0.3,
    },
    { id: 'message', kind: 'text', field: 'message', x: 80, y: 440, w: 660, h: 500, size: 40, weight: 500, color: '$text', align: 'left', lineHeight: 1.6, valign: 'top' },
    { id: 'date', kind: 'text', field: 'date', x: 80, y: 980, w: 440, h: 66, bg: '$accent', radius: 33, icon: 'calendar', iconColor: '$secondary', size: 29, weight: 700, color: '$secondary', pad: [6, 24], wrap: false },
    { id: 'name', kind: 'text', field: 'name', x: 80, y: 1080, w: 760, h: 60, font: 'tiro', size: 42, weight: 700, color: '$secondary', align: 'left', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 80, y: 1140, w: 760, h: 46, size: 27, weight: 600, color: '$text', align: 'left', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 100, y: H - 76, w: 880, h: 50, size: 25, weight: 600, color: '#ffffff', wrap: false },
  ],
}

export default [royalAnnouncement, boldAnnouncement]
