import React from 'react'
import { ELEMENT_GROUPS, ElementView, elementsInGroup, createElement } from '../elements/library.jsx'
import { getItems } from '../state/items.js'
import { itemIcon, itemLabel } from '../editor/itemInfo.js'

const PREVIEW = 58

function ElementPreview({ defKey, pal }) {
  const el = createElement(defKey)
  const k = Math.min(PREVIEW / el.w, PREVIEW / el.h)
  return (
    <div className="flex items-center justify-center" style={{ width: PREVIEW, height: PREVIEW }}>
      <div style={{ width: el.w * k, height: el.h * k, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: el.w, height: el.h, transform: `scale(${k})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0, opacity: Math.max(el.opacity ?? 1, 0.55) }}>
          <ElementView el={el} pal={pal} />
        </div>
      </div>
    </div>
  )
}

/** Add design elements + a layer list of everything on the poster. */
export default function ElementsPanel({ design, template, pal, selectedId, onAdd, onSelect, onRemove }) {
  const items = getItems(design, template).slice().reverse()

  return (
    <div className="space-y-6">
      {ELEMENT_GROUPS.map((g) => (
        <section key={g.id}>
          <div className="panel-title">
            <span>{g.label}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-4 gap-2">
            {elementsInGroup(g.id).map(([key, def]) => (
              <button
                key={key}
                onClick={() => onAdd(key)}
                data-add={key}
                className="group rounded-xl border border-ui-line bg-white hover:border-navy/50 hover:shadow-card transition-all p-1.5 flex flex-col items-center gap-1"
                title={`${def.label} যোগ করুন`}
              >
                <div className="rounded-lg bg-ui-bg w-full flex items-center justify-center py-1">
                  <ElementPreview defKey={key} pal={pal} />
                </div>
                <span className="text-[10.5px] font-semibold text-ink-soft leading-tight text-center">{def.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section>
        <div className="panel-title">
          <span>🗂️ পোস্টারের স্তরসমূহ</span>
          <span className="text-xs font-medium text-ink-mute">উপরেরটি সামনে</span>
        </div>
        <div className="space-y-1.5">
          {items.map((it) => (
            <div
              key={it.id}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors ${selectedId === it.id ? 'border-navy bg-navy-soft' : 'border-ui-line bg-white hover:border-navy/40'}`}
              onClick={() => onSelect(it.id)}
              data-layer={it.id}
            >
              <span className="w-6 text-center">{itemIcon(it)}</span>
              <span className="flex-1 text-[12.5px] font-semibold text-ink truncate">{itemLabel(it, design, template)}</span>
              <span className="text-[10.5px] text-ink-mute">{it.kind === 'slot' ? 'টেমপ্লেট' : it.data.layer === 'back' ? 'পেছনে' : 'সামনে'}</span>
              {it.kind === 'element' && (
                <button
                  className="tool-btn !h-7 !min-w-7 text-brand-red"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(it.id)
                  }}
                  aria-label="মুছুন"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
