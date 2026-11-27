// node probe.mjs lat lon azimuth : the houses along the cut (both sides), the facts and the look
import { D, P, C, elements, infoOf, setPlace } from "./lib.mjs";
const [lat, lon, az] = process.argv.slice(2).map(Number);
const iso = await setPlace(lat, lon), els = await elements(iso, lat, lon, 120), frame = D.localFrame(lat, lon);
const a = (az * Math.PI) / 180, dir = [Math.cos(a), Math.sin(a)], seen = new Set();
for (let d = -40; d <= 40; d += 2) for (const w of [-1, 1]) {
  const p = [dir[0] * d - dir[1] * w * 3, dir[1] * d + dir[0] * w * 3], o = infoOf(els, frame, p, frame.toLonLat(...p));
  if (!o.found) continue; const k = JSON.stringify(o.info.block) + o.info.footprint; if (seen.has(k)) continue; seen.add(k);
  console.log(d, JSON.stringify({ n: o.info.levels, fp: Math.round(o.info.footprint), own: o.info.own, around: o.info.around }), P.buildingStyle(o.info));
}
