---
name: pridani-statu
description: Postup, jak do Profilů ulic přidat další stát (po Slovensku a Rakousku, listopad 2026). Použij, když Bára chce aplikaci rozšířit na novou zemi nebo region: hranice státu, OSM a R2, ortofoto, hledání, domy, datové zdroje měst s A/B testy, normy, dopravní značky, ilustrace, sítě, kontroly a dokumentace.
---

# Přidání státu do Profilů ulic

Postup podle Slovenska (větev `slovensko`, 13.–16. 11. 2026) a Rakouska (větev `austria`, 16. 11. 2026). Vzorový kód:
- `pilot/public/towns/slovensko.js` (pasporty, čáry map, ZBGIS);
- `pilot/public/towns/austria.js` (mapa povrchů Vídně FMZK, značky Salcburku);
- `ortho-osm.js`, `city.js` (`abroad`, `SK_ART`/`AT_ART`, `creditLines`), `rules.js` (`limitsSK`, `limitsAT`);
- `signs.js` (SK, AT), `site.js` (NETS), `search-sk.js`, `search-at.js`, `search-photon.js`.

Zprávy jsou v `evaluation/slovensko/` a `evaluation/austria/` (ZPRAVA, NORMY, ZDROJE, ZNACKY, ab/).

## Pravidla, která platí po celou dobu

- **Názvy v kódu a souborech anglicky** (Bára 16. 11. 2026): `towns/austria.js`, id státu `austria`, `signs-AT/`,
  `evaluation/austria/`. Stávající české názvy (`slovensko.js`, `znacky/`, `cesko`) zůstávají.
- **Jazyk a stát nemíchat:**
  - Jazyk rozhraní: ISO 639-1 malými písmeny (cs, sk, en, de), týká se jen textů (`i18n.js`, `sk.js`, `en.js`, `de.js`).
  - Stát řezu: ISO 3166-1 velkými (CZ, SK, AT). Řídí `city.country`, data, normy, zákony, značky a ilustrace.
  - `signs.js` nesmí číst jazyk (hlídá `tests/i18n.test.js`). Úřední názvy značek státu se proto řeší klíčem podle
    významu značky státu (`SK_TITLE`) a překladem do jazyka (ve slovenštině úřední název).
- **Nepushovat.** Vše do větve státu (např. `austria`), commitovat lokálně, do `main` ne, dokud Bára neřekne.
- **Každý nový zdroj dat má A/B test** (viz níže) a výsledek ve zprávě. Co vyjde hůř, zůstane v kódu vypnuté za
  parametrem (`?zvolen=1`, `?tm=1`), ne smazané. Každý zapojený zdroj má vypínač (`?wien=0`, `?salzburg=0`, `?pasport=0`).
- **Agenti:**
  - Pátrání po datových vrstvách na agenta s modelem Haiku (přesné zadání: co hledat, jak ověřit CORS a licenci, tabulka).
    Když se do katalogu nedostane (data.gv.at, CKAN měst), zkusit katalog nebo web search sám.
  - Rešerše norem a dokumentů na Sonnet.
  - Kreslení ilustrací přes workflow, jen když o to Bára požádá (viz bod 8).
- **Služby ohleduplně:**
  - jeden dotaz na řez a službu (memo podle bboxu), pauzy v testech;
  - User-Agent bez osobních údajů („profily-ulic“), Wikimedia chce popisný („profily-ulic (street profiles app; URL)“), jinak vrací 429;
  - Overpass ne, Nominatim na našeptávání ne;
  - nikdy e-mail ani jméno uživatele v dotazech;
  - co OSM už má (např. stromy Vídně), se znovu neptat.
- **Texty:** klíčem `t()` je vždy čeština, překlad do `en.js`, `sk.js` i `de.js` (hlídá `tests/i18n.test.js`).
  Slovenské hodnoty nesmí mít česká slova: při hromadné náhradě v `sk.js` měnit jen hodnoty, ne klíče.
