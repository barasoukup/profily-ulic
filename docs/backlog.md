# Seznam ke kontrole a vylepšení

Bára 21. 11. 2026: „vést seznam věcí na kontrolu nebo vylepšení v jednotlivých oblastech, ke kterým se pak můžeme
vrátit“. Každá položka krátce: co, kde se to ukázalo, odkaz na zprávu. Hotové škrtnout s datem, nemazat hned.
Co rozhodne Bára, je označeno **(Bára)**.

## Odhad profilu (ortofoto a OSM, společný kód)

- ~~Most v odhadu jako voda: bez mapy povrchů řeže řez most podle vody pod ním (Most Kotlarski v Krakově,
  `evaluation/poland/ab/`). Most z OSM (`bridge`) má mít přednost před vodou.~~ Hotovo 26. 11. (`ortho-osm.js`,
  `?off=mostvoda`; 27 mostů: lépe 18, hůř 0; regrese beze změny; `evaluation/bridge-water/ZPRAVA.md`). Zbývá: zeleň ze
  snímku na mostě nad zelenou řekou (Turín) a ~~mezera mezi dvěma oddělenými mosty~~ (hotovo: mostovky `man_made=bridge` v dlaždicích, větev bridge-edge 27. 11., `evaluation/bridge-water/edge/ZPRAVA.md`; po nasazení
  přestavět balíky OSM). Zbývá z toho: jiná ulice na vedlejší mostovce (e-34 Bruggy, řez končí uprostřed komunikace) a
  krajní chodník užší než na ortofotu, kde je mostovka OSM nakreslená hrubě.
- Úzké ulice: jeden široký pruh a chybějící stání (Brusel Rue aux Choux 10,4 m, Rue du Vautour 6,6 m, Antverpy
  Koninginnestraat 5,4 m; stejně dřív Rakousko a Německo). Proč se u jednosměrky s jedním pruhem zákonné stání nepřidá,
  když místo je (`evaluation/universal/ZPRAVA.md`, Belgie).
- Strop šířky pruhu 4 m (4,5 místní) neplatí u map povrchů: Kraków kr24 pruh 4,9 m, kr31 4,62 + 4,48 m.
- Chodník s cyklostezkou (`segregated=yes`) se dělí přesně napůl (`derive.js sidewalkUse`). Někde to odpovídá (Most
  Kotlarski), jinde ne: šířka z OSM `width` nebo z norem státu, případně hranice podle červené barvy na ortofotu.
  Napřed ověřit na ortofotu, jak to opravdu vypadá (Bára 21. 11. 2026).
- Ortofoto: rozeznat vodorovné značení od nevyježděných světlých pásů (Bára 12. 11. 2026, řez 324 v Hradci).

- Francie (měření 22. 11., 25 řezů): v odhadu často chybí chodník (10×) a přebývá stání (8×); prověřit na řezech
  `evaluation/universal` (fr-*), zda jde o úzké chodníky u fasády nebo o zákonný odhad stání.
- Chodník mezi obrubou a domem (hlášení 23. 11., regrese s domy z RÚIAN): stín domu přes chodník a stání (Spojovací)
  nebo přes vozovku (U libušské sokolovny) se bere jako chodník či obruba, suchý hnědý trávník jako chodník (Kukelská),
  podélná spára uprostřed vozovky jako obruba (Dářská). Pokusy `walkSatOn`, `walkYellow`, `walkMode`, `split6` znovu
  změřené s RÚIAN: nic nevyhrálo všude. Spíš model (`ai-kerbs`, `ai-segmentation`) než další pravidla.
- Silnice 230 u Mariánských Lázní (`#rez=50.037075,12.789854,37`): vozovka 6,5 m, ortofoto našlo jen jeden pruh 4,74 m
  a krajnici 1,76 m (chybí středová čára?).
- ~~Poznámka pod nadpisem říká „domy z OSM“, i když jsou od 23. 11. v Česku z RÚIAN: nový text ve všech jazycích.~~
  (26. 11. 2026: „domy z {houses}“ podle zdroje fasád, `ortho-osm.js houseSources`: RÚIAN, GRPK s OSM, jinak OSM)

- Sjednocení, zbývající kandidáti (`evaluation/sjednoceni/AUDIT.md`): `besideMax` (SK 15 m, jinde 25 m; A/B na Slovensku),
  `roadOnPath` (jen Praha; zkusit na DTM ČÚZK a mapách měst), `roadClassFromOsm` (CZ, SK; jen norma varování, výklad
  **(Bára)**), `orthoEstimate` (jen text, totéž co `laneOrtho !== "none"`).
- **(Bára)** Kliky (`evaluation/kliky/ZPRAVA.md`): „nesplnitelné obslužné vynechat“ (mapy 32 : 13, naslepo 17 : 19; na obslužných cestách
  9 : 2 a 7 : 2, změřit znovu), kliknutí do 2 m od osy obslužné cesty skončí na ulici do 10 m (`nearestStreet` přirážka),
  konec cesty, kde ulice pokračuje, posouvá kliknutí o 12 m (bez něj 37 : 209 proti mapám).
- ~~Pravidlo obslužných cest (`?off=obsluzne`) v Berlíně proti jeho mapě 10 : 12, jediné město, kde nepomáhá
  (Vídeň 16 : 9, Amsterdam 11 : 4, Helsinky 13 : 7; `evaluation/sjednoceni/praha/ZPRAVA.md`).~~ (25. 11. 2026: znovu mapa 13 : 2, naslepo 6 : 8, zůstává zapnuté)
- Zákonné stání po pruzích: ~~`layLaw` nebere `pruh_piktokoridor`, `markIslands` udělá z chodníku dělicí pás, jednosměrka na dva pruhy ztratí
  zákonný pruh~~ (25. 11. 2026, `mereni2/ZPRAVA.md`). Zbývá: **(Bára)** nechat `lawlanes` zapnuté (34 : 21, oficiálně 1 : 3)?
  **(Bára)** odhad stání na Slovensku (12 : 7); model pod stromy auta nevidí (Zaragoza); slabé čáry dělí pruhy i v
  obousměrce (nl-schiedam-5) a kde se stání vejde (fr-toulouse-2); `parkFromAi` nebere piktokoridor; Belgie 2 : 5.
