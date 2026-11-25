// The Maryland cuts USGS's imagery was too coarse for, again over Maryland's 6-inch imagery (only looked at).   TOKEN=<file> node outside-md.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), dir = path.join(HERE, "../data/review-out-md"), rows = JSON.parse(await fs.readFile(path.join(HERE, "../../universal/data/na-review.json"), "utf8"));
await fs.mkdir(dir, { recursive: true });
const ids = ["usout-1", "usout-2", "usout-6", "usout-11", "usout-14"];
for (const id of ids) { const r = rows.find((x) => x.id === id); await orthoImage({ lat: r.lat, lon: r.lon, bearing: r.bearing, half: 30 }, path.join(dir, `${id}-ortho.jpg`), { service: "https://mdgeodata.md.gov/imagery/rest/services/SixInch/SixInchImagery/ImageServer/exportImage" }); }
await fs.writeFile(path.join(dir, "SEZNAM.md"), ids.map((i) => `- ${i}: šířka obrázku 60 m; fotky: žádné`).join("\n"));
