/* =========================================================================
   BENGALI ORGANIZATIONAL NOTICE GENERATOR
   Vanilla JS + IndexedDB + html2canvas/jsPDF
   =========================================================================

   ------------------------------------------------------------------
   HOW TO CHANGE THE FIXED ORGANIZATION NAME / LOCATION LATER:
   Just edit the values inside CONFIG below. That's it — nothing else in
   the codebase needs to change.

   The logo (header) and watermark images are bundled app assets, not
   something the user uploads from the form — see DEFAULT_LOGO_PATH /
   DEFAULT_WATERMARK_PATH below. To change them later, replace the files
   at assets/logo-header.png and assets/logo-watermark.png with new
   images of the same filenames (any reasonable image size works; a
   roughly-square image looks best in both spots).
   ------------------------------------------------------------------
*/

const CONFIG = {
  ORG_NAME: "লৎসর দক্ষিণ পাড়া যুব সমাজ মানব কল্যাণ সংস্থা",
  ORG_LOCATION: "লৎসর, মনোহরগঞ্জ, কুমিল্লা",
  ORG_SHORT_SLUG: "Latsor_Sangstha",   // used in PDF filenames (ASCII safe)
  SHOW_BISMILLAH_LINE: true,
  BISMILLAH_TEXT: "বিসমিল্লাহির রাহমানির রাহিম",
  DEFAULT_LOGO_PATH: "assets/logo-header.jpg",
  DEFAULT_WATERMARK_PATH: "assets/logo-watermark.png",
};

/* =========================================================================
   INDEXEDDB LAYER
   ========================================================================= */
const DB_NAME = "BengaliNoticeDB";
const DB_VERSION = 1;
const STORE_NOTICES = "notices";
const STORE_SETTINGS = "settings"; // reserved for future app-level settings

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NOTICES)) {
        const store = db.createObjectStore(STORE_NOTICES, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function dbPut(storeName, value) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = (e) => reject(e.target.error);
  }));
}

function dbGet(storeName, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  }));
}

function dbGetAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  }));
}

function dbDelete(storeName, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  }));
}

function dbClearStore(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  }));
}

/* =========================================================================
   UTILITIES
   ========================================================================= */
const BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
function toBengaliDigits(str) {
  return String(str).replace(/[0-9]/g, d => BN_DIGITS[d]);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ISO (YYYY-MM-DD) -> "১২/০৯/২০২৬" style Bengali display
function formatDateBengali(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return toBengaliDigits(`${d}/${m}/${y}`);
}

// ISO -> ASCII DD-MM-YYYY (used in filenames)
function formatDateAscii(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function uid() {
  return "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function sanitizeContentHtml(html) {
  // Basic sanitize: strip script/style/iframe/on* attributes.
  // Inline color/formatting spans from execCommand are kept intentionally.
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  tmp.querySelectorAll("script,style,iframe,object,embed").forEach(el => el.remove());
  tmp.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(attr => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
  return tmp.innerHTML;
}

function sanitizeFilenamePart(str) {
  return String(str)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .trim();
}

// Map common notice types -> ASCII slug for filenames
const TYPE_SLUG_MAP = {
  "জরুরী নোটিশ": "Jaruri_Notice",
  "গুরুত্বপূর্ণ নোটিশ": "Gurutopurno_Notice",
  "সাধারণ নোটিশ": "Sadharon_Notice",
  "বিশেষ নোটিশ": "Bishesh_Notice",
  "বিজ্ঞপ্তি": "Biggopti",
  "জরুরী বিজ্ঞপ্তি": "Jaruri_Biggopti",
  "সভার নোটিশ": "Shovar_Notice",
  "সাধারণ সভার নোটিশ": "Sadharon_Shova_Notice",
  "সদস্যদের জন্য নোটিশ": "Sodossoder_Notice",
  "দাওয়াতপত্র": "Daoyatpotro",
  "ঘোষণা": "Ghoshona",
  "নির্দেশনা": "Nirdeshona",
  "স্মরণীয় বিজ্ঞপ্তি": "Sroronio_Biggopti",
  "শোক বার্তা": "Shok_Barta",
};

// Content-area font choices -> real CSS font stacks (kept explicit rather
// than routed through CSS variables, so PDF/print rendering is unambiguous)
const FONT_STACKS = {
  sans:   '"Noto Sans Bengali","Segoe UI",system-ui,sans-serif',
  serif:  '"Noto Serif Bengali","Noto Sans Bengali",serif',
  hind:   '"Hind Siliguri","Noto Sans Bengali",sans-serif',
  baloo:  '"Baloo Da 2","Noto Sans Bengali",cursive',
  tiro:   '"Tiro Bangla","Noto Serif Bengali",serif',
  mina:   '"Mina","Noto Sans Bengali",sans-serif',
  galada: '"Galada","Noto Sans Bengali",cursive',
  atma:   '"Atma","Noto Sans Bengali",cursive',
};
const DEFAULT_CONTENT_FONT = "sans";

function toast(msg, ms = 2200) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), ms);
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    document.getElementById("confirmMessage").textContent = message;
    modal.classList.remove("hidden");
    const yesBtn = document.getElementById("btnConfirmYes");
    const cancelBtn = document.getElementById("btnConfirmCancel");
    function cleanup(result) {
      modal.classList.add("hidden");
      yesBtn.removeEventListener("click", onYes);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }
    function onYes() { cleanup(true); }
    function onCancel() { cleanup(false); }
    yesBtn.addEventListener("click", onYes);
    cancelBtn.addEventListener("click", onCancel);
  });
}

