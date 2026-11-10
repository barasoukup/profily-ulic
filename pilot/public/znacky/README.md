# Dopravní značky pro řadu pod profilem

Ikony svislých a vodorovných dopravních značek podle vyhlášky č. 294/2015 Sb. (ve znění vyhlášek 84/2016,
386/2023 a 205/2025 Sb.), zjednodušené pro velikost asi 40 px. Každá značka je jeden SVG soubor do 4 kB bez
metadat. Kulaté značky mají `viewBox 0 0 100 100`, obdélníkové 100 × 140, 150 × 100 a podobně (poměr stran
podle vzoru). Vodorovné značky jsou bílé značení na tmavém čtverci asfaltu (u stání je vpravo šedá obruba).

## Licence

- **Vzory značek** jsou přílohou vyhlášky 294/2015 Sb., tedy součástí právního předpisu. Podle § 3 písm. a)
  autorského zákona (121/2000 Sb.) jde o úřední dílo, které autorským zákonem chráněno není. Použití je volné.
- **Dvojice chodců (dospělý s dítětem)** na C 9a, C 10a a IZ 6a je převzatá (přepočtené a zaokrouhlené
  souřadnice) ze souboru Commons `CZ road sign C09a.svg` (CC0, autor Commons Kys5g), který odpovídá vzoru
  C 9a ve znění vyhlášky 205/2025 Sb.: https://commons.wikimedia.org/wiki/File:CZ_road_sign_C09a.svg
- **Piktogramy jízdního kola, chodce, osobního auta a motocyklu** jsou převzaté (zaokrouhlené a přepočtené
  souřadnice) ze souborů Wikimedia Commons B 8, B 30 a B 11, které jsou označené jako volné dílo
  (`{{PD-sign}}`, autor Commons „มองโกเลีย๔๔“):
  - https://commons.wikimedia.org/wiki/File:CZ_road_sign_B-8.svg
  - https://commons.wikimedia.org/wiki/File:CZ_road_sign_B-30.svg
  - https://commons.wikimedia.org/wiki/File:CZ_road_sign_B-11.svg
- **Vše ostatní** (rámy, písmeno P, číslice B 20a, šipky, autobus, auto z boku, vozík O 1, parkovací automat,
  postavy a domek IZ 5a, dálnice, vodorovné značení) je nakresleno nově podle vzorů vyhlášky. Kresby patří k projektu pod licencí MIT
  (© Bára Soukupová), stejně jako kód.
- Při kreslení sloužily jako vizuální předloha náhledy z Commons. Volná díla (PD): `IP11bcr.jpg`, `IP11ccr.jpg`,
  `IP12cr.jpg`, `IP13ccr.jpg`, `CZ-IP12 Vyhrazené parkoviště (vozík).jpg`, `CZ road sign IP-4b.svg`,
  `CZ-IZ 9a Zóna pro cyklisty (2016).jpg`, `CZ-E12 Text.jpg`, `CZ-E12a …(2016 - verze 2015-07-31).jpg`,
  `CZ-E12b …(2016 - verze 2015-07-31).jpg`, `CZ-E12c Povolený směr jízdy cyklistů.jpg`, `CZ-V09a Směrové šipky.jpg`,
  `CZ-V10b Stání kolmé.jpg`, `CZ-V11a …(2016 - verze 2015-07-31).jpg`, `CZ-V13a Šikmé rovnoběžné čáry.jpg`,
  `CZ-V14 Jízdní pruh pro cyklisty.jpg`, `CZ-V20 Piktogramový koridor pro cyklisty.jpg`,
  `CZ-B11 Zákaz vjezdu všech motorových vozidel.jpg`. Pod CC BY-SA 3.0 (jen předloha, nic se z nich nekopíruje):
  `IP20a.svg`, `IP25a.svg`, `IP25a - zóna.svg`, `IP26a.svg`, `IP27a.svg`, `CZ traffic sign IZ1a.svg`,
  `CZ traffic sign IZ2a.svg`. Pozor: některé soubory českých značek na Commons nesou CC BY / CC BY-SA
  (např. C 8a, IP 20a, IP 26a), přestože vzor sám je volný; proto se tu nepoužívají.

