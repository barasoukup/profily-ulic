// A page for the address search without a browser: a Leaflet and a DOM just big enough for mountSearch, a fetch that
// answers from the case's synthetic replies and writes down every request (the address and the order), so a test can
// say which services asked, in what order, and what the person sees.

export class FakeElement {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.hidden = false; this.className = ""; this.id = ""; this.textContent = ""; this.value = ""; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  append(...c) { this.children.push(...c); }
  replaceChildren(...c) { this.children = c; this.onReplace?.(); }
  scrollIntoView() {}
  blur() {}
  fire(type, event = {}) { for (const fn of this.listeners[type] || []) fn({ preventDefault() {}, ...event }); }
}

// The empty answer of each service (what it says when it finds nothing).
const EMPTY = [
  ["GeocodeSOE/suggest", { suggestions: [] }], ["ags.cuzk.gov.cz", { features: [], candidates: [] }], ["zbgis.skgeodesy.sk", { results: [] }],
  ["data.wien.gv.at", { features: [] }], ["photon.komoot.io", { features: [] }], ["api.pdok.nl", { response: { docs: [] } }],
  ["services.gugik.gov.pl", { results: {} }], ["data.geopf.fr", { features: [] }], ["cartociudad.es", []], ["aks.geoportaal.ee", { addresses: [] }],
  ["ipi.eprostor.gov.si", { features: [] }], ["paikkatiedot.ymparisto.fi", { features: [] }], ["api.dataforsyningen.dk", []],
];

// replies: [[part of the address, body | (url) => body | { status } | Error]] — the first that fits answers.
export function installPage({ replies = [], center = [50.08, 14.43] }) {
  const requests = [], warns = [], views = [];
  const input = new FakeElement("input"), list = new FakeElement("ul"), root = new FakeElement("div");
  root.querySelector = (sel) => (sel === "input" ? input : list);
  root.parentNode = { insertBefore() {}, firstChild: null };
  globalThis.document = { activeElement: input, createElement: (tag) => new FakeElement(tag) };
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms) => { const h = realSetTimeout(fn, ms); h.unref?.(); return h; };
  globalThis.L = {
    DomUtil: { create: () => root },
    DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} },
    Control: { extend: ({ onAdd }) => class { addTo() { onAdd(); } } },
    circleMarker: () => ({ addTo() { return this; }, remove() {} }),
  };
  const map = { getCenter: () => ({ lat: center[0], lng: center[1] }), setView: (ll, zoom) => views.push([ll.map((x) => +x.toFixed(5)), zoom]) };
  const realFetch = globalThis.fetch, realWarn = console.warn;
  console.warn = (...a) => warns.push(String(a[0]));
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    const hit = replies.find(([part]) => String(url).includes(part)) || EMPTY.find(([part]) => String(url).includes(part));
    let body = hit ? hit[1] : {};
    if (typeof body === "function") body = body(String(url));
    if (body instanceof Error) throw body;
    if (body?.status) return { ok: false, status: body.status, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => body };
  };
  return {
    input, list, map, requests, warns, views,
    done: () => { globalThis.fetch = realFetch; globalThis.setTimeout = realSetTimeout; console.warn = realWarn; delete globalThis.document; delete globalThis.L; },
  };
}

// What the person sees: the options (main, sub) and the note.
export function shown(list) {
  const items = [], notes = [];
  for (const li of list.children) {
    if (li.className.includes("search-note")) notes.push(li.textContent);
    else items.push(li.children.map((c) => c.textContent));
  }
  return { items, note: notes[0] ?? null };
}
