import { TYPES, partLabel, SOURCES, DEFAULT_WIDTH, ITEMS, PARKING_USE, PARKING_POSITION, TRAM_BEDS, TURN_CHOICES, HDV_UNDER, UNDER_TYPES, PERMEABLE_TYPES, SURFACES, LAMP_HEIGHTS, underSize } from "./types.js";
import { refloor } from "./floors.js";
import { streetAround, partnerGap, localFrame, nearestStreet, savedStreet, snapToWay, dragAlong, placeCut, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, splitTwoWayLane, capWideLanes, pedestrianZone, treePitsAsSidewalk, widenNarrowTrams, carveCycleways, carveTramTracks, lanesFromShoulders, trackAlongRoad, crossFromA, lawNeedFor, isOnewayTags, MAX_REACH, withOsmBuildings } from "./derive.js";
import { bedOrtho } from "./ortho.js";
import { laneImage, applyLanes, HATCH_PARAMS, SK_ORTHO, AT_ORTHO, CH_ORTHO, NL_ORTHO, BE_ORTHO, LU_ORTHO, PL_ORTHO, FR_ORTHO, ES_ORTHO, PT_ORTHO, PT_MAINLAND, ES_NOT_PNOA, CY_ORTHO, MT_ORTHO, IT_ORTHO, EE_ORTHO, SI_ORTHO, FI_ORTHO, US_ORTHO, CA_ORTHO, DK_ORTHO, DE_ORTHO, deWmsUrl, landsAt, landAt, orthoHereAt } from "./lanes-ortho.js";
import { dkToken } from "./keys.js";
import { boxed as boxedPlace, within as withinPlace } from "./places.js";
import { orthoOsmPolys, edgeBeyond, besidePassport, trimToEnds, estimateNote, outerGapsByImage, medianGapsByImage, deckSpans, bridgeRailings, bridgeWalks, P as ORTHO_P } from "./ortho-osm.js";
import { LOOKS as HOUSE_LOOKS } from "./house-looks.js";
// A click this close to the cut shown (m) is placed exactly, not moved away from junctions (cutAt; Bára 27. 11. 2026).
const AGAIN_M = 200;
// The gabled house looks with the gable's outline (house-looks.js; Bára to approve it, 23. 11. 2026): ?stit=1.
if (new URLSearchParams(location.search).get("stit") === "1") HOUSE_LOOKS.gables = true;
import { aiCut, aiKerbs, aiSurface, aiParking, parkFromAi, parkSkip, lawKerbs, layLaw, lawUnsplits, widenLaw, aiReady, onAiProgress } from "./ai-kerbs.js";
// ?off=… switches named parts of the estimate off (the A/B tests, evaluation/ortofoto-osm/regrese.mjs).
{ const off = new URLSearchParams(location.search).get("off"); if (off) { ORTHO_P.off = new Set(off.split(",")); HATCH_PARAMS.off = ORTHO_P.off.has("srafy"); } }
// A side the user stretched beyond the usual reach goes on past the last path or sidewalk (ortho-osm.js stretch): on by
// default, no measuring (Bára 27. 11. 2026: only a hand-stretched side, a deliberate act); ?dosah=0 off. (The random A/B of
// 27. 11. 2026, 12 cuts at 32 m: better 0, worse 1, measured cuts nobody stretched.)
ORTHO_P.stretchOn = new URLSearchParams(location.search).get("dosah") !== "0";
if (new URLSearchParams(location.search).get("partner80") === "1") ORTHO_P.partner80 = true;
// Tree pits as sidewalk (derive.js treePitsAsSidewalk): off, ?treepits=1 turns them on.
if (new URLSearchParams(location.search).get("treepits") === "1") ORTHO_P.treepits = true;
if (new URLSearchParams(location.search).get("axisroad") === "0") ORTHO_P.axisroad = false;
// ?auta=1: parked cars told by their colours on the orthophoto (ortho-osm.js carsColoured; a trial, off by default).
if (new URLSearchParams(location.search).get("auta") === "1") ORTHO_P.carsColour = true;
// The model also decides sidewalk, green and other between the kerb and the house (on since 19. 11. 2026, Bára;
// hold-out: sidewalk F1 +5 [3, 7] pp); ?aiplochy=0: the rules' own.
if (new URLSearchParams(location.search).get("aiplochy") !== "0") ORTHO_P.aiWalk = true;
// ?chodnik=3,3.5,5: the sidewalk's caps for local, tertiary and secondary streets (trials; ortho-osm.js WALK_CAP_BY).
{ const c = new URLSearchParams(location.search).get("chodnik")?.split(",").map(Number); if (c?.length === 3 && c.every((x) => x > 0)) ORTHO_P.walkCapBy = { residential: c[0], living_street: c[0], unclassified: c[0], service: c[0], tertiary: c[1], secondary: c[2] }; }
import { underground, KINDS as NET_KINDS, netAt } from "./site.js";
// Lanes and shoulders from the road markings of the orthophoto (lanes-ortho.js); ?orto=0 leaves the rules' profile.
const LANES_ORTHO = new URLSearchParams(location.search).get("orto") !== "0";
// The carriageway's kerbs of the orthophoto-and-OSM estimate read by a trained model (ai-kerbs.js), a trial: ?ai=1.
// On by default since 19. 11. 2026 (Bára); ?ai=0 leaves the estimate's own kerbs. The model and onnxruntime load only
// at the first cut estimated from the orthophoto (ai-kerbs.js imports them on demand).
const AI_KERBS = new URLSearchParams(location.search).get("ai") !== "0";
const AI_WAIT = 12000; // ms: the longest the first estimated cut waits for the model's download
// ?mapa=0: the estimate from the orthophoto and OSM even where a technical map answers (its surfaces, lines, tracks and
// parking sections left out), to compare the two (evaluation/ortofoto-osm/chyby.mjs, Bára 18. 11. 2026).
const NO_MAP = new URLSearchParams(location.search).get("mapa") === "0";
import { deriveSigns, SIGNS, SIGN_CHOICES, signLabel, signFits, signFile, keepDrawable, drawable, MAX_PER_PART } from "./signs.js";
import { loadSprites, loadSigns, layoutSigns, buildSvg, setSignsShown, getSignsShown, isHole, exportCredits, mountEditor, svgString, twoLines, totalWidth, buildingStyle, artEvents, edgeInfo, underDepth, ROADWAY, nearestRoadway, BUILDING_STYLES, GABLE_LOOKS, OFFICE_TYPES as OFFICE_LIKE, turnLabel } from "./profile.js";
import * as sources from "./sources.js";
import { ruianBuilding, ruianOutlines, withBuildings, insideRings } from "./gis.js";
import { MAPY_KEY } from "./config.js";
import { cleanProfile, cleanCut, retype } from "./validate.js";
import { shares, surfaces } from "./shares.js";
import { packProfile, unpackProfile, designParams, cutHash, parseCutHash, sameCut } from "./share.js";
import { checkRules, checkUnder, checkTrees } from "./rules.js";
import { city, country, setCity, cityAt, closedAt, countryOfCity, loadBounds, loadStates, loadSkTowns, loadTowns } from "./city.js";
import { TOWNS, placeAt } from "./towns/index.js";
import { ensurePlace, isLate, onAmerica } from "./late.js";
import { log, logOn, sendReport, shortProfile } from "./log.js";
import { setupAbout } from "./about.js";
import { createDataLayers, PLOCHY_PANE } from "./maplayers.js";
import { PASSPORT_NAMES, GREEN_PASSPORTS } from "./towns/pasporty-names.js";
import { mountSearch } from "./search.js";
// tr: t is a common name of a text or a type here.
import { t as tr, num, pct, numField, readNum, lang, LANGS, setLang, translatePage, attribution } from "./i18n.js";

translatePage();
// The languages, the last item of the Soubor menu (Bára 17. 11. 2026: hidden there, the browser's language decides
// first), each named in itself, without flags (24 languages: a language is not a state, Irish and English would mix).
{
  const list = document.querySelector("#lang-list");
  document.querySelector("#lang-current").textContent = LANGS[lang];
  for (const l of Object.keys(LANGS)) {
    const b = document.createElement("button");
    b.lang = l;
    b.textContent = LANGS[l];
    if (l === lang) b.setAttribute("aria-current", "true");
    // The page reloads in the other language: the mode goes along (Fable: Návrh fell back to Stav).
    // The tab's own cut goes along too (Bára: the profile was derived again): the browser keeps one saved cut for all
    // its tabs, the last one derived, so another tab's reload would not find its own.
    b.onclick = () => { if (l === lang) return; try { sessionStorage.setItem("profily-rezim", state.mode); if (state.stav) sessionStorage.setItem("profily-tab", JSON.stringify({ cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited })); } catch {} setLang(l); };
    list.append(b);
  }
}

// The languages of Mapy.com's own texts (its REST API's list); the others get English.
const PANO_LANGS = new Set(["cs", "de", "el", "en", "es", "fr", "it", "nl", "pl", "pt", "sk"]);

const HALF = 40; // half-length of the cut used for reading the data (m)
// A cut end dragged further out (a house set back from a wide road) reads that much more, up to MAX_HALF (m); 103 since
// 27. 11. 2026 (Bára: only dragging reaches that far, a side up to 100 m; a new cut keeps its usual reach).
const MAX_HALF = 103, HALF_PAD = 3;
const OSM_RADIUS = 80; // OSM read round a new cut (m); a longer dragged side reads its reach and 10 m more
const MIN_REACH = 3; // shortest profile side the user can drag the cut end to (m)
const defaultReach = () => ({ left: MAX_REACH, right: MAX_REACH });
const WIDE_REACH = 35;
const WIDE_END = new Set(["plocha", "delici", "zelen", "stromorad", "chodnik", "tramvaj", "railway"]); // a median's or a promenade's parts
// A side of a new cut that may reach WIDE_REACH (evaluation/sjednoceni, Bára 25. 11. 2026: a rule of the data at the cut,
// not of a state; it replaced the states' wideRoads and wideStreets: A/B of 112 cuts, 6 changed, better 4 : 2, Paris's
// boulevards as before, the states without a map unchanged): a motorway or an expressway, or a main street ending at the reach in a median's, promenade's or
// sidewalk's part, whose profile ends at the reach on that side, and only where the street goes on beyond it: no surface
// map lies there (the estimate's land: a street-area map such as Vienna's ends at the parcel line), the street's own
// other carriageway (an OSM way of its name or ref) crosses the cut there, or the map's street surfaces go on from the
// reach to a roadway. A map that draws all land (the Czech DTM, the
// BGT, the cadastral survey) has fields, woods and car parks beyond a motorway's verge: 35 m ran into them (Czech
// motorways, worse 13 : 1). ?off=widereach: never.
const WIDE_ROADS = /^(motorway|trunk)(_link)?$/, WIDE_STREETS = /^(primary|secondary)$/;
const CAR_WAYS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)(_link)?$/;
// MTVU codes: a roadway or a tram bed; the surfaces of a street (with a sidewalk, a cycle track, a median, other paving).
const WIDE_ROADWAY = new Set([700, 701, 705]), STREET_SURFACE = new Set([700, 701, 702, 703, 705, 1003, 9950]);
const inRingXY = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
function widerSides(result, reach, way, osm, frame, dir, polys) {
  const hw = way?.tags?.highway || "", road = WIDE_ROADS.test(hw);
  if (!(road || WIDE_STREETS.test(hw)) || !result?.extent || !result.segments?.length) return null;
  const normal = [-dir[1], dir[0]];
  // A house is no land of a map (the estimate's states have their buildings too).
  const codeAt = (t) => { const x = normal[0] * t, y = normal[1] * t; return polys.find((p) => (!p.bbox || (x >= p.bbox[0] && x <= p.bbox[2] && y >= p.bbox[1] && y <= p.bbox[3])) && p.rings?.length && inRingXY(p.rings[0], x, y))?.code ?? null; };
  const mapAt = (t) => { const c = codeAt(t); return c !== null && c !== 601; };
  // The map's street surfaces from the reach on, without a break, up to a roadway (Paris: the promenade of Bd Marguerite
  // de Rochechouart, its cycle track, then the other carriageway; the other half of the boulevard has another name).
  const roadwayOn = (from, sg) => { for (let d = 0.25; d <= WIDE_REACH - from; d += 0.5) { const c = codeAt(sg * (from + d)); if (WIDE_ROADWAY.has(c)) return true; if (!STREET_SURFACE.has(c)) return false; } return false; };
  const name = way.tags.name, ref = way.tags.ref;
  // The street's other carriageways across the cut, by their offset along the normal (+: side A).
  const own = crossFromA(osm, frame, dir, [-WIDE_REACH, WIDE_REACH]).filter((c) => CAR_WAYS.test(c.tags.highway || "") && ((name && c.tags.name === name) || (ref && c.tags.ref === ref))).map((c) => WIDE_REACH - c.at);
  const longer = {};
  for (const [side, sg, end, part] of [["left", 1, result.extent[1], result.segments[0]], ["right", -1, -result.extent[0], result.segments.at(-1)]]) {
    if (reach[side] >= WIDE_REACH || end < reach[side] - 1 || !(road || WIDE_END.has(part.type))) continue;
    const beyond = [0.5, 1.5, 3].map((d) => sg * (reach[side] + d));
    if (!beyond.some(mapAt) || own.some((t) => sg * t > reach[side] && sg * t <= WIDE_REACH) || roadwayOn(reach[side], sg)) longer[side] = WIDE_REACH;
  }
  return Object.keys(longer).length ? longer : null;
}
// Ends of the cut on the map: right end at -normal, left end at +normal.
const cutEnds = (f, normal, reach) => [
  f.toLonLat(-normal[0] * reach.right, -normal[1] * reach.right),
  f.toLonLat(normal[0] * reach.left, normal[1] * reach.left),
];
// The cut line and its ends A, B on the map show where the profile ends (facades, fences…), not how
// far the data was searched (Bára); a profile only estimated from OSM has no ends, so the reach shows.
const cutSpan = (cut) => cut?.span || cut?.reach || defaultReach();
const STORE = "streetdesign-pilot" + (LANES_ORTHO ? "" : "-bez-orto"); // the last cut (Prague's key from the time of one page per city); ?orto=0 its own
// The boundaries of the cities with their own sources (tools/build_mesta.mjs): a cut takes its city by them.
const statyJson = fetch("staty.json").then((r) => (r.ok ? r.json() : null), () => null);
// The boundaries of the Slovak and Austrian cities (tools/build_towns_sk.mjs, build_towns_at.mjs; the American and Canadian ones come with a cut there, late.js): the city of a cut
// and the territories of the Slovak towns' sources. Without them those cuts are their state's rest.
const townsJson = Promise.all(["mesta-sk.json", "mesta-at.json"].map((f) => fetch(f).then((r) => (r.ok ? r.json() : null), () => null)));
const MESTA = await fetch("mesta.json").then((r) => (r.ok ? r.json() : null), () => null);
// Without the file every cut keeps the current city (rather than all becoming "cesko").
if (MESTA) loadBounds(MESTA); else console.warn("mesta.json se nenačetl: město se podle polohy nepozná");
// The states (tools/build_staty.mjs): a cut outside the cities is in Czechia, in Slovakia or elsewhere (city.js cityAt).
// Loaded with the cities' file (both before the first cut, a linked one included).
const STATY = await statyJson;
if (STATY) loadStates(STATY); else console.warn("staty.json se nenačetl: stát se podle polohy nepozná");
{
  const [sk, ...rest] = await townsJson;
  if (sk) { loadSkTowns(sk); loadTowns(sk); }
  for (const towns of rest) if (towns) loadTowns(towns);
}
// The city of a point becomes the current one (city.js): its sources, texts and illustrations.
async function useCity(lat, lon) {
  await ensurePlace(lat, lon);
  const id = cityAt(lat, lon), changed = id !== city.id || countryOfCity(id) !== country;
  if (changed) setCity(id);
  // What the state decides by the place itself (countries/<ISO>.js atPlace; Germany: panel houses only in the GDR).
  if (country.atPlace) Object.assign(city, await country.atPlace(lon, lat));
  if (changed) await loadSprites();
}

const state = {
  mode: "stav",
  stav: null,
  navrh: null,
  navrhEdited: false,
  selected: null,
  cut: null, // {lat, lon, bearing (deg, way direction), wayId, name}
};

const $ = (s) => document.querySelector(s);
// A message ending in "…" means work in progress: it gets a spinner and the profile is dimmed.
// kind "error" shows it as a warning, "ok" as a confirmation; screen readers announce it (role=status).
const status = (msg, kind = "") => {
  const el = $("#status");
  el.textContent = msg || "";
  el.className = kind ? `muted ${kind}` : "muted";
  document.body.classList.toggle("loading", /…$/.test(msg || ""));
};

