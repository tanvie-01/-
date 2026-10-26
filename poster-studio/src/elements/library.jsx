import React from 'react'
import FitText from '../poster/FitText.jsx'
import PhotoFrame from '../poster/PhotoFrame.jsx'
import { ConfettiArt } from '../components/decor/Confetti.jsx'
import { FloralCornerArt } from '../components/decor/FloralCorner.jsx'
import { LaurelPairArt } from '../components/decor/LaurelWreath.jsx'
import { RaysArt } from '../components/decor/StarBurst.jsx'
import { MedalArt } from '../components/decor/MedalBadge.jsx'
import { BLOB_PATH, Balloon, Bunting, Sparkle, sealPath, starPoints, useSvgId, wavePath } from '../poster/art.jsx'
import { resolveColor } from '../lib/colors.js'
import { POSTER_W, POSTER_H, fontCss, uid } from '../lib/constants.js'
import { emptyPhoto } from '../lib/photo.js'

/*
 * Design elements the user can add on top of any template.
 *
 * An element is plain data: { id, type, variant, x, y, w, h, rotate, opacity,
 * layer: 'back' | 'front', color, color2, … }. Colours are palette tokens
 * ($primary, $accent …) by default so added elements match the current
 * template and follow the রং panel. `ElementView` renders any element; the
 * same renderer draws the poster, the export and the add-element previews.
 */

export const ELEMENT_GROUPS = [
  { id: 'text', label: 'লেখা' },
  { id: 'shapes', label: 'আকৃতি' },
  { id: 'lines', label: 'লাইন ও ডিভাইডার' },
  { id: 'frames', label: 'ফ্রেম ও বর্ডার' },
  { id: 'decor', label: 'সাজসজ্জা' },
  { id: 'badges', label: 'ব্যাজ ও রিবন' },
  { id: 'patterns', label: 'ব্যাকগ্রাউন্ড ও প্যাটার্ন' },
  { id: 'images', label: 'ইমেজ ফ্রেম' },
]

const full = { x: 0, y: 0, w: POSTER_W, h: POSTER_H }

