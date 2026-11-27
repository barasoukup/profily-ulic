# Nepřátelská recenze větve `switzerland` (17. 11. 2026)

Rozsah: `git diff origin/main..HEAD` a neverzovaný `app/public/zz-pts.json`. Začal jsem na `083a3ca`; během recenze
přibyly tři commity (`f497e86` pravidlo středu řezu, `a4b0cb6` zpráva A/B, `6ac2843` CLAUDE.md), HEAD při dokončení
`6ac2843`. Jsou zahrnuté; bod 4 (A/B) jsem podle nich přepsal a zařadil mezi vážné, původně byl blokující. Žádný soubor v repozitáři jsem neměnil.

Co jsem ověřil:
- `npm test` prošel (282 testů, 0 chyb).
- Stát bodu u hranic: 44 míst (`cityAt`), viz „Bez nálezu“.
- `deriveProfile` na umělých ulicích pro `switzerland` a `praha` (stání podle zákona, plocha `Bahn` vedle ulice).
- `cleanCut` pro Curych, Ženevu, Lugano, Chiasso, Samnaun, Vaduz a klíče `chAv`, `orthoCity: "ch"`.
- Vykreslení 12 SVG ze `signs-CH/` a porovnání s mapováním v `CH.js`.
- Pět jednotlivých dotazů ven (User-Agent `profily-ulic`): WFS geodienste.ch u curyšského hlavního nádraží (13 ploch),
  čtyři dlaždice SWISSIMAGE mimo Švýcarsko, Photon s `lang=default`, `data.streetspace.eu/osm/index.json`.

Co jsem neověřil: chování v prohlížeči, stavbu balíků `ch` a `li`, znění podmínek geodienste.ch a kantonů, texty
VSS, VRV a SSV v primárních zdrojích (jen proti `ch-norms.md`), skutečnost v ulicích u řezů A/B (jen vnitřní
věrohodnost profilů).

Bez nálezu:
- Hranice: Kreuzlingen/Konstanz, Basilej/Weil/Saint-Louis, Chiasso/Como, Campione, Büsingen, Rheineck/Gaißau,
  Laufenburg a Rheinfelden na obou březích, Schaanwald/Tisis, Balzers/Trübbach, Samnaun, Müstair vyšly správně.
  Praha a Bratislava beze změny.
- `validate.js` pustí řezy v CH a LI i klíče `chAv` (ZH, FL, LI, CH; neznámý kanton zahodí). Meze logu ve
  `logging/worker.js` (45,5–55,5°, 5,5–23°) Švýcarsko pokrývají.
- Dlaždice `{z}/{x}/{y}` (`xy`) se týkají jen zdroje `ch`; ostatní zdroje mají adresu beze změny.
- `SPEED_TEMPLATES "2.30"` nic jiného neovlivní. Soubory 2.49 a 2.50 odpovídají (zákaz zastavení, zákaz stání),
  4.08 je svislá šipka (není to případ německé Z 220), 4.08.1 má tabulku s kolem.
- WFS: pořadí os lat, lon v dotazu a lon, lat v odpovědi sedí, pole `Art` a `Kanton` existují, CORS `*`.
- Photon `lang=default` funguje a vrací „Genève“. Pořadí `photon-de` → `photon-ch` → `photon` v `search.js`
  Německo ani Rakousko nemění.
- Import `towns/switzerland.js` → `credits.js` → `lanes-ortho.js` se načte bez chyby (`CANTONS` se čte až při volání).
- Slovenské texty: české slovo jsem nenašel. Jazyk a stát se nemíchají (kódy CH, LI velkými, texty přes `t()`).
- CSP: `wmts.geo.admin.ch` v `img-src` i `connect-src`, `geodienste.ch` v `connect-src`; WFS nepřesměrovává jinam.

## Blokující

### 1. Obytná a pěší zóna mají prohozené značky
- **Kde:** `app/public/countries/CH.js:50–54` (`CH_CODE` a `CH_FILE`: `ip26a: "2.59.3", ip27a: "2.59.5"`).
- **Co je špatně:** `ip26a` je v `signs.js:36` „IZ 5a Obytná zóna“, `ip27a` „IZ 6a Pěší zóna“. Soubor `2.59.3.svg`
  je Fussgängerzone, `2.59.5.svg` Begegnungszone (vykresleno a zkontrolováno, README to říká stejně). Obytná ulice
  (`living_street`) tak dostane značku pěší zóny a pěší zóna značku Begegnungszone s dvacítkou. Platí i pro LI.
  Německo to má správně (`ip26a: Z 325.1`, `ip27a: Z 242.1`).