- ~~Uložený řez dvouvozovkové ulice se chytí jiné cesty OSM (odkaz nemá `wayId`): 10 z 226, jiný profil u 7~~ (25. 11. 2026:
  cesta je v odkazu; všech 10 se chytí své, `mereni2/ZPRAVA.md`).
- ~~Odkaz `#rez=` zaokrouhluje azimut na celé stupně~~ (25. 11. 2026: jedno desetinné místo, `share.js linkBearing`; staré odkazy
  beze změny, Worker i starší stránka desetinu berou).
- Vzhled domu ze všech budov OSM v Rakousku: druhý čerstvý vzorek 13 : 9, všechna kola 19 : 18, nerozhodně (`evaluation/all-buildings/ZPRAVA.md`); Bára 25. 11. 2026: zůstává společné pravidlo, bez výjimky. ~~Zúžit poválečný dům z tvaru bloku kolem dvora~~ (25. 11. 2026: celkem 47 : 50, AT 17 : 10, CH 9 : 14, FI 1 : 7; není v aplikaci, `yard-rule.patch`).

## Mapy povrchů a data měst

- ~~Prešov: vrstvy `vw_dp_*` za tokenem~~ (Bára 25. 11. 2026: pasport vyřazený, zůstaly stromy a čáry mapy; kdyby se vrstvy vrátily, kód je v historii).
- Nizozemsko: BGT kreslí červené cyklopruhy na vozovce jako „fietspad“ (měření: 13× cyklostezka navíc). Pokus
  `?fietsstrook=1` nepomohl; zkusit jinak (barva na ortofotu, OSM `cycleway=lane` a šířka).
- Nizozemsko: Nassauplein v Haagu (střední pás přes 16 m) dostane odhad místo BGT, vozovky jsou dál než 10 m.
- Nizozemsko: parkovací místa Amsterdamu (`?amspark=1`): spojit jednotlivá místa do souvislých úseků (mezery do 1 m),
  způsob stání brát pro plochy BGT. Licence města neuvedena.
- Krakov: A/B mapy povrchů slabé (lépe 7, hůř 6), od 26. 11. 2026 vypnuto (`?krakow=1`). Přepustit A/B po vrácení
  „Ścieżky“ na chodník, kdyby přišel souhlas MSIP.
- Belgie: A/B čar GRB a PICC slabé (lépe 4, hůř 2): zapnuto.
- Flandry, plochy GRB (WBN + WGO, `evaluation/belgium/ab-wbn/ZPRAVA.md`, lépe 10, hůř 2): zóna za obrubou je jedna,
  s OSM `cycleway=track` vzniká „chodník s koly“ místo chodníku a cyklostezky (ge1, lex1); ulice v jedné úrovni
  (obruba jen na jedné straně) dál odhadem; bulváry se souběžnými cestami (mex2) hrubě.
- Polsko: ortofoto GUGiK bez vlastního A/B (je v obou ramenech).
- ~~Paříž: u fasády často pruh „plocha“ 0,65 m (mezera mezi budovou z OSM a chodníkem Plan de voirie)~~ (26. 11. 2026:
  sdílené pravidlo proužku u fasády, `evaluation/facade-strip`; BD TOPO není blíž než OSM; soukromé bloky Plan de voirie
  sedí na chodník do 0,2 m, ale slepé A/B jen 5 : 2, vypnuté `?ilots=1`, `evaluation/france/facade/ZPRAVA.md`). Zbývá:
  ustoupená přízemí a předprostory (blok končí u chodníku, dům dál).
- ~~Paříž: široká vozovka „pruh 4 m + krajnice“, ztracený buspruh, bulvár s promenádou~~ (23. 11. částečně:
  `evaluation/france/ab/bulvary/ZPRAVA.md`). Zbývá: krajnice u 10 z 26 bulvárů (široké vozovky bez čar na ortofotu IGN;
  zkusit pařížský PCRS 5 cm, jen soubory), řez v ústí boční ulice (Sébastopol) a na cyklostezce za koncem bulváru
  (Magenta), Quai aux Fleurs bere i nižší ulici za zdí, chybějící vrstvy mapy (ostrůvky, oddělovače, rampy). Cílené řezy:
  mosty přes Périphérique, nábřeží. Evidence stání: Rue Fromentin, Chaufourniers, Place des Alpes ztratily odhad stání
  (evidence tam nic nemá); ověřit na fotkách.
- Francie: šířky vozovek BD TOPO (`?sirka=1`) bez A/B; další města s mapou povrchů (Lyon `pvochausseetrottoir`,
  Bordeaux, Nantes, Toulouse) neprověřená.
- Španělsko: Zaragoza, vozovka jako pás kolem os OSM přesahuje přes trávu, kterou mapa nemá (zg12); A Coruña (vozovky,
  chodníky, stání 1 : 500, licence nejasná): Bára 23. 11. nechce se ptát, zatím nepoužívat; Valencie (obruby s typem okolí, vodorovné značení) zkusit znovu;
  Madrid jen obrázek (čtení barev jako `dmvs.js`?); ortofoto ICGC 25 cm 2025 v Katalánsku ostřejší než PNOA (hranice
  Katalánska); měření: chybí chodník 10×, stání 8× (`evaluation/universal`, es-*).
- Portugalsko: chybí stání (16×, často kolmé) a chodník (13×) v měření; stání EMEL Lisabon (12 tisíc úseků s orientací,
  CC BY-SA) a buspruhy Porta (CC0) jen jako statické soubory při nasazení; ortofoto Madeiry (IRIG, licence neuvedená) a
  Azor (bez CORS, jen podklad mapy); ~~Monako~~ (23. 11. přidáno), Andorra bez ortofota odložit.
- Španělsko **(Bára)**: vrstva PNOA v mapě ukazuje i Melillu (snímek Airbus, licence nevyjasněná; pruhy se tam už nečtou):
  Melillu z vrstvy vyjmout (`ES_NOT_PNOA`), nebo uvést Airbus?
