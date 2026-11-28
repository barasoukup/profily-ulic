# Vypínače aplikace

Vygenerováno z registru `app/public/flags.js` (`node tools/build_switches_doc.mjs`, hlídá `tests/flags.test.js`); neupravovat ručně.
Nový vypínač se přidává do `flags.js` se záznamem: `id`, druh, výchozí hodnota, popis, datum (první commit, který ho jmenuje) a měření nebo zpráva (`null`, když není).

## Opravy (výchozí zapnuto) (44)

Zapnuté opravy a pravidla odhadu; vypíná je `?off=<id>` (víc jich čárkou), kde je v tabulce jiný zápis, ten.

| Vypínač | Výchozí | Co dělá | Od | Měření nebo zpráva |
|---|---|---|---|---|
| `?ai=0` | zapnuto | Obruby vozovky odhadu čte natrénovaný model (ai-kerbs.js). | 2026-11-19 | – |
| `?aiplochy=0` | zapnuto | Model rozhoduje i chodník, zeleň a ostatní mezi obrubou a domem. | 2026-11-19 | `evaluation/holdout` |
| `?axisroad=0` | zapnuto | Vlastní vozovka ulice, kterou osa neprotíná (Lippard Avenue). | 2026-11-26 | `evaluation/axisroad-check/REPORT.md` |
| `?off=beside` | zapnuto | Pravidlo „za pasportem“: chodník, zeleň a plochy odhadnuté vedle ploch mapy (besidePassport). | 2026-11-16 | `evaluation/archive/unification/AUDIT.md` |
| `?off=busduo` | zapnuto | Vozovka jen pro autobusy je druhá polovina ulice (bulvár v Paříži). | 2026-11-23 | `evaluation/france/ab/boulevards/REPORT.md` |
| `?off=buskrajnice` | zapnuto | Buspruh z krajnice, kterou omezení šířky pruhu nechalo u obruby. | 2026-11-23 | `evaluation/france/ab/boulevards/REPORT.md` |
| `?off=dcarterials` | zapnuto | Washington: tepny podle inventáře DDOT a ostrůvky vedle nich. | 2026-11-25 | `evaluation/usa/arterials/REPORT.md` |
| `?off=ddotfit` | zapnuto | Washington: inventář DDOT se věří jen tam, kde se vejde do změřené šířky. | 2026-11-27 | `evaluation/usa/ddot-fit/REPORT.md` |
| `?dosah=0` | zapnuto | Strana, kterou uživatel natáhl, pokračuje za poslední cestu nebo chodník. | 2026-11-27 | – |
| `?off=floorsh` | zapnuto | Počet podlaží z výšky přes sdílenou funkci (floors.js); vypnuto: starý výpočet výška / 3,5. | 2026-11-27 | `evaluation/archive/floors-height/REPORT.md` |
| `?off=gapsortho` | zapnuto | Mezery mezi vozovkami mapy povrchů podle ortofota (Toronto, Boston, sdílené). | 2026-11-27 | `evaluation/canada/losses/FIXES.md` |
| `?off=gapswide` | zapnuto | Mezera nad 10 m mezi vozovkami s jiným jménem jsou dvě ulice. | 2026-11-27 | `evaluation/canada/losses/FIXES.md` |
| `?off=kerbbays` | zapnuto | Zálivy stání v obrubách mapy povrchů (Toronto, New York, Boston). | 2026-11-25 | `evaluation/canada/REPORT.md` |
| `?off=kolodvakrat` | zapnuto | Stezka vedle cesty z OSM (cycleway:<strana>=lane) nedělá ještě cyklopruh ve vozovce. | 2026-11-22 | `evaluation/france/REVIEW.md` |
| `?off=lawlanes` | zapnuto | Zákonné stání čeká na pruhy a auta modelu (lawKerbs, layLaw). | 2026-11-25 | `evaluation/archive/unification/measure2/REPORT.md` |
| `?off=mapfill` | zapnuto | Doplnění kolem mapy povrchů: zeleň, chodníky a stání z modelu za koncem mapy. | 2026-11-24 | `evaluation/archive/mapfill-cz/REPORT.md` |
| `?off=mapgaps` | zapnuto | Mezery mezi vozovkami mapy povrchů (Toronto, Boston). | 2026-11-25 | `evaluation/canada/REPORT.md` |
| `?off=mostdeska` | zapnuto | Odhad končí na hraně mostovky. | 2026-11-27 | `evaluation/archive/bridge-water/edge/REPORT.md` |
| `?off=mostvoda` | zapnuto | Voda pod mostem a za krajním chodníkem mostu. | 2026-11-26 | `evaluation/archive/bridge-water/REPORT.md` |
| `?off=obsluzne` | zapnuto | Obslužné cesty u řezu jako křižovatky. | 2026-11-25 | `evaluation/archive/unification/AUDIT.md` |
| `?odhadstani=0` | zapnuto | Zákonný odhad stání (podle zákona o provozu státu). | 2026-11-17 | – |
| `?orez=0` | zapnuto | Kde pasport města má vozovku pod středem řezu, vozovky, které DTM jen hádá kolem ní, se ořežou (overlay.js). | 2026-11-26 | – |
| `?off=osafix` | zapnuto | Opravy osy OSM v každém městě (jedno pravidlo všude). | 2026-11-25 | `evaluation/archive/unification/AUDIT.md` |
| `?off=osaroad` | zapnuto | Dlážděný pás pod osou mezi dvěma vozovkami je střední pás, jeho osa je střed ulice (test osy). | 2026-11-25 | `evaluation/archive/unification/AUDIT.md` |
| `?off=osmdomy` | zapnuto | Budovy z OSM doplňují plochy mapy tam, kde mapa budovy nemá. | 2026-11-27 | `docs/osm.md` |
| `?off=osmwalk` | zapnuto | Chodník z OSM za obrubou před domem nad trávníkem mapy. | 2026-11-16 | `docs/profile-derivation.md` |
| `?off=otherstreet` | zapnuto | Upozornění „řez vede křižovatkou“ u jiné ulice šikmo v profilu. | 2026-11-25 | `docs/decisions.md` |
| `?off=parkshare` | zapnuto | Oprava stání z modelu u zákonného pruhu. | 2026-11-24 | `evaluation/archive/unification/slovakia-parking/REPORT.md` |
| `?off=pesizona` | zapnuto | Pěší zóna je chodník (kreslí se s lidmi a stromy jako chodník). | 2026-11-17 | – |
| `?off=pocetpruhu` | zapnuto | Obousměrka se dělí od 4,0 m, kde je počet pruhů známý a u vozovky je stání. | 2026-11-24 | `evaluation/usa/REPORT.md` |
| `?off=podkrovi` | zapnuto | Slovinsko: horní podlaží katastru ve střeše (obytné podkroví). | 2026-11-24 | `evaluation/slovenia/ab/REPORT.md` |
| `?off=protejsi` | zapnuto | Výběr místa řezu mezi křižovatkami: nejbližší volné místo, ne obslužná cesta. | 2026-11-25 | – |
| `?off=railway` | zapnuto | Železniční kolej z OSM vedle ulice jako štěrkové lože. | 2026-11-27 | `docs/rail.md` |
| `?off=roadtracks` | zapnuto | Cyklostezky z OSM ve vozovce mapy povrchů (Toronto, New York, Boston). | 2026-11-25 | `evaluation/canada/REPORT.md` |
| `?off=ruiandomy` | zapnuto | Budovy odhadu z RÚIAN, z OSM jen tam, kde RÚIAN žádnou nemá. | 2026-11-23 | `docs/profile-derivation.md` |
| `?off=srafy` | zapnuto | Šrafy (pruhy mezi plnými čarami) v pruzích z ortofota. | 2026-11-27 | `evaluation/orthophoto/REPORT.md` |
| `?off=staramapa` | zapnuto | Pole nebo les mapy tam, kde odhad našel domy a chodníky, jde za odhad (mapa ještě nepřekreslená). | 2026-11-23 | `docs/profile-derivation.md` |
| `?off=trackaxis` | zapnuto | Cyklostezka z OSM přes osu mapy povrchů. | 2026-11-27 | `evaluation/canada/losses/FIXES.md` |
| `?off=tramsnap` | zapnuto | Koleje tramvaje bez změřených os se přitáhnou k tělesu. | 2026-11-18 | `evaluation/germany/tramsnap/REPORT.md` |
| `?off=tunneltracks` | zapnuto | Koleje v tunelu pod ulicí se nekreslí. | 2026-11-25 | `evaluation/canada/review/results/score.md` |
| `?off=ulicky` | zapnuto | Ústí uličky je křižovatka (plocha uličky jen pro ulici, do které ústí). | 2026-11-24 | `evaluation/usa/REPORT.md` |
| `?off=ulickysve` | zapnuto | Ústí uliček podle obrysů ploch uliček podél ulice (ALLEY_REACH, ALLEY_MOUTH). | 2026-11-25 | – |
| `?off=vsedomy` | zapnuto | Vzhled domu čte všechny budovy OSM, i bez podlaží a výšky. | 2026-11-25 | `evaluation/archive/all-buildings/REPORT.md` |
| `?off=zabradli` | zapnuto | Zábradlí mostu na okraji ulice na mostě. | 2026-11-27 | `evaluation/archive/bridge-water/edge/REPORT.md` |

