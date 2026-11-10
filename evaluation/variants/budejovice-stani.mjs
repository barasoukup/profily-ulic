// České Budějovice: as budejovice-mesto, and the town's paid parking sections (GL_PARKUSEKY, 858 lines with the
// side STRANA L/P, tariff and length in m, edited 2026) as strips 2 m wide centred on the line (the lines are
// drawn schematically near the street's axis or in the parking lane; the orientation is not given).
//   CITY=budejovice VARIANTS=city,budejovice-mesto,budejovice-stani CACHE=disk ONLY=… node evaluation/ab.mjs
import { query, envelope, metres } from "../../pilot/public/gis.js";
import { CB } from "./budejovice-mesto.mjs";
export { surfaces, osm } from "./budejovice-mesto.mjs";

export const about = "jako budejovice-mesto + úseky placeného stání města (pás 2 m)";
const HALF = 1;
export async function parking(bbox) {
  const lat = (Number(bbox.split(",")[1]) + Number(bbox.split(",")[3])) / 2;
  const [kx, ky] = metres(lat);
  const json = await query(`${CB}/GL_PARKUSEKY/FeatureServer/0/query`, { ...envelope(bbox), outFields: "TYP" });
  const features = [];
  for (const f of json.features || []) {
    for (const p of f.geometry?.paths || []) {
      for (let i = 1; i < p.length; i++) {
        const [x0, y0] = p[i - 1], [x1, y1] = p[i];
        const dx = (x1 - x0) * kx, dy = (y1 - y0) * ky, l = Math.hypot(dx, dy);
        if (l < 0.5) continue;
        const ox = (-dy / l) * HALF / kx, oy = (dx / l) * HALF / ky;
        features.push({ attributes: { KIND: "useky", PS_ZPS: 0 }, geometry: { rings: [[[x0 + ox, y0 + oy], [x1 + ox, y1 + oy], [x1 - ox, y1 - oy], [x0 - ox, y0 - oy], [x0 + ox, y0 + oy]]] } });
      }
    }
  }
  return { features };
}
