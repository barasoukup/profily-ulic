# Malta (MT): normy, zákon o stání, značky (rešerše 23. 11. 2026)

Pravidlo jako u Portugalska: jen zdroje, které jsem skutečně stáhl a přečetl. Co jsem nenašel nebo neotevřel, je
označeno „nenalezeno“ / „neotevřeno“. Hodnoty z vyhledávače ani z paměti nepoužívám.

Značení: **ZÁV** = závazné (právní předpis), **DOP** = doporučení nebo projekční standard bez síly zákona;
**1. ruka** = četl jsem přímo předpis nebo dokument, **2. ruka** = hodnotu cituje jiný dokument.

**Malta jezdí vlevo** (S.L. 65.11 reg. 75: „Every person driving a motor vehicle shall keep to the left hand side of the
road“; ZÁV, 1. ruka). Značky stojí normálně vlevo (S.L. 65.05, příloha, Part I a Part II úvod). Na středové plné čáře
se jede vlevo od ní (Part IV A(i)); při dvou pruzích jedním směrem se jezdí v levém, pravý jen k předjíždění a odbočení
vpravo (Part IV A(iii)(a), (c)). Předjíždí se vpravo (reg. 75). Na kruhovém objezdu ve směru hodinových ručiček (Part II
F(c)(6)). Aplikace to řeší sama (`leftHand`); závislé věci jsou níže vyznačené.

## Otevřené zdroje

- [TSCM] **S.L. 65.05 Traffic Signs and Carriageway Markings Regulations** (L.N. 94 of 1969, změny do L.N. 116 of 2024),
  legislation.mt `eli/sl/65.5/eng`, „Point in Time: 24/05/2024“, PDF 48 stran. Příloha (Schedule) obsahuje **obrázky
  značek** a jejich významy (Part I výstražné, Part II regulační, Part III informativní, Part IV vodorovné značení).
  Značka platí, je-li „of the colour and type prescribed and/or illustrated in the Schedule“ (reg. 2).
- [MVR] **S.L. 65.11 Motor Vehicles Regulations** (L.N. 128 of 1994, změny do L.N. 110 of 2023), legislation.mt
  `eli/sl/65.11/eng`: reg. 74, 75, 77, 79, 80, 82, 88, 127.
- [TRO] **Cap. 65 Traffic Regulation Ordinance**, legislation.mt `eli/cap/65/eng` (sazebník pokut). Číselné šířky neobsahuje.
- [HC] **Highway Code of Malta**, Transport Malta 2025 (`transport.gov.mt/RoadCodeEN.pdf-f10821`, 179 stran textu).
  Sám o sobě: „intended for guidance, training, and educational purposes only. In all cases, the Maltese legislation
  prevails“ → **DOP**, kde neopakuje předpis. Ilustrace převzaté z The Highway Code of the United Kingdom (1999 a 2022)
  se svolením HMSO.
- [RGH] **Road Geometry Handbook**, Malta Transport Authority (ADT), July 2003 (`Volume-5-ROAD-GEOMETRY-JULY-2003-DMRB-Malta.pdf`),
  výtah z „ADT Design Manual for Roads and Bridges“, který je „based on the UK Design Manual for Roads and Bridges“;
  pro **národní silnice** („for use on national road schemes“). Závazné pro projektanta jsou jen části v rámečcích
  (odst. 1.9: „the standards the Malta Transport Authority expects in design“), zbytek je rada. → **DOP stát**
  (projekční standard TM), 1. ruka; u textu jsem rámečky neviděl (extrahoval jsem jen text), tedy nevím, která čísla
  jsou v rámečku.
- [DC15] **Development Control Design Policy, Guidance and Standards 2015**, Planning Authority (MEPA), kopie OAR@UM
  (University of Malta), 214 stran. Planning standard pro stavební povolení (garáže, parkoviště, vjezdy). → **DOP**
  (standard povolovacího řízení, ne zákon o provozu), 1. ruka.
