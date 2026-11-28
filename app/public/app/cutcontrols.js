// What the visitor does with the cut on the map: a click, dragging the cut and its ends, the address search, the pasted
// position, copying the position.
import { localFrame, dragAlong } from "../derive.js";
import * as sources from "../sources.js";
import { city, cityAt, countryOfCity } from "../city.js";
import { placeAt } from "../towns/index.js";
import { log } from "../log.js";
import { mountSearch } from "../search.js";
import { t as tr } from "../i18n.js";
import { osmCache, cutAt, parseCut } from "./cut.js";
import { cutLine, selLine, centerMarker, endMarkers, markHelp } from "./cutview.js";
import { map } from "./map.js";
import { MAX_HALF, HALF_PAD, MIN_REACH, defaultReach, cutEnds, cutSpan } from "./reach.js";
import { state, $, status, streetName } from "./state.js";

// Address search (search.js, RÚIAN of ČÚZK): the map moves there; an address on a street or a street is cut
// like a click at the nearest point of that street. The log gets only the kind of place, never the query.
mountSearch(map, { status, services: () => { const c = map.getCenter(); return countryOfCity(cityAt(c.lat, c.lng)).search; }, inVienna: () => { const c = map.getCenter(); return placeAt(c.lat, c.lng).sources.includes("wien"); }, inCzechia: () => { const c = map.getCenter(); return countryOfCity(cityAt(c.lat, c.lng)).code === "CZ"; }, onPick: ({ item, cut }) => { log("hledani", { detail: item.type === "AdresniMisto" ? "adresa" : item.type === "Ulice" ? "ulice" : "misto" }); if (cut) cutAt(cut.lat, cut.lon, false, null, null, item.at?.street || null); } });
map.on("click", (e) => cutAt(e.latlng.lat, e.latlng.lng));
sources.events.addEventListener("retry", (e) => {
  if (document.body.classList.contains("loading")) status(tr("app.serverNotRespondingTrying", { server: city.abroad && e.detail.host ? e.detail.host : city.server, n: e.detail.attempt, of: e.detail.of }));
});
window.cutAt = cutAt; // handy for testing from the console
// Position and azimuth of the cut as one line: "50.082707, 14.419918 · azimut 344°".
// The azimuth is the direction of the cut line (from the left end to the right end of the
// profile, clockwise from north); the street runs at azimut + 90°.
function cutText(cut) {
  const az = (((cut.bearing - 90) % 360) + 360) % 360;
  return `${cut.lat.toFixed(6)}, ${cut.lon.toFixed(6)} · ${tr("app.azimuth")} ${Math.round(az)}°`;
}
$("#btn-copy-cut").onclick = async () => {
  if (!state.cut) return;
  const text = `${cutText(state.cut)} (${streetName(state.cut)}) ${location.href}`;
  try { await navigator.clipboard.writeText(text); status(tr("app.cutPositionCopiedClipboard"), "ok"); }
  catch { try { prompt(tr("app.copyCutPosition"), text); } catch { status(text, "ok"); } } // no prompt in some web views
};
$("#cut-goto").onchange = (e) => {
  const c = parseCut(e.target.value);
  if (!c) return status(tr("app.positionNotRecognisedPaste", { example: city.example }), "error");
  map.setView([c.lat, c.lon], 19);
  cutAt(c.lat, c.lon, false, c.bearing, c.reach, null, c.way);
  e.target.value = "";
};
// Live preview while dragging: the line follows the handle; the profile is recomputed on drop.
function previewCut(lat, lon, normal, skip, reach = cutSpan(state.cut)) {
  markHelp();
  const f = localFrame(lat, lon);
  const ll = cutEnds(f, normal, reach).map(([x, y]) => [y, x]);
  cutLine.setLatLngs(ll);
  selLine.setLatLngs([]);
  if (skip !== centerMarker) centerMarker.setLatLng([lat, lon]);
  endMarkers.forEach((m, i) => { if (m !== skip) m.setLatLng(ll[i]); });
}
centerMarker.on("drag", () => {
  const ll = centerMarker.getLatLng();
  const f = localFrame(ll.lat, ll.lng);
  let lat = ll.lat, lon = ll.lng;
  let r = (state.cut.bearing * Math.PI) / 180;
  let dir = [Math.sin(r), Math.cos(r)];
  if (osmCache?.way) {
    // Snap to the street as the drop will, so the preview matches the result.
    const near = dragAlong(osmCache.osm, f, osmCache.way, [0, 0]);
    [lon, lat] = f.toLonLat(...near.point);
    // The way's direction may run against the cut's: keep the cut's, or A and B swap sides while dragging (Bára 27. 11. 2026).
    dir = near.dir[0] * dir[0] + near.dir[1] * dir[1] < 0 ? [-near.dir[0], -near.dir[1]] : near.dir;
  }
  previewCut(lat, lon, [-dir[1], dir[0]], centerMarker);
});
// Dragging an end turns the cut and sets how far the profile reaches on that side.
function endDrag(m, i) {
  const ll = m.getLatLng();
  const f = localFrame(state.cut.lat, state.cut.lon);
  const [x, y] = f.toXY(ll.lng, ll.lat);
  const len = Math.hypot(x, y) || 1;
  const normal = i === 0 ? [-x / len, -y / len] : [x / len, y / len];
  const side = i === 0 ? "right" : "left";
  const reach = { ...(state.cut.reach || defaultReach()), [side]: Math.max(MIN_REACH, Math.min(MAX_HALF - HALF_PAD, len)) };
  return { normal, reach };
}
endMarkers.forEach((m, i) => m.on("drag", () => {
  const { normal, reach } = endDrag(m, i);
  const side = i === 0 ? "right" : "left";
  previewCut(state.cut.lat, state.cut.lon, normal, m, { ...cutSpan(state.cut), [side]: reach[side] });
}));
centerMarker.on("dragend", () => {
  const ll = centerMarker.getLatLng();
  cutAt(ll.lat, ll.lng, true);
});
endMarkers.forEach((m, i) => m.on("dragend", () => {
  const { normal, reach } = endDrag(m, i);
  // normal = (-cos b, sin b) for the street bearing b.
  const bearing = (Math.atan2(normal[1], -normal[0]) * 180) / Math.PI;
  cutAt(state.cut.lat, state.cut.lon, true, bearing, reach);
}));
