// Plzeň: the city's GIS (ags.plzen.eu) answers the browser directly (CORS). Its technical map (DTM in the
// JVF DTM model of the DMVS) covers the whole ground, as Prague's MTVU does: roadways, sidewalks, cycle
// paths, parking areas, tram beds, buildings, yards, gardens and green. Its lines give fences, walls,
// railings and guard rails. The city's passports add trees, benches, bike stands and bollards, and its 3D
// buildings (2024, joined with RÚIAN) the floors, heights, age and walls of a house.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; the shapes are those of Prague's answers, see
// queries.js) and app.js its base maps. See towns/jihlava.js.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, ruianBuilding, RUIAN_HALL, RUIAN_LOW, insideRings, metres } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const PL = "https://ags.plzen.eu/arcgis/rest/services";
const PL_ZPS = `${PL}/GIS_DTM/GIS_DTM_ZPS_kesovana`;
const PL_BUILDINGS = `${PL}/GIS_3D_budovy/GIS_Budovy_Plzen_2024_1/FeatureServer/5/query`;
const PL_PASPORT = `${PL}/GIS_Pasporty`;
// The city's services turn S-JTSK into WGS 84 by another transformation (15965) than ČÚZK, IPR and the
// orthophotos (S_JTSK_To_WGS_1984_1, 1623): about 12 m off OSM in Plzeň. A layer's query takes
// datumTransformation=1623 (for its input geometry too). The query of many layers at once and the 3D
// buildings do not take it: their input is moved into the service's WGS 84 by the difference and their
// answers back (it varies by under 0.2 m over the city).
const PL_DATUM = { datumTransformation: 1623 };
const PL_SHIFT = [5.36e-5, 1.01e-4]; // lon, lat
const plQuery = (url, params) => query(url, { ...params, ...PL_DATUM });
const none = () => ({ features: [] });

const shiftBox = (bbox) => bbox.split(",").map(Number).map((v, i) => v + PL_SHIFT[i % 2]).join(",");
const unshift = (pts) => pts.map(([x, y]) => [x - PL_SHIFT[0], y - PL_SHIFT[1]]);

// Areas of the technical map → MTVU codes, or a function of the attributes giving one (as
// tools/build_dtm_brno.py reads the DTM of the region). The first area holding a point wins: tram beds,
// cycle paths, parking and sidewalks lie on top of the roadway, bridge decks (a roadway and its sidewalks
// alike) come last. Roofs over the ground (zastřešení) and underground objects are left out.
const PL_SURFACES = [
  [307, 705], // tramvajová dráha
  [300, 703], // cyklostezka
  [301, 704], // parkoviště, odstavná plocha
  [299, 702], [302, 702], [304, 702], [311, 702], [338, 702], [342, 702], // chodník, ostrůvek, nájezd, nástupiště, schodiště, rampa
  [298, 701], [318, 701], // provozní plocha pozemní komunikace, mostní váha
  // Přidružená plocha: in Plzeň mostly verges and dirt tracks beside a road (test č. 21), not its roadway:
  // paved as a paved area, else as green (estimate).
  [305, (a) => (a.PrevazujiciPovrch >= 1 && a.PrevazujiciPovrch <= 4 ? 1003 : [402, true])],
  [297, 601], // budova
  [339, 602], [337, 602], [340, 602], [343, 602], [344, 602], [345, 602], [347, 602], [334, 602], [336, 602],
  [348, 1003], // stavba pro zpevnění povrchu: a paved strip (Jateční, between the roadway and the path), not a wall
  [349, 603], // dvůr, nádvoří
  [303, 401], [358, 401], [359, 401], // dělicí pás, udržovaná zeleň, vegetační mísa
  [310, 402], [326, 402], [335, 402], [357, 402], // příkop, násep; meliorační žlab; hřbitov; nevyužívaná plocha
  [355, 300], [356, 200], [354, 100], // zahrada, les, zemědělská plocha
  [352, 501], [325, 501], [353, 502], [319, 502], [320, 502], [321, 503],
  [333, 901], [312, 1003], [306, 1100], // hřiště, manipulační plocha, železnice
  [313, 700], // plocha mostní konstrukce
];
const FIELDS = { 305: "PrevazujiciPovrch" };
// Lines of the technical map → the codes of IPR's line layer (derive.js FENCE_LINES and the rest).
const PL_LINES = { 69: 61210, 71: 71210, 88: 71210, 78: 61530, 87: 71522 }; // plot, zeď, protihluková stěna, zábradlí, svodidlo
const LEVEL = "UrovenUmisteniObjektuZPS";

