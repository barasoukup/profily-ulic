// Address search in Denmark (Bára 23. 11. 2026): GSearch of Dataforsyningen (Klimadatastyrelsen, api.dataforsyningen.dk/rest/gsearch/v2.0,
// CORS for the origin asking; only with the app's token, keys.js; evaluation/denmark/ZDROJE.md 4): a query with a house
// number asks the house numbers (husnummer), other text the named streets (navngivenvej); positions in WGS 84 (srid
// 4326). Without the token, or when GSearch fails or finds nothing, Photon of komoot (search-photon.js "photon-dk"). One request a pause in typing (search.js
// debounces and cancels). DAWA, the old service, is gone (410).
import { dkToken } from "./keys.js";

export const GSEARCH = "https://api.dataforsyningen.dk/rest/gsearch/v2.0";
const MAX = 15;
export const gsearchReady = () => !!dkToken();
export const gsearchUrl = (text, token = dkToken()) => {
  const resource = /\d/.test(text) ? "husnummer" : "navngivenvej";
  return `${GSEARCH}/${resource}?${new URLSearchParams({ q: text, limit: String(MAX), srid: "4326", token })}`;
};
// The middle of a street: the middle vertex of its longest part.
const middle = (g) => {
  const parts = g?.type === "MultiLineString" ? g.coordinates : g?.type === "LineString" ? [g.coordinates] : [];
  const longest = parts.slice().sort((a, b) => b.length - a.length)[0];
  return longest?.length ? longest[longest.length >> 1] : null;
};
// The items look like RÚIAN's (text, type AdresniMisto or Ulice, at: the point and the street).
export function parseDk(json) {
  const out = [];
  for (const x of Array.isArray(json) ? json : []) {
    if (x.husnummertekst !== undefined || x.vejpunkt_geometri) {
      const c = x.geometri?.coordinates?.[0] || x.vejpunkt_geometri?.coordinates?.[0];
      if (c && x.visningstekst) out.push({ text: x.visningstekst, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street: x.vejnavn } });
    } else if (x.vejnavn) {
      const c = middle(x.geometri);
      if (c && x.visningstekst) out.push({ text: x.visningstekst, type: "Ulice", at: { lon: c[0], lat: c[1], street: x.vejnavn } });
    }
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
// Towns and city districts (the place names of the kind "bebyggelse": by, bydel…) for a query without a number (the
// review of 24. 11. 2026: "Odense" found Odensevej and the airport, not the town), at the middle of their box.
export const townUrl = (text, token = dkToken()) => `${GSEARCH}/stednavn?${new URLSearchParams({ q: text, limit: "10", srid: "4326", token })}`;
const boxMiddle = (g) => {
  const ring = g?.type === "Polygon" ? g.coordinates[0] : null;
  if (ring?.length) { const xs = ring.map((c) => c[0]), ys = ring.map((c) => c[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; }
  return g?.type === "Point" ? g.coordinates : null;
};
export function parseDkTowns(json) {
  const out = [];
  for (const x of Array.isArray(json) ? json : []) {
    if (x.stednavn_type !== "bebyggelse" || !x.skrivemaade) continue;
    const c = boxMiddle(x.bbox) || x.geometri?.coordinates?.flat(3).slice(0, 2);
    if (c?.length === 2 && Number.isFinite(c[0])) out.push({ text: x.visningstekst || x.skrivemaade, type: "Obec", at: { lon: c[0], lat: c[1] } });
  }
  return out;
}
// Nearest the map's centre first (the review: of 13 streets named Rådhuspladsen Copenhagen's was the tenth, past the
// eight shown); search.js ranks by the text and keeps this order among equals. near: [lat, lon] or nothing.
export const byDistance = (items, near) => {
  if (!near) return items;
  const c = Math.cos((near[0] * Math.PI) / 180), d = (it) => ((it.at.lon - near[1]) * c) ** 2 + (it.at.lat - near[0]) ** 2;
  return items.map((it) => [it, d(it)]).sort((a, b) => a[1] - b[1]).map(([it]) => it);
};
// Throws when GSearch fails (a token turned away: 401; the move to the new platform 26.–30. 11. 2026): search.js then
// asks Photon. The towns' request failing alone loses only the towns.
export async function findDk(text, getJSON, signal, near) {
  if (!gsearchReady() || text.length < 3) return [];
  const [main, towns] = await Promise.all([
    getJSON(gsearchUrl(text), signal).then(parseDk),
    /\d/.test(text) ? [] : getJSON(townUrl(text), signal).then(parseDkTowns, (err) => { if (err.name === "AbortError") throw err; return []; }),
  ]);
  return byDistance([...towns, ...main], near);
}
