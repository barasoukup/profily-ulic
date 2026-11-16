# A/B: mapa povrchů Vídně (FMZK), 16. 11. 2026

**Vzorek:** 40 náhodných bodů do 2 km od Stephansplatz (`sample.mjs`, pevné semínko), každý řez dvakrát hned po sobě:
A = `?wien=0` (odhad z ortofota basemap.at a OSM), B = s Flächen-Mehrzweckkarte. Obrázky 12 řezů nad ortofotem
basemap.at v `images/` (nahoře A modře, dole B červeně), data ve `vysledky/wien.json`.

**Výsledek:** změnilo se všech 40.
- Hlavní rozdíl: FMZK dává **podélné stání po obou stranách** (ve Vídni téměř všude, na ortofotu jsou auta) a
  **chodníky skutečných 2–3 m**. Odhad dával 4–6 m chodníku a žádné stání.
- Na 12 prohlédnutých řezech je lépe s FMZK 9 (Strohgasse, Walfischgasse, Theresianumgasse, Friedrich-Schmidt-Platz,
  Große Pfarrgasse, Glockengasse, Obere Augartenstraße s druhou vozovkou, Landstraßer Hauptstraße, Rathausplatz),
  zhruba stejně 2 (Zelinkagasse, Burggasse), sporný 1 (cesta v parku jako cyklostezka 10 m: třída 25 „Gehweg, Radweg“).
- Bez FMZK skončilo 7 řezů na nepojmenovaných cestách jen se dvěma pruhy po 3 m; s FMZK mají plochy.

**Rozhodnutí:** FMZK zapnutá (`?wien=0` vypne). Otevřené: třída 25 „Gehweg, Radweg“ (dnes cyklostezka, na parkové
cestě sporné), velké „Befestigte Fläche“ na náměstích jako zpevněná plocha.
