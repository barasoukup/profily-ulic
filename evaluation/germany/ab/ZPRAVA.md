# A/B: mapy povrchů ulic Berlína, Hamburku a Cách (17. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261117): Berlín 20, Hamburk 30, Cáchy 20 náhodných bodů do 2 km od centra.
Sběr v aplikaci (localhost, `?osm=balik` s testovacím balíkem OSM Berlína, Hamburku a vládního obvodu Kolín), každý bod
hned po sobě A = bez map měst (`?berlin=0&hamburg=0&aachen=0`, odhad z ortofota země a OSM) a B = s nimi.

| Město | řezů | mapa města použita | profil se liší | služba neodpověděla |
|---|---|---|---|---|
| Berlín | 20 | 11 | 11 | 0 |
| Hamburk | 30 | 12 | 15 (3 bez mapy: kolísání služeb) | 0 |
| Cáchy | 20 | 12 | 12 | 0 |

Hamburk má v datech jen hlavní a obvodní ulice, proto méně zásahů. Odpovědi map měst 0,3–1 s.

## Posudky nad ortofotem (`images/`, nahoře A modře, dole B červeně; 15 reprezentativních)

| řez | ulice | posudek | proč |
|---|---|---|---|
| be2 | Swinemünder Straße | stejně | obruby na stejném místě, jen jinak rozdělené pruhy a stání |
| be6 | Gartenstraße | nejde posoudit | zimní snímek LGB, ulice ve stínu |
| be9 | Oranienburger Straße | nejde posoudit | stín |
| be11 | Alexanderstraße | lépe B | cyklostezky na chodnících z mapy, obruby stejně |
| be13 | Markgrafenstraße | lépe B | pravá obruba za stojícími auty (A je řezala) |
| be19 | Grunerstraße | hůř B | data 2014 nemají druhou vozovku (přestavba Molkenmarktu), z ní je „plocha“ |
| ha3 | Rosenstraße | lépe B | stání vlevo s autem |
| ha8 | Lagerstraße | lépe B | profil až k parkovišti a zeleni, pravá obruba na okraji zeleně |
| ha18 | Alexanderstraße (HH) | stejně | |
| ha25 | Hahntrapp | lépe B | stání po obou stranách, nákladní auto v něm |
| aa5 | Purweider Winkel | hůř B → opraveno | profil končil za vozovkou; doplnění k domům v Německu do 25 m (předzahrádky 15–18 m), teď až k domu |
| aa8 | Alkuinstraße | hůř B (kratší) | dům až za dosahem řezu 22 m, A sahal dál |
| aa9 | Brabantstraße | lépe B | stání po obou stranách s auty, A řezala auta |
| aa12 | Adalbertsteinweg | stejně | B navíc boční prostor vlevo |
| aa16 | Oppenhoffallee | nejde posoudit | stín |

Souhrn: lépe B 6, stejně 3, hůř 3 (jedno opravené), nejde posoudit 3. **Všechny tři mapy zůstávají zapnuté.**
Slabiny: berlínská data jsou z roku 2014 (přestavěné ulice), Hamburk jen hlavní a obvodní ulice, berlínsko-braniborské
ortofoto je zimní se stíny (posudky okem obtížné).
