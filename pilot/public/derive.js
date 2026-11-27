// Derive a street profile from a cut line, IPR MTVU surfaces and OSM ways.
// Geometry works in a local metric frame (x east, y north, metres) around the cut centre.
import { typeFromMtvu, isBuilding, isMinorStructure, DEFAULT_WIDTH, PERMEABLE_TYPES } from "./types.js";
import { city, country } from "./city.js";
import { t, num } from "./i18n.js";
import { P as ORTHO_P, partnerReach } from "./ortho-osm.js";

const STEP = 0.05; // sampling step along the cut (m)
const MIN_RUN = 0.3; // runs narrower than this merge into a neighbour (m)
export const MAX_REACH = 22; // default reach of the profile from the street axis on each side (m)
const WALL_MAX = 2; // "ostatní stavby" narrower than this are walls / parapets, not a structure ending the street (m)
const PASSAGE_MIN = 10; // an "ostatní stavby" piece this long along the cut with a street through it is a passage over the street (m)
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
// The surface of a separate tram bed from the OSM tram ways in it: grass, gravel (ballast), asphalt or panels
// (other paving: concrete, plates, sett); unknown → decided by bedSurfaces below, as an estimate.
const BED_OF_SURFACE = { grass: "trava", grass_paver: "trava", gravel: "strk", fine_gravel: "strk", ballast: "strk", pebblestone: "strk", asphalt: "asfalt" };
function bedOf(cross, r) {
  const tags = cross.filter((c) => c.t > r.s - 0.3 && c.t < r.e + 0.3 && c.way.tags?.railway === "tram").map((c) => c.way.tags);
  for (const t of tags) {
    const v = t["railway:track_bed"] || t["tram:bed"] || t.surface;
    if (BED_OF_SURFACE[v]) return { kind: BED_OF_SURFACE[v], source: "osm" };
    if (v) return { kind: "panely", source: "osm" };
  }
  return { kind: "panely", source: "odhad" };
}
// A bed no source describes (Bára 10. 11. 2026, A/B in evaluation/pravidla-11-2026/ZPRAVA.md, section 4): grass
// where the orthophoto is green (ortho.js), else the rules: asphalt where buses use the tracks (nowadays mostly
// asphalt); panels in a pedestrian street; gravel for a bed beside the street (a roadway on one side only) or
// BED_WIDE or more between two carriageways; panels in a narrower bed between carriageways. Each stays marked
// as an estimate. segs: the parts in cut order (s, e); rails: track axes; ortho: the
// orthophoto (ortho.js bedOrtho, or none); at: offset → point; dir: along the street; highway: the street's.
const BED_WIDE = 6;
const ROADWAY_PART = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "parkovani", "cyklopruh", "ochranny_pruh"]);
export function bedSurfaces(segs, { rails = [], ortho, at, dir, highway } = {}) {
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].type !== "tramvaj" || segs[i].bedSource !== "odhad") continue;
    let j = i;
    while (segs[j + 1]?.type === "tramvaj" && segs[j + 1].bedSource === "odhad") j++;
    const bed = segs.slice(i, j + 1), s = bed[0].s, e = bed.at(-1).e;
    const seen = ortho?.look && at ? ortho.look(s, e, rails.filter((t) => t > s && t < e), at, dir)?.kind : null;
    const bus = bed.some((x) => x.withBus);
    const between = segs.slice(0, i).some((x) => ROADWAY_PART.has(x.type)) && segs.slice(j + 1).some((x) => ROADWAY_PART.has(x.type));
    const kind = seen === "trava" ? "trava"
      : bus ? "asfalt"
      : highway === "pedestrian" || city.bedPanels ? "panely" // Plzeň: mostly panel beds about 6 m wide (A/B)
      : !between || e - s >= BED_WIDE - 1e-9 ? "strk" : "panely";
    for (const x of bed) Object.assign(x, { bed: kind, bedSource: "odhad" });
    i = j;
  }
  return segs;
}
// Lanes under trolley wires, and a street open to public transport but closed to other motor traffic.
const WIRED = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"]);
const transitOnly = (t) => ["yes", "designated"].includes(t.psv || t.trolleybus || t.bus) &&
  ["no", "delivery", "destination", "permit", "private"].includes(t.motor_vehicle ?? t.vehicle ?? t.access);
// A way private cars may not use (motorcar, else motor_vehicle, vehicle, access = no; the more special tag decides). Its
// lanes are not drawn with a passenger car (Bára 27. 11. 2026: Augustusbrücke in Dresden, motor_vehicle=no, B 11 in the
// signs and a car in the lanes): a lane for buses where OSM lets public transport in (psv, bus, trolleybus yes or
// designated), else a lane with no vehicle (seg.noCar). ?off=bezaut.
const carsBanned = (t) => !ORTHO_P.off?.has("bezaut") && ["motorcar", "motor_vehicle", "vehicle", "access"].map((k) => t[k]).find((v) => v !== undefined) === "no";
const transitAllowed = (t) => ["psv", "bus", "trolleybus"].some((k) => ["yes", "designated"].includes(t[k]));
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
const STOP_GAP = { pristresek: 4, oznacnik: 4 }; // a stop's shelter or post: one within this across (m)
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

// A street's name for comparing a searched one with OSM's: without accents, case, the kind of street and particles.
// CartoCiudad (search-es.js) gives "PASEO GRACIA" where OSM has "Passeig de Gràcia" (the review of Spain).
const STREET_WORDS = /^(calle|carrer|rua|avenida|avinguda|avda|paseo|passeig|plaza|placa|praza|ronda|camino|cami|carretera|travesia|glorieta|de|del|la|las|los|el|els|les|d|da|do|dos|das)$/;
const looseName = (n) => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STREET_WORDS.test(w)).join(" ");
const sameStreet = (a, b, loose) => a === b || (!!loose && looseName(a) === loose);

// Indoor corridors and passages through buildings are never the street being cut.
const isStreet = (el) => el.type === "way" && !!el.tags?.highway && !!el.geometry && el.tags.highway !== "corridor" && el.tags.indoor !== "yes" && el.tags.tunnel !== "building_passage" && !isUnderground(el.tags);
// Nearest street (highway way) to a point; minor ways only win when much closer.
// name: the street the user searched for (an address on a corner, search-at.js): a way of that name within 30 m wins.
export function nearestStreet(osm, frame, p, name = null) {
  let best = null;
  const loose = name && looseName(name);
  for (const el of osm.elements || []) {
    if (!isStreet(el)) continue;
    const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
    const c = closestOnPolyline(pts, p);
    const sidewalk = ["sidewalk", "crossing"].includes(el.tags.footway);
    const score = c.d + (sidewalk ? 25 : MINOR.has(el.tags.highway) ? 10 : 0) - (name && sameStreet(el.tags.name, name, loose) && c.d < 30 ? 30 : 0);
    if (!best || score < best.score) best = { ...c, score, way: el, pts };
  }
  return best;
}

// A click on a promenade between the two carriageways of a street (Bára 27. 11. 2026, Unter den Linden in Berlin: the
// cut took the footway down the middle, 2 m of paving, not the street): a footway, path, pedestrian way or cycleway
// with a one-way carriageway of one name on each side of it, driving opposite ways, both along it, within PARTNER_REACH
// of it, is the street's middle: the nearer carriageway is the cut's way (centerOnStreet then centres the cut on the
// street). ?off=promenade: as before.
const PROMENADE = new Set(["footway", "path", "pedestrian", "cycleway"]);
export function streetAround(osm, frame, near, p = [0, 0]) {
  if (!near?.way || ORTHO_P.off?.has("promenade") || !PROMENADE.has(near.way.tags?.highway) || ["sidewalk", "crossing"].includes(near.way.tags.footway)) return near;
  const sides = {};
  for (const el of osm.elements || []) {
    if (!isStreet(el) || MINOR.has(el.tags.highway) || !el.tags.name || !isOnewayTags(el.tags)) continue;
    const pts = el.geometry.map((g) => frame.toXY(g.lon, g.lat)), c = closestOnPolyline(pts, near.point);
    if (!c.point || c.d > PARTNER_REACH || Math.abs(c.dir[0] * near.dir[0] + c.dir[1] * near.dir[1]) < 0.7) continue;
    const side = Math.sign((c.point[0] - near.point[0]) * near.dir[1] - (c.point[1] - near.point[1]) * near.dir[0]);
    if (!side) continue;
    const drive = el.tags.oneway === "-1" ? -1 : 1, d = [c.dir[0] * drive, c.dir[1] * drive];
    const slot = (sides[el.tags.name] ||= {});
    if (!slot[side] || c.d < slot[side].c.d) slot[side] = { c, d, el, pts };
  }
  const pairs = Object.values(sides).filter((q) => q[1] && q[-1] && q[1].d[0] * q[-1].d[0] + q[1].d[1] * q[-1].d[1] < 0);
  if (!pairs.length) return near;
  const q = pairs.sort((a, b) => a[1].c.d + a[-1].c.d - b[1].c.d - b[-1].c.d)[0], w = q[1].c.d <= q[-1].c.d ? q[1] : q[-1];
  return { ...w.c, score: w.c.d, way: w.el, pts: w.pts };
}

// The street of a saved cut (the way in its link, share.js cutHash) at the frame's origin, as nearestStreet gives it, or
// null where it is not any more: the way deleted, underground, farther than SAVED_MAX, or ending before the cut (OSM
// split it; a piece ending a few metres short, SAVED_GAP, still is the street).
const SAVED_GAP = 5; // m
export function savedStreet(osm, frame, id) {
  const way = (osm.elements || []).find((el) => el.id === id && isStreet(el));
  if (!way) return null;
  const pts = way.geometry.map((g) => frame.toXY(g.lon, g.lat)), c = closestOnPolyline(pts, [0, 0]);
  if (!c.point || c.d > SAVED_MAX) return null;
  const ring = Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 0.01;
  const past = !ring && [pts[0], pts.at(-1)].some((q) => Math.hypot(q[0] - c.point[0], q[1] - c.point[1]) < 0.01);
  if (past && Math.abs(c.point[0] * c.dir[0] + c.point[1] * c.dir[1]) > SAVED_GAP) return null;
  return { ...c, way, pts };
}

// A dragged cut follows its street onto the ways that continue it (Bára 26. 11. 2026: on Kraków's Kościuszki the cut
// could not be dragged onto the bridge, a way of its own in OSM): the way it is on and the ways joined end to end with
// it (the same point within JOIN_M), on and on up to CHAIN ways, minor ways only when the street is one; the nearest of
// them to p. The street at a junction goes on as the way that comes nearest to the dragged point.
const JOIN_M = 0.5, CHAIN = 12;
export function dragAlong(osm, frame, way, p) {
  const minorOk = MINOR.has(way.tags?.highway);
  const ways = (osm?.elements || []).filter((el) => isStreet(el) && (minorOk || !MINOR.has(el.tags.highway) || el.id === way.id));
  const ptsOf = new Map(ways.map((el) => [el.id, el.geometry.map((g) => frame.toXY(g.lon, g.lat))]));
  if (!ptsOf.has(way.id)) ptsOf.set(way.id, way.geometry.map((g) => frame.toXY(g.lon, g.lat)));
  const ends = (pts) => [pts[0], pts.at(-1)];
  const joined = (a, b) => ends(a).some((x) => ends(b).some((y) => Math.hypot(x[0] - y[0], x[1] - y[1]) < JOIN_M));
  const chain = [way], seen = new Set([way.id]);
  for (let i = 0; i < chain.length && chain.length < CHAIN; i++) {
    const at = ptsOf.get(chain[i].id);
    for (const el of ways) if (!seen.has(el.id) && joined(at, ptsOf.get(el.id))) { seen.add(el.id); chain.push(el); if (chain.length >= CHAIN) break; }
  }
  let best = null;
  for (const el of chain) {
    const pts = ptsOf.get(el.id), c = snapToWay(pts, p);
    const d = Math.hypot(c.point[0] - p[0], c.point[1] - p[1]);
    if (!best || d < best.d - 1e-9) best = { ...c, d, way: el, pts };
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
// A service way joins like a street (Bára 25. 11. 2026, one rule everywhere; first Brno's, 9. 11. 2026: side streets are
// often service in OSM, Kohoutova's unnamed dead-end access roads of 130–150 m, so a name or a way through tells nothing),
// but not a driveway, a parking aisle or a drive-through. ?off=obsluzne: no service way joins (Prague before; an alley
// still does). On a dual carriageway a service way alone does not push the cut to where it would cross a junction of the
// street's other carriageway: it stays (Poděbradská, Prague č. 20 of 9. 11.: from 7 m off one mouth onto the mouth of a car
// park opposite; ?off=protejsi: it goes). A clearance of 9 m in place of a street's was tried: in Prague as good against
// MTVU, in Brno and abroad worse (evaluation/sjednoceni/praha).
const PARTNER_REACH = 40; // m: how far the other carriageway may lie
const NOT_JUNCTION_SERVICE = new Set(["driveway", "parking_aisle", "drive-through"]);
// The mouth of an alley joins as a crossing does (Bára 24. 11. 2026, the USA pilot dc-1-1: a cut on an alley's mouth ran
// along the alley, 36 m of paving and no sidewalk): an OSM way service=alley meeting the street, and an alley's area (an
// OSM area with area:highway=service or service=alley, or a surface map's alley a module adds to the OSM elements as
// such) within ALLEY_REACH of the street's axis, at the point of the axis nearest to it. The clearance: CROSSING_CLEARANCE
// beyond the alley's half width. ?off=ulicky: as before.
// Only for a street it opens onto (Bára 25. 11. 2026, the review's W1: an alley's area was a mouth of the way inside it too
// and a click there went to the way's end, 75–137 m): an area beside the axis for longer than ALLEY_MOUTH, or with most
// of the way inside it, is the way's own (along its middle, its edge or a part of it). Measured around five places of
// Washington: mouths onto streets 0–16 m long, the ways' own areas 24 m and more. ?off=ulickysve: the area of any way.
const ALLEY_REACH = 12; // m from the axis (a wide roadway's kerb and its sidewalk)
const ALLEY_MOUTH = 20; // m along the axis
const isAlleyArea = (el) => el.type === "area" && el.geometry?.length > 2 && (el.tags?.["area:highway"] === "service" || el.tags?.service === "alley");
const AXIS_SNAP = 4.5; // m: an OSM axis this close beside the roadway belongs to it (deriveProfile, the axis to the roadway)
// Streets for the axis fixes: roads and residential streets, not tracks or bridleways (Brno test č. 99).
const isRoadway = (c) => c === 700 || c === 701;
const OTHER_CUT = typeof location !== "undefined" && new URLSearchParams(location.search).get("otherstreet") === "1";
const OTHER_WALK = 1.5, OTHER_ANGLE = Math.cos((20 * Math.PI) / 180); // m of sidewalk or green before the other street; an axis turned more than 20° from the cut's street
// A crossing c of the cut's line by another street for cars: named otherwise, turned away, not a link nor on another level.
const levelTag = (t) => Number(t?.layer) || (inTunnel(t) ? -1 : t?.bridge && t.bridge !== "no" ? 1 : 0);
const otherStreet = (c, way, dir, cross) => {
  const t = c.way.tags || {}, own = way?.tags || {};
  return c.way.id !== way?.id && !!own.name && !!t.name && t.name !== own.name && CAR_ROADS.has(t.highway) && !/_link$/.test(t.highway) && levelTag(t) === levelTag(own)
    && Math.abs(c.d[0] * dir[0] + c.d[1] * dir[1]) < OTHER_ANGLE && !cross.some((x) => x.way.id !== c.way.id && x.way.tags?.name === own.name && Math.abs(x.t - c.t) < 4);
};
const STREETS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);
// Roads for cars, not living streets or pedestrian zones (deriveProfile roadOnPath).
const CAR_ROADS = new Set([...STREETS].filter((h) => h !== "living_street"));
const ROAD_ON_PATH_MIN = 5; // m (deriveProfile roadOnPath)
const ROAD_UNDER_AXIS_MIN = 3; // m: a paved area under the axis narrower than a lane (3.00 m) is no roadway


// Move a snapped point along its way away from junctions and pedestrian crossings, where a
// perpendicular cut runs along a side street or over a zebra. Junctions are nodes the way shares
// with another street (its plain continuation under the same name does not count); the way ends
// keep END_CLEARANCE as before. The point stays on its own way, as close to the click as possible.
// The point of the polyline pts nearest to q: { dist, p }.
function nearestOnLine(pts, q) {
  let best = null;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], d = [b[0] - a[0], b[1] - a[1]], L2 = d[0] * d[0] + d[1] * d[1];
    if (!L2) continue;
    const u = Math.max(0, Math.min(1, ((q[0] - a[0]) * d[0] + (q[1] - a[1]) * d[1]) / L2)), p = [a[0] + u * d[0], a[1] + u * d[1]];
    const dist = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (!best || dist < best.dist) best = { dist, p };
  }
  return best;
}
// Where a cut stands on the street found (near): a click is moved away from junctions and, on a street of two one-way
// carriageways, to their middle; a saved cut (exact: a #rez= link or a pasted position with its azimuth) stays where it
// was saved, whatever the rules or OSM say today (Bára 25. 11. 2026), unless the street is too far to be the one saved.
const SAVED_MAX = 40; // m, the reach of centerOnStreet
export function placeCut(osm, frame, near, exact = false) {
  if (exact && Math.hypot(...near.point) <= SAVED_MAX) return { ...near, point: [0, 0] };
  return centerOnStreet(osm, frame, awayFromJunctions(osm, frame, near));
}

// Where an alley's area meets the street's axis pts (local metres): a list of { p, clear }, one a mouth (an alley round a
// block has several). The points of its ring within ALLEY_REACH of the axis, in stretches along the axis (a gap of more than
// ALLEY_REACH ends one): the middle of the stretch, the clearance beyond its half. A stretch over ALLEY_MOUTH is no mouth.
function alleyMouths(el, pts, frame) {
  const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat)), at = [], cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum.at(-1), b = bboxOf(pts), along = (d) => {
    const i = Math.max(1, cum.findIndex((c) => c >= d)), l = cum[i] - cum[i - 1] || 1, u = Math.min(1, (d - cum[i - 1]) / l);
    return [pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1])];
  };
  ring.forEach((q, i) => {
    const o = ring[(i + 1) % ring.length], n = Math.max(1, Math.ceil(Math.hypot(o[0] - q[0], o[1] - q[1])));
    for (let k = 0; k < n; k++) {
      const r = [q[0] + ((o[0] - q[0]) * k) / n, q[1] + ((o[1] - q[1]) * k) / n];
      if (r[0] < b[0] - ALLEY_REACH || r[0] > b[2] + ALLEY_REACH || r[1] < b[1] - ALLEY_REACH || r[1] > b[3] + ALLEY_REACH) continue;
      const best = closestOnPolyline(pts, r);
      if (best.d <= ALLEY_REACH) at.push(cum[best.index] + Math.hypot(best.point[0] - pts[best.index][0], best.point[1] - pts[best.index][1]));
    }
  });
  if (!at.length) return [];
  if (!ORTHO_P.off?.has("ulickysve")) {
    let ins = 0, n = 0;
    for (let d = 0.5; d < total; d++, n++) if (inside([ring], ...along(d))) ins++;
    if (ins > n / 2) return [];
  }
  at.sort((x, y) => x - y);
  const stretches = [];
  for (const d of at) {
    const last = stretches.at(-1);
    if (last && d - last[1] <= ALLEY_REACH) last[1] = d; else stretches.push([d, d]);
  }
  return stretches.filter(([s, e]) => e - s <= ALLEY_MOUTH || ORTHO_P.off?.has("ulickysve"))
    .map(([s, e]) => ({ p: along((s + e) / 2), clear: CROSSING_CLEARANCE + (e - s) / 2 }));
}

