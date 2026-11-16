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
- Žádný typ „sdílený prostor“; obytné a pěší zóny mají vozovku jako pruh.
- Ulice ze dvou vozovek se řeže uprostřed (středový pás / tramvaj).
- Ignorovat ulice pod mosty a podzemní cesty (metro, tunely se záporným `layer`/`level`).
- Interní model smí obsahovat i to, co Streetmix neumí (rychlosti apod.); převod na typy
  Streetmixu až při exportu.
- UI: mapa + upravitelný profil, posuvný předěl (výchozí 50:50), krátké popisky, v hlavičce jen
  název ulice, kurzor křížek. Výchozí podklad „Mapa IPR“ (rychlý rastr z ArcGIS Online).

## Stav a otevřené věci
- Stav je jen k prohlížení; data se opravují po tlačítku „Opravit data“ (Bára 8. 11. 2026). Návrh je
  editovatelný vždy. Copyright kódu i pražských ilustrací: © Bára Soukupová (MIT).
- Budovy: 17 vzhledů (Bára 16. 11. 2026: činžák se šikmou střechou, měšťanský dům na náměstí, sorela, zděný bytový dům 50.–60. let, škola, kostel, garáž, funkcionalismus, panelák, moderní bytový
  dům, kancelář, městský dům, vila, rodinný dům 60.–80. let, nový rodinný dům, venkovský dům štítem do ulice, hala).
  Paneláků bylo moc: kontrola proti RÚIAN `evaluation/budovy-panel/ZPRAVA.md`, Street View 25 domů v `k-foceni.md`. Plochá střecha se rozlišuje podle tvaru bloku z OSM, IPR „nová budova“
  (pole ve stávajícím dotazu na Podlažnosti) a stáří zástavby (IPR Vývoj zástavby, statické dlaždice
  z `tools/build_vyvoj.mjs` při nasazení; Bára 8. 11. 2026: plošná vrstva je výchozí odhad, který
  přebijí údaje o domě).
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

- Pražské ilustrace: tramvaj T3, autobus SOR NB 12 v klasických bílo-červených barvách, mobiliář podle
  Olgoj Chorchoj, domy z boku ve 4 typech. Auta zůstávají ze Streetmixu (Bára rozhodla 8. 11. 2026).

## Brno (nasazeno 9. 11. 2026, vylepšení rozpracovaná)
- Samostatná stránka `/brno/` ze stejného kódu (`pilot/public/city.js`, `config.js` CITY,
  `tools/city_site.mjs`). Lokálně http://localhost:5173/brno/. Popis v `pilot/README.md`.
- Bára: co nejméně věcí lokálně. Brno se jako Praha ptá služeb při kliknutí: plochy z MTVU města
  (gis.brno.cz ags3 PUBLIC/opendata_mtvu), linie a body z kresby technické mapy UMPS (opendata_umps),
  budovy z KAM. Lokálně dlaždice OSM a parkování z mapy parkovanivbrne.cz (Bára: otevřená data
  z 2/2024 vynechat, stáhnout aktuální mapu; oblasti nepoužívat, rozhoduje úsek u řezu).
- Úpravy výpočtu jen pro Brno přes `city.fix` (Bára: do Prahy zatím nezasahovat).
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
  chodníky, vozovky, parkoviště; MČ Dúbravka), Prešov (doprava, zeleň, stromy; CC BY 4.0), Žilina a Banská Bystrica
  (T-MAPY PaKom); jen kde má pasport plochu pod středem řezu, kolem budovy, zeleň a voda z OSM; `?pasport=0` vypne.
  A/B 115 řezů: lépe 28, hůř 7 (`evaluation/slovensko/ab/ZPRAVA.md`). Technická mapa Bratislavy (čáry + značky ploch)
  zapojená, ale vypnutá (`?tm=1`): málo značek, otevřené čáry. Licence kromě Prešova neuvedené.
- Mimo Česko se vzhled domu neodvozuje od vzdálenosti od centra (žádné není), ale z OSM (rok, střecha, deska); panelák
  jen obytným domům (ZBGIS druh budovy). Ulice ze dvou jednosměrných vozovek má v odhadu obě. V nadpisu jen ulice,
  poznámka o datech pod ním. Panorama Mapy.com jen v CZ. Jazyky v rozbalovacím menu s vlajkami (vše Bára 16. 11. 2026).