/* =========================================================================
   APPLICATION STATE
   ========================================================================= */
const state = {
  editingId: null,     // null = creating new notice
  sigMode: "detailed",  // 'none' | 'orgOnly' | 'detailed'
  savedContentRange: null, // last text selection inside the content editor, used by the color picker
};

/* =========================================================================
   DOM REFERENCES
   ========================================================================= */
const el = (id) => document.getElementById(id);

const els = {
  noticeType: el("noticeType"),
  customTitleField: el("customTitleField"),
  customTitle: el("customTitle"),
  noticeDate: el("noticeDate"),
  noticeSource: el("noticeSource"),
  noticeContent: el("noticeContent"),
  contentFontSelect: el("contentFontSelect"),
  contentColorInput: el("contentColorInput"),

  sigModeSegmented: el("sigModeSegmented"),
  sigDetailedFields: el("sigDetailedFields"),
  sigOrgOnlyHint: el("sigOrgOnlyHint"),
  sigType: el("sigType"),
  sigCustomField: el("sigCustomField"),
  sigCustomLabel: el("sigCustomLabel"),
  sigName: el("sigName"),
  sigDesignation: el("sigDesignation"),

  footerEnabled: el("footerEnabled"),
  footerFieldsWrap: el("footerFieldsWrap"),
  footerContact: el("footerContact"),
  footerPhone: el("footerPhone"),
  footerAddress: el("footerAddress"),

  watermarkEnabled: el("watermarkEnabled"),

  // preview
  previewOrgName: el("previewOrgName"),
  previewOrgLocation: el("previewOrgLocation"),
  previewSourceWrap: el("previewSourceWrap"),
  previewSource: el("previewSource"),
  previewDate: el("previewDate"),
  previewTitle: el("previewTitle"),
  previewContent: el("previewContent"),
  previewWatermark: el("previewWatermark"),
  previewSigArea: el("previewSigArea"),
  previewSigLabel: el("previewSigLabel"),
  previewSigName: el("previewSigName"),
  previewSigDesignation: el("previewSigDesignation"),
  previewLogoImg: el("previewLogoImg"),
  previewFooterBand: el("previewFooterBand"),
  previewFooterText: el("previewFooterText"),
  bismillahLine: el("bismillahLine"),

  editingBadge: el("editingBadge"),
};

/* =========================================================================
   INIT — first paint of static org info + bismillah line config + default
   logo/watermark image sources
   ========================================================================= */
function applyStaticConfig() {
  els.previewOrgName.textContent = CONFIG.ORG_NAME;
  els.previewOrgLocation.textContent = CONFIG.ORG_LOCATION;
  el("settingsOrgName").textContent = CONFIG.ORG_NAME;
  el("settingsOrgLocation").textContent = CONFIG.ORG_LOCATION;
  document.title = `নোটিশ জেনারেটর — ${CONFIG.ORG_NAME}`;

  els.previewLogoImg.src = CONFIG.DEFAULT_LOGO_PATH;

  if (!CONFIG.SHOW_BISMILLAH_LINE) {
    els.bismillahLine.classList.add("hidden");
  } else {
    els.bismillahLine.textContent = CONFIG.BISMILLAH_TEXT;
  }
}

/* =========================================================================
   FORM <-> PREVIEW SYNC
   ========================================================================= */
