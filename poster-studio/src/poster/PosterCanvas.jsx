import React, { forwardRef } from 'react'
import FitText from './FitText.jsx'
import PhotoFrame from './PhotoFrame.jsx'
import Icon from './icons.jsx'
import { ElementView } from '../elements/library.jsx'
import { resolveColor } from '../lib/colors.js'
import { POSTER_W, POSTER_H, fontCss } from '../lib/constants.js'
import { isSlotVisible, resolveSlots, slotText } from '../state/items.js'

export function paletteOf(design, template) {
  return { ...template.palette, ...(design.palette || {}) }
}

/**
 * The poster itself at native 1080 × 1350 px. Layer order:
 *   template background → elements on the "back" layer → template slots
 *   (photo, logo, text) → elements on the "front" layer.
 * It holds no editor UI, so the exact same node is exported to PNG/JPG and
 * used (scaled down) for template thumbnails.
 */
const PosterCanvas = forwardRef(function PosterCanvas({ design, template, defaultLogo }, ref) {
  const pal = paletteOf(design, template)
  const Background = template.Background
  const slots = resolveSlots(template, design).filter((s) => isSlotVisible(s, design))
  const back = design.elements.filter((e) => e.layer === 'back')
  const front = design.elements.filter((e) => e.layer !== 'back')

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_W,
        height: POSTER_H,
        position: 'relative',
        overflow: 'hidden',
        background: pal.bg,
        color: pal.text,
        fontFamily: fontCss('hind'),
      }}
    >
      {Background && <Background c={pal} f={design.fields} />}
      {back.map((el) => (
        <Box key={el.id} box={el}>
          <ElementView el={el} pal={pal} />
        </Box>
      ))}
      {slots.map((s) => (
        <Box key={s.id} box={s}>
          <Slot slot={s} design={design} pal={pal} defaultLogo={defaultLogo} />
        </Box>
      ))}
      {front.map((el) => (
        <Box key={el.id} box={el}>
          <ElementView el={el} pal={pal} />
        </Box>
      ))}
    </div>
  )
})

export default PosterCanvas

function Box({ box, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        transform: box.rotate ? `rotate(${box.rotate}deg)` : undefined,
        opacity: box.opacity ?? 1,
      }}
    >
      {children}
    </div>
  )
}

function Slot({ slot, design, pal, defaultLogo }) {
  if (slot.kind === 'text') return <TextSlot slot={slot} text={slotText(slot, design.fields)} pal={pal} />
  if (slot.kind === 'photo')
    return (
      <PhotoFrame
        w={slot.w}
        h={slot.h}
        shape={slot.shape}
        ring={slot.ring}
        backdrop={slot.backdrop}
        shadow={slot.shadow}
        photo={design.photo}
        pal={pal}
        filter={slot.filter}
        placeholder={slot.placeholder}
      />
    )
  if (slot.kind === 'logo') {
    const src = design.logo || defaultLogo
    return (
      <PhotoFrame w={slot.w} h={slot.h} shape={slot.shape || 'circle'} ring={slot.ring} backdrop={slot.backdrop} shadow={slot.shadow} pal={pal}>
        <div style={{ position: 'absolute', inset: 0, background: resolveColor(slot.fill || '#ffffff', pal) }}>
          {src && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ position: 'absolute', inset: `${slot.padding ?? 4}%`, width: `${100 - 2 * (slot.padding ?? 4)}%`, height: `${100 - 2 * (slot.padding ?? 4)}%`, objectFit: 'contain' }}
            />
          )}
        </div>
      </PhotoFrame>
    )
  }
  return null
}

function TextSlot({ slot, text, pal }) {
  if (!text) return null
  const [py, px] = Array.isArray(slot.pad) ? slot.pad : [slot.pad || 0, slot.pad || 0]
  const iconSize = slot.icon ? slot.iconSize || Math.min(slot.h - py * 2, 44) : 0
  const gap = slot.icon ? Math.round(iconSize * 0.45) : 0
  const color = resolveColor(slot.color || '$text', pal)
  const notch = slot.h * 0.3

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: slot.align === 'left' ? 'flex-start' : slot.align === 'right' ? 'flex-end' : 'center',
        gap,
        padding: `${py}px ${px}px`,
        background: slot.bg ? resolveColor(slot.bg, pal) : undefined,
        borderRadius: slot.radius,
        border: slot.border ? resolveColor(slot.border, pal) : undefined,
        boxShadow: slot.boxShadow,
        clipPath: slot.ribbon ? `polygon(0 0, 100% 0, calc(100% - ${notch}px) 50%, 100% 100%, 0 100%, ${notch}px 50%)` : undefined,
      }}
    >
      {slot.icon && <Icon name={slot.icon} size={iconSize} color={resolveColor(slot.iconColor || slot.color || '$primary', pal)} strokeWidth={2.2} />}
      <FitText
        text={text}
        w={slot.w - px * 2 - iconSize - gap}
        h={slot.h - py * 2}
        size={slot.size || 40}
        minSize={slot.minSize}
        wrap={slot.wrap !== false}
        align={slot.align || 'center'}
        valign={slot.valign || 'center'}
        style={{
          fontFamily: fontCss(slot.font || 'hind'),
          fontWeight: slot.weight || 600,
          color,
          lineHeight: slot.lineHeight || 1.35,
          letterSpacing: slot.letterSpacing,
          fontStyle: slot.italic ? 'italic' : undefined,
          textTransform: slot.uppercase ? 'uppercase' : undefined,
          textShadow: slot.shadow ? (typeof slot.shadow === 'string' ? slot.shadow : '0 3px 12px rgba(0,0,0,0.35)') : undefined,
        }}
      />
    </div>
  )
}
