// The cut on the page: the core (cut-core.js computeCut: from a point to the profile, no page, also in Node) and then
// what the page does with it: the cut on the map, the state of the page, the log, the browser's storage, the drawing.
import { loadSprites } from "../profile.js";
import { parseCutHash } from "../share.js";
import { log } from "../log.js";
import { t as tr } from "../i18n.js";
import { dataLayers } from "./basemaps.js";
import { computeCut } from "./cut-core.js";
import { drawCut, showCutInfo, drawMtvu } from "./cutview.js";
import { resetHistory } from "./history.js";
import { logEdits } from "./logging.js";
import { map } from "./map.js";
import { cutEnds, cutSpan } from "./reach.js";
import { state, $, status, streetName, render } from "./state.js";
import { save } from "./storage.js";
import { loadUnderground } from "./underground.js";

export async function cutAt(lat, lon, keepWay = false, bearing = null, reach = null, wantName = null, wantWay = null) {
  logEdits(); // what was done with the previous cut, before it is replaced
  try {
    const out = await computeCut({ lat, lon, keepWay, bearing, reach, wantName, wantWay, shown: state.cut, navrhEdited: state.navrhEdited },
      { onStatus: (text) => status(text), onCityChange: loadSprites });
    if (!out.cut) {
      // A click with no street found is logged too (Bára: how many try outside the Czech Republic).
      if (out.noStreet) log("bez_ulice", out.noStreet);
      return status(out.status.text, out.status.kind);
    }
    showCut(out, keepWay);
  } catch (err) {
    console.error(err);
    status(tr("app.dataCouldNotLoaded", { error: err.message }), "error");
  }
}

// The cut computed becomes the page's: its state (Stav, a new Návrh unless the design is kept), the map, the log, the
// browser's storage, the status line and the drawing.
function showCut(out, keepWay) {
  if (!keepWay) state.navrhEdited = false;
  state.cut = out.cut;
  // The log of cuts (log.js): the cut exactly, and how it came (a click, a moved cut, a link).
  log("rez", out.logCut);
  state.stav = out.stav;
  // For the evaluation (evaluation/holdout, the replay's light capture): the surfaces along the cut and how the profile came.
  globalThis.__profilyEval = out.eval;
  state.computed = structuredClone(state.stav); // the detection, for the log of corrections
  state.stavEdited = false;
  if (!state.navrhEdited) state.navrh = structuredClone(state.stav);
  state.selected = null;
  state.edge = null;
  state.fixing = false;
  state.fixBase = null;
  resetHistory();
  const v = out.view;
  drawCut(cutEnds(v.frame, v.normal, cutSpan(state.cut)));
  showCutInfo();
  drawMtvu(v.polys);
  dataLayers.draw({ frame: v.frame, dir: v.dir, osm: v.osm, way: v.way, polys: v.polys, tracks: v.tracks, lines: v.lines, parking: v.parking, span: cutSpan(state.cut), facades: v.facades });
  if (!map.getBounds().contains(v.at)) map.panTo(v.at);
  // The heading is the street only (Bára 16. 11. 2026); where the data come from is said under it (#profile-sub).
  $("#street-name").textContent = streetName(state.cut);
  status(out.status.text, out.status.kind);
  save();
  state.underground = null;
  loadUnderground();
  render();
  // On a phone the profile is under the map: bring it into view.
  if (matchMedia("(max-width: 760px)").matches) $("#profile-head").scrollIntoView({ behavior: "smooth", block: "start" });
}
// Paste "lat, lon · azimut N°" (or a #rez= link) to jump to a cut.
export function parseCut(text) {
  const m = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)(?:[^\d]+?(\d+(?:\.\d+)?)\s*°?)?/);
  const h = parseCutHash(text);
  if (h) return h;
  if (!m) return null;
  return { lat: +m[1], lon: +m[2], bearing: m[3] !== undefined ? +m[3] + 90 : null };
}
