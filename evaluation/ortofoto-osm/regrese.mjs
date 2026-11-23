// Regression of the whole estimate from the orthophoto and OSM as the app makes it (ortho-osm.js orthoOsmPolys, then
// derive.js deriveProfile), against MTVU along the cut (Prague, Brno: the cuts of evaluation/<city>/data/ab-city-stejne,
// the orthophotos cached in evaluation/ortofoto/data; no request). Bára 16. 11. 2026: every change to the estimate is
// checked that it makes nothing worse elsewhere. Per city and orthophoto: the kerbs of the carriageway (median error,
// share within 0.5 and 1 m), the sidewalks per side, parking at a kerb (found / missed / false).
//   node evaluation/ortofoto-osm/regrese.mjs [praha|brno …]            the current code
//   CARS=1 node evaluation/ortofoto-osm/regrese.mjs                   with the parked cars read on the image (off in the app)
//   OFF=pair,pieces node evaluation/ortofoto-osm/regrese.mjs           with the named features off (ortho-osm.js P.off)
//   RUIAN=1 node evaluation/ortofoto-osm/regrese.mjs                   with RÚIAN's buildings OSM lacks, as the app in Czechia
//   RUIAN=first …                                                      RÚIAN's buildings first, OSM's over them left out (worse)
//   SRC=cuzk12 …                                                       only this orthophoto (default: cuzk12 and the city's 10 cm)
import { cuts, truthOf, osmAround, stripOf, median, ROOT } from "./lib.mjs";
import { orthoOsmPolys, trimToEnds, P } from "../../pilot/public/ortho-osm.js";
import { aiKerbs, parkFromAi, parkSkip } from "../../pilot/public/ai-kerbs.js";
import fsAi from "node:fs";
import path from "node:path";
import { ruianOutlines, withBuildings } from "../../pilot/public/gis.js";
import { politeFetch } from "../polite.mjs";
if (process.env.RUIAN) globalThis.fetch = politeFetch;
import { localFrame, deriveProfile } from "../../pilot/public/derive.js";
const wayAlong = (way, frame, dir) => { const g = way.geometry.map((q) => frame.toXY(q.lon, q.lat)); let best = null; for (let i = 0; i + 1 < g.length; i++) { const [a, b] = [g[i], g[i + 1]], d = Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); if (!best || d < best.d) best = { d, v: [b[0] - a[0], b[1] - a[1]] }; } return !best || best.v[0] * dir[0] + best.v[1] * dir[1] >= 0; };

const CITIES = process.argv.slice(2).filter((a) => /^[a-z]+$/.test(a));
const OFF = (process.env.OFF || "").split(",").filter(Boolean);
P.off = new Set(OFF);
// CARS=1: with the parked cars read on the image (off in the app).
P.cars = process.env.CARS === "1";
// AUTA=1: parked cars by their colours (ortho-osm.js carsColoured).
P.carsColour = process.env.AUTA === "1";
// PSET='{"beta":0.25}': other values of the kerb parameters (ortho-osm.js P), for sweeps.
if (process.env.PSET) Object.assign(P, JSON.parse(process.env.PSET));
if (process.env.DBG) P.dbg = {};
const SRC = process.env.SRC ? process.env.SRC.split(",") : null;
const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const SIDEWALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
// Coarse kinds for the composition, the same for the estimate's parts and MTVU's runs (as chyby.mjs).
const ROADWAY_K = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const estKind = (type) => (ROADWAY_K.has(type) ? "vozovka" : type === "parkovani" ? "stání" : ["chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka", "nastupiste"].includes(type) ? "chodník"
  : ["zelen", "stromorad"].includes(type) ? "zeleň" : type === "tramvaj" ? "vozovka" : type === "nezname" ? "neurčeno" : "jiné");
const runKind = (c) => (c === 700 || c === 701 || (c >= 9700 && c < 9800 && !(c >= 9704 && c <= 9708)) ? "vozovka" : c === 704 || (c >= 9704 && c <= 9708) ? "stání"
  : c === 702 || c === 703 ? "chodník" : c >= 400 && c < 500 ? "zeleň" : c === 705 ? "vozovka" : "jiné"); // a tram bed is roadway (Bára 20. 11. 2026: it does not matter)
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : "–");

// The parts of a profile laid across the cut (t: A at the larger t, as the truth's runs): [{ type, s, e }].
function laid(p) {
  const out = [];
  let t = p.extent[1];
  for (const s of p.segments) { out.push({ type: s.type, s: t - s.width, e: t }); t -= s.width; }
  return out;
}

