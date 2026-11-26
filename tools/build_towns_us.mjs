// The boundaries of the American cities the app has illustrations or a surface map of (as build_towns_sk.mjs and
// build_towns_at.mjs; Bára 25. 11. 2026): Washington, the District of Columbia, from DC's own service (DCGIS "DC Boundary",
// CC BY 4.0); Boston and Cambridge (Bára 26. 11. 2026) from the Census Bureau's TIGERweb (Incorporated Places, public
// domain), the areas of their surface maps (towns/boston.js); "bostonmetro", the metro of Boston as staty-america.json has
// it (tools/build_staty.mjs METROS), the area of its buses and orthophoto (countries/US.js art, lanes-ortho.js us-ma).
// A few queries at build time, none on a click. Written into pilot/public/mesta-us.json (city.js loadTowns), kept in the
// repository; staty-america.json first:
//   node tools/build_staty.mjs usa && node tools/build_towns_us.mjs
import fs from "node:fs";

const UA = { headers: { "User-Agent": "profily-ulic" } };
const DC = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/10/query";
const q = new URLSearchParams({ where: "1=1", outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0002", f: "json" });
const j = await (await fetch(`${DC}?${q}`, UA)).json();
if (!j.features?.length) throw new Error("hranice DC se nenačetla");
const out = { washington: j.features.flatMap((f) => f.geometry.rings) };

// The cities of a surface map by TIGERweb's Incorporated Places (GEOID: state and place code).
const PLACES = { boston: "2507000", cambridge: "2511000" };
const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query";
const p = await (await fetch(`${TIGER}?${new URLSearchParams({ where: `GEOID IN (${Object.values(PLACES).map((g) => `'${g}'`).join(",")})`, outFields: "GEOID",
  returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0002", f: "json" })}`, UA)).json();
for (const [id, geoid] of Object.entries(PLACES)) {
  const f = (p.features || []).find((x) => x.attributes.GEOID === geoid);
  if (!f) throw new Error(`TIGERweb: ${id} (${geoid}) se nenačetl`);
  out[id] = f.geometry.rings;
}
// The metro of Boston: the ring of staty-america.json's "usa" that holds Boston's city hall.
const states = JSON.parse(fs.readFileSync(new URL("../pilot/public/staty-america.json", import.meta.url), "utf8"));
const inRing = (r, x, y) => { let c = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if (yi > y !== yk > y && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) c = !c; } return c; };
const metro = states.usa.filter((r) => inRing(r, -71.0578, 42.3603));
if (!metro.length) throw new Error("staty-america.json: metro Bostonu chybí (nejdřív node tools/build_staty.mjs usa)");
out.bostonmetro = metro;
for (const [id, rings] of Object.entries(out)) console.log(id, rings.map((r) => r.length), "bodů");
fs.writeFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), JSON.stringify(out));
