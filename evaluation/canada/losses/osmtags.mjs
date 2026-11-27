// node evaluation/canada/losses/osmtags.mjs <id>…   (ids of review/sample.json; the OSM packs of app/data/osm-pack)
// OSM around each cut: the cut's way's tags and the ways crossing the cut line within 30 m (their t across, A = negative?).
import fs from "node:fs";
const W = new URL("../../../", import.meta.url).pathname;
const { osmAt } = await import(W + "evaluation/kliky/osm.mjs");
const { parallelsAt } = await import(W + "app/public/towns/planimetrics.js");
const sample = JSON.parse(fs.readFileSync(W + "evaluation/canada/review/sample.json", "utf8"));
const ids = process.argv.slice(2);
const SKIP = new Set(["name:fr","name:en","tiger:cfcc","tiger:county","tiger:reviewed","tiger:name_base","tiger:name_type","tiger:name_direction_suffix","tiger:zip_left","tiger:zip_right","tiger:tlid","tiger:source","tiger:upload_uuid","tiger:separated","tiger:name_direction_prefix","source","wikidata","wikipedia"]);
const tg = (t) => Object.entries(t || {}).filter(([k]) => !SKIP.has(k) && !k.startsWith("tiger") && !k.startsWith("name:")).map(([k, v]) => `${k}=${v}`).join(" ");
for (const id of ids) {
  const s = sample.find((x) => x.id === id);
  const { elements } = await osmAt(s.lat, s.lon, 45, false);
  const way = elements.find((e) => e.type === "way" && e.id === s.wayId);
  const b = (s.bearing * Math.PI) / 180, along = [Math.sin(b), Math.cos(b)]; // street direction (east, north)
  // cut direction: street turned right (A on the left looking along the street)
  const dir = [along[1], -along[0]];
  const c = { lon0: s.lon, lat0: s.lat, kx: 111320 * Math.cos((s.lat * Math.PI) / 180), ky: 110574, dir };
  console.log(`### ${id} ${s.name} ${s.highway} way ${s.wayId}`);
  console.log(`  WAY: ${tg(way?.tags)}`);
  const rows = [];
  for (const el of elements) {
    if (el.type !== "way" || !el.tags || !(el.tags.highway || el.tags.railway || el.tags.barrier || el.tags["area:highway"] || el.tags.amenity === "parking")) continue;
    const ts = parallelsAt([el], c, () => true).filter((t) => Math.abs(t) < 35);
    if (!ts.length) continue;
    rows.push([ts.map((t) => t.toFixed(1)).join(","), el.id === s.wayId ? "*" : "", el.id, tg(el.tags)]);
  }
  rows.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  for (const r of rows) console.log(`  t=${r[0]} ${r[1]}${r[2]} ${r[3].slice(0, 400)}`);
}