function getCurrentTitle() {
  if (els.noticeType.value === "__custom__") {
    return els.customTitle.value.trim() || "শিরোনাম লিখুন";
  }
  return els.noticeType.value;
}

function getCurrentSigLabel() {
  if (els.sigType.value === "__custom__") {
    return els.sigCustomLabel.value.trim() || "";
  }
  return els.sigType.value;
}

function renderPreview() {
  // Title
  els.previewTitle.textContent = getCurrentTitle();

  // Source (hide row cleanly if empty)
  const sourceVal = els.noticeSource.value.trim();
  els.previewSourceWrap.style.visibility = sourceVal ? "visible" : "hidden";
  els.previewSource.textContent = sourceVal;

  // Date
  els.previewDate.textContent = formatDateBengali(els.noticeDate.value || todayISO());

  // Content (font family applied as an inline style on the whole block;
  // per-word color comes from execCommand spans already inside the HTML)
  const html = els.noticeContent.innerHTML.trim();
  els.previewContent.style.fontFamily = FONT_STACKS[els.contentFontSelect.value] || FONT_STACKS[DEFAULT_CONTENT_FONT];
  els.previewContent.innerHTML = html || "<p style='color:#bbb'>নোটিশের বিষয়বস্তু এখানে প্রদর্শিত হবে...</p>";

  // Signature — 3 modes: none / orgOnly / detailed
  renderSignaturePreview();

  // Footer
  const footerBits = [];
  if (els.footerEnabled.checked) {
    if (els.footerContact.value.trim()) footerBits.push(`যোগাযোগ: ${els.footerContact.value.trim()}`);
    if (els.footerPhone.value.trim()) footerBits.push(`ফোন: ${els.footerPhone.value.trim()}`);
    if (els.footerAddress.value.trim()) footerBits.push(`ঠিকানা: ${els.footerAddress.value.trim()}`);
  }
  els.previewFooterText.textContent = footerBits.length ? footerBits.join("   |   ") : "";

  // Watermark (always the bundled watermark asset when enabled)
  if (els.watermarkEnabled.checked) {
    els.previewWatermark.src = CONFIG.DEFAULT_WATERMARK_PATH;
    els.previewWatermark.classList.remove("hidden");
  } else {
    els.previewWatermark.classList.add("hidden");
  }
}

function renderSignaturePreview() {
  if (state.sigMode === "none") {
    els.previewSigArea.classList.add("hidden");
    els.previewSigArea.classList.remove("sig-org-only");
    return;
  }
  els.previewSigArea.classList.remove("hidden");
  els.previewSigArea.classList.toggle("sig-org-only", state.sigMode === "orgOnly");

  if (state.sigMode === "orgOnly") {
    els.previewSigLabel.classList.add("hidden");
    els.previewSigDesignation.classList.add("hidden");
    els.previewSigName.classList.remove("hidden");
    els.previewSigName.textContent = CONFIG.ORG_NAME;
  } else {
    // detailed
    els.previewSigLabel.classList.remove("hidden");
    els.previewSigDesignation.classList.remove("hidden");
    els.previewSigName.classList.remove("hidden");
    els.previewSigLabel.textContent = getCurrentSigLabel() + ":-";
    els.previewSigName.textContent = els.sigName.value.trim();
    els.previewSigDesignation.textContent = els.sigDesignation.value.trim()
      ? `${els.sigDesignation.value.trim()}, ${CONFIG.ORG_NAME}`
      : "";
  }
}

function bindLiveInputs() {
  const inputs = [
    els.noticeType, els.customTitle, els.noticeDate, els.noticeSource,
    els.contentFontSelect,
    els.sigType, els.sigCustomLabel, els.sigName, els.sigDesignation,
    els.footerEnabled, els.footerContact, els.footerPhone, els.footerAddress,
    els.watermarkEnabled
  ];
  inputs.forEach(inp => {
    inp.addEventListener("input", renderPreview);
    inp.addEventListener("change", renderPreview);
  });
  els.noticeContent.addEventListener("input", renderPreview);

  els.noticeType.addEventListener("change", () => {
    els.customTitleField.classList.toggle("hidden", els.noticeType.value !== "__custom__");
    renderPreview();
  });

  els.sigType.addEventListener("change", () => {
    els.sigCustomField.classList.toggle("hidden", els.sigType.value !== "__custom__");
    renderPreview();
  });

  els.footerEnabled.addEventListener("change", () => {
    els.footerFieldsWrap.classList.toggle("hidden", !els.footerEnabled.checked);
    renderPreview();
  });
}

