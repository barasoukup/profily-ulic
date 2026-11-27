# Nepřátelská recenze státu Malta (MT), 23. 11. 2026

Rozsah: `countries/MT.js`, `towns/malta.js`, `signs-MT/`, `evaluation/malta/`, jízda vlevo v `derive.js`
(`leftHand`, `mirrorLeftHand`), `lanes-ortho.js` (`MT_ORTHO`), `search-photon.js`, `credits.js`, `city.js`,
`index.html`, `LICENCE-A-ZDROJE.md`, `app/README.md`, `tests/malta.test.js`, `staty.json`. HEAD `84140de` (větev
`estonia`). Žádný existující soubor jsem neměnil, nic necommitoval. Nálezy o jízdě vlevo jsou společné s Kyprem
(`evaluation/cyprus/RECENZE.md`), tady jen stručně.

Co jsem ověřil:
- `npm test`: 353 testů, 0 chyb.
- `deriveProfile` na umělých ulicích se státem `malta` (odhad stání podle `lawNeed`, směry pruhů, dělená silnice).
- Texty předpisů z legislation.mt (dvě stažení PDF, text vytažený z proudů stránek): S.L. 65.11 reg. 75 a 79,
  S.L. 65.05 příloha (názvy a čísla značek Part II A, B, D, E a Part III B).
- Licence souborů na Wikimedia Commons (jeden dotaz API): souhlasí se `signs-licence.json`.
- Vykreslení 12 SVG ze `signs-MT/`.
- Neověřeno: DC15, Access for All a Road Geometry Handbook (hodnoty jsem četl jen v `NORMY.md`), živé ortofoto.

## Závažné

### 1. Jízda vlevo: šipky řadicích pruhů a pruhy z `bus:lanes` ve špatném pruhu (ověřeno)

`derive.js:863–883` čte seznamy po pruzích v rozložení pro jízdu vpravo, `mirrorLeftHand` (`derive.js:849–859`)
pak obrátí jen pořadí po pozicích. `turn:lanes:forward=left|through` na čtyřpruhu dá při `leftHand`
`↑through | ↑left | ↓left | ↓through`; odbočení vlevo má být u levé obruby. `bus:lanes:forward=designated|yes` dá
pruh BUS jako vnitřní pruh protisměru. Na Maltě se to týká právě pruhů „with-flow vehicle priority lane“ (II.E11),
které OSM značí po pruzích. Podrobnosti a oprava: Kypr, nález 1.

### 2. Jízda vlevo: dvě jednosměrné osy v jedné vozovce se otočí proti datům (ověřeno)

`mirrorLeftHand` zrcadlí každou vozovku se dvěma směry, i když směry pocházejí z jednosměrných os OSM a jsou už
správně. Třída se dvěma osami bez plochy středového pásu vyjde s jízdou vpravo (`↓ ↓ ↑ ↑`). Kypr, nález 2.

### 3. Jízda vlevo: `splitTwoWayLane` dělí vždy `↓ | ↑` (ověřeno)

`derive.js:2316`, voláno v `app.js:590` v cestě každého maltského řezu (odhad z ortofota, jeden pruh od 5 m).
Vrací rozložení pro jízdu vpravo. Kypr, nález 3.

## Střední

### 4. `lawNeed` nezná počet pruhů a bere číslo z jiného pravidla (ověřeno)

`MT.js:55`: `lawNeed: (oneway) => (oneway ? 3 : 4.1)`. Ostatní státy s vlastním `lawNeed` (DE, CH, BE, FR, PL, NL)
berou aspoň `minLane × počet pruhů`. Výsledky pro stát `malta`:

- obousměrná 6,1 m: `↑2,05 | ↓2,05 | stání?`,
- obousměrná 8,2 m: `stání? | ↑2,1 | ↓2,1 | stání?`,
- čtyřpruh 12 m (`lanes=4`, residential): `stání? | 2 | 2 | 2 | 2 | stání?`, čtyři pruhy po 2,0 m.

Číslo 4,1 m je z DC15 odst. 2.5.6 (vjezd k nebytové stavbě: „allow two vehicles to pass each other“) a 3 m je
ulička vedle podélných stání v garáži (pozn. pod Table 3). `NORMY.md` B1 to přiznává („standard pro garáže a
parkoviště, ne zákon“) a vede jako otázku pro Báru; v kódu je to přesto hodnota „zákona“ a hláška říká „aplikace
nechává {need} (stavební standard DC15)“. Oprava: `Math.max(4.1, minLane × pruhy)` jako Německo, nebo `freeLane: 3`
na směr jako Kypr; a pruhy 2,05 m nekreslit jako dva pruhy.

