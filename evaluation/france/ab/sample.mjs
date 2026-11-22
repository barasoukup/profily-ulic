// The A/B sample of Paris's Plan de voirie (towns/france.js; Bára 22. 11. 2026): 40 random points with a fixed seed
// within 4 km of Paris's centre (inside the city).
//   node evaluation/france/ab/sample.mjs > evaluation/france/ab/sample.json
let seed = 20261123;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [48.8566, 2.3422];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 4000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `pa${i}`, town: "paris", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
