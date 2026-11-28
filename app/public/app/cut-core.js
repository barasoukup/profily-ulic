// The core of a cut (code-health plan, step 13b, 28. 11. 2026): from a point to the profile, with no page, no map and no
// address of its own: the street at the point, the sources of the city and the state, the orthophoto and its model,
// deriveProfile, the lanes, the law's parking, the signs, the houses' floors, the status line. The same in the browser
// (cut.js cutAt draws, logs, saves and renders what it returns) and in Node (evaluation/replay/node.mjs).
// The sources' modules ask the global fetch (in the browser the page's, in a replay the recording's); the switches are
// read by flags.js from the address (in Node: globalThis.location set before the app's modules are imported).
// What the core needs from outside comes in `deps`: onStatus (the status line while the cut loads), onCityChange (the
// city of the point became another: the page loads its drawings), wait (the timer of the model's first download).
import { refloor } from "../floors.js";
import { flag } from "../flags.js";
import { streetAround, localFrame, nearestStreet, savedStreet, snapToWay, dragAlong, placeCut, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, splitTwoWayLane, capWideLanes, pedestrianZone, widenNarrowTrams, carveCycleways, carveTramTracks, lanesFromShoulders, trackAlongRoad, crossFromA, lawNeedFor, isOnewayTags, MAX_REACH, withOsmBuildings } from "../derive.js";
import { bedOrtho } from "../ortho.js";
import { laneImage, applyLanes, orthoHereAt } from "../lanes-ortho.js";
import { orthoOsmPolys, besidePassport, trimToEnds, estimateNote, medianGapsByImage, deckSpans, bridgeRailings, bridgeWalks, P as ORTHO_P } from "../ortho-osm.js";
import { aiCut, aiKerbs, aiSurface, aiParking, parkFromAi, parkSkip, lawKerbs, layLaw, lawUnsplits, widenLaw, aiReady, onAiProgress } from "../ai-kerbs.js";
import { deriveSigns, keepDrawable } from "../signs.js";
import * as sources from "../sources.js";
import { ruianBuilding, ruianOutlines, withBuildings } from "../gis.js";
import { city, country, setCity, cityAt, closedAt, countryOfCity } from "../city.js";
import { ensurePlace } from "../late.js";
import { t as tr, mark, lang } from "../i18n.js";
import { LANES_ORTHO, AI_KERBS, NO_MAP } from "./options.js";
import "./boundaries.js"; // the boundaries of states and cities, loaded before the first cut (city.js cityAt)
import { HALF, MAX_HALF, HALF_PAD, defaultReach, WIDE_REACH, WIDE_ROADS, widerSides } from "./reach.js";

// A click this close to the cut shown (m) is placed exactly, not moved away from junctions (cutAt; Bára 27. 11. 2026).
const AGAIN_M = 200;
const AI_WAIT = 12000; // ms: the longest the first estimated cut waits for the model's download
const OSM_RADIUS = 80; // OSM read round a new cut (m); a longer dragged side reads its reach and 10 m more
// The orthophoto for the lanes (lanes-ortho.js) is read over the same ±25 m whatever the cut's ends, so dragging an
// end out into a field does not change the roadway (Bára).
const ORTHO_HALF = 25;
export let osmCache = null; // {frame, osm, way, wayPts}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One cut, without the page.
 * @param {{ lat: number, lon: number, keepWay?: boolean, bearing?: number|null, reach?: {left: number, right: number}|null,
 *   wantName?: string|null, wantWay?: number|null, shown?: object|null, navrhEdited?: boolean }} input  shown: the cut on
 *   the page now (state.cut), navrhEdited: whether its design was edited.
 * @param {{ onStatus?: (text: string) => void, onCityChange?: () => Promise<void>|void, wait?: (ms: number) => Promise<void> }} deps
 * @returns {Promise<{ status: { text: string, kind?: string }, noStreet?: object, cut?: object, stav?: object, eval?: object,
 *   view?: object, logCut?: object, dropped?: boolean }>} status: the status line the cut ends with; without `cut` the cut
 *   failed (closed, no street: noStreet is what the log gets).
 */
export async function computeCut(input, deps = {}) {
  const cx = { input, say: deps.onStatus || (() => {}), wait: deps.wait || sleep, keepWay: !!input.keepWay, bearing: input.bearing ?? null, shown: input.shown || null };
  // Another continent's borders, sources and drawings first (late.js; nothing for Europe).
  await ensurePlace(input.lat, input.lon);
  // The north of Cyprus, Italy beyond the open orthophotos: no profile (city.js closedAt).
  const closed = closedAt(input.lat, input.lon);
  if (closed) return { status: { text: closed, kind: "error" } };
  await useCity(input.lat, input.lon, deps.onCityChange);
  cx.say(tr("app.loadingOsmData"));
  if (!(await findStreet(cx))) return { status: { text: tr("app.noStreetFoundTry"), kind: "error" }, noStreet: cx.noStreet };
  await readSources(cx);
  firstProfile(cx);
  await estimate(cx);
  await besideMap(cx);
  lanesAndParking(cx);
  signsOf(cx);
  const cut = cutRecord(cx);
  await houseFacts(cx.result, cut);
  const { result, orthoOsm } = cx;
  return {
    cut, stav: { segments: result.segments, edges: result.edges }, status: statusLine(cx, cut), dropped: cx.dropped, logCut: cx.logCut,
    // For the evaluation (evaluation/holdout, the replay's light capture): the surfaces along the cut and how the profile came.
    eval: { runs: result.runs || null, extent: result.extent || null, estimate: !!(orthoOsm || result.estimate), kerbs: orthoOsm?.kerbs || null },
    view: { frame: cx.frame, normal: cx.normal, dir: cx.dir, osm: cx.osm, way: cx.near.way, polys: cx.polys, tracks: cx.tracks, lines: cx.lines, parking: cx.parking, facades: cx.facades, at: [cx.clat, cx.clon] },
  };
}

