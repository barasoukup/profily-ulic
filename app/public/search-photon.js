import { closedAt } from "./city.js";
// Address search in Austria outside Vienna's own data (Bára 16. 11. 2026), in Germany, Switzerland and Liechtenstein (17. 11. 2026): Photon of komoot (photon.komoot.io, built
// on OpenStreetMap, CORS, fair use: search.js asks with its debounce and cancelling, at most one query a pause in
// typing). Only the results of the asked states (countrycode AT, DE, CH, LI). The items look like RÚIAN's (text, type Ulice / AdresniMisto /
// Obec) so search.js ranks them together; at carries the point and the street for the cut.
export const PHOTON = "https://photon.komoot.io/api/";
const MAX = 15;
// The states' boxes (the results are filtered by their country code as well).
// Switzerland and Liechtenstein (17. 11. 2026): their places in their own language (lang "default": Genève, Lugano,
// not Genf, Lauis).
const BOX = { AT: [9.53, 46.37, 17.16, 49.02], DE: [5.86, 47.27, 15.04, 55.06], CH: [5.95, 45.81, 10.5, 47.81], LI: [9.47, 47.04, 9.64, 47.28], BE: [2.5, 49.49, 6.41, 51.51], LU: [5.73, 49.44, 6.53, 50.19], PL: [14.1, 49.0, 24.2, 54.9], PT: [-31.3, 32.6, -6.18, 42.16], MC: [7.40, 43.72, 7.44, 43.76], CY: [32.2, 34.5, 34.65, 35.75], MT: [13.9, 35.5, 14.9, 36.35], IT: [6.6, 35.4, 18.6, 47.1], SI: [13.37, 45.42, 16.61, 46.88], FI: [19.08, 59.45, 31.59, 70.1], DK: [8.07, 54.55, 15.2, 57.76], LT: [20.93, 53.89, 26.84, 56.45], US: [-122.62, 37.64, -70.65, 42.74], CA: [-79.95, 43.45, -78.95, 44.05] };
// The USA and Canada (24. and 25. 11. 2026): only the metros of Washington, New York, Boston, San Francisco and Toronto
// (the box of one metro of the USA, METROS below; the places of the box outside the metro closed: closedAt),
// the names as they are (English).
// Belgium and Luxembourg (20. 11. 2026): their places in their own languages too (Bruxelles / Brussel, Liège).
const NATIVE = new Set(["CH", "LI", "BE", "LU", "PL", "PT", "MC", "CY", "MT", "IT", "SI", "FI", "DK", "LT", "US", "CA"]);
// A state of metros (the USA, 26. 11. 2026): the query is asked in the box of one metro, not of the state. The USA's box from
// Washington to Boston held Philadelphia and Baltimore, whose results took the limit of 20 before the closed places were
// dropped (the hostile review: little or nothing found), and San Francisco only with the map's centre in it. Photon is fair
// use, one query a pause in typing (search.js), so not one query a metro; nor one without a box and a higher limit: the
// whole USA would answer a "Main Street" with places almost all outside the metros. So one query with the box of the metro
// the query names (its city or a borough), else of the one the map's centre is in, else of the nearest to it; the box's
// places outside the metro are dropped by closedAt (New Jersey in New York's). Boxes from the metros' rings
// (states-america.json, tools/build_states.mjs METROS).
export const METROS = {
  US: {
    dc: { box: [-77.54, 38.54, -76.67, 39.35], names: ["washington", "d\\.? ?c\\.?", "arlington", "alexandria", "bethesda", "silver spring"] },
    nyc: { box: [-74.26, 40.48, -73.7, 40.92], names: ["new york", "nyc", "manhattan", "brooklyn", "queens", "bronx", "staten island"] },
    sf: { box: [-122.62, 37.64, -122.28, 37.93], names: ["san francisco", "sf"] },
    boston: { box: [-71.9, 41.99, -70.65, 42.74], names: ["boston", "cambridge", "somerville", "brookline", "quincy", "newton"] },
  },
};
// Where the query names the metro: its last place name that is not a street's (Washington Street in Boston, Boston Post
// Road in the Bronx), -1 where none.
const STREET_WORD = "street|st|avenue|ave|road|rd|boulevard|blvd|place|pl|square|sq|drive|dr|lane|ln|way|parkway|pkwy|terrace|ter|court|ct|circle|cir|post|heights|park|highway|hwy|turnpike|pike|bridge";
const namedAt = (m, q) => Math.max(-1, ...[...q.matchAll(new RegExp(`\\b(${m.names.join("|")})\\b(?!\\.?\\s+(${STREET_WORD})\\b)`, "gi"))].map((x) => x.index));
const inBox = (b, near) => !!near && near[1] >= b[0] && near[1] <= b[2] && near[0] >= b[1] && near[0] <= b[3];
const toBox = (b, near) => Math.hypot(Math.max(b[0] - near[1], 0, near[1] - b[2]) * Math.cos((near[0] * Math.PI) / 180), Math.max(b[1] - near[0], 0, near[0] - b[3]));
export function metroBox(country, near = null, q = "") {
  const list = Object.values(METROS[country] || {});
  if (!list.length) return BOX[country];
  const named = list.map((m) => [namedAt(m, q), m]).filter(([i]) => i >= 0).sort((a, b) => b[0] - a[0])[0]?.[1];
  return (named || list.find((m) => inBox(m.box, near))
    || (near ? list.reduce((a, m) => (toBox(m.box, near) < toBox(a.box, near) ? m : a)) : list[0])).box;
}
const boxOf = (countries, near = null, q = "") => {
  const b = countries.map((c) => metroBox(c, near, q));
  return [Math.min(...b.map((x) => x[0])), Math.min(...b.map((x) => x[1])), Math.max(...b.map((x) => x[2])), Math.max(...b.map((x) => x[3]))];
};
// A query that is likely German or Austrian (asked of Photon where the map shows neither and nothing else was found).
export const looksGerman = (text) => /ß|stra(ss|ß)e\b|str\.|platz\b|allee\b|gasse\b|\bberlin|münchen|hamburg|köln|frankfurt|leipzig|dresden|stuttgart|düsseldorf|nürnberg|hannover|bremen|zürich|basel|bern\b|luzern|winterthur|st\. ?gallen|vaduz/i.test(text);

