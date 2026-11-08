import { TYPES, SOURCES, DEFAULT_WIDTH, ITEMS, PARKING_USE } from "./types.js";
import { localFrame, nearestStreet, snapToWay, awayFromJunctions, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } from "./derive.js";
import { loadSprites, buildSvg, mountEditor, svgString, totalWidth, setArt, getArt, buildingStyle, BUILDING_STYLES } from "./profile.js";
import { toStreetmix } from "./streetmix.js";
import * as sources from "./sources.js";
import { checkRules } from "./rules.js";

const HALF = 40; // half-length of the cut used for reading the data (m)
const MIN_REACH = 3; // shortest profile side the user can drag the cut end to (m)
const defaultReach = () => ({ left: MAX_REACH, right: MAX_REACH });
// Ends of the cut on the map: right end at -normal, left end at +normal.
const cutEnds = (f, normal, reach) => [
  f.toLonLat(-normal[0] * reach.right, -normal[1] * reach.right),
  f.toLonLat(normal[0] * reach.left, normal[1] * reach.left),
];
const STORE = "streetdesign-pilot";

const state = {
  mode: "stav",
  stav: null,
  navrh: null,
  navrhEdited: false,
  selected: null,
  cut: null, // {lat, lon, bearing (deg, way direction), wayId, name}
};

const $ = (s) => document.querySelector(s);
// A message ending in "…" means work in progress: it gets a spinner and the profile is dimmed.
const status = (msg) => {
  $("#status").textContent = msg || "";
  document.body.classList.toggle("loading", /…$/.test(msg || ""));
};

// ---------- map ----------
const map = L.map("map", { maxZoom: 21 }).setView([50.0817, 14.4176], 18);
// Base maps. IPR services are drawn through ArcGIS export requests in Web Mercator, one per tile.
// Each request renders a 512 px image covering four normal tiles (tileSize 512, zoomOffset -1):
// a quarter of the requests, which IPR renders one by one (0.2–1.5 s each), and the browser's
// six parallel connections to gs-pub stay free for the profile data.
const GS = "https://gs-pub.praha.eu";
const ArcgisExport = L.TileLayer.extend({
  getTileUrl(c) {
    // One big tile is 512 CSS px; sharp on retina screens with a 1024 px image.
    const size = devicePixelRatio > 1.5 ? 1024 : 512;
    // coords.z is the map zoom; the tile grid is that of the URL zoom (map zoom + zoomOffset).
    const z = this._getZoomForUrl();
    const nw = this._map.options.crs.project(this._map.unproject([c.x * 256, c.y * 256], z));
    const se = this._map.options.crs.project(this._map.unproject([(c.x + 1) * 256, (c.y + 1) * 256], z));
    const image = this.options.service.endsWith("ImageServer");
    return `${this.options.service}/${image ? "exportImage" : "export"}?` + new URLSearchParams({
      bbox: [nw.x, se.y, se.x, nw.y].join(","), bboxSR: 3857, imageSR: 3857, size: `${size},${size}`,
      format: image ? "jpg" : "png", transparent: !image, f: "image",
      // S-JTSK → WGS 84 the same way everywhere (S_JTSK_To_WGS_1984_1, the default of MTVU and the
      // technical map): some IPR map services default to another one and draw a few metres off.
      ...(image ? {} : { datumTransformations: "[1623]" }),
      ...(this.options.layers ? { layers: this.options.layers } : {}),
    });
  },
});
const BIG_TILES = { tileSize: 512, zoomOffset: -1 };
const ipr = (path, attribution, extra = {}) =>
  new ArcgisExport("", { service: `${GS}/${path}`, maxZoom: 21, ...BIG_TILES, attribution: `${attribution} © IPR Praha`, ...extra });

const baseMaps = {
  // IPR's pre-rendered base map in Web Mercator on ArcGIS Online (the one platba.parkujvpraze.cz
  // shows as vector tiles): served from a CDN, so it loads at once, unlike the export requests.
  "Mapa IPR": L.tileLayer("https://tiles.arcgis.com/tiles/SBTXIEUGWbqzUecw/arcgis/rest/services/MTVU_WGS84/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 21, maxNativeZoom: 20, attribution: "mapa © IPR Praha",
  }),
  "Letecká IPR": ipr("imgs/rest/services/ort/letecke_snimkovani/ImageServer", "ortofoto"),
  "Mimovegetační IPR": ipr("imgs/rest/services/ort/mimovegetacni_letecke_snimkovani/ImageServer", "mimovegetační ortofoto"),
  "Ortofoto ČÚZK": L.tileLayer.wms("https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", {
    layers: "0", format: "image/jpeg", maxZoom: 21, attribution: "ortofoto © ČÚZK",
  }),
  "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 21, maxNativeZoom: 19, attribution: "© OpenStreetMap",
  }),
};
const BASE_KEY = "streetdesign-basemap";
let baseName = "Mapa IPR";
try { if (baseMaps[localStorage.getItem(BASE_KEY)]) baseName = localStorage.getItem(BASE_KEY); } catch {}
baseMaps[baseName].addTo(map);
map.on("baselayerchange", (e) => { try { localStorage.setItem(BASE_KEY, e.name); } catch {} });

const dtm = new ArcgisExport("", {
  service: `${GS}/arcgis/rest/services/dtmp/dtmp/MapServer`, layers: "show:9,10,14",
  maxZoom: 21, minZoom: 16, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © IPR Praha",
});
const mtvuLayer = L.layerGroup();
L.control.layers(baseMaps, { "Technická mapa IPR": dtm, "Plochy MTVU u řezu": mtvuLayer }).addTo(map);
mtvuLayer.addTo(map);