- **Proč to testy nechytily:** `tests/switzerland.test.js:79–82` u těchto klíčů kontroluje jen, že soubor existuje.
- **Oprava:** `ip26a: "2.59.5"`, `ip27a: "2.59.3"` v obou tabulkách; test na přesnou hodnotu obou klíčů.

### 2. Železnice vedle ulice se kreslí jako dvě tramvaje
- **Kde:** `app/public/towns/switzerland.js:28` (`Bahn: 705`), dopad v `derive.js:1676, 1788, 1992`.
- **Co je špatně:** `Bahn` je v úředním vyměřování hlavně železniční pozemek (kolejiště SBB), 705 je „samostatné
  tramvajové těleso“ a `derive.js` ho bere jako součást vozovky. Cáchy mají pro totéž `Bahngleis: 1100`.
- **Jak zopakovat:** `setCity("switzerland")`, vozovka 6 m, chodníky 3 m, za pravým chodníkem plocha 705 široká 12 m:
  `chodnik 3 · pruh 3 · pruh 3 · delici 3 · tramvaj 6 · tramvaj 6`. Chodník se změnil v dělicí pás a kolejiště ve dvě
  tramvaje. S kódem 1100 vyjde `chodnik · pruh · pruh · chodnik · plocha 12`.
- **V datech:** dotaz u Zollstrasse v Curychu vrátil plochu `Bahn` (kolejiště hlavního nádraží) hned vedle ulice.
  Ulic podél trati je ve Švýcarsku hodně.
- **Oprava:** `Bahn: 1100`. Tramvajové těleso poznat podle OSM (`railway=tram` v ploše), jak to dělá Berlín.
  Ze `STREET` (`switzerland.js:62`) pak 705 vyndat. Test s plochou `Bahn` vedle ulice.

### 3. Po nasazení bude Švýcarsko bez ulic: balíky `ch` a `li` na R2 nejsou a push je nepostaví
- **Kde:** `tools/countries.mjs:25–26`, `.github/workflows/osm-tiles.yml:19–26`, `app.js:345`, `index.html`.
- **Co je špatně:** `https://data.streetspace.eu/osm/index.json` má teď `at`, `cz`, `sk` a 16 balíků `de_*`; `ch` ani
  `li` ne (commit `70dd90a` píše „OSM packs ch and li on R2“). Workflow se pushem spouští jen při změně skriptů
  dlaždic; `tools/countries.mjs` mezi cestami není. Po pushi tedy stránka slibuje Švýcarsko a klik odpoví „Tady jsem
  žádnou ulici nenašla … (data pokrývají … Švýcarsko a Lichtenštejnsko)“ až do pondělního běhu nebo ručního spuštění.
  Stejná chyba jako bod 5 recenze Německa.
- **Oprava:** před pushem aplikace spustit `OSM tiles` ručně se `states: ch,li` a ověřit `index.json`. Do
  `on.push.paths` přidat `tools/countries.mjs`.

## Vážné

### 4. A/B vyměřování: verdikt „lépe 15, hůř 1“ je výpočet, ne měření, a posuzoval ho autor
- **Kde:** `evaluation/switzerland/ab/REPORT.md` („Oprava po A/B“), `results/rezy.json`, `towns/switzerland.js:60–82`.
- **Co je dobře:** zpráva existuje, `uebrige_befestigte` (1003) už vyměřování nespouští a má to test. Tím odpadly
  profily z jediné „plochy“ (ba1, ba5, be2, ge1, ge2, ge5, lu5, st3, va2) a most be6.
