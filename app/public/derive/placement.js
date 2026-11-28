// Where a cut lies: the nearest street, a saved cut, dragging along a way, keeping away from ends and junctions.
import { P as ORTHO_P } from "../ortho-osm.js";
import { MINOR, isOnewayTags, isStreet } from "./tags.js";
import { bboxOf, closestOnPolyline, inside, nearestOnLine } from "./geometry.js";
import { crossings, dualPartner } from "./crossings.js";

const END_CLEARANCE = 12; // keep the cut this far from the ends of a way, away from junctions (m)

// A street's name for comparing a searched one with OSM's: without accents, case, the kind of street and particles.
// CartoCiudad (search-es.js) gives "PASEO GRACIA" where OSM has "Passeig de Gràcia" (the review of Spain).
const STREET_WORDS = /^(calle|carrer|rua|avenida|avinguda|avda|paseo|passeig|plaza|placa|praza|ronda|camino|cami|carretera|travesia|glorieta|de|del|la|las|los|el|els|les|d|da|do|dos|das)$/;
const looseName = (n) => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STREET_WORDS.test(w)).join(" ");
const sameStreet = (a, b, loose) => a === b || (!!loose && looseName(a) === loose);

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
// street).
const PROMENADE = new Set(["footway", "path", "pedestrian", "cycleway"]);
export function streetAround(osm, frame, near, p = [0, 0]) {
  if (!near?.way || !PROMENADE.has(near.way.tags?.highway) || ["sidewalk", "crossing"].includes(near.way.tags.footway)) return near;
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
// MTVU, in Brno and abroad worse (evaluation/archive/unification/praha).
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
// and service ways that join, crossings, roundabouts and turning circles. Exported for evaluation/clicks.
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
  // A service way with no free spot at all (short, all junctions and drives): the click stays where it is, not moved to the
  // least bad spot (Bára 27. 11. 2026; evaluation/clicks: maps 32 : 13, service ways 9 : 2 and 7 : 2).
  if (best && best.score >= 1e6 && near.way.tags?.highway === "service") return near;
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
      if (q && q.dist <= PARTNER_REACH) at.set(key(g), q.p);
    }
  }
  return ways.filter((el) => !partners.has(el.id) && el.tags.name !== name && (!MINOR.has(el.tags.highway) || (el.tags.highway === "service" && !NOT_JUNCTION_SERVICE.has(el.tags.service))))
    .flatMap((el) => el.geometry.map((g) => at.get(key(g))).filter(Boolean));
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
