// Languages (Bára 12. 11. 2026, Slovak 15. 11. 2026, German 16. 11. 2026, all 24 official languages of the EU
// 17. 11. 2026; named keys and one JSON file per language since 27. 11. 2026, app/public/locales/<lang>.json): every
// key the code and the page use is in every language with the same {names} filled in, none is a key nobody uses, the
// page's Czech (index.html) is cs.json's, and no language holds Czech it should not.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LANGS } from "../app/public/i18n.js";

const DIR = new URL("../app/public/", import.meta.url);
const FILES = [...fs.readdirSync(DIR).filter((f) => f.endsWith(".js")), ...["towns", "countries"].flatMap((d) => fs.readdirSync(new URL(`${d}/`, DIR)).map((f) => `${d}/${f}`))]
  .filter((f) => f.endsWith(".js"));
const src = (f) => fs.readFileSync(new URL(f, DIR), "utf8");
const L = Object.fromEntries(Object.keys(LANGS).map((l) => [l, JSON.parse(fs.readFileSync(new URL(`locales/${l}.json`, DIR), "utf8"))]));
const CS = L.cs, EN = L.en;
const LEGACY = JSON.parse(fs.readFileSync(new URL("locales/legacy-cs-keys.json", DIR), "utf8"));
const names = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const KEY = /^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9-]+)+$/;