- ~~Španělsko: Catastro se ptá i v Baskicku a Navaře (recenze, nález 5)~~ (Bára 23. 11. 2026: vynecháno podle hranic NUTS 2
  GISCO, `regions-es.json`, enkláva Treviño zůstává Burgosu)
- Španělsko: foralní katastr Álavy má proti OSM soustavně o 2 podlaží víc (`evaluation/spain/foral-ab/ZPRAVA.md`):
  ověřit na fotkách z ulice; potvrdí-li se nadhodnocení, vypnout `ar` ve `FORAL_ON`. A/B Pamplony bez OSM (Navarra
  chybí v lokálním výřezu i v balíku R2): zopakovat srovnání s OSM, až bude balík Navarry.
- ~~Španělsko: rok z katastru dává v `buildingStyle` české vzhledy „sorela“ a „typový dům“~~ (vyřešeno 23. 11. 2026 v 130f161:
  socialistické vzhledy jen v CZ, SK, PL, EE a bývalé NDR, jinde poválečný dům; hlídá `tests/house-looks.test.js`).
- Španělsko **(Bára)**: Catastro („Dirección General del Catastro“) je jen v patičce, ne v kreditu exportu: přidat klíč
  zdroje (když `podlaznost` vrátí dům z katastru)?
- Portugalsko **(Bára)**: krátký popis dat „ortofota DGT a OSM“ neplatí na Madeiře a Azorech (jen OSM): nechat, nebo
  „ortofota DGT (jen pevnina) a OSM“?
- Kypr **(Bára)**: kredit ortofota v exportu bez roku („ortofoto © DLS Kypr“): doplnit „, 2019“ jako v patičce?
- ~~Kypr: kredit budov DLS je v exportu u každého kyperského řezu; kredit britských značek se počítá ze Stavu, ne ze značek
  přidaných v Návrhu~~ (26. 11. 2026: `cyDls` jen s domem z DLS, `exportSources` bere značky Stavu i Návrhu).
- ~~Kypr: `lanes-ortho.js` „cy“: napůl chybějící dlaždice (404 u Zelené linie) dávají jas 0 místo NaN (vyplnit NaN nebo
  hlídat podíl prázdna). Malta: WMS vrací chybu jako 200 `text/xml` (hlídat content-type, hlásit výpadek); podklad mapy
  jako JPEG místo PNG (`app.js`). Kypr i Malta: `streetmix.js` neposílá `leftHandTraffic`.~~ (26. 11. 2026: průhledný
  pixel = NaN, víc než polovina neznámá = žádný obraz, „cy“ v kontrole prázdna; XML místo obrazu = výpadek (`askImage`; od 26. 11. 2026 po nepřátelské recenzi „bez snímku“, viz níže);
  podklad Malty uvnitř JPEG, u pobřeží PNG jako Slovinsko; `leftHandTraffic` z `country.leftHand`; `tests/ortho-tiles.test.js`)
- Kypr **(Bára)**: ~~chodník 2 / 2,5 m (doporučení)~~ (23. 11.: bez červené, oranžově podle třídy ulice); 3 m na směr vedle stání; jednosměrka: stát jen vlevo?; protisměrní
  cyklisté ~~bez tabulky~~ (23. 11.: bez značky); zóna 30 nekreslit; pěší zóna jako „povinná pěší cesta“. Sever ostrova jako samostatný stát
  (zatím nemáme). Měření: chybí chodník 9×, stání 5×.
- Malta **(Bára)**: ~~volná šířka DC15 (4,1 / 3 m), nebo 3 m na směr?~~ (23. 11.: v kódu větší z DC15 a 2,5 m na pruh);
  ~~chodník 1,2 / 1,5 m?~~ (23. 11.: 1,2 m oranžově; Table 1A přečíst jako obraz); cyklo, BUS a pruhy bez
  varování, nebo britské normy (LTN 1/20)?; podélné stání 2,4 m (standard parkovišť) zatím ne; zákaz stání jako II.D6
  „No waiting“. Výškový model 2018 (1 m, CC BY 4.0) by šel na výšky domů.
- Itálie: další regiony, jak budou otevírat ortofota (Lombardie a Ligurie mají služby rozbité, Benátsko a Sardinie
  neodpovídají, Furlansko a Trento bez CORS, Apulie 2023 bez licence); plochy silnic Bologni rozdělit čarami obrub; dílčí
  nálety Emilie-Romagny 2023–26 (CC BY 4.0) zapojit podle jejich pokrytí.
  **(Bára)**: chodník 0,9, nebo 1,5 m?; ~~pruh podle kategorie silnice?~~ (23. 11.: podle třídy z OSM 3,25 / 3 / 2,75 m);
  jednosměrka II.349, nebo II.348?
- ~~Itálie **(Bára)**: kredit Turína „© Città di Torino (CC BY 4.0)“ je výklad; podmínky geoportálu chtějí znění „Base
  cartografica realizzata da …, integrata con … della Città di Torino reperiti sul Geoportale del Comune di Torino“: přepsat?~~
  (Bára 23. 11. 2026: ano, kredit, mapa i patička ve znění Geoportálu)
- Itálie: italská značka zastávky (modrá čtvercová s autobusem) místo rakouského „H“; mapa povrchů Bologni (vypnutá):
  `records` končí bez varování na 500 plochách, výplň „zbytek je chodník“ rozdělit čarami obrub, než se zapne; 3,50 m pro
  pruhy s autobusy mimo vyhrazený pruh (D.M. 2001 bod 3.4.2) aplikace nepozná; ~~hranice obcí GISCO 1 : 1 M nahradit
  přesnějšími (ISTAT nebo OSM)~~ (Bára 23. 11. 2026: ISTAT, `tools/italy-border.json`); měření jen 6 řezů (`evaluation/universal/ZPRAVA.md`), rozšířit.
