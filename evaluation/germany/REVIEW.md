# Nepřátelská recenze větve `germany` (17. 11. 2026)

Rozsah: `git diff 16f30cd..HEAD`, HEAD při dokončení `1f2ba1a` (během recenze přibyly dva commity: `osm-tiles.yml`
a `tools/osm_index.mjs`; jsou zahrnuté). Žádný soubor kromě této zprávy jsem neměnil.

Co jsem ověřil: `npm test` prošel (249 testů, 0 chyb). Malé kontroly v Node (stát a země bodu, `inGdr`, `cleanCut`,
`deriveProfile` pro CZ/AT/DE, značky DE). Dva malé dotazy ven: WFS Berlína (1.1.0, tři vrstvy, bbox) a OGC API Hamburku
odpověděly správně (pořadí lon, lat; id `cm_fahrbahn.N`; Hamburk bez `next` při 891 plochách).
Co jsem neověřil: stavbu dlaždic celého Německa, 16 WMS zemí, Cáchy, chování v prohlížeči.

Bez nálezu: tajné klíče (v diffu žádný; `token.local` a `mapy-key.local` git ignoruje, sledované nejsou), stát bodu
u hranic (21 hraničních měst DE/AT správně), `signs.js` nečte jazyk, CSP má všech 16 zemí v `connect-src` i `img-src`,
`city.panels` se mezi řezy nepřenáší (`setCity` maže vše), import `city.js` → `lanes-ortho.js` není kruhový.

## Blokující

### 1. Uložený řez v Německu se po obnovení stránky ztratí a profil se kreslí jako pražský
- **Kde:** `app/public/validate.js:110` a `:115`, volá `app.js:2051` (`restore`), spouští `app.js:2208` (každé načtení
  stránky s uloženým řezem, i změna jazyka) a `app.js:1998` (otevření souboru JSON).
- **Co je špatně:** `cleanCut` pustí jen 48–52° s. š. a 12–19° v. d. Mimo je skoro celé Německo (Berlín 52,52°, Hamburk,
  Kolín, Mnichov 11,58°, Frankfurt, Stuttgart). Řez je `null`, `setCity` se nezavolá, město zůstane výchozí `praha`:
  německý profil dostane české značky, česká pravidla a žádný řez v mapě. Druhá půlka: seznam `sources` pustí jen
  `region`, `dmvs`, `ortho`, `orthoCity` ∈ {ipr, brno, plzen} a `passport`. `deTown`, `orthoCity: "de-XX"`, `at`, `at19`,
  `sk`, `skTown`, `atTown`, `zbgis`, `atSigns`, `skEdges` zahodí, takže po obnovení zmizí z exportu povinné kredity
  (dl-de/by-2-0, CC BY 4.0).
- **Dopad mimo Německo:** stejná chyba je už nasazená pro Košice a Prešov (nad 19° v. d.) a ve větvi pro Graz, Salcburk,
  Innsbruck a Klagenfurt (pod 48°).
- **Jak zopakovat:** `node -e 'import("./app/public/validate.js").then(({cleanCut})=>console.log(cleanCut({lat:52.5163,lon:13.3777,bearing:0})))'`
  → `null`. V aplikaci: řez v Berlíně, F5.
- **Oprava:** meze podle států ve `states.json` (nebo 45–56° a 5–23°), `sources` rozšířit o všechny klíče, které čte
  `creditLines`, s kontrolou hodnot; test pro Berlín, Košice, Graz.

### 2. Zákonný odhad stání v Německu dělá z obousměrné ulice dva pruhy po 1,55 m
- **Kde:** `app/public/derive.js:598` (`lawNeedFor`), použité v `:671` a `:690`; zapnuto v `app.js:379`.
- **Co je špatně:** v DE stačí 3,05 m zbytku bez ohledu na počet pruhů, ale `lanesTotal` zůstane 2. Zbytek se rozdělí
  na dva pruhy pod `MIN_LANE` (2,5 m).
