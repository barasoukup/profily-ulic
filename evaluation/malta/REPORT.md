# Malta (MT): měření přesnosti (univerzální metoda, 23. 11. 2026)

Zápis měření, které proběhlo s Maltou (commit `c9b58a9`); nic jsem znovu neměřila, jen přepočítala uložená data
(`node evaluation/universal/score-states.mjs`; profily aplikace `evaluation/universal/data/app-mt.json`, posuzovatel
`evaluation/universal/results/u-mt-1.jsonl`). Metoda: skill `measure-accuracy`, `evaluation/universal/REPORT.md`.
Posuzovatel staví vlastní profil z ortofota a fotek z ulice; s MTVU v Praze se shoduje v 71–82 % složení.

## Výsledek

| řezů | složení stejné | shoda složení | počet pruhů stejně | šířka uličního prostoru do 1 / 2 m |
|---|---|---|---|---|
| 8 (z 10 vylosovaných v 6 městech) | 13 % | 55 % | 38 % | 38 % / 63 % |

Nejčastější rozdíly (aplikace proti posuzovateli): chybí chodník 5×, chybí stání 4×, navíc chodník 2×.

Vyřazené řezy (bez vozovky v obou profilech): `mt-valletta-2` (park, ne ulice), `mt-valletta-3` (stezka pod hradbou).

## Řezy, které nejsou ulice

Ve vzorku zůstaly dva řezy, které podle poznámky posuzovatele ulicí nejsou, ale metoda je počítá, protože posuzovatel
v nich vozovku má: `mt-valletta-1` (prostranství před City Gate s konečnou autobusů, „spíš náměstí“; shoda 20 %) a
`mt-valletta-5` (nábřeží, ulice šikmo k řezu, aplikace dala jednu obslužnou plochu 25 m; shoda 25 %). Bez nich je
shoda složení 6 řezů 66 %. Šest řezů na celý stát je na závěry málo.

## Co měření neověřuje

- **Směry pruhů a jízdu vlevo.** Metoda porovnává složení a počet pruhů, ne jejich směr. Jízdu vlevo hlídá jen test
  celého profilu `tests/derive.test.js` („jízda vlevo“) a `tests/malta.test.js` (odhad stání se státem `malta`).
- Měření proběhlo před opravami z recenze 23. 11. 2026 (jízda vlevo, `lawNeed`, normy). Opakovat po nasazení oprav
  s větším vzorkem (aspoň 20 řezů s ulicí, losovaných jen na silnicích).
