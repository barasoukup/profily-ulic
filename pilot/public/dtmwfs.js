// Surfaces and barriers of a cut from the regions' own DTM as real polygons and lines (WFS 2.0), where the
// region publishes one: nine regions run the DTM of T-MAPY (krajdtm.cz and the regions' own hosts), whose map
// service also answers WFS with GML in S-JTSK (EPSG:5514), CORS open, no key. The content is the region's
// DTM, the same as the national DMVS shows; dmvs.js reads that from map images when no WFS is at hand (Praha
// and the Středočeský kraj with IPR, Plzeňský, Ústecký, Olomoucký kraj) or when the WFS fails.
// One request for the areas and one for the lines, in parallel; the answer is GML parsed here (one code path
// for the browser and Node), the coordinates turned to WGS 84 by towns/sjtsk.js.
import { t } from "./i18n.js";
import { toWgs, fromWgs } from "./towns/sjtsk.js";
import { typeCode } from "./dmvs.js";

// The regions with the WFS (RÚIAN codes of VÚSC in tools/build_kraje.mjs) and the names for the credit.
export const REGIONS = {
  jck: ["https://jck.krajdtm.cz", "Jihočeský kraj"],
  pak: ["https://pak.krajdtm.cz", "Pardubický kraj"],
  vys: ["https://vys.krajdtm.cz", "Kraj Vysočina"],
  msk: ["https://msk.krajdtm.cz", "Moravskoslezský kraj"],
  khk: ["https://khk.krajdtm.cz", "Královéhradecký kraj"],
  jmk: ["https://dtm.jmk.cz", "Jihomoravský kraj"],
  lbk: ["https://dtm.kraj-lbc.cz", "Liberecký kraj"],
  kvk: ["https://dtm.kr-karlovarsky.cz", "Karlovarský kraj"],
  zlk: ["https://dtm.zlinskykraj.cz", "Zlínský kraj"],
};
export const WFS_HOSTS = Object.values(REGIONS).map(([u]) => u);
const AREAS = "/mapservice/v1/wms/dtm_zps_plochy_bar";
const LINES = "/mapservice/v1/wms/dtm_zps_linie_body";
const TIMEOUT = 5000; // ms; a slower region is left to the map images of dmvs.js
const MAX_GAP = 25; // m, as dmvs.js: the widest blank roadway between areas read as a street drawn in part
const PAD = 0.0004; // degrees, as dmvs.js

// The feature types of the areas (WFS GetCapabilities of dtm_zps_plochy_bar): all on or above the ground but
// the roofs (a stop's canopy over the sidewalk), the course of tunnels and underpasses and the underground objects.
const AREA_TYPES = [
  "vod_tok", "jezero", "zem_pl_nezj", "zem_pl_jiny", "zem_pl_ttp", "zem_pl_ov_sad", "zem_pl_chmel", "zem_pl_vin", "zem_pl_or_puda",
  "zahr", "les", "hosp_nevyuz_pl", "udrz_pl_zel_nezj", "udrz_pl_zel_sil_veg", "udrz_pl_zel_okr_pl", "udrz_pl_zel_sk_stromu",
  "udrz_pl_zel_mest", "vod_nadrz_vzd_obj", "vod_nadrz_bez_vzd_obj", "hraz", "jez", "sterk_prehr", "stupen", "st_upr_koryto",
  "mel_prikop", "st_protipov_zabr", "such_nadrz", "dul_lom", "pl_rekult", "ul_mis_tez_pr", "jine_dul_dilo", "hriste", "dr_sakr_st",
  "hrbitov", "dr_kult_st_nezj", "dr_kult_st_zvon", "dr_kult_st_moh", "dr_kult_st_socha", "dr_kult_st_pom", "dr_kult_st_font",
  "dr_kult_st_kas", "podezd", "sch", "zed_mes_hrad", "zed_nezj", "zed_zarubni", "zed_operna", "zed", "ramp", "ter", "kom", "skl",
  "baz", "patka", "st_zpev_pov", "dv", "celo_prop", "ost_zastr_st", "veg", "poz_kom", "chod", "cyklo", "park", "dopr_ostr",
  "del_pas", "najezd", "pridr_pl", "zel", "tram_dr", "poz_lan_dr", "spec_zel_dr", "prikop", "nast", "map_pl", "mostovka",
  "portal_tunel", "portal_podchod", "most_vaha", "bud",
].map((t) => `ms:zps_p_${t}`).join(",");
// Barriers across a cut → the codes of IPR's line layer (derive.js FENCE_LINES, as towns/jihlava.js).
const LINE_CODES = {
  zps_l_prisl_st_plot_zivy: 61210, zps_l_prisl_st_plot_jiny: 61210, zps_l_prisl_st_plot_nezj: 61210, zps_l_prisl_st_plot_zden: 61210,
  zps_l_prisl_st_plot_kov: 61210, zps_l_prisl_st_plot_drat: 61210, zps_l_prisl_st_plot_drev: 61210,
  zps_l_prisl_st_zabradli: 61530, zps_l_prisl_st_zed: 71210, zps_l_dopr_st_protihl_stena: 71210, zps_l_dopr_st_svod: 71522,
};
const LINE_TYPES = Object.keys(LINE_CODES).map((t) => `ms:${t}`).join(",");

