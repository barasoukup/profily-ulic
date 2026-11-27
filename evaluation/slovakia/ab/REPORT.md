# A/B: pasporty slovenských měst a technická mapa Bratislavy (16. 11. 2026)

Bára: „přidej do aplikace všechny nalezené slovenské zdroje včetně bratislavské MTVU, u každé A/B jak je zvykem“;
pak „zapoj i ty linie technické mapy“. Větev `slovensko`, nic na `main`.

## Krátce

- **Pasporty měst pomáhají a jsou zapnuté:**
  - Kde pasport u řezu ulici má, je profil s ním lépe u 28 řezů, hůř u 7 a zhruba stejně u 8. Proti nim je dnešní
    odhad z ortofota ZBGIS a OSM.
  - Šířky chodníků jsou skutečné místo odhadu „do 6 m“.
  - Přibyly parkovací pruhy.
  - Pěší ulice a cesty v parku už nejsou dvoupruhová silnice.
  - Dvoupásové silnice (R1, Československej armády v Bystrici) mají obě vozovky.
- **Pasport se použije jen tam, kde má plochu přímo pod středem řezu.** V prvním kole se bral všude ve městě, a
  vnitrobloky a příjezdy k parkovištím, které město nespravuje, pak vyšly jako „Neurčeno“ nebo zeleň přes celý řez.
- **Technická mapa Bratislavy je zapojená, ale vypnutá** (zapne ji `?tm=1`):
  - Má čáry hranic druhů pozemků a značky ploch, ale značek je málo a čáry jsou místy otevřené. Plochy se pak
    slévají a ulici z nich poskládat nejde.
  - Na 40 bratislavských řezech se uplatnila u 8 nepojmenovaných cest, kde vyšla jedna plocha přes celý řez. Medená
    vyšla hůř.
  - Její ploty zkrátily 4 profily, z toho Brižitskou chybně hned za chodníkem.
  - Licence je jen „© Hlavné mesto SR Bratislava“, bez otevřené licence.
- **Pasport bratislavského magistrátu pokrývá v centru málo ulic:** u 21 z 25 řezů se neuplatnil. Dúbravka vlastní
  pasport má a pomáhá (6 lépe, 2 hůř).
- **Opravená chyba:** v Banské Bystrici spadlo čtení pruhů z ortofota (`lanes-ortho.js`, když se všechny kousky
  slily). Platí i pro Česko.

## Zdroje (towns/slovakia.js)

| Město | Zdroj | Co dává | CORS | Licence |
|---|---|---|---|---|
| Bratislava | pasport komunikácií pre peších 2022, vozovky (technický stav), parkoviská (ArcGIS Online magistrátu) | plochy chodníků, cyklochodníků, náměstí, vozovek, parkovišť | `*` | © magistrát, neuvedena |
| Bratislava-Dúbravka | pasport komunikácií MČ (ArcGIS Online) | cesta, chodník, parkovisko, zastávka, vjazd… | `*` | © MČ, neuvedena |
| Prešov | pasport dopravy (vw_dp_cesty, chodniky, parkoviska, spev_plochy), Plochy zelene, dreviny | plochy + stromy (body) | `*` | **CC BY 4.0** |
| Žilina | T-MAPY PaKom `ms:pk-pov` | vozovka, chodník, parkovisko, ostatné | pro naši stránku | neuvedena |
| Banská Bystrica | T-MAPY PaKom `ms:pk-pov` | vozovka, chodník, parkovisko, cyklotrasa | pro naši stránku | neuvedena |
| Bratislava, `?tm=1` | technická mapa (geoportal.bratislava.sk, Línie 7, Stavby 8, Prvky 9) | čáry → plochy podle značek; ploty, zábradlí, svodidla, koleje | pro naši stránku | © magistrát |

Kolem pasportu se doplní budovy, zeleň a voda z OSM. Kód typů technické mapy Bratislavy je přečtený z jejího seznamu
objektů („Štruktúra objektov polohopisného a výškopisného plánu“, podle pořadí sloupců): hranice druhu pozemku
2180–2220, ploty 2090–2171, budovy 4020/4030, schody 4080; značky 110 cestná, 120 pešia komunikácia, 5370 parkovisko,
3141 trávnik.

## Postup

- **Vzorek:** 115 náhodných bodů (pevné semínko, `sample.mjs`):
  - po 25 do 1,5 km od středu Bratislavy, Prešova, Žiliny a Banské Bystrice;
  - 15 v Dúbravce.
