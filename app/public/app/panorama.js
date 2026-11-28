// The street panorama of Mapy.com at the cut (loaded on the first click only, nothing of it stored).
import { MAPY_KEY } from "../config.js";
import { t as tr, lang } from "../i18n.js";
import { state, $ } from "./state.js";

// The languages of Mapy.com's own texts (its REST API's list); the others get English.
const PANO_LANGS = new Set(["cs", "de", "el", "en", "es", "fr", "it", "nl", "pl", "pt", "sk"]);
// The nearest panorama to the cut, looking along the street the way the profile is drawn (A on the
// left, B on the right). state.cut.bearing is the street's direction, and looking along it A lies on
// the left (checked on Seifertova: the parked cars on the B side show on the right); radians from north. The Mapy.com script is
// loaded on the first click only, and nothing from it is stored (Mapy.com API terms, 4.6.2).
const local = ["localhost", "127.0.0.1"].includes(location.hostname);
const mapyKey = MAPY_KEY || (local ? await import("../config.local.js").then((m) => m.MAPY_KEY, () => "") : "");
// Listed apart: tests/canada.test.js reads an `export … "./x.js"` line as an import of x.js (config.local.js is not in the repository).
export { mapyKey };
let panoLib, panoView;
const loadPano = () => (panoLib ??= new Promise((res, rej) => {
  const s = Object.assign(document.createElement("script"), { src: "https://api.mapy.cz/js/panorama/v1/panorama.js", async: true });
  s.onload = () => (window.Panorama ? res(window.Panorama) : rej(new Error(tr("app.panoramaDidNotLoad"))));
  s.onerror = () => { panoLib = null; rej(new Error(tr("app.mapyComPanoramaDid"))); };
  document.head.append(s);
}));
$("#pano-btn").onclick = async () => {
  if (!state.cut || !mapyKey) return;
  const { lat, lon, bearing } = state.cut;
  const dlg = $("#pano-dialog");
  $("#pano-out").href = $("#pano-link").href;
  $("#pano-note").textContent = tr("app.loading");
  dlg.showModal();
  try {
    const P = await loadPano();
    panoView?.destroy?.();
    $("#pano-view").replaceChildren();
    const yaw = (((bearing % 360) + 360) % 360) * (Math.PI / 180);
    panoView = await P.panoramaFromPosition({
      parent: $("#pano-view"), lon, lat, apiKey: mapyKey, radius: 60, yaw, pitch: 0, fov: 1.3, showNavigation: true, lang: PANO_LANGS.has(lang) ? lang : "en",
    });
    if (panoView?.errorCode && panoView.errorCode !== "NONE") {
      $("#pano-note").textContent = panoView.errorCode === "PANORAMA_NOT_FOUND" ? tr("app.mapyComHasNo") : tr("app.panoramaCannotShownError", { error: panoView.error || panoView.errorCode });
      return;
    }
    const d = panoView?.info?.date;
    $("#pano-note").textContent = d ? tr("app.takenDMY", { d: +d.slice(8, 10), m: +d.slice(5, 7), y: d.slice(0, 4) }) : "";
  } catch (err) {
    $("#pano-note").textContent = err.message;
  }
};
$("#pano-close").onclick = () => $("#pano-dialog").close();
$("#pano-dialog").addEventListener("close", () => { panoView?.destroy?.(); panoView = null; });
