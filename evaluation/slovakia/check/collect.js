// A module: run in the app's page (http://127.0.0.1:5173/?lang=cs&osm=r2), served from app/public for the run, after loading the points:
//   window.__pts = await (await fetch("/evaluation-kontrola-vzorek.json")).json()   (a copy of vzorek.json)
// Each point is cut (window.cutAt) and kept: the cut, its parts and edges, and every OSM way the cut line crosses
// (its offset from the left end A and its tags) for the checks of check.js. Results in window.__res (saved by
// the caller to vysledky.json). Resumes where it stopped.
export async function collectKontrola(POINTS) {
  const { osm } = await import("/sources.js");
  const { localFrame } = await import("/derive.js");
  window.__res = window.__res || [];
  const done = new Set(window.__res.map((r) => r.id));
  const KEEP = /^(highway|junction|railway|cycleway|sidewalk|footway|bicycle|foot|lanes|oneway|busway|bus|psv|parking|embedded_rails|tracks|name|service|area|surface|segregated|width)/;
  for (const p of POINTS) {
    if (done.has(p.id)) continue;
    localStorage.removeItem("streetdesign-pilot");
    const row = { id: p.id, town: p.town };
    try {
      await window.cutAt(p.lat, p.lon);
      const s = JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}"), c = s.cut || {};
      Object.assign(row, { name: c.name, lat: c.lat, lon: c.lon, bearing: c.bearing, span: c.span, reach: c.reach, sources: c.sources, note: c.note,
        segs: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || "", x.dir || x.bikeDir || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
      // The cut line: from A (left of the street's direction) to B, in local metres.
      // Without a span (an estimate without one) the profile is taken as centred on the cut's point.
      const width = (s.stav?.segments || []).reduce((a, x) => a + x.width, 0);
      const span = c.span || { left: width / 2, right: width / 2 };
      row.spanGuess = !c.span || undefined;
      if (c.lat && width) {
        const f = localFrame(c.lat, c.lon), b = (c.bearing * Math.PI) / 180, d = [Math.sin(b), Math.cos(b)], left = [-d[1], d[0]];
        const A = [left[0] * span.left, left[1] * span.left], B = [-left[0] * span.right, -left[1] * span.right];
        const total = span.left + span.right;
        const data = await osm(c.lat, c.lon, total / 2 + 30);
        const cross = [];
        for (const el of data.elements || []) {
          if (el.type !== "way" || !el.geometry) continue;
          const t = el.tags || {};
          if (!t.highway && !t.railway) continue;
          const pts = el.geometry.map((g) => f.toXY(g.lon, g.lat));
          for (let i = 0; i + 1 < pts.length; i++) {
            const [p1, p2] = [pts[i], pts[i + 1]];
            const r = [B[0] - A[0], B[1] - A[1]], q = [p2[0] - p1[0], p2[1] - p1[1]], den = r[0] * q[1] - r[1] * q[0];
            if (Math.abs(den) < 1e-9) continue;
            const u = ((p1[0] - A[0]) * q[1] - (p1[1] - A[1]) * q[0]) / den, v = ((p1[0] - A[0]) * r[1] - (p1[1] - A[1]) * r[0]) / den;
            if (u < 0 || u > 1 || v < 0 || v > 1) continue;
            cross.push({ at: +(u * total).toFixed(2), id: el.id, tags: Object.fromEntries(Object.entries(t).filter(([k]) => KEEP.test(k))) });
          }
        }
        row.cross = cross;
      }
    } catch (e) { row.error = String(e); }
    window.__res.push(row);
  }
  return window.__res.length;
}

// Results kept in the page's IndexedDB (survive a reload; localStorage is too small and the app needs it):
// await save("A", window.__res); window.__res = await load("A").
const db = () => new Promise((ok, no) => { const r = indexedDB.open("kontrola", 1); r.onupgradeneeded = () => r.result.createObjectStore("runs"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
export async function save(name, rows) { const d = await db(); return new Promise((ok, no) => { const tx = d.transaction("runs", "readwrite"); tx.objectStore("runs").put(rows, name); tx.oncomplete = () => ok(rows.length); tx.onerror = () => no(tx.error); }); }
export async function load(name) { const d = await db(); return new Promise((ok, no) => { const q = d.transaction("runs").objectStore("runs").get(name); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); }
// One whole run: every point, again while any came out empty (a slow page), then saved under its name.
export async function run(name, POINTS) {
  window.__res = [];
  for (let round = 0; round < 3; round++) {
    await collectKontrola(POINTS);
    const empty = window.__res.filter((r) => !r.segs?.length).length;
    if (empty <= 20) break;
    window.__res = window.__res.filter((r) => r.segs?.length);
  }
  return save(name, window.__res);
}
