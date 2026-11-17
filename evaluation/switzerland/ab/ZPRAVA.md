# A/B: úřední vyměřování (Amtliche Vermessung, pokryv půdy) ve Švýcarsku a Lichtenštejnsku (17. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261117): Curych 8, Basilej 6, Bern 6, Ženeva 6, Lugano 6, St. Gallen 4,
Vaduz 6 náhodných bodů do 1,5 km od centra (42). Sběr v aplikaci (localhost, `?osm=balik` s balíkem OSM měst vzorku
a celého Lichtenštejnska), každý bod hned po sobě A = bez vyměřování (`?av=0`, odhad z SWISSIMAGE a OSM) a B = s ním;
mezi body pauza 7 s (geodienste.ch: fair use 10 dotazů WFS za minutu). Výsledky `vysledky/rezy.json`, souhrn
`node evaluation/switzerland/ab/souhrn.mjs`, obrázky `images/` (nahoře A modře, dole B červeně, nad SWISSIMAGE).

| město | řezů | vyměřování použito | profil se liší | chyba |
|---|---|---|---|---|
| Curych | 8 | 8 | 8 | 0 |
| Basilej | 6 | 6 | 6 | 0 |
| Bern | 6 | 6 | 6 | 0 |
| Ženeva | 6 | 5 | 5 | 0 |
| Lugano | 6 | 6 | 6 | 0 |
| St. Gallen | 4 | 4 | 4 | 0 |
| Vaduz | 6 | 3 | 3 | 0 |

## Posudky nad ortofotem (všech 38 změněných)

- **Lépe B (16):** zu1 Talstrasse (cyklopruh, dva pruhy, chodníky), zu2 (tramvaj v ulici), zu3 Müllerstrasse, zu5
  Susenbergstrasse, zu6 Limmatstrasse (pruhy, koleje, stání po obou stranách), zu7 Bahnhofstrasse (pěší ulice
  s tramvají, A měla „neznámé“ kusy), zu8 Schanzeneggstrasse (vozovka 7 m jako na snímku, A 4 m), ba2 Lautengartenstrasse,
  ba4 Im Zimmerhof, ba6 Feierabendstrasse (stání s auty po obou stranách, A žádné), be1 Gutenbergstrasse, be4
  Schänzlistrasse, lu1 Via Ponte Tresa, lu4 Via Comorgio, st1 Hebelstrasse (stání vlevo s auty), va5 Auring. Typicky
  obruby na místě a chodníky 2–3 m místo výchozích 6 m odhadu.
- **Stejně (9):** be3 Stauffacherstrasse, be5 Badgasse, lu2 Via Lepori, lu3 Via Trevano, st2 Hätterenstrasse (lesní
  cesta), ba1, ba5, be2, va2 (cesty a parkoviště).
- **Hůř B (5):** be6 Monbijoubrücke (most: pod středem `uebrige_befestigte`, celý řez „plocha“ 16 m), ge2 (nábřeží),
  lu5 (molo, „plocha“ 44 m), st3 (parkoviště, 42 m), ge4 Rue François-Dussaud (pět pruhů po 4 m a krajnice až do
  kruhového objezdu; A užší).
- **Nejde posoudit (8):** ba3, ge1, ge3, ge5 (náměstí a promenády), lu6, va3 (les), st4 Hechtgasse a zu4 Torgasse
  (úzké ulice ve stínu).

## Oprava po A/B

Pod středem čtyř horších řezů (most, nábřeží, molo, parkoviště) leží `uebrige_befestigte` (ostatní zpevněná plocha).
Vyměřování se proto bere, jen když je **přímo pod středem řezu** vozovka a cesta, chodník nebo dráha; jen v mezeře
vyměřování (žádná plocha pod středem) stačí do 1,5 m (`towns/switzerland.js STREET`, test). Ověřeno dotazem na plochu
pod středem všech 38 řezů (`uebrige_befestigte`: be6, ge2, lu5, st3, zu2, ba1, ba5, be2, ge1, ge5, va2; les va3):
po opravě se z horších čtyř stane A, ze stejných a neposouditelných cesty a parkoviště také A, ztratí se jeden lepší
(zu2, řez na pěšině vedle tramvaje). **Výsledek po opravě: lépe 15, hůř 1 (ge4), zbytek stejně nebo nejde posoudit.**
Vyměřování zůstává zapnuté (`?av=0` vypne).

Zbývá: řez na široké vozovce u kruhového objezdu (ge4) dává pruhy po 4 m; Lausanne (Vaud) a Luzern vyměřování
nesdílejí.