// The city of a point becomes the current one (city.js): its sources, texts and illustrations.
async function useCity(lat, lon, onCityChange) {
  await ensurePlace(lat, lon);
  const id = cityAt(lat, lon), changed = id !== city.id || countryOfCity(id) !== country;
  if (changed) setCity(id);
  // What the state decides by the place itself (countries/<ISO>.js atPlace; Germany: panel houses only in the GDR).
  if (country.atPlace) Object.assign(city, await country.atPlace(lon, lat));
  if (changed) await onCityChange?.();
}

// The street at the point, the cut placed on it and turned (A west, B east), its reach and the box of the data to read.
async function findStreet(cx) {
  const { lat, lon, wantName = null, wantWay = null } = cx.input, { keepWay, bearing, shown } = cx;
  let reach = cx.input.reach || null;
  let frame = localFrame(lat, lon);
  const radius = Math.max(OSM_RADIUS, (reach ? Math.max(reach.left, reach.right) + HALF_PAD : 0) + 10);
  if (keepWay && osmCache && osmCache.radius < radius) {
    // A side dragged beyond what was read: read again, the street's way taken from the new data.
    const more = await sources.osm(lat, lon, radius);
    osmCache = { osm: more, way: more.elements?.find((e) => e.id === osmCache.way.id) || osmCache.way, radius };
  }
  const osm = keepWay && osmCache ? osmCache.osm : await sources.osm(lat, lon, radius);
  let near;
  if (keepWay && osmCache) {
    // Along the street, onto the ways that continue it (a bridge is a way of its own; derive.js dragAlong).
    near = dragAlong(osm, frame, osmCache.way, [0, 0]);
  } else {
    // The street the link names, if it is still there (derive.js savedStreet), else the nearest one.
    near = streetAround(osm, frame, (wantWay && savedStreet(osm, frame, wantWay)) || nearestStreet(osm, frame, [0, 0], wantName));
    // A click lands the cut away from junctions and crossings; a dragged cut stays where it is put, a saved one (a link,
    // a pasted position with its azimuth) exactly where it was saved. Only the first click in an area is moved (Bára
    // 27. 11. 2026): a click within AGAIN_M of the cut shown lands where it is, only snapped onto the street and between
    // two carriageways.
    const again = bearing === null && !!shown && Math.hypot(...frame.toXY(shown.lon, shown.lat)) <= AGAIN_M;
    if (near) near = again ? centerOnStreet(osm, frame, near) : placeCut(osm, frame, near, bearing !== null);
  }
  if (!near) {
    // A click with no street found is logged too (Bára: how many try outside the Czech Republic): only where, to
    // about a kilometre, and whether there were any OSM data there at all (outside the country there are none).
    if (!keepWay) cx.noStreet = { detail: osm?.elements?.length ? "bez_ulice" : "bez_dat", city: city.id, country: city.country, lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
    return false;
  }
  // A street of two one-way carriageways is cut from its middle (e.g. the tram belt).
  if (keepWay && osmCache) near = centerOnStreet(osm, frame, near);
  // Re-centre the frame on the snapped point.
  const [clon, clat] = frame.toLonLat(...near.point);
  frame = localFrame(clat, clon);
  let dir = near.dir;
  if (bearing !== null) {
    const r = (bearing * Math.PI) / 180;
    dir = [Math.sin(r), Math.cos(r)];
  }
  osmCache = { osm, way: near.way, radius: keepWay && osmCache ? osmCache.radius : radius };
  // The usual reach for a new cut; a motorway, an expressway or a main street may reach WIDE_REACH on a side where the
  // street goes on beyond it (widerSides below; Bára: R1 in Banská Bystrica, the boulevards of Paris). A reach given or
  // kept stays as it is.
  cx.freshReach = !reach && !(keepWay && shown?.reach);
  reach = reach || (keepWay && shown?.reach) || defaultReach();
  // A new cut has A at its western end and B at the eastern (Bára): the profile is then seen
  // looking northwards, A on the left. A lies left of the street direction, so that direction
  // points north (a street running exactly east–west points east, A at the north end). A moved
  // cut keeps the way it was turned (⇄ or a dragged end), a given bearing (link, drag) is kept.
  let flip = false;
  if (bearing === null && keepWay && shown) {
    const r = (shown.bearing * Math.PI) / 180;
    flip = dir[0] * Math.sin(r) + dir[1] * Math.cos(r) < 0;
  } else if (bearing === null) flip = dir[1] < -1e-9 || (Math.abs(dir[1]) <= 1e-9 && dir[0] < 0);
  if (flip) {
    dir = [-dir[0], -dir[1]];
    reach = { left: reach.right, right: reach.left };
  }
  const normal = [-dir[1], dir[0]];
  const half = Math.min(MAX_HALF, Math.max(HALF, reach.left + HALF_PAD, reach.right + HALF_PAD));
  const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * half * k, normal[1] * half * k));
  const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
  const pad = 0.0004;
  cx.say(city.techMap ? tr("app.loadingMap", { map: city.techMap }) : tr("app.loadingOrthophoto"));
  const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
  Object.assign(cx, { frame, osm, near, clon, clat, dir, reach, normal, half, bbox });
  return true;
}