// What a click on a street keeps away from (local metres): { p, clear, service, kind }: the mouths of alleys, other streets
// and service ways that join, crossings, roundabouts and turning circles. Exported for evaluation/kliky.
export function junctionHits(osm, frame, near) {
  const geom = near.way.geometry, pts = near.pts;
  const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
  const idx = new Map(geom.map((g, i) => [key(g), i]));
  const lastI = geom.length - 1;
  const hits = [];
  const alleys = !ORTHO_P.off?.has("ulicky"), services = !ORTHO_P.off?.has("obsluzne");
  for (const el of osm.elements || []) {
    if (alleys && isAlleyArea(el)) {
      for (const hit of alleyMouths(el, pts, frame)) hits.push({ ...hit, service: true, kind: "alley" });
      continue;
    }
    if (el.id === near.way.id || !el.tags?.highway || !el.geometry) continue;
    if (el.type === "node" && ["turning_circle", "turning_loop"].includes(el.tags.highway)) {
      hits.push({ p: frame.toXY(el.geometry[0].lon, el.geometry[0].lat), clear: LOOP_CLEARANCE, kind: "loop" });
      continue;
    }
    if (el.type !== "way") continue;
    if (el.tags.junction === "roundabout" || el.tags.junction === "circular") {
      for (const g of el.geometry) hits.push({ p: frame.toXY(g.lon, g.lat), clear: LOOP_CLEARANCE, kind: "loop" });
    }
    const crossing = el.tags.footway === "crossing" || el.tags.cycleway === "crossing";
    // A service road joins like a street (NOT_JUNCTION_SERVICE above), an alley always.
    const sideService = el.tags.highway === "service" && ((services && !NOT_JUNCTION_SERVICE.has(el.tags.service)) || (alleys && el.tags.service === "alley"));
    if (MINOR.has(el.tags.highway) && !crossing && !sideService) continue;
    el.geometry.forEach((g, j) => {
      const i = idx.get(key(g));
      if (i === undefined) return;
      const endToEnd = (i === 0 || i === lastI) && (j === 0 || j === el.geometry.length - 1);
      if (!crossing && endToEnd && el.tags.name === near.way.tags.name) return; // the street goes on
      hits.push({ p: pts[i], clear: crossing ? CROSSING_CLEARANCE : JUNCTION_CLEARANCE, service: sideService, kind: crossing ? "crossing" : sideService ? "service" : "street" });
    });
  }
  return hits;
}

export function awayFromJunctions(osm, frame, near) {
  const pts = near.pts, hits = junctionHits(osm, frame, near);
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
  const slack = (d, p, of = hits) => Math.min(
    Math.min(d, total - d) - Math.min(END_CLEARANCE, total / 2),
    ...of.map((h) => Math.hypot(p[0] - h.p[0], p[1] - h.p[1]) - h.clear),
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
  if (best && !ORTHO_P.off?.has("protejsi") && hits.some((h) => h.service) && slack(start, near.point, hits.filter((h) => !h.service)) >= 0
    && partnerJunctions(osm, frame, near).some((h) => Math.hypot(best.point[0] - h[0], best.point[1] - h[1]) < JUNCTION_CLEARANCE)) return near;
  return best ? { ...near, point: best.point, dir: best.dir, index: best.index } : near;
}

// The junctions on the other carriageway of a street of two one-way halves (its name, driving the other way, dualPartner's
// test along the whole street), as points of the cut's own axis.
function partnerJunctions(osm, frame, near) {
  const name = near.way.tags?.name;
  if (!name || !isOnewayTags(near.way.tags)) return [];
  const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
  const vector = (el) => {
    const [a, b] = [el.geometry[0], el.geometry[el.geometry.length - 1]].map((g) => frame.toXY(g.lon, g.lat)), sgn = el.tags.oneway === "-1" ? -1 : 1;
    return [sgn * (b[0] - a[0]), sgn * (b[1] - a[1])];
  };
  const own = vector(near.way), at = new Map(), partners = new Set();
  const ways = (osm.elements || []).filter((el) => el.type === "way" && el.id !== near.way.id && el.geometry && el.tags?.highway);
  for (const el of ways) {
    if (el.tags.name !== name || !isOnewayTags(el.tags) || MINOR.has(el.tags.highway)) continue;
    const v = vector(el);
    if (v[0] * own[0] + v[1] * own[1] >= 0) continue;
    partners.add(el.id);
    for (const g of el.geometry) {
      const q = nearestOnLine(near.pts, frame.toXY(g.lon, g.lat));
      if (q && q.dist <= partnerReach(PARTNER_REACH)) at.set(key(g), q.p);
    }
  }
  return ways.filter((el) => !partners.has(el.id) && el.tags.name !== name && (!MINOR.has(el.tags.highway) || (el.tags.highway === "service" && !NOT_JUNCTION_SERVICE.has(el.tags.service))))
    .flatMap((el) => el.geometry.map((g) => at.get(key(g))).filter(Boolean));
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
const KERB_POSITIONS = new Set(["on_kerb", "half_on_kerb"]);
// Without a tag, the depth of the parking strip tells the orientation (a car is ~2 m wide, ~4.5 m long).
const orientFromDepth = (w) => (w < 3.2 ? "podelne" : w < PERP_MIN ? "sikme" : "kolme");
// ČSN 73 6056: perpendicular stalls are 5.0 m deep, 4.5 m where cars overhang the kerb.
export const PERP_MIN = 4.5;

// TSK parking sections carry the number of stalls (PS_ZPS): the section length along the
// street per stall tells the orientation (parallel ~5.5–6.5 m, angled ~3.5 m, perpendicular
// ~2.5 m, more with driveways and trees in between). The depth across the street settles
// borderline cases: a perpendicular stall needs ~5 m, a parallel one ~2–2.5 m.
export function orientFromStalls(poly, dir) {
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

// Street parking of another road (a side road beside the street, Generála Šišky: Bára "to už je ale mimo profil ulice,
// na boční cestě") is not the street's: an area whose nearest drivable road is not the street (nor of its name) is
// left out (?off=bocni).
const DRIVABLE = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|road)(_link)?$/;
function ownParking(el, osm, frame, way) {
  if (!way || ORTHO_P.off?.has("bocni")) return true;
  const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat)), c = [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length];
  const dist = (w) => {
    const pts = w.geometry.map((g) => frame.toXY(g.lon, g.lat));
    let d = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, u = l ? Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l)) : 0;
      d = Math.min(d, Math.hypot(a[0] + u * dx - c[0], a[1] + u * dy - c[1]));
    }
    return d;
  };
  let best = null;
  for (const w of osm.elements || []) {
    if (w.type !== "way" || !DRIVABLE.test(w.tags?.highway || "") || w.tags.service === "parking_aisle") continue;
    const d = dist(w);
    if (!best || d < best.d) best = { d, w };
  }
  return !best || best.w.id === way.id || (way.tags?.name && best.w.tags.name === way.tags.name);
}
// A parking area mapped as a plain lot (parking=surface or no type) but drawn as a narrow strip along a street is the
// street's roadside parking (Krátká, Česká Třebová: a 4 m strip 150 m long, its angled stalls were drawn as the estimated
// parallel ones on both sides). A lot is deeper: mean depth (area / length) up to STRIP_DEPTH_MAX and long (?off=stripparking).
const STRIP_DEPTH_MAX = 6, STRIP_ELONGATION = 3, STRIP_LENGTH_MIN = 30; // m: a shorter bit is a lot's corner
function isParkingStrip(el, frame) {
  if (ORTHO_P.off?.has("stripparking") || !(el.tags.parking === "surface" || el.tags.parking === undefined) || el.holes?.length) return false;
  const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
  let area = 0, length = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length; j++) length = Math.max(length, Math.hypot(ring[i][0] - ring[j][0], ring[i][1] - ring[j][1]));
  const depth = Math.abs(area) / 2 / (length || 1);
  return depth <= STRIP_DEPTH_MAX && length >= Math.max(STRIP_ELONGATION * depth, STRIP_LENGTH_MIN);
}
function osmParkingPolygons(osm, frame, way) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && el.tags?.amenity === "parking" && (STREET_PARKING.has(el.tags.parking) || isParkingStrip(el, frame)) && ownParking(el, osm, frame, way))
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      // parking=lane is parking in the roadway, parallel unless OSM says otherwise: its area drawn roughly deep does not
      // make it angled (Klánovická: a lane area 3.5 m deep read as angled parking; the orthophoto shows a parallel lane).
      const orient = ORIENT[el.tags.orientation] || (el.tags.parking === "lane" ? "podelne" : undefined);
      return { code: OSM_PARKING, orient, rings, bbox: bboxOf(rings[0]) };
    });
}

// Plain polygons from an ArcGIS JSON response (e.g. TSK parking sections), in local coordinates.
export function esriPolygons(json, frame) {
  return (json.features || []).map((f) => {
    const rings = f.geometry.rings.map((r) => r.map(([lon, lat]) => frame.toXY(lon, lat)));
    // ODHAD: stalls whose place is estimated (Plzeň: a paid zone tells that people pay, not where they stand).
    // ORIENT: the stalls' orientation where the source says it (Amsterdam's parking spaces), else from their count.
    return { rings, bbox: bboxOf(rings.flat()), count: Number(f.attributes?.PS_ZPS) || 0, kind: f.attributes?.KIND || "useky", guess: f.attributes?.ODHAD === 1, ...(f.attributes?.ORIENT && { orient: f.attributes.ORIENT }) };
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
      dtmTram: f.attributes.DTM_TRAM === 1, // the national DTM's tram area: tracks in the roadway or apart from it
      // A town's tram area that takes in tracks lying in the roadway as well (Berlin's Gleiskörper): OSM tells.
      anyTram: f.attributes.ANY_TRAM === 1,
      fromLines: f.attributes.Z_CAR === 1, // read from the DTM's lines (dmvs.js fromLines), its kind a guess
      passport: f.attributes.PASPORT === 1, // a town's passport (gis.js asPassport)
      ...(f.attributes.ORIENT && { orient: f.attributes.ORIENT }), // a planimetric map's parking with its orientation (towns/sanfrancisco.js)
      outerGap: f.attributes.OUTER_GAP === 1, // a gap of a planimetric map beyond the outer sidewalk (towns/planimetrics.js outerGaps)
      medianGap: f.attributes.MEDIAN_GAP === 1, // a planimetric map's gap between two roadways taken as the median (towns/planimetrics.js gapsBetweenRoads)
      carvedTrack: f.attributes.CARVED_TRACK === 1, // a cycle track cut out of a planimetric map's roadway (towns/planimetrics.js osmTracks)
      rings,
      bbox: bboxOf(rings.flat()),
      lonlat: f.geometry.rings.map((r) => r.map(([lon, lat]) => [lat, lon])),
    };
  });
}

