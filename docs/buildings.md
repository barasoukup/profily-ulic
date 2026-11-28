# Budovy a vzhledy domů

Vzhledy domů, výška a podlaží, regionální a socialistické vzhledy (specifikace vzhledů: `docs/house-types-europe.md`, `docs/house-types-north-america.md`).

## Stav a rozhodnutí (dříve CLAUDE.md)

- Budovy: 32 vzhledů (18 základních + 14 regionálních, viz níže; Bára 16. 11. 2026: činžák se šikmou střechou, měšťanský dům na náměstí, sorela, zděný bytový dům 50.–60. let, poválečný bytový dům (23. 11.), škola, kostel, garáž, funkcionalismus, panelák, moderní bytový
  dům, kancelář, městský dům, vila, rodinný dům 60.–80. let, nový rodinný dům, venkovský dům štítem do ulice, hala).
  Paneláků bylo moc: kontrola proti RÚIAN `evaluation/archive/panel-buildings/REPORT.md`, Street View 25 domů v `k-foceni.md`. Plochá střecha se rozlišuje podle tvaru bloku z OSM, IPR „nová budova“
  (pole ve stávajícím dotazu na Podlažnosti) a stáří zástavby (IPR Vývoj zástavby, statické dlaždice
  z `tools/build_built_up_age.mjs` při nasazení; Bára 8. 11. 2026: plošná vrstva je výchozí odhad, který
  přebijí údaje o domě).
- Vzhled domu čte všechny budovy OSM ve všech státech (`?off=vsedomy`; `evaluation/archive/all-buildings/REPORT.md`, Bára 25. 11. 2026);
  sada mobiliáře smí mít lampu do 5 m (`lamp-post-top`). Rakousko ve všech kolech 19 : 18, výjimka není.
  Blok kolem dvora jako „není poválečný dům“ zkoušeno, nevyhrálo (47 : 50; CH by ztratilo), v aplikaci není.
- Socialistické vzhledy (sorela, zděný dům 50.–60. let, panelák) jen v CZ, SK, PL, EE a bývalé NDR (Bára 23. 11. 2026,
  `countries/<ISO>.js` `socialistLooks`, DE podle `city.panels`); jinde i v „cizině“ `draw/buildings/style.js` `westernLook`: 1946–90
  poválečný bytový dům, deska před 1946 funkcionalistický, po 1990 moderní. Snímky `evaluation/archive/postwar-buildings/`.
- Regionální vzhledy starých domů Evropy (Bára 23. 11. 2026, specifikace `docs/house-types-europe.md`, pravidla
  `app/public/house-looks.js`, háček státu `houseLook`/`houseDetails` volaný po `westernLook`, Česko beze změny):
  haussmannovský (FR, MC, LU, Brusel), středomořský + azulejos (PT), galerie (sever ES), Malta, Kypr, cihlový s římsou
  (NL, Flandry), tallinnský a dřevěný dům (EE); severské (stenstad, dřevák, dánský, puukaupunki) jen jako pravidla
  `nordicLook(iso)` pro budoucí moduly SE/NO/DK/FI. Štítové domy (severomořský štít před 1800 nebo ve starém jádru,
  hanzovní dům ve starém Tallinnu, hřebenem kolmo k ulici) s obrysem štítu, schválené (Bára 23. 11. 2026): štít uříznutý
  okrajem řezu (2/3 šířky domu, `?stit=cely` celý souměrný, `?stit=0` vypne). Okna pokračují za řezem ve stejné rozteči
  (u okraje kus dalšího okna nebo nejvýš zeď mezi okny), vzory stěny až k okraji, u řezu žádný lem ani obrys (všechny
  vzhledy, i české; Bára 23. 11. 2026). Místo domu `info.at` (`app/cut.js`). Snímky a zpráva
  `evaluation/archive/regional-buildings/`.

## Výška a vzhled budov

