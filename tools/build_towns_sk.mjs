// The boundaries of the Slovak towns the app has data or illustrations of (the review of Slovakia, 16. 11. 2026: the
// boxes reached Šamorín, Ivanka pri Dunaji or Svätý Jur, which got Bratislava's buses and its passport's queries), from
// ZBGIS of ÚGKK SR (Uzemnospravne_clenenie, CC BY 4.0): Bratislava and Košice as their districts (okres Bratislava
// I–V, Košice I–IV), the other towns as their municipality. ZBGIS answers its query operation with 503, so each part
// is asked by identify at a point inside it. Simplified to about 30 m, written into app/public/mesta-sk.json
// (city.js loadSkTowns), kept in the repository: node tools/build_towns_sk.mjs
import fs from "node:fs";

const URL_ID = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Uzemnospravne_clenenie/MapServer/identify";
const OFFSET = 0.0003;
// town → [layer (2 okres, 3 obec), points inside its parts]
const TOWNS = {
  bratislava: [2, [[17.107, 48.1467], [17.17, 48.16], [17.13, 48.19], [17.03, 48.19], [17.11, 48.11]]],
  kosice: [2, [[21.2575, 48.7235], [21.215, 48.70], [21.30, 48.735], [21.265, 48.685]]],
  zilina: [3, [[18.74, 49.223]]],
  bystrica: [3, [[19.146, 48.736]]],
  presov: [3, [[21.24, 48.998]]],
  nitra: [3, [[18.084, 48.309]]],
  trnava: [3, [[17.587, 48.377]]],
  trencin: [3, [[18.036, 48.892]]],
  martin: [3, [[18.921, 49.066]]],
  poprad: [3, [[20.297, 49.059]]],
  piestany: [3, [[17.832, 48.594]]],
  hlohovec: [3, [[17.803, 48.425]]],
  zvolen: [3, [[19.127, 48.575]]],
};

async function part(layer, [x, y]) {
  const q = new URLSearchParams({ geometry: `${x},${y}`, geometryType: "esriGeometryPoint", sr: 4326, layers: `all:${layer}`, tolerance: 0,
    mapExtent: "16.8,47.7,22.6,49.7", imageDisplay: "800,600,96", returnGeometry: true, maxAllowableOffset: OFFSET, geometryPrecision: 4, f: "json" });
  for (let i = 0; ; i++) {
    try {
      const json = await (await fetch(`${URL_ID}?${q}`, { headers: { "User-Agent": "profily-ulic" } })).json();
      const r = (json.results || []).find((x) => x.layerId === layer);
      if (!r?.geometry?.rings?.length) throw new Error(`no ${layer} at ${x},${y}`);
      return { name: r.attributes["Názov okresu"] && layer === 2 ? r.attributes["Názov okresu"] : r.attributes["Názov obce"], rings: r.geometry.rings };
    } catch (err) { if (i === 3) throw err; await new Promise((res) => setTimeout(res, 2000)); }
  }
}

const out = {};
for (const [id, [layer, pts]] of Object.entries(TOWNS)) {
  const parts = [];
  for (const p of pts) { parts.push(await part(layer, p)); await new Promise((res) => setTimeout(res, 300)); }
  out[id] = parts.flatMap((p) => p.rings);
  console.log(id, parts.map((p) => p.name).join(", "), out[id].length, "kruhů");
}
fs.writeFileSync(new URL("../app/public/mesta-sk.json", import.meta.url), JSON.stringify(out));
