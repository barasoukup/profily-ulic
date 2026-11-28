// Static imports of the app and the tools: every relative import exists, and no module imports itself in a circle
// (a cycle of modules is a plan to untangle, docs/code-health-plan.md; the ones in ALLOWED_CYCLES may only be removed).
// Dynamic import() is not followed (it is how a cycle is broken on purpose). Run: node tools/check_imports.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scriptFiles } from "./check_syntax.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Files of today's cycles (the smallest one: its modules, sorted, joined by " > "). Only ever shortened.
export const ALLOWED_CYCLES = [
  "app/public/dmvs.js > app/public/dtmwfs.js",
];

const IMPORT_RE = /^\s*(?:import|export)\s[^;'"]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm;

export function importGraph(files = scriptFiles()) {
  const graph = new Map(), missing = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const deps = new Set();
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1] || m[2];
      if (!spec.startsWith(".")) continue;
      const target = path.resolve(path.dirname(f), spec);
      if (!fs.existsSync(target)) { missing.push(`${path.relative(root, f)} imports ${spec}`); continue; }
      if (/\.m?js$/.test(target)) deps.add(target);
    }
    graph.set(f, [...deps]);
  }
  return { graph, missing };
}

// Strongly connected components with more than one module (Tarjan).
export function cycles(graph) {
  let index = 0;
  const idx = new Map(), low = new Map(), onStack = new Set(), stack = [], out = [];
  const visit = (v) => {
    idx.set(v, index); low.set(v, index); index++; stack.push(v); onStack.add(v);
    for (const w of graph.get(v) || []) {
      if (!graph.has(w)) continue;
      if (!idx.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) out.push(comp.map((f) => path.relative(root, f)).sort());
    }
  };
  for (const v of graph.keys()) if (!idx.has(v)) visit(v);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { graph, missing } = importGraph();
  const found = cycles(graph).map((c) => c.join(" > "));
  const fresh = found.filter((c) => !ALLOWED_CYCLES.includes(c));
  const gone = ALLOWED_CYCLES.filter((c) => !found.includes(c));
  for (const m of missing) console.error(`missing file: ${m}`);
  for (const c of fresh) console.error(`import cycle: ${c}`);
  for (const c of gone) console.error(`cycle gone, remove it from ALLOWED_CYCLES: ${c}`);
  console.log(`${graph.size} modules, ${found.length} import cycles`);
  process.exit(missing.length || fresh.length || gone.length ? 1 : 0);
}
