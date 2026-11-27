# Přestavba: státy, města, jazyky

Návrh 16. 11. 2026, upravený po oponentuře Fable (verdikt „schvaluji s úpravami“, změny zapracované níže), k zařazení hned po sloučení Rakouska (větev `austria`) do `main`. Stav kódu, ze kterého
vychází: `main` (b3b9fea) a `austria` (15 commitů navíc).

## Proč

Aplikace má dnes 3 státy (CZ, SK, AT) a „cizinu“, asi 25 měst a 4 jazyky. Přibývat budou hlavně státy a města.
Města se přidávají dobře (modul `towns/<město>.js`), státy špatně: stát nemá vlastní místo v kódu, jeho pravidla
jsou rozházená v podmínkách `if (city.country === "SK") … else if (city.country === "AT") …`.

Soupis z větve `austria` (podmínky na stát nebo id města mimo modul města):

| Soubor | Počet | Co tam visí |
|---|---|---|
| `app.js` | 28 | široké silnice SK/AT, odhad stání SK/AT, které ortofoto (`slovensko` → „sk“, cizina → nic, jinak „cuzk“), pasport jen SK, `roadOnPath` jen Praha, stáří zástavby Praha a Brno, poznámka „odhad z ortofota a OSM“ jen `["slovensko","austria"]`, výběr značek v Návrhu, ilustrace měst `skArtAt`/`atArtAt` dvakrát, hledání `inSlovakia`/`inVienna`/`inAustria` |
| `city.js` | 22 | `abroad()`, `SK_ART`+`SK_ART_BOX`, `AT_ART`+`AT_ART_BOX`, `creditLines` s výčtem všech zdrojů všech států |
| `signs.js` | 15 | složka značek, čísla, dodatkové tabulky, co se smí kreslit: vše `if CZ / SK / AT` |
| `sources.js` | 8 | Brno, Praha (přetížený server), `["slovensko","austria"]` |
| `towns/slovensko.js` | 7 | modul se sám hlídá `city.id !== "slovensko"` |
| `rules.js` | 6 | `limitsSK`, `limitsAT`, pravidlo tramvajového pásu jinak pro AT a SK |
| `profile.js` | 6 | vzhled domů AT, Praha `iprKind`, cizina bez centra |
| `derive.js` | 5 | volný pruh 2,6 m v AT, paragraf zákona o stání CZ/SK/AT, třída silnice z OSM v AT |
| `gis.js`, `maplayers.js` | 2 | Praha bez časového limitu, vrstva jen Praha |
| `tools/`, `pages.yml`, `index.html` | | seznam států ve smyčkách nasazení (OSM, R2), CSP ručně |

Co z toho plyne:
1. **Další stát = úpravy v 7–10 souborech**, ne jeden nový soubor. Návod `.claude/skills/pridani-statu` to musí
   vyjmenovávat a snadno se něco vynechá (CSP, smyčky v `pages.yml`, kredit).
2. **Stát a město se pletou.** `slovensko` a `austria` jsou zapsané jako „města“ (`CITIES`), `cizina` používá modul
   Slovenska. Bratislava, Košice, Vídeň, Graz a Linz proto nejsou města, ale „boxy ilustrací“ (`SK_ART_BOX`,
   `AT_ART_BOX`), „boxy pasportů“ (`townAt` v `towns/slovensko.js`) a box FMZK (`inWien`). Totéž místo se určuje
   třemi nebo čtyřmi různými kódy.
3. **Kredit je jeden velký výčet** (`creditLines`) všech zdrojů všech států. Každý nový zdroj se do něj dopisuje ručně.
4. **Načítá se všechno najednou:** všechny jazyky (`en.js`, `sk.js`, `de.js`, po 780 řádcích) a moduly všech měst
   a států, i když návštěvník řeže jednu ulici v Praze.

