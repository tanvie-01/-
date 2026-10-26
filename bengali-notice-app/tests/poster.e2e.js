// End-to-end tests for Poster Studio (the ./poster section, built from
// ../poster-studio) and its integration into the Notice App.
// Usage (from this folder): npm test   — or: node poster.e2e.js [appDir]
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const APP = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const results = [];
async function t(name, fn) {
  try { await fn(); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name, e.message.split("\n")[0]]); }
}
function assert(c, msg) { if (!c) throw new Error(msg); }
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

(async () => {
  if (!fs.existsSync(path.join(APP, "poster", "index.html"))) {
    console.error("poster/ build missing — run `npm run build` in ../poster-studio first");
    process.exit(1);
  }
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();

  // ---- synthetic test photos of very different shapes ----
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "poster-imgs-"));
  const IMGS = { portrait: [900, 1200], landscape: [1600, 900], square: [1000, 1000], tiny: [200, 150], tall: [600, 2000] };
  {
    const p = await browser.newPage();
    for (const [n, [w, h]] of Object.entries(IMGS)) {
      const data = await p.evaluate(([w, h]) => {
        const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
        const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#7fb3d5"); g.addColorStop(1, "#f5cba7"); x.fillStyle = g; x.fillRect(0, 0, w, h);
        const m = Math.min(w, h); x.fillStyle = "#e0ac69"; x.beginPath(); x.arc(w / 2, h * 0.42, m * 0.2, 0, 7); x.fill();
        x.fillStyle = "#2c3e50"; x.beginPath(); x.ellipse(w / 2, h * 0.42 + m * 0.55, m * 0.38, m * 0.3, 0, 0, 7); x.fill();
        return c.toDataURL("image/jpeg", 0.9);
      }, [w, h]);
      fs.writeFileSync(path.join(tmp, `${n}.jpg`), Buffer.from(data.split(",")[1], "base64"));
    }
    await p.close();
  }
  const img = (n) => path.join(tmp, `${n}.jpg`);

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base + "poster/index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const poster = '[data-testid=stage] .shadow-poster > div';
  const posterText = () => page.$eval(poster, el => el.textContent);
  const hit = (id) => `[data-item="${id}"]`;
  const rect = (sel) => page.$eval(sel, el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  async function drag(sel, dx, dy, steps = 8) {
    const r = await rect(sel);
    const sx = r.x + r.w / 2, sy = r.y + r.h / 2;
    await page.mouse.move(sx, sy); await page.mouse.down();
    await page.mouse.move(sx + dx, sy + dy, { steps }); await page.mouse.up();
    await page.waitForTimeout(120);
  }
  // geometry of the main photo: <img> vs the clipped frame it sits in
  const photoGeom = () => page.$eval(poster, root => {
    const imgs = [...root.querySelectorAll("img")].filter(i => i.src.startsWith("data:image") && !i.style.filter.includes("blur") && i.parentElement.style.overflow === "hidden" && i.style.transform.includes("translate"));
    if (!imgs.length) return null;
    const im = imgs[0], fr = im.parentElement.parentElement;
    const a = im.getBoundingClientRect(), b = fr.getBoundingClientRect();
    return { img: { x: a.x, y: a.y, w: a.width, h: a.height }, frame: { x: b.x, y: b.y, w: b.width, h: b.height }, nat: im.naturalWidth / im.naturalHeight };
  });
  const covers = (g) => g.img.x <= g.frame.x + 0.6 && g.img.y <= g.frame.y + 0.6 && g.img.x + g.img.w >= g.frame.x + g.frame.w - 0.6 && g.img.y + g.img.h >= g.frame.y + g.frame.h - 0.6;

  // ------------------------------------------------------------ basics
  await t("poster studio loads without errors", async () => assert(errors.length === 0, errors.join("; ")));
  await t("8 poster categories shown", async () => {
    const cats = await page.$$eval("[data-category]", els => els.map(e => e.dataset.category));
    assert(cats.join() === "congrats,welcome,greetings,event,achievement,announcement,birthday,other", cats.join());
  });
  await t("every category has ≥2 templates and switching applies its title", async () => {
    const expect = { welcome: "স্বাগতম", greetings: "ঈদ মোবারক", event: "বার্ষিক ক্রীড়া", achievement: "অভিনন্দন", announcement: "বিশেষ ঘোষণা", birthday: "শুভ জন্মদিন", other: "বিদায় সংবর্ধনা", congrats: "প্রাণঢালা অভিনন্দন" };
    for (const [cat, title] of Object.entries(expect)) {
      await page.click(`[data-category=${cat}]`); await page.waitForTimeout(200);
      const n = await page.$$eval("[data-template]", els => els.length);
      assert(n >= 2, `${cat}: ${n} templates`);
      assert((await posterText()).includes(title), `${cat}: title "${title}" not on poster`);
    }
  });
  await t("all templates render (no errors, poster text present)", async () => {
    for (const cat of ["congrats", "welcome", "greetings", "event", "achievement", "announcement", "birthday", "other"]) {
      await page.click(`[data-category=${cat}]`); await page.waitForTimeout(100);
      for (const id of await page.$$eval("[data-template]", els => els.map(e => e.dataset.template))) {
        await page.click(`[data-template="${id}"]`); await page.waitForTimeout(80);
        assert((await posterText()).length > 20, id);
      }
    }
    assert(errors.length === 0, errors.join("; "));
  });

  // ------------------------------------------------------------ text
  await page.click("[data-category=congrats]");
  await page.click('[data-template="emerald"]');
  await t("editing a field updates the poster live", async () => {
    await page.click('[data-tab=content]');
    await page.fill('[data-field=name]', "তানভীর হোসেন");
    assert((await posterText()).includes("তানভীর হোসেন"), "name not shown");
  });
  await t("typed name survives template and category switches", async () => {
    await page.click('[data-tab=template]');
    await page.click('[data-template="modern-celebration"]'); await page.waitForTimeout(150);
    assert((await posterText()).includes("তানভীর হোসেন"), "lost on template switch");
    await page.click("[data-category=welcome]"); await page.waitForTimeout(150);
    assert((await posterText()).includes("তানভীর হোসেন"), "lost on category switch");
    assert((await posterText()).includes("স্বাগতম"), "untouched title should follow category");
  });
  await t("long text auto-shrinks inside its box (layout never breaks)", async () => {
    await page.click('[data-tab=content]');
    const long = "মোহাম্মদ আব্দুল্লাহ আল মামুন চৌধুরী সিদ্দিকী তালুকদার";
    await page.fill('[data-field=name]', long); await page.waitForTimeout(300);
    const fit = await page.$eval(poster, (root, long) => {
      const el = [...root.querySelectorAll("div")].find(d => d.textContent === long && d.children.length === 0);
      const box = el.parentElement;
      return { sw: el.scrollWidth, cw: box.clientWidth, sh: el.scrollHeight, ch: box.clientHeight, fs: parseFloat(el.style.fontSize) };
    }, long);
    assert(fit.sw <= fit.cw + 1 && fit.sh <= fit.ch + 1, JSON.stringify(fit));
    await page.fill('[data-field=name]', "তানভীর হোসেন");
  });
  await t("clearing a field hides that part of the poster", async () => {
    await page.fill('[data-field=subtitle]', "");
    assert(!(await page.$(hit("slot:subtitle"))), "empty slot still selectable");
    await page.fill('[data-field=subtitle]', "নবনির্বাচিত সভাপতি");
  });

  // ------------------------------------------------------------ photo
  await page.click("[data-category=congrats]");
  await page.click('[data-template="emerald"]');
  await t("photos of any size fill the frame without distortion", async () => {
    for (const n of Object.keys(IMGS)) {
      await page.setInputFiles("[data-testid=file-input]", img(n)); await page.waitForTimeout(350);
      const g = await photoGeom();
      assert(g, `${n}: photo not rendered`);
      assert(covers(g), `${n}: frame not covered ${JSON.stringify(g)}`);
      assert(Math.abs(g.img.w / g.img.h - g.nat) < 0.02, `${n}: aspect distorted ${g.img.w / g.img.h} vs ${g.nat}`);
    }
  });
  await t("photo is placed in every template that has a photo slot", async () => {
    await page.setInputFiles("[data-testid=file-input]", img("portrait")); await page.waitForTimeout(300);
    for (const cat of ["congrats", "welcome", "greetings", "event", "achievement", "birthday", "other"]) {
      await page.click(`[data-category=${cat}]`); await page.waitForTimeout(100);
      for (const id of await page.$$eval("[data-template]", els => els.map(e => e.dataset.template))) {
        await page.click(`[data-template="${id}"]`); await page.waitForTimeout(120);
        const g = await photoGeom();
        assert(g, `${id}: no photo`);
        if (!["confetti-birthday"].includes(id)) assert(covers(g), `${id}: gap in frame`);
      }
    }
  });
  await page.click("[data-category=congrats]");
  await page.click('[data-template="emerald"]');
  await page.setInputFiles("[data-testid=file-input]", img("landscape")); await page.waitForTimeout(300);

  await t("uploading selects the photo and shows its toolbar", async () => {
    assert(await page.isVisible("[data-testid=selection]"), "not selected");
    assert(await page.isVisible("[data-testid=tb-crop]"), "no crop button");
  });
  await t("crop mode: dragging pans the photo, clamped so no gap appears", async () => {
    await page.click("[data-testid=tb-crop]");
    const g0 = await photoGeom();
    await drag(hit("slot:photo"), 60, 0);
    const g1 = await photoGeom();
    assert(g1.img.x > g0.img.x + 5, "did not pan");
    await drag(hit("slot:photo"), 3000, 0);
    const g2 = await photoGeom();
    assert(covers(g2), "gap after over-drag " + JSON.stringify(g2));
    assert(near(g2.img.x, g2.frame.x, 1), "should stop exactly at edge");
  });
  await t("crop mode: wheel zooms the photo (aspect kept)", async () => {
    const g0 = await photoGeom();
    const r = await rect(hit("slot:photo"));
    await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
    await page.mouse.wheel(0, -400); await page.waitForTimeout(150);
    const g1 = await photoGeom();
    assert(g1.img.w > g0.img.w * 1.2, "no zoom");
    assert(Math.abs(g1.img.w / g1.img.h - g1.nat) < 0.02, "distorted");
    assert(covers(g1), "gap after zoom");
    await page.keyboard.press("Escape");
  });
  await t("'whole photo' (contain) mode shows the entire image inside the frame", async () => {
    await page.click(hit("slot:photo"));
    await page.click("[data-testid=tb-zoom]");
    await page.click('[data-testid=toolbar-pop] button:has-text("পুরো ছবি")'); await page.waitForTimeout(150);
    const g = await photoGeom();
    assert(g.img.w <= g.frame.w + 1 && g.img.h <= g.frame.h + 1, "image larger than frame");
    assert(Math.abs(g.img.w / g.img.h - g.nat) < 0.02, "distorted");
    await page.click('[data-testid=toolbar-pop] button:has-text("ফ্রেম ভরাট")');
  });
  await t("moving the photo frame keeps it inside the poster", async () => {
    await page.click(hit("slot:photo"));
    await drag(hit("slot:photo"), -3000, -3000);
    const p = await rect(poster), f = await rect(hit("slot:photo"));
    assert(f.x >= p.x - 0.5 && f.y >= p.y - 0.5, JSON.stringify({ p, f }));
  });
  await t("resizing a circular frame keeps it circular and inside the poster", async () => {
    await page.click(hit("slot:photo"));
    const r0 = await rect(hit("slot:photo"));
    await drag('[data-handle="1,1"]', 80, 20);
    const r1 = await rect(hit("slot:photo"));
    assert(r1.w > r0.w + 20, "did not grow");
    assert(near(r1.w, r1.h), `not square ${r1.w}x${r1.h}`);
    const g = await photoGeom();
    assert(covers(g), "photo no longer covers resized frame");
  });
  await t("rectangular frame: side handle changes aspect, photo still undistorted", async () => {
    await page.click('[data-testid=tb-shape]');
    await page.click('[data-testid=toolbar-pop] button:has-text("গোলাকার কোণ")'); await page.waitForTimeout(100);
    const r0 = await rect(hit("slot:photo"));
    await drag('[data-handle="1,0"]', -60, 0);
    const r1 = await rect(hit("slot:photo"));
    assert(r1.w < r0.w - 20 && near(r1.h, r0.h), "side resize wrong");
    const g = await photoGeom();
    assert(covers(g) && Math.abs(g.img.w / g.img.h - g.nat) < 0.02, "bad photo fit");
  });
  await t("reset puts the frame back to the template layout", async () => {
    await page.click("[data-testid=tb-reset]"); await page.waitForTimeout(100);
    const r = await rect(hit("slot:photo"));
    assert(near(r.w, r.h), "not back to circle");
  });
  await t("double-click on photo toggles crop mode", async () => {
    await page.keyboard.press("Escape");
    await page.dblclick(hit("slot:photo")); await page.waitForTimeout(100);
    assert((await page.textContent("[data-testid=selection]")).includes("ক্রপ"), "not in crop mode");
    await page.keyboard.press("Escape");
  });

  // ------------------------------------------------------------ text styling on canvas
  await t("selecting a text slot: A+ grows text, colour + font apply", async () => {
    await page.click(hit("slot:name"));
    const before = await page.$eval(hit("slot:name"), el => el.getBoundingClientRect().height);
    await page.click("[data-testid=tb-size-up]"); await page.waitForTimeout(100);
    const after = await page.$eval(hit("slot:name"), el => el.getBoundingClientRect().height);
    assert(after > before, "size up did nothing");
    await page.selectOption("[data-testid=tb-font]", "galada");
    await page.click("[data-testid=tb-color]");
    await page.click('[data-testid=toolbar-pop] button[aria-label="কালো"]');
    const style = await page.$eval(poster, root => { const el = [...root.querySelectorAll("div")].find(d => d.textContent === "তানভীর হোসেন" && !d.children.length); return [el.style.fontFamily, el.style.color]; });
    assert(style[0].includes("Galada") && style[1] === "rgb(0, 0, 0)", style.join());
  });
  await t("double-click text jumps to its field in the লেখা panel", async () => {
    await page.click('[data-tab=template]');
    await page.dblclick(hit("slot:name")); await page.waitForTimeout(400);
    assert(await page.evaluate(() => document.activeElement?.dataset?.field === "name"), "field not focused");
  });
  await t("hide a slot and restore it", async () => {
    await page.keyboard.press("Escape");
    await page.click(hit("slot:motto"));
    await page.click("[data-testid=tb-delete]");
    assert(!(await posterText()).includes("হাতে হাত ধরি"), "still visible");
    await page.click('[data-tab=content]');
    await page.click('button:has-text("ফিরিয়ে আনুন")');
    assert((await posterText()).includes("হাতে হাত ধরি"), "not restored");
  });

  // ------------------------------------------------------------ elements
  await t("every design element can be added (and renders)", async () => {
    await page.click('[data-tab=elements]');
    const keys = await page.$$eval("[data-add]", els => els.map(e => e.dataset.add));
    assert(keys.length >= 40, "only " + keys.length);
    const fc = page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null);
    for (const k of keys) {
      if (k.startsWith("image:")) continue;
      await page.click(`[data-add="${k}"]`);
    }
    await fc;
    const n = await page.$$eval("[data-item^='el:']", els => els.length);
    assert(n === keys.filter(k => !k.startsWith("image:")).length, `items ${n}`);
    assert(errors.length === 0, errors.join("; "));
  });
  await t("undo / redo", async () => {
    const n0 = await page.$$eval("[data-item^='el:']", els => els.length);
    await page.keyboard.press("Escape");
    await page.click("[data-testid=undo]"); await page.waitForTimeout(80);
    const n1 = await page.$$eval("[data-item^='el:']", els => els.length);
    await page.click("[data-testid=redo]"); await page.waitForTimeout(80);
    const n2 = await page.$$eval("[data-item^='el:']", els => els.length);
    assert(n1 === n0 - 1 && n2 === n0, `${n0} ${n1} ${n2}`);
  });
  await t("element: select from layers, recolour, duplicate, delete (Delete key)", async () => {
    const before = await page.$$eval("[data-item^='el:']", els => els.length);
    const id = await page.$eval("[data-layer^='el:']", el => el.dataset.layer);
    await page.click(`[data-layer="${id}"]`);
    await page.click("[data-testid=tb-duplicate]");
    assert((await page.$$eval("[data-item^='el:']", els => els.length)) === before + 1, "duplicate failed");
    await page.click("[data-testid=tb-color]");
    await page.click('[data-testid=toolbar-pop] button[aria-label="অ্যাকসেন্ট"]');
    await page.keyboard.press("Delete");
    await page.keyboard.press("Escape");
    assert((await page.$$eval("[data-item^='el:']", els => els.length)) === before, "delete failed");
  });
  await t("image frame element accepts its own photo", async () => {
    // clear previous elements for a clean poster
    while ((await page.$$("[data-item^='el:']")).length) {
      await page.click(`[data-layer^='el:'] button[aria-label="মুছুন"]`);
    }
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('[data-add="image:circle"]')]);
    await chooser.setFiles(img("square")); await page.waitForTimeout(300);
    const has = await page.$$eval(`${poster} img`, els => els.filter(i => i.src.startsWith("data:image")).length);
    assert(has >= 2, "image element has no photo");
  });
  await t("text element: edit its text from the toolbar", async () => {
    await page.click('[data-add="text:heading"]');
    await page.click("[data-testid=tb-edit-text]");
    await page.fill("[data-testid=tb-textarea]", "নতুন শিরোনাম");
    assert((await posterText()).includes("নতুন শিরোনাম"), "text not updated");
  });
  await t("recolouring the palette restyles template + token-coloured elements", async () => {
    await page.keyboard.press("Escape");
    await page.click('[data-tab=style]');
    const bg0 = await page.$eval(poster, el => el.style.background);
    await page.click('button:has-text("বেগুনি")'); await page.waitForTimeout(100);
    const bg1 = await page.$eval(poster, el => el.style.background);
    assert(bg0 !== bg1, "palette not applied");
    await page.click('button:has-text("টেমপ্লেটের মূল রং")');
  });

  // ------------------------------------------------------------ export
  await t("export: 2160×2700 PNG preview and download", async () => {
    await page.click("[data-testid=download]");
    await page.waitForSelector("[data-testid=export-preview]", { timeout: 30000 });
    const dims = await page.$eval("[data-testid=export-preview]", i => [i.naturalWidth, i.naturalHeight]);
    assert(dims[0] === 2160 && dims[1] === 2700, dims.join("x"));
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-testid=export-download]")]);
    const buf = fs.readFileSync(await dl.path());
    assert(buf.slice(1, 4).toString() === "PNG", "not a PNG");
    assert(/^Latsor_Poster_.+\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    await page.keyboard.press("Escape");
  });
  await t("export: JPG option", async () => {
    await page.click("[data-testid=download]");
    await page.click('button:has-text("JPG")');
    await page.waitForSelector("[data-testid=export-preview]", { timeout: 30000 });
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-testid=export-download]")]);
    const buf = fs.readFileSync(await dl.path());
    assert(buf[0] === 0xff && buf[1] === 0xd8, "not a JPEG");
    await page.keyboard.press("Escape");
  });

  // ------------------------------------------------------------ save / restore
  await t("save project, then it's listed under সংরক্ষিত", async () => {
    await page.click("[data-testid=save]");
    await page.fill("[data-testid=dialog-input]", "টেস্ট পোস্টার");
    await page.click("[data-testid=dialog-ok]");
    await page.waitForTimeout(1500);
    await page.click('[data-tab=saved]');
    assert((await page.textContent("body")).includes("টেস্ট পোস্টার"), "not listed");
  });
  await t("work-in-progress survives a page reload (autosaved draft)", async () => {
    await page.click('[data-tab=content]');
    await page.fill('[data-field=name]', "রিলোড পরীক্ষা"); await page.waitForTimeout(1000);
    await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(600);
    assert((await posterText()).includes("রিলোড পরীক্ষা"), "draft lost");
    assert((await page.textContent("[data-testid=project-name]")).includes("টেস্ট পোস্টার"), "project name lost");
  });
  await t("open a saved project restores it", async () => {
    await page.click('[data-tab=saved]');
    await page.click('[data-project] button:has-text("খুলুন")'); await page.waitForTimeout(400);
    assert((await posterText()).includes("তানভীর হোসেন"), "saved content not restored");
  });
  await t("new poster resets the editor", async () => {
    await page.click('button:has-text("নতুন")');
    await page.click("[data-testid=dialog-ok]"); await page.waitForTimeout(200);
    assert(!(await page.$("[data-item^='el:']")), "elements remain");
  });

  // ------------------------------------------------------------ custom background template
  await t("custom background template: upload, rearrange, save layout", async () => {
    await page.click('[data-tab=template]');
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('button:has-text("ব্যাকগ্রাউন্ড ছবি দিয়ে")')]);
    await chooser.setFiles(img("landscape"));
    await page.fill("[data-testid=dialog-input]", "আমার ব্যাকগ্রাউন্ড");
    await page.click("[data-testid=dialog-ok]"); await page.waitForTimeout(500);
    assert((await page.textContent("body")).includes("আমার ব্যাকগ্রাউন্ড"), "custom template missing");
    await page.click(hit("slot:name"));
    await drag(hit("slot:name"), 0, 80);
    await page.click('button:has-text("লেআউট টেমপ্লেটে সংরক্ষণ")'); await page.waitForTimeout(300);
    assert((await page.textContent("body")).includes("লেআউট টেমপ্লেটে সংরক্ষিত"), "layout not saved");
  });
  await t("no console errors during the whole poster run", async () => assert(errors.length === 0, errors.join("; ")));
  await ctx.close();

  // ------------------------------------------------------------ data from the previous Poster Studio
  await t("projects & custom templates saved by the old Poster Studio still open", async () => {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base + "poster/__blank__");
    const photo = "data:image/jpeg;base64," + fs.readFileSync(img("portrait")).toString("base64");
    await p.evaluate((photo) => new Promise((res, rej) => {
      const r = indexedDB.open("poster-studio", 2);
      r.onupgradeneeded = () => { const db = r.result; db.createObjectStore("projects", { keyPath: "id" }).createIndex("updatedAt", "updatedAt"); db.createObjectStore("customTemplates", { keyPath: "id" }).createIndex("createdAt", "createdAt"); };
      r.onsuccess = () => {
        const tx = r.result.transaction(["projects", "customTemplates"], "readwrite");
        tx.objectStore("projects").put({ id: "proj_old", name: "পুরনো প্রজেক্ট", templateId: "sunrise", updatedAt: Date.now(), photo: { src: photo, zoom: 1.3, x: 10, y: 0, rotate: 15 },
          fields: { name: "পুরনো নাম", designation: "পুরনো পদবি", congratsMain: "পুরনো অভিনন্দন", orgName: "পুরনো সংগঠন", bismillah: "বিসমিল্লাহ" } });
        tx.objectStore("customTemplates").put({ id: "tpl_old", name: "পুরনো টেমপ্লেট", image: photo, createdAt: 1,
          layout: { photo: { x: 30, y: 8, w: 40, h: 32, shape: "circle" }, name: { x: 10, y: 50, w: 80, h: 8, fontSize: 40, fontFamily: "display", fontWeight: 700, align: "center", color: "#111111" } } });
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
      };
    }), photo);
    await p.goto(base + "poster/index.html", { waitUntil: "networkidle" }); await p.waitForTimeout(400);
    await p.click('[data-tab=saved]');
    await p.click('[data-project="proj_old"] button:has-text("খুলুন")'); await p.waitForTimeout(500);
    const txt = await p.$eval(poster, el => el.textContent);
    assert(txt.includes("পুরনো নাম") && txt.includes("পুরনো পদবি") && txt.includes("পুরনো অভিনন্দন"), "fields not migrated: " + txt.slice(0, 120));
    assert(await p.$eval(poster, el => [...el.querySelectorAll("img")].some(i => i.src.startsWith("data:image/jpeg"))), "photo not migrated");
    await p.click('[data-tab=template]');
    await p.click('[data-template="tpl_old"]'); await p.waitForTimeout(300);
    assert((await p.$eval(poster, el => el.textContent)).includes("পুরনো নাম"), "old custom layout not rendered");
    assert(errs.length === 0, errs.join("; "));
    await c.close();
  });

  // ------------------------------------------------------------ mobile
  await t("mobile: no horizontal overflow, tap-to-select shows toolbar", async () => {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await c.newPage();
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base + "poster/index.html", { waitUntil: "networkidle" }); await p.waitForTimeout(500);
    const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(ow <= 0, "overflow " + ow);
    await p.tap(hit("slot:name")); await p.waitForTimeout(150);
    assert(await p.isVisible("[data-testid=toolbar]"), "toolbar missing");
    for (const tab of ["template", "content", "photo", "elements", "style", "saved"]) {
      await p.tap(`[data-tab=${tab}]`); await p.waitForTimeout(80);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(o <= 0, `${tab} overflow ${o}`);
    }
    assert(errs.length === 0, errs.join("; "));
    await c.close();
  });

  // ------------------------------------------------------------ integration with the Notice App
  await t("notice app: top nav switches to Poster Studio and back, both keep their state", async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const p = await c.newPage();
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base, { waitUntil: "networkidle" });
    await p.click("#noticeContent"); await p.keyboard.type("নোটিশের লেখা");
    await p.click('.section-tab[data-section=poster]');
    assert(await p.evaluate(() => location.hash) === "#poster", "hash");
    assert(await p.isVisible("#posterFrame"), "iframe hidden");
    assert(!(await p.isVisible("#noticeContent")), "notice still visible");
    const frame = p.frameLocator("#posterFrame");
    await frame.locator('[data-field=name]').waitFor({ state: "attached", timeout: 15000 }).catch(async () => { await frame.locator("[data-tab=content]").click(); });
    await frame.locator("[data-tab=content]").click();
    await frame.locator("[data-field=name]").fill("ইন্টিগ্রেশন নাম");
    await p.click('.section-tab[data-section=notice]');
    assert((await p.textContent("#noticeContent")).includes("নোটিশের লেখা"), "notice text lost");
    assert(await p.$eval('.section-tab[data-section=notice]', el => el.classList.contains("active")), "nav highlight");
    await p.click('.section-tab[data-section=poster]');
    assert((await frame.locator('[data-testid=stage]').textContent()).includes("ইন্টিগ্রেশন নাম"), "poster state lost");
    await p.goBack(); await p.waitForTimeout(200);
    assert(!(await p.evaluate(() => document.body.classList.contains("section-poster"))), "back button should return to notice");
    assert(errs.length === 0, errs.join("; "));
    await c.close();
  });
  await t("notice app: #poster deep link and remembered section", async () => {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await c.newPage();
    await p.goto(base + "#poster", { waitUntil: "networkidle" });
    assert(await p.isVisible("#posterFrame"), "deep link failed");
    const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(ow <= 0, "overflow " + ow);
    await p.goto(base, { waitUntil: "networkidle" });
    assert(await p.isVisible("#posterFrame"), "last section not remembered");
    await p.click('.section-tab[data-section=notice]');
    assert(await p.isVisible("#noticeContent"), "notice not shown");
    await c.close();
  });

  await browser.close(); server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const r of results) console.log(r.join(" | "));
  const f = results.filter(r => r[0] === "FAIL").length;
  console.log(`\n${results.length - f} passed, ${f} failed`);
  process.exit(f ? 1 : 0);
})();
