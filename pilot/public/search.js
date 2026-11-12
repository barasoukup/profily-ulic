// Address search on the map: the RÚIAN search service of ČÚZK ("Vyhledávací služba nad daty RÚIAN",
// GeocodeSOE: suggest while typing, then the chosen place from the service's own layers). No key, CORS for any
// origin, open data under CC BY 4.0. Considerate to ČÚZK: nothing under 3 characters, 300 ms debounce, a stale
// request is cancelled, recent answers are kept in memory.
// The top half is pure (parsing, ranking, labels, geometry; tests/search.test.js), mountSearch() is the UI.
import { t } from "./i18n.js";

export const RUIAN_SEARCH = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Vyhledavaci_sluzba_nad_daty_RUIAN/MapServer";
const GEOCODE = `${RUIAN_SEARCH}/exts/GeocodeSOE`;
export const MIN_CHARS = 3;
export const MAX_SHOWN = 8;
const ASK = 15; // more than shown: duplicates of a town (ORP, POU) are dropped and the rest re-ranked
const DEBOUNCE = 300;
const TIMEOUT = 10000;

// The service's layers, as the magicKey's prefix ("1_1199065" = layer 1, objectid 1199065).
export const KINDS = {
  AdresniMisto: { label: t("adresa"), zoom: 19, rank: 25 },
  Ulice: { label: t("ulice"), zoom: 19, rank: 30 },
  Obec: { label: t("obec"), zoom: 15, rank: 28 },
  CastObce: { label: t("část obce"), zoom: 16, rank: 20 },
  MestskyObvodMestskaCastVeStatutarnimMesteAHlavnimMestePraze: { label: t("městská část"), zoom: 15, rank: 18 },
  SpravniObvodVHlavnimMestePraze: { label: t("správní obvod"), zoom: 14, rank: 6 },
  KatastralniUzemi: { label: t("katastrální území"), zoom: 15, rank: 12 },
  ZakladniSidelniJednotka: { label: t("sídelní jednotka"), zoom: 17, rank: 8 },
  ParcelaDefinicniBod: { label: t("parcela"), zoom: 19, rank: 5 },
  Okres: { label: t("okres"), zoom: 11, rank: 4 },
  VyssiUzemneSamospravnyCelek: { label: t("kraj"), zoom: 9, rank: 3 },
};
// The same town again as the seat of an office: dropped.
const DUPLICATES = new Set(["ObecSPoverenymObecnimUradem", "ObecSRozsirenouPusobnosti"]);
// Statutory cities: a street of the same name elsewhere comes after theirs when the query names no town.
const BIG = new Set(["praha", "brno", "ostrava", "plzen", "liberec", "olomouc", "ceske budejovice", "hradec kralove", "usti nad labem",
  "pardubice", "zlin", "havirov", "kladno", "most", "opava", "frydek mistek", "karvina", "jihlava", "teplice", "decin", "chomutov",
  "jablonec nad nisou", "mlada boleslav", "prostejov", "prerov", "trebic", "trinec", "tabor", "znojmo", "kromeriz", "karlovy vary"]);

// Lower case, no diacritics, punctuation and hyphens as spaces.
export const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9/]+/g, " ").trim();

