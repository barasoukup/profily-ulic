// What the orthophoto code does at a set of places, as plain data (docs/code-health-plan.md step 15): whether there is an
// orthophoto, which URLs laneImage and orthoPatch ask in which order, and the layers of the base map (their order, URLs,
// credits, bounds and the URL each asks for a tile). Taken from any copy of app/public, so that the registry's code and the
// code before it can be compared (tests/ortho-registry.test.js against tests/fixtures/ortho-points.json).
import { register } from "node:module";
import fs from "node:fs";

// About 70 places in every state with an orthophoto and on the edges: borders, Bolzano and Lombardy, Bornholm, DC and
// its neighbour, Toronto, Madeira (no orthophoto), Melilla, Helsinki / Espoo (two boxes), Monaco.
export const POINTS = [
  ["Praha", 14.4378, 50.0755], ["Brno", 16.6068, 49.1951], ["Plzeň", 13.3776, 49.7384], ["Jihlava", 15.5871, 49.3961], ["Aš", 12.1947, 50.2236],
  ["Varnsdorf", 14.6165, 50.9112], ["Ostrava", 18.2625, 49.8209], ["Bratislava", 17.1077, 48.1486], ["Košice", 21.2611, 48.7164],
  ["Wien", 16.3738, 48.2082], ["Salzburg", 13.055, 47.8095], ["Berlin", 13.405, 52.52], ["München", 11.582, 48.1351], ["Hamburg", 9.9937, 53.5511],
  ["Bremen", 8.8017, 53.0793], ["Frankfurt", 8.6821, 50.1109], ["Dresden", 13.7373, 51.0504], ["Aachen", 6.0839, 50.7753], ["Görlitz", 14.9872, 51.1528],
  ["Kehl", 7.8153, 48.5727], ["Zürich", 8.5417, 47.3769], ["Vaduz", 9.5209, 47.141], ["Basel", 7.5886, 47.5596], ["Konstanz", 9.1758, 47.6633],
  ["Amsterdam", 4.9041, 52.3676], ["Maastricht", 5.6909, 50.8514], ["Bruxelles", 4.3517, 50.8503], ["Antwerpen", 4.4025, 51.2194],
  ["Liège", 5.5797, 50.6326], ["Kortrijk", 3.2649, 50.828], ["Lille", 3.0573, 50.6292], ["Luxembourg", 6.1319, 49.6116], ["Warszawa", 21.0122, 52.2297],
  ["Kraków", 19.9449, 50.0647], ["Paris", 2.3522, 48.8566], ["Strasbourg", 7.7521, 48.5734], ["Monaco", 7.4246, 43.7384], ["Madrid", -3.7038, 40.4168],
  ["Melilla", -2.9381, 35.2923], ["Ceuta", -5.3162, 35.8894], ["Las Palmas", -15.4363, 28.1235], ["Lisboa", -9.1393, 38.7223], ["Porto", -8.6291, 41.1579],
  ["Funchal", -16.9084, 32.6669], ["Ponta Delgada", -25.67, 37.7412], ["Lefkosia", 33.3823, 35.1856], ["Valletta", 14.5146, 35.8989],
  ["Bologna", 11.3426, 44.4949], ["Modena", 10.9252, 44.6471], ["Torino", 7.6869, 45.0703], ["Bolzano", 11.3548, 46.4983], ["Roma", 12.4964, 41.9028],
  ["Ponte di Legno", 10.51, 46.26], ["Tallinn", 24.7536, 59.437], ["Ljubljana", 14.5058, 46.0569], ["Helsinki", 24.9384, 60.1699], ["Espoo", 24.805, 60.176],
  ["Helsinki/Espoo", 24.83, 60.2], ["Turku", 22.2666, 60.4518], ["Tampere", 23.7610, 61.4978], ["København", 12.5683, 55.6761], ["Rønne", 14.7, 55.1],
  ["Vilnius", 25.2797, 54.6872], ["Washington", -77.0365, 38.8977], ["Arlington", -77.0686, 38.8816], ["New York", -73.9857, 40.7484],
  ["Boston", -71.0578, 42.3603], ["Cambridge", -71.1097, 42.3736], ["San Francisco", -122.4194, 37.7749], ["Toronto", -79.3832, 43.6532],
  ["Mississauga", -79.6441, 43.589], ["London", -0.1278, 51.5074],
];
// The sources (countries' and cities' laneOrtho, and others the code is asked about).
export const SOURCES_ASKED = ["cuzk", "ipr", "brno", "plzen", "sk", "at", "at19", "ch", "nl", "be", "lu", "pl", "fr", "es", "pt", "it", "ee", "si", "mt", "cy", "dk", "fi", "us", "ca", "de",
  "none", "xx", "pt-25", "it-bo", "de-BW", "us-dc", "fi-hki", "be-vl", "mc", undefined, null];

