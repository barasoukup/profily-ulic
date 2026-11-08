// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
// Geometry works in a local metric frame (x east, y north, metres) around the cut centre.
import { typeFromMtvu, isBuilding, isMinorStructure, DEFAULT_WIDTH } from "./types.js";

const STEP = 0.05; // sampling step along the cut (m)
const MIN_RUN = 0.3; // runs narrower than this merge into a neighbour (m)
export const MAX_REACH = 22; // default reach of the profile from the street axis on each side (m)
const WALL_MAX = 2; // "ostatní stavby" narrower than this are walls / parapets, not a structure ending the street (m)
const OPEN_LAND = 8; // greenery at least this wide ends the profile as open surroundings (m)
// Outer half-width of a tram track lane from its axis (m). IPR Manuál tvorby veřejných
// prostranství C.2: double-track belt 6.5 m at 3.0 m track spacing, 7 m at 3.5 m,
// i.e. 1.75 m from each outer axis; between tracks the space splits at the midpoint.
const TRAM_HALF = 1.75;
const CAR_MIN = 2.5; // narrowest leftover space treated as a separate car lane (m)
const TREE_REACH = 8; // single trees this close to the cut count as standing in it (m)
const TREE_STRIP = 1.5; // width of a tree strip carved out of a sidewalk (m)
const ITEM_REACH = 6; // furniture this close to the cut (along the street) is drawn in the profile (m)
const STOP_REACH = 40; // a shelter takes the tram/bus kind of the nearest stop node this close (m)
const PLATFORM_STRIP = 3; // waiting area of a stop along the curb of a wide sidewalk (m)
const END_CLEARANCE = 12; // keep the cut this far from the ends of a way, away from junctions (m)

export function localFrame(lat0, lon0) {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110574;
  return {
    toXY: (lon, lat) => [(lon - lon0) * kx, (lat - lat0) * ky],
    toLonLat: (x, y) => [lon0 + x / kx, lat0 + y / ky],
  };
}

const MINOR = new Set(["footway", "path", "steps", "cycleway", "pedestrian", "service", "track", "corridor", "platform", "construction", "proposed"]);

function closestOnPolyline(pts, p) {
  let best = { d: Infinity };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2));
    const qx = ax + t * dx, qy = ay + t * dy;
    const d = Math.hypot(p[0] - qx, p[1] - qy);
    if (d < best.d) {
      const len = Math.sqrt(len2);
      best = { d, point: [qx, qy], dir: [dx / len, dy / len], index: i };
    }
  }
  return best;
}

// Nearest street (highway way) to a point; minor ways only win when much closer.
export function nearestStreet(osm, frame, p) {
  let best = null;
  for (const el of osm.elements || []) {
    if (el.type !== "way" || !el.tags?.highway || !el.geometry) continue;
    // Indoor corridors and passages through buildings are never the street being cut.
    if (el.tags.highway === "corridor" || el.tags.indoor === "yes" || el.tags.tunnel === "building_passage" || isUnderground(el.tags)) continue;
    const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
    const c = closestOnPolyline(pts, p);
    const sidewalk = ["sidewalk", "crossing"].includes(el.tags.footway);
    const score = c.d + (sidewalk ? 25 : MINOR.has(el.tags.highway) ? 10 : 0);
    if (!best || score < best.score) best = { ...c, score, way: el, pts };
  }
  return best;
}

export function snapToWay(wayPts, p) {
  return closestOnPolyline(wayPts, p);
}

// Move a snapped point along the way so it stays END_CLEARANCE from both ends
// (way ends are usually junctions, where a perpendicular cut runs along the roadway).
export function awayFromEnds(pts, near) {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  if (total < 2 * END_CLEARANCE) return near;
  let at = lens.slice(0, near.index).reduce((a, b) => a + b, 0) +
    Math.hypot(near.point[0] - pts[near.index][0], near.point[1] - pts[near.index][1]);
  let clamped = Math.max(END_CLEARANCE, Math.min(total - END_CLEARANCE, at));
  if (clamped === at) return near;
  for (let i = 0; i < lens.length; i++) {
    if ((clamped <= lens[i] && lens[i] > 0) || i === lens.length - 1) {
      const t = Math.min(1, clamped / (lens[i] || 1));
      const [a, b] = [pts[i], pts[i + 1]];
      const dir = [(b[0] - a[0]) / lens[i], (b[1] - a[1]) / lens[i]];
      return { ...near, point: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], dir, index: i };
    }
    clamped -= lens[i];
  }
  return near;
}

const JUNCTION_CLEARANCE = 15; // keep the cut this far from where another street joins (m)
const CROSSING_CLEARANCE = 6; // …and from a pedestrian crossing (m)

// Move a snapped point along its way away from junctions and pedestrian crossings, where a
// perpendicular cut runs along a side street or over a zebra. Junctions are nodes the way shares
// with another street (its plain continuation under the same name does not count); the way ends
// keep END_CLEARANCE as before. The point stays on its own way, as close to the click as possible.
export function awayFromJunctions(osm, frame, near) {
  const geom = near.way.geometry, pts = near.pts;
  const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
  const idx = new Map(geom.map((g, i) => [key(g), i]));
  const lastI = geom.length - 1;
  const hits = [];
  for (const el of osm.elements || []) {
    if (el.type !== "way" || el.id === near.way.id || !el.tags?.highway || !el.geometry) continue;
    const crossing = el.tags.footway === "crossing" || el.tags.cycleway === "crossing";
    if (MINOR.has(el.tags.highway) && !crossing) continue;
    el.geometry.forEach((g, j) => {
      const i = idx.get(key(g));
      if (i === undefined) return;
      const endToEnd = (i === 0 || i === lastI) && (j === 0 || j === el.geometry.length - 1);
      if (!crossing && endToEnd && el.tags.name === near.way.tags.name) return; // the street goes on
      hits.push({ p: pts[i], clear: crossing ? CROSSING_CLEARANCE : JUNCTION_CLEARANCE });
    });
  }
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const at = (d) => {
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const t = Math.min(1, d / (lens[i] || 1));
        const [a, b] = [pts[i], pts[i + 1]];
        return { point: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], dir: [(b[0] - a[0]) / (lens[i] || 1), (b[1] - a[1]) / (lens[i] || 1)], index: i };
      }
      d -= lens[i];
    }
  };
  // Slack of a position: how far it is past the clearance of the nearest junction or way end.
  const slack = (d, p) => Math.min(
    Math.min(d, total - d) - Math.min(END_CLEARANCE, total / 2),
    ...hits.map((h) => Math.hypot(p[0] - h.p[0], p[1] - h.p[1]) - h.clear),
  );
  const start = lens.slice(0, near.index).reduce((a, b) => a + b, 0) +
    Math.hypot(near.point[0] - pts[near.index][0], near.point[1] - pts[near.index][1]);
  if (slack(start, near.point) >= 0) return near;
  let best = null;
  for (let d = 0; d <= total; d += 1) {
    const c = at(d);
    const sl = slack(d, c.point);
    const score = sl >= 0 ? Math.abs(d - start) : 1e6 - sl; // closest free spot, else the freest
    if (!best || score < best.score) best = { ...c, score };
  }
  return best ? { ...near, point: best.point, dir: best.dir, index: best.index } : near;
}

function bboxOf(ring) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

// Even-odd test over all rings (outer rings and holes alike).
function inside(rings, x, y) {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
}

// On-street parking mapped in OSM as separate areas (parking:both=separate). The technical
// map often draws these bays as sidewalk, so they take priority over MTVU.
const OSM_PARKING = 9704;
const STREET_PARKING = new Set(["street_side", "lane", "on_kerb", "half_on_kerb", "shoulder"]);

const OSM_PLATFORM = 9800;
const ORIENT = { parallel: "podelne", diagonal: "sikme", perpendicular: "kolme" };
// Without a tag, the depth of the parking strip tells the orientation (a car is ~2 m wide, ~4.5 m long).
const orientFromDepth = (w) => (w < 3.2 ? "podelne" : w < PERP_MIN ? "sikme" : "kolme");
// ČSN 73 6056: perpendicular stalls are 5.0 m deep, 4.5 m where cars overhang the kerb.
export const PERP_MIN = 4.5;

// TSK parking sections carry the number of stalls (PS_ZPS): the section length along the
// street per stall tells the orientation (parallel ~5.5–6.5 m, angled ~3.5 m, perpendicular
// ~2.5 m, more with driveways and trees in between). The depth across the street settles
// borderline cases: a perpendicular stall needs ~5 m, a parallel one ~2–2.5 m.
function orientFromStalls(poly, dir) {
  const ring = poly.rings[0];
  const along = ring.map(([x, y]) => x * dir[0] + y * dir[1]);
  const length = Math.max(...along) - Math.min(...along);
  // Mean depth = area / length, robust on curved streets.
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const depth = Math.abs(area) / 2 / (length || 1);
  if (depth >= 4.9) return "kolme";
  if (depth < 3) return "podelne";
  if (poly.count < 2) return depth >= 4 ? "sikme" : undefined;
  const perStall = length / poly.count;
  // A section 4 m deep or more cannot be parallel parking (driveways between stalls inflate the length per stall).
  if (depth >= 4) return perStall >= 3.4 ? "sikme" : "kolme";
  return perStall >= 4.8 ? "podelne" : perStall >= 3.4 ? "sikme" : "kolme";
}

