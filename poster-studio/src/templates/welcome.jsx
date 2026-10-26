import React from 'react'
import { Art, Layer, FrameLines, CornerDiamonds, W, H } from './kit.jsx'
import { FloralCornerArt } from '../components/decor/FloralCorner.jsx'
import { Bunting, Sparkle, useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// ক্লিন স্বাগতম — airy, framed, script "স্বাগতম", arch portrait with a
// fine outline echoing the frame.
// ---------------------------------------------------------------------------
function CleanBg({ c }) {
  return (
    <>
      <Layer style={{ background: `linear-gradient(180deg, #ffffff 0%, ${c.bg} 100%)` }} />
      <Art>
        <g opacity="0.55">
          <g transform="translate(46 46) scale(0.9)">
            <FloralCornerArt petal={c.accent} petal2={c.secondary} leaf={c.primary} center={c.accent} />
          </g>
          <g transform={`translate(${W - 46} ${H - 46}) scale(-0.9 -0.9)`}>
            <FloralCornerArt petal={c.accent} petal2={c.secondary} leaf={c.primary} center={c.accent} />
          </g>
        </g>
        <FrameLines inset={30} gap={12} color={c.accent} outer={3} inner={1.2} />
        <CornerDiamonds inset={30} color={c.accent} size={12} />
        <circle cx={W / 2} cy="660" r="330" fill={withAlpha(c.secondary, 0.07)} />
      </Art>
    </>
  )
}

const cleanWelcome = {
  id: 'clean-welcome',
  category: 'welcome',
  name: 'ক্লিন স্বাগতম',
  en: 'Clean Welcome',
  palette: { primary: '#1e5f74', secondary: '#2a9d8f', accent: '#c9a227', bg: '#f6f2e8', text: '#1f2a30' },
  Background: CleanBg,
  slots: [
    { id: 'logo', kind: 'logo', x: 490, y: 74, w: 100, h: 100, ring: { width: 3, color: '$accent' } },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 130, y: 182, w: 820, h: 54, size: 28, weight: 700, color: '$primary' },
    { id: 'title', kind: 'text', field: 'title', x: 140, y: 236, w: 800, h: 170, font: 'galada', size: 150, weight: 400, color: '$primary', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 355,
      y: 420,
      w: 370,
      h: 460,
      shape: 'arch',
      ring: { width: 8, color: '$accent', gap: 6, gapColor: '#ffffff' },
      backdrop: { type: 'outline', color: '$accent', gap: 20, width: 2 },
      shadow: 0.22,
    },
    { id: 'name', kind: 'text', field: 'name', x: 110, y: 918, w: 860, h: 82, font: 'tiro', size: 58, weight: 700, color: '$text', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 250, y: 1004, w: 580, h: 54, bg: '$primary', radius: 27, size: 29, weight: 600, color: '#ffffff', pad: [4, 26], wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 150, y: 1078, w: 780, h: 112, size: 31, weight: 500, color: '$text', lineHeight: 1.5 },
    { id: 'date', kind: 'text', field: 'date', x: 300, y: 1208, w: 480, h: 42, size: 25, weight: 600, color: '$secondary' },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 200, y: 1252, w: 680, h: 38, size: 21, weight: 500, color: '$text' },
  ],
}

// ---------------------------------------------------------------------------
// রঙিন স্বাগতম — vivid gradient, bunting, glowing circular photo ringed
// with dots, name in white with a translucent role pill.
// ---------------------------------------------------------------------------
function ColorfulBg({ c }) {
  const g = useSvgId('cw')
  return (
    <>
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={c.primary} />
            <stop offset="100%" stopColor={c.secondary} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${g})`} />
        <circle cx="-60" cy="980" r="320" fill="#ffffff" opacity="0.07" />
        <circle cx={W + 40} cy="380" r="300" fill="#ffffff" opacity="0.08" />
        <circle cx={W - 160} cy={H + 60} r="260" fill={c.accent} opacity="0.12" />
        <Bunting w={W} y={-6} sag={44} flags={13} colors={[c.accent, '#ffffff', c.secondary]} size={48} />
        <Sparkle x={150} y={300} r={26} color={c.accent} />
        <Sparkle x={930} y={250} r={20} color="#ffffff" opacity={0.85} />
        <Sparkle x={970} y={820} r={16} color={c.accent} />
        <Sparkle x={110} y={760} r={14} color="#ffffff" opacity={0.7} />
      </Art>
    </>
  )
}

const colorfulWelcome = {
  id: 'colorful-welcome',
  category: 'welcome',
  name: 'রঙিন স্বাগতম',
  en: 'Colorful Welcome',
  palette: { primary: '#5b2a8c', secondary: '#e0457b', accent: '#ffc93c', bg: '#5b2a8c', text: '#ffffff' },
  Background: ColorfulBg,
  slots: [
    { id: 'orgName', kind: 'text', field: 'orgName', x: 110, y: 140, w: 860, h: 56, size: 28, weight: 700, color: '#ffffff' },
    { id: 'title', kind: 'text', field: 'title', x: 300, y: 206, w: 480, h: 112, bg: '$accent', radius: 56, font: 'baloo', size: 76, weight: 800, color: '$primary', pad: [4, 30], wrap: false, boxShadow: '0 14px 30px -12px rgba(0,0,0,0.4)' },
    {
      id: 'photo',
      kind: 'photo',
      x: 330,
      y: 372,
      w: 420,
      h: 420,
      shape: 'circle',
      ring: { width: 14, color: '#ffffff' },
      backdrop: [
        { type: 'glow', color: '#ffffff', opacity: 0.35, scale: 1.7 },
        { type: 'dots', color: '$accent', scale: 1.2, count: 56, dot: 6 },
      ],
      shadow: 0.4,
    },
    { id: 'name', kind: 'text', field: 'name', x: 90, y: 850, w: 900, h: 96, font: 'baloo', size: 74, weight: 800, color: '#ffffff', wrap: false, shadow: '0 4px 14px rgba(0,0,0,0.25)' },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 250, y: 948, w: 580, h: 58, bg: 'rgba(255,255,255,0.18)', radius: 29, size: 31, weight: 600, color: '#ffffff', pad: [4, 26], wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 120, y: 1030, w: 840, h: 128, size: 33, weight: 500, color: '#ffffff', lineHeight: 1.5 },
    { id: 'logo', kind: 'logo', x: 90, y: 1200, w: 100, h: 100, ring: { width: 3, color: '$accent' } },
    { id: 'date', kind: 'text', field: 'date', x: 210, y: 1212, w: 500, h: 40, size: 25, weight: 700, color: '$accent', align: 'left' },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 210, y: 1252, w: 780, h: 40, size: 23, weight: 500, color: '#ffffff', align: 'left' },
  ],
}

export default [cleanWelcome, colorfulWelcome]