/* =========================================================================
   SIGNATURE MODE — segmented 3-way control (নেই / শুধু সংস্থার নাম / বিস্তারিত)
   ========================================================================= */
function setSigMode(mode) {
  state.sigMode = mode;
  els.sigModeSegmented.querySelectorAll(".seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.val === mode);
  });
  els.sigDetailedFields.classList.toggle("hidden", mode !== "detailed");
  els.sigOrgOnlyHint.classList.toggle("hidden", mode !== "orgOnly");
  renderPreview();
}

function bindSigModeSegmented() {
  els.sigModeSegmented.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => setSigMode(btn.dataset.val));
  });
}

/* =========================================================================
   CONTENT EDITOR TOOLBAR (execCommand based — simple + effective)
   ========================================================================= */
function bindContentToolbar() {
  document.querySelectorAll("#contentToolbar .fmt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      els.noticeContent.focus();
      document.execCommand(btn.dataset.cmd, false, null);
      renderPreview();
    });
  });
  el("fontSizeSelect").addEventListener("change", (e) => {
    els.noticeContent.focus();
    document.execCommand("fontSize", false, e.target.value);
    renderPreview();
  });

  // Track the current text selection inside the content editor so the
  // color picker (a native <input type=color>, which steals focus when
  // opened) can restore it before applying foreColor.
  function saveContentSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && els.noticeContent.contains(sel.anchorNode)) {
      state.savedContentRange = sel.getRangeAt(0).cloneRange();
    }
  }
  els.noticeContent.addEventListener("mouseup", saveContentSelection);
  els.noticeContent.addEventListener("keyup", saveContentSelection);
  els.noticeContent.addEventListener("blur", saveContentSelection);

  els.contentColorInput.addEventListener("input", (e) => {
    if (state.savedContentRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(state.savedContentRange);
    }
    els.noticeContent.focus();
    document.execCommand("foreColor", false, e.target.value);
    renderPreview();
  });
}

/* =========================================================================
   FORM <-> DATA OBJECT
   ========================================================================= */
function collectFormData() {
  return {
    noticeType: els.noticeType.value,
    customTitle: els.customTitle.value.trim(),
    resolvedTitle: getCurrentTitle(),
    date: els.noticeDate.value || todayISO(),
    source: els.noticeSource.value.trim(),
    contentHtml: sanitizeContentHtml(els.noticeContent.innerHTML),
    contentFont: els.contentFontSelect.value || DEFAULT_CONTENT_FONT,

    sigMode: state.sigMode,
    sigType: els.sigType.value,
    sigCustomLabel: els.sigCustomLabel.value.trim(),
    sigName: els.sigName.value.trim(),
    sigDesignation: els.sigDesignation.value.trim(),

    footerEnabled: els.footerEnabled.checked,
    footerContact: els.footerContact.value.trim(),
    footerPhone: els.footerPhone.value.trim(),
    footerAddress: els.footerAddress.value.trim(),
    watermarkEnabled: els.watermarkEnabled.checked,
  };
}

// Resolve the effective signature mode for a record, including a
// backward-compatible fallback for notices saved before the 3-mode
// segmented control existed (they only had a boolean `sigEnabled`).
function resolveSigMode(data) {
  if (data.sigMode === "none" || data.sigMode === "orgOnly" || data.sigMode === "detailed") {
    return data.sigMode;
  }
  if (data.sigEnabled === false) return "none";
  return "detailed";
}

function fillFormFromData(data) {
  els.noticeType.value = data.noticeType || "জরুরী নোটিশ";
  els.customTitleField.classList.toggle("hidden", els.noticeType.value !== "__custom__");
  els.customTitle.value = data.customTitle || "";
  els.noticeDate.value = data.date || todayISO();
  els.noticeSource.value = data.source || "";
  els.noticeContent.innerHTML = data.contentHtml || "";
  els.contentFontSelect.value = data.contentFont || DEFAULT_CONTENT_FONT;

  setSigMode(resolveSigMode(data));
  els.sigType.value = data.sigType || "আদেশক্রমে";
  els.sigCustomField.classList.toggle("hidden", els.sigType.value !== "__custom__");
  els.sigCustomLabel.value = data.sigCustomLabel || "";
  els.sigName.value = data.sigName || "";
  els.sigDesignation.value = data.sigDesignation || "";

  els.footerEnabled.checked = !!data.footerEnabled;
  els.footerFieldsWrap.classList.toggle("hidden", !els.footerEnabled.checked);
  els.footerContact.value = data.footerContact || "";
  els.footerPhone.value = data.footerPhone || "";
  els.footerAddress.value = data.footerAddress || "";

  els.watermarkEnabled.checked = data.watermarkEnabled !== false;

  renderPreview();
}