// key → { group, label, defaults }
export const ELEMENT_DEFS = {
  // ---------- text ----------
  'text:heading': { group: 'text', label: 'শিরোনাম', defaults: { type: 'text', w: 760, h: 120, text: 'আপনার শিরোনাম', font: 'baloo', size: 80, weight: 800, color: '$primary', align: 'center' } },
  'text:sub': { group: 'text', label: 'উপশিরোনাম', defaults: { type: 'text', w: 700, h: 70, text: 'উপশিরোনাম লিখুন', font: 'hind', size: 44, weight: 600, color: '$text', align: 'center' } },
  'text:body': { group: 'text', label: 'অনুচ্ছেদ', defaults: { type: 'text', w: 760, h: 160, text: 'এখানে আপনার বার্তা লিখুন। একাধিক লাইনও লেখা যাবে।', font: 'hind', size: 34, weight: 500, color: '$text', align: 'center', lineHeight: 1.5 } },
  'text:script': { group: 'text', label: 'স্ক্রিপ্ট', defaults: { type: 'text', w: 700, h: 140, text: 'শুভেচ্ছা', font: 'galada', size: 100, weight: 400, color: '$accent', align: 'center' } },

  // ---------- shapes ----------
  'shape:rect': { group: 'shapes', label: 'আয়ত', defaults: { type: 'shape', w: 360, h: 220, color: '$primary', color2: '$secondary', fill: 'fill', stroke: 8 } },
  'shape:rounded': { group: 'shapes', label: 'গোল কোণ', defaults: { type: 'shape', w: 360, h: 220, color: '$secondary', color2: '$primary', fill: 'fill', stroke: 8 } },
  'shape:circle': { group: 'shapes', label: 'বৃত্ত', defaults: { type: 'shape', w: 260, h: 260, color: '$accent', color2: '$secondary', fill: 'fill', stroke: 8 } },
  'shape:triangle': { group: 'shapes', label: 'ত্রিভুজ', defaults: { type: 'shape', w: 260, h: 230, color: '$primary', color2: '$accent', fill: 'fill', stroke: 8 } },
  'shape:diamond': { group: 'shapes', label: 'ডায়মন্ড', defaults: { type: 'shape', w: 240, h: 240, color: '$accent', color2: '$primary', fill: 'fill', stroke: 8 } },
  'shape:hexagon': { group: 'shapes', label: 'ষড়ভুজ', defaults: { type: 'shape', w: 260, h: 290, color: '$secondary', color2: '$primary', fill: 'fill', stroke: 8 } },
  'shape:star': { group: 'shapes', label: 'তারা', defaults: { type: 'shape', w: 240, h: 240, color: '$accent', color2: '$primary', fill: 'fill', stroke: 8 } },
  'shape:blob': { group: 'shapes', label: 'অর্গানিক', defaults: { type: 'shape', w: 340, h: 320, color: '$secondary', color2: '$accent', fill: 'gradient', stroke: 8, opacity: 0.9 } },
  'shape:arch': { group: 'shapes', label: 'আর্চ', defaults: { type: 'shape', w: 300, h: 380, color: '$primary', color2: '$secondary', fill: 'fill', stroke: 8 } },

  // ---------- lines ----------
  'line:solid': { group: 'lines', label: 'সরল লাইন', defaults: { type: 'line', w: 600, h: 24, color: '$primary', stroke: 6 } },
  'line:dashed': { group: 'lines', label: 'ড্যাশ', defaults: { type: 'line', w: 600, h: 24, color: '$primary', stroke: 6 } },
  'line:dotted': { group: 'lines', label: 'ডট', defaults: { type: 'line', w: 600, h: 24, color: '$accent', stroke: 10 } },
  'line:double': { group: 'lines', label: 'ডাবল', defaults: { type: 'line', w: 600, h: 30, color: '$accent', stroke: 4 } },
  'line:wave': { group: 'lines', label: 'ঢেউ', defaults: { type: 'line', w: 600, h: 50, color: '$secondary', stroke: 6 } },
  'line:ornament': { group: 'lines', label: 'অলংকৃত', defaults: { type: 'line', w: 640, h: 50, color: '$accent', stroke: 4 } },

  // ---------- frames ----------
  'frame:border': { group: 'frames', label: 'বর্ডার', defaults: { type: 'frame', ...inset(36), color: '$primary', stroke: 10 } },
  'frame:double': { group: 'frames', label: 'ডাবল বর্ডার', defaults: { type: 'frame', ...inset(30), color: '$accent', stroke: 6 } },
  'frame:rounded': { group: 'frames', label: 'গোল কোণ', defaults: { type: 'frame', ...inset(40), color: '$secondary', stroke: 8 } },
  'frame:corners': { group: 'frames', label: 'কোণ ব্র্যাকেট', defaults: { type: 'frame', ...inset(40), color: '$accent', stroke: 10 } },
  'frame:dotted': { group: 'frames', label: 'ডটেড', defaults: { type: 'frame', ...inset(44), color: '$primary', stroke: 8 } },
  'frame:floral': { group: 'frames', label: 'ফুলেল কোণ', defaults: { type: 'frame', ...full, color: '$accent', color2: '$secondary' } },
  'frame:ring': { group: 'frames', label: 'বৃত্ত রিং', defaults: { type: 'frame', w: 460, h: 460, color: '$accent', stroke: 10 } },

  // ---------- decor ----------
  'decor:laurel': { group: 'decor', label: 'লরেল', defaults: { type: 'decor', w: 520, h: 380, color: '$accent' } },
  'decor:rays': { group: 'decor', label: 'রশ্মি', defaults: { type: 'decor', w: 700, h: 700, color: '$accent', opacity: 0.5, layer: 'back' } },
  'decor:confetti': { group: 'decor', label: 'কনফেটি', defaults: { type: 'decor', ...full, color: '$accent', color2: '$primary', layer: 'back' } },
  'decor:floral': { group: 'decor', label: 'ফুল', defaults: { type: 'decor', w: 260, h: 260, color: '$accent', color2: '$secondary' } },
  'decor:sparkles': { group: 'decor', label: 'ঝিকিমিকি', defaults: { type: 'decor', w: 300, h: 220, color: '$accent' } },
  'decor:crescent': { group: 'decor', label: 'চাঁদ-তারা', defaults: { type: 'decor', w: 260, h: 260, color: '$accent' } },
  'decor:balloons': { group: 'decor', label: 'বেলুন', defaults: { type: 'decor', w: 280, h: 420, color: '$primary', color2: '$accent' } },
  'decor:bunting': { group: 'decor', label: 'পতাকা', defaults: { type: 'decor', x: 0, y: 0, w: POSTER_W, h: 170, color: '$primary', color2: '$accent' } },
  'decor:medal': { group: 'decor', label: 'মেডেল', defaults: { type: 'decor', w: 150, h: 240, color: '$accent', color2: '$primary' } },

  // ---------- badges ----------
  'badge:ribbon': { group: 'badges', label: 'রিবন', defaults: { type: 'badge', w: 640, h: 110, text: 'প্রাণঢালা অভিনন্দন', color: '$primary', color2: '$secondary', textColor: '#ffffff', font: 'baloo' } },
  'badge:seal': { group: 'badges', label: 'সিল', defaults: { type: 'badge', w: 240, h: 240, text: 'সেরা\n২০২৬', color: '$accent', color2: '$primary', textColor: '#ffffff', font: 'baloo' } },
  'badge:pill': { group: 'badges', label: 'পিল লেবেল', defaults: { type: 'badge', w: 420, h: 90, text: 'বিশেষ আয়োজন', color: '$accent', color2: '$primary', textColor: '#ffffff', font: 'hind' } },
  'badge:star': { group: 'badges', label: 'স্টার ব্যাজ', defaults: { type: 'badge', w: 260, h: 260, text: '১ম', color: '$accent', color2: '$primary', textColor: '#ffffff', font: 'baloo' } },
  'badge:tag': { group: 'badges', label: 'ট্যাগ', defaults: { type: 'badge', w: 380, h: 100, text: 'নতুন', color: '$primary', color2: '$accent', textColor: '#ffffff', font: 'baloo' } },
  'badge:circle': { group: 'badges', label: 'বৃত্ত ব্যাজ', defaults: { type: 'badge', w: 220, h: 220, text: '২০২৬', color: '$primary', color2: '$accent', textColor: '#ffffff', font: 'baloo' } },

  // ---------- patterns / backgrounds ----------
  'pattern:dots': { group: 'patterns', label: 'ডট প্যাটার্ন', defaults: { type: 'pattern', ...full, color: '$primary', opacity: 0.12, layer: 'back' } },
  'pattern:grid': { group: 'patterns', label: 'গ্রিড', defaults: { type: 'pattern', ...full, color: '$primary', opacity: 0.1, layer: 'back' } },
  'pattern:stripes': { group: 'patterns', label: 'স্ট্রাইপ', defaults: { type: 'pattern', ...full, color: '$accent', opacity: 0.12, layer: 'back' } },
  'pattern:waves': { group: 'patterns', label: 'ঢেউ ব্যান্ড', defaults: { type: 'pattern', x: 0, y: 1050, w: POSTER_W, h: 300, color: '$primary', color2: '$secondary', layer: 'back' } },
  'pattern:gradient': { group: 'patterns', label: 'গ্রেডিয়েন্ট', defaults: { type: 'pattern', ...full, color: '$primary', color2: '$secondary', opacity: 0.85, layer: 'back' } },
  'pattern:corner': { group: 'patterns', label: 'কোণের ব্লব', defaults: { type: 'pattern', x: 620, y: -120, w: 560, h: 520, color: '$accent', color2: '$secondary', opacity: 0.85, layer: 'back' } },
  'pattern:diagonal': { group: 'patterns', label: 'তির্যক ব্লক', defaults: { type: 'pattern', ...full, color: '$primary', color2: '$secondary', opacity: 1, layer: 'back' } },

  // ---------- image frames ----------
  'image:circle': { group: 'images', label: 'বৃত্ত ফ্রেম', defaults: { type: 'image', w: 320, h: 320, shape: 'circle', ringColor: '$accent', ringWidth: 8 } },
  'image:rounded': { group: 'images', label: 'গোল কোণ ফ্রেম', defaults: { type: 'image', w: 360, h: 440, shape: 'rounded', ringColor: '$accent', ringWidth: 0 } },
  'image:arch': { group: 'images', label: 'আর্চ ফ্রেম', defaults: { type: 'image', w: 340, h: 440, shape: 'arch', ringColor: '$primary', ringWidth: 8 } },
  'image:polaroid': { group: 'images', label: 'পোলারয়েড', defaults: { type: 'image', w: 380, h: 420, shape: 'square', ringColor: '#ffffff', ringWidth: 20, rotate: -4 } },
}

