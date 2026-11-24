# A/B: mapa povrchů Vilniusu (24. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261124): 40 náhodných bodů do 3 km od středu Vilniusu. Sběr v aplikaci
(localhost, `?osm=balik`), každý bod A = bez mapy (`?vilnius=0`, jen odhad z OSM: v Litvě žádné ortofoto) a B = s
topografickými plochami 1 : 500 města (`gis.vplanas.lt`, vrstva 13; před nimi budovy z OSM, po nich zeleň a voda z OSM).
Výsledky `vysledky/rezy.json`, obrázky `images/` (nahoře A modře, dole B červeně, nad ortofotem Vilniusu 2024 jen pro
posouzení; `ORTHO=lt` v `evaluation/slovensko/ab/obrazky.mjs`), posudky `vysledky/posudky.json`.

Mapovou vrstvu jsem nejdřív prohlédla nad ortofotem (Gedimino pr., Žirmūnai, Naujamiestis): vozovky (`kelias`) leží mezi
obrubami, chodníky (`pėsč`) na chodnících; dlažba bez účelu jsou často chodníky (Gedimino pr.); kód 2403 je trávník.
Některé hlavní silnice (Žirmūnai) mapa nemá vůbec, v sídlištích má `kelias` i celá parkoviště ve dvorech.

**První kolo** (mapa použita, když pod středem řezu do 3 m ležela její vozovka nebo chodník): 30 ze 40. Ve čtyřech řezech
(vl4, vl21, vl30, vl38) pod ulicí pro auta ležel jen dlážděný dvůr nebo chodník mapy a B ztratil vozovku. Proto
`hasStreet`: pod ulicí pro auta musí být vozovka mapy, pod pěšinou stačí chodník. **Druhé kolo** (dnešní kód):

- Mapa použita ve 26 řezech ze 40 (jinde je bod na pěšině mimo mapu nebo pod ulicí není vozovka mapy).
- Posudky okem (10 px = 1 m, ortofoto asi 9 cm, bez fotek z ulice): **lépe B 17, lépe A 2, stejně 4, nejde posoudit 3.**
  - Lépe B: vozovka a obruby podle skutečného asfaltu místo odhadu 2,75 m (vl5, vl6, vl7, vl32, vl35, vl37, vl39), šíře
    pěšin a chodníků (vl3, vl10, vl29), cyklopruh (vl16), stání a dvůr (vl27), dělicí pás se zelení (vl40), počet pruhů
    (vl9, vl17, vl24).
  - Lépe A: vl13 (B ztratil vozovku obslužné cesty), vl28 (plocha `kelias` je celé parkoviště: obslužná cesta 42 m).
- Mapa zůstává zapnutá (`?vilnius=0` vypne). Licence: služba ji neuvádí; Bára 24. 11. 2026 přijala kodaňské vrstvy bez
  uvedené licence, Vilnius stejně, s kreditem města.

Univerzální měření (10 řezů s fotkou, 7 s mapou) vyšlo pro mapu hůř než odhad: viz `../ZPRAVA.md`.
