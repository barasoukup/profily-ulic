# Zjednodušení textů Profilů ulic: analýza a návrh (krok 1, kód se nemění)

Podnět Báry 27. 11. 2026: „zároveň ty věty zjednodušíme, aby nám nevznikalo tolik variant“; „můžeš napsat města
Washington a nemusíš skloňovat“. Podklad: `app/public/locales/cs.json` (1 305 klíčů), kód v `app/public/`.
Čísla níže jsou spočítaná ze souborů; odhady jsou označené.

## Princip

1. **Jméno vždy v 1. pádě, v závorce za druhovým slovem**: „mapa povrchů (Boston)“, ne „mapy povrchů Bostonu“.
   Šablona pak nemá žádný pád ani rod, který by záležel na jménu, a překladatel nemusí skloňovat ve 24 jazycích
   (litevsky dnes „Bostono dangų žemėlapio“, maďarsky by přibyla přípona, řecky pád).
2. **Vlastní jména, která se nepřekládají, jdou do kódu** (držitel dat „Comune di Bologna“, „DDOT DEM 2023“,
   „RVS 03.02.13“, „OpenStreetMap“, „MassGIS“, „IS DMVS ČÚZK“). Překládá se jen druhové slovo (ortofoto, mapa povrchů,
   budovy, stání), ne jméno.
3. **Jména měst jsou klíče `place.<id>`** (v 1. pádě; překládají se, protože el a bg potřebují přepis a řada jazyků
   má exonymum: Vídeň / Wien / Wiedeń / Viena; New York / Nueva York / Νέα Υόρκη). Jména států a jazyků **nejsou
   klíče**: dá je `Intl.DisplayNames(lang, {type: "region"})` (Rakousko / Austria / Österreich / Austrija). Seznamy
   („A, B a C“) skládá `Intl.ListFormat(lang)` („a / and / i / und / ir“), takže zmizí všechny šablony „X, Y a OSM“.
4. **Věty bez shody**: podmětem nikdy není jméno s rodem. „{name} teď neodpovídá“ je v češtině bez rodu (přítomný
   čas), místo „neodpověděla / neodpovědělo / se nenačetla“. Podstatné jméno před závorkou je vždy z pevného
   klíče (mapa povrchů), takže shoda je vyřešená v překladu jednoho klíče.
5. **Velké/malé první písmeno se nepřekládá dvakrát**: uložit tvar uprostřed věty, na začátek věty `ucfirst`
   (jazykově správné `toLocaleUpperCase(lang)`). Funguje jen směrem malé → velké (německé podstatné jméno je velké
   v obou polohách, jeho překlad je v obou klíčích stejný).

Pomocné funkce v `i18n.js` (nové): `ucfirst(s)`, `list(items)` (ListFormat), `country(code)` (DisplayNames),
`place(id)` (= `t("place." + id)`). Vlastní kód šablon je v `data.js` / `credits.js`, ne v `t()`.

## Skupiny textů, šablony a počty

Sloupec „dnes“ = klíčů v cs.json, „po“ = klíčů po úpravě (odhad, kde je u poznámky „odhad“).

