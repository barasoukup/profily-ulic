// The root of the web (Bára 16. 11. 2026): the app lives at streetspace.eu/profily/, the domain's root and every
// address outside profily/ send there with the rest of the address kept, so old links keep working: GitHub sends
// barasoukup.github.io/profily-ulic/<path> to streetspace.eu/<path>, and <path> (#rez=…, ?mesto=…, brno/…) goes on
// to streetspace.eu/profily/<path>; streetspace.eu/profile/ too. On barasoukup.github.io (before the domain is set) the base is /profily-ulic/.
//   node tools/build_root_site.mjs _site     (after the app was moved to _site/profily)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const APP = "profily/";
// The script of both pages: the address under the site's base moved into the app's folder.
export const SEND = `(function () {
  var base = /\\.github\\.io$/.test(location.hostname) ? "/" + location.pathname.split("/")[1] + "/" : "/";
  var rest = location.pathname.indexOf(base) === 0 ? location.pathname.slice(base.length) : "";
  if (rest.indexOf("${APP}") === 0) return false;
  // The English address /profile/ (Bára 16. 11. 2026) is the same app.
  rest = rest.replace(/^profile(\\/|$)/, "");
  location.replace(base + "${APP}" + rest + location.search + location.hash);
  return true;
})()`;

const page = (title, body) => `<!doctype html>
<html lang="cs"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="robots" content="noindex">
<script>${SEND}</script>
</head><body style="font-family: system-ui, sans-serif; margin: 2rem">${body}</body></html>
`;

// The root pages of the built site (tools/build_site.mjs calls it; the app is already in <out>/profily).
export function writeRootSite(out) {
  if (!fs.existsSync(path.join(out, APP, "index.html"))) throw new Error(`${out}/${APP}index.html is missing: move the app there first`);
  fs.writeFileSync(path.join(out, "index.html"), page("Profily ulic", `<p><a href="${APP}">Profily ulic</a></p>`));
  // GitHub Pages answers a missing address with 404.html: inside profily/ it is a real "not found".
  fs.writeFileSync(path.join(out, "404.html"), page("Stránka nenalezena", `<p>Tahle stránka neexistuje. <a href="/${APP}">Profily ulic</a></p>`));
  console.log(`${out}/index.html, ${out}/404.html → ${APP}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) writeRootSite(process.argv[2]);
