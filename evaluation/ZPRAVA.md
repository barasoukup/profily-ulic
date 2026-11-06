# Pilot profilů ulic: kontrola 100 náhodných řezů

6. 11. 2026 · verze pilotu z 10:30 (kopie v `evaluation/snapshot/`)

## Shrnutí

Ze 100 náhodných řezů po celé Praze:

- **51 sedí**: skladba i šířky odpovídají ortofotu, nanejvýš drobnosti.
- **32 sedí částečně**: pořadí částí je správně, ale šířky nebo detail ne (typicky příliš široké pruhy, chybějící stání nebo useknutá druhá strana ulice).
- **17 je špatně**: profil zásadně neodpovídá skutečnosti.

| Typ ulice | sedí | částečně | špatně |
|---|---|---|---|
| trunk (6) | 1 | 3 | 2 |
| primary (14) | 5 | 4 | 5 |
| secondary (14) | 5 | 6 | 3 |
| tertiary (16) | 9 | 5 | 2 |
| unclassified (6) | 5 | 0 | 1 |
| residential (28) | 16 | 10 | 2 |
| living_street (8) | 3 | 4 | 1 |
| pedestrian (4) | 3 | 0 | 1 |
| service (4) | 4 | 0 | 0 |

Pilot je nejslabší na velkých silnicích (trunk/primary: jen 6 ze 20 sedí) a nejsilnější na klidných a vedlejších ulicích. Na velkých silnicích se ukazují tři mezery najednou: vozovka se dělí na pruhy rovnoměrně, dosah se měří od osy jedné vozovky a chybí střední dělicí pásy. Silné stránky: tramvaje (osy kolejí z technické mapy), TSK úseky stání včetně kolmého, cyklopruhy a BUS pruhy z OSM, nástupiště, stromořadí z OSM, nábřeží a voda.

## Jak se testovalo

- **Vzorek** (`evaluation/sample.mjs`, seed 20261106): úseky ulic z lokálního OSM výřezu uvnitř hranice Prahy, rozdělené podle typu (kvóty v tabulce výše), vážené délkou, aspoň 300 m od sebe a 15 m od konců úseků. Pojmenované ulice, u service jen pojmenované a `service=alley`, bez tunelů.
- **Profil** (`evaluation/run.mjs`): stejný postup jako klik v aplikaci (`cutAt`): přichycení k nejbližší ulici, dosah 22 m, data z API běžícího pilotu (MTVU, linie, TSK, podlažnost).
- **Kontrola**: mimovegetační ortofoto IPR 2025 (5 cm/px) natočené tak, aby profil šel zleva doprava, s vyznačenými hranicemi částí (`evaluation/render.mjs` → `evaluation/data/html/<n>.html`). Každý řez jsem prošla ručně; poznámky ke každému čísle jsou v `evaluation/data/review.md`, verdikty v `evaluation/data/verdikty.json`.
- Kód pilotu jsem neměnila. Kopie `derive.js` v `evaluation/snapshot/` má navíc jen pole `extent` pro kreslení řezu.

## Mezery podle dopadu

### 1. Vozovka se dělí na stejně široké pruhy (~25 řezů)

Celá plocha 701 se rozdělí rovnoměrně podle počtu pruhů. Krajnice, odstavné pruhy, šrafované plochy, připojovací pruhy ramp, zastávkové zálivy a rozšíření u křižovatek se tak schovají do pruhů po 4,5–8 m. Příklady: č. 1, 2, 3, 6, 7, 12, 16, 24, 35 (jediný pruh 7,85 m), 50 (7,0 m), 52 (2× 8,35 m), 69 (2× 7,0 m).
Návrh: strop šířky pruhu (např. 3,5 m na silnicích, 3,75 m na trunk) a zbytek dát jako krajnici / šrafy u okraje, viditelně jako „odhad". Veřejnou vrstvu vodorovného značení jsem u IPR ani TSK nenašla (prošla jsem `dtmp` a `dop` na gs-pub).

### 2. Parkování, které není v TSK ani OSM, zmizí v pruzích (~10 řezů)

Mimo zóny placeného stání auta běžně stojí podélně u obrub, ale pilot o tom neví, takže jednosměrka má jeden pruh 6–7 m. Příklady: č. 34, 48, 65, 70, 72, 74, 77, 79, 82, 86.
Návrh: vozovka jednosměrky širší než ~5,5 m (obousměrky ~8 m) bez jiného vysvětlení → nabídnout podélné stání 2 m jako odhad (červený proužek), uživatel ho snadno smaže.

