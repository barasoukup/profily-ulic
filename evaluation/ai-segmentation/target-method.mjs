// Another collection of the app's profiles at the target points (evaluation-ai-collect.js, e.g. with ?ai=1) as a method
// compare.py reads, on the cuts target-truth.mjs made (their truth unchanged): cuts/target/<method>.json.
//   node evaluation/ai-segmentation/target-method.mjs data/ai-seg/target/estimate-ai.json estimate-ai
// A point whose cut moved (another way, another bearing) is left out and counted.
import fs from "node:fs";

const DATA = "/Users/barasoukupova/streetdesign/data/ai-seg", dir = `${DATA}/cuts/target`;
const [file, method] = process.argv.slice(2);
const est = JSON.parse(fs.readFileSync(file, "utf8"));
const out = {}, stats = { cuts: 0, same: 0, moved: 0, missing: 0 };
for (const f of fs.readdirSync(dir).filter((x) => /^\d+\.json$/.test(x))) {
  const p = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
  stats.cuts++;
  const r = est[p.point];
  if (!r?.segs?.length) { stats.missing++; continue; }
  const c = r.cut;
  if (Math.abs(c.lat - p.cut.lat) > 1e-6 || Math.abs(c.lon - p.cut.lon) > 1e-6 || Math.abs(c.bearing - p.cut.bearing) > 0.5) { stats.moved++; continue; }
  const width = r.segs.reduce((a, x) => a + x[1], 0), span = c.span || { left: width / 2, right: width / 2 };
  const parts = [];
  let t = span.left;
  for (const [type, w] of r.segs) { parts.push({ type, s: +(t - w).toFixed(3), e: +t.toFixed(3) }); t -= w; }
  out[p.n] = { parts, extent: [t, span.left], town: r.town };
  stats.same++;
}
fs.writeFileSync(`${dir}/${method}.json`, JSON.stringify(out));
console.log(JSON.stringify(stats));