// The sources of the cut at once (the surface map, its lines, the parking, the paid zone, the tram bed's and the lanes'
// orthophoto) and what is read from them in the cut's frame.
async function readSources(cx) {
  const { bbox, frame, dir, half } = cx;
  let { osm, near } = cx;
  let polys = [], tracks = [];
  const zone = sources.zps(cx.clat, cx.clon).catch(() => undefined);
  const [m, k, pk, z, o, li] = await Promise.allSettled([
    // The zone file is local (and loaded once), so knowing the zone first costs nothing.
    sources.mtvu(bbox, near.way.tags, near.way), sources.linie(bbox), zone.then((inZone) => sources.parkovani(bbox, inZone)), zone,
    // Where OSM has tram tracks across the cut: one small image of the orthophoto for the surface of the bed
    // (ortho.js, a short timeout; without it the rules decide).
    // The state's orthophoto (countries/<ISO>.js bedOrtho; Slovakia its own, elsewhere abroad none: ČÚZK's is blank there).
    bedOrtho({ osm, frame, dir, half, source: country.bedOrtho }),
    // One image of the orthophoto across the whole cut for the road markings (lanes-ortho.js).
    LANES_ORTHO ? laneImage({ frame, dir, t0: -Math.min(half, ORTHO_HALF), t1: Math.min(half, ORTHO_HALF), source: city.laneOrtho || country.laneOrtho }) : null,
  ]);
  const ortho = o.status === "fulfilled" ? o.value : null;
  // A surface map's inventory of the street may correct the way's tags (towns/usa.js: DDOT's lane count and bike lanes),
  // on the cut's way and on its OSM element, so the rules and the roadway's split read the same.
  const wayTags = m.status === "fulfilled" && !NO_MAP ? m.value?.wayTags : null;
  if (wayTags) {
    const tagged = { ...near.way, tags: { ...near.way.tags, ...wayTags } };
    osm = { ...osm, elements: osm.elements.map((el) => (el === near.way ? tagged : el)) };
    near = { ...near, way: tagged };
  }
  if (NO_MAP && k.status === "fulfilled") k.value = {};
  if (m.status === "fulfilled") polys = mtvuPolygons(m.value, frame);
  if (m.status === "fulfilled" && !NO_MAP) polys = withOsmBuildings(polys, osm, frame, [0, 0], [-dir[1], dir[0]], half);
  else console.warn("MTVU", m.reason);
  let lines = [];
  if (k.status === "fulfilled") { tracks = trackLines(k.value, frame); lines = techLines(k.value, frame); }
  else console.warn("koleje", k.reason);
  let parking = pk.status === "fulfilled" ? esriPolygons(pk.value, frame) : [];
  if (NO_MAP) { polys = []; tracks = []; lines = []; parking = []; }
  if (pk.status !== "fulfilled") console.warn("parkovani", pk.reason);
  // Unknown (no zone file): the profile decides from the TSK parking sections around the cut.
  const inZps = z.status === "fulfilled" ? z.value : undefined;
  const laneImg = li.status === "fulfilled" ? li.value : null;
  // A map's gaps between two roadways, a median or a lawn by the orthophoto (towns/planimetrics.js gapsBetweenRoads; Toronto).
  const medianGreen = medianGapsByImage(polys, dir, laneImg?.st);
  // The same image tells grass from paving beside a roadway read from the DTM's lines (derive.js linePieces).
  const args = { center: [0, 0], dir, half, polys, osm, frame, way: near.way, tracks, parking, lines, reach: cx.reach, inZps, ortho, lanesImage: laneImg?.st, roadOnPath: !!city.roadOnPath, noParkGuess: !country.parkGuess || flag("odhadstani") === "0" || (m.status === "fulfilled" && !!m.value?.noParkGuess && !NO_MAP),
    osmParkGive: !ORTHO_P.off?.has("mapfill"),
    kerbParking: pk.status === "fulfilled" && pk.value?.kerbParking && !NO_MAP ? pk.value.kerbParking.map((p) => ({ ...p, xy: frame.toXY(p.lon, p.lat) })) : null };
  // The map's own lines and areas (Slovakia's town maps, ZBGIS) for the estimate and beside a passport.
  const kv = k.status === "fulfilled" ? k.value : null;
  const mapLines = { edges: kv?.edges || [], widths: kv?.widths || [], areas: kv?.areas || [], symbols: kv?.symbols || [] };
  Object.assign(cx, { osm, near, polys, tracks, lines, parking, m, k, pk, li, ortho, inZps, laneImg, medianGreen, args, mapLines });
}

// The profile of the map's surfaces, widened where a motorway's or a main street's sides go on (widerSides).
function firstProfile(cx) {
  const { args, near } = cx;
  let result = deriveProfile(args), reach = cx.reach;
  if (cx.freshReach) {
    // No surface map at the axis (the estimate below): a motorway's sides reach WIDE_REACH, as the estimate finds its
    // own ends; under a map, by what the map has beyond the reach (widerSides).
    if (result.estimate && WIDE_ROADS.test(near.way.tags?.highway || "")) { reach = { left: WIDE_REACH, right: WIDE_REACH }; args.reach = reach; result = deriveProfile(args); }
    else if (!result.estimate) {
      const longer = widerSides(result, reach, near.way, cx.osm, cx.frame, cx.dir, cx.polys);
      if (longer) { reach = { ...reach, ...longer }; args.reach = reach; result = deriveProfile(args); }
    }
  }
  Object.assign(cx, { result, reach });
}

