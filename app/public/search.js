// Address search on the map: a Leaflet control at the map's top left. The services that answer (RÚIAN of ČÚZK, ZBGIS, Photon,
// each state's own…) are the registry search/registry.js, asked by search/run.js; this file is the field, the list and the
// moving of the map. Considerate to the services: nothing under 3 characters, 300 ms debounce, a stale request is
// cancelled, recent answers are kept in memory. Pure parts (labels, ranking, geometry) and the services: tests/search*.test.js.
import { t } from "./i18n.js";
import { norm } from "./search/text.js";
import { formatLabel, rankResults } from "./search/rank.js";
import { getJSON } from "./search/http.js";
import { SERVICES } from "./search/registry.js";
import { runSearch } from "./search/run.js";
import { locate } from "./search/locate.js";

const MIN_CHARS = 3;
const DEBOUNCE = 300;

// The field and the list of the options, above the zoom buttons.
function createControl(map) {
  const L = globalThis.L;
  const el = L.DomUtil.create("div", "search leaflet-bar");
  el.innerHTML = `<input id="search-input" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false"
    aria-controls="search-list" aria-label="${t("search.searchAddressStreetRuian")}" placeholder="${t("search.searchAddressStreet")}"
    autocomplete="off" spellcheck="false" enterkeyhint="search"><ul id="search-list" role="listbox" aria-label="${t("search.suggestions")}" hidden></ul>`;
  L.DomEvent.disableClickPropagation(el);
  L.DomEvent.disableScrollPropagation(el);
  const Ctl = L.Control.extend({ options: { position: "topleft" }, onAdd: () => el });
  new Ctl().addTo(map);
  el.parentNode.insertBefore(el, el.parentNode.firstChild);
  return { input: el.querySelector("input"), list: el.querySelector("ul") };
}

// The options of the list (one a found item, or the note when there are none); a click picks one.
function fillList(list, found, note, pick) {
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
}

// onPick({ item, lat, lon, cut }) after the map has moved; status(msg, kind) for a failure.
// services(): the ids of the search services of the state the map shows (countries/<ISO>.js search).
// inVienna(): does the map show Vienna. inCzechia(): does the map show Czechia (RÚIAN asked first; elsewhere last).
export function mountSearch(map, { status, onPick, services = () => [], inVienna = () => false, inCzechia = () => true }) {
  const L = globalThis.L;
  const { input, list } = createControl(map);

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
    fillList(list, found, note, pick);
    const open = found.length > 0 || !!note;
    list.hidden = !open;
    input.setAttribute("aria-expanded", String(found.length > 0));
    highlight(-1);
  };

  async function ask(text) {
    const key = norm(text);
    if (key.length < MIN_CHARS) { ctrl?.abort(); return show([]); }
    if (cache.has(key)) return show(cache.get(key), t("search.nothingFound"));
    ctrl?.abort();
    const mine = (ctrl = new AbortController());
    try {
      const listed = new Set(services());
      const centre = () => [map.getCenter().lat, map.getCenter().lng];
      const ctx = { getJSON, signal: mine.signal, near: centre, listed: (id) => listed.has(id), inVienna: inVienna(), inCzechia: inCzechia() };
      const found = rankResults(await runSearch(SERVICES, text, ctx), text);
      cache.set(key, found);
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      if (mine === ctrl && document.activeElement === input) show(found, t("search.nothingFound"));
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("hledání", err);
      if (mine === ctrl) show([], t("search.cuzkSearchNotResponding"));
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
      status(item.sk ? t("search.placeCouldNotLoadedZbgis") : t("search.placeCouldNotLoaded"), "error");
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