- **Testy nesmí volat síť.** Parametry modulu státu v Node přes `globalThis.PROFILY_SK = {…}` a `globalThis.PROFILY_AT = {…}`.
  Funkce, které by se ptaly služby (např. `locateAt`), testovat se vstupem, který dotaz nevyvolá. `npm test` před každým commitem.
- **Kontroly:** po dokončení státu pustit nepřátelského recenzenta na celou větev (co je špatně, co chybí, co rozbije
  Česko) a pak kritika „co nám ve státu chybí“. Nálezy zapracovat a zapsat do zprávy.

## Šetření prostředků (Bára 16. 11. 2026)

Kolik co stálo u Rakouska:
- kresby 7 vozidel ve 3 kolech: asi 3,6 mil. tokenů (46 agentů);
- první kresby vozidel: 0,9 mil.;
- nepřátelská recenze: 0,2 mil.;
- průzkum zdrojů a norem: 0,1–0,2 mil. každý.

Kresby jsou zdaleka nejdražší. Proto:

- **Modely podle úlohy:**
  - průzkum dat a malé dotazy na Haiku;
  - rešerše norem a kreslení vozidel na Sonnet;
  - Opus jen tam, kde je potřeba úsudek: recenze, A/B posudky, složitější kód.
  - Ve workflow dát `model` každému `agent()`: kreslířka a opravy `sonnet`, kritik `sonnet`, souhrn bez agenta.
- **Kresby:**
  - Kreslit jen vozidla, která se v profilu opravdu objeví (`profile.js`):
    - tramvaj na kolejích;
    - autobus jen v pruhu BUS (`bus`, `bus_cyklo`), v obyčejném pruhu jsou auta;
    - trolejbus jen v pruhu BUS pod trolejí (OSM `trolley_wire`), nebo v pruhu jen pro MHD pod trolejí.
  - Pruh BUS může kdokoli přidat v Návrhu, proto má vlastní autobus smysl i tam, kde dnes buspruh není. Vlastní autobus
    ale jen větším městům, kde buspruhy jsou nebo se dají čekat v návrzích. Ostatním stačí obecný autobus státu
    (`slovensko/bus-*`) a trolejbus jen městům s trolejemi.
  - Jedna kreslířka na čelo i záď (jedno zadání, dva soubory).
  - Kritik nejdřív porovná s fotkami. Tři kola dodržet, ale když kolo vrátí jen kosmetické drobnosti, třetí kolo
    vynechat a říct to Báře.
  - Náhled pro Báru jedním obrázkem (`magick montage`), ne každý soubor zvlášť.
- **Kontext hlavní konverzace:**
  - Velké výsledky (JSON řezů, výpisy služeb) ukládat do souboru a číst jen souhrn, netisknout je celé.
  - Ze stránky vracet zhuštěné řádky (typ:šířka), ne celé objekty.
  - Obrázky A/B skládat do montáží po 5–7 řezech v malém rozlišení.
  - Číst jen ty, kde se profil změnil.
- **A/B:**
  - Vzorek 20–40 řezů stačí.
  - Obrázky jen pro změněné řezy, a když jich je hodně, prohlédnout reprezentativních 10–12.
  - Nesbírat znovu, co se nezměnilo: dvojice A/B se sbírá hned po sobě, protože služby kolísají.
- **Agenti:**
  - Pouštět je jen na práci, která by zahltila kontext (široké hledání, recenze celé větve).
  - Malé dotazy a úpravy dělat přímo.
  - Neduplikovat: když agent pracuje, nedělat totéž souběžně.
  - Paralelně pouštět jen nezávislé práce.
- **Prohlížeč:**
  - Kroky dávkovat (`browser_batch`).
  - Číst text a stav (`localStorage`, `#footer-data`) místo screenshotů.
  - Screenshot jen pro vizuální kontrolu a v menším měřítku.
