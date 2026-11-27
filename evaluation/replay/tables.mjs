// The tables of the safety net (docs/architecture-countries.md, step 0): what the app takes from the city and the
// state of a cut, computed in Node for every city and every language, so that the rebuild can be checked to change
// none of it. The composed city, the credit lines, the outage notes, the traffic signs of each state, the width
// rules of each state, the look of houses, the city and illustrations of a point, a saved cut loaded again.
//   node evaluation/replay/tables.mjs <name>        → data/replay/tables/<name>.<lang>.json for cs, sk, en, de
//   node evaluation/replay/tables.mjs <A> <B>       → compares two snapshots (exit 1 when they differ)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { DATA } from "./paths.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const DIR = path.join(DATA, "tables");
const LANGS = ["cs", "sk", "en", "de"];
const [A, B] = process.argv.slice(2);

if (!process.env.PROFILY_LANG) {
  if (B) {
    let bad = 0;
    // Since the keys of the texts (27. 11. 2026): an outage's note is a key, compared as its Czech (locales/cs.json);
    // the composed city's fields in one order (its texts come last since then). What a visitor sees is the same.
    const CS = JSON.parse(fs.readFileSync(path.join(HERE, "..", "..", "app", "public", "locales", "cs.json"), "utf8"));
    const sorted = (v) => (Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, sorted(v[q])])) : v);
    const same = (k, v) => (k === "city" ? sorted(v) : k === "outage" && v && CS[v.note] !== undefined ? { ...v, note: CS[v.note] } : v);
    for (const l of LANGS) {
      const x = JSON.parse(fs.readFileSync(path.join(DIR, `${A}.${l}.json`), "utf8")), y = JSON.parse(fs.readFileSync(path.join(DIR, `${B}.${l}.json`), "utf8"));
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
        const a = x[k] ?? {}, b = y[k] ?? {};
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((q) => JSON.stringify(same(k, a[q])) !== JSON.stringify(same(k, b[q])));
        if (!keys.length) continue;
        bad += keys.length;
        console.log(`${l} ${k}: ${keys.length} jinak, např. ${keys.slice(0, 3).map((q) => `${q}: ${JSON.stringify(a[q])?.slice(0, 160)} → ${JSON.stringify(b[q])?.slice(0, 160)}`).join(" | ")}`);
      }
    }
    console.log(bad ? `${A} → ${B}: ${bad} rozdílů` : `${A} → ${B}: beze změny`);
    process.exit(bad ? 1 : 0);
  }
  fs.mkdirSync(DIR, { recursive: true });
  for (const l of LANGS) {
    const r = spawnSync(process.execPath, [new URL(import.meta.url).pathname, A || "snimek"], { env: { ...process.env, PROFILY_LANG: l }, stdio: "inherit" });
    if (r.status) process.exit(r.status);
  }
  process.exit(0);
}

// ROOT: the app of another checkout (the code before a change); the snapshots stay here.
const PUB = path.join(process.env.ROOT || path.join(HERE, "..", ".."), "app", "public");
const imp = (f) => import(path.join(PUB, f));
const C = await imp("city.js");
const { CITY_IDS, setCity, city, creditLines, cityAt, loadBounds, loadStates, loadSkTowns } = C;
const S = await imp("signs.js");
const R = await imp("rules.js");
const V = await imp("validate.js");
const SRC = await imp("sources.js");
const PRO = await imp("profile.js");
const { TYPES } = await imp("types.js");
const { PASSPORT_NAMES } = await imp("towns/passport-names.js");
const out = {};
const safe = (f) => { try { return f(); } catch (e) { return `ERROR ${e.message}`; } };
const json = (v) => JSON.parse(JSON.stringify(v ?? null));

// The composed city of every id (as setCity makes it).
out.city = Object.fromEntries(CITY_IDS.map((id) => [id, json(setCity(id))]));
// The states' illustrations and the set at a point: in city.js before the states' modules (step 3), then there.
const stateMod = async (code) => { try { return (await import(path.join(PUB, "countries", `${code}.js`))).default; } catch { return null; } };
const SKm = await stateMod("SK"), ATm = await stateMod("AT");
// After step 4b the set is the city's (the cities of the other states by their boundaries).
const artOf = (lat, lon) => C.cityById(cityAt(lat, lon)).art;
const skArtAt = C.skArtAt || SKm.artAt || artOf, atArtAt = C.atArtAt || ATm.artAt || artOf;
out.sk_art = { all: json(C.SK_ART || SKm.art) };
out.at_art = { all: json(C.AT_ART || ATm.art) };