Vzor: vyhláška č. 294/2015 Sb., https://www.e-sbirka.cz/sb/2015/294 (přílohy 3 až 11). Obrázky úplného znění
(i se změnami 386/2023 a 205/2025 Sb.) byly porovnány s vyobrazeními v příloze na
https://www.zakonyprolidi.cz/cs/2015-294 a https://www.zakonyprolidi.cz/cs/2025-205 (listopad 2026). Přehled značek a jejich
přečíslování: https://cs.wikipedia.org/wiki/Seznam_dopravn%C3%ADch_zna%C4%8Dek_v_%C4%8Cesku

## Šablony (pro kód)

- `B20a-5.svg`, `-10`, `-20` … `-90`, `-100`, `-110`, `-120`, `-130`: číslice nakreslené jako křivky (DIN 1451
  Mittelschrift podle vzoru B 20a 80, výška 45 % průměru, tah 6,7), vypadají stejně v každém prohlížeči a mají
  přednost. Trojmístná čísla mají číslice zúžené do bílého pole (výška 40, šířka 60, tah zachovaný jako u
  dvojmístných), čísla s jedničkou jsou vystředěná podle kresby, ne podle buněk písma. Tím jsou pokryté všechny
  v ČR obvyklé hodnoty (5, 10 až 130 po desítkách). `signs.js` zatím bere jen 20 až 80; seznam v něm stačí
  rozšířit o 5, 10, 90, 100, 110, 120, 130.
- `B20a.svg`: šablona pro ostatní hodnoty (15, 25, 45 …): číslo v `<text id="v">` (výchozí 50). Písmo je úzké
  obyčejné (DIN 1451 Mittelschrift, jinak Arial Narrow / Liberation Sans Narrow / Roboto Condensed, ne tučné),
  ztučněné tenkým obrysem na tah kreslených číslic a roztažené na jejich výšku. `textLength="57"` s
  `lengthAdjust="spacingAndGlyphs"` drží každé číslo na šířce kreslené dvojmístné značky, takže i trojmístné
  číslo se vejde do bílého pole (zúží se). Jednomístné by se roztáhlo, proto je 5 nakreslená. Kód nahradí obsah
  před převodem na data URI, např. `text.replace(/(<text id="v"[^>]*>)[^<]*/, "$1" + kmh)`.
- `IP12.svg`, `IP12-ztp.svg`: text v `<text id="t">` (výchozí RÉSERVÉ).
- `IZ6a.svg`: text výjimky (např. „ZÁSOBOVÁNÍ 6–10 h“) v `<text id="t">`, výchozí prázdný.
- `IZ6a-kola.svg`: v dodatkové části symbol jízdního kola (vjezd cyklistů povolen), pod ním malý `<text id="t">`
  (výchozí prázdný, např. „POVOLEN“ nebo doba).
- `IZ8a.svg`: prázdná skupina `<g id="z">`, do které se vloží obsah libovolné kulaté značky (souřadnice 100 × 100).
- `E13.svg`: text v `<text id="t">` (výchozí TEXT).
- Písmo: `DIN 1451 Mittelschrift`, náhradou `DIN Alternate` / `Arial Narrow` / `Arial`.

## Soubory