// ---------- map ----------
// An old city page (/brno/ …) sends its visitors here with ?mesto=brno: the map opens over that city.
const startCity = new URLSearchParams(location.search).get("mesto");
if (startCity) { setCity(startCity); if (isLate(...city.view)) { await ensurePlace(...city.view).catch(() => {}); setCity(startCity); } history.replaceState(null, "", location.pathname + location.hash); }
const map = L.map("map", { maxZoom: 21, zoomControl: false }).setView(city.view, startCity === "cesko" ? 8 : 18);
// The layers' credits are written in Czech: in another language they are translated as they are added and removed.
if (lang !== "cs") for (const m of ["addAttribution", "removeAttribution"]) {
  const own = map.attributionControl[m].bind(map.attributionControl);
  map.attributionControl[m] = (text) => own(text && attribution(text));
}
L.control.zoom({ zoomInTitle: tr("Přiblížit"), zoomOutTitle: tr("Oddálit") }).addTo(map);
// Address search (search.js, RÚIAN of ČÚZK): the map moves there; an address on a street or a street is cut
// like a click at the nearest point of that street. The log gets only the kind of place, never the query.
mountSearch(map, { status, services: () => { const c = map.getCenter(); return countryOfCity(cityAt(c.lat, c.lng)).search; }, inVienna: () => { const c = map.getCenter(); return placeAt(c.lat, c.lng).sources.includes("wien"); }, inCzechia: () => { const c = map.getCenter(); return countryOfCity(cityAt(c.lat, c.lng)).code === "CZ"; }, onPick: ({ item, cut }) => { log("hledani", { detail: item.type === "AdresniMisto" ? "adresa" : item.type === "Ulice" ? "ulice" : "misto" }); if (cut) cutAt(cut.lat, cut.lon, false, null, null, item.at?.street || null); } });
// Base maps. IPR services are drawn through ArcGIS export requests in Web Mercator, one per tile.
// Each request renders a 512 px image covering four normal tiles (tileSize 512, zoomOffset -1):
// a quarter of the requests, which IPR renders one by one (0.2–1.5 s each), and the browser's
// six parallel connections to gs-pub stay free for the profile data.
const GS = "https://gs-pub.praha.eu";
const ArcgisExport = L.TileLayer.extend({
  getTileUrl(c) {
    // One big tile is 512 CSS px; sharp on retina screens with a 1024 px image.
    const size = devicePixelRatio > 1.5 ? 1024 : 512;
    // coords.z is the map zoom; the tile grid is that of the URL zoom (map zoom + zoomOffset).
    const z = this._getZoomForUrl();
    const nw = this._map.options.crs.project(this._map.unproject([c.x * 256, c.y * 256], z));
    const se = this._map.options.crs.project(this._map.unproject([(c.x + 1) * 256, (c.y + 1) * 256], z));
    const image = this.options.service.endsWith("ImageServer");
    return `${this.options.service}/${image ? "exportImage" : "export"}?` + new URLSearchParams({
      bbox: [nw.x, se.y, se.x, nw.y].join(","), bboxSR: 3857, imageSR: 3857, size: `${size},${size}`,
      format: image ? "jpg" : "png", transparent: !image, f: "image",
      // S-JTSK → WGS 84 the same way everywhere (S_JTSK_To_WGS_1984_1, the default of MTVU and the
      // technical map): some IPR map services default to another one and draw a few metres off.
      ...(image ? {} : { datumTransformations: "[1623]" }),
      ...(this.options.layers ? { layers: this.options.layers } : {}),
    });
  },
});
const BIG_TILES = { tileSize: 512, zoomOffset: -1 };
// One set of base maps for the whole Czech Republic (Bára: one page, no city switch): each kind of map
// is the national layer with the cities' own on top, each limited to its city (mesta.json).
const DMVS = "https://dmvs.cuzk.gov.cz/api/wms";
const osmLayer = (opacity = 1) => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 21, maxNativeZoom: 19, opacity, attribution: `© <a href="https://www.openstreetmap.org/copyright">${tr("přispěvatelé OpenStreetMap")}</a>` });
// A blank tile: what a layer kept to its area draws beyond it (nothing is asked of its server there).
const BLANK_TILE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// Does the tile reach the area's rings: a corner or its middle inside them, or a vertex of them inside the tile (a tile
// across the border at a low zoom).
function tileReaches(layer, coords, rings) {
  const size = layer.getTileSize(), at = (fx, fy) => layer._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
  const nw = at(0, 0), se = at(1, 1);
  if ([[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => { const q = at(fx, fy); return insideRings(rings, q.lng, q.lat); })) return true;
  return rings.some((r) => r.some(([x, y]) => x >= nw.lng && x <= se.lng && y >= se.lat && y <= nw.lat));
}
// A layer class of a state's (or a city's) own service kept to its area: a tile wholly beyond it is blank and not asked
// (Bára 26. 11. 2026: ČÚZK only over Czechia, whose box reaches into Germany, Austria and Poland). Its credit goes by
// the rings too (boundsOf, creditCities).
const keptInside = (Base, rings) => Base.extend({
  getTileUrl(coords) { return tileReaches(this, coords, rings) ? Base.prototype.getTileUrl.call(this, coords) : BLANK_TILE; },
});
// The box of a state's or region's rings ([lon, lat]); the rings stay with it, so that its credit shows only where the
// view reaches the area itself, not just its box (Poland's box covers Prague: creditCities).
const boundsOf = (rings) => { const pts = rings.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const b = L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]); b.rings = rings; return b; };
// Czechia's rings (staty.json): ČÚZK's orthophoto and the DMVS load tiles and credit themselves only there
// (Bára 26. 11. 2026: San Francisco said "ortofoto © ČÚZK", and the tiles were asked of ČÚZK all over the world).
const CZ_RINGS = STATY?.cesko || [];
const czBounds = () => (CZ_RINGS.length ? { bounds: boundsOf(CZ_RINGS) } : {});
const CzWms = CZ_RINGS.length ? keptInside(L.TileLayer.WMS, CZ_RINGS) : L.TileLayer.WMS;
const cuzkOrtho = () => new CzWms("https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", {
  layers: "0", format: "image/jpeg", maxZoom: 21, attribution: "ortofoto © ČÚZK", ...czBounds(),
});
// The DMVS answers WMS 1.3.0 only (since 11/2026; Leaflet asks 1.1.1 by default).
const dmvsWms = (layer, opts = {}) => new CzWms(`${DMVS}/${layer}`, {
  layers: layer, format: "image/png", version: "1.3.0", transparent: true, maxZoom: 21, tileSize: 512, zoomOffset: -1,
  attribution: "technická mapa © kraje, IS DMVS ČÚZK", ...czBounds(), ...opts,
});
// The box of a city from its boundary, its rings with it (its credit only where the view reaches the city): its layers
// load tiles only there.
const within = (id) => (MESTA?.[id]?.length ? { bounds: boundsOf(MESTA[id]) } : {});
const kinds = { map: [osmLayer()], ortho: [cuzkOrtho()], tech: [osmLayer(0.5), dmvsWms("dtm_zps_plochy_bar", { minZoom: 16, transparent: false })], lines: [dmvsWms("dtm_zps_linie_body", { minZoom: 17, opacity: 0.9 })] };
// Prague: IPR's pre-rendered map in Web Mercator on ArcGIS Online (fast, a CDN) and the lines of its technical map.
kinds.map.push(L.tileLayer("https://tiles.arcgis.com/tiles/SBTXIEUGWbqzUecw/arcgis/rest/services/MTVU_WGS84/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 21, maxNativeZoom: 20, attribution: "mapa © IPR Praha", ...within("praha"),
}));
kinds.lines.push(new ArcgisExport("", {
  service: `${GS}/arcgis/rest/services/dtmp/dtmp/MapServer`, layers: "show:9,10,14",
  maxZoom: 21, minZoom: 16, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © IPR Praha", ...within("praha"),
}));
// Brno: the city's map of surfaces (MTVU) from 1 : 5 000 and its 2025 orthophoto (tiles in Web Mercator).
kinds.map.push(new ArcgisExport("", { service: "https://gis.brno.cz/ags3/rest/services/PUBLIC/ted_MTVU_plochy_povrch/MapServer", minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "mapa © Statutární město Brno", ...within("brno") }));
kinds.ortho.push(L.tileLayer("https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 21, maxNativeZoom: 21, attribution: "ortofoto 2025 © Statutární město Brno", ...within("brno"),
}));
// Slovakia: the ZBGIS orthophoto of ÚGKK SR (tiles in Web Mercator to level 19), only there (staty.json).
if (STATY?.slovensko) {
  const Sk = keptInside(L.TileLayer, STATY.slovensko);
  kinds.ortho.push(new Sk(`${SK_ORTHO}/tile/{z}/{y}/{x}`, {
    maxZoom: 21, maxNativeZoom: 19, attribution: "ortofoto © GKÚ Bratislava, NLC (ZBGIS)", bounds: boundsOf(STATY.slovensko),
  }));
}
// Austria: basemap.at's orthophoto (Web Mercator to level 20), only there (staty.json; its box covers Bratislava).
if (STATY?.austria) {
  const At = keptInside(L.TileLayer, STATY.austria);
  kinds.ortho.push(new At(`${AT_ORTHO}/{z}/{y}/{x}.jpeg`, {
    // Level 20 only in some towns: 19 everywhere (zoomed in beyond it).
    maxZoom: 21, maxNativeZoom: 19, attribution: "ortofoto © basemap.at", bounds: boundsOf(STATY.austria),
  }));
}
// Switzerland and Liechtenstein: swisstopo's SWISSIMAGE (WMTS {z}/{x}/{y}, Web Mercator to level 20), only there.
if (STATY?.switzerland) {
  const pts = [...STATY.switzerland, ...(STATY.liechtenstein || [])].flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  // Beyond the border swisstopo answers with a coarse satellite image (Vorarlberg, the hostile review): a tile whose
  // corners and centre all lie outside Switzerland and Liechtenstein is left empty, so basemap.at or a Land shows.
  const swiss = [boxedPlace("CH", STATY.switzerland), ...(STATY.liechtenstein ? [boxedPlace("LI", STATY.liechtenstein)] : [])];
  const ChOrtho = L.TileLayer.extend({
    getTileUrl(coords) {
      const size = this.getTileSize();
      const inside = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => {
        const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
        return withinPlace(swiss, q.lat, q.lng);
      });
      return inside ? L.TileLayer.prototype.getTileUrl.call(this, coords) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    },
  });
  kinds.ortho.push(new ChOrtho(`${CH_ORTHO}/{z}/{x}/{y}.jpeg`, {
    maxZoom: 21, maxNativeZoom: 20, attribution: tr("ortofoto SWISSIMAGE © swisstopo"),
    bounds: L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]),
  }));
}
// The Netherlands: PDOK's Luchtfoto (Actueel_orthoHR, 8 cm, WMTS {z}/{x}/{y} in Web Mercator to level 21), only there:
// beyond the border PDOK answers with a blank tile, so a tile wholly outside the Netherlands is left empty.
if (STATY?.netherlands) {
  const pts = STATY.netherlands.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const dutch = [boxedPlace("NL", STATY.netherlands)];
  const NlOrtho = L.TileLayer.extend({
    getTileUrl(coords) {
      const size = this.getTileSize();
      const inside = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => {
        const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
        return withinPlace(dutch, q.lat, q.lng);
      });
      return inside ? L.TileLayer.prototype.getTileUrl.call(this, coords) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    },
  });
  kinds.ortho.push(new NlOrtho(`${NL_ORTHO}/{z}/{x}/{y}.jpeg`, {
    maxZoom: 21, maxNativeZoom: 21, attribution: tr("ortofoto © Beeldmateriaal.nl (PDOK, CC BY 4.0)"),
    bounds: L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]),
  }));
}
// Belgium: Flanders' orthophoto (it covers Brussels) over Wallonia's (each a WMS / ArcGIS export in Web Mercator), only
// inside Belgium; Luxembourg: the ACT's tiles ({z}/{x}/{y}), only inside Luxembourg.
const insideOnly = (places) => L.TileLayer.extend({
  getTileUrl(coords) {
    const size = this.getTileSize();
    const at = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => {
      const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      return withinPlace(places, q.lat, q.lng);
    });
    const inside = at.some(Boolean);
    if (!inside) return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    if (!this.options.bboxUrl) return L.TileLayer.prototype.getTileUrl.call(this, coords);
    const nw = this._map.options.crs.project(this._map.unproject([coords.x * size.x, coords.y * size.y], coords.z));
    const se = this._map.options.crs.project(this._map.unproject([(coords.x + 1) * size.x, (coords.y + 1) * size.y], coords.z));
    return this.options.bboxUrl([nw.x, se.y, se.x, nw.y], size.x, size.y, at.every(Boolean));
  },
});
// One more try of a tile that failed (a server that answers 504 now and then: GURS), after a pause, then it stays empty.
const retryOnce = (layer, ms = 2500) => layer.on("tileerror", ({ tile }) => {
  if (tile.dataset.retried || !tile.src || tile.src.startsWith("data:")) return;
  tile.dataset.retried = "1";
  const src = tile.src;
  setTimeout(() => { tile.src = `${src}${src.includes("?") ? "&" : "?"}retry=1`; }, ms);
});
// Luxembourg first, Belgium's regions over it (each answers transparent or nothing outside itself; the hostile review:
// a white tile of one hid its neighbour). Each region's layer asks only for tiles over that region
// (regions-be.json, loaded once).
if (STATY?.luxembourg) {
  const Lu = insideOnly([boxedPlace("LU", STATY.luxembourg)]);
  kinds.ortho.push(new Lu(`${LU_ORTHO}/{z}/{x}/{y}.jpeg`, { maxZoom: 21, maxNativeZoom: 21, attribution: tr("ortofoto © ACT Luxembourg (geoportail.lu, CC0)"), bounds: boundsOf(STATY.luxembourg) }));
}
if (STATY?.belgium) {
  const reg = await fetch(new URL("./regions-be.json", import.meta.url)).then((r) => r.json()).catch(() => null);
  const add = (codes, url, credit) => {
    const places = reg ? codes.map((c) => boxedPlace(`BE-${c}`, reg[c])) : [boxedPlace("BE", STATY.belgium)];
    const R = insideOnly(places);
    kinds.ortho.push(new R("", { bboxUrl: url, maxZoom: 21, attribution: tr(credit), bounds: boundsOf(reg ? codes.flatMap((c) => reg[c]) : STATY.belgium) }));
  };
  add(["wal"], (b, w, h) => BE_ORTHO.wal.url(b, w, h, "image/png"), "ortofoto © SPW (Service public de Wallonie, CC BY 4.0)");
  add(["vl", "bru"], (b, w, h) => BE_ORTHO.vl.url(b, w, h, "image/png"), "ortofoto: Bron: Luchtopnamen Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0)");
}
// Poland: GUGiK's orthophoto (WMS in Web Mercator), only for tiles over Poland, transparent where it has no photo (it has
// some up to about 1 km beyond the border, so at the border its tiles cover the Czech ones there: the hostile review).
if (STATY?.poland) {
  const Pl = insideOnly([boxedPlace("PL", STATY.poland)]);
  kinds.ortho.push(new Pl("", { bboxUrl: (b, w, h) => `${PL_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: tr("ortofoto © GUGiK (Geoportal.gov.pl)"), bounds: boundsOf(STATY.poland) }));
}
// France: IGN's orthophoto (WMS in Web Mercator), only inside France (the service is white beyond it).
if (STATY?.france) {
  const Fr = insideOnly([boxedPlace("FR", STATY.france)]);
  kinds.ortho.push(new Fr("", { bboxUrl: (b, w, h) => `${FR_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: tr("ortofoto © IGN (Géoplateforme)"), bounds: boundsOf(STATY.france) }));
}
// Cyprus: the DLS orthophoto of 2019 (tiles), only over the area of the Republic and the British bases.
if (STATY?.cyprus) {
  const Cy = insideOnly([boxedPlace("CY", STATY.cyprus)]);
  kinds.ortho.push(new Cy(`${CY_ORTHO}/{z}/{y}/{x}`, { maxZoom: 21, maxNativeZoom: 21, attribution: tr("ortofoto © DLS Kypr"), bounds: boundsOf(STATY.cyprus) }));
}
// Italy: the open orthophotos, each only over its own box and inside Italy's covered area.
if (STATY?.italy) {
  const It = insideOnly([boxedPlace("IT", STATY.italy)]);
  for (const o of Object.values(IT_ORTHO)) {
    const [x0, y0, x1, y1] = o.box;
    kinds.ortho.push(new It("", { bboxUrl: (b, w, h) => `${o.url(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: o.who ? tr("ortofoto {who}", { who: o.who }) : tr(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) }));
  }
}
// Estonia: the Board's orthophoto tiles (TMS: the y axis flipped), only over Estonia (dark beyond).
if (STATY?.estonia) {
  const Ee = insideOnly([boxedPlace("EE", STATY.estonia)]);
  kinds.ortho.push(new Ee(`${EE_ORTHO}/{z}/{x}/{y}.jpg`, { tms: true, maxZoom: 21, maxNativeZoom: 18, attribution: tr("ortofoto © Maa- ja Ruumiamet, nálet 2024 (stav dlaždic 11/2026)"), bounds: boundsOf(STATY.estonia) }));
}
// Slovenia: GURS's orthophoto DOF025 (WMS in Web Mercator), only over Slovenia (beyond it the server hangs and gives 504).
if (STATY?.slovenia) {
  const Si = insideOnly([boxedPlace("SI", STATY.slovenia)]);
  // The review of 24. 11. 2026 (RECENZE-SI 3): a tile of z9 over the whole state and some of z18 were 504 after 30 s, so the
  // layer starts at z14 (below it the other basemaps), a tile wholly inside Slovenia is a JPEG (PNG takes GURS twice as
  // long; transparent only at the border) and a failed tile is asked once more.
  kinds.ortho.push(retryOnce(new Si("", { bboxUrl: (b, w, h, inside) => inside ? SI_ORTHO(b, w, h) : `${SI_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, minZoom: 14, maxZoom: 21, attribution: tr("ortofoto DOF025 © Geodetska uprava RS (CC BY 4.0)"), bounds: boundsOf(STATY.slovenia) })));
}
// Finland: the towns' own orthophotos (lanes-ortho.js FI_ORTHO: Helsinki, Espoo, Turku), each only over its town's box
// and inside Finland (none elsewhere: the national one needs a personal key).
if (STATY?.finland) {
  const Fi = insideOnly([boxedPlace("FI", STATY.finland)]);
  for (const o of Object.values(FI_ORTHO).reverse()) {
    const [x0, y0, x1, y1] = o.box;
    kinds.ortho.push(new Fi("", { bboxUrl: (b, w, h) => o.url(b, w, h, "image/png"), maxZoom: 21, attribution: tr(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) }));
  }
}
// Denmark: GeoDanmark's spring orthophoto through Dataforsyningen (WMTS, lanes-ortho.js DK_ORTHO), only over Denmark and
// only with the app's token (keys.js; without it no layer, the map keeps the others).
if (STATY?.denmark && dkToken()) {
  const Dk = insideOnly([boxedPlace("DK", STATY.denmark)]);
  kinds.ortho.push(new Dk(DK_ORTHO("{z}", "{x}", "{y}"), { maxZoom: 21, maxNativeZoom: 20, attribution: tr("ortofoto: Indeholder data fra Styrelsen for Dataforsyning og Infrastruktur, Ortofoto forår, WMTS-tjeneste"), bounds: boundsOf(STATY.denmark) }));
}
// Malta: the Planning Authority's orthophoto of 2018 (in degrees: lanes-ortho.js MT_ORTHO), only over Malta; a JPEG
// inside the islands, a transparent PNG only on a tile across the coast (as Slovenia; the review of Malta).
if (STATY?.malta) {
  const Mt = insideOnly([boxedPlace("MT", STATY.malta)]);
  kinds.ortho.push(new Mt("", { bboxUrl: (b, w, h, inside) => (inside ? MT_ORTHO(b, w, h) : `${MT_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`), maxZoom: 21, attribution: tr("ortofoto © Planning Authority Malta (CC BY 4.0)"), bounds: boundsOf(STATY.malta) }));
}
// Monaco: IGN's orthophoto covers it too.
if (STATY?.monaco) {
  const Mc = insideOnly([boxedPlace("MC", STATY.monaco)]);
  kinds.ortho.push(new Mc("", { bboxUrl: (b, w, h) => `${FR_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: tr("ortofoto © IGN (Géoplateforme)"), bounds: boundsOf(STATY.monaco) }));
}
if (STATY?.spain) {
  // Not over Melilla (PNOA's image there is Airbus's under a licence not cleared; Bára 23. 11. 2026, lanes-ortho.js
  // ES_NOT_PNOA): its ring left out of the area drawn.
  const notPnoa = (r) => ES_NOT_PNOA.some(([x0, y0, x1, y1]) => r.every(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1));
  const Es = insideOnly([boxedPlace("ES", STATY.spain.filter((r) => !notPnoa(r)))]);
  kinds.ortho.push(new Es("", { bboxUrl: (b, w, h) => `${ES_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: tr("ortofoto PNOA © IGN (CC BY 4.0)"), bounds: boundsOf(STATY.spain) }));
}
// Portugal: DGT's flight of 2025 (the whole mainland; the review of 23. 11. 2026: three stacked layers tripled the
// requests), only over the mainland (Madeira and the Azores have no DGT photo).
if (STATY?.portugal) {
  const Pt = insideOnly([boxedPlace("PT", STATY.portugal)]);
  const [x0, y0, x1, y1] = PT_MAINLAND;
  kinds.ortho.push(new Pt("", { bboxUrl: (b, w, h) => `${PT_ORTHO["pt-25"](b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: tr("ortofoto © DGT"), bounds: [[y0, x0], [y1, x1]] }));
}
// Germany: the orthophoto of each Land (lanes-ortho.js DE_ORTHO), a tile from the WMS of the Land its centre lies in
// (laender.json, loaded when the first tile in Germany is drawn).
if (STATY?.germany) {
  const pts = STATY.germany.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const DeOrtho = L.GridLayer.extend({
    createTile(coords, done) {
      const size = this.getTileSize(), R = 6378137, span = (2 * Math.PI * R) / 2 ** coords.z;
      const x0 = coords.x * span - Math.PI * R, y1 = Math.PI * R - coords.y * span, b = [x0, y1 - span, x0 + span, y1];
      const c = this._map.unproject([(coords.x + 0.5) * size.x, (coords.y + 0.5) * size.y], coords.z);
      // Near a border (more than one Land within about 2 km) the Länder's images stacked as transparent PNGs, the Land
      // of the tile's centre on top (the review: white halves in Mainz/Wiesbaden, Ulm/Neu-Ulm).
      // Leaflet's .leaflet-tile is absolute (the images' box too): an inline "relative" stacked the tiles down the page.
      const tile = document.createElement("div");
      // A tile not wholly in one Land (a corner in another Land or outside Germany, the Czech border: Varnsdorf, Aš)
      // asks transparent PNGs, so the orthophoto beneath shows where the Land's WMS has none (the review of the port).
      const corner = (fx, fy) => this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      Promise.all([landsAt(c.lng, c.lat), ...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => { const q = corner(fx, fy); return landAt(q.lng, q.lat); })]).then(([lands, ...corners]) => {
        const wms = [...new Map(lands.map((l) => [DE_ORTHO[l].wms, l])).values()];
        if (!wms.length) return done(null, tile);
        const clear = wms.length > 1 || corners.some((l) => l !== lands[0]);
        let left = wms.length;
        for (const land of [...wms].reverse()) {
          const im = document.createElement("img");
          im.alt = "";
          Object.assign(im.style, { position: "absolute", left: 0, top: 0, width: `${size.x}px`, height: `${size.y}px` });
          im.onload = im.onerror = () => { if (--left === 0) done(null, tile); };
          im.src = clear ? deWmsUrl(DE_ORTHO[land], b, size.x, size.y, "image/png", { transparent: "TRUE" }) : deWmsUrl(DE_ORTHO[land], b, size.x, size.y);
          tile.appendChild(im);
        }
      }, () => done(null, tile));
      return tile;
    },
  });
  kinds.ortho.push(new DeOrtho({ maxZoom: 21, minZoom: 12, attribution: tr("ortofoto © spolkové země Německa (GeoBasis-DE)"),
    bounds: Object.assign(L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]), { rings: STATY.germany }) }));
}
// The towns (towns/<id>.js maps): their orthophoto, technical map and lines, each kept to the town.
for (const [id, t] of Object.entries(TOWNS)) {
  if (!t.maps || t.national) continue;
  const m = t.maps({ L, ArcgisExport, BIG_TILES: { ...BIG_TILES, ...within(id) }, osm: () => null, cuzk: () => null });
  for (const [name, layers] of Object.entries(m.base)) {
    const kind = /^Ortofoto (?!ČÚZK)/.test(name) ? "ortho" : /Technická|Účelová/.test(name) ? "tech" : /^Mapa/.test(name) ? "map" : null;
    if (kind) kinds[kind].push(...layers.filter(Boolean));
  }
  if (m.lines) kinds.lines.push(m.lines);
}
// A city's layer credits its city only while the map shows that city (Leaflet would list every layer of the
// group): its attribution is kept aside and added or removed as the view moves.
const cityCredited = Object.values(kinds).flat().filter((l) => l.options?.bounds && l.options.attribution);
for (const l of cityCredited) { l.options.cityAttribution = l.options.attribution; delete l.options.attribution; }
const credited = new Set();
// Does the view reach the area of these rings ([lon, lat]): a point of them in the view, or a corner or the middle of
// the view inside them. Without rings (a city's box): yes.
function reaches(rings, view) {
  if (!rings?.length) return true;
  const inside = (x, y) => { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  if (rings.some((r) => r.some(([x, y]) => view.contains([y, x])))) return true;
  const c = view.getCenter();
  return [view.getSouthWest(), view.getNorthEast(), view.getNorthWest(), view.getSouthEast(), c].some((p) => inside(p.lng, p.lat));
}
function creditCities() {
  const view = map.getBounds(), want = new Set();
  for (const l of cityCredited) if (map.hasLayer(l) && L.latLngBounds(l.options.bounds).intersects(view) && reaches(l.options.bounds.rings, view)) want.add(l.options.cityAttribution);
  for (const a of credited) if (!want.has(a)) { map.attributionControl.removeAttribution(a); credited.delete(a); }
  for (const a of want) if (!credited.has(a)) { map.attributionControl.addAttribution(a); credited.add(a); }
}
map.on("moveend layeradd layerremove", creditCities);
// North America, when the map or a cut is there (late.js): the cities' orthophotos (lanes-ortho.js US_ORTHO, CA_ORTHO), each
// only over its city (mesta-us.json, mesta-ca.json).
onAmerica((towns) => {
  for (const o of [...Object.values(US_ORTHO), ...Object.values(CA_ORTHO)]) if (towns[o.town]) {
    const Own = insideOnly([boxedPlace(o.town, towns[o.town])]);
    const [x0, y0, x1, y1] = o.box;
    // (A tile cache of its own as tiles {z}/{y}/{x}: MassGIS's.)
    const layer = o.tiles ? new Own(`${o.tiles}/{z}/{y}/{x}`, { maxZoom: 21, maxNativeZoom: o.z, cityAttribution: tr(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) })
      : new Own("", { bboxUrl: (b, w, h) => o.url(b, w, h, "image/png"), maxZoom: 21, cityAttribution: tr(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) });
    cityCredited.push(layer);
    baseMaps[tr("Ortofoto")].addLayer(layer);
  }
  creditCities();
});
const lateMap = () => { const c = map.getCenter(); if (isLate(c.lat, c.lng)) ensurePlace(c.lat, c.lng).catch((err) => console.warn("America", err)); };
map.on("moveend", lateMap);
const baseMaps = { [tr("Mapa")]: L.layerGroup(kinds.map), [tr("Ortofoto")]: L.layerGroup(kinds.ortho), [tr("Mapa povrchů")]: L.layerGroup(kinds.tech), "OpenStreetMap": osmLayer() };
const BASE_KEY = "streetdesign-basemap-cr";
// Remembered by its Czech name, so that the choice holds in either language.
const baseCs = Object.fromEntries(["Mapa", "Ortofoto", "Mapa povrchů", "OpenStreetMap"].map((cs) => [tr(cs), cs]));
let baseName = tr("Mapa");
// "Technická mapa" is "Mapa povrchů" since 17. 11. 2026 (Bára: one name in every state): the old choice holds.
try { const saved = tr(localStorage.getItem(BASE_KEY)?.replace(/^Technická mapa$/, "Mapa povrchů") || ""); if (baseMaps[saved]) baseName = saved; } catch {}
baseMaps[baseName].addTo(map);
map.on("baselayerchange", (e) => { try { localStorage.setItem(BASE_KEY, baseCs[e.name] || e.name); } catch {} });
const dtm = L.layerGroup(kinds.lines);
const mtvuLayer = L.layerGroup();
const layersControl = L.control.layers(baseMaps, { [tr("Linie mapy povrchů")]: dtm, [tr("Plochy u řezu")]: mtvuLayer }).addTo(map);
document.querySelector(".leaflet-control-layers-toggle")?.setAttribute("title", tr("Podkladová mapa a vrstvy"));
document.querySelector(".leaflet-control-layers-toggle")?.setAttribute("aria-label", tr("Podkladová mapa a vrstvy"));
mtvuLayer.addTo(map);
// The other data of the cut (parking, points, lines, tracks, axes, buildings) as overlays (maplayers.js).
const dataLayers = createDataLayers(map, layersControl);

const MTVU_COLORS = { 701: "#5c5c59", 700: "#5c5c59", 702: "#c9a227", 703: "#b5574a", 704: "#7b7b78", 705: "#8c6d3f", 601: "#9b8cc4" };
// The orthophoto for the lanes (lanes-ortho.js) is read over the same ±25 m whatever the cut's ends, so dragging an
// end out into a field does not change the roadway (Bára).
const ORTHO_HALF = 25;
const cutLine = L.polyline([], { color: "#e24b4a", weight: 4 }).addTo(map);
// The part selected in the profile, shown on the cut line (Bára): its stretch between the profile's ends A and B.
const selLine = L.polyline([], { color: "#185fa5", weight: 9, opacity: 0.85, interactive: false }).addTo(map);
function drawSelection() {
  const p = state.mode === "porovnat" ? null : current(), seg = p?.segments?.[state.selected];
  if (!seg || !state.cut) { selLine.setLatLngs([]); return; }
  // The parts lie from A (+normal, span.left) to B (-normal, span.right), stretched to the cut's length (a design
  // may be wider or narrower than the street).
  const span = cutSpan(state.cut), total = p.segments.reduce((x, q) => x + q.width, 0) || 1, len = span.left + span.right;
  const from = p.segments.slice(0, state.selected).reduce((x, q) => x + q.width, 0);
  const b = (state.cut.bearing * Math.PI) / 180, normal = [-Math.cos(b), Math.sin(b)], f = localFrame(state.cut.lat, state.cut.lon);
  selLine.setLatLngs([from, from + seg.width].map((a) => {
    const t = span.left - (a / total) * len, [lon, lat] = f.toLonLat(normal[0] * t, normal[1] * t);
    return [lat, lon];
  }));
}
const handleIcon = L.divIcon({ className: "cut-handle", iconSize: [14, 14] });
const centerMarker = L.marker([0, 0], { draggable: true, icon: handleIcon, opacity: 0 }).addTo(map);
// Cut ends are lettered like the profile: A = left end of the profile (endMarkers[1]), B = right end.
const endIcon = (letter) => L.divIcon({ className: "cut-handle cut-end", html: letter, iconSize: [22, 22] });
const endMarkers = ["B", "A"].map((letter) => L.marker([0, 0], { draggable: true, icon: endIcon(letter), opacity: 0 }).addTo(map));

let osmCache = null; // {frame, osm, way, wayPts}



map.on("click", (e) => cutAt(e.latlng.lat, e.latlng.lng));
sources.events.addEventListener("retry", (e) => {
  if (document.body.classList.contains("loading")) status(tr("Server {server} neodpovídá, zkouším znovu ({n}/{of})…", { server: city.abroad && e.detail.host ? e.detail.host : city.server, n: e.detail.attempt, of: e.detail.of }));
});
window.cutAt = cutAt; // handy for testing from the console
// The replay of recorded data (evaluation/replay/harness.js) reads what a visitor would see.
if (globalThis.PROFILY_REPLAY) Object.assign(globalThis.PROFILY_REPLAY, { state, exportSvgs, restore, render });

async function cutAt(lat, lon, keepWay = false, bearing = null, reach = null, wantName = null, wantWay = null) {
  logEdits(); // what was done with the previous cut, before it is replaced
  try {
    // Another continent's borders, sources and drawings first (late.js; nothing for Europe).
    await ensurePlace(lat, lon);
    // The north of Cyprus, Italy beyond the open orthophotos: no profile (city.js closedAt).
    const closed = closedAt(lat, lon);
    if (closed) return status(closed, "error");
    await useCity(lat, lon);
    status(tr("Načítám data z OSM…"));
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
      // two carriageways (?off=firstclick: every click moved as before).
      const again = bearing === null && !!state.cut && !ORTHO_P.off?.has("firstclick") && Math.hypot(...frame.toXY(state.cut.lon, state.cut.lat)) <= AGAIN_M;
      if (near) near = again ? centerOnStreet(osm, frame, near) : placeCut(osm, frame, near, bearing !== null);
    }
    if (!near) {
      // A click with no street found is logged too (Bára: how many try outside the Czech Republic): only where, to
      // about a kilometre, and whether there were any OSM data there at all (outside the country there are none).
      if (!keepWay) log("bez_ulice", { detail: osm?.elements?.length ? "bez_ulice" : "bez_dat", city: city.id, country: city.country, lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 });
      return status(tr("Tady jsem žádnou ulici nenašla. Zkuste kliknout přímo na silnici."), "error");
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
    status(city.techMap ? tr("Načítám {map}…", { map: city.techMap }) : tr("Načítám ortofoto…"));
    const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
    let polys = [], tracks = [];
    const zone = sources.zps(clat, clon).catch(() => undefined);
    // With ?partner80=1 the image reaches the other carriageway of a street of two one-way ones too (50–80 m apart).
    const orthoHalf = !ORTHO_P.partner80 ? ORTHO_HALF : Math.max(ORTHO_HALF, Math.min(41, partnerGap(osm, frame, near) / 2 + 12));
    const [m, k, pk, z, o, li] = await Promise.allSettled([
      // The zone file is local (and loaded once), so knowing the zone first costs nothing.
      sources.mtvu(bbox, near.way.tags, near.way), sources.linie(bbox), zone.then((inZone) => sources.parkovani(bbox, inZone)), zone,
      // Where OSM has tram tracks across the cut: one small image of the orthophoto for the surface of the bed
      // (ortho.js, a short timeout; without it the rules decide).
      // The state's orthophoto (countries/<ISO>.js bedOrtho; Slovakia its own, elsewhere abroad none: ČÚZK's is blank there).
      bedOrtho({ osm, frame, dir, half, source: country.bedOrtho }),
      // One image of the orthophoto across the whole cut for the road markings (lanes-ortho.js).
      LANES_ORTHO ? laneImage({ frame, dir, t0: -Math.min(half, orthoHalf), t1: Math.min(half, orthoHalf), source: city.laneOrtho || country.laneOrtho }) : null,
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
    // A map's gaps beyond the outer sidewalk, lawn or paving by the orthophoto (towns/planimetrics.js outerGaps; Boston).
    const outerPaved = outerGapsByImage(polys, dir, laneImg?.st);
    // A map's gaps between two roadways, a median or a lawn by the orthophoto (towns/planimetrics.js gapsBetweenRoads; Toronto).
    const medianGreen = medianGapsByImage(polys, dir, laneImg?.st);
    // The same image tells grass from paving beside a roadway read from the DTM's lines (derive.js linePieces).
    const args = { center: [0, 0], dir, half, polys, osm, frame, way: near.way, tracks, parking, lines, reach, inZps, ortho, lanesImage: laneImg?.st, roadOnPath: !!city.roadOnPath, noParkGuess: !country.parkGuess || new URLSearchParams(location.search).get("odhadstani") === "0" || (m.status === "fulfilled" && !!m.value?.noParkGuess && !NO_MAP),
      osmParkGive: !ORTHO_P.off?.has("mapfill"),
      kerbParking: pk.status === "fulfilled" && pk.value?.kerbParking && !NO_MAP ? pk.value.kerbParking.map((p) => ({ ...p, xy: frame.toXY(p.lon, p.lat) })) : null };
    let result = deriveProfile(args);
    if (freshReach && !ORTHO_P.off?.has("widereach")) {
      // No surface map at the axis (the estimate below): a motorway's sides reach WIDE_REACH, as the estimate finds its
      // own ends; under a map, by what the map has beyond the reach (widerSides).
      if (result.estimate && WIDE_ROADS.test(near.way.tags?.highway || "")) { reach = { left: WIDE_REACH, right: WIDE_REACH }; args.reach = reach; result = deriveProfile(args); }
      else if (!result.estimate) {
        const longer = widerSides(result, reach, near.way, osm, frame, dir, polys);
        if (longer) { reach = { ...reach, ...longer }; args.reach = reach; result = deriveProfile(args); }
      }
    }
    // A new cut goes on to the first building, wall or fence beyond its reach (up to 40 m, not across another street):
    // ortho-osm.js edgeBeyond (Bára 27. 11. 2026). ?off=nastenu: the usual reach.
    if (freshReach && ORTHO_P.edgeOn) {
      const e = edgeBeyond({ osm, frame, dir, way: near.way, from: { A: reach.right, B: reach.left } });
      if (e.A || e.B) { reach = { left: e.B ?? reach.left, right: e.A ?? reach.right }; args.reach = reach; result = deriveProfile(args); }
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
      if (aiReady()) status(tr("Načítám ortofoto…"));
      else { status(tr("Načítám model pro obruby (jen poprvé)…")); onAiProgress((p) => status(tr("Načítám model pro obruby (jen poprvé)… {p} %", { p: Math.round(100 * p) }))); }
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
    // there is no orthophoto). In every state, Czechia's MTVU and technical maps too (evaluation/mapfill-cz, 25. 11.
    // 2026: 7 of 89 cuts changed, better 6 : 2, Prague 1 : 0). ?off=mapfill: as before.
    const mapFill = !orthoOsm && !result.estimate && AI_KERBS && orthoHere && !ORTHO_P.off?.has("mapfill");
    const mapCut = mapFill ? await modelCut() : null;
    // In every state (evaluation/sjednoceni, 24. 11. 2026: Czechia's nine passport towns, 2 of 47 cuts changed, better 1,
    // the same 1; it was off there without a measurement).
    if (!orthoOsm && m.value?.passport) {
      const beside = besidePassport({ osm, frame, dir, way: near.way, st: laneImg?.st, edges: k.status === "fulfilled" ? k.value?.edges || [] : [], symbols: k.status === "fulfilled" ? k.value?.symbols || [] : [], areas: k.status === "fulfilled" ? k.value?.areas || [] : [], polys, ...(country.besideMax && { max: country.besideMax }), aiSurf: mapCut ? aiSurface(mapCut) : null });
      if (beside.length) {
        const again = deriveProfile({ ...args, polys: [...polys, ...beside] });
        if (!again.estimate) { result = again; besideUsed = beside.used; lastPolys = [...polys, ...beside]; }
      }
    }
    // The law's parking waits for the lanes and the model's cars (ai-kerbs.js lawKerbs, layLaw; ?off=lawlanes).
    const lawPark = ORTHO_P.off?.has("aipark") || ORTHO_P.off?.has("lawlanes") ? null : orthoOsm ? aiPark : mapCut && aiParking(mapCut);
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
    // Tree pits in a sidewalk read on the orthophoto (derive.js treePitsAsSidewalk), only with ?treepits=1.
    const pitsJoined = treePitsAsSidewalk(result.segments, result.extent, laneImg?.st);
    if (orthoOsm) widenNarrowTrams(result.segments);
    const lawRows = [];
    if (lawAt.length) layLaw(result, lawAt, lawPark, lawNeed, { sure: true, skip: lawSkip, rows: lawRows });
    // Parking where the model sees cars at the kerb (ai-kerbs.js parkFromAi; Bára 20. 11. 2026), ?off=aipark.
    // Not where parking data decide: a paid zone, the city's parking sections at the cut, a side OSM tags.
    if (orthoOsm && aiPark && !ORTHO_P.off?.has("aipark")) {
      const along = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
      // A strip the law estimated, gone back to the roadway, keeps the lane's cap there too (as in a map's roadway below;
      // evaluation/sjednoceni, Slovakia: Royova in Bratislava, one lane of 6 m).
      const old = ORTHO_P.off?.has("parkshare");
      if (parkFromAi(result, aiPark, { ...parkSkip(near.way.tags, along, inZps === true || parking.length > 0), old }) > 0 && !old) capWideLanes(result.segments, near.way.tags);
    }
    // In a surface map's roadway (mapFill above) the same, but never over the map's own sidewalk or green (inside).
    const mapPark = mapCut && aiParking(mapCut);
    let mapParked = false;
    if (mapPark && !ORTHO_P.off?.has("aipark")) {
      const along = !near.dir || dir[0] * near.dir[0] + dir[1] * near.dir[1] >= 0;
      mapParked = parkFromAi(result, mapPark, { ...parkSkip(near.way.tags, along, inZps === true || parking.length > 0), inside: true, old: ORTHO_P.off?.has("parkshare") }) > 0;
      // A strip the law estimated, gone back to its lane where no car stands, keeps the lane's cap (capWideLanes above;
      // evaluation/mapfill-cz: Rosická in Brno 6.67 m lanes, Šatrova in Prague 5.62 m).
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
    state.cut.sources = { ...(mv?.region && { region: mv.region }), ...(mv?.skTown && { skTown: mv.skTown }), ...(mv?.atTown && { atTown: mv.atTown }), ...(mv?.deTown && { deTown: mv.deTown }), ...(mv?.chAv && { chAv: mv.chAv }), ...(mv?.nlBgt && { nlBgt: true }), ...(mv?.beTown && { beTown: mv.beTown }), ...(mv?.plTown && { plTown: mv.plTown }), ...(mv?.frTown && { frTown: mv.frTown }), ...(mv?.esTown && { esTown: mv.esTown }), ...(mv?.itTown && { itTown: mv.itTown }), ...(mv?.eeTown && { eeTown: mv.eeTown }), ...(mv?.fiTown && { fiTown: mv.fiTown }), ...(mv?.ltTown && { ltTown: mv.ltTown }), ...(mv?.cityMap && { cityMap: mv.cityMap }), ...(mv?.usDdot && { usDdot: true }), ...(mv?.nycSigns && { nycSigns: true }), ...(mv?.sfCurb && { sfCurb: true }), ...(mv?.ltGrpk && { ltGrpk: true }), ...(pk.status === "fulfilled" && pk.value?.amsParking && pk.value.features?.length && { amsParking: true }), ...(pk.status === "fulfilled" && pk.value?.parisParking && { parisParking: true }), ...(pk.status === "fulfilled" && pk.value?.dkParking && pk.value.features?.length && { dkParking: true }), ...(atSigns?.length && signTags.__salzburg && { atSigns: "salzburg" }), ...(country.signs.ogl && result.segments?.some((s) => s.signs?.some((x) => country.signs.ogl.has(country.signs.file(x, s)))) && { ukSigns: true }), ...(mv?.skTm && { skTm: true }), ...(orthoOsm?.kerbs?.why && Object.values(orthoOsm.kerbs.why).includes("ai") && { aiKerbs: true }), ...((orthoOsm?.edges || besideUsed?.edges) && k.value?.edgesFrom && { skEdges: k.value.edgesFrom }), ...((orthoOsm?.areas || orthoOsm?.widthFrom === "zbgis" || besideUsed?.zbgis) && { zbgis: true }), ...(mv?.dmvs && { dmvs: true }), ...(typeof mv?.passport === "string" && { passport: mv.passport }), ...(((ortho && !bedOwn) || ((lanesFromOrtho || orthoOsm?.image) && laneImg?.source === "cuzk")) && { ortho: true }), ...((lanesFromOrtho || orthoOsm?.image) && laneImg && laneImg.source !== "cuzk" ? { orthoCity: laneImg.source } : bedOwn ? { orthoCity: bedOwn } : (besideUsed?.image || mapParked || pitsJoined || outerPaved || medianGreen) && laneImg && { orthoCity: laneImg.source }) };
    // The log of cuts (log.js): the cut exactly, and how it came (a click, a moved cut, a link).
    log("rez", {
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
    globalThis.__profilyEval = { runs: result.runs || null, extent: result.extent || null, estimate: !!(orthoOsm || result.estimate), kerbs: orthoOsm?.kerbs || null };
    state.computed = structuredClone(state.stav); // the detection, for the log of corrections
    state.stavEdited = false;
    if (!state.navrhEdited) state.navrh = structuredClone(state.stav);
    state.selected = null;
    state.edge = null;
    state.fixing = false;
    state.fixBase = null;
    resetHistory();
    drawCut(cutEnds(frame, normal, cutSpan(state.cut)));
    showCutInfo();
    drawMtvu(polys);
    dataLayers.draw({ frame, dir, osm, way: near.way, polys, tracks, lines, parking, span: cutSpan(state.cut), facades });
    if (!map.getBounds().contains([clat, clon])) map.panTo([clat, clon]);
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
    const orthoNote = orthoNoKey && (orthoOsm || result.estimate) ? tr("Ortofoto tu není k dispozici (aplikaci chybí přístupový klíč služby, nebo ho služba nepřijala): obruby jsou jen podle OSM, profil je hrubý odhad.")
      : orthoDown && (orthoOsm || result.estimate) ? tr("Ortofoto teď neodpovědělo: obruby jsou jen podle OSM, profil je hrubý odhad. Zkuste kliknout znovu za chvíli.")
      // The houses' source as the estimate used them: RÚIAN in Czechia, the GRPK with OSM in Lithuania, else OSM
      // (ortho-osm.js houseSources; the backlog of 23. 11. 2026: it said OSM in Czechia too).
      : !orthoOsm ? "" : estimateNote(orthoOsm, LANES_ORTHO && orthoHere, tr, (xs) => new Intl.ListFormat(lang, { type: "conjunction" }).format(xs));
    const out = sources.outage({ surfaces: m, lines: k, parking: pk }, undefined, { fallback: orthoNote, orthoEstimate: country.orthoEstimate && orthoHere });
    // Copenhagen's kerb lines or parking areas did not answer (towns/denmark.js dkFailed; the review of 24. 11. 2026: said
    // nothing before): the cut is made without them, said so.
    if ([k, pk].some((x) => x.status === "fulfilled" && x.value?.dkFailed)) {
      out.text = `${out.text ? out.text + " " : ""}${tr("Okraje vozovek nebo parkovací plochy Kodaně teď neodpověděly, profil je bez nich.")} ${tr("Zkuste kliknout znovu za chvíli.")}`;
      out.error = true;
    }
    // DDOT's inventory did not answer (towns/usa.js): the map's surfaces without it, said so.
    if (mv?.ddotFailed && !NO_MAP) {
      out.text = `${out.text ? out.text + " " : ""}${tr("Inventář ulic Washingtonu (DDOT) teď neodpovídá: stání a počty pruhů jsou odhad.")} ${tr("Zkuste kliknout znovu za chvíli.")}`;
      out.error = true;
    }
    // SFMTA's curb zones did not answer (towns/sanfrancisco.js): the kerbs without their parking, said so.
    if (mv?.sfCurbFailed && !NO_MAP) {
      out.text = `${out.text ? out.text + " " : ""}${tr("Pravidla stání u obrub San Franciska (SFMTA) teď neodpovídají: stání je odhad.")} ${tr("Zkuste kliknout znovu za chvíli.")}`;
      out.error = true;
    }
    // The map itself has an intersection at the cut's centre (towns/usa.js).
    if (mv?.junction && !NO_MAP) result.junction = true;
    // A town's passport answered but not at the axis (Slovakia): the profile is still the estimate.
    state.cut.note = out.note || (orthoOsm && city.abroad ? (country.orthoEstimate && orthoHere && !orthoNoKey ? " · odhad z ortofota a OSM" : " · jen odhad z OSM") : "");
    // The heading is the street only (Bára 16. 11. 2026); where the data come from is said under it (#profile-sub).
    $("#street-name").textContent = streetName(state.cut);
    const junctionNote = tr("Řez nejspíš vede křižovatkou. Posuňte ho tažením středu do úseku mezi křižovatkami.");
    const droppedNote = tr("Nový řez: návrh začíná znovu od stavu ulice (předchozí návrh zůstává ve sdíleném odkazu nebo uloženém souboru, pokud jste ho uložili).");
    // With the profile made without the map, the other notes come after its own (a junction, a design started anew).
    const extra = orthoOsm ? [result.junction && junctionNote, dropped && droppedNote].filter(Boolean).map((x) => " " + x).join("") : "";
    // The map has surfaces here, none at the axis (the outage says nothing of it): that comes first.
    const axisNote = (orthoOsm || (orthoDown && result.estimate)) && !out.text.includes(orthoNote) ? (city.abroad ? "" : tr("Mapa povrchů tu ulici nemá.") + " ") + orthoNote + (out.text ? " " + out.text : "") : "";
    if (axisNote) status(axisNote + extra, out.error ? "error" : undefined);
    else if (out.text) status(out.text + extra, out.error ? "error" : undefined);
    else if (dropped) status(tr("Nový řez: návrh začíná znovu od stavu ulice (předchozí návrh zůstává ve sdíleném odkazu nebo uloženém souboru, pokud jste ho uložili)."));
    else status(result.notice ? result.notice
      : result.junction ? tr("Řez nejspíš vede křižovatkou. Posuňte ho tažením středu do úseku mezi křižovatkami.") : "");
    save();
    state.underground = null;
    loadUnderground();
    render();
    // On a phone the profile is under the map: bring it into view.
    if (matchMedia("(max-width: 760px)").matches) $("#profile-head").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    status(tr("Data se nepodařilo načíst ({error}). Zkuste kliknout znovu za chvíli.", { error: err.message }), "error");
  }
}

function drawCut(ends) {
  const ll = ends.map(([lon, lat]) => [lat, lon]);
  cutLine.setLatLngs(ll);
  centerMarker.setLatLng([state.cut.lat, state.cut.lon]).setOpacity(1);
  endMarkers.forEach((m, i) => m.setLatLng(ll[i]).setOpacity(1));
}

// Position and azimuth of the cut as one line: "50.082707, 14.419918 · azimut 344°".
// The azimuth is the direction of the cut line (from the left end to the right end of the
// profile, clockwise from north); the street runs at azimut + 90°.
function cutText(cut) {
  const az = (((cut.bearing - 90) % 360) + 360) % 360;
  return `${cut.lat.toFixed(6)}, ${cut.lon.toFixed(6)} · ${tr("azimut")} ${Math.round(az)}°`;
}

function showCutInfo() {
  if (!state.cut) return;
  const r = state.cut.reach || defaultReach();
  history.replaceState(null, "", cutHash(state.cut, r));
  // Mapy.com at the cut with the panorama layer on (ovl=8). A link straight into a panorama needs
  // the photo's id (pid), which only their Panorama API (with a key) gives; one click on the street opens it.
  // With a Mapy.com key the panorama opens here; without one, a link to Mapy.com at the cut.
  const pano = $("#pano-link");
  pano.href = `https://mapy.com/cs/zakladni?x=${state.cut.lon.toFixed(7)}&y=${state.cut.lat.toFixed(7)}&z=19&ovl=8`;
  // Mapy.com has panoramas of the Czech Republic only (Bára 16. 11. 2026).
  pano.hidden = !!mapyKey || !country.panorama;
  $("#pano-btn").hidden = !mapyKey || !country.panorama;
}

// ---------- street panorama (Mapy.com) ----------
// The nearest panorama to the cut, looking along the street the way the profile is drawn (A on the
// left, B on the right). state.cut.bearing is the street's direction, and looking along it A lies on
// the left (checked on Seifertova: the parked cars on the B side show on the right); radians from north. The Mapy.com script is
// loaded on the first click only, and nothing from it is stored (Mapy.com API terms, 4.6.2).
const local = ["localhost", "127.0.0.1"].includes(location.hostname);
const mapyKey = MAPY_KEY || (local ? await import("./config.local.js").then((m) => m.MAPY_KEY, () => "") : "");
let panoLib, panoView;
const loadPano = () => (panoLib ??= new Promise((res, rej) => {
  const s = Object.assign(document.createElement("script"), { src: "https://api.mapy.cz/js/panorama/v1/panorama.js", async: true });
  s.onload = () => (window.Panorama ? res(window.Panorama) : rej(new Error(tr("Panorama se nenačetla."))));
  s.onerror = () => { panoLib = null; rej(new Error(tr("Panorama Mapy.com se nenačetla."))); };
  document.head.append(s);
}));
$("#pano-btn").onclick = async () => {
  if (!state.cut || !mapyKey) return;
  const { lat, lon, bearing } = state.cut;
  const dlg = $("#pano-dialog");
  $("#pano-out").href = $("#pano-link").href;
  $("#pano-note").textContent = tr("Načítám…");
  dlg.showModal();
  try {
    const P = await loadPano();
    panoView?.destroy?.();
    $("#pano-view").replaceChildren();
    const yaw = (((bearing % 360) + 360) % 360) * (Math.PI / 180);
    panoView = await P.panoramaFromPosition({
      parent: $("#pano-view"), lon, lat, apiKey: mapyKey, radius: 60, yaw, pitch: 0, fov: 1.3, showNavigation: true, lang: PANO_LANGS.has(lang) ? lang : "en",
    });
    if (panoView?.errorCode && panoView.errorCode !== "NONE") {
      $("#pano-note").textContent = panoView.errorCode === "PANORAMA_NOT_FOUND" ? tr("Tady panorama Mapy.com nemají.") : tr("Panorama nejde zobrazit ({error}).", { error: panoView.error || panoView.errorCode });
      return;
    }
    const d = panoView?.info?.date;
    $("#pano-note").textContent = d ? tr("snímek z {d}. {m}. {y}", { d: +d.slice(8, 10), m: +d.slice(5, 7), y: d.slice(0, 4) }) : "";
  } catch (err) {
    $("#pano-note").textContent = err.message;
  }
};
$("#pano-close").onclick = () => $("#pano-dialog").close();
$("#pano-dialog").addEventListener("close", () => { panoView?.destroy?.(); panoView = null; });

$("#btn-copy-cut").onclick = async () => {
  if (!state.cut) return;
  const text = `${cutText(state.cut)} (${streetName(state.cut)}) ${location.href}`;
  try { await navigator.clipboard.writeText(text); status(tr("Poloha řezu je ve schránce."), "ok"); }
  catch { try { prompt(tr("Zkopírujte polohu řezu:"), text); } catch { status(text, "ok"); } } // no prompt in some web views
};

// Paste "lat, lon · azimut N°" (or a #rez= link) to jump to a cut.
function parseCut(text) {
  const m = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)(?:[^\d]+?(\d+(?:\.\d+)?)\s*°?)?/);
  const h = parseCutHash(text);
  if (h) return h;
  if (!m) return null;
  return { lat: +m[1], lon: +m[2], bearing: m[3] !== undefined ? +m[3] + 90 : null };
}

$("#cut-goto").onchange = (e) => {
  const c = parseCut(e.target.value);
  if (!c) return status(tr("Polohu jsem nepoznala. Vložte třeba: {example} · azimut 344°", { example: city.example }), "error");
  map.setView([c.lat, c.lon], 19);
  cutAt(c.lat, c.lon, false, c.bearing, c.reach, null, c.way);
  e.target.value = "";
};

function drawMtvu(polys) {
  mtvuLayer.clearLayers();
  for (const p of polys) {
    L.polygon(p.lonlat, {
      color: MTVU_COLORS[p.code] || "#8fbf55", weight: 1, fillOpacity: 0.25, interactive: false, pane: PLOCHY_PANE,
    }).addTo(mtvuLayer);
  }
}

// The hint on dragging the cut shows until the cut is first dragged (Fable: not for good under the map).
const HELP_KEY = "profily-napoveda";
const helpSeen = () => { try { return localStorage.getItem(HELP_KEY) === "1"; } catch { return false; } };
function markHelp() {
  if (helpSeen()) return;
  try { localStorage.setItem(HELP_KEY, "1"); } catch {}
  $("#map-help").hidden = true;
}
// Live preview while dragging: the line follows the handle; the profile is recomputed on drop.
function previewCut(lat, lon, normal, skip, reach = cutSpan(state.cut)) {
  markHelp();
  const f = localFrame(lat, lon);
  const ll = cutEnds(f, normal, reach).map(([x, y]) => [y, x]);
  cutLine.setLatLngs(ll);
  selLine.setLatLngs([]);
  if (skip !== centerMarker) centerMarker.setLatLng([lat, lon]);
  endMarkers.forEach((m, i) => { if (m !== skip) m.setLatLng(ll[i]); });
}

centerMarker.on("drag", () => {
  const ll = centerMarker.getLatLng();
  const f = localFrame(ll.lat, ll.lng);
  let lat = ll.lat, lon = ll.lng;
  let r = (state.cut.bearing * Math.PI) / 180;
  let dir = [Math.sin(r), Math.cos(r)];
  if (osmCache?.way) {
    // Snap to the street as the drop will, so the preview matches the result.
    const near = dragAlong(osmCache.osm, f, osmCache.way, [0, 0]);
    [lon, lat] = f.toLonLat(...near.point);
    // The way's direction may run against the cut's: keep the cut's, or A and B swap sides while dragging (Bára 27. 11. 2026).
    dir = near.dir[0] * dir[0] + near.dir[1] * dir[1] < 0 ? [-near.dir[0], -near.dir[1]] : near.dir;
  }
  previewCut(lat, lon, [-dir[1], dir[0]], centerMarker);
});
// Dragging an end turns the cut and sets how far the profile reaches on that side.
function endDrag(m, i) {
  const ll = m.getLatLng();
  const f = localFrame(state.cut.lat, state.cut.lon);
  const [x, y] = f.toXY(ll.lng, ll.lat);
  const len = Math.hypot(x, y) || 1;
  const normal = i === 0 ? [-x / len, -y / len] : [x / len, y / len];
  const side = i === 0 ? "right" : "left";
  const reach = { ...(state.cut.reach || defaultReach()), [side]: Math.max(MIN_REACH, Math.min(MAX_HALF - HALF_PAD, len)) };
  return { normal, reach };
}

endMarkers.forEach((m, i) => m.on("drag", () => {
  const { normal, reach } = endDrag(m, i);
  const side = i === 0 ? "right" : "left";
  previewCut(state.cut.lat, state.cut.lon, normal, m, { ...cutSpan(state.cut), [side]: reach[side] });
}));

centerMarker.on("dragend", () => {
  const ll = centerMarker.getLatLng();
  cutAt(ll.lat, ll.lng, true);
});
endMarkers.forEach((m, i) => m.on("dragend", () => {
  const { normal, reach } = endDrag(m, i);
  // normal = (-cos b, sin b) for the street bearing b.
  const bearing = (Math.atan2(normal[1], -normal[0]) * 180) / Math.PI;
  cutAt(state.cut.lat, state.cut.lon, true, bearing, reach);
}));

// ---------- profile ----------
function current() {
  return state.mode === "navrh" ? state.navrh : state.stav;
}

// The cut's street as shown: its name, or "ulice 123" in the page's language. The cut keeps the name of the data
// only (empty for a street without one) and its note as the Czech text, so a saved cut reads in either language
// and the log gets the same name whatever the visitor's language (Fable's review).
// The kind of street the norms of a city may go by (rules.js; San Francisco's sidewalks): an alley, another service road.
const streetKind = (tags) => (tags?.highway !== "service" ? null : tags.service === "alley" ? "alley" : "service");
const streetName = (c) => c?.name || (c?.wayId ? tr("ulice {id}", { id: c.wayId }) : tr("Ulice"));

// Stav is for looking at the street as it is; its data can be corrected only after "Opravit data"
// (state.fixing), so nothing changes by accident. Návrh is always editable.
const canEdit = () => state.mode === "navrh" || (state.mode === "stav" && state.fixing);
// render() rebuilds the drawing, the editor and the palette: keyboard focus inside them goes back
// to the same place (the selected part, or the control at the same position, so "+ + +" keeps
// working) instead of falling to the top of the page.
// A field changed by Tab has lost the focus when its change redraws the editor (Fable: the size fields could not be
// filled in one after another): the focus goes on from that field, to the next one (or back with Shift).
const FOCUSABLE = "button, select, input, label.btn, [tabindex]";
let changed = null, tabbed = 0;
addEventListener("change", (e) => { changed = e.target; }, true);
addEventListener("keydown", (e) => { tabbed = e.key === "Tab" ? (e.shiftKey ? -1 : 1) : 0; }, true);
function render() {
  // Sign icons load on first use; the drawing is redone once they are there.
  loadSigns(state.stav, state.navrh).then((fresh) => fresh && render(), () => {});
  const left = document.activeElement === document.body && changed?.isConnected;
  const a = left ? changed : document.activeElement;
  changed = null;
  const box = a?.closest?.("#profile, #editor, #palette");
  const index = box && box.id !== "profile" ? [...box.querySelectorAll(FOCUSABLE)].indexOf(a) + (left ? tabbed : 0) : -1;
  draw();
  drawSelection();
  loadUnderground(); // a cut restored from storage or a link asks for its networks too (once per cut)
  drawNetLines();
  if (!box) return;
  let target;
  if (box.id === "profile") target = $(`#profile g.seg[data-i="${state.selected ?? a.dataset?.i}"]`);
  else {
    const all = [...$(`#${box.id}`).querySelectorAll(FOCUSABLE)];
    target = all[Math.min(index, all.length - 1)] || $("#editor .ed-head h3");
  }
  if (target) {
    if (!target.hasAttribute("tabindex") && !/^(BUTTON|SELECT|INPUT)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}

// Whose data the profile shows: the city's, and a town's passport when the cut took it (towns/pasporty.js; Bára:
// the cut's information should say where its data come from).
// The Slovak towns whose road passports a cut may take (towns/slovensko.js SK_TOWNS), by the town's name in the genitive.
const SK_EDGES_TOWN = { nitra: "Nitra", piestany: "Piešťany", zvolen: "Zvolen", hlohovec: "Hlohovec", presov: "Prešov", "bratislava-tm": "Bratislava" };
const SK_PASSPORT_TOWN = { bratislava: "Bratislava", presov: "Prešov", zilina: "Žilina", bystrica: "Banská Bystrica", kosice: "Košice", zvolen: "Zvolen" };
function cutData() {
  // Vienna's map of surfaces (towns/austria.js).
  if (state.cut?.sources?.atTown === "wien") return tr("mapy povrchů města Vídně a OSM");
  const deTown = state.cut?.sources?.deTown;
  if (deTown === "berlin") return tr("mapy povrchů ulic Berlína a OSM");
  if (deTown === "hamburg") return tr("mapy povrchů ulic Hamburku a OSM");
  if (deTown === "aachen") return tr("databáze ulic Cách a OSM");
  // Switzerland's and Liechtenstein's cadastral survey (towns/switzerland.js).
  if (state.cut?.sources?.chAv) return tr("úředního vyměřování, SWISSIMAGE a OSM");
  // The Netherlands' national large-scale topography (towns/netherlands.js).
  if (state.cut?.sources?.nlBgt) return tr("mapy povrchů BGT, ortofota PDOK a OSM");
  // Kraków's base map (towns/poland.js).
  if (state.cut?.sources?.plTown === "krakow") return tr("mapy povrchů Krakova, ortofota GUGiK a OSM");
  // Paris's Plan de voirie (towns/france.js).
  if (state.cut?.sources?.frTown === "paris") return tr("mapy povrchů Paříže, ortofota IGN a OSM");
  // Bologna's road areas (towns/italy.js).
  if (state.cut?.sources?.eeTown === "tallinn") return tr("mapy povrchů Tallinnu, ortofota a OSM");
  // Helsinki's register of public areas (towns/finland.js).
  if (state.cut?.sources?.fiTown === "helsinki") return tr("mapy povrchů Helsinek, ortofota a OSM");
  // Vilnius's topographic areas (towns/lithuania.js).
  if (state.cut?.sources?.ltTown === "vilnius") return tr("mapy povrchů Vilniusu a OSM");
  // DC's Planimetrics and DDOT's inventory (towns/usa.js).
  if (state.cut?.sources?.cityMap === "dc") return tr("mapy povrchů Washingtonu, inventáře DDOT, ortofota a OSM");
  if (state.cut?.sources?.cityMap === "toronto") return tr("mapy povrchů Toronta, ortofota a OSM");
  if (state.cut?.sources?.cityMap === "nyc") return tr("mapy povrchů New Yorku, ortofota a OSM");
  if (state.cut?.sources?.cityMap === "sf") return tr("mapy povrchů San Franciska a OSM");
  // Boston's and Cambridge's surface maps (towns/boston.js).
  if (state.cut?.sources?.cityMap === "boston") return tr("mapy povrchů Bostonu, ortofota MassGIS a OSM");
  if (state.cut?.sources?.cityMap === "cambridge") return tr("mapy povrchů Cambridge, ortofota MassGIS a OSM");
  if (state.cut?.sources?.itTown === "bologna") return tr("mapy povrchů Bologni, ortofota a OSM");
  // Lombardy's DBT (towns/lombardy.js).
  if (state.cut?.sources?.itTown === "lombardia") return tr("mapy povrchů Lombardie a OSM");
  // Zaragoza's paving map (towns/spain.js).
  if (state.cut?.sources?.esTown === "zaragoza") return tr("mapy povrchů Zaragozy, ortofota PNOA a OSM");
  // Flanders' road corridors and their division (towns/belgium.js).
  if (state.cut?.sources?.beTown === "grb") return tr("mapy povrchů GRB, ortofota a OSM");
  // Belgium's regional maps whose lines placed the kerbs (towns/belgium.js).
  if (state.cut?.sources?.skEdges === "grb") return tr("čar mapy GRB, ortofota a OSM");
  if (state.cut?.sources?.skEdges === "picc") return tr("čar mapy PICC, ortofota a OSM");
  const sk = state.cut?.sources?.skTown, edges = SK_EDGES_TOWN[state.cut?.sources?.skEdges];
  // The lines of a town's map that placed the kerbs (towns/slovensko.js EDGE_SOURCES; Bára: the data really used).
  if (SK_PASSPORT_TOWN[sk] && edges === SK_PASSPORT_TOWN[sk]) return tr("pasportu komunikací a mapy města {town}, ZBGIS a OSM", { town: edges });
  if (SK_PASSPORT_TOWN[sk]) return tr("pasportu komunikací města {town}, ZBGIS a OSM", { town: SK_PASSPORT_TOWN[sk] });
  if (edges) return tr("mapy města {town}, ZBGIS a OSM", { town: edges });
  const id = state.cut?.sources?.passport;
  if (!PASSPORT_NAMES[id]) return city.dataShort;
  return GREEN_PASSPORTS.has(id) ? tr("pasportu zeleně města {town}, technické mapy ČÚZK a OSM", { town: PASSPORT_NAMES[id] })
    : tr("pasportu komunikací města {town}, technické mapy ČÚZK a OSM", { town: PASSPORT_NAMES[id] });
}
function draw() {
  document.title = state.stav && state.cut ? `${streetName(state.cut)} – ${tr("Profily ulic")}` : tr("Profily ulic");
  document.querySelectorAll(".seg-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === state.mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  });
  const box = $("#profile");
  document.body.dataset.mode = state.stav ? state.mode : "";
  // Where the parts come from matters while looking at the data, not while designing (Fable's look at the interface).
  $("#legend").hidden = !state.stav || state.mode !== "stav";
  $("#profile-head").hidden = !state.stav;
  $("#map-help").hidden = !state.stav || helpSeen();
  $("#stav-cta").hidden = !state.stav || state.mode !== "stav";
  $("#stav-cta").classList.toggle("fixing", !!state.fixing);
  $("#stav-text").textContent = state.fixing
    ? tr("Opravujete data stavu: táhněte úchyty nebo klikněte na část. Opravené části se označí jako upravené ručně.")
    : tr("Takhle ulice vypadá podle dat {data}. Nesedí? Opravte je, nebo nám chybu nahlaste.", { data: cutData() });
  $("#btn-fix").textContent = state.fixing ? tr("Hotovo") : tr("Opravit data");
  // The footer's short line names the data of the cut's place (Bára: IPR only in Prague), the general services
  // without a cut; the opened footer keeps all the sources.
  $("#footer-data").textContent = state.stav && state.cut ? tr("Data {data}", { data: cutData() }) : tr("Data © státní a městské mapové služby a OpenStreetMap");
  if (state.stav) {
    // Under the street's name: the width, and in every mode what the data of the street are (an estimate, a map that
    // failed…; Bára 16. 11. 2026 after Fable: an estimate is not forgotten while designing).
    $("#profile-sub").textContent = tr("Celkem {w}", { w: fmtM(totalWidth(state.mode === "navrh" ? state.navrh : state.stav)) }) + tr(state.cut?.note || "");
  }
  if (!state.stav) {
    box.innerHTML = `<div class="empty">
      <img src="${city.emptyImg}" alt="" width="96" height="126">
      <div><h1 class="empty-title">${tr("Příčný profil ulice")}</h1>
      <ol><li>${tr("Klikněte v mapě na ulici. Kde profily umíme, ukazuje mapa v okně O aplikaci.")}</li><li>${tr("Profil od fasády k fasádě se sestaví z otevřených dat: map povrchů měst, ortofot a OSM. Zdroje konkrétního řezu jsou vždy pod profilem.")}</li>
      <li>${tr("V režimu Návrh ho upravíte: táhněte hranice, klikněte na část, přidejte novou.")}</li></ol></div></div>`;
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    renderShares();
    return;
  }
  if (state.mode === "porovnat") {
    box.replaceChildren();
    const changed = changedParts(state.stav, state.navrh);
    // One depth of earth for both, so they keep one scale (a rainwater object in the design only, Fable).
    const deep = Math.max(underDepth(state.stav), underDepth(state.navrh));
    for (const [title, p, opts] of [[tr("Stav"), state.stav, { deep }], [tr("Návrh"), state.navrh, { changed, deep }]]) {
      const h = Object.assign(document.createElement("h3"), { className: "compare-title", textContent: title });
      if (opts.changed?.size) h.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr(" · změněné části jsou obtažené") }));
      box.append(h, buildSvg(p, opts));
    }
    box.appendChild(diffList(state.stav, state.navrh));
    renderShares();
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    $("#rule-check").hidden = true; // the design's warnings belong to Návrh (they stayed from another street, Fable)
    renderWidthCheck();
    fitPhone(box);
    return;
  }
  const p = current();
  mountEditor(box, p, {
    editable: canEdit(),
    selected: state.selected,
    onSelect: (i) => { state.selected = i; state.edge = null; render(); },
    selectedEdge: state.edge,
    onEdge: (side) => { state.edge = side; state.selected = null; render(); },
    onChange: () => { edited(); render(); },
    onRedraw: (b) => fitLabels(b),
    underground: undergroundFor(),
  });
  renderEditor(p);
  if (state.mode === "navrh") renderPalette(p);
  else $("#palette").replaceChildren();
  renderWidthCheck();
  renderRuleCheck(p, box);
  renderShares();
  fitPhone(box);
}

// How the street's width is shared out, as one bar per profile (Stav and Návrh side by side in
// Porovnat), with the groups' metres and per cent.
function renderShares() {
  const box = $("#shares");
  if (!state.stav) { box.hidden = true; return; }
  box.hidden = false;
  box.replaceChildren();
  shareBars(box, tr("Podíl prostoru ulice"), shares, ["auta", "mhd", "kola"], tr("Sdílené pruhy a stezky se počítají napůl (např. pruh s tramvají půl MHD, půl auta)."));
  // How much of it lets the rain in (Magdalena, 13. 11. 2026), by the parts' surfaces.
  shareBars(box, tr("Povrch ulice"), surfaces, ["nepropustne"]);
}
// One bar per profile (Stav and Návrh in Porovnat) of the groups of fn (shares.js), with the groups' metres and per
// cent, in Porovnat with the share before; dark: groups with white figures.
function shareBars(box, heading, fn, dark, note) {
  const rows = state.mode === "porovnat" ? [[tr("Stav"), state.stav], [tr("Návrh"), state.navrh]] : [[null, current()]];

  const sec = box.appendChild(Object.assign(document.createElement("section"), { className: "share-sec" }));
  sec.append(Object.assign(document.createElement("h3"), { textContent: heading }));
  const before = state.mode === "porovnat" ? Object.fromEntries(fn(state.stav).map((g) => [g.key, g.pct])) : null;
  for (const [title, p] of rows) {
    const row = Object.assign(document.createElement("div"), { className: "share-row" });
    if (title) row.append(Object.assign(document.createElement("span"), { className: "share-title", textContent: title }));
    const bar = Object.assign(document.createElement("div"), { className: "share-bar", role: "img" });
    const list = fn(p).filter((g) => g.m > 0);
    bar.setAttribute("aria-label", `${heading}: ` + list.map((g) => `${g.label} ${pct(g.pct)}`).join(", "));
    for (const g of list) {
      const part = Object.assign(document.createElement("span"), { title: `${g.label}: ${fmtM(g.m)} (${pct(g.pct)})` });
      part.style.flexGrow = g.m;
      part.style.background = g.color;
      if (g.pct >= 9) part.textContent = pct(g.pct);
      if (dark.includes(g.key)) part.classList.add("dark");
      bar.append(part);
    }
    row.append(bar);
    sec.append(row);
  }
  // The legend: every group with its share (and in Porovnat the share before, Fable: "p. b." is for experts).
  const legend = Object.assign(document.createElement("div"), { className: "share-legend" });
  for (const g of fn(state.mode === "porovnat" ? state.navrh : current())) {
    if (!g.m && !(before && before[g.key])) continue;
    const d = before ? Math.round(g.pct - before[g.key]) : 0;
    const item = Object.assign(document.createElement("span"), { textContent: `${g.label} ${fmtM(g.m)} · ${pct(g.pct)}${d ? ` (${tr("bylo {p}", { p: pct(before[g.key] || 0) })})` : ""}` });
    item.style.setProperty("--c", g.color);
    legend.append(item);
  }
  sec.append(legend);
  if (note) sec.append(Object.assign(document.createElement("div"), { className: "share-note", textContent: note }));
}

// Parts of the design that differ from the current state: edited by hand, or (same parts in the
// same order) of another width, or with another rainwater object under them, paving or items (Fable's review:
// changes a width does not show).
const hidden = (s) => JSON.stringify([s.under || "", s.under ? underSize(s) : "", s.permeable || "", s.bed || "", (s.items || []).map((it) => [it.kind, it.h || 0, !!it.along])]);
function changedParts(a, b) {
  const same = a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type);
  const out = new Set();
  b.segments.forEach((s, i) => {
    if (same ? Math.abs(s.width - a.segments[i].width) >= 0.01 || hidden(a.segments[i]) !== hidden(s) : s.source === "user") out.add(i);
  });
  return out;
}

// What the design changes, part by part: same parts in the same order compare width by width;
// otherwise the parts that came and went.
function diffList(a, b) {
  const div = Object.assign(document.createElement("div"), { className: "diff" });
  const name = (s) => partLabel(s);
  const items = [];
  if (a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type)) {
    a.segments.forEach((s, i) => {
      const d = +(b.segments[i].width - s.width).toFixed(2);
      if (d) items.push({ i, text: `${name(s)}: ${fmtM(s.width)} → ${fmtM(b.segments[i].width)} (${d > 0 ? "+" : "−"}${fmtM(Math.abs(d))})` });
      else if (TYPES[s.type]?.bed && (s.bed || "panely") !== (b.segments[i].bed || "panely")) items.push({ i, text: tr("{type}: povrch tělesa {from} → {to}", { type: name(s), from: TRAM_BEDS[s.bed || "panely"]?.label, to: TRAM_BEDS[b.segments[i].bed || "panely"]?.label }) });
      else if ((s.under || "") !== (b.segments[i].under || "")) items.push({ i, text: tr("{type}: pod povrchem {what}", { type: name(s), what: HDV_UNDER[b.segments[i].under]?.label || tr("nic") }) });
      else if (hidden(s) !== hidden(b.segments[i])) items.push({ i, text: tr("{type}: jiné prvky, povrch nebo co je pod povrchem", { type: name(s) }) });
    });
  } else {
    const count = (p) => p.segments.reduce((m, s) => m.set(name(s), (m.get(name(s)) || 0) + s.width), new Map());
    const ca = count(a), cb = count(b);
    for (const k of new Set([...ca.keys(), ...cb.keys()])) {
      const wa = ca.get(k) || 0, wb = cb.get(k) || 0;
      if (Math.abs(wa - wb) >= 0.01) items.push({ text: `${k}: ${wa ? fmtM(wa) : "–"} → ${wb ? fmtM(wb) : "–"}` });
    }
  }
  div.innerHTML = `<h3>${tr("Změny v návrhu")}</h3>`;
  const ul = document.createElement("ul");
  for (const it of items.length ? items : [{ text: tr("Návrh je zatím stejný jako stav.") }]) {
    const li = Object.assign(document.createElement("li"), { textContent: it.text });
    if (it.i !== undefined) {
      // Pointing at a change lights up that part in both profiles.
      const mark = (on) => document.querySelectorAll(`#profile g.seg[data-i="${it.i}"]`).forEach((g) => g.classList.toggle("hover", on));
      li.onmouseenter = () => mark(true);
      li.onmouseleave = () => mark(false);
    }
    ul.append(li);
  }
  div.append(ul);
  return div;
}

// Widths against the IPR manual (rules.js; in Brno only as a guide), in Návrh only: a list under the profile and the parts
// outlined in the drawing (red: below the minimum, orange: below the basic width). A click on a
// line selects that part.
function renderRuleCheck(p, box) {
  const el = $("#rule-check");
  if (state.mode !== "navrh") { el.hidden = true; return; }
  // The widths by the manual, and (with the networks on) rainwater objects and new trees near a network: each under
  // its own head.
  const nets = undergroundFor(), widths = checkRules(p, state.cut), clashes = [...checkUnder(p, nets), ...checkTrees(p, state.stav, nets)];
  const found = [...widths, ...clashes];
  for (const f of found) box.querySelector(`g.seg[data-i="${f.i}"]`)?.classList.add(`warn-${f.level}`);
  if (!found.length) { el.hidden = true; el.replaceChildren(); return; }
  el.hidden = false;
  el.replaceChildren();
  for (const [head, list] of [[city.rulesHead, widths], [tr("Sítě pod zemí:"), clashes]]) if (list.length) el.append(Object.assign(document.createElement("div"), { textContent: head }), warnList(list));
}
function warnList(found) {
  const ul = document.createElement("ul");
  for (const f of found) {
    const li = Object.assign(document.createElement("li"), { className: f.level });
    // Short, with the rule after it in grey (Fable: the long sentences with brackets in brackets read badly).
    if (f.short) li.append(Object.assign(document.createElement("strong"), { textContent: f.short }), " ", Object.assign(document.createElement("span"), { className: "muted", textContent: f.why }));
    else li.textContent = f.text;
    li.onclick = () => { state.selected = f.i; render(); };
    li.tabIndex = 0;
    li.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.onclick(); } };
    ul.append(li);
  }
  return ul;
}

