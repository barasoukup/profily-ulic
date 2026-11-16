// 1000 cuts across Slovakia for the search of what does not fit (Bára 16. 11. 2026: "projde 1000 míst na Slovensku"):
// random points (fixed seed) round the centres of the ten biggest towns and sixteen smaller ones; the app snaps each
// to the nearest street. Written to vzorek.json for sber.js.
//   node evaluation/slovensko/kontrola/vzorek.mjs
import fs from "node:fs";
// [town, lat, lon, radius m, points]
const TOWNS = [
  ["bratislava", 48.1440, 17.1100, 4000, 228], ["kosice", 48.7190, 21.2580, 3000, 120], ["presov", 48.9980, 21.2400, 2000, 50],
  ["zilina", 49.2230, 18.7400, 2000, 50], ["nitra", 48.3120, 18.0870, 2000, 50], ["banska-bystrica", 48.7360, 19.1460, 2000, 50],
  ["trnava", 48.3774, 17.5883, 2000, 50], ["trencin", 48.8945, 18.0444, 2000, 50], ["martin", 49.0665, 18.9230, 1800, 40],
  ["poprad", 49.0555, 20.2975, 1800, 40],
  ["zvolen", 48.5762, 19.1371, 1200, 17], ["piestany", 48.5918, 17.8273, 1200, 17], ["michalovce", 48.7543, 21.9195, 1200, 17],
  ["spisska-nova-ves", 48.9446, 20.5615, 1200, 17], ["komarno", 47.7631, 18.1295, 1200, 17], ["levice", 48.2153, 18.6070, 1200, 17],
  ["lucenec", 48.3298, 19.6667, 1200, 17], ["humenne", 48.9371, 21.9163, 1200, 17], ["bardejov", 49.2918, 21.2727, 1200, 17],
  ["liptovsky-mikulas", 49.0811, 19.6113, 1200, 17], ["ruzomberok", 49.0748, 19.3006, 1200, 17], ["dunajska-streda", 47.9926, 17.6172, 1200, 17],
  ["topolcany", 48.5617, 18.1775, 1200, 17], ["povazska-bystrica", 49.1214, 18.4206, 1200, 17], ["roznava", 48.6608, 20.5323, 1200, 17],
  ["senica", 48.6797, 17.3667, 1200, 17],
];
let seed = 20261116;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, lat, lon, R, n] of TOWNS) for (let i = 0; i < n; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: out.length + 1, town, lat: +(lat + (r * Math.cos(a)) / 111320).toFixed(6), lon: +(lon + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))).toFixed(6) });
}
fs.writeFileSync(new URL("vzorek.json", import.meta.url), JSON.stringify(out));
console.log(out.length, "bodů");
