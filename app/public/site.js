// Networks under the street (a trial, Bára 12. 11. 2026): where the cut crosses the lines of the networks of the
// cities that publish them (NET_CITIES): Prague (IPR's technical map TMIS, authorised and not, with heights) and
// (Brno was tried, see NET_CITIES), with their depth. The lines carry the height above sea
// level of each vertex (Z, Bpv); the depth is the surface's height there minus it: from the heights of the technical
// map's own surveyed points nearby (výškopis, kerbs, trees…: Bára's idea, the street's real surface), else from the
// ground model (ČÚZK DMR 5G, one raw image along the cut). Not every Z is the pipe: where the line was not measured in depth it lies on the surface (depth about
// 0), so a depth outside DEPTH_OK is not believed and the network is drawn at its kind's usual depth (ČSN 73 6005,
// indicative), marked as such.
import { query } from "./gis.js";
import { t } from "./i18n.js";

const IPR = "https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer";
const LAYERS = [7, 3]; // průběh linií TMIS (neautorizované), TMIS ADS (autorizované)
// Brno was tried and left out (12. 11. 2026): its technical map publishes only pieces of the networks' drawing (577
// pieces of water mains in the whole city, none around a cut of Olomoucká), not their routes (commit 3beb56d has
// the code that read them: one identify over the layers 25–34 of PUBLIC/opendata_umps).
export const NET_CITIES = { praha: () => t("site.dataIprPraha") };
// Other towns that publish their networks' lines (Bára 16. 11. 2026, found by a data hunt; no depth in any of them,
// Třebíč and Žilina left out: none on 10 random cuts, their layers cover a few streets;
// so they are drawn at their kind's usual depth, dashed; a size (DN) where the layer has one): by the place of the
// cut. url: the layer (ArcGIS REST); kind: of all its lines; popis(a): the description shown; dn(a): mm or null.
const AGO = (org, n) => `https://services-eu1.arcgis.com/${org}/arcgis/rest/services/${encodeURI(n)}/FeatureServer`;
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const L = (url, kind, popis = () => "", dn = () => null) => ({ url, kind, popis, dn });
const NETS = [
  { id: "olomouc", box: [17.15, 49.53, 17.35, 49.66], credit: () => t("site.networksCityOlomoucRegion"), layers: ((b) => [
    L(`${b}/532`, "vodovod", (a) => a.KATEGORIE), L(`${b}/502`, "kanalizace", (a) => a.KATEGORIE), L(`${b}/537`, "plynovod", (a) => a.KATEGORIE), L(`${b}/490`, "silnoproud", (a) => a.KATEGORIE),
  ])("https://gisint.kr-olomoucky.cz/int/rest/services/portal_UP/UAP_DI_TI_konzervace_31122025/MapServer") },
  { id: "karvina", box: [18.45, 49.8, 18.62, 49.9], credit: () => t("site.networksCityKarvinaUap"), layers: ((b) => [
    L(`${b}/302`, "vodovod", (a) => a.nazev_jevu, (a) => num(a.dn)), L(`${b}/309`, "kanalizace", (a) => a.nazev_jevu, (a) => num(a.dn)), L(`${b}/338`, "plynovod", (a) => a.nazev_jevu, (a) => num(a.dn)),
    L(`${b}/326`, "silnoproud", (a) => a.nazev_jevu), L(`${b}/728`, "silnoproud", (a) => a.nazev_jevu),
  ])("https://gis.karvina.cz/arcgis/rest/services/cz_mm_karvina/uap_technicka_infrastruktura/MapServer") },
  { id: "ostrava", box: [18.1, 49.72, 18.38, 49.9], credit: () => t("site.networksCityOstravaUap"), layers: ((o) => [
    L(`${o}/Ostrava_vodni_ZPV_vod_rad_L/FeatureServer/1`, "vodovod", (a) => a.NAZEV, (a) => num(a.DN)), L(`${o}/Ostrava_vodni_OCOV_stoka_L/FeatureServer/1`, "kanalizace", (a) => a.NAZEV_JEVU),
    L(`${o}/Ostrava_energetika_PLN_plynovod/FeatureServer/1`, "plynovod", (a) => a.NAZEV_JEVU), L(`${o}/Ostrava_energetika_ZT_teplo/FeatureServer/1`, "teplovod", (a) => a.NAZEV_JEVU),
    L(`${o}/Ostrava_energetika_ZEE_el_vedeni/FeatureServer/1`, "silnoproud"), L(`${o}/Ostrava_energetika_ZEE_vo_vedeni/FeatureServer/1`, "silnoproud", (a) => a.NAZEV_JEVU),
  ])("https://services5.arcgis.com/YElTIrF9aD2PDrLy/arcgis/rest/services") },
  { id: "breclav", box: [16.83, 48.72, 16.95, 48.8], credit: () => t("site.networksTownBreclav"), layers: ((o) => [
    L(`${o}/vodovod/FeatureServer/0`, "vodovod", (a) => a.PopisObjektu), L(`${o}/kanalizace/FeatureServer/0`, "kanalizace", (a) => a.PopisObjektu),
    L(`${o}/${encodeURI("trasa_plynovodní_sítě")}/FeatureServer/0`, "plynovod", (a) => a.PopisObjektu), L(`${o}/${encodeURI("elektrická_síť")}/FeatureServer/0`, "silnoproud", (a) => a.PopisObjektu),
    L(`${o}/Teplovod/FeatureServer/0`, "teplovod", (a) => a.DRUH_TEPLO),
  ])("https://services8.arcgis.com/IyOEkZNvMiU8JI5H/arcgis/rest/services") },
  { id: "presov", sk: true, box: [21.15, 48.94, 21.33, 49.06], credit: () => t("site.networksCityPresovDigital"), layers: ((g) => [
    L(`${g("03_ELE_NN_polyline")}/96`, "silnoproud", (a) => a.obsah_hladiny), L(`${g("04_ELE_VN_polyline")}/6`, "silnoproud", (a) => a.obsah_hladiny),
    L(`${g("06_VEROSV_polyline")}/5`, "silnoproud", (a) => a.obsah_hladiny), L(`${g("07_OZNAM_polyline")}/14`, "slaboproud", (a) => a.obsah_hladiny),
    L(`${g("08_KANAL_polyline")}/4`, "kanalizace", (a) => a.obsah_hladiny), L(`${g("09_PLYN_polyline")}/4`, "plynovod", (a) => a.obsah_hladiny),
    L(`${g("10_VODA_polyline")}/4`, "vodovod", (a) => a.obsah_hladiny), L(`${g("11_TEPLO_polyline")}/4`, "teplovod", (a) => a.obsah_hladiny),
  ])((n) => AGO("coW662rcZatH0tHA", n)) },
  { id: "nitra", sk: true, box: [18.0, 48.26, 18.17, 48.37], credit: () => t("site.networksCityNitra"), layers: ((g) => [
    L(`${g("Vodovod_kopia")}/0`, "vodovod", (a) => a.popis), L(`${g("Kanalizácia_kópia")}/0`, "kanalizace"), L(`${g("Dažďová_kanalizácia_kópia")}/0`, "kanalizace", (a) => a.popis),
    L(`${g("Plyn_zdrojové_dáta_zobrazenie")}/0`, "plynovod"), L(`${g("Teplovod_kópia")}/0`, "teplovod"), L(`${g("Elektrika_kópia")}/0`, "silnoproud", (a) => a.LvlDesc),
    L(`${g("Telecom_kópia")}/0`, "slaboproud"), L(`${g("Rozvody_VO_kópia")}/0`, "silnoproud", (a) => a.TYP_VEDENI),
  ])((n) => AGO("3EnLFR2iBNxznmDC", n)) },
  { id: "piestany", sk: true, box: [17.78, 48.55, 17.88, 48.64], credit: () => t("site.networksTownPiestanyBuilt"), layers: ((g) => [
    ...[2, 3, 4, 5].map((i) => L(`${g("Vodovod__porealizačné_zamerania_")}/${i}`, "vodovod", (a) => a.Pole1 || a.Pole)),
    ...[2, 3, 4, 5, 6].map((i) => L(`${g("Kanalizácia__porealizačné_zamerania_")}/${i}`, "kanalizace", (a) => a.Pole1 || a.Pole)),
    ...[2, 3, 4, 5].map((i) => L(`${g("Plynovod__porealizačné_zamerania_")}/${i}`, "plynovod", (a) => a.Pole1 || a.Pole)),
    L(`${g("teplovody")}/0`, "teplovod", (a) => a.Popis),
  ])((n) => AGO("DTiFWvcjh8cdrOZ5", n)) },
  { id: "kosice", sk: true, box: [21.15, 48.64, 21.36, 48.79], credit: () => t("site.networksCityKosiceLand"), layers: ((g) => [
    L(`${g("VODOVOD___POTRUBIE")}/1331`, "vodovod", (a) => a.popis || a.Layer), L(`${g("KANALIZÁCIA___POTRUBIE")}/1330`, "kanalizace", (a) => a.Popis || a.Layer),
    L(`${g("ZÁSOBOVANIE_PLYNOM_línia_25_4")}/14`, "plynovod", (a) => a.popis), L(`${g("TRASY_HORÚCOVODOV")}/1325`, "teplovod", (a) => a.popis),
    L(`${g("ZÁSOBOVANIE_ELEKTRICKOU_ENERGIOU_VEDENIE")}/1329`, "silnoproud", (a) => a.Popis || a.Layer),
  ])((n) => AGO("qrtO0RIRViAdEN4F", n)) },
  // Amsterdam (Bára 20. 11. 2026): the sewers of Waternet (with their size; the vertices' heights are the pipe's bottom
  // in NAP, no surface height to take them from, so drawn at the usual depth) and the city's underground cables of the
  // street lighting (with their depth in cm), WFS of the city's data service (api.data.amsterdam.nl, CORS, "Creative
  // Commons, Naamsvermelding" in its catalogue). Its own loader: no ČÚZK ground model is asked. The box takes in
  // Amstelveen and Diemen too, whose networks the city does not have (no lines there).
  { id: "amsterdam", box: [4.72, 52.27, 5.08, 52.43], credit: () => t("site.networksGemeenteAmsterdamWaternet"), load: amsterdamNets },
];
// Amsterdam's WFS (GeoJSON in WGS 84, lon, lat and for sewers the height): the lines as underground() takes them.
const AMS_WFS = "https://api.data.amsterdam.nl/v1/wfs/leidingeninfrastructuur/v1";
async function amsterdamNets(box) {
  const [x0, y0, x1, y1] = box;
  const ask = (type) => fetch(`${AMS_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeName: `app:${type}`, outputFormat: "application/json",
    srsName: "urn:ogc:def:crs:EPSG::4326", bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, count: "500" })}`, { signal: AbortSignal.timeout(15000) })
    .then((r) => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] }));
  const paths = (g) => (g?.type === "LineString" ? [g.coordinates] : g?.type === "MultiLineString" ? g.coordinates : []);
  const [sewers, cables] = await Promise.all([ask("waternet_rioolleidingen"), ask("amsterdam_ovl_ondergrondse_kabels")]);
  return [
    ...(sewers.features || []).filter((f) => f.properties?.status === "In bedrijf").map((f) => ({ kind: "kanalizace", popis: `${t("site.sewer")} – ${f.properties?.type_leiding || ""}`.replace(/ – $/, ""),
      profil: num(f.properties?.diameter), layer: 0, verified: true, paths: paths(f.geometry).map((p) => p.map(([x, y]) => [x, y, NaN])) })),
    ...(cables.features || []).filter((f) => f.properties?.indicatie_boven_onder !== "Bovengronds").map((f) => {
      // The depth only where its accuracy is known: the centre's cables all say 60 cm "of unknown accuracy" (the hostile
      // review), a default, drawn at the usual depth.
      const cm = /onbekend/i.test(f.properties?.nauwkeurigheid_diepte || "onbekend") ? null : num(f.properties?.diepte);
      return { kind: "silnoproud", popis: t("site.streetLightingCable"), profil: null, layer: 1, verified: true, depth: cm > 10 && cm < 500 ? cm / 100 : null, paths: paths(f.geometry) };
    }),
  ];
}
// The networks' source at a cut: Prague's by its city, the others by a box around the town.
export function netAt(cityId, lat, lon) {
  if (NET_CITIES[cityId]) return { id: cityId, credit: NET_CITIES[cityId] };
  return NETS.find((n) => lon >= n.box[0] && lon <= n.box[2] && lat >= n.box[1] && lat <= n.box[3]) || null;
}
const DMR = "https://ags.cuzk.gov.cz/arcgis2/rest/services/dmr5g/ImageServer/exportImage";
const DEPTH_OK = [0.2, 8];
const R = 6378137;

