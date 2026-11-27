// How often a house is drawn as a panel house (profile.js buildingStyle → "plocha") when it is not one.
// The truth is RÚIAN's "druh svislé nosné konstrukce" (wall panels 4, 41, 43 = panel; bricks, stone,
// monolith… = not). Buildings are sampled from the OSM tiles around the centres of a few cities and
// given the data the app gives them after a click: the OSM building and its block, the city's floors
// (IPR in Prague, RÚIAN elsewhere) and in Prague the age of the area (app/data/built-up-age).
// Answers are cached in evaluation/budovy-panel/cache.json; requests go through polite.mjs.
// Usage: node evaluation/budovy-panel/run.mjs [--per 60] > evaluation/budovy-panel/vysledek.tsv
import fs from "node:fs";
import { politeFetch } from "../polite.mjs";
import { localFrame, buildingAt } from "../../app/public/derive.js";
import { setCity, city } from "../../app/public/city.js";
import { buildingStyle } from "../../app/public/profile.js";
import { PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "../../app/public/queries.js";
import { RUIAN_HALL, RUIAN_LOW } from "../../app/public/gis.js";
import { decodeTile, mergePieces } from "../../app/public/osmtile.js";

const DIR = "evaluation/budovy-panel";
const PER = +(process.argv[process.argv.indexOf("--per") + 1] || 60);
const CACHE_FILE = `${DIR}/cache.json`;
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};
const save = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
async function getJSON(url) {
  if (cache[url]) return cache[url];
  for (let i = 0; i < 3; i++) {
    try { const r = await politeFetch(url); if (r.ok) { const j = await r.json(); if (!j.error) { cache[url] = j; save(); return j; } } } catch {}
  }
  return null;
}
const q = (base, o) => `${base}?${new URLSearchParams(o)}`;
const pointQ = (lon, lat, fields) => ({ geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: fields, returnGeometry: "false", f: "json" });

const RUIAN_SO = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/3/query";
const PANEL = new Set([4, 41, 43]), NOT_PANEL = new Set([1, 2, 3, 5, 6, 10, 11, 42, 61, 62, 63, 64, 65, 66]);

// The cities: [label, city id the app uses there, centre, radius km]. "cesko" has no centre (as in the app).
const CITIES = [
  ["Praha", "praha", [14.4208, 50.0875], 8],
  ["Plzeň", "plzen", null, 4],
  ["Ostrava", "ostrava", null, 5],
  ["Pardubice", "pardubice", null, 3],
  ["Hradec Králové", "cesko", [15.8327, 50.2092], 3.5],
  ["Olomouc", "cesko", [17.2509, 49.5938], 3.5],
  ["České Budějovice", "cesko", [14.4747, 48.9745], 3.5],
  ["Liberec", "cesko", [15.0563, 50.7671], 3.5],
  ["Zlín", "cesko", [17.6667, 49.2265], 3],
  ["Tábor", "cesko", [14.6578, 49.4144], 2],
  ["Vysoké Mýto", "cesko", [16.1617, 49.9532], 1.5],
  // Controls: whole panel estates, where nearly every block of flats is a panel house (how RÚIAN codes them).
  ["kontrola Jižní Město", "cesko", [14.505, 50.030], 1.2],
  ["kontrola Lesná", "cesko", [16.623, 49.226], 0.7],
  ["kontrola Poruba", "cesko", [18.160, 49.830], 0.8],
];
const SKIP_TYPES = new Set(["house", "detached", "semidetached_house", "terrace", "bungalow", "villa", "farm", "garage", "garages", "shed", "roof", "carport", "hut", "cabin", "church", "chapel", "greenhouse", "industrial", "warehouse", "retail", "supermarket", "manufacture", "service", "kiosk", "transformer_tower", "construction", "ruins", "static_caravan"]);

// A seeded random (mulberry32) so the sample stays the same.
let seed = 20261116;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const TILE = 0.005, tiles = new Map();
const tile = (k) => { if (!tiles.has(k)) { try { tiles.set(k, decodeTile(fs.readFileSync(`app/data/osm-tiles/${k}.json`, "utf8"))); } catch { tiles.set(k, []); } } return tiles.get(k); };
const around = (lat, lon) => {
  const lists = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) lists.push(tile(`${Math.floor(lon / TILE) + dx}_${Math.floor(lat / TILE) + dy}`));
  return { elements: mergePieces(lists) };
};
const VY = 0.01, vyTiles = new Map();
const insideRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function vyvoj(lat, lon) {
  const k = `${Math.floor(lon / VY)}_${Math.floor(lat / VY)}`;
  if (!vyTiles.has(k)) { try { vyTiles.set(k, JSON.parse(fs.readFileSync(`app/data/built-up-age/${k}.json`, "utf8"))); } catch { vyTiles.set(k, null); } }
  const polys = vyTiles.get(k); if (!polys) return undefined;
  let year = 2020;
  for (const [rok, rings] of polys) if (rok < year && rings.some((r) => insideRing(r, lon, lat))) year = rok;
  return year;
}
const area = (g) => { const f = localFrame(g[0].lat, g[0].lon); const r = g.map((p) => f.toXY(p.lon, p.lat)); return Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2; };

