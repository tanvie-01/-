// End-to-end tests for the Bengali notice app (headless Chromium via Playwright).
// Usage (from this folder): npm install && npx playwright install chromium && npm test
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const APP = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(APP, p);
  if (!f.startsWith(APP) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const results = [];
async function t(name, fn) {
  try { await fn(); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name, e.message.split("\n")[0]]); }
}
function assert(c, msg) { if (!c) throw new Error(msg); }

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], missing = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });
  await page.goto(base, { waitUntil: "networkidle" });

  const txt = (sel) => page.locator(sel).textContent();
  const visible = (sel) => page.locator(sel).isVisible();

  await t("loads without JS errors", async () => assert(errors.length === 0, errors.join("; ")));
  await t("no 404 local assets", async () => {
    const local = missing.filter(m => m.includes("localhost"));
    assert(local.length === 0, local.join(", "));
  });

  // ---- pure utilities ----
  await t("toBengaliDigits", async () => assert(await page.evaluate(() => toBengaliDigits("2026-10-26")) === "২০২৬-১০-২৬", "wrong"));
  await t("formatDateBengali / Ascii", async () => {
    const [b, a] = await page.evaluate(() => [formatDateBengali("2026-09-12"), formatDateAscii("2026-09-12")]);
    assert(b === "১২/০৯/২০২৬" && a === "12-09-2026", `${b} ${a}`);
  });
  await t("sanitizeContentHtml strips script/on*", async () => {
    const out = await page.evaluate(() => sanitizeContentHtml('<b onclick="x()">hi</b><script>alert(1)</script><img src=x onerror=alert(1)>'));
    assert(!/script|onclick|onerror/i.test(out), out);
  });
  await t("sanitizeContentHtml strips javascript: URLs", async () => {
    const out = await page.evaluate(() => sanitizeContentHtml('<a href="javascript:alert(1)">x</a><a href=" jav&#x09;ascript:alert(1)">y</a>'));
    assert(!/javascript:|jav\s*ascript/i.test(out), out);
  });
  await t("sanitizeContentHtml keeps formatting + colors", async () => {
    const html = '<b>a</b><i>b</i><u>c</u><font color="#ff0000" size="5">d</font><span style="color: rgb(0, 0, 255);">e</span><ul><li>f</li></ul>';
    const out = await page.evaluate((h) => sanitizeContentHtml(h), html);
    assert(out === html, out);
  });
  await t("sanitizing does not execute payloads", async () => {
    await page.evaluate(() => sanitizeContentHtml('<img src=x onerror="window.__pwnSan=1">'));
    await page.waitForTimeout(200);
    assert(!(await page.evaluate(() => window.__pwnSan)), "onerror ran during sanitize");
  });
  await t("buildPdfFilename (known + custom type)", async () => {
    const [a, b] = await page.evaluate(() => [
      buildPdfFilename({ noticeType: "জরুরী নোটিশ", date: "2026-09-12" }),
      buildPdfFilename({ noticeType: "__custom__", resolvedTitle: 'A/B: "c"  d', date: "2026-09-12" }),
    ]);
    assert(a === "Latsor_Sangstha_Jaruri_Notice_12-09-2026.pdf", a);
    assert(b === "Latsor_Sangstha_AB_c_d_12-09-2026.pdf", b);
  });
  await t("TYPE_SLUG_MAP covers every <option> in noticeType", async () => {
    const miss = await page.evaluate(() => [...document.querySelectorAll("#noticeType option")]
      .map(o => o.value).filter(v => v !== "__custom__" && !TYPE_SLUG_MAP[v]));
    assert(miss.length === 0, "missing: " + miss.join(", "));
  });
  await t("resolveSigMode legacy fallback", async () => {
    const r = await page.evaluate(() => [resolveSigMode({ sigEnabled: false }), resolveSigMode({}), resolveSigMode({ sigMode: "orgOnly" })]);
    assert(r.join() === "none,detailed,orgOnly", r.join());
  });

  // ---- live preview ----
  await t("preview shows org name + today's date", async () => {
    assert((await txt("#previewOrgName")).includes("লৎসর"), "org");
    const exp = await page.evaluate(() => formatDateBengali(todayISO()));
    assert((await txt("#previewDate")) === exp, "date");
  });
  await t("typing content updates preview", async () => {
    await page.click("#noticeContent");
    await page.keyboard.type("আগামী শুক্রবার সভা হবে।");
    assert((await txt("#previewContent")).includes("আগামী শুক্রবার"), "content not mirrored");
  });
  await t("custom title field toggles + preview", async () => {
    await page.selectOption("#noticeType", "__custom__");
    assert(await visible("#customTitleField"), "field hidden");
    await page.fill("#customTitle", "বার্ষিক সভা");
    assert((await txt("#previewTitle")) === "বার্ষিক সভা", "title");
    await page.selectOption("#noticeType", "জরুরী নোটিশ");
  });
  await t("source row hidden when empty, shown when filled", async () => {
    const vis = () => page.$eval("#previewSourceWrap", e => e.style.visibility);
    assert((await vis()) === "hidden", "should be hidden");
    await page.fill("#noticeSource", "কমিটি");
    assert((await vis()) === "visible", "should be visible");
  });
  await t("signature modes none/orgOnly/detailed", async () => {
    await page.click('#sigModeSegmented [data-val="none"]');
    assert(!(await visible("#previewSigArea")), "none");
    await page.click('#sigModeSegmented [data-val="orgOnly"]');
    assert((await txt("#previewSigName")).includes("লৎসর"), "orgOnly");
    await page.click('#sigModeSegmented [data-val="detailed"]');
    await page.fill("#sigName", "রহিম");
    await page.fill("#sigDesignation", "সভাপতি");
    assert((await txt("#previewSigName")) === "রহিম", "name");
    assert((await txt("#previewSigDesignation")).startsWith("সভাপতি, "), "designation");
  });
  await t("footer toggle + text", async () => {
    await page.click("#footerEnabled + .slider");
    assert(await visible("#footerFieldsWrap"), "fields hidden");
    await page.fill("#footerPhone", "01700000000");
    assert((await txt("#previewFooterText")).includes("ফোন: 01700000000"), "footer");
  });
  await t("watermark toggle", async () => {
    await page.uncheck("#watermarkEnabled");
    assert(!(await visible("#previewWatermark")), "should hide");
    await page.check("#watermarkEnabled");
  });
  await t("XSS: title/footer inputs are not rendered as HTML", async () => {
    await page.fill("#footerContact", "<img src=x onerror=window.__pwn=1>");
    await page.waitForTimeout(100);
    assert(!(await page.evaluate(() => window.__pwn)), "executed");
  });

  // ---- save / history ----
  await t("save empty content is rejected", async () => {
    await page.evaluate(() => { els.noticeContent.innerHTML = ""; });
    await page.click("#btnSave");
    assert((await txt("#toast")).includes("বিষয়বস্তু"), await txt("#toast"));
    assert((await page.evaluate(() => dbGetAll(STORE_NOTICES))).length === 0, "saved anyway");
  });
  await t("save creates record + edit badge", async () => {
    await page.click("#noticeContent");
    await page.keyboard.type("প্রথম নোটিশ");
    await page.click("#btnSave");
    await page.waitForTimeout(200);
    const all = await page.evaluate(() => dbGetAll(STORE_NOTICES));
    assert(all.length === 1, "count " + all.length);
    assert(await visible("#editingBadge"), "badge");
    assert((await txt("#btnSave")).includes("আপডেট"), "label");
  });
  await t("first save shows 'saved' (not 'updated') toast", async () => {
    await page.click("#btnNew"); await page.click("#btnConfirmYes");
    await page.click("#noticeContent"); await page.keyboard.type("দ্বিতীয়");
    await page.click("#btnSave"); await page.waitForTimeout(200);
    assert((await txt("#toast")) === "নোটিশ সেভ হয়েছে", "got: " + (await txt("#toast")));
  });
  await t("update keeps same record", async () => {
    await page.click("#noticeContent"); await page.keyboard.type(" আপডেট");
    await page.click("#btnSave"); await page.waitForTimeout(200);
    assert((await page.evaluate(() => dbGetAll(STORE_NOTICES))).length === 2, "dup record");
  });
  await t("history modal lists notices", async () => {
    await page.click("#btnHistory"); await page.waitForTimeout(200);
    assert((await page.locator(".history-item").count()) === 2, "count");
  });
  await t("history search filters", async () => {
    await page.fill("#historySearch", "প্রথম"); await page.waitForTimeout(200);
    assert((await page.locator(".history-item").count()) === 1, "count " + (await page.locator(".history-item").count()));
    await page.fill("#historySearch", ""); await page.waitForTimeout(200); await page.evaluate(() => closeHistoryModal());
  });
  await t("history Edit button loads notice", async () => {
    await page.click("#btnHistory"); await page.waitForTimeout(200);
    await page.locator('.history-item:has-text("প্রথম") [data-act="edit"]').click();
    await page.waitForTimeout(300);
    assert(!(await visible("#historyModal")), "modal still open");
    assert((await txt("#noticeContent")).includes("প্রথম"), "not loaded");
  });
  await t("history Delete button removes notice", async () => {
    await page.evaluate(() => closeHistoryModal());
    await page.click("#btnHistory"); await page.waitForTimeout(200);
    await page.locator('.history-item [data-act="del"]').first().click();
    await page.waitForTimeout(200);
    assert(await visible("#confirmModal"), "no confirm dialog");
    await page.click("#btnConfirmYes"); await page.waitForTimeout(200);
    assert((await page.evaluate(() => dbGetAll(STORE_NOTICES))).length === 1, "not deleted");
  });
  await page.evaluate(() => { closeHistoryModal(); document.getElementById("confirmModal").classList.add("hidden"); });

  // ---- PDF ----
  await t("PDF download produces A4 PDF with right filename", async () => {
    await page.evaluate(() => resetForm());
    await page.click("#noticeContent"); await page.keyboard.type("পিডিএফ পরীক্ষা");
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#btnPdf")]);
    const fn = dl.suggestedFilename();
    const p = await dl.path();
    const buf = fs.readFileSync(p);
    assert(buf.slice(0, 4).toString() === "%PDF", "not a PDF");
    const pages = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    assert(/^Latsor_Sangstha_Jaruri_Notice_\d\d-\d\d-\d{4}\.pdf$/.test(fn), fn);
    assert(pages === 1, "pages=" + pages);
  });

  // ---- multi-page notices ----
  const pdfPageCount = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  const LONG_HTML = Array.from({ length: 30 }, (_, i) =>
    `<div>অনুচ্ছেদ ${i + 1}: সংস্থার সকল সদস্যকে জানানো যাচ্ছে যে আগামী মাসের সাধারণ সভায় <b>অবশ্যই উপস্থিত</b> থাকতে হবে এবং বার্ষিক চাঁদা পরিশোধ করতে হবে।</div>`
  ).join("") + "<div>" + "দীর্ঘ একটানা লেখা ".repeat(400) + "শেষ।</div>";
  const normText = (s) => s.replace(/\s+/g, " ").trim();
  const setLongContent = () => page.evaluate((html) => {
    els.noticeContent.innerHTML = html;
    renderPreview();
  }, LONG_HTML);

  await t("pagination: no overflow, no lost text, sig last, title first", async () => {
    await page.evaluate(() => resetForm());
    await setLongContent();
    await page.click('#sigModeSegmented [data-val="detailed"]');
    await page.fill("#sigName", "রহিম");
    await page.click("#footerEnabled + .slider");
    await page.fill("#footerPhone", "01700000000");
    const r = await page.evaluate(() => {
      const root = el("pdfRenderRoot");
      root.innerHTML = "";
      const pages = buildNoticePages(collectFormData(), root);
      const src = document.createElement("div");
      src.innerHTML = collectFormData().contentHtml;
      const out = {
        count: pages.length,
        overflow: pages.map(pageOverflows),
        heights: pages.map(p => p.clientHeight),
        text: pages.map(p => p.querySelector(".notice-content").textContent).join(" "),
        srcText: src.textContent,
        bold: pages.map(p => [...p.querySelectorAll(".notice-content b")].map(b => b.textContent).join("")).join(""),
        sig: pages.map(p => !!p.querySelector(".notice-sig-area")),
        title: pages.map(p => !!p.querySelector(".notice-title")),
        footer: pages.map(p => p.querySelector(".notice-footer-text").textContent),
        pageNo: pages.map(p => p.querySelector(".notice-page-no").textContent),
        firstContentLen: pages.map(p => p.querySelector(".notice-content").textContent.trim().length),
      };
      root.innerHTML = "";
      return out;
    });
    assert(r.count >= 3, "count " + r.count);
    assert(r.overflow.every(o => !o), "overflow " + r.overflow);
    assert(new Set(r.heights).size === 1, "heights " + r.heights);
    assert(normText(r.text).replace(/ /g, "") === normText(r.srcText).replace(/ /g, ""), "text lost/changed across pages");
    // a bold phrase split by a page break becomes two <b>s; its text must survive intact
    assert(r.bold.replace(/\s/g, "") === "অবশ্যইউপস্থিত".repeat(30), "bold text changed");
    assert(r.sig.lastIndexOf(true) === r.count - 1 && r.sig.filter(Boolean).length === 1, "sig " + r.sig);
    assert(r.title[0] && r.title.filter(Boolean).length === 1, "title " + r.title);
    assert(r.footer.every(f => f.includes("01700000000")), "footer " + r.footer);
    assert(r.pageNo[0].startsWith("পৃষ্ঠা ১/") && r.pageNo.every(Boolean), "pageNo " + r.pageNo);
    assert(r.firstContentLen.every(n => n > 0), "an empty page " + r.firstContentLen);
  });
  await t("pagination: signature that doesn't fit moves with content", async () => {
    // grow content line by line; whatever the break, the sig page must have content and nothing may overflow
    const bad = await page.evaluate(() => {
      const root = el("pdfRenderRoot");
      const issues = [];
      for (let n = 12; n <= 22; n++) {
        root.innerHTML = "";
        const rec = Object.assign(collectFormData(), {
          contentHtml: Array.from({ length: n }, (_, i) => `<div>লাইন ${i + 1} সভার বিষয়ে জরুরী তথ্য।</div>`).join(""),
        });
        const pages = buildNoticePages(rec, root);
        if (pages.some(pageOverflows)) issues.push(n + ":overflow");
        const last = pages[pages.length - 1];
        if (pages.length > 1 && !last.querySelector(".notice-content").textContent.trim()) issues.push(n + ":lonely-sig");
      }
      root.innerHTML = "";
      return issues;
    });
    assert(bad.length === 0, bad.join(", "));
  });
  await t("multi-page preview + page-count hint", async () => {
    await page.waitForTimeout(500);
    const n = await page.locator("#pagedPreview .notice-page").count();
    assert(n >= 3, "preview pages " + n);
    assert(await visible("#pageCountHint"), "hint hidden");
    assert(!(await visible("#noticeA4")), "single preview still shown");
  });
  await t("multi-page PDF has one PDF page per notice page", async () => {
    const expected = await page.locator("#pagedPreview .notice-page").count();
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.click("#btnPdf")]);
    const got = pdfPageCount(fs.readFileSync(await dl.path()));
    assert(got === expected, `pdf pages ${got}, expected ${expected}`);
  });
  await t("save as image: modal shows one PNG per page and downloads them", async () => {
    const expected = await page.locator("#pagedPreview .notice-page").count();
    await page.click("#btnImage");
    await page.waitForSelector("#imageModal:not(.hidden)", { timeout: 60000 });
    assert((await page.locator("#imagePreviewList img").count()) === expected, "img count");
    const names = [];
    const done = new Promise(res => {
      page.on("download", async function h(d) {
        const b = fs.readFileSync(await d.path());
        assert(b.slice(1, 4).toString() === "PNG", "not png");
        names.push(d.suggestedFilename());
        if (names.length === expected) { page.off("download", h); res(); }
      });
    });
    await page.click("#btnImageDownload");
    await done;
    assert(names.every((nm, i) => nm.endsWith(`_page${i + 1}.png`)), names.join(","));
    await page.click("#btnCloseImage");
    assert((await page.evaluate(() => state.imageFiles.length)) === 0, "files not released");
  });
  await t("print: one printed sheet per notice page", async () => {
    const expected = await page.locator("#pagedPreview .notice-page").count();
    await page.evaluate(() => {
      const a = document.createElement("div"); a.id = "printArea"; document.body.appendChild(a);
      buildNoticePages(collectFormData(), a);
    });
    const got = pdfPageCount(await page.pdf({ preferCSSPageSize: true }));
    await page.evaluate(() => el("printArea").remove());
    assert(got === expected, `printed ${got}, expected ${expected}`);
  });
  await t("print: short notice prints on exactly one sheet", async () => {
    await page.evaluate(() => {
      resetForm(); els.noticeContent.innerHTML = "ছোট নোটিশ"; renderPreview();
      const a = document.createElement("div"); a.id = "printArea"; document.body.appendChild(a);
      buildNoticePages(collectFormData(), a);
    });
    const got = pdfPageCount(await page.pdf({ preferCSSPageSize: true }));
    await page.evaluate(() => el("printArea").remove());
    assert(got === 1, "printed " + got);
  });
  await t("short notice: single preview shown, hint hidden", async () => {
    await page.waitForTimeout(500);
    assert(await visible("#noticeA4"), "single preview hidden");
    assert(!(await visible("#pageCountHint")), "hint visible");
  });
  await t("history Image button opens image modal", async () => {
    await page.click("#btnHistory"); await page.waitForTimeout(200);
    await page.locator('.history-item [data-act="img"]').first().click();
    await page.waitForSelector("#imageModal:not(.hidden)", { timeout: 60000 });
    assert((await page.locator("#imagePreviewList img").count()) >= 1, "no image");
    await page.click("#btnCloseImage");
    await page.evaluate(() => closeHistoryModal());
  });

  // ---- export / import / clear ----
  await t("export → clear → import round-trip", async () => {
    await page.click("#btnSettings");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportData")]);
    const json = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    assert(Array.isArray(json.notices) && json.notices.length >= 1, "export");
    await page.click("#btnClearData"); await page.click("#btnConfirmYes"); await page.waitForTimeout(200);
    assert((await page.evaluate(() => dbGetAll(STORE_NOTICES))).length === 0, "not cleared");
    await page.setInputFiles("#importFileInput", await dl.path());
    await page.waitForSelector("#confirmModal:not(.hidden)");
    await page.click("#btnConfirmYes"); await page.waitForTimeout(300);
    assert((await page.evaluate(() => dbGetAll(STORE_NOTICES))).length >= 1, "not imported");
  });
  await t("import sanitizes malicious notice HTML", async () => {
    const evil = { notices: [{ id: "evil1", noticeType: "ঘোষণা", resolvedTitle: "ঘোষণা", date: "2026-01-01",
      contentHtml: 'ok<img src=x onerror="window.__pwnImp=1"><a href="javascript:alert(1)">l</a>', updatedAt: Date.now() }] };
    await page.setInputFiles("#importFileInput", { name: "evil.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(evil)) });
    await page.waitForSelector("#confirmModal:not(.hidden)");
    await page.click("#btnConfirmYes"); await page.waitForTimeout(300);
    const rec = await page.evaluate(() => dbGet(STORE_NOTICES, "evil1"));
    assert(rec && !/onerror|javascript:/i.test(rec.contentHtml), rec && rec.contentHtml);
    await page.click("#btnCloseSettings");
    await page.click("#btnHistory"); await page.waitForTimeout(300);
    await page.locator('.history-item:has-text("ঘোষণা") [data-act="edit"]').click();
    await page.waitForTimeout(300);
    assert(!(await page.evaluate(() => window.__pwnImp)), "payload executed");
    await page.click("#btnSettings");
  });
  await t("import of invalid JSON shows error", async () => {
    await page.setInputFiles("#importFileInput", { name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{nope") });
    await page.waitForTimeout(200);
    assert((await txt("#toast")).includes("ব্যর্থ"), await txt("#toast"));
  });

  // ---- PWA ----
  await t("service worker registers + caches app shell", async () => {
    const ok = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      const c = await caches.open((await caches.keys())[0]);
      return !!reg.active && (await c.keys()).length >= 9;
    });
    assert(ok, "sw/cache");
  });
  await t("mobile tab switching", async () => {
    await page.evaluate(() => document.querySelectorAll(".modal-overlay").forEach(m => m.classList.add("hidden"))); await page.setViewportSize({ width: 390, height: 800 });
    await page.click('.tab-btn[data-tab="preview"]');
    assert(await page.$eval("#panel-preview", e => e.classList.contains("active")), "tab");
  });

  await t("no runtime errors during whole run", async () => assert(errors.length === 0, errors.join("; ")));

  await browser.close(); server.close();
  for (const r of results) console.log(r.join(" | "));
  const f = results.filter(r => r[0] === "FAIL").length;
  console.log(`\n${results.length - f} passed, ${f} failed`);
  process.exit(f ? 1 : 0);
})();
