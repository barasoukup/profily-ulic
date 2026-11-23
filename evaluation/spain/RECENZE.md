# Nepřátelská recenze státu Španělsko (ES), 23. 11. 2026

Rozsah: `countries/ES.js`, `towns/spain.js`, `search-es.js`, `signs-ES/`, `evaluation/spain/`, části `lanes-ortho.js`,
`signs.js`, `derive.js`, `credits.js`, `app.js`, `index.html`, `tools/countries.mjs`, `tools/build_staty.mjs`,
`tests/spain.test.js`, `LICENCE-A-ZDROJE.md`, `pilot/README.md`. Větev `estonia`, HEAD `84140de`. Žádný soubor kromě
této zprávy jsem neměnil.

Co jsem ověřil:
- `npm test` prošel (353 testů, 0 chyb).
- Právo v primárním zdroji (BOE, konsolidovaná znění stažená 23. 11.): RGC čl. 91.2 a), 94.2 e), 152.1, 153.6, 156.2,
  zrušený čl. 93, nový titul VI od 1. 10. 2026 (RD 518/2026); Orden TMA/851/2021 čl. 5.2 b) (1,80 m) a c) (2,20 m).
  Citace v `NORMY.md` a v `ES.js` sedí doslova. Výjimka 1,50 m ze staré vyhlášky VIV/561/2010 v nové už není.
- `deriveProfile` na umělých ulicích pro `spain`, `portugal`, `france`, `monaco` (odhad stání podle zákona).
- `cityAt` na 48 místech u hranic a na pobřeží a na všech 94 975 úsecích ulic lokálního balíku `es-novy.posm`.
- `cleanCut` pro Madrid, Las Palmas, El Hierro s klíči `orthoCity: "es"`, `esTown: "zaragoza"` (projdou).
- Vykreslení všech 34 SVG ze `signs-ES/` a porovnání s mapováním v `ES.js`.
- Jednotlivé dotazy ven (User-Agent `profily-ulic review`, pauzy): WFS Zaragozy (21 ploch, odpověď lon, lat, CORS `*`,
  Fees a AccessConstraints `NONE`), Catastro `BU:Building` (GML, `gml:featureMember`, CORS `*`), 4 dotazy CartoCiudad,
  5 hlaviček Geofabriku (cesty `europe/spain/<id>/<id>` a `africa/canary-islands/…` existují),
  `data.streetspace.eu/osm/index.json`.

Co jsem neověřil: obrázky značek proti katalogu RD 465/2025 (v BOE jsou jen jako obraz v PDF 27,6 MB, nestahoval jsem),
čísla z příručky ministerstva [GUIA] a [GUIA-R] (jen proti `NORMY.md`), licenci Catastra a města Zaragozy v primárním
zdroji, chování v prohlížeči, stavbu balíků `es_*`.

Bez nálezu:
- Hranice na pevnině: Tui/Valença, Badajoz/Elvas, Ayamonte/Vila Real, Irun/Hendaye, La Jonquera, Els Límits/Le Perthus,
  Portbou/Cerbère, Puigcerdà/Bourg-Madame, Llívia, La Línea/Gibraltar, Andorra (Pas de la Casa), Olivenza, Ceuta, Melilla,
  Menorca, Formentera, El Hierro (Valverde) vyšly správně.
- CSP: `www.ign.es`, `www.cartociudad.es`, `ovc.catastro.meh.es`, `idezar-sig.zaragoza.es` jsou v `connect-src`,
  `www.ign.es` i v `img-src`.
- WFS Zaragozy: pořadí os v dotazu (lat, lon s URN) i v odpovědi (lon, lat) sedí. Catastro: `bbox` lat, lon a `posList`
  lat lon sedí, prázdné `numberOfFloorsAboveGround` (`xsi:nil`) se správně přeskočí.
- Geofabrik: 18 dílů a Kanárské ostrovy pod `africa/` (`osm-tiles.yml:105`) odpovídají skutečným cestám.
- Bod fasády pro Catastro leží 4 m uvnitř domu (`derive.js:2180`), půlmetrové okno tedy dům zasáhne.

## Ověřené nálezy

### 1. Odhad stání nechává v obousměrce dva pruhy po 1,5 m (závažné)

`ES.js:71` má `lawNeed: () => 3` bez ohledu na směr, počet pruhů a `minLane`. Komentář (`ES.js:69`) a `pilot/README.md:265`
tvrdí „odhad jako v Lucembursku“, jenže Lucembursko, Francie, Belgie i Polsko mají
`Math.max(3, minLane * Math.max(oneway ? 1 : 2, lanes))`, tedy pruhy zůstávají průjezdné. `derive.js:707–712` pak
odhadne stání, kdykoli po něm zbude 3 m.

