// node probe.mjs lat lon azimuth : the houses along the cut, the facts and the look
import { D, P, C, elements, infoOf, setPlace } from "./lib.mjs";
const [lat, lon, az] = process.argv.slice(2).map(Number);
const iso = await setPlace(lat, lon), els = await elements(iso, lat, lon, 80), frame = D.localFrame(lat, lon);
const a = ((az) * Math.PI) / 180, dir = [Math.sin(a), Math.cos(a)];
for (const d of [-30, -25, -20, -15, -12, -9, 9, 12, 15, 20, 25, 30]) {
  const p = [dir[0] * d, dir[1] * d], point = frame.toLonLat(...p), o = infoOf(els, frame, p, point);
  if (o.found) console.log(d, iso, C.city.id, JSON.stringify(o.info), P.buildingStyle(o.info));
}
