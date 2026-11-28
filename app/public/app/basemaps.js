// The base maps and their layers (the states' orthophotos, the cities' maps), the layer control, and the data layers of the cut.
import { keptInside, boundsOf, orthoLayers } from "./ortho-layers.js";
import { TOWNS } from "../towns/index.js";
import { ensurePlace, isLate, onAmerica } from "../late.js";
import { createDataLayers } from "../maplayers.js";
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
// Czechia's rings (states.json): ČÚZK's orthophoto and the DMVS load tiles and credit themselves only there
// (Bára 26. 11. 2026: San Francisco said "ortofoto © ČÚZK", and the tiles were asked of ČÚZK all over the world).
const CZ_RINGS = STATES?.cesko || [];
const czBounds = () => (CZ_RINGS.length ? { bounds: boundsOf(CZ_RINGS) } : {});
const CzWms = CZ_RINGS.length ? keptInside(L.TileLayer.WMS, CZ_RINGS) : L.TileLayer.WMS;
// The DMVS answers WMS 1.3.0 only (since 11/2026; Leaflet asks 1.1.1 by default).
const dmvsWms = (layer, opts = {}) => new CzWms(`${DMVS}/${layer}`, {
  layers: layer, format: "image/png", version: "1.3.0", transparent: true, maxZoom: 21, tileSize: 512, zoomOffset: -1,
  attribution: "technická mapa © kraje, IS DMVS ČÚZK", ...czBounds(), ...opts,
});
// The box of a city from its boundary, its rings with it (its credit only where the view reaches the city): its layers
// load tiles only there.
const within = (id) => (TOWN_BOUNDS?.[id]?.length ? { bounds: boundsOf(TOWN_BOUNDS[id]) } : {});
const kinds = { map: [osmLayer()], ortho: [], tech: [osmLayer(0.5), dmvsWms("dtm_zps_plochy_bar", { minZoom: 16, transparent: false })], lines: [dmvsWms("dtm_zps_linie_body", { minZoom: 17, opacity: 0.9 })] };
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
// The orthophotos of the registry (ortho/sources/<state>.js, app/ortho-layers.js): ČÚZK's, Brno's and the states', each only over its area.
kinds.ortho.push(...await orthoLayers({ STATES, TOWN_BOUNDS }));
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
// North America, when the map or a cut is there (late.js): the cities' orthophotos of the registry (ortho/sources/us.js, ca.js), each
// only over its city (towns-us.json, towns-ca.json).
onAmerica(async (towns) => {
  for (const layer of await orthoLayers({ STATES, TOWN_BOUNDS, towns }, true)) {
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
