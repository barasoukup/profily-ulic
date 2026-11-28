# Rozhodnutí: smazané pokusy

Tady je každý pokus, který prohrál nebo zůstal navždy vypnutý a Bára 27. 11. 2026 řekla, že se z kódu maže (krok 6 plánu
`docs/code-health-plan.md`; smazáno 28. 11. 2026, větev `drop-experiments`). Kód každého pokusu je v gitu v `main` před
úklidem (commit b62f8174) a v prvním z commitů „Drop experiments“, který ho maže (`git log --grep "Drop experiments"`). Řádek: co to bylo, výsledek měření, kde je zpráva.
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
- `?nycsigns=1` (New York: stání podle značek NYC DOT, `signTags`, `signsIn`, EPSG:2263): slepé A/B 31 změněných nových řezů
  17 : 8 (p 0,11), univerzální měření 75 → 72 %; Bára 27. 11. 2026: „nevymýšlet výjimky, nechat NY jak je“
  (`evaluation/usa/nyc/park/REPORT.md`).
- `?sfosmpark=1` (San Francisco: orientace stání z OSM tam, kde obruba dá podélné): slepé A/B 30 nových řezů 12 : 11
  (`evaluation/usa/sf/fixes/REPORT.md`).
- `?sirka=1` (Francie: šířka vozovky z BD TOPO `largeur_de_chaussee`, `bdtopoWidths`): celé metry, A/B se nikdy neudělalo,
  proto vypnuto (`evaluation/france/`, docs/countries/FR.md).
- `?ilots=1` (Paříž: soukromé bloky Plan de voirie jako konec veřejné cesty, `parisBlocks`): slepé A/B 13 změněných řezů
  ze 60 nových nebylo průkazné (5 : 2, pokud se oba posuzovatelé shodli; každý zvlášť 5 : 2 a 6 : 4); jeden dotaz navíc na
  řez (Bára 26. 11. 2026, `evaluation/france/facade/REPORT.md`).
- `?fietsstrook=1` (Nizozemsko: `fietspad` BGT vedle vozovky při cyklopruzích z OSM je vozovka): univerzální posouzení
  20. 11. 2026 nebylo lepší (složení 53 → 52 %, šířka do 2 m 47 → 41 %; z pruhů vznikly obyčejné pruhy a z dlažby vedle
  nich střední pás), `evaluation/netherlands/ab/`.
- `?amspark=1` (Amsterdam: jednotlivá parkovací místa se způsobem stání, `amsParking`): A/B 16 řezů smíšené, stání se našlo
  tam, kde ho BGT nemá, ale mezery mezi místy rozřízly pás stání na krajnici a jedna strana o stání přišla; licence
  neuvedena (`evaluation/netherlands/ab/PARKING.md`).
- `?floorsosm=1` (výška z OSM bez `building:levels` přes `floors.js` místo výška / 3,5): slepé A/B na fotkách 11 : 8,
  p = 0,65, bez výhry (`evaluation/archive/floors-height/REPORT.md`). Výška z jiných zdrojů dál přes `floors.js`.

### Odvození profilu (`derive.js`)

- `?treepits=1` (`treePitsAsSidewalk`, `stripLook`): úzký zelený pás mezi chodníkem a obrubou, který na ortofotu vypadá
  dlážděně (jamky stromů ve washingtonském chodníku), se připojí k chodníku. Slepé A/B 24. 11. 2026: Washington 2 : 2,
  české kontroly 0 : 1, skutečný trávník u silnice se četl jako dlažba (`evaluation/usa/REPORT.md`).
- `?otherstreet=1` (`OTHER_CUT`): profil končí u chodníku nebo zeleně před jinou ulicí, která řez kříží šikmo. Slepé A/B
  25. 11. 2026 remíza: 13 : 10 z 31 změněných řezů, Evropa 9 : 10, Washington a Toronto 4 : 0 (`evaluation/canada/review/`).
  Upozornění „řez vede křižovatkou“ zůstává, vypíná ho `?off=otherstreet`.

## Vypínače `?off=…` zapnutých oprav, které se smazaly (Bára 27. 11. 2026)

Oprava zůstala zapnutá, smazal se jen vypínač a větev „jako dřív“. Vypínače, které uvádí `CLAUDE.md` nebo
`docs/profile-derivation.md` (`mapfill`, `lawlanes`, `parkshare`, `ulicky`, `otherstreet`, `mostdeska`, `zabradli`, `railway`, `osmwalk`,
`floorsh`…), zůstaly. A/B při zavedení je v komentářích commitů před smazáním (`git log -S'off=<klíč>'`) a ve zprávách
`evaluation/` (často `evaluation/archive/unification/`, `evaluation/archive/railway/`).

- `ortho-osm.js` (odhad z ortofota a OSM): `mostchodnik` (chodníky na mostě podle OSM), `embedded2` (koleje `embedded_rails=tram`
  ve vozovce), `raillimit`, `railpair`, `pairclass`, `pair` (druhá vozovka ulice ze dvou jednosměrek: kolejová cesta, stejná
  třída, vůbec), `tramway` (kolejové těleso z OSM ve středním pásu), `bedwidth` (těleso jen kolem kolejí, ne přes celý
  pás), `koruny` (koruny stromů z ortofota nejsou tráva), `osmbike` (cyklostezka z OSM za obrubou), `vyplnkonec` a
  `zachodnikem` (profil končí za poslední věcí ulice místo dosahu), `konec` (konec strany u schodů, plotu, zdi), `murkonec`
  (zeď za ulicí, Lipsko; `evaluation/archive/railway/REPORT.md`), `pieces` a `pieceMax` (kusy chodníku mezi čarami mapy
  města, strop 6 m), `aiwalk`, `aiwalkcap` (model rozhoduje chodník, zeleň, plochu před domem; hold-out chodník F1 +5 [3, 7] p. b.),
  `soubezna` (souběžná vozovka z OSM), `pozadi` (zeleň nebo dlažba za vším ostatním), `sdilena` (stezka sdílená s chodci), `besidezbgis`
  (plochy ZBGIS vedle pasportu), `fasada` (proužek dlažby u fasády vedle chodníku mapy).
