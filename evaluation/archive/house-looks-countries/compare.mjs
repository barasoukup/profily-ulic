// Offline: the look and details of ~thousands of synthetic houses from the old house-looks.js (house-looks.before.js,
// the iso branches) and the new one (the states' modules). Must be 0 differences: node compare.mjs
import * as old from "./house-looks.before.js";
import * as neu from "../../../app/public/house-looks.js";
import { mulberry } from "./rng.mjs";
const mods = {};
for (const iso of ["MT", "CY", "IT", "ES", "PT", "DK", "FI", "MC", "FR"]) mods[iso] = (await import(`../../../app/public/countries/${iso}.js`)).default;
const rnd = mulberry(7);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const STYLES = ["sikma", "mestan", "nizky", "funkce", "vila", "statek", "povalecny", "moderni", "panel"];
const TYPES = [undefined, "house", "terrace", "detached", "apartments", "villa", "farm"];
const MATS = [undefined, "wood", "plaster", "brick", "stucco"];
const SHAPES = [undefined, "flat", "gabled", "mansard", "hipped"];
const PLACES = {
  base: [[12, 46.5], [11.35, 46.5], [-8, 43], [-5, 43.3], [-2.5, 43.2], [2.17, 41.39], [-3.7, 40.4], [-5.99, 37.39], [14.9, 55.1], [12.57, 55.68],
    [24.95, 60.17], [33.36, 35.17], [14.51, 35.9], [-9.14, 38.72], [7.0, 43.7], [2.35, 48.85], [4.83, 45.76], [7.42, 43.73], [12.5, 41.9], [10.4, 63.4]],
};
let n = 0, diff = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(tag, a, b, info) { n++; if (!same(a, b)) { diff++; if (diff < 15) console.log("DIFF", tag, JSON.stringify(info), a, b); } }
const rules = {
  MT: [old.mediterraneanLook("MT"), mods.MT.houseLook, null, mods.MT.houseDetails],
  CY: [old.mediterraneanLook("CY"), mods.CY.houseLook, old.mediterraneanDetails("CY"), mods.CY.houseDetails],
  IT: [old.mediterraneanLook("IT"), mods.IT.houseLook, old.mediterraneanDetails("IT"), mods.IT.houseDetails],
  ES: [old.mediterraneanLook("ES"), mods.ES.houseLook, old.mediterraneanDetails("ES"), mods.ES.houseDetails],
  PT: [old.mediterraneanLook("PT"), mods.PT.houseLook, old.mediterraneanDetails("PT"), mods.PT.houseDetails],
  MC: [old.monacoLook, mods.MC.houseLook, old.mediterraneanDetails("MC"), mods.MC.houseDetails],
  FR: [old.franceLook, mods.FR.houseLook, old.franceDetails, mods.FR.houseDetails],
  DK: [old.nordicLook("DK"), mods.DK.houseLook, old.nordicDetails("DK"), mods.DK.houseDetails],
  FI: [old.nordicLook("FI"), mods.FI.houseLook, old.nordicDetails("FI"), mods.FI.houseDetails],
  SE: [old.nordicLook("SE"), neu.nordicLook("SE"), old.nordicDetails("SE"), neu.nordicDetails("SE")],
  NO: [old.nordicLook("NO"), neu.nordicLook("NO"), old.nordicDetails("NO"), neu.nordicDetails("NO")],
};
const looks = new Set();
for (let i = 0; i < 20000; i++) {
  const iso = pick(Object.keys(rules));
  const [oL, nL, oD, nD] = rules[iso];
  const [lon, lat] = pick(PLACES.base);
  const p = [lon + (rnd() - 0.5) * 0.02, lat + (rnd() - 0.5) * 0.02];
  const info = {
    [rnd() < 0.5 ? "point" : "at"]: rnd() < 0.95 ? p : undefined,
    built: rnd() < 0.5 ? undefined : 1700 + Math.floor(rnd() * 330), start: rnd() < 0.7 ? undefined : 1700 + Math.floor(rnd() * 330),
    type: pick(TYPES), material: pick(MATS), roofShape: pick(SHAPES), levels: rnd() < 0.5 ? undefined : 1 + Math.floor(rnd() * 9),
    block: rnd() < 0.5 ? undefined : { parts: Math.floor(rnd() * 6) },
  };
  const style = pick(STYLES), lv = rnd() < 0.2 ? undefined : 1 + Math.floor(rnd() * 10);
  const a = oL(style, info, lv), b = nL(style, info, lv);
  check(`${iso} look ${style}`, a, b, info); if (a) looks.add(`${iso}:${a}`);
  if (oD && nD) check(`${iso} details ${a}`, oD(a, info), nD(a, info), info);
  else if (!oD && !nD) n++; else check(iso + " details null", !!oD, !!nD, info);
}
console.log(`${n} comparisons, ${diff} differences; looks seen: ${[...looks].sort().join(" ")}`);
process.exit(diff ? 1 : 0);
