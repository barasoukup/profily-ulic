# Profil ulice jen z ortofota a OSM (pokus 15. 11. 2026)

Otázka (Bára): dá se příčný profil sestavit **bez MTVU, technické mapy a pasportů měst**, jen z ortofota a OSM?
Takový postup by mohl být záložní cestou pro další evropské státy. Zkoušela jsem to na vzorcích Prahy (96 řezů) a
Brna (99 řezů), ke kterým máme pravdu z MTVU. Aplikaci jsem neměnila.

## Krátce

- **Fasády z OSM jsou dobré tam, kde dům v OSM je**: 82–89 % fasád sedí do 0,5 m. Na řezu ale chybí dům u třetiny
  pražských a šestiny brněnských stran, kde MTVU dům má.
- **Obruby, a tím šířka vozovky a chodníků, jsou slabé místo.** Nejlepší metoda (M2, OSM + ortofoto) dá obrubu do
  0,5 m jen u **39–49 %** stran a do 1 m u **57–69 %**. Šířka vozovky sedí do 0,5 m u **19–34 %** řezů. Samotné OSM
  (M0) má obrubu do 0,5 m u 26–35 % stran, samotné ortofoto (M1) u 23–37 %.
- **Rozlišení není to hlavní.** 20 cm vychází stejně jako 10 cm, ČÚZK 25 cm je o pár procentních bodů horší.
- **Největší pomocník je značka `width` v OSM.** Brněnských 19 řezů, které ji mají, má šířku vozovky do 0,5 m
  v 68 % případů (medián chyby 0,35 m), ostatní jen v 8–18 %.
- **Doporučení:** jako záložní cesta **použitelné jen jako zřetelně označený hrubý odhad** („odhad z OSM a
  ortofota, šířky ověřte“), ne jako měřený profil. Kde jsou místní data, mají mít přednost. Aby to bylo opravdu
  použitelné, potřebovali bychom naučený model povrchů (vozovka, chodník, zeleň) z leteckých snímků, viz konec.

## Data a pravda

- **Řezy:** vzorky z `ab.mjs` (`evaluation/<město>/data/ab-city-stejne`). Každý profil má uložené úseky MTVU podél
  řezu (`runs`) a z nich beru pravdu. **Vozovka** jsou spojené úseky 700, 701, stání 97xx a zálivy 704 (do 8 m) u
  osy OSM, její okraje jsou obruby. **Fasády** jsou konce profilu aplikace, kde se zastavil o dům. **Chodník**
  jsou úseky 702/703 mezi obrubou a fasádou. **Stání** je úsek stání ve vnějších 3 m vozovky (v Praze jen v
  placených zónách, jinde ho data TSK nemají). IPR jsem se neptala, všechno je z cache.
- **OSM:** jen vlastní dlaždice ČR, stejně jako v aplikaci (`pilot/data/osm-tiles`). Domy mají v dlaždicích
  souřadnice zaokrouhlené na 1e-5° (asi 1 m), což chybu fasád zvětšuje.
- **Ortofota:** z cache `evaluation/ortofoto/data/<město>/img`, žádný nový dotaz. Praha: IPR 10 cm, ČÚZK 12,5 cm
  a 25 cm. Brno: městské 2025 (10 cm, s posunem 1,06 / 3,09 m z `lanes-ortho.js`), ČÚZK 12,5 a 25 cm. Navíc
  **20 cm** zprůměrované z 10 cm jako náhrada typického evropského ortofota. Ortofoto ČÚZK běží (ověřeno jedním
  dotazem 15. 11.).
- **Pruhy:** proti nezávislým značkám okem (`evaluation/ortofoto/labels/oznac-*`). Pruh je mezera 2,4–5,5 m mezi
  okraji a čarami. Vzorek je malý: 12 vozovek v Praze, 7 v Brně.
- **Složité řezy jsou zvlášť.** Jde o řezy, kde má MTVU v jedné ploše víc vozovek OSM (dvoupásová silnice bez
  dělicího pásu v MTVU, odbočovací pruhy) nebo křižovatku: 12 v Praze, 6 v Brně. Tam OSM a MTVU myslí vozovkou
  něco jiného a srovnání nedává smysl (obruby do 0,5 m jen 13–33 %).

