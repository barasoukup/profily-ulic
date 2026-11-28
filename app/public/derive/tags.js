// Readers of OSM tags and highway classes shared by the derivation.
import { country } from "../city.js";
import { P as ORTHO_P } from "../ortho-osm.js";

export const transitOnly = (t) => ["yes", "designated"].includes(t.psv || t.trolleybus || t.bus) &&
  ["no", "delivery", "destination", "permit", "private"].includes(t.motor_vehicle ?? t.vehicle ?? t.access);
// A way private cars may not use (motorcar, else motor_vehicle, vehicle, access = no; the more special tag decides). Its
// lanes are not drawn with a passenger car (Bára 27. 11. 2026: Augustusbrücke in Dresden, motor_vehicle=no, B 11 in the
// signs and a car in the lanes): a lane for buses where OSM lets public transport in (psv, bus, trolleybus yes or
// designated), else a lane with no vehicle (seg.noCar).
export const carsBanned = (t) => ["motorcar", "motor_vehicle", "vehicle", "access"].map((k) => t[k]).find((v) => v !== undefined) === "no";
export const transitAllowed = (t) => ["psv", "bus", "trolleybus"].some((k) => ["yes", "designated"].includes(t[k]));
export const tramWithBus = (t) => ["yes", "designated"].includes(t.psv) || ["yes", "designated"].includes(t.bus) || t.highway === "busway";

export const MINOR = new Set(["footway", "path", "steps", "cycleway", "pedestrian", "service", "track", "corridor", "platform", "construction", "proposed"]);

// Indoor corridors and passages through buildings are never the street being cut.
export const isStreet = (el) => el.type === "way" && !!el.tags?.highway && !!el.geometry && el.tags.highway !== "corridor" && el.tags.indoor !== "yes" && el.tags.tunnel !== "building_passage" && !isUnderground(el.tags);

// A crossing c of the cut's line by another street for cars: named otherwise, turned away, not a link nor on another level.
export const levelTag = (t) => Number(t?.layer) || (inTunnel(t) ? -1 : t?.bridge && t.bridge !== "no" ? 1 : 0);

export const STREETS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"]);
// Roads for cars, not living streets or pedestrian zones (deriveProfile roadOnPath).
export const CAR_ROADS = new Set([...STREETS].filter((h) => h !== "living_street"));

// Below the street surface: metro platforms and passages (layer/level below 0 in a tunnel), e.g. Můstek
// under Václavské náměstí. They are not part of the street profile.
const isUnderground = (t) => (t?.tunnel && t.tunnel !== "no") && (parseFloat(t.layer) < 0 || parseFloat(t.level) < 0) ||
  t?.subway === "yes" || t?.location === "underground";
export const isPlatformTags = (t) => (t?.public_transport === "platform" || t?.railway === "platform" || t?.highway === "platform") && !isUnderground(t);

// Tracks in a tunnel are under a street that is not (Toronto's streetcar north of Spadina and Sussex, Line 5 under Eglinton:
// the review of 25. 11. 2026); a passage through a building is on the ground. ?off=tunneltracks: as before.
export const inTunnel = (t) => !!t?.tunnel && t.tunnel !== "no" && t.tunnel !== "building_passage";

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

export const isOnewayTags = (t) => ["yes", "1", "true", "-1"].includes(t?.oneway);
// The way side on the drivers' left: the way's left, or its right on oneway=-1 (traffic against the geometry).
// The side of a one-way way the contraflow keeps to (the way's left where traffic keeps right; its right where it keeps
// left, countries/<ISO>.js leftHand: Cyprus).
export const drivingLeft = (t) => ((t?.oneway === "-1") !== !!country.leftHand ? "right" : "left");

// Dot product of the driving directions of two crossing ways (oneway=-1 runs against the geometry).
export const drivingDot = (a, b) => (a.d[0] * b.d[0] + a.d[1] * b.d[1]) * (a.way.tags?.oneway === "-1" ? -1 : 1) * (b.way.tags?.oneway === "-1" ? -1 : 1);

// Dual carriageway mapped as two one-way ways: the partner of the cut's way is a one-way way with
// the same name driving the other direction, crossing the cut.
// A carriageway only for buses (highway=busway, or a service road for public transport with no other traffic): the other
// half of a boulevard where it has no other (Bd Marguerite de Rochechouart in Paris: the cars' carriageway, the promenade, the buses' one;
// ?off=busduo leaves it out).
export const busOnly = (t) => !ORTHO_P.off?.has("busduo") && (t.highway === "busway" || (t.highway === "service" && ["yes", "designated"].some((v) => t.psv === v || t.bus === v) && ["no", "private"].includes(t.access || t.motor_vehicle)));
