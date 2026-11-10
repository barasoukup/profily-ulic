// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
// Geometry works in a local metric frame (x east, y north, metres) around the cut centre.
import { typeFromMtvu, isBuilding, isMinorStructure, DEFAULT_WIDTH } from "./types.js";
import { city } from "./city.js";

const STEP = 0.05; // sampling step along the cut (m)
const MIN_RUN = 0.3; // runs narrower than this merge into a neighbour (m)
export const MAX_REACH = 22; // default reach of the profile from the street axis on each side (m)
const WALL_MAX = 2; // "ostatní stavby" narrower than this are walls / parapets, not a structure ending the street (m)
const OPEN_LAND = 8; // greenery at least this wide ends the profile as open surroundings (m)
// Outer half-width of a tram track lane from its axis (m). IPR Manuál tvorby veřejných
// prostranství C.2: double-track belt 6.5 m at 3.0 m track spacing, 7 m at 3.5 m,
// i.e. 1.75 m from each outer axis; between tracks the space splits at the midpoint.
const TRAM_HALF = 1.75;
const TRAM_LANE_HALF = 1.5; // a tram kept to a 3.0 m lane, where OSM counts car lanes beside the tracks
const CAR_MIN = 2.5; // narrowest leftover space treated as a separate car lane (m)
// The three kinds of tram (Bára): in a lane with cars, a reserved tram lane in the roadway, a separate tram bed.
const LANE_TYPES = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]); // parts that carry the street's class
const TRAM_KINDS = new Set(["tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj"]);
const GRASS_BED_MIN = 2.5; // a green area at least this wide with tracks in it is a grass tram bed (m)
// The surface of a separate tram bed from the OSM tram ways in it: grass, gravel (ballast) or panels (paved:
// concrete, plates, sett, asphalt); unknown → panels, as an estimate.
const BED_OF_SURFACE = { grass: "trava", grass_paver: "trava", gravel: "strk", fine_gravel: "strk", ballast: "strk", pebblestone: "strk" };
function bedOf(cross, r) {
  const tags = cross.filter((c) => c.t > r.s - 0.3 && c.t < r.e + 0.3 && c.way.tags?.railway === "tram").map((c) => c.way.tags);
  for (const t of tags) {
    const v = t["railway:track_bed"] || t["tram:bed"] || t.surface;
    if (BED_OF_SURFACE[v]) return { kind: BED_OF_SURFACE[v], source: "osm" };
    if (v) return { kind: "panely", source: "osm" };
  }
  return { kind: "panely", source: "odhad" };
}
const tramWithBus = (t) => ["yes", "designated"].includes(t.psv) || ["yes", "designated"].includes(t.bus) || t.highway === "busway";
const TREE_STRIP = 1.5; // width of a tree strip carved out of a sidewalk (m)
// A cut never hits a point: a point this close to the cut, measured along the street, is drawn in the
// profile (m), per kind. The nearest one of a row (the same kind at about the same offset) is kept, so a
// reach of half the usual spacing shows one at most cuts and never two of a row (Bára: tuned on the
// Prague sample, evaluation/praha-opendata/ZPRAVA.md).
export const REACH = {
  strom: 8, // street trees, single (rows crossing the cut always count): about 8–16 m apart
  lampa: 20, // street lamps (OSM, the technical map's poles without wires): about 25–32 m apart
  sloup: 20, // tram and trolleybus overhead-line poles: about 22–38 m apart
  zastavka: 15, // stop poles and shelters: one per stop, a platform is 15–60 m long
  sloupek: 3, // bollards, planters: 2.5 m apart, a row ending short of the cut is not in it
  lavicka: 6, // benches: single
  jine: 6, // everything else standing (bike racks, sign posts, taxi stands, terraces)
};
const REACH_GROUP = { lampa: "lampa", lavicka: "lavicka", sloupek: "sloupek", kvetinac: "sloupek", sloup_trakce: "sloup", oznacnik: "zastavka", pristresek: "zastavka" };
export const reachOf = (kind, reach = REACH) => reach[REACH_GROUP[kind] || (kind === "strom" ? "strom" : "jine")] ?? REACH[REACH_GROUP[kind] || "jine"];
const ROW_GAP = 1.5; // points of one kind this close across the street stand in one row: one is drawn (m)
const NO_PARKING_IN = 2.5, NO_PARKING_OUT = 0.5; // a no-parking section counts this far into the roadway from the kerb, and out of it (m)
const SECTION_NEAR = 12; // the line of a TSK street section within this of the roadway's middle is its section (m)
const SAME_POINT = 3; // a technical-map or open-data point this close to an OSM one of its kind is the same thing (m)
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
const LOOP_CLEARANCE = 12; // …and from any point of a roundabout's ring or a turning circle (m): a cut there
// runs over the ring and its island (Jihlava č. 23, 52)
const NOT_JUNCTION_SERVICE = new Set(["driveway", "parking_aisle", "drive-through"]);
const AXIS_SNAP = 4.5; // m: an OSM axis this close beside the roadway belongs to it (city.fix.axisToRoadway)
// Streets for those fixes: roads and residential streets, not tracks or bridleways (Brno test č. 99).
const STREETS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);

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
    if (el.id === near.way.id || !el.tags?.highway || !el.geometry) continue;
    if (el.type === "node" && ["turning_circle", "turning_loop"].includes(el.tags.highway)) {
      hits.push({ p: frame.toXY(el.geometry[0].lon, el.geometry[0].lat), clear: LOOP_CLEARANCE });
      continue;
    }
    if (el.type !== "way") continue;
    if (el.tags.junction === "roundabout" || el.tags.junction === "circular") {
      for (const g of el.geometry) hits.push({ p: frame.toXY(g.lon, g.lat), clear: LOOP_CLEARANCE });
    }
    const crossing = el.tags.footway === "crossing" || el.tags.cycleway === "crossing";
    // A service road joins like a street where the city says so (Brno: side streets are often service
    // in OSM, e.g. Kohoutova, Pivoňkova); driveways and parking aisles do not.
    const sideService = city.fix?.serviceJunctions && el.tags.highway === "service" && !NOT_JUNCTION_SERVICE.has(el.tags.service);
    if (MINOR.has(el.tags.highway) && !crossing && !sideService) continue;
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
// No-parking sections of TSK (Prague, "Zákaz stání"): parts of a parking section (the same ZPS_ID) where
// no car may stand, e.g. in front of a driveway.
const NO_PARKING = 9709;
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
    // ODHAD: stalls whose place is estimated (Plzeň: a paid zone tells that people pay, not where they stand).
    return { rings, bbox: bboxOf(rings.flat()), count: Number(f.attributes?.PS_ZPS) || 0, kind: f.attributes?.KIND || "useky", guess: f.attributes?.ODHAD === 1 };
  });
}