- **Testy a regrese:**
  - `npm test` (rychlý) po každé změně.
  - Regresi Prahy a Brna (pár minut) jen po změně společného odhadu.
- **Recenze:** jedna nepřátelská recenze na konci státu a jeden kritik „co chybí“ stačí. Ne po každém kroku.

## 1. Stát a jeho modul

1. **Hranice:** `tools/build_staty.mjs` → `pilot/public/staty.json`.
   - Národní služba, zjednodušeno asi na 30 m. Když je vypnutá (BEV WFS), Eurostat GISCO 1 : 1 M (`CNTR_RG_01M_2024_4326`)
     s kreditem „© EuroGeographics“.
   - **Pořadí států rozhoduje:** přesné hranice (CZ, SK) první, hrubší až za nimi, aby bod u hranice dostal ten přesný.
   - Otestovat pohraniční body (Mikulov, Hainburg, Petržalka, Mnichov) v `tests/city.test.js`.
   - `city.js cityAt` pak vrací id státu, mimo známé státy `cizina`.
2. **Položka státu v `city.js`:** přes `abroad(id, country, …)` s `country` ISO, `centre: null`, `estateKm`, `dataShort`,
   `credit`, `rulesHead`. Texty v `en.js`, `sk.js` a `de.js` (tabulky CITY).
3. **Modul státu:** v `towns/index.js` id státu → `towns/<state>.js` se `sources = { osm, surfaces, lines, parking, podlaznost }`,
   `national = true` (žádný pokus o českou DMVS).
4. **Vypnout, co je jen české,** podle `city.country`:
   - panorama Mapy.com, DMVS, RÚIAN, ortofoto ČÚZK;
   - hlášky „mimo Česko“ (nadpis je jen název ulice, poznámka o datech pod ním v `#profile-sub`, i v `sources.js`);
   - české značky (`signFile` vrací pro stát bez sady null);
   - odhad stání podle zákona bez dat o zónách (`noParkGuess`);
   - široký dosah dálnic: zapnout pro stát, ne pro Česko.
5. **CSP** v `pilot/public/index.html` (`connect-src`, u obrázků `img-src`) doplnit o každý nový server, jinak „Failed to fetch“.
6. **Texty, které vyjmenovávají státy, aktualizovat:**
   - „data pokrývají Česko, Slovensko a Rakousko“;
   - úvodní nápověda a popis stránky (meta);
   - patičky ve všech jazycích.
   Zkrácený řádek patičky se mění podle dat řezu (`cutData`), rozbalená patička uvádí všechny zdroje.

## 2. OSM, ortofoto, hledání, domy

- **OSM a R2 (Bára: „nezapomeň na R2 dlaždice“):** dlaždice státu jsou v balíku (`tools/build_osm_data.sh`,
  `pack_osm_tiles.mjs`; klíč státu je začátek jména souboru, `index.json` vedle).
  - **Lokálně:**
    1. výřez Geofabriku do `data/osm/<kód>.osm.pbf` (Rakousko asi 800 MB);
    2. `NAME=<kód> OGR=…/QGIS…/ogr2ogr tools/build_osm_data.sh data/osm/<kód>.osm.pbf <dir>`;
    3. `pack_osm_tiles.mjs <dir> pilot/data/osm-pack/<kód>-novy.posm` (Rakousko 284 MB);
    4. zkoušet s `?osm=balik`.
  - **V nasazení** (`.github/workflows/pages.yml`) přidat kód státu do všech smyček:
    - cache výřezů a dlaždic, s **klíči včetně seznamu států**, jinak týdenní cache bez nového státu přeskočí stavbu
      nebo nasazení spadne;
    - stažení chybějícího výřezu i při zásahu cache;
    - sestavení a zabalení;
    - úklid starých souborů na R2 (kbelík `profily-ulic-osm`, `data.streetspace.eu/osm`).
  - Prodloužit timeouty a přidat varování, když chybí klíče R2.
  - Na Pages je limit 1 GB, velký stát jen na R2 (Rakousko: na Pages jen `cz` a `sk`, `index.json` bez `at`). Když R2
    neodpoví, stát nemá zálohu: říct Báře.
