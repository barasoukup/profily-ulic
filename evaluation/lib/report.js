// The skeleton of a REPORT.md (code-health plan, step 19; docs/measuring.md): the same sections in every measurement, so that
// the filter of the targets, the size of the sample, the control set and the judges are always written down, and the
// decision stays Bára's. Czech text, as the existing reports.

// A table in Markdown: head: ["a", "b"], rows: [[1, 2], …].
export function table(head, rows) {
  return [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map((c) => String(c ?? "")).join(" | ")} |`)].join("\n");
}
// "9 : 2 (p 0,06)" from the counts of A and B and the p of the sign test (lib/ab.js tally()).
export const outcome = ({ a = 0, b = 0, p }) => `${a} : ${b}${p != null ? ` (p ${String(p).replace(".", ",")})` : ""}`;

// opts: title (the heading), date ("28. 11. 2026"), question (what is measured, in a sentence), change (what was changed: a fix, a
// source, a switch), targets (how the cuts were chosen: the filter), sample ({ size, source }), control ({ cuts, changed }),
// judges ({ count, model, brief }), results (Markdown: tables from table()), decision (what is turned on or off, "rozhodne Bára" where it
// is hers), open (what stays), commands (lines that repeat the measurement).
export function reportSkeleton(o) {
  const L = [`# ${o.title} (${o.date})`, ""];
  if (o.question) L.push(o.question, "");
  L.push("## Co se měnilo", "", o.change || "_doplnit: oprava, zdroj nebo vypínač a kde v kódu_", "");
  L.push("## Vzorek a sběr", "");
  L.push(`- Cíle: ${o.targets || "_doplnit: filtr, kterým se řezy vybraly (predikát nad nahranými vstupy)_"}`);
  L.push(`- Velikost vzorku: ${o.sample ? `${o.sample.size} řezů z ${o.sample.source}` : "_doplnit (20–40 cílů pro slepé A/B)_"}`);
  L.push(`- Kontrolní sada: ${o.control ? `${o.control.cuts} řezů, ${o.control.changed} se změnilo${o.control.changed ? " (viz níže)" : ", OK"}` : "_node evaluation/lib/control.mjs_"}`);
  L.push(`- Posuzovatelé: ${o.judges ? `${o.judges.count} slepí, ${o.judges.model}, pokyn ${o.judges.brief}` : "_doplnit: počet, model, pokyn; pořadí A/B náhodné a zaznamenané (lib/ab.js blindPairs)_"}`, "");
  L.push("## Výsledky", "", o.results || "_doplnit: tabulky_", "");
  L.push("## Rozhodnutí", "", o.decision || "_doplnit: co zůstává zapnuté a co vypnuté, co rozhodne Bára_", "");
  L.push("## Co zůstává", "", o.open || "_doplnit_", "");
  if (o.commands?.length) L.push("## Opakování", "", ...o.commands.map((c) => `    ${c}`), "");
  return L.join("\n");
}
