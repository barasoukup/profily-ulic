# Kolikrát jsme se na kontrolní sadu podívali

| # | Datum | Co | Výsledek (vše, obruby do 1 m) |
|---|---|---|---|
| 1 | 19. 11. 2026 | výchozí stav: odhad bez AI (`?ai=0`) a s AI (nasazené) proti mapám; Vídeň chybí (WFS města vracelo 500) | bez AI 50 %, s AI 70 %; párově +20 [15, 22] p. b., lépe 298, hůř 111 z 512; Bratislava s AI hůř (−20 [−36, −2]) |
| 2 | 19. 11. 2026 | Bratislava po opravě posunu pasportu magistrátu (1,47 m na západ, 0,33 m na sever; `evaluation/slovensko/posun-ba.mjs`, nezávisle na sadě): pravda přehraná (`hold-map-ba`) | posun odhad–pasport 1,2 → 0,1–0,3 m; obruby do 1 m bez AI 50 → 72 %, s AI 30 → 65 %; AI proti bez AI −7 [−24, 11] p. b. (dřív −20) |