// The street is as wide as the current state (façade to façade): the design must fill exactly that
// width. Shown in Návrh and Porovnat; "Dorovnat" puts the difference into the selected part (or the
// widest one).
const fmtM = (v) => `${num(v)} m`;
function renderWidthCheck() {
  const box = $("#width-check");
  // In Návrh against the street; while correcting the data (Stav), against the width measured before.
  const fixing = state.mode === "stav" && state.fixing && state.fixBase;
  if (!state.stav || !state.navrh || (state.mode === "stav" && !fixing)) { box.hidden = true; return; }
  const edit = fixing ? state.stav : state.navrh;
  const target = fixing ? state.fixBase : totalWidth(state.stav), now = totalWidth(edit);
  const diff = +(now - target).toFixed(2);
  box.hidden = false;
  box.className = Math.abs(diff) < 0.01 ? "ok" : "off";
  // Only when the width does not fit (Fable: "drží šířku" all the time said nothing).
  if (Math.abs(diff) < 0.01) { box.hidden = true; return; }
  const v = { d: fmtM(Math.abs(diff)), w: fmtM(target), now: fmtM(now) };
  box.textContent = fixing
    ? (diff > 0 ? tr("Po opravách je profil o {d} širší než změřená ulice ({w}, teď {now}).", v) : tr("Po opravách je profil o {d} užší než změřená ulice ({w}, teď {now}).", v))
    : (diff > 0 ? tr("Návrh je o {d} širší než ulice ({w}, návrh {now}).", v) : tr("Návrh je o {d} užší než ulice ({w}, návrh {now}).", v));
  if (state.mode !== "navrh" && !fixing) return;
  const segs = edit.segments;
  // The selected part when it can take the difference, else the widest part that can.
  const fits = (x) => x && x.width - diff >= 0.5;
  const seg = fits(segs[state.selected]) ? segs[state.selected]
    : segs.filter(fits).reduce((b, x) => (!b || x.width > b.width ? x : b), null);
  if (!seg) return;
  const btn = document.createElement("button");
  btn.textContent = tr("Dorovnat: {type} na {w}", { type: partLabel(seg), w: fmtM(seg.width - diff) });
  btn.onclick = () => {
    seg.width = +(seg.width - diff).toFixed(2);
    seg.source = "user";
    edited();
    render();
  };
  box.append(" ", btn);
}