Zkouška (`deriveProfile`, vozovka mezi chodníky 3 m, `highway=residential`):

| vozovka | Španělsko | Francie |
|---|---|---|
| 5 m, obousměrná | pruh 1,50 + pruh 1,50 + stání 2,00 (odhad) | pruh 2,50 + pruh 2,50 |
| 6 m, obousměrná | 2,00 + 2,00 + stání | 3,00 + 3,00 |
| 7 m, obousměrná | stání + 1,50 + 1,50 + stání | 2,50 + 2,50 + stání |
| 9 m, `lanes=4` | stání + 3 pruhy po 1,67 + stání | 3 pruhy po 3,00 |

Pruh 1,5 m neexistuje a sama aplikace na něj hned svítí oranžově (`limitsES`, 2,5 m). Bára schválila doslovné čtení
čl. 91.2 a) (3 m k protějšímu okraji), ne pruhy po 1,5 m. Čl. 91.2 a) navíc končí „o, en cualquier caso, cuando no
permita el paso de otros vehículos“ a čl. 91.1 žádá, aby stání nepřekáželo provozu. `tests/spain.test.js` tohle chování
zabetonoval (`ES.lawNeed(false, 2) === 3`), výsledný profil netestuje.

Náprava: buď po odhadu stání sloučit zbytek do jednoho obousměrného pruhu 3 m (pokud to aplikace umí kreslit), nebo
`lawNeed` jako ve Francii a doslovné 3 m nechat jen pro poznámku u stání napůl na chodníku. Test na výsledné šířky pruhů.

### 2. Obytná ulice dostane značku S-28 (zóna 10 km/h), S-47 se nenakreslí nikdy (závažné)

- `ES.js:40`: `ip26a → S-28`. Podle `NORMY.md` (B4, C2) je S-28 v katalogu 2025 „Zona de estancia y juego“, 10 km/h, vždy
  s R-301 10. Zóna 20 km/h je S-47 „Zona de coexistencia“.
- `signs.js:96`: `ZONE_SPEED.ip26a = 20`, takže u `highway=living_street` s `maxspeed=20` (běžné španělské značení,
  stará S-28 „calle residencial“ znamenala 20 km/h) se rychlost 20 schová a zůstane jen S-28. Profil tak tvrdí zónu
  10 km/h tam, kde je 20.
- `signs.js:112`: klíč `sdilena` vzniká jen z českého `traffic_sign=IZ 10a`. Ve Španělsku tedy nevznikne a `sdilena → S-47`
  je mrtvé mapování. Test jen ověřuje, že soubor `S-47.svg` existuje.
- Soubor `S-28.svg` je kresba z roku 2006 (`signs-licence.json`: Benedicto16, „Zona de prioritat per a vianants“), tedy
  stará značka. Shodu s obrázkem katalogu 2025 dokládá jen věta v `NORMY.md`, sám jsem ji neověřil.

Náprava: `living_street` s rychlostí 20 nebo bez rychlosti (čl. 50.1 a: plataforma única 20 km/h) → S-47; s `maxspeed=10`
→ S-28 + R-301 10. `ZONE_SPEED` nechat přepsat státem.

### 3. Ulice na pobřeží a v přístavech padají do „ciziny“ (závažné)

Hranice GISCO 1 : 1 M zjednodušená na 30 m (`tools/build_staty.mjs:91`) řeže nábřeží. Z 94 975 úseků ulic lokálního
balíku (11 měst) jich `cityAt` dá 221 do `cizina`, například: Passeig de Joan de Borbó, Passeig del Mare Nostrum a Moll
d'Espanya (Barcelona), Paseo Sir John Moore a Rúa Julio Portela Ceballos (A Coruña), Avenida de Los Cambulloneros a
Calle Marina (Las Palmas), Paseo de Levante (Málaga), ulice v přístavu Palmy a Valencie. La Restinga na El Hierru
(27,640; −17,981) je `cizina` celá. Řez tam nemá španělské normy, značky, ortofoto PNOA ani Catastro.
`tests/spain.test.js` zkouší jen středy měst.

Náprava: přesnější pobřeží (hranice obcí IGN/CNIG „Líneas límite municipales“, CC BY 4.0 scne.es, nebo GISCO 1 : 100 K),
případně ring Španělska rozšířit směrem do moře o 200–300 m (v moři ulice nejsou). Test s nábřežími.

### 4. Výchozí rychlost: aplikace schovává 50, ve Španělsku je výchozí 30 a 20 (střední)

