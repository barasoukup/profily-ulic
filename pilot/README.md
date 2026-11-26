# Profily ulic – aplikace

Kliknete na ulici v mapě (nebo ji najdete podle adresy) a aplikace z technické mapy a z OSM sestaví příčný profil
od fasády k fasádě. Ten pak upravujete: šířky tažením, typy, pořadí, přidávání, mazání a slučování částí, dopravní
značky, stav / návrh / porovnání, export SVG a PNG, uložení a načtení profilu (JSON), sdílení návrhu odkazem.

## Spuštění

```bash
node pilot/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení
k internetu (podkladové mapy, technické mapy IPR, měst a ČÚZK). Rozpracovaný profil si prohlížeč
pamatuje i po zavření. Server poslouchá jen na tomto počítači (`HOST=0.0.0.0` ho otevře místní síti).

Statická data, která web dostane při nasazení, si lokálně vyrobíte takto (bez nich aplikace běží, jen víc odhaduje):

| Data | Příkaz | Kam |
|---|---|---|
| dlaždice OSM celé ČR | `NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf pilot/data/osm-tiles` | `pilot/data/osm-tiles` |
| hranice zón placeného stání v Praze | `node tools/build_zps.mjs` | `pilot/data/zps.json` |
| otevřená data Prahy (stromy, zákaz stání, třídy ulic) | `node tools/build_praha_opendata.mjs` | `pilot/data/praha/opendata` |
| vývoj zástavby Prahy | `node tools/build_vyvoj.mjs` | `pilot/data/vyvoj` |
| placené stání v Brně | `node tools/build_parkovani_brno.mjs pilot/data/brno` | `pilot/data/brno/parkovani` |
| zóny placeného stání v Plzni | `node tools/build_zony_plzen.mjs` | `pilot/data/plzen/zony.json` |

Server je vydává pod `data/…`, stejně jako web.

## Jedna stránka pro celou ČR

Přepínač měst není. Město se bere podle místa řezu (`city.js`: `cityAt` podle hranic obcí z RÚIAN v `mesta.json`,
`node tools/build_mesta.mjs`; `setCity`). Moduly čtou `city` až při použití, takže zdroje dat, ilustrace (načtou se
při prvním řezu ve městě), texty i uvedení zdrojů v exportu sedí na místo řezu. Mimo města s vlastními zdroji platí
„cesko“ (`towns/cesko.js`: celostátní technická mapa ČÚZK, domy z RÚIAN, dlaždice OSM, pražský mobiliář a vozidla
Streetmixu). Bývalé stránky `/<město>/` přesměrují na `/?mesto=<město>` i s řezem v odkazu
(`tools/city_site.mjs`, `tools/build_city_site.mjs`; místní server totéž).

### Státy, města a zdroje (přestavba 16. 11. 2026)

Struktura je všude stejná: stát → město → zdroje (`docs/architecture-countries.md`).
- **Stát** je modul `countries/<ISO>.js` (`CZ.js`, `SK.js`, `AT.js`; `default.js` pro místo mimo známé státy a výchozí
  hodnoty všech vlastností): normy (`limits`, `contraflow`, `tramBelt`), zákon o stání (`freeLane`, `halfKerbNote`,
  `parkGuess`), značky (`signs`), ortofoto (`bedOrtho`, `laneOrtho`), ilustrace měst státu (`art`, `artAt`), vzhled domů
  (`socialistLooks`), služby hledání (`search`), panorama, hlášky. `setCity` nastaví vedle `city` i `country` (modul státu);
  `city.country` zůstává kód ISO. Mimo `countries/` není žádná podmínka na stát.
- **Město** je záznam v `city.js` (a modul `towns/<město>.js`, má-li vlastní zdroje); co nemá svého (ortofoto, značky,
  normy), dědí od státu. Zbytek státu je město `cesko`, `slovensko`, `austria`, mimo státy `cizina` (`towns/cizina.js`).
  Slovenská a rakouská města a Washington (`city.js STATE_TOWNS`: Bratislava, Košice … Vídeň, Graz …) jsou města podle hranic
  (`mesta-sk.json`, `mesta-at.json`, `mesta-us.json`, `tools/build_towns_sk.mjs`, `build_towns_at.mjs`, `build_towns_us.mjs`); texty, zdroje a normy mají od zbytku
  státu, ilustrace své, má-li je stát nakreslené (`countries/<ISO>.js art`), jinak státu.
- **Zdroj** s vlastním územím (pasport, čáry mapy města, mapa povrchů Vídně, značky Salcburku) má `area` (box, případně
  hranice obce, `places.js inArea`) a jeho modul ho uvádí v `AREAS`. `towns/index.js placeAt(lat, lon)` vrací stát,
  město, sadu ilustrací a zdroje s územím v bodě. Kredit zdroje je klíč v `state.cut.sources` a řádek v `credits.js`
  (`creditLines` i `validate.js` podle něj).

**Nový stát:** modul `countries/<ISO>.js` (a řádek v `countries/index.js`), složka značek, řádek v `tools/countries.mjs`
(OSM, Geofabrik, Pages), zbytek státu jako město v `city.js` (`abroad`) a texty v `en.js`, `sk.js`, `de.js`, zdroje
v `towns/<stát>.js`, hranice v `staty.json`, hostitelé v CSP (hlídá `tests/csp.test.js`). Podrobně skill
`.claude/skills/pridani-statu`. **Nové město nebo zdroj:** viz Města jako moduly níže.

Úpravu, která nemá měnit výsledky, ověří záchranná síť `evaluation/replay/` (odpovědi zdrojů nahrané jednou pro 369
řezů na Slovensku, v Rakousku, v Praze, v Brně a za hranicemi, přehrané před a po změně; tabulky města, kreditů,
značek a norem států ve čtyřech jazycích).

Společné pro státy (Bára 23. 11. 2026): sever Kypru a Itálie mimo otevřená ortofota (i se San Marinem a Vatikánem) profil
nedostanou, aplikace to řekne (`city.js closedAt`, `staty.json` `closed_*`). Na pobřeží Španělska, Portugalska, Monaka
a Francie platí stát do 400 m za hranicí GISCO (nábřeží, přístavy; `COAST_TOLERANCE`), Gibraltar a Andorra zůstávají
cizinou. Jízda vlevo je zabudovaná přímo v pravidlech (`derive.js`), profil se nezrcadlí. Hranice poloh ve Workeru
logu pokrývají všechny státy (nový Worker musí nasadit Bára).

### Slovensko a cizina (Bára 15. 11. 2026)

Mimo města platí stát řezu (`staty.json` z `node tools/build_staty.mjs`: Česko z RÚIAN, Slovensko ze ZBGIS ÚGKK SR,
asi 30 m): „cesko“, „slovensko“, jinde „cizina“ (okraje výřezů OSM za hranicí). Bez `staty.json` je všechno mimo
města „cesko“ jako dřív. Mimo Česko (`towns/slovensko.js`, `city.abroad`) se aplikace neptá technické mapy ČÚZK ani
RÚIAN (DMVS za hranicí odpovídá bez CORS a vypadalo to jako výpadek). Profil je odhad z OSM a ortofota
(`ortho-osm.js`) a pasportů měst, kde je mají; hláška „Technickou mapu tu zatím nemáme, profil je odhad.“ pod
názvem (nadpis je jen ulice).

- **Ortofoto Slovenska:** ZBGIS `Ortofoto_hres` (GKÚ Bratislava, NLC, CC BY 4.0), dlaždice Web Mercator do úrovně 19 po
  512 px (asi 10 cm; Bratislava 2023, Košice 2025), CORS, cache na den. Čte se pro pruhy a obruby
  (`lanes-ortho.js`, zdroj `sk`), pro tramvajové těleso (`ortho.js`, export PNG) a je i v podkladové mapě (jen na
  Slovensku, mimo něj vrací průhledné dlaždice). Mozaika je světlá a do žluta: asfalt v Košicích měl jas 200 a o 10
  zelenější než červená a modrá, takže vypadal jako tráva a profil nevznikl (11 ze 40 řezů). Odstín se proto
  bere vůči šedým pixelům snímku (`balance`, jen pro `sk`). Vyhodnocení `evaluation/slovensko/ZPRAVA.md`.
- **Domy:** ZBGIS vrstva Budova (`identify`, `/query` ZBGIS vrací 503): druh stavby (hala, nízká stavba, rodinný dům)
  a výška nad terénem; podlaží = výška / 3,3 m, ale `building:levels` z OSM má přednost. Rok stavby ani podlaží
  ZBGIS nemá.
- **Hledání:** ZBGIS `find` (ulice MV SR s osou, obce, adresní body Registra adries), jen když mapa ukazuje
  Slovensko, dotaz má slovenská písmena (ä ô ľ ĺ ŕ) nebo RÚIAN nic nenašel (`search-sk.js`). „Hlavná 12 Košice“
  najde adresu, „Hlavná Košice“ ulici v Košicích.
- Ilustrace vozidel podle města řezu (Bratislava, Košice, Žilina, Banská Bystrica, Prešov; jinde neutrální tramvaj a autobus z `generic/`),
  slovenské označníky zastávek (značka 331), mobiliář pražský (Bratislava ho převzala), značky slovenské (`znacky-SK/`).
- **Za pasportem města** (Bára 16. 11. 2026, Poštová, 17. novembra): pasport končí, kde končí plochy, o které se město
  stará. Od osy ven k nejbližšímu domu (z pasportu nebo OSM), plotu či zdi z OSM nebo k vnější hraně samostatně
  zakresleného chodníku OSM se nepokryté kusy doplní (`ortho-osm.js` `besidePassport`), jen když ten konec leží do 15 m
  za poslední plochou. Kus dělí čáry mapy města; druh dá značka mapy, trávník nebo parkoviště ZBGIS, jinak snímek
  (zelený od 0,22). Chodník jen na straně, kde pasport chodník nemá; za chodníkem pasportu je to „plocha před domem“.
  U dálnic a rychlostních silnic nic. Vše je odhad. A/B v `evaluation/slovensko/ab/ZPRAVA.md`; `?off=beside` vypne.

### Rakousko (Bára 16. 11. 2026)

Stát `austria` (`country` AT, `towns/austria.js`; hranice z Eurostat GISCO v `staty.json`). Jako na Slovensku se
neptá DMVS, RÚIAN ani ortofoto ČÚZK; profil je odhad z OSM (výřez Geofabrik, balík `at` jen na R2) a ortofota
basemap.at (`lanes-ortho.js` zdroj `at`, z20).
- **Vídeň:** Flächen-Mehrzweckkarte (FMZK) města jako plochy řezu (vozovka, chodníky, parkování, tramvajové těleso,
  zeleň, voda, domy, zdi), kde má plochu ulice pod středem řezu; podloubí a přístřešky podle plochy pod nimi.
  Neodpoví-li některá vrstva, FMZK se nepoužije (poznámka). `?wien=0` vypne. A/B v `evaluation/austria/ab/`.
- **Normy** `countries/AT.js` (`limits`): cyklo podle RVS 03.02.13 (citováno přes NÖ Leitfaden 2024), pruhy a ostatní podle
  Wiener Projektierungshandbuch; skupina silnice z OSM `highway` (`derive.js osmGroup`). Stání napůl na chodníku
  podle StVO § 24 odst. 3 (dva volné pruhy po asi 2,6 m). Rešerše `evaluation/austria/NORMY.md`.
- **Hledání** ve Vídni z adresních bodů města (`search-at.js`, když mapa ukazuje Vídeň nebo dotaz obsahuje „Wien“);
  adresa se řeže na své ulici (osa z grafu ulic města, ulice toho jména vyhrává v `nearestStreet`). Jinde v Rakousku
  (a ve Vídni, kde adresní body nic nenajdou) Photon od komoot (`search-photon.js`, OSM, jen výsledky AT; veřejný server
  pro rozumné použití, při větším provozu vlastní instance).
- **Salcburk:** zákaz zastavení a stání z katastru značek města (do 25 m od řezu, na straně značky), `?salzburg=0`.
- **Značky** `signs-AT/` (StVO § 52–53); jednosměrka se pod pruhem neznačí, značky bez rakouské kresby a s
  dodatkovou tabulkou se zahodí.

### Švýcarsko a Lichtenštejnsko (Bára 17. 11. 2026)

Státy `switzerland` (`country` CH) a `liechtenstein` (LI), oba `towns/switzerland.js`; hranice ze swissBOUNDARIES3D
swisstopo v `staty.json` (přednost před hrubšími hranicemi GISCO Rakouska a Německa; Büsingen a Campione jsou díry).
Profil je odhad z OSM (balíky `ch` a `li` jen na R2) a ortofota SWISSIMAGE 10 cm (`lanes-ortho.js` zdroj `ch`, WMTS
z20, dlaždice `{z}/{x}/{y}`).
- **Úřední vyměřování** (Amtliche Vermessung, pokryv půdy `LCSF`) přes WFS geodienste.ch jako plochy řezu, kde má plochu
  ulice pod středem řezu: vozovka a cesty, chodníky, ostrůvky, dráha, budovy, zeleň, voda. Všechny kantony, které ho
  sdílejí, i Lichtenštejnsko (Vaud a Luzern ne); kredit podle kantonu (`credits.js chAv`). Neodpoví-li, odhad s poznámkou.
  `?av=0` vypne. A/B v `evaluation/switzerland/ab/`.
- **Normy** `countries/CH.js` (`limits`): hodnoty norem VSS podle kantonálních a městských příruček (Bern, Basel-Stadt,
  Curych, Schwyz), kde zdroj chybí, bez varování. Stání podle VRV čl. 19 a pomůcek kantonů Bern a Luzern (3 m na projetí,
  pruhy vedle stání průjezdné). Lichtenštejnsko (`countries/LI.js`) má švýcarská pravidla se svými čísly článků.
  Rešerše `evaluation/switzerland/NORMY.md`.
- **Hledání** Photon (`photon-ch`, místní názvy: Genève, Lugano). **Značky** `signs-CH/` (SSV, stejná čísla v LI).
- **Domy** bez paneláků (jako Rakousko), **vozidla** neutrální z `generic/`, mobiliář a označníky české.

### Nizozemsko (Bára 20. 11. 2026)

Stát `netherlands` (`country` NL), `countries/NL.js` a `towns/netherlands.js`; hranice z GISCO v `staty.json` (za Německem).
OSM po 12 provinciích (balíky `nl_dr` … `nl_zh` jen na R2, Geofabrik má provincie ve složkách `europe/netherlands/<p>/`).
Ortofoto PDOK Luchtfoto `Actueel_orthoHR` (8 cm, WMTS z21 `{z}/{x}/{y}`, `lanes-ortho.js` zdroj `nl`, CORS).
- **Mapa povrchů BGT** (PDOK OGC API Features, CC0) jako plochy řezu, kde má plochu ulice pod středem řezu: vozovka,
  chodník, cyklostezka, parkovací plocha, OV-baan (s tramvajovou kolejí BGT tramvajové těleso), krajnice a ostrůvky,
  zeleň, voda, dvory, budovy. Jen platné verze (`datetime`), jen úroveň ulice (most a tunel ne). Neodpoví-li, odhad
  s poznámkou. `?bgt=0` vypne. A/B v `evaluation/netherlands/ab/` (lépe 12, stejně 12, hůř nebo sporně 4 z 30).
- **Budovy** z BAG (rok, využití) a 3D BAG (podlaží, střecha) podle bodu fasády; bez paneláků.
- **Sítě pod zemí** v Amsterdamu (`site.js`): stoky Waternetu s průměrem (obvyklá hloubka) a kabely veřejného
  osvětlení s hloubkou.
- **Normy** `countries/NL.js` podle CROW přes příručky Amsterdamu a CROW-Fietsberaad (rešerše
  `evaluation/netherlands/NORMY.md`); stání podle praxe (RVV 1990 šířku neuvádí): 3,5 m na jednosměrce, 4,5 m vozovky
  obousměrně; nestojí se vedle cyklopruhu (RVV čl. 23).
- **Hledání** PDOK Locatieserver (`search-nl.js`). **Značky** `signs-NL/` (RVV 1990, Commons, bez dodatkových tabulek).
- **Ilustrace** univerzální: neutrální vozidla, český mobiliář, rakouské označníky.

### Belgie a Lucembursko (Bára 20. 11. 2026)

Státy `belgium` (BE) a `luxembourg` (LU), `countries/BE.js`, `LU.js`, `towns/belgium.js`, `towns/luxembourg.js`; hranice
GISCO. OSM balíky `be` a `lu` jen na R2. Mapu povrchů s chodníky jako webovou službu nemá ani jeden: profil je odhad
z ortofota a OSM.
- **Ortofoto:** Flandry (WMS Digitaal Vlaanderen, pokrývá i Brusel), jinak Valonsko (ArcGIS export SPW), `lanes-ortho.js`
  zdroj `be` zkouší regiony po sobě (prázdný snímek = mimo region); Lucembursko WMTS ACT (`lu`, z21).
- **Čáry obrub** (`towns/belgium.js`): ve Flandrech GRB WGO (okraj vozovky, pásu chodců a cyklistů, nezpevněné plochy),
  ve Valonsku PICC „Voirie - Ligne“ (okraje vozovky, chodníku, stání, cyklostezky, obruby); Brusel nic. Kandidáti obrub
  v odhadu jako čáry slovenských měst. `?hrany=0` vypne. A/B `evaluation/belgium/ab/` (lépe 4, hůř 2 z 10 změněných).
- **Normy** podle vademek Flander, Valonska a Bruselu a lucemburských směrnic (`evaluation/belgium/NORMY.md`); stání:
  Belgie AR 1975 čl. 25.1, 7° (3 m volného průjezdu celkem), Lucembursko bez obecné šířky. **Značky** `signs-BE/`,
  `signs-LU/`. **Hledání** Photon. Univerzální ilustrace, bez paneláků.

### Polsko (Bára 21. 11. 2026)

Stát `poland` (PL), `countries/PL.js`, `towns/poland.js`, `search-pl.js`; hranice GISCO (za Českem a Slovenskem). OSM po
16 vojvodstvích (`pl_*`, jen R2). Ortofoto GUGiK (WMS HighResolution v Web Mercatoru, `lanes-ortho.js` zdroj `pl`).
- **Mapa povrchů Krakova** (MJO: vozovky, náměstí, chodníky, cesty) tam, kde má u středu řezu vozovku; jen s `?krakow=1`
  (od 26. 11. 2026 vypnutá, chybí písemný souhlas správce MSIP).
  Celostátní BDOT10k a mapy okresů nejsou otevřeně s CORS; Varšava, Vratislav, Gdaňsk, Poznaň služby nemají.
- **Normy** podle závazného nařízení RMI 2022 (Dz.U. 2022 poz. 1518), buspruh, stání a tramvaj podle nezávazných
  doporučení ministerstva WR-D (označeno). **Stání:** zákon volnou šířku nemá, odhad jako v Lucembursku, průjezdné pruhy
  aspoň 3 m; na chodníku musí zůstat 1,5 m (čl. 47). **Značky** `signs-PL/`. **Hledání** GUGiK UUG. Paneláky jako
  v Česku, univerzální vozidla.

### Francie (Bára 22. 11. 2026)

Stát `france` (FR), `countries/FR.js`, `towns/france.js`, `search-fr.js`; hranice GISCO (pevninská Francie a Korsika, za
Německem, Švýcarskem, Belgií a Lucemburskem). OSM po 22 regionech Geofabriku (`fr_*`, jen R2). Ortofoto IGN (Géoplateforme
WMS-Raster v Web Mercatoru, `lanes-ortho.js` zdroj `fr`; mimo Francii bílé, proto v mapě jen nad Francií).
- **Mapa povrchů Paříže** (Plan de voirie, opendata.paris.fr: vozovky, chodníky, cyklostezky, buspruhy, zálivy stání
  „Piste“, střední pásy) tam, kde má u středu řezu vozovku, cyklostezku nebo stání (`?paris=0`). Ostatní města (Lyon,
  Bordeaux, Nantes, Toulouse) zatím ne.
- **Stání v Paříži** z evidence parkovacích míst města (`stationnement-voie-publique-emplacements`, ODbL): úsek stání ve
  vozovce do 5 m od řezu u obruby = stání té hloubky a způsobu, obruba bez úseku stání nemá (`derive.js kerbParking`,
  `?parisstani=0`). Mapa povrchů počítá podélné stání do vozovky a ortofoto IGN na bulvárech čáry nenajde (stín, Paříž
  je často nemaluje), takže bez evidence zbylo stání jako krajnice.
- **Hlavní ulice** (primary, secondary): strana, která skončí dosahem ve středovém pásu, promenádě nebo chodníku, sahá
  35 m, když ulice za dosahem pokračuje (bulvár s promenádou; od 25. 11. 2026 všude stejné pravidlo podle dat řezu, ne
  státu: `app.js widerSides`, `evaluation/sjednoceni/ZPRAVA.md`; za dosahem není mapa povrchů, nebo je tam druhá vozovka
  téže ulice z OSM, nebo plochy ulice z mapy pokračují až k vozovce; totéž dálnice a silnice pro motorová vozidla). Vozovka jen pro autobusy se stejným jménem je druhá polovina ulice, když
  jiná není (`?off=busduo`, obecně); krajnice aspoň 2,75 m u obruby s buspruhem z OSM je buspruh (`?off=buskrajnice`,
  obecně). Zpráva `evaluation/france/ab/bulvary/ZPRAVA.md`.
- **Budovy** z BD TOPO IGN (podlaží, výška, rok, byty, užití; `?bdtopo=0`). **Šířky vozovek** BD TOPO (celé metry) jen
  s `?sirka=1`, bez A/B.
- **Normy:** závazná je jen přístupnost (arrêté z 15. 1. 2007: chodník 1,4 m, 1,2 m bez překážek); cyklistika podle
  doporučení CEREMA a příručky Paříže 2023, stání podle Paříže, pruhy jen oranžově podle Grand Lyon 2010. **Stání:**
  zákon (Code de la route R417-10, R417-11) volnou šířku nemá, odhad jako v Lucembursku; auto na chodníku je „très
  gênant“. **Značky** `signs-FR/` (úřední díla). **Hledání** Géoplateforme (BAN). Bez paneláků, univerzální vozidla.

## Odkud jsou data (Praha)

- **Šířky:** IPR Praha, *Mapa technického využití území* (MTVU), služba
  `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15`. Odpovědi se lokálně ukládají do `pilot/cache/mtvu`,
  stejné místo se tedy podruhé načte hned. První načtení trvá podle serveru IPR 1–10 s.
- **Tramvajové koleje:** osy kolejí z liniové vrstvy technické mapy IPR (`dtmp/MapServer/10`, kód 55010
  „MHD – osa kolejí“). Pruh s tramvají sahá 1,75 m od osy koleje ven a mezi kolejemi do poloviny osové
  vzdálenosti. Odpovídá to Manuálu tvorby veřejných prostranství IPR (kap. C.2): dvoukolejný tramvajový pás
  6,5 m při osové vzdálenosti 3 m, 7 m při 3,5 m. Zbytek vozovky široký aspoň 2,5 m se stane samostatným jízdním
  pruhem. Kde osy kolejí chybí, použije se tramvajová trať z OSM. Má-li mapa města tramvajové těleso (MTVU 705,
  berlínský Gleiskörper, vídeňská FMZK, pasporty) a kolejnice z OSM leží víc než 0,25 m mimo něj, koleje se posunou do
  tělesa (se zachovaným rozestupem; těleso ve vozovce s kolejemi v asfaltu i 1,5 m od středu, když se rozestup nevejde),
  jen o 1,25 m nejvýš a jen do tělesa aspoň 2,5 m širokého (`derive.js` `snapTracksToBeds`, Bára 18. 11. 2026, Neue
  Schönhauser Straße; `?off=tramsnap`). Změřené osy (Praha) zůstávají.
- **Body technické mapy IPR** (`dtmp/MapServer/9`, jeden dotaz na řez): sloupy trakčního vedení, označníky zastávek,
  sloupky, stožáry osvětlení bez vedení a stromy.
- **Otevřená data Geoportálu Praha** (CC BY 4.0, staženo při nasazení do dlaždic `data/praha/opendata`, při
  kliknutí žádný dotaz): stromy a stromořadí a uliční úseky
  TSK se zatříděním (dálnice, MK I–IV) pro šířky pruhů, varování a odhad stání. Úseky „Zákaz stání“ TSK se
  stahují také, ale profil je nepoužívá: jsou to mezery pár metrů uvnitř souvislého stání (vjezdy, kontejnery, stromy
  mezi stáními), pod rozlišením profilu (Bára 11. 11. 2026).
- **Parkování v zónách placeného stání:** úseky parkovacích stání TSK (`gs-pub.praha.eu/.../dop/zony_placeneho_stani/MapServer/3`,
  polygony). Stejná data používá i Golemio, ale bez API klíče. Mají přednost před plochami parkování z OSM.
  **Zásobování, ZTP, speciální stání:** vrstvy 5–8 stejné služby; parkovací pruh dostane účel.
- **Parkovací zálivy:** plochy parkování z OSM (`amenity=parking` s `parking=street_side`, `lane`, `on_kerb`…).
  Technická mapa je samostatně nerozlišuje, proto mají přednost před MTVU; úzké zbytky vozovky
  nebo chodníku vedle nich se k parkování přičtou.
- **Stromy:** z otevřených dat, z technické mapy a z OSM (`natural=tree_row`, `natural=tree`) do 8 m od řezu.
  V chodníku se kolem nich vyčlení stromořadí široké 1,5 m; zelený pás se stromy se označí jako stromořadí,
  bez stromů jako zeleň. Strom v pruhu stání (stromy střídající se se stáním) je prvek „Strom“ parkování: kreslí se
  za autem a popisek zní „… se stromy“. Prvek „Strom“ jde v Návrhu přidat i ručně.
- **Nástupiště MHD:** nástupiště z OSM (`public_transport=platform`, `railway=platform`, `highway=platform`;
  čáry i plochy). Ostrůvek s nástupištěm se celý označí jako nástupiště, na širokém chodníku jen pás 3 m
  u obruby.
- **Pruhy pro autobusy:** OSM `busway:*=lane`, `bus:lanes`, `psv:lanes`, `lanes:bus`, `lanes:psv`, i `bus:lanes=yes`
  u pruhu uzavřeného ostatní dopravě; **pruh BUS + cyklisté** z `cycleway:*=share_busway` nebo
  `bicycle:lanes=…|designated`. Na jednosměrce platí tagy bez strany (`busway=lane`, `cycleway=*`) jen pro pravou stranu.
- **Prvky v profilu** (kreslí se uvnitř části, v editoru jdou přidat a smazat): mobiliář z OSM a z technické mapy
  (lampy, lavičky, stojany a sdílená kola, přístřešky, označníky, sloupy trakčního vedení, rozcestníky, taxi,
  sloupky, květináče, zahrádky restaurací); bariéry a svahy z linií technické mapy (svodidla 71522/71540,
  zábradlí 61530, ploty a zdi 61209/61210/71210/81210/91210, opěrné zdi 61422/71422/81422, živé ploty 81214,
  hrany svahů 42105/42107) a z OSM `barrier=*`. Body se berou podle druhu do určité vzdálenosti od řezu (lampy
  a sloupy 20 m, zastávky 15 m, stromy 8 m, sloupky 3 m, ostatní 6 m), z řady stejných jen nejbližší.
  Lampa nebo lavička, kterou OSM položí do pruhu, se posune k nejbližší obrubě (do 3 m). Sloup nebo označník
  v kolejišti se přesune na ostrůvek vedle; sloup mezi dvěma kolejemi stojí mezi nimi s výložníky nad obě.
  Zastávka má jeden přístřešek a jeden označník; přístřešek je otevřený k tramvaji nebo autobusu u svého
  nástupiště a zadní stěnou stojí na druhém okraji.
- **Trolejové vedení:** nad pruhy pod trolejí (OSM `trolley_wire`, i jen pro jeden směr) se kreslí příčné lano
  a dva troleje ve výšce 5,4 m; v pruhu jede trolejbus města, kde ho ilustrace mají (jinak autobus).
- **Předzahrádky restaurací:** plochy OSM `leisure=outdoor_seating`. **Vodní plochy:** MTVU 500–504.
  **Barevné cyklopruhy:** `cycleway:*:surface:colour`.
- **Co v ulici je** (počet pruhů, jednosměrka, tramvaj, parkování, cyklopruhy, rychlosti, zóny): dlaždice OSM
  celé ČR (viz níže).

### Španělsko (Bára 23. 11. 2026)

Stát `spain` (ES), `countries/ES.js`, `towns/spain.js`, `search-es.js`; hranice GISCO s Baleárami, Kanárskými ostrovy,
Ceutou, Melillou a Llívií (prstenec uvnitř francouzské díry). OSM po 17 autonomních společenstvích, Ceutě, Melille
a Kanárských ostrovech (`es_*`, Kanárské ostrovy u Geofabriku pod `africa/`, jen R2). Ortofoto IGN PNOA (WMS, 25 cm,
`lanes-ortho.js` zdroj `es`; mimo Španělsko kreslí satelitní pozadí, proto v mapě jen nad Španělskem). V Melille se pruhy
z PNOA nečtou (snímek Airbus, licence nevyjasněná).
- **Mapa povrchů Zaragozy** (dlažby města 2017: chodníky, střední a zelené pásy, IDEZar WFS) tam, kde má chodník do 25 m
  od středu řezu (`?zaragoza=0`). Vozovku jako plochu nemá: je to pás kolem os silnic z OSM, až za chodníky a budovami.
  A Coruña (1 : 500, i vozovky a stání) je ve složce „Intranet“ s nejasnou licencí, zatím ne.
- **Budovy** z katastru (Catastro INSPIRE WFS, GML): podlaží části budovy u fasády, rok, užití, byty (`?catastro=0`).
  Baskicko a Navarra mají vlastní katastr: tam se Catastra neptá, ale foralního katastru provincie (`towns/spain-foral.js`:
  Navarra, Álava, Bizkaia, Gipuzkoa, INSPIRE WFS, podlaží, rok, užití, byty; `?foral=0` vypne, `?foral=nc,gi` jen
  vybrané; Álava a Navarra mají proti OSM o 1–2 podlaží víc, fotky dávají za pravdu katastru: OSM ve Španělsku
  nepočítá přízemí a podkroví). Provincie podle hranic NUTS 3 z GISCO v `regions-es.json` (`node tools/build_regions_es.mjs`; Treviño patří
  Burgosu; u vnější hranice do 500 m se ptá foralního katastru a bez domu pak Catastra). Limit 25 s, paměť na bod,
  jeden dotaz na fasádu. A/B v `evaluation/spain/foral-ab/ZPRAVA.md`.
- **Normy:** závazná přístupnost (Orden TMA/851/2021: chodník 1,8 m), ostatní podle doporučení ministerstva dopravy
  2023/2024 (cyklo, pruhy 2,5–3 m, stání). Bez varování buspruh, tramvajový pás a sdílená stezka (5 m by svítilo všude).
  **Stání:** vedle stojícího auta 3 m k protějšímu okraji vozovky (čl. 91.2 a RGC); odhad jako v Lucembursku (pruhy vedle
  stání zůstanou průjezdné, aspoň 3 m); stání na
  chodníku zakázané. **Značky** `signs-ES/` (katalog RD 465/2025, úřední díla podle čl. 13 LPI); obytná ulice z OSM
  je S-47 (zóna 20 km/h), S-28 jen s maxspeed=10; výchozí rychlost bez značky podle čl. 50 RGC (20 / 30 / 50 km/h podle
  pruhů na směr) se nekreslí; dálnice S-1 / S-1a jen podle ref AP- / A-. **Hledání** CartoCiudad.
  Bez paneláků, univerzální vozidla. Rešerše `evaluation/spain/` (ZDROJE, NORMY).

### Portugalsko (Bára 23. 11. 2026)

Stát `portugal` (PT), `countries/PT.js`, `towns/portugal.js`; hranice GISCO s Madeirou a Azorami. OSM jeden balík `pt`
(Geofabrik i s ostrovy, jen R2). Ortofoto DGT (WMS, CORS *, CC BY): nejnovější let, který místo má (2025 celá pevnina
25 cm, 2021 sever, 2018, satelit 2023; bílý snímek = žádný; jen na pevnině), v mapě jen let 2025. Madeira a Azory ortofoto DGT
nemají (jejich služby: nejasná licence, bez CORS). Žádné město nemá mapu povrchů online (`evaluation/portugal/ZDROJE.md`),
profil je odhad z ortofota a OSM. Hledání Photon.
- **Normy:** chodník 1,5 m závazně u hlavních a sběrných ulic (DL 163/2006; 1,2 m u každé pěší trasy), jinak doporučení
  IMT a příručky Lisabonu. **Stání:** čl. 49–50 Código da Estrada (bez čísla; 3 m u plné čáry), bráno jako 3 m na směr.
  **Značky** `signs-PT/` (RST, úřední díla); pěší zónu Portugalsko nemá (G5a zóna zákazu vjezdu), obytná i sdílená zóna H46.

### Monako (Bára 23. 11. 2026)

Stát `monaco` (MC), `countries/MC.js` (francouzská nastavení s monackým zákonem), `towns/monaco.js`; hranice podle OSM
(pevnina, admin_level 8, `tools/monaco-border.json`; GISCO má jen 11 bodů), v `staty.json` před Francií. OSM balík `mc`
(jen R2). Ortofoto IGN (Francie, pokrývá i Monako). Stání podle zákona jen na vyznačených místech (čl. 31 Code de la
route), proto se neodhaduje; stání na chodníku zakázané (čl. 32). Monako nemá předpisy šířek ulic: bez varování. Značky
kresbou francouzské (Monako se řídí Ženevským protokolem 1949; podoba je pozorování), bez francouzských čísel, jen ty, které
kodex zná: bez zóny 30, zone de rencontre, voie verte a dálnice (Bára 23. 11. 2026); rychlosti 30, 50, 70. Hledání Photon. Pravidla `evaluation/monaco/PRAVIDLA.md`.

### Kypr (Bára 23. 11. 2026)

Stát `cyprus` (CY), `countries/CY.js`, `towns/cyprus.js`; hranice z OSM (území republiky a britské základny,
`tools/cyprus-border.json`): **sever je samostatný stát, který zatím nemáme** (`staty.json` `closed_cy`: profil se nedělá a aplikace to řekne); nárazníkovou zónu OSN hranice OSM zčásti zahrnuje (Pyla, Mammari, letiště Nikósie: odhad z OSM, ortofoto tam není).
**Jízda vlevo** (`leftHand`): díly zůstávají tam, kam je dala data (Bára: „Přesouvat nesmíš nic, jen otáčet směr“);
pravidla, která směr odvozují (polovina vozovky u obousměrné osy, `lanes:forward`, rozdělení pruhu z ortofota, krajnice
dělené silnice, strana odhadu stání na jednosměrce), počítají rovnou s jízdou vlevo; jednosměrné osy jedou podle své
geometrie a seznamy po pruzích (`turn:lanes`, `bus:lanes`) se čtou od řidičovy levice, tedy od obruby (recenze 23. 11.). Ortofoto DLS 2019
(dlaždice, asi 12 cm; licence neuvedená, Bára: novější), budovy DLS (podlaží, výška, typ; CC BY 4.0), hledání Photon.
Normy jen z příručky odboru veřejných prací (doporučení; chodník bez červené, 2 / 2,5 m oranžově podle třídy ulice,
pruh 3 / 3,5 m, cyklopruh v protisměru 2 m), stání bez varování; stání na chodníku zakázané. Značky `signs-CY/`
(kyperský Kodex nečísluje, britské kresby pod OGL v1.0 s uvedením zdroje v patičce i v exportu; jednosměrka s cyklisty v protisměru
bez značky, C 10a podle strany chodců). Měření přesnosti `evaluation/cyprus/ZPRAVA.md`.

### Malta (Bára 23. 11. 2026)

Stát `malta` (MT), `countries/MT.js`, `towns/malta.js`; hranice z OSM i s výsostnými vodami (`tools/malta-border.json`),
OSM balík `mt`. Jízda vlevo. Ortofoto stavebního úřadu 2018 (15 cm, CC BY 4.0); služba nemá Web Mercator, výřez se ptá
ve stupních (`lanes-ortho.js MT_ORTHO`, CRS:84). Mapa povrchů, stání ani budovy s podlažími nejsou. Normy: chodník 1,2 m
jen oranžově (zásady přístupnosti, doporučení), kolmé stání 4,8 m (DC15), jinak bez varování. Volná šířka vedle stání:
aspoň 4,1 m obousměrka a 3 m jednosměrka (DC15), nejméně 2,5 m na každý pruh. Značky `signs-MT/` jen z přílohy S.L. 65.05
(maltské kresby PD, britské pod OGL v1.0, uvedeno v patičce i v exportu; jednosměrka po směru, cyklistické stezky a „Except cycles“
se nekreslí, vlastní kresby II.E11, II.B6, II.D12 bez úředního čísla). Hledání Photon. Měření `evaluation/malta/ZPRAVA.md`.

### Itálie (Bára 23. 11. 2026)

Stát `italy` (IT), `countries/IT.js`, `towns/italy.js`; **jen oblasti s ortofotem s otevřenou licencí** (Bára: vrstvy
AGEA regionů jsou „jen pro institucionální účely“, to nesplňujeme): provincie Bolzano a obce Turín, Bologna, Modena
(hranice ISTAT 1. 1. 2026, CC BY 4.0, `tools/italy-border.json`; GISCO 1 : 1 M zabíral pruhy sousedních obcí, kde je ortofoto města černé). Turín je v kreditu ve znění, které žádá Geoportál města („Base cartografica realizzata da …“). Zbytek Itálie, Vatikán a San Marino profil nedostanou (hláška, `city.js closedAt`, `staty.json` `closed_it`).
Ortofota CC BY 4.0: Bologna 2023, Modena 2024 (služby regionu Emilia-Romagna), Turín 2023, Bolzano 2023 (nálet provincie
ve spolupráci s AGEA, licenci CC BY 4.0 dává provincie) (`lanes-ortho.js IT_ORTHO`, podle obdélníku oblasti; výpadek se ohlásí). OSM po 5
dílech Geofabriku (jen R2). Výšky budov Bologni (`?bolognadomy=0`); plochy silnic Bologni vypnuté (`?bologna=1`; jsou to
celé uliční prostory i s chodníky, A/B `evaluation/italy/ab/ZPRAVA.md`). Normy podle D.M. 5. 11. 2001 (pruh podle třídy z OSM:
3,25 / 3 / 2,75 m, v obytné zóně bez varování), D.M. 557/1999 (obousměrná stezka 2,5 m, společná stezka oranžově pod 2,5 m)
a přístupnosti (0,9 m); stání 3 m na směr (konvence aplikace, zákon dává 3 m jen u stání vlevo v jednosměrce). Značky `signs-IT/` (Regolamento, úřední díla).

### Estonsko (Bára 23. 11. 2026)

Stát `estonia` (EE), `countries/EE.js`, `towns/estonia.js`; hranice GISCO, OSM balík `ee` (jen R2). Ortofoto Maa- ja
Ruumiamet z dlaždic TMS `foto@GMC` úrovně 18 (osa y odspodu, `lanes-ortho.js` `tms: true`; WMS v plném rozlišení má
vodoznak, proto ne), podklad mapy do z21. V Tallinnu mapa povrchů města (`tar_maakate`, vrstva po vrstvě; licenci
neuvádí, Bára: městské dílo s kreditem), před ní budovy a po ní zeleň z OSM, jen kde má vozovku nebo chodník do 15 m od
středu řezu (`?tallinn=0`; A/B lépe 11, hůř 4, `evaluation/estonia/ab/ZPRAVA.md`). Budovy ETAK (WFS,
výška u fasády → podlaží po 3 m, `?etak=0`), hledání adres In-ADS (`search-ee.js`). Normy: chodník 1,5 / 2 m (nařízení
o přístupnosti 2026, závazné), ostatní EVS 843 z druhé ruky; stání a tramvaj bez varování. Stání 3 m na směr, na chodníku
jen se značkou a 1,5 m pro chodce. Značky `signs-EE/` (nařízení MKM nr 12, úřední díla; část překreslení CC BY-SA 4.0).
Paneláky jako v Česku (Lasnamäe, Mustamäe).

### Slovinsko (Bára 23. 11. 2026)

Stát `slovenia` (SI), `countries/SI.js`, `towns/slovenia.js`; hranice GISCO (za Itálií a Rakouskem, Chorvatsko zůstává
cizina), OSM balík `si` (jen R2). Mapa povrchů ulic není (`evaluation/slovenia/ZDROJE.md`): profil je odhad z OSM a
ortofota GURS DOF025 (25 cm, WMS ve Web Mercatoru, `lanes-ortho.js` `si`; server buď odpoví do sekundy, nebo 30 s visí
a vrátí 504: první dotaz má polovinu času, po 300 ms jeden další; podklad mapy jen uvnitř hranice). Budovy z katastru GURS
(WFS `wfs-si-gurs-kn`, vrstva STAVBE, filtr FES na obrys `OBRIS_GEOM` v bodě, jinak nejbližší obrys do 6 m; podlaží nad
zemí = `STEVILO_ETAZ` − `STEVILKA_PRITL_ETAZE` + 1, rok, výška H2 − H3 (střecha nad terénem u vchodu), nosná konstrukce, byty; katastr počítá obytné
podkroví jako podlaží: dům o 2–4 podlažích nižší než 3 m × podlaží + 2 m má horní podlaží ve střeše; `?gurs=0`; A/B
`evaluation/slovenia/ab/ZPRAVA.md`). Hledání: Photon ve slovinštině a čísla domů GURS `NASLOVI_HS` (`search-si.js`).
Normy: pravidla o cyklistických plochách a o projektování silnic (dál se používají, nové k ZCes-2 nevyšly), chodník bez
varování (minimum nenalezeno), kolmé stání bez varování. Stání 3 m na směr, na obousměrce jen se středovou čárou (OSM
`lanes` ≥ 2, ne `lane_markings=no`) a na jednosměrce s jedním pruhem (ZPrCP čl. 65, `parkOnRoadway`), na chodníku jen se
značkou a s 1,6 m pro chodce. Značky `signs-SI/` (čísla pravidla 2015/2024, kresby většinou z pravidla 2000; README tam).
Bez paneláků (jugoslávská sídliště nejsou české panelové domy), neutrální vozidla, český mobiliář, rakouské označníky.

### Finsko (Bára 23. 11. 2026)

Stát `finland` (FI), `countries/FI.js`, `towns/finland.js`; hranice GISCO včetně Alandských ostrovů (finská pravidla,
vlastní silniční zákon Alandy nečten), na pobřeží 400 m tolerance jako u Španělska (`city.js` COAST); OSM balík `fi`
(jen R2, celé Finsko zabalené 366 MB). Celostátní ortofoto MML chce osobní klíč (v prohlížeči by byl vidět): ortofoto jen
měst, každé jen ve svém obdélníku (`lanes-ortho.js` `FI_ORTHO`, `fi`): Helsinky 2026 (5 cm, tosiortofoto), Espoo
„Ortokartta“ (asi 30 cm), Turku 2022 (tosiortofoto 5 cm), vše CC BY 4.0; jinde profil jen z OSM. Mapa povrchů Helsinek
z registru veřejných ploch YLRE (WFS kartta.hel.fi, jako Tallinn: budovy OSM před ní, zeleň a voda OSM po ní, jen kde má
pod středem řezu (do 3 m) díl svého druhu, pod ulicí pro auta vozovku; `?helsinki=0`; slepé A/B ulic pro auta
`evaluation/finland/ab2/ZPRAVA.md`: lépe 16, hůř 9; s doplněním kolem mapy na nových obytných ulicích 11 : 7, `ab3`).
Budovy: v Helsinkách registr budov města (podlaží, rok, materiál, fasáda, užití; `?hkibuild=0`), jinde Ryhti SYKE (body
uvnitř obrysu domu z OSM; `?ryhti=0`); dřevěný dům jde do severských vzhledů (`house-looks.js nordicLook("FI")`; A/B
`evaluation/finland/buildings-ab/ZPRAVA.md`). Hledání: Photon ve finštině/švédštině a adresy Ryhti `open_address`
(`search-fi.js`). Normy jen doporučení (Väylä 18/2020, Helsinki „Katutilan mitoitus“ 2014): nic červeně, oranžově pod
nejnižší doporučenou šířkou (`evaluation/finland/NORMY.md` E). Stání 3 m na směr, na chodníku zakázané. Značky
`signs-FI/` (příloha 3 zákona 729/2018, Commons public domain; README tam). Bez paneláků, neutrální vozidla, český
mobiliář, rakouské označníky.

### Dánsko (Bára 23. 11. 2026)

Stát `denmark` (DK), `countries/DK.js`, `towns/denmark.js`; hranice GISCO s Bornholmem, Faerské ostrovy a Grónsko mimo
(GISCO je má zvlášť), na pobřeží 400 m tolerance (`city.js` COAST); OSM balík `dk` (jen R2). Ortofoto jarní mozaika
GeoDanmark přes Dataforsyningen (WMTS `orto_foraar_webm_DAF`, z20, asi 8 cm v Kodani; `lanes-ortho.js` `DK_ORTHO`, `dk`)
pro pruhy i jako podklad mapy, jen s tokenem aplikace (`keys.js`: na webu `config.js` z proměnné repozitáře `DK_TOKEN`,
lokálně `config.local.js`). Bez tokenu nebo když ho služba odmítne (401/403 na všech dlaždicích) chyba `noKey`: profil jen
z OSM a poznámka „Ortofoto tu není k dispozici…“; chyba serveru je výpadek („Zkuste kliknout znovu“). Kodaň (WFS
`wfs-kbhkort.kk.dk/k101`): okraje vozovek a cyklostezek GeoDanmark `vejkant` jako čáry pro obruby (`?kbhkant=0` vypne),
parkovací plochy `parkering_areal` s úhlem stání (`?kbhpark=0`), budovy BBR (`?kbhbyg=0`; jen potřebná pole, nikdy
vlastník); zapnuté od 24. 11. 2026 (Bára, licence vrstev neuvedená; A/B `evaluation/denmark/ab/ZPRAVA.md`). Aarhus: budovy BBR (rok, užití, zdi, podlaží odhadem z ploch;
CC BY 4.0, `?aarbyg=0`). Hledání GSearch (husnummer, navngivenvej; `search-dk.js`), bez tokenu Photon. Normy z vejregler
(Tværprofiler i byer 2019, Anlæg for parkering 2023) jen oranžově, červeně obousměrná cyklostezka 2,5 m. Stání 3 m na
směr, na chodníku v obci zakázané (§ 28). Značky `signs-DK/` (BEK 425/2023, Commons public domain; C 55 jako šablona
aplikace). Bez paneláků, severské vzhledy domů (`nordicLook("DK")`), neutrální vozidla, český mobiliář, rakouské označníky.

### Litva (Bára 24. 11. 2026)

Stát `lithuania` (LT), `countries/LT.js`, `towns/lithuania.js`; hranice GISCO (za polskou PRG), na pobřeží 400 m tolerance
(Klaipėda, Kuršská kosa); OSM balík `lt` (jen R2). **Žádné ortofoto:** celostátní ortofoto NŽT je licencované jen
k prohlížení na geoportal.lt (`evaluation/lithuania/ZDROJE.md`), takže `laneOrtho: "none"` (`lanes-ortho.js` nevrátí
snímek), pruhy z ortofota ani podklad mapy nejsou; mimo Vilnius profil jen odhadem z OSM („jen odhad z OSM“). Vilnius:
topografické plochy 1 : 500 (`gis.vplanas.lt` … `Vilnius_basemap_LKS_su_rajonu/MapServer/13`, kód povrchu `KODAS` a účel
`Paskirtis`: `kelias` vozovka, `pėsč` chodník, `dvir` cyklo, `park` stání, `nuovaža` vjezd…) jako plochy řezu, když pod
středem řezu (do 3 m) leží vozovka mapy (pod pěšinou i chodník); před nimi budovy OSM, po nich zeleň a voda OSM
(`?vilnius=0` vypne). Licence neuvedená, kredit „Vilniaus miesto savivaldybė / Vilniaus planas“ (Bára jako u Kodaně).
A/B `evaluation/lithuania/ab/ZPRAVA.md`. Vzhled domů z OSM (GRPK nemá podlaží ani rok); obrysy budov GRPK
(geoportal.lt `NZT/GRPK/MapServer/22`, CC BY 4.0) ukončují řez u fasády: pod mapou Vilniusu před budovami OSM, v odhadu
jen domy, které OSM nemá (`?grpk=0` vypne; A/B v `evaluation/lithuania/ZPRAVA.md`). Hledání Photon. Normy jen
z městských příruček Vilniusu (2021) a Kaunasu (2024), oranžově. Stání 3 m na směr (KET 150.7, z druhé ruky), na
chodníku jen se značkou. Značky `signs-LT/` (Commons, Augustasci CC BY 4.0 / public domain, tabulky Gigillo83 CC BY-SA
4.0; 329 jako šablona aplikace). Socialistické vzhledy domů ano (sovětská sídliště jako v Estonsku), neutrální vozidla,
český mobiliář, rakouské označníky.

### USA: Washington (Bára 24. 11. 2026, fáze 2 pilotu Severní Ameriky)

Stát `usa` (US), `countries/US.js`, `towns/usa.js`; v `staty.json` jen metro Washingtonu (`usa`: District of Columbia,
Montgomery a Prince George's v Marylandu, Arlington, Fairfax County, Fairfax city, Falls Church a Alexandria ve Virginii,
hranice okresů z TIGERweb Census Bureau), zbytek USA je `closed_us` s hláškou (jako Itálie mimo pokrytí). OSM balík
`us_dc` (výřez Geofabriku District of Columbia a Marylandu a Virginie oříznutých na obdélník metra, sloučené osmiem;
`osm-tiles.yml` umí výřezy spojené „+“ s obdélníkem za „@“), jen R2. V DC:
- **mapa povrchů** DC Planimetrics 2023 (`maps2.dcgis.dc.gov` `Planimetrics_2023/MapServer` 10 vozovky, 11 chodníky,
  1 budovy; CC BY 4.0) čtená podél řezu po 0,1 m jako GRB Flander (mapování z pilotu `evaluation/usa-dc/build.mjs`: mezera
  mezi plochami je zeleň, parkoviště, uličky a vjezdy jiná zpevněná plocha), jen kde má ulici pod středem řezu
  (`hasStreet` jako Vilnius a Helsinky); řez ve středu plochy „Intersection“ to řekne; `?dc=0` vypne;
- **inventář DDOT** Roadway SubBlock (`Transportation_WebMercator/MapServer/162`): počet pruhů jako OSM `lanes` cesty
  (`app.js` `wayTags`), pruhy stání u vnějších obrub vozovky (704) a cyklopruhy, kde je OSM nemá; strany
  podle cesty řezu, chráněná cyklostezka tam, kde ji má OSM (i uprostřed ulice), blok podle druhu a jen vyplněný; kde blok je, odhad stání
  podle pravidel je vypnutý (`noParkGuess`); `?ddot=0` vypne;
- **uličky** z planimetrie jako plochy `service=alley` v prvcích OSM (ústí uličky = křižovatka, `derive.js`);
- **domy** z odhadních tabulek CAMA (rok, podlaží, druh, zdivo podle pozemku pod domem; `evaluation/north-america-art/cama/ZPRAVA.md`),
  2–3 dotazy na řez, nejdéle 3,5 s; `?cama=0` vypne;
- **ortofoto** DC 2025 (`Ortho2025_WebMercator`, export v Web Mercatoru, jen nad Districtem podle hranice `mesta-us.json` a 60 m za ní: `lanes-ortho.js us-dc`)
  pro pruhy, model obrub a podklad mapy. Mimo DC v metru jen odhad z OSM.
Normy DDOT (DEM 2023, Bicycle Facility Design Guide 2020) a NACTO jen oranžově (`evaluation/usa/NORMY.md`), stání 3 m na
směr (IFC 503.2.1, 18 DCMR § 2405), bez řádku značek, bez paneláků, severoamerické domy, mobiliář a autobus Metrobus
(`northamerica/`, `washington/`; `evaluation/north-america-art/`). Hledání Photon v obdélníku metra. A/B a měření v `evaluation/usa/`.

### USA: Boston (Bára 26. 11. 2026)

Druhé metro státu `usa`: okresy Suffolk, Middlesex a Norfolk (TIGERweb; `tools/build_staty.mjs` má metra v tabulce `METROS`,
další metro = další řádek), OSM balík `us_bos` (Geofabrik Massachusetts oříznutý obdélníkem metra, jen R2). Města v
`mesta-us.json`: `boston` (ilustrace: autobus a tramvaj MBTA, označník, lampa acorn do 5 m), `bostonmetro` (celé metro:
autobus a tramvaj MBTA, ortofoto MassGIS, texty a normy Bostonu) a `cambridge` (jen území mapy povrchů).
- **mapy povrchů** Bostonu (Street Edges, Sidewalk Inventory, budovy s počtem podlaží) a Cambridge (Roads, Sidewalks,
  Driveways, Parking Lots, Buildings), obě PDDL, společným adaptérem `towns/planimetrics.js` (`towns/boston.js`). Vozovky
  jsou v obou službách polygony přes celé město (5 MB na dotaz), proto se **jednou týdně při nasazení** stáhnou a rozřežou do
  dlaždic `data/us-plan/<město>/` (`tools/build_planimetrics_us.mjs`, 0,005°, každý polygon oříznutý na dlaždici; Boston
  711 dlaždic 35 MB, Cambridge 120 a 9 MB); při kliknutí žádný dotaz na město. Lokálně: `node tools/build_planimetrics_us.mjs`
  (zapíše `pilot/data/us-plan`). Řez na hranici měst bere mapu města, ve kterém leží (Memorial Drive je Cambridge).
  `?boston=0`, `?cambridge=0` vypnou, `?bostonhouse=0` vypne podlaží domů.
- **ortofoto** MassGIS 2025 (15 cm, dlaždice z20, „No restrictions“) nad celým metrem: pruhy, obruby, podklad mapy (`lanes-ortho.js us-ma`).
- normy Boston Complete Streets Guidelines 2013 jen oranžově (`evaluation/usa/boston/NORMY.md`), stání 3 m na směr jako DC.
Měření `evaluation/usa/boston/ZPRAVA.md`.

### Kanada: Toronto (Bára 25. 11. 2026)

Stát `canada` (CA), `countries/CA.js`, `towns/canada.js`; Toronto a obce kolem (StatCan), zbytek Kanady `closed_ca`. Mapa povrchů města
(`cot_geospatial3`: vozovky, chodníky, parkoviště, budovy) jde společným adaptérem **`towns/planimetrics.js`** (popis města: vrstvy a jejich
kódy, křižovatky, `prepare`, `adjust`), který sdílí s Washingtonem (`towns/usa.js` je popis, inventář DDOT a CAMA). Mezera mezi vozovkami = dělicí
pás (`?off=mapgaps`), s kolejí OSM = tramvajové těleso (koleje v tunelu ne); pruh stání z parkoviště u obruby (`?off=kerbbays`); cyklostezky novější
než mapa z OSM, samostatné i jen jako tag silnice (`?off=roadtracks`). Stát, zdroje a domy Severní Ameriky se načtou, až když tam je řez nebo mapa
(`late.js` `ensurePlace`, `america.js`, `staty-america.json`, `mesta-us.json`, `mesta-ca.json`).
`?toronto=0` vypne. Ortofoto `cot_ortho`, OSM balík `ca_on_toronto`. Měření `evaluation/canada/ZPRAVA.md`. Obdobné město = popis v
`towns/…`, kredity (`cityMap`), texty.

Tři společné změny z pilotu (všechny státy, každá s vypínačem): ústí uličky (OSM `service=alley` a plochy uliček) je
křižovatka (`?off=ulicky`); jamky stromů v chodníku, tedy pás zeleně do 1,3 m mezi chodníkem a obrubou, který na ortofotu
vypadá jako dlažba, patří chodníku (`derive.js treePitsAsSidewalk`; **vypnuté**, `?treepits=1` zapne: slepé A/B DC 2 : 2,
české kontroly 0 : 1); obousměrka s jedním pruhem se dělí na dva
už od 4,0 m, kde je počet pruhů známý (OSM `lanes` ≥ 2 nebo inventář; `?off=pocetpruhu`).

### Dlaždice OSM

Jedna sada dlaždic pro všechna města (`pilot/data/osm-tiles`, na webu `data/osm-tiles`) z výřezu Geofabrik Česká
republika:

```bash
mkdir -p data/osm && curl -fL -o data/osm/cz.osm.pbf https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf
NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf pilot/data/osm-tiles
```

Na Macu s QGIS přidejte před příkaz `OGR=/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr
PROJ_DATA=…/Resources/qgis/proj GDAL_DATA=…/Resources/qgis/gdal`. Exporty ogr2ogr trvají asi 8 min, dlaždice
(`tools/build_osm_tiles.mjs`) se zapisují proudově za 1–2 min. Úsporný zápis (`pilot/public/osmtile.js`): jen značky,
které profil čte nebo by mohl (zóny, rychlosti, povrch, zastávky, přechody, druhy stromů, šířky, značky), chodníky
a pěšiny jen u ulic (v parcích, lesích a polích ne), bez polních cest; souřadnice jako rozdíly celých čísel (budovy
na 1 m); dlouhé cesty rozdělené po dlaždicích a v aplikaci zase spojené. Do 15. 11. 2026 asi 800 MB ve 245 000
dlaždicích.
Přesné výběry jsou ve skriptu `tools/build_osm_data.sh`: ulice, parkování, stromy, nástupiště, mobiliář, bariéry
(i obruby `barrier=kerb`), předzahrádky, budovy, zeleň, voda a plochy vozovek (`area:highway`). Overpass se nepoužívá.

Od 15. 11. 2026 (Bára) jsou v dlaždicích **všechny budovy**, nejen ty s výškou nebo počtem podlaží; ty bez výšky
jen do 60–90 m od silnice. V Česku zůstává hlavním zdrojem domů RÚIAN a technická mapa, OSM je tam kvůli místům
bez technické mapy (`ortho-osm.js`) a kvůli zahraničí. U budov se drží i `start_date`, `roof:shape`,
`building:material` a `building:min_level`. **Zelené plochy** (`landuse` grass, meadow, village_green, flowerbed,
forest, orchard, recreation_ground; `leisure` park, garden; `natural` grass, grassland, scrub, wood, heath) a **voda,
zahrádky a hřbitovy** se rozřežou po dlaždicích (každá dlaždice má svůj kus, na 1 m) a drží se jen v dlaždicích, kudy
vede silnice. Pražský výřez: 88 → 116 MB (+32 %), celá ČR 0,84 → 1,39 GB (domy bez výšky 279 MB, zeleň 236 MB):
přes limit GitHub Pages 1 GB, proto se čeká na dlaždice na Cloudflare R2 (Bára 15. 11. 2026: zatím nepushovat).

Na webu (Bára 15. 11. 2026) jsou dlaždice každého státu (ČR, Slovensko) zabalené do jednoho souboru
(`tools/pack_osm_tiles.mjs`, formát v `pilot/public/osmpack.js`: slovník tagů, krátký zápis prvků, každá dlaždice
zvlášť gzip, dvouúrovňový index) a aplikace z něj čte jen potřebné kousky přes HTTP Range. Soubory leží na
Cloudflare R2 (kbelík `profily-ulic-osm`, `https://data.streetspace.eu/osm/`) a tytéž na Pages (`data/osm-pack/`),
kam aplikace sáhne, když R2 neodpovídá. `index.json` vedle nich jmenuje soubor každého státu; týdenní obnova je
nahrává pod novým jménem s datem. ČR asi 281 MB místo 1,3 GB ve 246 000 souborech, Slovensko 107 MB.
Lokálně: `node tools/pack_osm_tiles.mjs pilot/data/osm-tiles pilot/data/osm-pack/cz.posm` a aplikace s `?osm=balik`
(soubory z místního serveru) nebo `?osm=r2` (z R2); bez přepínače čte místní server dlaždice jako dřív.
Kontrola balíku proti dlaždicím: `node evaluation/osm_pack_check.mjs <dlaždice> <soubor nebo URL> [samples.json …] --all`.

