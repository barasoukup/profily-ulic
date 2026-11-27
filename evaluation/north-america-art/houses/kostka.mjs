// The houses of the general drawing (profile.js drawPrahaBuilding) with a flight of steps beside the door, for checking
// that the steps and their rail cover no window and lead into no cellar window.
//   [PUB=dir] node evaluation/north-america-art/houses/kostka.mjs out.png
import { renderCells } from "./render.mjs";
const blk = { length: 40, width: 12, fill: 0.9, parts: 1 };
const c = (title, look, levels, t, extra = {}, cityId = "praha") => ({ title, cityId, house: { look, info: { levels, point: [14.42, 50.087], block: blk, type: "house", tint: t, ...extra } } });
const cells = [];
for (const look of ["kostka", "vila", "novyrd", "nizky", "cihlovy", "stit"]) for (const [lv, t] of [[1, 0], [1, 2], [2, 1], [2, 3]]) cells.push(c(`${look} ${lv} t${t}`, look, lv, t));
console.log(await renderCells(cells, process.argv[2], { k: 0.28, cols: 4, CW: 440, cut: 120 }));
