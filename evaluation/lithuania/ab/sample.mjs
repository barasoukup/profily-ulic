// The A/B sample of Vilnius's topographic areas (towns/lithuania.js; Bára 24. 11. 2026): 40 random points with a fixed
// seed within 3 km of Vilnius's centre (inside the city and the local OSM pack).
//   node evaluation/lithuania/ab/sample.mjs > evaluation/lithuania/ab/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [54.6872, 25.2797];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 3000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `vl${i}`, town: "vilnius", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