## Metody

| | co dělá |
|---|---|
| **M0 jen OSM** | šířka vozovky z `width`, jinak `lanes` × šířka pruhu podle třídy (3,5 / 3,25 / 3,0 / 2,75 m) + stání a cyklopruhy z `parking:*`, `cycleway:*`; koleje OSM ve vozovce ji rozšíří. Vozovka je na střed osy OSM. Chodník sahá od obruby k domu OSM, nebo má šířku `sidewalk:width`. |
| **M1 jen ortofoto** | od osy OSM se vozovka „rozrůstá“, dokud sloupce snímku vypadají jako asfalt u osy (jas, barva, bez zeleně). Kde to aspoň 0,8 m neplatí, je obruba (přichycená k nejbližší hraně). |
| **M2 OSM + ortofoto** | kandidáti na obrubu jsou hrany jasu nebo zeleně, které drží podél ulice (v 5m kusech ±20 m), a místa 0,4 m za plnou čárou. Skóre je síla hrany + asfalt mezi osou a hranou − asfalt za hranou − vzdálenost od místa, kde obrubu čeká OSM. |
| M3 (zkoušená) | jako M2, ale obě obruby se vybírají naráz (šířka a střed zvlášť). Vyšla o 2–8 bodů hůř, dál ji nepoužívám. |

Kód je v `lib.mjs` (pravda, OSM, snímky), `methods.mjs`, `run.mjs` a `summary.mjs`, ladění v `tune.mjs`.

```bash
node evaluation/ortofoto-osm/run.mjs            # obě města, data/<město>/results.json a obrázky data/<město>/img/
node evaluation/ortofoto-osm/summary.mjs        # vysledky/souhrn.md;  --by: vysledky/podle-typu.md
node evaluation/ortofoto-osm/tune.mjs           # vysledky/ladeni.txt
```

## Výsledky

V každé buňce je **medián chyby · podíl do 0,5 m · podíl do 1 m**. Obruby počítám na obou stranách, chodníky jen
tam, kde je mezi obrubou a domem podle MTVU jen chodník (malý vzorek, n v závorce). Úplná tabulka i se 20 cm je
v `vysledky/souhrn.md`.

### Praha (78 jednoduchých řezů)

| metoda | ortofoto | obruby | šířka vozovky | chodník | obruba–fasáda |
|---|---|---|---|---|---|
| M0 jen OSM | – | 0,99 · 26 % · 51 % | 2,10 · 18 % · 27 % | 0,91 · 20 % · 60 % (10) | 2,37 · 18 % · 36 % |
| M1 jen ortofoto | IPR 10 cm | 1,60 · 24 % · 38 % | 1,95 · 20 % · 32 % | 2,52 · 11 % · 33 % (9) | 2,51 · 10 % · 29 % |
| M2 OSM + ortofoto | IPR 10 cm | **0,63 · 46 % · 58 %** | 1,50 · 33 % · 41 % | 0,58 · 44 % · 67 % (9) | 0,78 · 43 % · 52 % |
| M2 OSM + ortofoto | IPR → 20 cm | **0,60 · 48 % · 61 %** | 1,40 · 32 % · 43 % | 0,78 · 44 % · 67 % (9) | 1,86 · 38 % · 48 % |
| M2 OSM + ortofoto | ČÚZK 12,5 cm | 0,70 · 39 % · 57 % | 1,88 · 19 % · 32 % | 1,81 · 33 % · 44 % (9) | 1,79 · 24 % · 38 % |
| M2 OSM + ortofoto | ČÚZK 25 cm | 0,75 · 41 % · 57 % | 1,60 · 20 % · 33 % | 2,20 · 44 % · 44 % (9) | 2,12 · 29 % · 43 % |

### Brno (88 jednoduchých řezů)

