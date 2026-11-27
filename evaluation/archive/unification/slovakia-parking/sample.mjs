// Fresh random candidates (a new seed) for the A/B of the law's parking: SK, CZ, AT, DE. Writes kandidati.json here.
import fs from "node:fs";
const S = { SK: [45, 3000, { bratislava: [48.1486, 17.1077], petrzalka: [48.115, 17.11], kosice: [48.7164, 21.2611], zilina: [49.2231, 18.7394], presov: [48.9976, 21.2393], nitra: [48.3069, 18.0864], trnava: [48.3774, 17.5883], bystrica: [48.7363, 19.1462], trencin: [48.8945, 18.0444], martin: [49.0665, 18.923], poprad: [49.0555, 20.2975] }],
  CZ: [30, 2500, { ostrava: [49.8347, 18.282], olomouc: [49.5938, 17.2509], hradec: [50.2092, 15.8328], budejovice: [48.9745, 14.4743], liberec: [50.7663, 15.0543], zlin: [49.2265, 17.6707], pardubice: [50.0343, 15.7812], kladno: [50.1473, 14.1028] }],
  AT: [35, 2500, { graz: [47.0707, 15.4395], linz: [48.3059, 14.2862], salzburg: [47.8095, 13.055], innsbruck: [47.2692, 11.4041] }],
  DE: [35, 2500, { leipzig: [51.3397, 12.3731], koeln: [50.9375, 6.9603], dresden: [51.0504, 13.7373], muenchen: [48.1374, 11.5755] }] };
let seed = 20261125 + 101; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [];
for (const [iso, [n, R, places]] of Object.entries(S)) for (const [place, [la, lo]] of Object.entries(places)) for (let i = 1; i <= n; i++) {
  const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `st-${iso}-${place}-${i}`, iso, place, lat: +(la + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lo + (r * Math.sin(a)) / (111320 * Math.cos((la * Math.PI) / 180))).toFixed(6) });
}
fs.writeFileSync(new URL("kandidati.json", import.meta.url), JSON.stringify(out));
