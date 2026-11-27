// Address search in Finland (Bára 23. 11. 2026): Photon of komoot in Finnish and Swedish for free text (search-photon.js
// "photon-fi"), and for a query with a house number the national addresses of Ryhti (SYKE, OGC API Features
// open_address, CORS *, CC BY 4.0; evaluation/finland/SOURCES.md 4): the Finnish or Swedish name of the street with the
// number (a CQL filter on the fields, no full text), the town by its post office. One request a pause in typing (search.js
// debounces and cancels), a second only when the first finds nothing.
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
// The fast query (the hostile review of 24. 11. 2026, bod 12: ILIKE over the whole table took 2.6–6.2 s): the street's
// name as typed, with a capital, and in title case, by equality on address_name_fin/swe, the number part
// (number_part_of_address_number) and the letter as fields, the town by its post office in capitals; about 1 s, 0.2 s
// without a town. Only when it finds nothing the old ILIKE (another case of the name: "kolmas Linja").
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titled = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
export function ryhtiAddressUrl(q) {
  const st = q.street.replace(/\s+/g, " ");
  const names = [...new Set([st, cap(st), cap(st.toLowerCase()), titled(st)])].map((n) => `'${lit(n)}'`).join(",");
  const street = `(address_name_fin IN (${names}) OR address_name_swe IN (${names})) AND number_part_of_address_number = ${q.number}`;
  const letter = q.extra ? ` AND subdivision_letter_of_address_number = '${lit(q.extra)}'` : "";
  const town = q.town ? ` AND (postal_office_fin = '${lit(q.town.toUpperCase())}' OR postal_office_swe = '${lit(q.town.toUpperCase())}')` : "";
  return `${RYHTI_ADDRESS}?${new URLSearchParams({ f: "json", "filter-lang": "cql-text", filter: street + letter + town, limit: String(MAX) })}`;
}
export function ryhtiAddressLikeUrl(q) {
  const a = `${lit(q.street)} ${q.number}${q.extra ? ` ${lit(q.extra)}` : ""}`;
  const street = `(address_fin ILIKE '${a}' OR address_swe ILIKE '${a}'${q.extra ? ` OR address_fin ILIKE '${lit(q.street)} ${q.number}${lit(q.extra)}' OR address_swe ILIKE '${lit(q.street)} ${q.number}${lit(q.extra)}'` : ""})`;
  const town = q.town ? ` AND (postal_office_fin ILIKE '${lit(q.town)}%' OR postal_office_swe ILIKE '${lit(q.town)}%')` : "";
  return `${RYHTI_ADDRESS}?${new URLSearchParams({ f: "json", "filter-lang": "cql-text", filter: street + town, limit: String(MAX) })}`;
}
const title = (s) => String(s || "").toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// The items look like RÚIAN's (text, type AdresniMisto); one per address and post office. A place with only a Swedish
// address (Åland, the Swedish-speaking coast) keeps it (the review, bod 12).
export function parseFi(json) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    const addr = p.address_fin || p.address_swe;
    if (!c || !addr) continue;
    const office = p.address_fin ? p.postal_office_fin || p.postal_office_swe : p.postal_office_swe || p.postal_office_fin;
    const street = (p.address_fin ? p.address_name_fin : p.address_name_swe) || addr.replace(/\s+\d.*$/, "");
    out.push({ text: `${addr}, ${title(office)}`, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findFi(text, getJSON, signal) {
  const q = parseFiQuery(text);
  if (!q) return [];
  const fast = parseFi(await getJSON(ryhtiAddressUrl(q), signal));
  return fast.length ? fast : parseFi(await getJSON(ryhtiAddressLikeUrl(q), signal));
}
