// Networks under the street (a trial, Bára 12. 11. 2026): where the cut crosses the lines of IPR's technical map of
// the networks (Prague only: TMIS, authorised and not), with their depth. The lines carry the height above sea
// level of each vertex (Z, Bpv); the depth is the surface's height there minus it: from the heights of the technical
// map's own surveyed points nearby (výškopis, kerbs, trees…: Bára's idea, the street's real surface), else from the
// ground model (ČÚZK DMR 5G, one raw image along the cut). Not every Z is the pipe: where the line was not measured in depth it lies on the surface (depth about
// 0), so a depth outside DEPTH_OK is not believed and the network is drawn at its kind's usual depth (ČSN 73 6005,
// indicative), marked as such.
import { query } from "./gis.js";

const IPR = "https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer";
const LAYERS = [7, 3]; // průběh linií TMIS (neautorizované), TMIS ADS (autorizované)
const DMR = "https://ags.cuzk.gov.cz/arcgis2/rest/services/dmr5g/ImageServer/exportImage";
const DEPTH_OK = [0.2, 8];
const R = 6378137;

// The kinds, by the first word of the line's description (CTMTP_POPIS), with a colour (the usual colours of the
// networks on plans), a usual depth to the top (m) when the measured one is not believed, and a usual size (DN,
// mm; a cable or a bundle of them as a sleeve) when the line has none.
export const KINDS = {
  kanalizace: { label: "kanalizace", color: "#8a5a2b", usual: 2.5, dn: 300 },
  vodovod: { label: "vodovod", color: "#1f6fd1", usual: 1.5, dn: 150 },
  plynovod: { label: "plynovod", color: "#e0a800", usual: 1.0, dn: 110 },
  teplovod: { label: "teplovod", color: "#c0392b", usual: 1.0, dn: 250 },
  silnoproud: { label: "silnoproud", color: "#d6336c", usual: 0.7, dn: 60 },
  slaboproud: { label: "slaboproud", color: "#2f9e44", usual: 0.5, dn: 40 },
  jine: { label: "jiné", color: "#7a7a7a", usual: 1.0, dn: 60 },
};
const kindOf = (popis = "") => {
  const w = popis.split(" ")[0];
  return KINDS[w] ? w : "jine";
};

