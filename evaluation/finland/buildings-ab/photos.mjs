// Street photos of the A/B's houses (Finland) from Mapillary (CC BY-SA; a client token of Bára's account in MAPILLARY_TOKEN or
// evaluation/streetview/token.local, never in the code): of the photos in a box of about 110 m around the house (the
// radius search finds few), the one within 40 m that looks at the house (the house's
// point within 30° of the camera's compass, 6–40 m away; flat photos before panoramas, then the newest), saved as
// data/foto/<id>.jpg with data/foto/<id>.json. Politely: one search a house, one image at a time.
//   node evaluation/finland/buildings-ab/photos.mjs
import fs from "node:fs/promises";

const HERE = new URL("./", import.meta.url), OUT = new URL("data/foto/", HERE);
const TOKEN = process.env.MAPILLARY_TOKEN || (await fs.readFile(new URL("../../streetview/token.local", HERE), "utf8").catch(() => "")).trim();
if (!TOKEN) { console.error("chybí token Mapillary"); process.exit(1); }
const rows = JSON.parse(await fs.readFile(new URL("results/rezy.json", HERE), "utf8"));
await fs.mkdir(OUT, { recursive: true });
const UA = { "User-Agent": "profily-ulic" };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
for (const r of rows) {
  const meta = new URL(`${r.id}.json`, OUT);
  if (await fs.stat(meta).catch(() => null)) continue;
  const d = 0.0005, q = new URLSearchParams({ access_token: TOKEN, bbox: [r.lon - d * 1.4, r.lat - d, r.lon + d * 1.4, r.lat + d].map((v) => v.toFixed(6)).join(","), limit: 500, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url,computed_geometry,geometry" });
  const json = await (await fetch(`https://graph.mapillary.com/images?${q}`, { headers: UA })).json();
  const mx = 111320 * Math.cos((r.lat * Math.PI) / 180), my = 110574;
  const imgs = (json.data || []).map((d) => {
    const [lon, lat] = (d.computed_geometry || d.geometry).coordinates, dx = (r.lon - lon) * mx, dy = (r.lat - lat) * my;
    return { id: d.id, at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, compass: d.computed_compass_angle ?? d.compass_angle, d: Math.hypot(dx, dy), to: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };
  }).filter((i) => i.d >= 6 && i.d <= 40 && !i.pano && angle(i.compass, i.to) <= 30).sort((a, b) => b.at - a.at || a.d - b.d);
  const im = imgs[0];
  if (im) await fs.writeFile(new URL(`${r.id}.jpg`, OUT), Buffer.from(await (await fetch(im.url, { headers: UA })).arrayBuffer()));
  await fs.writeFile(meta, JSON.stringify({ found: json.data?.length ?? 0, photo: im ? { id: im.id, year: new Date(im.at).getFullYear(), d: +im.d.toFixed(1), off: +angle(im.compass, im.to).toFixed(0) } : null }));
  console.log(r.id, json.data?.length ?? 0, im ? `${new Date(im.at).getFullYear()} ${im.d.toFixed(0)} m` : "–");
  await new Promise((res) => setTimeout(res, 300));
}