Co funguje a měnit se nemá: výpočet profilu (`derive.js`, `lanes-ortho.js`, `ortho-osm.js`) dostává data už
sjednocená do kódů MTVU, z rozhraní modulu města (`sources = { osm, surfaces, lines, parking, podlaznost }`); jazyk
je oddělený od státu; klíčem překladu je česká věta a test `tests/i18n.test.js` hlídá úplnost.

## Cíl

- **Nový stát** = `app/public/countries/<ISO>.js` + složka značek + záznam v jednom seznamu států pro nástroje.
  Žádná podmínka `country === "<ISO>"` mimo složku `countries/`.
- **Nové město nebo zdroj města** = modul a záznam „zdroj + území + stát“ v jednom seznamu; v kterémkoli státě.
- **Nový jazyk** = jeden soubor `<lang>.js` + řádek v `LANGS` (jako dnes).
- **Výsledky se nezmění.** Jde o přestavbu bez změny chování: každý krok se ověří tím, že výstup zůstane stejný
  (viz krok 0).


## Model: stát → město → zdroje (všude stejně)

Bára 16. 11. 2026: struktura má být jednotná, státy a města všude. Bratislava, Košice, Vídeň, Graz jsou města
jako Brno. Fablova námitka se týkala zdrojů, ne měst: pokrytí zdroje nemá vždy tvar města (čáry Nitry a Zvolena
jen na kusu města, pasport Dúbravky jen v městské části, sítě Košic, značky Salzburgu, české pasporty
v `pasporty.json`). Proto tři vrstvy:

```
místo řezu (lat, lon)
  └─ placeAt(lat, lon) → { country: "SK", city: "bratislava", sources: ["bratislava-pasport", "dubravka", …] }
       1. stát podle polygonu (staty.json)          ← vždy první: box Bratislavy zasahuje do AT a HU
       2. město podle hranice obce: CZ RÚIAN (mesta.json jako dnes), SK ZBGIS, AT hranice obcí Statistik Austria;
          jinde „zbytek státu“ (cesko, slovensko, austria, cizina)
       3. zdroje města nebo státu, které mají data v místě řezu: výchozí území zdroje = hranice jeho města,
          vlastní hranice jen kde je jiná (kus města, městská část)
```

- **Město** (obec s hranicí): jméno, centrum (vzhled domů), vlastní ilustrace nad sadou státu (vozidla, mobiliář), seznam zdrojů. Patří do státu, z něj dědí
  všechno, co nemá vlastní (texty, ortofoto, značky, normy).
- **Zdroj**: modul s dotazy, územím, kreditem (klíč) a vypínačem (`?pasport=0`…). Dnešní `SK_ART_BOX`,
  `AT_ART_BOX`, `inWien`, `townAt`, `EDGE_SOURCES`, `site.js NETS`, `pasporty.json` se převedou na města a zdroje.
- **Texty**: město zdědí sadu textů svého státu a doplní jen své jméno (v pádech, kde ho věta potřebuje) a vlastní
  zdroje; žádné úplné sady pro každé město ve čtyřech jazycích.
- **Log**: u řezu v Bratislavě bude `city: "bratislava"` místo `slovensko` a přibude `country`. Je to změna
  chování, proto samostatný krok až po přestavbě beze změny; statistiky po státech přes `country`.

`city` zůstává jeden sdílený objekt jako dnes. `city.country` zůstává řetězec ISO („CZ“, „SK“, „AT“, null),
vedle přibude `country` – modul státu, nastavovaný v `setCity`.

### Rozhraní státu (`countries/<ISO>.js`)

Moduly států se načítají **staticky** (čtou se synchronně: `signFile(s, seg, "SK")`, `setCity` a hned kreslení
v `restore`, testy). Kde se státy liší kódem, je v rozhraní **funkce**, ne příznak, který by jádro dál větvilo.
Státy nesmějí importovat moduly, které importují `city.js` (kruh `city.js` → `countries/SK.js` → `rules.js` →
`city.js`); sdílené pomocné funkce norem přesunout do samostatného modulu bez `city.js`.