| Soubor | Číslo | Oficiální název | Zdroj | Licence |
|---|---|---|---|---|
| `B1.svg` | B 1 | Zákaz vjezdu všech vozidel v obou směrech | vzor vyhlášky | úřední dílo / MIT |
| `B2.svg` | B 2 | Zákaz vjezdu všech vozidel | vzor vyhlášky | úřední dílo / MIT |
| `B8.svg` | B 8 | Zákaz vjezdu jízdních kol | Commons CZ_road_sign_B-8.svg | PD |
| `B11.svg` | B 11 | Zákaz vjezdu všech motorových vozidel | Commons CZ_road_sign_B-11.svg | PD |
| `B20a.svg` (šablona), `B20a-5.svg`, `B20a-10.svg` … `B20a-130.svg` (5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130) | B 20a | Nejvyšší dovolená rychlost | vzor vyhlášky | úřední dílo / MIT |
| `B28.svg` | B 28 | Zákaz zastavení | vzor vyhlášky | úřední dílo / MIT |
| `B29.svg` | B 29 | Zákaz stání | vzor vyhlášky | úřední dílo / MIT |
| `B30.svg` | B 30 | Zákaz vstupu chodců | Commons CZ_road_sign_B-30.svg | PD |
| `C8a.svg` | C 8a | Stezka pro cyklisty | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |
| `C9a.svg` | C 9a | Stezka pro chodce a cyklisty společná (dospělý s dítětem nahoře, kolo dole, bez čáry; vzor 2025) | vzor vyhlášky, dvojice z C09a (CC0), kolo z B 8 | úřední dílo / CC0 / PD |
| `C10a.svg` | C 10a | Stezka pro chodce a cyklisty dělená (chodci vlevo, zrcadlově ke vzoru) | jako C 9a | úřední dílo / CC0 / PD |
| `C10a-chodci-vpravo.svg` | C 10a | Stezka pro chodce a cyklisty dělená (kolo vlevo, chodci vpravo, jako ve vzoru 2025) | jako C 9a | úřední dílo / CC0 / PD |
| `IP4b.svg` | IP 4b | Jednosměrný provoz | vzor vyhlášky | úřední dílo / MIT |
| `IP4c.svg` | IP 4c | Jednosměrný provoz s povoleným provozem cyklistů v protisměru (od 1. 7. 2025) | vzor vyhlášky 205/2025 Sb., kolo z B 8 | úřední dílo / PD |
| `IP11a.svg` | IP 11a | Parkoviště | vzor vyhlášky | úřední dílo / MIT |
| `IP11b.svg` | IP 11b | Parkoviště (kolmé nebo šikmé stání), auto z boku vodorovně = kolmé stání | vzor vyhlášky | úřední dílo / MIT |
| `IP11b-sikme.svg` | IP 11b | Parkoviště, šikmé stání: auto z boku natočené o 30° | vzor vyhlášky, poloha symbolu podle textu přílohy | úřední dílo / MIT |
| `IP11c.svg` | IP 11c | Parkoviště (podélné stání), auto zepředu | vzor vyhlášky, auto z B 11 | úřední dílo / PD |
| `IP12.svg` | IP 12 | Vyhrazené parkoviště (šablona textu) | vzor vyhlášky | úřední dílo / MIT |
| `IP12-ztp.svg` | IP 12 | Vyhrazené parkoviště se symbolem osoby na vozíku | vzor vyhlášky | úřední dílo / MIT |
| `IP13c.svg` | IP 13c | Parkoviště s parkovacím automatem (automat podle vzoru 2025) | vzor vyhlášky 205/2025 Sb. | úřední dílo / MIT |
| `IP20a.svg` | IP 20a | Vyhrazený jízdní pruh (BUS vlevo, jako ve vzoru) | vzor vyhlášky | úřední dílo / MIT |
| `IP20a-vpravo.svg` | IP 20a | Vyhrazený jízdní pruh (BUS vpravo) | vzor vyhlášky | úřední dílo / MIT |
| `IP20a-symbol.svg` | IP 20a | Jen kruhový symbol (modré pole s autobusem) pro kreslení pod pruh | vzor vyhlášky 205/2025 Sb. | úřední dílo / MIT |
| `IZ1a.svg` | IZ 1a (dříve IP 14a) | Dálnice | vzor vyhlášky | úřední dílo / MIT |
| `IZ2a.svg` | IZ 2a (dříve IP 15a) | Silnice pro motorová vozidla | vzor vyhlášky, auto z B 11 | úřední dílo / PD |
| `IZ5a.svg` | IZ 5a (dříve IP 26a) | Obytná zóna (poměr stran 132 × 100 jako ve vzoru) | vzor vyhlášky, auto z B 11, postavy a domek vlastní kresba | úřední dílo / PD / MIT |
| `IZ6a.svg` | IZ 6a (dříve IP 27a) | Pěší zóna (šablona textu výjimky) | vzor vyhlášky, dvojice z C09a | úřední dílo / CC0 |
| `IZ6a-kola.svg` | IZ 6a | Pěší zóna, v dodatkové části jízdní kolo | vzor vyhlášky, dvojice z C09a, kolo z B 8 | úřední dílo / CC0 / PD |
| `IZ8a.svg` | IZ 8a (dříve IP 25a) | Zóna s dopravním omezením (šablona) | vzor vyhlášky (čtvercová varianta) | úřední dílo / MIT |
| `IZ8a-30.svg` | IZ 8a | Zóna s dopravním omezením, B 20a 30 („zóna 30“) | vzor vyhlášky | úřední dílo / MIT |
| `IZ8a-zakaz-stani.svg` | IZ 8a | Zóna s dopravním omezením, B 29 (zóna zákazu stání) | vzor vyhlášky | úřední dílo / MIT |
| `IZ8a-zakaz-zastaveni.svg` | IZ 8a | Zóna s dopravním omezením, B 28 | vzor vyhlášky | úřední dílo / MIT |
| `IZ8a-placene-stani.svg` | IZ 8a | Zóna s dopravním omezením se symbolem IP 13c (placené stání) | vzor vyhlášky | úřední dílo / MIT |
| `IZ9a.svg` | IZ 9a | Zóna pro cyklisty („CYKLOZÓNA“, od vyhlášky 84/2016 Sb.) | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |
| `O1.svg` | O 1 | Symbol osoby na vozíku (označení vozidla ZTP, symbol z IP 12 a V 10f) | vlastní kresba mezinárodního symbolu | MIT |
| `E12a.svg` | E 12a | Jízda cyklistů v protisměru (pod IP 4a/IP 4b) | vzor vyhlášky (podoba od 2016) | úřední dílo / PD |
| `E12b.svg` | E 12b | Vjezd cyklistů v protisměru povolen (pod B 2) | vzor vyhlášky | úřední dílo / PD |
| `E12c.svg` | E 12c | Povolený směr jízdy cyklistů (příklad rovně a vpravo) | vzor vyhlášky | úřední dílo / PD |
| `E13.svg` | E 13 | Text nebo symbol (šablona) | vzor vyhlášky | úřední dílo / MIT |
| `V9a-rovne.svg`, `V9a-vlevo.svg`, `V9a-vpravo.svg`, `V9a-rovne-vlevo.svg`, `V9a-rovne-vpravo.svg`, `V9a-vlevo-vpravo.svg` | V 9a | Směrové šipky | vzor vyhlášky | úřední dílo / MIT |
| `V10a.svg` | V 10a | Stání podélné | vzor vyhlášky | úřední dílo / MIT |
| `V10b.svg` | V 10b | Stání kolmé | vzor vyhlášky | úřední dílo / MIT |
| `V10c.svg` | V 10c | Stání šikmé | vzor vyhlášky | úřední dílo / MIT |
| `V11a.svg` | V 11a | Zastávka autobusu nebo trolejbusu (klikatá čára s BUS) | vzor vyhlášky | úřední dílo / MIT |
| `V13.svg` | V 13 | Šikmé rovnoběžné čáry (šrafy) | vzor vyhlášky | úřední dílo / MIT |
| `V14.svg` | V 14 | Jízdní pruh pro cyklisty (symbol kola se šipkou) | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |
| `V14-souvisla.svg` | V 14 + V 1a | Vyhrazený jízdní pruh pro cyklisty se souvislou čarou, červený povrch | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |
| `V14-prerusovana.svg` | V 14 + V 2b | Jízdní pruh pro cyklisty s přerušovanou čarou (ochranný pruh), šedý asfalt | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |
| `V15-bus.svg` | V 15 | Nápis na vozovce „BUS“ (vyhrazený pruh) | vzor vyhlášky | úřední dílo / MIT |
| `V15-tram.svg` | V 15 | Nápis na vozovce „TRAM“ | vzor vyhlášky | úřední dílo / MIT |
| `V20.svg` | V 20 | Piktogramový koridor pro cyklisty | vzor vyhlášky, kolo z B 8 | úřední dílo / PD |