- **Jak zopakovat:** `deriveProfile` s `setCity("germany")`, `highway=residential`, vozovka 701:
  5,1 m → `pruh 1,55 · pruh 1,55 · parkovani* 2,00`; 6 m → `pruh 2,00 · pruh 2,00 · parkovani* 2,00`;
  7,1 m → `parkovani* 2 · pruh 1,55 · pruh 1,55 · parkovani* 2`. V CZ a AT totéž dá dva pruhy bez stání.
- **Oprava:** když zbytek po stání nestačí na `lanesTotal × MIN_LANE`, kreslit jeden společný pruh (≥ 3,05 m), nebo
  u obousměrky žádat 2 × `MIN_LANE`. Test na 5,1 / 6 / 7,1 m.

### 3. Licence ortofot několika zemí nejsou přečtené, kredit tvrdí licenci, kterou nikdo neověřil
- **Kde:** `app/public/lanes-ortho.js:44–67` (`DE_ORTHO.credit`), `evaluation/germany/SOURCES.md:30`, `index.html:126`.
- **Co je špatně:** `SOURCES.md` sám říká „Licenci Saska a Saska-Anhaltska před nasazením přečíst“. Přesto má SN
  v kódu „(dl-de/by-2-0)“, ačkoli tabulka uvádí jen „podmínky geoportal.sachsen.de“. ST, MV a SL jsou bez licence
  („podmínky LVermGeo ST (PDF)“, „povinný zdrojový údaj“, „noLimitations“). U dl-de/by-2-0 (BW, BE/BB, HH, RP) licence
  žádá i odkaz na text licence a na datovou sadu; aplikace dává jen zkratku bez odkazu.
- **Oprava:** přečíst podmínky SN, ST, MV, SL a opsat přesné znění kreditu; země bez jasné licence do té doby vypnout
  (odhad jen z OSM). Do patičky odkaz `govdata.de/dl-de/by-2-0` a na `LICENCE-A-ZDROJE.md`.

## Vážné

### 4. Celé Německo se nikdy nepostavilo; balík bude nad 512 MB, které Cloudflare zdarma cachuje
- **Kde:** `.github/workflows/osm-tiles.yml:57, 95`, `tools/pack_osm_tiles.mjs:85, 99`, `evaluation/osm-r2/REPORT.md:72`.
- **Co je špatně:** lokální `de-novy.posm` má 175 MB a je z devíti městských výřezů (`data/osm/de-test/`,
  `dt*_*.geojsonl`); celý výřez (4,88 GB) neprošel `build_osm_data.sh` ani jednou. „Asi 1,5 h“ v komentáři je odhad.
  Podle poměru k Česku vyjde zhruba 22 GB exportů a balík kolem 1,6 GB. Packer drží celý soubor v paměti
  (`Buffer.concat`, pak hash a `writeFileSync`). Vlastní zpráva o R2 říká „větší stát by se dělil“ (limit cache 512 MB):
  nedělí se, každé čtení Německa půjde bez cache do R2.
- **Oprava:** před nasazením pustit job `de` jednou naostro (nebo lokálně na pozadí) a zapsat čas, disk a velikost;
  balík nad 512 MB rozdělit (např. po zemích: `de-by`, `de-nw` …; `osm_index.mjs` bere kód jen ze dvou písmen, upravit).

### 5. Po prvním pushi je Německo asi dvě hodiny bez dat a hláška svádí vinu na uživatele
- **Kde:** `osm-tiles.yml:19–26` (spouští se pushem na `main` zároveň s `pages.yml`), `app.js:318`.
- **Co je špatně:** stránka s Německem vyjde za minuty, balík `de` až po stavbě. Do té doby klik v Německu řekne
  „Tady jsem žádnou ulici nenašla … (data pokrývají … Německo)“. Stejně kdykoli job `de` selže napoprvé.
- **Oprava:** nejdřív dostat na `main` jen `osm-tiles.yml` (nebo nahrát balík ručně), aplikaci až po něm; pro stát bez
  balíku v `index.json` jiná hláška („data pro Německo teď nejsou dostupná“).

