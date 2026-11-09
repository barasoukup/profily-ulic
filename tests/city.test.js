// The Brno site is made from the Prague files (tools/city_site.mjs): every swap must still find its text.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { brnoConfig, brnoIndex } from "../tools/city_site.mjs";

const read = (f) => fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8");

test("config.js pro Brno má CITY = brno", () => {
  assert.match(brnoConfig(read("config.js")), /export const CITY = "brno";/);
});

test("index.html pro Brno: titulek, CSP pro mapy Brna a ČÚZK, patička bez IPR", () => {
  const html = brnoIndex(read("index.html"));
  assert.match(html, /<title>Profily ulic · Brno<\/title>/);
  assert.match(html, /img-src [^;]*https:\/\/gis\.brno\.cz https:\/\/dmvs\.cuzk\.gov\.cz/);
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.doesNotMatch(footer, /IPR|TSK/);
  assert.match(footer, /DTM Jihomoravského kraje/);
});
