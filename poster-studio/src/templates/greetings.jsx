import React from 'react'
import { Art, Layer, Ornament, W, H } from './kit.jsx'
import { Sparkle, useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

function Moon({ x, y, r, color, maskId }) {
  return (
    <g>
      <defs>
        <mask id={maskId}>
          <rect x={x - r * 2} y={y - r * 2} width={r * 4} height={r * 4} fill="#fff" />
          <circle cx={x + r * 0.45} cy={y - r * 0.2} r={r * 0.85} fill="#000" />
        </mask>
      </defs>
      <circle cx={x} cy={y} r={r} fill={color} mask={`url(#${maskId})`} />
    </g>
  )
}

function Lantern({ x, len, color, glow }) {
  return (
    <g>
      <line x1={x} y1="0" x2={x} y2={len} stroke={color} strokeWidth="2" />
      <ellipse cx={x} cy={len + 46} rx="44" ry="56" fill={glow} opacity="0.35" />
      <path d={`M${x - 14} ${len} h28 l10 18 h-48 Z`} fill={color} />
      <path d={`M${x - 22} ${len + 18} h44 l-6 60 h-32 Z`} fill={color} opacity="0.9" />
      <rect x={x - 10} y={len + 30} width="20" height="36" rx="4" fill={glow} />
      <path d={`M${x - 16} ${len + 78} h32 l-8 12 h-16 Z`} fill={color} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// সিম্পল শুভেচ্ছা — calm card: crescent & stars, big script greeting,
// message, then a "signature" card pairing the sender's photo with name.
// ---------------------------------------------------------------------------
function SimpleBg({ c }) {
  const m = useSvgId('sg')
  return (
    <>
      <Layer style={{ background: `linear-gradient(180deg, ${withAlpha(c.secondary, 0.16)} 0%, ${c.bg} 42%, ${c.bg} 100%)` }} />
      <Art>
        <Moon x={W / 2} y={150} r={58} color={c.accent} maskId={m} />
        <Sparkle x={W / 2 + 120} y={112} r={20} color={c.accent} />
        <Sparkle x={W / 2 - 130} y={180} r={14} color={c.accent} opacity={0.8} />
        <Sparkle x={150} y={300} r={12} color={c.secondary} opacity={0.5} />
        <Sparkle x={930} y={340} r={16} color={c.secondary} opacity={0.5} />
        <Ornament cx={W / 2} y={738} width={520} color={c.accent} size={11} />
        <rect x="80" y="790" width={W - 160} height="350" rx="34" fill="#ffffff" />
        <rect x="80" y="790" width={W - 160} height="350" rx="34" fill="none" stroke={withAlpha(c.primary, 0.15)} strokeWidth="2" />
        <rect x="0" y={H - 120} width={W} height="120" fill={c.primary} />
        <rect x="0" y={H - 128} width={W} height="8" fill={c.accent} />
      </Art>
    </>
  )
}

const simpleGreeting = {
  id: 'simple-greeting',
  category: 'greetings',
  name: 'সিম্পল শুভেচ্ছা',
  en: 'Simple Greeting',
  palette: { primary: '#0b5d4b', secondary: '#138a6d', accent: '#d4a537', bg: '#f6f2e7', text: '#1e2b26' },
  Background: SimpleBg,
  slots: [
    { id: 'title', kind: 'text', field: 'title', x: 80, y: 250, w: 920, h: 210, font: 'galada', size: 170, weight: 400, color: '$primary', wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 120, y: 470, w: 840, h: 230, size: 38, weight: 500, color: '$text', lineHeight: 1.6 },
    {
      id: 'photo',
      kind: 'photo',
      x: 130,
      y: 840,
      w: 250,
      h: 250,
      shape: 'circle',
      ring: { width: 8, color: '$accent', gap: 4, gapColor: '#ffffff' },
      backdrop: { type: 'rings', color: '$accent', gap: 12, width: 2 },
    },
    { id: 'extra', kind: 'text', field: 'extra', x: 420, y: 850, w: 560, h: 46, size: 28, weight: 600, color: '$secondary', align: 'left' },
    { id: 'name', kind: 'text', field: 'name', x: 420, y: 896, w: 560, h: 82, font: 'tiro', size: 54, weight: 700, color: '$primary', align: 'left', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 420, y: 978, w: 560, h: 48, size: 29, weight: 600, color: '$text', align: 'left' },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 420, y: 1028, w: 560, h: 82, size: 24, weight: 500, color: '$text', align: 'left', lineHeight: 1.3 },
    { id: 'logo', kind: 'logo', x: 76, y: H - 108, w: 96, h: 96, ring: { width: 3, color: '$accent' } },
    { id: 'motto', kind: 'text', field: 'motto', x: 190, y: H - 104, w: 820, h: 50, size: 28, weight: 700, color: '#ffffff', align: 'left', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 190, y: H - 56, w: 820, h: 40, size: 21, weight: 500, color: '#ffffff', align: 'left', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// অলংকৃত শুভেচ্ছা — deep night colours, hanging lanterns, gold arch portrait
// glowing in the centre, mosque skyline along the bottom.
// ---------------------------------------------------------------------------
function DecorativeBg({ c }) {
  const g = useSvgId('dg')
  const m = useSvgId('dm')
  const sky = []
  for (let i = 0; i < 24; i++) {
    const x = (i * 197) % W
    const y = 40 + ((i * 131) % 620)
    sky.push(<Sparkle key={i} x={x} y={y} r={4 + (i % 4) * 3} color={i % 3 ? '#ffffff' : c.accent} opacity={0.35 + (i % 3) * 0.2} />)
  }
  const sil = c.primary
  return (
    <>
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.bg} />
            <stop offset="100%" stopColor={c.secondary} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${g})`} />
        {sky}
        <Moon x={890} y={150} r={54} color={c.accent} maskId={m} />
        <Lantern x={120} len={150} color={c.accent} glow="#ffe9a8" />
        <Lantern x={230} len={70} color={c.accent} glow="#ffe9a8" />
        <Lantern x={W - 220} len={110} color={c.accent} glow="#ffe9a8" />
        <path
          d={`M300 ${H - 160} q40 -70 80 0 v40 h70 v-70 q60 -110 120 0 v70 h70 v-40 q40 -70 80 0 v160 h-520 Z`}
          fill={sil}
          opacity="0.75"
        />
        <rect x="250" y={H - 260} width="22" height="260" fill={sil} opacity="0.75" />
        <rect x={W - 272} y={H - 260} width="22" height="260" fill={sil} opacity="0.75" />
        <path d={`M0 ${H - 120} H${W} V${H} H0 Z`} fill={sil} />
        <rect x="0" y={H - 124} width={W} height="4" fill={c.accent} />
      </Art>
    </>
  )
}

const decorativeGreeting = {
  id: 'decorative-greeting',
  category: 'greetings',
  name: 'অলংকৃত শুভেচ্ছা',
  en: 'Decorative Greeting',
  palette: { primary: '#06222c', secondary: '#145c6e', accent: '#e3b34c', bg: '#082a36', text: '#fdf6e3' },
  Background: DecorativeBg,
  slots: [
    { id: 'title', kind: 'text', field: 'title', x: 260, y: 110, w: 560, h: 170, font: 'galada', size: 130, weight: 400, color: '$accent', wrap: false, shadow: '0 4px 20px rgba(227,179,76,0.35)' },
    {
      id: 'photo',
      kind: 'photo',
      x: 370,
      y: 310,
      w: 340,
      h: 430,
      shape: 'arch',
      ring: { width: 10, color: '$accent', gap: 6, gapColor: '$bg' },
      backdrop: { type: 'glow', color: '$accent', opacity: 0.45, scale: 1.55 },
    },
    { id: 'name', kind: 'text', field: 'name', x: 120, y: 770, w: 840, h: 78, font: 'tiro', size: 54, weight: 700, color: '#ffffff', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 220, y: 848, w: 640, h: 46, size: 29, weight: 600, color: '$accent' },
    { id: 'message', kind: 'text', field: 'message', x: 130, y: 910, w: 820, h: 150, size: 31, weight: 500, color: '$text', lineHeight: 1.55 },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 120, y: H - 112, w: 840, h: 54, size: 27, weight: 700, color: '$accent', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 200, y: H - 58, w: 680, h: 38, size: 21, weight: 500, color: '$text', wrap: false },
  ],
}

export default [simpleGreeting, decorativeGreeting]
