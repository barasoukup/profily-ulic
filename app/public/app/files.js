// Export (SVG, PNG), saving and loading the file, turning the cut round (A and B swapped), restoring a saved cut.
import { localFrame } from "../derive.js";
import { loadSprites, buildSvg, exportCredits, svgString } from "../profile.js";
import { cleanProfile, cleanCut } from "../validate.js";
import { city, country, setCity, cityAt } from "../city.js";
import { ensurePlace } from "../late.js";
import { log } from "../log.js";
import { t as tr } from "../i18n.js";
import { drawCut, showCutInfo } from "./cutview.js";
import { undoStack, redoStack, resetHistory } from "./history.js";
import { cutLog } from "./logging.js";
import { map } from "./map.js";
import { defaultReach, cutEnds, cutSpan } from "./reach.js";
import { state, $, status, current, streetName, render } from "./state.js";
import { save } from "./storage.js";

// The sources of an export: the cut's, and the British signs' licence also when the signs came only in the Design
// (backlog 26. 11. 2026: it was counted from the Stav alone).
function exportSources() {
  const src = { ...(state.cut?.sources || {}) };
  const ogl = country.signs.ogl;
  if (ogl && [state.stav, state.navrh].some((p) => p?.segments?.some((s) => s.signs?.some((x) => ogl.has(country.signs.file(x, s)))))) src.ukSigns = true;
  return src;
}
export function exportSvgs() {
  const title = state.cut ? streetName(state.cut) : tr("app.profile");
  const credits = exportCredits(exportSources());
  if (state.mode === "porovnat" || !state.stav) {
    return [buildSvg(state.stav, { title: `${title} – ${tr("app.existing")}`, credits }), buildSvg(state.navrh, { title: `${title} – ${tr("app.proposal")}`, credits })];
  }
  return [buildSvg(current(), { title: `${title} – ${state.mode === "navrh" ? tr("app.proposal") : tr("app.existing")}`, credits })];
}
function download(name, blob) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const fileBase = () => (state.cut ? streetName(state.cut) : "profil").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();
$("#btn-export-svg").onclick = () => {
  log("export", { detail: "svg", ...cutLog() });
  if (!state.stav) return;
  download(`${fileBase()}-${state.mode}.svg`, new Blob([svgString(exportSvgs())], { type: "image/svg+xml" }));
};
$("#btn-export-png").onclick = async () => {
  log("export", { detail: "png", ...cutLog() });
  if (!state.stav) return;
  const text = svgString(exportSvgs());
  const vb = text.match(/viewBox="([^"]+)"/)?.[1].split(" ").map(Number);
  if (!vb) return;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  img.src = url;
  try { await img.decode(); } catch { status(tr("app.imageCouldNotMade"), "error"); URL.revokeObjectURL(url); return; }
  URL.revokeObjectURL(url);
  const scale = 0.6; // px per cm
  const canvas = Object.assign(document.createElement("canvas"), { width: vb[2] * scale, height: vb[3] * scale });
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((b) => download(`${fileBase()}-${state.mode}.png`, b), "image/png");
};
$("#btn-save").onclick = () => {
  if (!state.stav) return;
  log("ulozeni", cutLog());
  const data = { app: "streetdesign-pilot", version: 1, cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited,
    zdroje: exportCredits(exportSources()).join("\n"),
    licence: tr("app.dataUnderTheirSources") };
  download(`${fileBase()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
};
$("#file-load").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await savedPlace(data);
    restore(data);
  } catch (err) {
    status(tr("app.fileCouldNotLoaded", { error: err.message }), "error");
  }
  e.target.value = "";
};
// ⇄: the cut turned round, A and B swapped. The profiles are mirrored as they are (corrections and
// the design included), with no new data: parts in reverse order, their directions swapped (they
// are told against the street's direction, which turns too), the edges swapped.
const OTHER = { forward: "backward", backward: "forward" };
function mirror(p) {
  const swap = (k) => (k.startsWith("left") ? "right" + k.slice(4) : k.startsWith("right") ? "left" + k.slice(5) : k);
  return {
    ...p,
    edges: Object.fromEntries(Object.entries(p.edges || {}).map(([k, v]) => [swap(k), v])),
    segments: [...p.segments].reverse().map((s) => ({
      ...s,
      ...(s.dir ? { dir: OTHER[s.dir] || s.dir } : {}),
      ...(s.bikeDir ? { bikeDir: OTHER[s.bikeDir] || s.bikeDir } : {}),
      ...(s.items ? { items: s.items.map((it) => ({ ...it, f: +(1 - it.f).toFixed(3) })) } : {}),
      // The pedestrians' side of a divided path (C 10a) turns with the view.
      ...(s.signs ? { signs: s.signs.map((x) => (x.walk ? { ...x, walk: x.walk === "left" ? "right" : "left" } : x)) } : {}),
    })),
  };
}
$("#btn-flip").onclick = () => {
  if (!state.stav || !state.cut) return;
  state.stav = mirror(state.stav);
  state.navrh = mirror(state.navrh);
  if (state.computed) state.computed = mirror(state.computed);
  const r = state.cut.reach || defaultReach();
  const sp = state.cut.span && { left: state.cut.span.right, right: state.cut.span.left };
  const before = state.cut;
  state.cut = { ...state.cut, bearing: ((state.cut.bearing + 180 + 540) % 360) - 180, reach: { left: r.right, right: r.left }, span: sp };
  // The networks turn round with the cut (t across it changes sign), not asked again.
  if (state.underground?.cut === before && state.underground.items) {
    const items = state.underground.items.map((x) => ({ ...x, t: -x.t }));
    items.lines = state.underground.items.lines;
    state.underground = { cut: state.cut, items };
  }
  state.selected = null;
  const f = localFrame(state.cut.lat, state.cut.lon), b = (state.cut.bearing * Math.PI) / 180;
  drawCut(cutEnds(f, [-Math.cos(b), Math.sin(b)], cutSpan(state.cut)));
  showCutInfo();
  resetHistory();
  save();
  render();
};
// The place of a saved cut, before it is restored (late.js): without a connection its state is unknown, the profile shows.
export const savedPlace = (data) => { const { lat, lon } = data?.cut || {}; return typeof lat === "number" && typeof lon === "number" ? ensurePlace(lat, lon).catch((err) => console.warn("America", err)) : null; };
export function restore(data) {
  cleanProfile(data?.stav, tr("app.existing"));
  if (data.navrh) cleanProfile(data.navrh, tr("app.proposal"));
  data.cut = cleanCut(data.cut);
  undoStack.length = redoStack.length = 0;
  Object.assign(state, { cut: data.cut, stav: data.stav, navrh: data.navrh || structuredClone(data.stav), navrhEdited: !!data.navrhEdited, selected: null });
  // The saved cut's city (its illustrations follow once loaded).
  if (state.cut) {
    setCity(cityAt(state.cut.lat, state.cut.lon));
    Promise.all([loadSprites(), country.atPlace?.(state.cut.lon, state.cut.lat).then((v) => Object.assign(city, v))]).then(render);
  }
  if (state.cut) {
    map.setView([state.cut.lat, state.cut.lon], 19);
    const f = localFrame(state.cut.lat, state.cut.lon);
    const r = (state.cut.bearing * Math.PI) / 180;
    const n = [-Math.cos(r), Math.sin(r)];
    drawCut(cutEnds(f, n, cutSpan(state.cut)));
    $("#street-name").textContent = streetName(state.cut);
    showCutInfo();
  }
  save();
  render();
  resetHistory();
}
