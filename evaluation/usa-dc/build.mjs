// The DC pilot (phase 1, Bára 24. 11. 2026): the profile of each cut from DC's open data, built with the app's shared
// code (derive.js deriveProfile and the steps app.js cutAt runs after it), no new rules beyond the mapping below.
//
// Mapping (documented in REPORT.md):
// - DC Planimetrics 2023 (OCTO, CC BY 4.0): Roads (10), Sidewalks (11), Building Footprints (1) in the cut's box. The
//   kinds are read along the cut every 0.1 m (as towns/belgium.js grbSurfaces does with GRB) and handed to the app as
//   MTVU-coded strips 2 m along the street:
//     Building, Parking Garage → 601 building (the facade); Canopy and the rest of layer 1 left out;
//     Sidewalk, Hidden Sidewalk, Stairs → 702 sidewalk; Crosswalk → 701 (it lies on the roadway);
//     Road, Intersection, Hidden Road, Hidden Intersection → 701 roadway;
//     Paved/Unpaved Median Island, Paved/Unpaved Traffic Island, Hidden Median → 9950 median (derive.js MEDIAN);
//     Alley, Paved Drive, Parking Lot → 1003 other paved (a lot is off-street; first mapped 704, which derive.js
//     reads as kerb parking: dc-5-4 had 6 m of "parking" beyond its sidewalks);
//     a gap between the polygons (tree strip, front yard, lawn) → 401 green.
//   Priority where polygons overlap: building, sidewalk, median, roadway, the rest.
// - DDOT Roadway SubBlock (Transportation_WebMercator 162): the inventory line nearest to the cut's centre within 12 m
//   and parallel to the street (|cos| ≥ 0.85) is the cut's block. Its TOTALTRAVELLANES becomes OSM's lanes for the
//   split of the roadway; TOTALPARKINGLANES strips of TOTALPARKINGLANEWIDTH / count (ft → m, 1.8–3.0 m) are cut off the
//   outer kerbs of the carriageway at the axis as 704 (parking along the kerb); with one lane the side is RPPSIDE's
//   (O = outbound = right of the line's direction, I = left), else OSM's parking:<side>, else the right of the line.
//   A bike lane of the inventory (conventional, buffered, protected; BD both sides, IB/OB one) becomes OSM's
//   cycleway:<side>=lane where OSM has no cycleway tag. The law's estimate of parking (default.js: 3 m free a
//   direction) is off where the block matched; without a block it stays on (the rule of thumb).
// - The reach: the app's default (22 m each side from the axis, ends at a facade).
// Baseline (osm): the same cut without the surface map: ortho-osm.js orthoOsmPolys with OSM alone (no orthophoto image),
// as the app's fallback where no orthophoto is read; where it gives nothing derive.js estimateFromOsm.
// Writes data/app-dc.json, data/app-dc-lanes.json (the variant) and data/app-osm.json ([{ id, parts: [[type, width]…], sources }]).
//   node evaluation/usa-dc/build.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, DATA, osmAround, cachedJSON, ft } from "./lib.mjs";
import { localFrame, snapToWay, mtvuPolygons, deriveProfile, splitTwoWayLane, capWideLanes, pedestrianZone, carveCycleways, carveTramTracks, lanesFromShoulders, trackAlongRoad, crossFromA, MAX_REACH } from "../../app/public/derive.js";
import { orthoOsmPolys, trimToEnds } from "../../app/public/ortho-osm.js";
import { MTVU_LABELS } from "../../app/public/city.js";

const PLAN = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Planimetrics_2023/MapServer";
const SUB = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/162";
const HALF = 40, PAD = 0.0004, STEP = 0.1;
const q = (layer, bbox, fields = "DESCRIPTION") => cachedJSON(`${layer}/query?${new URLSearchParams({ geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: 4326, outSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: fields, returnGeometry: "true", f: "json" })}`);

