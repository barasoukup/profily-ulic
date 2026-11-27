// The check of ?axisroad=1 (ZPRAVA.md): two runs of the harness (without and with the switch), cut by cut, the profile
// (the parts' types and widths, the edges, the status line, the cut itself). Prints the changed cuts and a count by state.
//   node evaluation/axisroad-check/compare.mjs <run off> <run on> [sample file] [--json=<file>]
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname), OUT = path.join(HERE, "data", "out");
const args = process.argv.slice(2), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [A, B, S] = args.filter((a) => !a.startsWith("--"));
const sample = S ? JSON.parse(fs.readFileSync([path.join(HERE, `${S}.json`), path.join(HERE, "..", "replay", `${S}.json`)].find((f) => fs.existsSync(f)), "utf8")) : [];
const byId = new Map(sample.map((p) => [p.id, p]));
const ids = (run) => fs.readdirSync(path.join(OUT, run)).filter((f) => /^\d+\.json$/.test(f)).map((f) => +f.slice(0, -5)).sort((a, b) => a - b);
const read = (run, id) => JSON.parse(fs.readFileSync(path.join(OUT, run, `${id}.json`), "utf8"));
const parts = (o) => (o.stav?.segments || []).map((s) => `${s.type} ${(+s.width).toFixed(2)}`);
const view = (o) => JSON.stringify({ parts: parts(o), edges: o.stav?.edges && { l: o.stav.edges.left, r: o.stav.edges.right }, cut: o.cut && [o.cut.lat, o.cut.lon, o.cut.bearing, o.cut.wayId], status: o.status });
const countryOf = (id, o) => byId.get(id)?.country || o.city?.country || "?";
const stats = {}, changed = [];
for (const id of ids(A)) {
  const fb = path.join(OUT, B, `${id}.json`);
  if (!fs.existsSync(fb)) continue;
  const x = read(A, id), y = read(B, id), c = countryOf(id, x);
  const st = (stats[c] ||= { cuts: 0, profiles: 0, changed: 0 });
  st.cuts++;
  if (x.stav?.segments?.length) st.profiles++;
  if (view(x) === view(y)) continue;
  st.changed++;
  changed.push({ id, country: c, town: x.town || byId.get(id)?.town, src: byId.get(id)?.src, title: x.title, lat: x.cut?.lat ?? byId.get(id)?.lat, lon: x.cut?.lon ?? byId.get(id)?.lon, bearing: x.cut?.bearing, off: parts(x), on: parts(y), sameCut: JSON.stringify(x.cut) === JSON.stringify(y.cut), missesOn: (y.misses || []).length - (x.misses || []).length });
}
for (const c of changed) console.log(`— ${c.id} ${c.country} ${c.town} «${c.title}» ${c.lat},${c.lon} b${c.bearing}${c.sameCut ? "" : " (jiný řez)"}${c.missesOn ? ` misses ${c.missesOn > 0 ? "+" : ""}${c.missesOn}` : ""}\n   bez: ${c.off.join(" | ")}\n   s:   ${c.on.join(" | ")}`);
const tot = Object.values(stats).reduce((a, s) => ({ cuts: a.cuts + s.cuts, profiles: a.profiles + s.profiles, changed: a.changed + s.changed }), { cuts: 0, profiles: 0, changed: 0 });
console.log(`${A} → ${B}: ${tot.cuts} řezů, ${tot.profiles} s profilem, ${tot.changed} změněno · ` + Object.entries(stats).map(([c, s]) => `${c} ${s.cuts}/${s.profiles}/${s.changed}`).join(", "));
if (opt("json")) fs.writeFileSync(opt("json"), JSON.stringify({ A, B, stats, changed }, null, 1));