### Orientace stání

Podélné, šikmé a kolmé stání se bere z OSM (`orientation` u ploch parkování, `parking:*:orientation` u ulic) nebo
z dat města. U úseků TSK se dopočítá z průměrné hloubky úseku (plocha / délka) a počtu stání (`PS_ZPS`): hloubka
od 4,9 m = kolmé, pod 3 m = podélné, jinak podle délky na stání (pod 3,4 m kolmé, 3,4–4,8 m šikmé, víc podélné).
Kde nic z toho není, odhadne se z hloubky pásu: do 3,2 m podélné, do 4,6 m šikmé, jinak kolmé.
Odhad „kolmé“ vedle vozovky užší než 5 m je šikmé: do kolmého stání se zajíždí z asi 6 m, do šikmého pod 45° ze 3,5 m
(ČSN 73 6056; Laubova, kde stromy mezi stáními kazí délku na stání).
V editoru jde orientace změnit ručně. Kolmé stání má podle ČSN 73 6056 hloubku 5,0 m, s přesahem vozidel
přes obrubník 4,5 m; užší změřený pás kolmého stání se doplní na 4,5 m z chodníku nebo zeleně za obrubníkem.

**Stání na chodníku** (`parking:<strana>=on_kerb|half_on_kerb`, ve starém schématu
`parking:lane:<strana>:<orientace>=on_kerb|half_on_kerb`): technická mapa tam kreslí chodník. `on_kerb` vyčlení
z chodníku u obruby pás celého auta (2 / 4,5 / 5 m podle orientace) na úrovni chodníku, `half_on_kerb` polovinu
z chodníku a polovinu z vozovky jako jednu část přes obrubu (auto nakloněné). Chodníku zůstane aspoň 0,5 m:
na užším se auto zúží (na celém chodníku nejméně na 1 m, polovina na chodníku na 0,3 m), jinak se nekreslí; obojí
řekne hláška u profilu, stejně jako když vozovka po polovině aut nesplní § 25 odst. 3 (3 m pro každý směr).
Pruhy se pak dělí podle zbytku vozovky (nejméně jeden). U úseku TSK, plochy MTVU 704 nebo úseku města u obruby
zůstane jejich šířka a z OSM se vezme jen poloha. Část nese `position` (v Návrhu „Poloha“, v odkazu, do Streetmixu
jako parking-lane, zvýšená u `on_kerb`), varování hlídá zbytek chodníku (min. 1,5 m) a značky jsou IP 11d až IP 11g.