// A building of OSM where the surface map has none (Bára 27. 11. 2026: Moravská in Česká Třebová, a house RÚIAN does not
// know stood in a yard the technical map draws as paving, and the profile went on across it): the OSM buildings the cut
// crosses and no building of the map covers join the map's polygons as weak buildings (osmBuilding: they take the
// place of what is open, not of a road or a sidewalk, classify). Only where the map draws buildings at all (a source
// without a building layer would turn into OSM's), the map's own buildings keep their place. ?off=osmdomy: as before.
const OSM_BUILDING_MIN = 12; // m²
const OSM_NO_BUILDING = new Set(["roof", "no", "ruins", "collapsed", "proposed", "construction", "carport", "canopy"]);
export function withOsmBuildings(polys, osm, frame, center, normal, half) {
  if (ORTHO_P.off?.has("osmdomy") || !polys.some((p) => isBuilding(p.code))) return polys;
  const mapBuildings = polys.filter((p) => isBuilding(p.code));
  const onCut = [];
  for (let t = -half; t <= half; t += 0.5) onCut.push([center[0] + normal[0] * t, center[1] + normal[1] * t]);
  const added = [];
  for (const el of osm?.elements || []) {
    if (el.type !== "area" || !el.tags?.building || OSM_NO_BUILDING.has(el.tags.building) || el.tags["building:part"] || !el.geometry?.length) continue;
    const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
    const rings = [ring, ...(el.holes || []).map((h) => h.map((g) => frame.toXY(g.lon, g.lat)))];
    // A stub of a few square metres (a kiosk, a mapped shed under a tree) is no house to end a profile at.
    if (Math.abs(ring.reduce((a, q, i) => a + (ring[i - 1 < 0 ? ring.length - 1 : i - 1][0] * q[1] - q[0] * ring[i - 1 < 0 ? ring.length - 1 : i - 1][1]), 0)) / 2 < OSM_BUILDING_MIN) continue;
    const bbox = bboxOf(ring);
    if (!onCut.some(([x, y]) => x >= bbox[0] && x <= bbox[2] && y >= bbox[1] && y <= bbox[3] && inside(rings, x, y))) continue;
    // Covered by a building of the map: a quarter of its area (grid points inside it) lies in the map's buildings (two
    // buildings wall to wall share a corner, a shifted one still overlaps).
    const near = mapBuildings.filter((b) => bbox[0] <= b.bbox[2] && bbox[2] >= b.bbox[0] && bbox[1] <= b.bbox[3] && bbox[3] >= b.bbox[1]);
    let inOwn = 0, inMap = 0;
    const gs = Math.max(0.5, Math.min(1.5, Math.sqrt(((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) / 40)));
    for (let x = bbox[0] + gs / 2; x < bbox[2]; x += gs) {
      for (let y = bbox[1] + gs / 2; y < bbox[3]; y += gs) {
        if (!inside(rings, x, y)) continue;
        inOwn++;
        if (near.some((b) => inside(b.rings, x, y))) inMap++;
      }
    }
    const covered = inOwn > 0 && inMap / inOwn >= 0.25;
    if (covered) continue;
    added.push({ code: 601, label: "", guess: false, level: 0, osmBuilding: true, rings, bbox, lonlat: rings.map((r) => r.map((q) => { const [lon, lat] = frame.toLonLat(q[0], q[1]); return [lat, lon]; })) });
  }
  return added.length ? [...added, ...polys] : polys;
}

// Classify the cut: list of runs {code, s, e} with s < e in metres along the normal (+ = left of way).
function classify(center, normal, half, polys) {
  const runs = [];
  for (let t = -half; t <= half + 1e-9; t += STEP) {
    const x = center[0] + normal[0] * t, y = center[1] + normal[1] * t;
    let code = null, orient, use, guess, carved, free = false, weak = null;
    for (const p of polys) {
      const [x0, y0, x1, y1] = p.bbox;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      // An OSM building the map lacks: it takes the place of what is open (paving, yard, green), not of a road, a
      // sidewalk, a tram bed or a stall (withOsmBuildings).
      if (p.osmBuilding) { if (!weak && inside(p.rings, x, y)) weak = p; continue; }
      // A no-parking part of a TSK section (a driveway, a crossing): the section has no stall there.
      if (p.code === NO_PARKING) { if (!free && inside(p.rings, x, y)) free = true; continue; }
      if (free && (isTskParking(p.code) || p.code === OSM_PARKING)) continue;
      if (inside(p.rings, x, y)) { code = p.code; orient = p.orient; use = p.use; guess = p.guess; carved = p.carvedTrack; break; }
    }
    if (weak && (code === null || !(code >= 700 && code <= 705) && !(code >= 9700 && code < 9800))) { code = weak.code; orient = use = guess = carved = undefined; }
    const last = runs[runs.length - 1];
    if (last && last.code === code && !!last.guess === !!guess) last.e = t + STEP / 2;
    else runs.push({ code, orient, use, guess, s: t - STEP / 2, e: t + STEP / 2, ...(carved && { carved: true }) });
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

// A parallel bay of OSM (parking=lane) is drawn roughly: its area may be 3.9 m deep over a lane (Klánovická) and would
// make a stall wider than a car. The bay keeps PARALLEL_BAY_MAX at its outer edge (the side away from the street's axis);
// the rest, towards the axis, goes to the roadway beside it, or is one of its own (a guess). ?off=stanisirka.
const PARALLEL_BAY_MAX = 2.5; // m (a car 1.8 m with room for doors: 2.0 to 2.5)
function capParallelBay(runs, axisT) {
  if (ORTHO_P.off?.has("stanisirka")) return runs;
  const out = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r.code !== OSM_PARKING || r.orient !== "podelne" || r.e - r.s <= PARALLEL_BAY_MAX + 0.3) { out.push(r); continue; }
    const inner = axisT < r.s ? "s" : axisT > r.e ? "e" : null;
    if (!inner) { out.push(r); continue; }
    const cut = inner === "s" ? r.e - PARALLEL_BAY_MAX : r.s + PARALLEL_BAY_MAX;
    const rest = inner === "s" ? { code: 701, guess: true, s: r.s, e: cut } : { code: 701, guess: true, s: cut, e: r.e };
    const bay = { ...r, ...(inner === "s" ? { s: cut } : { e: cut }) };
    const near = inner === "s" ? out[out.length - 1] : runs[i + 1];
    const road = (x) => x && (x.code === 700 || x.code === 701);
    if (road(near)) { if (inner === "s") near.e = cut; else near.s = cut; out.push(bay); }
    else if (inner === "s") out.push(rest, bay); else out.push(bay, rest);
  }
  // (a roadway run of the next iteration was widened in place: its own turn comes later with its new start)
  return out;
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

// Tracks in a tunnel are under a street that is not (Toronto's streetcar north of Spadina and Sussex, Line 5 under Eglinton:
// the review of 25. 11. 2026); a passage through a building is on the ground. ?off=tunneltracks: as before.
const inTunnel = (t) => !!t?.tunnel && t.tunnel !== "no" && t.tunnel !== "building_passage";
const tunnelTrack = (t, way) => !!t?.railway && !t.highway && inTunnel(t) && !inTunnel(way?.tags) && !ORTHO_P.off?.has("tunneltracks");
// Where OSM ways cross the cut, as offsets along the normal. way: the cut's street.
function crossings(osm, frame, center, normal, half, way = null) {
  const a = [center[0] - normal[0] * half, center[1] - normal[1] * half];
  const b = [center[0] + normal[0] * half, center[1] + normal[1] * half];
  const out = [];
  for (const el of osm.elements || []) {
    if (el.type !== "way" || !el.geometry || tunnelTrack(el.tags, way)) continue;
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
// The OSM class of a road as one of classGroup's words (Austria): motorways, main roads, collectors, local streets.
export function osmGroup(hw = "") {
  const h = String(hw).replace(/_link$/, "");
  return h === "motorway" || h === "trunk" ? "dalnice" : h === "primary" || h === "secondary" ? "mk2" : h === "tertiary" ? "mk3" : h ? "mk4" : null;
}
const TM_TREE = 83130; // technical map: strom mimo park
// Points of the technical map that are drawn as street furniture (TM_TREE is a tree).
export const POINT_ITEM = { 26015: "sloup_trakce", 75240: "oznacnik", 75241: "oznacnik", 74110: "sloupek", 76010: "lampa" };
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
export const isOnewayTags = (t) => ["yes", "1", "true", "-1"].includes(t?.oneway);
// The way side on the drivers' left: the way's left, or its right on oneway=-1 (traffic against the geometry).
// The side of a one-way way the contraflow keeps to (the way's left where traffic keeps right; its right where it keeps
// left, countries/<ISO>.js leftHand: Cyprus).
const drivingLeft = (t) => ((t?.oneway === "-1") !== !!country.leftHand ? "right" : "left");

function sideTags(tags, side) {
  // New scheme: parking:<side>=lane|street_side|yes + parking:<side>:orientation; old: parking:lane:<side>=parallel…
  const parking = tag(tags, `parking:${side}`, "parking:both", `parking:lane:${side}`, "parking:lane:both");
  const orientation = tag(tags, `parking:${side}:orientation`, "parking:both:orientation") || parking;
  // Cars up on the sidewalk: parking:<side>=on_kerb|half_on_kerb (new scheme), or the old
  // parking:lane:<side>=parallel|diagonal|perpendicular with parking:lane:<side>:<orientation>=on_kerb|half_on_kerb.
  const oldPos = ORIENT[parking] ? tag(tags, `parking:lane:${side}:${parking}`, `parking:lane:both:${parking}`) : undefined;
  const kerbPos = KERB_POSITIONS.has(parking) ? parking : KERB_POSITIONS.has(oldPos) ? oldPos : null;
  const depth = orientation === "perpendicular" ? 5 : orientation === "diagonal" ? 4.5 : 2;
  // On a one-way street the side-less tags (cycleway=*, busway=*) describe its right side.
  const generic = !(isOnewayTags(tags) && side === drivingLeft(tags));
  // …except opposite_* values, which describe the contraflow on its left.
  const opposite = String(tags.cycleway || "").startsWith("opposite");
  const cycle = tag(tags, `cycleway:${side}`, "cycleway:both") ??
    (generic ? (opposite ? undefined : tags.cycleway) : opposite ? tags.cycleway : undefined);
  return {
    parking: !kerbPos && ["lane", "street_side", "yes", "parallel", "diagonal", "perpendicular"].includes(parking),
    // Tagged as no parking here, or mapped as separate areas (which then would have crossed the cut); cars on
    // the sidewalk are no parking in the roadway either (no estimate there).
    parkingNo: !!kerbPos || ["no", "none", "separate"].includes(parking),
    parkingWidth: depth,
    parkingOrient: ORIENT[orientation],
    // Cars parked up on the sidewalk: fully (on_kerb, the whole car on the sidewalk) or across the kerb
    // (half_on_kerb, half the car on the sidewalk, half in the roadway). kerbDepth: the car's depth.
    kerbPos,
    kerbDepth: kerbPos ? depth : 0,
    bike: ["lane", "opposite_lane"].includes(cycle) ? "cyklopruh" : cycle === "soft_lane" ? "ochranny_pruh" : null,
    // A cycle track along the road, mapped on the road itself (cycleway:<side>=track; Denmark's usual way: the review of
    // 24. 11. 2026, 24 % of Copenhagen's streets), with its width where OSM has one (trackAlongRoad).
    track: cycle === "track" || cycle === "opposite_track",
    trackWidth: parseFloat(String(tag(tags, `cycleway:${side}:width`, "cycleway:both:width", ...(generic ? ["cycleway:width"] : [])) || "").replace(",", ".")) || null,
    trackOneway: tag(tags, `cycleway:${side}:oneway`, "cycleway:both:oneway", ...(generic ? ["cycleway:oneway"] : [])),
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

const BIKE_WIDTH = { cyklopruh: 1.5, ochranny_pruh: 1.5 }; // basic widths (Bára: the protective lane too 1.5 m)
// A bike lane next to parking includes the door-opening clearance (TP 179 tab. 2, IPR Manuál
// C.2): 1.75 m beside parallel parking, 2.0 m beside perpendicular or angled parking.
const bikeWidth = (type, parkOrient) =>
  !parkOrient ? BIKE_WIDTH[type] : parkOrient === "podelne" ? 1.75 : 2;
const ISLAND_MAX = 6; // widest paved strip between carriageways still taken as an island (m)
const MIN_LANE = 2.5; // narrowest driving lane kept when curb strips are carved out (m)
const OSM_LANE_GIVE = 0.3; // what each lane of an estimated roadway may give up for parking tagged in OSM (m)
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
const BUS_FROM_SHOULDER = 2.75; // a shoulder taken for a bus lane OSM tags at that kerb (m)
// Streets where cars commonly park at the curb even where neither TSK nor OSM says so.
// Not on main streets (secondary, tertiary and up): there the curb is mostly kept free (Bára).
// Not in a residential zone (living_street, Bára): § 39 of act 361/2000 Sb. allows parking there only in marked
// places, so only parking from OSM or the city's data is drawn.
const PARK_GUESS = new Set(["residential", "unclassified"]);
const GUESS_PARK_W = 2; // estimated parallel parking strip (m)
const KERB_PARK_TOL = 1; // a register's parking point: slack across the kerb (m)
// …and along the street: a gap of a driveway or a gate between two stretches is no kerb without parking (Paris, Rue
// Jacob: the cut 4 m past the end of a delivery bay).
const KERB_PARK_ALONG = 5;
// § 25 of act 361/2000 Sb. (silniční provoz): a parked car leaves a lane at least LAW_LANE wide free for each
// direction (odst. 3) and keeps LAW_RAIL from the nearest tram rail (odst. 2, from 5 to 19 h).
const LAW_RAIL = 3.5;
// The free lane by the law of the state (countries/<ISO>.js freeLane): Czechia and Slovakia 3 m per direction, Austria
// about 2.6 m (StVO § 24).
const lawLane = () => country.freeLane;
// The width the law leaves beside parked cars: the free lane per direction, or the state's own rule
// (countries/<ISO>.js lawNeed; Germany: 3.05 m to pass, the lanes kept at MIN_LANE each).
export const lawNeedFor = (oneway, lanesTotal) => (country.lawNeed ? country.lawNeed(oneway, lanesTotal, MIN_LANE) : lawLane() * Math.max(oneway ? 1 : 2, lanesTotal));
// Outside the built-up area a kerb without a sidewalk gets no estimate (Bára): no building of OSM or of the
// city's surfaces within BUILT_ALONG along the street and BUILT_OUT out from the kerb on that side. A sidewalk
// is a footway surface beyond the kerb, past a green strip up to WALK_GREEN, or OSM's sidewalk tags or a
// footway along the street within WALK_OSM of the kerb.
const BUILT_ALONG = 40, BUILT_OUT = 40, WALK_GREEN = 10, WALK_OSM = 12;
const RAIL_HALF = 0.7175; // half the track gauge of 1435 mm: rail from the track axis (m)
// A slight turn is drawn as the turn itself (Bára: "slight_right" with the arrow to the right).
const SLIGHT = { slight_right: "right", slight_left: "left" };
const turnList = (v) => (v ? v.split("|").map((x) => [...new Set((x || "none").split(";").map((y) => SLIGHT[y] || y))].join(";")) : null);

// Split one roadway run [s,e] into parking, bike and driving/tram lanes using OSM tags.
// ctx.dirAt(t): driving direction ("forward"/"backward" relative to the cut's street) at offset t,
// from the nearest OSM road axis, so both carriageways of a dual carriageway are right.
// ctx.along: the run's own OSM way points the same way as the cut's street (its left = our left).
// ctx.parked: sides ("L"/"R") already having a parking bay next to this run.
// The tracks lie between the two one-way carriageways of a dual road (OSM axes on both sides of them, neither with
// rails in it): { R, L } lanes of the carriageway below and above them, else null (splitRoadway).
function dualBed(axes, trams) {
  if (!axes?.length || axes.some((a) => a.tags?.embedded_rails)) return null;
  const lo = Math.min(...trams), hi = Math.max(...trams), byId = (xs) => [...new Map(xs.map((a) => [a.id, a])).values()];
  const below = byId(axes.filter((a) => a.t < lo)), above = byId(axes.filter((a) => a.t > hi));
  if (!below.length || !above.length || ![...below, ...above].every((a) => a.oneway)) return null;
  return { R: below.reduce((n, a) => n + a.lanes, 0), L: above.reduce((n, a) => n + a.lanes, 0) };
}

function splitRoadway(run, ctx) {
  const { tags, trams, dirAt, along, single, parked, sides } = ctx;
  let s = run.s, e = run.e;
  const width = e - s;
  // OSM left/right follow the way; L/R here follow the cut's street (L = larger t).
  const sideL = sides?.L ?? sideTags(tags, along ? "left" : "right");
  const sideR = sides?.R ?? sideTags(tags, along ? "right" : "left");
  // With tracks in the roadway a strip at the curb must also stay clear of the tram's swept space
  // (axis ± TRAM_HALF): parking or a bike lane tagged in OSM where the track runs close to the
  // curb is not there (e.g. Seifertova), the tram shares the lane with the cars up to the curb.
  const clear = trams.length
    ? { R: Math.min(...trams) - TRAM_HALF - s, L: e - Math.max(...trams) - TRAM_HALF }
    : { R: Infinity, L: Infinity };
  const edge = [];
  // Cars across the kerb (half_on_kerb, Bára 10. 11. 2026): the roadway half of the car at the curb, the other
  // half is taken from the sidewalk later (carveKerbParking). The data say the cars stand there, so they come
  // first, while one lane of MIN_LANE stays; the lanes then share what is left, as many as fit.
  let room = width - MIN_LANE;
  for (const [side, st] of [["R", sideR], ["L", sideL]]) {
    if (st.kerbPos !== "half_on_kerb" || parked.includes(side) || !(ctx.kerbOpen ?? ["L", "R"]).includes(side)) continue;
    const w = st.kerbDepth / 2;
    if (room < w - 1e-6 || clear[side] < w - 0.1) continue;
    edge.push({ side, type: "parkovani", w, orient: st.parkingOrient, source: "osm", position: "half_on_kerb" });
    room -= w; clear[side] -= w;
  }
  const inner = width - edge.reduce((a, x) => a + x.w, 0);
  // A roadway too narrow for the tagged (or default) lanes holds as many as fit, at least one.
  const lanesTotal = Math.max(1, Math.min(ctx.lanesTotal, Math.floor(inner / MIN_LANE + 1e-9)));
  // Curb strips are added while the driving lanes keep at least MIN_LANE each.
  let left = inner - lanesTotal * MIN_LANE;
  const fits = (side, w) => left >= w - 1e-9 && clear[side] >= w - 0.1;
  const take = (side, w) => { left -= w; clear[side] -= w; };
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.bike) continue;
    const w = bikeWidth(st.bike, st.parking || parked.includes(side) ? st.parkingOrient || "podelne" : null);
    if (fits(side, w)) { edge.push({ side, type: st.bike, w }); take(side, w); }
  }
  // Parking the data put there (OSM) stays when a little room is missing in an estimated roadway (the universal
  // judging, 17. 11. 2026: an estimated roadway of 4.4 m dropped the tagged parallel parking of Großer Brockhaus for
  // 0.1 m): the stall keeps its width and the lanes give up to OSM_LANE_GIVE each (the review of the port: a narrowed
  // stall was red in Návrh at once). A measured roadway (MTVU, a technical map, a town's surface map) gives as much
  // too, unless ?off=mapfill (ctx.osmParkGive, app.js mapFill; Bára 24. 11. 2026, Apollonkatu in Helsinki: YLRE's roadway
  // of 6.9 m dropped the tagged parallel parking for 0.1 m, the cars stand there; Czechia too, evaluation/mapfill-cz).
  for (const [side, st] of [["L", sideL], ["R", sideR]]) {
    if (!st.parking || parked.includes(side)) continue;
    const w = st.parkingWidth;
    if (fits(side, w) || ((run.guess || ctx.osmParkGive) && left + OSM_LANE_GIVE * lanesTotal >= w - 1e-6 && clear[side] >= w - 0.1)) {
      edge.push({ side, type: "parkovani", w, orient: st.parkingOrient });
      take(side, w);
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
    const need = lawNeedFor(oneway, lanesTotal);
    // A state whose law keeps cars off some roadways altogether (countries/<ISO>.js parkOnRoadway; Slovenia: none on a
    // two-way street without a centre line, none on a one-way carriageway of two lanes).
    const lawful = country.parkOnRoadway ? country.parkOnRoadway(tags, oneway, lanesTotal) : true;
    const lo = trams.length ? Math.min(...trams) - RAIL_HALF : Infinity, hi = trams.length ? Math.max(...trams) + RAIL_HALF : -Infinity;
    // Keeping left (Cyprus, Malta) cars stand along the kerb on the driver's left: on a one-way street that kerb is tried
    // first (the estimate is no part of the data, so it may sit there; review of 23. 11. 2026).
    const leftKerb = country.leftHand && oneway && dirAt((s + e) / 2) === "backward";
    const order = country.leftHand && !leftKerb ? [["L", sideL], ["R", sideR]] : [["R", sideR], ["L", sideL]];
    for (const [side, st] of order) {
      if (!lawful) break;
      if (!(ctx.kerbOpen ?? ["L", "R"]).includes(side) || ctx.kerbBare?.includes(side) || parked.includes(side) || st.parkingNo || edge.some((x) => x.side === side && x.type === "parkovani")) continue;
      // Switzerland (countries/CH.js parkByCycleLane: VRV Art. 19 Abs. 2): no parking on the roadway beside a cycle lane.
      if (!country.parkByCycleLane && edge.some((x) => x.side === side && (x.type === "cyklopruh" || x.type === "ochranny_pruh"))) continue;
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
  // § 25(3) holds for cars across the kerb too: the free width left beside them (lawFree), for the notice.
  const oneway = isOnewayTags(tags) || tags.junction === "roundabout";
  const lawFree = edge.some((x) => x.position) ? width - edge.reduce((a, x) => a + x.w, 0) : null;
  const lawNeed = lawNeedFor(oneway, lanesTotal);
  for (const x of edge) {
    const extra = x.position ? { position: x.position, ...(lawFree < lawNeed - 1e-6 ? { lawFree, lawNeed } : {}) } : {};
    if (x.side === "L") { leftEdge.push({ type: x.type, s: e - x.w, e, orient: x.orient, source: x.source, ...extra }); e -= x.w; }
    else { rightEdge.push({ type: x.type, s, e: s + x.w, orient: x.orient, source: x.source, ...extra }); s += x.w; }
  }
  let mid = trams.length ? tramLanes(s, e, trams, dirAt) : [];
  // All the street's lanes fit beside the tracks (Národní: lanes=2, one on each side; Spálená: lanes:forward=1
  // and lanes:backward=1): cars do not drive on the tracks, so they are a reserved tram lane in the roadway,
  // level with it (Bára; the tram in a lane with cars is OSM's embedded_rails where the lanes do not fit). Only where OSM counts the lanes, so an unmapped parking lane is not taken for one.
  // Where the lanes fit only with the tram kept to a 3.0 m lane (axis ± TRAM_LANE_HALF; Spálená: 2.4 m beside
  // the usual envelope, 2.7 m beside this one), the narrower one is taken.
  if (trams.length && (tags.lanes || tags["lanes:forward"] || tags["lanes:backward"])) {
    const lo = Math.min(...trams), hi = Math.max(...trams);
    // The lanes OSM counts include those with the rails (railway:lanes…=tram|no: Hybešova, Dukelská in Brno, lanes=4 of
    // which two are the tram's; Bára 18. 11. 2026): the cars need the rest (?off=raillanes: all of them).
    const railLanes = ORTHO_P.off?.has("raillanes") ? 0 : ["railway:lanes", "railway:lanes:forward", "railway:lanes:backward"].reduce((a, k) => a + String(tags[k] || "").split("|").filter((v) => v === "tram").length, 0);
    const fitsBeside = (m) => {
      const cars = m.filter((x) => x.type === "pruh");
      const bothSides = cars.some((x) => x.e <= lo) && cars.some((x) => x.s >= hi);
      return cars.length >= Math.max(1, ctx.lanesTotal - railLanes) && (bothSides || isOnewayTags(tags));
    };
    const narrow = !fitsBeside(mid) && tramLanes(s, e, trams, dirAt, TRAM_LANE_HALF);
    if (narrow && fitsBeside(narrow)) mid = narrow;
    if (fitsBeside(mid)) for (const x of mid) if (x.type === "tramvaj_v_pruhu") x.type = "tramvaj_pruh";
  }
  // Tracks between the two carriageways of a dual road, which OSM maps as two one-way ways with the rails apart
  // (no embedded_rails), lie on a separate bed even where the map draws one roadway over all of it (Střelničná:
  // MTVU's 24 m roadway, the photo shows two lanes each way and a ballast bed between; Bára 23. 11. 2026,
  // ?off=dualbed). Each carriageway takes its OSM lanes (up to the lane cap), the rest between is the bed.
  const sep = trams.length && !ORTHO_P.off?.has("dualbed") && dualBed(ctx.axes, trams);
  if (sep) {
    const cap = LANE_CAP_CLASS[ctx.roadClass] ?? LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const lo = Math.min(...trams) - TRAM_HALF, hi = Math.max(...trams) + TRAM_HALF;
    const wR = Math.min(lo - s, sep.R * cap), wL = Math.min(e - hi, sep.L * cap);
    if (wR >= sep.R * CAR_MIN && wL >= sep.L * CAR_MIN) {
      const src = trams.measured ? "dtm" : "osm";
      const lanesOf = (a, b, n) => Array.from({ length: n }, (_, k) => ({ type: "pruh", s: a + (k * (b - a)) / n, e: a + ((k + 1) * (b - a)) / n, dir: dirAt(a + ((k + 0.5) * (b - a)) / n), source: src }));
      const bs = s + wR, be = e - wL, bm = (bs + be) / 2;
      mid = [...lanesOf(s, bs, sep.R),
        { type: "tramvaj", s: bs, e: bm, dir: "forward", bed: "panely", bedSource: "odhad", source: "odhad" },
        { type: "tramvaj", s: bm, e: be, dir: "backward", bed: "panely", bedSource: "odhad", source: "odhad" },
        ...lanesOf(be, e, sep.L)];
    }
  }
  if (!trams.length) {
    // One lane on a two-way street carries both directions (no arrow).
    const twoWaySingle = lanesTotal === 1 && !isOnewayTags(tags) && tags.junction !== "roundabout";
    // Lanes wider than the cap leave the rest as a shoulder / hatched area at the curbs (estimate):
    // the technical map has no lane markings, so an even split would make 5–8 m lanes.
    const cap = LANE_CAP_CLASS[ctx.roadClass] ?? LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
    const excess = (e - s) - lanesTotal * cap;
    // Strips under KRAJNICE_MIN are left in the lanes (a lane 3.7 m wide is no error).
    // A pedestrian or residential zone is one paved roadway without lanes: no shoulder is guessed in it.
    const zone = tags.highway === "pedestrian" || tags.highway === "living_street";
    if (!twoWaySingle && !zone && excess >= KRAJNICE_MIN) {
      // A carriageway of a divided road has its shoulder on the outer edge, the driver's right, not along
      // the median; other roadways, one-way town streets too, at both curbs (Bára). One-way by the OSM
      // axis in this roadway, not the clicked street (a divided road's other half).
      const oneway = single && ctx.axesOneway && ctx.divided;
      const both = !oneway && excess >= 2 * KRAJNICE_MIN;
      const outerL = oneway && dirAt((s + e) / 2) === (country.leftHand ? "forward" : "backward");
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
      const half = 2 * i + 1 === lanesTotal ? null : (2 * i + 1 < lanesTotal) !== !!country.leftHand ? "forward" : "backward";
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
  // A bus lane OSM tags along a kerb where all the lanes it counts are the cars' (lanes=1, oneway=yes, busway:left=lane
  // with oneway:psv=no: the contraflow bus lane of Rue La Fayette in Paris): the shoulder the cap left at that kerb, wide
  // enough for a bus, is the bus lane; contraflow on a one-way street's left (busway:<side>:oneway=-1). ?off=buskrajnice.
  if (!ORTHO_P.off?.has("buskrajnice")) {
    for (const [side, st, list] of [["R", sideR, rightEdge], ["L", sideL, leftEdge]]) {
      const lane = curbLane[side], k = side === "R" ? list.at(-1) : list[0];
      if (!st.bus || lane?.type === "bus" || lane?.type === "bus_cyklo" || k?.type !== "krajnice" || k.e - k.s < BUS_FROM_SHOULDER) continue;
      const against = tags[`busway:${st.osmSide}:oneway`] === "-1" || (isOnewayTags(tags) && st.osmSide === drivingLeft(tags) && tags["oneway:psv"] === "no");
      k.type = st.shareBus ? "bus_cyklo" : "bus"; k.dir = against ? flip(lane?.dir || "forward") : lane?.dir || "forward"; k.source = "osm";
    }
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
      ...(TRAM_KINDS.has(x.type) && tags.embedded_rails === "tram" ? { embedded: true } : {}),
      ...(x.position ? { position: x.position, lawFree: x.lawFree, lawNeed: x.lawNeed } : {}) }))
    .sort((a, b) => a.s - b.s);
}

// lanes:forward / lanes:backward and turn:lanes(:forward|:backward) for a single carriageway.
// Lanes come in t order (right side of the cut's street first).
function applyLaneTags(lanes, tags, along) {
  const oneway = isOnewayTags(tags);
  const wayFwd = parseInt(tags["lanes:forward"], 10), wayBwd = parseInt(tags["lanes:backward"], 10);
  // Lanes travelling with the cut's street sit on its right (low t); keeping left on its left (high t).
  if (!oneway && wayFwd >= 0 && wayBwd >= 0 && wayFwd + wayBwd === lanes.length) {
    const ours = along ? wayFwd : wayBwd;
    lanes.forEach((l, i) => (l.dir = (country.leftHand ? i >= lanes.length - ours : i < ours) ? "forward" : "backward"));
  }
  const wayFwdTurns = turnList(tags["turn:lanes:forward"] || (oneway ? tags["turn:lanes"] : undefined));
  const wayBwdTurns = turnList(tags["turn:lanes:backward"]);
  const sameAsWay = along !== (tags.oneway === "-1");
  const fwdTurns = sameAsWay ? wayFwdTurns : wayBwdTurns;
  const bwdTurns = sameAsWay ? wayBwdTurns : wayFwdTurns;
  // turn:lanes are listed from the driver's left: for our forward lanes that is high t first,
  // for backward lanes low t first (keeping left too: there the driver's left is the kerb, high t for forward lanes).
  const fwd = lanes.filter((l) => l.dir === "forward").reverse();
  const bwd = lanes.filter((l) => l.dir === "backward");
  if (fwdTurns?.length === fwd.length) fwd.forEach((l, i) => (l.turn = fwdTurns[i]));
  if (bwdTurns?.length === bwd.length) bwd.forEach((l, i) => (l.turn = bwdTurns[i]));
  // bus:lanes / psv:lanes list lanes like turn:lanes; "designated" marks a bus lane.
  const busList = (suffix) => turnList(tags[`bus:lanes${suffix}`] || tags[`psv:lanes${suffix}`]);
  // "designated" is a bus lane; "yes" / "permissive" just let buses use an ordinary lane, unless the lane is
  // closed to other traffic (access:lanes / motor_vehicle:lanes = no, e.g. Českobrodská: bus:lanes:forward=|yes
  // with access:lanes:forward=|no).
  const closedList = (suffix) => turnList(tags[`access:lanes${suffix}`] || tags[`motor_vehicle:lanes${suffix}`] || tags[`vehicle:lanes${suffix}`]);
  const isBus = (v, closed) => v === "designated" || (["yes", "permissive"].includes(v) && closed === "no");
  const wayFwdBus = busList(":forward") || (oneway ? busList("") : null);
  const wayBwdBus = busList(":backward");
  const wayFwdClosed = closedList(":forward") || (oneway ? closedList("") : null), wayBwdClosed = closedList(":backward");
  const fwdBus = sameAsWay ? wayFwdBus : wayBwdBus, bwdBus = sameAsWay ? wayBwdBus : wayFwdBus;
  const fwdClosed = sameAsWay ? wayFwdClosed : wayBwdClosed, bwdClosed = sameAsWay ? wayBwdClosed : wayFwdClosed;
  if (fwdBus?.length === fwd.length) fwd.forEach((l, i) => { if (isBus(fwdBus[i], fwdClosed?.[i])) l.type = "bus"; });
  if (bwdBus?.length === bwd.length) bwd.forEach((l, i) => { if (isBus(bwdBus[i], bwdClosed?.[i])) l.type = "bus"; });
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
// Track axes the cut crosses closer together than two parallel tracks can lie (the least axis spacing is about
// 2.8 m, the Manuál's double track 3.0 m) are one track seen at an angle: the branches of a turnout or a crossing in
// a junction (Smetanovo nábřeží at Národní, four axes 1.6, 1.6 and 3.1 m apart drew three trams side by side: report
// of 16. 11. 2026). Such a group is one track at the mean of its axes.
const TRACK_SPACING_MIN = 2.5;
function mergeTrackAxes(ts) {
  const sorted = [...ts].sort((a, b) => a - b), groups = [];
  for (const t of sorted) {
    const g = groups[groups.length - 1];
    if (g && t - g[g.length - 1] < TRACK_SPACING_MIN) g.push(t); else groups.push([t]);
  }
  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

// A town's map that draws the tram bed (MTVU 705: Berlin's Gleiskörper, Vienna's FMZK, a passport) puts the tracks
// where they are; OSM's may lie a metre beside it (Neue Schönhauser Straße in Berlin: Bára 18. 11. 2026, the OSM tracks
// 1 m south of the bed left 0.8 m for the parking OSM tags on that side). The OSM tracks of a bed the cut crosses are
// moved into it when a rail lies more than BED_SLACK outside: the group centred in the bed, keeping its spacing. Where
// the bed is part of the roadway (Berlin's Gleiskörper with the rails in the asphalt) and the spacing does not fit, a
// double track lies 1.5 m each side of the bed's centre (Manuál C.2: 3 m). A separate bed narrower than the pair keeps
// OSM's tracks: it draws its own trams by its width, and a track taken out of the roadway beside it would be lost
// (Oranienburger Straße at Oranienburger Tor: a bed of 4.6 m, tracks 3.5 m apart). Measured axes (Prague's DTM, code
// 55010) and beds drawn from OSM itself (ortho-osm.js) are left alone. ?off=tramsnap: the A/B.
const BED_NEAR = 2.5; // OSM tracks this far beyond a bed's edge belong to it (m)
const BED_SLACK = 0.25; // a rail this far beyond the bed's edge is within the data's accuracy (m)
// A strip of bed narrower than a tram (Vienna's FMZK at Rotundenbrücke: 1.6 m beside the track) holds no track, and a
// track further off than BED_SHIFT_MAX is not this bed's (the four Berlin cuts moved 0.4–1.1 m).
const BED_MIN = 2.5, BED_SHIFT_MAX = 1.25;
function mapTramBeds(polys, center, normal, half, isRoad) {
  const spans = [];
  for (const p of polys) {
    if (p.code !== 705 || p.level || /\(OSM\)/.test(p.label || "")) continue;
    const [x0, y0, x1, y1] = p.bbox || [-Infinity, -Infinity, Infinity, Infinity];
    let lo = null;
    for (let t = -half; t <= half + 1e-9; t += 0.1) {
      const [x, y] = [center[0] + normal[0] * t, center[1] + normal[1] * t];
      const inP = x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(p.rings, x, y);
      if (inP && lo === null) lo = t;
      if (!inP && lo !== null) { spans.push([lo, t - 0.1, isRoad(p)]); lo = null; }
    }
    if (lo !== null) spans.push([lo, half, isRoad(p)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const sp of spans) {
    const m = merged[merged.length - 1];
    if (m && sp[0] <= m[1] + 0.15) { m[1] = Math.max(m[1], sp[1]); m[2] ||= sp[2]; } else merged.push([...sp]);
  }
  return merged.filter(([a, b]) => b - a >= BED_MIN);
}
export function snapTracksToBeds(ts, beds) {
  const used = new Set();
  for (const [lo, hi, road] of beds) {
    const idx = ts.map((t, i) => i).filter((i) => !used.has(i) && ts[i] >= lo - BED_NEAR && ts[i] <= hi + BED_NEAR);
    if (!idx.length) continue;
    idx.forEach((i) => used.add(i));
    const mine = idx.map((i) => ts[i]), a = Math.min(...mine), b = Math.max(...mine);
    if (a - RAIL_HALF >= lo - BED_SLACK && b + RAIL_HALF <= hi + BED_SLACK) continue;
    const c = (lo + hi) / 2, to = new Map();
    if (b - a + 2 * RAIL_HALF <= hi - lo) idx.forEach((i) => to.set(i, ts[i] + c - (a + b) / 2));
    else if (road && idx.length === 2) { const [i, j] = ts[idx[0]] <= ts[idx[1]] ? idx : [idx[1], idx[0]]; to.set(i, c - 1.5).set(j, c + 1.5); }
    if (to.size && [...to].every(([i, t]) => Math.abs(t - ts[i]) <= BED_SHIFT_MAX)) for (const [i, t] of to) ts[i] = t;
  }
  ts.sort((x, y) => x - y);
}

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
  const firstAbsorbed = env[0].s === s;
  if (e - last.e >= CAR_MIN) carGap(last.e, e); else last.e = e;
  // Two tracks filling the whole roadway (no car lane beside them): each takes half of it, split in the roadway's
  // middle. The axes of OSM and the kerbs read on the photo seldom agree to the metre, and the rest of the roadway
  // went to one track (Josefstädter Straße: trams of 5.4 and 2.3 m; ?off=tramhalf).
  if (env.length === 2 && firstAbsorbed && last.e === e && !ORTHO_P.off?.has("tramhalf") && Math.abs((ts[0] + ts[1]) / 2 - (s + e) / 2) < 2) env[0].e = env[1].s = (s + e) / 2;
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
// out of the paved segment holding them. A tree standing in the parking strip (trees between the stalls,
// Bára) is an item of the parking (parked: given to attachItems).
const TREE_ROW_MAX = 3; // m (Bára 17. 11. 2026)
function insertTrees(segs, trees, parked = [], unknownWalk = false) {
  let out = segs;
  for (const { t, src } of trees) {
    const i = out.findIndex((x) => x.s <= t && x.e >= t);
    const host = out[i];
    // A green strip turns into a tree row, at most TREE_ROW_MAX wide round the tree; a wider green area keeps the
    // rest (Bára 17. 11. 2026: Václavské náměstí drew a tree row of 8.75 m with one tree; ?off=stromy3).
    if (host?.type === "zelen" && (host.e - host.s <= TREE_ROW_MAX || ORTHO_P.off?.has("stromy3"))) { host.type = "stromorad"; continue; }
    if (host?.type === "zelen") {
      let a = Math.max(host.s, t - TREE_ROW_MAX / 2), b = Math.min(host.e, t + TREE_ROW_MAX / 2);
      if (a === host.s) b = Math.min(host.e, host.s + TREE_ROW_MAX); else if (b === host.e) a = Math.max(host.s, host.e - TREE_ROW_MAX);
      if (a - host.s < 0.5) a = host.s;
      if (host.e - b < 0.5) b = host.e;
      const parts = [];
      if (a > host.s) parts.push({ ...host, e: a });
      parts.push({ ...host, type: "stromorad", s: a, e: b });
      if (b < host.e) parts.push({ ...host, s: b });
      out = [...out.slice(0, i), ...parts, ...out.slice(i + 1)];
      continue;
    }
    if (host?.type === "parkovani") { parked.push({ kind: "strom", t, along: 0, parked: true }); continue; }
    if (!host || !(WALK.has(host.type) || (unknownWalk && host.type === "nezname" && host.source !== "user"))) continue;
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

// The direction cyclists ride a path one way only: oneway:bicycle, else oneway (-1 against the way); null for both ways.
// d: the way's direction at the cut, dir: the profile's (as cycleTrack).
function bikeDir(t, d, dir) {
  const o = t["oneway:bicycle"] ?? t.oneway;
  if (!["yes", "1", "true", "-1"].includes(o)) return null;
  const along = d[0] * dir[0] + d[1] * dir[1] >= 0;
  return along !== (o === "-1") ? "forward" : "backward";
}

// What cyclists may do on a sidewalk (MTVU 702), from the OSM way running along it:
// segregated=yes → foot and cycle path side by side (C10: sidewalk + cycle track, split in half),
// bicycle=designated → shared foot and cycle path (C9), bicycle=yes → sidewalk open to cyclists.
// Without a way of its own, the street's sidewalk:<side>:bicycle tag tells.
const SEG_MIN = 0.9; // m: the narrowest half of a segregated path told by its width tags
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
    // The two halves, unless OSM gives the width of one of them (cycleway:width, footway:width; a combined path's own
    // width is the sum, not told apart): the cycle track as wide as it says, the sidewalk the rest, each at least
    // SEG_MIN. ?off=cyklosirka.
    const total = r.e - r.s, num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return n > 0 && n < 10 ? n : null; };
    const cw = ORTHO_P.off?.has("cyklosirka") ? null : num(t["cycleway:width"]), fw = ORTHO_P.off?.has("cyklosirka") ? null : num(t["footway:width"]);
    const told = cw !== null ? cw : fw !== null ? total - fw : null;
    const bikeW = told !== null && told >= SEG_MIN && total - told >= SEG_MIN ? told : total / 2;
    // The cycle half lies on the roadway side (the side nearer the street axis).
    const bikeLow = Math.abs(r.s - axisT) < Math.abs(r.e - axisT);
    const m = bikeLow ? r.s + bikeW : r.e - bikeW;
    const halves = [{ type: "cyklostezka", source: "osm" }, { type: "chodnik", source: "osm" }];
    if (!bikeLow) halves.reverse();
    return [{ ...halves[0], s: r.s, e: m }, { ...halves[1], s: m, e: r.e }];
  }
  // segregated=no is used only on paths shared by both, even when foot is not tagged designated.
  const shared = bikes === "designated" && (t.highway !== "cycleway" || t.foot === "designated" || t.segregated === "no");
  // Cyclists one way only (oneway:bicycle, else oneway): the part has that direction (the walkers keep both).
  const bd = shared && c ? bikeDir(t, c.d, dir) : null;
  return [{ type: shared ? "stezka_sdilena" : "chodnik_kola", s: r.s, e: r.e, ...(bd && { dir: bd }), source: "dtm" }];
}

// A cycle track (MTVU 703) takes its direction from the OSM cycleway running in it: one-way
// tracks ride with their way, two-way tracks split into two halves (keep right).
function cycleTrack(r, cross, dir) {
  const c = cross.find((x) => x.t > r.s && x.t < r.e &&
    (x.way.tags?.highway === "cycleway" || x.way.tags?.bicycle === "designated"));
  if (!c) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const t = c.way.tags;
  const bd = bikeDir(t, c.d, dir);
  if (bd) {
    return [{ type: "cyklostezka", s: r.s, e: r.e, dir: bd, source: "dtm" }];
  }
  // TP 179 kap. 4.9: a two-way cycle path is at least 2.5 m wide (one-way min. 2.0 m).
  if (r.e - r.s < 2.5) return [{ type: "cyklostezka", s: r.s, e: r.e, source: "dtm" }];
  const m = (r.s + r.e) / 2;
  return [
    { type: "cyklostezka", s: r.s, e: m, dir: country.leftHand ? "backward" : "forward", source: "dtm" },
    { type: "cyklostezka", s: m, e: r.e, dir: country.leftHand ? "forward" : "backward", source: "dtm" },
  ];
}

// A narrow raised paved strip between two carriageways is a median / traffic island.
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "cyklopruh", "ochranny_pruh", "parkovani", "krajnice"]);
// keep: the kerbs of the law's parking strips left out of this profile (deriveProfile lawAt): the sidewalk behind such a
// kerb is one as it was with the strip (Calle de Yolanda de Bar and Avenida Sáinz de Varanda in Zaragoza, 25. 11. 2026).
function markIslands(segs, keep = []) {
  segs.forEach((x, i) => {
    if (!WALK.has(x.type) || x.e - x.s > ISLAND_MAX) return;
    if (keep.some(({ t, sg }) => Math.abs((sg < 0 ? x.s : x.e) - t) < 0.3)) return;
    // Between two carriageways: a parking strip (e.g. a small car park beyond the sidewalk) does not count.
    const lane = (y) => ROADWAY.has(y?.type) && y.type !== "parkovani";
    if (lane(segs[i - 1]) && lane(segs[i + 1])) x.type = "delici";
  });
  return segs;
}

// Parking on the sidewalk (on_kerb / half_on_kerb in OSM; Bára 10. 11. 2026). The technical map draws a sidewalk
// there, as it does not know that cars stand on it, so the car's strip is taken out of the sidewalk at the kerb:
// on_kerb the whole car (2 m parallel, 4.5 m oblique, 5 m perpendicular), raised; half_on_kerb half of it, the
// other half being the roadway strip splitRoadway left at the curb; both halves make one part across the kerb.
// The sidewalk keeps KERB_REST at least: on a narrower one the car's strip is narrowed (the data say cars stand
// there), down to KERB_CAR_MIN (on_kerb) or KERB_HALF_MIN (the sidewalk half); below that nothing is carved and the
// profile's notice says so. A part beside the kerb that is no sidewalk (green, a paved area) takes the car alike.
const KERB_REST = 0.5, KERB_CAR_MIN = 1, KERB_HALF_MIN = 0.3;
const KERB_HOST = new Set([...WALK, "zelen", "nezname"]);
const fmtM = (v) => `${num(v)} m`;
function carveKerbParking(segs, reqs, notes = []) {
  let out = segs;
  const say = (text) => { if (!notes.includes(text)) notes.push(text); };
  for (const q of reqs) {
    const L = q.side === "L"; // L: the sidewalk lies at larger offsets, beyond q.at
    const gap = (x) => (L ? x.s - q.at : q.at - x.e);
    if (q.bay) {
      const bay = out.find((x) => x.type === "parkovani" && Math.abs(gap(x)) < 0.1);
      if (bay && !bay.position) bay.position = q.pos;
      continue;
    }
    const hi = out.findIndex((x) => KERB_HOST.has(x.type) && gap(x) > -0.1 && gap(x) < 0.6);
    const host = out[hi];
    const half = q.pos === "half_on_kerb";
    const pi = half ? out.findIndex((x) => x.position === "half_on_kerb" && Math.abs((L ? x.e : x.s) - q.at) < 0.1) : -1;
    const piece = out[pi];
    const avail = host ? host.e - host.s : 0;
    const want = half ? q.w / 2 : q.w;
    const take = Math.min(want, avail - KERB_REST);
    if (half && !piece) {
      if (host) say(t("Stání napůl na chodníku z OSM: vozovka nemá místo na polovinu auta, auta nejsou nakreslena."));
      continue;
    }
    if (!host || take < (half ? KERB_HALF_MIN : KERB_CAR_MIN) - 1e-9) {
      if (host || !half) say(!host ? t("Stání na chodníku z OSM: u obruby není chodník, auta nejsou nakreslena.")
        : half ? t("Stání napůl na chodníku z OSM: chodník má jen {w}, auta nejsou nakreslena.", { w: fmtM(avail) })
        : t("Stání na chodníku z OSM: chodník má jen {w}, auta nejsou nakreslena.", { w: fmtM(avail) }));
      if (piece) {
        // The roadway half goes back to the lane beside it.
        const lane = out[L ? pi - 1 : pi + 1];
        if (lane && ROADWAY.has(lane.type)) { if (L) lane.e = piece.e; else lane.s = piece.s; }
        else Object.assign(piece, { position: undefined });
        if (lane && ROADWAY.has(lane.type)) out = out.filter((_, k) => k !== pi);
      }
      continue;
    }
    if (take < want - 1e-9) {
      const v = { w: fmtM(avail), rest: fmtM(avail - take) };
      say(half ? t("Stání napůl na chodníku z OSM: chodník má jen {w}, auta jsou kreslena užší a chodníku zbývá {rest}.", v)
        : t("Stání na chodníku z OSM: chodník má jen {w}, auta jsou kreslena užší a chodníku zbývá {rest}.", v));
    }
    // From the roadway half (or the kerb) to the cut edge in the sidewalk; thin parts between go with the car.
    const from = L ? (piece ? piece.s : host.s) : host.e - take;
    const to = L ? host.s + take : (piece ? piece.e : host.e);
    const park = { type: "parkovani", s: from, e: to, source: "osm", orient: q.orient, position: q.pos };
    if (piece?.lawFree !== undefined) Object.assign(park, { lawFree: piece.lawFree, lawNeed: piece.lawNeed });
    const rest = L ? { ...host, s: park.e } : { ...host, e: park.s };
    const lo = Math.min(hi, pi < 0 ? hi : pi), up = Math.max(hi, pi < 0 ? hi : pi);
    out = [...out.slice(0, lo), ...(L ? [park, rest] : [rest, park]), ...out.slice(up + 1)];
    if (park.lawFree !== undefined) say(country.halfKerbNote(fmtM(park.lawFree), fmtM(park.lawNeed)));
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
    keep.position ??= extra.position;
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
// The OSM buildings the built-up test was tuned on: until 15. 11. 2026 the tiles held only those with floors or a height
// (tools/build_osm_tiles.mjs now keeps all). The look of a house reads every building, in every state (Bára 25. 11.
// 2026; a blind test in 13 states, evaluation/all-buildings): the kind and the block are often all OSM has.
// ?off=vsedomy: the look reads the tuned ones only.
const TUNED_BUILDING = (t) => !!t?.building && (t["building:levels"] !== undefined || t.height !== undefined || t["roof:levels"] !== undefined);
export function buildingAt(osm, frame, p) {
  const all = (osm.elements || []).filter((el) => el.type === "area" && (TUNED_BUILDING(el.tags) || (el.tags?.building && el.tags.building !== "roof" && !ORTHO_P.off?.has("vsedomy"))))
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
    // The roof's shape and the year built, where OSM has them (the look of a house abroad: profile.js buildingStyle).
    const year = parseInt(String(el.tags.start_date ?? "").slice(0, 4), 10);
    return { levels: levels ? levels + (roof || 0) : undefined, height: height || undefined, type: el.tags.building, block: blockShape(b, all), axis: mainAxis(b.ring),
      roofShape: el.tags["roof:shape"], start: year > 1000 ? year : undefined, material: el.tags["building:material"],
      // OSM says panels (building:prefabricated=yes, building:material=concrete_panel…): the panel house's own evidence.
      panel: el.tags["building:prefabricated"] === "yes" || /panel|prefab/i.test(el.tags["building:material"] || "") ? true : undefined,
      own: ownShape(b), around: aroundOf(b, all, osm.elements, frame),
      footprint: ringArea(b.ring) - (b.rings.slice(1).reduce((a, r) => a + ringArea(r), 0)) };
  }
  return null;
}
// The house's own outline: how much of its smallest rectangle it fills (a slab: close to 1) and the rectangle's sides (m).
function ownShape(b) {
  const a = mainAxis(b.ring), area = ringArea(b.ring);
  return { rect: +(area / (a.length * a.width || 1)).toFixed(2), length: +a.length.toFixed(1), width: +a.width.toFixed(1) };
}
// What lies round the house within AROUND_R m (house-looks.js panelScore): the share built over by other buildings and the
// share of green (OSM grass, wood, park, garden…), by a grid of points. An estate of slabs stands free in green, a town
// street's house between others. Only what the OSM elements loaded hold (whole tiles of about 550 × 350 m round the cut).
const AROUND_R = 80, AROUND_STEP = 10, GREEN_TAGS = (t) => /^(grass|forest|meadow|village_green|recreation_ground|orchard)$/.test(t.landuse || "")
  || /^(park|garden|pitch|playground)$/.test(t.leisure || "") || /^(wood|scrub|grassland)$/.test(t.natural || "");
function aroundOf(self, all, elements, frame) {
  const c = [self.ring.reduce((a, q) => a + q[0], 0) / self.ring.length, self.ring.reduce((a, q) => a + q[1], 0) / self.ring.length];
  const near = (r) => r.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < AROUND_R + 60);
  const others = all.filter((b) => b !== self && b.bbox[2] > c[0] - AROUND_R && b.bbox[0] < c[0] + AROUND_R && b.bbox[3] > c[1] - AROUND_R && b.bbox[1] < c[1] + AROUND_R);
  const greens = (elements || []).filter((el) => el.type === "area" && el.geometry?.length > 2 && !el.tags?.building && GREEN_TAGS(el.tags || {}))
    .map((el) => ({ rings: [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) })).filter((g) => near(g.rings[0]));
  let n = 0, built = 0, green = 0;
  for (let x = -AROUND_R; x <= AROUND_R; x += AROUND_STEP) for (let y = -AROUND_R; y <= AROUND_R; y += AROUND_STEP) {
    if (Math.hypot(x, y) > AROUND_R) continue;
    const p = [c[0] + x, c[1] + y];
    n++;
    if (others.some((b) => p[0] >= b.bbox[0] && p[0] <= b.bbox[2] && p[1] >= b.bbox[1] && p[1] <= b.bbox[3] && inside(b.rings, p[0], p[1]))) built++;
    else if (greens.some((g) => inside(g.rings, p[0], p[1]))) green++;
  }
  return { built: +(built / n).toFixed(2), green: +(green / n).toFixed(2) };
}
const ringArea = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2;

// The main axis of one footprint (principal component of its outline): its direction and the house's length and
// width along and across it (m).
function mainAxis(pts) {
  const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = Math.atan2(2 * sxy, sxx - syy) / 2, u = [Math.cos(ang), Math.sin(ang)];
  const along = pts.map(([x, y]) => (x - mx) * u[0] + (y - my) * u[1]), across = pts.map(([x, y]) => -(x - mx) * u[1] + (y - my) * u[0]);
  return { u, length: Math.max(...along) - Math.min(...along), width: Math.max(...across) - Math.min(...across) };
}
// A house standing with its gable to the street (a village house, Bára 16. 11. 2026): a narrow footprint, clearly
// longer than wide, its long side running away from the street (along the cut).
const WALK_FRONT = 6; // m: a wider paving before a house is a yard read as a sidewalk
const ARCADE_COVER = new Set(["arcade", "colonnade", "building_arcade"]);
const GABLE_MAX_W = 11, GABLE_RATIO = 1.4, GABLE_COS = 0.85;
const gableToStreet = (axis, normal) => !!axis && axis.width <= GABLE_MAX_W && axis.length >= GABLE_RATIO * axis.width
  && Math.abs(axis.u[0] * normal[0] + axis.u[1] * normal[1]) / Math.hypot(...normal) >= GABLE_COS;

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
  return { length: +l.toFixed(1), width: +w.toFixed(1), fill: +(filled / (l * w || 1)).toFixed(2), parts: group.length, area: Math.round(filled) };
}

// Street furniture, barriers and slopes found along the cut, as {kind, t}.
export const TECH_ITEM = {
  71522: "svodidlo", 71540: "svodidlo", 61530: "zabradli", 61209: "plot", 61210: "plot", 71210: "plot",
  81210: "plot", 91210: "plot", 61422: "oporna_zed", 71422: "oporna_zed", 81422: "oporna_zed", 81214: "zivy_plot",
  42105: "svah", 42107: "svah",
};
export const BARRIER_ITEM = {
  guard_rail: "svodidlo", jersey_barrier: "svodidlo", fence: "plot", wall: "plot", city_wall: "plot",
  retaining_wall: "oporna_zed", hedge: "zivy_plot", handrail: "zabradli",
};

export function nodeItem(t) {
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
    // A stop has one shelter and one post: two of them within STOP_GAP across (OSM's shelter and the stop's
    // shelter=yes, two shelters of one platform; Türkova) are one.
    const gap = STOP_GAP[it.kind] ?? (it.along ? ROW_GAP : 1);
    if (!kept.some((o) => o.kind === it.kind && Math.abs(o.t - it.t) < (o.along || it.along ? Math.max(gap, ROW_GAP) : gap))) kept.push(it);
  }
  return kept.sort((a, b) => a.t - b.t);
}

// Parts where a lamp, bench or other standing thing cannot be: vehicles drive or park there.
const TRAFFIC = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu",
  "cyklopruh", "ochranny_pruh", "parkovani", "tramvaj", "tramvaj_pruh"]);
const ITEM_SHIFT = 3; // an OSM point this far off a kerb is moved onto it (m); further it is left out
// A traction pole or a stop post in the tram bed (between the tracks, or a point a little off) stands on the
// island or platform beside it, further than ITEM_SHIFT if need be: trams pass where it was drawn (Olšanská).
const BED_SHIFT = { sloup_trakce: 4, oznacnik: 4 };
const CENTER_POLE = 1.2; // a traction pole this close to the line between two tracks stands between them (m)

// One of these in a part, the nearest to the cut along the street (Bára, náměstí Jana Palacha: three traction poles
// of the technical map along a sidewalk drawn side by side in the cut; one is enough).
const ONE_PER_PART = new Set(["sloup_trakce", "lampa"]);
function attachItems(segs, items) {
  for (const it of [...items].sort((a, b) => Math.abs(a.along ?? 0) - Math.abs(b.along ?? 0))) {
    let host = segs.find((x) => x.s <= it.t && x.e >= it.t);
    let t = it.t;
    let center = false;
    // A traction pole between two tracks (within CENTER_POLE of where the two track parts meet) stands there,
    // with brackets over both (Bára's photo): trams pass on either side of it.
    if (it.kind === "sloup_trakce" && host && /^tramvaj/.test(host.type)) {
      const k = segs.indexOf(host);
      const meet = [[segs[k - 1], host.s], [segs[k + 1], host.e]].find(([n, b]) => n && /^tramvaj/.test(n.type) && Math.abs(b - t) <= CENTER_POLE);
      if (meet) { t = meet[1]; center = true; host = t === host.s ? segs[k - 1] : host; }
    }
    if (!center && it.stands && (!host || TRAFFIC.has(host.type))) {
      // OSM points are a metre or two off: a lamp drawn in a lane goes to the nearest kerbside part.
      const gap = (x) => (t < x.s ? x.s - t : t > x.e ? t - x.e : 0);
      const shift = Math.max(ITEM_SHIFT, BED_SHIFT[it.kind] ?? 0);
      const near = segs.filter((x) => !TRAFFIC.has(x.type) && gap(x) <= shift).sort((a, b) => gap(a) - gap(b))[0];
      if (!near) continue;
      const inset = Math.min(0.3, (near.e - near.s) / 2);
      host = near;
      t = Math.min(Math.max(t, near.s + inset), near.e - inset);
    }
    if (!host || (it.parked && host.type !== "parkovani")) continue;
    // One tree per parking part: it stands in the middle, behind the car.
    if (it.parked) { if (!host.items?.some((o) => o.kind === "strom")) (host.items ||= []).push({ kind: "strom", f: 0.5 }); continue; }
    if (!center && ONE_PER_PART.has(it.kind) && host.items?.some((o) => o.kind === it.kind && !o.center)) continue;
    const item = { kind: it.kind, f: (t - host.s) / Math.max(host.e - host.s, 0.01) };
    if (it.tram) item.tram = true;
    if (it.lamp) item.lamp = true;
    if (center) { item.center = true; item.f = 1; }
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
const PAVERS = new Set(["grass_paver"]); // OSM surfaces of permeable paving
// OSM surfaces of no paving (Bára: unpaved cycle paths and footways soak the rain in too).
const UNPAVED = new Set(["unpaved", "compacted", "fine_gravel", "gravel", "pebblestone", "ground", "dirt", "earth", "mud", "sand", "woodchips", "grass"]);
const APRON = 1; // a paved strip narrower than this at a building's wall is its apron, not a sidewalk (m)
const APRON_BEYOND = new Set(["zelen", "predzahradka", "stromorad"]);
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
// A carriageway only for buses (highway=busway, or a service road for public transport with no other traffic): the other
// half of a boulevard where it has no other (Bd Marguerite de Rochechouart in Paris: the cars' carriageway, the promenade, the buses' one;
// ?off=busduo leaves it out).
const busOnly = (t) => !ORTHO_P.off?.has("busduo") && (t.highway === "busway" || (t.highway === "service" && ["yes", "designated"].some((v) => t.psv === v || t.bus === v) && ["no", "private"].includes(t.access || t.motor_vehicle)));
function dualPartner(cross, way, half) {
  const own = cross.find((c) => c.way.id === way.id);
  if (!own || !isOnewayTags(way.tags) || !way.tags.name) return null;
  return cross
    .filter((c) => c.way.id !== way.id && isOnewayTags(c.way.tags) && c.way.tags.name === way.tags.name && (!MINOR.has(c.way.tags.highway) || busOnly(c.way.tags)) &&
      drivingDot(c, own) < 0 && Math.abs(c.t - own.t) < half)
    // A bus-only carriageway only when no other is there (Evropská in Prague: the buses' ways on the tram belt are not
    // the street's other half).
    .sort((a, b) => busOnly(a.way.tags) - busOnly(b.way.tags) || Math.abs(a.t - own.t) - Math.abs(b.t - own.t))[0] || null;
}

// On a dual carriageway the cut centre moves from the clicked carriageway to the middle of the
// street (the tram belt or median between the two), so the cut shows the whole street.
export function centerOnStreet(osm, frame, near, half = partnerReach(40)) {
  const normal = [-near.dir[1], near.dir[0]];
  const cross = crossings(osm, frame, near.point, normal, half);
  const partner = dualPartner(cross, near.way, half);
  if (!partner) return near;
  const own = cross.find((c) => c.way.id === near.way.id)?.t ?? 0;
  const m = (own + partner.t) / 2;
  return { ...near, point: [near.point[0] + normal[0] * m, near.point[1] + normal[1] * m] };
}

// The distance between the cut's carriageway and the other one of its street (0: none), for the orthophoto to reach it.
export function partnerGap(osm, frame, near) {
  const normal = [-near.dir[1], near.dir[0]], half = partnerReach(40), cross = crossings(osm, frame, near.point, normal, half);
  const partner = dualPartner(cross, near.way, half), own = cross.find((c) => c.way.id === near.way.id);
  return partner && own ? Math.abs(partner.t - own.t) : 0;
}

// Main entry: returns {segments (screen left → right), edges, runs}.
// Pieces read from the DTM's lines beside a roadway (dmvs.js fromLines) are sidewalks or verges: the lines do
// not tell (Bára 12. 11. 2026; Kolín, Mladá Boleslav: the grass verges and ditches of a road in the fields are
// pieces between "boundaries of a transport area" as well). A side has a sidewalk where OSM says so (sidewalk,
// sidewalk:<side>; "separate" is one drawn apart, still there), none where it says no; without a tag where the
// street is built up: a building within BUILT_NEAR m on that side and no speed over 50. The piece nearest the
// roadway is then the sidewalk, the others are green (estimates all).
// With the orthophoto of the click (lanes-ortho.js laneImage st) the colour decides first (Bára 12. 11. 2026): a
// piece that is green, or yellow as the dry grass of ČÚZK's summer images (Kolín: the verges of a road in the
// fields), is green; a grey, light and even one (asphalt, concrete paving) a sidewalk: paving between two boundaries
// of a transport area beside the roadway; only where the colour is unclear (red paving, the shade of trees, a mix)
// the nearest-piece rule stays. Means over the piece, measured on 50 cuts of Kolín and Mladá Boleslav: green grass
// G 10–14, dry grass Y 23–26, paving G 0–5, Y −1–18, brightness L 110–220 and its spread SD 2–28; the deep shade
// of trees L 81 (Mladá Boleslav, Revoluční: no sidewalk there, Bára), their dappled shade on a verge SD 42 (Kolín, Osecká).
const BUILT_NEAR = 30, LOOK_ALONG = 8;
const looksGreen = (m) => m.G > 8 || (m.Y > 20 && m.D > -25);
const looksPaved = (m) => m.G < 6 && m.Y < 19 && m.D > -25 && m.L > 100 && m.SD < 35;
// "green", "paved" or null (no image, too narrow, unclear): the means of a piece on the orthophoto (rows along the
// street within ±LOOK_ALONG m, its stretch of the cut less 0.25 m at each edge).
export function surfaceLook(st, rings, center, normal) {
  if (!st?.G || !st.Y) return null;
  let lo = Infinity, hi = -Infinity;
  for (let t = st.t0; t <= st.t0 + st.nt * st.res; t += 0.1) {
    if (inside(rings, center[0] + normal[0] * t, center[1] + normal[1] * t)) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
  }
  lo += 0.25; hi -= 0.25;
  if (!(hi - lo >= 0.3)) return null;
  const half = st.nu / 2, rows = Math.round(LOOK_ALONG / st.res), m = { G: 0, Y: 0, D: 0, L: 0, LL: 0 };
  let n = 0;
  for (let i = Math.ceil((lo - st.t0) / st.res); i <= Math.floor((hi - st.t0) / st.res); i++) {
    for (let j = Math.max(0, Math.floor(half - rows)); j < Math.min(st.nu, half + rows); j++) {
      const k = j * st.nt + i;
      if (Number.isNaN(st.G[k])) continue;
      m.G += st.G[k]; m.Y += st.Y[k]; m.D += st.D[k]; m.L += st.L[k]; m.LL += st.L[k] * st.L[k]; n++;
    }
  }
  if (!n) return null;
  for (const c of "GYDL") m[c] /= n;
  m.SD = Math.sqrt(Math.max(0, m.LL / n - m.L * m.L)); // how even its brightness is: paving even, dappled shade not
  return looksGreen(m) ? "green" : looksPaved(m) ? "paved" : null;
}
// along: the way's geometry runs along the cut's direction (OSM's left is then the cut's left, +normal); after
// "Otočit" or a link from the other side it runs against it (Fable's review).
export function linePieces(polys, tags, center, normal, st = null, along = true) {
  const pieces = polys.filter((p) => p.fromLines && p.code === 702);
  if (!pieces.length) return polys;
  const off = (p) => ((p.bbox[0] + p.bbox[2]) / 2 - center[0]) * normal[0] + ((p.bbox[1] + p.bbox[3]) / 2 - center[1]) * normal[1];
  const says = (cutSide) => {
    const side = along ? cutSide : cutSide === "left" ? "right" : "left";
    const own = tags[`sidewalk:${side}`] ?? tags["sidewalk:both"];
    if (own) return !["no", "none"].includes(own);
    const s = tags.sidewalk;
    if (!s) return undefined;
    if (["both", "yes", "separate"].includes(s)) return true;
    if (["no", "none"].includes(s)) return false;
    return s === side;
  };
  const fast = parseInt(tags.maxspeed, 10) > 50;
  const built = (sign) => !fast && polys.some((p) => p.code === 601 && off(p) * sign > 0 && Math.abs(off(p)) < BUILT_NEAR);
  const code = new Map();
  for (const [side, sign] of [["left", 1], ["right", -1]]) {
    const mine = pieces.filter((p) => off(p) * sign > 0).sort((a, b) => Math.abs(off(a)) - Math.abs(off(b)));
    const walk = says(side) ?? built(sign);
    const look = mine.map((p) => surfaceLook(st, p.rings, center, normal));
    let walked = false;
    mine.forEach((p, k) => {
      if (look[k] === "green") code.set(p, 401);
      else if (look[k] === "paved") { code.set(p, 702); walked = true; }
      // Unclear: the nearest piece a sidewalk where the side has one and none paved is seen.
      else if (!walk || walked || k > 0) code.set(p, 401);
      else walked = true;
    });
  }
  return polys.map((p) => (code.has(p) && code.get(p) !== p.code ? { ...p, code: code.get(p), label: "" } : p));
}

// noParkGuess: no parking estimated by the law alone (Monaco; and everywhere for the profile the lanes are measured on,
// app.js lawAt).
export function deriveProfile({ center, dir, half, polys, osm, frame, way, tracks = [], parking = [], lines = [], reach, inZps: zoneKnown, itemReach, ortho, lanesImage, roadOnPath = false, noParkGuess = false, lawAt = [], kerbParking = null, osmParkGive = false }) {
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
  const cross = crossings(osm, frame, center, normal, half, way);
  const own = cross.find((c) => c.way.id === way?.id);
  polys = linePieces(polys, way?.tags || {}, center, normal, lanesImage, own ? own.d[0] * dir[0] + own.d[1] * dir[1] >= 0 : true);
  // A tram area that maps the tracks in the asphalt too (Berlin's Gleiskörper; Neue Schönhauser Straße: Bára 17. 11.
  // 2026, two tracks in a one-way street with parking both sides) is roadway where OSM puts the rails in the street
  // (embedded_rails); the tracks are then OSM's in the lanes. ?off=anytram keeps it a tram bed.
  const asRoad = /tram/.test(way?.tags?.embedded_rails || "") && !ORTHO_P.off?.has("anytram");
  const beds = mapTramBeds(polys, center, normal, half, (p) => asRoad && p.anyTram);
  if (asRoad) polys = polys.map((p) => (p.anyTram && p.code === 705 ? { ...p, code: 701, label: "" } : p));
  // A building connection over a street (a covered passage, Na Klaudiánce in Prague: Bára 17. 11. 2026) is drawn in
  // the technical map as a strip of "other structures" above the street, and a cut across the street runs along it.
  // No wall is 10 m thick with a street through it: such a piece is no ground of its own, so it is left out (as the
  // areas above the ground below) and the street under it comes from OSM.
  polys = polys.filter((p) => {
    if (!isMinorStructure(p.code) || p.level) return true;
    let lo = Infinity, hi = -Infinity;
    for (let t = -half; t <= half + 1e-9; t += 0.25) {
      const [x, y] = [center[0] + normal[0] * t, center[1] + normal[1] * t];
      const [x0, y0, x1, y1] = p.bbox || [-Infinity, -Infinity, Infinity, Infinity];
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && inside(p.rings, x, y)) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
    }
    return !(hi - lo >= PASSAGE_MIN && cross.some((c) => c.t >= lo && c.t <= hi && STREETS.has(c.way.tags?.highway)));
  });
  let axisT = cross.find((c) => c.way.id === way.id)?.t ?? 0;
  // Tram track axes: measured ones from the technical map when available, else OSM.
  const measured = lineCrossings(tracks, center, normal, half);
  // A road tagged as the tram line itself (highway + railway=tram, the tracks not mapped apart: Smetanovo nábřeží in OSM
  // until 2017) carries a track each way, 3 m apart (Manuál C.2), unless it is one-way or says one track (?off=tramroad).
  const roadTram = (c) => c.way.tags?.highway && !ORTHO_P.off?.has("tramroad") && c.way.tags.oneway !== "yes" && !["1", 1].includes(c.way.tags["railway:tracks"] ?? c.way.tags.tracks);
  const tramTs = mergeTrackAxes(measured.length ? measured : cross.filter((c) => c.way.tags?.railway === "tram").flatMap((c) => (roadTram(c) ? [c.t - 1.5, c.t + 1.5] : [c.t])));
  tramTs.measured = measured.length > 0;
  if (!tramTs.measured && !ORTHO_P.off?.has("tramsnap")) snapTracksToBeds(tramTs, beds);

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
    ...parking.filter((p) => p.kind === "useky").map((p) => ({ ...p, code: TSK_PARKING, orient: p.orient || orientFromStalls(p, dir) })),
    ...osmOutdoorPolygons(osm, frame),
    ...(osmParking ? osmParkingPolygons(osm, frame, way) : []),
    ...polys,
  ])));
  const axisRun = (rs) => rs.findIndex((r) => r.s <= axisT && r.e >= axisT);
  let runs = classifyAll(true);
  // An OSM street-parking area under the street axis covers the carriageway itself (drawn
  // over the whole street): the bays cannot be told apart, so the technical map alone decides.
  if (runs[axisRun(runs)]?.code === OSM_PARKING) runs = classifyAll(false);
  runs = capParallelBay(runs, axisT);
  // roadOnPath (Prague, Bára 15. 11. 2026): a "sidewalk or park path" (702) at least ROAD_ON_PATH_MIN wide that an
  // OSM road crosses is its roadway, as an estimate, where the technical map has no roadway along the whole cut
  // (Poncarova: MTVU codes a two-lane road 702). OSM's sidewalks play no part. 142 cuts of Prague's samples
  // unchanged (evaluation/variants/cesta-vozovka.mjs).
  if (roadOnPath && !runs.some((r) => r.code === 700 || r.code === 701)) {
    const roads = cross.filter((c) => CAR_ROADS.has(c.way.tags?.highway) && c.way.tags?.area !== "yes");
    runs = runs.map((r) => (r.code === 702 && r.e - r.s >= ROAD_ON_PATH_MIN && roads.some((c) => c.t > r.s && c.t < r.e) ? { ...r, code: 701, guess: true } : r));
  }
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
  // The OSM axis fixes (first Brno's, 9. 11. 2026; every city since 25. 11. 2026, Bára: one rule everywhere;
  // ?off=osafix: none, Prague's old behaviour). A paved strip under the axis between two roadways is a median, whose
  // axis is the street's middle (Prague č. 42, Generála Šišky: a single OSM axis on the 1.5 m paved divider of two
  // roadways, which the old rules made a lane and moved off the middle); ?off=osaroad drops that test.
  const axisFix = STREETS.has(way.tags?.highway) && !ORTHO_P.off?.has("osafix"), guarded = !ORTHO_P.off?.has("osaroad");
  const gap = (r) => (axisT < r.s ? r.s - axisT : axisT > r.e ? axisT - r.e : 0);
  const roadsNear = (side) => runs.some((r) => carriage(r.code) && gap(r) <= AXIS_SNAP && (side < 0 ? r.e <= axisT : r.s >= axisT));
  const onDivider = guarded && roadsNear(-1) && roadsNear(1);
  // A paved area under the axis of a street (not a path) is its roadway, as an estimate (Brno's MTVU codes a rebuilt
  // road as "manipulační plocha", e.g. Žabovřeská). Not a wide one (a 55 m construction site is no roadway to split
  // into lanes), not one narrower than a lane (ROAD_UNDER_AXIS_MIN), not a divider between two roadways.
  const paved = runs[i0].code === 1003 || runs[i0].code === 603, pavedW = runs[i0].e - runs[i0].s;
  if (axisFix && paved && pavedW <= 25 && !onDivider && !(guarded && pavedW < ROAD_UNDER_AXIS_MIN)) {
    runs[i0] = { ...runs[i0], code: 701, guess: true };
  }
  // An OSM axis a few metres beside the roadway (on its sidewalk or verge) is moved onto it, so the profile does not
  // start beside the street (Brno test of 100 cuts: axes 2–4 m off). Not from a divider between two roadways, and on a
  // dual carriageway not across to the other carriageway's side: the axis belongs to the roadway on its own side.
  if (axisFix && !carriage(runs[i0].code) && !onDivider) {
    const partnerT = guarded ? dualPartner(cross, way, half)?.t : undefined;
    const ownSide = (r) => partnerT === undefined || Math.sign(r.s + (r.e - r.s) / 2 - axisT) !== Math.sign(partnerT - axisT);
    const road = runs.filter((r) => carriage(r.code) && gap(r) <= AXIS_SNAP && ownSide(r)).sort((a, b) => gap(a) - gap(b))[0];
    if (road) {
      axisT = road.s + (road.e - road.s) / 2;
      i0 = runs.indexOf(road);
    }
  }
  // The technical map has no street surface where OSM draws a street (a new road, a field, a
  // gap in MTVU): the profile falls back to OSM and says so.
  // A named service road counts too: a new estate's street is often mapped so (Devětsilová in Prague, MTVU still a
  // field, Bára 23. 11. 2026); an unnamed one over a field is a farm drive.
  const street = !MINOR.has(way.tags?.highway) || (way.tags?.highway === "service" && !!way.tags?.name);
  if (street && isUnpaved(runs[i0]?.code)) {
    const code = runs[i0]?.code;
    return { ...estimateFromOsm(way), runs, notice: t("Mapa povrchů tu ulici nemá ({what}), profil je odhad z OSM.", { what: code === null || code === undefined ? t("žádná plocha") : `${t("plocha")} ${code} ${polys.find((p) => p.code === code)?.label || ""}`.trim() }) };
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
  // A cut end dragged out past the default reach (by hand) asks for what is out there: the profile goes over
  // fences, gardens, lawns and yards to the next building, or to the dragged end (Bára, Pardubice, Palackého).
  // Also a reach set by hand short of that, but past where the profile would end by itself (Bára, Mladá Boleslav,
  // Revoluční: an end dragged from 16 m to 20 m sprang back to the grass where the profile had stopped).
  const byHand = { L: (reach?.left ?? 0) > MAX_REACH + 0.5, R: (reach?.right ?? 0) > MAX_REACH + 0.5 };
  const onBridgeWay = way.tags?.bridge && way.tags.bridge !== "no", SIDEWALKS = new Set([702, 703]);
  const stopAt = (r, limit, k, step) => {
    if (isBuilding(r.code)) return "budova";
    if (byHand[step > 0 ? "L" : "R"]) return Math.min(Math.abs(r.s - ref), Math.abs(r.e - ref)) > limit ? "volno" : null;
    // A narrow "other structure" is a wall or parapet (e.g. an embankment wall): the profile goes on.
    if (isMinorStructure(r.code) && r.e - r.s >= WALL_MAX) return "stavba";
    if (inMedian(r)) return null;
    // A street on a bridge ends with the bridge: past its outer sidewalk lies the ground under it (Bára, Hlávkův
    // most); a roadway right after a sidewalk is the other half of the bridge (Brno, a paved median).
    if (onBridgeWay && SIDEWALKS.has(runs[k - step]?.code) && !SIDEWALKS.has(r.code) && !carriage(r.code)) return "volno";
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
  const walk = () => {
    let lo = i0, hi = i0, right = "volno", left = "volno";
    while (lo > 0) { const s = stopAt(runs[lo - 1], reachR, lo - 1, -1); if (s) { right = s; break; } lo--; }
    while (hi < runs.length - 1) { const s = stopAt(runs[hi + 1], reachL, hi + 1, 1); if (s) { left = s; break; } hi++; }
    return { lo, hi, right, left };
  };
  let { lo, hi, right, left } = walk();
  // Another street inside the profile, at an angle (S Street SE and Minnesota Avenue meeting at 34°, H Street NW in the
  // fork with New York Avenue: the review of 25. 11. 2026): its roadway is not this street's: the cut runs
  // through a junction, said so (?off=otherstreet: not). With ?otherstreet=1 the profile ends at the sidewalk or green before
  // it, where there is one: off, the blind A/B of 25. 11. 2026 is a tie (13 : 10 of 31 changed cuts, Europe 9 : 10,
  // Washington and Toronto 4 : 0; evaluation/canada/review).
  let forks = false;
  const foreign = ORTHO_P.off?.has("otherstreet") ? [] : cross.filter((c) => otherStreet(c, way, dir, cross));
  for (const step of foreign.length ? [1, -1] : []) {
    let at0 = i0;
    while (at0 >= lo && at0 <= hi && !(isRoadway(runs[at0].code) && foreign.some((c) => c.t > runs[at0].s && c.t < runs[at0].e))) at0 += step;
    if (at0 < lo || at0 > hi) continue;
    if (at0 === i0) { forks = true; continue; }
    if (byHand[step > 0 ? "L" : "R"]) continue;
    // Back from the foreign roadway to the sidewalk or green of at least OTHER_WALK before it, on the cut's own side.
    let end = at0 - step, walked = 0;
    while (end !== i0 && !carriage(runs[end].code) && runs[end].code !== OSM_PARKING) { if (runs[end].code === 702 || runs[end].code === 703 || isOpenLand(runs[end].code)) walked += runs[end].e - runs[end].s; end -= step; }
    if (walked < OTHER_WALK || !OTHER_CUT) { forks = true; continue; }
    if (step > 0) { hi = at0 - 1; left = "volno"; } else { lo = at0 + 1; right = "volno"; }
  }
  const handSet = (v) => typeof v === "number" && Math.abs(v - MAX_REACH) > 0.05;
  const pastL = !byHand.L && handSet(reach?.left) && left !== "budova" && reach.left > runs[hi].e - ref + 0.5;
  const pastR = !byHand.R && handSet(reach?.right) && right !== "budova" && reach.right > ref - runs[lo].s + 0.5;
  if (pastL || pastR) {
    byHand.L ||= pastL;
    byHand.R ||= pastR;
    ({ lo, hi, right, left } = walk());
  }
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
  // A side the user dragged to a reach of his own (not the default, beyond the fence too) is his: the fence does not end it (Bára
  // 27. 11. 2026, Palackého třída in Pardubice: the cut's end at 19.9 m, the map's fence 6 m off, a sidewalk and the house
  // behind it; the fence is drawn as an item and the profile goes on to the reach). ?off=rucniplot: the fence ends it as before.
  // A railing at the kerb (within RAIL_KERB of the outermost carriageway, the map's sidewalk or paved area behind it: Jahnova in
  // Pardubice, the technical map codes the railing that parts the sidewalk from the roadway as a fence) is no edge of the
  // street: the profile goes on past it. A fence round a garden or a yard (green or other land behind it) stays the edge.
  // ?off=zabradli: as before.
  const RAIL_KERB = 1, BEHIND = new Set([702, 703, 1003]);
  const railing = (t, sg) => !ORTHO_P.off?.has("zabradli") && Math.abs(t - (sg > 0 ? roadMax : roadMin)) <= RAIL_KERB + 0.3 && [0.3, 1.2].some((d) => BEHIND.has(runs.find((r) => sg * (r.e - (t + sg * d)) > 0 && sg * (r.s - (t + sg * d)) <= 0)?.code));
  const fenceAway = (side) => !ORTHO_P.off?.has("rucniplot") && handSet(reach?.[side]);
  const fenceL = byHand.L || fenceAway("left") ? Infinity : Math.min(Infinity, ...fenceTs.filter((t) => t > roadMax + 0.3 && t < runs[hi].e - nearL && !railing(t, 1)));
  const fenceR = byHand.R || fenceAway("right") ? -Infinity : Math.max(-Infinity, ...fenceTs.filter((t) => t < roadMin - 0.3 && t > runs[lo].s + nearR && !railing(t, -1)));

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
  // Each roadway with the tags of its own OSM way, for the signs of its lanes (signs.js): on a street of two
  // roadways the other one's rules are not the clicked way's (Hradec, Hlavní: a living street beside the road).
  const roads = [];
  // Inside (or within 100 m of) a paid parking zone, from the TSK zone boundaries (caller's inZps);
  // without them, TSK parking sections along the cut stand for the zone.
  const inZps = zoneKnown ?? parking.some((p) => p.kind === "useky");
  // A sidewalk beyond the kerb of roadway r on side sd (L: larger t): a footway or cycle path surface, past a
  // green strip; or the street's OSM sidewalk tags on that side (st.osmSide) or a footway along the street.
  const walkBeyond = (r, sd, after, before, st, tags) => {
    const step = sd === "L" ? after : before;
    let x = step(r), green = 0;
    while (x && ((x.code >= 400 && x.code < 500) || x.e - x.s < 0.5) && green + x.e - x.s <= WALK_GREEN) { green += x.e - x.s; x = step(x); }
    if (x && (x.code === 702 || x.code === 703)) return true;
    const t = tags || {}, osmSide = st?.osmSide;
    if (["both", "yes", "separate", osmSide].includes(t.sidewalk) || ["yes", "separate"].includes(t[`sidewalk:${osmSide}`]) || ["yes", "separate"].includes(t["sidewalk:both"])) return true;
    const kerb = sd === "L" ? r.e : r.s, k = sd === "L" ? 1 : -1;
    return cross.some((c) => {
      const h = c.way.tags?.highway, d = (c.t - kerb) * k;
      return d > -0.5 && d <= WALK_OSM && Math.abs(c.d[0] * dir[0] + c.d[1] * dir[1]) >= 0.8 &&
        (c.way.tags.footway === "sidewalk" || ["footway", "path", "cycleway", "pedestrian"].includes(h));
    });
  };
  // Built-up area at a kerb (offset kerb, k = 1 outwards to larger t): the profile ends at a building there,
  // or a building of OSM or of the surfaces has a corner within BUILT_ALONG along the street and BUILT_OUT out.
  let buildingRings = null;
  const builtUp = (kerb, k, edge) => {
    if (edge === "budova") return true;
    buildingRings ??= [
      ...(osm.elements || []).filter((el) => el.type === "area" && TUNED_BUILDING(el.tags)).map((el) => el.geometry.map((g) => frame.toXY(g.lon, g.lat))),
      ...polys.filter((p) => isBuilding(p.code)).flatMap((p) => p.rings || []),
    ];
    const [cx, cy] = at(kerb);
    const uv = ([x, y]) => [(x - cx) * dir[0] + (y - cy) * dir[1], ((x - cx) * normal[0] + (y - cy) * normal[1]) * k];
    // An outline edge reaching into the box [−BUILT_ALONG, BUILT_ALONG] × [0, BUILT_OUT] (clipped, Liang–Barsky).
    const hits = ([u0, v0], [u1, v1]) => {
      let a = 0, b = 1;
      for (const [p, q] of [[u0 - u1, u0 + BUILT_ALONG], [u1 - u0, BUILT_ALONG - u0], [v0 - v1, v0], [v1 - v0, BUILT_OUT - v0]]) {
        if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
        const r = q / p;
        if (p < 0) a = Math.max(a, r); else b = Math.min(b, r);
        if (a > b) return false;
      }
      return true;
    };
    return buildingRings.some((ring) => ring.some((p, i) => i > 0 && hits(uv(ring[i - 1]), uv(p))));
  };
  // Is a run the national DTM's tram area (dmvs.js: in the roadway or apart from it), not MTVU's separate bed?
  const dtmTramIn = (r) => { const [x, y] = at((r.s + r.e) / 2); return polys.some((p) => p.dtmTram && x >= p.bbox[0] && x <= p.bbox[2] && y >= p.bbox[1] && y <= p.bbox[3] && inside(p.rings, x, y)); };
  for (const r of kept) {
    const type = typeFromMtvu(r.code);
    if (r.code === 701 || r.code === 700) {
      const inRun = (t) => t > r.s && t < r.e;
      // (A cycle track a planimetric map's roadway had cut out at its side, towns/planimetrics.js osmTracks: an axis under it
      // is this roadway's.)
      const carvedBy = kept.filter((k) => k.carved && (Math.abs(k.e - r.s) < 0.15 || Math.abs(k.s - r.e) < 0.15));
      const onRoad = (t) => inRun(t) || carvedBy.some((k) => t > k.s && t < k.e);
      // OSM road axes in this carriageway: each lane takes the direction of the nearest one.
      const here = cross.filter((c) => onRoad(c.t) && c.way.tags?.highway && !MINOR.has(c.way.tags.highway));
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
      // (The street's own: its axis crosses it, or, by default (ORTHO_P.axisroad; ?axisroad=0 turns it off), the axis fix above moved the axis
      // onto it: Lippard Avenue in San Francisco, the axis in the parking lane the curb carved, the rest a footway's. Off:
      // 1 of 290 cuts of five cities changes, too few to measure; evaluation/usa/sf/fixes/ZPRAVA.md.)
      const ownRoad = cross.some((c) => c.way.id === way.id && inRun(c.t)) || (!!ORTHO_P.axisroad && inRun(axisT));
      if (!here.length && minor.length && !transit && !(ownRoad && !MINOR.has(way.tags.highway))) {
        const foot = minor.some((c) => ["footway", "pedestrian", "path", "steps"].includes(c.way.tags.highway));
        // A cycle way (OSM highway=cycleway, or a path for bicycles) over the surface is a cycle track: a map that
        // draws it as a roadway (Bratislava's town map, Dunajská; Bára 16. 11. 2026) does not make it an access road.
        const bike = minor.some((c) => c.way.tags.highway === "cycleway" || (c.way.tags.highway === "path" && c.way.tags.bicycle === "designated"));
        segs.push({ type: bike ? "cyklostezka" : foot ? "chodnik" : "obsluzna", s: r.s, e: r.e, source: "dtm" });
        continue;
      }
      const own = here.find((c) => c.way.id === way.id) || here[0];
      const tags = own?.way.tags || (transit ? (minor.find((c) => c.way.tags.highway === "pedestrian") || minor[0])?.way.tags : null) || way.tags || {};
      const axes = (here.length ? here : [{ t: axisT, way, d: dir }]).map((c) => {
        const t2 = c.way.tags || {};
        const oneway = isOnewayTags(t2) || t2.junction === "roundabout";
        const along = (c.d[0] * dir[0] + c.d[1] * dir[1] >= 0) !== (t2.oneway === "-1");
        // A pedestrian or residential zone has no lanes marked: its roadway is one lane (Bára; třída Míru in
        // Pardubice), whatever OSM counts (lanes=2 there counts the buses' contraflow).
        const zone = t2.highway === "pedestrian" || t2.highway === "living_street";
        const lanes = zone ? 1 : parseInt(t2.lanes, 10) || (oneway ? 1 : 2);
        const geomAlong = c.d[0] * dir[0] + c.d[1] * dir[1] >= 0;
        return { t: c.t, oneway, along, geomAlong, lanes, id: c.way.id, tags: t2 };
      });
      const dirAt = (m) => {
        const a = axes.reduce((b, x) => (Math.abs(x.t - m) < Math.abs(b.t - m) ? x : b));
        if (a.oneway) return a.along ? "forward" : "backward";
        // Two-way: traffic keeps right, so the half left of the axis runs against the cut's street (keeping left,
        // countries/<ISO>.js leftHand: the other half; a one-way axis keeps the direction of its geometry).
        return (m > a.t) !== !!country.leftHand ? "backward" : "forward";
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
      // A cycle track a map measured right beside the kerb (Paris's Plan de voirie, 703) is the cycle way OSM tags on that
      // side (cycleway:<side>=lane on the road for a track beside it): no cycle lane in the roadway as well (the hostile
      // review of France: Rue de Cléry had a cycle lane 1.5 m and the map's track 1.35 m side by side). ?off=kolodvakrat.
      const besideTrack = (x) => x?.code === 703 && !ORTHO_P.off?.has("kolodvakrat");
      for (const [side, x] of [["L", kept[kept.indexOf(r) + 1]], ["R", kept[kept.indexOf(r) - 1]]]) {
        if (besideTrack(x) && sideTagsLR[side].bike === "cyklopruh") sideTagsLR[side] = { ...sideTagsLR[side], bike: null };
      }
      // A no-parking section of TSK at the kerb (Prague): no parking there, whatever OSM says.
      for (const [side, at, k] of [["L", r.e, -1], ["R", r.s, 1]]) {
        if (noParkingAt(noParking, at, k)) sideTagsLR[side] = { ...sideTagsLR[side], parking: false, parkingNo: true, kerbPos: null, kerbDepth: 0 };
      }
      // A city's register of parking stretches (Paris, towns/france.js: points in the middle of the strip with its length,
      // depth and arrangement) decides each kerb: a stretch reaching the cut whose point lies at this kerb, inside the
      // roadway up to its depth (± KERB_PARK_TOL), is parking there; a kerb with none has no parking (the register
      // covers the whole city). Only a stretch of this street where the register names one (its nomvoie in OSM's name),
      // except on a square: the register names its sides by the streets (Place des Alpes: Bd Vincent Auriol).
      if (kerbParking) {
        const plain = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
        const name = /^(PLACE|SQUARE|CARREFOUR|ROND POINT|PARVIS|ESPLANADE) /.test(plain(tags.name)) ? "" : plain(tags.name);
        for (const [side, kerb, k] of [["L", r.e, -1], ["R", r.s, 1]]) {
          const hit = kerbParking.find((p) => {
            const a = (p.xy[0] - center[0]) * dir[0] + (p.xy[1] - center[1]) * dir[1], t = (p.xy[0] - center[0]) * normal[0] + (p.xy[1] - center[1]) * normal[1];
            const into = (t - kerb) * k;
            return Math.abs(a) <= p.len / 2 + KERB_PARK_ALONG && into >= -KERB_PARK_TOL && into <= p.w + KERB_PARK_TOL && (!p.street || !name || name.includes(plain(p.street)));
          });
          sideTagsLR[side] = hit ? { ...sideTagsLR[side], parking: true, parkingNo: false, parkingWidth: hit.w, parkingOrient: hit.orient, kerbPos: null, kerbDepth: 0 }
            : { ...sideTagsLR[side], parking: false, parkingNo: true, kerbPos: null, kerbDepth: 0 };
        }
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
      // Cars on the sidewalk at an outer kerb: carved out of it after the split; where a bay is measured or mapped
      // there (parked), the bay keeps its width and only takes the position from OSM.
      for (const [side, st, at] of [["L", sideTagsLR.L, r.e], ["R", sideTagsLR.R, r.s]]) {
        if (st.kerbPos && kerbOpen.includes(side)) kerbReqs.push({ side, at, w: st.kerbDepth, orient: st.parkingOrient, pos: st.kerbPos, bay: parked.includes(side) });
      }
      // Kerbs without a sidewalk outside the built-up area (Bára): no parking is estimated there.
      const kerbBare = kerbOpen.filter((sd) => !walkBeyond(r, sd, after, before, edgeTags(sd), tags) && !builtUp(sd === "L" ? r.e : r.s, sd === "L" ? 1 : -1, edges[sd === "L" ? "left" : "right"]));
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
      const guessPark = noParkGuess || (cls && (cls.road || cls.motorway || cls.mk === 1 || cls.mk === 2)) ? false : undefined;
      // A state without street classes of its own here (Austria): the OSM highway gives the group (countries/AT.js).
      const roadClass = classGroup(cls) ?? (country.roadClassFromOsm ? osmGroup(tags.highway) : null);
      // fwd: the roadway's traffic runs along the cut's direction (undefined: not known); signs.js, a one-way roadway of a divided street.
      roads.push({ s: r.s, e: r.e, tags, fwd: ownAxis ? ownAxis.along !== (tags.oneway === "-1") : undefined });
      const noCars = carsBanned(tags), toBus = noCars && transitAllowed(tags);
      segs.push(...splitRoadway(r, { guessPark, osmParkGive, tags, trams: inside, dirAt, lanesTotal, along: ownAxis ? (ownAxis.along !== (tags.oneway === "-1")) : true, single: new Set(axes.map((a) => a.id)).size === 1, parked, sides: sideTagsLR, kerbOpen, kerbBare, inZps, axesOneway: axes.every((a) => a.oneway), axes, axisInside: here.length > 0, divided, roadClass }).map((x) => ({ ...x, mtvu: r.code, ...(noCars && x.type === "pruh" && (toBus ? { type: "bus" } : { noCar: true })),
        // Bus lanes carry trolleybuses; so does the lane of a zone closed to cars but open to public transport
        // (třída Míru in Pardubice: motor_vehicle=delivery, psv=yes).
        trolley: trolley && (x.type === "bus" || x.type === "bus_cyklo" || toBus || (x.type === "pruh" && transitOnly(tags))),
        // The wires hang over the lanes (drawn in the profile).
        wires: trolley && WIRED.has(x.type), roadClass })));
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
    } else if (type === "tramvaj" && dtmTramIn(r) && [kept[kept.indexOf(r) - 1], kept[kept.indexOf(r) + 1]].every((n) => n && (n.code === 700 || n.code === 701))) {
      // The national DTM's tram area with the roadway on both sides and no curb or green between: the tracks lie
      // in the roadway (Olomouc, Sokolská; Bára), a track each way when it is wide enough.
      const parts = r.e - r.s > 5 ? [[r.s, (r.s + r.e) / 2, "forward"], [(r.s + r.e) / 2, r.e, "backward"]] : [[r.s, r.e, undefined]];
      for (const [a, b, d] of parts) segs.push({ type: "tramvaj_v_pruhu", s: a, e: b, dir: d, source: "dtm" });
    } else if (type === "tramvaj" || (type === "zelen" && r.e - r.s >= GRASS_BED_MIN && tramTs.some((t) => t > r.s + 0.5 && t < r.e - 0.5))) {
      // A separate tram bed (MTVU 705 and the towns' equivalents), or a green area with tracks in it: a bed
      // of grass. Wider than 5 m it carries a track each way.
      const bed = type === "zelen" ? { kind: "trava", source: "dtm" } : bedOf(cross, r);
      // A green area is a bed only round its tracks (1.75 m beyond the outer axes); the rest stays green (Werichova:
      // a 36 m lawn with two tracks drew two trams of 18 m; ?off=grassbed).
      let s0 = r.s, e0 = r.e;
      if (type === "zelen" && !ORTHO_P.off?.has("grassbed")) {
        const ins = tramTs.filter((t) => t > r.s && t < r.e);
        s0 = Math.max(r.s, Math.min(...ins) - 1.75); e0 = Math.min(r.e, Math.max(...ins) + 1.75);
        if (s0 - r.s < 0.5) s0 = r.s;
        if (r.e - e0 < 0.5) e0 = r.e;
        if (s0 > r.s) segs.push({ type: "zelen", s: r.s, e: s0, source: r.code === null ? "odhad" : "dtm" });
      }
      const parts = e0 - s0 > 5 ? [[s0, (s0 + e0) / 2, "forward"], [(s0 + e0) / 2, e0, "backward"]] : [[s0, e0, undefined]];
      for (const [a, b, d] of parts) segs.push({ type: "tramvaj", s: a, e: b, dir: d, bed: bed.kind, bedSource: bed.source, source: "dtm" });
      if (e0 < r.e) segs.push({ type: "zelen", s: e0, e: r.e, source: r.code === null ? "odhad" : "dtm" });
    } else if (type === "railway") {
      // A railway track of OSM beside the street (ortho-osm.js heavyRail): a gravel bed; a narrow gauge is drawn narrower.
      segs.push({ type: "railway", s: r.s, e: r.e, source: "osm", ...(cross.some((c) => c.way.tags?.railway === "narrow_gauge" && c.t > r.s - 0.3 && c.t < r.e + 0.3) && { narrow: true }) });
    } else if (type === "cyklostezka") {
      segs.push(...cycleTrack(r, cross, dir));
    } else {
      if (type === "chodnik") segs.push(...sidewalkUse(r, cross, way, axisT, dir));
      else segs.push({ type, s: r.s, e: r.e, source: r.code === null ? "odhad" : "dtm", ...(type === "parkovani" && r.orient && { orient: r.orient }) });
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
  // The surface of the beds nobody describes: the orthophoto (ortho: ortho.js bedOrtho) and the rules.
  bedSurfaces(segs, { rails: tramTs, ortho, at, dir, highway: way.tags?.highway });
  // Roadway outer edges are measured; only the internal split comes from OSM.
  const kerbNotes = [];
  const withKerb = carveKerbParking(markIslands(segs, lawAt), kerbReqs, kerbNotes);
  const withPlatforms = insertPlatforms(withKerb, platformPositions(osm, frame, center, normal, half), axisT);
  const parkedTrees = [];
  // In a pedestrian zone the estimate's unknown is the zone's walking surface (pedestrianZone below makes it a
  // sidewalk): its trees stand there too, so it takes them as a sidewalk would.
  const zoneWalk = way.tags?.highway === "pedestrian" && !ORTHO_P.off?.has("pesizona");
  const withTrees = insertTrees(withPlatforms, treePositions(osm, frame, center, normal, half, lines, reachItems), parkedTrees, zoneWalk);
  const withItems = attachItems(perpDepth(mergeParking(withTrees)), [...itemPositions(osm, frame, center, normal, half, lines, reachItems), ...parkedTrees]);
  // Points 4 m inside the buildings at both ends, for their height and number of floors.
  const probe = { left: at(kept.at(-1).e + 4), right: at(kept[0].s - 4) };
  for (const side of ["left", "right"]) {
    if (edges[side] !== "budova") continue;
    const b = buildingAt(osm, frame, probe[side]);
    const point = frame.toLonLat(...probe[side]);
    edges[`${side}Info`] = { levels: b?.levels, height: b?.height, point, km: +centreKm(point).toFixed(1), block: b?.block, tint: side === "left" ? 0 : 3 };
    if (b?.type && b.type !== "yes") edges[`${side}Info`].type = b.type;
    if (b?.roofShape) edges[`${side}Info`].roofShape = b.roofShape;
    if (b?.start) edges[`${side}Info`].start = b.start;
    // The footprint (m²): a small house alone is a family house when nothing else is known (house-looks.js smallHouse).
    if (b?.footprint) edges[`${side}Info`].footprint = Math.round(b.footprint);
    if (b?.panel) edges[`${side}Info`].panel = 1;
    if (b?.own) edges[`${side}Info`].own = b.own;
    if (b?.around) edges[`${side}Info`].around = b.around;
    // The walls' material (OSM building:material): a wooden house in Estonia and the north, Malta's limestone
    // (house-looks.js); no Czech look reads it.
    if (b?.material) edges[`${side}Info`].material = b.material;
    if (gableToStreet(b?.axis, normal)) edges[`${side}Info`].across = 1;
    // The house stands at the sidewalk (no front yard), on a main street or one with tracks (house-looks.js, North America: no
    // porch there, a joined row a shopping street's).
    const endRun = side === "left" ? kept.at(-1) : kept[0];
    if ((endRun.code === 702 || endRun.code === 703) && endRun.e - endRun.s <= WALK_FRONT) edges[`${side}Info`].atWalk = 1;
    if (/^(primary|secondary)$/.test(way.tags?.highway || "") || tramTs.length) edges[`${side}Info`].main = 1;
    // An arcade under the house (Bára 16. 11. 2026: only where the data say so): an OSM way tagged covered=arcade,
    // colonnade or building_arcade crossing the cut by the facade (5 m in front of it to 8 m behind).
    const edgeT = side === "left" ? kept.at(-1).e : kept[0].s, out = side === "left" ? 1 : -1;
    if (cross.some((c) => ARCADE_COVER.has(c.way.tags?.covered) && (c.t - edgeT) * out > -5 && (c.t - edgeT) * out < 8)) edges[`${side}Info`].arcade = 1;
  }
  // Permeable paving from OSM (Bára 12. 11. 2026, rainwater 5.1.2): grass pavers (surface=grass_paver) of an area the
  // part's middle lies on (parking: about 300 in Czechia), or of a way crossing the part (service roads, footways,
  // paths: about 900). The only rainwater object the data show along streets.
  // Unpaved surfaces of the same (fine gravel, compacted earth…) are "nezpevneny".
  const kindOf = (t) => (PAVERS.has(t?.surface) ? true : UNPAVED.has(t?.surface) ? "nezpevneny" : null);
  const surfAreas = (osm.elements || []).filter((el) => el.type === "area" && kindOf(el.tags) && el.geometry)
    .map((el) => ({ kind: kindOf(el.tags), rings: [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat))) }));
  const surfWays = cross.filter((c) => kindOf(c.way.tags)).map((c) => ({ kind: kindOf(c.way.tags), t: c.t }));
  for (const x of withItems) {
    if (!PERMEABLE_TYPES.includes(x.type)) continue;
    const [px, py] = at((x.s + x.e) / 2);
    const hit = surfWays.find((w) => w.t > x.s && w.t < x.e) || surfAreas.find((a) => inside(a.rings, px, py));
    if (hit) x.permeable = hit.kind;
  }
  // A strip of paving under APRON along a building's wall (an apron, "okapový chodník") with green past it is no
  // sidewalk but a paved area (the rest of a sidewalk beside cars parked on it stays one): it is not walked along (Bára, Vysoké Mýto, Komenského: 0.70 m was warned as a
  // sidewalk below the minimum). withItems runs from the right end (edges.right) to the left one.
  for (const [k, side, step] of [[0, "right", 1], [withItems.length - 1, "left", -1]]) {
    const x = withItems[k], beyond = withItems[k + step];
    if (edges[side] === "budova" && x?.type === "chodnik" && x.e - x.s < APRON && APRON_BEYOND.has(beyond?.type)) x.type = "plocha";
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
  // A part measured on a town's passport says so (Bára 16. 11. 2026), not "from the technical map".
  const passports = polys.filter((p) => p.passport);
  if (passports.length) for (const x of withItems) {
    if (x.source !== "dtm") continue;
    const [px, py] = at((x.s + x.e) / 2);
    if (passports.some((p) => inside(p.rings, px, py))) x.source = "pasport";
  }
  return {
    segments: aisleOrient(withItems.reverse().map(toSegment)),
    edges: { ...edges },
    runs,
    axisT,
    roads,
    extent: [kept[0].s, kept.at(-1).e], // offsets of the right and left profile ends along the cut
    // A roadway this wide along the cut usually means the cut crosses a junction.
    junction: forks || kept.some((r) => (r.code === 701 || r.code === 700) && r.e - r.s > 25),
    ...(kerbNotes.length ? { notice: kerbNotes.join(" ") } : {}),
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
  if (x.noCar) seg.noCar = true;
  if (x.wires) seg.wires = true;
  if (x.type === "tramvaj") { seg.bed = x.bed || "panely"; if (x.bedSource === "odhad") seg.bedGuess = true; }
  if (x.withBus) seg.withBus = true;
  if (x.narrow) seg.narrow = true;
  if (x.permeable) seg.permeable = x.permeable;
  if (x.roadClass && LANE_TYPES.has(x.type)) seg.roadClass = x.roadClass;
  // Segments are reversed to screen order, so item positions flip too.
  if (x.items?.length) seg.items = x.items.map((it) => ({ ...it, f: +(1 - it.f).toFixed(3) }));
  if (x.type === "parkovani") {
    // Cars on the sidewalk (on_kerb) or across the kerb (half_on_kerb), from OSM.
    if (x.position) seg.position = x.position;
    seg.orient = x.orient || orientFromDepth(seg.width);
    // Last guard (ČSN 73 6056): perpendicular parking is never shallower than PERP_MIN.
    if (seg.orient === "kolme" && seg.width < PERP_MIN) seg.orient = "sikme";
  }
  return seg;
}

const round = (v) => Math.round(v * 100) / 100;

// Cars drive into perpendicular stalls from an aisle about 6 m wide, into stalls at 45° from about 3.5 m (ČSN 73 6056).
// A "perpendicular" guess (from the depth, or from the stalls of a TSK section, which trees and driveways between
// the stalls mislead) beside a carriageway narrower than PERP_AISLE is angled parking (Laubova: 4.3 m, Bára).
const PERP_AISLE = 5;
const AISLE = new Set(["pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "tramvaj_v_pruhu"]);
function aisleOrient(segs) {
  segs.forEach((s, i) => {
    if (s.type !== "parkovani" || s.orient !== "kolme") return;
    for (const step of [-1, 1]) {
      let w = 0, j = i + step;
      while (segs[j] && AISLE.has(segs[j].type)) w += segs[j].width, j += step;
      if (w > 0 && w < PERP_AISLE) { s.orient = "sikme"; return; }
    }
  });
  return segs;
}

// A two-way street left with a single lane of 5 m or more (the orthophoto's lines found no centre line, or the
// estimate measured a wide roadway) has two lanes, one each way: the rule of 2 × 2.5 m from 5.0 m (Manuál C.2;
// 1000 Slovak cuts: 65 lanes over 4.6 m, most of them such). Not a zone (one paved roadway), a one-way street, a
// roundabout, a street with trams or of several roadways. The lanes keep the old one's source. ?off=dvapruhy: the A/B.
export const TWO_WAY_SPLIT = 5.0;
// Where the street's lanes are counted (OSM lanes ≥ 2, or a map's inventory a module adds to the way's tags) and parking
// stands beside the roadway, a two-way roadway of one lane is split from 4.0 m (Bára 24. 11. 2026, the USA pilot: DDOT
// counts two lanes of 8 ft on its local streets of 16 ft, and the roadway left beside the parking strips measured
// 4.25–4.55 m; all the judged cuts there had the strips). Without parking a roadway of 4.25 m is one lane (Odlehlá in
// Prague, evaluation/sjednoceni/praha). ?off=pocetpruhu: 5.0 m.
export const TWO_WAY_SPLIT_COUNTED = 4.0;
export function splitTwoWayLane(segments, tags = {}) {
  if (ORTHO_P.off?.has("dvapruhy")) return 0;
  // OSM lanes=1 on a two-way road is a single-lane road (passing places): kept.
  if (isOnewayTags(tags) || tags.junction === "roundabout" || tags.lanes === "1" || ["living_street", "pedestrian", "service", "track"].includes(tags.highway)) return 0;
  const lanes = segments.filter((s) => s.type === "pruh");
  if (lanes.length !== 1 || segments.some((s) => /^tramvaj|^bus/.test(s.type))) return 0;
  const lane = lanes[0];
  let i = segments.indexOf(lane), n = 1;
  // Where OSM counts two lanes or more, a shoulder of 1.5 m or more beside the single lane is the other lane: the
  // orthophoto took the centre line for an edge line (Hroboňova in Bratislava: lane 4.03 + shoulder 2.17 m, two-way
  // with trolley wires and no parked cars; ?off=stredcara). Narrower shoulders from edge lines stay (Bára).
  // One shoulder only, the narrower one where both are that wide (Práznovská cesta: 2.27 | 3.9 | 3.43 m).
  if ((+tags.lanes || 0) >= 2 && !ORTHO_P.off?.has("stredcara")) {
    const r = segments[i + 1]?.type === "krajnice" && segments[i + 1].width >= 1.5 ? segments[i + 1].width : Infinity;
    const l = segments[i - 1]?.type === "krajnice" && segments[i - 1].width >= 1.5 ? segments[i - 1].width : Infinity;
    if (r < Infinity && r <= l) n++;
    else if (l < Infinity) { i--; n++; }
  }
  const width = round(segments.slice(i, i + n).reduce((a, x) => a + x.width, 0));
  const beside = [segments[i - 1], segments[i + n]].some((x) => x?.type === "parkovani");
  const split = (+tags.lanes || 0) >= 2 && beside && !ORTHO_P.off?.has("pocetpruhu") ? TWO_WAY_SPLIT_COUNTED : TWO_WAY_SPLIT;
  if (!(width >= split - 1e-6)) return 0;
  const half = round(width / 2);
  const { turn, ...rest } = lane;
  const [d0, d1] = country.leftHand ? ["forward", "backward"] : ["backward", "forward"];
  segments.splice(i, n, { ...rest, width: half, dir: d0 }, { ...rest, width: round(width - half), dir: d1 });
  return 1;
}

// A lane wider than the cap of its street by a shoulder or more (the orthophoto's lines measured a one-way street
// of 5.6–6.1 m as one lane; 1000 Slovak cuts): the cap's rule after them too (Bára: lane 4 m, local 4.5 m, the rest a
// shoulder, drawn from 1 m, an estimate). The shoulder goes to the lane's kerb side (both halves where both sides
// are kerbs and the rest is two shoulders); a lane between lanes stays. Not in a zone. ?off=strop: the A/B.
const DRIVE = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "krajnice", "cyklopruh", "ochranny_pruh", "tramvaj"]);
// A tram lane narrower than a lane (3.0 m, the approved lane) cannot hold a tram: the photo put the kerb across the
// track (Josefstädter Straße in 2019: 1.97 m). It takes the rest from the sidewalk or paving beside it, which keeps
// at least 1.5 m. Returns the parts widened (?off=tramwide).
const TRAM_LANE_MIN = 3.0;
const TAKE_FROM = new Set(["chodnik", "plocha", "nezname", "zelen"]);
export function widenNarrowTrams(segments) {
  if (ORTHO_P.off?.has("tramwide")) return 0;
  let n = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (!["tramvaj_v_pruhu", "tramvaj_pruh"].includes(s.type) || s.width >= TRAM_LANE_MIN) continue;
    for (const j of [i - 1, i + 1]) {
      const nb = segments[j], need = +(TRAM_LANE_MIN - s.width).toFixed(2);
      if (!nb || !TAKE_FROM.has(nb.type) || nb.width - need < 1.5) continue;
      nb.width = +(nb.width - need).toFixed(2); s.width = TRAM_LANE_MIN; n++;
      break;
    }
  }
  return n;
}

// A pedestrian zone is a sidewalk (Bára 17. 11. 2026: "pěší zóna je vlastně chodník, měla by se kreslit s lidmi, ne
// s auty"; a living street or a shared zone keeps its lane): the lanes and shoulders of a highway=pedestrian become
// sidewalk, joined with the sidewalks beside them. Trams, bicycles and parking stay. A roadway the technical map
// really draws there stays a lane (measured; Bára: "pokud je v datech fakt pruh, tak nakreslit, ale spíš se tomu
// vyhýbat"): only the estimate's lanes go. Returns the parts changed (?off=pesizona).
const ZONE_ROAD = new Set(["pruh", "pruh_piktokoridor", "krajnice", "obsluzna"]);
// Tree pits in a sidewalk are the sidewalk (Bára 24. 11. 2026, the USA pilot: DC's maps leave the tree boxes of a brick
// sidewalk out of the sidewalk, and the app drew them as a green strip, dc-2-4 0.9 m): a green part no wider than
// TREE_PIT_MAX between a sidewalk and the roadway's kerb (a lane, parking, a cycle lane, a shoulder) whose orthophoto along
// the street (±LOOK_ALONG m) looks paved (surfaceLook's test) joins the sidewalk, its trees with it. Not without a
// photo, nor where it looks green or unclear. extent: deriveProfile's; st: lanes-ortho.js laneImage's st. Returns the
// parts joined. Off by default (the blind A/B of 24. 11. 2026, evaluation/usa/ZPRAVA.md: DC 2 : 2, Czech controls 0 : 1, a
// real grass verge read as paving); ?treepits=1 turns it on (ortho-osm.js P.treepits).
const TREE_PIT_MAX = 1.3;
const PIT_KERB = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "parkovani", "cyklopruh", "ochranny_pruh", "krajnice", "obsluzna"]);
export function stripLook(st, lo, hi) {
  if (!st?.G || !st.Y) return null;
  lo += 0.25; hi -= 0.25;
  if (!(hi - lo >= 0.3)) return null;
  const half = st.nu / 2, rows = Math.round(LOOK_ALONG / st.res), m = { G: 0, Y: 0, D: 0, L: 0, LL: 0 };
  let n = 0;
  for (let i = Math.ceil((lo - st.t0) / st.res); i <= Math.floor((hi - st.t0) / st.res); i++) {
    if (i < 0 || i >= st.nt) continue;
    for (let j = Math.max(0, Math.floor(half - rows)); j < Math.min(st.nu, half + rows); j++) {
      const k = j * st.nt + i;
      if (Number.isNaN(st.G[k])) continue;
      m.G += st.G[k]; m.Y += st.Y[k]; m.D += st.D[k]; m.L += st.L[k]; m.LL += st.L[k] * st.L[k]; n++;
    }
  }
  if (!n) return null;
  for (const c of "GYDL") m[c] /= n;
  m.SD = Math.sqrt(Math.max(0, m.LL / n - m.L * m.L));
  return looksGreen(m) ? "green" : looksPaved(m) ? "paved" : null;
}
export function treePitsAsSidewalk(segments, extent, st) {
  if (!ORTHO_P.treepits || ORTHO_P.off?.has("treepits") || !st || !extent || !segments?.length) return 0;
  let joined = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.type !== "zelen" || !(s.width <= TREE_PIT_MAX)) continue;
    const [a, b] = [segments[i - 1], segments[i + 1]];
    const walk = a?.type === "chodnik" && PIT_KERB.has(b?.type) ? i - 1 : b?.type === "chodnik" && PIT_KERB.has(a?.type) ? i + 1 : -1;
    if (walk < 0) continue;
    // The part's stretch across the cut: the segments run from the cut's high t to its low t (applyLanes).
    const lo = extent[0] + segments.slice(i + 1).reduce((x, y) => x + y.width, 0);
    if (stripLook(st, lo, lo + s.width) !== "paved") continue;
    const w = segments[walk], [first, second] = walk < i ? [w, s] : [s, w], total = first.width + second.width;
    const items = [...(first.items || []).map((it) => ({ ...it, f: +((it.f ?? 0.5) * first.width / total).toFixed(3) })),
      ...(second.items || []).map((it) => ({ ...it, f: +((first.width + (it.f ?? 0.5) * second.width) / total).toFixed(3) }))];
    w.width = +total.toFixed(2);
    if (items.length) w.items = items;
    segments.splice(i, 1);
    i = Math.max(-1, Math.min(i, walk) - 1);
    joined++;
  }
  return joined;
}

export function pedestrianZone(segments, tags = {}, { measured = false } = {}) {
  if (tags.highway !== "pedestrian" || measured || ORTHO_P.off?.has("pesizona")) return 0;
  let n = 0;
  for (const s of segments) if (ZONE_ROAD.has(s.type)) { s.type = "chodnik"; delete s.dir; delete s.lanes; n++; }
  // What the estimate left unknown in a pedestrian zone (wider paving than it dares to call anything) is the zone's
  // own walking surface too.
  for (const s of segments) if (s.type === "nezname" && s.source !== "user") { s.type = "chodnik"; n++; }
  if (!n) return 0;
  for (let i = segments.length - 1; i > 0; i--) {
    const [a, b] = [segments[i - 1], segments[i]];
    if (a.type === "chodnik" && b.type === "chodnik" && !a.items?.length && !b.items?.length) { a.width = +(a.width + b.width).toFixed(2); if (a.e !== undefined && b.e !== undefined) a.e = Math.max(a.e, b.e); segments.splice(i, 1); }
  }
  return n;
}

export function capWideLanes(segments, tags = {}) {
  if (ORTHO_P.off?.has("strop") || ["living_street", "pedestrian"].includes(tags.highway)) return 0;
  const cap = LANE_CAP[tags.highway] ?? LANE_CAP_DEFAULT;
  let n = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const lane = segments[i];
    if (lane.type !== "pruh" || !(lane.width - cap >= KRAJNICE_MIN - 1e-6)) continue;
    const nL = segments[i - 1], nR = segments[i + 1], isK = (x) => x?.type === "krajnice";
    const kerbL = !DRIVE.has(nL?.type) || isK(nL), kerbR = !DRIVE.has(nR?.type) || isK(nR);
    if (!kerbL && !kerbR) continue;
    const excess = round(lane.width - cap);
    // A shoulder already beside the lane takes the rest (no two shoulders side by side: Chorvátska, Viedenská).
    const into = isK(nR) ? nR : isK(nL) ? nL : null;
    if (into) {
      into.width = round(into.width + excess); into.source = "odhad";
      lane.width = cap; n++; continue;
    }
    const both = kerbL && kerbR && excess >= 2 * KRAJNICE_MIN - 1e-6;
    const sh = (w) => ({ type: "krajnice", width: round(w), source: "odhad" });
    const parts = both ? [sh(excess / 2), { ...lane, width: cap }, sh(excess - round(excess / 2))]
      : kerbR ? [{ ...lane, width: cap }, sh(excess)] : [sh(excess), { ...lane, width: cap }];
    segments.splice(i, 1, ...parts);
    n++;
  }
  return n;
}

// A cycle track OSM maps on its own across a part the profile only estimated (paved area, shoulder, unknown, green;
// a town's passport filler; 11 of 35 missing cycle tracks on 995 Slovak streets after fix 5: Pod Párovcami's 4.15 m
// shoulder, Wolkerova's paved area): a strip of its width (OSM width, else 2 m one-way, 2.5 m) cut out of the part about
// its line; scraps under 0.3 m go to it. Not where a bicycle part lies within 2 m. cross: [{ at (m from A), tags }].
// ?off=rezkolo: the A/B.
const CARVE_BIKE = new Set(["plocha", "krajnice", "nezname", "zelen"]);
const BIKE_PARTS = new Set(["cyklostezka", "cyklopruh", "ochranny_pruh", "chodnik_kola", "stezka_sdilena", "bus_cyklo"]);
const isCycleWay = (t) => t.highway === "cycleway" || (["path", "footway"].includes(t.highway) && t.bicycle === "designated");
export function carveCycleways(segments, cross = []) {
  if (ORTHO_P.off?.has("rezkolo")) return 0;
  let n = 0;
  for (const c of cross.filter((x) => isCycleWay(x.tags || {}))) {
    let x = 0, i = -1;
    for (let q = 0; q < segments.length; q++) { if (c.at > x && c.at < x + segments[q].width) { i = q; break; } x += segments[q].width; }
    if (i < 0) continue;
    const part = segments[i];
    // Green a map measured stays green (Ostrava, Na Jízdárně: the technical map's 2.15 m strip); a measured paved area
    // may hold the cycle track (Wolkerova: the passport's "other" area).
    if (!CARVE_BIKE.has(part.type) || (part.type === "zelen" && ["dtm", "pasport"].includes(part.source))) continue;
    let y = 0;
    const near = segments.some((s) => { const s0 = y; y += s.width; return BIKE_PARTS.has(s.type) && s0 - 2 < c.at && c.at < y + 2; });
    if (near) continue;
    const w = Math.min(part.width, parseFloat(String(c.tags.width || "").replace(",", ".")) || (c.tags.oneway === "yes" ? 2 : 2.5));
    let a = Math.max(x, Math.min(c.at - w / 2, x + part.width - w)), b = a + w;
    if (a - x < 0.3) a = x;
    if (x + part.width - b < 0.3) b = x + part.width;
    const pieces = [];
    if (a - x > 0) pieces.push({ ...part, width: round(a - x) });
    pieces.push({ type: "cyklostezka", width: round(b - a), source: "osm" });
    if (x + part.width - b > 0) pieces.push({ ...part, width: round(x + part.width - b) });
    segments.splice(i, 1, ...pieces);
    n++;
  }
  return n;
}
// A cycle track along the road that OSM maps only as a tag of the road (cycleway[:left|:right|:both]=track), not as a
// way of its own (the review of 24. 11. 2026: none of 76 cuts in Copenhagen had a cycle track, though 24 % of its streets
// tag one): on that side, just beyond the roadway's outer lane or parking, a cycle track of the OSM width (else
// country.trackWidth, else 2 m) cut out of the estimated parts there (a shoulder, sidewalk, paved area, unknown, green);
// never out of a map's own surfaces (source dtm, pasport), not where a bicycle part lies already at that edge. Its
// direction: the side's traffic, against it for opposite_track or cycleway:<side>:oneway=-1, none for oneway=no.
// along: the profile looks along the way's geometry (the way's left is the profile's left). ?off=stezkapodel: the A/B.
const TRACK_FROM = new Set(["krajnice", "chodnik", "plocha", "nezname", "zelen"]);
const OUTER_ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "parkovani"]);
export function trackAlongRoad(segments, tags = {}, along = true) {
  if (ORTHO_P.off?.has("stezkapodel")) return 0;
  const first = segments.findIndex((s) => OUTER_ROAD.has(s.type)), last = segments.findLastIndex((s) => OUTER_ROAD.has(s.type));
  if (first < 0) return 0;
  let n = 0;
  // The right side first, so the left side's indices stay as found.
  for (const [pSide, edge, step] of [["R", last, 1], ["L", first, -1]]) {
    const st = sideTags(tags, pSide === "L" ? (along ? "left" : "right") : along ? "right" : "left");
    if (!st.track) continue;
    // A bicycle part already at that edge (a lane, a track from the map or a way of OSM carved before).
    const next = segments[edge + step];
    if (BIKE_PARTS.has(segments[edge]?.type) || BIKE_PARTS.has(next?.type) || BIKE_PARTS.has(segments[edge + 2 * step]?.type)) continue;
    const want = st.trackWidth > 0.5 && st.trackWidth < 6 ? st.trackWidth : country.trackWidth || 2;
    // The run of estimated parts beyond the edge that may give way.
    let q = edge + step, got = 0;
    const taken = [];
    while (got < want && segments[q] && TRACK_FROM.has(segments[q].type) && !["dtm", "pasport"].includes(segments[q].source)) {
      taken.push(q); got += segments[q].width; q += step;
    }
    if (!taken.length || got < 0.5) continue;
    // The estimate's sidewalk there often holds the track too (the orthophoto shows no kerb between them: Børsgade,
    // Nordre Fasanvej): where no other sidewalk lies beyond, it keeps 1 m when the track still gets 0.8 m.
    const walkBeyond = segments.some((x, r) => (step > 0 ? r > taken.at(-1) : r < taken.at(-1)) && x.type === "chodnik");
    const reserve = taken.some((r) => segments[r].type === "chodnik") && !walkBeyond && got - 1 >= 0.8 ? 1 : 0;
    const width = round(Math.min(want, got - reserve));
    const rightTraffic = (pSide === "R") !== !!country.leftHand;
    const contra = tags[`cycleway:${pSide === "L" ? (along ? "left" : "right") : along ? "right" : "left"}`] === "opposite_track" || st.trackOneway === "-1";
    const dir = st.trackOneway === "no" ? undefined : (rightTraffic !== contra ? "forward" : "backward");
    const track = { type: "cyklostezka", width, source: st.trackWidth ? "osm" : "odhad", ...(dir && { dir }) };
    // What stays of the last part taken (scraps under 0.3 m go to the track).
    const lastQ = taken.at(-1), rest = round(got - width);
    const keep = rest >= 0.3 ? [{ ...segments[lastQ], width: rest }] : [];
    if (rest > 0 && rest < 0.3) track.width = round(got);
    const lo = Math.min(...taken), count = taken.length;
    segments.splice(lo, count, ...(step > 0 ? [track, ...keep] : [...keep, track]));
    n++;
  }
  return n;
}

