// The overview map of the About dialog (Bára 24. 11. 2026): where the app has a surface map of the street areas, where
// an orthophoto and OSM, where OSM alone, and what is left out. Built from the modules themselves, so a new source shows
// without a hand list: the states of staty.json, each state's orthophoto (countries/<ISO>.js laneOrtho, lanes-ortho.js
// for the partial ones), each source module's SURFACE_MAPS (towns/*.js: "all", ids of its AREAS, keys of the boundary
// files, "-<NUTS 3>" left out) and the boundaries of the towns (mesta*.json, pasporty.json, regions-*.json). Simplified
// to about 500 m and written into pilot/public/coverage.json (tests/coverage.test.js checks it is up to date):
//   node tools/build_coverage.mjs            (offline; the NUTS 3 areas a module leaves out come from tools/coverage-nuts3.json)
//   node tools/build_coverage.mjs --fetch    (first fetches those NUTS 3 areas and the towns' LAU from Eurostat GISCO,
//                                             © EuroGeographics)
//   node tools/build_coverage.mjs --lau=<LAU_RG_01M_2024_4326.geojson downloaded before>   (the towns' LAU only)
// A town whose map is a box of its module's AREAS (Berlin, Kraków, Paris…) is drawn by its municipality's boundary
// (LAU_TOWNS, kept in tools/coverage-lau.json) cut to that box, not as the box (the review of 24. 11. 2026).
// Each feature: { c: "surface" | "ortho" | "osm", id } (no feature: not covered, closed_* and foreign_* too), a Polygon whose rings are read even-odd (as staty.json
// and city.js inside: islands and holes alike); the features are drawn in order, later over earlier.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const PUB = new URL("../pilot/public/", import.meta.url);
const NUTS_FILE = new URL("coverage-nuts3.json", import.meta.url);
const LAU_FILE = new URL("coverage-lau.json", import.meta.url);
const LAU_URL = "https://gisco-services.ec.europa.eu/distribution/v2/lau/geojson/LAU_RG_01M_2024_4326.geojson";
// The towns of the modules' AREAS without a boundary of their own in the repo: their GISCO LAU 2024 id.
export const LAU_TOWNS = { berlin: "DE_11000000", hamburg: "DE_02000000", aachen: "DE_05334002", krakow: "PL_1001121216101", paris: "FR_75056",
  zaragoza: "ES_50297", tallinn: "EE_0784", helsinki: "FI_091", vilnius: "LT_13" };
export const OUT = new URL("coverage.json", PUB);
const json = (f) => JSON.parse(fs.readFileSync(new URL(f, PUB), "utf8"));

// The orthophotos of lanes-ortho.js by the key a state names (countries/<ISO>.js laneOrtho): over the whole state, over
// some boxes only (the rest OSM alone), or the whole state but some boxes. "none": no orthophoto may be used.
// tests/coverage.test.js fails on a key that is none of these, so a new state is classified here.
export const ORTHO_FULL = new Set(["cuzk", "sk", "at", "de", "ch", "nl", "be", "lu", "pl", "fr", "cy", "mt", "ee", "si", "dk"]);
const lanes = await import(new URL("lanes-ortho.js", PUB));
export const ORTHO_ONLY = {
  it: Object.values(lanes.IT_ORTHO).map((o) => o.box),
  fi: Object.values(lanes.FI_ORTHO).map((o) => o.box),
  us: Object.values(lanes.US_ORTHO).map((o) => o.box),
  pt: [lanes.PT_MAINLAND],
};
export const ORTHO_BUT = { es: lanes.ES_NOT_PNOA };

