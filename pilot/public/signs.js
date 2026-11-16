// The row of traffic signs under the profile (Bára 10. 11. 2026): what the street's OSM tags and the profile's
// parts say about the traffic regime, as signs of vyhláška 294/2015 Sb. (files in znacky/).
// A sign is { k, v?, plate? }: k is the key of a sign, or of a regime whose sign depends on the direction of
// view (oneway: IP 4b when the traffic goes away from the viewer, B 2 when it comes towards them), so that
// "Otočit" needs no change of the data. Every sign stands under the part it belongs to (seg.signs), at most
// MAX_PER_PART per part; rules of the whole street (speed, one-way, zones) under its driving lanes (Bára).
import { t } from "./i18n.js";

export const MAX_PER_PART = 2;

// Labels for the palette in Návrh and for the title of each drawn sign.
export const SIGNS = {
  b1: t("B 1 Zákaz vjezdu všech vozidel"),
  b11: t("B 11 Zákaz vjezdu všech motorových vozidel"),
  b8: t("B 8 Zákaz vjezdu jízdních kol"),
  b30: t("B 30 Zákaz vstupu chodců"),
  b20a: t("B 20a Nejvyšší dovolená rychlost"),
  b28: t("B 28 Zákaz zastavení"),
  b29: t("B 29 Zákaz stání"),
  oneway: t("IP 4b / B 2 Jednosměrný provoz"),
  c8a: t("C 8a Stezka pro cyklisty"),
  c9a: t("C 9a Stezka pro chodce a cyklisty"),
  c10a: t("C 10a Stezka pro chodce a cyklisty dělená"),
  ip11a: t("IP 11a Parkoviště"),
  ip11d: t("IP 11d Parkoviště (stání na chodníku kolmé nebo šikmé)"),
  ip11e: t("IP 11e Parkoviště (stání na chodníku podélné)"),
  ip11f: t("IP 11f Parkoviště (částečné stání na chodníku kolmé nebo šikmé)"),
  ip11g: t("IP 11g Parkoviště (částečné stání na chodníku podélné)"),
  ip12: t("IP 12 Vyhrazené parkoviště"),
  ztp: t("IP 12 + O 1 Parkoviště pro ZTP"),
  ip14a: t("IZ 1a Dálnice"),
  ip15a: t("IZ 2a Silnice pro motorová vozidla"),
  ip20a: t("IP 20a Vyhrazený jízdní pruh BUS"),
  zona30: t("IZ 8a Zóna 30"),
  ip26a: t("IZ 5a Obytná zóna"),
  ip27a: t("IZ 6a Pěší zóna"),
  cyklozona: t("IZ 9a Zóna pro cyklisty"),
  sdilena: t("IZ 10a Sdílená zóna"),
  c7a: t("C 7a Stezka pro chodce"),
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
const PLATE_LABEL = { kola: t("s cyklisty"), kolo: t("i pro cyklisty"), protismer: t("cyklisté v protisměru"), obsluha: t("Mimo dopravní obsluhy"),
  podelne: t("podélné"), kolme: t("kolmé"), sikme: t("šikmé") };
// Every sign with a plate that deriveSigns makes, as a sign of its own in the palette of Návrh (so that what the
// data draw can be chosen by hand too), labelled as drawn: one-way with contraflow cyclists is IP 4c (B 2 +
// E 12b when the lane comes towards the viewer), not IP 4b with a plate (a user, 11. 11. 2026); the manner of
// parking makes IP 11b or IP 11c. Other plates are dropped (validate.js).
export const SIGN_CHOICES = {
  "oneway+protismer": { k: "oneway", plate: "protismer", label: t("IP 4c / B 2 + E 12b Jednosměrný provoz, cyklisté v protisměru") },
  "ip11a+podelne": { k: "ip11a", plate: "podelne", label: t("IP 11c Parkoviště (podélné stání)") },
  "ip11a+kolme": { k: "ip11a", plate: "kolme", label: t("IP 11b Parkoviště (kolmé stání)") },
  "ip11a+sikme": { k: "ip11a", plate: "sikme", label: t("IP 11b Parkoviště (šikmé stání)") },
  "ip20a+kolo": { k: "ip20a", plate: "kolo", label: t("IP 20a Vyhrazený jízdní pruh BUS i pro cyklisty") },
  "ip27a+kola": { k: "ip27a", plate: "kola", label: t("IZ 6a Pěší zóna s cyklisty") },
  "b1+obsluha": { k: "b1", plate: "obsluha", label: t("B 1 + E 13 Zákaz vjezdu všech vozidel mimo dopravní obsluhy") },
  "b11+obsluha": { k: "b11", plate: "obsluha", label: t("B 11 + E 13 Zákaz vjezdu všech motorových vozidel mimo dopravní obsluhy") },
};
export const signChoice = (x) => SIGN_CHOICES[`${x.k}+${x.plate}`];
// The label of a sign in Návrh and in the title of a drawn sign. In another state (city.country, ISO 3166-1) the
// label keeps its name in the language of the page and takes that state's number (SK: vyhláška 30/2020 Z. z.).
export function signLabel(x, country = "CZ") {
  const own = signChoice(x);
  const label = own ? own.label : SIGNS[x.k] + (typeof x.v === "number" ? ` ${x.v} km/h` : "") + (x.plate ? ` (${PLATE_LABEL[x.plate]})` : "");
  if (country === "AT") return AT_CODE[x.k] ? `${AT_CODE[x.k]} ${label.replace(CZ_CODE, "")}` : label;
  if (country !== "SK") return label;
  const code = (own && SK_CHOICE_CODE[`${x.k}+${x.plate}`]) || SK_CODE[x.k];
  return code ? `${code} ${label.replace(CZ_CODE, "")}` : label;
}
// The Czech number at the start of a label ("IP 4c / B 2 + E 12b ", "IP 12 + O 1 ", "B 20a ").
const CZ_CODE = /^(?:[A-Z]{1,2} \d+[a-z]?(?: [/+] |\s))+/;

// The signs of the state SK (pilot/public/znacky-SK/, README there): the number for the label, the file of the sign
// and of its plate. SK has no plates for the manner of parking (272 alone), no one-way sign with contraflow
// cyclists (321 + plate 514, seen from the exit 230 + plate 507 with a bicycle), and puts a reserved parking
// space under Zákaz zastavenia (270 + plate 531).
const SK_CODE = { b1: "231", b11: "232", b8: "233", b30: "233", b20a: "253", b28: "270", b29: "271", oneway: "321 / 230",
  c8a: "221", c9a: "222", c10a: "223", ip11a: "272", ip11d: "273", ip11e: "273", ip11f: "273", ip11g: "273",
  ip12: "270 + 531", ztp: "272", ip14a: "309", ip15a: "311", ip20a: "224", zona30: "268", ip26a: "315", ip27a: "317", cyklozona: "323", c7a: "220" };
const SK_CHOICE_CODE = { "oneway+protismer": "321 + 514 / 230 + 507", "ip20a+kolo": "224 + 515", "ip27a+kola": "317 + 515",
  "b1+obsluha": "231 + 507", "b11+obsluha": "232 + 507" };
const SK_FILE = { b1: "231", b11: "232", b8: "233-58", b30: "233-60", b28: "270", b29: "271", c8a: "221", c9a: "222", c10a: "223-51",
  ip11a: "272", ip11d: "273-85", ip11e: "273-65", ip11f: "273-75", ip11g: "273-55", ip12: "270", ztp: "272",
  ip14a: "309", ip15a: "311", ip20a: "224", zona30: "268-30", ip26a: "315", ip27a: "317", cyklozona: "323", c7a: "220" };
const SK_SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
// The folder of a state's signs.
// The signs of the state AT (pilot/public/signs-AT/, README there; StVO 1960 § 52–53, Wikimedia Commons, Austrian
// official works): the label's number and the file. Austria has no sign for parking on the sidewalk, a reserved
// space or a cycle lane (markings), nor a one-way sign facing the driver (Einbahnstraße is a plate along the street), so those are not drawn.
const AT_CODE = { b1: "§ 52 Z 1", b11: "§ 52 Z 6c", b8: "§ 52 Z 8c", b30: "§ 52 Z 14b", b20a: "§ 52 Z 10a", b28: "§ 52 Z 13b",
  b29: "§ 52 Z 13a", c8a: "§ 52 Z 16", c9a: "§ 52 Z 17a", c10a: "§ 52 Z 17a", c7a: "§ 52 Z 17",
  ip11a: "§ 53 Z 1a", ip14a: "§ 53 Z 8a", ip15a: "§ 53 Z 8c", ip20a: "§ 53 Z 25", zona30: "§ 52 Z 11a", ip26a: "§ 53 Z 9c",
  ip27a: "§ 53 Z 9a", cyklozona: "§ 53 Z 26", sdilena: "§ 53 Z 9e" };
const AT_FILE = { b1: "1", b11: "6c", b8: "8c", b30: "14b", b28: "13b", b29: "13a", c8a: "16", c9a: "17a-a", c10a: "17a-b", c7a: "17",
  ip11a: "HZ1a", ip14a: "HZ8a", ip15a: "HZ8c", ip20a: "HZ25", zona30: "11a", ip26a: "HZ9c", ip27a: "HZ9a", cyklozona: "HZ26", sdilena: "HZ9e" };
const AT_SPEEDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
export const signDir = (country = "CZ") => (country === "SK" ? "znacky-SK" : country === "AT" ? "signs-AT" : "znacky");
// The template of a speed sign, its number filled in when drawn.
export const SPEED_TEMPLATES = new Set(["B20a", "253", "10a"]);

const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "obsluzna"]);
const CARRIAGEWAY = new Set([...ROAD, "parkovani", "cyklopruh", "ochranny_pruh", "krajnice", "tramvaj"]);
const WALK_TYPES = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
const yes = (v) => ["yes", "designated", "permissive"].includes(v);
const num = (v) => { const m = /^(\d+)/.exec(String(v ?? "")); return m ? Number(m[1]) : undefined; };