### 6. Když R2 jednou selže, Rakousko a Německo jsou do znovunačtení stránky bez dat
- **Kde:** `app/public/osmpack.js:216–222`, `app/public/gis.js:80`.
- **Co je špatně:** každý řez čte balíky všech států najednou (`Promise.all`); chyba jediného (výpadek, timeout 25 s
  na velkém souboru, jiná verze formátu u státu, jehož job selhal a zůstal starý soubor) shodí celé R2 a `this.at++`
  přepne natrvalo na Pages, kde jsou jen `cz` a `sk`. Pages vrací pro Německo prázdno bez chyby, takže se už nikdy
  nevrátí na R2 a uživatel vidí „ulici jsem nenašla“. Chyba německého balíku tak přepne na zálohu i české uživatele.
- **Oprava:** číst jen balík státu řezu (podle `states.json` nebo `head.extent`), chybu jednoho balíku nebrat jako chybu
  místa, a když záloha stát nemá, zkusit příště znovu R2 a říct, že data nejsou dostupná.

### 7. Zúžení stání z OSM (`OSM_PARK_MIN`) platí i pro přesné vozovky v Česku a dává červená varování
- **Kde:** `app/public/derive.js:567, 653–661`.
- **Co je špatně:** commit zúžení zdůvodňuje „mírně podhodnocenou odhadnutou vozovkou“, ale kód neví, zda je vozovka
  odhad. V Praze (MTVU, přesná šířka) dřív stání, které se nevešlo, vypadlo; teď se kreslí 1,7–1,9 m a pruhy 2,5 m.
  Návrh je kopie Stavu, takže hned svítí „Parkování 1,70 m: pod minimem“. Regrese `regression.mjs` měří jen odhad
  z ortofota proti MTVU, cestu přes MTVU (100 řezů `evaluation/archive/prague-100/REPORT.md`) ne.
- **Jak zopakovat:** `setCity("praha")`, vozovka 6,7 m, `parking:both=parallel` →
  `parkovani 1,70 · pruh 2,50 · pruh 2,50`, pravidla: stání pod minimem, dva pruhy užší než základ.
- **Oprava:** zúžení jen u odhadnuté vozovky (`estimate`, plochy z `ortho-osm.js`), nebo ověřit na 100 pražských řezech.

### 8. Dodatková tabulka u Z 220 má špatné číslo
- **Kde:** `app/public/signs.js:149, 362`, `app/public/signs-DE/1000-33.svg`, `signs-DE/README.md`.
- **Co je špatně:** k Z 220 při cyklistech v protisměru patří podle VwV-StVO k Z 220 Zusatzzeichen **1000-32** (kolo
  a dvě vodorovné šipky), 1000-33 (svislé šipky, „Radverkehr im Gegenverkehr“) patří jinam. Z 267 + 1022-10 je správně.
  Píšu to z paměti, bez primárního textu: ověřit ve VwV-StVO a na Commons.
- **Oprava:** stáhnout 1000-32, opravit `plateFile`, `DE_CHOICE_CODE`, README a test.

### 9. Normy: hodnoty bez zdroje spouštějí varování a dvě citace nesedí s vlastní rešerší
- **Kde:** `app/public/rules.js:131–136, 145–148, 161, 250, 256`, `evaluation/germany/NORMS.md`.
- **Co je špatně:**
  - Pruhy (3,75 / 3 / 2,75 m), buspruh 3,25 a bus s cyklisty 4,75 m jsou podle `NORMS.md` „z paměti“ nebo „zdroj
    nenalezen“ a rešerše doporučuje „bez varování“. Kód z nich přesto dělá oranžové varování. Spolu s bodem 2 a 7 dostane
    skoro každá místní ulice v Německu hned v Návrhu varování s textem „německý zdroj nenalezen“.
  - Kolmé stání: text „hloubka 5 m, s přesahem 4,5 m (EAR 23 podle DUH 2024)“. `NORMS.md` uvádí pro EAR 23
    4,50 + 0,70 m přesah (5,20 m) a šířku 2,65 m; 5,0/4,5 je česká hodnota s německou citací.
  - Jednosměrka s cyklisty v protisměru: „nejméně 3 m … (VwV-StVO k Z 220)“ jako červené minimum. `NORMS.md` pro to
    nemá žádný řádek; platná VwV-StVO podle mé paměti pevné 3,0 m nemá (jen 3,5 m s autobusy a nákladní dopravou).
