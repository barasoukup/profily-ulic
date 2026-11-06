// Automatic checks over evaluation/data/results/*.json: compares each derived profile with
// the OSM tags of its street and flags suspicious widths.
// Usage: node evaluation/analyze.mjs  → evaluation/data/checks.json + a summary on stdout
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIR = path.join(ROOT, "data", "results");
const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".json")).sort((a, b) => parseInt(a) - parseInt(b));

const LANE = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"]);
const BIKE = new Set(["cyklopruh", "ochranny_pruh", "cyklostezka", "bus_cyklo", "pruh_piktokoridor"]);
const yes = (v) => v && !["no", "none", "separate"].includes(v);

const out = [];
const count = {};
const bump = (k) => (count[k] = (count[k] || 0) + 1);
for (const f of files) {
  const r = JSON.parse(await fs.readFile(path.join(DIR, f), "utf8"));
  const s = r.sample;
  const flags = [];
  if (r.error) { out.push({ n: s.n, flags: ["chyba: " + r.error.split("\n")[0]] }); bump("chyba"); continue; }
  const t = r.cut.tags || {};
  const segs = r.segments;
  const total = segs.reduce((a, x) => a + x.width, 0);
  const lanes = segs.filter((x) => LANE.has(x.type));
  const roadWidth = lanes.reduce((a, x) => a + x.width, 0);
  if (String(r.cut.wayId) !== String(s.wayId)) flags.push(`řez přichytil jinou ulici (${r.cut.name || r.cut.highway})`);
  if (!r.mtvuCount) flags.push("mimo MTVU (jen odhad)");
  if (r.junction) flags.push("křižovatka");
  const odhad = segs.filter((x) => x.source === "odhad").reduce((a, x) => a + x.width, 0);
  if (odhad > 0.5) flags.push(`odhad ${odhad.toFixed(1)} m`);
  if (segs.some((x) => x.type === "nezname")) flags.push("neurčená plocha");
  // Lane widths.
  for (const x of lanes) {
    if (x.type === "pruh" && x.width > 4.6) flags.push(`široký pruh ${x.width}`);
    if (x.type === "pruh" && x.width < 2.5) flags.push(`úzký pruh ${x.width}`);
  }
  // Lane count vs OSM lanes tag (own carriageway only roughly: all lanes in the profile).
  const tagLanes = parseInt(t.lanes, 10);
  const carLanes = lanes.filter((x) => x.type !== "tramvaj_v_pruhu" || true).length;
  if (tagLanes && r.cut.highway !== "service" && carLanes < tagLanes) flags.push(`méně pruhů (${carLanes}) než lanes=${tagLanes}`);
  // Sidewalks: tag says there is one but the profile has none.
  const sw = t.sidewalk || t["sidewalk:both"] || [t["sidewalk:left"], t["sidewalk:right"]].filter(Boolean).join("+");
  const hasWalk = segs.some((x) => x.type === "chodnik" || x.type === "nastupiste");
  if (sw && /both|left|right|yes/.test(sw) && !hasWalk) flags.push(`OSM chodník (${sw}), v profilu není`);
  for (const x of segs) if (x.type === "chodnik" && x.width < 1.2) flags.push(`úzký chodník ${x.width}`);
  // Parking tags vs parking strips.
  const park = Object.entries(t).filter(([k, v]) => /^parking:(both|left|right|lane)/.test(k) && !k.includes(":") === false && /^(lane|street_side|on_kerb|half_on_kerb|yes|parallel|diagonal|perpendicular)$/.test(v));
  const hasPark = segs.some((x) => x.type === "parkovani");
  if (park.length && !hasPark) flags.push("OSM parkování, v profilu není");
  // Cycling infrastructure.
  const cyc = Object.entries(t).filter(([k, v]) => /^cycleway(:both|:left|:right)?$/.test(k) && /lane|track|share_busway|shared_lane/.test(v));
  if (cyc.length && !segs.some((x) => BIKE.has(x.type))) flags.push("OSM cyklo, v profilu není");
  // Tram.
  if (segs.some((x) => x.type.startsWith("tramvaj")) === false && (r.mtvuCodes || []).includes(705)) flags.push("MTVU tram těleso nezobrazeno");
  // Width sanity.
  if (total < 4) flags.push(`celkem jen ${total.toFixed(1)} m`);
  if (r.edges.left === "volno" && r.edges.right === "volno") flags.push("bez okrajů (oba volno)");
  for (const k of flags) bump(k.replace(/[\d.]+/g, "#").replace(/\(.*\)/, "(…)"));
  out.push({ n: s.n, highway: s.highway, name: r.cut.name, total: +total.toFixed(2), road: +roadWidth.toFixed(2), segs: segs.map((x) => `${x.type}${x.dir ? (x.dir === "forward" ? "↑" : "↓") : ""}:${x.width}`).join(" | "), edges: `${r.edges.left}/${r.edges.right}`, flags });
}
await fs.writeFile(path.join(ROOT, "data", "checks.json"), JSON.stringify(out, null, 1));
for (const o of out) console.log(`#${o.n} ${o.highway} ${o.name} [${o.total} m, ${o.edges}] ${o.segs}\n    ${o.flags.join("; ")}`);
console.log("\nČetnost:", Object.entries(count).sort((a, b) => b[1] - a[1]));
