// The buttons by the profile: the modes (Stav, Návrh, Porovnat), the row of traffic signs, correcting the data.
import { setSignsShown, getSignsShown, totalWidth } from "../profile.js";
import { log } from "../log.js";
import { cutLog, logEdits } from "./logging.js";
import { state, $, render } from "./state.js";

document.querySelectorAll(".seg-toggle button").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.mode !== state.mode && b.dataset.mode !== "stav") log(b.dataset.mode, cutLog());
  if (b.dataset.mode !== state.mode) logEdits();
  state.mode = b.dataset.mode;
  state.selected = null;
  state.fixing = false;
  // Until the proposal is edited, it follows the current (possibly corrected) existing state.
  if (state.stav && !state.navrhEdited) state.navrh = structuredClone(state.stav);
  render();
}));
// The row of traffic signs: shown or not, remembered per browser (Bára 27. 11. 2026).
const SIGNS_KEY = "profily-znacky";
try { if (localStorage.getItem(SIGNS_KEY) === "ne") setSignsShown(false); } catch {}
const showSignsSwitch = () => $("#btn-signs").setAttribute("aria-checked", String(getSignsShown()));
showSignsSwitch();
$("#btn-signs").addEventListener("click", () => {
  setSignsShown(!getSignsShown());
  try { localStorage.setItem(SIGNS_KEY, getSignsShown() ? "ano" : "ne"); } catch {}
  showSignsSwitch();
  render();
});
// Illustrations: always each city's own (Bára 27. 11. 2026: the switch to Streetmix's is gone; profile.js setArt stays for the replay).

$("#btn-fix").onclick = () => {
  state.fixing = !state.fixing;
  state.selected = null;
  if (!state.fixing) logEdits();
  // Corrections keep the street's width: the width measured before them is the target (renderWidthCheck).
  if (state.fixing) { state.fixBase ??= totalWidth(state.stav); log("oprava", cutLog()); }
  render();
};
