import { ELEMENT_DEFS, elementCaps } from '../elements/library.jsx'
import { fieldLabel } from '../data/categories.js'
import { shapeLocksAspect } from '../lib/constants.js'
import { isPhotoItem } from '../state/items.js'

export function itemLabel(item, design, template) {
  if (!item) return ''
  if (item.kind === 'slot') {
    if (item.type === 'photo') return 'ছবি'
    if (item.type === 'logo') return 'লোগো'
    return fieldLabel(item.data.field, design.category, template)
  }
  return ELEMENT_DEFS[item.data.key]?.label || 'এলিমেন্ট'
}

export function itemIcon(item) {
  if (!item) return ''
  if (isPhotoItem(item)) return '🖼️'
  if (item.type === 'logo') return '🏷️'
  if (item.type === 'text') return '🔤'
  return { shape: '⬛', line: '➖', frame: '🔲', decor: '✨', badge: '🎖️', pattern: '🌫️', image: '🖼️' }[item.type] || '◻️'
}

/** Photos, logos and text stay fully inside the poster; decorations may bleed off the edge. */
export function isStrictItem(item) {
  return item.kind === 'slot' || item.type === 'image' || item.type === 'text' || item.type === 'badge'
}

export function locksAspect(item) {
  if (item.kind === 'slot') return item.type === 'logo' || (item.type === 'photo' && shapeLocksAspect(item.data.shape))
  return elementCaps(item.data).lockAspect
}
