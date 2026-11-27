// The small-house rule (house-looks.js smallHouse, ?off=vesnice): random houses of the states' towns and the villages round
// them (fixed seed), the look with and without the rule; the register of buildings (podlaznost) where the state has one is
// asked only of the houses the rule changes. A photo from Mapillary of each changed house; controls: houses with known floors
// or height, which the rule must not touch (counted, not photographed).
//   TOKEN=<token.local> SEED=n node sample.mjs <scratch dir> DE,AT,… [changed=12] [most houses=400]
// Photos go to the scratch directory only; vzorek<RUN>-<ISO>.json (houses, no photos) to this folder.
import fs from "node:fs";
import path from "node:path";
import { D, P, C, S, HERE, elements, infoOf, setPlace } from "./lib.mjs";
const [OUT, isos, WANT = "12", MOST = "400"] = process.argv.slice(2);
globalThis.PROFILY_CA = {};
const src = fs.readFileSync(path.join(HERE, "../universal/sample.mjs"), "utf8");
const TOWNS = new Function(`return ${src.slice(src.indexOf("{", src.indexOf("export const TOWNS")), src.indexOf("\n};") + 2)}`)();
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await new Promise((s) => setTimeout(s, 1500)); } return { data: [] }; };
const ROADS = /^(residential|tertiary|secondary|primary|unclassified|living_street)$/;
// MODE=panel: the panel rule (?off=panel2) instead of the small-house one (the small-house rule stays on in both).
const FLAG = process.env.MODE === "panel" ? "panel2" : "vesnice";
// (the panel rule is the default since 27. 11.; ?off=panel2 the old look)
const look = (info, off) => { if (FLAG === "panel2") { globalThis.PROFILY_CA.off = off ? "panel2" : ""; return P.buildingStyle(info); } globalThis.PROFILY_CA.off = off ? FLAG : ""; return P.buildingStyle(info); };
for (const iso of isos.split(",")) {
  let seed = [...iso].reduce((a, c) => a * 131 + c.charCodeAt(0), Number(process.env.SEED || 20261127)) >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
  const rows = [], controls = [], drawn1 = [], stat = { houses: 0, noData: 0, changed: 0, regCut: 0, noPhoto: 0, dataChanged: 0, villages: 0, pairs: {} };
  const towns = Object.entries(TOWNS[iso]);
  for (let guard = 0; guard < 60000 && rows.length < +WANT && stat.houses < +MOST; guard++) {
    const [town, [lat0, lon0]] = towns[guard % towns.length];
    const far = rnd() < 0.6, R = far ? 12000 : 1500;
    const r = R * Math.sqrt(rnd()), a = rnd() * 2 * Math.PI, lat = lat0 + (r * Math.sin(a)) / 110574, lon = lon0 + (r * Math.cos(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180));
    let els; try { els = await elements(iso, lat, lon, 220); } catch { continue; }
    const frame = D.localFrame(lat, lon);
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
    if (drawn1.some((q) => Math.hypot((q[0] - point[0]) * 70000, (q[1] - point[1]) * 110574) < 40)) continue;
    const code = await setPlace(lat, lon);
    if (code !== iso) continue;
    stat.houses++; drawn1.push(point);
    const o = infoOf(els, frame, p, point);
    if (!o.found) continue;
    const l0 = look(o.info, true), l1 = look(o.info, false);
    if (FLAG === "vesnice" && (o.info.levels || o.info.height)) {
      // A control: floors known, the rule must not touch it.
      if (controls.length < 400) controls.push({ town, point, info: o.info, look: l0 });
      if (l0 !== l1) stat.dataChanged++;
      continue;
    }
    stat.noData++;
    if (l0 === l1) continue;
    // Asked the register (the state's own data on the house) before it counts as changed.
    let reg = null;
    try { reg = await Promise.race([S.podlaznost(point[1], point[0]), new Promise((_, no) => setTimeout(() => no(new Error("time")), 15000))]); } catch {}
    const info = { ...o.info };
    if (reg) {
      if (reg.fromHeight && info.levels) Object.assign(info, { iprKind: reg.kind, area: reg.area });
      else if (reg.cornice) Object.assign(info, { cornice: reg.cornice, roof: reg.roof, levels: reg.cornice + reg.roof, roofType: reg.roofType, iprKind: reg.kind, newBuild: reg.newBuild, area: reg.area, src: "ipr" });
      if (reg.built) info.built = reg.built;
      for (const kk of ["panel", "solid", "house", "farm", "office", "garage"]) if (reg[kk]) info[kk] = 1;
      if (reg.type && (!info.type || info.type === "yes")) info.type = reg.type;
    }
    const m0 = look(info, true), m1 = look(info, false);
    if (m0 === m1) { stat.regCut++; continue; }
    stat.changed++; stat.pairs[`${m0}>${m1}`] = (stat.pairs[`${m0}>${m1}`] || 0) + 1;
    if (far) stat.villages++;
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), cc = frame.toLonLat(...c);
    const bb = [cc[0] - 22 / kx, cc[1] - 22 / 110574, cc[0] + 22 / kx, cc[1] + 22 / 110574].map((v) => v.toFixed(6)).join(",");
    const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=60`)).data || [];
    const best = im.map((x) => {
      const [lo, la] = (x.computed_geometry || x.geometry).coordinates, dx = (face[0] - lo) * kx, dy = (face[1] - la) * 110574, dist = Math.hypot(dx, dy);
      const off = (((Math.atan2(dx, dy) * 180) / Math.PI - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180;
      return { x, dist, off, ok: dist > 5 && dist < 26 && (x.is_pano || Math.abs(off) < 33), s: (x.is_pano ? 0 : 5 + Math.abs(off) / 4) + Math.abs(dist - 14) / 4 + (2026 - new Date(x.captured_at).getFullYear()) / 2 };
    }).filter((z) => z.ok).sort((y, z) => y.s - z.s)[0];
    if (!best) { stat.noPhoto++; continue; }
    const id = `${iso}${process.env.RUN || ""}${String(rows.length + 1).padStart(2, "0")}`;
    fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await (await fetch(best.x.thumb_2048_url)).arrayBuffer()));
    rows.push({ id, town, far, city: C.city.id, point: point.map((v) => +v.toFixed(7)), mapillary: best.x.id, pano: !!best.x.is_pano, dist: +best.dist.toFixed(1), off: +best.off.toFixed(1), panels: C.city.panels, before: { look: m0, info }, after: { look: m1, info } });
  }
  fs.writeFileSync(path.join(HERE, `vzorek${process.env.RUN || ""}-${iso}.json`), JSON.stringify({ stat, rows, controls }, null, 1));
  console.log(iso, JSON.stringify(stat), rows.map((r) => `${r.before.look}>${r.after.look}`).join(" "));
}
