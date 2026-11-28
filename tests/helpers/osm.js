// Synthetic OSM: the ways and areas the tests lay in a local frame (metres east and north of a point).
import { localFrame } from "../../app/public/derive.js";

// ll(x, y) → { lon, lat }; way(tags, [[x, y]…]); street(tags, x, half) a straight street along y; house(x0, x1) a block.
export function osmAt(lat, lon) {
  const frame = localFrame(lat, lon);
  const ll = (x, y) => { const [lo, la] = frame.toLonLat(x, y); return { lon: lo, lat: la }; };
  const way = (tags, pts, id = 1) => ({ type: "way", id, tags, geometry: pts.map(([x, y]) => ll(x, y)) });
  const street = (tags = {}, x = 0, half = 60, id = 1) => way({ highway: "residential", ...tags }, [[x, -half], [x, half]], id);
  const house = (x0, x1, id = 100 + x0, tags = { building: "yes" }) => ({ type: "area", id, tags, geometry: [[x0, -20], [x1, -20], [x1, 20], [x0, 20], [x0, -20]].map(([x, y]) => ll(x, y)) });
  return { frame, ll, way, street, house };
}
