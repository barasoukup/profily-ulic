# Auta u obruby a stíny v RGB ortofotu (rešerše 19. 11. 2026)

Navazuje na `evaluation/ortofoto/LITERATURA.md` (kap. 3 a 5) a `evaluation/ortofoto/AUTA-DL.md`. To, co je tam
(COWC, VEDAI, EAGLE, DOTA, CARPK, Potsdam obecně, YOLO11-OBB, MMRotate, OWLv2, DLR Berlín 2025, Hellekes 2022,
Tsai 2006 jen jménem, Jin & Feng 2010, Li 2012), se tu neopakuje; doplňuju čísla, licence a klasické postupy.
Citovány jen zdroje, které jsem otevřela (plný text nebo stránku). Kde jen abstrakt / záznam, je to uvedeno.

## Klasické a lehké detektory zaparkovaných aut (10–25 cm) a co z nich jde do prohlížeče

### Takeaway
Nejbližší naší situaci je klasika „řada aut podél silnice z mapy“ (Hinz, Leitloff, Stilla, TU München): hypotéza
řady jako pásu podél osy z GIS, pak rozklad na auta podle **periodické změny šířky/kontrastu podél pásu**; vychází
vysoká správnost (~82–85 %) a nízká úplnost (25–59 %), šedá auta selhávají. Je to přímo obdoba našeho pravidla
„rozptyl po metrech podél pásu u obruby“ a potvrzuje, že periodicita podél pásu je známý a použitelný příznak.

