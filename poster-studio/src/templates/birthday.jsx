import React from 'react'
import { Art, Layer, W, H } from './kit.jsx'
import { ConfettiArt } from '../components/decor/Confetti.jsx'
import { Balloon, Bunting, Sparkle, useSvgId, wavePath } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// বেলুন বার্থডে — pastel party: bunting, balloons on both sides, circular
// photo ringed with dots, name in a playful bold face, wave footer.
// ---------------------------------------------------------------------------
function BalloonBg({ c }) {
  return (
    <>
      <Layer style={{ background: `linear-gradient(180deg, ${c.bg} 0%, #ffffff 55%, ${c.bg} 100%)` }} />
      <Art>
        <g opacity="0.55">
          <ConfettiArt w={W} h={H} colors={[c.primary, c.secondary, c.accent, '#4dabf7']} size={15} />
        </g>
        <Bunting w={W} y={-4} sag={46} flags={12} colors={[c.primary, c.accent, c.secondary, '#4dabf7']} size={50} />
        <Balloon x={110} y={420} r={58} color={c.primary} />
        <Balloon x={190} y={540} r={48} color={c.accent} />
        <Balloon x={84} y={640} r={40} color={c.secondary} />
        <Balloon x={W - 110} y={440} r={58} color={c.secondary} />
        <Balloon x={W - 196} y={560} r={46} color={c.primary} />
        <Balloon x={W - 86} y={660} r={40} color={c.accent} />
        <path d={wavePath(W, H, H - 130, 26, 3)} fill={withAlpha(c.primary, 0.35)} />
        <path d={wavePath(W, H, H - 100, 22, 2)} fill={c.primary} />
      </Art>
    </>
  )
}

const balloonBirthday = {
  id: 'balloon-birthday',
  category: 'birthday',
  name: 'বেলুন বার্থডে',
  en: 'Balloon Birthday',
  palette: { primary: '#e64980', secondary: '#7950f2', accent: '#fcc419', bg: '#fff0f6', text: '#3b1029' },
  Background: BalloonBg,
  slots: [
    { id: 'title', kind: 'text', field: 'title', x: 150, y: 168, w: 780, h: 180, font: 'galada', size: 150, weight: 400, color: '$primary', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 330,
      y: 378,
      w: 420,
      h: 420,
      shape: 'circle',
      ring: { width: 14, color: '#ffffff' },
      backdrop: { type: 'dots', color: '$secondary', scale: 1.18, count: 52, dot: 6 },
      shadow: 0.3,
    },
    { id: 'name', kind: 'text', field: 'name', x: 100, y: 846, w: 880, h: 100, font: 'baloo', size: 82, weight: 800, color: '$secondary', wrap: false },
    { id: 'date', kind: 'text', field: 'date', x: 380, y: 950, w: 320, h: 58, bg: '$accent', radius: 29, size: 29, weight: 700, color: '$text', pad: [4, 18], wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 140, y: 1028, w: 800, h: 120, size: 33, weight: 500, color: '$text', lineHeight: 1.5 },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 120, y: H - 82, w: 840, h: 56, size: 25, weight: 700, color: '#ffffff', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// কনফেটি বার্থডে — night-party purple, gold script heading, a tilted
// polaroid portrait and confetti all around.
// ---------------------------------------------------------------------------
function ConfettiBg({ c }) {
  const g = useSvgId('cb')
  return (
    <>
      <Art>
        <defs>
          <radialGradient id={g} cx="0.5" cy="0.38" r="0.75">
            <stop offset="0%" stopColor={c.secondary} />
            <stop offset="100%" stopColor={c.bg} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${g})`} />
        <ConfettiArt w={W} h={H} colors={[c.accent, '#ff6b9a', '#ffffff', '#38d9a9']} size={20} />
        <Sparkle x={120} y={520} r={22} color={c.accent} />
        <Sparkle x={960} y={440} r={26} color={c.accent} />
        <Sparkle x={930} y={980} r={14} color="#ffffff" opacity={0.8} />
        <Sparkle x={160} y={1000} r={16} color="#ffffff" opacity={0.7} />
      </Art>
    </>
  )
}

const confettiBirthday = {
  id: 'confetti-birthday',
  category: 'birthday',
  name: 'কনফেটি বার্থডে',
  en: 'Confetti Birthday',
  palette: { primary: '#2d1b69', secondary: '#5f3dc4', accent: '#ffd43b', bg: '#1a0f40', text: '#ffffff' },
  Background: ConfettiBg,
  slots: [
    { id: 'title', kind: 'text', field: 'title', x: 90, y: 96, w: 900, h: 170, font: 'galada', size: 136, weight: 400, color: '$accent', wrap: false, shadow: '0 6px 24px rgba(0,0,0,0.35)' },
    { id: 'photo', kind: 'photo', x: 300, y: 300, w: 480, h: 540, shape: 'square', rotate: -4, ring: { width: 22, color: '#ffffff' }, shadow: 0.5 },
    { id: 'name', kind: 'text', field: 'name', x: 100, y: 892, w: 880, h: 100, font: 'baloo', size: 80, weight: 800, color: '#ffffff', wrap: false },
    { id: 'date', kind: 'text', field: 'date', x: 370, y: 996, w: 340, h: 58, bg: 'rgba(255,255,255,0.15)', radius: 29, size: 30, weight: 700, color: '$accent', pad: [4, 18], wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 140, y: 1076, w: 800, h: 124, size: 33, weight: 500, color: '#ffffff', lineHeight: 1.5 },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 120, y: 1242, w: 840, h: 56, size: 25, weight: 600, color: 'rgba(255,255,255,0.8)', wrap: false },
  ],
}

export default [balloonBirthday, confettiBirthday]
