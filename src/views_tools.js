/* ================= Site calculators ================= */
const f3 = (x) => fmtN(x, 3);
const DIAS = [8, 10, 12, 16, 20, 25, 32, 40];
const parseList = (s) => String(s || "").split(/[\s,;]+/).map(num).filter(isNum);
const big = (label, val, unit) => '<div class="stat"><span class="lbl">' + esc(label) + '</span><span class="big">' + val + (unit ? "<small>" + esc(unit) + "</small>" : "") + "</span></div>";
const stat = (label, val, unit) => '<div class="stat"><span class="lbl">' + esc(label) + '</span><span class="val">' + val + (unit ? ' <small class="muted">' + esc(unit) + "</small>" : "") + "</span></div>";
const resWrap = (inner) => '<div class="result">' + inner + "</div>";
const headline = (b, tagCls, tagTxt) => '<div class="row" style="justify-content:space-between;align-items:flex-end">' + b + (tagTxt ? '<span class="tag ' + tagCls + '">' + esc(tagTxt) + "</span>" : "") + "</div>";
function kFactor(n) {
  const pts = [[15, 1.16], [20, 1.08], [25, 1.03], [30, 1.0]];
  if (n >= 30) return 1;
  for (let i = 0; i < pts.length - 1; i++) {
    const [n1, k1] = pts[i], [n2, k2] = pts[i + 1];
    if (n >= n1 && n <= n2) return k1 + ((n - n1) / (n2 - n1)) * (k2 - k1);
  }
  return 1;
}
function unitOpts(cat) {
  if (cat === "temp") return [["°C", "°C"], ["°F", "°F"], ["K", "K"]];
  const c = Calc.UNITS[cat] || Calc.UNITS.pressure;
  return Object.keys(c.u).map((u) => [u, u]);
}
const todayIso = () => qNow().date;

