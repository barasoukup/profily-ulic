// Guards of the code's shape (docs/coding-guidelines.md): conditions on a state only in countries/, no export nobody imports,
// a ceiling on the size of files and functions. The lists in architecture-allowed.js are today's exceptions: they may
// only be shortened or lowered, never extended. When a test says "stale", remove or lower the line it names.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";
import { STATE_CONDITIONS, UNUSED_EXPORTS, LONG_FILES, LONG_FUNCTIONS } from "./architecture-allowed.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(root, "app/public");
const MAX_FILE = 1000, MAX_FUNCTION = 100;
const rel = (f) => path.relative(root, f);

function walk(dir, out = [], skip = ["leaflet", "fonts", "node_modules", "ort", "data", ".git", ".wrangler"]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!skip.includes(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), out, skip); }
    else if (/\.m?js$/.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}
// The app's scripts. The translations (en.js, sk.js … two letters) are data, not code.
const appFiles = walk(PUB).filter((f) => !/\/[a-z]{2}\.js$/.test(f) || f.includes("/countries/")).sort();
const parse = (f) => espree.parse(fs.readFileSync(f, "utf8"), { ecmaVersion: "latest", sourceType: "module", loc: true });
const asts = new Map();
const ast = (f) => { if (!asts.has(f)) { try { asts.set(f, parse(f)); } catch { asts.set(f, null); } } return asts.get(f); };
const walkAst = (n, fn, parent = null) => {
  if (!n || typeof n.type !== "string") return;
  fn(n, parent);
  for (const k in n) {
    if (k === "loc" || k === "range") continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach((c) => walkAst(c, fn, n)); else if (v && typeof v.type === "string") walkAst(v, fn, n);
  }
};

