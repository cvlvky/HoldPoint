/* Pure calculation functions. No DOM. Exported for node tests. */
const Calc = (function () {
  "use strict";
  const isNum = (x) => typeof x === "number" && Number.isFinite(x);
  const round = (x, d = 2) => (isNum(x) ? Math.round(x * Math.pow(10, d)) / Math.pow(10, d) : NaN);

  /* ---------- time helpers (minutes from midnight) ---------- */
  function toMin(hhmm) {
    if (typeof hhmm !== "string") return NaN;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    const h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return NaN;
    return h * 60 + mi;
  }
  function fromMin(min) {
    if (!isNum(min)) return "--:--";
    const t = ((Math.round(min) % 1440) + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }
  /* elapsed minutes from a to b on the same or next day */
  function elapsed(a, b) {
    if (!isNum(a) || !isNum(b)) return NaN;
    let d = b - a;
    if (d < 0) d += 1440;
    return d;
  }
  /* does the interval [s, e] (minutes, may cross midnight) overlap [ws, we)? */
  function overlaps(s, e, ws, we) {
    if (!isNum(s) || !isNum(e)) return false;
    const segs = e >= s ? [[s, e]] : [[s, 1440], [0, e]];
    return segs.some(([a, b]) => a < we && b > ws);
  }
  const QCS_NO_POUR = [600, 1020]; /* 10:00–17:00 in hot-weather period, S05 P15 §15.3 */
  const MOL_BAN = [600, 930]; /* 10:00–15:30, 1 Jun–15 Sep, MoL Decision 17/2021 */
  function inMolSeason(month, day) { /* month 1-12 */
    if (month < 6 || month > 9) return false;
    if (month === 9 && day > 15) return false;
    return true;
  }

  /* ---------- volumes ---------- */
  const volBox = (L, W, D) => L * W * D;
  const volCyl = (dia, H) => (Math.PI * dia * dia / 4) * H;
  /* staircase flight: waist slab along slope + triangular steps */
  function volStair(width, going, riser, steps, waist) {
    const slopeLen = Math.sqrt(going * going + riser * riser) * steps;
    return width * waist * slopeLen + width * (going * riser / 2) * steps;
  }
  /* prismoid for a pit with working space and side slope (H:V = slope:1) */
  function pitVolume(L, W, D, ws, slope) {
    const Lb = L + 2 * ws, Wb = W + 2 * ws;
    const Lt = Lb + 2 * D * slope, Wt = Wb + 2 * D * slope;
    const A1 = Lb * Wb, A2 = Lt * Wt, Am = ((Lb + Lt) / 2) * ((Wb + Wt) / 2);
    return { vol: (D / 6) * (A1 + 4 * Am + A2), top: [Lt, Wt], bottom: [Lb, Wb] };
  }
  const trucks = (vol, cap) => (vol > 0 && cap > 0 ? Math.ceil(vol / cap - 1e-9) : 0);

  /* ---------- pour planning ---------- */
  function pourPlan({ vol, rate, start, setup = 30, cap = 10, hotPeriod = false }) {
    const hours = vol > 0 && rate > 0 ? vol / rate : NaN;
    const s = start;
    const pourStart = s + setup;
    const end = pourStart + hours * 60;
    const nTrucks = trucks(vol, cap);
    const perHour = rate > 0 && cap > 0 ? rate / cap : NaN;
    const clash = hotPeriod && overlaps(pourStart, end, QCS_NO_POUR[0], QCS_NO_POUR[1]);
    /* latest start that still finishes by 10:00, and earliest start after 17:00 */
    const latestMorningStart = QCS_NO_POUR[0] - hours * 60 - setup;
    return { hours, pourStart, end, nTrucks, perHour, clash, latestMorningStart, eveningStart: QCS_NO_POUR[1] - setup };
  }

  /* ---------- hot weather ---------- */
  /* Uno (1998) evaporation, as given in ACI 305R. Tc, Ta in °C, RH in %, V in km/h; result kg/m²/h */
  function evaporation(Tc, Ta, RH, V) {
    if (![Tc, Ta, RH, V].every(isNum)) return NaN;
    const e = 5 * (Math.pow(Tc + 18, 2.5) - (RH / 100) * Math.pow(Ta + 18, 2.5)) * (V + 4) * 1e-6;
    return Math.max(0, e);
  }

  /* ---------- go / no-go ---------- */
  /* returns {verdict:'GO'|'HOLD', items:[{sev:'stop'|'warn'|'ok', msg, ref}]} */
  function goNoGo(p) {
    const items = [];
    const add = (sev, msg, ref) => items.push({ sev, msg, ref });
    const hi32 = p.trialsApproved ? 35 : 32;
    if (isNum(p.concT)) {
      if (p.concT > 35) add("stop", "Concrete at " + p.concT + " °C is above the absolute 35 °C limit.", "S05 P15 §15.2.2");
      else if (p.concT > hi32) add("stop", "Concrete at " + p.concT + " °C exceeds 32 °C. A higher limit needs trials approved by the Engineer.", "S05 P15 §15.2.2");
      else add("ok", "Concrete temperature " + p.concT + " °C is within the limit.", "S05 P15 §15.2.2");
    } else add("warn", "Measure the concrete temperature of the first truck before placing.", "S05 P15 §15.2.4");
    if (isNum(p.shadeT)) {
      if (p.shadeT > 40) add("stop", "Shade temperature " + p.shadeT + " °C is above 40 °C: no concreting.", "S05 P15 §15.2.3");
      else add("ok", "Shade temperature " + p.shadeT + " °C.", "S05 P15 §15.2.3");
    }
    if (p.hotPeriod && isNum(p.now)) {
      if (overlaps(p.now, p.now + (isNum(p.durMin) ? p.durMin : 1), QCS_NO_POUR[0], QCS_NO_POUR[1]))
        add("stop", "Hot-weather period: no concreting between 10:00 and 17:00" + (isNum(p.durMin) && p.durMin > 1 ? " (the planned pour runs into this window)." : "."), "S05 P15 §15.3.1");
      else add("ok", "Outside the 10:00–17:00 hot-weather window.", "S05 P15 §15.3.1");
    }
    if (p.molSeason && isNum(p.now) && overlaps(p.now, p.now + (isNum(p.durMin) ? p.durMin : 1), MOL_BAN[0], MOL_BAN[1]))
      add("stop", "Summer midday ban: no outdoor work 10:00–15:30 (1 June – 15 September).", "MoL Decision 17/2021");
    if (isNum(p.wbgt)) {
      if (p.wbgt > 32.1) add("stop", "WBGT " + p.wbgt + " °C is above 32.1 °C: stop outdoor work.", "MoL Decision 17/2021");
      else add("ok", "WBGT " + p.wbgt + " °C is below 32.1 °C.", "MoL Decision 17/2021");
    }
    if (p.dust) add("stop", "Dust storm: no concreting.", "S05 P08 §8.3.3.13");
    if (p.rain) add("stop", "Heavy rain: pour only if mixing, transport and placing are fully covered.", "S05 P08 §8.3.3.12");
    if (p.approved === false) add("stop", "Base, formwork and reinforcement are not yet approved in writing.", "S05 P08 §8.3.2.1");
    else if (p.approved === true && isNum(p.approvalAgeH)) {
      if (p.approvalAgeH > 24) add("stop", "Approval is older than 24 h: get it renewed before pouring.", "S05 P08 §8.3.2.1");
      else add("ok", "Written approval is valid (" + Math.round(p.approvalAgeH) + " h old).", "S05 P08 §8.3.2.1");
    } else if (p.approved === true) add("ok", "Written approval received. Pour within 24 h of it.", "S05 P08 §8.3.2.1");
    if (isNum(p.evap)) {
      if (p.evap > 0.75) add("warn", "Evaporation " + round(p.evap, 2) + " kg/m²/h is above 0.75: hot-weather precautions and immediate curing.", "S05 P15 §15.1.3");
      else add("ok", "Evaporation " + round(p.evap, 2) + " kg/m²/h.", "S05 P15 §15.1.3");
    }
    const verdict = items.some((i) => i.sev === "stop") ? "HOLD" : "GO";
    return { verdict, items };
  }

  /* ---------- fresh concrete ---------- */
  function slumpTol(target) {
    if (!isNum(target)) return [NaN, NaN];
    if (target <= 40) return [-30, 40];
    if (target < 100) return [-40, 50];
    return [-50, 60];
  }
  function slumpCheck(target, measured) {
    const [lo, hi] = slumpTol(target);
    const min = target + lo, max = target + hi;
    return { min, max, ok: isNum(measured) && measured >= min && measured <= max };
  }
  /* truck row check */
  function truckCheck(row, opts = {}) {
    const flags = [];
    const tmax = opts.trialsApproved ? 35 : 32;
    const age = elapsed(toMin(row.batch), toMin(row.discharge || row.arrival));
    if (isNum(age)) {
      if (age > 90) flags.push({ sev: "stop", msg: "Age " + Math.round(age) + " min exceeds 90 min" });
    }
    const t = parseFloat(row.temp);
    if (isNum(t)) {
      if (t > 35) flags.push({ sev: "stop", msg: t + " °C over 35 °C" });
      else if (t > tmax) flags.push({ sev: "stop", msg: t + " °C over " + tmax + " °C" });
    }
    const sl = parseFloat(row.slump), tg = parseFloat(opts.target);
    if (isNum(sl) && isNum(tg)) {
      const c = slumpCheck(tg, sl);
      if (!c.ok) flags.push({ sev: "stop", msg: "Slump " + sl + " outside " + c.min + "–" + c.max });
    }
    return { age, flags, ok: flags.length === 0 };
  }

  /* ---------- strength ---------- */
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  /* results: array of test results (each already the mean of ≥2 specimens) */
  function acceptEN(fck, results) {
    const r = results.filter(isNum);
    if (!r.length || !isNum(fck)) return null;
    const m = mean(r);
    const minR = Math.min.apply(null, r);
    return { mean: m, min: minR, needMean: fck + 2, needEach: fck - 4, okMean: m >= fck + 2, okEach: minR >= fck - 4, ok: m >= fck + 2 && minR >= fck - 4 };
  }
  function acceptACI(fc, results) {
    const r = results.filter(isNum);
    if (!r.length || !isNum(fc)) return null;
    const floor = fc <= 35 ? fc - 3.5 : 0.9 * fc;
    const triples = [];
    for (let i = 0; i + 2 < r.length; i++) triples.push(mean(r.slice(i, i + 3)));
    const okEach = r.every((x) => x >= floor);
    const okTriples = triples.every((x) => x >= fc);
    return { floor, triples, okEach, okTriples, ok: okEach && okTriples, enough: r.length >= 3 };
  }
  function specimenRange(specs) {
    const s = specs.filter(isNum);
    if (s.length < 2) return null;
    const m = mean(s), rng = Math.max.apply(null, s) - Math.min.apply(null, s);
    return { mean: m, rangePct: (rng / m) * 100, flag: rng / m > 0.15 };
  }
  /* target mean strength, S05 P06 §6.6 */
  function targetMean(fc, Ss, nTests) {
    if (!isNum(fc)) return NaN;
    if (!isNum(Ss) || !isNum(nTests) || nTests < 15) return fc <= 35 ? fc + 8.5 : 1.1 * fc + 5;
    let k = 1;
    if (nTests < 30) {
      const pts = [[15, 1.16], [20, 1.08], [25, 1.03], [30, 1.0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [n1, k1] = pts[i], [n2, k2] = pts[i + 1];
        if (nTests >= n1 && nTests <= n2) { k = k1 + ((nTests - n1) / (n2 - n1)) * (k2 - k1); break; }
      }
    }
    const s = Ss * k;
    const a = fc + 1.65 * s;
    const b = fc <= 35 ? fc + 2.33 * s - 3.5 : 0.9 * fc + 2.33 * s;
    return Math.max(a, b);
  }

  /* ---------- cube planning ---------- */
  function cubePlan(vol, mixesPerDay, perSet, rate) {
    const r = rate || 30;
    const byVol = vol > 0 ? Math.ceil(vol / r - 1e-9) : 0;
    const sets = Math.max(byVol, mixesPerDay || 1);
    return { sets, specimens: sets * (perSet || 6), byVol };
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr + "T12:00:00Z");
    if (isNaN(d)) return "";
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* ---------- mass concrete ---------- */
  function massCheck({ core, surface, place, drop24 }) {
    const out = [];
    if (isNum(place)) out.push({ ok: place <= 27, msg: "Placing temperature " + place + " °C (limit 27 °C)" });
    if (isNum(core) && isNum(surface)) out.push({ ok: core - surface <= 20, msg: "Core–surface difference " + round(core - surface, 1) + " °C (limit 20 °C)" });
    if (isNum(core)) out.push({ ok: core <= 70, msg: "Peak core temperature " + core + " °C (limit 70 °C)" });
    if (isNum(drop24)) out.push({ ok: drop24 <= 11, msg: "Drop in 24 h after curing " + drop24 + " °C (limit 11 °C)" });
    return out;
  }

  /* ---------- rebar ---------- */
  const barMass = (d) => (d * d) / 162; /* kg/m */
  const barArea = (d) => (Math.PI * d * d) / 4; /* mm² */
  const barsAlong = (lenM, spacing) => (lenM > 0 && spacing > 0 ? Math.floor((lenM * 1000) / spacing + 1e-9) + 1 : 0);
  const areaPerM = (d, spacing) => (spacing > 0 ? (barArea(d) * 1000) / spacing : NaN);
  const rebarTests = (tonnes) => (tonnes > 0 ? Math.ceil(tonnes / 30 - 1e-9) : 0);
  const couplerTests = (n, reduced) => (n > 0 ? Math.ceil(n / (reduced ? 250 : 100) - 1e-9) : 0);
  /* approximate stirrup cutting length: perimeter at link centreline + 2 hooks − 3 × 90° bend deductions (2d) */
  function stirrupLength(b, hgt, cover, d, hookLen) {
    const a = b - 2 * cover - d, c = hgt - 2 * cover - d;
    if (a <= 0 || c <= 0) return NaN;
    return 2 * (a + c) + 2 * hookLen - 3 * 2 * d;
  }

  /* ---------- earthworks ---------- */
  function fdt(wet, moisture, mdd, omc) {
    if (![wet, moisture, mdd].every(isNum) || mdd <= 0) return null;
    const dry = wet / (1 + moisture / 100);
    const rc = (dry / mdd) * 100;
    const dW = isNum(omc) ? moisture - omc : NaN;
    return { dry, rc, okRC: rc >= 95, dW, okW: isNum(dW) ? Math.abs(dW) <= 3 : null, ok: rc >= 95 && (!isNum(dW) || Math.abs(dW) <= 3) };
  }
  const fdtArea = (areaPerLayer, layers) => (areaPerLayer > 0 ? Math.ceil(areaPerLayer / 200 - 1e-9) : 0) * (layers || 1);
  const fdtTrench = (len, layers) => (len > 0 ? Math.ceil(len / 20 - 1e-9) : 0) * (layers || 1);
  const layersFor = (depthM, layerMm) => (depthM > 0 && layerMm > 0 ? Math.ceil((depthM * 1000) / layerMm - 1e-9) : 0);

  /* ---------- masonry ---------- */
  function blockwork(area, L, H, j, t, hollow, wastePct) {
    const unit = (L + j) * (H + j); /* mm² face per block incl. joint */
    const perM2 = 1e6 / unit;
    const blocks = area * perM2 * (1 + (wastePct || 0) / 100);
    const jointFrac = 1 - (L * H) / unit;
    const mortar = area * jointFrac * (t / 1000) * (hollow ? 0.6 : 1) * 1.1; /* +10 % losses */
    return { perM2, blocks, mortar };
  }
  /* dry materials for a mortar class: total dry mass per m³ (default 1850 kg) split by Table 2.1 mass ratio */
  function mortarMaterials(volM3, classKey, table, dryKgPerM3) {
    const row = table[classKey];
    if (!row || !(volM3 > 0)) return null;
    const total = (dryKgPerM3 || 1850) * volM3;
    const c = (total * row.c) / (row.c + row.s), s = (total * row.s) / (row.c + row.s);
    return { cementKg: c, bags: c / 50, sandKg: s, sandM3: s / 1600 };
  }
  /* plaster by volume ratio 1:x */
  function plaster(area, thkMm, x, wastePct) {
    const wet = area * (thkMm / 1000) * (1 + (wastePct || 0) / 100);
    const dry = wet * 1.27;
    const cemVol = dry / (1 + x);
    const cementKg = cemVol * 1440;
    return { wet, cementKg, bags: cementKg / 50, sandM3: (dry * x) / (1 + x) };
  }

  /* ---------- water-retaining test, S05 P19 §19.3.1.16 ---------- */
  function tankTest(depthM, fallMm, trayFallMm) {
    if (![depthM, fallMm].every(isNum)) return null;
    const net = fallMm - (isNum(trayFallMm) ? trayFallMm : 0);
    const limit = Math.min((depthM * 1000) / 500, 10);
    return { net, limit, ok: net <= limit };
  }

  /* ---------- units ---------- */
  const UNITS = {
    pressure: { label: "Stress / pressure", base: "MPa", u: { MPa: 1, "N/mm²": 1, kPa: 0.001, psi: 0.00689476, "kg/cm²": 0.0980665, bar: 0.1 } },
    length: { label: "Length", base: "m", u: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144 } },
    area: { label: "Area", base: "m²", u: { "mm²": 1e-6, "cm²": 1e-4, "m²": 1, "ft²": 0.09290304, "yd²": 0.83612736, acre: 4046.8564224, hectare: 10000 } },
    volume: { label: "Volume", base: "m³", u: { "m³": 1, litre: 0.001, "ft³": 0.0283168466, "yd³": 0.764554858, "US gal": 0.00378541178 } },
    force: { label: "Force", base: "kN", u: { N: 0.001, kN: 1, kgf: 0.00980665, tf: 9.80665, lbf: 0.00444822162, kip: 4.44822162 } },
    density: { label: "Density", base: "kg/m³", u: { "kg/m³": 1, "g/cm³": 1000, "t/m³": 1000, "lb/ft³": 16.0184634 } },
    mass: { label: "Mass", base: "kg", u: { g: 0.001, kg: 1, t: 1000, lb: 0.45359237 } }
  };
  function convert(cat, val, from, to) {
    const c = UNITS[cat];
    if (!c || !isNum(val) || !(from in c.u) || !(to in c.u)) return NaN;
    return (val * c.u[from]) / c.u[to];
  }
  function convertTemp(val, from, to) {
    if (!isNum(val)) return NaN;
    const c = from === "°C" ? val : from === "°F" ? (val - 32) * 5 / 9 : val - 273.15;
    return to === "°C" ? c : to === "°F" ? c * 9 / 5 + 32 : c + 273.15;
  }

  return {
    isNum, round, toMin, fromMin, elapsed, overlaps, inMolSeason, QCS_NO_POUR, MOL_BAN,
    volBox, volCyl, volStair, pitVolume, trucks, pourPlan, evaporation, goNoGo,
    slumpTol, slumpCheck, truckCheck, acceptEN, acceptACI, specimenRange, targetMean,
    cubePlan, addDays, massCheck, barMass, barArea, barsAlong, areaPerM, rebarTests, couplerTests, stirrupLength,
    fdt, fdtArea, fdtTrench, layersFor, blockwork, mortarMaterials, plaster, tankTest, UNITS, convert, convertTemp
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Calc;
