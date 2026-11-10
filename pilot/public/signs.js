// The row of traffic signs under the profile (Bára 10. 11. 2026): what the street's OSM tags and the profile's
// parts say about the traffic regime, as signs of vyhláška 294/2015 Sb. (files in znacky/).
// A sign is { k, v?, plate? }: k is the key of a sign, or of a regime whose sign depends on the direction of
// view (oneway: IP 4b when the traffic goes away from the viewer, B 2 when it comes towards them), so that
// "Otočit" needs no change of the data. Zones and the rules of the whole roadway are drawn once across it
// (zones), the rest under the part they belong to (seg.signs), at most MAX_PER_PART per part.
export const MAX_PER_PART = 2;

// Labels for the palette in Návrh and for the title of each drawn sign.
export const SIGNS = {
  b1: "B 1 Zákaz vjezdu všech vozidel",
  b11: "B 11 Zákaz vjezdu všech motorových vozidel",
  b8: "B 8 Zákaz vjezdu jízdních kol",
  b30: "B 30 Zákaz vstupu chodců",
  b20a: "B 20a Nejvyšší dovolená rychlost",
  b28: "B 28 Zákaz zastavení",
  b29: "B 29 Zákaz stání",
  oneway: "IP 4b / B 2 Jednosměrný provoz",
  c8a: "C 8a Stezka pro cyklisty",
  c9a: "C 9a Stezka pro chodce a cyklisty",
  c10a: "C 10a Stezka pro chodce a cyklisty dělená",
  ip11a: "IP 11a–c Parkoviště",
  ip12: "IP 12 Vyhrazené parkoviště",
  ztp: "IP 12 + O 1 Parkoviště pro ZTP",
  ip14a: "IZ 1a Dálnice",
  ip15a: "IZ 2a Silnice pro motorová vozidla",
  ip20a: "IP 20a Vyhrazený jízdní pruh BUS",
  zona30: "IZ 8a Zóna 30",
  zps: "IZ 8a Zóna placeného stání",
  ip26a: "IZ 5a Obytná zóna",
  ip27a: "IZ 6a Pěší zóna",
  cyklozona: "IZ 9a Zóna pro cyklisty",
  v9a: "V 9a Směrové šipky",
  v11a: "V 15 Nápis BUS",
  v13: "V 15 Nápis TRAM",
  v14: "V 14 Jízdní pruh pro cyklisty",
  v14p: "V 14 Ochranný pruh pro cyklisty",
  v20: "V 20 Piktogramový koridor pro cyklisty",
};
// Dodatkové tabulky (plate) of a sign: text of E 13, or a key of a pictogram.
export const PLATES = { kola: "s cyklisty", protismer: "cyklisté v protisměru", obsluha: "Mimo dopravní obsluhy", podelne: "podélné", kolme: "kolmé", sikme: "šikmé" };

const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "obsluzna"]);
const CARRIAGEWAY = new Set([...ROAD, "parkovani", "cyklopruh", "ochranny_pruh", "krajnice", "tramvaj"]);
const yes = (v) => ["yes", "designated", "permissive"].includes(v);
const num = (v) => { const m = /^(\d+)/.exec(String(v ?? "")); return m ? Number(m[1]) : undefined; };

// The speed that the zone sign already says (no B 20a of its own).
const ZONE_SPEED = { ip26a: 20, ip27a: 20, zona30: 30, cyklozona: 30 };

