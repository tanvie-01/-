import React from 'react'

const fmt = (ts) => {
  try {
    return new Date(ts).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

/** Saved poster projects (IndexedDB). */
export default function SavedPanel({ projects, currentId, saving, onSave, onSaveAs, onOpen, onDuplicate, onDelete }) {
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="panel-title">
          <span>💾 সংরক্ষণ</span>
        </div>
        <button className="btn btn-primary w-full" disabled={saving} onClick={onSave}>
          {saving ? 'সংরক্ষণ হচ্ছে…' : currentId ? '💾 পরিবর্তন সংরক্ষণ করুন' : '💾 পোস্টার সংরক্ষণ করুন'}
        </button>
        {currentId && (
          <button className="btn btn-outline w-full" disabled={saving} onClick={onSaveAs}>
            ➕ নতুন কপি হিসেবে সংরক্ষণ
          </button>
        )}
        <p className="text-[11.5px] text-ink-mute leading-relaxed">সব কিছু এই ডিভাইসের ব্রাউজারেই থাকে। কাজ চলাকালীন খসড়া নিজে থেকেই সংরক্ষিত হয়।</p>
      </section>

      <section>
        <div className="panel-title">
          <span>📁 সংরক্ষিত পোস্টার</span>
          <span className="text-xs font-medium text-ink-mute">{projects.length}টি</span>
        </div>
        {projects.length === 0 ? (
          <div className="text-center text-[13px] text-ink-mute py-8 border-2 border-dashed border-ui-line rounded-xl">এখনো কোনো পোস্টার সংরক্ষণ করা হয়নি</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className={`rounded-xl border-2 overflow-hidden bg-white ${p.id === currentId ? 'border-navy' : 'border-ui-line'}`} data-project={p.id}>
                <button className="block w-full" onClick={() => onOpen(p.id)}>
                  <div className="bg-ui-bg" style={{ aspectRatio: '4 / 5' }}>
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>}
                  </div>
                  <div className="px-2 pt-1.5 text-left">
                    <div className="text-[12.5px] font-bold text-ink truncate">{p.name}</div>
                    <div className="text-[10.5px] text-ink-mute truncate">{fmt(p.updatedAt)}</div>
                  </div>
                </button>
                <div className="flex gap-1 p-1.5">
                  <button className="tool-btn flex-1 !h-8 text-xs" onClick={() => onOpen(p.id)}>
                    খুলুন
                  </button>
                  <button className="tool-btn !h-8" onClick={() => onDuplicate(p.id)} title="কপি" aria-label="কপি">
                    ⧉
                  </button>
                  <button className="tool-btn !h-8 text-brand-red" onClick={() => onDelete(p.id)} title="মুছুন" aria-label="মুছুন">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