// The sources asked as tiles (the others by the box of the image).
const TILED = ["sk", "at", "at19", "ch", "nl", "lu", "ee", "cy", "dk", "brno", "us", "us-ma"];
const frameAt = (lon, lat) => ({ toLonLat: (x, y) => [lon + x / (111320 * Math.cos((lat * Math.PI) / 180)), lat + y / 110540] });
// A canvas with real pixels, and a bitmap of the body's colour (as tests/ortho-tiles.test.js).
class Canvas {
  constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
  getContext() {
    return {
      drawImage: (bmp, x, y, w = bmp.width, h = bmp.height) => {
        for (let py = Math.max(0, Math.round(y)); py < Math.min(this.height, Math.round(y + h)); py++)
          for (let px = Math.max(0, Math.round(x)), o = (py * this.width + px) * 4; px < Math.min(this.width, Math.round(x + w)); px++, o += 4) { this.data[o] = bmp.rgb[0]; this.data[o + 1] = bmp.rgb[1]; this.data[o + 2] = bmp.rgb[2]; this.data[o + 3] = 255; }
      },
      getImageData: (x, y, w, h) => ({ width: w, height: h, data: this.data }),
    };
  }
}
const grey = () => new Response("120,118,115", { status: 200, headers: { "content-type": "image/jpeg" } });
const gone = () => new Response("", { status: 404 });
const short = (url) => String(url).replace(/^https?:\/\//, "");

// Every URL asked, in order, when nothing answers (404: every candidate of the source is tried) and when the first answers.
async function askAll(L, source, lon, lat, how) {
  const asked = [];
  const fetchImpl = async (url) => { asked.push(short(url)); return how === "none" ? gone() : grey(); };
  const old = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    const png = how === "png" ? { decode: async () => ({ width: 1, height: 1, rgba: new Uint8Array(4) }) } : {};
    const timeout = how === "timeout" ? { timeout: 3000 } : {};
    const out = await L.laneImage({ source, frame: frameAt(lon, lat), dir: [1, 0], t0: -12, t1: 12, fetchImpl, ...png, ...timeout }).then((o) => o?.source ?? null, (e) => `error:${e.message}`);
    const patch = await L.orthoPatch({ source, lon, lat, half: 12, px: 16, fetchImpl, ...timeout }).then((o) => o?.source ?? null, (e) => `error:${e.message}`);
    return { out, patch, asked };
  } finally { globalThis.fetch = old; }
}

