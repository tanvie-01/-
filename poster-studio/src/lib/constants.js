// Native poster size. Everything (templates, slots, elements) is laid out in
// these pixels; the editor only scales the finished poster for display, and
// export always renders at this native size (x2 pixel ratio).
export const POSTER_W = 1080
export const POSTER_H = 1350 // 4:5 — ideal for Facebook / Instagram feed

// Same organisation as the Notice App (see ../../bengali-notice-app/app.js CONFIG)
export const ORG = {
  name: 'লৎসর দক্ষিণ পাড়া যুব সমাজ মানব কল্যাণ সংস্থা',
  location: 'লৎসর, মনোহরগঞ্জ, কুমিল্লা',
  slug: 'Latsor',
}

export const FONTS = [
  { key: 'hind', label: 'হিন্দ শিলিগুড়ি', css: "'Hind Siliguri','Noto Sans Bengali',sans-serif" },
  { key: 'noto', label: 'নোটো সান্স', css: "'Noto Sans Bengali','Hind Siliguri',sans-serif" },
  { key: 'serif', label: 'নোটো সেরিফ', css: "'Noto Serif Bengali','Tiro Bangla',serif" },
  { key: 'tiro', label: 'টিরো বাংলা', css: "'Tiro Bangla','Noto Serif Bengali',serif" },
  { key: 'baloo', label: 'বালু দা (বোল্ড)', css: "'Baloo Da 2','Hind Siliguri',sans-serif" },
  { key: 'galada', label: 'গালাদা (স্ক্রিপ্ট)', css: "'Galada','Hind Siliguri',cursive" },
  { key: 'atma', label: 'আত্মা (হাতের লেখা)', css: "'Atma','Hind Siliguri',cursive" },
  { key: 'mina', label: 'মিনা', css: "'Mina','Hind Siliguri',sans-serif" },
  { key: 'inter', label: 'Inter (English)', css: "'Inter','Hind Siliguri',sans-serif" },
]

export const fontCss = (key) => (FONTS.find((f) => f.key === key) || FONTS[0]).css

export const PHOTO_SHAPES = [
  { key: 'circle', label: 'বৃত্ত', lockAspect: true },
  { key: 'rounded', label: 'গোলাকার কোণ' },
  { key: 'square', label: 'চারকোনা' },
  { key: 'arch', label: 'আর্চ' },
  { key: 'blob', label: 'অর্গানিক' },
  { key: 'hex', label: 'ষড়ভুজ', lockAspect: true },
  { key: 'diamond', label: 'ডায়মন্ড', lockAspect: true },
]

export const shapeLocksAspect = (shape) => !!PHOTO_SHAPES.find((s) => s.key === shape)?.lockAspect

export const uid = (prefix = 'el') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
