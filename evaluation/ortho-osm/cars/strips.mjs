// The ortho band ±3.5 m about the estimate's kerb, per side, where the loose car rule fires (local streets): rgb dumps
import { cuts, osmAround, stripOf } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/evaluation/ortofoto-osm/lib.mjs";
import { orthoOsmPolys, P } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/app/public/ortho-osm.js";
import { localFrame } from "/Users/barasoukupova/streetdesign/.claude/worktrees/ai-segmentation/app/public/derive.js";
import fs from "node:fs";
const S = "/private/tmp/claude-501/-Users-barasoukupova-streetdesign/5069a7d2-4c81-463c-984f-c185f360f063/scratchpad";
const rows = JSON.parse(fs.readFileSync(`${S}/cars.json`, "utf8"));
const LOCAL = new Set(["residential", "living_street", "service", "unclassified", "tertiary"]);
const want = new Set(rows.filter((r) => LOCAL.has(r.hw) && r.satSd >= 5 && r.sd >= 14 && r.green <= 0.3).map((r) => `${r.city}|${r.n}|${r.side}`));
const out = [];
for (const city of ["praha", "brno"]) for (const c of await cuts(city)) {
  if (![..."AB"].some((s) => want.has(`${city}|${c.n}|${s}`))) continue;
  const st = await stripOf(city, "cuzk12", c);
  const osm = { elements: await osmAround(c.cut.lat, c.cut.lon, 70) };
  const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
  const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
  P.cars = false;
  const polys = orthoOsmPolys({ osm, frame, dir, way, st });
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (!want.has(`${city}|${c.n}|${side}`)) continue;
    const kb = polys.kerbs[side];
    // columns from the roadway side (kb - sg*3.5) to the outside (kb + sg*3.5)
    const cols = [];
    for (let x = -3.5; x <= 3.5; x += st.res) cols.push(Math.round((kb + sg * x - st.t0) / st.res));
    const px = [];
    for (let j = 0; j < st.nu; j++) for (const i of cols) { const q = j * st.nt + i; px.push(i < 0 || i >= st.nt ? 0 : st.rgb[q * 3], i < 0 || i >= st.nt ? 0 : st.rgb[q * 3 + 1], i < 0 || i >= st.nt ? 0 : st.rgb[q * 3 + 2]); }
    out.push({ id: `${city}|${c.n}|${side}`, name: c.cut.name, w: cols.length, h: st.nu, px });
  }
}
fs.writeFileSync(`${S}/bands.json`, JSON.stringify(out));
console.log(out.length);
