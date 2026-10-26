import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PosterCanvas from '../poster/PosterCanvas.jsx'
import { frameInset } from '../poster/PhotoFrame.jsx'
import useFitScale from '../lib/useFitScale.js'
import { POSTER_W, POSTER_H, clamp } from '../lib/constants.js'
import { MAX_ZOOM, photoLayout } from '../lib/photo.js'
import { getItems, getItemPhoto, isPhotoItem, setItemPhoto, updateItem } from '../state/items.js'
import { isStrictItem, itemIcon, itemLabel, locksAspect } from './itemInfo.js'

const HANDLES = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
]

const MIN_SIZE = 24
const round = (v) => Math.round(v * 10) / 10

/**
 * The editing surface. The poster is rendered once at native size and
 * scaled to fit; every interactive affordance (hit boxes, selection frame,
 * resize handles, snap guides, crop ghost) lives in a separate overlay in
 * screen pixels, so handles stay finger-sized at any zoom and nothing from
 * the editor ever ends up in the exported image.
 *
 * Gestures:
 *   tap            select          · drag       move (snaps to centre lines)
 *   handle drag    resize          · double-tap photo → crop mode, text → edit
 *   crop mode      drag pans the photo inside its frame, wheel / pinch zooms
 */
export default function EditorStage({
  design,
  template,
  defaultLogo,
  posterRef,
  selectedId,
  onSelect,
  cropId,
  setCropId,
  update,
  onEditText,
  onRequestPhoto,
  onDropFile,
}) {
  const wrapRef = useRef(null)
  const scale = useFitScale(wrapRef, POSTER_W, POSTER_H, 18)
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  const items = useMemo(() => getItems(design, template), [design, template])
  const selected = items.find((i) => i.id === selectedId) || null
  const designRef = useRef(design)
  designRef.current = design
  // gesture callbacks are created once; they read the latest props from here
  const handlers = useRef({})
  handlers.current = { onRequestPhoto, onEditText, setCropId }

  const [guides, setGuides] = useState({ v: false, h: false })
  const [dragOver, setDragOver] = useState(false)
  const gesture = useRef(null)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const lastTap = useRef({ id: null, t: 0 })

  // ---------------------------------------------------------------- gestures
  const onMove = useCallback(
    (ev) => {
      const g = gesture.current
      if (!g || g.cancelled) return
      const s = scaleRef.current || 1
      const dxs = ev.clientX - g.startX
      const dys = ev.clientY - g.startY
      if (!g.moved && Math.hypot(dxs, dys) < 4) return
      g.moved = true
      const dx = dxs / s
      const dy = dys / s
      const b = g.box0
      const theta = ((b.rotate || 0) * Math.PI) / 180
      // pointer delta in the item's own (rotated) frame
      const ldx = dx * Math.cos(theta) + dy * Math.sin(theta)
      const ldy = -dx * Math.sin(theta) + dy * Math.cos(theta)

      if (g.mode === 'move') {
        let x = b.x + dx
        let y = b.y + dy
        const th = 8 / s
        let v = false
        let h = false
        if (Math.abs(x + b.w / 2 - POSTER_W / 2) < th) {
          x = POSTER_W / 2 - b.w / 2
          v = true
        }
        if (Math.abs(y + b.h / 2 - POSTER_H / 2) < th) {
          y = POSTER_H / 2 - b.h / 2
          h = true
        }
        ;({ x, y } = clampPosition(g.item, x, y, b.w, b.h))
        setGuides({ v, h })
        update((d) => updateItem(d, g.item.id, { x: round(x), y: round(y) }), g.key)
      } else if (g.mode === 'resize') {
        const [hx, hy] = g.handle
        let w1 = b.w + hx * ldx
        let h1 = b.h + hy * ldy
        const lock = g.lock || ev.shiftKey || (g.isPhoto && hx !== 0 && hy !== 0)
        if (lock) {
          const r = b.w / b.h
          if (hx && hy) {
            const k = Math.max(w1 / b.w, h1 / b.h)
            w1 = b.w * k
            h1 = b.h * k
          } else if (hx) h1 = w1 / r
          else w1 = h1 * r
          const minK = Math.max(MIN_SIZE / w1, MIN_SIZE / h1, 1)
          w1 *= minK
          h1 *= minK
          if (g.strict) {
            const maxK = Math.min(POSTER_W / w1, POSTER_H / h1, 1)
            w1 *= maxK
            h1 *= maxK
          }
        } else {
          w1 = clamp(w1, MIN_SIZE, g.strict ? POSTER_W : 4000)
          h1 = clamp(h1, MIN_SIZE, g.strict ? POSTER_H : 4000)
        }
        // keep the opposite edge/corner fixed (in the rotated frame)
        const sxl = (hx * (w1 - b.w)) / 2
        const syl = (hy * (h1 - b.h)) / 2
        const cx = b.x + b.w / 2 + sxl * Math.cos(theta) - syl * Math.sin(theta)
        const cy = b.y + b.h / 2 + sxl * Math.sin(theta) + syl * Math.cos(theta)
        let { x, y } = clampPosition(g.item, cx - w1 / 2, cy - h1 / 2, w1, h1)
        update((d) => updateItem(d, g.item.id, { x: round(x), y: round(y), w: round(w1), h: round(h1) }), g.key)
      } else if (g.mode === 'pan' && g.photo0?.src) {
        const inset = g.inset
        const L = photoLayout(g.photo0, b.w - inset * 2, b.h - inset * 2)
        if (!L) return
        const panX = L.rangeX > 0.5 ? clamp((g.photo0.panX || 0) + ldx / L.rangeX, -1, 1) : 0
        const panY = L.rangeY > 0.5 ? clamp((g.photo0.panY || 0) + ldy / L.rangeY, -1, 1) : 0
        update((d) => setItemPhoto(d, g.item, { panX, panY }), g.key)
      }
    },
    [update]
  )

  const onUp = useCallback(() => {
    const g = gesture.current
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    gesture.current = null
    setGuides({ v: false, h: false })
    if (!g) return
    if (g.moved || g.cancelled || g.mode === 'resize') {
      // a drag in between means the next tap is a fresh first tap
      lastTap.current = { id: null, t: 0 }
      return
    }
    // tap without movement: detect double-tap (works for mouse and touch)
    const now = Date.now()
    if (lastTap.current.id === g.item.id && now - lastTap.current.t < 350) {
      lastTap.current = { id: null, t: 0 }
      handleDoubleTap(g.item)
    } else lastTap.current = { id: g.item.id, t: now }
  }, [onMove])

  function handleDoubleTap(item) {
    const h = handlers.current
    if (isPhotoItem(item)) {
      const photo = getItemPhoto(designRef.current, item)
      if (!photo?.src) h.onRequestPhoto(item)
      else h.setCropId((c) => (c === item.id ? null : item.id))
    } else if (item.type === 'text' || item.type === 'badge') h.onEditText(item)
    else if (item.type === 'logo') h.onRequestPhoto(item)
  }

  function startGesture(e, item, mode, handle) {
    const box0 = { x: item.box.x, y: item.box.y, w: item.box.w, h: item.box.h, rotate: item.box.rotate || 0 }
    gesture.current = {
      mode,
      handle,
      item,
      box0,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      key: `g${Date.now()}${Math.random()}`,
      strict: isStrictItem(item),
      lock: locksAspect(item),
      isPhoto: isPhotoItem(item),
      photo0: getItemPhoto(designRef.current, item),
      inset: item.kind === 'slot' ? frameInset(item.data.ring) : item.data.ringWidth || 0,
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onItemPointerDown(e, item) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.stopPropagation()
    if (pointers.current.size > 1) return
    if (selectedId !== item.id) onSelect(item.id)
    if (cropId && cropId !== item.id) setCropId(null)
    startGesture(e, item, cropId === item.id ? 'pan' : 'move')
  }

  function onHandlePointerDown(e, handle) {
    e.stopPropagation()
    if (selected) startGesture(e, selected, 'resize', handle)
  }

  // ------------------------------------------------- pinch-zoom (crop mode)
  function onPointerDownCapture(e) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && selected && isPhotoItem(selected)) {
      if (gesture.current) gesture.current.cancelled = true
      const [a, b] = [...pointers.current.values()]
      const photo = getItemPhoto(designRef.current, selected)
      if (photo?.src) {
        pinch.current = { dist0: Math.hypot(a.x - b.x, a.y - b.y), zoom0: photo.zoom || 1, item: selected, key: `p${Date.now()}` }
        setCropId(selected.id)
      }
    }
  }
  function onPointerMoveCapture(e) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = pinch.current
    if (p && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const zoom = clamp((p.zoom0 * Math.hypot(a.x - b.x, a.y - b.y)) / (p.dist0 || 1), 1, MAX_ZOOM)
      update((d) => setItemPhoto(d, p.item, { zoom }), p.key)
    }
  }
  function onPointerUpCapture(e) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  // wheel zoom while cropping (non-passive so the page doesn't scroll)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e) => {
      const d = designRef.current
      const item = getItems(d, template).find((i) => i.id === cropId)
      if (!item) return
      const photo = getItemPhoto(d, item)
      if (!photo?.src) return
      e.preventDefault()
      const zoom = clamp((photo.zoom || 1) * Math.exp(-e.deltaY * 0.0015), 1, MAX_ZOOM)
      update((dd) => setItemPhoto(dd, item, { zoom }), `wheel-${item.id}`)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [cropId, template, update])

  useEffect(() => () => onUp(), [onUp])

  // ------------------------------------------------------------------ render
  const s = scale
  const posterW = POSTER_W * s
  const posterH = POSTER_H * s
  const cropping = selected && cropId === selected.id && isPhotoItem(selected)

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full overflow-hidden stage-bg select-none ${dragOver ? 'ring-4 ring-inset ring-brand-green/50' : ''}`}
      style={{ touchAction: 'none' }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMoveCapture={onPointerMoveCapture}
      onPointerUpCapture={onPointerUpCapture}
      onPointerCancelCapture={onPointerUpCapture}
      onPointerDown={() => {
        onSelect(null)
        setCropId(null)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onDropFile(file)
      }}
      data-testid="stage"
    >
      {s > 0 && (
        <div className="absolute" style={{ left: '50%', top: '50%', width: posterW, height: posterH, transform: 'translate(-50%, -50%)' }}>
          <div className="shadow-poster" style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${s})`, transformOrigin: '0 0' }}>
            <PosterCanvas ref={posterRef} design={design} template={template} defaultLogo={defaultLogo} />
          </div>

          {/* ------- overlay (screen px) ------- */}
          <div className="absolute inset-0" data-testid="overlay">
            {cropping && <CropGhost item={selected} photo={getItemPhoto(design, selected)} s={s} />}

            {items.map((it) => (
              <div
                key={it.id}
                data-item={it.id}
                onPointerDown={(e) => onItemPointerDown(e, it)}
                className={`absolute ${selectedId === it.id ? '' : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-navy/50'}`}
                style={{
                  left: it.box.x * s,
                  top: it.box.y * s,
                  width: it.box.w * s,
                  height: it.box.h * s,
                  transform: it.box.rotate ? `rotate(${it.box.rotate}deg)` : undefined,
                  cursor: cropId === it.id ? 'grab' : 'move',
                }}
              />
            ))}

            {guides.v && <div className="absolute top-0 bottom-0 w-px bg-pink-500 pointer-events-none" style={{ left: posterW / 2 }} />}
            {guides.h && <div className="absolute left-0 right-0 h-px bg-pink-500 pointer-events-none" style={{ top: posterH / 2 }} />}

            {selected && (
              <Selection
                item={selected}
                s={s}
                cropping={cropping}
                label={`${itemIcon(selected)} ${itemLabel(selected, design, template)}`}
                handles={locksAspect(selected) ? HANDLES.filter(([x, y]) => x && y) : HANDLES}
                onHandlePointerDown={onHandlePointerDown}
              />
            )}
          </div>
        </div>
      )}
      {cropping && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10 bg-ink/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          ক্রপ মোড — টেনে ছবি সরান · স্ক্রল/পিঞ্চ করে জুম
        </div>
      )}
    </div>
  )
}

