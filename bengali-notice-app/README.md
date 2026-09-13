# নোটিশ জেনারেটর — Bengali Organizational Notice Generator

A complete, offline-capable PWA for creating official Bengali organizational
notices for **লৎসর দক্ষিণ পাড়া যুব সমাজ মানব কল্যাণ সংস্থা**, previewing them
exactly like a printed notice, saving them locally (IndexedDB), and
downloading/printing them as high-quality A4 PDFs.

No backend, no database server, no login. Everything lives in your browser.

---

## 1. Files in this project

```
bengali-notice/
├── index.html          → App structure (editor, preview, history/settings modals)
├── style.css            → All styling, including the official notice design + print CSS
├── app.js                → All logic: IndexedDB, live preview, PDF export, history, PWA
├── manifest.json         → PWA manifest (name, icons, theme color, standalone mode)
├── service-worker.js     → Offline caching (app shell + CDN libraries)
├── assets/
│   ├── logo-header.png    → Fixed header logo (shown in every notice's header box)
│   └── logo-watermark.png → Fixed watermark image (shown faintly behind the notice content)
├── icons/
│   ├── icon-192.png       → App icon (192×192) — replace with your real logo-based icon later
│   └── icon-512.png       → App icon (512×512)
└── README.md              → This file
```

## 2. How to run it locally

Service workers (required for the PWA/offline feature) only work over
**HTTPS or `localhost`** — they will not work if you just double-click
`index.html` and open it as a `file://` URL. Use a tiny local server instead:

**Option A — Python (already on most machines):**
```bash
cd bengali-notice
python3 -m http.server 8000
```
Then open `http://localhost:8000` in Chrome.

**Option B — VS Code:** Install the "Live Server" extension, right-click
`index.html` → "Open with Live Server".

**Option C — Node:**
```bash
npx serve bengali-notice
```

## 3. How to change the fixed organization name / location later

Open **`app.js`** and edit the `CONFIG` object at the very top of the file:

```js
const CONFIG = {
  ORG_NAME: "লৎসর দক্ষিণ পাড়া যুব সমাজ মানব কল্যাণ সংস্থা",
  ORG_LOCATION: "লৎসর, মনোহরগঞ্জ, কুমিল্লা",
  ORG_SHORT_SLUG: "Latsor_Sangstha",   // used only in PDF filenames (ASCII)
  SHOW_BISMILLAH_LINE: true,
  BISMILLAH_TEXT: "বিসমিল্লাহির রাহমানির রাহিম",
  DEFAULT_LOGO_PATH: "assets/logo-header.png",
  DEFAULT_WATERMARK_PATH: "assets/logo-watermark.png",
};
```

Change the strings, save, refresh the browser — every notice (new and old)
will now show the updated name/location in its header. Nothing else in the
code needs to change, and there is intentionally **no input field** for this
on the main notice page.

The logo (shown in the header of every notice) and the watermark (shown
faintly behind the notice content) are also fixed, bundled images now —
not something uploaded from the form. To change either one later, just
replace the image files at `assets/logo-header.png` and
`assets/logo-watermark.png` with new images using those exact filenames.

## 4. How the history/storage works

- Tap the **🗂️ history icon** in the top app bar (next to ⚙️ settings) to
  open **নোটিশ ইতিহাস** as a popup — it's no longer a separate tab at the
  bottom, so it's reachable from both the editor and preview screens.
- Everything is stored in **IndexedDB** (database name `BengaliNoticeDB`),
  in a `notices` object store — every saved notice (title, date, source,
  content HTML, font choice, signature info, footer info, timestamps).
- Data persists across browser restarts, on the same device + browser
  profile. It is **not** synced anywhere and **never leaves your device**.
- Clearing your browser's site data (or using Incognito) will remove it —
  use **Settings → Export All Data** regularly as a backup, since there is
  no server-side copy.
- **Edit** loads a saved notice back into the editor and switches the Save
  button to "আপডেট করুন" (Update) so re-saving updates the same record
  instead of creating a duplicate.
- **Duplicate** loads a copy into the editor as a brand-new (unsaved)
  notice — the next Save creates a new record.
- **Delete** always asks for confirmation first and permanently removes the
  record from IndexedDB.

## 5. How to install it as a Chrome "app" (Add to Home Screen)

**On Android Chrome:**
1. Open the deployed HTTPS URL (see deployment section below) in Chrome.
2. Tap the **⋮** menu → **"Add to Home screen"** (or Chrome may show an
   automatic "Install app" banner/icon in the address bar).
3. Confirm. The app icon appears on your home screen and opens in its own
   standalone window (no browser address bar), like a real app.

