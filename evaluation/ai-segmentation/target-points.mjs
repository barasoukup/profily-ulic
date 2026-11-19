// Points for the test in the target area (Fable's review, step 3): towns whose own map is NOT in the app's estimate
// (switched off: ?pasport=0, ?hrany=0, ?aachen=0) but serves as the truth: the passports of Bratislava, Prešov and
// Žilina (ZBGIS orthophoto) and Aachen's street database (DOP of North Rhine-Westphalia). Neither the model nor the
// estimate was tuned there. Random points in the dense town (the app snaps a click to the nearest street).
//   node evaluation/ai-segmentation/target-points.mjs 30  → data/ai-seg/target/points.json
import fs from "node:fs";
export const TOWNS = {
  bratislava: [17.08, 48.13, 17.16, 48.17], presov: [21.22, 48.98, 21.26, 49.01],
  zilina: [18.72, 49.2, 18.77, 49.235], aachen: [6.05, 50.75, 6.12, 50.79],
};
const per = Number(process.argv[2] || 30);
let s = 20261118;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pts = [];
for (const [town, b] of Object.entries(TOWNS)) for (let i = 0; i < per; i++)
  pts.push({ id: `${town}-${i}`, town, lat: +(b[1] + rand() * (b[3] - b[1])).toFixed(6), lon: +(b[0] + rand() * (b[2] - b[0])).toFixed(6) });
fs.writeFileSync("/Users/barasoukupova/streetdesign/data/ai-seg/target/points.json", JSON.stringify(pts));
console.log(pts.length, "points");
