// Pardubice: the town has no GIS service of its own to ask. Its surfaces come from the national digital
// technical map of ČÚZK (IS DMVS, filled by the Pardubice region), read from its map images on each click
// (dmvs.js, usable for any Czech town), with RÚIAN's buildings and parcels where the DTM is still blank;
// floors of the buildings from RÚIAN. Trolleybuses run under OSM's trolley wires.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { osmTiles, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { surfaces as dmvsSurfaces, DMVS_AREAS, DMVS_LINES } from "../dmvs.js";

const none = async () => ({ features: [] });

// Parking areas of the DTM are among the surfaces (704); fences and walls of its lines are not read (the
// WMS gives no geometry of a line, only its picture).
const surfaces = (bbox) => dmvsSurfaces(bbox, MTVU_LABELS);

export const sources = { osm: osmTiles, surfaces, lines: none, parking: none, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";

// Base maps: the ČÚZK orthophoto (default), the DTM's map of surfaces as WMS (as app.js draws Brno's
// technical map) and OSM; the DTM's lines and points as a transparent overlay.
export function maps({ L, osm: osmLayer, cuzk }) {
  const wms = (url, layers, opts) => L.tileLayer.wms(url, {
    layers, format: "image/png", transparent: true, version: "1.3.0", tileSize: 512, zoomOffset: -1, maxZoom: 21,
    attribution: "technická mapa © Pardubický kraj, IS DMVS ČÚZK", ...opts,
  });
  return {
    base: {
      "Ortofoto ČÚZK": [cuzk()],
      "Technická mapa": [osmLayer(0.5), wms(DMVS_AREAS, "dtm_zps_plochy_bar", { minZoom: 16 })],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto ČÚZK",
    lines: wms(DMVS_LINES, "dtm_zps_linie_body", { minZoom: 17, opacity: 0.9 }),
  };
}

// The orthophoto for the evaluation: ČÚZK's (evaluation/run_brno.mjs).
export const ortho = null;

// The surfaces already are the national DTM: no fallback to it (sources.js).
export const national = true;