- **Ortofoto:**
  - Národní, s otevřenou licencí a CORS (čteme pixely). Ověřit hlavičku `Access-Control-Allow-Origin` a nejvyšší úroveň dlaždic.
    basemap.at: `…/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg`, z20, v `lanes-ortho.js` s `ext: ".jpeg"`.
  - Zapojit do `lanes-ortho.js` (`BY_CITY`), do podkladů mapy (`bounds` státu) a do kreditů.
  - Ověřit vyvážení barev: slovenská mozaika byla žlutá, asfalt vypadal jako tráva.
- **Odhad bez technické mapy:** `ortho-osm.js` (obruby z ortofota a OSM). U státu ho ověřit na vzorku a obrázcích.
  Skupina silnice pro normy z OSM `highway` (`derive.js osmGroup`), když stát nemá vlastní třídy.
- **Hledání:**
  - Národní registr adres, je-li otevřený (`search-sk.js`). Jinak adresní body města (Vídeň `ADRESSENOGD`,
    `search-at.js`).
  - Jinak **Photon od komoot** jako záloha (`search-photon.js`: jen výsledky státu, veřejný server pro rozumné použití).
  - BEV (Rakousko) chce registraci a poplatky, klíč by byl v prohlížeči vidět.
  - **Adresu řezat na její ulici:** osa ulice z grafu ulic města nebo jméno ulice předané do `nearestStreet` (adresa
    na rohu jinak padne na boční ulici).
- **Domy:**
  - Národní vrstva budov (druh užití, výška) → `podlaznost`. Druh užití převést na typ OSM: **vzhled paneláku jen
    obytným domům**.
  - Bez centra města se vzhled neodvozuje od vzdálenosti (`profile.js abroadStyle`).
  - **Paneláky nejsou všude:** v Rakousku žádné (Bára). Deska je funkcionalistický dům, po roce 1990 moderní, kanceláře
    kanceláře (`buildingStyle`). Ručně zvolený vzhled zůstane.

## 3. Hledání datových zdrojů (agent Haiku)

Zadání agentovi, po vrstvách:
1. **Národní mapa** (u SK ZBGIS): osy silnic se šířkou, parkoviště, tráva, budovy.
2. **Mapy povrchů a pasporty měst** (plochy vozovek, chodníků, parkovišť):
   - ArcGIS Online orgy měst;
   - T-MAPY (`/services/mapserver/common/pakom/gservice`, `ms:pk-pov`; Košice `gisplan.kosice.sk`);
   - WFS měst (Vídeň FMZK na `data.wien.gv.at/daten/geo`) a geoportály.
3. **Technické mapy měst** (čáry obrubníků, hranice druhů pozemků, ploty; značky ploch).
4. **Katastry dopravních značek** (Salcburk `verkehrszeichen` s číslem StVO).
5. **Inženýrské sítě** (linie s druhem, DN, případně výška).
6. **MHD každého většího města:** autobus, trolejbus, tramvaj, dopravce, typ vozidla a barvy (pro ilustrace).

U každé služby jeden malý dotaz (bbox asi 100 m v centru). Zjistit:
- zda odpovídá a vrací geometrie;
- pole s typem (spočítat třídy na větším bboxu, a vrstvy budov a nadstaveb zvlášť);
- CORS s hlavičkou `Origin: https://streetspace.eu`;
- licenci.

**Pozor u WFS:**
- pořadí os bboxu a souřadnic: u GeoServeru WFS 2.0 `bbox=lon,lat,lon,lat,EPSG:4326` vrací lon/lat;
- `count`;
- CQL `ILIKE` pro hledání;
- `propertyName` jen se správným jménem geometrie.

