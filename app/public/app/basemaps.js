// The base maps and their layers (the states' orthophotos, the cities' maps), the layer control, and the data layers of the cut.
import { SK_ORTHO, AT_ORTHO, CH_ORTHO, NL_ORTHO, BE_ORTHO, LU_ORTHO, PL_ORTHO, FR_ORTHO, ES_ORTHO, PT_ORTHO, PT_MAINLAND, ES_NOT_PNOA, CY_ORTHO, MT_ORTHO, IT_ORTHO, EE_ORTHO, SI_ORTHO, FI_ORTHO, US_ORTHO, CA_ORTHO, DK_ORTHO, DE_ORTHO, deWmsUrl, landsAt, landAt } from "../lanes-ortho.js";
import { dkToken } from "../keys.js";
import { boxed as boxedPlace, within as withinPlace } from "../places.js";
import { insideRings } from "../gis.js";
import { TOWNS } from "../towns/index.js";
import { ensurePlace, isLate, onAmerica } from "../late.js";
import { createDataLayers } from "../maplayers.js";
import { creditText, W, lead } from "../credit-text.js";
import { t as tr, mark } from "../i18n.js";
import { TOWN_BOUNDS, STATES } from "./boundaries.js";
import { map } from "./map.js";

// Base maps. IPR services are drawn through ArcGIS export requests in Web Mercator, one per tile.
// Each request renders a 512 px image covering four normal tiles (tileSize 512, zoomOffset -1):
// a quarter of the requests, which IPR renders one by one (0.2–1.5 s each), and the browser's
// six parallel connections to gs-pub stay free for the profile data.
const GS = "https://gs-pub.praha.eu";
const ArcgisExport = L.TileLayer.extend({
  getTileUrl(c) {
    // One big tile is 512 CSS px; sharp on retina screens with a 1024 px image.
    const size = devicePixelRatio > 1.5 ? 1024 : 512;
    // coords.z is the map zoom; the tile grid is that of the URL zoom (map zoom + zoomOffset).
    const z = this._getZoomForUrl();
    const nw = this._map.options.crs.project(this._map.unproject([c.x * 256, c.y * 256], z));
    const se = this._map.options.crs.project(this._map.unproject([(c.x + 1) * 256, (c.y + 1) * 256], z));
    const image = this.options.service.endsWith("ImageServer");
    return `${this.options.service}/${image ? "exportImage" : "export"}?` + new URLSearchParams({
      bbox: [nw.x, se.y, se.x, nw.y].join(","), bboxSR: 3857, imageSR: 3857, size: `${size},${size}`,
      format: image ? "jpg" : "png", transparent: !image, f: "image",
      // S-JTSK → WGS 84 the same way everywhere (S_JTSK_To_WGS_1984_1, the default of MTVU and the
      // technical map): some IPR map services default to another one and draw a few metres off.
      ...(image ? {} : { datumTransformations: "[1623]" }),
      ...(this.options.layers ? { layers: this.options.layers } : {}),
    });
  },
});
const BIG_TILES = { tileSize: 512, zoomOffset: -1 };
// One set of base maps for the whole Czech Republic (Bára: one page, no city switch): each kind of map
// is the national layer with the cities' own on top, each limited to its city (towns.json).
const DMVS = "https://dmvs.cuzk.gov.cz/api/wms";
const osmLayer = (opacity = 1) => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 21, maxNativeZoom: 19, opacity, attribution: `© <a href="https://www.openstreetmap.org/copyright">${tr("common.openstreetmapContributors")}</a>` });
// A blank tile: what a layer kept to its area draws beyond it (nothing is asked of its server there).
const BLANK_TILE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// Does the tile reach the area's rings: a corner or its middle inside them, or a vertex of them inside the tile (a tile
// across the border at a low zoom).
function tileReaches(layer, coords, rings) {
  const size = layer.getTileSize(), at = (fx, fy) => layer._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
  const nw = at(0, 0), se = at(1, 1);
  if ([[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => { const q = at(fx, fy); return insideRings(rings, q.lng, q.lat); })) return true;
  return rings.some((r) => r.some(([x, y]) => x >= nw.lng && x <= se.lng && y >= se.lat && y <= nw.lat));
}
// A layer class of a state's (or a city's) own service kept to its area: a tile wholly beyond it is blank and not asked
// (Bára 26. 11. 2026: ČÚZK only over Czechia, whose box reaches into Germany, Austria and Poland). Its credit goes by
// the rings too (boundsOf, creditCities).
const keptInside = (Base, rings) => Base.extend({
  getTileUrl(coords) { return tileReaches(this, coords, rings) ? Base.prototype.getTileUrl.call(this, coords) : BLANK_TILE; },
});
// The box of a state's or region's rings ([lon, lat]); the rings stay with it, so that its credit shows only where the
// view reaches the area itself, not just its box (Poland's box covers Prague: creditCities).
const boundsOf = (rings) => { const pts = rings.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const b = L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]); b.rings = rings; return b; };
// Czechia's rings (states.json): ČÚZK's orthophoto and the DMVS load tiles and credit themselves only there
// (Bára 26. 11. 2026: San Francisco said "ortofoto © ČÚZK", and the tiles were asked of ČÚZK all over the world).
const CZ_RINGS = STATES?.cesko || [];
const czBounds = () => (CZ_RINGS.length ? { bounds: boundsOf(CZ_RINGS) } : {});
const CzWms = CZ_RINGS.length ? keptInside(L.TileLayer.WMS, CZ_RINGS) : L.TileLayer.WMS;
const cuzkOrtho = () => new CzWms("https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", {
  layers: "0", format: "image/jpeg", maxZoom: 21, attribution: "ortofoto © ČÚZK", ...czBounds(),
});
// The DMVS answers WMS 1.3.0 only (since 11/2026; Leaflet asks 1.1.1 by default).
const dmvsWms = (layer, opts = {}) => new CzWms(`${DMVS}/${layer}`, {
  layers: layer, format: "image/png", version: "1.3.0", transparent: true, maxZoom: 21, tileSize: 512, zoomOffset: -1,
  attribution: "technická mapa © kraje, IS DMVS ČÚZK", ...czBounds(), ...opts,
});
// The box of a city from its boundary, its rings with it (its credit only where the view reaches the city): its layers
// load tiles only there.
const within = (id) => (TOWN_BOUNDS?.[id]?.length ? { bounds: boundsOf(TOWN_BOUNDS[id]) } : {});
const kinds = { map: [osmLayer()], ortho: [cuzkOrtho()], tech: [osmLayer(0.5), dmvsWms("dtm_zps_plochy_bar", { minZoom: 16, transparent: false })], lines: [dmvsWms("dtm_zps_linie_body", { minZoom: 17, opacity: 0.9 })] };
// Prague: IPR's pre-rendered map in Web Mercator on ArcGIS Online (fast, a CDN) and the lines of its technical map.
kinds.map.push(L.tileLayer("https://tiles.arcgis.com/tiles/SBTXIEUGWbqzUecw/arcgis/rest/services/MTVU_WGS84/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 21, maxNativeZoom: 20, attribution: "mapa © IPR Praha", ...within("praha"),
}));
kinds.lines.push(new ArcgisExport("", {
  service: `${GS}/arcgis/rest/services/dtmp/dtmp/MapServer`, layers: "show:9,10,14",
  maxZoom: 21, minZoom: 16, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © IPR Praha", ...within("praha"),
}));
// Brno: the city's map of surfaces (MTVU) from 1 : 5 000 and its 2025 orthophoto (tiles in Web Mercator).
kinds.map.push(new ArcgisExport("", { service: "https://gis.brno.cz/ags3/rest/services/PUBLIC/ted_MTVU_plochy_povrch/MapServer", minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "mapa © Statutární město Brno", ...within("brno") }));
kinds.ortho.push(L.tileLayer("https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 21, maxNativeZoom: 21, attribution: "ortofoto 2025 © Statutární město Brno", ...within("brno"),
}));
// Slovakia: the ZBGIS orthophoto of ÚGKK SR (tiles in Web Mercator to level 19), only there (states.json).
if (STATES?.slovensko) {
  const Sk = keptInside(L.TileLayer, STATES.slovensko);
  kinds.ortho.push(new Sk(`${SK_ORTHO}/tile/{z}/{y}/{x}`, {
    maxZoom: 21, maxNativeZoom: 19, attribution: "ortofoto © GKÚ Bratislava, NLC (ZBGIS)", bounds: boundsOf(STATES.slovensko),
  }));
}
// Austria: basemap.at's orthophoto (Web Mercator to level 20), only there (states.json; its box covers Bratislava).
if (STATES?.austria) {
  const At = keptInside(L.TileLayer, STATES.austria);
  kinds.ortho.push(new At(`${AT_ORTHO}/{z}/{y}/{x}.jpeg`, {
    // Level 20 only in some towns: 19 everywhere (zoomed in beyond it).
    maxZoom: 21, maxNativeZoom: 19, attribution: "ortofoto © basemap.at", bounds: boundsOf(STATES.austria),
  }));
}
// Switzerland and Liechtenstein: swisstopo's SWISSIMAGE (WMTS {z}/{x}/{y}, Web Mercator to level 20), only there.
if (STATES?.switzerland) {
  const pts = [...STATES.switzerland, ...(STATES.liechtenstein || [])].flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  // Beyond the border swisstopo answers with a coarse satellite image (Vorarlberg, the hostile review): a tile whose
  // corners and centre all lie outside Switzerland and Liechtenstein is left empty, so basemap.at or a Land shows.
  const swiss = [boxedPlace("CH", STATES.switzerland), ...(STATES.liechtenstein ? [boxedPlace("LI", STATES.liechtenstein)] : [])];
  const ChOrtho = L.TileLayer.extend({
    getTileUrl(coords) {
      const size = this.getTileSize();
      const inside = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => {
        const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
        return withinPlace(swiss, q.lat, q.lng);
      });
      return inside ? L.TileLayer.prototype.getTileUrl.call(this, coords) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    },
  });
  kinds.ortho.push(new ChOrtho(`${CH_ORTHO}/{z}/{x}/{y}.jpeg`, {
    maxZoom: 21, maxNativeZoom: 20, attribution: creditText("common.orthophotoSwissimageSwisstopo"),
    bounds: L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]),
  }));
}
// The Netherlands: PDOK's Luchtfoto (Actueel_orthoHR, 8 cm, WMTS {z}/{x}/{y} in Web Mercator to level 21), only there:
// beyond the border PDOK answers with a blank tile, so a tile wholly outside the Netherlands is left empty.
if (STATES?.netherlands) {
  const pts = STATES.netherlands.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const dutch = [boxedPlace("NL", STATES.netherlands)];
  const NlOrtho = L.TileLayer.extend({
    getTileUrl(coords) {
      const size = this.getTileSize();
      const inside = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => {
        const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
        return withinPlace(dutch, q.lat, q.lng);
      });
      return inside ? L.TileLayer.prototype.getTileUrl.call(this, coords) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    },
  });
  kinds.ortho.push(new NlOrtho(`${NL_ORTHO}/{z}/{x}/{y}.jpeg`, {
    maxZoom: 21, maxNativeZoom: 21, attribution: creditText("common.orthophotoBeeldmateriaalNlPdok"),
    bounds: L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]),
  }));
}
// Belgium: Flanders' orthophoto (it covers Brussels) over Wallonia's (each a WMS / ArcGIS export in Web Mercator), only
// inside Belgium; Luxembourg: the ACT's tiles ({z}/{x}/{y}), only inside Luxembourg.
const insideOnly = (places) => L.TileLayer.extend({
  getTileUrl(coords) {
    const size = this.getTileSize();
    const at = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => {
      const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      return withinPlace(places, q.lat, q.lng);
    });
    const inside = at.some(Boolean);
    if (!inside) return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    if (!this.options.bboxUrl) return L.TileLayer.prototype.getTileUrl.call(this, coords);
    const nw = this._map.options.crs.project(this._map.unproject([coords.x * size.x, coords.y * size.y], coords.z));
    const se = this._map.options.crs.project(this._map.unproject([(coords.x + 1) * size.x, (coords.y + 1) * size.y], coords.z));
    return this.options.bboxUrl([nw.x, se.y, se.x, nw.y], size.x, size.y, at.every(Boolean));
  },
});
// One more try of a tile that failed (a server that answers 504 now and then: GURS), after a pause, then it stays empty.
const retryOnce = (layer, ms = 2500) => layer.on("tileerror", ({ tile }) => {
  if (tile.dataset.retried || !tile.src || tile.src.startsWith("data:")) return;
  tile.dataset.retried = "1";
  const src = tile.src;
  setTimeout(() => { tile.src = `${src}${src.includes("?") ? "&" : "?"}retry=1`; }, ms);
});
// Luxembourg first, Belgium's regions over it (each answers transparent or nothing outside itself; the hostile review:
// a white tile of one hid its neighbour). Each region's layer asks only for tiles over that region
// (regions-be.json, loaded once).
if (STATES?.luxembourg) {
  const Lu = insideOnly([boxedPlace("LU", STATES.luxembourg)]);
  kinds.ortho.push(new Lu(`${LU_ORTHO}/{z}/{x}/{y}.jpeg`, { maxZoom: 21, maxNativeZoom: 21, attribution: creditText("common.orthophotoActLuxembourgGeoportail"), bounds: boundsOf(STATES.luxembourg) }));
}
if (STATES?.belgium) {
  const reg = await fetch(new URL("../regions-be.json", import.meta.url)).then((r) => r.json()).catch(() => null);
  const add = (codes, url, credit) => {
    const places = reg ? codes.map((c) => boxedPlace(`BE-${c}`, reg[c])) : [boxedPlace("BE", STATES.belgium)];
    const R = insideOnly(places);
    kinds.ortho.push(new R("", { bboxUrl: url, maxZoom: 21, attribution: creditText(credit), bounds: boundsOf(reg ? codes.flatMap((c) => reg[c]) : STATES.belgium) }));
  };
  add(["wal"], (b, w, h) => BE_ORTHO.wal.url(b, w, h, "image/png"), "credits.orthophotoSpwServicePublic");
  add(["vl", "bru"], (b, w, h) => BE_ORTHO.vl.url(b, w, h, "image/png"), "credits.orthophotoBronLuchtopnamenDigitaal");
}
// Poland: GUGiK's orthophoto (WMS in Web Mercator), only for tiles over Poland, transparent where it has no photo (it has
// some up to about 1 km beyond the border, so at the border its tiles cover the Czech ones there: the hostile review).
if (STATES?.poland) {
  const Pl = insideOnly([boxedPlace("PL", STATES.poland)]);
  kinds.ortho.push(new Pl("", { bboxUrl: (b, w, h) => `${PL_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: creditText("common.orthophotoGugikGeoportalGov"), bounds: boundsOf(STATES.poland) }));
}
// France: IGN's orthophoto (WMS in Web Mercator), only inside France (the service is white beyond it).
if (STATES?.france) {
  const Fr = insideOnly([boxedPlace("FR", STATES.france)]);
  kinds.ortho.push(new Fr("", { bboxUrl: (b, w, h) => `${FR_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: creditText("common.orthophotoIgnGeoplateforme"), bounds: boundsOf(STATES.france) }));
}
// Cyprus: the DLS orthophoto of 2019 (tiles), only over the area of the Republic and the British bases.
if (STATES?.cyprus) {
  const Cy = insideOnly([boxedPlace("CY", STATES.cyprus)]);
  kinds.ortho.push(new Cy(`${CY_ORTHO}/{z}/{y}/{x}`, { maxZoom: 21, maxNativeZoom: 21, attribution: creditText("common.orthophotoDlsCyprus"), bounds: boundsOf(STATES.cyprus) }));
}
// Italy: the open orthophotos, each only over its own box and inside Italy's covered area.
if (STATES?.italy) {
  const It = insideOnly([boxedPlace("IT", STATES.italy)]);
  for (const o of Object.values(IT_ORTHO)) {
    const [x0, y0, x1, y1] = o.box;
    kinds.ortho.push(new It("", { bboxUrl: (b, w, h) => `${o.url(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: o.who ? lead(W("orthophoto"), o.who) : creditText(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) }));
  }
}
// Estonia: the Board's orthophoto tiles (TMS: the y axis flipped), only over Estonia (dark beyond).
if (STATES?.estonia) {
  const Ee = insideOnly([boxedPlace("EE", STATES.estonia)]);
  kinds.ortho.push(new Ee(`${EE_ORTHO}/{z}/{x}/{y}.jpg`, { tms: true, maxZoom: 21, maxNativeZoom: 18, attribution: creditText("common.orthophotoMaaJaRuumiamet"), bounds: boundsOf(STATES.estonia) }));
}
// Slovenia: GURS's orthophoto DOF025 (WMS in Web Mercator), only over Slovenia (beyond it the server hangs and gives 504).
if (STATES?.slovenia) {
  const Si = insideOnly([boxedPlace("SI", STATES.slovenia)]);
  // The review of 24. 11. 2026 (RECENZE-SI 3): a tile of z9 over the whole state and some of z18 were 504 after 30 s, so the
  // layer starts at z14 (below it the other basemaps), a tile wholly inside Slovenia is a JPEG (PNG takes GURS twice as
  // long; transparent only at the border) and a failed tile is asked once more.
  kinds.ortho.push(retryOnce(new Si("", { bboxUrl: (b, w, h, inside) => inside ? SI_ORTHO(b, w, h) : `${SI_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, minZoom: 14, maxZoom: 21, attribution: creditText("app.orthophotoDof025GeodetskaUprava"), bounds: boundsOf(STATES.slovenia) })));
}
// Finland: the towns' own orthophotos (lanes-ortho.js FI_ORTHO: Helsinki, Espoo, Turku), each only over its town's box
// and inside Finland (none elsewhere: the national one needs a personal key).
if (STATES?.finland) {
  const Fi = insideOnly([boxedPlace("FI", STATES.finland)]);
  for (const o of Object.values(FI_ORTHO).reverse()) {
    const [x0, y0, x1, y1] = o.box;
    kinds.ortho.push(new Fi("", { bboxUrl: (b, w, h) => o.url(b, w, h, "image/png"), maxZoom: 21, attribution: creditText(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) }));
  }
}
// Denmark: GeoDanmark's spring orthophoto through Dataforsyningen (WMTS, lanes-ortho.js DK_ORTHO), only over Denmark and
// only with the app's token (keys.js; without it no layer, the map keeps the others).
if (STATES?.denmark && dkToken()) {
  const Dk = insideOnly([boxedPlace("DK", STATES.denmark)]);
  kinds.ortho.push(new Dk(DK_ORTHO("{z}", "{x}", "{y}"), { maxZoom: 21, maxNativeZoom: 20, attribution: creditText("common.orthophotoIndeholderDataFra"), bounds: boundsOf(STATES.denmark) }));
}
// Malta: the Planning Authority's orthophoto of 2018 (in degrees: lanes-ortho.js MT_ORTHO), only over Malta; a JPEG
// inside the islands, a transparent PNG only on a tile across the coast (as Slovenia; the review of Malta).
if (STATES?.malta) {
  const Mt = insideOnly([boxedPlace("MT", STATES.malta)]);
  kinds.ortho.push(new Mt("", { bboxUrl: (b, w, h, inside) => (inside ? MT_ORTHO(b, w, h) : `${MT_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`), maxZoom: 21, attribution: creditText("app.orthophotoPlanningAuthorityMalta"), bounds: boundsOf(STATES.malta) }));
}
// Monaco: IGN's orthophoto covers it too.
if (STATES?.monaco) {
  const Mc = insideOnly([boxedPlace("MC", STATES.monaco)]);
  kinds.ortho.push(new Mc("", { bboxUrl: (b, w, h) => `${FR_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: creditText("common.orthophotoIgnGeoplateforme"), bounds: boundsOf(STATES.monaco) }));
}
if (STATES?.spain) {
  // Not over Melilla (PNOA's image there is Airbus's under a licence not cleared; Bára 23. 11. 2026, lanes-ortho.js
  // ES_NOT_PNOA): its ring left out of the area drawn.
  const notPnoa = (r) => ES_NOT_PNOA.some(([x0, y0, x1, y1]) => r.every(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1));
  const Es = insideOnly([boxedPlace("ES", STATES.spain.filter((r) => !notPnoa(r)))]);
  kinds.ortho.push(new Es("", { bboxUrl: (b, w, h) => `${ES_ORTHO(b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: creditText("common.pnoaOrthophotoIgnCc"), bounds: boundsOf(STATES.spain) }));
}
// Portugal: DGT's flight of 2025 (the whole mainland; the review of 23. 11. 2026: three stacked layers tripled the
// requests), only over the mainland (Madeira and the Azores have no DGT photo).
if (STATES?.portugal) {
  const Pt = insideOnly([boxedPlace("PT", STATES.portugal)]);
  const [x0, y0, x1, y1] = PT_MAINLAND;
  kinds.ortho.push(new Pt("", { bboxUrl: (b, w, h) => `${PT_ORTHO["pt-25"](b, w, h, "image/png")}&TRANSPARENT=TRUE`, maxZoom: 21, attribution: creditText("common.orthophotoDgt"), bounds: [[y0, x0], [y1, x1]] }));
}
// Germany: the orthophoto of each Land (lanes-ortho.js DE_ORTHO), a tile from the WMS of the Land its centre lies in
// (laender.json, loaded when the first tile in Germany is drawn).
if (STATES?.germany) {
  const pts = STATES.germany.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const DeOrtho = L.GridLayer.extend({
    createTile(coords, done) {
      const size = this.getTileSize(), R = 6378137, span = (2 * Math.PI * R) / 2 ** coords.z;
      const x0 = coords.x * span - Math.PI * R, y1 = Math.PI * R - coords.y * span, b = [x0, y1 - span, x0 + span, y1];
      const c = this._map.unproject([(coords.x + 0.5) * size.x, (coords.y + 0.5) * size.y], coords.z);
      // Near a border (more than one Land within about 2 km) the Länder's images stacked as transparent PNGs, the Land
      // of the tile's centre on top (the review: white halves in Mainz/Wiesbaden, Ulm/Neu-Ulm).
      // Leaflet's .leaflet-tile is absolute (the images' box too): an inline "relative" stacked the tiles down the page.
      const tile = document.createElement("div");
      // A tile not wholly in one Land (a corner in another Land or outside Germany, the Czech border: Varnsdorf, Aš)
      // asks transparent PNGs, so the orthophoto beneath shows where the Land's WMS has none (the review of the port).
      const corner = (fx, fy) => this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      Promise.all([landsAt(c.lng, c.lat), ...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => { const q = corner(fx, fy); return landAt(q.lng, q.lat); })]).then(([lands, ...corners]) => {
        const wms = [...new Map(lands.map((l) => [DE_ORTHO[l].wms, l])).values()];
        if (!wms.length) return done(null, tile);
        const clear = wms.length > 1 || corners.some((l) => l !== lands[0]);
        let left = wms.length;
        for (const land of [...wms].reverse()) {
          const im = document.createElement("img");
          im.alt = "";
          Object.assign(im.style, { position: "absolute", left: 0, top: 0, width: `${size.x}px`, height: `${size.y}px` });
          im.onload = im.onerror = () => { if (--left === 0) done(null, tile); };
          im.src = clear ? deWmsUrl(DE_ORTHO[land], b, size.x, size.y, "image/png", { transparent: "TRUE" }) : deWmsUrl(DE_ORTHO[land], b, size.x, size.y);
          tile.appendChild(im);
        }
      }, () => done(null, tile));
      return tile;
    },
  });
  kinds.ortho.push(new DeOrtho({ maxZoom: 21, minZoom: 12, attribution: creditText("app.orthophotoGermanLanderGeobasis"),
    bounds: Object.assign(L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]), { rings: STATES.germany }) }));
}
// The towns (towns/<id>.js maps): their orthophoto, technical map and lines, each kept to the town.
for (const [id, t] of Object.entries(TOWNS)) {
  if (!t.maps || t.national) continue;
  const m = t.maps({ L, ArcgisExport, BIG_TILES: { ...BIG_TILES, ...within(id) }, osm: () => null, cuzk: () => null });
  for (const [name, layers] of Object.entries(m.base)) {
    const kind = /^Ortofoto (?!ČÚZK)/.test(name) ? "ortho" : /Technická|Účelová/.test(name) ? "tech" : /^Mapa/.test(name) ? "map" : null;
    if (kind) kinds[kind].push(...layers.filter(Boolean));
  }
  if (m.lines) kinds.lines.push(m.lines);
}
// A city's layer credits its city only while the map shows that city (Leaflet would list every layer of the
// group): its attribution is kept aside and added or removed as the view moves.
const cityCredited = Object.values(kinds).flat().filter((l) => l.options?.bounds && l.options.attribution);
for (const l of cityCredited) { l.options.cityAttribution = l.options.attribution; delete l.options.attribution; }
const credited = new Set();
// Does the view reach the area of these rings ([lon, lat]): a point of them in the view, or a corner or the middle of
// the view inside them. Without rings (a city's box): yes.
function reaches(rings, view) {
  if (!rings?.length) return true;
  const inside = (x, y) => { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  if (rings.some((r) => r.some(([x, y]) => view.contains([y, x])))) return true;
  const c = view.getCenter();
  return [view.getSouthWest(), view.getNorthEast(), view.getNorthWest(), view.getSouthEast(), c].some((p) => inside(p.lng, p.lat));
}
function creditCities() {
  const view = map.getBounds(), want = new Set();
  for (const l of cityCredited) if (map.hasLayer(l) && L.latLngBounds(l.options.bounds).intersects(view) && reaches(l.options.bounds.rings, view)) want.add(l.options.cityAttribution);
  for (const a of credited) if (!want.has(a)) { map.attributionControl.removeAttribution(a); credited.delete(a); }
  for (const a of want) if (!credited.has(a)) { map.attributionControl.addAttribution(a); credited.add(a); }
}
map.on("moveend layeradd layerremove", creditCities);
// North America, when the map or a cut is there (late.js): the cities' orthophotos (lanes-ortho.js US_ORTHO, CA_ORTHO), each
// only over its city (towns-us.json, towns-ca.json).
onAmerica((towns) => {
  for (const o of [...Object.values(US_ORTHO), ...Object.values(CA_ORTHO)]) if (towns[o.town]) {
    const Own = insideOnly([boxedPlace(o.town, towns[o.town])]);
    const [x0, y0, x1, y1] = o.box;
    // (A tile cache of its own as tiles {z}/{y}/{x}: MassGIS's.)
    const layer = o.tiles ? new Own(`${o.tiles}/{z}/{y}/{x}`, { maxZoom: 21, maxNativeZoom: o.z, cityAttribution: creditText(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) })
      : new Own("", { bboxUrl: (b, w, h) => o.url(b, w, h, "image/png"), maxZoom: 21, cityAttribution: creditText(o.credit), bounds: L.latLngBounds([y0, x0], [y1, x1]) });
    cityCredited.push(layer);
    baseMaps[tr("app.orthophoto")].addLayer(layer);
  }
  creditCities();
});
const lateMap = () => { const c = map.getCenter(); if (isLate(c.lat, c.lng)) ensurePlace(c.lat, c.lng).catch((err) => console.warn("America", err)); };
map.on("moveend", lateMap);
const baseMaps = { [tr("app.map")]: L.layerGroup(kinds.map), [tr("app.orthophoto")]: L.layerGroup(kinds.ortho), [tr("app.surfaceMap")]: L.layerGroup(kinds.tech), "OpenStreetMap": osmLayer() };
const BASE_KEY = "streetdesign-basemap-cr";
// Remembered by its key (OpenStreetMap by its name), so that the choice holds in any language.
const baseCs = Object.fromEntries([mark("app.map"), mark("app.orthophoto"), mark("app.surfaceMap"), "OpenStreetMap"].map((k) => [tr(k), k]));
let baseName = tr("app.map");
// A Czech name remembered before the keys (and "Technická mapa", "Mapa povrchů" since 17. 11.): locales/legacy-cs-keys.json.
try { const saved = tr(localStorage.getItem(BASE_KEY) || ""); if (baseMaps[saved]) baseName = saved; } catch {}
baseMaps[baseName].addTo(map);
map.on("baselayerchange", (e) => { try { localStorage.setItem(BASE_KEY, baseCs[e.name] || e.name); } catch {} });
const dtm = L.layerGroup(kinds.lines);
export const mtvuLayer = L.layerGroup();
export const layersControl = L.control.layers(baseMaps, { [tr("app.surfaceMapLines")]: dtm, [tr("app.surfacesCut")]: mtvuLayer }).addTo(map);
document.querySelector(".leaflet-control-layers-toggle")?.setAttribute("title", tr("app.baseMapLayers"));
document.querySelector(".leaflet-control-layers-toggle")?.setAttribute("aria-label", tr("app.baseMapLayers"));
mtvuLayer.addTo(map);
// The other data of the cut (parking, points, lines, tracks, axes, buildings) as overlays (maplayers.js).
export const dataLayers = createDataLayers(map, layersControl);
