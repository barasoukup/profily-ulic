# Obruby vozovky: jen ortofoto proti AI, po městech (19. 11. 2026)

Aplikace po opravách pravidel z 18.–19. 11. (`?pasport=0&hrany=0&aachen=0`, balíky OSM z disku), bez a s `?ai=1`,
proti mapě povrchů města (pasport, mapa Cách) a v Brně proti MTVU (regrese, ortofoto ČÚZK a Brno 2025).
Praha a Vídeň, Berlín, Hamburk chybí: na nich se model učil.

| Město | řezů | obruby do 0,5 m | do 1 m | medián chyby |
|---|---|---|---|---|
| Brno (ČÚZK 12,5 cm) | 89 | 41 % → 47 % | 62 % → 74 % | 0,69 → 0,51 m |
| Brno (Brno 2025, 10 cm) | 89 | 45 % → 49 % | 63 % → 75 % | 0,58 → 0,50 m |
| Prešov | 12 | 29 % → 54 % | 62 % → 79 % | 0,90 → 0,45 m |
| Cáchy | 11 | 18 % → 50 % | 36 % → 64 % | 1,40 → 0,50 m |
| Žilina | 13 | 35 % → 35 % | 54 % → 58 % | 0,90 → 0,70 m |
| Bratislava | 7 | 14 % → 21 % | 36 % → 43 % | 1,25 → 1,25 m |
| Slovensko a Cáchy celkem | 43 | 26 % → 42 % | 49 % → 63 % | 1,05 → 0,65 m |

Chodník (strany s fasádou v pravdě): Slovensko a Cáchy 50 % → 50 % do 1 m (jen 10 stran); Brno ČÚZK medián 1,05 → 1,25 m,
Brno 2025 2,60 → 1,30 m. Sběry: `evaluation/universal/data/target-orto-1911.json`, `target-ai-1911.json`.

## Oponentura (19. 11. 2026) a opravy výkladu
- **AI nezlepší každý řez:** Slovensko a Cáchy lépe 22, hůř 14 ze 43 řezů; průměr do 0,5 m +16 p. b., interval
  z bootstrapu [+5, +28]. Města s 7–13 řezy jsou bez intervalu jen orientační (Bratislava hůř na 3 ze 7).
- **Brno ani cílová oblast nejsou nezávislý test:** Brno bylo testovací sada při učení (train.py `--test brno,hamburg`),
  map5-3 je nejlepší ze seedů na Brně i na cílové oblasti (seedy 36–44 % do 0,5 m). Čísla jsou validační, asi o 5 p. b.
  nadsazená; nejhorší seed (36 %) je pořád nad odhadem (26 %).
- **Dva brněnské řádky s AI používají tytéž třídy modelu** spočtené z ortofota Brno 2025; řádek ČÚZK s AI míchá snímky.
- **Chodník Brno 2025 2,60 → 1,30 m** je jen důsledek posunuté obruby, AI chodník neurčuje.
- V cílové oblasti zůstalo 43 ze 120 bodů (pasport bez vozovky u osy vypadne), chodník jen na 10 stranách.
