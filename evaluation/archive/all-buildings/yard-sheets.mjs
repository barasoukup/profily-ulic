// The judges' sheets of yard-sample.mjs: the photo and the distinct drawings of the three arms (1, 2, 3 from the left) in a drawn order.
//   PUB=app/public RENDER=<render.mjs of north-america-art, its ROOT = PUB> node yard-sheets.mjs <photos> <out> <vzorek4…>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const [PH, OUT, ...files] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const { renderCells } = await import(path.resolve(process.env.RENDER));
const key = {};
let seed = 4711; const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
for (const f of files) for (const s of JSON.parse(fs.readFileSync(f)).rows) {
  const ph = path.join(PH, `${s.id}.jpg`), [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", ph]).toString().split(" ").map(Number), tmp = (n) => path.join(OUT, `tmp-${s.id}-${n}.png`);
  if (s.pano) execFileSync("magick", [ph, "-roll", `${((a) => (a >= 0 ? "+" : "") + a)(Math.round(w / 2 - w * (0.5 + s.off / 360)))}+0`, "-crop", `${Math.round(w * 0.25)}x${Math.round(h * 0.4)}+${Math.round(w / 2 - w * 0.125)}+${Math.round(h * 0.22)}`, "+repage", "-resize", "900x", tmp("photo")]);
  else execFileSync("magick", [ph, "-resize", "1000x", tmp("photo")]);
  // One look, one set of facts: one drawing (the block's shape itself is not drawn).
  const groups = {};
  for (const [a, { look, info }] of Object.entries(s.arms)) (groups[JSON.stringify([look, { ...info, block: 0 }])] ??= []).push(a);
  const list = Object.values(groups).map((arms) => ({ arms, r: rnd() })).sort((a, b) => a.r - b.r);
  key[s.id] = {};
  const cells = [];
  for (const [i, { arms }] of list.entries()) {
    const L = "123"[i];
    for (const a of arms) key[s.id][a] = L;
    await renderCells([{ title: "", cityId: s.city, house: { look: s.arms[arms[0]].look, info: s.arms[arms[0]].info } }], tmp(L), { k: 0.5, cols: 1, CW: 420, text: false });
    cells.push("(", tmp(L), "-resize", "420x760", "-gravity", "south", "-background", "#fbfaf6", "-extent", "420x760", ")");
  }
  execFileSync("magick", ["(", tmp("photo"), "-resize", "x760", ")", ...cells, "-gravity", "north", "+append", path.join(OUT, `${s.id}.jpg`)]);
  for (const n of ["photo", ...list.map((_, i) => "123"[i])]) fs.unlinkSync(tmp(n));
}
fs.writeFileSync(path.join(OUT, "..", "key4.json"), JSON.stringify(key, null, 1));
