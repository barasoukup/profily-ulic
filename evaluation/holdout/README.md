# Kontrolní sada (zmrazená 19. 11. 2026)

Krok 1 a 2 plánu z `evaluation/ortofoto/LITERATURA-2.md`. Řezy, na které se **při ladění pravidel ani modelu
nedíváme**. Ladí se dál na starých sadách (regrese Prahy a Brna, `evaluation/ortofoto-osm/regrese.mjs`, cílová oblast
AI); sem se sahá jen při rozhodnutí, jestli změnu nasadit.

- `sample.json` (`sample.mjs`, pevné semínko): 612 bodů v Praze, Brně, Plzni (město nové pro všechno), Vídni,
  Berlíně, Hamburku, Cáchách, Bratislavě, Prešově a Žilině, v každém městě třetina hlavních ulic (trunk, primary,
  secondary), třetina tertiary, třetina místních; nikde blíž než 60 m k bodu, který jsme kdy použili (regrese, záchranná
  síť, AI). `aiTrained`: model obrub se na městě učil (Praha, Vídeň, Berlín, Hamburk), čísla AI tam nejsou test.
- Nahrávka: aplikace řeže každý bod přes nahrávač záchranné sítě (`evaluation/replay/server.mjs`, odpovědi zdrojů v
  `evaluation/replay/data/`, git je ignoruje), lehký záznam (`&light=1`: profil a plochy podél řezu). Režim `fill`
  vezme nahranou odpověď a živě se ptá jen na to, co chybí, takže služby měst (i IPR) se ptají jednou.
  - pravda: `?replay=fill&run=hold-map&sample=holdout&light=1&lang=cs&osm=balik` (mapy měst; řezy, kde mapa pod
    osou nic nemá a profil je odhad, se nepočítají),
  - odhad: totéž s `&mapa=0` (`run=hold-est`), bez AI `&mapa=0&ai=0` (`run=hold-est-noai`), další varianty přepínači
    (`&off=…`, `&auta=1`) a `replay=play` (nic se už neptá).
- Měření: `node evaluation/holdout/measure.mjs hold-map hold-est hold-est-noai` → `vysledky/<běhy>.md`: složení po
  metrech (stání jako vozovka, protože mapy ho většinou nemají), za obrubami, vnější obruby ulice, chodník u stran
  s domem; po městech; varianty párově s 95% intervalem z bootstrapu přes řezy a počtem lépe / hůř.

## Pravidla
1. Změnu pravidel nebo modelu nasadit, jen když na starých sadách vyhraje a tady se párově nezhorší (interval).
2. Každé měření tady zapsat do `vysledky/LOG.md` (co, kdy, kolikátá varianta): kolikrát se sem díváme, tolik je čísla
   potřeba brát s rezervou.
3. Sadu neměnit. Až se opotřebuje (mnoho rozhodnutí), vylosovat novou s jiným semínkem.
