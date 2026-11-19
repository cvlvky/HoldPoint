/* ================= Checklists and inspection records ================= */
const RES_LABEL = { ok: "OK", nc: "NC", na: "N/A" };
const csv = (rows) => rows.map((r) => r.map((x) => { const s = String(x == null ? "" : x); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(",")).join("\n");
const DOC_CSS = "body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:13px;line-height:1.4}" +
  ".band{height:6px;background:repeating-linear-gradient(-45deg,#FFC20E 0 10px,#111 10px 20px);margin-bottom:12px}" +
  "h1{font-size:20px;margin:0 0 2px}h2{font-size:15px;margin:18px 0 6px}p{margin:4px 0}" +
  "table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #999;padding:5px 6px;text-align:left;vertical-align:top}" +
  "th{background:#eee;font-size:12px}.kv td:first-child{width:32%;background:#f6f6f6;font-weight:bold}td.n{text-align:right;font-variant-numeric:tabular-nums}" +
  ".ref{color:#555;font-size:11px;margin-top:2px}.nc{color:#b00;font-weight:bold}.ok{color:#060;font-weight:bold}" +
  ".sign td{height:70px;width:50%}footer{margin-top:16px;color:#555;font-size:11px}@media print{body{margin:10mm}}";
const docShell = (title, body) => '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + "</title><style>" + DOC_CSS + "</style></head><body>" + body + "</body></html>";
const fileSafe = (s) => String(s || "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "record";

function inspStats(r) {
  const c = CHK_BY_ID[r.chk];
  const out = { done: 0, total: 0, ok: 0, nc: 0, na: 0, holds: 0 };
  if (!c) return out;
  out.total = c.items.length;
  c.items.forEach((it, i) => {
    const v = ((r.items || {})[i] || {}).v;
    if (v) { out.done++; out[v]++; }
    if (it[0] === "H" && v !== "ok" && v !== "na") out.holds++;
  });
  return out;
}
function inspItem(r) {
  const c = CHK_BY_ID[r.chk];
  const st = inspStats(r);
  const where = Object.values(r.hdr || {}).filter(Boolean).join(" · ");
  return '<a class="item" href="#insp-' + esc(r.id) + '"><div class="meta">' + (r.status === "closed" ? '<span class="tag ok">Closed</span>' : '<span class="tag">Open</span>') +
    (st.nc ? '<span class="tag bad">' + st.nc + " NC</span>" : "") + '<span class="tiny muted">' + esc(fmtDate(r.date)) + "</span></div>" +
    '<div class="t">' + esc(c ? c.title : "Checklist") + '</div><div class="small muted">' + esc(where || "No location yet") + " · " + st.done + "/" + st.total + " checked</div></a>";
}
const stageOrder = (id) => { const i = STAGES.findIndex((s) => s.id === id); return i < 0 ? 99 : i; };

VIEWS.checks = {
  tab: "checks", title: "Checklists",
  render() {
    const mode = State.checksMode || "new";
    const recs = Store.list("insp").sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.updatedAt || 0) - (a.updatedAt || 0));
    let body;
    if (mode === "new") {
      body = '<div class="list">' + CHECKLISTS.slice().sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage)).map((c) => {
        const s = STAGE_BY_ID[c.stage];
        const H = c.items.filter((i) => i[0] === "H").length;
        return '<a class="item" href="#new-' + c.id + '"><div class="meta"><span class="tag neutral">Stage ' + esc(s ? s.no : "") + "</span>" + (H ? '<span class="tag bad">' + H + " hold</span>" : "") +
          (c.log ? '<span class="tag">' + (c.log === "truck" ? "truck log" : "density log") + "</span>" : "") + '</div><div class="t">' + esc(c.title) + '</div><div class="small muted">' + c.items.length + " checks · " + esc(s ? s.title : "") + "</div></a>";
      }).join("") + "</div>";
    } else {
      const f = State.checksFilter || "All";
      const list = recs.filter((r) => f === "All" || (f === "Open" && r.status !== "closed") || (f === "Closed" && r.status === "closed") || (f === "With NC" && inspStats(r).nc));
      body = '<div class="chips" role="group" aria-label="Filter">' + ["All", "Open", "With NC", "Closed"].map((x) => '<button class="chip" data-act="checksFilter" data-v="' + x + '" aria-pressed="' + (x === f) + '">' + x + "</button>").join("") + "</div>" +
        (list.length ? '<div class="list">' + list.map(inspItem).join("") + "</div>" : '<div class="empty">' + (recs.length ? "Nothing in this filter." : "No inspections yet. Start one from the list.") + "</div>");
    }
    return '<div class="stack"><div><div class="eyebrow">Inspection and test plan</div><h2 class="sec" style="margin-top:6px">Checklists</h2></div>' +
      '<p class="lede">QCS-based checks for each stage with hold and witness points. Records save as you type' + (State.sync === "cloud" ? " and sync to your account." : " on this device.") + "</p>" +
      '<div class="seg wide" role="group" aria-label="View"><button data-act="checksMode" data-v="new" aria-pressed="' + (mode === "new") + '">Start new</button><button data-act="checksMode" data-v="mine" aria-pressed="' + (mode === "mine") + '">My records (' + recs.length + ")</button></div>" +
      body + "</div>";
  }
};
ACTIONS.checksMode = (el) => { State.checksMode = el.dataset.v; route(true); };
ACTIONS.checksFilter = (el) => { State.checksFilter = el.dataset.v; route(true); };

