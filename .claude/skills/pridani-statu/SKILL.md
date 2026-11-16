---
name: pridani-statu
description: Postup, jak do Profilů ulic přidat další stát (po Slovensku, listopad 2026). Použij, když Bára chce aplikaci rozšířit na novou zemi nebo region: hranice státu, OSM, ortofoto, hledání, domy, datové zdroje měst s A/B testy, normy, dopravní značky, ilustrace, sítě a dokumentace.
---

# Přidání státu do Profilů ulic

Postup podle přidávání Slovenska (větev `slovensko`, 13.–16. 11. 2026). Kód, který je v něm vzorem: `pilot/public/towns/slovensko.js`,
`ortho-osm.js`, `city.js` (abroad, SK_ART, creditLines), `rules.js` (limitsSK), `signs.js` (SK), `site.js` (NETS),
`evaluation/slovensko/`. Zprávy z testů: `evaluation/slovensko/ZPRAVA.md`, `evaluation/slovensko/ab/ZPRAVA.md`,
`evaluation/slovensko/NORMY.md`.

## Pravidla, která platí po celou dobu

- **Jazyk a stát nemíchat.** Jazyk rozhraní: ISO 639-1 malými (cs, sk, en), jen texty (`i18n.js`, `sk.js`). Stát řezu:
  ISO 3166-1 velkými (CZ, SK, AT): `city.country`, data, normy, zákony, značky, ilustrace. V kódu, souborech (`znacky-SK/`)
  i ve zprávách Báře.
- **Nepushovat.** Vše do větve státu (např. `rakousko`), commitovat lokálně, do `main` ne, dokud Bára neřekne.
- **Každý nový zdroj dat má A/B test** (viz níže) a výsledek ve zprávě. Co vyjde hůř, zůstane v kódu vypnuté za
  parametrem (`?zvolen=1`, `?tm=1`), ne smazané.
- **Pátrání po datových vrstvách na agenta s modelem Haiku** (přesné zadání: co hledat, jak ověřit CORS a licenci, tabulka).
  Rešerše norem a dokumentů na Sonnet. Kreslení ilustrací přes workflow (kreslířka a kritik, aspoň 3 kola), jen když o to
  Bára požádá.
- **Služby ohleduplně:** jeden dotaz na řez a službu (memo podle bboxu), pauzy v testech, User-Agent bez osobních údajů
  („profily-ulic“). Overpass ne. Nikdy e-mail ani jméno uživatele v dotazech.
- **Texty:** klíčem `t()` je vždy čeština; překlad do `en.js` i `sk.js` (hlídá `tests/i18n.test.js`, slovenské texty
  nesmí mít česká písmena, místní jména přidat do keep-listu).
- **Testy nesmí volat síť.** Parametry modulu státu v Node přes `globalThis.PROFILY_SK = { pasport: "0", zbgis: "0", hrany: "0" }`
  (vzor v `tests/vypadky.test.js`), a `npm test` před každým commitem.

## 1. Stát a jeho modul

1. Hranice: `tools/build_staty.mjs` (stát z národní služby, zjednodušeno asi na 30 m) → `pilot/public/staty.json`.
   `city.js cityAt` pak vrací id státu (např. `slovensko`), mimo známé státy `cizina`.
2. `city.js`: položka přes `abroad(id, country, …)`: `country` ISO, `centre: null`, `estateKm`, `dataShort`, `credit`,
   `rulesHead`. Texty v `en.js` a `sk.js` (CITY tabulky), `cityTexts`.
3. `towns/index.js`: id státu → `towns/<stat>.js` s `sources = { osm, surfaces, lines, parking, podlaznost }`,
   `national = true` (žádný pokus o českou DMVS).
4. Vše, co je jen české, vypnout podle `city.country`: panorama Mapy.com, DMVS, RÚIAN, ortofoto ČÚZK, hlášky
   „mimo Česko“ (nadpis je jen název ulice, poznámka o datech pod ním v `#profile-sub`).
5. CSP v `pilot/public/index.html` (`connect-src`, u obrázků `img-src`) doplnit o každý nový server, jinak „Failed to fetch“.

## 2. OSM, ortofoto, hledání, domy

- **OSM:** dlaždice státu v balíku (`tools/build_osm_tiles.mjs`, `pack_osm_tiles.mjs`), lokálně `?osm=balik`.
- **Ortofoto:** národní, otevřená licence a CORS (čteme pixely). Zapojit do `lanes-ortho.js` (zdroj podle města,
  `BY_CITY`), do podkladů mapy a kreditů. Ověřit vyvážení barev (slovenská mozaika byla žlutá, asfalt vypadal jako tráva;
  bez úpravy 11 ze 40 řezů nemělo profil).