- [AADG] **Access for All Design Guidelines**, 3. vydání (KNPD 2011, ed. Joseph Spiteri), znovu vydané jako
  **CRPD/001/2026** (crpd.org.mt `Access-for-all-CRPD_001_2026.pdf`; obálka nese „2011“ i „CRPD/001/2026“, text je
  vydání 2011). Samy říkají „most of the dimensions … should be regarded as minimum requirements“ (úvod). Právní
  závaznost: podle výsledku vyhledávání (CRPD, **2. ruka**) se k nim váže posuzování nových staveb v povolovacím řízení;
  zákon, který by je přímo převzal (Equal Opportunities (Persons with Disability) Act, Cap. 413), jsem **neotevřel**.
  → **DOP stát**, 1. ruka.
- [CA] **Cap. 415 Copyright Act** (Act XIII of 2000, změny do Act XXXV of 2023), legislation.mt `eli/cap/415/eng`, čl. 2, 3, 6.

### Neotevřeno / nenalezeno

- **Transport Malta: stránka „Guidelines“ s projekčními příručkami** (`transport.gov.mt/…/guidelines-1361`) vrací 404
  (web je přestavěný); soubory jsem otevíral jen podle odkazů z vyhledávače. Přímé stahování (curl) TM blokuje
  Cloudflare; dokumenty [HC] a [RGH] jsem četl v prohlížeči.
- **Transport Malta „Chapter 7 – Parking Policy“**: PDF je bez čitelného textu (písma bez kódování), nepřečteno.
- **Infrastructure Malta „Measures for Public Consultation“ (síť cyklotras NCRN, 2023)**: server odmítl (403), neotevřeno.
  Podle souhrnu vyhledávače (2. ruka) navrhuje v úzkých ulicích zelený pruh s piktogramy, šířku neuvádí.
- **National Cycling Strategy (TM)**: jen podle souhrnu vyhledávače (2. ruka): návrh cyklistické infrastruktury
  „will be adopted from internationally recognised sources“. Vlastní maltská šířka cyklopruhu **nenalezena**.
- **Šířka vyhrazeného pruhu (with-flow vehicle priority lane / bus lane)**: nenalezeno.
- **Šířka jízdního pruhu v městské ulici**: nenalezeno (jen národní silnice v [RGH]).
- **Tramvaj**: Malta tramvaje nemá; netřeba.
- **Dálnice**: Malta dálnice (motorway) nemá; nejvyšší třída jsou „arterial roads“ ([HC] 10.19 „arterial and distributor
  roads“). Značka dálnice ani silnice pro motorová vozidla v [TSCM] není.

## A. Šířky

### A1. Chodník (footway, footpath, accessible route)

| Prvek | Hodnota | Zdroj | Povaha |
|---|---|---|---|
| Přístupná trasa („accessible route“) | **≥ 1,2 m** „shall be a minimum of 1.2m wide throughout its entire course“ | [AADG] 1.1.03 | DOP stát, 1. ruka |
| Otáčení na trase při změně směru o 45° a víc | 1,5 × 1,5 m | [AADG] 1.1.05 | DOP stát |
| Trasa od vyhrazeného stání ke vchodu | 1,2 m, nikde pod 1,0 m | [AADG] 1.2.11 | DOP stát |
| Chodník podél městské silnice (all purpose road, urban), „Regular“ využití (≥ 25 chodců/h nebo navazující chodníky) | zelený pás celkem **3,00 m min**, chodník **1,30 m min** | [RGH] odst. 3.16, Table 1A „Verge and Footway Widths on Urban Roads“ | DOP stát (národní silnice), 1. ruka |
| Totéž, „Occasional“ využití | zelený pás 2,50 m min, chodník **1,50 m min** | [RGH] Table 1A | DOP stát, 1. ruka |
| DC15 | **šířku chodníku nestanoví** (jen zákaz přesahů nad chodník, markýzy 0,5 m od obruby, sníženě obruby) | [DC15] | — |

Pozor k Table 1A: z textu PDF (souřadnice v obsahu stránky) vychází u „Regular“ 1,30 m a u „Occasional“ 1,50 m, tedy
přísnější kategorie má užší chodník. Vypadá to na chybu v tabulce (v dokumentu nebo v předloze); tabulku jako obrázek
jsem neviděl. Brala bych 1,50 m jako hodnotu pro chodník a 1,30 m nepoužívala.

