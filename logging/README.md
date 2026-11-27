# Záznam řezů (Cloudflare)

Stránka posílá po každém řezu a u několika akcí krátkou zprávu (`app/public/log.js`). Cloudflare Worker
(`worker.js`) ji uloží do databáze D1 (`schema.sql`). Odesílá se na pozadí přes `navigator.sendBeacon`, takže
kliknutí na nic nečeká, a když Worker neodpoví, nic se nestane.

**Co se ukládá:**
- **řez** přesně, tedy střed, azimut a dosah jako v odkazu `#rez=`, dále město, ulice, typ ulice, OSM cesta,
  čas a způsob vzniku (klik, posun, odkaz),
- **akce:** export PNG a SVG, uložení souboru, sdílení odkazu, přepnutí do Návrhu a do Porovnání, oprava dat, použití hledání adres (jen druh nalezeného místa: adresa, ulice, jiné místo; nikdy hledaný text).
- **úpravy** (od 11. 11. 2026): jak návštěvník opravil data (vypočtený Stav → opravený Stav) a jak ulici navrhl
  (Stav → Návrh). Uloží se jen zkrácený profil: druh a šířka každé části, směr, cyklisté, způsob stání, těleso
  tramvaje, šipky a značky, druhy okrajů. Posílá se při „Hotovo“, při odchodu z Návrhu nebo z oprav, při dalším
  řezu a při zavření stránky, a jen když se něco změnilo.
- **kliknutí bez ulice** (od 14. 11. 2026, Bára: kolik lidí zkouší klikat mimo Česko): když aplikace u kliknutí žádnou
  ulici nenajde, uloží se jen místo zaokrouhlené na setiny stupně (asi 1 km), město a jestli tam vůbec byla data OSM
  (`bez_dat`: mimo Česko žádná nejsou, `bez_ulice`: data jsou, ulice ne), bez ulice a bez profilu.
- **hlášení chyb** (od 11. 11. 2026): co návštěvník u řezu označil za špatné (kategorie a vlastní text, nejvýš
  1 000 znaků) spolu s řezem a profilem, jak je na stránce, a profilem, jak ho aplikace při té návštěvě sestavila
  (chybí u profilu obnoveného nebo načteného ze souboru). V okně je
  upozornění, ať nepíše osobní údaje. Hlášení smaže na požádání Bára (`DELETE FROM events WHERE id = …`);
  výpis `reports.mjs` se nikam nesdílí.

- **zprávy z okna „O aplikaci“** (od 24. 11. 2026, `POST /contact`, tabulka `contacts`): text (nejvýš 3 000 znaků),
  nepovinný e-mail pro odpověď a, když ho návštěvník přiloží, odkaz na řez (`#rez=…`, jen z našich adres), k tomu jazyk
  stránky a stát řezu (posílají se vždy, formulář to u tlačítka říká). Skryté pole pro roboty: co ho vyplní, se neuloží.
  E-mail návštěvníka se drží, dokud zprávu Bára nesmaže (`DELETE FROM contacts WHERE id = …`).
  **Limit:** z jedné adresy nejvýš 5 zpráv za hodinu (IPv6 se počítá po sítích /64, jedna síť má 2^64 adres); limit pro
  všechny dohromady není, aby jeden skript nemohl formulář vypnout ostatním. E-mailem přijdou z jedné adresy nejvýš
  2 zprávy za hodinu a od všech nejvýš 10; další se jen uloží do databáze. Počítá se v tabulce `contact_rate` podle
  otisku SHA-256 z hodiny, adresy a tajného `RATE_SALT` (adresa sama se neukládá), jedním příkazem
  `INSERT … ON CONFLICT DO UPDATE … RETURNING`, takže ani souběžné požadavky limit neobejdou. Bez `RATE_SALT` Worker
  zprávy nebere (odpoví 503 „not configured“), aby neukládal otisky bez soli, ze kterých jde adresa dopočítat.
  Řádky minulých hodin maže Worker každou hodinu (cron v `wrangler.toml`) a při každé zprávě, takže otisk v databázi
  vydrží nejvýš asi dvě hodiny.

## Soukromí

Zaznamenáváme řezy (místo, směr, dosah, ulici, čas), úpravy profilu v opravě dat a v Návrhu (druhy a šířky částí), kliknutí, u kterých se ulice nenašla (místo zhruba na kilometr), použité funkce, hlášení chyb a zprávy, které návštěvník sám napíše (s nepovinným e-mailem pro odpověď, jazykem stránky a státem řezu), abychom aplikaci zlepšili. IP adresy ani
cookies neukládáme; `session` je náhodné číslo jednoho načtení stránky (neukládá se v prohlížeči), aby šlo
spočítat řezy jedné návštěvy. Nastavení a poslední profil zůstávají jen v prohlížeči (localStorage) a nikam se neodesílají. Záznam běží na Cloudflare (Worker a D1), který adresu požadavku vidí; Worker ji drží
jen 10 s v paměti proti zahlcení a do databáze ji nezapisuje (u zpráv z formuláře jen otisk se solí na počítání limitu, smazaný nejvýš asi po dvou hodinách). Stránku hostí GitHub Pages, dlaždice OSM Cloudflare (R2).