## Poznámky k číslům

- **IP 4c Jednosměrný provoz s povoleným provozem cyklistů v protisměru** je nová značka vyhlášky 205/2025 Sb.
  (účinnost 1. 7. 2025; vložena za IP 4b): modré pole, vlevo nahoře kolo a pod ním šipka dolů, vpravo velká
  šipka nahoru. Dosud se to značilo IP 4a/IP 4b s dodatkovou tabulkou E 12a; značky
  neodpovídající novele smějí podle přechodného ustanovení zůstat do 30. 6. 2035.
- **Šikmé stání na IP 11**: vlastní značka není. Platí IP 11b „Parkoviště – kolmé nebo šikmé stání“ (na chodníku
  IP 11d); příloha říká, že „poloha vozidla při kolmém nebo šikmém stání musí odpovídat poloze vyjádřené
  symbolem“. Vzor ukazuje auto z boku vodorovně (kolmé stání), pro šikmé se symbol auta natočí do směru stání
  (`IP11b-sikme.svg`, 30°). Podélné stání je IP 11c (auto zepředu), na vozovce V 10a/b/c. IP 12 a IP 13c se
  podle novely 205/2025 Sb. značí „obdobně jako na značkách Parkoviště“.
- Vyhláška 205/2025 Sb. změnila mimo jiné vyobrazení C 7a až C 10a (dospělý s dítětem; na C 9a bez dělicí čáry,
  chodci nahoře, kolo dole), IP 12, IP 13c (nový parkovací automat) a IP 20a. Podle nich jsou tu překreslené C 9a, C 10a, IP 13c a dvojice
  chodců na IZ 6a; IP 12 a IP 20a se nepřekreslovaly.
