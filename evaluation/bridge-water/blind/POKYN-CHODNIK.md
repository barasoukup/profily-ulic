# Změř krajní chodníky

U každého čísla: `<n>-ortho.jpg` (ortofoto, ulice svisle, řez je žlutá čárkovaná vodorovná čára, strana A vlevo, B vpravo,
10 px = 1 m, značky po 1 m, delší po 5 m), fotky z ulice `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg`
(opačně, A vpravo), pokud jsou; fotka může být starší nebo odjinud, pak platí ortofoto.

Na řezu urči krajní chodník na straně A a na straně B: první pochozí plochu pro chodce od okraje ulice směrem k vozovce
(chodník, i společný s cyklisty), kterou řez protíná. Změř jeho šířku podél řezu v metrech na desetiny (od vnějšího okraje,
zábradlí nebo fasády po obrubu nebo jiný povrch). Když na té straně chodník není, napiš `0`; když to podklady nedovolí,
`null`. Okolí ulice (voda, zeleň, svahy) neměř.

Výstup jeden JSON řádek na číslo:
`{"n": 1, "A": 2.4, "B": 0, "jistota": "vysoka|stredni|nizka", "why": "krátce česky"}`
