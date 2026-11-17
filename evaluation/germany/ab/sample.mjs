// The A/B sample of the German cities' street surface maps (Bára 17. 11. 2026): random points with a fixed seed within
// 2 km of the centres of Berlin, Hamburg and Aachen (towns/germany.js DE_TOWNS).
//   node evaluation/germany/ab/sample.mjs > evaluation/germany/ab/sample.json
let seed = 20261117;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = { berlin: [52.52, 13.405, 20], hamburg: [53.5503, 9.9925, 30], aachen: [50.7762, 6.0839, 20] };
const out = [];
for (const [town, [lat0, lon0, n]] of Object.entries(TOWNS)) {
  for (let i = 1; i <= n; i++) {
    const r = 2000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