const CODE = (layer, d) => {
  d = String(d || "").toLowerCase();
  if (layer === 1) return /building|garage/.test(d) ? [601, 0] : null;
  if (layer === 11) return /crosswalk/.test(d) ? [701, 3] : [702, 1];
  if (/median|island/.test(d)) return [9950, 2];
  if (/road|intersection/.test(d)) return [701, 3];
  if (/parking lot/.test(d)) return [1003, 4]; // off-street: not the kerb parking 704 would become (dc-5-4, dc-8-2)
  if (/alley|drive/.test(d)) return [1003, 4];
  return null;
};
const inRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inRings = (rings, x, y) => rings.reduce((c, r) => (inRing(r, x, y) ? !c : c), false);

// Planimetric kinds along the cut: runs { code, s, e } (t: + = left of dir = side A).
function runsAlong(layers, frame, normal) {
  const polys = [];
  for (const [layer, json] of layers) for (const f of json.features || []) {
    const c = CODE(layer, f.attributes.DESCRIPTION);
    if (!c) continue;
    const rings = f.geometry.rings.map((r) => r.map(([lon, lat]) => frame.toXY(lon, lat)));
    const xs = rings.flat();
    polys.push({ code: c[0], prio: c[1], rings, box: [Math.min(...xs.map((p) => p[0])), Math.min(...xs.map((p) => p[1])), Math.max(...xs.map((p) => p[0])), Math.max(...xs.map((p) => p[1]))] });
  }
  polys.sort((a, b) => a.prio - b.prio);
  const runs = [];
  for (let t = -HALF; t < HALF - 1e-9; t += STEP) {
    const x = normal[0] * (t + STEP / 2), y = normal[1] * (t + STEP / 2);
    const p = polys.find((p) => x >= p.box[0] && x <= p.box[2] && y >= p.box[1] && y <= p.box[3] && inRings(p.rings, x, y));
    const code = p ? p.code : 401, last = runs.at(-1);
    if (last && last.code === code) last.e = t + STEP; else runs.push({ code, s: t, e: t + STEP });
  }
  return runs;
}

// The block of the inventory: the nearest parallel SubBlock line within 12 m of the centre.
function blockOf(json, frame, dir) {
  let best = null;
  for (const f of json.features || []) for (const path of f.geometry?.paths || []) {
    const pts = path.map(([lon, lat]) => frame.toXY(lon, lat));
    const c = snapToWay(pts, [0, 0]);
    if (!c?.dir || c.d > 12 || Math.abs(c.dir[0] * dir[0] + c.dir[1] * dir[1]) < 0.85) continue;
    if (!best || c.d < best.d) best = { d: c.d, a: f.attributes, along: c.dir[0] * dir[0] + c.dir[1] * dir[1] > 0 };
  }
  return best;
}

// Parking strips of the block cut off the carriageway's outer kerbs. side +1: A (t > 0), -1: B.
function carveParking(runs, block, tags) {
  const a = block.a, n = Number(a.TOTALPARKINGLANES) || 0;
  if (!n) return [];
  const w = Math.min(3, Math.max(1.8, ft(a.TOTALPARKINGLANEWIDTH) / n || 2.4));
  // The carriageway at the axis: the roadway run under t = 0 (or nearest) and its neighbours of roadway or median.
  const road = (r) => r.code === 701 || r.code === 9950;
  let i = runs.findIndex((r) => r.code === 701 && r.s <= 0 && r.e >= 0);
  if (i < 0) { const c = runs.map((r, k) => [k, r]).filter(([, r]) => r.code === 701).sort(([, x], [, y]) => Math.min(Math.abs(x.s), Math.abs(x.e)) - Math.min(Math.abs(y.s), Math.abs(y.e)))[0]; if (!c) return []; i = c[0]; }
  let lo = i, hi = i;
  while (lo > 0 && road(runs[lo - 1])) lo--;
  while (hi < runs.length - 1 && road(runs[hi + 1])) hi++;
  while (runs[lo].code !== 701) lo++;
  while (runs[hi].code !== 701) hi--;
  // Sides: "B" the low-t end (runs[lo]), "A" the high-t end (runs[hi]).
  let sides;
  if (n >= 2) sides = ["A", "B"];
  else {
    // The line's right: if the line runs along dir, its right is −t (B).
    const right = block.along ? "B" : "A", left = right === "A" ? "B" : "A";
    const rpp = String(a.RPPSIDE || "").toUpperCase();
    const osmSide = ["left", "right"].find((s) => tags[`parking:${s}`] && !/^no/.test(tags[`parking:${s}`]));
    sides = [rpp === "I" ? left : rpp === "O" ? right : osmSide ? (osmSide === "right") === block.along ? "B" : "A" : right];
  }
  const out = [];
  for (const s of sides) {
    const r = s === "B" ? runs[lo] : runs[hi];
    if (r.e - r.s < w + 2.5) continue; // no room for a lane beside it
    if (s === "B") { out.push({ code: 704, s: r.s, e: r.s + w }); r.s += w; }
    else { out.push({ code: 704, s: r.e - w, e: r.e }); r.e -= w; }
  }
  runs.push(...out);
  runs.sort((x, y) => x.s - y.s);
  return sides;
}

