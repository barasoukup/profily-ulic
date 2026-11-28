// The state of the page (the mode, the Stav and Návrh profiles, the cut) and the few small things every part of the app
// needs. app.js was split by its sections on 28. 11. 2026 (code-health plan, step 13a: code only moved).
import { t as tr, num } from "../i18n.js";

export const state = {
  mode: "stav",
  stav: null,
  navrh: null,
  navrhEdited: false,
  selected: null,
  cut: null, // {lat, lon, bearing (deg, way direction), wayId, name}
};
export const $ = (s) => document.querySelector(s);
// A message ending in "…" means work in progress: it gets a spinner and the profile is dimmed.
// kind "error" shows it as a warning, "ok" as a confirmation; screen readers announce it (role=status).
export const status = (msg, kind = "") => {
  const el = $("#status");
  el.textContent = msg || "";
  el.className = kind ? `muted ${kind}` : "muted";
  document.body.classList.toggle("loading", /…$/.test(msg || ""));
};
export function current() {
  return state.mode === "navrh" ? state.navrh : state.stav;
}
// The cut's street as shown: its name, or "ulice 123" in the page's language. The cut keeps the name of the data
// only (empty for a street without one) and its note as a key (i18n.js), so a saved cut reads in any language
// and the log gets the same name whatever the visitor's language (Fable's review).
export const streetName = (c) => c?.name || (c?.wayId ? tr("app.streetId", { id: c.wayId }) : tr("common.street"));
// Stav is for looking at the street as it is; its data can be corrected only after "Opravit data"
// (state.fixing), so nothing changes by accident. Návrh is always editable.
export const canEdit = () => state.mode === "navrh" || (state.mode === "stav" && state.fixing);
export const fmtM = (v) => `${num(v)} m`;

// render() lives in view.js, which imports the parts that call it (the editor, the history, the cut…): they call it from
// here, and view.js registers it, so no import cycle (code-health plan, step 13a).
let draw = () => {};
export const setRender = (fn) => { draw = fn; };
export const render = (...args) => draw(...args);
