// The buildings of the four foral cadastres (Bára 23. 11. 2026), where the national Catastro has none: Navarre (IDENA,
// Registro de la Riqueza Territorial) and the three Basque provinces Álava, Bizkaia and Gipuzkoa, each a public INSPIRE
// WFS of buildings (BU) with floors above ground, year, use and dwellings, CORS for the app's site
// (evaluation/spain/FORAL-CADASTRES.md). Asked as the Catastro is (towns/spain.js podlaznost): only on a click, the
// building at the facade's point (a window of about half a metre), one request a facade, a time limit, the answer kept
// by the rounded point. None has building parts: the building's own floors.
// Each service is a little different: the feature type, how the bbox names its CRS (Bizkaia refuses the URI form),
// the axis order (Álava: lon lat in the bbox and in the GML, the others lat lon), the members (wfs:member), elements
// with XML attributes (Gipuzkoa: xsi:nil="false"), the year in "beginning", in "end" or as plain text, the use as an
// INSPIRE code in xlink:href, xlink:title (Bizkaia, with trailing spaces) or as text (Álava).

import { inside } from "../places.js";
const URI4258 = "http://www.opengis.net/def/crs/EPSG/0/4258";
// The province codes as in regions-es.json (tools/build_boundaries.mjs, NUTS 3).
export const FORAL = {
  nc: { url: "https://inspire.navarra.es/services/BU/wfs", type: "BU:Building", srs: URI4258, bboxCrs: URI4258, lonLat: false },
  gi: { url: "https://b5m.gipuzkoa.eus/inspire/wfs/gipuzkoa_wfs_bu", type: "bu-ext2d:Building", srs: URI4258, bboxCrs: URI4258, lonLat: false },
  bi: { url: "https://geo.bizkaia.eus/arcgisserverinspire/rest/services/Catastro/Buildings/MapServer/exts/InspireFeatureDownload/service", type: "bu-core2d:Building", srs: null, bboxCrs: "EPSG:4258", lonLat: false },
  ar: { url: "https://geo.araba.eus/WFS_INSPIRE_BU", type: "INSPIRE_BU:BU.Building", srs: "EPSG:4326", bboxCrs: "EPSG:4326", lonLat: true },
};
// Which cadastres are asked without a switch: the A/B of 23. 11. 2026 (evaluation/spain/foral-ab/REPORT.md).
// ?foral=0 none, ?foral=1 all four, ?foral=nc,gi those named.
// All four on. Álava and Navarre count 1–2 floors more than OSM's building:levels: the photos (Pamplona, Vitoria,
// evaluation/spain/foral-ab/REPORT.md) side with the cadastres; Spanish mappers write "B+4" (planta baja + 4) as 4 and
// leave out the attic, the cadastre counts every floor above ground (Bára 23. 11. 2026).
export const FORAL_ON = new Set(["nc", "gi", "bi", "ar"]);
export function foralEnabled(code, sw) {
  if (sw === "0") return false;
  if (sw === "1") return true;
  if (sw) return sw.split(",").includes(code);
  return FORAL_ON.has(code);
}

export function foralUrl(code, lat, lon, d) {
  const s = FORAL[code];
  const box = s.lonLat ? [lon - d, lat - d, lon + d, lat + d] : [lat - d, lon - d, lat + d, lon + d];
  return `${s.url}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: s.type, count: "10",
    ...(s.srs && { srsName: s.srs }), bbox: `${box.map((v) => +v.toFixed(7)).join(",")},${s.bboxCrs}` })}`;
}

// The members of a GML answer (wfs:member of WFS 2.0, gml:featureMember of the older form).
const members = (gml) => String(gml || "").split(/<(?:wfs:member|gml:featureMember)\b[^>]*>/).slice(1);
// The text of the first element of a local name, also with XML attributes (not an empty one, <x xsi:nil="true"/>).
const value = (m, tag) => {
  const v = m.match(new RegExp(`<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*?)?(?<!/)>([^<]*)<`))?.[1]?.trim();
  return v || null;
};
const block = (m, tag) => m.match(new RegExp(`<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*?)?(?<!/)>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>`))?.[1] ?? null;
const ringsGml = (m, lonLat) => [...m.matchAll(/<gml:posList[^>]*>([^<]*)<\/gml:posList>/g)].map((x) => {
  const v = x[1].trim().split(/\s+/).map(Number), r = [];
  for (let i = 0; i + 1 < v.length; i += 2) r.push(lonLat ? [v[i], v[i + 1]] : [v[i + 1], v[i]]);
  return r;
});
// The distance in metres from a point to the nearest edge of the rings.
function edgeDist(rings, lon, lat) {
  const mx = 111320 * Math.cos((lat * Math.PI) / 180), my = 110574;
  let best = Infinity;
  for (const r of rings) for (let i = 1; i < r.length; i++) {
    const ax = (r[i - 1][0] - lon) * mx, ay = (r[i - 1][1] - lat) * my, bx = (r[i][0] - lon) * mx, by = (r[i][1] - lat) * my;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, k = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
    best = Math.min(best, Math.hypot(ax + k * dx, ay + k * dy));
  }
  return best;
}

