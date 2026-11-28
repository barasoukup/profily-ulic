# Česko (CZ): Praha, Brno, Jihlava, Most, Opava, Plzeň a další města

Stav nasazení: nasazeno (Praha a Brno 9. 11. 2026, celá ČR 10. 11. 2026, `https://streetspace.eu/profily/`). Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Zdroje dat

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

### Brno (nasazeno 9. 11. 2026, vylepšení rozpracovaná)

- Samostatná stránka `/brno/` ze stejného kódu (`app/public/city.js`, `config.js` CITY,
  `tools/city_site.mjs`). Lokálně http://localhost:5173/brno/. Popis v `docs/countries/CZ.md`.
- Bára: co nejméně věcí lokálně. Brno se jako Praha ptá služeb při kliknutí: plochy z MTVU města
  (gis.brno.cz ags3 PUBLIC/opendata_mtvu), linie a body z kresby technické mapy UMPS (opendata_umps),
  budovy z KAM. Lokálně dlaždice OSM a parkování z mapy parkovanivbrne.cz (Bára: otevřená data
  z 2/2024 vynechat, stáhnout aktuální mapu; oblasti nepoužívat, rozhoduje úsek u řezu).
- Úpravy výpočtu z Brna (dřív `city.fix`) platí od 25. 11. 2026 všude i v Praze.
- Záložní postup z veřejné DTM kraje (`tools/fetch_dtm_brno.sh`, `tools/build_dtm_brno.py`) si Bára
  přeje schovat pro města bez vlastní služby (DTM kraje má u velkých silnic chybějící obruby).
- Ilustrace (`app/public/brno/`): tramvaj Tatra T3 v nátěru DPMB (Bára: je hezčí; 45T a 13T nakreslené taky), autobus DPMB, mobiliář podle
  zásad KAM Brno. Bára: u 13T i 45T není kolem čelního okna svislá červená, jen vodorovný červený pás pod oknem.
- Test 100 řezů: `evaluation/brno/REPORT.md`, skripty `evaluation/run_brno.mjs`, `render_brno.mjs`.
- Otevřené: licence služeb města (MTVU, UMPS), úseky placeného stání jsou z 2/2024.

### Jihlava (lokálně hotová 9. 11. 2026)

- Stránka `/jihlava/` ze stejného kódu (`city.js` „jihlava“, `tools/city_site.mjs`), lokálně
  http://localhost:5173/jihlava/. Popis v `docs/countries/CZ.md`, kontrola řezů v `evaluation/jihlava/REPORT.md`.
- Jako Praha s IPR se při kliknutí ptá serveru města (`gis.jihlava-city.cz`, CORS povolený): pasport komunikací
  (vozovka, chodník), budovy RÚIAN s počtem podlaží, trávníky, katastr (zahrady, dvory, krajnice; Bára: zaplnit
  „Neurčeno“), parkovací místa města s orientací, ploty z technické mapy, stromy, lampy, zastávky s přístřešky,
  stojany na kola. Služby vracejí WGS 84 jinou transformací (6 m vedle OSM): dotazy s `datumTransformation=1623`.
- Lokálně jen dlaždice OSM (výřez z Geofabriku ČR přes osmium, BBBike Jihlavu nemá).
- Ilustrace (`app/public/jihlava/`): trolejbus Škoda 32Tr a autobus Citelis DPmJ podle Bářiných fotek (krémová,
  červený pás, u 32Tr černé čelo s béžovou linkou). Trolejbus jen v bus pruhu pod trolejemi (OSM `trolley_wire`).
- Pravidla doplněná při Jihlavě, platí všude: obousměrka od 5,0 m na 2 × 2,5 m (Manuál C.2, nižší intenzity);
  dvousměrná ulice s jednou osou má polovinu pruhů každým směrem; krajnice jednosměrné vozovky u vnějšího okraje;
  řez 12 m od kruhového objezdu a obratiště; při „Otočit“ si domy nechávají barvy.
- Otevřené: klik přímo na kruhový objezd, kolmé stání mimo regulované zóny, přechody, troleje, zóny, jihlavský
  mobiliář.

### Most, Opava, Plzeň (lokálně hotové 9. 11. 2026)

- Každé malé město = modul `app/public/towns/<město>.js` (vzor Jihlava), texty v `city.js`, stránka, CSP a výřez OSM
  v `tools/cities.mjs`; nasazení a server berou seznam odtud. Postup pro další město v `docs/countries/README.md`.
