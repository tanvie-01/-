import React from 'react'
import { Art, Layer, W, H } from './kit.jsx'
import { useSvgId } from '../poster/art.jsx'
import { withAlpha } from '../lib/colors.js'

// ---------------------------------------------------------------------------
// প্রফেশনাল ইভেন্ট — letterhead band with logo + organiser, bold event
// title, an info card (date / time / venue with icons) and the guest's photo
// paired with name and role.
// ---------------------------------------------------------------------------
function ProBg({ c }) {
  const g = useSvgId('pe')
  return (
    <>
      <Layer style={{ background: c.bg }} />
      <Art>
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.primary} />
            <stop offset="100%" stopColor={withAlpha(c.primary, 0.88)} />
          </linearGradient>
        </defs>
        <rect width={W} height="232" fill={`url(#${g})`} />
        <g opacity="0.08" fill="#ffffff">
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={760 + (i % 7) * 46} cy={40 + Math.floor(i / 7) * 46} r="6" />
          ))}
        </g>
        <rect y="232" width={W} height="12" fill={c.secondary} />
        <rect x="80" y="610" width="140" height="8" rx="4" fill={c.accent} />
        <rect x="70" y="770" width={W - 140} height="236" rx="26" fill="#ffffff" />
        <rect x="70" y="770" width="10" height="236" rx="5" fill={c.secondary} />
        <rect x="70" y="770" width={W - 140} height="236" rx="26" fill="none" stroke={withAlpha(c.primary, 0.1)} strokeWidth="2" />
        <rect y={H - 76} width={W} height="76" fill={c.primary} />
        <rect y={H - 82} width={W} height="6" fill={c.accent} />
      </Art>
    </>
  )
}

const professionalEvent = {
  id: 'professional-event',
  category: 'event',
  name: 'প্রফেশনাল ইভেন্ট',
  en: 'Professional Event',
  palette: { primary: '#16225c', secondary: '#1e7d37', accent: '#d8a53c', bg: '#f6f7fb', text: '#1c2233' },
  Background: ProBg,
  slots: [
    { id: 'logo', kind: 'logo', x: 60, y: 54, w: 124, h: 124, ring: { width: 4, color: '$accent' } },
    { id: 'extra', kind: 'text', field: 'extra', x: 208, y: 58, w: 500, h: 38, size: 23, weight: 600, color: '$accent', align: 'left' },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 208, y: 96, w: 820, h: 92, size: 36, weight: 700, color: '#ffffff', align: 'left', lineHeight: 1.25 },
    { id: 'title', kind: 'text', field: 'title', x: 80, y: 280, w: 920, h: 220, font: 'baloo', size: 80, weight: 800, color: '$primary', align: 'left', lineHeight: 1.18 },
    { id: 'message', kind: 'text', field: 'message', x: 80, y: 506, w: 920, h: 96, size: 29, weight: 500, color: '$text', align: 'left', lineHeight: 1.5 },
    { id: 'date', kind: 'text', field: 'date', x: 110, y: 790, w: 870, h: 62, icon: 'calendar', iconColor: '$secondary', size: 33, weight: 600, color: '$text', align: 'left', wrap: false },
    { id: 'time', kind: 'text', field: 'time', x: 110, y: 858, w: 870, h: 62, icon: 'clock', iconColor: '$secondary', size: 33, weight: 600, color: '$text', align: 'left', wrap: false },
    { id: 'venue', kind: 'text', field: 'venue', x: 110, y: 926, w: 870, h: 62, icon: 'pin', iconColor: '$secondary', size: 33, weight: 600, color: '$text', align: 'left', wrap: false },
    {
      id: 'photo',
      kind: 'photo',
      x: 80,
      y: 1040,
      w: 196,
      h: 196,
      shape: 'circle',
      ring: { width: 6, color: '$accent', gap: 4, gapColor: '#ffffff' },
      shadow: 0.25,
    },
    { id: 'name', kind: 'text', field: 'name', x: 304, y: 1060, w: 700, h: 74, font: 'tiro', size: 48, weight: 700, color: '$primary', align: 'left', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 304, y: 1140, w: 330, h: 54, bg: '$secondary', radius: 27, size: 27, weight: 600, color: '#ffffff', pad: [2, 20], wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 140, y: H - 66, w: 800, h: 52, size: 24, weight: 500, color: '#ffffff', wrap: false },
  ],
}

