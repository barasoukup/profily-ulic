// Cuts across which another named street runs at an angle (derive.js otherStreet, ?off=otherstreet): clicks of random streets in
// Europe's cities, Washington and Toronto, up to 8 a city.   node evaluation/canada/review/fork-sample.mjs
import fs from "node:fs/promises";
import { tiles } from "../../kliky/osm.mjs";
import { TILE, mergePieces } from "../../../app/public/osmtile.js";
import { localFrame, nearestStreet, placeCut as place } from "../../../app/public/derive.js";
const C = { praha: [50.087, 14.421], brno: [49.195, 16.608], plzen: [49.747, 13.378], bratislava: [48.146, 17.107], wien: [48.208, 16.373], graz: [47.07, 15.439], berlin: [52.52, 13.405], koeln: [50.938, 6.96], zuerich: [47.372, 8.541], warszawa: [52.2297, 21.0122],
  krakow: [50.061, 19.937], paris: [48.8566, 2.3522], lyon: [45.758, 4.835], amsterdam: [52.3728, 4.8936], antwerpen: [51.219, 4.402], helsinki: [60.1699, 24.9384], kobenhavn: [55.676, 12.568], madrid: [40.4168, -3.7038], torino: [45.07, 7.687], ljubljana: [46.051, 14.506], washington: [38.905, -77.03], toronto: [43.66, -79.4] };
// (Without Washington's alleys: no request.)
async function osmAt(lat, lon, radius) {
  const dLat = radius / 110574, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180)), names = [];
  for (let ix = Math.floor((lon - dLon) / TILE); ix <= Math.floor((lon + dLon) / TILE); ix++) for (let iy = Math.floor((lat - dLat) / TILE); iy <= Math.floor((lat + dLat) / TILE); iy++) names.push(`${ix}_${iy}`);
  return { elements: mergePieces(await tiles(names)) };
}
const CARS = /^(primary|secondary|tertiary|unclassified|residential)$/;
let seed = 20261208; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [];
for (const [city, [la, lo]] of Object.entries(C)) {
  let n = 0;
  for (let t = 0; t < 900 && n < 8; t++) {
    const a = rnd() * 2 * Math.PI, r = 4000 * Math.sqrt(rnd()), lat = la + (r * Math.sin(a)) / 110574, lon = lo + (r * Math.cos(a)) / (111320 * Math.cos((la * Math.PI) / 180));
    const osm = await osmAt(lat, lon, 80).catch(() => null);
    if (!osm) continue;
    const f = localFrame(lat, lon), near = nearestStreet(osm, f, [0, 0]);
    if (!near || !CARS.test(near.way.tags.highway) || !near.way.tags.name) continue;
    const c = place(osm, f, near), [clon, clat] = f.toLonLat(...c.point), g = localFrame(clat, clon);
    let d = c.dir; if (d[1] < 0) d = [-d[0], -d[1]];
    const hit = osm.elements.some((e) => e.type === "way" && e.id !== near.way.id && CARS.test(e.tags?.highway || "") && e.tags.name && e.tags.name !== near.way.tags.name && e.geometry && e.geometry.some((p, i) => {
      if (!i) return false;
      const [x0, y0] = g.toXY(e.geometry[i - 1].lon, e.geometry[i - 1].lat), [x1, y1] = g.toXY(p.lon, p.lat), L = Math.hypot(x1 - x0, y1 - y0);
      const s0 = x0 * d[0] + y0 * d[1], s1 = x1 * d[0] + y1 * d[1], cos = L ? Math.abs((x1 - x0) * d[0] + (y1 - y0) * d[1]) / L : 1;
      if (s0 > 0 === s1 > 0 || cos > 0.94 || cos < 0.3) return false;
      const u = s0 / (s0 - s1), x = x0 + u * (x1 - x0), y = y0 + u * (y1 - y0);
      return Math.abs(-x * d[1] + y * d[0]) < 25;
    }));
    if (!hit || out.some((o) => Math.hypot((o.lat - clat) * 110574, (o.lon - clon) * 75000) < 150)) continue;
    out.push({ id: `fork-${city}-${++n}`, group: "fork", city, name: near.way.tags.name, wayId: near.way.id, lat: +clat.toFixed(7), lon: +clon.toFixed(7), bearing: +((Math.atan2(d[0], d[1]) * 180) / Math.PI).toFixed(1), variants: ["def", "os0"] });
  }
}
await fs.writeFile(new URL("fork-sample.json", import.meta.url), "[\n" + out.map((o) => JSON.stringify(o)).join(",\n") + "\n]\n");
const c = {}; for (const o of out) c[o.city] = (c[o.city] || 0) + 1; console.log(out.length, c);
