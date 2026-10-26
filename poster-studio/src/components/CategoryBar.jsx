import React from 'react'
import { CATEGORIES } from '../data/categories.js'

/** Poster categories across the top of the studio. */
export default function CategoryBar({ value, onChange }) {
  return (
    <div className="bg-white border-b border-ui-line">
      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="পোস্টারের ধরন">
        {CATEGORIES.map((c) => {
          const active = c.id === value
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(c.id)}
              data-category={c.id}
              className={`chip ${active ? 'bg-navy border-navy text-white shadow-card' : 'bg-white border-ui-line text-ink-soft hover:border-navy/40 hover:text-navy'}`}
            >
              <span aria-hidden>{c.icon}</span>
              <span>{c.label}</span>
              <span className={`hidden sm:inline text-[11px] font-medium ${active ? 'text-white/70' : 'text-ink-mute'}`}>{c.en}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
