// As dtm-wfs, and the fences, walls, railings, noise barriers and guard rails of the region's DTM (WFS of its
// lines, dtmwfs.js wfsLines) as the line layer: the national DMVS gives no geometry of a line, so the towns on
// it had none.
//   CITY=pardubice VARIANTS=dtm-wfs,dtm-wfs-linie CACHE=disk node evaluation/ab.mjs
import { wfsLines } from "../../pilot/public/dtmwfs.js";
export { surfaces } from "./dtm-wfs.mjs";

export const about = "DTM kraje z WFS + ploty, zdi, zábradlí, svodidla";
export const lines = (bbox) => wfsLines(bbox);
