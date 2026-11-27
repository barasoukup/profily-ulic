# USA, fáze 2: Washington v aplikaci (24. 11. 2026)

Bára schválila 24. 11. 2026 („Fáze 2 s mapou Washingtonu“). Pilot fáze 1 je v `../usa-dc/ZPRAVA.md`. Větev `usa`.

## Co je v aplikaci

- **Stát US** (`app/public/countries/US.js`): jen metro Washingtonu (`staty.json` `usa`: DC, Montgomery, Prince George's,
  Arlington, Fairfax County a city, Falls Church, Alexandria; hranice okresů TIGERweb, sloučené v jeden obrys a pak zjednodušené na 10 m), zbytek USA
  `closed_us` s hláškou. Normy DDOT a NACTO jen oranžově (`NORMY.md`), stání 3 m na směr, bez značek, bez paneláků,
  hledání Photon; od 25. 11. 2026 severoamerické domy, mobiliář a Metrobus (`../north-america-art/`).
- **Washington** (`app/public/towns/usa.js`): mapa povrchů Planimetrics 2023 (`?dc=0`), inventář DDOT Roadway SubBlock
  (`?ddot=0`: počet pruhů, stání u obrub, cyklopruhy; odhad stání podle pravidel tam vypnutý), uličky z planimetrie jako
  plochy `service=alley`, ortofoto DC 2025 pro pruhy, model obrub a podklad mapy (`lanes-ortho.js us-dc`).
- **OSM balík `us_dc`** (86 MB, jen R2): Geofabrik District of Columbia, Maryland a Virginie oříznuté osmiem na obdélník
  metra (−77,56; 38,52; −76,64; 39,37) a sloučené. `osm-tiles.yml` nově umí výřezy spojené „+“ s obdélníkem za „@“.
- Dotazy na kliknutí v DC: planimetrie 10 (dvakrát, podruhé uličky), 11, 1, 13 a SubBlock 162 (6 dotazů, paměť podle
  obdélníku) a 2 obrázky ortofota. DC je od 25. 11. 2026 District podle hranice (a 60 m za ní), ne obdélník.

## Slepé A/B mapy DC (40 nových řezů)

`ab/sample.mjs` (osm obvodů, 5 řezů v každém: obytné, sběrné, tepny; pevné semínko 20261125, nejméně 150 m od řezů
pilotu, jen s fotkou Mapillary). Sběr v aplikaci (`collect.js`, `../universal/data/us-ab.json`), varianty `def` (mapa)
a `dc0` (`?dc=0`: odhad z OSM a ortofota). Mapa se použila ve všech 40 řezech, všech 40 profilů se liší.
Posuzovali dva agenti Sonnet, každý svou polovinu, **každou dvojici tedy jeden** (`ab/POKYN.md`, pořadí X/Y losované, klíč v `ab/results/key-*.json`, zdroje skryté),
ortofoto DC a fotky Mapillary, s výslovným pokynem počítat úzké travnaté pásy mezi chodníkem a obrubou.

| | mapa lépe | odhad lépe | stejně | nejasné |
|---|---|---|---|---|
| 40 řezů | **23** | 9 | 7 | 1 |

**Výhrada (recenze 25. 11. 2026):** pokyn tučně říkal, že profil s pásy trávy tam, kde jsou, je lepší, a ty má hlavně rameno
s mapou. 23 : 9 je proto nadsazené a jako důkaz se nebere; platí čerstvé měření níže (`fresh/`).
(`node evaluation/usa/ab/score.mjs`, posudky `ab/results/`.)

## Tři společné změny (všechny státy, každá s vypínačem)

Sběr v DC (40 řezů A/B, každá změna zvlášť vypnutá), v Evropě 120 náhodných řezů univerzálního vzorku (12 v CZ, SK, AT,
DE, NL, PL, FR, ES, FI, DK) a 50 cílených českých řezů (25 u ústí `service=alley`, 25 na obousměrných ulicích s
`lanes=2`). Změněné řezy posouzené naslepo (Sonnet, stejný pokyn).

| změna | změněno DC | DC nová : stará : stejně | změněno Evropa | Evropa nová : stará : stejně | výsledek |
|---|---|---|---|---|---|
| ústí uličky je křižovatka (`?off=ulicky`) | 2 / 40 | 2 : 0 : 0 | 0 / 120, 2 / 50 cílených | 2 : 0 : 0 | **zapnuto** |
| počet pruhů: obousměrka se dělí od 4,0 m, když je počet pruhů známý (`?off=pocetpruhu`) | 6 / 40 | 3 : 0 : 3 | 0 / 120, 1 / 50 | 0 : 0 : 1 | **zapnuto** |
| jamky stromů v chodníku patří chodníku (`?jamky=1`) | 4 / 40 | 2 : 2 : 0 | 0 / 120, 1 / 50 | 0 : 1 : 0 | **vypnuto** (v Česku skutečný travnatý pás u stání přečtený jako dlažba) |

Regrese Prahy a Brna (`node evaluation/ortofoto-osm/regrese.mjs`) beze změny proti `results/regrese.txt`. Evropa:
v náhodném vzorku se nezměnil žádný řez, takže změny Evropu neškodí, ale ani tam téměř nic nedělají.