- `derive.js` (odvození profilu): `bezaut` (pruh zakázaný autům), `promenade` (promenáda jako část ulice), `obsluznevolne`
  (obslužná cesta při kliku, `evaluation/clicks/REPORT.md`: mapy 32 : 13), `bocni` (stání jen vlastní ulice), `stripparking`
  (parkoviště jako pruh u obruby), `stanisirka` (šířka podélného zálivu), `raillanes` (pruhy kolejí z OSM), `dualbed` (dvě vozovky
  a těleso mezi nimi), `tramhalf`, `tramroad`, `tramwide` (šířky a počet kolejí), `stromy3` (strom v zeleném pruhu), `cyklosirka`
  (`cycleway:width`, `footway:width`), `anytram` (plocha tramvaje jako vozovka), `rucniplot` (ručně natažený dosah za plot),
  `grassbed` (těleso v trávníku jen kolem kolejí), `dvapruhy` (rozdělení dvousměrného pruhu), `stredcara` (osa podle ortofota
  v zákonném stání a u krajnic), `strop` (strop šířky pruhu), `rezkolo` (cyklostezky vyříznuté z vozovky), `stezkapodel`
  (stezka podél silnice), `bezpruhu` (pruhy z krajnic), `rezkoleje` (koleje vyříznuté z vozovky), `cesty` (odhad cest a stezek).
- Ostatní: `jedenpruh`, `obousmerka` (`lanes-ortho.js`, pruhy z čar), `parkmedian`, `parkdir` (`ai-kerbs.js`, stání u středního
  pásu a směr stání), `jednosmerka` (`signs.js`, dvojice jednosměrných vozovek), `chata` (RÚIAN, rekreační dům bez podlaží),
  `vesnice` (malý dům o samotě je rodinný), `panel2` (zahraniční panelák jen podle tvaru; slepé A/B na fotkách 54 : 48,
  `evaluation/archive/village-houses/REPORT.md`), `firstclick` (jen první klik v oblasti se posouvá od křižovatek),
  `widereach` (delší dosah dálnic a hlavních ulic), `aipark` (stání podle aut modelu), `posunba` (posun pasportu Bratislavy).

- Mezery ve stání TSK v Praze („Zákaz stání“, `opts.zakaz`, vypnuté od 11. 11. 2026): mezery pár metrů uvnitř souvislého stání (vjezdy, popelnice, stromy; 99 ze 101 na Vinohradech uvnitř úseku TSK, medián 5,6 m), pod rozlišením profilu. Smazáno (Bára 28. 11. 2026).

## Obecná rozhodnutí o aplikaci (dříve CLAUDE.md)

- Žádný typ „sdílený prostor“; obytné a sdílené zóny mají vozovku jako pruh. Pěší zóna je chodník (kreslí se s lidmi,
  ne s auty; pruh jen tam, kde ho technická mapa opravdu má; Bára 17. 11. 2026, `derive.js` `pedestrianZone`, `?off=pesizona`).
- Ulice ze dvou vozovek se řeže uprostřed (středový pás / tramvaj).
- Ignorovat ulice pod mosty a podzemní cesty (metro, tunely se záporným `layer`/`level`).
- Interní model smí obsahovat i to, co Streetmix neumí (rychlosti apod.); převod na typy
  Streetmixu až při exportu.
- UI: mapa + upravitelný profil, posuvný předěl (výchozí 50:50), krátké popisky, v hlavičce jen
  název ulice, kurzor křížek. Výchozí podklad „Mapa IPR“ (rychlý rastr z ArcGIS Online).

## Na příště a nápady (dříve CLAUDE.md)

- Na příště (Bára 12. 11. 2026): výšky povrchu (výškové body technické mapy, DMR 5G) i pro samotný profil: kreslit ho
  ve skutečné výšce (jedna strana ulice výš než druhá, vyvýšená cyklostezka nad vozovkou).
- Na příště (Bára 12. 11. 2026): ortofoto má rozeznat vodorovné značení od nevyježděných světlých pásů uprostřed pruhů
  (řez 324 v Hradci, ČÚZK 12,5 cm): geometrie (pás leží mezi stopami kol, světlá místa po půl pruhu) a vlastnosti
  naučené z doznačených příkladů (kontrast, ostrost, šířka, vzor čárek, barva), ověřit křížově mezi městy.
- Nápady, Bára zatím nevybrala: zóny (obytná/pěší/30) a rychlosti po pruzích z OSM, povrch,
  názvy zastávek MHD, přechody.
- Rešerše: podobné nástroje https://claude.ai/artifact/F2fMQV88XSJJQiHX2YxLb6 (3DStreet pro 3D),
  rozšíření na celou ČR https://claude.ai/artifact/4U8qC5mKb5sTwLnvfYdeWn (proveditelné, začít Brnem).
