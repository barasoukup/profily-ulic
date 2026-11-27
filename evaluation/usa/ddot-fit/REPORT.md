# Inventář DDOT: stání jen tam, kde se vejde do vozovky (Bára 27. 11. 2026)

Oprava č. 1 z `evaluation/canada/losses/REPORT.md`: `towns/usa.js` `carveParking`: když se dvě a více stání z inventáře
nevejdou do vozovky změřené v řezu (`kerbStrip` pro některou stranu vrátí `null`, tedy zbývá míň než 2 × stání + 2,5 m),
nevyřeže se žádné stání a `inventory` nevrací `noParkGuess`; platí OSM a zákonný odhad jako bez inventáře. Vypínač
`?off=ddotfit`, test v `tests/usa.test.js`. Opravy 2-5 se nedělaly (Bára: inventář je hrubý).

## Kterých řezů se týká
- Ve 217 řezech z dosavadních vzorků ve Washingtonu (`usa/ab`, `usa/fresh`, `usa/arterials`, `canada/review`; `affected.mjs`,
  odpovědi služeb z cache) mění oprava **4**: f-25 (Meridian Place NW), f-44 (Chesapeake Street NW), ddot-3 (Kennedy Place NW),
  ddot-29 (Woodridge Street NE). Poslední dva jsou známé prohry pravidla; oprava je vrací na profil bez inventáře.
- Dalších 20 náhodných řezů s inventářem o 2 stáních se nezměnilo ani jeden. Výběr úzkých míst (`sample.mjs`, vozovka
  Planimetrics užší než 7,4 m, `sample-new.json`, 42 míst) se zastavil na pokyn Báry („totální edge case“) a nezpracoval.

## Měření
- Slepé A/B se nedělalo (4 dotčené řezy, p-hodnota by nic neřekla).
- Kontrola: `node evaluation/canada/dc-same.mjs` (100 řezů ab + fresh) před a po (`QS=&off=ddotfit` = před): změnily se
  jen f-25 a f-44, ostatních 98 je shodných.
- `npm test`: 550 z 550. `node evaluation/ortho-osm/regression.mjs`: řádky bez `#` shodné s `results/regression.txt`.

## Výchozí stav
Zapnuto (nic se nezhoršilo; k ověření jen 4 řezy a kontrola, dva z nich dřívější prohry).
