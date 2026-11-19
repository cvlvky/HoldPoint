/* ================= Today, Build, Stage, QCS, Rule, Tables, Glossary ================= */
const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]));
const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));
const CHK_BY_ID = Object.fromEntries(CHECKLISTS.map((c) => [c.id, c]));
const notFound = (to) => '<div class="empty">Not found. <a href="#' + to + '">Go back</a></div>';
const dayIndex = (iso) => Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);

/* ---------- Today ---------- */
function todayState() {
  const now = qNow();
  let s = Local.get("today", null);
  if (!s || s.date !== now.date) {
    const prev = s || {};
    const sameMonth = prev.date && prev.date.slice(0, 7) === now.date.slice(0, 7);
    const wx = Weather.cached();
    const hp = Weather.hotPeriod(wx);
    s = { date: now.date, concT: "", shadeT: "", wbgt: "", rh: "", wind: "", dur: "", start: "",
      hot: hp ? hp.on : sameMonth && prev.hot != null ? !!prev.hot : now.month >= 5 && now.month <= 9,
      trials: !!prev.trials, approved: false, dust: false, rain: false };
    fillFromWeather(s, wx, false);
    Local.set("today", s);
  }
  return s;
}
function evalToday(s) {
  const now = qNow();
  const startMin = s.start ? Calc.toMin(s.start) : now.min;
  const dur = num(s.dur);
  const concT = num(s.concT), shadeT = num(s.shadeT), rh = num(s.rh), wind = num(s.wind), wbgt = num(s.wbgt);
  const evap = [concT, shadeT, rh, wind].every(isNum) ? Calc.evaporation(concT, shadeT, rh, wind) : NaN;
  return Calc.goNoGo({ concT, shadeT, trialsApproved: !!s.trials, hotPeriod: !!s.hot, now: startMin, durMin: isNum(dur) ? dur * 60 : NaN,
    molSeason: Calc.inMolSeason(now.month, now.day), wbgt, dust: !!s.dust, rain: !!s.rain, approved: !!s.approved, evap });
}
function seasonBanner(now) {
  if (Calc.inMolSeason(now.month, now.day))
    return '<div class="note warn">' + ico("sun") + "<span><b>Summer midday ban is in force.</b> No outdoor work from 10:00 to 15:30 until 15 September, and work stops whenever WBGT is above 32.1 °C.</span></div>";
  if (now.month >= 5 && now.month <= 10)
    return '<div class="note info">' + ico("thermo") + "<span><b>Hot season.</b> When the shade maximum passes 35 °C on 3 days running, the QCS hot-weather period starts: no pours from 10:00 to 17:00.</span></div>";
  return "";
}
function fillFromWeather(s, wx, force) {
  const c = wx && wx.cur;
  if (!c || Date.now() - wx.at > 3 * 3600000) return false;
  let changed = false;
  [["shadeT", c.temperature_2m, 1], ["rh", c.relative_humidity_2m, 0], ["wind", c.wind_speed_10m, 0]].forEach(([k, v, d]) => {
    if (isNum(v) && (force || s[k] === "")) { s[k] = String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)); changed = true; }
  });
  return changed;
}
function wxCard() {
  const wx = Weather.cached();
  const p = Weather.place();
  const head = '<div><div class="eyebrow">Live weather · ' + esc(p[1]) + "</div>";
  if (!wx) return '<section class="card"><div class="row" style="justify-content:space-between;flex-wrap:nowrap">' + head + '<p class="small muted" style="margin-top:6px">' + (State.wxBusy ? "Getting the latest readings…" : "No readings yet. Check the connection and tap Refresh.") + "</p></div>" +
    '<button class="btn sm" data-act="wxRefresh">' + ico("refresh") + "Refresh</button></div></section>";
  const c = wx.cur || {};
  const w = Weather.wbgt(c.temperature_2m, c.relative_humidity_2m);
  const hp = Weather.hotPeriod(wx);
  const hours = Weather.next(wx, 12);
  return '<section class="card stack" style="gap:10px">' +
    '<div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap">' + head + '<div class="tiny muted" style="margin-top:4px">Open-Meteo · ' + esc(State.wxBusy ? "updating…" : "updated " + ago(wx.at)) + "</div></div>" +
      '<button class="btn sm ghost" data-act="wxRefresh" aria-label="Refresh weather">' + ico("refresh") + "</button></div>" +
    '<div class="grid4">' + stat("Air", f1(c.temperature_2m), "°C") + stat("Humidity", f0(c.relative_humidity_2m), "%") + stat("Wind", f0(c.wind_speed_10m), "km/h") + stat("WBGT est.", f1(w), "°C") + "</div>" +
    (hp ? '<p class="small"><span class="tag ' + (hp.on ? "warn" : "ok") + '">' + (hp.on ? "Hot-weather period likely" : "Not a hot-weather period") + "</span> Shade max, last 3 days: " + hp.days.map((d) => f0(d[1]) + " °C").join(", ") + "</p>" : "") +
    (hours.length ? '<div class="hours" aria-label="Next 12 hours">' + hours.map((h) => "<div><span>" + esc(h.t) + "</span><b>" + f0(h.temp) + "°</b><small>" + f0(h.rh) + " % · " + f0(h.wind) + "</small></div>").join("") + "</div>" : "") +
    '<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><button class="btn sm" data-act="wxFill">' + ico("thermo") + 'Use in pour check</button><span class="tiny muted">WBGT here is an estimate from temperature and humidity. The Ministry rule goes by your site meter.</span></div>' +
    "</section>";
}
function autoWeather() {
  if (State.wxBusy) return;
  const c = Weather.cached();
  if (c && Date.now() - c.at < 20 * 60000) return;
  State.wxBusy = true;
  Weather.refresh(false).then((wx) => {
    const s = todayState();
    const hp = Weather.hotPeriod(wx);
    if (fillFromWeather(s, wx, false) || (hp && !s.hotTouched && s.hot !== hp.on)) { if (hp && !s.hotTouched) s.hot = hp.on; Local.set("today", s); }
  }).catch(() => {}).finally(() => { State.wxBusy = false; if (State.route === "today") refreshView(); });
}
ACTIONS.wxRefresh = () => {
  State.wxBusy = true;
  if (State.route === "today") route(true);
  Weather.refresh(true).then((wx) => { const s = todayState(); if (fillFromWeather(s, wx, false)) Local.set("today", s); })
    .catch(() => toast("Couldn't get the weather. Check the connection."))
    .finally(() => { State.wxBusy = false; if (State.route === "today") route(true); });
};
ACTIONS.wxFill = () => {
  const wx = Weather.cached();
  const s = todayState();
  if (!fillFromWeather(s, wx, true)) { toast("No fresh readings. Tap refresh first."); return; }
  const hp = Weather.hotPeriod(wx);
  if (hp) s.hot = hp.on;
  Local.set("today", s);
  route(true);
  toast("Shade air, humidity and wind filled in. Add the concrete temperature.");
};
function heroHtml(s) {
  const fld = (k, l, u) => '<label class="f">' + l + '<span class="unit"><input class="in num" inputmode="decimal" data-t="' + k + '" value="' + esc(s[k]) + '" placeholder="–"><span>' + u + "</span></span></label>";
  const tg = (k, l) => '<label class="switch"><span>' + l + '</span><input type="checkbox" data-t="' + k + '"' + (s[k] ? " checked" : "") + "></label>";
  return '<section class="hero" aria-label="Pour check">' +
    '<div class="verdict-wrap"><div><div class="eyebrow">Can we pour now?</div><div class="verdict" id="verdict" aria-live="polite">–</div></div>' +
    '<div class="clock"><b id="clk">' + qNow().hhmm + "</b>Doha time</div></div>" +
    '<div class="grid3">' + fld("concT", "Concrete", "°C") + fld("shadeT", "Shade air", "°C") + fld("wbgt", "WBGT", "°C") + fld("rh", "Humidity", "%") + fld("wind", "Wind", "km/h") + fld("dur", "Pour length", "h") + "</div>" +
    '<label class="f">Pour starts (leave blank for now)<input class="in" type="time" data-t="start" value="' + esc(s.start) + '"></label>' +
    '<div class="toggles">' + tg("approved", "Base, forms and steel approved in writing") + tg("hot", "QCS hot-weather period in force") + tg("trials", "Trials approved for concrete up to 35 °C") + tg("dust", "Dust storm") + tg("rain", "Heavy rain and the pour is not covered") + "</div>" +
    '<ul class="reasons" id="reasons"></ul>' +
    '<p class="tiny" style="opacity:.72">Evaporation is worked out from concrete temperature, shade air, humidity and wind (ACI 305R formula). The verdict covers QCS S05 Part 08 and Part 15 and the Ministry of Labour heat rules, not your project specification.</p>' +
    "</section>";
}
function tile(href, icon, title, sub, cls, act) {
  return (act ? '<button type="button" class="tile ' + (cls || "") + '" data-act="' + act + '">' : '<a class="tile ' + (cls || "") + '" href="#' + href + '">') +
    ico(icon) + "<b>" + esc(title) + "</b><span>" + esc(sub) + "</span>" + (act ? "</button>" : "</a>");
}
VIEWS.today = {
  tab: "today", title: "Today",
  render() {
    const now = qNow();
    const s = todayState();
    const open = Store.list("insp").filter((r) => r.status !== "closed").sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const stat = Store.prefs.stageStatus || {};
    const done = STAGES.filter((x) => stat[x.id] === "done").length;
    const doing = STAGES.filter((x) => stat[x.id] === "doing");
    const next = STAGES.find((x) => stat[x.id] !== "done" && x.phase !== "Substation civil");
    const hist = HISTORY[((dayIndex(now.date) % HISTORY.length) + HISTORY.length) % HISTORY.length];
    const latest = News.all().slice(0, 4);
    const rep = Store.list("rep").find((r) => r.date === now.date);
    return '<div class="stack">' +
      '<div><div class="eyebrow">' + esc(now.weekday) + " " + esc(fmtDate(now.date)) + ' · Doha</div><h2 class="sec" style="margin-top:6px">Site day</h2></div>' +
      seasonBanner(now) + wxCard() + heroHtml(s) +
      '<div class="grid3">' +
        tile(rep ? "rep-" + rep.id : "newrep", "report", "Daily report", rep ? "Today's report started" : "Manpower and output", "accent") +
        tile("checks", "checks", "Inspection", CHECKLISTS.length + " ITP checklists") +
        tile("tool-pour", "truck", "Pour planner", "Trucks and timing") +
        tile("tool-cubes", "cube", "Cube results", "Accept or reject") +
        tile("build", "build", "Work sequence", STAGES.length + " stages") +
        (AI.ready() ? tile("ask", "ask", "Ask HoldPoint", "Questions on site") : tile("", "search", "Search", "Rules, tools, terms", "", "search")) +
      "</div>" +
      (open.length ? '<section class="card"><div class="row" style="justify-content:space-between"><h3 class="card-t">Open inspections</h3><a class="small" href="#checks">All records</a></div><div class="list" style="margin-top:10px">' + open.slice(0, 4).map(inspItem).join("") + "</div></section>" : "") +
      '<a class="card linkcard" href="#build"><div class="row" style="justify-content:space-between"><h3 class="card-t">Work sequence</h3><span class="small muted">' + done + " of " + STAGES.length + ' done</span></div><div class="bar"><i style="width:' + Math.round((done / STAGES.length) * 100) + '%"></i></div><p class="small muted">' +
        (doing.length ? "In progress: " + esc(doing.map((d) => d.title).join(", ")) : next ? "Next: " + esc(next.no + " " + next.title) : "Every stage is marked done.") + "</p></a>" +
      '<section class="card stack" style="gap:8px"><div class="eyebrow">From the history files · ' + esc(hist.y) + '</div><h3 class="card-t">' + esc(hist.t) + '</h3><p class="small">' + esc(hist.w) + '</p><p class="lesson small"><b>Lesson:</b> ' + esc(hist.l) + '</p><a class="small" href="#history">More must-know events</a></section>' +
      '<section class="card"><div class="row" style="justify-content:space-between"><h3 class="card-t">Latest news</h3><a class="small" href="#news">All news</a></div><div class="list" style="margin-top:10px">' +
        latest.map((n) => '<a class="item" href="' + esc(safeUrl(n.u)) + '"><div class="meta">' + catTag(n) + '<span class="tiny muted">' + esc(fmtDate(n.d)) + '</span></div><div class="t">' + esc(n.t) + '</div><div class="small muted">' + esc(n.src) + "</div></a>").join("") +
      "</div></section>" +
      "</div>";
  },
  mount() {
    const s = todayState();
    const hero = $(".hero");
    const upd = (first) => {
      const r = evalToday(s);
      const v = $("#verdict");
      if (!v) return;
      if (v.textContent !== r.verdict) {
        v.className = "verdict " + (r.verdict === "GO" ? "go" : "hold");
        if (!first) { void v.offsetWidth; v.classList.add("stamp"); }
        v.textContent = r.verdict;
      }
      $("#reasons").innerHTML = r.items.map((i) => '<li class="' + i.sev + '"><span class="dot"></span><span>' + esc(i.msg) + " " + refChip(i.ref) + "</span></li>").join("");
    };
    const onIn = (e) => {
      const k = e.target.dataset.t;
      if (!k) return;
      s[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      if (k === "hot") s.hotTouched = true;
      Local.set("today", s);
      upd(false);
    };
    hero.addEventListener("input", onIn);
    hero.addEventListener("change", onIn);
    upd(true);
    autoWeather();
    News.autoRefresh();
    clearInterval(window._hpClock);
    window._hpClock = setInterval(() => {
      const c = $("#clk");
      if (!c) { clearInterval(window._hpClock); return; }
      c.textContent = qNow().hhmm;
      if (!s.start) upd(false);
    }, 30000);
  }
};

/* ---------- Build: sequence of work ---------- */
function stageRail(s, status) {
  const H = s.holds.filter((h) => h[0] === "H").length, W = s.holds.filter((h) => h[0] === "W").length;
  return '<a class="stg' + (status === "done" ? " done" : "") + '" href="#stage-' + s.id + '"><div class="node"><span class="badge">' + esc(s.no) + "</span></div>" +
    '<div class="body"><div style="font-weight:700;line-height:1.3">' + esc(s.title) + '</div><div class="small muted">' + esc(s.why) + "</div>" +
    '<div class="meta row" style="gap:6px">' + (H ? '<span class="tag bad">' + H + " hold</span>" : "") + (W ? '<span class="tag warn">' + W + " witness</span>" : "") +
    (status === "done" ? '<span class="tag ok">Done</span>' : status === "doing" ? '<span class="tag">In progress</span>' : "") + "</div></div></a>";
}
const LEGEND = '<div class="legend small">' + [["H", "Hold: stop until released"], ["W", "Witness: invite the Engineer"], ["S", "Surveillance"], ["R", "Record review"]].map(([k, l]) => '<span class="lg">' + hw(k) + "<span>" + l + "</span></span>").join("") + "</div>";
VIEWS.build = {
  tab: "build", title: "Work sequence",
  render() {
    const st = Store.prefs.stageStatus || {};
    const ph = State.buildPhase || "All";
    const done = STAGES.filter((s) => st[s.id] === "done").length;
    let rails = "";
    PHASES.filter((p) => ph === "All" || p === ph).forEach((p) => {
      rails += '<div class="phase-h">' + esc(p) + '</div><div class="rail">' + STAGES.filter((s) => s.phase === p).map((s) => stageRail(s, st[s.id])).join("") + "</div>";
    });
    return '<div class="stack">' +
      '<div><div class="eyebrow">Sequence of work · building and substation civil</div><h2 class="sec" style="margin-top:6px">Build it in order</h2></div>' +
      '<p class="lede">Each stage gives the steps in order, the hold and witness points, the tests and how often, what passes, the usual defects and the QCS clauses behind them. Mark stages as you go.</p>' +
      '<div class="card flat stack" style="gap:8px"><div class="row" style="justify-content:space-between"><b>Project progress</b><span class="small muted">' + done + " of " + STAGES.length + ' done</span></div><div class="bar"><i style="width:' + Math.round((done / STAGES.length) * 100) + '%"></i></div>' + LEGEND + "</div>" +
      '<div class="chips" role="group" aria-label="Phase">' + ["All"].concat(PHASES).map((p) => '<button class="chip" data-act="buildPhase" data-p="' + esc(p) + '" aria-pressed="' + (p === ph) + '">' + esc(p) + "</button>").join("") + "</div>" +
      "<div>" + rails + "</div></div>";
  }
};
ACTIONS.buildPhase = (el) => { State.buildPhase = el.dataset.p; route(true); };

VIEWS.stage = {
  tab: "build", back: "build", title: (id) => (STAGE_BY_ID[id] || {}).title,
  render(id) {
    const s = STAGE_BY_ID[id];
    if (!s) return notFound("build");
    const i = STAGES.indexOf(s), prev = STAGES[i - 1], next = STAGES[i + 1];
    const st = (Store.prefs.stageStatus || {})[s.id] || "";
    const li = (a) => '<ul class="pts">' + a.map((x) => "<li>" + md(x) + "</li>").join("") + "</ul>";
    const sec = (title, body, extra) => '<section class="card stack" style="gap:10px"' + (extra || "") + '><h3 class="card-t">' + title + "</h3>" + body + "</section>";
    const rules = s.rules.map((r) => RULE_BY_ID[r]).filter(Boolean);
    const checks = s.checks.map((c) => CHK_BY_ID[c]).filter(Boolean);
    return '<div class="stack">' +
      '<div><div class="eyebrow">Stage ' + esc(s.no) + " · " + esc(s.phase) + '</div><h2 class="sec" style="margin-top:6px">' + esc(s.title) + '</h2><p class="lede" style="margin-top:8px">' + esc(s.why) + "</p></div>" +
      '<div class="row" style="justify-content:space-between"><div class="seg" role="group" aria-label="Stage status">' +
        [["", "Not started"], ["doing", "In progress"], ["done", "Done"]].map(([v, l]) => '<button data-act="stageStatus" data-id="' + s.id + '" data-v="' + v + '" aria-pressed="' + (st === v) + '">' + l + "</button>").join("") +
      '</div><button class="btn sm" data-act="copy" data-src="brief">' + ico("copy") + "Copy briefing</button></div>" +
      sec("Before you start", li(s.pre)) +
      sec("Sequence", '<ol class="steps" id="brief" data-text="' + esc(stageBrief(s)) + '">' + s.steps.map((x) => "<li><span>" + md(x) + "</span></li>").join("") + "</ol>") +
      sec("Hold and witness points", '<ul class="plainlist">' + s.holds.map((h) => "<li>" + hw(h[0]) + "<span>" + esc(h[1]) + "</span></li>").join("") + "</ul>" + LEGEND) +
      '<div class="grid2 wide1">' + sec("Tests and frequency", li(s.tests)) + sec("Acceptance", li(s.accept)) + "</div>" +
      sec("Common defects and fixes", '<div class="defects">' + s.defects.map((d) => '<div class="def"><b>' + esc(d[0]) + "</b><span>" + esc(d[1]) + "</span></div>").join("") + "</div>") +
      sec("Safety", li(s.hse)) +
      (rules.length ? sec("QCS clauses", '<div class="list">' + rules.map(ruleItem).join("") + "</div>") : "") +
      (checks.length ? sec("Checklists for this stage", '<div class="row">' + checks.map((c) => '<a class="btn" href="#new-' + c.id + '">' + ico("plus") + esc(c.title) + "</a>").join("") + '</div><p class="small muted">Each one opens a new inspection record you can fill in, close and share.</p>') : "") +
      '<div class="row" style="justify-content:space-between">' +
        (prev ? '<a class="btn ghost" href="#stage-' + prev.id + '">' + ico("back") + esc(prev.no) + " " + esc(prev.title) + "</a>" : "<span></span>") +
        (next ? '<a class="btn ghost" href="#stage-' + next.id + '">' + esc(next.no) + " " + esc(next.title) + ico("next") + "</a>" : "") +
      "</div></div>";
  }
};
function stageBrief(s) {
  return "*Stage " + s.no + ": " + s.title + "*\n" + s.why + "\n\n*Sequence*\n" + s.steps.map((x, i) => i + 1 + ". " + plain(x)).join("\n") +
    "\n\n*Hold and witness points*\n" + s.holds.map((h) => "[" + (h[0] || "-") + "] " + h[1]).join("\n") +
    "\n\n*Safety*\n" + s.hse.map((x) => "• " + plain(x)).join("\n");
}
ACTIONS.stageStatus = (el) => {
  const m = Object.assign({}, Store.prefs.stageStatus || {});
  if (el.dataset.v) m[el.dataset.id] = el.dataset.v; else delete m[el.dataset.id];
  Store.pref("stageStatus", m);
  route(true);
};

/* ---------- QCS rule cards ---------- */
function ruleItem(r) {
  const on = (Store.prefs.starred || []).includes(r.id);
  return '<a class="item" href="#rule-' + r.id + '"><div class="meta"><span class="tag neutral">' + esc(r.topic) + "</span>" + (r.v ? '<span class="tag warn">verify</span>' : "") + (on ? '<span class="tag warn">saved</span>' : "") +
    '</div><div class="t">' + esc(r.title) + '</div><div class="small muted">' + esc(r.ref) + "</div></a>";
}
function ruleMatches(r, toks) {
  if (!toks.length) return true;
  const x = (r.title + " " + r.tags + " " + r.ref + " " + r.topic + " " + r.pts.join(" ")).toLowerCase();
  return toks.every((t) => x.includes(t));
}
function qcsList() {
  const topic = State.qcsTopic || "All";
  const toks = (State.qcsQ || "").toLowerCase().split(/\s+/).filter(Boolean);
  const starred = Store.prefs.starred || [];
  const list = RULES.filter((r) => (topic === "All" || (topic === "Saved" ? starred.includes(r.id) : r.topic === topic)) && ruleMatches(r, toks));
  return list.length ? list.map(ruleItem).join("") : '<div class="empty">' + (topic === "Saved" ? "Nothing saved yet. Open a rule and tap Save." : "No rule matches. Try another word.") + "</div>";
}
VIEWS.qcs = {
  tab: "qcs", title: "QCS notes",
  render() {
    const topic = State.qcsTopic || "All";
    return '<div class="stack">' +
      '<div><div class="eyebrow">QCS 2024 · ' + RULES.length + ' rule cards</div><h2 class="sec" style="margin-top:6px">The rules</h2></div>' +
      '<details class="card flat more"' + (Local.get("qcsInfo", 0) ? "" : " open") + ' id="qcsInfo"><summary>Which edition applies on your job?</summary><div class="stack small" style="gap:8px;margin-top:8px">' +
        "<p>These cards paraphrase QCS 2024 (QS 27/2024), issued by the Qatar General Organization for Standardization. Its own document history calls it a voluntary standard and general technical guide, so <b>the edition and clauses named in your contract govern</b>. Many projects still run on QCS 2014.</p>" +
        "<p>Clause references read S05 P08 §8.3.2 = Section 05, Part 08, clause 8.3.2. Values in <strong class=\"mono\">bold</strong> are the numbers to check on site. Cards marked <span class=\"tag warn\">verify</span> include figures read from a scanned table: confirm them in the PDF.</p>" +
      "</div></details>" +
      '<input class="in" type="search" id="qcsQ" placeholder="Filter: curing, cover, slump, FDT…" value="' + esc(State.qcsQ || "") + '" aria-label="Filter rule cards">' +
      '<div class="chips" role="group" aria-label="Topic">' + ["All", "Saved"].concat(TOPICS).map((t) => '<button class="chip" data-act="qcsTopic" data-t="' + esc(t) + '" aria-pressed="' + (t === topic) + '">' + esc(t) + "</button>").join("") + "</div>" +
      '<div class="list" id="qcsList">' + qcsList() + "</div>" +
      '<a class="item" href="#tables"><div class="meta"><span class="tag">Tables</span></div><div class="t">Reference tables</div><div class="small muted">Grades and w/c, cover by exposure, slump tolerance, striking times, mortar mixes</div></a>' +
      '<details class="card flat more"><summary>All QCS sections in your Drive</summary><div class="list" style="margin-top:10px">' +
        QCS_SECTIONS.map((x) => '<a class="item" href="' + driveFolder(x[2]) + '"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b class="mono">S' + esc(x[0]) + "</b> " + esc(x[1]) + "</span>" + ico("ext") + "</div></a>").join("") +
        '<a class="small" href="' + driveFolder(DRIVE_ROOT) + '">Open the QCS-2024 folder</a>' +
      "</div></details></div>";
  },
  mount() {
    const q = $("#qcsQ");
    q.addEventListener("input", () => { State.qcsQ = q.value; $("#qcsList").innerHTML = qcsList(); });
    $("#qcsInfo").addEventListener("toggle", (e) => { if (!e.target.open) Local.set("qcsInfo", 1); });
  }
};
ACTIONS.qcsTopic = (el) => { State.qcsTopic = el.dataset.t; route(true); };

function ruleText(r) { return r.title + " (QCS " + r.ref + ")\n" + r.pts.map((p) => "• " + plain(p)).join("\n"); }
VIEWS.rule = {
  tab: "qcs", back: "qcs", title: (id) => (RULE_BY_ID[id] || {}).title,
  render(id) {
    const r = RULE_BY_ID[id];
    if (!r) return notFound("qcs");
    const part = QCS_PARTS[r.part];
    const on = (Store.prefs.starred || []).includes(r.id);
    const stages = STAGES.filter((s) => s.rules.includes(r.id));
    const tools = TOOLS.filter((t) => (t.rules || []).includes(r.id));
    const same = RULES.filter((x) => x.topic === r.topic);
    const i = same.indexOf(r), prev = same[i - 1], next = same[i + 1];
    return '<div class="stack">' +
      '<div><div class="eyebrow">' + esc(r.topic) + " · " + esc(r.ref) + '</div><h2 class="sec" style="margin-top:6px">' + esc(r.title) + "</h2></div>" +
      (r.v ? '<div class="verify">' + ico("warn") + "<span>Some figures on this card were read from a scanned table. Confirm them in the PDF before you rely on them.</span></div>" : "") +
      '<section class="card"><ul class="pts" id="ruleText" data-text="' + esc(ruleText(r)) + '">' + r.pts.map((p) => "<li>" + md(p) + "</li>").join("") + "</ul></section>" +
      '<div class="row"><button class="btn" data-act="copy" data-src="ruleText">' + ico("copy") + "Copy</button>" + star(on, "starRule", r.id) +
        (part ? '<a class="btn" href="' + driveFile(part[1]) + '">' + ico("ext") + esc(part[0]) + "</a>" : "") + "</div>" +
      (tools.length ? '<section class="card stack" style="gap:10px"><h3 class="card-t">Work it out</h3><div class="row">' + tools.map((t) => '<a class="btn" href="#tool-' + t.id + '">' + ico(t.ic) + esc(t.t) + "</a>").join("") + "</div></section>" : "") +
      (stages.length ? '<section class="card stack" style="gap:10px"><h3 class="card-t">Used in these stages</h3><div class="list">' + stages.map((s) => '<a class="item" href="#stage-' + s.id + '"><div class="t">' + esc(s.no) + " · " + esc(s.title) + '</div><div class="small muted">' + esc(s.phase) + "</div></a>").join("") + "</div></section>" : "") +
      '<div class="row" style="justify-content:space-between">' +
        (prev ? '<a class="btn ghost" href="#rule-' + prev.id + '">' + ico("back") + esc(prev.title) + "</a>" : "<span></span>") +
        (next ? '<a class="btn ghost" href="#rule-' + next.id + '">' + esc(next.title) + ico("next") + "</a>" : "") +
      "</div></div>";
  }
};
ACTIONS.starRule = (el) => {
  const k = el.dataset.key;
  const a = (Store.prefs.starred || []).slice();
  const i = a.indexOf(k);
  if (i >= 0) a.splice(i, 1); else a.push(k);
  Store.pref("starred", a);
  route(true);
};

/* ---------- Reference tables ---------- */
VIEWS.tables = {
  tab: "qcs", back: "qcs", title: "Reference tables",
  render() {
    const t = (head, rows, numeric) => '<div class="scroll-x"><table class="t"><thead><tr>' + head.map((h, i) => "<th" + (numeric && i ? ' style="text-align:right"' : "") + ">" + h + "</th>").join("") + "</tr></thead><tbody>" +
      rows.map((r) => "<tr>" + r.map((c, i) => "<td" + (numeric && i ? ' class="n"' : "") + ">" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
    const card = (title, ref, body, note) => '<section class="card stack" style="gap:10px"><div><h3 class="card-t">' + title + '</h3><div class="small muted" style="margin-top:3px">' + ref + "</div></div>" + body + (note ? '<p class="small muted">' + note + "</p>" : "") + "</section>";
    return '<div class="stack">' +
      '<div><div class="eyebrow">QCS 2024 quick reference</div><h2 class="sec" style="margin-top:6px">Tables</h2></div>' +
      card("Concrete grades", "S05 P06 Table 6.4", t(["Grade", "Cube MPa", "Cylinder MPa", "Min binder kg/m³", "Max w/c"], GRADES.map((g) => [g.g, g.cube, g.cyl, g.cem, g.wc.toFixed(2)]), true), "Grade is the 28-day cube strength. Above C75 needs special approval.") +
      card("Minimum cover by exposure", "S05 P06 Table 6.7 (mm)", t(["Exposure", "C40", "C50", "C60", "C75"], Object.entries(COVER_T67).map(([x, r]) => [x, r.C40, r.C50, r.C60, r.C75]), true), "Binders: X3 and X4 PC/FA, PC/GGBS, PC/SF or triple blend; X5 triple blend only. X0–X2: see Table 6.7 or the drawings. " + '<a href="#tool-cover">Cover lookup</a>') +
      card("Slump tolerance at first discharge", "S05 P06 Table 6.3", t(["Target slump", "Allowed range"], [["≤ 40 mm", "−30 / +40 mm"], ["50–90 mm", "−40 / +50 mm"], ["≥ 100 mm", "−50 / +60 mm"]], false), '<a href="#tool-truck">Truck check</a>') +
      card("Minimum striking periods", "S05 P09 Table 9.1", t(["Element", "Days"], STRIP_T91.map((s) => [esc(s.label), s.d]), true), '<span class="tag warn">verify</span> Read from a scanned table: confirm against your copy. Cube results still govern (§9.5.2.2). <a href="#tool-strike">Striking dates</a>') +
      card("Mortar mixes by mass", "S13 P02 Table 2.1 (kg)", t(["Class", "Cement : sand", "Cement : lime : sand", "MPa"], Object.entries(MORTAR_T21).map(([k, r]) => [k, r.c + " : " + r.s, r.cl.join(" : "), r.mpa]), false), "Mortar in contact with the ground uses sulphate-resisting cement. " + '<a href="#tool-block">Blockwork quantities</a>') +
      '<a class="item" href="#rule-qa-freq"><div class="meta"><span class="tag">QA/QC</span></div><div class="t">Testing frequencies at a glance</div><div class="small muted">S02 Part 15 Appendix A</div></a>' +
      "</div>";
  }
};

/* ---------- Glossary ---------- */
VIEWS.glossary = {
  tab: "qcs", back: "more", title: "Glossary",
  render() {
    return '<div class="stack"><div><div class="eyebrow">' + GLOSSARY.length + ' terms</div><h2 class="sec" style="margin-top:6px">Site glossary</h2></div>' +
      '<input class="in" type="search" id="gq" placeholder="Find a term" aria-label="Find a term"><dl class="gloss" id="glist">' + glossList("") + "</dl></div>";
  },
  mount() { const q = $("#gq"); q.addEventListener("input", () => { $("#glist").innerHTML = glossList(q.value); }); }
};
function glossList(q) {
  const s = q.trim().toLowerCase();
  const a = GLOSSARY.filter((g) => !s || (g[0] + " " + g[1]).toLowerCase().includes(s)).sort((x, y) => x[0].localeCompare(y[0]));
  return a.length ? a.map((g) => "<div><dt>" + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd></div>").join("") : '<div class="empty">No term matches.</div>';
}
