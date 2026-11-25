# Washington: hlavní ulice (tepny), 25. 11. 2026

Měření s přesnějším pokynem dávalo na 7 tepnách mapě DC 57 % proti 79 % bez ní. Rozbor, opravy čtení dat DC
(`towns/usa.js`, žádný zásah do sdíleného kódu, `?off=dctepny` vrátí předchozí stav) a ověření na nových řezech.

## Příčiny na 7 řezech

| řez | mapa / bez | příčina |
|---|---|---|
| dc-4-3 Military Road | 43 / 100 | **chyba mapy i čtení**: planimetrie má jednu vozovku 27,3 m přes betonový střed; inventář počítá pruhy obou směrů (4) a přepsal jimi 2 pruhy jednosměrné vozovky v OSM. Střed je ve vrstvě 13 Traffic Barrier |
| dc-6-3 3rd Street NW | 56 / 83 | **chyba čtení**: jediný pruh stání dán na špatnou stranu (inventář stranu neuvádí; je u směru s méně pruhy), totéž přepsání pruhů, nárožní trávník „Traffic Island“ jako dělicí pás (ten zůstal: kreslí se jako dělicí i z OSM) |
| dc-3-3 Western Avenue | 40 / 60 | inventář vede stání 2 × 10 ft, posuzovatel žádné nevidí (vozovka 12,3 m, u přechodu další pruh). Neopraveno, viz otevřené |
| dc-1-3 Beach Drive | 33 / 100 | chyba posuzovatele: stezka Rock Creek Trail 2,6 m od vozovky existuje (mapa i OSM), posuzovatel ji pod stromy neviděl |
| dc-5-3 North Capitol Street | 83 / 100 | chodník 2 m za obrubou mapa má, posuzovatel ho četl jako krajnici |
| dc-2-3 H Street | 43 / 43 | řez uprostřed křižovatky |
| dc-7-3 Kenilworth Avenue | 100 / 67 | mapa lépe |

Na osmi tepnách starého A/B se našlo ještě: 15th Street (chráněná obousměrná cyklostezka z inventáře se nečetla) a
South Capitol Street (svodidla mezi vozovkami).

## Opravy

1. Betonová svodidla planimetrie (vrstva 13 „Barrier“) jako čára svodidla; dělí vozovku sdílené `splitMedians` (musí mít na
   obou stranách osu ulice). Jeden dotaz na řez navíc.
2. Počet pruhů z inventáře na jednosměrné vozovce dvousměrného bloku: platí OSM, jinak pruhy směru.
3. Jediný pruh stání bez uvedené strany: u směru s méně pruhy.
4. Chráněná cyklostezka z inventáře, kterou OSM vede zvlášť (`cycleway=separate`): cyklostezka u obruby.
5. Ostrůvek, který nemá vozovku z obou stran, není dělicí pás.

## Ověření

25 nových tepen (`sample.mjs`, semínko 251126, ne blíž než 150 m k dřívějším řezům, s fotkou). Sběr `../collect.js`
(def, dcold, dc0 na témže místě). Tři noví posuzovatelé Sonnet naslepo, neutrální `POKYN.md`, X/Y náhodně, zdroje skryté.
**Mapa se použila ve všech 25.** `node evaluation/usa/arterials/score.mjs tm tn`.

| | výsledek |
|---|---|
| mapa (s opravami) : bez mapy (`?dc=0`), 25 nových tepen | **19 : 6**, stejně 0, nejde posoudit 0 |
| nový kód : starý kód, všech 97 řezů (25 nových, 40 starého A/B, 32 pilotu), změněno 11 | 8 : 2, stejně 1, nejde posoudit 0 (většinou laděné řezy, viz dva řádky níže) |
| z toho 3 změněné mezi 25 novými | 2 : 0, stejně 1 |
| z toho 8 změněných na řezech, z nichž se ladilo nebo které jsou ze starých vzorků | 6 : 2 |

Výhrady: opravy se ladily na pilotu a tepnách A/B, 25 nových řezů se při ladění neprohlíželo. Nový proti starému kódu je na
nových řezech jen 3 změny, nic neprůkazného. Oproti univerzálnímu měření je tu jiný úkol (výběr lepšího z dvojice, ne
editační vzdálenost). Posuzovatelů byl jeden na balíček.

**Závěr:** na nových tepnách mapa neprohrává, vyhrává výrazně; prohry na 7 řezech byly dvě chyby čtení, dvě chyby
posuzovatele, jeden sporný pruh stání a jedna remíza na křižovatce. Mapa zůstává zapnutá i na tepnách. Oficiální řádek US se nepřeměřoval.

Evropská kontrola není: do sdíleného kódu se nesáhlo.

## Otevřené

- te-14 Rhode Island Avenue: betonový středový ostrůvek není v planimetrii ani ve svodidlech, mapa má vozovku 24,5 m v kuse
  (ortofoto ho vidí). te-8: řez přes křižovatku s lichoběžníkovým přechodem.
- Stání 10 ft a víc na tepnách (asi polovina bloků hlavních ulic se stáním): často pruh jezdící ve špičce; inventář to nerozlišuje.
- Pásy jamek stromů v dlažbě se čtou jako zeleň (te-7, te-16); `?jamky=1` zůstává vypnuté.
- dc-2-3 po opravě pruhů hůř (křižovatka), ab-8-2: krajnice 3,2 m čtena jako třetí pruh.
