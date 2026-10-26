import React, { useEffect, useRef } from 'react'
import { FIELD_DEFS, fieldLabel } from '../data/categories.js'
import { fieldsUsed } from '../state/model.js'
import { resetSlot, resolveSlots } from '../state/items.js'

/** Text fields of the current template + logo + any hidden parts. */
export default function ContentPanel({ design, template, update, focusField, onFocusHandled, defaultLogo, onRequestLogo, onResetLogo }) {
  const keys = fieldsUsed(template)
  const refs = useRef({})
  const hidden = resolveSlots(template, design).filter((s) => s.hidden)
  const hasLogo = template.slots.some((s) => s.kind === 'logo')

  useEffect(() => {
    if (!focusField) return
    const el = refs.current[focusField]
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setTimeout(() => {
        el.focus()
        el.select?.()
      }, 120)
    }
    onFocusHandled()
  }, [focusField, onFocusHandled])

  const setField = (k, v) => update((d) => ({ ...d, fields: { ...d.fields, [k]: v } }), `field-${k}`)

  return (
    <div className="space-y-5">
      <section>
        <div className="panel-title">
          <span>✏️ পোস্টারের লেখা</span>
        </div>
        <div className="space-y-3.5">
          {keys.map((k) => {
            const def = FIELD_DEFS[k]
            const common = {
              id: `field-${k}`,
              ref: (el) => (refs.current[k] = el),
              className: 'field-input',
              value: design.fields[k] ?? '',
              onChange: (e) => setField(k, e.target.value),
              'data-field': k,
            }
            return (
              <label key={k} className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-soft mb-1">
                  {fieldLabel(k, design.category, template)}
                  {design.fields[k] && (
                    <button type="button" className="text-[11px] text-ink-mute hover:text-brand-red" onClick={() => setField(k, '')} tabIndex={-1}>
                      মুছুন
                    </button>
                  )}
                </span>
                {def.type === 'textarea' ? <textarea rows={3} {...common} className="field-input resize-none leading-relaxed" /> : <input type="text" {...common} />}
              </label>
            )
          })}
        </div>
        <p className="text-[11.5px] text-ink-mute mt-3 leading-relaxed">কোনো ঘর ফাঁকা রাখলে সেই অংশ পোস্টারে দেখাবে না। পোস্টারের লেখায় ডাবল-ট্যাপ করলেও এখানে চলে আসবেন।</p>
      </section>

      {hasLogo && (
        <section>
          <div className="panel-title">
            <span>🏷️ লোগো</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border border-ui-line bg-white overflow-hidden flex items-center justify-center shrink-0">
              <img src={design.logo || defaultLogo} alt="লোগো" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              <button className="btn btn-outline btn-sm" onClick={onRequestLogo}>
                ⬆️ লোগো বদলান
              </button>
              {design.logo && (
                <button className="btn btn-ghost btn-sm" onClick={onResetLogo}>
                  সংস্থার লোগো
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {hidden.length > 0 && (
        <section>
          <div className="panel-title">
            <span>🙈 লুকানো অংশ</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hidden.map((s) => (
              <button key={s.id} className="btn btn-outline btn-sm" onClick={() => update((d) => resetSlot(d, `slot:${s.id}`))}>
                ↺ {s.kind === 'photo' ? 'ছবি' : s.kind === 'logo' ? 'লোগো' : fieldLabel(s.field, design.category, template)} ফিরিয়ে আনুন
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
