// After the deploy assembled the site: a city whose site was left out (no data this time) loses its
// links on the other cities' pages, in the city switch and the footer.
//   node tools/drop_city_links.mjs _site
import fs from "node:fs";
import path from "node:path";

const site = process.argv[2];
const CITIES = ["brno", "jihlava"];
const missing = CITIES.filter((c) => !fs.existsSync(path.join(site, c, "index.html")));
const pages = [path.join(site, "index.html"), ...CITIES.map((c) => path.join(site, c, "index.html")).filter((f) => fs.existsSync(f))];
for (const f of pages) {
  let html = fs.readFileSync(f, "utf8");
  for (const c of missing) {
    const href = `(?:\\.\\./)?${c}/`;
    html = html
      .replace(new RegExp(`\\n\\s*<a href="${href}">[^<]*</a>(?=\\s*(?:<a|</nav>))`, "g"), "")
      .replace(new RegExp(` ·\\s*<a href="${href}">Profily ulic [^<]*</a>`, "g"), "");
  }
  // a switch with only the page's own city is no switch
  html = html.replace(/\s*<nav class="city-toggle"[^>]*>\s*<a [^>]*>[^<]*<\/a>\s*<\/nav>/, "");
  fs.writeFileSync(f, html);
}
if (missing.length) console.log(`bez odkazů na: ${missing.join(", ")}`);