- **Sběr:** v aplikaci na localhostu (`collect.js`), každý bod dvakrát na stejném místě:
  - A = `?pasport=0` (dnešní odhad);
  - B = s pasportem.
- **Obrázky:** rozdílné řezy nad ortofotem ZBGIS (`images.mjs`, `images/index.html`), nahoře A modře, dole B
  červeně.
- **Posudky:** okem (`results/posudky.json`): b = lépe s pasportem, a = lépe bez, obe = zhruba stejně, zadna = obojí
  špatně, ? = nejde posoudit (vozovka pod stromy, ve stínu, chybí A).
- **Technická mapa:** stejně jako C = `?pasport=0&tm=1` na 40 bratislavských bodech. Obrázky jsou v `images-tm/`.

| Město | řezů | stejně (pasport u osy nic) | lépe s pasportem | lépe bez | zhruba stejně | obojí špatně | nejde posoudit |
|---|---|---|---|---|---|---|---|
| Bratislava (magistrát) | 25 | 21 | 1 | 1 | 0 | 1 | 1 |
| Dúbravka | 15 | 4 | 6 | 2 | 0 | 0 | 3 |
| Prešov | 25 | 9 | 9 | 1 | 4 | 1 | 1 |
| Žilina | 25 | 15 | 3 | 2 | 2 | 0 | 3 |
| Banská Bystrica | 25 | 12 | 9 | 1 | 2 | 0 | 0 (+1 chyba, opravena) |
| **celkem** | 115 | 61 | **28** | **7** | 8 | 2 | 8 |

**Kde je pasport horší:**
- obslužné cesty u parkovišť (pasport tam má jen kus plochy, Dúbravka č. 26, 33);
- Medená (magistrát má jen chodník, vozovka pak spadne na odhad 3 m);
- Potočná, Cestárska a Pod Urpínom: pasport má vozovku, ale chybí mu chodník nebo je posunutý asi o 1 m.

## Zbývá

- **Odhad podle celostátních vrstev ZBGIS:** šířka vozovky („Celková využiteľná šírka cesty“ u čar Cesta),
  parkoviště a tráva. Služba je ověřená, ale do aplikace zatím není zapojená ani otestovaná.
- **Licence:** Žilina, Banská Bystrica, magistrát a Dúbravka žádnou neuvádějí. Před nasazením je potřeba se jich
  zeptat.

# Čáry map dalších měst a pasport Zvolena (16. 11. 2026, druhé kolo)

Bára: „zapoj je všechny, vše přes průzkum a pak A/B testování“. Zdroje našel agent (`scratchpad`, souhrn níže).

## Průzkum

Čáry každé služby jsem nakreslila nad ortofotem ZBGIS a podle barvy typů určila, co sedí na obrubnících a hranách
chodníků:

| Město | Služba (ArcGIS Online, CORS `*`) | Co se bere | Licence |
|---|---|---|---|
| Nitra | `stavby` (kresba „hrany obrubníkov, chodníky“) | `typ_ciary` 1 | neuvedena |
| Piešťany | `vnu_kre_par` L11 (kresba) | `TYP_CIARY` 1 | neuvedena |
| Zvolen | `Kataster_12_v3` L1 (hranice druhů pozemků) | `TYP_CIARY` 1 a 60 | neuvedena |
| Hlohovec | `polohopis_24` L18 (polohopis z DXF) | `Layer` „Kresba polohopisu“ | neuvedena |
| Prešov | `Vrstva_hraníc_druhov_pozemkov` L52 | `TYP_CIARY` 1 | CC BY 4.0 |
| Bratislava | technická mapa, Línie | hranice druhu pozemku 2180–2220 | © magistrát |
| Zvolen (pasport) | `komunikacie_all_Online` (osy se šířkou), `spevnene_plochy_online` | chodník, cesta, parkovisko… jako plochy dané šířky | neuvedena |

**Jak se čáry používají:**
- Kde je řez protne, jsou čáry v odhadu z ortofota a OSM (`ortho-osm.js`) přednostními kandidáty na obrubník: mají
  bonus proti hranám snímku a bez snímku se berou, když leží do 2 m od místa, kde OSM obrubník čeká.
- Čára přes chodník ukončí chodník; zbytek k domu je zeleň nebo zpevněná plocha podle snímku.
- Uzavřené být nemusí.
- `?hrany=0` čáry vypne.

