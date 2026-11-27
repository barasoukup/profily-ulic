// The photo sample of the foral cadastres' A/B: houses that a street photo shows (the random sample of sample.json has
// few: Mapillary is sparse in these cities). For each city, with a fixed seed: a random point within 1.5 km of the
// centre, the Mapillary photos in a box of about 130 m around it (CC BY-SA; token in MAPILLARY_TOKEN or
// evaluation/streetview/token.local, never in the code), one flat photo picked, the first building its view meets
// 6–35 m ahead (Basque cities: OSM's outlines from data/<city>.geojsonl; Pamplona: the Navarre cadastre's for about
// 50 m around the camera, one request), the point 4 m inside it. Then the house asked as the app asks (towns/spain.js
// podlaznost, ?foral=1) and its OSM facts (derive.js buildingAt). Up to 12 houses a city, one building once.
// Politely: a pause of 1.5 s after each request to a cadastre, 0.3 s after Mapillary.
//   node evaluation/spain/foral-ab/photo-sample.mjs → vysledky/foto.json, data/foto2/<id>.jpg
import fs from "node:fs";
import { buildingAt, localFrame } from "../../../app/public/derive.js";
import { setCity } from "../../../app/public/city.js";
import { buildingStyle } from "../../../app/public/profile.js";
import { sources } from "../../../app/public/towns/spain.js";
import { FORAL } from "../../../app/public/towns/spain-foral.js";

setCity("spain");
const HERE = new URL("./", import.meta.url), OUT = new URL("data/foto2/", HERE);
fs.mkdirSync(OUT, { recursive: true });
const TOKEN = process.env.MAPILLARY_TOKEN || fs.readFileSync(new URL("../../streetview/token.local", HERE), "utf8").trim();
const UA = { "User-Agent": "profily-ulic" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let seed = 20261129;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const CITIES = { bilbao: [43.2630, -2.9350], donostia: [43.3183, -1.9812], vitoria: [42.8467, -2.6716], pamplona: [42.8125, -1.6458] };
const PER = 12, TRIES = 40;

const ring = (cs) => cs.map(([lon, lat]) => ({ lon, lat }));
function osmOf(city) {
  const file = new URL(`data/${city}.geojsonl`, HERE);
  if (!fs.existsSync(file)) return null;
  const out = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const f = JSON.parse(line.replace(/^\x1e/, "")), g = f.geometry, t = f.properties || {};
    if (t.building && (g.type === "Polygon" || g.type === "MultiPolygon")) for (const p of g.type === "Polygon" ? [g.coordinates] : g.coordinates) out.push({ type: "area", tags: t, geometry: ring(p[0]), holes: p.slice(1).map(ring) });
  }
  return { elements: out };
}
function hit(rings, p, d) {
  let best = Infinity;
  for (const r of rings) for (let i = 1; i < r.length; i++) {
    const [ax, ay] = r[i - 1], [bx, by] = r[i], ex = bx - ax, ey = by - ay, den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((ax - p[0]) * ey - (ay - p[1]) * ex) / den, u = ((ax - p[0]) * d[1] - (ay - p[1]) * d[0]) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}
const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// app.js: the house's info from OSM and what the cadastre adds.
function merged(osm, p) {
  const info = { ...(osm || {}) };
  if (!p || p.error) return info;
  if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof });
  if (p.built) info.built = p.built;
  if (p.house) info.house = 1;
  if (p.office) info.office = 1;
  if (p.type && (!info.type || info.type === "yes")) info.type = p.type;
  return info;
}