const TOOLS = [
{ id: "pour", g: "Concrete", ic: "truck", t: "Pour planner", d: "Trucks, placing time and the hot-weather window", rules: ["hot-period", "conc-prepour", "mix-cubes"], kw: "pour concrete trucks schedule hot weather 10:00 17:00",
  f: [{ k: "vol", l: "Concrete volume", u: "m³", d: "120" }, { k: "waste", l: "Waste allowance", u: "%", d: "2" }, { k: "cap", l: "Truck load", u: "m³", d: "10" }, { k: "rate", l: "Placing rate", u: "m³/h", d: "30" },
    { k: "date", l: "Pour date", t: "date", d: todayIso }, { k: "start", l: "First truck on site", t: "time", d: "02:00" }, { k: "setup", l: "Set-up before discharge", u: "min", d: "30" }, { k: "hot", l: "QCS hot-weather period in force", t: "toggle", d: false }],
  calc(v) {
    if (!(v.vol > 0 && v.cap > 0 && v.rate > 0)) return need("Enter the volume, truck load and placing rate.");
    const st = Calc.toMin(v.start);
    if (!isNum(st)) return need("Enter the time the first truck reaches site.");
    const order = v.vol * (1 + (isNum(v.waste) ? v.waste : 0) / 100);
    const p = Calc.pourPlan({ vol: order, rate: v.rate, start: st, setup: isNum(v.setup) ? v.setup : 0, cap: v.cap, hotPeriod: v.hot });
    const items = [];
    if (v.hot) {
      if (p.clash) {
        items.push(["stop", "The pour runs into the 10:00–17:00 no-concreting window.", "S05 P15 §15.3"]);
        items.push(["warn", p.latestMorningStart >= 0 ? "To finish by 10:00, have the first truck on site by " + Calc.fromMin(p.latestMorningStart) + "." : "Too long for one morning: start after 17:00 (first truck from " + Calc.fromMin(p.eveningStart) + ") or split the pour.", ""]);
      } else items.push(["ok", "Clear of the 10:00–17:00 window.", "S05 P15 §15.3"]);
    }
    const m = +String(v.date || "").slice(5, 7), dd = +String(v.date || "").slice(8, 10);
    if (m && Calc.inMolSeason(m, dd) && Calc.overlaps(p.pourStart, p.end, Calc.MOL_BAN[0], Calc.MOL_BAN[1])) items.push(["stop", "Runs into the summer midday ban on outdoor work (10:00–15:30).", "MoL 17/2021"]);
    if (p.hours > 8) items.push(["warn", "More than 8 hours of placing: plan relief crews, a standby pump, lighting and an emergency joint.", ""]);
    items.push(["ok", "One truck every " + f0(60 / p.perHour) + " min; each must discharge within 90 min of batching.", "S05 P08 §8.2.1"]);
    const cp = Calc.cubePlan(order, 1, 6, 30);
    items.push(["ok", "Cubes: at least " + plural(cp.sets, "set") + " (" + cp.specimens + " cubes) at 1 set per 30 m³.", "S02 App. A"]);
    return resWrap('<div class="grid2">' + big("Trucks", p.nTrucks, "× " + f1(v.cap) + " m³") + big("Placing time", hm(p.hours)) + "</div>" +
      '<div class="grid3">' + stat("Order", f1(order), "m³") + stat("Discharge starts", Calc.fromMin(p.pourStart)) + stat("Pour ends", Calc.fromMin(p.end) + (p.end >= 1440 ? " +1 day" : "")) + "</div>" + reasons(items));
  } },
{ id: "vol", g: "Concrete", ic: "cube", t: "Concrete volumes", d: "Slabs, footings, piles, columns and stairs", rules: [], kw: "volume quantity m3 slab footing pile stair column",
  f: [{ k: "shape", l: "Shape", t: "sel", o: [["box", "Slab, beam, wall or footing"], ["cyl", "Pile or round column"], ["stair", "Stair flight"]], d: "box" },
    { k: "L", l: "Length", u: "m", d: "10", show: (v) => v.shape === "box" }, { k: "W", l: "Width", u: "m", d: "8", show: (v) => v.shape === "box" }, { k: "D", l: "Thickness or depth", u: "m", d: "0.25", show: (v) => v.shape === "box" },
    { k: "dia", l: "Diameter", u: "m", d: "0.9", show: (v) => v.shape === "cyl" }, { k: "H", l: "Length or height", u: "m", d: "18", show: (v) => v.shape === "cyl" },
    { k: "sw", l: "Flight width", u: "m", d: "1.2", show: (v) => v.shape === "stair" }, { k: "going", l: "Going", u: "mm", d: "280", show: (v) => v.shape === "stair" }, { k: "riser", l: "Riser", u: "mm", d: "170", show: (v) => v.shape === "stair" },
    { k: "steps", l: "Risers in the flight", u: "no.", d: "10", show: (v) => v.shape === "stair" }, { k: "waist", l: "Waist slab", u: "mm", d: "150", show: (v) => v.shape === "stair" },
    { k: "qty", l: "Number of items", u: "no.", d: "1" }, { k: "waste", l: "Waste allowance", u: "%", d: "3" }, { k: "cap", l: "Truck load", u: "m³", d: "10" }],
  calc(v) {
    let one;
    if (v.shape === "cyl") one = Calc.volCyl(v.dia, v.H);
    else if (v.shape === "stair") one = Calc.volStair(v.sw, v.going / 1000, v.riser / 1000, v.steps, v.waist / 1000);
    else one = Calc.volBox(v.L, v.W, v.D);
    if (!isNum(one) || one <= 0) return need("Fill in the dimensions.");
    const q = v.qty > 0 ? v.qty : 1, net = one * q, order = net * (1 + (isNum(v.waste) ? v.waste : 0) / 100), cap = v.cap > 0 ? v.cap : 10;
    return resWrap('<div class="grid2">' + big("Order", f2(order), "m³") + big("Trucks", Calc.trucks(order, cap), "× " + f1(cap) + " m³") + "</div>" +
      '<div class="grid3">' + stat("Each", f2(one), "m³") + stat("Net total", f2(net), "m³") + stat("Waste", f2(order - net), "m³") + "</div>" +
      (v.shape === "stair" ? '<p class="small muted">Waist slab measured along the slope plus the triangular steps. Landings are separate slabs.</p>' : ""));
  } },
{ id: "evap", g: "Concrete", ic: "sun", t: "Evaporation rate", d: "Plastic shrinkage risk from temperature, humidity and wind", rules: ["hot-period", "hot-placing", "cure-methods"], kw: "evaporation plastic shrinkage cracking 0.75 hot weather wind humidity",
  f: [{ k: "tc", l: "Concrete temperature", u: "°C", d: "32" }, { k: "ta", l: "Air temperature (shade)", u: "°C", d: "35" }, { k: "rh", l: "Relative humidity", u: "%", d: "30" }, { k: "v", l: "Wind speed", u: "km/h", d: "15" }],
  calc(v) {
    const e = Calc.evaporation(v.tc, v.ta, v.rh, v.v);
    if (!isNum(e)) return need("Enter all four readings.");
    const lvl = e > 1.0 ? ["bad", "High"] : e > 0.75 ? ["bad", "Above the QCS trigger"] : e > 0.5 ? ["warn", "Moderate"] : ["ok", "Low"];
    const items = [];
    if (e > 0.75) items.push(["stop", "Above 0.75 kg/m²/h: these count as hot-weather conditions under QCS. Control evaporation and cure at once.", "S05 P15 §15.1.3"]);
    else if (e > 0.5) items.push(["warn", "Getting close to the 0.75 kg/m²/h trigger. Keep fog sprays and curing ready.", "S05 P15 §15.1.3"]);
    else items.push(["ok", "Below the QCS trigger of 0.75 kg/m²/h.", "S05 P15 §15.1.3"]);
    items.push(["ok", "Good practice: fog spray above the surface, wind breaks and sun shades, dampen the base and forms, and start curing as soon as finishing allows.", "ACI 305R"]);
    return resWrap(headline(big("Evaporation", f2(e), "kg/m²/h"), lvl[0], lvl[1]) + reasons(items));
  } },
{ id: "truck", g: "Concrete", ic: "truck", t: "Truck check", d: "Accept or reject a truck at the pump", rules: ["mix-fresh", "conc-time-temp", "hot-placing"], kw: "slump tolerance truck temperature 90 minutes reject accept delivery ticket",
  f: [{ k: "target", l: "Target slump", u: "mm", d: "100" }, { k: "slump", l: "Measured slump", u: "mm", d: "" }, { k: "temp", l: "Concrete temperature", u: "°C", d: "" },
    { k: "batch", l: "Batched at (ticket)", t: "time", d: "" }, { k: "arr", l: "Discharge starts", t: "time", d: "" }, { k: "trials", l: "Trials approved for up to 35 °C", t: "toggle", d: false }],
  calc(v) {
    if (!isNum(v.target)) return need("Enter the target slump.");
    const sc = Calc.slumpCheck(v.target, v.slump);
    const ck = Calc.truckCheck({ batch: v.batch, discharge: v.arr, temp: v.temp, slump: v.slump }, { target: v.target, trialsApproved: v.trials });
    const have = isNum(v.slump) || isNum(v.temp) || isNum(ck.age);
    const tmax = v.trials ? 35 : 32;
    const items = [[isNum(v.slump) ? (sc.ok ? "ok" : "stop") : "warn", "Slump range for this target: " + sc.min + " to " + sc.max + " mm" + (isNum(v.slump) ? " (measured " + v.slump + " mm)." : "."), "S05 P06 Table 6.3"]];
    if (isNum(v.temp)) items.push([v.temp <= tmax ? "ok" : "stop", "Temperature " + v.temp + " °C, limit " + tmax + " °C.", "S05 P15 §15.2.2"]);
    if (isNum(ck.age)) items.push([ck.age <= 90 ? "ok" : "stop", "Age at discharge " + Math.round(ck.age) + " min, limit 90 min.", "S05 P08 §8.2.1"]);
    const ok = ck.ok && (!isNum(v.slump) || sc.ok);
    if (have && !ok) items.push(["warn", "If this is the first truck, don't start the pour. Later trucks over a limit are rejected; carrying on is the Engineer's call.", "S05 P15"]);
    items.push(["ok", "One site adjustment only, with an approved admixture and no rise in w/c.", "S05 P06 §6.8.2"]);
    return resWrap(headline(big("Verdict", have ? (ok ? "Accept" : "Reject") : "–"), ok ? "ok" : "bad", have ? (ok ? "Within limits" : "Out of limits") : "") + reasons(items));
  } },
{ id: "cubes", g: "Concrete", ic: "cube", t: "Cube results", d: "Strength acceptance by the EN 206 or ACI 318 route", rules: ["mix-accept", "mix-cubes"], kw: "cube strength acceptance compliance fck fc results 28 day failure",
  f: [{ k: "route", l: "Acceptance route", t: "sel", o: [["en", "EN 206 route (as written in QCS)"], ["aci", "ACI 318 route"]], d: "en" },
    { k: "fc", l: "Specified strength (fck or f'c)", u: "MPa", d: "40" },
    { k: "res", l: "Test results in order (each the mean of one sample's specimens)", t: "list", d: "45.5 47.0 43.8", ph: "e.g. 45.5 47.0 43.8" },
    { k: "spec", l: "Optional: specimens from one sample, to check the spread", t: "list", d: "", ph: "e.g. 46.9 44.8 47.4" }],
  calc(v) {
    const res = parseList(v.res);
    if (!isNum(v.fc) || !res.length) return need("Enter the specified strength and at least one result.");
    const items = [];
    let head;
    if (v.route === "aci") {
      const a = Calc.acceptACI(v.fc, res);
      items.push([a.okEach ? "ok" : "stop", "No single test below " + f1(a.floor) + " MPa" + (a.okEach ? "." : ": the lowest is " + f1(Math.min.apply(null, res)) + " MPa."), "S05 P06 §6.8.2"]);
      if (a.enough) items.push([a.okTriples ? "ok" : "stop", "Every 3 consecutive tests must average at least " + f1(v.fc) + " MPa" + (a.okTriples ? "." : ": the lowest average is " + f1(Math.min.apply(null, a.triples)) + " MPa."), ""]);
      else items.push(["warn", "Fewer than 3 results: the running average can't be judged yet.", ""]);
      const ok = a.okEach && (!a.enough || a.okTriples);
      head = headline(big("Result", ok ? (a.enough ? "Pass" : "OK so far") : "Fail"), ok ? "ok" : "bad", plural(res.length, "result")) + (a.triples.length ? '<p class="small muted mono">3-test averages: ' + a.triples.map(f1).join(" · ") + "</p>" : "");
    } else {
      const a = Calc.acceptEN(v.fc, res);
      items.push([a.okMean ? "ok" : "stop", "Mean " + f1(a.mean) + " MPa; needs at least " + f1(a.needMean) + " MPa (fck + 2).", "S05 P06 §6.8.2"]);
      items.push([a.okEach ? "ok" : "stop", "Lowest " + f1(a.min) + " MPa; every result needs at least " + f1(a.needEach) + " MPa (fck − 4).", ""]);
      head = headline(big("Result", a.ok ? "Pass" : "Fail"), a.ok ? "ok" : "bad", "mean " + f1(a.mean) + " MPa");
    }
    const sp = Calc.specimenRange(parseList(v.spec));
    if (sp) items.push([sp.flag ? "warn" : "ok", "Specimen spread " + f1(sp.rangePct) + " % of the mean" + (sp.flag ? ": over 15 %, so set it aside unless investigated." : "."), "S05 P06 §6.8.2"]);
    if (items.some((i) => i[0] === "stop")) items.push(["warn", "Tell the Engineer. A 7-day failure can stop work until the 28-day results; confirmed failures lead to in-situ assessment.", "S05 P13"]);
    return resWrap(head + reasons(items));
  } },
{ id: "target", g: "Concrete", ic: "gauge", t: "Target mean strength", d: "f'cr for a mix design from your standard deviation", rules: ["mix-trials"], kw: "target mean strength standard deviation mix design fcr margin trial",
  f: [{ k: "fc", l: "Specified strength f'c", u: "MPa", d: "40" }, { k: "ss", l: "Standard deviation Ss (blank if none)", u: "MPa", d: "3.5" }, { k: "n", l: "Results behind Ss", u: "no.", d: "30" }],
  calc(v) {
    if (!isNum(v.fc)) return need("Enter the specified strength.");
    const t = Calc.targetMean(v.fc, v.ss, v.n);
    const rec = isNum(v.ss) && isNum(v.n) && v.n >= 15;
    let detail;
    if (!rec) detail = "No usable record (fewer than 15 results): " + (v.fc <= 35 ? "f'c + 8.5 MPa." : "1.1 f'c + 5 MPa.");
    else {
      const k = kFactor(v.n), s = v.ss * k;
      const a = v.fc + 1.65 * s, b = v.fc <= 35 ? v.fc + 2.33 * s - 3.5 : 0.9 * v.fc + 2.33 * s;
      detail = (k !== 1 ? "Ss raised by " + f2(k) + " for " + v.n + " results, giving " + f2(s) + " MPa. " : "") + "f'c + 1.65 Ss = " + f1(a) + " MPa; " + (v.fc <= 35 ? "f'c + 2.33 Ss − 3.5" : "0.9 f'c + 2.33 Ss") + " = " + f1(b) + " MPa. The larger governs.";
    }
    return resWrap(big("Target mean f'cr", f1(t), "MPa") + '<p class="small">' + esc(detail) + '</p><p class="small muted">From S05 P06 §6.6 as written in QCS 2024. Your approved mix design governs.</p>');
  } },
{ id: "cubeplan", g: "Concrete", ic: "clock", t: "Cube sampling plan", d: "Sets to take, 7- and 28-day test dates, reminders", rules: ["mix-cubes", "qa-freq"], kw: "cubes sets sampling 30 m3 test dates 7 day 28 day reminder",
  f: [{ k: "el", l: "Element (for the reminder)", t: "text", d: "" }, { k: "vol", l: "Pour volume", u: "m³", d: "120" }, { k: "mixes", l: "Different mixes poured that day", u: "no.", d: "1" }, { k: "per", l: "Cubes per set", u: "no.", d: "6" }, { k: "cast", l: "Casting date", t: "date", d: todayIso }],
  remind(v) {
    if (!v.cast) return [];
    const what = v.el ? v.el + ", cast " + fmtDate(v.cast) : "Concrete cast " + fmtDate(v.cast);
    return [[7, "7-day"], [28, "28-day"]].map(([n, l]) => ({ at: at0700(Calc.addDays(v.cast, n)), title: l + " cube test due today", body: what + ". Check the lab has the cubes and the results come back to you." }));
  },
  calc(v) {
    if (!(v.vol > 0)) return need("Enter the pour volume.");
    const p = Calc.cubePlan(v.vol, v.mixes > 0 ? v.mixes : 1, v.per > 0 ? v.per : 6, 30);
    const d7 = Calc.addDays(v.cast, 7), d28 = Calc.addDays(v.cast, 28), d56 = Calc.addDays(v.cast, 56);
    return resWrap('<div class="grid2">' + big("Sets", p.sets) + big("Cubes", p.specimens) + "</div>" +
      '<div class="grid3">' + stat("7-day test", d7 ? fmtDate(d7) : "–") + stat("28-day test", d28 ? fmtDate(d28) : "–") + stat("56-day, if approved", d56 ? fmtDate(d56) : "–") + "</div>" +
      reasons([["ok", "1 set of 6 cubes per 30 m³, and at least 1 set per mix per day. Both 7-day (3 cubes) and 28-day (2 cubes) tests are required.", "S02 App. A §15.17"],
        ["warn", "S05 §6.8.2 asks for at least 7 specimens per sample. Agree the number in your ITP.", "S05 P06 §6.8.2"],
        ["ok", "Moulds level, kept at 20–26 °C and not moved for 14 h; the trip to the lab within 4 h, shaded and cushioned.", "S05 P06 §6.9"]]));
  } },
{ id: "mass", g: "Concrete", ic: "thermo", t: "Mass concrete temperatures", d: "Placing, peak and core-to-surface limits", rules: ["cure-mass"], kw: "mass concrete thermocouple temperature differential 20 70 27 raft pile cap",
  f: [{ k: "least", l: "Least dimension of the element", u: "m", d: "1.8" }, { k: "area", l: "Plan area", u: "m²", d: "" }, { k: "place", l: "Placing temperature", u: "°C", d: "" },
    { k: "core", l: "Core temperature", u: "°C", d: "" }, { k: "surf", l: "Surface temperature", u: "°C", d: "" }, { k: "drop", l: "Drop in 24 h after curing", u: "°C", d: "" }],
  calc(v) {
    const items = [];
    if (isNum(v.least)) items.push([v.least > 1.5 ? "warn" : "ok", v.least > 1.5 ? "Least dimension over 1.5 m: treat it as mass concrete with a thermal control plan." : "Least dimension up to 1.5 m: not mass concrete by the QCS definition.", "S05 P06 §6.1.3"]);
    if (v.area > 0) items.push(["ok", "Monitoring: at least " + plural(Math.ceil(v.area / 50 - 1e-9), "location") + " (1 per 50 m², 3 points each).", "S02 App. A"]);
    Calc.massCheck({ core: v.core, surface: v.surf, place: v.place, drop24: v.drop }).forEach((m) => items.push([m.ok ? "ok" : "stop", m.msg + ".", "S05 P06 §6.6.1"]));
    if (!items.length) return need("Enter the element size or temperature readings.");
    return resWrap(reasons(items) + '<p class="small muted">These limits were read from a scanned table: confirm them against your copy.</p>');
  } },
{ id: "strike", g: "Formwork and rebar", ic: "clock", t: "Striking dates", d: "Earliest dates to strike forms and remove props", rules: ["fw-striking"], kw: "striking formwork props soffit reshoring days table 9.1",
  f: [{ k: "el", l: "Element", t: "sel", o: STRIP_T91.map((s) => [s.k, s.label]), d: "slab" }, { k: "where", l: "Location (for the reminder)", t: "text", d: "" }, { k: "cast", l: "Concrete placed on", t: "date", d: todayIso }, { k: "time", l: "Placed at", t: "time", d: "06:00" }],
  remind(v) {
    const sel = STRIP_T91.find((s) => s.k === v.el);
    if (!sel || !v.cast) return [];
    const at = new Date(Calc.addDays(v.cast, sel.d) + "T" + (v.time || "07:00") + ":00+03:00").getTime();
    return [{ at, title: "Striking allowed: " + sel.label, body: (v.where ? v.where + ". " : "") + plural(sel.d, "day") + " since placing. Notify the Engineer in writing first; cubes still govern." }];
  },
  calc(v) {
    if (!v.cast) return need("Enter the pour date.");
    const sel = STRIP_T91.find((s) => s.k === v.el) || STRIP_T91[0];
    const d = Calc.addDays(v.cast, sel.d);
    return resWrap(big("Earliest", esc(fmtDate(d)) + (v.time ? " " + esc(v.time) : "")) + '<p class="small">' + esc(sel.label) + ": " + plural(sel.d, "day") + " after placing.</p>" +
      '<div class="scroll-x"><table class="t"><thead><tr><th>Element</th><th style="text-align:right">Days</th><th>Earliest</th></tr></thead><tbody>' +
      STRIP_T91.map((s) => "<tr><td>" + esc(s.label) + '</td><td class="n">' + s.d + "</td><td>" + esc(fmtDate(Calc.addDays(v.cast, s.d))) + "</td></tr>").join("") + "</tbody></table></div>" +
      reasons([["warn", "Table 9.1 periods were read from a scanned table: confirm them against your copy.", "S05 P09 Table 9.1"], ["ok", "Notify the Engineer in writing first and reshore at once. Passing cubes still govern.", "S05 P09 §9.5"]]));
  } },
{ id: "cover", g: "Formwork and rebar", ic: "ruler", t: "Cover lookup", d: "Minimum cover by exposure class and grade", rules: ["rb-cover", "mix-exposure"], kw: "cover exposure X3 X4 X5 spacer nominal cover table 6.7",
  f: [{ k: "x", l: "Exposure class", t: "sel", o: [["X3", "X3 aggressive: groundwater, saline water"], ["X4", "X4 severe: within 1 km of the sea or on sabkha, over 3 m up"], ["X5", "X5 extreme: cyclic wet and dry, under 3 m up, splash zone"]], d: "X4" },
    { k: "g", l: "Concrete grade", t: "sel", o: [["C40", "C40"], ["C50", "C50"], ["C60", "C60"], ["C75", "C75"]], d: "C50" }],
  calc(v) {
    const row = COVER_T67[v.x];
    if (!row) return need("Choose an exposure class.");
    return resWrap(big("Minimum cover", row[v.g], "mm") + '<p class="small">Binder: ' + esc(row.blend) + ".</p>" +
      reasons([["ok", "Spacers to links equal the nominal cover; concrete spacers at least the member's strength.", "S05 P11 §11.5.7"], ["ok", "Check with a covermeter after casting (accurate to ±5 % or ±2 mm).", "S05 P13 §13.3"], ["warn", "X0–X2 and grades below C40 aren't listed here: use Table 6.7 or the drawings.", ""]]));
  } },
{ id: "bar", g: "Formwork and rebar", ic: "rebar", t: "Rebar quick calcs", d: "Weight, bars at a spacing and link cutting length", rules: ["rb-fixing"], kw: "rebar weight kg/m d2/162 spacing bars count stirrup link cutting length",
  f: [{ k: "mode", l: "Calculation", t: "sel", o: [["w", "Weight and area"], ["n", "Bars at a spacing"], ["s", "Link (stirrup) cutting length"]], d: "w" },
    { k: "d", l: "Bar diameter", t: "sel", o: DIAS.map((d) => [String(d), d + " mm"]), d: "16" },
    { k: "len", l: "Length of each bar", u: "m", d: "12", show: (v) => v.mode === "w" }, { k: "cnt", l: "Number of bars", u: "no.", d: "10", show: (v) => v.mode === "w" },
    { k: "span", l: "Distance to cover", u: "m", d: "6", show: (v) => v.mode === "n" }, { k: "sp", l: "Spacing", u: "mm", d: "150", show: (v) => v.mode === "n" },
    { k: "b", l: "Section width", u: "mm", d: "300", show: (v) => v.mode === "s" }, { k: "h", l: "Section depth", u: "mm", d: "600", show: (v) => v.mode === "s" },
    { k: "cv", l: "Cover to the link", u: "mm", d: "40", show: (v) => v.mode === "s" }, { k: "hook", l: "Hook allowance each end", u: "mm", d: "", ph: "10d, min 75", show: (v) => v.mode === "s" }],
  calc(v) {
    const d = num(v.d);
    if (v.mode === "n") {
      const n = Calc.barsAlong(v.span, v.sp);
      if (!n) return need("Enter the distance and spacing.");
      return resWrap('<div class="grid2">' + big("Bars", n) + big("Steel area", f0(Calc.areaPerM(d, v.sp)), "mm²/m") + '</div><p class="small muted">Count = distance ÷ spacing + 1. Check the end distances on the drawing.</p>');
    }
    if (v.mode === "s") {
      const hook = isNum(v.hook) ? v.hook : Math.max(10 * d, 75);
      const L = Calc.stirrupLength(v.b, v.h, isNum(v.cv) ? v.cv : 0, d, hook);
      if (!isNum(L)) return need("Check the section size and cover.");
      return resWrap('<div class="grid2">' + big("Cutting length", f0(L), "mm") + big("Weight", f2((Calc.barMass(d) * L) / 1000), "kg each") + "</div>" +
        '<p class="small muted">Closed link with two hooks of ' + f0(hook) + " mm, less 2d for each of three 90° bends. Your bar bending standard (for example BS 8666 shape code 51) gives the final schedule length.</p>");
    }
    const m = Calc.barMass(d), A = Calc.barArea(d);
    const tl = v.len > 0 && v.cnt > 0 ? v.len * v.cnt : NaN;
    return resWrap('<div class="grid2">' + big("Mass", f3(m), "kg/m") + big("Area", f0(A), "mm²") + "</div>" +
      (isNum(tl) ? '<div class="grid3">' + stat("Total length", f1(tl), "m") + stat("Total mass", f1(m * tl), "kg") + stat("Tonnes", f3((m * tl) / 1000), "t") + "</div>" : "") + '<p class="small muted">Mass = d² ÷ 162 kg/m.</p>');
  } },
{ id: "pit", g: "Earthworks", ic: "earth", t: "Excavation and backfill", d: "Pit volume with working space and slopes, tipper loads, layers", rules: ["ew-excavation", "ew-compaction"], kw: "excavation pit volume bulking side slope working space backfill layers trucks",
  f: [{ k: "L", l: "Footing length", u: "m", d: "6" }, { k: "W", l: "Footing width", u: "m", d: "4" }, { k: "D", l: "Excavation depth", u: "m", d: "2" }, { k: "ws", l: "Working space each side", u: "m", d: "0.6" },
    { k: "sl", l: "Side slope, horizontal per 1 vertical", u: "H:1", d: "0.5" }, { k: "bulk", l: "Bulking", u: "%", d: "25" }, { k: "cap", l: "Tipper load", u: "m³", d: "16" },
    { k: "sv", l: "Structure volume below ground", u: "m³", d: "" }, { k: "layer", l: "Backfill layer, loose", u: "mm", d: "200" }],
  calc(v) {
    if (!(v.L > 0 && v.W > 0 && v.D > 0)) return need("Enter the footing size and the depth.");
    const p = Calc.pitVolume(v.L, v.W, v.D, isNum(v.ws) ? v.ws : 0, isNum(v.sl) ? v.sl : 0);
    const loose = p.vol * (1 + (isNum(v.bulk) ? v.bulk : 0) / 100);
    const back = v.sv > 0 ? Math.max(0, p.vol - v.sv) : NaN;
    const lay = v.layer > 0 ? v.layer : 200;
    const layers = Calc.layersFor(v.D, lay);
    const items = [];
    if (v.D >= 1.5) items.push(["warn", "1.5 m or deeper: needs a designed support system, submitted at least 1 week before work.", "S12 P02"]);
    items.push(["ok", "The Engineer inspects the formation; take out the last layer just before construction and compact it to 95 % MDD.", "S12 P02"]);
    items.push(["ok", "Backfill in " + plural(layers, "layer") + " of up to " + f0(lay) + " mm loose, with at least " + plural(Calc.fdtArea(p.top[0] * p.top[1], 1), "density test") + " per layer (1 per 200 m²).", "S12 P03 §3.5"]);
    return resWrap('<div class="grid2">' + big("Excavation", f1(p.vol), "m³ in place") + big("Tipper loads", Calc.trucks(loose, v.cap > 0 ? v.cap : 16)) + "</div>" +
      '<div class="grid3">' + stat("Loose volume", f1(loose), "m³") + stat("Top of pit", f1(p.top[0]) + " × " + f1(p.top[1]), "m") + stat("Backfill", isNum(back) ? f1(back) : "–", "m³") + "</div>" + reasons(items));
  } },
{ id: "fdt", g: "Earthworks", ic: "gauge", t: "Field density check", d: "Relative compaction and moisture against the Proctor result", rules: ["ew-compaction", "ew-fill"], kw: "field density test fdt sand cone nuclear compaction 95 percent mdd omc moisture",
  f: [{ k: "wet", l: "Wet (bulk) density", u: "Mg/m³", d: "2.15" }, { k: "w", l: "Field moisture", u: "%", d: "7.5" }, { k: "mdd", l: "Maximum dry density (lab)", u: "Mg/m³", d: "2.08" }, { k: "omc", l: "Optimum moisture (lab)", u: "%", d: "8.0" }],
  calc(v) {
    const x = Calc.fdt(v.wet, v.w, v.mdd, v.omc);
    if (!x) return need("Enter wet density, moisture and MDD.");
    return resWrap(headline(big("Compaction", f1(x.rc), "% MDD"), x.ok ? "ok" : "bad", x.ok ? "Pass" : "Fail") +
      '<div class="grid2">' + stat("Dry density", f3(x.dry), "Mg/m³") + stat("Moisture vs OMC", isNum(x.dW) ? (x.dW >= 0 ? "+" : "") + f1(x.dW) : "–", "%") + "</div>" +
      reasons([[x.okRC ? "ok" : "stop", "At least 95 % of MDD.", "S12 P03 §3.5"], [x.okW === null ? "warn" : x.okW ? "ok" : "stop", "Moisture within ±3 % of optimum.", "S12 P03 §3.5"]]));
  } },
{ id: "block", g: "Masonry and finishes", ic: "bricks", t: "Blockwork and mortar", d: "Blocks, mortar, cement bags and sand", rules: ["ms-mortar", "ms-laying"], kw: "blockwork blocks per m2 mortar cement bags sand quantity",
  f: [{ k: "area", l: "Wall area", u: "m²", d: "100" }, { k: "open", l: "Openings to deduct", u: "m²", d: "8" }, { k: "bl", l: "Block length", u: "mm", d: "400" }, { k: "bh", l: "Block height", u: "mm", d: "200" },
    { k: "t", l: "Wall thickness", u: "mm", d: "200" }, { k: "j", l: "Joint", u: "mm", d: "10" }, { k: "hollow", l: "Hollow blocks", t: "toggle", d: true }, { k: "waste", l: "Block waste", u: "%", d: "5" },
    { k: "cls", l: "Mortar class", t: "sel", o: Object.keys(MORTAR_T21).map((k) => [k, k + " (" + MORTAR_T21[k].mpa + " MPa)"]), d: "M6" }],
  calc(v) {
    const net = (v.area || 0) - (isNum(v.open) ? v.open : 0);
    if (!(net > 0 && v.bl > 0 && v.bh > 0 && v.t > 0)) return need("Enter the wall area and block size.");
    const b = Calc.blockwork(net, v.bl, v.bh, isNum(v.j) ? v.j : 10, v.t, v.hollow, isNum(v.waste) ? v.waste : 0);
    const m = Calc.mortarMaterials(b.mortar, v.cls, MORTAR_T21);
    return resWrap('<div class="grid2">' + big("Blocks", f0(Math.ceil(b.blocks))) + big("Mortar", f2(b.mortar), "m³") + "</div>" +
      '<div class="grid3">' + stat("Per m²", f2(b.perM2), "blocks") + stat("Cement", m ? f0(Math.ceil(m.bags)) : "–", "50 kg bags") + stat("Sand", m ? f2(m.sandM3) : "–", "m³") + "</div>" +
      '<p class="small muted">Net area ' + f1(net) + " m². Mortar includes 10 % losses" + (v.hollow ? ", bedded on the shells only (60 %)" : "") + ". Cement and sand split by the " + esc(v.cls) + " cement:sand mass ratio in Table 2.1, taking 1,850 kg of dry mix per m³.</p>");
  } },
{ id: "plaster", g: "Masonry and finishes", ic: "layers", t: "Plaster quantities", d: "Cement bags and sand for a cement:sand mix", rules: [], kw: "plaster render cement sand ratio 1:4 bags thickness",
  f: [{ k: "area", l: "Area", u: "m²", d: "100" }, { k: "thk", l: "Thickness", u: "mm", d: "15" }, { k: "x", l: "Mix, cement : sand", t: "sel", o: [["3", "1 : 3"], ["4", "1 : 4"], ["5", "1 : 5"], ["6", "1 : 6"]], d: "4" }, { k: "waste", l: "Waste", u: "%", d: "10" }],
  calc(v) {
    if (!(v.area > 0 && v.thk > 0)) return need("Enter the area and thickness.");
    const p = Calc.plaster(v.area, v.thk, num(v.x), isNum(v.waste) ? v.waste : 0);
    return resWrap('<div class="grid2">' + big("Cement", f0(Math.ceil(p.bags)), "bags") + big("Sand", f2(p.sandM3), "m³") + "</div>" +
      '<div class="grid2">' + stat("Wet volume", f2(p.wet), "m³") + stat("Cement", f0(p.cementKg), "kg") + "</div>" +
      '<p class="small muted">Dry volume = wet × 1.27, cement at 1,440 kg/m³. A rule-of-thumb estimate for ordering, not a QCS requirement.</p>');
  } },
{ id: "freq", g: "Testing and QA", ic: "checks", t: "Tests you owe", d: "Testing frequency from QCS Appendix A", rules: ["qa-freq", "mix-cubes", "rb-testing", "ew-compaction"], kw: "testing frequency appendix a how many tests cubes rebar couplers fdt blocks",
  f: [{ k: "conc", l: "Concrete placed", u: "m³", d: "" }, { k: "mixes", l: "Mixes per day", u: "no.", d: "1" }, { k: "steel", l: "Rebar delivered, one diameter", u: "t", d: "" }, { k: "coup", l: "Mechanical couplers", u: "no.", d: "" },
    { k: "red", l: "Coupler rate reduced after consecutive passes", t: "toggle", d: false }, { k: "area", l: "Fill area per layer", u: "m²", d: "" }, { k: "layers", l: "Layers", u: "no.", d: "1" },
    { k: "trench", l: "Trench backfill length", u: "m", d: "" }, { k: "units", l: "Blocks delivered, one type", u: "no.", d: "" }, { k: "warea", l: "Blockwork area", u: "m²", d: "" }],
  calc(v) {
    const rows = [];
    const lay = v.layers > 0 ? v.layers : 1;
    if (v.conc > 0) { const p = Calc.cubePlan(v.conc, v.mixes > 0 ? v.mixes : 1, 6, 30); rows.push(["Cube sets", p.sets, "6 cubes each: 1 per 30 m³ and at least 1 per mix per day"]); }
    if (v.steel > 0) rows.push(["Rebar test sets", Calc.rebarTests(v.steel), "tensile, bend and rebend: 1 per 30 t per diameter"]);
    if (v.coup > 0) rows.push(["Coupler tests", Calc.couplerTests(v.coup, v.red), v.red ? "1 per 250 splices" : "1 per 100 splices"]);
    if (v.area > 0) rows.push(["Field density, open areas", Calc.fdtArea(v.area, lay), "1 per 200 m² per layer"]);
    if (v.trench > 0) rows.push(["Field density, trenches", Calc.fdtTrench(v.trench, lay), "1 per 20 m per layer"]);
    if (v.units > 0 || v.warea > 0) { const a = v.units > 0 ? Math.ceil(v.units / 5000 - 1e-9) : 0, b = v.warea > 0 ? Math.ceil(v.warea / 1000 - 1e-9) : 0; rows.push(["Block test samples", Math.max(a, b, 1), "1 per 5,000 units or 1 per 1,000 m², per type and batch"]); }
    if (!rows.length) return need("Enter any of the quantities above.");
    return resWrap('<div class="scroll-x"><table class="t"><tbody>' + rows.map((r) => "<tr><td><b>" + esc(r[0]) + '</b><div class="tiny muted">' + esc(r[2]) + '</div></td><td class="n big-n">' + r[1] + "</td></tr>").join("") + "</tbody></table></div>" +
      '<p class="small muted">Appendix A frequencies apply even when manufacturer certificates exist. Your ITP may ask for more.</p>');
  } },
{ id: "tank", g: "Testing and QA", ic: "drop", t: "Water tightness test", d: "Pass or fail for tanks, sumps and pits", rules: ["wr-test"], kw: "water tightness test tank reservoir leakage 1/500 10 mm hook gauge",
  f: [{ k: "depth", l: "Average water depth", u: "m", d: "4" }, { k: "fall", l: "Measured drop over the 7-day test", u: "mm", d: "" }, { k: "tray", l: "Tray drop (evaporation, net of rain)", u: "mm", d: "" }],
  calc(v) {
    if (!(v.depth > 0)) return need("Enter the water depth.");
    const notes = reasons([["ok", "Test at least 28 days after the last pour; fill at most 1 m per 24 h, let it stabilise 21 days, then test for 7 days.", "S05 P19"], ["warn", "Visible leaks or damp patches are repaired from the water face even if the test passes.", "S05 P19"]]);
    if (!isNum(v.fall)) return resWrap(big("Allowed drop", f1(Math.min((v.depth * 1000) / 500, 10)), "mm") + '<p class="small">1/500 of the average depth or 10 mm, whichever is less, after allowing for evaporation and rain.</p>' + notes);
    const t = Calc.tankTest(v.depth, v.fall, v.tray);
    return resWrap(headline(big("Net drop", f1(t.net), "mm"), t.ok ? "ok" : "bad", t.ok ? "Pass" : "Fail") + stat("Allowed", f1(t.limit), "mm") + notes);
  } },
{ id: "conv", g: "General", ic: "convert", t: "Unit converter", d: "Stress, length, area, volume, force, density, mass, temperature", rules: [], kw: "convert units psi mpa kg/cm2 ksi feet inches fahrenheit",
  f: [{ k: "cat", l: "Quantity", t: "sel", o: Object.entries(Calc.UNITS).map(([k, u]) => [k, u.label]).concat([["temp", "Temperature"]]), d: "pressure" },
    { k: "val", l: "Value", u: "", d: "1" }, { k: "from", l: "From", t: "sel", o: (v) => unitOpts(v.cat), d: "MPa", di: 0 }, { k: "to", l: "To", t: "sel", o: (v) => unitOpts(v.cat), d: "psi", di: 1 }],
  calc(v) {
    if (!isNum(v.val)) return need("Enter a value.");
    const units = unitOpts(v.cat).map((o) => o[0]);
    const cv = (to) => (v.cat === "temp" ? Calc.convertTemp(v.val, v.from, to) : Calc.convert(v.cat, v.val, v.from, to));
    return resWrap(big(v.to, fmtN(cv(v.to), 4)) + '<div class="scroll-x"><table class="t"><tbody>' + units.map((u) => "<tr><td>" + esc(u) + '</td><td class="n">' + fmtN(cv(u), 5) + "</td></tr>").join("") + "</tbody></table></div>");
  } }
];
const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
const TOOL_GROUPS = ["Concrete", "Formwork and rebar", "Earthworks", "Masonry and finishes", "Testing and QA", "General"];

