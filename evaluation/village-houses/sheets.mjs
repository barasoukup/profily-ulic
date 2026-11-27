// The judges' sheets of a sample (sample.mjs, ../north-america-art/cama/ab.mjs): the photo (the house in its middle) and the
// two drawings X, Y in a drawn order (fixed seed), the key apart.
//   node sheets.mjs <photos dir> <out dir> <vzorek.json>…      → <out dir>/<id>.jpg, key.json
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const [PH, OUT, ...files] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const { renderCells } = await import("../north-america-art/houses/render.mjs");
const { city } = await import("../../pilot/public/city.js"), { countryOfCity } = await import("../../pilot/public/city.js");
const key = {};
let seed = 11; const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
for (const f of files) for (const s of JSON.parse(fs.readFileSync(f)).rows) {
  if (!s.drop && s.before.look === s.after.look && JSON.stringify(s.before.info) === JSON.stringify(s.after.info)) { console.log(s.id, "unchanged"); continue; }
  const ph = path.join(PH, `${s.id}.jpg`), [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", ph]).toString().split(" ").map(Number), crop = path.join(OUT, `tmp-${s.id}.jpg`);
  if (s.pano) execFileSync("magick", [ph, "-roll", `${((a) => (a >= 0 ? "+" : "") + a)(Math.round(w / 2 - w * (0.5 + s.off / 360)))}+0`, "-crop", `${Math.round(w * 0.25)}x${Math.round(h * 0.4)}+${Math.round(w / 2 - w * 0.125)}+${Math.round(h * 0.22)}`, "+repage", "-resize", "900x", crop]);
  else execFileSync("magick", [ph, "-resize", "1000x", crop]);
  // The look is given, so a state's place-dependent choice (Germany's panels) is the sample's.
  for (const a of ["before", "after"]) await renderCells([{ title: "", cityId: s.city, house: { look: s[a].look, info: s[a].info } }], path.join(OUT, `tmp-${s.id}-${a}.png`), { k: 0.5, cols: 1, CW: 420, text: false });
  const x = rnd() < 0.5 ? "before" : "after", y = x === "before" ? "after" : "before";
  key[s.id] = { X: x, Y: y };
  const cell = (a) => ["(", path.join(OUT, `tmp-${s.id}-${a}.png`), "-resize", "420x760", "-gravity", "south", "-background", "#fbfaf6", "-extent", "420x760", ")"];
  execFileSync("magick", ["(", crop, "-resize", "x760", ")", ...cell(x), ...cell(y), "-gravity", "north", "+append", path.join(OUT, `${s.id}.jpg`)]);
  for (const g of [crop, path.join(OUT, `tmp-${s.id}-before.png`), path.join(OUT, `tmp-${s.id}-after.png`)]) fs.unlinkSync(g);
}
fs.writeFileSync(path.join(OUT, "key.json"), JSON.stringify(key, null, 1));
