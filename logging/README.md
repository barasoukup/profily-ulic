# Záznam řezů (Cloudflare)

Stránka posílá po každém řezu a u několika akcí krátkou zprávu (`pilot/public/log.js`). Cloudflare Worker
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
- **hlášení chyb** (od 11. 11. 2026): co návštěvník u řezu označil za špatné (kategorie a vlastní text, nejvýš
  1 000 znaků) spolu s řezem a profilem, jak ho aplikace sestavila (a jak ho opravil, pokud opravoval). V okně je
  upozornění, ať nepíše osobní údaje.

## Soukromí

Zaznamenáváme jen řezy (místo, směr, ulici, čas), použité funkce a hlášení chyb, která návštěvník sám napíše, abychom aplikaci zlepšili. IP adresy ani
cookies neukládáme; `session` je náhodné číslo jednoho načtení stránky (neukládá se v prohlížeči), aby šlo
spočítat řezy jedné návštěvy. Záznam běží na Cloudflare (Worker a D1), který adresu požadavku vidí; Worker ji drží
jen 10 s v paměti proti zahlcení a do databáze ji nezapisuje. Mapy a data se načítají přímo ze serverů IPR, ČÚZK, měst a krajů a z podkladové mapy
OSM; písmo a Leaflet jsou na našem webu.

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
- **Hlášení chyb** (tlačítko „Nahlásit chybu“ pod profilem): `node hlaseni.mjs` vypíše posledních 50 hlášení
  (nebo `node hlaseni.mjs 200`) s textem, odkazem na řez a profilem, jak ho aplikace sestavila.
- **Co lidé opravují a navrhují:** `node upravy.mjs` (nebo `node upravy.mjs oprava`, `node upravy.mjs navrh`) vypíše
  každý záznam úprav jako seznam změn (i s odkazem `#rez=`) a nakonec nejčastější změny.
- Přehled dotazů a spotřeby je i v nástěnce Cloudflare (Workers & Pages, D1).

Úpravy potřebují ve stávající databázi sloupec `profile` a nový Worker (jednou, 11. 11. 2026):
```bash
npx wrangler d1 execute profily-ulic-log --remote --command "ALTER TABLE events ADD COLUMN profile TEXT"
```
```bash
npx wrangler deploy
```

Lokálně (`node pilot/server.mjs`) se nic nezaznamenává, `LOG_URL` je tam prázdné.
