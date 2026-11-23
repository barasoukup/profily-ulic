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
  // Belgium and Luxembourg (20. 11. 2026): Belgium's towns of the local OSM pack, all of Luxembourg's pack.
  BE: { bruxelles: [50.8467, 4.3525], antwerpen: [51.2194, 4.4025], gent: [51.0543, 3.7174], liege: [50.6326, 5.5797], brugge: [51.2093, 3.2247],
    leuven: [50.8798, 4.7005], namur: [50.4674, 4.872], charleroi: [50.4108, 4.4446], mons: [50.4542, 3.9523], mechelen: [51.0259, 4.4776] },
  LU: { luxembourg: [49.6116, 6.1319], esch: [49.4958, 5.9806], differdange: [49.5242, 5.8914], dudelange: [49.4806, 6.0875], ettelbruck: [49.8475, 6.1044],
    diekirch: [49.8686, 6.1594], wiltz: [49.9661, 5.9325], echternach: [49.8117, 6.4214], remich: [49.5447, 6.3667], grevenmacher: [49.6797, 6.4417] },
  // Poland (21. 11. 2026): the towns of the local OSM pack.
  PL: { warszawa: [52.2297, 21.0122], krakow: [50.0614, 19.9383], wroclaw: [51.1099, 17.0326], gdansk: [54.3520, 18.6466], poznan: [52.4064, 16.9252],
    lodz: [51.7592, 19.4560], katowice: [50.2649, 19.0238], lublin: [51.2465, 22.5684], szczecin: [53.4285, 14.5528], bydgoszcz: [53.1235, 18.0084] },
  // France (22. 11. 2026): the towns of the local OSM pack.
  FR: { paris: [48.857, 2.352], lyon: [45.764, 4.836], marseille: [43.297, 5.370], toulouse: [43.605, 1.444], nice: [43.710, 7.262],
    nantes: [47.218, -1.554], strasbourg: [48.573, 7.752], montpellier: [43.611, 3.877], bordeaux: [44.838, -0.579], lille: [50.629, 3.057] },
  // Spain (23. 11. 2026): the towns of the local OSM pack.
  ES: { madrid: [40.425, -3.700], barcelona: [41.390, 2.165], valencia: [39.470, -0.375], sevilla: [37.390, -5.990], malaga: [36.720, -4.425],
    zaragoza: [41.650, -0.890], bilbao: [43.262, -2.935], valladolid: [41.650, -4.725], coruna: [43.365, -8.410], palma: [39.572, 2.650] },
  // Portugal (23. 11. 2026): the towns of the local OSM pack.
  PT: { lisboa: [38.722, -9.142], porto: [41.152, -8.612], braga: [41.550, -8.425], coimbra: [40.208, -8.425], aveiro: [40.640, -8.650],
    faro: [37.016, -7.933], funchal: [32.648, -16.910], setubal: [38.525, -8.890], evora: [38.571, -7.908], viseu: [40.657, -7.912] },
  // Monaco (23. 11. 2026): the one town, its points within the 1.5 km of the sample (some fall in France or the sea).
  MC: { monaco: [43.738, 7.424] },
  // Cyprus (23. 11. 2026): the towns of the local OSM pack (the south: the DLS orthophoto has only it).
  // Malta (23. 11. 2026): the whole island in the local OSM pack.
  // Italy (23. 11. 2026): the four areas with an open orthophoto.
  IT: { bologna: [44.494, 11.343], modena: [44.647, 10.925], torino: [45.070, 7.687], bolzano: [46.498, 11.355] },
  MT: { valletta: [35.897, 14.512], sliema: [35.912, 14.502], birkirkara: [35.896, 14.465], qormi: [35.876, 14.472], mosta: [35.909, 14.426], victoria: [36.044, 14.240] },
  CY: { nicosia: [35.170, 33.365], limassol: [34.680, 33.045], larnaca: [34.915, 33.630], paphos: [34.770, 32.425], ayianapa: [34.985, 33.995] },
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
