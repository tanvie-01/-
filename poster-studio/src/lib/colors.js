// Templates and elements refer to theme colours by token ("$primary",
// "linear-gradient(90deg,$primary,$accent)") instead of hard-coded hex, so a
// poster can be recoloured from the রং panel and user-added elements match
// whatever template they're placed on.

export const PALETTE_KEYS = [
  { key: 'primary', label: 'প্রধান রং' },
  { key: 'secondary', label: 'সহায়ক রং' },
  { key: 'accent', label: 'অ্যাকসেন্ট' },
  { key: 'bg', label: 'ব্যাকগ্রাউন্ড' },
  { key: 'text', label: 'লেখার রং' },
]

const TOKEN_RE = /\$(primary|secondary|accent|bg|text)/g

export function resolveColor(value, pal) {
  if (value == null) return value
  return String(value).replace(TOKEN_RE, (_, k) => pal[k] || '#000')
}

export function withAlpha(hex, alpha) {
  const h = String(hex).replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

// Ready-made palettes offered in the রং panel (template palettes are listed too)
export const PRESET_PALETTES = [
  { name: 'নেভি-সবুজ', pal: { primary: '#16225c', secondary: '#1e7d37', accent: '#d8a53c', bg: '#faf7ee', text: '#1c1c1c' } },
  { name: 'এমারেল্ড', pal: { primary: '#0f6e5e', secondary: '#1c9c6e', accent: '#d8a53c', bg: '#f6efd6', text: '#173226' } },
  { name: 'রাজকীয় মেরুন', pal: { primary: '#7a0f1c', secondary: '#a4222c', accent: '#e2b857', bg: '#fbf3e4', text: '#2b1214' } },
  { name: 'রাতের সোনালি', pal: { primary: '#14161f', secondary: '#2a2d3a', accent: '#e0b44c', bg: '#0f1118', text: '#f7f1df' } },
  { name: 'কোরাল', pal: { primary: '#d9462f', secondary: '#f08a3c', accent: '#ffd166', bg: '#fff6ee', text: '#3a1a12' } },
  { name: 'বেগুনি', pal: { primary: '#4b2a8a', secondary: '#8a4fd8', accent: '#f6c445', bg: '#f6f0ff', text: '#221338' } },
  { name: 'গোলাপি', pal: { primary: '#d6336c', secondary: '#f783ac', accent: '#ffd43b', bg: '#fff0f6', text: '#3b1029' } },
  { name: 'আকাশি', pal: { primary: '#0b6fa4', secondary: '#20a4d8', accent: '#ffb703', bg: '#eef8fd', text: '#0b2438' } },
]
