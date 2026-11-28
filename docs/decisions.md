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
- `P.cars` (`carsSeen`): zaparkovaná auta podle rozptylu jasu pásu u obruby. Regrese 16. 11. 2026: přidává stání tam, kde
  žádné není (Praha 33 proti 5, Brno 52 proti 7), přesnost 56 % (stíny, stromy, střechy) – `evaluation/ortho-osm/CARS.md`,
  `evaluation/archive/ortho-osm-cars/` (skripty a štítky pokusu přesunuté do archivu).
- `P.carsColour`, `?auta=1` (`carsColoured`): auta podle barev, jen v místních ulicích. Praha obruby o málo lepší (medián
  1,00 → 0,90 m), ale Brno na ČÚZK horší (1,05 → 1,15 m) a na 10 cm IPR víc stání, než má MTVU (6 → 16); Bára 19. 11. 2026
  nechala vypnuto (`evaluation/ortho-osm/CARS.md`).
- `P.areaGreen`: trávník ze ZBGIS jen tam, kde ho potvrdí zeleň na snímku. A/B 16. 11. 2026 na 91 řezech změnilo 9,
  Štúrova nic, Mudroňova přišla o správný trávník (`evaluation/archive/unification/AUDIT.md`,
  `evaluation/slovakia/ab/REPORT.md`).
- `P.partner80`, `?partner80=1` (`partnerReach`, `partnerGap`): druhá vozovka ulice ze dvou jednosměrek až do 80 m
  (Paseo de la Casa de Campo, Madrid). Slepé A/B 43 změněných řezů ze 72, dva posuzovatelé jen z ortofota: 24 : 28, bez
  přínosu (`evaluation/archive/unification/amiens-far`). Zůstává 35 m (40 m při vystředění řezu).
- `P.edgeOn`, `?nastenu=1` (`edgeBeyond`): výchozí dosah nového řezu až k první zdi nebo plotu do 40 m (Berliner Straße,
  Lipsko). Na 70 řezech vzorku se nezměnil ani jeden, přínos nelze doložit (`evaluation/archive/railway/REPORT.md`,
  `docs/backlog.md`).

### Mapy povrchů a státy (`towns/`)

- `?tm=1` (`baTechMap`): plochy z technické mapy Bratislavy (čáry uzavřené na mřížce 10 cm, druh plochy podle značky uvnitř).
  Slepé A/B 16. 11. 2026: plochy vzácné (málo značek, mnoho otevřených čar, jedna plocha přes celý řez), ploty
  ukončovaly profil u předzahrádek (`evaluation/slovakia/ab/REPORT.md`). Čáry téže mapy (`edgesAt`, kraje) zůstávají.
  V uložených řezech se `skTm` dál uznává (kredit), kdyby je někdo měl.
- `?zvolen=1` (pasport Zvolena: komunikace z čar se šířkou, spevnené plochy): A/B 16. 11. 2026 horší, plochy leží přes
  trávníky a parkoviště, šířky čar jsou rozmezí (`evaluation/slovakia/ab/REPORT.md`). Čáry kresby Zvolena (`EDGE_SOURCES`) zůstávají.
- `?outergaps=1`, `?outerosm=1` (Boston: `outerGaps`, `osmAreasAlong`, `outerGapsByImage`): mezery za vnějším chodníkem podle domů
  a parkovišť z OSM a ortofota. Slepé A/B 52 nových tepen 18 : 16; jen z OSM 102 změněných tepen 24 : 22, nic nevyhrálo
  (Bára 26. 11. 2026, `evaluation/usa/boston/outer/REPORT.md`, `evaluation/usa/boston/outer-osm/REPORT.md`).
