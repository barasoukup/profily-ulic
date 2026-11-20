// The universal sample (Bára 17. 11. 2026): ten towns of each state, large and small, 8 random points each within
// 1.5 km of the centre, a fixed seed; the same for every state (a new state: add its towns). Judged are only the cuts
// with a street-level photo (prepare.mjs), at most 4 a town.
//   node evaluation/universal/sample.mjs > evaluation/universal/sample.json
export const TOWNS = {
  CZ: { praha: [50.0875, 14.4213], brno: [49.1951, 16.6068], ostrava: [49.835, 18.292], plzen: [49.7475, 13.3776], olomouc: [49.5938, 17.2509],
    liberec: [50.7671, 15.0562], hradec: [50.2092, 15.8328], jihlava: [49.3961, 15.5912], kolin: [50.0281, 15.2006], trebic: [49.215, 15.8799] },
  SK: { bratislava: [48.1447, 17.1128], kosice: [48.7206, 21.258], presov: [48.9983, 21.239], zilina: [49.223, 18.74], nitra: [48.309, 18.084],
    bystrica: [48.736, 19.146], trnava: [48.377, 17.587], martin: [49.066, 18.921], poprad: [49.059, 20.297], zvolen: [48.575, 19.127] },
  AT: { wien: [48.2085, 16.3731], graz: [47.0707, 15.4395], linz: [48.3059, 14.2862], salzburg: [47.8, 13.044], innsbruck: [47.2683, 11.3933],
    klagenfurt: [46.6247, 14.3053], villach: [46.6111, 13.8558], wels: [48.1575, 14.0289], stpoelten: [48.2047, 15.6256], dornbirn: [47.4125, 9.7417] },
  DE: { berlin: [52.52, 13.405], hamburg: [53.5503, 9.9925], muenchen: [48.1374, 11.5755], koeln: [50.9375, 6.9603], frankfurt: [50.1109, 8.6821],
    leipzig: [51.3397, 12.3731], dresden: [51.0504, 13.7373], aachen: [50.7762, 6.0839], nuernberg: [49.4521, 11.0767], freiburg: [47.9959, 7.8522] },
  // Switzerland (17. 11. 2026): Lausanne and Lucerne without the cadastral survey (Vaud and Lucerne do not share it).
  CH: { zurich: [47.3769, 8.5417], geneve: [46.2044, 6.1432], basel: [47.5596, 7.5886], lausanne: [46.5197, 6.6323], bern: [46.948, 7.4474],
    winterthur: [47.4997, 8.7241], luzern: [47.0502, 8.3093], stgallen: [47.4245, 9.3767], lugano: [46.0037, 8.9511], biel: [47.1368, 7.2468] },
  LI: { vaduz: [47.141, 9.5215], schaan: [47.1655, 9.5096], triesen: [47.1069, 9.5277], balzers: [47.0665, 9.5025], eschen: [47.2112, 9.5223] },
  // The Netherlands (20. 11. 2026): the towns inside the local OSM pack of the sample (tools: osmium boxes of Amsterdam,
  // Haarlem, Utrecht, Rotterdam, The Hague, Leiden).
  NL: { amsterdam: [52.3727, 4.8933], rotterdam: [51.9225, 4.4792], denhaag: [52.0799, 4.3113], utrecht: [52.0907, 5.1214], haarlem: [52.3812, 4.637],
    leiden: [52.159, 4.49], delft: [52.0116, 4.3571], amstelveen: [52.3026, 4.8606], schiedam: [51.9192, 4.3994], diemen: [52.3394, 4.9626] },
};
if (process.argv[1] === new URL(import.meta.url).pathname) {
  let seed = 20261117;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (const [country, towns] of Object.entries(TOWNS)) for (const [town, [lat0, lon0]] of Object.entries(towns)) for (let i = 1; i <= 8; i++) {
    const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${country.toLowerCase()}-${town}-${i}`, country, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6),
      lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
  console.log(JSON.stringify(out));
}