function inset(m) {
  return { x: m, y: m, w: POSTER_W - m * 2, h: POSTER_H - m * 2 }
}

export const elementsInGroup = (group) => Object.entries(ELEMENT_DEFS).filter(([, d]) => d.group === group)

/** New element instance for `key`, centred on the poster unless the def places it. */
export function createElement(key) {
  const def = ELEMENT_DEFS[key]
  const [, variant] = key.split(':')
  const d = { rotate: 0, opacity: 1, layer: 'front', ...def.defaults }
  const el = {
    id: uid('el'),
    key,
    variant,
    ...d,
    x: d.x ?? Math.round((POSTER_W - d.w) / 2),
    y: d.y ?? Math.round((POSTER_H - d.h) / 2),
  }
  if (el.type === 'image') el.photo = emptyPhoto()
  return el
}

// What the selection toolbar offers for an element
const TWO_COLOR_VARIANTS = new Set(['ribbon', 'seal', 'star', 'circle', 'waves', 'gradient', 'corner', 'diagonal', 'confetti', 'floral', 'balloons', 'bunting', 'medal'])

export function elementCaps(el) {
  const t = el.type
  return {
    color: t !== 'image',
    color2: (t === 'shape' && el.fill === 'gradient') || (['badge', 'pattern', 'decor', 'frame'].includes(t) && TWO_COLOR_VARIANTS.has(el.variant)),
    fillMode: t === 'shape',
    stroke: t === 'line' || (t === 'frame' && el.variant !== 'floral') || (t === 'shape' && el.fill === 'outline'),
    text: t === 'text' || t === 'badge',
    image: t === 'image',
    // decorative art and circular photos keep their proportions when resized
    lockAspect: t === 'decor' || (t === 'image' && (el.shape === 'circle' || el.shape === 'hex' || el.shape === 'diamond')),
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function ElementView({ el, pal }) {
  const c = (v) => resolveColor(v, pal)
  switch (el.type) {
    case 'text':
      return <TextEl el={el} c={c} />
    case 'shape':
      return <ShapeEl el={el} c={c} />
    case 'line':
      return <LineEl el={el} c={c} />
    case 'frame':
      return <FrameEl el={el} c={c} />
    case 'decor':
      return <DecorEl el={el} c={c} />
    case 'badge':
      return <BadgeEl el={el} c={c} />
    case 'pattern':
      return <PatternEl el={el} c={c} />
    case 'image':
      return (
        <PhotoFrame
          w={el.w}
          h={el.h}
          shape={el.shape}
          ring={el.ringWidth ? { width: el.ringWidth, color: el.ringColor } : null}
          shadow={el.shadow ?? 0.25}
          photo={el.photo}
          pal={pal}
        />
      )
    default:
      return null
  }
}

const Svg = ({ w, h, children, ratio = 'none' }) => (
  <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={ratio} style={{ display: 'block', overflow: 'visible' }}>
    {children}
  </svg>
)

function TextEl({ el, c }) {
  return (
    <FitText
      text={el.text}
      w={el.w}
      h={el.h}
      size={el.size || 48}
      align={el.align || 'center'}
      wrap
      style={{
        fontFamily: fontCss(el.font),
        fontWeight: el.weight || 600,
        color: c(el.color),
        lineHeight: el.lineHeight || 1.35,
        fontStyle: el.italic ? 'italic' : undefined,
        letterSpacing: el.letterSpacing,
        textShadow: el.shadow ? '0 3px 10px rgba(0,0,0,0.35)' : undefined,
      }}
    />
  )
}

function ShapeEl({ el, c }) {
  const gid = useSvgId('sg')
  const { w, h } = el
  const outline = el.fill === 'outline'
  const sw = outline ? el.stroke || 8 : 0
  const p = sw / 2
  const fill = outline ? 'none' : el.fill === 'gradient' ? `url(#${gid})` : c(el.color)
  const common = { fill, stroke: outline ? c(el.color) : 'none', strokeWidth: sw, strokeLinejoin: 'round' }
  let shape
  switch (el.variant) {
    case 'rounded':
      shape = <rect x={p} y={p} width={w - sw} height={h - sw} rx={Math.min(w, h) * 0.16} {...common} />
      break
    case 'circle':
      shape = <ellipse cx={w / 2} cy={h / 2} rx={(w - sw) / 2} ry={(h - sw) / 2} {...common} />
      break
    case 'triangle':
      shape = <polygon points={`${w / 2},${p} ${w - p},${h - p} ${p},${h - p}`} {...common} />
      break
    case 'diamond':
      shape = <polygon points={`${w / 2},${p} ${w - p},${h / 2} ${w / 2},${h - p} ${p},${h / 2}`} {...common} />
      break
    case 'hexagon':
      shape = <polygon points={`${w / 2},${p} ${w - p},${h * 0.25} ${w - p},${h * 0.75} ${w / 2},${h - p} ${p},${h * 0.75} ${p},${h * 0.25}`} {...common} />
      break
    case 'star':
      shape = <polygon points={starPoints(w, h)} {...common} />
      break
    case 'arch':
      shape = <path d={`M${p} ${h - p} L${p} ${w / 2} A ${w / 2 - p} ${w / 2 - p} 0 0 1 ${w - p} ${w / 2} L ${w - p} ${h - p} Z`} {...common} />
      break
    case 'blob':
      shape = <path d={BLOB_PATH} transform={`scale(${w / 100} ${h / 100})`} {...common} strokeWidth={sw / Math.min(w / 100, h / 100)} />
      break
    default:
      shape = <rect x={p} y={p} width={w - sw} height={h - sw} {...common} />
  }
  return (
    <Svg w={w} h={h}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c(el.color)} />
          <stop offset="100%" stopColor={c(el.color2 || el.color)} />
        </linearGradient>
      </defs>
      {shape}
    </Svg>
  )
}

function LineEl({ el, c }) {
  const { w, h } = el
  const t = el.stroke || 6
  const col = c(el.color)
  const y = h / 2
  const base = { stroke: col, strokeWidth: t, fill: 'none', strokeLinecap: 'round' }
  let body
  switch (el.variant) {
    case 'dashed':
      body = <line x1={t} y1={y} x2={w - t} y2={y} {...base} strokeLinecap="butt" strokeDasharray={`${t * 4} ${t * 2.5}`} />
      break
    case 'dotted':
      body = <line x1={t} y1={y} x2={w - t} y2={y} {...base} strokeDasharray={`0 ${t * 2.4}`} />
      break
    case 'double':
      body = (
        <>
          <line x1={0} y1={y - t * 1.5} x2={w} y2={y - t * 1.5} {...base} strokeLinecap="butt" />
          <line x1={0} y1={y + t * 1.5} x2={w} y2={y + t * 1.5} {...base} strokeLinecap="butt" />
        </>
      )
      break
    case 'wave': {
      const amp = Math.max(4, h / 2 - t)
      const waves = Math.max(2, Math.round(w / 120))
      const seg = w / waves
      let d = `M0 ${y}`
      for (let i = 0; i < waves; i++) d += ` q ${seg / 4} ${-amp} ${seg / 2} 0 t ${seg / 2} 0`
      body = <path d={d} {...base} />
      break
    }
    case 'ornament': {
      const r = Math.min(h / 2 - 2, 16)
      body = (
        <>
          <line x1={0} y1={y} x2={w / 2 - r * 2.2} y2={y} {...base} />
          <line x1={w / 2 + r * 2.2} y1={y} x2={w} y2={y} {...base} />
          <polygon points={`${w / 2},${y - r} ${w / 2 + r},${y} ${w / 2},${y + r} ${w / 2 - r},${y}`} fill={col} />
          <circle cx={w / 2 - r * 1.6} cy={y} r={r * 0.32} fill={col} />
          <circle cx={w / 2 + r * 1.6} cy={y} r={r * 0.32} fill={col} />
        </>
      )
      break
    }
    default:
      body = <line x1={t / 2} y1={y} x2={w - t / 2} y2={y} {...base} />
  }
  return <Svg w={w} h={h}>{body}</Svg>
}

function FrameEl({ el, c }) {
  const { w, h } = el
  const t = el.stroke || 8
  const col = c(el.color)
  const p = t / 2
  switch (el.variant) {
    case 'double':
      return (
        <Svg w={w} h={h}>
          <rect x={p} y={p} width={w - t} height={h - t} fill="none" stroke={col} strokeWidth={t} />
          <rect x={t * 3} y={t * 3} width={w - t * 6} height={h - t * 6} fill="none" stroke={col} strokeWidth={t / 2} />
        </Svg>
      )
    case 'rounded':
      return (
        <Svg w={w} h={h}>
          <rect x={p} y={p} width={w - t} height={h - t} rx={Math.min(w, h) * 0.05} fill="none" stroke={col} strokeWidth={t} />
        </Svg>
      )
    case 'dotted':
      return (
        <Svg w={w} h={h}>
          <rect x={p} y={p} width={w - t} height={h - t} rx={t} fill="none" stroke={col} strokeWidth={t} strokeLinecap="round" strokeDasharray={`0 ${t * 2.6}`} />
        </Svg>
      )
    case 'corners': {
      const L = Math.min(w, h) * 0.16
      const d = `M${p} ${L} V${p} H${L} M${w - L} ${p} H${w - p} V${L} M${w - p} ${h - L} V${h - p} H${w - L} M${L} ${h - p} H${p} V${h - L}`
      return (
        <Svg w={w} h={h}>
          <path d={d} fill="none" stroke={col} strokeWidth={t} strokeLinecap="square" />
        </Svg>
      )
    }
    case 'floral': {
      const s = Math.min(w, h) * 0.24
      const k = s / 220
      const colors = { petal: c(el.color), petal2: c(el.color2 || el.color), leaf: '#3f7a4a', center: c(el.color2 || el.color) }
      return (
        <Svg w={w} h={h}>
          <g transform={`scale(${k})`}><FloralCornerArt {...colors} /></g>
          <g transform={`translate(${w} 0) scale(${-k} ${k})`}><FloralCornerArt {...colors} /></g>
          <g transform={`translate(0 ${h}) scale(${k} ${-k})`}><FloralCornerArt {...colors} /></g>
          <g transform={`translate(${w} ${h}) scale(${-k} ${-k})`}><FloralCornerArt {...colors} /></g>
        </Svg>
      )
    }
    case 'ring':
      return (
        <Svg w={w} h={h}>
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - p} ry={h / 2 - p} fill="none" stroke={col} strokeWidth={t} />
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - t * 2.6} ry={h / 2 - t * 2.6} fill="none" stroke={col} strokeWidth={t / 3} opacity="0.7" />
        </Svg>
      )
    default:
      return (
        <Svg w={w} h={h}>
          <rect x={p} y={p} width={w - t} height={h - t} fill="none" stroke={col} strokeWidth={t} />
        </Svg>
      )
  }
}

