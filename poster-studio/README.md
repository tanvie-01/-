# পোস্টার স্টুডিও — Poster Studio

Frontend-only React + Vite poster designer for **লৎসর দক্ষিণ পাড়া যুব সমাজ
মানব কল্যাণ সংস্থা**. It is the 🎨 section of the Notice App
(`../bengali-notice-app`): the production build is written into
`../bengali-notice-app/poster/` and opened from the app's top menu.

## Run / build

```bash
npm install
npm run dev       # stand-alone dev server, http://localhost:5173
npm run build     # → ../bengali-notice-app/poster/  (stable file names, offline-cached)
```

Run `npm run build` after every change, then the tests in
`../bengali-notice-app/tests` (`npm test`).

## What it does

- **8 categories** across the top — অভিনন্দন, স্বাগতম, শুভেচ্ছা, অনুষ্ঠান,
  পুরস্কার, ঘোষণা, জন্মদিন, অন্যান্য — each with its own form labels and
  starting text.
- **17 templates** (2–3 per category) with different compositions; the
  gallery shows live previews with the user's own photo and name.
- **Photos placed properly**: cover/contain fit from the real aspect ratio
  (never stretched), drag-to-pan in crop mode with pan clamped so a frame is
  never left with an empty gap, zoom by slider / mouse wheel / pinch, 90°
  rotate, 7 frame shapes, decorative backdrops (halo, rays, laurel, offset
  block…) that move and scale with the frame.
- **Everything is movable**: every photo, logo and text block of a template
  can be selected, dragged (snaps to the centre lines), resized with
  handles (circles keep their shape) and restyled — always kept inside the
  poster.
- **Text never breaks the layout**: each text block shrinks its font to fit
  its box, so long names or messages can't push other parts around.
- **Design elements**: text blocks, shapes, lines/dividers, frames, decor
  (laurel, rays, confetti, flowers, crescent, balloons, bunting, medal),
  badges with text, background patterns, extra image frames — with colour,
  outline/gradient, thickness, rotation, opacity, layer order, duplicate.
- **Colours**: 5 palette colours per poster (+ ready-made sets); templates
  and added elements use palette tokens so everything recolours together.
- Undo/redo, autosaved draft, saved projects, custom templates from your own
  background image, PNG/JPG export at 2160 × 2700 with share-to-gallery on
  phones.

## How it is organised

```
src/
├── App.jsx                 studio shell: header, categories, panels, stage, autosave, shortcuts
├── data/categories.js      categories, field keys, per-category labels & default text
├── templates/              template definitions (one file per category) + registry (index.jsx)
├── poster/                 rendering only — PosterCanvas, FitText, PhotoFrame/PhotoFill, art
├── elements/library.jsx    design elements: definitions + renderers
├── editor/                 EditorStage (select/move/resize/crop gestures), SelectionToolbar
├── panels/                 টেমপ্লেট / লেখা / ছবি / এলিমেন্ট / রং / সংরক্ষিত side panels
├── state/                  design model, items (slots + elements), undo/redo history
├── lib/                    constants, colours, photo crop math, hooks
├── utils/                  IndexedDB storage, image export
└── components/             shared UI (dialogs, toast, slider…), category bar, export dialog, decor art
```

The whole poster is one plain `design` object (see `state/model.js`):
template id, field text, palette overrides, the photo and its crop, per-slot
layout overrides and the list of added elements. Rendering (`poster/`) is
separate from editing (`editor/`): the editor draws handles in an overlay,
so exports contain only the poster.

## Adding a template

Add an object to the right file in `src/templates/` (copy a neighbour):

```js
{
  id: 'my-template', category: 'welcome', name: 'আমার টেমপ্লেট', en: 'My Template',
  palette: { primary, secondary, accent, bg, text },
  Background: ({ c }) => <…fixed artwork using c.primary etc…/>,
  slots: [
    { id: 'photo', kind: 'photo', x, y, w, h, shape: 'circle', ring: {…}, backdrop: {…} },
    { id: 'name',  kind: 'text', field: 'name', x, y, w, h, font: 'baloo', size: 72, color: '$primary' },
    …
  ],
}
```

Coordinates are pixels on the 1080 × 1350 poster; colours may use `$primary`,
`$secondary`, `$accent`, `$bg`, `$text`. It appears in the gallery
automatically.

## Data from the previous version

Projects and custom templates saved by the earlier Poster Studio are
converted automatically when opened (old template ids map to the closest new
template, old fields to the new ones). The original source is kept in
`../poster-studio-original-backup.zip`.
