# Dopravní značky Malty (Traffic Signs and Carriageway Markings Regulations, S.L. 65.05)

Čísla značek podle přílohy (Schedule) S.L. 65.05 ve znění L.N. 116 of 2024: část (Part I–III), oddíl (A–G) a pořadí,
např. II.D1 = Part II, odstavec D, značka (1). Podoby: Malta má vlastní vzory ve stylu Vídeňské úmluvy a britských
tabulí. Commons má maltské kresby jen u několika značek (Gigillo83, „derivated by Italian road signs“, PD-self); kde
maltská kresba chybí a britská podoba TSRGD je stejná jako vzor v příloze S.L. 65.05, beru britskou kresbu z Commons
(Crown copyright, Open Government Licence; uvést „Contains public sector information licensed under the Open Government
Licence v3.0“). Značky s předponou `UK-` maltský předpis **nemá**; ukazuje je Highway Code of Malta 2025 (příloha 5,
obrázky převzaté z britské Highway Code se svolením HMSO) a na Maltě stojí. Rozbor: `evaluation/malta/NORMY.md`
(oddíl C), autoři a licence: `evaluation/malta/signs-licence.json`.

Všem souborům bez `viewBox` jsem ho doplnila podle `width` a `height`. Odvozené a vlastní soubory:
- `II.D1-10.svg` … `II.D1-80.svg` (kromě 50): z maltské II.D1 (50) bez číslic, nové číslo je `<text>` (Arial tučně).
  Písmo není úřední.
- `II.A4-plus-cycles.svg`: II.A4 No entry nad tabulkou „Except cycles“ (TSRGD 954.4, výřez z diagramu Traffic Signs
  Manual 2008 bez kót). S.L. 65.05 takovou tabulku výslovně nemá, výjimku ale dovoluje „permissive category plate“
  (Part II G(l)(15)); že se na Maltě používá, jsem neověřila.
- `II.E11.svg` With-flow vehicle priority lane (průběžná značka pruhu pro autobusy a taxi, Part II E(h)(11)): rám a čára
  pruhu z TSRGD 959.1 (bez kola), autobus z TSRGD 960, nápis „taxi“ jako `<text>`; tabulka s dobou platnosti chybí.
  Pruh je vlevo od čáry (Malta jezdí vlevo).
- `II.B6.svg` Entry to pedestrian zone restricted a `II.D12-30.svg` Speed zone (30 km ZONE): nakreslené podle vzorů
  v příloze S.L. 65.05 (vzor zóny má 35, číslo je proměnné), písmo Arial.

| Klíč | Značka (S.L. 65.05 nebo HC) | Soubor |
|---|---|---|
| b1 | II.A5 All vehicles prohibited | II.A5.svg (TSRGD 617) |
| b11 | II.A6 Motor vehicles prohibited | II.A6.svg (maltská kresba) |
| b8 | II.B1 No bicycles | II.B1.svg (TSRGD 951) |
| b30 | II.B5 No pedestrians | II.B5.svg (maltská kresba) |
| oneway (po směru) | One way (HC 2025, předpis nemá) | UK-652.svg (TSRGD 652) |
| oneway (proti směru) | II.A4 No entry from this side | II.A4.svg (TSRGD 616) |
| oneway + protismer | II.A4 + tabulka „Except cycles“ | II.A4-plus-cycles.svg |
| b20a | II.D1 Speed limit (10, 20, 30, 40, 50, 60, 70, 80 km/h) | II.D1-<v>.svg |
| zona30 | II.D12 Speed zone (30 km ZONE) | II.D12-30.svg |
| b28 | II.D7 No stopping (i dvojitá žlutá čára na okraji vozovky, Part IV C(vii)) | II.D7.svg (TSRGD 642) |
| b29 | II.D6 No waiting (i jednoduchá žlutá čára; „No parking“ II.D5 s přeškrtnutým P je mírnější, nad 10 min) | II.D6.svg (TSRGD 636) |
| ip11a | III.B1 Parking place | III.B1.svg (TSRGD 801) |
| ip20a | II.E11 With-flow vehicle priority lane (autobusy nad 8 míst a taxi) | II.E11.svg |
| ip27a | II.B6 Entry to pedestrian zone restricted („No vehicles“) | II.B6.svg |
| c8a | Route to be used by pedal cycles only (HC 2025, předpis nemá) | UK-955.svg |
| c9a | Route for shared use by pedal cycles and pedestrians (HC, předpis nemá) | UK-956.svg |
| c10a | Segregated pedal cycle and pedestrian route (HC 2025, předpis nemá) | UK-957.svg |

Žluté čáry („No waiting“ jednoduchá, „No stopping“ dvojitá) jsou vodorovné značení na okraji vozovky, ne svislá značka;
mají stejný význam jako II.D6 a II.D7.

Bez kresby: dálnice a silnice pro motorová vozidla (ip14a, ip15a; Malta je nemá), obytná a sdílená zóna (ip26a,
sdilena; předpis je nezná, HC jen radí u „Home Zones“), stezka pro chodce (c7a), vyhrazené stání pro Blue Badge (III.B7,
na Commons není), stání částečně na chodníku (III.B8–B10, na Commons není), placené stání, cyklistická zóna.