// The ground heights along the cut: one raw float image (format bip) over the box of the cut ±2 m, about 1 m a pixel.
async function ground(box) {
  // Pixels square in degrees (about 1 m north–south): the server widens a box to keep them so, and the lookup
  // below would be off.
  const [x0, y0, x1, y1] = box, cell = 180 / (Math.PI * R);
  const w = Math.max(2, Math.min(600, Math.round((x1 - x0) / cell))), h = Math.max(2, Math.min(600, Math.round((y1 - y0) / cell)));
  const r = await fetch(`${DMR}?${new URLSearchParams({ bbox: box.join(","), bboxSR: 4326, imageSR: 4326, size: `${w},${h}`, format: "bip", pixelType: "F32", interpolation: "RSP_BilinearInterpolation", f: "image" })}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`DMR ${r.status}`);
  const buf = await r.arrayBuffer(), v = new Float32Array(buf.slice(0, w * h * 4));
  // The box as served: the requested one, made to the pixels' shape around its centre.
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, px = Math.max((x1 - x0) / w, (y1 - y0) / h);
  const X0 = cx - (px * w) / 2, Y1 = cy + (px * h) / 2;
  return (lon, lat) => {
    const i = Math.min(w - 1, Math.max(0, Math.floor((lon - X0) / px))), j = Math.min(h - 1, Math.max(0, Math.floor((Y1 - lat) / px)));
    const z = v[j * w + i];
    return z > 0 && z < 2000 ? z : NaN;
  };
}

// The surface from the technical map's points with a height (TMUMPS bodové značky): the inverse-distance mean of
// the nearest NEAR of them within POINTS_R, or NaN.
const POINTS_R = 5, NEAR = 4;
function surfacePoints(features, frame) {
  const pts = features.map((f) => ({ p: frame.toXY(f.geometry.x, f.geometry.y), z: f.geometry.z })).filter((q) => q.z > 100 && q.z < 2000);
  return (x, y) => {
    const near = pts.map((q) => ({ z: q.z, d: Math.hypot(q.p[0] - x, q.p[1] - y) })).filter((q) => q.d <= POINTS_R).sort((a, b) => a.d - b.d).slice(0, NEAR);
    if (!near.length) return NaN;
    const w = near.map((q) => 1 / Math.max(0.3, q.d));
    return near.reduce((a, q, i) => a + q.z * w[i], 0) / w.reduce((a, b) => a + b, 0);
  };
}

// The networks the cut crosses: [{ t, depth, measured, kind, popis, profil }] with t across the cut (m, +normal = A),
// or null outside Prague.
export async function underground({ frame, dir, half, cityId }) {
  if (cityId !== "praha") return null;
  const normal = [-dir[1], dir[0]];
  const ends = [-half, half].map((t) => frame.toLonLat(normal[0] * t, normal[1] * t));
  const pad = 2 / 111320;
  const box = [Math.min(ends[0][0], ends[1][0]) - pad, Math.min(ends[0][1], ends[1][1]) - pad, Math.max(ends[0][0], ends[1][0]) + pad, Math.max(ends[0][1], ends[1][1]) + pad];
  const [height, points, ...answers] = await Promise.all([
    ground(box).catch(() => () => NaN),
    query(`${IPR}/9/query`, { geometry: box.join(","), geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: "OBJECTID", returnGeometry: true, returnZ: true, outSR: 4326, f: "json" }).catch(() => ({ features: [] })),
    ...LAYERS.map((l) => query(`${IPR}/${l}/query`, { geometry: box.join(","), geometryType: "esriGeometryEnvelope", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields: "CTMTP_POPIS,PROFIL", returnGeometry: true, returnZ: true, outSR: 4326, f: "json" })),
  ]);
  const surface = surfacePoints(points.features || [], frame);
  const out = [];
  for (const a of answers) for (const f of a.features || []) {
    const popis = f.attributes?.CTMTP_POPIS || "";
    // Left out: lines taken out of use and the outlines of underground objects (a chamber is no crossing).
    if (/vyřaz|objekty/.test(popis)) continue;
    for (const path of f.geometry?.paths || []) for (let i = 0; i + 1 < path.length; i++) {
      const p = frame.toXY(path[i][0], path[i][1]), q = frame.toXY(path[i + 1][0], path[i + 1][1]);
      const u1 = p[0] * dir[0] + p[1] * dir[1], u2 = q[0] * dir[0] + q[1] * dir[1];
      if (u1 === u2 || u1 * u2 > 0) continue;
      const k = u1 / (u1 - u2), x = p[0] + k * (q[0] - p[0]), y = p[1] + k * (q[1] - p[1]), t = x * normal[0] + y * normal[1];
      if (Math.abs(t) > half) continue;
      const z = path[i][2] + k * (path[i + 1][2] - path[i][2]), [lon, lat] = frame.toLonLat(x, y);
      const kind = kindOf(popis), fromPoints = surface(x, y) - z, fromDmr = height(lon, lat) - z;
      const ok = (d) => Number.isFinite(d) && d >= DEPTH_OK[0] && d <= DEPTH_OK[1];
      const d = Number.isFinite(fromPoints) ? fromPoints : fromDmr, measured = ok(d);
      out.push({ t: +t.toFixed(2), depth: +(measured ? d : KINDS[kind].usual).toFixed(2), measured, kind, popis, profil: f.attributes?.PROFIL ?? null,
        fromPoints: Number.isFinite(fromPoints) ? +fromPoints.toFixed(2) : null, fromDmr: Number.isFinite(fromDmr) ? +fromDmr.toFixed(2) : null });
    }
  }
  // One network drawn more than once (verified and not, both layers, a cable and the axis of its sleeve, cables
  // side by side in one trench: Bára, Voršilská): lines of a kind within SAME of each other are one, the best of
  // them kept (a believed depth, then verified, then the larger size).
  out.sort((a, b) => a.t - b.t);
  const rank = (x) => (x.measured ? 4 : 0) + (/ověř\./.test(x.popis) && !/neověř/.test(x.popis) ? 2 : 0) + (/chráni/.test(x.popis) ? 0 : 1);
  const groups = [];
  for (const x of out) {
    const g = groups.find((q) => q.kind === x.kind && x.t - q.e <= SAME);
    if (g) { g.list.push(x); g.e = x.t; } else groups.push({ kind: x.kind, e: x.t, list: [x] });
  }
  return groups.map(({ list }) => {
    const best = list.reduce((a, x) => (rank(x) > rank(a) ? x : a));
    const size = Math.max(0, ...list.map((x) => (x.profil > 20 && x.profil < 3000 ? x.profil : 0)));
    return { ...best, t: +(list.reduce((a, x) => a + x.t, 0) / list.length).toFixed(2), profil: size || best.profil, lines: list.length };
  });
}
const SAME = 0.5;
