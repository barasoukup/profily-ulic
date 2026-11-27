# Ulice na mostě končí hranou mostovky, se zábradlím (26.–27. 11. 2026)

Bára 26. 11. 2026: „pokud je to na mostě, tak bych to ukončila hranicí té plochy. A ideálně dokreslila do profilu zábradlí.“
Navazuje na `../blind/ZPRAVA.md` (ulice na mostě nebere vodu a zeleň OSM pod sebou): odhad z ortofota a OSM neměl čím krajní
chodník ukončit a dorůstal do stropu 6 m (Brogade v Odense, Kościuszkův most v Krakově), a dvě souběžné konstrukce mostu
s vodou mezi nimi (Vilnius, w-9) kreslil jako jednu plochu.

## Co se udělalo

- **Plochy mostů v dlaždicích OSM.** Dlaždice dosud mostovky (`man_made=bridge`, polygony) nenesly. `tools/build_osm_data.sh`
  vyváží novou vrstvu `bridges`, `tools/build_osm_tiles.mjs` ji rozřeže po dlaždicích silnic jako zeleň (společný kód ve
  `tools/osm_areas.mjs`). Platí pro všechny státy. **Na produkci se projeví až po přestavbě balíků OSM** (workflow OSM tiles,
  všechny státy); balíky narostou málo (Rakousko 284,0 → 284,5 MB). Do té doby kód dělá totéž co dřív, jen kreslí zábradlí
  (níže). Na zkoušku jsou mostovky doplněné jen do místních balíků (`patch-pack.mjs`, osmium z výřezů Geofabriku).
- **Konec na hraně mostovky** (`pilot/public/ortho-osm.js` `deckSpans`, konec v `orthoOsmPolys`, strop v `trimToEnds`): jen
  u ulice na mostě a jen když mostovka OSM drží osu ulice (jinak OSM a jeho ulice nesouhlasí a nic se nerozhoduje). Kusy
  jedné mostovky rozřezané dlaždicemi se spojí. Krajní díl končí na hraně mostovky, která obsahuje krajní obrubu; hrana blíž
  než 1 m za obrubou se nebere (OSM nakreslilo jen vozovku). Druhá vozovka téže ulice na vlastní mostovce (stejné jméno nebo
  číslo, nebo bezejmenná jednosměrka téže třídy, do 20 m) patří k ulici, konec je pak na hraně její mostovky. Voda a zeleň
  pod mostem: pryč jen to, co leží pod mostovkou; mezera mezi dvěma mostovkami zůstane (w-9 teď má mezi vozovkami vodu
  7 m). Mapy povrchů (MTVU, BGT, planimetrie …) se nemění: mostovka působí jen v odhadu z ortofota a OSM.
  **Vypínač `?off=mostdeska`** (dřívější chování).
- **Zábradlí** (`bridgeRailings`, kresba `profile.js`): prvek `zabradli` (už existoval, s překladem ve 24 jazycích, nový text
  není) na vnějším okraji krajního dílu ulice na mostě, kde profil končí na hraně mostovky, nebo bez mostovky v datech tam,
  kde končí volným prostorem za chodníkem, stezkou, zelení či plochou. Ne u budovy, plotu, vody. Ve Stavu i v Návrhu z něj
  (odebratelný jako každý prvek). Kreslí se jako sloupek 1,1 m s madlem a středním madlem, uvnitř dílu. Do Streetmixu jako
  okraj „fence“ (Streetmix zábradlí nemá). Platí i nad mapami povrchů (MTVU apod.), díly se tím nemění.
  **Vypínač `?off=zabradli`.** Ve vzorku dostalo zábradlí 134 z 200 mostů (78 na obou stranách).

## Postup měření

- **Vzorek** (`sample.mjs`, semínko 20261127): 200 nových silničních mostů z místních balíků 15 států (LT, PT, DE, NL, SI, CH,
  AT, FI, ES, PL, BE, FR, IT, LU, EE; ne CZ/SK, kde balík mostovky zatím nemá, a DK, jehož ortofoto chce klíč), jen mosty,
  jejichž střed leží na mostovce OSM, s fotkou Mapillary do 30 m, nejméně 150 m od dřívějších vzorků. 57 nad vodou, 143 jiné.
  Kolik mostů mostovku v OSM vůbec má: z dřívějšího vzorku 92 mostů 73 (79 %, `coverage.mjs`).
- **Sběr** (`collect.js` ve stránce aplikace, `?osm=balik&ai=0` kvůli opakovatelnosti, AI obruby by řez měnily náhodně):
  B = teď, A = `?off=mostdeska,zabradli`. Řádky `results/rows.json`. Stejně 149, jiný profil 46, šum 3, bez profilu 2.