### 3. Směrově rozdělené ulice ztrácejí druhou polovinu (6 řezů)

Dosah 22 m se měří od osy přichycené jednosměrné vozovky, ne od středu ulice, takže vzdálený chodník a budova chybí (č. 20, 30, 49). Široký zelený střední pás (≥ 8 m) rozšiřování úplně zastaví a zůstane jen půlka ulice (č. 27). Na dálničních typech totéž (č. 3, 6).
Návrh: u dvojice protisměrných jednosměrek se stejným jménem měřit dosah od středu mezi nimi a zeleň mezi dvěma vozovkami nebrat jako okraj.

### 4. Střední dělení uvnitř jedné plochy 701 chybí (4 řezy)

MTVU kreslí obě vozovky i svodidlo mezi nimi jako jednu plochu, takže vznikne 6 pruhů přes 28–32 m (č. 4, 9). Kde koleje leží na štěrku mezi vozovkami a MTVU je má jako 701, kreslí se jako tramvaj v pruhu (č. 32). Svodidla už pilot čte z linií technické mapy, takže by mohla vozovku rozdělit.

### 5. Křižovatky a přechody

Řez skončil v křižovatce nebo na přechodu v č. 28, 29, 50, 69, aniž se ukázalo varování. Naopak varování „křižovatka?" se ukázalo na rovných úsecích č. 4 a 9, protože tam je vozovka širší než 25 m. Odsun 12 m od konce OSM úseku nestačí, protože OSM úseky často nekončí v křižovatce.
Návrh: posouvat řez od míst, kde se kříží dvě silniční osy, a od přechodů (`footway=crossing`), ne od konců úseku.

### 6. Obytné a pěší zóny nemají vlastní typ (5 řezů)

Obytná zóna se kreslí jako jeden nebo dva jízdní pruhy se šipkami (č. 85, 86, 89, 92). V Havlíčkově (č. 95, pěší zóna s tramvají a autobusem) se jízdní prostor změnil na „chodník" 6,2 m, protože plochu 701 kříží jen pěší osa.
Návrh: přidat typ „sdílený prostor" (Streetmix má „shared street") a u `highway=pedestrian` s `bus/psv=yes` nebo s kolejemi zachovat vozovku.

### 7. Chybějící nebo zastaralá data MTVU (5 řezů)

- Nová silnice, kterou MTVU nemá: celý řez je „plocha" 44 m (č. 37, kód 100 přes celý řez). Pilot přepne na odhad z OSM jen tehdy, když MTVU nevrátí nic.
- Díra v MTVU se kreslí jako neurčená část „?" 15 m (č. 41, č. 6).
- Ulice pod mostem: MTVU vrací horní plochu mostu, profil je jediná „plocha" (č. 10). Podobně za zábradlím estakády pokračuje terén pod ní (č. 18).
- Obslužná ulice kreslená v MTVU jako 702: celá ulice je chodník (č. 57).

### 8. Profil zabere i sousední komunikaci (2 řezy)

Další plocha 701 bez osy OSM dostane pruhy hlavní ulice (č. 21: dva pruhy po 6,2 m místo zeleně a stání). Řez zabere i souběžnou velkou silnici (č. 83, 13 částí ze dvou ulic).

### 9. Drobnosti

- Zbytky užší než ~0,5 m na okrajích (parkování 0,42 m, chodník 0,27 m, plochy 0,3 m: č. 15, 26, 30, 36). Řez useknutý dosahem nechá useknutý pás (parkování 1,35 m, č. 20). Návrh: konec dosahu přichytit k nejbližší hranici.
- Sousední části stejného typu se neslučují (5 chodníků vedle sebe, č. 95).
- Velké parkoviště vedle ulice se kreslí jako parkovací pruh 14 m (č. 14) nebo „přístupová cesta" 10–12 m (č. 47, 52). Lepší by bylo zakončit profil okrajem „parkoviště".
- Stromy, které jsou v ortofotu, v OSM chybějí, takže se kreslí jen zeleň (č. 8, 63). Pomohl by pasport stromů IPR (zatím neověřený).
- Tramvajový pás z plochy 705 se dělí v půlce plochy, ne podle os kolejí (5,23 + 4,48 m, č. 35).

