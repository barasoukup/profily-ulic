// The A/B sample of the official cadastral survey's land cover (Amtliche Vermessung via geodienste.ch, towns/switzerland.js;
// Bára 17. 11. 2026): random points with a fixed seed within 1.5 km of the centres of Swiss cities in cantons that
// share the survey and of Vaduz.
//   node evaluation/switzerland/ab/sample.mjs > evaluation/switzerland/ab/sample.json
let seed = 20261117;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = { zurich: [47.3769, 8.5417, 8], basel: [47.5596, 7.5886, 6], bern: [46.9480, 7.4474, 6], geneve: [46.2044, 6.1432, 6],
  lugano: [46.0037, 8.9511, 6], stgallen: [47.4245, 9.3767, 4], vaduz: [47.1410, 9.5215, 6] };
const out = [];
for (const [town, [lat0, lon0, n]] of Object.entries(TOWNS)) {
  for (let i = 1; i <= n; i++) {
    const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
