// Segment types of the street profile. Colors follow Streetmix-like ground tones.
// label: the one name of the type, in the palette, the editor and under the drawing (Bára: one name
// everywhere; under a narrow part it shrinks or is left out). raised: on the curb (15 cm above the roadway).
import { city } from "./city.js";
import { t } from "./i18n.js";

// A part's name: the hatched strip of a roadway (V 13) is a krajnice drawn so, named by what it is.
export const partLabel = (s) => (s?.hatched ? t("types.hatchedArea") : TYPES[s?.type]?.label || s?.type);
export const TYPES = {
  chodnik: { label: t("common.sidewalk"), color: "#d6d1c4", raised: true, sprite: "people" },
  chodnik_kola: { label: t("types.sidewalkCyclingAllowed"), color: "#d9c9c0", raised: true, sprite: "people", withBike: true },
  stezka_sdilena: { label: t("types.sharedUsePath"), color: "#d4b8a8", raised: true, sprite: "people", withBike: true },
  predzahradka: { label: t("types.frontGarden"), color: "#a7c66b", raised: true, sprite: "bush" },
  zelen: { label: t("common.greenery"), color: "#8fbf55", raised: true, sprite: "bush" },
  stromorad: { label: t("common.treeRow"), color: "#7fb04a", raised: true, sprite: "tree" },
  nastupiste: { label: t("types.platform"), color: "#e0cfa0", raised: true, sprite: "people" },
  cyklostezka: { label: t("types.cycleTrack"), color: "#c1786a", raised: true, sprite: "biker", directional: true },
  cyklopruh: { label: t("types.cycleLane"), color: "#b5574a", sprite: "biker", directional: true },
  ochranny_pruh: { label: t("types.advisoryCycleLane"), color: "#8a5a50", sprite: "biker", directional: true },
  parkovani: { label: t("common.parking"), color: "#7b7b78", sprite: "car" },
  pruh: { label: t("types.trafficLane"), color: "#5c5c59", sprite: "car", directional: true },
  pruh_piktokoridor: { label: t("types.cycleSymbols"), color: "#5c5c59", sprite: "car", directional: true, sharrow: true },
  obsluzna: { label: t("types.accessRoad"), color: "#8a8780", sprite: "car" },
  krajnice: { label: t("types.hardStrip"), color: "#77756f" },
  bus: { label: t("types.busLane"), color: "#9c4038", sprite: "bus", directional: true },
  bus_cyklo: { label: t("types.busCycleLane"), color: "#9c4038", sprite: "bus", directional: true, bike: true },
  // Three kinds of tram (Bára): in a lane shared with cars; a reserved tram lane in the roadway, level with it
  // and marked off; a separate tram bed, raised behind curbs, of panels, gravel or grass (TRAM_BEDS).
  tramvaj_v_pruhu: { label: t("types.tramMixedTraffic"), color: "#736a55", sprite: "streetcar", tracks: true, directional: true },
  tramvaj_pruh: { label: t("types.tramLane"), color: "#6f6a5e", sprite: "streetcar", tracks: true, directional: true, marked: true },
  tramvaj: { label: t("types.segregatedTramway"), color: "#a39d8c", sprite: "streetcar", tracks: true, directional: true, raised: true, bed: true },
  // A railway on the ground beside the street (Bára 27. 11. 2026, Rudolfstraße in Linz: the track ran along the street
  // and the profile left it out): a gravel bed with a pair of rails for each track (segment.tracks, narrow gauge
  // segment.narrow). No vehicle and no overhead line: the picture is the bed only.
  railway: { label: t("common.railway"), color: "#9a948a", raised: true, rails: true },
  delici: { label: t("types.centralReserve"), color: "#b4b2a9", raised: true },
  plocha: { label: t("types.pavedArea"), color: "#cfccc2", raised: true },
  zahradka: { label: t("types.outdoorSeating"), color: "#d9c7a8", raised: true, sprite: "cafe" },
  // Rainwater management (Bára 12. 11. 2026, after Magdalena; Standardy hospodaření se srážkovými vodami na území
  // hl. m. Prahy, MHMP, ČVUT FSv, chap. 5.1): the surface objects as parts of their own, hdv: the standard's chapter.
  // Only in a design: the data do not tell them. What lies under a part is its "under" (HDV_UNDER).
  pruleh: { label: t("types.infiltrationSwale"), color: "#86b46a", raised: true, hdv: "5.1.5", water: true },
  ryha: { label: t("types.infiltrationTrench"), color: "#b8b1a2", raised: true, hdv: "5.1.6", water: true },
  nadrz: { label: t("types.retentionBasin"), color: "#7fa9cf", raised: true, hdv: "5.1.10", water: true },
  voda: { label: t("common.water"), color: "#7fa9cf" },
  zed: { label: t("types.wall"), color: "#a39e92", raised: true, wall: true },
  nezname: { label: t("types.unknown"), color: "#ebe8df", raised: true },
};

