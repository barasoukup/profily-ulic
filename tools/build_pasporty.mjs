// The boundaries of the towns whose road or green passport the app reads anywhere else in the Czech Republic
// (towns/pasporty.js; Bára 16. 11. 2026): RÚIAN obce of ČÚZK, simplified to about 20 m, written into
// app/public/pasporty.json (kept in the repository): node tools/build_pasporty.mjs
import fs from "node:fs";
import { PASSPORT_CODES } from "../app/public/towns/pasporty.js";

const OBEC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/12/query";
const out = {};
for (const [id, kod] of Object.entries(PASSPORT_CODES)) {
  const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, maxAllowableOffset: 0.0002, geometryPrecision: 5, f: "json" });
  let json;
  for (let i = 0; i < 4 && !json; i++) {
    try { json = await (await fetch(`${OBEC}?${q}`)).json(); } catch (err) { if (i === 3) throw err; await new Promise((r) => setTimeout(r, 2000)); }
  }
  const f = json.features?.[0];
  if (!f) throw new Error(`obec ${kod} (${id}) nenalezena`);
  out[id] = f.geometry.rings;
  console.log(id, f.attributes.nazev, f.geometry.rings.reduce((a, r) => a + r.length, 0), "bodů");
}
fs.writeFileSync(new URL("../app/public/pasporty.json", import.meta.url), JSON.stringify(out));