Agent nezapisuje do repozitáře, výsledek dává do scratchpadu.

**Než se zdroj zapojí, prohlédnout ho nad ortofotem:**
- čáry obarvit podle typu (skript `linedraw.mjs` ve scratchpadu) a určit, které typy sedí na obrubnících;
- u ploch zjistit všechny třídy;
- legendu hledat v dokumentech města.

## 4. Jak zdroje zapojit

| Druh zdroje | Jak | Pozor |
|---|---|---|
| Pasport nebo mapa povrchů města (plochy) | `SK_TOWNS` / `towns/austria.js`, třídy → MTVU kódy (701, 702, 703, 704, 705, 1003, 401, 601 …) přes `asMtvu` | **jen když má plochu ulice (701–705, 1003) pod středem řezu**, ne trávník ani dvůr; posun v délce dělit `cos(lat)`. Nadstavby (podloubí, přístřešky: FMZK 12, 13) podle plochy pod nimi (`KLASSE_SUB`). **Všechny vrstvy, nebo žádná:** když jedna neodpoví, nepoužít nic a říct to v poznámce. |
| Za pasportem až k domům | `besidePassport` (jen SK) | jen když dům, plot nebo chodník OSM stojí do 15 m |
| Národní šířky silnic | osa se šířkou → `orthoOsmPolys widths` | jen bez OSM `width` |
| Národní plochy (parkoviště, tráva) | do odhadu (`orthoOsmPolys areas`), **ne do ploch řezu** | v plochách řezu zablokují odhad |
| Samostatný chodník OSM | `orthoOsmPolys` přebije trávník národní mapy | — |
| Čáry technické mapy | `EDGE_SOURCES` → kandidáti obrub a konec chodníku | nemusí být uzavřené |
| Značky ploch technické mapy | `lines().symbols` → druh kousku mezi čarami | — |
| Katastr dopravních značek | `lines().atSigns` → tagy cesty (`parking:<side>:restriction`) podle strany značky, do 25 m od řezu | značky na začátku úseku (zóny, rychlosti) řez dál od nich nevidí |
| Sítě | `site.js NETS` | hloubku nemá skoro nikdo; výšky terénu ČÚZK jen v Česku |
| Hranice měst | `tools/build_towns_sk.mjs` → `mesta-sk.json` (okresy velkých měst, jinak obec) | obdélníky braly sousední obce (Šamorín jako Bratislava) |
| Kredit | `city.js creditLines` podle `state.cut.sources` (app.js), patičky ve všech jazycích, `LICENCE-A-ZDROJE.md` | — |

Služba, která odpoví skutečnou 4xx nebo chybou ArcGIS se jménem špatného pole, se neopakuje (`gis.js err.refused`).

## 5. A/B test každého zdroje

1. **Vzorek:** náhodné body s pevným semínkem do 1,5–2 km od středu měst, kde zdroj je, 20–40 na město. Vzorek uložit
   (`evaluation/<state>/ab/sample.mjs`).
2. **Sběr v aplikaci** (projde všechno jako při kliknutí, včetně ortofota):
   - skript v `javascript_tool` stránky localhostu, `window.cutAt(lat, lon)`;
   - každý bod dvakrát s vypínačem (`?pasport=0`, `?wien=0`…) přes `history.replaceState`, výsledky ve `window`;
   - body předat souborem `pilot/public/zz-pts.json` (po testu smazat);
   - dlouhý sběr spustit jako `window.__run = (async…)()` a výsledek číst dalším voláním.
3. **Obrázky rozdílných řezů nad ortofotem:** nahoře A modře, dole B červeně.
   - Skript `evaluation/slovensko/ab/obrazky.mjs` s `IN=`, `OUT=` (složka vedle skriptu), `LA=`, `LB=`.
   - Pro dlaždicové ortofoto `ORTHO=at` (lepení dlaždic přes ImageMagick).
   - Id řezů unikátní (obrázky se ukládají podle id).