function DecorEl({ el, c }) {
  const maskId = useSvgId('cm')
  const { w, h } = el
  const col = c(el.color)
  const col2 = c(el.color2 || el.color)
  switch (el.variant) {
    case 'laurel':
      return <Svg w={w} h={h}><LaurelPairArt w={w} h={h} color={col} /></Svg>
    case 'rays':
      return <Svg w={w} h={h}><RaysArt cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2} rays={22} color={col} opacity={1} /></Svg>
    case 'confetti':
      return <Svg w={w} h={h}><ConfettiArt w={w} h={h} colors={[col, col2, '#ffffff', col]} size={Math.max(12, Math.min(w, h) * 0.018)} /></Svg>
    case 'floral':
      return <Svg w={220} h={220} ratio="xMidYMid meet"><FloralCornerArt petal={col} petal2={col2} center={col2} /></Svg>
    case 'sparkles':
      return (
        <Svg w={w} h={h}>
          <Sparkle x={w * 0.3} y={h * 0.45} r={Math.min(w, h) * 0.32} color={col} />
          <Sparkle x={w * 0.72} y={h * 0.25} r={Math.min(w, h) * 0.18} color={col} opacity={0.85} />
          <Sparkle x={w * 0.75} y={h * 0.75} r={Math.min(w, h) * 0.13} color={col} opacity={0.7} />
        </Svg>
      )
    case 'crescent': {
      const r = Math.min(w, h) * 0.36
      return (
        <Svg w={w} h={h}>
          <defs>
            <mask id={maskId}>
              <rect width={w} height={h} fill="#fff" />
              <circle cx={w * 0.42 + r * 0.42} cy={h / 2 - r * 0.18} r={r * 0.86} fill="#000" />
            </mask>
          </defs>
          <circle cx={w * 0.42} cy={h / 2} r={r} fill={col} mask={`url(#${maskId})`} />
          <Sparkle x={w * 0.8} y={h * 0.3} r={r * 0.32} color={col} />
          <Sparkle x={w * 0.84} y={h * 0.62} r={r * 0.18} color={col} />
        </Svg>
      )
    }
    case 'balloons': {
      const r = Math.min(w / 3.2, h / 6)
      return (
        <Svg w={w} h={h}>
          <Balloon x={w * 0.3} y={r * 1.4} r={r} color={col} />
          <Balloon x={w * 0.7} y={r * 1.9} r={r} color={col2} />
          <Balloon x={w * 0.5} y={r * 2.9} r={r * 0.9} color="#ffffff" />
        </Svg>
      )
    }
    case 'bunting':
      return <Svg w={w} h={h}><Bunting w={w} y={8} sag={h * 0.28} flags={Math.max(5, Math.round(w / 90))} colors={[col, col2, '#ffffff']} size={Math.min(56, h * 0.35)} /></Svg>
    case 'medal':
      return <Svg w={100} h={160} ratio="xMidYMid meet"><MedalArt discColor={col} ribbonA={col2} ribbonB={col} /></Svg>
    default:
      return null
  }
}

