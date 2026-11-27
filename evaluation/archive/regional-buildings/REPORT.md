# Regionální vzhledy domů v Evropě (23. 11. 2026)

Podle specifikace `docs/house-types-europe.md` (ověřené na fotkách z ulice). 14 nových vzhledů domu (celkem 32),
ručně volitelných všude, automaticky jen tam, kde to řekne pravidlo státu.

## Zapojení

- `app/public/house-looks.js`: pravidla (bez dotazů za běhu, stará města a velká města jako středy s poloměry, regiony
  jako hrubé obdélníky). Stát je volá z `countries/<ISO>.js` `houseLook` a `houseDetails` (výchozí `null` v `default.js`).
- `profile.js buildingStyle`: po `westernLook` (nebo socialistické větvi) se zeptá `country.houseLook(style, info, n, city)`;
  regionální vzhled nahrazuje jen `sikma`, `mestan`, `nizky` (a `vila`/`statek` u dřevěných domů), nikdy vzhled s vlastním
  datem nebo funkcí. Výjimka: na Maltě a Kypru plochý dům bez roku (`funkce` jen z OSM `roof:shape=flat`) do 4 podlaží.
- `derive.js buildingAt` čte `building:material` (`info.material`); `app.js` si nechává místo domu zaokrouhlené na metr
  (`info.at`; dřív se `point` po dotazech mazal a pravidla podle místa by v aplikaci nefungovala).
- Česko, Slovensko a Polsko beze změny: `houseLook` nemají; ověřeno porovnáním výstupu `buildingStyle` a SVG pro
  asi 60 000 kombinací domů v Praze, Brně, „cesko“, Jihlavě, Plzni, na Slovensku a v Polsku proti HEAD (shodné), a
  `node evaluation/ortho-osm/regression.mjs` před a po: shodné.

| vzhled | kde (stát, pravidlo) |
|---|---|
| haussmannovský dům | FR, MC, LU, Brusel: OSM mansarda; 1850–1930 a 5+ podlaží; bez roku 5–8 podlaží v uzavřeném bloku velkého města (Paříž uvnitř Maréchaux, Lyon, Marseille…); LU jen s rokem; Brusel i 3–4 podlaží bez dlouhých balkonů |
| středomořský městský dům | ES, IT (mimo provincii Bolzano), PT, francouzské Středomoří, MC do 4 podlaží; do 1930 nebo bez roku, 2+ podlaží; terasa podle OSM `roof:shape`, jinak taška (ES: Katalánsko a jih terasa, jinde napůl), ES rolety a pruhované markýzy |
| portugalský dům s azulejos | PT, polovina domů podle místa (zbytek středomořský) |
| dům s prosklenou galerií | ES: Galicie, Asturie, Kantábrie, Baskicko |
| maltský dům s gallarijí | MT do 1940 nebo bez roku, ne 8+ podlaží ani po 1960 |
| kyperský kamenný dům | CY do 1940, bez roku do 3 podlaží ve starých jádrech (Nikósie v hradbách, Limassol, Larnaka, Pafos) |
| cihlový dům s římsou | NL; BE ve Flandrech a v Bruselu (domy před 1850); do 1920, Valonsko beze změny |
| tallinnský dům | EE, 2–3 podlaží: 1900–40, dřevo z OSM, nebo bez roku v dřevěných čtvrtích (Kalamaja, Pelgulinn, Kassisaba, Uus Maailm, Kopli, Supilinn, Karlova) |
| malovaný dřevěný dům | EE: vila, venkovský dům, rodinný dům se dřevem nebo do 1940; severské státy (pravidlo) |
| severský omítaný činžák, dánský cihlový činžák, dřevěný městský dům | jen `nordicLook("SE"/"NO"/"DK"/"FI")` a `nordicDetails` pro budoucí `countries/SE.js` …, testované přímo |
| cihlový dům se štítem do ulice, hanzovní dům se štítem | jen s `?stit=1` (viz níže) |

## Kresba

Kreslí se ve stejném bočním pohledu jako ostatní domy (`profile.js drawPrahaBuilding`), čtyři nové kresby
(`stredomori`, `cihla`, `drevo`) a rozšíření činžáku (`sikma`: haussmann, stenstad):

