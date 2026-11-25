// As ../fotky.mjs (its own folder). Street photos for the A/B of the unification (as ../mapfill-cz/fotky.mjs): for each cut of a results file the newest Mapillary photo within
// 30 m looking along the street each way (f, b; a panorama where no photo looks that way), into data/foto/ (git ignores
// data/). The token from evaluation/streetview/token.local, never printed.
//   node evaluation/sjednoceni/fotky.mjs vysledky/rezy.json [N]     (N: the variant whose cut gives the place)
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const TOKEN = (await fs.readFile(path.join(ROOT, "..", "..", "streetview", "token.local"), "utf8")).trim();
// Czechia: where Mapillary has none, the static panorama of Mapy.com (as ../universal/prepare.mjs), its key in MAPY_KEY or
// evaluation/universal/mapy-key.local, never printed. Its terms do not allow keeping the images: delete data/foto once judged.
const MAPY_KEY = (process.env.MAPY_KEY || (await fs.readFile(path.join(ROOT, "..", "..", "universal", "mapy-key.local"), "utf8").catch(() => ""))).trim();
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
  if (!got[r.id].length && MAPY_KEY && (c.country || "CZ") === "CZ") for (const [k, deg] of [["f", c.bearing], ["b", c.bearing + 180]]) {
    const yaw = ((((deg % 360) + 360) % 360) * Math.PI) / 180;
    const res = await fetch(`https://api.mapy.cz/v1/static/pano?${new URLSearchParams({ lon: c.lon, lat: c.lat, width: 1024, height: 640, yaw: yaw.toFixed(4), fov: 1.4, radius: 30, apikey: MAPY_KEY })}`);
    if (!res.ok || !/image/.test(res.headers.get("content-type") || "")) continue;
    await fs.writeFile(path.join(ROOT, "data", "foto", `${r.id}-${k}.jpg`), Buffer.from(await res.arrayBuffer()));
    got[r.id].push({ k, year: "Mapy.com", pano: false });
  }
  console.log(r.id, imgs.length, got[r.id].map((x) => `${x.k} ${x.year}${x.pano ? " pano" : ""}`).join(", "));
  await new Promise((res) => setTimeout(res, 300));
}
await fs.writeFile(gotFile, JSON.stringify(got, null, 1));
