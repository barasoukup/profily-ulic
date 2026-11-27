# Vzhledy domů Severní Ameriky (Bára 25. 11. 2026)

Specifikace `docs/house-types-north-america.md`, kresba `app/public/houses-america.js`, výběr `house-looks.js`
`northAmericaLook` (volá `countries/US.js`, Kanada bude volat totéž). Přehled `prehled.png` (`render.mjs`), jedno měřítko,
vespod čtyři evropské. Stejná kresba jako ostatní domy, skutečná výška, měřítko beze změny.

## Kresba: tři kola s kritikem

Kritik byl vždy samostatný agent (v každém kole jiný, kreslíře neznal), proti fotkám z Commons a čtyřem evropským vzhledům.
Kreslil a pravidla psal jeden agent. Fotky chyběly u framehouse a podium, málo jich bylo u slab, glasstower a tenement
(Commons omezil dotazy): tam kritik soudil ze znalosti.

| vzhled | 1. kolo | 2. kolo | 3. kolo |
|---|---|---|---|
| bayrow | 3,5 | 4 | **4** |
| porchrow | 3 | 3,5 | **4** |
| framehouse | 4 | 4,5 | **4** |
| brickblock | 3,5 | 4 | **4** |
| slab | 3,5 | 4 | **4** |
| podium | 3,5 | 4 | **4** |
| glasstower | 3,5 | 4 | **4** |
| mainstreet | 4 | 4,5 | **5** |
| stripmall | 3,5 | 4 | **4** |
| brownstone | 4 | 4,5 | **5** |
| tenement | 4 | 4,5 | **4** |
| tripledecker | 3,5 | 4 | **4** |
| baygable | 3,5 | 4,5 | **4** |
| victorian | 3 až 3,5 | 4 | **4** |

Drobnosti ze 3. kola zůstaly: kužel na arkýři, štítek nad atikou Viktoriánů, pravá pata štítu v Torontu.

## Výběr ve Washingtonu: 2 × 40 náhodných domů

`rules/sample.mjs` (náhodný bod na ulici DC, nejbližší dům na náhodné straně, fotka Mapillary, 69 z 80 panoramat), semínka
20261125 a 424242. Dnešní vzhled (59ec341) proti novému; posuzoval naslepo samostatný agent (Sonnet) nad archy fotka + X + Y
bez popisků a v losovaném pořadí (že jedna kresba je pražská, je z ní ovšem vidět). Vzorek 1 vznikl před úpravou pravidel, ta po něm
je jediná: dům bez druhu nemá verandu ani arkýř. Vzorek 2 je nový a výsledek po něm se už neladil.

| vzorek | | správně | zčásti | špatně | fotka nic neukazuje |
|---|---|---|---|---|---|
| 1 | dnes | 1 | 11 | 21 | 7 |
| 1 | nový | 10 | 21 | 2 | 7 |
| 2 | dnes | 1 | 11 | 23 | 5 |
| 2 | nový | **12** | **18** | **5** | 5 |

Který je blíž fotce: vzorek 1 nový 27, dnes 2, stejně 4, nejasné 7; vzorek 2 nový **25**, dnes **0**, stejně 10, nejasné 5
(`node rules/score.mjs rules/vysledky/klic2.json rules/vysledky/posudek2.json rules/vysledky/pred2.json rules/vysledky/po2.json`).

- **Co data neříkají (80 domů):** rok u žádného, podlaží chybí u 53 (66 %), druh u 20 (25 %), obojí u 17 (21 %), u 4 (5 %)
  aplikace pod řezem dům v OSM nenašla (bod 4 m uvnitř fasády). Celé DC: podlaží 37 %, rok 0,1 %.
- **Hlavní příčina zlepšení:** dům bez podlaží dnes dostane pražský pětipodlažní činžák. Nově se čte i druh domu a blok
  (tehdy jen USA, od 25. 11. 2026 všude, `evaluation/all-buildings/ZPRAVA.md`).
- **Chyby nového:** přízemní obchody bez druhu kreslené jako řadový nebo samostatný dům (3), dům se stromy okolo bez domu v OSM
  jako řadový (1), dílna jako bytový dům (1), velký bytový dům v řadové čtvrti jako řadový (1), jeden činžák (28, vzorek 1), kde
  posuzovatel dal přednost dnešnímu.
- „Zčásti“ je většinou veranda či arkýř, které dům nemá, o podlaží méně nebo valbová střecha místo sedlové. To bez roku a podlaží
  nejde poznat; pomohly by tabulky CAMA města DC.

## Beze změny

`compare.mjs`: 59 měst, 42 480 domů (vzhled, u každého dvanáctého i SVG) před a po shodné. `npm test` prošlo,
`evaluation/ortofoto-osm/regrese.mjs` shodné s `vysledky/regrese.txt`. Bostonské, newyorské, torontské a sanfranciské vzhledy se
zatím nikde nevyberou (USA je jen metro Washingtonu), jsou ale v nabídce vzhledů; jejich čtvrti jsou kruhy od ruky, neověřené na řezech.
Popisky ve 24 jazycích jsou strojový překlad. Fotky v gitu nejsou.