// The keys the code hands to t() (tr() where t means something else) and mark(), as written: "…" only.
export function codeKeys() {
  const out = new Map();
  for (const f of FILES) {
    const s = src(f);
    for (const m of s.matchAll(/\b(?:t|tr|mark)\(\s*"((?:[^"\\]|\\.)*)"/g)) out.set(m[1], f);
    for (const m of s.matchAll(/\b(?:t|tr|mark)\(\s*([`'])/g)) assert.fail(`${f}: t(${m[1]}…) – klíče v "…"`);
  }
  return out;
}
// A t() of a variable only where the text is known to flow so (a credit, a note of the cut, a base map's name, the
// state's text): anything else would escape this test.
const VARIABLE = {
  "app.js": ["tr(credit)", "tr(o.credit)", "tr(k)", 'tr(localStorage.getItem(BASE_KEY) || "")', 'tr(state.cut?.note || "")'],
  "sources.js": ["t(country.linesMissing)"],
};
// The page's keys: data-t, data-t-<attribute>, data-t-html.
const PAGE = src("index.html");
const pageKeys = () => [...PAGE.matchAll(/\sdata-t(?:-[\w-]+)?="([^"]+)"/g)].map((m) => m[1]);

test("soubory jazyků: platný JSON, plochý, jen texty, všech 24 jazyků se stejnými klíči", () => {
  assert.deepEqual(fs.readdirSync(new URL("locales/", DIR)).filter((f) => /^[a-z]{2}\.json$/.test(f)).map((f) => f.slice(0, 2)).sort(), Object.keys(LANGS).sort());
  const keys = Object.keys(CS).sort();
  for (const [l, tab] of Object.entries(L)) {
    assert.deepEqual(Object.keys(tab).sort(), keys, `${l}.json má jiné klíče než cs.json`);
    for (const [k, v] of Object.entries(tab)) {
      assert.match(k, KEY, `${l}: klíč ${k}`);
      assert.equal(typeof v, "string", `${l}: ${k}`);
      assert.ok(v.trim(), `${l}: ${k} je prázdný`);
    }
  }
});

test("každý klíč z kódu a stránky je v jazycích, stejné {jména} ve všech jazycích", () => {
  const missing = [...codeKeys()].filter(([k]) => !(k in CS)).map(([k, f]) => `${f}: ${k}`);
  assert.deepEqual(missing, [], "chybí v cs.json");
  assert.deepEqual(pageKeys().filter((k) => !(k in CS)), [], "index.html: chybí v cs.json");
  for (const [l, tab] of Object.entries(L)) for (const k of Object.keys(CS)) assert.deepEqual(names(tab[k]), names(CS[k]), `${l}: jiná {jména}: ${k}`);
});

test("t() s proměnnou jen na vyjmenovaných místech", () => {
  const found = {};
  for (const f of FILES.filter((f) => f !== "i18n.js")) {
    for (const m of src(f).matchAll(/(?<![\w.$])(?:t|tr|mark)\((?!\s*")([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) {
      // app.js: a mark() of its own (the hover of a part); t() in the comments
      if (/^(true|false|)$/.test(m[1].trim())) continue;
      if (!(found[f] ??= []).includes(m[0])) found[f].push(m[0]);
    }
  }
  assert.deepEqual(found, VARIABLE);
});

test("žádný klíč, který aplikace nepoužívá", () => {
  const used = new Set([...codeKeys().keys(), ...pageKeys()]);
  // Keys in the code as plain strings (lanes-ortho.js credits, which app.js hands to t()).
  for (const f of FILES) for (const m of src(f).matchAll(/"([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9-]+)+)"/g)) if (m[1] in CS) used.add(m[1]);
  // The cities' texts (i18n.js cityTexts), the map credits' words (i18n.js attribution).
  for (const k of Object.keys(CS)) if (/^(city|attribution)\./.test(k)) used.add(k);
  assert.deepEqual(Object.keys(CS).filter((k) => !used.has(k)), []);
  // The old Czech sentences of saved cuts point at keys there are.
  for (const [cs, k] of Object.entries(LEGACY)) assert.ok(k in CS, `${cs} → ${k}`);
});

test("index.html: český text a atributy jsou ty z cs.json", () => {
  // Text of an element with data-t (spaces around do not count), attributes named by data-t-<attribute>.
  for (const m of PAGE.matchAll(/<(\w+)\b([^>]*)\sdata-t="([^"]+)"([^>]*)>([^<]*)</g)) assert.equal(m[5].trim(), CS[m[3]], m[3]);
  for (const m of PAGE.matchAll(/<\w+\b[^>]*>/g)) {
    for (const a of m[0].matchAll(/\sdata-t-([\w-]+)="([^"]+)"/g)) {
      if (a[1] === "html") continue;
      const v = new RegExp(`\\s${a[1]}="([^"]*)"`).exec(m[0]);
      assert.equal(v?.[1], CS[a[2]], `${a[2]} (${a[1]})`);
    }
  }
  const foot = /<div data-t-html="html\.footer">([\s\S]*?)<\/div>\s*<\/details>/.exec(PAGE);
  assert.equal(foot[1], CS["html.footer"]);
  // No text of the page translated as before (a whole text looked up in the language): every Czech text has its key.
  const body = PAGE.slice(PAGE.indexOf("<body")).replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/g, "").replace(/<div data-t-html[\s\S]*?<\/div>\s*<\/details>/, "");
  const csValues = new Map(Object.entries(CS).map(([k, v]) => [v, k]));
  const loose = [...body.matchAll(/>([^<]+)</g)].map((m) => m[1].trim()).filter((s) => csValues.has(s));
  const keyed = new Set([...PAGE.matchAll(/\sdata-t="([^"]+)"[^>]*>([^<]*)</g)].map((m) => m[2].trim()));
  assert.deepEqual(loose.filter((s) => !keyed.has(s)), [], "text bez data-t");
});

test("styly nepíšou texty (překládají se jen v HTML a v kódu)", () => {
  const css = src("style.css");
  assert.deepEqual([...css.matchAll(/content:\s*"([^"]*\p{L}[^"]*)"/gu)].map((m) => m[1]), []);
});

test("anglické texty jsou anglicky", () => {
  const czech = Object.entries(EN).filter(([k]) => k !== "html.footer").filter(([, en]) => /\b(je|jsou|nebo|na|pro|ulice|chodník)\b/i.test(en.replace(/ČÚZK|RÚIAN|Statutární město \S+|kraj\b/g, "")));
  assert.deepEqual(czech, []);
});

test("každé město má texty ve všech jazycích", async () => {
  const { CITY_IDS, cityById } = await import("../app/public/city.js");
  const FIELDS = ["server", "dataName", "dataShort", "techMap", "parkingSource", "rulesHead", "credit"];
  // The ids with texts of their own are cities; the others take their state's (like) or another town's (i18n.js TEXT_ALIAS).
  for (const k of Object.keys(CS).filter((k) => k.startsWith("city."))) {
    const [, id, field] = k.split(".");
    assert.ok(CITY_IDS.includes(id), k);
    assert.ok(FIELDS.includes(field), k);
  }
  // In Czech (the city as setCity makes it): every field a text, abroad no map to name (null), the credit maybe "".
  for (const id of CITY_IDS) {
    const c = cityById(id);
    const none = c.abroad ? ["dataName", "techMap"] : [];
    for (const k of FIELDS) assert.ok(none.includes(k) ? c[k] === null : typeof c[k] === "string" && (c[k] || k === "credit"), `${id}.${k}`);
  }
  // The credit names the same sources in every language (the export adds the DMVS and RÚIAN when they are missing).
  for (const [l, tab] of Object.entries(L)) for (const k of Object.keys(CS).filter((k) => /^city\.[^.]+\.credit$/.test(k)))
    for (const s of ["IS DMVS", "RÚIAN"]) assert.equal(tab[k].includes(s), CS[k].includes(s), `${l}: ${k}: ${s}`);
});

test("kredity mapy: česká slova v i18n.js jsou ta z cs.json, každý jazyk má svá", () => {
  const pairs = [...src("i18n.js").matchAll(/\["([^"]+)", "(attribution\.\w+)"\]/g)];
  assert.deepEqual(pairs.map((m) => m[2]).sort(), Object.keys(CS).filter((k) => k.startsWith("attribution.")).sort());
  for (const m of pairs) assert.equal(CS[m[2]], m[1], m[2]);
});

test("i18n.js: čísla, {jména}, neznámý klíč, starý český text a kredity mapy", async () => {
  globalThis.PROFILY_LANG = "en";
  // A copy of its own (the language is read once, when the module loads).
  const i18n = await import("../app/public/i18n.js?en");
  delete globalThis.PROFILY_LANG;
  assert.equal(i18n.lang, "en");
  assert.equal(i18n.num(3.5), "3.50");
  assert.equal(i18n.t("common.totalW", { w: "12.00 m" }), "Total 12.00 m");
  assert.equal(i18n.t("text, který jazyk nemá"), "text, který jazyk nemá", "neznámý klíč zůstane, jak je");
  assert.equal(i18n.t(" · jen odhad z OSM"), " · only an estimate from OSM", "poznámka uloženého řezu z doby před klíči");
  assert.equal(i18n.t("Technická mapa"), EN["app.surfaceMap"], "podkladová mapa zapamatovaná česky");
  assert.equal(i18n.attribution("technická mapa © Statutární město Brno"), "technical map © Statutární město Brno");
  const cs = await import("../app/public/i18n.js");
  assert.equal(cs.lang, "cs");
  assert.equal(cs.num(3.5), "3,50");
  assert.equal(cs.t("common.totalW", { w: "12,00 m" }), "Celkem 12,00 m");
  assert.equal(cs.t(" · jen odhad z OSM"), " · jen odhad z OSM");
  assert.equal(cs.attribution("technická mapa © Statutární město Brno"), "technická mapa © Statutární město Brno");
});

// Czech-only letters and words; names of Czech places, offices, standards and sources keep theirs.
const KEEP_SK = /Géoplateforme|ČÚZK|RÚIAN|IPR|TSK|MHMP|Statutární město \S+|Město \S+|Geoportál Praha|hl\. m\. Prahy|[A-ZČŘŠŽ][a-zěščřžýáíéůú]+(?:ský|cký) kraj|Kraj Vysočina|Plzeň|Plzni|Plzně|Třebíč|Břeclav|Přerov|Frýdek-Místek|Karviná|Ústí|Jihlava|Opava|Ostrava|Most|Brno|Praha|Pardubice|parkovanivbrne\.cz|data\.brno\.cz|Manuál\S*|Olgoj Chorchoj/g;
const KEEP = /Géoplateforme|ČÚZK|ČSN|GKÚ|ÚGKK|Bára|RÚIAN|ÚAP|IPR|TSK|MHMP|Statutární město \S+|Město \S+|Geoportál Praha|hl\. m\. Prahy|[A-ZČŘŠŽÚ][a-zěščřžýáíéůú]+(?:ský|cký) kraj|Kraj Vysočina|Profily ulic|Plzeň|Plzni|Plzně|Třebíč|Břeclav|Přerov|Frýdek-Místek|Karviná|Ústí nad Labem|Ústí|Žilina|Banská Bystrica|Piešťany|Prešov|Košice|Dúbravka|Soukupová|Mapy\.com|\bSb\.|\bč\./g;
// The texts the app says (not the footer, the cities' credits and the map credits' Czech: as before the keys, those
// keep the offices' names).
const said = (tab) => Object.entries(tab).filter(([k]) => !/^(html|city|attribution)\./.test(k));

test("slovenské texty jsou slovensky", () => {
  const czech = said(L.sk).filter(([, sk]) => /[ěřů]|\b(jsou|nebo|také|který|která|které)\b/i.test(sk.replace(KEEP_SK, "")));
  assert.deepEqual(czech.map(([k]) => k), []);
});

test("německé texty jsou německy", () => {
  const czech = said(L.de).filter(([, de]) => /[ěščřžůňťďýáíéúľĺŕô]|\b(jsou|nebo|také|který|která|ulice|chodník)\b/i.test(de.replace(KEEP, "")));
  assert.deepEqual(czech.map(([k]) => k), []);
  // The app's terms: the modes and the main parts (Bára's terminology).
  for (const [k, de] of [["common.existing", "Bestand"], ["common.proposal", "Planung"], ["page.compare", "Vergleich"], ["common.sidewalk", "Gehweg"], ["types.trafficLane", "Fahrstreifen"],
    ["types.cycleLane", "Radfahrstreifen"], ["types.advisoryCycleLane", "Schutzstreifen"], ["rules.carriageway", "Fahrbahn"], ["common.streetProfile", "Straßenprofil"]]) assert.equal(L.de[k], de, k);
});

test("všech 24 úředních jazyků EU, každý pojmenovaný sám sebou", () => {
  assert.deepEqual(Object.keys(LANGS).sort(), ["bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "ga", "hr", "hu", "it", "lt", "lv", "mt", "nl", "pl", "pt", "ro", "sk", "sl", "sv"]);
  assert.equal(new Set(Object.values(LANGS)).size, 24);
});

for (const l of Object.keys(LANGS).filter((l) => !["cs", "en", "sk", "de"].includes(l))) {
  test(`${l}: bez češtiny`, () => {
    // Czech-only letters and words ("nebo" and "ulice" are Croatian and Slovenian too).
    const czech = said(L[l]).filter(([, v]) => /[ěřůťď]|\b(jsou|také|který|která|které|chodník)\b/i.test(v.replace(KEEP, "")));
    assert.deepEqual(czech.map(([k]) => k), [], `česky v ${l}.json`);
  });
}

test("jazyk není stát: německé rozhraní nemění značky ani pravidla řezu v Česku", async () => {
  // The signs and rules follow the cut's state; no module but i18n.js and the language menu reads the language.
  for (const f of FILES.filter((f) => !["i18n.js", "app.js", "errors.js"].includes(f))) {
    assert.ok(!/\blang\b\s*[!=]==/.test(src(f)), `${f} rozhoduje podle jazyka`);
  }
});

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
    assert.equal(i18n.t("page.compare"), L[l]["page.compare"], l);
    if (l !== "cs") assert.notEqual(i18n.t("page.compare"), "Porovnat", l);
  }
});

test("errors.js zná všechny jazyky", async () => {
  const errors = src("errors.js");
  for (const l of Object.keys(LANGS)) assert.match(errors, new RegExp(`\\b${l}: \\{ start: "`), `errors.js: ${l}`);
  const list = /var LANGS = "([^"]+)"/.exec(errors)[1].split(" ").sort();
  assert.deepEqual(list, Object.keys(LANGS).sort());
});
