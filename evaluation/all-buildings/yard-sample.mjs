// The yard rule (not in the app: git apply evaluation/all-buildings/yard-rule.patch first; house-looks.js isWesternSlab, ?off=dvorana): random houses of the states' towns (a new seed, none within
// 40 m of an earlier round's), three arms: old (?off=vsedomy,dvorana), today (?off=dvorana), new. Ids xxyNN: today and
// new are drawn differently; xxaNN: only old and new are. A photo by Mapillary; vzorek4-<ISO>.json keeps no photos.
//   TOKEN=<token.local> [REG=1: ask the register] node yard-sample.mjs <photos dir> AT,CH [yard=30] [all=0] [most houses]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(HERE, "../../pilot/public");
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
const OFF = { old: ["vsedomy", "dvorana"], today: ["dvorana"], new: [] };
const [OUT, isos, WANT = "30", ALL = "0", MOST = "8000"] = process.argv.slice(2);
class N { constructor(n) { this.name = n; this.attrs = {}; this.children = []; this.text = ""; this.style = {}; this.dataset = {}; this.classList = { add() {}, toggle() {}, contains: () => false }; } setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; } appendChild(c) { this.children.push(c); return c; } append(...c) { this.children.push(...c); } addEventListener() {} set textContent(t) { this.text = String(t); } get textContent() { return this.text; } get firstChild() { return this.children[0]; } }
globalThis.document = { createElementNS: (_, n) => new N(n) };
const ser = (n) => n.name + JSON.stringify(n.attrs).replace(/(cut|pc|lamp)\d+/g, "$1") + n.text + n.children.map(ser).join("");
const { Pack } = await imp("osmpack.js"), D = await imp("derive.js"), P = await imp("profile.js"), C = await imp("city.js"), S = await imp("sources.js"), O = await imp("ortho-osm.js");
const read = (f) => JSON.parse(fs.readFileSync(path.join(PUB, f)));
C.loadBounds(read("mesta.json")); C.loadStates(read("staty.json")); C.loadSkTowns?.(read("mesta-sk.json")); C.loadTowns?.(read("mesta-at.json"));
const src = fs.readFileSync(path.join(HERE, "../universal/sample.mjs"), "utf8");
const TOWNS = new Function(`return ${src.slice(src.indexOf("{", src.indexOf("export const TOWNS")), src.indexOf("\n};") + 2)}`)();
// The towns of the app (Prague, Brno) whose register is not the state's are left out.
for (const t of ["praha", "brno"]) delete TOWNS.CZ[t];
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await new Promise((s) => setTimeout(s, 1500)); } return { data: [] }; };
const ROADS = /^(residential|tertiary|secondary|primary|unclassified|living_street)$/;
const tilesOf = {};
async function elements(iso, lat, lon, r) {
  tilesOf[iso] ??= (() => { const fd = fs.openSync(path.join(PUB, `../data/osm-pack/${iso.toLowerCase()}-novy.posm`)); const size = fs.fstatSync(fd).size;
    return new Pack(async (a, b) => { b = Math.min(b, size - 1); const buf = Buffer.alloc(b - a + 1); fs.readSync(fd, buf, 0, buf.length, a); return { bytes: new Uint8Array(buf) }; }); })();
  const T = 0.005, dy = r / 110574, dx = r / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let x = Math.floor((lon - dx) / T); x <= Math.floor((lon + dx) / T); x++) for (let y = Math.floor((lat - dy) / T); y <= Math.floor((lat + dy) / T); y++) names.push(`${x}_${y}`);
  const seen = new Set();
  return (await tilesOf[iso].tiles(names)).flat().filter((e) => e.type !== "area" || (!seen.has(e.id) && seen.add(e.id)));
}
// The facts of the house at p (derive.js, app.js; the register's answer over OSM's as app.js does).
function infoOf(els, frame, p, point, reg, arm) {
  O.P.off = new Set(OFF[arm]);
  const b = D.buildingAt({ elements: els }, frame, p);
  const c = C.city.centre, km = c ? Math.hypot((point[0] - c[0]) * 111.32 * Math.cos((c[1] * Math.PI) / 180), (point[1] - c[1]) * 111.2) : 99;
  const info = { levels: b?.levels, height: b?.height, point, km: +km.toFixed(1), block: b?.block, tint: 0 };
  if (b?.type && b.type !== "yes") info.type = b.type;
  if (b?.roofShape) info.roofShape = b.roofShape;
  if (b?.start) info.start = b.start;
  if (b?.material) info.material = b.material;
  const q = reg || {};
  if (q.fromHeight && info.levels) Object.assign(info, { iprKind: q.kind, area: q.area });
  else if (q.cornice) Object.assign(info, { cornice: q.cornice, roof: q.roof, levels: q.cornice + q.roof, roofType: q.roofType, iprKind: q.kind, newBuild: q.newBuild, area: q.area, src: "ipr" });
  if (q.built) info.built = q.built;
  for (const k of ["panel", "solid", "house", "farm", "office", "garage"]) if (q[k]) info[k] = 1;
  if (q.material && !info.material) info.material = q.material;
  if (q.type && (!info.type || info.type === "yes")) info.type = q.type;
  return info;
}
const drawn = (info) => ser(P.buildSvg({ segments: [{ type: "chodnik", width: 3 }, { type: "pruh", width: 3 }], edges: { left: "budova", leftInfo: info, right: "zadna" } }, { signs: false, whole: true }));
const R = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f)));
const ARMS = Object.keys(OFF);
for (const iso of isos.split(",")) {
  let seed = [...iso].reduce((a, c) => a * 131 + c.charCodeAt(0), 25114477) >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
  const far = (list, q, m) => !list.some((o) => Math.hypot((o[0] - q[0]) * 111320 * Math.cos((q[1] * Math.PI) / 180), (o[1] - q[1]) * 110574) < m);
  const earlier = fs.readdirSync(HERE).filter((f) => /^vzorek[23]?-/.test(f) && f.endsWith(`-${iso}.json`)).flatMap((f) => R(f).rows.map((r) => r.point));
  const rows = [], drawn1 = [], taken = [], noPhoto = { yard: 0, all: 0 }, stat = { houses: 0, yard: 0, all: 0, todayAll: 0, regFailed: 0, noPhoto }, count = { yard: 0, all: 0 }, changes = {};
  const towns = Object.entries(TOWNS[iso]);
  for (let guard = 0; guard < 200000 && (count.yard < +WANT || count.all < +ALL) && stat.houses < +MOST; guard++) {
    const [town, [lat0, lon0]] = towns[guard % towns.length];
    const r = 1500 * Math.sqrt(rnd()), a = rnd() * 2 * Math.PI, lat = lat0 + (r * Math.sin(a)) / 110574, lon = lon0 + (r * Math.cos(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
    const els = await elements(iso, lat, lon, 220), frame = D.localFrame(lat, lon);
    const ways = els.filter((e) => e.type === "way" && ROADS.test(e.tags?.highway || "") && !e.tags.tunnel && !e.tags.bridge && e.geometry?.length > 1);
    if (!ways.length) continue;
    const w = ways[Math.floor(rnd() * ways.length)], k = Math.floor(rnd() * (w.geometry.length - 1)), f = rnd(), side = rnd() < 0.5 ? 1 : -1;
    const A = frame.toXY(w.geometry[k].lon, w.geometry[k].lat), B = frame.toXY(w.geometry[k + 1].lon, w.geometry[k + 1].lat), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (L < 5 || Math.hypot(...A) > 180) continue;
    const c = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f], n = [(-(B[1] - A[1]) / L) * side, ((B[0] - A[0]) / L) * side];
    const houses = els.filter((e) => e.type === "area" && e.tags?.building && e.tags.building !== "roof").map((e) => e.geometry.map((g) => frame.toXY(g.lon, g.lat)));
    const ins = (g, p) => { let s = false; for (let i = 0, j = g.length - 1; i < g.length; j = i++) if (g[i][1] > p[1] !== g[j][1] > p[1] && p[0] < ((g[j][0] - g[i][0]) * (p[1] - g[i][1])) / (g[j][1] - g[i][1]) + g[i][0]) s = !s; return s; };
    let d = 4, hit = null;
    for (; d <= 25 && !hit; d += 0.25) hit = houses.find((g) => ins(g, [c[0] + n[0] * d, c[1] + n[1] * d]));
    if (!hit) continue;
    const p = [c[0] + n[0] * (d + 4), c[1] + n[1] * (d + 4)], point = frame.toLonLat(...p), face = frame.toLonLat(c[0] + n[0] * d, c[1] + n[1] * d);
    if (!far(drawn1, point, 12)) continue;
    C.setCity(C.cityAt(lat, lon));
    if (C.country.code !== iso) continue;
    if (C.country.atPlace) try { Object.assign(C.city, await C.country.atPlace(lon, lat)); } catch {}
    stat.houses++; drawn1.push(point);
    let reg = null, info = Object.fromEntries(ARMS.map((a) => [a, infoOf(els, frame, p, point, null, a)]));
    const same = (a, b) => JSON.stringify({ ...info[a], block: { ...info[a].block, hull: 0 } }) === JSON.stringify({ ...info[b], block: { ...info[b].block, hull: 0 } });
    const look = (a) => P.buildingStyle(info[a]);
    if (same("old", "new") && look("today") === look("new")) continue;
    if (process.env.REG) { try { reg = await Promise.race([S.podlaznost(point[1], point[0]), new Promise((_, no) => setTimeout(() => no(new Error("time")), 15000))]); } catch { stat.regFailed++; } }
    info = Object.fromEntries(ARMS.map((a) => [a, infoOf(els, frame, p, point, reg, a)]));
    const svg = Object.fromEntries(ARMS.map((a) => [a, drawn(info[a])]));
    const yard = svg.today !== svg.new, all = svg.old !== svg.new;
    if (svg.old !== svg.today) stat.todayAll++;
    if (yard) { stat.yard++; const ch = `${look("today")}>${look("new")}`; changes[ch] = (changes[ch] || 0) + 1; }
    if (all) stat.all++;
    const set = yard ? "yard" : all ? "all" : null;
    if (!set || count[set] >= (set === "yard" ? +WANT : +ALL)) continue;
    if (!far(earlier, point, 40) || !far(taken, point, 80)) continue;
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), cc = frame.toLonLat(...c);
    const bb = [cc[0] - 22 / kx, cc[1] - 22 / 110574, cc[0] + 22 / kx, cc[1] + 22 / 110574].map((v) => v.toFixed(6)).join(",");
    const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=60`)).data || [];
    const best = im.map((x) => {
      const [lo, la] = (x.computed_geometry || x.geometry).coordinates, dx = (face[0] - lo) * kx, dy = (face[1] - la) * 110574, dist = Math.hypot(dx, dy);
      const off = (((Math.atan2(dx, dy) * 180) / Math.PI - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180;
      return { x, dist, off, ok: dist > 5 && dist < 26 && (x.is_pano || Math.abs(off) < 33), s: (x.is_pano ? 0 : 5 + Math.abs(off) / 4) + Math.abs(dist - 14) / 4 + (2026 - new Date(x.captured_at).getFullYear()) / 2 };
    }).filter((z) => z.ok).sort((y, z) => y.s - z.s)[0];
    if (!best) { noPhoto[set]++; continue; }
    const id = `${iso}${set === "yard" ? "y" : "a"}${String(++count[set]).padStart(2, "0")}`;
    fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await (await fetch(best.x.thumb_2048_url)).arrayBuffer()));
    taken.push(point);
    rows.push({ id, town, city: C.city.id, point: point.map((v) => +v.toFixed(7)), mapillary: best.x.id, pano: !!best.x.is_pano, dist: +best.dist.toFixed(1), off: +best.off.toFixed(1), panels: C.city.panels, arms: Object.fromEntries(ARMS.map((a) => [a, { look: look(a), info: info[a] }])) });
  }
  fs.writeFileSync(path.join(HERE, `vzorek4-${iso}.json`), JSON.stringify({ stat, changes, rows }, null, 1));
  console.log(iso, JSON.stringify(stat), JSON.stringify(changes), JSON.stringify(count));
}
