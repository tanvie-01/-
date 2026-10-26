import { toCanvas } from 'html-to-image'

async function waitForFonts() {
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    // proceed with whatever fonts are already loaded
  }
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

// ---------------------------------------------------------------------------
// Web-font embedding. html-to-image would otherwise inline *every* @font-face
// from Google Fonts (hundreds of unicode-range files). We only embed the
// faces the browser has actually loaded for this page, once, and reuse that
// CSS for every export and thumbnail.
// ---------------------------------------------------------------------------
// "U+0980-09FE, U+200C" and "U+980-9FE,U+200C" are the same range
const normRange = (r) =>
  String(r || 'U+0-10FFFF')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/(u\+|-)0+([0-9a-f])/g, '$1$2')

const faceKey = (family, weight, style, range) => `${family.replace(/["']/g, '').trim()}|${weight}|${style}|${normRange(range)}`

function loadedFaceKeys() {
  const keys = new Set()
  document.fonts.forEach((f) => {
    if (f.status === 'loaded') keys.add(faceKey(f.family, f.weight, f.style, f.unicodeRange))
  })
  return keys
}

const fontFileCache = new Map() // font url → data URL promise

function fontFileDataUrl(url) {
  if (!fontFileCache.has(url)) fontFileCache.set(url, toDataUrl(url))
  return fontFileCache.get(url)
}

async function toDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function buildFontEmbedCss(keys) {
  const rules = []
  for (const sheet of Array.from(document.styleSheets)) {
    if (!sheet.href || !sheet.href.includes('fonts.googleapis.com')) continue
    let cssText
    try {
      cssText = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join('\n')
    } catch {
      // stylesheet not CORS-readable: fetch it ourselves
      cssText = await (await fetch(sheet.href)).text()
    }
    for (const block of cssText.match(/@font-face\s*{[^}]*}/g) || []) {
      const family = (block.match(/font-family:\s*["']?([^;"']+)["']?/) || [])[1]
      const weight = (block.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim() || '400'
      const style = (block.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || 'normal'
      const range = (block.match(/unicode-range:\s*([^;]+);/) || [])[1]
      if (!family || !keys.has(faceKey(family, weight, style, range))) continue
      const url = (block.match(/url\(([^)]+)\)/) || [])[1]?.replace(/["']/g, '')
      if (!url) continue
      rules.push({ block, url })
    }
  }
  const inlined = await Promise.all(
    rules.map(async ({ block, url }) => {
      try {
        return block.replace(/url\([^)]+\)/, `url(${await fontFileDataUrl(url)})`)
      } catch {
        return ''
      }
    })
  )
  return inlined.join('\n')
}

// Rebuilt only when the set of loaded faces changes (e.g. a new font picked)
let fontCss = { sig: null, promise: null }

function getFontEmbedCss() {
  const keys = loadedFaceKeys()
  const sig = [...keys].sort().join(';')
  if (fontCss.sig !== sig) fontCss = { sig, promise: buildFontEmbedCss(keys).catch(() => '') }
  return fontCss.promise
}

async function renderCanvas(node, pixelRatio) {
  await waitForFonts()
  await nextFrame()
  const fontEmbedCSS = await getFontEmbedCss()
  return toCanvas(node, { pixelRatio, cacheBust: false, fontEmbedCSS, backgroundColor: '#ffffff' })
}

/**
 * Renders the native-resolution poster node to an image Blob.
 * Retries at 1x if the large canvas fails (memory-limited phones).
 */
export async function renderPosterBlob(node, { format = 'png', pixelRatio = 2 } = {}) {
  if (!node) throw new Error('পোস্টার এলিমেন্ট পাওয়া যায়নি')
  const type = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, type, 0.95))
  let blob = null
  try {
    blob = await toBlob(await renderCanvas(node, pixelRatio))
  } catch (err) {
    console.error('export at requested resolution failed, retrying at 1x', err)
  }
  if (!blob) blob = await toBlob(await renderCanvas(node, 1))
  if (!blob) throw new Error('ছবি তৈরি করা যায়নি')
  return blob
}

/** Small JPEG thumbnail (for saved-project cards). */
export async function generateThumbnail(node, { width = 300 } = {}) {
  if (!node) return null
  try {
    const canvas = await renderCanvas(node, width / (node.offsetWidth || 1080))
    return canvas.toDataURL('image/jpeg', 0.82)
  } catch (err) {
    console.error('thumbnail generation failed', err)
    return null
  }
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // some mobile browsers start the download asynchronously — revoke later
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