// Parking sections of the paid parking zones (TSK): surveyed, so they win over OSM parking areas.
const TSK_PARKING = 9705;
const TSK_CODES = { useky: 9705, ztp: 9706, zasobovani: 9707, specialni: 9708 };
const isTskParking = (c) => c >= 9705 && c <= 9708;
// Restaurant terraces (OSM leisure=outdoor_seating areas) take part of a sidewalk.
const OSM_OUTDOOR = 9900;

// Below the street surface: metro platforms and passages (layer/level below 0 in a tunnel), e.g. Můstek
// under Václavské náměstí. They are not part of the street profile.
const isUnderground = (t) => (t?.tunnel && t.tunnel !== "no") && (parseFloat(t.layer) < 0 || parseFloat(t.level) < 0) ||
  t?.subway === "yes" || t?.location === "underground";
const isPlatformTags = (t) => (t?.public_transport === "platform" || t?.railway === "platform" || t?.highway === "platform") && !isUnderground(t);

function osmPlatformPolygons(osm, frame) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && isPlatformTags(el.tags))
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      return { code: OSM_PLATFORM, rings, bbox: bboxOf(rings[0]) };
    });
}

function osmOutdoorPolygons(osm, frame) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && el.tags?.leisure === "outdoor_seating")
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      return { code: OSM_OUTDOOR, rings, bbox: bboxOf(rings[0]) };
    });
}

function osmParkingPolygons(osm, frame) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && el.tags?.amenity === "parking" && STREET_PARKING.has(el.tags.parking))
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      return { code: OSM_PARKING, orient: ORIENT[el.tags.orientation], rings, bbox: bboxOf(rings[0]) };
    });
}

// Plain polygons from an ArcGIS JSON response (e.g. TSK parking sections), in local coordinates.
export function esriPolygons(json, frame) {
  return (json.features || []).map((f) => {
    const rings = f.geometry.rings.map((r) => r.map(([lon, lat]) => frame.toXY(lon, lat)));
    return { rings, bbox: bboxOf(rings.flat()), count: Number(f.attributes?.PS_ZPS) || 0, kind: f.attributes?.KIND || "useky" };
  });
}

export function mtvuPolygons(json, frame) {
  return (json.features || []).map((f) => {
    const rings = f.geometry.rings.map((r) => r.map(([lon, lat]) => frame.toXY(lon, lat)));
    return {
      code: Number(f.attributes.CTVUK_KOD),
      label: (f.attributes.CTVUK_POPIS || "").trim(),
      rings,
      bbox: bboxOf(rings.flat()),
      lonlat: f.geometry.rings.map((r) => r.map(([lon, lat]) => [lat, lon])),
    };
  });
}

// Classify the cut: list of runs {code, s, e} with s < e in metres along the normal (+ = left of way).
function classify(center, normal, half, polys) {
  const runs = [];
  for (let t = -half; t <= half + 1e-9; t += STEP) {
    const x = center[0] + normal[0] * t, y = center[1] + normal[1] * t;
    let code = null, orient, use;
    for (const p of polys) {
      const [x0, y0, x1, y1] = p.bbox;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      if (inside(p.rings, x, y)) { code = p.code; orient = p.orient; use = p.use; break; }
    }
    const last = runs[runs.length - 1];
    if (last && last.code === code) last.e = t + STEP / 2;
    else runs.push({ code, orient, use, s: t - STEP / 2, e: t + STEP / 2 });
  }
  runs[0].s = -half;
  runs[runs.length - 1].e = half;
  return runs;
}

function mergeTiny(runs) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (r.e - r.s >= MIN_RUN || runs.length === 1) continue;
      const prev = runs[i - 1], next = runs[i + 1];
      const target = !prev ? next : !next ? prev : prev.e - prev.s >= next.e - next.s ? prev : next;
      target.s = Math.min(target.s, r.s);
      target.e = Math.max(target.e, r.e);
      runs.splice(i, 1);
      changed = true;
      break;
    }
    for (let i = 0; i < runs.length - 1; i++) {
      if (runs[i].code === runs[i + 1].code) {
        runs[i].e = runs[i + 1].e;
        runs.splice(i + 1, 1);
        changed = true;
        break;
      }
    }
  }
  return runs;
}

// OSM parking areas and MTVU curbs rarely line up exactly; narrow roadway or sidewalk
// strips left next to a parking bay belong to the bay.
function absorbParkingSlivers(runs) {
  const sliver = (r) => ((r.code === 701 || r.code === 700) && r.e - r.s < 1.2) || (r.code === 702 && r.e - r.s < 0.6);
  const bay = (r) => r?.code === OSM_PARKING || isTskParking(r?.code);
  for (let i = 0; i < runs.length; i++) {
    const near = bay(runs[i - 1]) ? runs[i - 1] : bay(runs[i + 1]) ? runs[i + 1] : null;
    if (near && sliver(runs[i])) runs[i].code = near.code;
  }
  return mergeTiny(runs);
}

// Where OSM ways cross the cut, as offsets along the normal.
function crossings(osm, frame, center, normal, half) {
  const a = [center[0] - normal[0] * half, center[1] - normal[1] * half];
  const b = [center[0] + normal[0] * half, center[1] + normal[1] * half];
  const out = [];
  for (const el of osm.elements || []) {
    if (el.type !== "way" || !el.geometry) continue;
    const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = segIntersect(a, b, pts[i], pts[i + 1]);
      if (hit === null) continue;
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy) || 1;
      out.push({ t: hit * 2 * half - half, way: el, d: [dx / len, dy / len] });
    }
  }
  return out;
}

// Crossings of plain polylines (local coordinates) with the cut.
function lineCrossings(lines, center, normal, half) {
  const a = [center[0] - normal[0] * half, center[1] - normal[1] * half];
  const b = [center[0] + normal[0] * half, center[1] + normal[1] * half];
  const out = [];
  for (const pts of lines) {
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = segIntersect(a, b, pts[i], pts[i + 1]);
      if (hit !== null) out.push(hit * 2 * half - half);
    }
  }
  return out;
}

export function trackLines(json, frame) {
  return (json.features || [])
    .filter((f) => Number(f.attributes?.CTMTP_KOD ?? 55010) === 55010)
    .flatMap((f) => (f.geometry?.paths || []).map((p) => p.map(([lon, lat]) => frame.toXY(lon, lat))));
}

// Barrier and slope lines of the technical map (everything but track axes), with their code.
export function techLines(json, frame) {
  return (json.features || [])
    .filter((f) => Number(f.attributes?.CTMTP_KOD) !== 55010)
    .flatMap((f) => (f.geometry?.paths || []).map((p) => ({
      code: Number(f.attributes.CTMTP_KOD), pts: p.map(([lon, lat]) => frame.toXY(lon, lat)),
    })));
}

