# Regionální vzhledy domů v Evropě (23. 11. 2026)

Podle specifikace `docs/house-types-europe.md` (ověřené na fotkách z ulice). 14 nových vzhledů domu (celkem 32),
ručně volitelných všude, automaticky jen tam, kde to řekne pravidlo státu.

## Zapojení

- `pilot/public/house-looks.js`: pravidla (bez dotazů za běhu, stará města a velká města jako středy s poloměry, regiony
  jako hrubé obdélníky). Stát je volá z `countries/<ISO>.js` `houseLook` a `houseDetails` (výchozí `null` v `default.js`).
- `profile.js buildingStyle`: po `westernLook` (nebo socialistické větvi) se zeptá `country.houseLook(style, info, n, city)`;
  regionální vzhled nahrazuje jen `sikma`, `mestan`, `nizky` (a `vila`/`statek` u dřevěných domů), nikdy vzhled s vlastním
  datem nebo funkcí. Výjimka: na Maltě a Kypru plochý dům bez roku (`funkce` jen z OSM `roof:shape=flat`) do 4 podlaží.
- `derive.js buildingAt` čte `building:material` (`info.material`); `app.js` si nechává místo domu zaokrouhlené na metr
  (`info.at`; dřív se `point` po dotazech mazal a pravidla podle místa by v aplikaci nefungovala).
- Česko, Slovensko a Polsko beze změny: `houseLook` nemají; ověřeno porovnáním výstupu `buildingStyle` a SVG pro
  asi 60 000 kombinací domů v Praze, Brně, „cesko“, Jihlavě, Plzni, na Slovensku a v Polsku proti HEAD (shodné), a
  `node evaluation/ortofoto-osm/regrese.mjs` před a po: shodné.

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
- Skript `render.mjs` (`node evaluation/budovy-regiony/render.mjs [jih|sever|drevo|stity]`; Quick Look + ImageMagick).

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