| # | Skupina | dnes | po | Šablona (cs / en) | Příklad výsledku (cs) | Poznámka |
|---|---|---:|---:|---|---|---|
| 1 | Řádek „Data: …“ pod profilem: `app.*SurfaceMap*`, `app.roadInventory*`, `city.*.dataShort` | 68 | 16 | díly `data.surfaceMap` „mapa povrchů ({place})“ / „surface map ({place})“; `data.surfaceMapLines` „čáry mapy povrchů ({place})“; `data.orthophoto` „ortofoto ({source})“; `data.roadInventory` „pasport komunikací ({place})“; `data.greenInventory`; `data.townMap` „mapa města ({place})“; `data.technicalMap` „technická mapa ({source})“; `data.cadastralSurvey`; `data.streetInventory`; + 5 obecných („ortofota regionů“, „… spolkových zemí“, „… měst“, „otevřená ortofota“, „… stavebního úřadu“); spojí `list()` | „Data: mapa povrchů (Boston), ortofoto (MassGIS) a OSM“ | Dnes 28 vět s 28 pády jmen + 40 `dataShort` skládaných z týchž slov. Jména zdrojů (MassGIS, PDOK, GUGiK, IGN, DDOT) v kódu u města, ne v překladu. Berlín/Hamburk „mapa povrchů ulic“ splyne s „mapa povrchů“ (ztráta slova „ulic“). |
| 2 | Pole města `server`, `parkingSource`, `rulesHead`, `dataName`, `techMap` (`city.<id>.*`) | 148 | 13 | `city.server` zmizí (jméno z kódu); `app.serverNotRespondingTrying` „Server ({server}) neodpovídá, zkouším znovu ({n}/{of})…“; `dataName`/`techMap` se odvodí z `data.technicalMap`/`data.roadInventory` + místa + `ucfirst`; `app.loadingMap` „Načítám data: {map}…“; `parking.source.*`: odhad podle pravidel, parkoviště z technické mapy, „úseky placeného stání ({who})“, „parkovací místa ({who})“, 2 složené (Třebíč, Plzeň); `rules.head.regulations` „Šířky podle předpisů ({country}): {documents}“, `.guidelines` „… doporučení ({country}), nezávazné: …“, `.indicative` „… orientačně: …“, `.pragueManual` „Šířky podle pražského Manuálu IPR (C.2), orientačně ({place}):“, `.prague`, `.cizina`, `.monaco` | „Šířky podle předpisů (Německo): RASt 06, ERA 2010, VwV-StVO.“ / „Šířky podle pražského Manuálu IPR (C.2), orientačně (Jihlava):“ | Dnes 26× „OpenStreetMap“ (server) a 26× „odhad podle pravidel“ jsou čisté duplicity (65 klíčů s identickou hodnotou). `dataName` a `techMap` se liší jen velkým písmenem (4 dvojice). Rodová přídavná jména států („německých“) zmizí. |
| 3 | Výpadky zdrojů `sources.*` (37) | 37 | 16 | `sources.notResponding` „{name} teď neodpovídá.“ / „{name} is not responding right now.“; `sources.estimateOrthoOsm` „Profil je odhad z ortofota a OSM.“; `sources.estimateOsm` „Profil je odhad z OSM.“; `sources.notRespondingServer`; `sources.notRespondingSurfaces`; `sources.notLoaded`; `sources.missingOnSite` „{name} na webu chybí (při nasazení se nestáhla).“; ostatní beze změny | „Mapa povrchů (Washington) teď neodpovídá. Profil je odhad z ortofota a OSM.“ | 21 vět „Mapa povrchů X teď neodpovídá…“ se liší jen jménem a tím, zda je ortofoto (`…OrthoOsm`) nebo jen OSM. {name} = `ucfirst(data.surfaceMap({place}))`. |
| 4 | Poznámky za názvem ulice `note.*` (31) | 31 | 11 | `note.mapDownOrthoOsm` „ · {name} neodpovídá, odhad z ortofota a OSM“; `note.mapDownOsm` „ · {name} neodpovídá, jen odhad z OSM“; 9 ostatních (fasáda profilu, neúplná data, {n} podl., …) beze změny | „ · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM“ | 22 vět MapDown. Poznámka se ukládá do řezu (`cut.note`, odkaz `#rez=`, soubor) jako klíč: musí nést i parametry, viz Technické body. |
| 5 | Kredity: `credits.*` (82), `city.<id>.credit` (16), `site.networks*` (10), `app.orthophoto*` (3) | 111 | 31 | v kódu `„{what} © {holder}, {year} ({licence})“` (© a licence jsou ve všech jazycích stejné, bez klíče); překládá se jen `{what}`: `credits.what.orthophoto`, `.surfaceMap`, `.buildings`, `.buildingHeights`, `.buildingStoreys`, `.houses`, `.parking`, `.roadInventory`, `.greenInventory`, `.laneEdges`, `.kerbs`, `.lines`, `.drawing`, `.planimetry`, `.cadastralSurvey`, `.streetSurfaces`, `.trafficSigns`, `.networks`, `.technicalMap`, … (≈ 25 slov) + `credits.asOf` „stav {date}“, `credits.modified` „upraveno“, `credits.canton`, `.cantons` | „ortofoto © Comune di Bologna, Regione Emilia-Romagna (CC BY 4.0)“; „pasport komunikací © mesto Košice“ | Dnes jsou slovenská slova v české větě („pasport komunikácií“, „spevnené plochy“) a anglické právní věty; právní věty „Contains information licensed under …“ (2) zůstanou jako text v kódu (úřední znění licence). `city.<id>.credit` (16 dlouhých vět se seznamem datových sad) se složí z týchž slov přes `list()`. |
| 6 | Normy `country.<ISO>.*` (řádky „pruh: hodnoty (zdroj)“, 248) + tramvajový pás (10) | 258 | 121 (úroveň B) / 251 (A) | `norm.line` „{rule}: {values} ({source})“ / „{rule}: {values} ({source})“; `rule.*` ≈ 60 názvů (cyklopruh, podélné stání, …; dnes 94 různých, mnohé se liší jen pořadím slov: „stezka pro cyklisty jednosměrná“ × „jednosměrná stezka pro cyklisty“); slova hodnot (≈ 14): `norm.min` „min. {v}“, `norm.std` „základ {v}“, `norm.least` „nejméně {v}“, `norm.rec` „doporučeno {v}“, `norm.typ` „obvykle {v}“, `norm.tight` „ve stísněných poměrech {v}“, `norm.main` „na hlavních trasách {v}“, `norm.exc` „výjimečně {v}“, `norm.safety` „a bezpečnostní odstup {v}“, `norm.twoWay` „obousměrná {v}“ …; zdroj (RVS, DDOT, TP 117 s číslem článku) je v kódu; `rules.tramBelt`, `.tramBeltPoles`, `.tramBeltCarriageway` „Tramvajový pás {w} je užší než {min} ({source})“; zbylých ≈ 35 volných vět zůstane variantou | „cyklopruh: min. 1,5 m, základ 1,85 m (ERA 2010)“; „jízdní pruh: nejméně 10 ft (3,05 m), při více než 8 % těžkých vozidel 11–12 ft (Boston Complete Streets Guidelines 2013, s. 103)“ | **Úroveň A** (jen název pruhu a zdroj z klíče, hodnoty zůstanou textem): ušetří 7 klíčů tramvajového pásu, ale zbavuje překlad opakovaných jmen zdrojů a názvů pruhů. **Úroveň B** (hodnoty strukturou + 14 slov): −137 klíčů, ale mění slova hodnot („běžně“, „obvykle“, „základ“ → jedno z 4–5 slov) a vyžaduje přepsat 248 řádků v `countries/*.js` na data. Doporučuji A hned, B až po A/B nahlédnutí Bárou na 10 vzorových řádcích. Čísla (ft, m) formátuje kód. |
| 7 | Stání napůl na chodníku (`*.parkingHalfSidewalkOsm`, `common.`, `derive.parking*Pavement*`) | 24 | 23 | `rules.parkingHalf.head` „Stání napůl na chodníku z OSM: ve vozovce zůstává {free}.“ + `…lawAsks` „{law} žádá {need} ({detail}).“ + `…appLeaves` „Aplikace nechává {need}.“; 14 zemí s vlastním právním odstavcem (CH, CY, DK, EE, ES, FI, FR, IT, LI, LT, MC, MT, PT, SI) zůstane jako text | „Stání napůl na chodníku z OSM: ve vozovce zůstává 2,4 m, StVO § 12 žádá 3,05 m.“ | Skoro nic se neušetří (právní texty jsou jedinečné), ale věta „Stání napůl…: ve vozovce zůstává {free}.“ se dnes překládá 18× znovu a překlady se rozcházejí. Nechat jako variantu, jen sjednotit začátek. |
| 8 | Místa, kde profily neděláme (`cities.closed*`) a seznam států v popisu (`page.streetCrossSections*`) | 6 | 3 | `cities.closed` „Profily zatím děláme jen v těchto místech ({country}): {places}.“; `page.streetCrossSections` „Příčné profily ulic: {countries}“ (státy z `Intl.DisplayNames`); Kypr zůstane zvlášť (jiná věta) | „Profily zatím děláme jen v těchto místech (USA): Washington (District of Columbia), New York, San Francisco, Boston a okolí (okresy Suffolk, Middlesex a Norfolk).“; „Příčné profily ulic: Česko, Slovensko, Rakousko, Německo, …“ | Dnes „ve Washingtonu, v New Yorku, v San Franciscu a v Bostonu“ a „v Česku, na Slovensku, v Rakousku, ve Švýcarsku, na Kypru, na Maltě“ (předložka v/na podle státu v 24 jazycích). Nový stát = jen řádek v `countries.mjs`, ne nová věta. |
| 9 | Dvojice lišící se jen velkým písmenem (`app.tram` × `app.tram2`, `app.pavement` × `common.sidewalk`, `common.parking` × `…Lowercase`, …) | 42 | 24 | uložit tvar uprostřed věty, na začátku `ucfirst(t(…))` | „Tramvaj“ = `ucfirst(t("app.tram"))` | 21 dvojic; 18 je čistých (rozdíl jen v písmenu), 3 mají navíc „+ “ nebo „:“ (`app.addItem`, `app.undergroundNetworks`, `note.roadway`) a zůstávají. |
| 10 | Identické hodnoty mimo město (`attribution.openstreetmapContributors` = `common.openstreetmapContributors`) | 2 | 1 | jeden klíč | | Duplicity ve městech jsou už započítané ve skupině 2. |
| 11 | **Nové:** jména měst `place.<id>` (Praha, Brno, Jihlava, …, Washington, New York, Vídeň, Berlín, Paříž, Bratislava, Prešov, …) | 0 | 56 | `place.boston` = „Boston“ / „Boston“ / pl „Boston“ / el „Βοστώνη“ | | Odhad podle `city.js`, `PASSPORT_NAMES`, slovenských pasportů a výpadků ve `sources.js` (12 českých měst, 9 slovenských, ~25 zahraničních, 10 měst pasportů). Překlad je krátký, strojově i kontrolně levný. |

