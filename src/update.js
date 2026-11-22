/* ================= In-app updates: a pop-up when a newer HoldPoint is published ================= */
// Every time the app opens it reads this repo's GitHub releases. If a newer build exists, a panel offers
// "Update now": the APK is downloaded inside the app and handed to Android's installer, which updates
// over the old version and keeps every record.
const Updates = {
  repo: "cvlvky/HoldPoint",
  rel: null, me: null, file: "", waiting: false, snoozed: 0, checking: false, lastCheck: 0,
  async installed() {
    try { const i = await Native.App.getInfo(); return { build: parseInt(i.build, 10) || 0, version: i.version || "" }; }
    catch (e) { return null; }
  },
  async latest() {
    const r = await fetch("https://api.github.com/repos/" + this.repo + "/releases?per_page=20", { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    let best = null;
    for (const rel of await r.json()) {
      if (rel.draft || rel.prerelease) continue;
      const m = String(rel.tag_name || "").match(/^v(\d+)\.(\d+)\.(\d+)$/);
      const apk = (rel.assets || []).find((a) => /^holdpoint[\w.-]*\.apk$/i.test(a.name));
      if (!m || !apk) continue;
      const build = +m[3];
      if (!best || build > best.build) best = { build, version: m[1] + "." + m[2] + "." + m[3], notes: rel.body || "", url: apk.browser_download_url, size: apk.size || 0 };
    }
    return best;
  },
  // "What's new" lines from the release notes, without the install steps or commit trailers
  notes(body) {
    const lines = String(body || "").split(/\r?\n/);
    const out = [];
    let skip = false;
    for (let l of lines) {
      l = l.replace(/\*\*|__|`/g, "").trim();
      if (/^#+\s*install/i.test(l)) { skip = true; continue; }
      if (/^#+/.test(l)) { skip = false; continue; }
      if (skip || !l || /^(co-authored-by|claude-session|signed-off-by)\b/i.test(l)) continue;
      out.push(l.replace(/^changes:\s*/i, ""));
    }
    return out.slice(0, 8);
  },
  async check(manual) {
    if (!isApp()) { if (manual) toast("Updates are checked in the app on your phone."); return; }
    if (this.checking || (!manual && Date.now() - this.lastCheck < 30 * 60e3)) return;
    this.checking = true;
    this.lastCheck = Date.now();
    try {
      const [me, rel] = await Promise.all([this.installed(), this.latest()]);
      this.me = me;
      if (rel && me && rel.build > me.build) {
        this.rel = rel;
        // pops up every time the app opens; "Later" only quiets it for a few hours while the app stays open
        if (manual || !this.snoozed || Date.now() - this.snoozed > 4 * 3600e3) this.show();
      } else {
        this.rel = null;
        if (manual) toast("You have the latest version (" + ((me && me.version) || APP_VERSION) + ").");
      }
    } catch (e) { if (manual) toast("Couldn't check for updates. Try again later."); }
    this.checking = false;
    if (State.route === "more" && $("#sheet").hidden) refreshView();
  },
  show() {
    const rel = this.rel; if (!rel) return;
    const notes = this.notes(rel.notes);
    const mb = rel.size ? " · " + (rel.size / 1048576).toFixed(1) + " MB" : "";
    showSheet('<div class="stack upd" style="gap:12px;text-align:center">' +
      '<div class="upd-ic">' + ico("dl") + "</div>" +
      '<h3 class="card-t" style="margin:0">Update available</h3>' +
      '<p class="small muted" style="margin:0">HoldPoint <b>' + esc(rel.version) + "</b> is ready" + (this.me && this.me.version ? " (you have " + esc(this.me.version) + ")" : "") + mb + "</p>" +
      (notes.length ? '<div class="upd-notes small">' + notes.map((l) => "<div>" + esc(l) + "</div>").join("") + "</div>" : "") +
      '<div id="updProg" hidden><div class="upd-track"><div class="upd-fill" id="updBar"></div></div><p class="small muted" id="updTxt" style="margin:8px 0 0">Starting download…</p></div>' +
      '<div class="stack" id="updBtns" style="gap:8px"><button class="btn primary" data-act="updNow">' + ico("dl") + "Update now</button>" +
      '<button class="btn ghost" data-act="updLater">Later</button></div>' +
      '<p class="tiny muted" style="margin:0">Installs over the current app. Your inspections, reports and settings stay.</p></div>');
  },
  after(r) {
    const txt = $("#updTxt"), btns = $("#updBtns"), bar = $("#updBar");
    if (bar) bar.style.width = "100%";
    if (r && r.status === "permission") {
      // Android asks once: "Allow from this source". The install carries on when you come back.
      this.waiting = true;
      if (txt) txt.innerHTML = "Almost there: turn on <b>Allow from this source</b> for HoldPoint, then come back.";
      if (btns) btns.innerHTML = '<button class="btn primary" data-act="updInstall">Install now</button>';
    } else {
      this.waiting = false;
      if (txt) txt.textContent = "Tap Update on the Android screen. HoldPoint restarts with the new version.";
      if (btns) btns.innerHTML = '<button class="btn" data-act="updInstall">Show the install screen again</button>';
    }
    if (btns) btns.hidden = false;
  },
  // back from the "install unknown apps" screen: carry on with the install
  resume() {
    if (this.waiting && this.file && !$("#sheet").hidden) { this.waiting = false; setTimeout(() => ACTIONS.updInstall(), 400); }
    if (Date.now() - this.lastCheck > 30 * 60e3) this.check(false);
  },
  panel() {
    const v = (this.me && this.me.version) || APP_VERSION;
    return '<p class="small">You have HoldPoint ' + esc(v) + ". It checks for a new version every time it opens." + (this.rel ? " <b>" + esc(this.rel.version) + " is available.</b>" : "") + "</p>" +
      '<div class="row">' + (this.rel ? '<button class="btn primary" data-act="updOpen">' + ico("dl") + "Update to " + esc(this.rel.version) + "</button>" : "") +
      '<button class="btn" data-act="updCheck">' + ico("refresh") + "Check for updates</button></div>";
  }
};
ACTIONS.updCheck = () => Updates.check(true);
ACTIONS.updOpen = () => { if (Updates.rel) Updates.show(); else Updates.check(true); };
ACTIONS.updLater = () => { Updates.snoozed = Date.now(); closeSheet(); };
ACTIONS.updBrowser = () => { if (Updates.rel) openUrl(Updates.rel.url); closeSheet(); };
ACTIONS.updNow = async () => {
  const rel = Updates.rel; if (!rel) return;
  const U = window.Native && Native.Updater;
  if (!U) { openUrl(rel.url); closeSheet(); return; }
  const prog = $("#updProg"), btns = $("#updBtns"), bar = $("#updBar"), txt = $("#updTxt");
  if (prog) prog.hidden = false;
  if (btns) btns.hidden = true;
  let sub = null;
  try {
    sub = await U.addListener("updateProgress", (d) => {
      if (bar) bar.style.width = (d.pct || 0) + "%";
      if (txt) txt.textContent = "Downloading… " + (d.pct || 0) + "%";
    });
    const r = await U.downloadUpdate({ url: rel.url, name: "HoldPoint-" + rel.version + ".apk" });
    Updates.file = r && r.name;
    Updates.after(r);
  } catch (e) {
    if (txt) txt.textContent = "The download didn't finish.";
    if (btns) { btns.hidden = false; btns.innerHTML = '<button class="btn primary" data-act="updNow">Try again</button><button class="btn" data-act="updBrowser">Download in the browser</button>'; }
  }
  if (sub && sub.remove) sub.remove();
};
ACTIONS.updInstall = async () => {
  const U = window.Native && Native.Updater;
  if (!U || !Updates.file) return;
  try { Updates.after(await U.installUpdate({ name: Updates.file })); }
  catch (e) { Updates.file = ""; toast("The download is gone. Tap Update now again."); const b = $("#updBtns"); if (b) { b.hidden = false; b.innerHTML = '<button class="btn primary" data-act="updNow">Update now</button>'; } }
};
