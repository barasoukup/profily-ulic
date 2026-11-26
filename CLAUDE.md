# Profily ulic – kontext pro Claude Code

Tenhle soubor shrnuje, co vzniklo v projektu „Street design“ na claude.ai. Historie chatu se
nepřenáší, platí jen to, co je tady a v souborech repozitáře.

## Komunikace
- S Bárou piš česky.
- Aplikace se jmenuje **Profily ulic** (ne „návrhář“).

## Cíl
Nástroj na příčné profily ulic (podobný Streetmixu) propojený s mapou: kliknutí na ulici v Praze
sestaví profil od fasády k fasádě z dat IPR a OSM, profil jde upravit (Stav / Návrh / porovnání)
a exportovat (PNG, SVG, JSON). Lehká samostatná aplikace s ilustracemi Streetmixu.

## Kde to běží
- Živě: https://streetspace.eu/profily/ (Bára 16. 11. 2026; doména u Wedosu, DNS v Cloudflaru: A/AAAA na GitHub Pages,
  `www` CNAME, vše DNS only, `data` je R2). Pages nasazuje aplikaci do `profily/`, kořen domény, `/profile/` a staré
  odkazy `barasoukup.github.io/profily-ulic/…` přesměrují tam i s řezem (`tools/build_root_site.mjs`).
- Repo: github.com/barasoukup/profily-ulic (MIT, © Bára Soukupová).
- Push na `main` = nasazení na GitHub Pages (`.github/workflows/pages.yml`), navíc každé pondělí
  obnova OSM. Dlaždice OSM ČR a Slovenska (Geofabrik) jsou zabalené do jednoho souboru na stát (`tools/pack_osm_tiles.mjs`,
  `pilot/public/osmpack.js`, čtení přes HTTP Range) na Cloudflare R2: kbelík `profily-ulic-osm` v Bářině účtu, doména
  `https://data.streetspace.eu/osm/` (DNS v Cloudflaru, Cache Rule), tytéž soubory na Pages (`data/osm-pack/`) jako
  záloha. Nahrává workflow přes S3 API (tajné `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, proměnná `R2_ACCOUNT_ID`).
  ČR 281 MB, SK 107 MB (Bára 15. 11. 2026, zpráva `evaluation/osm-r2/ZPRAVA.md`). Lokálně server čte dlaždice
  `pilot/data/osm-tiles` jako dřív, `?osm=balik` balík z `pilot/data/osm-pack`, `?osm=r2` z R2.
- Lokálně: `node pilot/server.mjs` → http://localhost:5173 (Node 22+). Dlaždice OSM:
  `tools/build_osm_data.sh`, hranice ZPS: `node tools/build_zps.mjs`.
- Popis pravidel: `pilot/README.md`, vyhodnocení 100 řezů: `evaluation/ZPRAVA.md`,
  licence: `LICENCE-A-ZDROJE.md`.

## Pravidla od Báry (dodržuj)
- **Nepushuj na GitHub, dokud Bára neřekne, že jsou změny odladěné.** Commituj lokálně a testuj
  na localhostu.
- Služby IPR smíme používat (Bára 10. 11. 2026 zrušila zákaz), **ale ohleduplně**: co jde, stáhnout jednou
  při nasazení (otevřená data Geoportálu), při kliknutí jen nezbytné dotazy, v testech cache a `evaluation/polite.mjs`.
- OSM jen z vlastních dlaždic celé ČR. Overpass jsme zkusili jako zálohu a je nepoužitelně pomalý
  (Bára 10. 11. 2026: „musíme se mu obecně vyhnout“).
- QGIS je nainstalovaný; všechny soubory patří do této složky.

## Zdroje dat
- Šířky (Praha): IPR MTVU, `https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer/15`,
  kredit „© IPR Praha“. Server IPR často vrací 503, aplikace opakuje dotaz. Zbytek ČR později přes
  DMVS ČÚZK (JVF DTM); zdroj držet přepínatelný.
- Tramvaje: osy kolejí z DTM IPR (kód 55010).
- Parkování: úseky parkovacích stání TSK (stejná data jako Golemio),
  `https://gs-pub.praha.eu/arcgis/rest/services/dop/zony_placeneho_stani/MapServer/3` (jen placené
  zóny). Hranice ZPS jsou statický soubor z `tools/build_zps.mjs` (žádný dotaz na kliknutí).
  Odhadované podélné stání jen mimo ZPS (žádná zóna do 100 m) a jen v místních ulicích,
  označené „odhad“. **Podle zákona** (Bára 10. 11. 2026; § 25 odst. 3 zák. 361/2000 Sb.: při stání musí zůstat
  volný pruh aspoň 3 m pro každý směr jízdy): obousměrka stání od 8 m na jedné straně, od 10 m na obou;
  jednosměrka od 5 m a od 7 m; chodník u obruby rozhodující není. U tramvaje 3,5 m od kolejnice (odst. 2). Golemio API by potřebovalo Bářin klíč (není).
- MTVU a technická mapa jsou povinně zveřejňovaná data, použití je v pořádku.

## Normy a limity (schválené Bárou)
- Kolmé stání ≥ 4,5 m (5,0 standard, ČSN 73 6056).
- Cyklopruh 1,50 m; 1,75 vedle podélného stání; 2,00 vedle kolmého/šikmého stání. Cyklostezka 2,50.
- Jízdní pruh 3,00 m.
- Tramvajový pás dvoukolejný: 6,5 m minimum (osová vzdálenost 3 m), 7 m standard, 8 m se sloupy
  (IPR Manuál tvorby veřejných prostranství, kap. C.2; PDF v `data/zdroje`).
- Strop šířky pruhu 4 m (3,75 dálnice, 4,5 místní); zbytek vozovky jako krajnice/šrafy, označený
  „odhad“. Krajnice se kreslí až od 1 m.
- Varování v Návrhu: minima z Manuálu C.2 červeně, základní šířky oranžově.
- Srovnání norem: https://claude.ai/artifact/7rkssF8z7y6zhEDBfEhbG8

## Rozhodnutí
- Žádný typ „sdílený prostor“; obytné a sdílené zóny mají vozovku jako pruh. Pěší zóna je chodník (kreslí se s lidmi,
  ne s auty; pruh jen tam, kde ho technická mapa opravdu má; Bára 17. 11. 2026, `derive.js` `pedestrianZone`, `?off=pesizona`).
- Ulice ze dvou vozovek se řeže uprostřed (středový pás / tramvaj).
- Ignorovat ulice pod mosty a podzemní cesty (metro, tunely se záporným `layer`/`level`).
- Interní model smí obsahovat i to, co Streetmix neumí (rychlosti apod.); převod na typy
  Streetmixu až při exportu.
- UI: mapa + upravitelný profil, posuvný předěl (výchozí 50:50), krátké popisky, v hlavičce jen
  název ulice, kurzor křížek. Výchozí podklad „Mapa IPR“ (rychlý rastr z ArcGIS Online).

## Seznam ke kontrole a vylepšení
- `docs/backlog.md` (Bára 21. 11. 2026): věci ke kontrole a vylepšení po oblastech. Co se objeví při práci (recenze, A/B,
  měření) a hned se neopraví, zapsat tam; hotové škrtnout s datem.

## Stav a otevřené věci
- Stav je jen k prohlížení; data se opravují po tlačítku „Opravit data“ (Bára 8. 11. 2026). Návrh je
  editovatelný vždy. Copyright kódu i pražských ilustrací: © Bára Soukupová (MIT).
- Budovy: 32 vzhledů (18 základních + 14 regionálních, viz níže; Bára 16. 11. 2026: činžák se šikmou střechou, měšťanský dům na náměstí, sorela, zděný bytový dům 50.–60. let, poválečný bytový dům (23. 11.), škola, kostel, garáž, funkcionalismus, panelák, moderní bytový
  dům, kancelář, městský dům, vila, rodinný dům 60.–80. let, nový rodinný dům, venkovský dům štítem do ulice, hala).
  Paneláků bylo moc: kontrola proti RÚIAN `evaluation/budovy-panel/ZPRAVA.md`, Street View 25 domů v `k-foceni.md`. Plochá střecha se rozlišuje podle tvaru bloku z OSM, IPR „nová budova“
  (pole ve stávajícím dotazu na Podlažnosti) a stáří zástavby (IPR Vývoj zástavby, statické dlaždice
  z `tools/build_vyvoj.mjs` při nasazení; Bára 8. 11. 2026: plošná vrstva je výchozí odhad, který
  přebijí údaje o domě).
- Vzhled domu čte všechny budovy OSM ve všech státech (`?off=vsedomy`; `evaluation/all-buildings/ZPRAVA.md`, Bára 25. 11. 2026);
  sada mobiliáře smí mít lampu do 5 m (`lamp-post-top`). Rakousko ve všech kolech 19 : 18, výjimka není.
  Blok kolem dvora jako „není poválečný dům“ zkoušeno, nevyhrálo (47 : 50; CH by ztratilo), v aplikaci není.
- Socialistické vzhledy (sorela, zděný dům 50.–60. let, panelák) jen v CZ, SK, PL, EE a bývalé NDR (Bára 23. 11. 2026,
  `countries/<ISO>.js` `socialistLooks`, DE podle `city.panels`); jinde i v „cizině“ `profile.js` `westernLook`: 1946–90
  poválečný bytový dům, deska před 1946 funkcionalistický, po 1990 moderní. Snímky `evaluation/budovy-povalecny/`.
- Regionální vzhledy starých domů Evropy (Bára 23. 11. 2026, specifikace `docs/house-types-europe.md`, pravidla
  `pilot/public/house-looks.js`, háček státu `houseLook`/`houseDetails` volaný po `westernLook`, Česko beze změny):
  haussmannovský (FR, MC, LU, Brusel), středomořský + azulejos (PT), galerie (sever ES), Malta, Kypr, cihlový s římsou
  (NL, Flandry), tallinnský a dřevěný dům (EE); severské (stenstad, dřevák, dánský, puukaupunki) jen jako pravidla
  `nordicLook(iso)` pro budoucí moduly SE/NO/DK/FI. Štítové domy (severomořský štít před 1800 nebo ve starém jádru,
  hanzovní dům ve starém Tallinnu, hřebenem kolmo k ulici) s obrysem štítu, schválené (Bára 23. 11. 2026): štít uříznutý
  okrajem řezu (2/3 šířky domu, `?stit=cely` celý souměrný, `?stit=0` vypne). Okna pokračují za řezem ve stejné rozteči
  (u okraje kus dalšího okna nebo nejvýš zeď mezi okny), vzory stěny až k okraji, u řezu žádný lem ani obrys (všechny
  vzhledy, i české; Bára 23. 11. 2026). Místo domu `info.at` (app.js). Snímky a zpráva
  `evaluation/budovy-regiony/`.
- Panorama z ulice: Mapy.com Panorama API, klíč jen v tajné proměnné repozitáře `MAPY_KEY` a v
  lokálním `pilot/public/config.local.js` (git ho ignoruje), nikdy v kódu.
- Tlačítko „Do Streetmixu“ je vyndané (Bára 8. 11. 2026), protože na Pages nefunguje (API Streetmixu
  nemá CORS). Převod `streetmix.js` zůstává s testy. Dotaz:
  https://github.com/streetmix/streetmix/issues/3828. Proxy přes Cloudflare je odložená do odpovědi.
- Nasazení zůstává na GitHub Pages; před nasazením běží `npm test`.
- Naposledy nasazeno 10. 11. 2026: celá ČR (dlaždice OSM ČR, WFS krajů), nová města, značky, vrstvy, hledání,
  záznam řezů (zapisuje se, ověřeno). Nasazení Pages potřebuje delší timeout (245 000 souborů, `timeout` v pages.yml).
- Sítě pod zemí (větev site-pod-zemi, Bára 12. 11. 2026): jen Praha (IPR TMIS; Brno publikuje jen kousky kresby, ne
  trasy), tlačítko ◍ Sítě u profilu (výchozí vypnuto, dotazy jen po zapnutí, zapne i vrstvu v mapě), kreslí se pod
  vozovkou ve skutečné hloubce a velikosti, ve Stavu i Návrhu, ne v Porovnat. `?site=1` zapne sítě, dokud je
  uživatel nevypne; přiblížení lupou zůstává i na dalším řezu; v Návrhu i v opravě dat se ulice nezužuje (díry
  „Neurčeno“), díra v opraveném Stavu se v Porovnat počítá jako změna (vše Bára 12. 11. 2026).
- Na příště (Bára 12. 11. 2026): výšky povrchu (výškové body technické mapy, DMR 5G) i pro samotný profil: kreslit ho
  ve skutečné výšce (jedna strana ulice výš než druhá, vyvýšená cyklostezka nad vozovkou).