// The model's reading of the orthophoto across the cut (ai-kerbs.js aiCut). The first time the library and the model
// come (about 7 MB), with their progress; past AI_WAIT the cut is drawn without it and the download goes on for the
// next cut (Bára 19. 11. 2026).
async function modelCut(cx) {
  if (aiReady()) cx.say(tr("app.loadingOrthophoto"));
  else { cx.say(tr("app.loadingKerbModelFirst")); onAiProgress((p) => cx.say(tr("app.loadingKerbModelFirstTime", { p: Math.round(100 * p) }))); }
  const job = aiCut({ osm: cx.osm, frame: cx.frame, dir: cx.dir, source: city.laneOrtho || country.laneOrtho }).catch((err) => { console.warn("AI", err); return null; });
  const cut = aiReady() ? await job : await Promise.race([job, cx.wait(AI_WAIT).then(() => null)]);
  onAiProgress(null);
  return cut;
}

// No surface of the street from the technical map (no answer, nothing here, nothing at the axis): the carriageway
// read on the orthophoto near where OSM expects it, sidewalks to the OSM buildings (ortho-osm.js; Bára 15. 11.
// 2026: better than OSM alone), all an estimate. The map's own surfaces, where there are any, stay behind it.
async function estimate(cx) {
  const { osm, frame, dir, near, polys, args, reach } = cx;
  cx.orthoOsm = null; cx.aiPark = null; cx.lastPolys = polys; cx.lastEnds = null;
  // The deck of the bridge the street is on, where OSM maps it (ortho-osm.js deckSpans): the estimate ends at its
  // edge, a railing is drawn there (bridgeRailings below).
  cx.decks = deckSpans(osm.elements, frame, dir, near.way);
  // Is there an orthophoto here at all (lanes-ortho.js orthoHereAt: Lombardy and most of Italy and Finland have none)?
  cx.orthoHere = orthoHereAt(city.laneOrtho || country.laneOrtho, cx.clon, cx.clat);
  if (!cx.result.estimate) return;
  // A trial (Bára 18. 11. 2026, ?ai=1): the carriageway's kerbs read by a trained model (ai-kerbs.js); without the
  // model or the photo the estimate's own.
  let ai = null, aiSurf = null;
  // Not where there is no orthophoto it may use (Lithuania: countries/LT.js laneOrtho "none"; Lombardy and the rest of
  // Italy and Finland outside their orthophotos' boxes; the reviews of 24. 11. 2026).
  if (AI_KERBS && cx.orthoHere) {
    const cut = await modelCut(cx);
    if (cut) { ai = (axis) => aiKerbs(cut, axis); aiSurf = aiSurface(cut); cx.aiPark = aiParking(cut); }
  }
  // The map's runs where it has surfaces but none at the axis: its sidewalks and buildings bound the estimate.
  // The houses from the state's register first, OSM's where it has none (Czechia: RÚIAN; countries/CZ.js
  // estimateBuildings; Bára 23. 11. 2026: "RÚIAN by měl mít nejlepší data"). Regression against MTVU: more metres of
  // the composition right in all four (Prague +13 and +12 m, Brno +2 and +18 m), the sidewalk metre by metre −1 pp
  // (sidewalks drawn up to the found house over green, a parking lane or a wrong kerb: the estimate's, not RÚIAN's).
  const houses = country.estimateBuildings === "ruian" && !ORTHO_P.off?.has("ruiandomy") ? await ruianOutlines(cx.bbox).catch((err) => { console.warn("RÚIAN", err.message); return []; }) : [];
  const fb = orthoOsmPolys({ ai, aiSurf, decks: cx.decks, osm: withBuildings(osm, houses, "first"), frame, dir, way: near.way, st: cx.laneImg?.st, mapRuns: cx.result.runs || [], ...cx.mapLines, stretch: cx.freshReach ? null : { A: reach.right > MAX_REACH + 0.5, B: reach.left > MAX_REACH + 0.5 } });
  if (!fb) return;
  // A field or a forest of the map (100, 200) where the estimate finds houses and sidewalks is a map not yet
  // redrawn (a new estate: Devětsilová in Prague, MTVU's farmland): it goes behind the estimate (?off=staramapa).
  const stale = (p) => (p.code === 100 || p.code === 200) && !ORTHO_P.off?.has("staramapa");
  const again = deriveProfile({ ...args, polys: [fb[0], ...polys.filter((p) => !stale(p)), ...fb.slice(1), ...polys.filter(stale)] });
  // A side without a house ends where orthoOsmPolys found (steps, a fence, the last thing of the street).
  if (!again.estimate) { cx.result = trimToEnds(again, fb.ends); cx.orthoOsm = fb; cx.lastPolys = [fb[0], ...polys, ...fb.slice(1)]; cx.lastEnds = fb.ends; }
}

