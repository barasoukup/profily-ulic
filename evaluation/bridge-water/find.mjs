// Bridges and embankments over water from the local OSM packs. node find.mjs
import fs from "node:fs";
const W = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const { Pack } = await import(W + "/pilot/public/osmpack.js");
const { mergePieces, TILE } = await import(W + "/pilot/public/osmtile.js");
const { WATER } = await import(W + "/pilot/public/ortho-osm.js");
const dir = W + "/pilot/data/osm-pack/";
const idx = JSON.parse(fs.readFileSync(dir + "index.json"));
const fd = {};
const pack = (c) => new Pack(async (s, e) => { fd[c] ??= fs.openSync(dir + idx.files[c], "r"); const b = Buffer.alloc(e - s + 1); fs.readSync(fd[c], b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, b.byteOffset, b.length) }; });
const CITIES = [["pl", "warszawa", 52.2297, 21.0122], ["pl", "wroclaw", 51.1079, 17.0385], ["pl", "gdansk", 54.352, 18.6466], ["pl", "poznan", 52.4064, 16.9252], ["pl", "krakow", 50.0614, 19.9383],
  ["pt", "porto", 41.1496, -8.611], ["pt", "coimbra", 40.2033, -8.4103], ["pt", "lisboa", 38.7223, -9.1393], ["it", "firenze", 43.7696, 11.2558], ["it", "roma", 41.9028, 12.4964], ["it", "torino", 45.0703, 7.6869],
  ["fi", "turku", 60.4518, 22.2666], ["fi", "tampere", 61.4978, 23.761], ["dk", "odense", 55.4038, 10.4024]];
const ROAD = /^(primary|secondary|tertiary|residential|unclassified|living_street|trunk)$/;
const inPoly = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if (a.lat > y !== b.lat > y && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) c = !c; } return c; };
const out = [];
for (const [c, city, lat, lon] of CITIES) {
  const R = 4, x0 = Math.floor(lon / TILE), y0 = Math.floor(lat / TILE), names = [];
  for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) names.push(`${x0 + dx}_${y0 + dy}`);
  let els;
  try { els = mergePieces(await pack(c).tiles(names)); } catch (e) { console.error(city, e.message); continue; }
  const waters = els.filter((e) => e.type === "area" && WATER(e.tags) && !["allotments", "cemetery"].includes(e.tags.landuse));
  const wet = (p) => waters.some((w) => inPoly(w.geometry, p.lon, p.lat) && !(w.holes || []).some((h) => inPoly(h, p.lon, p.lat)));
  const bridges = [], banks = [];
  for (const e of els) {
    if (e.type !== "way" || !ROAD.test(e.tags.highway || "") || !e.tags.name) continue;
    const g = e.geometry;
    for (let i = 0; i + 1 < g.length; i++) {
      const m = { lat: (g[i].lat + g[i + 1].lat) / 2, lon: (g[i].lon + g[i + 1].lon) / 2 };
      const cos = Math.cos((lat * Math.PI) / 180);
      const len = Math.hypot((g[i + 1].lat - g[i].lat) * 111000, (g[i + 1].lon - g[i].lon) * 111000 * cos);
      if (len < 15) continue;
      const br = e.tags.bridge && e.tags.bridge !== "no" && !(Number(e.tags.layer) < 0);
      if (br && wet(m)) { bridges.push({ city, id: e.id, name: e.tags.name, hw: e.tags.highway, layer: e.tags.layer, lat: +m.lat.toFixed(6), lon: +m.lon.toFixed(6) }); break; }
      if (!br && !e.tags.tunnel && !e.tags.bridge) {
        const dxm = (g[i + 1].lon - g[i].lon) * cos, dym = g[i + 1].lat - g[i].lat, n = Math.hypot(dxm, dym);
        const nx = -dym / n / cos, ny = dxm / n;
        const side = (d) => ({ lon: m.lon + (nx * d) / 111000, lat: m.lat + (ny * d) / 111000 });
        if (!wet(m) && (wet(side(25)) || wet(side(-25)))) { banks.push({ city, id: e.id, name: e.tags.name, hw: e.tags.highway, lat: +m.lat.toFixed(6), lon: +m.lon.toFixed(6) }); break; }
      }
    }
  }
  const uniq = (a) => [...new Map(a.map((b) => [b.name, b])).values()];
  out.push(...uniq(bridges).slice(0, 3).map((b) => ({ ...b, kind: "most" })), ...uniq(banks).slice(0, 1).map((b) => ({ ...b, kind: "nabrezi" })));
  console.error(city, uniq(bridges).length, uniq(banks).length);
}
console.log(JSON.stringify(out, null, 1));