## A/B

- **Vzorek:** po 20 náhodných bodech v Nitře, Zvolenu, Piešťanech a Hlohovci (`sample-edges.mjs`) a k tomu body Prešova
  a Bratislavy z prvního kola, celkem 145.
- **Varianty:** A = `?hrany=0`, B = s čarami; ve Zvolenu navíc A0 = bez pasportu. Obrázky jsou v `images-edges/`.

**Čáry map (A proti B):** profil se změnil u 30 řezů ze 145. Posouzeno 26, čtyři drobné posuny pod 0,7 m jsem
nehodnotila.

| Výsledek | řezů | kde |
|---|---|---|
| lépe s čarami | 9 | Nitra 3, Piešťany 2, Hlohovec 2, Bratislava 2 |
| hůř | 3 | Hlohovec (krajnice přes zelený pás, zeleň místo dláždění na náměstí), Fándlyho (dva pruhy na úzké ulici) |
| zhruba stejně nebo nejde posoudit | 10 | |
| neposouzeno (drobné posuny) | 4 | |

- **Co se zlepšuje nejvíc:** chodník končí u své hrany a za ním je zeleň se stromy, místo chodníku „do 6 m“ až k domu.
  Obruby se posouvají jen o desítky centimetrů.
- **Prešov:** čáry se neuplatnily ani jednou, protože tam rozhoduje pasport.
- **Čáry jsou zapnuté.**

**Pasport Zvolena (A0 proti A):** profil se změnil u 11 řezů. Zhruba 6 hůř, 1 lépe (Strážska cesta), zbytek nejasně:
- spevnené plochy leží přes trávníky a parkoviště (J. Kráľa: „plocha“ 41 m);
- šířky os jsou rozpětí („1,4–1,7 m“);
- na obslužných cestách z toho vychází „plocha“ a „Neurčeno“.

**Je vypnutý** (`?zvolen=1`).

# ZBGIS: šířky vozovek, parkoviště a tráva (16. 11. 2026, třetí kolo)

**Co se zapojilo** (`towns/slovakia.js` zbgisAt, `ortho-osm.js` widths a areas; `?zbgis=0` vypne):
- Jeden dotaz identify na ZBGIS za řez (vrstvy 22 Cesta, 61 Parkovisko, 70 Tráva, 78 Úžitková zeleň).
- Šířka cesty („Celková využiteľná šírka cesty v m“) z osy, která protíná řez do 4 m od osy ulice, dává odhadu očekávanou
  šířku vozovky (místo počtu pruhů × šířka). Jen kde OSM nemá `width`.
- Parkoviště a tráva se přidají za vozovku a domy, kromě té, která leží pod osou ulice.

**A/B:**
- **Vzorek:** 90 náhodných bodů do 1,5 km od středu Košic (25), Trnavy (15), Trenčína (15), Martina (12), Popradu (12) a
  Nitry (11), tedy měst bez vlastních dat (`sample-zbgis.mjs`).
- **Varianty:** A = `?zbgis=0`, B = se ZBGIS. Náhledy byly kreslené v prohlížeči a nejsou uložené.
- **První verze:** plochy ZBGIS šly do ploch řezu a u obslužných cest odhad zablokovaly (8× „Neurčeno“ přes celý řez).
  Teď jdou rovnou do odhadu.
- **Po opravě:** profil se změnil u 38 řezů z 90. 22 nejvýraznějších jsem vybrala k posouzení, posoudila jsem z nich 14:

| | řezů |
|---|---|
| lépe se ZBGIS | **7** (Mudroňova, Kuzmányho, Milosrdenstva a dva další řezy v Košicích, Trnava 2×): šířka vozovky sedí s asfaltem, zahrnuje parkovací pruh, zeleň změřená |
| hůř | **1** (Košice 419: parkovací pruh přišel o šířku) |
| stejně | 1 |
| obojí špatně | 1 (Spartakovská, čtyřpruh) |
| nejde posoudit | 4 |

**ZBGIS je zapnutý.**

# Značky ploch bratislavské technické mapy a slovenské normy (16. 11. 2026)

**Značky ploch** (Bratislava, `symbols`; `?symboly=0` vypne):
- Kousek mezi dvěma čarami technické mapy, které řez protne, dostane druh podle značek v něm: trávník, chodník,
  zpevněná plocha, dvůr nebo parkoviště. Čáry se tak uzavírat nemusí.