### Výška a vzhled budov

Počet podlaží budov na okrajích profilu se v Praze bere z vrstvy IPR *Podlažnosti*
(`mp.iprpraha.cz/.../URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0`: podlaží po římsu, střešní/ustupující
podlaží, celkem, příznak nové budovy), v Brně z Průzkumu budov KAM, v Plzni z 3D budov, jinde z RÚIAN ČÚZK
(`gis.js` `ruianBuilding`: podlaží, využití, rok dokončení, druh konstrukce), jinak z OSM `building:levels`
(+ `roof:levels`). Výška se kreslí 3,5 m na podlaží (přesná výška z OSM `height` nebo z 3D budov), střešní podlaží
užší a tmavší. Osmnáct vzhledů domu (činžák se šikmou střechou, měšťanský dům na náměstí, sorela, zděný bytový dům 50.–60. let, poválečný bytový dům, škola, kostel, garáž, funkcionalistický činžák, panelák, moderní
bytový dům, kancelářská budova, městský dům, vila, rodinný dům 60.–80. let, nový rodinný dům, venkovský dům štítem do
ulice, hala; Bára 16. 11. 2026, nové kreslené na základě starších v `profile.js` `BASE_STYLE`) se volí podle tvaru bloku z OSM, údajů o domě a stáří zástavby: v Praze z vrstvy IPR *Vývoj zástavby*
(statické dlaždice z `tools/build_vyvoj.mjs`), jinde z roku dokončení v RÚIAN (do 1919 a 1946–57 šikmá střecha,
1948–57 sorela, 1958–69 zděný bytový dům do 5 podlaží (i deska), jinak od 1955 panelová éra, od 1996 moderní dům;
v Praze a Brně rok, zdi a využití domu z RÚIAN ČÚZK dalším dotazem při kliknutí, podlaží dál z IPR a KAM; stáří
zástavby IPR zůstává v Praze pro domy, u kterých RÚIAN rok nemá). Vnitřní město a sídliště podle vzdálenosti od centra má každé město
vlastní (`city.js` `innerKm`, `estateKm`). Panelák ne (Bára 16. 11. 2026, `evaluation/budovy-panel/ZPRAVA.md`): u domu
dokončeného před 1955, u zdí z cihel, kamene, monolitu či dřeva podle RÚIAN (kreslí se plochý činžák), u panelového
domu po 1995 (moderní dům); bez centra města (zbytek ČR, Slovensko) bez roku jen podle tvaru desky nebo od 8 podlaží.
Kód konstrukce 10 („kámen, cihly, tvárnice vč. kombinací“) nic neříká (na Lesné ho má třetina paneláků). Rodinný
dům (RÚIAN rodinný dům, OSM house, IPR typ 6) podle roku: do 1945 vila, 1946–89 „kostka“, od 1990 nový; štítem do
ulice (úzký půdorys, delší strana napříč ulicí, `derive.js` `gableToStreet`) a starý mimo vnitřní město venkovský dům,
stejně zemědělská usedlost RÚIAN (dřív hala); v řadě starší městský dům. Bytový dům 1948–57 (RÚIAN) sorela, 1958–69 bez panelů v RÚIAN zděný bytový dům 50.–60. let se šikmou střechou (Street View 25 domů, `evaluation/budovy-panel/k-foceni.md`).
Socialistické vzhledy (sorela, zděný bytový dům 50.–60. let, panelák) jen tam, kde se stavěly (Bára 23. 11. 2026):
v Česku, na Slovensku, v Polsku, v Estonsku (sovětská sídliště) a v bývalé NDR (`countries/<ISO>.js` `socialistLooks`,
v Německu podle `city.panels`). Jinde, i v „cizině“, platí `profile.js` `westernLook`: sorela, zděný dům 50.–60. let,
panelová deska a plochý činžák z let 1946–90 jsou poválečný bytový dům (hladká omítka, pravidelné řady oken s rolety,
balkony s barevným parapetem, plochá střecha s tenkou atikou; `evaluation/budovy-povalecny/ZPRAVA.md`), deska před 1946
funkcionalistický dům, po 1990 moderní, kancelář zůstává kanceláří. Ručně jde poválečný dům vybrat všude.
Regionální vzhledy starých domů (Bára 23. 11. 2026, `docs/house-types-europe.md`, `evaluation/budovy-regiony/ZPRAVA.md`):
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
u řezu není lem ani obrys: dům tam pokračuje. Místo domu si profil drží zaokrouhlené v `info.at` (`app.js`).
Kancelář, úřad, hotel (OSM nebo RÚIAN využití 5, 11, 14, 15) kancelářská budova; OSM school a kindergarten škola,
OSM church, chapel aj. kostel, OSM garage(s) a RÚIAN garáž garáž. Starý dům (RÚIAN do 1919, v Praze zastavěno do
1840) do 5 podlaží v samém centru (`city.coreKm`, výchozí 0,3 km od náměstí, Praha 0,6 km) je měšťanský dům.
Podloubí jen podle dat (Bára): cesta OSM `covered=arcade|colonnade|building_arcade` přes řez u fasády (5 m před ní až
8 m za ní, `derive.js`) → u jakéhokoli domu klenutý průchod v přízemí, v kartě „s podloubím (OSM)“. Věžák zvlášť nekreslíme: vysoký dům stejného stáří a využití vypadá po podlažích stejně (Bára).

