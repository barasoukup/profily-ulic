// The blind A/B of "a street on a bridge ends at its deck's edge" (Bára 26. 11. 2026, ortho-osm.js deckSpans, ?off=mostdeska):
// a new random sample of road bridges from the local OSM packs with the decks added (patch-pack.mjs), in the states
// where the app estimates from the orthophoto and OSM and the judge has an open orthophoto (as ../blind/sample.mjs,
// without Czechia, Slovakia whose pack has no decks here, and Denmark whose orthophoto needs a key). Only bridges whose
// middle lies on a deck OSM maps (elsewhere the change does nothing: coverage.mjs counts how often that is).
// Blocks of the packs drawn weighted by their bytes, the bridges in them at random (seed 20261127), at most PER a state,
// a bridge way of at least 15 m, none within 150 m of the earlier samples (../points.json, ../blind/sample.json, the
// Kraków case), each with a Mapillary photo within 30 m. Writes sample.json.
//   node evaluation/bridge-water/edge/sample.mjs
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname), W = path.join(HERE, "../../..");
const { Pack } = await import(W + "/pilot/public/osmpack.js");
const { mergePieces } = await import(W + "/pilot/public/osmtile.js");
const { WATER } = await import(W + "/pilot/public/ortho-osm.js");
const dir = W + "/pilot/data/osm-pack/", idx = JSON.parse(fs.readFileSync(dir + "index.json"));
const STATES = { pl: "PL", at: "AT", de: "DE", fr: "FR", es: "ES", pt: "PT", it: "IT", si: "SI", ee: "EE", fi: "FI", lt: "LT", be: "BE", lu: "LU", nl: "NL", ch: "CH" };
const PER = Number(process.env.PER || 5), BLOCKS = Number(process.env.BLOCKS || 5), TARGET = Number(process.env.TARGET || 60);
let seed = 20261127;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const OLD = [...JSON.parse(fs.readFileSync(path.join(HERE, "../points.json"), "utf8")), ...JSON.parse(fs.readFileSync(path.join(HERE, "../blind/sample.json"), "utf8")), { lat: 50.05278, lon: 19.91553 }];
const ROAD = /^(trunk|primary|secondary|tertiary|residential|unclassified|living_street)$/;
const TOKEN = fs.readFileSync(path.join(W, "evaluation/streetview/token.local"), "utf8").trim();
const dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if (a.lat > y !== b.lat > y && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) c = !c; } return c; };
const inArea = (e, p) => p.lon >= e.bb[0] && p.lon <= e.bb[2] && p.lat >= e.bb[1] && p.lat <= e.bb[3] && inRing(e.geometry, p.lon, p.lat) && !(e.holes || []).some((h) => inRing(h, p.lon, p.lat));
const bbOf = (e) => { const la = e.geometry.map((g) => g.lat), lo = e.geometry.map((g) => g.lon); return [Math.min(...lo), Math.min(...la), Math.max(...lo), Math.max(...la)]; };
async function photo(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 3, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const cands = [];
for (const [code, iso] of Object.entries(STATES)) {
  if (!idx.files[code] || !idx.files[code].includes("-most")) { console.error(code, "bez mostovek"); continue; }
  const fd = fs.openSync(dir + idx.files[code], "r");
  const pack = new Pack(async (s, e) => { const b = Buffer.alloc(e - s + 1); fs.readSync(fd, b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, b.byteOffset, b.length) }; });
  const head = await pack.head();
  const sized = [];
  for (const b of head.blocks) { const offs = await pack.leaf(head, b); sized.push({ b, size: offs[offs.length - 1] - offs[0] }); }
  const pick = [], pool = sized.slice();
  while (pick.length < BLOCKS && pool.length) { const tot = pool.reduce((a, x) => a + x.size, 0); let d = rnd() * tot, i = 0; while (d > pool[i].size) d -= pool[i++].size; pick.push(pool.splice(i, 1)[0].b); }
  for (const b of pick) {
    const names = [];
    for (let i = 0; i < head.block; i++) for (let j = 0; j < head.block; j++) names.push(`${b[0] * head.block + i}_${b[1] * head.block + j}`);
    const els = mergePieces(await pack.tiles(names));
    const decks = els.filter((e) => e.type === "area" && e.tags.man_made === "bridge").map((e) => ({ ...e, bb: bbOf(e) }));
    const water = els.filter((e) => e.type === "area" && WATER(e.tags)).map((e) => ({ ...e, bb: bbOf(e) }));
    for (const e of els) {
      const t = e.tags;
      if (e.type !== "way" || !ROAD.test(t.highway || "") || !t.bridge || t.bridge === "no" || Number(t.layer) < 0 || t.tunnel) continue;
      const g = e.geometry, cos = Math.cos((g[0].lat * Math.PI) / 180), seg = [];
      let len = 0;
      for (let i = 1; i < g.length; i++) { const l = Math.hypot((g[i].lat - g[i - 1].lat) * 110574, (g[i].lon - g[i - 1].lon) * 111320 * cos); seg.push(l); len += l; }
      if (len < 15) continue;
      let k = 0, acc = 0;
      while (k < seg.length - 1 && acc + seg[k] < len / 2) acc += seg[k++];
      const f = seg[k] ? (len / 2 - acc) / seg[k] : 0, a = g[k], c = g[k + 1];
      const m = { lat: a.lat + (c.lat - a.lat) * f, lon: a.lon + (c.lon - a.lon) * f };
      if (!decks.some((q) => inArea(q, m))) continue;
      const dx = (c.lon - a.lon) * cos, dy = c.lat - a.lat;
      const bearing = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      cands.push({ country: iso, pack: code, wayId: e.id, name: t.name || "", highway: t.highway, layer: t.layer ?? null, len: +len.toFixed(1), lat: +m.lat.toFixed(7), lon: +m.lon.toFixed(7), bearing: +bearing.toFixed(1), waterUnder: water.some((q) => inArea(q, m)) });
    }
  }
  console.error(iso, cands.filter((r) => r.country === iso).length);
}
const out = [], per = {};
for (const r of shuffle([...new Map(cands.map((r) => [r.wayId, r])).values()])) {
  if (out.length >= TARGET) break;
  if ((per[r.country] || 0) >= PER) continue;
  const old = Math.min(...OLD.map((o) => dist(o, r)));
  if (old < 150 || out.some((o) => dist(o, r) < 150)) continue;
  if (!(await photo(r.lat, r.lon))) continue;
  per[r.country] = (per[r.country] || 0) + 1;
  out.push({ id: `e-${out.length + 1}`, kind: r.waterUnder ? "water" : "other", ...r, oldDist: Math.round(old) });
}
console.error(out.length, "z", cands.length, JSON.stringify(per));
fs.writeFileSync(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