- Na příště (Bára 12. 11. 2026): ortofoto má rozeznat vodorovné značení od nevyježděných světlých pásů uprostřed pruhů
  (řez 324 v Hradci, ČÚZK 12,5 cm): geometrie (pás leží mezi stopami kol, světlá místa po půl pruhu) a vlastnosti
  naučené z doznačených příkladů (kontrast, ostrost, šířka, vzor čárek, barva), ověřit křížově mezi městy.
- Nápady, Bára zatím nevybrala: zóny (obytná/pěší/30) a rychlosti po pruzích z OSM, povrch,
  názvy zastávek MHD, přechody.
- Rešerše: podobné nástroje https://claude.ai/artifact/F2fMQV88XSJJQiHX2YxLb6 (3DStreet pro 3D),
  rozšíření na celou ČR https://claude.ai/artifact/4U8qC5mKb5sTwLnvfYdeWn (proveditelné, začít Brnem).

- Neutrální moderní tramvaj a autobus (`pilot/public/generic/`, `art.js` GENERIC_VEHICLES; Bára 17. 11. 2026: „všude, kde
  nemáme specifickou“): v každé sadě, která nemá vlastní tramvaj nebo autobus, místo Streetmixu. Trolejbus a auta zůstávají
  ze Streetmixu. Snímky `evaluation/generic-vehicles/`.
- Pražské ilustrace: tramvaj T3, autobus SOR NB 12 v klasických bílo-červených barvách, mobiliář podle
  Olgoj Chorchoj, domy z boku ve 4 typech. Auta zůstávají ze Streetmixu (Bára rozhodla 8. 11. 2026).

## Brno (nasazeno 9. 11. 2026, vylepšení rozpracovaná)
- Samostatná stránka `/brno/` ze stejného kódu (`pilot/public/city.js`, `config.js` CITY,
  `tools/city_site.mjs`). Lokálně http://localhost:5173/brno/. Popis v `pilot/README.md`.
- Bára: co nejméně věcí lokálně. Brno se jako Praha ptá služeb při kliknutí: plochy z MTVU města
  (gis.brno.cz ags3 PUBLIC/opendata_mtvu), linie a body z kresby technické mapy UMPS (opendata_umps),
  budovy z KAM. Lokálně dlaždice OSM a parkování z mapy parkovanivbrne.cz (Bára: otevřená data
  z 2/2024 vynechat, stáhnout aktuální mapu; oblasti nepoužívat, rozhoduje úsek u řezu).
- Úpravy výpočtu z Brna (dřív `city.fix`) platí od 25. 11. 2026 všude i v Praze.
- Záložní postup z veřejné DTM kraje (`tools/fetch_dtm_brno.sh`, `tools/build_dtm_brno.py`) si Bára
  přeje schovat pro města bez vlastní služby (DTM kraje má u velkých silnic chybějící obruby).
- Ilustrace (`pilot/public/brno/`): tramvaj Tatra T3 v nátěru DPMB (Bára: je hezčí; 45T a 13T nakreslené taky), autobus DPMB, mobiliář podle
  zásad KAM Brno. Bára: u 13T i 45T není kolem čelního okna svislá červená, jen vodorovný červený pás pod oknem.
- Test 100 řezů: `evaluation/brno/ZPRAVA.md`, skripty `evaluation/run_brno.mjs`, `render_brno.mjs`.
- Otevřené: licence služeb města (MTVU, UMPS), úseky placeného stání jsou z 2/2024.

## Jihlava (lokálně hotová 9. 11. 2026)
- Stránka `/jihlava/` ze stejného kódu (`city.js` „jihlava“, `tools/city_site.mjs`), lokálně
  http://localhost:5173/jihlava/. Popis v `pilot/README.md`, kontrola řezů v `evaluation/jihlava/ZPRAVA.md`.
- Jako Praha s IPR se při kliknutí ptá serveru města (`gis.jihlava-city.cz`, CORS povolený): pasport komunikací
  (vozovka, chodník), budovy RÚIAN s počtem podlaží, trávníky, katastr (zahrady, dvory, krajnice; Bára: zaplnit
  „Neurčeno“), parkovací místa města s orientací, ploty z technické mapy, stromy, lampy, zastávky s přístřešky,
  stojany na kola. Služby vracejí WGS 84 jinou transformací (6 m vedle OSM): dotazy s `datumTransformation=1623`.
- Lokálně jen dlaždice OSM (výřez z Geofabriku ČR přes osmium, BBBike Jihlavu nemá).
- Ilustrace (`pilot/public/jihlava/`): trolejbus Škoda 32Tr a autobus Citelis DPmJ podle Bářiných fotek (krémová,
  červený pás, u 32Tr černé čelo s béžovou linkou). Trolejbus jen v bus pruhu pod trolejemi (OSM `trolley_wire`).
- Pravidla doplněná při Jihlavě, platí všude: obousměrka od 5,0 m na 2 × 2,5 m (Manuál C.2, nižší intenzity);
  dvousměrná ulice s jednou osou má polovinu pruhů každým směrem; krajnice jednosměrné vozovky u vnějšího okraje;
  řez 12 m od kruhového objezdu a obratiště; při „Otočit“ si domy nechávají barvy.
- Otevřené: klik přímo na kruhový objezd, kolmé stání mimo regulované zóny, přechody, troleje, zóny, jihlavský
  mobiliář.

## Most, Opava, Plzeň (lokálně hotové 9. 11. 2026)
- Každé malé město = modul `pilot/public/towns/<město>.js` (vzor Jihlava), texty v `city.js`, stránka, CSP a výřez OSM
  v `tools/cities.mjs`; nasazení a server berou seznam odtud. Postup pro další město v `pilot/README.md`.
- Bára vybrala z průzkumu 27 měst (Plzeň, Opava, Most; další připravená: Třebíč, Karviná a Frýdek-Místek přes WFS T-MAPY).
- Domy všech malých měst z RÚIAN ČÚZK (rok dokončení a panely místo stáří zástavby; Bára: Most má jen mladou zástavbu),
  vnitřní město a sídliště podle `innerKm`/`estateKm` města.
- Posun souřadnic: Most sedí, Opava 4 m a Plzeň 12 m bez `datumTransformation=1623`.
- Ilustrace podle fotek z Wikimedia Commons: Most tramvaj EVO2 a SOR NB 12, Opava 32Tr a Iveco Urbanway, Plzeň 40T, 26Tr a SOR NS 12.
- Otevřené: licence služeb měst, kolmé stání mimo zóny, Most bez stání s orientací, Plzeň bez os kolejí a lamp.
- Pardubice (9. 11. 2026): bez služeb města, plochy živě z celostátní technické mapy ČÚZK (`pilot/public/dmvs.js`,
  obrázek + typ plochy v bodě), univerzální cesta pro další města (Bára: „univerzálně pro všechna města“). 26/22/1 z 49.
- Plzeň: zóny placeného stání z otevřených dat (CC0, statický soubor při nasazení), stání v zóně se kreslí jako odhad.
- Dopravní značení: technická mapa (ani ČÚZK) ho nemá; Praha jen OSM nebo žádost podle zákona 106 (Bára: záloha).
- Dopravní značení z pasportů T-MAPY (pakom WFS, 10. 11. 2026): Děčín prázdné (jen kresba), Jablonec 30 čar, Tábor 178
  čar; svislé značky celé (tisíce, s kódem). Bára: moc by to nepřineslo, neřešit.

## Jedna stránka pro celou ČR (Bára 10. 11. 2026)
- Žádný přepínač měst: město se pozná podle místa řezu (`city.js` `cityAt`, hranice obcí z RÚIAN v
  `pilot/public/mesta.json`, `node tools/build_mesta.mjs`), mimo naše města platí „cesko“ (technická mapa ČÚZK,
  RÚIAN, OSM, pražský mobiliář a vozidla Streetmixu). Zdroje dat, ilustrace a texty se mění s městem řezu.
- Podkladové mapy: Mapa, Ortofoto, Technická mapa, OpenStreetMap; v každé jsou vrstvy měst omezené na jejich území.
- Staré adresy `/brno/`, `/jihlava/`… přesměrují na `/?mesto=…` i s řezem v odkazu. Data měst v `data/brno/`, `data/plzen/`.
- Logovat chceme jen řezy, volitelně další akce. Řez přesně (souřadnice, azimut, dosah jako v `#rez=`, město, ulice,
  typ ulice, čas; Bára: na řezu není nic osobního). Cloudflare Worker + D1 (`logging/`, návod v `logging/README.md`),
  adresa v proměnné repozitáře `LOG_URL`; nasadit musí Bára (její účet).

## Nasazeno 10. 11. 2026
- Řádek dopravních značek (`signs.js`, ikony `pilot/public/znacky/`, čísla podle vyhl. 294/2015 ve znění 205/2025: zóny IZ, IP 4c, IP 11b–g, V 15 BUS/TRAM) pod popisky prvků profilu (i v exportu, v Návrhu měnitelné), podoby podle vyhl. 294/2015
  (úřední díla, SVG z Wikimedia Commons, zmenšené): omezení rychlosti (i po pruzích), zóna 30, obytná zóna, pěší zóna
  (i s koly), cyklistická zóna/ulice, sdílená zóna, stezka pro chodce a cyklisty (C 9, C 10), cyklopruh (V 14),
  piktokoridor (V 20), směrové šipky řadicích pruhů (V 9a, z OSM turn:lanes), zákaz stání (B 29), zákaz zastavení (B 28), parkoviště IP 11 se způsobem stání (podélné,
  kolmé, šikmé), vyhrazené IP 12, ZTP (IP 12 + O 1), jednosměrka IP 4b a protisměr B 2 podle směru pohledu, obojí
  i s cyklisty v protisměru (OSM oneway, oneway:bicycle=no; po „Otočit“ se vymění), zákaz vjezdu všech vozidel B 1
  (vehicle/access=no) a motorových vozidel B 11 (motor_vehicle=no), s dodatkovou tabulkou výjimky (např. dopravní obsluha).
  Dále: vyhrazený pruh BUS (IP 20a, nápis V 11a), zóna placeného stání (IP 25a), stezka pro cyklisty (C 8a),
  ochranný cyklopruh (V 14 přerušovaně) proti vyhrazenému (V 14 plnou), cyklopruh v protisměru, zákaz vstupu chodců
  (B 30) a vjezdu cyklistů (B 8), dálnice (IP 14a) a silnice pro motorová vozidla (IP 15a), tramvajový pruh (V 13).
  Zóny jednou přes vozovku, nejvýš 2 značky na část.
- Odhad stání podle zákona (viz Parkování výše); mimo zástavbu bez chodníku a v obytné zóně se neodhaduje; stání na chodníku a napůl z OSM (on_kerb, half_on_kerb).
- Tramvaj ve třech druzích: v pruhu s auty; vyhrazený tramvajový pruh ve vozovce (koleje na vozovce, auta vedle,
  Spálená, Národní; kreslit v úrovni vozovky s V 13); samostatné těleso (MTVU 705 a obdobné, oddělené obrubou či
  zelení; štěrk, panely, tráva, obruby). Do Streetmixu dál jako tramvaj.
  OSM: embedded_rails=tram na silnici = koleje ve vozovce (Praha 523 úseků), samostatné těleso bez něj + MTVU 705;
  vyhrazený vs. sdílený pruh OSM nerozlišuje (počet pruhů); psv/bus=yes na kolejích (asi 186) = pruh tram + BUS.

## Pruhy z ortofota (Bára 11.–12. 11. 2026)
- `pilot/public/lanes-ortho.js`: čáry na ortofotu přeměří pruhy a krajnice a oddělí stání z dlažby; Praha IPR 10 cm,
  Brno 2025 s posunem, Plzeň 2024, jinde ČÚZK 12,5 cm. Pravidla v `pilot/README.md` (Jak se profil skládá, bod 11),
  vyhodnocení a co nevyšlo v `evaluation/ortofoto/ZPRAVA.md`, odkazy na zkoušení `evaluation/ortofoto/ODKAZY.md`.
- Krajnice z vodicí čáry může být i hodně úzká (Bára); pravidlo „krajnice od 1 m“ platí pro odhad podle pravidel.
- Proti ručnímu značení 117 vozovek: hranice pruhů do 0,3 m 25 → 39 %, počet pruhů 52 → 52 %, lépe 32, hůře 9.
- Zároveň: lampy svítí na nejbližší vozovku (ve středovém pásu na obě strany), troleje jen nad jedním pruhem každým
  směrem, ulice na mostě končí za krajním chodníkem, `slight_right/left` jako vpravo/vlevo, výběr části profilu
  vyznačený v mapě, Plzeň: „stavba pro zpevnění povrchu“ je zpevněná plocha.