Severní Amerika má 14 vlastních vzhledů (`houses-america.js`, výběr `house-looks-america.js` `northAmericaLook`, USA i Kanada;
`docs/house-types-north-america.md`, `evaluation/north-america-art/houses/ZPRAVA.md`); bez dat prostý řadový nebo rodinný dům.
Vzhled domu čte všechny budovy OSM, i bez podlaží a výšky, ve všech státech (`?off=vsedomy` jen dřívější; `evaluation/all-buildings/ZPRAVA.md`);
registr budov má přednost. Panelák jen z tvaru bloku bez podlaží a druhu se nedělá, dům v řadě bez podlaží je ve Flandrech cihlový městský.
Sada mobiliáře smí mít vlastní lampu do 5 m (`lamp-post-top`, světlo `data-light` ve zvolené výšce, `profile.js postTopLamp`): Washington svůj glóbus, Boston je připravený.

## Brno

Stejně jako Praha se Brno ptá služeb města při kliknutí (přímo z prohlížeče, služby povolují CORS). Úpravy výpočtu,
které vznikly v Brně, platí od 25. 11. 2026 všude i v Praze (`derive.js`, `city.fix` zrušené,
`evaluation/sjednoceni/praha/ZPRAVA.md`): obslužná cesta (`service`, ne vjezd ani parkoviště) je křižovatka
(`?off=obsluzne`), ale na dvouvozovkové ulici neodsune řez na křižovatku protější vozovky (`?off=protejsi`); ústí uličky
(`service=alley`, i plocha) také (`?off=ulicky`), plocha jen pro ulici, do které se otevírá (do 20 m podél osy), ne pro cestu,
která jí vede (`?off=ulickysve`, `tests/placement.test.js`); osa OSM do 4,5 m vedle vozovky se posune na ni a zpevněná plocha pod osou
je vozovka (`?off=osafix`), ne však dělicí pás mezi dvěma vozovkami ani pás užší než 3 m (`?off=osaroad`). Obousměrka se
stáním u vozovky a s počtem pruhů z OSM ≥ 2 se dělí na dva pruhy už od 4,0 m (`?off=pocetpruhu`).

