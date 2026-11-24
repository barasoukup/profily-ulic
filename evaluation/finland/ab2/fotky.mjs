// Street photos for the second A/B of YLRE (as evaluation/italy/lombardia/fotky.mjs): for each cut of vysledky/rezy.json
// the newest Mapillary photo within 30 m looking along the street each way (f, b; a panorama where no photo looks that
// way), into data/foto/ (git ignores data/). The token from evaluation/streetview/token.local, never printed.
//   node evaluation/finland/ab2/fotky.mjs
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TOKEN = (await fs.readFile(path.join(ROOT, "..", "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", "rezy.json"), "utf8"));
await fs.mkdir(path.join(ROOT, "data", "foto"), { recursive: true });
const got = {};
const CAR = new Set(["residential", "tertiary", "secondary", "primary", "unclassified", "living_street", "trunk", "primary_link", "secondary_link", "tertiary_link", "trunk_link", "motorway"]);
for (const r of rows) {
  const c = r.B;
  if (!c?.lat || r.group === "control" || !CAR.has(r.highway) || !r.B?.sources?.fiTown) continue;
  const q = new URLSearchParams({ access_token: TOKEN, lat: c.lat, lng: c.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" });
  let imgs = [];
  try { imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle })); } catch {}
  got[r.id] = [];
  for (const [k, deg] of [["f", c.bearing], ["b", c.bearing + 180]]) {
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (!im) continue;
    await fs.writeFile(path.join(ROOT, "data", "foto", `${r.id}-${k}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer()));
    got[r.id].push({ k, year: new Date(im.at).getFullYear(), pano: im.pano });
  }
  console.log(r.id, imgs.length, got[r.id].map((x) => `${x.k} ${x.year}${x.pano ? " pano" : ""}`).join(", "));
  await new Promise((res) => setTimeout(res, 300));
}
await fs.writeFile(path.join(ROOT, "vysledky", "fotky.json"), JSON.stringify(got, null, 1));