- **Co je špatně:**
  - Výsledek po opravě je odvozený z dotazu, jaká plocha leží pod středem; 42 řezů se znovu nesbíralo.
    `rezy.json` drží stav před opravou (be6 má dál `plocha 1,92 · cyklostezka · plocha 16,08 · …`).
  - **be1 Gutenbergstrasse** je mezi „lépe B“, ale profil B je `pruh 2,3 · zelen 3,2 · pruh 4,65 · chodnik 2 ·
    zelen 5,8`. Podle obrázku `images/be1.jpg` je levý „pruh 2,3 m“ nejspíš chodník za pásem stromů, který vyměřování
    vede jako `Strasse_Weg` (cesta). To je chyba složení (jízdní pruh místo chodníku), ne zlepšení. Stejné riziko má
    každý chodník nebo parková cesta vedená jako `Weg`: kód ji bere jako 701 a OSM nad ní udělá pruh. Posoudit znovu
    a projít i ostatních 15 „lépe“ na složení.
  - **Mosty a podjezdy:** pravidlo středu opravilo be6 jen proto, že pod mostem byla `uebrige_befestigte`. Vede-li
    pod mostem silnice, je pod středem `Strasse_Weg` spodní ulice a profil mostu se složí z ní (`derive.js:1640` umí
    most jen u ploch s `LEVEL`). Ve vzorku takový řez není.
  - **ge4** (pět pruhů po 4 m, 31 m vozovky) zůstává; zpráva ho přiznává, oprava není.
  - **va1** je prázdný záznam bez `error`; tabulka u Vaduzu hlásí 0 chyb. **va3** (`zelen 22,03 · pruh 1,00`) je
    „nejde posoudit“, ač pruh 1 m je chyba sama o sobě.
  - Vzorek je jen do 1,5 km od center sedmi měst: žádná vesnice, žádný kanton mimo ZH, BS, BE, GE, TI, SG. Univerzální
    měření přesnosti (`mereni-presnosti`, vzorek v `evaluation/universal/sample.mjs` už je) pro CH a LI neproběhlo.
- **Oprava:** po opravě sebrat vzorek znovu a posoudit ho nezávisle (jiný posuzovatel než autor); `Strasse_Weg` brát
  jako vozovku jen tam, kde ji kříží nebo v ní leží ulice z OSM, jinak jako chodník nebo cestu; na mostě a v tunelu
  (`bridge`, `tunnel`, `layer`) vyměřování nebrat; pustit univerzální měření.

### 5. Podklad „Ortofoto“ ve Vorarlbersku a západním Tyrolsku přebije basemap.at rozmazaná družice
- **Kde:** `app/public/app.js:204–211`.
- **Co je špatně:** vrstva SWISSIMAGE má `bounds` obdélník kolem Švýcarska (asi 5,96–10,49° v. d., 45,82–47,81° s. š.)
  a v `kinds.ortho` je za rakouskou, tedy nad ní. Mimo Švýcarsko SWISSIMAGE neodpoví 404, ale vrátí družicový snímek:
  dlaždice v Dornbirnu na z19 je 200 a jsou to čtverce po několika metrech. V Bregenzu, Dornbirnu, Feldkirchu,
  Bludenzi a St. Antonu tak zmizí ortofoto basemap.at. Pořadí vrstev jsem v prohlížeči neviděl, usuzuji z pořadí
  přidání; ověřit v Dornbirnu. Německo je přidané až po Švýcarsku a od z12 ho překryje.
- **Oprava:** švýcarskou vrstvu vložit před rakouskou, nebo ji omezit na dlaždice, jejichž střed leží v CH nebo LI
  (`GridLayer` jako u Německa). Podobný test jako u Německa: dlaždice v Dornbirnu se SWISSIMAGE neptá.

### 6. Odhad stání „podle zákona“ kreslí stání tam, kde ho VRV čl. 19 výslovně zakazuje
- **Kde:** `CH.js:84–86` (`lawNeed`, `parkGuess: true`), `derive.js:699–720`, `NORMS.md` („Zákon o stání“).
- **Co je špatně:**
  - VRV čl. 19 odst. 2 zakazuje stát „auf Radstreifen und auf der Fahrbahn neben solchen Streifen“ (vlastní rešerše
    `ch-norms.md`, tabulka B). Zopakováno: obousměrka 10 m s `cycleway:both=lane` dá ve Švýcarsku
    `cyklopruh 1,5 · pruh 2,5 · pruh 2,5 · cyklopruh 1,5 · parkovani 2,00 (odhad)`. V Praze tatáž ulice stání nemá.
  - Zákon šířku neuvádí. Kantony Bern a Luzern berou 3 m na vedlejší a 6 m na hlavní ulici. Kód žádá u obousměrky
    2 × 2,5 m (stání od 7 m, na obou stranách od 9 m), tedy číslo, které není v zákoně ani v pomůckách; text
    `halfKerbNote` ho přesto uvádí větou „podle VRV čl. 19 a pomůcek kantonů“.
  - `NORMS.md` sám píše, že kde jsou vyznačená pole, smí se stát jen v nich (SSV čl. 79 odst. 6) a že odhad proto
    nadhodnocuje. Ve švýcarských městech jsou pole vyznačená skoro všude (modrá zóna). Univerzální měření, které
    v Německu odhad obhájilo (15 z 34 řezů bez stání), pro Švýcarsko ve větvi není.