- plochy: MTVU města (`gis.brno.cz/ags3 … PUBLIC/opendata_mtvu`, vrstva 1). Brněnské kódy 5100xxx
  (číselník v legendě `PUBLIC/ted_MTVU_plochy_povrch`) převádí `brnoMtvuCode` v `sources.js` na pražské;
- koleje, svodidla, ploty, zdi, zábradlí, svahy a body (lampy, stromy, lavičky, sloupky): kresba technické
  mapy UMPS (`PUBLIC/opendata_umps`, jeden dotaz `identify`). Kódy linií mají stejnou soustavu jako IPR
  s předponou (`brnoLineCode`: 1255010 → 55010);
- parkování: aktuální úseky placeného stání z mapy parkovanivbrne.cz, stažené při nasazení do dlaždic
  (`tools/build_parkovani_brno.mjs`, `data/brno/parkovani/`); export na data.brno.cz je starší. Oblasti
  rezidentního parkování se nepoužívají (ohraničují celé čtvrti, i ulice bez placeného stání): kde u řezu
  úsek není, profil stání odhadne;
- cyklopruhy, piktokoridory a protisměr: Cykloopatření – zrealizovaná (data.brno.cz), jen kde OSM nic neříká;
- mosty: nadzemní plochy MTVU (`PUBLIC/ted_MTVU_plochy_nadzemni`), jen pro řez na mostě;
- budovy: Průzkum budov v Brně (KAM): podlaží, podlaží ve střeše, střecha.

Pro města bez vlastní služby je v `tools/` schovaný záložní postup z veřejné DTM kraje (IS DMVS ČÚZK, bez přihlášení).
`tools/fetch_dtm_brno.sh` stáhne sady ZPS_KR a DI po městských částech, `tools/build_dtm_brno.py` z hranic a
definičních bodů složí plochy (všechny části najednou, v oknech, s uzavřením mezer do 1 m), kde chybí
obruby, rozdělí slité plochy podle OSM a nejbližších definičních bodů (označené „odhad“) a zapíše dlaždice
`{p, l}`. Pro Brno to dalo 10 sedí / 79 částečně / 11 špatně ze 100 řezů (MTVU města je přesnější).
Spuštění (QGIS Python s GDAL a shapely):

```
tools/fetch_dtm_brno.sh
Q=/Applications/QGIS-final-4_2_3.app/Contents
PROJ_DATA=$Q/Resources/qgis/proj GDAL_DATA=$Q/Resources/qgis/gdal $Q/MacOS/python tools/build_dtm_brno.py data/dtm-brno/zip data/osm/brno_ways.geojsonl <výstup>
```

## Města jako moduly

Každé město je jeden modul `pilot/public/towns/<město>.js` (vzor `towns/jihlava.js`): zdroje dat pro
kliknutí (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`) ve stejném tvaru jako odpovědi IPR, podkladové
mapy (`maps`) a ortofoto pro kontrolu řezů (`ortho`). Společné funkce jsou v `pilot/public/gis.js`, dlaždice OSM
čtou všechna města stejné. Texty aplikace a uvedení zdrojů jsou v `city.js`, servery pro CSP a staré adresy
v `tools/cities.mjs`. Město patří do státu a dědí od něj, co nemá svého (`countries/<ISO>.js`; vlastní ortofoto pruhů
přepíše `laneOrtho`); jen data města popisují jeho vlastnosti (`roadOnPath`, `slowServer`, `ruianYear` u Prahy a Brna). Nové město: záznam v
`city.js` a `tools/cities.mjs`, modul v `towns/` (a v `towns/index.js`), kredit jeho zdrojů pod klíčem v `credits.js`,
kód obce v `tools/build_mesta.mjs` (pak `node tools/build_mesta.mjs`), ilustrace v `pilot/public/<město>/`,
kontrola `CITY=<město> node evaluation/sample.mjs|run_brno.mjs|render_brno.mjs` a A/B test (níže).

Ilustrace měst (`pilot/public/<město>/`, podle fotek z Wikimedia Commons): tramvaje, trolejbusy a autobusy místních
dopravců, sloupy trakčního vedení a označníky; mobiliář je kromě Brna pražský. Vlastní vozidla mají Praha (T3,
SOR NB 12), Brno (Tatra T3 v nátěru DPMB, 45T a 13T, autobus DPMB), Jihlava (32Tr, Citelis), Most (EVO2, SOR NB 12),
Opava (32Tr, Urbanway), Pardubice (32Tr, Urbanway), Plzeň (40T, 26Tr, SOR NS 12), Ostrava (Tango NF2, 26Tr,
Urbino IV CNG) a Ústí. Olomouc, Liberec, Hradec Králové, České Budějovice a Zlín berou data jako zbytek Česka
a mají jen vlastní vozidla (`city.js` `artTown`). Jinde kreslí vozidla Streetmix.

### Jihlava

Služby města (`gis.jihlava-city.cz`, CORS povolený):

- plochy: **pasport komunikací** (`server1/ost/Pasporty/MapServer/112`, úseky „vozovka“ a „chodník“ s
  povrchem, třídou a názvem ulice) → kódy MTVU 701 a 702; **budovy RÚIAN** (`server/ost/ORP_RUIAN/7`, i s
  počtem podlaží a využitím) → 601; **trávníky** z pasportu zeleně (`Pasporty/25`) → 401; zbytek z **katastru**
  (`server/ost/Ji_parcely/1`, druh pozemku): zahrada → 300, travní porost a zeleň → 401, zastavěná plocha a
  nádvoří → 603, pole, les, voda, manipulační plocha; pozemek komunikace mimo pasport → zeleň (odhad), jen je-li
  v okolí vozovka z pasportu. Pásy silnic v pasportu (celá koruna silnice) se zúží o 1,25 m na stranu.
- parkování: **parkovací místa města** (`server1/verejnost/doprava_verejnost/MapServer/105`) jsou čáry s druhem
  stání (podélné, šikmé, kolmé), režimem a počtem míst. Každá čára je pruh hloubky 2,0 / 4,5 / 5,0 m; leží-li
  vozovka jen na jedné straně čáry (čára u obrubníku), pruh leží na té straně, jinak je čára jeho osou.
  Úseky „Zákaz stání / zastavení“ se vynechávají, K+R, taxi a vyhrazená stání jsou „zvláštní stání“.
- linie: ploty, zábradlí, zdi, svodidla a protihlukové stěny z technické mapy (`server1/DTM/DTM_ZPS_verejnost/12`).
- body: stromy (`Pasporty/28`), stožáry osvětlení (`Pasporty/50`), přístřešky a lavičky zastávek (`Pasporty/127`)
  a stojany na kola (`doprava_verejnost/150`), kde je OSM nemá do 3 m (přístřešek do 15 m).
- souřadnice: služby města převádějí S-JTSK do WGS 84 jinou transformací (asi 6 m vedle OSM), dotazy proto žádají
  `datumTransformation=1623` jako u IPR.
- další vrstvy města (nepoužité): jednosměrky a cyklo-obousměrky, obytné zóny a zóny 30, přechody, trolejové
  vedení a trakční sloupy, zastávky s vybavením, dopravní značky, mosty.

### Most, Opava, Plzeň

- **Most** (`mapy.mesto-most.cz`): plochy z objektové mapy povrchové situace v otevřených datech
  (`Opendata/OpendataDtmOmps/FeatureServer/9`, kódy `KOD_OMPS`/`KOD`), linie z technické mapy (`DTM/DtmUMPS`:
  ploty, zdi, zábradlí, svodidla, osy kolejí jen do 3 m od tramvaje v OSM), stromy a lavičky z technické mapy,
  lampy z otevřených dat; stání s orientací město nemá. Datum sedí. Kontrola 57 řezů: `evaluation/most/ZPRAVA.md`.
- **Opava** (`mapy.opava-city.cz`, složka `external`): plochy z účelové mapy povrchové situace
  (`info_dtm_plochy_find/0`, pole `POPIS`; vozovky ulic jsou čtyři polygony přes celé město, tři s chybným popisem,
  čtou se zvlášť a zjednodušené), stání placených zón (`dopr_zps`), stromy, lavičky, kryté zastávky, stojany.
  Služby jsou 4 m vedle OSM, dotazy s `datumTransformation=1623`. Kontrola 50 řezů: `evaluation/opava/ZPRAVA.md`.
- **Plzeň** (`ags.plzen.eu`): technická mapa ve struktuře JVF DTM (`GIS_DTM/GIS_DTM_ZPS_kesovana/FeatureServer`,
  jeden dotaz na asi 45 vrstev ploch a linií), 3D budovy s výškou okapu a hřebene (`GIS_3D_budovy`), stromy,
  lavičky, stojany a sloupky z pasportů, ortofoto 2024. Služby jsou 12 m vedle OSM: dotazy s 1623, kde to vrstva
  nepřijme, posun vstupu. Osy kolejí město nezveřejňuje (z OSM), tramvajová tělesa jsou výchozí z panelů.
  Zóny placeného stání z otevřených dat (CC0, `tools/build_zony_plzen.mjs` při nasazení): podél čáry zóny se
  u obrub nakreslí stání 2 m jako odhad. Kontrola 50 řezů: `evaluation/plzen/ZPRAVA.md`.

### Pasporty dalších měst (16. 11. 2026)

Ve zbytku Česka („cesko“) se v hranicích tří obcí (`pilot/public/pasporty.json`, `node tools/build_pasporty.mjs`)
berou plochy z pasportu města a jinde DTM ČÚZK (`towns/pasporty.js`, `towns/overlay.js overDmvs`): komunikace
Rožnova pod Radhoštěm (T-MAPY PaKom), Šlapanic (komunikace podle třídy, parkoviště) a Kuřimi (osy
zimní údržby se šířkou převedené na plochy). Pasport, který v okolí řezu nic nemá, nechá řez technické mapě. Nejsou
to samostatná města (texty, ilustrace a mapy zůstávají české obecné). Zdroje našlo vlákno o Slovensku, do aplikace
šly před A/B testem; A/B 26. 11. 2026 (`evaluation/PASPORTY-AB.md`) nechal čtyři a vyřadil Chomutov, Šumperk,
Litoměřice a zeleň Prachatic a Roudnice nad Labem (nevyhrály); Chotěboř vyřadila Bára kvůli licenci (vrstva na demo
účtu, ne města; uložené řezy s nimi si kredit nechají,
`pasporty-names.js`). Export uvádí „pasport komunikací © <město>“.
Vynechané předtím: Mohelnice a Velké Meziříčí (prázdný pasport), T-MAPY Litoměřic (chce přihlášení). Části změřené na pasportu
(zde i v Karviné, Frýdku-Místku a Třebíči; `gis.js asPassport`) mají zdroj „z pasportu města“ (tyrkysová v legendě),
jízdní pruhy dál „doplněno z OSM“ (vozovku do pruhů dělí OSM), a text ve Stavu jmenuje pasport města.

### Ostrava, Frýdek-Místek, Karviná, Třebíč, Přerov, Ústí nad Labem

Připojená po srovnání s celostátní DTM ČÚZK nad ortofotem (`evaluation/<město>/data/ab-*/review.md`).

- **Ostrava** (`towns/ostrava.js`, `mapy.ostrava.cz`): plochy z generalizované technické mapy města
  (`MAPPA/Polohopis_DTM_generalizace/MapServer/0`, pole `POPIS`), zpevněná plocha s osou koleje
  (`BaseMap/podkladova_mapa_OSTRAVA/MapServer/25`) je tramvajový pás, zdi a ploty z obrysů ploch, úseky placeného
  stání (`SMO/parkovaci_mista/MapServer/9`). Dotazy s `datumTransformation=1623` (jinak 1,5 m vedle OSM).
- **Frýdek-Místek** (`towns/frydek-mistek.js`) a **Karviná** (`towns/karvina.js`): pasport komunikací na serverech
  T-MAPY (WFS 2.0 `…/common/pakom/gservice`, typ `ms:pk-pov`), zeleň z pasportu zeleně (`pazel`) jen tam, kde DTM
  nic nemá, stromy, lavičky, stojany a lampy z pasportů. Pasport leží nad celostátní DTM (`towns/overlay.js`);
  kde ta nemá nic, doplní domy a parcely RÚIAN. WFS se ptá v WGS 84 a odpovídá ve Web Mercatoru (`srsName=EPSG:4326`
  s boxem vrací nic). Frýdek-Místek je pak 0,5 m vedle RÚIAN (posun v modulu), Karviná sedí. Pasport Karviné
  pokrývá jen část města (Fryštát, část Nového Města a Ráje), jinde zůstává DTM ČÚZK. Karviná má i linie technické
  mapy (`dtmm`, `ms:dtm-umps-l`): ploty a opěrné zdi. Server Frýdku-Místku posílá neúplný řetěz certifikátů
  (Chrome si ho doplní; skripty v Node potřebují `NODE_EXTRA_CA_CERTS` s mezilehlým certifikátem Alpiro).
- **Třebíč** (`towns/trebic.js`, `gis.trebic.cz`): pasport komunikací PaKom 2020 (`public/PaKom2020/MapServer/6`,
  `typ_pov_05`; parkoviště podle poznámky) nad celostátní DTM, lampy (`public/VO`) a lavičky. Dotazy s 1623.
- **Přerov** (`towns/prerov.js`): technická mapa jen jako vektorové dlaždice v S-JTSK
  (`DTM_polohopis_vector/VectorTileServer`). Modul čte dlaždice úrovně 7 kolem řezu (`towns/mvt.js`), převede je
  do WGS 84 (`towns/sjtsk.js`, Křovák + EPSG 1623, sedí s PROJ na 1 mm) a druh plochy bere z názvu vrstvy.
- **Ústí nad Labem** (`towns/usti.js`): plochy z DTM ČÚZK (Ústecký kraj ji má celou), k tomu
  **parkovací místa města** (`mapy.usti.cz`, `Doprava/Parkovaci_zony_UL/MapServer/3`, řada stání s druhem: podélné,
  kolmé, šikmé, vyhrazené, ZTP; asi 435 řad v centru a okolí). Služba je bez `datumTransformation=1623` asi 12 m
  vedle OSM. A/B nad ortofotem (`evaluation/variants/usti-stani.mjs`, 36 řezů u stání): lepší 6, horší 1, stejně 3.

### Celostátní technická mapa (Pardubice a zbytek Česka)

- **DTM krajů z WFS** (`pilot/public/dtmwfs.js`): v devíti krajích s DTM od T-MAPY (Jihočeský, Pardubický,
  Vysočina, Moravskoslezský, Královéhradecký, Jihomoravský, Liberecký, Karlovarský, Zlínský) dává mapová služba
  kraje WFS 2.0 se skutečnými polygony (`…/mapservice/v1/wms/dtm_zps_plochy_bar`, GML v S-JTSK, CORS). Kraj řezu
  se pozná podle `kraje.json` (`node tools/build_kraje.mjs`), jeden dotaz, kliknutí medián 0,65 s. A/B 137 řezů
  proti obrázkům DMVS: lepší 6, horší 3, jinak stejně; ploty a zdi z WFS se nepřipojují (uříznou chodníky).
  `evaluation/dtm-wfs/ZPRAVA.md`.
- **Obrázky IS DMVS ČÚZK** (`pilot/public/dmvs.js`): jinde, při chybě WFS nebo když do 1,5 s neodpoví. Služba
  nevrací tvary, jen obrázky a typ plochy v bodě: modul stáhne obrázek ploch a hraničních linií (0,1 m/px),
  rozdělí ho podle barev legendy, obtáhne obrysy a typ bílých a šedých ploch na řezu doptá (průměrně 6 dotazů,
  kliknutí kolem 1 s).
- Prázdná místa DTM doplní budovy a parcely RÚIAN; kde DTM kolem řezu nemá nic, je profil odhad z OSM. Kvalita
  záleží na kraji: v Pardubicích chybí vozovky mimo zástavbu a plochy uvnitř bloků. Mosty jsou vozovka.
  Tramvajová plocha DTM s vozovkou po obou stranách bez obruby nebo zeleně mezi nimi jsou koleje ve vozovce.
- **Náhrada za mapu města** (`sources.js` `national`): kde technická mapa města nic nevrátí (řez kousek za
  hranicí), nebo když neodpoví (IPR přetížený, 503 i po opakování), vezmou se plochy z celostátní technické mapy
  stejnou cestou. V Národní při simulovaném výpadku IPR vyšel profil skoro stejně (chodník 3,80 místo 3,90 m).
  Uživatel to vidí za názvem ulice („plochy z technické mapy ČÚZK“) a ve stavovém řádku, export uvede ČÚZK.
  Kde neodpoví ani ČÚZK, je profil odhad z OSM s poznámkou „technická mapa neodpověděla“. Výpadek linií
  (koleje, ploty, svahy), parkování a otevřených dat Prahy aplikace také řekne („Chybí data parkovacích stání
  (server neodpověděl)“, `sources.js` `outage`), jinak by ulice vypadala jako bez tramvaje nebo bez aut.
  Testy: `tests/vypadky.test.js`; týdenní kontrola živých služeb viz Publikace.
- Pardubice (`towns/pardubice.js`) nemají vlastní služby, mají jen vlastní ilustrace. Kontrola 49 řezů:
  `evaluation/pardubice/ZPRAVA.md`.

- **Ulice jen z čar** (Bára 12. 11. 2026, obecný postup): kde pod středem řezu technická mapa nemá plochu, ale okolo jsou
  čáry (Středočeský kraj dodává do DMVS jen linie; Kolín a Mladá Boleslav mají plochy okolo, ale ulici jen čarami),
  `dmvs.js` `fromLines` rozdělí obrázek čar (a hotových ploch) na kusy: ten pod středem řezu (osa OSM) je vozovka, kusy
  mezi dvěma hranicemi dopravní plochy směrem ven (do 4,5 m) chodník nebo krajnice. Čáry to nerozliší, takže rozhodne
  `derive.js` `linePieces`: chodník podle OSM `sidewalk`, bez tagu v zástavbě (budova do 30 m, rychlost do 50), a to jen
  kus nejblíž vozovce; ostatní zeleň. Za první jinou čarou (plot, budova) doplní RÚIAN. Druh čáry se ptá GetFeatureInfo
  (po třech na stranu, další jen když jsou všechny tři hranicí dopravní plochy, nejvýš 6). Kus uzavře i hotová plocha
  technické mapy za ním (cesta mezi krajnicí a polem, Mladá Boleslav, Revoluční); zelený pruh profil neukončí, když za ním
  je chodník nebo stezka; za dlažbu se bere šedý kus světlejší než 100 a hladký (rozptyl jasu pod 35), ne hluboký ani
  skvrnitý stín stromů. Šířky jsou z technické mapy, druhy odhad; aplikace to řekne. Když se vozovka nenajde, hlásí
  „technická mapa tu má jen čáry“ místo „mimo technickou mapu“.
  Kontrola 50 řezů (Kolín, Mladá Boleslav, `CITY=kolin OUT=results-linie2 node evaluation/run_brno.mjs 1 25`): změřená
  vozovka u 25 místo 8, šířky vozovek sedí na asfalt; zbylé jsou silnice, které technická mapa nemá vůbec (čáry jen jinde).
  Druh kusů u vozovky rozhodne nejdřív barva ortofota (to samé, co se při kliknutí stahuje kvůli pruhům, `lanes-ortho.js`
  si drží i zelenost a žlutost pixelů; `derive.js` `surfaceLook`, průměr kusu ±8 m podél ulice): zelený nebo žlutý
  (suchá tráva na letních snímcích ČÚZK) je zeleň, šedý chodník (kde ho strana má) nebo zpevněná plocha; nejasná barva
  (červená dlažba, stín, směs) nechá pravidlo nejbližšího kusu. Na 50 řezech se tím opravil zelený pruh před chodníkem
  (Mladá Boleslav 17, 20); stín stromů na krajnici se ale čte jako dlažba (Kolín 22). Hodnocení v Node bere ortofoto jako
  PNG (`laneImage` `decode`), aplikace dál JPEG.

### Zkoušené a nepřipojené zdroje

- Pasport komunikací Hradce Králové (T-MAPY WFS `geoportal.mmhk.cz/services/mapserver/common/pakom/gservice`,
  vrstva `pk-pov-typ`): skoro stejné plochy jako DTM ČÚZK (95 řezů: lepší 4, horší 3, stejně 7, obě špatně 2),
  bez CORS; varianta `evaluation/variants/hradec-pasport.mjs`.
- **České Budějovice** nezveřejňují plochy ulic; na ArcGIS Online města (`services9.arcgis.com/8svDug0pVvBQzXWS`)
  jsou jen osy pasportu a chodníků bez šířek, trávníky, lavičky a úseky placeného stání (čáry bez způsobu stání).
  DTM kraje má stejné díry jako DMVS (22 ze 47 řezů bez ploch). A/B: `evaluation/budejovice/ZPRAVA.md`.
- Bez vlastního zdroje zůstávají Olomouc, Zlín, Havířov, Třinec, Prostějov, Znojmo, Kroměříž (jen WMS nebo nic).
- Dopravní značení z pasportů T-MAPY (Děčín, Jablonec, Tábor) je příliš řídké.

## Test nového zdroje (A/B)

**Pravidlo: nový zdroj (nebo jiné použití starého) jde do aplikace, jen když nad ortofotem vyhraje.**

- Varianta je soubor `evaluation/variants/<název>.mjs`. Exportuje náhrady některých z pěti zdrojů
  `sources.js` (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`, se stejnými argumenty a odpověďmi) a krátký
  popis `about`. Co nenahradí, bere se z běžných zdrojů města. Varianta `city` je současný stav (bez souboru).