```js
export default {
  code: "SK",                       // ISO 3166-1; cizina: null (countries/default.js)
  bounds: [16.8, 47.7, 22.6, 49.7], // hrubé meze pro kontrolu uloženého řezu (validate.js cleanCut)
  // Zákon a normy
  parkingNote(park) { … },          // celá věta o stání na chodníku (AT má jinou větu, ne jen citaci) ← derive.js 1044
  freeLane: 3,                      // volný pruh pro každý směr (AT 2,6)                   ← derive.js lawLane
  parkGuess: false,                 // odhad stání podle zákona                              ← app.js noParkGuess
  limits(s, segs, i) { … },         // minima dílů                                          ← rules.js limitsSK/AT
  checks(segs, out) { … },          // pravidla přes více dílů: tramvajový pás, jednosměrka s cyklisty
                                    //   v protisměru (tři varianty)                       ← rules.js 206–232
  // Dopravní značky
  signs: { dir, file(s, seg), plate(s, seg), label(x), drawable(x, seg) },    ← signs.js
  // Mapy a odhad
  ortho: "sk",                      // výchozí ortofoto státu; město ho přebíjí (praha, brno, plzen) ← lanes-ortho BY_CITY
  orthoEstimate: true,              // poznámka „odhad z ortofota a OSM“                     ← app.js 468, sources.js 66
  wideRoadEstimate: true,           //                                                       ← app.js 308
  roadClassFromOsm: false,          // AT true                                              ← derive.js 1872
  // Ilustrace a domy (Bára 16. 11. 2026: odlišné obrázky a typy budov pro různé státy)
  art: { dir, furniture, stops, vehicles },  // výchozí sada státu: mobiliář, označníky se značkou státu,
                                    //   vozidla; město ji zdědí a přepíše jen své (dnes skArt, atArt, czechFurniture)
  houses: {
    looks: ["cinzak", "funkce", "moderni", …],  // vzhledy, které stát smí kreslit (AT bez paneláku: Gemeindebau
                                    //   jako „funkce“); vlastní kresby státu ve složce státu, český katalog se nemění
    style(info, n) { … },           // převod dat státu na vzhled (CZ RÚIAN/IPR, SK druh budovy ZBGIS, AT OSM)
  },                                //                                                      ← profile.js 613–645, 730
  searchHint(map, query) { … },     // zda hledat ve službě státu (výřez mapy, písmena dotazu) ← search.js 262–267
  national: …,                      // zdroje „zbytku státu“ (CZ: DMVS+RÚIAN, SK: ZBGIS)
  panorama: false,                  // Mapy.com jen CZ
};
```

Funkce v `signs.js` a `rules.js` zůstanou (testy na ně), jen místo vlastních větví zavolají stát.

### Kredit u zdroje

`creditLines` přestane vyjmenovávat zdroje. Zdroj, který data dodal, zapíše do `state.cut.sources` **klíč**
(ne hotovou větu: uložený soubor a změna jazyka bez přepočtu by ji nechaly ve starém jazyce), seznam zdrojů
k němu drží text kreditu (česky přes `t()`). `validate.js` propouští klíče z téhož seznamu.

### Jeden seznam států pro nástroje

`tools/countries.mjs` (vedle `tools/cities.mjs`): kód, Geofabrik, klíč balíku OSM, zda se balík vejde na Pages.
`pages.yml` místo ručních smyček `cz sk at` (řádky 84, 104, 142, 264) volá `node tools/countries.mjs --list osm`.
CSP v `index.html` zůstává ručně, ale **test** ověří, že obsahuje všechny hostitele z modulů měst a států.

### Líné načítání: nedělat (zatím)

