// The splitter between the map and the profile (the share of each, remembered per layout).
import { fitPhone } from "./fit.js";
import { map } from "./map.js";
import { $ } from "./state.js";

// Desktop: the map's width in % of the window; phone (≤ 760 px): the map's height in % of the screen.
// The share is remembered per layout in localStorage.
const SPLIT_KEY = "streetdesign-split";
const splitter = $("#splitter");
const phoneLayout = () => matchMedia("(max-width: 760px)").matches;
function applySplit(share) {
  const phone = phoneLayout();
  const v = Math.max(phone ? 20 : 15, Math.min(80, share));
  document.querySelector("main").style.setProperty("--map-size", phone ? `${v}vh` : `${v}%`);
  splitter.setAttribute("aria-orientation", phone ? "horizontal" : "vertical");
  splitter.setAttribute("aria-valuenow", Math.round(v));
  map.invalidateSize();
  fitPhone();
  return v;
}
function savedSplit() {
  try { return JSON.parse(localStorage.getItem(SPLIT_KEY) || "{}")[phoneLayout() ? "phone" : "desktop"]; } catch { return undefined; }
}
function saveSplit(v) {
  try {
    const all = JSON.parse(localStorage.getItem(SPLIT_KEY) || "{}");
    all[phoneLayout() ? "phone" : "desktop"] = v;
    localStorage.setItem(SPLIT_KEY, JSON.stringify(all));
  } catch {}
}
splitter.setAttribute("aria-valuemin", 15);
splitter.setAttribute("aria-valuemax", 80);
applySplit(savedSplit() ?? (phoneLayout() ? 55 : 50));
// A window turned or narrowed into the phone layout (or back) takes that layout's share: the desktop's "50%" as the
// phone map's height left it no height at all (Fable).
matchMedia("(max-width: 760px)").addEventListener("change", () => applySplit(savedSplit() ?? (phoneLayout() ? 55 : 50)));
splitter.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  splitter.setPointerCapture(e.pointerId);
  splitter.classList.add("dragging");
  document.body.classList.add("resizing");
  const main = document.querySelector("main").getBoundingClientRect();
  let last;
  const move = (ev) => {
    last = phoneLayout()
      ? ((ev.clientY - main.top) / innerHeight) * 100
      : ((ev.clientX - main.left) / main.width) * 100;
    last = applySplit(last);
  };
  const up = () => {
    splitter.releasePointerCapture(e.pointerId);
    splitter.classList.remove("dragging");
    document.body.classList.remove("resizing");
    splitter.removeEventListener("pointermove", move);
    if (last !== undefined) saveSplit(last);
  };
  splitter.addEventListener("pointermove", move);
  splitter.addEventListener("pointerup", up, { once: true });
  splitter.addEventListener("pointercancel", up, { once: true });
});
// Keyboard: arrow keys move the splitter by 5 %.
splitter.addEventListener("keydown", (e) => {
  const step = { ArrowLeft: -5, ArrowUp: -5, ArrowRight: 5, ArrowDown: 5 }[e.key];
  if (!step) return;
  e.preventDefault();
  const cur = savedSplit() ?? (phoneLayout() ? 55 : 50);
  saveSplit(applySplit(cur + step));
});
