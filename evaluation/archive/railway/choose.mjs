// Chooses the cuts for the railway measurement from the scan (cand-<ISO>.json): the candidates (a street with a track along
// it 5–20 m off for at least 40 m), stratified by state, at most PER_TOWN a town and one a street name, in a fixed order
// (seeded); the controls the same way. Writes cuts-prep.json: the rows prepare.mjs reads (photos looked for first).
//   node evaluation/archive/railway/choose.mjs <data dir> <out.json>
import fs from "node:fs";
const [dir, out] = process.argv.slice(2);
const N = { AT: 28, CH: 24, DE: 28, CZ: 20, SK: 12, PL: 8 }, NC = { AT: 14, CH: 12, DE: 14, CZ: 12, SK: 8, PL: 6 };
let seed = 271127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (list, n, perTown) => {
  const seen = new Set(), towns = {}, res = [];
  for (const c of shuffle([...list])) {
    const key = `${c.town}|${c.name}`;
    if (seen.has(key) || (towns[c.town] || 0) >= perTown) continue;
    seen.add(key); towns[c.town] = (towns[c.town] || 0) + 1; res.push(c);
    if (res.length >= n) break;
  }
  return res;
};
const rows = [];
for (const iso of Object.keys(N)) {
  const d = JSON.parse(fs.readFileSync(`${dir}/cand-${iso}.json`, "utf8"));
  const cand = d.cand.filter((c) => c.dist >= 5 && c.dist <= 20 && c.run >= 40 && c.rw !== "subway");
  for (const c of pick(cand, N[iso], 4)) rows.push({ ...c, kind: "target" });
  for (const c of pick(d.control, NC[iso], 3)) rows.push({ ...c, kind: "control" });
}
fs.writeFileSync(out, JSON.stringify(rows.map((r) => ({ ...r, id: r.id.replace(/[^A-Za-z0-9_-]/g, "_"), half: 35, photos: true, needPhoto: true }))));
console.log(rows.filter((r) => r.kind === "target").length, "targets", rows.filter((r) => r.kind === "control").length, "controls");
