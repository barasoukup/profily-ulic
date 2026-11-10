// The DTM of the region as real polygons from its WFS (pilot/public/dtmwfs.js: nine regions with the DTM of
// T-MAPY) instead of reading the map images of the national DMVS (dmvs.js); the images stay where a region
// has no WFS or it fails. RÚIAN fills in as before.
//   CITY=pardubice VARIANTS=city,dtm-wfs CACHE=disk node evaluation/ab.mjs
import { MTVU_LABELS } from "../../pilot/public/city.js";
import { surfaces as dmvsSurfaces } from "../../pilot/public/dmvs.js";

export const about = "DTM kraje z WFS (polygony)";
export const surfaces = (bbox) => dmvsSurfaces(bbox, MTVU_LABELS, { wfs: true });
