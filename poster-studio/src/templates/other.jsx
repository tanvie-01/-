import React from 'react'
import { Art, Layer, Ornament, FrameLines, CornerDiamonds, W, H } from './kit.jsx'
import { FloralCornerArt } from '../components/decor/FloralCorner.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// বিদায় সংবর্ধনা — soft watercolour washes and flowers, organic-shaped
// portrait over a tinted blob.
// ---------------------------------------------------------------------------
function FarewellBg({ c }) {
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Layer
        style={{
          background: `radial-gradient(38% 30% at 8% 6%, ${withAlpha(c.secondary, 0.45)} 0%, transparent 100%), radial-gradient(40% 32% at 96% 96%, ${withAlpha(c.accent, 0.35)} 0%, transparent 100%), radial-gradient(30% 22% at 92% 12%, ${withAlpha(c.accent, 0.2)} 0%, transparent 100%)`,
        }}
      />
      <Art>
        <g transform="translate(0 0) scale(1.05)">
          <FloralCornerArt petal={c.secondary} petal2={c.accent} leaf="#6b8f5e" center={c.primary} />
        </g>
        <g transform={`translate(${W} ${H}) scale(-1.05 -1.05)`}>
          <FloralCornerArt petal={c.secondary} petal2={c.accent} leaf="#6b8f5e" center={c.primary} />
        </g>
        <Ornament cx={W / 2} y={1138} width={460} color={withAlpha(c.primary, 0.5)} size={8} stroke={1.5} />
      </Art>
    </>
  )
}

const farewell = {
  id: 'farewell-bloom',
  category: 'other',
  name: 'বিদায় সংবর্ধনা',
  en: 'Farewell Bloom',
  palette: { primary: '#8c4a3c', secondary: '#d99a8b', accent: '#d9a441', bg: '#fdf6f0', text: '#3d2a24' },
  Background: FarewellBg,
  slots: [
    { id: 'orgName', kind: 'text', field: 'orgName', x: 170, y: 84, w: 740, h: 56, size: 28, weight: 700, color: '$primary' },
    { id: 'title', kind: 'text', field: 'title', x: 140, y: 140, w: 800, h: 150, font: 'galada', size: 116, weight: 400, color: '$primary', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 330,
      y: 318,
      w: 420,
      h: 470,
      shape: 'blob',
      ring: { width: 10, color: '#ffffff' },
      backdrop: { type: 'blob', color: '$secondary', color2: '$accent', scale: 1.26, opacity: 0.55, rotate: 24, dx: 14, dy: 10 },
      shadow: 0.22,
    },
    { id: 'name', kind: 'text', field: 'name', x: 110, y: 826, w: 860, h: 82, font: 'tiro', size: 58, weight: 700, color: '$text', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 230, y: 908, w: 620, h: 50, size: 31, weight: 600, color: '$primary', wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 140, y: 976, w: 800, h: 140, size: 31, weight: 500, color: '$text', lineHeight: 1.55 },
    { id: 'date', kind: 'text', field: 'date', x: 300, y: 1160, w: 480, h: 44, size: 26, weight: 600, color: '$accent', wrap: false },
    { id: 'logo', kind: 'logo', x: 495, y: 1218, w: 90, h: 90, ring: { width: 3, color: '$secondary' } },
  ],
}

// ---------------------------------------------------------------------------
// শোক বার্তা — restrained condolence: near-black, silver hairlines, a
// grayscale portrait with a soft glow, mourning sash in the corner.
// ---------------------------------------------------------------------------
function CondolenceBg({ c }) {
  return (
    <>
      <Layer style={{ background: `radial-gradient(80% 60% at 50% 30%, ${c.secondary} 0%, ${c.bg} 75%)` }} />
      <Art>
        <FrameLines inset={30} gap={10} color={withAlpha(c.accent, 0.55)} outer={1.5} inner={0.8} />
        <polygon points={`${W - 260},0 ${W - 170},0 ${W},170 ${W},260`} fill="#000000" />
        <polygon points={`${W - 248},0 ${W - 236},0 ${W},236 ${W},248`} fill={withAlpha(c.accent, 0.5)} />
        <g opacity="0.12">
          <g transform={`translate(30 ${H - 30}) scale(1.1 -1.1)`}>
            <FloralCornerArt petal="#ffffff" petal2="#ffffff" leaf="#ffffff" center="#ffffff" />
          </g>
        </g>
        <Ornament cx={W / 2} y={906} width={440} color={withAlpha(c.accent, 0.6)} size={7} stroke={1.2} />
      </Art>
    </>
  )
}