// The city and the illustrations of a point: a grid over the three states and the centres of the towns.
const read = (f) => JSON.parse(fs.readFileSync(path.join(PUB, f), "utf8"));
const points = [];
for (let lat = 46.3; lat <= 51.2; lat += 0.1) for (let lon = 9.5; lon <= 22.6; lon += 0.1) points.push([+lat.toFixed(2), +lon.toFixed(2)]);
for (const id of CITY_IDS) { const c = setCity(id); if (c.view) points.push(c.view); }
points.push([48.144, 17.11], [48.719, 21.258], [48.998, 21.24], [49.223, 18.74], [48.736, 19.146], [48.312, 18.087], [48.2085, 16.3731], [47.0707, 15.4395],
  [48.3059, 14.2862], [47.8, 13.045], [47.2654, 11.3927], [48.17, 17.06], [48.2, 16.2], [48.25, 16.5]);
const place = () => Object.fromEntries(points.map(([lat, lon]) => [`${lat},${lon}`, [cityAt(lat, lon), skArtAt(lat, lon), atArtAt(lat, lon)].join("|")]));
loadBounds(read("towns.json"));
out.placeNoStates = place();
loadStates(read("states.json"));
out.placeNoSkTowns = place();
loadSkTowns(read("towns-sk.json"));
if (C.loadTowns) { C.loadTowns(read("towns-sk.json")); try { C.loadTowns(read("towns-at.json")); } catch {} }
out.place = place();

// The credit lines of every city with every source a cut may name, alone and a few together, with the city's art or not.
const SOURCES = [{}, { region: "Kraj Vysočina" }, { dmvs: true }, { dmvs: true, region: "Pardubický kraj" }, { ortho: true },
  ...Object.keys(PASSPORT_NAMES).map((passport) => ({ passport, dmvs: true })),
  ...["ipr", "brno", "plzen", "sk", "at", "xx"].map((orthoCity) => ({ orthoCity })),
  { skTm: true }, ...["bratislava", "presov", "zilina", "bystrica", "kosice", "zvolen", "xx"].map((skTown) => ({ skTown })),
  ...["nitra", "piestany", "zvolen", "hlohovec", "presov", "bratislava-tm", "xx"].map((skEdges) => ({ skEdges })), { skEdges: "bratislava-tm", skTm: true },
  { atSigns: "salzburg" }, { atTown: "wien" }, { zbgis: true }, { atTown: "wien", atSigns: "salzburg", orthoCity: "at" },
  { skTown: "bratislava", skEdges: "bratislava-tm", zbgis: true, orthoCity: "sk" }, { ortho: true, dmvs: true, passport: Object.keys(PASSPORT_NAMES)[0], region: "Jihomoravský kraj" }];
out.credits = {};
for (const id of CITY_IDS) {
  const c = setCity(id);
  SOURCES.forEach((src, i) => { for (const art of [false, true]) out.credits[`${id}|${i}|${art}`] = safe(() => creditLines(c, src, art)); });
  out.credits[`${id}|export`] = safe(() => PRO.exportCredits({ ortho: true }));
}

// The notes of an outage (sources.js outage) for every city and every state of the three requests.
const ok = (value) => ({ status: "fulfilled", value }), no = { status: "rejected", reason: new Error("x") };
const SURF = { failed: no, empty: ok({ features: [] }), some: ok({ features: [1] }), atFailed: ok({ features: [], atFailed: true }), abroad: ok({ features: [], abroad: true }),
  fallback: ok({ features: [1], fallback: true }), dmvsFailed: ok({ features: [], dmvsFailed: true }), linesOnly: ok({ features: [], linesOnly: true }), fromLines: ok({ features: [1], fromLines: true }) };
const LINES = { ok: ok({}), failed: no, opendata: ok({ missing: ["opendata"] }) };
out.outage = {};
for (const id of CITY_IDS) {
  setCity(id);
  for (const [sk, s] of Object.entries(SURF)) for (const [lk, l] of Object.entries(LINES)) for (const [pk, p] of Object.entries({ ok: ok({}), failed: no }))
    for (const fb of ["", "Obruby z ortofota."]) out.outage[`${id}|${sk}|${lk}|${pk}|${fb ? 1 : 0}`] = safe(() => SRC.outage({ surfaces: s, lines: l, parking: p }, undefined, { fallback: fb }));
}