- `CITY=jihlava VARIANTS=city,moje-varianta node evaluation/ab.mjs [od] [do]` spočítá každý řez vzorku
  (`evaluation/<město>/data/samples.json`) jednou za každou variantu, na stejné čáře řezu. Víc variant
  (`city,x,y`) srovná první s každou další. `ONLY=9,10` jen vybrané řezy; `CACHE=disk` si odpovědi služeb uloží
  (`data/ab-cache`) a opakovaný běh se už služeb neptá. Dotazy na ČÚZK jdou ohleduplně přes `evaluation/polite.mjs`
  (jeden po druhém, 300 ms od sebe, pauza při 429 nebo 503).
- Výstup `evaluation/<město>/data/ab-<a>-<b>/`: `<n>.json` (oba profily, čas, počet dotazů, míry: šířka celkem,
  vozovka, chodník, okraje, podíl „Neurčeno“, odhad z OSM), `png/<n>.svg.png` (lišící se řezy nad ortofotem,
  A nahoře, B dole) a `review.md` (řádek na každý lišící se řez: vozovka nebo chodník o víc než 0,5 m, jiný okraj).
- Do `review.md` se místo `?` doplní verdikt `a`, `b`, `obě` nebo `žádná`. Pak
  `… node evaluation/ab.mjs --summary` vypíše shodu, mediány rozdílů a součty verdiktů; `--render [n …]` znovu
  nakreslí obrázky.
- Příklad: pasport komunikací v Jihlavě, `evaluation/jihlava/PASPORT.md`.
- **Změna pravidla** (ne zdroje): varianta exportuje `deriveProfile` z kopie kódu před změnou
  (`cp -R pilot/public/*.js pilot/public/towns evaluation/<složka>/data/kod-0`, vzor `variants/pred-zakon.mjs`).
  `ITEMS=1` počítá i stání a předměty, `PARTS=1` i druhy částí (např. druh tramvaje) a šířky pruhů a krajnic.
  Příklad: `evaluation/pravidla-11-2026/ZPRAVA.md`.

## Jak se profil skládá

1. Najde se nejbližší ulice z OSM a řez se vede kolmo na její osu. Ulice pod mosty a podzemní cesty se ignorují.
2. Řez se rozdělí podle ploch technické mapy (silnice, chodník, cyklostezka, parkoviště, tramvajové těleso,
   zeleň, zahrady…). Profil končí u první budovy, u zahrady (ta se kreslí jako okraj mimo ulici),
   nebo 22 m od osy. Dům za výchozím dosahem, ke kterému vedou jen trávníky, cesty, vozovky a parkovací pruhy,
   profil k sobě protáhne (do 40 m); dvůr, zahrada, pole nebo neznámý úsek ho zastaví. Tažením konce řezu jde
   dosah na každé straně zvlášť zkrátit nebo prodloužit (3–67 m, data se čtou až do 70 m): zkrácená strana končí
   volným okrajem, prodloužená jde přes ploty, zahrady a trávníky k další budově nebo k taženému konci.
3. Vozovka se podle tagů OSM rozdělí na parkovací pruhy, cyklopruhy a jízdní pruhy:
   `cycleway:*=lane` → cyklopruh 1,5 m, `soft_lane` → ochranný pruh 1,5 m, `shared_lane` → piktokoridor
   v krajním pruhu; cyklisté v protisměru (`oneway:bicycle=no` u jednosměrky, `opposite_lane`, `opposite`,
   `cycleway:*:oneway=-1`) dostanou opačný směr než auta a popisek „cyklisté v protisměru“;
   `parking:*=lane|street_side` → parkovací pruh (pokud tam už není parkoviště z technické mapy nebo plocha z OSM);
   `lanes:forward`/`lanes:backward` určí počty pruhů v každém směru a `turn:lanes(:forward|:backward)` řazení
   (vlevo, rovně, vpravo). Obousměrná ulice s jednou osou má polovinu pruhů každým směrem; místní obousměrka se
   dělí na dva pruhy od 5,0 m vozovky (2 × 2,5 m). Směr pruhů se bere z nejbližší osy OSM ve vozovce,
   takže sedí i na směrově rozdělených silnicích. Kde vozovkou vedou koleje, vznikne kolem každé osy koleje pruh
   s tramvají a vedle něj jízdní pruhy pro auta.

   **Tři druhy tramvaje** (A/B v `evaluation/pravidla-11-2026/ZPRAVA.md`):
   - *Tramvaj v pruhu* (`tramvaj_v_pruhu`): koleje ve vozovce (`embedded_rails=tram`) a auta jezdí po nich, protože
     se vedle nevejdou všechny pruhy, které OSM počítá, nebo je OSM nepočítá.
   - *Tramvajový pruh* (`tramvaj_pruh`, vyhrazený ve vozovce): všechny pruhy z OSM (`lanes`, `lanes:forward`,
     `lanes:backward`) se vejdou vedle kolejí (Národní, Spálená), nebo koleje ve vozovce ulice s `embedded_rails`
     nemají auta vedle sebe. Kreslí se v úrovni vozovky se širokou čarou u pruhů pro auta.
   - *Tramvajové těleso* (`tramvaj`, samostatné): MTVU 705 a obdobné plochy měst, koleje v zeleni (tráva) a koleje
     ve vozovce bez aut vedle, když ulice nemá `embedded_rails` (Patočkova). Kreslí se zvýšené mezi obrubami.
     Povrch (`bed`) podle `surface` tramvajové trati v OSM; jinak tráva, kde je na malém výřezu ortofota ČÚZK
     zeleno (`ortho.js`, jen pro řez s kolejemi, souběžně s ostatními dotazy), a jinak podle pravidel jako odhad:
     asfalt, kde jezdí autobusy, štěrk u okraje ulice nebo mezi vozovkami od 6 m, panely jinde a v pěší zóně.
   - Tramvajová trať s `psv` nebo `bus` = `yes`/`designated` (nebo `highway=busway`) dává části vlastnost
     `withBus` („+ BUS“). Do Streetmixu jdou všechny tři druhy jako streetcar.

4. Chodník (MTVU 702) s osou OSM, po které smějí kola: `segregated=yes` → oddělená stezka C 10 (chodník a
   cyklostezka, každý na polovinu, kola blíž vozovce), `bicycle=designated` (nebo `segregated=no`) → společná
   stezka pro chodce a cyklisty C 9, `bicycle=yes` → chodník s vjezdem cyklistů. Bez vlastní osy rozhoduje
   tag ulice `sidewalk:<strana>:bicycle`. Do Streetmixu jde C 9 jako cyklopruh v úrovni chodníku, chodník s koly
   jako chodník.

   Cyklostezka (MTVU 703) dostane směr z cyklostezky v OSM, která jí vede: jednosměrná jede se svou osou,
   obousměrná se rozdělí na dvě poloviny. Úzký vyvýšený zpevněný pás (do 6 m) mezi dvěma vozovkami
   se označí jako dělicí pás / ostrůvek.

5. Pruh je široký nejvýš 4 m (dálnice a silnice pro motorová vozidla 3,75 m, místní ulice 4,5 m; v Praze MK I
   a dálnice podle zatřídění TSK 3,75 m, i když je OSM má za primary nebo residential). Zbytek vozovky
   od 1 m se nakreslí jako **krajnice / šrafy** a označí jako odhad: technická mapa neobsahuje
   vodorovné značení. Vozovka směrově rozdělené silnice má krajnici jen u vnějšího okraje, ostatní vozovky
   (i jednosměrky ve městě) u obou obrub.
6. **Odhadnuté podélné stání** 2 m podle § 25 zák. 361/2000 Sb.: při stání musí zůstat volný jízdní pruh aspoň
   3 m pro každý směr jízdy. Obousměrka ho dostane od 8 m vozovky na jedné straně a od 10 m na obou, jednosměrka
   od 5 m a od 7 m; pruhy vedle zůstanou široké aspoň 3 m (tolik, kolik jich OSM počítá). U tramvaje zůstane mezi
   autem a kolejnicí 3,5 m (§ 25 odst. 2). U obruby ke střednímu pásu, tramvajovému tělesu, zeleni do 15 m před
   další vozovkou nebo k další vozovce se neodhaduje. Mimo zástavbu bez chodníku také ne: u obruby není chodník
   (plocha chodníku nebo stezky za ní, i za zelení do 10 m, tag OSM `sidewalk` nebo pěší cesta OSM podél ulice
   do 12 m) a na té straně není dům (OSM ani plochy města) do 40 m od obruby a ±40 m podél ulice. Ve vesnici
   a v úzkých uličkách se domy najdou, odhad tam zůstává.
   Platí v ulicích residential a unclassified (na hlavních ulicích ne; v Praze ani v MK I a II podle TSK), jen mimo
   zóny placeného stání: do 100 m od řezu nesmí být žádná zóna TSK (vrstva „Zóny placeného stání vymezené
   tarifem“). Hranice zón se stahují jednou skriptem `node tools/build_zps.mjs` do `pilot/data/zps.json` (na webu
   při nasazení), takže se kvůli nim IPR při kliknutí neptá. Bez souboru rozhodují úseky TSK kolem řezu. Odhad se
   nepřidá, kde je stání z dat města nebo z OSM nebo kde ho tag zakazuje.
7. Obytné a pěší zóny (`living_street`, `pedestrian`) mají vozovku jako jeden pruh bez ohledu na počet pruhů v OSM
   a bez krajnice (Streetmix sdílený prostor nezná). Odhad stání v obytné zóně není (§ 39: stání jen na
   vyznačených místech), stání z OSM nebo z dat města zůstává. V zóně uzavřené autům, kudy jezdí MHD, nese pruh
   autobus nebo pod trolejí trolejbus.
8. Svodidlo z technické mapy s osou silnice na obou stranách rozdělí plochu vozovky a vznikne **dělicí pás** 0,6 m.
   U ulice ze dvou jednosměrných os se stejným jménem (protisměrných) se střed řezu posune doprostřed mezi ně
   (třeba na tramvajový pás), dosah se měří odtud a zeleň mezi vozovkami profil neukončí.
9. Klik do mapy posune řez po ulici aspoň 15 m od křižovatky, 12 m od kruhového objezdu a obratiště a 6 m od
   přechodu (tažený řez zůstane, kam ho dáte).
10. Kde technická mapa pod osou ulice nemá zpevněnou plochu (pole, louka, zeleň, díra v mapě), profil je odhad
    z OSM a aplikace to napíše. Parkoviště MTVU (704) široké aspoň 8 m profil ukončí jako okraj „parkoviště“.
    Úsek useknutý dosahem se celý ponechá nebo vynechá, když by z něj zbylo méně než 1,5 m.
    Plot nebo zeď (technická mapa: ploty a zdi nad 0,3 m; OSM: fence, wall, hedge) za krajní vozovkou
    profil ukončí jako okraj „plot“; plot do 1 m od fasády budovy ale okrajem zůstává budova.
