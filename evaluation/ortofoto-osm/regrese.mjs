// Regression of the whole estimate from the orthophoto and OSM as the app makes it (ortho-osm.js orthoOsmPolys, then
// derive.js deriveProfile), against MTVU along the cut (Prague, Brno: the cuts of evaluation/<city>/data/ab-city-stejne,
// the orthophotos cached in evaluation/ortofoto/data; no request). Bára 16. 11. 2026: every change to the estimate is
// checked that it makes nothing worse elsewhere. Per city and orthophoto: the kerbs of the carriageway (median error,
// share within 0.5 and 1 m), the sidewalks per side, parking at a kerb (found / missed / false).
//   node evaluation/ortofoto-osm/regrese.mjs [praha|brno …]            the current code
//   CARS=1 node evaluation/ortofoto-osm/regrese.mjs                   with the parked cars read on the image (off in the app)
//   OFF=pair,pieces node evaluation/ortofoto-osm/regrese.mjs           with the named features off (ortho-osm.js P.off)
//   SRC=cuzk12 …                                                       only this orthophoto (default: cuzk12 and the city's 10 cm)
import { cuts, truthOf, osmAround, stripOf, median } from "./lib.mjs";
import { orthoOsmPolys, trimToEnds, P } from "../../pilot/public/ortho-osm.js";
import { localFrame, deriveProfile } from "../../pilot/public/derive.js";

const CITIES = process.argv.slice(2).filter((a) => /^[a-z]+$/.test(a));
const OFF = (process.env.OFF || "").split(",").filter(Boolean);
P.off = new Set(OFF);
// CARS=1: with the parked cars read on the image (off in the app).
P.cars = process.env.CARS === "1";
// AUTA=1: parked cars by their colours (ortho-osm.js carsColoured).
P.carsColour = process.env.AUTA === "1";
// PSET='{"beta":0.25}': other values of the kerb parameters (ortho-osm.js P), for sweeps.
if (process.env.PSET) Object.assign(P, JSON.parse(process.env.PSET));
const SRC = process.env.SRC ? process.env.SRC.split(",") : null;
const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const SIDEWALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : "–");

// The parts of a profile laid across the cut (t: A at the larger t, as the truth's runs): [{ type, s, e }].
function laid(p) {
  const out = [];
  let t = p.extent[1];
  for (const s of p.segments) { out.push({ type: s.type, s: t - s.width, e: t }); t -= s.width; }
  return out;
}

for (const city of CITIES.length ? CITIES : ["praha", "brno"]) {
  const list = await cuts(city);
  const keys = SRC || (city === "praha" ? ["cuzk12", "ipr10"] : ["cuzk12", "brno10"]);
  for (const key of keys) {
    const kerb = [], sw = [], park = { tp: 0, fn: 0, fp: 0 };
    let n = 0, none = 0;
    for (const c of list) {
      const st = await stripOf(city, key, c);
      if (!st) continue;
      const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
      const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
      const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
      if (!way) continue;
      const polys = orthoOsmPolys({ osm, frame, dir, way, st });
      const truth = truthOf(c, 0);
      if (!polys || !truth.way) { none++; continue; }
      // As app.js: a side without a house ends where orthoOsmPolys found (polys.ends).
      const p = trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 } }), polys.ends);
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
      for (const [side, inner, sg] of [["A", lo, -1], ["B", hi, 1]]) {
        const t = truth.side?.[side];
        if (!t) continue;
        const mine = parts.filter((x) => SIDEWALK.has(x.type) && (sg < 0 ? x.e <= inner + 0.01 : x.s >= inner - 0.01)).reduce((a, x) => a + (x.e - x.s), 0);
        if (truth.facade[side] !== null) sw.push(mine - t.sidewalk);
        const pk = road.some((x) => x.type === "parkovani" && (sg < 0 ? x.s - lo < 3 : hi - x.e < 3));
        if (t.parking && pk) park.tp++; else if (t.parking) park.fn++; else if (pk) park.fp++;
      }
    }
    const a = kerb.filter(Number.isFinite).map(Math.abs), s = sw.map(Math.abs);
    console.log(`${city} ${key}${OFF.length ? ` (bez ${OFF.join(",")})` : ""}: ${n} řezů (${none} bez profilu) · obruby medián ${f2(median(a))} m, do 0,5 m ${pct(a.filter((x) => x <= 0.5).length, a.length)}, do 1 m ${pct(a.filter((x) => x <= 1).length, a.length)} · chodník medián chyby ${f2(median(s))} m, do 1 m ${pct(s.filter((x) => x <= 1).length, s.length)} (${s.length} stran) · stání: nalezeno ${park.tp}, chybí ${park.fn}, navíc ${park.fp}`);
  }
}
