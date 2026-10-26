import React from 'react'
import PhotoFill from './PhotoFill.jsx'
import { RaysArt } from '../components/decor/StarBurst.jsx'
import { LaurelPairArt } from '../components/decor/LaurelWreath.jsx'
import { BLOB_PATH, sealPath, useSvgId } from './art.jsx'
import { resolveColor } from '../lib/colors.js'

/**
 * A shaped image frame: optional decorative backdrop(s) behind it (halo,
 * rays, laurel, offset block…), an optional ring + gap border, and the photo
 * itself clipped to the shape. Everything is sized from the frame box, so the
 * decoration moves and scales together with the photo when the user drags or
 * resizes it — the photo always looks composed into the poster rather than
 * pasted on top.
 */

export function shapeStyle(shape, w, h) {
  const m = Math.min(w, h)
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' }
    case 'rounded':
      return { borderRadius: m * 0.08 }
    case 'square':
      return { borderRadius: 0 }
    case 'arch':
      return { borderRadius: `${w / 2}px ${w / 2}px ${m * 0.05}px ${m * 0.05}px / ${Math.min(w / 2, h)}px ${Math.min(w / 2, h)}px ${m * 0.05}px ${m * 0.05}px` }
    case 'blob':
      return { borderRadius: '62% 38% 54% 46% / 48% 58% 42% 52%' }
    case 'hex':
      return { clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }
    case 'diamond':
      return { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }
    default:
      return { borderRadius: 0 }
  }
}

/** Inset (px) from the frame box to the photo area. */
export const frameInset = (ring) => (ring ? (ring.width || 0) + (ring.gap || 0) : 0)