### 5. Chodník 1,5 m je z tabulky, kterou autorka sama čte jako chybnou

`MT.js:14`: základ 1,5 m „příručka Transport Malta 2003“. `NORMY.md` A1: v Table 1A vychází pro „Regular“ využití
1,30 m a pro „Occasional“ 1,50 m, „vypadá to na chybu… tabulku jako obrázek jsem neviděl… brala bych 1,50“.
Hodnota je tedy vybraná z nejisté tabulky odhadem, a to z příručky pro národní silnice. Minimum 1,2 m (červeně) je
z Access for All pro „accessible route“ (trasa k budově), ne pro veřejný chodník; právní závaznost je podle
`NORMY.md` z druhé ruky a zákon Cap. 413 neotevřen. Oprava: tabulku přečíst jako obraz, do té doby základ bez
varování nebo s poznámkou; 1,2 m oranžově, ne červeně.

### 6. Krajnice dělené silnice u středového pásu (ověřeno)

`derive.js:765–770` počítá s vnějším okrajem po řidičově pravici. Při `leftHand` vyjde
`↑ | ↑ | krajnice | pás | krajnice | ↓ | ↓`. Kypr, nález 5.

### 7. Odhad stání na jednosměrce stojí u pravé obruby

`derive.js:709`, pořadí stran R, L: jednosměrka 5–6,9 m má odhadnutý pás vpravo po směru. `NORMY.md` B1 cituje
Highway Code 10.18.1: nestát proti směru jízdy, tedy vlevo. Oprava: při `leftHand` pořadí L, R.

### 8. Značky, které předpis nemá, a vlastní kresby pod úředními čísly

- `UK-652` (jednosměrka), `UK-955`, `UK-956`, `UK-957`: v příloze S.L. 65.05 nejsou (ověřeno, text přílohy „one way“
  neobsahuje). Opírají se o Highway Code 2025, který o sobě říká, že je jen vodítko a platí předpis; S.L. 65.05
  reg. 2 uznává jen značky ze své přílohy (`NORMY.md`, Otevřené zdroje). README to píše, v aplikaci se ale kreslí
  bez rozdílu vedle značek předpisu.
- `II.A4-plus-cycles`: tabulka „Except cycles“ je britská TSRGD 954.4. README: „S.L. 65.05 takovou tabulku výslovně
  nemá… že se na Maltě používá, jsem neověřila.“ To je značka složená z domněnky.
- `II.E11`: složenina z britských 959.1 a 960 a nápisu „taxi“ písmem Arial, bez tabulky s dobou platnosti.
  `II.B6` a `II.D12-30`: vlastní kresby podle vzoru v příloze. Všechny tři nesou v popisku úřední číslo
  („II.E11 …“), ač úřední podobu nemají.

Návrh: značky s `UK-` a tabulku „Except cycles“ ukazovat až po ověření na místě (Mapillary), vlastní kresby
označit v README i v popisku jako přibližné.

### 9. Patička uvádí OGL v3.0, soubory jsou pod OGL v1.0; export bez kreditu

`index.html:137` a `LICENCE-A-ZDROJE.md:97`: „Open Government Licence v3.0“, bez jména poskytovatele. Podle
`signs-licence.json` i Commons (ověřeno) je 616, 617, 636, 642, 652, 801, 951, 955–957, 959.1 a 960 pod **OGL
v1.0**, jen výřez diagramu 954.4 pod OGL 3. Kypr má u týchž souborů správně v1.0 a „UK Department for Transport“.
V exportu PNG a SVG kredit značek chybí úplně (`credits.js` nemá klíč, `city.js:471` `credit: ""`). Oprava: znění
jako u Kypru s doplňkem o v3.0 pro tabulku, klíč kreditu do exportu.

### 10. Měření přesnosti: 8 řezů, z toho aspoň dva nejsou ulice, zpráva chybí

Commit `c9b58a9`: složení 55 %, šířka do 2 m 63 %. `evaluation/universal/ZPRAVA.md` Maltu nemá,
`evaluation/malta/ZPRAVA.md` neexistuje. V `vysledky/u-mt-1.jsonl` je `mt-valletta-1` „spíš náměstí než ulice“ a
`mt-valletta-2` „řez vede parkem, ne ulicí“. Směry pruhů se neměří. Oprava: zpráva, vzorek aspoň jako u jiných
států a bez řezů mimo ulice.

### 11. Testy

`tests/malta.test.js` ověřuje příznak `leftHand`, existenci souborů značek a dvě čísla `lawNeed`. Žádný test
nevede `deriveProfile` se státem `malta`; nálezy 1–4 a 6 by zachytil. Test `lawNeed(false, 2) === 4.1` chybu
z nálezu 4 naopak zakotvuje (počet pruhů se ignoruje).

