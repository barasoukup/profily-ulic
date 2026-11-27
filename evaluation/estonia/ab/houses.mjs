// A/B of ETAK's floors (hostile review 24. 11. 2026, bod 3 and 8): houses of Kalamaja (the Tallinn house) and Nõmme
// (villas). A = before (floors = height / 3, over OSM's building:levels), B = now (towns/estonia.js etakBuilding:
// (height − 3) / 3, OSM's building:levels win). Truth: the floors on a Mapillary photo looking at the house
// (photos.mjs), judged blind (judge.html shows the photo and the address only; the judge's floors in posudky-domy.json).
//   node evaluation/estonia/ab/houses.mjs sample   (data/domy/{kalamaja,nomme}.json: ETAK WFS e_401_hoone_ka of the boxes)
//   node evaluation/estonia/ab/houses.mjs photos   (Mapillary; token in evaluation/streetview/token.local)
//   node evaluation/estonia/ab/houses.mjs score
import fs from "node:fs/promises";
import { Pack } from "../../../app/public/osmpack.js";
import { etakBuilding } from "../../../app/public/towns/estonia.js";

const HERE = new URL("./", import.meta.url), DATA = new URL("data/domy/", HERE), OUT = new URL("results/domy.json", HERE);
const SEED = 20261124;
let s = SEED;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const centroid = (g) => { const r = g.type === "MultiPolygon" ? g.coordinates[0][0] : g.coordinates[0]; return [r.reduce((a, p) => a + p[0], 0) / r.length, r.reduce((a, p) => a + p[1], 0) / r.length]; };
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

async function osmLevels(box) { // the local OSM pack of Estonia (app/data/osm-pack/ee-novy.posm)
  const fh = await fs.open(new URL("../../../app/data/osm-pack/ee-novy.posm", HERE));
  const p = new Pack(async (a, b) => { const buf = Buffer.alloc(b - a + 1); await fh.read(buf, 0, buf.length, a); return { bytes: new Uint8Array(buf) }; });
  const T = 0.005, names = [];
  for (let ix = Math.floor(box[0] / T); ix <= Math.floor(box[2] / T); ix++) for (let iy = Math.floor(box[1] / T); iy <= Math.floor(box[3] / T); iy++) names.push(`${ix}_${iy}`);
  const els = (await p.tiles(names)).flat().filter((e) => e.tags?.building && e.geometry?.[0]?.lat);
  await fh.close();
  return els.map((e) => ({ levels: Number(e.tags["building:levels"]) || null, ring: e.geometry.map((q) => [q.lon, q.lat]) }));
}