// A wide street would shrink to unreadable: the profile keeps a minimum scale (px per cm of the drawing;
// more on a phone, where fingers need bigger targets) and scrolls sideways instead.
const MIN_SCALE = { phone: 0.17, desktop: 0.17 };
// The width goes into a CSS variable, so drawings the editor redraws while dragging keep it.
// The magnifier (Bára: wide streets and the networks under them): the drawing's width times zoom, the wrap
// scrolling; the view keeps its middle.
const ZOOM_MAX = 6;
let zoom = 1;
for (const b of document.querySelectorAll("#zoom-ctl button")) b.onclick = () => {
  const wrap = $("#profile-wrap"), mid = (wrap.scrollLeft + wrap.clientWidth / 2) / (wrap.scrollWidth || 1);
  zoom = Math.min(ZOOM_MAX, Math.max(1, zoom * (b.dataset.z === "1" ? 1.5 : 1 / 1.5)));
  if (zoom < 1.05) zoom = 1;
  fitPhone();
  wrap.scrollLeft = mid * wrap.scrollWidth - wrap.clientWidth / 2;
};
// The networks' tip: the name and depth by the pointer at once (no waiting for a title), a tap on a phone.
function netTip(e) {
  const g = e.target.closest?.(".networks g[data-tip]"), tip = $("#net-tip");
  if (!g) { tip.hidden = true; return; }
  tip.textContent = g.dataset.tip;
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8), y = Math.max(8, e.clientY - tip.offsetHeight - 12);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}
$("#profile").addEventListener("pointermove", netTip);
$("#profile").addEventListener("pointerdown", netTip);
$("#profile").addEventListener("pointerleave", () => { $("#net-tip").hidden = true; });

