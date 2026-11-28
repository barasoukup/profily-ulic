# Rozhodnutí: smazané pokusy

Tady je každý pokus, který prohrál nebo zůstal navždy vypnutý a Bára 27. 11. 2026 řekla, že se z kódu maže (krok 6 plánu
`docs/code-health-plan.md`; smazáno 28. 11. 2026, větev `drop-experiments`). Kód každého pokusu je v gitu před commitem
„Drop experiments“ téže větve (`git log --grep "Drop experiments"`). Řádek: co to bylo, výsledek měření, kde je zpráva.
Zapnuté opravy s vypínačem `?off=…`, které se tím jen zbavily vypínače, jsou v druhém oddílu.

## Vypnuté pokusy (smazané)

### Odhad z ortofota a OSM (`ortho-osm.js`)

- `P.walkSatOn`, `P.walkSat`, `P.walkLight`, `P.walkYellow` (`?off=walksat`): konec chodníku tam, kde barva zesytí jako
  tráva (suchý trávník, ne zelený); světlo nebo žlutost proti stínu domu. Hold-out: +1 [−1, 2] p. b., nic. Vypnuté od
  19. 11. 2026 (`docs/backlog.md`, oddíl Chodník mezi obrubou a domem; `evaluation/ortho-osm/REPORT.md`).
- `P.walkMode`, `P.walkEdge`, `P.walkDiff`, `P.walkShadow`: konec chodníku na první změně povrchu na snímku (sloupce `Ec`).
  Znovu změřeno s RÚIAN 23. 11. 2026: nic nevyhrálo všude (`docs/backlog.md`, tamtéž).
- `P.split6`, `P.splitMin` (`splitAt`): kde chodník dosáhne stropu 6 m, hledat další hranu. Bez modelu 204 z 381 stran
  u stropu, F1 chodníku ±1 p. b.; s modelem u 4 z 229 stran, beze změny (Bára 19. 11. 2026, `docs/backlog.md`).
- `P.aiSnap`, `P.aiSnapMin`: hranice mezi úseky modelu přitažená k nejsilnější změně povrchu na snímku (±0,6 m). Bez
  zlepšení (regrese Prahy a Brna, `evaluation/ortho-osm/REPORT.md`).
- `P.aiWalkMax`, `P.expScale`: ladicí násobky bez nastavení (strop chodníku modelu, očekávaný dosah obrub): nikdy se
  nenastavily, výchozí hodnota platila vždy.
- `P.walkCap`, `P.walkCapBy`, `?chodnik=a,b,c`: strop chodníku podle třídy ulice. Strop 2,5 m zlepšil chodníky do 3,5 m
  (Brno do 1 m 31 → 59 %), ale zkrátil široké (nad 3,5 m: Brno 55 → 18 %, Praha 36 → 27 %); po třídách ulice
  regrese Praha 62 → 60 %, Brno 57 → 57 %, hold-out −1 [−2, 0] p. b. (Bára 18.–19. 11. 2026, `evaluation/ai-segmentation/`).
