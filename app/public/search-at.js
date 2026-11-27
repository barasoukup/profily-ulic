// Address search in Vienna (Bára 16. 11. 2026, after the hostile review of Austria): the national search of the BEV
// needs a registration, Vienna's address points (ADRESSENOGD, data.wien.gv.at WFS, CORS, CC BY 4.0 "Stadt Wien –
// data.wien.gv.at") answer the browser with a CQL filter on the street's name. A query with a house number gives that
// address; without one, the streets whose name starts with the query (at the middle one of their addresses). Asked
// where Vienna is likely (search.js), with the same debounce and cancelling as RÚIAN. The items look like RÚIAN's
// (text, type Ulice / AdresniMisto) so search.js ranks them together; at carries the point.
import { splitQuery } from "./search-sk.js";
import { norm } from "./search.js";
import { inArea, AT_AREAS } from "./places.js";

export const WIEN_WFS = "https://data.wien.gv.at/daten/geo";
const MAX = 20;
const inWienBox = (lon, lat) => inArea(AT_AREAS.wien, lon, lat);

// A query for Vienna: it names the city.
export const looksViennese = (text) => /\bwien\b/i.test(text);

const cql = (s) => s.replace(/'/g, "''").replace(/[%_]/g, "");
const url = (filter, count) => `${WIEN_WFS}?${new URLSearchParams({
  service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ogdwien:ADRESSENOGD", outputFormat: "application/json",
  srsName: "EPSG:4326", count: String(count), propertyName: "NAME_STR,NAME,PLZ,ONR_VON,SHAPE", CQL_FILTER: filter,
})}`;

// The street words of a query without "Wien" (and a district number such as "1070").
export function viennaQuery(text) {
  const { name, number } = splitQuery(String(text || "").replace(/\bwien\b/gi, " ").replace(/\b1\d{3}\b/g, " "));
  return { name: name.trim(), number };
}

export function parseAddresses(json) {
  return (json?.features || []).filter((f) => f.geometry?.type === "Point").map((f) => {
    const p = f.properties || {};
    return { text: `${p.NAME}, ${p.PLZ} Wien`, type: "AdresniMisto", at: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], street: p.NAME_STR } };
  });
}
// The streets of the address points: one item a street, at its middle address (by the order of the house numbers).
export function parseStreets(json) {
  const by = new Map();
  for (const f of json?.features || []) {
    const p = f.properties || {};
    if (!p.NAME_STR || f.geometry?.type !== "Point") continue;
    if (!by.has(p.NAME_STR)) by.set(p.NAME_STR, []);
    by.get(p.NAME_STR).push({ n: parseInt(p.ONR_VON, 10) || 0, plz: p.PLZ, c: f.geometry.coordinates });
  }
  return [...by].map(([street, list]) => {
    list.sort((a, b) => a.n - b.n);
    const mid = list[list.length >> 1];
    return { text: `${street}, ${mid.plz} Wien`, type: "Ulice", at: { lon: mid.c[0], lat: mid.c[1], street } };
  });
}

export async function findAt(text, getJSON, signal) {
  const { name, number } = viennaQuery(text);
  if (norm(name).length < 3) return [];
  const street = `NAME_STR ILIKE '${cql(name)}%'`;
  if (number) return parseAddresses(await getJSON(url(`${street} AND NAME_ONR ILIKE '${cql(number)}%'`, 10), signal)).slice(0, MAX);
  return parseStreets(await getJSON(url(street, 400), signal)).slice(0, MAX);
}

// The axis of the street by the point (Vienna's street graph STRASSENGRAPHOGD, 200 m around): an address on a corner
// is cut on its own street, not the side street nearer to it (Praterstraße 20).
export async function locateAt(item, getJSON, signal) {
  const { lon, lat, street } = item.at, d = 200 / 111320, dLon = d / Math.cos((lat * Math.PI) / 180);
  if (!street || !inWienBox(lon, lat)) return { point: [lon, lat], paths: null };
  const json = await getJSON(`${WIEN_WFS}?${new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ogdwien:STRASSENGRAPHOGD", outputFormat: "application/json",
    srsName: "EPSG:4326", count: "200", propertyName: "FEATURENAME,SHAPE",
    CQL_FILTER: `FEATURENAME = '${cql(street)}' AND BBOX(SHAPE, ${lon - dLon}, ${lat - d}, ${lon + dLon}, ${lat + d}, 'EPSG:4326')`,
  })}`, signal).catch(() => null);
  const paths = (json?.features || []).flatMap((f) => f.geometry?.type === "LineString" ? [f.geometry.coordinates] : f.geometry?.type === "MultiLineString" ? f.geometry.coordinates : []);
  return { point: [lon, lat], paths: paths.length ? paths : null };
}
