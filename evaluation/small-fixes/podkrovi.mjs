// Fix 2 (podkroví): RÚIAN's family houses of 1, 2 and 3 floors in outer Prague (Klánovice, Čakovice, Řepy, Kunratice, Radotín) against IPR's
// "Podlažnosti" (floors to the cornice + roof floors) at the middle of the outline: 40 houses per count of floors, one request
// each, cached (data/podkrovi.json), through polite.mjs.
import fs from "node:fs";
import { politeFetch } from "../polite.mjs";
globalThis.fetch = politeFetch;
import { query } from "../../app/public/gis.js";
import { PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "../../app/public/queries.js";
const RU = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/3/query";
const cache = new URL("data/podkrovi.json", import.meta.url).pathname;
const C = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, "utf8")) : {};
const BOX = [[14.655, 50.088, 14.675, 50.100], [14.470, 50.150, 14.490, 50.165], [14.335, 50.060, 14.355, 50.072], [14.440, 49.990, 14.460, 50.002], [14.360, 49.985, 14.380, 49.997]];
if (!C.houses) {
  C.houses = [];
  for (const use of [7, 8]) for (const fl of [1, 2, 3]) {
    let got = [];
    for (const b of BOX) {
      const j = await query(RU, { geometry: b.join(","), geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects", where: `zpusobvyuzitikod=${use} AND pocetpodlazi=${fl}`, outFields: "objectid", returnGeometry: "true", outSR: "4326", f: "json" });
      for (const f of j.features || []) { const r = f.geometry?.rings?.[0]; if (r) got.push({ use, fl, lon: r.reduce((a, p) => a + p[0], 0) / r.length, lat: r.reduce((a, p) => a + p[1], 0) / r.length }); }
    }
    C.houses.push(...got.sort(() => 0.5 - Math.random()).slice(0, use === 7 ? 40 : 15));
  }
  fs.writeFileSync(cache, JSON.stringify(C));
}
for (const h of C.houses) {
  if (h.ip) continue;
  try { const ip = podlaznostInfo(await query(PODLAZNOST, { geometry: `${h.lon},${h.lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: PODLAZNOST_FIELDS, returnGeometry: "false", f: "json" }), h.lat); h.ip = { c: ip.cornice ?? null, r: ip.roof ?? null, t: ip.total ?? null }; } catch (e) { h.ip = { err: 1 }; }
  fs.writeFileSync(cache, JSON.stringify(C));
}
const tab = {};
for (const h of C.houses) { if (!h.ip || h.ip.c == null) continue; const k = `užití ${h.use} RÚIAN ${h.fl} NP`; (tab[k] ??= []).push(`${h.ip.c}+${h.ip.r}`); }
for (const [k, v] of Object.entries(tab).sort()) console.log(k, `(${v.length}) IPR podlaží+střecha:`, Object.entries(v.reduce((a, x) => ((a[x] = (a[x] || 0) + 1), a), {})).map(([a, b]) => `${a}: ${b}`).join(", "));
