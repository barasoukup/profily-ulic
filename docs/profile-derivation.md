# Jak se profil skládá

Pravidla odvození profilu z dat (`derive.js` a okolí), číslované body.

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

   **Tři druhy tramvaje** (A/B v `evaluation/archive/rules-2026-11/REPORT.md`):
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
   tarifem“). Hranice zón se stahují jednou skriptem `node tools/build_zps.mjs` do `app/data/zps.json` (na webu
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
11. **Pruhy z ortofota** (`public/lanes-ortho.js`, vyhodnocení `evaluation/orthophoto/REPORT.md`): při kliknutí se
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
    `evaluation/ortho-osm/REPORT.md`). Když technická mapa neodpoví, nic nevrátí nebo nemá u osy povrch ulice,
    profil se místo odhadu jen z OSM poskládá z ploch, které se vyrobí z ortofota (stejný výřez jako u bodu 11)
    a OSM:
    - **vozovka:** obruby jsou hrany jasu nebo zeleně, které drží podél ulice (v kusech po 5 m na ±20 m). Mezi
      kandidáty se vybírá podle asfaltu mezi osou a hranou a podle toho, kde obrubu čeká OSM: `width`, jinak
      `lanes` × 3,5 / 3,25 / 3,0 / 2,75 m podle třídy, plus stání (`parking:*`), cyklopruhy a koleje OSM ve
      vozovce. Místo 0,4 m za plnou čarou je taky kandidát. Kde hrana není, platí šířka podle OSM;
    - **domy:** budovy OSM (čtené i ±1 a ±2 m podél ulice; dům jen vedle řezu se dokreslí přes řez). Mají přednost
      před zelenými plochami OSM (trávník, park, les), ty před chodníky; voda, zahrádky a hřbitovy profil ukončí.
      Ulice na mostě (`bridge` a úroveň nad zemí) leží nad vodou a zelení OSM: ty se pod ní neberou a ulice končí
      za krajním chodníkem jako u map povrchů (`evaluation/archive/bridge-water/`, `?off=mostvoda` jako dřív). Kde OSM
      nakreslí mostovku (`man_made=bridge`, v dlaždicích od 27. 11. 2026), končí ulice na její hraně (aspoň 1 m za
      obrubou) a voda mezi dvěma mostovkami zůstane (`evaluation/archive/bridge-water/edge/`, `?off=mostdeska`). Na okraji
      ulice na mostě se kreslí zábradlí (`?off=zabradli`).
      **Chodník** vede od obruby k domu, nejvýš 6 m. Zbytek, a s `sidewalk=no` celý prostor, je zeleň, kde je
      ortofoto převážně zelené (podíl ≥ 0,1), jinak plocha do 12 m, jinak tam profil končí. Bez domu je chodník jen
      podle OSM (`sidewalk*`, šířka `sidewalk:width` nebo 2,5 m) a za ním profil končí;
    - **domy z RÚIAN** (Česko, `countries/CZ.js estimateBuildings`, Bára 23. 11. 2026: „RÚIAN by měl mít nejlepší
      data“): budovy odhadu jsou z RÚIAN, z OSM jen tam, kde RÚIAN žádnou nemá (`gis.js withBuildings`; `?off=ruiandomy`).
      Regrese proti MTVU (`RUIAN=first node evaluation/ortho-osm/regression.mjs`): víc metrů správného složení ve všech
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
    test; `evaluation/ai-segmentation/TOWNS.md`). Kredit: mapy povrchů, na kterých se model učil (credits.js aiKerbs).
    Odkazy na proklikání `evaluation/ai-segmentation/LINKS.md`.
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
