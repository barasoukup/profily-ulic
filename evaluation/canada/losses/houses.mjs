// Toronto's house heights for the judged houses (DERIVED_HEIGHT of the building outline under the probe; one cached request a
// house, 500 ms apart): photo floors (two judges' mean), floors without and with the height, the height, the look.
import fs from "node:fs";
const W = new URL("../../../", import.meta.url).pathname;
const SP = new URL("data/cache/", import.meta.url).pathname;
const crypto = await import("node:crypto");
fs.mkdirSync(SP, { recursive: true });
const { floorsOf } = await import(W + "pilot/public/towns/canada.js");
const R = W + "evaluation/canada/review/";
const rows = JSON.parse(fs.readFileSync(R + "houses.json", "utf8")).rows, ch = JSON.parse(fs.readFileSync(R + "results/houses-changed.json", "utf8"));
const L = (f) => new Map(fs.readFileSync(R + "results/" + f, "utf8").trim().split("\n").map((l) => JSON.parse(l)).map((r) => [r.id, r]));
const a = L("houses-a.jsonl"), b = L("houses-b.jsonl");
async function get(url) {
  const f = SP + crypto.createHash("sha1").update(url).digest("hex") + ".json";
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  await new Promise((r) => setTimeout(r, 500));
  const j = await (await fetch(url)).json();
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
for (const c of ch) {
  const r = rows.find((x) => x.id === c.id), x = a.get(c.id), y = b.get(c.id);
  const [lon, lat] = r.probe || r.point, d = 0.00002;
  const j = await get(`https://gis.toronto.ca/arcgis/rest/services/cot_geospatial3/MapServer/2/query?${new URLSearchParams({ geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", outFields: "SUBTYPE_DESC,DERIVED_HEIGHT", returnGeometry: "false", distance: "1", units: "esriSRUnit_Meter" })}`);
  const h = (j.features || []).map((f) => `${f.attributes.SUBTYPE_DESC}:${f.attributes.DERIVED_HEIGHT}`).join(",");
  const t = x?.floors != null && y?.floors != null && Math.abs(x.floors - y.floors) <= 1 ? (x.floors + y.floors) / 2 : null;
  const res = t == null ? "-" : Math.abs(c.after - t) < Math.abs(c.before - t) - 1e-9 ? "LEPE" : Math.abs(c.after - t) > Math.abs(c.before - t) + 1e-9 ? "HURE" : "stejne";
  console.log(`${c.id} ${r.street} foto ${t ?? `${x?.floors}/${y?.floors}`} (${x?.kind}/${y?.kind}) bez ${c.before} s ${c.after} ${c.lookBefore}->${c.lookAfter} h=${h} osm=${JSON.stringify(r.tags)} ${res}`);
}