## Bez technické mapy: ortofoto a OSM (Bára 15. 11. 2026)
- Pokus `evaluation/ortofoto-osm/ZPRAVA.md` (profil jen z ortofota a OSM proti MTVU, Praha a Brno): kombinace je
  lepší než samotné OSM (obruba do 0,5 m 39–49 % proti 26–35 %), ale zůstává hrubým odhadem. Rozlišení 20 cm stačí.
- Bára: použít jako záložní případ, když technická mapa chybí. `pilot/public/ortho-osm.js`, zapojené v `app.js`, když
  `deriveProfile` vrátí odhad z OSM (`estimate`). Plochy jsou označené jako odhad. Popis v `pilot/README.md` (bod 11a).
- Pro rozšíření do ciziny: nejdřív hledat místní mapy povrchů (NL BGT, Vídeň FMZK…), tohle je až záloha.
- Dlaždice OSM (Bára 15. 11. 2026): všechny budovy (ne jen s výškou; v ČR dál primárně RÚIAN, OSM navíc pro zahraničí),
  zeleň, voda, zahrádky, hřbitovy, obruby `barrier=kerb`, `area:highway`, u budov rok a střecha. Změřeno na celé ČR:
  1,39 GB proti dřívějším 0,84 GB (domy bez výšky 279 MB, zeleň 236 MB): na Pages (1 GB) se nevejde, proto jsou na R2
  (zabalené 281 MB). Popis v `pilot/README.md` (Dlaždice OSM).

## Slovensko (větev slovensko, 15.–16. 11. 2026)
- Stát řezu ze `staty.json` (`tools/build_staty.mjs`: ČR z RÚIAN, SR ze ZBGIS): `cesko`, `slovensko`, jinde `cizina`;
  `city.country` je ISO 3166-1 („CZ“, „SK“, mimo ně null), jazyk rozhraní je nezávislý (Bára).
  Mimo Česko (`towns/slovensko.js`, `city.abroad`) žádné dotazy na DMVS, RÚIAN ani ortofoto ČÚZK; profil je odhad
  z OSM a ortofota.
- ZBGIS ÚGKK SR (CC BY 4.0, GKÚ Bratislava; `/query` vrací 503, funguje identify/find/export/dlaždice): ortofoto
  `Ortofoto_hres` (asi 10 cm, s vyvážením barev, jinak asfalt vypadá jako tráva), budovy (druh, výška), hledání
  ulic, obcí a adres (`search-sk.js`). Vyhodnocení `evaluation/slovensko/ZPRAVA.md` (ortofoto lépe 10, hůř 2, stejně 16
  z 39). Slovenská vozidla a označníky nakreslené a zapojené (16. 11.).
- Jazyk a stát nikdy nemíchat a psát kódy ISO: jazyky malými (cs, sk, en), státy velkými (CZ, SK, AT) (Bára 15. 11. 2026).
- Značky státu SK (vyhl. 30/2020 Z. z.): `pilot/public/znacky-SK/` (piktogramy podle přílohy „Symboly“, tabulka klíčů
  v README), řádek značek podle `city.country` (`signFile/plateFile/signLabel(…, country)`); název značky v jazyce
  stránky, číslo podle státu. SK nemá způsob stání (jen 272), IP 4c (321 + 514, z druhé strany 230 + 507),
  vyhrazené stání je 270 + 531, sdílenou zónu nemá. Obě sady (CZ i SK) zkontroloval Fable proti vyhláškám a opravené.
- Značky (Bára 15. 11. 2026): C 10a ukazuje chodce na jejich straně (dál od vozovky, při „Otočit“ se prohodí, bez dat
  jako vzor: chodci vpravo); IZ 10a Sdílená zóna jen podle `traffic_sign` v OSM; C 7a Stezka pro chodce na pěší cestě;
  E 13 „Mimo dopravní obsluhy“ (2. pád, gramaticky správně).
- Pasporty měst (Bára 16. 11. 2026, `towns/slovensko.js` SK_TOWNS, jen ve větvi `slovensko`): Bratislava (magistrát:
  chodníky, vozovky, parkoviště; MČ Dúbravka), Žilina a Banská Bystrica
  (T-MAPY PaKom); jen kde má pasport plochu pod středem řezu, kolem budovy, zeleň a voda z OSM; `?pasport=0` vypne.
  A/B 115 řezů: lépe 28, hůř 7 (`evaluation/slovensko/ab/ZPRAVA.md`). Technická mapa Bratislavy (čáry + značky ploch)
  zapojená, ale vypnutá (`?tm=1`): málo značek, otevřené čáry. Licence neuvedené. Prešov vyřazený
  (Bára 25. 11. 2026: uzavřel vozovky a parkoviště, ArcGIS 499; zůstaly jeho stromy a čáry mapy, CC BY 4.0).
- Mimo Česko se vzhled domu neodvozuje od vzdálenosti od centra (žádné není), ale z OSM (rok, střecha, deska); panelák
  jen obytným domům (ZBGIS druh budovy). Ulice ze dvou jednosměrných vozovek má v odhadu obě. V nadpisu jen ulice,
  poznámka o datech pod ním. Panorama Mapy.com jen v CZ. Jazyky v rozbalovacím menu s vlajkami (vše Bára 16. 11. 2026; od 17. 11. v menu Soubor bez vlajek).
- Každá změna odhadu z ortofota a OSM (`ortho-osm.js`) musí projít regresí proti MTVU Prahy a Brna
  (`node evaluation/ortofoto-osm/regrese.mjs`, výchozí stav ve `vysledky/regrese.txt`; Bára 16. 11. 2026: „u každé změny
  je samozřejmostí test, zda to dosavadní výsledky jinde nezhoršuje“). Co zhorší, zůstane vypnuté (detekce aut `P.cars`,
  doplnění za pasportem `?vypln=1`, filtr trávy ZBGIS `P.areaGreen`).
- Změna jazyka načte stránku znovu, ale profil se nepřepočítává (stav záložky v sessionStorage); záblesk je v pořádku
  (Bára 16. 11. 2026), přepnutí za běhu je připravené v `i18n.js` (onLangChange), napojené není.
- Ilustrace SK (Bára 16. 11. 2026): vozidla měst (`pilot/public/bratislava|kosice|zilina|bystrica|presov/`, kreslířka a
  kritik ve 3 kolech) podle města řezu (`countries/SK.js` art, artAt); mobiliář český (Bratislava převzala od Prahy lavičku,
  koš a stojan Olgoj Chorchoj), označníky a přístřešky se slovenskou značkou 331 Zastávka (`pilot/public/slovensko/`).
  Vlastní bratislavský přístřešek, lampa a označník DPB až po zásadách MIB pro zastávky a osvětlení (přístřešky jsou
  v řezech vzácné). Technická mapa Bratislavy, čáry map Nitry, Piešťan, Zvolena, Hlohovce, Prešova: `?tm=1`, `?hrany=0`.

## Rakousko (větev austria, Bára 16. 11. 2026, rozpracované, nenasazené)
- Názvy v kódu a souborech anglicky (Bára 16. 11. 2026): stát `austria` (`country` AT), `towns/austria.js`,
  `signs-AT/`, `evaluation/austria/`. Stávající české názvy zůstávají.
- Hranice z Eurostat GISCO 1 : 1 M v `staty.json` (BEV WFS je vypnutá); Česko a Slovensko mají přednost.
- OSM: výřez Geofabrik `austria`, balík `at` jen na R2 (na Pages by se nevešel 1 GB), workflow staví cz, sk, at.
- Ortofoto basemap.at (`bmaporthofoto30cm`, Web Mercator do z20, CORS, CC BY 4.0) pro pruhy, obruby a podklad.
- Vídeň: Flächen-Mehrzweckkarte (FMZK, data.wien.gv.at WFS 2.0, CC BY 4.0 „Stadt Wien – data.wien.gv.at“) jako plochy
  řezu, kde má ulici pod středem (`?wien=0` vypne; A/B 40 řezů: lépe 9, stejně 2, sporný 1 z 12 prohlédnutých,
  `evaluation/austria/ab/ZPRAVA.md`). Neodpoví-li některá vrstva, FMZK se nepoužije a poznámka to řekne. Další města (Graz, Linz, Innsbruck, Klagenfurt)
  otevřené mapy povrchů nemají; Salcburk má buspruhy, zóny, stromy a značky (nezapojené).
- Normy `countries/AT.js` limits (`evaluation/austria/NORMY.md`): cyklo podle RVS 03.02.13 (přes NÖ Leitfaden, druhotně), ostatní
  Wiener Projektierungshandbuch (MA 18, 2011); RVS 03.02.12, 03.04.12, 03.07.11 nejsou veřejné.
- Značky `signs-AT/` (StVO § 52–53, Commons, úřední díla); stání na chodníku, vyhrazené stání a cyklopruh nemají značku.
- Odhad stání podle zákona zapnutý od 17. 11. 2026 (StVO § 24 odst. 3: dva volné pruhy, judikatura asi 2,6 m na pruh, v jednosměrce jeden).
- Jednosměrka se v Rakousku pod pruhem neznačí (Bára: Einbahnstraße je jen tabule podél ulice); odvozené značky bez
  rakouské kresby a značky s dodatkovou tabulkou se zahodí.
- Nepřátelská recenze 16. 11. 2026 zapracovaná (cache nasazení podle států, skupiny silnic z OSM, StVO § 24, mapování
  FMZK, poctivé citace norem, licence).
- Hledání: Vídeň z adresních bodů města (`search-at.js`), jinde v Rakousku Photon od komoot (`search-photon.js`; Bára
  16. 11. 2026: záloha, BEV jen s registrací a poplatky). Salcburk: zákaz zastavení a stání z katastru značek.
- Žádný panelák v Rakousku (Bára 16. 11. 2026): deska z let 1946–90 je poválečný bytový dům (od 23. 11.), před 1946 funkcionalistický, po 1990 moderní, kanceláře kanceláře.
- Chybí: vozidla a mobiliář měst (kreslí se), Kurzparkzonen (aplikace zóny nekreslí), sítě (otevřené nejsou).

## Státy, města a zdroje (přestavba, větev architecture-countries, 16. 11. 2026, nenasazené)
- Plán `docs/architecture-countries.md` (Fable schválil s úpravami). Struktura všude stejná: stát → město → zdroje.
- Stát = modul `pilot/public/countries/<ISO>.js` (CZ, SK, AT; `default.js` pro „cizinu“ a výchozí hodnoty), načítaný
  staticky: normy, zákon o stání, značky, ortofoto, ilustrace měst státu, vzhled domů, hledání. Vedle `city` je `country`
  (modul státu), `city.country` zůstává ISO. Mimo `countries/` žádná podmínka na stát. Pro nasazení řádek v
  `tools/countries.mjs` (pages.yml z něj bere smyčky), CSP hlídá `tests/csp.test.js`.
- Město dědí od státu, co nemá svého (ortofoto pruhů, přepíše ho `laneOrtho`); jen svá data popisují vlastnosti města
  (`roadOnPath`, `slowServer`, `ruianYear` u Prahy a Brna). Zdroje mají
  vlastní území (`places.js inArea`, `AREAS`), `towns/index.js placeAt`. Kredit zdroje je klíč v `credits.js`
  (opraveno: uložený řez v Košicích, Grazu, Innsbrucku se neztratí, slovenské a rakouské kredity zůstanou).
- Výstup beze změny ověřen záchrannou sítí `evaluation/replay/` (369 nahraných řezů SK, AT, Praha, Brno, cizina;
  přehrání před a po, tabulky ve 4 jazycích). České řezy mimo Prahu a Brno nahrát po odstávce DMVS (od 19. 11.).
- Krok 4b (Bára 16. 11. 2026): města všude. Slovenská (Bratislava, Košice, Žilina, B. Bystrica, Prešov, Nitra, Trnava,
  Trenčín, Martin, Poprad, Piešťany, Hlohovec, Zvolen) a rakouská (Vídeň, Graz, Linz, Salcburk, Innsbruck) jsou města jako
  Brno, podle hranic obcí (`mesta-sk.json` ze ZBGIS, `mesta-at.json` z obcí LAU Eurostatu GISCO 2024 = Statistik Austria,
  `tools/build_towns_at.mjs`; soubor Statistik Austria na open data už není). Texty, zdroje a normy mají od zbytku státu,
  ilustrace svoje (bez vlastní sady státu). Log má vedle `city` i `country` (ISO); D1 potřebuje
  `ALTER TABLE events ADD COLUMN country TEXT` a nový Worker (nasadit musí Bára, `logging/README.md`). Opraveno zároveň:
  Worker zahazoval polohu řezů východně od 20° v. d. (Košice) a západně od 11° (Bregenz).

