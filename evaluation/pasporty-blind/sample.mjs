// The blind re-measurement of the passports of Šlapanice and Kuřim (towns/pasporty.js; 26. 11. 2026): random points on
// the OSM streets inside each town's passport boundary (app/public/pasporty.json), weighted by length (every metre of
// a street the same chance), from the local OSM pack of Czechia; seed 20261126; at least 60 m from each other, 15 m
// from a way's end and 100 m from the old sample (evaluation/<town>/data/samples.json of the A/B of 26. 11.).
// Roads that a click cuts: trunk … living_street, pedestrian, service (not driveways, parking aisles).
//   node evaluation/pasporty-blind/sample.mjs [count a town = 80]  → sample.json
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname), W = path.join(HERE, "../..");
const { Pack } = await import(W + "/app/public/osmpack.js");
const { mergePieces, TILE } = await import(W + "/app/public/osmtile.js");
const idx = JSON.parse(fs.readFileSync(W + "/app/data/osm-pack/index.json", "utf8"));
const fd = fs.openSync(W + "/app/data/osm-pack/" + idx.files.cz, "r");
const pack = new Pack(async (s, e) => { const b = Buffer.alloc(e - s + 1); fs.readSync(fd, b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, b.byteOffset, b.length) }; });
const BOUNDS = JSON.parse(fs.readFileSync(W + "/app/public/pasporty.json", "utf8"));
const OLD_DIR = process.env.OLD_DIR || "/Users/barasoukupova/streetdesign/.claude/worktrees/canada/evaluation";
const N = Number(process.argv[2] || 80);
const ROAD = /^(trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service)$/;
const NOT = new Set(["driveway", "parking_aisle", "drive-through", "emergency_access"]);
let seed = 20261126;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const out = [];
for (const town of ["slapanice", "kurim"]) {
  const rings = BOUNDS[town], all = rings.flat();
  const inside = (x, y) => rings.filter((r) => inRing(r, x, y)).length % 2 === 1;
  const lo = all.map((p) => p[0]), la = all.map((p) => p[1]), names = [];
  for (let ix = Math.floor(Math.min(...lo) / TILE); ix <= Math.floor(Math.max(...lo) / TILE); ix++) for (let iy = Math.floor(Math.min(...la) / TILE); iy <= Math.floor(Math.max(...la) / TILE); iy++) names.push(`${ix}_${iy}`);
  const els = mergePieces(await pack.tiles(names));
  const old = JSON.parse(fs.readFileSync(path.join(OLD_DIR, town, "data", "samples.json"), "utf8")).samples;
  const segs = [];
  let total = 0;
  for (const w of els.sort((a, b) => a.id - b.id)) {
    const t = w.tags || {};
    if (w.type !== "way" || !ROAD.test(t.highway || "") || NOT.has(t.service) || (t.tunnel && t.tunnel !== "no") || t.area === "yes" || /private|^no$/.test(t.access || "")) continue;
    const g = w.geometry, cos = Math.cos((g[0].lat * Math.PI) / 180);
    let from = 0;
    const L = g.slice(1).reduce((s, q, i) => s + Math.hypot((q.lat - g[i].lat) * 110574, (q.lon - g[i].lon) * 111320 * cos), 0);
    for (let i = 1; i < g.length; i++) {
      const a = g[i - 1], b = g[i], len = Math.hypot((b.lat - a.lat) * 110574, (b.lon - a.lon) * 111320 * cos);
      if (len && inside((a.lon + b.lon) / 2, (a.lat + b.lat) / 2)) { segs.push({ a, b, from: total, len, w, at: from, L }); total += len; }
      from += len;
    }
  }
  const dist = (p, q) => Math.hypot((p.lat - q.lat) * 110574, (p.lon - q.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180));
  const mine = [];
  for (let tries = 0; mine.length < N && tries < 20000; tries++) {
    const d = rnd() * total, s = segs.find((x) => d < x.from + x.len), f = (d - s.from) / s.len, along = s.at + f * s.len;
    if (along < 15 || s.L - along < 15) continue;
    const p = { lat: s.a.lat + (s.b.lat - s.a.lat) * f, lon: s.a.lon + (s.b.lon - s.a.lon) * f };
    if (mine.some((q) => dist(p, q) < 60)) continue;
    const near = Math.min(...old.map((q) => dist(p, q)));
    if (near < 100) continue;
    mine.push({ id: `${town === "slapanice" ? "s" : "k"}-${mine.length + 1}`, town, country: "CZ", highway: s.w.tags.highway, name: s.w.tags.name || "", wayId: s.w.id, lat: +p.lat.toFixed(7), lon: +p.lon.toFixed(7), oldDist: Math.round(near) });
  }
  console.error(town, mine.length, "bodů,", (total / 1000).toFixed(1), "km ulic, starých bodů", old.length);
  out.push(...mine);
}
fs.writeFileSync(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
