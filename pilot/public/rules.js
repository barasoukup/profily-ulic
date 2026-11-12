// Width rules for a street design, after IPR Praha: Manuál tvorby veřejných prostranství, kap. C.2
// (text in data/zdroje/ipr_manual_C2.txt). "min": below the minimum the manual allows;
// "zaklad": narrower than the manual's basic (recommended) width.
import { TYPES, HDV_UNDER, underSize } from "./types.js";
import { t, num } from "./i18n.js";

const fmt = (v) => `${num(v)} m`;

// A driving lane by the class of the street (Prague: TSK's class, derive.js classGroup, as the functional group of
// ČSN 73 6110; Bára 10. 11. 2026). ČSN 73 6110 (after ČVUT FD): group A 3.50 m, B 3.00–3.25 m, C 2.75–3.00 m;
// Manuál C.2: a basic lane 3.00 m in important streets, 2 × 2.75 m (2 × 2.50 m at low volumes) in calm streets.
// Zákon 13/1997 Sb. § 6 and its decree: MK I is a rapid or a collector road (A or B), MK II a collector or service
// road; TSK does not say which, so MK I and II take group B and only motorways group A.
const GROUP = { dalnice: "A", mk1: "B", mk2: "B", sil1: "B", sil2: "B", mk3: "C", sil3: "C", mk4: "D" };
const LANE_BY_GROUP = {
  A: { min: 3, zaklad: 3.5, why: t("jízdní pruh dálnice: ČSN 73 6110 skupina A 3,5 m") },
  B: { min: 3, zaklad: 3, why: t("jízdní pruh sběrné komunikace MK I nebo II: ČSN 73 6110 skupina B 3–3,25 m, Manuál C.2 základ 3 m") },
  C: { min: 2.75, zaklad: 3, why: t("jízdní pruh obslužné komunikace MK III: ČSN 73 6110 skupina C 2,75–3 m") },
  D: { min: 2.5, zaklad: 2.75, why: t("jízdní pruh zklidněné komunikace MK IV: Manuál C.2 2,75 m, při nízkých intenzitách 2,5 m") },
};
const laneByClass = (cls) => LANE_BY_GROUP[GROUP[cls]];

// Width a part should have: [minimum, basic], or null when the manual gives none for it.
function limits(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola": case "stezka_sdilena":
      // Minimum narrowed sidewalk 1.5 m (1.2 m in exceptions), basic 2–2.5 m. Beside cars parked on it (OSM
      // on_kerb / half_on_kerb) the same holds for what the cars leave free.
      if (parking?.position) return { min: 1.5, zaklad: 2, why: parking.position === "on_kerb" ? t("zbytek chodníku vedle stání na chodníku: zúžený chodník min. 1,5 m, základ 2–2,5 m") : t("zbytek chodníku vedle stání napůl na chodníku: zúžený chodník min. 1,5 m, základ 2–2,5 m") };
      return { min: 1.5, zaklad: 2, why: t("chodník: zúžený min. 1,5 m, základ 2–2,5 m") };
    case "pruh": case "pruh_piktokoridor":
      // A turning lane: about 2.5 m in tight places (Manuál C.2); narrower is orange (Bára 11. 11. 2026).
      if (s.turn) return { min: 0, zaklad: 2.5, why: t("řadicí pruh: cca 2,5 m ve stísněných poměrech (Manuál C.2)") };
      return laneByClass(s.roadClass ?? segs.find((x) => x.roadClass)?.roadClass) || { min: 2.5, zaklad: 3, why: t("jízdní pruh: základ 3 m, ve zklidněné ulici 2,5 m") };
    case "bus": case "bus_cyklo":
      return s.type === "bus_cyklo"
        ? { min: 4.25, zaklad: 4.25, why: t("pruh pro autobus a cyklisty: 4,25–4,5 m") }
        : { min: 3, zaklad: 3.25, why: t("pruh pro autobusy: 3,25 m") };
    case "cyklopruh": case "ochranny_pruh": {
      if (parking) {
        const perp = parking.orient === "kolme" || parking.orient === "sikme";
        return perp
          ? { min: 2, zaklad: 2, why: t("cyklopruh vedle kolmého nebo šikmého stání: min. 2 m") }
          : { min: 1.75, zaklad: 1.75, why: t("cyklopruh vedle podélného stání: min. 1,75 m") };
      }
      return s.type === "ochranny_pruh"
        ? { min: 1.25, zaklad: 1.5, why: t("ochranný cyklopruh: základ 1,5 m, nejméně 1,25 m") }
        : { min: 1.5, zaklad: 1.5, why: t("cyklopruh u obruby: 1,5 m") };
    }
    // Below these widths orange only (Bára 11. 11. 2026).
    case "cyklostezka":
      return { min: 0, zaklad: 2.5, why: t("cyklostezka: 2,5 m") };
    case "nastupiste":
      return { min: 0, zaklad: 2, why: t("nástupiště zastávky: světlá šířka nejméně 2 m (Manuál C.2)") };
    case "parkovani":
      // Angled stalls keep the rules of perpendicular ones, their depth by the angle (Manuál C.2): 2.5 × 5 m at 45°
      // is about 5.3 m deep, at 30° 4.7 m.
      return s.orient === "kolme" || s.orient === "sikme"
        ? { min: 4.5, zaklad: 5, why: t("kolmé a šikmé stání: 5 m (4,5 m s přesahem nad chodník)") }
        : { min: 2, zaklad: 2, why: t("podélné stání: 2 m") };
    default:
      return null;
  }
}

