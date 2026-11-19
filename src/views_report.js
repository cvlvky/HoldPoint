/* ================= Daily site report: manpower and productivity ================= */
const TRADES = ["Chargehand", "Carpenter", "Mason", "S/Fixer", "Scaffolder", "Helper", "Flagman", "Electrician", "Rigger", "Fire Watcher", "Operator", "Survey", "Welder", "Painter"];
const ABSENT = ["Carpenter (Own)", "Carpenter (Hire)", "Scaffolder (Own)", "Scaffolder (Hire)", "S/Fixer (Own)", "S/Fixer (Hire)", "Rigger (Own)", "Rigger (Hire)", "Mason", "Helper"];
const PROD_TRADES = ["Scaffolding", "Masonry", "Steel fixing", "Carpentry", "Painting", "Concrete", "Excavation", "Backfill", "Waterproofing", "Plaster", "Other"];
const PROD_UNITS = ["m²", "m³", "m", "t", "kg", "nos"];
const SHIFTS = ["Day 06:00–17:00", "Night 18:00–05:00", "Day 07:00–16:00"];
const sumObj = (o) => Object.values(o || {}).reduce((s, x) => s + (+x || 0), 0);
const perMan = (w) => { const q = num(w.qty), m = num(w.men); return q > 0 && m > 0 ? f2(q / m) + " " + (w.unit || "") + "/man" : ""; };