- Každá změna odhadu z ortofota a OSM (`ortho-osm.js`) musí projít regresí proti MTVU Prahy a Brna
  (`node evaluation/ortofoto-osm/regrese.mjs`, výchozí stav ve `vysledky/regrese.txt`; Bára 16. 11. 2026: „u každé změny
  je samozřejmostí test, zda to dosavadní výsledky jinde nezhoršuje“). Co zhorší, zůstane vypnuté (detekce aut `P.cars`,
  doplnění za pasportem `?vypln=1`, filtr trávy ZBGIS `P.areaGreen`).
- Změna jazyka načte stránku znovu, ale profil se nepřepočítává (stav záložky v sessionStorage); záblesk je v pořádku
  (Bára 16. 11. 2026), přepnutí za běhu je připravené v `i18n.js` (onLangChange), napojené není.
- Ilustrace SK (Bára 16. 11. 2026): vozidla měst (`pilot/public/bratislava|kosice|zilina|bystrica|presov/`, kreslířka a
  kritik ve 3 kolech) podle města řezu (`city.js` SK_ART, skArtAt); mobiliář český (Bratislava převzala od Prahy lavičku,
  koš a stojan Olgoj Chorchoj), označníky a přístřešky se slovenskou značkou 331 Zastávka (`pilot/public/slovensko/`).
  Vlastní bratislavský přístřešek, lampa a označník DPB až po zásadách MIB pro zastávky a osvětlení (přístřešky jsou
  v řezech vzácné). Technická mapa Bratislavy, čáry map Nitry, Piešťan, Zvolena, Hlohovce, Prešova: `?tm=1`, `?hrany=0`.

## Jazyky (Bára 12. 11. 2026, slovenčina 15. 11. 2026, němčina 16. 11. 2026)
- Anglicky se aplikace jmenuje **Street Profile**, slovensky **Profily ulíc**, německy **Straßenprofil**. Čeština, slovenčina,
  angličtina a němčina: `pilot/public/i18n.js` (`t("český text")`), překlady v `pilot/public/en.js`, `sk.js` a `de.js`, menu jazyků s vlajkami v hlavičce, `?lang=sk`. Jazyk podle
  prohlížeče (první z jeho jazyků, který aplikace umí; všichni ostatní angličtina), ne podle místa řezu (Bára). Nový text vždy přes `t()` a s překladem (hlídá `tests/i18n.test.js`). Popis v `pilot/README.md`.
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

## Pasporty dalších měst (Bára 16. 11. 2026)
- Komunikace Chomutova, Šumperka, Rožnova p. R., Litoměřic, Chotěboře, Šlapanic, Kuřimi a zeleň Prachatic a Roudnice
  n. L. (`towns/pasporty.js`, hranice `pasporty.json`) nad DTM ČÚZK ve „cesko“. Nasazené před A/B (do 19. 11. odstávka
  DMVS, „do 19. je to nic“); A/B po odstávce podle `evaluation/PASPORTY-AB.md`, co nevyhraje, vyřadit.

## Na 19. 11. 2026 (po odstávce DMVS, Bára 16. 11. 2026)
Odstávka IS DMVS a DTM krajů 12.–18. 11. (přechod na JVF DTM 1.5.0.2), plný provoz od 19. 11.
1. Ověřit, že DMVS běží (WMS `dtm_zps_plochy_bar` vrací 200, ne „Plánovaná odstávka“), že ho aplikace po přechodu na
   novou verzi JVF DTM umí číst (řez mimo naše města, např. Komenského ve Vysokém Mýtě; plochy, linie, typ plochy
   v bodě, WFS krajů v `dtmwfs.js`) a `node tools/check_sources.mjs`.
2. A/B pasportů devíti měst podle `evaluation/PASPORTY-AB.md` (aplikace s pasportem proti bez); co nevyhraje,
   vyřadit z `towns/pasporty.js`.
3. Jihlava: pasport komunikací (`ost/Pasporty` vrstvy 1, 2, 34, 111–115) byl 16. 11. prázdný. Je-li pořád, při
   prázdném pasportu brát DTM ČÚZK a případně se zeptat města.

## Licence
- Kód MIT. Ilustrace Streetmix CC BY-SA 4.0 (s uvedením autora), pražské ilustrace (`pilot/public/praha/`)
  pod MIT jako kód (Bára rozhodla 8. 11. 2026), kód Streetmixu AGPL-3.0 (jen kopie
  ve `vendor/`, nepublikuje se). OSM ODbL. Podrobnosti v `LICENCE-A-ZDROJE.md`.
