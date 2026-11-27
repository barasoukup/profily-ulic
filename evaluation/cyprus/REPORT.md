# Kypr (CY): měření přesnosti (univerzální metoda, 23. 11. 2026)

Zápis měření, které proběhlo s Kyprem (commit `48db470`); nic jsem znovu neměřila, jen přepočítala uložená data
(`node evaluation/universal/score-states.mjs`; profily aplikace `evaluation/universal/data/app-cy.json`, posuzovatel
`evaluation/universal/results/u-cy-1.jsonl`). Metoda: skill `measure-accuracy`, `evaluation/universal/REPORT.md`.
Posuzovatel staví vlastní profil z ortofota a fotek z ulice; s MTVU v Praze se shoduje v 71–82 % složení, čísla jsou
tedy shoda s dobrým, ne dokonalým pozorovatelem.

## Výsledek

| řezů | složení stejné | shoda složení | počet pruhů stejně | šířka uličního prostoru do 1 / 2 m |
|---|---|---|---|---|
| 11 (z 15 vylosovaných v 5 městech) | 18 % | 56 % | 91 % | 9 % / 27 % |

Nejčastější rozdíly (aplikace proti posuzovateli): chybí chodník 9×, chybí stání 5×, chybí zeleň 3×.

Vyřazené řezy: `cy-larnaca-3` (podél akvaduktu, ne ulice), `cy-nicosia-2`, `cy-limassol-4`, `cy-limassol-7` (pěší ulice
a promenády: bez vozovky v obou profilech, metoda je nehodnotí).

## Proč je šířka tak špatná (27 % do 2 m)

Rozdíl šířky po řezech (posuzovatel → aplikace): aplikace je **užší** v 5 řezech (`nicosia-5` 13,5 → 9,0 m,
`limassol-1` 27,6 → 20,1, `paphos-1` 10,7 → 7,2, `paphos-7` 9,1 → 6,8, `paphos-8` 29,9 → 23,7) a **širší** ve 3
(`nicosia-3` 17,6 → 23,0, `larnaca-1` 11,0 → 16,4, `larnaca-7` 5,5 → 9,4). Užší profil skoro vždy končí u vozovky:
odhad z OSM a ortofota nenašel chodník nebo stání a profil nedošel k fasádě. Širší profil bere do ulice plochu za ní (parkoviště, nezpevněný okraj). Příčina je tedy hlavně
chybějící chodník (9 z 11 řezů), ne měření vozovky; počet pruhů sedí v 10 z 11.

## Co měření neověřuje

- **Směry pruhů a jízdu vlevo.** Metoda porovnává složení a počet pruhů, ne jejich směr. Jízdu vlevo hlídá jen test
  celého profilu `tests/derive.test.js` („jízda vlevo“) na umělých ulicích (recenze 23. 11. 2026, nálezy 1–3, 5).
- **Vzorek je malý** (11 řezů) a měření proběhlo před opravami jízdy vlevo a norem z recenze.
  Opakovat po nasazení oprav, nejlépe s větším vzorkem (aspoň 20 řezů s ulicí).