- Estonsko: normy rozhodnuté (Bára 23. 11. 2026: chodník 2,0, pruh 2,75, 3 m na směr, pěší zóna 381 + 432, stání a tramvaj
  bez varování). Normy nekupujeme (Bára 23. 11. 2026: EVS 843 jen z druhé ruky). Mapa povrchů Tallinnu zapnutá (pole `kate` nevyužité, tl38 ztratil střední pás);
  plochy úklidu Tartu (`Puhastusala`) by šly stejně, A/B. Stáří ortofota
  v kreditu je „stav 11/2026“ (dlaždice míchají nálety), přesnější rok by chtěl metadata snímků.
- Slovinsko (Bára 23. 11. 2026, rozhodnuto podle doporučení): značky volně jako ve Francii (Commons PD-Slovenia-exempt;
  kresby většinou podle pravidla 2000, obrázky pravidla 2024 neověřené; rychlosti mimo 40 z české B 20a); mapa povrchů
  Lublaně není a ptát se nebudeme (zůstává odhad z ortofota a OSM); stání na obousměrce jen se středovou čárou (OSM
  `lanes` ≥ 2) podle zákona, zůstává přísné; katastr počítá obytné podkroví jako podlaží: ~~opravit podle výšky~~ (hotovo 23. 11.: H2 − H3 < 3 m ×
  podlaží + 2 m u 2–4 podlaží, správně 31 → 37 z 54, polovinu podkroví nenajde; přesněji jen s výškou okapu);
  vzhled jugoslávské moderny (Fužine, Štepanjsko naselje, Maribor Tabor, Velenje) jako nápad na později, zatím
  „povalecny“ (Bára: Jugoslávie nemá socialistické typy); rok náletu DOF025 služba nedává (kredit „stav 11/2026“);
  sítě GJI (3D trasy) na později.
- Estonsko, zbytky recenze 24. 11. 2026 (129abaf): Sõpruse pst a Ehitajate tee s mapou Tallinnu dávají deset pruhů po 4 m
  (slabina mapy, A/B 10 : 4); dotazy na Tallinn podle obdélníku města, ne podle jeho hranice; nadpis „Šířky podle estonských
  předpisů“ (`city.js`) není přesný; u odhadu stání chybí „orientačně“; ~~`ee` chybí mezi ortofoty hlídanými na prázdný snímek
  (`lanes-ortho.js`)~~ (26. 11. 2026); dotaz městu na licenci neodeslán. Bod 6: univerzální měření je přepočítané, vzorek jen 12 řezů.
- Slovinsko, zbytky recenze 24. 11. 2026 (982927a): chybí poznámka v řezu, že model obrub nedostal ortofoto (`app.js`); A/B
  s ortofotem a bez něj; pravidlo podkroví (`?off=podkrovi`) na nových domech naslepo; čísla značek proti obrázkům pravidla
  26/2024; přesná pozemní hranice GURS; čtení středové čáry z `lanes` ≥ 2 a 3 m k plné čáře **(Bára)**.
- Finsko, zbytky recenze 24. 11. 2026 (edfdd21): ~~proužek „plocha“ do 1,5 m u fasády přičíst k chodníku (`besidePassport`)~~
  (26. 11. 2026: `ortho-osm.js facadeStrip` pro všechny mapy povrchů, slepé A/B 12 : 1, `evaluation/facade-strip`);
  obrázky prvního A/B v gitu; prodleva při psaní do hledání (`search.js`); Karesuando u Švédska (řešit se Švédskem);
  Ryhti má jen „07 veřejná budova“ (škola a kostel se nepoznají).
- Dánsko, zbytky recenze 24. 11. 2026 (f55df4b): Bornholm bez vlastních vzhledů domů (chybí fotky); plocha stání kdekoli
  v okolí vypne odhad stání na obou stranách, i ve Frederiksbergu (bod 14); ~~dlaždice ortofota 400/429 nechávají černé díry
  (`lanes-ortho.js`)~~ (26. 11. 2026: díra je NaN, 429 se po pauze zeptá jednou znovu, `askImage`); kredit ortofota ověřit po 30. 11. na nové platformě; čára `Cykelsti langs vej` jako vnější hrana
  cyklostezky nezapojená (`ortho-osm.js`); A/B kodaňských vrstev nebylo slepé; titulek a kredit jeho obrázků.
- Jih Evropy po Itálii **odložen** (Bára 23. 11. 2026): Balkán, Řecko, Slovinsko. Až se k nim vrátíme: Albánie (ortofoto
  v albánských souřadnicích, ověřit stupně), Chorvatsko (jen přes proxy, západ), ~~Slovinsko (služby GURS neodpovídaly)~~ (přidáno 23. 11. 2026 přes `ipi.eprostor.gov.si`);
  ostatní bez otevřeného ortofota (`docs/states-survey/c-vychod-balkan.md`).
- ~~Jihlava: pasport komunikací byl 16. 11. prázdný, ověřit~~ (26. 11. 2026: zase plný, 13 323 úseků).
- ~~Pasporty devíti českých měst: A/B po odstávce DMVS~~ (26. 11. 2026, `evaluation/PASPORTY-AB.md`: zůstaly Rožnov,
  Chotěboř, Šlapanice, Kuřim, Chotěboř pak vyřazená kvůli licenci; vyřazené Chomutov, Šumperk, Litoměřice, Prachatice, Roudnice).
- ~~Pasporty Rožnova a Šlapanic: vozovka pasportu přes dvory a sousední komunikace (20–27 m)~~ (26. 11. 2026: byla to
  bílá plocha DTM bez typu a parcela silnice RÚIAN kolem úzké vozovky pasportu; `towns/overlay.js trimGuessedRoads`,
  `?orez=0`, slepé A/B Rožnov 30 : 6, Šlapanice 13 : 3, kontroly 7 : 1, zapnuté, `evaluation/pasporty-orez`). Zbývá: široký polygon samotného
  pasportu (Rožnov č. 59, 63), úzká vozovka pasportu za chodníkem dělá z chodníku „dělicí pás“ (Chomutov, Šlapanice;
  `derive.js`). Kontroly Karviné: server `gis.karvina.cz` z Node často neodpověděl (fetch failed).