// A roadway the orthophoto's lines cut into shoulders only, with no lane anywhere in the profile (995 Slovak streets:
// Pluhová 1.67 + 2.43 m, Topoľčianska 3.67 + 4.63 m): the shoulders side by side are the roadway, one lane under 5 m,
// a two-way street's two from 5 m, a one-way street's OSM lanes while each keeps 2.5 m. ?off=bezpruhu: the A/B.
export function lanesFromShoulders(segments, tags = {}) {
  if (ORTHO_P.off?.has("bezpruhu") || segments.some((s) => DRIVE.has(s.type) && s.type !== "krajnice")) return 0;
  let i = segments.findIndex((s) => s.type === "krajnice");
  if (i < 0) return 0;
  let j = i;
  while (segments[j + 1]?.type === "krajnice") j++;
  const width = round(segments.slice(i, j + 1).reduce((a, s) => a + s.width, 0));
  if (width < 2.5) return 0;
  const oneway = isOnewayTags(tags);
  // One-way: OSM's lanes, else lanes of about 3.5 m; each at least 2.5 m.
  const n = oneway ? Math.max(1, Math.min(+tags.lanes || Math.round(width / 3.5), Math.floor(width / 2.5))) : width >= TWO_WAY_SPLIT ? 2 : 1;
  const src = segments[i].source;
  const lanes = Array.from({ length: n }, (_, q) => ({ type: "pruh", width: round(q === n - 1 ? width - round(width / n) * (n - 1) : width / n), source: src,
    dir: oneway ? undefined : n === 2 ? ((q === 0) !== !!country.leftHand ? "backward" : "forward") : undefined }));
  segments.splice(i, j - i + 1, ...lanes);
  return 1;
}

