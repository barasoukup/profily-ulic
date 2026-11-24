// The A/B sample of Copenhagen's kerb lines (k101:vejkant, ?kbhkant) and parking areas (k101:parking_areal, ?kbhpark)
// (towns/denmark.js; Bára 24. 11. 2026): 36 random points with a fixed seed within 3 km of Copenhagen's centre
// (Rådhuspladsen; Frederiksberg inside it has no data of the city's WFS: a control) and 4 in Aarhus (a control: the
// switches must change nothing there); then 36 more in Copenhagen (ko37–ko72: the first round used the kerb lines in 8 cuts only).
//   node evaluation/denmark/ab/sample.mjs > evaluation/denmark/ab/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = [["kobenhavn", 55.6761, 12.5683, 36, 3000, 1], ["aarhus", 56.1567, 10.2108, 4, 1500, 1], ["kobenhavn", 55.6761, 12.5683, 36, 3000, 37]];
const out = [];
for (const [town, lat0, lon0, n, R, first] of TOWNS) {
  for (let i = first; i < first + n; i++) {
    const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
