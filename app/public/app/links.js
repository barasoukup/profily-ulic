// The start of the page: the cut saved in the browser or given in the link, the link of a cut with a design, sharing.
import { loadSprites, artEvents } from "../profile.js";
import { cleanProfile } from "../validate.js";
import { packProfile, unpackProfile, designParams, sameCut } from "../share.js";
import { cityAt } from "../city.js";
import { log } from "../log.js";
import { t as tr } from "../i18n.js";
import { cutAt, parseCut } from "./cut.js";
import { savedPlace, restore } from "./files.js";
import { resetHistory } from "./history.js";
import { cutLog } from "./logging.js";
import { startCity, map } from "./map.js";
import { state, $, status, render } from "./state.js";
import { STORE, save, optsKey } from "./storage.js";

artEvents.addEventListener("ready", () => render()); // a house of North America drawn in Europe (profile.js)
render(); // the intro shows at once; the illustrations follow
window.profilyReady = true; // errors.js: from now on a failure is not a failed start
await loadSprites();
let linked = location.hash.startsWith("#rez=") ? parseCut(location.hash) : null;
try {
  // This tab's cut kept over a change of language comes first (once), then the browser's saved one.
  let tab = null;
  try { tab = JSON.parse(sessionStorage.getItem("profily-tab") || "null"); sessionStorage.removeItem("profily-tab"); } catch {}
  const saved = tab || JSON.parse(localStorage.getItem(STORE) || "null");
  // A reload of the same cut (no design in the link) keeps the work saved in this browser.
  const design = linked && designParams(location.hash);
  if (linked && saved?.stav && !design.navrh && !design.stav && sameCut(linked, saved.cut) && (tab || (saved.opts ?? "") === optsKey())) linked = null;
  // A former city page (?mesto=) opens over that city, not over a cut saved elsewhere.
  const elsewhere = startCity && !linked && saved?.cut && cityAt(saved.cut.lat, saved.cut.lon) !== startCity;
  if (saved?.stav && !linked && !elsewhere) {
    await savedPlace(saved);
    restore(saved);
    takeMode();
  } else render();
} catch {
  render();
}
// A cut link, possibly with a design in it (shareLink): the street is derived from the data as
// always, then the design (and the hand-corrected Stav) from the link replace the parts.
async function openLink(hash) {
  const c = parseCut(hash);
  if (!c) return;
  const design = designParams(hash);
  $("#pano-dialog").close();
  map.setView([c.lat, c.lon], 19);
  await cutAt(c.lat, c.lon, false, c.bearing, c.reach, null, c.way);
  if (!state.stav || (!design.navrh && !design.stav)) return;
  try {
    const take = async (text, into) => {
      const p = cleanProfile(await unpackProfile(text), into === "stav" ? tr("app.existing") : tr("app.proposal"));
      state[into] = { segments: p.segments, edges: { ...state.stav.edges, ...p.edges } };
    };
    if (design.stav) await take(design.stav, "stav");
    if (design.navrh) { await take(design.navrh, "navrh"); state.navrhEdited = true; state.mode = "navrh"; }
    else { state.navrh = structuredClone(state.stav); state.navrhEdited = false; }
    resetHistory();
    save();
    render();
    // The address keeps the design (cutAt wrote the bare cut), so the link can be reloaded and passed on.
    history.replaceState(null, "", location.hash.split("&")[0] + hash.slice(hash.indexOf("&")));
    status(tr("app.openedProposalSharedLink"), "ok");
  } catch (err) {
    console.warn("odkaz", err);
    status(tr("app.proposalLinkCouldNot"), "error");
  }
}
// The mode kept over a change of language (the lang button) applies once the cut is there, from storage or a link.
function takeMode() {
  let mode = null;
  try { mode = sessionStorage.getItem("profily-rezim"); sessionStorage.removeItem("profily-rezim"); } catch {}
  if (state.stav && ["navrh", "porovnat"].includes(mode)) { state.mode = mode; render(); }
}
if (linked) openLink(location.hash).then(takeMode);
// A cut link pasted into the address bar of an open tab (the app's own updates use replaceState,
// which fires no hashchange).
addEventListener("hashchange", () => {
  if (location.hash.startsWith("#rez=")) openLink(location.hash);
});
// Share: the address of the cut with the design (and a hand-corrected Stav) packed into it.
$("#btn-share").onclick = async () => {
  log("sdileni", cutLog());
  if (!state.stav) return;
  const base = location.href.split("#")[0] + location.hash.split("&")[0];
  const stavEdited = state.stav.segments.some((s) => s.source === "user");
  let url = base;
  if (state.navrhEdited) url += "&navrh=" + (await packProfile(state.navrh));
  if (stavEdited) url += "&stav=" + (await packProfile(state.stav));
  try { await navigator.clipboard.writeText(url); status(state.navrhEdited ? tr("app.linkProposalCopiedClipboard") : tr("app.linkStreetCopiedClipboard"), "ok"); }
  catch { try { prompt(tr("app.copyLink"), url); } catch { status(url, "ok"); } } // no prompt in some web views
};
