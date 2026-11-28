// Address search in the Netherlands (Bára 20. 11. 2026): PDOK's Locatieserver (api.pdok.nl, CORS *, the BAG's addresses
// and the national register of public spaces, Public Domain Mark), one request a pause in typing (search.js debounces
// and cancels). The items look like RÚIAN's (text, type Ulice / AdresniMisto / Obec) so rank.js ranks them together;
// at carries the point and the street for the cut.
export const LOCATIESERVER = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
const MAX = 15;
// A query that is likely Dutch (asked where the map shows another state and nothing else was found).
export const looksDutch = (text) => /gracht|straat\b|steeg\b|laan\b|plein\b|kade\b|singel\b|dijk\b|\b(amsterdam|rotterdam|utrecht|den haag|'s-gravenhage|eindhoven|groningen|tilburg|almere|breda|nijmegen|haarlem|arnhem|leiden|delft|maastricht|zwolle)\b/i.test(text);

const KIND = { adres: "AdresniMisto", weg: "Ulice", woonplaats: "Obec" };
const point = (wkt) => {
  const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt || "");
  return m ? { lon: +m[1], lat: +m[2] } : null;
};
export function parseNl(json) {
  const out = [];
  for (const d of json?.response?.docs || []) {
    const type = KIND[d.type], at = point(d.centroide_ll);
    if (!type || !at || !d.weergavenaam) continue;
    out.push({ text: d.weergavenaam, type, at: type === "Obec" ? at : { ...at, street: d.straatnaam } });
  }
  const seen = new Set();
  return out.filter((it) => !seen.has(it.text) && seen.add(it.text)).slice(0, MAX);
}

export async function findNl(text, getJSON, signal) {
  const q = String(text || "").trim();
  if (q.length < 3) return [];
  return parseNl(await getJSON(`${LOCATIESERVER}?${new URLSearchParams({ q, rows: "20", fq: "type:(adres OR weg OR woonplaats)", fl: "weergavenaam,type,centroide_ll,straatnaam" })}`, signal));
}

// Where the map shows the Netherlands, or a Dutch-looking query that RÚIAN and ZBGIS did not answer. What it finds is not
// asked of Photon again (the hostile review: a Dutch street in "…weg" went to both).
export const pdokService = {
  id: "pdok",
  label: "PDOK",
  merge: 12,
  looksLike: (query, ctx) => ctx.listed("pdok") || (!ctx.found("ruian", "zbgis") && looksDutch(query)),
  find: (query, ctx) => findNl(query.trim(), ctx.getJSON, ctx.signal),
};