- Hlášení, která data IPR/ČÚZK potvrzují, bez fotky z ulice nerozhodnu (do seznamu připomínek pro IPR?):
  Strossmayerovo náměstí, jižní strana „nemá pruh pro auta“ (MTVU 701 3,5 m a úsek parkování TSK;
  `#rez=50.098778,14.433932,-83`); Libocká, „chodník V je užší, asi i jízdní pás“ (MTVU vozovka 4 m, zeleň, chodník 2 m;
  `#rez=50.090199,14.324922,-14`). Dřív: V Zeleni, Poncarova.
- Klánovická: stání z OSM (`parking=lane`) je teď podélné, ale široké 3,9 m podle hrubého polygonu OSM.
- Hospodářská půda (MTVU 100) pod nepojmenovanou služební cestou se kreslí jako „Zpevněná plocha“ 44 m
  (`types.js typeFromMtvu`: 100 → „plocha“); pojmenovaná cesta už jde na odhad (Devětsilová).
- DTM po přechodu na JVF 1.5 (19. 11.): typy se čtou z kódu JVF (číselník z vyhl. 393/2020, `dmvs.js JVF`); kód, který
  číselník nemá, se zahodí s varováním „neznámý typ“ v konzoli. ~~Uložené řezy `evaluation/replay` nahrát znovu~~
  (26. 11. 2026: `sample-cz.json`, 56 řezů DTM, nahrávka `rec-cz`). Srovnání DMVS (`evaluation/srovnani-dmvs`) má ještě
  staré odpovědi.
- **Kanada (Toronto, `evaluation/canada`):** řez uprostřed The Queensway (t-48) mapu nenajde; podium s věží, komerční domy a řady se kreslí jako
  `baygable`; A/B výšek domů (`?torontohouse=0`); mapa je z 2021, cyklostezky z OSM u křižovatky ulic ukrajují i sousední (1 z 9); kosé a kolmé
  stání bez norem; předpisy obcí kolem Toronta.
- **USA (San Francisco, 26. 11. 2026, `evaluation/usa/sf`):** šířka uličního prostoru s mapou o medián 2,5 m větší než
  u posuzovatelů na snímku Esri (bez mapy 0,4 m): ověřit na místě, kdo má pravdu **(Bára)**; ~~šikmé stání: digitální obruba ho
  nepozná vždy (Indiana Street dostala podélné 2,45 m, OSM říká šikmé), zkusit brát orientaci z OSM `parking:*:orientation`~~
  (26. 11. 2026, `evaluation/usa/sf/fixes`: A/B 30 nových řezů 12 : 11, **vypnuto, `?sfosmpark=1`**; značky OSM často neplatí
  pro místo řezu); ~~úzká vozovka, ve které po vykrojení stání nezůstane pruh (Lippard Avenue)~~ (osa ve vykrojeném stání,
  vozovku přechází jen chodník: `derive.js ownRoad`, `?axisroad=1`; mění 1 z 290 řezů pěti měst, nejde změřit, **vypnuto
  (Bára: zapnout bez měření?)**); tepny jen 8 : 4 (Fell Street, O'Shaughnessy
  Boulevard, Geary Boulevard); mapa chybí, kde uliční prostor nemá přes řez dvě obruby (3rd Street s tramvají uprostřed,
  Great Highway, obslužné cesty); data uličního prostoru 2014 a obrysů budov 2010 (posun asi 1,4 m na východ, řešeno
  pravidlem); podlaží z výšek obrysů neměřená; okolní okresy (San Mateo, Marin, Alameda) bez mapy povrchů zůstávají zavřené
  **(Bára: přidat jako odhad z OSM jako předměstí Washingtonu?)**; PCC linky F a lampa Path of Gold nezapojené **(Bára:
  PCC potřebuje tyčový sběrač místo pantografu, Path of Gold pravidlo jen pro Market Street)**; licence vrstvy obrub SFMTA
  (`MapServer/12`) bez vlastních metadat **(Bára)**; San Francisco Fire Code § 503 (místní šířky) nečten; ortofoto pro
  pruhy chybí (otevřené není).
- **USA (Washington, recenze a čerstvé měření 25. 11. 2026, `evaluation/usa/fresh`):** uličky mezi domy: mezera mezi polygony se
  čte jako zeleň, i kde je zpevněný dvůr, a bere soukromé dvorky za uličkou; rampy a dálnice (3 řezy, 44 : 63 %); klik v ploše
  „Intersection“ se jen ohlásí, neposune; čísla tabulek DEM 2023 a BFDG ověřit a dát s čísly stran; předpis o stání
  v Marylandu a Virginii; Photon nabízí i místa mimo metro (hláška řekne proč, jako Itálie); česká jména `?off=ulicky`,
  `pocetpruhu` jsou sdílená s `estonia`. Strana stání RPP: význam kódů `RPPSIDE` by musel říct DDOT.
- **USA (New York, 26. 11. 2026, `evaluation/usa/nyc`):** ~~licence: položky NYCmaps na ArcGIS Online mají „Limited to use
  defined by OTI“~~ (Bára 26. 11. 2026: používat; tytéž vrstvy jsou na NYC Open Data bez omezení, Admin. Code § 23-502, s kreditem
  zdroje a verze); ~~ortofoto NYS bez uvedené licence („available at no cost“)~~ (Bára 26. 11. 2026: používat s kreditem). **(Bára)** okolní okresy (Jersey City a Hudson County, Westchester, Nassau) jen s odhadem z OSM, nebo
  ne (teď ne: bez mapy povrchů, okolí Washingtonu a Toronta jen 51 %). **(Bára)** stání: zákonná volná šířka v New Yorku nedoložená
  (34 RCNY § 4-08, FC 503 nepřečtené), platí 3 m aplikace. Ostatní: Bishop's Crook (`newyork/lamp-bishop-*`) nemá kde se kreslit
  (aplikace má jednu lampu nad ulicí, do 5 m sloupkovou); stání v New Yorku je skoro všude, mapa ho nemá (je to vozovka) a odhad
  ho bere jen z aut na ortofotu, které má hluboké stíny mezi vysokými domy (~~rozdělit vozovku podle OSM~~: sdílený kód to
  dělá, OSM ale stání nemá, 0 ze 75 cest měření; **stání ze značek NYC DOT** `?nycsigns=1`, 26. 11. 2026,
  `evaluation/usa/nyc/park`: A/B 31 nových řezů 17 : 8, p 0,11, univerzálně 75 → 72 %, **vypnuto**; zkusit na novém vzorku
  bez dálnic a parkway a s „smí se stát“ před nejbližší značkou); pod nadzemním metrem (Queens Boulevard v Sunnyside,
  Roosevelt Avenue) mapa ulici pod středem řezu nenajde; inventář jízdních pruhů jako DDOT New York otevřeně nemá (DOT má
  „Street Design“ jen jako příručku); domy PLUTO (druh budovy) nezapojené, stačily obrysy budov s výškou a rokem.