export function zoneSigns(tags = {}, ctx = {}) {
  const z = [];
  const hw = tags.highway;
  const zone = String(tags["zone:traffic"] || tags["zone:maxspeed"] || tags["maxspeed:type"] || "");
  if (hw === "motorway" || hw === "motorway_link") z.push({ k: "ip14a" });
  else if (tags.motorroad === "yes") z.push({ k: "ip15a" });
  if (hw === "living_street") z.push({ k: "ip26a" });
  else if (hw === "pedestrian") z.push(yes(tags.bicycle) ? { k: "ip27a", plate: "kola" } : { k: "ip27a" });
  else if (tags.cyclestreet === "yes" || tags.bicycle_road === "yes") z.push({ k: "cyklozona" });
  else if (/zone:?30$|:30$/.test(zone) && !/rural|urban$/.test(zone)) z.push({ k: "zona30" });
  if (ctx.inZps) z.push({ k: "zps" });
  // Entry bans of the whole street, with the exception of local traffic (destination).
  const ban = (v) => v === "no" || v === "destination" || v === "private";
  if (ban(tags.access) || ban(tags.vehicle)) z.push({ k: "b1", ...((tags.access || tags.vehicle) === "destination" ? { plate: "obsluha" } : {}) });
  else if (ban(tags.motor_vehicle)) z.push({ k: "b11", ...(tags.motor_vehicle === "destination" ? { plate: "obsluha" } : {}) });
  if (tags.bicycle === "no" && hw !== "motorway") z.push({ k: "b8" });
  const speed = num(tags.maxspeed);
  const zoned = z.find((s) => ZONE_SPEED[s.k]);
  if (speed && !tags["maxspeed:lanes"] && (!zoned || ZONE_SPEED[zoned.k] !== speed) && !tags["maxspeed:forward"] && !tags["maxspeed:backward"]) {
    if (!(speed === 50 && !/sign/.test(String(tags["source:maxspeed"] || "")) && !tags.traffic_sign)) z.push({ k: "b20a", v: speed });
  }
  return z;
}

// Signs of the parts of a derived profile (segments from the viewer's left to right) and of its roadway.
export function deriveSigns(profile, tags = {}, ctx = {}) {
  const segs = profile.segments;
  const zones = zoneSigns(tags, ctx);
  const road = segs.map((s, i) => (ROAD.has(s.type) ? i : -1)).filter((i) => i >= 0);
  // One-way: all the lanes go one way; contraflow cyclists when OSM opens it (oneway:bicycle=no) or a part
  // carries cyclists against the cars.
  const dirs = new Set(road.filter((i) => segs[i].type !== "obsluzna").map((i) => segs[i].dir || "forward"));
  if (road.length && ["yes", "1", "true", "-1"].includes(tags.oneway) && dirs.size === 1) {
    const contra = tags["oneway:bicycle"] === "no" || segs.some((s) => s.bikeDir && s.bikeDir !== [...dirs][0]);
    zones.push({ k: "oneway", dir: [...dirs][0], ...(contra ? { plate: "protismer" } : {}) });
  }
  const lanesSpeed = String(tags["maxspeed:lanes"] || "").split("|").map(num);
  const lanes = road.filter((i) => segs[i].type !== "obsluzna");
  segs.forEach((s, i) => {
    const out = [];
    const t = s.type;
    // Under the lane only the round bus symbol of IP 20a (Bára).
    if (t === "bus" || t === "bus_cyklo") out.push({ k: "ip20a" });
    else if (t === "cyklopruh") out.push({ k: "v14" });
    else if (t === "ochranny_pruh") out.push({ k: "v14p" });
    else if (t === "pruh_piktokoridor") out.push({ k: "v20" });
    else if (t === "cyklostezka") out.push({ k: "c8a" });
    else if (t === "stezka_sdilena") out.push({ k: tags.segregated === "yes" ? "c10a" : "c9a" });
    else if (t === "parkovani" && s.source !== "odhad") {
      if (s.use === "ztp") out.push({ k: "ztp" });
      else if (s.use) out.push({ k: "ip12" });
      else out.push({ k: "ip11a", ...(s.orient ? { plate: s.orient } : {}) });
    } else if (/^tramvaj_vyhrazen/.test(t)) out.push({ k: "v13" });
    if (s.turn && ROAD.has(t)) out.push({ k: "v9a", v: s.turn });
    // Speed per lane (maxspeed:lanes counts the lanes from the left in the way's direction).
    if (lanesSpeed.length === lanes.length && lanes.includes(i)) {
      const forward = lanes.filter((j) => (segs[j].dir || "forward") === "forward");
      const order = forward.length === lanes.length ? lanes : null;
      const v = order && lanesSpeed[order.indexOf(i)];
      if (v) out.push({ k: "b20a", v });
    } else if (lanes.includes(i)) {
      const v = num(tags[(s.dir || "forward") === "forward" ? "maxspeed:forward" : "maxspeed:backward"]);
      if (v) out.push({ k: "b20a", v });
    }
    if (out.length) s.signs = out.slice(0, MAX_PER_PART);
  });
  // No parking / no stopping on a kerb: on the outermost lane of that side (parking:<side>=no,
  // parking:<side>:restriction=no_stopping|no_parking). The way's right is the profile's right when the
  // profile looks along the way (ctx.alongWay), else its left.
  for (const side of ["left", "right"]) {
    const r = tags[`parking:${side}:restriction`] || tags["parking:both:restriction"];
    const k = r === "no_stopping" ? "b28" : r === "no_parking" ? "b29" : null;
    if (!k || !lanes.length) continue;
    const profileRight = (side === "right") === (ctx.alongWay !== false);
    const i = profileRight ? lanes.at(-1) : lanes[0];
    const s = segs[i];
    if ((s.signs || []).length < MAX_PER_PART && !(s.signs || []).some((x) => x.k === k)) s.signs = [...(s.signs || []), { k }];
  }
  // Ban on pedestrians: on the sidewalks' place, i.e. the roadway.
  if (tags.foot === "no" && !zones.some((z) => z.k === "ip14a" || z.k === "ip15a")) zones.push({ k: "b30" });
  const span = segs.map((s, i) => (CARRIAGEWAY.has(s.type) ? i : -1)).filter((i) => i >= 0);
  profile.zones = span.length && zones.length ? { from: span[0], to: span.at(-1), signs: zones } : undefined;
  if (!profile.zones) delete profile.zones;
  return profile;
}