// `full`: every source at every place in every way of asking; else only where the source has an orthophoto (orthoHereAt) in the ways that
// ask nothing more (404 everywhere, a PNG, a timeout), the first answering (the slow one: an image is read) at the first place of a source,
// elsewhere in the one way that asks all it would (404 everywhere).
export async function snapshotImages(pub, { full = false } = {}) {
  globalThis.OffscreenCanvas = Canvas;
  globalThis.createImageBitmap = async (blob) => ({ width: 256, height: 256, rgb: (await blob.text()).split(",").map(Number) });
  const L = await import(`${pub}/lanes-ortho.js`);
  const K = await import(`${pub}/keys.js`);
  K.setDkToken("test-token");
  const out = { here: {}, ask: {} }, answered = {};
  for (const [name, lon, lat] of POINTS) {
    out.here[name] = {};
    out.ask[name] = {};
    for (const source of SOURCES_ASKED) {
      const key = String(source);
      out.here[name][key] = L.orthoHereAt(source, lon, lat);
      // The URLs only where the state is (a source far from its place asks nothing but its own first candidate).
      const row = {};
      // (A PNG and a timeout change nothing in the URL of a tile: only the services asked by a box are asked in those ways.)
      const more = TILED.includes(key) ? [] : ["png", "timeout"];
      const ways = !(full || out.here[name][key]) ? ["none"] : full || (answered[key] = (answered[key] ?? 0) + 1) <= 1 ? ["none", "grey", "png", "timeout"] : ["none", ...more];
      for (const how of ways) {
        const a = await askAll(L, source, lon, lat, how);
        row[how] = { out: a.out, patch: a.patch, asked: a.asked };
      }
      out.ask[name][key] = row;
    }
  }
  return out;
}

