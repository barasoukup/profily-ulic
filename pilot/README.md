# Profily ulic – pilot (Praha)

Kliknete na ulici v mapě a aplikace z technické mapy IPR (vrstva MTVU) a z OSM sestaví
příčný profil. Ten pak upravujete: šířky tažením, typy, pořadí, přidávání a mazání,
stav / návrh / porovnání, export SVG a PNG, uložení a načtení návrhu (JSON).

## Spuštění

```bash
node pilot/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení
k internetu (podkladové mapy a technická mapa IPR). Rozpracovaný profil si prohlížeč
pamatuje i po zavření.

## Odkud jsou data

- **Šířky:** IPR Praha, *Mapa technického využití území* (MTVU), služba
  `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15`. Odpovědi se ukládají do `pilot/cache/mtvu`,
  stejné místo se tedy podruhé načte hned. První načtení trvá podle serveru IPR 1–10 s.
- **Tramvajové koleje:** osy kolejí z liniové vrstvy technické mapy IPR (`dtmp/MapServer/10`, kód 55010
  „MHD – osa kolejí“), cache v `pilot/cache/koleje`. Pruh s tramvají sahá 1,75 m od osy koleje ven
  a mezi kolejemi do poloviny osové vzdálenosti. Odpovídá to Manuálu tvorby veřejných prostranství
  IPR (kap. C.2): dvoukolejný tramvajový pás 6,5 m při osové vzdálenosti 3 m, 7 m při 3,5 m. Zbytek vozovky široký aspoň 2,5 m se stane samostatným jízdním pruhem. Kde osy
  kolejí chybí, použije se tramvajová trať z OSM.
- **Parkování v zónách placeného stání:** úseky parkovacích stání TSK (`gs-pub.praha.eu/.../dop/zony_placeneho_stani/MapServer/3`,
  polygony, cache v `pilot/cache/parkovani`). Stejná data používá i Golemio (zdroj `tsk_v2`), ale bez API klíče.
  Mají přednost před plochami parkování z OSM.
- **Parkovací zálivy:** plochy parkování z OSM (`amenity=parking` s `parking=street_side`, `lane`, `on_kerb`…).
  Technická mapa je samostatně nerozlišuje, proto mají přednost před MTVU; úzké zbytky vozovky
  nebo chodníku vedle nich se k parkování přičtou.
- **Stromy:** stromořadí (`natural=tree_row`) a jednotlivé stromy (`natural=tree`) z OSM do 8 m od řezu.
  V chodníku se kolem nich vyčlení stromořadí široké 1,5 m; zelený pás se stromy se označí jako stromořadí,
  bez stromů jako zeleň.
- **Nástupiště MHD:** nástupiště z OSM (`public_transport=platform`, `railway=platform`, `highway=platform`;
  čáry i plochy). Ostrůvek s nástupištěm se celý označí jako nástupiště, na širokém chodníku jen pás 3 m
  u obruby.
- **Zásobování, ZTP, speciální stání:** vrstvy 5–8 stejné služby TSK; parkovací pruh dostane účel.
- **Pruhy pro autobusy:** OSM `busway:*=lane`, `bus:lanes`, `psv:lanes`, `lanes:bus`, `lanes:psv`;
  **pruh BUS + cyklisté** z `cycleway:*=share_busway` nebo `bicycle:lanes=…|designated`. Na jednosměrce
  platí tagy bez strany (`busway=lane`, `cycleway=*`) jen pro pravou stranu.
- **Prvky v profilu** (kreslí se uvnitř části, v editoru jdou přidat a smazat):
  mobiliář z OSM do 6 m od řezu (lampy, lavičky, stojany a sdílená kola, přístřešky, rozcestníky, taxi,
  sloupky, květináče, předzahrádky); bariéry a svahy z linií technické mapy (svodidla 71522/71540,
  zábradlí 61530, ploty a zdi 61209/61210/71210/81210/91210, opěrné zdi 61422/71422/81422, živé ploty 81214,
  hrany svahů 42105/42107) a z OSM `barrier=*`.
- **Předzahrádky restaurací:** plochy OSM `leisure=outdoor_seating`. **Vodní plochy:** MTVU 500–504.
  **Barevné cyklopruhy:** `cycleway:*:surface:colour`.
- **Co v ulici je** (počet pruhů, jednosměrka, tramvaj, parkování, cyklopruhy): lokální výřez
  OSM pro Prahu (BBBike, `data/osm/Prag.osm.pbf`), rozdělený na dlaždice do `pilot/data/osm-tiles`.
  Overpass se nepoužívá.
- **Podklady mapy:** výchozí je základní mapa IPR; dál černobílá a tmavá (černobílá invertovaná v prohlížeči),
  zástavba (plochy budov technické mapy), letecká a mimovegetační ortofoto IPR (`imgs/.../ort/*_letecke_snimkovani`),
  ortofoto ČÚZK a OpenStreetMap. Vrstvu „Technická mapa IPR“ jde zapnout navrch. Vybraný podklad si prohlížeč pamatuje.

### OSM pro celou ČR
Jedna sada dlaždic pro všechna města (`pilot/data/osm-tiles`, na webu `data/osm-tiles`, ze stránky města
`../data/osm-tiles`): výřez Geofabrik Česká republika, `NAME=cz tools/build_osm_data.sh cz.osm.pbf pilot/data/osm-tiles`
(exporty ogr2ogr asi 8 min, dlaždice proudově za 1–2 min). Úsporný zápis (`pilot/public/osmtile.js`): jen značky, které
profil čte nebo by mohl (zóny, rychlosti, povrch, zastávky, přechody, druhy stromů, šířky, značky), bez polních cest,
stezek a pěšin mimo ulice; souřadnice jako rozdíly celých čísel (budovy na 1 m); dlouhé cesty rozdělené po dlaždicích
a v aplikaci zase spojené. Asi 760 MB ve 239 000 dlaždicích. Overpass se nepoužívá (pomalý).

### Aktualizace OSM výřezu

Skript stáhne výřez BBBike (když ještě není v `data/osm/Prag.osm.pbf`), vybere z něj ogr2ogr potřebné prvky
do `data/osm/praha_*.geojsonl` a rozdělí je na dlaždice do `pilot/data/osm-tiles`:

```bash
OGR=/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr PROJ_DATA=/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/proj GDAL_DATA=/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/gdal tools/build_osm_data.sh
```

Pro čerstvá data nejdřív smažte `data/osm/Prag.osm.pbf`. Přesné výběry (ulice, parkování, stromy, nástupiště,
mobiliář, bariéry, předzahrádky, budovy s počtem podlaží) jsou ve skriptu `tools/build_osm_data.sh`.

### Orientace stání

Podélné, šikmé a kolmé stání se bere z OSM (`orientation` u ploch parkování, `parking:*:orientation` u ulic).
U úseků TSK se dopočítá z průměrné hloubky úseku (plocha / délka) a počtu stání (`PS_ZPS`): hloubka
od 4,9 m = kolmé, pod 3 m = podélné, jinak podle délky na stání (pod 3,4 m kolmé, 3,4–4,8 m šikmé, víc podélné). Kde nic z toho není, odhadne se z hloubky pásu: do 3,2 m podélné,
do 4,6 m šikmé, jinak kolmé.
`parking:*=on_kerb` vyčlení stání z chodníku u obruby (2 / 4,5 / 5 m podle orientace), `half_on_kerb` 1 m.
V editoru jde orientace změnit ručně. Kolmé stání má podle ČSN 73 6056 hloubku 5,0 m, s přesahem vozidel
přes obrubník 4,5 m; užší změřený pás kolmého stání se doplní na 4,5 m z chodníku nebo zeleně za obrubníkem.

### Výška budov

Počet podlaží budov na okrajích profilu se bere z vrstvy IPR *Podlažnosti*
(`mp.iprpraha.cz/.../URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0`: podlaží po římsu, střešní/ustupující
podlaží, celkem; cache v `pilot/cache/podlaznost`), jinak z OSM `building:levels` (+ `roof:levels`).
Výška se kreslí 3,5 m na podlaží (přesná výška jen z OSM `height`), střešní podlaží užší a tmavší.

## Jedna stránka pro celou ČR
Město se bere podle místa řezu (`city.js`: `cityAt` podle hranic obcí v `mesta.json`, `setCity`); mimo města s
vlastními zdroji platí „cesko“ (`towns/cesko.js`: technická mapa ČÚZK živě, domy z RÚIAN, dlaždice OSM). Moduly čtou
`city` až při použití, takže zdroje, ilustrace (načtou se při prvním řezu ve městě) i texty sedí na místo řezu. Bývalé
stránky `/<město>/` jsou přesměrování na `/?mesto=<město>` (`tools/build_city_site.mjs`, místní server totéž).

## Brno

Stejná aplikace s `CITY = "brno"` (`city.js`, `tools/city_site.mjs`). Lokálně http://localhost:5173/brno/,
na webu `…/profily-ulic/brno/`. Stejně jako Praha se ptá služeb při kliknutí (přímo z prohlížeče,
služby povolují CORS); lokálně jsou jen dlaždice OSM (`pilot/data/brno/osm-tiles`, výřez BBBike Brno) a
parkování. Úpravy výpočtu zkoušené zatím jen v Brně zapíná `city.fix` (`city.js`): křižovatky i se
`service`, osa OSM vedle vozovky se posune na ni, zpevněná plocha do 25 m pod osou silnice je vozovka.

- plochy: MTVU města (`gis.brno.cz/ags3 … PUBLIC/opendata_mtvu`, vrstva 1). Brněnské kódy 5100xxx
  (číselník v legendě `PUBLIC/ted_MTVU_plochy_povrch`) převádí `brnoMtvuCode` v `sources.js` na pražské;
- koleje, svodidla, ploty, zdi, zábradlí, svahy a body (lampy, stromy, lavičky, sloupky): kresba technické
  mapy UMPS (`PUBLIC/opendata_umps`, jeden dotaz `identify`). Kódy linií mají stejnou soustavu jako IPR
  s předponou (`brnoLineCode`: 1255010 → 55010);
- parkování: aktuální úseky placeného stání z mapy parkovanivbrne.cz, stažené při nasazení do dlaždic
  (`tools/build_parkovani_brno.mjs`, `data/parkovani/`); export na data.brno.cz je z 2/2024. Oblasti
  rezidentního parkování se nepoužívají (ohraničují celé čtvrti, i ulice bez placeného stání): kde u řezu
  úsek není, profil stání odhadne;
- cyklopruhy, piktokoridory a protisměr: Cykloopatření – zrealizovaná (data.brno.cz), jen kde OSM nic neříká;
- mosty: nadzemní plochy MTVU (`PUBLIC/ted_MTVU_plochy_nadzemni`), jen pro řez na mostě;
- budovy: Průzkum budov v Brně (KAM): podlaží, podlaží ve střeše, střecha. Vývoj zástavby Brno nemá.

Záloha pro města bez vlastní služby: plochy z veřejné DTM kraje (IS DMVS ČÚZK, bez přihlášení).
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

## Jihlava (`/jihlava/`)

Stejná aplikace s `CITY = "jihlava"` (`pilot/public/city.js`, `tools/city_site.mjs`), lokálně
http://localhost:5173/jihlava/. Jako Praha s IPR se při kliknutí ptá služeb města (`gis.jihlava-city.cz`,
CORS povolený):

- plochy: **pasport komunikací** (`server1/ost/Pasporty/MapServer/112`, úseky „vozovka“ a „chodník“ s
  povrchem, třídou a názvem ulice) → kódy MTVU 701 a 702; **budovy RÚIAN** (`server/ost/ORP_RUIAN/7`, i s
  počtem podlaží a využitím) → 601; **trávníky** z pasportu zeleně (`Pasporty/25`) → 401; zbytek z **katastru**
  (`server/ost/Ji_parcely/1`, druh pozemku): zahrada → 300, travní porost a zeleň → 401, zastavěná plocha a
  nádvoří → 603, pole, les, voda, manipulační plocha; pozemek komunikace mimo pasport → zeleň (odhad), jen je-li
  v okolí vozovka z pasportu.
  Technická mapa města i kraje mají jen hranice ploch, typy bez definičních bodů vozovek, proto pasport.
- parkování: **parkovací místa města** (`server1/verejnost/doprava_verejnost/MapServer/105`) jsou čáry s druhem
  stání (podélné, šikmé, kolmé), režimem a počtem míst. Každá čára je pruh hloubky 2,0 / 4,5 / 5,0 m; leží-li
  vozovka jen na jedné straně čáry (čára u obrubníku), pruh leží na té straně, jinak je čára jeho osou.
  Úseky „Zákaz stání / zastavení“ se vynechávají, K+R, taxi a vyhrazená stání jsou „zvláštní stání“.
- linie: ploty, zábradlí, zdi, svodidla a protihlukové stěny z technické mapy (`server1/DTM/DTM_ZPS_verejnost/12`).
- body: stromy (`Pasporty/28`), stožáry osvětlení (`Pasporty/50`), přístřešky a lavičky zastávek (`Pasporty/127`)
  a stojany na kola (`doprava_verejnost/150`), kde je OSM nemá do 3 m (přístřešek do 15 m) (vrstva laviček `opendata/18` na dotazy neodpovídá).
- souřadnice: služby města převádějí S-JTSK do WGS 84 jinou transformací (asi 6 m vedle OSM), dotazy proto žádají `datumTransformation=1623` jako u IPR.
- lokálně jen dlaždice OSM: výřez z Geofabriku (ČR) přes `osmium extract --bbox 15.48,49.32,15.70,49.47`
  a `NAME=jihlava tools/build_osm_data.sh data/osm/towns/jihlava.osm.pbf pilot/data/jihlava/osm-tiles`
  (bez osmia `SPAT="15.48 49.32 15.70 49.47"` s celou ČR).
- úpravy výpočtu jako v Brně (`city.fix`).
- ilustrace: trolejbus Škoda 32Tr a autobus Citelis DPmJ; trolejbus se sběrači v bus pruhu pod trolejemi
  (OSM `trolley_wire=yes`), jinde autobus; mobiliář zatím jako v Praze.
- další zajímavé vrstvy města (zatím nepoužité): jednosměrky a cyklo-obousměrky, obytné zóny a zóny 30,
  přechody, trolejové vedení a trakční sloupy, zastávky s vybavením, dopravní značky, mosty.

## Další města: Most, Opava, Plzeň (`/most/`, `/opava/`, `/plzen/`)

Každé malé město je jeden modul `pilot/public/towns/<město>.js` (vzor `towns/jihlava.js`): zdroje dat pro
kliknutí (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`) ve stejném tvaru jako odpovědi IPR, podkladové
mapy (`maps`) a ortofoto pro kontrolu řezů (`ortho`). Společné funkce jsou v `pilot/public/gis.js`. Texty aplikace
jsou v `city.js`, texty stránky, servery pro CSP a výřez OSM v `tools/cities.mjs`; nasazení i místní server berou
seznam měst odtud. Nové město: záznam v `city.js` a `tools/cities.mjs`, modul v `towns/` (a v `towns/index.js`),
ilustrace v `pilot/public/<město>/`, dlaždice `NAME=<město> SPAT="x0 y0 x1 y1" tools/build_osm_data.sh <ČR.pbf>
pilot/data/<město>/osm-tiles`, kontrola `CITY=<město> node evaluation/sample.mjs|run_brno.mjs|render_brno.mjs`.

- **Domy (všechna malá města):** RÚIAN z celostátní služby ČÚZK (`gis.js` `ruianBuilding`, sedí na OSM do
  0,1 m): podlaží, využití (hala, nízký dům), **rok dokončení** a **druh konstrukce** (stěnové panely = panelák).
  Rok stojí místo pražského stáří zástavby: do 1919 a 1946–57 šikmá střecha, od 1958 panelová éra, od 1996 moderní
  dům (staré domy mají v RÚIAN souhrnný rok 1910–1919). Vnitřní město a sídliště podle vzdálenosti od centra má
  každé město vlastní (`city.js` `innerKm`, `estateKm`; Most vnitřní město nemá).
- **Most** (`mapy.mesto-most.cz`): plochy z objektové mapy povrchové situace v otevřených datech
  (`Opendata/OpendataDtmOmps/FeatureServer/9`, kódy `KOD_OMPS`/`KOD`), linie z technické mapy (`DTM/DtmUMPS`:
  ploty, zdi, zábradlí, svodidla, osy kolejí jen do 3 m od tramvaje v OSM), stromy a lavičky z technické mapy,
  lampy z otevřených dat; stání s orientací město nemá. Datum sedí (1623). Ilustrace: tramvaj EVO2 a autobus SOR
  NB 12 DPmML. Kontrola 57 řezů: `evaluation/most/ZPRAVA.md`.
- **Opava** (`mapy.opava-city.cz`, složka `external`): plochy z účelové mapy povrchové situace
  (`info_dtm_plochy_find/0`, pole `POPIS`; vozovky ulic jsou čtyři polygony přes celé město, tři s chybným popisem,
  čtou se zvlášť a zjednodušené), stání placených zón (`dopr_zps`), stromy, lavičky, kryté zastávky, stojany.
  Služby jsou 4 m vedle OSM, dotazy s `datumTransformation=1623`. Ilustrace: trolejbus Škoda 32Tr a autobus Iveco
  Urbanway MDPO. Kontrola 50 řezů: `evaluation/opava/ZPRAVA.md`.
- **Plzeň** (`ags.plzen.eu`): technická mapa ve struktuře JVF DTM (`GIS_DTM/GIS_DTM_ZPS_kesovana/FeatureServer`,
  jeden dotaz na asi 45 vrstev ploch a linií), 3D budovy s výškou okapu a hřebene (`GIS_3D_budovy`), stromy,
  lavičky, stojany a sloupky z pasportů, ortofoto 2024. Služby jsou 12 m vedle OSM: dotazy s 1623, kde to vrstva
  nepřijme, posun vstupu. Osy kolejí město nezveřejňuje (z OSM). Ilustrace: tramvaj 40T, trolejbus 26Tr a autobus
  PMDP. Kontrola 50 řezů: `evaluation/plzen/ZPRAVA.md`.
- Trolejbus se kreslí v bus pruhu pod trolejí (OSM `trolley_wire`, i jen pro jeden směr).
- **Pardubice** (žádné služby města): plochy živě z **celostátní technické mapy ČÚZK** (IS DMVS, `pilot/public/dmvs.js`,
  použitelné pro jakékoli město). Služba nevrací tvary, jen obrázky a typ plochy v bodě: modul stáhne obrázek ploch a
  hraničních linií (0,1 m/px), rozdělí ho podle barev legendy, obtáhne obrysy a typ bílých a šedých ploch na řezu
  doptá (průměrně 6 dotazů, kliknutí kolem 1 s). Prázdná místa DTM doplní budovy a parcely RÚIAN. Kvalita záleží na
  kraji: v Pardubicích chybí vozovky mimo zástavbu a plochy uvnitř bloků. Ilustrace: trolejbus 32Tr a autobus Iveco
  Urbanway DPMP. Kontrola 49 řezů: `evaluation/pardubice/ZPRAVA.md`.
- **Ústí nad Labem** (`towns/usti.js`): plochy jako všude v Česku z DTM ČÚZK (Ústecký kraj ji má celou), k tomu
  **parkovací místa města** (`mapy.usti.cz`, `Doprava/Parkovaci_zony_UL/MapServer/3`, řada stání s druhem: podélné,
  kolmé, šikmé, vyhrazené, ZTP; asi 435 řad v centru a okolí, aktualizace 2026). Služba je bez
  `datumTransformation=1623` asi 12 m vedle OSM. A/B nad ortofotem (`evaluation/variants/usti-stani.mjs`, 36 řezů u
  stání): lepší se stáním města 6, horší 1, stejně 3. Ilustrace zatím celostátní.
- Zkoušené a nepřipojené (10. 11. 2026): pasport komunikací Hradce Králové (T-MAPY WFS `geoportal.mmhk.cz/services/
  mapserver/common/pakom/gservice`, vrstva `pk-pov-typ`) dává skoro stejné plochy jako DTM ČÚZK (95 řezů: lepší 4,
  horší 3, stejně 7, obě špatně 2) a nemá CORS; varianta `evaluation/variants/hradec-pasport.mjs`.

## Moravská města: Ostrava, Frýdek-Místek, Karviná, Třebíč, Přerov (10. 11. 2026)

Připojená po srovnání s celostátní DTM ČÚZK na 30 řezech v každém městě (`evaluation/<město>/data/ab-*/review.md`).

- **Ostrava** (`towns/ostrava.js`, `mapy.ostrava.cz`): plochy z generalizované technické mapy města
  (`MAPPA/Polohopis_DTM_generalizace/MapServer/0`, pole `POPIS`, data do 2019), zpevněná plocha s osou koleje
  (`BaseMap/podkladova_mapa_OSTRAVA/MapServer/25`) je tramvajový pás, zdi a ploty z obrysů ploch, úseky placeného
  stání (`SMO/parkovaci_mista/MapServer/9`). Dotazy s `datumTransformation=1623` (jinak 1,5 m vedle OSM).
- **Frýdek-Místek** (`towns/frydek-mistek.js`) a **Karviná** (`towns/karvina.js`): pasport komunikací na serverech
  T-MAPY (WFS 2.0 `…/common/pakom/gservice`, typ `ms:pk-pov`), zeleň z pasportu zeleně (`pazel`) jen tam, kde DTM
  nic nemá, stromy, lavičky, stojany a lampy z pasportů. Pasport leží nad celostátní DTM (`towns/overlay.js`);
  kde ta nemá nic, doplní domy a parcely RÚIAN. WFS se ptá v WGS 84 a odpovídá ve Web Mercatoru (`srsName=EPSG:4326`
  s boxem vrací nic). Frýdek-Místek je pak 0,5 m vedle RÚIAN (posun v modulu), Karviná sedí. Pasport Karviné
  pokrývá jen část města (Fryštát, část Nového Města a Ráje), jinde zůstává DMVS. Karviná má i linie technické
  mapy (`dtmm`, `ms:dtm-umps-l`): ploty a opěrné zdi. Server Frýdku-Místku posílá neúplný řetěz certifikátů
  (Chrome si ho doplní; skripty v Node potřebují `NODE_EXTRA_CA_CERTS` s mezilehlým certifikátem Alpiro).
- **Třebíč** (`towns/trebic.js`, `gis.trebic.cz`): pasport komunikací PaKom 2020 (`public/PaKom2020/MapServer/6`,
  `typ_pov_05`; parkoviště podle poznámky) nad celostátní DTM, lampy (`public/VO`) a lavičky. Dotazy s 1623.
- **Přerov** (`towns/prerov.js`): technická mapa 2024 jen jako vektorové dlaždice v S-JTSK
  (`DTM_polohopis_vector/VectorTileServer`). Modul čte dlaždice úrovně 7 kolem řezu (`towns/mvt.js`), převede je
  do WGS 84 (`towns/sjtsk.js`, Křovák + EPSG 1623, sedí s PROJ na 1 mm) a druh plochy bere z názvu vrstvy.
- Ilustrace zatím jako ve zbytku ČR (`art: "cesko"`).
- Bez vlastního zdroje zůstávají Olomouc, Zlín, Havířov, Třinec, Prostějov, Znojmo, Kroměříž (jen WMS nebo nic).

## Test nového zdroje (A/B)

**Pravidlo: nový zdroj (nebo jiné použití starého) jde do aplikace, jen když nad ortofotem vyhraje.**

- Varianta je soubor `evaluation/variants/<název>.mjs`. Exportuje náhrady některých z pěti zdrojů
  `sources.js` (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`, se stejnými argumenty a odpověďmi) a krátký
  popis `about`. Co nenahradí, bere se z běžných zdrojů města. Varianta `city` je současný stav (bez souboru).
