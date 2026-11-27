// What a packed OSM file is made of (evaluation/osm-r2/slim): its gzip bytes shared out to kinds of elements (by the
// share of each element in its tile's packed JSON), and within them to the tags (by key) and the geometry.
//   node evaluation/osm-r2/slim/composition.mjs pilot/data/osm-pack/cz-novy.posm [--keys] [--json out.json]
import fs from "node:fs";
import { tilesOf } from "./posm.mjs";

const [file] = process.argv.slice(2);
const KEYS = process.argv.includes("--keys");
const jsonOut = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;

// The kind of an element: what the build put it in for (tools/build_osm_tiles.mjs, build_osm_data.sh).
export function kindOf(el) {
  const k = el.k;
  if (el.t === "a") {
    if (k.building !== undefined) return (k["building:levels"] !== undefined || k.height !== undefined || k["roof:levels"] !== undefined) ? "area building with levels/height" : "area building without";
    if (k["area:highway"] !== undefined) return "area area:highway";
    if (k.amenity === "parking") return "area parking";
    if (k.public_transport === "platform" || k.railway === "platform" || k.highway === "platform") return "area platform";
    if (k.leisure === "outdoor_seating") return "area outdoor_seating";
    if (k.natural === "water" || k.water !== undefined || k.waterway === "riverbank" || ["reservoir", "basin"].includes(k.landuse)) return "area water";
    if (["allotments", "cemetery"].includes(k.landuse)) return `area landuse=${k.landuse}`;
    if (["forest"].includes(k.landuse) || ["wood", "scrub", "heath"].includes(k.natural)) return "area green wood/scrub";
    if (["park", "garden"].includes(k.leisure)) return "area green park/garden";
    return "area green grass/meadow/other";
  }
  if (el.t === "n") {
    if (k.natural === "tree") return "node tree";
    if (k.highway) return `node highway=${k.highway}`;
    if (k.barrier) return `node barrier=${k.barrier}`;
    if (k.public_transport || k.railway) return "node stop/platform";
    if (k.amenity) return `node amenity=${k.amenity}`;
    if (k.information) return "node information";
    if (k.leisure) return "node leisure";
    return "node other";
  }
  if (k.highway) {
    const h = k.highway;
    if (["footway", "path", "steps", "pedestrian", "cycleway", "bridleway"].includes(h)) return `way highway=${h}${h === "footway" && k.footway ? `(${["sidewalk", "crossing"].includes(k.footway) ? k.footway : "other"})` : ""}`;
    if (h === "service") return `way highway=service${k.service ? `(${["driveway", "parking_aisle", "alley"].includes(k.service) ? k.service : "other"})` : ""}`;
    if (["motorway", "trunk", "primary", "secondary", "tertiary", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"].includes(h)) return "way highway=main roads";
    if (["residential", "unclassified", "living_street", "road", "busway"].includes(h)) return `way highway=${h}`;
    return `way highway=${h} (other)`;
  }
  if (k.railway) return `way railway=${k.railway}`;
  if (k.barrier) return `way barrier=${k.barrier}`;
  if (k.natural === "tree_row") return "way tree_row";
  return "way other";
}

const kinds = new Map(), keys = new Map();
let total = 0, tiles = 0;
const add = (m, k, gz, n = 1) => { const r = m.get(k) || { n: 0, gz: 0 }; r.n += n; r.gz += gz; m.set(k, r); };
for (const { gz, arr, lines } of tilesOf(file)) {
  tiles++;
  total += gz.length;
  const parts = arr.map((a) => JSON.stringify(a).length + 1), sum = parts.reduce((s, x) => s + x, 0);
  lines.forEach((el, i) => {
    const share = (gz.length * parts[i]) / sum;
    add(kinds, kindOf(el), share);
    if (KEYS) {
      // Within the element: its tags by key (as packed) and its geometry.
      const a = arr[i], tagLen = JSON.stringify(a[2]).length, geoLen = JSON.stringify(a[3]).length + (a[5] ? JSON.stringify(a[5]).length : 0);
      const rest = parts[i] - tagLen - geoLen;
      add(keys, `geometry ${el.t}${el.q ? "5" : ""}`, (share * geoLen) / parts[i]);
      add(keys, "frame (type, id, o)", (share * rest) / parts[i]);
      const tl = a[2];
      const entries = [];
      for (let j = 0; j < tl.length; j++) {
        if (typeof tl[j] === "number" && tl[j] >= 0) entries.push([Object.keys(el.k)[entries.length], String(tl[j]).length + 1]);
        else { entries.push([Object.keys(el.k)[entries.length], JSON.stringify(tl[j]).length + JSON.stringify(tl[j + 1]).length + 2]); j++; }
      }
      for (const [key, len] of entries) add(keys, `tag ${process.env.FULL ? key : key.replace(/:.*/, ":*")}`, (share * len) / parts[i]);
    }
  });
}
const size = fs.statSync(file).size;
const mb = (x) => (x / 1e6).toFixed(2);
console.log(`${file}: ${mb(size)} MB, tiles ${tiles}, tile data ${mb(total)} MB`);
const show = (m, title) => {
  console.log(`\n${title}`);
  for (const [k, r] of [...m].sort((a, b) => b[1].gz - a[1].gz)) if (r.gz / total > (process.env.MIN ? +process.env.MIN : 0.002)) console.log(`${(100 * r.gz / total).toFixed(1).padStart(5)} %  ${mb(r.gz).padStart(7)} MB  ${String(r.n).padStart(9)}  ${k}`);
};
show(kinds, "kinds (share, MB, elements)");
if (KEYS) show(keys, "tags and geometry");
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ file, size, total, kinds: Object.fromEntries(kinds), keys: Object.fromEntries(keys) }, null, 1));