**On desktop Chrome:** click the install icon (⊕/monitor icon) at the right
of the address bar, or ⋮ menu → "Install নোটিশ জেনারেটর…".

> **Important:** this only works when the site is served over **HTTPS**
> (or `localhost` while testing). Plain `http://` (non-secure) hosting will
> not allow installation or offline support, because service workers
> require a secure context.

## 6. Offline support

After the app has been opened once (online), the service worker caches the
HTML/CSS/JS/icons/manifest plus the PDF libraries and fonts as they're used.
On future visits — even with no internet connection — the app will load
normally and all previously-saved notices remain fully available and
editable, because they live in IndexedDB, not on a server. PDF export and
printing also keep working offline once those library files have been
cached at least once.

## 7. How to deploy it as a free static website

Any static host works, since there's no backend. A few options:

**GitHub Pages:**
1. Create a new GitHub repository and push all the files in this folder to it.
2. Go to the repo's **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, pick your
   main branch and the root (`/`) folder, then Save.
4. Your app will be live at `https://<username>.github.io/<repo-name>/`
   after a minute or two (this is HTTPS by default — perfect for the PWA).

**Netlify:**
1. Drag-and-drop the whole project folder onto https://app.netlify.com/drop
   (no account needed for a quick test), or connect your GitHub repo for
   continuous deploys.
2. Netlify gives you a free `https://your-site.netlify.app` URL automatically.

**Vercel:**
1. `npm i -g vercel` then run `vercel` inside the project folder, or import
   the GitHub repo at https://vercel.com/new.
2. Deploys to a free `https://your-site.vercel.app` HTTPS URL.

All three give you HTTPS automatically, which is required for the service
worker/PWA install feature to work.

## 8. Using the app — quick walkthrough

1. **First load:** today's date is filled in automatically, the
   organization header is already in place, and you can start typing right
   away.
2. **নোটিশের ধরন:** pick a notice type from the dropdown, or choose
   "Custom Title" to type your own.
3. **তারিখ / সূত্র:** adjust the date if needed; সূত্র is optional and
   simply won't appear on the notice if left blank.
4. **নোটিশ বিবরণ:** pick a **বাংলা ফন্ট** from the dropdown (Noto Sans/Serif
   Bengali, Hind Siliguri, Baloo Da 2, Tiro Bangla, Mina, Galada, or Atma —
   a curated set of free, professional Bengali fonts) — it applies to the
   whole notice body. Use the **টেক্সট কালার** swatch next to it to color
   specific words: select the text first, then pick a color. The small
   toolbar below still handles bold, italic, alignment, bullet points, and
   font size. The toggle for showing the organization's watermark behind
   the text lives right under the content box.
5. **অনুমোদন / স্বাক্ষর অংশ:** choose one of three modes with the segmented
   buttons — **নেই** (no signature block at all), **শুধু সংস্থার নাম**
   (just show the organization's name, nothing else), or **বিস্তারিত
   (আদেশক্রমে)** (the full mode: pick আদেশক্রমে/অনুরোধক্রমে/etc. and fill in
   a name and designation).
6. **ফুটার তথ্য:** optional contact/phone/address line at the very bottom.
7. Watch the **live preview** update as you type. On phones, switch to the
   "প্রিভিউ" tab to see it full-screen; on desktop it sits right next to
   the editor.
8. Tap **সেভ করুন** to store the notice, **PDF ডাউনলোড** for a print-ready
   PDF, or **প্রিন্ট করুন** to print directly.
9. Tap the **🗂️ history icon** in the top bar any time to edit, duplicate,
   delete, or re-download any past notice.

The organization's logo (in the header) and watermark image are fixed and
built into the app already — see section 3 above if you ever need to swap
those image files.

## 9. Data safety

- Nothing is ever uploaded anywhere — no analytics, no server calls for
  your notice content, no login.
- Use **⚙️ Settings → ডাটা এক্সপোর্ট করুন** periodically to download a JSON
  backup of every notice. Keep that file somewhere safe (email it to
  yourself, save it to Google Drive, etc.).
- **ডাটা ইমপোর্ট করুন** restores/merges notices from a previously exported
  JSON backup (useful when switching phones/browsers).
- **সব ডাটা মুছে ফেলুন** permanently wipes everything from this browser —
  it always asks for confirmation first, and cannot be undone unless you
  have an export backup.

## 10. Notes on the icons

The two files in `icons/` are simple placeholder icons generated to match
the app's navy/green/red color scheme. Replace them with a proper icon
based on your real organization logo whenever convenient — just keep the
same filenames (`icon-192.png`, `icon-512.png`) and the same square
dimensions, and the manifest will pick them up automatically.