**Souhrn počtu klíčů** (1 305 dnes):

| | klíčů | rozdíl |
|---|---:|---:|
| dnes | 1 305 | |
| skupiny 1–8 (683 klíčů → 234) | | −449 |
| skupina 9 (velká/malá písmena) | | −18 |
| skupina 10 | | −1 |
| nová jména měst (skupina 11) | | +56 |
| **po úpravě, úroveň B u norem** | **≈ 893** | **−412 (−32 %)** |
| po úpravě, jen úroveň A u norem | ≈ 1 023 | −282 (−22 %) |

Odhad: ± 30 klíčů (přesný počet vyjde až při přepisu, hlavně ve skupinách 5 a 6). Do 24 jazyků to znamená asi o 11 200 překladů méně (468 klíčů × 24) a asi 1 300 nových krátkých (56 jmen měst × 24), čistě o asi 9 900 méně.

## Příklady šablon v jiných jazycích

Texty `cs` jsou zdroj, `en` a ostatní vycházejí z dnešních překladů (`locales/*.json`); všechny ukázky jsou návrh
k přeložení, ne hotový překlad.

**1. Řádek Data** (`data.surfaceMap`, `data.orthophoto`, `list()`; Boston)

- cs: „Data: mapa povrchů (Boston), ortofoto (MassGIS) a OSM“
- en: „Data: surface map (Boston), orthophoto (MassGIS) and OSM“
- pl: „Dane: mapa powierzchni (Boston), ortofotomapa (MassGIS) i OSM“ (dnes „mapy powierzchni Bostonu, ortofotomapy MassGIS i OSM“)
- de: „Daten: Flächenkarte (Boston), Luftbild (MassGIS) und OSM“ (dnes „der Flächenkarte von Boston, des MassGIS-Luftbilds und von OSM“, tři různé pády)
- lt: „Duomenys: dangų žemėlapis (Bostonas), ortofoto (MassGIS) ir OSM“ (dnes „Bostono dangų žemėlapio, MassGIS ortofoto ir OSM“)

