// Address search in Poland (Bára 21. 11. 2026): GUGiK's UUG (services.gugik.gov.pl/uug, CORS *, the national register
// of addresses PRG), one request a pause in typing (search.js debounces and cancels). It wants "town, street number";
// a query without a town finds nothing. The items look like RÚIAN's (text, type AdresniMisto / Ulice) so rank.js ranks
// them together; at carries the point (srid 4326) and the street for the cut.
import { photonFallback } from "./photon.js";

export const UUG ="https://services.gugik.gov.pl/uug/";
const MAX = 15;
// A query that is likely Polish (asked where the map shows another state and nothing else was found).
export const looksPolish = (text) => /[ąćęłńśźż]|\bul\.|\bulica\b|\baleja\b|\bal\.|\b(warszawa|kraków|krakow|wrocław|wroclaw|gdańsk|gdansk|poznań|poznan|łódź|lodz|katowice|lublin|szczecin|bydgoszcz)\b/i.test(text);
// The forms of a query UUG may understand, the town first ("Kraków, Floriańska 3"): as typed, the parts around a comma
// swapped when the number is in the first ("Floriańska 3, Kraków"), the town after the number moved before it
// ("Floriańska 3 Kraków"), the first word as the town ("Kraków Floriańska 3"; the hostile review).
export function queryForms(q) {
  const out = [q];
  const m = /^([^,]*\d[^,]*),\s*([^\d,]+)$/u.exec(q);
  if (m) out.push(`${m[2].trim()}, ${m[1].trim()}`);
  const n = /^(.*?\d+\w*)\s+([^\d,]+)$/u.exec(q);
  if (n && !q.includes(",")) out.push(`${n[2].trim()}, ${n[1].trim()}`);
  const f = /^([^\d,\s]+)\s+(.*\d.*)$/u.exec(q);
  if (f && !n && !q.includes(",")) out.push(`${f[1]}, ${f[2]}`);
  return [...new Set(out)];
}
export function parsePl(json) {
  const out = [];
  for (const r of Object.values(json?.results || {})) {
    const lon = parseFloat(r.x), lat = parseFloat(r.y);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const street = String(r.street || "").replace(/^(ulica|aleja|plac|osiedle)\s+/i, "");
    out.push({ text: [street && `${street}${r.number ? ` ${r.number}` : ""}`, [r.code, r.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      // A town alone is a place, not a cut (the hostile review).
      type: r.number ? "AdresniMisto" : street ? "Ulice" : "Obec", at: { lon, lat, ...(street && { street }) } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findPl(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  // The forms one after another until one finds something (at most three requests a pause in typing).
  for (const form of queryForms(q).slice(0, 3)) {
    const found = parsePl(await getJSON(`${UUG}?${new URLSearchParams({ request: "GetAddress", address: form, srid: "4326" })}`, signal));
    if (found.length) return found;
  }
  return [];
}

// Where the map shows Poland, or a Polish-looking query RÚIAN, ZBGIS and PDOK did not answer.
export const uugService = {
  id: "uug",
  label: "UUG",
  merge: 10,
  looksLike: (query, ctx) => ctx.listed("uug") || (!ctx.found("ruian", "zbgis", "pdok") && looksPolish(query)),
  find: (query, ctx) => findPl(query.trim(), ctx.getJSON, ctx.signal),
};
// Where UUG found nothing for a Polish query (no diacritics, an unusual order), Photon of komoot in Poland.
export const uugPhotonService = photonFallback({
  id: "uug-photon",
  merge: 11,
  countries: ["PL"],
  looksLike: (query, ctx) => !ctx.found("uug") && (ctx.listed("uug") || looksPolish(query)) && !ctx.found("photon"),
});
