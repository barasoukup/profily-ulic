import { D, P, C, S, elements, infoOf, setPlace } from "./lib.mjs";
const [lat, lon, az] = process.argv.slice(2).map(Number);
const iso = await setPlace(lat, lon); console.log(iso, C.city.id, C.city.panels, JSON.stringify(C.city.centre));
const els = await elements(iso, lat, lon, 80), f = D.localFrame(lat, lon);
const a = az * Math.PI / 180, dir = [Math.cos(a), Math.sin(a)];
const seen = new Set();
for (let d = -40; d <= 40; d += 2) for (const w of [-1,1]) { const p=[dir[0]*d - dir[1]*w*3, dir[1]*d + dir[0]*w*3], pt=f.toLonLat(...p), o=infoOf(els,f,p,pt); if(!o.found) continue; const k=JSON.stringify(o.info.block)+o.info.footprint; if(seen.has(k)) continue; seen.add(k); console.log(d, JSON.stringify(o.info), P.buildingStyle(o.info)); }
