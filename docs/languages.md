# Jazyky

Jazyky rozhraní, překlady, názvy aplikace v jazycích (pravidla o jazycích jsou v `CLAUDE.md`).

## Jazyky (Bára 12. 11. 2026, slovenčina 15. 11. 2026, němčina 16. 11. 2026)

- Anglicky se aplikace jmenuje **Street Profile**, slovensky **Profily ulíc**, německy **Straßenprofil**. Čeština, slovenčina,
  angličtina a němčina: `app/public/i18n.js`, od 17. 11. 2026 přepínač v menu Soubor (jazyky jménem, bez vlajek), `?lang=sk`. Jazyk podle
  prohlížeče (první z jeho jazyků, který aplikace umí; všichni ostatní angličtina), ne podle místa řezu (Bára). Popis v `docs/languages.md`.
- **Pojmenované klíče** (Bára 27. 11. 2026, varianta A návrhu `docs/i18n-simplify.md` ve větvi i18n-plan): `t("common.sidewalk")`, klíč anglicky
  `oblast.jméno` (oblast podle místa: `app`, `types`, `country.at`, `common`, `note`, `page`…), jeden plochý JSON na jazyk
  `app/public/locales/<jazyk>.json` (formát pro Weblate/Crowdin), čeština je `cs.json` (zdroj textů), texty měst
  `city.<id>.<pole>`, patička `html.footer`; `index.html` má `data-t="klíč"` a `data-t-<atribut>`.  Pro rodilé mluvčí `tools/i18n_export.mjs <jazyk>` (CSV klíč | cs | en |
  jazyk) a `i18n_import.mjs <jazyk> <soubor>`.  Staré uložené řezy s českou poznámkou a česky zapamatovaná podkladová mapa: `locales/legacy-cs-keys.json`.
- Všech 24 úředních jazyků EU (větev `eu-languages`, Bára 17. 11. 2026, nenasazené): soubor na jazyk, načítá
  se jen jazyk stránky.  Kritik Fable (jako rodilý
  mluvčí) prošel všech 20 nových jazyků, hodnocení 3,5–4,5 z 5 (maltština nejhůř).  Přepínač je v menu Soubor jako „Jazyk“, jazyky jménem bez vlajek. Desetinná
  tečka jen en, ga, mt. Název aplikace: bg Уличен профил, da Gadeprofil, el Διατομή Οδού, es Secciones de calle,
  et Tänavaprofiil, fi Katuprofiili, fr Profil de rue, ga Próifíl Sráide, hr Profili ulica, hu Utcaprofil, it Sezioni
  stradali, lt Gatvės profilis, lv Ielu profils, mt Profil tat-Triq, nl Straatprofiel, pl Przekroje ulic, pt Perfis de Rua,
  ro Profil stradal, sl Profili ulic, sv Gatusektion.
- Němčina (větev `nemcina`, 16. 11. 2026): Bestand / Planung / Vergleich, Gehweg, Fahrstreifen, Radfahrstreifen, Schutzstreifen,
  Parkstreifen, Fahrbahn, Querschnitt, „Sie“; desetinná čárka jako česky. Jazyk ≠ stát: německé rozhraní v Praze ukazuje české
  značky a normy, německé značky ani data z Německa nejsou. Překlad by měl projít rodilý mluvčí.

## Jazyky

Aplikace mluví všemi 24 úředními jazyky EU (Bára 12. 11. 2026 čeština a angličtina, slovenština 15. 11., němčina
16. 11., ostatní 17. 11. 2026). Jazyk určí `?lang=fr` v adrese, jinak poslední volba návštěvníka (položka „Jazyk“ v menu
Soubor, pamatuje se v prohlížeči), jinak první z jazyků prohlížeče, který aplikace umí; ostatní dostanou angličtinu.
Přepnutí stránku znovu načte, řez i návrh zůstanou. Anglicky se aplikace jmenuje **Street Profile**, německy
**Straßenprofil**, slovensky **Profily ulíc**; ostatní názvy v `CLAUDE.md` (oddíl Jazyky).

Jazyk není stát (kódy ISO: jazyk `de`, stát `DE`): značky, normy, zdroje dat a ilustrace se řídí státem řezu
(`city.country`, CZ/SK/AT/DE), jazyk mění jen slova. Německé rozhraní na řezu v Praze ukazuje české značky s českými
čísly a česká pravidla, na řezu v Bratislavě slovenská, v Berlíně německé (StVO).

- `i18n.js`: `t("klíč", { jméno })` vrátí text jazyka stránky (`{jméno}` se doplní); klíč, který jazyk nezná (text
  z dat, jméno), vrátí, jak je. Jazyků je 24 (všechny úřední jazyky EU, `LANGS`, každý pojmenovaný sám sebou); načte
  se jen `locales/<jazyk>.json` jazyka stránky (fetch v top-level await, v Node ze souboru), čeština když se nenačte.
  `num()` píše desetinnou čárku, tečku jen anglicky, irsky a maltsky; `pct()` „44 %“ s mezerou, bez mezery („44%“)
  en, ga, mt, nl, pl, it, pt, ro, el, bg, hu, lv. `translatePage()` přeloží `index.html` podle klíčů: `data-t="klíč"`
  (text prvku), `data-t-title`, `data-t-aria-label`, `data-t-placeholder`, `data-t-alt`, `data-t-content`,
  `data-t-data-label` (atributy), `data-t-html="html.footer"` (patička s odkazy). `index.html` má dál češtinu (bez
  JavaScriptu a pro náhledy odkazů), test hlídá, že je stejná jako v `cs.json`.
  `errors.js` (běží před moduly) má svých pár hlášek ve všech jazycích (tabulka `TEXTS`).
