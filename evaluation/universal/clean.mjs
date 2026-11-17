// Deletes the Mapy.com panoramas once judged (their terms do not allow keeping them; Bára 17. 11. 2026): the photos
// named in mapy.txt by prepare.mjs. Mapillary's (CC BY-SA) stay.
//   node evaluation/universal/clean.mjs
import fs from "node:fs/promises";
import path from "node:path";
const DATA = path.join(path.dirname(new URL(import.meta.url).pathname), "data");
const list = (await fs.readFile(path.join(DATA, "mapy.txt"), "utf8").catch(() => "")).split("\n").filter(Boolean);
for (const f of list) await fs.unlink(path.join(DATA, f)).catch(() => {});
await fs.unlink(path.join(DATA, "mapy.txt")).catch(() => {});
console.log("smazáno", list.length);
