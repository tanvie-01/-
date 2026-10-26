import React, { useEffect, useState } from 'react'
import { Modal, Segmented } from './ui.jsx'
import { downloadBlob, renderPosterBlob } from '../utils/exportImage.js'

/**
 * Renders the poster at 2160 × 2700 and shows it with Download / Share
 * buttons. On phones the share sheet ("Save image") or long-pressing the
 * preview saves straight to the gallery.
 */
export default function ExportDialog({ open, onClose, posterRef, fileBase, onDone }) {
  const [format, setFormat] = useState('png')
  const [state, setState] = useState({ status: 'idle' })

  useEffect(() => {
    if (!open) {
      setState({ status: 'idle' }) // never show a previous poster's preview on reopen
      return
    }
    let cancelled = false
    let url = null
    setState({ status: 'rendering' })
    renderPosterBlob(posterRef.current, { format })
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        const name = `${fileBase}.${format === 'jpeg' ? 'jpg' : 'png'}`
        const file = new File([blob], name, { type: blob.type })
        const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }))
        setState({ status: 'ready', blob, url, name, file, canShare })
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }, [open, format, posterRef, fileBase])

  const download = () => {
    downloadBlob(state.blob, state.name)
    onDone?.('পোস্টার ডাউনলোড হয়েছে ✅')
  }
  const share = async () => {
    try {
      await navigator.share({ files: [state.file], title: 'পোস্টার' })
    } catch (err) {
      if (err.name !== 'AbortError') onDone?.('শেয়ার করা যায়নি — ডাউনলোড বাটন ব্যবহার করুন', 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="⬇️ পোস্টার ডাউনলোড" wide>
      <div className="space-y-4">
        <Segmented
          value={format}
          onChange={setFormat}
          options={[
            { value: 'png', label: 'PNG (সেরা মান)' },
            { value: 'jpeg', label: 'JPG (ছোট ফাইল)' },
          ]}
        />
        <div className="rounded-xl bg-ui-bg border border-ui-line flex items-center justify-center overflow-hidden" style={{ aspectRatio: '4 / 5', maxHeight: '46vh', margin: '0 auto' }}>
          {state.status === 'rendering' && (
            <div className="text-center text-ink-mute text-sm py-10">
              <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
              উচ্চ মানের ছবি তৈরি হচ্ছে…
            </div>
          )}
          {state.status === 'error' && <div className="text-brand-red text-sm p-6 text-center">ছবি তৈরি করা যায়নি, আবার চেষ্টা করুন।</div>}
          {state.status === 'ready' && <img src={state.url} alt="পোস্টার" className="w-full h-full object-contain" style={{ WebkitTouchCallout: 'default' }} data-testid="export-preview" />}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="btn btn-accent flex-1" disabled={state.status !== 'ready'} onClick={download} data-testid="export-download">
            ⬇️ ডাউনলোড করুন
          </button>
          {state.status === 'ready' && state.canShare && (
            <button className="btn btn-outline flex-1" onClick={share}>
              📤 শেয়ার / গ্যালারিতে সেভ
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-ink-mute text-center">২১৬০ × ২৭০০ পিক্সেল · মোবাইলে ছবির উপর চেপে ধরে রেখেও সেভ করা যায়</p>
      </div>
    </Modal>
  )
}