// The file of a sign as drawn for a viewer, and its value: oneway becomes IP 4b or B 2 by the direction of
// the lanes (forward = away from the viewer).
export function signFile(s) {
  // IP 4c (vyhl. 205/2025): one-way with contraflow cyclists, in place of IP 4b + E 12a.
  if (s.k === "oneway") return s.dir === "backward" ? "B2" : s.plate === "protismer" ? "IP4c" : "IP4b";
  // Oblique stalls have the sign of perpendicular ones (IP 11b), the car turned on the symbol.
  if (s.k === "ip11a") return s.plate === "podelne" ? "IP11c" : s.plate === "sikme" ? "IP11b-sikme" : s.plate ? "IP11b" : "IP11a";
  if (s.k === "ip27a" && s.plate === "kola") return "IZ6a-kola";
  if (s.k === "b20a") return [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130].includes(s.v) ? `B20a-${s.v}` : "B20a";
  if (s.k === "v9a") return `V9a-${turnFile(s.v)}`;
  return { b1: "B1", b2: "B2", b8: "B8", b11: "B11", b28: "B28", b29: "B29", b30: "B30", c8a: "C8a", c9a: "C9a", c10a: "C10a",
    ip12: "IP12", ztp: "IP12-ztp", ip14a: "IZ1a", ip15a: "IZ2a", ip20a: "IP20a-symbol", zona30: "IZ8a-30", zps: "IZ8a-placene-stani",
    ip26a: "IZ5a", ip27a: "IZ6a", cyklozona: "IZ9a", v11a: "V15-bus", v13: "V15-tram", v14: "V14-souvisla", v14p: "V14-prerusovana", v20: "V20" }[s.k] || s.k;
}
// The plate under a sign: contraflow cyclists are E 12a under IP 4b and E 12b under B 2; E 13 carries a text.
export function plateFile(s) {
  if (s.plate === "protismer") return s.dir === "backward" ? "E12b" : null; // IP 4c says it itself
  if (s.plate === "obsluha") return "E13";
  return null;
}
// V 9a arrows from OSM turn values (through, left, right, slight_*, merge_* count as their side).
function turnFile(v = "") {
  const t = new Set(String(v).split(";").map((x) => (x.includes("left") ? "vlevo" : x.includes("right") ? "vpravo" : "rovne")));
  const has = (x) => t.has(x);
  if (has("rovne") && has("vlevo")) return "rovne-vlevo";
  if (has("rovne") && has("vpravo")) return "rovne-vpravo";
  if (has("vlevo") && has("vpravo")) return "vlevo-vpravo";
  return has("vlevo") ? "vlevo" : has("vpravo") ? "vpravo" : "rovne";
}

// Mirroring a profile ("Otočit") reverses the parts; zones keep their span, oneway its sense through dir.
export function mirrorSigns(profile, n = profile.segments.length) {
  if (profile.zones) profile.zones = { ...profile.zones, from: n - 1 - profile.zones.to, to: n - 1 - profile.zones.from, signs: profile.zones.signs.map((s) => (s.k === "oneway" ? { ...s, dir: s.dir === "backward" ? "forward" : "backward" } : s)) };
  return profile;
}