function segIntersect(p, p2, q, q2) {
  const r = [p2[0] - p[0], p2[1] - p[1]];
  const s = [q2[0] - q[0], q2[1] - q[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const qp = [q[0] - p[0], q[1] - p[1]];
  const t = (qp[0] * s[1] - qp[1] * s[0]) / den;
  const u = (qp[0] * r[1] - qp[1] * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

const tag = (tags, ...keys) => keys.map((k) => tags[k]).find((v) => v !== undefined);

const COLOURS = { red: "#c0503f", green: "#5f9e4a", blue: "#3f6fb0" };
const isOnewayTags = (t) => ["yes", "1", "true", "-1"].includes(t?.oneway);
// The way side on the drivers' left: the way's left, or its right on oneway=-1 (traffic against the geometry).
const drivingLeft = (t) => (t?.oneway === "-1" ? "right" : "left");

function sideTags(tags, side) {
  // New scheme: parking:<side>=lane|street_side|yes + parking:<side>:orientation; old: parking:lane:<side>=parallel…
  const parking = tag(tags, `parking:${side}`, "parking:both", `parking:lane:${side}`, "parking:lane:both");
  const orientation = tag(tags, `parking:${side}:orientation`, "parking:both:orientation") || parking;
  // On a one-way street the side-less tags (cycleway=*, busway=*) describe its right side.
  const generic = !(isOnewayTags(tags) && side === drivingLeft(tags));
  // …except opposite_* values, which describe the contraflow on its left.
  const opposite = String(tags.cycleway || "").startsWith("opposite");
  const cycle = tag(tags, `cycleway:${side}`, "cycleway:both") ??
    (generic ? (opposite ? undefined : tags.cycleway) : opposite ? tags.cycleway : undefined);
  return {
    parking: ["lane", "street_side", "yes", "parallel", "diagonal", "perpendicular"].includes(parking),
    // Tagged as no parking here, or mapped as separate areas (which then would have crossed the cut).
    parkingNo: ["no", "none", "separate", "on_kerb", "half_on_kerb"].includes(parking),
    parkingWidth: orientation === "perpendicular" ? 5 : orientation === "diagonal" ? 4.5 : 2,
    parkingOrient: ORIENT[orientation],
    // Cars parked up on the sidewalk: fully (on_kerb) or with two wheels (half_on_kerb).
    kerbDepth: parking === "on_kerb" ? (orientation === "perpendicular" ? 5 : orientation === "diagonal" ? 4.5 : 2)
      : parking === "half_on_kerb" ? 1 : 0,
    bike: ["lane", "opposite_lane"].includes(cycle) ? "cyklopruh" : cycle === "soft_lane" ? "ochranny_pruh" : null,
    sharrow: cycle === "shared_lane",
    // Cyclists allowed in the bus lane along this curb (vyhrazený pruh BUS + cyklisté).
    shareBus: cycle === "share_busway" || cycle === "opposite_share_busway",
    // Contraflow cycling: explicit opposite_* values, cycleway:<side>:oneway=-1, or the left side of a
    // one-way street open to cyclists both ways (oneway:bicycle=no), where the contraflow is marked.
    contra: ["opposite_lane", "opposite", "opposite_track"].includes(cycle) || tags[`cycleway:${side}:oneway`] === "-1"
      || (side === drivingLeft(tags) && isOnewayTags(tags) && tags["oneway:bicycle"] === "no" && !!cycle && cycle !== "no"),
    osmSide: side,
    bikeColor: COLOURS[tag(tags, `cycleway:${side}:surface:colour`, "cycleway:both:surface:colour", "cycleway:surface:colour")],
    // Bus lane along this curb: busway:<side>=lane (old scheme: busway=lane for both sides).
    bus: ["lane", "opposite_lane"].includes(generic ? tag(tags, `busway:${side}`, "busway:both", "busway") : tag(tags, `busway:${side}`, "busway:both")),
  };
}

const BIKE_WIDTH = { cyklopruh: 1.5, ochranny_pruh: 1.25 };
// A bike lane next to parking includes the door-opening clearance (TP 179 tab. 2, IPR Manuál
// C.2): 1.75 m beside parallel parking, 2.0 m beside perpendicular or angled parking.
const bikeWidth = (type, parkOrient) =>
  type !== "cyklopruh" || !parkOrient ? BIKE_WIDTH[type] : parkOrient === "podelne" ? 1.75 : 2;
const ISLAND_MAX = 6; // widest paved strip between carriageways still taken as an island (m)
const MIN_LANE = 2.5; // narrowest driving lane kept when curb strips are carved out (m)
// Widest driving lane before the rest becomes a shoulder / hatched area (m). ČSN 73 6110 lanes
// are 3.0–3.5 m, but Prague streets commonly have 4 m lanes (Bára: an 8 m street is two 4 m lanes,
// no shoulder); motorways and expressways 3.75 m with a hard shoulder.
const LANE_CAP = {
  motorway: 3.75, trunk: 3.75, motorway_link: 3.75, trunk_link: 3.75,
  // Local streets: a wider lane is normal (cars pass the parked ones), no shoulder there.
  residential: 4.5, unclassified: 4.5, service: 4.5,
};
const LANE_CAP_DEFAULT = 4;
const KRAJNICE_MIN = 1; // narrowest shoulder / hatched strip drawn (m)
// Streets where cars commonly park at the curb even where neither TSK nor OSM says so.
// Not on main streets (secondary, tertiary and up): there the curb is mostly kept free (Bára).
const PARK_GUESS = new Set(["residential", "living_street", "unclassified"]);
const LOCAL = new Set(["residential", "living_street", "unclassified"]);
const GUESS_PARK_W = 2; // estimated parallel parking strip (m)
const GUESS_LANE_MIN = 3; // a driving lane keeps at least this much next to estimated parking (m)
const turnList = (v) => (v ? v.split("|").map((x) => x || "none") : null);

// Split one roadway run [s,e] into parking, bike and driving/tram lanes using OSM tags.
// ctx.dirAt(t): driving direction ("forward"/"backward" relative to the cut's street) at offset t,
// from the nearest OSM road axis, so both carriageways of a dual carriageway are right.
// ctx.along: the run's own OSM way points the same way as the cut's street (its left = our left).
// ctx.parked: sides ("L"/"R") already having a parking bay next to this run.
function splitRoadway(run, ctx) {
  const { tags, trams, dirAt, along, single, parked, sides } = ctx;
  // A roadway too narrow for the tagged (or default) lanes holds as many as fit, at least one.
  let lanesTotal = Math.max(1, Math.min(ctx.lanesTotal, Math.floor((run.e - run.s) / MIN_LANE)));
  let s = run.s, e = run.e;
  const width = e - s;
  // OSM left/right follow the way; L/R here follow the cut's street (L = larger t).
  const sideL = sides?.L ?? sideTags(tags, along ? "left" : "right");
  const sideR = sides?.R ?? sideTags(tags, along ? "right" : "left");
  // Curb strips are added while the driving lanes keep at least MIN_LANE each.
  const edge = [];
  let left = width - lanesTotal * MIN_LANE;
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.bike) continue;
    const w = bikeWidth(st.bike, st.parking || parked.includes(side) ? st.parkingOrient || "podelne" : null);
    if (left >= w) { edge.push({ side, type: st.bike, w }); left -= w; }
  }
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (st.parking && !parked.includes(side) && left >= st.parkingWidth) {
      edge.push({ side, type: "parkovani", w: st.parkingWidth, orient: st.parkingOrient });
      left -= st.parkingWidth;
    }
  }
  // Cars parked at a curb with a sidewalk, though no data says so: a parallel strip as an estimate
  // where the lanes stay at least GUESS_LANE_MIN wide (one-way streets 6–7 m wide, wide two-way ones).
  // A local street without a lanes tag only needs one shared lane between the parked cars
  // (e.g. Dářská: 6.65 m = parking 2 + lane 2.65 + parking 2).
  // Only outside the paid parking zones (Bára): inside them TSK has surveyed every stall.
  if (!trams.length && !ctx.inZps && PARK_GUESS.has(tags.highway)) {
    const shared = LOCAL.has(tags.highway) && !tags.lanes;
    for (const [side, st] of [["R", sideR], ["L", sideL]]) {
      if (!ctx.kerbWalk?.includes(side) || parked.includes(side) || st.parkingNo || edge.some((x) => x.side === side && x.type === "parkovani")) continue;
      const rest = width - edge.reduce((a, x) => a + x.w, 0) - GUESS_PARK_W;
      if (rest < (shared ? MIN_LANE : lanesTotal * GUESS_LANE_MIN)) continue;
      edge.push({ side, type: "parkovani", w: GUESS_PARK_W, orient: "podelne", source: "odhad" });
    }
    // Fewer lanes fit between the estimated parking (two lanes of a local street need 2 × 2.75 m).
    const rest = width - edge.reduce((a, x) => a + x.w, 0);
    lanesTotal = Math.max(1, Math.min(lanesTotal, Math.floor(rest / (shared ? 2.75 : MIN_LANE))));
  }
  // Parking sits at the curb, the bike lane between it and the traffic.
  edge.sort((a, b) => (a.type === "parkovani" ? -1 : 0) - (b.type === "parkovani" ? -1 : 0));
  const leftEdge = [], rightEdge = [];
  for (const x of edge) {
    if (x.side === "L") { leftEdge.push({ type: x.type, s: e - x.w, e, orient: x.orient, source: x.source }); e -= x.w; }
    else { rightEdge.push({ type: x.type, s, e: s + x.w, orient: x.orient, source: x.source }); s += x.w; }
  }
  const mid = trams.length ? tramLanes(s, e, trams, dirAt) : [];
  if (!trams.length) {
    // One lane on a two-way street carries both directions (no arrow).
    const twoWaySingle = lanesTotal === 1 && !isOnewayTags(tags) && tags.junction !== "roundabout";
    // Lanes wider than the cap leave the rest as a shoulder / hatched area at the curbs (estimate):
    // the technical map has no lane markings, so an even split would make 5–8 m lanes.
    const cap = LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const excess = (e - s) - lanesTotal * cap;
    // Strips under KRAJNICE_MIN are left in the lanes (a lane 3.7 m wide is no error).
    if (!twoWaySingle && excess >= KRAJNICE_MIN) {
      const both = excess >= 2 * KRAJNICE_MIN;
      const wR = both ? excess / 2 : excess, wL = both ? excess / 2 : 0;
      rightEdge.push({ type: "krajnice", s, e: s + wR, source: "odhad" });
      s += wR;
      if (wL) { leftEdge.unshift({ type: "krajnice", s: e - wL, e, source: "odhad" }); e -= wL; }
    }
    const lw = (e - s) / lanesTotal;
    for (let i = 0; i < lanesTotal; i++) {
      const ls = s + i * lw, le = ls + lw;
      mid.push({ type: "pruh", s: ls, e: le, dir: twoWaySingle ? undefined : dirAt((ls + le) / 2) });
    }
    if (single) applyLaneTags(mid, tags, along);
  }
  // Shared lane markings (piktokoridor) sit in the lane next to the curb; cyclists ride with
  // the traffic, or against it on a contraflow side.
  const flip = (d) => (d === "backward" ? "forward" : "backward");
  // tramLanes() lists car lanes before the tram envelopes: sort so the ends are the curb lanes.
  mid.sort((a, b) => a.s - b.s);
  const curbLane = { R: mid[0], L: mid.at(-1) };
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    const lane = curbLane[side];
    if (st.sharrow && lane?.type === "pruh") {
      lane.type = "pruh_piktokoridor";
      lane.bikeDir = st.contra ? flip(lane.dir) : lane.dir;
    }
  }
  for (const x of [...rightEdge, ...leftEdge]) {
    if (x.type !== "cyklopruh" && x.type !== "ochranny_pruh") continue;
    const side = x.s >= e - 1e-6 ? "L" : "R";
    const st = side === "L" ? sideL : sideR;
    const base = curbLane[side]?.dir || "forward";
    x.dir = st.contra ? flip(base) : base;
    if (st.bikeColor) x.color = st.bikeColor;
  }
  // Bus lanes along the curb.
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    const lane = curbLane[side];
    // bus:lanes / psv:lanes, when present, already placed the bus lanes lane by lane.
    const perLane = single && Object.keys(tags).some((k) => k.startsWith("bus:lanes") || k.startsWith("psv:lanes"));
    if (st.bus && !perLane && lane?.type === "pruh" && mid.length > 1) lane.type = "bus";
    if (st.shareBus && lane?.type === "bus") lane.type = "bus_cyklo";
  }
  // One-way street open to cyclists both ways with no marking: they share the lane in contraflow.
  const anyContra = [sideL, sideR].some((st) => st.contra);
  if (isOnewayTags(tags) && tags["oneway:bicycle"] === "no" && !anyContra) {
    const wayLeft = sideL.osmSide === drivingLeft(tags) ? "L" : "R";
    const lane = curbLane[wayLeft];
    if (lane && !lane.bikeDir) lane.bikeDir = flip(lane.dir);
  }
  return [...rightEdge, ...mid, ...leftEdge]
    .map((x) => ({ type: x.type, s: x.s, e: x.e, dir: x.dir, turn: x.turn, orient: x.orient, bikeDir: x.bikeDir, color: x.color, source: x.source || "osm" }))
    .sort((a, b) => a.s - b.s);
}

