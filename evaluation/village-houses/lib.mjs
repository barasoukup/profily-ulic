// Shared helpers of the village-houses measurement: OSM from the local packs, the facts of a house (as sample.mjs of
// all-buildings), its look with and without the rule (?off=vesnice).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
export const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(HERE, "../../pilot/public");
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
class N { constructor(n) { this.name = n; this.attrs = {}; this.children = []; this.text = ""; this.style = {}; this.dataset = {}; this.classList = { add() {}, toggle() {}, contains: () => false }; } setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; } appendChild(c) { this.children.push(c); return c; } append(...c) { this.children.push(...c); } addEventListener() {} set textContent(t) { this.text = String(t); } get textContent() { return this.text; } get firstChild() { return this.children[0]; } }
globalThis.document = { createElementNS: (_, n) => new N(n) };
export const { Pack, PackSet } = await imp("osmpack.js");
export const D = await imp("derive.js"), P = await imp("profile.js"), C = await imp("city.js"), S = await imp("sources.js"), O = await imp("ortho-osm.js");
const read = (f) => JSON.parse(fs.readFileSync(path.join(PUB, f)));
C.loadBounds(read("mesta.json")); C.loadStates(read("staty.json")); C.loadSkTowns?.(read("mesta-sk.json")); C.loadTowns?.(read("mesta-at.json"));
// OSM from the R2 packs (the app's ?osm=r2), ranges read over HTTP; the whole state, villages too.
const PS = new PackSet(["https://data.streetspace.eu/osm"], { timeout: 60000 });
export async function elements(iso, lat, lon, r) {
  const T = 0.005, dy = r / 110574, dx = r / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let x = Math.floor((lon - dx) / T); x <= Math.floor((lon + dx) / T); x++) for (let y = Math.floor((lat - dy) / T); y <= Math.floor((lat + dy) / T); y++) names.push(`${x}_${y}`);
  const seen = new Set();
  const lists = await PS.tiles(names);
  return (Array.isArray(lists[0]) ? lists.flat() : lists).filter((e) => e.type !== "area" || (!seen.has(e.id) && seen.add(e.id)));
}
// The facts of the house at local point p, the way app.js assembles them from OSM (no register).
export function infoOf(els, frame, p, point, off = []) {
  O.P.off = new Set(off);
  const b = D.buildingAt({ elements: els }, frame, p);
  const c = C.city.centre, km = c ? Math.hypot((point[0] - c[0]) * 111.32 * Math.cos((c[1] * Math.PI) / 180), (point[1] - c[1]) * 111.2) : 99;
  const info = { levels: b?.levels, height: b?.height, point, km: +km.toFixed(1), block: b?.block, tint: 0 };
  if (b?.type && b.type !== "yes") info.type = b.type;
  if (b?.roofShape) info.roofShape = b.roofShape;
  if (b?.start) info.start = b.start;
  if (b?.material) info.material = b.material;
  if (b?.footprint) info.footprint = b.footprint;
  if (b?.dense !== undefined) info.dense = b.dense;
  return { found: !!b, info };
}
export async function setPlace(lat, lon) {
  C.setCity(C.cityAt(lat, lon));
  if (C.country.atPlace) try { Object.assign(C.city, await C.country.atPlace(lon, lat)); } catch {}
  return C.country.code;
}
export { imp };