- A/B na 40 bratislavských řezech: změnily se jen 2. Na řezu č. 2 je pás 5,3 m chodník místo zeleně, Palárikova má
  zeleň místo zpevněné plochy. Okem neposouzeno.

**Slovenské normy** (`rules.js` limitsSK, stát SK; zdroje a jistota v `evaluation/slovakia/NORMS.md`):

| Prvek | Pravidlo | Zdroj |
|---|---|---|
| chodník | min. 1,3 m, základ 1,5 m | vyhl. 532/2002, STN 73 6110 |
| cyklopruh | min. 1,75 m, doporučeně 2 m; vedle stání navíc bezpečnostní pás | TP 117 |
| pruh pro autobusy | 3,5 m | TP 117 |
| autobusy s cyklisty | nejvýš 3,5 m, nebo aspoň 4,75 m | TP 117 |
| stezka pro cyklisty | 2 m, obousměrná 2,5 m | TP 117 |
| jednosměrka s cyklisty v protisměru | 3,75 m (3,5 m) | TP 117, tab. 4 |
| jízdní pruhy | 2,75 až 3,25 m | TP 117/118, STN 2004 |
| tramvajový pás | bez varování, veřejná slovenská hodnota není | – |

A/B na 40 profilech Bratislavy (varování jako v Návrhu): česká pravidla 22, slovenská 14. Méně je hlavně varování u
chodníků. Varování u pruhů a stání jsou skoro stejná.

# Sítě pod zemí v dalších městech (16. 11. 2026)

Zdroje našel agent na Haiku. Zapojené jsou v `site.js` NETS, podle místa řezu, jako pražské (tlačítko ◍ Sítě).
- **Hloubka:** žádná služba ji nemá, sítě se kreslí v obvyklé hloubce svého druhu (čárkovaně).
- **Velikost (DN):** má ji Karviná, část Ostravy a Košice.
- **Pokrytí:** na 10 náhodných řezech v okruhu 900 m od středu (řez sítě protne):

| Město | Zdroj | řezů se sítí | druhy |
|---|---|---|---|
| Prešov | DTMM města (CC BY 4.0) | 6/10 | elektro NN, VN, VO, slaboproud, kanalizace, plyn, voda, teplo |
| Nitra | kopie sítí města | 7/10 | voda, kanalizace, plyn, teplo, elektro, telekomunikace, VO |
| Košice | územní plán (potrubí, vedení) | 5/10 | voda, kanalizace, plyn, horkovody, elektro |
| Piešťany | porealizační zaměření | 4/10 | voda, kanalizace, plyn, teplo |
| Karviná | ÚAP | 4/10 | voda, kanalizace, plyn, elektro, VO |
| Olomouc | ÚAP Olomouckého kraje | 3/10 | voda, kanalizace, plyn, elektro |
| Břeclav | město | 2/10 | voda, kanalizace, plyn, elektro, teplo |
| Ostrava | ÚAP (jen část města) | 1/10 | plyn, teplo, elektro, VO, kousek vodovodu a kanalizace |

**Vyřazené:** Třebíč a Žilina (0/10, vrstvy pokrývají jen pár ulic).

**Licence:** kromě Prešova žádná uvedená.

# Za pasportem města až k domům (16. 11. 2026)

Bára: Poštová v Bratislavě a 17. novembra v Prešově končily na okraji pasportu, ne u domů. Pasport má jen plochy, o které
se město stará; za ním leží stromořadí, předzahrádky, dvory nebo chodník, který vede někdo jiný.

**Pravidlo** (`ortho-osm.js` `besidePassport`, zapnuté, `?off=beside` vypne):
- Na každé straně od osy ven hledá konec: dům z pasportu nebo OSM, plot či zeď z OSM, vnější hranu samostatně
  zakresleného chodníku z OSM.
- Doplní nepokryté kusy mezi osou a tím koncem, jen leží-li konec do 15 m za poslední plochou. Jinak profil končí jako
  dřív (dřívější pokus `?vypln=1` doplňoval bez domu a dával chodník přes trávník).
- Kusy dělí čáry mapy města. Druh kusu určí značka technické mapy, trávník nebo parkoviště ZBGIS, jinak snímek: zeleň
  od podílu 0,22.
