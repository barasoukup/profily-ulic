// What the width rules of every state share (rules.js and the states' modules in countries/): the classes of
// streets and the number of a width. No import of city.js (city.js imports the states).
import { num } from "./i18n.js";

export const fmt = (v) => `${num(v)} m`;

// A driving lane by the class of the street (Prague: TSK's class, derive.js classGroup, as the functional group of
// ČSN 73 6110; Bára 10. 11. 2026). ČSN 73 6110 (after ČVUT FD): group A 3.50 m, B 3.00–3.25 m, C 2.75–3.00 m;
// Manuál C.2: a basic lane 3.00 m in important streets, 2 × 2.75 m (2 × 2.50 m at low volumes) in calm streets.
// Zákon 13/1997 Sb. § 6 and its decree: MK I is a rapid or a collector road (A or B), MK II a collector or service
// road; TSK does not say which, so MK I and II take group B and only motorways group A.
export const GROUP = { dalnice: "A", mk1: "B", mk2: "B", sil1: "B", sil2: "B", mk3: "C", sil3: "C", mk4: "D" };