// The speed that the zone sign already says (no B 20a of its own).
const ZONE_SPEED = { ip26a: 20, ip27a: 20, zona30: 30, cyklozona: 30, sdilena: 20 };

// The rules of the street that belong to its driving lanes (Bára: no signs for the whole profile; speed and
// one-way under the lanes they concern), in order of importance: the kind of road or zone, an entry ban.
export function streetSigns(tags = {}) {
  const z = [];
  const hw = tags.highway;
  const zone = String(tags["zone:traffic"] || tags["zone:maxspeed"] || tags["maxspeed:type"] || "");
  if (hw === "motorway" || hw === "motorway_link") z.push({ k: "ip14a" });
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
  return z;
}
// The street's speed limit unless a zone sign says it, or it is the town's default 50 without a sign.
// showDefault: the town's 50 is drawn too (another roadway of the profile has a sign of its own speed).
function streetSpeed(tags, zones, showDefault = false) {
  const speed = num(tags.maxspeed);
  const zoned = zones.find((s) => ZONE_SPEED[s.k]);
  if (!speed || (zoned && ZONE_SPEED[zoned.k] === speed)) return undefined;
  if (speed === 50 && !showDefault && !/sign/.test(String(tags["source:maxspeed"] || "")) && !tags.traffic_sign) return undefined;
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
  const signed = [...groups.keys()].some((tg) => streetSpeed(tg, streetSigns(tg)) && num(tg.maxspeed) !== 50);
  const ruleOf = new Map();
  for (const [tg, ls] of groups) {
    const rules = streetSigns(tg);
    const oneway = ["yes", "1", "true", "-1"].includes(tg.oneway) && dirs.size === 1;
    const contra = oneway && (tg["oneway:bicycle"] === "no" || segs.some((s) => s.bikeDir && s.bikeDir !== [...dirs][0]));
    const lanesSpeed = String(tg["maxspeed:lanes"] || "").split("|").map(num);
    const forward = ls.filter((j) => (segs[j].dir || "forward") === "forward");
    const speed = streetSpeed(tg, rules, signed && groups.size > 1);
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
    const rules = streetSigns(tags);
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
export function signFile(s, seg, country = "CZ") {
  const dir = s.dir ?? seg?.dir;
  if (country === "AT") {
    // No one-way sign under a lane (Bára 16. 11. 2026): Austria's Einbahnstraße (Hinweiszeichen 10) is the plate along
    // the street, there is none facing the driver.
    if (s.k === "oneway") return null;
    if (s.k === "b20a") return AT_SPEEDS.includes(s.v) ? `10a-${s.v}` : "10a";
    return AT_FILE[s.k] || null;
  }
  if (country === "SK") {
    if (s.k === "oneway") return dir === "backward" ? "230" : "321-30";
    if (s.k === "b20a") return SK_SPEEDS.includes(s.v) ? `253-${s.v}` : "253";
    if (s.k === "c10a") return s.walk === "left" ? "223-51" : "223-50";
    return SK_FILE[s.k] || null; // a sign SK has not (the shared zone): none
  }
  // IP 4c (vyhl. 205/2025): one-way with contraflow cyclists, in place of IP 4b + E 12a.
  if (s.k === "oneway") return dir === "backward" ? "B2" : s.plate === "protismer" ? "IP4c" : "IP4b";
  // Oblique stalls have the sign of perpendicular ones (IP 11b, Bára).
  if (s.k === "ip11a") return s.plate === "podelne" ? "IP11c" : s.plate ? "IP11b" : "IP11a";
  if (s.k === "ip27a" && s.plate === "kola") return "IZ6a-kola";
  // C 10a: the design has the pedestrians on the right; the side of the path (walk) when the data know it.
  if (s.k === "c10a") return s.walk === "left" ? "C10a" : "C10a-chodci-vpravo";
  if (s.k === "b20a") return [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130].includes(s.v) ? `B20a-${s.v}` : "B20a";
  return { b1: "B1", b2: "B2", b8: "B8", b11: "B11", b28: "B28", b29: "B29", b30: "B30", c8a: "C8a", c9a: "C9a", c10a: "C10a",
    ip11d: "IP11d", ip11e: "IP11e", ip11f: "IP11f", ip11g: "IP11g",
    ip12: "IP12", ztp: "IP12-ztp", ip14a: "IZ1a", ip15a: "IZ2a", ip20a: "IP20a-symbol", zona30: "IZ8a-30",
    ip26a: "IZ5a", ip27a: "IZ6a", cyklozona: "IZ9a", sdilena: "IZ10a", c7a: "C7a" }[s.k] || s.k;
}
// The plate under a sign: contraflow cyclists are E 12a under IP 4b and E 12b under B 2; E 13 carries a text.
export function plateFile(s, seg, country = "CZ") {
  if (country === "AT") return null;
  if (country === "SK") {
    if (s.plate === "protismer") return (s.dir ?? seg?.dir) === "backward" ? "507-bicykle" : "514";
    if (s.plate === "obsluha") return "obsluha";
    if (s.plate === "kolo" || s.plate === "kola") return "515-bicykle";
    return { ip12: "531", ztp: "ztp" }[s.k] || null;
  }
  if (s.plate === "protismer") return (s.dir ?? seg?.dir) === "backward" ? "E12b" : null; // IP 4c says it itself
  if (s.plate === "obsluha") return "E13";
  if (s.plate === "kolo") return "C8a"; // the round bike symbol under the bus of IP 20a
  return null;
}

// Signs a state has drawings for (Fable and the hostile review of Austria): in SK and AT the derived signs without a
// file of the state (the shared zone, a one-way in Austria, parking on the sidewalk) are dropped, and in AT those with a
// plate too (its Zusatztafeln are not drawn: B 1 alone would ban all entry, not all but local traffic).
export function drawable(x, seg, country = "CZ") {
  if (country !== "SK" && country !== "AT") return true;
  if (!signFile(x, seg, country)) return false;
  return !(country === "AT" && x.plate);
}
export function keepDrawable(profile, country = "CZ") {
  for (const s of profile.segments || []) if (s.signs) { s.signs = s.signs.filter((x) => drawable(x, s, country)); if (!s.signs.length) delete s.signs; }
  return profile;
}
