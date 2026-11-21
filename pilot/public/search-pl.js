// Address search in Poland (Bára 21. 11. 2026): GUGiK's UUG (services.gugik.gov.pl/uug, CORS *, the national register
// of addresses PRG), one request a pause in typing (search.js debounces and cancels). It wants "town, street number";
// a query without a town finds nothing. The items look like RÚIAN's (text, type AdresniMisto / Ulice) so search.js ranks
// them together; at carries the point (srid 4326) and the street for the cut.
export const UUG = "https://services.gugik.gov.pl/uug/";
const MAX = 15;
// A query that is likely Polish (asked where the map shows another state and nothing else was found).
export const looksPolish = (text) => /[ąćęłńśźż]|\bul\.|\bulica\b|\baleja\b|\bal\.|\b(warszawa|kraków|krakow|wrocław|wroclaw|gdańsk|gdansk|poznań|poznan|łódź|lodz|katowice|lublin|szczecin|bydgoszcz)\b/i.test(text);
// "Kraków, Floriańska 3" or "Floriańska 3 Kraków": the town first, as UUG wants it.
const townFirst = (q) => (/,/.test(q) ? q : q.replace(/^(.*?\d+\w*)\s+([^\d]+)$/u, "$2, $1"));
export function parsePl(json) {
  const out = [];
  for (const r of Object.values(json?.results || {})) {
    const lon = parseFloat(r.x), lat = parseFloat(r.y);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const street = String(r.street || "").replace(/^(ulica|aleja|plac|osiedle)\s+/i, "");
    out.push({ text: [street && `${street}${r.number ? ` ${r.number}` : ""}`, [r.code, r.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      type: r.number ? "AdresniMisto" : "Ulice", at: { lon, lat, ...(street && { street }) } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findPl(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parsePl(await getJSON(`${UUG}?${new URLSearchParams({ request: "GetAddress", address: townFirst(q), srid: "4326" })}`, signal));
}
