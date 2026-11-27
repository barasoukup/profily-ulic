# Nepřátelská recenze balíku Itálie (IT), 23. 11. 2026

Rozsah: `countries/IT.js`, `towns/italy.js`, `signs-IT/`, `evaluation/italy/`, části `lanes-ortho.js` („it“),
`tools/build_states.mjs`, `states.json`, `search-photon.js`, `credits.js`, `sources.js`, `index.html`, `tools/countries.mjs`,
`logging/worker.js`, `LICENCE-A-ZDROJE.md`, `app/README.md`, `tests/italy.test.js`. Větev `estonia`, HEAD `84140de`.
Žádný jiný soubor jsem neměnil, nic jsem necommitoval.

Co jsem ověřil:
- `npm test`: 353 testů, 0 chyb.
- **Licence ortofot v primárních katalozích** (User-Agent `profily-ulic-review`, po jednom dotazu, pauza 1 s):
  Bolzano 2023 (záznam GeoNetwork provincie), Torino 2023 (záznam GeoNetwork Piemontu), Bologna 2023 a Modena 2024
  (karty katalogu Regione Emilia-Romagna). Všechny čtyři výslovně CC BY 4.0. U Bolzana viz ale nález 2.
- Licence datových sad Bologni přes API portálu: `aree-stradali` i `c_a944ctc_edifici_pl` mají `license: CC BY 4.0`,
  vydavatel „Comune di Bologna – SIT“.
- Polygon `italy` ve `states.json`: 7 kruhů (Bolzano, Turín + 1 exkláva, Bologna, Modena + 2 exklávy). Řím, Milán, Bari,
  Vatikán ani San Marino v něm nejsou; kódy LAU `IT_001272`, `IT_037006`, `IT_036023` jsou Turín, Bologna, Modena.
- Pokrytí: 28 snímků WMS 80 × 80 m asi 300 m uvnitř hranice Turína (9), Bologni (11) a Modeny (8): všude skutečný snímek
  (10–25 kB), žádný prázdný. CORS u všech tří serverů pro `Origin: https://streetspace.eu` funguje.
- Živě jeden dotaz `in_bbox(geo_shape, lat, lon, lat, lon)` na `aree-stradali` (31 ploch, pořadí os v `towns/italy.js:27`
  je správně) a jeden `intersects(… POINT(lon lat))` na budovy (výška 21,5 m).
- **Normy proti textu vyhlášek** (PDF z mit.gov.it, text vytažený PDFKitem): D.M. 5. 11. 2001 body 3.4.2 (3,50 m pro
  kategorie 7–11), 3.4.6 (chodník 1,50 m, u stánků 2,00 m), 3.4.7 (2,00 / 4,80 / 5,00 m, stání 2,00 „eccezionalmente
  1,80“), kap. 1 a 3.5; D.M. 557/1999 čl. 4 odst. 5 a čl. 7 (1,50 / 1,25 + 1,25 / 1,00 / 0,50 m). Čísla v `limitsIT`
  s textem sedí, výhrady jsou v nálezech 3, 4 a 11.
- Vykreslení všech 37 SVG ze `signs-IT/` a porovnání obrázku s klíčem: obrázky odpovídají názvům (II.92/a dělená,
  II.92/b společná, II.58 auto v červeném kruhu, II.314 auto na modré, II.79/a zákaz stání s výjimkou).
- CSP: `servizigis.regione.emilia-romagna.it`, `geomap.reteunitaria.piemonte.it`, `geoservices.buergernetz.bz.it`
  v `img-src` i `connect-src`, `opendata.comune.bologna.it` a `photon.komoot.io` v `connect-src`.

Co jsem neověřil: tabulku 3.4.a (v PDF je obrázek, beru ji z `NORMS.md`), texty CdS čl. 157 a 158, D.M. 236/1989 a
D.P.R. 503/1996 v primárním znění, čísla obrázků Regolamenta kromě čl. 120 (II.74, II.75, II.76, II.79/a potvrzené v kopii
Bosetti & Gatti) a II.92/b (zmiňuje ho D.M. 557/1999); ostatní čísla jen proti názvům souborů na Commons. Chování
v prohlížeči, stavbu balíků `it_*` (na R2 zatím nejsou), skutečnost v ulicích u A/B.

