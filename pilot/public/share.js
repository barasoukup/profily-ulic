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

// The design parameters of a #rez= address: {navrh, stav} as packed strings (either may be missing).
export function designParams(hash) {
  const q = new URLSearchParams(hash.replace(/^#rez=[^&]*&?/, ""));
  return { navrh: q.get("navrh"), stav: q.get("stav") };
}
