// The threshold of "mostly green" for the stretch between a sidewalk (6 m from the kerb) and the house (ortho-osm.js
// GREEN_AREA): the mean green share of the image's columns there against MTVU (green 400–499 or not), on the true
// kerbs and facades of Prague's and Brno's cuts, ČÚZK 12.5 cm (the fallback's orthophoto) and the cities' 10 cm.
//   node evaluation/ortofoto-osm/zelen.mjs
import { cuts, truthOf, stripOf } from "./lib.mjs";
import { columns } from "../../pilot/public/ortho-osm.js";
for (const [city, keys] of [["praha", ["cuzk12", "ipr10"]], ["brno", ["cuzk12", "brno10"]]]) for (const key of keys) {
  const rows = [];
  for (const c of await cuts(city)) {
    const t = truthOf(c, 0);
    if (!t.way) continue;
    const st = await stripOf(city, key, c);
    if (!st) continue;
    const cols = columns(st);
    for (const [side, sg] of [["A", -1], ["B", 1]]) {
      const f = t.facade[side], kerb = side === "A" ? t.way.s : t.way.e;
      if (f === null) continue;
      // 1 m pieces from 6 m past the kerb to the house: the truth's code there, the image's green.
      for (let d = 6; d < Math.abs(f - kerb) - 0.5; d += 1) {
        const a = kerb + sg * d, b = a + sg, lo = Math.min(a, b), hi = Math.max(a, b);
        const run = c.a.runs.find((r) => r.s <= (lo + hi) / 2 && r.e >= (lo + hi) / 2);
        if (!run) continue;
        let g = 0, n = 0;
        for (let i = cols.ti(lo); i < cols.ti(hi); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) { g += cols.green[i]; n++; }
        if (n) rows.push({ green: run.code >= 400 && run.code < 500, share: g / n });
      }
    }
  }
  const best = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((th) => {
    const ok = rows.filter((r) => (r.share >= th) === r.green).length;
    const tp = rows.filter((r) => r.share >= th && r.green).length, said = rows.filter((r) => r.share >= th).length, real = rows.filter((r) => r.green).length;
    return `${th}: správně ${Math.round((100 * ok) / rows.length)} %, zeleň nalezena ${Math.round((100 * tp) / real)} %, z označených je zeleň ${Math.round((100 * tp) / (said || 1))} %`;
  });
  console.log(city, key, `${rows.length} m (zeleň ${rows.filter((r) => r.green).length})`, "\n  " + best.join("\n  "));
}
