// Street photos for the A/B of Lombardy's DBT (as evaluation/universal/prepare.mjs): for each cut that took the DBT the
// newest Mapillary photo within 30 m looking along the street each way (f, b), into data/foto3/ (a panorama where no photo looks that way) (git ignores data/).
//   node evaluation/italy/lombardia/fotky.mjs
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TOKEN = (await fs.readFile(path.join(ROOT, "..", "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", "rezy.json"), "utf8"));
await fs.mkdir(path.join(ROOT, "data", "foto3"), { recursive: true });
for (const r of rows.filter((x) => x.B?.sources?.itTown === "lombardia")) {
  const c = r.B, q = new URLSearchParams({ access_token: TOKEN, lat: c.lat, lng: c.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" });
  const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
  const got = [];
  for (const [k, deg] of [["f", c.bearing], ["b", c.bearing + 180]]) {
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(path.join(ROOT, "data", "foto3", `${r.id}-${k}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push(`${k} ${new Date(im.at).getFullYear()}`); }
  }
  console.log(r.id, imgs.length, got.join(", "));
  await new Promise((res) => setTimeout(res, 300));
}