`signs.js:124–126` nekreslí rychlost 50 bez značky jako „výchozí v obci“ ve všech státech. Čl. 50.1 RGC (ověřeno v BOE,
`NORMY.md` B4): 20 km/h na plataforma única, 30 km/h s jedním pruhem na směr, 50 km/h až od dvou pruhů na směr. Ulice
s `maxspeed=30` (zákonná výchozí) tedy dostane R-301 30, i když tam značka není, a ulice s jedním pruhem na směr a
`maxspeed=50` (ta značku mít musí, čl. 50.3) ji nedostane. `NORMY.md` to pro aplikaci výslovně píše, kód to nedělá.

Náprava: výchozí rychlost bez značky jako funkce státu (počet pruhů na směr, `living_street`).

### 5. Catastro: bez časového limitu, bez paměti, zbytečné dotazy v Baskicku a Navaře (střední)

- `spain.js:112–113`: holý `fetch` bez `AbortSignal.timeout`. Francie (`towns/france.js:146`) jde přes `getJSON`
  s limitem. `app.js:654` na `podlaznost` čeká (`await Promise.all`), visící Catastro tedy zdrží domy na dobu, kterou
  určí prohlížeč.
- Čtyři dotazy na řez (2 strany × `Building` + `BuildingPart`), žádná paměť: posun řezu o metr se ptá znovu.
- V Baskicku a Navaře (Catastro je nepokrývá, `ZDROJE.md` odst. 3) se čtyři dotazy pošlou také a vrátí „No records“.
- `spain.js:127`: `members(buildingGml)[0]` bere první budovu okna, ne tu, ve které bod leží (Francie testuje
  `inRings`). U štítové zdi může vyjít rok a užití souseda.

Náprava: `AbortSignal.timeout`, paměť jako u Zaragozy, obdélníky Baskicka a Navarry vynechat, budovu vybírat podle bodu.

### 6. Melilla: snímek Airbus pod licencí, kterou neznáme, s kreditem „CC BY 4.0“ (střední)

`ZDROJE.md` (odst. 1) i `LICENCE-A-ZDROJE.md:86` říkají, že PNOA v Melille je Pléiades Neo © Airbus DS (2022), „jiná
licence, zatím neřešeno“. Aplikace ho přesto v Melille zobrazuje i čte pro pruhy (`app.js:332–334`, `lanes-ortho.js:99`)
a připisuje „ortofoto PNOA © IGN (CC BY 4.0)“ (`credits.js:32`). Ve sloupci stavu je ✓.

Náprava: do vyjasnění Melillu z vrstvy i z `laneOrtho` vyjmout (obdélník), nebo zjistit podmínky a uvést Airbus.

### 7. Balíky OSM na R2 nejsou, texty je už slibují; větev je za `main` (střední)

`data.streetspace.eu/osm/index.json` má 23. 11. ze Španělska jen `es_ic` a `es_pv`. `app.js:475`, `app.js:1007` a
`index.html:7,12` na této větvi Španělsko jmenují mezi pokrytými státy. `origin/main` má o 6 commitů víc, mezi nimi
`a941dbd` („No word yet of the states whose OSM tiles are not on R2“), který tyto texty vrátil. Push balíky nepostaví
(poučení ze Švýcarska v `CLAUDE.md`).

Náprava: při slučování držet rozhodnutí z `a941dbd`; workflow „OSM tiles“ ručně se `states: es`, pak ověřit `index.json`.

### 8. Záznam řezů zahodí polohu všech španělských řezů (střední)

`logging/worker.js:48`: `num(e.lat, 45.5, 55.5), num(e.lon, 5.5, 23)`. Španělsko (27,6–43,8° s. š., −18,2–4,4° v. d.)
je celé mimo, do D1 se zapíše řez bez polohy. Stejná chyba už jednou zahodila Košice a Bregenz.

Náprava: meze z `countries/<ISO>.js bounds`, nasadit musí Bára.

### 9. Cyklopruh a stezka: červená hranice je výjimka pro krátké úseky (střední)

`ES.js:18`: `min: 1, zaklad: 1.4`. Podle `NORMY.md` A2 ([GUIA-R] tab. 1) je 1,40 m **minimum** a 1,00 m jen „výjimečně
(krátké úseky), nikdy pod“. Aplikace tak červeně varuje až pod výjimkou a oranžově pod minimem; doporučenou šířku nemá
žádnou. U Francie tentýž nález recenze opravila (pařížský 1 m → 1,2 m). Obousměrná stezka (2,60 / 2,20 m) se nehlídá
vůbec (je jen v textu) a šířky příručky jsou „bez vodicích čar a odstupů“, kdežto díl profilu je s čarami.

Náprava: `min: 1.4` (červeně) a v textu „výjimečně na krátkém úseku 1 m“; oranžovou hranici jen se zdrojem.

### 10. Zóna 30 se popisuje kódem S-30, který katalog 2025 nemá (drobné)

