import React, { useRef } from 'react'
import PosterCanvas from '../poster/PosterCanvas.jsx'
import useFitScale from '../lib/useFitScale.js'
import { POSTER_W, POSTER_H } from '../lib/constants.js'
import { getCategory } from '../data/categories.js'
import { templatesFor, wrapCustomTemplate } from '../templates/index.jsx'
import { switchTemplate } from '../state/model.js'

/** Live miniature of `template` filled with the user's current content. */
export function TemplateThumb({ design, template, current, defaultLogo }) {
  const ref = useRef(null)
  const s = useFitScale(ref, POSTER_W, POSTER_H)
  const preview = template.id === current.id ? design : switchTemplate(design, current, template, template.isCustom ? design.category : template.category)
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-ui-bg" style={{ aspectRatio: '4 / 5' }}>
      {s > 0 && (
        <div style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${s})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
          <PosterCanvas design={{ ...preview, elements: [] }} template={template} defaultLogo={defaultLogo} />
        </div>
      )}
    </div>
  )
}

function TemplateCard({ t, design, current, defaultLogo, onSelect, children }) {
  const active = t.id === current.id
  return (
    <div className={`relative rounded-xl overflow-hidden border-2 bg-white transition-all ${active ? 'border-navy shadow-card' : 'border-transparent hover:border-navy/30'}`}>
      <button type="button" className="block w-full text-left" onClick={() => onSelect(t)} data-template={t.id} aria-pressed={active}>
        <TemplateThumb design={design} template={t} current={current} defaultLogo={defaultLogo} />
        <div className="px-2.5 py-2 border-t border-ui-line">
          <div className="text-[12.5px] font-bold text-ink truncate">{t.name}</div>
          <div className="text-[10.5px] text-ink-mute truncate">{t.en}</div>
        </div>
      </button>
      {active && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center shadow">✓</div>}
      {children}
    </div>
  )
}

export default function TemplatePanel({ design, template, customTemplates, defaultLogo, onSelect, onUploadBackground, onSaveCustomLayout, onDeleteCustom }) {
  const category = getCategory(design.category)
  const list = templatesFor(design.category)
  const customs = customTemplates.map(wrapCustomTemplate)
  const fileRef = useRef(null)
  const hasLayoutChanges = template.isCustom && Object.keys(design.slotOverrides || {}).length > 0
  const cardProps = { design, current: template, defaultLogo, onSelect }

  return (
    <div className="space-y-6">
      <section>
        <div className="panel-title">
          <span>
            {category.icon} {category.label} — টেমপ্লেট
          </span>
          <span className="text-xs font-medium text-ink-mute">{list.length}টি ডিজাইন</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3">
          {list.map((t) => (
            <TemplateCard key={t.id} t={t} {...cardProps} />
          ))}
        </div>
        <p className="text-[11.5px] text-ink-mute mt-3 leading-relaxed">টেমপ্লেট বদলালে আপনার লেখা নাম, ছবি ও যোগ করা এলিমেন্ট রয়ে যাবে।</p>
      </section>

      <section>
        <div className="panel-title">
          <span>🖌️ আপনার নিজের ব্যাকগ্রাউন্ড</span>
        </div>
        <button className="btn btn-outline w-full" onClick={() => fileRef.current?.click()}>
          ⬆️ ব্যাকগ্রাউন্ড ছবি দিয়ে টেমপ্লেট বানান
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadBackground(f)
            e.target.value = ''
          }}
        />
        {customs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3 mt-3">
            {customs.map((t) => (
              <TemplateCard key={t.id} t={t} {...cardProps}>
                <button className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 text-brand-red text-xs shadow" onClick={() => onDeleteCustom(t.id)} title="মুছুন" aria-label="টেমপ্লেট মুছুন">
                  🗑️
                </button>
              </TemplateCard>
            ))}
          </div>
        )}
        {template.isCustom && (
          <div className="mt-3 p-3 rounded-xl bg-navy-soft text-[12.5px] text-navy leading-relaxed">
            পোস্টারে ছবি ও লেখাগুলো টেনে নিজের মতো সাজান, তারপর লেআউটটি এই টেমপ্লেটে সংরক্ষণ করুন।
            <button className="btn btn-primary btn-sm w-full mt-2" disabled={!hasLayoutChanges} onClick={onSaveCustomLayout}>
              💾 লেআউট টেমপ্লেটে সংরক্ষণ করুন
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
