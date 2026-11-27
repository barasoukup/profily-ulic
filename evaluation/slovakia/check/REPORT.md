# Kontrola 1000 slovenských řezů (16. 11. 2026)

Bára: „Zřídíš si agenta, který projde 1000 míst na Slovensku… Pak se je pokusíš opravit. Před každou opravou A/B.“

## Jak
- `sample.mjs`: 1000 bodů s pevným výběrem kolem center 26 měst (Bratislava 228, Košice 120, 8 krajských a okresních
  měst po 40–50, 16 menších po 17). Aplikace každý bod přichytí k nejbližší ulici.
- `collect.js` (modul, běží ve stránce aplikace `?osm=r2`): řez, díly profilu a všechny cesty OSM, které čára řezu
  protne, s polohou od A. Asi 9 minut. Výsledky zůstávají ve stránce (`localStorage` `kontrola-1000-A`).
- `check.js`: podezření podle OSM na čáře řezu (ne verdikt): `report(rows)` dá seznam s odkazy, `findings(rows)`
  druhy pro A/B. Opravy se A/B porovnají na stejných 1000 bodech (sběr znovu, rozdíly podle druhů).
- Bářiny nálezy z procházení: `speky.md`.

## Výsledek stavu b3b9fea + a5325ec

| druh | řezů | poznámka |
|---|---|---|
| pěšina nebo cyklostezka nakreslená jako silnice | 252 | 238 z nich je „pruh 3 m \| pruh 3 m“: řez chytil pěšinu (footway 126, path 90, cycleway 25, schody 5), odhad z ortofota a OSM z ní udělá dvoupruhovou silnici |
| široký jízdní pruh (> 4,6 m) | 65 | Strieborná v Žilině 7,15 m, Južná v Nitře 6,5 m, Chorvátska v Bratislavě 6,3 m |
| cyklostezka z OSM chybí | 44 | většinou totéž jako první řádek (řez na cyklostezce); jinak cyklostezka vedle ulice v zeleni (Trenčianska, Kopčianska, Jantárová) |
| počet pruhů jiný než OSM lanes | 24 | Trnavská cesta OSM 4 / profil 7, Viedenská cesta 4 / 2, Landererova 6 / 4 |
| bez profilu | 16 | |
| široký chodník (> 9 m) | 14 | Lužná 34 m, Na Vtáčniku 22 m, Čremchová 21 m |
| chodník z OSM leží ve vozovce profilu | 6 | Devínska, Viedenská, Drotárska cesta: chodník v „krajnici“ |
| ulice bez jízdního pruhu | 2 | Satinského, Prokopova: chodník \| krajnice \| krajnice \| chodník |
| koleje tramvaje bez tramvaje | 1 | Jantárová cesta |
| cyklopruh na silnici (OSM) chybí | 1 | Kasárenská v Trenčíně (cycleway=lane) |

Pořadí oprav podle počtu: 1. pěšina jako silnice, 2. široké pruhy, 3. počet pruhů proti OSM, 4. řezy bez profilu.

## Oprava 1: pěšina, cyklostezka a schody jako jeden díl (A/B, 16. 11. 2026)
Řez, který chytí pěšinu (OSM footway, path, cycleway, steps, bridleway), dostal z odhadu z OSM dva jízdní pruhy po 3 m.
Teď jeden díl: chodník, stezka pro cyklisty, nebo společná stezka (cyklostezka s chodci bez oddělení, pěšina pro kola),
šířka z OSM `width`, jinak typická (chodník 2 m, cesta 1,5 m, cyklostezka 2,5 m). `derive.js` `estimatePath`,
vypnutí pro A/B `?off=cesty`.

- Změnilo se 244 z 1000 řezů. 238 je právě pěšin ze „pruh | pruh“: chodník 2 m 124×, 1,5 m 82×, společná stezka 24×,
  cyklostezka 6×. Zbylých 6 jsou silnice odhadnuté z ortofota, kde se šířky mezi dvěma běhy liší o desítky centimetrů
  (kolísání čtení obrázku, oprava se jich netýká).
- Podezření: pěšina jako silnice 252 → 14 (zbylé nejspíš falešné poplachy kontroly: ulice, kterou u osy kříží chodník; neprošla jsem je),
  cyklostezka z OSM chybí 44 → 14, chodník ve vozovce 6 → 4; ostatní beze změny.
