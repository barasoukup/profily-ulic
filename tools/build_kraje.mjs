// The boundaries of the regions whose digital technical map (DTM kraje) answers a WFS with the polygons of the
// basic spatial situation (dtmwfs.js): RÚIAN VÚSC from ČÚZK, simplified to about 300 m (a cut within 400 m of a border
// asks both regions, dtmwfs.js regionsAt). Written into pilot/public/kraje.json and kept in the repository
// (boundaries change rarely): node tools/build_kraje.mjs
import fs from "node:fs";

const VUSC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/17/query";
// RÚIAN codes of the regions (VÚSC) → the id in dtmwfs.js REGIONS.
const CODES = { 35: "jck", 51: "kvk", 78: "lbk", 86: "khk", 94: "pak", 108: "vys", 116: "jmk", 132: "msk", 141: "zlk" };
const out = {};
for (const [kod, id] of Object.entries(CODES)) {
  const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, maxAllowableOffset: 0.003, geometryPrecision: 3, f: "json" });
  let json;
  for (let i = 0; i < 4 && !json; i++) {
    try { json = await (await fetch(`${VUSC}?${q}`)).json(); } catch (err) { if (i === 3) throw err; await new Promise((r) => setTimeout(r, 2000)); }
  }
  const f = json.features?.[0];
  if (!f) throw new Error(`kraj ${kod} (${id}) nenalezen`);
  out[id] = f.geometry.rings;
  console.log(id, f.attributes.nazev, f.geometry.rings.reduce((a, r) => a + r.length, 0), "bodů");
  await new Promise((r) => setTimeout(r, 500));
}
fs.writeFileSync(new URL("../pilot/public/kraje.json", import.meta.url), JSON.stringify(out));
