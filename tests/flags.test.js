// The registry of the switches (app/public/flags.js; code-health plan step 7): every read of a switch in the code has its
// entry and every entry is read, the address is read only in flags.js, the entries are complete, docs/switches.md is what
// the registry makes now (else: node tools/build_switches_doc.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FLAGS, flagsOf, offOf, flagPairs, addressWithout } from "../app/public/flags.js";
import { switchesDoc, OUT } from "../tools/build_switches_doc.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(root, "app/public");
const SKIP = new Set(["leaflet", "fonts", "node_modules", "ort", "data", "vendor"]);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), out); }
    else if (/\.m?js$/.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}
const files = walk(PUB).filter((f) => !f.endsWith("/flags.js"));
const text = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));
const rel = (f) => path.relative(root, f);

// The reads with the name written out: flag("x") (a reader of a module, also param("x") and on("x") of denmark.js),
// off("x") and ORTHO_P.off?.has("x") (the fixes named in ?off=).
const READS = [/(?<![.\w$])(?:flag|param|on|off)\("([A-Za-z0-9]+)"\)/g, /\.off\??\.has\("([A-Za-z0-9]+)"\)/g];
const read = new Map();
for (const [f, s] of text) for (const re of READS) for (const m of s.matchAll(re)) read.set(m[1], [...(read.get(m[1]) || []), rel(f)]);
read.delete("off"); // flag("off") is the list of the fixes (ORTHO_P.off, offOf); the fixes are the entries
const ids = new Set(FLAGS.map((f) => f.id));

test("vypínače: každé čtení v kódu má záznam v flags.js", () => {
  const missing = [...read].filter(([k]) => !ids.has(k)).map(([k, where]) => `${k} (${[...new Set(where)].join(", ")})`);
  assert.deepEqual(missing, [], "přidej záznam do app/public/flags.js");
});

test("vypínače: každý záznam se v kódu čte", () => {
  const unread = [];
  for (const f of FLAGS) {
    if (f.dynamic) {
      const s = fs.readFileSync(path.join(root, f.dynamic), "utf8");
      if (!/\b(?:flag|townOn)\(id\)/.test(s) || !new RegExp(`\\b${f.id}\\b`).test(s)) unread.push(`${f.id} (${f.dynamic})`);
    } else if (!read.has(f.id)) unread.push(f.id);
  }
  assert.deepEqual(unread, [], "záznam, který nikdo nečte: smaž ho");
});

test("vypínače: záznamy jsou úplné a jedinečné", () => {
  assert.equal(ids.size, FLAGS.length, "dvakrát stejné id");
  for (const f of FLAGS) {
    assert.match(f.id, /^[a-z0-9]+$/, f.id);
    assert.ok(["fix", "source", "option", "trial"].includes(f.kind), `${f.id}: druh`);
    assert.ok(typeof f.default === "boolean" || typeof f.default === "string", `${f.id}: výchozí hodnota`);
    assert.ok(f.how?.startsWith("?"), `${f.id}: zápis v adrese`);
    assert.ok(f.what && /[a-zěščřžýáíéúůďťň]/i.test(f.what), `${f.id}: popis`);
    assert.ok(f.date === null || /^\d{4}-\d\d-\d\d$/.test(f.date), `${f.id}: datum`);
    assert.ok(f.report === null || fs.existsSync(path.join(root, f.report)), `${f.id}: odkaz ${f.report} neexistuje`);
  }
});

test("vypínače: adresu čte jen flags.js (kromě hashe v share.js a classic skriptu errors.js)", () => {
  const bad = [];
  for (const [f, s] of text) {
    if (f.endsWith("/errors.js")) continue; // a classic script of the page (no import), reads ?lang= by itself
    if (/location\.search|searchParams|URLSearchParams\(\s*location/.test(s)) bad.push(rel(f));
  }
  assert.deepEqual(bad, [], "použij flag(…) z flags.js");
});

test("vypínače: docs/switches.md je aktuální", () => {
  assert.ok(fs.readFileSync(OUT, "utf8") === switchesDoc(), "docs/switches.md je zastaralé: node tools/build_switches_doc.mjs");
});

test("vypínače: čtení z adresy a v Node z objektu modulu", () => {
  const had = Object.getOwnPropertyDescriptor(globalThis, "location");
  try {
    delete globalThis.location;
    globalThis.PROFILY_TEST = { wien: "0", off: "a,b" };
    assert.equal(flagsOf("PROFILY_TEST")("wien"), "0");
    assert.equal(flagsOf("PROFILY_TEST")("dc"), null);
    assert.equal(flagsOf(null)("wien"), null);
    assert.ok(offOf("PROFILY_TEST")("b") && !offOf("PROFILY_TEST")("c"));
    globalThis.location = { search: "?wien=1&off=x,y&lang=de&ai=0", href: "https://x.test/p/?wien=1&lang=de#rez=1" };
    assert.equal(flagsOf("PROFILY_TEST")("wien"), "1", "v prohlížeči jen adresa");
    assert.ok(offOf("PROFILY_TEST")("y") && !offOf("PROFILY_TEST")("a"));
    assert.deepEqual(flagPairs(), [["wien", "1"], ["off", "x,y"], ["ai", "0"]]);
    assert.equal(addressWithout("lang"), "https://x.test/p/?wien=1#rez=1");
    globalThis.location = { search: "", href: "https://x.test/p/" };
    assert.equal(flagsOf(null)("wien"), null, "adresa se čte znovu, když se změní");
  } finally {
    delete globalThis.PROFILY_TEST;
    if (had) Object.defineProperty(globalThis, "location", had); else delete globalThis.location;
  }
});