- **haussmannovský**: světlý vápenec, zinková mansarda s vikýřem s obloučkem a řadou cihlových komínů, bosované vysoké
  přízemí s výkladcem, oknem mezipatra a obloukovými vraty, francouzská okna k podlaze, dlouhé kamenné balkony se
  železným zábradlím ve 2. a posledním patře, jinde francouzské balkonky.
- **středomořský**: teplé omítky, balkonek s železným zábradlím na každém patře (v 1. patře hlubší), lamelové okenice
  vedle oken (některé zavřené), korunní římsa, terasa s balustrádou a schodišťovou nástavbou nebo nízká taška s řadami
  korýtek; Španělsko rolety a markýzy. Varianty: azulejos (mřížka 15 cm a tečka vzoru, bílé nároží), galerie (bílé
  prosklené skříně přes patra, břidlice), Malta (vápencové kvádry, zelená/vínová/modrá gallarija na konzolách, plochá
  střecha s atikou), Kypr (pískovec nebo bílá omítka, barevné okenice, nízká atika, jeden balkon).
- **cihlový s římsou**: cihla s vazbou, velká bílá okna těsně u sebe s pískovcovým překladem, bílá dřevěná římsa na
  konzolkách, za ní pás střechy z černých tašek (hřeben kolmo k ulici), u každého druhého domu stoep se zábradlím.
  **Dánský**: červená nebo žlutá cihla, světlé římsy, střecha 45° s bílým vikýřem.
- **severský omítaný činžák**: pastelová omítka, plechová střecha (černá nebo červenohnědá) s žebry, sněhovou zábranou
  a lávkou, žulový sokl.
- **dřevěné**: prkna vodorovná (svislá s lištami ve Švédsku), bílé nárožní lizény a šambrány, šestitabulková okna;
  tallinnský dům s omítnutým přízemím a plechovou střechou; malovaný dům se zádveřím (farstukvist); barvy podle státu
  (falunská červeň ve Švédsku a Finsku, bílá v Norsku, estonské pastely).

Snímky (kresba aplikace, vlevo/vpravo dům ve stejné ulici, pro srovnání pražský činžák):
- `jih.png`: středomořský dům (Madrid, terasa a taška v Itálii), azulejos (Lisabon), galerie (A Coruña), Malta, Kypr,
  haussmannovský dům (Paříž 7 a 8 podlaží, Brusel 4),
- `sever.png`: cihlový dům s římsou (Amsterdam), dánský cihlový činžák, severský omítaný činžák,
- `drevo.png`: tallinnský dům, malovaný dřevěný dům (Švédsko, Estonsko), dřevěný městský dům (Finsko),
- `stity.png`: štíty (viz níže),
- `aplikace-*.png`: skutečné řezy v aplikaci ve velikosti aplikace (Paříž rue Charras: haussmannovský dům z BD TOPO
  7 podlaží bez roku; Amsterdam De Pijp: cihlové domy se stoepem; Madrid Plaza de San Miguel: středomořské domy).
- Skript `render.mjs` (`node evaluation/archive/regional-buildings/render.mjs [jih|sever|drevo|stity]`; Quick Look + ImageMagick).

## Štíty (čeká na Báru)

Bára 23. 11. 2026: nakreslit návrh, schválí po prohlédnutí. Severomořský štítový dům (`stit`: stupňovitý, krkový,
zvonový podle místa) a hanzovní dům (`hanza`: hladký štít, každý čtvrtý stupňovitý) mají pás střechy s hřebenem kolmo
k ulici, kladkový trám nad ulicí a s **`?stit=1`** obrys štítu nad bočním pohledem (jako by se štít otočil k nám),
s bílými krycími deskami, okny půdy a půdními dvířky. Bez přepínače se nic nemění: pravidla štítové vzhledy nedávají
(dům před 1800 s hřebenem kolmo k ulici je cihlový dům s římsou, v tallinnském Vanalinnu zůstává činžák), v nabídce
vzhledů nejsou a dům uložený se štítem se kreslí bez obrysu (jen štítová deska přečnívající hřeben a trám).
`stity.png`: každá podoba s obrysem, vedle pražský činžák, a poslední pole bez obrysu.

