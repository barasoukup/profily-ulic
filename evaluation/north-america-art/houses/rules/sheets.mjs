// The judges' sheets: the photo (the house in its middle) and the two drawings X, Y in a drawn order (fixed seed), the
// key apart. node sheets.mjs <scratch> before.json after.json   (PUB for the old code's drawings)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), [S, fb, fa] = process.argv.slice(2), OUT = path.join(S, "sheets");
fs.mkdirSync(OUT, { recursive: true });
const sample = JSON.parse(fs.readFileSync(path.join(HERE, process.env.SAMPLE || "sample.json"))), B = JSON.parse(fs.readFileSync(fb)), A = JSON.parse(fs.readFileSync(fa));
if (process.env.PART) { // drawings of one checkout
  const list = process.env.PART === "before" ? B : A, { renderCells } = await import("../render.mjs");
  for (const o of list) await renderCells([{ title: "", cityId: "usa", house: { info: o.info } }], path.join(S, `${process.env.PART}-${o.id}.png`), { k: 0.5, cols: 1, CW: 420, text: false });
} else {
  const me = fileURLToPath(import.meta.url), key = {};
  execFileSync("node", [me, S, fb, fa], { env: { ...process.env, PART: "before", PUB: process.env.OLD } });
  execFileSync("node", [me, S, fb, fa], { env: { ...process.env, PART: "after", PUB: "" } });
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (const s of sample) {
    const ph = path.join(S, `${process.env.PH || ""}${s.id}.jpg`), [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", ph]).toString().split(" ").map(Number);
    const crop = path.join(S, `crop-${s.id}.jpg`);
    if (s.pano) { const cx = Math.round(w * (0.5 + s.off / 360)), cw = Math.round(w * 0.25), ch = Math.round(h * 0.4); execFileSync("magick", [ph, "-roll", `${w / 2 - cx >= 0 ? "+" : ""}${Math.round(w / 2 - cx)}+0`, "-crop", `${cw}x${ch}+${Math.round(w / 2 - cw / 2)}+${Math.round(h * 0.22)}`, "+repage", "-resize", "900x", crop]); }
    else execFileSync("magick", [ph, "-resize", "1000x", crop]);
    const x = rnd() < 0.5 ? "before" : "after", y = x === "before" ? "after" : "before";
    key[s.id] = { X: x, Y: y };
    execFileSync("magick", ["(", crop, "-resize", "x760", ")", "(", path.join(S, `${x}-${s.id}.png`), "-resize", "420x760", "-gravity", "south", "-background", "#fbfaf6", "-extent", "420x760", ")", "(", path.join(S, `${y}-${s.id}.png`), "-resize", "420x760", "-gravity", "south", "-extent", "420x760", ")", "-gravity", "north", "+append", path.join(OUT, `${s.id}.jpg`)]);
  }
  fs.writeFileSync(path.join(S, "key.json"), JSON.stringify(key));
}