// Rainwater objects under a part (segment.under; the standard's chapter): under green, a sidewalk, parking…
export const HDV_UNDER = {
  // short: in the label under the drawing (the full name in the editor). size: the default size in metres (w wide,
  // its top at top under the surface, h high; w null: the part's width less 0.3 m a side). The standard sizes them
  // by calculation, not by a fixed size; its worked example has a trench 1.5 m wide holding 0.5 m of water. The
  // defaults are a first guess to be set by the design (segment.underSize).
  ryha: { label: t("types.undergroundTrench"), short: t("types.trench"), hdv: "5.1.7", size: { w: 1.5, top: 0.4, h: 1 } },
  nadrz: { label: t("types.undergroundRetentionTank"), short: t("types.tank"), hdv: "5.1.11", size: { w: null, top: 0.8, h: 1.5 } },
  sachta: { label: t("types.soakaway"), short: t("types.soakaway2"), hdv: "5.1.9", size: { w: 1, top: 0.5, h: 2.5 } },
};
// The size of the object under a part (m): set in the design, else the default; never wider than the part.
export function underSize(s) {
  const d = HDV_UNDER[s.under]?.size;
  if (!d) return null;
  const own = s.underSize || {};
  const room = Math.max(0.3, s.width - 0.2);
  return { w: +Math.min(room, own.w ?? d.w ?? Math.max(0.3, s.width - 0.6)).toFixed(2), top: own.top ?? d.top, h: own.h ?? d.h };
}
// The parts that may have one; with a průleh above, a rýha under it is the standard's "průleh s podzemní rýhou" (5.1.8).
export const UNDER_TYPES = ["zelen", "stromorad", "predzahradka", "delici", "pruleh", "chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "nastupiste", "zahradka"];
// The paved parts that may be permeable (segment.permeable): true for permeable paving (joints, porous paving;
// 5.1.2), "nezpevneny" for an unpaved surface (fine gravel, compacted earth, woodchips…: no paving at all, but the
// rain soaks in too; Bára 12. 11. 2026).
export const SURFACES = { "": t("types.ordinary"), true: t("types.permeablePaving"), nezpevneny: t("types.unpavedFineGravelCompacted") };
// (Fable: an unpaved shoulder, access road or dividing strip could not be marked.)
export const PERMEABLE_TYPES = ["chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "zahradka", "cyklostezka", "krajnice", "obsluzna", "delici"];

export const SOURCES = {
  dtm: { label: t("common.measuredSurfaceMap"), color: "#3b6d11" },
  pasport: { label: t("common.townInventory"), color: "#2e8b84" }, // towns' passports (gis.js asPassport)
  osm: { label: t("common.addedOsm"), color: "#854f0b" },
  data: { label: t("types.cityOpenData"), color: "#2f6f8f" }, // Prague: trees of TSK, MHMP and the districts
  tsk: { get label() { return city.parkingSource; }, color: "#0f6e56" }, // the current city's
  odhad: { label: t("common.estimate"), color: "#8f8b82" },
  ortofoto: { label: t("common.roadMarkingsOrthophoto"), color: "#c07a12" }, // lanes-ortho.js
  user: { label: t("common.editedManually"), color: "#534ab7" },
};

// Default widths (m) for newly added segments.
// Items drawn inside a segment (street furniture, barriers, slopes).
export const ITEMS = {
  strom: t("common.tree"), lampa: t("types.streetLight"), lavicka: t("types.bench"), stojan_kola: t("types.cycleStand"), sdilena_kola: t("types.cycleHire"),
  pristresek: t("types.stopShelter"), rozcestnik: t("types.signpostMap"), taxi: t("types.taxiRank"),
  sloupek: t("types.bollard"), sloup_trakce: t("types.overheadLinePole"), oznacnik: t("types.stopFlag"), kvetinac: t("types.planter"), svodidlo: t("types.crashBarrier"), zabradli: t("types.railing"), plot: t("types.fenceWall"),
  pristresek_zeleny: t("types.stopShelterGreenRoof"),
  oporna_zed: t("types.retainingWall"), zivy_plot: t("types.hedge"), svah: t("types.slopeEdge"), zahradka: t("types.outdoorSeating"),
};

// Surfaces of a separate tram bed (segment.bed); the default is panels. Asphalt (beds used by buses) is drawn
// like the roadway.
export const TRAM_BEDS = { panely: { label: t("types.concretePanels"), color: "#b3ada0" }, strk: { label: t("types.gravel"), color: "#9a948a" }, trava: { label: t("types.grass"), color: "#86b552" }, asfalt: { label: t("types.asphalt"), color: "#5c5c59" } };

// The heights a street lamp can be given (item.h, m; Magdalena: 6–8 m usually, 4 m in narrow streets); the picture's
// luminaire hangs at LAMP_H (m) when none is set.
export const LAMP_HEIGHTS = [4, 5, 6, 8, 10];
export const LAMP_H = 8.75;

// Turn arrows on a lane (segment.turn; OSM turn:lanes values joined by ";"): the words and their names, and the
// combinations Návrh offers (a lane from the data may carry any other combination of the words).
export const TURNS = { left: t("types.left"), slight_left: t("types.slightLeft"), sharp_left: t("types.sharpLeft"), through: t("types.straight"), right: t("types.right"),
  slight_right: t("types.slightRight"), sharp_right: t("types.sharpRight"), reverse: t("types.uTurn"), merge_to_left: t("types.merge"), merge_to_right: t("types.merge") };
export const TURN_CHOICES = ["left", "left;through", "through", "through;right", "right", "left;right", "left;through;right"];
export const isTurn = (v) => typeof v === "string" && v.split(";").every((x) => x in TURNS);

export const PARKING_USE = { ztp: t("types.disabled"), zasobovani: t("common.loading"), specialni: t("types.reserved") };
// Where parked cars stand besides the roadway (segment.position; OSM parking:<side>=on_kerb|half_on_kerb): fully on
// the sidewalk, or across the kerb, half on the sidewalk. Without it, in the roadway.
export const PARKING_POSITION = { on_kerb: t("types.onSidewalk"), half_on_kerb: t("types.halfOnSidewalk") };

export const DEFAULT_WIDTH = {
  chodnik: 2.5, chodnik_kola: 2.5, stezka_sdilena: 3, predzahradka: 2, zelen: 2, stromorad: 2, nastupiste: 3, cyklostezka: 2.5, cyklopruh: 1.5, ochranny_pruh: 1.5, pruh_piktokoridor: 3.25, parkovani: 2,
  pruleh: 2, ryha: 1, nadrz: 4, pruh: 3, obsluzna: 3, bus: 3.5, bus_cyklo: 4.25, tramvaj_v_pruhu: 3.25, tramvaj_pruh: 3.5, tramvaj: 3.5, railway: 4.5, delici: 1.5, plocha: 2, zahradka: 3, voda: 5, zed: 0.5, nezname: 2, krajnice: 1,
};

// MTVU code (CTVUK_KOD) to segment type.
// The code of a railway track of OSM in the profile's runs (ortho-osm.js, derive.js): beside the MTVU codes.
export const RAILWAY_CODE = 9810;
// OSM railway values that are a track at ground level (not abandoned, disused or razed ones), the width of the bed for
// a track of each (m) and the distance between two parallel tracks.
export const RAIL_KINDS = { rail: [4.5, 4], light_rail: [4.5, 4], subway: [4.5, 4], narrow_gauge: [3.5, 3] };
export function typeFromMtvu(code) {
  if (code === RAILWAY_CODE) return "railway";
  if (code === 701 || code === 700) return "pruh";
  if (code === 702) return "chodnik";
  if (code === 703) return "cyklostezka";
  if (code === 704) return "parkovani";
  if (code === 705) return "tramvaj";
  if (code === 300) return "predzahradka";
  if (code >= 500 && code < 600) return "voda";
  if (code >= 400 && code < 500) return "zelen";
  if (code === null || code === undefined) return "nezname";
  return "plocha";
}

// 602 "ostatní stavby" (garages, kiosks, walls) is not a building facade; it ends the profile as a minor structure.
export const isBuilding = (code) => code === 601 || code === 604 || code === 600;
export const isMinorStructure = (code) => code === 602;

// ---------------------------------------------------------------------------------------------------------------------
// Contracts of the modules (docs/code-health-plan.md, step 10): only a description in JSDoc, no code. A file refers to
// them as `@param {import("./types.js").Segment} s`. What the tests hold to: tests/countries.test.js (a state's module),
// tests/towns.test.js (a town's module).

/**
 * A part of the street profile (the one of `deriveProfile().segments`, of the saved JSON and of the editor). The ids
 * of the types are Czech (TYPES above); what the data do not know is left out.
 * @typedef {object} Segment
 * @property {string} type id of the type, a key of TYPES ("chodnik", "pruh", "parkovani", "tramvaj"…)
 * @property {number} width width across the street (m)
 * @property {string} [source] where the width comes from, a key of SOURCES ("dtm", "osm", "odhad", "ortofoto", "user"…)
 * @property {"forward"|"backward"} [dir] direction of a lane (by the direction of the cut's street)
 * @property {Array<{ kind: string, [k: string]: any }>} [items] street furniture and barriers in the part (ITEMS)
 * @property {string} [orient] parking: "podelne", "kolme" or "sikme"
 * @property {string} [position] parking: "on_kerb" or "half_on_kerb" (PARKING_POSITION)
 * @property {string} [use] parking: "ztp", "zasobovani" or "specialni" (PARKING_USE)
 * @property {string} [turn] turn lane: OSM turn:lanes value ("left;through"; TURNS)
 * @property {string} [roadClass] the street's class of the city (TSK, MK I…) or of OSM, for the width rules
 * @property {string} [bed] bed of a separate tram track (TRAM_BEDS)
 * @property {boolean} [withBus] a tram track the buses use too
 * @property {boolean} [hatched] a hatched strip of the roadway (krajnice drawn so)
 * @property {boolean|string} [permeable] permeable surface (SURFACES)
 */

/**
 * A profile as deriveProfile returns it (and the app keeps it).
 * @typedef {object} Profile
 * @property {Segment[]} segments from the left facade to the right one, as the viewer looks along the street
 * @property {{ left: string, right: string }} edges what ends each side: "budova", "volno", a fence…
 * @property {Array<any>} runs the pieces of the cut as read from the data (the map's polygons, OSM, the orthophoto)
 * @property {number} axisT offset of the street's axis from the cut's centre (m)
 * @property {boolean} [estimate] the profile is an estimate from OSM (no map of surfaces under the cut)
 * @property {string} [notice] what the viewer is told about the data
 */

/**
 * The one object deriveProfile takes: where the cut lies, the data read there, and what the app has decided.
 * @typedef {object} DeriveArgs
 * @property {[number, number]} center the cut's centre in the local frame (m)
 * @property {[number, number]} dir unit vector of the street's direction
 * @property {number} half half of the cut's length (m)
 * @property {Array<any>} polys the surface map's polygons (esriPolygons, mtvuPolygons)
 * @property {any} osm the OSM data of the place ({ ways, nodes… }, towns' `sources.osm`)
 * @property {any} frame the local frame (localFrame: metres around the cut)
 * @property {any} [way] the OSM way the cut crosses
 * @property {Array<any>} [tracks] the tram tracks (trackLines)
 * @property {Array<any>} [parking] the parking sections (`sources.parking`)
 * @property {Array<any>} [lines] the lines of the technical map (techLines)
 * @property {{ left?: number, right?: number }} [reach] how far the profile goes on each side (m)
 * @property {boolean} [inZps] whether a paid parking zone is known at the cut
 * @property {Object<string, number>} [itemReach] reach of the street furniture (m) by kind
 * @property {any} [ortho] the orthophoto's reading of the tram bed
 * @property {any} [lanesImage] the orthophoto's reading of the lanes (lanes-ortho.js)
 * @property {boolean} [roadOnPath] the road's polygon lies on a path (a town's property)
 * @property {boolean} [noParkGuess] no parking estimated by the law (the measured profile, Monaco)
 * @property {Array<any>} [lawAt] where the law's parking was laid
 * @property {any} [kerbParking] parking by the kerbs
 * @property {boolean} [osmParkGive] OSM's parking may narrow the lanes
 */

/**
 * A source of a town: the data it answers to a click (towns/<town>.js `sources`). Every function returns a promise; an
 * answer is an ArcGIS-like `{ features: [] }` with the flags the town's module adds (see towns/abroad.js: the empty one).
 * @typedef {object} Source
 * @property {(lat: number, lon: number, radius: number) => Promise<any>} osm the OSM data around a point
 * @property {(bbox: any, tags?: any, way?: any) => Promise<any>} surfaces the map of surfaces under the cut
 * @property {(bbox?: any) => Promise<any>} lines the lines and points of the technical map (tracks, fences, kerbs…)
 * @property {(...args: any[]) => Promise<any>} parking the parking places and sections
 * @property {(...args: any[]) => Promise<any>} podlaznost the floors and years of the houses
 */

/**
 * A town module (towns/<town>.js, registered in towns/index.js TOWNS under the id of the town or of the state's rest).
 * @typedef {object} Town
 * @property {Source} sources the data it asks on a click
 * @property {string[]} SURFACE_MAPS its own maps of surfaces for the map of the coverage ("all", ids of AREAS, "-NUTS3" to leave out; tools/build_coverage.mjs)
 * @property {null|{ service: string, datum?: number }} ortho its own orthophoto service for the lanes (null: the state's)
 * @property {boolean} [national] true: no fallback to the national map of ČÚZK (DMVS)
 * @property {Object<string, { box: [number, number, number, number], town?: string }>} [AREAS] where its own sources answer, by their ids
 * @property {(deps: object) => any} [maps] the base maps of the town (jihlava.js and the other Czech towns)
 */

/**
 * A state's module (countries/<ISO>.js; countries/default.js lists every field and what it does).
 * @typedef {object} Country
 * @property {string|null} code ISO 3166-1 alpha-2, null for a place in no state the app knows
 * @property {[number, number, number, number]|null} bounds [lon0, lat0, lon1, lat1]
 * @property {(s: Segment, segs: Segment[], i: number) => ({ min: number, zaklad: number, why: string }|null)} limits the width rules (rules.js)
 * @property {(belt: Segment[], width: number) => Array<{ level: string, text: string }>} tramBelt warnings of a tram belt
 * @property {() => ({ lo: number, base: number, why: string }|null)} contraflow width of a one-way street with contraflow cyclists
 * @property {{ dir: string, file: Function, plate: Function, label: Function, drawable: Function }} signs the traffic signs of the state (signs.js)
 * @property {string|null} bedOrtho orthophoto of a tram bed (ortho.js)
 * @property {string} laneOrtho orthophoto of the lanes (lanes-ortho.js), "none" for none
 * @property {boolean} parkGuess parking estimated by the law
 * @property {number} freeLane the free lane the law leaves beside parked cars (m per direction)
 * @property {boolean} panorama Mapy.com panoramas
 * @property {object} art the state's illustrations by city id
 * @property {boolean|((city: any) => boolean)} socialistLooks
 * @property {string[]} search the search services besides RÚIAN
 */
