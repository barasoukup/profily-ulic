// Washington's houses without CAMA and with it (towns/usa.js podlaznost, Bára 25. 11. 2026): 40 fresh random houses (fixed
// seed, not those of houses/rules), a Mapillary photo facing each; the app's facts (derive.js buildingAt, app.js) without and
// with the service's answer. dc.json: houses/rules/sample.mjs.
//   TOKEN=<token.local> node ab.mjs <scratch dir with dc.json> [n=40]      photos go to the scratch directory only
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(HERE, "../../../pilot/public");
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
const OUT = process.argv[2], WANT = Number(process.argv[3] || 40);
globalThis.document ??= { createElementNS: () => ({}) };
const C = await imp("city.js"), D = await imp("derive.js"), P = await imp("profile.js"), US = await imp("towns/usa.js");
C.setCity("washington");
const data = JSON.parse(fs.readFileSync(path.join(OUT, "dc.json")));
let seed = Number(process.env.SEED || 425001);
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
const KX = 111320 * Math.cos((38.9 * Math.PI) / 180), KY = 110574;
const old = ["sample.json", "sample2.json"].flatMap((f) => JSON.parse(fs.readFileSync(path.join(HERE, "../houses/rules", f)))).map((s) => s.probe);
if (process.env.RUN) old.push(...JSON.parse(fs.readFileSync(path.join(HERE, "vzorek.json"))).rows.map((r) => r.probe));
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await new Promise((s) => setTimeout(s, 1500)); } return { data: [] }; };
const lens = data.ways.map((w) => w.g.slice(1).reduce((s, q, i) => s + Math.hypot((q[0] - w.g[i][0]) * KX, (q[1] - w.g[i][1]) * KY), 0)), total = lens.reduce((a, b) => a + b, 0);
const rows = [];
while (rows.length < WANT) {
  let r = rnd() * total, wi = 0;
  while (r > lens[wi]) r -= lens[wi++];
  const side = rnd() < 0.5 ? 1 : -1, w = data.ways[wi];
  let i = 0, seg = 0;
  for (; i < w.g.length - 1; i++) { seg = Math.hypot((w.g[i + 1][0] - w.g[i][0]) * KX, (w.g[i + 1][1] - w.g[i][1]) * KY); if (r <= seg) break; r -= seg; }
  if (i >= w.g.length - 1 || seg < 5) continue;
  const a = w.g[i], b = w.g[i + 1], nx = (-(b[1] - a[1]) * KY * side) / seg, ny = ((b[0] - a[0]) * KX * side) / seg;
  const c = [a[0] + ((b[0] - a[0]) * r) / seg, a[1] + ((b[1] - a[1]) * r) / seg], at = (d) => [c[0] + (nx * d) / KX, c[1] + (ny * d) / KY];
  const near = data.buildings.filter((q) => Math.abs(q.geometry[0].lon - c[0]) < 0.0025 && Math.abs(q.geometry[0].lat - c[1]) < 0.002);
  const hit = (p) => near.find((q) => { let s = false; const g = q.geometry; for (let k = 0, j = g.length - 1; k < g.length; j = k++) if ((g[k].lat > p[1]) !== (g[j].lat > p[1]) && p[0] < ((g[j].lon - g[k].lon) * (p[1] - g[k].lat)) / (g[j].lat - g[k].lat) + g[k].lon) s = !s; return s; });
  let d = 4, h = null;
  for (; d <= 28 && !(h = hit(at(d))); d += 0.25);
  const probe = at(d + 4);
  if (!h || [...old, ...rows.map((q) => q.probe)].some((q) => Math.hypot((q[0] - probe[0]) * KX, (q[1] - probe[1]) * KY) < 80)) continue;
  const bb = [c[0] - 22 / KX, c[1] - 22 / KY, c[0] + 22 / KX, c[1] + 22 / KY].map((v) => v.toFixed(6)).join(","), face = at(d);
  const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=60`)).data || [];
  const best = im.map((x) => {
    const [lo, la] = (x.computed_geometry || x.geometry).coordinates, dx = (face[0] - lo) * KX, dy = (face[1] - la) * KY, dist = Math.hypot(dx, dy);
    const off = (((Math.atan2(dx, dy) * 180) / Math.PI - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180;
    return { x, dist, off, ok: dist > 5 && dist < 26 && (x.is_pano || Math.abs(off) < 33), s: (x.is_pano ? 0 : 5 + Math.abs(off) / 4) + Math.abs(dist - 14) / 4 + (2026 - new Date(x.captured_at).getFullYear()) / 2 };
  }).filter((z) => z.ok).sort((y, z) => y.s - z.s)[0];
  if (!best) continue;
  const id = `C${process.env.RUN ? "x" : ""}${String(rows.length + 1).padStart(2, "0")}`;
  fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await (await fetch(best.x.thumb_2048_url)).arrayBuffer()));
  const frame = { toXY: (x, y) => [(x - probe[0]) * KX, (y - probe[1]) * KY], toLonLat: (x, y) => [probe[0] + x / KX, probe[1] + y / KY] };
  const o = D.buildingAt({ elements: near }, frame, [0, 0]);
  const facts = (p) => {
    const info = { levels: o?.levels, height: o?.height, point: probe, km: 99, block: o?.block, tint: rows.length % 4 };
    if (o?.type && o.type !== "yes") info.type = o.type;
    if (o?.roofShape) info.roofShape = o.roofShape;
    if (o?.start) info.start = o.start;
    if (o?.material) info.material = o.material;
    if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, src: "ipr" });
    if (p.built) info.built = p.built;
    if (p.material && !info.material) info.material = p.material;
    if (p.type && (!info.type || info.type === "yes")) info.type = p.type;
    return { look: P.buildingStyle(info), info };
  };
  const cama = await US.sources.podlaznost(probe[1], probe[0]);
  await new Promise((s) => setTimeout(s, 700));
  rows.push({ id, street: w.name, city: "washington", point: probe.map((v) => +v.toFixed(7)), probe, mapillary: best.x.id, pano: !!best.x.is_pano, dist: +best.dist.toFixed(1), off: +best.off.toFixed(1), tags: h.tags, cama, before: facts({}), after: facts(cama) });
}
fs.writeFileSync(path.join(HERE, process.env.RUN ? `vzorek${process.env.RUN}.json` : "vzorek.json"), JSON.stringify({ rows }, null, 1));
console.log(rows.map((r) => `${r.id} ${r.tags.building} ${r.tags["building:levels"] || "-"} | ${r.cama.type || "-"} ${r.cama.cornice || "-"} ${r.cama.built || "-"} ${r.cama.material || "-"} | ${r.before.look} > ${r.after.look}`).join("\n"));