### A2. Cyklistická infrastruktura

| Prvek | Hodnota | Zdroj | Povaha |
|---|---|---|---|
| Cyklopruh (cycle lane) | **nenalezeno** | | |
| Stezka (cycle track) | **nenalezeno** | | |
| Definice | „Cycle Lane: A separate part of the carriageway for use by pedal cycles. Cycle Track: A separate part of a road for use only by pedal cycles and by pedestrians where permitted.“ | [RGH] kap. 2 (definice) | 1. ruka |
| Odstup při předjíždění cyklisty | ≥ 1,5 m | [HC] 7.4 odst. 97 | DOP (příručka) |
| Kolo v pruhu „with-flow vehicle priority lane“ | jen je-li kolo na tabulce značky | [TSCM] Part II E(h) | ZÁV |

### A3. Vozovka

| Prvek | Hodnota | Zdroj | Povaha |
|---|---|---|---|
| Standardní šířka pruhu národní silnice | „S2: Two-lane single carriageway road with lane widths of up to about **3.65m**“; standardní šířky 3,5 / 3,65 / 3,75 m | [RGH] definice a odst. 3.10 | DOP stát (národní silnice) |
| Zúžení pruhů | na čtyřpruhu ve stoupání „narrow lanes down to **3.25m**“ (vozovka 9,75 m); na širokém čtyřpruhu 3,75 → 3,50 m jako „Relaxation“ | [RGH] 5.16, 3.14 | DOP stát |
| Míjení dvou vozidel (vjezd k nebytové stavbě) | „allow two vehicles to pass each other – minimum **4.1 metres**“ | [DC15] 2.5.6 | DOP (povolovací standard) |
| Ulice, z níž smí vést nová garáž | **6,3 m**, jde-li o ulici se stáním na ulici; **4,1 m**, je-li stání naproti zakázané (nebo bez chodníku u garáže, mimo UCA) | [DC15] standard S2, 2.5.7, obr. 31 | DOP (povolovací standard) |
| Poloměr nároží v obytné zóně | 4 m „where the priority and non-priority roads are at least 5.5 metres wide“ | [DC15] G8 a) | DOP |
| Šířka pruhu v městské ulici, pruh BUS | **nenalezeno** | | |

### A4. Stání

| Prvek | Hodnota | Zdroj | Povaha |
|---|---|---|---|
| Místo pro osobní auto | **4,8 × 2,4 m** (auto 4,5 × 1,8) | [DC15] Table 2 | DOP (parkoviště a garáže) |
| Kolmé stání (90°) | místo 2,40 m, délka 4,8 m; ulička 6,00 (jednosměrná) / 6,95 m (obousměrná; v bydlení 6 m) | [DC15] Table 3 | DOP |
| Šikmé 45° / 60° | místo 2,40 m; ulička 3,50–3,60 / 3,75–4,20 m | [DC15] Table 3 | DOP |
| Podélné stání | „bays … parallel to the wall or kerb these should be **6m long** and have a clearance of at least **3m**“; „For parallel parking a minimum aisle width of 3m is acceptable“ | [DC15] poznámka pod Table 3 | DOP |
| Vyhrazené místo pro osoby s postižením | šířka **3,6 m**, délka 4,8 m (kolmé) / **6,6 m** (podélné), přístupový pruh 1,5 m | [AADG] 1.2.04 | DOP stát |
| Stání pro dodávku s vozíkem | 7,3 × 2,9 m, výška 2,3 m, pruh 2 m | [AADG] 1.2.05 | DOP |
| Motocykly | ne podélně, „at an angle of not less than 45 degrees to such kerb or wall“ | [MVR] reg. 80 | ZÁV |
| Hloubka pásu podélného stání na ulici | **nenalezeno** (DC15 má jen šířku místa 2,4 m obecně) | | |

## B. Zákon o stání

### B1. Volná šířka vedle stojícího auta: **zákon číslo nedává**

- [MVR] reg. 74(1): žádné motorové vozidlo nesmí zůstat na silnici „in such a position or in such circumstances as to be
  likely to cause danger or obstruction to other persons using the road“ (ZÁV, 1. ruka).