export function mtvuPolygons(json, frame) {
  return (json.features || []).map((f) => {
    const rings = f.geometry.rings.map((r) => r.map(([lon, lat]) => frame.toXY(lon, lat)));
    return {
      code: Number(f.attributes.CTVUK_KOD),
      label: (f.attributes.CTVUK_POPIS || "").trim(),
      guess: f.attributes.ODHAD === 1, // Brno: an area completed along OSM, not measured
      level: Number(f.attributes.LEVEL) || 0, // Brno: 1 above the ground (bridge decks)
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
    let code = null, orient, use, guess, free = false;
    for (const p of polys) {
      const [x0, y0, x1, y1] = p.bbox;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      // A no-parking part of a TSK section (a driveway, a crossing): the section has no stall there.
      if (p.code === NO_PARKING) { if (!free && inside(p.rings, x, y)) free = true; continue; }
      if (free && (isTskParking(p.code) || p.code === OSM_PARKING)) continue;
      if (inside(p.rings, x, y)) { code = p.code; orient = p.orient; use = p.use; guess = p.guess; break; }
    }
    const last = runs[runs.length - 1];
    if (last && last.code === code && !!last.guess === !!guess) last.e = t + STEP / 2;
    else runs.push({ code, orient, use, guess, s: t - STEP / 2, e: t + STEP / 2 });
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

// Barrier and slope lines of the technical map (everything but track axes), with their code; its points
// (Prague's layer 9: poles, stop poles, bollards, trees) as {code, point}; Prague's open data (sources.js)
// with string codes: trees (od_strom, points), tree rows (od_stromorad) and street sections of TSK
// (od_usek, with their class in cls).
export function techLines(json, frame) {
  const codeOf = (f) => { const c = f.attributes?.CTMTP_KOD; return typeof c === "string" && isNaN(c) ? c : Number(c); };
  return (json.features || [])
    .filter((f) => codeOf(f) !== 55010)
    .flatMap((f) => {
      const code = codeOf(f), a = f.attributes;
      if (f.geometry?.x !== undefined) return [{ code, point: frame.toXY(f.geometry.x, f.geometry.y) }];
      const cls = code === OD_SECTION ? { mk: a.MK, road: a.SIL, motorway: a.DALNICE, kind: a.TYP } : undefined;
      return (f.geometry?.paths || []).map((p) => ({ code, pts: p.map(([lon, lat]) => frame.toXY(lon, lat)), ...(cls ? { cls } : {}) }));
    });
}
const OD_TREE = "od_strom", OD_ROW = "od_stromorad", OD_SECTION = "od_usek"; // as sources.js
// The class of a TSK street section (Prague) as one word: "dalnice", "mk1"–"mk4" (místní komunikace I.–IV.
// třídy), "sil1"–"sil3" (a road of class I–III without an MK class); null without one. rules.js turns it into
// the functional group of ČSN 73 6110.
export function classGroup(cls) {
  if (!cls) return null;
  if (cls.motorway) return "dalnice";
  if (cls.mk >= 1 && cls.mk <= 4) return `mk${cls.mk}`;
  if (cls.road >= 1 && cls.road <= 3) return `sil${cls.road}`;
  return null;
}
const TM_TREE = 83130; // technical map: strom mimo park
// Points of the technical map that are drawn as street furniture (TM_TREE is a tree).
const POINT_ITEM = { 26015: "sloup_trakce", 75240: "oznacnik", 75241: "oznacnik", 74110: "sloupek", 76010: "lampa" };
const isLine = (l) => !!l.pts;

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
// The cap by the class of the street (Prague: TSK's class, classGroup), before OSM's highway: on motorways and
// MK I (the main network: rapid and the main collector roads) 3.75 m, as on OSM's motorways and trunks (ČSN 73
// 6110 group A: 3.50 m lanes). A/B on the orthophoto (evaluation/pravidla-11-2026): their marked lanes are about
// 3.5 m; a cap of 4 m for MK II and 4.5 m for MK IV did not help, so there OSM decides.
const LANE_CAP_CLASS = { dalnice: 3.75, mk1: 3.75 };
const KRAJNICE_MIN = 1; // narrowest shoulder / hatched strip drawn (m)
// Streets where cars commonly park at the curb even where neither TSK nor OSM says so.
// Not on main streets (secondary, tertiary and up): there the curb is mostly kept free (Bára).
const PARK_GUESS = new Set(["residential", "living_street", "unclassified"]);
const GUESS_PARK_W = 2; // estimated parallel parking strip (m)
// § 25 of act 361/2000 Sb. (silniční provoz): a parked car leaves a lane at least LAW_LANE wide free for each
// direction (odst. 3) and keeps LAW_RAIL from the nearest tram rail (odst. 2, from 5 to 19 h).
const LAW_LANE = 3, LAW_RAIL = 3.5;
const RAIL_HALF = 0.7175; // half the track gauge of 1435 mm: rail from the track axis (m)
const turnList = (v) => (v ? v.split("|").map((x) => x || "none") : null);

// Split one roadway run [s,e] into parking, bike and driving/tram lanes using OSM tags.
// ctx.dirAt(t): driving direction ("forward"/"backward" relative to the cut's street) at offset t,
// from the nearest OSM road axis, so both carriageways of a dual carriageway are right.
// ctx.along: the run's own OSM way points the same way as the cut's street (its left = our left).
// ctx.parked: sides ("L"/"R") already having a parking bay next to this run.
function splitRoadway(run, ctx) {
  const { tags, trams, dirAt, along, single, parked, sides } = ctx;
  // A roadway too narrow for the tagged (or default) lanes holds as many as fit, at least one.
  const lanesTotal = Math.max(1, Math.min(ctx.lanesTotal, Math.floor((run.e - run.s) / MIN_LANE)));
  let s = run.s, e = run.e;
  const width = e - s;
  // OSM left/right follow the way; L/R here follow the cut's street (L = larger t).
  const sideL = sides?.L ?? sideTags(tags, along ? "left" : "right");
  const sideR = sides?.R ?? sideTags(tags, along ? "right" : "left");
  // Curb strips are added while the driving lanes keep at least MIN_LANE each.
  const edge = [];
  let left = width - lanesTotal * MIN_LANE;
  // With tracks in the roadway a strip at the curb must also stay clear of the tram's swept space
  // (axis ± TRAM_HALF): parking or a bike lane tagged in OSM where the track runs close to the
  // curb is not there (e.g. Seifertova), the tram shares the lane with the cars up to the curb.
  const clear = trams.length
    ? { R: Math.min(...trams) - TRAM_HALF - s, L: e - Math.max(...trams) - TRAM_HALF }
    : { R: Infinity, L: Infinity };
  const fits = (side, w) => left >= w && clear[side] >= w - 0.1;
  const take = (side, w) => { left -= w; clear[side] -= w; };
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.bike) continue;
    const w = bikeWidth(st.bike, st.parking || parked.includes(side) ? st.parkingOrient || "podelne" : null);
    if (fits(side, w)) { edge.push({ side, type: st.bike, w }); take(side, w); }
  }
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (st.parking && !parked.includes(side) && fits(side, st.parkingWidth)) {
      edge.push({ side, type: "parkovani", w: st.parkingWidth, orient: st.parkingOrient });
      take(side, st.parkingWidth);
    }
  }
  // Cars parked at the curb, though no data says so: a parallel strip as an estimate where the law allows it
  // (Bára): § 25(3) of act 361/2000 Sb. leaves a lane of at least LAW_LANE free for each direction, so a two-way
  // street takes it from 8 m of roadway on one side and from 10 m on both, a one-way street from 5 m and 7 m.
  // The lanes beside it keep LAW_LANE too (as many as OSM counts). Next to tracks the car keeps LAW_RAIL from the
  // nearest rail (§ 25(2), from 5 to 19 h). A sidewalk at the curb does not decide; only an outer curb counts
  // (not one at a median, a tram bed or another roadway, ctx.kerbOpen).
  // Only outside the paid parking zones (Bára): inside them TSK has surveyed every stall.
  if (!ctx.inZps && (ctx.guessPark ?? PARK_GUESS.has(tags.highway))) {
    const oneway = isOnewayTags(tags) || tags.junction === "roundabout";
    const need = LAW_LANE * Math.max(oneway ? 1 : 2, lanesTotal);
    const lo = trams.length ? Math.min(...trams) - RAIL_HALF : Infinity, hi = trams.length ? Math.max(...trams) + RAIL_HALF : -Infinity;
    for (const [side, st] of [["R", sideR], ["L", sideL]]) {
      if (!(ctx.kerbOpen ?? ["L", "R"]).includes(side) || parked.includes(side) || st.parkingNo || edge.some((x) => x.side === side && x.type === "parkovani")) continue;
      const rest = width - edge.reduce((a, x) => a + x.w, 0) - GUESS_PARK_W;
      if (rest < need - 1e-6) continue;
      // The car's outer side, from the curb strips of this side and the strip itself.
      const own = edge.filter((x) => x.side === side).reduce((a, x) => a + x.w, 0) + GUESS_PARK_W;
      const railGap = side === "R" ? lo - (s + own) : (e - own) - hi;
      if (railGap < LAW_RAIL - 1e-6) continue;
      edge.push({ side, type: "parkovani", w: GUESS_PARK_W, orient: "podelne", source: "odhad" });
    }
  }
  // Parking sits at the curb, the bike lane between it and the traffic.
  edge.sort((a, b) => (a.type === "parkovani" ? -1 : 0) - (b.type === "parkovani" ? -1 : 0));
  const leftEdge = [], rightEdge = [];
  for (const x of edge) {
    if (x.side === "L") { leftEdge.push({ type: x.type, s: e - x.w, e, orient: x.orient, source: x.source }); e -= x.w; }
    else { rightEdge.push({ type: x.type, s, e: s + x.w, orient: x.orient, source: x.source }); s += x.w; }
  }
  let mid = trams.length ? tramLanes(s, e, trams, dirAt) : [];
  // All the street's lanes fit beside the tracks (Národní: lanes=2, one on each side; Spálená: lanes:forward=1
  // and lanes:backward=1): cars do not drive on the tracks, so they are a reserved tram lane in the roadway,
  // level with it (Bára; the tram in a lane with cars is OSM's embedded_rails where the lanes do not fit). Only where OSM counts the lanes, so an unmapped parking lane is not taken for one.
  // Where the lanes fit only with the tram kept to a 3.0 m lane (axis ± TRAM_LANE_HALF; Spálená: 2.4 m beside
  // the usual envelope, 2.7 m beside this one), the narrower one is taken.
  if (trams.length && (tags.lanes || tags["lanes:forward"] || tags["lanes:backward"])) {
    const lo = Math.min(...trams), hi = Math.max(...trams);
    const fitsBeside = (m) => {
      const cars = m.filter((x) => x.type === "pruh");
      const bothSides = cars.some((x) => x.e <= lo) && cars.some((x) => x.s >= hi);
      return cars.length >= ctx.lanesTotal && (bothSides || isOnewayTags(tags));
    };
    const narrow = !fitsBeside(mid) && tramLanes(s, e, trams, dirAt, TRAM_LANE_HALF);
    if (narrow && fitsBeside(narrow)) mid = narrow;
    if (fitsBeside(mid)) for (const x of mid) if (x.type === "tramvaj_v_pruhu") x.type = "tramvaj_pruh";
  }
  if (!trams.length) {
    // One lane on a two-way street carries both directions (no arrow).
    const twoWaySingle = lanesTotal === 1 && !isOnewayTags(tags) && tags.junction !== "roundabout";
    // Lanes wider than the cap leave the rest as a shoulder / hatched area at the curbs (estimate):
    // the technical map has no lane markings, so an even split would make 5–8 m lanes.
    const cap = LANE_CAP_CLASS[ctx.roadClass] ?? LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const excess = (e - s) - lanesTotal * cap;
    // Strips under KRAJNICE_MIN are left in the lanes (a lane 3.7 m wide is no error).
    if (!twoWaySingle && excess >= KRAJNICE_MIN) {
      // A carriageway of a divided road has its shoulder on the outer edge, the driver's right, not along
      // the median; other roadways, one-way town streets too, at both curbs (Bára). One-way by the OSM
      // axis in this roadway, not the clicked street (a divided road's other half).
      const oneway = single && ctx.axesOneway && ctx.divided;
      const both = !oneway && excess >= 2 * KRAJNICE_MIN;
      const outerL = oneway && dirAt((s + e) / 2) === "backward";
      const wR = both ? excess / 2 : outerL ? 0 : excess, wL = both ? excess / 2 : outerL ? excess : 0;
      if (wR) { rightEdge.push({ type: "krajnice", s, e: s + wR, source: "odhad" }); s += wR; }
      if (wL) { leftEdge.unshift({ type: "krajnice", s: e - wL, e, source: "odhad" }); e -= wL; }
    }
    const lw = (e - s) / lanesTotal;
    // A two-way street of one OSM axis has half its lanes each way, wherever the axis lies (an axis off
    // the middle of the roadway turned both lanes one way; Jihlava, Polenská).
    // Only for an axis running in this roadway: a divided road mapped as one way on its median keeps the
    // side of the axis (Prague č. 21, 42).
    const halves = single && ctx.axisInside && !ctx.axesOneway && lanesTotal > 1;
    for (let i = 0; i < lanesTotal; i++) {
      const ls = s + i * lw, le = ls + lw;
      const half = 2 * i + 1 === lanesTotal ? null : 2 * i + 1 < lanesTotal ? "forward" : "backward";
      mid.push({ type: "pruh", s: ls, e: le, dir: twoWaySingle ? undefined : (halves && half) || dirAt((ls + le) / 2) });
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
    .map((x) => ({ type: x.type, s: x.s, e: x.e, dir: x.dir, turn: x.turn, orient: x.orient, bikeDir: x.bikeDir, color: x.color, source: x.source || "osm",
      ...(TRAM_KINDS.has(x.type) && tags.embedded_rails === "tram" ? { embedded: true } : {}) }))
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
function tramLanes(s, e, trams, dirAt, half = TRAM_HALF) {
  const ts = [...trams].sort((a, b) => a - b);
  const src = trams.measured ? "dtm" : "osm";
  const env = ts.map((t) => ({ s: Math.max(s, t - half), e: Math.min(e, t + half), t }));
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

// Offsets along the cut of trees: tree rows crossing the cut and single trees within the reach of it
// (street trees are spaced along the street, rarely on the cut). From OSM, and in Prague from the
// technical map (strom mimo park) and the open data (trees and tree rows of TSK, MHMP and the districts).
function treePositions(osm, frame, center, normal, half, lines = [], reach = REACH) {
  const rows = (osm.elements || [])
    .filter((el) => el.type === "way" && el.tags?.natural === "tree_row")
    .map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  const ts = lineCrossings(rows, center, normal, half).map((t) => ({ t, src: "osm" }));
  ts.push(...lineCrossings(lines.filter((l) => l.code === OD_ROW && l.pts).map((l) => l.pts), center, normal, half).map((t) => ({ t, src: "data" })));
  const lim = reachOf("strom", reach);
  const take = ([x, y], src) => {
    const dx = x - center[0], dy = y - center[1];
    const along = Math.abs(dx * normal[1] - dy * normal[0]);
    if (along <= lim) ts.push({ t: dx * normal[0] + dy * normal[1], src });
  };
  for (const el of osm.elements || []) {
    if (el.type === "node" && el.tags?.natural === "tree") take(frame.toXY(el.geometry[0].lon, el.geometry[0].lat), "osm");
  }
  for (const l of lines) if (l.point && (l.code === TM_TREE || l.code === OD_TREE)) take(l.point, l.code === TM_TREE ? "dtm" : "data");
  // Trees of one row sit at nearly the same offset; keep one position per row, its source the most
  // exact one (technical map, then the city's open data, then OSM).
  const RANK = { dtm: 0, data: 1, osm: 2 };
  const out = [];
  for (const { t, src } of ts.sort((a, b) => a.t - b.t)) {
    const c = out.at(-1);
    if (c && t - c.last < ROW_GAP) { c.sum += t; c.n++; c.last = t; if (RANK[src] < RANK[c.src]) c.src = src; }
    else out.push({ sum: t, n: 1, last: t, src });
  }
  return out.map((c) => ({ t: c.sum / c.n, src: c.src }));
}

// Trees turn a green segment into a tree row, or carve a tree strip (TREE_STRIP wide)
// out of the paved segment holding them.
function insertTrees(segs, trees) {
  let out = segs;
  for (const { t, src } of trees) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    if (host?.type === "zelen") { host.type = "stromorad"; continue; }
    if (!host || !WALK.has(host.type)) continue;
    const s = Math.max(host.s, t - TREE_STRIP / 2), e = Math.min(host.e, t + TREE_STRIP / 2);
    // Leftover sidewalk slivers under 0.5 m join the tree strip.
    const strip = { type: "stromorad", s: s - host.s < 0.5 ? host.s : s, e: host.e - e < 0.5 ? host.e : e, source: src };
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
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "cyklopruh", "ochranny_pruh", "parkovani", "krajnice"]);
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

// Distance from the city centre (km; Old Town Square in Prague, náměstí Svobody in Brno): the inner
// city of tenements versus the outer estates.
// Distance from the centre of the cut's city (city.js centre); far out where no centre is known ("cesko").
const centreKm = ([lon, lat]) => {
  const c = city.centre;
  return c ? Math.hypot((lon - c[0]) * 111.32 * Math.cos((c[1] * Math.PI) / 180), (lat - c[1]) * 111.2) : 99;
};

// OSM building containing a point, with building:levels (+ roof:levels) and height when tagged,
// and the shape of the block it belongs to (blockShape).
export function buildingAt(osm, frame, p) {
  const all = (osm.elements || []).filter((el) => el.type === "area" && el.tags?.building)
    .map((el) => {
      const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
      return { el, ring, rings: [ring, ...(el.holes || []).map((r) => r.map((g) => frame.toXY(g.lon, g.lat)))], bbox: bboxOf(ring) };
    });
  for (const b of all) {
    const [x0, y0, x1, y1] = b.bbox;
    if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1 || !inside(b.rings, p[0], p[1])) continue;
    const { el } = b;
    const levels = parseInt(el.tags["building:levels"], 10);
    const roof = parseInt(el.tags["roof:levels"], 10);
    const height = parseFloat(el.tags.height);
    return { levels: levels ? levels + (roof || 0) : undefined, height: height || undefined, type: el.tags.building, block: blockShape(b, all) };
  }
  return null;
}

// The block a building belongs to: the buildings joined to it wall to wall (a vertex within
// TOUCH of another's outline), and the block's extent along its main axis (length, width, m),
// how much of that rectangle the buildings fill, and how many there are. A panel house is a
// long slab about 10–14 m wide that fills its rectangle; a city block of tenements is wide,
// with a courtyard (low fill); a building standing alone is one part.
const TOUCH = 0.8, BLOCK_MAX = 40;
function blockShape(start, all) {
  const near = (a, b) => a.bbox[0] - TOUCH <= b.bbox[2] && b.bbox[0] - TOUCH <= a.bbox[2] && a.bbox[1] - TOUCH <= b.bbox[3] && b.bbox[1] - TOUCH <= a.bbox[3];
  const segDist = ([px, py], [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  };
  const touches = (a, b) => [[a, b], [b, a]].some(([u, v]) => u.ring.some((q) =>
    v.ring.some((r, i) => i && segDist(q, v.ring[i - 1], r) < TOUCH)));
  const group = [start], seen = new Set([start]);
  for (let i = 0; i < group.length && group.length < BLOCK_MAX; i++) {
    for (const b of all) if (!seen.has(b) && near(group[i], b) && touches(group[i], b)) { seen.add(b); group.push(b); }
  }
  // Main axis of all the outline points (principal component), extents along it and across.
  const pts = group.flatMap((b) => b.ring);
  const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = Math.atan2(2 * sxy, sxx - syy) / 2, [ux, uy] = [Math.cos(ang), Math.sin(ang)];
  const along = pts.map(([x, y]) => (x - mx) * ux + (y - my) * uy), across = pts.map(([x, y]) => -(x - mx) * uy + (y - my) * ux);
  const l = Math.max(...along) - Math.min(...along), w = Math.max(...across) - Math.min(...across);
  const area = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2;
  const filled = group.reduce((a, b) => a + area(b.ring), 0);
  return { length: +l.toFixed(1), width: +w.toFixed(1), fill: +(filled / (l * w || 1)).toFixed(2), parts: group.length };
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

function itemPositions(osm, frame, center, normal, half, lines, reach = REACH) {
  const items = [];
  const osmPoints = [];
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
      osmPoints.push({ kind, x, y });
      const dx = x - center[0], dy = y - center[1];
      const along = Math.abs(dx * normal[1] - dy * normal[0]);
      if (along > reachOf(kind, reach)) continue;
      const item = { kind, t: dx * normal[0] + dy * normal[1], along, stands: true };
      if (kind === "pristresek" && shelterIsTram(el.tags || {}, x, y, stops)) item.tram = true;
      items.push(item);
    } else if (el.type === "way" && BARRIER_ITEM[el.tags?.barrier]) {
      const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
      for (const t of lineCrossings([pts], center, normal, half)) items.push({ kind: BARRIER_ITEM[el.tags.barrier], t, along: 0, osm: true });
    }
  }
  for (const l of lines) {
    if (l.point) {
      // A point of the technical map, unless OSM has the same thing there (an OSM lamp on a traction pole
      // stays a lamp of the pole: the pole is drawn with its lamp).
      const kind = POINT_ITEM[l.code];
      if (!kind) continue;
      const [x, y] = l.point;
      if (osmPoints.some((o) => o.kind === kind && Math.hypot(o.x - x, o.y - y) < SAME_POINT)) continue;
      const dx = x - center[0], dy = y - center[1];
      const along = Math.abs(dx * normal[1] - dy * normal[0]);
      if (along > reachOf(kind, reach)) continue;
      items.push({ kind, t: dx * normal[0] + dy * normal[1], along, stands: true, dtm: true });
      continue;
    }
    const kind = TECH_ITEM[l.code];
    if (kind) for (const t of lineCrossings([l.pts], center, normal, half)) items.push({ kind, t, along: 0 });
  }
  // A lamp on a traction pole (within SAME_POINT across the cut, both within reach) is the pole's lamp.
  for (const p of items) {
    if (p.kind !== "sloup_trakce") continue;
    const lamp = items.find((o) => o.kind === "lampa" && Math.abs(o.t - p.t) < SAME_POINT);
    if (lamp) { p.lamp = true; lamp.drop = true; }
  }
  // One item of a row: of the same kind at about the same offset (the technical map and OSM drawing the
  // same fence, lamps every 30 m along a sidewalk, bollards every 2.5 m) the one nearest the cut stays,
  // where it stands across the street.
  const kept = [];
  for (const it of items.filter((x) => !x.drop).sort((a, b) => a.along - b.along || a.t - b.t)) {
    if (!kept.some((o) => o.kind === it.kind && Math.abs(o.t - it.t) < (it.along || o.along ? ROW_GAP : 1))) kept.push(it);
  }
  return kept.sort((a, b) => a.t - b.t);
}

// Parts where a lamp, bench or other standing thing cannot be: vehicles drive or park there.
const TRAFFIC = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu",
  "cyklopruh", "ochranny_pruh", "parkovani"]);
const ITEM_SHIFT = 3; // an OSM point this far off a kerb is moved onto it (m); further it is left out

function attachItems(segs, items) {
  for (const it of items) {
    let host = segs.find((x) => x.s <= it.t && x.e >= it.t);
    let t = it.t;
    if (it.stands && (!host || TRAFFIC.has(host.type))) {
      // OSM points are a metre or two off: a lamp drawn in a lane goes to the nearest kerbside part.
      const gap = (x) => (t < x.s ? x.s - t : t > x.e ? t - x.e : 0);
      const near = segs.filter((x) => !TRAFFIC.has(x.type) && gap(x) <= ITEM_SHIFT).sort((a, b) => gap(a) - gap(b))[0];
      if (!near) continue;
      const inset = Math.min(0.3, (near.e - near.s) / 2);
      host = near;
      t = Math.min(Math.max(t, near.s + inset), near.e - inset);
    }
    if (!host) continue;
    const item = { kind: it.kind, f: (t - host.s) / Math.max(host.e - host.s, 0.01) };
    if (it.tram) item.tram = true;
    if (it.lamp) item.lamp = true;
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
export function deriveProfile({ center, dir, half, polys, osm, frame, way, tracks = [], parking = [], lines = [], reach, inZps: zoneKnown, itemReach }) {
  const reachItems = { ...REACH, ...itemReach };
  // No-parking sections (Prague, TSK "Zákaz stání"): no surface of their own, they only keep a kerb free.
  const noParking = parking.filter((p) => p.kind === "zakaz");
  parking = parking.filter((p) => p.kind !== "zakaz");
  const at = (t) => [center[0] + normal[0] * t, center[1] + normal[1] * t];
  // Does the cut cross a no-parking section at the kerb at offset `at` (k = 1: the roadway lies at larger t)?
  const noParkingAt = (zs, kerb, k) => {
    if (!zs.length) return false;
    for (let d = -NO_PARKING_OUT; d <= NO_PARKING_IN + 1e-9; d += 0.25) {
      const [x, y] = at(kerb + k * d);
      if (zs.some((z) => x >= z.bbox[0] && x <= z.bbox[2] && y >= z.bbox[1] && y <= z.bbox[3] && inside(z.rings, x, y))) return true;
    }
    return false;
  };
  // The street section of TSK whose line runs along the street nearest to the point at offset t (within
  // SECTION_NEAR): its class, or null.
  const streetClass = (ls, t) => {
    const [px, py] = at(t);
    let best = null;
    for (const l of ls) {
      if (l.code !== OD_SECTION || !l.pts) continue;
      for (let i = 0; i < l.pts.length - 1; i++) {
        const [ax, ay] = l.pts[i], [bx, by] = l.pts[i + 1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        if (len < 0.5 || Math.abs((dx * dir[0] + dy * dir[1]) / len) < 0.8) continue;
        const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (len * len)));
        const d = Math.hypot(px - ax - u * dx, py - ay - u * dy);
        if (d < SECTION_NEAR && (!best || d < best.d)) best = { d, cls: l.cls };
      }
    }
    return best?.cls || null;
  };
  const normal = [-dir[1], dir[0]];
  const cross = crossings(osm, frame, center, normal, half);
  let axisT = cross.find((c) => c.way.id === way.id)?.t ?? 0;
  // Tram track axes: measured ones from the technical map when available, else OSM.
  const measured = lineCrossings(tracks, center, normal, half);
  const tramTs = measured.length ? measured : cross.filter((c) => c.way.tags?.railway === "tram").map((c) => c.t);
  tramTs.measured = measured.length > 0;

  if (!polys.length) return estimateFromOsm(way);
  // Areas above the ground (bridge decks, Brno's MTVU level 1) count only for a cut on a bridge, and
  // then before the ground under them.
  if (polys.some((p) => p.level)) {
    const onBridge = way.tags?.bridge && way.tags.bridge !== "no";
    polys = onBridge ? [...polys.filter((p) => p.level), ...polys.filter((p) => !p.level)] : polys.filter((p) => !p.level);
  }

  const classifyAll = (osmParking) => absorbParkingSlivers(mergeTiny(classify(center, normal, half, [
    ...osmPlatformPolygons(osm, frame),
    ...noParking.map((p) => ({ ...p, code: NO_PARKING })),
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
  if (i0 < 0) return { ...estimateFromOsm(way), runs };
  const carriage = (c) => c === 700 || c === 701 || c === 705;
  // A paved area under the axis of a street (not a path) is its roadway, as an estimate (Brno's MTVU
  // codes a rebuilt road as "manipulační plocha", e.g. Žabovřeská).
  // Not a wide one: a 55 m construction site is no roadway to split into lanes.
  if (city.fix?.roadUnderAxis && STREETS.has(way.tags?.highway) && (runs[i0].code === 1003 || runs[i0].code === 603) && runs[i0].e - runs[i0].s <= 25) {
    runs[i0] = { ...runs[i0], code: 701, guess: true };
  }
  // An OSM axis a few metres beside the roadway (on its sidewalk or verge) is moved onto it, so the
  // profile does not start beside the street (Brno test of 100 cuts: axes 2–4 m off).
  if (city.fix?.axisToRoadway && STREETS.has(way.tags?.highway) && !carriage(runs[i0].code)) {
    const gap = (r) => (axisT < r.s ? r.s - axisT : axisT > r.e ? axisT - r.e : 0);
    const road = runs.filter((r) => carriage(r.code) && gap(r) <= AXIS_SNAP).sort((a, b) => gap(a) - gap(b))[0];
    if (road) {
      axisT = road.s + (road.e - road.s) / 2;
      i0 = runs.indexOf(road);
    }
  }
  // The technical map has no street surface where OSM draws a street (a new road, a field, a
  // gap in MTVU): the profile falls back to OSM and says so.
  if (!MINOR.has(way.tags?.highway) && isUnpaved(runs[i0]?.code)) {
    const code = runs[i0]?.code;
    return { ...estimateFromOsm(way), runs, notice: `Technická mapa tu nemá povrch ulice (${code === null || code === undefined ? "žádná plocha" : `plocha ${code} ${polys.find((p) => p.code === code)?.label || ""}`.trim()}), profil je odhad z OSM.` };
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
  const capL = half - Math.max(0, ref), capR = half + Math.min(0, ref);
  let reachL = Math.min(reach?.left ?? MAX_REACH, capL), reachR = Math.min(reach?.right ?? MAX_REACH, capR);
  // What lies between a street and a house on an estate: lawns, paths, roads, a parking lane. A paved
  // yard, a garden, a field or wood, water or an unknown stretch means a plot of its own (Jihlava č. 53:
  // a family house behind an overgrown plot and its yard), and the profile does not reach over it.
  const streetLand = (r) => r.code === 401 || r.code === 402 || (r.code >= 700 && r.code < 800 && !(r.code === 704 && r.e - r.s >= OPEN_LAND)) || r.code >= 9000; // 9xxx: OSM and TSK parking, platforms, medians
  // A lawn in front of a house (estates: tř. Budovatelů in Most, Bára) belongs to the street: wide
  // greenery ends the profile only where no building follows within the reach on that side.
  const houseAhead = (k, step, limit) => {
    for (; k >= 0 && k < runs.length; k += step) {
      const r = runs[k];
      if (Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit) return false;
      if (isBuilding(r.code)) return true;
      if (!streetLand(r)) return false;
    }
    return false;
  };
  // Facade to facade (Bára): a house beyond the default reach, across lawns and paths, draws the profile
  // out to it, up to the end of the data read (half). A reach shortened by hand stays as it is.
  const facade = (k, step, cap) => {
    for (; k >= 0 && k < runs.length; k += step) {
      const r = runs[k], near = step > 0 ? r.s - ref : ref - r.e;
      if (near > cap) return null;
      if (isBuilding(r.code)) return near;
      if (!streetLand(r)) return null;
    }
    return null;
  };
  if ((reach?.left ?? MAX_REACH) >= MAX_REACH) { const d = facade(i0 + 1, 1, capL); if (d !== null) reachL = Math.max(reachL, Math.min(capL, d + 0.5)); }
  if ((reach?.right ?? MAX_REACH) >= MAX_REACH) { const d = facade(i0 - 1, -1, capR); if (d !== null) reachR = Math.max(reachR, Math.min(capR, d + 0.5)); }
  const stopAt = (r, limit, k, step) => {
    if (isBuilding(r.code)) return "budova";
    // A narrow "other structure" is a wall or parapet (e.g. an embankment wall): the profile goes on.
    if (isMinorStructure(r.code) && r.e - r.s >= WALL_MAX) return "stavba";
    if (inMedian(r)) return null;
    if (r.code >= 500 && r.code < 600 && r.e - r.s >= OPEN_LAND) return "voda";
    if (r.code === 300) return "zahrada";
    if (isOpenLand(r.code) && r.e - r.s >= OPEN_LAND && !houseAhead(k + step, step, limit)) return "zelen";
    // A large parking area beside the street is the edge of the profile, not a parking lane.
    if (r.code === 704 && r.e - r.s >= OPEN_LAND) return "parkoviste";
    // No technical-map surface over a wide stretch: nothing more to measure on this side.
    if (r.code === null && r.e - r.s >= OPEN_LAND) return "volno";
    if (Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit) return "volno";
    return null;
  };
  let lo = i0, hi = i0;
  let right = "volno", left = "volno";
  while (lo > 0) { const s = stopAt(runs[lo - 1], reachR, lo - 1, -1); if (s) { right = s; break; } lo--; }
  while (hi < runs.length - 1) { const s = stopAt(runs[hi + 1], reachL, hi + 1, 1); if (s) { left = s; break; } hi++; }
  const edges = { right, left };

  // A fence or wall beyond the outermost carriageway is the edge of the street (Bára: what is behind
  // the fence is not part of the street profile). Technical-map fences and walls taller than 0.3 m,
  // and OSM fences, walls and hedges.
  const fenceTs = [
    ...lineCrossings(lines.filter((l) => isLine(l) && FENCE_LINES.has(l.code)).map((l) => l.pts), center, normal, half),
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
  })).filter((r) => r.e - r.s > 0.05), cross, lineCrossings(lines.filter((l) => isLine(l) && GUARD_RAILS.has(l.code)).map((l) => l.pts), center, normal, half));
  // A profile cut short by the user ends in open space, not at the building behind.
  if (!kept.length) return { ...estimateFromOsm(way), runs };
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
      // A no-parking section of TSK at the kerb (Prague): no parking there, whatever OSM says.
      for (const [side, at, k] of [["L", r.e, -1], ["R", r.s, 1]]) {
        if (noParkingAt(noParking, at, k)) sideTagsLR[side] = { ...sideTagsLR[side], parking: false, parkingNo: true, kerbDepth: 0 };
      }
      for (const [side, st, at] of [["L", sideTagsLR.L, r.e], ["R", sideTagsLR.R, r.s]]) {
        if (st.kerbDepth && !parked.includes(side)) kerbReqs.push({ side, at, w: st.kerbDepth, orient: st.parkingOrient });
      }
      // The neighbours of the roadway, past the profile end too when the end is a real one (a building), not
      // one cut by the reach.
      const ri = kept.indexOf(r);
      const after = (x) => runs.find((y) => y.s >= x.e - 0.01 && y !== x);
      const before = (x) => [...runs].reverse().find((y) => y.e <= x.s + 0.01 && y !== x);
      const next = kept[ri + 1] || (edges.left === "volno" ? null : after(r));
      const prev = kept[ri - 1] || (edges.right === "volno" ? null : before(r));
      // Outer curbs, where the estimate of parked cars may go: not at a median, a tram bed or another roadway
      // (a sidewalk there or not, Bára).
      // A green strip up to 15 m with a roadway behind it is a median too (Ostrava č. 78).
      const road = (x) => x && (x.code === 700 || x.code === 701);
      const inner = (x, y) => x && (x.code === MEDIAN || x.code === 705 || road(x) || inMedian(x) || (x.code >= 400 && x.code < 500 && x.e - x.s <= 15 && road(y)));
      const kerbOpen = [["L", !inner(next, kept[ri + 2])], ["R", !inner(prev, kept[ri - 2])]].filter(([, ok]) => ok).map(([sd]) => sd);
      // Half of a divided road: across a median or a green strip (up to 15 m) lies another roadway.
      const k = kept.indexOf(r), isRoad = (x) => x && (x.code === 701 || x.code === 700);
      const sep = (a, b) => isRoad(b) && a && (a.code === MEDIAN || inMedian(a) || (a.code >= 400 && a.code < 500 && a.e - a.s <= 15));
      const divided = sep(kept[k - 1], kept[k - 2]) || sep(kept[k + 1], kept[k + 2]);
      // Trolley wires over the street (OSM trolley_wire, or over one direction only: trolley_wire:forward /
      // :backward, Plzeň): its bus lanes carry trolleybuses (Jihlava, Brno).
      const trolley = [tags, ...axes.map((a) => a.tags)].some((t) => ["", ":forward", ":backward"].some((k) => t?.[`trolley_wire${k}`] === "yes"));
      // The class of the street by TSK (Prague): on collector and main roads (MK I, II, roads of the state) cars
      // do not park at the kerb, whatever OSM calls them, so no parking is estimated there. Elsewhere OSM decides
      // (A/B: an MK III that OSM calls tertiary had no parked cars in 5 of 6 cuts, evaluation/praha-opendata).
      const cls = streetClass(lines, (r.s + r.e) / 2);
      const guessPark = cls && (cls.road || cls.motorway || cls.mk === 1 || cls.mk === 2) ? false : undefined;
      const roadClass = classGroup(cls);
      segs.push(...splitRoadway(r, { guessPark, tags, trams: inside, dirAt, lanesTotal, along: ownAxis ? (ownAxis.along !== (tags.oneway === "-1")) : true, single: new Set(axes.map((a) => a.id)).size === 1, parked, sides: sideTagsLR, kerbOpen, inZps, axesOneway: axes.every((a) => a.oneway), axisInside: here.length > 0, divided, roadClass }).map((x) => ({ ...x, mtvu: r.code, trolley: trolley && (x.type === "bus" || x.type === "bus_cyklo"), roadClass })));
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
    } else if (type === "tramvaj" || (type === "zelen" && r.e - r.s >= GRASS_BED_MIN && tramTs.some((t) => t > r.s + 0.5 && t < r.e - 0.5))) {
      // A separate tram bed (MTVU 705 and the towns' equivalents), or a green area with tracks in it: a bed
      // of grass. Wider than 5 m it carries a track each way.
      const bed = type === "zelen" ? { kind: "trava", source: "dtm" } : bedOf(cross, r);
      const parts = r.e - r.s > 5 ? [[r.s, (r.s + r.e) / 2, "forward"], [(r.s + r.e) / 2, r.e, "backward"]] : [[r.s, r.e, undefined]];
      for (const [a, b, d] of parts) segs.push({ type: "tramvaj", s: a, e: b, dir: d, bed: bed.kind, bedSource: bed.source, source: "dtm" });
    } else if (type === "cyklostezka") {
      segs.push(...cycleTrack(r, cross, dir));
    } else {
      if (type === "chodnik") segs.push(...sidewalkUse(r, cross, way, axisT, dir));
      else segs.push({ type, s: r.s, e: r.e, source: r.code === null ? "odhad" : "dtm" });
    }
  }
  // Tracks with no car lane beside them in their roadway, while the cars have lanes of their own
  // elsewhere in the street, lie between the carriageways (Patočkova): a tram belt.
  if (segs.some((x) => x.type === "pruh")) {
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].type !== "tramvaj_v_pruhu") continue;
      let j = i;
      while (segs[j + 1]?.type === "tramvaj_v_pruhu") j++;
      const besideCars = [segs[i - 1], segs[j + 1]].some((x) => x && TRAFFIC.has(x.type) && x.type !== "tramvaj_v_pruhu");
      // Tracks of a street with rails in its roadway (embedded_rails) are a reserved tram lane, level with it;
      // without, the tracks lie apart from the carriageway: a separate tram bed (Bára).
      if (!besideCars) {
        for (let k = i; k <= j; k++) {
          if (segs[k].embedded) segs[k].type = "tramvaj_pruh";
          else Object.assign(segs[k], { type: "tramvaj", bed: "panely", bedSource: "odhad" });
        }
      }
      i = j;
    }
  }
  // Buses on the tram tracks (psv / bus = yes or designated, highway=busway on a tram way): the tram part is
  // a lane for trams and buses (Prague: about 186 such tracks).
  const busTracks = cross.filter((c) => c.way.tags?.railway === "tram" && tramWithBus(c.way.tags)).map((c) => c.t);
  for (const x of segs) if (TRAM_KINDS.has(x.type) && busTracks.some((t) => t >= x.s - 0.3 && t <= x.e + 0.3)) x.withBus = true;
  // Roadway outer edges are measured; only the internal split comes from OSM.
  const withKerb = carveKerbParking(markIslands(segs), kerbReqs);
  const withPlatforms = insertPlatforms(withKerb, platformPositions(osm, frame, center, normal, half), axisT);
  const withTrees = insertTrees(withPlatforms, treePositions(osm, frame, center, normal, half, lines, reachItems));
  const withItems = attachItems(perpDepth(mergeParking(withTrees)), itemPositions(osm, frame, center, normal, half, lines, reachItems));
  // Points 4 m inside the buildings at both ends, for their height and number of floors.
  const probe = { left: at(kept.at(-1).e + 4), right: at(kept[0].s - 4) };
  for (const side of ["left", "right"]) {
    if (edges[side] !== "budova") continue;
    const b = buildingAt(osm, frame, probe[side]);
    const point = frame.toLonLat(...probe[side]);
    edges[`${side}Info`] = { levels: b?.levels, height: b?.height, point, km: +centreKm(point).toFixed(1), block: b?.block, tint: side === "left" ? 0 : 3 };
    if (b?.type && b.type !== "yes") edges[`${side}Info`].type = b.type;
  }
  // A part lying mostly on an area the technical map leaves open (completed along OSM), or on parking
  // stalls of a paid zone (Plzeň), is an estimate.
  const guessed = runs.filter((r) => r.guess);
  if (guessed.length) {
    for (const x of withItems) {
      const over = guessed.reduce((a, r) => a + Math.max(0, Math.min(r.e, x.e) - Math.max(r.s, x.s)), 0);
      if ((x.source === "dtm" || x.source === "tsk") && over > (x.e - x.s) / 2) x.source = "odhad";
    }
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
  if (x.trolley) seg.trolley = true;
  if (x.type === "tramvaj") { seg.bed = x.bed || "panely"; if (x.bedSource === "odhad") seg.bedGuess = true; }
  if (x.withBus) seg.withBus = true;
  if (x.roadClass && LANE_TYPES.has(x.type)) seg.roadClass = x.roadClass;
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
