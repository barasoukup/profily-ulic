// Run in the app's page (http://localhost:5212/?osm=balik&mapa=0&ai=0) with the points of points.json served next to
// the page: each point cut as before (A, ?off=mostvoda) and now (B); points that are not bridges once more (B2: the
// noise of two equal runs). Rows kept in localStorage "__bw_ab" (a hidden Browser pane runs the page only while a tool
// call waits on it).
async function collectBridges(PTS) {
  const OP = (await import("/ortho-osm.js")).P;
  const load = () => JSON.parse(localStorage.getItem("__bw_ab") || "[]");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  const one = (s) => ({ name: s.cut?.name, note: s.cut?.note, sources: s.cut?.sources, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
  for (const p of PTS) {
    if (load().some((r) => r.id === p.id)) continue;
    const row = { id: p.id, kind: p.kind, city: p.city };
    const runs = p.kind === "most" ? [["A", ["mostvoda"]], ["B", []]] : [["A", ["mostvoda"]], ["B", []], ["B2", []]];
    for (const [k, off] of runs) {
      OP.off = new Set(off);
      localStorage.removeItem("streetdesign-pilot");
      try { await window.cutAt(p.lat, p.lon); row[k] = one(read()); } catch (e) { row[k] = { error: String(e) }; }
    }
    localStorage.setItem("__bw_ab", JSON.stringify([...load(), row]));
  }
  OP.off = new Set();
}
