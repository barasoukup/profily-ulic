// The cut as drawn on the map: its line, its handles, the selected part, the surfaces of the map along it, the hint on dragging.
import { localFrame } from "../derive.js";
import { cutHash } from "../share.js";
import { country } from "../city.js";
import { PLOCHY_PANE } from "../maplayers.js";
import { mtvuLayer } from "./basemaps.js";
import { map } from "./map.js";
import { mapyKey } from "./panorama.js";
import { defaultReach, cutSpan } from "./reach.js";
import { state, $, current } from "./state.js";

const MTVU_COLORS = { 701: "#5c5c59", 700: "#5c5c59", 702: "#c9a227", 703: "#b5574a", 704: "#7b7b78", 705: "#8c6d3f", 601: "#9b8cc4" };
export const cutLine = L.polyline([], { color: "#e24b4a", weight: 4 }).addTo(map);
// The part selected in the profile, shown on the cut line (Bára): its stretch between the profile's ends A and B.
export const selLine = L.polyline([], { color: "#185fa5", weight: 9, opacity: 0.85, interactive: false }).addTo(map);
export function drawSelection() {
  const p = state.mode === "porovnat" ? null : current(), seg = p?.segments?.[state.selected];
  if (!seg || !state.cut) { selLine.setLatLngs([]); return; }
  // The parts lie from A (+normal, span.left) to B (-normal, span.right), stretched to the cut's length (a design
  // may be wider or narrower than the street).
  const span = cutSpan(state.cut), total = p.segments.reduce((x, q) => x + q.width, 0) || 1, len = span.left + span.right;
  const from = p.segments.slice(0, state.selected).reduce((x, q) => x + q.width, 0);
  const b = (state.cut.bearing * Math.PI) / 180, normal = [-Math.cos(b), Math.sin(b)], f = localFrame(state.cut.lat, state.cut.lon);
  selLine.setLatLngs([from, from + seg.width].map((a) => {
    const t = span.left - (a / total) * len, [lon, lat] = f.toLonLat(normal[0] * t, normal[1] * t);
    return [lat, lon];
  }));
}
const handleIcon = L.divIcon({ className: "cut-handle", iconSize: [14, 14] });
export const centerMarker = L.marker([0, 0], { draggable: true, icon: handleIcon, opacity: 0 }).addTo(map);
// Cut ends are lettered like the profile: A = left end of the profile (endMarkers[1]), B = right end.
const endIcon = (letter) => L.divIcon({ className: "cut-handle cut-end", html: letter, iconSize: [22, 22] });
export const endMarkers = ["B", "A"].map((letter) => L.marker([0, 0], { draggable: true, icon: endIcon(letter), opacity: 0 }).addTo(map));
export function drawCut(ends) {
  const ll = ends.map(([lon, lat]) => [lat, lon]);
  cutLine.setLatLngs(ll);
  centerMarker.setLatLng([state.cut.lat, state.cut.lon]).setOpacity(1);
  endMarkers.forEach((m, i) => m.setLatLng(ll[i]).setOpacity(1));
}
export function showCutInfo() {
  if (!state.cut) return;
  const r = state.cut.reach || defaultReach();
  history.replaceState(null, "", cutHash(state.cut, r));
  // Mapy.com at the cut with the panorama layer on (ovl=8). A link straight into a panorama needs
  // the photo's id (pid), which only their Panorama API (with a key) gives; one click on the street opens it.
  // With a Mapy.com key the panorama opens here; without one, a link to Mapy.com at the cut.
  const pano = $("#pano-link");
  pano.href = `https://mapy.com/cs/zakladni?x=${state.cut.lon.toFixed(7)}&y=${state.cut.lat.toFixed(7)}&z=19&ovl=8`;
  // Mapy.com has panoramas of the Czech Republic only (Bára 16. 11. 2026).
  pano.hidden = !!mapyKey || !country.panorama;
  $("#pano-btn").hidden = !mapyKey || !country.panorama;
}
export function drawMtvu(polys) {
  mtvuLayer.clearLayers();
  for (const p of polys) {
    L.polygon(p.lonlat, {
      color: MTVU_COLORS[p.code] || "#8fbf55", weight: 1, fillOpacity: 0.25, interactive: false, pane: PLOCHY_PANE,
    }).addTo(mtvuLayer);
  }
}
// The hint on dragging the cut shows until the cut is first dragged (Fable: not for good under the map).
const HELP_KEY = "profily-napoveda";
export const helpSeen = () => { try { return localStorage.getItem(HELP_KEY) === "1"; } catch { return false; } };
export function markHelp() {
  if (helpSeen()) return;
  try { localStorage.setItem(HELP_KEY, "1"); } catch {}
  $("#map-help").hidden = true;
}