- Bára vybrala z průzkumu 27 měst (Plzeň, Opava, Most; další připravená: Třebíč, Karviná a Frýdek-Místek přes WFS T-MAPY).
- Domy všech malých měst z RÚIAN ČÚZK (rok dokončení a panely místo stáří zástavby; Bára: Most má jen mladou zástavbu),
  vnitřní město a sídliště podle `innerKm`/`estateKm` města.
- Posun souřadnic: Most sedí, Opava 4 m a Plzeň 12 m bez `datumTransformation=1623`.
- Ilustrace podle fotek z Wikimedia Commons: Most tramvaj EVO2 a SOR NB 12, Opava 32Tr a Iveco Urbanway, Plzeň 40T, 26Tr a SOR NS 12.
- Otevřené: licence služeb měst, kolmé stání mimo zóny, Most bez stání s orientací, Plzeň bez os kolejí a lamp.
- Pardubice (9. 11. 2026): bez služeb města, plochy živě z celostátní technické mapy ČÚZK (`app/public/dmvs.js`,
  obrázek + typ plochy v bodě), univerzální cesta pro další města (Bára: „univerzálně pro všechna města“). 26/22/1 z 49.
- Plzeň: zóny placeného stání z otevřených dat (CC0, statický soubor při nasazení), stání v zóně se kreslí jako odhad.
- Dopravní značení: technická mapa (ani ČÚZK) ho nemá; Praha jen OSM nebo žádost podle zákona 106 (Bára: záloha).
- Dopravní značení z pasportů T-MAPY (pakom WFS, 10. 11. 2026): Děčín prázdné (jen kresba), Jablonec 30 čar, Tábor 178
  čar; svislé značky celé (tisíce, s kódem). Bára: moc by to nepřineslo, neřešit.

### Pasporty dalších měst (Bára 16. 11. 2026, A/B 26. 11. 2026)

- Komunikace Rožnova p. R. (`towns/passports.js`, hranice `passports.json`) nad DTM ČÚZK
  ve „cesko“; pasport bez ploch v okolí nechá řez DTM. A/B po odstávce DMVS (`evaluation/PASSPORTS-AB.md`, výsledky):
  vyřazené Chomutov (bez pasportu lépe 33 : 8), Šumperk (4 : 4), Litoměřice (6 : 5), zeleň Prachatic (2 : 1) a Roudnice
  (9 : 0); Chotěboř vyhrála (4 : 1), ale vyřazená kvůli licenci (vrstva na soukromém účtu „ArcGIS Demo portál“, ne
  města; Bára 26. 11. 2026); Šlapanice vyřazené po slepém A/B na nových řezech 12 : 12 (Bára 26. 11. 2026,
  `evaluation/archive/passports-blind/REPORT.md`; i z kreditu), Kuřim (osy zimní údržby se šířkou) po témže A/B 14 : 16 (taky i z kreditu); jména v `passport-names.js` zůstala kvůli kreditu uložených řezů. Nápad: vozovku pasportu ořezat na kus pod osou.

### Po odstávce DMVS (ověřeno 26. 11. 2026)

- DMVS i WFS krajů po přechodu na JVF DTM 1.5 fungují (Komenského ve Vysokém Mýtě, `tools/check_sources.mjs` česká
  města ok). Jihomoravský kraj v obytných ulicích Kuřimi DTM nemá (odhad z OSM).
- Jihlava: pasport komunikací je zase plný (26. 11. vrstva 112: 13 323 úseků), náhrada nebyla potřeba.
- Záchranná síť má české řezy DTM: `evaluation/replay/sample-cz.json` (`node evaluation/replay/sample.mjs cz`), nahrávka
  `rec-cz` (`evaluation/replay/README.md`).

## Popis zdrojů a pravidel (dříve app/README.md)

### Odkud jsou data (Praha)

- **Šířky:** IPR Praha, *Mapa technického využití území* (MTVU), služba
  `gs-pub.praha.eu/.../dtmp/dtmp/MapServer/15`. Odpovědi se lokálně ukládají do `app/cache/mtvu`,
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

### Brno

Stejně jako Praha se Brno ptá služeb města při kliknutí (přímo z prohlížeče, služby povolují CORS). Úpravy výpočtu,
které vznikly v Brně, platí od 25. 11. 2026 všude i v Praze (`derive.js`, `city.fix` zrušené,
`evaluation/archive/unification/praha/REPORT.md`): obslužná cesta (`service`, ne vjezd ani parkoviště) je křižovatka
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
  (`tools/build_parking_brno.mjs`, `data/brno/parking/`); export na data.brno.cz je starší. Oblasti
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
  lampy z otevřených dat; stání s orientací město nemá. Datum sedí. Kontrola 57 řezů: `evaluation/most/REPORT.md`.