## Zdroje dat (50)

Zdroj dat nebo mapa povrchů města; `?<id>=0` ho vynechá, u vypnutých `?<id>=1` zapne.

| Vypínač | Výchozí | Co dělá | Od | Měření nebo zpráva |
|---|---|---|---|---|
| `?aachen=0` | zapnuto | Mapa povrchů Cách (WFS města). | 2026-11-17 | `evaluation/germany/ab/REPORT.md` |
| `?aarbyg=0` | zapnuto | Budovy Aarhusu z BBR (CC BY 4.0). | 2026-11-23 | `evaluation/denmark/buildings-ab/REPORT.md` |
| `?av=0` | zapnuto | Švýcarsko: plochy z úředního vyměřování (Amtliche Vermessung). | 2026-11-17 | `evaluation/switzerland/ab/REPORT.md` |
| `?bag=0` | zapnuto | Nizozemsko: budovy BAG a 3D BAG. | 2026-11-20 | `evaluation/netherlands/ab/BUILDINGS.md` |
| `?bdtopo=0` | zapnuto | Francie: budovy BD TOPO (podlaží, výška). | 2026-11-22 | – |
| `?berlin=0` | zapnuto | Mapa povrchů Berlína. | 2026-11-17 | `evaluation/germany/ab/REPORT.md` |
| `?bgt=0` | zapnuto | Nizozemsko: mapa povrchů BGT (PDOK). | 2026-11-20 | `evaluation/netherlands/ab/REPORT.md` |
| `?bologna=1` | vypnuto | Mapa povrchů Boloně (plochy silnic jsou celé uliční prostory). | 2026-11-23 | `evaluation/italy/ab/REPORT.md` |
| `?bolognadomy=0` | zapnuto | Výšky budov Boloně. | 2026-11-23 | `evaluation/italy/ab/REPORT.md` |
| `?boston=0` | zapnuto | Mapa povrchů Bostonu (dlaždice z Street Edges a Sidewalk Inventory). | 2026-11-26 | `evaluation/usa/boston/REPORT.md` |
| `?bostonhouse=0` | zapnuto | Budovy Bostonu s podlažími. | 2026-11-26 | `evaluation/usa/boston/REPORT.md` |
| `?cama=0` | zapnuto | Washington: domy z CAMA (podlaží, rok). | 2026-11-25 | `evaluation/north-america-art/cama` |
| `?cambridge=0` | zapnuto | Mapa povrchů Cambridge (MA). | 2026-11-26 | `evaluation/usa/boston/REPORT.md` |
| `?catastro=0` | zapnuto | Španělsko: budovy z katastru. | 2026-11-23 | – |
| `?dc=0` | zapnuto | Washington: mapa povrchů Planimetrics 2023. | 2026-11-25 | `evaluation/usa/fresh/REPORT.md` |
| `?ddot=0` | zapnuto | Washington: inventář DDOT Roadway SubBlock (pruhy, stání, cyklopruhy). | 2026-11-27 | `evaluation/usa/REPORT.md` |
| `?dls=0` | zapnuto | Kypr: budovy z DLS s podlažími. | 2026-11-23 | `evaluation/cyprus/REPORT.md` |
| `?etak=0` | zapnuto | Estonsko: budovy ETAK s výškou. | 2026-11-23 | `evaluation/estonia/REPORT.md` |
| `?foral=0` | zapnuto | Baskicko a Navarra: budovy z foralních katastrů (?foral=1 všechny čtyři, ?foral=nc,gi jmenované). | 2026-11-23 | `evaluation/spain/foral-ab/REPORT.md` |
| `?grpk=0` | zapnuto | Litva: obrysy budov GRPK, které ukončují řez u fasády. | 2026-11-24 | `evaluation/lithuania/REPORT.md` |
| `?gurs=0` | zapnuto | Slovinsko: budovy z katastru GURS. | 2026-11-23 | `evaluation/slovenia/ab/REPORT.md` |
| `?hamburg=0` | zapnuto | Mapa povrchů Hamburku. | 2026-11-17 | `evaluation/germany/ab/REPORT.md` |
| `?helsinki=0` | zapnuto | Mapa povrchů Helsinek (YLRE). | 2026-11-23 | `evaluation/finland/ab3/REPORT.md` |
| `?hkibuild=0` | zapnuto | Helsinky: budovy z registru města. | 2026-11-23 | `evaluation/finland/buildings-ab/REPORT.md` |
| `?hkihouses=0` | zapnuto | Helsinky: obrysy budov registru. | 2026-11-24 | `evaluation/finland/buildings-ab/REPORT.md` |
| `?hrany=0` | zapnuto | Čáry map povrchů jako kandidáti obrub (Belgie GRB a PICC, Slovensko). | 2026-11-16 | `evaluation/belgium/ab/REPORT.md` |
| `?kbhbyg=0` | zapnuto | Kodaň: budovy Københavns Kommune (stáří, podlaží). | 2026-11-23 | `evaluation/denmark/buildings-ab/REPORT.md` |
| `?kbhkant=0` | zapnuto | Kodaň: okraje vozovek GeoDanmark (vejkant) jako kandidáti obrub. | 2026-11-23 | `evaluation/denmark/ab/REPORT.md` |
| `?kbhpark=0` | zapnuto | Kodaň: parkovací plochy města. | 2026-11-23 | `evaluation/denmark/ab/REPORT.md` |
| `?krakow=1` | vypnuto | Kraków: mapa povrchů MSIP (pravidla města chtějí písemný souhlas správce). | 2026-11-21 | `evaluation/archive/licences/REPORT.md` |
| `?lombardia=0` | zapnuto | Lombardie: mapa povrchů (DBT). | 2026-11-24 | `evaluation/italy/lombardia/REPORT.md` |
| `?nyc=0` | zapnuto | Mapa povrchů New Yorku (NYC Planimetric Database). | 2026-11-26 | `evaluation/usa/nyc/REPORT.md` |
| `?nychouse=0` | zapnuto | Budovy New Yorku z obrysů téže služby. | 2026-11-26 | `evaluation/usa/nyc/REPORT.md` |
| `?paris=0` | zapnuto | Paříž: mapa povrchů (Plan de voirie, ODbL). | 2026-11-22 | `evaluation/france/ab/REPORT.md` |
| `?parisstani=0` | zapnuto | Paříž: stání z evidence parkovacích míst. | 2026-11-23 | `evaluation/france/ab/boulevards/REPORT.md` |
| `?pasport=0` | zapnuto | Slovensko: pasporty měst (Bratislava, Žilina, Banská Bystrica). | 2026-11-16 | `evaluation/slovakia/ab/REPORT.md` |
| `?ryhti=0` | zapnuto | Finsko: budovy z registru Ryhti. | 2026-11-23 | `evaluation/finland/buildings-ab/REPORT.md` |
| `?salzburg=0` | zapnuto | Salcburk: zákaz zastavení a stání z katastru značek. | 2026-11-16 | – |
| `?sf=0` | zapnuto | Mapa povrchů San Franciska (DataSF a SFMTA). | 2026-11-26 | `evaluation/usa/sf/REPORT.md` |
| `?sfcurb=0` | zapnuto | San Francisco: stání z digitální obruby SFMTA. | 2026-11-26 | `evaluation/usa/sf/REPORT.md` |
| `?sfhouse=0` | zapnuto | San Francisco: podlaží z výšek obrysů budov. | 2026-11-26 | `evaluation/usa/sf/REPORT.md` |
| `?symboly=0` | zapnuto | Bratislava: symboly druhů ploch technické mapy. | 2026-11-16 | `evaluation/slovakia/ab/REPORT.md` |
| `?tallinn=0` | zapnuto | Mapa povrchů Tallinnu. | 2026-11-23 | `evaluation/estonia/ab/REPORT.md` |
| `?toronto=0` | zapnuto | Mapa povrchů Toronta (OGL – Toronto). | 2026-11-25 | `evaluation/canada/REPORT.md` |
| `?torontohouse=0` | zapnuto | Domy Toronta z mapy. | 2026-11-25 | `evaluation/canada/REPORT.md` |
| `?vilnius=1` | vypnuto | Vilnius: topografické plochy 1 : 500 (licence neuvedená). | 2026-11-24 | `evaluation/lithuania/REPORT.md` |
| `?wbn=0` | zapnuto | Flandry: Wegenbouwkundige Noodzaak (WBN) z GRB. | 2026-11-24 | `evaluation/belgium/ab-wbn/REPORT.md` |
| `?wien=0` | zapnuto | Vídeň: Flächen-Mehrzweckkarte (FMZK). | 2026-11-16 | `evaluation/austria/ab/REPORT.md` |
| `?zaragoza=0` | zapnuto | Zaragoza: mapa povrchů (dlažby 2017). | 2026-11-23 | `evaluation/spain/ab/REPORT.md` |
| `?zbgis=0` | zapnuto | Slovensko: plochy a šířky ze ZBGIS. | 2026-11-16 | `evaluation/slovakia/REPORT.md` |