- **USA (Boston, 26. 11. 2026, `evaluation/usa/boston`):** **(Bára)** mapa Bostonu a Cambridge celkově neprůkazná (27 : 21),
  na tepnách prohrává 8 : 15: mezera mezi polygony za chodníkem je zeleň i tam, kde je parkoviště, náměstí nebo dům (Street Edges
  nemá parkoviště, budovy podkladové mapy nejsou úplné), široká mezera mezi vozovkami je dělicí pás (b-14, 21 m). ~~Zkusit: mezeru
  uvnitř řezu za vnějším chodníkem posoudit ortofotem jako odhad~~ (26. 11. 2026, `evaluation/usa/boston/outer`: domy a parkoviště
  z OSM, zbytek ortofotem MassGIS, které je bez listí; A/B 52 nových tepen 18 : 16, **vypnuto, `?outergaps=1`**); ~~zkusit
  jen konec profilu u parkoviště nebo domu z OSM bez ortofota~~ (26. 11. 2026, `evaluation/usa/boston/outer-osm`: A/B 102
  změněných nových tepen 24 : 22, p 0,88, **vypnuto, `?outerosm=1`**; konec u parkoviště 4 : 3, prodloužení přes dům z OSM
  5 : 10); dělicí pás 21 m (b-14) otevřený; parkoviště Bostonu (BTD
  MunicipalParkingLots jsou jen městská).
  Nebo mapu jen pro místní ulice (nový vzorek). Ve všech variantách nejčastěji chybí stání (mapy ho nemají; BTD má značení
  `Cartegraph_BTD_readonly` LongMarkings a ParkingMeters, nezkoumáno). **(Bára)** licence Street Edges (PDDL z položky celé
  podkladové mapy). Podlaží budov Bostonu neměřená. Somerville, Brookline, Newton bez otevřené mapy povrchů (jen odhad).

## Státy a pravidla

- Lucembursko: malý vzorek měření (12 řezů, polovina cesty a parky), u Remiche bílé ortofoto.
- Belgie: AR 1975 platí do 31. 5. 2027, pak nové kódy (federální a regionální): přečíslovat články a značky.
- Polsko: třída ulice (GP–D) se odhaduje ze skupin OSM, hlavní ulice jako Z (opatrně).
- Jednosměrka s cyklisty v protisměru po směru bez dodatkové tabulky (NL, BE).
- Španělsko (Bára 23. 11.: souhlas): volná šířka 3 m k protějšímu okraji doslova; sdílená stezka bez varování; zóna 30
  jako tabule S-30. Otevřené: Melilla má snímek Airbus pod jinou licencí. Šířka pruhu BUS, BUS + kola a tramvajového pásu bez zdroje (bez varování).
- Portugalsko **(Bára)**: chodník červeně pod 1,5 m všude (Bára 23. 11.);
  cyklostezka podle IMT/LNEC (Bára 23. 11.: 1,75 / 2 m, obousměrná 3 m); stání 3 m na směr a pěší zóna jako G5a
  (Bára 23. 11.); Code da Estrada ověřen do 2023 + Lei 24/2025 (kola v buspruhu nejasná).
- Francie: normy kromě přístupnosti jen z druhé ruky (CEREMA přes přílohu ministerstva, příručky Paříže a Lyonu;
  Bára 23. 11.: smí varovat v celé Francii). Tramvajová plošina bez zdroje. Arrêté 2007 ověřit na Légifrance (mohl být
  změněn). ~~Paneláky, licence značek~~ (Bára 23. 11.: paneláky ne, značky volně).

- Maďarsko odloženo (Bára 22. 11. 2026): bez otevřeného ortofota a mapy povrchů jen odhad z OSM a nejde změřit.
  Rozpracováno ve větvi `hungary` (`evaluation/hungary/README.md`). Vrátit se, až bude otevřené ortofoto nebo mapa
  povrchů Budapešti.
- Další státy vybírat podle otevřeného ortofota s CORS a mapy povrchů aspoň hlavního města. Průzkum 22. 11. 2026:
  `docs/states-survey/` (nejlépe Francie s Paříží, pak Španělsko, Švédsko, Kypr; Finsko a Dánsko jen s klíčem
  **(Bára)**; Slovinsko, pobaltské státy a Norsko zkusit znovu).
- Domy: chata nebo jiná stavba bez počtu podlaží v RÚIAN dostane výchozí 2 NP (hlášení u silnice 506338718
  v Královéhradeckém kraji: 1 NP a podkroví). Výchozí hodnota pro rekreační stavby (RÚIAN 8)? **(Bára)**
- Podkroví z RÚIAN (23. 11.): rodinný dům a chata se 2+ podlažími mají poslední podlaží ve střeše (silnice 230). Ověřit
  na víc domech.

## Hledání

- Belgie a Lucembursko jen přes Photon; národní služby (Flandry geolocation, geoportail.lu) nezapojené.
- Francie: Géoplateforme hledá i bez města; přednost blízko středu mapy je slabá (lat/lon jen naznačí).
- ~~Photon nabízí i místa v Nizozemsku, Belgii, Lucembursku, Polsku, Francii a Španělsku, kde zatím nejsou dlaždice OSM~~
  (26. 11. 2026: dlaždice mají všechny státy; místa bez profilu, např. Itálie mimo ortofota a USA mimo metra, vyřazuje `closedAt`).

