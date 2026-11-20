# Kolikrát jsme se na kontrolní sadu podívali

| # | Datum | Co | Výsledek (vše, obruby do 1 m) |
|---|---|---|---|
| 1 | 19. 11. 2026 | výchozí stav: odhad bez AI (`?ai=0`) a s AI (nasazené) proti mapám; Vídeň chybí (WFS města vracelo 500) | bez AI 50 %, s AI 70 %; párově +20 [15, 22] p. b., lépe 298, hůř 111 z 512; Bratislava s AI hůř (−20 [−36, −2]) |
| 2 | 19. 11. 2026 | Bratislava po opravě posunu pasportu magistrátu (1,47 m na západ, 0,33 m na sever; `evaluation/slovensko/posun-ba.mjs`, nezávisle na sadě): pravda přehraná (`hold-map-ba`) | posun odhad–pasport 1,2 → 0,1–0,3 m; obruby do 1 m bez AI 50 → 72 %, s AI 30 → 65 %; AI proti bez AI −7 [−24, 11] p. b. (dřív −20) |
| 3 | 19. 11. 2026 | konec chodníku podle sytosti (`walksat`) proti bez něj, bez AI | chodník do 1 m +1 [−1, 2] p. b., složení a obruby beze změny: neprůkazné |
| 4 | 19. 11. 2026 | strop chodníku podle třídy ulice (2,5 / 3,5 / 5 / 6 m), s AI | chodník do 1 m 41 → 48 % (+7 [1, 12]; mimo města modelu +11 [5, 18]); složení a obruby beze změny → nasazeno |
| 5 | 19. 11. 2026 | týž strop proti bez něj, chodník po metrech (F1; Bára: „nemáš to biasované?“ — „do 1 m“ odměňuje úzký strop, strop 1 m vyšel na regresi nejlépe) | F1 −1 [−2, 0] p. b. → **nenasazeno**, strop vypnutý |
| 6 | 19. 11. 2026 | plochy mezi obrubou a domem z modelu (`?aiplochy=1`), s AI obrubami | F1 chodníku +5 [3, 7] (mimo města modelu +7 [6, 10]); složení +0 [0, 2]; ČR a SK lépe, Německo složení hůř (Berlín −5 [−9, −2], Cáchy −3 [−6, −1]) |
| 7 | 19. 11. 2026 | plochy z modelu + chodník z modelu jen do 6 m od obruby, dál plocha (rozbor Německa: předprostory a dvory 8–12 m, kód 1003; německá část sady prohlédnutá po řezech) | F1 chodníku +5 [3, 7]; složení +1 [0, 2]; Berlín složení −1 [−2, 0], Hamburk −3 [−6, 0], Cáchy −2 [−3, 0], F1 v Německu +1 / 0 / +5 |
| 8 | 20. 11. 2026 | stání z modelu (`ai-kerbs.js parkFromAi`, větev stání učená na mapách Vídně, Berlína, Hamburku; data o stání mají přednost) proti `?off=aipark`; stání se tu měří jako vozovka, takže sada hlídá jen, že se nic nezhorší (správnost stání: 230 ručně označených stran, Brno 12 → 16 z 37 aut, Praha 8 → 12 z 24) | změněno 71 z 612 řezů (stání přidané 52, ubrané 18); složení +0 [0, 0], obruby do 1 m 0 [0, 0], F1 chodníku 0 [0, 0] p. b.; Plzeň chodník do 1 m −3 [−12, 0] (2 řezy hůř), Bratislava obruby +2 [0, 7] |
