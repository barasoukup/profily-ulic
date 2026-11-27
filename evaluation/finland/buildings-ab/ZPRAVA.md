# A/B: budovy Helsinek a Ryhti ve Finsku (23. 11. 2026)

Co se zkoušelo: bez dat státu kreslí aplikace dům ve Finsku jen z OSM. Nově se ptá (`app/public/towns/finland.js`)
v Helsinkách **registru budov města** (`Rakennukset_alue_rekisteritiedot`, WFS kartta.hel.fi, CC BY 4.0: podlaží, rok
dokončení, nosný materiál, fasáda, užití) a jinde (nebo když Helsinky dům nemají) **Ryhti SYKE** (`open_building`, body
s podlažími, rokem, materiálem, fasádou, užitím; CC BY 4.0), bod uvnitř obrysu domu z OSM na fasádě. A = jen OSM
(`?hkibuild=0&ryhti=0`), B = s daty. Vzhled domu `profile.js buildingStyle` (u Finska severské vzhledy `nordicLook("FI")`).

Skripty: `sample.mjs` (semínko 20261128: 7 bodů na ulicích do 1,5 km od středu Helsinek, Tampere, Turku a Oulu, domy po
obou stranách do 40 m, bod 4 m uvnitř domu), `run.mjs` (`vysledky/rezy.json`, `vysledky/osm-levels.json`), `photos.mjs`
(Mapillary, `data/foto/`, necommitují se). Dotazy ohleduplně: pauza 1,5 s, odpovědi v `data/answers.json`; asi 90 malých
dotazů na Ryhti a Helsinky, 40 na Mapillary.

## Vzorek a pokrytí (40 domů)

| Město | domů | zdroj B | podlaží A (OSM) | podlaží B | rok A | rok B | dřevo | jiný vzhled |
|---|---|---|---|---|---|---|---|---|
| Helsinky | 10 | registr města 10 | 9 | 10 | 2 | 10 | 0 | 7 |
| Tampere | 11 | Ryhti 10 | 8 | 11 | 3 | 10 | 1 | 8 |
| Turku | 10 | Ryhti 8 | 9 | 9 | 0 | 8 | 2 | 6 |
| Oulu | 9 | Ryhti 8 | 5 | 9 | 0 | 8 | 1 | 5 |
| celkem | 40 | 36 | 31 | 39 | 5 | 36 | 4 | 26 |

Žádný dotaz neselhal; 4 domy bez odpovědi (bod Ryhti v obrysu OSM nebyl). Rok dokončení přibyl u 31 domů, dřevěný dům
(nosná konstrukce nebo fasáda „puu“) u 4 (vzhled `puukaupunki` nebo `drevak`).

Helsinky proti Ryhti (tytéž domy, B a Ryhti zvlášť): podlaží stejně u 9 z 10, rok u 10 z 10 (he7-left: Ryhti 1 podlaží,
registr města 5; Ryhti tam zřejmě vzal dvorní budovu ve stejném obrysu OSM).

## Shoda s OSM `building:levels`

Ve vzorku ulic mají údaj oba zdroje u 28 domů: stejně 15, ±1 22. Náhodné budovy OSM s `building:levels` v centrech
(`osm-levels.json`, 10 na město, 29 s odpovědí): rozdíl B − OSM medián 0 ve všech městech; Helsinky stejně 5 z 9, ±1 8;
Turku 5 z 7, 7; Tampere 1 z 5, 4; Oulu 4 z 8, 5 (dvě velké odchylky +6, +7: obrys OSM spojuje nízkou část s věží).

## Fotky z ulice (Mapillary)

Fotku směrem k domu má 21 ze 40 domů (většinou z auta podél ulice); posoudit šlo 7 (`vysledky/foto.json`, posuzovatel
počítal podlaží na fotce):

- B sedí u 6 (he3-right, he4-left, tu1-right, tu3-right, tu4-left, tu7-left), OSM u 3 (všechny tři i B), nesedí ani jedno
  u 1 (tu6-left: data chybí oběma, na fotce přízemní dřevěný dům). OSM správně a B špatně: žádný.
- Výrazné: tu1-right OSM 1 (jen obchodní pavilon), Ryhti 8, na fotce aspoň 7; he3-right OSM 9, registr 5, na fotce 5–6;
  tu3-right dřevěný dům se 2 podlažími a Ryhti „puu“ sedí.
- Sporné: ou7-left (Ryhti dřevěný dům 1920 se 2 podlažími, na fotce z roku 2016 jen novější zděné domy; snad mimo záběr,
  nebo stará data), ta5-right (hotel: Ryhti 6, OSM 8, fotka spíš 7–8).

## Závěr

Obojí zůstává zapnuté (`?hkibuild=0`, `?ryhti=0` vypne): podlaží 39 proti 31, rok 36 proti 5, na posouditelných fotkách B
nikde neprohrálo. Vzorek fotek je malý. Otevřené: Ryhti v obrysu OSM se dvorními budovami (he7) bere nejbližší bod
k fasádě, ne nejvyšší; registr Helsinek dává užití podle klasifikace 1994 (151 kanceláře → vzhled „kancelář“ u mnoha
domů v centru se smíšeným užitím, posoudit na fotkách později).