4. **Posudky okem:** lépe A / lépe B / stejně / obojí špatně / nejde posoudit. Souhrn, zpráva `ZPRAVA.md`, výchozí stav
   podle výsledku.
5. **Pro normy:** spočítat varování podle starých a nových pravidel (`checkRules`).

**Regrese:** každá změna společného kódu (`ortho-osm.js`, `derive.js`, `signs.js`, `rules.js`) se zkontroluje v Česku:
`node evaluation/ortofoto-osm/regrese.mjs` proti `vysledky/regrese.txt`. Co tam výsledky zhorší, zůstane vypnuté nebo
se omezí na stát. Nové části odhadu dostanou vypínač (`P.off`, `?off=…`).

**Po každé změně `app.js` udělat v prohlížeči řez v Česku i ve státu.** Testy `app.js` nepokrývají: nový parametr `name`
v `cutAt` zastínil pozdější `const name` a rozbil každý řez.

## 6. Normy a zákony

- **Rešerše** (agent Sonnet) podle prvků `rules.js` (`limits`). U každého prvku hodnota, přesné místo v předpisu a jistota.
  Placené normy (STN, RVS) jen ze sekundárních zdrojů, a **v citaci to přiznat** („RVS 03.02.13 podle NÖ Leitfaden 2024“).
- **Zapojení:** jako `limits<STAT>` podle `city.country`.
  - Kde veřejná hodnota chybí, nedávat červenou, jen orientační základ s textem „zdroj nenalezen“.
  - Hodnoty bez opory v rešerši nevymýšlet (nepřátelská recenze to u Rakouska našla).
  - Zbytkovou šířku při stání (judikatura) nevydávat za návrhovou normu.
- **Doklady:** hlavička seznamu (`rulesHead`) podle předpisů státu, zpráva `evaluation/<state>/NORMY.md`, testy.
- **Zákony do odhadu stání:**
  - CZ a SK: 3 m na směr;
  - AT: StVO § 24 odst. 3, dva volné pruhy po asi 2,6 m (`derive.js lawLane`);
  - text hlášky podle státu, ne s cizím zákonem.

## 7. Dopravní značky

- **Sada podle předpisů státu:** `pilot/public/znacky-SK/` nebo `signs-AT/`, z přílohy vyhlášky nebo z Wikimedia Commons
  (úřední díla: ověřit, že nejsou chráněná; AT § 7 UrhG).
  - Všem SVG doplnit `viewBox` s mezerami: bez něj nebo s čárkami se kreslí s rozměry NaN.
  - Rychlosti: šablona se vkládaným číslem (`SPEED_TEMPLATES`).
- **Mapování v `signs.js`:** `signFile`, `plateFile`, `signLabel(x, country)`. Co stát nemá, vrací null.
  - `keepDrawable` a `ctx.country` v `deriveSigns` takové značky zahodí dřív, než zákaz zastavení zabere poslední místo
    (jinak vytlačí zónu).
  - Návrh je nenabízí.
- **Dodatkové tabulky:** když je stát nemá nakreslené, zahodit značku s tabulkou. Samotný B 1 by zakázal vjezd úplně,
  ne „mimo dopravní obsluhy“.
- **Co stát nemá, neznačit:** Rakousko nemá čelní značku jednosměrky (Einbahnstraße je tabule podél ulice), takže se
  pod pruhem nekreslí.
- **Popisky čísly a úředními názvy státu** (`SK_TITLE` přes `t()`), číslování ověřit v platném znění. Recenze sady proti
  předpisu, CLAUDE.md.

## 8. Ilustrace