## Volby uživatele a srovnávací přepínače (8)

Jazyk, město, odkud číst OSM, sítě pod zemí a srovnávací přepínače.

| Vypínač | Výchozí | Co dělá | Od | Měření nebo zpráva |
|---|---|---|---|---|
| `?aimodel=<soubor>` | `street` | Jiný soubor modelu obrub v ai/ (srovnání menšího modelu na týchž řezech). | 2026-11-19 | – |
| `?lang=<jazyk>` | `podle prohlížeče` | Jazyk rozhraní (cs, sk, en, de a další); zapamatuje se a z adresy zmizí. | 2026-11-12 | – |
| `?mapa=0` | `zapnuto` | Odhad z ortofota a OSM i tam, kde odpovídá technická mapa (porovnání obou). | 2026-11-18 | – |
| `?mesto=<id>` | `podle místa řezu` | Stará adresa města (/brno/ …) otevře mapu nad ním. | 2026-11-10 | – |
| `?orto=0` | `zapnuto` | Pruhy a krajnice z čar na ortofotu; vypnuto: profil z pravidel. | 2026-11-11 | – |
| `?osm=r2|balik` | `web: R2 a záloha na Pages, lokálně dlaždice` | Odkud se čtou balíky OSM (R2, soubory lokálního serveru). | 2026-11-16 | `evaluation/osm-r2/REPORT.md` |
| `?site=1` | `vypnuto` | Zapne sítě pod zemí (Praha), dokud je uživatel nevypne. | 2026-11-12 | – |
| `?stit=0|1|cely` | `zapnuto, uříznutý štít` | Obrys štítu u štítových domů: 0 vypne, cely celý souměrný, 1 i u ostatních vzhledů. | 2026-11-23 | `evaluation/archive/regional-buildings/REPORT.md` |

## Pokusy (vypnuté, čekají na rozhodnutí) (0)

Funkce, které zatím nic nevyhrálo; v kódu je smaže krok 6 plánu, nebo zůstanou, dokud Bára nerozhodne.

Žádné.