## Překlady

- Všechny jazyky kromě češtiny strojově: projít rodilým mluvčím, nejdřív irština, maltština, lotyština (tvary měst,
  Krakov, Valonsko, Flandry).

- Finsko (Bára 23. 11. 2026, nenasazené; body 1–7 rozhodnuté podle doporučení: prahy nechat, 3 m na směr nechat, značky
  volně jako ve Francii, sídliště jako „povalecny“, Alandy s finskými pravidly, Turku 2022, Tampere až s proxy): (1) normy jen doporučení, oranžově pod nejnižší doporučenou šířkou
  (chodník 2,0, cyklopruh 1,5…; `evaluation/finland/NORMY.md` E): chceš jiné prahy?; (2) stání 3 m na směr, zákon to dává
  jen u plné čáry (§ 37 odst. 2 bod 9): ponechat?; (3) značky z přílohy zákona jako volné dílo (§ 9 zák. 404/1961 jen
  v překladu WIPO): potvrdit; dodatkové tabulky H nekreslíme; (4) betonová sídliště 60.–80. let (BES) jako „povalecny“,
  ne panelák (Ryhti `construction_method` 01 = prvek by je poznal, nepoužito); (5) Alandy s finskými pravidly (vlastní
  silniční zákon nečten); (6) Turku: bere se tosiortofoto 2022 (licence ověřená), vrstva 2025 nemá vlastní záznam
  licence; (7) Tampere má mapu povrchů bez CORS (jen přes proxy); (8) YLRE: stání jen tam, kde ho registr má (hk2),
  doplněné mezery přes dvory (hk23); registr Helsinek dává užití 151 (kanceláře) i domům se smíšeným užitím; Ryhti
  v obrysu OSM se dvorní budovou bere nejbližší bod (he7); (9) ortofoto MML přes proxy (viz Nasazení).

- Dánsko (Bára 23. 11. 2026, nenasazené; otázky): (1) ~~licence kodaňských vrstev `vejkant`, `parkering_areal`, `bygning`~~
  (Bára 24. 11. 2026: použít; zapnuté, A/B `evaluation/denmark/ab/ZPRAVA.md`); zbývá u stání: mezery mezi plochami a
  plocha kdekoli v okolí vypne odhad stání na obou stranách (Refshalevej, Dannevirkegade); (2) před nasazením: proměnná
  repozitáře `DK_TOKEN`, workflow OSM tiles se `states: dk`; po 30. 11.
  ověřit Dataforsyningen na nové platformě (náhrada Datafordeler s klíčem na 2 roky); (3) normy z vejregler 2019 (vydání
  31. 5. 2024 nečteno), jen oranžově; pruh 2,75 m (§ 164 vyhl. 426/2023 platí jen mezi čarami); (4) stání 3 m na směr,
  zákon je dává jen u plné čáry (§ 29 odst. 1 bod 8); (5) značky z Commons jako úřední díla (§ 9 odst. 2); zóna 30 (E 68)
  nemá kresbu se 30, nekreslí se; jednosměrka E 19 vynechána; (6) Aarhus: podlaží jen odhadem z ploch (OSM má přednost);
  (7) GetCapabilities Dataforsyningen vrací cizí přihlašovací údaje Datafordeleru (ZDROJE.md 7): dát vědět
  poskytovateli?; (8) překlady strojové, sv.js cituje færdselsloven volně jako „trafiklagen“.

## Nasazení a provoz

- ~~Balík OSM `be` (0,7 GB PBF) po prvním běhu workflow změřit, případně rozdělit pod 512 MB.~~ 296 MB, stačí (26. 11. 2026).
- Balíky `pl_sl` a `pl_ds` zasahují obdélníkem do Česka (jen dotazy navíc).
- ~~Před nasazením NL, BE, LU, PL, FR, ES: workflow OSM tiles.~~ Hotovo 23. 11. 2026.
- ~~Před nasazením PT, MC, CY, MT, IT, EE, SI, FI, DK, LT: ručně spustit workflow OSM tiles se
  `states: pt,mc,cy,mt,it_c,it_i,it_ne,it_no,it_s,ee,si,fi,dk,lt` a ověřit balíky na R2.~~ Hotovo 26. 11. 2026 (106 balíků,
  9,1 GB; na R2 zůstává jen nejnovější verze).
- ~~Logování: D1 potřebuje sloupec `country` a nový Worker (`logging/README.md`; hranice poloh teď pokrývají všechny státy, tabulky kontaktního formuláře), nasadit musí Bára.~~ Nasazeno 26. 11. 2026 (bez upozornění e-mailem na zprávy z formuláře).
- ~~**Až budou dlaždice NL, BE, LU, PL, FR a ES na R2**: vrátit texty o nových státech.~~ Hotovo 23. 11. 2026: dlaždice všech 92 balíků jsou na R2 a v `index.json`, texty vrácené v `d6c8c6c`; oprava indexu (kódy o 3–4 písmenech) v `d412dda`.
- **Proxy pro ortofota s klíčem (Bára 23. 11. 2026: uděláme, ale později):** Cloudflare Worker, který drží klíč
  a dlaždice ukládá do mezipaměti; Bára založí účet a Worker. Nejdřív Finsko: celostátní ortofoto MML (0,5 m, CC BY 4.0,
  klíč osobní, podmínky: ne pro velký provoz, klíč chránit; `evaluation/finland/ZDROJE.md`), pak pruhy z ortofota
  i v Tampere, Oulu a menších městech. S proxy i mapa povrchů Tampere (bez CORS). Totéž by šlo pro Švédsko (Lantmäteriet, jen po žádosti) a Dánsko, kdyby token
  nechtěla mít viditelný.

## Licence ke kontrole
- **Boston:** Street Edges (`basemap_IPS` 15) nejsou samostatná datová sada Analyze Boston; PDDL je z položky ArcGIS „Basemap“
  (3c77136ac2204662b9287050fefc67de). Pravidlo Massachusetts o volném pruhu při stání nenalezeno (platí 3 m jako DC). **(Bára)**

