// The row of traffic signs under the profile (Bára 10. 11. 2026): what the street's OSM tags and the profile's
// parts say about the traffic regime, as signs of vyhláška 294/2015 Sb. (files in signs-CZ/).
// A sign is { k, v?, plate? }: k is the key of a sign, or of a regime whose sign depends on the direction of
// view (oneway: IP 4b when the traffic goes away from the viewer, B 2 when it comes towards them), so that
// "Otočit" needs no change of the data. Every sign stands under the part it belongs to (seg.signs), at most
// MAX_PER_PART per part; rules of the whole street (speed, one-way, zones) under its driving lanes (Bára).
import { t } from "./i18n.js";
import { countryOf } from "./countries/index.js";

export const MAX_PER_PART = 2;

// Labels for the palette in Návrh and for the title of each drawn sign.
export const SIGNS = {
  b1: t("signs.b1NoVehicles"),
  b11: t("signs.b11NoMotor"),
  b8: t("signs.b8NoCycling"),
  b30: t("signs.b30NoPedestrians"),
  b20a: t("signs.b20aSpeedLimit"),
  b28: t("signs.b28NoStopping"),
  b29: t("signs.b29NoParking"),
  oneway: t("signs.ip4bB2"),
  c8a: t("signs.c8aCycleTrack"),
  c9a: t("signs.c9aSharedUse"),
  c10a: t("signs.c10aSegregatedCycle"),
  ip11a: t("signs.ip11aParking"),
  ip11d: t("signs.ip11dParkingPavement"),
  ip11e: t("signs.ip11eParkingPavement"),
  ip11f: t("signs.ip11fParkingPartly"),
  ip11g: t("signs.ip11gParkingPartly"),
  ip12: t("signs.ip12ReservedParking"),
  ztp: t("signs.ip12O1"),
  ip14a: t("signs.iz1aMotorway"),
  ip15a: t("signs.iz2aRoadMotor"),
  ip20a: t("signs.ip20aBusLane"),
  zona30: t("signs.iz8a30Km"),
  ip26a: t("signs.iz5aHomeZone"),
  ip27a: t("signs.iz6aPedestrianZone"),
  cyklozona: t("signs.iz9aCycleZone"),
  sdilena: t("signs.iz10aSharedZone"),
  c7a: t("signs.c7aFootpath"),
};
// The parts each sign can stand under in Návrh (Bára: no motorway under a sidewalk). Signs drawn from the data stay
// whatever part they are on.
const LANE = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh"];
const WALK = ["chodnik", "chodnik_kola", "stezka_sdilena", "nastupiste"];
const PARKING = ["parkovani"];
const SIGN_PARTS = {
  b1: LANE, b11: LANE, b20a: LANE, oneway: LANE, ip14a: LANE, ip15a: LANE, zona30: LANE, ip26a: LANE, cyklozona: LANE, sdilena: LANE,
  b8: [...LANE, ...WALK], b30: [...WALK, "cyklostezka"], ip27a: [...LANE, ...WALK],
  b28: [...LANE, ...PARKING], b29: [...LANE, ...PARKING],
  c8a: ["cyklostezka"], c7a: WALK, c9a: ["stezka_sdilena", "chodnik_kola", "chodnik", "cyklostezka"], c10a: ["stezka_sdilena", "chodnik_kola", "chodnik", "cyklostezka"],
  ip11a: PARKING, ip11d: PARKING, ip11e: PARKING, ip11f: PARKING, ip11g: PARKING, ip12: PARKING, ztp: PARKING,
  ip20a: ["bus", "bus_cyklo"],
};
export const signFits = (k, type) => !SIGN_PARTS[k] || SIGN_PARTS[k].includes(type);
// Dodatkové tabulky (plate) of a sign: text of E 13, or a key of a pictogram. Czech on the plate itself (a Czech
// sign), translated in the label.
export const PLATES = { kola: "s cyklisty", kolo: "i pro cyklisty", protismer: "cyklisté v protisměru", obsluha: "Mimo dopravní obsluhy", podelne: "podélné", kolme: "kolmé", sikme: "šikmé" };
const PLATE_LABEL = { kola: t("signs.cyclists"), kolo: t("signs.cyclesPermitted"), protismer: t("signs.contraflowCycling"), obsluha: t("signs.exceptAccess"),
  podelne: t("common.parallel"), kolme: t("common.perpendicular"), sikme: t("common.angled") };