const rows = [];
for (const [city, [lat0, lon0]] of Object.entries(CITIES)) {
  const frame = localFrame(lat0, lon0), osm = osmOf(city), used = new Set();
  const blds = osm?.elements.map((e) => ({ e, key: e.geometry.slice(0, 3).map((g) => `${g.lon},${g.lat}`).join(";"), rings: [e.geometry, ...e.holes].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) }));
  let n = 0;
  for (let k = 0; k < TRIES && n < PER; k++) {
    const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const [lon, lat] = frame.toLonLat(r * Math.sin(a), r * Math.cos(a)), d = 0.0006;
    const q = new URLSearchParams({ access_token: TOKEN, bbox: [lon - d * 1.4, lat - d, lon + d * 1.4, lat + d].map((v) => v.toFixed(6)).join(","), limit: 300, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url,computed_geometry,geometry" });
    const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`, { headers: UA })).json()).data || []).filter((i) => !i.is_pano && i.thumb_1024_url);
    await pause(300);
    if (!imgs.length) continue;
    // The newest third, one of them at random.
    imgs.sort((x, y) => y.captured_at - x.captured_at);
    const im = imgs[Math.floor(rnd() * Math.max(1, Math.ceil(imgs.length / 3)))];
    const [clon, clat] = (im.computed_geometry || im.geometry).coordinates, c = frame.toXY(clon, clat);
    const az = ((im.computed_compass_angle ?? im.compass_angle) * Math.PI) / 180, dir = [Math.sin(az), Math.cos(az)];
    let cand = blds;
    if (!osm) {
      // Pamplona: the cadastre's outlines around the camera.
      const e = 0.00045, url = `${FORAL.nc.url}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: FORAL.nc.type, count: "60", srsName: FORAL.nc.srs,
        bbox: `${clat - e},${clon - e * 1.4},${clat + e},${clon + e * 1.4},${FORAL.nc.bboxCrs}` })}`;
      const gml = await (await fetch(url)).text();
      await pause(1500);
      cand = gml.split(/<wfs:member\b[^>]*>/).slice(1).map((m) => {
        const rings = [...m.matchAll(/<gml:posList[^>]*>([^<]*)</g)].map((x) => { const v = x[1].trim().split(/\s+/).map(Number), o = []; for (let i = 0; i + 1 < v.length; i += 2) o.push(frame.toXY(v[i + 1], v[i])); return o; });
        return { key: m.match(/gml:id="([^"]*)"/)?.[1], rings };
      }).filter((b) => b.rings.length);
    }
    if (cand.some((b) => inside(b.rings, ...c))) continue; // a photo from inside a courtyard or a passage
    let best = null;
    for (const b of cand) { const t = hit(b.rings, c, dir); if (t >= 6 && t <= 35 && (!best || t < best.t)) best = { t, b }; }
    if (!best || used.has(best.b.key)) continue;
    used.add(best.b.key);
    const probe = [c[0] + dir[0] * (best.t + 4), c[1] + dir[1] * (best.t + 4)], [plon, plat] = frame.toLonLat(...probe);
    globalThis.PROFILY_ES = { foral: "1" };
    let p;
    try { p = await sources.podlaznost(+plat.toFixed(7), +plon.toFixed(7)); } catch (err) { p = { error: err.message }; } finally { delete globalThis.PROFILY_ES; }
    await pause(1500);
    const o = osm ? buildingAt(osm, frame, probe) : null;
    const of = o && { levels: o.levels, height: o.height, type: o.type && o.type !== "yes" ? o.type : undefined, roofShape: o.roofShape, start: o.start, block: o.block };
    const A = merged(of, null), B = merged(of, p);
    n++;
    const id = `${city.slice(0, 2)}f${n}`;
    fs.writeFileSync(new URL(`${id}.jpg`, OUT), Buffer.from(await (await fetch(im.thumb_1024_url, { headers: UA })).arrayBuffer()));
    await pause(300);
    rows.push({ id, town: city, photo: { id: im.id, year: new Date(im.captured_at).getFullYear(), d: +best.t.toFixed(1) }, lat: +plat.toFixed(7), lon: +plon.toFixed(7), osm: !!osm,
      osmLevels: of?.levels ?? null, answer: p, a: { levels: A.levels ?? null, year: A.built ?? A.start ?? null, look: buildingStyle(A) }, b: { levels: B.levels ?? null, year: B.built ?? B.start ?? null, look: buildingStyle(B) } });
    console.log(id, `${best.t.toFixed(0)} m`, `OSM ${of?.levels ?? "–"}`, `katastr ${p.total ?? "–"}`, A.levels ?? "–", buildingStyle(A), "→", buildingStyle(B));
  }
}
fs.writeFileSync(new URL("vysledky/foto.json", HERE), JSON.stringify(rows, null, 1));