**3. Výpadek zdroje** (`sources.notResponding` + `sources.estimateOrthoOsm`; Washington)

- cs: „Mapa povrchů (Washington) teď neodpovídá. Profil je odhad z ortofota a OSM.“
- en: „Surface map (Washington) is not responding right now. The profile is an estimate from the orthophoto and OSM.“
- pl: „Mapa powierzchni (Waszyngton) obecnie nie odpowiada. Profil jest szacunkiem z ortofotomapy i OSM.“
- de: „Flächenkarte (Washington) antwortet gerade nicht. Der Querschnitt ist eine Schätzung aus Luftbild und OSM.“ (bez členu: jméno jako nadpis; člen by záležel na druhovém slově, ne na jménu)
- lt: „Dangų žemėlapis (Vašingtonas) šiuo metu neatsako. Profilis yra įvertis iš ortofoto ir OSM.“

**4. Poznámka za ulicí** (`note.mapDownOrthoOsm`)

- cs: „ · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM“
- en: „ · surface map (Boston) not responding, an estimate from the orthophoto and OSM“
- pl: „ · mapa powierzchni (Boston) nie odpowiada, szacunek z ortofotomapy i OSM“
- de: „ · Flächenkarte (Boston) antwortet nicht, Schätzung aus Luftbild und OSM“