// The kinds, by the first word of the line's description (CTMTP_POPIS), with a colour (the usual colours of the
// networks on plans), a usual depth to the top (m) when the measured one is not believed, and a usual size (DN,
// mm; cables as their sleeve, 110 mm) when the line has none.
export const KINDS = {
  kanalizace: { get label() { return t("site.sewer"); }, color: "#5a3e26", usual: 2.5, dn: 300 },
  vodovod: { get label() { return t("site.waterMain"); }, color: "#1d5fb8", usual: 1.5, dn: 150 },
  plynovod: { get label() { return t("site.gasMain"); }, color: "#d99a00", usual: 1.0, dn: 110 },
  teplovod: { get label() { return t("site.districtHeating"); }, color: "#b5302a", usual: 1.0, dn: 250 },
  silnoproud: { get label() { return t("site.powerCable"); }, color: "#6a3fb5", usual: 0.7, dn: 110 },
  slaboproud: { get label() { return t("site.telecomCable"); }, color: "#1e8a5a", usual: 0.5, dn: 110 },
  jine: { get label() { return t("common.other"); }, color: "#6f6a62", usual: 1.0, dn: 110 },
};
const kindOf = (popis = "") => {
  const w = popis.split(" ")[0];
  return KINDS[w] ? w : "jine";
};