// Around a surface map and beside a town's passport, read on the orthophoto as the estimate reads it.
async function besideMap(cx) {
  const { osm, frame, dir, near, polys, args, m } = cx;
  // A town's passport (Slovakia) keeps the roads it maintains: beyond it, up to a house or a fence of OSM standing
  // close by, the pieces between the town's map lines, sidewalk or green (ortho-osm.js besidePassport; Bára: Poštová,
  // 17. novembra ended at the passport's edge). The passport's own surfaces stay first.
  cx.besideUsed = null;
  // Around a surface map (Bára 24. 11. 2026, evaluation/finland/ab3: in Helsinki the map's own parts were right, what
  // the app added around them was not): what the app adds is read on the orthophoto as the estimate reads it without
  // the map, by the same model (ai-kerbs.js): beyond the map's end its kinds (besidePassport aiSurf), in the map's
  // roadway its parked cars (parkFromAi below; the law's estimate stays where the model sees nothing to decide and where
  // there is no orthophoto). In every state, Czechia's MTVU and technical maps too (evaluation/archive/mapfill-cz, 25. 11.
  // 2026: 7 of 89 cuts changed, better 6 : 2, Prague 1 : 0). ?off=mapfill: as before.
  const mapFill = !cx.orthoOsm && !cx.result.estimate && AI_KERBS && cx.orthoHere && !ORTHO_P.off?.has("mapfill");
  cx.mapCut = mapFill ? await modelCut(cx) : null;
  // In every state (evaluation/archive/unification, 24. 11. 2026: Czechia's nine passport towns, 2 of 47 cuts changed, better 1,
  // the same 1; it was off there without a measurement).
  if (cx.orthoOsm || !m.value?.passport) return;
  const { edges, symbols, areas } = cx.mapLines;
  const beside = besidePassport({ osm, frame, dir, way: near.way, st: cx.laneImg?.st, edges, symbols, areas, polys, ...(country.besideMax && { max: country.besideMax }), aiSurf: cx.mapCut ? aiSurface(cx.mapCut) : null });
  if (!beside.length) return;
  const again = deriveProfile({ ...args, polys: [...polys, ...beside] });
  if (!again.estimate) { cx.result = again; cx.besideUsed = beside.used; cx.lastPolys = [...polys, ...beside]; }
}

// The law's parking, the lanes measured on the orthophoto, the model's parked cars, the cycle tracks and tram tracks
// crossing the cut.
function lanesAndParking(cx) {
  const { near, dir, orthoOsm, aiPark, mapCut, inZps, parking, laneImg, args } = cx;
  const tags = near.way.tags, along = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
  // The law's parking waits for the lanes and the model's cars (ai-kerbs.js lawKerbs, layLaw; ?off=lawlanes).
  const lawPark = ORTHO_P.off?.has("lawlanes") ? null : orthoOsm ? aiPark : mapCut && aiParking(mapCut);
  const lawSkip = parkSkip(tags, along, inZps === true || parking.length > 0);
  const lawAt = lawPark && !lawSkip.all ? lawKerbs(cx.result) : [];
  if (lawAt.length) {
    const again = deriveProfile({ ...args, polys: cx.lastPolys, noParkGuess: true, lawAt });
    cx.result = cx.lastEnds ? trimToEnds(again, cx.lastEnds) : again;
  }
  const result = cx.result;
  // Lanes, shoulders and parking on its own paving measured on the orthophoto (lanes-ortho.js).
  const lawOneway = isOnewayTags(tags) || tags?.junction === "roundabout", lawNeed = (lanes) => lawNeedFor(lawOneway, lanes);
  const byRules = lawAt.length && lawOneway && !(+tags?.lanes >= 2) ? structuredClone({ segments: result.segments, extent: result.extent }) : null;
  cx.lanesFromOrtho = laneImg ? applyLanes(result, laneImg) : 0;
  lanesFromShoulders(result.segments, tags);
  // A one-way street the lines (or the width, lanesFromShoulders) split, the law's parking known (lawUnsplits).
  if (byRules && lawUnsplits(byRules, result, lawAt, lawPark, lawNeed, lawSkip, !orthoOsm)) { result.segments = byRules.segments; cx.lanesFromOrtho = 0; }
  splitTwoWayLane(result.segments, tags);
  capWideLanes(result.segments, tags);
  // The technical map's own roadway in a pedestrian zone stays a lane; the estimate's does not.
  pedestrianZone(result.segments, tags, { measured: !orthoOsm && !result.estimate });
  if (orthoOsm) widenNarrowTrams(result.segments);
  const lawRows = [];
  if (lawAt.length) layLaw(result, lawAt, lawPark, lawNeed, { sure: true, skip: lawSkip, rows: lawRows });
  // Parking where the model sees cars at the kerb (ai-kerbs.js parkFromAi; Bára 20. 11. 2026),.
  // Not where parking data decide: a paid zone, the city's parking sections at the cut, a side OSM tags.
  if (orthoOsm && aiPark) {
    // A strip the law estimated, gone back to the roadway, keeps the lane's cap there too (as in a map's roadway below;
    // evaluation/archive/unification, Slovakia: Royova in Bratislava, one lane of 6 m).
    const old = ORTHO_P.off?.has("parkshare");
    if (parkFromAi(result, aiPark, { ...parkSkip(tags, along, inZps === true || parking.length > 0), old }) > 0 && !old) capWideLanes(result.segments, tags);
  }
  // In a surface map's roadway (mapFill above) the same, but never over the map's own sidewalk or green (inside).
  const mapPark = mapCut && aiParking(mapCut);
  cx.mapParked = false;
  if (mapPark) {
    cx.mapParked = parkFromAi(result, mapPark, { ...parkSkip(tags, along, inZps === true || parking.length > 0), inside: true, old: ORTHO_P.off?.has("parkshare") }) > 0;
    // A strip the law estimated, gone back to its lane where no car stands, keeps the lane's cap (capWideLanes above;
    // evaluation/archive/mapfill-cz: Rosická in Brno 6.67 m lanes, Šatrova in Prague 5.62 m).
    if (cx.mapParked) capWideLanes(result.segments, tags);
  }
  if (lawAt.length) {
    layLaw(result, lawAt, lawPark, lawNeed, { inside: !orthoOsm, skip: lawSkip });
    widenLaw(result, lawRows);
  }
  // A cycle track OSM tags on the road (cycleway:<side>=track) beside its roadway (derive.js trackAlongRoad), before the
  // cycle ways mapped on their own are carved, so one track is not drawn twice. Not over a map's own surfaces (they
  // draw a cycle track where there is one; a shoulder there is the roadway's).
  if (orthoOsm || result.estimate) trackAlongRoad(result.segments, tags, along);
  if (result.extent) {
    const crossA = crossFromA(cx.osm, cx.frame, dir, result.extent, near.way);
    carveCycleways(result.segments, crossA);
    carveTramTracks(result.segments, crossA);
  }
}