export function parseSuggestions(json) {
  const seen = new Set();
  const out = [];
  for (const s of json?.suggestions || []) {
    const m = /^(\d+)_(\d+)$/.exec(s.magicKey || "");
    if (!m || !s.text || DUPLICATES.has(s.type)) continue;
    const id = `${s.type}|${s.text}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ text: s.text, key: s.magicKey, type: s.type, layer: +m[1], oid: +m[2] });
  }
  return out;
}

// "Mánesova 409/12, Vinohrady, 12000 Praha 2" → main "Mánesova 409/12", sub "Vinohrady, 12000 Praha 2";
// "Manětín (Plzeň-sever)" → "Manětín", "Plzeň-sever".
export function formatLabel(item) {
  const kind = KINDS[item.type]?.label || t("místo");
  const p = /^(.*?) \(([^)]*)\)$/.exec(item.text);
  if (p) return { main: p[1], sub: p[2], kind };
  const i = item.text.indexOf(", ");
  return i < 0 ? { main: item.text, sub: "", kind } : { main: item.text.slice(0, i), sub: item.text.slice(i + 2), kind };
}

// The name without house numbers and the town (the last part without the PSČ and the district's number).
function parts(item) {
  const { main, sub } = formatLabel(item);
  const name = norm(main.replace(/\s+\d+[a-zA-Z]?(\/\d+[a-zA-Z]?)?$/, ""));
  const numbers = (main.match(/\d+[a-zA-Z]?/g) || []).map((n) => n.toLowerCase());
  const last = sub.split(", ").pop() || "";
  const town = item.type === "Ulice" || item.type === "AdresniMisto" ? norm(last.replace(/^\d{5}\s*/, "").replace(/\s+\d+$/, "")) : "";
  return { name, numbers, town };
}

export function score(item, query) {
  const q = norm(query);
  const words = q.split(" ");
  const qNumbers = words.filter((w) => /^\d+[a-z]?$/.test(w) || /^\d+[a-z]?\/\d+[a-z]?$/.test(w)).flatMap((w) => w.split("/"));
  const { name, numbers, town } = parts(item);
  let s = KINDS[item.type]?.rank ?? 0;
  if (name && (q === name || q.startsWith(name + " "))) s += 40; // the whole name typed
  else if (name && name.startsWith(q)) s += 20; // still typing it
  const townNamed = town && ` ${q} `.includes(` ${town} `);
  if (townNamed) s += 30;
  else if (item.type === "Ulice" && BIG.has(town)) s += 10; // addresses stay after the streets of other towns
  if (qNumbers.length) {
    if (item.type === "AdresniMisto" && qNumbers.every((n) => numbers.includes(n))) s += 50;
    else if (item.type === "Ulice") s -= 10; // a number asks for an address
  }
  return s;
}

// The best first (exact street plus town), the service's order otherwise; at most MAX_SHOWN.
export function rankResults(items, query, max = MAX_SHOWN) {
  return items.map((it, i) => ({ it, i, s: score(it, query) }))
    .sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map((e) => e.it);
}

// ---------- geometry (lon, lat; a local metric scale is enough for one street) ----------
const k = (lat) => Math.cos((lat * Math.PI) / 180);
function nearestOnSegment([ax, ay], [bx, by], [px, py], c) {
  const dx = (bx - ax) * c, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * c * dx + (py - ay) * dy) / len2)) : 0;
  const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
  return { point: [x, y], d2: ((x - px) * c) ** 2 + (y - py) ** 2 };
}
// The point of a polyline nearest to p.
export function nearestOnPaths(paths, p) {
  const c = k(p[1]);
  let best = null;
  for (const path of paths || []) {
    if (path.length === 1) { const d2 = ((path[0][0] - p[0]) * c) ** 2 + (path[0][1] - p[1]) ** 2; if (!best || d2 < best.d2) best = { point: path[0], d2 }; }
    for (let i = 0; i + 1 < path.length; i++) {
      const r = nearestOnSegment(path[i], path[i + 1], p, c);
      if (!best || r.d2 < best.d2) best = r;
    }
  }
  return best?.point || null;
}
// The middle of a street: the length-weighted centre of its segments, put back on the street (a street of many
// pieces, a curved one: the centre itself can lie off it).
export function streetMiddle(paths) {
  let sx = 0, sy = 0, sl = 0;
  const lat0 = paths?.[0]?.[0]?.[1];
  if (lat0 === undefined) return null;
  const c = k(lat0);
  for (const path of paths) for (let i = 0; i + 1 < path.length; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    const l = Math.hypot((bx - ax) * c, by - ay);
    sx += ((ax + bx) / 2) * l; sy += ((ay + by) / 2) * l; sl += l;
  }
  const centre = sl ? [sx / sl, sy / sl] : paths[0][0];
  return nearestOnPaths(paths, centre);
}

// ---------- requests ----------
const qs = (o) => new URLSearchParams({ ...o, f: "json" }).toString();
async function getJSON(url, signal) {
  const timeout = AbortSignal.timeout(TIMEOUT);
  const r = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  if (json?.error) throw new Error(`${json.error.code} ${json.error.message}`);
  return json;
}
export const suggestUrl = (text) => `${GEOCODE}/suggest?${qs({ text, maxSuggestions: ASK })}`;
const layerQuery = (layer, params) => `${RUIAN_SEARCH}/${layer}/query?${qs({ outSR: 4326, ...params })}`;
const streetGeometry = (params) => layerQuery(4, { ...params, outFields: "kod", returnGeometry: true, maxAllowableOffset: 0.000005, geometryPrecision: 7 });

// Where a chosen item goes: { lat, lon, zoom, cut } — cut is the point on the street to cut at (an address on
// a street, a street), or null (a town, a district, an address without a street).
export async function locate(item, signal) {
  const zoom = KINDS[item.type]?.zoom || 16;
  if (item.type === "AdresniMisto") {
    const a = (await getJSON(layerQuery(1, { objectIds: item.oid, outFields: "ulice" }), signal)).features?.[0];
    if (!a?.geometry) throw new Error("adresa bez polohy");
    const p = [a.geometry.x, a.geometry.y];
    let cut = null;
    if (a.attributes?.ulice) {
      const s = (await getJSON(streetGeometry({ where: `kod=${+a.attributes.ulice}` }), signal).catch(() => null))?.features?.[0];
      cut = s?.geometry?.paths ? nearestOnPaths(s.geometry.paths, p) : null;
    }
    return { lon: p[0], lat: p[1], zoom, cut: cut && { lon: cut[0], lat: cut[1] } };
  }
  if (item.type === "Ulice") {
    const s = (await getJSON(streetGeometry({ objectIds: item.oid }), signal)).features?.[0];
    const m = streetMiddle(s?.geometry?.paths);
    if (!m) throw new Error("ulice bez polohy");
    return { lon: m[0], lat: m[1], zoom, cut: { lon: m[0], lat: m[1] } };
  }
  const json = await getJSON(`${GEOCODE}/findAddressCandidates?${qs({ SingleLine: item.text, magicKey: item.key, outSR: 4326, maxLocations: 1 })}`, signal);
  const loc = json.candidates?.[0]?.location;
  if (!loc) throw new Error("bez polohy");
  return { lon: loc.x, lat: loc.y, zoom, cut: null };
}

// ---------- UI: a Leaflet control at the map's top left ----------
// onPick({ item, lat, lon, cut }) after the map has moved; status(msg, kind) for a failure.
export function mountSearch(map, { status, onPick }) {
  const L = globalThis.L;
  const el = L.DomUtil.create("div", "search leaflet-bar");
  el.innerHTML = `<input id="search-input" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false"
    aria-controls="search-list" aria-label="${t("Hledat adresu nebo ulici (RÚIAN © ČÚZK)")}" placeholder="${t("Hledat adresu nebo ulici")}"
    autocomplete="off" spellcheck="false" enterkeyhint="search"><ul id="search-list" role="listbox" aria-label="${t("Návrhy")}" hidden></ul>`;
  const input = el.querySelector("input"), list = el.querySelector("ul");
  L.DomEvent.disableClickPropagation(el);
  L.DomEvent.disableScrollPropagation(el);
  const Ctl = L.Control.extend({ options: { position: "topleft" }, onAdd: () => el });
  new Ctl().addTo(map);
  // Above the zoom buttons.
  el.parentNode.insertBefore(el, el.parentNode.firstChild);

  const cache = new Map(); // normalized query → items, the 40 most recent
  let items = [], active = -1, timer = 0, ctrl = null, lastQuery = "", marker = null, markerTimer = 0;

  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; };
  const highlight = (i) => {
    active = i;
    [...list.children].forEach((li, j) => li.setAttribute("aria-selected", String(j === i)));
    if (i >= 0 && list.children[i]?.id) { input.setAttribute("aria-activedescendant", list.children[i].id); list.children[i].scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  };
  const show = (found, note = "") => {
    items = found;
    list.replaceChildren();
    found.forEach((it, i) => {
      const { main, sub, kind } = formatLabel(it);
      const li = document.createElement("li");
      li.id = `search-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.setAttribute("aria-label", [main, sub, kind].filter(Boolean).join(", "));
      const b = document.createElement("span"); b.className = "search-main"; b.textContent = main;
      const s = document.createElement("span"); s.className = "search-sub muted"; s.textContent = [sub, kind].filter(Boolean).join(" · ");
      li.append(b, s);
      li.addEventListener("mousedown", (e) => e.preventDefault()); // keep the focus in the field
      li.addEventListener("click", () => pick(i));
      list.append(li);
    });
    if (!found.length && note) {
      const li = document.createElement("li"); li.className = "search-note muted"; li.textContent = note; list.append(li);
    }
    const open = found.length > 0 || !!note;
    list.hidden = !open;
    input.setAttribute("aria-expanded", String(found.length > 0));
    highlight(-1);
  };

  async function ask(text) {
    const key = norm(text);
    if (key.length < MIN_CHARS) { ctrl?.abort(); return show([]); }
    if (cache.has(key)) return show(cache.get(key), t("Nic jsem nenašla."));
    ctrl?.abort();
    const mine = (ctrl = new AbortController());
    try {
      const found = rankResults(parseSuggestions(await getJSON(suggestUrl(text.trim()), mine.signal)), text);
      cache.set(key, found);
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      if (mine === ctrl && document.activeElement === input) show(found, t("Nic jsem nenašla."));
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("hledání", err);
      if (mine === ctrl) show([], t("Vyhledávání ČÚZK teď neodpovídá."));
    }
  }

  async function pick(i) {
    const item = items[i];
    if (!item) return;
    close();
    input.value = item.text;
    input.blur(); // the phone's keyboard goes away
    ctrl?.abort();
    const mine = (ctrl = new AbortController());
    try {
      const where = await locate(item, mine.signal);
      map.setView([where.lat, where.lon], where.zoom);
      flash(where);
      onPick?.({ item, ...where });
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("hledání", err);
      status(t("Místo se nepodařilo načíst z RÚIAN ČÚZK. Zkuste to znovu."), "error");
    }
  }

  // The found point for a few seconds.
  function flash({ lat, lon }) {
    clearTimeout(markerTimer);
    marker?.remove();
    marker = L.circleMarker([lat, lon], { radius: 9, color: "#185fa5", weight: 3, fillColor: "#fff", fillOpacity: 0.9, interactive: false }).addTo(map);
    markerTimer = setTimeout(() => { marker?.remove(); marker = null; }, 4000);
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const text = input.value;
    if (norm(text) === lastQuery) return;
    lastQuery = norm(text);
    if (lastQuery.length < MIN_CHARS) { ctrl?.abort(); return show([]); }
    timer = setTimeout(() => ask(text), DEBOUNCE);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (list.hidden && items.length) { list.hidden = false; input.setAttribute("aria-expanded", "true"); }
      if (!items.length) return;
      e.preventDefault();
      const n = items.length;
      highlight(e.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items.length && !list.hidden) pick(active >= 0 ? active : 0);
      else if (norm(input.value).length >= MIN_CHARS) { clearTimeout(timer); ask(input.value); }
    } else if (e.key === "Escape") {
      if (!list.hidden) { e.preventDefault(); close(); } else if (input.value) { input.value = ""; lastQuery = ""; show([]); }
    }
  });
  input.addEventListener("focus", () => { if (items.length) { list.hidden = false; input.setAttribute("aria-expanded", "true"); } });
  input.addEventListener("blur", () => setTimeout(close, 150));
  return { input };
}
