// The base maps of the app, state by state (node evaluation/replay/layers.mjs, evaluation/replay/layers.md). The page of
// the app with its own CSP (the images of every state's tile server are on it), this script before app.js: for the
// point of each state it opens each base map and the lines overlay as a visitor would (the layers control), lets a small map
// load its tiles and writes down how many came, how many failed, how many were blank, and the credit the map shows.
// One map of 300 px, a pause between layers and between points: a few tiles of each server, once.
//   http://localhost:5190/?layers=1&lang=cs   (replay/server.mjs; the points: layers-points.json)
const P = new URLSearchParams(location.search);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = (globalThis.PROFILY_REPLAY = { progress: "start" });
try { localStorage.clear(); sessionStorage.clear(); } catch {}
// The map object of app.js (it keeps it to itself).
const init = L.Map.prototype.initialize;
L.Map.prototype.initialize = function (...a) { globalThis.__map = this; return init.apply(this, a); };
const violations = [];
document.addEventListener("securitypolicyviolation", (e) => violations.push(e.blockedURI));
const PAUSE = Number(P.get("pause") || 1500), ZOOM = Number(P.get("zoom") || 18);
const tiles = () => [...document.querySelectorAll("#map .leaflet-tile-pane img.leaflet-tile")];
// The host of a tile, the key of a token left out.
const hostOf = (src) => { try { return new URL(src).host; } catch { return src.slice(0, 12); } };
async function settle(limit = 12000) {
  const t0 = Date.now();
  let quiet = 0, last = -1;
  while (Date.now() - t0 < limit) {
    await sleep(250);
    const all = tiles(), open = all.filter((i) => !i.complete).length;
    quiet = !open && all.length === last ? quiet + 1 : 0;
    last = all.length;
    if (quiet >= 4) break;
  }
}
const credit = () => [...document.querySelectorAll("#map .leaflet-control-attribution")].map((e) => e.textContent.replace(/\s+/g, " ").replace(/^.*?Leaflet\s*[|·]?\s*/i, "").trim()).join(" ");
function measure() {
  const all = tiles().filter((i) => i.style.visibility !== "hidden");
  const r = { n: all.length, ok: 0, blank: 0, err: 0, hosts: {} };
  let sample = null;
  for (const i of all) {
    const src = i.getAttribute("src") || "";
    if (src.startsWith("data:")) { r.blank++; continue; }
    if (i.complete && i.naturalWidth > 0) r.ok++; else r.err++;
    const h = hostOf(src);
    r.hosts[h] = (r.hosts[h] || 0) + 1;
    sample ||= i;
  }
  // Is a tile that came an image with something in it (a whole white or transparent tile is an empty answer)?
  r.empty = 0;
  for (const i of all) {
    if (!(i.complete && i.naturalWidth > 0) || (i.getAttribute("src") || "").startsWith("data:")) continue;
    try {
      const c = Object.assign(document.createElement("canvas"), { width: 16, height: 16 });
      const g = c.getContext("2d");
      g.drawImage(i, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      let flat = true;
      for (let k = 4; k < d.length; k += 4) if (d[k] !== d[0] || d[k + 1] !== d[1] || d[k + 2] !== d[2] || d[k + 3] !== d[3]) { flat = false; break; }
      if (flat) r.empty++;
    } catch { r.empty = null; break; } // tainted: another origin without CORS, cannot look
  }
  r.credit = credit();
  return r;
}
async function main() {
  while (!(globalThis.__map && window.profilyReady)) await sleep(100);
  const map = globalThis.__map;
  const points = await fetch("/__replay/sample?name=layers-points").then((r) => r.json());
  const only = P.get("only")?.split(",");
  const box = document.querySelector("#map");
  Object.assign(box.style, { position: "fixed", left: "0", top: "0", width: "300px", height: "300px", zIndex: 99999 });
  map.invalidateSize();
  const rows = [];
  for (const [n, p] of points.entries()) {
    if (only && !only.includes(p.id)) continue;
    H.progress = `${n + 1}/${points.length} ${p.id}`;
    violations.length = 0;
    map.setView([p.lat, p.lon], ZOOM, { animate: false });
    await settle();
    const row = { ...p, layers: {} };
    const radios = [...document.querySelectorAll(".leaflet-control-layers-base label")];
    for (const label of radios) {
      const name = label.textContent.trim();
      label.querySelector("input").click();
      await settle();
      let m = measure();
      // Nothing but blank tiles: a layer that decides its tiles after its own list loads (the German Länder): once more.
      if (m.n === m.blank) { await sleep(4000); await settle(); m = measure(); }
      row.layers[name] = m;
      await sleep(PAUSE);
    }
    const over = [...document.querySelectorAll(".leaflet-control-layers-overlays label")].find((l) => /Linie|Lines|Čiary|Linien/.test(l.textContent));
    if (over) {
      const input = over.querySelector("input");
      if (!input.checked) input.click();
      await settle();
      row.layers[`+${over.textContent.trim()}`] = measure();
      input.click();
      await sleep(PAUSE);
    }
    row.violations = [...new Set(violations.map(hostOf))];
    rows.push(row);
    await sleep(PAUSE * 2);
  }
  await fetch(`/__replay/out?run=layers&id=1`, { method: "POST", body: JSON.stringify({ lang: P.get("lang"), rows }) });
  H.progress = `done ${rows.length}`;
}
main().catch((e) => { H.progress = `failed: ${e?.stack || e}`; });
