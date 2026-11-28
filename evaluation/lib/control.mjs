// The control set (code-health plan, step 19; docs/measuring.md "Malé vzorky", step 3): 30–50 cuts of the recorded samples of
// the replay (sample, sample-cz, sample-states) spread over the states and the kinds of street, which a fix must not change.
// control.json holds their points and, per cut, a hash of each field the player writes (status, title, city, cut, stav,
// credits, misses …) and a short line of the profile for a person. The check plays the cuts in Node over the recording
// (no network) and says which cuts differ, in which field and what the profile was and is.
//   node evaluation/lib/control.mjs                       check: 0 changes = OK, else the changed cuts (exit code 1)
//   node evaluation/lib/control.mjs --switches='off=mapfill'   the same with switches of the address: which cuts a switch changes
//   node evaluation/lib/control.mjs --make [--seed=N --per=2 --names=a,b]   build control.json anew (two processes: --pick
//        chooses candidates, the second plays the chosen ones; after a fix whose changes are meant: check first, look at the
//        changed cuts, then --make, and commit the new file with the fix)
//   --file=<json> --data=<folder of index.jsonl> --no-canvas --lang=cs: another control file, recording, canvases drawn in Node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { collect, fieldsOf, hash, partsLine, FIELDS, DATA } from "./collect.js";
import { loadSample, spread } from "./sample.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);
export const CONTROL = path.join(HERE, "control.json");

// ---------- What one cut is made of ----------
const hashes = (out) => Object.fromEntries(FIELDS.map((k) => [k, k in out ? hash(out[k]) : null]));
const describe = (out) => ({ title: out.title ?? null, parts: partsLine(out), hash: hashes(fieldsOf(out)) });
const keep = (cut) => ({ name: cut.name, sample: cut.sample, id: cut.id, town: cut.town, lat: cut.lat, lon: cut.lon, ...(cut.highway ? { highway: cut.highway } : {}), country: cut.country });
const point = (c) => ({ id: c.id, lat: c.lat, lon: c.lon, town: c.town, name: c.name, sample: c.sample });

// ---------- Check ----------
// control: the parsed file. Returns { total, changed: [{ name, town, country, fields, before, after }] }.
export async function checkControl({ control, switches = "", data = DATA, lang = control.lang || "cs", canvases = control.canvases !== false, onCut } = {}) {
  const { cuts } = await collect({ cuts: control.cuts.map(point), switches, lang, data, canvases, onCut });
  const changed = [];
  for (const [i, { out }] of cuts.entries()) {
    const was = control.cuts[i], now = describe(out);
    const fields = FIELDS.filter((k) => (was.hash[k] ?? null) !== now.hash[k]);
    if (fields.length) changed.push({ name: was.name, town: was.town, country: was.country, fields, before: { title: was.title, parts: was.parts }, after: { title: now.title, parts: now.parts } });
  }
  return { total: cuts.length, changed };
}
export function formatCheck({ total, changed }) {
  if (!changed.length) return `kontrolní sada: ${total} řezů, 0 změn, OK`;
  const lines = [`kontrolní sada: ${total} řezů, ${changed.length} se změnilo`];
  for (const c of changed) {
    lines.push(`— ${c.name} (${c.country}, ${c.town}): ${c.fields.join(", ")}`);
    if (c.fields.includes("stav") || c.fields.includes("title")) lines.push(`    bylo: ${c.before.title} · ${c.before.parts}`, `    je:   ${c.after.title} · ${c.after.parts}`);
  }
  return lines.join("\n");
}

// ---------- Make ----------
// Which state of the app's samples a cut belongs to (sample.json of the replay names only the town).
const SK = new Set(["bratislava", "kosice", "presov", "zilina", "banska-bystrica", "nitra", "zvolen", "piestany", "trnava", "trencin", "martin", "poprad", "sk-dialnica"]);
const AT = new Set(["wien", "graz", "linz", "salzburg", "innsbruck", "klagenfurt", "st-poelten", "wels", "villach", "eisenstadt", "bregenz", "at-autobahn", "at-okraj"]);
export function countryOf(cut) {
  if (cut.country) return cut.country;
  if (cut.sample === "sample-cz" || cut.town === "praha" || cut.town === "brno") return "CZ";
  return SK.has(cut.town) ? "SK" : AT.has(cut.town) ? "AT" : null; // the margins abroad (Mosonmagyaróvár …) are no state of the control set
}
const kindOf = (c) => (/^(motorway|trunk)/.test(c.highway || "") ? "road" : /^(primary|secondary)/.test(c.highway || "") ? "main" : c.highway ? "local" : "-");
const PER = { CZ: 3, SK: 2, AT: 2, MC: 1, LI: 1 }; // cuts per state, the others `per`
const allCuts = () => ["sample", "sample-cz", "sample-states"].flatMap((s) => loadSample(s)).map((c) => ({ ...c, country: countryOf(c) }));