// Tram parts that make a belt of their own: the reserved tram lane and the separate tram bed (not the tram in a
// lane with cars).
const BELT = new Set(["tramvaj_pruh", "tramvaj"]);
// The parts of a one-way carriageway that cars and contraflow cyclists share, and the cycle lanes that give the
// cyclists a lane of their own.
const CONTRA_RUN = new Set(["pruh", "pruh_piktokoridor", "krajnice"]);
const BIKE_LANE = new Set(["cyklopruh", "ochranny_pruh"]);

// [{i, level, text}] for the parts of a profile that break the rules.
export function checkRules(profile) {
  const segs = profile.segments;
  const out = [];
  segs.forEach((s, i) => {
    const l = limits(s, segs, i);
    if (!l) return;
    const label = TYPES[s.type]?.label || s.type;
    // short and why: the warning in two pieces for the list in Návrh (the short one bold, the rule after it).
    const v = { label, w: fmt(s.width), why: l.why };
    if (s.width < l.min - 0.005) out.push({ i, level: "min", text: t("{label} {w} je pod minimem ({why}).", v), short: t("{label} {w}: pod minimem", v), why: l.why });
    else if (s.width < l.zaklad - 0.005) out.push({ i, level: "zaklad", text: t("{label} {w} je užší než základ ({why}).", v), short: t("{label} {w}: užší než základ", v), why: l.why });
  });
  // A one-way carriageway with contraflow cyclists and no cycle lane of their own (IP 4c): its lanes with the
  // hard shoulder and hatching, without parking, 4 m as the basic width and 3 m at very low volumes (Manuál
  // C.2; 4.5 m at higher volumes; Bára 11. 11. 2026). It takes the place of the lanes' own warnings.
  for (let i = 0; i < segs.length; i++) {
    if (!CONTRA_RUN.has(segs[i].type)) continue;
    let j = i, w = 0;
    while (j < segs.length && CONTRA_RUN.has(segs[j].type)) w += segs[j++].width;
    const run = segs.slice(i, j);
    const bikeLane = [segs[i - 1], segs[j]].some((x) => BIKE_LANE.has(x?.type));
    if (!bikeLane && run.some((x) => x.signs?.some((g) => g.k === "oneway" && g.plate === "protismer"))) {
      for (let k = out.length - 1; k >= 0; k--) if (out[k].i >= i && out[k].i < j) out.splice(k, 1);
      const why = t("jednosměrka s cyklisty v protisměru: základ 4 m, při velmi nízké intenzitě 3 m, při vyšší až 4,5 m (Manuál C.2)");
      const v = { label: t("Vozovka"), w: fmt(w), why };
      if (w < 3 - 0.005) out.push({ i, level: "min", text: t("Vozovka {w} je pod minimem ({why}).", v), short: t("{label} {w}: pod minimem", v), why });
      else if (w < 4 - 0.005) out.push({ i, level: "zaklad", text: t("Vozovka {w} je užší než základ ({why}).", v), short: t("{label} {w}: užší než základ", v), why });
    }
    i = j - 1;
  }
  // A tram belt (adjacent tram parts) of two tracks, a reserved tram lane or a separate bed, needs 6.5 m at
  // least, 7 m as the standard and 8 m with the overhead-line poles between the tracks (Manuál C.2; Bára:
  // 6.5–7 m without poles is orange).
  for (let i = 0; i < segs.length; i++) {
    if (!TYPES[segs[i].type]?.tracks) continue;
    let j = i, w = 0;
    while (j < segs.length && TYPES[segs[j].type]?.tracks) w += segs[j++].width;
    const belt = segs.slice(i, j);
    if (j - i >= 2 && belt.every((x) => BELT.has(x.type))) {
      const poles = belt.some((x) => x.items?.some((it) => it.kind === "sloup_trakce"));
      if (w < 6.5 - 0.005) out.push({ i, level: "min", text: t("Tramvajový pás {w} je užší než minimum 6,5 m pro dvě koleje.", { w: fmt(w) }) });
      else if (poles && w < 8 - 0.005) out.push({ i, level: "zaklad", text: t("Tramvajový pás se sloupy trakčního vedení {w} je užší než 8 m (Manuál C.2).", { w: fmt(w) }) });
      else if (!poles && w < 7 - 0.005) out.push({ i, level: "zaklad", text: t("Tramvajový pás {w} je užší než standard 7 m (Manuál C.2).", { w: fmt(w) }) });
    }
    i = j - 1;
  }
  return out;
}

