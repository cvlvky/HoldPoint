/* ================= HoldPoint core: helpers, storage, network, router ================= */
const TZ = "Asia/Qatar";
const LSK = "holdpoint.v1";
const APP_VERSION = typeof HP_VERSION === "string" ? HP_VERSION : "dev";
const REPO_URL = "https://github.com/cvlvky/HoldPoint";
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const plain = (s) => String(s || "").replace(/\*\*/g, "");
const isNum = Calc.isNum;
const num = (s) => { if (s == null || s === "") return NaN; const x = parseFloat(String(s).replace(",", ".")); return Number.isFinite(x) ? x : NaN; };
const newId = (p) => (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const fmtN = (x, d) => (isNum(x) ? x.toLocaleString("en-GB", { maximumFractionDigits: d == null ? 2 : d }) : "–");
const f0 = (x) => fmtN(x, 0), f1 = (x) => fmtN(x, 1), f2 = (x) => fmtN(x, 2);
const plural = (n, w, ws) => n + " " + (n === 1 ? w : ws || w + "s");
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
const ext = (u, label, cls) => { const s = safeUrl(u); return s ? '<a class="' + (cls || "") + '" href="' + esc(s) + '" target="_blank" rel="noopener noreferrer">' + label + "</a>" : ""; };
const driveFile = (id) => "https://drive.google.com/file/d/" + id + "/view";
const driveFolder = (id) => "https://drive.google.com/drive/folders/" + id;
const isApp = () => !!(window.Native && window.Native.isNative);

/* ---------- time in Qatar ---------- */
function qNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long" }).formatToParts(new Date());
  const g = (t) => (parts.find((p) => p.type === t) || {}).value;
  const h = +g("hour") % 24, m = +g("minute");
  return { date: g("year") + "-" + g("month") + "-" + g("day"), min: h * 60 + m, month: +g("month"), day: +g("day"), weekday: g("weekday"), hhmm: String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") };
}
function fmtDate(iso, opts) {
  if (!iso) return "";
  const s = String(iso);
  const short = /^\d{4}-\d{2}$/.test(s);
  const d = new Date((short ? s + "-01" : s.slice(0, 10)) + "T12:00:00Z");
  if (isNaN(d)) return s;
  return d.toLocaleDateString("en-GB", Object.assign(short ? { month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" }, { timeZone: "UTC" }, opts || {}));
}
const fmtTime = (ms) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const ago = (ms) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
const hm = (h) => { if (!isNum(h)) return "–"; const t = Math.round(h * 60); return Math.floor(t / 60) + " h " + String(t % 60).padStart(2, "0"); };

/* ---------- icons ---------- */
const ICONS = {
  today: '<path d="M3 16h18v2.5H3z"/><path d="M5 16a7 7 0 0 1 14 0"/><path d="M10 9.4V7h4v2.4"/>',
  build: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="m2 12.5 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
  qcs: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2V5Z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8V5Z"/>',
  checks: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="m9 13 2 2 4-4.5"/>',
  tools: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h3.5"/>',
  news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7.5 8.5h6M7.5 12h6M7.5 15.5h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  more: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  ext: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  dl: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  ask: '<path d="M4 5h16v11H9.5L4 20.5V5Z"/><path d="M12 8v5M9.5 10.5h5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/><circle cx="12" cy="13" r="3.5"/>',
  report: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  send: '<path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4 18-7Z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  warn: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  cube: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  thermo: '<path d="M10 4a2 2 0 1 1 4 0v10a4 4 0 1 1-4 0V4Z"/><path d="M12 9v7"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  bricks: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
  earth: '<path d="M3 20h18"/><path d="M5 20c1-4 3-6 7-6s6 2 7 6"/><path d="M12 14V4"/><path d="M9.5 4h5"/>',
  rebar: '<path d="M4 20 20 4"/><path d="M8 21 21 8"/><path d="m6 15 3 3M10 11l3 3M14 7l3 3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20.5V16h-4.5"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/><path d="M12 8v4l3 2"/>',
  convert: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  layers: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="m2 13 10 5 10-5"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/><path d="M7 17h.01M17 17h.01"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14.5h18M9 9v11"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>'
};
const ico = (n) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || "") + "</svg>";

/* ---------- small key/value store on the phone ---------- */
const Local = {
  get(k, d) { try { const v = localStorage.getItem("hp." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("hp." + k, JSON.stringify(v)); } catch (e) { /* storage full */ } }
};

/* ---------- records: kept on the phone, mirrored to a file in app storage ---------- */
const DEF_PREFS = { name: "", project: "", theme: "auto", stageStatus: {}, starred: [], updatedAt: 0 };
const DATA_FILE = "holdpoint-data.json";
const Store = {
  recs: {}, prefs: clone(DEF_PREFS), _ft: null,
  load() {
    try {
      const raw = localStorage.getItem(LSK);
      if (!raw) return;
      const o = JSON.parse(raw);
      this.recs = o.recs || {};
      this.prefs = Object.assign(clone(DEF_PREFS), o.prefs || {});
    } catch (e) { /* ignore a corrupt cache */ }
  },
  saveLocal() {
    try { localStorage.setItem(LSK, JSON.stringify({ recs: this.recs, prefs: this.prefs })); } catch (e) { toast("Phone storage is full. Back up and delete old records."); }
    this.mirror();
  },
  mirror() {
    if (!isApp()) return;
    clearTimeout(this._ft);
    this._ft = setTimeout(() => {
      Native.Filesystem.writeFile({ path: DATA_FILE, data: JSON.stringify({ app: "HoldPoint", at: Date.now(), recs: this.recs, prefs: this.prefs }), directory: Native.Directory.Data, encoding: Native.Encoding.UTF8 }).catch(() => {});
    }, 1200);
  },
  async restoreFromFile() {
    if (!isApp() || Object.keys(this.recs).length) return false;
    try {
      const r = await Native.Filesystem.readFile({ path: DATA_FILE, directory: Native.Directory.Data, encoding: Native.Encoding.UTF8 });
      const o = JSON.parse(r.data);
      if (o && o.recs && Object.keys(o.recs).length) {
        this.recs = o.recs;
        this.prefs = Object.assign(clone(DEF_PREFS), o.prefs || {});
        this.saveLocal();
        return true;
      }
    } catch (e) { /* no file yet */ }
    return false;
  },
  list(kind) { return Object.values(this.recs).filter((r) => r && r.kind === kind); },
  get(id) { return this.recs[id]; },
  put(rec) { rec.updatedAt = Date.now(); this.recs[rec.id] = rec; this.saveLocal(); },
  touch() { this.saveLocal(); },
  del(id) { delete this.recs[id]; this.saveLocal(); },
  pref(k, v) { this.prefs[k] = v; this.prefs.updatedAt = Date.now(); this.saveLocal(); }
};

/* ---------- network (native HTTP in the app, fetch in a browser) ---------- */
const UA = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 HoldPoint/1.0";
const Net = {
  async get(url, type) {
    const accept = type === "json" ? "application/json" : "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8";
    if (isApp()) {
      const r = await Native.Http.get({ url, headers: { "User-Agent": UA, Accept: accept }, responseType: type === "json" ? "json" : "text", connectTimeout: 15000, readTimeout: 20000 });
      if (r.status < 200 || r.status >= 300) throw new Error("HTTP " + r.status);
      let d = r.data;
      if (type === "json" && typeof d === "string") d = JSON.parse(d);
      if (type !== "json" && typeof d !== "string") d = d == null ? "" : typeof d === "object" ? JSON.stringify(d) : String(d);
      return d;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { Accept: accept } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return type === "json" ? r.json() : r.text();
    } finally { clearTimeout(t); }
  },
  async postJSON(url, body, headers) {
    if (isApp()) {
      const r = await Native.Http.post({ url, headers: Object.assign({ "Content-Type": "application/json" }, headers || {}), data: body, responseType: "json", connectTimeout: 20000, readTimeout: 180000 });
      let d = r.data;
      if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { /* keep text */ } }
      return { status: r.status, data: d };
    }
    const r = await fetch(url, { method: "POST", headers: Object.assign({ "content-type": "application/json" }, headers || {}), body: JSON.stringify(body) });
    let d = null;
    try { d = await r.json(); } catch (e) { /* no body */ }
    return { status: r.status, data: d };
  }
};

/* ---------- app state ---------- */
const State = { route: "today", arg: "", newsBusy: false, wxBusy: false };

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}
function showSheet(html, onMount) {
  $("#sheetBody").innerHTML = '<div class="row" style="justify-content:flex-end;margin-bottom:6px"><button class="btn sm ghost" data-act="closeSheet">Close</button></div>' + html;
  $("#sheet").hidden = false;
  if (onMount) onMount();
}
function closeSheet() { $("#sheet").hidden = true; $("#sheetBody").innerHTML = ""; }
function confirmSheet(text, okLabel, onOk) {
  showSheet('<div class="stack"><h3 class="card-t">' + esc(text) + '</h3><div class="row"><button class="btn danger" id="cfOk">' + esc(okLabel) + '</button><button class="btn" data-act="closeSheet">Cancel</button></div></div>', () => {
    $("#cfOk").addEventListener("click", () => { closeSheet(); onOk(); });
  });
}
function copyFallback(text) {
  showSheet('<div class="stack"><h3 class="card-t">Copy this text</h3><textarea class="in" rows="12" readonly id="copyArea">' + esc(text) + '</textarea><p class="small muted">Press and hold, then Select all and Copy.</p></div>', () => { const ta = $("#copyArea"); ta.focus(); ta.select(); });
}
function copyText(text) {
  if (isApp()) { Native.Clipboard.write({ string: text }).then(() => toast("Copied."), () => copyFallback(text)); return; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast("Copied."), () => copyFallback(text));
    else copyFallback(text);
  } catch (e) { copyFallback(text); }
}
async function shareText(text, title) {
  if (isApp()) {
    try { await Native.Share.share({ title: title || "HoldPoint", text, dialogTitle: "Send with" }); }
    catch (e) { if (!/cancel/i.test(String(e && (e.message || e)))) copyText(text); }
    return;
  }
  copyText(text);
}
async function shareFile(filename, data) {
  if (isApp()) {
    try {
      const r = await Native.Filesystem.writeFile({ path: filename, data, directory: Native.Directory.Cache, encoding: Native.Encoding.UTF8 });
      await Native.Share.share({ title: filename, files: [r.uri], dialogTitle: "Save or send " + filename });
      return true;
    } catch (e) {
      if (/cancel/i.test(String(e && (e.message || e)))) return false;
      toast("Couldn't share the file.");
      return false;
    }
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/octet-stream" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  } catch (e) { toast("Couldn't save the file."); return false; }
}
function openUrl(url) {
  const u = safeUrl(url);
  if (!u) return;
  if (isApp()) Native.Browser.open({ url: u, toolbarColor: "#15191E" }).catch(() => toast("Couldn't open the link."));
  else window.open(u, "_blank", "noopener");
}
const tagFor = { H: "Hold", W: "Witness", S: "Surveillance", R: "Record review" };
const hw = (t) => '<span class="hw ' + (t || "x") + '" title="' + esc(tagFor[t] || "Check") + '">' + (t || "·") + "</span>";
const refChip = (r) => (r ? '<span class="ref">' + esc(r) + "</span>" : "");
function reasons(items) {
  return '<ul class="reasons">' + items.map(([sev, msg, ref]) => '<li class="' + sev + '"><span class="dot"></span><span>' + msg + (ref ? " " + refChip(ref) : "") + "</span></li>").join("") + "</ul>";
}
function need(msg) { return '<div class="result"><p class="muted small">' + esc(msg) + "</p></div>"; }
function star(on, act, key) {
  return '<button class="btn sm ghost" data-act="' + act + '" data-key="' + esc(key) + '" aria-pressed="' + (on ? "true" : "false") + '" style="' + (on ? "color:var(--warn)" : "") + '">' + ico("star") + (on ? "Saved" : "Save") + "</button>";
}

/* ---------- theme ---------- */
function applyTheme() {
  const t = Store.prefs.theme || "auto";
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  if (isApp() && Native.SystemBars) {
    const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    try {
      Native.SystemBars.setStyle({ style: Native.SystemBarsStyle.Dark, bar: Native.SystemBarType.StatusBar }).catch(() => {});
      Native.SystemBars.setStyle({ style: dark ? Native.SystemBarsStyle.Dark : Native.SystemBarsStyle.Light, bar: Native.SystemBarType.NavigationBar }).catch(() => {});
    } catch (e) { /* older runtime */ }
  }
}

/* ---------- router ---------- */
const VIEWS = {};
const ACTIONS = {};
function parseHash() {
  let h = "";
  try { h = decodeURIComponent((location.hash || "").slice(1)); } catch (e) { h = ""; }
  h = h || "today";
  const i = h.indexOf("-");
  return i < 0 ? [h, ""] : [h.slice(0, i), h.slice(i + 1)];
}
function go(h) { if (location.hash === "#" + h) route(); else location.hash = h; }
function backTarget() {
  const v = VIEWS[State.route];
  if (v && v.back) return typeof v.back === "function" ? v.back(State.arg) : v.back;
  return State.route === "today" ? "" : "today";
}
function route(keep) {
  let [name, arg] = parseHash();
  let v = VIEWS[name];
  if (!v) { name = "today"; arg = ""; v = VIEWS.today; }
  const same = State.route === name && State.arg === arg;
  if (v.redirect) { const to = v.redirect(arg); if (to) { history.replaceState(null, "", "#" + to); return route(); } }
  State.route = name; State.arg = arg;
  const y = window.scrollY;
  let html;
  try { html = v.render(arg); } catch (e) { console.error(e); html = '<div class="empty">This page could not be shown. <a href="#today">Go to Today</a></div>'; }
  $("#main").innerHTML = html;
  try { if (v.mount) v.mount(arg); } catch (e) { console.error(e); }
  $$("nav.tabs a").forEach((a) => a.setAttribute("aria-current", a.dataset.tab === v.tab ? "page" : "false"));
  const back = $("#backBtn");
  back.hidden = !v.back;
  back.dataset.to = v.back ? (typeof v.back === "function" ? v.back(arg) : v.back) : "";
  updateFab();
  window.scrollTo(0, keep && same ? y : 0);
}
function refreshView() {
  const ae = document.activeElement;
  if (ae && $("#main").contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
  if (!$("#sheet").hidden) return;
  route(true);
}
const FAB_ON = ["today", "build", "stage", "qcs", "rule", "checks", "tools", "news", "glossary", "tables"];
function updateFab() { const fab = $("#fab"); if (fab) fab.hidden = !(AI.ready() && FAB_ON.includes(State.route)); }
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (a && /^https?:/i.test(a.getAttribute("href") || "")) { e.preventDefault(); openUrl(a.getAttribute("href")); return; }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
ACTIONS.closeSheet = () => closeSheet();
ACTIONS.back = (el) => go(el.dataset.to || "today");
ACTIONS.go = (el) => go(el.dataset.to);
ACTIONS.copy = (el) => { const src = $("#" + el.dataset.src); if (src) copyText(src.dataset.text || src.innerText); };
ACTIONS.shareText = (el) => { const src = $("#" + el.dataset.src); if (src) shareText(src.dataset.text || src.innerText); };

/* ---------- reminders (local notifications) ---------- */
const Reminders = {
  list() { return Local.get("reminders", []).filter((r) => r.at > Date.now() - 3600000).sort((a, b) => a.at - b.at); },
  async add(items) {
    const future = items.filter((x) => x.at > Date.now() + 60000);
    if (!future.length) { toast("Those dates have already passed."); return 0; }
    if (!isApp()) { toast("Reminders work in the Android app."); return 0; }
    try {
      let p = await Native.LocalNotifications.checkPermissions();
      if (p.display !== "granted") p = await Native.LocalNotifications.requestPermissions();
      if (p.display !== "granted") { toast("Allow notifications for HoldPoint in Android settings to get reminders."); return 0; }
      let next = Local.get("remId", 1000);
      const saved = Local.get("reminders", []);
      const notifications = future.map((x) => {
        next += 1;
        saved.push({ id: next, at: x.at, title: x.title, body: x.body });
        return { id: next, title: x.title, body: x.body, schedule: { at: new Date(x.at), allowWhileIdle: true }, smallIcon: "ic_stat_holdpoint", iconColor: "#FFC20E" };
      });
      await Native.LocalNotifications.schedule({ notifications });
      Local.set("remId", next);
      Local.set("reminders", saved);
      toast(plural(notifications.length, "reminder") + " set.");
      return notifications.length;
    } catch (e) { toast("Couldn't set the reminder."); return 0; }
  },
  async cancel(id) {
    const all = Local.get("reminders", []);
    Local.set("reminders", all.filter((r) => r.id !== id));
    if (isApp()) { try { await Native.LocalNotifications.cancel({ notifications: [{ id }] }); } catch (e) { /* already gone */ } }
  }
};
function at0700(iso) { const d = new Date(iso + "T07:00:00+03:00"); return d.getTime(); }

/* ---------- AI assistant (Anthropic API, your own key) ---------- */
const AI_MODELS = [["claude-haiku-5-5", "Claude Haiku 5.5 (fastest, lowest cost)"], ["claude-sonnet-5-5", "Claude Sonnet 5.5 (balanced)"], ["claude-opus-5-5", "Claude Opus 5.5 (most capable)"]];
const AI = {
  key() { return Local.get("ai.key", ""); },
  model() { return Local.get("ai.model", "claude-sonnet-5-5"); },
  ready() { return !!this.key(); },
  async call(system, messages, maxTokens) {
    let r;
    try {
      r = await Net.postJSON("https://api.anthropic.com/v1/messages", { model: this.model(), max_tokens: maxTokens || 1200, system, messages }, { "x-api-key": this.key(), "anthropic-version": "2023-06-01" });
    } catch (e) { throw { code: "net", message: String(e && (e.message || e)) }; }
    if (r.status !== 200) {
      const m = r.data && r.data.error && r.data.error.message;
      throw { code: r.status === 401 || r.status === 403 ? "auth" : r.status === 429 ? "rate" : r.status >= 500 ? "busy" : r.status === 400 || r.status === 404 ? "bad" : "http", message: m || "HTTP " + r.status };
    }
    const text = ((r.data && r.data.content) || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
    if (!text) throw { code: "empty", message: "No answer" };
    return { text, cut: r.data.stop_reason === "max_tokens" };
  },
  msg(e) {
    return ({
      auth: "The API key was refused. Check it under More → AI assistant.",
      rate: "Too many requests, or your API usage limit was reached. Try again shortly.",
      busy: "The AI service is busy. Try again in a minute.",
      bad: "The request was refused: " + ((e && e.message) || ""),
      empty: "No answer came back. Try asking more simply.",
      net: "No internet connection, or the AI service can't be reached."
    })[e && e.code] || "Something went wrong. " + ((e && e.message) || "");
  }
};

/* ---------- live weather (Open-Meteo, no key needed) ---------- */
const PLACES = [["doha", "Doha", 25.2854, 51.531], ["lusail", "Lusail", 25.42, 51.49], ["wakrah", "Al Wakrah", 25.1659, 51.5976], ["rayyan", "Al Rayyan", 25.2919, 51.4244],
  ["ummsalal", "Umm Salal", 25.415, 51.407], ["khor", "Al Khor", 25.6839, 51.5058], ["raslaffan", "Ras Laffan", 25.9, 51.55], ["mesaieed", "Mesaieed", 24.9909, 51.5493],
  ["dukhan", "Dukhan", 25.4248, 50.782], ["shahaniya", "Al Shahaniya", 25.37, 51.22], ["shamal", "Al Shamal", 26.1293, 51.2009]];
const Weather = {
  place() { const id = Local.get("place", "doha"); return PLACES.find((p) => p[0] === id) || PLACES[0]; },
  cached() { const c = Local.get("wx", null); return c && c.place === this.place()[0] ? c : null; },
  async refresh(force) {
    const c = this.cached();
    if (!force && c && Date.now() - c.at < 20 * 60000) return c;
    const p = this.place();
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + p[2] + "&longitude=" + p[3] +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min&past_days=3&forecast_days=2&timezone=Asia%2FQatar";
    const d = await Net.get(url, "json");
    if (!d || !d.current) throw new Error("No weather data");
    const wx = { at: Date.now(), place: p[0], cur: d.current, hourly: d.hourly, daily: d.daily };
    Local.set("wx", wx);
    return wx;
  },
  /* Australian Bureau of Meteorology approximation of WBGT in the shade: indicative only */
  wbgt(t, rh) { if (!isNum(t) || !isNum(rh)) return NaN; const e = (rh / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t)); return 0.567 * t + 0.393 * e + 3.94; },
  hotPeriod(wx) {
    const d = wx && wx.daily;
    if (!d || !Array.isArray(d.time)) return null;
    const today = qNow().date;
    const past = d.time.map((t, i) => [t, d.temperature_2m_max[i]]).filter(([t]) => t < today).slice(-3);
    if (past.length < 3) return null;
    return { on: past.every(([, m]) => m > 35), days: past };
  },
  next(wx, hours) {
    const h = wx && wx.hourly;
    if (!h || !Array.isArray(h.time)) return [];
    const now = qNow();
    const key = now.date + "T" + String(Math.floor(now.min / 60)).padStart(2, "0") + ":00";
    const i0 = Math.max(0, h.time.indexOf(key));
    const out = [];
    for (let i = i0; i < Math.min(h.time.length, i0 + hours); i++) out.push({ t: h.time[i].slice(11, 16), temp: h.temperature_2m[i], rh: h.relative_humidity_2m[i], wind: h.wind_speed_10m[i] });
    return out;
  }
};

/* ---------- global search ---------- */
let SEARCH_INDEX = null;
function buildIndex() {
  const ix = [];
  RULES.forEach((r) => ix.push({ k: "QCS", t: r.title, s: r.ref, x: (r.title + " " + r.tags + " " + r.topic + " " + r.pts.join(" ")).toLowerCase(), h: "rule-" + r.id }));
  STAGES.forEach((s) => ix.push({ k: "Stage", t: s.no + " " + s.title, s: s.phase, x: (s.title + " " + s.why + " " + s.steps.join(" ") + " " + s.holds.map((h) => h[1]).join(" ")).toLowerCase(), h: "stage-" + s.id }));
  CHECKLISTS.forEach((c) => ix.push({ k: "Checklist", t: c.title, s: "Start a new inspection", x: (c.title + " " + c.items.map((i) => i[1]).join(" ")).toLowerCase(), h: "new-" + c.id }));
  TOOLS.forEach((t) => ix.push({ k: "Tool", t: t.t, s: t.d, x: (t.t + " " + t.d + " " + (t.kw || "")).toLowerCase(), h: "tool-" + t.id }));
  GLOSSARY.forEach((g) => ix.push({ k: "Term", t: g[0], s: g[1], x: (g[0] + " " + g[1]).toLowerCase(), h: "glossary" }));
  HISTORY.forEach((h) => ix.push({ k: "History", t: h.y + " · " + h.t, s: h.l, x: (h.t + " " + h.w + " " + h.l).toLowerCase(), h: "history" }));
  return ix;
}
function searchAll(q) {
  if (!SEARCH_INDEX) SEARCH_INDEX = buildIndex();
  const toks = q.toLowerCase().split(/[^a-z0-9°%.]+/).filter((t) => t.length > 1);
  if (!toks.length) return [];
  const res = [];
  for (const e of SEARCH_INDEX) {
    let sc = 0, all = true;
    const tl = e.t.toLowerCase();
    for (const t of toks) {
      if (tl.includes(t)) sc += 4;
      else if (e.x.includes(t)) sc += 1;
      else { all = false; break; }
    }
    if (all) res.push([sc, e]);
  }
  News.all().forEach((n) => {
    const x = (n.t + " " + n.s).toLowerCase();
    if (toks.every((t) => x.includes(t))) res.push([1, { k: "News", t: n.t, s: n.src + " · " + fmtDate(n.d), u: n.u }]);
  });
  return res.sort((a, b) => b[0] - a[0]).slice(0, 40).map((r) => r[1]);
}
ACTIONS.search = () => {
  showSheet('<div class="stack"><label class="f">Search rules, stages, checklists, tools, terms and news<input class="in" id="q" type="search" placeholder="e.g. curing, striking, FDT, cover X4" autocomplete="off"></label><div id="qres" class="list"></div></div>', () => {
    const q = $("#q");
    const run = () => {
      const v = q.value.trim();
      const r = v.length < 2 ? [] : searchAll(v);
      $("#qres").innerHTML = v.length < 2
        ? '<p class="muted small">Try: <b>curing days</b>, <b>slump</b>, <b>backfill layers</b>, <b>cover X5</b>, <b>WBGT</b>.</p>'
        : r.length ? r.map((e) => e.u
          ? '<a class="item" href="' + esc(safeUrl(e.u)) + '"><div class="meta"><span class="tag neutral">' + esc(e.k) + '</span></div><div class="t">' + esc(e.t) + '</div><div class="small muted">' + esc(e.s) + "</div></a>"
          : '<a class="item" href="#' + esc(e.h) + '" data-act="closeAndGo" data-to="' + esc(e.h) + '"><div class="meta"><span class="tag ' + (e.k === "QCS" ? "" : "neutral") + '">' + esc(e.k) + '</span></div><div class="t">' + esc(e.t) + '</div><div class="small muted">' + esc(plain(e.s)).slice(0, 140) + "</div></a>").join("")
          : '<div class="empty">Nothing found. Try a shorter word.</div>';
    };
    q.addEventListener("input", run);
    run();
    setTimeout(() => q.focus(), 60);
  });
};
ACTIONS.closeAndGo = (el) => { closeSheet(); go(el.dataset.to); };