function BadgeEl({ el, c }) {
  const gid = useSvgId('bg')
  const { w, h } = el
  const col = c(el.color)
  const col2 = c(el.color2 || el.color)
  let shape
  let pad = { x: 0.12, y: 0.16 }
  switch (el.variant) {
    case 'ribbon': {
      const n = h * 0.32
      shape = <polygon points={`0,0 ${w},0 ${w - n},${h / 2} ${w},${h} 0,${h} ${n},${h / 2}`} fill={`url(#${gid})`} />
      pad = { x: 0.1, y: 0.14 }
      break
    }
    case 'seal':
      shape = (
        <>
          <path d={sealPath(Math.min(w, h), 26, 0.07)} transform={`translate(${(w - Math.min(w, h)) / 2} ${(h - Math.min(w, h)) / 2})`} fill={`url(#${gid})`} />
          <ellipse cx={w / 2} cy={h / 2} rx={w * 0.38} ry={h * 0.38} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" opacity="0.8" />
        </>
      )
      pad = { x: 0.22, y: 0.24 }
      break
    case 'pill':
      shape = <rect x={0} y={0} width={w} height={h} rx={h / 2} fill={col} />
      pad = { x: 0.08, y: 0.14 }
      break
    case 'star':
      shape = <polygon points={starPoints(w, h, 12, 0.8)} fill={`url(#${gid})`} />
      pad = { x: 0.26, y: 0.28 }
      break
    case 'tag':
      shape = (
        <>
          <polygon points={`0,0 ${w - h * 0.4},0 ${w},${h / 2} ${w - h * 0.4},${h} 0,${h}`} fill={col} />
          <circle cx={w - h * 0.42} cy={h / 2} r={h * 0.09} fill="#fff" />
        </>
      )
      pad = { x: 0.08, y: 0.16 }
      break
    case 'circle':
      shape = (
        <>
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={col} />
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 10} ry={h / 2 - 10} fill="none" stroke={col2} strokeWidth={4} />
        </>
      )
      pad = { x: 0.2, y: 0.22 }
      break
    default:
      shape = <rect width={w} height={h} fill={col} />
  }
  const px = w * pad.x
  const py = h * pad.y
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Svg w={w} h={h}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={col} />
            <stop offset="100%" stopColor={col2} />
          </linearGradient>
        </defs>
        {shape}
      </Svg>
      <div style={{ position: 'absolute', left: px, top: py }}>
        <FitText
          text={el.text}
          w={w - px * 2}
          h={h - py * 2}
          size={el.size || Math.min(h * 0.5, 72)}
          style={{ fontFamily: fontCss(el.font), fontWeight: 700, color: c(el.textColor || '#ffffff'), lineHeight: 1.15 }}
        />
      </div>
    </div>
  )
}