- Regrese odhadu proti MTVU Prahy a Brna beze změny. Testy prošly.
- Pozor při sběru: běh ve skryté záložce se zpomalí; když se do `localStorage` uloží velké výsledky, aplikace pak
  neuloží profil a řez vyjde prázdný (proto výsledky jen v paměti stránky).

## Oprava 2: obousměrka s jedním pruhem od 5 m má dva pruhy (A/B, 16. 11. 2026)
Čtení čar z ortofota (`lanes-ortho.js`) nechá jeden pruh, když středovou čáru nenajde, i na obousměrné ulici široké 5–6,6 m
(Haanova 6 m, Devínska a Jantárová cesta přes OSM lanes=2). Pravidlo 2 × 2,5 m od 5,0 m (Manuál C.2) teď platí i po
něm: `derive.js` `splitTwoWayLane`, voláno v `app.js` po `applyLanes`. Ne v obytné a pěší zóně, na jednosměrce, kruhovém
objezdu, ulici s tramvají nebo více vozovkami a ne při OSM lanes=1. Vypnutí pro A/B `?off=dvapruhy`.

- A (vypnuto) a B (zapnuto) na stejných 1000 řezech, výsledky v IndexedDB stránky (`A-dvapruhy-off`, `B-dvapruhy`).
- **Šum mezi běhy:** 59 řezů vyšlo v B s jinými druhy dílů a 20 s jinými šířkami, i když se jich oprava netýká. Příčina:
  v B na chvíli neodpovídalo ZBGIS nebo ortofoto (souvislý blok košických řezů), aplikace pak potichu spočítala hrubší
  odhad jen z OSM; znovu spočítané vyšly jako v A. A/B se proto čte jen na řezech se stejnými zdroji v obou bězích
  (`check.js` `compare`).
- Na 917 řezech se stejnými zdroji (83 vynecháno) se změnilo přesně 13: všechno jednopruhové obousměrky o 5,0–6,6 m, teď
  dva pruhy. Nic jiného. Široký pruh (> 4,6 m) 62 → 49, počet pruhů proti OSM 24 → 21.

## Oprava 3: strop šířky pruhu i po ortofotu (A/B, 16. 11. 2026)
Pruh širší než strop své ulice o metr a víc (místní 4,5 m, jinak 4 m, dálnice 3,75 m) dá zbytek krajnici, odhad, i když
pruh přeměřilo ortofoto: `derive.js` `capWideLanes` po `splitTwoWayLane`. Krajnice ke straně pruhu u obruby, k
existující krajnici, je-li u pruhu (žádné dvě vedle sebe), na obě strany, když obě jsou u obruby a zbytek stačí na dvě.
Ne mezi pruhy, ne v obytné a pěší zóně. Vypnutí `?off=strop`.

- A = běh po opravě 2, B = se stropem, porovnáno 922 řezů se stejnými zdroji: změnilo se přesně 11, všechno ty široké
  pruhy (Ďumbierska 6,1 → 4,5 + 1,6, Športová 5,8 → 4,5 + 1,3, Montua 6,6 → 1,05 + 4,5 + 1,05). Široký pruh 49 → 38.
- Po prvním běhu přibylo sloučení s krajnicí, která už u pruhu byla (Viedenská cesta), a znovu přepočítáno těch 11.
- **Zbývá:** u ulic, kde OSM počítá víc pruhů (Viedenská cesta 2 + 2), je místo druhého pruhu široká krajnice; patří k
  bodu „méně pruhů, než má OSM“.

## Vzorek 995 skutečných ulic (Bára 16. 11. 2026: „více zaměřit na cesty, které jsou fakt ulice“)
`sample-streets.mjs`: náhodné body stejných měst přichycené k nejbližší pojmenované ulici (primary až residential,
obytná zóna) do 250 m, nejvýš dva body na ulici; 733 residential, 99 tertiary, 64 primary, 37 unclassified, 33 secondary,
22 obytných zón, 7 trunk a nájezdů. Běh `U-1` (stav po opravách 1–3): profil u všech 995, vždy na zamýšlené ulici.

| podezření | řezů |
|---|---|
| počet pruhů jiný než OSM lanes | 70 |
| cyklostezka z OSM chybí | 35 |
| chodník z OSM leží ve vozovce profilu | 24 |
| široký chodník (> 9 m) | 16 |
| obousměrka jako jeden pruh a široká krajnice | 13 |
| ulice bez jízdního pruhu | 5 |
| koleje tramvaje bez tramvaje | 4 |
| cyklopruh na silnici (OSM) chybí | 4 |