- Chodník jen na straně, kde pasport chodník nemá. Za chodníkem pasportu je to „plocha před domem“.
- Nic u dálnic a rychlostních silnic (R1 v Banské Bystrici: chodník k hale za příkopem).

**A/B:** 53 řezů s pasportem (`vzorek-vedle.json`), každý dvakrát hned po sobě (bez doplnění a s ním, služby měst
a ZBGIS občas neodpoví, proto ne mezi koly). Obrázky přes ortofoto ZBGIS v `images-beside/` a `images-beside-3/`.

| | řezů |
|---|---|
| změněno | 27 (26 ze vzorku a Poštová z odkazu) |
| lépe | 14 (Na Slavíne, Brižitská, Fedákova, 17. novembra 2×, Fučíkova, Plzenská, Potočná, Cestárska, Framborská, Vojtecha Spanyola, Poštová, Dúbravka 26 a 40) |
| hůř | 3 (Plachého: chodník přes trávu; Letná a Prešov 50: zahrada pod stromy jako chodník nebo plocha) |
| smíšeně | 3 (Tranovského: vpravo zeleň dobře, vlevo trávník jako plocha; Petőfiho; Čs. armády) |
| beze změny podstaty | 7 (zbytky „Neurčeno“ pod 1,3 m, Na Šefranici s chodníky z OSM) |

**Slabina:** trávník pod korunami a vyschlý trávník má na slovenském ortofotu stejnou zelenost jako dlažba (0,12–0,32
proti 0,04–0,20), pomůže jen trávník ZBGIS, kde ho má. Regrese v Praze a Brně beze změny (pravidlo jen u pasportu).

# Samostatný chodník OSM přes trávník ZBGIS (16. 11. 2026)

Bára: na Štúrově v Nitře jsou u domů na obou stranách chodníky, profil tam měl široké zeleně. Trávník ZBGIS sahal až
k domu a měl přednost před chodníkem odhadu. OSM tam má samostatné chodníky (`footway=sidewalk`): jeden 13 m od osy
přes trávník ZBGIS (na ortofotu jsou tam auta a dlažba), druhý 16,9 m od osy v pruhu mezi čarou mapy Nitry a domem.

**Pravidlo** (`ortho-osm.js` `orthoOsmPolys`, platí všude, kde se profil skládá z ortofota a OSM, `?off=osmwalk`
vypne):
- Samostatný chodník OSM za obrubou a před domem je chodník i přes trávník ZBGIS nebo zeleň OSM.
- Jeho šířku dají čáry mapy města do 3 m od něj; ven k domu, když dům stojí do 4 m; jinak 2 m kolem jeho čáry.

**A/B:** 235 řezů (vzorek ZBGIS 90 a vzorek čar měst 145, `vzorek-osmwalk.json`), každý dvakrát hned po sobě.
Obrázky jsou v `images-osmwalk/`.

| | řezů |
|---|---|
| změněno | 28 (26 s obrázkem) |
| lépe | 10: Štúrova v Nitře, Jarmočná, Spartakovská, Piešťanská, Fándlyho, Radlinského v Trnavě, Slovenského odboja, Strážska, Janka Kráľa, Palackého (chodník za trávou) |
| hůř | 2: Šoltésovej (zeleň mezi dvěma chodníky splyne v chodník), Bernolákova (chodník souběžné ulice) |
| smíšeně | 1: Hodžova v Trenčíně (přibude chodník, ale i díry „Neurčeno“) |
| beze změny podstaty | ostatní |

**Regrese Prahy a Brna:** Praha beze změny. Brno má chodníky o něco lépe: do 1 m 37 → 39 % (ČÚZK) a 33 → 35 %
(Brno 10 cm), medián chyby 2,45 → 2,25 m. Obruby na brněnském 10 cm snímku do 0,5 m 45 → 44 % (jedna obruba).
Nový výchozí stav je ve `results/regression.txt`.

# Připomínky Fable k větvi (16. 11. 2026)

Opraveno:
- **Patička:** slovenské zdroje ve všech třech jazycích (ve slovenské chyběly i ZBGIS a MV SR): pasporty měst, kresba map
  Nitry, Piešťan a Hlohovce, technická mapa Bratislavy, sítě dalších měst. Věta o soukromí uvádí i ÚGKK SR a ArcGIS
  Online.