- `CITY=jihlava VARIANTS=city,moje-varianta node evaluation/ab.mjs [od] [do]` spočítá každý řez vzorku
  (`evaluation/<město>/data/samples.json`) jednou za každou variantu, na stejné čáře řezu. Víc variant
  (`city,x,y`) srovná první s každou další. `ONLY=9,10` jen vybrané řezy; `CACHE=disk` si odpovědi služeb uloží
  (`data/ab-cache`) a opakovaný běh se už služeb neptá.
- Výstup `evaluation/<město>/data/ab-<a>-<b>/`: `<n>.json` (oba profily, čas, počet dotazů, míry: šířka celkem,
  vozovka, chodník, okraje, podíl „Neurčeno“, odhad z OSM), `png/<n>.svg.png` (lišící se řezy nad ortofotem,
  A nahoře, B dole) a `review.md` (řádek na každý lišící se řez: vozovka nebo chodník o víc než 0,5 m, jiný okraj).
- Do `review.md` se místo `?` doplní verdikt `a`, `b`, `obě` nebo `žádná`. Pak
  `… node evaluation/ab.mjs --summary` vypíše shodu, mediány rozdílů a součty verdiktů; `--render [n …]` znovu
  nakreslí obrázky.
- Příklad: pasport komunikací v Jihlavě, `evaluation/jihlava/PASPORT.md`.

