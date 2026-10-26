// Photo model + crop math shared by the poster renderer (PhotoFill), the
// on-canvas crop gestures (EditorStage) and the ছবি panel.
//
// A photo is { src, w, h, fit, zoom, panX, panY, rotate }:
//   - w/h      natural pixel size of the (possibly downscaled) image
//   - fit      'cover' → fills the frame (cropped), 'contain' → whole image visible
//   - zoom     >= 1, multiplier on top of the fit scale
//   - panX/Y   -1..1, fraction of the *available* slack in each direction
//   - rotate   0 | 90 | 180 | 270
// Because pan is stored relative to the slack (not in pixels), a cover-fitted
// image can never be dragged far enough to show an empty gap in its frame —
// and the crop stays valid when the frame is resized or the template changes.

import { clamp } from './constants.js'

export const MAX_ZOOM = 4

export const emptyPhoto = () => ({ src: null, w: 0, h: 0, fit: 'cover', zoom: 1, panX: 0, panY: 0, rotate: 0 })

export function photoLayout(photo, frameW, frameH) {
  const rotated = (photo.rotate || 0) % 180 !== 0
  const iw = rotated ? photo.h : photo.w
  const ih = rotated ? photo.w : photo.h
  if (!iw || !ih) return null
  const base = photo.fit === 'contain' ? Math.min(frameW / iw, frameH / ih) : Math.max(frameW / iw, frameH / ih)
  const scale = base * clamp(photo.zoom || 1, 1, MAX_ZOOM)
  const dispW = iw * scale // on-screen bounding size (after rotation)
  const dispH = ih * scale
  const rangeX = Math.abs(dispW - frameW) / 2
  const rangeY = Math.abs(dispH - frameH) / 2
  return {
    scale,
    dispW,
    dispH,
    rangeX,
    rangeY,
    // the <img> element itself is laid out un-rotated
    imgW: photo.w * scale,
    imgH: photo.h * scale,
    offX: clamp(photo.panX || 0, -1, 1) * rangeX,
    offY: clamp(photo.panY || 0, -1, 1) * rangeY,
  }
}

const MAX_EDGE = 2200

/** Reads an image File, downscales very large photos, returns { src, w, h }. */
export async function loadImageFile(file, { maxEdge = MAX_EDGE } = {}) {
  if (!file || !file.type.startsWith('image/')) throw new Error('not-image')
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const img = await loadImage(dataUrl)
  const { naturalWidth: w, naturalHeight: h } = img
  if (Math.max(w, h) <= maxEdge && file.size < 3.5 * 1024 * 1024) return { src: dataUrl, w, h }

  // Downscale: keeps saved projects small and export fast on phones.
  const k = Math.min(1, maxEdge / Math.max(w, h))
  const cw = Math.round(w * k)
  const ch = Math.round(h * k)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, cw, ch)
  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp'
  const src = keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92)
  return { src, w: cw, h: ch }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image-load-failed'))
    img.src = src
  })
}

/** For photos saved before dimensions were tracked. */
export async function ensurePhotoSize(photo) {
  if (!photo?.src || (photo.w && photo.h)) return photo
  try {
    const img = await loadImage(photo.src)
    return { ...photo, w: img.naturalWidth, h: img.naturalHeight }
  } catch {
    return photo
  }
}
