// Languages (Bára 12. 11. 2026): every Czech text of the app has its English (en.js), with the same {names} filled
// in; en.js holds nothing the app no longer says; the page's own texts (index.html) are translated too.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EN, EN_HTML, EN_CITY, EN_ATTRIBUTION } from "../pilot/public/en.js";

const DIR = new URL("../pilot/public/", import.meta.url);
const FILES = [...fs.readdirSync(DIR).filter((f) => f.endsWith(".js")), ...fs.readdirSync(new URL("towns/", DIR)).map((f) => `towns/${f}`)]
  .filter((f) => f.endsWith(".js") && f !== "en.js");

// The texts the code hands to t() (tr() where t means something else), as written: "…" only (the code never
// uses another quote for them).
export function codeTexts() {
  const out = new Map();
  for (const f of FILES) {
    const src = fs.readFileSync(new URL(f, DIR), "utf8");
    for (const m of src.matchAll(/\b(?:t|tr)\(\s*"((?:[^"\\]|\\.)*)"/g)) out.set(JSON.parse(`"${m[1]}"`), f);
    // A t() of anything but a plain text could not be checked here.
    for (const m of src.matchAll(/\b(?:t|tr)\(\s*([`'])/g)) assert.fail(`${f}: t(${m[1]}…) – texty pro překlad v "…"`);
  }
  return out;
}

// The texts of index.html that translatePage looks up: text nodes and the attributes people read, outside the
// elements whose HTML is replaced whole (data-i18n) and outside <script>, <style> and <noscript>.
export function pageTexts() {
  let html = fs.readFileSync(new URL("index.html", DIR), "utf8");
  html = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/g, "");
  for (;;) {
    const m = /<(\w+)\b[^>]*\bdata-i18n="[^"]*"[^>]*>/.exec(html);
    if (!m) break;
    const end = html.indexOf(`</${m[1]}>`, m.index);
    html = html.slice(0, m.index) + html.slice(end + m[1].length + 3);
  }
  const out = new Set();
  const head = html.slice(0, html.indexOf("<body"));
  out.add(/<title>([^<]*)<\/title>/.exec(head)[1]);
  for (const m of head.matchAll(/<meta (?:name="description"|property="og:(?:title|description|image:alt)") content="([^"]*)"/g)) out.add(m[1]);
  const body = html.slice(html.indexOf("<body"));
  for (const m of body.matchAll(/>([^<]+)</g)) if (/\p{L}/u.test(m[1])) out.add(m[1].trim().replace(/\s+/g, " "));
  for (const m of body.matchAll(/\s(?:title|aria-label|placeholder|alt|data-label)="([^"]+)"/g)) if (/\p{L}/u.test(m[1])) out.add(m[1]);
  return out;
}

const names = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
// Words of a text that are only Czech (English names keep some: ČÚZK, RÚIAN, Plzeň).
const CZECH = /[ěščřžůňťď]/i;

test("každý text aplikace má anglický překlad se stejnými {jmény}", () => {
  const texts = codeTexts();
  const missing = [...texts].filter(([cs]) => !(cs in EN)).map(([cs, f]) => `${f}: ${cs}`);
  assert.deepEqual(missing, [], "chybí v en.js");
  for (const [cs] of texts) assert.deepEqual(names(EN[cs]), names(cs), `jiná {jména}: ${cs}`);
});

test("en.js nemá texty, které aplikace už neříká", () => {
  const used = new Set([...codeTexts().keys(), ...pageTexts()]);
  assert.deepEqual(Object.keys(EN).filter((cs) => !used.has(cs)), []);
});

test("texty stránky (index.html) mají anglický překlad", () => {
  const missing = [...pageTexts()].filter((cs) => !(cs in EN) && CZECH.test(cs) | /[áéíóúý]/i.test(cs));
  assert.deepEqual(missing, []);
  const html = fs.readFileSync(new URL("index.html", DIR), "utf8");
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(EN_HTML[m[1]], `EN_HTML.${m[1]}`);
});

test("styly nepíšou texty (překládají se jen v HTML a v kódu)", () => {
  const css = fs.readFileSync(new URL("style.css", DIR), "utf8");
  assert.deepEqual([...css.matchAll(/content:\s*"([^"]*\p{L}[^"]*)"/gu)].map((m) => m[1]), []);
});

test("anglické texty jsou anglicky", () => {
  const czech = Object.entries(EN).filter(([, en]) => /\b(je|jsou|nebo|na|pro|ulice|chodník)\b/i.test(en.replace(/ČÚZK|RÚIAN|Statutární město \S+|kraj\b/g, "")));
  assert.deepEqual(czech, []);
});

test("každé město má anglické texty", async () => {
  const { CITY_IDS, cityById } = await import("../pilot/public/city.js");
  const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
  for (const id of CITY_IDS) {
    const en = EN_CITY[id] || EN_CITY[cityById(id).like];
    assert.ok(en, id);
    for (const k of FIELDS) assert.ok(typeof en[k] === "string" && en[k], `${id}.${k}`);
    // The credit names the same sources as the Czech one (the export adds the DMVS and RÚIAN when they are missing).
    for (const src of ["IS DMVS", "RÚIAN"]) assert.equal(en.credit.includes(src), cityById(id).credit.includes(src), `${id}: ${src}`);
  }
  assert.ok(EN_ATTRIBUTION.every(([cs, en]) => cs && typeof en === "string"));
});

test("i18n.js: čísla, {jména}, chybějící text a kredity mapy", async () => {
  globalThis.PROFILY_LANG = "en";
  // A copy of its own (the language is read once, when the module loads).
  const i18n = await import("../pilot/public/i18n.js?en");
  delete globalThis.PROFILY_LANG;
  assert.equal(i18n.lang, "en");
  assert.equal(i18n.num(3.5), "3.50");
  assert.equal(i18n.t("Celkem {w}", { w: "12.00 m" }), "Total 12.00 m");
  assert.equal(i18n.t("text, který en.js nemá"), "text, který en.js nemá", "chybějící text zůstane česky");
  assert.equal(i18n.attribution("technická mapa © Statutární město Brno"), "technical map © Statutární město Brno");
  const cs = await import("../pilot/public/i18n.js");
  assert.equal(cs.lang, "cs");
  assert.equal(cs.num(3.5), "3,50");
  assert.equal(cs.t("Celkem {w}", { w: "12,00 m" }), "Celkem 12,00 m");
});
