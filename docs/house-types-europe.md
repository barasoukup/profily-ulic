# Regionální vzhledy domů v Evropě (specifikace, 23. 11. 2026)

> Stav 23. 11. 2026: nakreslené a zapojené (`app/public/house-looks.js`, `profile.js`), štítové domy jen s `?stit=1`;
> zpráva a snímky `evaluation/archive/regional-buildings/REPORT.md`.

Návrh nových vzhledů domu vedle profilu (`app/public/profile.js`) pro starší zástavbu mimo Česko, kde český
činžák se šikmou střechou (`sikma`) a další české vzhledy nesedí, a pro severské státy do budoucna. Jen specifikace:
nic z toho není nakreslené ani zapojené. Číselné hodnoty jsou ve stejných jednotkách jako `STOREY`, `WINDOWS`,
`DEFAULT_FLOORS` a `plinth` v `profile.js`; barvy jsou výchozí návrh k ověření od oka.

## Jak se dům kreslí dnes (co z toho plyne pro nové vzhledy)

- Dům je pás hloubky `EDGE` = 400 cm viděný z boku (díváme se podél ulice): uliční průčelí stojí na hraně `d = 0`,
  co vyčnívá do ulice (balkony, římsy, arkýře, stříšky), se kreslí do `d < 0`. Okna a dveře průčelí se z umělecké licence
  kreslí na boční stěnu ve dvou osách (přední u ulice, zadní).
- Parametry vzhledu: výška podlaží `STOREY` (cm), výchozí počet podlaží `DEFAULT_FLOORS`, okna `WINDOWS`
  `{ w, gap }` v cm a `{ sill, h }` jako podíl podlaží, sokl `plinth` `[výška cm, barva]`, přízemí vyšší
  (`ground` = podlaží × 1,1–1,2 u činžáků), paleta fasád `PALETTES` (výběr podle `seed`), krytina `ROOF_OF` nebo
  `ROOF`, sklon `ROOF_PITCH` (jinak 40°), přesah střechy `eave`, římsy a pásy (`trim`, `shade`, `dark` = odstíny
  fasády), střešní podlaží `roofRows` (mansarda u `sikma`), plochá střecha `flat` s atikou.
- Výběr vzhledu: `buildingStyle` → `derivedStyle` (typ OSM, podlaží, rok z katastru `built` nebo OSM `start_date`
  jako `start`, `roofShape` z OSM `roof:shape`, tvar bloku) → mimo státy se socialistickými vzhledy `westernLook`
  (souběžně přidávaný poválečný dům `povalecny` a příznak `socialistLooks`). V cizině bez známého centra
  (`city.abroad && !city.centre`) rozhoduje `abroadStyle`: dům s neznámým rokem a neplochou nebo neznámou střechou
  je **`sikma`**, tj. pražský činžák. To je hlavní místo, kde se mají uplatnit nové vzhledy.
- Z OSM se dnes čte jen `building`, `building:levels`, `roof:levels`, `height`, `roof:shape`, `start_date`.
  Dlaždice (`tools/build_osm_tiles.mjs` `BUILDING_KEYS`) nesou i `building:material`, ale `derive.js buildingAt` ho
  nečte. `roof:material`, `roof:colour`, `building:colour` v dlaždicích nejsou. Navíc `buildingAt` bral do 25. 11. 2026 (dnes všechny, `evaluation/archive/all-buildings`) jen domy se
  zadanými podlažími nebo výškou (`TUNED_BUILDING`); starý dům bez nich má `info` prázdné a v cizině z něj je `sikma`.

## Navržené zapojení (pro všechny vzhledy níže)

1. Nový háček státu `countries/<ISO>.js houseLook(style, info, n, city)`, volaný v `buildingStyle` **po**
   `westernLook` (nebo po socialistické větvi): vrátí regionální vzhled, nebo `undefined` (nechá původní). Výchozí
   `default.js houseLook: null`. Mimo `countries/` žádná podmínka na stát (pravidlo přestavby států).
2. Regionální vzhled nahrazuje jen „staré“ vzhledy: `sikma`, `mestan`, `nizky` (podle typu) a `vila`/`statek`
   u dřevěných domů. Nikdy `funkce`, `povalecny`, `moderni`, `kancelar`, `hala`, `skola`, `kostel`, `garaz`
   (ty mají vlastní datum a funkci, a pokud je dům novější, regionální vzhled by lhal).
3. Hranice „starého“ domu: rok (`built`, jinak `start`) do 1919, u dřevěných a u severských domů do 1939; neznámý rok
   = starý, jen když `derivedStyle` sám vybral `sikma`/`mestan`/`nizky` (ten už dnes znamená „nic nevíme, asi starý“).
4. Dlaždice OSM: přidat do `BUILDING_KEYS` `roof:material`, `building:colour`, `roof:colour` (malé, celé ČR by to
   nemělo zvětšit znatelně; změřit) a v `buildingAt` číst `building:material`, `roof:material`. A zvážit, zda pro tyto
   vzhledy nebrat i domy bez podlaží (dnes `TUNED_BUILDING`): materiál a rok mají smysl i bez nich. Změna `buildingAt`
   se dotkne i Česka, proto jen za vlajkou a s regresí (`evaluation/ortho-osm/regression.mjs`, sada 100 řezů).
5. Staré město (kde má regionální vzhled přednost i bez roku): seznam center a poloměrů ve státním modulu
   (`oldTowns: [{ name, centre: [lon, lat], km }]`), vyplněný ručně pro hlavní města (Tallinn Vanalinn 59.4370 N
   24.7450 E, 0,45 km; Paříž uvnitř bulvárů Maréchaux ne: tam je Haussmann všude, nepotřebuje centrum). Žádné dotazy
   za běhu; hranice historických jader z OSM by šly přidat do dlaždic (`historic=district`, `heritage=*` plochy),
   ale to až po ověření, že je OSM má souvisle.