// The signs of each state: file, plate, label, whether it can be drawn, for every sign and choice, on a few parts.
const COUNTRIES = ["CZ", "SK", "AT", null];
const segs = [null, { type: "pruh" }, { type: "pruh", dir: "backward" }, { type: "chodnik" }, { type: "cyklopruh" }, { type: "parkovani", orient: "kolme" }, { type: "parkovani", orient: "podelne", position: "half" }, { type: "stezka_sdilena" }, { type: "bus" }, { type: "tramvaj_pruh" }];
const xs = [...Object.keys(S.SIGNS).flatMap((k) => [{ k }, { k, v: 30 }, { k, dir: "backward" }, { k, walk: "left" }]), ...Object.values(S.SIGN_CHOICES).map(({ label, ...x }) => x)];
out.signs = { dir: Object.fromEntries(COUNTRIES.map((c) => [String(c), safe(() => S.signDir(c ?? undefined))])) };
for (const c of COUNTRIES) for (const x of xs) for (const [si, seg] of segs.entries()) {
  const key = `${c}|${JSON.stringify(x)}|${si}`;
  out.signs[key] = [safe(() => S.signFile(x, seg, c ?? undefined)), safe(() => S.plateFile(x, seg, c ?? undefined)), safe(() => S.drawable(x, seg, c ?? undefined)), si ? undefined : safe(() => S.signLabel(x, c ?? undefined))];
}
// The signs of a profile from OSM tags, for each state (deriveSigns, keepDrawable).
const TAGS = [{ highway: "residential", maxspeed: "30" }, { highway: "residential", oneway: "yes", "oneway:bicycle": "no" }, { highway: "living_street" }, { highway: "pedestrian" },
  { highway: "primary", maxspeed: "50", "parking:both": "lane", "parking:both:orientation": "parallel" }, { highway: "residential", "zone:traffic": "CZ:urban", "zone:maxspeed": "CZ:30" },
  { highway: "residential", motor_vehicle: "no", "motor_vehicle:conditional": "destination" }, { highway: "trunk", motorroad: "yes" }, { highway: "motorway" }, { highway: "cycleway" },
  { highway: "secondary", "turn:lanes": "left|through|right", lanes: "3" }, { highway: "residential", "parking:left:restriction": "no_stopping", "parking:right:restriction": "no_parking" }];
const PROF = () => ({ segments: [{ type: "chodnik", width: 2 }, { type: "parkovani", width: 2, orient: "podelne" }, { type: "cyklopruh", width: 1.5 }, { type: "pruh", width: 3, dir: "backward" }, { type: "pruh", width: 3, dir: "forward" }, { type: "bus", width: 3.25 }, { type: "stezka_sdilena", width: 3 }, { type: "chodnik", width: 2 }], edges: {} });
out.deriveSigns = {};
for (const c of COUNTRIES) for (const [ti, tags] of TAGS.entries()) for (const inZps of [false, true]) for (const alongWay of [true, false]) {
  const p = PROF();
  out.deriveSigns[`${c}|${ti}|${inZps}|${alongWay}`] = safe(() => { S.deriveSigns(p, tags, { inZps, alongWay, country: c || "CZ" }); S.keepDrawable(p, c || "CZ"); return p.segments.map((s) => s.signs || null); });
}

// The width rules of each state (rules.js), through the city of a cut in it: every type at a range of widths, beside
// parking and trams, a tram belt and a one-way street with contraflow cyclists.
const WIDTHS = [0.5, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.5, 4.75, 5, 6, 6.5, 6.6, 7, 8];
const NEXT = [null, { type: "parkovani", width: 2, orient: "podelne" }, { type: "parkovani", width: 5, orient: "kolme" }, { type: "parkovani", width: 2, position: "half" }, { type: "tramvaj", width: 3.25 }];
out.rules = {};
for (const id of ["cesko", "praha", "brno", "slovensko", "austria", "cizina"]) {
  setCity(id);
  for (const type of Object.keys(TYPES)) for (const w of WIDTHS) for (const [ni, n] of NEXT.entries()) for (const extra of [{}, { turn: "left" }, { roadClass: "mk1" }, { roadClass: "dalnice" }, { roadClass: "mk4" }]) {
    if ((extra.turn || extra.roadClass) && !/^pruh/.test(type)) continue;
    const segments = [{ type, width: w, ...extra }];
    if (n) segments.push({ ...n });
    out.rules[`${id}|${type}|${w}|${ni}|${JSON.stringify(extra)}`] = safe(() => R.checkRules({ segments }));
  }
  for (const w of [2, 3, 3.3, 3.6, 3.8, 4.2, 5]) for (const park of [false, true]) for (const lane of [false, true]) {
    const segments = [{ type: "chodnik", width: 2 }, ...(park ? [{ type: "parkovani", width: 2 }] : []), ...(lane ? [{ type: "cyklopruh", width: 1.5 }] : []), { type: "pruh", width: w, signs: [{ k: "oneway", plate: "protismer" }] }, { type: "chodnik", width: 2 }];
    out.rules[`${id}|contra|${w}|${park}|${lane}`] = safe(() => R.checkRules({ segments }));
  }
  for (const w of [3, 3.2, 3.3, 3.5, 3.6, 4]) for (const types of [["tramvaj", "tramvaj"], ["tramvaj_pruh", "tramvaj_pruh"], ["tramvaj_v_pruhu", "tramvaj_v_pruhu"], ["tramvaj", "tramvaj_pruh"]]) for (const poles of [false, true]) {
    const segments = types.map((type) => ({ type, width: w, ...(poles ? { items: [{ kind: "sloup_trakce", f: 0.5 }] } : {}) }));
    out.rules[`${id}|belt|${w}|${types}|${poles}`] = safe(() => R.checkRules({ segments }));
  }
}

