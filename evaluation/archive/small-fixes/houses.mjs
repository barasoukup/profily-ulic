// Fix 2 (podkroví): does RÚIAN's count of a family house of 2+ floors include a lived-in attic? Compared with IPR's
// "Podlažnosti" (cornice floors + roof floors) at the facade points of the Prague cuts (evaluation/praha/data/ab-city-stejne),
// one cached request each (evaluation/archive/small-fixes/data/domy.json), through polite.mjs.
import fs from "node:fs";
import { politeFetch } from "../../polite.mjs";
globalThis.fetch = politeFetch;
import { query } from "../../../app/public/gis.js";
import { PODLAZNOST, PODLAZNOST_FIELDS, podlaznostInfo } from "../../../app/public/queries.js";
const RU = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/3/query";
const dir = new URL("../../praha/data/ab-city-stejne/", import.meta.url).pathname, cache = new URL("data/domy.json", import.meta.url).pathname;
const C = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, "utf8")) : {};
const pts = [];
for (const f of fs.readdirSync(dir).filter((x) => /^\d+\.json$/.test(x))) {
  const e = JSON.parse(fs.readFileSync(dir + f)).a?.edges || {};
  for (const s of ["left", "right"]) { const p = e[`${s}Info`]?.point; if (p) pts.push([f, s, p]); }
}
for (const [f, s, [lon, lat]] of pts) {
  const k = `${f}${s}`;
  if (C[k]) continue;
  const g = { geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", returnGeometry: "false", f: "json" };
  try {
    const ru = (await query(RU, { ...g, outFields: "pocetpodlazi,zpusobvyuzitikod,zastavenaplocha" })).features?.[0]?.attributes;
    const ip = podlaznostInfo(await query(PODLAZNOST, { ...g, outFields: PODLAZNOST_FIELDS }), lat);
    C[k] = { ru, ip: { c: ip.cornice, r: ip.roof, t: ip.total, kind: ip.kind } };
  } catch (e) { C[k] = { err: String(e) }; }
  fs.writeFileSync(cache, JSON.stringify(C));
}
const rows = Object.values(C).filter((c) => c.ru && c.ip?.t);
const tab = {};
for (const c of rows) { const use = c.ru.zpusobvyuzitikod, fl = c.ru.pocetpodlazi; if (use !== 7 && use !== 8) continue; const k = `use${use} RÚIAN ${fl ?? "—"} NP`; (tab[k] ??= []).push(`${c.ip.c}+${c.ip.r}`); }
for (const [k, v] of Object.entries(tab).sort()) console.log(k, v.length, "× IPR (podlaží+střecha):", Object.entries(v.reduce((a, x) => ((a[x] = (a[x] || 0) + 1), a), {})).map(([a, b]) => `${a}:${b}`).join(" "));
console.log("bodů", pts.length, "s odpovědí", rows.length);