- **Citace řezu:** citace a poznámka řezu zahrnují i zdroje doplnění za pasportem (čáry měst, ZBGIS, ortofoto).
  U pasportu slovenského města poznámka jmenuje pasport („podle dat pasportu komunikací města Bratislava, ZBGIS a OSM“).
- **Sítě:** u slovenských měst se už neptají ČÚZK na DMR 5G.
- **Dálnice a rychlostní silnice:** dosah 35 m jen na Slovensku, Česko zůstává na 22 m (neotestováno).
- **Opakování dotazů:** neopakuje se jen skutečná odpověď HTTP 4xx nebo chyba ArcGIS, která jmenuje špatné pole či
  parametr. „400 Unable to complete operation“ pod zátěží se opakuje jako dřív.
- **Zastaralé texty:** „kdekoli v Česku“, popis stránky, titulek tlačítka Sítě, README, CLAUDE.md.
- **Normy SK:**
  - pruh dálnice bez červeného varování (norma není veřejná);
  - sběrná komunikace min. 2,75 a základ 3 m (TP 117, 2.12.2), citace opravené;
  - nástupiště u tramvaje základ 2,5 m.
- **Návrh na Slovensku:** nenabízí značky, které Slovensko nemá (sdílená zóna).
- **Stání podle zákona:** poznámka cituje na Slovensku § 23 ods. 1 zák. 8/2009 Z. z., ne český zákon.
- **Slovenština:**
  - „Panoráma sa nedá zobraziť“;
  - „zvýraznené obrysom“;
  - „Odstrániť časť“;
  - „Cestička pre cyklistov“;
  - „Deliaci pás“;
  - „Letná terasa“;
  - „polovica MHD, polovica autá“.

Neopraveno, na rozhodnutí nebo na později:
- **Licence služeb slovenských měst:** Bára 16. 11. rozhodla, že se citují jako MTVU v Praze.
- **Boxy místo hranic měst:**
  - Bratislava se ptá i v okolních obcích;
  - lepší by byly hranice obcí ze ZBGIS v `towns.json`.
- **`states.json` zjednodušený na asi 30 m:** ulice v pásu u hranice můžou spadnout do „cizina“. Lepší by bylo
  vyrobit ho s menším posunem.
- **Hledání (`search-sk.js`):** u adresy se stahují všechny stejnojmenné ulice v SR. Lepší by byl filtr podle obce.
- **Úřední názvy slovenských značek:** chce to tabulku podle vyhl. 30/2020 Z. z.
- **Legenda zdrojů na Slovensku:** ukazuje i zdroje, které tam nenastanou.
- **Vypnuté větve v kódu:** `?tm=1`, `?zvolen=1`, `P.cars`, `P.areaGreen`, `?vypln=1`.

Přehodnoceno s Bárou (16. 11. 2026):
- **C 7a:** pod pěší cestou jen se značkou v OSM (`traffic_sign` C 7a / SK 220 nebo `foot=designated`). Na pěší cestě
  s cyklisty se kreslí stezka pro chodce a cyklisty (C 9a, oddělená C 10a).
- **Značky zóny pod nejširším chodníkem ulice bez pruhů:** ponechané všude.
- **Poznámka o datech pod názvem:** ve všech režimech (i Návrh a Porovnat).
- **Překreslené české značky:** ponechané.

# Pasport Košic (16. 11. 2026, po kontrole Slovenska)

Košice mají pasport komunikací v systému T-MAPY PaKom jako Žilina a Banská Bystrica
(`gisplan.kosice.sk/services/mapserver/common/pakom`, vrstva `ms:pk-pov`, CORS; licence neuvedená). Zatím pokrývá
hlavně Košice-Západ, město nechává zaměřit celé město. Zapojený v `SK_TOWNS` (`kosice`), `?pasport=0` vypne.

**A/B:** 25 bodů (20 v Košicích-Západ, 5 v centru), každý dvakrát. Změnilo se 13. Obrázky 9 z nich v
`images-kosice/`, data `results/rezy-kosice.json`.
- **Lépe 8:** pěší cesty mezi domy už nejsou dvoupruhová silnice 2 × 3 m. Na Bratislavské a Popradské vozovka sedí
  s parkovacím pruhem na ortofotu a přibyla parkoviště a cyklostezka.
- **Zhruba stejně 1:** Diamantová, zeleň místo chodníků; z ortofota se to nedá rozhodnout.
- **Hůř:** žádný.

Výchozí stav: zapnuto.
