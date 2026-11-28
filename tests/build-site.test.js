// tools/build_site.mjs (what pages.yml runs to assemble the site): the layout of the built site, the secrets only where they
// belong, the inputs the deploy builds from the network only when they are there.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSite } from "../tools/build_site.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "profily-build-site-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const from = path.join(tmp, "in");
fs.mkdirSync(path.join(from, "site-brno/data/parking"), { recursive: true });
fs.mkdirSync(path.join(from, "site-osm"), { recursive: true });
fs.writeFileSync(path.join(from, "site-zps.json"), '{"zps":1}');
fs.writeFileSync(path.join(from, "site-brno/data/parking/a.json"), "{}");
fs.writeFileSync(path.join(from, "site-osm/index.json"), "{}");
fs.writeFileSync(path.join(from, "site-osm/cz.posm"), "x");

test("sestavení webu: aplikace v profily/, kořen a přesměrování vedle, data z vstupů", () => {
  const out = path.join(tmp, "out");
  buildSite(out, from, { MAPY_KEY: 'a$&"b', LOG_URL: "https://log.example.org/x", DK_TOKEN: "" });
  for (const f of ["index.html", "404.html", ".nojekyll", "profily/index.html", "profily/brno/index.html", "profily/data/zps.json",
    "profily/data/brno/parking/a.json", "profily/data/osm-pack/cz.posm", "profily/data/osm-pack/index.json", "profily/data/README.txt",
    "profily/data/LICENSES-AND-SOURCES.md", "profily/data/LICENCE-A-ZDROJE.md"]) assert.ok(fs.existsSync(path.join(out, f)), f);
  assert.ok(!fs.existsSync(path.join(out, "profily/data/built-up-age")), "bez vstupu žádná dlaždice");
  assert.ok(!fs.existsSync(path.join(out, "profily/config.local.js")));
  const config = fs.readFileSync(path.join(out, "profily/config.js"), "utf8");
  assert.match(config, /STATIC = true;/);
  assert.ok(config.includes(`MAPY_KEY = ${JSON.stringify('a$&"b')}`), "klíč jako řetězec JSON, bez zvláštních náhrad");
  assert.ok(config.includes('LOG_URL = "https://log.example.org/x"'));
  assert.ok(config.includes('DK_TOKEN = ""'));
  const html = fs.readFileSync(path.join(out, "profily/index.html"), "utf8");
  assert.match(html.match(/connect-src [^;]*/)[0], /https:\/\/log\.example\.org/);
  assert.match(html, /<script type="importmap">/);
});

test("sestavení webu: bez pásem zón se nesestaví", () => {
  assert.throws(() => buildSite(path.join(tmp, "out2"), path.join(tmp, "nic")), /site-zps\.json/);
});