VIEWS.new = {
  redirect(id) {
    const c = CHK_BY_ID[id];
    if (!c) return "checks";
    const r = { id: newId("i"), kind: "insp", chk: c.id, date: qNow().date, by: Store.prefs.name || "", hdr: {}, items: {}, log: [], logOpt: {}, notes: "", status: "open", createdAt: Date.now() };
    Store.put(r);
    State.checksMode = "mine";
    return "insp-" + r.id;
  },
  render() { return ""; }
};

function itemHtml(it, i, val) {
  const v = val.v || "";
  const showNote = v === "nc" || val.n || val.open;
  return '<div class="chk' + (v === "nc" ? " nc" : "") + '"><div class="top">' + hw(it[0]) + '<div class="txt">' + esc(it[1]) + (it[2] ? " " + refChip(it[2]) : "") + "</div></div>" +
    '<div class="ctl"><div class="seg" role="group" aria-label="Result for check ' + (i + 1) + '">' +
    [["ok", "OK"], ["nc", "NC"], ["na", "N/A"]].map(([k, l]) => '<button type="button" data-act="setItem" data-i="' + i + '" data-v="' + k + '" aria-pressed="' + (v === k) + '">' + l + "</button>").join("") + "</div>" +
    (showNote ? "" : '<button type="button" class="btn sm ghost" data-act="noteItem" data-i="' + i + '">Add note</button>') + "</div>" +
    (showNote ? '<input class="in" data-note="' + i + '" value="' + esc(val.n) + '" placeholder="' + (v === "nc" ? "What is wrong, and the action" : "Note") + '" aria-label="Note for check ' + (i + 1) + '">' : "") + "</div>";
}
function summaryTags(r) {
  const st = inspStats(r);
  return (r.status === "closed" ? '<span class="tag ok">Closed</span>' : '<span class="tag">Open</span>') +
    '<span class="tag neutral">' + st.done + "/" + st.total + " checked</span>" +
    (st.nc ? '<span class="tag bad">' + st.nc + " NC</span>" : "") +
    (st.holds ? '<span class="tag warn">' + plural(st.holds, "hold point") + " not released</span>" : "");
}

