import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CategoryBar from './components/CategoryBar.jsx'
import ExportDialog from './components/ExportDialog.jsx'
import { DialogHost, Toast, confirmDialog, promptDialog } from './components/ui.jsx'
import EditorStage from './editor/EditorStage.jsx'
import SelectionToolbar from './editor/SelectionToolbar.jsx'
import TemplatePanel from './panels/TemplatePanel.jsx'
import ContentPanel from './panels/ContentPanel.jsx'
import PhotoPanel from './panels/PhotoPanel.jsx'
import ElementsPanel from './panels/ElementsPanel.jsx'
import StylePanel from './panels/StylePanel.jsx'
import SavedPanel from './panels/SavedPanel.jsx'
import { paletteOf } from './poster/PosterCanvas.jsx'
import { createElement } from './elements/library.jsx'
import { getCategory } from './data/categories.js'
import { TEMPLATES, getTemplate, templatesFor, defaultCustomSlots } from './templates/index.jsx'
import { migrateLegacyProject, newDesign, switchTemplate } from './state/model.js'
import useDesignHistory from './state/useDesignHistory.js'
import { findItem, getItems, isPhotoItem, removeItem, resetSlot, resolveSlots, setItemPhoto, slotItemId, elementItemId } from './state/items.js'
import { emptyPhoto, ensurePhotoSize, loadImageFile } from './lib/photo.js'
import { ORG, uid } from './lib/constants.js'
import {
  deleteCustomTemplate,
  deleteProject,
  getAllCustomTemplates,
  getAllProjects,
  loadDraft,
  newProjectId,
  newTemplateId,
  saveCustomTemplate,
  saveDraft,
  saveProject,
} from './utils/storage.js'
import { generateThumbnail } from './utils/exportImage.js'
import defaultLogo from './assets/logo.jpg'

// Running as the Poster Studio section inside the Notice App (?embedded=1)
const EMBEDDED = new URLSearchParams(window.location.search).has('embedded')

const TABS = [
  { id: 'template', label: 'টেমপ্লেট', icon: '🗂️' },
  { id: 'content', label: 'লেখা', icon: '✏️' },
  { id: 'photo', label: 'ছবি', icon: '🖼️' },
  { id: 'elements', label: 'এলিমেন্ট', icon: '✨' },
  { id: 'style', label: 'রং', icon: '🎨' },
  { id: 'saved', label: 'সংরক্ষিত', icon: '💾' },
]