| metoda | ortofoto | obruby | šířka vozovky | chodník | obruba–fasáda |
|---|---|---|---|---|---|
| M0 jen OSM | – | 0,83 · 35 % · 59 % | 1,60 · 23 % · 36 % | 0,72 · 43 % · 64 % (14) | 0,72 · 37 % · 59 % |
| M1 jen ortofoto | Brno 10 cm | 0,92 · 36 % · 51 % | 1,90 · 18 % · 30 % | 0,91 · 36 % · 57 % (14) | 1,13 · 32 % · 41 % |
| M2 OSM + ortofoto | Brno 10 cm | **0,55 · 48 % · 68 %** | 1,00 · 34 % · 53 % | 0,91 · 43 % · 57 % (14) | 0,66 · 44 % · 63 % |
| M2 OSM + ortofoto | Brno → 20 cm | **0,52 · 49 % · 68 %** | 1,15 · 30 % · 48 % | 0,56 · 43 % · 64 % (14) | 0,60 · 44 % · 63 % |
| M2 OSM + ortofoto | ČÚZK 12,5 cm | 0,53 · 47 % · 69 % | 0,95 · 30 % · 53 % | 1,34 · 36 % · 50 % (14) | 0,72 · 39 % · 61 % |
| M2 OSM + ortofoto | ČÚZK 25 cm | 0,70 · 43 % · 59 % | 1,50 · 22 % · 41 % | 1,45 · 29 % · 36 % (14) | 1,00 · 34 % · 51 % |

### Fasády, pruhy, stání

| | Praha | Brno |
|---|---|---|
| strany s domem v MTVU / OSM dům na řezu nemá | 42 / **14** | 54 / **9** |
| fasáda OSM proti MTVU (kde dům je) | 0,29 · 82 % · 89 % | 0,20 · 89 % · 93 % |
| celá šířka fasáda–fasáda (obě fasády jsou) | 5 řezů: 60 % do 0,5 m | 10 řezů: 90 % do 0,5 m |
| počet pruhů: OSM `lanes` | 75 % (12) | 29 % (7) |
| počet pruhů: čáry v nalezené vozovce M2 | 67 % | 29–57 % |
| počet pruhů: čáry ve skutečné vozovce | 75 % | 57–71 % |
| stání: strany se značkou `parking:*` v OSM | 10 z 46 (zóny) | 10 z 176 |
| stání: skutečné stání, které OSM zná | 1 z 10 | 1 z 31 |

### Podle typu ulice a příčin (M2, obruby do 0,5 m / do 1 m; `vysledky/podle-typu.md`)

| skupina | Praha IPR 10 cm | Praha ČÚZK 12,5 | Brno 10 cm | Brno ČÚZK 12,5 |
|---|---|---|---|---|
| hlavní (dálnice, silnice I. tř., primary) | 38 / 58 % | 46 / 67 % | 43 / 80 % | 43 / 73 % |
| sběrné (secondary, tertiary) | 57 / 67 % | 48 / 65 % | 35 / 50 % | 48 / 62 % |
| místní | 43 / 53 % | 33 / 50 % | 59 / 77 % | 48 / 73 % |
| bez potíží | 40 / 57 % | 36 / 56 % | 50 / 75 % | **59 / 79 %** |
| stromy nad vozovkou | 40 / 40 % | 25 / 58 % | – | 25 / 44 % |
| stání u obruby | 56 / 61 % | 28 / 44 % | 50 / 59 % | 39 / 57 % |
| osa OSM přes 1,5 m od středu vozovky | 50 / 55 % | 36 / 45 % | 22 / 34 % | 23 / 33 % |

Skupiny se překrývají a některé mají jen 4–12 řezů, takže jde jen o směr.

## Co funguje a co ne

1. **Domy z OSM.** Kde dům na řezu je, sedí na 0,2–0,3 m (to je zaokrouhlení dlaždic). Chybí ale často, třeba
   Spojovací (velká budova u silnice), Českobrodská nebo řadové domy, kde má OSM obrys o metr vedle řezu. Čtu
   proto domy na čarách ±1 a ±2 m podél ulice. V cizině bude pokrytí domů v OSM podobné nebo horší.
