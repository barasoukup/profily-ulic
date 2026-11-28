// An editable profile with draggable boundaries.
import { buildSvg } from "./build.js";

// Narrowest width a segment can be dragged to: perpendicular parking keeps 4.5 m (ČSN 73 6056).
const minWidth = (seg) => (seg.type === "parkovani" && seg.orient === "kolme" ? 4.5 : 0.2);

// Mount an editable profile with draggable boundaries.
// onRedraw runs after each drawing (also while a handle is dragged), for the page to fit the labels.
export function mountEditor(container, profile, { editable = true, selected, onSelect, selectedEdge, onEdge, onChange, onRedraw, underground }) {
  const draw = (view) => {
    container.replaceChildren(buildSvg(profile, { editable, selected, onSelect, selectedEdge, onEdge, view, underground }));
    onRedraw?.(container);
    return container.firstChild;
  };
  let svg = draw();
  svg.addEventListener("pointerdown", startDrag);

  function startDrag(ev) {
    const h = ev.target.closest(".handle");
    if (!h) return;
    ev.preventDefault();
    const k = Number(h.dataset.k);
    const view = JSON.parse(svg.dataset.view);
    const toCm = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    };
    let last = toCm(ev), moved = false;
    const segs = profile.segments;
    const move = (e) => {
      const xcm = toCm(e);
      let d = Math.round((xcm - last) / 5) * 0.05; // 5 cm steps
      if (!d) return;
      moved = true;
      const a = segs[k - 1], b = segs[k];
      if (a && b) {
        d = Math.max(-(a.width - minWidth(a)), Math.min(b.width - minWidth(b), d));
        a.width = +(a.width + d).toFixed(2);
        b.width = +(b.width - d).toFixed(2);
        a.source = b.source = "user";
      } else if (b) {
        d = Math.min(b.width - minWidth(b), d);
        b.width = +(b.width - d).toFixed(2);
        b.source = "user";
      } else if (a) {
        d = Math.max(-(a.width - minWidth(a)), d);
        a.width = +(a.width + d).toFixed(2);
        a.source = "user";
      }
      last += d * 100;
      svg = draw(view);
      svg.addEventListener("pointerdown", startDrag);
    };
    // A cancelled touch (the browser took the gesture) ends the drag like lifting the finger.
    const up = (e) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) { onChange(); return; }
      // A click on a handle's wide grab area (narrow parts lie under it: Fable) selects the part under the pointer.
      const xcm = toCm(e);
      let x = 0;
      const i = segs.findIndex((s) => (x += s.width * 100) > xcm);
      if (i >= 0 && xcm >= 0) onSelect?.(i);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
}