- **Odhad bez technické mapy:** `ortho-osm.js` (obruby z ortofota a OSM). U státu se ověřuje na vzorku a obrázcích.
- **Hledání:** národní registr adres a ulic (`search-sk.js` jako vzor), přepíná se podle mapy nebo písmen v dotazu.
- **Domy:** národní vrstva budov (druh užití, výška) → `podlaznost` (`zbgisBuilding`). Druh užití převést na typ OSM
  (`zbgisType`): **vzhled paneláku jen obytným domům**, ostatní jako kanceláře. Bez centra města se vzhled
  neodvozuje od vzdálenosti (`profile.js abroadStyle`): rok a střecha z OSM, panelák jen deska nebo dům od 8 podlaží.

## 3. Hledání datových zdrojů (agent Haiku)

Zadání agentovi, po vrstvách:
1. **Národní mapa** (u SK ZBGIS): osy silnic se šířkou, parkoviště, tráva, budovy.
2. **Pasporty komunikací měst** (plochy vozovek, chodníků, parkovišť): ArcGIS Online orgy měst, T-MAPY
   (`/services/mapserver/common/pakom/gservice`, `ms:pk-pov`), geoportály.
3. **Technické mapy měst** (čáry obrubníků, hranice druhů pozemků, ploty; značky ploch).
4. **Inženýrské sítě** (linie s druhem, DN, případně výška).

U každé služby jeden malý dotaz (bbox asi 100 m v centru): odpovídá, vrací geometrie, pole s typem, CORS s hlavičkou
`Origin: https://barasoukup.github.io`, licence. Agent nezapisuje do repozitáře; výsledek do scratchpadu.

**Než se zdroj zapojí, prohlédnout ho nad ortofotem:** čáry obarvit podle typu (skript `linedraw.mjs` ve scratchpadu,
ortofoto přes export národní služby) a určit, které typy sedí na obrubnících. U Slovenska: kresba typu 1 (Nitra, Piešťany,
Prešov), 1 a 60 (Zvolen), „Kresba polohopisu“ (Hlohovec), hranice druhu pozemku 2180–2220 (Bratislava). Legendu
technické mapy hledat v dokumentech města (Bratislava: „Štruktúra objektov polohopisného a výškopisného plánu“).

## 4. Jak zdroje zapojit (vzory v `towns/slovensko.js`)

| Druh zdroje | Jak | Pozor |
|---|---|---|
| Pasport města (plochy) | `SK_TOWNS` s boxem města, `own(bbox)` → MTVU kódy (701, 702, 703, 704, 1003), kolem budovy, zeleň a voda z OSM (`osmAreas`) | **jen když má plochu pod středem řezu**, jinak dnešní odhad (vnitrobloky dávaly „Neurčeno“ přes celý řez) |
| Národní šířky silnic | osa se šířkou → `orthoOsmPolys widths` (očekávaná šířka vozovky, jen bez OSM `width`) | — |
| Národní plochy (parkoviště, tráva) | do odhadu (`orthoOsmPolys areas`), **ne do ploch řezu** | v plochách řezu zablokují odhad a u obslužných cest vyjde „Neurčeno“ |
| Čáry technické mapy | `EDGE_SOURCES` → `lines().edges` → kandidáti obrub (`kerbs`, bonus `mapBonus`) a konec chodníku | nemusí být uzavřené; z čar skládat plochy nefunguje (otevřené čáry, plochy se slévají) |
| Značky ploch technické mapy | `lines().symbols` → druh kousku mezi čarami (`symbolAt`) | — |
| Ploty, zábradlí, koleje | `lines().features` s kódy IPR (`CTMTP_KOD`) | ploty mohou profil zkrátit chybně |
| Sítě | `site.js NETS` (box města, vrstvy, druh, popis, DN) | hloubku nemá skoro nikdo: obvyklá hloubka, čárkovaně |
| Kredit | `city.js creditLines` podle `state.cut.sources` (app.js) + překlady | — |

Služba, která odpoví chybou 4xx, se neopakuje (`gis.js`); hláška o opakování jmenuje skutečný server.

## 5. A/B test každého zdroje

1. **Vzorek:** `evaluation/<stat>/ab/vzorek*.mjs`: náhodné body s pevným semínkem do 1–1,5 km od středu měst, kde zdroj
   je (a u národních zdrojů města bez vlastních dat), 15–25 na město.
2. **Sběr v aplikaci** (jen tak projde vše jako při kliknutí, včetně ortofota): skript `sber.js` načtený do stránky
   localhostu (`<script src>`, eval CSP nedovolí), každý bod dvakrát s parametrem vypnutí (`?pasport=0`, `?hrany=0`,
   `?zbgis=0`…) přes `history.replaceState`, výsledky ve `window`.
3. **Obrázky rozdílných řezů nad ortofotem:** nahoře A modře, dole B červeně, silně okraje vozovky
   (`evaluation/slovensko/ab/obrazky.mjs` v Node, nebo přímo ve stránce kreslicím skriptem, když se data nechce
   přenášet).
4. **Posudky okem:** lépe A / lépe B / stejně / obojí špatně / nejde posoudit (`vysledky/posudky.json`), souhrn po
   městech, zpráva `ZPRAVA.md`, výchozí stav podle výsledku.
