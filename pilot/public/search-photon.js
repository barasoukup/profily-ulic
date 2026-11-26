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
const BOX = { AT: [9.53, 46.37, 17.16, 49.02], DE: [5.86, 47.27, 15.04, 55.06], CH: [5.95, 45.81, 10.5, 47.81], LI: [9.47, 47.04, 9.64, 47.28], BE: [2.5, 49.49, 6.41, 51.51], LU: [5.73, 49.44, 6.53, 50.19], PL: [14.1, 49.0, 24.2, 54.9], PT: [-31.3, 32.6, -6.18, 42.16], MC: [7.40, 43.72, 7.44, 43.76], CY: [32.2, 34.5, 34.65, 35.75], MT: [13.9, 35.5, 14.9, 36.35], IT: [6.6, 35.4, 18.6, 47.1], SI: [13.37, 45.42, 16.61, 46.88], FI: [19.08, 59.45, 31.59, 70.1], DK: [8.07, 54.55, 15.2, 57.76], LT: [20.93, 53.89, 26.84, 56.45], US: [-77.6, 38.5, -76.6, 39.4], CA: [-79.95, 43.45, -78.95, 44.05] };
// The USA and Canada (24. and 25. 11. 2026): only the metros of Washington, San Francisco and Toronto (their boxes), the names as they are (English).
// Belgium and Luxembourg (20. 11. 2026): their places in their own languages too (Bruxelles / Brussel, Liège).
const NATIVE = new Set(["CH", "LI", "BE", "LU", "PL", "PT", "MC", "CY", "MT", "IT", "SI", "FI", "DK", "LT", "US", "CA"]);
// A state's further metros (San Francisco, 26. 11. 2026): their box where the map's centre is in it, else the state's own.
const METRO_BOX = { US: [[-122.54, 37.68, -122.34, 37.84]] };
const inBox = (b, near) => !!near && near[1] >= b[0] && near[1] <= b[2] && near[0] >= b[1] && near[0] <= b[3];
const boxOf = (countries, near = null) => {
  const b = countries.map((c) => (METRO_BOX[c] || []).find((m) => inBox(m, near)) || BOX[c]);
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
  return parsePhoton(await getJSON(`${PHOTON}?${new URLSearchParams({ q, limit: "20", lang: countries.every((c) => NATIVE.has(c)) ? "default" : "de", bbox: boxOf(countries, near).join(","), ...(near && { lat: near[0].toFixed(4), lon: near[1].toFixed(4) }) })}`, signal), countries, closed);
}