/* ---- logs: concrete trucks and field density ---- */
function truckEval(row, r) {
  const o = r.logOpt || {};
  return Calc.truckCheck({ batch: row.batch, discharge: row.arrive, temp: row.temp, slump: row.slump }, { target: o.target, trialsApproved: !!o.trials });
}
function truckFlag(row, r) {
  const ck = truckEval(row, r);
  const any = row.batch || row.temp || row.slump;
  if (!any) return ["", ""];
  if (ck.flags.length) return ["bad", "Reject: " + ck.flags.map((f) => f.msg).join("; ")];
  return ["ok", "OK" + (isNum(ck.age) ? " · " + Math.round(ck.age) + " min old" : "")];
}
function truckSummary(r) {
  const rows = r.log || [];
  const vol = rows.reduce((s, x) => s + (isNum(num(x.vol)) ? num(x.vol) : 0), 0);
  const bad = rows.filter((x) => truckFlag(x, r)[0] === "bad").length;
  return plural(rows.length, "truck") + " · " + f1(vol) + " m³" + (bad ? " · " + bad + " rejected" : "");
}
function fdtEval(row, r) { const o = r.logOpt || {}; return Calc.fdt(num(row.wet), num(row.w), num(o.mdd), num(o.omc)); }
function fdtFlag(row, r) {
  const x = fdtEval(row, r);
  if (!x) return ["", ""];
  return [x.ok ? "ok" : "bad", (x.ok ? "Pass" : "Fail") + " · " + f1(x.rc) + " % MDD" + (isNum(x.dW) ? " · w " + (x.dW >= 0 ? "+" : "") + f1(x.dW) + " %" : "")];
}
function fdtSummary(r) {
  const rows = r.log || [];
  const ev = rows.map((x) => fdtEval(x, r)).filter(Boolean);
  return plural(rows.length, "test") + (ev.length ? " · " + ev.filter((e) => e.ok).length + " pass · " + ev.filter((e) => !e.ok).length + " fail" : "");
}
function logInput(row, k, label, type) {
  const isN = type === "num";
  return '<label class="f">' + label + '<input class="in' + (isN ? " num" : "") + '" data-l="' + k + '"' + (type === "time" ? ' type="time"' : isN ? ' inputmode="decimal"' : "") + ' value="' + esc(row[k]) + '"></label>';
}
function logRow(c, row, j, r) {
  const [cls, txt] = c.log === "truck" ? truckFlag(row, r) : fdtFlag(row, r);
  const fields = c.log === "truck"
    ? '<div class="grid3">' + logInput(row, "ticket", "Ticket", "text") + logInput(row, "vol", "m³", "num") + logInput(row, "batch", "Batched", "time") + logInput(row, "arrive", "Discharged", "time") + logInput(row, "temp", "Temp °C", "num") + logInput(row, "slump", "Slump mm", "num") + "</div>" + logInput(row, "rem", "Cubes taken, remarks", "text")
    : '<div class="grid2">' + logInput(row, "loc", "Location / grid", "text") + logInput(row, "layer", "Layer no.", "text") + logInput(row, "wet", "Wet density Mg/m³", "num") + logInput(row, "w", "Moisture %", "num") + "</div>";
  return '<div class="logrow" data-j="' + j + '"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b class="small">' + (c.log === "truck" ? "Truck " : "Test ") + (j + 1) + "</b>" +
    '<span class="flag ' + cls + '" data-flag="' + j + '">' + esc(txt) + "</span>" +
    '<button type="button" class="btn sm ghost" data-act="delRow" data-j="' + j + '" aria-label="Remove row ' + (j + 1) + '">' + ico("trash") + "</button></div>" + fields + "</div>";
}
function logHtml(c, r) {
  const o = r.logOpt || {};
  const opts = c.log === "truck"
    ? '<div class="grid2"><label class="f">Target slump<span class="unit"><input class="in num" inputmode="decimal" data-o="target" value="' + esc(o.target) + '"><span>mm</span></span></label>' +
      '<label class="switch"><span>Trials approved up to 35 °C</span><input type="checkbox" data-o="trials"' + (o.trials ? " checked" : "") + "></label></div>"
    : '<div class="grid2"><label class="f">MDD (lab)<span class="unit"><input class="in num" inputmode="decimal" data-o="mdd" value="' + esc(o.mdd) + '"><span>Mg/m³</span></span></label>' +
      '<label class="f">OMC (lab)<span class="unit"><input class="in num" inputmode="decimal" data-o="omc" value="' + esc(o.omc) + '"><span>%</span></span></label></div>';
  return '<section class="card stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3 class="card-t">' + (c.log === "truck" ? "Truck log" : "Field density log") + '</h3><span class="small muted" id="logSum">' + esc(c.log === "truck" ? truckSummary(r) : fdtSummary(r)) + "</span></div>" +
    opts + '<div class="stack" style="gap:8px">' + (r.log || []).map((row, j) => logRow(c, row, j, r)).join("") + "</div>" +
    '<button type="button" class="btn" data-act="addRow">' + ico("plus") + (c.log === "truck" ? "Add truck" : "Add test") + "</button>" +
    '<p class="tiny muted">' + (c.log === "truck" ? "Limits: 90 min from batching, 32 °C (35 °C with approved trials), slump to Table 6.3." : "Pass: at least 95 % of MDD and moisture within ±3 % of OMC (S12 P03 §3.5).") + "</p></section>";
}
function updateLogFlags(r, c) {
  (r.log || []).forEach((row, j) => {
    const el = $('[data-flag="' + j + '"]');
    if (!el) return;
    const [cls, txt] = c.log === "truck" ? truckFlag(row, r) : fdtFlag(row, r);
    el.className = "flag " + cls;
    el.textContent = txt;
  });
  const s = $("#logSum");
  if (s) s.textContent = c.log === "truck" ? truckSummary(r) : fdtSummary(r);
}

