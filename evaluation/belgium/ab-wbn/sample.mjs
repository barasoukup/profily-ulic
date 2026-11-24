// The A/B sample of Flanders' surfaces WBN + WGO (towns/belgium.js; Bára 24. 11. 2026): random points with a fixed
// seed within 1.5 km (1 km in the smaller towns) of the centres of Flemish towns of the local OSM pack, and controls
// in Brussels and Wallonia (no request there, the profile must not change). The local OSM pack holds the five large
// towns only (the smaller ones' cuts came out empty), so a second round adds points there (ids with "x").
//   node evaluation/belgium/ab-wbn/sample.mjs > evaluation/belgium/ab-wbn/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOWNS = {
  antwerpen: [51.2194, 4.4025, 8, 1500], gent: [51.0543, 3.7174, 8, 1500], brugge: [51.2093, 3.2247, 5, 1500], leuven: [50.8798, 4.7005, 5, 1500],
  mechelen: [51.0259, 4.4776, 4, 1500], aalst: [50.9378, 4.0403, 2, 1000], kortrijk: [50.8279, 3.2649, 2, 1000], hasselt: [50.9307, 5.3378, 2, 1000],
  sintniklaas: [51.1648, 4.1438, 2, 1000], turnhout: [51.3227, 4.9447, 2, 1000], oostende: [51.2289, 2.9196, 2, 1000],
  brussel: [50.8467, 4.3525, 2, 1500], liege: [50.6326, 5.5797, 2, 1500],
};
const out = [];
for (const [town, [lat0, lon0, n, R]] of Object.entries(TOWNS)) {
  for (let i = 1; i <= n; i++) {
    const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town === "brussel" ? "bx" : town.slice(0, 2)}${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
// The second round: 3 more points in each large town, 4 in Antwerp and Ghent (seed 20261125).
seed = 20261125;
for (const [town, n] of Object.entries({ antwerpen: 4, gent: 4, brugge: 3, leuven: 3, mechelen: 3 })) {
  const [lat0, lon0, , R] = TOWNS[town];
  for (let i = 1; i <= n; i++) {
    const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${town.slice(0, 2)}x${i}`, town, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
}
console.log(JSON.stringify(out, null, 1));
