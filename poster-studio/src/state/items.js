// "Items" are everything selectable on the poster: the template's slots
// (photo / logo / text bound to a field) and the user's added elements. Both
// share one box model { x, y, w, h, rotate } in native poster pixels, so the
// editor's select / move / resize / crop code never needs to special-case
// either. Slot edits are stored as per-poster overrides on top of the
// template definition; elements are stored whole.

export const slotItemId = (slotId) => `slot:${slotId}`
export const elementItemId = (elId) => `el:${elId}`

export function resolveSlots(template, design) {
  return (template.slots || []).map((s) => ({ ...s, ...(design.slotOverrides?.[s.id] || {}) }))
}

export function slotText(slot, fields) {
  const value = (fields?.[slot.field] ?? '').toString()
  if (!value.trim()) return ''
  return `${slot.prefix || ''}${value}${slot.suffix || ''}`
}

export function isSlotVisible(slot, design) {
  if (slot.hidden) return false
  if (slot.kind === 'text') return !!slotText(slot, design.fields)
  if (slot.kind === 'photo') return !slot.optional || !!design.photo?.src
  return true
}

export function getItems(design, template) {
  const back = []
  const front = []
  for (const el of design.elements || []) {
    const item = { id: elementItemId(el.id), kind: 'element', type: el.type, box: el, data: el }
    ;(el.layer === 'back' ? back : front).push(item)
  }
  const slots = resolveSlots(template, design)
    .filter((s) => isSlotVisible(s, design))
    .map((s) => ({ id: slotItemId(s.id), kind: 'slot', type: s.kind, box: s, data: s }))
  return [...back, ...slots, ...front]
}

export function findItem(design, template, id) {
  if (!id) return null
  return getItems(design, template).find((it) => it.id === id) || null
}

/** Patch an item's box/style. Returns a new design. */
export function updateItem(design, id, patch) {
  if (id.startsWith('slot:')) {
    const sid = id.slice(5)
    return { ...design, slotOverrides: { ...design.slotOverrides, [sid]: { ...(design.slotOverrides?.[sid] || {}), ...patch } } }
  }
  const eid = id.slice(3)
  return { ...design, elements: design.elements.map((e) => (e.id === eid ? { ...e, ...patch } : e)) }
}

export function resetSlot(design, id) {
  const sid = id.slice(5)
  const next = { ...design.slotOverrides }
  delete next[sid]
  return { ...design, slotOverrides: next }
}

export function removeItem(design, id) {
  if (id.startsWith('slot:')) return updateItem(design, id, { hidden: true })
  const eid = id.slice(3)
  return { ...design, elements: design.elements.filter((e) => e.id !== eid) }
}

/** The photo shown by a photo slot (shared design.photo) or an image element. */
export function getItemPhoto(design, item) {
  if (!item) return null
  if (item.kind === 'slot' && item.type === 'photo') return design.photo
  if (item.kind === 'element' && item.type === 'image') return item.data.photo
  return null
}

export function setItemPhoto(design, item, patch) {
  if (item.kind === 'slot') return { ...design, photo: { ...design.photo, ...patch } }
  const eid = item.data.id
  return { ...design, elements: design.elements.map((e) => (e.id === eid ? { ...e, photo: { ...e.photo, ...patch } } : e)) }
}

export function isPhotoItem(item) {
  return !!item && ((item.kind === 'slot' && item.type === 'photo') || (item.kind === 'element' && item.type === 'image'))
}