- Kontrola širokých pruhů je teď podle pravidla (pruh nad strop o 1 m a víc, mimo zóny): žádný. Dřívějších 115 „pruhů
  nad 4,6 m“ jsou pruhy do metru nad stropem (krajnice by byla užší než 1 m), obousměrky pod 5 m a obytné zóny.
- Počet pruhů proti OSM: nejvíc (18) obousměrka s OSM lanes=2 jako jeden pruh 3,5–4,4 m a „krajnice“ 1,7–2,4 m z
  ortofota. Ve Street View (Hroboňova) bez parkujících aut, s trolejemi: krajnice je druhý pruh, ortofoto vzalo
  středovou čáru za vodicí. Dále ulice ze dvou vozovek s méně (16) i více (11) pruhy než OSM.

## A/B jen na relevantních řezech (Bára 16. 11. 2026: „stačí jen ty, co jsou relevantní“)
Od opravy 4: B se počítá jen na řezech, kterých se oprava podle běhu A může týkat (cíl), a na 100 náhodných ostatních
(kontrola, aby se nic jiného nezměnilo). Pár minut místo půl hodiny.

## Oprava 4: středová čára vzatá za vodicí (A/B, 16. 11. 2026)
Obousměrka, které OSM dává lanes ≥ 2, s jedním pruhem a krajnicí od 1,5 m vedle něj: krajnice je druhý pruh (ortofoto
vzalo středovou čáru za vodicí; Hroboňova bez parkujících aut, s trolejemi). Pruh a krajnice (při dvou ta užší) jsou dva
stejné pruhy, užší krajnice z vodicích čar zůstávají. `derive.js` `splitTwoWayLane`, vypnutí `?off=stredcara`.

- Cíl 9 řezů, změnilo se 7: Jarabinková 3,93 + 2,37 → 2 × 3,15, Hroboňova → 2 × 3,1, Jantárová cesta → 2 × 2,85, Okružná
  → 2 × 3,05, Ferka Urbánka → 2 × 2,7, Práznovská cesta 2,27 | 3,9 | 3,43 → 3,09 + 3,08 a krajnice 3,43, a 1,37 | 3,5 | 1,53
  → 1,37 a 2 × 2,5. Kontrola 100 řezů: beze změny.
- První verze slučovala krajnice z obou stran (Práznovská 2 × 4,8 m), proto „jen užší“.

## Opravy 2–4 v Česku (A/B s dopočtem, 16. 11. 2026)
Vzorek 200 českých ulic (`STAT=cz node sample-streets.mjs`: Brno 60, Plzeň 40, Ostrava 40, Jihlava 25, Opava 15, Praha 20,
aby IPR dostalo málo dotazů). Jen jeden běh A s vypnutými kroky (`?off=dvapruhy,strop,stredcara`); B dopočteno z jeho
dílů a značek OSM (`check.js` `simulate`), skutečným během ověřeno jen 8 změněných řezů: shoda 8 z 8.

- Změnilo se 8 z 200. Obousměrky s jedním pruhem 5,3–5,8 m na dva (Bráfova v Brně, Nad Úslavou, Pod Vinicemi a
  Kartónová v Plzni), pruhy nad stropem s krajnicí (Pionýrská 5,28 → 4 + 1,28, Borská 5,55 → 4 + 1,55 a 5,35 → 4 + 1,35,
  Emila Škody 6,94 → 1,22 + 4,5 + 1,22). Středová čára (oprava 4) se v Česku na vzorku neuplatnila.

## Oprava 5: cyklostezka z OSM v odhadu z ortofota (A/B, 16. 11. 2026)
Cyklostezka, kterou OSM kreslí zvlášť (highway=cycleway, pěšina pro kola) za obrubou a před domem, dostane v odhadu
pás své šířky (OSM width, jinak 2,5 m obousměrná, 2 m jednosměrná) kolem své čáry, mezi čarami mapy města, nikdy přes
vozovku ani za dům: `ortho-osm.js`, vypnutí `?off=osmbike`. Dřív padla do „Neurčeno“ (13 z 35), zeleně nebo plochy.

