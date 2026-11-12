// The data a profile was computed from, drawn on the map around the cut: parking (sections and stalls of the
// city, TSK's no-parking parts, OSM parking areas, Prague's paid zones), points (trees, lamps, poles, stop
// poles, bollards, benches, bike racks, shelters), barrier and slope lines, tram tracks, OSM street axes and
// the buildings of the facades. Only what the click already has: nothing is asked here (Bára: a click must
// stay fast, the servers are asked considerately). Each group is an overlay of the layer control, remembered
// per viewer; everything lies in panes under the cut line, so the cut and its handles stay on top.
// Colours as in the profile's legend: the fill of a part by its type (types.js TYPES), the outline by its
// source (SOURCES). A point within the reach of the cut (derive.js REACH) and the profile's ends is filled,
// one out of reach is hollow.
import { TYPES, SOURCES, ITEMS } from "./types.js";
import { REACH, reachOf, classGroup, orientFromStalls, nodeItem, POINT_ITEM, TECH_ITEM, BARRIER_ITEM } from "./derive.js";
import { OD_TREE, OD_ROW, OD_SECTION, zpsZones } from "./sources.js";
import { city } from "./city.js";
// tr: t is the name of the tags and of a point's place here.
import { t as tr } from "./i18n.js";

export const PLOCHY_PANE = "rezPlochy"; // the technical map's areas (app.js drawMtvu)
const PANES = { rezZps: 390, [PLOCHY_PANE]: 391, rezBudovy: 392, rezParkovani: 393, rezLinie: 394, rezBody: 395 }; // under the cut (overlayPane 400)
const WINDOW = 70; // features within this of the cut, across and along (m)
const ZPS_NEAR = 100; // Prague's paid zones this close to the cut (m), as sources.js zps
const TM_TREE = 83130; // technical map: strom mimo park
const STORE = "streetdesign-datalayers";
const GROUPS = [
  ["parking", tr("Parkování u řezu (místní data)"), true],
  ["parkingOsm", tr("Parkování u řezu (OSM)"), true],
  ["points", tr("Body u řezu (stromy, lampy…)"), true],
  ["lines", tr("Ploty, zdi a svahy u řezu"), false],
  ["tracks", tr("Koleje u řezu"), false],
  ["axes", tr("Osy ulic z OSM"), false],
  ["buildings", tr("Budovy u řezu"), false],
  ["reach", tr("Dosah bodů od řezu"), false],
];
const ORIENT_LABEL = { podelne: tr("podélné"), sikme: tr("šikmé"), kolme: tr("kolmé") };
const ORIENT_OSM = { parallel: tr("podélné"), diagonal: tr("šikmé"), perpendicular: tr("kolmé") };
const PARKING_KIND = { useky: tr("úsek placeného stání"), ztp: tr("stání ZTP"), zasobovani: tr("zásobování"), specialni: tr("vyhrazené stání") };
const STREET_PARKING = new Set(["street_side", "lane", "on_kerb", "half_on_kerb", "shoulder"]); // as derive.js
const LINE_COLOR = { plot: "#6d6a62", oporna_zed: "#6d6a62", zabradli: "#4a6f8a", svodidlo: "#8a8780", zivy_plot: "#5f8f3a", svah: "#a08a5a" };
const TREE = TYPES.stromorad.color, FURNITURE = "#3d3d3a";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function insideRing(ring, x, y) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// The groups, added to the layer control (control: L.control.layers) and to the map as the viewer left them.
export function createDataLayers(map, control) {
  for (const [name, z] of Object.entries(PANES)) {
    const pane = map.getPane(name) || map.createPane(name);
    pane.style.zIndex = z;
    // The zone boxes overlap: drawn opaque in a pane that is itself faint, their union is one even tint.
    if (name === "rezZps") pane.style.opacity = 0.12;
  }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch {}
  const groups = {}, byName = {};
  for (const [key, name, on] of GROUPS) {
    groups[key] = L.layerGroup();
    byName[name] = key;
    control.addOverlay(groups[key], name);
    if (saved[key] ?? on) groups[key].addTo(map);
  }
  const remember = (e) => {
    const key = byName[e.name];
    if (!key) return;
    saved[key] = e.type === "overlayadd";
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch {}
  };
  map.on("overlayadd overlayremove", remember);
  let drawn = 0; // the generation of the drawing: a late answer (the zones file) of an older cut is dropped

  const clear = () => { drawn++; for (const g of Object.values(groups)) g.clearLayers(); };

  // ctx: the cut's local frame (centre = the cut), the street direction dir, the profile's span {left, right}
  // (m from the axis, + left), and the data as derive.js reads it (local coordinates) or as OSM gives it.
  function draw({ frame, dir, osm, way, polys = [], tracks = [], lines = [], parking = [], span, facades = [] }) {
    clear();
    const gen = drawn;
    const normal = [-dir[1], dir[0]];
    const ll = ([x, y]) => { const [lon, lat] = frame.toLonLat(x, y); return [lat, lon]; };
    const near = ([x, y]) => Math.abs(x) <= WINDOW && Math.abs(y) <= WINDOW;
    const nearAny = (pts) => pts.some(near);
    const xyOf = (g) => frame.toXY(g.lon, g.lat);
    const tip = (layer, html) => layer.bindTooltip(html, { sticky: true, direction: "top", offset: [0, -4], opacity: 0.95 });
    const shape = (opts) => ({ interactive: true, bubblingMouseEvents: true, ...opts });
    // Along the street and across it (+ left), as derive.js measures a point against the cut.
    const place = ([x, y]) => ({ t: x * normal[0] + y * normal[1], along: Math.abs(x * normal[1] - y * normal[0]) });
    const inSpan = (t) => t <= span.left + 0.5 && t >= -span.right - 0.5;
    const elements = osm?.elements || [];

    // ---------- parking ----------
    const P = { pane: "rezParkovani", weight: 1 };
    for (const p of parking) {
      if (!nearAny(p.rings[0])) continue;
      const rings = p.rings.map((r) => r.map(ll));
      if (p.kind === "zakaz") {
        tip(L.polygon(rings, shape({ ...P, color: "#c0392b", fillColor: "#e24b4a", fillOpacity: 0.22, dashArray: "3 3", weight: 1.5 })).addTo(groups.parking),
          `<b>${tr("Zákaz stání")}</b><br>${esc(city.parkingSource)}`);
        continue;
      }
      const orient = p.kind === "useky" ? orientFromStalls(p, dir) : undefined;
      const what = [PARKING_KIND[p.kind] || tr("parkování"), orient && tr("{orient} stání (podle počtu míst)", { orient: ORIENT_LABEL[orient] }), p.count > 1 && tr("{n} míst", { n: p.count }), p.guess && tr("poloha odhadnutá")].filter(Boolean).join(" · ");
      tip(L.polygon(rings, shape({
        ...P, color: p.guess ? SOURCES.odhad.color : SOURCES.tsk.color, fillColor: TYPES.parkovani.color,
        fillOpacity: p.guess ? 0.15 : 0.4, ...(p.kind !== "useky" || p.guess ? { dashArray: "4 3" } : {}),
      })).addTo(groups.parking), `<b>${tr("Parkování")}</b><br>${esc(what)}<br>${esc(city.parkingSource)}`);
    }
    for (const el of elements) {
      if (el.type !== "area" || el.tags?.amenity !== "parking") continue;
      const ring = el.geometry.map(xyOf);
      if (!nearAny(ring)) continue;
      const street = STREET_PARKING.has(el.tags.parking);
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => [g.lat, g.lon]));
      const what = [street ? tr("stání u ulice") : tr("parkoviště"), ORIENT_OSM[el.tags.orientation], el.tags.capacity && tr("{n} míst", { n: el.tags.capacity })].filter(Boolean).join(" · ");
      tip(L.polygon(rings, shape({ ...P, color: SOURCES.osm.color, fillColor: TYPES.parkovani.color, fillOpacity: street ? 0.35 : 0.12, dashArray: street ? null : "2 3" })).addTo(groups.parkingOsm),
        `<b>${tr("Parkování (OSM)")}</b><br>${esc(what)}`);
    }
    // Prague's paid zones near the cut, as a faint tint: the boxes of their parts that the zone file keeps (sources.js
    // zpsZones); their edge is roughly the zone's boundary.
    if (city.id === "praha") {
      zpsZones().then((boxes) => {
        if (!boxes || gen !== drawn) return;
        const [lon0, lat0] = frame.toLonLat(-ZPS_NEAR - WINDOW, -ZPS_NEAR - WINDOW), [lon1, lat1] = frame.toLonLat(ZPS_NEAR + WINDOW, ZPS_NEAR + WINDOW);
        for (const [x0, y0, x1, y1] of boxes) {
          if (x1 < lon0 || x0 > lon1 || y1 < lat0 || y0 > lat1) continue;
          L.rectangle([[y0, x0], [y1, x1]], { pane: "rezZps", stroke: false, fillColor: SOURCES.tsk.color, fillOpacity: 1, interactive: false }).addTo(groups.parking);
        }
      }, () => {});
    }

    // ---------- points ----------
    const points = [];
    for (const el of elements) {
      if (el.type !== "node" || !el.geometry?.[0]) continue;
      const t = el.tags || {};
      const kind = t.natural === "tree" ? "strom" : nodeItem(t)
        || (t.highway === "bus_stop" || t.railway === "tram_stop" || (t.public_transport === "platform" && !t.amenity) ? "zastavka" : null);
      if (!kind) continue;
      const city_ = el.id < 0 && t.source; // a point of the city's own data (towns, Brno: gis.js addPoints)
      points.push({ kind, xy: xyOf(el.geometry[0]), src: city_ ? "data" : "osm", srcLabel: city_ ? tr("data města ({name})", { name: city_ }) : "OSM" });
    }
    for (const l of lines) {
      if (!l.point) continue;
      const kind = l.code === TM_TREE || l.code === OD_TREE ? "strom" : POINT_ITEM[l.code];
      if (!kind) continue;
      points.push({ kind, xy: l.point, src: l.code === OD_TREE ? "data" : "dtm", srcLabel: l.code === OD_TREE ? tr("otevřená data Prahy (stromy)") : tr("technická mapa") });
    }
    for (const p of points) {
      if (!near(p.xy)) continue;
      const { t, along } = place(p.xy);
      // A stop node only tells a shelter whether it is a tram stop; it is never drawn itself.
      const lim = p.kind === "zastavka" ? -1 : reachOf(p.kind);
      const inReach = along <= lim && inSpan(t);
      const tree = p.kind === "strom";
      const label = tree ? tr("Strom") : p.kind === "zastavka" ? tr("Zastávka") : ITEMS[p.kind] || p.kind;
      const note = p.kind === "zastavka" ? tr("jen určuje druh přístřešku") : inReach ? tr("v dosahu řezu ({lim} m), v profilu", { lim })
        : tr("mimo dosah řezu ({lim} m od řezu, {d} m)", { lim, d: Math.round(along) });
      tip(L.circleMarker(ll(p.xy), shape({
        pane: "rezBody", radius: tree ? 4 : 3, weight: 1.5, color: SOURCES[p.src].color, opacity: inReach ? 1 : 0.75,
        fillColor: inReach ? (tree ? TREE : FURNITURE) : "#ffffff", fillOpacity: inReach ? 0.95 : 0.7,
      })).addTo(groups.points), `<b>${esc(label)}</b><br>${esc(p.srcLabel)} · ${esc(note)}`);
    }
    // Tree rows (OSM, Prague's open data): a row crossing the cut always counts.
    const rows = [
      ...elements.filter((el) => el.type === "way" && el.tags?.natural === "tree_row").map((el) => ({ pts: el.geometry.map(xyOf), src: "osm", label: "OSM" })),
      ...lines.filter((l) => l.code === OD_ROW && l.pts).map((l) => ({ pts: l.pts, src: "data", label: tr("otevřená data Prahy") })),
    ];
    for (const r of rows) {
      if (!nearAny(r.pts)) continue;
      tip(L.polyline(r.pts.map(ll), shape({ pane: "rezLinie", color: TREE, weight: 3, opacity: 0.8, dashArray: "1 5", lineCap: "round" })).addTo(groups.points),
        `<b>${tr("Stromořadí")}</b><br>${esc(r.label)}`);
    }

    // ---------- barrier and slope lines ----------
    const barriers = [
      ...lines.filter((l) => l.pts && TECH_ITEM[l.code]).map((l) => ({ kind: TECH_ITEM[l.code], pts: l.pts, src: "dtm", label: city.dataName || tr("technická mapa") })),
      ...elements.filter((el) => el.type === "way" && BARRIER_ITEM[el.tags?.barrier]).map((el) => ({ kind: BARRIER_ITEM[el.tags.barrier], pts: el.geometry.map(xyOf), src: "osm", label: "OSM" })),
    ];
    for (const b of barriers) {
      if (!nearAny(b.pts)) continue;
      tip(L.polyline(b.pts.map(ll), shape({
        pane: "rezLinie", color: LINE_COLOR[b.kind] || "#6d6a62", weight: b.kind === "svah" ? 1.5 : 2, opacity: 0.9,
        dashArray: b.kind === "svah" ? "5 3" : b.src === "osm" ? "4 2" : null,
      })).addTo(groups.lines), `<b>${esc(ITEMS[b.kind] || b.kind)}</b><br>${esc(b.label)}`);
    }

    // ---------- tram tracks ----------
    for (const pts of tracks) {
      if (!nearAny(pts)) continue;
      tip(L.polyline(pts.map(ll), shape({ pane: "rezLinie", color: TYPES.tramvaj_v_pruhu.color, weight: 2, opacity: 0.95 })).addTo(groups.tracks),
        `<b>${tr("Osa koleje")}</b><br>${esc(city.dataName || tr("technická mapa"))}`);
    }
    for (const el of elements) {
      if (el.type !== "way" || !["tram", "light_rail", "rail"].includes(el.tags?.railway) || !el.geometry) continue;
      const pts = el.geometry.map(xyOf);
      if (!nearAny(pts)) continue;
      tip(L.polyline(el.geometry.map((g) => [g.lat, g.lon]), shape({ pane: "rezLinie", color: SOURCES.osm.color, weight: 1.5, opacity: 0.85, dashArray: "6 4" })).addTo(groups.tracks),
        `<b>${tr("Kolej (OSM)")}</b><br>${esc(el.tags.railway)}${el.tags.embedded_rails ? tr(" · ve vozovce") : ""}`);
    }

    // ---------- street axes ----------
    for (const el of elements) {
      if (el.type !== "way" || !el.tags?.highway || !el.geometry || el.id === way?.id) continue;
      if (el.tags.tunnel && el.tags.tunnel !== "no" && parseFloat(el.tags.layer) < 0) continue;
      if (!nearAny(el.geometry.map(xyOf))) continue;
      tip(L.polyline(el.geometry.map((g) => [g.lat, g.lon]), shape({ pane: "rezLinie", color: SOURCES.osm.color, weight: 1, opacity: 0.6 })).addTo(groups.axes),
        `<b>${esc(el.tags.name || el.tags.highway)}</b><br>OSM · ${esc(el.tags.highway)}`);
    }
    if (way?.geometry) {
      tip(L.polyline(way.geometry.map((g) => [g.lat, g.lon]), shape({ pane: "rezLinie", color: SOURCES.osm.color, weight: 3, opacity: 0.9 })).addTo(groups.axes),
        `<b>${esc(way.tags?.name || way.tags?.highway || tr("ulice"))}</b><br>${tr("osa ulice řezu")} (OSM · ${esc(way.tags?.highway || "")})`);
    }
    for (const l of lines) {
      if (l.code !== OD_SECTION || !l.pts || !nearAny(l.pts)) continue;
      const g = classGroup(l.cls);
      tip(L.polyline(l.pts.map(ll), shape({ pane: "rezLinie", color: SOURCES.data.color, weight: 1.5, opacity: 0.7, dashArray: "2 4" })).addTo(groups.axes),
        `<b>${tr("Úsek TSK")}</b><br>${g ? esc(g.replace(/^mk(\d)/, (m, n) => tr("místní komunikace {n}. třídy", { n })).replace(/^sil(\d)/, (m, n) => tr("silnice {n}. třídy", { n })).replace("dalnice", tr("dálnice"))) : tr("bez třídy")} · ${tr("otevřená data Prahy")}`);
    }

    // ---------- buildings ----------
    const facadeXY = facades.map(([lon, lat]) => frame.toXY(lon, lat));
    const isFacade = (rings) => facadeXY.some(([x, y]) => insideRing(rings[0], x, y) && !rings.slice(1).some((h) => insideRing(h, x, y)));
    const B = { pane: "rezBudovy" };
    for (const el of elements) {
      if (el.type !== "area" || !el.tags?.building) continue;
      const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map(xyOf));
      if (!nearAny(rings[0])) continue;
      const f = isFacade(rings);
      const levels = el.tags["building:levels"] ? tr(" · {n} podl.", { n: el.tags["building:levels"] }) : "";
      tip(L.polygon(rings.map((r) => r.map(ll)), shape({ ...B, color: f ? "#3d3d3a" : "#8a8780", weight: f ? 2 : 1, fillColor: "#9b8cc4", fillOpacity: f ? 0.3 : 0.06 })).addTo(groups.buildings),
        `<b>${tr("Budova (OSM)")}</b><br>${esc(el.tags.building === "yes" ? tr("budova") : el.tags.building)}${esc(levels)}${f ? tr(" · fasáda profilu") : ""}`);
    }
    for (const p of polys) {
      if (![600, 601, 604].includes(p.code) || !isFacade(p.rings)) continue;
      tip(L.polygon(p.lonlat, shape({ ...B, color: SOURCES.dtm.color, weight: 2, fill: false })).addTo(groups.buildings),
        `<b>${tr("Budova")}</b><br>${esc(p.label || tr("budova"))} · ${esc(city.dataName || tr("technická mapa"))}${tr(" · fasáda profilu")}`);
    }

    // ---------- the reach of points from the cut ----------
    for (const [lim, color] of [[REACH.strom, TREE], [REACH.lampa, FURNITURE]]) {
      const c = (s, t) => ll([dir[0] * s + normal[0] * t, dir[1] * s + normal[1] * t]);
      // Not interactive: a band this big would show its tooltip wherever the viewer clicks.
      L.polygon([c(-lim, -span.right), c(lim, -span.right), c(lim, span.left), c(-lim, span.left)], {
        pane: "rezBudovy", color, weight: 1, opacity: 0.7, dashArray: "2 4", fillOpacity: 0.04, fillColor: color, interactive: false,
      }).addTo(groups.reach);
    }
  }

  return { draw, clear };
}