- [MVR] reg. 77(1): řidič nesmí „wilfully or negligently prevent, hinder or interrupt the free passage to any person,
  vehicle, horse or cattle through any road“ (ZÁV).
- [MVR] reg. 79 (znění L.N. 110 of 2023): zákaz stání do 12 m od zastávky, kolem kruhového objezdu a ostrůvku, na
  přechodu a 4 m před ním (ze strany protijedoucích), **na chodníku**, kde to zakazuje vodorovné značení, tak, aby
  bránilo odjezdu řádně stojícímu vozidlu, do 5 m od nároží (ZÁV, 1. ruka).
- [MVR] reg. 82(3): v úzké ulici, kde se dvě vozidla nemohou minout, couvá to, které je blíž širšímu místu.
- [MVR] reg. 88: u bílé čáry v zatáčce nezastavovat do 6 m od nároží.
- [HC] 10.18.1 odst. 253–256 opakuje reg. 79 a radí „stop as close as you can to the side“, nestát proti směru jízdy
  (tj. stání **vlevo** po směru; závisí na jízdě vlevo).

Výklad pro aplikaci: Malta stání mimo zakázaná místa dovoluje a šířku na projetí nestanoví. Jediná čísla jsou
z povolovacího standardu [DC15]: míjení dvou vozidel 4,1 m (2.5.6, S2) a ulička vedle podélného stání 3 m (Table 3).
Návrh: `lawNeed: (oneway) => (oneway ? 3 : 4.1)` (jednosměrka 3 m, obousměrka 4,1 m celkem, ne 3 m na směr), s výhradou,
že jde o standard pro garáže a parkoviště, ne o zákon. Alternativa: `freeLane: 3` jako v Česku. **Otázka pro Báru.**

### B2. Stání na chodníku

- [MVR] reg. 79(d): zakázáno stát „on the footpath unless road signage directs otherwise“ (ZÁV, 1. ruka).
- [TSCM] Part III B(e)(8)–(10): informativní značky „Vehicles may be parked partially on the verge or footway“ (modrá
  tabule s P a autem napůl na obrubníku), konec takového úseku, a totéž v době uvedené na tabulce (ZÁV).
- Pro aplikaci: stání napůl na chodníku z OSM je na Maltě zakázané, ledaže ho povolí značka III.B8/B10. OSM
  `parking:*=half_on_kerb` značku nerozliší.

Návrh textu `halfKerbNote`: „Stání napůl na chodníku z OSM: ve vozovce zůstává {free}. Stání na chodníku je na Maltě
zakázané (předpis o motorových vozidlech S.L. 65.11, reg. 79 písm. d), ledaže ho povolí značka; volnou šířku předpis
neuvádí, aplikace nechává {need} (standard pro povolování staveb DC 2015).“

### B3. Zastavení a stání podle značek

- „No Parking“ (II.D5): stání nad 10 minut zakázáno (nebo nad dobu na tabulce); „No Waiting“ (II.D6): jen nastoupení a
  vystoupení; „No Stopping“ (II.D7): zastavit vůbec ([TSCM] Part II D(c)).
- **Žluté čáry jsou vodorovné značení**, ne svislá značka: jednoduchá žlutá čára na okraji vozovky = „No waiting“,
  dvojitá = „No stopping“ ([TSCM] Part IV C(vii): „painted at the edge of the carriageway respectively in lieu of the
  signs (6) and (7)“). Krátké dvojité žluté čáry 1 m na nároží vyznačují 5m zákaz (Part II D(f)(13)). [HC] 252 uvádí,
  že dvojité žluté čáry zakazují čekání kdykoli. V profilu ulice by to byla čára na okraji vozovky, ne značka.
- „Tow zone“ a „Clamping zone“ (II.D10, D11) jsou vždy zónou zákazu zastavení.

### B4. Rychlosti ve městě

- [MVR] reg. 127(1): osobní auta, taxi, motocykly **50 km/h v obcích („in towns and villages“), 80 km/h mimo ně**;
  minibusy a nákladní 40 / 60; zemědělská a tažná vozidla 20 / 30 (ZÁV, 1. ruka). Reg. 127(2): Transport Malta může
  pro silnici nebo oblast stanovit nižší rychlost.
