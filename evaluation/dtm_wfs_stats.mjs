// Sums of the A/B of the DTM from the regions' WFS against the map images of DMVS (variants/dtm-wfs.mjs):
// per city how many profiles are the same, the mean difference of the widths and the time of the surfaces.
//   node evaluation/dtm_wfs_stats.mjs budejovice pardubice hradec liberec
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PAIR = process.env.PAIR || "ab-city-dtm-wfs";
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const med = (a) => { const v = [...a].sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; };
for (const c of process.argv.slice(2)) {
  const dir = path.join(ROOT, c, "data", PAIR);
  const files = (await fs.readdir(dir)).filter((f) => /^\d+\.json$/.test(f));
  const rows = [];
  for (const f of files) {
    const j = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
    if (!j.a?.measures || !j.b?.measures) continue;
    const A = j.a.measures, B = j.b.measures;
    rows.push({
      same: A.kinds === B.kinds && A.edges.join() === B.edges.join(),
      dTotal: Math.abs(A.total - B.total), dRoad: Math.abs(A.roadway - B.roadway), dWalk: Math.abs(A.sidewalk - B.sidewalk),
      osmA: A.osmEstimate, osmB: B.osmEstimate, msA: j.a.surfacesMs, msB: j.b.surfacesMs, reqA: j.a.requests, reqB: j.b.requests,
    });
  }
  const r2 = (x) => x.toFixed(2);
  console.log(`${c}: ${rows.length} řezů, stejné části a okraje ${rows.filter((r) => r.same).length}, ` +
    `rozdíl šířek průměr celkem ${r2(mean(rows.map((r) => r.dTotal)))} m, vozovka ${r2(mean(rows.map((r) => r.dRoad)))} m, chodník ${r2(mean(rows.map((r) => r.dWalk)))} m; ` +
    `odhad z OSM A ${rows.filter((r) => r.osmA).length} / B ${rows.filter((r) => r.osmB).length}; ` +
    `dotazů A ${med(rows.map((r) => r.reqA))} / B ${med(rows.map((r) => r.reqB))} (medián)`);
}
