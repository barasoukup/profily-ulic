# Záznam řezů, kontakt a O aplikaci

Logování řezů, kontaktní formulář a dialog O aplikaci.

## O aplikaci (Bára 24. 11. 2026, větev estonia, nenasazené)

- Menu Soubor → „O aplikaci“ (`app/public/about.js`, dialog v `index.html`): text o aplikaci, autorka podle státu řezu
  (`countries/*.js author`: v CZ a SK Bára Soukupová, jinde Bara Soukup), MIT a odkazy na repo a `LICENSES-AND-SOURCES.md`.
- Mapa pokrytí `app/public/coverage.json` (309 kB) dělá `node tools/build_coverage.mjs` z modulů: `SURFACE_MAPS` v každém
  `towns/*.js` („all“, id z AREAS, klíč hranic, „-NUTS3“ vynechá), `laneOrtho` států a částečná ortofota z `lanes-ortho.js`.
  Nový zdroj = upravit `SURFACE_MAPS` a přestavět; `tests/coverage.test.js` hlídá aktuálnost, zařazení všech států a modulů
  a třídy v bodech (i těsně za hranicí města). Města z obdélníků AREAS se kreslí hranicí obce (GISCO LAU 2024,
  `LAU_TOWNS`, `tools/coverage-lau.json`, `--lau=<soubor>`), pod legendou „mapu povrchů bereme jen tam, kde má ulici pod řezem“.
- Kontaktní formulář přes Workera (`POST /contact`, tabulky `contacts` a `contact_rate`, skryté pole, 5 zpráv za hodinu
  z adresy, IPv6 po /64, počítáno atomicky `INSERT … RETURNING`, bez celkového stropu; e-mail 2× z adresy a 10× za hodinu
  celkem; bez `RATE_SALT` odpověď 503; staré řádky maže hodinový cron; Bára 24. 11. 2026: jen limit, žádný Turnstile),
  e-mail přes `send_email` (vazba `MAIL` ve `wrangler.toml`; zapnuto 27. 11. 2026: Email Routing pro streetspace.eu,
  tajné `CONTACT_FROM=profily@streetspace.eu` a `CONTACT_TO` – Bářina adresa, ne v kódu); nasazení v `logging/README.md`.
  Bez `LOG_URL` „zatím nejde“. 

## Záznam řezů

Po každém řezu a u několika akcí (export, uložení, sdílení, Návrh, Porovnání, oprava dat, hledání) pošle
`public/log.js` krátkou zprávu přes `navigator.sendBeacon` do Cloudflare Workeru s databází D1 (`logging/`, návod
v `logging/README.md`). Řez se ukládá přesně (střed, azimut, dosah, město, ulice, typ ulice, čas), bez IP adres
a cookies. Dál úpravy (jak návštěvník opravil data a co navrhl, zkrácené profily) a hlášení chyb: tlačítko
„Nahlásit chybu“ ve Stavu a v menu Soubor pošle kategorie, text návštěvníka, řez a profil a počká na odpověď
Workeru (při chybě text v okně zůstane). Adresa Workeru je v proměnné repozitáře `LOG_URL`; bez ní (i lokálně) se
nic neposílá a tlačítko hlášení se neukáže. Krátké upozornění je v patičce aplikace.
