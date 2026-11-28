// The cut: from a point on the map to the profile (the sources of the city and the state, the orthophoto, deriveProfile, the signs,
// the houses' floors) and into state.cut and state.stav. Everything that is not the DOM is the core meant for step 13b (a cut in Node);
// what still touches the page or the map is marked "DOM (13b)".
import { refloor } from "../floors.js";
import { flag } from "../flags.js";
import { streetAround, localFrame, nearestStreet, savedStreet, snapToWay, dragAlong, placeCut, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, splitTwoWayLane, capWideLanes, pedestrianZone, widenNarrowTrams, carveCycleways, carveTramTracks, lanesFromShoulders, trackAlongRoad, crossFromA, lawNeedFor, isOnewayTags, MAX_REACH, withOsmBuildings } from "../derive.js";
import { bedOrtho } from "../ortho.js";
import { laneImage, applyLanes, orthoHereAt } from "../lanes-ortho.js";
import { orthoOsmPolys, besidePassport, trimToEnds, estimateNote, medianGapsByImage, deckSpans, bridgeRailings, bridgeWalks, P as ORTHO_P } from "../ortho-osm.js";
import { aiCut, aiKerbs, aiSurface, aiParking, parkFromAi, parkSkip, lawKerbs, layLaw, lawUnsplits, widenLaw, aiReady, onAiProgress } from "../ai-kerbs.js";
import { deriveSigns, keepDrawable } from "../signs.js";
import { loadSprites } from "../profile.js";
import * as sources from "../sources.js";
import { ruianBuilding, ruianOutlines, withBuildings } from "../gis.js";
import { parseCutHash } from "../share.js";
import { city, country, setCity, cityAt, closedAt, countryOfCity } from "../city.js";
import { ensurePlace } from "../late.js";
import { log } from "../log.js";
import { t as tr, mark, lang } from "../i18n.js";
import { dataLayers } from "./basemaps.js";
import { drawCut, showCutInfo, drawMtvu } from "./cutview.js";
import { resetHistory } from "./history.js";
import { logEdits } from "./logging.js";
import { map } from "./map.js";
import { LANES_ORTHO, AI_KERBS, NO_MAP } from "./options.js";
import { HALF, MAX_HALF, HALF_PAD, defaultReach, WIDE_REACH, WIDE_ROADS, widerSides, cutEnds, cutSpan } from "./reach.js";
import { state, $, status, streetName, render } from "./state.js";
import { save } from "./storage.js";
import { loadUnderground } from "./underground.js";

