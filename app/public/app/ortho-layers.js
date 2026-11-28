// The map's layers of the orthophotos (docs/code-health-plan.md step 15): one layer for each record of the registry that has a `map`
// (ortho/registry.js MAP_LAYERS, ortho/sources/<state>.js), built by its kind (tiles, bbox, wms, lands) and kept to its area by its
// `limit`; no condition on a source or a state. A layer of the registry's order is drawn above the one before it.
//   map.kind   tiles (an XYZ template of the service), bbox (a service asked by the box of a tile, a JPEG inside the area, else a
//              transparent PNG), wms (Leaflet's own WMS layer), lands (Germany's: the WMS of the Land a tile's centre lies in)
//   map.limit  own (Germany's: its tiles are asked by the Land of their centre, laender.json), kept (a tile wholly beyond the area's rings is blank and not asked), inside (the same by the area's places, with the
//              tile's five points), none
//   map.state / states  the key of the area in states.json (the first must be there, or there is no layer); map.town  a city's
//              boundary (towns.json; late: a North American city's, towns-us.json, with the cut there); map.regions  Belgium's regions
//   map.bounds rings (the area's own, so that its credit shows only where the view reaches it: creditCities), box (the record's box),
//              extent (the points' box of all its states, no rings); map.always  a layer without its area's rings (ČÚZK, Brno)
//   map.format png (the box asked as a PNG), suffix (added to it), jpegInside (a tile wholly inside is a JPEG), retry (a failed tile once
//              more), minZoom, maxNativeZoom, tms, attribution (its own words; else the credit of the record)
import { MAP_LAYERS, urlOf, landAt, landsAt } from "../lanes-ortho.js";
import { tileTemplate } from "../ortho/service.js";
import { orthoCredit } from "../ortho/credit.js";
import { boxed as boxedPlace, within as withinPlace, inside } from "../places.js";