// One query of the feature service for all areas and lines of a cut (surfaces and lines ask with the same
// envelope), objects under the ground left out.
const zpsCache = new Map();
const zps = (bbox) => {
  if (!zpsCache.has(bbox)) {
    if (zpsCache.size > 8) zpsCache.delete(zpsCache.keys().next().value);
    const ids = [...PL_SURFACES.map(([id]) => id), ...Object.keys(PL_LINES).map(Number)];
    const layerDefs = JSON.stringify(ids.map((layerId) => ({ layerId, where: `${LEVEL} IS NULL OR ${LEVEL} >= 0`, outFields: [LEVEL, FIELDS[layerId]].filter(Boolean).join(",") })));
    zpsCache.set(bbox, query(`${PL_ZPS}/FeatureServer/query`, { ...envelope(shiftBox(bbox)), layerDefs }).then((json) => {
      const byId = {};
      for (const l of json.layers || []) {
        for (const f of l.features || []) {
          if (f.geometry?.rings) f.geometry.rings = f.geometry.rings.map(unshift);
          if (f.geometry?.paths) f.geometry.paths = f.geometry.paths.map(unshift);
        }
        byId[l.id] = l;
      }
      return byId;
    }).catch((err) => { zpsCache.delete(bbox); throw err; }));
  }
  return zpsCache.get(bbox);
};

// Areas above the ground (bridges, footbridges) carry LEVEL 1: derive.js uses them only for a cut on a bridge.
async function surfaces(bbox) {
  const layers = await zps(bbox);
  const codeOf = (code, a) => (typeof code === "function" ? code(a) : code);
  const json = asMtvu(PL_SURFACES.map(([id, code]) => [layers[id], (a) => (a[LEVEL] > 0 ? null : codeOf(code, a))]), MTVU_LABELS);
  const above = asMtvu(PL_SURFACES.map(([id, code]) => [layers[id], (a) => (a[LEVEL] > 0 ? codeOf(code, a) : null)]), MTVU_LABELS);
  for (const f of above.features) f.attributes.LEVEL = 1;
  return { features: [...json.features, ...above.features] };
}

async function lines(bbox) {
  const layers = await zps(bbox);
  const features = [];
  for (const [id, code] of Object.entries(PL_LINES)) {
    for (const f of layers[id]?.features || []) {
      if (f.geometry?.paths && !(f.attributes?.[LEVEL] > 0)) features.push({ attributes: { CTMTP_KOD: code }, geometry: f.geometry });
    }
  }
  return { features };
}