- ~~Ortofoto PDOK (Nizozemsko), Flandry, Valonsko, ACT Lucembursko (ortho_latest)~~: licence ověřené a v kreditech
  (`evaluation/licence/ZPRAVA.md`, kredity opravené 26. 11. 2026 ve větvi credits-fix, i GRB, Most, Jihlava, Dúbravka).
- Sítě Amsterdamu: kredit sjednocený („Creative Commons Naamsvermelding, verze neuvedena“), zeptat se datapunt@amsterdam.nl na verzi.
- ~~Mapa Krakova: potřebuje písemný souhlas MSIP (ZPRAVA.md), rozhodnout o vypnutí~~ (Bára 26. 11. 2026: vypnutá, `?krakow=1`).
- ~~Pasport Chotěboře na demo účtu~~ (Bára 26. 11. 2026: vyřazený).
- Služby českých a slovenských měst (MTVU, UMPS, pasporty): licence nikde neuvedená, zeptat se měst (ZPRAVA.md, Koho se zeptat).

## Nepřátelské recenze 26. 11. 2026 (větev canada)

- ~~San Francisco: výpadek vrstvy obrub SFMTA (`MapServer/56`) tiše ztratil stání a nastoupil zákonný odhad (Folsom)~~
  (26. 11. 2026: `sfCurbFailed` a hláška jako u DDOT, oříznutá odpověď je výpadek, `zonesAnswer`).
- ~~Boston: `kerbBays` bez `?off=kerbbays`~~ (26. 11. 2026, jako Toronto a New York).
- ~~New York: výpadek `Plaza_2022` nebo `Parking_Lot_2022` shodil celou mapu~~ (26. 11. 2026: nepovinné vrstvy, `optionalAnswer`;
  50 řezů měření beze změny, `evaluation/usa/nyc/same.mjs`).
- ~~Boston: chybějící `data/us-plan` na webu = tichý odhad; jedno selhané město shodilo obě; cache po selhání uložila starou
  stavbu pod klíčem týdne~~ (26. 11. 2026: `about.json` města jako značka, `mapMissing` s hláškou; stavba po městech;
  `actions/cache/save` jen po úplné stavbě, klíč `us-plan-v2`).
- ~~Photon v USA: obdélník od Washingtonu po Boston, limit 20 spotřebovala Filadelfie a Baltimore, San Francisco jen se středem
  mapy v něm~~ (26. 11. 2026: jeden dotaz s obdélníkem jednoho metra, `search-photon.js METROS`).
- ~~Ortofoto `askImage`: XML výjimka WMS jako výpadek, regex pustil `image/svg+xml`, 30 opakování po 429 naráz, nezahozené tělo~~
  (26. 11. 2026).
- ~~`osmpack.js PackSet`: index znovu i po timeoutu, a pro každý selhaný balík zvlášť~~ (26. 11. 2026: jen po 404, nejvýš jednou za řez).
- ~~Texty: Krakov v patičce bez „jen s ?krakow=1“; Chotěboř v PASPORTY-AB.md a `pasporty.js`; Kuřim jako „pasport komunikací“;
  New York „(NYC Open Data)“, ač se čte z NYCmaps~~ (26. 11. 2026).
- ~~San Francisco: varování chodníku pod 10 ft i v uličkách; citace „SFMTA, Sidewalk Widths 2014“~~ (26. 11. 2026: ulička
  6 ft, jiná obslužná bez varování, citace Better Streets Plan v datech studie AECOM). Zbývá: průmyslové ulice (8 ft) aplikace
  nepozná, dlaždice OSM nemají `landuse` (platí jim 10 ft).

## Po nasazení (Bára 26. 11. 2026, v tomto pořadí, každé zvlášť a bez jiných změn)
- Přestavba překladů: klíče jako jména (ne české věty), věty skládané z kousků (výčty míst a kreditů přes
  `Intl.ListFormat` a názvy míst), sloučit téměř shodné texty, tabulka pro lidi generovaná ze souborů (a opravy z ní zpět).
  Záchranná síť: přehrávka `evaluation/replay` ve 4 jazycích stejná před a po.
- Přejmenovat na logické anglické názvy: `pilot` → `app`, české názvy složek a souborů (`znacky/`, `evaluation/<česky>/`,
  `ZPRAVA.md`, `navrhy-ilustraci`, `towns/slovensko.js`, id `cesko`/`slovensko`…); odkazy ve workflow, nástrojích, testech
  a dokumentaci; uložené řezy a odkazy se staršími id musí dál fungovat.
- Úklid `.claude/worktrees/` (47 kopií, 25 GB): data, na která se odkazuje (nahrávky, balíky, cache měření), přesunout do
  git-ignorovaného `data/` hlavního repa, ověřit necommitnuté změny a sloučení větví (street-history a hungary zůstávají
  stranou), pak smazat.
- Hláška „Tady jsem žádnou ulici nenašla…“ bez dlouhého výčtu míst (pokrytí ukazuje mapa v okně O aplikaci); udělat už
  při slučování před nasazením, pokud to jde.

## Nápady (Bára zatím nevybrala)

- Srovnávat a přepínat normy různých států, aby byly vidět rozdíly přístupů (Bára 20. 11. 2026).
- Výšky povrchu v profilu (DMR 5G, výškové body), jedna strana ulice výš než druhá (Bára 12. 11. 2026).
- Zóny a rychlosti po pruzích z OSM, povrch, názvy zastávek MHD, přechody.
- **Severní Amerika, druhá recenze (25. 11. 2026, `evaluation/canada/review`):** okolí Washingtonu a Toronta bez mapy 51 % (zúžit, nebo přidat ortofoto: USGS/NAIP,
  Maryland 15 cm, Ontario 16 cm, licence neprověřené); Queen Street West má tři pruhy místo čtyř (koleje OSM asi metr vedle středu vozovky mapy);
  ulička v ohybu širší než 9 m bez mapy; inventář DDOT na tepnách nezlepší počet pruhů; kostely v Americe české; ukončení profilu před jinou ulicí (`?otherstreet=1`,
  13 : 10) v Evropě nejisté.