// The year the building was built: "beginning" (Navarre), else "end" (Bizkaia, Gipuzkoa: the end of the works), else
// the element's own text (Álava).
function yearOf(m) {
  const b = block(m, "dateOfConstruction");
  if (b === null) return undefined;
  const raw = value(b, "beginning") || value(b, "end") || (b.includes("<") ? null : b.trim());
  const y = parseInt(String(raw || "").slice(0, 4), 10);
  return y > 1005 && y <= new Date().getFullYear() + 2 ? y : undefined;
}
// The INSPIRE CurrentUseValue codes (and the Catastro's own, should one appear) → the app's uses.
const USE = {
  residential: "living", individualResidence: "living", collectiveResidence: "living", twoDwellings: "living", moreThanTwoDwellings: "living", residenceForCommunities: "living",
  agriculture: "industrial", industrial: "industrial", commerceAndServices: "office", office: "office", trade: "office", publicServices: "public",
};
// All uses of a member: the code at the end of an xlink:href, an xlink:title, or the element's text.
function usesOf(m) {
  const out = [];
  for (const x of m.matchAll(/<(?:[\w.-]+:)?currentUse\b([^>]*?)(\/?)>([^<]*)/g)) {
    const attrs = x[1], text = x[2] ? "" : x[3].trim();
    const code = attrs.match(/xlink:href="[^"]*\/([^"/]+)"/)?.[1] || attrs.match(/xlink:title="([^"]*)"/)?.[1]?.trim() || text;
    const use = USE[String(code).replace(/\s+/g, "")] || USE[String(code).replace(/^\d+(_\d+)?_/, "")];
    if (use) out.push(use);
  }
  return out;
}

// The facts of the building at the facade's point (the one it lies in, else the nearest of the window) in the shape of
// towns/spain.js catastroBuilding, with the cadastre's code for the credit.
export function foralBuilding(code, gml, lat, lon) {
  const lonLat = !!FORAL[code]?.lonLat;
  const all = members(gml).map((m) => ({ m, rings: ringsGml(m, lonLat) }));
  if (!all.length) return {};
  const here = all.find((b) => b.rings.length && inside(b.rings, lon, lat));
  const b = here || all.slice().sort((p, q) => edgeDist(p.rings, lon, lat) - edgeDist(q.rings, lon, lat))[0];
  const m = b.m;
  const floors = Number(value(m, "numberOfFloorsAboveGround")) || undefined;
  const built = yearOf(m);
  const uses = usesOf(m);
  // A house with shops below its flats (Gipuzkoa lists commerce first): flats.
  const use = uses.includes("living") ? "living" : uses[0];
  const dwellings = Number(value(m, "numberOfDwellings") ?? NaN);
  const living = use === "living";
  const office = use === "office" ? true : undefined;
  const type = use === "industrial" ? "industrial" : living ? (dwellings > 1 ? "apartments" : dwellings === 1 ? "house" : undefined) : office ? "office" : undefined;
  if (!floors && !built && !use) return {};
  return { built, office, house: (living && dwellings === 1) || undefined, type, ...(floors > 0 && { cornice: floors, total: floors, roof: 0 }), foral: code };
}

const TIMEOUT = 25000; // as the Catastro's (towns/spain.js)
export const foralFetch = (code, lat, lon, d) => fetch(foralUrl(code, lat, lon, d), { signal: AbortSignal.timeout(TIMEOUT) })
  .then((r) => { if (!r.ok) throw new Error(`${code} ${r.status}`); return r.text(); })
  .then((gml) => foralBuilding(code, gml, lat, lon));
