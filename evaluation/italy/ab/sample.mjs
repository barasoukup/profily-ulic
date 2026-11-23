// The A/B sample of Bologna's road areas (towns/italy.js; Bára 23. 11. 2026): 40 random points with a fixed seed within
// 2 km of Bologna's centre (inside the municipality and the local OSM pack).
//   node evaluation/italy/ab/sample.mjs > evaluation/italy/ab/sample.json
let seed = 20261125;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [44.4938, 11.3426];
const out = [];
for (let i = 1; i <= 40; i++) {
  const r = 2000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: `bo${i}`, town: "bologna", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
