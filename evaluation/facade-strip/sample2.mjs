// The second, larger sample of the A/B (the first, sample.json, changed only 4 of its first 88 cuts): new random points
// in Paris (within 4 km of the centre) and Helsinki (12 districts), none within 60 m of a point of sample.json or of an
// earlier A/B there. The page cuts each once with the strip on and keeps those where it joined a sidewalk (sber.js
// screenFacade); those are cut again without it.
//   node evaluation/facade-strip/sample2.mjs > evaluation/facade-strip/sample2.json
import fs from "node:fs";
let seed = 20261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const old = ["./sample.json", "../france/ab/sample.json", "../finland/ab2/sample.json", "../finland/ab3/sample.json"]
  .flatMap((f) => { try { return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8")); } catch { return []; } });
const near = (p) => old.some((q) => Math.hypot((p.lat - q.lat) * 110574, (p.lon - q.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180)) < 60);
const PLACES = [
  ["paris", [48.8566, 2.3422], 4000, 200],
  ...Object.entries({ keskusta: [60.168, 24.94], kallio: [60.184, 24.95], toolo: [60.181, 24.92], kamppi: [60.168, 24.928], ullanlinna: [60.159, 24.945], vallila: [60.195, 24.96],
    munkkiniemi: [60.198, 24.878], lauttasaari: [60.158, 24.875], kapyla: [60.215, 24.95], herttoniemi: [60.195, 25.035], malmi: [60.251, 25.011], pasila: [60.199, 24.933] })
    .map(([k, c]) => [`helsinki-${k}`, c, 600, 10]),
];
const out = [];
for (const [place, [lat0, lon0], R, n] of PLACES) {
  for (let i = 1, k = 0; k < n && i < 400; i++) {
    const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const p = { id: `s${place.replace("helsinki-", "h").slice(0, 6)}${i}`, group: "target", place, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) };
    if (!near(p)) { out.push(p); k++; }
  }
}
console.log(JSON.stringify(out, null, 1));
