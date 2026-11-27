// The cuts of the blind A/B (seeded, before anything is run in the app): from the candidate cuts that have a street-level photo and
// an orthophoto, AT 7, DE 7, CH 5, CZ 4, SK 4, PL 3; the controls (no railway or tram within 100 m): up to 40, photo or not.
// Writes the points for the app (app/public/zz-rail.json, not kept in git) and judge/ (neutral names j01…, copies of the
// orthophoto and the photos) with judge/map.json (judge id → real id).
//   node evaluation/railway/select.mjs <cuts-prep.json>
import fs from "node:fs";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "..", "universal", "data");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const has = (r) => fs.existsSync(`${DATA}/${r.id}-ortho.jpg`) && (fs.existsSync(`${DATA}/${r.id}-f.jpg`) || fs.existsSync(`${DATA}/${r.id}-b.jpg`));
let seed = 27112026;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const N = { AT: 7, DE: 7, CH: 5, CZ: 4, SK: 4, PL: 3 };
const targets = Object.entries(N).flatMap(([c, n]) => shuffle(rows.filter((r) => r.kind === "target" && r.country === c && has(r))).slice(0, n));
const controls = shuffle(rows.filter((r) => r.kind === "control")).slice(0, 40);
fs.writeFileSync(path.join(ROOT, "..", "..", "app", "public", "zz-rail.json"), JSON.stringify([...targets, ...controls]));
fs.writeFileSync(path.join(ROOT, "selected.json"), JSON.stringify({ targets, controls }, null, 1));
const J = path.join(ROOT, "judge");
fs.rmSync(J, { recursive: true, force: true });
fs.mkdirSync(path.join(J, "data"), { recursive: true });
const map = {};
shuffle([...targets]).forEach((r, i) => {
  const j = `j${String(i + 1).padStart(2, "0")}`;
  map[j] = r.id;
  for (const suf of ["-ortho.jpg", "-f.jpg", "-b.jpg"]) if (fs.existsSync(`${DATA}/${r.id}${suf}`)) fs.copyFileSync(`${DATA}/${r.id}${suf}`, path.join(J, "data", `${j}${suf}`));
  fs.copyFileSync(`${DATA}/${r.id}.txt`, path.join(J, "data", `${j}.txt`));
});
fs.writeFileSync(path.join(J, "map.json"), JSON.stringify(map, null, 1));
console.log(targets.length, "targets", controls.length, "controls");
