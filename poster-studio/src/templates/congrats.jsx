import React from 'react'
import { Art, Layer, W, H } from './kit.jsx'
import { ConfettiArt } from '../components/decor/Confetti.jsx'
import { useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// এলিগেন্ট সেরিমনি — the organisation's classic committee-congratulation
// poster (ported from the original "Emerald Ceremony" template): bismillah,
// logo, org name, session pill, haloed circular photo, name, ribbon message.
// ---------------------------------------------------------------------------
function EmeraldBg({ c }) {
  const g = useSvgId('em')
  return (
    <>
      <Layer style={{ background: `radial-gradient(120% 80% at 50% 0%, #fffaf0 0%, ${c.bg} 48%, ${withAlpha(c.accent, 0.35)} 130%)` }} />
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.secondary} />
            <stop offset="100%" stopColor={c.primary} />
          </linearGradient>
        </defs>
        <path d="M0,0 L300,0 C190,130 80,200 0,214 Z" fill={`url(#${g})`} opacity="0.92" />
        <path d={`M${W},0 L${W - 300},0 C${W - 190},130 ${W - 80},200 ${W},214 Z`} fill={c.accent} opacity="0.88" />
        <path d={`M0,${H - 135} L0,${H - 260} C60,${H - 220} 120,${H - 165} 150,${H - 135} Z`} fill={c.accent} opacity="0.5" />
        <path d={`M${W},${H - 135} L${W},${H - 260} C${W - 60},${H - 220} ${W - 120},${H - 165} ${W - 150},${H - 135} Z`} fill={c.secondary} opacity="0.45" />
        <rect x="0" y={H - 135} width={W} height="135" fill={`url(#${g})`} />
        <rect x="0" y={H - 141} width={W} height="6" fill={c.accent} />
      </Art>
    </>
  )
}

const emerald = {
  id: 'emerald',
  category: 'congrats',
  name: 'এলিগেন্ট সেরিমনি',
  en: 'Elegant Ceremony',
  palette: { primary: '#0f6e5e', secondary: '#1c9c6e', accent: '#d8a53c', bg: '#f4ebcd', text: '#173226' },
  Background: EmeraldBg,
  slots: [
    { id: 'topLine', kind: 'text', field: 'topLine', x: 140, y: 34, w: 800, h: 44, size: 25, weight: 600, color: '$primary' },
    { id: 'logo', kind: 'logo', x: 478, y: 88, w: 124, h: 124, ring: { width: 4, color: '$accent', gap: 3, gapColor: '#ffffff' }, shadow: 0.2 },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 110, y: 222, w: 860, h: 104, font: 'tiro', size: 42, weight: 700, color: '$primary', lineHeight: 1.35 },
    { id: 'date', kind: 'text', field: 'date', x: 370, y: 334, w: 340, h: 68, bg: '$primary', radius: '24px 24px 6px 6px', font: 'tiro', size: 38, weight: 800, color: '#ffffff', pad: [4, 22], boxShadow: '0 12px 22px -12px rgba(0,0,0,0.45)' },
    { id: 'extra', kind: 'text', field: 'extra', x: 220, y: 408, w: 640, h: 40, size: 23, weight: 600, color: '$primary' },
    {
      id: 'photo',
      kind: 'photo',
      x: 345,
      y: 478,
      w: 390,
      h: 390,
      shape: 'circle',
      ring: { width: 12, color: 'linear-gradient(135deg,$accent,#f7e2a1 45%,$accent)', gap: 6, gapColor: '#ffffff' },
      backdrop: { type: 'halo', color: '$primary', color2: '$secondary', scale: 1.2 },
      shadow: 0.3,
    },
    { id: 'name', kind: 'text', field: 'name', x: 90, y: 912, w: 900, h: 74, font: 'tiro', size: 52, weight: 700, color: '#b8323f', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 140, y: 984, w: 800, h: 46, size: 28, weight: 600, color: '$text' },
    { id: 'message', kind: 'text', field: 'message', x: 140, y: 1034, w: 800, h: 38, size: 23, weight: 600, color: '$text' },
    { id: 'title', kind: 'text', field: 'title', x: 190, y: 1078, w: 700, h: 92, ribbon: true, bg: 'linear-gradient(90deg,#b8323f,#e0693f)', font: 'tiro', size: 46, weight: 800, color: '#fffdf5', pad: [6, 74], wrap: false },
    { id: 'motto', kind: 'text', field: 'motto', x: 80, y: H - 122, w: 920, h: 50, size: 30, weight: 700, color: '#ffffff', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 140, y: H - 70, w: 800, h: 42, size: 22, weight: 500, color: '#ffffff', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// মডার্ন সেলিব্রেশন — diagonal colour block, big script heading on the
// left, tall portrait on the right with an offset accent block behind it.
// ---------------------------------------------------------------------------
function ModernBg({ c }) {
  const g = useSvgId('mc')
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.primary} />
            <stop offset="100%" stopColor={c.secondary} />
          </linearGradient>
        </defs>
        <polygon points={`0,0 ${W},0 ${W},560 0,790`} fill={`url(#${g})`} />
        <polygon points={`0,790 ${W},560 ${W},590 0,822`} fill={c.accent} />
        <g opacity="0.95">
          <ConfettiArt w={W} h={520} colors={[c.accent, '#ffffff', c.accent, withAlpha('#ffffff', 0.6)]} size={18} />
        </g>
        <g fill={withAlpha(c.primary, 0.14)}>
          {Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, k) => <circle key={`${r}-${k}`} cx={760 + k * 38} cy={880 + r * 38} r="5" />))}
        </g>
        <rect x="70" y="1140" width={W - 140} height="3" fill={withAlpha(c.primary, 0.25)} />
      </Art>
    </>
  )
}

