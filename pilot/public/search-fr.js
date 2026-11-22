// Address search in France (Bára 22. 11. 2026): the Géoplateforme's geocoder of IGN (data.geopf.fr/geocodage, CORS *,
// the national address base BAN, Licence Ouverte 2.0), one request a pause in typing (search.js debounces and cancels),
// near the map's centre. The items look like RÚIAN's (text, type AdresniMisto / Ulice / Obec) so search.js ranks them
// together; at carries the point and the street for the cut.
export const GEOCODER = "https://data.geopf.fr/geocodage/search";
const MAX = 15;
// A query that is likely French (asked where the map shows another state and nothing else was found).
export const looksFrench = (text) => /\b(rue|avenue|boulevard|bd|chemin|allée|allee|impasse|quai|place|cours|route) (de |du |des |d'|de la )?|[àâçéèêëîïôûùœ]|\b(paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier|bordeaux|lille|rennes|reims|grenoble|dijon)\b/i.test(text);

const KIND = { housenumber: "AdresniMisto", street: "Ulice", locality: "Ulice", municipality: "Obec" };
export function parseFr(json) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, type = KIND[p.type], [lon, lat] = f.geometry?.coordinates || [];
    if (!type || !Number.isFinite(lon) || !Number.isFinite(lat) || !p.label) continue;
    out.push({ text: p.label, type, at: type === "Obec" ? { lon, lat } : { lon, lat, ...(p.street && { street: p.street }) } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findFr(text, getJSON, signal, near) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parseFr(await getJSON(`${GEOCODER}?${new URLSearchParams({ q, autocomplete: "1", limit: "15", index: "address", ...(near && { lat: String(near[0]), lon: String(near[1]) }) })}`, signal));
}
