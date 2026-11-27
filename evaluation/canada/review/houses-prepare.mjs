// Toronto's houses whose drawn floors the height changes (houses.json, ../houses.mjs): their photos cut to the house's direction, for
// two blind judges (floors and kind; no profile shown).   node houses-prepare.mjs <dir of photos>      data/review-houses/
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { AMERICA } from "../../../app/public/houses-america-spec.js";
const HERE = path.dirname(new URL(import.meta.url).pathname), OUT = path.join(HERE, "../data/review-houses"), rows = JSON.parse(fs.readFileSync(path.join(HERE, "houses.json"))).rows;
const DEFAULT = { kancelar: 5, slab: 8 };
export const drawn = (x) => x.info.levels || AMERICA[x.look]?.floors || DEFAULT[x.look] || 3;
const changed = rows.filter((r) => r.after.info.src === "ipr" && (drawn(r.before) !== drawn(r.after) || r.before.look !== r.after.look));
console.log(rows.length, "domů, změněných", changed.length);
fs.mkdirSync(OUT, { recursive: true });
for (const r of changed) {
  const f = path.join(process.argv[2], `${r.id}.jpg`), [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", f]).toString().split(" ").map(Number);
  const cw = Math.round(w * (r.pano ? 0.22 : 0.6)), x = Math.round(w * (0.5 + r.off / (r.pano ? 360 : 72)) - cw / 2);
  execFileSync("magick", [f, "-virtual-pixel", r.pano ? "tile" : "black", "-distort", "SRT", `${-(x + cw / 2 - w / 2)},0 1 0 ${0},0`.replace(/^.*$/, `${x + cw / 2},${h / 2} 1 0 ${w / 2},${h / 2}`), "-gravity", "center", "-crop", `${cw}x${r.pano ? Math.round(h * 0.6) : h}+0+0`, "+repage", "-resize", "1000x1000", path.join(OUT, `${r.id}.jpg`)]);
}
fs.writeFileSync(path.join(OUT, "SEZNAM.md"), changed.map((r) => r.id).join("\n"));
fs.writeFileSync(path.join(HERE, "results", "houses-changed.json"), JSON.stringify(changed.map((r) => ({ id: r.id, before: drawn(r.before), after: drawn(r.after), lookBefore: r.before.look, lookAfter: r.after.look, osm: r.tags["building:levels"] || null }))));