// The ground heights along the cut: one raw float image (format bip) over the box of the cut ±2 m, about 1 m a pixel.
async function ground(box) {
  // Pixels square in degrees (about 1 m north–south): the server widens a box to keep them so, and the lookup
  // below would be off.
  const [x0, y0, x1, y1] = box, cell = 180 / (Math.PI * R);
  const w = Math.max(2, Math.min(600, Math.round((x1 - x0) / cell))), h = Math.max(2, Math.min(600, Math.round((y1 - y0) / cell)));
  const r = await fetch(`${DMR}?${new URLSearchParams({ bbox: box.join(","), bboxSR: 4326, imageSR: 4326, size: `${w},${h}`, format: "bip", pixelType: "F32", interpolation: "RSP_BilinearInterpolation", f: "image" })}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`DMR ${r.status}`);
  const buf = await r.arrayBuffer(), v = new Float32Array(buf.slice(0, w * h * 4));
  // The box as served: the requested one, made to the pixels' shape around its centre.
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, px = Math.max((x1 - x0) / w, (y1 - y0) / h);
  const X0 = cx - (px * w) / 2, Y1 = cy + (px * h) / 2;
  return (lon, lat) => {
    const i = Math.min(w - 1, Math.max(0, Math.floor((lon - X0) / px))), j = Math.min(h - 1, Math.max(0, Math.floor((Y1 - lat) / px)));
    const z = v[j * w + i];
    return z > 0 && z < 2000 ? z : NaN;
  };
}

// The surface from the technical map's points with a height (TMUMPS bodové značky): the inverse-distance mean of
// the nearest NEAR of them within POINTS_R, or NaN.
const POINTS_R = 5, NEAR = 4;
function surfacePoints(features, frame) {
  const pts = features.map((f) => ({ p: frame.toXY(f.geometry.x, f.geometry.y), z: f.geometry.z })).filter((q) => q.z > 100 && q.z < 2000);
  return (x, y) => {
    const near = pts.map((q) => ({ z: q.z, d: Math.hypot(q.p[0] - x, q.p[1] - y) })).filter((q) => q.d <= POINTS_R).sort((a, b) => a.d - b.d).slice(0, NEAR);
    if (!near.length) return NaN;
    const w = near.map((q) => 1 / Math.max(0.3, q.d));
    return near.reduce((a, q, i) => a + q.z * w[i], 0) / w.reduce((a, b) => a + b, 0);
  };
}

// The networks the cut crosses: [{ t, depth, measured, kind, popis, profil }] with t across the cut (m, +normal = A),
// or null outside Prague.
export async function underground({ frame, dir, half, cityId }) {
  const [lon0, lat0] = frame.toLonLat(0, 0), other = netAt(cityId, lat0, lon0);
  if (!other) return null;
  const normal = [-dir[1], dir[0]];
  // A square around the cut's centre, ±1.5 times its half length (at least 30 m): the lines on the map then end
  // outside the first view (Fable), the crossings are the same.
  const reach = Math.max(30, 1.5 * half), [clon, clat] = frame.toLonLat(0, 0), dLat = reach / 110574, dLon = reach / (111320 * Math.cos((clat * Math.PI) / 180));
  const box = [clon - dLon, clat - dLat, clon + dLon, clat + dLat];
  // The lines of the city: { kind, popis, profil, layer, verified, paths (lon, lat, z) }.
  let feats, height = () => NaN, surface = () => NaN;
  if (other.load) {
    feats = await other.load(box);
  } else if (!NET_CITIES[cityId]) {
    // Another town: its layers, the ground model where it is Czech (ČÚZK's DMR 5G; not asked for a Slovak town, sk) for
    // lines that carry a height.
    const [h, ...answers] = await Promise.all([other.sk ? () => NaN : ground(box).catch(() => () => NaN),
      ...other.layers.map((l) => query(`${l.url}/query`, { geometry: box.join(","), geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: "*", returnGeometry: true, returnZ: true, outSR: 4326, f: "json" }).catch(() => ({ features: [] })))]);
    height = h;
    feats = answers.flatMap((a, li) => (a.features || []).map((f) => {
      const l = other.layers[li], at = f.attributes || {};
      const popis = String(l.popis(at) || KINDS[l.kind].label).trim();
      return { kind: l.kind, popis, profil: l.dn(at), layer: li, verified: true, paths: f.geometry?.paths || [] };
    }));
  } else {
    const [h, points, ...answers] = await Promise.all([
      ground(box).catch(() => () => NaN),
      query(`${IPR}/9/query`, { geometry: box.join(","), geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: "OBJECTID", returnGeometry: true, returnZ: true, outSR: 4326, f: "json" }).catch(() => ({ features: [] })),
      ...LAYERS.map((l) => query(`${IPR}/${l}/query`, { geometry: box.join(","), geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: "CTMTP_POPIS,PROFIL", returnGeometry: true, returnZ: true, outSR: 4326, f: "json" })),
    ]);
    height = h;
    surface = surfacePoints(points.features || [], frame);
    feats = answers.flatMap((a, li) => (a.features || []).map((f) => {
      const popis = f.attributes?.CTMTP_POPIS || "";
      return { kind: kindOf(popis), popis, profil: f.attributes?.PROFIL ?? null, layer: LAYERS[li], verified: !/neověř/.test(popis), paths: f.geometry?.paths || [] };
    }));
  }
  const out = [], lines = [];
  for (const f of feats) {
    const { popis, layer } = f;
    // Left out: lines taken out of use, the outlines of underground objects (a chamber is no crossing) and lines
    // overhead ("nadz.": a lamp's cable over the street, Fable).
    if (/vyřaz|objekty|nadz/.test(popis)) continue;
    // For the map: the lines as they run, in the colours of their kinds.
    for (const path of f.paths) lines.push({ kind: f.kind, popis, verified: f.verified, coords: path.map(([lon, lat]) => [lat, lon]) });
    for (const path of f.paths) for (let i = 0; i + 1 < path.length; i++) {
      const p = frame.toXY(path[i][0], path[i][1]), q = frame.toXY(path[i + 1][0], path[i + 1][1]);
      const u1 = p[0] * dir[0] + p[1] * dir[1], u2 = q[0] * dir[0] + q[1] * dir[1];
      if (u1 === u2 || u1 * u2 > 0) continue;
      const k = u1 / (u1 - u2), x = p[0] + k * (q[0] - p[0]), y = p[1] + k * (q[1] - p[1]), t = x * normal[0] + y * normal[1];
      if (Math.abs(t) > half) continue;
      const z = (path[i][2] ?? NaN) + k * ((path[i + 1][2] ?? NaN) - (path[i][2] ?? NaN)), [lon, lat] = frame.toLonLat(x, y);
      const kind = f.kind, fromPoints = surface(x, y) - z, fromDmr = height(lon, lat) - z;
      const ok = (d) => Number.isFinite(d) && d >= DEPTH_OK[0] && d <= DEPTH_OK[1];
      // A depth the line itself states (Amsterdam's cables) before one from the heights.
      const d = Number.isFinite(f.depth) ? f.depth : Number.isFinite(fromPoints) ? fromPoints : fromDmr, measured = ok(d);
      out.push({ t: +t.toFixed(2), depth: +(measured ? d : KINDS[kind].usual).toFixed(2), measured, kind, popis, layer, profil: f.profil,
        fromPoints: Number.isFinite(fromPoints) ? +fromPoints.toFixed(2) : null, fromDmr: Number.isFinite(fromDmr) ? +fromDmr.toFixed(2) : null });
    }
  }
  // One network drawn more than once (Bára, Voršilská; 41 Prague cuts: a sewer is mostly in both layers, the
  // operator's authorised copy without heights and the other with them, 0.1–0.6 m apart; a storm and a foul sewer
  // 0.9 m apart are two): lines of a kind and the same sort (jednotná, dešťová…; "bez rozl." goes with any) are one
  // within OTHER_LAYER of a line of the other layer, within SAME of one of the same layer (a cable and its sleeve,
  // cables in one trench); the best of them kept (a believed depth, then verified, then the larger size).
  out.sort((a, b) => a.t - b.t);
  const rank = (x) => (x.measured ? 4 : 0) + (/ověř\./.test(x.popis) && !/neověř/.test(x.popis) ? 2 : 0) + (/chráni/.test(x.popis) ? 0 : 1);
  const groups = [];
  for (const x of out) {
    const g = groups.find((q) => q.kind === x.kind && q.list.some((y) => sortsMatch(y, x) && x.t - y.t <= (y.layer === x.layer ? SAME : OTHER_LAYER)));
    if (g) g.list.push(x); else groups.push({ kind: x.kind, list: [x] });
  }
  const items = groups.map(({ list }) => {
    const best = list.reduce((a, x) => (rank(x) > rank(a) ? x : a));
    const size = Math.max(0, ...list.map((x) => (x.profil > 20 && x.profil < 3000 ? x.profil : 0)));
    return { ...best, t: +(list.reduce((a, x) => a + x.t, 0) / list.length).toFixed(2), profil: size || best.profil, lines: list.length };
  });
  items.lines = lines;
  return items;
}
const SAME = 0.5, OTHER_LAYER = 1.0;
const sortOf = (x) => x.popis.split(" - ")[1]?.trim() || "";
const sortsMatch = (a, b) => { const p = sortOf(a), q = sortOf(b); return p === q || p === "bez rozl." || q === "bez rozl." || a.kind !== "kanalizace"; };