- **Oprava:** vedle cyklopruhu stání neodhadovat (CH a LI). Odhad nechat vypnutý (`parkGuess: false`), dokud ho
  neobhájí měření na švýcarském vzorku; v textu rozlišit, co je zákon, co pomůcka kantonu a co pravidlo aplikace.

### 7. Normy: část hodnot nemá oporu ve vlastní rešerši nebo se používá na jiný případ
- **Kde:** `CH.js:15–42, 91–92`, `evaluation/switzerland/NORMS.md`, proti `ch-norms.md`.
- **Co je špatně:**
  - **Jednosměrka s cyklisty v protisměru** (`contraflow`: minimum 4,5 m, základ 4,8 m). `rules.js:44` pravidlo
    používá jen tam, kde protisměrný cyklopruh **není**. Bern (S1 6.2) dává 3,0 + 1,5 m právě pro případ **s**
    cyklopruhem; 4,8 m kantonu Curych je potkání kola s nákladním autem. Běžná švýcarská jednosměrka 3,5–4 m
    s koly v protisměru tak dostane varování „pod minimem“. Německo má pro totéž `null`.
  - **Podélné stání** `zaklad: 2`: rešerše má jen 1,90 m (a 2,20/2,50 u vysoké obruby). Hodnota 2,0 zdroj nemá,
    oranžové varování mezi 1,9 a 2,0 m je bez opory.
  - **Pruh BUS s cyklisty** `min 3, zaklad 4,5`: Bern říká „3,0 m oder ≥ 4,5 m“, tedy 3,0 m je řádná volba a vyhnout
    se má šířkám mezi. Kód dá pruhu 3,0 m oranžové varování. Rešerše má hodnotu jako „Medium“.
  - **Jízdní pruh 3,25 m** pro celou skupinu B je z Normalie kantonu Schwyz pro kantonální silnice (potkávání
    nákladních aut). Rešerše má pro kanton Curych 3,00 m a 2,75 m vedle cyklopruhu a v otevřených bodech píše, že
    švýcarský zdroj pro běžné ulice nenašla. V Curychu nebo Basileji tak bude oranžová skoro každá hlavní ulice.
  - **Chodník** „nejméně 1,8 m (SN 640 070 podle Basel-Stadt)“: 1,80 m je v tab. 1 nejnižší třída basilejských
    obecních spojení; k SN 640 070 rešerše uvádí 2,00 m (1,50 m jen do 50 m). Citace přisuzuje normě číslo města.
  - **Cyklopruh** `zaklad: 1,8`: Bern má „Normalbreite 1,5 m innerorts“, 1,8 m je Basilej. Cyklopruh podle bernské
    pomůcky dostane oranžovou. **Stezka pro cyklisty**: minimum z Bernu (1,8), základ z Basileje (2,5), ač Bern má
    základ 2,6 a Basilej minimum 2,2.
- **Oprava:** `contraflow: () => null`; podélné stání `zaklad: 1.9`; bus s cyklisty bez oranžové na 3,0 m (nebo
  `null`); pruh skupiny B `null`, dokud není městský zdroj; u chodníku a cyklopruhu brát minimum i základ z jednoho
  zdroje a citovat ho jeho jménem.

### 8. geodienste.ch: limit 10 dotazů WFS za minutu a žádná cache; tvrzení o „fair use“ nemá doklad
- **Kde:** `towns/switzerland.js:35–40`, `SOURCES.md`, `LICENCE-A-ZDROJE.md`.
- **Co je špatně:** každý řez i každý posun řezu je jeden dotaz WFS bez cache a bez brzdy. Kdo táhne řez po ulici,
  jedenáctým dotazem za minutu limit překročí; odmítnutí spadne do `catch` jako „Úřední vyměřování neodpovídá“ a
  profil téže ulice přeskočí z vyměřování na odhad. Věty „fair use 10 dotazů WFS za minutu“ a „webová aplikace do
  10 000 uživatelů denně je fair use“ jsou v `SOURCES.md` a v licencích, ale v podkladové rešerši (`ch-sources.md`)
  nejsou; znění Betriebsbestimmungen jsem nečetl. A/B podle zprávy běžel s pauzou 7 s; skript sběru ve větvi není,
  takže to nejde zopakovat ani zkontrolovat.