## Otevřené

- Rok mají jen katastry (ES, NL BAG, FR BD TOPO); Itálie, Portugalsko, Malta, Kypr, Estonsko většinou jen OSM
  `start_date`, takže rozhoduje „bez roku“ a místo. Regiony (francouzské Středomoří, sever Španělska, Flandry, Brusel,
  Bolzano) jsou obdélníky, ne hranice.
- Nepřeměřeno na řezech s fotkou (skill `mereni-presnosti`): zatím jen kontrola od oka proti fotkám ze specifikace.
- `TUNED_BUILDING` (domy bez podlaží a výšky se neberou) zůstává; sever Francie (cihla v departementech 59, 62),
  alpský dům a belgický eklektický dům podle specifikace jen poznámka.
- Dlaždice OSM nenesou `roof:material`, `building:colour`; přidání (specifikace bod 4) neprovedeno.
- Překlady popisků do 23 jazyků jsou strojové.

## Štíty přepracované a tři kola kritiky (23. 11. 2026)

### Štíty (`?stit=1`, výchozí kresba beze změny)

- Štít stojí na celé šířce stěny a schovává střechu: tmavý pás střechy ani komín za ním nejsou (střecha běží od ulice).
- Okna ve štítu jsou ve stejných sloupcích a stejně široká jako okna pater pod ním. Sloupce štítových domů jsou
  souměrné k ose štítu (`GABLE_AXES`: amsterdamský ±95 cm, hanzovní ±70 cm), kde se štít zúží, zůstane jedno okno
  v ose. Okno se do štítu dá, jen když se vejde i s rámem a lemem (žádné přesahy přes obrys).
- Štít nese nejvyšší podlaží (`roofRows = 1`): pod ním je o patro méně, výška domu odpovídá počtu NP; navrchu ještě
  půdní okno. Okna ve štítu bez truhlíků.
- Kladkový trám (čelem, se stříškou u amsterdamských domů a háčkem) je nad nejvyšším oknem v ose. V Tallinnu nad
  okny nakládací dvířka v ose a trám nad nimi; nic se nepřekrývá.
- Tvary: **stupňovitý** tři výrazné stupně s bílými kamennými krytinami, široký vrchol s kamennou koulí;
  **krkový** úzké hrdlo s pískovcovým frontonem (trojúhelník nebo oblouk podle místa) a esovitými pískovcovými
  klauwstukken se závitkem na ramenou; **zvonový** esovitě rozšířená pata, oblý vrchol s vázou, bílý lem;
  **hanzovní hladký** strmý trojúhelník přes celou šířku zdi, okno v ose a dvířka; **hanzovní stupňovitý** tři vyšší
  stupně, šedé krytiny.
- `stity.png` (každá podoba, vpravo dole výchozí kresba bez obrysu), `stity-foto.png` (kresba vedle fotky z Commons).

### Okna v podkroví a mansardě u ostatních nových vzhledů (stejný nedostatek)

- Haussmann a severský činžák: okna mansardy ve sloupcích pater pod ní (kde stojí mimo strmou plochu), každé ve
  vikýři (haussmannovský se segmentovým obloukem), mansarda zinková/plechová, boční vikýř u dolního okna; komíny
  jen na mělké horní ploše.
- Dánský činžák: vikýř v zadním sloupci oken, okno stejně široké. Tallinnský dům: kulaté okénko v ose zadního
  sloupce. Malovaný a finský dřevěný dům: okno ve štítu v zadním sloupci, stejně široké, bez truhlíku.
- Poválečný dům: okno ustoupeného podlaží v ose oken pod ním, před ním terasa se zábradlím.
- **České vzhledy mají stejný nedostatek, ale nejsou změněné** (výstup ČR, SR a PL musí zůstat stejný; k Bářinu
  schválení): pražský činžák s mansardou (`row()` rozmisťuje okna mansardy vlastním krokem), kulaté okno ve štítu
  činžáku (d = 200 cm, mimo sloupce), okno ve štítu malého domu (`RIDGE − 37,5`, šířka 75 cm proti 85–90 pod ním),
  ustoupená podlaží paneláků a typových domů (`row()`).

