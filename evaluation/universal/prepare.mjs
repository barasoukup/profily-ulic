// The universal judging (Bára 17. 11. 2026), the judge's inputs: for each cut of a sample file (id, lat, lon, bearing,
// country, half), the orthophoto (ortho.mjs) and, where Mapillary has them, the photos along the street both ways
// (the pilot's ../streetview/data are reused for Prague). Writes data/<id>-ortho.jpg, -f.jpg, -b.jpg and <id>.txt.
//   node evaluation/universal/prepare.mjs <sample.json>
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "./ortho.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data");
const rows = JSON.parse(await fs.readFile(path.resolve(process.argv[2]), "utf8"));
const TOKEN = process.env.MAPILLARY_TOKEN || (await fs.readFile(path.join(ROOT, "..", "streetview", "token.local"), "utf8").catch(() => "")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
// Czechia: where Mapillary has no photo, the static panorama of Mapy.com (Bára 17. 11. 2026), looking along the street
// both ways. A key of its own for this script (the app's key is limited to the app's web addresses) in MAPY_KEY or
// evaluation/universal/mapy-key.local, which git ignores; never printed. Its terms do not allow keeping the images:
// clean.mjs deletes them once judged.
const MAPY_KEY = (process.env.MAPY_KEY || (await fs.readFile(path.join(ROOT, "mapy-key.local"), "utf8").catch(() => ""))).trim();
async function mapyPano(r) {
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const yaw = ((((deg % 360) + 360) % 360) * Math.PI) / 180;
    const res = await fetch(`https://api.mapy.cz/v1/static/pano?${new URLSearchParams({ lon: r.lon, lat: r.lat, width: 1024, height: 640, yaw: yaw.toFixed(4), fov: 1.4, radius: 30, apikey: MAPY_KEY })}`);
    if (res.ok && /image/.test(res.headers.get("content-type") || "")) await fs.writeFile(path.join(DATA, `${r.id}-${k}.mapy.jpg`), Buffer.from(await res.arrayBuffer()));
  }
}
await fs.mkdir(DATA, { recursive: true });
for (const r of rows) {
  const o = path.join(DATA, `${r.id}-ortho.jpg`);
  if (r.needPhoto) { await photos(r); if (!(await hasPhoto(r))) continue; }
  if (!(await fs.stat(o).catch(() => null))) {
    try { const m = await orthoImage(r, o); await fs.writeFile(path.join(DATA, `${r.id}.txt`), `šířka ${m.widthM} m, výška ${m.heightM} m\n`); }
    catch (e) { console.log(r.id, "ortofoto chybí", e.message); continue; }
  }
  if (!r.needPhoto) await photos(r);
  console.log(r.id);
}

async function hasPhoto(r) {
  return (await fs.stat(path.join(DATA, `${r.id}-f.jpg`)).catch(() => null)) || (await fs.stat(path.join(DATA, `${r.id}-b.jpg`)).catch(() => null));
}
async function photos(r) {
  // Photos: the pilot's where it has them, else Mapillary (one search a cut).
  for (const k of ["f", "b"]) {
    const old = path.join(ROOT, "..", "streetview", "data", `${r.id}-${k}.jpg`);
    if (await fs.stat(old).catch(() => null)) await fs.copyFile(old, path.join(DATA, `${r.id}-${k}.jpg`));
  }
  const hasPhoto = async () => (await fs.stat(path.join(DATA, `${r.id}-f.jpg`)).catch(() => null)) || (await fs.stat(path.join(DATA, `${r.id}-b.jpg`)).catch(() => null));
  let imgs = [];
  if (r.photos && TOKEN && !(await hasPhoto())) {
  const q = new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_2048_url" });
  imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_2048_url, c: d.computed_compass_angle ?? d.compass_angle }));
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) await fs.writeFile(path.join(DATA, `${r.id}-${k}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer()));
  }
  }
  // Czechia: the Mapy.com panorama where Mapillary has none.
  if (r.country === "CZ" && MAPY_KEY && !(await hasPhoto())) {
    await mapyPano(r);
    for (const k of ["f", "b"]) if (await fs.rename(path.join(DATA, `${r.id}-${k}.mapy.jpg`), path.join(DATA, `${r.id}-${k}.jpg`)).then(() => true, () => false)) await fs.appendFile(path.join(DATA, "mapy.txt"), `${r.id}-${k}.jpg\n`);
    console.log(r.id, "Mapy.com", (await hasPhoto()) ? "panorama" : "nic");
  }
  console.log(r.id, imgs.length, "snímků");
}
