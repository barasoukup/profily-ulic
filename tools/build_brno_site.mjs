// Turns the copy of the app in a directory (e.g. _site/brno) into the Brno site: its config.js
// (CITY = "brno") and index.html (tools/city_site.mjs, the same as the local server's /brno/).
//   node tools/build_brno_site.mjs _site/brno
import fs from "node:fs";
import path from "node:path";
import { brnoConfig, brnoIndex } from "./city_site.mjs";

const dir = process.argv[2];
const edit = (f, fn) => fs.writeFileSync(path.join(dir, f), fn(fs.readFileSync(path.join(dir, f), "utf8")));
edit("config.js", brnoConfig);
edit("index.html", brnoIndex);
console.log(`Brno: ${dir}/config.js a index.html`);
