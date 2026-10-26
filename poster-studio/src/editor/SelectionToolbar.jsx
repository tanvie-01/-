import React, { useEffect, useState } from 'react'
import { ColorPicker, Segmented, Slider } from '../components/ui.jsx'
import { elementCaps } from '../elements/library.jsx'
import { FONTS, PHOTO_SHAPES, POSTER_H, clamp, shapeLocksAspect } from '../lib/constants.js'
import { MAX_ZOOM } from '../lib/photo.js'
import { resolveColor } from '../lib/colors.js'
import { getItemPhoto, isPhotoItem, setItemPhoto, updateItem } from '../state/items.js'
import { itemIcon, itemLabel } from './itemInfo.js'

function Btn({ children, onClick, active, title, danger, testid }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} data-testid={testid} className={`tool-btn ${active ? 'active' : ''} ${danger ? 'text-brand-red hover:bg-red-50' : ''}`}>
      {children}
    </button>
  )
}

const Sep = () => <div className="w-px h-6 bg-ui-line shrink-0 mx-0.5" />

/**
 * Contextual controls for the selected item, shown above the canvas.
 * Row 1 is a compact, horizontally scrollable button strip; detailed
 * controls (colours, sliders, text) open in row 2 so nothing is clipped on
 * narrow phones.
 */
