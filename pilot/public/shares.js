// How the width of the street is shared out: walking, cycling, public transport, moving cars,
// parking, green and the rest (metres and per cent of the whole cut, edges not counted). A part
// shared by two counts half for each (Bára): the shared path for walking and cycling, the bus lane
// open to cyclists, the lane with a tram. Where cyclists are only let in (a sidewalk open to them, a
// lane with sharrows) the part counts for walking or cars alone.
import { t } from "./i18n.js";

export const SHARE_GROUPS = [
  { key: "pesi", label: t("Pěší"), color: "#cbb89a" },
  { key: "kola", label: t("Cyklisté"), color: "#c0604f" },
  { key: "mhd", label: t("MHD"), color: "#d8413f" },
  { key: "auta", label: t("Auta v pohybu"), color: "#5c5c59" },
  { key: "parkovani", label: t("Parkování"), color: "#9b9b97" },
  { key: "zelen", label: t("Zeleň"), color: "#7fb04a" },
  { key: "ostatni", label: t("Ostatní"), color: "#dcd8cd" },
];
const SHARE_OF = {
  chodnik: "pesi", chodnik_kola: "pesi", stezka_sdilena: ["pesi", "kola"],
  cyklostezka: "kola", cyklopruh: "kola", ochranny_pruh: "kola",
  nastupiste: "mhd", bus: "mhd", bus_cyklo: ["mhd", "kola"], tramvaj_v_pruhu: ["mhd", "auta"], tramvaj_pruh: "mhd", tramvaj: "mhd",
  pruh: "auta", pruh_piktokoridor: "auta", obsluzna: "auta", krajnice: "auta",
  parkovani: "parkovani",
  zelen: "zelen", stromorad: "zelen", predzahradka: "zelen",
  // Rainwater objects (types.js water) count with the green: they are green and blue infrastructure.
  pruleh: "zelen", ryha: "zelen", nadrz: "zelen",
};

export function shares(profile) {
  const total = profile.segments.reduce((a, s) => a + s.width, 0) || 1;
  const m = Object.fromEntries(SHARE_GROUPS.map((g) => [g.key, 0]));
  for (const s of profile.segments) {
    const to = [SHARE_OF[s.type] || "ostatni"].flat();
    for (const k of to) m[k] += s.width / to.length;
  }
  return SHARE_GROUPS.map((g) => ({ ...g, m: +m[g.key].toFixed(2), pct: (100 * m[g.key]) / total }));
}