function resetForm() {
  state.editingId = null;
  els.editingBadge.classList.add("hidden");
  fillFormFromData({
    noticeType: "জরুরী নোটিশ",
    date: todayISO(),
    contentFont: DEFAULT_CONTENT_FONT,
    sigMode: "detailed",
    sigType: "আদেশক্রমে",
    watermarkEnabled: true,
  });
  els.noticeContent.innerHTML = "";
  updateSaveButtonLabel();
  renderPreview();
}

function updateSaveButtonLabel() {
  el("btnSave").innerHTML = state.editingId ? "💾 আপডেট করুন" : "💾 সেভ করুন";
}

/* =========================================================================
   SAVE / UPDATE
   ========================================================================= */
async function saveNotice() {
  const data = collectFormData();
  const now = Date.now();

  if (!data.contentHtml || data.contentHtml.replace(/<[^>]+>/g, "").trim() === "") {
    toast("দয়া করে নোটিশের বিষয়বস্তু লিখুন");
    return;
  }

  let record;
  if (state.editingId) {
    const existing = await dbGet(STORE_NOTICES, state.editingId);
    record = Object.assign({}, existing, data, { updatedAt: now });
  } else {
    record = Object.assign({}, data, {
      id: uid(),
      createdAt: now,
      updatedAt: now,
    });
    state.editingId = record.id;
  }

  await dbPut(STORE_NOTICES, record);
  updateSaveButtonLabel();
  els.editingBadge.classList.remove("hidden");
  toast(state.editingId ? "নোটিশ সংরক্ষণ করা হয়েছে" : "নোটিশ সেভ হয়েছে");
  await refreshHistoryList();
}

/* =========================================================================
   HISTORY (opened via the top app-bar icon, shown in a modal)
   ========================================================================= */
function plainTextSnippet(html, len = 90) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  const text = tmp.textContent || "";
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function formatSavedTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}

