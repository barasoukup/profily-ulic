# Pravidla psaní kódu

Platí pro každého, kdo do Profilů ulic píše kód (i pro agenty). Pravidla o délce a pojmenování se týkají **nového a
přesouvaného kódu**; stávající se kvůli nim nepřepisuje (plán úklidu: `docs/code-health-plan.md`). Sloupec „Hlídá“ říká,
co pravidlo kontroluje: **ESLint** (`npm run lint`, jen chyby), **test** (`tests/architecture.test.js`), **recenzent**
(úsudek při čtení změny).

## Jak psát

| Pravidlo | Hlídá |
|---|---|
| Názvy popisují význam, ne typ nebo zkratku: `camelCase` funkce a proměnné, `PascalCase` třídy, `UPPER_SNAKE` konstanty modulu (Google/Airbnb). Funkce je sloveso (`deriveProfile`), logická hodnota otázka (`isHole`). | recenzent |
| Funkce dělá jednu věc a vejde se na obrazovku: doporučeno do 50 řádků, tvrdý strop 100 (nová delší se rozdělí). Víc než 4 argumenty = objekt s pojmenovanými poli. | test (strop 100, delší dnešní jen kratší) |
| Soubor do 1 000 řádků; jeden soubor = jedno téma, které se dá říct jednou větou. | test (strop 1 000, dnešní delší jen kratší) |
| Malé moduly s jasným rozhraním (Ousterhout): modul vystavuje málo, užitečného a složitost schová uvnitř; export, který nikdo nepoužívá, se nepíše. | test (žádný nepoužitý export), recenzent |
| Jedna věc na jednom místě: než napíšeš pomocníka, dohledej, jestli už není (`towns/`, `countries/`, `evaluation/lib/`); kopie se slučují, ne množí. | recenzent |
| Žádné cyklické importy, žádný import neexistujícího souboru. | `tools/check_imports.mjs` (součást `npm run check`) |
| Žádná nedefinovaná ani nepoužitá proměnná, nedosažitelný kód, duplicitní klíč. Nepoužitý argument nebo hodnotu v destrukturování označ `_`. | ESLint |
| Komentář říká **proč** (a kdo to rozhodl, např. „Bára 27. 11. 2026“), ne co kód dělá. | recenzent |
| Bez bundleru a TypeScriptu: moduly ES, které běží v prohlížeči i v Node tak, jak jsou. Nová závislost jen vývojová a jen s důvodem. | recenzent |
| Formát: `.editorconfig` (UTF-8, LF, 2 mezery). Nic se nepřeformátovává hromadně. | `.editorconfig` |

## Testy

Podle Test Desiderata (Kent Beck) a zásad Testing Library: testuj **chování**, co uživatel nebo volající vidí, ne
vnitřní podobu kódu.

- Rychlé (celá sada pod 10 s) a nezávislé (žádný test nespoléhá na pořadí ani na sítě; data z `tests/fixtures`).
- Selže jen při skutečné chybě: přejmenování nebo přesun uvnitř modulu žádný test nerozbije. Test, který hlídá jen
  vnitřní podobu (text zdroje, jména funkcí), je dluh; hlídací testy v `architecture.test.js` jsou výjimka, tvar kódu
  hlídat je jejich účel.
- Čitelný jako popis chování: název říká, co se stane za jakých podmínek; jedna věc na test.
- Oprava chyby začíná testem, který ji ukáže. Nový text pro uživatele hlídá `i18n.test.js`.

## Pravidla projektu

| Pravidlo | Hlídá |
|---|---|
| Názvy v kódu a souborech anglicky (nové identifikátory, id, soubory, složky: `austria`, `signs-AT`); stávající česká id v uložených řezech a logu se nepřejmenovávají. | recenzent |
| Text pro uživatele vždy přes `t("…")` a s překladem do všech 24 jazyků. | `tests/i18n.test.js` |
| Jazyk ≠ stát: jazyky malými (cs, sk, en), státy velkými ISO (CZ, SK, AT). Podmínka na stát jen v `pilot/public/countries/<ISO>.js`, jinde ne. | test (podmínky na stát, dnešní výjimky jen méně) |
| Sdílený kód bez výjimek pro jedno město nebo stát: oprava je obecná. Výjimka jen s měřením, že obecná oprava škodí; jinak se výjimka odstraní. | recenzent |
| Každá změna odhadu (ortofoto, OSM, odvození profilu) má vypínač `?off=…` a slepé A/B na malém vzorku dotčených řezů (najít bez prohlížeče, asi 20–40) plus kontrolní sadě (30–50), která se nesmí změnit. | recenzent |
| Změna `ortho-osm.js` projde regresí Praha/Brno: `node evaluation/ortofoto-osm/regrese.mjs`. | recenzent |
| Před commitem: `node tools/check_syntax.mjs && node tools/check_imports.mjs && node node_modules/eslint/bin/eslint.js && node --test tests/*.test.js` (`npm test` je totéž; na Bářině Macu s Node 26 `npm` a `npx` tiše končí kódem 194, spouštěj node přímo). | CI (`pages.yml`, job test) |
| Zprávy commitů anglicky, popisné: co se změnilo a proč, s datem Bářina rozhodnutí. Commit po logickém kroku. | recenzent |
| Nikdy nepushovat bez Bářina „nasaď“; push na `main` je nasazení. | recenzent |
| Tajemství (klíče, tokeny) jen v git-ignorovaných souborech (`config.local.js`) nebo tajných proměnných repozitáře, nikdy v kódu ani v commitu. | recenzent |

## Hlídací seznamy

`tests/architecture-allowed.js` obsahuje dnešní výjimky (podmínky na stát, nepoužité exporty, dlouhé soubory a funkce).
Seznam se **smí jen zkracovat**: když kód výjimku opraví, test řekne „stale“ a řádek se smaže nebo číslo sníží. Nový
řádek se nepřidává; přidat ho smí jen Bára.
