import { D, P, C, S, elements, infoOf, setPlace } from "./lib.mjs";
const lat=51.1533, lon=14.91783; const iso = await setPlace(lat, lon); console.log(iso, C.city.id, C.city.abroad, JSON.stringify(C.city.centre));
const els = await elements(iso, lat, lon, 80), f = D.localFrame(lat, lon);
for (const [x,y] of [[4,-13],[34,-10],[-13,17],[-8,13],[43,-5]]) { const pt=f.toLonLat(x,y); const o=infoOf(els,f,[x,y],pt); const reg=await S.podlaznost(pt[1],pt[0]).catch(e=>String(e)); console.log(x,y,JSON.stringify(reg), JSON.stringify(o.info.block), P.buildingStyle(o.info)); }
