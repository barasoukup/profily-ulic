// What is sent to the log about a cut: its place, and the corrections and designs of the visitor (each once per change).
import { city } from "../city.js";
import { log, shortProfile } from "../log.js";
import { state } from "./state.js";

export const cutLog = () => (state.cut ? { city: city.id, street: state.cut.name, wayId: state.cut.wayId, lat: state.cut.lat, lon: state.cut.lon } : {});
// How visitors corrected the data (the detection against the corrected Stav) and what they designed
// (Stav against Návrh), each sent once per change: on Hotovo, on leaving a mode, on a new cut and when
// the page is left. The log shows where the detection fails and what people want of their streets (Bára).
const sentEdits = {};
export function logEdits() {
  if (!state.cut || !state.stav) return;
  const send = (detail, pred, po) => {
    const key = `${state.cut.wayId}|${state.cut.lat}|${detail}`, text = JSON.stringify(po);
    if (JSON.stringify(pred) === text || sentEdits[key] === text) return;
    sentEdits[key] = text;
    log("upravy", { detail, ...cutLog(), bearing: +state.cut.bearing.toFixed(1), profile: { pred, po } });
  };
  const stav = shortProfile(state.stav);
  if (state.stavEdited && state.computed) send("oprava", shortProfile(state.computed), stav);
  if (state.navrhEdited) send("navrh", stav, shortProfile(state.navrh));
}
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") logEdits(); });