## Německo (Bára 17. 11. 2026, přeneseno na přestavbu států, nenasazené)
- Stát `germany` (`country` DE): `countries/DE.js` (normy, značky, zákon o stání, ortofota zemí, domy, hledání),
  `towns/germany.js` (mapy povrchů měst), `signs-DE/`, `evaluation/germany/` (ZDROJE, NORMY, RECENZE, ab/). Hranice GISCO 1 : 1 M za Českem,
  Slovenskem a Rakouskem (`node tools/build_staty.mjs germany` přestaví jen Německo).
- OSM: Německo po 16 zemích (výřezy Geofabriku, balíky `de_by`, `de_nw` … jen na R2, každý pod 512 MB), každá země svůj job
  v `osm-tiles.yml` (`tools/countries.mjs` parts); index má obdélník dlaždic každého balíku.
- Ortofoto všech 16 spolkových zemí (WMS v EPSG:3857 s CORS, `lanes-ortho.js DE_ORTHO`), země řezu podle `laender.json`
  (GISCO NUTS 1, `tools/build_laender.mjs`); u hranice se zkusí sousední země, prázdný snímek se nepoužije. Hamburg
  výslovně rok 2024 (2022 je satelit pod uzavřenou licencí). Tabulka a licence `evaluation/germany/ZDROJE.md`.
- Bára: zatím bez vlastních ilustrací („obrázky jsou nejdražší“): rakouské označníky a přístřešky (kulaté H = Z 224),
  český mobiliář, neutrální tramvaj a autobus (`generic/`).
- Paneláky jen ve východních zemích a v Berlíně (bývalá NDR podle `laender.json`, `countries/DE.js atPlace`), na západě jako v Rakousku.
- Značky `signs-DE/` (StVO, Commons, úřední díla § 5 UrhG) i s dodatkovými tabulkami (Anlieger frei, Radfahrer frei, Radverkehr
  im Gegenverkehr); jednosměrka jen Z 267 proti směru (Z 220 je šipka podél ulice bez přímé podoby, vynechává se jako
  v Rakousku; Bára 17. 11. 2026); sdílenou zónu Německo nemá.
- Normy `limitsDE` (`evaluation/germany/NORMY.md`): RASt 06, ERA 2010, EAR 23 jen podle sekundárních zdrojů; šířky pruhů
  a buspruhů jen orientačně (zdroj nenalezen), tramvajový pás bez varování. Stání napůl na chodníku: StVO § 12 a judikatura
  3,05 m na projetí (pruhy vedle stání aspoň 2,5 m).
- Stání (Bára 17. 11. 2026): zákonný odhad i v AT a DE (místní ulice; `?odhadstani=0`), stání zakreslené v OSM se do
  úzké odhadnuté vozovky zúží (do 85 %). Měření: chybí stání DE 15 → 8, AT 14 → 11 (zbytek: podhodnocená vozovka).
- Hledání Photon (Německo podle mapy; německy vypadající dotaz, který RÚIAN nenajde, i z jiného místa).
- Mapy povrchů ulic Berlína, Hamburku a Cách zapojené (`towns/germany.js`, `?berlin=0` …; A/B v `evaluation/germany/ab/`).

## Švýcarsko a Lichtenštejnsko (větev switzerland, 17. 11. 2026, nenasazené)
- Státy `switzerland` (CH) a `liechtenstein` (LI): `countries/CH.js`, `LI.js` (švýcarská pravidla s lichtenštejnskými čísly
  článků), `towns/switzerland.js`, `signs-CH/`, `evaluation/switzerland/` (ZDROJE, NORMY, RECENZE, ab/). Hranice
  swissBOUNDARIES3D swisstopo v `staty.json` hned za Českem a Slovenskem (Büsingen a Campione jsou díry).
- Ortofoto SWISSIMAGE 10 cm (WMTS z20, `lanes-ortho.js` `ch`, dlaždice `{z}/{x}/{y}`), i pro Lichtenštejnsko.
- Plochy z úředního vyměřování (Amtliche Vermessung, `LCSF`) přes WFS geodienste.ch, všechny kantony, které ho sdílejí,
  i Lichtenštejnsko; Vaud (Lausanne) a Luzern ne. Jen když je pod středem řezu vozovka, chodník nebo dráha (ne
  `uebrige_befestigte`: most, nábřeží, molo). Fair use 10 dotazů WFS za minutu: v testech pauza 7 s. `?av=0` vypne.
  A/B 42 řezů: po opravě lépe 15, hůř 1. Licence po kantonech neprověřené.
- Měření přesnosti 17. 11.: shoda složení CH 59 % (18 řezů), LI 69 % (6); s vyměřováním 69 %, bez něj 41 % (`evaluation/switzerland/ZPRAVA.md`).
- Normy VSS jen podle kantonálních a městských příruček (Bern, Basel-Stadt, Curych, Schwyz), kde chybí, bez varování.
  Stání: VRV čl. 19 a pomůcky kantonů Bern a Luzern (3 m na projetí); vyznačená pole nemáme, odhad může nadhodnocovat.
- Značky SSV z Commons (ASTRA, čl. 5 URG), stejná čísla v LI; tabulky „Zubringerdienst“ a „ausgenommen Velos“ jsou text,
  značka s nimi se nekreslí. Hledání Photon v místních jazycích. Bez paneláků, neutrální vozidla, český mobiliář.
- OSM balíky `ch` a `li` jen na R2 (Geofabrik `switzerland` Lichtenštejnsko nemá). Lokálně jen města vzorku. **Před
  nasazením spustit workflow OSM tiles ručně se `states: ch,li`** a ověřit `data.streetspace.eu/osm/index.json` (push je
  nepostaví, recenze Fable). Recenze a co se z ní udělalo: `evaluation/switzerland/RECENZE.md`.
- Francouzštinu ani italštinu rozhraní nepřidávat bez Bářina souhlasu.

## Nizozemsko (větev netherlands, Bára 20. 11. 2026, nenasazené)
- Stát `netherlands` (NL): `countries/NL.js`, `towns/netherlands.js`, `signs-NL/`, `search-nl.js`, `evaluation/netherlands/`
  (ZDROJE, NORMY, ab/). Hranice GISCO za Německem. Bára: „stačí s univerzálními ilustracemi“ (neutrální vozidla, český
  mobiliář, rakouské označníky), bez paneláků.
- Mapa povrchů BGT (PDOK, CC0) kde má u středu řezu vozovku, cyklostezku, stání nebo tramvajové těleso, samotný chodník
  nestačí (`?bgt=0`); API vrací i staré verze, proto `datetime`. A/B 37 řezů po recenzi: BGT u 24, lépe 13, stejně 10,
  sporně 1, hůř 0 (`evaluation/netherlands/ab/ZPRAVA.md`, recenze `RECENZE.md`). Budovy `?bag=0`.
- Budovy BAG (rok, využití) a 3D BAG (podlaží, střecha); ortofoto PDOK 8 cm; hledání PDOK Locatieserver; sítě Amsterdamu
  (stoky Waternetu, kabely osvětlení); parkovací plochy z BGT (parkeervlak). Parkovací místa Amsterdamu se způsobem stání
  zapojená, ale vypnutá (`?amspark=1`, A/B smíšené, licence neuvedena); RDW neodpovídá, KLIC 403.
- Úroveň ulice (most, nábřeží pod ulicí) z OSM `bridge`/`tunnel`/`layer`. Měření přesnosti 20. 11.: shoda složení 52 %,
  šířka do 2 m 41 % (32 řezů); červené cyklopruhy jsou v BGT „fietspad“, pokus `?fietsstrook=1` nepomohl.
- Normy CROW jen přes příručky Amsterdamu a CROW-Fietsberaad; RVV 1990 šířku vedle stání neuvádí: 3,5 m (hasiči)
  a 4,5 m obousměrně jako praxe. Stání na chodníku jen u E8b.
- OSM po 12 provinciích (`nl_*`, jen R2). **Před nasazením spustit workflow OSM tiles ručně se `states: nl`.**
- Nápad do budoucna (Bára 20. 11. 2026): srovnávat a přepínat normy různých států, aby byly vidět rozdíly přístupů.

## Belgie a Lucembursko (větev belgium z netherlands, Bára 20. 11. 2026, nenasazené)
- Státy `belgium` (BE) a `luxembourg` (LU): `countries/BE.js`, `LU.js`, `towns/belgium.js`, `towns/luxembourg.js`,
  `signs-BE/`, `signs-LU/`, `evaluation/belgium/` (ZDROJE, NORMY, ab/), `evaluation/luxembourg/`. Hranice GISCO.
- Žádná mapa povrchů s chodníky jako služba (Brusel UrbIS jen ke stažení, Lucembursko BD-L-TC jen ZIP): odhad z ortofota
  a OSM. Ve Flandrech čáry GRB, ve Valonsku PICC jako kandidáti obrub (`?hrany=0`; A/B: lépe 4, hůř 2 z 10 změněných).
- Ortofoto Flander (i Brusel), Valonska a ACT Lucemburska; hledání Photon. Univerzální ilustrace, bez paneláků.
- Stání: Belgie čl. 25.1, 7° AR 1975 3 m volného průjezdu celkem (AR 1975 platí do 31. 5. 2027, pak nové kódy);
  Lucembursko obecnou šířku nemá (3 m jen u plné čáry): zákonný odhad stání zapnutý (Bára 21. 11. 2026: bez obecné šířky se smí stát skoro všude, aplikace nechává průjezdné pruhy aspoň 3 m).
  Lucemburské značky jsou úřední díla (Bára 21. 11. 2026; Commons u části uvádí CC BY-SA od toho, kdo je nahrál).
- Regiony Belgie podle NUTS 1 (`regions-be.json`, `tools/build_regions_be.mjs`): ortofoto i čáry jen regionu řezu,
  Brusel bez dotazu na čáry. Měření 20. 11.: BE složení 52 %, šířka do 2 m 26 % (nejčastěji chybí stání v úzkých
  ulicích, jeden široký pruh), LU 53 % a 33 % (12 řezů). Recenze `evaluation/belgium/RECENZE.md`.
- **Před nasazením spustit workflow OSM tiles ručně se `states: be,lu`.**

## Polsko (větev poland z belgium, Bára 21. 11. 2026, nenasazené)
- Stát `poland` (PL): `countries/PL.js`, `towns/poland.js`, `search-pl.js`, `signs-PL/`, `evaluation/poland/`. Hranice z PRG
  GUGiK (přesná, ve `staty.json` před Rakouskem a Německem; GISCO dávalo Německu pás Zgorzelce a Słubic).
- Ortofoto GUGiK (celostátní, WMS HighResolution), hledání GUGiK UUG (PRG, „město, ulice číslo“), mapa povrchů Krakova
  (MJO). BDOT10k zamčený (401), Varšava, Vratislav, Gdaňsk, Poznaň bez otevřených služeb.
- Normy RMI 2022 (závazné), buspruh, stání a tramvaj z nezávazných WR-D. Stání odhadem jako LU (zákon šířku nemá).
  Paneláky ponechané (wielka płyta jako v Česku). **Před nasazením workflow OSM tiles se `states: pl`.**
- A/B mapy Krakova po recenzi slabé (lépe 7, hůř 6; mosty a víceproudé ulice lépe, chodník napůl „chodník + stezka“
  tam, kde OSM vede cyklostezku po chodníku). Od 26. 11. 2026 **vypnutá**, zapne ji `?krakow=1` (Bára: pravidla města
  chtějí písemný souhlas správce MSIP, `evaluation/licence/ZPRAVA.md`; na přehledové mapě není). Měření 21. 11.: složení 67 %, šířka do 2 m 32 %
  (22 řezů). Recenze `evaluation/poland/RECENZE.md`.

## Francie (větev france z poland, Bára 22. 11. 2026, nenasazené)
- Stát `france` (FR): `countries/FR.js`, `towns/france.js`, `search-fr.js`, `signs-FR/`, `evaluation/france/` (ZDROJE, NORMY,
  ab/). Hranice GISCO (pevnina a Korsika). OSM po 22 regionech (`fr_*`, jen R2). **Před nasazením workflow OSM tiles se
  `states: fr`.**
- Ortofoto IGN (Géoplateforme, CORS *, mimo Francii bílé: v mapě jen nad Francií), budovy BD TOPO (`?bdtopo=0`), šířky
  vozovek BD TOPO vypnuté (`?sirka=1`, celé metry, bez A/B), hledání Géoplateforme (BAN).
- Mapa povrchů Paříže (Plan de voirie, ODbL, `in_bbox` po 100 záznamech; třída „Piste“ jsou zálivy stání): A/B 40 řezů,
  použita ve 28: lépe 5, hůř 2 (sporné: tmavé asfaltové chodníky), stejně 17; zapnutá, `?paris=0`.