// A click this close to the cut shown (m) is placed exactly, not moved away from junctions (cutAt; Bára 27. 11. 2026).
const AGAIN_M = 200;
const AI_WAIT = 12000; // ms: the longest the first estimated cut waits for the model's download
const OSM_RADIUS = 80; // OSM read round a new cut (m); a longer dragged side reads its reach and 10 m more
// The city of a point becomes the current one (city.js): its sources, texts and illustrations.
async function useCity(lat, lon) {
  await ensurePlace(lat, lon);
  const id = cityAt(lat, lon), changed = id !== city.id || countryOfCity(id) !== country;
  if (changed) setCity(id);
  // What the state decides by the place itself (countries/<ISO>.js atPlace; Germany: panel houses only in the GDR).
  if (country.atPlace) Object.assign(city, await country.atPlace(lon, lat));
  if (changed) await loadSprites(); // DOM (13b)
}
// The orthophoto for the lanes (lanes-ortho.js) is read over the same ±25 m whatever the cut's ends, so dragging an
// end out into a field does not change the roadway (Bára).
const ORTHO_HALF = 25;
export let osmCache = null; // {frame, osm, way, wayPts}
export async function cutAt(lat, lon, keepWay = false, bearing = null, reach = null, wantName = null, wantWay = null) {
  logEdits(); // what was done with the previous cut, before it is replaced // side effect (13b)
  try {
    // Another continent's borders, sources and drawings first (late.js; nothing for Europe).
    await ensurePlace(lat, lon);
    // The north of Cyprus, Italy beyond the open orthophotos: no profile (city.js closedAt).
    const closed = closedAt(lat, lon);
    if (closed) return status(closed, "error"); // DOM (13b)
    await useCity(lat, lon);
    status(tr("app.loadingOsmData")); // DOM (13b)
    let frame = localFrame(lat, lon);
    const radius = Math.max(OSM_RADIUS, (reach ? Math.max(reach.left, reach.right) + HALF_PAD : 0) + 10);
    if (keepWay && osmCache && osmCache.radius < radius) {
      // A side dragged beyond what was read: read again, the street's way taken from the new data.
      const more = await sources.osm(lat, lon, radius);
      osmCache = { osm: more, way: more.elements?.find((e) => e.id === osmCache.way.id) || osmCache.way, radius };
    }
    let osm = keepWay && osmCache ? osmCache.osm : await sources.osm(lat, lon, radius);
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
      const again = bearing === null && !!state.cut && Math.hypot(...frame.toXY(state.cut.lon, state.cut.lat)) <= AGAIN_M;
      if (near) near = again ? centerOnStreet(osm, frame, near) : placeCut(osm, frame, near, bearing !== null);
    }
    if (!near) {
      // A click with no street found is logged too (Bára: how many try outside the Czech Republic): only where, to
      // about a kilometre, and whether there were any OSM data there at all (outside the country there are none).
      if (!keepWay) log("bez_ulice", { detail: osm?.elements?.length ? "bez_ulice" : "bez_dat", city: city.id, country: city.country, lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 }); // side effect (13b)
      return status(tr("app.noStreetFoundTry"), "error"); // DOM (13b)
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
    const freshReach = !reach && !(keepWay && state.cut?.reach);
    reach = reach || (keepWay && state.cut?.reach) || defaultReach();
    // A new cut has A at its western end and B at the eastern (Bára): the profile is then seen
    // looking northwards, A on the left. A lies left of the street direction, so that direction
    // points north (a street running exactly east–west points east, A at the north end). A moved
    // cut keeps the way it was turned (⇄ or a dragged end), a given bearing (link, drag) is kept.
    let flip = false;
    if (bearing === null && keepWay && state.cut) {
      const r = (state.cut.bearing * Math.PI) / 180;
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
    status(city.techMap ? tr("app.loadingMap", { map: city.techMap }) : tr("app.loadingOrthophoto")); // DOM (13b)
    const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
    let polys = [], tracks = [];
    const zone = sources.zps(clat, clon).catch(() => undefined);
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
    const args = { center: [0, 0], dir, half, polys, osm, frame, way: near.way, tracks, parking, lines, reach, inZps, ortho, lanesImage: laneImg?.st, roadOnPath: !!city.roadOnPath, noParkGuess: !country.parkGuess || flag("odhadstani") === "0" || (m.status === "fulfilled" && !!m.value?.noParkGuess && !NO_MAP),
      osmParkGive: !ORTHO_P.off?.has("mapfill"),
      kerbParking: pk.status === "fulfilled" && pk.value?.kerbParking && !NO_MAP ? pk.value.kerbParking.map((p) => ({ ...p, xy: frame.toXY(p.lon, p.lat) })) : null };
    let result = deriveProfile(args);
    if (freshReach) {
      // No surface map at the axis (the estimate below): a motorway's sides reach WIDE_REACH, as the estimate finds its
      // own ends; under a map, by what the map has beyond the reach (widerSides).
      if (result.estimate && WIDE_ROADS.test(near.way.tags?.highway || "")) { reach = { left: WIDE_REACH, right: WIDE_REACH }; args.reach = reach; result = deriveProfile(args); }
      else if (!result.estimate) {
        const longer = widerSides(result, reach, near.way, osm, frame, dir, polys);
        if (longer) { reach = { ...reach, ...longer }; args.reach = reach; result = deriveProfile(args); }
      }
    }
    // No surface of the street from the technical map (no answer, nothing here, nothing at the axis): the carriageway
    // read on the orthophoto near where OSM expects it, sidewalks to the OSM buildings (ortho-osm.js; Bára 15. 11.
    // 2026: better than OSM alone), all an estimate. The map's own surfaces, where there are any, stay behind it.
    let orthoOsm = null, aiPark = null, lastPolys = polys, lastEnds = null;
    // The deck of the bridge the street is on, where OSM maps it (ortho-osm.js deckSpans): the estimate ends at its
    // edge, a railing is drawn there (bridgeRailings below).
    const decks = deckSpans(osm.elements, frame, dir, near.way);
    // The model's reading of the orthophoto across the cut (ai-kerbs.js aiCut). The first time the library and the model
    // come (about 7 MB), with their progress; past AI_WAIT the cut is drawn without it and the download goes on for the
    // next cut (Bára 19. 11. 2026).
    const modelCut = async () => {
      if (aiReady()) status(tr("app.loadingOrthophoto")); // DOM (13b)
      else { status(tr("app.loadingKerbModelFirst")); onAiProgress((p) => status(tr("app.loadingKerbModelFirstTime", { p: Math.round(100 * p) }))); } // DOM (13b)
      const job = aiCut({ osm, frame, dir, source: city.laneOrtho || country.laneOrtho }).catch((err) => { console.warn("AI", err); return null; });
      const cut = aiReady() ? await job : await Promise.race([job, new Promise((r) => setTimeout(() => r(null), AI_WAIT))]);
      onAiProgress(null);
      return cut;
    };
    // Is there an orthophoto here at all (lanes-ortho.js orthoHereAt: Lombardy and most of Italy and Finland have none)?
    const orthoHere = orthoHereAt(city.laneOrtho || country.laneOrtho, clon, clat);
    if (result.estimate) {
      // A trial (Bára 18. 11. 2026, ?ai=1): the carriageway's kerbs read by a trained model (ai-kerbs.js); without the
      // model or the photo the estimate's own.
      let ai = null, aiSurf = null;
      // Not where there is no orthophoto it may use (Lithuania: countries/LT.js laneOrtho "none"; Lombardy and the rest of
      // Italy and Finland outside their orthophotos' boxes; the reviews of 24. 11. 2026).
      if (AI_KERBS && orthoHere) {
        const cut = await modelCut();
        if (cut) { ai = (axis) => aiKerbs(cut, axis); aiSurf = aiSurface(cut); aiPark = aiParking(cut); }
      }
      // The map's runs where it has surfaces but none at the axis: its sidewalks and buildings bound the estimate.
      // The houses from the state's register first, OSM's where it has none (Czechia: RÚIAN; countries/CZ.js
      // estimateBuildings; Bára 23. 11. 2026: "RÚIAN by měl mít nejlepší data"). Regression against MTVU: more metres of
      // the composition right in all four (Prague +13 and +12 m, Brno +2 and +18 m), the sidewalk metre by metre −1 pp
      // (sidewalks drawn up to the found house over green, a parking lane or a wrong kerb: the estimate's, not RÚIAN's).
      const houses = country.estimateBuildings === "ruian" && !ORTHO_P.off?.has("ruiandomy") ? await ruianOutlines(bbox).catch((err) => { console.warn("RÚIAN", err.message); return []; }) : [];
      const fb = orthoOsmPolys({ ai, aiSurf, decks, osm: withBuildings(osm, houses, "first"), frame, dir, way: near.way, st: laneImg?.st, mapRuns: result.runs || [], edges: k.status === "fulfilled" ? k.value?.edges || [] : [], widths: k.status === "fulfilled" ? k.value?.widths || [] : [], areas: k.status === "fulfilled" ? k.value?.areas || [] : [], symbols: k.status === "fulfilled" ? k.value?.symbols || [] : [], stretch: freshReach ? null : { A: reach.right > MAX_REACH + 0.5, B: reach.left > MAX_REACH + 0.5 }  });
      if (fb) {
        // A field or a forest of the map (100, 200) where the estimate finds houses and sidewalks is a map not yet
        // redrawn (a new estate: Devětsilová in Prague, MTVU's farmland): it goes behind the estimate (?off=staramapa).
        const stale = (p) => (p.code === 100 || p.code === 200) && !ORTHO_P.off?.has("staramapa");
        const again = deriveProfile({ ...args, polys: [fb[0], ...polys.filter((p) => !stale(p)), ...fb.slice(1), ...polys.filter(stale)] });
        // A side without a house ends where orthoOsmPolys found (steps, a fence, the last thing of the street).
        if (!again.estimate) { result = trimToEnds(again, fb.ends); orthoOsm = fb; lastPolys = [fb[0], ...polys, ...fb.slice(1)]; lastEnds = fb.ends; }
      }
    }
    // A town's passport (Slovakia) keeps the roads it maintains: beyond it, up to a house or a fence of OSM standing
    // close by, the pieces between the town's map lines, sidewalk or green (ortho-osm.js besidePassport; Bára: Poštová,
    // 17. novembra ended at the passport's edge). The passport's own surfaces stay first.
    let besideUsed = null;
    // Around a surface map (Bára 24. 11. 2026, evaluation/finland/ab3: in Helsinki the map's own parts were right, what
    // the app added around them was not): what the app adds is read on the orthophoto as the estimate reads it without
    // the map, by the same model (ai-kerbs.js): beyond the map's end its kinds (besidePassport aiSurf), in the map's
    // roadway its parked cars (parkFromAi below; the law's estimate stays where the model sees nothing to decide and where
    // there is no orthophoto). In every state, Czechia's MTVU and technical maps too (evaluation/archive/mapfill-cz, 25. 11.
    // 2026: 7 of 89 cuts changed, better 6 : 2, Prague 1 : 0). ?off=mapfill: as before.
    const mapFill = !orthoOsm && !result.estimate && AI_KERBS && orthoHere && !ORTHO_P.off?.has("mapfill");
    const mapCut = mapFill ? await modelCut() : null;
    // In every state (evaluation/archive/unification, 24. 11. 2026: Czechia's nine passport towns, 2 of 47 cuts changed, better 1,
    // the same 1; it was off there without a measurement).
    if (!orthoOsm && m.value?.passport) {
      const beside = besidePassport({ osm, frame, dir, way: near.way, st: laneImg?.st, edges: k.status === "fulfilled" ? k.value?.edges || [] : [], symbols: k.status === "fulfilled" ? k.value?.symbols || [] : [], areas: k.status === "fulfilled" ? k.value?.areas || [] : [], polys, ...(country.besideMax && { max: country.besideMax }), aiSurf: mapCut ? aiSurface(mapCut) : null });
      if (beside.length) {
        const again = deriveProfile({ ...args, polys: [...polys, ...beside] });
        if (!again.estimate) { result = again; besideUsed = beside.used; lastPolys = [...polys, ...beside]; }
      }
    }
    // The law's parking waits for the lanes and the model's cars (ai-kerbs.js lawKerbs, layLaw; ?off=lawlanes).
    const lawPark = ORTHO_P.off?.has("lawlanes") ? null : orthoOsm ? aiPark : mapCut && aiParking(mapCut);
    const lawSkip = parkSkip(near.way.tags, !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0, inZps === true || parking.length > 0);
    const lawAt = lawPark && !lawSkip.all ? lawKerbs(result) : [];
    if (lawAt.length) {
      const again = deriveProfile({ ...args, polys: lastPolys, noParkGuess: true, lawAt });
      result = lastEnds ? trimToEnds(again, lastEnds) : again;
    }
    // Lanes, shoulders and parking on its own paving measured on the orthophoto (lanes-ortho.js).
    const lawOneway = isOnewayTags(near.way.tags) || near.way.tags?.junction === "roundabout", lawNeed = (lanes) => lawNeedFor(lawOneway, lanes);
    const byRules = lawAt.length && lawOneway && !(+near.way.tags?.lanes >= 2) ? structuredClone({ segments: result.segments, extent: result.extent }) : null;
    let lanesFromOrtho = laneImg ? applyLanes(result, laneImg) : 0;
    lanesFromShoulders(result.segments, near.way.tags);
    // A one-way street the lines (or the width, lanesFromShoulders) split, the law's parking known (lawUnsplits).
    if (byRules && lawUnsplits(byRules, result, lawAt, lawPark, lawNeed, lawSkip, !orthoOsm)) { result.segments = byRules.segments; lanesFromOrtho = 0; }
    splitTwoWayLane(result.segments, near.way.tags);
    capWideLanes(result.segments, near.way.tags);
    // The technical map's own roadway in a pedestrian zone stays a lane; the estimate's does not.
    pedestrianZone(result.segments, near.way.tags, { measured: !orthoOsm && !result.estimate });
    if (orthoOsm) widenNarrowTrams(result.segments);
    const lawRows = [];
    if (lawAt.length) layLaw(result, lawAt, lawPark, lawNeed, { sure: true, skip: lawSkip, rows: lawRows });
    // Parking where the model sees cars at the kerb (ai-kerbs.js parkFromAi; Bára 20. 11. 2026),.
    // Not where parking data decide: a paid zone, the city's parking sections at the cut, a side OSM tags.
    if (orthoOsm && aiPark) {
      const along = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
      // A strip the law estimated, gone back to the roadway, keeps the lane's cap there too (as in a map's roadway below;
      // evaluation/archive/unification, Slovakia: Royova in Bratislava, one lane of 6 m).
      const old = ORTHO_P.off?.has("parkshare");
      if (parkFromAi(result, aiPark, { ...parkSkip(near.way.tags, along, inZps === true || parking.length > 0), old }) > 0 && !old) capWideLanes(result.segments, near.way.tags);
    }
    // In a surface map's roadway (mapFill above) the same, but never over the map's own sidewalk or green (inside).
    const mapPark = mapCut && aiParking(mapCut);
    let mapParked = false;
    if (mapPark) {
      const along = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
      mapParked = parkFromAi(result, mapPark, { ...parkSkip(near.way.tags, along, inZps === true || parking.length > 0), inside: true, old: ORTHO_P.off?.has("parkshare") }) > 0;
      // A strip the law estimated, gone back to its lane where no car stands, keeps the lane's cap (capWideLanes above;
      // evaluation/archive/mapfill-cz: Rosická in Brno 6.67 m lanes, Šatrova in Prague 5.62 m).
      if (mapParked) capWideLanes(result.segments, near.way.tags);
    }
    if (lawAt.length) {
      layLaw(result, lawAt, lawPark, lawNeed, { inside: !orthoOsm, skip: lawSkip });
      widenLaw(result, lawRows);
    }
    // A cycle track OSM tags on the road (cycleway:<side>=track) beside its roadway (derive.js trackAlongRoad), before the
    // cycle ways mapped on their own are carved, so one track is not drawn twice. Not over a map's own surfaces (they
    // draw a cycle track where there is one; a shoulder there is the roadway's).
    if (orthoOsm || result.estimate) trackAlongRoad(result.segments, near.way.tags, !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0);
    if (result.extent) {
      const crossA = crossFromA(osm, frame, dir, result.extent, near.way);
      carveCycleways(result.segments, crossA);
      carveTramTracks(result.segments, crossA);
    }
    // The row of traffic signs from the street's OSM tags and the parts (signs.js).
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
    bridgeRailings(result, near.way, decks, lastEnds);
    deriveSigns(result, signTags, { inZps, alongWay, country: country.code });
    keepDrawable(result, country.code);
    const name = near.way.tags.name || near.way.tags.ref || "";
    const span = result.extent && { left: +result.extent[1].toFixed(2), right: +(-result.extent[0]).toFixed(2) };
    // A design belongs to its cut: dragging the cut (its middle or an end) keeps it, a new cut (a click, even on
    // the same street, or a link) starts the design from the new Stav, as its widths would not add up (Bára).
    const dropped = !keepWay && state.navrhEdited;
    if (!keepWay) state.navrhEdited = false;
    state.cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name, city: city.id, reach, span, ...(streetKind(near.way.tags) && { kind: streetKind(near.way.tags) }) };
    // What the export credits beyond the city's own data (city.js creditLines): the region of a national DTM,
    // the DMVS standing in for the city's map, the orthophoto of a tram bed.
    const mv = m.status === "fulfilled" ? m.value : null;
    const bedOwn = ortho && country.bedOrtho !== "cuzk" ? country.bedOrtho : null; // the tram bed read on a state's own orthophoto
    state.cut.sources = { ...(mv?.region && { region: mv.region }), ...(mv?.skTown && { skTown: mv.skTown }), ...(mv?.atTown && { atTown: mv.atTown }), ...(mv?.deTown && { deTown: mv.deTown }), ...(mv?.chAv && { chAv: mv.chAv }), ...(mv?.nlBgt && { nlBgt: true }), ...(mv?.beTown && { beTown: mv.beTown }), ...(mv?.plTown && { plTown: mv.plTown }), ...(mv?.frTown && { frTown: mv.frTown }), ...(mv?.esTown && { esTown: mv.esTown }), ...(mv?.itTown && { itTown: mv.itTown }), ...(mv?.eeTown && { eeTown: mv.eeTown }), ...(mv?.fiTown && { fiTown: mv.fiTown }), ...(mv?.ltTown && { ltTown: mv.ltTown }), ...(mv?.cityMap && { cityMap: mv.cityMap }), ...(mv?.usDdot && { usDdot: true }), ...(mv?.sfCurb && { sfCurb: true }), ...(mv?.ltGrpk && { ltGrpk: true }), ...(pk.status === "fulfilled" && pk.value?.parisParking && { parisParking: true }), ...(pk.status === "fulfilled" && pk.value?.dkParking && pk.value.features?.length && { dkParking: true }), ...(atSigns?.length && signTags.__salzburg && { atSigns: "salzburg" }), ...(country.signs.ogl && result.segments?.some((s) => s.signs?.some((x) => country.signs.ogl.has(country.signs.file(x, s)))) && { ukSigns: true }), ...(mv?.skTm && { skTm: true }), ...(orthoOsm?.kerbs?.why && Object.values(orthoOsm.kerbs.why).includes("ai") && { aiKerbs: true }), ...((orthoOsm?.edges || besideUsed?.edges) && k.value?.edgesFrom && { skEdges: k.value.edgesFrom }), ...((orthoOsm?.areas || orthoOsm?.widthFrom === "zbgis" || besideUsed?.zbgis) && { zbgis: true }), ...(mv?.dmvs && { dmvs: true }), ...(typeof mv?.passport === "string" && { passport: mv.passport }), ...(((ortho && !bedOwn) || ((lanesFromOrtho || orthoOsm?.image) && laneImg?.source === "cuzk")) && { ortho: true }), ...((lanesFromOrtho || orthoOsm?.image) && laneImg && laneImg.source !== "cuzk" ? { orthoCity: laneImg.source } : bedOwn ? { orthoCity: bedOwn } : (besideUsed?.image || mapParked || medianGreen) && laneImg && { orthoCity: laneImg.source }) };
    // No orthophoto of the state at the cut (Madeira, the Azores, most of Italy): the short data line says OSM alone (cutData).
    if (!orthoHere) state.cut.sources.noOrtho = true;
    // The log of cuts (log.js): the cut exactly, and how it came (a click, a moved cut, a link).
    log("rez", { // side effect (13b)
      detail: keepWay ? "posun" : bearing !== null ? "odkaz" : "klik", city: city.id, country: city.country, street: name, highway: near.way.tags.highway,
      wayId: near.way.id, lat: +clat.toFixed(7), lon: +clon.toFixed(7), bearing: +state.cut.bearing.toFixed(1), reachLeft: reach.left, reachRight: reach.right,
    });
    const facades = ["left", "right"].map((side) => result.edges[`${side}Info`]?.point).filter(Boolean); // for the map (maplayers.js)
    // Floors of the buildings at both ends from IPR "Podlažnosti" (OSM building:levels as fallback).
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
        // The foral cadastre of a Spanish province that told of the house (towns/spain-foral.js), for the credits.
        if (p.foral) state.cut.sources.esForal = p.foral;
        // The national Catastro that told of the house (towns/spain.js), for the credits of the exports too.
        if (p.catastro) state.cut.sources.esCatastro = true;
        // The cadastre of Slovenia that told of the house (towns/slovenia.js).
        if (p.gurs) state.cut.sources.siGurs = true;
        // The buildings of Helsinki or of Ryhti (towns/finland.js).
        if (p.fiBuild) state.cut.sources.fiBuild = state.cut.sources.fiBuild && state.cut.sources.fiBuild !== p.fiBuild ? "both" : p.fiBuild;
        // The buildings of Copenhagen or Aarhus (towns/denmark.js).
        // The buildings of ETAK (towns/estonia.js).
        if (p.etak) state.cut.sources.eeEtak = true;
        // The buildings of the DLS (towns/cyprus.js).
        if (p.dls) state.cut.sources.cyDls = true;
        // (Toronto's heights only where they gave the floors or the garage, not under OSM's own count.)
        if (p.caHouse && (info.src === "ipr" || p.garage)) state.cut.sources.caHouse = true;
        // Washington's assessment tables that told of the house (towns/usa.js).
        if (p.usCama) state.cut.sources.usCama = true;
        // New York's building footprints, where they gave the floors, the year or the garage (towns/newyork.js).
        if (p.nycHouse && (info.src === "ipr" || p.garage || p.built)) state.cut.sources.nycHouse = true;
        // San Francisco's building heights (towns/sanfrancisco.js), as Toronto's.
        if (p.sfHouse && (info.src === "ipr" || p.garage)) state.cut.sources.sfHouse = true;
        // Boston's basemap that counted the floors (towns/boston.js).
        if (p.usHouse && info.src === "ipr") state.cut.sources.usHouse = p.usHouse;
        if (p.dkBuild) state.cut.sources.dkBuild = state.cut.sources.dkBuild && state.cut.sources.dkBuild !== p.dkBuild ? "both" : p.dkBuild;
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
    state.stav = { segments: result.segments, edges: result.edges };
    // For the evaluation (evaluation/holdout, the replay's light capture): the surfaces along the cut and how the profile came.
    globalThis.__profilyEval = { runs: result.runs || null, extent: result.extent || null, estimate: !!(orthoOsm || result.estimate), kerbs: orthoOsm?.kerbs || null }; // side effect (13b)
    state.computed = structuredClone(state.stav); // the detection, for the log of corrections
    state.stavEdited = false;
    if (!state.navrhEdited) state.navrh = structuredClone(state.stav);
    state.selected = null;
    state.edge = null;
    state.fixing = false;
    state.fixBase = null;
    resetHistory(); // DOM (13b)
    drawCut(cutEnds(frame, normal, cutSpan(state.cut))); // DOM (13b)
    showCutInfo(); // DOM (13b)
    drawMtvu(polys); // DOM (13b)
    dataLayers.draw({ frame, dir, osm, way: near.way, polys, tracks, lines, parking, span: cutSpan(state.cut), facades }); // DOM (13b)
    if (!map.getBounds().contains([clat, clon])) map.panTo([clat, clon]); // DOM (13b)
    // What the cut lacks because a source did not answer (sources.js outage). An estimate stays marked as one,
    // also when restored from storage or a file.
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
    // Copenhagen's kerb lines or parking areas did not answer (towns/denmark.js dkFailed; the review of 24. 11. 2026: said
    // nothing before): the cut is made without them, said so.
    if ([k, pk].some((x) => x.status === "fulfilled" && x.value?.dkFailed)) {
      out.text = `${out.text ? out.text + " " : ""}${tr("app.copenhagenRoadwayEdgesParking")} ${tr("common.tryClickingAgainMoment")}`;
      out.error = true;
    }
    // DDOT's inventory did not answer (towns/usa.js): the map's surfaces without it, said so.
    if (mv?.ddotFailed && !NO_MAP) {
      out.text = `${out.text ? out.text + " " : ""}${tr("app.washingtonStreetInventoryDdot")} ${tr("common.tryClickingAgainMoment")}`;
      out.error = true;
    }
    // SFMTA's curb zones did not answer (towns/sanfrancisco.js): the kerbs without their parking, said so.
    if (mv?.sfCurbFailed && !NO_MAP) {
      out.text = `${out.text ? out.text + " " : ""}${tr("app.sanFranciscoKerbsideParking")} ${tr("common.tryClickingAgainMoment")}`;
      out.error = true;
    }
    // The map itself has an intersection at the cut's centre (towns/usa.js).
    if (mv?.junction && !NO_MAP) result.junction = true;
    // A town's passport answered but not at the axis (Slovakia): the profile is still the estimate.
    state.cut.note = out.note || (orthoOsm && city.abroad ? (country.orthoEstimate && orthoHere && !orthoNoKey ? mark("note.estimateOrthophotoOsm") : mark("note.onlyEstimateOsm")) : "");
    // The heading is the street only (Bára 16. 11. 2026); where the data come from is said under it (#profile-sub).
    $("#street-name").textContent = streetName(state.cut); // DOM (13b)
    const junctionNote = tr("app.cutProbablyRunsThrough");
    const droppedNote = tr("app.newCutProposalStarts");
    // With the profile made without the map, the other notes come after its own (a junction, a design started anew).
    const extra = orthoOsm ? [result.junction && junctionNote, dropped && droppedNote].filter(Boolean).map((x) => " " + x).join("") : "";
    // The map has surfaces here, none at the axis (the outage says nothing of it): that comes first.
    const axisNote = (orthoOsm || (orthoDown && result.estimate)) && !out.text.includes(orthoNote) ? (city.abroad ? "" : tr("app.surfaceMapHasNo") + " ") + orthoNote + (out.text ? " " + out.text : "") : "";
    if (axisNote) status(axisNote + extra, out.error ? "error" : undefined); // DOM (13b)
    else if (out.text) status(out.text + extra, out.error ? "error" : undefined); // DOM (13b)
    else if (dropped) status(tr("app.newCutProposalStarts")); // DOM (13b)
    else status(result.notice ? result.notice // DOM (13b)
      : result.junction ? tr("app.cutProbablyRunsThrough") : "");
    save(); // side effect (13b)
    state.underground = null;
    loadUnderground(); // DOM (13b)
    render(); // DOM (13b)
    // On a phone the profile is under the map: bring it into view.
    if (matchMedia("(max-width: 760px)").matches) $("#profile-head").scrollIntoView({ behavior: "smooth", block: "start" }); // DOM (13b)
  } catch (err) {
    console.error(err);
    status(tr("app.dataCouldNotLoaded", { error: err.message }), "error"); // DOM (13b)
  }
}
// Paste "lat, lon · azimut N°" (or a #rez= link) to jump to a cut.
export function parseCut(text) {
  const m = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)(?:[^\d]+?(\d+(?:\.\d+)?)\s*°?)?/);
  const h = parseCutHash(text);
  if (h) return h;
  if (!m) return null;
  return { lat: +m[1], lon: +m[2], bearing: m[3] !== undefined ? +m[3] + 90 : null };
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
