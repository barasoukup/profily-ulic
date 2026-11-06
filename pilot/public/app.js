import { TYPES, SOURCES, DEFAULT_WIDTH, ITEMS, PARKING_USE } from "./types.js";
import { localFrame, nearestStreet, snapToWay, awayFromJunctions, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } from "./derive.js";
import { loadSprites, buildSvg, mountEditor, svgString, totalWidth } from "./profile.js";
import { toStreetmix } from "./streetmix.js";
import * as sources from "./sources.js";

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
      ...(this.options.layers ? { layers: this.options.layers } : {}),
    });
  },
});
const BIG_TILES = { tileSize: 512, zoomOffset: -1 };
const ipr = (path, attribution, extra = {}) =>
  new ArcgisExport("", { service: `${GS}/${path}`, maxZoom: 21, ...BIG_TILES, attribution: `${attribution} © IPR Praha`, ...extra });

const baseMaps = {
  "Základní mapa IPR": ipr("arcgis/rest/services/map/zakladni_mapa/MapServer", "základní mapa"),
  "Černobílá IPR": ipr("arcgis/rest/services/map/zakladni_mapa_cernobila/MapServer", "základní mapa"),
  // Dark: the black-and-white map inverted in the browser (IPR's dark style is not a public service).
  "Tmavá IPR": ipr("arcgis/rest/services/map/zakladni_mapa_cernobila/MapServer", "základní mapa", { className: "tiles-dark" }),
  "Zástavba IPR": ipr("arcgis/rest/services/dtmp/dtmp/MapServer", "plochy budov technické mapy", { layers: "show:14", className: "tiles-zastavba" }),
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
let baseName = "Základní mapa IPR";
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
    const [m, k, pk] = await Promise.allSettled([
      sources.mtvu(bbox), sources.linie(bbox), sources.parkovani(bbox),
    ]);
    if (m.status === "fulfilled") polys = mtvuPolygons(m.value, frame);
    else console.warn("MTVU", m.reason);
    let lines = [];
    if (k.status === "fulfilled") { tracks = trackLines(k.value, frame); lines = techLines(k.value, frame); }
    else console.warn("koleje", k.reason);
    const parking = pk.status === "fulfilled" ? esriPolygons(pk.value, frame) : [];
    if (pk.status !== "fulfilled") console.warn("parkovani", pk.reason);
    const result = deriveProfile({ center: [0, 0], dir, half: HALF, polys, osm, frame, way: near.way, tracks, parking, lines, reach });
    const name = near.way.tags.name || near.way.tags.ref || `ulice ${near.way.id}`;
    state.cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name, reach };
    // Floors of the buildings at both ends from IPR "Podlažnosti" (OSM building:levels as fallback).
    await Promise.all(["left", "right"].map(async (side) => {
      const info = result.edges[`${side}Info`];
      if (!info?.point) return;
      try {
        const [lon, lat] = info.point;
        const p = await sources.podlaznost(lat, lon);
        if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.total || p.cornice + p.roof, src: "ipr" });
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
    $("#street-name").textContent = `${name} · ${near.way.tags.highway}` + (polys.length ? "" : " · mimo technickou mapu, jen odhad");
    status(!polys.length ? "Technická mapa tu nic nevrátila, profil je odhad z OSM."
      : result.notice ? result.notice
      : result.junction ? "Řez nejspíš vede křižovatkou. Posuňte ho tažením středu do úseku mezi křižovatkami." : "");
    save();
    render();
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

function render() {
  document.querySelectorAll(".seg-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.mode === state.mode));
  const box = $("#profile");
  if (!state.stav) {
    box.innerHTML = '<p class="muted">Klikněte v mapě na ulici a tady se objeví její příčný profil.</p>';
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
    return;
  }
  if (state.mode === "porovnat") {
    box.replaceChildren();
    for (const [title, p] of [["Stav", state.stav], ["Návrh", state.navrh]]) {
      box.appendChild(buildSvg(p, { title }));
    }
    $("#editor").replaceChildren();
    $("#palette").replaceChildren();
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
  renderPalette(p);
  fitPhone(box);
}

// On a phone a wide street would shrink to unreadable: the profile keeps a minimum scale
// (PHONE_SCALE px per cm of the drawing) and scrolls sideways instead.
const PHONE_SCALE = 0.17;
// The width goes into a CSS variable (used only by the phone media query), so drawings the editor
// redraws while dragging keep it and a desktop window ignores it.
function fitPhone(box = $("#profile")) {
  const vbWidth = Math.max(0, ...[...box.querySelectorAll("svg")].map((svg) => Number(svg.getAttribute("viewBox")?.split(" ")[2]) || 0));
  box.style.setProperty("--phone-width", `${Math.max(box.clientWidth, vbWidth * PHONE_SCALE)}px`);
}
addEventListener("resize", () => fitPhone());

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
    ed.innerHTML = `<span class="muted">Vyberte část profilu kliknutím. Šířky měníte tažením svislých čar. Celková šířka ${totalWidth(p).toFixed(2).replace(".", ",")} m.</span>`;
    for (const [side, text] of [["left", "Levý okraj"], ["right", "Pravý okraj"]]) {
      const sel = document.createElement("select");
      for (const [k, t] of [["budova", "budova"], ["stavba", "drobná stavba"], ["zahrada", "zahrada, louka"], ["zelen", "zeleň, louka"], ["voda", "voda"], ["parkoviste", "parkoviště"], ["volno", "volný prostor"]]) {
        sel.add(new Option(t, k, false, (p.edges?.[side] || "volno") === k));
      }
      sel.onchange = () => { p.edges = { ...p.edges, [side]: sel.value }; edited(); render(); };
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
  ed.append(lab("Typ", type), lab("Šířka (m)", width));
  if (TYPES[s.type]?.directional) {
    ed.append(btn(s.dir === "backward" ? "Směr ↓" : "Směr ↑", () => { s.dir = s.dir === "backward" ? "forward" : "backward"; done(); }));
  }
  if (s.type === "parkovani") {
    const use = document.createElement("select");
    for (const [v, t] of [["", "běžné"], ...Object.entries(PARKING_USE)]) use.add(new Option(t, v, false, (s.use || "") === v));
    use.onchange = () => { if (use.value) s.use = use.value; else delete s.use; s.source = "user"; done(); };
    ed.append(lab("Účel", use));
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
    ed.append(lab("Stání", orient));
  }
  if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(s.type)) {
    const turn = document.createElement("select");
    for (const [v, t] of [["", "bez šipky"], ["left", "vlevo"], ["left;through", "vlevo + rovně"], ["through", "rovně"],
      ["through;right", "rovně + vpravo"], ["right", "vpravo"], ["left;right", "vlevo + vpravo"]]) {
      turn.add(new Option(t, v, false, (s.turn || "") === v));
    }
    turn.onchange = () => { if (turn.value) s.turn = turn.value; else delete s.turn; s.source = "user"; done(); };
    ed.append(lab("Řazení", turn));
  }
  ed.append(
    btn("← Posunout", () => { if (i > 0) { [segs[i - 1], segs[i]] = [segs[i], segs[i - 1]]; done(i - 1); } }),
    btn("Posunout →", () => { if (i < segs.length - 1) { [segs[i + 1], segs[i]] = [segs[i], segs[i + 1]]; done(i + 1); } }),
    btn("Rozdělit", () => { const h = +(s.width / 2).toFixed(2); segs.splice(i, 1, { ...s, width: h, source: "user" }, { ...s, width: +(s.width - h).toFixed(2), source: "user" }); done(); }),
    btn("Smazat", () => { segs.splice(i, 1); done(null); }, "danger"),
    btn("Zavřít", () => { state.selected = null; render(); }),
  );
  // Items (furniture, barriers) inside the segment: remove, or add one in the middle.
  const items = document.createElement("span");
  items.textContent = "Prvky: ";
  (s.items || []).forEach((it, k) => {
    items.append(btn(`${ITEMS[it.kind] || it.kind} ×`, () => { s.items.splice(k, 1); done(); }));
  });
  const add = document.createElement("select");
  add.add(new Option("+ přidat prvek", ""));
  for (const [k, t] of Object.entries(ITEMS)) add.add(new Option(t, k));
  add.onchange = () => { if (!add.value) return; (s.items ||= []).push({ kind: add.value, f: 0.5 }); done(); };
  items.append(add);
  ed.append(items);
  const src = document.createElement("span");
  src.className = "muted";
  src.textContent = "Zdroj: " + (SOURCES[s.source]?.label || s.source);
  ed.append(src);
}

function renderPalette(p) {
  const pal = $("#palette");
  pal.replaceChildren();
  const hint = document.createElement("span");
  hint.className = "muted";
  hint.textContent = state.selected === null ? "Přidat na konec:" : "Přidat vpravo od vybrané části:";
  pal.append(hint);
  for (const [k, t] of Object.entries(TYPES)) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = "+ " + t.label;
    chip.onclick = () => {
      const at = state.selected === null ? p.segments.length : state.selected + 1;
      const seg = { type: k, width: DEFAULT_WIDTH[k], source: "user" };
      if (t.directional) seg.dir = "forward";
      p.segments.splice(at, 0, seg);
      state.selected = at;
      edited();
      render();
    };
    pal.append(chip);
  }
}

document.querySelectorAll(".seg-toggle button").forEach((b) => b.addEventListener("click", () => {
  state.mode = b.dataset.mode;
  state.selected = null;
  // Until the proposal is edited, it follows the current (possibly corrected) existing state.
  if (state.stav && !state.navrhEdited) state.navrh = structuredClone(state.stav);
  render();
}));

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
  // Open the window right away (popup blockers allow it only within the click).
  const win = window.open("about:blank", "_blank");
  status("Vytvářím ulici ve Streetmixu…");
  try {
    const { url } = await sources.streetmix(toStreetmix(p, name));
    if (win) win.location = url; else window.open(url, "_blank");
    status(`Ulice ve Streetmixu: ${url}`);
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
