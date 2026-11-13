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

// A rainwater object under a part that runs into a network as drawn, red, or comes within NEAR of it, orange (Bára
// 12. 11. 2026): [{i, level, short, why}]. The standard asks for the conflicts with the networks and their
// protection zones to be checked (Standardy HDV, kap. 6.2.9) but gives no distances; NEAR is Bára's warning
// distance, not a protection zone (that is the networks' owners' to say). under: the networks of the cut (app.js undergroundFor: items with t across the cut, depth to the top,
// profil DN in mm; span.left the cut's reach on the A side), or null.
const NEAR = 0.5;
export function checkUnder(profile, under) {
  if (!under?.items?.length) return [];
  const out = [];
  let x = 0;
  profile.segments.forEach((s, i) => {
    const z = s.under && underSize(s);
    if (z) {
      // One warning per object (Fable: one per network repeated itself), red when it runs into any.
      const hits = new Set(), near = new Set();
      const cx = x + s.width / 2;
      for (const it of under.items) {
        const k = under.kinds?.[it.kind];
        const dn = it.profil > 20 && it.profil < 3000 ? it.profil : k?.dn || 110, r = dn / 2000;
        const m = under.span.left - it.t, depth = it.depth + r; // the network's centre: across from A, and down
        // How far the pipe's rim is from the object, across and down (0 inside it).
        const gap = Math.hypot(Math.max(0, Math.abs(m - cx) - z.w / 2), Math.max(0, z.top - depth, depth - z.top - z.h)) - r;
        if (gap >= NEAR) continue;
        (gap <= 0 ? hits : near).add(t("{net} v hloubce {d}", { net: k?.label || it.kind, d: fmt(it.depth) }));
      }
      if (hits.size || near.size) {
        const name = HDV_UNDER[s.under].label;
        const v = { obj: name[0].toUpperCase() + name.slice(1), part: (TYPES[s.type]?.label || s.type).toLowerCase(), near: fmt(NEAR) };
        const nearText = (list) => t("blíž než {near} od: {list}", { ...v, list });
        const short = hits.size
          ? t("{obj} pod částí {part} narazí na: {list}", { ...v, list: [...hits].join(", ") }) + (near.size ? `; ${nearText([...near].join(", "))}` : "")
          : t("{obj} pod částí {part}: {what}", { ...v, what: nearText([...near].join(", ")) });
        out.push({ i, level: hits.size ? "min" : "zaklad", short, why: t("střet se sítí a jejím ochranným pásmem posuďte se správcem sítě (Standardy HDV, kap. 6.2.9)") });
      }
    }
    x += s.width;
  });
  return out;
}

