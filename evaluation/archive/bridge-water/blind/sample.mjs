// The blind re-measurement of "a street on a bridge does not take OSM's water and green under it" (ortho-osm.js,
// ?off=mostvoda; 26. 11. 2026): a new random sample of road bridges from the local OSM packs of the states where the
// app estimates from the orthophoto and OSM (not Czechia, whose technical map covers everything), in three strata:
//   water  the bridge's middle over OSM water (WATER of ortho-osm.js without allotments and cemeteries);
//   green  not over water, OSM green (GREEN, allotments, cemeteries) under the middle or within 25 m of it along the cut;
//   short  a bridge way under 25 m long with water or green within 25 m (a culvert, a footbridge-sized brook crossing).
// Blocks of the packs drawn weighted by their bytes (the denser, the more urban), the bridges in them at random (seed
// 20261126), at most 4 a state and stratum, none within 150 m of the old sample (../points.json) or of the Kraków case
// below, each with a Mapillary photo within 30 m. Writes sample.json.   node evaluation/archive/bridge-water/blind/sample.mjs
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname), W = path.join(HERE, "../../../..");
const { Pack } = await import(W + "/app/public/osmpack.js");
const { mergePieces } = await import(W + "/app/public/osmtile.js");
const { WATER, GREEN } = await import(W + "/app/public/ortho-osm.js");
const dir = W + "/app/data/osm-pack/", idx = JSON.parse(fs.readFileSync(dir + "index.json"));
// The states whose judge has an orthophoto (../../../universal/ortho.mjs) and whose app estimates somewhere.
const STATES = { pl: "PL", sk: "SK", at: "AT", de: "DE", fr: "FR", es: "ES", pt: "PT", it: "IT", si: "SI", ee: "EE", fi: "FI", lt: "LT", be: "BE", lu: "LU", nl: "NL", ch: "CH" };
const PER = 4, BLOCKS = Number(process.env.BLOCKS || 5), TARGET = { water: 36, green: 30, short: 26 };
let seed = 20261126;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const OLD = [...JSON.parse(fs.readFileSync(path.join(HERE, "../points.json"), "utf8")), { lat: 50.05278, lon: 19.91553 }];
const ROAD = /^(trunk|primary|secondary|tertiary|residential|unclassified|living_street)$/;
const TOKEN = fs.readFileSync(path.join(W, "evaluation/streetview/token.local"), "utf8").trim();
const dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if (a.lat > y !== b.lat > y && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) c = !c; } return c; };
const inArea = (e, p) => p.lon >= e.bb[0] && p.lon <= e.bb[2] && p.lat >= e.bb[1] && p.lat <= e.bb[3] && inRing(e.geometry, p.lon, p.lat) && !(e.holes || []).some((h) => inRing(h, p.lon, p.lat));
async function photo(lat, lon) {
  await new Promise((r) => setTimeout(r, 300));
  const r = await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat, lng: lon, radius: 30, limit: 3, fields: "id" })}`);
  return r.ok ? ((await r.json()).data || []).length : 0;
}
const cands = { water: [], green: [], short: [] };
for (const [code, iso] of Object.entries(STATES)) {
  if (!idx.files[code]) continue;
  const fd = fs.openSync(dir + idx.files[code], "r");
  const pack = new Pack(async (s, e) => { const b = Buffer.alloc(e - s + 1); fs.readSync(fd, b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, b.byteOffset, b.length) }; });
  const head = await pack.head();
  const sized = [];
  for (const b of head.blocks) { const offs = await pack.leaf(head, b); sized.push({ b, size: offs[offs.length - 1] - offs[0] }); }
  // Blocks weighted by their bytes, without replacement.
  const pick = [], pool = sized.slice();
  while (pick.length < BLOCKS && pool.length) { const tot = pool.reduce((a, x) => a + x.size, 0); let d = rnd() * tot, i = 0; while (d > pool[i].size) d -= pool[i++].size; pick.push(pool.splice(i, 1)[0].b); }
  for (const b of pick) {
    const names = [];
    for (let i = 0; i < head.block; i++) for (let j = 0; j < head.block; j++) names.push(`${b[0] * head.block + i}_${b[1] * head.block + j}`);
    const els = mergePieces(await pack.tiles(names));
    const areas = els.filter((e) => e.type === "area" && (WATER(e.tags) || GREEN(e.tags))).map((e) => {
      const la = e.geometry.map((g) => g.lat), lo = e.geometry.map((g) => g.lon);
      return { ...e, bb: [Math.min(...lo), Math.min(...la), Math.max(...lo), Math.max(...la)], water: WATER(e.tags) && !["allotments", "cemetery"].includes(e.tags.landuse) };
    });
    for (const e of els) {
      const t = e.tags;
      if (e.type !== "way" || !ROAD.test(t.highway || "") || !t.bridge || t.bridge === "no" || Number(t.layer) < 0 || t.tunnel) continue;
      const g = e.geometry, cos = Math.cos((g[0].lat * Math.PI) / 180), seg = [];
      let len = 0;
      for (let i = 1; i < g.length; i++) { const l = Math.hypot((g[i].lat - g[i - 1].lat) * 110574, (g[i].lon - g[i - 1].lon) * 111320 * cos); seg.push(l); len += l; }
      if (len < 4) continue;
      let k = 0, acc = 0;
      while (k < seg.length - 1 && acc + seg[k] < len / 2) acc += seg[k++];
      const f = seg[k] ? (len / 2 - acc) / seg[k] : 0, a = g[k], c = g[k + 1];
      const m = { lat: a.lat + (c.lat - a.lat) * f, lon: a.lon + (c.lon - a.lon) * f };
      const dx = (c.lon - a.lon) * cos, dy = c.lat - a.lat, n = Math.hypot(dx, dy) || 1;
      const side = (d) => ({ lat: m.lat + ((dx / n) * d) / 110574, lon: m.lon + ((-dy / n) * d) / (111320 * cos) });
      const near = areas.filter((q) => q.bb[0] < m.lon + 0.0005 && q.bb[2] > m.lon - 0.0005 && q.bb[1] < m.lat + 0.0004 && q.bb[3] > m.lat - 0.0004);
      const waterUnder = near.some((q) => q.water && inArea(q, m));
      const greenNear = [0, 5, -5, 10, -10, 15, -15, 20, -20, 25, -25].some((d) => near.some((q) => !q.water && inArea(q, side(d))));
      const waterNear = [5, -5, 10, -10, 15, -15, 20, -20, 25, -25].some((d) => near.some((q) => q.water && inArea(q, side(d))));
      const bearing = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      const row = { country: iso, pack: code, wayId: e.id, name: t.name || "", highway: t.highway, layer: t.layer ?? null, len: +len.toFixed(1), lat: +m.lat.toFixed(7), lon: +m.lon.toFixed(7), bearing: +bearing.toFixed(1), waterUnder, waterNear, greenNear };
      if (len < 25 && (waterUnder || waterNear || greenNear)) cands.short.push(row);
      else if (len >= 25 && waterUnder) cands.water.push(row);
      else if (len >= 25 && greenNear && !waterNear) cands.green.push(row);
    }
  }
  console.error(iso, Object.entries(cands).map(([k, v]) => `${k} ${v.filter((r) => r.country === iso).length}`).join(", "));
}
const out = [];
for (const [kind, list] of Object.entries(cands)) {
  const per = {};
  // One bridge a way (the middle), the strata's lists shuffled.
  for (const r of shuffle([...new Map(list.map((r) => [r.wayId, r])).values()])) {
    if (out.filter((o) => o.kind === kind).length >= TARGET[kind]) break;
    if ((per[r.country] || 0) >= PER) continue;
    const old = Math.min(...OLD.map((o) => dist(o, r)));
    if (old < 150 || out.some((o) => dist(o, r) < 150)) continue;
    if (!(await photo(r.lat, r.lon))) continue;
    per[r.country] = (per[r.country] || 0) + 1;
    out.push({ id: `${kind[0]}-${out.filter((o) => o.kind === kind).length + 1}`, kind, ...r, oldDist: Math.round(old) });
  }
  console.error(kind, out.filter((o) => o.kind === kind).length, "z", list.length, JSON.stringify(per));
}
fs.writeFileSync(path.join(HERE, "sample.json"), JSON.stringify(out, null, 1));
