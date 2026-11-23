// Address search in Finland (Bára 23. 11. 2026): Photon of komoot in Finnish and Swedish for free text (search-photon.js
// "photon-fi"), and for a query with a house number the national addresses of Ryhti (SYKE, OGC API Features
// open_address, CORS *, CC BY 4.0; evaluation/finland/ZDROJE.md 4): the Finnish or Swedish name of the street with the
// number (a CQL filter, no full text), the town by its post office. One request a pause in typing (search.js debounces
// and cancels).
export const RYHTI_ADDRESS = "https://paikkatiedot.ymparisto.fi/geoserver/ryhti_building/ogc/features/v1/collections/open_address/items";
const MAX = 15;
// A query that is likely Finnish or Finland-Swedish (asked where the map shows another state and nothing else was found).
export const looksFinnish = (text) => /(katu|tie|kuja|polku|väylä|tori|puistikko|ranta|gatan|vägen|gränd)\b|\b(helsinki|helsingfors|espoo|esbo|tampere|tammerfors|vantaa|oulu|uleåborg|turku|åbo|jyväskylä|lahti|kuopio|pori|joensuu|lappeenranta|vaasa|rovaniemi|mariehamn|maarianhamina)\b/i.test(text);
// "Bulevardi 5 a, Helsinki" → { street, number, extra, town } (null without a house number).
export function parseFiQuery(text) {
  const m = /^\s*(.+?)\s+(\d{1,4})\s?([a-zA-ZåäöÅÄÖ](?!\p{L}))?\s*(?:,\s*|\s+)?([^\d,][^,]*)?\s*$/u.exec(String(text || ""));
  if (!m || m[1].replace(/[^\p{L}]/gu, "").length < 3) return null;
  return { street: m[1].trim(), number: Number(m[2]), extra: m[3]?.toLowerCase() || null, town: m[4]?.trim() || null };
}
const lit = (s) => String(s).replace(/'/g, "''").replace(/[%_\\]/g, "");
export function ryhtiAddressUrl(q) {
  const a = `${lit(q.street)} ${q.number}${q.extra ? ` ${lit(q.extra)}` : ""}`;
  const street = `(address_fin ILIKE '${a}' OR address_swe ILIKE '${a}'${q.extra ? ` OR address_fin ILIKE '${lit(q.street)} ${q.number}${lit(q.extra)}' OR address_swe ILIKE '${lit(q.street)} ${q.number}${lit(q.extra)}'` : ""})`;
  const town = q.town ? ` AND (postal_office_fin ILIKE '${lit(q.town)}%' OR postal_office_swe ILIKE '${lit(q.town)}%')` : "";
  return `${RYHTI_ADDRESS}?${new URLSearchParams({ f: "json", "filter-lang": "cql-text", filter: street + town, limit: String(MAX) })}`;
}
const title = (s) => String(s || "").toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// The items look like RÚIAN's (text, type AdresniMisto); one per address and post office.
export function parseFi(json) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    if (!c || !p.address_fin) continue;
    out.push({ text: `${p.address_fin}, ${title(p.postal_office_fin)}`, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street: p.address_name_fin || p.address_fin.replace(/\s+\d.*$/, "") } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findFi(text, getJSON, signal) {
  const q = parseFiQuery(text);
  return q ? parseFi(await getJSON(ryhtiAddressUrl(q), signal)) : [];
}