2. **Obrubu snímek většinou ukáže, ale nevíme, která hrana to je.** Do 0,5 m od skutečné obruby leží hrana u
   78–92 % stran (náhodné místo v pruhu má hranu poblíž jen u 33–56 %). Hran je ale v ulici mnoho: vodicí čáry,
   řady aut, stíny domů, koleje, šrafy. Výběr selhává takhle:
   - **Vodicí čára místo obruby** (Rozvadovská spojka, `obrazky/praha-1.jpg`): M2 skončí na plné čáře, krajnici
     za ní nevidí. M1 obrubu najde, protože krajnice je stejný asfalt.
   - **Stání:** auta u obruby vypadají jako konec asfaltu, takže vozovka vyjde o pás stání užší (Charbulova,
     `obrazky/brno-43.jpg`). OSM stání skoro nezná: značku `parking:*` má jen 10 stran z 46 v pražských zónách
     a 10 ze 176 v Brně.
   - **Koleje a šrafy ve vozovce, osa OSM mimo střed** (nábřeží Kapitána Jaroše `obrazky/praha-30.jpg`,
     Olšanská `obrazky/praha-35.jpg`): OSM čeká úzkou vozovku a vybere čáru uvnitř.
   - **Stromy a stín:** pod korunami obruba zmizí (ČÚZK 12,5 cm v Brně 25 % do 0,5 m). Hluboký stín vadí méně,
     než jsem čekala, protože hrana stínu domu často leží právě na obrubě.
3. **Šířka podle OSM je hrubá.** `lanes` × 3 m nezná krajnici, stání, odbočovací pruhy ani skutečnou šířku pruhů.
   Bez značky `width` sedí šířka vozovky do 0,5 m jen u 8–18 % řezů, s ní u 66–68 %. Značku `width` má v Praze
   3 z 96 cest, v Brně 19 z 99. `sidewalk:width` nemá žádná.
4. **Kdyby OSM znalo šířku a střed přesně**, dalo by M2 obrubu do 0,5 m u 56–75 % stran a do 1 m u 76–92 %
   (`vysledky/ladeni.txt`). To je strop tohoto ručně psaného detektoru: ani s dokonalým OSM nedosáhne přesnosti
   MTVU.
5. **Ladění skoro nepomáhá.** Mřížka vah vyladěná na Praze zlepšila Prahu o 4 body a Brno zhoršila, vyladění na
   Brně naopak (`vysledky/ladeni.txt`). Výchozí nastavení je stejně dobré a nic dalšího se z toho nevytěží.
6. **Rozlišení:** 10 a 20 cm vycházejí stejně, ČÚZK 12,5 cm v Praze o něco hůř než IPR 10 cm (jiné datum a stíny,
   ne pixely) a 25 cm je o 3–6 bodů horší. Typických 20 cm v Evropě tedy nevadí.
7. **Chodníky:** šířka chodníku je prostor mezi obrubou a domem, takže dědí chybu obruby. Zeleň mezi nimi
   z barvy na letním snímku poznat nejde: suchý trávník má skoro stejnou barvu jako dlažba (Praha, červen 2024).
   Předzahrádky a zpevněné plochy před domem (MTVU 1003) od chodníku neodliším vůbec.
8. **Pruhy:** čáry na ortofotu určí počet pruhů stejně dobře nebo lépe než `lanes` v OSM, ale jen pokud je
   vozovka správně ohraničená. Z vozovky M2 je to horší. Vzorek je malý (19 vozovek).

Obrázky (`obrazky/`, ulice vede shora dolů, řez zleva A doprava B): zelená = obruby MTVU, tyrkysová = fasády
MTVU, modrá čárkovaná = domy OSM, bílá čárkovaná = osa OSM, žlutá (horní čtvrtina) = M0, oranžová = M1,
červená = M2, fialové čárky dole = nalezené čáry. Bělohorská (`praha-15.jpg`) a Heršpická (`brno-7.jpg`) jsou
příklady, kde to vyjde. Všechny řezy jsou v `data/<město>/img/` (git je ignoruje).

## Výhrady k číslům

- Obrázky z cache sahají jen 3 m za konec profilu aplikace (tedy za skutečnou fasádu), takže hledání má trochu
  méně falešných hran, než by mělo naslepo. Výsledky jsou proto spíš lepší než ve skutečnosti.
- V Česku OSM a ortofoto k mapě sedí (posun 0,1–0,3 m, `evaluation/ortofoto/ZPRAVA.md`). V jiných státech může
  být posun OSM vůči ortofotu větší a chyby vzrostou.
