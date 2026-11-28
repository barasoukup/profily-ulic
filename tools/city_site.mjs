// One page for the whole Czech Republic (Bára 10. 11. 2026). The former city sites (/brno/, /jihlava/, …)
// stay as small pages that send their visitors (and old links with a cut, #rez=…) to the one page, which
// opens the map over that city (?mesto=…). The local server answers those addresses the same way.
//   node tools/city_site.mjs _site     (writes /<city>/index.html into the built site; tools/build_site.mjs does it)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITES } from "./cities.mjs";

// The page left at /<city>/index.html.
export const redirectPage = (id) => `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><title>Profily ulic</title>
<meta http-equiv="refresh" content="0; url=../?mesto=${id}">
<script>location.replace("../?mesto=${id}" + location.hash);</script>
</head><body><p><a href="../?mesto=${id}">Profily ulic</a></p></body></html>
`;

// The pages of all the former city sites into the built site; returns the ids.
export function writeCitySites(dir) {
  for (const id of Object.keys(SITES)) {
    fs.mkdirSync(path.join(dir, id), { recursive: true });
    fs.writeFileSync(path.join(dir, id, "index.html"), redirectPage(id));
  }
  return Object.keys(SITES);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) throw new Error("použití: node tools/city_site.mjs <adresář webu>");
  console.log(`přesměrování: ${writeCitySites(dir).join(", ")}`);
}