// Every sign with a plate that deriveSigns makes, as a sign of its own in the palette of Návrh (so that what the
// data draw can be chosen by hand too), labelled as drawn: one-way with contraflow cyclists is IP 4c (B 2 +
// E 12b when the lane comes towards the viewer), not IP 4b with a plate (a user, 11. 11. 2026); the manner of
// parking makes IP 11b or IP 11c. Other plates are dropped (validate.js).
export const SIGN_CHOICES = {
  "oneway+protismer": { k: "oneway", plate: "protismer", label: t("signs.ip4cB2") },
  "ip11a+podelne": { k: "ip11a", plate: "podelne", label: t("signs.ip11cParkingParallel") },
  "ip11a+kolme": { k: "ip11a", plate: "kolme", label: t("signs.ip11bParkingPerpendicular") },
  "ip11a+sikme": { k: "ip11a", plate: "sikme", label: t("signs.ip11bParkingAngled") },
  "ip20a+kolo": { k: "ip20a", plate: "kolo", label: t("signs.ip20aBusLaneCycles") },
  "ip27a+kola": { k: "ip27a", plate: "kola", label: t("signs.iz6aPedestrianZoneCyclists") },
  "b1+obsluha": { k: "b1", plate: "obsluha", label: t("signs.b1E13") },
  "b11+obsluha": { k: "b11", plate: "obsluha", label: t("signs.b11E13") },
};
export const signChoice = (x) => SIGN_CHOICES[`${x.k}+${x.plate}`];
// The label of a sign in Návrh and in the title of a drawn sign. In another state (city.country, ISO 3166-1) the
// label keeps its name in the language of the page and takes that state's number (SK: vyhláška 30/2020 Z. z.).
export function signLabel(x, country = "CZ") {
  const own = signChoice(x);
  const label = own ? own.label : SIGNS[x.k] + (typeof x.v === "number" ? ` ${x.v} km/h` : "") + (x.plate ? ` (${PLATE_LABEL[x.plate]})` : "");
  const of = countryOf(country).signs.label;
  return of ? of(x, own, label, PLATE_LABEL) : label;
}

// The folder of a state's signs (countries/<ISO>.js signs).
export const signDir = (country = "CZ") => countryOf(country).signs.dir;
// The template of a speed sign, its number filled in when drawn.
// C55: Denmark's C 55 (signs-DK/, the red ring of C 21 with the number); 329: Lithuania's (signs-LT/, the ring of 302).
export const SPEED_TEMPLATES = new Set(["B20a", "253", "10a", "274", "2.30", "C55", "329"]);

const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "obsluzna"]);
const CARRIAGEWAY = new Set([...ROAD, "parkovani", "cyklopruh", "ochranny_pruh", "krajnice", "tramvaj"]);
const WALK_TYPES = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
const yes = (v) => ["yes", "designated", "permissive"].includes(v);
const num = (v) => { const m = /^(\d+)/.exec(String(v ?? "")); return m ? Number(m[1]) : undefined; };

// The speed that the zone sign already says (no B 20a of its own); a state may give its own (countries/<ISO>.js
// signs.zoneSpeed: Spain's S-28 stands with its R-301 10, Monaco draws no zone signs).
const ZONE_SPEED = { ip26a: 20, ip27a: 20, zona30: 30, cyklozona: 30, sdilena: 20 };
const zoneSpeedOf = (country) => countryOf(country).signs.zoneSpeed || ZONE_SPEED;
// The town's speed without a sign (50 unless the state says otherwise: countries/<ISO>.js signs.townSpeed).
const townSpeedOf = (tags, country) => countryOf(country).signs.townSpeed?.(tags) ?? 50;