export default function SelectionToolbar({ item, design, template, pal, update, cropId, actions }) {
  const [pop, setPop] = useState(null)
  useEffect(() => setPop(null), [item?.id])

  if (!item) {
    return (
      <div className="h-[50px] flex items-center justify-center px-3 text-[12.5px] text-ink-mute text-center border-b border-ui-line bg-white">
        <span className="sm:hidden">যেকোনো অংশে ট্যাপ করে এডিট করুন</span>
        <span className="hidden sm:inline">পোস্টারের যেকোনো অংশে ট্যাপ করে সিলেক্ট করুন · ছবিতে ডাবল-ট্যাপ করে ক্রপ করুন</span>
      </div>
    )
  }

  const key = (k) => `${k}-${item.id}`
  const patch = (p, k = 'style') => update((d) => updateItem(d, item.id, p), key(k))
  const data = item.data
  const isSlot = item.kind === 'slot'
  const isPhoto = isPhotoItem(item)
  const isText = item.type === 'text'
  const caps = isSlot ? null : elementCaps(data)
  const photo = isPhoto ? getItemPhoto(design, item) : null
  const toggle = (name) => setPop((p) => (p === name ? null : name))

  const scaleText = (k) => {
    const size = Math.round((data.size || 40) * k)
    if (isSlot) {
      // grow/shrink the box with the text so it has room, keeping it centred
      const h = clamp(data.h * k, 24, POSTER_H)
      patch({ size, h, y: clamp(data.y - (h - data.h) / 2, 0, POSTER_H - h) }, 'size')
    } else patch({ size }, 'size')
  }

  return (
    <div className="border-b border-ui-line bg-white" data-testid="toolbar">
      <div className="h-[50px] flex items-center gap-1 px-2 overflow-x-auto no-scrollbar">
        <span className="text-[12.5px] font-bold text-navy px-1.5 whitespace-nowrap shrink-0">
          {itemIcon(item)} {itemLabel(item, design, template)}
        </span>
        <Sep />

        {/* ---------- photo ---------- */}
        {isPhoto && (
          <>
            {photo?.src ? (
              <>
                <Btn active={cropId === item.id} onClick={actions.toggleCrop} title="ক্রপ / ছবি সরান" testid="tb-crop">
                  ✂️ ক্রপ
                </Btn>
                <Btn active={pop === 'zoom'} onClick={() => toggle('zoom')} title="জুম ও ফিট" testid="tb-zoom">
                  🔍 জুম
                </Btn>
              </>
            ) : null}
            <Btn active={pop === 'shape'} onClick={() => toggle('shape')} title="ফ্রেমের আকৃতি" testid="tb-shape">
              ⬚ আকৃতি
            </Btn>
            <Btn onClick={actions.requestPhoto} title={photo?.src ? 'ছবি বদলান' : 'ছবি যোগ করুন'} testid="tb-upload">
              ⬆️ {photo?.src ? 'বদলান' : 'ছবি দিন'}
            </Btn>
            {photo?.src && (
              <Btn onClick={actions.removePhoto} title="ছবি সরিয়ে ফেলুন" danger>
                🗑️ ছবি
              </Btn>
            )}
          </>
        )}

        {/* ---------- logo ---------- */}
        {item.type === 'logo' && (
          <Btn onClick={actions.requestPhoto} title="লোগো বদলান">
            ⬆️ লোগো বদলান
          </Btn>
        )}

        {/* ---------- text (slot or element) / badge ---------- */}
        {(isText || item.type === 'badge') && (
          <>
            <Btn onClick={() => (isSlot ? actions.editText() : toggle('text'))} active={pop === 'text'} title="লেখা পরিবর্তন" testid="tb-edit-text">
              ✏️ লেখা
            </Btn>
            <select
              className="h-[34px] rounded-lg border border-ui-line bg-white text-[12.5px] px-1.5 max-w-[130px] shrink-0"
              value={data.font || 'hind'}
              onChange={(e) => patch({ font: e.target.value }, 'font')}
              title="ফন্ট"
              data-testid="tb-font"
            >
              {FONTS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            {isText && (
              <>
                <Btn onClick={() => scaleText(1 / 1.12)} title="লেখা ছোট করুন" testid="tb-size-down">
                  A−
                </Btn>
                <Btn onClick={() => scaleText(1.12)} title="লেখা বড় করুন" testid="tb-size-up">
                  A+
                </Btn>
                <Btn active={(data.weight || 600) >= 700} onClick={() => patch({ weight: (data.weight || 600) >= 700 ? 500 : 800 }, 'weight')} title="বোল্ড">
                  <b>B</b>
                </Btn>
                <Btn
                  onClick={() => patch({ align: { left: 'center', center: 'right', right: 'left' }[data.align || 'center'] }, 'align')}
                  title="অ্যালাইনমেন্ট"
                >
                  {{ left: '⇤', center: '⇔', right: '⇥' }[data.align || 'center']}
                </Btn>
              </>
            )}
          </>
        )}

        {/* ---------- colours ---------- */}
        {(isText || (caps && (caps.color || caps.color2))) && (
          <Btn active={pop === 'color'} onClick={() => toggle('color')} title="রং" testid="tb-color">
            <span className="w-4 h-4 rounded-full border border-black/20" style={{ background: resolveColor(data.color || '$text', pal) }} /> রং
          </Btn>
        )}
        {caps?.stroke && (
          <Btn active={pop === 'stroke'} onClick={() => toggle('stroke')} title="রেখার পুরুত্ব">
            ━ পুরুত্ব
          </Btn>
        )}

        <Btn active={pop === 'more'} onClick={() => toggle('more')} title="ঘোরানো ও স্বচ্ছতা" testid="tb-more">
          ⟳ আরও
        </Btn>
        <Sep />

        {/* ---------- arrange ---------- */}
        {!isSlot && (
          <>
            <Btn onClick={actions.bringFront} title="সবার সামনে আনুন">
              ⬆︎ সামনে
            </Btn>
            <Btn onClick={actions.sendBack} title="পেছনে পাঠান">
              ⬇︎ পেছনে
            </Btn>
            <Btn onClick={actions.duplicate} title="ডুপ্লিকেট" testid="tb-duplicate">
              ⧉
            </Btn>
          </>
        )}
        {isSlot && (
          <Btn onClick={actions.resetSlot} title="টেমপ্লেটের মূল অবস্থানে ফেরান" testid="tb-reset">
            ↺ রিসেট
          </Btn>
        )}
        <Btn onClick={actions.remove} title={isSlot ? 'লুকিয়ে রাখুন' : 'মুছে ফেলুন'} danger testid="tb-delete">
          {isSlot ? '🙈 লুকান' : '🗑️'}
        </Btn>
      </div>

      {/* ---------------- row 2: detail panels ---------------- */}
      {pop && (
        <div className="px-3 py-3 border-t border-ui-line bg-ui-bg/60 pop-in" data-testid="toolbar-pop">
          {pop === 'zoom' && photo && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end max-w-xl">
              <Slider
                label="জুম"
                value={photo.zoom || 1}
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                display={`${Math.round((photo.zoom || 1) * 100)}%`}
                onChange={(v) => update((d) => setItemPhoto(d, item, { zoom: v }), key('zoom'))}
              />
              <div className="flex gap-2 items-center">
                <Segmented
                  size="sm"
                  value={photo.fit || 'cover'}
                  onChange={(fit) => update((d) => setItemPhoto(d, item, { fit, zoom: 1, panX: 0, panY: 0 }), key('fit'))}
                  options={[
                    { value: 'cover', label: 'ফ্রেম ভরাট' },
                    { value: 'contain', label: 'পুরো ছবি' },
                  ]}
                />
                <button className="btn btn-outline btn-sm" onClick={() => update((d) => setItemPhoto(d, item, { rotate: ((photo.rotate || 0) + 90) % 360, panX: 0, panY: 0 }), key('rot'))}>
                  ⟳ ৯০°
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => update((d) => setItemPhoto(d, item, { zoom: 1, panX: 0, panY: 0, rotate: 0, fit: 'cover' }), key('reset'))}>
                  রিসেট
                </button>
              </div>
            </div>
          )}

          {pop === 'shape' && (
            <div className="flex flex-wrap gap-2">
              {PHOTO_SHAPES.map((sh) => {
                return (
                  <button
                    key={sh.key}
                    className={`btn btn-sm ${data.shape === sh.key ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      const p = { shape: sh.key }
                      if (shapeLocksAspect(sh.key) && Math.abs(data.w - data.h) > 1) {
                        const m = Math.min(data.w, data.h)
                        Object.assign(p, { w: m, h: m, x: data.x + (data.w - m) / 2, y: data.y + (data.h - m) / 2 })
                      }
                      patch(p, 'shape')
                    }}
                  >
                    {sh.label}
                  </button>
                )
              })}
            </div>
          )}

          {pop === 'text' && !isSlot && (
            <textarea
              className="field-input resize-none"
              rows={3}
              value={data.text || ''}
              autoFocus
              onChange={(e) => patch({ text: e.target.value }, 'text')}
              data-testid="tb-textarea"
            />
          )}

          {pop === 'color' && (
            <div className="space-y-3">
              <ColorPicker value={data.color} pal={pal} onChange={(color) => patch({ color }, 'color')} label={caps?.color2 ? 'প্রধান রং' : undefined} />
              {caps?.color2 && <ColorPicker value={data.color2 || data.color} pal={pal} onChange={(color2) => patch({ color2 }, 'color2')} label="দ্বিতীয় রং" />}
              {item.type === 'badge' && <ColorPicker value={data.textColor || '#ffffff'} pal={pal} onChange={(textColor) => patch({ textColor }, 'tcolor')} label="লেখার রং" />}
              {caps?.fillMode && (
                <Segmented
                  size="sm"
                  value={data.fill || 'fill'}
                  onChange={(fill) => patch({ fill }, 'fill')}
                  options={[
                    { value: 'fill', label: 'ভরাট' },
                    { value: 'gradient', label: 'গ্রেডিয়েন্ট' },
                    { value: 'outline', label: 'আউটলাইন' },
                  ]}
                />
              )}
            </div>
          )}

          {pop === 'stroke' && <Slider label="রেখার পুরুত্ব" value={data.stroke || 6} min={1} max={40} onChange={(v) => patch({ stroke: v }, 'stroke')} display={`${data.stroke || 6}px`} />}

          {pop === 'more' && (
            <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
              <Slider label="ঘোরান" value={data.rotate || 0} min={-180} max={180} onChange={(v) => patch({ rotate: Math.abs(v) < 3 ? 0 : v }, 'rotate')} display={`${data.rotate || 0}°`} />
              <Slider label="স্বচ্ছতা" value={Math.round((data.opacity ?? 1) * 100)} min={5} max={100} onChange={(v) => patch({ opacity: v / 100 }, 'opacity')} display={`${Math.round((data.opacity ?? 1) * 100)}%`} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