- Regrese odhadu proti MTVU Prahy a Brna beze změny.
- Cíl 35 řezů (cyklostezka z OSM chybí), kontrola 100: cyklostezku má nově 24 cílů (Ružinovská, Trieda SNP, Južná trieda,
  Starohájska, Trieda Andreja Hlinku…; obousměrná jako dvě poloviny podle směru). Z kontroly se změnily 3: dvě jen
  opravou 4 (běh A byl před ní) a Pri prachárni s další skutečnou cyklostezkou.
- Zbylých 11 cílů: hlavně řezy s pasportem města (doplnění za pasportem `besidePassport` cyklostezky zatím nebere).

## Oprava 6: chodník mezi čarami mapy města nejvýš 6 m (A/B, 16. 11. 2026)
V odhadu se kus mezi čarami mapy města (Bratislava) bral jako chodník bez ohledu na šířku (9–18 m). Teď jako u úseku od
obruby k domu: kus u obruby dá chodník nejvýš 6 m a zbytek je jiná plocha (zeleň, zpevněná plocha podle snímku), další
široké kusy celé jako zbytek. `ortho-osm.js`, vypnutí `?off=pieceMax`.

- Kontrola „chodník > 9 m“ ukázala zvlášť náměstí z pasportu (Kollárovo, Námestie Ľudovíta Štúra, Hlavná): tam široký
  pěší prostor je, beze změny.
- Regrese Prahy a Brna beze změny. Cíl 8 odhadnutých chodníků nad 9 m, kontrola 50 (šetření): změnilo se 6 cílů
  (Junácka 12,15 → plocha 6,4 + chodník 5,75; Pobrežná 13,09 → 7,09 + 6; Dukelských hrdinov 16,35 → 6 + 6,15 + 4,2),
  kontrola beze změny.

## Oprava 7: výpadek ortofota a map se řekne (Bára 16. 11. 2026: „ano“)
Dřív `laneImage` každou chybu spolkl (`catch { return null }`) a odpověď 5xx brala jako prázdný obrázek: profil potichu
vyšel jen z OSM (v jednom běhu 39 řezů v Košicích). Teď je výpadek (5xx, síť, časový limit) chyba, `app.js` ji řekne:
„Ortofoto teď neodpovědělo: obruby jsou jen podle OSM, profil je hrubý odhad. Zkuste kliknout znovu za chvíli.“ Výpadek
mapy města a ZBGIS na Slovensku se hlásí jako „Chybí data mapy města a ZBGIS (server neodpověděl)“, ne kolejí a plotů.
Ověřeno v aplikaci s nasimulovanou odpovědí 503 (Andreja Plávku) a hned potom bez ní.

## Rozhodnutí podle testů (Bára 16. 11. 2026: „1, 2 rozhodni na základě testů“)
- **Krajnice nad 3 m (41 řezů) zůstávají krajnicí.** Test, který by ukázal, co v nich je, nemáme: MTVU v Česku krajnici
  od zpevněné plochy uvnitř vozovky neodlišuje a Street View šlo použít jen na Hroboňovou (ta ukázala, že domněnka
  „parkující auta“ neplatí). Krajnice je označená jako odhad, „zpevněná plocha“ by tvrdila víc, než víme.
- **Rozdělení vícepruhové vozovky podle OSM lanes zatím ne.** Na Slovensku by se počet pruhů porovnával s OSM, tedy s tím,
  co by oprava jen opsala (test v kruhu), a OSM lanes u křižovatek počítá i odbočovací pruhy. Nezávislý test jsou ručně
  označené pruhy v Česku (`evaluation/orthophoto/label-eval.mjs`, 117 vozovek): až tam ukáže zlepšení.
- Regrese Prahy a Brna po celé sérii (opravy 1–7) beze změny, testy 233/233.
- Street View 4 krajnic nad 3 m (16. 11. 2026, po zprovoznění): Pribinova široký neznačený asfalt, Einsteinova pás za
  vodicí čarou, Riazanská **podélně parkující auta** po obou stranách, Vlčie hrdlo nejasné (křižovatka). Smíšené, krajnice
  zůstává; parkující auta v krajnici jsou námět na další bod (odhad stání na Slovensku je vypnutý záměrně).