const TOWN = new Set(["city", "town", "village", "hamlet", "suburb", "municipality"]);
// closed: is a point where the app makes no profile (city.js closedAt: Oakville, Oshawa, Italy beyond its orthophotos).
export function parsePhoton(json, countries = ["AT"], closed = null) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    if (!countries.includes(p.countrycode) || !c || closed?.(c[1], c[0])) continue;
    const town = [p.postcode, p.city || p.town || p.village || p.district].filter(Boolean).join(" ");
    if (p.housenumber && p.street) out.push({ text: `${p.street} ${p.housenumber}, ${town}`, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street: p.street } });
    else if (p.osm_key === "highway" && p.name) out.push({ text: `${p.name}, ${town}`, type: "Ulice", at: { lon: c[0], lat: c[1], street: p.name } });
    else if (p.osm_key === "place" && TOWN.has(p.osm_value) && p.name) out.push({ text: p.state ? `${p.name} (${p.state})` : p.name, type: "Obec", at: { lon: c[0], lat: c[1] } });
  }
  // One item a text (Photon gives a street once for each of its pieces).
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}

// near: [lat, lon] of the map's centre, so a common street name (Hauptstraße) comes from around it first (the review).
export async function findPhoton(text, getJSON, signal, countries = ["AT"], near = null, closed = closedAt) {
  const q = String(text || "").trim();
  if (q.length < 3 || !countries.length) return [];
  return parsePhoton(await getJSON(`${PHOTON}?${new URLSearchParams({ q, limit: "20", lang: countries.every((c) => NATIVE.has(c)) ? "default" : "de", bbox: boxOf(countries, near, q).join(","), ...(near && { lat: near[0].toFixed(4), lon: near[1].toFixed(4) }) })}`, signal), countries, closed);
}