- Normy: závazná jen přístupnost (arrêté 2007), jinak CEREMA a příručky Paříže a Lyonu (z druhé ruky, označeno), pruhy jen
  oranžově, tramvaj bez varování. Stání odhadem jako LU a PL. Značky jako úřední díla (jako LU). Bez paneláků.
- Měření 22. 11. (25 řezů v 10 městech): složení 57 %, šířka do 2 m 48 %; nejčastěji chybí chodník (10×) a stání navíc (8×).
- Recenze `evaluation/france/RECENZE.md`: opravena dvojitá cyklostezka (mapa + cyklopruh OSM, obecně v `derive.js`,
  `?off=kolodvakrat`), Llívia, výšky BD TOPO, normy.
- Bára 23. 11. 2026: paneláky ne (sídliště vypadají jinak než česká), značky volně (úřední díla), doporučení měst smí
  varovat v celé Francii. Bulváry a krajnice (`evaluation/france/ab/bulvary/ZPRAVA.md`): stání z pařížské evidence
  parkovacích míst (`?parisstani=0`), delší dosah hlavních ulic končících ve středovém pásu (dnes `app.js widerSides`), vozovka jen
  pro autobusy jako druhá polovina ulice (`?off=busduo`) a buspruh z krajnice (`?off=buskrajnice`; obojí obecně, Praha
  a Brno beze změny). Krajnice zůstávají u 10 z 26 bulvárů (široké vozovky bez čar na ortofotu); vypnout je bylo horší.

## Španělsko (větev spain z france, Bára 23. 11. 2026, nenasazené)
- Stát `spain` (ES): `countries/ES.js`, `towns/spain.js`, `search-es.js`, `signs-ES/`, `evaluation/spain/` (ZDROJE, NORMY, ab/).
  Hranice GISCO s ostrovy, Ceutou, Melillou a Llívií. OSM po 17 společenstvích, Ceutě, Melille a Kanárských ostrovech
  (`es_*`, Kanáry pod `africa/`, jen R2). **Před nasazením workflow OSM tiles se `states: es`.**
- Ortofoto IGN PNOA (25 cm, CORS *, CC BY 4.0; mimo Španělsko satelitní pozadí: v mapě jen nad Španělskem), budovy
  z katastru (`?catastro=0`), hledání CartoCiudad.
- Baskicko a Navarra: budovy z foralních katastrů provincií (`towns/spain-foral.js`, INSPIRE WFS Navarry, Álavy, Bizkaie,
  Gipuzkoy; provincie podle NUTS 3 v `regions-es.json`; `?foral=0`, `?foral=nc,gi`). A/B 57 domů (Bára 23. 11. 2026,
  `evaluation/spain/foral-ab/ZPRAVA.md`): podlaží a rok z ~0 na 55 z 57, shoda s OSM ±1 v Bilbau a Donostii, Álava
  soustavně +2 a Pamplona taky: fotky dávají za pravdu katastru (OSM píše „B+4“ jako 4 a vynechá podkroví), všechny čtyři zapnuté. OSM
  Navarry, Donostie a Vitorie v lokálním balíku `es` (Bára 23. 11. 2026).
- Mapa povrchů Zaragozy (dlažby 2017: chodníky, střední a zelené pásy; vozovka jako pás kolem os OSM, `?zaragoza=0`): A/B 40
  řezů, použita ve 33: lépe 11, hůř 2, stejně 12, nejde posoudit 8; zapnutá. A Coruña (1 : 500 i s vozovkou a stáním) je ve
  složce „Intranet“ bez licence, Madrid jen jako obrázek, Barcelona jen čáry, Valencie neodpověděla.
- Normy: závazný chodník 1,8 m (TMA/851/2021), jinak doporučení ministerstva 2024. Stání: 3 m k protějšímu okraji vozovky
  (čl. 91.2 a RGC, doslova). Katalog značek je od 1. 7. 2025 nový (RD 465/2025); značky jako úřední díla (čl. 13 LPI).
  Bára 23. 11. 2026 souhlasí: 3 m doslova, sdílená stezka bez varování, zóna 30 jako tabule S-30; A Coruña se
  ptát nebudeme („moc práce bez valného užitku“), její mapu zatím nepoužívat.
- Měření 23. 11. (23 řezů v 10 městech): složení 57 %, šířka do 2 m 26 % (velké rozdíly hlavně bez fasády, posuzovatel
  měřil k okraji snímku); nejčastěji chybí chodník (10×) a stání (8×).

## Portugalsko (větev portugal ze spain, Bára 23. 11. 2026, nenasazené)
- Stát `portugal` (PT): `countries/PT.js`, `towns/portugal.js`, `signs-PT/`, `evaluation/portugal/` (ZDROJE, NORMY). Hranice
  GISCO s Madeirou a Azorami, OSM jeden balík `pt` (jen R2). **Před nasazením workflow OSM tiles se `states: pt`.**
- Ortofoto DGT: nejnovější let, který místo má (2025 pevnina, 2021 sever, 2018, satelit 2023); Madeira a Azory bez ortofota.
  Mapu povrchů žádné město online nemá: jen odhad. Hledání Photon. Stání Lisabonu (EMEL) a buspruhy Porta jen jako soubory.
- Měření 23. 11. (29 řezů v 10 městech): složení 63 %, šířka do 2 m 55 %; nejčastěji chybí stání (16×) a chodník (13×).
- Bára 23. 11. 2026: chodník červeně pod 1,5 m všude, cyklostezky podle IMT a LNEC 2024 (1,75 / 2 m, obousměrná 3 m),
  stání 3 m na směr, pěší zóna značkou G5a (zóna zákazu vjezdu).

## Monako (větev monaco z portugal, Bára 23. 11. 2026, nenasazené)
- Stát `monaco` (MC): `countries/MC.js` (Francie + monacký Code de la route), `towns/monaco.js`, hranice z OSM
  (`tools/monaco-border.json`, v `staty.json` před Francií), OSM balík `mc` (jen R2; **workflow OSM tiles se `states: mc`**).
- Ortofoto IGN, odhad z OSM; stání jen z OSM (čl. 31: jen na vyznačených místech), bez norem šířek (Monako je nemá),
  značky francouzské kresby bez čísel, jen ty, které monacký kodex zná (bez zóny 30, zone de rencontre, voie verte, dálnice;
  Bára 23. 11. 2026). Měření nemá smysl (8 bodů: schody, pěší cesty, moře; fotky jen u 2).

## Kypr (větev cyprus z monaco, Bára 23. 11. 2026, nenasazené)
- Stát `cyprus` (CY): `countries/CY.js`, `towns/cyprus.js`, `signs-CY/`, `evaluation/cyprus/` (ZDROJE, NORMY). Hranice z OSM
  (`tools/cyprus-border.json`): sever je samostatný stát, který zatím nemáme; Pyla a nárazníková zóna mimo (Bára 23. 11.).
  OSM balík `cy` (jen R2; **workflow OSM tiles se `states: cy`**).
- **Jízda vlevo** jako vlastnost státu (`leftHand`): nic se nepřesouvá, jen se otáčí směry (Bára 23. 11. 2026).
- Ortofoto DLS 2019 (Bára: novější, licence neuvedená), budovy DLS s podlažími, Photon. Normy jen doporučení příručky.
- Měření 23. 11. (11 řezů v 5 městech): složení 56 %, pruhy 91 %, šířka do 2 m 27 % (promenády a pěší ulice); chybí
  chodník 9×, stání 5×.

## Malta (větev malta z cyprus, Bára 23. 11. 2026, nenasazené)
- Stát `malta` (MT): `countries/MT.js`, `towns/malta.js`, `signs-MT/`, `evaluation/malta/` (ZDROJE, NORMY). Hranice z OSM
  s výsostnými vodami, OSM balík `mt` (jen R2; **workflow OSM tiles se `states: mt`**). Jízda vlevo.
- Ortofoto stavebního úřadu 2018 ve stupních (služba nemá Web Mercator), jen odhad z OSM a ortofota. Normy: chodník 1,2 m
  jen oranžově, kolmé stání 4,8 m; volná šířka vedle stání 4,1 / 3 m podle DC15, nejméně 2,5 m na pruh. Britské značky pod
  OGL v1.0: věta o licenci v patičce i v exportu (`credits.js ukSigns`), stejně na Kypru.
- Měření 23. 11. (8 řezů v 6 městech): složení 55 %, šířka do 2 m 63 %, pruhy 38 %; chybí chodník 5×, stání 4×.

## Itálie (větev italy z malta, Bára 23. 11. 2026, nenasazené)
- **Jen oblasti s ortofotem s otevřenou licencí** (Bára 23. 11.: ortofota AGEA „jen pro institucionální účely“ nesplňujeme):
  provincie Bolzano, Turín, Bologna, Modena (hranice ISTAT, `tools/italy-border.json`; kredit Turína ve znění Geoportálu města
  „Base cartografica realizzata da …“, Bára 23. 11. 2026). Zbytek Itálie, Vatikán a San Marino zatím mimo; Apulie 2023 bez licence.
  Bolzano 2023: nálet provincie ve spolupráci s AGEA, licence provincie CC BY 4.0 (Bára 23. 11. 2026: používat).
  Stání 3 m na směr je Bářina konvence (čl. 157 odst. 4 CdS mluví jen o jednosměrce se stáním vlevo).
- `countries/IT.js`, `towns/italy.js`, `signs-IT/`, `evaluation/italy/` (ZDROJE, NORMY, ab/). OSM 5 dílů (jen R2;
  **workflow OSM tiles se `states: it`**). Plochy silnic Bologni vypnuté (celé uliční prostory), výšky budov Bologni zapnuté.
- Měření 23. 11. (6 řezů): složení 56 %, šířka do 2 m 33 %.

## Estonsko (větev estonia z italy, Bára 23. 11. 2026, nenasazené)
- `countries/EE.js`, `towns/estonia.js`, `search-ee.js` (In-ADS), `signs-EE/`, `evaluation/estonia/` (ZDROJE, NORMY). Hranice
  GISCO, OSM balík `ee` (jen R2; **workflow OSM tiles se `states: ee`**). Ortofoto z dlaždic TMS z18 (WMS má vodoznak),
  budovy ETAK s výškou. Mapa povrchů Tallinnu zapnutá (`?tallinn=0`; licenci neuvádí, Bára: městské dílo s kreditem, není
  zákaz; A/B lépe 11, hůř 4). Měření 23. 11. (12 řezů): složení 51 %, šířka do 2 m 25 %. Otevřené otázky norem v
  `docs/backlog.md`.
- Normy (Bára 23. 11. 2026, podle doporučení): chodník 1,5 / 2,0 m všude (tallinnských 2,5 m jen doporučení), jízdní pruh
  základ 2,75 m (méně planých varování), vedle stání 3 m na směr, pěší zóna 381 s 432, stání a tramvaj bez varování;
  normy nekupujeme (EVS 843 jen z druhé ruky).

## Slovinsko (větev estonia, Bára 23. 11. 2026, nenasazené)
- `countries/SI.js`, `towns/slovenia.js`, `search-si.js` (Photon + čísla domů GURS), `signs-SI/`, `evaluation/slovenia/`
  (ZDROJE, NORMY, ab/). Hranice GISCO, OSM balík `si` (jen R2; **workflow OSM tiles se `states: si`**). Mapa povrchů
  není: odhad z OSM a ortofota GURS DOF025 25 cm (server občas 30 s visí a vrátí 504: až 3 pokusy po 4 s, celkem nejvýš
  12 s, snímky se pamatují; čtverec pro model obrub stejně do 9 s, po výpadku se minutu neptá, `SI_RETRY` v
  `lanes-ortho.js`). Budovy z katastru GURS (`?gurs=0`; A/B 40 domů: víc údajů, podlaží 39 proti 17 z OSM, rok 39 proti 0,
  správnost jen na 9 fotkách; katastr počítá obytné podkroví jako podlaží: dům o 2–4 podlažích nižší než 3 m × podlaží
  + 2 m nad vchodem (H2 − H3) má horní podlaží ve střeše, `?off=podkrovi`; laděné i hodnocené na stejných 54 domech,
  31 → 37, bez odloženého vzorku, `ab/ZPRAVA.md`). Stání podle ZPrCP čl. 65 (na obousměrce jen se středovou čárou,
  `parkOnRoadway`). Cyklisté v protisměru 3,2 m (čl. 38) jen na sběrných a vyšších, ne na obslužných ulicích (odst. 2).
  Pruhy `primary`/`secondary` bez varování (druh silnice a rychlost neznáme). Socialistický vzhled ne.
  Kredit „stav 11/2026“ (rok náletu služba neuvádí). Otevřené otázky v `docs/backlog.md`.

