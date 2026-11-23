// The A/B sample of Helsinki's register of public areas YLRE (towns/finland.js; Bára 23. 11. 2026): 40 random points with
// a fixed seed within 3 km of a point 1 km north of Helsinki's centre (Töölönlahti: less sea; inside the city and the local OSM pack).
//   node evaluation/finland/ab/sample.mjs > evaluation/finland/ab/sample.json
let seed = 20261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [60.1800, 24.9450];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 3000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `hk${i}`, town: "helsinki", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
