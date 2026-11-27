import { elementsIn } from "./lib.mjs";
const [lat, lon] = [48.306707, 14.273160], d = 0.004;
const els = await elementsIn("at", [lon - d, lat - d, lon + d, lat + d]);
const n = {};
for (const e of els) if (e.tags.railway) { const k = e.type + ":" + e.tags.railway; n[k] = (n[k] || 0) + 1; }
console.log(els.length, n);
const w = els.filter((e) => e.type === "way" && e.tags.railway);
console.log(w.length, w.slice(0, 3).map((e) => JSON.stringify(e.tags)));
