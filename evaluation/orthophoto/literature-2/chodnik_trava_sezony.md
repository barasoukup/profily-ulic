# Vnější okraj chodníku proti trávě a předzahrádkám v RGB ortofotu (sezóny, mozaiky, normalizace)

Rešerše 19. 11. 2026. Navazuje na `evaluation/orthophoto/LITERATURE.md` (čáry, HD Maps, auta, zarovnání, stíny Tsai),
to se tu neopakuje. Uvádím jen zdroje, které jsem otevřela (abstrakt, stránka nebo plný text); kde jsem viděla
jen výsledek vyhledávání nebo abstrakt, je to napsané. Naše srovnávací čísla (Cottbus, Hegelstraße): dlažba
sytost (max−min) 2–7, jas 172–182; suchá tráva sytost 12–18, jas 145–159; stín domu tmavý, modravý, sytost ~25;
pravidlo zelené (G − (R+B)/2 ≥ 10) suchou trávu mine.

## 1. RGB vegetační indexy (ExG, ExGR, VARI, GLI, MGRVI…) a suchá/odumřelá tráva proti šedé/hnědé dlažbě

### Takeaway
Srovnávací studie RGB indexů existují jen pro **zelenou** vegetaci proti půdě (zemědělství, dron, kamera u země);
žádnou s čísly pro suchou trávu proti dlažbě jsem nenašla. Práce o odumřelé vegetaci výslovně říkají, že v RGB je
přechod zelená → hnědá spojitý a samotná barva/index nestačí; doporučují texturu a kontext, nebo SWIR (ten nemáme).