// Trees planted in the design (in a part, or a stromořadí's own, in its middle) near a network (Bára 13. 11. 2026):
// [{i, level, short, why}], one per part. A tree counts as planted where the existing street has none within 1 m.
// The distances are the Prague building rules' (Pražské stavební předpisy, souhrnné znění IPR 2025/01, příloha č. 1,
// bod I: the least distance of an underground network from the foot of a tree's trunk), measured across the street to
// the network's rim: ok without measures from free, possible with technical measures (a root barrier or a duct) from
// barrier, else red; null barrier: no measures allowed. By the network's kind and its description (CTMTP_POPIS).
function treeRule(it) {
  const p = it.popis || "", dn = it.profil > 20 && it.profil < 3000 ? it.profil : null;
  const rule = (() => {
    switch (it.kind) {
      case "vodovod": return { free: 2.5, barrier: 1.0 };
      // A sewer deeper than 6 m allows trees in its protection zone (point b) 4); of an unknown size, the larger one's.
      case "kanalizace": return it.measured && it.depth > 6 ? null : dn && dn <= 500 ? { free: 1.5, barrier: 0 } : { free: 2.5, barrier: 0 };
      // The cathodic protection's cable along a gas main is a cable.
      case "plynovod": return /kabel/.test(p) ? { free: 1.0, barrier: 0.5 } : /VTL/.test(p) ? { free: 4, barrier: null } : { free: 1, barrier: null };
      case "teplovod": return { free: 2.5, barrier: null };
      case "silnoproud": return /VVN/.test(p) ? { free: 1.5, barrier: 1.0 } : { free: 1.0, barrier: 0.5 };
      case "slaboproud": return { free: 1.0, barrier: 0.5 };
      // A collector under less than 5 m of cover (an unknown depth counts as shallow).
      case "jine": return /kolektor/.test(p) && !(it.measured && it.depth >= 5) ? { free: 3.0, barrier: 1.5 } : null;
      default: return null;
    }
  })();
  // A network in a duct has its technical measure already (point I: laying it in a duct).
  return rule && /chráničk/.test(p) && rule.barrier !== null ? { free: rule.barrier, barrier: rule.barrier } : rule;
}
const treesOf = (p) => {
  const out = [];
  let x = 0;
  p.segments.forEach((s, i) => {
    if (s.type === "stromorad") out.push({ i, x: x + s.width / 2 });
    for (const it of s.items || []) if (it.kind === "strom") out.push({ i, x: x + it.f * s.width });
    x += s.width;
  });
  return out;
};
export function checkTrees(design, stav, under) {
  if (!under?.items?.length) return [];
  const old = treesOf(stav);
  const byPart = new Map();
  const where = (it) => under.span.left - it.t;
  // A collector's body is drawn as its two walls: a tree between two of them (up to 6 m apart) stands over it.
  const walls = under.items.filter((it) => it.kind === "jine" && /těleso kolektoru/.test(it.popis || "")).map(where).sort((a, b) => a - b);
  for (const tree of treesOf(design)) {
    if (old.some((o) => Math.abs(o.x - tree.x) < 1)) continue;
    // The nearest network of each kind (one line of each, Fable), red ones first.
    const found = new Map();
    const overCollector = walls.some((w, k) => k + 1 < walls.length && w < tree.x && walls[k + 1] > tree.x && walls[k + 1] - w <= 6);
    for (const it of under.items) {
      const rule = treeRule(it);
      if (!rule) continue;
      const collector = it.kind === "jine";
      if (collector && overCollector) { found.set("kolektor", { gap: 0, rule, it, red: true }); continue; }
      const k = under.kinds?.[it.kind];
      const dn = it.profil > 20 && it.profil < 3000 ? it.profil : k?.dn || 110;
      const gap = Math.abs(where(it) - tree.x) - dn / 2000;
      if (gap >= rule.free - 0.005) continue;
      // An unknown depth of a collector: orange at most (it may lie deep).
      const red = (rule.barrier === null || gap < rule.barrier - 0.005 || gap <= 0) && !(collector && !it.measured);
      const name = collector ? "kolektor" : it.kind, was = found.get(name);
      if (!was || gap < was.gap) found.set(name, { gap, rule, it, red });
    }
    if (!found.size) continue;
    const part = byPart.get(tree.i) || { red: false, list: [] };
    for (const [name, { gap, rule, red }] of [...found].sort((q, r) => r[1].red - q[1].red || q[1].gap - r[1].gap)) {
      const v = { net: name === "kolektor" ? t("kolektor") : under.kinds?.[name]?.label || name, d: fmt(+Math.max(0, gap).toFixed(2)), free: fmt(rule.free), barrier: fmt(rule.barrier ?? 0) };
      const text = gap <= 0 ? t("{net} přímo pod stromem", v)
        : rule.barrier === null ? t("{net} {d} od kmene (nejméně {free})", v)
        : rule.barrier ? t("{net} {d} od kmene (bez opatření od {free}, s opatřením od {barrier})", v)
        : t("{net} {d} od kmene (bez opatření od {free}, blíž jen s opatřením)", v);
      part.red ||= red;
      if (!part.list.includes(text)) part.list.push(text);
    }
    byPart.set(tree.i, part);
  }
  return [...byPart].map(([i, { red, list }]) => ({
    i, level: red ? "min" : "zaklad",
    short: t("Nový strom v části {part} je blízko sítí: {list}", { part: (TYPES[design.segments[i].type]?.label || "").toLowerCase(), list: list.join(", ") }),
    why: t("Pražské stavební předpisy, příloha č. 1, bod I: vzdálenost sítě od paty kmene; technickým opatřením je kořenová bariéra nebo chránička"),
  }));
}
