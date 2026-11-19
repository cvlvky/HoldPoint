/* ================= News: live feeds, must-know history, sources ================= */
const CAT = { qatar: ["Qatar", "ok"], structural: ["Structural", ""], civil: ["Civil", ""], arch: ["Architecture", "neutral"], tech: ["Tech and materials", ""], failure: ["Failure", "bad"], awards: ["Awards", "warn"], safety: ["Safety", "warn"] };
const catTag = (n) => { const c = CAT[n.cat] || ["News", "neutral"]; return '<span class="tag ' + c[1] + '">' + esc(c[0]) + "</span>" + (n.q && n.cat !== "qatar" ? '<span class="tag ok">Qatar</span>' : ""); };
const gnews = (q) => "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=en-US&gl=US&ceid=US:en";
const FEEDS = [
  { id: "qa-build", name: "Qatar construction (Google News)", url: gnews('Ashghal OR Kahramaa OR "Qatar construction" OR "Doha project" when:7d'), cat: "qatar", q: 1 },
  { id: "qa-awards", name: "Qatar contracts and tenders (Google News)", url: gnews("Qatar (contract OR tender OR awarded) (infrastructure OR substation OR road OR building OR construction) when:14d"), cat: "qatar", q: 1 },
  { id: "qa-rules", name: "Qatar rules and safety (Google News)", url: gnews('Qatar ("Ministry of Labour" OR "Civil Defence" OR "Ministry of Municipality" OR "Qatar Standards") (construction OR workers OR building) when:14d'), cat: "qatar", q: 1 },
  { id: "gcc", name: "GCC projects (Google News)", url: gnews('(Saudi OR UAE OR Dubai OR "Abu Dhabi" OR Oman OR Kuwait OR Bahrain) construction (project OR contract OR tower) when:7d'), cat: "civil" },
  { id: "struct", name: "Structural engineering (Google News)", url: gnews('"structural engineering" OR "structural engineer" OR skyscraper OR "tallest building" when:7d'), cat: "structural" },
  { id: "bridges", name: "Bridges, tunnels and dams (Google News)", url: gnews("(bridge OR tunnel OR dam) (construction OR engineering OR opens OR breakthrough) when:7d"), cat: "civil" },
  { id: "fail", name: "Failures and investigations (Google News)", url: gnews('"building collapse" OR "bridge collapse" OR "structural failure" OR "crane collapse" OR "scaffolding collapse" when:14d'), cat: "failure" },
  { id: "tech", name: "Materials and construction tech (Google News)", url: gnews('"low-carbon concrete" OR "low carbon cement" OR "3D printed building" OR "construction robot" OR "digital twin" construction when:14d'), cat: "tech" },
  { id: "safety", name: "Site safety (Google News)", url: gnews('"construction site" (safety OR accident OR "heat stress") when:7d'), cat: "safety" },
  { id: "arch", name: "Architecture (Google News)", url: gnews("architecture (award OR prize OR opens OR unveiled OR completed) building when:7d"), cat: "arch" },
  { id: "dezeen", name: "Dezeen", url: "https://www.dezeen.com/architecture/feed/", cat: "arch", filter: true },
  { id: "designboom", name: "designboom", url: "https://www.designboom.com/architecture/feed/", cat: "arch", filter: true },
  { id: "archdaily", name: "ArchDaily", url: "https://feeds.feedburner.com/Archdaily", cat: "arch", filter: true },
  { id: "cdive", name: "Construction Dive", url: "https://www.constructiondive.com/feeds/news/", cat: "civil" },
  { id: "gcr", name: "Global Construction Review", url: "https://www.globalconstructionreview.com/feed/", cat: "civil" },
  { id: "nce", name: "New Civil Engineer", url: "https://www.newcivilengineer.com/feed/", cat: "civil" }
];
const RX = {
  qatar: /\b(qatar|qatari|doha|lusail|ashghal|kahramaa|al wakrah|ras laffan|mesaieed|dukhan|al khor|al rayyan)\b/i,
  failure: /\b(collaps\w*|structural failure|cave-in|sinkhole|partial collapse|girders? fell|deck failure)\b/i,
  safety: /\b(heat stress|workers? (killed|died|injured|safety)|site safety|fatalit(y|ies)|construction accident|wbgt|fall from height|osha)\b/i,
  awards: /\b(award|prize|wins|winner|honou?red)\b/i,
  build: /\b(architect\w*|building|tower|house|housing|museum|pavilion|bridge|stadium|school|hospital|airport|station|campus|office|library|renovat\w*|timber|concrete|steel|masterplan|skyscraper|hotel|mosque|theatre|centre|center|headquarters|residence|apartment|villa)\b/i
};
const htmlText = (s) => { try { return new DOMParser().parseFromString("<!doctype html><body>" + s, "text/html").body.textContent.replace(/\s+/g, " ").trim(); } catch (e) { return String(s || ""); } };
function isoInQatar(ms) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(ms));
  const g = (t) => (parts.find((p) => p.type === t) || {}).value;
  return g("year") + "-" + g("month") + "-" + g("day");
}
function parseFeed(xml, feed) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("not a feed");
  let nodes = Array.from(doc.getElementsByTagName("item"));
  if (!nodes.length) nodes = Array.from(doc.getElementsByTagName("entry"));
  const google = /news\.google\.com/.test(feed.url);
  const out = [];
  nodes.slice(0, 40).forEach((el) => {
    const txt = (tag) => { const n = el.getElementsByTagName(tag)[0]; return n ? (n.textContent || "").trim() : ""; };
    let title = htmlText(txt("title"));
    let link = txt("link");
    if (!link) { const l = el.getElementsByTagName("link")[0]; if (l) link = l.getAttribute("href") || ""; }
    if (!title || !safeUrl(link)) return;
    const srcEl = el.getElementsByTagName("source")[0];
    const src = srcEl && srcEl.textContent ? srcEl.textContent.trim() : feed.name.replace(/ \(Google News\)$/, "");
    if (google && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3)).trim();
    const ts = Date.parse(txt("pubDate") || txt("published") || txt("updated")) || Date.now();
    const desc = google ? "" : htmlText(txt("description") || txt("summary") || txt("content")).slice(0, 320);
    const text = title + " " + desc;
    if (feed.filter && !RX.build.test(text)) return;
    let cat = feed.cat;
    if (cat !== "arch" && RX.failure.test(text)) cat = "failure";
    else if (cat !== "arch" && RX.safety.test(text)) cat = "safety";
    else if ((cat === "arch" || cat === "structural") && RX.awards.test(title)) cat = "awards";
    const q = RX.qatar.test(text) ? 1 : 0;
    if (cat === "qatar" && !q) cat = "civil";
    out.push({ t: title.slice(0, 220), u: link, src: src.slice(0, 60), ts, d: isoInQatar(ts), s: desc, cat, q, live: 1 });
  });
  return out;
}
const titleKey = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 90);
const urlKey = (u) => String(u || "").toLowerCase().replace(/[#?].*$/, "").replace(/\/+$/, "");
function dedupe(list) {
  const seenU = new Set(), seenT = new Set(), out = [];
  list.forEach((n) => {
    const a = urlKey(n.u), b = titleKey(n.t);
    if (seenU.has(a) || seenT.has(b)) return;
    seenU.add(a); seenT.add(b); out.push(n);
  });
  return out;
}
const News = {
  _all: null,
  live() { return Local.get("news.live", { at: 0, items: [], status: {} }); },
  saved() { return Local.get("news.saved", []); },
  all() { if (!this._all) this._all = this.build(); return this._all; },
  build() {
    const seed = NEWS_SEED.map((n) => Object.assign({ ts: Date.parse((n.d.length === 7 ? n.d + "-15" : n.d) + "T12:00:00+03:00") }, n));
    return dedupe((this.live().items || []).concat(seed)).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  },
  stale() { return Date.now() - (this.live().at || 0) > 2 * 3600000; },
  autoRefresh() { if (this.stale() && !State.newsBusy && navigator.onLine !== false) this.refresh(); },
  async refresh() {
    if (State.newsBusy) return 0;
    State.newsBusy = true;
    if (State.route === "news") route(true);
    const prev = this.live();
    const status = {}, got = [];
    const queue = FEEDS.slice();
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        try {
          const items = parseFeed(await Net.get(f.url, "text"), f);
          got.push(...items);
          status[f.id] = { ok: 1, n: items.length, at: Date.now() };
        } catch (e) { status[f.id] = { ok: 0, err: String((e && e.message) || e).slice(0, 80), at: Date.now() }; }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    const ok = Object.values(status).filter((s) => s.ok).length;
    if (ok) {
      const cutoff = Date.now() - 45 * 86400000;
      const merged = dedupe(got.sort((a, b) => b.ts - a.ts).concat(prev.items || [])).filter((n) => (n.ts || 0) > cutoff).slice(0, 300);
      Local.set("news.live", { at: Date.now(), items: merged, status });
    } else Local.set("news.live", Object.assign({}, prev, { status }));
    this._all = null;
    State.newsBusy = false;
    if (["news", "today", "sources"].includes(State.route)) refreshView();
    return ok;
  },
  edition() { const a = this.live().at; return a ? "Updated " + fmtDate(isoInQatar(a)) + " " + fmtTime(a) : "Built-in edition " + fmtDate(NEWS_EDITION); }
};
const NEWS_CHIPS = [["all", "All"], ["qatar", "Qatar"], ["structural", "Structural"], ["civil", "Civil"], ["arch", "Architecture"], ["tech", "Tech"], ["failure", "Failures"], ["safety", "Safety"], ["awards", "Awards"], ["saved", "Saved"]];
function newsCard(n) {
  const saved = News.saved().some((x) => x.u === n.u);
  const up = n.d && n.d.length === 10 && n.d > qNow().date;
  return '<article class="news"><div class="meta row" style="gap:6px">' + catTag(n) + (up ? '<span class="tag warn">Upcoming</span>' : "") + '<span class="tiny muted">' + esc(fmtDate(n.d)) + " · " + esc(n.src) + "</span></div>" +
    '<h3 class="t"><a class="plainlink" href="' + esc(safeUrl(n.u)) + '">' + esc(n.t) + "</a></h3>" + (n.s ? '<p class="small">' + esc(n.s) + "</p>" : "") +
    (n.l ? '<p class="lesson small"><b>Site lesson:</b> ' + esc(n.l) + "</p>" : "") +
    '<div class="row" style="justify-content:space-between"><a class="btn sm ghost" href="' + esc(safeUrl(n.u)) + '">' + ico("ext") + "Read</a>" +
    '<span class="row" style="gap:6px"><button class="btn sm ghost" data-act="shareNews" data-key="' + esc(n.u) + '" aria-label="Share">' + ico("share") + "</button>" + star(saved, "saveNews", n.u) + "</span></div></article>";
}
function newsSeg(mode) {
  return '<div class="seg wide" role="group" aria-label="News sections">' + [["news", "Latest"], ["history", "Must-know history"], ["sources", "Sources"]].map(([h, l]) => '<a href="#' + h + '" aria-pressed="' + (h === mode) + '">' + l + "</a>").join("") + "</div>";
}
const findNews = (u) => News.all().find((n) => n.u === u) || News.saved().find((n) => n.u === u);
VIEWS.news = {
  tab: "news", title: "News",
  render() {
    const f = State.newsCat || "all";
    const all = f === "saved" ? News.saved() : News.all();
    const items = all.filter((n) => f === "all" || f === "saved" || (f === "qatar" ? n.q || n.cat === "qatar" : n.cat === f));
    const lim = State.newsLimit || 40;
    const live = News.live();
    return '<div class="stack"><div><div class="eyebrow">' + esc(State.newsBusy ? "Fetching the latest stories…" : News.edition()) + '</div><h2 class="sec" style="margin-top:6px">News engineers need</h2></div>' +
      newsSeg("news") +
      '<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span class="small muted">' + (live.at ? plural((live.items || []).length, "live story", "live stories") + " from " + FEEDS.length + " feeds, plus curated picks with site lessons." : "Curated picks below. Tap Refresh to pull live stories.") + "</span>" +
        '<button class="btn sm" data-act="newsRefresh"' + (State.newsBusy ? " disabled" : "") + ">" + ico("refresh") + (State.newsBusy ? "Updating" : "Refresh") + "</button></div>" +
      (AI.ready() ? '<button class="btn" data-act="newsBrief">' + ico("ask") + "AI briefing: what this week means on site</button>" : "") +
      '<div id="brief"></div>' +
      '<div class="chips" role="group" aria-label="Category">' + NEWS_CHIPS.map(([k, l]) => '<button class="chip" data-act="newsCat" data-v="' + k + '" aria-pressed="' + (k === f) + '">' + l + "</button>").join("") + "</div>" +
      (items.length ? '<div class="list">' + items.slice(0, lim).map(newsCard).join("") + "</div>" + (items.length > lim ? '<button class="btn" data-act="newsMore">Show more (' + (items.length - lim) + ")</button>" : "")
        : '<div class="empty">' + (f === "saved" ? "Nothing saved yet. Tap Save on a story to keep it here." : "No stories in this category yet. Tap Refresh.") + "</div>") +
      '<p class="small muted">Headlines link to the original publishers. Curated picks carry a site lesson written for HoldPoint.</p></div>';
  },
  mount() { News.autoRefresh(); }
};
ACTIONS.newsCat = (el) => { State.newsCat = el.dataset.v; State.newsLimit = 40; route(true); };
ACTIONS.newsMore = () => { State.newsLimit = (State.newsLimit || 40) + 40; route(true); };
ACTIONS.newsRefresh = async () => {
  const ok = await News.refresh();
  toast(ok ? "News updated from " + plural(ok, "feed") + "." : "Couldn't reach the news feeds. Check the connection.");
};
ACTIONS.saveNews = (el) => {
  const k = el.dataset.key;
  const a = News.saved();
  const i = a.findIndex((x) => x.u === k);
  if (i >= 0) a.splice(i, 1);
  else { const n = findNews(k); if (n) a.unshift(n); }
  Local.set("news.saved", a.slice(0, 200));
  route(true);
};
ACTIONS.shareNews = (el) => { const n = findNews(el.dataset.key); if (n) shareText(n.t + "\n" + n.u, n.t); };
ACTIONS.newsBrief = async (el) => {
  const box = $("#brief");
  const items = News.all().slice(0, 30).map((n) => "- [" + (CAT[n.cat] || ["News"])[0] + (n.q ? ", Qatar" : "") + "] " + n.t + " (" + n.src + ", " + n.d + ")").join("\n");
  el.disabled = true;
  box.innerHTML = '<div class="msg ai think">Reading the headlines…</div>';
  try {
    const r = await AI.call("You brief civil and structural site engineers working in Qatar to QCS 2024. Be factual and neutral; use only the headlines given; never invent details.",
      [{ role: "user", content: "From these recent headlines, write a short briefing: 5 to 7 bullets, each one line, saying what happened and why it matters on site (safety, quality, contracts, materials or rules). Put Qatar and GCC items first. Plain text with '- ' bullets.\n\n" + items }], 700);
    box.innerHTML = '<section class="card">' + fmtAnswer(r.text) + "</section>";
  } catch (e) { box.innerHTML = '<div class="empty">' + esc(AI.msg(e)) + "</div>"; }
  el.disabled = false;
};
VIEWS.history = {
  tab: "news", title: "Must-know history",
  render() {
    const k = State.histK || "all";
    const list = HISTORY.filter((h) => k === "all" || h.k === k);
    return '<div class="stack"><div><div class="eyebrow">' + HISTORY.length + ' landmarks, failures and breakthroughs</div><h2 class="sec" style="margin-top:6px">Must-know history</h2></div>' +
      newsSeg("history") +
      '<div class="chips" role="group" aria-label="Kind">' + [["all", "All"], ["landmark", "Landmarks"], ["failure", "Failures"], ["material", "Materials and methods"]].map(([v, l]) => '<button class="chip" data-act="histK" data-v="' + v + '" aria-pressed="' + (v === k) + '">' + l + "</button>").join("") + "</div>" +
      '<div class="tl">' + list.map((h) => '<div class="ev ' + esc(h.k) + '"><div class="yr">' + esc(h.y) + '</div><div class="c"><b>' + esc(h.t) + '</b><p class="small">' + esc(h.w) + '</p><p class="lesson small"><b>Lesson:</b> ' + esc(h.l) + "</p></div></div>").join("") + "</div></div>";
  }
};
ACTIONS.histK = (el) => { State.histK = el.dataset.v; route(true); };
VIEWS.sources = {
  tab: "news", title: "Sources",
  render() {
    const st = News.live().status || {};
    const groups = [...new Set(SOURCES.map((s) => s[0]))];
    return '<div class="stack"><div><div class="eyebrow">Live feeds and sources worth following</div><h2 class="sec" style="margin-top:6px">Sources</h2></div>' +
      newsSeg("sources") +
      '<section class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between"><h3 class="card-t">Live feeds in the app</h3><button class="btn sm" data-act="newsRefresh">' + ico("refresh") + "Refresh</button></div>" +
        '<div class="list">' + FEEDS.map((f) => {
          const s = st[f.id];
          return '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;gap:10px;padding:6px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>' + esc(f.name) + "</b></span>" +
            (s ? (s.ok ? '<span class="tag ok">' + s.n + " items</span>" : '<span class="tag bad" title="' + esc(s.err) + '">failed</span>') : '<span class="tag neutral">not yet</span>') + "</div>";
        }).join("") + "</div><p class=\"tiny muted\">Feeds refresh when you open the app or the News tab, at most every 2 hours, and whenever you tap Refresh.</p></section>" +
      groups.map((g) => '<section class="card stack" style="gap:10px"><h3 class="card-t">' + esc(g) + '</h3><div class="list">' +
        SOURCES.filter((s) => s[0] === g).map((s) => '<a class="item" href="' + esc(safeUrl(s[2])) + '"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>' + esc(s[1]) + "</b>" + ico("ext") + '</div><div class="small muted">' + esc(s[3]) + "</div></a>").join("") +
        "</div></section>").join("") + "</div>";
  }
};
