// Checks a saved profile (from the browser's storage or a JSON file) before the app uses it: a broken
// or edited file must not break the drawing. Unknown types and items are made harmless, numbers
// that the drawing needs must be numbers, a part without a usable width is an error.
import { TYPES, SOURCES, ITEMS, PARKING_USE } from "./types.js";

const num = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
// Building facts at the edges that end up in SVG attributes (heights, floors, area).
const INFO_NUMBERS = ["height", "levels", "cornice", "roof", "roofType", "iprKind", "area", "km", "period"];

export function cleanProfile(p, what = "profil") {
  if (!Array.isArray(p?.segments) || !p.segments.length) throw new Error(`${what}: chybí části profilu`);
  for (const s of p.segments) {
    if (typeof s !== "object" || !s) throw new Error(`${what}: vadná část`);
    if (!(s.type in TYPES)) s.type = "nezname";
    if (!num(s.width, 0.01, 200)) throw new Error(`${what}: vadná šířka části`);
    if (s.source && !(s.source in SOURCES)) s.source = "user";
    // Values the drawing reads as words: anything else is dropped.
    for (const k of ["dir", "bikeDir"]) if (k in s && !["forward", "backward"].includes(s[k])) delete s[k];
    if ("orient" in s && !["podelne", "sikme", "kolme"].includes(s.orient)) delete s.orient;
    if ("use" in s && !(s.use in PARKING_USE)) delete s.use;
    if ("turn" in s && typeof s.turn !== "string") delete s.turn;
    s.items = Array.isArray(s.items) ? s.items.filter((it) => it && it.kind in ITEMS && num(it.f, 0, 1)) : [];
  }
  p.edges = typeof p.edges === "object" && p.edges ? p.edges : {};
  for (const side of ["leftInfo", "rightInfo"]) {
    const info = p.edges[side];
    if (!info || typeof info !== "object") { delete p.edges[side]; continue; }
    for (const k of INFO_NUMBERS) if (k in info && !num(info[k], 0, 100000)) delete info[k];
    // The block's shape (derive.js blockShape) decides panel house or tenement: all four numbers or none.
    const b = info.block;
    if (b !== undefined && !(b && ["length", "width", "fill", "parts"].every((k) => num(b[k], 0, 100000)))) delete info.block;
  }
  return p;
}

// Position of the cut: numbers in and around Prague, reach of each side 1–40 m; else no cut.
export function cleanCut(c) {
  if (!c || !num(c.lat, 48, 52) || !num(c.lon, 12, 19) || !num(c.bearing, -360, 360)) return null;
  const reach = c.reach && num(c.reach.left, 1, 40) && num(c.reach.right, 1, 40) ? { left: c.reach.left, right: c.reach.right } : undefined;
  return { ...c, name: String(c.name || "Ulice"), note: typeof c.note === "string" ? c.note : "", reach };
}
