// Turns the copy of the app in a directory (e.g. _site/brno) into that city's site: its config.js
// (CITY = "<city>") and index.html (tools/city_site.mjs, the same as the local server's /<city>/).
//   node tools/build_city_site.mjs _site/brno brno
import fs from "node:fs";
import path from "node:path";
import { cityConfig, cityIndex } from "./city_site.mjs";

const [dir, id] = process.argv.slice(2);
if (!dir || !id) throw new Error("použití: node tools/build_city_site.mjs <adresář> <město>");
const edit = (f, fn) => fs.writeFileSync(path.join(dir, f), fn(fs.readFileSync(path.join(dir, f), "utf8")));
edit("config.js", (js) => cityConfig(id, js));
edit("index.html", (html) => cityIndex(id, html));
console.log(`${id}: ${dir}/config.js a index.html`);