// The rules of the street that belong to its driving lanes (Bára: no signs for the whole profile; speed and
// one-way under the lanes they concern), in order of importance: the kind of road or zone, an entry ban.
export function streetSigns(tags = {}, country = "CZ") {
  const z = [];
  const hw = tags.highway;
  const zone = String(tags["zone:traffic"] || tags["zone:maxspeed"] || tags["maxspeed:type"] || "");
  // The ref goes with it: Spain tells an autopista (AP-…) from an autovía (countries/ES.js).
  if (hw === "motorway" || hw === "motorway_link") z.push({ k: "ip14a", ...(tags.ref && { ref: String(tags.ref) }) });
  else if (tags.motorroad === "yes") z.push({ k: "ip15a" });
  if (hw === "living_street") z.push({ k: "ip26a" });
  else if (hw === "pedestrian") z.push(yes(tags.bicycle) ? { k: "ip27a", plate: "kola" } : { k: "ip27a" });
  else if (tags.cyclestreet === "yes" || tags.bicycle_road === "yes") z.push({ k: "cyklozona" });
  // The shared zone (IZ 10a, vyhl. 386/2023): OSM has no tag of its own, only the sign itself (Bára: when the data say it).
  else if (/\bIZ ?10a\b/i.test(String(tags.traffic_sign || ""))) z.push({ k: "sdilena" });
  else if (/zone:?30$|:30$/.test(zone) && !/rural|urban$/.test(zone)) z.push({ k: "zona30" });
  // Entry bans of the whole street, with the exception of local traffic (destination).
  const ban = (v) => v === "no" || v === "destination" || v === "private";
  if (ban(tags.access) || ban(tags.vehicle)) z.push({ k: "b1", ...((tags.access || tags.vehicle) === "destination" ? { plate: "obsluha" } : {}) });
  else if (ban(tags.motor_vehicle)) z.push({ k: "b11", ...(tags.motor_vehicle === "destination" ? { plate: "obsluha" } : {}) });
  // A state's own zones (countries/<ISO>.js signs.zones; Spain: a living street is S-47 unless it is 10 km/h).
  const own = countryOf(country).signs.zones;
  return own ? own(z, tags) : z;
}
// The street's speed limit unless a zone sign says it, or it is the town's default (50) without a sign.
// showDefault: the town's default is drawn too (another roadway of the profile has a sign of its own speed).
function streetSpeed(tags, zones, showDefault = false, country = "CZ") {
  const speed = num(tags.maxspeed), zs = zoneSpeedOf(country);
  const zoned = zones.find((s) => zs[s.k]);
  if (!speed || (zoned && zs[zoned.k] === speed)) return undefined;
  if (speed === townSpeedOf(tags, country) && !showDefault && !/sign/.test(String(tags["source:maxspeed"] || "")) && !tags.traffic_sign) return undefined;
  return speed;
}
// Signs of the parts of a derived profile (segments from the viewer's left to right), at most MAX_PER_PART each.
export function deriveSigns(profile, tags = {}, ctx = {}) {
  const segs = profile.segments;
  const road = segs.map((s, i) => (ROAD.has(s.type) ? i : -1)).filter((i) => i >= 0);
  const lanes = road.filter((i) => segs[i].type !== "obsluzna");
  // The tags of each lane's roadway (derive.js roads, by position: the segments run from extent[1] down to
  // extent[0], the roadways along the cut), the clicked way's where it is not known.
  const own = new Map();
  if (profile.roads?.length && profile.extent) {
    let t = profile.extent[1];
    segs.forEach((s, i) => {
      const mid = t - s.width / 2;
      t -= s.width;
      const r = profile.roads.find((x) => mid >= x.s && mid <= x.e);
      if (r && lanes.includes(i)) own.set(i, r.tags);
    });
  }
  const tagsOf = (i) => own.get(i) || tags;
  // The rules of each roadway, for all its lanes together (one-way, speed per lane).
  const groups = new Map();
  for (const i of lanes) {
    const tg = tagsOf(i);
    if (!groups.has(tg)) groups.set(tg, []);
    groups.get(tg).push(i);
  }
  // One-way: all the lanes of the profile go one way (not the halves of a divided road); contraflow cyclists
  // when OSM opens it (oneway:bicycle=no) or a part carries cyclists against the cars. The sign follows the
  // lane's direction when drawn (signFile).
  const dirs = new Set(lanes.map((i) => segs[i].dir || "forward"));
  // Where one roadway has a speed sign, the town's 50 of another is drawn too, so the difference shows (Bára,
  // Poncarova: 70 one way, 50 the other).
  const signed = [...groups.keys()].some((tg) => streetSpeed(tg, streetSigns(tg, ctx.country), false, ctx.country) && num(tg.maxspeed) !== townSpeedOf(tg, ctx.country));
  const ruleOf = new Map();
  for (const [tg, ls] of groups) {
    const rules = streetSigns(tg, ctx.country);
    // Not where the street is divided into two one-way roadways of opposite directions (a median, a tram between: the same
    // street, only its directions apart; Výškovická in Ostrava, Bára 27. 11. 2026): the sign is a one-way street's.
    const here = profile.roads?.find((r) => r.tags === tg);
    const twin = here?.fwd !== undefined && profile.roads.some((r) => r.tags !== tg && r.fwd !== undefined && r.fwd !== here.fwd
      && ["yes", "1", "true", "-1"].includes(r.tags?.oneway) && (r.tags.name || tg.name ? r.tags.name === tg.name : r.tags.highway === tg.highway));
    const oneway = ["yes", "1", "true", "-1"].includes(tg.oneway) && dirs.size === 1 && !twin;
    const contra = oneway && (tg["oneway:bicycle"] === "no" || segs.some((s) => s.bikeDir && s.bikeDir !== [...dirs][0]));
    const lanesSpeed = String(tg["maxspeed:lanes"] || "").split("|").map(num);
    const forward = ls.filter((j) => (segs[j].dir || "forward") === "forward");
    const speed = streetSpeed(tg, rules, signed && groups.size > 1, ctx.country);
    for (const i of ls) {
      const out = [];
      if (oneway) out.push({ k: "oneway", ...(contra ? { plate: "protismer" } : {}) });
      // Speed per lane (maxspeed:lanes counts the lanes from the left in the way's direction), per direction,
      // or of the street; a zone sign says its own speed.
      const v = lanesSpeed.length === ls.length && forward.length === ls.length ? lanesSpeed[ls.indexOf(i)]
        : num(tg[(segs[i].dir || "forward") === "forward" ? "maxspeed:forward" : "maxspeed:backward"]) ?? speed;
      if (v) out.push({ k: "b20a", v });
      out.push(...rules);
      ruleOf.set(i, out);
    }
  }
  segs.forEach((s, i) => {
    const out = [];
    const t = s.type;
    // Under the lane only the round bus symbol of IP 20a (Bára).
    // In a bus and bike lane the blue bike symbol stands under it (Bára).
    if (t === "bus" || t === "bus_cyklo") out.push({ k: "ip20a", ...(t === "bus_cyklo" ? { plate: "kolo" } : {}) });
    // Road markings (cycle lanes, piktokoridor, tram lane, turn arrows) are in the drawing itself (Bára).
    else if (t === "cyklostezka") out.push({ k: "c8a" });
    // A divided path (C 10a) shows its pedestrians on their real side (vyhláška: the symbols as the halves lie):
    // OSM does not say which, so the pedestrians away from the roadway and the cyclists beside it (Bára).
    else if (t === "stezka_sdilena") out.push(tags.segregated === "yes" ? { k: "c10a", walk: walkSide(segs, i) } : { k: "c9a" });
    else if (t === "parkovani" && s.source !== "odhad") {
      if (s.use === "ztp") out.push({ k: "ztp" });
      else if (s.use) out.push({ k: "ip12" });
      // Cars on the sidewalk (IP 11d, e) or partly on it (IP 11f, g): parallel, or perpendicular and oblique.
      else if (s.position) {
        const along = (s.orient || "podelne") === "podelne";
        out.push({ k: s.position === "on_kerb" ? (along ? "ip11e" : "ip11d") : along ? "ip11g" : "ip11f" });
      } else out.push({ k: "ip11a", ...(s.orient ? { plate: s.orient } : {}) });
    }
    if (ruleOf.has(i)) out.push(...ruleOf.get(i));
    if (out.length) s.signs = out.slice(0, MAX_PER_PART);
  });
  // A street without lanes of its own (a pedestrian zone whose whole width a town's passport or the map gives as
  // a sidewalk, Poštová in Bratislava): its zone and entry signs under its widest walking part (Bára).
  if (!lanes.length) {
    const rules = streetSigns(tags, ctx.country);
    const walk = segs.map((s, i) => [s, i]).filter(([s]) => WALK_TYPES.has(s.type)).sort((a, b) => b[0].width - a[0].width)[0];
    if (rules.length && walk) walk[0].signs = [...(walk[0].signs || []), ...rules].slice(0, MAX_PER_PART);
  }
  // A footway or a path without lanes of its own (Bára after Fable, 16. 11. 2026: OSM calls ordinary sidewalks and park
  // paths footways too): with cyclists on it (bicycle=yes|designated) the path for pedestrians and cyclists (C 9a,
  // divided C 10a) unless a part already shows it; for pedestrians only C 7a just where OSM has the sign
  // (traffic_sign C 7a / SK 220, or foot=designated, which OSM keeps for signed ways). Under its widest walking part.
  const path = tags.highway === "footway" || tags.highway === "path";
  if (path && !lanes.length) {
    const walk = segs.map((s, i) => [s, i]).filter(([s]) => WALK_TYPES.has(s.type)).sort((a, b) => b[0].width - a[0].width)[0];
    const put = (x) => { if (walk && (walk[0].signs || []).length < MAX_PER_PART) walk[0].signs = [...(walk[0].signs || []), x]; };
    const shown = segs.some((s) => (s.signs || []).some((x) => x.k === "c9a" || x.k === "c10a"));
    if (yes(tags.bicycle)) { if (!shown) put(tags.segregated === "yes" ? { k: "c10a", walk: walkSide(segs, walk?.[1]) } : { k: "c9a" }); }
    else if (/\bC ?7a\b|(^|[:;,])220\b/i.test(String(tags.traffic_sign || "")) || tags.foot === "designated") put({ k: "c7a" });
  }
  // A state's signs without a drawing go before the no-stopping sign takes the place of a lane's last one (AT: the
  // one-way sign would push a zone sign out).
  if (ctx.country) for (const sg of segs) if (sg.signs) { sg.signs = sg.signs.filter((x) => drawable(x, sg, ctx.country)); if (!sg.signs.length) delete sg.signs; }
  // No parking / no stopping on a kerb: on the outermost lane of that side (parking:<side>:restriction=
  // no_stopping|no_parking). The way's right is the profile's right when the profile looks along the way
  // (ctx.alongWay), else its left. It takes the place of the lane's last sign.
  for (const side of ["left", "right"]) {
    const r = tags[`parking:${side}:restriction`] || tags["parking:both:restriction"];
    const k = r === "no_stopping" ? "b28" : r === "no_parking" ? "b29" : null;
    if (!k || !lanes.length) continue;
    const profileRight = (side === "right") === (ctx.alongWay !== false);
    const s = segs[profileRight ? lanes.at(-1) : lanes[0]];
    const list = (s.signs || []).filter((x) => x.k !== k);
    s.signs = [...list.slice(0, MAX_PER_PART - 1), { k }];
  }
  delete profile.zones;
  delete profile.roads;
  return profile;
}

