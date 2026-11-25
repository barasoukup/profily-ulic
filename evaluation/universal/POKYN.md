# Pokyn pro posuzovatele řezu ulicí (univerzální metoda, 17. 11. 2026; upřesněno 25. 11. 2026)

U každého řezu máš:
- `data/<id>-ortho.jpg`: ortofoto shora. Řez vede **vodorovně** (žlutá čárkovaná čára uprostřed), ulice běží **nahoru a dolů**.
  Strana **A je vlevo**, **B vpravo**. 10 px = 1 m; měřítko nahoře a dole má čárku po 1 m a dlouhou čárku po 5 m.
  Šířka obrázku v metrech je v souboru `data/<id>.txt`.
- někdy `data/<id>-f.jpg` a `data/<id>-b.jpg`: fotky z ulice (Mapillary). `-f` se dívá **nahoru** v ortofotu (A je na fotce
  vlevo), `-b` opačně (A je na fotce vpravo). Fotka může být starší než ortofoto.

Profil aplikace nevidíš. Sestav sám **příčný profil ulice podél žluté čáry od A do B**: od fasády domu (nebo okraje
plotu, zahrady, parku) na straně A po fasádu na straně B. Nevíš-li, kde ulice končí, skonči na okraji obrázku.

Části (jen tyto kódy), každá s přibližnou šířkou v metrech podle měřítka:
`chodnik`, `stani` (stání aut podél vozovky; uveď `podelne` / `kolme` / `sikme`), `pruh` (jeden jízdní pruh; každý pruh
zvlášť), `bus` (vyhrazený pruh BUS), `cyklopruh` (na vozovce), `cyklostezka` (mimo vozovku), `tramvaj` (koleje: v pruhu
s auty, nebo samostatné těleso), `zelen` (tráva, keře), `stromy` (pás se stromy), `delici` (dělicí pás, ostrůvek, svodidla
uprostřed), `nastupiste`, `krajnice` (nepojížděný asfalt u kraje, šrafy), `jine` (předzahrádka, dvůr, parkoviště, plocha
mimo ulici).

**Co do profilu patří (upřesnění 25. 11. 2026, Bára):**
- **Každá část od fasády k fasádě, která je široká aspoň asi 0,5 m**, i úzká. Hlavně **pás trávy nebo pás se stromy
  mezi chodníkem a obrubou** (i 1 m, jen tráva, keře nebo hlína se stromy): zapiš ho jako `zelen` nebo `stromy` mezi
  `chodnik` a `stani`/`pruh`, ne jako součást chodníku. Na ortofotu je to zelený nebo hnědý pás podél obruby, na fotce
  tráva mezi chodníkem a vozovkou nebo auty. Co popíšeš v `note`, musí být i v `parts`.
- Naopak jednotlivé jamky stromů v dlážděném chodníku (mezi stromy je dlažba) pás zeleně nejsou: to je `chodnik`.
- **Chodník dělený pásem zeleně nebo cyklostezkou** zapiš po kusech (`chodnik`, `stromy`, `chodnik`), ne jako jeden.
- **Stání** (`stani`) zapiš všude, kde je pruh u obruby určený ke stání: vyznačená stání (čáry, jiná dlažba, zálivy),
  značka, nebo auta stojící u té obruby na kterékoli fotce nebo na ortofotu. Ne jen tam, kde zrovna teď auto stojí;
  prázdný úsek mezi auty je pořád stání. Kde stání zjevně není (plná čára u obruby, zákaz, vjezdy, cyklopruh u obruby),
  nezapisuj ho.
- **Chodník na obou stranách:** skonči až u fasády (plotu, zahrady), ne u obruby. Chodník bývá pod korunami stromů nebo
  za zaparkovanými auty; hledej ho na fotkách. Když na straně chodník opravdu není, napiš to do `note`.
- **Pruhy:** každý jízdní pruh zvlášť. Neznačená obousměrná vozovka má dva pruhy, když se v ní (bez stání) vedle sebe
  vejdou dvě auta, asi od 5 m; užší jeden. Šrafy uprostřed jsou `krajnice`, ne `delici`; `delici` je jen fyzický pás
  (obruba, tráva, svodidla).
