// Features of the strips at the estimate's kerbs against MTVU's parking: what tells parked cars from shadows and trees?
import { cuts, truthOf, osmAround, stripOf, PARKING } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/evaluation/ortofoto-osm/lib.mjs";
import { orthoOsmPolys, P } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/app/public/ortho-osm.js";
import { localFrame } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/app/public/derive.js";
import fs from "node:fs";

function pieces(st, a, b) {
  // per 1 m along the street: mean L, mean saturation, green share, share of very bright / very dark pixels
  const i0 = Math.max(0, Math.round((Math.min(a, b) - st.t0) / st.res)), i1 = Math.min(st.nt - 1, Math.round((Math.max(a, b) - st.t0) / st.res));
  const per = Math.max(1, Math.round(1 / st.res)), out = [];
  for (let j0 = 0; j0 + per <= st.nu; j0 += per) {
    let L = 0, S = 0, g = 0, n = 0, br = 0, dk = 0;
    for (let j = j0; j < j0 + per; j++) for (let i = i0; i <= i1; i++) {
      const q = j * st.nt + i, v = st.L[q];
      if (Number.isNaN(v)) continue;
      n++; L += v; S += st.S[q]; if (st.G[q] >= 10) g++; if (v > 170) br++; if (v < 50) dk++;
    }
    if (n) out.push({ L: L / n, S: S / n, g: g / n, br: br / n, dk: dk / n });
  }
  return out;
}
const sd = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
function feats(st, a, b) {
  const p = pieces(st, a, b);
  if (p.length < 10) return null;
  const L = p.map((x) => x.L);
  // autocorrelation of L at 4–6 m lag (car length)
  const m = mean(L), v = L.reduce((x, y) => x + (y - m) ** 2, 0) || 1;
  const ac = (lag) => L.slice(lag).reduce((x, y, i) => x + (y - m) * (L[i] - m), 0) / v;
  // number of sign changes of L around the mean (cars and gaps)
  let cross = 0; for (let i = 1; i < L.length; i++) if ((L[i] - m) * (L[i - 1] - m) < 0) cross++;
  return { sd: sd(L), mean: m, sat: mean(p.map((x) => x.S)), satSd: sd(p.map((x) => x.S)), green: mean(p.map((x) => x.g)), bright: mean(p.map((x) => x.br)), dark: mean(p.map((x) => x.dk)), ac5: Math.max(ac(4), ac(5), ac(6)), cross: cross / L.length };
}

const rows = [];
for (const city of ["praha", "brno"]) {
  for (const c of await cuts(city)) {
    const st = await stripOf(city, "cuzk12", c);
    if (!st) continue;
    const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
    const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
    const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
    if (!way) continue;
    P.cars = false;
    const polys = orthoOsmPolys({ osm, frame, dir, way, st });
    const truth = truthOf(c, 0);
    if (!polys || !truth.way) continue;
    const k = polys.kerbs, road = feats(st, -0.8, 0.8);
    if (!road) continue;
    for (const [side, sg] of [["A", -1], ["B", 1]]) {
      const kb = k[side];
      // truth: a parking run of MTVU within 2.5 m of the estimate's kerb on either side
      const runs = c.a.runs.filter((r) => PARKING(r) && r.e - r.s >= 1.5);
      const tin = runs.some((r) => r.s < Math.max(kb, kb - sg * 2) && r.e > Math.min(kb, kb - sg * 2) && Math.min(r.e, Math.max(kb, kb - sg * 2)) - Math.max(r.s, Math.min(kb, kb - sg * 2)) > 1);
      const tout = runs.some((r) => r.s < Math.max(kb, kb + sg * 2) && r.e > Math.min(kb, kb + sg * 2) && Math.min(r.e, Math.max(kb, kb + sg * 2)) - Math.max(r.s, Math.min(kb, kb + sg * 2)) > 1);
      const fin = feats(st, kb - sg * 2, kb), fout = feats(st, kb, kb + sg * 2);
      // the map profile's parking from city data (TSK, Brno's map, DTM, OSM; not the law estimate), laid along t
      let tt = c.a.extent[1]; const segs = c.a.segments.map((x) => { const r = { ...x, s: tt - x.width, e: tt }; tt -= x.width; return r; });
      const dp = segs.filter((x) => x.type === "parkovani" && x.source !== "odhad");
      const near = (lo, hi) => dp.some((r) => Math.min(r.e, hi) - Math.max(r.s, lo) > 1);
      const din = near(Math.min(kb, kb - sg * 2), Math.max(kb, kb - sg * 2)), dout = near(Math.min(kb, kb + sg * 2), Math.max(kb, kb + sg * 2));
      const tags = way.tags;
      const osmPark = tags[`parking:${sg < 0 ? "left" : "right"}`] || tags["parking:both"] || tags[`parking:lane:${sg < 0 ? "left" : "right"}`] || tags["parking:lane:both"] || "";
      for (const [where, f, label, label2] of [["in", fin, tin, din], ["out", fout, tout, dout]]) if (f) rows.push({ city, n: c.n, name: c.cut.name, side, where, hw: tags.highway, osmPark, label, label2: label || label2, zps: c.inZps, ...Object.fromEntries(Object.entries(f).map(([q, x]) => [q, +x.toFixed(3)])), roadSd: +road.sd.toFixed(2), roadMean: +road.mean.toFixed(1) });
    }
  }
}
fs.writeFileSync("/private/tmp/claude-501/-Users-barasoukupova-streetdesign/5069a7d2-4c81-463c-984f-c185f360f063/scratchpad/cars.json", JSON.stringify(rows));
console.log(rows.length, rows.filter((r) => r.label).length);
