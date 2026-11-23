// Address search in Spain (Bára 23. 11. 2026): CartoCiudad's geocoder of IGN/CNIG (www.cartociudad.es, CORS *, CC BY 4.0
// scne.es), one request a pause in typing (search.js debounces and cancels). Its candidates of a portal carry the point;
// a street, a town or a municipality comes with 0, 0 and its geometry only from find (asked for the first few). The
// items look like RÚIAN's (text, type AdresniMisto / Ulice / Obec) so search.js ranks them together; at carries the
// point and the street for the cut. CartoCiudad writes Catalan, Galician and Basque names in their Castilian form.
export const CARTOCIUDAD = "https://www.cartociudad.es/geocoder/api/geocoder";
const MAX = 15, FIND = 3;
// A query that is likely Spanish (asked where the map shows another state and nothing else was found). Palma only with
// "de Mallorca" ("palma" alone is a Czech word too; the review of 23. 11. 2026).
export const looksSpanish = (text) => /\b(calle|c\/|avenida|avda|paseo|plaza|pza|carrer|avinguda|passeig|plaça|rúa|ronda|glorieta|camino|carretera|travesía|kalea|etorbidea)\b|[ñ]|\b(madrid|barcelona|valencia|sevilla|zaragoza|málaga|malaga|bilbao|murcia|palma de mallorca|alicante|córdoba|cordoba|valladolid|vigo|gijón|gijon|coruña|coruna|granada|vitoria)\b/i.test(text);

const KIND = { portal: "AdresniMisto", callejero: "Ulice", carretera: "Ulice", poblacion: "Obec", Municipio: "Obec" };
// A WKT POINT or MULTILINESTRING / LINESTRING: a point of it (a line's middle vertex).
export function wktPoint(wkt) {
  const nums = [...String(wkt || "").matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((m) => [+m[1], +m[2]]);
  if (!nums.length) return null;
  const first = String(wkt).match(/\(\(?([^()]*)\)/);
  const line = first ? [...first[1].matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((m) => [+m[1], +m[2]]) : nums;
  const [lon, lat] = line[Math.floor(line.length / 2)];
  return { lon, lat };
}
const label = (c) => (c.type === "portal" && c.portalNumber != null ? `${String(c.address || "").replace(new RegExp(`\\s*${c.portalNumber}\\b.*$`), "")} ${c.portalNumber}, ${c.muni || ""}` : c.address || "").replace(/\s+,/g, ",").trim();
export function parseEs(list) {
  const out = [];
  for (const c of Array.isArray(list) ? list : []) {
    const type = KIND[c.type];
    if (!type || !c.address) continue;
    const pt = c.lat || c.lng ? { lon: c.lng, lat: c.lat } : null;
    out.push({ text: label(c), type, ...(pt && { at: type === "Ulice" ? { ...pt, street: c.address.split(",")[0] } : pt }), ...(!pt && { find: { id: c.id, type: c.type } }) });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}
export async function findEs(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  const items = parseEs(await getJSON(`${CARTOCIUDAD}/candidates?${new URLSearchParams({ q, limit: String(MAX) })}`, signal));
  // The first few without a point get it from find; the others are left out (no place to go).
  let asked = 0;
  await Promise.all(items.map(async (it) => {
    if (it.at || asked >= FIND) return;
    asked++;
    const f = await getJSON(`${CARTOCIUDAD}/find?${new URLSearchParams(it.find)}`, signal).catch((err) => { if (err.name === "AbortError") throw err; return null; });
    const pt = wktPoint(f?.geom);
    if (pt) it.at = it.type === "Ulice" ? { ...pt, street: String(f.address || it.text).split(",")[0] } : pt;
  }));
  return items.filter((it) => it.at).map(({ find, ...it }) => it);
}