// OSM around a point plus the city's trees (not felled), benches, bike stands and bollards where OSM has
// no such thing nearby. Each layer: its url, the fields it needs, its filter and the OSM tags of a feature.
const PL_POINTS = [
  [`${PL_PASPORT}/GIS_PAS_ZEL_ukazka/FeatureServer/1/query`, "POKACEN", "POKACEN IS NULL OR POKACEN = 0", () => ({ natural: "tree" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/6/query`, "OBJECTID", "1=1", () => ({ amenity: "bench" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/9/query`, "OBJECTID", "1=1", () => ({ amenity: "bicycle_parking" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/44/query`, "OBJECTID", "1=1", () => ({ barrier: "bollard" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, radius);
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...PL_POINTS.map(([url, outFields, where]) => plQuery(url, { ...envelope(box), outFields, where }).catch(none)),
  ]);
  return addPoints(o, pts, PL_POINTS.map(([, , , tagsOf]) => tagsOf), "Plzeň", lat);
}

// Parking: the parking areas of the technical map are among the surfaces (704); the city's layer of
// parking places (GIS_Doprava) holds car parks off the street only, and Plzeň publishes no stalls. What
// it publishes are its paid parking zones (open data, CC0; tools/build_zony_plzen.mjs → data/plzen/zony.json):
// lines along the street axes, each with the zone's name or „Vyhrazené stání“. A zone says that people pay
// there, not where the cars stand: its streets get strips of parallel parking (2.0 m) along the curbs of
// the roadway the line runs in, as an estimate, where the technical map or OSM has no parking already.
let zonesFile;
const zones = () => (zonesFile ||= fetch("data/plzen/zony.json").then((r) => (r.ok ? r.json() : { lines: [] })).catch(() => ({ lines: [] })));

const STALL = 2.0; // m, parallel parking (CLAUDE.md)
const STEP = 2.0; // m between the points where the roadway is measured across
const REACH = 15; // m, the farthest a curb is looked for from the zone line
// Curbs with parking for a roadway this wide: what is left must carry the traffic, 3.0 m for a one-way
// street (one lane), 5.0 m for a two-way one (2 × 2.5 m, the narrowed two-way street of the Manual C.2
// for low traffic, as the profile reads such streets). Both curbs if two strips fit beside it, one if one
// does, none on a narrower roadway.
export function zoneCurbs(width, oneway) {
  const traffic = oneway ? 3.0 : 5.0;
  return width >= traffic + 2 * STALL ? 2 : width >= traffic + STALL ? 1 : 0;
}

const STREET_PARKING = new Set(["street_side", "lane", "on_kerb", "half_on_kerb", "shoulder"]);
const ONEWAY_ROADS = /^(primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$/;
async function parking(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const lat = (y0 + y1) / 2, lon = (x0 + x1) / 2;
  const [kx, ky] = metres(lat);
  const [z, layers, o] = await Promise.all([
    zones(), zps(bbox), osmTiles(lat, lon, Math.hypot((x1 - x0) * kx, (y1 - y0) * ky) / 2).catch(() => ({ elements: [] })),
  ]);
  const near = (line) => line.some(([x, y]) => x > x0 - 0.002 && x < x1 + 0.002 && y > y0 - 0.0015 && y < y1 + 0.0015);
  const lines = (z.lines || []).filter(([, line]) => near(line));
  if (!lines.length) return none();
  // Local metres around the box; the areas as rings in metres with their boxes.
  const xy = ([x, y]) => [(x - lon) * kx, (y - lat) * ky];
  const ll = ([x, y]) => [lon + x / kx, lat + y / ky];
  const areas = (features) => features.map((f) => {
    const rings = f.rings.map((r) => r.map(xy));
    const xs = rings[0].map((q) => q[0]), ys = rings[0].map((q) => q[1]);
    return { rings, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
  const isIn = (as, [x, y]) => as.some((a) => x >= a.box[0] && x <= a.box[2] && y >= a.box[1] && y <= a.box[3] && insideRings(a.rings, x, y));
  const level0 = (id) => (layers[id]?.features || []).filter((f) => f.geometry?.rings && !(f.attributes?.[LEVEL] > 0)).map((f) => ({ rings: f.geometry.rings }));
  // The roadway with its tram beds: a curb is where both end (a tram in the middle is no curb).
  const roadway = areas([...level0(298), ...level0(318), ...level0(307)]);
  const bays = areas([
    ...level0(301),
    ...(o.elements || []).filter((e) => e.type === "area" && e.tags?.amenity === "parking" && STREET_PARKING.has(e.tags.parking))
      .map((e) => ({ rings: [e.geometry, ...(e.holes || [])].map((r) => r.map((g) => [g.lon, g.lat])) })),
  ]);
  // OSM street axes, for one-way streets.
  const axes = (o.elements || []).filter((e) => e.type === "way" && ONEWAY_ROADS.test(e.tags?.highway || "") && e.geometry?.length > 1)
    .map((e) => ({ tags: e.tags, pts: e.geometry.map((g) => xy([g.lon, g.lat])) }));
  const nearestAxis = ([px, py]) => {
    let best = null;
    for (const a of axes) {
      for (let i = 1; i < a.pts.length; i++) {
        const [ax, ay] = a.pts[i - 1], [bx, by] = a.pts[i], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
        const d = Math.hypot(ax + t * dx - px, ay + t * dy - py);
        if (!best || d < best.d) best = { d, dir: [dx, dy], tags: a.tags };
      }
    }
    return best && best.d < 8 ? best : null;
  };
  const edge = (p, n, sign) => {
    let t = 0;
    while (t < REACH && isIn(roadway, [p[0] + n[0] * sign * (t + 0.25), p[1] + n[1] * sign * (t + 0.25)])) t += 0.25;
    return t < REACH ? t : null;
  };

  const features = [];
  for (const [name, line] of lines) {
    const special = /vyhrazen/i.test(name);
    const pts = line.map(xy);
    // Points along the line every STEP m, with the direction there.
    const samples = [];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay);
      if (len < 0.01) continue;
      const d = [(bx - ax) / len, (by - ay) / len];
      for (let s = 0; s < len; s += STEP) samples.push({ p: [ax + d[0] * s, ay + d[1] * s], d });
      if (i === pts.length - 1) samples.push({ p: [bx, by], d });
    }
    // One-way: the OSM axis at the middle of the line (its direction against the line's).
    const mid = samples[Math.floor(samples.length / 2)];
    const axis = mid && nearestAxis(mid.p);
    const ow = axis?.tags?.oneway;
    const oneway = ow === "yes" || ow === "1" || ow === "-1";
    const same = axis ? Math.sign(axis.dir[0] * mid.d[0] + axis.dir[1] * mid.d[1]) || 1 : 1;
    const along = same * (ow === "-1" ? -1 : 1);
    // A curb where OSM says no parking (parking:left/right/both=no, separate) stays free (Koperníkova č. 18).
    const t = axis?.tags || {};
    const noParking = (side) => /^(no|none|separate)$/.test(t[`parking:${side}`] || t[`parking:lane:${side}`] || t["parking:both"] || t["parking:lane:both"] || "");
    const free = { 1: noParking(same > 0 ? "left" : "right"), [-1]: noParking(same > 0 ? "right" : "left") };
    // Per point: the curbs (+1 left of the line, -1 right) that get a strip.
    const marks = samples.map(({ p, d }) => {
      const n = [-d[1], d[0]];
      if (!isIn(roadway, p)) return { p, n, sides: [] };
      const left = edge(p, n, 1), right = edge(p, n, -1);
      if (left === null || right === null) return { p, n, sides: [] };
      const k = zoneCurbs(left + right, oneway);
      // A reserved stall keeps to the nearer curb; one strip of a zone goes on the right in the direction
      // of travel (as people park in a one-way street; for a two-way one, right of the line).
      const sides = special ? (k ? [left < right ? 1 : -1] : []) : k === 2 ? [1, -1] : k === 1 ? [-along] : [];
      const dist = { 1: left, [-1]: right };
      return {
        p, n, sides: sides.filter((s) => !free[s]).filter((s) => {
          const c = [p[0] + n[0] * s * dist[s], p[1] + n[1] * s * dist[s]];
          // A parking bay behind the curb or on the roadway at the curb: parking is there already.
          return !isIn(bays, [c[0] + n[0] * s * 0.75, c[1] + n[1] * s * 0.75]) && !isIn(bays, [c[0] - n[0] * s * 1.0, c[1] - n[1] * s * 1.0]);
        }), dist,
      };
    });
    // Runs of points with a strip on the same curb → a polygon from the curb STALL m into the roadway.
    for (const s of [1, -1]) {
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          const outer = run.map(({ p, n, dist }) => [p[0] + n[0] * s * dist[s], p[1] + n[1] * s * dist[s]]);
          const inner = run.map(({ p, n, dist }) => [p[0] + n[0] * s * (dist[s] - STALL), p[1] + n[1] * s * (dist[s] - STALL)]);
          const ring = [...outer, ...inner.reverse()];
          ring.push(ring[0]);
          features.push({ attributes: { KIND: special ? "specialni" : "useky", PS_ZPS: 0, ODHAD: 1, ZONA: name }, geometry: { rings: [ring.map(ll)] } });
        }
        run = [];
      };
      for (const m of marks) (m.sides.includes(s) ? run.push(m) : flush());
      flush();
    }
  }
  return { features };
}

// A house from the city's 3D buildings (2024): RÚIAN's floors, use, completion and walls, and the measured
// heights of eaves and ridge above the ground. Without floors in RÚIAN they come from the height of the
// eaves; a ridge well above the eaves is a pitched roof (IPR's roof codes: 1 pitched, 3 flat). A point
// outside the 3D buildings asks RÚIAN itself.
const FLOOR = 3.2; // m, eaves height per floor
const PANEL = new Set([4, 41, 42, 43]);
async function podlaznost(lat, lon) {
  let a;
  try {
    const json = await query(PL_BUILDINGS, {
      geometry: `${lon + PL_SHIFT[0]},${lat + PL_SHIFT[1]}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
      outFields: "RELVYS_BUD,RELVYS_OKA,PocetPodlazi,ZpusobVyuzitiKod,Dokonceni,DruhKonstrukceKod,ZastavenaPlocha", returnGeometry: "false", f: "json",
    });
    a = json.features?.[0]?.attributes;
  } catch {}
  if (!a) return ruianBuilding(lat, lon);
  const { RELVYS_BUD: ridge, RELVYS_OKA: eaves, PocetPodlazi: floors, ZpusobVyuzitiKod: use, Dokonceni: built, DruhKonstrukceKod: walls, ZastavenaPlocha: area } = a;
  const pitched = ridge > 0 && eaves > 0 && ridge - eaves > 1.5;
  const byHeight = eaves > 2 ? Math.max(1, Math.round(eaves / FLOOR)) : 0;
  // RÚIAN counts floors in the roof too: those above the eaves are drawn as roof floors.
  const cornice = floors ? (pitched && byHeight ? Math.min(floors, byHeight) : floors) : byHeight;
  if (!cornice) return ruianBuilding(lat, lon);
  return {
    cornice, roof: floors ? floors - cornice : 0, total: floors || cornice, roofType: ridge > 0 && eaves > 0 ? (pitched ? 1 : 3) : undefined,
    kind: RUIAN_HALL.has(use) ? 3 : RUIAN_LOW.has(use) ? 6 : undefined, newBuild: false, area: area || undefined,
    built: built ? new Date(built).getUTCFullYear() : undefined, panel: PANEL.has(walls) || undefined,
  };
}

export const sources = { osm, surfaces, lines, parking, podlaznost };

// Base maps: the city's orthophoto (2024, 5 cm) and technical map, drawn by its GIS as export images in
// Web Mercator (its caches are in S-JTSK; ArcgisExport asks for the transformation 1623), with OSM
// underneath for the zoomed-out view.
const ORTHO = `${PL}/Orto_2024_5cm_RGB_mimoveg/MapServer`;
export function maps({ ArcgisExport, BIG_TILES, osm: osmLayer, cuzk }) {
  return {
    base: {
      "Ortofoto Plzeň": [osmLayer(1), new ArcgisExport("", { service: ORTHO, minZoom: 15, maxZoom: 21, ...BIG_TILES, attribution: "ortofoto 2024 © Statutární město Plzeň" })],
      "Technická mapa": [osmLayer(0.5), new ArcgisExport("", { service: `${PL_ZPS}/MapServer`, minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "technická mapa © Statutární město Plzeň" })],
      "Ortofoto ČÚZK": [cuzk()],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto Plzeň",
    lines: new ArcgisExport("", { service: `${PL}/GIS_DTM/GIS_DTM_ZPS_linie_body/MapServer`, maxZoom: 21, minZoom: 17, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © Statutární město Plzeň" }),
  };
}

// The orthophoto for the evaluation (evaluation/run_brno.mjs): an ArcGIS export in Web Mercator.
export const ortho = { service: `${ORTHO}/export`, datum: 1623 };