console.log(["mesto", "lat", "lon", "osm", "patra", "rok", "obdobi", "konstrukce", "pravda", "styl", "km", "blok_sirka", "blok_delka", "blok_casti", "blok_fill", "deska"].join("\t"));
for (const [label, id, centre0, R] of CITIES) {
  setCity(id);
  const centre = centre0 || city.centre;
  // Candidate buildings: OSM areas whose tiles lie within R km of the centre.
  const kx = 111.32 * Math.cos((centre[1] * Math.PI) / 180), ky = 111.2;
  const cand = [];
  const nx = Math.ceil(R / kx / TILE), ny = Math.ceil(R / ky / TILE);
  const cx = Math.floor(centre[0] / TILE), cy = Math.floor(centre[1] / TILE);
  const seen = new Set();
  for (let dx = -nx; dx <= nx; dx++) for (let dy = -ny; dy <= ny; dy++) for (const el of tile(`${cx + dx}_${cy + dy}`)) {
    const b = el.tags?.building; if (el.type !== "area" || !b || b === "no" || SKIP_TYPES.has(b) || seen.has(el.id)) continue;
    seen.add(el.id);
    const lon = el.geometry.reduce((a, g) => a + g.lon, 0) / el.geometry.length, lat = el.geometry.reduce((a, g) => a + g.lat, 0) / el.geometry.length;
    if (Math.hypot((lon - centre[0]) * kx, (lat - centre[1]) * ky) > R) continue;
    if (!insideRing(el.geometry.map((g) => [g.lon, g.lat]), lon, lat) || area(el.geometry) < 150) continue;
    cand.push({ el, lat, lon });
  }
  cand.sort((a, b) => String(a.el.id).localeCompare(String(b.el.id)));
  let done = 0;
  while (done < PER && cand.length) {
    const { el, lat, lon } = cand.splice(Math.floor(rnd() * cand.length), 1)[0];
    const ru = await getJSON(q(RUIAN_SO, pointQ(lon, lat, "pocetpodlazi,zpusobvyuzitikod,dokonceni,druhkonstrukcekod,zastavenaplocha")));
    const a = ru?.features?.[0]?.attributes;
    if (!a) continue;
    const walls = a.druhkonstrukcekod, truth = PANEL.has(walls) ? "panel" : NOT_PANEL.has(walls) ? "jiny" : "?";
    if (truth === "?") continue; // only houses whose walls RÚIAN knows
    const use = a.zpusobvyuzitikod;
    if (use === 7 || use === 8 || use === 18 || RUIAN_HALL.has(use)) continue; // family houses, cottages, garages, halls: not the question
    const frame = localFrame(lat, lon);
    const b = buildingAt(around(lat, lon), frame, [0, 0]);
    const km = city.centre ? +Math.hypot((lon - city.centre[0]) * kx, (lat - city.centre[1]) * ky).toFixed(1) : 99;
    const info = { levels: b?.levels, height: b?.height, km, block: b?.block, type: b?.type };
    if (id === "praha") {
      const p = podlaznostInfo(await getJSON(q(PODLAZNOST, pointQ(lon, lat, PODLAZNOST_FIELDS))) || {}, lat);
      if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, roofType: p.roofType, iprKind: p.kind, newBuild: p.newBuild, area: p.area });
      const y = vyvoj(lat, lon); if (y) info.period = y;
      // And RÚIAN's year, walls and use, as the app asks since 16. 11. 2026 (app.js ruianFacts).
      if (a.dokonceni) info.built = new Date(a.dokonceni).getUTCFullYear();
      if (PANEL.has(walls)) info.panel = 1;
      if (NOT_PANEL.has(walls)) info.solid = 1;
      if (use === 7 || use === 8) info.house = 1;
    } else {
      // As gis.js ruianBuilding (the towns and the rest of the country).
      const floors = a.pocetpodlazi;
      if (floors) Object.assign(info, { cornice: floors, roof: 0, levels: floors, iprKind: RUIAN_HALL.has(use) ? 3 : RUIAN_LOW.has(use) ? 6 : undefined, area: a.zastavenaplocha || undefined });
      if (a.dokonceni) info.built = new Date(a.dokonceni).getUTCFullYear();
      if (PANEL.has(walls) || walls === 42) info.panel = 1;
    }
    const style = buildingStyle(info);
    const bl = info.block || {};
    const slab = bl.fill >= 0.65 && bl.width <= 16 || (bl.parts >= 2 && (bl.length + bl.width) / bl.parts >= 30);
    console.log([label, lat.toFixed(6), lon.toFixed(6), b?.type || "", info.levels || "", info.built || "", info.period || "", walls, truth, style, km,
      bl.width?.toFixed(1) ?? "", bl.length?.toFixed(1) ?? "", bl.parts ?? "", bl.fill?.toFixed(2) ?? "", slab ? 1 : 0].join("\t"));
    done++;
  }
}
