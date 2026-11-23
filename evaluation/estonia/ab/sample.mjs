// The A/B sample of Tallinn's surface map (towns/estonia.js; Bára 23. 11. 2026): 40 random points with a fixed seed within
// 3 km of Tallinn's centre (inside the city and the local OSM pack).
//   node evaluation/estonia/ab/sample.mjs > evaluation/estonia/ab/sample.json
let seed = 20261126;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [59.4370, 24.7536];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 3000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `tl${i}`, town: "tallinn", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