const modernCelebration = {
  id: 'modern-celebration',
  category: 'congrats',
  name: 'মডার্ন সেলিব্রেশন',
  en: 'Modern Celebration',
  palette: { primary: '#16225c', secondary: '#3149b8', accent: '#f5b700', bg: '#f8f6f1', text: '#1c1c1c' },
  defaults: { title: 'অভিনন্দন', message: 'অসাধারণ সাফল্যের জন্য' },
  Background: ModernBg,
  slots: [
    { id: 'title', kind: 'text', field: 'title', x: 64, y: 84, w: 540, h: 180, font: 'galada', size: 140, weight: 400, color: '#ffffff', align: 'left', lineHeight: 1.2, shadow: '0 6px 18px rgba(0,0,0,0.25)' },
    { id: 'message', kind: 'text', field: 'message', x: 70, y: 276, w: 510, h: 110, size: 40, weight: 600, color: '$accent', align: 'left', lineHeight: 1.35 },
    { id: 'extra', kind: 'text', field: 'extra', x: 70, y: 396, w: 500, h: 50, size: 26, weight: 500, color: '#ffffff', align: 'left' },
    {
      id: 'photo',
      kind: 'photo',
      x: 600,
      y: 210,
      w: 410,
      h: 530,
      shape: 'rounded',
      ring: { width: 10, color: '#ffffff' },
      backdrop: { type: 'offset', color: '$accent', dx: -30, dy: 30 },
      shadow: 0.35,
    },
    { id: 'name', kind: 'text', field: 'name', x: 66, y: 840, w: 940, h: 104, font: 'baloo', size: 80, weight: 800, color: '$primary', align: 'left', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 70, y: 944, w: 680, h: 54, size: 36, weight: 600, color: '$text', align: 'left' },
    { id: 'date', kind: 'text', field: 'date', x: 70, y: 1022, w: 290, h: 60, bg: '$accent', radius: 30, font: 'baloo', size: 32, weight: 700, color: '$primary', pad: [4, 18], wrap: false },
    { id: 'logo', kind: 'logo', x: 70, y: 1170, w: 116, h: 116, ring: { width: 3, color: '$primary' } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 206, y: 1170, w: 810, h: 70, size: 32, weight: 700, color: '$primary', align: 'left', lineHeight: 1.25 },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 206, y: 1240, w: 810, h: 44, size: 23, weight: 500, color: '$text', align: 'left' },
  ],
}

export default [emerald, modernCelebration]