- **Vozidla měst:** autobus, trolejbus a tramvaj každého většího města (bus se kreslí v buspruhu, takže autobus potřebuje
  každé město s buspruhem), čelo i záď, soubory `pilot/public/<town>/`.
  - **Workflow s povinnými 3 koly:** kritik každé kolo vypíše i drobnosti a skutečné barvy si sám najde na fotkách
    z Commons. Bez toho kritik schválí hned v prvním kole a chyby zůstanou (Linz byl modrý místo oranžového).
    Kreslířce i kritikovi dát `model: "sonnet"` (šetření prostředků výše).
  - Kreslířky fotky nevidí, vycházejí z popisů. Výsledek ukázat Báře jako náhled (`magick` s odstraněním `<text>`).
  - Pro menší města obecný autobus státu.
- **Zapojení podle hranice nebo boxu města:** `city.js SK_ART`/`AT_ART`, `skArtAt`/`atArtAt`, `useCity` v `app.js`.
- **Mobiliář:**
  - Nejdřív zjistit, co město skutečně převzalo (Bratislava má pražskou lavičku).
  - Označníky se značkou státu i v kresbách přístřešků: Rakousko „H“ v `austria/`, Vídeň s tabulkou Wiener Linien jen u tramvaje.
  - Nábytek z jiné složky přes `"../cesko/…"`.

## 9. Dokumentace a předání

- **CLAUDE.md:** oddíl státu (zdroje, co je zapnuté a vypnuté a proč, licence, rozhodnutí Báry).
- **Dokumentace a licence:** `pilot/README.md`, `LICENCE-A-ZDROJE.md`, patičky ve všech jazycích.
- **Zprávy** v `evaluation/<state>/` a commit po každém kroku.
- **Báře krátce:**
  - co je hotové a výsledky A/B;
  - co zůstalo otevřené (licence měst, města bez dat, rodilý mluvčí, R2 bez zálohy na Pages, nasazení).

## Chyby, na které jsme narazili (zkontrolovat i u dalšího státu)

- **Testování v prohlížeči:**
  - Nadpis se po obnovení stránky bral z uloženého stavu: testovat vždy nový řez (`localStorage.removeItem("streetdesign-pilot")`).
  - Prohlížeč drží staré moduly: `fetch(…, { cache: "reload" })` pro změněné soubory a reload.
- **Odhad profilu:**
  - Ulice ze dvou jednosměrných vozovek: odhad musí mít obě (`partnerOf`).
  - Velký dům, jehož druhá strana je mimo čtené okno, se ztratil (`crossT(…, Infinity)`).
  - `lanes-ortho.js` spadl, když se všechny kousky slily.
  - Koleje zakreslené v OSM i jako silnice nejsou druhá vozovka.
- **Dotazy na služby:**
  - Dotaz se špatným polem (4xx) se opakoval a hláška jmenovala špatný server.
  - „400 Unable to complete operation“ pod zátěží se opakovat má.
- **Plochy a data měst:**
  - Plochy pasportu nebo národní mapy v plochách řezu blokovaly odhad.
  - Neuzavřené čáry technické mapy: plochy se slévají.
  - Pasport se širokými zpevněnými plochami (Zvolen) vyšel hůř: proto A/B u každého zdroje.
  - Mapa povrchů s třídou „Gehweg, Radweg“ dávala cyklostezku 10 m přes park: mapovat podle obsahu, ne podle jména.
- **Stání:**
  - Ruční detekce aut na ortofotu přidává stání, kde žádné není.
  - Stání podle zákona bez zón placeného stání vychází skoro všude.
  - Vrstva „rezidentského parkování“ (Bratislava) byla jen 71 pilotních úseků, ne hranice zón: ověřit pokrytí dřív, než
    se zóny použijí.
- **Texty, CSP a nasazení:**
  - Texty v cizím jazyce jako klíče `t()` neprojdou testem.
  - Hromadná náhrada textu změnila i hodnoty v `sk.js` na české slovo („v Rakousku“).
  - Chybějící host v CSP se projeví až v prohlížeči.
  - Týdenní cache nasazení bez nového státu.
- **Kód v `app.js`:** nový parametr funkce se srazil s pozdější `const` stejného jména (TDZ) a rozbil každý řez.