Počet podlaží budov na okrajích profilu se v Praze bere z vrstvy IPR *Podlažnosti*
(`mp.iprpraha.cz/.../URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0`: podlaží po římsu, střešní/ustupující
podlaží, celkem, příznak nové budovy), v Brně z Průzkumu budov KAM, v Plzni z 3D budov, jinde z RÚIAN ČÚZK
(`gis.js` `ruianBuilding`: podlaží, využití, rok dokončení, druh konstrukce), jinak z OSM `building:levels`
(+ `roof:levels`). Výška se kreslí 3,5 m na podlaží (přesná výška z OSM `height` nebo z 3D budov), střešní podlaží
užší a tmavší. Osmnáct vzhledů domu (činžák se šikmou střechou, měšťanský dům na náměstí, sorela, zděný bytový dům 50.–60. let, poválečný bytový dům, škola, kostel, garáž, funkcionalistický činžák, panelák, moderní
bytový dům, kancelářská budova, městský dům, vila, rodinný dům 60.–80. let, nový rodinný dům, venkovský dům štítem do
ulice, hala; Bára 16. 11. 2026, nové kreslené na základě starších v `draw/buildings/style.js` `BASE_STYLE`) se volí podle tvaru bloku z OSM, údajů o domě a stáří zástavby: v Praze z vrstvy IPR *Vývoj zástavby*
(statické dlaždice z `tools/build_built_up_age.mjs`), jinde z roku dokončení v RÚIAN (do 1919 a 1946–57 šikmá střecha,
1948–57 sorela, 1958–69 zděný bytový dům do 5 podlaží (i deska), jinak od 1955 panelová éra, od 1996 moderní dům;
v Praze a Brně rok, zdi a využití domu z RÚIAN ČÚZK dalším dotazem při kliknutí, podlaží dál z IPR a KAM; stáří
zástavby IPR zůstává v Praze pro domy, u kterých RÚIAN rok nemá). Vnitřní město a sídliště podle vzdálenosti od centra má každé město
vlastní (`city.js` `innerKm`, `estateKm`). Panelák ne (Bára 16. 11. 2026, `evaluation/archive/panel-buildings/REPORT.md`): u domu
dokončeného před 1955, u zdí z cihel, kamene, monolitu či dřeva podle RÚIAN (kreslí se plochý činžák), u panelového
domu po 1995 (moderní dům); bez centra města (zbytek ČR, Slovensko) bez roku jen podle tvaru desky nebo od 8 podlaží.
Kód konstrukce 10 („kámen, cihly, tvárnice vč. kombinací“) nic neříká (na Lesné ho má třetina paneláků). Rodinný
dům (RÚIAN rodinný dům, OSM house, IPR typ 6) podle roku: do 1945 vila, 1946–89 „kostka“, od 1990 nový; štítem do
ulice (úzký půdorys, delší strana napříč ulicí, `derive.js` `gableToStreet`) a starý mimo vnitřní město venkovský dům,
stejně zemědělská usedlost RÚIAN (dřív hala); v řadě starší městský dům. Bytový dům 1948–57 (RÚIAN) sorela, 1958–69 bez panelů v RÚIAN zděný bytový dům 50.–60. let se šikmou střechou (Street View 25 domů, `evaluation/archive/panel-buildings/k-foceni.md`).
Socialistické vzhledy (sorela, zděný bytový dům 50.–60. let, panelák) jen tam, kde se stavěly (Bára 23. 11. 2026):
v Česku, na Slovensku, v Polsku, v Estonsku (sovětská sídliště) a v bývalé NDR (`countries/<ISO>.js` `socialistLooks`,
v Německu podle `city.panels`). Jinde, i v „cizině“, platí `draw/buildings/style.js` `westernLook`: sorela, zděný dům 50.–60. let,
panelová deska a plochý činžák z let 1946–90 jsou poválečný bytový dům (hladká omítka, pravidelné řady oken s rolety,
balkony s barevným parapetem, plochá střecha s tenkou atikou; `evaluation/archive/postwar-buildings/REPORT.md`), deska před 1946
funkcionalistický dům, po 1990 moderní, kancelář zůstává kanceláří. Ručně jde poválečný dům vybrat všude.
Regionální vzhledy starých domů (Bára 23. 11. 2026, `docs/house-types-europe.md`, `evaluation/archive/regional-buildings/REPORT.md`):
po `westernLook` se zeptá háčku státu `countries/<ISO>.js` `houseLook(style, info, n, city)` (pravidla v `house-looks.js`,
bez dotazů za běhu, stará města jako středy s poloměry); nahrazuje jen činžák se šikmou střechou, měšťanský a městský
dům (dřevěné domy i vilu a venkovský dům), do roku 1919–1940 podle vzhledu nebo bez roku. Haussmannovský dům (FR, MC,
LU, Brusel: mansarda v OSM, 1850–1930 a 5+ podlaží, nebo bez roku 5–8 podlaží v uzavřeném bloku velkého města),
středomořský dům (ES, IT mimo Jižní Tyrolsko, PT, francouzské Středomoří, MC do 4 podlaží; terasa nebo taška podle OSM
`roof:shape` a státu, ve Španělsku rolety a markýzy, `houseDetails`), portugalský s azulejos (polovina domů), dům
s galerií (Galicie, Asturie, Kantábrie, Baskicko), maltský s gallarijí, kyperský (do 1940 nebo bez roku ve starých
jádrech), cihlový dům s římsou (NL, Flandry, do 1920), tallinnský dům (2–3 podlaží, 1900–40, dřevo z OSM
`building:material` nebo dřevěné čtvrti) a malovaný dřevěný dům (EE). Severské vzhledy (omítaný činžák, malovaný
dřevěný dům se svislými prkny ve Švédsku, dánský cihlový činžák, dřevěný městský dům) zatím jen jako `nordicLook(iso)`
a `nordicDetails(iso)` pro budoucí moduly. Štítové domy (stupňovitý, krkový, zvonový štít; hanzovní dům) kreslí obrys
štítu nad bočním pohledem (Bára 23. 11. 2026 schválila): štít uříznutý okrajem řezu, vidět jsou 2/3 domu se špičkou
štítu (`?stit=cely` celý souměrný štít, `?stit=0` bez štítů). U všech domů okna pokračují za řezem ve stejné rozteči a
u řezu není lem ani obrys: dům tam pokračuje. Místo domu si profil drží zaokrouhlené v `info.at` (`app/cut.js`).
Kancelář, úřad, hotel (OSM nebo RÚIAN využití 5, 11, 14, 15) kancelářská budova; OSM school a kindergarten škola,
OSM church, chapel aj. kostel, OSM garage(s) a RÚIAN garáž garáž. Starý dům (RÚIAN do 1919, v Praze zastavěno do
1840) do 5 podlaží v samém centru (`city.coreKm`, výchozí 0,3 km od náměstí, Praha 0,6 km) je měšťanský dům.
Podloubí jen podle dat (Bára): cesta OSM `covered=arcade|colonnade|building_arcade` přes řez u fasády (5 m před ní až
8 m za ní, `derive.js`) → u jakéhokoli domu klenutý průchod v přízemí, v kartě „s podloubím (OSM)“. Věžák zvlášť nekreslíme: vysoký dům stejného stáří a využití vypadá po podlažích stejně (Bára).

Severní Amerika má 14 vlastních vzhledů (`houses-america.js`, výběr `house-looks-america.js` `northAmericaLook`, USA i Kanada;
`docs/house-types-north-america.md`, `evaluation/north-america-art/houses/REPORT.md`); bez dat prostý řadový nebo rodinný dům.
Vzhled domu čte všechny budovy OSM, i bez podlaží a výšky, ve všech státech (`?off=vsedomy` jen dřívější; `evaluation/archive/all-buildings/REPORT.md`);
registr budov má přednost. Panelák jen z tvaru bloku bez podlaží a druhu se nedělá, dům v řadě bez podlaží je ve Flandrech cihlový městský.
Sada mobiliáře smí mít vlastní lampu do 5 m (`lamp-post-top`, světlo `data-light` ve zvolené výšce, `profile.js postTopLamp`): Washington svůj glóbus, Boston je připravený.
