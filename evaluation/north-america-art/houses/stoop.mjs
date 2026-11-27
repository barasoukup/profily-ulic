// Houses with a stoop / flight of steps (and a basement window) for checking that the steps cover no window.
//   [PUB=dir] node evaluation/north-america-art/houses/stoop.mjs out.png
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderCells } from "./render.mjs";
const PUB = process.env.PUB ? path.resolve(process.env.PUB) : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "app", "public");
await import(pathToFileURL(path.join(PUB, "america.js"))); // the drawing is loaded late: here at once
const blk = { length: 40, width: 12, fill: 0.9, parts: 8 };
const P = { dc: [-76.9935, 38.8870], george: [-77.065, 38.908], petworth: [-77.02, 38.942], nyc: [-73.968, 40.78], any: [-77.2, 38.85], any2: [-77.2, 38.8503], bos: [-71.06, 42.31] };
const h = (look, levels, at, extra = {}) => ({ look, info: { levels, point: P[at], block: blk, type: "house", ...extra } });
const c = (title, house) => ({ title, house, cityId: "usa" });
const cells = [];
for (const lv of [1, 2]) for (const t of [0, 1, 2, 3]) {
  cells.push(c(`porchrow ${lv} t${t} walk`, h("porchrow", lv, "petworth", { tint: t, atWalk: true })));
  cells.push(c(`porchrow ${lv} t${t}`, h("porchrow", lv, "petworth", { tint: t })));
  cells.push(c(`bayrow flat ${lv} t${t}`, h("bayrow", lv, "george", { tint: t })));
  cells.push(c(`bayrow bay ${lv} t${t}`, h("bayrow", lv, "dc", { tint: t })));
}
cells.push(c("framehouse stoop", h("framehouse", 1, "any", { tint: 3, start: 1955 })), c("framehouse", h("framehouse", 1, "any2", { tint: 2 })), c("brownstone", h("brownstone", 4, "nyc", { tint: 0 })), c("tripledecker", h("tripledecker", 3, "bos", { tint: 1 })), c("baygable", h("baygable", 2, "any", { tint: 1 })), c("victorian", h("victorian", 2, "any", { tint: 1 })), c("tenement", h("tenement", 5, "nyc", { tint: 0 })));
console.log(await renderCells(cells, process.argv[2], { k: 0.28, cols: 4, CW: 440, cut: 120 }));