/* ---- generic tool engine ---- */
function toolRaw(t) {
  const saved = Local.get("tool." + t.id, {});
  const v = {};
  t.f.forEach((f) => { const d = typeof f.d === "function" ? f.d() : f.d; v[f.k] = saved[f.k] !== undefined ? saved[f.k] : d; });
  return v;
}
function toolParse(t, raw) {
  const V = {};
  t.f.forEach((f) => { const x = raw[f.k]; V[f.k] = f.t === "toggle" ? !!x : f.t ? (x == null ? "" : String(x)) : num(x); });
  return V;
}
function optsHtml(opts, val) { return opts.map((o) => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>").join(""); }
function fieldHtml(f, raw, V) {
  const val = raw[f.k];
  const hid = f.show && !f.show(V) ? " hidden" : "";
  const w = ' data-fk="' + f.k + '"' + hid;
  if (f.t === "toggle") return '<label class="switch full"' + w + "><span>" + esc(f.l) + '</span><input type="checkbox" data-k="' + f.k + '"' + (val ? " checked" : "") + "></label>";
  if (f.t === "sel") { const o = typeof f.o === "function" ? f.o(V) : f.o; return '<label class="f"' + w + ">" + esc(f.l) + '<select class="in" data-k="' + f.k + '">' + optsHtml(o, val) + "</select></label>"; }
  if (f.t === "time" || f.t === "date") return '<label class="f"' + w + ">" + esc(f.l) + '<input class="in" type="' + f.t + '" data-k="' + f.k + '" value="' + esc(val) + '"></label>';
  if (f.t === "list") return '<label class="f full"' + w + ">" + esc(f.l) + '<textarea class="in num" rows="2" data-k="' + f.k + '" placeholder="' + esc(f.ph || "") + '">' + esc(val) + "</textarea></label>";
  return '<label class="f"' + w + ">" + esc(f.l) + '<span class="unit"><input class="in num" inputmode="decimal" data-k="' + f.k + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || "") + '"><span>' + esc(f.u || "") + "</span></span></label>";
}
function readRaw(t, root) {
  const raw = {};
  t.f.forEach((f) => { const el = root.querySelector('[data-k="' + f.k + '"]'); if (el) raw[f.k] = f.t === "toggle" ? el.checked : el.value; });
  return raw;
}

VIEWS.tools = {
  tab: "tools", title: "Tools",
  render() {
    return '<div class="stack"><div><div class="eyebrow">Site calculators and records</div><h2 class="sec" style="margin-top:6px">Tools</h2></div>' +
      '<div class="grid2">' + tile("report", "report", "Daily report", "Manpower, absentees, output, WhatsApp text", "accent") +
        tile("doctor", "camera", "Defect Doctor", "Photo of a defect: causes and repairs (AI)") + "</div>" +
      TOOL_GROUPS.map((g) => '<div class="stack" style="gap:8px"><div class="grp-h">' + esc(g) + '</div><div class="grid2">' + TOOLS.filter((t) => t.g === g).map((t) => tile("tool-" + t.id, t.ic, t.t, t.d)).join("") + "</div></div>").join("") +
      "</div>";
  }
};
VIEWS.tool = {
  tab: "tools", back: "tools", title: (id) => (TOOL_BY_ID[id] || {}).t,
  render(id) {
    const t = TOOL_BY_ID[id];
    if (!t) return notFound("tools");
    const raw = toolRaw(t), V = toolParse(t, raw);
    const rules = (t.rules || []).map((r) => RULE_BY_ID[r]).filter(Boolean);
    return '<div class="stack"><div><div class="eyebrow">' + esc(t.g) + '</div><h2 class="sec" style="margin-top:6px">' + esc(t.t) + '</h2><p class="lede" style="margin-top:6px">' + esc(t.d) + "</p></div>" +
      '<div class="card"><div class="grid2" id="toolForm">' + t.f.map((f) => fieldHtml(f, raw, V)).join("") + "</div></div>" +
      '<div id="toolOut" aria-live="polite"></div>' +
      '<div class="row">' + (t.remind ? '<button class="btn sm primary" data-act="toolRemind">' + ico("bell") + "Set reminders</button>" : "") +
        '<button class="btn sm" data-act="toolCopy">' + ico("copy") + 'Copy result</button><button class="btn sm ghost" data-act="toolReset">Reset inputs</button></div>' +
      (rules.length ? '<section class="card stack" style="gap:10px"><h3 class="card-t">QCS behind this</h3><div class="list">' + rules.map(ruleItem).join("") + "</div></section>" : "") +
      "</div>";
  },
  mount(id) {
    const t = TOOL_BY_ID[id];
    if (!t) return;
    const form = $("#toolForm");
    const update = () => {
      let raw = readRaw(t, form);
      let V = toolParse(t, raw);
      t.f.forEach((f) => {
        if (typeof f.o !== "function") return;
        const el = form.querySelector('[data-k="' + f.k + '"]');
        const opts = f.o(V);
        const sig = opts.map((o) => o[0]).join("|");
        if (el.dataset.sig !== sig) {
          const keep = opts.some((o) => String(o[0]) === el.value) && el.dataset.sig ? el.value : String((opts[f.di || 0] || opts[0])[0]);
          el.innerHTML = optsHtml(opts, keep);
          el.value = keep;
          el.dataset.sig = sig;
        }
      });
      raw = readRaw(t, form);
      V = toolParse(t, raw);
      t.f.forEach((f) => { if (f.show) { const w = form.querySelector('[data-fk="' + f.k + '"]'); if (w) w.hidden = !f.show(V); } });
      let html;
      try { html = t.calc(V); } catch (e) { console.error(e); html = need("Check the inputs."); }
      $("#toolOut").innerHTML = html;
      Local.set("tool." + t.id, raw);
    };
    t.f.forEach((f) => { if (typeof f.o === "function") { const el = form.querySelector('[data-k="' + f.k + '"]'); el.dataset.sig = f.o(toolParse(t, readRaw(t, form))).map((o) => o[0]).join("|"); } });
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
  }
};
ACTIONS.toolCopy = () => {
  const t = TOOL_BY_ID[State.arg];
  if (!t) return;
  const form = $("#toolForm");
  const lines = [t.t];
  t.f.forEach((f) => {
    const w = form.querySelector('[data-fk="' + f.k + '"]');
    const el = form.querySelector('[data-k="' + f.k + '"]');
    if (!el || (w && w.hidden)) return;
    let val = f.t === "toggle" ? (el.checked ? "yes" : "no") : f.t === "sel" ? (el.options[el.selectedIndex] || {}).text : el.value;
    if (val === "" || val == null) return;
    lines.push(f.l + ": " + val + (f.u ? " " + f.u : ""));
  });
  lines.push("", $("#toolOut").innerText.trim());
  copyText(lines.join("\n"));
};
ACTIONS.toolReset = () => { Local.set("tool." + State.arg, {}); route(true); };
ACTIONS.toolRemind = () => {
  const t = TOOL_BY_ID[State.arg];
  if (!t || !t.remind) return;
  const items = t.remind(toolParse(t, readRaw(t, $("#toolForm"))));
  if (!items.length) { toast("Fill in the dates first."); return; }
  Reminders.add(items);
};