function clampPosition(item, x, y, w, h) {
  if (isStrictItem(item)) {
    return {
      x: w >= POSTER_W ? clamp(x, POSTER_W - w, 0) : clamp(x, 0, POSTER_W - w),
      y: h >= POSTER_H ? clamp(y, POSTER_H - h, 0) : clamp(y, 0, POSTER_H - h),
    }
  }
  const keep = 40
  return { x: clamp(x, keep - w, POSTER_W - keep), y: clamp(y, keep - h, POSTER_H - keep) }
}

function Selection({ item, s, cropping, label, handles, onHandlePointerDown }) {
  const b = item.box
  const w = b.w * s
  const h = b.h * s
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: b.x * s, top: b.y * s, width: w, height: h, transform: b.rotate ? `rotate(${b.rotate}deg)` : undefined }}
      data-testid="selection"
    >
      <div className={`absolute -inset-px rounded-[2px] ${cropping ? 'border-2 border-dashed border-amber-400' : 'border-2 border-navy'}`} style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.8)' }} />
      <div
        className={`absolute left-0 whitespace-nowrap text-[11px] font-bold px-1.5 py-0.5 rounded-md text-white ${cropping ? 'bg-amber-500' : 'bg-navy'}`}
        style={{ top: h < 60 ? h + 6 : -24 }}
      >
        {cropping ? '✂️ ক্রপ' : label}
      </div>
      {!cropping &&
        handles.map(([hx, hy]) => (
          <div
            key={`${hx}${hy}`}
            data-handle={`${hx},${hy}`}
            onPointerDown={(e) => onHandlePointerDown(e, [hx, hy])}
            className="absolute pointer-events-auto flex items-center justify-center"
            style={{
              width: 30,
              height: 30,
              left: ((hx + 1) / 2) * w - 15,
              top: ((hy + 1) / 2) * h - 15,
              cursor: hx === 0 ? 'ns-resize' : hy === 0 ? 'ew-resize' : hx === hy ? 'nwse-resize' : 'nesw-resize',
              touchAction: 'none',
            }}
          >
            <div className={`bg-white border-2 border-navy shadow ${hx && hy ? 'w-3.5 h-3.5 rounded-full' : 'w-3 h-3 rounded-sm'}`} />
          </div>
        ))}
    </div>
  )
}

/** Faded full image around the frame while cropping, so the user sees what's cut off. */
function CropGhost({ item, photo, s }) {
  if (!photo?.src) return null
  const b = item.box
  const inset = item.kind === 'slot' ? frameInset(item.data.ring) : item.data.ringWidth || 0
  const L = photoLayout(photo, b.w - inset * 2, b.h - inset * 2)
  if (!L) return null
  const cx = (b.x + b.w / 2) * s
  const cy = (b.y + b.h / 2) * s
  return (
    <div className="absolute pointer-events-none" style={{ left: cx, top: cy, width: 0, height: 0, transform: `rotate(${b.rotate || 0}deg)` }}>
      <img
        src={photo.src}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{
          left: 0,
          top: 0,
          width: L.imgW * s,
          height: L.imgH * s,
          opacity: 0.38,
          outline: '1.5px dashed rgba(255,255,255,0.9)',
          transform: `translate(-50%, -50%) translate(${L.offX * s}px, ${L.offY * s}px) rotate(${photo.rotate || 0}deg)`,
        }}
      />
    </div>
  )
}