const MTVU_COLORS = { 701: "#5c5c59", 700: "#5c5c59", 702: "#c9a227", 703: "#b5574a", 704: "#7b7b78", 705: "#8c6d3f", 601: "#9b8cc4" };
const cutLine = L.polyline([], { color: "#e24b4a", weight: 4 }).addTo(map);
const handleIcon = L.divIcon({ className: "cut-handle", iconSize: [14, 14] });
const centerMarker = L.marker([0, 0], { draggable: true, icon: handleIcon, opacity: 0 }).addTo(map);
// Cut ends are lettered like the profile: A = left end of the profile (endMarkers[1]), B = right end.
const endIcon = (letter) => L.divIcon({ className: "cut-handle cut-end", html: letter, iconSize: [22, 22] });
const endMarkers = ["B", "A"].map((letter) => L.marker([0, 0], { draggable: true, icon: endIcon(letter), opacity: 0 }).addTo(map));

let osmCache = null; // {frame, osm, way, wayPts}



map.on("click", (e) => cutAt(e.latlng.lat, e.latlng.lng));
window.cutAt = cutAt; // handy for testing from the console

async function cutAt(lat, lon, keepWay = false, bearing = null, reach = null) {
  try {
    status("Načítám data z OSM…");
    let frame = localFrame(lat, lon);
    let osm = keepWay && osmCache ? osmCache.osm : await sources.osm(lat, lon, 80);
    let near;
    if (keepWay && osmCache) {
      const pts = osmCache.way.geometry.map((g) => frame.toXY(g.lon, g.lat));
      near = { ...snapToWay(pts, [0, 0]), way: osmCache.way, pts };
    } else {
      near = nearestStreet(osm, frame, [0, 0]);
      // A click lands the cut away from junctions and crossings; a dragged cut stays where it is put.
      if (near) near = awayFromJunctions(osm, frame, near);
    }
    if (!near) return status("Tady jsem žádnou ulici nenašla.");
    // A street of two one-way carriageways is cut from its middle (e.g. the tram belt).
    near = centerOnStreet(osm, frame, near);
    // Re-centre the frame on the snapped point.
    const [clon, clat] = frame.toLonLat(...near.point);
    frame = localFrame(clat, clon);
    let dir = near.dir;
    if (bearing !== null) {
      const r = (bearing * Math.PI) / 180;
      dir = [Math.sin(r), Math.cos(r)];
    }
    osmCache = { osm, way: near.way };
    const normal = [-dir[1], dir[0]];
    reach = reach || (keepWay && state.cut?.reach) || defaultReach();
    const ends = cutEnds(frame, normal, reach);
    const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
    const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
    const pad = 0.0004;
    status("Načítám technickou mapu IPR…");
    const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
    let polys = [], tracks = [];
    const [m, k, pk, z] = await Promise.allSettled([
      sources.mtvu(bbox), sources.linie(bbox), sources.parkovani(bbox), sources.zps(clat, clon),
    ]);
    if (m.status === "fulfilled") polys = mtvuPolygons(m.value, frame);
    else console.warn("MTVU", m.reason);
    let lines = [];
    if (k.status === "fulfilled") { tracks = trackLines(k.value, frame); lines = techLines(k.value, frame); }
    else console.warn("koleje", k.reason);
    const parking = pk.status === "fulfilled" ? esriPolygons(pk.value, frame) : [];
    if (pk.status !== "fulfilled") console.warn("parkovani", pk.reason);
    // Unknown (no zone file): the profile decides from the TSK parking sections around the cut.
    const inZps = z.status === "fulfilled" ? z.value : undefined;
    const result = deriveProfile({ center: [0, 0], dir, half: HALF, polys, osm, frame, way: near.way, tracks, parking, lines, reach, inZps });
    const name = near.way.tags.name || near.way.tags.ref || `ulice ${near.way.id}`;
    state.cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name, reach };
    // Floors of the buildings at both ends from IPR "Podlažnosti" (OSM building:levels as fallback).
    await Promise.all(["left", "right"].map(async (side) => {
      const info = result.edges[`${side}Info`];
      if (!info?.point) return;
      try {
        const [lon, lat] = info.point;
        const p = await sources.podlaznost(lat, lon);
        if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, roofType: p.roofType, iprKind: p.kind, area: p.area, src: "ipr" });
      } catch {}
      delete info.point;
    }));
    state.stav = { segments: result.segments, edges: result.edges };
    if (!state.navrhEdited) state.navrh = structuredClone(state.stav);
    state.selected = null;
    drawCut(ends);
    showCutInfo();
    drawMtvu(polys);
    if (!map.getBounds().contains([clat, clon])) map.panTo([clat, clon]);
    const mtvuFailed = m.status !== "fulfilled";
    $("#street-name").textContent = name + (polys.length ? "" : mtvuFailed ? " · technická mapa neodpověděla, jen odhad" : " · mimo technickou mapu, jen odhad");
    status(mtvuFailed ? "Technická mapa IPR teď neodpovídá (server je přetížený), profil je jen odhad z OSM. Zkuste kliknout znovu za chvíli."
      : !polys.length ? "Technická mapa tu nic nevrátila, profil je odhad z OSM."
      : result.notice ? result.notice
      : result.junction ? "Řez nejspíš vede křižovatkou. Posuňte ho tažením středu do úseku mezi křižovatkami." : "");
    save();
    render();
    // On a phone the profile is under the map: bring it into view.
    if (matchMedia("(max-width: 760px)").matches) $("#profile-head").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    status("Chyba při načítání dat: " + err.message);
  }
}

function drawCut(ends) {
  const ll = ends.map(([lon, lat]) => [lat, lon]);
  cutLine.setLatLngs(ll);
  centerMarker.setLatLng([state.cut.lat, state.cut.lon]).setOpacity(1);
  endMarkers.forEach((m, i) => m.setLatLng(ll[i]).setOpacity(1));
}