function fitPhone(box = $("#profile")) {
  const vbWidth = Math.max(0, ...[...box.querySelectorAll("svg")].map((svg) => Number(svg.getAttribute("viewBox")?.split(" ")[2]) || 0));
  const scale = matchMedia("(max-width: 760px)").matches ? MIN_SCALE.phone : MIN_SCALE.desktop;
  const width = Math.max(box.clientWidth, vbWidth * scale) * zoom;
  box.style.setProperty("--fit-width", `${width}px`);
  box.classList.toggle("zoomed", zoom > 1);
  $("#zoom-ctl [data-z='-1']").disabled = zoom <= 1;
  $("#zoom-ctl [data-z='1']").disabled = zoom >= ZOOM_MAX;
  box.closest("#profile-wrap")?.classList.toggle("scrolls", width > box.clientWidth + 1);
  scrollFade();
  requestAnimationFrame(() => fitLabels(box));
}

const coarse = matchMedia("(pointer: coarse)").matches;
// Labels in the drawing keep a readable size on screen (k = drawing units per CSS pixel); a label
// wider than its part shrinks a little, and a name that still does not fit is left out.
const SIGN_PX = 32; // width of a basic traffic sign under the profile on screen (CSS px)
const LABEL_PX = { "lbl-w": 13, "lbl-t": 11, "lbl-total": 14, "lbl-title": 13, "lbl-floor": 11 };
function fitLabels(box) {
  for (const svg of box.querySelectorAll("svg")) {
    const [, , vw, vh] = (svg.getAttribute("viewBox") || "").split(" ").map(Number);
    const rect = svg.getBoundingClientRect();
    // A height cap shrinks the drawing inside its box (preserveAspectRatio meet): use the tighter fit.
    const k = Math.max(vw / (rect.width || 1), vh / (rect.height || 1));
    if (!isFinite(k) || k <= 0) continue;
    // When any part is too narrow for "3,60 m", all widths go without the unit (it stays at Celkem).
    const widths = [...svg.querySelectorAll("text.lbl-w")];
    for (const t of widths) { t.dataset.full ??= t.textContent; t.dataset.row = 0; }
    const bare = widths.some((t) => t.dataset.full.length * 0.56 * LABEL_PX["lbl-w"] * k > Number(t.dataset.w));
    for (const t of widths) t.textContent = bare ? t.dataset.full.replace(/ m$/, "") : t.dataset.full;
    for (const t of svg.querySelectorAll("text.lbl-floor")) {
      // Floors over a slim building: the height is left out before the label runs into A/B.
      t.dataset.full ??= t.textContent;
      const short = t.dataset.full.split(" · ")[0];
      t.textContent = t.dataset.full.length * 0.56 * 10 * k > Number(t.dataset.w) ? short : t.dataset.full;
    }
    // Names drawn on two lines start again from one line (data-full).
    for (const t of svg.querySelectorAll("text.lbl-t[data-full]:not(.lbl-floor)")) t.textContent = t.dataset.full;
    for (const t of svg.querySelectorAll("text.lbl-w, text.lbl-t, text.lbl-total, text.lbl-title, text.lbl-floor")) {
      const cls = ["lbl-w", "lbl-total", "lbl-t", "lbl-title", "lbl-floor"].find((c) => t.classList.contains(c));
      let size = LABEL_PX[cls] * k;
      const w = Number(t.dataset.w);
      const est = t.textContent.length * 0.56 * size;
      if (w && est > w * 0.96) size = Math.max((w * 0.96) / (t.textContent.length * 0.56), cls === "lbl-w" ? 11 * k : 10 * k);
      t.style.fontSize = `${size}px`;
      // The floor count above a building may reach past it (data-free), other names are left out.
      t.style.display = w && t.textContent.length * 0.56 * size > w * 1.05 && cls !== "lbl-w" && !t.dataset.free ? "none" : "";
    }
    // A long name that does not fit under its part goes on two lines before it is left out.
    for (const n of svg.querySelectorAll("text.lbl-turn")) n.dataset.row = 2;
    for (const t of svg.querySelectorAll("text.lbl-t[data-row='1'][data-full]:not(.lbl-floor)")) {
      const w = Number(t.dataset.w), full = t.dataset.full, best = twoLines(full);
      if (parseFloat(t.style.fontSize) * full.length * 0.56 <= w * 1.05 || !best) continue;
      const longest = Math.max(best[0].length, best[1].length);
      const size = Math.max(Math.min(LABEL_PX["lbl-t"] * k, (w * 0.96) / (longest * 0.56)), 10 * k);
      if (longest * 0.56 * size > w * 1.05) { t.style.display = "none"; continue; }
      t.textContent = "";
      t.style.fontSize = `${size}px`;
      t.style.display = "";
      best.forEach((line, j) => {
        const ts = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        ts.setAttribute("x", t.getAttribute("x"));
        ts.setAttribute("dy", j ? "1.15em" : "0");
        ts.textContent = line;
        t.append(ts);
      });
      // The turn arrows under it move one row down.
      for (const n of t.parentNode.querySelectorAll("text.lbl-turn")) n.dataset.row = 3;
    }
    // Rows under the ground (width, type, turns) are stacked by their screen size; when they need
    // more room than the drawing has below the ground, the drawing grows downwards.
    // Widths that would run into the one before drop a row (a narrow part has no name there).
    let prevEnd = -Infinity;
    for (const t of svg.querySelectorAll("text.lbl-w")) {
      const half = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, cx = Number(t.getAttribute("x"));
      if (cx - half < prevEnd + 4 * k) {
        t.dataset.row = 1;
        for (const n of t.parentNode.querySelectorAll("text.lbl-t:not(.lbl-floor)")) n.style.display = "none";
      } else prevEnd = cx + half;
    }
    // A width in the second row wins over a neighbour's name it would touch.
    const span = (t) => { const h = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, x = Number(t.getAttribute("x")); return [x - h - 3 * k, x + h + 3 * k]; };
    for (const t of widths.filter((t) => t.dataset.row === "1")) {
      const [a, b] = span(t);
      for (const n of svg.querySelectorAll("text.lbl-t[data-row='1']")) {
        if (n.style.display === "none") continue;
        const [c, d] = span(n);
        if (c < b && d > a) n.style.display = "none";
      }
    }
    const DROP = Number(svg.dataset.drop) || 0, GROUND = 760 + DROP, H = 1000 + DROP; // the networks' room (site.js)
    const row = (n) => GROUND + 130 + LABEL_PX["lbl-w"] * k + (n > 0 ? n * 1.3 * LABEL_PX["lbl-t"] * k : 0);
    for (const t of svg.querySelectorAll("text[data-row]")) t.setAttribute("y", row(Number(t.dataset.row)));
    const lowest = Math.max(1, ...[...svg.querySelectorAll("text[data-row]")].filter((t) => t.style.display !== "none")
      .map((t) => Number(t.dataset.row) + (t.querySelector("tspan") ? 1 : 0)));
    // The row of traffic signs below the labels, at a readable size on screen (profile.js layoutSigns).
    const signsEnd = layoutSigns(svg, SIGN_PX * k, row(lowest) + 0.9 * LABEL_PX["lbl-t"] * k, k);
    const bottom = Math.max(H, row(lowest) + 0.5 * LABEL_PX["lbl-t"] * k, signsEnd);
    const [vx, vy] = svg.getAttribute("viewBox").split(" ").map(Number);
    if (Math.abs(vy + vh - bottom) > 1) {
      svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${bottom - vy}`);
      svg.querySelector("rect.bg")?.setAttribute("height", bottom - vy);
    }
    // Drag handles: a finger-sized grab area (44 px) and a knob that stays visible on a phone.
    for (const h of svg.querySelectorAll(".handle")) {
      const grab = h.querySelector(".grab"), knob = h.querySelector("circle.knob"), arrow = h.querySelector("path.knob");
      const bx = Number(knob.getAttribute("cx")), cy = Number(knob.getAttribute("cy"));
      const w = Math.max(80, 44 * k), r = Math.max(18, 8 * k);
      grab.setAttribute("x", bx - w / 2);
      grab.setAttribute("width", w);
      // On a touch screen only the knob takes the finger: a swipe anywhere else scrolls the
      // profile instead of changing a width by accident.
      if (coarse) { grab.setAttribute("y", cy - w / 2); grab.setAttribute("height", w); }
      knob.setAttribute("r", r);
      knob.setAttribute("stroke-width", r / 3.6);
      arrow.setAttribute("transform", `translate(${bx} ${cy}) scale(${r / 18}) translate(${-bx} ${-cy})`);
    }
    layoutTop(svg, k);
    // The title tag (Stav / Návrh in Porovnat) wraps its text at the new size.
    const title = svg.querySelector("text.lbl-title"), bg = svg.querySelector("rect.title-bg");
    if (title && bg) {
      const b = title.getBBox(), pad = 7 * k;
      Object.entries({ x: b.x - pad * 1.4, y: b.y - pad, width: b.width + pad * 2.8, height: b.height + pad * 2, rx: pad * 1.2 })
        .forEach(([a, v]) => bg.setAttribute(a, v));
    }
  }
}
addEventListener("resize", () => fitPhone());

// The top row (total width, cut ends A/B) at a readable size, and the view starting just above the
// highest thing drawn: no empty sky over a street without tall buildings, no label over a roof.
function layoutTop(svg, k) {
  const [vx, vy, vw, vh] = svg.getAttribute("viewBox").split(" ").map(Number);
  let top = Infinity;
  for (const c of svg.children) {
    if (c.matches("rect.bg, .top-row, .title-bg, .lbl-title, .handle")) continue;
    if (c.dataset.top) {
      // A torn building: its visible top and the floor label over it.
      const label = c.querySelector(".lbl-floor");
      top = Math.min(top, Number(c.dataset.top), label && label.style.display !== "none" ? label.getBBox().y : Infinity);
      continue;
    }
    const b = c.getBBox();
    if (b.width && b.height) top = Math.min(top, b.y);
  }
  if (!isFinite(top)) return;
  const r = 10 * k, pad = 8 * k;
  const y0 = Math.min(top - 2 * r - pad - 10 * k, 160);
  svg.setAttribute("viewBox", `${vx} ${y0} ${vw} ${vy + vh - y0}`);
  const bg = svg.querySelector("rect.bg");
  bg?.setAttribute("y", y0);
  bg?.setAttribute("height", vy + vh - y0);
  const cy = y0 + pad + r;
  // On a narrow street the total would run into A and B: they step aside, out over the edges.
  const total = svg.querySelector("text.lbl-total.top-row");
  const mid = Number(total?.getAttribute("x") || 0);
  const half = total ? (total.textContent.length * 0.56 * parseFloat(total.style.fontSize || 14 * k)) / 2 : 0;
  const ends = [Math.min(0, mid - half - 1.4 * r), Math.max(2 * mid, mid + half + 1.4 * r)];
  let end = 0;
  for (const e of svg.querySelectorAll(".top-row")) {
    if (e.tagName === "circle") {
      e.setAttribute("cx", ends[end]); e.setAttribute("cy", cy); e.setAttribute("r", r); e.setAttribute("stroke-width", 1.5 * k);
    } else if (e === total) e.setAttribute("y", cy + 0.36 * parseFloat(e.style.fontSize || 14 * k));
    else { e.setAttribute("x", ends[end++]); e.style.fontSize = `${13 * k}px`; e.setAttribute("y", cy + 0.36 * 13 * k); }
  }
}

// A wide profile that scrolls fades out on the side where more of it is hidden.
function scrollFade() {
  const wrap = $("#profile-wrap");
  const more = wrap.classList.contains("scrolls");
  wrap.classList.toggle("fade-l", more && wrap.scrollLeft > 4);
  wrap.classList.toggle("fade-r", more && wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 4);
  $("#scroll-hint").hidden = !more;
  document.querySelector(".scroll-btn.l").hidden = !wrap.classList.contains("fade-l");
  document.querySelector(".scroll-btn.r").hidden = !wrap.classList.contains("fade-r");
}
for (const b of document.querySelectorAll(".scroll-btn")) {
  b.onclick = () => { const wrap = $("#profile-wrap"); wrap.scrollBy({ left: Number(b.dataset.dir) * wrap.clientWidth * 0.7, behavior: "smooth" }); };
}
$("#profile-wrap").addEventListener("scroll", scrollFade, { passive: true });

// ---------- splitter between the map and the profile ----------
// Desktop: the map's width in % of the window; phone (≤ 760 px): the map's height in % of the screen.
// The share is remembered per layout in localStorage.
const SPLIT_KEY = "streetdesign-split";
const splitter = $("#splitter");
const phoneLayout = () => matchMedia("(max-width: 760px)").matches;
function applySplit(share) {
  const phone = phoneLayout();
  const v = Math.max(phone ? 20 : 15, Math.min(80, share));
  document.querySelector("main").style.setProperty("--map-size", phone ? `${v}vh` : `${v}%`);
  splitter.setAttribute("aria-orientation", phone ? "horizontal" : "vertical");
  splitter.setAttribute("aria-valuenow", Math.round(v));
  map.invalidateSize();
  fitPhone();
  return v;
}
function savedSplit() {
  try { return JSON.parse(localStorage.getItem(SPLIT_KEY) || "{}")[phoneLayout() ? "phone" : "desktop"]; } catch { return undefined; }
}
function saveSplit(v) {
  try {
    const all = JSON.parse(localStorage.getItem(SPLIT_KEY) || "{}");
    all[phoneLayout() ? "phone" : "desktop"] = v;
    localStorage.setItem(SPLIT_KEY, JSON.stringify(all));
  } catch {}
}
splitter.setAttribute("aria-valuemin", 15);
splitter.setAttribute("aria-valuemax", 80);
applySplit(savedSplit() ?? (phoneLayout() ? 55 : 50));
// A window turned or narrowed into the phone layout (or back) takes that layout's share: the desktop's "50%" as the
// phone map's height left it no height at all (Fable).
matchMedia("(max-width: 760px)").addEventListener("change", () => applySplit(savedSplit() ?? (phoneLayout() ? 55 : 50)));
splitter.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  splitter.setPointerCapture(e.pointerId);
  splitter.classList.add("dragging");
  document.body.classList.add("resizing");
  const main = document.querySelector("main").getBoundingClientRect();
  let last;
  const move = (ev) => {
    last = phoneLayout()
      ? ((ev.clientY - main.top) / innerHeight) * 100
      : ((ev.clientX - main.left) / main.width) * 100;
    last = applySplit(last);
  };
  const up = () => {
    splitter.releasePointerCapture(e.pointerId);
    splitter.classList.remove("dragging");
    document.body.classList.remove("resizing");
    splitter.removeEventListener("pointermove", move);
    if (last !== undefined) saveSplit(last);
  };
  splitter.addEventListener("pointermove", move);
  splitter.addEventListener("pointerup", up, { once: true });
  splitter.addEventListener("pointercancel", up, { once: true });
});
// Keyboard: arrow keys move the splitter by 5 %.
splitter.addEventListener("keydown", (e) => {
  const step = { ArrowLeft: -5, ArrowUp: -5, ArrowRight: 5, ArrowDown: 5 }[e.key];
  if (!step) return;
  e.preventDefault();
  const cur = savedSplit() ?? (phoneLayout() ? 55 : 50);
  saveSplit(applySplit(cur + step));
});

// ---------- undo ----------
// Every change of the profile (dragging, the editor, the palette, edges) can be taken back: the
// state before it goes on a stack. A new cut or a loaded file starts a fresh history.
const UNDO_MAX = 50;
const undoStack = [], redoStack = [];
let baseline = null; // the profile as it was after the last change
const snapshot = () => JSON.stringify({ stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited });
function resetHistory() {
  undoStack.length = redoStack.length = 0;
  baseline = state.stav ? snapshot() : null;
  showUndo();
}
function showUndo() {
  $("#btn-undo").disabled = !undoStack.length;
  $("#btn-redo").disabled = !redoStack.length;
  $("#undo-bar").hidden = !undoStack.length && !redoStack.length;
}
function applySnapshot(json) {
  Object.assign(state, JSON.parse(json), { selected: null });
  baseline = json;
  save();
  render();
  showUndo();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  status(tr("Změna je vrácená."), "ok");
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  status("");
}
$("#btn-undo").onclick = undo;
$("#btn-redo").onclick = redo;
addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z" || e.target.closest?.("input, select, textarea")) return;
  e.preventDefault();
  if (e.shiftKey) redo(); else undo();
});

function edited() {
  if (state.mode === "navrh") state.navrhEdited = true;
  else if (state.fixing) state.stavEdited = true;
  // Once the design is changed here, the address no longer holds it: a reload keeps the saved work.
  if (location.hash.includes("&")) history.replaceState(null, "", location.hash.split("&")[0]);
  const now = snapshot();
  if (baseline && baseline !== now) {
    undoStack.push(baseline);
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack.length = 0;
  }
  baseline = now;
  save();
  showUndo();
}

// Stav without "Opravit data": a click on a part only tells what it is and where it comes from.
function renderInfo(ed, s) {
  if (!s) return;
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: `${partLabel(s)}, ${fmtM(s.width)}` }),
    Object.assign(document.createElement("span"), { className: "muted", textContent: tr("Zdroj: {source}", { source: SOURCES[s.source]?.label || s.source || "–" }) }));
  const close = Object.assign(document.createElement("button"), { className: "close", textContent: "×", onclick: () => { state.selected = null; render(); } });
  close.setAttribute("aria-label", tr("Zavřít"));
  head.append(close);
  ed.append(head);
}

// What stands at an edge of the street, and the look of a building ("budova" alone lets the app guess it).
const EDGE_KINDS = () => [["stavba", tr("Drobná stavba")], ["zahrada", tr("Zahrada, louka")], ["zelen", tr("Park, zeleň")], ["voda", tr("Voda")],
  ["parkoviste", tr("Parkoviště")], ["plot", tr("Plot")], ["volno", tr("Volný prostor")]];
// What stands there first, the look of a building in a select of its own (Fable: one list of 13, most of them
// "Budova – …").
function edgeKindSelect(p, side) {
  const sel = document.createElement("select");
  const current = p.edges?.[side] || "volno";
  for (const [k, t] of [["budova", tr("Budova")], ...EDGE_KINDS()]) sel.add(new Option(t, k, false, current === k));
  sel.onchange = () => {
    if (sel.value === current) return;
    p.edges = { ...p.edges, [side]: sel.value };
    delete p.edges[`${side}Style`];
    edited();
    render();
  };
  return sel;
}
function edgeLookSelect(p, side) {
  const sel = document.createElement("select");
  const info = edgeInfo(p.edges, side);
  const style = buildingStyle(info);
  // A flat-roofed office is drawn as an office, not as a panel house.
  const guess = BUILDING_STYLES[style];
  // The gabled looks only with ?stit=1 (or where the file has one).
  const offered = Object.entries(BUILDING_STYLES).filter(([k]) => HOUSE_LOOKS.gables || !GABLE_LOOKS.has(k) || p.edges?.[`${side}Style`] === k);
  for (const [k, t] of [["", tr("odhad: {guess}", { guess })], ...offered]) sel.add(new Option(t, k, false, (p.edges?.[`${side}Style`] || "") === k));
  sel.onchange = () => {
    p.edges = { ...p.edges };
    if (sel.value) p.edges[`${side}Style`] = sel.value;
    else delete p.edges[`${side}Style`];
    edited();
    render();
  };
  return sel;
}

// Floors above the ground of the building at an edge: set by hand they stand for the data's floors and height
// (profile.js edgeInfo); emptied, the data's again.
function floorsInput(p, side) {
  const data = p.edges?.[`${side}Info`]?.levels;
  const floors = Object.assign(document.createElement("input"), { type: "number", min: 1, max: 60, step: 1, value: p.edges?.[`${side}Levels`] || data || "", placeholder: "–", className: "floors" });
  floors.setAttribute("aria-label", tr("Podlaží"));
  floors.onchange = () => {
    const n = Math.round(Number(floors.value));
    // The look guessed so far stays: other floors would make the guess another house (a panel house of 2
    // floors a hall).
    const look = p.edges?.[`${side}Style`] || buildingStyle(edgeInfo(p.edges, side));
    p.edges = { ...p.edges, [`${side}Style`]: look };
    if (n >= 1 && n <= 60 && n !== data) p.edges[`${side}Levels`] = n;
    else delete p.edges[`${side}Levels`];
    edited();
    render();
  };
  return floors;
}

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

// A selected edge (Bára 12. 11. 2026: a "panel house" that is a two-storey town house, or a garden): what stands
// there and the building's floors; in Stav without "Opravit data" only what it is.
function renderEdge(ed, p, side) {
  const kind = p.edges?.[side] || "volno";
  const info = edgeInfo(p.edges, side);
  const style = kind === "budova" && buildingStyle(info, p.edges?.[`${side}Style`]);
  const name = kind === "budova" ? BUILDING_STYLES[style] + (info?.arcade ? tr(", s podloubím (OSM)") : "")
    : Object.fromEntries(EDGE_KINDS())[kind] || kind;
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: `${side === "left" ? tr("Levý okraj") : tr("Pravý okraj")}: ${name}` }));
  const close = Object.assign(document.createElement("button"), { className: "close", textContent: "×", onclick: () => { state.edge = null; render(); } });
  close.setAttribute("aria-label", tr("Zavřít výběr"));
  head.append(close);
  ed.append(head);
  if (!canEdit()) {
    if (info?.levels) ed.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("{n} podlaží", { n: info.levels }) + " · " }));
    ed.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("Změníte v Návrhu, chybu v datech opravíte tlačítkem Opravit data.") }));
    return;
  }
  const lab = (text, input) => { const l = document.createElement("label"); l.append(text, input); return l; };
  const row = ed.appendChild(Object.assign(document.createElement("div"), { className: "ed-row" }));
  row.append(lab(tr("Co tu stojí"), edgeKindSelect(p, side)));
  if (kind === "budova") row.append(lab(tr("Vzhled domu"), edgeLookSelect(p, side)), lab(tr("Podlaží"), floorsInput(p, side)));
}

// Whether the card's "Další volby" is open, for the visit: once opened it stays open from part to part.
let moreOpen = false;
// What a part with a term for a name is, in plain words (Fable: for lay people as well as experts).
const TYPE_HINTS = {
  pruleh: tr("Mělký zatravněný příkop, do kterého stéká dešťová voda a vsakuje se."),
  ryha: tr("Rýha vyplněná štěrkem, do které se vsakuje dešťová voda."),
  nadrz: tr("Nádrž, která zadrží dešťovou vodu a pomalu ji pouští dál."),
  pruh_piktokoridor: tr("Jízdní pruh se značkami kola: cyklisté jezdí s auty."),
  ochranny_pruh: tr("Cyklopruh za přerušovanou čarou: auta ho smějí přejet."),
  cyklopruh: tr("Cyklopruh za plnou čarou, jen pro cyklisty."),
  tramvaj: tr("Koleje mimo vozovku, oddělené obrubou nebo zelení."),
  tramvaj_pruh: tr("Pruh vozovky jen pro tramvaje."),
  tramvaj_v_pruhu: tr("Koleje v pruhu, kde jezdí i auta."),
  krajnice: tr("Okraj vozovky mimo jízdní pruhy."),
  obsluzna: tr("Úzká cesta k domům nebo k parkování, odděleně od jízdních pruhů."),
  delici: tr("Pás mezi jízdními směry nebo mezi vozovkou a chodníkem."),
  nastupiste: tr("Místo, kde se čeká a nastupuje do tramvaje nebo autobusu."),
};
function renderEditor(p) {
  const ed = $("#editor");
  ed.replaceChildren();
  ed.classList.remove("hint-only");
  const i = state.selected;
  const s = p.segments[i];
  if (state.edge) return renderEdge(ed, p, state.edge);
  if (!canEdit()) return renderInfo(ed, s);
  // Nothing selected: one line of what to do (Fable: the panel of the edges was in the way; a click on a house
  // at the edge opens its own card).
  if (s === undefined) {
    ed.append(Object.assign(document.createElement("p"), { className: "ed-hint muted", textContent: tr("Klikněte na část profilu nebo na dům či zahradu na kraji. Šířku změníte tažením modrých úchytů.") }));
    ed.classList.add("hint-only");
    return;
  }
  // Grouped as the palette below (Bára: the long list grouped the same way); the rest under "Další".
  const type = document.createElement("select");
  for (const [title, keys] of paletteGroups(true)) {
    const og = Object.assign(document.createElement("optgroup"), { label: title });
    for (const k of keys) { const o = new Option(TYPES[k].label, k, false, k === s.type); if (TYPE_HINTS[k]) o.title = TYPE_HINTS[k]; og.append(o); }
    type.append(og);
  }
  type.onchange = () => { retype(s, type.value); s.source = "user"; done(); };
  const width = Object.assign(document.createElement("input"), { type: "text", inputMode: "decimal", value: numField(s.width), className: "num" });
  width.onchange = () => {
    // Perpendicular parking keeps at least 4.5 m (ČSN 73 6056).
    const min = s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2;
    const v = readNum(width.value);
    if (!Number.isFinite(v)) return render(); // not a number: the width stays
    setWidth(segs, segs.indexOf(s), Math.max(min, +v.toFixed(2)));
    spreadAll(s);
    s.source = "user";
    done();
  };
  const lab = (text, input) => { const l = document.createElement("label"); l.append(text, input); return l; };
  const btn = (text, fn, cls) => { const b = document.createElement("button"); b.textContent = text; b.onclick = fn; if (cls) b.className = cls; return b; };
  const segs = p.segments;
  const done = (sel = state.selected) => {
    if (keepsPlace()) mergeHoles(segs);
    // The selection stays on a part that is still there (holes merge, so the index may be past the end).
    state.selected = sel === null || sel === undefined || !segs.length ? null : Math.min(sel, segs.length - 1);
    edited();
    render();
  };
  // A headed card (Fable's look at the interface): the part and its moves in the head; the type, the width and
  // the one choice the part is mostly about; its items and signs; the rarer choices folded under "Další volby".
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.append(Object.assign(document.createElement("h3"), { textContent: partLabel(s) }),
    Object.assign(document.createElement("span"), { className: "muted", textContent: tr("Zdroj: {source}", { source: SOURCES[s.source]?.label || s.source || "–" }) }));
  const acts = Object.assign(document.createElement("span"), { className: "ed-acts" });
  const act = (text, title, fn, cls, off) => { const b = btn(text, fn, cls); b.title = title; b.setAttribute("aria-label", title); b.disabled = !!off; return b; };
  acts.append(
    act("←", tr("Posunout doleva"), () => { if (i > 0) { [segs[i - 1], segs[i]] = [segs[i], segs[i - 1]]; done(i - 1); } }, "", i === 0),
    act("→", tr("Posunout doprava"), () => { if (i < segs.length - 1) { [segs[i + 1], segs[i]] = [segs[i], segs[i + 1]]; done(i + 1); } }, "", i === segs.length - 1),
    act(tr("Rozdělit"), tr("Rozdělit na dvě"), () => { const h = +(s.width / 2).toFixed(2); segs.splice(i, 1, { ...s, width: h, source: "user" }, { ...s, width: +(s.width - h).toFixed(2), source: "user" }); done(); }),
    // After a delete the neighbour is selected, so "Dorovnat" offers to give it the width (renderWidthCheck).
    // In Návrh and in a correction a deleted part leaves a hole of its width, so what lies beyond it stays in its place (Bára: the
    // surface must not drift from what is under it).
    act(tr("Smazat"), tr("Smazat část"), () => {
      if (keepsPlace()) { segs.splice(i, 1, { type: HOLE, width: s.width, source: "user" }); done(i); }
      else { segs.splice(i, 1); done(segs.length ? Math.max(0, i - 1) : null); }
    }, "danger", isHole(s)), // a hole is already the empty place
  );
  acts.append(btn("×", () => { state.selected = null; render(); }, "close"));
  acts.lastChild.setAttribute("aria-label", tr("Zavřít výběr"));
  head.append(acts);
  const row = (into = ed) => into.appendChild(Object.assign(document.createElement("div"), { className: "ed-row" }));
  const step = (d) => btn(d > 0 ? "+" : "−", () => { setWidth(segs, i, Math.max(minW(), +(s.width + d).toFixed(2))); spreadAll(s); s.source = "user"; done(); }, "step");
  const minW = () => (s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2);
  ed.append(head);
  // What the part is, in plain words, where its name is a term (Fable: průleh, piktokoridor… for lay people).
  if (TYPE_HINTS[s.type]) ed.append(Object.assign(document.createElement("p"), { className: "ed-hint muted", textContent: TYPE_HINTS[s.type] }));
  const r1 = row();
  const wbox = Object.assign(document.createElement("span"), { className: "stepper" });
  wbox.append(step(-0.25), width, step(0.25));
  r1.append(lab(tr("Typ"), type), lab(tr("Šířka (m)"), wbox));
  // The rarer choices: their row inside the folded box, and what is set in them named on the fold.
  const moreBox = Object.assign(document.createElement("details"), { className: "ed-more", open: moreOpen });
  moreBox.ontoggle = () => { moreOpen = moreBox.open; };
  const summary = moreBox.appendChild(document.createElement("summary"));
  const r2 = row(moreBox), set = [];
  const opt = (sel) => sel.selectedOptions[0]?.textContent;
  if (TYPES[s.type]?.directional) {
    // Away from or towards the viewer; a lane of a two-way street with one axis has no direction and is drawn
    // "↑↓" (derive.js), so it can be made and kept here too. Another part without a direction says so.
    const dir = document.createElement("select");
    const both = s.type === "pruh" ? [["", tr("↑↓ obousměrný")]] : s.dir ? [] : [["", tr("bez směru")]];
    for (const [v, t] of [["forward", tr("↑ od diváka")], ["backward", tr("↓ k divákovi")], ...both]) dir.add(new Option(t, v, false, (s.dir || "") === v));
    dir.onchange = () => {
      const was = s.dir;
      if (dir.value) s.dir = dir.value; else delete s.dir;
      // Cyclists in the lane turn with it, so contraflow stays contraflow (Bára).
      if (s.bikeDir && was && s.dir && was !== s.dir) s.bikeDir = s.bikeDir === "backward" ? "forward" : "backward";
      done();
    };
    r1.append(lab(tr("Směr jízdy"), dir));
  }
  if (s.type === "pruh" || s.type === "pruh_piktokoridor") {
    // Cyclists sharing the lane (drawn with the cars, "cyklisté ↓" in contraflow; a piktokoridor has them anyway).
    const bike = document.createElement("select");
    for (const [v, t] of [["", s.type === "pruh" ? tr("ne") : tr("po směru pruhu")], ["forward", tr("↑ od diváka")], ["backward", tr("↓ k divákovi")]]) bike.add(new Option(t, v, false, (s.bikeDir || "") === v));
    bike.onchange = () => { if (bike.value) s.bikeDir = bike.value; else delete s.bikeDir; s.source = "user"; done(); };
    r2.append(lab(tr("Cyklisté v pruhu"), bike));
    if (s.bikeDir) set.push(tr("cyklisté {dir}", { dir: opt(bike) }));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo"].includes(s.type)) {
    // Trolley wires over the lane (OSM trolley_wire): drawn above it; a bus lane under them carries the trolleybus.
    const wires = Object.assign(document.createElement("input"), { type: "checkbox", checked: !!s.wires });
    wires.onchange = () => {
      if (wires.checked) { s.wires = true; if (s.type.startsWith("bus")) s.trolley = true; } else { delete s.wires; delete s.trolley; }
      s.source = "user";
      done();
    };
    r2.append(lab(tr("Troleje") + " ", wires));
    if (s.wires) set.push(tr("troleje"));
  }
  if (s.type === "parkovani") {
    const orient = document.createElement("select");
    for (const [v, t] of [["podelne", tr("podélné")], ["sikme", tr("šikmé")], ["kolme", tr("kolmé")]]) {
      orient.add(new Option(t, v, false, (s.orient || "podelne") === v));
    }
    orient.onchange = () => {
      s.orient = orient.value;
      // ČSN 73 6056 and Manuál C.2: perpendicular stalls 5.0 m deep (4.5 m with overhang); angled ones keep the rules
      // of perpendicular stalls (rules.js), so they start at 5.0 m too.
      if ((s.orient === "kolme" || s.orient === "sikme") && s.width < 4.5) setWidth(segs, segs.indexOf(s), 5);
      s.source = "user";
      done();
    };
    r1.append(lab(tr("Stání"), orient));
    const use = document.createElement("select");
    for (const [v, t] of [["", tr("běžné")], ...Object.entries(PARKING_USE)]) use.add(new Option(t, v, false, (s.use || "") === v));
    use.onchange = () => { if (use.value) s.use = use.value; else delete s.use; s.source = "user"; done(); };
    r2.append(lab(tr("Účel"), use));
    if (s.use) set.push(opt(use));
    // Where the cars stand: in the roadway, on the sidewalk, or across the kerb (half on the sidewalk).
    const pos = document.createElement("select");
    for (const [v, t] of [["", tr("ve vozovce")], ...Object.entries(PARKING_POSITION)]) pos.add(new Option(t, v, false, (s.position || "") === v));
    pos.onchange = () => { if (pos.value) s.position = pos.value; else delete s.position; s.source = "user"; done(); };
    r2.append(lab(tr("Poloha"), pos));
    if (s.position) set.push(opt(pos));
  }
  if (TYPES[s.type]?.bed) {
    // The surface of a separate tram bed: panels, gravel or grass.
    const bed = document.createElement("select");
    for (const [v, t] of Object.entries(TRAM_BEDS)) bed.add(new Option(t.label, v, false, (s.bed || "panely") === v));
    bed.onchange = () => { s.bed = bed.value; delete s.bedGuess; s.source = "user"; done(); };
    r1.append(lab(tr("Povrch tělesa"), bed));
  }
  if (PERMEABLE_TYPES.includes(s.type)) {
    // Ordinary, permeable paving (5.1.2) or unpaved.
    const perm = document.createElement("select");
    for (const [v, label] of Object.entries(SURFACES)) perm.add(new Option(label, v, false, String(s.permeable || "") === v));
    perm.onchange = () => { const v = perm.value; if (v === "true") s.permeable = true; else if (v) s.permeable = v; else delete s.permeable; s.source = "user"; done(); };
    r2.append(lab(tr("Povrch"), perm));
    if (s.permeable) set.push(opt(perm));
  }
  // Rainwater management (Bára after Magdalena): what lies under the part.
  if (UNDER_TYPES.includes(s.type)) {
    const under = document.createElement("select");
    for (const [v, t] of [["", tr("nic")], ...Object.entries(HDV_UNDER).map(([k, u]) => [k, u.label])]) under.add(new Option(t, v, false, (s.under || "") === v));
    // Another object starts from its own default size.
    under.onchange = () => { if (under.value) s.under = under.value; else delete s.under; delete s.underSize; s.source = "user"; done(); };
    r2.append(lab(tr("Pod povrchem"), under));
    if (s.under) {
      set.push(opt(under));
      // Its size (types.js underSize; the standard sizes it by calculation): wide, from what depth, how high.
      const z = underSize(s), size = Object.assign(document.createElement("span"), { className: "under-size" });
      for (const [k, text, lo, hi] of [["w", tr("šířka"), 0.3, Math.max(0.3, s.width - 0.2)], ["top", tr("od hloubky"), 0, 5], ["h", tr("výška"), 0.2, 5]]) {
        const inp = Object.assign(document.createElement("input"), { type: "text", inputMode: "decimal", value: numField(z[k]), className: "num" });
        inp.onchange = () => {
          // An emptied field goes back to the default (Fable: it gave 0).
          const v = readNum(inp.value);
          if (!Number.isFinite(v)) { if (s.underSize) delete s.underSize[k]; }
          else s.underSize = { ...s.underSize, [k]: Math.min(hi, Math.max(lo, +v.toFixed(2))) };
          // Only what differs from the default travels in a link.
          const d = HDV_UNDER[s.under].size;
          if (s.underSize?.[k] === d[k]) delete s.underSize[k];
          if (s.underSize && !Object.keys(s.underSize).length) delete s.underSize;
          s.source = "user";
          done();
        };
        size.append(lab(text, inp));
      }
      size.append(Object.assign(document.createElement("span"), { className: "muted", textContent: tr("m; výchozí odhad, rozměr dá výpočet podle Standardů HDV") }));
      row(moreBox).append(size);
    }
  }
  if (TYPES[s.type]?.tracks) {
    // Buses may use the tram part (OSM psv / bus on the tracks).
    const bus = Object.assign(document.createElement("input"), { type: "checkbox", checked: !!s.withBus });
    bus.onchange = () => { if (bus.checked) s.withBus = true; else delete s.withBus; s.source = "user"; done(); };
    r2.append(lab(tr("I pro autobusy") + " ", bus));
    if (s.withBus) set.push(tr("i pro autobusy"));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(s.type)) {
    // The usual arrows, and the lane's own from OSM when it is another combination (named as drawn).
    const turn = document.createElement("select");
    const turns = s.turn && !TURN_CHOICES.includes(s.turn) ? [...TURN_CHOICES, s.turn] : TURN_CHOICES;
    for (const [v, t] of [["", tr("bez šipky")], ...turns.map((v) => [v, turnLabel(v)])]) {
      turn.add(new Option(t, v, false, (s.turn || "") === v));
    }
    turn.onchange = () => { if (turn.value) s.turn = turn.value; else delete s.turn; s.source = "user"; done(); };
    r2.append(lab(tr("Šipky na vozovce"), turn));
    if (s.turn) set.push(tr("šipka {turn}", { turn: opt(turn) }));
  }
  // Merging gives the part's width to its neighbour, so the street keeps its width (Bára: a shoulder that is
  // really part of the lane).
  const merge = [[i - 1, tr("Sloučit s levou")], [i + 1, tr("Sloučit s pravou")]].filter(([j]) => segs[j]).map(([j, label]) => btn(label, () => {
    segs[j].width = +(segs[j].width + s.width).toFixed(2);
    segs[j].source = "user";
    segs.splice(i, 1);
    done(j < i ? j : i);
  }));
  if (merge.length) row(moreBox).append(...merge);
  summary.append(tr("Další volby"));
  if (set.length) summary.append(Object.assign(document.createElement("span"), { className: "muted", textContent: ` · ${set.join(", ")}` }));
  // Items (furniture, barriers) inside the segment and its traffic signs (at most MAX_PER_PART): one row of tags.
  const items = document.createElement("span");
  items.className = "items";
  // The tags in the order the items stand (Fable: with three racks it was not clear which select was whose).
  if (s.items) s.items.sort((a, b) => a.f - b.f);
  (s.items || []).forEach((it, k) => {
    // A tag and its select stay together on one line (Fable).
    const pair = items.appendChild(Object.assign(document.createElement("span"), { className: "item-pair" }));
    pair.append(btn(`${ITEMS[it.kind] || it.kind} ×`, () => { s.items.splice(k, 1); spreadItems(s, it.kind); s.source = "user"; done(); }, "tag"));
    // A lamp's height and a bike rack's direction (Magdalena): a small select by its tag.
    const opts = it.kind === "lampa" ? [["", tr("výška: obvyklá")], ...LAMP_HEIGHTS.map((h) => [String(h), tr("výška {h} m", { h })])]
      : it.kind === "stojan_kola" ? [["", tr("napříč ulicí")], ["along", tr("podél ulice")]] : null;
    if (!opts) return;
    const sel = Object.assign(document.createElement("select"), { className: "item-opt" });
    sel.setAttribute("aria-label", it.kind === "lampa" ? tr("Výška lampy") : tr("Směr stojanu"));
    for (const [v, t] of opts) sel.add(new Option(t, v, false, v === (it.kind === "lampa" ? String(it.h || "") : it.along ? "along" : "")));
    sel.onchange = () => {
      if (it.kind === "lampa") { if (sel.value) it.h = Number(sel.value); else delete it.h; }
      else { if (sel.value) it.along = true; else delete it.along; spreadItems(s, it.kind); }
      s.source = "user";
      done();
    };
    pair.append(sel);
  });
  const add = document.createElement("select");
  add.setAttribute("aria-label", tr("Přidat prvek"));
  add.add(new Option(tr("+ přidat prvek"), ""));
  for (const [k, t] of Object.entries(ITEMS)) add.add(new Option(t, k));
  add.onchange = () => { if (!add.value) return; (s.items ||= []).push({ kind: add.value, f: itemPlace(segs, i, add.value) }); spreadItems(s, add.value); s.source = "user"; done(); };
  items.append(add);
  row().append(items, signTags(s.signs, MAX_PER_PART, s.type, (list) => { if (list.length) s.signs = list; else delete s.signs; done(); }));
  ed.append(moreBox);
}

// "IP 11b Parkoviště (kolmé stání)" as "Parkoviště (kolmé stání) · IP 11b".
const codeLast = (label) => label.replace(/^((?:[A-Z]{1,2} \d+[a-z]?)(?: [/+] (?:[A-Z]{1,2} \d+[a-z]?))*) (.+)$/, "$2 · $1");
// Items of a kind that stand in a row (racks, benches, planters, bollards) are set side by side across their part,
// each as wide as it is (Bára: two or three bike racks on top of each other), around where they stood; when they do
// not fit, closer together.
const KERB_SET = 0.6, ITEM_W = { stojan_kola: 1.9, lavicka: 2.2, kvetinac: 1.2, sloupek: 1.0 };
const itemWidth = (it) => (it.kind === "stojan_kola" && it.along ? 0.8 : ITEM_W[it.kind]);
function spreadItems(s, kind) {
  const row = (s.items || []).filter((it) => it.kind === kind).sort((a, b) => a.f - b.f);
  if (row.length < 2 || !ITEM_W[kind]) return;
  const ws = row.map(itemWidth), need = ws.reduce((a, w) => a + w, 0), k = Math.min(1, s.width / need);
  // The row's middle where the items' middle was, kept inside the part.
  const mid = Math.min(Math.max(row.reduce((a, it) => a + it.f, 0) / row.length * s.width, (need * k) / 2), s.width - (need * k) / 2);
  let x = mid - (need * k) / 2;
  row.forEach((it, j) => { it.f = +((x + (ws[j] * k) / 2) / s.width).toFixed(3); x += ws[j] * k; });
}
// After a part's width changed: its rows again (Fable: narrowed, they overlapped).
const spreadAll = (s) => Object.keys(ITEM_W).forEach((kind) => spreadItems(s, kind));
// Where a new item stands across its part (f): a lamp or a traction pole KERB_SET from the kerb of the nearer roadway
// beside the part, to light it or hold its wire (Bára: lamps stand by the road), else in the middle.
// The roadway is looked for across the parts between, as the drawing turns the lamp's arm (nearestRoadway); a second
// lamp or pole in the part stands at the other edge, a third and more in the middle (Fable: they stood on each other).
function itemPlace(segs, i, kind) {
  const s = segs[i];
  if (!["lampa", "sloup_trakce"].includes(kind) || s.width < 2 * KERB_SET) return 0.5;
  const kerb = KERB_SET / s.width, n = (s.items || []).filter((it) => it.kind === kind).length;
  const side = nearestRoadway(segs, i, 0.5);
  const both = ROADWAY.has(segs[i - 1]?.type) && ROADWAY.has(segs[i + 1]?.type);
  if (!side || both) return n === 0 ? 0.5 : n === 1 ? kerb : 1 - kerb;
  const near = side === "left" ? kerb : 1 - kerb;
  return +(n === 0 ? near : n === 1 ? 1 - near : 0.5).toFixed(3);
}
// Tags of traffic signs with ×, and a select to add one (a speed limit asks for its number).
function signTags(list = [], max, type, set) {
  const box = Object.assign(document.createElement("span"), { className: "items" });
  // Only the signs the state of the cut has (Slovakia has no shared zone, Fable).
  const fits = Object.keys(SIGNS).filter((k) => signFits(k, type) && drawable({ k, v: 30 }, null, country.code));
  if (!fits.length && !list.length) return box; // no sign fits a green strip, a wall…
  // The name first and the sign's number after it (Fable: "IP 11b" first says nothing to most).
  const name = (x) => codeLast(signLabel(x, country.code));
  list.forEach((x, k) => {
    const b = document.createElement("button");
    b.className = "tag";
    b.textContent = `${name(x)} ×`;
    b.onclick = () => set(list.filter((_, j) => j !== k));
    box.append(b);
  });
  if (list.length < max && fits.length) {
    const add = document.createElement("select");
    add.add(new Option(tr("+ přidat značku"), ""));
    for (const k of fits) {
      add.add(new Option(name({ k }), k));
      for (const [ck, c] of Object.entries(SIGN_CHOICES)) if (c.k === k && drawable(c, null, country.code)) add.add(new Option(name(c), ck));
    }
    add.onchange = () => {
      const k = add.value;
      if (!k) return;
      const { label, ...x } = SIGN_CHOICES[k] || { k };
      if (k === "b20a") {
        const v = Number(prompt(tr("Nejvyšší dovolená rychlost (km/h):"), "30"));
        if (!(v > 0 && v <= 200)) return render();
        x.v = Math.round(v);
      }
      set([...list, x]);
    };
    box.append(add);
  }
  return box;
}

// Parts to add, grouped as people look for them.
const PALETTE_GROUPS = [
  [tr("Pro pěší"), ["chodnik", "chodnik_kola", "nastupiste"]],
  // The shared path is first a cycling path in the lists (Bára).
  [tr("Pro cyklisty"), ["cyklopruh", "ochranny_pruh", "pruh_piktokoridor", "cyklostezka", "stezka_sdilena"]],
  [tr("Auta a autobusy"), ["pruh", "parkovani", "bus", "bus_cyklo", "obsluzna", "krajnice"]],
  [tr("Tramvaj"), ["tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj"]],
  [tr("Železnice"), ["railway"]],
  [tr("Zeleň a ostatní"), ["zelen", "stromorad", "predzahradka", "delici", "plocha", "zahradka", "zed"]],
  [tr("Hospodaření s vodou"), ["pruleh", "ryha", "nadrz", "voda"]],
];
// The palette's groups with the types in none of them under "Další" (withUnknown: the editor's list also offers
// "Neurčeno", the palette does not add it).
function paletteGroups(withUnknown = false) {
  const shown = new Set(PALETTE_GROUPS.flatMap(([, ks]) => ks));
  const rest = Object.keys(TYPES).filter((k) => !shown.has(k) && (withUnknown || k !== "nezname"));
  return [...PALETTE_GROUPS, [tr("Další"), rest]].map(([t, ks]) => [t, ks.filter((k) => TYPES[k])]).filter(([, ks]) => ks.length);
}
// The palette folded into "+ Přidat díl" (Fable: 27 parts always under the card made two screens of it); once
// opened it stays open for the visit.
let paletteOpen = false;
function renderPalette(p) {
  const pal = $("#palette");
  pal.replaceChildren();
  const box = pal.appendChild(Object.assign(document.createElement("details"), { open: paletteOpen }));
  box.ontoggle = () => { paletteOpen = box.open; };
  box.append(Object.assign(document.createElement("summary"), { className: "btn", textContent: tr("+ Přidat díl") }));
  const hint = document.createElement("div");
  hint.className = "pal-note muted";
  const selSeg = p.segments[state.selected];
  hint.textContent = state.mode === "navrh" && isHole(selSeg) ? tr("Nový díl vyplní vybrané volné místo.")
    : state.mode === "navrh" ? (state.selected === null ? tr("Nový díl přijde do volného místa, jinak na úkor posledního dílu.") : tr("Nový díl přijde vpravo od vybraného, na jeho úkor."))
    : state.selected === null ? tr("Nový díl přijde na konec.") : tr("Nový díl přijde vpravo od vybraného.");
  box.append(hint);
  for (const [title, list] of paletteGroups()) {
    const group = Object.assign(document.createElement("div"), { className: "pal-group" });
    group.append(Object.assign(document.createElement("span"), { className: "pal-name", textContent: title }));
    for (const k of list) {
      const t = TYPES[k];
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.style.setProperty("--c", t.color);
      chip.textContent = t.label;
      if (TYPE_HINTS[k]) chip.title = TYPE_HINTS[k];
      chip.onclick = () => {
        const segs = p.segments, seg = { type: k, width: DEFAULT_WIDTH[k], source: "user" };
        if (t.directional) seg.dir = "forward";
        let at = state.selected === null ? segs.length : state.selected + 1;
        if (state.mode === "navrh" && segs.length) at = placeNew(segs, state.selected, seg);
        if (at < 0) { status(tr("Na nový díl tu není místo: uvolněte ho zúžením nebo smazáním jiného dílu."), "error"); return; }
        segs.splice(at, 0, seg);
        state.selected = at;
        edited();
        render();
      };
      group.append(chip);
    }
    box.append(group);
  }
}

document.querySelectorAll(".seg-toggle button").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.mode !== state.mode && b.dataset.mode !== "stav") log(b.dataset.mode, cutLog());
  if (b.dataset.mode !== state.mode) logEdits();
  state.mode = b.dataset.mode;
  state.selected = null;
  state.fixing = false;
  // Until the proposal is edited, it follows the current (possibly corrected) existing state.
  if (state.stav && !state.navrhEdited) state.navrh = structuredClone(state.stav);
  render();
}));

// The row of traffic signs: shown or not, remembered per browser (Bára 27. 11. 2026).
const SIGNS_KEY = "profily-znacky";
try { if (localStorage.getItem(SIGNS_KEY) === "ne") setSignsShown(false); } catch {}
const showSignsSwitch = () => $("#btn-signs").setAttribute("aria-checked", String(getSignsShown()));
showSignsSwitch();
$("#btn-signs").addEventListener("click", () => {
  setSignsShown(!getSignsShown());
  try { localStorage.setItem(SIGNS_KEY, getSignsShown() ? "ano" : "ne"); } catch {}
  showSignsSwitch();
  render();
});

// Illustrations: always each city's own (Bára 27. 11. 2026: the switch to Streetmix's is gone; profile.js setArt stays for the replay).

$("#btn-fix").onclick = () => {
  state.fixing = !state.fixing;
  state.selected = null;
  if (!state.fixing) logEdits();
  // Corrections keep the street's width: the width measured before them is the target (renderWidthCheck).
  if (state.fixing) { state.fixBase ??= totalWidth(state.stav); log("oprava", cutLog()); }
  render();
};

// Reporting a badly built cut (Bára): what is wrong, in the visitor's words, with the cut and its profile as the
// app built it (and as corrected, if the visitor corrected it), into the log (kind "hlaseni", logging/hlaseni.mjs).
// [value in the log, label]
const REPORT_WHAT = [["šířky", tr("šířky")], ["pruhy", tr("pruhy")], ["chodník", tr("chodník")], ["parkování", tr("parkování")], ["tramvaj", tr("tramvaj")],
  ["cyklisté", tr("cyklisté")], ["zeleň a stromy", tr("zeleň a stromy")], ["domy", tr("domy")], ["značky", tr("značky")], ["jiné", tr("jiné")]];
$("#report-what").append(...REPORT_WHAT.map(([w, label]) => {
  const l = document.createElement("label");
  l.append(Object.assign(document.createElement("input"), { type: "checkbox", value: w }), label);
  return l;
}));
// Only where the log runs (the web, not a local run), so the dialog never thanks for a report nobody got; from
// the Stav bar and from the Soubor menu (also in Návrh, where wrong widths are often noticed).
for (const b of ["#btn-report", "#menu-report"]) $(b).hidden = !logOn;
const openReport = () => {
  if (!state.cut || !state.stav) return status(tr("Nejdřív klikněte na ulici v mapě."), "error");
  $("#report-title").textContent = tr("{street} – co je na tomto řezu špatně?", { street: streetName(state.cut) });
  $("#report-status").textContent = "";
  $("#report-send").disabled = false;
  $("#report-dialog").showModal();
  $("#report-text").focus();
};
$("#btn-report").onclick = $("#menu-report").onclick = openReport;
$("#report-close").onclick = $("#report-cancel").onclick = () => $("#report-dialog").close();
$("#report-send").onclick = async () => {
  const co = [...document.querySelectorAll("#report-what input:checked")].map((i) => i.value);
  const text = $("#report-text").value.trim().slice(0, 1000);
  if (!text && !co.length) { $("#report-status").textContent = tr("Napište prosím, co je špatně."); $("#report-text").focus(); return; }
  $("#report-send").disabled = true;
  $("#report-status").textContent = tr("Odesílám…");
  // The Stav as it is now always goes along; what the app built, when this page built it (a restored or loaded
  // profile has no such record).
  const ok = await sendReport("hlaseni", {
    ...cutLog(), bearing: +state.cut.bearing.toFixed(1), reachLeft: state.cut.reach?.left, reachRight: state.cut.reach?.right,
    profile: { co, text, stav: shortProfile(state.stav), ...(state.computed && { vypocet: shortProfile(state.computed) }), opraveno: !!state.stavEdited },
  });
  if (!ok) {
    $("#report-send").disabled = false;
    $("#report-status").textContent = tr("Hlášení se nepodařilo odeslat, zkuste to prosím za chvíli.");
    return;
  }
  $("#report-text").value = "";
  for (const i of document.querySelectorAll("#report-what input")) i.checked = false;
  $("#report-dialog").close();
  status(tr("Děkujeme, hlášení je odesláno."), "ok");
};

// About (menu Soubor): the app, its author, where it has which data, a message (about.js).
setupAbout({ $, lang, country: () => country,
  cut: () => (location.hash.startsWith("#rez=") ? location.href.split("#")[0] + location.hash.split("&")[0] : null) });

// The header menus close after a choice or a click elsewhere.
document.addEventListener("click", (e) => {
  for (const d of document.querySelectorAll("details.menu[open]")) {
    if (!d.contains(e.target) || e.target.closest(".menu-list button:not(.switch)")) d.open = false;
  }
});

// ---------- export, save, load ----------
const cutLog = () => (state.cut ? { city: city.id, street: state.cut.name, wayId: state.cut.wayId, lat: state.cut.lat, lon: state.cut.lon } : {});
// How visitors corrected the data (the detection against the corrected Stav) and what they designed
// (Stav against Návrh), each sent once per change: on Hotovo, on leaving a mode, on a new cut and when
// the page is left. The log shows where the detection fails and what people want of their streets (Bára).
const sentEdits = {};
function logEdits() {
  if (!state.cut || !state.stav) return;
  const send = (detail, pred, po) => {
    const key = `${state.cut.wayId}|${state.cut.lat}|${detail}`, text = JSON.stringify(po);
    if (JSON.stringify(pred) === text || sentEdits[key] === text) return;
    sentEdits[key] = text;
    log("upravy", { detail, ...cutLog(), bearing: +state.cut.bearing.toFixed(1), profile: { pred, po } });
  };
  const stav = shortProfile(state.stav);
  if (state.stavEdited && state.computed) send("oprava", shortProfile(state.computed), stav);
  if (state.navrhEdited) send("navrh", stav, shortProfile(state.navrh));
}
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") logEdits(); });
// The sources of an export: the cut's, and the British signs' licence also when the signs came only in the Design
// (backlog 26. 11. 2026: it was counted from the Stav alone).
function exportSources() {
  const src = { ...(state.cut?.sources || {}) };
  const ogl = country.signs.ogl;
  if (ogl && [state.stav, state.navrh].some((p) => p?.segments?.some((s) => s.signs?.some((x) => ogl.has(country.signs.file(x, s)))))) src.ukSigns = true;
  return src;
}
function exportSvgs() {
  const title = state.cut ? streetName(state.cut) : tr("Profil");
  const credits = exportCredits(exportSources());
  if (state.mode === "porovnat" || !state.stav) {
    return [buildSvg(state.stav, { title: `${title} – ${tr("stav")}`, credits }), buildSvg(state.navrh, { title: `${title} – ${tr("návrh")}`, credits })];
  }
  return [buildSvg(current(), { title: `${title} – ${state.mode === "navrh" ? tr("návrh") : tr("stav")}`, credits })];
}

function download(name, blob) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const fileBase = () => (state.cut ? streetName(state.cut) : "profil").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();

$("#btn-export-svg").onclick = () => {
  log("export", { detail: "svg", ...cutLog() });
  if (!state.stav) return;
  download(`${fileBase()}-${state.mode}.svg`, new Blob([svgString(exportSvgs())], { type: "image/svg+xml" }));
};

$("#btn-export-png").onclick = async () => {
  log("export", { detail: "png", ...cutLog() });
  if (!state.stav) return;
  const text = svgString(exportSvgs());
  const vb = text.match(/viewBox="([^"]+)"/)?.[1].split(" ").map(Number);
  if (!vb) return;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  img.src = url;
  try { await img.decode(); } catch { status(tr("Obrázek se nepodařilo vytvořit."), "error"); URL.revokeObjectURL(url); return; }
  URL.revokeObjectURL(url);
  const scale = 0.6; // px per cm
  const canvas = Object.assign(document.createElement("canvas"), { width: vb[2] * scale, height: vb[3] * scale });
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((b) => download(`${fileBase()}-${state.mode}.png`, b), "image/png");
};

$("#btn-save").onclick = () => {
  if (!state.stav) return;
  log("ulozeni", cutLog());
  const data = { app: "streetdesign-pilot", version: 1, cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited,
    zdroje: exportCredits(exportSources()).join("\n"),
    licence: tr("Data podle zdrojů (CC BY 4.0, ODbL 1.0 a další, viz zdroje); profil s ilustracemi Streetmixu pod CC BY-SA 4.0. Zdroje a licence: https://github.com/barasoukup/profily-ulic/blob/main/LICENCE-A-ZDROJE.md") };
  download(`${fileBase()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
};

$("#file-load").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await savedPlace(data);
    restore(data);
  } catch (err) {
    status(tr("Soubor se nepodařilo načíst: {error}", { error: err.message }), "error");
  }
  e.target.value = "";
};

// ⇄: the cut turned round, A and B swapped. The profiles are mirrored as they are (corrections and
// the design included), with no new data: parts in reverse order, their directions swapped (they
// are told against the street's direction, which turns too), the edges swapped.
const OTHER = { forward: "backward", backward: "forward" };
function mirror(p) {
  const swap = (k) => (k.startsWith("left") ? "right" + k.slice(4) : k.startsWith("right") ? "left" + k.slice(5) : k);
  return {
    ...p,
    edges: Object.fromEntries(Object.entries(p.edges || {}).map(([k, v]) => [swap(k), v])),
    segments: [...p.segments].reverse().map((s) => ({
      ...s,
      ...(s.dir ? { dir: OTHER[s.dir] || s.dir } : {}),
      ...(s.bikeDir ? { bikeDir: OTHER[s.bikeDir] || s.bikeDir } : {}),
      ...(s.items ? { items: s.items.map((it) => ({ ...it, f: +(1 - it.f).toFixed(3) })) } : {}),
      // The pedestrians' side of a divided path (C 10a) turns with the view.
      ...(s.signs ? { signs: s.signs.map((x) => (x.walk ? { ...x, walk: x.walk === "left" ? "right" : "left" } : x)) } : {}),
    })),
  };
}
$("#btn-flip").onclick = () => {
  if (!state.stav || !state.cut) return;
  state.stav = mirror(state.stav);
  state.navrh = mirror(state.navrh);
  if (state.computed) state.computed = mirror(state.computed);
  const r = state.cut.reach || defaultReach();
  const sp = state.cut.span && { left: state.cut.span.right, right: state.cut.span.left };
  const before = state.cut;
  state.cut = { ...state.cut, bearing: ((state.cut.bearing + 180 + 540) % 360) - 180, reach: { left: r.right, right: r.left }, span: sp };
  // The networks turn round with the cut (t across it changes sign), not asked again.
  if (state.underground?.cut === before && state.underground.items) {
    const items = state.underground.items.map((x) => ({ ...x, t: -x.t }));
    items.lines = state.underground.items.lines;
    state.underground = { cut: state.cut, items };
  }
  state.selected = null;
  const f = localFrame(state.cut.lat, state.cut.lon), b = (state.cut.bearing * Math.PI) / 180;
  drawCut(cutEnds(f, [-Math.cos(b), Math.sin(b)], cutSpan(state.cut)));
  showCutInfo();
  resetHistory();
  save();
  render();
};

// The place of a saved cut, before it is restored (late.js): without a connection its state is unknown, the profile shows.
const savedPlace = (data) => { const { lat, lon } = data?.cut || {}; return typeof lat === "number" && typeof lon === "number" ? ensurePlace(lat, lon).catch((err) => console.warn("America", err)) : null; };
function restore(data) {
  cleanProfile(data?.stav, tr("stav"));
  if (data.navrh) cleanProfile(data.navrh, tr("návrh"));
  data.cut = cleanCut(data.cut);
  undoStack.length = redoStack.length = 0;
  Object.assign(state, { cut: data.cut, stav: data.stav, navrh: data.navrh || structuredClone(data.stav), navrhEdited: !!data.navrhEdited, selected: null });
  // The saved cut's city (its illustrations follow once loaded).
  if (state.cut) {
    setCity(cityAt(state.cut.lat, state.cut.lon));
    Promise.all([loadSprites(), country.atPlace?.(state.cut.lon, state.cut.lat).then((v) => Object.assign(city, v))]).then(render);
  }
  if (state.cut) {
    map.setView([state.cut.lat, state.cut.lon], 19);
    const f = localFrame(state.cut.lat, state.cut.lon);
    const r = (state.cut.bearing * Math.PI) / 180;
    const n = [-Math.cos(r), Math.sin(r)];
    drawCut(cutEnds(f, n, cutSpan(state.cut)));
    $("#street-name").textContent = streetName(state.cut);
    showCutInfo();
  }
  save();
  render();
  resetHistory();
}

// Networks under the street (site.js, a trial, Prague only): off by default; the switch by the profile asks for
// them, draws them under the Stav profile and turns on their own layer of the map (which the layer control can
// then turn off alone).
function siteOn() { try { return localStorage.getItem("profily-site") === "1"; } catch { return false; } }
// ?site=1 in a link turns it on (for trying it out).
if (new URLSearchParams(location.search).get("site") === "1") try { localStorage.setItem("profily-site", "1"); } catch {}
$("#site-btn").setAttribute("aria-pressed", String(siteOn()));
$("#site-btn").onclick = () => {
  const on = !siteOn();
  try { localStorage.setItem("profily-site", on ? "1" : "0"); } catch {}
  $("#site-btn").setAttribute("aria-pressed", String(on));
  if (on) map.addLayer(netLayer); else map.removeLayer(netLayer);
  loadUnderground();
  render();
};
function loadUnderground() {
  // Only where a city publishes its networks (Prague, Brno): elsewhere no switch at all; asked only when switched on.
  const net = state.cut ? netAt(state.cut.city, state.cut.lat, state.cut.lon) : null, here = !!net;
  if (here !== netInControl) { if (here) layersControl.addOverlay(netLayer, tr("Sítě pod zemí")); else layersControl.removeLayer(netLayer); netInControl = here; }
  $("#site-btn").hidden = !here || state.mode === "porovnat";
  $("#net-hint").hidden = !undergroundFor();
  if (here) $("#net-hint").textContent = `${tr("Sítě pod zemí (ne v exportu); čárkovaně: obvyklá hloubka, v datech chybí.")} ${net.credit()}`;
  if (!siteOn() || !here || state.underground?.cut === state.cut) return;
  const cut = state.cut, b = (cut.bearing * Math.PI) / 180, span = cutSpan(cut);
  state.underground = { cut, items: null };
  underground({ frame: localFrame(cut.lat, cut.lon), dir: [Math.sin(b), Math.cos(b)], half: Math.max(span.left, span.right) + 1, cityId: cut.city })
    .then((items) => { if (state.underground?.cut === cut) { state.underground.items = items || []; render(); } })
    .catch((err) => { console.warn("sítě", err); if (state.underground?.cut === cut) state.underground.items = []; });
}
// The networks on the map too, in the band's colours (Bára): the lines around the cut, dashed where not verified.
// Under the cut's line (overlayPane, 400) and over the data layers of maplayers.js (390–395).
map.createPane("rezSite").style.zIndex = 396;
const netLayer = L.layerGroup();
let netInControl = false; // in the layer control only where the city's networks can be had (loadUnderground)
if (siteOn()) netLayer.addTo(map);
let netDrawn = null;
function drawNetLines() {
  const items = state.underground?.cut === state.cut && state.cut && netAt(state.cut.city, state.cut.lat, state.cut.lon) ? state.underground.items : null;
  if (netDrawn === items) return;
  netDrawn = items;
  netLayer.clearLayers();
  for (const l of items?.lines || []) {
    L.polyline(l.coords, { pane: "rezSite", color: (NET_KINDS[l.kind] || NET_KINDS.jine).color, weight: l.kind === "jine" ? 1.5 : 2, opacity: 0.85, dashArray: l.verified ? null : "6 5" })
      .bindTooltip(l.popis, { sticky: true }).addTo(netLayer);
  }
}
function undergroundFor() {
  const items = state.underground?.cut === state.cut ? state.underground.items : null;
  // In Stav and Návrh (a design wider or narrower than the street has them stretched to it), not in Porovnat.
  return siteOn() && state.mode !== "porovnat" && items?.length ? { items, span: cutSpan(state.cut), kinds: NET_KINDS } : null;
}

// Holes in a design (Bára): a deleted part, a narrowed one or what a new part did not fill stays an empty part of
// its width (Neurčeno drawn by the user, at road level), so the parts beyond keep their places (and the networks
// under them their places under them). The design keeps the street's width.
const HOLE = "nezname";
// Where edits keep the street's places: Návrh and correcting the data in Stav (Bára).
const keepsPlace = () => state.mode === "navrh" || (state.mode === "stav" && state.fixing);
function mergeHoles(segs) {
  for (let k = segs.length - 1; k > 0; k--) if (isHole(segs[k]) && isHole(segs[k - 1])) {
    segs[k - 1].width = +(segs[k - 1].width + segs[k].width).toFixed(2);
    segs.splice(k, 1);
  }
  for (let k = segs.length - 1; k >= 0; k--) if (isHole(segs[k]) && segs[k].width < 0.01) segs.splice(k, 1);
}
// The room on the right of part i: holes whole, other parts down to their least width.
const roomRight = (segs, i) => segs.slice(i + 1).reduce((a, x) => a + Math.max(0, x.width - (isHole(x) ? 0 : minWidth(x))), 0);
// A part's new width: in Návrh and in a correction the rest keeps its place: a narrower part leaves a hole after it, a wider one takes
// the room from the right (a hole first, then the next parts down to their least width) and grows no more than
// there is room; elsewhere just the width.
function setWidth(segs, i, w) {
  const s = segs[i];
  if (!keepsPlace()) { s.width = w; return; }
  const d = +(Math.min(w, s.width + roomRight(segs, i)) - s.width).toFixed(2);
  if (!d) return;
  s.width = +(s.width + d).toFixed(2);
  if (d < 0) {
    if (isHole(segs[i + 1])) segs[i + 1].width = +(segs[i + 1].width - d).toFixed(2);
    else segs.splice(i + 1, 0, { type: HOLE, width: -d, source: "user" });
    return;
  }
  let need = d;
  for (const pass of [isHole, (x) => !isHole(x)]) for (let k = i + 1; k < segs.length && need > 0.001; k++) {
    if (!pass(segs[k])) continue;
    const take = Math.min(need, Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))));
    segs[k].width = +(segs[k].width - take).toFixed(2);
    need = +(need - take).toFixed(2);
  }
  mergeHoles(segs);
}
// Where a new part from the palette goes in Návrh, taking its room so the street keeps its width: into the selected
// hole; after the selected part, from a hole right after it, then from the part down to its least width; with
// nothing selected into the widest hole, else from the last part. Its width is cut to the room; -1: no room.
function placeNew(segs, sel, seg) {
  const holes = segs.map((x, k) => (isHole(x) ? k : -1)).filter((k) => k >= 0);
  let from, at;
  if (sel !== null && isHole(segs[sel])) { from = [sel]; at = sel; }
  else if (sel !== null) { from = [...(isHole(segs[sel + 1]) ? [sel + 1] : []), sel]; at = sel + 1; }
  else if (holes.length) { const k = holes.reduce((b, x) => (segs[x].width > segs[b].width ? x : b)); from = [k]; at = k; }
  else { from = [segs.length - 1]; at = segs.length; }
  const room = from.reduce((a, k) => a + Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))), 0);
  // Not a sliver: at least 1 m (or the new part's own least width, if more), else "no room".
  if (room < Math.max(Math.min(1, seg.width), minWidth(seg))) return -1;
  seg.width = +Math.min(seg.width, room).toFixed(2);
  let need = seg.width;
  for (const k of from) {
    const take = Math.min(need, Math.max(0, segs[k].width - (isHole(segs[k]) ? 0 : minWidth(segs[k]))));
    segs[k].width = +(segs[k].width - take).toFixed(2);
    need = +(need - take).toFixed(2);
  }
  // A hole used up goes; the new part takes its place.
  if (isHole(segs[at]) && segs[at].width < 0.01) segs.splice(at, 1);
  return at;
}
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited, opts: optsKey() }));
  } catch {}
}