- **Oprava:** cache odpovědí po čtvercích (např. 100 m) v paměti záložky, nejvýš jeden dotaz za 6 s (další řez počká
  nebo vezme odhad s jinou poznámkou než „neodpovídá“); do `SOURCES.md` odkaz a citaci článku podmínek.

### 9. Licence vyměřování po kantonech je „?“ a přesto je zapnuté pro všechny; kredit je nepřesný
- **Kde:** `LICENCE-A-ZDROJE.md` (řádek vyměřování, „Podmínky po kantonech neprověřené“), `credits.js:52–55`,
  `towns/switzerland.js:50, 80`, `types.js:73`.
- **Co je špatně:** stejná situace jako bod 3 recenze Německa (Sasko): data se čtou a kreslí, podmínky nikdo nečetl.
  Kredit zní „© kanton ZH (geodienste.ch)“; kantony obvykle žádají vlastní znění zdroje. Kanton kreditu je ten
  s nejvíc plochami v obdélníku, ne kanton řezu (Basilej BS/BL, Ženeva u hranice kantonu Vaud). Části profilu z
  vyměřování nesou štítek „z pasportu města“ (`asPassport`), což ve Švýcarsku není pravda. Věta pod profilem říká
  „úředního vyměřování, SWISSIMAGE a OSM“, i když se ortofoto nepoužilo (v A/B většina řezů s `chAv` nemá `orthoCity`).
- **SWISSIMAGE:** rešerše upozorňuje, že STAC uvádí `license: "proprietary"`, a chce to ověřit; `LICENCE-A-ZDROJE.md`
  má přesto „✓ OGD“. Doplnit odkaz na podmínky bezplatných geodat swisstopo.
- **Oprava:** projít podmínky aspoň kantonů ZH, BS, BE, GE, TI, SG a Lichtenštejnska (vzorek A/B), ostatní do té
  doby nebrat; kredit podle kantonu plochy pod středem řezu; vlastní štítek zdroje („z úředního vyměřování“).

### 10. Testy procházejí, aniž by hlídaly to podstatné
- **Kde:** `tests/switzerland.test.js`.
- **Co je špatně:**
  - Značky: jen existence souboru (bod 1 prošel). Chybí test `signLabel` pro pruh proti směru.
  - `surfaces`: testy jsou `?av=0` a nově pravidlo středu (podstrčený `fetch`, jen záporný případ). Kladný případ
    (vozovka pod středem → `chAv` s kantonem, budovy, `MultiPolygon`), `chFailed` a prázdná odpověď (Vaud, Luzern)
    test nemají.
  - Normy: test opakuje čísla z kódu (`min 1.8`, `lawNeed(false, 2, 2.5) === 5`), neověřuje je proti ničemu.
  - Stání: chybí obdoba německého testu (ulice 5 / 7 / 9 m) a případ s cyklopruhem (bod 6).
  - CSP: test jen hledá řetězec; nehlídá, že `geodienste.ch` není v `img-src` zbytečně (není, v pořádku).
- **Oprava:** kladný test `surfaces` s podstrčenou odpovědí (třeba těch 13 ploch od nádraží), testy na body 1, 2, 6.

## Drobné

11. **Titulek značky proti směru** (`CH.js:70–73`): `signLabel` čte `x.dir`, ale směr je u odvozených značek na části
    (`seg.dir`). Nad nakreslenou 2.02 bude titulek „SSV 4.08“.
12. **Druhy pokryvu** (`switzerland.js:27–33`): chybí `Fels`, `Geroell_Sand`, `Abbau_Deponie`, `Gletscher_Firn`,
    `uebrige_vegetationslose` (plocha vypadne, v řezu díra). Klíče `stehendes`, `fliessendes` vedle
    `Gewaesser_stehendes`, `Gewaesser_fliessendes` ukazují, že skutečné hodnoty nikdo neověřil. Pole, les i soukromá
    zahrada (`Gartenanlage`) jsou 401 „veřejná zeleň“; MTVU má 100, 200, 300.
