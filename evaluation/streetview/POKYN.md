# Pokyn pro posuzovatele snímků z ulice (pilot, 17. 11. 2026)

Dostaneš pro každý řez 1–2 snímky z Mapillary: `data/<id>-f.jpg` (pohled podél ulice ve směru řezu) a `data/<id>-b.jpg`
(opačný směr); panorama je ekvirektangulární 360° obrázek. „Vlevo“ a „vpravo“ platí pro pohled ve směru `-f`
(na snímku `-b` je to obráceně). Nedostaneš profil aplikace: popisuješ jen, co vidíš, nezávisle.

Pro ulici přímo v místě snímku urči:
- `lanes`: počet jízdních pruhů pro auta/autobusy celkem v obou směrech (bez stání, cyklopruhů, kolejí na samostatném tělese;
  koleje ve vozovce, po kterých jezdí auta, se počítají jako pruh);
- `parkingLeft`, `parkingRight`: stání aut podél okraje vozovky (v pruhu stání, v zálivu, napůl na chodníku);
- `cycle`: cyklopruh, ochranný pruh, cyklostezka nebo piktokoridor;
- `tram`: tramvajové koleje;
- `sidewalkLeft`, `sidewalkRight`: chodník podél ulice;
- `trees`: stromořadí podél ulice;
- `median`: dělicí pás nebo ostrůvek mezi směry (i tramvajové těleso uprostřed).

Ke každé hodnotě jistota `sure` / `unsure`. Když snímek ulici v místě neukazuje (jiná ulice, tunel, interiér,
rozmazané, příliš daleko), dej `usable: false`. Snímek může být starý: popisuj, co je na něm.

Výstup jeden JSON řádek na řez do `vysledky/posudky.jsonl`:
{"id":"p1","usable":true,"year":2021,"lanes":4,"lanesSure":true,"parkingLeft":false,"parkingLeftSure":true, … ,"note":"krátce"}
