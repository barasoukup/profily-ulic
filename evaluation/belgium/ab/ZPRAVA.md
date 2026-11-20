# A/B: čáry obrub z map regionů v Belgii (20. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261121): Antverpy, Gent, Bruggy, Lovaň, Mechelen (Flandry, čáry GRB WGO),
Lutych, Namur, Charleroi, Mons (Valonsko, čáry PICC „Voirie - Ligne“), po 4 náhodných bodech do 1,5 km od centra (36).
Brusel čáry nemá. A = bez čar (`?hrany=0`, odhad z ortofota a OSM), B = s nimi. Výsledky `vysledky/rezy.json`, obrázky
`images/` (nahoře A modře, dole B červeně, nad ortofotem Flander nebo Valonska; `ORTHO=be` v
`evaluation/slovensko/ab/obrazky.mjs`).

Čáry se použily (vybraly jako obruba nebo okraj chodníku) u 13 řezů, profil se změnil u 10. Vozovka a pruhy se nezměnily
nikde: čáry upřesnily díly za obrubou.

- **Lépe B (4):** ch3 Avenue de Philippeville (jeden chodník 3,35 m místo chodníku a plochy), ge4 Einde Were (chodník na
  konci místo plochy), li2 Rue des Eburons (chodník na straně B), mo3 N50 (chodníky místo „ploch“ po obou stranách).
- **Hůř B (2):** an2 Louis Paul Boonstraat (chodník 1,2 m spojený se zelení), mo1 (chodník zmizel v zeleni 8,6 m).
- **Stejně nebo nerozhodně (4):** ch1 (stezka 2 m → chodník s koly 6 m, na snímku nejasné), ch4, le1, na3.

Výsledek: čáry zůstávají zapnuté (`?hrany=0` vypne).
