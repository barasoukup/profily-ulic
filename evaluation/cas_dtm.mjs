// Time of a click's surfaces from the national DTM: the map images of DMVS (dmvs.js) against the region's WFS
// (dtmwfs.js), as the browser asks them (parallel requests, no throttle, no cache), RÚIAN left out (the same in
// both). A few cuts per city, one at a time with a pause, the two ways in turn.
//   node evaluation/cas_dtm.mjs pardubice hradec liberec budejovice   (N=6 cuts per city)
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const { surfaces } = await import("../pilot/public/dmvs.js");
const { MTVU_LABELS } = await import("../pilot/public/city.js");
const N = Number(process.env.N || 6), HALF = 40, PAD = 0.0004;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
for (const c of process.argv.slice(2)) {
  const { samples } = JSON.parse(await fs.readFile(path.join(ROOT, c, "data", "samples.json"), "utf8"));
  const pick = samples.filter((_, i) => i % Math.max(1, Math.floor(samples.length / N)) === 0).slice(0, N);
  for (const s of pick) {
    const kx = 111320 * Math.cos((s.lat * Math.PI) / 180), ky = 110574;
    const bbox = [s.lon - HALF / kx - PAD, s.lat - HALF / ky - PAD, s.lon + HALF / kx + PAD, s.lat + HALF / ky + PAD].join(",");
    const row = { city: c, n: s.n };
    for (const wfs of [false, true]) {
      const t = performance.now();
      try {
        const r = await surfaces(bbox, MTVU_LABELS, { wfs, ruian: false });
        row[wfs ? "wfs" : "img"] = Math.round(performance.now() - t);
        row[wfs ? "wfsN" : "imgN"] = r.features.length;
        row[wfs ? "wfsReq" : "imgReq"] = r.requests;
        if (wfs) row.via = r.wfs ? "wfs" : "obrázky";
      } catch (err) { row[wfs ? "wfs" : "img"] = `chyba ${err.message}`; }
      await wait(1500);
    }
    console.log(JSON.stringify(row));
    rows.push(row);
  }
}
const med = (a) => { const v = a.filter((x) => typeof x === "number").sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
for (const c of [...new Set(rows.map((r) => r.city)), null]) {
  const rs = rows.filter((r) => !c || r.city === c);
  console.log(`${c || "celkem"}: obrázky medián ${med(rs.map((r) => r.img))} ms (${med(rs.map((r) => r.imgReq))} dotazů), WFS medián ${med(rs.map((r) => r.wfs))} ms (${med(rs.map((r) => r.wfsReq))} dotaz)`);
}
