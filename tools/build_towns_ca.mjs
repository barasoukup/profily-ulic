// The boundaries of the Canadian cities the app has a surface map of (as build_towns_us.mjs; Bára 25. 11. 2026): Toronto,
// Statistics Canada's census subdivision of 2021 (the digital boundary file, with the lake; Statistics Canada Open Licence).
// One query at build time, none on a click. Written into app/public/mesta-ca.json, kept in the repository:
// node tools/build_towns_ca.mjs
import fs from "node:fs";

const CSD = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Digital_boundary_files/MapServer/9/query";
const q = new URLSearchParams({ where: "CSDUID='3520005'", outFields: "", returnGeometry: "true", outSR: "4326", geometryPrecision: "5", maxAllowableOffset: "0.0001", f: "json" });
const j = await (await fetch(`${CSD}?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
if (!j.features?.length) throw new Error("hranice Toronta se nenačetla");
const out = { toronto: j.features.flatMap((f) => f.geometry.rings) };
console.log("toronto", out.toronto.map((r) => r.length), "bodů");
fs.writeFileSync(new URL("../app/public/mesta-ca.json", import.meta.url), JSON.stringify(out));
