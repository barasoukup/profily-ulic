// The magistrát's passport against Bratislava's technical map (geoportal.bratislava.sk, kerb lines of layer 7) and the
// technical map against OSM: which of them is off (Bára 19. 11. 2026). At points along the TM's kerb lines, the nearest
// crossing of the passport's roadway boundary along the line's normal (within 4 m), signed; a 2-D shift fitted.
//   node evaluation/slovakia/shift-ba-tm.mjs [lon0,lat0,lon1,lat1]
const BOX = (process.argv[2] || "17.100,48.138,17.125,48.155").split(",").map(Number);
const TM = "https://geoportal.bratislava.sk/hsite/rest/services/tm/Technická_mapa_TM/MapServer/7/query";
const PAS = "https://services8.arcgis.com/pRlN1m0su5BYaFAS/arcgis/rest/services/Vozovka_technick%C3%BD_stav_pod%C4%BEa_OSK_zobrazenie/FeatureServer/0/query";
const EDGE = new Set([2180, 2190, 2200, 2201, 2210, 2211, 2220]);
const q = (extra) => new URLSearchParams({ geometry: BOX.join(","), geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", returnGeometry: "true", f: "json", ...extra });
async function all(url, extra) {
  const out = [];
  for (let off = 0; off < 30000; off += 1000) {
    const j = await (await fetch(`${encodeURI(url)}?${q({ ...extra, resultOffset: String(off), resultRecordCount: "1000" })}`)).json();
    if (j.error) { console.log(JSON.stringify(j.error)); break; }
    out.push(...(j.features || []));
    if (!j.exceededTransferLimit) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return out;
}
const tm = (await all(TM, { where: "1=1", outFields: "Typ" })).filter((f) => EDGE.has(f.attributes?.Typ));
const pas = await all(decodeURIComponent(PAS), { where: "1=1", outFields: "OBJECTID" });
console.log(tm.length, "čar obrub TM,", pas.length, "ploch pasportu");
const lat0 = (BOX[1] + BOX[3]) / 2, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574, xy = ([lon, lat]) => [(lon - BOX[0]) * kx, (lat - BOX[1]) * ky];
const segs = pas.flatMap((f) => (f.geometry?.rings || []).flatMap((r) => r.slice(1).map((p, i) => [xy(r[i]), xy(p)])));
const obs = [];
for (const f of tm) for (const path of f.geometry?.paths || []) {
  const g = path.map(xy);
  for (let i = 0; i + 1 < g.length; i++) {
    const [a, b] = [g[i], g[i + 1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 3) continue;
    for (let s = 1; s < L; s += 4) {
      const p = [a[0] + (dx * s) / L, a[1] + (dy * s) / L], n = [-dy / L, dx / L];
      let best = null;
      for (const [c, d] of segs) {
        const ex = d[0] - c[0], ey = d[1] - c[1], den = n[0] * ey - n[1] * ex;
        if (Math.abs(den) < 1e-9) continue;
        // only boundary pieces about parallel to the kerb
        if (Math.abs(ex * dx + ey * dy) / (Math.hypot(ex, ey) * L) < 0.9) continue;
        const t = ((c[0] - p[0]) * ey - (c[1] - p[1]) * ex) / den, u = ((c[0] - p[0]) * n[1] - (c[1] - p[1]) * n[0]) / den;
        if (u < 0 || u > 1 || Math.abs(t) > 4) continue;
        if (!best || Math.abs(t) < Math.abs(best)) best = t;
      }
      if (best !== null) obs.push({ n, off: best });
    }
  }
}
function fit(list) {
  let a = 0, b = 0, c = 0, u = 0, v = 0;
  for (const { n, off } of list) { a += n[0] * n[0]; b += n[0] * n[1]; c += n[1] * n[1]; u += n[0] * off; v += n[1] * off; }
  const det = a * c - b * b, d = [(c * u - b * v) / det, (a * v - b * u) / det];
  return { d, res: list.map((o) => Math.abs(o.off - (o.n[0] * d[0] + o.n[1] * d[1]))) };
}
let { d, res } = fit(obs);
const lim = [...res].sort((x, y) => x - y)[Math.floor(res.length * 0.8)];
({ d, res } = fit(obs.filter((_, i) => res[i] <= lim)));
const med = (x) => [...x].sort((p, r) => p - r)[x.length >> 1];
console.log(`${obs.length} míst: pasport proti technické mapě: východ ${d[0].toFixed(2)} m, sever ${d[1].toFixed(2)} m, medián zbytku ${med(res).toFixed(2)} m`);
