// Synthetic streets: the ways, areas and surfaces the tests lay in a local frame (metres east and north of a point), and
// deriveProfile called on them the way every test calls it (a cut across a street that runs north, 40 m each way).
import { localFrame, deriveProfile } from "../../app/public/derive.js";

// ll(x, y) → { lon, lat }; way(tags, [[x, y]…]); street(tags, x, half) a straight street along y; house(x0, x1) a block.
export function osmAt(lat, lon) {
  const frame = localFrame(lat, lon);
  const ll = (x, y) => { const [lo, la] = frame.toLonLat(x, y); return { lon: lo, lat: la }; };
  const way = (tags, pts, id = 1) => ({ type: "way", id, tags, geometry: pts.map(([x, y]) => ll(x, y)) });
  const street = (tags = {}, x = 0, half = 60, id = 1) => way({ highway: "residential", ...tags }, [[x, -half], [x, half]], id);
  const house = (x0, x1, id = 100 + x0, tags = { building: "yes" }) => ({ type: "area", id, tags, geometry: [[x0, -20], [x1, -20], [x1, 20], [x0, 20], [x0, -20]].map(([x, y]) => ll(x, y)) });
  return { frame, ll, way, street, house };
}

// A surface of the map as the state sources give it (code of MTVU, from x0 to x1 across, 120 m along the street)…
export const mtvuRect = (code, x0, x1, guess) => ({ code, label: "", ...(guess === undefined ? {} : { guess }), rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60]]], bbox: [x0, -60, x1, 60] });
// …and as Esri services give it (CTVUK_KOD of the technical map), in the frame's coordinates.
export const esriRect = (frame) => (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });

// deriveProfile for a cut at the origin across a street that runs north: { elements: the OSM elements, polys, frame, way… }.
export const deriveOn = ({ elements, ...rest }) => deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, osm: { elements }, ...rest });
