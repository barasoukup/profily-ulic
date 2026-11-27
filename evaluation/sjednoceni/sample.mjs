// Random candidates for the A/B of the unification (Bára 24. 11. 2026: "otestuj, zda to můžeme vše sjednotit"): points
// within R m of a centre, inside the place's ring where one is given, a fixed seed. The page (sber.js pick) snaps them onto
// the nearest car street within 25 m, none within 100 m of another.
//   node evaluation/sjednoceni/sample.mjs <set> > evaluation/sjednoceni/<set>-kandidati.json
import fs from "node:fs";
const set = process.argv[2];
const SETS = {
  // The nine Czech towns with a passport (towns/pasporty.js, pasporty.json), 14 candidates each.
  pasporty: { seed: 20261124 + 7, n: 14, r: 1300, ring: "pasporty", places: { chomutov: [50.4606, 13.4178], sumperk: [49.9653, 16.9706], roznov: [49.4585, 18.143],
    litomerice: [50.5335, 14.1318], chotebor: [49.7207, 15.6702], slapanice: [49.1679, 16.7272], kurim: [49.2985, 16.5314], prachatice: [49.0128, 13.9975], roudnice: [50.4253, 14.2616] } },
  // Slovakia's towns (the law's parking estimate, countries/SK.js parkGuess), 9 candidates each within 2 km.
  slovensko: { seed: 20261124 + 11, n: 9, r: 2000, places: { bratislava: [48.1486, 17.1077], petrzalka: [48.1150, 17.1100], kosice: [48.7164, 21.2611], zilina: [49.2231, 18.7394],
    presov: [48.9976, 21.2393], nitra: [48.3069, 18.0864], trnava: [48.3774, 17.5883], bystrica: [48.7363, 19.1462], trencin: [48.8945, 18.0444], martin: [49.0665, 18.9230], poprad: [49.0555, 20.2975] } },
  // More of Slovakia (the first set gave 30 local streets): another seed, 14 candidates each within 3 km.
  slovensko2: { seed: 20261124 + 19, n: 14, r: 3000, places: { bratislava: [48.1486, 17.1077], petrzalka: [48.1150, 17.1100], kosice: [48.7164, 21.2611], zilina: [49.2231, 18.7394],
    presov: [48.9976, 21.2393], nitra: [48.3069, 18.0864], trnava: [48.3774, 17.5883], bystrica: [48.7363, 19.1462], trencin: [48.8945, 18.0444], martin: [49.0665, 18.9230], poprad: [49.0555, 20.2975] } },
  // Controls of the shared parking fix (ai-kerbs.js parkFromAi) where the law's estimate was on already: towns without
  // a surface map in Austria, Germany and Poland, 8 candidates each within 2.5 km.
  kontrola: { seed: 20261124 + 23, n: 8, r: 2500, places: { graz: [47.0707, 15.4395], linz: [48.3059, 14.2862], leipzig: [51.3397, 12.3731], muenchen: [48.1374, 11.5755],
    koeln: [50.9375, 6.9603], dresden: [51.0504, 13.7373], wroclaw: [51.1079, 17.0385], poznan: [52.4064, 16.9252] } },
  // Towns with a surface map abroad (city.fix: off abroad, never tried), 7 candidates each within 2.5 km.
  mapy: { seed: 20261124 + 13, n: 7, r: 2500, places: { wien: [48.2085, 16.3731], berlin: [52.52, 13.405], hamburg: [53.5511, 9.9937], paris: [48.8566, 2.3522],
    helsinki: [60.1699, 24.9384], amsterdam: [52.3676, 4.9041], zurich: [47.3769, 8.5417], tallinn: [59.437, 24.7536], bratislava: [48.1486, 17.1077],
    krakow: [50.0647, 19.945], zaragoza: [41.6488, -0.8891], bologna: [44.4949, 11.3426] } },
  // Prague (city.fix off by the 100 cuts of 9. 11. 2026; MTVU is the truth), 36 candidates within 4.5 km.
  praha: { seed: 20261124 + 17, n: 36, r: 4500, places: { praha: [50.0755, 14.4378] } },
  // Czech motorways and expressways (wideRoads: off in Czechia, "not tried"), 10 candidates each within 2 km of a stretch.
  dalnice: { seed: 20261124 + 29, n: 10, r: 2000, places: { chodov: [50.03, 14.49], ruzyne: [50.08, 14.27], slatina: [49.17, 16.70], plzen: [49.72, 13.34],
    zdiby: [50.16, 14.44], rudna: [49.81, 18.22], hradec: [50.24, 15.82], olomouc: [49.61, 17.22] } },
  // Main streets of the states without wideStreets (a side ending in a median or promenade at the reach gets 35 m),
  // 8 candidates each within 3 km.
  hlavni: { seed: 20261124 + 31, n: 8, r: 3000, places: { praha: [50.0755, 14.4378], brno: [49.1951, 16.6068], ostrava: [49.8347, 18.282], bratislava: [48.1486, 17.1077],
    wien: [48.2085, 16.3731], berlin: [52.52, 13.405], muenchen: [48.1374, 11.5755], warszawa: [52.2297, 21.0122], amsterdam: [52.3676, 4.9041], zurich: [47.3769, 8.5417] } },
  // The wide reach as a rule of the data (Bára 25. 11. 2026): towns with a surface map, full coverage (NL BGT, the Swiss
  // survey, Berlin) and of the street area only (Vienna, Helsinki), and Paris, 8 candidates each within 4 km.
  siroke: { seed: 20261124 + 37, n: 8, r: 4000, places: { amsterdam: [52.3676, 4.9041], rotterdam: [51.9225, 4.4792], utrecht: [52.0907, 5.1214], zurich: [47.3769, 8.5417],
    bern: [46.948, 7.4474], basel: [47.5596, 7.5886], wien: [48.2085, 16.3731], helsinki: [60.1699, 24.9384], berlin: [52.52, 13.405], paris: [48.8566, 2.3522] } },
  // Controls without a surface map (SK, PL, France outside Paris), where the rule should change nothing.
  siroke_kontrola: { prefix: "sk", seed: 20261124 + 41, n: 8, r: 4000, places: { kosice: [48.7164, 21.2611], zilina: [49.2231, 18.7394], wroclaw: [51.1079, 17.0385], lodz: [51.7592, 19.456],
    lyon: [45.764, 4.8357], toulouse: [43.6047, 1.4442] } },
};
const S = SETS[set];
let seed = S.seed;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rings = S.ring ? JSON.parse(fs.readFileSync(new URL(`../../app/public/${S.ring}.json`, import.meta.url), "utf8")) : {};
const inRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const out = [];
for (const [place, [lat0, lon0]] of Object.entries(S.places)) {
  let i = 0, tries = 0;
  while (i < S.n && tries++ < 500) {
    const r = S.r * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const lat = +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon = +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6);
    if (rings[place] && !rings[place].some((ring) => inRing(ring, lon, lat))) continue;
    out.push({ id: `${S.prefix || set.slice(0, 2)}${set.match(/\d+$/)?.[0] || ""}-${place}-${++i}`, place, lat, lon });
  }
}
console.log(JSON.stringify(out, null, 1));
