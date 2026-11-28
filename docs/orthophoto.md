# Ortofoto a odhad bez technické mapy

Pruhy z ortofota a záložní odhad z ortofota a OSM.

## Pruhy z ortofota (Bára 11.–12. 11. 2026)

- `app/public/lanes-ortho.js`: čáry na ortofotu přeměří pruhy a krajnice a oddělí stání z dlažby; Praha IPR 10 cm,
  Brno 2025 s posunem, Plzeň 2024, jinde ČÚZK 12,5 cm. Pravidla v `docs/profile-derivation.md` (Jak se profil skládá, bod 11),
  vyhodnocení a co nevyšlo v `evaluation/orthophoto/REPORT.md`, odkazy na zkoušení `evaluation/orthophoto/LINKS.md`.
- Krajnice z vodicí čáry může být i hodně úzká (Bára); pravidlo „krajnice od 1 m“ platí pro odhad podle pravidel.
- Proti ručnímu značení 117 vozovek: hranice pruhů do 0,3 m 25 → 39 %, počet pruhů 52 → 52 %, lépe 32, hůře 9.
- Zároveň: lampy svítí na nejbližší vozovku (ve středovém pásu na obě strany), troleje jen nad jedním pruhem každým
  směrem, ulice na mostě končí za krajním chodníkem, `slight_right/left` jako vpravo/vlevo, výběr části profilu
  vyznačený v mapě, Plzeň: „stavba pro zpevnění povrchu“ je zpevněná plocha.

## Bez technické mapy: ortofoto a OSM (Bára 15. 11. 2026)

- Pokus `evaluation/ortho-osm/REPORT.md` (profil jen z ortofota a OSM proti MTVU, Praha a Brno): kombinace je
  lepší než samotné OSM (obruba do 0,5 m 39–49 % proti 26–35 %), ale zůstává hrubým odhadem. Rozlišení 20 cm stačí.
- Bára: použít jako záložní případ, když technická mapa chybí. `app/public/ortho-osm.js`, zapojené v `app/cut.js`, když
  `deriveProfile` vrátí odhad z OSM (`estimate`). Plochy jsou označené jako odhad. Popis v `docs/profile-derivation.md` (bod 11a).
- Pro rozšíření do ciziny: nejdřív hledat místní mapy povrchů (NL BGT, Vídeň FMZK…), tohle je až záloha.
- Dlaždice OSM (Bára 15. 11. 2026): všechny budovy (ne jen s výškou; v ČR dál primárně RÚIAN, OSM navíc pro zahraničí),
  zeleň, voda, zahrádky, hřbitovy, obruby `barrier=kerb`, `area:highway`, u budov rok a střecha. Změřeno na celé ČR:
  1,39 GB proti dřívějším 0,84 GB (domy bez výšky 279 MB, zeleň 236 MB): na Pages (1 GB) se nevejde, proto jsou na R2
  (zabalené 281 MB). Popis v `docs/osm.md` (Dlaždice OSM).