- [TSCM] Part II D(f)(12) „SPEED ZONE“: tabule s červeným kruhem s číslem, „km“ a nápisem „ZONE“ (v příloze vzor
  „35 km ZONE“). Zóna 30 tedy není samostatná značka, ale obecná zóna s rychlostí. [HC] 166: „A 30 km/h limit applies in
  some built-up areas“; [HC] 10.9.1: „In some areas, a 30 km/h maximum speed limit may be in force.“ (DOP)
- **Obytná zóna (home zone)**: [HC] 10.15.6 „Home Zones“ jen radí jet pomalu (text převzatý z britské příručky);
  značku ani pravidla v [TSCM] ani [MVR] **nenalezeno**.
- **Pěší zóna**: [TSCM] Part II B(f)(6) „ENTRY TO PEDESTRIAN ZONE RESTRICTED (ALTERNATIVE TYPES)“, tabule „PEDESTRIAN
  ZONE / No vehicles“ s dodatkem „Except for loading by …“ a časem (britský vzor TSRGD 618.2/618.3). [HC] dovoluje
  na chodníku a v pěší zóně e-koloběžky do 10 km/h a vozíky do 6 km/h.
- **Sdílená zóna**: nenalezeno.

### B5. Kola, BUS a jednosměrky

- „With-flow vehicle priority lanes“ ([TSCM] Part II E(h)–(j), Part IV C(xvii)–(xix)): pruh pro vozidla nad 8 cestujících
  a taxi v době na tabulce; symbol karrozzinu, motocyklu nebo kola na tabulce rozšíří pruh i pro ně. Barevný povrch
  pruhu „has no legal significance“. Pruh je u levého okraje (Part IV C(xix): přerušení „to enable vehicles to use the
  left hand lane before turning left“; **závisí na jízdě vlevo**). [HC] má i „Contraflow bus lane“ a „Buses and cycles
  only“.
- **Jednosměrka**: značku „One way“ [TSCM] nemá; zákaz vjezdu II.A4 „No entry from this side“ a vodorovné „NO ENTRY“
  (Part IV C(xvi)) ano. [HC] příloha 5 ukazuje „One way direction“ (britský vzor 652) mezi příkazovými značkami a
  odst. 43 a 2.2.5 „One-way streets“. **Kola v protisměru**: předpis výslovně nezná; obecně jde výjimku vyznačit
  dodatkovou tabulkou „permissive category plate“ (Part II G(l)(15)), u II.A5 výslovně „such other words indicating an
  exemption“. Jestli se na Maltě „No entry + except cycles“ používá, jsem neověřila.
- Cyklistické značky (modrý kruh s kolem, s kolem a chodcem, dělená stezka) [TSCM] **nemá**; [HC] příloha 5 je ukazuje
  („Route to be used by pedal cycles only“, „Segregated pedal cycle and pedestrian route“) v britské podobě
  (TSRGD 955–957). Cyklopruh se vyznačuje čarami a piktogramy ([HC] 10.7.4), sdílený pruh „SHARROW“ ([HC] příloha 5).

## C. Dopravní značky

### C1. Které podoby

Malta má vlastní předpis se vzory [TSCM] (Vídeňská úmluva, britský styl písma a tabulí). Část značek, které na Maltě
stojí a ukazuje je [HC] 2025 (obrázky převzaté z britské Highway Code se svolením HMSO), v [TSCM] **chybí**: jednosměrka,
cyklistické stezky, pruh BUS v britské podobě. Pro ně beru britské kresby TSRGD z Commons a v README je to u každé
uvedeno. Maltské kresby na Commons jsou jen pro asi 40 značek (autor Gigillo83, „derivated by Italian road signs“,
PD-self), z potřebných jen II.A6, II.B5 a II.D1.

### C2. Autorské právo

