// The A/B sample of Zaragoza's paving map (towns/spain.js; Bára 23. 11. 2026): 40 random points with a fixed seed
// within 2.5 km of Zaragoza's centre (inside the local OSM pack's box).
//   node evaluation/spain/ab/sample.mjs > evaluation/spain/ab/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [41.6505, -0.8855];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 2500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `zg${i}`, town: "zaragoza", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