## Finsko (větev estonia, Bára 23. 11. 2026, nenasazené)
- `countries/FI.js`, `towns/finland.js`, `search-fi.js` (Photon + adresy Ryhti), `signs-FI/`, `evaluation/finland/`
  (ZDROJE, NORMY, ab/, buildings-ab/). Hranice GISCO s Alandami, pobřeží 400 m. OSM balík `fi` (jen R2, celé Finsko 366 MB;
  **workflow OSM tiles se `states: fi`**). Bez klíče MML (Bára): ortofoto jen Helsinek, Espoo a Turku (CC BY 4.0), jinde
  odhad jen z OSM. Mapa povrchů Helsinek YLRE (`?helsinki=0`; slepé A/B 31 ulic pro auta: lépe 16, hůř 9 (`evaluation/finland/ab2`), s doplněním
  kolem mapy na týchž (ladicích) ulicích 20 : 1, na nových obytných ulicích 11 : 7 (`ab3`); první A/B z 23. 11. (10 : 3) nebylo slepé). Budovy
  z registru Helsinek a Ryhti (`?hkibuild=0`, `?ryhti=0`; 40 domů: podlaží 39 proti 31 z OSM, rok 36 proti 5, dřevo 4).
  Normy jen doporučení, nic červeně. Otevřené otázky v `docs/backlog.md`.
- Měření přesnosti 24. 11. (poprvé, posuzoval Opus): shoda složení 52 % (22 řezů); Helsinky, Espoo, Turku 51 % (šířka do 2 m
  31 %), bez ortofota (Tampere, sever Vantaa) 54 % (šířka 11 %) (`evaluation/universal/ZPRAVA.md`).
- Doplnění kolem mapy povrchů (Bára 24. 11. 2026, všude v zahraničí, kde je ortofoto; `?off=mapfill`): za koncem mapy
  zeleň a chodníky podle modelu jako v odhadu, ve vozovce mapy stání podle aut na ortofotu a stání z OSM smí zúžit pruhy.
  Nový slepý A/B obytných ulic Helsinek: lépe 14 : 4 proti dřívějšímu, mapa proti odhadu 11 : 7; Tallinn, Vídeň bez prohry
  (`evaluation/finland/ab3/ZPRAVA.md`).

## Dánsko (větev estonia, Bára 23. 11. 2026, nenasazené)
- `countries/DK.js`, `towns/denmark.js`, `search-dk.js` (GSearch s tokenem, jinak Photon), `keys.js`, `signs-DK/`,
  `evaluation/denmark/` (ZDROJE, NORMY, buildings-ab/). Hranice GISCO s Bornholmem (bez Faerských ostrovů a Grónska),
  pobřeží 400 m. OSM balík `dk` (jen R2; **workflow OSM tiles se `states: dk`**), lokálně Kodaň, Aarhus, Odense, Aalborg.
- **Token Dataforsyningen** (Bára): lokálně `DK_TOKEN` v `pilot/public/config.local.js`, na webu proměnná repozitáře
  `DK_TOKEN` (pages.yml ji zapíše do `config.js`), nikdy ho nevypisovat ani necommitovat. Ortofoto jaro GeoDanmark (WMTS
  z20) pro pruhy a jako mapa; bez tokenu (nebo odmítnutý) odhad jen z OSM s poctivou poznámkou, výpadek služby (platforma
  se stěhuje, okno 26.–30. 11. 2026) jako výpadek.
- Kodaň: okraje vozovek `vejkant`, parkovací plochy a budovy **zapnuté** (Bára 24. 11. 2026: „Kodaňská data bych použila“,
  i když licence vrstev v katalogu uvedená není; `?kbhkant=0`, `?kbhpark=0`, `?kbhbyg=0` vypnou). A/B 72 řezů
  `evaluation/denmark/ab/ZPRAVA.md` (čáry lépe 5, hůř 2; stání lépe 7, hůř 2), budovy `evaluation/denmark/buildings-ab/ZPRAVA.md`.
  Aarhus budovy BBR CC BY 4.0 zapnuté (`?aarbyg=0`).
- Normy (vejregler) jen doporučení, oranžově; červeně jen obousměrná cyklostezka 2,5 m (oběžník 95/1984). Stání 3 m na
  směr (zákon jen u plné čáry), na chodníku v obci zakázané. Otevřené otázky v `docs/backlog.md`.
- Měření přesnosti 24. 11. (poprvé, posuzoval Opus): shoda složení 58 % (24 řezů), Kodaň 60 % (šířka do 2 m 60 %), zbytek 57 %
  (33 %); nejčastěji chybí chodník a stání (`evaluation/universal/ZPRAVA.md`).

## Litva (větev estonia, Bára 24. 11. 2026, nenasazené)
- Stát `lithuania` (LT): `countries/LT.js`, `towns/lithuania.js`, `signs-LT/`, `evaluation/lithuania/` (ZDROJE, NORMY, ZPRAVA,
  ab/). Hranice GISCO za polskou PRG; OSM balík `lt` (jen R2).
- Pobřeží 400 m (LT, FI, DK) jen u moře (Bára 24. 11. 2026): úseky hranic na souši (`staty.json` `land_*`, čáry GISCO bez
  příznaku pobřeží) se nepočítají a bod blíž hranici než pobřeží státu nepatří (300 m v Lotyšsku, Bělorusku, Rusku, Švédsku ne).
- **Žádné ortofoto** (Bára 24. 11.: ortofoto NŽT je jen k prohlížení na geoportálu, nepoužívat, úřadům nepsat):
  `laneOrtho: "none"`, mimo Vilnius jen odhad z OSM.
- Vilnius: topografické plochy 1 : 500 (`gis.vplanas.lt` …/MapServer/13, `KODAS` + `Paskirtis`) jako plochy řezu, když pod
  středem řezu leží vozovka mapy (pod pěšinou i chodník). **Vypnutá** (`?vilnius=1` zapne). Licence neuvedená, Bára je vzala jako kodaňské,
  kredit „Vilniaus miesto savivaldybė / Vilniaus planas“. A/B 26 řezů: lépe 17, hůř 2 (na ulicích 6 : 0, zbytek pěšiny
  a obslužné cesty); univerzální měření (10 řezů) ale mapa 53 % proti odhadu 75 % (`evaluation/lithuania/ZPRAVA.md`).
  Bára 24. 11. 2026 po nepřátelské recenzi: co je horší, zůstane vypnuté, mapa je vypnutá a v mapě pokrytí není (do
  většího vzorku naslepo). Recenze `evaluation/lithuania/RECENZE.md`; model obrub (`?ai`) v Litvě neběží (bez ortofota).
- Vzhled domů z OSM (GRPK bez podlaží a roku). Obrysy budov GRPK (geoportal.lt `NZT/GRPK/MapServer/22`, CC BY 4.0, Bára
  24. 11. 2026) ukončují řez u fasády: pod mapou Vilniusu před budovami OSM, v odhadu jen domy, které OSM nemá; `?grpk=0`.
  A/B 88 řezů: změněno 14, lépe 5, hůř 2; měření: složení beze změny (53 %), šířka do 1 m 0 → 20 %. Zapnuté. Hledání Photon. Normy z příruček Vilniusu a Kaunasu
  (oranžově). Stání 3 m na směr, na chodníku jen se značkou. Značky z Commons (Augustasci CC BY 4.0, tabulky Gigillo83
  CC BY-SA 4.0, v patičce). Socialistické vzhledy ano (sovětská sídliště jako v Estonsku).
- Přeměření 24. 11. 2026: LT 75 % bez mapy Vilniusu, s `?vilnius=1` 53 % (hůř 6, lépe 0 z 10), mapa zůstává vypnutá.

## Kanada (Toronto) (větev canada, Bára 25. 11. 2026, nenasazené)
- Stát `canada` (CA): Toronto a obce kolem (StatCan), zbytek `closed_ca`; mapa povrchů Toronta (OGL – Toronto) a ortofoto 2025, `?toronto=0`.
- Jeden adaptér ArcGIS planimetrií pro Washington a Toronto: `towns/planimetrics.js` (popis města; 100 řezů DC bajt po bajtu stejné). Kredity
  a výpadek mapy podle klíče města (`cityMap`, `mapFailed`).
- Čerstvé měření 60 řezů: slepé A/B mapa : odhad 44 : 6 (7 nerozhodně); univerzální měření 74 % s mapou, 68 % bez (rozdíl +7, −3 až +18,
  **složení neprůkazně, šířka ano**), jen OSM 70 %. **Výhrada:** vzorek podmínila fotka, 83 ze 143 bodů vypadlo (hlavně místní a obslužné
  ulice), čtvrtina dvojic jsou dálnice a obslužné; není to obraz celé sítě.
  **Druhá nepřátelská recenze (25. 11. 2026, `evaluation/canada/review/`, vzorky po zmrazení, dva slepí posuzovatelé):** mezery mezi vozovkami
  15 : 7 (p 0,13, `?off=mapgaps`), cyklostezky z OSM 13 : 6 (p 0,17, `?off=roadtracks`), zálivy 5 : 1 (jen 9 změněných ze 34, `?off=kerbbays`): nic
  neprohrálo, nic průkazně nevyhrálo, zůstávají zapnuté (rozhodne Bára). Podlaží z výšky proti fotce blíž 10 : 7 z 23 (průměrná chyba 1,35 → 0,65):
  remíza, zapnuté. **Okolí Toronta a Washingtonu bez mapy: složení 51 % (42–64), 19 použitelných řezů z 30, šířka do 1 m 11 %**
  (Washington 47 %, Toronto 55 %): slabé, rozhodne Bára. Opravené: koleje v tunelu (`?off=tunneltracks`, i Evropa), The Queensway, podlaží, veranda. Zpráva `evaluation/canada/ZPRAVA.md`, normy `NORMY.md` (jen oranžově).
- Před nasazením workflow OSM tiles se `states: ca`; služba `gis.toronto.ca` podmínky neuvádí,
  Bára 25. 11. 2026: používat s kreditem (záloha: plochy z katalogu hostovat). Překlady strojové.

## USA (Washington) (větev usa, Bára 24. 11. 2026, nenasazené)
- Fáze 2 pilotu Severní Ameriky („Fáze 2 s mapou Washingtonu“): stát `usa` (US), `countries/US.js`, `towns/usa.js`,
  `evaluation/usa/` (ZPRAVA, NORMY, ab/), pilot `evaluation/usa-dc/`. Jen metro Washingtonu (`staty.json` `usa`: DC a
  sousední okresy Marylandu a Virginie z TIGERweb, sloučené v jeden obrys a až pak zjednodušené), zbytek USA `closed_us`
  s hláškou. OSM balík `us_dc` (DC + Maryland + Virginie oříznuté na metro, 86 MB, jen R2; **workflow OSM tiles se
  `states: us`**, `osm-tiles.yml` umí výřezy spojené „+“ s obdélníkem za „@“).
- DC: mapa povrchů Planimetrics 2023 (CC BY 4.0, čtená podél řezu jako GRB, `hasStreet` jako Vilnius; `?dc=0`), inventář
  DDOT Roadway SubBlock (počet pruhů jako OSM `lanes` přes `wayTags`, stání u obrub, cyklopruhy, odhad stání tam vypnutý;
  `?ddot=0`), uličky planimetrie jako plochy `service=alley`, ortofoto DC 2025 jen nad Districtem (a 60 m za ním). Mimo DC jen odhad z OSM.
  **Po nepřátelské recenzi 25. 11. 2026** (926de8d): DC je District podle hranice (`mesta-us.json`, 60 m za ní), strany z inventáře
  podle cesty řezu, chráněná cyklostezka tam, kde ji má OSM (Pennsylvania Avenue uprostřed), řez v ploše „Intersection“ to řekne,
  `RPPSIDE` není strana stání, výpadek inventáře se ohlásí.
  **Čerstvé měření** (`evaluation/usa/fresh/ZPRAVA.md`, 60 náhodných řezů podle délky sítě, zmrazený kód, dva slepí posuzovatelé,
  neutrální pokyn): mapa : odhad **41 : 10** (nerozhodně 8), univerzální měření 76 % s mapou, 61 % bez ní, 53 % jen OSM (29 řezů,
  čtvrtina uličky): mapa **zůstává zapnutá**. Slabiny: uličky mezi domy (zeleň místo dvora), dálnice a rampy (3 řezy, 44 : 63 %).
  Starší čísla neplatí jako důkaz: A/B 23 : 9 mělo nápovědu v pokynu, 66 % stálo na řezech pilotu, na kterých se ladilo.
  Tepny (`evaluation/usa/arterials/ZPRAVA.md`, `?off=dcarterials`): na 25 nových naslepo mapa : bez mapy 19 : 6; nový : starý kód jen
  3 změny na nových řezech (2 : 0 : 1), neprůkazné.