// Tram tracks of OSM across a part the profile only estimated (a median, unknown, green or paved; Vajanského nábrežie,
// Botanická, Staničné námestie): a tram bed of TRAM_TRACK m a track about them, cut out of that part (its own part
// when the tracks fill it). ?off=rezkoleje: the A/B.
const TRAM_TRACK = 3.3, CARVE_TRAM = new Set(["delici", "nezname", "zelen", "plocha"]);
export function carveTramTracks(segments, cross = []) {
  if (ORTHO_P.off?.has("rezkoleje")) return 0;
  // One track mapped twice (two ways 0.1 m apart: Staničné námestie) is one.
  const rails = cross.filter((c) => c.tags?.railway === "tram").map((c) => c.at).sort((a, b) => a - b).filter((t, k, all) => !k || t - all[k - 1] > 1.5);
  let n = 0;
  for (let q = 0; q < segments.length; q++) {
    const part = segments[q];
    if (!CARVE_TRAM.has(part.type) || part.source === "dtm") continue;
    let x = 0;
    for (let r = 0; r < q; r++) x += segments[r].width;
    const inside = rails.filter((t) => t > x && t < x + part.width);
    if (!inside.length) continue;
    const w = Math.min(part.width, inside.length * TRAM_TRACK), mid = (inside[0] + inside.at(-1)) / 2;
    let a = Math.max(x, Math.min(mid - w / 2, x + part.width - w)), b = a + w;
    if (a - x < 0.5) a = x;
    if (x + part.width - b < 0.5) b = x + part.width;
    const beds = inside.map((_, k) => ({ type: "tramvaj", width: round((b - a) / inside.length), source: "osm", bed: "panely", bedGuess: true }));
    const pieces = [...(a - x > 0 ? [{ ...part, width: round(a - x) }] : []), ...beds, ...(x + part.width - b > 0 ? [{ ...part, width: round(x + part.width - b) }] : [])];
    segments.splice(q, 1, ...pieces);
    q += pieces.length - 1;
    n++;
  }
  return n;
}