11. **Pruhy z ortofota** (`public/lanes-ortho.js`, vyhodnocení `evaluation/ortofoto/ZPRAVA.md`): při kliknutí se
    souběžně stáhne výřez ortofota ±25 m kolem středu řezu (zarovnaný na pixely zdroje, takže tažení konců řezu
    výsledek nemění): Praha IPR 10 cm, Brno 2025 (posun 1,06 m na východ a 3,09 m na sever), Plzeň 2024, jinde ČÚZK
    12,5 cm. Na každé vozovce technické mapy se najdou čáry podél ulice (jeden směr a oblouk na vozovku, plné
    a přerušované podle mezer) a vybere se sada, jejíž mezery vypadají jako pruhy (2,5–4,75 m). Podle nich se
    přeměří pruhy a krajnice (zdroj „podle čar na ortofotu“, v legendě oranžovohnědá):
    - plná vodicí čára u obruby dělá krajnici i úzkou (od 10 cm; Bára 12. 11. 2026), za plnou čarou je krajnice
      i do šířky pruhu, kde ji měla pravidla; za přerušovanou čarou je pruh (úzký kus se přidá k pruhu: přidávání
      pruhu);
    - pás mezi dvěma plnými čarami s pruhy po obou stranách je středová krajnice (zpevněný střední pás);
    - na ČÚZK dělá čára krajnici jen u obou obrub zároveň (u jedné bývá obrubou nebo ojetým asfaltem); na
      městských ortofotech se zahodí čára o 45 % slabší než nejsilnější (ojetý asfalt mezi stopami kol);
    - přerušovaná čára skoro zakrytá autem se vezme, kde bez ní pruhy nevycházejí;
    - pás u obruby 1,6–2,8 m, jiný a nerovnoměrný proti hladkému asfaltu (dlažba stání), je podélné stání.
    Co nevychází (pruh pod 2,3 m nebo nad 5 m), nechá profil podle pravidel. `?orto=0` ukáže profil bez ortofota.
11a. **Bez technické mapy: ortofoto a OSM** (`public/ortho-osm.js`, Bára 15. 11. 2026, vyhodnocení
    `evaluation/ortofoto-osm/ZPRAVA.md`). Když technická mapa neodpoví, nic nevrátí nebo nemá u osy povrch ulice,
    profil se místo odhadu jen z OSM poskládá z ploch, které se vyrobí z ortofota (stejný výřez jako u bodu 11)
    a OSM:
    - **vozovka:** obruby jsou hrany jasu nebo zeleně, které drží podél ulice (v kusech po 5 m na ±20 m). Mezi
      kandidáty se vybírá podle asfaltu mezi osou a hranou a podle toho, kde obrubu čeká OSM: `width`, jinak
      `lanes` × 3,5 / 3,25 / 3,0 / 2,75 m podle třídy, plus stání (`parking:*`), cyklopruhy a koleje OSM ve
      vozovce. Místo 0,4 m za plnou čarou je taky kandidát. Kde hrana není, platí šířka podle OSM;
    - **domy:** budovy OSM (čtené i ±1 a ±2 m podél ulice; dům jen vedle řezu se dokreslí přes řez). Mají přednost
      před zelenými plochami OSM (trávník, park, les), ty před chodníky; voda, zahrádky a hřbitovy profil ukončí.
      Ulice na mostě (`bridge` a úroveň nad zemí) leží nad vodou a zelení OSM: ty se pod ní neberou a ulice končí
      za krajním chodníkem jako u map povrchů (`evaluation/bridge-water/`, `?off=mostvoda` jako dřív).
      **Chodník** vede od obruby k domu, nejvýš 6 m. Zbytek, a s `sidewalk=no` celý prostor, je zeleň, kde je
      ortofoto převážně zelené (podíl ≥ 0,1), jinak plocha do 12 m, jinak tam profil končí. Bez domu je chodník jen
      podle OSM (`sidewalk*`, šířka `sidewalk:width` nebo 2,5 m) a za ním profil končí;
    - **domy z RÚIAN** (Česko, `countries/CZ.js estimateBuildings`, Bára 23. 11. 2026: „RÚIAN by měl mít nejlepší
      data“): budovy odhadu jsou z RÚIAN, z OSM jen tam, kde RÚIAN žádnou nemá (`gis.js withBuildings`; `?off=ruiandomy`).
      Regrese proti MTVU (`RUIAN=first node evaluation/ortofoto-osm/regrese.mjs`): víc metrů správného složení ve všech
      čtyřech (Praha +13 a +12 m, Brno +2 a +18 m), chodník po metrech −1 p. b. Domy z RÚIAN sedí na fasádu MTVU (do
      0,25 m); horší strany kreslí chodník až k domu přes zeleň, stání nebo za špatnou obrubou (řezy 8, 74, 86, 87).
      Pole a les mapy (100, 200) pod odhadem jdou za něj: mapa, která na místě nové zástavby kreslí pole, ještě není
      překreslená (Devětsilová; `?off=staramapa`);
    - **samostatný chodník OSM** (`footway=sidewalk`) za obrubou a před domem je chodník i přes trávník ZBGIS nebo
      zeleň OSM (Bára 16. 11. 2026, Štúrova v Nitře): mezi čarami mapy města do 3 m od něj, ven k domu do 4 m, jinak
      2 m kolem jeho čáry. `?off=osmwalk` vypne;
    - kde technická mapa má plochy, jen ne u osy, omezí obruby její chodníky a domy; obruby se nehledají u okraje
      pokrytí snímku a koruny nad osou nechají obruby podle OSM;
    - všechno kromě domů je „odhad“ a hláška dodá „Obruby jsou odhadnuté z ortofota a domy z RÚIAN, šířky ověřte.“
      Zdroj domů je ten, ze kterého jsou fasády na koncích řezu (`ortho-osm.js houseSources`, prvek s `from`: RÚIAN
      z `gis.js ruianOutlines`, GRPK z `towns/lithuania.js`), jinak OSM; dva zdroje spojí `Intl.ListFormat` jazyka
      stránky („z RÚIAN a OSM“), jména se nesklánějí (26. 11. 2026).
      Přesnost proti MTVU (jednoduché řezy Prahy a Brna): obruba do 0,5 m u 39–50 % stran, do 1 m u 57–69 %. Samotné
      OSM má 26–34 % a 51–58 %. Ve vsích a v cizině bude nejspíš horší.
11b. **Obruby vozovky z AI** (zapnuté od 19. 11. 2026, `?ai=0` vypne; Bára 18. 11. 2026, `public/ai-kerbs.js`, pilot a měření
    `evaluation/ai-segmentation/`). Jen v odhadu z bodu 11a a jen obě obruby vozovky u osy: čtverec ortofota 83,2 m
    kolem řezu (416 px po 20 cm, sever nahoře, stejný zdroj jako u bodu 11) a osm vrstev OSM na něm (ulice, šířka
    ulice podle OSM, pěší cesty, cyklostezky, koleje, budovy, zeleň, parkoviště) dostane model, který každý pixel
    zařadí do pěti druhů (vozovka, chodník, zeleň, budova, ostatní). Napříč řezem po 20 cm rozhoduje většina tří
    čar 3 m od sebe, vozovka je úsek nejblíž osy (mezery do 0,6 m přemostí, do 4 m od osy), uvnitř mezí z OSM.
    Chodníky, zeleň, stání a domy zůstávají z bodu 11a. Model (int8, 4,7 MB, zabalený asi 4,2 MB) a onnxruntime-web
    (11 MB, zabalený asi 2,9 MB) se stáhnou až při prvním řezu s odhadem; řez pak trvá asi 0,6–0,8 s. V cílovém území
    (pasporty Bratislavy, Prešova, Žiliny a Cáchy): obruby do 0,5 m 42 % proti 26 %, do 1 m 63 % proti 49 % (lépe 22,
    hůř 14 ze 43 řezů); Brno do 1 m 74 % proti 62 %. Obě sady posloužily i při výběru modelu (validační, ne nezávislý
    test; `evaluation/ai-segmentation/MESTA.md`). Kredit: mapy povrchů, na kterých se model učil (credits.js aiKerbs).
    Odkazy na proklikání `evaluation/ai-segmentation/ODKAZY.md`.
12. Konec A je vždy západní, B východní; tlačítko **⇄ Otočit** je prohodí (zrcadlí stav, návrh i opravy, domy si
    nechají barvy).
13. Trakční sloup dál než 4 m od kolejí (mezi nimi pruhy pro auta, 17. listopadu) nemá výložník, ale drží vodorovné
    příčné lano nad koleje (`spanPlan` v `profile.js`, věšák s trolejí nad každou kolejí pod lanem): na druhé straně ke
    sloupu za kolejemi (před další řadou kolejí; ten pak také nemá výložník), jinak k domu na kraji, sahá-li fasáda
    do výšky lana (růžice), jinak lano končí u kraje kolejí. Na každé straně řady kolejí drží lano jen sloup nejbližší
    kolejím, další stojí bez výložníku. Koleje se sloupy mezi sebou (Olšanská) lano nemají. Řídí se sloupy a okraji
    profilu, takže v Návrhu ho změní přidání či smazání sloupu nebo jiný okraj (Bára 13. 11. 2026).
14. Lokální server neukládá do cache chybové odpovědi IPR a dotazy na IPR vzdá po 20 s; server IPR často vrací
    503, aplikace dotaz opakuje.

## Stav, Návrh a úpravy

Stav je jen k prohlížení; kliknutí na část řekne, co to je a odkud pochází. Data se opravují po tlačítku
**Opravit data**. Návrh je editovatelný vždy. Úpravy drží šířku ulice: **Sloučit s levou / s pravou** dá šířku
části sousedovi, po smazání se vybere soused. Hlídá se šířka ulice: v Návrhu proti stavu, při opravě dat proti
šířce změřené před opravou. Když ji profil překročí nebo nevyplní, objeví se upozornění a tlačítko Dorovnat (rozdíl
dostane vybraná, jinak nejširší část); když sedí, nic se neukazuje.

Rozhraní po kritice Fable (12. 11. 2026), aby nepřibývalo do jednoho sloupce: karta vybrané části má v hlavičce
←, →, Rozdělit, Smazat; pod ní typ, šířku a jednu volbu podle typu (směr, způsob stání, povrch tělesa), řádek prvků
a značek (název značky před číslem) a sbalené **Další volby** (cyklisté, troleje, účel a poloha stání, povrch, co je
pod povrchem, autobusy na kolejích, šipky, sloučení; na sbalené liště je vidět, co je v nich nastavené). U částí
s odborným názvem (průleh, piktokoridor…) je věta, co to je. Paleta dílů je za tlačítkem **+ Přidat díl**. Bez výběru
je místo panelu okrajů jen řádek nápovědy. Legenda zdrojů jen ve Stavu, štítek režimu vedle názvu ulice není,
nápověda k tažení řezu zmizí po prvním tažení. V hlavičce **Sdílet** a jedno menu **Soubor** (PNG, SVG, JSON,
kopírovat a vložit polohu řezu, nahlásit chybu, místní ilustrace). Patička se zdroji je jeden řádek, celá po
rozbalení. Podíl prostoru ukazuje v Porovnání předchozí podíl („bylo 28 %“) místo procentních bodů. Přepnutí jazyka
zachová režim.

Šířky částí se porovnávají s Manuálem tvorby veřejných prostranství IPR, kap. C.2 (`public/rules.js`): červeně pod
minimem (chodník 1,5 m, pruh 2,5 m, cyklopruh 1,5 / 1,75 / 2 m podle stání vedle, ochranný cyklopruh 1,25 m,
podélné stání 2 m, kolmé 4,5 m, dvoukolejný tramvajový pás 6,5 m…), oranžově pod základní šířkou (chodník 2 m,
pruh 3 m, ochranný cyklopruh 1,5 m, kolmé stání 5 m, tramvajový pás bez sloupů 7 m, se sloupy 8 m…). Kliknutím na
upozornění se část vybere. Tramvajový pás je vyhrazený tramvajový pruh i samostatné těleso, ne tramvaj v pruhu
s auty.

Šikmé stání se posuzuje jako kolmé (Manuál C.2: hloubka podle úhlu; stání 2,5 × 5 m pod 45° je hluboké asi 5,3 m,
pod 30° 4,7 m), v Návrhu začíná na 5 m; tramvajová kolej v Návrhu na 3,5 m (pás 7 m). Jen oranžově (Bára 11. 11. 2026):
cyklostezka pod 2,5 m, nástupiště pod 2 m (světlá šířka zastávky), řadicí pruh (se šipkami) pod 2,5 m místo
běžného pruhu.

Jednosměrka s cyklisty v protisměru (značka IP 4c pod pruhem) bez vlastního cyklopruhu: vozovka, tedy pruhy
s krajnicí a šrafami bez stání, červeně pod 3 m, oranžově pod 4 m (Manuál C.2: základ 4 m, při velmi nízké
intenzitě 3 m, při vyšší až 4,5 m; Bára 11. 11. 2026). Nahrazuje varování jednotlivých pruhů.

Jízdní pruh v Praze podle zatřídění TSK (skupina ČSN 73 6110; MK I a II jsou podle zák. 13/1997 Sb. sběrné
nebo rychlostní, TSK to nerozlišuje, proto skupina B): dálnice červeně pod 3 m, oranžově pod 3,5 m; MK I, MK II
a silnice I. a II. třídy červeně pod 3 m; MK III a silnice III. třídy červeně pod 2,75 m, oranžově pod 3 m;
MK IV červeně pod 2,5 m, oranžově pod 2,75 m. Bez zatřídění (ostatní města) 2,5 / 3 m. Pruh přidaný v Návrhu
převezme třídu ostatních pruhů ulice.

Prvky v Návrhu (Magdalena a Bára, 13. 11. 2026):
- lampa jde nastavit na výšku 4, 5, 6, 8 nebo 10 m: do 5 m parková lampa se svítidlem na sloupku, od 6 m lampa města
  s kratším či delším stožárem (výložník, svítidlo a patka ve skutečné velikosti); bez nastavení obrázek města
  (svítidlo v Praze asi 8,75 m, v Brně 7,4 m);
- stojan na kola jde otočit podél ulice (kolo zepředu, trubka stojanu vedle); obojí u štítku prvku v kartě části,
  štítky v pořadí, v jakém prvky stojí;
- stojany, lavičky, květináče a sloupky téže části se po přidání, smazání, otočení či změně šířky části srovnají
  vedle sebe podle své šířky (stojan podél ulice 0,8 m, napříč 1,9 m, lavička 2,2 m…) kolem místa, kde byly; když se
  nevejdou, blíž k sobě (Bára: tři stojany přes sebe);
- nová lampa nebo trakční sloup stojí 0,6 m od obruby na straně nejbližší vozovky (i přes části mezi nimi; Bára:
  lampy stojí u silnice), druhá u protější hrany části, další uprostřed; bez vozovky vedle a mezi dvěma vozovkami
  první uprostřed.

Pod profilem je pruh **podílu šířky ulice** (chůze, kola, MHD, jedoucí auta, parkování, zeleň, ostatní; sdílené
části napůl), v Porovnání se změnou. Pod ním **povrch ulice** (`shares.js surfaces`, Magdalena): propustný (zeleň,
průleh, povrchová rýha, travnaté a štěrkové těleso, nezpevněný povrch), částečně propustný (propustná dlažba; v popisku
části „propustná dlažba“), nepropustný, vodní plocha (i retenční nádrž: zadržuje, nevsakuje) a ostatní (zeď, Neurčeno); co je pod povrchem se
nepočítá, skupina bez plochy se neukazuje, v Porovnání „bylo X %“. Nezpevněný může být i chodník, plocha, parkování,
cyklostezka, krajnice, přístupová cesta a dělicí pás. Návrh (i ručně opravený stav) jde **sdílet odkazem** (je zabalený v adrese za
řezem), uložit do souboru JSON a zase načíst. U řezu je **panorama z ulice** Mapy.com (s klíčem v dialogu, bez
něj odkaz na Mapy.com).

### Hospodaření s vodou

Do Návrhu lze přidat prvky modrozelené infrastruktury podle pražských Standardů hospodaření se srážkovými vodami
(MHMP, ČVUT FSv, kap. 5.1; podnět Magdaleny, Bára 12. 11. 2026). Data je neznají, takže jsou jen v návrhu:
- části v paletě „Hospodaření s vodou“: vsakovací průleh (5.1.5), vsakovací rýha (5.1.6), retenční nádrž (5.1.10);
- „Pod povrchem“ u zeleně, chodníků, parkování a dalších částí: podzemní rýha (5.1.7), podzemní retenční nádrž (5.1.11),
  vsakovací šachta (5.1.9); průleh s rýhou pod sebou je 5.1.8;
