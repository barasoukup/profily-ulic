// What the Jihlava variants share: the layers of towns/jihlava.js (the module keeps them to itself), the
// national DTM of ČÚZK without RÚIAN, and the order of the layers (the first one at a point wins).
import { query, envelope, asMtvu, parkingStrip } from "../../pilot/public/gis.js";
import { MTVU_LABELS } from "../../pilot/public/city.js";
import { surfaces as dmvsSurfaces } from "../../pilot/public/dmvs.js";

const JI = "https://gis.jihlava-city.cz";
const PASPORT = `${JI}/server1/rest/services/ost/Pasporty/MapServer`;
const ROADS = `${PASPORT}/112/query`;
const LAWNS = `${PASPORT}/25/query`;
const BUILDINGS = `${JI}/server/rest/services/ost/ORP_RUIAN/MapServer/7/query`;
const PARCELS = `${JI}/server/rest/services/ost/Ji_parcely/MapServer/1/query`;
const PARKING = `${JI}/server1/rest/services/verejnost/doprava_verejnost/MapServer/105/query`;
const jiQuery = (url, params) => query(url, { ...params, datumTransformation: 1623 });
const none = () => ({ features: [] });

const LAND = [
  [/^(zahrada|ovocný sad|vinice|chmelnice)/, 300], [/^trvalý travní porost/, 401], [/^orná půda/, 100],
  [/^lesní pozemek/, 200], [/^vodní plocha/, 501], [/^zastavěná plocha/, 603],
  [/\((zeleň|neplodná půda)\)/, 401], [/\((ostatní komunikace|silnice)\)/, [401, true]],
  [/\(manipulační plocha\)/, 1003], [/\(sportoviště/, 901], [/\(dráha\)/, 1100],
];
const landCode = (name) => LAND.find(([re]) => re.test(name || ""))?.[1] ?? null;

// The passport with the fields that tell who keeps a section and whether its surface is recorded.
export const roads = (bbox) => jiQuery(ROADS, { ...envelope(bbox), outFields: "typ_useku,spravce,povrch" });
export const buildings = (bbox) => jiQuery(BUILDINGS, { ...envelope(bbox), outFields: "pocet_podl" }).catch(none);
export const lawns = (bbox) => jiQuery(LAWNS, { ...envelope(bbox), outFields: "druh_plocha" }).catch(none);
export const parcels = (bbox) => jiQuery(PARCELS, { ...envelope(bbox), outFields: "drupoz_naz" }).catch(none);
// The DTM's areas on the cut (no RÚIAN: the town's buildings and cadastre fill in).
export const dmvs = (bbox) => dmvsSurfaces(bbox, MTVU_LABELS, { ruian: false }).catch(() => ({ features: [] }));
export const ROADWAY = new Set([700, 701, 705]);
export const hasRoadway = (json) => (json.features || []).some((f) => !Number(f.attributes.LEVEL) && ROADWAY.has(Number(f.attributes.CTVUK_KOD)));
export const hasAny = (json) => (json.features || []).some((f) => !Number(f.attributes.LEVEL));

// A road kept by the state or the region (ŘSD, Krajská správa a údržba silnic) with no surface recorded:
// drawn by the city as a strip of the road's nominal width, not measured.
export const stateRoad = (a) => a.typ_useku === "vozovka" && !/SLUŽBY MĚSTA|SMJ|Statutární/i.test(a.spravce || "") && /ŘSD|Krajsk/i.test(a.spravce || "") && !(a.povrch || "").trim();

// The surfaces in the order of towns/jihlava.js: buildings, then `middle` (passport and/or DTM, as
// [json, code] layers), lawns, the cadastre (a road's parcel green only where a roadway is drawn).
export async function compose(bbox, middle, roadwayDrawn) {
  const [b, l, p] = await Promise.all([buildings(bbox), lawns(bbox), parcels(bbox)]);
  return asMtvu([
    [b, 601], ...middle, [l, 401],
    [p, (a) => { const c = landCode(a.drupoz_naz); return Array.isArray(c) && !roadwayDrawn ? null : c; }],
  ], MTVU_LABELS);
}
// The DTM's features as a layer of asMtvu (their codes, estimates and levels kept).
export const dtmLayer = (json) => [{ features: (json.features || []).filter((f) => !Number(f.attributes.LEVEL)) }, (a) => (a.ODHAD ? [a.CTVUK_KOD, true] : a.CTVUK_KOD)];
export const above = (json) => (json.features || []).filter((f) => Number(f.attributes.LEVEL));
export const passportLayer = (json, keep = () => true) => [json, (a) => (!keep(a) ? null : a.typ_useku === "vozovka" ? 701 : a.typ_useku === "chodník" ? 702 : null)];

// The city's parking strips on the side of a given roadway (as towns/jihlava.js, with another roadway).
const DEPTH = { podélné: 2.0, šikmé: 4.5, kolmé: 5.0 };
const SPECIAL = new Set(["K+R", "Taxi", "Vyhrazené"]);
export async function parkingBeside(bbox, roadway) {
  const park = await jiQuery(PARKING, { ...envelope(bbox), outFields: "druh_stani,rezim,pocet_mist", where: "stav_prvku = 'Stávající'" });
  const lat = Number(bbox.split(",")[1]);
  const features = [];
  for (const f of park.features || []) {
    const { druh_stani: kind, rezim, pocet_mist: count } = f.attributes || {};
    if (!rezim || /^Zákaz/.test(rezim)) continue;
    for (const ring of parkingStrip(f.geometry?.paths, DEPTH[kind] || 2.0, roadway, lat)) {
      features.push({ attributes: { KIND: SPECIAL.has(rezim) ? "specialni" : "useky", PS_ZPS: count || 0 }, geometry: { rings: [ring] } });
    }
  }
  return { features };
}