## Jak se profil skládá

1. Najde se nejbližší ulice z OSM a řez se vede kolmo na její osu (±40 m).
2. Řez se rozdělí podle ploch MTVU (silnice, chodník, cyklostezka, parkoviště, tramvajové těleso,
   zeleň, zahrady…). Profil končí u první budovy, u zahrady (ta se kreslí jako okraj mimo ulici),
   nebo 22 m od osy. Tažením konce řezu jde dosah na každé straně zvlášť zkrátit nebo prodloužit (3–40 m);
   zkrácená strana pak končí volným okrajem.
3. Vozovka se podle tagů OSM rozdělí na parkovací pruhy, cyklopruhy a jízdní pruhy:
   `cycleway:*=lane` → cyklopruh 1,5 m, `soft_lane` → ochranný pruh 1,25 m, `shared_lane` → piktokoridor
   v krajním pruhu; cyklisté v protisměru (`oneway:bicycle=no` u jednosměrky, `opposite_lane`, `opposite`,
   `cycleway:*:oneway=-1`) dostanou opačný směr než auta a popisek „cyklisté v protisměru“; `parking:*=lane|street_side` → parkovací pruh (pokud tam už není parkoviště z MTVU
   nebo plocha z OSM); `lanes:forward`/`lanes:backward` určí počty pruhů v každém směru a
   `turn:lanes(:forward|:backward)` řazení (vlevo, rovně, vpravo). Směr pruhů se bere z nejbližší osy OSM,
   takže sedí i na směrově rozdělených silnicích. Kde vozovkou vedou
   koleje, vznikne kolem každé osy koleje pruh s tramvají a vedle něj jízdní pruhy pro auta.