// The row of traffic signs from the street's OSM tags and the parts (signs.js), the bridge's walks and railings.
function signsOf(cx) {
  const { near, dir, frame, k, result } = cx;
  // The way's right is the profile's right when the profile looks along the way's geometry.
  const alongWay = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
  // Salzburg's cadastre of signs (towns/austria.js): no stopping / no parking signs within 25 m along the street and
  // 15 m of its axis, on the way's left or right, as OSM's parking:<side>:restriction.
  let signTags = near.way.tags;
  const atSigns = k.status === "fulfilled" ? k.value?.atSigns : null;
  if (atSigns?.length) {
    const pts = near.way.geometry.map((g) => frame.toXY(g.lon, g.lat));
    signTags = { ...near.way.tags };
    for (const g of atSigns) {
      if (g.street && near.way.tags.name && g.street !== near.way.tags.name) continue;
      const p = frame.toXY(g.lon, g.lat), c = snapToWay(pts, p);
      if (!c || c.d > 15 || Math.hypot(...c.point) > 25) continue;
      const [a, b] = [pts[c.index], pts[c.index + 1] || pts[c.index]];
      const side = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 0 ? "left" : "right";
      const key = `parking:${side}:restriction`;
      if (signTags[key] !== "no_stopping") signTags[key] = g.restriction;
      signTags.__salzburg = true;
    }
  }
  // The signs of the state (null: the Czech ones, countries/default.js).
  // A railing at the bridge's edge (Bára 26. 11. 2026), in the Stav and so in the Návrh made from it (removable there
  // as any item); ?off=zabradli: none.
  bridgeWalks(result, near.way);
  bridgeRailings(result, near.way, cx.decks, cx.lastEnds);
  deriveSigns(result, signTags, { inZps: cx.inZps, alongWay, country: country.code });
  keepDrawable(result, country.code);
  Object.assign(cx, { atSigns, signTags });
}

// The cut as it is kept (state.cut, a saved file, a link): its place and turn, its street, reach and ends, and what the
// export credits beyond the city's own data (city.js creditLines).
function cutRecord(cx) {
  const { near, dir, reach, result, keepWay, bearing, clat, clon } = cx;
  const name = near.way.tags.name || near.way.tags.ref || "";
  const span = result.extent && { left: +result.extent[1].toFixed(2), right: +(-result.extent[0]).toFixed(2) };
  // A design belongs to its cut: dragging the cut (its middle or an end) keeps it, a new cut (a click, even on
  // the same street, or a link) starts the design from the new Stav, as its widths would not add up (Bára).
  cx.dropped = !keepWay && !!cx.input.navrhEdited;
  const cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name, city: city.id, reach, span, ...(streetKind(near.way.tags) && { kind: streetKind(near.way.tags) }) };
  cut.sources = creditedSources(cx);
  // No orthophoto of the state at the cut (Madeira, the Azores, most of Italy): the short data line says OSM alone (cutData).
  if (!cx.orthoHere) cut.sources.noOrtho = true;
  // The log of cuts (log.js): the cut exactly, and how it came (a click, a moved cut, a link).
  cx.logCut = {
    detail: keepWay ? "posun" : bearing !== null ? "odkaz" : "klik", city: city.id, country: city.country, street: name, highway: near.way.tags.highway,
    wayId: near.way.id, lat: +clat.toFixed(7), lon: +clon.toFixed(7), bearing: +cut.bearing.toFixed(1), reachLeft: reach.left, reachRight: reach.right,
  };
  cx.facades = ["left", "right"].map((side) => result.edges[`${side}Info`]?.point).filter(Boolean); // for the map (maplayers.js)
  return cut;
}

