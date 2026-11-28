# Rakousko (AT)

Stav nasazení: větev `austria`, 16. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Rakousko (větev austria, Bára 16. 11. 2026, rozpracované, nenasazené)

- Názvy v kódu a souborech anglicky (Bára 16. 11. 2026): stát `austria` (`country` AT), `towns/austria.js`,
  `signs-AT/`, `evaluation/austria/`. Stávající české názvy zůstávají.
- Hranice z Eurostat GISCO 1 : 1 M v `states.json` (BEV WFS je vypnutá); Česko a Slovensko mají přednost.
- OSM: výřez Geofabrik `austria`, balík `at` jen na R2 (na Pages by se nevešel 1 GB), workflow staví cz, sk, at.
- Ortofoto basemap.at (`bmaporthofoto30cm`, Web Mercator do z20, CORS, CC BY 4.0) pro pruhy, obruby a podklad.
- Vídeň: Flächen-Mehrzweckkarte (FMZK, data.wien.gv.at WFS 2.0, CC BY 4.0 „Stadt Wien – data.wien.gv.at“) jako plochy
  řezu, kde má ulici pod středem (`?wien=0` vypne; A/B 40 řezů: lépe 9, stejně 2, sporný 1 z 12 prohlédnutých,
  `evaluation/austria/ab/REPORT.md`). Neodpoví-li některá vrstva, FMZK se nepoužije a poznámka to řekne. Další města (Graz, Linz, Innsbruck, Klagenfurt)
  otevřené mapy povrchů nemají; Salcburk má buspruhy, zóny, stromy a značky (nezapojené).
- Normy `countries/AT.js` limits (`evaluation/austria/NORMS.md`): cyklo podle RVS 03.02.13 (přes NÖ Leitfaden, druhotně), ostatní
  Wiener Projektierungshandbuch (MA 18, 2011); RVS 03.02.12, 03.04.12, 03.07.11 nejsou veřejné.
- Značky `signs-AT/` (StVO § 52–53, Commons, úřední díla); stání na chodníku, vyhrazené stání a cyklopruh nemají značku.
- Odhad stání podle zákona zapnutý od 17. 11. 2026 (StVO § 24 odst. 3: dva volné pruhy, judikatura asi 2,6 m na pruh, v jednosměrce jeden).
- Jednosměrka se v Rakousku pod pruhem neznačí (Bára: Einbahnstraße je jen tabule podél ulice); odvozené značky bez
  rakouské kresby a značky s dodatkovou tabulkou se zahodí.
- Nepřátelská recenze 16. 11. 2026 zapracovaná (cache nasazení podle států, skupiny silnic z OSM, StVO § 24, mapování
  FMZK, poctivé citace norem, licence).
- Hledání: Vídeň z adresních bodů města (`search-at.js`), jinde v Rakousku Photon od komoot (`search-photon.js`; Bára
  16. 11. 2026: záloha, BEV jen s registrací a poplatky). Salcburk: zákaz zastavení a stání z katastru značek.
- Žádný panelák v Rakousku (Bára 16. 11. 2026): deska z let 1946–90 je poválečný bytový dům (od 23. 11.), před 1946 funkcionalistický, po 1990 moderní, kanceláře kanceláře.
- Chybí: vozidla a mobiliář měst (kreslí se), Kurzparkzonen (aplikace zóny nekreslí), sítě (otevřené nejsou).

## Popis zdrojů a pravidel (dříve app/README.md)

### Rakousko (Bára 16. 11. 2026)

Stát `austria` (`country` AT, `towns/austria.js`; hranice z Eurostat GISCO v `states.json`). Jako na Slovensku se
neptá DMVS, RÚIAN ani ortofoto ČÚZK; profil je odhad z OSM (výřez Geofabrik, balík `at` jen na R2) a ortofota
basemap.at (`lanes-ortho.js` zdroj `at`, z20).
- **Vídeň:** Flächen-Mehrzweckkarte (FMZK) města jako plochy řezu (vozovka, chodníky, parkování, tramvajové těleso,
  zeleň, voda, domy, zdi), kde má plochu ulice pod středem řezu; podloubí a přístřešky podle plochy pod nimi.
  Neodpoví-li některá vrstva, FMZK se nepoužije (poznámka). `?wien=0` vypne. A/B v `evaluation/austria/ab/`.
- **Normy** `countries/AT.js` (`limits`): cyklo podle RVS 03.02.13 (citováno přes NÖ Leitfaden 2024), pruhy a ostatní podle
  Wiener Projektierungshandbuch; skupina silnice z OSM `highway` (`derive.js osmGroup`). Stání napůl na chodníku
  podle StVO § 24 odst. 3 (dva volné pruhy po asi 2,6 m). Rešerše `evaluation/austria/NORMS.md`.
- **Hledání** ve Vídni z adresních bodů města (`search-at.js`, když mapa ukazuje Vídeň nebo dotaz obsahuje „Wien“);
  adresa se řeže na své ulici (osa z grafu ulic města, ulice toho jména vyhrává v `nearestStreet`). Jinde v Rakousku
  (a ve Vídni, kde adresní body nic nenajdou) Photon od komoot (`search-photon.js`, OSM, jen výsledky AT; veřejný server
  pro rozumné použití, při větším provozu vlastní instance).
- **Salcburk:** zákaz zastavení a stání z katastru značek města (do 25 m od řezu, na straně značky), `?salzburg=0`.
- **Značky** `signs-AT/` (StVO § 52–53); jednosměrka se pod pruhem neznačí, značky bez rakouské kresby a s
  dodatkovou tabulkou se zahodí.
