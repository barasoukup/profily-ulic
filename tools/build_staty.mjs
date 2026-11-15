// The boundaries of the states the app has OSM tiles of (Bára 15. 11. 2026), so a cut outside the cities of
// mesta.json takes its state (city.js cityAt): "cesko" (RÚIAN Stát, ČÚZK), "slovensko" (ZBGIS of ÚGKK SR, layer
// Slovenská republika); a point in neither is "cizina". Simplified to about 30 m, written into pilot/public/staty.json and kept in the repository
// (boundaries change rarely): node tools/build_staty.mjs
import fs from "node:fs";

const CZ = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/19/query";
// ZBGIS answers its query operation with 503 (15. 11. 2026): the state is asked by identify at a point inside it.
const SK = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Uzemnospravne_clenenie/MapServer/identify";
const OFFSET = 0.0003; // degrees, about 25–30 m

async function rings(url, params) {
  const q = new URLSearchParams({ outSR: 4326, maxAllowableOffset: OFFSET, geometryPrecision: 4, f: "json", ...params });
  // The services close a connection now and then: a few tries.
  for (let i = 0; ; i++) {
    try {
      const json = await (await fetch(`${url}?${q}`)).json();
      const all = (json.features || json.results || []).flatMap((f) => f.geometry?.rings || []);
      if (!all.length) throw new Error(`${url}: žádná hranice`);
      return all;
    } catch (err) { if (i === 3) throw err; await new Promise((r) => setTimeout(r, 2000)); }
  }
}

const out = {
  cesko: await rings(CZ, { where: "1=1", outFields: "nazev" }),
  slovensko: await rings(SK, { geometry: "19.70,48.67", geometryType: "esriGeometryPoint", sr: 4326, layers: "all:0", tolerance: 2,
    mapExtent: "16.8,47.7,22.6,49.7", imageDisplay: "800,600,96", returnGeometry: true }),
};
for (const [id, r] of Object.entries(out)) console.log(id, r.length, "kruhů,", r.reduce((a, x) => a + x.length, 0), "bodů");
fs.writeFileSync(new URL("../pilot/public/staty.json", import.meta.url), JSON.stringify(out));