Každý vzhled potřebuje do `BUILDING_STYLES` krátký popisek přes `tr()` s překladem do všech jazyků (hlídá
`tests/i18n.test.js`) a nabídku v ruční volbě vzhledu.

---

## 1. Haussmannovský dům (`haussmann`)

**Kde a kdy.** Francie (Paříž a velká města: Lyon, Marseille, Bordeaux, Nice, Lille), Monako, Lucemburk (bulváry
města Lucemburk), Brusel (bulváry Anspach, Adolphe Max, Lemonnier, čtvrť Louise). Asi 1850–1914, dozvuky do 1930.

**Proporce.**
- Podlaží: `STOREY` 330 (étage noble 2. patro skutečně ~360, horní ~290; kreslit průměr). Přízemí + mezipatro
  (entresol) jako jedno vysoké přízemí: `ground` = podlaží × 1,5 (asi 500 cm).
- Podlaží celkem: 6–7 (přízemí, entresol, 4–5 pater, 1–2 v mansardě). `DEFAULT_FLOORS` 7, z toho `roofRows` 1
  (u 7+ podlaží 2).
- Střecha: zinková mansarda, dolní svah 60–75° (stávající kód mansardy u `sikma` má `run = rise × 0,28`, tj. ~74°,
  to sedí), horní svah 15–20°. Vikýře se zinkovým rámem a obloučkem nebo trojúhelníkem nad každou osou. Bez přesahu,
  jen hlavní římsa (60 cm vyložení) a žlab. Řada komínových těles z cihel na hřebeni (typické siluety, kreslit 2–3
  hranolky s hrnci).
- Okna: francouzská okna až k podlaze: `{ w: 115, gap: 100, sill: 0.04, h: 0.70 }`; v přízemí výkladce nebo
  vrata (porte cochère, oblouk 300 × 450 cm) na místě dveří.
- Balkony: souvislý kamenný balkon s litinovým zábradlím ve 2. a 5. patře (francouzsky 2e a 5e étage; v kódu
  `k = 2` a `k = full − 1`, je-li `full ≥ 6`): deska vyložená 70 cm (`d` −70…0), tloušťka 15, pod ní 2 konzoly,
  zábradlí 100 cm tmavé (`#2b2d2f`) se svislými pruty. Ostatní patra: francouzský balkonek (zábradlí v líci okna,
  vyložení 15 cm).
- Sokl a přízemí: bosáž přes přízemí a entresol (vodorovné spáry po 40 cm, jako `sorela`, ale světlý kámen),
  sokl 40 cm žula `#9a958c`.
- Římsy: mezi entresolem a 1. patrem kordonová římsa; nad 5. patrem hlavní římsa (vyložení 50–60) s balkonem nad ní.

**Barvy.** Fasáda lutecký vápenec: `#e8dcc4`, `#e3d5b8`, `#efe6d3`, `#ddd0b5`, `#e6dccb`. Střecha zinek
`#8d969b`, tmavý `#6c757a`, vikýře `#7f888d`. Zábradlí `#2b2d2f`. Okenní rámy bílé `#f4f1ea`; žaluzie (kovové
skládací persiennes) šedé `#b8b6ae`, jen u části oken. Brusel: totéž, častěji bílá omítka `#f1efe8` místo kamene.

**Co kreslit v malé velikosti.** Mansarda se zinkem a vikýřem (silueta), dva souvislé balkony s černým zábradlím,
vysoká okna k podlaze, bosované vysoké přízemí. **Vynechat:** reliéfní ornamenty, konzoly s maskarony, persiennes.

**Rozpoznání z dat.**
- Stát FR, MC, LU, BE (jen Brusel, region podle polohy) a `derivedStyle` dal `sikma`/`mestan`.
- Silné: OSM `roof:shape=mansard` (kdekoli ve FR/BE/LU/MC), rok BD TOPO / OSM 1850–1930 a 5+ podlaží.
- Slabší: neznámý rok, 5–8 podlaží, blok uzavřený (`info.block` není deska) ve městě nad 100 000 obyvatel.
- 2–4 podlaží bez mansardy → **ne** Haussmann (venkovský francouzský dům, viz „rizika“).
- Nahrazuje: `sikma` (a ve FR/BE/LU/MC jeho mansardovou variantu).

**Rizika.** Francouzská maloměsta a jih (Provence) mají kamenné domy s nízkou taškovou střechou, ne mansardu: bez
5+ podlaží nebo `roof:shape=mansard` nenahrazovat (raději středomořský dům jen v departementech u Středozemního moře,
viz 2). Bruselské řadové domy 3–4 podlaží (maison bourgeoise) jsou užší, bez souvislých balkonů: varianta
`haussmann` s `full ≤ 4` (bez balkonů, jen balkonek v 1. patře) je přijatelný kompromis. Lucemburk má hodně
poválečné zástavby, rok je tam nutný.

