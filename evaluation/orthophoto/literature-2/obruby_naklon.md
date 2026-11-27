# Obruby / okraje vozovky z ortofota a náklon budov (rešerše 19. 11. 2026)

Navazuje na `evaluation/orthophoto/LITERATURE.md` (11. 11. 2026). Neopakuje Máttyus 2015/2016 (HD Maps), Tile2Net,
DeepAerialMapper, EAGLE/COWC, Rauch 2025 (Berlín), Hellekes 2022, chamfer/zarovnání, stíny ani technickou zprávu
ČÚZK, jen na ně odkazuje. Uvádím jen zdroje, které jsem otevřela (plný text nebo stránku); kde jsem viděla jen
úryvek z vyhledávání, je to napsané. Rozsah rešerše byl malý (asi 17 dotazů), takže chybějící věc v „Gaps“ často
znamená „nenašla jsem“, ne „neexistuje“.

## 1. Metody extrakce obrub / okrajů vozovky z leteckých snímků (GSD, přesnost)

### Takeaway
Přímá detekce obruby z ortofota má při ~15 cm/px přesnost „do 1 px“ jen kolem 17 % pixelů a „do 2 px (30 cm)“
kolem 55 %; na úrovni 5 px (~0,75 m) je F1 ~0,88 a na 10 px (~1,5 m) ~0,93. Čísla tolerancí pod 0,5 m jsou tedy
i pro hluboké sítě slabá; reálný přínos je v pásmu 0,5–1,5 m, což je přesně pásmo, kde máme chyby. Zveřejněné
práce s čísly jsou americké (NYC, 15 cm) nebo bez kvantitativního vyhodnocení (DLR Braunschweig, 7 cm).