// The side of a divided path where its pedestrians walk, as the viewer sees it: away from the nearest roadway part
// (none: as the decree's design, pedestrians right).
function walkSide(segs, i) {
  let best = null;
  segs.forEach((s, j) => { if (CARRIAGEWAY.has(s.type) && (best === null || Math.abs(j - i) < Math.abs(best - i))) best = j; });
  return best === null ? "right" : best > i ? "left" : "right";
}

// The file of a sign as drawn for a viewer, and its value: oneway becomes IP 4b or B 2 by the direction of
// the lanes (forward = away from the viewer).
// seg: the part the sign stands under (a one-way sign follows its lane's direction).
export const signFile = (s, seg, country = "CZ") => countryOf(country).signs.file(s, seg);
// The plate under a sign: contraflow cyclists are E 12a under IP 4b and E 12b under B 2; E 13 carries a text.
export const plateFile = (s, seg, country = "CZ") => countryOf(country).signs.plate(s, seg);

// Signs a state has drawings for (Fable and the hostile review of Austria): in SK and AT the derived signs without a
// file of the state (the shared zone, a one-way in Austria, parking on the sidewalk) are dropped, and in AT those with a
// plate too (its Zusatztafeln are not drawn: B 1 alone would ban all entry, not all but local traffic).
export function drawable(x, seg, country = "CZ") {
  const of = countryOf(country).signs.drawable;
  return of ? of(x, seg) : true;
}
export function keepDrawable(profile, country = "CZ") {
  for (const s of profile.segments || []) if (s.signs) { s.signs = s.signs.filter((x) => drawable(x, s, country)); if (!s.signs.length) delete s.signs; }
  return profile;
}