// lanes:forward / lanes:backward and turn:lanes(:forward|:backward) for a single carriageway.
// Lanes come in t order (right side of the cut's street first).
function applyLaneTags(lanes, tags, along) {
  const oneway = isOnewayTags(tags);
  const wayFwd = parseInt(tags["lanes:forward"], 10), wayBwd = parseInt(tags["lanes:backward"], 10);
  // Lanes travelling with the cut's street sit on its right (low t).
  if (!oneway && wayFwd >= 0 && wayBwd >= 0 && wayFwd + wayBwd === lanes.length) {
    const ours = along ? wayFwd : wayBwd;
    lanes.forEach((l, i) => (l.dir = i < ours ? "forward" : "backward"));
  }
  const wayFwdTurns = turnList(tags["turn:lanes:forward"] || (oneway ? tags["turn:lanes"] : undefined));
  const wayBwdTurns = turnList(tags["turn:lanes:backward"]);
  const sameAsWay = along !== (tags.oneway === "-1");
  const fwdTurns = sameAsWay ? wayFwdTurns : wayBwdTurns;
  const bwdTurns = sameAsWay ? wayBwdTurns : wayFwdTurns;
  // turn:lanes are listed from the driver's left: for our forward lanes that is high t first,
  // for backward lanes low t first.
  const fwd = lanes.filter((l) => l.dir === "forward").reverse();
  const bwd = lanes.filter((l) => l.dir === "backward");
  if (fwdTurns?.length === fwd.length) fwd.forEach((l, i) => (l.turn = fwdTurns[i]));
  if (bwdTurns?.length === bwd.length) bwd.forEach((l, i) => (l.turn = bwdTurns[i]));
  // bus:lanes / psv:lanes list lanes like turn:lanes; "designated" marks a bus lane.
  const busList = (suffix) => turnList(tags[`bus:lanes${suffix}`] || tags[`psv:lanes${suffix}`]);
  // Only "designated" is a bus lane; "yes" / "permissive" just let buses use an ordinary lane.
  const isBus = (v) => v === "designated";
  const wayFwdBus = busList(":forward") || (oneway ? busList("") : null);
  const wayBwdBus = busList(":backward");
  const fwdBus = sameAsWay ? wayFwdBus : wayBwdBus, bwdBus = sameAsWay ? wayBwdBus : wayFwdBus;
  if (fwdBus?.length === fwd.length) fwd.forEach((l, i) => { if (isBus(fwdBus[i])) l.type = "bus"; });
  if (bwdBus?.length === bwd.length) bwd.forEach((l, i) => { if (isBus(bwdBus[i])) l.type = "bus"; });
  // bicycle:lanes marks the bus lanes cyclists may use.
  const bikeList = (suffix) => turnList(tags[`bicycle:lanes${suffix}`]);
  const wayFwdBike = bikeList(":forward") || (oneway ? bikeList("") : null);
  const wayBwdBike = bikeList(":backward");
  const fwdBike = sameAsWay ? wayFwdBike : wayBwdBike, bwdBike = sameAsWay ? wayBwdBike : wayFwdBike;
  const bikeOk = (v) => v === "designated" || v === "yes";
  if (fwdBike?.length === fwd.length) fwd.forEach((l, i) => { if (l.type === "bus" && bikeOk(fwdBike[i])) l.type = "bus_cyklo"; });
  if (bwdBike?.length === bwd.length) bwd.forEach((l, i) => { if (l.type === "bus" && bikeOk(bwdBike[i])) l.type = "bus_cyklo"; });
  // lanes:bus / lanes:psv on a one-way street: that many lanes from the right curb.
  const nBus = parseInt(tags["lanes:bus"] || tags["lanes:psv"], 10);
  if (oneway && nBus > 0 && nBus < lanes.length) {
    const ours = lanes.filter((l) => l.dir === (sameAsWay ? "forward" : "backward"));
    const fromRight = sameAsWay ? ours : [...ours].reverse();
    fromRight.slice(0, nBus).forEach((l) => (l.type = "bus"));
  }
}

// Lanes around tram tracks lying in the roadway: each track gets its swept envelope
// (axis ± TRAM_HALF); leftover space wide enough for a car becomes a driving lane,
// narrower leftovers are added to the neighbouring tram lane.
function tramLanes(s, e, trams, dirAt) {
  const ts = [...trams].sort((a, b) => a - b);
  const src = trams.measured ? "dtm" : "osm";
  const env = ts.map((t) => ({ s: Math.max(s, t - TRAM_HALF), e: Math.min(e, t + TRAM_HALF), t }));
  for (let i = 0; i < env.length - 1; i++) {
    // Overlapping or close envelopes split the space between them in the middle.
    const gap = env[i + 1].s - env[i].e;
    if (gap < CAR_MIN) env[i].e = env[i + 1].s = (env[i].e + env[i + 1].s) / 2;
  }
  const dirOf = dirAt;
  const out = [];
  const carGap = (a, b) => {
    const n = Math.max(1, Math.floor((b - a) / 2.75));
    const w = (b - a) / n;
    for (let k = 0; k < n; k++) out.push({ type: "pruh", s: a + k * w, e: a + (k + 1) * w, dir: dirOf(a + (k + 0.5) * w), source: src });
  };
  if (env[0].s - s >= CAR_MIN) carGap(s, env[0].s); else env[0].s = s;
  for (let i = 0; i < env.length - 1; i++) if (env[i + 1].s - env[i].e >= CAR_MIN) carGap(env[i].e, env[i + 1].s);
  const last = env[env.length - 1];
  if (e - last.e >= CAR_MIN) carGap(last.e, e); else last.e = e;
  // Trams keep right too: tracks right of the middle of the tram belt run with the street.
  const mid = (ts[0] + ts[ts.length - 1]) / 2;
  const trackDir = (t) => (ts.length === 1 ? dirOf(t) : t > mid ? "backward" : "forward");
  for (const x of env) out.push({ type: "tramvaj_v_pruhu", s: x.s, e: x.e, dir: trackDir(x.t), source: src });
  return out;
}

// Offsets along the cut of OSM trees: tree rows crossing the cut and single trees
// within TREE_REACH of it (street trees are spaced along the street, rarely on the cut).
function treePositions(osm, frame, center, normal, half) {
  const rows = (osm.elements || [])
    .filter((el) => el.type === "way" && el.tags?.natural === "tree_row")
    .map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  const ts = lineCrossings(rows, center, normal, half);
  for (const el of osm.elements || []) {
    if (el.type !== "node" || el.tags?.natural !== "tree") continue;
    const [x, y] = frame.toXY(el.geometry[0].lon, el.geometry[0].lat);
    const dx = x - center[0], dy = y - center[1];
    const along = Math.abs(dx * normal[1] - dy * normal[0]);
    if (along <= TREE_REACH) ts.push(dx * normal[0] + dy * normal[1]);
  }
  // Trees of one row sit at nearly the same offset; keep one position per row.
  const out = [];
  for (const t of ts.sort((a, b) => a - b)) {
    if (out.length && t - out.at(-1).last < 1.5) { const c = out.at(-1); c.sum += t; c.n++; c.last = t; }
    else out.push({ sum: t, n: 1, last: t });
  }
  return out.map((c) => c.sum / c.n);
}

// Trees turn a green segment into a tree row, or carve a tree strip (TREE_STRIP wide)
// out of the paved segment holding them.
function insertTrees(segs, trees) {
  let out = segs;
  for (const t of trees) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    if (host?.type === "zelen") { host.type = "stromorad"; continue; }
    if (!host || !WALK.has(host.type)) continue;
    const s = Math.max(host.s, t - TREE_STRIP / 2), e = Math.min(host.e, t + TREE_STRIP / 2);
    // Leftover sidewalk slivers under 0.5 m join the tree strip.
    const strip = { type: "stromorad", s: s - host.s < 0.5 ? host.s : s, e: host.e - e < 0.5 ? host.e : e, source: "osm" };
    const parts = [];
    if (strip.s > host.s) parts.push({ ...host, e: strip.s });
    parts.push(strip);
    if (strip.e < host.e) parts.push({ ...host, s: strip.e });
    out = [...out.slice(0, i), ...parts, ...out.slice(i + 1)];
  }
  return out;
}