### Kritik, kolo 1 (6 vážných)

Vážné: balkony jen z boku (Haussmann bez dlouhých balkonů ve fasádě), nesouměrný stupňovitý štít a odtržené tmavé
pásky boku štítu, galerie v A Coruña jen úzký boční pás, maltská gallarija jen z boku, mansarda v barvě kamene
s okny jen v jedné ose. Střední/drobné: okna přes obrys štítu, „komín“ na vrcholu štítu, „radiátor“ na zvonovém štítu,
hanzovní hladký štít s příliš mnoha okny, popisky přes komíny, truhlíky u haussmannovských oken.
Opraveno: Haussmann má dlouhé balkony se zábradlím i podél stěny a francouzská okna se zábradlím místo truhlíků;
galerie pokrývá stěnu ve všech patrech; gallarija se otáčí přes roh na stěnu; mansarda zinková s vikýři v osách
oken; vypuštěn posunutý stín štítu; okna ve štítu s odstupem od obrysu (hanzovní hladký štít tím má jen okno
v ose a dvířka); kamenná koule a váza místo „komínu“ a „radiátoru“; esovité klauwstukken. Konvence aplikace
(balkony z boku, trojúhelník štítové zdi v řezu, nesouměrný štít rodinného domu s hřebenem v pásu) zůstává.

### Kritik, kolo 2 (3 vážné)

Vážné: dům se štítem o patro vyšší, než říká popisek; horní pásmo štítu užší než stěna (schod); haussmannovský
komín ve vzduchu před mansardou. Střední: boční vikýř mezi okny mansardy, popisky přes schodišťové nástavby, příliš
strmý hanzovní štít, zvonový štít jako láhev, hodně drobných stupňů u hanzovního štítu.
Opraveno: štít nese nejvyšší podlaží, pata štítu přes celou stěnu (hladký štít i přes stinný pruh řezu), komíny jen
na horní ploše, boční vikýř u dolního okna mansardy, výška středomořské ploché střechy počítá s nástavbou (popisek
nad ní), hanzovní hladký štít nižší (2 podlaží), stupňovitý 3 vyšší stupně, zvonový štít širší, pískovcové voluty.

### Kritik, kolo 3 (0 vážných)

Střední: stupňovitý štít jako „věžička“ (málo stupňů, úzký vrchol), popisky NP nesedí s řadami oken (štít má navíc
půdní okno), obytná okna s truhlíky ve štítech dřevěných domů, galerie A Coruña tmavá jako fotovoltaika, markýza
v Madridu jako ulomená trubka.
Opraveno: stupňovitý štít se širším vrcholem (1,8 m) a třemi stupni, truhlíky ve štítech pryč, galerie světlejší
s bílými rámy a příčkami nahoře, pískovcový fronton krkového štítu. Kritika skončila (bez vážných nálezů).

### Otevřené

- Úzký pás domu (4 m) omezuje štíty: amsterdamský stupňovitý štít má jen 3 stupně (5–7 by se se sloupci oken
  nevešlo), hanzovní štíty jsou strmější než ve skutečnosti (asi 72° proti 55–62°).
- Výchozí kresba štítových domů bez `?stit=1` (štítová deska a trám, pás střechy) zůstává, jak byla (kritik ji
  kritizoval: deska jako tyč, trám do prázdna); bez Bářina rozhodnutí neměněno.
- Ponecháno z kritiky: markýza v Madridu, kontrast azulejos v malé velikosti, konzoly pod gallarijou, kyperská
  nástavba (solární ohřívač), dánská francouzská zábradlí z boku, černý střešní světlík u domu s římsou, užší
  balkonové dveře poválečného domu, popisky NP u štítových domů (půdní okno nad nejvyšším NP se nepočítá).
- Fotky ke kritice: Wikimedia Commons (kategorie a hledání podle `docs/house-types-europe.md`), kritik je dostal
  jen jako obrázky spolu s kresbami.

