# Opravy pravidel z 18.–19. 11. 2026 v regresi se složením (19. 11. 2026)

Po oponentuře: regrese měří i složení po metrech (`regression.mjs`, správně celkem a za obrubami vozovky u osy, vozovka
navíc tam, kde MTVU vozovku nemá). Každá oprava vypnutá zvlášť (`OFF=…`), pak všechny. Ortofoto ČÚZK a města.

| Vypnuto | Praha ČÚZK složení / za obrubami | Praha IPR | Brno ČÚZK | Brno 2025 | Brno ČÚZK chodník medián |
|---|---|---|---|---|---|
| nic (nyní) | 65 / 62 % | 66 / 63 % | 68 / 64 % | 58 / 46 % | 1,05 m |
| walkedge (konec chodníku podle zeleně) | 65 / 62 | 65 / 63 | 66 / 61 | 58 / 46 | 1,75 m |
| vyplnkonec (výplň za ulicí) | 62 / 58 | 63 / 59 | 67 / 63 | 56 / 44 | 1,05 m |
| soubezna (souběžné vozovky) | 63 / 60 | 64 / 62 | 67 / 63 | 57 / 44 | 1,05 m |
| pozadi (zeleň a dlažba za vším) | 62 / 55 | 63 / 58 | 65 / 60 | 57 / 45 | 1,05 m |
| pairclass, raillanes | beze změny | beze změny | beze změny | beze změny | |
| **všechny** | **57 / 47** | **57 / 48** | **61 / 51** | **56 / 42** | 1,75 m |

Vozovka navíc (MTVU tam vozovku nemá): 44 → 45 m Praha ČÚZK, 40 → 41 m Brno, tj. souběžné vozovky skoro nic špatně
nepřidávají. Obruby se žádnou opravou nemění. `pairclass` (Košická) a `raillanes` (Jana Babáka) se v Praze a Brně
neprojeví: doložené jen svými řezy.

Nezměřeno: metrika obrub před a po změně z 19. 11. (dc772ba) na starém kódu; koleje mezi vozovkami (pravda MTVU
nekonzistentní, skript chybí).