Mapy a data se načítají přímo ze serverů poskytovatelů uvedených v patičce stránky (IPR, ČÚZK, ÚGKK SR, města a kraje i přes ArcGIS Online, basemap.at, spolkové země Německa, swisstopo, PDOK, Digitaal Vlaanderen, SPW, ACT Luxembourg, GUGiK, IGN, DGT, GURS, Maa- ja Ruumiamet, Klimadatastyrelsen, města a další) a z podkladové mapy OSM; ti vidí IP adresu a místo, na které se návštěvník dívá.
Hledaný text dostane podle místa ČÚZK, ÚGKK SR, město Vídeň, komoot (Photon), PDOK, GUGiK, IGN France, CartoCiudad, Maa- ja Ruumiamet (In-ADS), GURS, SYKE nebo Klimadatastyrelsen (GSearch); komoot a IGN dostanou i střed mapy. Panorama z ulice po kliknutí načítá Mapy.com (Seznam.cz). Písmo a Leaflet jsou na našem webu.

## Limity

**Bezplatné limity Cloudflare:** 100 000 požadavků na Worker denně a 100 000 zapsaných řádků v D1 denně,
5 GB místa (jeden řádek má asi 200 B, tedy zhruba 25 milionů záznamů). Nad denní limit se záznamy ten den
jen nezapíšou, aplikace jede dál.

## Nasazení (jednou)

Potřebuješ účet na cloudflare.com (stačí bezplatný) a Node. Všechny příkazy se spouštějí ve složce `logging/`.

1. Přihlas se. Otevře se prohlížeč:
   ```bash
   npx wrangler login
   ```
2. Založ databázi a ze zprávy, kterou příkaz vypíše, zkopíruj `database_id` do `wrangler.toml` místo `DOPLNIT`:
   ```bash
   npx wrangler d1 create profily-ulic-log
   ```
3. Vytvoř tabulku:
   ```bash
   npx wrangler d1 execute profily-ulic-log --remote --file schema.sql
   ```
4. Nastav heslo pro stahování dat (vymysli si dlouhé náhodné heslo a zadej ho, když se příkaz zeptá):
   ```bash
   npx wrangler secret put EXPORT_TOKEN
   ```
5. Nasaď Workera. Příkaz vypíše jeho adresu, např. `https://profily-ulic-log.<tvůj-účet>.workers.dev`:
   ```bash
   npx wrangler deploy
   ```
6. Na GitHubu v repozitáři otevři **Settings → Secrets and variables → Actions → Variables** a přidej
   proměnnou `LOG_URL` s adresou z kroku 5 a koncovkou `/log`, např.
   `https://profily-ulic-log.<tvůj-účet>.workers.dev/log`.
   Při dalším nasazení ji workflow zapíše do `config.js` a do CSP stránky. Bez ní se nic neposílá.

## Data

- **Stažení všeho jako CSV** (heslo z kroku 4):
  ```bash
  curl -H "Authorization: Bearer HESLO" https://profily-ulic-log.<tvůj-účet>.workers.dev/export -o rezy.csv
  ```
  S `?since=2026-11-01` jen od data.
- **Rychlé dotazy přímo v databázi**, např. řezy podle měst:
  ```bash
  npx wrangler d1 execute profily-ulic-log --remote --command "SELECT city, count(*) FROM events WHERE kind='rez' GROUP BY city ORDER BY 2 DESC"
  ```
- **Kliknutí mimo data** po dnech:
  ```bash
  npx wrangler d1 execute profily-ulic-log --remote --command "SELECT date(ts,'+1 hour') den, detail, count(*), count(DISTINCT session) FROM events WHERE kind='bez_ulice' GROUP BY 1, 2 ORDER BY 1"
  ```
- **Hlášení chyb** (tlačítko „Nahlásit chybu“ pod profilem): `node reports.mjs` vypíše posledních 50 hlášení
  (nebo `node reports.mjs 200`) s textem, odkazem na řez a profilem, jak ho aplikace sestavila.
- **Co lidé opravují a navrhují:** `node edits.mjs` (nebo `node edits.mjs oprava`, `node edits.mjs navrh`) vypíše
  každý záznam úprav jako seznam změn (i s odkazem `#rez=`) a nakonec nejčastější změny.