// The look of a house (profile.js buildingStyle) for every city, over facts drawn with a fixed seed.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const infos = [];
for (let i = 0; i < 1500; i++) {
  const o = {};
  if (rnd() < 0.7) o.levels = pick([1, 2, 3, 4, 5, 6, 8, 9, 12]);
  if (rnd() < 0.3) o.cornice = o.levels;
  if (rnd() < 0.4) o.roofType = pick([1, 2, 3, 4]);
  if (rnd() < 0.5) o.type = pick(["yes", "apartments", "house", "office", "church", "school", "garage", "industrial", "retail", "terrace", "farm", "detached", "hotel"]);
  if (rnd() < 0.6) o.km = pick([0.1, 0.4, 0.8, 1.5, 2.5, 4, 7, 12]);
  if (rnd() < 0.3) o.built = pick([1880, 1910, 1930, 1950, 1955, 1965, 1975, 1985, 1995, 2005, 2015]);
  if (rnd() < 0.2) o.start = pick([1890, 1925, 1950, 1970, 1990, 2010]);
  if (rnd() < 0.2) o.period = pick([1840, 1900, 1950, 1980, 2010]);
  if (rnd() < 0.15) o.panel = 1;
  if (rnd() < 0.15) o.house = 1;
  if (rnd() < 0.1) o.iprKind = pick([1, 3, 6]);
  if (rnd() < 0.1) o.newBuild = true;
  if (rnd() < 0.15) o.roofShape = pick(["flat", "gabled", "hipped"]);
  if (rnd() < 0.2) o.area = pick([80, 300, 1200, 4000]);
  if (rnd() < 0.25) o.block = pick([{ length: 144, width: 14.8, fill: 0.84, parts: 1 }, { length: 196, width: 85, fill: 0.25, parts: 13 }, { length: 120, width: 80, fill: 0.4, parts: 12 }]);
  infos.push(o);
}
out.houses = {};
for (const id of CITY_IDS) { setCity(id); out.houses[id] = infos.map((info) => safe(() => PRO.buildingStyle(structuredClone(info)))).join(","); }
out.houses.styles = Object.keys(PRO.BUILDING_STYLES).join(",");

// A saved cut loaded again (validate.js cleanCut): places in and around the three states, every source key.
const CUTS = [[50.08, 14.42], [49.19, 16.6], [48.144, 17.11], [48.719, 21.258], [48.998, 21.24], [47.763, 18.13], [48.2085, 16.3731], [47.0707, 15.4395], [47.2654, 11.3927],
  [47.5, 19.04], [52.5, 13.4], [45, 10], [51.9, 18.9], [48.05, 12.1]];
const SRCS = [{}, ...SOURCES, { region: 5 }, { passport: "nic" }, { orthoCity: "ipr", ortho: 1 }];
out.validate = {};
for (const [lat, lon] of CUTS) for (const [i, sources] of SRCS.entries())
  out.validate[`${lat},${lon}|${i}`] = safe(() => V.cleanCut({ lat, lon, bearing: 12.5, name: "X", city: "praha", reach: { left: 20, right: 22 }, span: { left: 10, right: 11 }, note: " · x", sources }));
for (const bad of [null, {}, { lat: "50", lon: 14, bearing: 0 }, { lat: 50, lon: 14, bearing: 400 }, { lat: 50, lon: 14, bearing: 0, reach: { left: 0, right: 80 } }])
  out.validate[`bad|${JSON.stringify(bad)}`] = safe(() => V.cleanCut(bad));

fs.writeFileSync(path.join(DIR, `${A}.${process.env.PROFILY_LANG}.json`), JSON.stringify(out));
console.log(process.env.PROFILY_LANG, Object.entries(out).map(([k, v]) => `${k} ${Object.keys(v).length}`).join(", "));
