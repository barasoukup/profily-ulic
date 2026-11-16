// The A/B sample of Vienna (Bára 16. 11. 2026): random points with a fixed seed within 2 km of Stephansplatz.
//   node evaluation/austria/ab/sample.mjs > evaluation/austria/ab/sample.json
let seed = 20261116;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [lat0, lon0] = [48.2085, 16.3731], out = [];
for (let i = 1; out.length < 40; i++) {
  const r = 2000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: i, town: "wien", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
}
console.log(JSON.stringify(out, null, 1));