VIEWS.insp = {
  tab: "checks", back: "checks", title: "Inspection",
  render(id) {
    const r = Store.get(id);
    const c = r && CHK_BY_ID[r.chk];
    if (!c) return notFound("checks");
    const stg = STAGE_BY_ID[c.stage];
    const closed = r.status === "closed";
    return '<div class="stack" id="insp">' +
      '<div><div class="eyebrow">Checklist' + (stg ? " · Stage " + esc(stg.no) : "") + '</div><h2 class="sec" style="margin-top:6px">' + esc(c.title) + "</h2></div>" +
      '<div class="summary-bar" id="isum">' + summaryTags(r) + "</div>" +
      '<fieldset class="plain"' + (closed ? " disabled" : "") + ">" +
      '<section class="card"><div class="grid2">' +
        '<label class="f">Date<input class="in" type="date" data-f="date" value="' + esc(r.date) + '"></label>' +
        '<label class="f">Inspected by<input class="in" data-f="by" value="' + esc(r.by) + '" placeholder="Name"></label>' +
        c.hdr.map((h, k) => '<label class="f">' + esc(h) + '<input class="in" data-h="' + k + '" value="' + esc((r.hdr || {})[k]) + '"></label>').join("") +
      "</div></section>" +
      '<section class="card"><h3 class="card-t" style="margin-bottom:4px">Checks</h3><div>' + c.items.map((it, i) => itemHtml(it, i, (r.items || {})[i] || {})).join("") + "</div>" + LEGEND + "</section>" +
      (c.log ? logHtml(c, r) : "") +
      '<section class="card"><label class="f">Notes and actions<textarea class="in" data-f="notes" rows="3" placeholder="Remarks, corrective actions, who attended">' + esc(r.notes) + "</textarea></label></section>" +
      "</fieldset>" +
      '<div class="row">' +
        (closed ? '<button class="btn" data-act="inspStatus" data-v="open">Reopen</button>' : '<button class="btn primary" data-act="inspStatus" data-v="closed">' + ico("check") + "Close inspection</button>") +
        '<button class="btn" data-act="inspShare">' + ico("send") + "Send summary</button>" +
        '<button class="btn" data-act="inspCopy">' + ico("copy") + "Copy</button>" +
        '<button class="btn" data-act="inspExport">' + ico("dl") + "Download</button>" +
        '<button class="btn danger" data-act="inspDelete">' + ico("trash") + "Delete</button>" +
      "</div>" +
      (stg ? '<a class="small" href="#stage-' + stg.id + '">Stage guide: ' + esc(stg.title) + "</a>" : "") +
      "</div>";
  },
  mount(id) {
    const r = Store.get(id);
    const c = r && CHK_BY_ID[r.chk];
    if (!c) return;
    let t;
    const save = () => { clearTimeout(t); t = setTimeout(() => { Store.put(r); }, 350); };
    const onIn = (e) => {
      const el = e.target;
      const d = el.dataset;
      if (d.f) { r[d.f] = el.value; save(); }
      else if (d.h != null) { r.hdr = r.hdr || {}; r.hdr[d.h] = el.value; save(); }
      else if (d.note != null) { r.items = r.items || {}; r.items[d.note] = Object.assign({}, r.items[d.note], { n: el.value }); save(); }
      else if (d.o) { r.logOpt = r.logOpt || {}; r.logOpt[d.o] = el.type === "checkbox" ? el.checked : el.value; save(); updateLogFlags(r, c); }
      else if (d.l) { const j = +el.closest("[data-j]").dataset.j; if (r.log[j]) { r.log[j][d.l] = el.value; save(); updateLogFlags(r, c); } }
    };
    const root = $("#insp");
    root.addEventListener("input", onIn);
    root.addEventListener("change", onIn);
  }
};
const curInsp = () => { const r = Store.get(State.arg); return r && r.kind === "insp" ? r : null; };
ACTIONS.setItem = (el) => {
  const r = curInsp(); if (!r) return;
  const i = el.dataset.i, v = el.dataset.v;
  r.items = r.items || {};
  const cur = r.items[i] || {};
  r.items[i] = Object.assign({}, cur, { v: cur.v === v ? "" : v });
  Store.put(r);
  route(true);
  if (v === "nc" && cur.v !== "nc") { const n = $('[data-note="' + i + '"]'); if (n) n.focus(); }
};
ACTIONS.noteItem = (el) => {
  const r = curInsp(); if (!r) return;
  const i = el.dataset.i;
  r.items = r.items || {};
  r.items[i] = Object.assign({}, r.items[i], { open: true });
  route(true);
  const n = $('[data-note="' + i + '"]'); if (n) n.focus();
};
ACTIONS.addRow = () => {
  const r = curInsp(); if (!r) return;
  r.log = r.log || [];
  const last = r.log[r.log.length - 1];
  r.log.push(last && last.vol ? { vol: last.vol } : {});
  Store.put(r);
  route(true);
  const rows = $$(".logrow");
  const inp = rows.length && $("input", rows[rows.length - 1]);
  if (inp) inp.focus();
};
ACTIONS.delRow = (el) => {
  const r = curInsp(); if (!r) return;
  r.log.splice(+el.dataset.j, 1);
  Store.put(r);
  route(true);
};
ACTIONS.inspStatus = (el) => {
  const r = curInsp(); if (!r) return;
  r.status = el.dataset.v;
  if (r.status === "closed") {
    r.closedAt = Date.now();
    const st = inspStats(r);
    if (st.holds) toast("Closed with " + plural(st.holds, "hold point") + " not released.");
    else toast("Inspection closed.");
  }
  Store.put(r);
  route(true);
};
ACTIONS.inspDelete = () => {
  const r = curInsp(); if (!r) return;
  confirmSheet("Delete this inspection record? This can't be undone.", "Delete", () => { Store.del(r.id); go("checks"); toast("Deleted."); });
};
function inspSummary(r) {
  const c = CHK_BY_ID[r.chk];
  const st = inspStats(r);
  const L = ["*" + c.title + "*" + (Store.prefs.project ? " · " + Store.prefs.project : ""), fmtDate(r.date) + (r.by ? " · " + r.by : "")];
  c.hdr.forEach((h, k) => { const v = (r.hdr || {})[k]; if (v) L.push(h + ": " + v); });
  L.push("Result: " + st.ok + " OK · " + st.nc + " NC · " + st.na + " N/A (" + st.done + "/" + st.total + " checked)");
  const pairs = c.items.map((it, i) => [it, (r.items || {})[i] || {}]);
  const ncs = pairs.filter((p) => p[1].v === "nc");
  if (ncs.length) { L.push("", "*Non-conformances*"); ncs.forEach(([it, v]) => L.push("• " + it[1] + (v.n ? ": " + v.n : ""))); }
  const holds = pairs.filter(([it, v]) => it[0] === "H" && v.v !== "ok" && v.v !== "na");
  if (holds.length) { L.push("", "*Hold points not released*"); holds.forEach(([it]) => L.push("• " + it[1])); }
  if (c.log && (r.log || []).length) L.push("", (c.log === "truck" ? "Trucks: " + truckSummary(r) : "Density tests: " + fdtSummary(r)));
  if (r.notes) L.push("", "Notes: " + r.notes);
  L.push("", "Status: " + (r.status === "closed" ? "Closed" : "Open"));
  return L.join("\n");
}
ACTIONS.inspCopy = () => { const r = curInsp(); if (r) copyText(inspSummary(r)); };
ACTIONS.inspShare = () => { const r = curInsp(); if (r) shareText(inspSummary(r), (CHK_BY_ID[r.chk] || {}).title); };
function inspDoc(r) {
  const c = CHK_BY_ID[r.chk];
  const stg = STAGE_BY_ID[c.stage];
  const st = inspStats(r);
  const kv = [["Project", Store.prefs.project], ["Date", fmtDate(r.date)], ["Inspected by", r.by]].concat(c.hdr.map((h, k) => [h, (r.hdr || {})[k]]))
    .concat([["Stage", stg ? stg.no + " " + stg.title : ""], ["Result", st.ok + " OK, " + st.nc + " NC, " + st.na + " N/A (" + st.done + "/" + st.total + " checked)"], ["Status", r.status === "closed" ? "Closed" : "Open"]]);
  let html = '<div class="band"></div><h1>' + esc(c.title) + "</h1><p>Inspection record</p>" +
    '<table class="kv">' + kv.map(([k, v]) => "<tr><td>" + esc(k) + "</td><td>" + esc(v || "") + "</td></tr>").join("") + "</table>" +
    "<h2>Checks</h2><table><thead><tr><th>#</th><th>Type</th><th>Check</th><th>Result</th><th>Note</th></tr></thead><tbody>" +
    c.items.map((it, i) => { const v = (r.items || {})[i] || {}; return "<tr><td>" + (i + 1) + "</td><td>" + esc(it[0] || "") + "</td><td>" + esc(it[1]) + (it[2] ? '<div class="ref">' + esc(it[2]) + "</div>" : "") + '</td><td class="' + (v.v || "") + '">' + (RES_LABEL[v.v] || "") + "</td><td>" + esc(v.n || "") + "</td></tr>"; }).join("") +
    "</tbody></table>";
  if (c.log && (r.log || []).length) {
    if (c.log === "truck") {
      html += "<h2>Truck log</h2><p>Target slump " + esc((r.logOpt || {}).target || "–") + " mm · " + esc(truckSummary(r)) + "</p><table><thead><tr><th>#</th><th>Ticket</th><th>m³</th><th>Batched</th><th>Discharged</th><th>°C</th><th>Slump</th><th>Check</th><th>Remarks</th></tr></thead><tbody>" +
        r.log.map((x, j) => "<tr><td>" + (j + 1) + "</td><td>" + esc(x.ticket) + '</td><td class="n">' + esc(x.vol) + "</td><td>" + esc(x.batch) + "</td><td>" + esc(x.arrive) + '</td><td class="n">' + esc(x.temp) + '</td><td class="n">' + esc(x.slump) + "</td><td>" + esc(truckFlag(x, r)[1]) + "</td><td>" + esc(x.rem) + "</td></tr>").join("") + "</tbody></table>";
    } else {
      html += "<h2>Field density log</h2><p>MDD " + esc((r.logOpt || {}).mdd || "–") + " Mg/m³ · OMC " + esc((r.logOpt || {}).omc || "–") + " % · " + esc(fdtSummary(r)) + "</p><table><thead><tr><th>#</th><th>Location</th><th>Layer</th><th>Wet Mg/m³</th><th>w %</th><th>Result</th></tr></thead><tbody>" +
        r.log.map((x, j) => "<tr><td>" + (j + 1) + "</td><td>" + esc(x.loc) + "</td><td>" + esc(x.layer) + '</td><td class="n">' + esc(x.wet) + '</td><td class="n">' + esc(x.w) + "</td><td>" + esc(fdtFlag(x, r)[1]) + "</td></tr>").join("") + "</tbody></table>";
    }
  }
  if (r.notes) html += "<h2>Notes and actions</h2><p>" + esc(r.notes).replace(/\n/g, "<br>") + "</p>";
  html += '<h2>Sign-off</h2><table class="sign"><tr><td>Contractor QA/QC<br><br>Name, signature, date</td><td>Consultant / Engineer<br><br>Name, signature, date</td></tr></table>' +
    "<footer>H = Hold, W = Witness, S = Surveillance, R = Record review. Prepared with HoldPoint from QCS 2024 notes; the contract specification and the Engineer's instructions govern.</footer>";
  return docShell(c.title + " " + r.date, html);
}
ACTIONS.inspExport = () => {
  const r = curInsp(); if (!r) return;
  const c = CHK_BY_ID[r.chk];
  const base = fileSafe(c.title) + "-" + r.date;
  showSheet('<div class="stack"><h3 class="card-t">Save or send</h3><button class="btn" id="exHtml">' + ico("report") + "Inspection report (.html, printable)</button>" +
    (c.log && (r.log || []).length ? '<button class="btn" id="exCsv">' + ico("table") + "Log as spreadsheet (.csv)</button>" : "") +
    '<p class="small muted">Open the .html file in Chrome and use Share → Print to save a PDF for signatures.</p></div>', () => {
    $("#exHtml").addEventListener("click", () => { closeSheet(); shareFile(base + ".html", inspDoc(r)); });
    const b = $("#exCsv");
    if (b) b.addEventListener("click", () => {
      closeSheet();
      const rows = c.log === "truck"
        ? [["No", "Ticket", "m3", "Batched", "Discharged", "Temp C", "Slump mm", "Check", "Remarks"]].concat(r.log.map((x, j) => [j + 1, x.ticket, x.vol, x.batch, x.arrive, x.temp, x.slump, truckFlag(x, r)[1], x.rem]))
        : [["No", "Location", "Layer", "Wet density", "Moisture %", "Result"]].concat(r.log.map((x, j) => [j + 1, x.loc, x.layer, x.wet, x.w, fdtFlag(x, r)[1]]));
      shareFile(base + "-log.csv", csv(rows));
    });
  });
};