// The link's switches but the language (?ai=1, ?pasport=0…): a cut saved under others is derived again, not restored.
function optsKey() {
  const q = new URLSearchParams(location.search);
  q.delete("lang");
  return [...q].sort().map(([k, v]) => `${k}=${v}`).join("&");
}

artEvents.addEventListener("ready", () => render()); // a house of North America drawn in Europe (profile.js)
render(); // the intro shows at once; the illustrations follow
window.profilyReady = true; // errors.js: from now on a failure is not a failed start
await loadSprites();
let linked = location.hash.startsWith("#rez=") ? parseCut(location.hash) : null;
try {
  // This tab's cut kept over a change of language comes first (once), then the browser's saved one.
  let tab = null;
  try { tab = JSON.parse(sessionStorage.getItem("profily-tab") || "null"); sessionStorage.removeItem("profily-tab"); } catch {}
  const saved = tab || JSON.parse(localStorage.getItem(STORE) || "null");
  // A reload of the same cut (no design in the link) keeps the work saved in this browser.
  const design = linked && designParams(location.hash);
  if (linked && saved?.stav && !design.navrh && !design.stav && sameCut(linked, saved.cut) && (tab || (saved.opts ?? "") === optsKey())) linked = null;
  // A former city page (?mesto=) opens over that city, not over a cut saved elsewhere.
  const elsewhere = startCity && !linked && saved?.cut && cityAt(saved.cut.lat, saved.cut.lon) !== startCity;
  if (saved?.stav && !linked && !elsewhere) {
    await savedPlace(saved);
    restore(saved);
    takeMode();
  } else render();
} catch {
  render();
}
// A cut link, possibly with a design in it (shareLink): the street is derived from the data as
// always, then the design (and the hand-corrected Stav) from the link replace the parts.
async function openLink(hash) {
  const c = parseCut(hash);
  if (!c) return;
  const design = designParams(hash);
  $("#pano-dialog").close();
  map.setView([c.lat, c.lon], 19);
  await cutAt(c.lat, c.lon, false, c.bearing, c.reach, null, c.way);
  if (!state.stav || (!design.navrh && !design.stav)) return;
  try {
    const take = async (text, into) => {
      const p = cleanProfile(await unpackProfile(text), into === "stav" ? tr("stav") : tr("návrh"));
      state[into] = { segments: p.segments, edges: { ...state.stav.edges, ...p.edges } };
    };
    if (design.stav) await take(design.stav, "stav");
    if (design.navrh) { await take(design.navrh, "navrh"); state.navrhEdited = true; state.mode = "navrh"; }
    else { state.navrh = structuredClone(state.stav); state.navrhEdited = false; }
    resetHistory();
    save();
    render();
    // The address keeps the design (cutAt wrote the bare cut), so the link can be reloaded and passed on.
    history.replaceState(null, "", location.hash.split("&")[0] + hash.slice(hash.indexOf("&")));
    status(tr("Otevřený návrh ze sdíleného odkazu."), "ok");
  } catch (err) {
    console.warn("odkaz", err);
    status(tr("Návrh z odkazu se nepodařilo načíst (odkaz je asi poškozený), ukazuji ulici podle dat."), "error");
  }
}
// The mode kept over a change of language (the lang button) applies once the cut is there, from storage or a link.
function takeMode() {
  let mode = null;
  try { mode = sessionStorage.getItem("profily-rezim"); sessionStorage.removeItem("profily-rezim"); } catch {}
  if (state.stav && ["navrh", "porovnat"].includes(mode)) { state.mode = mode; render(); }
}
if (linked) openLink(location.hash).then(takeMode);

// A cut link pasted into the address bar of an open tab (the app's own updates use replaceState,
// which fires no hashchange).
addEventListener("hashchange", () => {
  if (location.hash.startsWith("#rez=")) openLink(location.hash);
});

// Share: the address of the cut with the design (and a hand-corrected Stav) packed into it.
$("#btn-share").onclick = async () => {
  log("sdileni", cutLog());
  if (!state.stav) return;
  const base = location.href.split("#")[0] + location.hash.split("&")[0];
  const stavEdited = state.stav.segments.some((s) => s.source === "user");
  let url = base;
  if (state.navrhEdited) url += "&navrh=" + (await packProfile(state.navrh));
  if (stavEdited) url += "&stav=" + (await packProfile(state.stav));
  try { await navigator.clipboard.writeText(url); status(state.navrhEdited ? tr("Odkaz na návrh je ve schránce.") : tr("Odkaz na ulici je ve schránce (návrh zatím nemáte)."), "ok"); }
  catch { try { prompt(tr("Zkopírujte odkaz:"), url); } catch { status(url, "ok"); } } // no prompt in some web views
};
