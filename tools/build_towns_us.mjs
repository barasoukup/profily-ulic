// The boundaries of the American cities the app has illustrations of (as build_towns_sk.mjs and build_towns_at.mjs;
// Bára 25. 11. 2026): Washington, the District of Columbia, from DC's own service (DCGIS "DC Boundary", CC BY 4.0). One
// query at build time, none on a click. Written into pilot/public/mesta-us.json (city.js loadTowns), kept in the
// repository: node tools/build_towns_us.mjs
import fs from "node:fs";

const DC = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer/10/query";
const q = new URLSearchParams({ where: "1=1", outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0002", f: "json" });
const j = await (await fetch(`${DC}?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
if (!j.features?.length) throw new Error("hranice DC se nenačetla");
const out = { washington: j.features.flatMap((f) => f.geometry.rings) };
console.log("washington", out.washington.map((r) => r.length), "bodů");
fs.writeFileSync(new URL("../pilot/public/mesta-us.json", import.meta.url), JSON.stringify(out));
