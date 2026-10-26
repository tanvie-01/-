import React from 'react'
import congrats from './congrats.jsx'
import welcome from './welcome.jsx'
import greetings from './greetings.jsx'
import event from './event.jsx'
import achievement from './achievement.jsx'
import announcement from './announcement.jsx'
import birthday from './birthday.jsx'
import other from './other.jsx'

/*
 * Template registry.
 *
 * A template is plain data:
 *   { id, category, name, en, palette, defaults?, labels?, Background, slots }
 * - palette: { primary, secondary, accent, bg, text } — slots/background use
 *   "$token" colours so the রং panel can recolour everything.
 * - Background: component drawing the fixed artwork, receives { c: palette }.
 * - slots: positioned boxes (native 1080×1350 px) of kind
 *     'text'  { field, font, size (max px), weight, color, align, wrap, bg, ribbon, icon, prefix … }
 *     'photo' { shape, ring, backdrop, shadow, optional, filter }
 *     'logo'  { shape, ring, backdrop }
 *   Text auto-shrinks to its box; users can move/resize/restyle any slot.
 *
 * To add a template: add an object to one of the category files and it
 * appears in the gallery automatically.
 */
export const TEMPLATES = [...congrats, ...welcome, ...greetings, ...event, ...achievement, ...announcement, ...birthday, ...other]

export const templatesFor = (category) => TEMPLATES.filter((t) => t.category === category)

// Ids used by the previous (pre-refactor) Poster Studio → closest new template
export const LEGACY_TEMPLATE_IDS = {
  emerald: 'emerald',
  indigo: 'emerald',
  sunrise: 'modern-celebration',
  minimal: 'minimal-frame',
  'golden-medal': 'golden-medal',
  'confetti-bloom': 'modern-celebration',
  'elegant-invite': 'professional-event',
  'balloon-pop': 'balloon-birthday',
  'graduate-laurel': 'golden-medal',
  'seminar-grid': 'modern-event',
  'farewell-bloom': 'farewell-bloom',
  'achievement-star': 'star-achievement',
  'royal-announcement': 'royal-announcement',
  'floral-honor': 'emerald',
}

// ---------------------------------------------------------------------------
// Custom templates: the user's own background image + editable slots.
// ---------------------------------------------------------------------------

export const CUSTOM_PALETTE = { primary: '#16225c', secondary: '#1e7d37', accent: '#d8a53c', bg: '#ffffff', text: '#1c1c1c' }

export function defaultCustomSlots() {
  return [
    { id: 'photo', kind: 'photo', x: 340, y: 150, w: 400, h: 400, shape: 'circle', ring: { width: 10, color: '#ffffff' }, shadow: 0.3 },
    { id: 'title', kind: 'text', field: 'title', x: 90, y: 600, w: 900, h: 110, font: 'baloo', size: 78, weight: 800, color: '$primary', wrap: false },
    { id: 'name', kind: 'text', field: 'name', x: 90, y: 720, w: 900, h: 90, font: 'tiro', size: 60, weight: 700, color: '$text', wrap: false },
    { id: 'subtitle', kind: 'text', field: 'subtitle', x: 140, y: 812, w: 800, h: 56, size: 32, weight: 600, color: '$text' },
    { id: 'message', kind: 'text', field: 'message', x: 120, y: 890, w: 840, h: 140, size: 32, weight: 500, color: '$text', lineHeight: 1.5 },
    { id: 'orgName', kind: 'text', field: 'orgName', x: 120, y: 1190, w: 840, h: 70, size: 30, weight: 700, color: '$primary' },
  ]
}

const LEGACY_FONT = { bengali: 'hind', display: 'tiro', ui: 'inter' }
const LEGACY_FIELD = { name: 'name', designation: 'subtitle', session: 'date', congrats: 'title' }

/** Old custom-template layout (percent boxes) → slots. */
export function legacyLayoutToSlots(layout) {
  if (!layout) return null
  const px = (b) => ({ x: (b.x / 100) * 1080, y: (b.y / 100) * 1350, w: (b.w / 100) * 1080, h: (b.h / 100) * 1350 })
  const slots = []
  if (layout.photo) slots.push({ id: 'photo', kind: 'photo', ...px(layout.photo), shape: layout.photo.shape || 'circle' })
  for (const [key, field] of Object.entries(LEGACY_FIELD)) {
    const b = layout[key]
    if (!b) continue
    slots.push({
      id: field,
      kind: 'text',
      field,
      ...px(b),
      size: b.fontSize || 32,
      font: LEGACY_FONT[b.fontFamily] || 'hind',
      weight: b.fontWeight || 600,
      align: b.align || 'center',
      color: b.color || '#161a23',
    })
  }
  return slots
}

const wrapped = new Map()

/** Stored custom-template record → template object (cached so its Background stays stable). */
export function wrapCustomTemplate(record) {
  const cached = wrapped.get(record.id)
  if (cached && cached.record === record) return cached.template
  const image = record.image
  const Background = () => (
    <img src={image} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  )
  const template = {
    id: record.id,
    category: record.category || 'other',
    name: record.name,
    en: 'Custom',
    isCustom: true,
    image,
    palette: { ...CUSTOM_PALETTE, ...(record.palette || {}) },
    Background,
    slots: record.slots || legacyLayoutToSlots(record.layout) || defaultCustomSlots(),
  }
  wrapped.set(record.id, { record, template })
  return template
}

export function getTemplate(id, customTemplates = []) {
  const builtIn = TEMPLATES.find((t) => t.id === id) || TEMPLATES.find((t) => t.id === LEGACY_TEMPLATE_IDS[id])
  if (builtIn) return builtIn
  const custom = customTemplates.find((t) => t.id === id)
  if (custom) return wrapCustomTemplate(custom)
  return TEMPLATES[0]
}
