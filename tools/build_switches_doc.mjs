// docs/switches.md: the table of the app's switches by kind, made from the registry app/public/flags.js (code-health plan,
// step 7; Bára 28. 11. 2026). tests/flags.test.js checks the file is what the registry makes now:
//   node tools/build_switches_doc.mjs
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { FLAGS } from "../app/public/flags.js";

export const OUT = new URL("../docs/switches.md", import.meta.url);
const TITLES = {
  fix: ["Opravy (výchozí zapnuto)", "Zapnuté opravy a pravidla odhadu; vypíná je `?off=<id>` (víc jich čárkou), kde je v tabulce jiný zápis, ten."],
  source: ["Zdroje dat", "Zdroj dat nebo mapa povrchů města; `?<id>=0` ho vynechá, u vypnutých `?<id>=1` zapne."],
  option: ["Volby uživatele a srovnávací přepínače", "Jazyk, město, odkud číst OSM, sítě pod zemí a srovnávací přepínače."],
  trial: ["Pokusy (vypnuté, čekají na rozhodnutí)", "Funkce, které zatím nic nevyhrálo; v kódu je smaže krok 6 plánu, nebo zůstanou, dokud Bára nerozhodne."],
};
const cell = (s) => String(s).replaceAll("|", "\\|");
const dflt = (f) => (typeof f.default === "boolean" ? (f.default ? "zapnuto" : "vypnuto") : `\`${f.default}\``);

export function switchesDoc() {
  const out = [
    "# Vypínače aplikace",
    "",
    "Vygenerováno z registru `app/public/flags.js` (`node tools/build_switches_doc.mjs`, hlídá `tests/flags.test.js`); neupravovat ručně.",
    "Nový vypínač se přidává do `flags.js` se záznamem: `id`, druh, výchozí hodnota, popis, datum (první commit, který ho jmenuje) a měření nebo zpráva (`null`, když není).",
    "",
  ];
  for (const kind of ["fix", "source", "option", "trial"]) {
    const list = FLAGS.filter((f) => f.kind === kind).sort((a, b) => a.id.localeCompare(b.id));
    out.push(`## ${TITLES[kind][0]} (${list.length})`, "", TITLES[kind][1], "");
    if (!list.length) { out.push("Žádné.", ""); continue; }
    out.push("| Vypínač | Výchozí | Co dělá | Od | Měření nebo zpráva |", "|---|---|---|---|---|");
    for (const f of list) out.push(`| \`${f.how}\` | ${dflt(f)} | ${cell(f.what)} | ${f.date ?? "–"} | ${f.report ? `\`${f.report}\`` : "–"} |`);
    out.push("");
  }
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  fs.writeFileSync(OUT, switchesDoc());
  console.log(`docs/switches.md: ${FLAGS.length} vypínačů`);
}