// The OSM ways crossing the cut, with their place from the profile's end A (extent: deriveProfile's [right, left]).
export function crossFromA(osm, frame, dir, extent, way = null) {
  const normal = [-dir[1], dir[0]], half = Math.max(Math.abs(extent[0]), Math.abs(extent[1])) + 1;
  return crossings(osm, frame, [0, 0], normal, half, way).map((c) => ({ at: extent[1] - c.t, tags: c.way.tags || {} }));
}

// Fallback outside MTVU coverage: a typical profile from OSM tags.
// A path, footway, cycle way or flight of steps (a cut that caught one, not a street): one part of its kind and width
// (OSM width, else a typical one), not a road of two lanes (1000 Slovak cuts: 238 such paths drawn as 2 × 3 m lanes).
const PATH_WAYS = new Set(["footway", "path", "cycleway", "steps", "bridleway", "corridor"]);
const PATH_WIDTH = { footway: 2, path: 1.5, cycleway: 2.5, steps: 2, bridleway: 2, corridor: 2 };
function estimatePath(tags) {
  // A cycle way with walkers on it unsegregated, or a footway or path for bicycles, is shared; a cycle way alone a cycle
  // track; anything else a sidewalk-like walk.
  const shared = tags.highway === "cycleway" ? ["designated", "yes"].includes(tags.foot) && tags.segregated !== "yes" : tags.bicycle === "designated";
  const type = shared ? "stezka_sdilena" : tags.highway === "cycleway" ? "cyklostezka" : "chodnik";
  const w = parseFloat(String(tags.width || "").replace(",", "."));
  const width = w > 0.5 && w < 12 ? w : PATH_WIDTH[tags.highway] || 2;
  return { segments: [{ type, width: round(width), source: w > 0.5 && w < 12 ? "osm" : "odhad" }], edges: { left: "volno", right: "volno" }, runs: [], axisT: 0, estimate: true, path: true };
}

