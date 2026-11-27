# Slepé posouzení příčných profilů po kliknutí do mapy

Uživatel kliknul na ulici v mapě a aplikace mu sestavila příčný profil. Dvě varianty (X, Y) mohly ulici říznout na jiném
místě. U každého čísla `<n>` ve složce:
- `<n>-K.jpg`: ortofoto místa kliknutí (klik je uprostřed obrázku na žluté čárkované čáře), ulice svisle;
- `<n>-X.jpg`, `<n>-Y.jpg`: ortofoto místa řezu dané varianty (řez je žlutá čárkovaná vodorovná čára, A vlevo, B vpravo,
  10 px = 1 m, značky po 1 m, delší po 5 m);
- fotky z ulice u kliknutí `<n>-f.jpg` (dívá se nahoru v ortofotu K) a `<n>-b.jpg` (opačně), pokud jsou; fotka může být
  starší nebo odjinud, pak platí ortofoto.
Profily jdou od A do B (díly, šířky v m). Nevíš a nezjišťuj, odkud jsou; čti jen soubory té složky.

Která varianta dá uživateli lepší profil ulice, na kterou kliknul? Nejdřív složení (pořadí dílů, počet jízdních pruhů),
potom šířky; profil má odpovídat svému ortofotu a popisovat běžný průřez té ulice v okolí kliknutí. Prohlédni všechny obrázky
každého čísla. Odpověz `X`, `Y`, `stejne`, nebo `nejde`, když podklady nestačí. Výstup jeden JSON řádek na číslo do souboru,
který je v zadání: `{"n": 1, "verdict": "X", "jistota": "vysoka|stredni|nizka", "why": "krátce česky"}`