// ---------- geometry (degrees; a ring [[lon, lat], …], open or closed) ----------
const open = (r) => (r.length > 1 && r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1] ? r.slice(0, -1) : r);
// Area in km².
const area = (r) => {
  let a = 0;
  const k = Math.cos((r.reduce((s, p) => s + p[1], 0) / r.length) * Math.PI / 180) * 111.32 * 110.57;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]);
  return Math.abs(a / 2) * k;
};
// Douglas–Peucker in degrees (longitude scaled by the latitude).
function simplify(r, tol) {
  if (r.length < 4) return r;
  const k = Math.cos((r[0][1] * Math.PI) / 180);
  const keep = new Uint8Array(r.length);
  keep[0] = keep[r.length - 1] = 1;
  const stack = [[0, r.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = r[a][0] * k, ay = r[a][1], dx = r[b][0] * k - ax, dy = r[b][1] - ay, len = Math.hypot(dx, dy);
    let best = -1, dmax = tol;
    for (let i = a + 1; i < b; i++) {
      const px = r[i][0] * k - ax, py = r[i][1] - ay;
      const d = len ? Math.abs(px * dy - py * dx) / len : Math.hypot(px, py);
      if (d > dmax) { dmax = d; best = i; }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return r.filter((_, i) => keep[i]);
}
// A ring cut to a box (Sutherland–Hodgman); empty when nothing is left.
function clip(ring, [x0, y0, x1, y1]) {
  let out = open(ring);
  const edges = [[(p) => p[0] >= x0, (p, q) => [x0, p[1] + ((x0 - p[0]) * (q[1] - p[1])) / (q[0] - p[0])]],
    [(p) => p[0] <= x1, (p, q) => [x1, p[1] + ((x1 - p[0]) * (q[1] - p[1])) / (q[0] - p[0])]],
    [(p) => p[1] >= y0, (p, q) => [p[0] + ((y0 - p[1]) * (q[0] - p[0])) / (q[1] - p[1]), y0]],
    [(p) => p[1] <= y1, (p, q) => [p[0] + ((y1 - p[1]) * (q[0] - p[0])) / (q[1] - p[1]), y1]]];
  for (const [inside, cross] of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const p = src[i], q = src[(i + 1) % src.length];
      if (inside(p)) { out.push(p); if (!inside(q)) out.push(cross(p, q)); } else if (inside(q)) out.push(cross(p, q));
    }
    if (!out.length) return [];
  }
  return out;
}
const TOL = 0.005, MIN_KM2 = 4;
// The rings of a feature, simplified and rounded to 0.001° (about 100 m); small islands dropped, but never the largest ring.
function tidy(rings) {
  const list = rings.map(open).filter((r) => r.length >= 3);
  const big = Math.max(0, ...list.map(area));
  return list.filter((r) => area(r) >= Math.min(MIN_KM2, big)).map((r) => {
    let s = simplify([...r, r[0]], TOL).map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]);
    s = s.filter((p, i) => !i || p[0] !== s[i - 1][0] || p[1] !== s[i - 1][1]);
    return s.length >= 4 ? s : null;
  }).filter(Boolean);
}

// ---------- the build ----------
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
export async function buildCoverage({ nuts = readJson(NUTS_FILE), lau = readJson(LAU_FILE) } = {}) {
  const { TOWNS } = await import(new URL("towns/index.js", PUB));
  const { COUNTRIES } = await import(new URL("countries/index.js", PUB));
  const { countryOfCity, cityById } = await import(new URL("city.js", PUB));
  const STATY = json("staty.json");
  const BOUNDS = Object.assign({}, ...["mesta.json", "mesta-sk.json", "mesta-at.json", "mesta-us.json", "pasporty.json", "regions-be.json", "regions-es.json"].map(json));
  // (Not a state's extra rings either, "<id>+<what>": tools/build_staty.mjs.)
  const states = Object.keys(STATY).filter((id) => !/^(land|foreign|closed)_|\+/.test(id));
  const problems = [];

  // Each module by the places it serves (towns/index.js TOWNS: states and cities).
  const served = new Map();
  for (const [id, m] of Object.entries(TOWNS)) served.set(m, [...(served.get(m) || []), id]);

  // The base of each state: the orthophoto's class, and its partial boxes.
  const base = {}, overlays = [];
  for (const s of states) {
    const country = countryOfCity(s);
    const key = country.laneOrtho;
    if (!country.code) { problems.push(`${s}: stát bez kódu ISO`); continue; }
    if (key === "none") base[s] = "osm";
    else if (ORTHO_FULL.has(key)) base[s] = "ortho";
    else if (ORTHO_ONLY[key]) {
      base[s] = "osm";
      for (const box of ORTHO_ONLY[key]) overlays.push({ c: "ortho", id: `${s}-ortho`, rings: STATY[s].map((r) => clip(r, box)) });
    } else if (ORTHO_BUT[key]) {
      base[s] = "ortho";
      for (const box of ORTHO_BUT[key]) overlays.push({ c: "osm", id: `${s}-no-ortho`, rings: STATY[s].map((r) => clip(r, box)) });
    } else problems.push(`${s}: ortofoto „${key}“ není v tools/build_coverage.mjs zařazené`);
  }

  // The surface maps of each module.
  const surfaces = [], holes = [];
  // The state entry a city lies in (city.js like; a Czech city has none).
  const stateOf = (id) => (STATY[id] ? id : cityById(id).like || "cesko");
  for (const [m, ids] of served) {
    if (!Array.isArray(m.SURFACE_MAPS)) { problems.push(`${ids[0]}: modul nemá SURFACE_MAPS`); continue; }
    const own = ids.filter((id) => states.includes(id));
    for (const e of m.SURFACE_MAPS) {
      if (e === "all") {
        if (own.length) { for (const s of own) base[s] = "surface"; continue; }
        for (const id of ids) {
          if (!BOUNDS[id]) { problems.push(`${id}: bez hranice města`); continue; }
          surfaces.push({ id, rings: BOUNDS[id], state: stateOf(id) });
        }
      } else if (e.startsWith("-")) {
        const code = e.slice(1);
        if (!nuts[code]) { problems.push(`${code}: chybí v tools/coverage-nuts3.json (node tools/build_coverage.mjs --fetch)`); continue; }
        holes.push({ id: code, rings: nuts[code], state: own[0] });
      } else if (m.AREAS?.[e]) {
        const a = m.AREAS[e], town = BOUNDS[a.town] || BOUNDS[e];
        if (town) { surfaces.push({ id: e, rings: town, state: own[0] }); continue; }
        // A town by its municipality, cut to the box its module asks.
        if (lau[e]) { surfaces.push({ id: e, rings: lau[e].map((r) => clip(r, a.box)).filter((r) => r.length >= 3), state: own[0] }); continue; }
        if (!a.inside) problems.push(`${e}: oblast bez hranice (LAU_TOWNS v tools/build_coverage.mjs a --fetch)`);
        // The box within the state; a piece the area's own test (inside) does not have is left out.
        const rings = own.flatMap((s) => STATY[s].map((r) => clip(r, a.box)))
          .filter((r) => r.length >= 3 && (!a.inside || r.filter((p) => a.inside(p[0], p[1])).length * 2 > r.length));
        if (!rings.length) problems.push(`${e}: oblast mimo stát`);
        surfaces.push({ id: e, rings, state: own[0] });
      } else if (BOUNDS[e]) surfaces.push({ id: e, rings: BOUNDS[e], state: own[0] });
      else problems.push(`${ids[0]}: „${e}“ není v AREAS ani v hranicích`);
    }
  }

  const features = [];
  const add = (c, id, rings) => {
    const r = tidy(rings);
    if (r.length) features.push({ type: "Feature", properties: { c, id }, geometry: { type: "Polygon", coordinates: r } });
  };
  for (const s of states) if (base[s]) add(base[s], s, STATY[s]);
  // An overlay on a state whose own map covers it all says nothing.
  for (const o of overlays) if (base[o.id.split("-")[0]] !== "surface") add(o.c, o.id, o.rings);
  for (const f of surfaces) if (base[f.state] !== "surface") add("surface", f.id, f.rings);
  for (const h of holes) add(base[h.state] === "surface" ? (ORTHO_FULL.has(countryOfCity(h.state).laneOrtho) ? "ortho" : "osm") : base[h.state], h.id, h.rings);
  // Every state of the app is on the map.
  for (const code of Object.keys(COUNTRIES)) if (!states.some((s) => countryOfCity(s).code === code && base[s])) problems.push(`${code}: stát bez třídy`);
  return { coverage: { type: "FeatureCollection", features }, problems };
}