function estimateFromOsm(way) {
  const tags = way.tags || {};
  if (PATH_WAYS.has(tags.highway) && !ORTHO_P.off?.has("cesty")) return estimatePath(tags); // ?off=cesty: the A/B
  const oneway = isOnewayTags(tags);
  const lanes = tags.highway === "pedestrian" || tags.highway === "living_street" ? 1 : parseInt(tags.lanes, 10) || (oneway ? 1 : 2);
  const total = parseFloat(tags.width) || null;
  const segs = [];
  const sw = tags.sidewalk && tags.sidewalk !== "no" && tags.sidewalk !== "none";
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  const lw = total ? total / lanes : DEFAULT_WIDTH.pruh;
  for (let i = 0; i < lanes; i++) {
    segs.push({ type: "pruh", width: round(lw), source: total ? "osm" : "odhad", dir: oneway || (i >= lanes / 2) !== !!country.leftHand ? "forward" : "backward" });
  }
  if (sw) segs.push({ type: "chodnik", width: DEFAULT_WIDTH.chodnik, source: "odhad" });
  // estimate: no surface to derive from (app.js then tries the orthophoto and OSM, ortho-osm.js).
  return { segments: segs, edges: { left: "volno", right: "volno" }, runs: [], axisT: 0, estimate: true };
}
