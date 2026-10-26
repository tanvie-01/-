import React from 'react'
import { Art, Layer, Ornament, FrameLines, W, H } from './kit.jsx'
import { MedalArt } from '../components/decor/MedalBadge.jsx'
import { RaysArt } from '../components/decor/StarBurst.jsx'
import { Sparkle, starPoints, useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// গোল্ডেন মেডেল — black & gold honour: rays and a laurel wreath wrap the
// circular portrait, ribbon heading, gold name.
// ---------------------------------------------------------------------------
function GoldenBg({ c }) {
  return (
    <>
      <Layer style={{ background: `radial-gradient(90% 70% at 50% 32%, ${c.secondary} 0%, ${c.bg} 70%)` }} />
      <Art>
        <RaysArt cx={W / 2} cy={420} r={900} rays={28} color={c.accent} opacity={0.05} />
        <FrameLines inset={26} gap={10} color={c.accent} outer={2.5} inner={1} />
        <Ornament cx={W / 2} y={140} width={420} color={c.accent} size={9} stroke={2} />
        <g transform={`translate(${W - 190} 40) scale(1.05)`}>
          <MedalArt discColor={c.accent} ribbonA="#b8323f" ribbonB="#233b6e" />
        </g>
        <Sparkle x={130} y={260} r={22} color={c.accent} />
        <Sparkle x={180} y={560} r={12} color={c.accent} opacity={0.7} />
        <Sparkle x={940} y={620} r={16} color={c.accent} opacity={0.8} />
        <Ornament cx={W / 2} y={1120} width={560} color={withAlpha(c.accent, 0.7)} size={8} stroke={1.5} />
      </Art>
    </>
  )
}

const goldenMedal = {
  id: 'golden-medal',
  category: 'achievement',
  name: 'গোল্ডেন মেডেল',
  en: 'Golden Medal',
  palette: { primary: '#16130c', secondary: '#2e2716', accent: '#e0b44c', bg: '#0f0d08', text: '#fbf3dc' },
  Background: GoldenBg,
  slots: [
    { id: 'extra', kind: 'text', field: 'extra', x: 160, y: 66, w: 760, h: 56, size: 32, weight: 700, color: '$accent', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 340,
      y: 196,
      w: 400,
      h: 400,
      shape: 'circle',
      ring: { width: 12, color: 'linear-gradient(135deg,$accent,#fff1b8 45%,$accent)', gap: 6, gapColor: '$bg' },
      backdrop: [
        { type: 'rays', color: '$accent', opacity: 0.22, scale: 1.8, rays: 24 },
        { type: 'laurel', color: '$accent', scale: 1.55 },
      ],
      shadow: 0.5,
    },
    { id: 'title', kind: 'text', field: 'title', x: 250, y: 676, w: 580, h: 108, ribbon: true, bg: 'linear-gradient(90deg,#a87b28,$accent 50%,#a87b28)', font: 'baloo', size: 64, weight: 800, color: '#1a1406', pad: [6, 72], wrap: false },
    { id: 'name', kind: 'text', field: 'name', x: 80, y: 812, w: 920, h: 104, font: 'baloo', size: 78, weight: 800, color: '$accent', wrap: false, shadow: '0 4px 16px rgba(224,180,76,0.25)' },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 130, y: 916, w: 820, h: 60, size: 37, weight: 700, color: '$text' },
    { id: 'message', kind: 'text', field: 'message', x: 140, y: 986, w: 800, h: 112, size: 30, weight: 500, color: '$text', lineHeight: 1.5 },
    { id: 'logo', kind: 'logo', x: 490, y: 1146, w: 100, h: 100, ring: { width: 3, color: '$accent' } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 110, y: 1250, w: 860, h: 48, size: 28, weight: 700, color: '$accent', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 200, y: 1294, w: 680, h: 34, size: 20, weight: 500, color: '$text', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// স্টার অ্যাচিভমেন্ট — bold diagonals, hexagon portrait on the left with a
// starburst, text column on the right.
// ---------------------------------------------------------------------------
function StarBg({ c }) {
  const g = useSvgId('sa')
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.primary} />
            <stop offset="100%" stopColor={withAlpha(c.primary, 0.85)} />
          </linearGradient>
        </defs>
        <polygon points={`0,0 ${W},0 ${W},150 0,250`} fill={`url(#${g})`} />
        <polygon points={`0,250 ${W},150 ${W},166 0,266`} fill={c.accent} />
        <polygon points={`0,${H - 150} ${W},${H - 290} ${W},${H} 0,${H}`} fill={c.secondary} />
        <polygon points={`0,${H - 166} ${W},${H - 306} ${W},${H - 290} 0,${H - 150}`} fill={c.accent} />
        <polygon points={starPoints(90, 90)} transform="translate(940 300)" fill={c.accent} opacity="0.9" />
        <polygon points={starPoints(50, 50)} transform="translate(980 860)" fill={c.primary} opacity="0.5" />
        <polygon points={starPoints(40, 40)} transform="translate(560 960)" fill={c.accent} opacity="0.6" />
        <g fill={withAlpha(c.secondary, 0.12)}>
          {Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, k) => <circle key={`${r}${k}`} cx={60 + k * 34} cy={880 + r * 34} r="5" />))}
        </g>
      </Art>
    </>
  )
}

const starAchievement = {
  id: 'star-achievement',
  category: 'achievement',
  name: 'স্টার অ্যাচিভমেন্ট',
  en: 'Star Achievement',
  palette: { primary: '#b8323f', secondary: '#16225c', accent: '#f5b700', bg: '#ffffff', text: '#1c1c1c' },
  Background: StarBg,
  slots: [
    { id: 'extra', kind: 'text', field: 'extra', x: 70, y: 60, w: 900, h: 70, size: 38, weight: 700, color: '#ffffff', align: 'left', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 70,
      y: 320,
      w: 450,
      h: 510,
      shape: 'hex',
      ring: { width: 12, color: '$accent' },
      backdrop: { type: 'rays', color: '$accent', opacity: 0.3, scale: 1.55, rays: 18 },
      shadow: 0.3,
    },
    { id: 'title', kind: 'text', field: 'title', x: 560, y: 320, w: 460, h: 120, font: 'baloo', size: 86, weight: 800, color: '$primary', align: 'left', wrap: false },
    { id: 'name', kind: 'text', field: 'name', x: 560, y: 444, w: 460, h: 170, font: 'baloo', size: 64, weight: 800, color: '$secondary', align: 'left', lineHeight: 1.15 },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 560, y: 626, w: 460, h: 96, bg: '$accent', radius: 14, size: 31, weight: 700, color: '$secondary', pad: [8, 20], align: 'left', lineHeight: 1.3 },
    { id: 'message', kind: 'text', field: 'message', x: 560, y: 740, w: 460, h: 170, size: 29, weight: 500, color: '$text', align: 'left', lineHeight: 1.5 },
    { id: 'logo', kind: 'logo', x: 890, y: H - 196, w: 130, h: 130, ring: { width: 4, color: '$accent' } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 70, y: H - 160, w: 790, h: 76, size: 31, weight: 700, color: '#ffffff', align: 'left', lineHeight: 1.25 },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 70, y: H - 80, w: 790, h: 44, size: 23, weight: 500, color: 'rgba(255,255,255,0.85)', align: 'left', wrap: false },
  ],
}

export default [goldenMedal, starAchievement]