Bez nálezu:
- San Marino a Vatikán nejsou v polygonu (ale viz nález 1: profil tam přesto vznikne).
- AGEA vrstvy Emilia-Romagna, Lazia, Toskánska nejsou v kódu ani v CSP.
- Pořadí os v dotazech na Bolognu, klíč cache (`toFixed(4)`), smazání neúspěšného dotazu z cache.
- Překlady nových textů jsou ve všech 24 jazycích (`tests/i18n.test.js` prošel); italština používá „D.M.“, ne „vyhláška“.
- Kredity `it-bo`, `it-mo`, `it-to`, `it-bz` jsou v `credits.js` i v patičce.

## Závažné

### 1. Mimo polygon `italy` aplikace Itálii dál pokrývá, jen jako „cizinu“ s českými pravidly (ověřeno z kódu)
- **Kde:** `tools/countries.mjs:56` (pět dílů Geofabriku = celá Itálie, 2,1 GB PBF), `app/public/osmpack.js:217–223`
  (balík se vybírá jen podle polohy dlaždice), `app/public/towns/abroad.js:1` („cizina“ = okraje výřezů OSM, profil
  z OSM), `app/public/search-photon.js:10` (`IT: [6.6, 35.4, 18.6, 47.1]`), `tests/italy.test.js:12`.
- **Co je špatně:** Bářino pravidlo zní „jen oblasti s otevřeným ortofotem“. Polygon to splňuje, ale balíky OSM ne. Po
  nasazení `it_no`, `it_ne`, `it_c`, `it_s`, `it_i` bude kliknutí v Římě, Miláně, Neapoli, **ve Vatikánu** (leží
  v `italy/centro`, `SOURCES.md` kap. 7) a v okrajích **San Marina** (kap. 6) dávat profil státu „cizina“: odhad z OSM,
  české normy (Manuál IPR), české značky, český odhad stání podle § 25. Dosud byla „cizina“ jen pruh za hranicí výřezu;
  teď to bude 300 000 km². Test „Vatikán a San Marino mimo“ ověřuje jen `cityAt(...) === "cizina"`, ne že tam profil
  nevznikne. Hledání navíc nabízí ulice z celé Itálie (filtr jen `countrycode: IT`), takže uživatele do nepokryté
  oblasti samo zavede.
- **Neověřeno:** nasazený stav; `data.streetspace.eu/osm/index.json` zatím žádný balík `it*` nemá.
- **Oprava:** balík `it` jen z pokrytých oblastí (`osmium extract` polygonem `italy` s okrajem asi 1 km; vejde se i na
  Pages) a tři zbytečné úlohy týdně odpadnou; výsledky Photonu filtrovat polygonem `italy` (`within`); do testu přidat,
  že index balíků Řím ani Vatikán nedrží. Před nasazením spustit workflow OSM ručně se `states: it` (jako u CH).

### 2. Bolzano 2023 není „vlastní nálet“, ale ortofoto ve spolupráci s AGEA; dokumentace tvrdí opak
- **Kde:** `evaluation/italy/SOURCES.md:36` a `:88` („z vlastních náletů … Bolzano 2023“, „Bez právní nejistoty (ne
  AGEA)“), `LICENCE-A-ZDROJE.md:98` („ortofota AGEA nepoužita“), `app/public/lanes-ortho.js:71–73`, `app/README.md:308–311`.
