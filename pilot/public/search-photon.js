// Address search in Austria outside Vienna's own data (Bára 16. 11. 2026): Photon of komoot (photon.komoot.io, built
// on OpenStreetMap, CORS, fair use: search.js asks with its debounce and cancelling, at most one query a pause in
// typing). Only Austrian results (countrycode AT). The items look like RÚIAN's (text, type Ulice / AdresniMisto /
// Obec) so search.js ranks them together; at carries the point and the street for the cut.
export const PHOTON = "https://photon.komoot.io/api/";
const MAX = 15;
// Austria's box (the results are filtered by their country code as well).
const AT_BOX = [9.53, 46.37, 17.16, 49.02];

const TOWN = new Set(["city", "town", "village", "hamlet", "suburb", "municipality"]);
export function parsePhoton(json) {
  const out = [];
  for (const f of json?.features || []) {
    const p = f.properties || {}, c = f.geometry?.coordinates;
    if (p.countrycode !== "AT" || !c) continue;
    const town = [p.postcode, p.city || p.town || p.village || p.district].filter(Boolean).join(" ");
    if (p.housenumber && p.street) out.push({ text: `${p.street} ${p.housenumber}, ${town}`, type: "AdresniMisto", at: { lon: c[0], lat: c[1], street: p.street } });
    else if (p.osm_key === "highway" && p.name) out.push({ text: `${p.name}, ${town}`, type: "Ulice", at: { lon: c[0], lat: c[1], street: p.name } });
    else if (p.osm_key === "place" && TOWN.has(p.osm_value) && p.name) out.push({ text: p.state ? `${p.name} (${p.state})` : p.name, type: "Obec", at: { lon: c[0], lat: c[1] } });
  }
  // One item a text (Photon gives a street once for each of its pieces).
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}

export async function findPhoton(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parsePhoton(await getJSON(`${PHOTON}?${new URLSearchParams({ q, limit: "20", lang: "de", bbox: AT_BOX.join(",") })}`, signal));
}
