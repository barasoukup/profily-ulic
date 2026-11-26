// The boundaries of the American cities the app has a surface map of (as build_towns_sk.mjs and build_towns_at.mjs;
// Bára 25. 11. 2026): Washington, the District of Columbia, from DC's own service (DCGIS "DC Boundary", CC BY 4.0), and
// San Francisco (26. 11. 2026), the incorporated place of the Census Bureau's TIGERweb (GEOID 0667000, the same line as
// the City and County, with its water and the Farallon Islands; public domain). One query each at build time, none on a
// click. Written into pilot/public/mesta-us.json (city.js loadTowns), kept in the repository: node tools/build_towns_us.mjs
import fs from "node:fs";

const UA = { headers: { "User-Agent": "profily-ulic" } };
const DC = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/10/query";
const q = new URLSearchParams({ where: "1=1", outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0002", f: "json" });
const j = await (await fetch(`${DC}?${q}`, UA)).json();
if (!j.features?.length) throw new Error("hranice DC se nenačetla");
const out = { washington: j.features.flatMap((f) => f.geometry.rings) };
// TIGERweb's incorporated places of the current vintage (layer 4).
const PLACES = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query";
for (const [id, geoid] of [["sanfrancisco", "0667000"]]) {
  const p = await (await fetch(`${PLACES}?${new URLSearchParams({ ...Object.fromEntries(q), where: `GEOID='${geoid}'` })}`, UA)).json();
  if (!p.features?.length) throw new Error(`hranice ${id} se nenačetla`);
  out[id] = p.features.flatMap((f) => f.geometry.rings);
}
for (const [id, rings] of Object.entries(out)) console.log(id, rings.map((r) => r.length), "bodů");
fs.writeFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), JSON.stringify(out));