- Přehled dotazů a spotřeby je i v nástěnce Cloudflare (Workers & Pages, D1).

Stát řezu (`country`, ISO: CZ, SK, AT) vedle města (od 16. 11. 2026 má i Bratislava, Vídeň a další města své id, zbytek
státu `slovensko`, `austria`): ve stávající databázi jednou sloupec, pak nový Worker (bez sloupce Worker zapisuje
dál, jen bez státu). Statistiky po státech: `SELECT country, count(*) FROM events WHERE kind='rez' GROUP BY 1`.
```bash
npx wrangler d1 execute profily-ulic-log --remote --command "ALTER TABLE events ADD COLUMN country TEXT"
```

Úpravy potřebují ve stávající databázi sloupec `profile` a nový Worker (jednou, 11. 11. 2026):
```bash
npx wrangler d1 execute profily-ulic-log --remote --command "ALTER TABLE events ADD COLUMN profile TEXT"
```
```bash
npx wrangler deploy
```

Lokálně (`node app/server.mjs`) se nic nezaznamenává, `LOG_URL` je tam prázdné.

## Kontaktní formulář (okno „O aplikaci“, 24. 11. 2026)

**Stav 27. 11. 2026:** nasazeno z main (Worker verze 3932755b, pak 84238226), e-mail zapnutý (Email Routing pro
streetspace.eu, tajné `CONTACT_FROM=profily@streetspace.eu` a `CONTACT_TO`, vazba `[[send_email]] name="MAIL"`). Na Macu
s Node 26 `npx wrangler` tiše končí kódem 194; spouštět `node …/node_modules/wrangler/bin/wrangler.js …` přímo.

Formulář posílá na stejného Workera jako záznam řezů, na adresu z `LOG_URL` s koncovkou `/contact` místo `/log`
(`app/public/about.js`). Dokud `LOG_URL` není nastavené nebo Worker neodpovídá, okno napíše „Odesílání zpráv tu zatím
nejde.“ a nic neposílá. Nasazení (ve složce `logging/`, jednou):

1. Přidej do databáze dvě nové tabulky. `schema.sql` má všechno s `IF NOT EXISTS`, takže stačí ho spustit znovu
   (stávající tabulka `events` zůstane, jak je):
   ```bash
   npx wrangler d1 execute profily-ulic-log --remote --file schema.sql
   ```
2. Nastav tajnou „sůl“ pro počítání zpráv z jedné adresy (vymysli si dlouhý náhodný text a zadej ho, když se příkaz zeptá;
   bez ní Worker zprávy odmítá):
   ```bash
   npx wrangler secret put RATE_SALT
   ```
3. Nasaď nového Workera (`wrangler.toml` má i hodinový cron, který maže staré řádky limitu):
   ```bash
   npx wrangler deploy
   ```
4. Vyzkoušej to na webu (O aplikaci → Napište nám) a podívej se, že zpráva dorazila:
   ```bash
   npx wrangler d1 execute profily-ulic-log --remote --command "SELECT id, ts, email, cut, lang, country, message FROM contacts ORDER BY id DESC LIMIT 20"
   ```
   Proměnná `LOG_URL` na GitHubu zůstává, jak je; formulář začne fungovat při dalším nasazení stránky s ní (bez ní je
   formulář jen „zatím nejde“).

### Upozornění e-mailem (nepovinné)

Worker umí každou zprávu poslat i e-mailem přes Cloudflare Email Routing. Adresy nejsou v kódu ani v `wrangler.toml`
(ten je v repozitáři), jen v nastavení Workera:

1. V nástěnce Cloudflare otevři doménu **streetspace.eu → Email → Email Routing**, zapni ho (Cloudflare přidá záznamy MX
   a SPF do DNS) a v **Destination addresses** přidej a potvrď adresu, kam mají zprávy chodit.
2. Do `wrangler.toml` přidej vazbu bez adresy (adresa příjemce zůstane jen v tajné proměnné; Cloudflare pošle jen na
   potvrzenou adresu):
   ```toml
   [[send_email]]
   name = "MAIL"
   ```
3. Nastav odesílatele (adresa na doméně s Email Routingem, nemusí existovat, např. `profily@streetspace.eu`) a příjemce
   (potvrzená adresa z kroku 1), oba jako tajné proměnné:
   ```bash
   npx wrangler secret put CONTACT_FROM
   npx wrangler secret put CONTACT_TO
   ```
4. `npx wrangler deploy`. E-mail má předmět „Profily ulic: zpráva“ a odpověď (Reply-To) míří na e-mail návštěvníka,
   pokud ho vyplnil. Když se e-mail nepodaří poslat, zpráva zůstane uložená v databázi.