// What the export credits beyond the city's own data: the region of a national DTM, the DMVS standing in for the city's
// map, the orthophoto of a tram bed, a town's map, the sources of the houses are added later (houseFacts).
function creditedSources(cx) {
  const { m, k, pk, ortho, orthoOsm, besideUsed, laneImg, lanesFromOrtho, result, atSigns, signTags } = cx;
  const mv = m.status === "fulfilled" ? m.value : null;
  const bedOwn = ortho && country.bedOrtho !== "cuzk" ? country.bedOrtho : null; // the tram bed read on a state's own orthophoto
  return { ...(mv?.region && { region: mv.region }), ...(mv?.skTown && { skTown: mv.skTown }), ...(mv?.atTown && { atTown: mv.atTown }), ...(mv?.deTown && { deTown: mv.deTown }), ...(mv?.chAv && { chAv: mv.chAv }), ...(mv?.nlBgt && { nlBgt: true }), ...(mv?.beTown && { beTown: mv.beTown }), ...(mv?.plTown && { plTown: mv.plTown }), ...(mv?.frTown && { frTown: mv.frTown }), ...(mv?.esTown && { esTown: mv.esTown }), ...(mv?.itTown && { itTown: mv.itTown }), ...(mv?.eeTown && { eeTown: mv.eeTown }), ...(mv?.fiTown && { fiTown: mv.fiTown }), ...(mv?.ltTown && { ltTown: mv.ltTown }), ...(mv?.cityMap && { cityMap: mv.cityMap }), ...(mv?.usDdot && { usDdot: true }), ...(mv?.sfCurb && { sfCurb: true }), ...(mv?.ltGrpk && { ltGrpk: true }), ...(pk.status === "fulfilled" && pk.value?.parisParking && { parisParking: true }), ...(pk.status === "fulfilled" && pk.value?.dkParking && pk.value.features?.length && { dkParking: true }), ...(atSigns?.length && signTags.__salzburg && { atSigns: "salzburg" }), ...(country.signs.ogl && result.segments?.some((s) => s.signs?.some((x) => country.signs.ogl.has(country.signs.file(x, s)))) && { ukSigns: true }), ...(mv?.skTm && { skTm: true }), ...(orthoOsm?.kerbs?.why && Object.values(orthoOsm.kerbs.why).includes("ai") && { aiKerbs: true }), ...((orthoOsm?.edges || besideUsed?.edges) && k.value?.edgesFrom && { skEdges: k.value.edgesFrom }), ...((orthoOsm?.areas || orthoOsm?.widthFrom === "zbgis" || besideUsed?.zbgis) && { zbgis: true }), ...(mv?.dmvs && { dmvs: true }), ...(typeof mv?.passport === "string" && { passport: mv.passport }), ...(((ortho && !bedOwn) || ((lanesFromOrtho || orthoOsm?.image) && laneImg?.source === "cuzk")) && { ortho: true }), ...((lanesFromOrtho || orthoOsm?.image) && laneImg && laneImg.source !== "cuzk" ? { orthoCity: laneImg.source } : bedOwn ? { orthoCity: bedOwn } : (besideUsed?.image || cx.mapParked || cx.medianGreen) && laneImg && { orthoCity: laneImg.source }) };
}

// Floors of the buildings at both ends from IPR "Podlažnosti" (OSM building:levels as fallback), and what the other
// registers tell of them (their credits on the cut's sources).
async function houseFacts(result, cut) {
  await Promise.all(["left", "right"].map(async (side) => {
    const info = result.edges[`${side}Info`];
    if (!info?.point) return;
    try {
      const [lon, lat] = info.point;
      const p = refloor(await sources.podlaznost(lat, lon), info);
      // Floors only estimated from a height (ZBGIS, Slovakia) yield to OSM's building:levels; the use stays.
      if (p.fromHeight && info.levels) Object.assign(info, { iprKind: p.kind, area: p.area });
      else if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, roofType: p.roofType, iprKind: p.kind, newBuild: p.newBuild, area: p.area, src: "ipr" });
      ruianFacts(info, p);
      houseCredits(cut.sources, info, p);
      // What the building is for (ZBGIS, Slovakia), where OSM says no more than "a building".
      if (p.type && (!info.type || info.type === "yes")) info.type = p.type;
    } catch {}
    // Prague (IPR) and Brno (KAM) give floors and roofs but not the year: the year, walls and use of the house come
    // from RÚIAN of ČÚZK as in the towns (Bára 16. 11. 2026; one request to ČÚZK, none more to IPR).
    if (city.ruianYear && !info.built) {
      try { ruianFacts(info, await ruianBuilding(info.point[1], info.point[0])); } catch {}
    }
    // The age of the area (a default for the building's look, overruled by what is known of the house).
    try { const y = await sources.vyvoj(info.point[1], info.point[0]); if (y) info.period = y; } catch {}
    // The house's place, rounded to a metre, for the regional looks of a state (house-looks.js: Paris, the old towns).
    info.at = info.point.map((v) => +v.toFixed(5));
    delete info.point;
  }));
}

// The register that told of a house, for the credits of the exports too.
function houseCredits(s, info, p) {
  // The foral cadastre of a Spanish province that told of the house (towns/spain-foral.js), for the credits.
  if (p.foral) s.esForal = p.foral;
  // The national Catastro that told of the house (towns/spain.js), for the credits of the exports too.
  if (p.catastro) s.esCatastro = true;
  // The cadastre of Slovenia that told of the house (towns/slovenia.js).
  if (p.gurs) s.siGurs = true;
  // The buildings of Helsinki or of Ryhti (towns/finland.js).
  if (p.fiBuild) s.fiBuild = s.fiBuild && s.fiBuild !== p.fiBuild ? "both" : p.fiBuild;
  // The buildings of Copenhagen or Aarhus (towns/denmark.js).
  // The buildings of ETAK (towns/estonia.js).
  if (p.etak) s.eeEtak = true;
  // The buildings of the DLS (towns/cyprus.js).
  if (p.dls) s.cyDls = true;
  // (Toronto's heights only where they gave the floors or the garage, not under OSM's own count.)
  if (p.caHouse && (info.src === "ipr" || p.garage)) s.caHouse = true;
  // Washington's assessment tables that told of the house (towns/usa.js).
  if (p.usCama) s.usCama = true;
  // New York's building footprints, where they gave the floors, the year or the garage (towns/newyork.js).
  if (p.nycHouse && (info.src === "ipr" || p.garage || p.built)) s.nycHouse = true;
  // San Francisco's building heights (towns/sanfrancisco.js), as Toronto's.
  if (p.sfHouse && (info.src === "ipr" || p.garage)) s.sfHouse = true;
  // Boston's basemap that counted the floors (towns/boston.js).
  if (p.usHouse && info.src === "ipr") s.usHouse = p.usHouse;
  if (p.dkBuild) s.dkBuild = s.dkBuild && s.dkBuild !== p.dkBuild ? "both" : p.dkBuild;
}

