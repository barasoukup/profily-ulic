// Languages (Bára 12. 11. 2026, Slovak 15. 11. 2026, German 16. 11. 2026, all 24 official languages of the EU
// 17. 11. 2026): every Czech text of the app has its English (en.js) and its text in every other language (<lang>.js),
// with the same {names} filled in; none holds a text the app no longer says; the page's own texts (index.html) are
// translated too.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EN, EN_HTML, EN_CITY, EN_ATTRIBUTION } from "../app/public/en.js";
import { SK, SK_HTML, SK_CITY, SK_ATTRIBUTION } from "../app/public/sk.js";
import { DE, DE_HTML, DE_CITY, DE_ATTRIBUTION } from "../app/public/de.js";
import { LANGS } from "../app/public/i18n.js";

const DIR = new URL("../app/public/", import.meta.url);
const FILES = [...fs.readdirSync(DIR).filter((f) => f.endsWith(".js")), ...["towns", "countries"].flatMap((d) => fs.readdirSync(new URL(`${d}/`, DIR)).map((f) => `${d}/${f}`))]
  .filter((f) => f.endsWith(".js") && !Object.keys(LANGS).some((l) => f === `${l}.js`));

// The texts the code hands to t() (tr() where t means something else), as written: "…" only (the code never
// uses another quote for them).
export function codeTexts() {
  const out = new Map();
  for (const f of FILES) {
    const src = fs.readFileSync(new URL(f, DIR), "utf8");
    for (const m of src.matchAll(/\b(?:t|tr|mark)\(\s*"((?:[^"\\]|\\.)*)"/g)) out.set(JSON.parse(`"${m[1]}"`), f);
    // A t() of anything but a plain text could not be checked here.
    for (const m of src.matchAll(/\b(?:t|tr|mark)\(\s*([`'])/g)) assert.fail(`${f}: t(${m[1]}…) – texty pro překlad v "…"`);
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
  const { CITY_IDS, cityById } = await import("../app/public/city.js");
  const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
  for (const id of CITY_IDS) {
    const en = EN_CITY[id] || EN_CITY[cityById(id).like];
    assert.ok(en, id);
    // Abroad (city.js abroad) there is no technical map to name and no data of the city to credit.
    const none = cityById(id).abroad ? ["dataName", "techMap"] : [];
    for (const k of FIELDS) assert.ok(none.includes(k) ? !en[k] : typeof en[k] === "string" && (en[k] || (k === "credit" && !cityById(id).credit)), `${id}.${k}`);
    // The credit names the same sources as the Czech one (the export adds the DMVS and RÚIAN when they are missing).
    for (const src of ["IS DMVS", "RÚIAN"]) assert.equal(en.credit.includes(src), cityById(id).credit.includes(src), `${id}: ${src}`);
  }
  assert.ok(EN_ATTRIBUTION.every(([cs, en]) => cs && typeof en === "string"));
});

test("i18n.js: čísla, {jména}, chybějící text a kredity mapy", async () => {
  globalThis.PROFILY_LANG = "en";
  // A copy of its own (the language is read once, when the module loads).
  const i18n = await import("../app/public/i18n.js?en");
  delete globalThis.PROFILY_LANG;
  assert.equal(i18n.lang, "en");
  assert.equal(i18n.num(3.5), "3.50");
  assert.equal(i18n.t("Celkem {w}", { w: "12.00 m" }), "Total 12.00 m");
  assert.equal(i18n.t("text, který en.js nemá"), "text, který en.js nemá", "chybějící text zůstane česky");
  assert.equal(i18n.attribution("technická mapa © Statutární město Brno"), "technical map © Statutární město Brno");
  const cs = await import("../app/public/i18n.js");
  assert.equal(cs.lang, "cs");
  assert.equal(cs.num(3.5), "3,50");
  assert.equal(cs.t("Celkem {w}", { w: "12,00 m" }), "Celkem 12,00 m");
});

// Slovak (sk.js): the same texts as English, Slovak words, numbers written as in Czech.
test("slovenčina: každý text aplikace a stránky má překlad se stejnými {jmény} a nic navíc", () => {
  assert.deepEqual(Object.keys(SK).filter((cs) => !(cs in EN)), [], "v sk.js navíc proti en.js");
  assert.deepEqual(Object.keys(EN).filter((cs) => !(cs in SK)), [], "chybí v sk.js");
  for (const cs of Object.keys(SK)) assert.deepEqual(names(SK[cs]), names(cs), `jiná {jména}: ${cs}`);
  const html = fs.readFileSync(new URL("index.html", DIR), "utf8");
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(SK_HTML[m[1]], `SK_HTML.${m[1]}`);
});

test("slovenské texty jsou slovensky", () => {
  // Czech-only letters and words (names of Czech places and offices keep theirs).
  const keep = /Géoplateforme|ČÚZK|RÚIAN|IPR|TSK|MHMP|Statutární město \S+|Město \S+|Geoportál Praha|hl\. m\. Prahy|[A-ZČŘŠŽ][a-zěščřžýáíéůú]+(?:ský|cký) kraj|Kraj Vysočina|Plzeň|Plzni|Plzně|Třebíč|Břeclav|Přerov|Frýdek-Místek|Karviná|Ústí|Jihlava|Opava|Ostrava|Most|Brno|Praha|Pardubice|parkovanivbrne\.cz|data\.brno\.cz|Manuál\S*|Olgoj Chorchoj/g;
  const czech = Object.entries(SK).filter(([, sk]) => /[ěřů]|\b(jsou|nebo|také|který|která|které)\b/i.test(sk.replace(keep, "")));
  assert.deepEqual(czech.map(([cs]) => cs), []);
});

test("každé město má slovenské texty", async () => {
  const { CITY_IDS, cityById } = await import("../app/public/city.js");
  const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
  for (const id of CITY_IDS) {
    const sk = SK_CITY[id] || SK_CITY[cityById(id).like];
    assert.ok(sk, id);
    // Abroad (city.js abroad) there is no technical map to name and no data of the city to credit.
    const none = cityById(id).abroad ? ["dataName", "techMap"] : [];
    for (const k of FIELDS) assert.ok(none.includes(k) ? !sk[k] : typeof sk[k] === "string" && (sk[k] || (k === "credit" && !cityById(id).credit)), `${id}.${k}`);
    for (const src of ["IS DMVS", "RÚIAN"]) assert.equal(sk.credit.includes(src), cityById(id).credit.includes(src), `${id}: ${src}`);
  }
  assert.ok(SK_ATTRIBUTION.every(([cs, sk]) => cs && typeof sk === "string"));
});

test("i18n.js po slovensky: čísla jako v češtině, chybějící text česky", async () => {
  globalThis.PROFILY_LANG = "sk";
  const i18n = await import("../app/public/i18n.js?sk");
  delete globalThis.PROFILY_LANG;
  assert.equal(i18n.lang, "sk");
  assert.equal(i18n.num(3.5), "3,50");
  assert.equal(i18n.pct(44), "44 %");
  assert.equal(i18n.t("Celkem {w}", { w: "12,00 m" }), SK["Celkem {w}"].replace("{w}", "12,00 m"));
  assert.equal(i18n.t("text, který sk.js nemá"), "text, který sk.js nemá");
});

// German (de.js, Bára 16. 11. 2026): the same texts as English, German words, numbers written as in Czech. The
// language is not the state: Czech signs, rules and offices keep their Czech names and codes.
test("němčina: každý text aplikace a stránky má překlad se stejnými {jmény} a nic navíc", () => {
  assert.deepEqual(Object.keys(DE).filter((cs) => !(cs in EN)), [], "v de.js navíc proti en.js");
  assert.deepEqual(Object.keys(EN).filter((cs) => !(cs in DE)), [], "chybí v de.js");
  for (const cs of Object.keys(DE)) assert.deepEqual(names(DE[cs]), names(cs), `jiná {jména}: ${cs}`);
  const html = fs.readFileSync(new URL("index.html", DIR), "utf8");
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(DE_HTML[m[1]], `DE_HTML.${m[1]}`);
});

test("německé texty jsou německy", () => {
  // Czech and Slovak names of places, offices, standards and sources keep their letters ("je" and "pro" are German too).
  const keep = /Géoplateforme|ČÚZK|ČSN|GKÚ|ÚGKK|Bára|RÚIAN|ÚAP|IPR|TSK|MHMP|Statutární město \S+|Město \S+|Geoportál Praha|hl\. m\. Prahy|[A-ZČŘŠŽÚ][a-zěščřžýáíéůú]+(?:ský|cký) kraj|Kraj Vysočina|Profily ulic|Plzeň|Třebíč|Břeclav|Přerov|Frýdek-Místek|Karviná|Ústí nad Labem|Ústí|Žilina|Banská Bystrica|Piešťany|Prešov|Košice|Dúbravka|Soukupová|Mapy\.com|\bSb\.|\bč\./g;
  const czech = Object.entries(DE).filter(([, de]) => /[ěščřžůňťďýáíéúľĺŕô]|\b(jsou|nebo|také|který|která|ulice|chodník)\b/i.test(de.replace(keep, "")));
  assert.deepEqual(czech.map(([cs]) => cs), []);
  // The app's terms: the modes and the main parts (Bára's terminology).
  for (const [cs, de] of [["Stav", "Bestand"], ["Návrh", "Planung"], ["Porovnat", "Vergleich"], ["Chodník", "Gehweg"], ["Jízdní pruh", "Fahrstreifen"],
    ["Vyhrazený cyklopruh", "Radfahrstreifen"], ["Ochranný cyklopruh", "Schutzstreifen"], ["Vozovka", "Fahrbahn"], ["Profily ulic", "Straßenprofil"]]) assert.equal(DE[cs], de, cs);
});

test("každé město má německé texty", async () => {
  const { CITY_IDS, cityById } = await import("../app/public/city.js");
  const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
  for (const id of CITY_IDS) {
    const de = DE_CITY[id] || DE_CITY[cityById(id).like];
    assert.ok(de, id);
    const none = cityById(id).abroad ? ["dataName", "techMap"] : [];
    for (const k of FIELDS) assert.ok(none.includes(k) ? !de[k] : typeof de[k] === "string" && (de[k] || (k === "credit" && !cityById(id).credit)), `${id}.${k}`);
    for (const src of ["IS DMVS", "RÚIAN"]) assert.equal(de.credit.includes(src), cityById(id).credit.includes(src), `${id}: ${src}`);
  }
  assert.deepEqual(DE_ATTRIBUTION.map(([cs]) => cs), EN_ATTRIBUTION.map(([cs]) => cs));
  assert.ok(DE_ATTRIBUTION.every(([cs, de]) => cs && typeof de === "string"));
});

test("i18n.js po německy: desetinná čárka jako v češtině, chybějící text česky", async () => {
  globalThis.PROFILY_LANG = "de";
  const i18n = await import("../app/public/i18n.js?de");
  delete globalThis.PROFILY_LANG;
  assert.equal(i18n.lang, "de");
  assert.ok("de" in i18n.LANGS);
  assert.equal(i18n.num(3.5), "3,50");
  assert.equal(i18n.pct(44), "44 %");
  assert.equal(i18n.numField(2.5), "2,5");
  assert.equal(i18n.readNum("2,5"), 2.5);
  assert.equal(i18n.t("Celkem {w}", { w: "12,00 m" }), "Gesamt 12,00 m");
  assert.equal(i18n.t("text, který de.js nemá"), "text, který de.js nemá");
  assert.equal(i18n.attribution("technická mapa © Statutární město Brno"), "technische Karte © Statutární město Brno");
});

test("jazyk není stát: německé rozhraní nemění značky ani pravidla řezu v Česku", async () => {
  // The signs and rules follow the cut's state; no module but i18n.js and the language menu reads the language.
  for (const f of FILES.filter((f) => !["i18n.js", "app.js", "errors.js"].includes(f))) {
    const src = fs.readFileSync(new URL(f, DIR), "utf8");
    assert.ok(!/\blang\b\s*[!=]==/.test(src), `${f} rozhoduje podle jazyka`);
  }
});

// The other 20 languages of the EU (Bára 17. 11. 2026), machine translations like German: the same texts as English,
// no Czech left, numbers as the language writes them.
const OTHER = Object.keys(LANGS).filter((l) => !["cs", "en", "sk", "de"].includes(l));
const tables = async (l) => {
  const m = await import(`../app/public/${l}.js`), U = l.toUpperCase();
  return { texts: m[U], html: m[`${U}_HTML`], city: m[`${U}_CITY`], attribution: m[`${U}_ATTRIBUTION`] };
};
// Czech and Slovak names of places, offices, standards and sources keep their letters.
const KEEP = /ČÚZK|ČSN|GKÚ|ÚGKK|Bára|RÚIAN|ÚAP|IPR|TSK|MHMP|Statutární město \S+|Město \S+|Geoportál Praha|hl\. m\. Prahy|[A-ZČŘŠŽÚ][a-zěščřžýáíéůú]+(?:ský|cký) kraj|Kraj Vysočina|Profily ulic|Plzeň|Plzni|Plzně|Třebíč|Břeclav|Přerov|Frýdek-Místek|Karviná|Ústí nad Labem|Ústí|Žilina|Banská Bystrica|Piešťany|Prešov|Košice|Dúbravka|Soukupová|Mapy\.com|\bSb\.|\bč\./g;

test("všech 24 úředních jazyků EU, každý pojmenovaný sám sebou", () => {
  assert.deepEqual(Object.keys(LANGS).sort(), ["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "ga", "hr", "hu", "it", "lt", "lv", "mt", "nl", "pl", "pt", "ro", "sk", "sl", "sv"]);
  assert.equal(new Set(Object.values(LANGS)).size, 24);
});

for (const l of OTHER) {
  test(`${l}: každý text aplikace a stránky má překlad se stejnými {jmény}, nic navíc, bez češtiny`, async () => {
    const { texts, html, city, attribution } = await tables(l);
    assert.deepEqual(Object.keys(texts).filter((cs) => !(cs in EN)), [], `v ${l}.js navíc proti en.js`);
    assert.deepEqual(Object.keys(EN).filter((cs) => !(cs in texts)), [], `chybí v ${l}.js`);
    for (const cs of Object.keys(texts)) {
      assert.equal(typeof texts[cs], "string", cs);
      assert.deepEqual(names(texts[cs]), names(cs), `jiná {jména}: ${cs}`);
    }
    const page = fs.readFileSync(new URL("index.html", DIR), "utf8");
    for (const m of page.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(html[m[1]], `${l.toUpperCase()}_HTML.${m[1]}`);
    // Czech-only letters and words ("nebo" and "ulice" are Croatian and Slovenian too).
    const czech = Object.entries(texts).filter(([, v]) => /[ěřůťď]|\b(jsou|také|který|která|které|chodník)\b/i.test(v.replace(KEEP, "")));
    assert.deepEqual(czech.map(([cs]) => cs), [], `česky v ${l}.js`);
    // The city's texts: the same fields as in English, the same sources credited.
    const { CITY_IDS, cityById } = await import("../app/public/city.js");
    const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
    for (const id of CITY_IDS) {
      const c = city[id] || city[cityById(id).like];
      assert.ok(c, `${l}: ${id}`);
      const none = cityById(id).abroad ? ["dataName", "techMap"] : [];
      for (const k of FIELDS) assert.ok(none.includes(k) ? !c[k] : typeof c[k] === "string" && (c[k] || (k === "credit" && !cityById(id).credit)), `${l}: ${id}.${k}`);
      for (const src of ["IS DMVS", "RÚIAN"]) assert.equal(c.credit.includes(src), cityById(id).credit.includes(src), `${l}: ${id}: ${src}`);
    }
    assert.deepEqual(attribution.map(([cs]) => cs), EN_ATTRIBUTION.map(([cs]) => cs));
    assert.ok(attribution.every(([cs, v]) => cs && typeof v === "string" && v));
  });
}

test("čísla podle jazyka: desetinná tečka jen v angličtině, irštině a maltštině", async () => {
  for (const l of Object.keys(LANGS)) {
    globalThis.PROFILY_LANG = l;
    const i18n = await import(`../app/public/i18n.js?num-${l}`);
    delete globalThis.PROFILY_LANG;
    assert.equal(i18n.lang, l);
    const point = ["en", "ga", "mt"].includes(l);
    assert.equal(i18n.num(3.5), point ? "3.50" : "3,50", l);
    assert.equal(i18n.numField(2.5), point ? "2.5" : "2,5", l);
    assert.match(i18n.pct(44), /^44\s?%$/, l);
    assert.equal(i18n.t("text, který jazyk nemá"), "text, který jazyk nemá", l);
    if (l !== "cs") assert.notEqual(i18n.t("Porovnat"), "Porovnat", l);
  }
});

test("errors.js zná všechny jazyky", async () => {
  const errors = fs.readFileSync(new URL("errors.js", DIR), "utf8");
  for (const l of Object.keys(LANGS)) assert.match(errors, new RegExp(`\\b${l}: \\{ start: "`), `errors.js: ${l}`);
  const list = /var LANGS = "([^"]+)"/.exec(errors)[1].split(" ").sort();
  assert.deepEqual(list, Object.keys(LANGS).sort());
});