- **Druhá nepřátelská recenze (25. 11. 2026):** inventář DDOT má vlastní A/B (`?ddot=0`): 21 : 11 ze 45 změněných řezů z 90 (p 0,11; místní 15 : 5, tepny
  3 : 4), počet pruhů 20 proti 19 z 33, strany stání 49 proti 45 ze 73: **neprůkazné, zůstává zapnutý** (rozhodne Bára). Kliknutí ve Washingtonu a
  Torontu (46 a 46, z toho 13 uliček): po opravě uličky (`74fcb46`) žádná ulička přes 15 m. Jiná ulice šikmo v profilu se jen ohlásí (křižovatka);
  ukončení profilu před ní je remíza 13 : 10 (Evropa 9 : 10), vypnuté (`?otherstreet=1`; `?off=otherstreet` vypne i hlášku; sdílené).
- **Severní Amerika se načítá až na místě** (`late.js`, `america.js`, `staty-america.json`; `usa`, `canada` a `closed_*` už nejsou ve `staty.json`): start v Evropě
  o 11 kB gzip víc než `estonia` (dřív o 161). Nové věci obou států přidávej tam, ne do statických importů (hlídá `tests/canada.test.js`).
- Normy DDOT DEM 2023 (aplikace cituje bez čísel tabulek, neověřená), Bicycle Facility Design Guide 2020 a NACTO jen oranžově; stání 3 m na směr (IFC 503.2.1,
  18 DCMR § 2405); bez řádku značek; bez paneláků; hledání Photon.
- Ilustrace (větev north-america-art, sloučená 25. 11. 2026, `evaluation/north-america-art/`): severoamerické domy (`houses-america.js`,
  `house-looks-america.js northAmericaLook`), mobiliář `northamerica/`, autobus Metrobus v celém metru, Washington má svůj označník a glóbus do
  5 m (`lamp-post-top`), bez tramvaje; domy v DC z CAMA (`?cama=0`). Toronto zapojené (stát `canada`), New York, San Francisco a Boston zapojené (26. 11.).
- Tři společné změny z pilotu (všechny státy, podoba z `estonia` 83734e7): ústí uličky je křižovatka (`?off=ulicky`, zapnuto), obousměrka se dělí od
  4,0 m, kde je počet pruhů známý a u vozovky je stání (`?off=pocetpruhu`, zapnuto), jamky stromů v chodníku jako chodník (**vypnuto**, `?treepits=1`:
  DC 2 : 2, české kontroly 0 : 1). Regrese Prahy a Brna beze změny, v Evropě z 120 náhodných řezů změněno 0.
- Před nasazením: R2 balík `us_dc`, nový Worker logu (Bára).

## New York (větev na-newyork z canada, 26. 11. 2026, nenasazené)
- Druhé metro státu `usa`: pět obvodů New Yorku (`tools/build_staty.mjs` tabulka `METROS` `dc`, `nyc` z TIGERweb; Boston a San
  Francisco se přidají řádkem), město `newyork` v `mesta-us.json` (`tools/build_towns_us.mjs`). New Jersey, Westchester a Nassau ne.
- Mapa povrchů NYC Planimetric Database 2022 (NYC OTI, NYCmaps na ArcGIS Online; „Limited to use defined by OTI“ bez zveřejněných podmínek, Bára 26. 11. 2026:
  používat, tatáž data jsou otevřená na NYC Open Data) přes `planimetrics.js` (`towns/newyork.js`,
  `?nyc=0`), domy z obrysů budov téže služby (`?nychouse=0`), ortofoto NYS 2024, normy Street Design Manual jen oranžově
  (`evaluation/usa/nyc/NORMY.md`; `rules.js` předává limitům město řezu), ilustrace `newyork/`. OSM balík `us_nyc` (jen R2).
- Čerstvé měření (`evaluation/usa/nyc/ZPRAVA.md`, 75 řezů, 50 podle délky sítě bez podmínky fotky): slepé A/B mapa : odhad
  **31 : 23** (p 0,34), univerzálně 73 % s mapou, 70 % bez, 63 % jen OSM: **neprůkazné, zůstává zapnuté** (rozhodne Bára).
  Slabina: stání (mapa ho nerozliší, ortofoto ve stínu). Washington beze změny (10 z 10 řezů).
- Před nasazením: workflow OSM tiles se `states: us` (postaví `us_dc` i `us_nyc`), licence NYCmaps a ortofota NYS (Bára).

## San Francisco (větev na-sanfrancisco, 26. 11. 2026, nenasazené)
- Další metro státu `usa`: City and County of San Francisco (TIGERweb 06075; `tools/build_staty.mjs` tabulka `METROS` `dc`, `nyc`,
  `sf`, další metra jako řádky), hranice města v `mesta-us.json` (`tools/build_towns_us.mjs`); okolní okresy `closed_us`.
  OSM balík `us_sf` (Geofabrik norcal oříznutý na město, 7,6 MB, jen R2; **workflow OSM tiles se `states: us`**).
- Mapa povrchů `towns/sanfrancisco.js` (`?sf=0`) složená podél řezu (`planimetrics.js` s vlastním `runs`): uliční prostor
  DataSF (2014) = chodník, mezi krajními obrubami SFMTA vozovka, budovy DataSF jen mimo uliční prostor (posun 1,4 m);
  stání z digitální obruby SFMTA (`?sfcurb=0`), podlaží z výšek obrysů (`?sfhouse=0`). PDDL. Bez ortofota (otevřené není).
- Čerstvé měření (`evaluation/usa/sf/ZPRAVA.md`, 60 řezů, zmrazený kód e9911c1, dva slepí posuzovatelé, snímky Esri jen k měření):
  mapa : odhad **34 : 6**, univerzálně 71 % s mapou, 55 % bez; obruba 21 : 7. Obojí zapnuté. Šířka s mapou o 2,5 m širší než
  u posuzovatelů (rozhodne Bára).
- Normy: chodník podle SFMTA Sidewalk Widths, jinak jen NACTO, oranžově (`evaluation/usa/sf/NORMY.md`). Ilustrace Muni (autobus,
  trolejbus, LRV4, označník); PCC a Path of Gold nezapojené.
- Opravy 26. 11. (`evaluation/usa/sf/fixes/ZPRAVA.md`): orientace stání z OSM, kde obruba dá podélné (A/B 30 nových řezů 12 : 11,
  vypnuto, `?sfosmpark=1`); osa ve vykrojeném stání a vozovka, kterou přechází jen chodník (Lippard Avenue, `derive.js ownRoad`,
  1 z 290 řezů, vypnuto, `?axisroad=1`; Bára rozhodne, zda zapnout bez měření).

## Boston (větev na-boston, 26. 11. 2026, nenasazené)
- Další metro státu `usa`: okresy Suffolk, Middlesex, Norfolk (`tools/build_staty.mjs METROS`, další metro = řádek), OSM balík
  `us_bos`; města `boston`, `bostonmetro` (celé metro: MBTA autobus a tramvaj, ortofoto MassGIS 2025, normy Boston Complete
  Streets Guidelines 2013 jen oranžově) a `cambridge` (jen území mapy) v `mesta-us.json`; v Bostonu lampa acorn.
- Mapy povrchů Bostonu (Street Edges, Sidewalk Inventory, budovy s podlažími) a Cambridge (PDDL), `towns/boston.js`: vozovky jsou
  polygony přes celé město, proto statické dlaždice `data/us-plan` stavěné jednou týdně při nasazení
  (`tools/build_planimetrics_us.mjs`, `pages.yml`), při kliknutí žádný dotaz; `?boston=0`, `?cambridge=0`, `?bostonhouse=0`.
- Čerstvé měření 60 řezů (`evaluation/usa/boston/ZPRAVA.md`): A/B mapa : odhad 27 : 21 (p 0,47; místní 13 : 4, tepny 8 : 15),
  univerzální 69 % s mapou, 68 % bez, 72 % jen OSM. Mapa zapnutá, **rozhodne Bára** (tepny: mezera mezi polygony je zeleň i na
  parkovišti a náměstí). Washington 100 řezů beze změny, regrese beze změny.
- Přegenerovat: `node tools/build_staty.mjs usa && node tools/build_towns_us.mjs && node tools/build_coverage.mjs`.
  Před nasazením workflow OSM tiles se `states: us` (nebo `us_bos`).
- Mezery za vnějším chodníkem (26. 11., `evaluation/usa/boston/outer/ZPRAVA.md`, `planimetrics.js outerGaps`, `ortho-osm.js
  outerGapsByImage`): domy a parkoviště z OSM, zbytek ortofotem (MassGIS je bez listí, zeleň podle žlutosti a sytosti). A/B 52
  nových tepen 18 : 16, **vypnuto**, `?outergaps=1`.

## Společné pro státy (Bára 23. 11. 2026)
- Sever Kypru a Itálie mimo otevřená ortofota (i se San Marinem a Vatikánem) profil nedostanou, aplikace to řekne
  (`city.js closedAt`, `staty.json` `closed_*`).
- Pobřeží: Španělsko, Portugalsko, Monako a Francie platí do 400 m za hranicí GISCO (nábřeží, přístavy); Gibraltar a Andorra
  zůstávají cizinou.
- Jízda vlevo je zabudovaná přímo v pravidlech (`derive.js`), profil se nezrcadlí.
- Worker logu ukládá každou platnou polohu (25. 11. 2026); nový Worker musí nasadit Bára.

## Měření přesnosti (Bára 17. 11. 2026, přeměřeno 24. 11. 2026)
- Jedna univerzální metoda pro všechny státy: skill `mereni-presnosti`, kód a zpráva `evaluation/universal/`. Použít u
  každého nového státu a u starých, když Bára řekne. Hodnotí složení uličního prostoru, pak šířku; jen řezy s fotkou
  z ulice (Mapillary, v Česku i Mapy.com).
- Pravidla od 24. 11. 2026 ve **všech** státech (všechny řádky počítá jedna metoda): strana bez fasády se srovnává šířkou
  i složením jen po okraj ulice, za ním se nehodnotí nic, ani zeleň (konec u obruby je pro uživatele správně, zelený pás
  za obrubou Bára zamítla, `evaluation/ortofoto-osm/zelenpas/ZPRAVA.md`); řezy na `service=driveway`, `parking_aisle` a
  `drive-through` se vynechají (značka cesty z balíku OSM státu, `vysledky/sluzebni-<iso>.json`; `POKYN.md`).
- Přesbíráno 25. 11. 2026 (stejná posouzení, 467 řezů přesně na posouzeném místě, kód b4b8964, `vysledky/staty.md`):
  shoda složení CZ 58 %, SK 84 %, AT 58 %, DE 57 %, CH 62 %, LI 69 %, NL 59 %, BE 47 %, LU 51 %, PL 65 %, FR 58 %, ES 56 %,
  PT 64 %, CY 55 %, MT 58 %, IT 56 %, EE 44 %, SI 62 %, LT 75 %, FI 52 %, DK 59 % (FI a DK posuzoval Opus, ne Sonnet). Sdílené změny
  24.–25. 11. (mapFill, lawlanes, parkshare, křižovatky a osy, widereach) zapnuté proti vypnutým v témže sběru: 59 ze 402 řezů
  jinak, lépe 9, hůř 10, celkem 58 → 58 %; 226 nových ulic naslepo: mapFill 8 : 7 (Zaragoza 0 : 4, jinde 8 : 3), lawlanes 7 : 8.
  Nalezené chyby (piktokoridor, `markIslands`, jednosměrka na dva pruhy) opravené 25. 11. (7af8747, AT 60 %, ES 55 %, PT 65 %). Na 571 nových
  ulicích `lawlanes` proti vypnutému 34 : 21 (složení 11 : 11, šířky 23 : 10), oficiálně 1 : 3 beze změny shody: zůstává zapnuté, rozhodne Bára
  (`evaluation/sjednoceni/mereni2/ZPRAVA.md`). SK odhad stání zapnutý 12 : 7, bez `lawlanes` 16 : 11.
- Přeměření 24. 11. 2026 (předchozí řádky v `evaluation/universal/ZPRAVA.md`):
  CZ a PL přesbírané týž večer: CZ po opravě čtení DTM krajů po JVF DTM 1.5 (63b9726; řezy s DTM krajů 34 → 51 %, Praha,
  Brno, Plzeň, Jihlava 68 %), PL po návratu ortofota Geoportalu (ortofoto ve 23 z 29 řezů). Před → po a výklad v
  `evaluation/universal/ZPRAVA.md` (oddíl 24. 11.). CZ znovu 25. 11. s doplněním kolem mapy i v Česku: 58 % beze změny
  (2 ze 40 řezů jinak, olomouc-4 lépe).
