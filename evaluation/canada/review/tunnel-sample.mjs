// Streets over a tram in a tunnel (?off=tunneltracks), Europe's cities with one and Toronto.   node tunnel-sample.mjs
import fs from "node:fs/promises";
import { tiles } from "../../kliky/osm.mjs";
import { TILE, mergePieces } from "../../../app/public/osmtile.js";
import { localFrame, nearestStreet, placeCut as place } from "../../../app/public/derive.js";
const C = { wien: [48.195, 16.355], bruxelles: [50.846, 4.352], antwerpen: [51.217, 4.41], koeln: [50.937, 6.95], essen: [51.456, 7.012], stuttgart: [48.777, 9.18], brno: [49.19, 16.6], krakow: [50.063, 19.95], rotterdam: [51.92, 4.48], denhaag: [52.077, 4.31], graz: [47.07, 15.43], toronto: [43.665, -79.4] };
const out = []; let seed = 20261214; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (const [city, [la, lo]] of Object.entries(C)) {
  const n = []; for (let x = Math.floor((lo - 0.06) / TILE); x <= (lo + 0.06) / TILE; x++) for (let y = Math.floor((la - 0.04) / TILE); y <= (la + 0.04) / TILE; y++) n.push(`${x}_${y}`);
  const els = mergePieces((await tiles(n)).map((l) => l.filter((e) => e.tags?.highway || e.tags?.railway))), w = els.filter((e) => e.type === "way" && e.tags.railway === "tram" && e.tags.tunnel && !/^(no|building_passage)$/.test(e.tags.tunnel));
  let m = 0;
  for (let t = 0; w.length && t < 60 && m < 5; t++) {
    const g = w[Math.floor(rnd() * w.length)].geometry, p = g[Math.floor(rnd() * g.length)], osm = { elements: els.filter((e) => e.geometry?.some((q) => Math.abs(q.lat - p.lat) < 0.0012 && Math.abs(q.lon - p.lon) < 0.0018)) }, f = localFrame(p.lat, p.lon), near = nearestStreet(osm, f, [0, 0]);
    if (!near || near.way.tags.tunnel) continue;
    const c = place(osm, f, near), [lon, lat] = f.toLonLat(...c.point); let d = c.dir; if (d[1] < 0) d = [-d[0], -d[1]];
    if (out.some((o) => Math.hypot((o.lat - lat) * 110574, (o.lon - lon) * 75000) < 100)) continue;
    out.push({ id: `tun-${city}-${++m}`, lat: +lat.toFixed(7), lon: +lon.toFixed(7), bearing: +((Math.atan2(d[0], d[1]) * 180) / Math.PI).toFixed(1), wayId: near.way.id, variants: ["def", "tt0"] });
  }
}
await fs.writeFile(new URL("tunnel-sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
console.log(out.length, out.map((o) => o.id).join(" "));
