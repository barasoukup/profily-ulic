// The profiles of a collection (../universal/data/<name>.json), a line each: node evaluation/canada/show.mjs <name> [ids]
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync(new URL(`../universal/data/${process.argv[2]}.json`, import.meta.url))), ids = process.argv[3]?.split(",");
for (const r of rows) if (!ids || ids.includes(r.id)) console.log(r.id, r.variant, r.name, r.error || "", r.sources?.cityMap || "-", `${r.lat?.toFixed(6)},${r.lon?.toFixed(6)}`, (r.parts || []).map((p) => p.join(" ")).join(" | "), r.status ? `[${r.status.slice(0, 90)}]` : "");