**2. Šířky podle předpisů** (`rules.head.regulations`, stát z `Intl.DisplayNames`)

- cs: „Šířky podle předpisů (Německo): RASt 06, ERA 2010, VwV-StVO.“
- en: „Widths per regulations (Germany): RASt 06, ERA 2010, VwV-StVO.“
- pl: „Szerokości według przepisów (Niemcy): RASt 06, ERA 2010, VwV-StVO.“ (dnes „niemieckich wytycznych“)
- lt: „Pločiai pagal taisykles (Vokietija): RASt 06, ERA 2010, VwV-StVO.“

**2b. Česká města** (`rules.head.pragueManual`; dnes „pro Jihlavu / Karvinou / Opavu“ = akuzativ, který česky nejde bez skloňování)

- cs: „Šířky podle pražského Manuálu IPR (C.2), orientačně (Jihlava):“
- en: „Widths per the IPR Prague manual (C.2), indicative (Jihlava):“
- pl: „Szerokości według praskiego Podręcznika IPR (C.2), orientacyjnie (Jihlava):“
- lt: „Pločiai pagal Prahos IPR vadovą (C.2), orientaciniai (Jihlava):“ (dnes už skoro takto)

**2c. Server a načítání** (`app.serverNotRespondingTrying`, `app.loadingMap`)

- cs: „Server (Jihlava) neodpovídá, zkouším znovu (2/3)…“ / „Načítám data: pasport komunikací (Jihlava)…“ (dnes „Server města Jihlavy“, „Načítám technickou mapu Jihlavy“)
- en: „Server (Jihlava) is not responding, trying again (2/3)…“ / „Loading data: road inventory (Jihlava)…“
- pl: „Serwer (Jihlava) nie odpowiada, kolejna próba (2/3)…“ / „Wczytywanie danych: inwentaryzacja dróg (Jihlava)…“

**5. Kredit** (`credits.what.*` + kód)

- cs: „pasport komunikací © mesto Košice“, en: „road inventory © mesto Košice“, de: „Straßeninventar © mesto Košice“, lt: „kelių pasas © mesto Košice“. Držitel je ve všech jazycích totožný, překlad je jen druhové slovo.

**8. Místa bez profilů** (`cities.closed`; USA)

- cs: „Profily zatím děláme jen v těchto místech (USA): Washington (District of Columbia), New York, San Francisco, Boston a okolí (okresy Suffolk, Middlesex a Norfolk).“
- en: „We currently make profiles only in these places (USA): Washington (District of Columbia), New York, San Francisco, Boston and the surrounding area (Suffolk, Middlesex and Norfolk counties).“
- pl: „Na razie tworzymy profile tylko w tych miejscach (USA): Waszyngton (Dystrykt Kolumbii), Nowy Jork, San Francisco, Boston i okolice (hrabstwa Suffolk, Middlesex i Norfolk).“
- lt: „Profilius kol kas darome tik šiose vietose (JAV): Vašingtonas (Kolumbijos apygarda), Niujorkas, San Fransiskas, Bostonas ir jo apylinkės (Safolko, Midlsekso ir Norfolko apygardos).“

**6. Normy** (`norm.line`, úroveň B)

- cs: „cyklopruh: min. 1,5 m, základ 1,85 m (ERA 2010)“, en: „cycle lane: min. 1.5 m, standard 1.85 m (ERA 2010)“, de: „Radfahrstreifen: mind. 1,5 m, Regelmaß 1,85 m (ERA 2010)“, pl: „pas dla rowerów: min. 1,5 m, standardowo 1,85 m (ERA 2010)“.
- Kde šablona nejde: věty typu „při více než 8 % těžkých vozidel 11–12 ft“, „Flandry podle šířky vozovky …, Valonsko nejméně …“ (≈ 35 řádků) zůstanou volným textem (varianta).