Úspora je 40–80 kB po kompresi proti asi 140 kB jádra a Leafletu. Cena: záložka otevřená přes nasazení by si
dotáhla modul nové verze ke starému jádru (Pages nemá verzované adresy), přepnutí jazyka za běhu by muselo být
asynchronní. Vrátit se k tomu, až jazyků nebo měst bude výrazně víc, a nejdřív jen u jazyků, po změření.
Líně už dnes (a dál) jen zdroje měst a hledání.

## Co neděláme

- Žádný framework, sestavovací krok ani TypeScript.
- Nevyměňujeme sdílený objekt `city`, klíče překladů (česká věta), id `cesko`/`slovensko`/`austria`/`cizina`.
- Neměníme výpočet profilu.

## Postup (každý krok jeden commit, po každém ověření)

0. **Záchranná síť z nahraných dat** (většina dne):
   - Jednou nahrát odpovědi zdrojů (plochy, linie, parkování, OSM, snímky ortofota) pro stovky řezů: 995 slovenských
     ze sběru kontroly (commit 627c964), k tomu rakouské a české (Praha, Brno, malá města, DMVS až po 19. 11.).
     Vybrat tak, aby pokryly větve: vzhledy domů a ilustrace každého státu a města, dálnice SK/AT, pasport s doplněním, Salzburg, FMZK zapnuté i vypnuté.
   - V Node přehrávat celý řetěz `deriveProfile` → `deriveSigns` → `keepDrawable` → `checkRules` → SVG profilu
     (vzhled domů, ilustrace, značky) → `creditLines`, výstup porovnat se snímkem. Živý sběr se liší sám od sebe
     (výpadky služeb, asi 6 % řezů), proto ne.
   - Snímek tabulek: složený `city` pro všechna id × 4 jazyky, hlášky výpadků (`sources.js` 65–74), paleta značek
     v Návrhu (`app.js` 1716–1732), `signFile`/`plateFile`/`signLabel` × státy, `limits` × státy, načtení
     uloženého souboru (`validate.js`).
   - Dál `npm test` a `evaluation/ortofoto-osm/regrese.mjs`.
1. **Levné a nezávislé:** `city.id === "praha"` / `"brno"` → vlastnosti města (`fix.roadOnPath`, `slowServer`,
   `builtAge`, vrstva v `maplayers`); smazat nepoužívaný `storeSuffix`.
2. **Kredit u zdroje** a `validate.js` podle seznamu zdrojů a států: `cleanSources` propustí klíče všech zdrojů
   (dnes zahazuje `skTown`, `atTown`, `zbgis`, `skEdges`, `sk`, `at`), `cleanCut` bere meze ze `staty.json`
   / `bounds` států (dnes jen 48–52° s. š., 12–19° v. d.). Obě chyby jsou živé, viz níže.
3. **`countries/CZ.js`, `SK.js`, `AT.js`, `default.js`** (až po sloučení `austria` a `jihlava-pasport`). Kontrola:
   mimo `countries/` žádné `country === `, `["SK","AT"].includes`, `city.country || "CZ"`,
   `["slovensko","austria"].includes(city.id)`, `id === "austria"`. `tests/i18n.test.js` čte i `countries/`.
4. **`placeAt` a zdroje s územím** (beze změny výsledků): pryč `skArtAt`, `atArtAt`, `inWien`, `townAt`, guardy
   `city.id !== "slovensko"` v `towns/slovensko.js`; zdroje dostanou území.
4b. **Města všude** (změna chování, schvaluje Bára): hranice obcí SK a AT, Bratislava, Košice, Žilina, Banská
   Bystrica, Prešov, Vídeň, Graz, Linz jako města s texty ze sady státu; log `city` po městech + `country`.
5. **`tools/countries.mjs`** pro `pages.yml`, test CSP; zkušební sestavení, `_site` stejné.
6. Přepsat návod `.claude/skills/pridani-statu`, `app/README.md`, CLAUDE.md.

Odhad: krok 0 skoro den, kroky 1–4 další den až dva, 5–6 menší.