- **Oprava:** co nemá zdroj, vrátit `null` (žádné varování); kolmé stání podle `NORMS.md`; protisměr doložit, nebo jen 3,5 m oranžově.

### 10. `inGdr` kreslí paneláky na západě a nekreslí na východě
- **Kde:** `app/public/city.js:495–503`.
- **Co je špatně:** ručně kreslený mnohoúhelník se s hranicí rozchází o desítky km. Změřeno: Heiligenstadt (TH) a Dömitz
  (MV) vyjdou jako západ; Eschwege (HE), Bad Steben, Ludwigsstadt a Neustadt b. Coburg (BY) a Schnackenburg (NI) jako NDR.
- **Oprava:** brát zemi z `laender.json` (BB, BE, MV, SN, ST, TH), která je přesná na 100 m; `landsAt` už existuje.

### 11. Log řezů zahodí polohu německých řezů
- **Kde:** `logging/worker.js:47` (`num(e.lat, 47, 52)`, `num(e.lon, 11, 20)`).
- **Co je špatně:** řez v Berlíně, Hamburku nebo kdekoli západně od 11° v. d. se zapíše bez souřadnic. Worker ve větvi
  změněn není a nasadit ho musí Bára.
- **Oprava:** meze rozšířit (45–56°, 5–23°) a nasadit Worker před aplikací.

### 12. Podklad „Ortofoto“ v Německu: bílé dlaždice u hranic zemí
- **Kde:** `app/public/app.js:208–221`.
- **Co je špatně:** dlaždice se bere jen ze země svého středu (`lands[0]`), bez sousední země a bez kontroly prázdného
  obrázku (odhad pruhů obojí má). Hranice zemí jsou z měřítka 1 : 1 M a vedou středem dvojměst: Mainz/Wiesbaden,
  Mannheim/Ludwigshafen, Ulm/Neu-Ulm, Hamburk a okolí, Brémy. Tam budou půlky dlaždic bílé. `minZoom: 12` nechá pod
  úrovní 12 mapu prázdnou (Rakousko a Slovensko mají ortofoto ve všech úrovních). Dlaždice 256 px znamenají desítky
  dotazů WMS na pohled; IPR a DMVS jdou z ohleduplnosti po 512 px.
- **Oprava:** u dlaždic do 2 km od hranice vrstvit obě země (PNG s průhledností), `tileSize: 512, zoomOffset: -1`.

### 13. Veřejné výřezy německých ortofot s kreditem „© GKÚ Bratislava“
- **Kde:** `evaluation/germany/ab/images/index.html` (nadpis „Slovensko: pasporty měst“, kredit ZBGIS) a 15 obrázků tamtéž.
- **Co je špatně:** v repozitáři jsou výřezy ortofot Berlína (LGB, dl-de/by-2-0), Hamburku (dl-de/by-2-0) a NRW
  s cizím kreditem; `images.mjs ORTHO=de` nepřepsal titulek ani zdroj.
- **Oprava:** kredit podle země do stránky i do `REPORT.md`, nadpis opravit.

## Drobné

14. **„podle zavádějícího dopisu Bavorska“** (`rules.js:133`): česky to znamená „klamavého“. Myšleno Einführungsschreiben
    („dopisu, kterým Bavorsko RASt 06 zavedlo“). Německý a anglický překlad jsou správně, slovenský „zavádzacieho“ také.
15. **`landsAt` si pamatuje i neúspěch** (`lanes-ortho.js:75`): když se `laender.json` jednou nenačte, je Německo bez
    ortofota do znovunačtení; `fetch` nekontroluje `r.ok`.
16. **`blank()` platí pro všechny státy a celý obrázek** (`lanes-ortho.js:84, 159`): dlaždicové zdroje (SK, Brno)
    s chybějící půlkou dlaždic teď vrátí `null`; naopak obrázek z 40 % bílý u hranice země projde a řez v bílé části
    se čte jako světlá plocha. Měřit jen pás řezu.
