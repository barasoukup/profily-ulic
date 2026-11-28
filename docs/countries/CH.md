# Švýcarsko a Lichtenštejnsko (CH, LI)

Stav nasazení: větev `switzerland`, 17. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Švýcarsko a Lichtenštejnsko (větev switzerland, 17. 11. 2026, nenasazené)

- Státy `switzerland` (CH) a `liechtenstein` (LI): `countries/CH.js`, `LI.js` (švýcarská pravidla s lichtenštejnskými čísly
  článků), `towns/switzerland.js`, `signs-CH/`, `evaluation/switzerland/` (ZDROJE, NORMY, RECENZE, ab/). Hranice
  swissBOUNDARIES3D swisstopo v `states.json` hned za Českem a Slovenskem (Büsingen a Campione jsou díry).
- Ortofoto SWISSIMAGE 10 cm (WMTS z20, `lanes-ortho.js` `ch`, dlaždice `{z}/{x}/{y}`), i pro Lichtenštejnsko.
- Plochy z úředního vyměřování (Amtliche Vermessung, `LCSF`) přes WFS geodienste.ch, všechny kantony, které ho sdílejí,
  i Lichtenštejnsko; Vaud (Lausanne) a Luzern ne. Jen když je pod středem řezu vozovka, chodník nebo dráha (ne
  `uebrige_befestigte`: most, nábřeží, molo). Fair use 10 dotazů WFS za minutu: v testech pauza 7 s. `?av=0` vypne.
  A/B 42 řezů: po opravě lépe 15, hůř 1. Licence po kantonech neprověřené.
- Měření přesnosti 17. 11.: shoda složení CH 59 % (18 řezů), LI 69 % (6); s vyměřováním 69 %, bez něj 41 % (`evaluation/switzerland/REPORT.md`).
- Normy VSS jen podle kantonálních a městských příruček (Bern, Basel-Stadt, Curych, Schwyz), kde chybí, bez varování.
  Stání: VRV čl. 19 a pomůcky kantonů Bern a Luzern (3 m na projetí); vyznačená pole nemáme, odhad může nadhodnocovat.
- Značky SSV z Commons (ASTRA, čl. 5 URG), stejná čísla v LI; tabulky „Zubringerdienst“ a „ausgenommen Velos“ jsou text,
  značka s nimi se nekreslí. Hledání Photon v místních jazycích. Bez paneláků, neutrální vozidla, český mobiliář.
- OSM balíky `ch` a `li` jen na R2 (Geofabrik `switzerland` Lichtenštejnsko nemá). Lokálně jen města vzorku. viz seznam v `docs/deployment.md` Recenze a co se z ní udělalo: `evaluation/switzerland/REVIEW.md`.

## Popis zdrojů a pravidel (dříve app/README.md)

### Švýcarsko a Lichtenštejnsko (Bára 17. 11. 2026)

Státy `switzerland` (`country` CH) a `liechtenstein` (LI), oba `towns/switzerland.js`; hranice ze swissBOUNDARIES3D
swisstopo v `states.json` (přednost před hrubšími hranicemi GISCO Rakouska a Německa; Büsingen a Campione jsou díry).
Profil je odhad z OSM (balíky `ch` a `li` jen na R2) a ortofota SWISSIMAGE 10 cm (`lanes-ortho.js` zdroj `ch`, WMTS
z20, dlaždice `{z}/{x}/{y}`).
- **Úřední vyměřování** (Amtliche Vermessung, pokryv půdy `LCSF`) přes WFS geodienste.ch jako plochy řezu, kde má plochu
  ulice pod středem řezu: vozovka a cesty, chodníky, ostrůvky, dráha, budovy, zeleň, voda. Všechny kantony, které ho
  sdílejí, i Lichtenštejnsko (Vaud a Luzern ne); kredit podle kantonu (`credits.js chAv`). Neodpoví-li, odhad s poznámkou.
  `?av=0` vypne. A/B v `evaluation/switzerland/ab/`.
- **Normy** `countries/CH.js` (`limits`): hodnoty norem VSS podle kantonálních a městských příruček (Bern, Basel-Stadt,
  Curych, Schwyz), kde zdroj chybí, bez varování. Stání podle VRV čl. 19 a pomůcek kantonů Bern a Luzern (3 m na projetí,
  pruhy vedle stání průjezdné). Lichtenštejnsko (`countries/LI.js`) má švýcarská pravidla se svými čísly článků.
  Rešerše `evaluation/switzerland/NORMS.md`.
- **Hledání** Photon (`photon-ch`, místní názvy: Genève, Lugano). **Značky** `signs-CH/` (SSV, stejná čísla v LI).
- **Domy** bez paneláků (jako Rakousko), **vozidla** neutrální z `generic/`, mobiliář a označníky české.
