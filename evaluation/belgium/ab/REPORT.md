# A/B: čáry obrub z map regionů v Belgii (20. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261121): Antverpy, Gent, Bruggy, Lovaň, Mechelen (Flandry, čáry GRB WGO),
Lutych, Namur, Charleroi, Mons (Valonsko, čáry PICC „Voirie - Ligne“), po 4 náhodných bodech do 1,5 km od centra (36).
Brusel čáry nemá. A = bez čar (`?hrany=0`, odhad z ortofota a OSM), B = s nimi. Výsledky `results/rezy.json`, obrázky
`images/` (nahoře A modře, dole B červeně, nad ortofotem Flander nebo Valonska; `ORTHO=be` v
`evaluation/slovakia/ab/images.mjs`).

Čáry se použily (vybraly jako obruba nebo okraj chodníku) u 13 řezů; profil změnily u 9 (le1 se změnil bez čar, kolísáním
služeb). Změny jsou hlavně za obrubou, ale ne jen tam: an2 ztratil jeden pruh (3,15 + 3,15 → 3,5), na3 má pruh 3,3 → 3,5
a ge4 jiné stání (opraveno po nepřátelské recenzi).

- **Lépe B (4):** ch3 Avenue de Philippeville (jeden chodník 3,35 m místo chodníku a plochy), ge4 Einde Were (chodník na
  konci místo plochy), li2 Rue des Eburons (chodník na straně B), mo3 N50 (chodníky místo „ploch“; ale 12,8 m a 11,1 m
  „chodníku“ je spíš předprostor, chce druhý pohled).
- **Hůř B (2):** an2 Louis Paul Boonstraat (chodník spojený se zelení a jeden pruh méně), mo1 (chodník zmizel v zeleni).
- **Nerozhodně (3):** ch1 (stezka 2 m → chodník s koly 6 m), ch4, na3.
- 6 z 36 řezů je prázdných nebo s jedním dílem (body v parcích a na pěšinách).

Výsledek je slabý (4 : 2), spíš nerozhodný. Čáry zůstávají zapnuté (`?hrany=0` vypne), po přechodu na regiony podle
hranic (recenze) se dotazují jen u řezů ve Flandrech (GRB) a ve Valonsku (PICC), v Bruselu vůbec.