4. Chodník (MTVU 702) s osou OSM, po které smějí kola: `segregated=yes` → oddělená stezka C10 (chodník a
   cyklostezka, každý na polovinu, kola blíž vozovce), `bicycle=designated` (nebo `segregated=no`) → společná
   stezka pro chodce a cyklisty C9, `bicycle=yes` → chodník s vjezdem cyklistů. Bez vlastní osy rozhoduje
   tag ulice `sidewalk:<strana>:bicycle`. Do Streetmixu jde C9 jako cyklopruh v úrovni chodníku, chodník s koly
   jako chodník.

   Cyklostezka (MTVU 703) dostane směr z cyklostezky v OSM, která jí vede: jednosměrná jede se svou osou,
   obousměrná se rozdělí na dvě poloviny. Úzký vyvýšený zpevněný pás (do 6 m) mezi dvěma vozovkami
   se označí jako dělicí pás / ostrůvek.

5. Pruh je široký nejvýš 4 m (dálnice a silnice pro motorová vozidla 3,75 m, místní ulice 4,5 m). Zbytek vozovky
   od 1 m se nakreslí jako **krajnice / šrafy** u okrajů a označí jako odhad: technická mapa neobsahuje
   vodorovné značení.
6. U obruby s chodníkem (i za úzkým zeleným pásem do 3 m) v ulicích residential, living_street a unclassified (na hlavních ulicích ne), a to jen mimo zóny placeného
   stání: do 100 m od řezu nesmí být žádná zóna TSK (vrstva „Zóny placeného stání vymezené tarifem“).
   Hranice zón se stahují jednou skriptem `node tools/build_zps.mjs` do `pilot/data/zps.json` (na webu při
   nasazení), takže se kvůli nim IPR při kliknutí neptá. Bez souboru rozhodují úseky TSK kolem řezu. se přidá **odhadnuté podélné
   stání** 2 m, pokud tam není stání z TSK ani z OSM, tag ho nezakazuje a pruhy zůstanou široké aspoň 3 m.
