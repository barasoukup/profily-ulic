# Dopravní značky Španělska (Catálogo oficial de señales, příloha I RGC, RD 465/2025, platí od 1. 7. 2025)

Soubory z Wikimedia Commons. Značky jsou součástí nařízení (příloha I Reglamento General de Circulación), a podle čl. 13
zákona o duševním vlastnictví (Real Decreto Legislativo 1/1996) proto nejsou předmětem autorského práva. Na Commons
jsou až na výjimky public domain nebo CC0. Autoři a licence jsou v `evaluation/spain/signs-licence.json`, rozbor
v `evaluation/spain/NORMY.md` (oddíl C). Významy jsou podle textu katalogu 2025, ne podle popisků Commons. Vzhled jsem
porovnal s obrázky ve vyhlášeném PDF BOE-A-2025-12199 (23. 11. 2026, stránky v `NORMY.md` C2): všechny soubory se
shodují, i S-30a a S-33 kreslené podle návrhu 2023 a S-28 z roku 2006.

Souborům bez `viewBox` jsem ho doplnil podle `width` a `height`. Tři soubory jsou složené pro aplikaci:
- `R-301-110.svg`: z R-301 100 (public domain) dvakrát jeho „1“ a poslední „0“, posunuté na místa číslic značky 110
  (recenze 23. 11. 2026: soubor 110 z Commons je CC BY-SA 4.0);
- `S-51a-bus.svg`: S-51a (Commons, CC0) jen s piktogramem autobusu, motocykl a TAXI jsem odebrala, autobus zvětšila
  a vystředila (katalog: „Se incluirá en la señal el pictograma representativo del tipo o tipos de vehículos“);
- `R-101-plus-S-880d.svg`: R-101 nad tabulkou S-880d (kolo) s nápisem „EXCEPTO“ (katalog tom I, bod 2.3), tedy
  jednosměrka s cyklisty v protisměru (čl. 153.6 RGC).

| Klíč | Značka | Soubor |
|---|---|---|
| b1 | R-100 Circulación prohibida (zákaz všech vozidel v obou směrech) | R-100.svg |
| b11 | R-102 Entrada prohibida a vehículos de motor | R-102.svg |
| b8, b30 | R-114 Entrada prohibida a ciclos, R-116 … a peatones | R-114.svg, R-116.svg |
| oneway | S-11 Calzada de un carril de sentido único (po směru), R-101 Entrada prohibida (proti), s cyklisty v protisměru R-101 + S-880d „EXCEPTO“ | S-11.svg, R-101.svg, R-101-plus-S-880d.svg |
| b20a | R-301 Velocidad máxima (10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120) | R-301-<v>.svg |
| zona30 | tabule „ZONA“ s R-301 30 (S-30 katalogu 2003; v katalogu 2025 není, bod 2.2 dovoluje značku v tabuli s textem); popisek bez kódu | S-30.svg |
| b28, b29 | R-307 Parada y estacionamiento prohibido, R-308 Estacionamiento prohibido | R-307.svg, R-308.svg |
| ip11a | S-17 Estacionamiento | S-17.svg |
| ip14a, ip15a | S-1 Autopista (některé `ref` v OSM začíná „AP-“), S-1a Autovía („A-“), jinak bez značky; S-3 Vía reservada para automóviles | S-1.svg, S-1a.svg, S-3.svg |
| ip20a | S-51a Carril reservado (autobus) | S-51a-bus.svg |
| ip26a, sdilena, ip27a | S-28 Zona de estancia y juego (10 km/h, s R-301 10), S-47 Zona de coexistencia (20 km/h), S-30a Zona peatonal; obytná ulice z OSM je S-47, S-28 jen s `maxspeed=10` | S-28.svg, S-47.svg, S-30a.svg |
| c8a, c9a, c10a, c7a | R-407a Vía reservada y obligatoria para ciclos, S-33 Senda ciclopeatonal, S-41 Vía para ciclos y peatones con espacio diferenciado, R-410 Camino reservado y obligatorio para peatones | R-407a.svg, S-33.svg, S-41.svg, R-410.svg |

Bez kresby: vyhrazené stání a stání pro osoby s omezenou pohyblivostí (S-17 s textem nebo se symbolem UNE 41501, na
Commons nenalezeno), pěší zóna s koly a cyklistická zóna (Španělsko takové značky nemá), BUS pruh i pro kola (dá se
složit z S-51a stejně jako `S-51a-bus.svg`). Způsob stání (podélné, kolmé, šikmé) S-17 nerozlišuje.
