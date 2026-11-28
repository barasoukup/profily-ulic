// How an orthophoto source is asked: the kinds of service of the registry (ortho/sources/<state>.js) and the URL each makes.
//   wms  { base, layers, keys: "lower" | "upper", crs, degrees, transparent, time }  a WMS 1.3.0 GetMap; "upper" writes the
//        parameters in capitals, `degrees` asks the box in CRS:84 (Malta), `transparent` adds TRANSPARENT to a PNG, `time` is
//        the year of a time series (Hamburg)
//   ags  { base, op, jpgOnly, datum }       an ArcGIS MapServer export (op "exportImage" on an ImageServer); `jpgOnly` asks a
//        JPEG whatever the format wanted (Prague, Plzeň), `datum` the datum transformation of S-JTSK
//   xyz  { base, z, px, ext, xy, tms, tileUrl }  tiles of Web Mercator, {z}/{y}/{x} ({z}/{x}/{y} with `xy`, y from the bottom
//        with `tms`, `ext` the file's end), a tile of `px` pixels; `tileUrl(z, x, y)` where a tile is asked by key-value pairs
import { mercToDeg } from "./mercator.js";

const JPEG = "image/jpeg", PNG = "image/png";
const wmsUrl = (s, b, w, h, format, extra) => {
  const k = (name) => (s.keys === "upper" ? name.toUpperCase() : name);
  return `${s.base}?${new URLSearchParams({ [k("service")]: "WMS", [k("request")]: "GetMap", [k("version")]: "1.3.0", [k("layers")]: s.layers, [k("styles")]: "",
    [k("crs")]: s.crs ?? "EPSG:3857", [k("bbox")]: (s.degrees ? mercToDeg(b) : b).join(","), [k("width")]: w, [k("height")]: h, [k("format")]: format,
    ...(s.transparent && format === PNG && { [k("transparent")]: "TRUE" }), ...(s.time && { time: s.time }), ...extra })}`;
};
const agsUrl = (s, b, w, h, format) => `${s.base}/${s.op ?? "export"}?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`,
  ...(s.jpgOnly ? { format: "jpg" } : { format: format === PNG ? "png32" : "jpg", ...(format === PNG && { transparent: "true" }) }), f: "image",
  ...(s.datum && { datumTransformations: s.datum }) })}`;
const URLS = { wms: wmsUrl, ags: agsUrl };
// The URL of an image of the Web Mercator box b (w × h pixels) in the format wanted (a JPEG by default).
export const urlOf = (service, b, w, h, format = JPEG, extra = {}) => URLS[service.type](service, b, w, h, format, extra);
// The URL of a tile: the source's own (tileUrl, WMTS by key-value pairs) or the path {z}/{y}/{x} (xy: {z}/{x}/{y}; tms: y
// from the bottom).
export const tileUrlOf = (s, tx, ty) => (s.tileUrl ? s.tileUrl(s.z, tx, ty) : `${s.base}/${s.z}/${s.xy ? `${tx}/${s.tms ? 2 ** s.z - 1 - ty : ty}` : `${ty}/${tx}`}${s.ext || ""}`);
// The template of the map's tile layer ({y} is the tile's own with `tms`: Leaflet turns it).
export const tileTemplate = (s, z = "{z}") => (s.tileUrl ? s.tileUrl(z, "{x}", "{y}") : `${s.base}/${z}/${s.xy ? "{x}/{y}" : "{y}/{x}"}${s.ext || ""}`);