- **Malta, Cap. 415:** čl. 2 vylučuje z „literary work“ „any written law, law report or judicial decisions“ (s výhradou
  čl. 12 Statute Law Revision Act 1980). Kresby značek jsou ale **dílo výtvarné** („artistic work“) a na ty se výluka
  výslovně nevztahuje; čl. 6 dává vládě Malty autorské právo k dílům „made by or under the direction or control of the
  Government of Malta“ na 70 let od vydání. Obrázky v příloze S.L. 65.05 proto **nejsou jednoznačně volné** (můj výklad,
  judikaturu jsem nehledala). Prakticky: maltské soubory z Commons jsou vlastní překreslení autora (PD-self), geometrické
  značky Vídeňské úmluvy navíc nejspíš nedosahují originality. Obrázky z PDF předpisu jsem do aplikace nedávala.
- **Spojené království:** značky TSRGD jsou **Crown copyright** pod **Open Government Licence** (Commons: OGL v1.0 nebo
  OGL 3, některé překreslení jako public domain). Podmínka Commons šablony: reprodukovat přesně a ne v zavádějícím
  kontextu. OGL vyžaduje uvést zdroj: „Contains public sector information licensed under the Open Government Licence
  v3.0.“ (u v1.0 obdobně). Do kreditů aplikace bych tu větu přidala (otázka pro Báru).

### C3. Mapování klíčů aplikace

Viz `pilot/public/signs-MT/README.md` (tabulka klíč → značka → soubor) a `evaluation/malta/signs-licence.json`.
Bez kresby: dálnice a silnice pro motorová vozidla (Malta je nemá), obytná a sdílená zóna (předpis je nezná), stezka
pro chodce (c7a; [HC] zmiňuje „Footway“, vzor jsem nenašla), placené stání, vyhrazené stání (Blue Badge III.B7 na
Commons není).

## D. Návrh `limitsMT` (min = červeně, zaklad = oranžově)

| Typ | min | zaklad | Zdroj, povaha |
|---|---|---|---|
| chodnik, chodnik_kola | **1,2** | **1,5** | 1,2 [AADG] 1.1.03 (DOP stát, přístupná trasa); 1,5 [RGH] Table 1A (DOP, národní městské silnice) |
| cyklopruh | — | — | nenalezeno (bez varování) |
| cyklostezka | — | — | nenalezeno (bez varování) |
| bus, bus_cyklo | — | — | nenalezeno (bez varování) |
| pruh | — | — | městská ulice nenalezeno; [RGH] 3,65 m jen národní silnice (nepoužívat pro město) |
| parkovani podélné | 0 | 2,4 | [DC15] Table 2 (místo 2,4 m), s výhradou: standard parkovišť; na ulici asi přísné. **Otázka pro Báru**, případně bez varování |
| parkovani kolmé | 4,8 | 4,8 | [DC15] Table 2 a 3 (délka místa 4,8 m) |
| parkovani šikmé | — | — | [DC15] dává jen uličku a šířku místa, hloubku pásu ne |
| tramvajový pás | — | — | Malta tramvaje nemá |

Zákon o stání: `lawNeed: (oneway) => (oneway ? 3 : 4.1)` podle [DC15] (viz B1), `halfKerbNote` podle B2, `parkGuess: true`
(stání je dovolené všude, kde není zakázané, [MVR] reg. 79), stání na straně ve směru jízdy vlevo.

## Otevřené otázky pro Báru

1. Volná šířka vedle stání: DC15 (4,1 m obousměrka, 3 m jednosměrka), nebo jako v Česku 3 m na směr? Zákon číslo nemá.
2. Chodník: 1,2 / 1,5 m (AADG / TM 2003), souhlas? Hodnota 1,30 m z Table 1A vypadá jako chyba.
3. Cyklopruh, stezka, pruh BUS, jízdní pruh: maltský zdroj nenalezen; nechat bez varování, nebo převzít britské
   (LTN 1/20), z nichž Malta podle National Cycling Strategy vychází (2. ruka)?
4. Podélné stání 2,4 m z DC15 (parkoviště): použít, nebo bez varování?
5. Jednosměrka a cyklistické značky v britské podobě (TSRGD), které maltský předpis nemá, ale [HC] je ukazuje: souhlas?
6. Kredit OGL pro britské kresby do patičky/licencí?