// Runs as MTVU features: strips 2 m along the street.
function features(runs, frame, dir, normal) {
  return { features: runs.map((r) => ({ attributes: { CTVUK_KOD: r.code, CTVUK_POPIS: MTVU_LABELS[r.code] || "", ODHAD: 0 },
    geometry: { rings: [[[r.s, -1], [r.e, -1], [r.e, 1], [r.s, 1], [r.s, -1]].map(([t, u]) => frame.toLonLat(normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u))] } })) };
}

// The steps app.js cutAt runs after deriveProfile (no orthophoto lanes, no AI model, no signs).
function finish(result, tags, near, dir, osm, frame, estimate) {
  lanesFromShoulders(result.segments, tags);
  splitTwoWayLane(result.segments, tags);
  capWideLanes(result.segments, tags);
  pedestrianZone(result.segments, tags, { measured: !estimate });
  if (estimate) trackAlongRoad(result.segments, tags, !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0);
  if (result.extent) { const c = crossFromA(osm, frame, dir, result.extent); carveCycleways(result.segments, c); carveTramTracks(result.segments, c); }
  return result.segments.map((x) => [x.type, +x.width.toFixed(2)]);
}

const rows = JSON.parse(await fs.readFile(path.join(ROOT, "sample.json"), "utf8"));
const outDc = [], outOsm = [], outDc2 = [];
// Variant (after the first score, so tuned on this sample: REPORT.md says so): the inventory's TOTALTRAVELLANES kept
// where the app's rule of 2 × 2.5 m from 5.0 m (derive.js splitTwoWayLane) merged a two-way roadway of 16 ft into one
// lane: the widest lane is halved while there are fewer lanes than the inventory's and it is 4 m or wider.
function inventoryLanes(parts, n) {
  parts = parts.map((p) => [...p]);
  const lane = (t) => /^pruh/.test(t);
  while (parts.filter((p) => lane(p[0])).length < n) {
    const i = parts.reduce((b, p, k) => (lane(p[0]) && (b < 0 || p[1] > parts[b][1]) ? k : b), -1);
    if (i < 0 || parts[i][1] < 4) break;
    const w = +(parts[i][1] / 2).toFixed(2);
    parts.splice(i, 1, [parts[i][0], w], [parts[i][0], w]);
  }
  return parts;
}
for (const r of rows) {
  const frame = localFrame(r.lat, r.lon), osm = await osmAround(r.lat, r.lon, 80);
  const way = osm.elements.find((e) => e.type === "way" && e.id === r.wayId);
  const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat)), near = { ...snapToWay(pts, [0, 0]), way, pts };
  const b = (r.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const reach = { left: MAX_REACH, right: MAX_REACH };
  const ends = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
  const bbox = [Math.min(...ends.map((e) => e[0])) - PAD, Math.min(...ends.map((e) => e[1])) - PAD, Math.max(...ends.map((e) => e[0])) + PAD, Math.max(...ends.map((e) => e[1])) + PAD].join(",");
  const [roads, walks, bldg, sub] = [await q(`${PLAN}/10`, bbox), await q(`${PLAN}/11`, bbox), await q(`${PLAN}/1`, bbox), await q(SUB, bbox, "*")];
  const runs = runsAlong([[1, bldg], [11, walks], [10, roads]], frame, normal);
  const block = blockOf(sub, frame, dir);
  const tags = { ...way.tags };
  let parkSides = null;
  if (block) {
    const a = block.a;
    if (+a.TOTALTRAVELLANES > 0) tags.lanes = String(a.TOTALTRAVELLANES);
    parkSides = carveParking(runs, block, way.tags);
    const bike = ["BIKELANE_CONVENTIONAL", "BIKELANE_BUFFERED", "BIKELANE_PROTECTED"].map((k) => a[k]).find(Boolean);
    if (bike && !Object.keys(tags).some((k) => /^cycleway/.test(k))) {
      if (bike === "BD") tags["cycleway:both"] = "lane";
      else tags[`cycleway:${(bike === "OB") === block.along ? "right" : "left"}`] = "lane"; // OB: along the line, on its right
    }
  }
  const tway = { ...way, tags };
  const polys = mtvuPolygons(features(runs, frame, dir, normal), frame);
  const args = { center: [0, 0], dir, half: HALF, polys, osm, frame, way: tway, tracks: [], parking: [], lines: [], reach, noParkGuess: !!block, osmParkGive: true };
  const res = deriveProfile(args);
  const a = block?.a;
  outDc.push({ id: r.id, country: "US", town: "washington", parts: finish(res, tags, near, dir, osm, frame, !!res.estimate),
    sources: { estimate: !!res.estimate, block: a ? { name: a.ROUTENAME, lanes: a.TOTALTRAVELLANES, laneW: a.TOTALTRAVELLANEWIDTH, park: a.TOTALPARKINGLANES, parkW: a.TOTALPARKINGLANEWIDTH, rpp: a.RPPSIDE, dir: a.SUMMARYDIRECTION, d: +block.d.toFixed(1), parkSides } : null },
    runs: runs.map((x) => [x.code, +x.s.toFixed(1), +x.e.toFixed(1)]) });
  outDc2.push({ ...outDc.at(-1), parts: a && +a.TOTALTRAVELLANES > 1 ? inventoryLanes(outDc.at(-1).parts, +a.TOTALTRAVELLANES) : outDc.at(-1).parts });
  // The baseline: OSM alone.
  const base = deriveProfile({ ...args, polys: [], way, noParkGuess: false });
  let parts, how = "estimateFromOsm";
  try {
    const fb = orthoOsmPolys({ osm, frame, dir, way, st: null, mapRuns: [] });
    if (fb) { const again = deriveProfile({ ...args, polys: fb, way, noParkGuess: false }); if (!again.estimate) { parts = finish(trimToEnds(again, fb.ends), way.tags, near, dir, osm, frame, true); how = "orthoOsmPolys bez snímku"; } }
  } catch (e) { how = `estimateFromOsm (${e.message})`; }
  parts ??= finish(base, way.tags, near, dir, osm, frame, true);
  outOsm.push({ id: r.id, country: "US", town: "washington", parts, sources: { how } });
  console.log(r.id, r.name, block ? `blok ${a.TOTALTRAVELLANES} pruhy, stání ${a.TOTALPARKINGLANES}` : "bez bloku", "|", outDc.at(-1).parts.map((p) => `${p[0]} ${p[1]}`).join(", "), "|| OSM:", how, parts.map((p) => p[0]).join(","));
}
await fs.writeFile(path.join(DATA, "app-dc.json"), JSON.stringify(outDc, null, 1));
await fs.writeFile(path.join(DATA, "app-dc-lanes.json"), JSON.stringify(outDc2, null, 1));
await fs.writeFile(path.join(DATA, "app-osm.json"), JSON.stringify(outOsm, null, 1));