- **Tramvaj na samostatném tělese** (tráva, štěrk, obruby) zapiš jako `tramvaj` celou šířkou tělesa; `delici` vedle ní
  jen tam, kde je mezi tělesem a vozovkou opravdu další pás.
- Fotka, která zjevně není z tohoto místa (jiná ulice než na ortofotu), se nepočítá; napiš to do `note` a řiď se
  ortofotem a druhou fotkou.

Ortofoto ukáže pruhy (podle značení), dělicí pás, obruby a šířky; fotky ukážou stání, chodníky, stromy, cyklopruhy.
**Fotky jsou povinné:** u každého řezu otevři každou fotku, která existuje, a do `note` napiš, co na ní je
(„foto f: …, foto b: …“). Nespěchej, každý řez posuď zvlášť.
Kde si nejsi jistý, napiš `?` za kód (např. `stani?`).

Výstup jeden JSON řádek na řez do `vysledky/<soubor>.jsonl`:
{"id":"p1","usable":true,"facadeA":true,"facadeB":false,"parts":[["chodnik",3.5],["stani",2,"podelne"],["pruh",3.2],["pruh",3.2],["chodnik",4]],"note":"krátce česky"}
`facadeA` / `facadeB`: zda profil na té straně končí fasádou domu. `usable: false`, když řez na ortofotu není ulice
(střecha, tunel, mrak).

## Jak se profil hodnotí (pro autora měření, posuzovatel to nepotřebuje)

`compare.mjs` srovná profil posuzovatele s profilem aplikace: složení (pořadí tříd, sousední stejné sloučené, krajnice
a `jine` se nepočítají) editační vzdáleností, počet pruhů a šířku uličního prostoru. Uliční prostor je od první po
poslední část ulice (chodník, stání, pruh, BUS, cyklopruh, cyklostezka, tramvaj, nástupiště, dělicí pás); zeleň mezi
pruhy je dělicí pás.

**Strana bez fasády** (`facadeA` / `facadeB` false; od 23. 11. 2026, Bára; `compare.mjs scope()`, stejně pro oba
profily): kde ulice na takové straně „končí“, je libovolné (posuzovatel přestane počítat trávu někde, aplikace u svého
konce). Proto:
- **Okraj ulice** na té straně: od vnější části vozovky (pruh, BUS, tramvaj, stání, cyklopruh, krajnice) ven ještě
  chodník, cyklostezka nebo nástupiště hned za ní, i přes pás zeleně nebo krajnici nejvýš 3 m (`VERGE_MAX`) mezi nimi
  a vozovkou; dál nic (pěšina přes trávník, parkoviště, dvůr).
- **Šířka i složení** se počítají jen po tento okraj (krajnice u vozovky se započítá). Co je za ním, ani zeleň, se
  nehodnotí (Bára 24. 11. 2026: skončit tam u obruby je pro uživatele správně, měření to nesmí trestat jako chybějící zeleň).
- Strany s fasádou se hodnotí jako dřív.

Příklad si-kranj-2: posuzovatel zeleň 5,5 | krajnice 1 | pruh 3,25 | pruh 3,25 | krajnice 1 | zeleň 5,8, aplikace
pruh 3,7 | pruh 5,7. Šířka 8,5 m proti 9,4 m (dřív 6,5 proti 9,4); složení se shoduje (zeleň za okrajem se nehodnotí).

**Řezy, které nejsou ulice** (od 24. 11. 2026, Bára; nejdřív Slovinsko, od přeměření 24. 11. ve všech státech, `score-states.mjs excluded`): bod,
jehož řez padne na OSM `highway=service` se `service=driveway`, `parking_aisle` nebo `drive-through`, se z hodnocení
vynechá (neposouvá se). Obyčejná `highway=service` bez `service`, `residential`, `living_street` atd. zůstávají.
Značku cesty řezu bere skóre z profilu aplikace (`service`) nebo z `vysledky/sluzebni-<iso>.json` (z balíku OSM státu
podle `wayId` řezu; přeměření 24. 11. je má pro všechny státy, `collect24` v `collect.js`).