### Cited Findings
- Srovnání RGB indexů MGRVI, GLI, MPRI, RGBVI, ExG, VEG na 200 snímcích kukuřice a řepy ze 4 kamer, K-means (K = 2)
  a Otsu, pak otevření 15×15: nejlepší MGRVI (Dice 65–90 %), na nejlépe osvětlené sadě (JAI) Dice 86,8–91,3 %;
  nejlepší index se liší podle kamery (MGRVI pro GP a K2, RGBVI pro JAI, MPRI pro SE); **K-means byl obecně lepší
  než Otsu a Otsu kolísal víc mezi indexy**; nejhorší výsledky na sadě s velkými změnami jasu a odlesky půdy; indexy
  jsou citlivé na jas, stíny a ruční prahy. Suchá vegetace se neřeší. — [Segmentation of Agricultural Images using Vegetation Indices, SciTePress 2021](https://www.scitepress.org/Papers/2021/103250/pdf/index.html)
- Definice: GLI = (2G − R − B)/(2G + R + B), VARI = (G − R)/(G + R − B); ExG, GLI a VEG zvýrazňují zelený kanál,
  MGRVI, MPRI, RGBVI kombinují víc kanálů; ExG − ExR jde prahovat pevně nulou (bez Otsu). — shrnutí výsledků
  vyhledávání ze stránek [rgbIndices (CRAN vignette)](https://archive.linux.duke.edu/cran/web/packages/rgbIndices/vignettes/rgbIndices.html)
  a [SciTePress 2021](https://www.scitepress.org/Papers/2021/103250/pdf/index.html); vzorec ExG−ExR a nulový práh
  jsem v plném textu neověřila.
- Na zavlažované trávě byly všechny RGB indexy ovlivněné proměnlivým osvětlením; nejlépe (kvalitativně) MPRI a
  MGVRI, ExG a GLI hůř. — úryvek z [Barbosa a kol., Agronomy Research 17(2)](https://flore.unifi.it/bitstream/2158/1157005/1/Vol17No2_Barbosa.pdf) (jen výsledek vyhledávání, PDF neotevřeno)
- SegVeg (rozdělení RGB snímků na zelenou a odumřelou vegetaci a pozadí): pigmenty se při odumírání mění spojitě,
  „zelená“ a „odumřelá“ nemají v RGB ostrou hranici, proto doporučují texturu a kontext; kombinuje hlubokou síť
  (vegetace/pozadí) a mělký klasifikátor po pixelech (zelená/odumřelá). — [SegVeg, bioRxiv 2022](https://www.biorxiv.org/content/10.1101/2022.03.24.485604.full.pdf)
  (z úryvku ve vyhledávání; plný text vrátil HTTP 429, čísla F1 a licence neověřeny)
- Laliberte a kol. (2006, Jornada): pozemní VHR fotky převedené z RGB do IHS a objektová klasifikace na půdu, stín,
  zelenou a odumřelou vegetaci. — [Jornada bibliography](https://archive.jornada.nmsu.edu/biblio/separating-green-and-senescent-vegetation-very-high-resolution-photography-using-intensity)
  (jen výsledek vyhledávání; PDF nešlo otevřít, server nedostupný, prahy a přesnost neověřeny)
- Bishop a Errigo (2023): mapování stařiny invazní jednoleté trávy z dronového RGB pomocí VARI, na jedné lokalitě
  dobře, na druhé, heterogenní, „<20 %“ přesnosti jen z VARI a RGB. — [Ecological Indicators, DOAJ](https://doaj.org/article/00a9d2d22acc4e78aa033f29ffa94952)
  (jen úryvek; přesná metrika „<20 %“ nejasná)
- Suchá a odumřelá vegetace se běžně odlišuje ve SWIR (rozptyl nejsilnější v SWIR-1/2), ne ve viditelném pásmu. —
  [NV5 / ENVI, Non-Photosynthetic Vegetation](https://www.nv5geospatialsoftware.com/docs/NonPhotosyntheticVegetation.html) (úryvek)

### Inferences
- Pro naše čísla: suchá žlutavá tráva má R ≈ G > B, takže ExG = 2G − R − B ≈ G − B je kladné, ale malé, a GLI
  podobně; G − (R+B)/2 je totéž jako ExG/2, proto pravidlo ≥ 10 trávu se sytostí 12–18 mine. Lépe oddělující veličina
  pro „žlutou“ trávu je **žlutost** ((R+G)/2 − B, obdoba b* v Lab) nebo sytost: dlažba 2–7 vs. tráva 12–18 je
  podle našich dat odstup asi 2×. Stín má opačné znaménko žlutosti (modravý, B vysoké) při vysoké sytosti, takže
  podmínka „sytost vysoká **a** žlutost kladná nebo ExG kladné“ odliší trávu od stínu, kde samotná sytost ne. To je
  náš odvozený návrh, žádný zdroj ho na dlažbu netestoval.
- Hnědá zimní tráva a holá půda jsou blízko hnědé dlažbě (cihlová, zámková dlažba): barva sama nestačí; tady musí
  rozhodnout textura (bod 2) a skok vůči vlastní ploše chodníku, ne absolutní práh.
- Protože nejlepší index se mění s kamerou (SciTePress 2021), nemá smysl ladit jeden index napevno pro všechny
  mozaiky; prahovat relativně k první části chodníku (jak už děláme) je v souladu s tím, že K-means/relativní dělení
  bylo stabilnější než Otsu.

### Gaps
- Studie s čísly pro suchou trávu proti betonu/asfaltu/dlažbě v RGB ortofotu jsem nenašla.
- Hodnoty sytosti/odstínu odumřelé trávy z Laliberte 2006 a F1 ze SegVeg se nepodařilo ověřit (server nedostupný, 429).

## 2. Barevné a texturní hrany povrchů (Lab/HSV gradienty, lokální rozptyl, LBP, Gabor) a nepravidelné hranice

### Takeaway
Pro rozlišení trávy a zpevněných ploch ve VHR snímcích literatura opakovaně ukazuje, že spektrum samo plete trávu
s tmavou dlažbou a že pomáhá textura; nejlevnější a v jedné studii nejlepší je lokální rozptyl 3×3 (lepší než
entropie a LBP); velikost okna záleží na typu vegetace. Specifickou studii hrany chodník–trávník s čísly jsem nenašla.

### Cited Findings
- Ve VHR klasifikaci pokryvu měla tráva nejnižší přesnost z pěti tříd (69,3 %) a pletla se se stromy/keři a
  s tmavými nepropustnými povrchy; beton se pletl s holou půdou. — úryvek k [Remote Sensing 12(20) 3393, MDPI](https://mdpi.com/2072-4292/12/20/3393) (plný text neotevřen)
- Lokální rozptyl 3×3 na zeleném pásmu dosáhl vysoké úspěšnosti a překonal lokální entropii, poměr entropií a LBP
  (biotopy vegetace, ne zpevněné plochy). — úryvek k [ISPRS Archives XXXIX-B8 (2012), TIB](https://goobi.tib.eu/viewer/fulltext/1663822514/346) (neotevřeno)
- LBP překonalo GLCM o 4,42 p. b. celkové přesnosti (IKONOS); u WorldView-2 vyšla optimální okna CLBP pro trávu 3×3,
  pro stromy 11×11, smíšené 7–9. — úryvky z výsledků vyhledávání ([Remote Sensing 16(18) 3444](https://mdpi.com/2072-4292/16/18/3444) a související), zdroje jednotlivých čísel jsem neověřila
- RGB samotné dává obecně nižší přesnost než multispektrální data, ale textura a DSM z dronu přesnost RGB zlepšily;
  zakrytí korunami způsobilo 9 % (blok A) a ~3 % (blok B) ulic chybně jako vegetaci. — tamtéž (úryvky, neověřeno)
- Tile2Net uvádí jako hlavní příčiny chyb zakrytí stínem, vegetací a stavbami; chodníky pod korunami a ve stínu
  model často dopojí jako souvislé, ale automatická oprava chybějících úseků zůstává otevřená. — [Hosseini a kol., CEUS 2023 (plný text)](https://par.nsf.gov/servlets/purl/10493942)

### Inferences
- Pro náš řez napříč (sloupce po 5 m podél ulice): přidat k jasu a sytosti **lokální rozptyl jasu v okně ~3×3 px
  (0,3–0,4 m)**: dlažba je hladká (spáry zámkové dlažby ale texturu dělají), tráva a záhony zrnité. Mediány přes kusy
  (jak už děláme s „největším skokem v ±0,3 m“) jsou přesně ten způsob, jak tolerovat nepravidelnou hranici
  předzahrádek: robustní souhrn přes víc podélných kusů místo jedné přímky.
- Vícekanálový gradient (Di Zenzo / součet gradientů L, a, b) je levný; v literatuře, kterou jsem otevřela, pro
  tuto úlohu porovnaný není (viz Gaps).
- Stín: hranu, která leží na hranici stínové masky (Tsai, viz LITERATURE.md), z kandidátů okraje vyřadit; to už
  děláme podmínkou „ne do stínu“.

### Gaps
- Nenašla jsem studii, která by porovnala gradient v Lab/HSV, Gabor a LBP právě pro hranu chodník–tráva s čísly.
- Čísla v úryvcích výše (69,3 %, 4,42 p. b., okna CLBP, 9 % / 3 %) jsem nemohla přiřadit k plnému textu.

## 3. Práce o extrakci chodníků: Tile2Net, Ning a kol., OpenSidewalks, datové sady

### Takeaway
Tile2Net (HRNet-W48 + OCR, ~19 cm/px) dává na testu sidewalk IoU 82,7 %, ale je trénovaný jen na USA (Cambridge,
DC, NYC), kód BSD-3, licence vah na Figshare neuvedená. Ning a kol. (2022) z leteckých snímků sami dosahují nízké
přesnosti (precision 55 %, recall 74 % podle citace v Tile2Net) a ~0,9 až se Street View. Pro náš úkol (vnější okraj
proti trávě v Evropě) žádná z prací neměří přesnost hrany v metrech.

### Cited Findings
- Tile2Net: HRNet-W48 s Object-Contextual Representations; tréninkové dlaždice z19 (0,19 m/px), 11 000 dlaždic DC,
  28 000 Cambridge, 8 000 parky NYC, slepené na 512×512 (asi +12 % mIoU proti 256×256), celkem 20 000; v inferenci
  nejlepší kontext 1024×1024; použitelné zoomy 17–23, 3 m/px nestačí. Test: sidewalk IoU 82,67 % (P 0,90, R 0,92),
  road 86,04 %, crosswalk 75,42 %, background 93,94 %, mIoU 84,51 %. Pěšiny v parcích horší kvůli korunám a
  složité geometrii. — [Hosseini a kol., Mapping the walk, CEUS 101 (2023) 101950, plný text na NSF PAR](https://par.nsf.gov/servlets/purl/10493942)
- Tile2Net cituje starší práce s nízkou přesností z leteckých snímků: přechody Luttrell (2022) accuracy 55,59 %,
  recall 15,41 %; chodníky Ning a kol. (2022) precision 55 %, recall 74 %, obě zlepšené až snímky z ulice. — [tamtéž](https://par.nsf.gov/servlets/purl/10493942)
- Kód Tile2Net je BSD-3-Clause; váhy jsou na Figshare (DOI), licence vah na stránce repozitáře neuvedená; podporované
  oblasti jen USA (Boston, Cambridge, NYC, DC, Alameda, Oregon); výsledky mimo tréninková města nedoložené. — [GitHub VIDA-NYU/tile2net](https://github.com/VIDA-NYU/tile2net)
- Ning, Ye, Chen, Liu, Cao: Sidewalk extraction using aerial and street view images, Env. & Planning B 49(1), 7–22:
  segmentace z leteckých snímků, pak doplnění zakrytých úseků podle Street View; 4 okresy USA, precision i recall
  kolem 0,9 (po doplnění), Street View propojí 20 % volných konců. — [NJIT Research](https://researchwith.njit.edu/en/publications/sidewalk-extraction-using-aerial-and-street-view-images/) (abstrakt). Pozor: rozdíl
  proti 55/74 % v citaci Tile2Net je nejspíš „jen letecké“ proti „po doplnění“, v abstraktu to rozepsané není.
- LoveDA (pokryv urban/rural pro doménovou adaptaci; 5 987 snímků, 166 768 objektů, 3 města): licence
  **CC BY-NC-SA 4.0**, tedy nepoužitelné pro váhy pod MIT. — [arXiv 2110.08733](https://arxiv.org/abs/2110.08733v6)

### Inferences
- Tile2Net IoU 82,7 % je plošná shoda, ne přesnost okraje: chodník 2 m široký s chybou okraje 0,4 m na každé straně
  má IoU ~0,67, takže 0,83 odpovídá chybě okraje řádově 0,1–0,2 m, ale jen v amerických městech, kde je trávník
  mezi chodníkem a vozovkou i za ním standard (to je právě náš případ, jen v jiném podnebí a mozaice). Licence vah
  neuvedená → bez výslovné licence je nepoužít ani k trénování našeho modelu.
- Pro náš U-Net (kerbs, MobileNetV3) je přirozené rozšíření o třídu „vnější okraj chodníku“ z map povrchů, na kterých
  už trénujeme (Praha, Vídeň, Berlín, Hamburk); americké modely nic nepřidají.

### Gaps
- OpenSidewalks/AccessMap a Luo a kol. jsem v rámci limitu dotazů neotevřela; SpaceNet chodníky neobsahuje
  (neověřeno v tomto kole).
- Licence vah Tile2Net na Figshare jsem neověřila (stránku Figshare jsem neotevřela).

## 4. Normalizace mezi snímky a sezónami: relativní prahy, Otsu, vyrovnání histogramu, gray-world, doménová adaptace

### Takeaway
Nejlepší doložený levný postup pro **síť** je náhodné párování histogramů při tréninku (RHM): u U-Netu ResNet-50
z 0,415 na 0,553 IoU průměrně mezi městy, lepší než gray-world, vyrovnání i párování histogramu v době testu a
srovnatelné s CycleGAN. Standardizace v době testu (gray-world, histogram eq./match) pomáhá málo nebo vůbec. Pro
**ruční pravidla** literatura podporuje relativní prahy (K-means/relativní dělení stabilnější než Otsu).

### Cited Findings
- RHM (Yaras a kol., IEEE JSTARS 2021): trénovací snímek se napáruje na histogram náhodného neoznačeného snímku cílové
  domény; budovy, Inria + DeepGlobe, 0,3 m, U-Net ResNet-50. Jedna → jedna (IoU, průměr 4 párů): bez úprav 0,415;
  affine 0,522; gamma 0,432; HSV 0,483; RHM 0,542 (bez převzorkování) / **0,553**; vyrovnání histogramu 0,449;
  **gray-world 0,440**; párování histogramu v testu 0,476; ColorMapGAN 0,412. Inria → DeepGlobe (průměr měst):
  bez úprav 0,447; RHM 0,520; gray-world 0,426; vyrovnání histogramu 0,378; párování histogramu 0,360; CycleGAN 0,519
  (CycleGAN se trénoval přes 3 dny na Titan RTX). Augmentace dává robustnost jen k typu posunu, který v tréninku byl
  (trénink HSV → test RHM 0,631 atd.). — [arXiv 2104.14032 (plný text)](https://arxiv.org/pdf/2104.14032v3.pdf)
- Párování histogramu se používá i dál pro letecké snímky z více zdrojů a rozlišení (SegFormer, mořská tráva) a pro
  budovy (objektová augmentace + normalizace histogramem). — [Remote Sensing 17, 2518 (2025)](https://mdpi-res.com/d_attachment/remotesensing/remotesensing-17-02518/article_deploy/remotesensing-17-02518.pdf),
  [Applied Sciences 16(1) 543 (2026)](https://www.mdpi.com/2076-3417/16/1/543) (jen úryvky, čísla neověřena)
- Na německých městských datech (RF, DeepLabV3+) doménová adaptace (CCA, párování histogramu) zlepšila přesnost a
  přidání nDSM pomohlo na neviděných datech; CC BY 4.0. — [ISPRS Annals X-4-W6-2025, 17](https://isprs-annals.copernicus.org/articles/X-4-W6-2025/17/2025/) (abstrakt; čísla ani města v abstraktu nejsou)
- LoveDA: samotný přehled UDA tvrdí, že adversariální metody selhávají kvůli velké vnitrotřídní rozmanitosti
  urban/rural a samoučení (CBST, IAST) je nadějnější; ST-DASegNet na SegFormeru je v soutěži LoveDA 4. (rural→urban)
  a 2. (urban→rural). — [arXiv 2301.05526](https://arxiv.org/pdf/2301.05526) a druhotné shrnutí LoveDA (úryvky; tabulky neověřeny)
- Otsu na indexech kolísal víc než K-means s inicializací z extrémů. — [SciTePress 2021](https://www.scitepress.org/Papers/2021/103250/pdf/index.html)

### Inferences
- Pro naše pravidla (jeden výřez na klik): **neprahovat absolutně, ale vůči vlastní ploše řezu**: referenční sytost
  a jas z prvního metru chodníku za obrubou (už děláme), krok porovnávat s typickým krokem v témže snímku (MAD
  sousedních sloupců), a v řezu rozdělit hodnoty na dvě skupiny (K-means K = 2 nad [sytost, žlutost, rozptyl]
  inicializované z extrémů) místo pevného prahu. Gray-world na celý výřez nedávat: v RHM vyšel hůř než nic.
- Pro malý U-Net v prohlížeči: při tréninku přidat RHM (párovat na histogramy výřezů z ČÚZK, IPR, ZBGIS, basemap.at,
  DOP Länder a z různých ročních období, bez anotací), ne normalizovat při inferenci. Cena v tréninku je malá,
  v prohlížeči nulová. Sezóny (suchá tráva, holé stromy) se ale nedají vyrobit párováním histogramu, protože mění
  barvu jen u vegetace; na to potřebujeme v tréninku snímky z různých let a měsíců (DOP zemí i ČÚZK mají různé termíny).
- LoveDA (NC) ani SkyScapes (NC) do tréninku vah pod MIT nepatří; RHM je metoda, ne data, licence problém nemá.

### Gaps
- Kód RHM: oficiální repozitář ani licenci jsem v textu nenašla.
- Žádnou studii s čísly pro sezónní posun (léto/předjaří) v leteckých RGB ortofotech měst jsem nenašla; čísla
  z ISPRS Annals 2025 (německá města) zůstala v PDF neotevřená.