// ---------- The region of a cut ----------
// kraje.json: the regions' boundaries (tools/build_kraje.mjs), loaded on the first cut.
let kraje = null;
async function loadKraje() {
  if (!kraje) {
    const url = new URL("./kraje.json", import.meta.url);
    kraje = (url.protocol === "file:"
      ? import("node:fs/promises").then((fs) => fs.readFile(url, "utf8")).then(JSON.parse)
      : fetch(url).then((r) => (r.ok ? r.json() : {})))
      .then((json) => Object.entries(json).map(([id, rings]) => ({ id, rings })))
      .catch(() => { kraje = null; return []; });
  }
  return kraje;
}
const inside = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const NEAR = 0.005; // degrees (about 400 m): the boundaries are simplified to 300 m
// The regions with a WFS a bbox may lie in: [] where any part of it (and the land within 400 m) lies in a region
// without one, so the cut is read from the map images.
export async function regionsAt(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const list = await loadKraje();
  const found = new Set();
  for (const [x, y] of [[(x0 + x1) / 2, (y0 + y1) / 2], [x0 - NEAR, y0 - NEAR], [x0 - NEAR, y1 + NEAR], [x1 + NEAR, y0 - NEAR], [x1 + NEAR, y1 + NEAR]]) {
    const r = list.find((k) => inside(k.rings, x, y));
    if (!r) return []; // a region without the WFS, or abroad
    found.add(r.id);
  }
  return [...found];
}

// ---------- GML ----------
// The features of a GetFeature answer (GML 3.2 of MapServer): { type, attrs: { name: text }, polygons: [[ring…]]
// or lines: [[pt…]] } with the coordinates as given (S-JTSK, easting first).
const coords = (text, dim) => {
  const v = text.trim().split(/\s+/).map(Number), out = [];
  for (let i = 0; i + 1 < v.length; i += dim) out.push([v[i], v[i + 1]]);
  return out;
};
const posLists = (xml) => [...xml.matchAll(/<gml:posList(?:\s+srsDimension="(\d)")?[^>]*>([^<]*)<\/gml:posList>/g)].map((m) => coords(m[2], Number(m[1]) || 2));
export function parseGml(xml) {
  const out = [];
  for (const m of xml.matchAll(/<ms:(zps_[a-z0-9_]+) gml:id="[^"]*">([\s\S]*?)<\/ms:\1>/g)) {
    const [, type, body] = m;
    const attrs = {};
    for (const a of body.matchAll(/<ms:([a-z0-9_]+)>([^<]*)<\/ms:\1>/g)) attrs[a[1]] = a[2];
    const polygons = [...body.matchAll(/<gml:Polygon[\s\S]*?<\/gml:Polygon>/g)].map((p) => posLists(p[0]));
    const lines = polygons.length ? [] : posLists(body);
    out.push({ type, attrs, polygons, lines });
  }
  return out;
}

// ---------- Requests ----------
async function getFeatures(base, path, typeNames, box) {
  const q = new URLSearchParams({
    service: "WFS", version: "2.0.0", request: "GetFeature", typeNames, count: 5000,
    bbox: `${box.map((v) => v.toFixed(2)).join(",")},urn:ogc:def:crs:EPSG::5514`,
  });
  const r = await fetch(`${base}${path}?${q}`, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error(`WFS ${r.status}`);
  const text = await r.text();
  if (/ExceptionReport/.test(text.slice(0, 600))) throw new Error(`WFS: ${(text.match(/<ows:ExceptionText>([^<]*)/) || [])[1] || t("chyba")}`);
  return parseGml(text);
}
// The bbox "x0,y0,x1,y1" in degrees → the S-JTSK box around it.
export function sjtskBox(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const c = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]].map(([x, y]) => fromWgs(x, y));
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const wgsRing = (r) => r.map(([x, y]) => toWgs(x, y));

