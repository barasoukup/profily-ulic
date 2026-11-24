// The third A/B of Helsinki's register YLRE (Bára 24. 11. 2026): the filling around the map (app.js mapFill) on a NEW
// sample, since ab2's was used to tune it. Candidates with a new seed within 600 m of the centres of 20 suburbs (16 each,
// none within 60 m of an ab2 point); the page (sber.js pickResidential) keeps those within 20 m of an OSM
// highway=residential way, at most 2 a suburb, snapped onto the way, and the first 32 in this order.
//   node evaluation/finland/ab3/sample.mjs > evaluation/finland/ab3/kandidati.json
import fs from "node:fs";
let seed = 20261125;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const SUBURBS = { vuosaari: [60.209, 25.143], malmi: [60.251, 25.011], kontula: [60.236, 25.083], herttoniemi: [60.195, 25.035], munkkiniemi: [60.198, 24.878],
  kannelmaki: [60.24, 24.88], oulunkyla: [60.229, 24.966], pihlajamaki: [60.24, 25.01], lauttasaari: [60.158, 24.875], kapyla: [60.215, 24.95],
  haaga: [60.222, 24.9], pukinmaki: [60.245, 24.99], mellunmaki: [60.238, 25.11], maunula: [60.232, 24.925], pakila: [60.246, 24.945],
  laajasalo: [60.172, 25.05], konala: [60.236, 24.85], tapanila: [60.263, 25.03], puistola: [60.272, 25.035], vartiokyla: [60.22, 25.09] };
const ab2 = JSON.parse(fs.readFileSync(new URL("../ab2/sample.json", import.meta.url), "utf8"));
const near = (p) => ab2.some((q) => Math.hypot((p.lat - q.lat) * 110574, (p.lon - q.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180)) < 60);
const out = [];
for (const [place, [lat0, lon0]] of Object.entries(SUBURBS)) {
  for (let i = 1; i <= 16; i++) {
    const r = 600 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const p = { id: `n${place.slice(0, 4)}${i}`, group: "suburb", place, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) };
    if (!near(p)) out.push(p);
  }
}
console.log(JSON.stringify(out, null, 1));