export default function PhotoFrame({ w, h, shape = 'circle', ring, backdrop, shadow, photo, pal, filter, placeholder, children }) {
  const inset = frameInset(ring)
  const ringW = ring?.width || 0
  const backdrops = Array.isArray(backdrop) ? backdrop : backdrop ? [backdrop] : []

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {backdrops.map((bd, i) => (
        <Backdrop key={i} bd={bd} w={w} h={h} shape={shape} pal={pal} />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: shadow ? `drop-shadow(0 ${Math.round(h * 0.04)}px ${Math.round(h * 0.06)}px rgba(10,15,30,${shadow === true ? 0.35 : shadow}))` : undefined,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: ring ? resolveColor(ring.color, pal) : undefined, ...shapeStyle(shape, w, h) }}>
          {ring?.gap ? (
            <div
              style={{
                position: 'absolute',
                inset: ringW,
                overflow: 'hidden',
                background: resolveColor(ring.gapColor || '#ffffff', pal),
                ...shapeStyle(shape, w - ringW * 2, h - ringW * 2),
              }}
            />
          ) : null}
          <div style={{ position: 'absolute', inset, overflow: 'hidden', ...shapeStyle(shape, w - inset * 2, h - inset * 2) }}>
            {children || <PhotoFill photo={photo} w={w - inset * 2} h={h - inset * 2} filter={filter} placeholder={placeholder} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Backdrop({ bd, w, h, shape, pal }) {
  const id = useSvgId('bd')
  const color = resolveColor(bd.color || '$accent', pal)
  const color2 = resolveColor(bd.color2 || bd.color || '$primary', pal)
  const m = Math.max(w, h)

  switch (bd.type) {
    case 'halo': {
      const d = m * (bd.scale || 1.25)
      return (
        <div
          style={{
            position: 'absolute',
            left: w / 2 - d / 2,
            top: h / 2 - d / 2,
            width: d,
            height: d,
            borderRadius: '50%',
            background: `radial-gradient(circle at 50% 40%, ${color2} 0%, ${color} 72%)`,
            opacity: bd.opacity ?? 1,
          }}
        />
      )
    }
    case 'glow': {
      const d = m * (bd.scale || 1.6)
      return (
        <div
          style={{
            position: 'absolute',
            left: w / 2 - d / 2,
            top: h / 2 - d / 2,
            width: d,
            height: d,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
            opacity: bd.opacity ?? 0.6,
          }}
        />
      )
    }
    case 'rays': {
      const d = m * (bd.scale || 1.9)
      return (
        <svg width={d} height={d} style={{ position: 'absolute', left: w / 2 - d / 2, top: h / 2 - d / 2, overflow: 'visible' }}>
          <RaysArt cx={d / 2} cy={d / 2} r={d / 2} rays={bd.rays || 20} color={color} opacity={bd.opacity ?? 0.5} />
        </svg>
      )
    }
    case 'laurel': {
      const lw = w * (bd.scale || 1.42)
      const lh = h * 1.02
      return (
        <svg width={lw} height={lh} viewBox={`0 0 ${lw} ${lh}`} style={{ position: 'absolute', left: w / 2 - lw / 2, top: h / 2 - lh / 2 + h * 0.06, overflow: 'visible' }}>
          <LaurelPairArt w={lw} h={lh} color={color} />
        </svg>
      )
    }
    case 'offset': {
      const dx = bd.dx ?? Math.round(m * 0.06)
      const dy = bd.dy ?? Math.round(m * 0.06)
      return (
        <div
          style={{
            position: 'absolute',
            left: dx,
            top: dy,
            width: w,
            height: h,
            background: bd.outline ? 'transparent' : color,
            border: bd.outline ? `${bd.width || 4}px solid ${color}` : undefined,
            ...shapeStyle(shape, w, h),
          }}
        />
      )
    }
    case 'outline': {
      const g = bd.gap ?? Math.round(m * 0.04)
      return (
        <div
          style={{
            position: 'absolute',
            left: -g,
            top: -g,
            width: w + g * 2,
            height: h + g * 2,
            border: `${bd.width || 3}px ${bd.dashed ? 'dashed' : 'solid'} ${color}`,
            ...shapeStyle(shape, w + g * 2, h + g * 2),
          }}
        />
      )
    }
    case 'dots': {
      const d = m * (bd.scale || 1.22)
      const r = d / 2 - 6
      const n = bd.count || 48
      return (
        <svg width={d} height={d} style={{ position: 'absolute', left: w / 2 - d / 2, top: h / 2 - d / 2 }}>
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2
            return <circle key={i} cx={d / 2 + Math.cos(a) * r} cy={d / 2 + Math.sin(a) * r} r={bd.dot || 5} fill={color} />
          })}
        </svg>
      )
    }
    case 'blob': {
      const sw = w * (bd.scale || 1.32)
      const sh = h * (bd.scale || 1.32)
      return (
        <svg width={sw} height={sh} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: w / 2 - sw / 2 + (bd.dx || 0), top: h / 2 - sh / 2 + (bd.dy || 0), opacity: bd.opacity ?? 1 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <path d={BLOB_PATH} fill={`url(#${id})`} transform={`rotate(${bd.rotate || 0} 50 50)`} />
        </svg>
      )
    }
    case 'seal': {
      const d = m * (bd.scale || 1.24)
      return (
        <svg width={d} height={d} style={{ position: 'absolute', left: w / 2 - d / 2, top: h / 2 - d / 2 }}>
          <path d={sealPath(d, bd.bumps || 28)} fill={color} />
          <circle cx={d / 2} cy={d / 2} r={d / 2 - d * 0.08} fill="none" stroke={color2} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
        </svg>
      )
    }
    case 'rings': {
      const gap = bd.gap ?? Math.round(m * 0.05)
      return (
        <>
          {[1, 2].map((k) => (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: -gap * k,
                top: -gap * k,
                width: w + gap * 2 * k,
                height: h + gap * 2 * k,
                borderRadius: '50%',
                border: `${bd.width || 2}px solid ${color}`,
                opacity: k === 1 ? 0.8 : 0.4,
              }}
            />
          ))}
        </>
      )
    }
    default:
      return null
  }
}