## Co se změní uživateli (odhad)

Z 683 klíčů ve skupinách 1–8 se asi **380** dnešních textů změní viditelně (jiný pád, pořadí nebo slovo), asi 300 vypadá stejně
(např. „odhad podle pravidel“, norma s tímtéž zněním po složení). Typické změny v češtině:

| Kde | Před | Po |
|---|---|---|
| řádek Data | „Data: mapy povrchů Bostonu, ortofota MassGIS a OSM“ | „Data: mapa povrchů (Boston), ortofoto (MassGIS) a OSM“ |
| výpadek | „Mapa povrchů Washingtonu (DC GIS) teď neodpovídá, profil je odhad z ortofota a OSM.“ | „Mapa povrchů (Washington) teď neodpovídá. Profil je odhad z ortofota a OSM.“ |
| poznámka za ulicí | „ · mapa povrchů Bostonu se nenačetla, odhad z ortofota a OSM“ | „ · mapa povrchů (Boston) neodpovídá, odhad z ortofota a OSM“ |
| záhlaví šířek | „Šířky podle pražského Manuálu IPR (C.2), pro Jihlavu orientačně:“ | „… orientačně (Jihlava):“ |
| záhlaví šířek | „Šířky podle německých předpisů (RASt 06, ERA 2010, VwV-StVO):“ | „Šířky podle předpisů (Německo): RASt 06, ERA 2010, VwV-StVO.“ |
| načítání | „Načítám technickou mapu Brna…“ | „Načítám data: technická mapa (Brno)…“ |
| server | „Server města Jihlavy neodpovídá…“ | „Server (Jihlava) neodpovídá…“ |
| název vrstvy | „Technická mapa města Brna“, „Pasport komunikací Třebíče“ | „Technická mapa (Brno)“, „Pasport komunikací (Třebíč)“ |
| místa bez profilů | „V USA zatím děláme profily jen ve Washingtonu …, v New Yorku, v San Franciscu a v Bostonu …“ | „Profily zatím děláme jen v těchto místech (USA): Washington …, New York, San Francisco, Boston …“ |
| popis stránky | „Příčné profily ulic v Česku, na Slovensku, v Rakousku, v Německu, …“ | „Příčné profily ulic: Česko, Slovensko, Rakousko, Německo, …“ |
| kredity | „pasport komunikácií © mesto Košice“, „komunikácie a spevnené plochy © mesto Zvolen“ (slovensky na české stránce) | „pasport komunikací © mesto Košice“, „komunikace a zpevněné plochy © mesto Zvolen“ (slova v jazyce stránky) |
| normy (úroveň B) | „nejméně 1,75 m, doporučeně 2 m“, „běžně 2 m, nejméně 1,5 m“, „základ 2,05 m“ | jedna sada slov: „min. 1,75 m, základ 2 m“ |

## Technické body (pro krok 2)

- **Uložené řezy**: `note.*` se ukládá do řezu jako klíč (odkaz `#rez=`, soubor, `legacy-cs-keys.json`: stará česká věta →
  klíč). Nové poznámky mají parametry (`mark(key, vars)` → řetězec `klíč|{"name":"…"}`), `legacy-cs-keys.json` zůstane
  a každou starou větu „mapa povrchů Bostonu se nenačetla…“ mapuje na novou dvojici klíč + parametr (skript z tabulky
  `note.*MapDown`). Odstraněné klíče proto nesmí zmizet z mapy dřív, než ji nahradí. Řezy, které už poznámku mají,
  se pak zobrazí novým zněním.
- **Test** `tests/i18n.test.js`: klíče se hledají jako `t("…")`; šablony se skládají v kódu z klíčů, takže test musí
  počítat i `data.*`, `credits.what.*`, `place.*` (přidat výjimku pro `t("place." + id)` jako dnes u `VARIABLE`, nebo
  seznam klíčů v jedné tabulce, kterou test prochází). Test shody `{názvů}` mezi jazyky zůstane.
- **Nástroje**: `i18n_add.mjs` na jména měst (jedno volání s tabulkou), překlady druhových slov (≈ 70 nových krátkých
  klíčů) půjdou přes agenty jako dosud; jména měst jen el a bg se přepisem, ostatní jazyky exonyma (Wien, Wiedeń).