7. Obytné zóny (`living_street`) se dělí jako ostatní ulice (Streetmix sdílený prostor nezná). Odhad stání platí i
   v nich; místní ulice bez tagu `lanes` potřebuje mezi odhadnutým stáním jen jeden pruh 2,5 m. Vozovka v pěší
   zóně (`highway=pedestrian`) zůstává vozovkou, bez tagu `lanes` jako jeden obousměrný pruh.
8. Svodidlo z technické mapy s osou silnice na obou stranách rozdělí plochu vozovky a vznikne **dělicí pás** 0,6 m.
   U ulice ze dvou jednosměrných os se stejným jménem (protisměrných) se střed řezu posune doprostřed mezi ně
   (třeba na tramvajový pás), dosah se měří odtud a zeleň mezi vozovkami profil neukončí.
9. Klik do mapy posune řez po ulici aspoň 15 m od křižovatky a 6 m od přechodu (tažený řez zůstane, kam ho dáte).
10. Kde technická mapa pod osou ulice nemá zpevněnou plochu (pole, louka, zeleň, díra v MTVU), profil je odhad
    z OSM a aplikace to napíše. Parkoviště MTVU (704) široké aspoň 8 m profil ukončí jako okraj „parkoviště".
    Úsek useknutý dosahem se celý ponechá nebo vynechá, když by z něj zbylo méně než 1,5 m.
    Plot nebo zeď (technická mapa: ploty a zdi nad 0,3 m; OSM: fence, wall, hedge) za krajní vozovkou
    profil ukončí jako okraj „plot“; plot do 1 m od fasády budovy ale okrajem zůstává budova.