// Position and azimuth of the cut as one line: "50.082707, 14.419918 · azimut 344°".
// The azimuth is the direction of the cut line (from the left end to the right end of the
// profile, clockwise from north); the street runs at azimut + 90°.
function cutText(cut) {
  const az = (((cut.bearing - 90) % 360) + 360) % 360;
  return `${cut.lat.toFixed(6)}, ${cut.lon.toFixed(6)} · azimut ${Math.round(az)}°`;
}

function showCutInfo() {
  if (!state.cut) return;
  const r = state.cut.reach || defaultReach();
  $("#cut-pos").textContent = cutText(state.cut) + ` · ulice ${Math.round(((state.cut.bearing % 360) + 360) % 360)}°` +
    ` · dosah ${Math.round(r.left)} / ${Math.round(r.right)} m`;
  history.replaceState(null, "", `#rez=${state.cut.lat.toFixed(6)},${state.cut.lon.toFixed(6)},${Math.round(state.cut.bearing)},${r.left.toFixed(1)},${r.right.toFixed(1)}`);
}

$("#btn-copy-cut").onclick = async () => {
  if (!state.cut) return;
  const text = `${cutText(state.cut)} (${state.cut.name}) ${location.href}`;
  try { await navigator.clipboard.writeText(text); status("Poloha řezu je ve schránce."); }
  catch { prompt("Zkopírujte polohu řezu:", text); }
};

// Paste "lat, lon · azimut N°" (or a #rez= link) to jump to a cut.
function parseCut(text) {
  const m = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)(?:[^\d]+?(\d+(?:\.\d+)?)\s*°?)?/);
  const h = text.match(/#rez=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,([\d.]+),([\d.]+))?/);
  if (h) return { lat: +h[1], lon: +h[2], bearing: +h[3], reach: h[4] ? { left: +h[4], right: +h[5] } : null };
  if (!m) return null;
  return { lat: +m[1], lon: +m[2], bearing: m[3] !== undefined ? +m[3] + 90 : null };
}

$("#cut-goto").onchange = (e) => {
  const c = parseCut(e.target.value);
  if (!c) return status("Polohu jsem nepoznala. Vložte třeba: 50.082707, 14.419918 · azimut 344°");
  map.setView([c.lat, c.lon], 19);
  cutAt(c.lat, c.lon, false, c.bearing, c.reach);
  e.target.value = "";
};

function drawMtvu(polys) {
  mtvuLayer.clearLayers();
  for (const p of polys) {
    L.polygon(p.lonlat, {
      color: MTVU_COLORS[p.code] || "#8fbf55", weight: 1, fillOpacity: 0.25, interactive: false,
    }).addTo(mtvuLayer);
  }
}

// Live preview while dragging: the line follows the handle; the profile is recomputed on drop.
function previewCut(lat, lon, normal, skip, reach = state.cut.reach || defaultReach()) {
  const f = localFrame(lat, lon);
  const ll = cutEnds(f, normal, reach).map(([x, y]) => [y, x]);
  cutLine.setLatLngs(ll);
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
    const near = snapToWay(osmCache.way.geometry.map((g) => f.toXY(g.lon, g.lat)), [0, 0]);
    [lon, lat] = f.toLonLat(...near.point);
    dir = near.dir;
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
  const reach = { ...(state.cut.reach || defaultReach()), [side]: Math.max(MIN_REACH, Math.min(HALF, len)) };
  return { normal, reach };
}