- „Propustný povrch“ u chodníků, ploch a parkování (5.1.2) a přístřešek zastávky se zelenou střechou (5.1.1).
Ze všeho jen povrch umí i Stav: zatravňovací dlažba z OSM (`surface=grass_paver`, v Česku asi 300 parkovišť a 900 cest)
je propustná dlažba, nezpevněný povrch (`unpaved, compacted, fine_gravel, gravel, ground, dirt, earth, woodchips…`;
Bára: mlatové cyklostezky a pěšiny také vsakují) zvlášť „nezpevněný“ (`segment.permeable` `true` / `"nezpevneny"`);
`derive.js` podle plochy pod středem části nebo cesty, která ji kříží. V editoru výběr „Povrch“. Průlehy, rýhy ani šachty v datech
nejsou (OSM 0, otevřená data měst nic; Brno má jen body dotovaných zelených střech a dešťovek, Bára: nevyužívat),
retenční nádrže zůstávají vodou.
Kreslí se zjednodušeně (Magdalena: kvůli měřítku zjednodušit): průleh jako mělká prohlubeň s výsadbou, nádrž s vodou
a rákosem; podzemní objekty ve skutečné velikosti a hloubce, ve stejném měřítku a od stejné nuly jako sítě pod zemí
(Bára 12. 11. 2026), i bez sítí se pod ulicí ukáže zemina s metry. Rozměr se nastaví v „Další volby“ (šířka, od hloubky,
výška; `segment.underSize`), výchozí je odhad: rýha 1,5 m široká v hloubce 0,4–1,4 m (příklad ve Standardech má rýhu
1,5 m s nadržením 0,5 m), nádrž přes šířku části bez 0,3 m z každé strany v hloubce 0,8–2,3 m, šachta 1 m v hloubce
0,5–3 m; Standardy rozměry neurčují, dává je výpočet. Se zapnutými sítěmi Návrh upozorní, když objekt narazí na síť
(červeně, překryv s kreslenou sítí) nebo je k ní blíž než 0,5 m (oranžově; Bára 12. 11. 2026: varovat i při blízkosti;
Standardy kap. 6.2.9 jen žádají střety se sítěmi a ochrannými pásmy prověřit, odstupy nedávají, 0,5 m je hranice
upozornění, ne ochranné pásmo), sítě se kreslí přes objekty, aby byl střet vidět. Stejně se hlídají nové stromy
z Návrhu (strom v části i stromořadí, kde Stav do 1 m strom nemá; Bára 13. 11. 2026) podle Pražských stavebních
předpisů (souhrnné znění IPR 2025/01, příloha č. 1, bod I, minimální vzdálenost podzemní sítě od paty kmene, měřeno
napříč ulicí k okraji sítě): vodovod 2,5 m (1,0 m s technickým opatřením), kanalizace 2,5 m, stoka do DN 500 1,5 m
(blíž s kořenovou bariérou, hlubší než 6 m nevadí), plynovod NTL a STL 1 m, VTL 4 m, teplovod 2,5 m (oboje bez
opatření), silnoproud do 22 kV, veřejné osvětlení a elektronické komunikace 1,0 m (0,5 m), 110 kV 1,5 m (1,0 m),
kolektor s nadložím pod 5 m 3,0 m (1,5 m). Blíž než bez opatření oranžově (jen s kořenovou bariérou nebo chráničkou),
blíž i než s opatřením červeně. Produktovody a potrubní pošta v předpisech nejsou; nadzemní vedení („nadz.“) se
mezi sítě pod zemí neberou; kabel protikorozní ochrany plynovodu je kabel; síť v chráničce má opatření už v sobě;
stoka neznámého průměru bere 2,5 m; strom mezi dvěma stěnami „tělesa kolektoru“ stojí nad kolektorem; kolektor
neznámé hloubky nejvýš oranžově. Za stávající se strom bere podle polohy od A (do 1 m), takže strom posunutý
v Návrhu rozšířením sousední části o víc se hlásí jako nový.
Dále modré šipky ukazují přítok ze zpevněných ploch vedle; pod zelení, stromořadím, předzahrádkou a průlehem je ornice, pod travnatým tramvajovým tělesem ornice a štěrkové lože
s pražci, štěrkové těleso je štěrkové až dolů (Bára: žádný beton pod zelení); zatravňovací
dlažba jako pás betonových tvárnic s trávou mezi nimi (Bára: na první pohled něco mezi parkováním a trávníkem). Ilustrace (zelená střecha přístřešku, výsadba průlehu, rákos) kreslila
„kreslířka“ ve třech kolech s „kritikem“ podle fotek z Wikimedia Commons.

### Okraje ulice

Na dům, plot, zahradu či jiný okraj profilu jde kliknout jako na část (Bára 12. 11. 2026: „panelák“, který je dvoupatrový
městský dům, nebo zahrada). V Návrhu a po „Opravit data“ se dá změnit, co tam stojí (budova, drobná stavba, zahrada, park, voda,
parkoviště, plot, volný prostor), u budovy zvlášť vzhled domu (nebo odhad) a počet podlaží
(`edges.leftLevels`, nahradí podlaží i výšku z dat, jde i do sdíleného odkazu). Ve Stavu karta jen řekne, co tam je.

## Dopravní značky

Pod popisky částí je řádek dopravních značek podle vyhl. 294/2015 Sb. (`public/signs.js`, obrázky v `public/znacky/`,
licence v `znacky/README.md`), na obrazovce i v exportu, všechny v jednom měřítku jako na ulici. Značky vycházejí
z tagů OSM a z částí profilu: nejvyšší rychlost (i po pruzích), jednosměrka IP 4b / B 2 podle směru pohledu (i
s cyklisty v protisměru; po „Otočit“ se vymění), zóny (zóna 30, obytná, pěší, cyklistická), zákaz vjezdu B 1 a B 11
s dodatkovou tabulkou výjimky, B 8, B 30, dálnice a silnice pro motorová vozidla, stezky C 8a, C 9a, C 10a, parkoviště
IP 11 se způsobem stání (i na chodníku IP 11d–g), vyhrazené IP 12 a ZTP, zákaz stání B 29 a zastavení B 28, pruh
BUS IP 20a (i s cyklisty), směrové šipky V 9a z `turn:lanes`. Rychlost, jednosměrka a zóny stojí pod jízdními pruhy;
značka společná sousedním částem se kreslí jednou se závorkou; nejvýš 2 značky na část, co se nevejde, ukáže šedá
tečka. V Návrhu jdou značky měnit u každé části i přes celou vozovku. Značky se drží v odkazu, v souboru i po
„Otočit“.

## Mapa

Podkladové mapy **Mapa**, **Ortofoto**, **Technická mapa** a **OpenStreetMap**. Mapa je OSM s mapami měst (v Praze
rychlý rastr IPR z ArcGIS Online, v Brně MTVU města), ortofoto ČÚZK s ortofoty měst, technická mapa DMVS ČÚZK
s mapami měst; vrstvy měst se načítají a uvádějí jen na jejich území. Navrch jdou zapnout linie technické mapy,
plochy u řezu a další data řezu (`public/maplayers.js`): parkování z místních dat a z OSM, body (stromy, lampy,
sloupy…; v dosahu plné, mimo dosah prázdné), ploty, zdi a svahy, koleje, osy ulic, budovy na fasádách, dosah bodů.
Kreslí se jen to, co už kliknutí načetlo, nic se kvůli tomu znovu neptá. Vybraný podklad a vrstvy si prohlížeč
pamatuje.

**Hledání adres** (`public/search.js`): vyhledávací služba RÚIAN ČÚZK, návrhy od 3 znaků s prodlevou 300 ms; adresa
nebo ulice rovnou udělá řez na své ulici.

Barevný proužek pod každou částí ukazuje původ: zelená = změřeno z technické mapy, hnědá = doplněno z OSM,
modrá = otevřená data města, tyrkysová = parkování z dat města, šedá = odhad, oranžovohnědá = podle čar na ortofotu,
fialová = upraveno ručně. Vybraná část profilu se vyznačí modře na čáře řezu v mapě.

## Export do Streetmixu

Převod profilu na ulici Streetmixu (schéma 35, metrické jednotky) je v `public/streetmix.js` a má testy. Tlačítko
v aplikaci není: API Streetmixu nemá CORS, takže ze statického webu nefunguje.

## Jazyky

Aplikace mluví všemi 24 úředními jazyky EU (Bára 12. 11. 2026 čeština a angličtina, slovenština 15. 11., němčina
16. 11., ostatní 17. 11. 2026). Jazyk určí `?lang=fr` v adrese, jinak poslední volba návštěvníka (položka „Jazyk“ v menu
Soubor, pamatuje se v prohlížeči), jinak první z jazyků prohlížeče, který aplikace umí; ostatní dostanou angličtinu.
Přepnutí stránku znovu načte, řez i návrh zůstanou. Anglicky se aplikace jmenuje **Street Profile**, německy
**Straßenprofil**, slovensky **Profily ulíc**; ostatní názvy v `CLAUDE.md` (oddíl Jazyky).

Jazyk není stát (kódy ISO: jazyk `de`, stát `DE`): značky, normy, zdroje dat a ilustrace se řídí státem řezu
(`city.country`, CZ/SK/AT/DE), jazyk mění jen slova. Německé rozhraní na řezu v Praze ukazuje české značky s českými
čísly a česká pravidla, na řezu v Bratislavě slovenská, v Berlíně německé (StVO).

- `i18n.js`: `t("český text", { jméno })` vrátí text jazyka stránky, nebo český, když překlad chybí. Jazyků je 24
  (všechny úřední jazyky EU, `LANGS`, každý pojmenovaný sám sebou); načte se jen `<jazyk>.js` jazyka stránky (top-level
  await v `i18n.js`). Český text je klíč, `{jméno}` se doplní. `num()` píše desetinnou čárku, tečku jen anglicky, irsky
  a maltsky; `pct()` „44 %“ s mezerou, bez mezery („44%“) en, ga, mt, nl, pl, it, pt, ro, el, bg, hu, lv.
  `translatePage()` přeloží texty `index.html`; patička se nahrazuje celá (`data-i18n="footer"`, `EN_HTML`, `FR_HTML`…).
  `errors.js` (běží před moduly) má svých pár hlášek ve všech jazycích (tabulka `TEXTS`).
- Přepínač je poslední položka menu Soubor („Jazyk“, Bára 17. 11. 2026): seznam jazyků jejich vlastními jmény, bez
  vlajek (jazyk není stát). Jazyk se jinak řídí prohlížečem (první z `navigator.languages`, který aplikace umí, jinak
  angličtina); ruční volba se pamatuje v localStorage, `?lang=fr` platí dál.
- `<jazyk>.js` (`en.js`, `sk.js`, `de.js`, `fr.js`…; exporty `FR`, `FR_HTML`, `FR_CITY`, `FR_ATTRIBUTION`): texty
  jazyka, texty měst (server, data, kredity) a slova v kreditech mapových vrstev. Texty měst jsou ve tvarech, jak je
  věty potřebují (v `de.js` server a data v genitivu: „Der Server der Stadt Brno…“, „nach den Daten der Stadt Brno und
  von OSM“; jazyky se skloňováním mají v `own()` pomocné tvary). Německé názvosloví: Bestand / Planung / Vergleich,
  Gehweg, Fahrstreifen, Radfahrstreifen, Schutzstreifen, Parkstreifen, Fahrbahn, Bordstein, Querschnitt; vyká
  („Sie“); český kraj je „Region“, okres „Bezirk“.
- Kromě češtiny, slovenštiny, angličtiny a němčiny jsou překlady strojové (17. 11. 2026, agent na jazyk z češtiny,
  pak kritik Fable jako rodilý mluvčí); měl by je projít rodilý mluvčí. Nejisté bývá: ochranný cyklopruh (většina
  zemí ho nemá), sdílená zóna, hospodaření s vodou.
- Nový text v kódu: obalit `t("…")` (v `app.js`, `profile.js` a `maplayers.js` se funkce jmenuje `tr`) a doplnit
  do všech 23 souborů jazyků. `tests/i18n.test.js` hlídá, že každý text má překlad se stejnými `{jmény}`, že
  překlady nemají nic navíc, že každé město má texty a že žádný modul kromě `i18n.js` nerozhoduje podle jazyka;
  `tests/i18n-en.test.js` a `tests/i18n-de.test.js` pouštějí moduly anglicky a německy.
- Česky zůstávají vlastní jména (ČÚZK, RÚIAN, IPR, úřady měst, kraje), čísla značek a text na dodatkové tabulce E 13
  (je to česká značka), hodnoty v záznamu řezů a hlášení chyb.

## Záznam řezů

Po každém řezu a u několika akcí (export, uložení, sdílení, Návrh, Porovnání, oprava dat, hledání) pošle
`public/log.js` krátkou zprávu přes `navigator.sendBeacon` do Cloudflare Workeru s databází D1 (`logging/`, návod
v `logging/README.md`). Řez se ukládá přesně (střed, azimut, dosah, město, ulice, typ ulice, čas), bez IP adres
a cookies. Dál úpravy (jak návštěvník opravil data a co navrhl, zkrácené profily) a hlášení chyb: tlačítko
„Nahlásit chybu“ ve Stavu a v menu Soubor pošle kategorie, text návštěvníka, řez a profil a počká na odpověď
Workeru (při chybě text v okně zůstane). Adresa Workeru je v proměnné repozitáře `LOG_URL`; bez ní (i lokálně) se
nic neposílá a tlačítko hlášení se neukáže. Krátké upozornění je v patičce aplikace.

## Publikace na GitHub Pages

Aplikace umí běžet i bez serveru: v `public/config.js` je `STATIC = false` (data přes lokální server s cache)
a při nasazení se přepíše na `true`. Prohlížeč se pak ptá služeb IPR, měst, krajů a ČÚZK přímo (povolují CORS)
a dlaždice OSM a ostatní statická data čte jako soubory pod `data/`. Písmo Inter a Leaflet leží na webu
(`public/fonts/`, `public/leaflet/`), žádné Google Fonts ani unpkg. Bez serverové cache trvá každé načtení řezu
podle IPR 1–10 s.

Nasazení dělá `.github/workflows/pages.yml`: při každém pushi do `main`, ručně a každé pondělí. Nejdřív `npm test`,
pak vyrobí dlaždice OSM celé ČR z výřezu Geofabrik (týdenní kopie v cache Actions), hranice ZPS, dlaždice vývoje
zástavby, otevřená data Prahy, parkování v Brně a zóny v Plzni (při výpadku zdroje se použije soubor z minulého
nasazení), doplní klíč Mapy.com (`MAPY_KEY`, tajná proměnná) a `LOG_URL`, přidá přesměrování starých stránek měst
a vystaví vše na GitHub Pages. Dlaždice se do repozitáře neukládají. Jsou to data odvozená z OpenStreetMap, takže
na webu leží pod ODbL 1.0 (viz `data/README.txt` na webu a patičku aplikace).

### Kontrola zdrojů dat

Každé pondělí ráno (po nasazení) a ručně běží `.github/workflows/zdroje.yml`: `node tools/check_sources.mjs` udělá
v každém městě jeden řez v jeho ukázkovém bodě (`example` v `city.js`) stejnými moduly jako zveřejněná aplikace
(`STATIC = true`, dlaždice OSM a soubory `data/` z webu) a stáhne po jednom obrázku podkladových map. Vypíše
tabulku zdroj × stav: `ok`, `prázdné`, `náhrada ČÚZK` (služba města nic nevrátila, plochy jsou z technické mapy
ČÚZK), `tichá chyba` (dotaz selhal, ale zdroj pokračoval bez něj, takže by si toho návštěvník nevšiml),
`varování` (jen neúplný řetězec certifikátů serveru; prohlížeče si poradí) a `CHYBA`. Chyba, tichá chyba nebo
prázdné plochy či OSM běh shodí a GitHub pošle e-mail; tabulka je v souhrnu běhu. Je to asi sto malých dotazů
týdně, město po městě. Lokálně proti místnímu serveru: `SITE=http://localhost:5173/ node tools/check_sources.mjs`,
jen některá města: `node tools/check_sources.mjs praha brno podklad`. Mezilehlé certifikáty, které některé
servery neposílají (Frýdek-Místek), jsou v `tools/ca/`.
Plochy jsou povinné jen tam, kde je mapa povrchů (`SURFACE_MAPS` modulů, bod v ulici pro každou v `tools/check_sources_lib.mjs`
`POINTS`). Co selže, zkusí se po pauze znovu; jen pomalá služba (dvakrát vypršela) je varování, když povinné dotazy státu prošly.

## Licence a uvedení zdrojů

- Kód: MIT, © 2026 Bára Soukupová (`LICENSE` v kořeni repozitáře).
- Ilustrace: © Streetmix, CC BY-SA 4.0 (`public/streetmix/LICENSE`). Upravené ilustrace musí zůstat pod stejnou
  licencí. Ilustrace měst (`public/praha/`, `public/brno/`…): MIT jako kód. Dopravní značky: úřední díla.
- Technická mapa a MTVU: © IPR Praha; otevřená data IPR a Geoportálu Praha pod CC BY 4.0. Technické mapy měst
  a krajů a IS DMVS: veřejně přístupná data, čtou se při kliknutí a nešíří se.
- OSM: © přispěvatelé OpenStreetMap, ODbL. RÚIAN a ortofoto: © ČÚZK, CC BY 4.0.
- Export i uložený soubor uvádějí zdroje města řezu i s krajem. Podrobnosti v `LICENCE-A-ZDROJE.md`.
