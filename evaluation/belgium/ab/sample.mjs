// The A/B sample of the regions' lines for the kerbs (towns/belgium.js; Bára 20. 11. 2026): random points with a fixed
// seed within 1.5 km of the centres of Flemish and Walloon cities of the local OSM pack (Brussels has no lines).
//   node evaluation/belgium/ab/sample.mjs > evaluation/belgium/ab/sample.json
let seed = 20261121;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = { antwerpen: [51.2194, 4.4025, 4], gent: [51.0543, 3.7174, 4], brugge: [51.2093, 3.2247, 4], leuven: [50.8798, 4.7005, 4], mechelen: [51.0259, 4.4776, 4],
  liege: [50.6326, 5.5797, 4], namur: [50.4674, 4.8720, 4], charleroi: [50.4108, 4.4446, 4], mons: [50.4542, 3.9523, 4] };
const out = [];
for (const [town, [lat0, lon0, n]] of Object.entries(TOWNS)) {
  for (let i = 1; i <= n; i++) {
    const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
