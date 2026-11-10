// Writes the pages of the former city sites into the built site: /<city>/index.html sends to the one page.
//   node tools/build_city_site.mjs _site
import fs from "node:fs";
import path from "node:path";
import { redirectPage } from "./city_site.mjs";
import { SITES } from "./cities.mjs";

const dir = process.argv[2];
if (!dir) throw new Error("použití: node tools/build_city_site.mjs <adresář webu>");
for (const id of Object.keys(SITES)) {
  fs.mkdirSync(path.join(dir, id), { recursive: true });
  fs.writeFileSync(path.join(dir, id, "index.html"), redirectPage(id));
}
console.log(`přesměrování: ${Object.keys(SITES).join(", ")}`);
