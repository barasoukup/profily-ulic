// The built site (tools/version_modules.mjs, as pages.yml runs it): every import of every module goes through the import
// map with a version, every file the map names exists, the page's CSP has the hash of the map's inline script.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { versionSite, moduleFiles } from "../tools/version_modules.mjs";

const SRC = new URL("../app/public/", import.meta.url).pathname;
const STATIC_RE = /^\s*(?:import|export)\s[^;'"]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm;
const DYNAMIC_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
// Only local (git-ignored) files may be missing from the site.
const LOCAL_ONLY = new Set(["config.local.js"]);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "profily-site-"));
fs.cpSync(SRC, tmp, { recursive: true, filter: (f) => !f.endsWith("config.local.js") });
versionSite(tmp);
const html = fs.readFileSync(path.join(tmp, "index.html"), "utf8");
const inline = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
const map = JSON.parse(inline[1]).imports;

test("sestavený web: import mapa má verzi každého modulu a každý soubor existuje", () => {
  assert.deepEqual(Object.keys(map), moduleFiles(tmp).map((f) => `./${f}`));
  for (const [key, value] of Object.entries(map)) {
    assert.match(value, /^\.\/.+\?v=[0-9a-f]{10}$/, key);
    assert.ok(fs.existsSync(path.join(tmp, value.slice(2).split("?")[0])), `${key} -> ${value}`);
    assert.equal(value.split("?")[0], key);
  }
});

test("sestavený web: každý statický i dynamický import jde přes mapu", () => {
  const unmapped = [];
  for (const rel of moduleFiles(tmp)) {
    const src = fs.readFileSync(path.join(tmp, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const specs = [...[...src.matchAll(STATIC_RE)].map((m) => m[1] || m[2]), ...[...src.matchAll(DYNAMIC_RE)].map((m) => m[1])];
    for (const spec of specs.filter((s) => s.startsWith("."))) {
      const key = "./" + path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec));
      if (!map[key] && !LOCAL_ONLY.has(path.posix.basename(spec))) unmapped.push(`${rel} imports ${spec}`);
    }
  }
  assert.deepEqual(unmapped, []);
});

test("sestavený web: vstupní modul stránky má verzi a CSP má hash import mapy, ne unsafe-inline", () => {
  for (const m of html.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g)) assert.ok(map[`./${m[1].split("?")[0]}`] === `./${m[1]}`, m[1]);
  const hash = "sha256-" + crypto.createHash("sha256").update(inline[1]).digest("base64");
  const scriptSrc = html.match(/script-src ([^;"]*)/)[1];
  assert.ok(scriptSrc.includes(`'${hash}'`));
  assert.ok(!scriptSrc.includes("unsafe-inline"));
});

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test("zdroje zůstávají beze změny (verze jen ve výstupu)", () => {
  assert.ok(!/importmap/.test(fs.readFileSync(path.join(SRC, "index.html"), "utf8")));
});
