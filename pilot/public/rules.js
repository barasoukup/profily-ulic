// Width rules for a street design, after IPR Praha: Manuál tvorby veřejných prostranství, kap. C.2
// (text in data/zdroje/ipr_manual_C2.txt). "min": below the minimum the manual allows;
// "zaklad": narrower than the manual's basic (recommended) width.
import { TYPES } from "./types.js";

const fmt = (v) => `${v.toFixed(2).replace(".", ",")} m`;

// Width a part should have: [minimum, basic], or null when the manual gives none for it.
function limits(s, segs, i) {
  const parking = [segs[i - 1], segs[i + 1]].find((x) => x?.type === "parkovani");
  switch (s.type) {
    case "chodnik": case "chodnik_kola": case "stezka_sdilena":
      // Minimum narrowed sidewalk 1.5 m (1.2 m in exceptions), basic 2–2.5 m.
      return { min: 1.5, zaklad: 2, why: "chodník: zúžený min. 1,5 m, základ 2–2,5 m" };
    case "pruh": case "pruh_piktokoridor":
      return { min: 2.5, zaklad: 3, why: "jízdní pruh: základ 3 m, ve zklidněné ulici 2,5 m" };
    case "bus": case "bus_cyklo":
      return s.type === "bus_cyklo"
        ? { min: 4.25, zaklad: 4.25, why: "pruh pro autobus a cyklisty: 4,25–4,5 m" }
        : { min: 3, zaklad: 3.25, why: "pruh pro autobusy: 3,25 m" };
    case "cyklopruh": {
      if (parking) {
        const perp = parking.orient === "kolme" || parking.orient === "sikme";
        return perp
          ? { min: 2, zaklad: 2, why: "cyklopruh vedle kolmého nebo šikmého stání: min. 2 m" }
          : { min: 1.75, zaklad: 1.75, why: "cyklopruh vedle podélného stání: min. 1,75 m" };
      }
      return { min: 1.5, zaklad: 1.5, why: "cyklopruh u obruby: 1,5 m" };
    }
    case "parkovani":
      return s.orient === "kolme" || s.orient === "sikme"
        ? { min: 4.5, zaklad: 5, why: "kolmé a šikmé stání: 5 m (4,5 m s přesahem nad chodník)" }
        : { min: 2, zaklad: 2, why: "podélné stání: 2 m" };
    default:
      return null;
  }
}

// [{i, level, text}] for the parts of a profile that break the rules.
export function checkRules(profile) {
  const segs = profile.segments;
  const out = [];
  segs.forEach((s, i) => {
    const l = limits(s, segs, i);
    if (!l) return;
    const label = TYPES[s.type]?.label || s.type;
    if (s.width < l.min - 0.005) out.push({ i, level: "min", text: `${label} ${fmt(s.width)} je pod minimem (${l.why}).` });
    else if (s.width < l.zaklad - 0.005) out.push({ i, level: "zaklad", text: `${label} ${fmt(s.width)} je užší než základ (${l.why}).` });
  });
  // A tram belt (adjacent tram parts) of two tracks needs 6.5 m.
  for (let i = 0; i < segs.length; i++) {
    if (!TYPES[segs[i].type]?.tracks) continue;
    let j = i, w = 0;
    while (j < segs.length && TYPES[segs[j].type]?.tracks) w += segs[j++].width;
    if (j - i >= 2 && segs.slice(i, j).every((x) => x.type === "tramvaj") && w < 6.5 - 0.005) {
      out.push({ i, level: "min", text: `Tramvajový pás ${fmt(w)} je užší než minimum 6,5 m pro dvě koleje.` });
    }
    i = j - 1;
  }
  return out;
}
