// Snap candidates onto local streets and keep the first of each place up to the cap.
const WAYS = new Set(["residential", "unclassified", "living_street"]);
export async function pickLocal(C, per, { max = 30, apart = 120 } = {}) {
  const gis = await import("/gis.js"), { localFrame } = await import("/derive.js");
  const out = [], n = {};
  for (const p of C) {
    const g = p.group + "/" + p.place;
    if ((n[g] || 0) >= per[g]) continue;
    let o;
    try { o = await gis.osmTiles(p.lat, p.lon, 45); } catch { continue; }
    const fr = localFrame(p.lat, p.lon);
    let best = null;
    for (const w of o.elements || []) {
      if (w.type !== "way" || !WAYS.has(w.tags?.highway) || Number(w.tags.layer) < 0 || w.tags.tunnel || w.tags.bridge || w.tags.area === "yes") continue;
      const g = w.geometry.map((q) => fr.toXY(q.lon, q.lat));
      for (let i = 0; i + 1 < g.length; i++) {
        const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / L)) : 0, q = [a[0] + t * dx, a[1] + t * dy], d = Math.hypot(...q);
        if (!best || d < best.d) best = { d, q, way: w.id, highway: w.tags.highway, name: w.tags.name };
      }
    }
    if (!best || best.d > max) continue;
    const [lon, lat] = fr.toLonLat(...best.q);
    if (!out.every((q) => Math.hypot((lat - q.lat) * 110574, (lon - q.lon) * 111320 * Math.cos((lat * Math.PI) / 180)) >= apart)) continue;
    n[g] = (n[g] || 0) + 1;
    out.push({ ...p, lat: +lat.toFixed(6), lon: +lon.toFixed(6), way: best.way, highway: best.highway, name: best.name });
  }
  await fetch("/api/eval-save?name=mer-pick", { method: "POST", body: JSON.stringify(out) });
  return out;
}
