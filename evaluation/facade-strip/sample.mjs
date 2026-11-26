// The A/B of the strip at the facade (ortho-osm.js besidePassport facadeStrip; Bára 26. 11. 2026): new random points
// with a fixed seed, none within 60 m of a point of an earlier A/B there: Paris (within 4 km of the centre) and Helsinki
// (the centre and 10 suburbs), where the strip was seen, and controls in other towns whose surface map is a passport
// (Tallinn, Vilnius, Bratislava, Amsterdam, Berlin).
//   node evaluation/facade-strip/sample.mjs > evaluation/facade-strip/sample.json
import fs from "node:fs";
let seed = 20261126;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const old = ["../france/ab/sample.json", "../finland/ab2/sample.json", "../finland/ab3/sample.json", "../estonia/ab/sample2.json"]
  .flatMap((f) => { try { return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8")); } catch { return []; } });
const near = (p) => old.some((q) => Math.hypot((p.lat - q.lat) * 110574, (p.lon - q.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180)) < 60);
const PLACES = [
  ["paris", "target", [48.8566, 2.3422], 4000, 40],
  ...Object.entries({ keskusta: [60.168, 24.94], kallio: [60.184, 24.95], toolo: [60.181, 24.92], munkkiniemi: [60.198, 24.878], lauttasaari: [60.158, 24.875],
    kapyla: [60.215, 24.95], herttoniemi: [60.195, 25.035], malmi: [60.251, 25.011], oulunkyla: [60.229, 24.966], vuosaari: [60.209, 25.143] })
    .map(([k, c]) => [`helsinki-${k}`, "target", c, 700, 4]),
  ["tallinn", "control", [59.437, 24.745], 2500, 8], ["vilnius", "control", [54.687, 25.28], 2500, 8], ["bratislava", "control", [48.145, 17.11], 2500, 8],
  ["amsterdam", "control", [52.372, 4.895], 2500, 8], ["berlin", "control", [52.515, 13.4], 4000, 8],
];
const out = [];
for (const [place, group, [lat0, lon0], R, n] of PLACES) {
  for (let i = 1, k = 0; k < n && i < 100; i++) {
    const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    const p = { id: `${place.replace("helsinki-", "h").slice(0, 6)}${i}`, group, place, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) };
    if (!near(p)) { out.push(p); k++; }
  }
}
console.log(JSON.stringify(out, null, 1));