// A blank tile: what a layer kept to its area draws beyond it (nothing is asked of its server there).
const BLANK_TILE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// Does the tile reach the area's rings: a corner or its middle inside them, or a vertex of them inside the tile (a tile
// across the border at a low zoom).
function tileReaches(layer, coords, rings) {
  const size = layer.getTileSize(), at = (fx, fy) => layer._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
  const nw = at(0, 0), se = at(1, 1);
  if ([[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].some(([fx, fy]) => { const q = at(fx, fy); return inside(rings, q.lng, q.lat); })) return true;
  return rings.some((r) => r.some(([x, y]) => x >= nw.lng && x <= se.lng && y >= se.lat && y <= nw.lat));
}
// A layer class of a state's (or a city's) own service kept to its area: a tile wholly beyond it is blank and not asked
// (Bára 26. 11. 2026: ČÚZK only over Czechia, whose box reaches into Germany, Austria and Poland). Its credit goes by
// the rings too (boundsOf, creditCities).
export const keptInside = (Base, rings) => Base.extend({
  getTileUrl(coords) { return tileReaches(this, coords, rings) ? Base.prototype.getTileUrl.call(this, coords) : BLANK_TILE; },
});
// The box of a state's or region's rings ([lon, lat]); the rings stay with it, so that its credit shows only where the
// view reaches the area itself, not just its box (Poland's box covers Prague: creditCities).
export const boundsOf = (rings) => { const pts = rings.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const b = L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]); b.rings = rings; return b; };
// A layer class for a state's service that answers a blank or a white image beyond its border: a tile none of whose five points
// (the middle and the corners) lies in one of the places is left empty; a service asked by the box of the tile (bboxUrl) is asked so.
const insideOnly = (places) => L.TileLayer.extend({
  getTileUrl(coords) {
    const size = this.getTileSize();
    const at = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => {
      const q = this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      return withinPlace(places, q.lat, q.lng);
    });
    const inside = at.some(Boolean);
    if (!inside) return BLANK_TILE;
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

const inBox = ([x0, y0, x1, y1], x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const extentOf = (rings) => { const pts = rings.flat(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); return L.latLngBounds([Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]); };
// What a layer is kept to: the rings of its area, the places of them for `inside`, and its bounds; null where its area is not known.
function areaOf(entry, m, ctx, regions) {
  const names = m.states ?? [m.state];
  let rings, places;
  if (m.town) rings = (m.late ? ctx.towns?.[m.town] : ctx.TOWN_BOUNDS?.[m.town]) ?? null;
  else rings = names.flatMap((n) => ctx.STATES?.[n] || []);
  if (!m.always && !(m.town ? rings : ctx.STATES?.[names[0]])) return null;
  const owned = rings ?? [], except = entry.area?.except;
  const kept = except ? owned.filter((r) => !except.some((b) => r.every(([x, y]) => inBox(b, x, y)))) : owned;
  if (m.regions) {
    // Belgium's regions: each layer asks only for tiles over its regions (regions-be.json), else over the whole state.
    places = regions ? m.regions.map((c) => boxedPlace(`BE-${c}`, regions[c])) : [boxedPlace(names[0], owned)];
    rings = regions ? m.regions.flatMap((c) => regions[c]) : owned;
  } else if (m.states) places = names.filter((n) => ctx.STATES?.[n]).map((n) => boxedPlace(n, ctx.STATES[n]));
  else places = [boxedPlace(m.town ?? names[0], kept)];
  const b = entry.area?.box;
  const bounds = m.bounds === "box" ? L.latLngBounds([b[1], b[0]], [b[3], b[2]]) : m.bounds === "extent" ? extentOf(owned) : rings?.length ? boundsOf(rings) : null;
  return { rings: m.regions ? rings : owned, places, bounds };
}
const LIMITS = {
  kept: (Base, area) => keptInside(Base, area.rings),
  inside: (Base, area) => insideOnly(area.places),
  none: (Base) => Base,
};
// The URL of a box of the service: a PNG (transparent beyond the photo) with the suffix; a tile wholly inside the area a JPEG.
const bboxUrlOf = (entry, m) => {
  const png = (b, w, h) => `${urlOf(entry.service, b, w, h, "image/png")}${m.suffix ?? ""}`;
  return m.jpegInside ? (b, w, h, inside) => (inside ? urlOf(entry.service, b, w, h) : png(b, w, h)) : png;
};
const optionsOf = (entry, m, area) => ({
  maxZoom: m.maxZoom ?? 21, ...(m.minZoom && { minZoom: m.minZoom }), ...(m.maxNativeZoom && { maxNativeZoom: m.maxNativeZoom }), ...(m.tms && { tms: true }),
  [m.late ? "cityAttribution" : "attribution"]: m.attribution ?? orthoCredit(entry, true), ...(area.bounds && { bounds: area.bounds }),
});
const KINDS = {
  tiles: (entry, m, area) => new (LIMITS[m.limit](L.TileLayer, area))(tileTemplate(entry.service), optionsOf(entry, m, area)),
  bbox: (entry, m, area) => {
    const layer = new (LIMITS[m.limit](L.TileLayer, area))("", { bboxUrl: bboxUrlOf(entry, m), ...optionsOf(entry, m, area) });
    return m.retry ? retryOnce(layer) : layer;
  },
  wms: (entry, m, area) => new (area.rings.length ? LIMITS[m.limit](L.TileLayer.WMS, area) : L.TileLayer.WMS)(entry.service.base, { layers: entry.service.layers, format: m.format, ...optionsOf(entry, m, area) }),
  lands: (entry, m, area) => landsLayer(entry, m, area),
};
// Germany: the orthophoto of each Land, a tile from the WMS of the Land its centre lies in (laender.json, loaded when the first tile
// in Germany is drawn). Near a border (more than one Land within about 2 km) the Länder's images stacked as transparent PNGs, the
// Land of the tile's centre on top (the review: white halves in Mainz/Wiesbaden, Ulm/Neu-Ulm).
function landsLayer(entry, m, area) {
  const lands = Object.fromEntries(entry.members.map((s) => [s.land, s]));
  const Lands = L.GridLayer.extend({
    createTile(coords, done) {
      const size = this.getTileSize(), R = 6378137, span = (2 * Math.PI * R) / 2 ** coords.z;
      const x0 = coords.x * span - Math.PI * R, y1 = Math.PI * R - coords.y * span, b = [x0, y1 - span, x0 + span, y1];
      const c = this._map.unproject([(coords.x + 0.5) * size.x, (coords.y + 0.5) * size.y], coords.z);
      // Leaflet's .leaflet-tile is absolute (the images' box too): an inline "relative" stacked the tiles down the page.
      const tile = document.createElement("div");
      // A tile not wholly in one Land (a corner in another Land or outside Germany, the Czech border: Varnsdorf, Aš) asks transparent
      // PNGs, so the orthophoto beneath shows where the Land's WMS has none (the review of the port).
      const corner = (fx, fy) => this._map.unproject([(coords.x + fx) * size.x, (coords.y + fy) * size.y], coords.z);
      Promise.all([landsAt(c.lng, c.lat), ...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => { const q = corner(fx, fy); return landAt(q.lng, q.lat); })]).then(([here, ...corners]) => {
        const services = [...new Map(here.map((l) => [lands[l].service.base, l])).values()];
        if (!services.length) return done(null, tile);
        const clear = services.length > 1 || corners.some((l) => l !== here[0]);
        let left = services.length;
        for (const land of [...services].reverse()) {
          const im = document.createElement("img");
          im.alt = "";
          Object.assign(im.style, { position: "absolute", left: 0, top: 0, width: `${size.x}px`, height: `${size.y}px` });
          im.onload = im.onerror = () => { if (--left === 0) done(null, tile); };
          im.src = clear ? urlOf(lands[land].service, b, size.x, size.y, "image/png", { transparent: "TRUE" }) : urlOf(lands[land].service, b, size.x, size.y);
          tile.appendChild(im);
        }
      }, () => done(null, tile));
      return tile;
    },
  });
  return new Lands({ maxZoom: 21, minZoom: m.minZoom, attribution: orthoCredit(entry, true), bounds: area.bounds });
}
// The layers of the registry whose area the map knows (ctx: STATES, TOWN_BOUNDS, and towns for the late ones, the cities of North America
// with a cut there); `late` the ones that wait for them or the ones that do not.
export async function orthoLayers(ctx, late = false) {
  const out = [];
  let regions;
  for (const entry of MAP_LAYERS) {
    const m = entry.map;
    if (!!m.late !== late || (entry.key && !entry.key())) continue;
    if (m.regions && regions === undefined) regions = ctx.STATES?.belgium ? await fetch(new URL("../regions-be.json", import.meta.url)).then((r) => r.json()).catch(() => null) : null;
    const area = areaOf(entry, m, ctx, regions);
    if (area) out.push(KINDS[m.kind](entry, m, area));
  }
  return out;
}
