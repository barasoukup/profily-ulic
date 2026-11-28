// Surface polygons of the sources (OSM parking, platforms, gardens; IPR/Esri/MTVU surfaces; OSM buildings).
import { isBuilding } from "../types.js";
import { P as ORTHO_P } from "../ortho-osm.js";
import { isPlatformTags } from "./tags.js";
import { bboxOf, inside } from "./geometry.js";
import { ORIENT } from "./parking.js";

// On-street parking mapped in OSM as separate areas (parking:both=separate). The technical
// map often draws these bays as sidewalk, so they take priority over MTVU.
export const OSM_PARKING = 9704;
const STREET_PARKING = new Set(["street_side", "lane", "on_kerb", "half_on_kerb", "shoulder"]);

export const OSM_PLATFORM = 9800;

// Parking sections of the paid parking zones (TSK): surveyed, so they win over OSM parking areas.
export const TSK_PARKING = 9705;
export const TSK_CODES = { useky: 9705, ztp: 9706, zasobovani: 9707, specialni: 9708 };
export const isTskParking = (c) => c >= 9705 && c <= 9708;
// Restaurant terraces (OSM leisure=outdoor_seating areas) take part of a sidewalk.
export const OSM_OUTDOOR = 9900;

export function osmPlatformPolygons(osm, frame) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && isPlatformTags(el.tags))
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      return { code: OSM_PLATFORM, rings, bbox: bboxOf(rings[0]) };
    });
}

export function osmOutdoorPolygons(osm, frame) {
  return (osm.elements || [])
    .filter((el) => el.type === "area" && el.tags?.leisure === "outdoor_seating")
    .map((el) => {
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
      return { code: OSM_OUTDOOR, rings, bbox: bboxOf(rings[0]) };
    });
}

// Street parking of another road (a side road beside the street, Generála Šišky: Bára "to už je ale mimo profil ulice,
// na boční cestě") is not the street's: an area whose nearest drivable road is not the street (nor of its name) is
// left out.
const DRIVABLE = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|road)(_link)?$/;
function ownParking(el, osm, frame, way) {
  if (!way) return true;
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
// parallel ones on both sides). A lot is deeper: mean depth (area / length) up to STRIP_DEPTH_MAX and long.
const STRIP_DEPTH_MAX = 6, STRIP_ELONGATION = 3, STRIP_LENGTH_MIN = 30; // m: a shorter bit is a lot's corner
function isParkingStrip(el, frame) {
  if (!(el.tags.parking === "surface" || el.tags.parking === undefined) || el.holes?.length) return false;
  const ring = el.geometry.map((g) => frame.toXY(g.lon, g.lat));
  let area = 0, length = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length; j++) length = Math.max(length, Math.hypot(ring[i][0] - ring[j][0], ring[i][1] - ring[j][1]));
  const depth = Math.abs(area) / 2 / (length || 1);
  return depth <= STRIP_DEPTH_MAX && length >= Math.max(STRIP_ELONGATION * depth, STRIP_LENGTH_MIN);
}
export function osmParkingPolygons(osm, frame, way) {
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