// Surfaces people walk on, where trees, platforms and kerb parking can be placed.
const WALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "plocha"]);
const BIKE_OK = new Set(["yes", "permissive", "designated"]);

// What cyclists may do on a sidewalk (MTVU 702), from the OSM way running along it:
// segregated=yes → foot and cycle path side by side (C10: sidewalk + cycle track, split in half),
// bicycle=designated → shared foot and cycle path (C9), bicycle=yes → sidewalk open to cyclists.
// Without a way of its own, the street's sidewalk:<side>:bicycle tag tells.
function sidewalkUse(r, cross, way, axisT, dir) {
  const plain = [{ type: "chodnik", s: r.s, e: r.e, source: "dtm" }];
  const c = cross.find((x) => x.t > r.s && x.t < r.e && ["footway", "path", "cycleway", "pedestrian"].includes(x.way.tags?.highway));
  let t = c?.way.tags;
  if (!t) {
    const own = cross.find((x) => x.way.id === way.id);
    if (!own) return plain;
    const along = own.d[0] * dir[0] + own.d[1] * dir[1] >= 0;
    const osmSide = ((r.s + r.e) / 2 > axisT) === along ? "left" : "right";
    const b = way.tags?.[`sidewalk:${osmSide}:bicycle`] ?? way.tags?.["sidewalk:both:bicycle"] ?? way.tags?.["sidewalk:bicycle"];
    if (!BIKE_OK.has(b)) return plain;
    t = { highway: "footway", bicycle: b };
  }
  const bikes = t.highway === "cycleway" ? "designated" : t.bicycle;
  if (!BIKE_OK.has(bikes)) return plain;
  if (t.segregated === "yes" && r.e - r.s >= 2.5) {
    const m = (r.s + r.e) / 2;
    // The cycle half lies on the roadway side (the side nearer the street axis).
    const bikeLow = Math.abs(r.s - axisT) < Math.abs(r.e - axisT);
    const halves = [{ type: "cyklostezka", source: "osm" }, { type: "chodnik", source: "osm" }];
    if (!bikeLow) halves.reverse();
    return [{ ...halves[0], s: r.s, e: m }, { ...halves[1], s: m, e: r.e }];
  }
  // segregated=no is used only on paths shared by both, even when foot is not tagged designated.
  const shared = bikes === "designated" && (t.highway !== "cycleway" || t.foot === "designated" || t.segregated === "no");
  return [{ type: shared ? "stezka_sdilena" : "chodnik_kola", s: r.s, e: r.e, source: "dtm" }];
}

// A cycle track (MTVU 703) takes its direction from the OSM cycleway running in it: one-way
// tracks ride with their way, two-way tracks split into two halves (keep right).
function cycleTrack(r, cross, dir) {
  const c = cross.find((x) => x.t > r.s && x.t < r.e &&
    (x.way.tags?.highway === "cycleway" || x.way.tags?.bicycle === "designated"));
  if (!c) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const t = c.way.tags;
  const along = c.d[0] * dir[0] + c.d[1] * dir[1] >= 0;
  if (["yes", "1", "true", "-1"].includes(t.oneway)) {
    const fwd = along !== (t.oneway === "-1");
    return [{ type: "cyklostezka", s: r.s, e: r.e, dir: fwd ? "forward" : "backward", source: "dtm" }];
  }
  // TP 179 kap. 4.9: a two-way cycle path is at least 2.5 m wide (one-way min. 2.0 m).
  if (r.e - r.s < 2.5) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const m = (r.s + r.e) / 2;
  return [
    { type: "cyklostezka", s: r.s, e: m, dir: "forward", source: "dtm" },
    { type: "cyklostezka", s: m, e: r.e, dir: "backward", source: "dtm" },
  ];
}

// A narrow raised paved strip between two carriageways is a median / traffic island.
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj", "cyklopruh", "ochranny_pruh", "parkovani", "krajnice"]);
function markIslands(segs) {
  segs.forEach((x, i) => {
    if (!WALK.has(x.type) || x.e - x.s > ISLAND_MAX) return;
    // Between two carriageways: a parking strip (e.g. a small car park beyond the sidewalk) does not count.
    const lane = (y) => ROADWAY.has(y?.type) && y.type !== "parkovani";
    if (lane(segs[i - 1]) && lane(segs[i + 1])) x.type = "delici";
  });
  return segs;
}

// Parking on the sidewalk (on_kerb / half_on_kerb in OSM): the strip of the sidewalk along
// the curb becomes parking, as deep as the parking orientation needs.
function carveKerbParking(segs, reqs) {
  let out = segs;
  for (const q of reqs) {
    const i = out.findIndex((x) => (q.side === "L" ? Math.abs(x.s - q.at) : Math.abs(x.e - q.at)) < 0.1);
    const host = out[i];
    if (!host || !WALK.has(host.type) || host.e - host.s < q.w + 0.5) continue;
    const park = q.side === "L"
      ? { type: "parkovani", s: host.s, e: host.s + q.w, source: "osm", orient: q.orient }
      : { type: "parkovani", s: host.e - q.w, e: host.e, source: "osm", orient: q.orient };
    const rest = q.side === "L" ? { ...host, s: park.e } : { ...host, e: park.s };
    out = [...out.slice(0, i), ...(q.side === "L" ? [park, rest] : [rest, park]), ...out.slice(i + 1)];
  }
  return out;
}

// Public transport platforms crossing the cut (OSM lines along the platform edge).
function platformPositions(osm, frame, center, normal, half) {
  const lines = (osm.elements || [])
    .filter((el) => el.type === "way" && isPlatformTags(el.tags))
    .map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  return lineCrossings(lines, center, normal, half);
}

// A raised island holding a platform becomes the platform; on a wide sidewalk only the
// strip along the curb (PLATFORM_STRIP) is the waiting area of the stop.
function insertPlatforms(segs, platforms, axisT) {
  let out = segs;
  for (const t of platforms) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    if (!host || !(WALK.has(host.type) || ["delici", "nezname"].includes(host.type))) continue;
    if (host.e - host.s <= PLATFORM_STRIP + 1) { host.type = "nastupiste"; host.source = "osm"; continue; }
    const curbAtEnd = (host.s + host.e) / 2 < axisT; // the curb faces the street axis
    const strip = curbAtEnd
      ? { type: "nastupiste", s: host.e - PLATFORM_STRIP, e: host.e, source: "osm" }
      : { type: "nastupiste", s: host.s, e: host.s + PLATFORM_STRIP, source: "osm" };
    const rest = curbAtEnd ? { ...host, e: strip.s } : { ...host, s: strip.e };
    out = [...out.slice(0, i), ...(curbAtEnd ? [rest, strip] : [strip, rest]), ...out.slice(i + 1)];
  }
  return out;
}

// Two parking strips side by side are one parking strip. Next to a TSK section, the extra
// strip of the technical-map parking area (MTVU 704) is the space in front of the stalls,
// which belongs to the driving lane beside it.
function mergeParking(segs) {
  for (let i = 0; i < segs.length - 1; i++) {
    const a = segs[i], b = segs[i + 1];
    if (a.type !== "parkovani" || b.type !== "parkovani") continue;
    const [keep, extra, extraIdx] = b.source === "tsk" && a.source !== "tsk" ? [b, a, i] : [a, b, i + 1];
    const lane = segs[extraIdx === i ? i - 1 : i + 2];
    if (keep.source === "tsk" && extra.source !== "tsk" && ROADWAY.has(lane?.type) && lane.type !== "parkovani") {
      if (extraIdx === i) lane.e = extra.e; else lane.s = extra.s;
      lane.source = "dtm";
    } else {
      keep.s = Math.min(keep.s, extra.s);
      keep.e = Math.max(keep.e, extra.e);
    }
    segs.splice(extraIdx, 1);
    i--;
  }
  return segs;
}

// Perpendicular stalls need PERP_MIN of depth: cars overhang the kerb, so a shallower measured
// strip borrows the missing depth from the sidewalk / green strip behind it.
function perpDepth(segs) {
  segs.forEach((x, i) => {
    if (x.type !== "parkovani" || x.e - x.s >= PERP_MIN) return;
    if ((x.orient || orientFromDepth(x.e - x.s)) !== "kolme") return;
    const need = PERP_MIN - (x.e - x.s);
    const raised = (y) => y && (WALK.has(y.type) || ["zelen", "stromorad"].includes(y.type)) && y.e - y.s > need + 1;
    const prev = segs[i - 1], next = segs[i + 1];
    // The kerb side is the raised neighbour (the other side is the roadway).
    const host = raised(next) && !raised(prev) ? next : raised(prev) && !raised(next) ? prev : null;
    // Nothing to borrow from: a strip this shallow cannot hold perpendicular stalls.
    if (!host) { x.orient = "sikme"; return; }
    if (host === next) { x.e += need; host.s += need; } else { x.s -= need; host.e -= need; }
    x.orient = "kolme";
    x.overhang = true;
  });
  return segs;
}

// Distance from the Old Town Square (km): the inner city of tenements versus the outer estates.
const CENTRE = [14.4208, 50.0875];
const centreKm = ([lon, lat]) => Math.hypot((lon - CENTRE[0]) * 71.5, (lat - CENTRE[1]) * 111.2);