- **Důkaz:** metadata provincie, pole `lineage`: „la Ripartizione 28 ha, **in collaborazione AgEA, nell'ambito del Piano
  di monitoraggio**, realizzato un'ortofoto con un pixel di 20 cm per l'intero territorio provinciale“
  (https://geonetwork1.civis.bz.it/geonetwork/srv/api/records/p_bz:Orthoimagery:Aerial-2023-RGB). Tentýž záznam má
  v `useLimitation` i `otherConstraints` výslovně CC BY 4.0, vlastník „Provincia Autonoma di Bolzano“.
- **Co z toho plyne:** licence je formálně otevřená, takže pravidlo o licenci splněné je. Není ale pravda, že aplikace
  AGEA nepoužívá: je to tentýž tříletý nálet, který mají Toskánsko nebo Umbrie s „tutti i diritti riservati“. Bolzano je
  největší ze čtyř oblastí (7 400 km²) a stojí jen na tom, že provincie smí snímek AGEA dál licencovat.
- **Oprava:** rozhodnutí Báry (nechat s tím, že licenci dává vlastník záznamu, nebo se zeptat provincie:
  kartografie@provinz.bz.it); v každém případě opravit `SOURCES.md`, `LICENCE-A-ZDROJE.md`, komentář v `lanes-ortho.js`
  a README, aby netvrdily „ne AGEA“.

## Střední

### 3. Jízdní pruh: jedna hodnota 2,75 m pro všechny ulice, text slibuje „2,75–3 m“
- **Kde:** `app/public/countries/IT.js:19–22`, `:70` (`roadClassFromOsm: true`), `evaluation/italy/NORMS.md` A3 a D.
- **Co je špatně:** podle `NORMS.md` (tab. 3.4.a) má městská F 2,75 m, **E 3,00 m, D 3,25 m**. `limitsIT` třídu ulice
  nečte (`limits({ type: "pruh", roadClass: "B" }).zaklad` = 2,75), ač ji `roadClassFromOsm` z OSM počítá. Na
  `primary`/`secondary` se tedy pruh 2,8 m nevaruje. Bod 3.4.2 navíc říká, že pro pruhy s autobusy a nákladní dopravou
  (kategorie 7–11) tabulka neplatí a minimum je 3,50 m. Naopak kap. 1 a 3.5 vyhlášky ulice v obytných zónách
  („strade residenziali“) z tabulky vyjímají, a aplikace tam 2,75 m vyžaduje také.
- **Oprava:** podle skupiny z OSM (B → 3,0, A/trunk ve městě → 3,25, jinak 2,75), v obytné zóně `null`; nebo text
  zúžit na „místní ulice 2,75 m“. Estonské rozhodnutí o 2,75 m (commit `84140de`) se Itálie netýká.

### 4. Stezka pro chodce a cyklisty má limity chodníku; obousměrná cyklostezka se nevaruje
- **Kde:** `IT.js:13–16`.
- **Co je špatně:** `chodnik_kola` vrací 0,9 / 1,5 m s větou o chodníku. D.M. 557/1999 čl. 4 odst. 5 pro „percorsi
  promiscui pedonali e ciclabili“ žádá „larghezza adeguatamente incrementata rispetto ai minimi fissati per le piste
  ciclabili all'articolo 7“, tedy víc než 1,5 m (jednosměrná) či 2,5 m. Hodnota 1,5 m bez varování není ničím podložená
  a 0,9 m červeně je minimum pro pěší trasu, ne pro společnou stezku. `cyklostezka` má základ 1,5 m, i když je
  obousměrná (v OSM většina); čl. 7 odst. 1 pro dva pruhy dává 2,50 m jako „minimi inderogabili“ (odst. 3). Text to
  říká, číslo ne.
- **Oprava:** `chodnik_kola` bez červené, oranžově pod 2,5 m s citací čl. 4 odst. 5 (nebo `null` jako
  `stezka_sdilena`); u `cyklostezka` rozlišit `oneway` (1,5) a obousměrnou (2,5).

### 5. „3 m na směr“ vedle stání v zákoně není, a odhad stání podle zákona na tom stojí
- **Kde:** `IT.js:61–66` (`freeLane: 3`, `parkGuess: true`), `NORMS.md` B1 a otázka 3 („pro Báru“).
- **Co je špatně:** čl. 157 odst. 4 CdS dává 3 m jen pro stání u levého okraje jednosměrky. Pro obousměrku zákon číslo
  nemá (`NORMS.md` to přiznává: „Je to můj výklad, judikaturu jsem nehledala“). Odpověď Báry v repozitáři zapsaná není
  (u Estonska je v commitu, u Itálie ne). Pravidlo „žádné vymyšlené hodnoty“ tu splněné není.
- **Oprava:** zapsat Bářino rozhodnutí, nebo `parkGuess: false`, dokud není; pro jednosměrku lze 3 m nechat s citací.

### 6. Pěší zóna s cyklisty se v Itálii nenakreslí vůbec (ověřeno spuštěním)
- **Kde:** `IT.js:46`.
- **Co je špatně:** `signFile({ k: "ip27a", plate: "kola" })` vrací `null`, protože „kola“ není mezi povolenými
  tabulkami. Italská Area pedonale (II.320) přitom kola pouští sama (`NORMS.md` B3, CdS čl. 3 bod 2), tabulka není
  potřeba. Pěší zóny s `bicycle=yes` tak zůstanou bez značky.
- **Oprava:** `if (s.k === "ip27a") return "II-320";` před kontrolou tabulek; test.

### 7. Výpadek ortofota se v Itálii neohlásí
- **Kde:** `app/public/lanes-ortho.js:223–227` (`laneImageOf(key, opts).catch(() => null)`).
- **Co je špatně:** u Belgie a Portugalska se poslední chyba vyhodí (`lastError`), u Itálie se spolkne. Když WMS regionu
  neodpoví, profil je odhad jen z OSM a nikdo se to nedozví. Itálie má navíc v každé oblasti jediný zdroj, takže není
  kam ustoupit.
- **Oprava:** stejný vzor jako `pt`/`be` (prázdný snímek `null`, chyba ven).

### 8. Log zahodí polohu řezů v Bologni, Modeně i Turíně
- **Kde:** `logging/worker.js:48` (`num(e.lat, 45.5, 55.5)`, komentář „CZ, SK, AT, DE“).
- **Co je špatně:** Bologna 44,49°, Modena 44,65°, Turín 45,07° leží pod 45,5° s. š.; zůstane jen Bolzano. Stejná díra je
  u jihu Francie, Španělska, Portugalska, Kypru, Malty a Estonska (59°); u Itálie se týká tří oblastí ze čtyř.
- **Oprava:** meze z `countries/<ISO>.js bounds` (jako `validate.js inStates`); Worker musí nasadit Bára.

### 9. Testy netestují to, co má Itálie vlastního
- **Kde:** `tests/italy.test.js`.
- **Co chybí:** `surfaces` s `?bologna=1` (pořadí os `in_bbox`, stránkování, `itFailed` při chybě, výplň 702),
  `podlaznost` (filtr podloubí, nejvyšší z více budov), `itOrthoAt` pro Turín a Modenu, prázdný snímek mimo obec. Značky:
  jen že soubor existuje, ne klíče s tabulkou (proto prošel nález 6). „Vatikán a San Marino mimo“ viz nález 1.

## Drobné

### 10. Dvě exklávy Modeny jsou v polygonu, ale mimo obdélník ortofota
`states.json` má kruhy Modeny na 44,7286–44,7350 a 44,7372–44,7421° s. š., `IT_ORTHO["it-mo"].box` končí na 44,73
(`lanes-ortho.js:77`). `itOrthoAt` tam vrátí `[]`, ač WMS snímek má (ověřeno v 10,8935; 44,7395: 12 kB). Oprava: horní
mez 44,75.

### 11. Pruh BUS červeně pod 3,5 m z normy, která platí jen pro nové silnice
`IT.js:18`: `min: 3.5`. U chodníku je červené jen to, co platí všude (0,9 m), a 1,5 m z téže vyhlášky je oranžové; u BUS
je táž vyhláška červená. Sjednotit (`min: 0`, základ 3,5).

### 12. Popisky značek
- `b11` → „II.58 Zákaz vjezdu všech motorových vozidel“, ale II.58 motocykly nezakazuje (README to ví). Popisek
  neodpovídá značce.
- Jednosměrka proti směru s cyklisty: soubor `II-47-plus-II-4b`, popisek jen „II.47“ (`IT.js:50`; Francie píše
  „B1 + M9v2“).
- Podezření: `signFile` bere směr i ze `seg.dir`, `signLabel` jen z `x.dir`. `file({ k: "oneway" }, { dir: "backward" })`
  dá `II-47`, popisek „II.349 Jednosměrný provoz“. Zda taková značka bez `x.dir` vzniká, jsem neověřil (stejné ve FR).

### 13. Hranice obcí z GISCO 1 : 1 M
Podezření: zobecněná hranice LAU může o desítky až stovky metrů zabírat sousední obce (Casalecchio, San Lazzaro,
Moncalieri) nebo Trentino. Ortofoto Bologni je „jen území obce“ (za hranicí černé), takže tam vyjde italský profil bez
ortofota. Přesnější: hranice ISTAT (CC BY) nebo OSM jako u Monaka. U Polska totéž našla recenze u Zgorzelce.

### 14. Dokumentace si odporuje
- `NORMS.md:215`: `ip20a` → `bus-riservato.svg`, soubor neexistuje a kód značku nekreslí. Oddíl D navrhuje pruhy podle
  tříd a jiný text `halfKerbNote`, než je v kódu.
- `SOURCES.md` tabulka 1b: Bologna, Modena, Torino „neuvedena (neověřeno)“, dole ověřeno CC BY 4.0.
- `SOURCES.md:107`: `aree-stradali` je „vozovka (asi 7 m)“; `ab/REPORT.md`: celý uliční prostor s chodníky.
- Univerzální měření (6 řezů, 56 %) je jen ve `results/u-it-1.jsonl`, v `evaluation/universal/REPORT.md` Itálie není.
  Šest řezů ze tří měst je na číslo málo.

### 15. Patička a licence
- „dopravní značky Wikimedia Commons (úřední díla)“: použité II.75 (CC BY-SA 3.0) a II.90 (CC BY-SA 4.0) jsou
  překreslení F l a n k e r a; u Estonska se autor uvádí, u Itálie ne. Buď Bářino rozhodnutí jako u Francie zapsat do
  `LICENCE-A-ZDROJE.md`, nebo autora doplnit.
- „mapa povrchů a budovy Bologni“: mapa povrchů je vypnutá, používají se jen budovy.
- Torino: podmínky Geoportálu žádají vlastní znění citace a kopii odvozenin; záznam samotné služby WMS má „Condizioni
  sconosciute“ (`SOURCES.md` to uvádí). Kredit „© Città di Torino (CC BY 4.0)“ nejspíš stačí, ale je to výklad.

### 16. Budovy Bologni
`towns/italy.js:81`: komentář slibuje vyšší přízemí starého města, kód dělí 3,2 m všude; u paláců v centru počet
podlaží nadhodnotí (podezření, neměřeno). Bod fasády pod podloubím trefí jen „Portico“ a vrátí `{}`: právě u domů
s podloubím, kterých je Bologna plná, výška chybí. Oprava: při podloubí hledat budovu do 5–8 m za bodem.

### 17. Rakouský označník „H“ v Itálii
`IT.js:55`: italská značka zastávky je modrá čtvercová s autobusem (číslo obrázku jsem neověřil), kulaté „H“ Itálie
nemá. Stejný kompromis jako u Francie; patří do backlogu ilustrací.

### 18. Mapa povrchů Bologni (vypnutá, pro případ zapnutí)
`records` končí bez varování na 500 plochách; výplň „zbytek je chodník“ přes celý obdélník přebije dvory (A/B to
popisuje). Před zapnutím rozdělit plochu čarami obrub, jak říká `ab/REPORT.md`.

## Verdikt

Licence čtyř ortofot jsou v katalozích skutečně CC BY 4.0 a polygon nic dalšího neobsahuje; čísla norem sedí s textem
vyhlášek. Dvě věci ale pravidlo „jen otevřená ortofota“ podkopávají: balíky OSM celé Itálie udělají ze zbytku země,
Vatikánu a San Marina „cizinu“ s českými pravidly (nález 1), a Bolzano je nálet AGEA, o kterém dokumentace tvrdí opak
(nález 2, rozhodnout musí Bára). Před nasazením opravit 1, rozhodnout 2 a 5, opravit 3, 4, 6 a 7; zbytek může do
backlogu.

Počty: závažné 2, střední 7, drobné 9.