async function refreshHistoryList(filterText = "") {
  const all = await dbGetAll(STORE_NOTICES);
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  const filtered = filterText
    ? all.filter(n =>
        (n.resolvedTitle || "").includes(filterText) ||
        plainTextSnippet(n.contentHtml, 300).includes(filterText))
    : all;

  const listEl = el("historyList");
  const emptyEl = el("historyEmpty");
  listEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  filtered.forEach(n => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-item-top">
        <div class="history-item-title">${escapeHtml(n.resolvedTitle || n.noticeType)}</div>
        <div class="history-item-date">${formatDateBengali(n.date)}</div>
      </div>
      <div class="history-item-snippet">${escapeHtml(plainTextSnippet(n.contentHtml))}</div>
      <div class="history-item-saved">সংরক্ষণঃ ${formatSavedTime(n.updatedAt)}</div>
      <div class="history-item-actions">
        <button class="btn btn-outline" data-act="edit" data-id="${n.id}">✏️ এডিট</button>
        <button class="btn btn-outline" data-act="dup" data-id="${n.id}">📄 ডুপ্লিকেট</button>
        <button class="btn btn-accent" data-act="pdf" data-id="${n.id}">⬇️ PDF</button>
        <button class="btn btn-danger" data-act="del" data-id="${n.id}">🗑️ মুছুন</button>
      </div>
    `;
    listEl.appendChild(item);
  });
}

async function loadNoticeIntoEditor(id) {
  const rec = await dbGet(STORE_NOTICES, id);
  if (!rec) { toast("নোটিশ খুঁজে পাওয়া যায়নি"); return; }
  state.editingId = id;
  fillFormFromData(rec);
  updateSaveButtonLabel();
  els.editingBadge.classList.remove("hidden");
  closeHistoryModal();
  switchTab("editor");
  toast("নোটিশ লোড করা হয়েছে — এডিট করুন");
}

async function duplicateNotice(id) {
  const rec = await dbGet(STORE_NOTICES, id);
  if (!rec) return;
  state.editingId = null;
  fillFormFromData(rec);
  els.editingBadge.classList.add("hidden");
  updateSaveButtonLabel();
  closeHistoryModal();
  switchTab("editor");
  toast("কপি তৈরি হয়েছে — এখন এটি নতুন নোটিশ হিসেবে সেভ করুন");
}

async function deleteNotice(id) {
  const ok = await confirmDialog("আপনি কি এই নোটিশটি মুছে ফেলতে চান?");
  if (!ok) return;
  await dbDelete(STORE_NOTICES, id);
  if (state.editingId === id) resetForm();
  await refreshHistoryList(el("historySearch").value.trim());
  toast("নোটিশ মুছে ফেলা হয়েছে");
}

function bindHistoryEvents() {
  el("historyList").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === "edit") await loadNoticeIntoEditor(id);
    else if (act === "dup") await duplicateNotice(id);
    else if (act === "del") await deleteNotice(id);
    else if (act === "pdf") {
      const rec = await dbGet(STORE_NOTICES, id);
      if (rec) await exportRecordAsPdf(rec);
    }
  });

  el("historySearch").addEventListener("input", (e) => {
    refreshHistoryList(e.target.value.trim());
  });
}

function openHistoryModal() {
  el("historyModal").classList.remove("hidden");
  el("historySearch").value = "";
  refreshHistoryList();
}
function closeHistoryModal() {
  el("historyModal").classList.add("hidden");
}
function bindHistoryModal() {
  el("btnHistory").addEventListener("click", openHistoryModal);
  el("btnCloseHistory").addEventListener("click", closeHistoryModal);
  el("historyModal").addEventListener("click", (e) => {
    if (e.target === el("historyModal")) closeHistoryModal();
  });
}

/* =========================================================================
   TAB SWITCHING (mobile: এডিটর / প্রিভিউ)
   ========================================================================= */
function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  el(`panel-${tabName}`).classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function bindTabbar() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

/* =========================================================================
   BUILD A STANDALONE NOTICE HTML NODE (used for PDF export + print)
   Renders directly from a stored record, independent of live form,
   so History → PDF/Print works without loading the editor.
   ========================================================================= */
function buildNoticeNode(record) {
  const wrap = document.createElement("div");
  wrap.className = "notice-a4";
  wrap.style.transform = "none";
  wrap.style.margin = "0";

  const title = record.noticeType === "__custom__" ? (record.customTitle || "নোটিশ") : record.resolvedTitle;
  const sigLabel = record.sigType === "__custom__" ? record.sigCustomLabel : record.sigType;
  const sigMode = resolveSigMode(record);
  const contentFontStack = FONT_STACKS[record.contentFont] || FONT_STACKS[DEFAULT_CONTENT_FONT];

  const footerBits = [];
  if (record.footerEnabled) {
    if (record.footerContact) footerBits.push(`যোগাযোগ: ${record.footerContact}`);
    if (record.footerPhone) footerBits.push(`ফোন: ${record.footerPhone}`);
    if (record.footerAddress) footerBits.push(`ঠিকানা: ${record.footerAddress}`);
  }

  const watermarkHtml = record.watermarkEnabled
    ? `<img class="notice-watermark" src="${CONFIG.DEFAULT_WATERMARK_PATH}" alt="">`
    : "";

  let sigHtml = "";
  if (sigMode === "orgOnly") {
    sigHtml = `
      <div class="notice-sig-area sig-org-only">
        <div class="notice-sig-name">${escapeHtml(CONFIG.ORG_NAME)}</div>
      </div>`;
  } else if (sigMode === "detailed") {
    sigHtml = `
      <div class="notice-sig-area">
        <div class="notice-sig-label">${escapeHtml(sigLabel || "")}:-</div>
        <div class="notice-sig-name">${escapeHtml(record.sigName || "")}</div>
        <div class="notice-sig-designation">${record.sigDesignation ? escapeHtml(record.sigDesignation) + ", " + escapeHtml(CONFIG.ORG_NAME) : ""}</div>
      </div>`;
  }

  wrap.innerHTML = `
    ${CONFIG.SHOW_BISMILLAH_LINE ? `<div class="notice-bismillah">${escapeHtml(CONFIG.BISMILLAH_TEXT)}</div>` : ""}
    <div class="notice-header">
      <div class="notice-logo-box"><img src="${CONFIG.DEFAULT_LOGO_PATH}" alt="লোগো"></div>
      <div class="notice-org-box">
        <div class="notice-org-name">${escapeHtml(CONFIG.ORG_NAME)}</div>
      </div>
    </div>
    <div class="notice-location-band"><span>${escapeHtml(CONFIG.ORG_LOCATION)}</span></div>
    <div class="notice-body">
      <div class="notice-meta-row">
        <div class="notice-source" style="visibility:${record.source ? "visible" : "hidden"}">
          <span class="meta-label">সূত্র:</span> <span>${escapeHtml(record.source || "")}</span>
        </div>
        <div class="notice-date"><span class="meta-label">তারিখ:</span> <span>${formatDateBengali(record.date)}</span></div>
      </div>
      <div class="notice-title-wrap">
        <h1 class="notice-title">${escapeHtml(title)}</h1>
        <div class="notice-title-underline"></div>
      </div>
      <div class="notice-content-area">
        ${watermarkHtml}
        <div class="notice-content" style="font-family:${contentFontStack}">${record.contentHtml || ""}</div>
      </div>
      ${sigHtml}
    </div>
    <div class="notice-footer"><div class="notice-footer-text">${escapeHtml(footerBits.join("   |   "))}</div></div>
  `;
  return wrap;
}

/* =========================================================================
   PDF EXPORT (html2canvas -> jsPDF)
   ========================================================================= */
async function waitForFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 21pt "Baloo Da 2"'),
      document.fonts.load('800 21pt "Noto Serif Bengali"'),
      document.fonts.load('700 14pt "Noto Sans Bengali"'),
      document.fonts.load('400 14pt "Noto Sans Bengali"'),
      document.fonts.load('400 14pt "Hind Siliguri"'),
      document.fonts.load('700 14pt "Hind Siliguri"'),
      document.fonts.load('400 14pt "Baloo Da 2"'),
      document.fonts.load('400 14pt "Tiro Bangla"'),
      document.fonts.load('400 14pt "Mina"'),
      document.fonts.load('700 14pt "Mina"'),
      document.fonts.load('400 14pt "Galada"'),
      document.fonts.load('400 14pt "Atma"'),
      document.fonts.load('700 14pt "Atma"'),
    ]);
    await document.fonts.ready;
  } catch (e) { /* font API not supported — proceed anyway */ }
}

function buildPdfFilename(record) {
  const typeSlug = TYPE_SLUG_MAP[record.noticeType] ||
    sanitizeFilenamePart(record.resolvedTitle || record.customTitle || "Notice");
  const dateSlug = formatDateAscii(record.date);
  return `${CONFIG.ORG_SHORT_SLUG}_${typeSlug}_${dateSlug}.pdf`;
}

async function exportRecordAsPdf(record) {
  toast("PDF তৈরি হচ্ছে...", 4000);
  await waitForFonts();

  const root = el("pdfRenderRoot");
  root.innerHTML = "";
  const node = buildNoticeNode(record);
  root.appendChild(node);

  // allow one frame for layout/fonts/images to settle
  await new Promise(r => setTimeout(r, 60));
  await waitForImagesLoaded(node);

  try {
    const canvas = await html2canvas(node, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageWidth = 210;
    const pageHeight = 297;
    const rawImgHeight = (canvas.height * pageWidth) / canvas.width;

    // Tolerance guards against a spurious near-empty 2nd page: html2canvas
    // can render a handful of extra sub-pixels beyond exactly 297mm (from
    // box-sizing/min-height rounding), which previously tipped the naive
    // "imgHeight > pageHeight" check into pagination mode and produced a
    // blank trailing page for perfectly ordinary, single-page notices.
    const PAGE_OVERFLOW_TOLERANCE_MM = 5;

    if (rawImgHeight <= pageHeight + PAGE_OVERFLOW_TOLERANCE_MM) {
      const drawHeight = Math.min(rawImgHeight, pageHeight);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, drawHeight);
    } else {
      // genuine multi-page pagination for unusually long content
      let heightLeft = rawImgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pageWidth, rawImgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - rawImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pageWidth, rawImgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(buildPdfFilename(record));
    toast("PDF ডাউনলোড সম্পন্ন হয়েছে ✅");
  } catch (err) {
    console.error(err);
    toast("PDF তৈরি করতে সমস্যা হয়েছে");
  } finally {
    root.innerHTML = "";
  }
}

function waitForImagesLoaded(container) {
  const imgs = [...container.querySelectorAll("img")];
  return Promise.all(imgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => { img.onload = res; img.onerror = res; });
  }));
}

async function downloadCurrentFormAsPdf() {
  if (els.noticeContent.textContent.trim() === "") {
    toast("দয়া করে নোটিশের বিষয়বস্তু লিখুন");
    return;
  }
  const record = collectFormData();
  await exportRecordAsPdf(record);
}

/* =========================================================================
   PRINT
   ========================================================================= */
function printCurrentForm() {
  if (els.noticeContent.textContent.trim() === "") {
    toast("দয়া করে নোটিশের বিষয়বস্তু লিখুন");
    return;
  }
  const record = collectFormData();
  const node = buildNoticeNode(record);
  node.id = "printArea";

  const old = document.getElementById("printArea");
  if (old) old.remove();

  document.body.appendChild(node);
  setTimeout(() => {
    window.print();
    setTimeout(() => node.remove(), 500);
  }, 120);
}

/* =========================================================================
   EXPORT / IMPORT / CLEAR DATA
   (logo/watermark are bundled app assets now, not user data — only
   notices themselves are exported/imported/cleared)
   ========================================================================= */
async function exportAllData() {
  const notices = await dbGetAll(STORE_NOTICES);
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "bengali-notice-generator",
    org: { name: CONFIG.ORG_NAME, location: CONFIG.ORG_LOCATION },
    notices,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const dateSlug = formatDateAscii(todayISO());
  a.download = `${CONFIG.ORG_SHORT_SLUG}_Notice_Backup_${dateSlug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("ডাটা এক্সপোর্ট সম্পন্ন হয়েছে");
}

async function importDataFromFile(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload || !Array.isArray(payload.notices)) throw new Error("Invalid file");

    const ok = await confirmDialog(`${payload.notices.length}টি নোটিশ ইমপোর্ট করা হবে। বর্তমান ডাটার সাথে যোগ হবে। এগিয়ে যাবেন?`);
    if (!ok) return;

    for (const n of payload.notices) {
      if (!n.id) n.id = uid();
      await dbPut(STORE_NOTICES, n);
    }
    await refreshHistoryList();
    toast("ডাটা ইমপোর্ট সম্পন্ন হয়েছে");
  } catch (e) {
    console.error(e);
    toast("ইমপোর্ট ব্যর্থ হয়েছে — ফাইলটি সঠিক কিনা যাচাই করুন");
  }
}