function newReport(from, date) {
  return {
    id: newId("r"), kind: "rep", date: date || qNow().date, shift: (from && from.shift) || SHIFTS[0],
    project: (from && from.project) || Store.prefs.project || "", by: Store.prefs.name || (from && from.by) || "", weather: "",
    present: from ? clone(from.present || {}) : {}, absent: {},
    work: from ? (from.work || []).map((w) => ({ trade: w.trade, zone: w.zone, act: w.act, men: w.men, qty: "", unit: w.unit })) : [],
    hse: "", issues: "", tomorrow: "", createdAt: Date.now()
  };
}
const repsSorted = () => Store.list("rep").sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.updatedAt || 0) - (a.updatedAt || 0));
function repItem(r) {
  return '<a class="item" href="#rep-' + esc(r.id) + '"><div class="meta"><span class="tag neutral">' + esc(fmtDate(r.date, { weekday: "short" })) + '</span><span class="tiny muted">' + esc(r.shift || "") + "</span></div>" +
    '<div class="t">' + esc(r.project || "Site report") + '</div><div class="small muted">Present ' + sumObj(r.present) + " · Absent " + sumObj(r.absent) + " · " + plural((r.work || []).length, "activity", "activities") + "</div></a>";
}
VIEWS.report = {
  tab: "tools", back: "tools", title: "Daily reports",
  render() {
    const reps = repsSorted();
    const today = qNow().date;
    const has = reps.find((r) => r.date === today);
    return '<div class="stack"><div><div class="eyebrow">Manpower and productivity</div><h2 class="sec" style="margin-top:6px">Daily reports</h2></div>' +
      '<p class="lede">Present and absent by trade, work done with output per man, and one tap to send it on WhatsApp. A new day starts from your last report, so you only change what moved.</p>' +
      '<a class="btn primary" href="#' + (has ? "rep-" + has.id : "newrep") + '">' + ico(has ? "report" : "plus") + (has ? "Open today's report" : "Start today's report") + "</a>" +
      (reps.length ? '<div class="list">' + reps.map(repItem).join("") + "</div>" : '<div class="empty">No reports yet.</div>') + "</div>";
  }
};
VIEWS.newrep = {
  redirect() {
    const today = qNow().date;
    const reps = repsSorted();
    const has = reps.find((r) => r.date === today);
    if (has) return "rep-" + has.id;
    const r = newReport(reps[0], today);
    Store.put(r);
    if (reps[0]) setTimeout(() => toast("Started from your last report. Update the numbers."), 300);
    return "rep-" + r.id;
  },
  render() { return ""; }
};
function stepRow(g, t, n) {
  const a = esc(t);
  return '<div class="steprow"><span>' + a + '</span><div class="stepper"><button type="button" data-act="step" data-d="-1" aria-label="One fewer ' + a + '">−</button>' +
    '<input class="in num" inputmode="numeric" data-g="' + g + '" data-t="' + a + '" value="' + (n ? esc(n) : "") + '" placeholder="0" aria-label="' + a + '">' +
    '<button type="button" data-act="step" data-d="1" aria-label="One more ' + a + '">+</button></div></div>';
}
function workRow(w, j) {
  return '<div class="logrow" data-j="' + j + '"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b class="small">Activity ' + (j + 1) + '</b><span class="flag ok" data-out="' + j + '">' + esc(perMan(w)) + "</span>" +
    '<button type="button" class="btn sm ghost" data-act="delWork" data-j="' + j + '" aria-label="Remove activity ' + (j + 1) + '">' + ico("trash") + "</button></div>" +
    '<div class="grid2"><label class="f">Trade<select class="in" data-w="trade">' + optsHtml(PROD_TRADES.map((x) => [x, x]), w.trade) + "</select></label>" +
    '<label class="f">Zone / grid<input class="in" data-w="zone" value="' + esc(w.zone) + '"></label>' +
    '<label class="f full">Activity<input class="in" data-w="act" value="' + esc(w.act) + '" placeholder="e.g. 200 mm blockwork, ground floor"></label></div>' +
    '<div class="grid3"><label class="f">Men<input class="in num" inputmode="numeric" data-w="men" value="' + esc(w.men) + '"></label>' +
    '<label class="f">Quantity<input class="in num" inputmode="decimal" data-w="qty" value="' + esc(w.qty) + '"></label>' +
    '<label class="f">Unit<select class="in" data-w="unit">' + optsHtml(PROD_UNITS.map((x) => [x, x]), w.unit) + "</select></label></div></div>";
}
const curRep = () => { const r = Store.get(State.arg); return r && r.kind === "rep" ? r : null; };
VIEWS.rep = {
  tab: "tools", back: "report", title: "Daily report",
  render(id) {
    const r = Store.get(id);
    if (!r || r.kind !== "rep") return notFound("report");
    const insps = Store.list("insp").filter((x) => x.date === r.date);
    const shifts = SHIFTS.includes(r.shift) || !r.shift ? SHIFTS : SHIFTS.concat([r.shift]);
    return '<div class="stack" id="rep"><div><div class="eyebrow">Daily site report</div><h2 class="sec" style="margin-top:6px">' + esc(fmtDate(r.date, { weekday: "long" })) + "</h2></div>" +
      '<section class="card"><div class="grid2">' +
        '<label class="f">Date<input class="in" type="date" data-f="date" value="' + esc(r.date) + '"></label>' +
        '<label class="f">Shift<select class="in" data-f="shift">' + optsHtml(shifts.map((s) => [s, s]), r.shift) + "</select></label>" +
        '<label class="f">Project or site<input class="in" data-f="project" value="' + esc(r.project) + '" placeholder="e.g. 400KV substation"></label>' +
        '<label class="f">Prepared by<input class="in" data-f="by" value="' + esc(r.by) + '"></label>' +
        '<label class="f full">Weather<input class="in" data-f="weather" value="' + esc(r.weather) + '" placeholder="e.g. 31 °C, light wind"></label>' +
      "</div></section>" +
      '<section class="card"><div class="row" style="justify-content:space-between"><h3 class="card-t">Manpower present</h3><b class="big-n" id="totP">' + sumObj(r.present) + "</b></div>" +
        '<div class="steps-grid">' + TRADES.map((t) => stepRow("present", t, (r.present || {})[t])).join("") + "</div></section>" +
      '<section class="card"><div class="row" style="justify-content:space-between"><h3 class="card-t">Absent</h3><b class="big-n" id="totA">' + sumObj(r.absent) + "</b></div>" +
        '<div class="steps-grid">' + ABSENT.map((t) => stepRow("absent", t, (r.absent || {})[t])).join("") + "</div></section>" +
      '<section class="card stack" style="gap:10px"><h3 class="card-t">Work done and output</h3>' +
        ((r.work || []).length ? '<div class="stack" style="gap:8px">' + r.work.map(workRow).join("") + "</div>" : '<p class="small muted">Add each activity with its zone, men and quantity. Output per man works itself out.</p>') +
        '<button type="button" class="btn" data-act="addWork">' + ico("plus") + "Add activity</button></section>" +
      (insps.length ? '<section class="card stack" style="gap:10px"><h3 class="card-t">Inspections on this date</h3><div class="list">' + insps.map(inspItem).join("") + "</div></section>" : "") +
      '<section class="card stack" style="gap:10px">' +
        '<label class="f">Safety observations<textarea class="in" data-f="hse" rows="2">' + esc(r.hse) + "</textarea></label>" +
        '<label class="f">Issues and delays<textarea class="in" data-f="issues" rows="2">' + esc(r.issues) + "</textarea></label>" +
        '<label class="f">Plan for tomorrow<textarea class="in" data-f="tomorrow" rows="2">' + esc(r.tomorrow) + "</textarea></label>" +
      "</section>" +
      '<div class="row"><button class="btn primary" data-act="repShare">' + ico("send") + "Send to WhatsApp</button>" +
        '<button class="btn" data-act="repCopy">' + ico("copy") + "Copy text</button>" +
        '<button class="btn" data-act="repNext">' + ico("copy") + "Start next day from this</button>" +
        '<button class="btn" data-act="repExport">' + ico("dl") + "Files</button>" +
        '<button class="btn danger" data-act="repDelete">' + ico("trash") + "Delete</button></div></div>";
  },
  mount(id) {
    const r = Store.get(id);
    if (!r) return;
    let t;
    const save = () => { clearTimeout(t); t = setTimeout(() => Store.put(r), 400); };
    const onIn = (e) => {
      const el = e.target, d = el.dataset;
      if (d.f) { r[d.f] = el.value; save(); }
      else if (d.g) {
        r[d.g] = r[d.g] || {};
        const n = parseInt(el.value, 10);
        if (n > 0) r[d.g][d.t] = n; else delete r[d.g][d.t];
        save();
        $("#totP").textContent = sumObj(r.present);
        $("#totA").textContent = sumObj(r.absent);
      } else if (d.w) {
        const j = +el.closest("[data-j]").dataset.j;
        if (!r.work[j]) return;
        r.work[j][d.w] = el.value;
        save();
        const o = $('[data-out="' + j + '"]');
        if (o) o.textContent = perMan(r.work[j]);
      }
    };
    const root = $("#rep");
    root.addEventListener("input", onIn);
    root.addEventListener("change", onIn);
  }
};
ACTIONS.step = (el) => {
  const inp = el.parentNode.querySelector("input");
  const n = Math.max(0, (parseInt(inp.value, 10) || 0) + (+el.dataset.d));
  inp.value = n ? String(n) : "";
  inp.dispatchEvent(new Event("input", { bubbles: true }));
};
ACTIONS.addWork = () => {
  const r = curRep(); if (!r) return;
  r.work = r.work || [];
  const last = r.work[r.work.length - 1];
  r.work.push({ trade: last ? last.trade : "Masonry", zone: "", act: "", men: "", qty: "", unit: last ? last.unit : "m²" });
  Store.put(r);
  route(true);
  const rows = $$("#rep .logrow");
  const inp = rows.length && $('[data-w="zone"]', rows[rows.length - 1]);
  if (inp) inp.focus();
};
ACTIONS.delWork = (el) => { const r = curRep(); if (!r) return; r.work.splice(+el.dataset.j, 1); Store.put(r); route(true); };
function repText(r) {
  const L = ["*" + (r.project ? r.project + " · " : "") + "Daily report*", fmtDate(r.date, { weekday: "long" }) + (r.shift ? " · " + r.shift : "")];
  if (r.weather) L.push("Weather: " + r.weather);
  L.push("", "*Manpower present: " + sumObj(r.present) + "*");
  const extraP = Object.keys(r.present || {}).filter((k) => !TRADES.includes(k));
  TRADES.concat(extraP).forEach((k) => { const n = (r.present || {})[k]; if (n) L.push(k + ": " + n); });
  L.push("", "*Absent: " + sumObj(r.absent) + "*");
  const extraA = Object.keys(r.absent || {}).filter((k) => !ABSENT.includes(k));
  ABSENT.concat(extraA).forEach((k) => { const n = (r.absent || {})[k]; if (n) L.push(k + ": " + n); });
  if (!sumObj(r.absent)) L.push("Nil");
  const work = r.work || [];
  if (work.length) {
    L.push("", "*Productivity*");
    const trades = PROD_TRADES.filter((t) => work.some((w) => w.trade === t)).concat([...new Set(work.map((w) => w.trade).filter((t) => t && !PROD_TRADES.includes(t)))]);
    trades.forEach((t) => {
      L.push("_" + t + "_");
      work.filter((w) => w.trade === t).forEach((w) => {
        const pm = perMan(w);
        L.push("• " + ([w.zone, w.act].filter(Boolean).join(" – ") || "Activity") + (w.men ? " | " + w.men + " men" : "") + (w.qty ? " | " + w.qty + " " + (w.unit || "") : "") + (pm ? " (" + pm + ")" : ""));
      });
    });
  }
  const insps = Store.list("insp").filter((x) => x.date === r.date);
  if (insps.length) {
    L.push("", "*Inspections*");
    insps.forEach((x) => { const c = CHK_BY_ID[x.chk]; const st = inspStats(x); L.push("• " + (c ? c.title : "Inspection") + (Object.values(x.hdr || {}).filter(Boolean).length ? " – " + Object.values(x.hdr).filter(Boolean).join(", ") : "") + ": " + (x.status === "closed" ? "closed" : "open") + (st.nc ? ", " + st.nc + " NC" : "")); });
  }
  if (r.hse) L.push("", "*Safety*", r.hse);
  if (r.issues) L.push("", "*Issues and delays*", r.issues);
  if (r.tomorrow) L.push("", "*Plan for tomorrow*", r.tomorrow);
  if (r.by) L.push("", "Prepared by " + r.by);
  return L.join("\n");
}
ACTIONS.repCopy = () => { const r = curRep(); if (r) copyText(repText(r)); };
ACTIONS.repShare = () => { const r = curRep(); if (r) shareText(repText(r), "Daily report " + r.date); };
ACTIONS.repNext = () => {
  const r = curRep(); if (!r) return;
  const next = Calc.addDays(r.date, 1);
  const exist = Store.list("rep").find((x) => x.date === next);
  if (exist) { go("rep-" + exist.id); toast("A report for " + fmtDate(next) + " already exists."); return; }
  const n = newReport(r, next);
  Store.put(n);
  go("rep-" + n.id);
  toast("Started " + fmtDate(next) + " from this report.");
};
ACTIONS.repDelete = () => {
  const r = curRep(); if (!r) return;
  confirmSheet("Delete the report for " + fmtDate(r.date) + "? This can't be undone.", "Delete", () => { Store.del(r.id); go("report"); toast("Deleted."); });
};
function repDoc(r) {
  const tr = (cells, th) => "<tr>" + cells.map((c, i) => (th ? "<th" : "<td") + (i && !th && /^[\d.]+$/.test(String(c)) ? ' class="n"' : "") + ">" + esc(c) + (th ? "</th>" : "</td>")).join("") + "</tr>";
  let h = '<div class="band"></div><h1>Daily site report</h1><p>' + esc(r.project || "") + "</p>" +
    '<table class="kv">' + [["Date", fmtDate(r.date, { weekday: "long" })], ["Shift", r.shift], ["Weather", r.weather], ["Prepared by", r.by]].map(([k, v]) => "<tr><td>" + esc(k) + "</td><td>" + esc(v || "") + "</td></tr>").join("") + "</table>";
  const pres = Object.keys(r.present || {}).filter((k) => r.present[k]);
  h += "<h2>Manpower present: " + sumObj(r.present) + "</h2><table><thead>" + tr(["Trade", "Present"], true) + "</thead><tbody>" + pres.map((k) => tr([k, r.present[k]])).join("") + "</tbody></table>";
  const abs = Object.keys(r.absent || {}).filter((k) => r.absent[k]);
  h += "<h2>Absent: " + sumObj(r.absent) + "</h2>" + (abs.length ? "<table><thead>" + tr(["Trade", "Absent"], true) + "</thead><tbody>" + abs.map((k) => tr([k, r.absent[k]])).join("") + "</tbody></table>" : "<p>Nil</p>");
  if ((r.work || []).length) h += "<h2>Work done</h2><table><thead>" + tr(["Trade", "Zone / grid", "Activity", "Men", "Qty", "Unit", "Output"], true) + "</thead><tbody>" + r.work.map((w) => tr([w.trade, w.zone, w.act, w.men, w.qty, w.unit, perMan(w)])).join("") + "</tbody></table>";
  [["Safety observations", r.hse], ["Issues and delays", r.issues], ["Plan for tomorrow", r.tomorrow]].forEach(([k, v]) => { if (v) h += "<h2>" + k + "</h2><p>" + esc(v).replace(/\n/g, "<br>") + "</p>"; });
  h += "<footer>Prepared with HoldPoint.</footer>";
  return docShell("Daily report " + r.date, h);
}
ACTIONS.repExport = () => {
  const r = curRep(); if (!r) return;
  const base = "daily-report-" + r.date;
  showSheet('<div class="stack"><h3 class="card-t">Save or send</h3><button class="btn" id="exH">' + ico("report") + 'Report (.html, printable)</button><button class="btn" id="exC">' + ico("table") + 'Spreadsheet (.csv)</button><button class="btn" id="exT">' + ico("send") + "WhatsApp text (.txt)</button></div>", () => {
    $("#exH").addEventListener("click", () => { closeSheet(); shareFile(base + ".html", repDoc(r)); });
    $("#exT").addEventListener("click", () => { closeSheet(); shareFile(base + ".txt", repText(r)); });
    $("#exC").addEventListener("click", () => {
      closeSheet();
      const rows = [["Date", "Section", "Trade", "Zone/grid", "Activity", "Men", "Quantity", "Unit", "Output per man"]];
      Object.keys(r.present || {}).forEach((k) => { if (r.present[k]) rows.push([r.date, "Present", k, "", "", r.present[k], "", "", ""]); });
      Object.keys(r.absent || {}).forEach((k) => { if (r.absent[k]) rows.push([r.date, "Absent", k, "", "", r.absent[k], "", "", ""]); });
      (r.work || []).forEach((w) => rows.push([r.date, "Work", w.trade, w.zone, w.act, w.men, w.qty, w.unit, perMan(w)]));
      shareFile(base + ".csv", csv(rows));
    });
  });
};