- Pravda z MTVU má vlastní pravidla. Zálivy stání a tramvaj ve vozovce počítám do vozovky, samostatné těleso ne.
  Odlišné pojetí „vozovky“ dává část velkých chyb hlavně u hlavních silnic.

## Literatura (doplněk k `evaluation/ortofoto/LITERATURA.md`)

- **Máttyus a kol., HD Maps (CVPR 2016)** řeší přesně tuto úlohu: řez ulicí po úsecích OSM, MRF a dynamické
  programování nad leteckým snímkem 9 cm. Bez pozemních snímků dosáhli IoU silnice asi 62–68 %, chodníku 32–40 %,
  stání 36–38 % a chyby počtu pruhů 0,5–0,7. Naše čísla jsou ve stejném pásmu: z leteckého snímku samotného se
  obruby a chodníky spolehlivě určit nedají.
- Naučené segmentace (Tile2Net, U-Net na 10 cm snímcích) hlásí přesnost tříd silnice a chodník kolem 85–92 %,
  ale jako podíl pixelů, ne jako polohu obruby v metrech. Výrazně pomáhá výškový model (DSM), protože obruba je
  výškový skok: u ortofota s DSM 77 % správnosti silnic proti 51 % bez něj (ISPRS Archives 2025).
  [Tile2Net a odvozené práce](https://arxiv.org/pdf/2206.13677),
  [ortofoto + DSM](https://isprs-archives.copernicus.org/articles/XLVIII-G-2025/459/2025/),
  [U-Net povrchy 10 cm (PeerJ CS 2024)](https://doaj.org/article/0b36325cd5554466acfb56c90195d011).
- **Místní data v Evropě** bývají lepší než jakýkoli odhad. Příklady: Nizozemsko má celostátní BGT `wegdeel`
  s funkcí rijbaan / voetpad / fietspad ([PDOK](https://api.pdok.nl/lv/bgt/ogc/v1/collections/wegdeel/items?f=html)),
  Vídeň Flächen-Mehrzweckkarte s třídami Fahrbahn 21 a Gehsteig 23 jako OGD
  ([wien.gv.at](https://www.wien.gv.at/stadtentwicklung/stadtvermessung/geodaten/fmzk/)). Licence je třeba ověřit
  zdroj od zdroje.

## Doporučení

1. **Jako fallback: ano, ale jen jako zřetelný odhad**, ne jako měřený profil. Co se dá převzít:
   - fasády z domů OSM (dobré, kde dům je);
   - vozovku podle M2, kde OSM má `width` nebo kde ortofoto najde hranu blízko očekávání OSM;
   - pruhy z čar na ortofotu (`lanes-ortho.js` už to umí);
   - vše ostatní jako „odhad“ s výzvou k „Opravit data“.

   Uživatel musí počítat s tím, že zhruba každá třetí až druhá obruba je o metr i víc vedle.
2. **Místní data první.** Před rozšířením do státu zjistit, jestli má celostátní nebo městskou mapu povrchů (BGT,
   FMZK a podobné). Ty dají přesnost MTVU a fallback by byl jen pro zbytek.
3. **Aby byl fallback opravdu dobrý**, potřebovali bychom:
   - naučený model povrchů (vozovka / chodník / zeleň / auta) na ortofotech, trénovaný na MTVU Prahy a Brna
     (máme tisíce kilometrů pravdy), počítaný jednou při nasazení, ne v prohlížeči (licence a velikost jako
     u aut: viz rozhodnutí 11. 11. 2026);
   - výškový model (DSM / DMR 5G, mračna bodů), kde je k dispozici: obruba je výškový skok 10–15 cm;
   - značky `width`, `parking:*` a `sidewalk:*` z OSM s vyšší vahou. Kde OSM má `area:highway` nebo
     `width`, je výsledek výrazně lepší;
   - a nakonec opravy od uživatelů (záznam řezů) jako další pravdu.

   Bez naučeného modelu tímhle ručním postupem nad asi 50 % obrub do 0,5 m nevyjdeme. Ani s dokonalým OSM
   nepřekročíme asi 75 %.