Ověření: `buildingStyle` a SVG asi 63 000 kombinací domů v Praze, Brně, „cesko“, Jihlavě, Plzni, na Slovensku a
v Polsku proti HEAD shodné; `node evaluation/ortho-osm/regression.mjs` shodná; `npm test` prošel (377/377, na kopii
HEAD s touto změnou, protože v pracovním stromě rozpracované Slovinsko jiného workflow testy zatím shazuje).
Nové snímky: `mansarda.png` a `../postwar-buildings/povalecny.png` (`render.mjs povalecny|mansarda`).

## Okraj u řezu, souměrné štíty a okna za řezem (Bára 23. 11. 2026)

Po odstranění tmavého pásu u řezu (3d5dbe8) končila spousta kresby pořád 30 cm před ním (`EDGE - 30`). Opraveno v
`app/public/profile.js`, před a po: `../buildings-cz-windows/okraj2-pred-po.png` (vybrané české vzhledy, pak listy
stity, jih, sever, drevo, mansarda, povalecny vedle sebe).

- **Vzory a pásy stěny až k řezu**: cihelné vazby, azulejos, kvádry Malty a Kypru, prkna, rustika Haussmanna a sorely,
  sokly, kamenné přízemí tallinnského domu, pásy nad přízemím, římsy pater, obklad funkcionalismu, spáry paneláku,
  cihly a sokl továrny, plech a pásové okno haly, galerie A Coruñi, dlouhé balkony Haussmanna, ustoupené podlaží a
  atiky. Bílé nárožní prkno u řezu zmizelo (dům se tam neotáčí), u ulice zůstává. Obrys u řezu se nekreslí u žádného
  dílu (`box` u řezu obtáhne jen horní, přední a spodní hranu).
- **Štítové domy osově souměrné** (Bára: „musí být osově souměrné“): štít stojí na celé šířce stěny 0 … 4 m, osa
  v polovině (`GABLE_C = EDGE / 2`), bez schodu a bez čáry mezi stěnou a štítem. Okna všech pater, dveře (v předním
  sloupci) a okno přízemí, okna ve štítu, trám a nakládací dveře jsou souměrné k ose; souměrná je i cihelná vazba.
  Nesouměrné zůstává jen to u ulice: stoep, sklepní okno, hrana fasády.
- **Okno za řezem** (Bára: „u vnější strany řezu by nemělo být víc stěny než odpovídá velikosti zdiva mezi okny“):
  dům má svůj ořez (`clipPath`) na řezu a sloupce oken pokračují za zadním sloupcem ve stejné rozteči (`colAxes`),
  takže u řezu je buď kus dalšího okna, nebo pilíř nejvýš tak široký jako mezi okny. Schválené sloupce oken zůstaly
  na místě (přední a zadní), přibyl jen další sloupec; platí pro všechna patra, přízemí, mansardy a ustoupená
  podlaží. Vlastní skladby: panelák další okno panelu (spára mezi nimi), poválečný dům další okno s roletou,
  moderní dům okno v obkladovém panelu, kancelář a hala pásové okno přes řez, kostel třetí okno (opěrák mezi okny),
  továrna třetí okno. Okna ve štítu střechy a vikýře zůstávají po jednom (jsou ve střeše, ne v rytmu fasády).
  Funkcionalismus, škola a venkovský dům měly u řezu pilíř zhruba jako mezi okny, beze změny.
- **Varianta štítu na 2/3** (`?stit=2/3`, `LOOKS.gableCut`, k porovnání, výchozí zůstává celý souměrný štít): dům 6 m
  široký se třemi sloupci oken (1,4 / 3,0 / 4,6 m), v záběru jeho dvě třetiny od ulice s osou štítu a předním
  sloupcem, zbytek uřízne řez; šířky štítu se zvětší s domem. Snímek `stity-varianty.png`
  (`render.mjs stity-varianty`): každá podoba štítu celá a na 2/3, vedle pražský činžák.

Ověření: `node --test tests/house-looks.test.js tests/buildings.test.js` a celý `npm test` prošly (382/382).
