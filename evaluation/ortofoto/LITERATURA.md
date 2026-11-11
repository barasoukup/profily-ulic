# Ortofoto: rešerše literatury a nástrojů (11. 11. 2026)

Navazuje na pokus v `ZPRAVA.md`. Otázka: co už existuje na čáry, šířky pruhů, auta u obruby, zarovnání
vektorů k ortofotu a stíny, a co z toho se hodí pro **náš případ**: jeden malý výřez na kliknutí, výpočet
v prohlížeči (ms až 1 s), ortofoto 5–25 cm/px, české ulice, k dispozici MTVU / technická mapa a OSM.

Uvádím jen zdroje, které jsem při rešerši otevřel nebo dohledal (abstrakt, repozitář, plný text). Kde číslo
nebo licenci nešlo ověřit, je to napsané. Licence dat „jen nekomerčně“ (NC) by nás nemusela zastavit
(aplikace je zdarma, MIT), ale **váhy natrénované na NC datech nejde čistě vydat pod MIT**; to řešit vždy.

---

## 1. Vodorovné značení z leteckých snímků

| zdroj | metoda | GSD | výsledky | kód / data, licence |
|---|---|---|---|---|
| Azimi a kol.: **Aerial LaneNet**, IEEE TGRS 2019, [arXiv 1803.06904](https://arxiv.org/abs/1803.06904) | symetrická FCN + vlnková transformace, vážená ztráta (čára : pozadí ≈ 1 : 400) | 13 cm (DLR 3K, Mnichov) | čáry: recall 71,6 %, precision 69,7 %, Dice 71 %, mIoU 77,8 % (DeepLabv3+ 73,2 %) | data AerialLanes18 (20 snímků) slíbená, odkaz v článku není; kód ne |
| Azimi a kol.: **SkyScapes**, ICCV 2019, [arXiv 2007.06102](https://arxiv.org/abs/2007.06102), [stránka DLR](https://www.dlr.de/en/eoc/about-us/remote-sensing-technology-institute/photogrammetry-and-image-analysis/public-datasets/dlr-skyscapes) | 31 tříd, z toho 12 druhů čar; SkyScapesNet (s hranami) | 13 cm, 16 snímků 5616×3744, Mnichov | úloha čar (13 tříd): mIoU 51,9 % (nejlepší baseline 48,9 %) | jen nekomerčně, bez redistribuce, registrace ([podmínky](https://eoc-datasets.dlr.de/license-terms)) |
| Krajewski, Kim: **DeepAerialMapper**, 2024, [arXiv 2410.00769](https://arxiv.org/abs/2410.00769), [GitHub](https://github.com/RobertKrajewski/DeepAerialMapper) | UPerNet-ResNet50 segmentace (silnice, chodník, stání, ostrůvky, čáry, symboly, vozidla) → Lanelet2 mapa | 5 cm, městské ortofoto Cách | mIoU 0,70; čáry precision i recall 0,96 (na predikci), 0,97 na ručních maskách | kód GPLv3; váhy a data zveřejněné nejsou (ověřeno jen README) |
| Tournaire, Paparoditis: **marked point processes**, ISPRS J. 2009, [doi 10.1016/j.isprsjprs.2009.05.005](https://doi.org/10.1016/j.isprsjprs.2009.05.005); [PIA07 verze](https://www.pia.tum.de/isprs/pia07/puba/PIA07_Tournaire_et_al.pdf) | přerušovaná čára = řada obdélníků s pevnou délkou a mezerou podle předpisů, RJMCMC + simulované žíhání | testováno na více rozlišeních (konkrétní GSD neověřeno) | čísla jsem z plného textu neověřila | bez kódu |
| Svatý, Vrtal, Kouhout, Nouzovský (ČVUT FD): [ISPRS Archives XLVIII-5/W2-2023, 111](https://isprs-archives.copernicus.org/articles/XLVIII-5-W2-2023/111/2023/) | barevné prahování, shlukování, vektorizace prvků silnice (i čar) z ortofota z dronu | dron (cm) | přesnost v abstraktu neuvedena | bez kódu; **jediná česká práce, kterou jsem našel** |

Další: Pink, Stiller (KIT, [IV 2009](https://www.mrt.kit.edu/z/publ/download/Pink_IV09.pdf), ITSC 2010) – čáry
z ortofota jako mapa pro lokalizaci auta (klasifikátor + 3D poloha); Jin, Feng ([FIG 2010](https://www.fig.net/resources/proceedings/fig_proceedings/fig2010/papers/ts03h/ts03h_jin_feng_4403.pdf))
– ISODATA v YCrCb + detekce a kompenzace stínu před hledáním čar; Sheu, Kurz, Angelo
([ISPRS Annals IV-1, 2018](https://isprs-annals.copernicus.org/articles/IV-1/147/2018/)) – čáry jako úloha
detekce linií, předpoklad bílé čáry šířky 0,3 m.

**Co z toho plyne pro nás**
- Při 10–13 cm hlásí hluboké sítě recall čar kolem 70 % (Aerial LaneNet), při 5 cm až 96 % (DeepAerialMapper,
  ale jen na úsecích jednoho města). Náš ruční detektor (71–87 % vozovek s čarou) je ve stejném pásmu – měříme
  ale „najdu aspoň nějakou čáru ve vozovce“, ne pixely, takže čísla nejsou přímo srovnatelná.
- Všechny práce jmenují stejné chyby jako my: stín stromů a domů, vybledlé čáry, světlé objekty podobné čarám.
- Pro 25 cm (ČÚZK starší vrstva) čára široká 12,5–25 cm vychází na 0,5–1 px – na hranici; 12,5 cm je
  rozumné minimum, shodně se SkyScapes / Aerial LaneNet (13 cm).
- Verdikt: **DL modely nejsou volně k dispozici (váhy ani data s volnou licencí)**; užitečné jsou jako ověření,
  že tvarová apriorní znalost (šířka čáry, perioda čárkování, Tournaire) a hrany pomáhají. Klasika stačí.

## 2. Počet a šířky pruhů, příčné řezy, chodníky

| zdroj | co měří | GSD | výsledky | kód / licence |
|---|---|---|---|---|
| Máttyus, Wang, Fidler, Urtasun: **HD Maps**, CVPR 2016, [CVF](https://openaccess.thecvf.com/content_cvpr_2016/html/Mattyus_HD_Maps_Fine-Grained_CVPR_2016_paper.html), [data DLR](https://www.dlr.de/en/eoc/about-us/remote-sensing-technology-institute/photogrammetry-and-image-analysis/public-datasets/hd-maps) | **příčný řez** po úsecích OSM: chodník – stání – pruhy 1–6 – stání – chodník, řešeno MRF / dynamickým programováním napříč ulicí, s omezením šířek (stání 1,8–4,5 m, pruh 2,3–4,6 m) | 9 cm, Karlsruhe (Air-Ground-KITTI) | jen letecký snímek: chyba počtu pruhů 0,54–0,73 pruhu (průměr L1), IoU silnice ~62–68 %, chodník ~32–40 %, stání ~36–38 %; bez čar je počet pruhů „velmi těžký“ | data CC BY-NC-ND 3.0 (146 MB); kód nenalezen |
| Máttyus a kol.: **Enhancing Road Maps**, ICCV 2015, [CVF](https://openaccess.thecvf.com/content_iccv_2015/papers/Mattyus_Enhancing_Road_Maps_ICCV_2015_paper.pdf) | šířka a posun osy OSM úseků (MRF), opravuje i posun OSM | letecké + satelitní | čísla neověřena (PDF nešlo stáhnout) | data a kód podle DLR k dispozici |
| Hosseini, Sevtsuk a kol.: **Tile2Net**, CEUS 2023, [GitHub](https://github.com/VIDA-NYU/tile2net) | segmentace silnice, chodníku, přechodu, pěšiny → síť chodníků | ≥ z19 (~30 cm), doporučeno jemnější | IoU jsem neověřil | **BSD-3**, váhy na Figshare; trénováno na Cambridge, DC, NYC |
| Wei a kol.: [ISPRS Annals V-2-2020, 925](https://isprs-annals.copernicus.org/articles/V-2-2020/925/2020/) | CNN regrese osy a šířky silnice, okraje z šířky | VHR | – | – |
| Seo, Urmson, Wettergreen: [SIGSPATIAL 2012 (CMU)](https://ri.cmu.edu/publications/ortho-image-analysis-for-producing-lane-level-highway-maps-2) | pruhy dálnic z ortofota | – | 337 ze 417 pruhů správně (81 %) | – |

**Co z toho plyne pro nás**
- HD Maps je **přesně náš problém** (řez napříč ulicí s pruhy, stáním a chodníky) a jeho klíčová myšlenka je
  levná: řez jako posloupnost pásů s omezenými šířkami, optimum dynamickým programováním nad „potenciály“
  z obrázku (hrany, čáry, auta). My už máme lepší vstup než oni (MTVU dává obruby a chodníky přesně, OSM počet
  pruhů), takže DP stačí jen uvnitř vozovky: rozdělit ji na pruhy / stání / krajnici tak, aby hranice padly
  na nalezené čáry a šířky byly v normových mezích (2,75–4 m pruh, 2,0–2,5 podélné stání…).
- Tile2Net je americký a pro nás zbytečný: chodníky a vozovku máme z MTVU / technické mapy přesněji.
- Verdikt: **užitečné jako metoda (DP s apriorními šířkami), ne jako hotový model.**

## 3. Vozidla a auta u obruby

| dataset / model | GSD | obsah | licence |
|---|---|---|---|
| **COWC** (Mundhenk a kol., ECCV 2016), [LLNL](https://gdo152.llnl.gov/cowc/), [arXiv 1609.04453](https://arxiv.org/abs/1609.04453) | 15 cm (sjednoceno), auto 24–48 px | 32 716 aut, 58 247 těžkých negativů; Potsdam, Vaihingen, Toronto, Utah… | na stránce neuvedena; repozitář UCSD uvádí AGPL-3.0 – nejasné |
| **VEDAI** (Razakarivony, Jurie 2015), [download](https://downloads.greyc.fr/vedai/) | 12,5 cm (1024²) a 25 cm (512²), RGB+IR | ~1 250 snímků, ~3 700 vozidel, Utah | neověřeno |
| **EAGLE** (Azimi a kol., ICPR 2020), [DLR](https://www.dlr.de/en/eoc/about-us/remote-sensing-technology-institute/photogrammetry-and-image-analysis/public-datasets/eagle), [arXiv 2007.06124](https://arxiv.org/abs/2007.06124) | **5–45 cm, střední Evropa**, 2006–2019 | 318 snímků, 215 986 vozidel s orientací a příznakem viditelnosti (i stín, opar) | DLR, CC BY-NC-ND 3.0 (uvedeno u obrázků) |
| **DOTA** v1 / v2 | různé (Google Earth aj.) | třída „small vehicle“ | jen akademicky, komerčně zakázáno |
| **ISPRS Potsdam / Vaihingen** | 5 / 9 cm | segmentace se třídou „car“ | podmínky ISPRS (nutný souhlas) |
| **CARPK** ([arXiv 1707.05972](https://arxiv.org/abs/1707.05972)) | dron 40 m, šikmo | 89 777 aut na 4 parkovištích | jen akademický výzkum; pro ortofoto nevhodné |

Modely:
- **Ultralytics YOLO11n-OBB** (DOTA v1, 1024 px): 2,7 M parametrů, 17,2 GFLOPs, mAP50 78,4 (všechny třídy,
  multiscale), 117 ms na CPU v ONNX ([docs](https://docs.ultralytics.com/tasks/obb/)). Váhy **AGPL-3.0** + data DOTA
  jen akademicky. Do prohlížeče přes ONNX Runtime Web jde (INT8 ~3 MB, viz např.
  [AeroEdge YOLO11n](https://huggingface.co/pavanyadava07/aeroedge-yolo11n), mAP50 0,57, rovněž odvozené z AGPL).
- **MMRotate** (OpenMMLab, [GitHub](https://github.com/open-mmlab/mmrotate)) – kód **Apache-2.0**, RTMDet-R
  na DOTA ~78,9 mAP; váhy jsou ale opět z DOTA (akademicky).
- Porovnání malých YOLO (v8n, v9t, v10n, v11n) na EAGLE: Dustali, Hasanlou, Azimi,
  [ISPRS Archives XLVIII-G-2025, 411](https://isprs-archives.copernicus.org/articles/XLVIII-G-2025/411/2025/) (čísla jen v PDF).

Parkování na ulici konkrétně:
- **Rauch, Henry, Mühlhaus, Kurz, Hellekes, Merkle (DLR): Berlín**, [ISPRS Archives XLVIII-4/W16-2025, 83](https://isprs-archives.copernicus.org/articles/XLVIII-4-W16-2025/83/2025/)
  (CC BY 4.0, plný text přečten). Ortofoto DOP 10 cm celého Berlína (2024). Segmentace dopravních ploch modelem
  trénovaným na datasetu **TIAS** (51 snímků 7–14 cm, německá města; třídy road, bikeway, footway, parking,
  road shoulder… a příznak „road sdílená s parking“, když auta stojí na vozovce bez vyznačení). Vozidla: DINO
  s orientovanými rámečky, trénováno na EAGLE, mAP50 78,5, okno 1024 px. Způsob stání (podélné 36 %, šikmé 27 %,
  kolmé 20 %) z úhlu os aut vůči ose ulice. 1,04 mil. vozidel, 1,33 mil. míst. Výslovně: **zakrytí stromy, domy
  a stíny je hlavní problém**, plně zakryté plochy nezmapují; plánují korekční faktory.
- **Hellekes a kol. (DLR): Parking space inventory from above**, IET ITS 2022,
  [doi 10.1049/itr2.12322](https://doi.org/10.1049/itr2.12322) – CNN segmentace stání, **slučování segmentací
  z více snímků kvůli úplnosti**, pro neviděné ulice statistický model (Gamma hurdle) z délky a typu ulice, OSM
  a využití území. To je obdoba našeho „odhadu podle zákona“, jen naučená z dat.

**Co z toho plyne pro nás**
- 10–15 cm je pro auta dobré rozlišení (auto 30–45 px), 25 cm je hraniční (auto ~18×8 px) – souhlasí s naším
  zjištěním, že ČÚZK 25 cm dělá falešná auta.
- Malý detektor (YOLO-n, RTMDet-tiny) by v prohlížeči na náš výřez (~40×20 m = 320×160 px při 12,5 cm) běžel
  desítky ms. **Překážkou jsou licence**, ne výkon: všechny hotové váhy jsou AGPL nebo z akademických dat.
  Čistá cesta: vlastní malý model trénovaný na našich ortofotech (IPR, ČÚZK – jejich licence trénink dovoluje,
  ověřit) s anotacemi poloautomaticky z EAGLE-modelu jen jako pomocníka, nebo jen pro vyhodnocení.
- Stín: EAGLE i Berlín ukazují, že síť auto ve stínu najde líp než náš prah hran, ale pod korunami ne.
  Jedna chvíle snímku zůstává; DLR to řeší **spojením více snímků** – my máme ČÚZK + IPR (2 termíny) + Brno.
- Verdikt: **užitečné hlavně ověřit offline** (stáhnout YOLO11n-OBB, pustit na našich 100 řezech, porovnat
  s ručním detektorem), do aplikace až po vyřešení licence vah.

## 4. Zarovnání vektorů k ortofotu

Přesnost podkladů (pro odhad, co je „normální“ posun):
- **Ortofoto ČR** ([technická zpráva ČÚZK, verze 4/2026](https://geoportal.cuzk.gov.cz/Dokumenty/TZ_Ortofoto_CR.pdf)):
  střední polohová chyba na signalizovaných bodech v terénu **0,18–0,19 m** (2023–2025, pixel 12,5 cm),
  od 0,20 m pixelu se už lineárně nezlepšuje. Ortorektifikace na DMR 4G (5 m mřížka, mosty doplněny), tedy
  **ne true-ortho**: budovy a stromy jsou vykloněné, švy se vyhýbají budovám, rozdíly mezi pásy snímkování
  zůstávají. Čili obruba ve stínu domu nebo zakrytá vykloněnou fasádou se nedá použít jako vlícovací hrana.
- MTVU / technická mapa mají vlastní chybu v řádu decimetrů; náš naměřený posun 0,4–0,5 m je tedy v součtu
  obou chyb, 2,2 m u Brna 2025 je systematický posun transformace (stejně jako u služeb Jihlavy a Plzně).
- OSM: Haklay 2010 ([Env. & Planning B 37(4)](https://ideas.repec.org/a/sae/envirb/v37y2010i4p682-703.html))
  udává průměrnou odchylku OSM od Ordnance Survey kolem 6 m (číslo z druhotného zdroje) – OSM se k zarovnání
  nehodí, jen k topologii a počtu pruhů.

Metody:
| zdroj | metoda | poznámka |
|---|---|---|
| Barrow a kol. 1977 **chamfer matching** ([DTIC](https://apps.dtic.mil/sti/html/tr/ADA458355/index.html)) | vzdálenostní transformace hran obrázku, posun vektorových hran, minimum součtu vzdáleností | náklad úměrný délce hran, ne ploše; **přesně náš případ** |
| Costea, Leordeanu, BMVC 2016, [arXiv 1605.08323](https://arxiv.org/abs/1605.08323) | silnice z obrázku × OSM: Shape Context + RANSAC, skóre symetrický chamfer | 1 m/px, chyba křižovatek < 2,5 m u ~90 % |
| Knoblock, Shahabi, Chen, Usery 2006 ([USGS](https://www.usgs.gov/publications/automatic-alignment-vector-data-and-orthoimagery-national-map)) | conflation: řídicí body na křižovatkách, filtrování, rubber-sheeting | klasika pro silniční vektory |
| Girard, Charpiat, Tarabalka, IGARSS 2019, [arXiv 1903.06529](https://arxiv.org/abs/1903.06529), [GitHub mapalignment](https://github.com/Lydorn/mapalignment) | CNN odhaduje pole posunů mapy budov vůči snímku, multi-resolution | TensorFlow, licence v LICENSE.txt (nezjištěna); pro nás těžké |
| Vargas-Muñoz a kol., ISPRS J. 2019, [arXiv 1901.08190](https://arxiv.org/abs/1901.08190) | MRF: posun každé budovy maximalizuje korelaci s mapou pravděpodobnosti, sousedé mají podobný posun | myšlenka „sousední řezy mají podobný posun“ je pro nás levná |
| Habbecke, Kobbelt ([RWTH](https://www.graphics.rwth-aachen.de/media/papers/mapcalib.pdf)) | registrace šikmých snímků ke katastru | upozorňuje, že posun **není konstantní** |
| fázová korelace (např. koregistrace ortofot, [MDPI IJGI 9/8/482](https://mdpi.com/2220-9964/9/8/482)) | FFT, posun z vrcholu korelace | ostrý vrchol = spolehlivost; vhodné ortofoto ↔ ortofoto nebo ortofoto ↔ rasterizovaná MTVU |

Jak posoudit spolehlivost (shrnutí postupů z uvedených prací a z našeho pokusu):
1. **Ostrost a jedinečnost minima**: poměr nejlepšího a druhého nejlepšího skóre (mimo okolí 0,5 m), u fázové
   korelace výška vrcholu nad šumem. Plochá skóre = nepoužít.
2. **Hrany ve více směrech**: posun napříč ulicí určují podélné obruby a čáry, posun podél ulice jen příčné hrany
   (přechody, nároží, ostrůvky). Pro řez stačí posun napříč, podélný nechat nula.
3. **Konzistence**: s posunem sousedních řezů (mezi kliky si pamatovat posun daného ortofota v okolí), mezi
   ortofoty (ČÚZK vs. IPR), a s apriorním rozdělením (ČÚZK ~0,2 m, známé systematické posuny měst).
4. **Jen hrany v úrovni terénu**: obruby mimo stín a mimo vyklopené fasády (v pásu u domu do výšky × tg úhlu).

Verdikt: **chamfer (vzdálenostní transformace) napříč ulicí na obruby + čáry s mírou ostrosti** je levné
(ms) a vychází přímo z literatury; CNN zarovnání (Girard) je pro jeden výřez zbytečně těžké.

## 5. Stíny

| zdroj | metoda | poznámka |
|---|---|---|
| Tsai, IEEE TGRS 2006 ([PDF](https://www.ce.nchu.edu.tw/Pic/Writings/882_TGRS2006_Shadow.pdf)) | stínový index = poměr odstínu a jasu (H/I) v invariantních barevných modelech, práh Otsu, pak kompenzace | standard; falešné stíny u tmavě modrých a tmavých objektů |
| Chung a kol.; varianta v CIELCh (log poměru) – viz přehled v [MDPI Appl. Sci. 10/6467](https://www.mdpi.com/2076-3417/10/18/6467) | upravený poměr + postupné prahování | méně falešných detekcí |
| Li, Zhang, Shen, IEEE TGRS 2012 ([PDF](https://sendimage.whu.edu.cn/wp-content/uploads/242014_An-Adaptive-Nonlocal-Regularized-Shadow-Removal-Method-for-Aerial-Remote-Sensing-Images.pdf)) | nelokální odstranění stínu; polostín ve VHR snímcích není binární | pro nás zbytečně drahé |
| Jin, Feng, FIG 2010 (výše) | detekce a kompenzace stínu jako krok před hledáním čar | stejný postup jako potřebujeme |
| EAGLE (výše) | dataset obsahuje vozidla ve stínu a oparu | síť se stín „naučí“ |

**Co z toho plyne pro nás**
- Asfalt ve stínu je modřejší a tmavší, ale **kontrast čáry k okolí zůstává poměrový**. Náš detektor už pracuje
  s relativním prahem (14 %), ale s absolutním minimem (aspoň o 10) – ve stínu to čáry zabíjí. Stačí:
  stínová maska (Tsai H/I nebo prostě jas pod percentilem asfaltu v řezu), v ní zisk = medián slunného asfaltu /
  medián stinného asfaltu, a prahy počítat z lokálního mediánu a MAD místo absolutních čísel.
- Hrana stínu je dlouhá podélná hrana podobná obrubě a čáře: z hran pro zarovnání i pro auta vyřadit hrany,
  které leží na hranici stínové masky.
- Verdikt: **levné a přímo použitelné** (desítky řádků JS, ms).

## Evropská a česká otevřená data se značením nebo povrchem vozovky

- **Česká data s vodorovným značením jsem nenašla** (IPR, ČÚZK ani města ho ve vrstvách nemají, viz CLAUDE.md
  o dopravním značení). Jediná česká práce: Svatý a kol. (ČVUT FD, 2023), bez dat.
- **SkyScapes** (Mnichov, 13 cm, 12 druhů čar) – jen nekomerčně, bez redistribuce. Nejlepší pro ověření.
- **AerialLanes18** (Mnichov, 13 cm) – oznámeno, veřejný odkaz jsem nenašla.
- **HD-Maps / Air-Ground-KITTI** (Karlsruhe, 9 cm; silnice, stání, chodník, čáry jako polylinie) – CC BY-NC-ND 3.0.
- **TIAS** (DLR, 51 snímků 7–14 cm, Berlín, Hamburk, Mnichov…; stání sdílené s vozovkou) – dostupnost neověřena.
- **EAGLE** (střední Evropa, 5–45 cm, vozidla s orientací) – CC BY-NC-ND 3.0.
- **ISPRS Potsdam / Vaihingen** (5 / 9 cm, třída car) – podmínky ISPRS.
- **DeepAerialMapper** (Cáchy, 5 cm; čáry, stání, ostrůvky) – kód GPLv3, data nezveřejněna.
- Mimo značení: LandCover.ai (Polsko, 25/50 cm, třída silnice), finský trénovací soubor silnic NLS – pro nás málo.

---

## Doporučení pro nás

Seřazeno podle poměru užitek / práce. Všechno kromě bodu 5 běží v prohlížeči v řádu ms.

1. **Pruhy dynamickým programováním napříč vozovkou** (podle Máttyus a kol. 2016). Vstup: vozovka z MTVU
   (zarovnaná), profil jasu napříč (součet podél ulice ±20 m, tedy projekce, jakou už máme), nalezené čáry
   s vahou, počet pruhů z OSM/profilu, normové meze šířek (pruh 2,75–4 m, stání, krajnice od 1 m). DP vybere
   hranice pruhů na čarách a šířky v mezích; kde čára chybí, platí rovné dělení. Práce: **1–2 dny**. Proč: přímo
   řeší hlavní příležitost ze ZPRAVA.md (hranice sedí s čarou jen u 16–24 %), bez nových dat a modelů.
2. **Zarovnání chamferem s mírou spolehlivosti**. Vzdálenostní transformace hran jasu ve výřezu, posun napříč
   ulicí ±3 m po 0,1 m, hrany = obruby MTVU + nalezené čáry, jen hrany v terénu (mimo stínovou masku, mimo pás
   vyklopených fasád). Spolehlivost: poměr 1. a 2. minima, shoda s ČÚZK apriori (~0,2 m), u Brna 2025 předem
   odečíst systematický posun 2,2 m. Pod prahem ortofoto nepoužít. Práce: **1 den**. Proč: dnes se doladění mezi
   ortofoty shoduje jen u 25–33 % řezů; bez spolehlivého zarovnání nemá bod 1 smysl.
3. **Normalizace stínu** (Tsai H/I nebo percentil jasu asfaltu → maska, zisk podle poměru mediánů, relativní
   prahy z mediánu/MAD). Práce: **0,5–1 den**. Proč: stín je v naší zprávě i ve všech pracích hlavní příčina
   chybějících čar a falešných aut; opraví čáry i krajnice.
4. **Tvarová kontrola čárkování** (zjednodušený Tournaire 2009): podél nalezené čáry autokorelace jasu, perioda
   a střída přerušované čáry podle českých předpisů (TP 133 / vyhl. 294/2015, čísla doplnit z předpisu), plná
   vs. přerušovaná → vodicí čára vs. dělicí; šrafy jako periodické šikmé pruhy. Práce: **1 den**. Proč: odliší
   krajnici za vodicí čárou od pruhu a šrafy od asfaltu, potlačí falešné čáry (šipky, záplaty, švy).
5. **Offline zkouška hotového detektoru aut** (YOLO11n-OBB z DOTA nebo model z EAGLE) na našich 100 + 100
   řezech, IPR 10 cm a ČÚZK 12,5 cm, proti ručnímu detektoru a ruční kontrole. Práce: **2–3 dny** (Python, mimo
   aplikaci). Proč: zjistí, jestli síť řeší stíny natolik, že stojí za to řešit licenci (AGPL / akademická data)
   nebo trénovat vlastní malý model pro ONNX Runtime Web (~3 MB INT8, desítky ms na výřez).
6. **Více snímků místo jednoho** (jako Hellekes 2022): auta u obruby hlasovat přes ČÚZK + IPR (a v Brně
   městské ortofoto), stání = auta na většině snímků; jinak ponechat odhad podle zákona. Práce: **0,5 dne**
   (nad stávajícím detektorem). Proč: odstraní problém „jednou auta, jednou ne“, cena jsou 1–2 dotazy navíc
   na kliknutí, takže zapnout jen na vyžádání (ohleduplnost ke službám IPR).

Nedoporučuji teď: hluboké segmentační modely (SkyScapesNet, UPerNet z DeepAerialMapper, Tile2Net) – žádné
volně použitelné váhy, velké pro prohlížeč, a chodníky i vozovku máme z MTVU přesněji, než by je síť našla.
