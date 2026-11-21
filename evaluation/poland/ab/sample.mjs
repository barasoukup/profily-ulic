// The A/B sample of Kraków's base map (towns/poland.js; Bára 21. 11. 2026): 36 random points with a fixed seed within
// 2.5 km of Kraków's centre.
//   node evaluation/poland/ab/sample.mjs > evaluation/poland/ab/sample.json
let seed = 20261122;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [50.0614, 19.9383];
const out = [];
for (let i = 1; i <= 36; i++) {
  const r = 2500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `kr${i}`, town: "krakow", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