endMarkers.forEach((m, i) => m.on("drag", () => {
  const { normal, reach } = endDrag(m, i);
  previewCut(state.cut.lat, state.cut.lon, normal, m, reach);
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

// ---------- profile ----------
function current() {
  return state.mode === "navrh" ? state.navrh : state.stav;
}

const MODE_LABEL = { stav: "Stav", navrh: "Návrh", porovnat: "Stav a návrh" };
function render() {
  document.querySelectorAll(".seg-toggle button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === state.mode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  });
  const box = $("#profile");
  document.body.dataset.mode = state.stav ? state.mode : "";
  $("#legend").hidden = !state.stav;
  $("#profile-head").hidden = !state.stav;
  $("#map-help").hidden = !state.stav;
  $("#stav-cta").hidden = !state.stav || state.mode !== "stav";
  if (state.stav) {
    $("#profile-sub").textContent = `Celkem ${fmtM(totalWidth(state.mode === "navrh" ? state.navrh : state.stav))}`;
    $("#mode-badge").textContent = MODE_LABEL[state.mode];
    $("#mode-badge").className = `badge badge-${state.mode}`;
  }
  if (!state.stav) {
    box.innerHTML = `<div class="empty">
      <img src="praha/t3-inbound.svg" alt="" width="96" height="126">
      <div><h2>Příčný profil pražské ulice</h2>
      <ol><li>Klikněte v mapě na ulici.</li><li>Profil od fasády k fasádě se sestaví z dat IPR a OSM.</li>
      <li>V režimu Návrh ho upravíte: táhněte hranice, klikněte na část, přidejte novou.</li></ol></div></div>`;
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    return;
  }
  if (state.mode === "porovnat") {
    box.replaceChildren();
    const changed = changedParts(state.stav, state.navrh);
    for (const [title, p, opts] of [["Stav", state.stav, {}], ["Návrh", state.navrh, { changed }]]) {
      const h = Object.assign(document.createElement("h3"), { className: "compare-title", textContent: title });
      if (opts.changed?.size) h.append(Object.assign(document.createElement("span"), { className: "muted", textContent: " · změněné části jsou obtažené" }));
      box.append(h, buildSvg(p, opts));
    }
    box.appendChild(diffList(state.stav, state.navrh));
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    renderWidthCheck();
    fitPhone(box);
    return;
  }
  const p = current();
  mountEditor(box, p, {
    selected: state.selected,
    onSelect: (i) => { state.selected = i; render(); },
    onChange: () => { edited(); render(); },
  });
  renderEditor(p);
  if (state.mode === "navrh") renderPalette(p);
  else $("#palette").replaceChildren();
  renderWidthCheck();
  renderRuleCheck(p, box);
  fitPhone(box);
}

// Parts of the design that differ from the current state: edited by hand, or (same parts in the
// same order) of another width.
function changedParts(a, b) {
  const same = a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type);
  const out = new Set();
  b.segments.forEach((s, i) => {
    if (same ? Math.abs(s.width - a.segments[i].width) >= 0.01 : s.source === "user") out.add(i);
  });
  return out;
}

// What the design changes, part by part: same parts in the same order compare width by width;
// otherwise the parts that came and went.
function diffList(a, b) {
  const div = Object.assign(document.createElement("div"), { className: "diff" });
  const name = (s) => TYPES[s.type]?.label || s.type;
  const items = [];
  if (a.segments.length === b.segments.length && a.segments.every((s, i) => s.type === b.segments[i].type)) {
    a.segments.forEach((s, i) => {
      const d = +(b.segments[i].width - s.width).toFixed(2);
      if (d) items.push({ i, text: `${name(s)}: ${fmtM(s.width)} → ${fmtM(b.segments[i].width)} (${d > 0 ? "+" : "−"}${fmtM(Math.abs(d))})` });
    });
  } else {
    const count = (p) => p.segments.reduce((m, s) => m.set(name(s), (m.get(name(s)) || 0) + s.width), new Map());
    const ca = count(a), cb = count(b);
    for (const k of new Set([...ca.keys(), ...cb.keys()])) {
      const wa = ca.get(k) || 0, wb = cb.get(k) || 0;
      if (Math.abs(wa - wb) >= 0.01) items.push({ text: `${k}: ${wa ? fmtM(wa) : "–"} → ${wb ? fmtM(wb) : "–"}` });
    }
  }
  div.innerHTML = `<h3>Změny v návrhu</h3>`;
  const ul = document.createElement("ul");
  for (const it of items.length ? items : [{ text: "Návrh je zatím stejný jako stav." }]) {
    const li = Object.assign(document.createElement("li"), { textContent: it.text });
    if (it.i !== undefined) {
      // Pointing at a change lights up that part in both profiles.
      const mark = (on) => document.querySelectorAll(`#profile g.seg[data-i="${it.i}"]`).forEach((g) => g.classList.toggle("hover", on));
      li.onmouseenter = () => mark(true);
      li.onmouseleave = () => mark(false);
    }
    ul.append(li);
  }
  div.append(ul);
  return div;
}

// Widths against the IPR manual (rules.js), in Návrh only: a list under the profile and the parts
// outlined in the drawing (red: below the minimum, orange: below the basic width). A click on a
// line selects that part.
function renderRuleCheck(p, box) {
  const el = $("#rule-check");
  if (state.mode !== "navrh") { el.hidden = true; return; }
  const found = checkRules(p);
  for (const f of found) box.querySelector(`g.seg[data-i="${f.i}"]`)?.classList.add(`warn-${f.level}`);
  if (!found.length) { el.hidden = true; return; }
  el.hidden = false;
  const ul = document.createElement("ul");
  for (const f of found) {
    const li = Object.assign(document.createElement("li"), { className: f.level, textContent: f.text });
    li.onclick = () => { state.selected = f.i; render(); };
    ul.append(li);
  }
  const head = Object.assign(document.createElement("div"), { textContent: "Šířky podle Manuálu tvorby veřejných prostranství IPR (C.2):" });
  el.replaceChildren(head, ul);
}

// The street is as wide as the current state (façade to façade): the design must fill exactly that
// width. Shown in Návrh and Porovnat; "Dorovnat" puts the difference into the selected part (or the
// widest one).
const fmtM = (v) => `${v.toFixed(2).replace(".", ",")} m`;
function renderWidthCheck() {
  const box = $("#width-check");
  if (!state.stav || !state.navrh || state.mode === "stav") { box.hidden = true; return; }
  const target = totalWidth(state.stav), now = totalWidth(state.navrh);
  const diff = +(now - target).toFixed(2);
  box.hidden = false;
  box.className = Math.abs(diff) < 0.01 ? "ok" : "off";
  if (Math.abs(diff) < 0.01) {
    box.textContent = `✓ Návrh drží šířku ulice ${fmtM(target)}`;
    return;
  }
  box.textContent = `Návrh je o ${fmtM(Math.abs(diff))} ${diff > 0 ? "širší" : "užší"} než ulice (${fmtM(target)}, návrh ${fmtM(now)}).`;
  if (state.mode !== "navrh") return;
  const segs = state.navrh.segments;
  // The selected part when it can take the difference, else the widest part that can.
  const fits = (x) => x && x.width - diff >= 0.5;
  const seg = fits(segs[state.selected]) ? segs[state.selected]
    : segs.filter(fits).reduce((b, x) => (!b || x.width > b.width ? x : b), null);
  if (!seg) return;
  const btn = document.createElement("button");
  btn.textContent = `Dorovnat: ${TYPES[seg.type]?.label || seg.type} na ${fmtM(seg.width - diff)}`;
  btn.onclick = () => {
    seg.width = +(seg.width - diff).toFixed(2);
    seg.source = "user";
    edited();
    render();
  };
  box.append(" ", btn);
}

// A wide street would shrink to unreadable: the profile keeps a minimum scale (px per cm of the drawing;
// more on a phone, where fingers need bigger targets) and scrolls sideways instead.
const MIN_SCALE = { phone: 0.17, desktop: 0.17 };
// The width goes into a CSS variable, so drawings the editor redraws while dragging keep it.
function fitPhone(box = $("#profile")) {
  const vbWidth = Math.max(0, ...[...box.querySelectorAll("svg")].map((svg) => Number(svg.getAttribute("viewBox")?.split(" ")[2]) || 0));
  const scale = matchMedia("(max-width: 760px)").matches ? MIN_SCALE.phone : MIN_SCALE.desktop;
  const width = Math.max(box.clientWidth, vbWidth * scale);
  box.style.setProperty("--fit-width", `${width}px`);
  box.closest("#profile-wrap")?.classList.toggle("scrolls", width > box.clientWidth + 1);
  scrollFade();
  requestAnimationFrame(() => fitLabels(box));
}

// Labels in the drawing keep a readable size on screen (k = drawing units per CSS pixel); a label
// wider than its part shrinks a little, and a name that still does not fit is left out.
const LABEL_PX = { "lbl-w": 13, "lbl-t": 11, "lbl-total": 14, "lbl-title": 13, "lbl-floor": 11 };
function fitLabels(box) {
  for (const svg of box.querySelectorAll("svg")) {
    const [, , vw, vh] = (svg.getAttribute("viewBox") || "").split(" ").map(Number);
    const rect = svg.getBoundingClientRect();
    // A height cap shrinks the drawing inside its box (preserveAspectRatio meet): use the tighter fit.
    const k = Math.max(vw / (rect.width || 1), vh / (rect.height || 1));
    if (!isFinite(k) || k <= 0) continue;
    // When any part is too narrow for "3,60 m", all widths go without the unit (it stays at Celkem).
    const widths = [...svg.querySelectorAll("text.lbl-w")];
    for (const t of widths) { t.dataset.full ??= t.textContent; t.dataset.row = 0; }
    const bare = widths.some((t) => t.dataset.full.length * 0.56 * LABEL_PX["lbl-w"] * k > Number(t.dataset.w));
    for (const t of widths) t.textContent = bare ? t.dataset.full.replace(/ m$/, "") : t.dataset.full;
    for (const t of svg.querySelectorAll("text.lbl-floor")) {
      // Floors over a slim building: the height is left out before the label runs into A/B.
      t.dataset.full ??= t.textContent;
      const short = t.dataset.full.split(" · ")[0];
      t.textContent = t.dataset.full.length * 0.56 * 10 * k > Number(t.dataset.w) ? short : t.dataset.full;
    }
    for (const t of svg.querySelectorAll("text.lbl-w, text.lbl-t, text.lbl-total, text.lbl-title, text.lbl-floor")) {
      const cls = ["lbl-w", "lbl-total", "lbl-t", "lbl-title", "lbl-floor"].find((c) => t.classList.contains(c));
      let size = LABEL_PX[cls] * k;
      const w = Number(t.dataset.w);
      const est = t.textContent.length * 0.56 * size;
      if (w && est > w * 0.96) size = Math.max((w * 0.96) / (t.textContent.length * 0.56), cls === "lbl-w" ? 11 * k : 10 * k);
      t.style.fontSize = `${size}px`;
      // The floor count above a building may reach past it (data-free), other names are left out.
      t.style.display = w && t.textContent.length * 0.56 * size > w * 1.05 && cls !== "lbl-w" && !t.dataset.free ? "none" : "";
    }
    // Rows under the ground (width, type, turns) are stacked by their screen size; when they need
    // more room than the drawing has below the ground, the drawing grows downwards.
    // Widths that would run into the one before drop a row (a narrow part has no name there).
    let prevEnd = -Infinity;
    for (const t of svg.querySelectorAll("text.lbl-w")) {
      const half = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, cx = Number(t.getAttribute("x"));
      if (cx - half < prevEnd + 4 * k) {
        t.dataset.row = 1;
        for (const n of t.parentNode.querySelectorAll("text.lbl-t:not(.lbl-floor)")) n.style.display = "none";
      } else prevEnd = cx + half;
    }
    // A width in the second row wins over a neighbour's name it would touch.
    const span = (t) => { const h = (t.textContent.length * 0.56 * parseFloat(t.style.fontSize)) / 2, x = Number(t.getAttribute("x")); return [x - h - 3 * k, x + h + 3 * k]; };
    for (const t of widths.filter((t) => t.dataset.row === "1")) {
      const [a, b] = span(t);
      for (const n of svg.querySelectorAll("text.lbl-t[data-row='1']")) {
        if (n.style.display === "none") continue;
        const [c, d] = span(n);
        if (c < b && d > a) n.style.display = "none";
      }
    }
    const GROUND = 760, H = 1000;
    const row = (n) => GROUND + 130 + LABEL_PX["lbl-w"] * k + (n > 0 ? n * 1.3 * LABEL_PX["lbl-t"] * k : 0);
    for (const t of svg.querySelectorAll("text[data-row]")) t.setAttribute("y", row(Number(t.dataset.row)));
    const bottom = Math.max(H, row(svg.querySelector("text[data-row='2']") ? 2 : 1) + 0.5 * LABEL_PX["lbl-t"] * k);
    const [vx, vy] = svg.getAttribute("viewBox").split(" ").map(Number);
    if (Math.abs(vy + vh - bottom) > 1) {
      svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${bottom - vy}`);
      svg.querySelector("rect.bg")?.setAttribute("height", bottom - vy);
    }
    layoutTop(svg, k);
    // The title tag (Stav / Návrh in Porovnat) wraps its text at the new size.
    const title = svg.querySelector("text.lbl-title"), bg = svg.querySelector("rect.title-bg");
    if (title && bg) {
      const b = title.getBBox(), pad = 7 * k;
      Object.entries({ x: b.x - pad * 1.4, y: b.y - pad, width: b.width + pad * 2.8, height: b.height + pad * 2, rx: pad * 1.2 })
        .forEach(([a, v]) => bg.setAttribute(a, v));
    }
  }
}
addEventListener("resize", () => fitPhone());

// The top row (total width, cut ends A/B) at a readable size, and the view starting just above the
// highest thing drawn: no empty sky over a street without tall buildings, no label over a roof.
function layoutTop(svg, k) {
  const [vx, vy, vw, vh] = svg.getAttribute("viewBox").split(" ").map(Number);
  let top = Infinity;
  for (const c of svg.children) {
    if (c.matches("rect.bg, .top-row, .title-bg, .lbl-title, .handle")) continue;
    if (c.dataset.top) {
      // A torn building: its visible top and the floor label over it.
      const label = c.querySelector(".lbl-floor");
      top = Math.min(top, Number(c.dataset.top), label && label.style.display !== "none" ? label.getBBox().y : Infinity);
      continue;
    }
    const b = c.getBBox();
    if (b.width && b.height) top = Math.min(top, b.y);
  }
  if (!isFinite(top)) return;
  const r = 10 * k, pad = 8 * k;
  const y0 = Math.min(top - 2 * r - pad - 10 * k, 160);
  svg.setAttribute("viewBox", `${vx} ${y0} ${vw} ${vy + vh - y0}`);
  const bg = svg.querySelector("rect.bg");
  bg?.setAttribute("y", y0);
  bg?.setAttribute("height", vy + vh - y0);
  const cy = y0 + pad + r;
  for (const e of svg.querySelectorAll(".top-row")) {
    if (e.tagName === "circle") { e.setAttribute("cy", cy); e.setAttribute("r", r); e.setAttribute("stroke-width", 1.5 * k); }
    else if (e.classList.contains("lbl-total")) e.setAttribute("y", cy + 0.36 * parseFloat(e.style.fontSize || 14 * k));
    else { e.style.fontSize = `${13 * k}px`; e.setAttribute("y", cy + 0.36 * 13 * k); }
  }
}

// A wide profile that scrolls fades out on the side where more of it is hidden.
function scrollFade() {
  const wrap = $("#profile-wrap");
  const more = wrap.classList.contains("scrolls");
  wrap.classList.toggle("fade-l", more && wrap.scrollLeft > 4);
  wrap.classList.toggle("fade-r", more && wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 4);
  $("#scroll-hint").hidden = !more;
  document.querySelector(".scroll-btn.l").hidden = !wrap.classList.contains("fade-l");
  document.querySelector(".scroll-btn.r").hidden = !wrap.classList.contains("fade-r");
}
for (const b of document.querySelectorAll(".scroll-btn")) {
  b.onclick = () => { const wrap = $("#profile-wrap"); wrap.scrollBy({ left: Number(b.dataset.dir) * wrap.clientWidth * 0.7, behavior: "smooth" }); };
}
$("#profile-wrap").addEventListener("scroll", scrollFade, { passive: true });

// ---------- splitter between the map and the profile ----------
// Desktop: the map's width in % of the window; phone (≤ 760 px): the map's height in % of the screen.
// The share is remembered per layout in localStorage.
const SPLIT_KEY = "streetdesign-split";
const splitter = $("#splitter");
const phoneLayout = () => matchMedia("(max-width: 760px)").matches;
function applySplit(share) {
  const phone = phoneLayout();
  const v = Math.max(phone ? 20 : 15, Math.min(phone ? 80 : 80, share));
  document.querySelector("main").style.setProperty("--map-size", phone ? `${v}vh` : `${v}%`);
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
if (savedSplit() !== undefined) applySplit(savedSplit());
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

function edited() {
  if (state.mode === "navrh") state.navrhEdited = true;
  save();
}

function renderEditor(p) {
  const ed = $("#editor");
  ed.replaceChildren();
  const i = state.selected;
  const s = p.segments[i];
  if (s === undefined) {
    ed.innerHTML = `<div class="ed-head"><h3>Okraje ulice</h3><span class="muted">Klikněte na část profilu a upravte ji. Šířku změníte tažením modrých úchytů mezi částmi.</span></div>`;
    for (const [side, text] of [["left", "Levý okraj"], ["right", "Pravý okraj"]]) {
      const sel = document.createElement("select");
      // A building can be given its look by hand; "budova" alone lets the app guess it.
      const current = (p.edges?.[side] || "volno") + (p.edges?.[`${side}Style`] ? ":" + p.edges[`${side}Style`] : "");
      const guess = BUILDING_STYLES[buildingStyle(p.edges?.[`${side}Info`])];
      const kinds = [["budova", `budova (odhad: ${guess})`], ...Object.entries(BUILDING_STYLES).map(([k, t]) => [`budova:${k}`, `budova – ${t}`]),
        ["stavba", "drobná stavba"], ["zahrada", "zahrada, louka"], ["zelen", "zeleň, louka"], ["voda", "voda"], ["parkoviste", "parkoviště"], ["plot", "plot"], ["volno", "volný prostor"]];
      for (const [k, t] of kinds) sel.add(new Option(t, k, false, current === k));
      sel.onchange = () => {
        const [kind, style] = sel.value.split(":");
        p.edges = { ...p.edges, [side]: kind };
        if (style) p.edges[`${side}Style`] = style;
        else delete p.edges[`${side}Style`];
        edited();
        render();
      };
      const l = document.createElement("label");
      l.append(text, sel);
      ed.append(l);
    }
    return;
  }
  const type = document.createElement("select");
  for (const [k, t] of Object.entries(TYPES)) type.add(new Option(t.label, k, false, k === s.type));
  type.onchange = () => { s.type = type.value; s.source = "user"; done(); };
  const width = Object.assign(document.createElement("input"), { type: "number", step: 0.05, min: 0.2, value: s.width });
  width.onchange = () => {
    // Perpendicular parking keeps at least 4.5 m (ČSN 73 6056).
    const min = s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2;
    s.width = Math.max(min, +(+width.value).toFixed(2));
    s.source = "user";
    done();
  };
  const lab = (text, input) => { const l = document.createElement("label"); l.append(text, input); return l; };
  const btn = (text, fn, cls) => { const b = document.createElement("button"); b.textContent = text; b.onclick = fn; if (cls) b.className = cls; return b; };
  const segs = p.segments;
  const done = (sel = state.selected) => { state.selected = sel; edited(); render(); };
  // A headed card in rows: what it is and how wide, how it is used, what to do with it.
  const head = Object.assign(document.createElement("div"), { className: "ed-head" });
  head.innerHTML = `<h3>Vybraná část: ${TYPES[s.type]?.label || s.type}</h3><span class="muted">Zdroj: ${SOURCES[s.source]?.label || s.source}</span>`;
  head.append(btn("×", () => { state.selected = null; render(); }, "close"));
  head.lastChild.setAttribute("aria-label", "Zavřít výběr");
  const row = () => ed.appendChild(Object.assign(document.createElement("div"), { className: "ed-row" }));
  const step = (d) => btn(d > 0 ? "+" : "−", () => { s.width = Math.max(minW(), +(s.width + d).toFixed(2)); s.source = "user"; done(); }, "step");
  const minW = () => (s.type === "parkovani" && s.orient === "kolme" ? 4.5 : 0.2);
  ed.append(head);
  const r1 = row();
  const wbox = Object.assign(document.createElement("span"), { className: "stepper" });
  wbox.append(step(-0.25), width, step(0.25));
  r1.append(lab("Typ", type), lab("Šířka (m)", wbox));
  const r2 = row();
  if (TYPES[s.type]?.directional) {
    r2.append(lab("Směr jízdy", btn(s.dir === "backward" ? "↓ k divákovi" : "↑ od diváka", () => { s.dir = s.dir === "backward" ? "forward" : "backward"; done(); })));
  }
  if (s.type === "parkovani") {
    const use = document.createElement("select");
    for (const [v, t] of [["", "běžné"], ...Object.entries(PARKING_USE)]) use.add(new Option(t, v, false, (s.use || "") === v));
    use.onchange = () => { if (use.value) s.use = use.value; else delete s.use; s.source = "user"; done(); };
    r2.append(lab("Účel", use));
    const orient = document.createElement("select");
    for (const [v, t] of [["podelne", "podélné"], ["sikme", "šikmé"], ["kolme", "kolmé"]]) {
      orient.add(new Option(t, v, false, (s.orient || "podelne") === v));
    }
    orient.onchange = () => {
      s.orient = orient.value;
      // ČSN 73 6056: perpendicular stalls 5.0 m deep (4.5 m with overhang), angled about 4.5 m.
      if (s.orient === "kolme" && s.width < 4.5) s.width = 5;
      if (s.orient === "sikme" && s.width < 3.5) s.width = 4.5;
      s.source = "user";
      done();
    };
    r2.append(lab("Stání", orient));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(s.type)) {
    const turn = document.createElement("select");
    for (const [v, t] of [["", "bez šipky"], ["left", "vlevo"], ["left;through", "vlevo + rovně"], ["through", "rovně"],
      ["through;right", "rovně + vpravo"], ["right", "vpravo"], ["left;right", "vlevo + vpravo"]]) {
      turn.add(new Option(t, v, false, (s.turn || "") === v));
    }
    turn.onchange = () => { if (turn.value) s.turn = turn.value; else delete s.turn; s.source = "user"; done(); };
    r2.append(lab("Šipky na vozovce", turn));
  }
  // Items (furniture, barriers) inside the segment: remove, or add one in the middle.
  const items = document.createElement("span");
  items.className = "items";
  items.textContent = "Prvky: ";
  (s.items || []).forEach((it, k) => {
    items.append(btn(`${ITEMS[it.kind] || it.kind} ×`, () => { s.items.splice(k, 1); done(); }, "tag"));
  });
  const add = document.createElement("select");
  add.add(new Option("+ přidat prvek", ""));
  for (const [k, t] of Object.entries(ITEMS)) add.add(new Option(t, k));
  add.onchange = () => { if (!add.value) return; (s.items ||= []).push({ kind: add.value, f: 0.5 }); done(); };
  items.append(add);
  r2.append(items);
  row().append(
    btn("← Posunout", () => { if (i > 0) { [segs[i - 1], segs[i]] = [segs[i], segs[i - 1]]; done(i - 1); } }),
    btn("Posunout →", () => { if (i < segs.length - 1) { [segs[i + 1], segs[i]] = [segs[i], segs[i + 1]]; done(i + 1); } }),
    btn("Rozdělit na dvě", () => { const h = +(s.width / 2).toFixed(2); segs.splice(i, 1, { ...s, width: h, source: "user" }, { ...s, width: +(s.width - h).toFixed(2), source: "user" }); done(); }),
    Object.assign(document.createElement("span"), { className: "spacer" }),
    btn("Smazat část", () => { segs.splice(i, 1); done(null); }, "danger"),
  );
}

// Parts to add, grouped as people look for them.
const PALETTE_GROUPS = [
  ["Pro pěší", ["chodnik", "chodnik_kola", "stezka_sdilena", "nastupiste"]],
  ["Kola", ["cyklopruh", "ochranny_pruh", "pruh_piktokoridor", "cyklostezka"]],
  ["Auta a autobusy", ["pruh", "parkovani", "bus", "bus_cyklo", "obsluzna", "krajnice"]],
  ["Tramvaj", ["tramvaj_v_pruhu", "tramvaj"]],
  ["Zeleň a ostatní", ["zelen", "stromorad", "predzahradka", "delici", "plocha", "zahradka", "voda", "zed"]],
];
function renderPalette(p) {
  const pal = $("#palette");
  pal.replaceChildren();
  const hint = document.createElement("div");
  hint.className = "pal-title";
  hint.textContent = state.selected === null ? "Přidat díl na konec" : "Přidat díl vpravo od vybraného";
  pal.append(hint);
  const shown = new Set(PALETTE_GROUPS.flatMap(([, ks]) => ks));
  const rest = Object.keys(TYPES).filter((k) => !shown.has(k) && k !== "nezname");
  for (const [title, keys] of [...PALETTE_GROUPS, ["Další", rest]]) {
    const list = keys.filter((k) => TYPES[k]);
    if (!list.length) continue;
    const group = Object.assign(document.createElement("div"), { className: "pal-group" });
    group.append(Object.assign(document.createElement("span"), { className: "pal-name", textContent: title }));
    for (const k of list) {
      const t = TYPES[k];
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.style.setProperty("--c", t.color);
      chip.textContent = t.label;
      chip.onclick = () => {
        const at = state.selected === null ? p.segments.length : state.selected + 1;
        const seg = { type: k, width: DEFAULT_WIDTH[k], source: "user" };
        if (t.directional) seg.dir = "forward";
        p.segments.splice(at, 0, seg);
        state.selected = at;
        edited();
        render();
      };
      group.append(chip);
    }
    pal.append(group);
  }
}

document.querySelectorAll(".seg-toggle button").forEach((b) => b.addEventListener("click", () => {
  state.mode = b.dataset.mode;
  state.selected = null;
  // Until the proposal is edited, it follows the current (possibly corrected) existing state.
  if (state.stav && !state.navrhEdited) state.navrh = structuredClone(state.stav);
  render();
}));

// Illustrations: Prague ones or Streetmix, remembered per browser.
const ART_KEY = "profily-ilustrace";
function showArt() {
  $("#btn-art").setAttribute("aria-checked", String(getArt() === "praha"));
}
try { if (localStorage.getItem(ART_KEY) === "streetmix") setArt("streetmix"); } catch {}
showArt();
$("#btn-art").addEventListener("click", () => {
  setArt(getArt() === "praha" ? "streetmix" : "praha");
  try { localStorage.setItem(ART_KEY, getArt()); } catch {}
  showArt();
  render();
});

$("#btn-to-navrh").onclick = () => document.querySelector('.seg-toggle button[data-mode="navrh"]').click();

// The header menus close after a choice or a click elsewhere.
document.addEventListener("click", (e) => {
  for (const d of document.querySelectorAll("details.menu[open]")) {
    if (!d.contains(e.target) || e.target.closest(".menu-list button")) d.open = false;
  }
});

// ---------- export, save, load ----------
function exportSvgs() {
  const title = state.cut?.name || "Profil";
  if (state.mode === "porovnat" || !state.stav) {
    return [buildSvg(state.stav, { title: `${title} – stav`, credits: true }), buildSvg(state.navrh, { title: `${title} – návrh`, credits: true })];
  }
  return [buildSvg(current(), { title: `${title} – ${state.mode === "navrh" ? "návrh" : "stav"}`, credits: true })];
}

function download(name, blob) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const fileBase = () => (state.cut?.name || "profil").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();

$("#btn-export-svg").onclick = () => {
  if (!state.stav) return;
  download(`${fileBase()}-${state.mode}.svg`, new Blob([svgString(exportSvgs())], { type: "image/svg+xml" }));
};

$("#btn-export-png").onclick = async () => {
  if (!state.stav) return;
  const text = svgString(exportSvgs());
  const vb = text.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
  const img = new Image();
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text)));
  await img.decode();
  const scale = 0.6; // px per cm
  const canvas = Object.assign(document.createElement("canvas"), { width: vb[2] * scale, height: vb[3] * scale });
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((b) => download(`${fileBase()}-${state.mode}.png`, b), "image/png");
};

$("#btn-streetmix").onclick = async () => {
  if (!state.stav) return;
  const p = state.mode === "navrh" ? state.navrh : state.stav;
  const name = `${state.cut?.name || "Ulice"}${state.mode === "navrh" ? " – návrh" : ""}`;
  // A new tab opened right away, still inside the click: popup blockers (Safari) allow only that.
  // The street is created afterwards and the tab is sent to it.
  const win = window.open("about:blank", "_blank");
  status("Vytvářím ulici ve Streetmixu…");
  try {
    const { url } = await sources.streetmix(toStreetmix(p, name));
    if (win) win.location = url;
    // Always a clickable link too, in case the browser blocked the tab.
    const a = Object.assign(document.createElement("a"), { href: url, target: "_blank", rel: "noopener", textContent: url });
    $("#status").replaceChildren("Ulice ve Streetmixu: ", a);
    document.body.classList.remove("loading");
  } catch (err) {
    win?.close();
    status("Streetmix ulici nevytvořil: " + err.message);
  }
};

$("#btn-save").onclick = () => {
  if (!state.stav) return;
  const data = { app: "streetdesign-pilot", version: 1, cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited };
  download(`${fileBase()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
};

$("#file-load").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    restore(JSON.parse(await file.text()));
  } catch (err) {
    status("Soubor se nepodařilo načíst: " + err.message);
  }
  e.target.value = "";
};

function restore(data) {
  if (!data?.stav?.segments) throw new Error("chybí profil");
  Object.assign(state, { cut: data.cut, stav: data.stav, navrh: data.navrh || structuredClone(data.stav), navrhEdited: !!data.navrhEdited, selected: null });
  if (state.cut) {
    map.setView([state.cut.lat, state.cut.lon], 19);
    const f = localFrame(state.cut.lat, state.cut.lon);
    const r = (state.cut.bearing * Math.PI) / 180;
    const n = [-Math.cos(r), Math.sin(r)];
    drawCut(cutEnds(f, n, state.cut.reach || defaultReach()));
    $("#street-name").textContent = state.cut.name;
    showCutInfo();
  }
  save();
  render();
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ cut: state.cut, stav: state.stav, navrh: state.navrh, navrhEdited: state.navrhEdited }));
  } catch {}
}

await loadSprites();
const linked = location.hash.startsWith("#rez=") ? parseCut(location.hash) : null;
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved?.stav && !linked) restore(saved);
  else render();
} catch {
  render();
}
if (linked) {
  map.setView([linked.lat, linked.lon], 19);
  cutAt(linked.lat, linked.lon, false, linked.bearing, linked.reach);
}