// OSM building containing a point, with building:levels (+ roof:levels) and height when tagged.
function buildingAt(osm, frame, p) {
  for (const el of osm.elements || []) {
    if (el.type !== "area" || !el.tags?.building) continue;
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    const [x0, y0, x1, y1] = bboxOf(rings[0]);
    if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1 || !inside(rings, p[0], p[1])) continue;
    const levels = parseInt(el.tags["building:levels"], 10);
    const roof = parseInt(el.tags["roof:levels"], 10);
    const height = parseFloat(el.tags.height);
    return { levels: levels ? levels + (roof || 0) : undefined, height: height || undefined, type: el.tags.building };
  }
  return null;
}

// Street furniture, barriers and slopes found along the cut, as {kind, t}.
const TECH_ITEM = {
  71522: "svodidlo", 71540: "svodidlo", 61530: "zabradli", 61209: "plot", 61210: "plot", 71210: "plot",
  81210: "plot", 91210: "plot", 61422: "oporna_zed", 71422: "oporna_zed", 81422: "oporna_zed", 81214: "zivy_plot",
  42105: "svah", 42107: "svah",
};
const BARRIER_ITEM = {
  guard_rail: "svodidlo", jersey_barrier: "svodidlo", fence: "plot", wall: "plot", city_wall: "plot",
  retaining_wall: "oporna_zed", hedge: "zivy_plot", handrail: "zabradli",
};

function nodeItem(t) {
  if (t.highway === "street_lamp") return "lampa";
  if (t.amenity === "bench") return "lavicka";
  if (t.amenity === "bicycle_parking") return "stojan_kola";
  if (t.amenity === "bicycle_rental") return "sdilena_kola";
  if (t.amenity === "shelter" || (t.highway === "bus_stop" && t.shelter === "yes")) return "pristresek";
  if (t.amenity === "taxi") return "taxi";
  if (["guidepost", "board", "map"].includes(t.information)) return "rozcestnik";
  if (t.barrier === "bollard") return "sloupek";
  if (t.barrier === "planter") return "kvetinac";
  if (t.leisure === "outdoor_seating") return "zahradka";
  return null;
}

// Tram or bus stop a node marks: true (tram), false (bus), null (neither).
function stopMode(t) {
  if (t.railway === "tram_stop" || t.tram === "yes") return true;
  if (t.highway === "bus_stop" || t.bus === "yes" || t.trolleybus === "yes") return false;
  return null;
}

// A shelter belongs to a tram stop when its own tags or the nearest stop node within STOP_REACH say so.
function shelterIsTram(t, x, y, stops) {
  const own = stopMode(t);
  if (own !== null) return own;
  let best = null, bestD = STOP_REACH;
  for (const s of stops) {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) [best, bestD] = [s.tram, d];
  }
  return best === true;
}

function itemPositions(osm, frame, center, normal, half, lines) {
  const items = [];
  const stops = [];
  for (const el of osm.elements || []) {
    if (el.type !== "node") continue;
    const tram = stopMode(el.tags || {});
    if (tram === null) continue;
    const [x, y] = frame.toXY(el.geometry[0].lon, el.geometry[0].lat);
    stops.push({ x, y, tram });
  }
  for (const el of osm.elements || []) {
    if (el.type === "node") {
      const kind = nodeItem(el.tags || {});
      if (!kind) continue;
      const [x, y] = frame.toXY(el.geometry[0].lon, el.geometry[0].lat);
      const dx = x - center[0], dy = y - center[1];
      if (Math.abs(dx * normal[1] - dy * normal[0]) > ITEM_REACH) continue;
      const item = { kind, t: dx * normal[0] + dy * normal[1] };
      if (kind === "pristresek" && shelterIsTram(el.tags || {}, x, y, stops)) item.tram = true;
      items.push(item);
    } else if (el.type === "way" && BARRIER_ITEM[el.tags?.barrier]) {
      const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
      for (const t of lineCrossings([pts], center, normal, half)) items.push({ kind: BARRIER_ITEM[el.tags.barrier], t, osm: true });
    }
  }
  for (const l of lines) {
    const kind = TECH_ITEM[l.code];
    if (kind) for (const t of lineCrossings([l.pts], center, normal, half)) items.push({ kind, t });
  }
  // The technical map and OSM often draw the same fence: keep one item of a kind per metre.
  items.sort((a, b) => a.t - b.t);
  return items.filter((it, i) => !items.slice(0, i).some((o) => o.kind === it.kind && Math.abs(o.t - it.t) < 1));
}

function attachItems(segs, items) {
  for (const it of items) {
    const host = segs.find((x) => x.s <= it.t && x.e >= it.t);
    if (!host) continue;
    const item = { kind: it.kind, f: (it.t - host.s) / Math.max(host.e - host.s, 0.01) };
    if (it.tram) item.tram = true;
    (host.items ||= []).push(item);
  }
  return segs;
}

// Codes of the technical map (and overlays) a street axis may lie on.
// Only unpaved land under the axis (no surface, field, meadow, garden, greenery) counts as a mismatch:
// paved "other areas" (e.g. 1003) can hold a street the technical map has not split out.
const isUnpaved = (c) => c === null || c === undefined || c === 100 || c === 200 || (c >= 300 && c < 500);
const REACH_SNAP = 1.5; // a run cut by the reach is kept whole (or dropped) within this much (m)
// Guard rails of the technical map splitting one MTVU roadway into two carriageways.
const GUARD_RAILS = new Set([71522, 71540]);
// Fences and walls ending the street: technical map (fences and walls > 0.3 m) and OSM barriers.
const FENCE_LINES = new Set([61210, 71210, 81210, 91210]);
const FENCE_BARRIERS = new Set(["fence", "wall", "city_wall", "hedge"]);
const FENCE_AT_FACADE = 1; // m
const FENCE_SLIVER = 0.6; // m
const MEDIAN = 9950;
const MEDIAN_W = 0.6; // width of a median with a guard rail (m)
// Dot product of the driving directions of two crossing ways (oneway=-1 runs against the geometry).
const drivingDot = (a, b) => (a.d[0] * b.d[0] + a.d[1] * b.d[1]) * (a.way.tags?.oneway === "-1" ? -1 : 1) * (b.way.tags?.oneway === "-1" ? -1 : 1);

// MTVU draws both carriageways and the guard rail between them as one roadway: a guard rail
// with a road axis on each side splits the run and becomes a narrow median.
function splitMedians(runs, cross, rails) {
  const out = [];
  for (const r of runs) {
    if (r.code !== 701 && r.code !== 700) { out.push(r); continue; }
    const axes = cross.filter((c) => c.t > r.s && c.t < r.e && c.way.tags?.highway && !MINOR.has(c.way.tags.highway));
    let s = r.s;
    for (const t of [...rails].sort((a, b) => a - b)) {
      if (t - s < 2.5 || r.e - t < 2.5) continue;
      if (!axes.some((c) => c.t > s && c.t < t) || !axes.some((c) => c.t > t && c.t < r.e)) continue;
      out.push({ ...r, s, e: t - MEDIAN_W / 2 }, { ...r, code: MEDIAN, s: t - MEDIAN_W / 2, e: t + MEDIAN_W / 2 });
      s = t + MEDIAN_W / 2;
    }
    out.push({ ...r, s });
  }
  return out;
}

// Dual carriageway mapped as two one-way ways: the partner of the cut's way is a one-way way with
// the same name driving the other direction, crossing the cut.
function dualPartner(cross, way, half) {
  const own = cross.find((c) => c.way.id === way.id);
  if (!own || !isOnewayTags(way.tags) || !way.tags.name) return null;
  return cross
    .filter((c) => c.way.id !== way.id && isOnewayTags(c.way.tags) && c.way.tags.name === way.tags.name && !MINOR.has(c.way.tags.highway) &&
      drivingDot(c, own) < 0 && Math.abs(c.t - own.t) < half)
    .sort((a, b) => Math.abs(a.t - own.t) - Math.abs(b.t - own.t))[0] || null;
}

// On a dual carriageway the cut centre moves from the clicked carriageway to the middle of the
// street (the tram belt or median between the two), so the cut shows the whole street.
export function centerOnStreet(osm, frame, near, half = 40) {
  const normal = [-near.dir[1], near.dir[0]];
  const cross = crossings(osm, frame, near.point, normal, half);
  const partner = dualPartner(cross, near.way, half);
  if (!partner) return near;
  const own = cross.find((c) => c.way.id === near.way.id)?.t ?? 0;
  const m = (own + partner.t) / 2;
  return { ...near, point: [near.point[0] + normal[0] * m, near.point[1] + normal[1] * m] };
}