### Cited Findings
- **iCurb** (Xu, Sun, Liu, IEEE RA-L 2021): obruba jako graf, agent trénovaný imitačním učením nad segmentační sítí.
  Data: NYC planimetrics (otevřená data NYC, obruby jako vektor), 2 049 snímků 5000×5000 RGB+IR, **0,5 ft ≈ 15,2 cm/px**,
  po rozřezání 29 000 dlaždic 1000×1000 (18 000 předtrénink segmentace, 10 000 trénink, 1 000 test). — [arXiv 2103.17118](https://arxiv.org/abs/2103.17118) (plný text přečten)
- iCurb, tabulka II (F1 při toleranci τ = 1 / 2 / 5 / 10 px, tj. ~0,15 / 0,30 / 0,76 / 1,52 m): iCurb **0,175 / 0,556 /
  0,883 / 0,930**, konektivita 0,866; „naivní baseline“ (segmentace → práh → skeletonizace) **0,166 / 0,517 / 0,793 /
  0,829**, konektivita 0,629; Improved Connectivity 0,206 / 0,607 / 0,854 / 0,878. Inference ~0,4 s (naivní) až 0,9 s
  (iCurb) na snímek 1000×1000 na GPU. — [arXiv 2103.17118](https://arxiv.org/abs/2103.17118)
- iCurb, selhání: „when road curbs are severely occluded by shadows or plants“; chyba agenta kvůli zakrytí stromem;
  nestrukturované silnice. Auta jako příčina selhání nejsou jmenována. Autoři uvádějí, že jde podle nich o první
  publikovanou detekci obrub z leteckých snímků. — [arXiv 2103.17118](https://arxiv.org/abs/2103.17118)
- **CP-loss** (Xu a kol., IROS 2021): stejná skupina, segmentace + ztrátová funkce zachovávající konektivitu, „public
  dataset“ (podle iCurb zřejmě tentýž NYC); abstrakt čísla neuvádí, plný text jsem nečetla; projektová stránka
  [tonyxuqaq.github.io/projects/CP-Loss](https://tonyxuqaq.github.io/projects/CP-Loss). — [arXiv 2107.11920](https://arxiv.org/abs/2107.11920)
- **DLR Braunschweig** (Tian, Kurz, Zhuo, Auer, Reinartz, „Fusion of Stereo Aerial Images and Official Surveying Data
  for Mapping Curbstones Using AI“): kamera DLR 3K, let 650 m, **~7 cm GSD**, 80 snímků (70 trénink, 10 test). Reference =
  obruby z katastru / úřední mapy (polygony s atributem nízká / vysoká obruba 10–20 cm). Swin transformer
  (mmsegmentation), Dice loss s vahou obruba : pozadí 20 : 1, polylinie rozšířeny na 5 px kvůli chybě zarovnání;
  vektorizace skeleton → uzly → graf. **Kvantitativní přesnost neuvádí**, jen vizuálně („most of the detected polylines
  correspond … some … show deviations in terms of direction“). — [elib.dlr.de 196561](https://elib.dlr.de/196561/1/DP169-latex.pdf) (plný text přečten)
- Tamtéž, zacházení se zákryty: obruby, kde nDSM ≥ 2 m (koruny stromů), jsou vyřazeny; zákryt budovou se určí
  sledováním paprsku (ray tracing) z DSM a orientace snímku a oblasti „sichttote“ jsou no-data, aby nezkazily učení;
  zaparkovaná auta a střechy budov nad obrubou zmíněny jako „outliers“. Autoři výslovně říkají, že obruby v šikmých
  snímcích „are often positioned at the top of building roofs“. — [elib.dlr.de 196561](https://elib.dlr.de/196561/1/DP169-latex.pdf)
- Boundary-aware segmentace silnic (BARoadNet, ISPRS Annals V-3-2020; RSRCNN; SAC-Loss WACV 2025W): cílí na kvalitu
  hranice / konektivitu, ale v tom, co jsem viděla, **hlásí plošné metriky (IoU, F1, clDice), ne vzdálenost hranice
  v metrech**. — [ISPRS Annals V-3-2020-67](https://isprs-annals.copernicus.org/articles/V-3-2020/67/2020/) (jen
  stránka/úryvek), [SAC-Loss, CVF](https://openaccess.thecvf.com/content/WACV2025W/CV4EO/html/Shojaei_Adaptive_Structure-Aware_Connectivity-Preserving_Loss_for_Improved_Road_Segmentation_in_Remote_WACVW_2025_paper.html) (jen úryvek)

### Inferences
- Náš U-Net (5 tříd) je obdoba „naivní baseline“ iCurb (segmentace → hranice). Na 15 cm měla v NYC F1 0,79 do 0,76 m
  a 0,83 do 1,5 m; to je horní odhad toho, co čekat bez dalších pravidel, a sedí s naším 42 % „do 0,5 m“ na SK/Cáchách.
- Pro okraj vozovky na řezu je lepší než skeletonizace přímo **profil pravděpodobností napříč ulicí** a jeho
  agregace podél ulice (medián přes ±10–20 m), jak už děláme u jasu; graf/agent (iCurb) řeší konektivitu, kterou
  na jednom řezu nepotřebujeme.
- DLR ukazuje levnou a licenčně čistou cestu k trénovacím datům: úřední obruby (MTVU Praha, Brno, FMZK Vídeň,
  Berlín…) + **vyřazení zakrytých míst** z ztráty (no-data), ne jejich přeznačení. To je přímo použitelné pro náš
  trénink: pixel, kde úřední mapa říká „vozovka“, ale na snímku je střecha / vykloněná fasáda / koruna, má být
  ignore_index, jinak se síť učí „střecha = vozovka“ nebo naopak posouvá hranici.
- Licence: iCurb/CP-loss kód ani váhy jsem nenašla s licencí; data NYC planimetrics jsou otevřená data NYC (licenci
  jsem neověřila). DLR kód ani data nezveřejňuje.

### Gaps
- Plný text CP-loss (čísla, licence kódu) jsem neotevřela.
- Nenašla jsem evropskou práci s **kvantitativní** přesností obruby z ortofota v metrech (DLR ji neuvádí).
- Klasické metody (aktivní kontury / snakes, Hough, MRF na hranách) pro obrubu z ortofota s čísly jsem v tomto kole
  nedohledala; odkaz na Zhou & Vosselman (mapování obrub z leteckých a mobilních lidarů) je jen v referencích DLR.

## 2. Selhání, která posouvají obrubu dovnitř vozovky (auta, zálivy, čáry, záplaty, stíny) a jak je práce řeší

### Takeaway
Literatura řeší zákryt zaparkovanými auty třemi způsoby: (a) vyřazením zakrytých míst z trénovacích dat (DLR),
(b) doplněním (inpaintingem) vozovky pod auty GANem (DLR/Stuttgart 2023), (c) statistickým modelem přes celou délku
úseku místo jednoho řezu, protože auta a okrajový šum dělají lokální šířku **menší** než skutečnou (MDPI 2020).
Žádná nalezená práce neměří posun obruby dovnitř kvůli autům, zálivům nebo vodicí čáře; náš poměr 66 : 16
(Praha) a 61 : 11 (Brno) dovnitř : ven je v souladu s mechanismem, který popisuje MDPI.

### Cited Findings
- Xiang, Azimi, Bahmanyar, Sörgel, Reinartz (Uni Stuttgart + DLR), ISPRS Annals X-1-W1-2023, 629: **odstranění
  zákrytu vozidly** z jednoho leteckého snímku úpravou GAN inpaintingu; výslovně kvůli tomu, že vícesnímkové metody
  na **statické** zákryty (zaparkovaná auta) nefungují; nejlépe StructureFlow; nový dataset AVOR. Stránka neuvádí GSD,
  licenci AVOR ani číselné metriky (jen „visual fidelity“). — [ISPRS Annals X-1-W1-2023-629](https://isprs-annals.copernicus.org/articles/X-1-W1-2023/629/2023/)
- MDPI Remote Sensing 12(21):3612, „An OSM Data-Driven Method for Road-Positive Sample Creation“: vozidla rozruší obraz
  silnice a místní šířka kolísá, ale šířka celého úseku je stálá; **šum na hranách dává místní šířky mírně menší než
  skutečné**, proto statistický model přes úsek, ne jeden řez. — [MDPI 2072-4292/12/21/3612](https://www.mdpi.com/2072-4292/12/21/3612) (jen úryvek z vyhledávání; plný text jsem neotevřela)
- DLR Braunschweig: zaparkovaná auta, koruny a střechy nad obrubou = outliery, vyřazené z reference. — [elib.dlr.de 196561](https://elib.dlr.de/196561/1/DP169-latex.pdf)
- iCurb: hlavní selhání jsou stíny a rostliny, ne auta (NYC, 15 cm). — [arXiv 2103.17118](https://arxiv.org/abs/2103.17118)
- Z dřívější rešerše (neopakuji detail): HD Maps modeluje stání jako vlastní pás řezu se šířkou 1,8–4,5 m a
  TIAS/Rauch 2025 má příznak „road sdílená s parking“, tj. auta stojící na vozovce bez vyznačení — viz `evaluation/orthophoto/LITERATURE.md` §2–3.

### Inferences
- Mechanismus našeho problému: hrana řady aut (nebo okraj zálivu, ostrůvku zastávky, vodicí čára) je **podélná,
  dlouhá a kontrastní**, tedy pro hranový detektor i pro segmentační síť lepší kandidát „konce vozovky“ než nízká
  obruba za auty. Proti tomu literatura nabízí, a v prohlížeči je levné:
  1. **Více hypotéz místo první hrany** (v duchu HD Maps / MRF): mezi osou a mezí OSM/normy hledat všechny podélné
     hrany a skórovat je; hranu, za kterou následuje pás 1,8–2,5 m (podélné stání) nebo 4,5–5,5 m (kolmé) s „auty“
     nebo s periodickou texturou a za ním další hrana, považovat za hranici stání, ne za obrubu.
  2. **Asymetrická penalizace**: protože chyba „dovnitř“ je 4–5× častější, posunout výběr k vnější z kandidátních hran,
     pokud je vnější hrana podložená (U-Net říká „sidewalk/green“ za ní, nebo OSM `parking:*` = lane/street_side).
  3. **Agregace podél ulice** (MDPI): použít horní kvantil (např. 70.–80. percentil) místní šířky vozovky přes ±20 m,
     ne medián, protože šum zkracuje šířku jednostranně. To je to nejlevnější a přímo míří na naši asymetrii; ověřit
     regresí.
  4. **Auta jako „vozovka“ ve tréninku**: v trénovacích maskách z úředních map auto na stání patří do vozovky /
     stání; pokud tréninková data obsahují auta jako „other“, síť bude hranici kreslit po autech. Inpainting (Xiang
     2023) je pro prohlížeč drahý, ale samotná myšlenka „auto ≠ hranice“ jde do labelů zdarma.
- Ostrůvky zastávek a zálivy jsou v úředních mapách (MTVU) samostatné plochy, takže pro Prahu/Brno je
  pravidlo „nejvzdálenější hrana v mezích“ lepší jen tam, kde MTVU chybí; jinak rozhoduje MTVU.

### Gaps
- Nenašla jsem práci, která by kvantifikovala posun obruby kvůli řadám aut, vodicí čáře nebo asfaltovým záplatám.
- Licence a GSD datasetu AVOR jsem nezjistila.
- Plný text MDPI 12/21/3612 jsem neotevřela (jen úryvek), čísla neznám.

## 3. Kombinace OSM / vektorových priorů se snímkem pro šířku a okraj

### Takeaway
Standard je OSM osa + latentní šířka (a posun osy) na úsek, odhad z obrazu s hladkostí mezi úseky (Máttyus 2015,
v dřívější rešerši); levnější varianta je šířka podle `highway` třídy (Kaiser a kol. 2017, chyba hranice ~11 px při
šířce silnice ~100 px). Nově nalezené jsou jen dílčí podklady; nic, co by překonalo náš přístup „OSM meze + obraz
+ pravidla“.

### Cited Findings
- Kaiser, Wegner, Lucchi, Jaggi, Hofmann, Schindler: „Learning Aerial Image Segmentation from Online Maps“, IEEE TGRS
  2017: CNN na budovy a silnice trénovaná na automatických maskách z OSM ze vzdálených měst vs. ruční masky; závěr:
  uspokojivý výkon s výrazně menší ruční anotací. — [arXiv 1707.06879](https://arxiv.org/abs/1707.06879) (abstrakt)
- Tamtéž (podle úryvku z vyhledávání, ne z plného textu): OSM má jen osy, šířka se přiřadí podle `highway` tagu
  (průměr na kategorii nastavený na malém vzorku), střední chyba hranice ~11 px při šířce silnice ~100 px. — [arXiv 1707.06879 PDF](https://arxiv.org/pdf/1707.06879) (neověřeno v plném textu)
- Máttyus a kol. ICCV 2015: šířka úseku je omezená (y ∈ [24, 50] px v jejich nastavení), MRF s hladkostí šířky mezi
  sousedními úseky — [CVF ICCV 2015](https://openaccess.thecvf.com/content_iccv_2015/papers/Mattyus_Enhancing_Road_Maps_ICCV_2015_paper.pdf) (úryvek; detail v dřívější rešerši)
- „Road Extraction and Road Width Estimation via Fusion of Aerial Optical Imagery, Geospatial Data, and Street-Level
  Images“ (IEEE IGARSS 2021) — existuje, plný text jsem neotevřela. — [IEEE 9554540](https://ieeexplore.ieee.org/iel7/9553015/9553016/09554540.pdf)
- Nástroj robinlovelace/roadwidths: odhad šířky vzorkováním snímku podél OSM cest s validací proti referenci (jen
  dokumentace postupu). — [awesome.ecosyste.ms záznam](https://awesome.ecosyste.ms/projects/github.com%2Frobinlovelace%2Froadwidths) (jen úryvek)
- Úryvek z vyhledávání uvádí pro „Road Width Estimator“ (Canny + Douglas–Peucker nad snímkem s OSM) RMSE < 0,1 m a
  r = 0,97 proti měření v terénu — zdroj jsem neidentifikovala ani neotevřela, **nepoužívat bez ověření**.
- UrbanVGGT (2026): šířka chodníku z fotek z ulice, agregace na úsek OSM mediánem, MAE 0,252 m — jiná modalita, ale
  podporuje agregaci po úseku. — [arXiv 2603.22531](https://arxiv.org/pdf/2603.22531) (jen úryvek)

### Inferences
- U-Net s **OSM jako dalším vstupním kanálem** (rasterizovaná osa / šířka podle třídy / `parking:*`) je v
  literatuře, kterou jsem viděla, nepopsán s čísly; jako levná varianta zůstává OSM až v post-processingu (meze
  šířky, směr hledání), což už děláme.
- Hladkost mezi sousedními řezy (Máttyus) = pro nás paměť posledních kliků na téže ulici; v jednom kliku nahradit
  agregací podél ±20 m.

### Gaps
- Nenašla jsem evropskou práci, která by z OSM + ortofota odhadovala šířku vozovky s metrickou chybou ve hustém
  centru.

## 4. Náklon budov (relief displacement) v ne-true ortofotech: rozsah, detekce, korekce bez DSM, dostupnost true-ortho

### Takeaway
Klasické ortofoto (rektifikace na DMR) kreslí střechy posunuté od paty budovy směrem od nadiru snímku a za nimi
je „mrtvý prostor“; DLR to u obrub řeší ray tracingem z DSM. Bez DSM lze zakrytý pás odhadnout z půdorysu a výšky
budovy (OSM/RÚIAN/ZBGIS) a známé geometrie snímkování. True-ortho (TrueDOP) je otevřeně v části Německa
(Schleswig-Holstein od 2019, Hessen od 2020, Bavorsko a NRW existují); v ČR (ČÚZK), SR (ZBGIS) a v basemap.at jsem
true-ortho nenašla (ČÚZK výslovně ne-true).

### Cited Findings
- TrueDOP vs. DOP (LVermGeo Schleswig-Holstein): DOP je rektifikovaný na DGM; TrueDOP po pixelech na obrazovém
  DOM (bDOM), čímž se „Umklappeffekte vermieden“ a „sichttote Räume“ se z velké části odstraní. Od 2019 se v SH
  vyrábí jen 4kanálové TrueDOP 20 cm, barevné TrueDOP 20 cm jsou plošně k dispozici, polovina území se snímkuje
  každý rok; stažení zdarma přes OpenGBD. — [schleswig-holstein.de, DOP digital](https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/LVERMGEOSH/Service/serviceGeobasisdaten/geodatenService_Geobasisdaten_DOP_digital)
- Hessen: záznam ATKIS DOP 20 uvádí, že od snímkování 2020 se vyrábí jako TrueDOP. — [geodatenkatalog.de 0b30f537](https://gdk.gdi-de.org/geonetwork/srv/api/records/0b30f537-3bd0-44d4-83b0-e3c1542ca265) (jen úryvek z vyhledávání)
- NRW: datová sada „Digitale True Orthophotos 2024 (TrueDOP)“ na open.nrw, vydavatel Stadt Köln; metadata mají příznak
  `non_open: true`, licence nejasná. — [ckan.open.nrw.de](https://ckan.open.nrw.de/lt/dataset/6ba3c12b-8dca-4a0b-a614-f7a71662a846) (jen úryvek)
- Bavorsko: LDBV vede True-DOP mezi produkty; DOP 20 WMS je CC BY 4.0; licenci TrueDOP jsem nepotvrdila. — [infoverm 2024 (LDBV)](https://lohr.bayernlab.bayern.de/mam/ldbv/dateien/infoverm_2024_opendata_stopet.pdf), [Hilfestellung Geodaten Bayern](https://www.digitale.planung.bayern.de/medien/dokumente/hilfestellung_für_den_einsatz_von_geodaten.pdf) (oba jen úryvek)
- Slovensko (ortofotomozaika ÚGKK/GKÚ): cykly 25 / 20 / 15 cm (2017–19 / 2020–22 / 2023–25), RMSExy 0,30 / 0,21 /
  0,17–0,18 m, CC BY 4.0 (GKÚ Bratislava); **stránka nezmiňuje DSM ani true-ortho ani náklon budov**. — [skgeodesy.sk, Orthophotomosaic](https://www.skgeodesy.sk/geoportal-en/zbgis/orthophotomosaic)
  (Pozn.: aplikace bere `Ortofoto_hres` jako ~10 cm; podle této stránky má národní mozaika 15 cm — vrstva `_hres`
  může být jiný produkt; neověřeno.)
- Rakousko: basemap.at nabízí Orthofoto (30 cm podle wiki OSM), zdarma i komerčně; vídeňské ortofoto (MA 41) je podle
  diskusí OSM totožné s vrstvou basemap.at; Orthofoto Wien 2014 mělo 15 cm. Nikde jsem nenašla, že jde o true-ortho. — [basemap.at](https://basemap.at/en), [wiki OSM AT/basemap](https://wiki.openstreetmap.org/wiki/AT/basemap), [Orthofoto Wien 2014](https://cloud.csiss.gmu.edu/uddi/dataset/stadt-wien_orthofotowien2014) (úryvky)
- Česko: ČÚZK ortofoto je rektifikované na DMR 4G, tedy ne true-ortho (viz dřívější rešerše a [TZ ČÚZK](https://geoportal.cuzk.gov.cz/Dokumenty/TZ_Ortofoto_CR.pdf)); IPR Praha (10 cm) — produkt „true ortho“ jsem na Geoportálu nenašla. — [geoportalpraha.cz, ortofoto](https://geoportalpraha.cz/en/data-and-services/articles-and-projects/ortofoto) (úryvek)
- Bez DSM: zbytkový posun lze přiblížit z výšky budovy, vzdálenosti od středu snímku a výšky letu; konstantní posun
  souřadnic střech není platná korekce (posun se mění se vzdáleností od nadiru); výšku lze odhadnout iterativně
  nejmenšími čtverci. — [ACRS 2004, Finding True Position of …](https://a-a-r-s.org/proceeding/ACRS2004/Papers/DPH04-1.htm) (úryvek)
- Detekce zákrytu na buňkách DEM radiálním zametáním (úhel + výška budovy) — [GIScience & RS 2015, abstrakt](https://informahealthcare.com/doi/abs/10.1080/15481603.2015.1128629) (úryvek)
- Simulace zakrytého terénu a viditelnosti stěn před letem (volba překryvu snímků) — [ISPRS Annals XI-2-2026, 419](https://isprs-annals.copernicus.org/articles/XI-2-2026/419/2026/isprs-annals-XI-2-2026-419-2026.pdf) (úryvek)
- DLR: v šikmých/ne-true snímcích leží obruby z úřední mapy často „on top of building roofs“; řešení ray tracing
  z DSM a no-data v zakrytých místech. — [elib.dlr.de 196561](https://elib.dlr.de/196561/1/DP169-latex.pdf)

### Inferences
- Velikost náklonu (vlastní výpočet, ne citace): posun střechy d = h · r / H, kde h je výška budovy, r vzdálenost
  od nadiru na zemi, H výška letu; tj. d = h · tg(úhel pohledu). Pro římsu 20 m a úhel 15–25° od svislice (běžné
  u okraje záběru velkoformátové kamery, kterou ale ortomozaika částečně ořízne) vychází 5–9 m; ve 12–15 m široké
  staré ulici to může zakrýt celý chodník a část vozovky na jedné straně. Úhel pro konkrétní místo bez metadat
  snímku neznáme; prakticky ho lze **odhadnout ze snímku**: posun mezi půdorysem budovy (RÚIAN / ZBGIS / OSM) a
  hranou střechy na ortofotu (chamfer na hranu střechy, jako v §4 dřívější rešerše) dává vektor náklonu pro výřez;
  dělený výškou budovy (ZBGIS výška, RÚIAN podlaží × 3,2 m, OSM `height`/`building:levels`) dává tg úhlu.
- Jednoduché maskování v prohlížeči (bez DSM): pro každou budovu podél řezu posunout půdorys o vektor náklonu
  (h · tg úhlu ve směru od nadiru) a pás mezi patou a posunutou střechou označit „neviditelné“; v něm **nehledat
  obrubu ani nepočítat U-Net jako fakt**, a hranici ulice brát z fasády (půdorys) a OSM/norem. Strana ulice, kam se
  domy kloní, je zakrytá; protější strana ukazuje fasádu (svislou stěnu) jako pruh, který U-Net může brát jako
  „building“ a posunout tak fasádu do ulice. Obojí jde poznat: posun střechy vůči půdorysu ukazuje směr.
- Kde je k dispozici TrueDOP (SH, Hessen; Bavorsko a NRW ověřit), je výhodné ho preferovat pro hledání obrub v hustých
  centrech; v aplikaci jsou dnes zapojené vrstvy „DOP20“ zemí — u SH vrstva `sh_dop20_rgb` z OpenGBD podle textu
  LVermGeo od 2019 pravděpodobně už TrueDOP je (neověřeno).
- Pro trénink U-Netu: masky z úředních map (FMZK, Berlín, Hamburk, MTVU) na ne-true ortofotu učí síť chybně; podle
  DLR maskovat zakryté pásy (odhad výše) jako ignore.

### Gaps
- Nenašla jsem práci, která by kvantifikovala, jaký podíl uličního prostoru zakrývá náklon v hustých historických
  centrech na národních ortofotech.
- Nenašla jsem dokumentaci, jakým DMR/DSM ZBGIS rektifikuje ani zda Bratislava (magistrát) má vlastní true-ortho.
- Licence a plošná dostupnost TrueDOP v Bavorsku, NRW a dalších zemích nepotvrzena (jen úryvky).
- Stránku s odvozením vzorce relief displacement (Mahun) server odmítl (403); vzorec je standardní, ale uvádím ho jako
  vlastní inferenci.