- **V 14 a barva povrchu**: vyhrazený jízdní pruh pro cyklisty (souvislá čára V 1a) je tu na červeném povrchu,
  ochranný pruh (přerušovaná V 2b) na šedém asfaltu. Barevný povrch vyhláška nepředepisuje, jde o zvyk měst.
- Vyhláška 294/2015 Sb. přečíslovala zónové značky: IP 14a → IZ 1a, IP 15a → IZ 2a, IP 25a → IZ 8a,
  IP 26a → IZ 5a, IP 27a → IZ 6a. Staré podoby platily jen do 31. 12. 2025, soubory proto nesou nová čísla.
- Cyklistická zóna je **IZ 9a Zóna pro cyklisty** (vyhláška 84/2016 Sb.), ne „IP 37a“.
- „Cyklisté v protisměru“ je **E 12a** (pod IP 4) a **E 12b** (pod B 2); **E 12c** je Povolený směr jízdy cyklistů.
- Způsob stání na svislé značce: **IP 11b** (kolmé nebo šikmé, auto z boku) a **IP 11c** (podélné, auto zepředu);
  na vozovce **V 10a/b/c**. E 2 je tvar křižovatky, ke stání nepatří.
- **V 13** jsou šikmé rovnoběžné čáry (šrafy), ne značení tramvajového pruhu; pro pruh tramvaje se užívá nápis
  V 15 („TRAM“), zastávka tramvaje je V 11b. Vyhrazený pruh BUS je V 1a/V 2b s nápisem V 15 „BUS“.
- O 1 není v příloze vyhlášky 294/2015 Sb. jako samostatná značka; soubor je symbol osoby na vozíku, jak se užívá
  na IP 12 a V 10f a na parkovacím průkazu ZTP.
- Zóna placeného stání nemá vlastní značku. `IZ8a-placene-stani.svg` je IZ 8a se symbolem IP 13c; pražské zóny
  mají ve spodní části ještě text o oprávnění (vyhrazeno pro rezidenty apod.).