## Univerzální měření (30 řezů pilotu)

Posudky pilotu, profily znovu z aplikace na posouzených řezech (`score.mjs`, `results/score.md`):

| profil | řezů | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|
| aplikace | 30 | **61 %** | 50 % | 23 % / 40 % |
| bez mapy DC (`?dc=0`) | 29 | 70 % | 66 % | 17 % / 17 % |
| pilot offline (fáze 1) | 30 | 60 % | 43 % | 20 % / 33 % |

**Rozpor s A/B:** měření dává bez mapy víc (70 %), slepé A/B mapu jasně (23 : 9). Posuzovatelé měření (pilot, bez pokynu
o pásech) vynechávali travnaté pásy u obruby („navíc zelen“ 22×) a stání zapisovali jen tam, kde auta viděli. Bez
pásů zeleně vycházelo už v pilotu DC 67 % a OSM 68 %. Šířka uličního prostoru je s mapou o hodně lepší. Doporučuji
přeměřit USA novými posuzovateli s pokynem o pásech, než se rozhodne definitivně (Bářin princip „co je horší, zůstane
vypnuté“ tu stojí proti A/B).

**Přeposouzeno 25. 11. 2026** s přesnějším pokynem (`score-pokyn2.mjs`, `results/score-pokyn2.md`, výklad v
`../universal/ZPRAVA.md`): 29 řezů, s mapou 66 %, bez mapy 60 %, jen OSM 56 %. Rozpor s A/B se zmenšil, ale
nezmizel: rozdíl +6 bodů má 95 % interval −5 až +17, na 7 tepnách vede odhad 79 : 57, řezy jsou pilotu (ladilo se na nich)
a kód je starší než oprava tepen.

## Hlavní ulice (25. 11. 2026)

`arterials/ZPRAVA.md`: čtení dat DC opravené (svodidla, pruhy směru, strana stání, chráněné cyklostezky); na 25 nových tepnách
naslepo (neutrální pokyn) mapa : bez mapy **19 : 6**. Nový kód : starý 8 : 2 je z 11 změněných řezů z 97, na nových místech
jen 2 : 0 : 1; zbylých 6 : 2 jsou řezy, na kterých se ladilo, takže to důkaz není.

## Inventář DDOT a kliknutí (druhá recenze, 25. 11. 2026)

`../canada/review/`: `?ddot=0` proti výchozímu stavu 21 : 11 ze 45 změněných z 90 (p 0,11, neprůkazné; místní 15 : 5), počet pruhů beze změny
(20 proti 19 z 33). Kliknutí na uličky po opravě z `estonia` nejvýš 15 m. Okolí bez mapy 47 % (8 řezů). Podrobnosti `../canada/ZPRAVA.md`.

## Čerstvé měření po recenzi (25. 11. 2026)

`fresh/ZPRAVA.md`: 60 nových řezů podle délky sítě, zmrazený kód, dva posuzovatelé, neutrální pokyn: mapa : odhad **41 : 10**
(nerozhodně 8); univerzální měření 76 : 61 % (jen OSM 53 %). **Mapa zůstává zapnutá**, oficiální řádek US je odtud.

## Opravy po cestě

- dc-8-3 (Southern Avenue, hranice DC): zjednodušené hranice okresů nechaly na společných hranicích mezery a bod padl do
  `closed_us`. `usa` byla proto nezjednodušená (`staty.json` 3,43 MB); od 25. 11. se okresy nejdřív sloučí (společné hrany se
  vyruší) a pak zjednoduší: 2,51 MB (`estonia` 2,29). Testy v `tests/usa.test.js` (celá hranice DC).
- Kredit ortofota i tam, kde ho čtou jen jamky stromů.

## Před nasazením (Bára)

1. **OSM balík na R2:** spustit workflow OSM tiles ručně se `states: us` (job `us_dc` stáhne DC, Maryland 218 MB a Virginii
   430 MB, ořízne osmiem, nainstaluje `osmium-tool`) a ověřit `data.streetspace.eu/osm/index.json` (klíč `us_dc`).
   Lokálně postavený balík je `app/data/osm-pack/us_dc-novy.posm`.
2. Worker logu: od 25. 11. 2026 ukládá každou platnou polohu (dřív jen obdélník evropských států); nasadit ho musí Bára.
3. CSP má `maps2.dcgis.dc.gov` v `connect-src` i `img-src`.

## Otevřené otázky

- Licence: Planimetrics, SubBlock i ortofoto DC jsou CC BY 4.0 podle metadat opendata.dc.gov (ověřeno v pilotu).
- Ortofoto mimo DC (Maryland iMAP, Virginia VGIN) zatím není: v Marylandu a Virginii je profil jen odhad z OSM.
- Ranní zákazy stání na sběrných ulicích (inventář DDOT vede pruh stání, kde smí stát); pás předzahrádek („public parking“
  v DC) se kreslí jako zeleň.
- Značky MUTCD (public domain) by šly doplnit později.
- Překlady 24 jazyků jsou strojové (Sonnet), měl by je projít rodilý mluvčí.