// The NUTS 3 areas the modules leave out ("-CH011"), from GISCO 1 : 1 000 000 (© EuroGeographics), kept in tools/.
async function fetchNuts() {
  const { TOWNS } = await import(new URL("towns/index.js", PUB));
  const codes = [...new Set(Object.values(TOWNS).flatMap((m) => (m.SURFACE_MAPS || []).filter((e) => e.startsWith("-")).map((e) => e.slice(1))))];
  const all = await (await fetch("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_3.geojson")).json();
  const out = {};
  for (const f of all.features) {
    if (!codes.includes(f.properties.NUTS_ID)) continue;
    const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    out[f.properties.NUTS_ID] = polys.flat().map((r) => r.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
  }
  fs.writeFileSync(NUTS_FILE, JSON.stringify(out));
  console.log("NUTS 3:", Object.keys(out).join(", "));
}
async function fetchLau() {
  // The towns' municipalities (LAU 2024, 1 : 1 000 000; about 150 MB, or a file downloaded before).
  const file = process.argv.find((a) => a.startsWith("--lau="))?.slice(6);
  const lauAll = file ? JSON.parse(fs.readFileSync(file, "utf8")) : await (await fetch(LAU_URL, { headers: { "User-Agent": "profily-ulic" } })).json();
  const towns = {};
  for (const f of lauAll.features) {
    const id = Object.keys(LAU_TOWNS).find((k) => LAU_TOWNS[k] === f.properties.GISCO_ID);
    if (!id) continue;
    const g = f.geometry, polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    towns[id] = polys.flat().map((r) => r.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
  }
  const missing = Object.keys(LAU_TOWNS).filter((k) => !towns[k]);
  if (missing.length) throw new Error(`LAU nenalezeno: ${missing.join(", ")}`);
  fs.writeFileSync(LAU_FILE, JSON.stringify(towns));
  console.log("LAU:", Object.keys(towns).join(", "));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--fetch")) await fetchNuts();
  if (process.argv.includes("--fetch") || process.argv.some((a) => a.startsWith("--lau="))) await fetchLau();
  const { coverage, problems } = await buildCoverage();
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  const text = JSON.stringify(coverage);
  fs.writeFileSync(OUT, text);
  const by = {};
  for (const f of coverage.features) by[f.properties.c] = [...(by[f.properties.c] || []), f.properties.id];
  for (const [c, ids] of Object.entries(by)) console.log(c.padEnd(9), ids.join(", "));
  console.log(`${(text.length / 1024).toFixed(0)} kB, ${coverage.features.length} ploch`);
}