// ---------- the base map's layers ----------
const R = 6378137;
const toLatLng = ([px, py], z) => { const n = 256 * 2 ** z; return { lng: (px / n) * 360 - 180, lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / n))) * 180) / Math.PI }; };
const project = ({ lat, lng }) => ({ x: (R * lng * Math.PI) / 180, y: R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) });
class Bounds {
  constructor(a, b) {
    const pts = b ? [a, b] : a;
    const lats = pts.map((p) => (Array.isArray(p) ? p[0] : p.lat)), lngs = pts.map((p) => (Array.isArray(p) ? p[1] : p.lng));
    this.s = Math.min(...lats); this.n = Math.max(...lats); this.w = Math.min(...lngs); this.e = Math.max(...lngs);
  }
  intersects() { return true; }
}
const mockLeaflet = () => {
  class Layer { on() { return this; } addTo() { return this; } }
  class TileLayer extends Layer {
    constructor(url, options = {}) { super(); this._url = url; this.options = { ...(this.constructor.defaults || {}), ...options }; }
    static extend(proto) {
      const Parent = this;
      class Sub extends Parent {}
      Object.assign(Sub.prototype, proto);
      Sub.extend = Parent.extend;
      return Sub;
    }
    getTileSize() { return { x: this.options.tileSize || 256, y: this.options.tileSize || 256 }; }
    _getZoomForUrl() { return this._z + (this.options.zoomOffset || 0); }
    getTileUrl(c) {
      const data = { r: "", s: "", x: c.x, y: this.options.tms ? 2 ** c.z - 1 - c.y : c.y, z: c.z + (this.options.zoomOffset || 0) };
      return this._url.replace(/\{ *([\w_-]+) *\}/g, (m, k) => data[k]);
    }
  }
  class WMS extends TileLayer { getTileUrl(c) { return `${this._url}?wms=${this.options.layers}&${this.options.format}&${c.z}/${c.x}/${c.y}`; } }
  TileLayer.WMS = WMS;
  class GridLayer extends Layer {
    constructor(options = {}) { super(); this.options = options; }
    static extend(proto) { class Sub extends this {} Object.assign(Sub.prototype, proto); Sub.extend = this.extend; return Sub; }
    getTileSize() { return { x: 256, y: 256 }; }
  }
  const loose = new Proxy(function () {}, { get: (t, k) => (k === "then" ? undefined : loose), apply: () => loose, construct: () => loose });
  return {
    TileLayer, GridLayer, Layer,
    tileLayer: (url, opts) => new TileLayer(url, opts),
    latLngBounds: (a, b) => new Bounds(a, b),
    layerGroup: (layers = []) => ({ layers: [...layers], addLayer(l) { this.layers.push(l); return this; }, addTo() { return this; } }),
    control: { layers: (base) => { globalThis.__orthoBase = base; return { addTo: () => ({}) }; } },
    // What the cities' modules reach for beyond these answers with a stand-in that does nothing.
    has: loose,
  };
};
const summary = (layer) => {
  const o = layer.options || {}, b = o.bounds;
  const box = (x) => (x ? [x.s, x.w, x.n, x.e].map((v) => Math.round(v * 1e4) / 1e4) : null);
  return {
    url: layer._url ?? null, attribution: o.attribution ?? null, cityAttribution: o.cityAttribution ?? null,
    bounds: b ? box(b.s === undefined ? new Bounds(b) : b) : null, rings: b?.rings ? b.rings.length : 0,
    minZoom: o.minZoom ?? null, maxZoom: o.maxZoom ?? null, maxNativeZoom: o.maxNativeZoom ?? null, tms: !!o.tms,
    layers: o.layers ?? null, bbox: typeof o.bboxUrl === "function",
  };
};
const tileAt = (lon, lat, z) => { const n = 2 ** z, x = Math.floor(((lon + 180) / 360) * n), y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n); return { x, y, z }; };
// The URL each layer asks for the tile of every place (a tile outside the layer's territory asks nothing: a blank one).
async function tilesOf(layer, z) {
  const urls = {};
  const mapStub = { unproject: toLatLng, options: { crs: { project } } };
  layer._map = mapStub;
  layer._z = z;
  for (const [name, lon, lat] of POINTS) {
    const c = tileAt(lon, lat, z);
    if (layer.createTile) {
      const kids = [];
      const mkEl = (tag) => ({ tag, style: {}, kids, children: [], appendChild(k) { kids.push(k); }, set src(v) { this._src = v; setTimeout(() => this.onload?.(), 0); }, get src() { return this._src; } });
      const old = globalThis.document;
      globalThis.document = { createElement: mkEl };
      try {
        const tile = await new Promise((ok, no) => { const t = layer.createTile(c, (err, tl) => (err ? no(err) : ok(tl))); void t; });
        if (tile.kids.length) urls[name] = tile.kids.map((k) => short(k.src));
      } finally { globalThis.document = old; }
    } else {
      const url = short(layer.getTileUrl(c));
      if (!url.startsWith("data:")) urls[name] = url;
    }
  }
  return urls;
}
export async function snapshotMap(pub) {
  const nodeFetch = globalThis.fetch;
  globalThis.fetch = (u, ...rest) => (String(u).startsWith("file:") ? Promise.resolve(new Response(fs.readFileSync(new URL(u)), { status: 200 })) : nodeFetch(u, ...rest));
  globalThis.L = mockLeaflet();
  globalThis.__orthoPub = pub;
  globalThis.__orthoMap = { on() {}, hasLayer: () => false, getBounds: () => new Bounds([[0, 0], [1, 1]]), getCenter: () => ({ lat: 50, lng: 14 }), attributionControl: { addAttribution() {}, removeAttribution() {} } };
  globalThis.document = { querySelector: () => null };
  globalThis.devicePixelRatio = 1;
  register(new URL("./ortho-hooks.mjs", import.meta.url), { data: { pub } });
  const K = await import(`${pub}/keys.js`);
  K.setDkToken("test-token");
  await import(`${pub}/app/basemaps.js`);
  const group = globalThis.__orthoBase[(await import(`${pub}/i18n.js`)).t("app.orthophoto")];
  // North America comes with a cut there (late.js): its towns' boundaries as the page loads them.
  const towns = Object.assign({}, ...["towns-us.json", "towns-ca.json"].map((f) => JSON.parse(fs.readFileSync(`${pub}/${f}`, "utf8"))));
  globalThis.__orthoAmerica?.(towns);
  await new Promise((done) => setTimeout(done, 20));
  const out = [];
  for (const layer of group.layers) out.push({ ...summary(layer), tiles: await tilesOf(layer, 16) });
  return out;
}
