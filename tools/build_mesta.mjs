// The boundaries of the cities the app knows (RÚIAN obce from ČÚZK, simplified to about 20 m), so a cut
// takes the data sources, illustrations and texts of the city it lies in (city.js cityAt); anywhere else
// in the Czech Republic it is "cesko". Written into pilot/public/mesta.json and kept in the repository
// (a few kB; boundaries change rarely): node tools/build_mesta.mjs
import fs from "node:fs";

const OBEC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/12/query";
// RÚIAN codes of the cities (obec).
const CODES = { praha: 554782, brno: 582786, jihlava: 586846, most: 567027, opava: 505927, pardubice: 555134, plzen: 554791, usti: 554804,
  ostrava: 554821, "frydek-mistek": 598003, karvina: 598917, trebic: 590266, prerov: 511382,
  // Towns with only their own vehicles (city.js artTown).
  olomouc: 500496, liberec: 563889, hradec: 569810, budejovice: 544256, zlin: 585068 };
const out = {};
for (const [id, kod] of Object.entries(CODES)) {
  const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, maxAllowableOffset: 0.0002, geometryPrecision: 5, f: "json" });
  // ČÚZK closes a connection now and then: a few tries.
  let json;
  for (let i = 0; i < 4 && !json; i++) {
    try { json = await (await fetch(`${OBEC}?${q}`)).json(); } catch (err) { if (i === 3) throw err; await new Promise((r) => setTimeout(r, 2000)); }
  }
  const f = json.features?.[0];
  if (!f) throw new Error(`obec ${kod} (${id}) nenalezena`);
  out[id] = f.geometry.rings;
  console.log(id, f.attributes.nazev, f.geometry.rings.reduce((a, r) => a + r.length, 0), "bodů");
}
fs.writeFileSync(new URL("../pilot/public/mesta.json", import.meta.url), JSON.stringify(out));
