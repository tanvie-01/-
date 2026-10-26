import React, { useState } from 'react'
import PhotoFrame from '../poster/PhotoFrame.jsx'
import { Segmented, Slider } from '../components/ui.jsx'
import { PHOTO_SHAPES, shapeLocksAspect } from '../lib/constants.js'
import { MAX_ZOOM } from '../lib/photo.js'
import { getItemPhoto, setItemPhoto, updateItem } from '../state/items.js'

/**
 * Upload / replace / remove and precise crop controls for the photo being
 * edited: the selected image frame if one is selected, otherwise the
 * template's main photo.
 */
export default function PhotoPanel({ design, item, pal, update, cropId, onToggleCrop, onRequestPhoto, onRemovePhoto, onDropFile, onAddImageFrame }) {
  const [over, setOver] = useState(false)

  if (!item) {
    return (
      <div className="text-center py-6 px-2">
        <div className="text-4xl mb-3">🖼️</div>
        <p className="text-[13.5px] text-ink-soft leading-relaxed mb-4">এই টেমপ্লেটে আলাদা ছবির জায়গা নেই। চাইলে একটি ইমেজ ফ্রেম যোগ করে ছবি দিতে পারেন।</p>
        <button className="btn btn-primary" onClick={onAddImageFrame}>
          ➕ ইমেজ ফ্রেম যোগ করুন
        </button>
      </div>
    )
  }

  const photo = getItemPhoto(design, item) || {}
  const data = item.data
  const key = (k) => `${k}-${item.id}`
  const setPhoto = (p, k) => update((d) => setItemPhoto(d, item, p), key(k))
  const isElement = item.kind === 'element'

  return (
    <div className="space-y-5">
      <section>
        <div className="panel-title">
          <span>{isElement ? '🖼️ নির্বাচিত ইমেজ ফ্রেম' : '🖼️ পোস্টারের ছবি'}</span>
          {photo.src && (
            <button className="text-xs font-semibold text-brand-red" onClick={onRemovePhoto}>
              মুছুন
            </button>
          )}
        </div>

        <div
          className={`flex gap-3 items-center p-3 rounded-xl border-2 border-dashed transition-colors ${over ? 'border-brand-green bg-green-50' : 'border-ui-line bg-ui-bg/60'}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) onDropFile(f, item)
          }}
        >
          <div className="relative shrink-0" style={{ width: 84, height: 84 * Math.min(1.3, data.h / data.w) }}>
            <PhotoFrame w={84} h={84 * Math.min(1.3, data.h / data.w)} shape={data.shape} photo={photo} pal={pal} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <button className="btn btn-accent w-full" onClick={onRequestPhoto} data-testid="panel-upload">
              ⬆️ {photo.src ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}
            </button>
            <p className="text-[11px] text-ink-mute leading-snug">যেকোনো মাপের JPG/PNG — ছবি নিজে থেকেই ফ্রেমে সুন্দরভাবে বসে যাবে, বিকৃত হবে না।</p>
          </div>
        </div>
      </section>

      {photo.src && (
        <section className="space-y-4">
          <div className="panel-title mb-0">
            <span>✂️ ক্রপ ও অবস্থান</span>
          </div>
          <button className={`btn w-full ${cropId === item.id ? 'btn-primary' : 'btn-outline'}`} onClick={onToggleCrop} data-testid="panel-crop">
            {cropId === item.id ? '✓ ক্রপ শেষ' : '✋ পোস্টারে টেনে ছবি সরান (ক্রপ মোড)'}
          </button>
          <Segmented
            value={photo.fit || 'cover'}
            onChange={(fit) => setPhoto({ fit, zoom: 1, panX: 0, panY: 0 }, 'fit')}
            options={[
              { value: 'cover', label: 'ফ্রেম ভরাট (ক্রপ)' },
              { value: 'contain', label: 'পুরো ছবি দেখান' },
            ]}
          />
          <Slider label="জুম" value={photo.zoom || 1} min={1} max={MAX_ZOOM} step={0.01} display={`${Math.round((photo.zoom || 1) * 100)}%`} onChange={(v) => setPhoto({ zoom: v }, 'zoom')} />
          <Slider label="বামে ↔ ডানে" value={Math.round((photo.panX || 0) * 100)} min={-100} max={100} onChange={(v) => setPhoto({ panX: v / 100 }, 'panx')} />
          <Slider label="উপরে ↕ নিচে" value={Math.round((photo.panY || 0) * 100)} min={-100} max={100} onChange={(v) => setPhoto({ panY: v / 100 }, 'pany')} />
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm flex-1" onClick={() => setPhoto({ rotate: ((photo.rotate || 0) + 90) % 360, panX: 0, panY: 0 }, 'rot')}>
              ⟳ ৯০° ঘোরান
            </button>
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => setPhoto({ zoom: 1, panX: 0, panY: 0, rotate: 0, fit: 'cover' }, 'reset')}>
              ↺ ক্রপ রিসেট
            </button>
          </div>
        </section>
      )}

      <section>
        <div className="panel-title">
          <span>⬚ ফ্রেমের আকৃতি</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PHOTO_SHAPES.map((sh) => (
            <button
              key={sh.key}
              title={sh.label}
              onClick={() => {
                const p = { shape: sh.key }
                if (shapeLocksAspect(sh.key) && Math.abs(data.w - data.h) > 1) {
                  const m = Math.min(data.w, data.h)
                  Object.assign(p, { w: m, h: m, x: data.x + (data.w - m) / 2, y: data.y + (data.h - m) / 2 })
                }
                update((d) => updateItem(d, item.id, p), key('shape'))
              }}
              className={`rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition-colors ${data.shape === sh.key ? 'border-navy bg-navy-soft' : 'border-ui-line hover:border-navy/40'}`}
            >
              <div className="relative" style={{ width: 34, height: 34 }}>
                <PhotoFrame w={34} h={34} shape={sh.key} photo={photo} pal={pal} />
              </div>
              <span className="text-[10.5px] font-semibold text-ink-soft">{sh.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-ink-mute mt-3 leading-relaxed">টিপস: পোস্টারে ছবিটি টেনে সরান, কোণার হ্যান্ডেল টেনে বড়-ছোট করুন (অনুপাত ঠিক থাকে)। দুই আঙুলে পিঞ্চ করে জুম করা যায়।</p>
      </section>
    </div>
  )
}