11. Server neukládá do cache chybové odpovědi IPR a dotazy na IPR vzdá po 20 s.

## Návrh: šířka ulice a pravidla

V Návrhu se hlídá šířka ulice ze stavu: když ji návrh překročí nebo nevyplní, objeví se upozornění
a tlačítko Dorovnat (rozdíl dostane vybraná, jinak nejširší část). Šířky částí se porovnávají
s Manuálem tvorby veřejných prostranství IPR, kap. C.2 (`public/rules.js`): červeně pod minimem
(chodník 1,5 m, pruh 2,5 m, cyklopruh 1,5 / 1,75 / 2 m podle stání vedle, podélné stání 2 m, kolmé
4,5 m, dvoukolejný tramvajový pás 6,5 m…), oranžově pod základní šířkou (chodník 2 m, pruh 3 m,
kolmé stání 5 m…). Kliknutím na upozornění se část vybere.

## Export do Streetmixu

Tlačítko **Streetmix ↗** převede aktuální profil (stav nebo návrh) na ulici Streetmixu (schéma 35, metrické
jednotky; převod je v `public/streetmix.js`), pošle ji přes lokální server na `streetmix.net/api/v1/streets`
a otevře ji v novém okně. Ulice vznikne jako **veřejná anonymní** ulice na streetmix.net.