const cmd = process.argv[2];
if (cmd === "sample") {
  const rows = [];
  for (const [area, box] of [["kalamaja", [24.722, 59.4445, 24.736, 59.45]], ["nomme", [24.63, 59.385, 24.66, 59.395]]]) {
    const etak = JSON.parse(await fs.readFile(new URL(`${area}.json`, DATA), "utf8")).features.filter((f) => /^Elu/.test(f.properties.tyyp_tekst) && f.properties.korgus_m > 2 && f.properties.ads_lahiaadress);
    const osm = await osmLevels(box);
    const pick = etak.map((f) => [rnd(), f]).sort((a, b) => a[0] - b[0]).slice(0, area === "kalamaja" ? 60 : 30).map(([, f]) => f);
    for (const f of pick) {
      const [lon, lat] = centroid(f.geometry), p = f.properties;
      const o = osm.find((b) => inRing(b.ring, lon, lat));
      const A = Math.max(1, Math.round(p.korgus_m / 3));
      const e = etakBuilding(p), B = e.fromHeight && o?.levels ? o.levels : e.cornice;
      rows.push({ id: `${area}-${p.etak_id}`, area, address: p.ads_lahiaadress, lat: +lat.toFixed(6), lon: +lon.toFixed(6), h: p.korgus_m, osm: o?.levels ?? null, A, B });
    }
  }
  await fs.mkdir(new URL("results/", HERE), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(rows, null, 1));
  console.log(rows.length);
} else if (cmd === "photos") {
  const TOKEN = process.env.MAPILLARY_TOKEN || (await fs.readFile(new URL("../../streetview/token.local", HERE), "utf8").catch(() => "")).trim();
  if (!TOKEN) { console.error("chybí token Mapillary"); process.exit(1); }
  const rows = JSON.parse(await fs.readFile(OUT, "utf8")), FOTO = new URL("foto/", DATA);
  await fs.mkdir(FOTO, { recursive: true });
  const UA = { "User-Agent": "profily-ulic" }, angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  for (const r of rows) {
    const meta = new URL(`${r.id}.json`, FOTO);
    if (await fs.stat(meta).catch(() => null)) continue;
    const d = 0.0005, q = new URLSearchParams({ access_token: TOKEN, bbox: [r.lon - d * 2, r.lat - d, r.lon + d * 2, r.lat + d].map((v) => v.toFixed(6)).join(","), limit: 500, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url,computed_geometry,geometry" });
    const json = await (await fetch(`https://graph.mapillary.com/images?${q}`, { headers: UA })).json();
    const mx = 111320 * Math.cos((r.lat * Math.PI) / 180), my = 110574;
    const imgs = (json.data || []).map((x) => {
      const [lon, lat] = (x.computed_geometry || x.geometry).coordinates, dx = (r.lon - lon) * mx, dy = (r.lat - lat) * my;
      return { id: x.id, at: x.captured_at, pano: !!x.is_pano, url: x.thumb_1024_url, compass: x.computed_compass_angle ?? x.compass_angle, d: Math.hypot(dx, dy), to: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };
    }).filter((i) => i.d >= 8 && i.d <= 35 && !i.pano && angle(i.compass, i.to) <= 25).sort((a, b) => angle(a.compass, a.to) - angle(b.compass, b.to));
    const im = imgs[0];
    if (im) await fs.writeFile(new URL(`${r.id}.jpg`, FOTO), Buffer.from(await (await fetch(im.url, { headers: UA })).arrayBuffer()));
    await fs.writeFile(meta, JSON.stringify({ found: json.data?.length ?? 0, photo: im ? { id: im.id, year: new Date(im.at).getFullYear(), d: +im.d.toFixed(1), off: +angle(im.compass, im.to).toFixed(0) } : null }));
    console.log(r.id, json.data?.length ?? 0, im ? `${new Date(im.at).getFullYear()} ${im.d.toFixed(0)} m` : "–");
    await new Promise((res) => setTimeout(res, 400));
  }
} else if (cmd === "score") {
  const rows = JSON.parse(await fs.readFile(OUT, "utf8"));
  const judged = JSON.parse(await fs.readFile(new URL("results/posudky-domy.json", HERE), "utf8"));
  const res = {};
  for (const r of rows) {
    const j = judged[r.id];
    if (!(j?.floors > 0)) continue;
    const k = (res[r.area] ??= { n: 0, A: 0, B: 0, Aoff: 0, Boff: 0, Bwin: 0, Awin: 0 });
    k.n++; k.A += r.A === j.floors; k.B += r.B === j.floors; k.Aoff += Math.abs(r.A - j.floors); k.Boff += Math.abs(r.B - j.floors);
    k.Bwin += Math.abs(r.B - j.floors) < Math.abs(r.A - j.floors); k.Awin += Math.abs(r.A - j.floors) < Math.abs(r.B - j.floors);
  }
  for (const [a, k] of Object.entries(res)) console.log(`${a}: ${k.n} domů s fotkou, přesně A ${k.A}, B ${k.B}; průměrná odchylka A ${(k.Aoff / k.n).toFixed(2)}, B ${(k.Boff / k.n).toFixed(2)}; blíž B ${k.Bwin}, blíž A ${k.Awin}`);
}
