// The networks under the street (site.js, Prague and Brno): the switch, the query, the lines on the map, what the profile draws.
import { flag } from "../flags.js";
import { localFrame } from "../derive.js";
import { underground, KINDS as NET_KINDS, netAt } from "../site.js";
import { t as tr } from "../i18n.js";
import { layersControl } from "./basemaps.js";
import { map } from "./map.js";
import { cutSpan } from "./reach.js";
import { state, $, render } from "./state.js";

// Networks under the street (site.js, a trial, Prague only): off by default; the switch by the profile asks for
// them, draws them under the Stav profile and turns on their own layer of the map (which the layer control can
// then turn off alone).
function siteOn() { try { return localStorage.getItem("profily-site") === "1"; } catch { return false; } }
// ?site=1 in a link turns it on (for trying it out).
if (flag("site") === "1") try { localStorage.setItem("profily-site", "1"); } catch {}
$("#site-btn").setAttribute("aria-pressed", String(siteOn()));
$("#site-btn").onclick = () => {
  const on = !siteOn();
  try { localStorage.setItem("profily-site", on ? "1" : "0"); } catch {}
  $("#site-btn").setAttribute("aria-pressed", String(on));
  if (on) map.addLayer(netLayer); else map.removeLayer(netLayer);
  loadUnderground();
  render();
};
export function loadUnderground() {
  // Only where a city publishes its networks (Prague, Brno): elsewhere no switch at all; asked only when switched on.
  const net = state.cut ? netAt(state.cut.city, state.cut.lat, state.cut.lon) : null, here = !!net;
  if (here !== netInControl) { if (here) layersControl.addOverlay(netLayer, tr("common.undergroundNetworks")); else layersControl.removeLayer(netLayer); netInControl = here; }
  $("#site-btn").hidden = !here || state.mode === "porovnat";
  $("#net-hint").hidden = !undergroundFor();
  if (here) $("#net-hint").textContent = `${tr("app.undergroundNetworksNotExports")} ${net.credit()}`;
  if (!siteOn() || !here || state.underground?.cut === state.cut) return;
  const cut = state.cut, b = (cut.bearing * Math.PI) / 180, span = cutSpan(cut);
  state.underground = { cut, items: null };
  underground({ frame: localFrame(cut.lat, cut.lon), dir: [Math.sin(b), Math.cos(b)], half: Math.max(span.left, span.right) + 1, cityId: cut.city })
    .then((items) => { if (state.underground?.cut === cut) { state.underground.items = items || []; render(); } })
    .catch((err) => { console.warn("sítě", err); if (state.underground?.cut === cut) state.underground.items = []; });
}
// The networks on the map too, in the band's colours (Bára): the lines around the cut, dashed where not verified.
// Under the cut's line (overlayPane, 400) and over the data layers of maplayers.js (390–395).
map.createPane("rezSite").style.zIndex = 396;
const netLayer = L.layerGroup();
let netInControl = false; // in the layer control only where the city's networks can be had (loadUnderground)
if (siteOn()) netLayer.addTo(map);
let netDrawn = null;
export function drawNetLines() {
  const items = state.underground?.cut === state.cut && state.cut && netAt(state.cut.city, state.cut.lat, state.cut.lon) ? state.underground.items : null;
  if (netDrawn === items) return;
  netDrawn = items;
  netLayer.clearLayers();
  for (const l of items?.lines || []) {
    L.polyline(l.coords, { pane: "rezSite", color: (NET_KINDS[l.kind] || NET_KINDS.jine).color, weight: l.kind === "jine" ? 1.5 : 2, opacity: 0.85, dashArray: l.verified ? null : "6 5" })
      .bindTooltip(l.popis, { sticky: true }).addTo(netLayer);
  }
}
export function undergroundFor() {
  const items = state.underground?.cut === state.cut ? state.underground.items : null;
  // In Stav and Návrh (a design wider or narrower than the street has them stretched to it), not in Porovnat.
  return siteOn() && state.mode !== "porovnat" && items?.length ? { items, span: cutSpan(state.cut), kinds: NET_KINDS } : null;
}
