#!/usr/bin/env node
// Checks the split of CLAUDE.md and app/README.md into CLAUDE.md, app/README.md and docs/ (step 5 of docs/code-health-plan.md).
//
//   node tools/check_docs_split.mjs [old revision, default e2983677]
//
// 1. Every sentence and list item of the old CLAUDE.md and app/README.md (git show <rev>:…) must appear in some current
//    doc file (CLAUDE.md, app/README.md, docs/**/*.md). The comparison is on normalised text: lower case, no markdown
//    marks, no link targets, every `….md` path reads the same ("links may differ"), line breaks and spaces collapsed.
//    Sentences that contain struck text (~~…~~) or "smazáno 28. 11. 2026" are the struck lines and the mentions of deleted
//    switches (docs/decisions.md): they are listed separately and are the only ones allowed to be missing.
// 2. Every link in the current doc files must lead to an existing file: markdown links [text](path) and the backticked
//    paths of docs, `CLAUDE.md` and README files.
//
// Exit code 1 when a sentence outside the deleted ones is missing or a link is broken.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REV = process.argv[2] ?? "e2983677";
const OLD_FILES = ["CLAUDE.md", "app/README.md"];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}
const newFiles = ["CLAUDE.md", "app/README.md", ...walk("docs")];

export function normalise(s) {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // link target out
    .replace(/[\w./-]+\.md(#[\w-]+)?/g, "§") // every .md path reads the same
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Units: one paragraph, list item, table row, heading or code line each; then sentences.
export function sentences(text) {
  const units = [];
  let cur = [];
  let fence = false;
  const flush = () => {
    if (cur.length) units.push(cur.join(" "));
    cur = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("```")) {
      flush();
      fence = !fence;
      continue;
    }
    if (fence || /^\|/.test(line) || /^#{1,6} /.test(line)) {
      flush();
      units.push(line.replace(/^#{1,6} /, ""));
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^\s*(?:[-*] |\d+\. )/.test(line)) flush();
    cur.push(line.replace(/^\s*(?:[-*] |\d+\. )/, ""));
  }
  flush();
  const out = [];
  for (const u of units) {
    // a full stop after a digit (dates, "24. 11.") or after a stop does not end a sentence
    for (const piece of u.split(/(?<=[^\d.\s][.!?][*~`)"”]*)\s+/)) {
      const n = normalise(piece);
      if (n.length >= 4) out.push({ raw: piece.trim(), n });
    }
  }
  return out;
}

const corpus = normalise(newFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n"));
let bad = false;
// The list "before deployment: workflow OSM tiles" (docs/deployment.md) holds the pieces of sentences that were
// merged out of the state files; a sentence counts as merged when it is that piece plus text that is still in place
// with the pointer "viz seznam v docs/deployment.md".
const deployment = fs.readFileSync("docs/deployment.md", "utf8");
const listPart = deployment.split(/^## /m).find((p) => p.startsWith("Před nasazením: workflow OSM tiles")) ?? "";
const fragments = [...listPart.matchAll(/^- [^:]+: (.*)$/gm)].map((m) => normalise(m[1])).filter((x) => x.length > 10);
const isMerged = (s) => fragments.some((fr) => s.n.includes(fr) && corpus.includes(s.n.replace(fr, "viz seznam v §")));
const isDeleted = (raw) => raw.includes("~~") || raw.includes("smazáno 28. 11. 2026");

for (const f of OLD_FILES) {
  const old = execFileSync("git", ["show", `${REV}:${f}`], { encoding: "utf8", maxBuffer: 1e8 });
  const all = sentences(old);
  const missing = all.filter((s) => !corpus.includes(s.n));
  const merged = missing.filter((s) => isMerged(s));
  const deleted = missing.filter((s) => !isMerged(s) && isDeleted(s.raw));
  const lost = missing.filter((s) => !isMerged(s) && !isDeleted(s.raw));
  console.log(`\n== ${f} @ ${REV}: ${all.length} sentences, ${all.length - missing.length} found, ${lost.length} missing, ${deleted.length} deleted (struck or deleted switch), ${merged.length} merged into the deployment list`);
  for (const s of merged) console.log(`MERGED: ${s.raw.slice(0, 160)}`);
  if (lost.length) bad = true;
  for (const s of lost) console.log(`MISSING: ${s.raw}`);
  for (const s of deleted) console.log(`DELETED: ${s.raw}`);
}

// links
let broken = 0;
// only the files this split wrote or changed (older docs have their own old broken paths)
const changed = new Set([
  ...execFileSync("git", ["diff", "--name-only", REV], { encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "-o", "--exclude-standard"], { encoding: "utf8" }).split("\n"),
]);
for (const f of newFiles.filter((x) => changed.has(x))) {
  const text = fs.readFileSync(f, "utf8");
  const dir = path.dirname(f);
  const check = (target, how) => {
    const t = target.replace(/#.*$/, "");
    if (!t || /^(https?:|mailto:)/.test(t)) return;
    const candidates = [path.join(dir, t), t];
    if (!candidates.some((c) => fs.existsSync(c))) {
      broken++;
      console.log(`BROKEN LINK in ${f}: ${how} ${target}`);
    }
  };
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) check(m[1], "link");
  for (const m of text.matchAll(/`((?:docs\/|app\/README|CLAUDE|README|LICENSES|evaluation\/[\w./-]*\/)[\w./-]*\.md)`/g)) {
    if (!fs.existsSync(m[1])) {
      broken++;
      console.log(`BROKEN PATH in ${f}: ${m[1]}`);
    }
  }
}
console.log(`\nbroken links: ${broken}`);
if (broken) bad = true;
process.exit(bad ? 1 : 0);