Barevný proužek pod každou částí ukazuje původ: zelená = změřeno z technické mapy,
hnědá = rozdělení podle OSM, červená = odhad, fialová = upraveno ručně.

## Publikace na GitHub Pages

Aplikace umí běžet i bez serveru: v `public/config.js` je `STATIC = false` (data přes lokální server s cache)
a při nasazení se přepíše na `true`. Prohlížeč se pak ptá služeb IPR a Streetmixu přímo (obě povolují CORS)
a dlaždice OSM čte jako statické soubory `data/osm-tiles/<ix>_<iy>.json`. Bez serverové cache trvá každé
načtení řezu podle IPR 1–10 s.

Nasazení dělá `.github/workflows/pages.yml`: při každém pushi do `main`, ručně a jednou týdně vyrobí dlaždice
OSM skriptem `tools/build_osm_data.sh`, přidá je k `pilot/public` a vystaví na GitHub Pages. Dlaždice se
do repozitáře neukládají. Jsou to data odvozená z OpenStreetMap, takže na webu leží pod ODbL 1.0
(viz `data/README.txt` na webu a patičku aplikace).

## Licence a uvedení zdrojů

- Kód: MIT, © 2026 Bára Soukupová (`LICENSE` v kořeni repozitáře).
- Ilustrace: © Streetmix, CC BY-SA 4.0 (`public/streetmix/LICENSE`). Upravené ilustrace musí zůstat pod stejnou licencí.
- MTVU a technická mapa: © IPR Praha (otevřená data IPR jsou pod CC BY 4.0; podmínky samotné služby gs-pub nejsou ověřené).
- OSM: © přispěvatelé OpenStreetMap, ODbL. Ortofoto: © ČÚZK.
