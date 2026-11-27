import { D, P, C, elements, infoOf, setPlace } from "./lib.mjs";
const lat=51.1533, lon=14.91783; const iso = await setPlace(lat, lon);
const els = await elements(iso, lat, lon, 120), f = D.localFrame(lat, lon);
for (const e of els.filter(e=>e.type==="area"&&e.tags?.building)) { const r=e.geometry.map(g=>f.toXY(g.lon,g.lat)); const cx=r.reduce((a,q)=>a+q[0],0)/r.length, cy=r.reduce((a,q)=>a+q[1],0)/r.length;
 if (Math.hypot(cx,cy)>90) continue; const o=infoOf(els,f,[cx,cy],f.toLonLat(cx,cy)); console.log(e.id, Math.round(cx), Math.round(cy), e.tags.building, Math.round(o.info.footprint), JSON.stringify(o.info.block), P.buildingStyle(o.info)); }