- **Pořadí**: 1) pomocné funkce a `place.*`; 2) skupiny 1–4 a 8 (viditelný zisk, malé riziko); 3) kredity (5);
  4) skupina 2 (pole měst) spolu s 1; 5) normy úroveň A, potom případně B; 6) dvojice velkých písmen (9). Každý krok:
  `npm test`, regrese `evaluation/replay/` pro texty (hlášky jsou ve výstupu), prohlédnout 5 jazyků na vzorku řezů.
- **Rizika**: (a) větší část překladů se přepíše strojově: nutná kontrola (alespoň pl, de, lt, fi, hu); (b) „druhové slovo
  (jméno)“ je v některých jazycích méně přirozené než „X-ova mapa“ (fi, hu), ale srozumitelné a konzistentní; (c) `ucfirst`
  nesmí použít turečtinu (není mezi 24 jazyky) a v irštině respektovat „n-“ (v větě se nepoužívá); (d) „(Boston)“ za druhovým
  slovem zmizí v krátkých popiscích mapy, kde dnes stojí jen „Mapa povrchů“ (zůstane bez závorky).

## K rozhodnutí (Bára)

1. Jména měst jako klíče `place.*` s překladem do 24 jazyků (doporučuji), nebo jen jedno jméno v kódu (česky) a el/bg
   necháme neopravené? Druhé je levnější, ale řecky a bulharsky by stála latinka.
2. Normy: úroveň A hned, úroveň B po ukázce na 10 řádcích (doporučuji), nebo A natrvalo?
3. Závorka za druhovým slovem (`mapa povrchů (Boston)`) je v pořádku také v dlouhých větách (výpadek zdroje)?
4. Kredity v jazyce stránky (včetně slovenských zdrojů: „pasport komunikací © mesto Košice“) místo originální řeči zdroje?

## Rozhodnutí Báry 27. 11. 2026 a stav provedení (krok 2)

1. Jména měst jsou klíče `place.<id>` ve všech 24 jazycích (exonyma a písmo: Wien, Wiedeń, řečtina, bulharština), neskloňují se, vždy 1. pád.
2. Normy hned na úroveň B: strukturované hodnoty (`norm-text.js`: pravidlo `rule.<id>`, slova `norm.min/std/rec/exc/tight/twoWay/depth`, místo ve zdroji `norm.table/page/chapter…`). Provedeno u **40 ze 244 řádků**, které jsou čisté hodnoty se jmény zdrojů. Zbylých ~200 má podmínky („při 50 km/h“, „u obruby“) nebo zdroj s českým textem („příručka Paříže 2023“); jejich převod chce slovník podmínek a zdrojů (asi 45 zdrojů, desítky podmínek) a počet klíčů by u norem nesnížil. Zůstávají jako `country.<ISO>.*`.
3. Závorka se jménem za druhovým slovem platí všude (`data.js`, `sources.notResponding` + odhad, poznámky).
4. Kredity v jazyce stránky (`credit-text.js`, `credits.what.*`), držitel, produkt a licence zůstávají vlastním jménem.

Mechanika: `i18n.js` má `ucfirst`, `list` (Intl.ListFormat), `countryName` (Intl.DisplayNames, krátký tvar), `ref`/`text`/`place`; hodnota šablony `{k, v}` se překládá znovu. Poznámka řezu s parametry je `klíč|{json}` (`mark(klíč, vars)`), `legacy-cs-keys.json` vede staré české věty i odstraněné klíče `note.*MapDown` na `note.mapDownOrthoOsm|{…}` (nebo `…Osm`) se jménem. Klíče skládané v kódu hlídá `tests/i18n.test.js` seznamem prefixů `COMPOSED`.
Nedodělané skupiny z tabulky: 7 (stání napůl na chodníku), 9 (velká/malá písmena, 10 dvojic), 10, popis stránky `page.streetCrossSections*` (meta v `index.html` je statická čeština).

## Jména měst v jiných jazycích (Bára 28. 11. 2026)
- Ustálená exonyma zůstávají (Praga, Opawa, Koszyce, Pozsony, Prag, Brünn, Pilsen); jinak jméno v původní podobě (polsky Plzeň, ne Pilzno).
- Němčina: historická jména, která dnešní němčina běžně nepoužívá (Iglau, Troppau, Kaschau, Aussig…), ne.