function PatternEl({ el, c }) {
  const pid = useSvgId('pt')
  const { w, h } = el
  const col = c(el.color)
  const col2 = c(el.color2 || el.color)
  switch (el.variant) {
    case 'dots':
      return (
        <Svg w={w} h={h}>
          <defs>
            <pattern id={pid} width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="4.5" fill={col} />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${pid})`} />
        </Svg>
      )
    case 'grid':
      return (
        <Svg w={w} h={h}>
          <defs>
            <pattern id={pid} width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0 H0 V60" fill="none" stroke={col} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${pid})`} />
        </Svg>
      )
    case 'stripes':
      return (
        <Svg w={w} h={h}>
          <defs>
            <pattern id={pid} width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="16" height="44" fill={col} />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#${pid})`} />
        </Svg>
      )
    case 'waves':
      return (
        <Svg w={w} h={h}>
          <path d={wavePath(w, h, h * 0.35, h * 0.12, 2)} fill={col2} opacity="0.55" />
          <path d={wavePath(w, h, h * 0.5, h * 0.12, 3)} fill={col} />
        </Svg>
      )
    case 'gradient':
      return (
        <Svg w={w} h={h}>
          <defs>
            <linearGradient id={pid} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor={col} />
              <stop offset="100%" stopColor={col2} />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${pid})`} />
        </Svg>
      )
    case 'corner':
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={pid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={col} />
              <stop offset="100%" stopColor={col2} />
            </linearGradient>
          </defs>
          <path d={BLOB_PATH} fill={`url(#${pid})`} />
        </svg>
      )
    case 'diagonal':
      return (
        <Svg w={w} h={h}>
          <polygon points={`0,0 ${w * 0.62},0 ${w * 0.22},${h} 0,${h}`} fill={col} />
          <polygon points={`${w * 0.62},0 ${w * 0.7},0 ${w * 0.3},${h} ${w * 0.22},${h}`} fill={col2} />
        </Svg>
      )
    default:
      return null
  }
}
