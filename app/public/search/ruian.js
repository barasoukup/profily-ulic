// Address search in Czechia: the RÚIAN search service of ČÚZK ("Vyhledávací služba nad daty RÚIAN", GeocodeSOE: suggest
// while typing, then the chosen place from the service's own layers). No key, CORS for any origin, open data under CC BY 4.0.
// Considerate to ČÚZK: nothing under 3 characters (search.js), a stale request is cancelled, recent answers are kept in
// memory. RÚIAN first only where the map shows Czechia (Bára 26. 11. 2026: ČÚZK only for Czechia); elsewhere it is asked
// last, when the place's services found nothing (a Czech address typed in Paris), its failure no error.
import { qs } from "./http.js";
import { nearestOnPaths, streetMiddle } from "./geometry.js";

const RUIAN_SEARCH = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Vyhledavaci_sluzba_nad_daty_RUIAN/MapServer";
const GEOCODE = `${RUIAN_SEARCH}/exts/GeocodeSOE`;
const ASK = 15; // more than shown: duplicates of a town (ORP, POU) are dropped and the rest re-ranked
// The same town again as the seat of an office: dropped.
const DUPLICATES = new Set(["ObecSPoverenymObecnimUradem", "ObecSRozsirenouPusobnosti"]);

export function parseSuggestions(json) {
  const seen = new Set();
  const out = [];
  for (const s of json?.suggestions || []) {
    const m = /^(\d+)_(\d+)$/.exec(s.magicKey || "");
    if (!m || !s.text || DUPLICATES.has(s.type)) continue;
    const id = `${s.type}|${s.text}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ text: s.text, key: s.magicKey, type: s.type, layer: +m[1], oid: +m[2] });
  }
  return out;
}

export const suggestUrl = (text) => `${GEOCODE}/suggest?${qs({ text, maxSuggestions: ASK })}`;
const layerQuery = (layer, params) => `${RUIAN_SEARCH}/${layer}/query?${qs({ outSR: 4326, ...params })}`;
const streetGeometry = (params) => layerQuery(4, { ...params, outFields: "kod", returnGeometry: true, maxAllowableOffset: 0.000005, geometryPrecision: 7 });

// Where a chosen item goes: { lat, lon, cut } — cut is the point on the street to cut at (an address on
// a street, a street), or null (a town, a district, an address without a street).
async function locate(item, { getJSON, signal }) {
  if (item.type === "AdresniMisto") {
    const a = (await getJSON(layerQuery(1, { objectIds: item.oid, outFields: "ulice" }), signal)).features?.[0];
    if (!a?.geometry) throw new Error("adresa bez polohy");
    const p = [a.geometry.x, a.geometry.y];
    let cut = null;
    if (a.attributes?.ulice) {
      const s = (await getJSON(streetGeometry({ where: `kod=${+a.attributes.ulice}` }), signal).catch(() => null))?.features?.[0];
      cut = s?.geometry?.paths ? nearestOnPaths(s.geometry.paths, p) : null;
    }
    return { lon: p[0], lat: p[1], cut: cut && { lon: cut[0], lat: cut[1] } };
  }
  if (item.type === "Ulice") {
    const s = (await getJSON(streetGeometry({ objectIds: item.oid }), signal)).features?.[0];
    const m = streetMiddle(s?.geometry?.paths);
    if (!m) throw new Error("ulice bez polohy");
    return { lon: m[0], lat: m[1], cut: { lon: m[0], lat: m[1] } };
  }
  const json = await getJSON(`${GEOCODE}/findAddressCandidates?${qs({ SingleLine: item.text, magicKey: item.key, outSR: 4326, maxLocations: 1 })}`, signal);
  const loc = json.candidates?.[0]?.location;
  if (!loc) throw new Error("bez polohy");
  return { lon: loc.x, lat: loc.y, cut: null };
}

// An error of RÚIAN is the search's error only where it is the one service asked (Czechia, a Czech-looking query).
const isOnlyService = (ctx) => ctx.inCzechia && !ctx.asked("zbgis");

export const ruianService = {
  id: "ruian",
  merge: 15,
  looksLike: (_query, ctx) => ctx.inCzechia,
  find: (query, ctx) => ctx.getJSON(suggestUrl(query.trim()), ctx.signal).then(parseSuggestions),
  recover: (err, _query, ctx) => { if (isOnlyService(ctx)) throw err; return []; },
  // Outside Czechia, when nothing else found anything (the Slovak service goes first).
  lastResort: { order: 2, when: (_query, ctx) => !ctx.inCzechia && !ctx.foundAny() },
  locate,
};
