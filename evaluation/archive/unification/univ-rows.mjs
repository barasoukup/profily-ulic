// The rows of the universal measurement (evaluation/universal, data/app-<name>.json) from an A/B of the unification at the
// judged cuts: variant K of each cut whose parts changed between O and N (an empty profile left out), for
// score-states.mjs (a later collection of the same cut wins).
//   node evaluation/archive/unification/univ-rows.mjs results/univ-parkshare.json N app-zzzzzz-sjednoceni
import fs from "node:fs/promises";
import path from "node:path";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [file, K, name] = process.argv.slice(2);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8"));
const kinds = (p) => (p?.segments || []).map(([t, w]) => `${t} ${w}`).join(" · ");
const out = rows.filter((r) => r.O?.segments?.length && r.N?.segments?.length && kinds(r.O) !== kinds(r.N)).map((r) => {
  const c = r[K];
  return { id: r.id, country: c.country || r.place, lat: c.lat, lon: c.lon, bearing: c.bearing, wayId: c.wayId, name: c.name || "", span: c.span, sources: c.sources, note: c.note,
    parts: c.segments.map(([t, w]) => [t, w]), highway: r.highway };
});
await fs.writeFile(path.join(ROOT, "..", "..", "universal", "data", `${name}.json`), JSON.stringify(out));
console.log(out.length, "řezů");