// (a) A condition on a state (country.code === "SK", iso === "DK") only in countries/: the state's own module holds
// what is special about it. Counted per line.
const STATE_RES = [
  /\b(?:iso|countryIso|cc|isoCode)\s*[!=]==?\s*["'][A-Z]{2}["']/, /["'][A-Z]{2}["']\s*[!=]==?\s*(?:iso|cc|isoCode)\b/,
  /\b(?:country|city)\.(?:code|country|iso)\s*[!=]==?/, /[!=]==?\s*(?:country|city)\.(?:code|country|iso)\b/,
  /\.?\bcountry\s*[!=]==?\s*["'][A-Z]{2}["']/, /\[\s*["'][A-Z]{2}["'](?:\s*,\s*["'][A-Z]{2}["'])+\s*\]\.includes\(/,
];
export function stateConditions() {
  const found = {};
  for (const f of appFiles) {
    if (f.includes("/countries/")) continue;
    fs.readFileSync(f, "utf8").split("\n").forEach((l) => {
      if (/^\s*\/\//.test(l)) return;
      if (STATE_RES.some((r) => r.test(l))) found[rel(f)] = (found[rel(f)] || 0) + 1;
    });
  }
  return found;
}
test("a condition on a state only in countries/ (the exceptions only fewer)", () => {
  const found = stateConditions();
  for (const [f, n] of Object.entries(found)) {
    assert.ok(n <= (STATE_CONDITIONS[f] || 0), `${f}: ${n} conditions on a state outside countries/ (allowed ${STATE_CONDITIONS[f] || 0}); put what is special about a state in its countries/<ISO>.js`);
  }
  for (const [f, n] of Object.entries(STATE_CONDITIONS)) {
    assert.ok((found[f] || 0) === n, `stale: ${f} has ${found[f] || 0} conditions on a state, the list says ${n}: lower it in tests/architecture-allowed.js`);
  }
});

// (b) An export that no other file imports. Every script of the app, the server, the tools, the tests, the evaluation
// and the log Worker counts as an importer; a namespace (import * as, import(), export * from) uses all of a module.
function usedAndExports() {
  const exports = new Map(), used = new Map(), all = new Map();
  const consumers = [...appFiles, ...["app", "tools", "tests", "evaluation", "logging"].flatMap((d) => (fs.existsSync(path.join(root, d)) ? walk(path.join(root, d), [], ["node_modules", "data", "leaflet"]) : []))];
  const resolve = (from, spec) => {
    if (typeof spec !== "string" || !spec.startsWith(".")) return null;
    const p = path.resolve(path.dirname(from), spec);
    return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
  };
  const use = (file, name) => { if (!file) return; if (!used.has(file)) used.set(file, new Set()); used.get(file).add(name); };
  for (const f of new Set(consumers)) {
    const a = ast(f);
    if (!a) continue;
    const own = [];
    walkAst(a, (n) => {
      if (n.type === "ImportDeclaration") {
        const t = resolve(f, n.source.value);
        for (const s of n.specifiers) use(t, s.type === "ImportSpecifier" ? s.imported.name ?? s.imported.value : s.type === "ImportDefaultSpecifier" ? "default" : "*");
      } else if (n.type === "ImportExpression") {
        const arg = n.source;
        const lit = arg.type === "Literal" ? arg.value : arg.type === "NewExpression" && arg.arguments[0]?.type === "Literal" ? arg.arguments[0].value : null;
        let t = lit && resolve(f, lit);
        if (!t && lit) { const p = path.join(PUB, lit); if (fs.existsSync(p)) t = p; }
        use(t, "*");
      } else if (n.type === "ExportAllDeclaration") use(resolve(f, n.source.value), "*");
      else if (n.type === "ExportNamedDeclaration") {
        const t = n.source && resolve(f, n.source.value);
        const d = n.declaration;
        if (d) {
          if (d.type === "VariableDeclaration") for (const dc of d.declarations) walkAst(dc.id, (x) => { if (x.type === "Identifier") own.push([x.name, n.loc.start.line]); });
          else if (d.id) own.push([d.id.name, n.loc.start.line]);
        }
        for (const s of n.specifiers) { const nm = s.exported.name ?? s.exported.value; own.push([nm, n.loc.start.line]); if (t) use(t, s.local.name ?? s.local.value); }
      } else if (n.type === "ExportDefaultDeclaration") own.push(["default", n.loc.start.line]);
    });
    all.set(f, own);
  }
  for (const f of appFiles) if (all.has(f)) exports.set(f, all.get(f));
  return { exports, used };
}
export function unusedExports() {
  const { exports, used } = usedAndExports();
  const out = [];
  for (const [f, list] of exports) {
    // Language files are loaded by name (i18n.js) and the entry points by the page.
    const u = used.get(f) || new Set();
    if (u.has("*")) continue;
    for (const [name] of list) if (!u.has(name)) out.push(`${rel(f)}:${name}`);
  }
  return [...new Set(out)].sort();
}
test("no export that no other file imports (the exceptions only fewer)", () => {
  const found = unusedExports();
  const fresh = found.filter((x) => !UNUSED_EXPORTS.includes(x));
  assert.deepEqual(fresh, [], "exports nobody imports (use it, drop the export, or delete it):\n" + fresh.join("\n"));
  const stale = UNUSED_EXPORTS.filter((x) => !found.includes(x));
  assert.deepEqual(stale, [], "stale: these are used now or gone, remove them from UNUSED_EXPORTS in tests/architecture-allowed.js:\n" + stale.join("\n"));
});

// (c) A ceiling on the size of a file (lines) and of a function (lines from its first to its last line). The longer
// ones today are listed with their present length; they may only get shorter.
export function fileLines() {
  const out = {};
  for (const f of appFiles) out[rel(f)] = fs.readFileSync(f, "utf8").split("\n").length - (fs.readFileSync(f, "utf8").endsWith("\n") ? 1 : 0);
  return out;
}
export function functionLines() {
  const out = {};
  for (const f of appFiles) {
    const a = ast(f);
    if (!a) continue;
    walkAst(a, (n, parent) => {
      if (!/^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type)) return;
      let name = n.id?.name;
      if (!name && parent) {
        if (parent.type === "VariableDeclarator") name = parent.id.name;
        else if (/^(Property|MethodDefinition|PropertyDefinition)$/.test(parent.type)) name = parent.key?.name ?? parent.key?.value;
        else if (parent.type === "AssignmentExpression") name = parent.left.property?.name ?? parent.left.name;
      }
      const key = `${rel(f)}:${name || "(anonymous)"}`, len = n.loc.end.line - n.loc.start.line + 1;
      out[key] = Math.max(out[key] || 0, len);
    });
  }
  return out;
}
function ceiling(found, listed, max, what) {
  for (const [k, n] of Object.entries(found)) {
    const cap = listed[k] ?? max;
    assert.ok(n <= cap, `${k}: ${n} lines of a ${what}, the ceiling is ${cap}${listed[k] ? "" : ` (a new one over ${max}; split it)`}`);
  }
  for (const [k, cap] of Object.entries(listed)) {
    assert.ok(k in found, `stale: ${k} is gone, remove it from tests/architecture-allowed.js`);
    assert.ok(found[k] > max, `stale: ${k} is ${found[k]} lines, under ${max} now: remove it from tests/architecture-allowed.js`);
    assert.ok(found[k] === cap, `${k} is down to ${found[k]} lines: lower its ceiling (${cap}) in tests/architecture-allowed.js`);
  }
}
test(`no file over ${MAX_FILE} lines (the longer only shorter)`, () => ceiling(fileLines(), LONG_FILES, MAX_FILE, "file"));
test(`no function over ${MAX_FUNCTION} lines (the longer only shorter)`, () => ceiling(functionLines(), LONG_FUNCTIONS, MAX_FUNCTION, "function"));
