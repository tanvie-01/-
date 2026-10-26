import React from 'react'
import { PALETTE_KEYS, PRESET_PALETTES } from '../lib/colors.js'

function PaletteSwatch({ pal }) {
  return (
    <div className="flex h-7 rounded-lg overflow-hidden border border-black/10">
      {['primary', 'secondary', 'accent', 'bg', 'text'].map((k) => (
        <div key={k} className="flex-1" style={{ background: pal[k] }} />
      ))}
    </div>
  )
}

/** Theme colours of the poster (applied to template + all token-coloured elements). */
export default function StylePanel({ design, template, pal, update }) {
  const setPalette = (p, key) => update((d) => ({ ...d, palette: p }), key)
  const presets = [{ name: 'টেমপ্লেটের মূল রং', pal: template.palette, original: true }, ...PRESET_PALETTES]
  const isActive = (p) => PALETTE_KEYS.every(({ key }) => (p[key] || '').toLowerCase() === (pal[key] || '').toLowerCase())

  return (
    <div className="space-y-6">
      <section>
        <div className="panel-title">
          <span>🎨 পোস্টারের রং</span>
          {Object.keys(design.palette || {}).length > 0 && (
            <button className="text-xs font-semibold text-ink-mute hover:text-navy" onClick={() => setPalette({}, 'pal-reset')}>
              ↺ মূল রং
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          {PALETTE_KEYS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-ui-line bg-white px-3 py-2">
              <span className="relative w-9 h-9 rounded-full border border-black/15 overflow-hidden shrink-0" style={{ background: pal[key] }}>
                <input
                  type="color"
                  value={pal[key]}
                  onChange={(e) => setPalette({ ...design.palette, [key]: e.target.value }, `pal-${key}`)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  data-palette={key}
                />
              </span>
              <span className="flex-1 text-[13px] font-semibold text-ink">{label}</span>
              <span className="text-[11px] font-mono text-ink-mute uppercase">{pal[key]}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="panel-title">
          <span>✨ রেডিমেড রঙের সেট</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => setPalette(p.original ? {} : { ...p.pal }, 'pal-preset')}
              className={`rounded-xl border-2 p-2 text-left transition-colors ${isActive(p.pal) ? 'border-navy bg-navy-soft' : 'border-ui-line bg-white hover:border-navy/40'}`}
            >
              <PaletteSwatch pal={p.pal} />
              <div className="text-[11.5px] font-semibold text-ink-soft mt-1.5 truncate">{p.name}</div>
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-ink-mute mt-3 leading-relaxed">রং বদলালে টেমপ্লেটের সাথে আপনার যোগ করা এলিমেন্টগুলোর রংও মিলিয়ে বদলে যাবে।</p>
      </section>
    </div>
  )
}