// ---------------------------------------------------------------------------
// মডার্ন ইভেন্ট — dark, grid-textured, oversized title, highlighted date
// block, and a large framed photo with an offset outline.
// ---------------------------------------------------------------------------
function ModernEventBg({ c }) {
  const p = useSvgId('mg')
  const g = useSvgId('mr')
  return (
    <>
      <Art>
        <defs>
          <pattern id={p} width="54" height="54" patternUnits="userSpaceOnUse">
            <path d="M54 0 H0 V54" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.07" />
          </pattern>
          <radialGradient id={g} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={c.accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={c.bg} />
        <rect width={W} height={H} fill={`url(#${p})`} />
        <circle cx={W - 80} cy="120" r="360" fill={`url(#${g})`} />
        <polygon points={`0,${H - 210} ${W},${H - 380} ${W},${H} 0,${H}`} fill={c.secondary} opacity="0.55" />
        <polygon points={`0,${H - 120} ${W},${H - 260} ${W},${H} 0,${H}`} fill={c.secondary} opacity="0.8" />
        <rect x="80" y="236" width="120" height="8" rx="4" fill={c.accent} />
      </Art>
    </>
  )
}

const modernEvent = {
  id: 'modern-event',
  category: 'event',
  name: 'মডার্ন ইভেন্ট',
  en: 'Modern Event',
  palette: { primary: '#0f1430', secondary: '#283593', accent: '#ffb400', bg: '#0f1430', text: '#ffffff' },
  Background: ModernEventBg,
  slots: [
    { id: 'extra', kind: 'text', field: 'extra', x: 80, y: 76, w: 600, h: 40, size: 24, weight: 600, color: '$accent', align: 'left' },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 80, y: 118, w: 700, h: 100, size: 32, weight: 700, color: '#ffffff', align: 'left', lineHeight: 1.25 },
    { id: 'logo', kind: 'logo', x: 870, y: 70, w: 140, h: 140, ring: { width: 4, color: '$accent' } },
    { id: 'title', kind: 'text', field: 'title', x: 80, y: 270, w: 920, h: 260, font: 'baloo', size: 92, weight: 800, color: '#ffffff', align: 'left', lineHeight: 1.12 },
    { id: 'date', kind: 'text', field: 'date', x: 80, y: 570, w: 450, h: 130, bg: '$accent', radius: 20, font: 'baloo', size: 46, weight: 800, color: '$primary', pad: [10, 26], align: 'left', lineHeight: 1.15 },
    { id: 'time', kind: 'text', field: 'time', x: 80, y: 722, w: 450, h: 58, icon: 'clock', iconColor: '$accent', size: 31, weight: 600, color: '#ffffff', align: 'left', wrap: false },
    { id: 'venue', kind: 'text', field: 'venue', x: 80, y: 790, w: 450, h: 110, icon: 'pin', iconColor: '$accent', size: 29, weight: 600, color: '#ffffff', align: 'left', lineHeight: 1.35 },
    { id: 'message', kind: 'text', field: 'message', x: 80, y: 920, w: 450, h: 170, size: 28, weight: 500, color: 'rgba(255,255,255,0.82)', align: 'left', lineHeight: 1.5 },
    {
      id: 'photo',
      kind: 'photo',
      x: 590,
      y: 570,
      w: 400,
      h: 500,
      shape: 'rounded',
      backdrop: { type: 'offset', color: '$accent', dx: 24, dy: 24, outline: true, width: 5 },
      shadow: 0.45,
    },
    { id: 'name', kind: 'text', field: 'name', x: 590, y: 1098, w: 420, h: 66, font: 'baloo', size: 46, weight: 700, color: '#ffffff', align: 'left', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 590, y: 1162, w: 420, h: 46, size: 27, weight: 600, color: '$accent', align: 'left', wrap: false },
    { id: 'orgLocation', kind: 'text', field: 'orgLocation', x: 80, y: H - 70, w: 920, h: 42, size: 23, weight: 500, color: 'rgba(255,255,255,0.8)', align: 'left', wrap: false },
  ],
}

export default [professionalEvent, modernEvent]
