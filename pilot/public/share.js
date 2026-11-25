// A design carried in the address: the parts of Návrh (and of Stav when its data were corrected by
// hand), packed small (deflate, base64url) after the cut in the link: #rez=…&navrh=…&stav=….
// Only what the drawing needs travels: types, widths and their settings, edge kinds and looks.
import { t } from "./i18n.js";
const SEG_KEYS = ["type", "width", "dir", "bikeDir", "orient", "use", "turn", "items", "source", "bed", "withBus", "roadClass", "position", "signs", "trolley", "wires", "color", "under", "permeable", "underSize"];
const EDGE_KEYS = ["left", "right", "leftStyle", "rightStyle", "leftLevels", "rightLevels"];

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined && o[k] !== null).map((k) => [k, o[k]]));

async function pack(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const zipped = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
  let bin = "";
  for (const b of new Uint8Array(zipped)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function unpack(text) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const json = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  return JSON.parse(json);
}

export const packProfile = (p) => pack({ s: p.segments.map((s) => pick(s, SEG_KEYS)), e: pick(p.edges, EDGE_KEYS) });

// A link is short; anything far bigger is not a street (and must not freeze the page).
const MAX_TEXT = 20000, MAX_PARTS = 200;
export async function unpackProfile(text) {
  if (text.length > MAX_TEXT) throw new Error(t("odkaz je příliš dlouhý"));
  const o = await unpack(text);
  if (!Array.isArray(o?.s) || o.s.length > MAX_PARTS) throw new Error(t("vadný počet částí"));
  return { segments: o.s, edges: o.e || {} };
}

// The cut's link: #rez=lat,lon,bearing,left,right,way. The last number is the OSM way the cut belongs to (Bára 25. 11.
// 2026: of 226 cuts opened again at the same point 10 took the other carriageway): a sixth number after the reach, so a
// page that does not know it, and logging/worker.js CUT_PATH, read the link as before. Links without it open as before.
export function cutHash(cut, reach) {
  const way = Number.isSafeInteger(cut.wayId) && cut.wayId > 0 ? `,${cut.wayId}` : "";
  return `#rez=${cut.lat.toFixed(6)},${cut.lon.toFixed(6)},${Math.round(cut.bearing)},${reach.left.toFixed(1)},${reach.right.toFixed(1)}${way}`;
}
// "#rez=…" anywhere in a text (an address, the copied position): { lat, lon, bearing, reach, way } or null.
export function parseCutHash(text) {
  const h = text.match(/#rez=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,([\d.]+),([\d.]+)(?:,(\d{1,15}))?)?/);
  return h && { lat: +h[1], lon: +h[2], bearing: +h[3], reach: h[4] ? { left: +h[4], right: +h[5] } : null, way: h[6] ? +h[6] : null };
}
// Is it the same cut as a saved one (a reload)? A link without the way is, as before, whatever the way.
export const sameCut = (a, b) => !!a && !!b && a.lat.toFixed(6) === b.lat.toFixed(6) && a.lon.toFixed(6) === b.lon.toFixed(6) && Math.round(a.bearing) === Math.round(b.bearing)
  && (!a.way || !b.wayId || a.way === b.wayId);

// The design parameters of a #rez= address: {navrh, stav} as packed strings (either may be missing).
export function designParams(hash) {
  const q = new URLSearchParams(hash.replace(/^#rez=[^&]*&?/, ""));
  return { navrh: q.get("navrh"), stav: q.get("stav") };
}
