# Dopravní značky

Řádek dopravních značek pod popisky prvků profilu.

## Nasazeno 10. 11. 2026

- Řádek dopravních značek (`signs.js`, ikony `app/public/signs-CZ/`, čísla podle vyhl. 294/2015 ve znění 205/2025: zóny IZ, IP 4c, IP 11b–g, V 15 BUS/TRAM) pod popisky prvků profilu (i v exportu, v Návrhu měnitelné), podoby podle vyhl. 294/2015
  (úřední díla, SVG z Wikimedia Commons, zmenšené): omezení rychlosti (i po pruzích), zóna 30, obytná zóna, pěší zóna
  (i s koly), cyklistická zóna/ulice, sdílená zóna, stezka pro chodce a cyklisty (C 9, C 10), cyklopruh (V 14),
  piktokoridor (V 20), směrové šipky řadicích pruhů (V 9a, z OSM turn:lanes), zákaz stání (B 29), zákaz zastavení (B 28), parkoviště IP 11 se způsobem stání (podélné,
  kolmé, šikmé), vyhrazené IP 12, ZTP (IP 12 + O 1), jednosměrka IP 4b a protisměr B 2 podle směru pohledu, obojí
  i s cyklisty v protisměru (OSM oneway, oneway:bicycle=no; po „Otočit“ se vymění), zákaz vjezdu všech vozidel B 1
  (vehicle/access=no) a motorových vozidel B 11 (motor_vehicle=no), s dodatkovou tabulkou výjimky (např. dopravní obsluha).
  Dále: vyhrazený pruh BUS (IP 20a, nápis V 11a), zóna placeného stání (IP 25a), stezka pro cyklisty (C 8a),
  ochranný cyklopruh (V 14 přerušovaně) proti vyhrazenému (V 14 plnou), cyklopruh v protisměru, zákaz vstupu chodců
  (B 30) a vjezdu cyklistů (B 8), dálnice (IP 14a) a silnice pro motorová vozidla (IP 15a), tramvajový pruh (V 13).
  Zóny jednou přes vozovku, nejvýš 2 značky na část.
- Odhad stání podle zákona (viz Parkování výše); mimo zástavbu bez chodníku a v obytné zóně se neodhaduje; stání na chodníku a napůl z OSM (on_kerb, half_on_kerb).
- Tramvaj ve třech druzích: v pruhu s auty; vyhrazený tramvajový pruh ve vozovce (koleje na vozovce, auta vedle,
  Spálená, Národní; kreslit v úrovni vozovky s V 13); samostatné těleso (MTVU 705 a obdobné, oddělené obrubou či
  zelení; štěrk, panely, tráva, obruby). Do Streetmixu dál jako tramvaj.
  OSM: embedded_rails=tram na silnici = koleje ve vozovce (Praha 523 úseků), samostatné těleso bez něj + MTVU 705;
  vyhrazený vs. sdílený pruh OSM nerozlišuje (počet pruhů); psv/bus=yes na kolejích (asi 186) = pruh tram + BUS.

## Dopravní značky

Pod popisky částí je řádek dopravních značek podle vyhl. 294/2015 Sb. (`public/signs.js`, obrázky v `public/signs-CZ/`,
licence v `signs-CZ/README.md`), na obrazovce i v exportu, všechny v jednom měřítku jako na ulici. Značky vycházejí
z tagů OSM a z částí profilu: nejvyšší rychlost (i po pruzích), jednosměrka IP 4b / B 2 podle směru pohledu (i
s cyklisty v protisměru; po „Otočit“ se vymění), zóny (zóna 30, obytná, pěší, cyklistická), zákaz vjezdu B 1 a B 11
s dodatkovou tabulkou výjimky, B 8, B 30, dálnice a silnice pro motorová vozidla, stezky C 8a, C 9a, C 10a, parkoviště
IP 11 se způsobem stání (i na chodníku IP 11d–g), vyhrazené IP 12 a ZTP, zákaz stání B 29 a zastavení B 28, pruh
BUS IP 20a (i s cyklisty), směrové šipky V 9a z `turn:lanes`. Rychlost, jednosměrka a zóny stojí pod jízdními pruhy;
značka společná sousedním částem se kreslí jednou se závorkou; nejvýš 2 značky na část, co se nevejde, ukáže šedá
tečka. V Návrhu jdou značky měnit u každé části i přes celou vozovku. Značky se drží v odkazu, v souboru i po
„Otočit“.
