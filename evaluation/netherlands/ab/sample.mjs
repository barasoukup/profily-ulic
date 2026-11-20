// The A/B sample of the BGT (towns/netherlands.js; Bára 20. 11. 2026): random points with a fixed seed within 1.5 km of
// the centres of the Dutch cities whose OSM the local pack has.
//   node evaluation/netherlands/ab/sample.mjs > evaluation/netherlands/ab/sample.json
let seed = 20261120;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = { amsterdam: [52.3727, 4.8933, 8], rotterdam: [51.9225, 4.4792, 7], denhaag: [52.0799, 4.3113, 7], utrecht: [52.0907, 5.1214, 7],
  haarlem: [52.3812, 4.6370, 4], leiden: [52.1590, 4.4900, 4] };
const out = [];
for (const [town, [lat0, lon0, n]] of Object.entries(TOWNS)) {
  for (let i = 1; i <= n; i++) {
    const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