`ES.js:40` a `signLabel` píší „S-30 Zóna 30“. `NORMY.md` (úvod, C2) i `signs-ES/README.md` říkají, že S-30 je značka
katalogu 2003 a v katalogu 2025 není; zda patří mezi zrušené (odstranit do 1. 7. 2026), rešerše neověřila. Bára tabuli
schválila, ale hlavička `ES.js:35` tvrdí „the catalogue of RD 465/2025“.

Náprava: kreslit tabuli bez kódu (popisek „ZONA + R-301“), nebo ověřit seznam zrušených značek.

### 11. Značky: jedna pod CC BY-SA bez uvedení autora, dvě z návrhu 2023 (drobné)

- `R-301-110.svg` je podle `signs-licence.json` CC BY-SA 4.0 (Majafego). Patička (`index.html:133`) uvádí jen „úřední
  díla“. U Estonska se překreslení pod CC BY-SA v patičce jmenuje (`index.html:139`). Buď stejně, nebo číslo 110
  odvodit z veřejné R-301 jako u Portugalska.
- `S-30a.svg` a `S-33.svg` jsou „2023 set“, kresby podle **návrhu** nařízení z února 2023, ne podle vyhlášeného
  katalogu z června 2025 (`signs-licence.json`, pole `desc`: „conforme al proyecto de Real Decreto“).

### 12. Dálnice podle `ref`: autopista jen s předponou „AP-“ na začátku (drobné)

`ES.js:44`: `/^AP-/`. `ref` „E-15;AP-7“ dá autovíu (ověřeno: `file({k:"ip14a", ref:"A-2;AP-7"})` → S-1a), stejně
autopisty bez „AP“ (C-32, R-2, M-12). Náprava: `/(^|;)\s*AP-/`, jinak S-1a jen pro `A-`.

### 13. Hledání: jméno ulice z CartoCiudad se nikdy neshodne s OSM (drobné)

`search-es.js:31` předá řezu `street` jako „PASEO GRACIA“ nebo „CALLE ALCALA“ (ověřeno dotazem). `derive.js:131`
porovnává `el.tags.name === name`, v OSM je „Passeig de Gràcia“, „Calle de Alcalá“. Zvýhodnění hledané ulice u adresy
na rohu tak ve Španělsku nefunguje. `looksSpanish` (`search-es.js:9`) chytá i „plaza“, „ronda“, „palma“ a každé „ñ“,
hledaný text pak odchází IGN z jiného státu.

### 14. Dokumentace a testy (drobné)

- `NORMY.md` oddíl D navrhuje pro pruh `zaklad` 3,00 m, kód má 2,5 m v obou větvích (`ES.js:23–24`, podmínka mění
  jen text). Rozhodnutí není zapsané.
- `LICENCE-A-ZDROJE.md:89`: licence Zaragozy „katalog města CC BY 4.0 (neověřeno)“, stav ✓. Stránka `aviso-legal`
  portálu otevřených dat mi vrátila 404. Kredit nemá rok dat (2017).
- Univerzální měření (23 řezů, 57 %) je jen v `vysledky/u-es-*.jsonl` a ve zprávě commitu, `evaluation/universal/ZPRAVA.md`
  oddíl nemá. Ve vzorku nejsou ostrovy, Ceuta ani Melilla.
- `tests/spain.test.js` netestuje adresu dotazu WFS (pořadí os), selhání služby (`esFailed`), ani jiné limity než chodník.
- `roadBands` (`spain.js:50–57`): pás 14 m kolem každé `service` cesty, mosty a `tunnel=building_passage` se
  nevylučují. V backlogu je jen zg12.

## Podezření (neověřeno)

- Kresby S-28, S-33, S-30a, S-41, S-47 a upravená `S-51a-bus.svg` jsem s katalogem 2025 neporovnal (jen PDF). Původ
  souborů (2006, návrh 2023, vlastní díla z jara 2025, před vyhlášením) k opatrnosti vede.
- Licence Catastra: v `ZDROJE.md` „podle dokumentace, neověřeno“, capabilities nic neuvádějí. Kredit v exportu řezu
  Catastro nejmenuje (klíč v `credits.js` chybí), jen patička stránky.
- Španělské názvy v `es.js` a právní pojmy v ostatních jazycích jsem nečetl.

## Verdikt

Právní citace a závazná šířka chodníku jsou doložené a sedí s BOE, zdroje dat fungují a CSP je úplné. Nasadit bych to
ale nenechal: odhad stání kreslí v běžných obousměrkách pruhy po 1,5 m (nález 1), nejčastější zklidněná ulice dostane
značku s jiným významem (2) a nábřeží velkých měst nejsou Španělsko (3). Nálezy 4 až 9 jsou opravitelné za den.
Počet: závažné 3, střední 6, drobné 5.
