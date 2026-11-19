const C = require("../src/calc.js");
let fails = 0, n = 0;
function eq(name, got, want, tol = 1e-6) {
  n++;
  const ok = typeof want === "number" ? Math.abs(got - want) <= tol : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log("FAIL", name, "got", got, "want", want); }
}
// time
eq("toMin", C.toMin("10:30"), 630);
eq("toMin bad", Number.isNaN(C.toMin("25:00")), true);
eq("fromMin", C.fromMin(1500), "01:00");
eq("elapsed over midnight", C.elapsed(C.toMin("23:30"), C.toMin("00:45")), 75);
eq("overlap inside", C.overlaps(540, 660, 600, 1020), true);
eq("overlap before", C.overlaps(300, 600, 600, 1020), false);
eq("overlap crossing midnight", C.overlaps(1380, 120, 600, 1020), false);
eq("overlap evening", C.overlaps(1020, 1200, 600, 1020), false);
eq("mol season jun", C.inMolSeason(6, 1), true);
eq("mol season sep16", C.inMolSeason(9, 16), false);
eq("mol season sep15", C.inMolSeason(9, 15), true);
// volumes
eq("box", C.volBox(10, 5, 0.5), 25);
eq("cyl", C.volCyl(0.6, 10), Math.PI * 0.09 * 10);
// stair: width 1.2, going 0.3, riser 0.15, 10 steps, waist 0.15
const slope = Math.sqrt(0.09 + 0.0225) * 10;
eq("stair", C.volStair(1.2, 0.3, 0.15, 10, 0.15), 1.2 * 0.15 * slope + 1.2 * 0.0225 * 10);
const pit = C.pitVolume(10, 8, 2, 0.5, 0.5); // bottom 11x9, top 13x11
eq("pit vol", pit.vol, (2 / 6) * (99 + 4 * 12 * 10 + 143));
eq("trucks", C.trucks(31, 10), 4);
eq("trucks exact", C.trucks(30, 10), 3);
// pour plan
const pp = C.pourPlan({ vol: 120, rate: 30, start: C.toMin("04:00"), setup: 30, cap: 10, hotPeriod: true });
eq("pour hours", pp.hours, 4);
eq("pour end", C.fromMin(pp.end), "08:30");
eq("pour clash", pp.clash, false);
const pp2 = C.pourPlan({ vol: 200, rate: 30, start: C.toMin("05:00"), setup: 30, cap: 10, hotPeriod: true });
eq("pour clash2", pp2.clash, true);
eq("latest start", C.fromMin(pp2.latestMorningStart), "02:50");
// evaporation (hand calc ≈ 1.18)
eq("evap", C.round(C.evaporation(30, 35, 30, 20), 2), 1.18, 0.01);
// go/no-go
let g = C.goNoGo({ concT: 31, shadeT: 38, hotPeriod: true, now: C.toMin("06:00"), approved: true, approvalAgeH: 5 });
eq("go", g.verdict, "GO");
g = C.goNoGo({ concT: 33, shadeT: 38, hotPeriod: false, approved: true, approvalAgeH: 5 });
eq("hold 33", g.verdict, "HOLD");
g = C.goNoGo({ concT: 33, trialsApproved: true, approved: true, approvalAgeH: 2 });
eq("go 33 with trials", g.verdict, "GO");
g = C.goNoGo({ concT: 30, hotPeriod: true, now: C.toMin("08:00"), durMin: 180, approved: true, approvalAgeH: 2 });
eq("hold window", g.verdict, "HOLD");
g = C.goNoGo({ concT: 30, approved: true, approvalAgeH: 26 });
eq("hold stale approval", g.verdict, "HOLD");
// slump
eq("slump tol 75", C.slumpTol(75), [-40, 50]);
eq("slump check", C.slumpCheck(100, 45).ok, false);
eq("slump check ok", C.slumpCheck(100, 150).ok, true);
eq("slump 30", C.slumpCheck(30, 0).ok, true);
// truck
const tc = C.truckCheck({ batch: "05:00", discharge: "06:40", temp: "31", slump: "120" }, { target: 100 });
eq("truck age", tc.age, 100);
eq("truck flags", tc.flags.length, 1);
// strength
const en = C.acceptEN(40, [43, 41, 44]);
eq("EN mean", C.round(en.mean, 3), 42.667, 0.001);
eq("EN ok", en.ok, true);
eq("EN fail each", C.acceptEN(40, [45, 35.9, 47]).okEach, false);
const aci = C.acceptACI(32, [30, 33, 34, 29]);
eq("ACI triples", aci.triples.map((x) => C.round(x, 3)), [32.333, 32]);
eq("ACI ok", aci.ok, true);
eq("ACI floor high", C.acceptACI(40, [40, 40, 40]).floor, 36);
eq("range flag", C.specimenRange([40, 47]).flag, true);
eq("target no records", C.targetMean(30, NaN, 0), 38.5);
eq("target no records high", C.targetMean(40, NaN, 0), 49);
eq("target 30 tests", C.round(C.targetMean(30, 4, 30), 3), Math.max(30 + 1.65 * 4, 30 + 2.33 * 4 - 3.5));
eq("target 20 tests k", C.round(C.targetMean(40, 4, 20), 4), C.round(Math.max(40 + 1.65 * 4 * 1.08, 0.9 * 40 + 2.33 * 4 * 1.08), 4));
// cubes
eq("cube plan", C.cubePlan(95, 1, 6), { sets: 4, specimens: 24, byVol: 4 });
eq("cube plan small", C.cubePlan(12, 2, 7), { sets: 2, specimens: 14, byVol: 1 });
eq("addDays", C.addDays("2026-11-19", 28), "2026-12-17");
// rebar
eq("bar mass 16", C.round(C.barMass(16), 3), 1.58, 0.001);
eq("bars along", C.barsAlong(3, 150), 21);
eq("area per m", C.round(C.areaPerM(12, 200), 1), 565.5, 0.1);
eq("rebar tests", C.rebarTests(61), 3);
eq("coupler tests", C.couplerTests(250, false), 3);
eq("stirrup", C.stirrupLength(300, 600, 40, 10, 100), 2 * (210 + 510) + 200 - 60);
// fdt
const f = C.fdt(2.2, 6, 2.15, 7);
eq("fdt dry", C.round(f.dry, 4), 2.0755, 0.0001);
eq("fdt rc", C.round(f.rc, 1), 96.5, 0.05);
eq("fdt ok", f.ok, true);
eq("fdt count", C.fdtArea(950, 3), 15);
eq("fdt trench", C.fdtTrench(110, 4), 24);
eq("layers", C.layersFor(1.5, 200), 8);
// masonry
const bw = C.blockwork(100, 400, 200, 10, 200, false, 0);
eq("blocks per m2", C.round(bw.perM2, 2), 11.61, 0.01);
const mm = C.mortarMaterials(1, "M6", { M6: { c: 155, s: 710 } }, 1850);
eq("mortar cement", C.round(mm.cementKg, 1), 331.5, 0.1);
const pl = C.plaster(100, 15, 4, 0);
eq("plaster wet", pl.wet, 1.5);
// tank
eq("tank pass", C.tankTest(4, 12, 5).ok, true); // net 7, limit min(8,10)=8
eq("tank fail", C.tankTest(3, 12, 5).ok, false); // net 7, limit 6
// units
eq("psi", C.round(C.convert("pressure", 4000, "psi", "MPa"), 2), 27.58, 0.01);
eq("ft", C.round(C.convert("length", 10, "ft", "m"), 3), 3.048);
eq("temp", C.convertTemp(100, "°F", "°C"), 37.77777777777778, 1e-9);
console.log(n - fails + "/" + n + " passed");
process.exit(fails ? 1 : 0);