## Chyby v kódu, které jdou opravit hned

1. **Cache ukládá chybové odpovědi IPR.** `cached()` v `server.mjs` zapíše i `{"error":{"code":503,"message":"Wait timeout…"}}`, takže se dané místo už nikdy nenačte (č. 22, nábřeží E. Beneše: MTVU 0 ploch, profil je čistý odhad). Ukládat jen odpovědi bez pole `error`. Stávající chybové soubory v `pilot/cache/*` je potřeba najít a smazat.
2. **`psv:lanes` / `bus:lanes`: každé `yes` se bere jako BUS pruh.** Strakonická č. 13 má `psv:lanes=yes|yes|designated` a pilot udělal tři autobusové pruhy, i když skutečný je jen pravý. Jako BUS má platit jen `designated`. V č. 11 jsou tři BUS pruhy místo jednoho, v č. 9 naopak BUS pruh chybí, i když `busway:right=lane` je na ose.
3. **Orientace TSK stání:** úsek 4,6 m hluboký s kolmo stojícími auty vyšel jako podélný (č. 64). Pravidlo podle délky na stání nejspíš dostává zkreslenou délku.
4. **Plocha parkování z OSM přes celou vozovku** smaže jízdní prostor (č. 87: 7,9 m „kolmé stání"). Plochu OSM parkování, která pokrývá skoro celou vozovku, by pilot neměl brát jako záliv.
5. **Fetch na IPR nemá timeout** (`server.mjs`): když IPR neodpovídá, požadavek visí, dokud ho nezruší síť. Během testu se jeden řez načítal přes 3 minuty.

## Co dál

Doporučené pořadí: nejdřív opravit chyby v kódu 1 a 2 (jsou malé), pak strop šířky pruhu s krajnicí a odhad stání (body 1 a 2, pokryjí asi třetinu všech nepřesných řezů), pak středy směrově rozdělených ulic (body 3 a 4).

Otázky na Báru:
- Má odhadnuté podélné stání (bod 2) přibývat automaticky jako „odhad", nebo ho nabízet jen jako návrh k odkliknutí?
- Mají obytné zóny dostat vlastní typ „sdílený prostor", nebo stačí jeden pruh bez šipek?
- Má se řez sám posouvat od křižovatek, nebo jen víc varovat?

Celé poznámky ke všem 100 řezům jsou v `evaluation/data/review.md`. Náhled každého řezu nad ortofotem otevřete jako `evaluation/data/html/<číslo>.html`.

## Po opravách (6. 11. 2026, druhé kolo)

Stejných 100 řezů jsem znovu spočítala s opraveným pilotem (`DERIVE=pilot node evaluation/run.mjs`, výsledky v `data/results2`, náhledy v `data/html2`, rozdíly v `data/diff.txt`). Změnilo se 63 profilů.

- Pruhy širší než 4,6 m: dřív ve 27 řezech, teď ve 3. Zbytek vozovky je ve 26 řezech nakreslený jako krajnice / šrafy (odhad).
- Odhadnuté podélné stání je ve 20 řezech (Jílovská, Kukelská, Hekrova, V Roháčích, Vodňanská, Dářská a další). Podezřelé jsou Generála Šišky a Mladoboleslavská, kde podle ortofota u obrub nikdo nestojí.
- Sdílený prostor pro obytné zóny jsem po domluvě vrátila (Streetmix ho nezná); obytné zóny dostávají jízdní pruh a odhad stání. Havlíčkova má zpátky tramvaj.
- Strakonická: BUS pruh je jen tam, kde opravdu je (č. 9, 11, 13).
- Nábřeží E. Beneše (č. 22) se po smazání chybné cache načte celé, s tramvají.
- Poděbradská, Bělohorská, Bělocerkevská a nábř. Kapitána Jaroše mají obě vozovky a oba chodníky.
- Střed ze svodidla se našel jen v Dobříšské. U Strakonické (č. 9) technická mapa svodidlo mezi vozovkami nemá.
- Ke Kolodějskému zámku (č. 37) přepne na odhad z OSM a napíše proč.
- Klik se odsunul od křižovatky nebo přechodu u 7 řezů.

Zbývá: Jižní spojka a další rampy (připojovací pruh se počítá jako další pruh), ulice pod mostem (záměrně neřešeno), K Panenkám (obslužná ulice kreslená v MTVU jako chodník).
