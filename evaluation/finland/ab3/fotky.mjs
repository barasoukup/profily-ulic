// Street photos for the third A/B (as ../ab2/fotky.mjs): for each cut of a results file the newest Mapillary photo within
// 30 m looking along the street each way (f, b; a panorama where no photo looks that way), into data/foto/ (git ignores
// data/). The token from evaluation/streetview/token.local, never printed.
//   node evaluation/finland/ab3/fotky.mjs vysledky/rezy-novy.json [N]     (N: the variant whose cut gives the place)
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TOKEN = (await fs.readFile(path.join(ROOT, "..", "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const file = process.argv[2], key = process.argv[3] || "N";
const rows = JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8"));
await fs.mkdir(path.join(ROOT, "data", "foto"), { recursive: true });
const gotFile = path.join(ROOT, "vysledky", "fotky.json");
const got = JSON.parse(await fs.readFile(gotFile, "utf8").catch(() => "{}"));
for (const r of rows) {
  const c = r[key];
  if (!c?.lat || got[r.id]) continue;
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
await fs.writeFile(gotFile, JSON.stringify(got, null, 1));