5. Pro normy: na sebraných profilech spočítat varování podle starých a nových pravidel (`checkRules`), kolik a kterých.

**Regrese:** každá změna společného odhadu (`ortho-osm.js`, `derive.js`) se zkontroluje v Česku:
`node evaluation/ortofoto-osm/regrese.mjs` proti `vysledky/regrese.txt` (obruby, chodníky a stání proti MTVU Prahy a Brna).
Co tam zhorší výsledky, zůstane vypnuté nebo se omezí na stát. Nové části odhadu dostanou vypínač (`P.off`, `?off=…`),
ať se dají měřit zvlášť.

## 6. Normy a zákony

- Rešerše (agent Sonnet) podle prvků `rules.js` (`limits`): pruhy podle třídy, chodník, pruh BUS, BUS s cyklisty,
  cyklopruh (i vedle stání), ochranný pruh, cyklostezka, sdílená stezka, nástupiště, stání, tramvajový pás, jednosměrka
  s cyklisty v protisměru. Hodnota + přesné místo v předpisu + jistota; co je placené (STN), jen sekundárně.
- Zapojit jako `limits<STAT>` podle `city.country`, kde veřejná hodnota chybí, varování vynechat (u SK tramvajový pás).
  Hlavičku seznamu (`rulesHead`) přepsat na předpisy státu. Zpráva `evaluation/<stat>/NORMY.md`, testy v `tests/rules.test.js`.
- Zákony do odhadu stání (u SK stejné 3 m volného pruhu jako v ČR; stání na chodníku jen se značkou).

## 7. Dopravní značky

- Sada podle vyhlášky státu: `pilot/public/znacky-<STÁT>/` (piktogramy podle přílohy, texty křivkami), mapování klíčů
  v `signs.js` (`signFile`, `plateFile`, `signLabel(x, country)`); co stát nemá, vrací null a nekreslí se.
- Úřední díla: ověřit, že nejsou chráněná (SK zák. 185/2015 § 5 b)).
- Recenze sady (zrcadlení, přesné tvary) proti vyhlášce, opravit, CLAUDE.md.

## 8. Ilustrace

- **Vozidla měst:** podle Bářina zadání workflow kreslířka a kritik ve 3 kolech, soubory `pilot/public/<mesto>/`
  (`tram-*`, `trolejbus-*`, `bus-*`, čelo a záď), zapojení podle boxu města (`city.js SK_ART`, `skArtAt`). Kreslířky
  fotky nevidí (WebFetch dává text): výsledek ukázat Báře.
- **Mobiliář:** nejdřív zjistit, co město skutečně převzalo (Bratislava má pražskou lavičku a stojan). Označníky
  zastávek se značkou státu (`pilot/public/slovensko/`), i v kresbách přístřešků. Nábytek z jiné složky přes
  `"../cesko/…"` v mapě ilustrací.

## 9. Dokumentace a předání

- CLAUDE.md: oddíl státu (zdroje, co je zapnuté a vypnuté a proč, licence).
- Zprávy v `evaluation/<stat>/`, commit po každém kroku, krátce Báře: co je hotové, výsledky A/B, co zůstalo otevřené
  (licence měst, chybějící města, rodilý mluvčí pro texty, nasazení).

## Chyby, na které jsme narazili (zkontrolovat i u dalšího státu)

- Nadpis se po obnovení stránky bral z uloženého stavu: testovat vždy nový řez (`localStorage.removeItem("streetdesign-pilot")`).
- Prohlížeč drží staré moduly: `fetch(…, { cache: "reload" })` pro změněné soubory a reload.
- Ulice ze dvou jednosměrných vozovek: odhad musí mít obě (`partnerOf`).
- Velký dům, jehož druhá strana je mimo čtené okno, se ztratil (`crossT(…, Infinity)`).
- `lanes-ortho.js` spadl, když se všechny kousky slily (prázdný seznam).
- Dotaz se špatným polem (4xx) se opakoval a hláška tvrdila „server OpenStreetMap neodpovídá“.
- Plochy pasportu nebo národní mapy v plochách řezu blokovaly odhad (u obslužných cest „Neurčeno“ přes celý řez).
- Ruční detekce aut na ortofotu (rozptyl jasu u obruby) přidává stání, kde žádné není (viz `evaluation/ortofoto/AUTA-DL.md`).
- Stání podle zákona bez zón placeného stání vychází skoro všude: u státu bez dat o zónách ho vypnout (`noParkGuess`).
- Koleje zakreslené v OSM i jako silnice (`highway=service` + `railway=tram`) nejsou druhá vozovka.
- Neuzavřené čáry technické mapy: plochy se slévají; brát jen místa, kde je řez protne, a značky v kouscích.
- Pasport, jehož plochy jsou široké spevnené plochy (Zvolen), vyšel hůř: proto A/B u každého zdroje.
- Texty ve slovenštině jako klíče `t()` neprojdou testem: klíč česky, slovenština do `sk.js`.