### Cited Findings
- Leitloff, Hinz, Stilla (CMRT05, IAPRS XXXVI-3/W24, 2005): řada vozidel modelovaná jako pás s „dostatečnou délkou,
  téměř konstantní šířkou, malou křivostí“ a **opakujícím se vzorem**; hledají se jen v oblastech z GIS (osa a směr
  silnice), obraz se nejdřív morfologicky filtruje obdélníkovým prvkem ve směru silnice; čáry (Steger) ve více
  měřítkách, pro tmavé i světlé řady zvlášť. Šířka řady z gradientního obrazu v příčných profilech; jednotlivá auta =
  maxima funkce šířky, mezery = minima, podmínka vzdálenosti min–max mezi vmin/2 a vmax/2; ověření rozdílem mediánu
  jasu uvnitř auta a v mezikruží kolem (silnice). — [Leitloff a kol. 2005, PDF](https://pia.tum.de/isprs/cmrt05/pub/CMRT05_Leitloff_et_al.pdf)
- Výsledky (QuickBird pan 0,6 m, Mnichov): tmavá auta správnost 84,5 % / úplnost 59,0 %, světlá 81,8 % / 25,0 %,
  dohromady 84,1 % / 48,7 %; **šedá auta vyřazena, „sotva vystupují z okolí“**; slabé gradienty a silné hrany poblíž
  (obruby, stíny) kazí funkci šířky; autoři plánují přidat **funkci lokálního kontrastu podél řady**, protože doplňuje
  geometrii radiometrií. — [tamtéž](https://pia.tum.de/isprs/cmrt05/pub/CMRT05_Leitloff_et_al.pdf)
- Tamtéž v přehledu: Michaelsen & Stilla 2001 omezují hypotézy na hranu silnice z mapy a **izolované hypotézy
  zahazují** (auta musí tvořit kolineární skupinu); Jin & Davis 2004 morfologické filtrování + neuronová síť; omezení
  hledání na silnice a parkoviště z GIS „výrazně snižuje počet falešných poplachů“. Detekce aut z ~0,15 m je
  podle autorů „široce testovaná a dává dobré výsledky v mnoha situacích“. — [tamtéž](https://pia.tum.de/isprs/cmrt05/pub/CMRT05_Leitloff_et_al.pdf)
- Navazující časopisecká verze (IEEE TGRS 48(7), 2010, 2795–2806): hypotézy jednotlivých aut AdaBoost + Haarovy
  příznaky, řady extrakcí čar, auta v řadách robustním odhadem parametrů (jen ze snippetu vyhledávání, plný text
  neotevřen). — [výsledky hledání, TUM](https://pia.tum.de/pub/2006/leitloff_co_stilla_pcv06_pap.pdf)
- Tuermer, Leitloff, Reinartz, Stilla (PCV 2010): HOG příznaky na sekvencích DLR 3K nad městem — PDF stažen, ale
  text nešel přečíst; čísla neověřena. — [PDF](https://pia.tum.de/pub/2010/tuermer_co_stilla_pcv10_pap.pdf)
- Kembhavi, Harwood, Davis (TPAMI 33(6), 2011): kombinace **Color Probability Maps** (barevná statistika vozidel a
  jejich okolí), HOG a „Pairs of Pixels“, ~70 000 příznaků, PLS projekce + výběr příznaků; lepší než předchozí na
  dvou datech (čísla jen v plném textu, neověřena). — [záznam UMD](https://lccd.umiacs.umd.edu/node/13076)
- Cheng, Weng, Chen (IEEE TIP 21(4), 2012): pixelová klasifikace, **barevná transformace oddělující barvy vozidel od
  barev nevozidel**, pak dynamická Bayesova síť nad lokálními příznaky (jen záznam/abstrakt). — [katalog](https://katalog.dhi-paris.fr/vufind/Record/NLM212435620/Description)
- Patent Parkbob/Necture US 11170236 B2: auta (z detektoru) přiřazena k nejbližšímu přímému úseku ulice z OSM podle
  středu, strana podle úhlu, auta seskupena do „pruhů“ rovnoběžných s úsekem; krajní pruhy = kandidáti na stání,
  **stojící auta jsou k sobě mnohem blíž než jedoucí**; místa z minimální mezery sousedů, orientace z elipsy,
  obsazenost slučováním více snímků. Číselné prahy v textu nejsou. — [Google Patents](https://patents.google.com/patent/US11170236)

### Inferences
- Naše pravidlo „rozptyl průměrné sytosti po metrech ≥ 10“ je jednorozměrná verze Leitloffovy analýzy funkce šířky:
  oba hledají periodu auto–mezera podél pásu. Literatura radí (a) vyžadovat **periodu v délce auta (≈ 4–5 m)**, ne jen
  rozptyl (autokorelace / počet střídání maximum–minimum s rozestupem 4–6 m), (b) kombinovat sytost s jasem (tmavá
  auta mají kontrast jasový, barevná sytostní; šedá/stříbrná žádný — tam selžou obě pravidla, shodně s 25 % úplností
  světlých aut u Leitloffa), (c) zahodit osamělé hypotézy a chtít ≥ 2 auta (stejné jako „≥ 2“ v AUTA-DL.md).
- 13 ze 44 řad při 0 falešných na 125 pásech ≈ úplnost 30 %, správnost 100 % na ladicích datech; to je v pásmu
  Leitloffa (vysoká správnost, nízká úplnost). Prahy jsou laděné na týchž pásech, takže skutečná správnost bude nižší;
  ověřit na jiných řezech.
- Šedá auta: jediný klasický příznak, který zbývá, jsou hrany (obrysy, čelní sklo, stín pod autem) — HOG/Haar.
  Lehký HOG + lineární SVM v JS je v řádu ms na pás 2 × 40 m, ale potřebuje vlastní trénovací vzorky.

### Gaps
- Čísla Tuermer 2010 (HOG), Kembhavi 2011 a Cheng 2012 jsem z plných textů neověřila (PDF nečitelné / za paywallem).
- Žádná práce, kterou jsem otevřela, výslovně nepoužívá **rozptyl sytosti po metrech** jako příznak; nejblíž jsou
  barevné mapy pravděpodobnosti (Kembhavi) a barevná transformace (Cheng). Že je sytost samostatně diskriminační,
  tedy z literatury doložit nemohu.

## Datové sady a váhy s licencí, která by šla do MIT aplikace

### Takeaway
Nenašla jsem žádnou leteckou (ortho) sadu aut pod volnou licencí: VEDAI je výslovně jen nekomerční, COWC licenci na
stránce neuvádí, Potsdam/Vaihingen mají vlastní podmínky v samostatném dokumentu. Čistá cesta zůstává vlastní
anotace na českých ortofotech (případně Songdo Vision CC BY 4.0, ale je to dron, ne ortofoto).

### Cited Findings
- VEDAI: „research, and non-commercial purposes only … Any use for commercial and/or industrial purpose is forbidden“;
  uživatel nesmí databázi užít ani šířit komerčně; snímky jsou upravené ortofoto Utah AGRC 2012 (6 palců = 15 cm). —
  [VEDAI podmínky (PDF)](https://downloads.greyc.fr/vedai/TermsandConditionsofUseVeDAI2014.pdf)
- COWC (LLNL): 15 cm/px, 32 716 aut, 58 247 negativů; zdroje Toronto a Potsdam/Vaihingen (ISPRS), Selwyn (LINZ),
  Columbus (AFRL), Utah; **licence na stránce neuvedena**. — [COWC](https://gdo152.llnl.gov/cowc/)
- ISPRS Potsdam/Vaihingen: podmínky jsou v samostatném dokumentu, se kterými je nutné souhlasit; obsah stránka
  neuvádí. Odvozená sada ArtifiVe-Potsdam je CC BY-NC-SA 3.0. — [ISPRS benchmark](https://www.isprs.org/resources/datasets/benchmarks/UrbanSemLab/); [ArtifiVe-Potsdam](https://rs.ipb.uni-bonn.de/data/artifive-potsdam/index.html) (jen ze snippetu)
- Songdo Vision: dron, 4K pohled shora, osové rámečky, CC BY 4.0, 245 047 instancí třídy car (podle snippetu
  vyhledávání; stránku jsem neotevřela). — [Hugging Face](https://huggingface.co/datasets/rfonod/songdo-vision)
- Roboflow Universe má několik „CC BY 4.0“ sad aut z leteckých snímků bez popisu zdroje snímků (licence snímků tedy
  nejistá). — [Roboflow](https://universe.roboflow.com/roboflow-jvuqo/detecting-vehicles-on-aerial-images)
- AISD (stíny, 514 snímků): „only for research and non-commercial purposes“. — [GitHub RSrscoder/AISD](https://github.com/RSrscoder/AISD)

### Inferences
- Model naučený na VEDAI, AISD, DOTA nebo EAGLE nelze čistě vydat pod MIT. COWC a Potsdam: nejasné, nepoužívat bez
  přečtení podmínek ISPRS.
- U kerbů jsme už jednou natrénovali U-Net na mapách povrchů (commit f505d4e); stejná cesta pro auta: anotace řad aut
  na IPR/ČÚZK ortofotu (pomocník YOLO/OWLv2 jen offline k předznačení — u OWLv2 Apache-2.0 licenčně v pořádku).

### Gaps
- Text podmínek ISPRS (dokument „Complexscenes Revision V4“) jsem neotevřela.
- Licenci Songdo Vision jsem ověřila jen ze snippetu.

## Detekce stínů v RGB ortofotu: indexy, prahy, přesnost, selhání

### Takeaway
Standardní levná cesta je Tsai 2006: poměr (H+1)/(I+1) v HSI/YIQ/YCbCr a Otsu, celková přesnost 94,8–96,6 % na dvou
leteckých snímcích (budova, dálnice); v HSV/HCV horší (82–89 %). Stín má podle Tsaie **nižší jas, vyšší sytost
(modrofialová kvůli Rayleighovu rozptylu) a vyšší odstín** — přesně Bářino pozorování; tytéž vlastnosti ale mají
modré a tmavé objekty, a indexy obecně nerozliší vodu ani tmavý asfalt.

### Cited Findings
- Tsai (IEEE TGRS 44(6), 2006): vlastnosti stínu: (1) nižší jas, (2) **vyšší sytost** s převahou krátkých vlnových
  délek (Rayleighův rozptyl), (3) vyšší odstín. Index = (He+1)/(Ie+1) z odstínu a jasu, škálovaný na 0–255, práh
  Otsu; volitelně Sobel na Ie + Otsu jako „tvarová maska“ (AND se stínovou maskou). — [Tsai 2006, PDF](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)
- Přesnost (pixely, ruční maska; skenované letecké snímky 1 : 5000, sken 25 µm, tj. asi 12,5 cm na zemi — přepočet
  můj): budova HSI celkově 95,7 % (stín: producent 89,9 %, uživatel 97,9 %), YIQ 94,8 %, YCbCr 94,7 %, HSV 84,1 %,
  HCV 82,0 %; dálnice HSI 96,6 % (88,2 / 97,4), YIQ 97,2 %, YCbCr 96,0 %, HSV 89,1 %, HCV 86,4 %. Polidorio 2003
  (rozdíl S − I v HSI, práh 0) 71,2 % a 63,7 %, s Otsu („modified“) 83,0 % a 77,4 %. — [tamtéž](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)
- Selhání: tmavý objekt a tmavý stín leží na téže straně histogramu poměru, Otsu je nerozdělí; HSV a YIQ citlivé na
  **tmavě modré** plochy, HCV a YCbCr na **nazelenalé**; Polidorio (S − I) označí modré a zelené objekty jako stín;
  v testu dálnice bylo jedno auto stejného odstínu a kontrastu jako vozovka. — [tamtéž](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)
- Kompenzace u Tsaie: po složkách souvislé stínové oblasti (dilatace 5 × 5), „buffer“ kolem ní (dilatace 10 × 10),
  **přizpůsobení histogramu stínu histogramu bufferu** (LUT z kumulativních histogramů), pásmo po pásmu. — [tamtéž](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)
- C1C2C3 (Gevers & Smeulders 1999): C3 = arctan(B / max(R, G)); C3 je užitečný pro stín. Spektrální indexy obecně
  „nerozliší vodní plochy, asfaltové silnice a mraky“. Objektový postup (Otsu na indexu jako automatické trénovací
  vzorky → SVM/RF, většinové hlasování v segmentech, NDVI proti zeleni): F 90–92 %, úplnost 90–93 %, správnost
  86–93 % (GeoEye-1, 0,5 m, s NIR); hlavní slabina: **stíny malých objektů** se ztrácejí. — [Tatar a kol., ISPRS Archives XL-1/W5, 2015](https://isprs-archives.copernicus.org/articles/XL-1-W5/713/2015/isprsarchives-XL-1-W5-713-2015.pdf)
- Arévalo, González, Ambrosio (IJRS 29, 2008, 1945–1963): poloautomatická detekce z C3 + růst oblastí (jen záznam
  a sekundární popis; čísla neověřena). — [MAPIR UMA](https://mapir.isa.uma.es/mapirpubsite/index.php/language/set/nl/publications/show/109)
- Silva a kol. (ISPRS J. 140, 2018): CIELCh, modifikovaný „Specthem“ poměr, víceúrovňové prahování, morfologie,
  odstranění stínu podle poměru osvětlení stín/nestín; detekce kolem 93 %, GPU, blízko reálnému času (jen abstrakt). — [QUT ePrints](https://eprints.qut.edu.au/126063)
- Adeline a kol. (ISPRS J. 80, 2013, 21–38): srovnávací studie stínů ve VHR leteckých snímcích, šest skupin metod
  (prahování histogramu, invariantní barevné modely, segmentace, geometrie, fyzika, strojové učení), simulace uličního
  kaňonu kvůli radiačním efektům (jen záznam; výsledky a doporučení neověřena). — [záznam](https://vufind-test.katalog.k.utb.cz/SummonRecord/FETCH-LOGICAL-c501t-e366f45e723a2c60ee65cb1dff07e1ebee67bd7ec60da0267068d3acae425fd93)
- Kobayashi a kol. (PASCO, ISPRS Archives XLIX-B3, 2026): třístupňová víceměřítková síť pro stíny v ortofotech
  20 cm a 5 cm, fuzzy IoU +0,05 proti dřívějšímu modelu, hlavně u velkých souvislých stínů vysokých domů; kód ani
  data uvedeny nejsou. — [ISPRS Archives](https://isprs-archives.copernicus.org/articles/XLIX-B3-2026/141/2026/)

### Inferences
- Pro náš výřez (stovky × stovky px) je Tsai HSI poměr + Otsu jen pár ms v JS. Otsu na celém výřezu se ale mýlí, když
  stín v něm skoro není (histogram není bimodální) — přidat test bimodality (poměr mezitřídního rozptylu) a minimální
  podíl stínu, jinak masku nebrat.
- **Konflikt s pravidlem pro auta:** stín je podle Tsaie i podle našich dat tmavý, modrý a **sytý**; průměrná sytost
  po metrech proto skáče na hranách stínů (strom, sloup, štít domu přes pás) stejně jako na autech. Před výpočtem
  rozptylu sytosti pixely ve stínové masce vyřadit (nebo sytost ve stínu normalizovat poměrem mediánů stín/slunce
  téhož pásu) a metry s hranou stínu nepočítat.
- Tmavý asfalt: Tsai i Tatar říkají, že indexy samy asfalt od stínu neoddělí; u nás pomáhá znalost, kde je vozovka
  (MTVU/OSM) — stín hledat jako *relativní* ztmavnutí proti mediánu téže vozovky v řezu, ne absolutně.

### Gaps
- Čísla z Adeline 2013 a Arévalo 2008 nemám (plný text neotevřen); nevím, kterou metodu Adeline doporučuje pro RGB.
- Žádný otevřený (CC BY, CC0) dataset stínů v ortofotu jsem nenašla; AISD je nekomerční.

## Kompenzace stínu (relighting) a co z ní má smysl pro pruhy, obruby a auta

### Takeaway
Tři klasické korekce: gama, lineární korelace (průměr a směrodatná odchylka stínu → okolí) a přizpůsobení histogramu;
srovnávací práce na satelitu hodnotí nejlépe lineární korelaci, Tsai používá histogram proti okolnímu bufferu. Všechny
musí běžet **po třídách povrchu** (stín na silnici ≠ stín na zeleni), jinak zkreslují.

### Cited Findings
- Gama: DN = DNstín^(1/γ), γ z průměru stínu a sousedního nestínu; lineární korelace: DN = (σ_nestín/σ_stín)·(DN −
  μ_stín) + μ_nestín; přizpůsobení histogramu po pásmech s oknem z quadtree. Parametry platí jen pro stejnou kombinaci
  vrhač/povrch („stín stromů na holé půdě“ nepoužít na jiné povrchy); stín domu na silnici je jinak tmavý než stín
  stromů. Nejlépe vyšla **lineární korelace**; po korekci ostré hrany, proto medián / bilaterální filtr. (CartoSat-2S,
  0,6–1,6 m; hodnocení hlavně vizuální, uvedené kappa 0,011 a „přesnost 7,97“ jsou nesmyslné, kvantitativně
  nepoužitelné.) — [Tejoram a kol. (NRSC)](https://tejoramv.github.io/data/Shadow_detection_and_Radiometric_Restoration_in_VHR_satellite_imagery.pdf)
- Tamtéž: tytéž tři metody zavedl Sarabandi a kol. (IGARSS 2004); Tsai 2003 přidal quadtree, adaptivní práh, růst
  oblastí a lokální přizpůsobení histogramu (citováno, neotevřeno). — [tamtéž](https://tejoramv.github.io/data/Shadow_detection_and_Radiometric_Restoration_in_VHR_satellite_imagery.pdf)
- Tsai 2006: histogram stínové oblasti → histogram 10 px bufferu kolem ní, výsledek „barevná stálost přes hranici
  stínu“; na dálnici se stíny tří aut i konstrukce srovnaly s okolím v HSI, YIQ, YCbCr. — [Tsai 2006](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)

### Inferences
- Pro nás stačí lineární korelace jen uvnitř vozovky (a zvlášť chodníku): μ, σ stínu a slunné části téže plochy v řezu,
  per kanál; pak stejné prahy pro čáry, hrany i sytost. Histogramové párování je dražší a u malého stínu (pár metrů
  pásu) nestabilní.
- Polostín (okraj stínu) korekce nevyřeší; hrany na hranici masky (± 2–3 px) pro auta, obruby i čáry ignorovat
  (shodně s doporučením v LITERATURA.md).

### Gaps
- Kvantitativní srovnání korekcí na leteckém RGB 10–25 cm jsem nenašla (Wu a kol. 2014, Can. J. RS, „4 shadow
  compensation techniques“ jen citováno, neotevřeno).