- **Slepé A/B** dvěma posuzovateli (Sonnet) jako `../blind/` (`../blind/packages.mjs`, `POKYN-AB.md`: nejdřív složení, pak
  šířky): 40 dvojic, klíč `results/key.json`, verdikty `results/p*-a|b.jsonl`, hash obrázků `results/images.sha256`
  (obrázky v `evaluation/bridge-water/data/edge/`, git je ignoruje). Krajní chodníky změřili na ortofotu dva další měřiči
  (`../blind/POKYN-CHODNIK.md`, `results/m*-a|b.jsonl`). Výsledky `results/score.md`
  (`node ../blind/score.mjs results sample.json results/rows.json B A …`).

## Výsledky

**Složení (slepé A/B, 40 dvojic): mostovka 19 : 10 dřív**, 9 nerozhodně, 2 nejde; znaménkový test p = 0,14 (neprůkazné).
Kde se oba posuzovatelé shodli: 14 : 8. Nad vodou 4 : 3, jinde 15 : 7. Shoda posuzovatelů 30/40.

**Šířka krajního chodníku proti ortofotu (72 stran, kde změřili oba měřiči): medián chyby 0,83 m proti 1,20 m, do 1 m 41
proti 30 stranám; na 26 stranách je blíž mostovka, na 3 dřív (43 stejně), znaménkový test p < 0,001.** Nad vodou 1,10
proti 1,80 m. Strop 6 m nevyšel ani jednou. Měřiči se shodují s mediánem 0,30 m.

Prohry (oba posuzovatelé pro „dřív“):
- **e-34** (Bruggy, Koning Albert I-laan): vedlejší mostovka nese jinou ulici (Rijselstraat), řez proto končí uprostřed
  komunikace a chybí ostrůvek se stromy a další vozovka. Pravidlo „jiné jméno na vedlejší mostovce není naše ulice“ zde
  škodí, u e-12 (sjezd dálnice vedle N579a) pomáhá; obecně to rozhodnout neumím.
- **e-20, e-39, e-43, e-161, e-171**: krajní chodník o 0,4–1,2 m užší než na ortofotu (hrana mostovky OSM leží uvnitř
  zábradlí nebo je nakreslená hrubě).
- **e-120** (Lucembursko): 0,5 m zeleně za hranou mostovky, kde je ve skutečnosti voda. Zkusil jsem brát vodu a zeleň jen
  v mezeře mezi mostovkami (ne za krajní): e-120 a e-43 se spraví, ale přijde se o 6 výher (e-79, e-88, e-92, e-102, e-165,
  e-183: tam voda za mostovkou ukončí řez správně na její hraně), takže zůstalo původní pravidlo.
- **e-141** (Portugalsko): za mostem je skutečně 7 m dláždění až k domům, řez skončí na hraně mostovky po 2,9 m.

Známé případy (`?ai=0`):
- **Brogade, Odense**: chodníky 6,0 a 6,0 m (strop) → 1,7 a 2,15 m, zábradlí na obou stranách.
- **Vilnius w-9** (Gariūnų tiltas, dvě mostovky): mezi vozovkami dřív 11,35 m „plochy“, teď 2,05 plocha | 7,05 voda | 2,25 plocha.
- **Most Kotlarski**: díly beze změny, přibylo zábradlí na obou stranách.
- **Kościuszkův most**: v bodě 50.052776, 19.91571 obě varianty 2,5 a 4,65 m (hrana mostovky je 9,5 m od osy, takže nic
  neořízne); strop 6 m z dřívějška se v tomto bodě s dnešním kódem neopakuje.

Kontroly: `npm test` 534/534, `node evaluation/ortofoto-osm/regrese.mjs` beze změny proti `vysledky/regrese.txt` (místní
dlaždice Prahy a Brna mostovky nemají a mapy povrchů se nemění), `node evaluation/canada/dc-same.mjs` beze změny.

## Doporučení

Zapnuté obojí. Šířka krajního chodníku – to, co změna má spravit – se průkazně zlepšila (26 : 3, p < 0,001; chyba 0,83
proti 1,20 m) a složení se nezhoršilo (19 : 10, neprůkazné, ale stejným směrem). Pokud Bára chce pro složení průkazný
výsledek, je potřeba větší vzorek; do té doby jde vypnout `?off=mostdeska`. Zábradlí je kresba podle Bářina přání, díly
nemění. Otevřené: e-34 (jiná ulice na vedlejší mostovce), chodníky užší než na ortofotu u hrubě nakreslených mostovek,
přestavba balíků OSM po nasazení.

Skripty: `sample.mjs` (vzorek), `coverage.mjs` (kolik mostů má mostovku), `patch-pack.mjs` (mostovky do místního balíku),
`decks.mjs` (mostovky u řezu z balíku), `collect.js` (sběr ve stránce), `changes.mjs` (co se změnilo).
