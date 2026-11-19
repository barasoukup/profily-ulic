# Kolikrát jsme se na kontrolní sadu podívali

| # | Datum | Co | Výsledek (vše, obruby do 1 m) |
|---|---|---|---|
| 1 | 19. 11. 2026 | výchozí stav: odhad bez AI (`?ai=0`) a s AI (nasazené) proti mapám; Vídeň chybí (WFS města vracelo 500) | bez AI 50 %, s AI 70 %; párově +20 [15, 22] p. b., lépe 298, hůř 111 z 512; Bratislava s AI hůř (−20 [−36, −2]) |
| 2 | 19. 11. 2026 | Bratislava po opravě posunu pasportu magistrátu (1,47 m na západ, 0,33 m na sever; `evaluation/slovensko/posun-ba.mjs`, nezávisle na sadě): pravda přehraná (`hold-map-ba`) | posun odhad–pasport 1,2 → 0,1–0,3 m; obruby do 1 m bez AI 50 → 72 %, s AI 30 → 65 %; AI proti bez AI −7 [−24, 11] p. b. (dřív −20) |
| 3 | 19. 11. 2026 | konec chodníku podle sytosti (`walksat`) proti bez něj, bez AI | chodník do 1 m +1 [−1, 2] p. b., složení a obruby beze změny: neprůkazné |
| 4 | 19. 11. 2026 | strop chodníku podle třídy ulice (2,5 / 3,5 / 5 / 6 m), s AI | chodník do 1 m 41 → 48 % (+7 [1, 12]; mimo města modelu +11 [5, 18]); složení a obruby beze změny → nasazeno |
| 5 | 19. 11. 2026 | týž strop proti bez něj, chodník po metrech (F1; Bára: „nemáš to biasované?“ — „do 1 m“ odměňuje úzký strop, strop 1 m vyšel na regresi nejlépe) | F1 −1 [−2, 0] p. b. → **nenasazeno**, strop vypnutý |