const condolence = {
  id: 'condolence',
  category: 'other',
  name: 'শোক বার্তা',
  en: 'Condolence',
  palette: { primary: '#1d1d1f', secondary: '#2c2c30', accent: '#cfcfcf', bg: '#111113', text: '#ececec' },
  labels: { subtitle: 'পরিচয়', date: 'জন্ম-মৃত্যু তারিখ', message: 'শোক বার্তা' },
  defaults: {
    topLine: 'ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন',
    title: 'গভীর শোক',
    name: 'মরহুম আব্দুল হক',
    subtitle: 'সাবেক সভাপতি',
    date: 'জন্ম: ১৯৫২ — মৃত্যু: ২০২৬',
    message: 'তাঁর বিদেহী আত্মার মাগফিরাত কামনা করছি এবং শোকসন্তপ্ত পরিবারের প্রতি গভীর সমবেদনা জানাচ্ছি।',
  },
  Background: CondolenceBg,
  slots: [
    { id: 'topLine', kind: 'text', field: 'topLine', x: 110, y: 90, w: 860, h: 60, size: 33, weight: 600, color: '$accent', wrap: false },
    { id: 'title', kind: 'text', field: 'title', x: 140, y: 162, w: 800, h: 112, font: 'tiro', size: 80, weight: 700, color: '#ffffff', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 360,
      y: 314,
      w: 360,
      h: 360,
      shape: 'circle',
      ring: { width: 5, color: '#d9d9d9', gap: 7, gapColor: '$bg' },
      backdrop: { type: 'glow', color: '#ffffff', opacity: 0.14, scale: 1.7 },
      filter: 'grayscale(1) contrast(1.05)',
      placeholder: 'dark',
    },
    { id: 'name', kind: 'text', field: 'name', x: 110, y: 712, w: 860, h: 84, font: 'tiro', size: 58, weight: 700, color: '#ffffff', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 200, y: 798, w: 680, h: 46, size: 29, weight: 600, color: '$accent', wrap: false },
    { id: 'date', kind: 'text', field: 'date', x: 200, y: 846, w: 680, h: 44, size: 26, weight: 500, color: '$accent', wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 130, y: 934, w: 820, h: 210, size: 32, weight: 500, color: '$text', lineHeight: 1.6 },
    { id: 'orgName', kind: 'text', field: 'orgName', prefix: 'শোকাহত: ', x: 100, y: 1186, w: 880, h: 64, size: 27, weight: 600, color: '#ffffff', lineHeight: 1.3 },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 200, y: 1254, w: 680, h: 38, size: 21, weight: 500, color: '$accent', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// মিনিমাল ফ্রেম — quiet, versatile: thin gold frame, rounded portrait with a
// white mat, serif type. Works for almost any occasion.
// ---------------------------------------------------------------------------
function MinimalBg({ c }) {
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Art>
        <FrameLines inset={40} gap={12} color={c.primary} outer={2} inner={1} />
        <CornerDiamonds inset={40} color={c.primary} size={10} />
        <Ornament cx={W / 2} y={930} width={360} color={c.secondary} size={8} stroke={1.5} />
      </Art>
    </>
  )
}

const minimalFrame = {
  id: 'minimal-frame',
  category: 'other',
  name: 'মিনিমাল ফ্রেম',
  en: 'Minimal Frame',
  palette: { primary: '#8a6c2f', secondary: '#c4a55e', accent: '#8a6c2f', bg: '#fbf8f1', text: '#2a2620' },
  Background: MinimalBg,
  slots: [
    { id: 'logo', kind: 'logo', x: 492, y: 88, w: 96, h: 96, ring: { width: 2, color: '$primary' } },
    { id: 'title', kind: 'text', field: 'title', x: 140, y: 200, w: 800, h: 100, font: 'tiro', size: 66, weight: 700, color: '$primary', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 370,
      y: 326,
      w: 340,
      h: 420,
      shape: 'rounded',
      ring: { width: 2, color: '$primary', gap: 12, gapColor: '#ffffff' },
      shadow: 0.18,
    },
    { id: 'name', kind: 'text', field: 'name', x: 120, y: 780, w: 840, h: 78, font: 'tiro', size: 54, weight: 700, color: '$text', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 180, y: 860, w: 720, h: 46, size: 28, weight: 600, color: '$primary', wrap: false },
    { id: 'message', kind: 'text', field: 'message', x: 150, y: 958, w: 780, h: 150, size: 30, weight: 500, color: '$text', lineHeight: 1.55 },
    { id: 'date', kind: 'text', field: 'date', x: 300, y: 1122, w: 480, h: 42, size: 25, weight: 600, color: '$secondary', wrap: false },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 130, y: 1178, w: 820, h: 64, size: 27, weight: 700, color: '$primary', lineHeight: 1.3 },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 200, y: 1244, w: 680, h: 38, size: 21, weight: 500, color: '$text', wrap: false },
  ],
}

export default [farewell, condolence, minimalFrame]
