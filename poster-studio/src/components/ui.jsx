import React, { useEffect, useRef, useState } from 'react'
import { resolveColor } from '../lib/colors.js'

export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-dark/55 p-0 sm:p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`pop-in bg-white w-full ${wide ? 'sm:max-w-lg' : 'sm:max-w-sm'} rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[92vh] flex flex-col`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-ui-line">
          <h3 className="text-[15px] font-bold text-navy">{title}</h3>
          <button className="tool-btn" onClick={onClose} aria-label="বন্ধ করুন">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto thin-scroll">{children}</div>
        {footer && <div className="px-4 pb-4 pt-1 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/** Promise-style confirm / prompt dialogs rendered by <DialogHost />. */
let pushDialog = null

export function confirmDialog(message, { okLabel = 'হ্যাঁ', danger = true } = {}) {
  return new Promise((resolve) => pushDialog?.({ type: 'confirm', message, okLabel, danger, resolve }))
}

export function promptDialog(message, initial = '', { okLabel = 'ঠিক আছে', placeholder = '' } = {}) {
  return new Promise((resolve) => pushDialog?.({ type: 'prompt', message, initial, okLabel, placeholder, resolve }))
}

export function DialogHost() {
  const [d, setD] = useState(null)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    pushDialog = (dlg) => {
      setValue(dlg.initial || '')
      setD(dlg)
    }
    return () => (pushDialog = null)
  }, [])
  useEffect(() => {
    if (d?.type === 'prompt') setTimeout(() => inputRef.current?.select(), 30)
  }, [d])
  const close = (result) => {
    d?.resolve(result)
    setD(null)
  }
  if (!d) return null
  const submit = () => close(d.type === 'prompt' ? value.trim() || null : true)
  return (
    <Modal
      open
      onClose={() => close(d.type === 'prompt' ? null : false)}
      title={d.type === 'prompt' ? d.message : 'নিশ্চিত করুন'}
      footer={
        <>
          <button className="btn btn-outline flex-1" onClick={() => close(d.type === 'prompt' ? null : false)}>
            বাতিল
          </button>
          <button className={`btn flex-1 ${d.danger && d.type === 'confirm' ? 'bg-brand-red text-white hover:bg-red-700' : 'btn-primary'}`} onClick={submit} data-testid="dialog-ok">
            {d.okLabel}
          </button>
        </>
      }
    >
      {d.type === 'prompt' ? (
        <input
          ref={inputRef}
          className="field-input"
          value={value}
          placeholder={d.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          data-testid="dialog-input"
        />
      ) : (
        <p className="text-[14.5px] text-ink-soft leading-relaxed">{d.message}</p>
      )}
    </Modal>
  )
}

export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDone, toast.ms || 2400)
    return () => clearTimeout(t)
  }, [toast, onDone])
  if (!toast) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] pointer-events-none">
      <div className={`pop-in px-4 py-2.5 rounded-full text-[13.5px] font-semibold shadow-pop whitespace-nowrap ${toast.tone === 'error' ? 'bg-brand-red text-white' : 'bg-ink/90 text-white'}`} role="status">
        {toast.message}
      </div>
    </div>
  )
}

export function Segmented({ value, options, onChange, size = 'md' }) {
  return (
    <div className="flex gap-1 bg-ui-bg border border-ui-line rounded-[10px] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md font-semibold transition-colors whitespace-nowrap ${size === 'sm' ? 'text-xs py-1.5 px-2' : 'text-[13px] py-2 px-2'} ${
            value === o.value ? 'bg-white text-navy shadow-sm' : 'text-ink-soft hover:text-navy'
          }`}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, display, onCommit }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-soft mb-1.5">
        <span>{label}</span>
        <span className="tabular-nums text-ink-mute">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} onPointerUp={onCommit} className="w-full" />
    </label>
  )
}

const SWATCH_TOKENS = ['$primary', '$secondary', '$accent', '$text', '$bg']

/** Palette-token swatches + white/black + free colour picker. */
export function ColorPicker({ value, pal, onChange, label }) {
  const resolved = resolveColor(value, pal)
  const isCustom = value && !SWATCH_TOKENS.includes(value) && value !== '#ffffff' && value !== '#000000'
  const sw = (v, title) => {
    const c = resolveColor(v, pal)
    const active = value === v
    return (
      <button
        key={v}
        type="button"
        title={title}
        onClick={() => onChange(v)}
        className={`w-8 h-8 rounded-full border shrink-0 transition-transform ${active ? 'ring-2 ring-navy ring-offset-2 scale-105' : 'border-black/15 hover:scale-105'}`}
        style={{ background: c }}
        aria-label={title}
      />
    )
  }
  return (
    <div>
      {label && <div className="text-xs font-semibold text-ink-soft mb-1.5">{label}</div>}
      <div className="flex items-center gap-2 flex-wrap">
        {sw('$primary', 'প্রধান রং')}
        {sw('$secondary', 'সহায়ক রং')}
        {sw('$accent', 'অ্যাকসেন্ট')}
        {sw('$text', 'লেখার রং')}
        {sw('#ffffff', 'সাদা')}
        {sw('#000000', 'কালো')}
        <label className={`relative w-8 h-8 rounded-full overflow-hidden border shrink-0 cursor-pointer ${isCustom ? 'ring-2 ring-navy ring-offset-2' : 'border-black/15'}`} title="নিজের রং">
          <span className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
          <input type="color" className="absolute inset-0 opacity-0 w-full h-full" value={/^#[0-9a-f]{6}$/i.test(resolved) ? resolved : '#000000'} onChange={(e) => onChange(e.target.value)} />
        </label>
      </div>
    </div>
  )
}