## Oprava 8: cyklostezka z OSM přes odhadnutý díl (A/B dopočtem, 16. 11. 2026)
Zbylých 11 chybějících cyklostezek leželo v dílech, které profil jen odhadl (plocha za pasportem, krajnice, Neurčeno,
zeleň). Závěrečný krok v `app.js` (`derive.js` `carveCycleways`, cesty OSM přes řez `crossFromA`): pás šířky cyklostezky
(OSM width, jinak 2,5 m, jednosměrná 2 m) se vyřízne kolem její čáry, zbytky pod 0,3 m k ní; ne z pruhu, chodníku ani
stromořadí a ne do 2 m od jiného dílu pro kola. Vypnutí `?off=rezkolo`.

- A/B dopočtem z běhu U-4 (135 řezů, bez dotazů na služby): změnilo se 9, všechno cílové (Pod Párovcami krajnice 4,15 →
  1,65 + cyklostezka 2,5; Kežmarská, Wolkerova, Košická, Vysokoškolákov, Dunajská, Most Apollo, Štefánikova, Jána
  Hajdóczyho), kontrola beze změny. Skutečným během ověřeny Pod Párovcami a Wolkerova: shoda.
- Nezměněné: Pribinova (cyklostezka z OSM v jízdním pruhu) a Trenčianska (ve stromořadí), schválně.

## Oprava 9 a 10: vozovka jen z krajnic, koleje v odhadnutém dílu (A/B dopočtem, 16. 11. 2026)
- **Vozovka jen z krajnic** (`lanesFromShoulders`, `?off=bezpruhu`): ortofoto rozdělilo vozovku středovou čarou na dvě
  „krajnice“ a pruh žádný (5 ulic bez pruhu). Když profil nemá žádný pruh, souvislé krajnice jsou vozovka: do 5 m jeden
  pruh, obousměrka od 5 m dva, jednosměrka OSM lanes, jinak pruhy kolem 3,5 m (každý aspoň 2,5 m). Běží před ostatními
  kroky pruhů. Pluhová 1,67 + 2,43 → pruh 4,1; Kamenná → 3,8; Snežienková → 2,8; Topoľčianska (OSM lanes=1) → pruh 4 a
  krajnice.
- **Koleje z OSM v odhadnutém dílu** (`carveTramTracks`, `?off=rezkoleje`): koleje padly do odhadnutého dělicího pásu,
  „Neurčeno“, zeleně nebo plochy (ne do dílu z mapy města). Pás 3,3 m na kolej kolem nich; kolej zakreslená dvakrát
  (0,1 m od sebe) je jedna. Vajanského nábrežie dělicí pás 3,5 → tramvaj, Botanická dvě koleje v 13,7 m Neurčeno,
  Staničné námestie, Radlinského a Špitálska druhá kolej.
- A/B dopočtem nad celým během U-1 (995 ulic, bez dotazů na služby): změnilo se 10, všechno ty cílové. Skutečným během
  ověřeny Pluhová a Botanická: shoda.
- Zbývá: cyklopruhy zadané jako značka silnice (cycleway:right=track, cycleway=lane; 4 ulice), protože v uloženém běhu
  není strana cesty.
- **Česko** (opravy 8–10 dopočtem nad během CZ-A, 200 ulic): jediná změna byla cyklostezka vyříznutá ze zeleně, kterou
  změřila technická mapa Ostravy (Na Jízdárně). Změřenou zeleň (`dtm`, `pasport`) proto `carveCycleways` neřeže, změřenou
  zpevněnou plochu ano (Wolkerova). Potom v Česku beze změny, na Slovensku stejných 9 cílů.

## Zkoušeno a vráceno: cyklostezka ze značek silnice (16. 11. 2026)
`cycleway:right=track` apod. jako pás 2 m hned za obrubou v odhadu z ortofota (`ortho-osm.js`). A/B na 3 cílech
(Riazanská, 2× Vajanského nábrežie) a 50 kontrolách: cíle beze změny, protože mají pasport Bratislavy a odhad se u nich
nepoužije. Bez prokázaného přínosu vráceno. Pomohlo by až v doplnění za pasportem (`besidePassport`), na 3 ulicích.
- Rozdělení vícepruhové vozovky podle OSM: v Česku pravidla počet pruhů z OSM už berou, snížit ho může jen čtení z
  ortofota vyladěné na ručních značkách (lépe 32, hůř 9); na Slovensku by se jen opsalo OSM. Nedělá se.
