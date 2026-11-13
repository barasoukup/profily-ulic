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

// How much of the street lets the rain in (Magdalena, 13. 11. 2026): permeable (green, swales, trenches and ponds,
// a grass or gravel tram bed, an unpaved surface), partly permeable (permeable paving, grass pavers), sealed (asphalt,
// paving, concrete, tram panels) and the rest (water, walls, unknown). By the part's surface; what lies under it does
// not count.
export const SURFACE_GROUPS = [
  { key: "propustne", label: t("Propustné"), color: "#7fb04a" },
  { key: "castecne", label: t("Částečně propustné"), color: "#b8c98a" },
  { key: "nepropustne", label: t("Nepropustné"), color: "#7c7a74" },
  { key: "jine", label: t("Voda a ostatní"), color: "#dcd8cd" },
];
const GREEN = new Set(["zelen", "stromorad", "predzahradka", "pruleh", "ryha", "nadrz"]);
const OTHER = new Set(["voda", "zed", "nezname"]);
function surfaceOf(s) {
  if (GREEN.has(s.type)) return "propustne";
  if (OTHER.has(s.type)) return "jine";
  if (s.type === "tramvaj") return ["trava", "strk"].includes(s.bed) ? "propustne" : "nepropustne";
  if (s.permeable === "nezpevneny") return "propustne";
  if (s.permeable) return "castecne";
  return "nepropustne";
}
export function surfaces(profile) {
  const total = profile.segments.reduce((a, s) => a + s.width, 0) || 1;
  const m = Object.fromEntries(SURFACE_GROUPS.map((g) => [g.key, 0]));
  for (const s of profile.segments) m[surfaceOf(s)] += s.width;
  return SURFACE_GROUPS.map((g) => ({ ...g, m: +m[g.key].toFixed(2), pct: (100 * m[g.key]) / total }));
}