// Pass 1 (a process of its own: the player keeps what cuts leave in the app's modules): candidates spread over the states and
// kinds of street, those that have a profile and all their recorded answers. Returns the names of the cuts.
export async function pickControl({ seed = 20261128, per = 2, data = DATA, lang = "cs", canvases = true, log = () => {} } = {}) {
  const all = allCuts().filter((c) => c.country), want = (g) => PER[g] ?? per;
  // Three candidates per wanted cut (some have no profile or lack recorded answers); the ones that work are kept.
  const quota = Object.fromEntries([...new Set(all.map((c) => c.country))].map((g) => [g, want(g) * 3]));
  const cand = spread(all, { groupBy: (c) => c.country, spreadBy: (c) => `${kindOf(c)}/${c.town}`, per: quota, seed });
  const { cuts } = await collect({ cuts: cand, lang, data, canvases, onCut: (c, o, i) => log(`kandidát ${i + 1}/${cand.length} ${c.name}`) });
  const ok = new Map();
  for (const { cut, out } of cuts) {
    if (!out.stav?.segments?.length || out.failed || out.misses?.length) continue;
    if ((ok.get(cut.country)?.length || 0) < want(cut.country)) ok.set(cut.country, [...(ok.get(cut.country) || []), cut.name]);
  }
  return [...ok.values()].flat();
}
// Pass 2 (a fresh process): the chosen cuts played in the order they have in the file; their hashes are what the check compares.
export async function makeControl({ names, seed, data = DATA, lang = "cs", canvases = true, log = () => {} }) {
  const all = allCuts(), list = names.map((n) => all.find((c) => c.name === n) || (() => { throw new Error(`no cut ${n}`); })());
  const { cuts } = await collect({ cuts: list, lang, data, canvases, onCut: (c, o, i) => log(`řez ${i + 1}/${list.length} ${c.name}`) });
  return {
    about: "Kontrolní sada (evaluation/lib/control.mjs): řezy nahraných vzorků, které se oprava nesmí změnit; hash polí výstupu přehrávky v Node.",
    seed, lang, canvases, cuts: list.map((c, i) => ({ ...keep(c), ...describe(cuts[i].out) })),
  };
}

// ---------- Command line ----------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3), flag = (k) => args.includes(`--${k}`);
  const file = opt("file") || CONTROL, data = opt("data") || DATA, canvases = !flag("no-canvas"), lang = opt("lang") || "cs";
  const t0 = Date.now(), progress = (m) => process.stdout.isTTY && process.stdout.write(`\r${m}   `);
  const seed = Number(opt("seed") || 20261128), per = Number(opt("per") || 2);
  if (flag("pick")) {
    console.log(JSON.stringify(await pickControl({ seed, per, data, lang, canvases, log: progress })));
    process.exit(0);
  }
  if (flag("make")) {
    const self = [new URL(import.meta.url).pathname, "--pick", `--seed=${seed}`, `--per=${per}`, `--data=${data}`, `--lang=${lang}`, ...(canvases ? [] : ["--no-canvas"])];
    const names = opt("names")?.split(",") || JSON.parse(execFileSync(process.execPath, self, { encoding: "utf8", maxBuffer: 1 << 26 }).trim().split("\n").pop());
    const control = await makeControl({ names, seed, data, lang, canvases, log: progress });
    fs.writeFileSync(file, JSON.stringify(control, null, 1) + "\n");
    const by = {};
    for (const c of control.cuts) by[c.country] = (by[c.country] || 0) + 1;
    console.log(`\n${file}: ${control.cuts.length} řezů ${JSON.stringify(by)}, ${Math.round((Date.now() - t0) / 1000)} s`);
    process.exit(0);
  }
  const control = JSON.parse(fs.readFileSync(file, "utf8"));
  const res = await checkControl({ control, switches: opt("switches") || "", data, lang, canvases: control.canvases !== false && canvases, onCut: (c, o, i) => progress(`${i + 1}/${control.cuts.length} ${c.name}`) });
  console.log(`\n${formatCheck(res)}\n(${Math.round((Date.now() - t0) / 1000)} s)`);
  process.exit(res.changed.length ? 1 : 0);
}
