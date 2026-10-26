import { COMMON_DEFAULTS, FIELD_ORDER, getCategory } from '../data/categories.js'
import { LEGACY_TEMPLATE_IDS, TEMPLATES, getTemplate } from '../templates/index.jsx'
import { emptyPhoto } from '../lib/photo.js'

// The whole editable poster is one plain object, so undo/redo, autosave and
// saved projects are just copies of it.
//
// design = {
//   version: 2,
//   category, templateId,
//   fields: { title, name, … },        // text content (see data/categories.js)
//   palette: { primary?, … },          // overrides on top of template.palette
//   photo: { src, w, h, fit, zoom, panX, panY, rotate },
//   logo: dataUrl | null,              // null → bundled organisation logo
//   slotOverrides: { [slotId]: { x?, y?, w?, h?, size?, color?, hidden? … } },
//   elements: [ …user-added design elements ],
// }

export function defaultsFor(template, category = template.category) {
  return { ...COMMON_DEFAULTS, ...getCategory(category).defaults, ...(template.defaults || {}) }
}

export function newDesign(template = TEMPLATES[0]) {
  return {
    version: 2,
    category: template.category,
    templateId: template.id,
    fields: defaultsFor(template),
    palette: {},
    photo: emptyPhoto(),
    logo: null,
    slotOverrides: {},
    elements: [],
  }
}

/**
 * Switch template (and possibly category). Text the user has typed is kept;
 * text that is still the previous template's default is replaced by the new
 * template's default, so e.g. "অভিনন্দন" becomes "স্বাগতম" when moving to a
 * welcome poster but a typed name survives. Layout tweaks and colours belong
 * to a template, so they reset; photo, logo and added elements carry over.
 */
export function switchTemplate(design, fromTemplate, toTemplate, category = toTemplate.isCustom ? design.category : toTemplate.category) {
  const oldDefaults = defaultsFor(fromTemplate, design.category)
  const newDefaults = defaultsFor(toTemplate, category)
  const fields = {}
  for (const key of FIELD_ORDER) {
    const current = design.fields[key] ?? ''
    fields[key] = current === (oldDefaults[key] ?? '') ? newDefaults[key] ?? '' : current
  }
  return {
    ...design,
    category,
    templateId: toTemplate.id,
    fields,
    palette: {},
    slotOverrides: {},
  }
}

/** Field keys shown by a template's text slots, in form order. */
export function fieldsUsed(template) {
  const used = new Set((template.slots || []).filter((s) => s.kind === 'text').map((s) => s.field))
  return FIELD_ORDER.filter((k) => used.has(k))
}

// ---------------------------------------------------------------------------
// Projects saved by the previous Poster Studio ({ templateId, fields, photo, logo })
// ---------------------------------------------------------------------------
export function migrateLegacyProject(p) {
  if (p.design) return p.design
  const template = getTemplate(LEGACY_TEMPLATE_IDS[p.templateId] || p.templateId)
  const f = p.fields || {}
  const base = newDesign(template)
  const motto = [f.mottoLeft, f.mottoRight].filter(Boolean).join(' ')
  const fields = { ...base.fields }
  const map = {
    topLine: f.bismillah,
    motto,
    orgName: f.orgName,
    date: f.sessionYear,
    extra: f.sessionLabel || f.tagline,
    name: f.name,
    subtitle: f.designation,
    message: f.congratsLead,
    title: f.congratsMain,
    orgLocation: f.orgLocation,
  }
  for (const [k, v] of Object.entries(map)) if (v) fields[k] = v
  const photo = p.photo?.src ? { ...emptyPhoto(), src: p.photo.src, zoom: Math.max(1, p.photo.zoom || 1) } : emptyPhoto()
  return { ...base, fields, photo, logo: p.logo || null }
}
