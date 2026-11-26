// The collector of the measurements of 26. 11. 2026 (bridge-water/blind, pasporty-blind, usa/sf/width), run in the
// app's page (server with EVAL_SAVE=1, copied to pilot/public/zz-m1126.js, git ignores it):
//   (await import("/zz-m1126.js")).run(name, points, variants, budgetMs)
// Every point is cut once per variant at the same place: the first variant places it (a click at lat, lon, or the
// point's own bearing and way when it has them), the others reuse that cut's lat, lon, bearing and way. A variant is
// { name, off: [ortho-osm.js P.off], search: "?…" (the page's switches, read at call time), stub: [regexp of URLs
// answered with no features] }. noise: the name of a variant run again after the last when it differs from the first
// (two equal runs that differ are noise). Rows go to evaluation/universal/data/<name>.json; a call returns after
// budgetMs (a hidden Browser pane runs the page only while a tool call waits), the next call goes on.
const parts = (s) => (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let realFetch = null;
function setVariant(v) {
  window.__ORTHO_P.off = new Set(v.off || []);
  history.replaceState(null, "", (v.search || "?osm=balik") + location.hash);
  if (!realFetch) realFetch = window.fetch;
  const stub = (v.stub || []).map((s) => new RegExp(s));
  window.fetch = stub.length ? (u, o) => (stub.some((r) => r.test(String(u?.url || u))) ? Promise.resolve(new Response(JSON.stringify({ features: [] }), { headers: { "content-type": "application/json" } })) : realFetch(u, o)) : realFetch;
}
async function one(p, v, at) {
  setVariant(v);
  localStorage.removeItem("streetdesign-pilot");
  const t0 = Date.now();
  try {
    const args = at ? [at.lat, at.lon, false, at.bearing, null, null, at.wayId] : p.bearing != null ? [p.lat, p.lon, false, p.bearing, null, null, p.wayId] : [p.lat, p.lon];
    await Promise.race([window.cutAt(...args), new Promise((_, no) => setTimeout(() => no(new Error("timeout 120 s")), 120000))]);
    const s = JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
    return { lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, wayId: s.cut?.wayId, name: s.cut?.name || "", sources: s.cut?.sources, note: s.cut?.note, city: s.cut?.city,
      parts: parts(s), edges: [s.stav?.edges?.left, s.stav?.edges?.right], ms: Date.now() - t0 };
  } catch (e) { return { error: String(e), ms: Date.now() - t0 }; }
}
export async function run(name, points, variants, budgetMs = 100000, noise = null) {
  window.__ORTHO_P ??= (await import("/ortho-osm.js")).P;
  const key = `__m1126_${name}`;
  const out = (window[key] ??= []);
  const t0 = Date.now();
  for (const p of points) {
    if (Date.now() - t0 > budgetMs) break;
    if (out.some((r) => r.id === p.id)) continue;
    const row = { id: p.id };
    for (const v of variants) row[v.name] = await one(p, v, v === variants[0] ? null : row[variants[0].name]?.lat != null ? row[variants[0].name] : null);
    const a = row[variants[0].name], b = row[variants[variants.length - 1].name];
    if (noise && a?.parts && b?.parts && !same(a.parts, b.parts)) {
      const nv = variants.find((v) => v.name === noise);
      row[`${noise}2`] = await one(p, nv, a.lat != null ? a : null);
    }
    out.push(row);
    await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(out) });
  }
  setVariant(variants[0]);
  window.fetch = realFetch || window.fetch;
  return `${out.length}/${points.length}`;
}
