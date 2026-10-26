// Lightweight IndexedDB wrapper for saved poster projects, user-added custom
// templates and the autosaved working draft. IndexedDB (not localStorage)
// because all three embed full-resolution image data URLs.

const DB_NAME = 'poster-studio'
const DB_VERSION = 3
const PROJECTS_STORE = 'projects'
const TEMPLATES_STORE = 'customTemplates'
const META_STORE = 'meta'

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('এই ব্রাউজারে IndexedDB সমর্থিত নয়'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const store = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
        const store = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(storeName, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    let result
    Promise.resolve(fn(store)).then((r) => (result = r))
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function req2promise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const ok = async (fn, fallbackError) => {
  try {
    await fn()
    return { ok: true }
  } catch (err) {
    console.error(err)
    return { ok: false, error: err?.name === 'QuotaExceededError' ? 'ডিভাইসে জায়গা নেই — পুরনো প্রজেক্ট মুছে আবার চেষ্টা করুন' : fallbackError }
  }
}

// ---------- Saved poster projects ----------

export const saveProject = (project) => ok(() => withStore(PROJECTS_STORE, 'readwrite', (s) => s.put(project)), 'সংরক্ষণ ব্যর্থ হয়েছে')
export const deleteProject = (id) => ok(() => withStore(PROJECTS_STORE, 'readwrite', (s) => s.delete(id)), 'মুছে ফেলা যায়নি')

export async function getAllProjects() {
  try {
    const projects = await withStore(PROJECTS_STORE, 'readonly', (s) => req2promise(s.getAll()))
    return (projects || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  } catch (err) {
    console.error('getAllProjects failed', err)
    return []
  }
}

export const newProjectId = () => `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ---------- Custom (user-uploaded) templates ----------

export const saveCustomTemplate = (t) => ok(() => withStore(TEMPLATES_STORE, 'readwrite', (s) => s.put(t)), 'টেমপ্লেট সংরক্ষণ ব্যর্থ হয়েছে')
export const deleteCustomTemplate = (id) => ok(() => withStore(TEMPLATES_STORE, 'readwrite', (s) => s.delete(id)), 'টেমপ্লেট মুছে ফেলা যায়নি')

export async function getAllCustomTemplates() {
  try {
    const templates = await withStore(TEMPLATES_STORE, 'readonly', (s) => req2promise(s.getAll()))
    return (templates || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  } catch (err) {
    console.error('getAllCustomTemplates failed', err)
    return []
  }
}

export const newTemplateId = () => `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ---------- Autosaved working draft ----------

export const saveDraft = (draft) => ok(() => withStore(META_STORE, 'readwrite', (s) => s.put({ key: 'draft', ...draft, savedAt: Date.now() })), 'draft')

export async function loadDraft() {
  try {
    return (await withStore(META_STORE, 'readonly', (s) => req2promise(s.get('draft')))) || null
  } catch {
    return null
  }
}