## Rizika

- **Souběžná práce:** krok 3 a 4 sahají do `app.js`, `city.js`, `signs.js`, `rules.js`, `derive.js`; začít až po
  sloučení `austria` a `jihlava-pasport` (9 commitů, +73 řádků v `derive.js`) a po dobu přestavby nad nimi nezačínat
  nové větve. Kroky 0–2 jdou dřív.
- **Tichá změna výsledků:** proto přehrávání nahraných dat, ne živý sběr.
- **Uložené řezy, odkazy, log:** id `cesko`/`slovensko`/`austria`/`cizina` zůstávají pro zbytek státu; nová id měst jen v kroku 4b.

## Chyby nalezené při oponentuře (opraví krok 2; Bára 16. 11. 2026: v rámci přestavby, ne zvlášť)

- `validate.js` `cleanCut` bere jen šířku 48–52° a délku 12–19°: řez v Košicích, Prešově, Komárně nebo Grazu se po
  obnovení stránky, změně jazyka nebo načtení souboru ztratí.
- `validate.js` propouští v `sources.orthoCity` jen ipr/brno/plzen a zahazuje `skTown`, `atTown`, `zbgis`,
  `skEdges`, `sk`, `at`: uložený slovenský řez ztratí kredity zdrojů.

## Provedení (16. 11. 2026, větev `architecture-countries`, nenasazené)

Kroky 0–6 commitnuté po jednom, 4b (Bára 16. 11. 2026) po nich. Odchylky od plánu:
- **4b:** hranice rakouských měst z obcí LAU Eurostatu GISCO 2024 (obce Statistik Austria): soubor Statistik Austria na
  open data už není a mapová služba GeoSphere nevrací geometrii. Města nemají vlastní texty (žádná věta jméno města
  nepotřebuje) a nemají centrum (vzhled domů zůstává podle OSM jako ve zbytku státu). Přehrání: změnil se jen id města
  a u jednoho řezu v boxu Lince mimo jeho hranici ilustrace (vozidla státu místo linecké tramvaje).
- **Krok 0 přehrává v prohlížeči, ne v Node** (`evaluation/replay/`): větve podle státu a města jsou z velké části
  v `app.js` a v kresbě (`buildSvg`), které v Node nejdou spustit. Nahrávač před `app.js` uloží odpověď každého dotazu
  na data (jiný hostitel, `/api/`, `data/`), přehrání je vrací a dotaz, který nahrávka nemá, selže a je vidět
  (`misses`). Výstup řezu: profil, stavová hláška, export SVG s ilustracemi i bez, kredit, město, varování a karty dílů
  v Návrhu se značkami, znovu načtený uložený soubor. V Node jen tabulky (`tables.mjs`). Vzorek 369 řezů: Slovensko
  (města s pasporty a čarami map víc), Rakousko (Vídeň, Graz, Linz, Salcburk, Innsbruck, menší města, dálnice), Praha
  20, Brno 30, za hranicemi 5. České řezy mimo Prahu a Brno až po odstávce DMVS.
- Pohled Porovnat se porovnává bez kreseb (rozvržení měří popisky v okně a není opakovatelné); kresby hlídá export.
- Ortofoto pruhů: stát `laneOrtho`, město ho přepíše (`praha` ipr, `brno`, `plzen`), `BY_CITY` je pryč.
- „Cizina“ má vlastní prázdné zdroje (`towns/cizina.js`), proto mohly z `towns/slovensko.js` zmizet podmínky na id města.
- Vzhledy domů: stát má `houseLook` (Rakousko bez paneláku); seznam vzhledů, které stát smí nabízet v Návrhu (`looks`),
  zatím ne: dnes se nabízí všude stejný katalog a jeho omezení by bylo změnou chování.
- `site.js NETS` a `pasporty.json` mají území už dnes (box, hranice), do `placeAt` zatím nevstupují.