async function ruianCached(city, c) {
  const file = path.join(ROOT, "data", "ruian", `${city}-${c.n}.json`);
  try { return JSON.parse(fsAi.readFileSync(file, "utf8")); } catch {}
  const d = 0.0007, { lat, lon } = c.cut;
  const out = await ruianOutlines(`${lon - d},${lat - d * 0.65},${lon + d},${lat + d * 0.65}`);
  fsAi.mkdirSync(path.dirname(file), { recursive: true });
  fsAi.writeFileSync(file, JSON.stringify(out));
  return out;
}
const aiCache = {}, dump = [];
for (const city of CITIES.length ? CITIES : ["praha", "brno"]) {
  const list = await cuts(city);
  const keys = SRC || (city === "praha" ? ["cuzk12", "ipr10"] : ["cuzk12", "brno10"]);
  for (const key of keys) {
    const kerb = [], sw = [], park = { tp: 0, fn: 0, fp: 0 };
    // The composition metre by metre (since 19. 11. 2026, the review: the regression saw nothing beyond the kerbs):
    // over what both cover, buildings left out; all of it and only beyond the kerbs of the carriageway at the axis;
    // roadway drawn where MTVU has none (no roadway, parking or tram bed).
    const comp = { all: 0, allOk: 0, out: 0, outOk: 0, roadFalse: 0, swBoth: 0, swEst: 0, swTrue: 0 };
    let n = 0, none = 0;
    for (const c of list) {
      const st = await stripOf(city, key, c);
      if (!st) continue;
      let osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
      // RUIAN=1: RÚIAN's buildings first, as the app in Czechia (countries/CZ.js estimateBuildings, gis.js withBuildings);
      // the answers of ČÚZK kept in data/ruian (one request per cut, through polite.mjs).
      if (process.env.RUIAN) osm = withBuildings(osm, await ruianCached(city, c), process.env.RUIAN === "first" ? "first" : "fill");
      const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
      const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
      if (!way) continue;
      // AI=ai-map5-3: the carriageway's kerbs of the model (evaluation/ai-segmentation, its classes along the cut
      // precomputed in data/ai-seg/cuts/<city>/<AI>.json; as app.js ?ai=1). Not Prague: the model learnt on it.
      let ai = null, aiSurf = null;
      if (process.env.AI && city !== "praha") {
        const dir2 = `/Users/barasoukupova/streetdesign/data/ai-seg/cuts/${city}`;
        aiCache[city] ??= JSON.parse(fsAi.readFileSync(`${dir2}/${process.env.AI}.json`, "utf8"));
        const cls = aiCache[city][String(c.n)], meta = fsAi.existsSync(`${dir2}/${c.n}.json`) && JSON.parse(fsAi.readFileSync(`${dir2}/${c.n}.json`, "utf8"));
        if (cls && meta) {
          const cut = { ts: meta.ts, cls: cls.map((v) => (v === 0 || v === 3 ? 0 : v < 0 ? -1 : 1)) }; ai = (axis) => aiKerbs(cut, axis);
          // The model's kinds along the cut (nine classes of train.py: 1 sidewalk, 2 cycleway, 5 green, 6 building).
          const K9 = { 1: "chodník", 2: "chodník", 5: "zeleň", 6: "budova", 0: "vozovka", 3: "vozovka", 4: "vozovka", 7: "jiné", 8: "jiné" };
          aiSurf = (t) => { const i = Math.round((t - meta.ts[0]) / (meta.ts[1] - meta.ts[0])); return i >= 0 && i < cls.length && cls[i] >= 0 ? K9[cls[i]] : null; };
        }
      }
      const polys = orthoOsmPolys({ osm, frame, dir, way, st, ai, aiSurf });
      const truth = truthOf(c, 0);
      if (!polys || !truth.way) { none++; continue; }
      // As app.js: a side without a house ends where orthoOsmPolys found (polys.ends).
      const p = trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 } }), polys.ends);
      // PARK=park-park-b1: the model's parking (ai-kerbs.js parkFromAi), precomputed by park_cuts.py (Brno, Prague).
      if (process.env.PARK && p?.segments?.length && p.extent) {
        const d2 = `/Users/barasoukupova/streetdesign/data/ai-seg/cuts/${city}`;
        aiCache["park-" + city] ??= fsAi.existsSync(`${d2}/${process.env.PARK}.json`) ? JSON.parse(fsAi.readFileSync(`${d2}/${process.env.PARK}.json`, "utf8")) : {};
        const pk = aiCache["park-" + city][String(c.n)], meta = pk && JSON.parse(fsAi.readFileSync(`${d2}/${c.n}.json`, "utf8"));
        if (pk) parkFromAi(p, (tt) => { const i = Math.round((tt - meta.ts[0]) / (meta.ts[1] - meta.ts[0])); return i >= 0 && i < pk.length && pk[i] >= 0 ? pk[i] : null; }, parkSkip(way.tags, wayAlong(way, frame, dir), false));
      }
      if (!p?.segments?.length || !p.extent) { none++; continue; }
      n++;
      const parts = laid(p), road = parts.filter((x) => ROAD.has(x.type));
      if (!road.length) { none++; continue; }
      // The profile's t runs the other way than the truth's runs (A at larger t there): compare as derive lays them.
      // The carriageway nearest the axis, as truthOf takes MTVU's (another one beyond a median or a side road is not
      // its kerb; before 18. 11. 2026 the outermost roadway part was taken).
      const runs = [];
      for (const x of [...road].sort((a, b) => a.s - b.s)) { const l = runs.at(-1); if (l && x.s - l.e < 0.05) l.e = Math.max(l.e, x.e); else runs.push({ s: x.s, e: x.e }); }
      const gap = (r) => (r.s <= 0 && 0 <= r.e ? 0 : Math.min(Math.abs(r.s), Math.abs(r.e)));
      const { s: lo, e: hi } = runs.sort((a, b) => gap(a) - gap(b))[0];
      const tLo = Math.min(truth.way.s, truth.way.e), tHi = Math.max(truth.way.s, truth.way.e);
      kerb.push(lo - tLo, hi - tHi);
      const e0 = Math.max(p.extent[0], c.a.extent[0]), e1 = Math.min(p.extent[1], c.a.extent[1]);
      for (let t = e0 + 0.05; t < e1; t += 0.1) {
        const r = c.a.runs.find((q) => q.s <= t && t < q.e), x = parts.find((q) => q.s <= t && t < q.e);
        if (!r || !x || r.code === 601 || x.type === "budova") continue;
        const tk = runKind(r.code), ek = estKind(x.type), ok = tk === ek;
        comp.all += 0.1; if (ok) comp.allOk += 0.1;
        if (t < Math.min(lo, tLo) || t > Math.max(hi, tHi)) { comp.out += 0.1; if (ok) comp.outOk += 0.1; }
        if (ek === "vozovka" && !["vozovka", "stání", "těleso"].includes(tk)) comp.roadFalse += 0.1;
        // The sidewalk metre by metre (19. 11. 2026: "within 1 m" of the width rewards a narrow cap; this does not).
        if (ek === "chodník") comp.swEst += 0.1; if (tk === "chodník") comp.swTrue += 0.1; if (ek === "chodník" && tk === "chodník") comp.swBoth += 0.1;
      }
      for (const [side, inner, sg] of [["A", lo, -1], ["B", hi, 1]]) {
        const t = truth.side?.[side];
        if (!t) continue;
        const mine = parts.filter((x) => SIDEWALK.has(x.type) && (sg < 0 ? x.e <= inner + 0.01 : x.s >= inner - 0.01)).reduce((a, x) => a + (x.e - x.s), 0);
        if (truth.facade[side] !== null) { sw.push(mine - t.sidewalk); if (process.env.DUMP) dump.push({ city, key, n: c.n, side, sw: mine - t.sidewalk, kerb: side === "A" ? lo - tLo : hi - tHi }); }
        const pk = road.some((x) => x.type === "parkovani" && (sg < 0 ? x.s - lo < 3 : hi - x.e < 3));
        if (t.parking && pk) park.tp++; else if (t.parking) park.fn++; else if (pk) park.fp++;
      }
    }
    const a = kerb.filter(Number.isFinite).map(Math.abs), s = sw.map(Math.abs);
    console.log(`${city} ${key}${OFF.length ? ` (bez ${OFF.join(",")})` : ""}: ${n} řezů (${none} bez profilu) · obruby medián ${f2(median(a))} m, do 0,5 m ${pct(a.filter((x) => x <= 0.5).length, a.length)}, do 1 m ${pct(a.filter((x) => x <= 1).length, a.length)} · chodník medián chyby ${f2(median(s))} m, do 1 m ${pct(s.filter((x) => x <= 1).length, s.length)} (${s.length} stran) · stání: nalezeno ${park.tp}, chybí ${park.fn}, navíc ${park.fp} · složení správně ${pct(comp.allOk, comp.all)} (${comp.all.toFixed(0)} m), za obrubami ${pct(comp.outOk, comp.out)} (${comp.out.toFixed(0)} m), vozovka navíc ${comp.roadFalse.toFixed(0)} m · chodník po metrech: přesnost ${pct(comp.swBoth, comp.swEst)}, záchyt ${pct(comp.swBoth, comp.swTrue)}, F1 ${pct(2 * comp.swBoth, comp.swEst + comp.swTrue)}`);
  }
}
if (process.env.DUMP) fsAi.writeFileSync(process.env.DUMP, JSON.stringify(dump));
if (process.env.DBG) console.log("dbg", JSON.stringify(P.dbg));
