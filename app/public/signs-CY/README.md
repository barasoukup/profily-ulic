# Dopravní značky Kypru (Κώδικας Οδικής Κυκλοφορίας 2012, kan. 71 předpisu Κ.Δ.Π. 66/1984)

Značky Kypru stanoví Kodex silničního provozu (Κώδικας Οδικής Κυκλοφορίας), který vydává Τμήμα Οδικών Μεταφορών; podle
kan. 71 předpisu 66/1984 jsou značkami ty, které jsou v Kodexu. Kodex značky **nečísluje**, jen popisuje řecky. Sada je
směs britských značek (zákazy, příkazy, stání), dvojjazyčných tabulí (řecky a anglicky) a několika vídeňských (obytná
zóna, kruhové příkazy pro cyklisty). Každý soubor jsem porovnal s obrázkem v Kodexu; stránky jsou v
`evaluation/cyprus/NORMS.md` (oddíl C2).

Soubory z Wikimedia Commons: kyperské (autor Gigillo83, public domain), britské „UK traffic sign …“ (UK Department for
Transport, **Open Government Licence v1.0**, vyžaduje uvést zdroj: „Contains public sector information licensed under
the Open Government Licence v1.0“) a vídeňské (OSN, public domain). Kyperský zákon o autorském právu (59/1976) úřední
texty z ochrany **nevylučuje** (čl. 4 písm. γ chrání i vládní díla), proto nic nepřekresluji z Kodexu. Rozbor
v `evaluation/cyprus/NORMS.md` (C1), autoři a licence v `evaluation/cyprus/signs-licence.json`.

Souborům bez `viewBox` jsem ho doplnil podle `width` a `height`. Odvozené soubory:
- `speed-10.svg` … `speed-100.svg`: z „Cyprus road sign maximum speed.svg“ (50) odstraněny číslice, nové číslo je
  `<text>` (Arial tučně, roztažené na šířku původních číslic). Písmo není úřední.
- `c10a-walk-left.svg`: `c10a.svg` (UK 957) zrcadlově, chodci vlevo; Kodex ukazuje obě podoby (NORMS.md C2). Kreslí
  se podle strany, na které chodci jdou (dál od vozovky), bez dat chodci vpravo jako jinde.

Odchylka od Kodexu: u `c9a.svg` (UK 956) je kolo nahoře a chodci dole, Kodex (str. 137) kreslí chodce nahoře a kolo
dole. Význam je stejný, soubor jsem neupravoval.

| Klíč | Značka (popisek v Kodexu) | Soubor (předloha na Commons) |
|---|---|---|
| b1 | Κλειστός δρόμος σε όλα τα οχήματα (zákaz vjezdu všech vozidel) | b1.svg (UK traffic sign 617) |
| b11 | Απαγορεύεται η διέλευση σε μηχανοκίνητα οχήματα (auto a motocykl) | b11.svg (UK traffic sign 619) |
| b8 | Απαγορεύεται η διέλευση ποδηλατών | b8.svg (UK traffic sign 951) |
| b30 | Απαγορεύεται η διέλευση στους πεζούς | b30.svg (Cyprus road sign no men) |
| oneway po směru | Μονόδρομος με την επιτρεπόμενη κατεύθυνση | oneway.svg (Cyprus road sign one way road) |
| oneway proti směru | Απαγορεύεται η είσοδος (zákaz vjezdu); s cyklisty v protisměru se nekreslí nic (tabulku „kromě cyklistů“ Kodex nemá, samotný zákaz vjezdu by říkal opak profilu; recenze 23. 11. 2026) | noentry.svg (UK traffic sign 616) |
| b20a | Ανώτατο όριο ταχύτητας (10, 20, … 100) | speed-<v>.svg (Cyprus road sign maximum speed) |
| b28 | Απαγορεύεται η στάση και η στάθμευση | b28.svg (UK traffic sign 642) |
| b29 | Απαγορεύεται η στάθμευση | b29.svg (UK traffic sign 636) |
| ip11a | Χώρος Στάθμευσης (P) | p.svg (Cyprus road sign parking) |
| ip14a | Αυτοκινητόδρομος (dálnice, zelená tabule) | motorway.svg (Vienna Convention road sign E5a-V2) |
| ip15a | Δρόμος ταχείας κυκλοφορίας (modrá tabule s autem) | expressway.svg (Cyprus road sign road for motorvehicles) |
| ip20a | Αποκλειστική διέλευση λεωφορείων | bus.svg (Cyprus road sign buses only) |
| ip26a | Αρχή κατοικημένης περιοχής … ήπιας κυκλοφορίας (obytná zóna) | ip26a.svg (Vienna Convention road sign E17a-EA) |
| ip27a, c7a | Υποχρεωτικός πεζόδρομος (plošnou pěší zónu Kypr nemá) | ped.svg (Cyprus road sign mandatory pedestrian way) |
| c8a | Υποχρεωτικός Ποδηλατόδρομος | c8a.svg (UK traffic sign 955) |
| c9a | Υποχρεωτικός πεζόδρομος/πεζοδρόμιο με ποδηλατόδρομο (společný) | c9a.svg (UK traffic sign 956) |
| c10a | Υποχρεωτικός ποδηλατόδρομος διαχωρισμένος από πεζοδρόμιο (dělený) | c10a.svg (UK traffic sign 957), chodci vlevo c10a-walk-left.svg |

Bez kresby: zóna 30 (Kodex 2012 ji nemá, v roce 2025 jen ohlášená), sdílená zóna a cyklistická zóna (Kypr nemá),
vyhrazené stání a stání pro osoby s postižením (Kodex má jen informační značku vozíčkáře), placené stání, způsob stání
(kolmo, šikmo; Kodex nerozlišuje), dodatková tabulka „kromě cyklistů“ (jednosměrka s cyklisty v protisměru je bez značky).