// What the cut lacks because a source did not answer (sources.js outage), and the status line the cut ends with. An
// estimate stays marked as one, also when restored from storage or a file (cut.note).
function statusLine(cx, cut) {
  const { m, k, pk, li, orthoOsm, result, orthoHere } = cx, mv = m.status === "fulfilled" ? m.value : null;
  // The profile made without the map (ortho-osm.js): where its kerbs come from. A blank or missing orthophoto (outside
  // its coverage, no answer): OSM's; ?orto=0 asks for none.
  // The orthophoto did not answer (Bára 16. 11. 2026: a failed service made a rougher profile without a word; 39 of
  // 1000 Slovak cuts in one run): said, with a hint to click again.
  const orthoDown = LANES_ORTHO && li.status === "rejected";
  // A service that needs a key (Denmark's token, keys.js) and has none, or turned it away: no orthophoto at all, said
  // so (not "try again").
  const orthoNoKey = orthoDown && li.reason?.noKey;
  const orthoNote = orthoNoKey && (orthoOsm || result.estimate) ? tr("app.orthophotoNotAvailableApp")
    : orthoDown && (orthoOsm || result.estimate) ? tr("app.orthophotoDidNotAnswer")
    // The houses' source as the estimate used them: RÚIAN in Czechia, the GRPK with OSM in Lithuania, else OSM
    // (ortho-osm.js houseSources; the backlog of 23. 11. 2026: it said OSM in Czechia too).
    : !orthoOsm ? "" : estimateNote(orthoOsm, LANES_ORTHO && orthoHere, tr, (xs) => new Intl.ListFormat(lang, { type: "conjunction" }).format(xs));
  const out = sources.outage({ surfaces: m, lines: k, parking: pk }, undefined, { fallback: orthoNote, orthoEstimate: country.orthoEstimate && orthoHere });
  const failed = (what) => { out.text = `${out.text ? out.text + " " : ""}${what} ${tr("common.tryClickingAgainMoment")}`; out.error = true; };
  // Copenhagen's kerb lines or parking areas did not answer (towns/denmark.js dkFailed; the review of 24. 11. 2026: said
  // nothing before): the cut is made without them, said so.
  if ([k, pk].some((x) => x.status === "fulfilled" && x.value?.dkFailed)) failed(tr("app.copenhagenRoadwayEdgesParking"));
  // DDOT's inventory did not answer (towns/usa.js): the map's surfaces without it, said so.
  if (mv?.ddotFailed && !NO_MAP) failed(tr("app.washingtonStreetInventoryDdot"));
  // SFMTA's curb zones did not answer (towns/sanfrancisco.js): the kerbs without their parking, said so.
  if (mv?.sfCurbFailed && !NO_MAP) failed(tr("app.sanFranciscoKerbsideParking"));
  // The map itself has an intersection at the cut's centre (towns/usa.js).
  if (mv?.junction && !NO_MAP) result.junction = true;
  // A town's passport answered but not at the axis (Slovakia): the profile is still the estimate.
  cut.note = out.note || (orthoOsm && city.abroad ? (country.orthoEstimate && orthoHere && !orthoNoKey ? mark("note.estimateOrthophotoOsm") : mark("note.onlyEstimateOsm")) : "");
  const junctionNote = tr("app.cutProbablyRunsThrough");
  const droppedNote = tr("app.newCutProposalStarts");
  // With the profile made without the map, the other notes come after its own (a junction, a design started anew).
  const extra = orthoOsm ? [result.junction && junctionNote, cx.dropped && droppedNote].filter(Boolean).map((x) => " " + x).join("") : "";
  // The map has surfaces here, none at the axis (the outage says nothing of it): that comes first.
  const axisNote = (orthoOsm || (orthoDown && result.estimate)) && !out.text.includes(orthoNote) ? (city.abroad ? "" : tr("app.surfaceMapHasNo") + " ") + orthoNote + (out.text ? " " + out.text : "") : "";
  const kind = out.error ? "error" : undefined;
  if (axisNote) return { text: axisNote + extra, kind };
  if (out.text) return { text: out.text + extra, kind };
  if (cx.dropped) return { text: tr("app.newCutProposalStarts") };
  return { text: result.notice ? result.notice : result.junction ? tr("app.cutProbablyRunsThrough") : "" };
}

// The kind of street the norms of a city may go by (rules.js; San Francisco's sidewalks): an alley, another service road.
const streetKind = (tags) => (tags?.highway !== "service" ? null : tags.service === "alley" ? "alley" : "service");
// What RÚIAN tells of a house (gis.js ruianLook) on its edge info: the year it was completed and what its walls are of,
// its use (a family house, a farmstead, offices, a garage).
function ruianFacts(info, p) {
  if (p.built) info.built = p.built;
  if (p.panel) info.panel = 1;
  if (p.solid) info.solid = 1; // walls of bricks, stone, monolith or wood (not a panel house)
  if (p.house) info.house = 1;
  if (p.farm) info.farm = 1; // a farmstead (a village house)
  if (p.office) info.office = 1; // offices, authorities, schools, hotels
  if (p.material && !info.material) info.material = p.material; // the walls (a wooden house in Finland: house-looks.js)
  if (p.garage) info.garage = 1;
}
