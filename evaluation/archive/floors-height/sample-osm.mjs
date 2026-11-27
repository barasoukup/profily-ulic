// A fresh sample of OSM buildings that have a height and no building:levels (the Europe's way into floors: profile.js heightFloors)
// where the rule of floors.js differs from the old height / 3.5: random buildings of the tiles (a fixed seed), a Mapillary photo
// facing the nearest wall. Mixed in blind: a few the rule leaves.
//   TILES=<osm-tiles> TOKEN=<token.local> node sample-osm.mjs <scratch dir> <changed> <kept>     (the token is never printed)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(HERE, "../../../app/public");
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
const OUT = process.argv[2], CHANGED = Number(process.argv[3] || 36), KEEP = Number(process.argv[4] || 8);
fs.mkdirSync(OUT, { recursive: true });
const { decodeTile } = await imp("osmtile.js"), F = await imp("floors.js");
const TILES = process.env.TILES;
const files = fs.readdirSync(TILES).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort();
const cands = [];
for (const f of files) for (const x of decodeTile(fs.readFileSync(path.join(TILES, f), "utf8"))) {
  const t = x.tags; if (!t?.building || t["building:levels"] || !t.height || !x.geometry?.length) continue;
  const h = parseFloat(t.height); if (!(h > 2)) continue;
  const type = t.building === "yes" ? undefined : t.building, roofShape = t["roof:shape"];
  const oldN = Math.round(h / 3.5), newN = F.floorsFromHeight(h, { type, roofShape });
  if (!newN || /^(garage|garages|shed|roof|carport|hut|cabin|service|construction|ruins|church|chapel|cathedral|synagogue)$/.test(t.building)) continue;
  cands.push({ id: x.id, tags: t, g: x.geometry, h, oldN, newN, changed: oldN !== newN });
}
console.log("candidates", cands.length, "changed", cands.filter((c) => c.changed).length);
let seed = Number(process.env.SEED || 20271128);
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
const token = fs.readFileSync(process.env.TOKEN, "utf8").trim().replace(/^.*=/, "").replace(/["']/g, "");
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const mly = async (q) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(`https://graph.mapillary.com/${q}`, { headers: { Authorization: `OAuth ${token}` } }); if (r.ok) return await r.json(); } catch {} await sleep(1500); } return { data: [] }; };
const rows = [], used = [];
let nc = 0, nk = 0;
for (const c of cands) {
  if (nc >= CHANGED && nk >= KEEP) break;
  if (c.changed ? nc >= CHANGED : nk >= KEEP) continue;
  const lat0 = c.g.reduce((s, p) => s + p.lat, 0) / c.g.length, lon0 = c.g.reduce((s, p) => s + p.lon, 0) / c.g.length;
  const KX = 111320 * Math.cos((lat0 * Math.PI) / 180), KY = 110574;
  if (used.some((q) => Math.hypot((q[0] - lon0) * KX, (q[1] - lat0) * KY) < 60)) continue;
  const ring = c.g.map((p) => [(p.lon - lon0) * KX, (p.lat - lat0) * KY]);
  const wall = (x, y) => { let best = null; for (let k = 0; k < ring.length - 1; k++) { const [ax, ay] = ring[k], [bx, by] = ring[k + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)), px = ax + u * dx, py = ay + u * dy, d = Math.hypot(x - px, y - py); if (!best || d < best.d) best = { d, px, py }; } return best; };
  const bb = [lon0 - 40 / KX, lat0 - 40 / KY, lon0 + 40 / KX, lat0 + 40 / KY].map((v) => v.toFixed(6)).join(",");
  const im = (await mly(`images?fields=id,computed_geometry,geometry,computed_compass_angle,compass_angle,is_pano,captured_at,thumb_2048_url&bbox=${bb}&limit=80`)).data || [];
  const best = im.map((x) => {
    const [lo, la] = (x.computed_geometry || x.geometry).coordinates, X = (lo - lon0) * KX, Y = (la - lat0) * KY, w = wall(X, Y), dist = w.d;
    const dx = w.px - X, dy = w.py - Y;
    const off = (((Math.atan2(dx, dy) * 180) / Math.PI - (x.computed_compass_angle ?? x.compass_angle) + 540) % 360) - 180;
    return { x, dist, off, ok: dist > 5 && dist < 26 && (x.is_pano || Math.abs(off) < 33), s: (x.is_pano ? 0 : 5 + Math.abs(off) / 4) + Math.abs(dist - 14) / 4 + (2027 - new Date(x.captured_at).getFullYear()) / 2 };
  }).filter((z) => z.ok).sort((y, z) => y.s - z.s)[0];
  await sleep(300);
  if (!best) continue;
  const id = `E${String(rows.length + 1).padStart(2, "0")}`;
  fs.writeFileSync(path.join(OUT, `${id}.jpg`), Buffer.from(await (await fetch(best.x.thumb_2048_url)).arrayBuffer()));
  used.push([lon0, lat0]); c.changed ? nc++ : nk++;
  rows.push({ id, osm: c.id, probe: [lon0, lat0], mapillary: best.x.id, pano: !!best.x.is_pano, dist: +best.dist.toFixed(1), off: +best.off.toFixed(1), tags: c.tags, h: c.h, old: c.oldN, now: c.newN, changed: c.changed });
  console.log(id, c.tags.building, c.tags["roof:shape"] || "-", c.h, c.oldN, "->", c.newN, c.changed ? "CHANGED" : "kept");
}
fs.writeFileSync(path.join(HERE, process.env.OUTFILE || "sample-osm.json"), JSON.stringify({ rows }, null, 1));