- Přepínač je poslední položka menu Soubor („Jazyk“, Bára 17. 11. 2026): seznam jazyků jejich vlastními jmény, bez
  vlajek (jazyk není stát). Jazyk se jinak řídí prohlížečem (první z `navigator.languages`, který aplikace umí, jinak
  angličtina); ruční volba se pamatuje v localStorage, `?lang=fr` platí dál.
- `locales/<jazyk>.json` (Bára 27. 11. 2026, dřív `<jazyk>.js` s českou větou jako klíčem): plochý JSON `"klíč": "text"`,
  formát, který čtou nástroje překladatelů (Weblate, Crowdin); čeština je jazyk jako ostatní (`cs.json`, zdroj textů).
  Klíč je anglicky `oblast.jméno`: oblast podle místa (`app`, `profile`, `types`, `signs`, `rules`, `sources`, `credits`,
  `layers`, `search`, `about`, `country.<iso>`, `town.<město>`, `page` pro `index.html`, `common` pro text více souborů,
  `note` pro poznámku za názvem ulice), jméno podle obsahu (`note.mapDown`, `common.sidewalk`). Dále `city.<id>.<pole>`
  (texty měst a států: `server`, `dataName`, `dataShort`, `techMap`, `parkingSource`, `rulesHead`, `credit`; město bez
  vlastních bere státu, `like`), `html.footer`, `attribution.*` (slova kreditů mapových vrstev, které jsou v kódu česky;
  česká slova a pořadí v `i18n.js` `ATTRIBUTION`). Texty měst jsou ve tvarech, jak je věty potřebují (německy server
  a data v genitivu: „Der Server der Stadt Brno…“). Německé názvosloví: Bestand / Planung / Vergleich, Gehweg,
  Fahrstreifen, Radfahrstreifen, Schutzstreifen, Parkstreifen, Fahrbahn, Bordstein, Querschnitt; vyká („Sie“); český
  kraj je „Region“, okres „Bezirk“.
- Uložené řezy a prohlížeč si před 27. 11. 2026 pamatovaly české věty: poznámku za názvem ulice (`cut.note` v souboru,
  odkazu `#rez=`, localStorage) a jméno podkladové mapy. `locales/legacy-cs-keys.json` (zmrazené, nic nového) je
  převede na klíč, `t()` se tam podívá, když klíč nezná. Nové řezy ukládají klíč.
- Kromě češtiny, slovenštiny, angličtiny a němčiny jsou překlady strojové (17. 11. 2026, agent na jazyk z češtiny,
  pak kritik Fable jako rodilý mluvčí); měl by je projít rodilý mluvčí. Nejisté bývá: ochranný cyklopruh (většina
  zemí ho nemá), sdílená zóna, hospodaření s vodou.
- Nový text v kódu: `t("oblast.jméno")` (v `app.js`, `profile.js` a `maplayers.js` se funkce jmenuje `tr`) a
  `node tools/i18n_add.mjs oblast.jméno "česky" "anglicky" [--de "německy"]`: přidá klíč do všech 24 souborů, ostatní
  jazyky dostanou zatím angličtinu a klíč jde na seznam k překladu `locales/_todo.json`. Změna textu: totéž s
  `--change`. Text, který teče proměnnou (kredit, poznámka řezu), se označí `mark("klíč")`; `t(proměnná)` je povolené jen
  na vyjmenovaných místech (`tests/i18n.test.js` `VARIABLE`).
- Pro rodilého mluvčího: `node tools/i18n_export.mjs pl [pl.csv] [--todo]` napíše tabulku klíč | cs | en | pl | todo (CSV
  pro Numbers, Excel, LibreOffice), opravenou vrátí `node tools/i18n_import.mjs pl pl.csv` (kontroluje klíče a `{jména}`).
- `tests/i18n.test.js` hlídá, že každý klíč z kódu a stránky je ve všech 24 jazycích, žádný klíč není navíc, `{jména}`
  jsou ve všech jazycích stejná, soubory jsou platný plochý JSON, čeština `index.html` je ta z `cs.json`, překlady nemají
  češtinu a že žádný modul kromě `i18n.js` nerozhoduje podle jazyka; `tests/i18n-en.test.js` a `tests/i18n-de.test.js`
  pouštějí moduly anglicky a německy.
- Česky zůstávají vlastní jména (ČÚZK, RÚIAN, IPR, úřady měst, kraje), čísla značek a text na dodatkové tabulce E 13
  (je to česká značka), hodnoty v záznamu řezů a hlášení chyb.
