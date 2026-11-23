// Estonia (Bára 23. 11. 2026): the state of a cut inside staty.json's "estonia". The profile is the estimate from OSM
// and the Land and Spatial Development Board's orthophoto (lanes-ortho.js "ee"). Tallinn's surface map (gis.tallinn.ee
// tar_maakate) has no licence stated: not used (evaluation/estonia/ZDROJE.md). The buildings of the topographic
// database ETAK (WFS, CORS *, the Board's open-data licence): the height of the house at the facade, so its floors
// (about 3 m a floor), and the kind (a dwelling or public building / an ancillary or industrial one). ?etak=0 leaves
// them out.
import { osmTiles, getJSON } from "../gis.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_EE?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const ETAK_WFS = "https://gsavalik.envir.ee/geoserver/etak/ows";

export function etakBuilding(p) {
  const h = Number(p?.korgus_m);
  const floors = h > 2 ? Math.max(1, Math.round(h / 3)) : undefined;
  const industrial = /tootmis|abi/i.test(String(p?.tyyp_tekst || "")) && !/elu/i.test(String(p?.tyyp_tekst || ""));
  return { type: industrial ? "industrial" : undefined, ...(floors && { cornice: floors, total: floors, roof: 0, height: h }) };
}
async function podlaznost(lat, lon) {
  if (param("etak") === "0") return {};
  const d = 0.00001; // about a metre around the facade's point
  const json = await getJSON(`${ETAK_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "etak:e_401_hoone_ka",
    outputFormat: "application/json", srsName: "EPSG:4326", count: "5", BBOX: `${lat - d},${lon - d},${lat + d},${lon + d},urn:ogc:def:crs:EPSG::4326` })}`);
  const f = (json?.features || []).sort((a, b) => (b.properties?.korgus_m || 0) - (a.properties?.korgus_m || 0))[0];
  return f ? etakBuilding(f.properties) : {};
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