// Main entry: returns {segments (screen left → right), edges, runs}.
export function deriveProfile({ center, dir, half, polys, osm, frame, way, tracks = [], parking = [], lines = [], reach, inZps: zoneKnown }) {
  const normal = [-dir[1], dir[0]];
  const cross = crossings(osm, frame, center, normal, half);
  const axisT = cross.find((c) => c.way.id === way.id)?.t ?? 0;
  // Tram track axes: measured ones from the technical map when available, else OSM.
  const measured = lineCrossings(tracks, center, normal, half);
  const tramTs = measured.length ? measured : cross.filter((c) => c.way.tags?.railway === "tram").map((c) => c.t);
  tramTs.measured = measured.length > 0;

  if (!polys.length) return estimateFromOsm(way, axisT);

  const classifyAll = (osmParking) => absorbParkingSlivers(mergeTiny(classify(center, normal, half, [
    ...osmPlatformPolygons(osm, frame),
    // Special stalls (ZTP, deliveries…) before the plain sections that contain them.
    ...parking.filter((p) => p.kind !== "useky").map((p) => ({ ...p, code: TSK_CODES[p.kind] || TSK_PARKING, use: p.kind })),
    ...parking.filter((p) => p.kind === "useky").map((p) => ({ ...p, code: TSK_PARKING, orient: orientFromStalls(p, dir) })),
    ...osmOutdoorPolygons(osm, frame),
    ...(osmParking ? osmParkingPolygons(osm, frame) : []),
    ...polys,
  ])));
  const axisRun = (rs) => rs.findIndex((r) => r.s <= axisT && r.e >= axisT);
  let runs = classifyAll(true);
  // An OSM street-parking area under the street axis covers the carriageway itself (drawn
  // over the whole street): the bays cannot be told apart, so the technical map alone decides.
  if (runs[axisRun(runs)]?.code === OSM_PARKING) runs = classifyAll(false);
  // Start at the run under the street axis and expand to the first building on each side.
  let i0 = axisRun(runs);
  // An axis inside a building (a passage): start from the nearest run that is not a building.
  if (i0 < 0 || isBuilding(runs[i0].code)) {
    const open = runs.filter((r) => !isBuilding(r.code));
    const near = open.sort((a, b) => Math.min(Math.abs(a.s - axisT), Math.abs(a.e - axisT)) - Math.min(Math.abs(b.s - axisT), Math.abs(b.e - axisT)))[0];
    i0 = runs.indexOf(near);
  }
  if (i0 < 0) return { ...estimateFromOsm(way, axisT), runs };
  // The technical map has no street surface where OSM draws a street (a new road, a field, a
  // gap in MTVU): the profile falls back to OSM and says so.
  if (!MINOR.has(way.tags?.highway) && isUnpaved(runs[i0]?.code)) {
    const code = runs[i0]?.code;
    return { ...estimateFromOsm(way, axisT), runs, notice: `Technická mapa tu nemá povrch ulice (${code === null || code === undefined ? "žádná plocha" : `plocha ${code} ${polys.find((p) => p.code === code)?.label || ""}`.trim()}), profil je odhad z OSM.` };
  }
  // Dual carriageway: the reach counts from the middle between the two carriageways, and green
  // between them is the median, not the end of the street.
  const partner = dualPartner(cross, way, half);
  const ref = partner ? (axisT + partner.t) / 2 : axisT;
  const between = partner ? [Math.min(axisT, partner.t), Math.max(axisT, partner.t)] : null;
  const inMedian = (r) => between && r.s >= between[0] - 0.05 && r.e <= between[1] + 0.05;
  // Expansion stops at a building, at a garden (front gardens are drawn as the edge,
  // not counted in the street width), or once a run starts too far from the axis.
  const isOpenLand = (c) => c === 100 || c === 200 || (c >= 400 && c < 500);
  // The reach on each side can be shortened by dragging the cut ends (left = larger t).
  const reachL = Math.min(reach?.left ?? MAX_REACH, half - Math.max(0, ref)), reachR = Math.min(reach?.right ?? MAX_REACH, half + Math.min(0, ref));
  const stopAt = (r, limit) => {
    if (isBuilding(r.code)) return "budova";
    // A narrow "other structure" is a wall or parapet (e.g. an embankment wall): the profile goes on.
    if (isMinorStructure(r.code) && r.e - r.s >= WALL_MAX) return "stavba";
    if (inMedian(r)) return null;
    if (r.code >= 500 && r.code < 600 && r.e - r.s >= OPEN_LAND) return "voda";
    if (r.code === 300) return "zahrada";
    if (isOpenLand(r.code) && r.e - r.s >= OPEN_LAND) return "zelen";
    // A large parking area beside the street is the edge of the profile, not a parking lane.
    if (r.code === 704 && r.e - r.s >= OPEN_LAND) return "parkoviste";
    // No technical-map surface over a wide stretch: nothing more to measure on this side.
    if (r.code === null && r.e - r.s >= OPEN_LAND) return "volno";
    if (Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit) return "volno";
    return null;
  };
  let lo = i0, hi = i0;
  let right = "volno", left = "volno";
  while (lo > 0) { const s = stopAt(runs[lo - 1], reachR); if (s) { right = s; break; } lo--; }
  while (hi < runs.length - 1) { const s = stopAt(runs[hi + 1], reachL); if (s) { left = s; break; } hi++; }
  const edges = { right, left };

  // A fence or wall beyond the outermost carriageway is the edge of the street (Bára: what is behind
  // the fence is not part of the street profile). Technical-map fences and walls taller than 0.3 m,
  // and OSM fences, walls and hedges.
  const fenceTs = [
    ...lineCrossings(lines.filter((l) => FENCE_LINES.has(l.code)).map((l) => l.pts), center, normal, half),
    ...cross.filter((c) => FENCE_BARRIERS.has(c.way.tags?.barrier)).map((c) => c.t),
  ];
  const isCarriage = (r) => r.code === 700 || r.code === 701 || r.code === 705;
  const road = runs.slice(lo, hi + 1).filter(isCarriage);
  const roadMin = Math.min(ref, ...road.map((r) => r.s)), roadMax = Math.max(ref, ...road.map((r) => r.e));
  // A fence along a building's façade (within FENCE_AT_FACADE of it) leaves the building as the edge.
  const nearL = edges.left === "budova" ? FENCE_AT_FACADE : 0.05, nearR = edges.right === "budova" ? FENCE_AT_FACADE : 0.05;
  const fenceL = Math.min(Infinity, ...fenceTs.filter((t) => t > roadMax + 0.3 && t < runs[hi].e - nearL));
  const fenceR = Math.max(-Infinity, ...fenceTs.filter((t) => t < roadMin - 0.3 && t > runs[lo].s + nearR));

  // A run cut by the reach is kept whole when little of it is left out, and dropped when
  // little of it is inside, so the profile does not end in a sliver.
  const clip = (r, lim, isEnd) => {
    const outside = isEnd ? r.e - lim : lim - r.s, inside = isEnd ? lim - r.s : r.e - lim;
    if (outside <= 0) return isEnd ? r.e : r.s;
    if (outside < REACH_SNAP) return isEnd ? r.e : r.s;
    if (inside < REACH_SNAP) return isEnd ? r.s : r.e;
    return lim;
  };
  const kept = splitMedians(runs.slice(lo, hi + 1).map((r) => ({
    ...r,
    s: Math.max(clip(r, ref - reachR, false), fenceR),
    e: Math.min(clip(r, ref + reachL, true), fenceL),
  })).filter((r) => r.e - r.s > 0.05), cross, lineCrossings(lines.filter((l) => GUARD_RAILS.has(l.code)).map((l) => l.pts), center, normal, half));
  // A profile cut short by the user ends in open space, not at the building behind.
  if (!kept.length) return { ...estimateFromOsm(way, axisT), runs };
  if (kept[0].s > runs[lo].s + 0.05) edges.right = "volno";
  if (kept.at(-1).e < runs[hi].e - 0.05) edges.left = "volno";
  if (Math.abs(kept[0].s - fenceR) < 0.06) edges.right = "plot";
  if (Math.abs(kept.at(-1).e - fenceL) < 0.06) edges.left = "plot";
  // A strip under FENCE_SLIVER between the sidewalk and the fence (the fence base, a kerb) joins its neighbour.
  if (edges.left === "plot" && kept.length > 1 && kept.at(-1).e - kept.at(-1).s < FENCE_SLIVER) { kept.at(-2).e = kept.at(-1).e; kept.pop(); }
  if (edges.right === "plot" && kept.length > 1 && kept[0].e - kept[0].s < FENCE_SLIVER) { kept[1].s = kept[0].s; kept.shift(); }
  const segs = [];
  const kerbReqs = [];
  // Inside (or within 100 m of) a paid parking zone, from the TSK zone boundaries (caller's inZps);
  // without them, TSK parking sections along the cut stand for the zone.
  const inZps = zoneKnown ?? parking.some((p) => p.kind === "useky");
  for (const r of kept) {
    const type = typeFromMtvu(r.code);
    if (r.code === 701 || r.code === 700) {
      const inRun = (t) => t > r.s && t < r.e;
      // OSM road axes in this carriageway: each lane takes the direction of the nearest one.
      const here = cross.filter((c) => inRun(c.t) && c.way.tags?.highway && !MINOR.has(c.way.tags.highway));
      // A roadway surface crossed only by a track, service road or footway is an access way,
      // not a street with lanes (e.g. a sidewalk that cars may occasionally use).
      const minor = cross.filter((c) => inRun(c.t) && MINOR.has(c.way.tags?.highway));
      // …unless trams or buses use it (a pedestrian zone with public transport keeps its roadway).
      const inside = tramTs.filter(inRun);
      inside.measured = tramTs.measured;
      // A roadway in a pedestrian zone (highway=pedestrian) stays a roadway too (Bára: a pedestrian-zone
      // carriageway is not a sidewalk), as one lane both ways unless lanes are tagged.
      const transit = inside.length > 0 || minor.some((c) => c.way.tags.highway === "pedestrian" ||
        ["yes", "designated"].includes(c.way.tags.bus) || ["yes", "designated"].includes(c.way.tags.psv));
      if (!here.length && minor.length && !transit && !cross.some((c) => c.way.id === way.id && inRun(c.t) && !MINOR.has(way.tags.highway))) {
        const foot = minor.some((c) => ["footway", "pedestrian", "path", "steps"].includes(c.way.tags.highway));
        segs.push({ type: foot ? "chodnik" : "obsluzna", s: r.s, e: r.e, source: "dtm" });
        continue;
      }
      const own = here.find((c) => c.way.id === way.id) || here[0];
      const tags = own?.way.tags || (transit ? (minor.find((c) => c.way.tags.highway === "pedestrian") || minor[0])?.way.tags : null) || way.tags || {};
      const axes = (here.length ? here : [{ t: axisT, way, d: dir }]).map((c) => {
        const t2 = c.way.tags || {};
        const oneway = isOnewayTags(t2) || t2.junction === "roundabout";
        const along = (c.d[0] * dir[0] + c.d[1] * dir[1] >= 0) !== (t2.oneway === "-1");
        const lanes = parseInt(t2.lanes, 10) || (oneway || t2.highway === "pedestrian" ? 1 : 2);
        const geomAlong = c.d[0] * dir[0] + c.d[1] * dir[1] >= 0;
        return { t: c.t, oneway, along, geomAlong, lanes, id: c.way.id, tags: t2 };
      });
      const dirAt = (m) => {
        const a = axes.reduce((b, x) => (Math.abs(x.t - m) < Math.abs(b.t - m) ? x : b));
        if (a.oneway) return a.along ? "forward" : "backward";
        // Two-way: traffic keeps right, so the half left of the axis runs against the cut's street.
        return m > a.t ? "backward" : "forward";
      };
      const lanesTotal = [...new Map(axes.map((a) => [a.id, a.lanes])).values()].reduce((x, y) => x + y, 0);
      const ownAxis = own ? axes.find((a) => a.id === own.way.id) : null;
      const parked = [];
      // A parking bay already measured (MTVU 704) or mapped (OSM area) next to the roadway
      // stands for the street-side parking in the tags.
      const isBay = (x) => x?.code === OSM_PARKING || isTskParking(x?.code) || x?.code === 704;
      if (isBay(kept[kept.indexOf(r) + 1])) parked.push("L");
      if (isBay(kept[kept.indexOf(r) - 1])) parked.push("R");
      // Each curb takes its side tags from the OSM axis nearest to it: on a dual carriageway
      // mapped as two one-way ways, both carriageways' right sides are the outer curbs.
      const edgeTags = (side) => {
        const at = side === "L" ? r.e : r.s;
        const a = axes.reduce((b, x) => (Math.abs(x.t - at) < Math.abs(b.t - at) ? x : b));
        const osmSide = (side === "L") === a.geomAlong ? "left" : "right";
        return sideTags(a.tags || tags, osmSide);
      };
      const sideTagsLR = { L: edgeTags("L"), R: edgeTags("R") };
      for (const [side, st, at] of [["L", sideTagsLR.L, r.e], ["R", sideTagsLR.R, r.s]]) {
        if (st.kerbDepth && !parked.includes(side)) kerbReqs.push({ side, at, w: st.kerbDepth, orient: st.parkingOrient });
      }
      // Curbs with a sidewalk behind them, where parked cars are to be expected.
      // A narrow green strip (up to 3 m) between the curb and the sidewalk counts too.
      const ri = kept.indexOf(r);
      const walkAt = (x, y) => x?.code === 702 || (x?.code >= 400 && x?.code < 500 && x.e - x.s <= 3 && (y?.code === 702 || isBuilding(y?.code)));
      // Look past the profile end too: the building behind the green strip ends the profile.
      // Past the profile end only when the end is a real one (a building), not one cut by the reach.
      const after = (x) => runs.find((y) => y.s >= x.e - 0.01 && y !== x);
      const before = (x) => [...runs].reverse().find((y) => y.e <= x.s + 0.01 && y !== x);
      const next = (k) => {
        const n1 = kept[ri + 1] || (edges.left === "volno" ? null : after(r));
        return k === 1 ? n1 : n1 && (kept[ri + 2] || (edges.left === "volno" ? null : after(n1)));
      };
      const prev = (k) => {
        const p1 = kept[ri - 1] || (edges.right === "volno" ? null : before(r));
        return k === 1 ? p1 : p1 && (kept[ri - 2] || (edges.right === "volno" ? null : before(p1)));
      };
      const kerbWalk = [["L", walkAt(next(1), next(2))], ["R", walkAt(prev(1), prev(2))]].filter(([, ok]) => ok).map(([sd]) => sd);
      segs.push(...splitRoadway(r, { tags, trams: inside, dirAt, lanesTotal, along: ownAxis ? (ownAxis.along !== (tags.oneway === "-1")) : true, single: new Set(axes.map((a) => a.id)).size === 1, parked, sides: sideTagsLR, kerbWalk, inZps }).map((x) => ({ ...x, mtvu: r.code })));
    } else if (r.code === MEDIAN) {
      segs.push({ type: "delici", s: r.s, e: r.e, source: "dtm" });
    } else if (isMinorStructure(r.code)) {
      segs.push({ type: "zed", s: r.s, e: r.e, source: "dtm" });
    } else if (r.code === OSM_PLATFORM) {
      segs.push({ type: "nastupiste", s: r.s, e: r.e, source: "osm" });
    } else if (isTskParking(r.code)) {
      segs.push({ type: "parkovani", s: r.s, e: r.e, source: "tsk", orient: r.orient, use: r.use });
    } else if (r.code === OSM_OUTDOOR) {
      segs.push({ type: "zahradka", s: r.s, e: r.e, source: "osm" });
    } else if (r.code === OSM_PARKING) {
      segs.push({ type: "parkovani", s: r.s, e: r.e, source: "osm", orient: r.orient });
    } else if (type === "tramvaj" && r.e - r.s > 5) {
      const m = (r.s + r.e) / 2;
      segs.push({ type, s: r.s, e: m, dir: "forward", source: "dtm" });
      segs.push({ type, s: m, e: r.e, dir: "backward", source: "dtm" });
    } else if (type === "cyklostezka") {
      segs.push(...cycleTrack(r, cross, dir));
    } else {
      if (type === "chodnik") segs.push(...sidewalkUse(r, cross, way, axisT, dir));
      else segs.push({ type, s: r.s, e: r.e, source: r.code === null ? "odhad" : "dtm" });
    }
  }
  // Roadway outer edges are measured; only the internal split comes from OSM.
  const withKerb = carveKerbParking(markIslands(segs), kerbReqs);
  const withPlatforms = insertPlatforms(withKerb, platformPositions(osm, frame, center, normal, half), axisT);
  const withTrees = insertTrees(withPlatforms, treePositions(osm, frame, center, normal, half));
  const withItems = attachItems(perpDepth(mergeParking(withTrees)), itemPositions(osm, frame, center, normal, half, lines));
  // Points 4 m inside the buildings at both ends, for their height and number of floors.
  const at = (t) => [center[0] + normal[0] * t, center[1] + normal[1] * t];
  const probe = { left: at(kept.at(-1).e + 4), right: at(kept[0].s - 4) };
  for (const side of ["left", "right"]) {
    if (edges[side] !== "budova") continue;
    const b = buildingAt(osm, frame, probe[side]);
    const point = frame.toLonLat(...probe[side]);
    edges[`${side}Info`] = { levels: b?.levels, height: b?.height, point, km: +centreKm(point).toFixed(1) };
    if (b?.type && b.type !== "yes") edges[`${side}Info`].type = b.type;
  }
  return {
    segments: withItems.reverse().map(toSegment),
    edges: { ...edges },
    runs,
    axisT,
    extent: [kept[0].s, kept.at(-1).e], // offsets of the right and left profile ends along the cut
    // A roadway this wide along the cut usually means the cut crosses a junction.
    junction: kept.some((r) => (r.code === 701 || r.code === 700) && r.e - r.s > 25),
  };
}