async function clearAllData() {
  const ok = await confirmDialog("আপনি কি নিশ্চিত সব নোটিশ স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।");
  if (!ok) return;
  await dbClearStore(STORE_NOTICES);
  resetForm();
  await refreshHistoryList();
  toast("সব ডাটা মুছে ফেলা হয়েছে");
}

/* =========================================================================
   SETTINGS MODAL
   ========================================================================= */
function bindSettingsModal() {
  el("btnSettings").addEventListener("click", () => el("settingsModal").classList.remove("hidden"));
  el("btnCloseSettings").addEventListener("click", () => el("settingsModal").classList.add("hidden"));
  el("settingsModal").addEventListener("click", (e) => {
    if (e.target === el("settingsModal")) el("settingsModal").classList.add("hidden");
  });
  el("btnExportData").addEventListener("click", exportAllData);
  el("importFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importDataFromFile(file);
    e.target.value = "";
  });
  el("btnClearData").addEventListener("click", clearAllData);
}

/* =========================================================================
   TOP LEVEL BUTTON BINDINGS
   ========================================================================= */
function bindMainButtons() {
  el("btnNew").addEventListener("click", async () => {
    if (els.noticeContent.textContent.trim() !== "") {
      const ok = await confirmDialog("নতুন নোটিশ তৈরি করলে বর্তমান এডিটরের অসংরক্ষিত পরিবর্তন হারিয়ে যাবে। এগিয়ে যাবেন?");
      if (!ok) return;
    }
    resetForm();
    switchTab("editor");
    toast("নতুন নোটিশ তৈরি করুন");
  });

  el("btnSave").addEventListener("click", saveNotice);
  el("btnPdf").addEventListener("click", downloadCurrentFormAsPdf);
  el("btnPrint").addEventListener("click", printCurrentForm);
}

/* =========================================================================
   SERVICE WORKER
   ========================================================================= */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(err => {
        console.warn("Service worker registration failed:", err);
      });
    });
  }
}

/* =========================================================================
   INIT
   ========================================================================= */
async function init() {
  applyStaticConfig();
  els.noticeDate.value = todayISO();

  bindLiveInputs();
  bindContentToolbar();
  bindSigModeSegmented();
  bindHistoryEvents
  bindHistoryModal();
  bindTabbar();
  bindSettingsModal();
  bindMainButtons();

  resetForm();
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", init);
