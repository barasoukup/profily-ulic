// Street-level photos of the pilot's cuts from Mapillary (CC BY-SA; API v4, a client token of Bára's account in
// MAPILLARY_TOKEN or evaluation/streetview/token.local, which git ignores; never in the code). For each cut: the
// photos within 30 m, the best looking along the street each way (compass within 35° of the cut's bearing or its
// opposite; flat photos before panoramas, then the newest, then the nearest), saved as data/<id>-f.jpg and -b.jpg with
// their metadata in data/<id>.json. Politely: one search a cut, one image at a time.
//   node evaluation/streetview/fetch-images.mjs [pilot.json]
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data");
const TOKEN = process.env.MAPILLARY_TOKEN || (await fs.readFile(path.join(ROOT, "token.local"), "utf8").catch(() => "")).trim();
if (!TOKEN) { console.error("chybí token Mapillary (MAPILLARY_TOKEN nebo evaluation/streetview/token.local)"); process.exit(1); }
const rows = JSON.parse(await fs.readFile(path.join(ROOT, process.argv[2] || "pilot.json"), "utf8"));
const UA = { "User-Agent": "profily-ulic" };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const dist = (lat, lon, [x, y]) => Math.hypot((x - lon) * 111320 * Math.cos((lat * Math.PI) / 180), (y - lat) * 110574);
await fs.mkdir(DATA, { recursive: true });
let n = 0;
for (const r of rows) {
  const meta = path.join(DATA, `${r.id}.json`);
  if (await fs.stat(meta).catch(() => null)) continue;
  const q = new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100,
    fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_2048_url,computed_geometry,geometry" });
  const json = await (await fetch(`https://graph.mapillary.com/images?${q}`, { headers: UA })).json();
  const imgs = (json.data || []).map((d) => ({ id: d.id, at: d.captured_at, pano: !!d.is_pano, url: d.thumb_2048_url,
    compass: d.computed_compass_angle ?? d.compass_angle, d: dist(r.lat, r.lon, (d.computed_geometry || d.geometry).coordinates) }));
  const pick = (dirDeg) => imgs.filter((i) => i.pano || angle(i.compass, dirDeg) <= 35)
    .sort((a, b) => a.pano - b.pano || b.at - a.at || a.d - b.d)[0] || null;
  const chosen = { f: pick(r.bearing), b: pick(r.bearing + 180) };
  for (const [k, im] of Object.entries(chosen)) {
    if (!im) continue;
    const buf = Buffer.from(await (await fetch(im.url, { headers: UA })).arrayBuffer());
    await fs.writeFile(path.join(DATA, `${r.id}-${k}.jpg`), buf);
    await new Promise((res) => setTimeout(res, 200));
  }
  await fs.writeFile(meta, JSON.stringify({ found: imgs.length, f: chosen.f && { ...chosen.f, url: undefined }, b: chosen.b && { ...chosen.b, url: undefined } }, null, 1));
  console.log(r.id, r.name, `${imgs.length} snímků`, chosen.f ? `f ${chosen.f.pano ? "pano" : "foto"} ${new Date(chosen.f.at).getFullYear()}` : "f –", chosen.b ? `b ${chosen.b.pano ? "pano" : "foto"} ${new Date(chosen.b.at).getFullYear()}` : "b –");
  n++;
}
console.log("hotovo", n);
