// Fresh random candidates (a fixed seed) for part 2 of the measurement: 60 a place within R m of its centre, none within
// 150 m of a judged point of the universal measurement. The page (zz-mer.js pickLocal) snaps them onto local streets
// (residential, unclassified, living_street), vyber keeps the first 12 of each group. node sample.mjs > kandidati.json
import fs from "node:fs";
const judge = JSON.parse(fs.readFileSync(new URL("../../universal/judge.json", import.meta.url), "utf8"));
// group: places; the group's cap. "m": a surface map, mapFill unmeasured; "p": the law's parking unmeasured.
export const GROUPS = {
  "NL-m": [12, { amsterdam: [52.3727, 4.8933], rotterdam: [51.9225, 4.4792], utrecht: [52.0907, 5.1214] }],
  "CH-m": [10, { zurich: [47.3769, 8.5417], bern: [46.948, 7.4474], basel: [47.5596, 7.5886] }],
  "BE-m": [12, { gent: [51.0543, 3.7174], antwerpen: [51.2194, 4.4025], leuven: [50.8798, 4.7005] }],
  "DE-berlin": [10, { berlin: [52.52, 13.405] }],
  "DE-hamburg": [10, { hamburg: [53.5503, 9.9925] }],
  "FR-paris": [12, { paris: [48.857, 2.352] }],
  "PL-krakow": [12, { krakow: [50.0614, 19.9383] }],
  "ES-zaragoza": [12, { zaragoza: [41.65, -0.89] }],
  "SK-m": [16, { bratislava: [48.1447, 17.1128], presov: [48.9983, 21.239], zilina: [49.223, 18.74], bystrica: [48.736, 19.146] }],
  "PL-p": [12, { wroclaw: [51.1099, 17.0326], lodz: [51.7592, 19.456], gdansk: [54.352, 18.6466], poznan: [52.4064, 16.9252] }],
  "FR-p": [12, { lyon: [45.764, 4.836], toulouse: [43.605, 1.444], lille: [50.629, 3.057], nantes: [47.218, -1.554] }],
  "BE-p": [10, { bruxelles: [50.8467, 4.3525], liege: [50.6326, 5.5797], namur: [50.4674, 4.872] }],
  "ES-p": [12, { madrid: [40.425, -3.7], valencia: [39.47, -0.375], sevilla: [37.39, -5.99], valladolid: [41.65, -4.725] }],
  "PT-p": [12, { lisboa: [38.722, -9.142], porto: [41.152, -8.612], braga: [41.55, -8.425], coimbra: [40.208, -8.425] }],
  "IT-p": [12, { bologna: [44.494, 11.343], modena: [44.647, 10.925], torino: [45.07, 7.687] }],
  "FI-p": [12, { helsinki: [60.17, 24.941], espoo: [60.176, 24.805], turku: [60.452, 22.267] }],
  "DK-p": [12, { kobenhavn: [55.68, 12.57], aarhus: [56.155, 10.205], odense: [55.396, 10.388], aalborg: [57.048, 9.92] }],
  "EE-p": [12, { tallinn: [59.437, 24.754], tartu: [58.378, 26.729], parnu: [58.385, 24.497] }],
  "LT-p": [10, { vilnius: [54.687, 25.28] }],
};
let seed = 20261125 + 303;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [], R = 2500, dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
for (const [group, [cap, places]] of Object.entries(GROUPS)) for (const [place, [la, lo]] of Object.entries(places)) for (let i = 1; i <= 60; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  const p = { id: `me-${group.toLowerCase()}-${place}-${i}`, group, country: group.slice(0, 2), place, lat: +(la + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lo + (r * Math.sin(a)) / (111320 * Math.cos((la * Math.PI) / 180))).toFixed(6) };
  if (judge.every((q) => dist(p, q) >= 150)) out.push(p);
}
if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(out));