// A rainwater object under a part that runs into a network as drawn (Bára 12. 11. 2026): [{i, level, short, why}].
// The standard asks for the conflicts with the networks and their protection zones to be checked (Standardy HDV,
// kap. 6.2.9) but gives no distances, so only an overlap counts, not a distance (that is the networks' owners'
// to say). under: the networks of the cut (app.js undergroundFor: items with t across the cut, depth to the top,
// profil DN in mm; span.left the cut's reach on the A side), or null.
export function checkUnder(profile, under) {
  if (!under?.items?.length) return [];
  const out = [];
  let x = 0;
  profile.segments.forEach((s, i) => {
    const z = s.under && underSize(s);
    if (z) {
      const cx = x + s.width / 2;
      for (const it of under.items) {
        const k = under.kinds?.[it.kind];
        const dn = it.profil > 20 && it.profil < 3000 ? it.profil : k?.dn || 110, r = dn / 2000;
        const m = under.span.left - it.t, depth = it.depth + r; // the network's centre: across from A, and down
        if (Math.abs(m - cx) > z.w / 2 + r || depth < z.top - r || depth > z.top + z.h + r) continue;
        const name = HDV_UNDER[s.under].label;
        const v = { obj: name[0].toUpperCase() + name.slice(1), part: TYPES[s.type]?.label || s.type, net: k?.label || it.kind, d: fmt(it.depth) };
        out.push({ i, level: "zaklad", short: t("{obj} pod částí {part} narazí na {net} ({d} pod povrchem)", v), why: t("střet se sítí a jejím ochranným pásmem posuďte se správcem sítě (Standardy HDV, kap. 6.2.9)") });
      }
    }
    x += s.width;
  });
  return out;
}
