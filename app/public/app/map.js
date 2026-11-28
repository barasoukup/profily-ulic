// The Leaflet map: it opens over the city of ?mesto= (an old city page) or over the default city.
import { flag } from "../flags.js";
import { city, setCity } from "../city.js";
import { ensurePlace, isLate } from "../late.js";
import { t as tr, lang, attribution } from "../i18n.js";

// An old city page (/brno/ …) sends its visitors here with ?mesto=brno: the map opens over that city.
export const startCity = flag("mesto");
if (startCity) { setCity(startCity); if (isLate(...city.view)) { await ensurePlace(...city.view).catch(() => {}); setCity(startCity); } history.replaceState(null, "", location.pathname + location.hash); }
export const map = L.map("map", { maxZoom: 21, zoomControl: false }).setView(city.view, startCity === "cesko" ? 8 : 18);
// The layers' credits are written in Czech: in another language they are translated as they are added and removed.
if (lang !== "cs") for (const m of ["addAttribution", "removeAttribution"]) {
  const own = map.attributionControl[m].bind(map.attributionControl);
  map.attributionControl[m] = (text) => own(text && attribution(text));
}
L.control.zoom({ zoomInTitle: tr("app.zoom"), zoomOutTitle: tr("app.zoomOut") }).addTo(map);