## Drobné

12. `MT.js:38–39`: číslo v popisku jednosměrky se bere jen z `x.dir`; směr značky ale obvykle dává pruh (`seg.dir`).
    `signLabel({ k: "oneway" })` pod pruhem ↓ dá „Jednosměrný provoz“ bez „II.A4“, soubor je přitom `II.A4`.
13. c10a: `MT.js:29–35` nečte `s.walk`, vždy UK 957 (kolo vlevo, chodci vpravo).
14. Chyby WMS přicházejí jako 200 `text/xml` (`ZDROJE.md` kap. 1 radí hlídat `content-type`). `lanes-ortho.js:293–301`
    to nehlídá; `createImageBitmap` spadne a výjimka se spolkne jako „žádný obraz“, takže výpadek služby aplikace
    neohlásí (u jiných zdrojů hlásí).
15. Podklad mapy žádá WMS po dlaždicích jako PNG s průhledností (`app.js:325`); pro cizí server zbytečně těžké,
    JPEG stačí uvnitř hranic.
16. Ortofoto je z roku 2018, přesné datum letu `ZDROJE.md` nezná; v patičce ani v kreditu rok není
    (`credits.js:35`), u jiných států bývá.
17. `streetmix.js` neposílá `leftHandTraffic`.
18. Rakouské označníky (kulaté H) a český mobiliář na Maltě (`MT.js:44`, `70`); známý kompromis, ale označník je
    v řezu vidět a maltský vypadá jinak.
19. `MT.js:64–66` `besidePassport`, `besideMax`, `wideStreets`, `roadClassFromOsm` převzaté, na Maltě bez účinku.

## Podezření (neověřeno)

- `lanes:bus` na jednosměrce „od pravé obruby“ (`derive.js:904–905`); maltský pruh je vlevo (README `signs-MT`:
  „Pruh je vlevo od čáry“).
- Žluté čáry u obrub (Part IV C(vii), místo značek II.D6 a II.D7) může měření z ortofota číst jako vodicí čáry.
- Hranice s výsostnými vodami (`staty.json` „malta“, jeden prstenec) dává stát MT i na moři; neškodí, v logu ale
  budou řezy „MT“ z trajektových tras, pokud tam OSM má cestu.
- Balík OSM `mt` jen na R2 (`tools/countries.mjs:54`); zda ho workflow postaví před nasazením sám, jsem neověřoval.

## Bez nálezu

- S.L. 65.11 reg. 75 („shall keep to the left“) a reg. 79 písm. d („on the footpath unless road signage directs
  otherwise“, znění L.N. 110 of 2023) souhlasí s `MT.js:1–2` a `MT.js:52–56`.
- Čísla značek souhlasí s přílohou S.L. 65.05: II.A4 No entry from this side, II.A5 All vehicles prohibited, II.A6
  Motor vehicles prohibited, II.B1 No bicycles, II.B5 No pedestrians, II.B6 Entry to pedestrian zone restricted,
  II.D5 No parking, II.D6 No waiting, II.D7 No stopping, II.D12 Speed zone, II.E11 With-flow vehicle priority lanes,
  III.B1 Parking place, III.B8–B10 stání částečně na chodníku.
- b29 → II.D6 „No waiting“ je obhajitelné: „No parking“ (II.D5) zakazuje stát déle než 10 minut, „No waiting“
  odpovídá českému zákazu stání (jen nástup a výstup).
- Licence na Commons souhlasí se `signs-licence.json`; maltské kresby Gigillo83 jsou public domain.
- Ortofoto: CC BY 4.0 podle katalogu, kredit „© Planning Authority Malta (CC BY 4.0)“ v mapě i v exportu;
  `MT_ORTHO` posílá `CRS:84` v pořadí lon, lat (test), černý obraz mimo ostrovy se pozná (`blank`, klíč „mt“).
- CSP: `malta.coverage.wetransform.eu` v `img-src` i `connect-src`.
- Valletta, Victoria na Gozu a Comino vycházejí jako „malta“.
- Překlady nových textů jsou ve všech jazycích.

## Verdikt

Nenasazovat. Zdroje, citace předpisů a čísla značek jsou v pořádku a licence ortofota je čistá. Chybná je jízda
vlevo mimo nejjednodušší případ (nálezy 1–3 a 6, společné s Kyprem) a pravidlo stání (4), které kreslí pruhy po
2 m. Před nasazením opravit 1–4 a 6 s testy přes `deriveProfile`, srovnat licenci OGL v patičce (9) a rozhodnout,
které z britských značek a složenin (8) na Maltě opravdu stojí.