13. **2.63** se nepřeklápí podle `walk` (Německo má 241-30/31); chodci jsou vždy vpravo.
14. **Lichtenštejnsko:** titulek „SSV 4.17 + 5.34.4“, ač lichtenštejnská SSV (znění 7/2023) tabulku 5.34.4 nemá
    (`NORMS.md` to přiznává). Čísla článků VRV jsou z konsolidace 12/2015; novely 2024 a 2025 nikdo nečetl.
15. **Hledání** (`search-photon.js:21`): `looksGerman` pozná Zürich, Basel, Bern, Luzern, ale ne francouzské a
    italské dotazy (Genève, Lausanne, Lugano, „rue“, „via“), když mapa neukazuje Švýcarsko.
16. **`app/public/zz-pts.json`** (neverzovaný seznam bodů vzorku) leží ve složce, která se nasazuje. Nepřidat do
    commitu, smazat.
17. **`states.json`** narostl ze 404 na 514 kB (čte ho každý při startu). Švýcarsko je před Rakouskem a Německem a
    hranice je zjednodušená asi na 30 m oběma směry: ulice těsně za čárou v Kostnici nebo Weilu může vyjít jako CH.
    U 44 zkoušených míst se to nestalo.
18. **Atribuce vrstvy** (`app.js:207`): „ortofoto SWISSIMAGE © swisstopo“ nejde přes `tr()` (německá vrstva ano).
19. **Strop `COUNT=3000`** bez kontroly `numberMatched`: při oříznutí může chybět plocha pod středem a řez tiše
    spadne na odhad. U nádraží přišlo 13 ploch, riziko je malé.

## Co se z recenze udělalo (17. 11. 2026)

| bod | stav |
|---|---|
| 1. Obytná a pěší zóna prohozené | opraveno (`ip26a` → 2.59.5 Begegnungszone, `ip27a` → 2.59.3 Fussgängerzone), test na přesné soubory |
| 2. `Bahn` jako tramvajové těleso | opraveno: `Bahn` je železnice (1100), tramvajové těleso dává OSM; `STREET` bez 705; test |
| 3. Balíky `ch` a `li` na R2 chybí | **zůstává pro nasazení:** před pushem spustit workflow OSM tiles ručně se `states: ch,li` a ověřit `index.json` (popsáno v CLAUDE.md). `tools/countries.mjs` do `on.push.paths` nepřidáno: změna seznamu by přestavěla všechny státy |
| 4. A/B „po opravě“ je výpočet | upřesněno ve zprávě: řezy, kde je pod středem `uebrige_befestigte`, vracejí po opravě přesně stav A (služba se pro ně nepoužije), proto výpočet; měření přesnosti proběhlo znovu po opravách (`evaluation/universal/`) |
| 5. SWISSIMAGE v mapě přes Vorarlbersko | opraveno: dlaždice, jejíž střed ani rohy neleží ve Švýcarsku nebo Lichtenštejnsku, je prázdná |
| 6. Stání vedle cyklopruhu | opraveno (`parkByCycleLane: false`, `derive.js`, Česko beze změny); text hlášky rozlišuje zákon, pomůcky kantonů a pravidlo aplikace; zda odhad stání ponechat, rozhodlo měření přesnosti (REPORT.md) |
| 7. Normy | opraveno podle rešerše: jednosměrka 4,8 m bez minima, podélné stání 1,9, BUS s cyklisty 3 nebo 4,5, pruh hlavní ulice orientačně 3 m, citace chodníku, cyklopruhu a stezky podle skutečného zdroje |
| 8. geodienste.ch bez cache | opraveno: jeden dotaz na obdélník za sezení (paměť 30 obdélníků). Věta o 10 000 uživatelích denně je v Betriebsbestimmungen geodienste.ch (15. 10. 2025), ověřeno ručně |
| 9. Licence a kredit | kredit podle kantonu pod středem řezu; podmínky kantonů zůstávají otevřené (jako Sasko u Německa), Bára rozhodne; štítek „z pasportu města“ má i Německo, neřešeno |
| 10. Testy | doplněné: přesné značky zón, železnice, stání u cyklopruhu přes `deriveProfile`, pravidlo středu se stubem služby |
| drobné | titulek 4.08 nad 2.02, chybějící druhy pokryvu (skály, sutě), 2.63 bez překlápění, tabulka 5.34.4 v LI, `looksGerman` bez francouzštiny a italštiny: neřešeno, na později |
