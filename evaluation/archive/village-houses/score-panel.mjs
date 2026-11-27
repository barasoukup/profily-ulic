// node score-panel.mjs feat.json… : the panel score of each house with its features
import fs from "node:fs";
import { C, P } from "./lib.mjs";
import { panelScore } from "../../../app/public/house-looks.js";
for (const f of process.argv.slice(2)) for (const h of JSON.parse(fs.readFileSync(f))) {
  const i = h.info, o = i.own || {}, a = i.around || {};
  console.log(h.id.padEnd(6), String(panelScore(i)).padEnd(4), "n" + (i.levels || "-"), "fp" + Math.round(i.footprint || 0), "rect" + o.rect, "built" + a.built, "gr" + a.green, i.type || "-", h.look);
}
