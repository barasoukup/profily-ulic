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
- Živě: https://barasoukup.github.io/profily-ulic/
- Repo: github.com/barasoukup/profily-ulic (MIT, © Bára Soukupová).
- Push na `main` = nasazení na GitHub Pages (`.github/workflows/pages.yml`), navíc každé pondělí
  obnova OSM. Dlaždice OSM jsou jedna sada pro celou ČR (Geofabrik, asi 760 MB, `../data/osm-tiles` pro
  všechna města); Cloudflare R2 jen kdyby přerostly limit Pages 1 GB (Bára 10. 11. 2026).
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
  označené „odhad“. Golemio API by potřebovalo Bářin klíč (není).
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
- Budovy: 6 vzhledů (šikmá střecha, funkcionalistický činžák, moderní bytový dům, panelák/kanceláře,
  nízký dům, hala). Plochá střecha se rozlišuje podle tvaru bloku z OSM, IPR „nová budova“
  (pole ve stávajícím dotazu na Podlažnosti) a stáří zástavby (IPR Vývoj zástavby, statické dlaždice
  z `tools/build_vyvoj.mjs` při nasazení; Bára 8. 11. 2026: plošná vrstva je výchozí odhad, který
  přebijí údaje o domě).
- Panorama z ulice: Mapy.com Panorama API, klíč jen v tajné proměnné repozitáře `MAPY_KEY` a v
  lokálním `pilot/public/config.local.js` (git ho ignoruje), nikdy v kódu.
- Tlačítko „Do Streetmixu“ je vyndané (Bára 8. 11. 2026), protože na Pages nefunguje (API Streetmixu
  nemá CORS). Převod `streetmix.js` zůstává s testy. Dotaz:
  https://github.com/streetmix/streetmix/issues/3828. Proxy přes Cloudflare je odložená do odpovědi.
- Nasazení zůstává na GitHub Pages; před nasazením běží `npm test`.
- Naposledy nasazeno (6. 11. 2026): chodník s povolenými cyklisty, stezky C9/C10, varování podle
  pravidel v Návrhu, soubor ZPS.
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

## Licence
- Kód MIT. Ilustrace Streetmix CC BY-SA 4.0 (s uvedením autora), pražské ilustrace (`pilot/public/praha/`)
  pod MIT jako kód (Bára rozhodla 8. 11. 2026), kód Streetmixu AGPL-3.0 (jen kopie
  ve `vendor/`, nepublikuje se). OSM ODbL. Podrobnosti v `LICENCE-A-ZDROJE.md`.
