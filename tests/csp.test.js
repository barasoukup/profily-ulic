// The page's CSP (index.html) is written by hand, but every host the app's code asks for data must be in its
// connect-src (docs/architecture-countries.md, step 5): a new state's or city's source that is not there would fail
// only in the browser, on the web. Hosts the code names only for map tiles (img-src) or links are listed here.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LANGS } from "../pilot/public/i18n.js";

const DIR = new URL("../pilot/public/", import.meta.url);
const FILES = [...fs.readdirSync(DIR).filter((f) => f.endsWith(".js")), ...["towns", "countries"].flatMap((d) => fs.readdirSync(new URL(`${d}/`, DIR)).map((f) => `${d}/${f}`))]
  // The languages' texts (en.js, fr.js…) only link to the sources, in the footer.
  .filter((f) => f.endsWith(".js") && !Object.keys(LANGS).some((l) => f === `${l}.js`));
// Map tiles and links (not fetched by the code).
const NOT_FETCHED = new Set(["tile.openstreetmap.org", "www.openstreetmap.org", "tiles.arcgis.com", "mapy.com", "github.com"]);

test("CSP: connect-src má všechny hostitele, na které se ptají moduly zdrojů, měst a států", () => {
  const html = fs.readFileSync(new URL("index.html", DIR), "utf8");
  const connect = html.match(/connect-src [^;]*/)[0].split(/\s+/).slice(1);
  const allowed = (host) => connect.some((c) => c === `https://${host}` || (c.startsWith("https://*.") && host.endsWith(c.slice(9))));
  const missing = [];
  for (const f of FILES) {
    for (const m of fs.readFileSync(new URL(f, DIR), "utf8").matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})/g)) {
      if (!NOT_FETCHED.has(m[1]) && !allowed(m[1])) missing.push(`${m[1]} (${f})`);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test("seznam států pro nasazení: každý má modul státu v aplikaci", async () => {
  const { COUNTRIES } = await import("../tools/countries.mjs");
  const { COUNTRIES: APP } = await import("../pilot/public/countries/index.js");
  for (const [key, c] of Object.entries(COUNTRIES)) {
    assert.ok(APP[c.iso], `${key}: countries/${c.iso}.js`);
    assert.equal(key, c.iso.toLowerCase());
  }
  assert.deepEqual(Object.keys(APP).sort(), Object.values(COUNTRIES).map((c) => c.iso).sort());
});
