# A/B: parkovací místa Amsterdamu (20. 11. 2026)

Zdroj: WFS `api.data.amsterdam.nl/v1/wfs/parkeervakken` (CORS), každé místo jako plocha se způsobem stání
(Langs podélné, Haaks kolmé, Vissengraat šikmé), placené (FISCAAL) nebo ne (MULDER) a vyhrazením (E6a ZTP, E7 nakládka,
E9 držitelé povolení). Licence v katalogu města uvedená není. Celostátní RDW (placené zóny) neodpověděla (DNS i HTTP).

Vzorek: 8 amsterdamských bodů z A/B BGT a 8 z univerzálního vzorku, každý A = bez míst (`?amspark=0`) a B = s nimi.
Způsob stání se bere z dat (`derive.js` `ORIENT`), ne z délky místa. Výsledky `vysledky/parkovani.json`.

Změna u 9 z 16:
- lépe: u4 Grote Bickersstraat (stání, které chybělo), u6 Keizersgracht a u2 Nieuwe Prinsengracht (šikmé stání podle
  dat), am2 Raamgracht (stání na druhé straně grachtu);
- hůř: am4 Prinsengracht (mezery mezi jednotlivými místy udělaly ze stání krajnici), u3 Nieuwmarkt (jedna strana bez stání);
- drobné posuny šířek: am1, am7, am5.

Výsledek smíšený: zůstává **vypnuté** (`?amspark=1` zapne). Stání dává v Nizozemsku mapa povrchů BGT (parkeervlak).
Na příště: místa spojit do souvislých úseků (mezery do 1 m) a vzít z nich jen způsob stání pro plochy BGT.