export default function App() {
  const { design, update, undo, redo, load, canUndo, canRedo } = useDesignHistory(() => newDesign(TEMPLATES[0]))
  const [customTemplates, setCustomTemplates] = useState([])
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState({ id: null, name: '' })
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('template')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [cropId, setCropId] = useState(null)
  const [focusField, setFocusField] = useState(null)
  const [toast, setToast] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const posterRef = useRef(null)
  const fileRef = useRef(null)
  const uploadTarget = useRef(null) // { kind: 'slot' | 'element' | 'logo', id? }

  const template = getTemplate(design.templateId, customTemplates)
  const pal = paletteOf(design, template)
  const selectedItem = useMemo(() => findItem(design, template, selectedId), [design, template, selectedId])

  const notify = useCallback((message, tone = 'success', ms) => setToast({ message, tone, ms, at: Date.now() }), [])
  const clearFocusField = useCallback(() => setFocusField(null), [])
  const clearToast = useCallback(() => setToast(null), [])

  // -------------------------------------------------------------- startup
  useEffect(() => {
    ;(async () => {
      const [customs, projs, draft] = await Promise.all([getAllCustomTemplates(), getAllProjects(), loadDraft()])
      setCustomTemplates(customs)
      setProjects(projs)
      if (draft?.design) {
        const d = { ...draft.design, photo: await ensurePhotoSize(draft.design.photo) }
        load(d)
        setProject(draft.project || { id: null, name: '' })
      }
      setReady(true)
    })()
  }, [load])

  // autosave the working draft
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => saveDraft({ design, project }), 700)
    return () => clearTimeout(t)
  }, [design, project, ready])

  // drop a selection that no longer exists (undo, template switch…)
  useEffect(() => {
    if (selectedId && !selectedItem) setSelectedId(null)
    if (cropId && cropId !== selectedId) setCropId(null)
  }, [selectedId, selectedItem, cropId])

  // ------------------------------------------------- category & template
  const selectCategory = (catId) => {
    setSelectedId(null)
    setTab('template')
    setMobilePanelOpen(true)
    if (catId === design.category) return
    const next = templatesFor(catId)[0]
    update((d) => switchTemplate(d, template, next, catId))
  }

  const selectTemplate = (t) => {
    if (t.id === template.id) return
    setSelectedId(null)
    update((d) => switchTemplate(d, template, t))
  }

  // ---------------------------------------------------------------- photos
  const photoSlot = resolveSlots(template, design).find((s) => s.kind === 'photo' && !s.hidden)
  const photoItem = selectedItem && isPhotoItem(selectedItem) ? selectedItem : photoSlot ? findItemLoose(design, template, slotItemId(photoSlot.id), photoSlot) : null

  function requestUpload(target) {
    uploadTarget.current = target
    fileRef.current?.click()
  }

  function requestPhotoFor(item) {
    if (!item) {
      if (photoSlot) return requestUpload({ kind: 'slot' })
      return addElement('image:rounded')
    }
    if (item.type === 'logo') return requestUpload({ kind: 'logo' })
    if (item.kind === 'element') return requestUpload({ kind: 'element', id: item.data.id })
    requestUpload({ kind: 'slot' })
  }

  async function handleFile(file, target = uploadTarget.current || { kind: 'slot' }) {
    let img
    try {
      img = await loadImageFile(file, target.kind === 'logo' ? { maxEdge: 800 } : undefined)
    } catch {
      notify('ছবিটি খোলা যায়নি — JPG বা PNG ছবি দিন', 'error')
      return
    }
    const photo = { ...emptyPhoto(), ...img }
    if (target.kind === 'logo') {
      update((d) => ({ ...d, logo: img.src }))
      notify('লোগো পরিবর্তন হয়েছে')
      return
    }
    if (target.kind === 'element') {
      update((d) => ({ ...d, elements: d.elements.map((e) => (e.id === target.id ? { ...e, photo } : e)) }))
      setSelectedId(elementItemId(target.id))
    } else if (photoSlot) {
      update((d) => ({ ...d, photo, slotOverrides: unhide(d.slotOverrides, photoSlot.id) }))
      setSelectedId(slotItemId(photoSlot.id))
    } else {
      // template without a photo slot → drop the photo into a new image frame
      const el = { ...createElement('image:rounded'), photo }
      update((d) => ({ ...d, elements: [...d.elements, el] }))
      setSelectedId(elementItemId(el.id))
    }
    notify('ছবি যোগ হয়েছে — টেনে সরান, ডাবল-ট্যাপে ক্রপ করুন', 'success', 3200)
  }

  function onDropFile(file, item) {
    if (!file.type.startsWith('image/')) return
    if (item?.kind === 'element') return handleFile(file, { kind: 'element', id: item.data.id })
    const sel = selectedItem && selectedItem.kind === 'element' && selectedItem.type === 'image' ? { kind: 'element', id: selectedItem.data.id } : { kind: 'slot' }
    handleFile(file, sel)
  }

  function removePhoto(item = photoItem) {
    if (!item) return
    update((d) => setItemPhoto(d, item, { ...emptyPhoto() }))
    setCropId(null)
  }

  // -------------------------------------------------------------- elements
  function addElement(key) {
    const el = createElement(key)
    // cascade new elements a little so repeated adds don't stack exactly
    const n = design.elements.filter((e) => e.key === key).length
    if (n && el.w < 1000) {
      el.x += 24 * n
      el.y += 24 * n
    }
    update((d) => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(elementItemId(el.id))
    setCropId(null)
    if (el.type === 'image') requestUpload({ kind: 'element', id: el.id })
    else notify(`${el.layer === 'back' ? 'ব্যাকগ্রাউন্ডে' : 'পোস্টারে'} যোগ হয়েছে — টেনে সাজান`)
  }

  const actions = {
    remove: () => {
      if (!selectedId) return
      update((d) => removeItem(d, selectedId))
      setSelectedId(null)
    },
    duplicate: () => {
      if (!selectedItem || selectedItem.kind !== 'element') return
      const copy = { ...selectedItem.data, id: uid('el'), x: selectedItem.data.x + 30, y: selectedItem.data.y + 30 }
      update((d) => ({ ...d, elements: [...d.elements, copy] }))
      setSelectedId(elementItemId(copy.id))
    },
    bringFront: () => moveLayer('front'),
    sendBack: () => moveLayer('back'),
    resetSlot: () => selectedId && update((d) => resetSlot(d, selectedId)),
    toggleCrop: () => setCropId((c) => (c === selectedId ? null : selectedId)),
    requestPhoto: () => requestPhotoFor(selectedItem),
    removePhoto: () => removePhoto(selectedItem),
    editText: () => editText(selectedItem),
  }

  function moveLayer(where) {
    if (!selectedItem || selectedItem.kind !== 'element') return
    const id = selectedItem.data.id
    update((d) => {
      const el = { ...d.elements.find((e) => e.id === id), layer: where }
      const rest = d.elements.filter((e) => e.id !== id)
      return { ...d, elements: where === 'front' ? [...rest, el] : [el, ...rest] }
    })
    notify(where === 'front' ? 'সবার সামনে আনা হয়েছে' : 'টেমপ্লেটের লেখার পেছনে পাঠানো হয়েছে')
  }

  function editText(item) {
    if (!item) return
    if (item.kind === 'slot') {
      setTab('content')
      setMobilePanelOpen(true)
      setFocusField(item.data.field)
    }
  }

  // ---------------------------------------------------------- custom templates
  async function uploadBackground(file) {
    let img
    try {
      img = await loadImageFile(file, { maxEdge: 2160 })
    } catch {
      notify('ছবিটি খোলা যায়নি', 'error')
      return
    }
    const name = (await promptDialog('টেমপ্লেটের নাম দিন', 'আমার টেমপ্লেট')) || 'আমার টেমপ্লেট'
    const record = { id: newTemplateId(), name, image: img.src, category: design.category, slots: defaultCustomSlots(), createdAt: Date.now() }
    const res = await saveCustomTemplate(record)
    if (!res.ok) return notify(res.error, 'error')
    const customs = await getAllCustomTemplates()
    setCustomTemplates(customs)
    const t = getTemplate(record.id, customs)
    update((d) => switchTemplate(d, template, t))
    notify('টেমপ্লেট তৈরি হয়েছে — এখন ছবি ও লেখা টেনে সাজান', 'success', 3200)
  }

  async function saveCustomLayout() {
    const record = customTemplates.find((t) => t.id === template.id)
    if (!record) return
    const slots = resolveSlots(template, design).map((s) => ({ ...s }))
    const res = await saveCustomTemplate({ ...record, slots, layout: undefined })
    if (!res.ok) return notify(res.error, 'error')
    const customs = await getAllCustomTemplates()
    setCustomTemplates(customs)
    update((d) => ({ ...d, slotOverrides: {} }))
    notify('লেআউট টেমপ্লেটে সংরক্ষিত হয়েছে ✓')
  }

  async function deleteCustom(id) {
    if (!(await confirmDialog('এই কাস্টম টেমপ্লেটটি মুছে ফেলবেন?'))) return
    const res = await deleteCustomTemplate(id)
    if (!res.ok) return notify(res.error, 'error')
    if (template.id === id) update((d) => switchTemplate(d, template, templatesFor(d.category)[0] || TEMPLATES[0]))
    setCustomTemplates(await getAllCustomTemplates())
    notify('টেমপ্লেট মুছে ফেলা হয়েছে')
  }

  // -------------------------------------------------------------- projects
  async function persist(asNew = false) {
    let { id, name } = project
    if (!id || asNew) {
      name = await promptDialog('পোস্টারের নাম দিন', asNew ? `${name} (কপি)` : design.fields.name || design.fields.title || 'নতুন পোস্টার', { okLabel: 'সংরক্ষণ' })
      if (!name) return
      id = newProjectId()
    }
    setSaving(true)
    setSelectedId(null)
    try {
      const thumbnail = await generateThumbnail(posterRef.current, { width: 300 })
      const res = await saveProject({ id, name, design, thumbnail, version: 2, updatedAt: Date.now() })
      if (!res.ok) return notify(res.error, 'error')
      setProject({ id, name })
      setProjects(await getAllProjects())
      notify('পোস্টার সংরক্ষিত হয়েছে ✓')
    } finally {
      setSaving(false)
    }
  }

  async function openProject(id) {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    const d = migrateLegacyProject(p)
    load({ ...d, photo: await ensurePhotoSize(d.photo) }, true)
    setProject({ id: p.id, name: p.name })
    setSelectedId(null)
    notify(`"${p.name}" খোলা হয়েছে`)
  }

  async function duplicateProject(id) {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    const res = await saveProject({ ...p, id: newProjectId(), name: `${p.name} (কপি)`, updatedAt: Date.now() })
    if (!res.ok) return notify(res.error, 'error')
    setProjects(await getAllProjects())
    notify('কপি তৈরি হয়েছে')
  }

  async function removeProject(id) {
    if (!(await confirmDialog('এই পোস্টারটি মুছে ফেলবেন? এই কাজটি ফেরানো যাবে না।'))) return
    const res = await deleteProject(id)
    if (!res.ok) return notify(res.error, 'error')
    if (project.id === id) setProject({ id: null, name: '' })
    setProjects(await getAllProjects())
    notify('মুছে ফেলা হয়েছে')
  }

  async function startNew() {
    if (!(await confirmDialog('নতুন পোস্টার শুরু করবেন? সংরক্ষণ না করা পরিবর্তন হারিয়ে যাবে।', { okLabel: 'নতুন শুরু করুন' }))) return
    load(newDesign(templatesFor(design.category)[0] || TEMPLATES[0]), true)
    setProject({ id: null, name: '' })
    setSelectedId(null)
    setTab('template')
  }

  // ------------------------------------------------------------- keyboard
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      } else if (mod && e.key.toLowerCase() === 'y' && !typing) {
        e.preventDefault()
        redo()
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        persist()
      } else if (typing || exportOpen) {
        return
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        actions.remove()
      } else if (e.key === 'Escape') {
        setCropId(null)
        setSelectedId(null)
      } else if (mod && e.key.toLowerCase() === 'd' && selectedItem?.kind === 'element') {
        e.preventDefault()
        actions.duplicate()
      } else if (selectedItem && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 2
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        update((d) => {
          const it = findItem(d, template, selectedId)
          return it ? updateBox(d, it, dx, dy) : d
        }, `nudge-${selectedId}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---------------------------------------------------------------- render
  const category = getCategory(design.category)
  const fileBase = `${ORG.slug}_Poster_${category.en.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`

  const panel = (
    <div className="p-4 pb-8">
      {tab === 'template' && (
        <TemplatePanel
          design={design}
          template={template}
          customTemplates={customTemplates}
          defaultLogo={defaultLogo}
          onSelect={selectTemplate}
          onUploadBackground={uploadBackground}
          onSaveCustomLayout={saveCustomLayout}
          onDeleteCustom={deleteCustom}
        />
      )}
      {tab === 'content' && (
        <ContentPanel
          design={design}
          template={template}
          update={update}
          focusField={focusField}
          onFocusHandled={clearFocusField}
          defaultLogo={defaultLogo}
          onRequestLogo={() => requestUpload({ kind: 'logo' })}
          onResetLogo={() => update((d) => ({ ...d, logo: null }))}
        />
      )}
      {tab === 'photo' && (
        <PhotoPanel
          design={design}
          item={photoItem}
          pal={pal}
          update={update}
          cropId={cropId}
          onToggleCrop={() => {
            if (!photoItem) return
            setSelectedId(photoItem.id)
            setCropId((c) => (c === photoItem.id ? null : photoItem.id))
          }}
          onRequestPhoto={() => requestPhotoFor(photoItem)}
          onRemovePhoto={() => removePhoto(photoItem)}
          onDropFile={onDropFile}
          onAddImageFrame={() => addElement('image:rounded')}
        />
      )}
      {tab === 'elements' && (
        <ElementsPanel
          design={design}
          template={template}
          pal={pal}
          selectedId={selectedId}
          onAdd={addElement}
          onSelect={setSelectedId}
          onRemove={(id) => update((d) => removeItem(d, id))}
        />
      )}
      {tab === 'style' && <StylePanel design={design} template={template} pal={pal} update={update} />}
      {tab === 'saved' && (
        <SavedPanel
          projects={projects}
          currentId={project.id}
          saving={saving}
          onSave={() => persist(false)}
          onSaveAs={() => persist(true)}
          onOpen={openProject}
          onDuplicate={duplicateProject}
          onDelete={removeProject}
        />
      )}
    </div>
  )

  const tabs = (
    <div className="flex border-b border-ui-line bg-white shrink-0 overflow-x-auto no-scrollbar" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          data-tab={t.id}
          onClick={() => {
            if (tab === t.id) setMobilePanelOpen((o) => !o)
            else {
              setTab(t.id)
              setMobilePanelOpen(true)
            }
          }}
          className={`flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 py-2 text-[11.5px] font-bold border-b-[3px] transition-colors whitespace-nowrap ${
            tab === t.id ? 'border-navy text-navy' : 'border-transparent text-ink-mute hover:text-navy'
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-ui-bg font-ui text-ink overflow-hidden">
      {/* ------------------------------ header ------------------------------ */}
      <header className="h-14 shrink-0 flex items-center gap-2 px-3 sm:px-4 bg-white border-b border-ui-line">
        {!EMBEDDED && (
          <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center text-lg shrink-0" aria-hidden>
            🎨
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* inside the Notice App the section name is already in the app bar */}
          <h1 className="text-[15px] font-bold text-navy leading-tight truncate">{EMBEDDED ? project.name || 'নতুন পোস্টার' : 'পোস্টার স্টুডিও'}</h1>
          <p className="text-[11px] text-ink-mute truncate" data-testid="project-name">
            {EMBEDDED ? `${category.icon} ${category.label} পোস্টার` : `${project.name || 'নতুন পোস্টার'} · ${category.label}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="tool-btn" onClick={undo} disabled={!canUndo} title="আগের অবস্থা (Ctrl+Z)" aria-label="আনডু" data-testid="undo">
            <span className={canUndo ? '' : 'opacity-30'}>↶</span>
          </button>
          <button className="tool-btn" onClick={redo} disabled={!canRedo} title="পরের অবস্থা (Ctrl+Y)" aria-label="রিডু" data-testid="redo">
            <span className={canRedo ? '' : 'opacity-30'}>↷</span>
          </button>
          <button className="btn btn-ghost hidden md:inline-flex" onClick={startNew}>
            🆕 নতুন
          </button>
          <button className="btn btn-outline px-2.5 sm:px-3.5" onClick={() => persist(false)} disabled={saving} title="সংরক্ষণ (Ctrl+S)" data-testid="save">
            💾<span className="hidden sm:inline">সেভ</span>
          </button>
          <button
            className="btn btn-accent px-3 sm:px-4"
            onClick={() => {
              setSelectedId(null)
              setCropId(null)
              setExportOpen(true)
            }}
            data-testid="download"
          >
            ⬇️ <span>ডাউনলোড</span>
          </button>
        </div>
      </header>

      <CategoryBar value={design.category} onChange={selectCategory} />

      {/* ------------------------------ body ------------------------------ */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {isDesktop && (
          <aside className="flex w-[370px] xl:w-[400px] shrink-0 flex-col bg-white border-r border-ui-line min-h-0">
            {tabs}
            <div className="flex-1 overflow-y-auto thin-scroll">{panel}</div>
          </aside>
        )}

        <main className="flex-1 min-h-0 min-w-0 flex flex-col">
          {(isDesktop || selectedItem) && (
            <SelectionToolbar item={selectedItem} design={design} template={template} pal={pal} update={update} cropId={cropId} actions={actions} />
          )}
          <div className="flex-1 min-h-0 relative">
            {!isDesktop && !selectedItem && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none bg-white/90 border border-ui-line text-ink-soft text-[11.5px] font-semibold px-3 py-1 rounded-full shadow-card whitespace-nowrap">
                👆 যেকোনো অংশে ট্যাপ করে এডিট করুন
              </div>
            )}
            <EditorStage
              design={design}
              template={template}
              defaultLogo={defaultLogo}
              posterRef={posterRef}
              selectedId={selectedId}
              onSelect={setSelectedId}
              cropId={cropId}
              setCropId={setCropId}
              update={update}
              onEditText={editText}
              onRequestPhoto={requestPhotoFor}
              onDropFile={onDropFile}
            />
          </div>
        </main>

        {!isDesktop && (
          <section className={`shrink-0 flex flex-col bg-white border-t border-ui-line min-h-0 ${mobilePanelOpen ? 'h-[42%]' : 'h-auto'}`} data-testid="mobile-panel">
            {tabs}
            {mobilePanelOpen && <div className="flex-1 overflow-y-auto thin-scroll">{panel}</div>}
          </section>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="file-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} posterRef={posterRef} fileBase={fileBase} onDone={notify} />
      <DialogHost />
      <Toast toast={toast} onDone={clearToast} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function useMediaQuery(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatch(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return match
}

function unhide(overrides, slotId) {
  if (!overrides?.[slotId]?.hidden) return overrides
  const next = { ...overrides, [slotId]: { ...overrides[slotId] } }
  delete next[slotId].hidden
  return next
}

function findItemLoose(design, template, id, slot) {
  return getItems(design, template).find((i) => i.id === id) || { id, kind: 'slot', type: 'photo', box: slot, data: slot }
}

function updateBox(design, item, dx, dy) {
  const b = item.box
  const patch = { x: b.x + dx, y: b.y + dy }
  if (item.kind === 'slot') return { ...design, slotOverrides: { ...design.slotOverrides, [item.data.id]: { ...(design.slotOverrides?.[item.data.id] || {}), ...patch } } }
  return { ...design, elements: design.elements.map((e) => (e.id === item.data.id ? { ...e, ...patch } : e)) }
}
