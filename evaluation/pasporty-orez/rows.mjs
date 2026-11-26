// The cuts of evaluation/ab.mjs (VARIANTS=pasport-bez-orezu,city, SAMPLES=…samples-orez.json) as rows for the blind
// judging (../facade-strip/baliky.mjs): O = without the trim (a), N = with it (b).
//   node evaluation/pasporty-orez/rows.mjs roznov slapanice > evaluation/pasporty-orez/vysledky/rezy.json
import fs from "node:fs";
import path from "node:path";
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const rows = [];
for (const city of process.argv.slice(2)) {
  const dir = path.join(ROOT, city, "data", `ab-pasport-bez-orezu-city${process.env.OLD ? "" : "-samples-orez"}`);
  for (const f of fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const one = (v) => v && !v.error && { name: j.cut.name, lat: j.cut.lat, lon: j.cut.lon, bearing: j.cut.bearing, span: v.extent && { left: +v.extent[1].toFixed(2), right: +(-v.extent[0]).toFixed(2) }, segments: (v.segments || []).map((s) => [s.type, s.width, s.source || ""]) };
    rows.push({ id: `${city}${process.env.OLD ? "-old" : ""}-${j.sample.n}`, place: city, highway: j.cut.highway, O: one(j.a), N: one(j.b) });
  }
}
console.log(JSON.stringify(rows, null, 1));