// ---------- Areas ----------
// The areas of the DTM in the bbox as dmvs.js dtmAreas gives them: { features: [{ attributes: { code, guess,
// level, type }, geometry: { rings } }], region, gap, requests }. null where no region of the bbox has a WFS.
export async function wfsAreas(bbox, { cut } = {}) {
  const regions = await regionsAt(bbox);
  if (!regions.length) return null;
  const box = sjtskBox(bbox);
  const answers = await Promise.all(regions.map((id) => getFeatures(REGIONS[id][0], AREAS, AREA_TYPES, box)));
  const all = [];
  for (const f of answers.flat()) {
    const level = Number(f.attrs.urovenumisteniobjektuzps) || 0;
    if (level < 0 || !f.polygons.length) continue;
    const name = f.attrs.objektovytypnazev;
    const code = typeCode(name);
    if (code === undefined) console.warn("DTM WFS: neznámý typ", name);
    if (!code) continue;
    const rings = f.polygons.flat().filter((r) => r.length >= 4).map(wgsRing);
    if (rings.length) all.push({ attributes: { code, guess: false, level: level > 0 ? 1 : 0, type: name }, geometry: { rings } });
  }
  // Only the areas the cut crosses, as dmvs.js reads them from its image: an area elsewhere in the box would
  // keep RÚIAN's parcels under a street the region has not drawn (dmvs.js surfaces).
  const lines = cutLines(bbox, cut);
  const features = all.filter((f) => lines.some((l) => crosses(f, l)));
  return { features, region: regions.map((id) => REGIONS[id][1]).join(", "), gap: blankGap(features, bbox, cut), requests: regions.length, wfs: true };
}

// The cut, or without it both diagonals of the bbox less PAD (the cut runs along one), as dmvs.js.
const cutLines = (bbox, cut) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  return cut ? [cut] : [[[x0 + PAD, y0 + PAD], [x1 - PAD, y1 - PAD]], [[x0 + PAD, y1 - PAD], [x1 - PAD, y0 + PAD]]];
};
const STEP = 0.2; // m between the points of a cut tested in an area (dmvs.js: areas of 0.3 m on the cut)
const boxes = new WeakMap();
function crosses(f, [a, b]) {
  const g = f.geometry;
  if (!boxes.has(g)) {
    const pts = g.rings.flat();
    boxes.set(g, [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))]);
  }
  const [bx0, by0, bx1, by1] = boxes.get(g);
  if (Math.max(a[0], b[0]) < bx0 || Math.min(a[0], b[0]) > bx1 || Math.max(a[1], b[1]) < by0 || Math.min(a[1], b[1]) > by1) return false;
  const kx = 111320 * Math.cos((a[1] * Math.PI) / 180), ky = 110574;
  const n = Math.max(1, Math.ceil(Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * ky) / STEP));
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n, y = a[1] + ((b[1] - a[1]) * i) / n;
    if (x >= bx0 && x <= bx1 && y >= by0 && y <= by1 && inside(g.rings, x, y)) return true;
  }
  return false;
}

// A blank stretch under the centre of the cut with areas of the DTM on both sides within MAX_GAP / 2: a street
// the region has drawn only in part (dmvs.js reads the same from its image).
function blankGap(features, bbox, cut) {
  const [, y0, , y1] = bbox.split(",").map(Number);
  const ground = features.filter((f) => f.attributes.level === 0);
  const cuts = cutLines(bbox, cut);
  const lat = (y0 + y1) / 2, kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  for (const [a, b] of cuts) {
    const len = Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * ky);
    if (!len) continue;
    const at = (d) => { // d metres from the middle
      const t = 0.5 + d / len;
      if (t < 0 || t > 1) return null;
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      return ground.some((f) => inside(f.geometry.rings, x, y));
    };
    if (at(0)) continue;
    let lo = false, hi = false;
    for (let d = 0.25; d <= MAX_GAP / 2 && !(lo && hi); d += 0.25) { lo ||= at(-d); hi ||= at(d); }
    if (lo && hi) return true;
  }
  return false;
}

// ---------- Lines ----------
// Fences, walls, railings, noise barriers and guard rails as features of IPR's line layer ({ attributes:
// { CTMTP_KOD }, geometry: { paths } }), for derive.js. { features: [] } where no region has a WFS.
export async function wfsLines(bbox) {
  const regions = await regionsAt(bbox);
  if (!regions.length) return { features: [] };
  const box = sjtskBox(bbox);
  const answers = await Promise.all(regions.map((id) => getFeatures(REGIONS[id][0], LINES, LINE_TYPES, box).catch(() => [])));
  const features = [];
  for (const f of answers.flat()) {
    const code = LINE_CODES[f.type];
    const paths = f.lines.filter((l) => l.length >= 2).map(wgsRing);
    if (code && paths.length) features.push({ attributes: { CTMTP_KOD: code }, geometry: { paths } });
  }
  return { features };
}