**Reference.**
- Mapillary 282677650172389 (bd Haussmann, 2021), 1922432077915203 (av. de l'Opéra, 2020).
- Commons: https://commons.wikimedia.org/wiki/Category:Haussmannian_architecture

---

## 2. Středomořský městský dům (`stredomori`) a varianty

**Kde a kdy.** Španělsko, Portugalsko, Itálie, Kypr, Malta, francouzské Středomoří a Monako (vedle Haussmanna u
nižších domů). Domy asi 1750–1930 v historických centrech a v rozšířeních 19. století (Eixample, Ensanche,
Turín, Řím Esquilino).

**Základ (Španělsko, Itálie).**
- Podlaží: `STOREY` 340, přízemí × 1,2; `DEFAULT_FLOORS` 5 (staré centrum 3–5, rozšíření 19. stol. 5–7).
- Střecha: buď plochá terasa (`azotea`, `terrazza`) s atikou a balustrádou 100 cm (Španělsko, jih Itálie), nebo
  nízká sedlová/valbová z korýtkových tašek (coppi, teja árabe) 18–22°, přesah 35–50 cm (sever Itálie, Řím, Turín).
  Rozhodnutí: OSM `roof:shape=flat` → terasa; jinak Itálie a Portugalsko taška, Španělsko střídat podle `seed`
  (Barcelona a jih spíš terasa).
- Okna: vysoká francouzská okna (balkonové dveře): `{ w: 100, gap: 100, sill: 0.04, h: 0.72 }`.
- Balkony: na **každém** patře nad přízemím malý balkon u každé osy: deska vyložená 45 cm (`d` −45…0), tloušťka 10,
  kovové zábradlí 95 cm (`#2f3133`) s jednoduchými pruty, ve 1. patře (piano nobile) vyložení 60–70.
- Okenice: italské `persiane` (zelené lamelové dvojkřídlé, `#4f6b4a`, `#3f6b5a`, hnědé `#7a5a3c`) kreslené jako dva
  svislé pruhy s vodorovnými lamelami vedle okna; některé zavřené přes okno (`luck`). Španělsko: venkovní roleta
  `persiana` (dřevěné nebo plastové lamely, často napůl stažené, na spodní hraně vyklopené) a pruhované plátěné
  markýzy (`toldo`) nad balkony. Drobný detail, který funguje i malý.
- Sokl: omítnutý tmavší sokl 80–100 cm (`zócalo`), nebo kamenný 40 cm.
- Římsy: výrazná korunní římsa (vyložení 40), lizény a šambrány oken o odstín světlejší (jako `vila`).

**Barvy (základ).** Omítky: okr `#e0b062`, terakota / pompejská červená `#c4704f`, světle žlutá `#ecd590`,
lososová `#e8a98c`, lomená bílá `#f1ede4`; Turín „giallo Torino“ `#e1c27e`; Řím `#d7965a`. Šambrány a římsy
`#f0e8d6`. Střecha taška `#c0673f` / `#9a4c30`. Okenice viz výše.

**Varianta Portugalsko (`stredomori` + `azulejo`).** Lisabon, Porto, Aveiro; 1850–1930.
- Užší a vyšší: `STOREY` 320, okna `{ w: 95, gap: 85, sill: 0.05, h: 0.70 }`, 3–5 podlaží, úzké parcely.
- Fasáda obložená dlaždicemi azulejo: kreslit jako jemnou mřížku 15 × 15 cm ve dvou odstínech jedné barvy
  (bez motivů). Barvy obkladu: modrá na bílé `#3c6fa8`/`#eef1f4`, zelená `#3f7f6a`, žlutá `#e6c35c`,
  růžová `#d9a0a0`; ostění, římsy a nároží bílý kámen `#f0ece2`; sokl žula `#9c968c` 40 cm.
- Balkony kovové na každém patře (jako základ), střecha taška s přesahem (`beiral`, 30 cm, dvě řady tašek).
- Rozpoznání: stát PT; bez obkladu (omítka v základních barvách) u poloviny domů podle `seed` (obklad nemají všechny).

**Varianta severní Španělsko: prosklené galerie (`galeria`).** A Coruña, Ferrol, Lugo, Santander, Gijón, Oviedo,
Bilbao (miradory), Vigo. 1870–1930.
- Základ s tím, že od 1. patra je přes část nebo celé průčelí prosklená dřevěná galerie / mirador: skříň vyložená
  70–90 cm (`d` −80…0), výška celého podlaží, bílé rámy (`#f4f4f0`) v hustém rastru (svislé příčle po 40 cm,
  vodorovná příčel ve 2/3), pod ní deska a konzoly. Fasáda pod ní kámen `#b9b2a3` nebo bílá omítka.
- Střecha břidlice (`#4f5d6b`, Galicie) nebo taška, sklon 25–30°.
- Rozpoznání: stát ES a autonomní společenství Galicie, Asturie, Kantábrie, Baskicko (polohou, obrys z GISCO NUTS 2
  jako `laender.json` v Německu); jen u domů do 1930.

**Varianta Malta (`malta`).** Celá Malta a Gozo, domy 1600–1940 (Valletta, Sliema, Floriana, vesnická jádra).
- Globigerinový vápenec bez omítky: `#e2c891`, `#d8bc7e`, `#ead6a6`, `#dcc59a`; spáry kvádrů jemně tmavší.
- Plochá střecha s atikou 100 cm (žádná taška), 2–4 podlaží, `STOREY` 360, okna/dveře `{ w: 110, gap: 140,
  sill: 0.08, h: 0.66 }`, dřevěné okenice.
- **Gallarija**: uzavřený dřevěný balkon v 1. patře (u vyšších domů i ve 2.), vyložený 70 cm (`d` −70…0), výška
  ~0,8 podlaží, spodní třetina plná s lištami, nahoře okénka s lamelovými okenicemi, stříška; stojí na 2–3 kamenných
  konzolách. Barvy: zelená `#2f6b3f`, vínová `#9c2f2a`, modrá `#2f4f7a`, hnědá `#6b4a30`, výjimečně okrová.
- Rozpoznání: stát MT, rok neznámý (Malta nemá katastr s rokem) → `sikma`/`nizky`/`mestan` → `malta`; v OSM
  `building:material=limestone`/`stone` potvrzuje. Moderní bytové domy (Sliema, St Julian's) mají 8+ podlaží nebo
  `start_date` po 1960: tam ponechat.

**Varianta Kypr (`kypr`).** Staré město Nikósie (uvnitř benátských hradeb), Limassol, Larnaka, Pafos; 1850–1940.
- 1–2 podlaží (staré jádro), `STOREY` 380 (vysoké stropy), okna-dveře s dřevěnými okenicemi
  `{ w: 100, gap: 120, sill: 0.1, h: 0.62 }`.
- Pískovec (kamenné kvádry) `#d8c39a`, `#cdb48a` nebo bílá vápenná omítka `#efe9dc`; okenice a dveře zelené
  `#4f6f5a`, modré `#3d6f8f`, hnědé `#6b4a30`.
- Plochá střecha s nízkou atikou, nebo nízká taška (18°) u koloniálních domů 1880–1940; ve 2. patře malý kamenný
  nebo kovový balkon nad vchodem (vyložení 80, jen jeden).
- Rozpoznání: stát CY, domy DLS do 1940 nebo s 1–3 podlažími v jádru Nikósie / Limassolu (`oldTowns`); jinak
  nechat (Kypr je z velké části zástavba po 1960, ta má `povalecny`/`moderni`).

**Co kreslit malé (všechny varianty).** Balkonek s černým zábradlím na každém patře, okenice vedle oken (barva!),
plochá terasa s balustrádou nebo nízká taška s přesahem, teplá omítka. Galerie a gallarija jako výrazné prosklené
nebo barevné skříně do ulice. **Vynechat:** sgrafita, štukový dekor, vzory azulejí, květináče na každém balkoně
(jen občas, jako dnes `luck`).

**Rozpoznání a náhrady (souhrn).** ES, PT, IT, CY, MT (a FR v departementech 06, 13, 83, 30, 34, 11, 66, 2A, 2B;
MC u 1–4 podlaží): `sikma`, `mestan` a vícepodlažní `nizky` do 1930 nebo bez roku → `stredomori` (s variantou podle
státu a regionu). Španělský katastr (`towns/spain.js`, `spain-foral.js`) a BD TOPO dávají rok i podlaží; Itálie
a Portugalsko jen OSM `start_date` (řídké) → většinou „bez roku“.

**Rizika.** Italský sever (Bolzano!) je alpský: Jižní Tyrolsko má tyrolské domy s velkým přesahem, ne
středomořské; v `countries/IT.js` vyřadit provincii Bolzano (polohou). Turín má podloubí (už kreslené přes
`info.arcade`): balkony nad podloubím nechat. Moderní domy 60.–70. let se v jihoevropských centrech často
tváří podobně (balkony na každém patře); bez roku je nerozlišíme, ale jejich `povalecny` vzhled vychází z roku,
takže chyba je jen u domů bez roku. Kypr a Malta: pozor na moderní domy z vápence (Malta staví z vápence dodnes).

**Reference.**
- Mapillary 219770039783690 (Barcelona, Eixample, 2021), 1320680136689432 (Řím, 2026), 1000548286153643 (Turín,
  via Po, podloubí), 1481375219031600 (Porto, Rua de Santa Catarina: kovové balkony, obklad), 740469267898184
  (Valletta: vápenec a gallarija vpravo), 458697005207406 (Limassol, staré nízké domy).
- Commons: https://commons.wikimedia.org/wiki/Category:Balconies_in_Barcelona,
  https://commons.wikimedia.org/wiki/Category:Azulejos_in_Lisbon,
  https://commons.wikimedia.org/wiki/Category:Azulejos_in_Porto,
  https://commons.wikimedia.org/wiki/Category:Galerías_of_A_Coruña,
  https://commons.wikimedia.org/wiki/Category:Gallarija,
  https://commons.wikimedia.org/wiki/Category:Balconies_in_Valletta,
  https://commons.wikimedia.org/wiki/Category:Architecture_of_Cyprus

---

## 3. Severomořský cihlový dům (`cihlovy`): štít do ulice a římsový dům

**Kde a kdy.** Nizozemsko, Flandry (Gent, Bruggy, Antverpy), i Brusel u starších domů, severoněmecká hanzovní města
(do budoucna). Dvě podoby, které je nutné rozlišit (ověřeno na fotkách Amsterdamu: v ulicích 19. století převládá
římsový dům, ne štít):
- **Štítový dům (`trapgevel`, `halsgevel`, `klokgevel`)**: 1600–1800, historická jádra (Amsterdam uvnitř
  Singelgrachtu, Leiden, Haarlem, Delft, Gent, Bruggy).
- **Římsový dům (`lijstgevel`)**: 1750–1920, rovná cihlová fasáda zakončená dřevěnou římsou, za ní sedlová střecha
  hřebenem kolmo k ulici nebo plochá; řadová zástavba 19. století (De Pijp, Oud-West, Haag, Rotterdam,
  Antverpy-Zurenborg).

**Proporce (obě).**
- Úzká parcela (5–7 m), hluboký dům. `STOREY` 310 (kanálové domy až 350), přízemí × 1,2; `DEFAULT_FLOORS` 4
  (3–5).
- Okna velká posuvná (schuifraam), bílé rámy, v líci fasády: `{ w: 110, gap: 50, sill: 0.18, h: 0.66 }` (mezi
  okny jen úzké pilíře, to je typický znak).
- Sokl `[50, "#5b5f62"]` (modrý kámen, hardsteen); u kanálových domů schodiště (stoep) k vyvýšenému přízemí:
  6–8 stupňů z ulice s kovovým zábradlím, kreslit jako u `kostka` (schody a zábradlí), ale z ulice (`d < 0`).
- Bez balkonů do ulice (v 19. stol. jen výjimečně francouzský balkonek).
- **Štítový dům**: hřeben kolmo k ulici (jako `statek`: střecha jako pás tašek nebo břidlice v pohledu z boku),
  sklon 50–60°, krytina černá glazovaná taška `#3f4142` nebo břidlice `#50585e`. Štít je v líci ulice; v pohledu
  z boku by se jevil jen jako svislá deska. **Doporučená licence** (stejná jako okna průčelí na boční stěně):
  vykreslit siluetu štítu nad římsou jako obrys pásu (vrchol uprostřed pásu, `d = 200`), stupně (trapgevel, 3–5
  stupňů po ~60 cm), krk s volutami (halsgevel) nebo zvon (klokgevel) podle `seed`; na vrcholu kladkový trám
  (hijsbalk) vyložený 80 cm do ulice a pod ním okno/dvířka půdy. Tuto licenci potvrdit s Bárou (alternativa bez
  licence: jen trám a deska štítu přečnívající nad hřeben o 60–100 cm).
- **Římsový dům**: hřeben kolmo k ulici nebo plochá střecha, v pohledu z boku je vidět rovná atika/římsa: dřevěná
  římsa s konzolkami vyložená 35 cm (bílá `#f4f2ec` nebo tmavě zelená), u nás jako `sikma` hlavní římsa, ale bílá
  a mělčí; nad ní nic nebo nízká mansarda s vikýřem (Haag).
- Cihly: vodorovné řádky jako u továrny (`factory`, `z += 30` → u domu 8–10 cm spáry nejsou vidět, kreslit řádky
  po 30 cm jemně), překlady oken z cihel nebo pískovce `#d8cfb5`.

**Barvy.** Cihla: `#8a3f2c`, `#a24f35`, `#6b3a2c` (tmavě hnědá, Amsterdam), `#b65d3f`, `#7a4a3a`; ve Flandrech
i bíle natřená omítka `#ece8dc` a krémová `#e6dcc0`. Rámy bílé `#f4f2ec`, dveře tmavě zelené `#23382c` nebo černé
`#1f2224`, pískovcové detaily `#d8cfb5`, sokl `#5b5f62`, krytina `#3f4142` / `#50585e`, červená taška
`#b0553b` (Flandry).

**Co kreslit malé.** Velká bílá okna těsně vedle sebe v hnědé cihle, stoep se zábradlím, silueta štítu s trámem
(štítový), bílá dřevěná římsa (římsový). **Vynechat:** kotvy ve zdi (muurankers; snad jen 2 tečky), ornament štítu,
vitráže nadsvětlíků.

**Rozpoznání z dat.**
- Stát NL; BE jen ve Flandrech a Bruselu (polohou; Valonsko má kamenné a omítané domy, spíš `haussmann`/`sikma`).
- BAG `bouwjaar` (`towns/netherlands.js` dává `built`) a 3D BAG střechu: do 1800 a hřeben kolmo k ulici (osa
  domu `info.axis` kolmo k ulici a sedlová střecha 3D BAG) → štítový; 1800–1920 → římsový. Bez roku (Belgie:
  GRB rok nemá) → římsový, štítový jen v `oldTowns` (Gent, Bruggy, Antverpy, Brusel Grand-Place) a u úzkého domu.
- OSM `roof:shape=gabled` s osou kolmo k ulici zvyšuje štít.
- Nahrazuje `sikma`, `mestan`, vícepodlažní `nizky` do 1920. Amsterdamská škola (1915–1935, expresivní cihla)
  zůstává `funkce`/jiný budoucí vzhled.

**Rizika.** Rok BAG je u starých domů často „1005“ nebo zaokrouhlený (filtr `> 1005` už je v kódu): rok 1600 vs. 1800
je nejistý, štít podle roku chybuje u přestavěných domů (mnoho štítů dostalo v 18. a 19. stol. římsu).
Haag a Rotterdam mají hodně omítaných domů. Belgické domy 1900–1930 (art nouveau, eklektismus) jsou často
z kamene a omítky: s cihlou je to přijatelná zkratka, ne pravda.

**Reference.**
- Mapillary 924671073629050 (Herengracht: cihla, stoep, 2026), 428827986353408 (De Pijp: římsové domy, 2024),
  902757790284340 (Gent, Graslei: stupňovité štíty, 2020).
- Commons: https://commons.wikimedia.org/wiki/Category:Neck_gables_in_Amsterdam,
  https://commons.wikimedia.org/wiki/Category:Stepped_gables_in_the_Netherlands,
  https://commons.wikimedia.org/wiki/Category:Graslei

---

## 4. Estonsko

Estonsko má `socialistLooks: true` (panelová sídliště Lasnamäe, Mustamäe), takže regionální vzhledy se týkají jen
domů před 1940. Tři vzhledy:

### 4a. Hanzovní kamenný dům se štítem (`hanza`)
- **Kde a kdy.** Staré město Tallinnu (Vanalinn, uvnitř hradeb), kousky v Tartu, Pärnu, Haapsalu; 1300–1700,
  fasády často přestavěné v 18.–19. století (omítnuté, okna zvětšená).
- **Proporce.** 2–4 podlaží (`DEFAULT_FLOORS` 3), štít do ulice jako 3 (stejná kresba): vysoký štít 1–2 podlaží
  nad římsou, sklon 55–60°, taška `#b0553b`/`#8f3f2b`. Přízemí vysoké (velká síň, `diele`): `ground` = podlaží × 1,4
  (`STOREY` 320). Okna menší: `{ w: 80, gap: 80, sill: 0.3, h: 0.48 }`; v přízemí velký portál s obloukem (vápenec,
  `arch`). Ve štítu půdní dvířka nad sebou a kladkový trám (jako 3), štít hladký s malými okénky, ne stupňovitý
  (stupně jen u několika gotických domů; `seed` 1 z 4).
- **Barvy.** Omítka: bílá `#efeee6`, okr `#e2c27a`, světle růžová `#e6b8a6`, šedá `#c8c4bb`, světle zelená
  `#c9d4b4`; vápencový portál a sokl `#bdb6a4`.
- **Rozpoznání.** Stát EE a `oldTowns` Tallinn (59.4370, 24.7450; 0,45 km) / Tartu (58.3805, 26.7225; 0,35 km);
  `sikma`/`mestan`/`nizky` → `hanza`. Mimo jádra nikdy.
- **Riziko.** Na fotce Pikk ulice (Mapillary) je mnoho domů okapem do ulice (přestavby 18.–19. stol.): zhruba
  polovina by měla dostat `sikma` s pastelovou omítkou, ne štít; volit podle osy domu (`info.axis`: hřeben kolmo
  → štít) a jinak `sikma`.

### 4b. Tallinnský dům, „Tallinna maja“ (`tallinnamaja`)
- **Kde a kdy.** Kalamaja, Pelgulinn, Kassisaba, Uus Maailm, Kopli (Tallinn), 1920–1940. Dvoupodlažní nebo
  třípodlažní nájemní dům: kamenné (omítnuté) přízemí, dvě dřevěná patra, prosklené schodiště uprostřed fasády nebo
  na boku, nízká sedlová střecha.
- **Proporce.** `STOREY` 290, `DEFAULT_FLOORS` 3; přízemí omítnuté (barva soklu přes celé přízemí, jako bosáž
  `sorela`, ale hladká), patra z vodorovných prken (řádky po 12 cm, jemně tmavší). Okna
  `{ w: 90, gap: 80, sill: 0.3, h: 0.5 }`, bílé šambrány prken. Střecha sedlová 25–30°, hřeben rovnoběžně
  s ulicí, přesah 45 cm, plech šedý `#7d8387` nebo červený `#8f3f2b`; nárožní lizény z prken bílé.
- **Barvy.** Prkna: okr `#d9b36a`, světle zelená `#a9bf98`, šedomodrá `#8ea4b3`, světle žlutá `#e9d79a`, hnědá
  `#8a6a4a`, šedozelená `#9aa596` (fotka Kalamaja); přízemí `#cfc6b0`; lišty `#f2efe6`.
- **Co kreslit malé.** Rozdíl kamenné přízemí / dřevěná patra, vodorovná prkna, bílé lišty a šambrány. **Vynechat:**
  prosklené schodiště (v pohledu z boku nečitelné), řezbu.
- **Rozpoznání.** Stát EE, 2–3 podlaží, rok 1900–1940 (OSM `start_date`; ETAK rok nemá, Stavební registr EHR ho
  má: `esmane kasutuselevõtt`, ověřit dostupnost pro prohlížeč) nebo OSM `building:material=wood`; bez roku jen
  v `oldTowns`-podobném seznamu čtvrtí (Kalamaja, Pelgulinn, Kassisaba, Tartu Supilinn a Karlova) jako polygon
  nebo střed + poloměr. Nahrazuje `sikma` a `nizky` s 2–3 podlažími.
- **Riziko.** Kamenné domy funkcionalismu (1930s, „Tallinn funkis“) mají stejný počet podlaží: bez materiálu nebo
  roku je chyba ~30–40 %. Proto bez dat jen ve vyjmenovaných čtvrtích.

### 4c. Dřevěný dům (`drevak`, sdílený se Skandinávií, viz 5b)
- Estonské dřevěné rodinné a předměstské domy (Nõmme, Tartu, Pärnu, Haapsalu): 1–2 podlaží, prkna, pastelové barvy
  jako 4b, sedlová střecha. Rozpoznání: `familyKind` (vila/statek/nizky) v EE s `building:material=wood` nebo do
  1940 → `drevak`.

**Reference.**
- Mapillary 1814750395901162 (Tallinn, Pikk, 2025), 1230144251896536 (Kalamaja, dřevěné domy, 2025).
- Commons: https://commons.wikimedia.org/wiki/Category:Pikk_tänav_(Tallinn),
  https://commons.wikimedia.org/wiki/Category:Kalamaja,
  https://commons.wikimedia.org/wiki/Category:Kassisaba,
  https://commons.wikimedia.org/wiki/Category:Supilinn,
  https://commons.wikimedia.org/wiki/Category:Wooden_houses_in_Estonia

---

## 5. Skandinávie (SE, NO, DK, FI; do budoucna)

Zatím nemáme státní moduly ani dlaždice. Vzhledy navrhuji tak, aby šly sdílet s Estonskem.

### 5a. Kamenné město: omítaný činžák (`stenstad`)
- **Kde a kdy.** Stockholm (Södermalm, Östermalm, Vasastan), Göteborg (landshövdingehus má kamenné přízemí a
  dřevěná patra, viz 5d), Helsinky (Kruununhaka, Punavuori, Kallio), Turku, Oslo (Grünerløkka, Frogner, „bygård“),
  Bergen centrum; 1870–1930.
- **Proporce.** `STOREY` 330, přízemí × 1,2, `DEFAULT_FLOORS` 5 (4–6). Okna `{ w: 100, gap: 90, sill: 0.27,
  h: 0.56 }` (blízko `sikma`), dvoukřídlá, bílé nebo hnědé rámy. Sokl `[60, "#8f8b86"]` (žula). Střecha sedlová
  25–35°, krytina **plech** natřený černě `#3b3d3f` nebo červenohnědě `#7a3b2e`, u význačných domů měď
  `#6f9f8a`; drážky plechu svisle po 60 cm. Na okapu **sněhová zábrana** (snöräcke: tenké zábradlí 30 cm podél
  okraje) a střešní lávka / poklopy, střešní vikýře. Přesah malý (20), hlavní římsa 30. Jugend domy (1900–1915):
  arkýř nebo malý balkon s kovovým zábradlím v 1–2 patrech (vyložení 60), jinak hladké průčelí.
- **Barvy.** Okr `#e2b766`, lososová `#e0a184`, světle zelená `#b9c9a4`, šedá `#cfcabf`, světle žlutá `#ecd9a0`,
  světle růžová (Helsinky) `#e7c3b0`, šedomodrá `#b4c0c8`. Lišty a šambrány `#efe9dd`.
- **Co kreslit malé.** Plechová střecha s drážkami a sněhovou zábranou (to nejvíc odliší od `sikma` s taškou),
  pastelová omítka, granitový sokl. **Vynechat:** štukový dekor, vstupní portály.
- **Rozpoznání.** Stát SE/NO/FI, `sikma`/`mestan` do 1930 nebo bez roku ve městech; `roof:material=metal|copper`
  potvrzuje. Nahrazuje `sikma` (je to v podstatě `sikma` s jinou krytinou, paletou a sněhovou zábranou).
- **Data.** Rok: Finsko (Helsinky nejspíš mají otevřený stavební registr s rokem dokončení, ověřit; celostátní DVV ne), Švédsko
  (Lantmäteriet budovy rok nemají; Stockholm otevřená data ověřit), Norsko (FKB-Bygning a Matrikkelen: ověřit
  licenci a rok). Do té doby OSM `start_date`.

### 5b. Malovaný dřevěný dům (`drevak`)
- **Kde a kdy.** Venkov a maloměsta celé Skandinávie a Finska, předměstí; 1750–1950. Samostatný dům (vila, statek),
  1–2 podlaží. Falunská červeň je hlavně Švédsko a Finsko venkov; ve městech okr a žlutá, v Norsku bílá.
- **Proporce.** `STOREY` 270, `DEFAULT_FLOORS` 2 (1–2), okna `{ w: 90, gap: 110, sill: 0.32, h: 0.45 }`
  s bílým rámem a šambránou, dvoukřídlá se šesti tabulkami (dvě příčle). Obklad svislý (prkno a lišta, lišty po
  25 cm) ve Švédsku, vodorovný ve Finsku a Norsku (podle `country`). Bílé nárožní lizény (20 cm), bílé čelní prkno
  na přesahu. Střecha sedlová 30–40°, přesah 45 cm, taška `#b0553b` nebo černý plech `#2e3133`. Sokl kamenný 40
  `#6e6b66`. Malá zádveří se štítkem (farstukvist) u dveří: stříška se štítkem a 2 sloupky, vyložená 120 cm (výrazné
  i malé).
- **Barvy.** Falunská červeň `#8d2a1e` (tmavší `#7f2b1f`), okr / žlutá `#d9a441`, `#e3c06a`, bílá `#f2f0ea`,
  světle šedá `#d5d3cc`, světle zelená `#b5c8a0`; lišty bílé `#f6f4ee` (u bílého domu šedé nebo zelené).
- **Rozpoznání.** Stát SE/NO/FI/DK (DK jen venkov, Bornholm) a EE (4c): `familyKind` → `vila`, `statek`, `nizky`
  do 1950 nebo bez roku; `building:material=wood` silně potvrzuje; `novyrd`/`kostka` zůstávají (po 1960 jsou domy
  jiné, i když dřevěné; dánské 60.–70. léta cihla). Nahrazuje `vila` a `statek` (u `statek` zachovat štít do ulice).
- **Riziko.** Ve Finsku jsou poválečné typové domy (rintamamiestalo 1945–60) také dřevěné, 1,5 podlaží se strmou
  střechou: nevadí, jsou to `drevak` s vyšší střechou (sklon 45°). Švédská předměstí 1930–60 mají omítané vily,
  bez materiálu chyba.

### 5c. Dánský cihlový dům (`dansky`)
- **Kde a kdy.** Kodaň (Nørrebro, Vesterbro, Østerbro, Frederiksberg), Aarhus, Odense: činžovní domy 1870–1930,
  4–5 podlaží; a řadové domky (Nyboder: žluté, 2 podlaží, taška; „Kartoffelrækkerne“ cihla).
- **Proporce (činžák).** `STOREY` 300, přízemí × 1,1, `DEFAULT_FLOORS` 5. Okna `{ w: 95, gap: 75, sill: 0.28,
  h: 0.56 }`, bílé rámy. Cihelná fasáda (řádky jako 3), římsy a pásy z cihel nebo omítnuté světlé
  `#ece5d5`. Střecha mansardová nebo sedlová 45°, břidlice `#4f5960` nebo červená taška `#b65a3c`, vikýře (kviste)
  bílé. Někdy francouzské balkonky. Přízemí s obchody (fotka Istedgade).
- **Proporce (řadový domek).** `nizky` s dánskými barvami: okr `#e7b54b` (Nyboder), červená taška, bílé rámy,
  `STOREY` 270, 2 podlaží; dveře z ulice.
- **Barvy.** Červená cihla `#a64b33`, `#9a4430`, žlutá cihla (Kodaň, gule mursten) `#d7b46a`, `#cfa95f`,
  omítka světlá `#ece5d5`, okr `#e7b54b`; rámy `#f6f4ee`.
- **Rozpoznání.** Stát DK; rok i materiál z BBR (Bygnings- og Boligregistret přes Datafordeleren: rok výstavby,
  materiál vnějších stěn a krytiny; ověřit, zda jde bez klíče a s CORS, jinak statický výtah při nasazení).
  `sikma` do 1930 → `dansky`, materiál stěn omítka → `stenstad` (s dánskou krytinou). Nahrazuje `sikma` a řadový `nizky`.
- **Poznámka.** Dánský dům je technicky `cihlovy` (3, římsový) s vyšším počtem podlaží a mansardou: sdílet kresbu.

### 5d. Finský / severský dřevěný městský dům (`puukaupunki`)
- **Kde a kdy.** Dřevěná města a čtvrti: Porvoo, Rauma, Loviisa, Kokkola, Turku Port Arthur, Helsinky Puu-Vallila
  a Käpylä, Tampere Pispala; Norsko Trondheim Bakklandet, Bergen, Stavanger; Švédsko Eksjö, Gamla Linköping (muzeum),
  Göteborg landshövdingehus (kamenné přízemí + 2 dřevěná patra: kresba 4b). 1800–1940.
- **Proporce.** 1–2 podlaží (`DEFAULT_FLOORS` 1, Norsko 2), **okapem do ulice** (Finsko; hřeben rovnoběžně s ulicí),
  dům na hranici parcely, vedle něj vrata do dvora (portti). `STOREY` 290, okna `{ w: 90, gap: 100, sill: 0.33,
  h: 0.47 }` se zdobenými šambránami; vodorovná prkna, nárožní lizény, střecha 25–30° plech červený `#8d3b2c`
  nebo šedý `#7d8387`, přesah 40.
- **Barvy.** Žlutá `#e7c873`, světle zelená `#b5c8a0`, světle modrá `#a8bccc`, červená `#9a3a2a`, okr `#d9a441`,
  růžová (Norsko) `#d9a6a0`; lišty bílé.
- **Co kreslit malé.** Totéž co 4b bez kamenného přízemí. **Vynechat:** vrata a ploty (patří k okraji, ne k domu).
- **Rozpoznání.** Stát FI/NO/SE, 1–2 podlaží, dřevo (`building:material=wood`) nebo rok do 1940 v `oldTowns`
  (Porvoo Vanha Porvoo, Rauma Vanha Rauma: UNESCO, OSM `heritage`); nahrazuje `nizky` a `mestan`.
- **Poznámka.** Kresba je 4b (`tallinnamaja`) s `ground` jako dřevěné patro: sdílet.

**Reference (Skandinávie).**
- Mapillary 479878443302741 (Helsinky, Kruununhaka: pastelové činžáky, 2021), 1667589560667805 (Kodaň, Istedgade:
  cihlové činžáky, 2024), 732884379770128 (Kodaň, Nyhavn: barevné řadové domy, 2025), 1255200656380452
  (Trondheim, Bakklandet: dřevěné domy, 2025).
- Commons: https://commons.wikimedia.org/wiki/Category:Kruununhaka,
  https://commons.wikimedia.org/wiki/Category:Strandvägen,
  https://commons.wikimedia.org/wiki/Category:Södermalm,
  https://commons.wikimedia.org/wiki/Category:Grünerløkka,
  https://commons.wikimedia.org/wiki/Category:Falu_red,
  https://commons.wikimedia.org/wiki/Category:Wooden_houses_in_Sweden,
  https://commons.wikimedia.org/wiki/Category:Wooden_houses_in_Finland,
  https://commons.wikimedia.org/wiki/Category:Wooden_houses_in_Norway,
  https://commons.wikimedia.org/wiki/Category:Old_Porvoo,
  https://commons.wikimedia.org/wiki/Category:Old_Rauma,
  https://commons.wikimedia.org/wiki/Category:Nyboder,
  https://commons.wikimedia.org/wiki/Category:Istedgade,
  https://commons.wikimedia.org/wiki/Category:Bakklandet,
  https://commons.wikimedia.org/wiki/Category:Eksjö

---

## 6. Co dalšího je v ulicích běžné (zatím jen poznámka)

- **Alpský dům** (Jižní Tyrolsko, Tyrolsko, Švýcarsko, Bavorsko): velký přesah střechy 120+ cm, dřevěné balkony
  s květinami po celé délce, omítnuté přízemí. Rakousko, Švýcarsko a Bolzano dnes dostávají `sikma`/`vila`;
  kandidát na další vzhled.
- **Belgický eklektický řadový dům** (1880–1930, Brusel, Antverpy): úzký, 3–4 podlaží, kámen a cihla, arkýř
  v 1. patře. Pokrytý zatím `haussmann` s malým počtem podlaží nebo `cihlovy`.
- **Amsterdamská škola** (1915–1935): expresivní cihla, zaoblená nároží; dnes `funkce`. Až podle zájmu.
- **Italský palazzo s podloubím** (Bologna, Turín, Padova): podloubí už kreslíme (`info.arcade`), stačí `stredomori`.
- **Sever Francie a Lille**: cihla jako 3 (Flandry) → v FR departementy 59, 62 použít `cihlovy`, ne Haussmann
  (kromě bulvárů Lille s 5+ podlažími).

---

## Doporučené pořadí kreslení

1. **`stredomori`** (základ ES/IT/PT): pokrývá nejvíc řezů (Španělsko má katastr s rokem, Itálie a Portugalsko
   dnes padají do `sikma`). Hned s parametry pro okenice, rolety a terasu/tašku.
2. **`haussmann`**: Paříž a Brusel jsou nejčastější řezy ve Francii a Belgii; kresba je `sikma` s mansardou
   (kód existuje) + balkony + bosáž, tedy levná.
3. **`cihlovy`** (římsový dům, pak štítový): NL má rok z BAG, rozpoznání je spolehlivé; štít potřebuje rozhodnutí
   o licenci siluety.
4. **Varianty jihu**: `azulejo` (jen jiná výplň stěny), `galeria`, `malta` (gallarija), `kypr`.
5. **Estonsko**: `tallinnamaja` a `drevak`, pak `hanza` (sdílí kresbu štítu s `cihlovy`).
6. **Skandinávie** až se státními moduly: `stenstad` (parametr `sikma`), `drevak`, `dansky` (parametr `cihlovy`),
   `puukaupunki` (parametr `tallinnamaja`).

## Které vzhledy sdílejí jednu kresbu (s parametry)

| Kresba (základ) | Vzhledy | Parametry, které se liší |
|---|---|---|
| `sikma` (sedlová / mansarda, římsy) | `haussmann`, `stenstad` | krytina (zinek, plech + sněhová zábrana), `roofRows`, souvislé balkony na vybraných patrech, bosáž přízemí, okna k podlaze, paleta |
| nová `stredomori` (balkon na každém patře, okenice) | `stredomori`, `azulejo`, `galeria`, `malta`, `kypr` | střecha (terasa / taška), výplň stěny (omítka / azulejo / vápencové kvádry), předsazená skříň (žádná / galerie / gallarija), okenice (persiane / roleta / dřevěné), počet podlaží |
| nová `stit` (hřeben kolmo k ulici, štít v líci, jako `statek`) | `cihlovy` štítový, `hanza` | tvar štítu (stupně, krk, zvon, hladký), materiál (cihla / omítka), trám, výška přízemí |
| nová `cihla` (řádky cihel, velká bílá okna, římsa) | `cihlovy` římsový, `dansky` | podlaží, mansarda s vikýři, barva cihly, stoep |
| nová `drevo` (prkna, lizény, bílé šambrány) | `tallinnamaja`, `puukaupunki`, `drevak` | kamenné přízemí ano/ne, svislá/vodorovná prkna, zádveří, samostatný dům vs. v řadě, krytina |

Tedy 1 rozšíření existující kresby (`sikma`) a 4 nové kresby (`stredomori`, `stit`, `cihla`, `drevo`) pokryjí
všech 14 vzhledů. Každý přidaný vzhled ověřit na řezech s fotkou z ulice (skill `mereni-presnosti`, nejen „vypadá
to dobře“) a zkontrolovat, že se nezměnil žádný český řez (vzhledy jsou jen za `houseLook` států).
