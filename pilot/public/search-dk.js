// Address search in Denmark (Bára 23. 11. 2026): GSearch of Dataforsyningen (Klimadatastyrelsen, api.dataforsyningen.dk/rest/gsearch/v2.0,
// CORS for the origin asking; only with the app's token, keys.js; evaluation/denmark/ZDROJE.md 4): a query with a house
// number asks the house numbers (husnummer), other text the named streets (navngivenvej); positions in WGS 84 (srid
// 4326). Without the token Photon of komoot (search-photon.js "photon-dk"). One request a pause in typing (search.js
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
export async function findDk(text, getJSON, signal) {
  return gsearchReady() && text.length >= 3 ? parseDk(await getJSON(gsearchUrl(text), signal)) : [];
}
