# Jak hledat a opravovat chyby profilů (z kontroly slovenských ulic, 16. 11. 2026)

Postup, který se osvědčil, a chyby, které jsme při něm udělali. Platí i pro Česko a další státy.

## 0. Šetřit zdroje (Bára)
- Co nejméně běhů a dotazů na služby (ZBGIS, ortofoto, města, IPR) i práce: velký běh jen jednou jako výchozí stav.
- **Krok, který jen přepočítá díly profilu (pruhy, krajnice), se A/B počítá z uloženého běhu bez nových dotazů:** funkce
  se použije na uložené díly a značky OSM ulice (`check.js`), nový běh jen na kontrolu pár cílových řezů.
- Nový běh B jen na cílových řezech a malé kontrole (viz 4.), ne na celém vzorku.
- Hlídat běh řídce, výsledky číst souhrnně (počty, výpis jen změněných cílů), ne celé seznamy.
- **Regrese Prahy a Brna jednou na konci série oprav** (Bára), ne po každé: každá oprava má vlastní `?off=`, takže když
  regrese něco zhorší, viník se najde vypínáním oprav po jedné (`?off=` regrese, `P.off`).

## 1. Hledání
- **Vzorek skutečných ulic**, ne náhodných bodů (Bára): náhodný bod se přichytí k pěšině nebo cestě v areálu a chyby
  pak hlásí věci, které uživatel neklikne. `sample-streets.mjs`: bod → nejbližší pojmenovaná ulice primary až residential,
  nejvýš dva body na ulici, pevný seed.
- **Automatická podezření proti OSM na čáře řezu** (`collect.js` + `check.js`): co OSM na řezu má (cyklostezka, chodník,
  lanes, koleje) a profil ne. Podezření, ne verdikt.
- **Kontrola má hlídat pravidlo, ne práh od oka:** „pruh nad 4,6 m“ hlásilo 115 řezů v pořádku (do 1 m nad stropem,
  obousměrky pod 5 m, zóny); podle pravidla (strop + 1 m, mimo zóny) žádný.
- Bářiny nálezy z procházení do `speky.md`.

## 2. Než se opraví
- **Ověřit domněnku na místě** (Street View, ortofoto) aspoň na dvou řezech. „Široká krajnice u obousměrky = parkující
  auta“ neplatila: na Hroboňově žádná auta, krajnice byla druhý pruh (středová čára vzatá za vodicí).
- Rozdělit podezření podle zdroje dílu (`osm`, `ortofoto`, `dtm`, `odhad`) a druhu ulice: ukáže, který krok chybu dělá.

## 3. Oprava
- Každá oprava má přepínač `?off=…` (A/B a záchrana), test v `tests/` a zápis v `REPORT.md` s čísly.
- Malý krok na konci řetězce (po `applyLanes` v `app.js`) je bezpečnější než zásah do čtení obrázku, ale **regrese
  Prahy a Brna (`evaluation/ortho-osm/regression.mjs`) kroky v `app.js` nepokrývá**: u nich A/B v Česku zvlášť.

## 4. A/B
- **Jen relevantní řezy** (Bára): ty, kterých se oprava podle běhu A může týkat (cíl), a 100 náhodných ostatních
  (kontrola). Pár minut místo půl hodiny.
- **Jen řezy se stejnými zdroji v obou bězích** (`check.js` `compare`): když služba (ZBGIS, ortofoto) v jednom běhu
  vypadne, aplikace potichu spočítá hrubší odhad a A/B pak ukazuje desítky „změn“, které s opravou nesouvisí.
- **Prohlédnout každou změnu cíle**, ne jen počty: první verze slučovala krajnice z obou stran (2 × 4,8 m), jiná přidala
  krajnici vedle krajnice. Obojí ukázal až výpis změn.
- Kontrola musí vyjít beze změny; když ne, oprava sahá dál, než má.

## 5. Technické pasti
- Výsledky běhu ne do `localStorage` (aplikace pak neuloží profil a řezy vyjdou prázdné), ale do IndexedDB stránky
  (`collect.js` `save`/`load`); znovunačtení stránky smaže proměnné.
- Skrytý panel prohlížeče zpomalí běh několikrát.
- Body bez ulice v okolí (řeka, les) dají prázdný profil: to není chyba.