function toSegment(x) {
  const seg = { type: x.type, width: round(x.e - x.s), source: x.source };
  if (x.dir) seg.dir = x.dir;
  if (x.turn && x.turn !== "none") seg.turn = x.turn;
  if (x.bikeDir) seg.bikeDir = x.bikeDir;
  if (x.use && x.use !== "useky") seg.use = x.use;
  if (x.color) seg.color = x.color;
  // Segments are reversed to screen order, so item positions flip too.
  if (x.items?.length) seg.items = x.items.map((it) => ({ ...it, f: +(1 - it.f).toFixed(3) }));
  if (x.type === "parkovani") {
    seg.orient = x.orient || orientFromDepth(seg.width);
    // Last guard (ČSN 73 6056): perpendicular parking is never shallower than PERP_MIN.
    if (seg.orient === "kolme" && seg.width < PERP_MIN) seg.orient = "sikme";
  }
  return seg;
}

const round = (v) => Math.round(v * 100) / 100;

// Fallback outside MTVU coverage: a typical profile from OSM tags.
function estimateFromOsm(way) {
  const tags = way.tags || {};
  const oneway = isOnewayTags(tags);
  const lanes = parseInt(tags.lanes, 10) || (oneway ? 1 : 2);
  const total = parseFloat(tags.width) || null;
  const segs = [];
  const sw = tags.sidewalk && tags.sidewalk !== "no" && tags.sidewalk !== "none";
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  const lw = total ? total / lanes : DEFAULT_WIDTH.pruh;
  for (let i = 0; i < lanes; i++) {
    segs.push({ type: "pruh", width: round(lw), source: total ? "osm" : "odhad", dir: oneway || i >= lanes / 2 ? "forward" : "backward" });
  }
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  return { segments: segs, edges: { left: "volno", right: "volno" }, runs: [], axisT: 0 };
}