17. **Podklad Rakouska má `maxNativeZoom: 19` všude** (`app.js:200`): Vídeň, Graz a Linz přišly o úroveň 20, kterou
    dřív měly.
18. **Německo zkouší až tři země po sobě** (`lanes-ortho.js:102–112`), každou s plným timeoutem; když WMS první země
    visí, řez čeká trojnásobek.
19. **Photon bez polohy mapy** (`search-photon.js:35`): „Hauptstraße“ v Mnichově vrátí ulice z celého Německa; do limitu
    20 se počítají i výsledky sousedních států v obdélníku, které se pak zahodí. Přidat `lat`/`lon` středu mapy.
20. **Text o soukromí** (`index.html:135–136`) nejmenuje servery spolkových zemí, Berlína, Hamburku, Cách ani komoot
    (hledaný text jde soukromé firmě).
21. **Značky:** jednosměrka se v DE kreslí vodorovnou Z 220, v AT se stejný druh tabule zahazuje (rozhodnutí Báry
    z 16. 11.); čelní obdoba IP 4b je Z 353. Zóna 20 se kreslí jako Z 274.1 se třicítkou. Názvy značek jsou překlady
    českých názvů (SK má `SK_TITLE`, DE ne). Šablona `signs-DE/274.svg` má titulek „B 20a“.
22. **`/api/eval-save`** (`server.mjs:182`): bez omezení velikosti těla a bez kontroly `Origin`; s `EVAL_SAVE=1` může
    kterákoli otevřená stránka zapsat soubor do `evaluation/universal/data/`. Jméno je ošetřené, server poslouchá jen
    na 127.0.0.1.
23. **Dokumentace:** `CLAUDE.md:281` říká „Odhad stání podle zákona vypnutý“, další odrážka opak; `app/README.md:711`
    „Německé značky ani data z Německa aplikace nemá“; `LICENCE-A-ZDROJE.md` a patička nemají povrchy Berlína,
    Hamburku a Cách ani Photon pro DE; `tools/check_sources.mjs` německé služby nehlídá.
24. **Hamburk:** „gemeinsamer Geh- und Radweg“ jde na chodník (702), ne na společnou stezku. **Cáchy:** `aachenCode`
    zahodí plochu s jakýmkoli neprázdným `level`; neověřil jsem, že úroveň terénu je vždy prázdná.
25. **Každý řez otevírá hlavičky všech čtyř balíků** (`osmpack.js:216`): pro českého uživatele navíc hlavička Německa
    (dnes 23 kB u zkušebního balíku, u celého odhadem stovky kB).

## Zapracování (17. 11. 2026)

- **Opraveno:** 1 (cleanCut: čtyři státy, všechny kredity), 2 (pruhy vedle zákonného stání aspoň 2,5 m), 3 (licence SN,
  ST, MV, SL dohledané, odkazy na licence v patičce), 4 a 25 (Německo po 16 zemích, každý balík pod 512 MB; index s
  obdélníkem dlaždic, aplikace otevře jen balíky u řezu), 6 (chyba jednoho balíku nechá ostatní odpovědět), 7 (zúžení
  stání z OSM jen v odhadnuté vozovce), 9 (bez varování, kde zdroj chybí; kolmé stání 4,5 + 0,7 m; protisměr bez
  varování), 10 (NDR podle spolkových zemí), 11 (logování bere polohy čtyř států; Worker musí Bára nasadit znovu),
  12 (u hranic zemí obě ortofota přes sebe, průhledné PNG), 13, 14, 15, 16 (jen německé zdroje), 18, 19, 20, 22, 23.
- **Ponecháno:** 5 (Německo bude bez dat, dokud se po prvním pushi nepostaví dlaždice; řekneme to Báře), 8 (Commons:
  1000-33 je „Radverkehr im Gegenverkehr“, 1000-32 „Radfahrer kreuzen von rechts und links“), 17 (podklad Rakouska z19
  všude, úroveň 20 je jen ve třech městech), 21 (zóna 20, Z 353; názvy jako u Rakouska z českých), 24 (Hamburk sdílená
  stezka jako chodník, OSM ji zpřesní), `check_sources.mjs` bez německých služeb.