- Přesnější pokyn posuzovatelům (25. 11. 2026, `POKYN.md`: každá část od 0,5 m i pásy trávy u obruby, stání podle pruhu, ne podle
  aut): 40 evropských řezů 54 → 55 %, kontrola starým pokynem 50 % (šum posuzovatelů); doporučení: staré státy neposuzovat
  znovu, pokyn používat dál (Bára rozhodne; `evaluation/universal/ZPRAVA.md`).
- Doplnění kolem mapy povrchů (mapFill: stání z aut modelu ve vozovce mapy, zákonný pruh bez aut zpět, OSM stání smí
  ubrat pruhům 0,3 m) platí od 25. 11. 2026 ve všech státech i v Česku, příznak státu zrušen, vypíná jen `?off=mapfill`
  (Bára: výjimka jen s měřením). A/B 90 nových českých řezů: změna 7, lépe 6 : 2 (kraje 4 : 1, Praha 1 : 0, Brno 1 : 1),
  `evaluation/mapfill-cz/ZPRAVA.md`.
- Sjednocení výjimek (Bára 24. 11. 2026: co nejvíc sdíleně, výjimka jen s měřením nebo rozdílem zákona, norem a dat;
  `evaluation/sjednoceni/AUDIT.md`, `ZPRAVA.md`): `besidePassport` všude (i CZ), osy OSM, obslužné cesty a ústí uliček jako křižovatky
  všude i v Praze (`city.fix` zrušené, `evaluation/sjednoceni/praha/ZPRAVA.md`; plocha uličky jen pro ulici, do které ústí, kliky `evaluation/kliky/ZPRAVA.md`: oprava naslepo 17 : 2, obslužné cesty zůstávají, limit posunu nezapnutý; po změně pravidel umístění `node evaluation/kliky/collect.mjs`), delší dosah dálnic a hlavních ulic jedním pravidlem dat řezu (`app.js widerSides`,
  příznaky `wideRoads`/`wideStreets` zrušené), oprava stání z modelu u zákonného pruhu (`?off=parkshare`). Zákonný odhad
  stání platí i na Slovensku (25. 11.: jeho prohry byly z chyby sdíleného kódu, zákonný pruh ležel ve vozovce dřív, než se měřily
  pruhy; teď pruhy napřed, `ai-kerbs.js lawKerbs`, `?off=lawlanes`, A/B oprava 13 : 6, SK se zákonem 6 : 7 a CZ 5 : 5,
  `evaluation/sjednoceni/slovensko-stani/ZPRAVA.md`); výjimku stání má jen Monako (zákon). Uložený řez (`#rez=`, vložená
  poloha s azimutem) se otevře přesně tam, kde byl uložen (`derive.js placeCut`), pravidla křižovatek a středu dvou vozovek
  posouvají jen kliknutí. Odkaz nese i cestu OSM (`#rez=lat,lon,azimut,vlevo,vpravo,way`, azimut na 0,1° od 25. 11. 2026; `share.js`, `derive.js savedStreet`);
  starý odkaz nebo zaniklá cesta: nejbližší ulice jako dřív.

## Jazyky (Bára 12. 11. 2026, slovenčina 15. 11. 2026, němčina 16. 11. 2026)
- Anglicky se aplikace jmenuje **Street Profile**, slovensky **Profily ulíc**, německy **Straßenprofil**. Čeština, slovenčina,
  angličtina a němčina: `pilot/public/i18n.js` (`t("český text")`), překlady v `pilot/public/en.js`, `sk.js` a `de.js`, od 17. 11. 2026 přepínač v menu Soubor (jazyky jménem, bez vlajek), `?lang=sk`. Jazyk podle
  prohlížeče (první z jeho jazyků, který aplikace umí; všichni ostatní angličtina), ne podle místa řezu (Bára). Nový text vždy přes `t()` a s překladem (hlídá `tests/i18n.test.js`). Popis v `pilot/README.md`.
- Všech 24 úředních jazyků EU (větev `eu-languages`, Bára 17. 11. 2026, nenasazené): soubor `<jazyk>.js` na jazyk, načítá
  se jen jazyk stránky. **Překlady jsou strojové (agent na jazyk), měl by je projít rodilý mluvčí.** Kritik Fable (jako rodilý
  mluvčí) prošel všech 20 nových jazyků, hodnocení 3,5–4,5 z 5 (maltština nejhůř). Bára 17. 11. 2026: česká jména měst
  se v překladech nesklánějí (polsky „miasta Plzeň“, ne Pilzna); obecně se zdroj ploch jmenuje „mapa povrchů“
  (Bára 18. 11. 2026: univerzální název pro všechny státy; podkladová mapa, „Linie mapy povrchů“, legenda, hlášky,
  nápověda). „Technická mapa“ zůstává jen jako jméno konkrétního zdroje: kredity a licence, hlášky o konkrétní službě
  (ČÚZK, IPR, město) a texty měst; překládá se doslova (švédsky teknisk karta, ne primärkarta). Přepínač je v menu Soubor jako „Jazyk“, jazyky jménem bez vlajek. Desetinná
  tečka jen en, ga, mt. Název aplikace: bg Уличен профил, da Gadeprofil, el Διατομή Οδού, es Secciones de calle,
  et Tänavaprofiil, fi Katuprofiili, fr Profil de rue, ga Próifíl Sráide, hr Profili ulica, hu Utcaprofil, it Sezioni
  stradali, lt Gatvės profilis, lv Ielu profils, mt Profil tat-Triq, nl Straatprofiel, pl Przekroje ulic, pt Perfis de Rua,
  ro Profil stradal, sl Profili ulic, sv Gatusektion.
- Němčina (větev `nemcina`, 16. 11. 2026): Bestand / Planung / Vergleich, Gehweg, Fahrstreifen, Radfahrstreifen, Schutzstreifen,
  Parkstreifen, Fahrbahn, Querschnitt, „Sie“; desetinná čárka jako česky. Jazyk ≠ stát: německé rozhraní v Praze ukazuje české
  značky a normy, německé značky ani data z Německa nejsou. Překlad by měl projít rodilý mluvčí.

## Hospodaření s vodou a jednodušší rozhraní (Bára 12. 11. 2026)
- Podnět Magdaleny podle pražských Standardů HDV (kap. 5.1): v Návrhu průleh, rýha, retenční nádrž; pod povrchem
  podzemní rýha, nádrž, šachta (ve skutečné velikosti a hloubce, rozměr v „Další volby“, výchozí odhad schválený Bárou);
  propustná dlažba a nezpevněný povrch (i ve Stavu z OSM `surface`). Retenční nádrže z dat zůstávají vodou.
- Se sítěmi varování: překryv červeně, blíž než 0,5 m oranžově (Bářina hranice upozornění, Standardy odstupy nedávají).
- Nové stromy v Návrhu u sítí podle Pražských stavebních předpisů, příloha č. 1, bod I (vzdálenost od paty kmene po
  druzích sítí; oranžově jen s kořenovou bariérou/chráničkou, červeně blíž). Bára 13. 11. 2026: „to někde musí být
  pečlivě rozepsáno“.
- Trakční sloup dál než 4 m od kolejí drží vodorovné příčné lano (ke sloupu naproti, jinak k domu, jinak končí u
  kolejí), ne výložník nad auty; koleje se sloupy mezi sebou (Olšanská) lano nemají (Bára 13. 11. 2026).
- Rozhraní po kritice Fable: karta části s „Další volby“, paleta za „+ Přidat díl“, bez panelu okrajů, Sdílet + menu
  Soubor, patička na jeden řádek. Žádné texty „zkušebně“ v aplikaci (Bára). Pěší, přechody a průchozí šířka chodníku
  na pozdější brainstorming.

## Podnět Magdaleny k prvkům a povrchu (Bára 13. 11. 2026)
- Lampa ve výšce 4–10 m (do 5 m parková na sloupku, výš lampa města s delším/kratším stožárem; Bára: malá lampa není
  zmenšená velká), stojí 0,6 m od obruby u vozovky. Stojan na kola napříč/podél; stojany, lavičky, květináče a sloupky
  se v části řadí vedle sebe. Povrch tramvajového tělesa jen u samostatného tělesa (tráva stačí, rozchodníky ne).
- Pod zelení a travnatým/štěrkovým tělesem žádný beton (ornice, štěrkové lože).
- Graf „Povrch ulice“: propustný / částečně propustný / nepropustný / vodní plocha / ostatní (shoda s „povrch“;
  „voda a ostatní“ se pletlo s hospodařením s vodou), bez poznámky.
- Nedělat: pokryvnost korunami a parametry stromů (Bára: moc složité). IPR Praha oslovit s připomínkami (nápad
  Magdaleny), Slovensko jen při zájmu.

## Pasporty dalších měst (Bára 16. 11. 2026, A/B 26. 11. 2026)
- Komunikace Rožnova p. R. (`towns/pasporty.js`, hranice `pasporty.json`) nad DTM ČÚZK
  ve „cesko“; pasport bez ploch v okolí nechá řez DTM. A/B po odstávce DMVS (`evaluation/PASPORTY-AB.md`, výsledky):
  vyřazené Chomutov (bez pasportu lépe 33 : 8), Šumperk (4 : 4), Litoměřice (6 : 5), zeleň Prachatic (2 : 1) a Roudnice
  (9 : 0); Chotěboř vyhrála (4 : 1), ale vyřazená kvůli licenci (vrstva na soukromém účtu „ArcGIS Demo portál“, ne
  města; Bára 26. 11. 2026); Šlapanice vyřazené po slepém A/B na nových řezech 12 : 12 (Bára 26. 11. 2026,
  `evaluation/pasporty-blind/ZPRAVA.md`; i z kreditu), Kuřim (osy zimní údržby se šířkou) po témže A/B 14 : 16 (taky i z kreditu); jména v `pasporty-names.js` zůstala kvůli kreditu uložených řezů. Nápad: vozovku pasportu ořezat na kus pod osou.

## Po odstávce DMVS (ověřeno 26. 11. 2026)
- DMVS i WFS krajů po přechodu na JVF DTM 1.5 fungují (Komenského ve Vysokém Mýtě, `tools/check_sources.mjs` česká
  města ok). Jihomoravský kraj v obytných ulicích Kuřimi DTM nemá (odhad z OSM).
- Jihlava: pasport komunikací je zase plný (26. 11. vrstva 112: 13 323 úseků), náhrada nebyla potřeba.
- Záchranná síť má české řezy DTM: `evaluation/replay/sample-cz.json` (`node evaluation/replay/sample.mjs cz`), nahrávka
  `rec-cz` (`evaluation/replay/README.md`).

## O aplikaci (Bára 24. 11. 2026, větev estonia, nenasazené)
- Menu Soubor → „O aplikaci“ (`pilot/public/about.js`, dialog v `index.html`): text o aplikaci, autorka podle státu řezu
  (`countries/*.js author`: v CZ a SK Bára Soukupová, jinde Bara Soukup), MIT a odkazy na repo a `LICENCE-A-ZDROJE.md`.
- Mapa pokrytí `pilot/public/coverage.json` (309 kB) dělá `node tools/build_coverage.mjs` z modulů: `SURFACE_MAPS` v každém
  `towns/*.js` („all“, id z AREAS, klíč hranic, „-NUTS3“ vynechá), `laneOrtho` států a částečná ortofota z `lanes-ortho.js`.
  Nový zdroj = upravit `SURFACE_MAPS` a přestavět; `tests/coverage.test.js` hlídá aktuálnost, zařazení všech států a modulů
  a třídy v bodech (i těsně za hranicí města). Města z obdélníků AREAS se kreslí hranicí obce (GISCO LAU 2024,
  `LAU_TOWNS`, `tools/coverage-lau.json`, `--lau=<soubor>`), pod legendou „mapu povrchů bereme jen tam, kde má ulici pod řezem“.
- Kontaktní formulář přes Workera (`POST /contact`, tabulky `contacts` a `contact_rate`, skryté pole, 5 zpráv za hodinu
  z adresy, IPv6 po /64, počítáno atomicky `INSERT … RETURNING`, bez celkového stropu; e-mail 2× z adresy a 10× za hodinu
  celkem; bez `RATE_SALT` odpověď 503; staré řádky maže hodinový cron; Bára 24. 11. 2026: jen limit, žádný Turnstile),
  e-mail volitelně přes `send_email`; nasazení v `logging/README.md` (Bára). Bez `LOG_URL` „zatím nejde“.

## Licence
- Kód MIT. Ilustrace Streetmix CC BY-SA 4.0 (s uvedením autora), pražské ilustrace (`pilot/public/praha/`)
  pod MIT jako kód (Bára rozhodla 8. 11. 2026), kód Streetmixu AGPL-3.0 (jen kopie
  ve `vendor/`, nepublikuje se). OSM ODbL. Podrobnosti v `LICENCE-A-ZDROJE.md`.