- **Opava** (`mapy.opava-city.cz`, složka `external`): plochy z účelové mapy povrchové situace
  (`info_dtm_plochy_find/0`, pole `POPIS`; vozovky ulic jsou čtyři polygony přes celé město, tři s chybným popisem,
  čtou se zvlášť a zjednodušené), stání placených zón (`dopr_zps`), stromy, lavičky, kryté zastávky, stojany.
  Služby jsou 4 m vedle OSM, dotazy s `datumTransformation=1623`. Kontrola 50 řezů: `evaluation/opava/REPORT.md`.
- **Plzeň** (`ags.plzen.eu`): technická mapa ve struktuře JVF DTM (`GIS_DTM/GIS_DTM_ZPS_kesovana/FeatureServer`,
  jeden dotaz na asi 45 vrstev ploch a linií), 3D budovy s výškou okapu a hřebene (`GIS_3D_budovy`), stromy,
  lavičky, stojany a sloupky z pasportů, ortofoto 2024. Služby jsou 12 m vedle OSM: dotazy s 1623, kde to vrstva
  nepřijme, posun vstupu. Osy kolejí město nezveřejňuje (z OSM), tramvajová tělesa jsou výchozí z panelů.
  Zóny placeného stání z otevřených dat (CC0, `tools/build_zones_plzen.mjs` při nasazení): podél čáry zóny se
  u obrub nakreslí stání 2 m jako odhad. Kontrola 50 řezů: `evaluation/plzen/REPORT.md`.

### Pasporty dalších měst (16. 11. 2026)

Ve zbytku Česka („cesko“) se v hranicích jedné obce (`app/public/passports.json`, `node tools/build_passports.mjs`)
berou plochy z pasportu města a jinde DTM ČÚZK (`towns/passports.js`, `towns/overlay.js overDmvs`): komunikace
Rožnova pod Radhoštěm (T-MAPY PaKom); Šlapanice a Kuřim (osy zimní údržby se šířkou) vyřadila Bára 26. 11. 2026 po
slepém A/B na nových řezech (12 : 12, 14 : 16), i z kreditu. Pasport, který v okolí řezu nic nemá, nechá řez technické mapě. Nejsou
to samostatná města (texty, ilustrace a mapy zůstávají české obecné). Zdroje našlo vlákno o Slovensku, do aplikace
šly před A/B testem; A/B 26. 11. 2026 (`evaluation/PASSPORTS-AB.md`) nechal čtyři a vyřadil Chomutov, Šumperk,
Litoměřice a zeleň Prachatic a Roudnice nad Labem (nevyhrály); Šlapanice po slepém A/B na nových řezech (12 : 12); Chotěboř vyřadila Bára kvůli licenci (vrstva na demo
účtu, ne města; uložené řezy s nimi si kredit nechají,
`passport-names.js`). Export uvádí „pasport komunikací © <město>“.
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

- **DTM krajů z WFS** (`app/public/dtmwfs.js`): v devíti krajích s DTM od T-MAPY (Jihočeský, Pardubický,
  Vysočina, Moravskoslezský, Královéhradecký, Jihomoravský, Liberecký, Karlovarský, Zlínský) dává mapová služba
  kraje WFS 2.0 se skutečnými polygony (`…/mapservice/v1/wms/dtm_zps_plochy_bar`, GML v S-JTSK, CORS). Kraj řezu
  se pozná podle `regions-cz.json` (`node tools/build_regions_cz.mjs`), jeden dotaz, kliknutí medián 0,65 s. A/B 137 řezů
  proti obrázkům DMVS: lepší 6, horší 3, jinak stejně; ploty a zdi z WFS se nepřipojují (uříznou chodníky).
  `evaluation/archive/dtm-wfs/REPORT.md`.
- **Obrázky IS DMVS ČÚZK** (`app/public/dmvs.js`): jinde, při chybě WFS nebo když do 1,5 s neodpoví. Služba
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
  Testy: `tests/outages.test.js`; týdenní kontrola živých služeb viz Publikace.
- Pardubice (`towns/pardubice.js`) nemají vlastní služby, mají jen vlastní ilustrace. Kontrola 49 řezů:
  `evaluation/pardubice/REPORT.md`.

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
  DTM kraje má stejné díry jako DMVS (22 ze 47 řezů bez ploch). A/B: `evaluation/budejovice/REPORT.md`.
- Bez vlastního zdroje zůstávají Olomouc, Zlín, Havířov, Třinec, Prostějov, Znojmo, Kroměříž (jen WMS nebo nic).
- Dopravní značení z pasportů T-MAPY (Děčín, Jablonec, Tábor) je příliš řídké.
