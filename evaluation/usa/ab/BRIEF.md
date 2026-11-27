# Pokyn pro posuzovatele A/B (naslepo)

Dostaneš dvojice příčných profilů ulice X a Y (od strany A vlevo ke straně B vpravo, šířky v metrech) a podklady:
ortofoto napříč ulicí (`*-ortho.jpg`: ulice vede svisle, řez je žlutá čárkovaná vodorovná čára uprostřed, A vlevo, B vpravo,
10 px = 1 m, nahoře a dole metrové značky po 1 m, delší po 5 m) a fotky z ulice z Mapillary (`-f.jpg` pohled ve směru
ulice, `-b.jpg` opačně; fotky mohou být pár let staré nebo trochu vedle). Nevíš a nemáš zjišťovat, odkud který profil je.

Typy dílů: chodnik (chodník), zelen (tráva, pás zeleně), stromorad (stromořadí), parkovani (stání), pruh (jízdní pruh),
krajnice (okraj vozovky), cyklopruh, cyklostezka, delici (dělicí pás), plocha (jiná zpevněná plocha), nezname, předzahrádka
a další.

Pro každou dvojici rozhodni, který profil lépe odpovídá skutečnosti **v řezu** (hlavně složení: jaké díly a v jakém pořadí,
pak přibližné šířky):
- `X` lépe, `Y` lépe, `stejne` (oba stejně dobré nebo stejně špatné), `nejasne` (podklady nestačí).

**Pozor na úzké pásy trávy mezi chodníkem a obrubou** (v USA velmi časté, 1–3 m, často se stromy): na ortofotu jsou to
zelené nebo hnědé pásy podél vozovky, na fotce tráva mezi chodníkem a zaparkovanými auty. Počítej je jako díl `zelen`,
i když jsou úzké; profil, který je má tam, kde opravdu jsou, je v tom lepší. Naopak jamky stromů v dlážděném (cihlovém)
chodníku nejsou pás zeleně: tam je správně chodník.

Stání: počítej s ním, kde jsou u obruby zaparkovaná auta (na ortofotu nebo na fotce) nebo zjevně vyhrazený pruh stání.
Počet pruhů podle značení a provozu (neznačená obytná ulice se stáním po obou stranách má většinou jeden průjezdný pruh,
obousměrný: posuzuj, zda dva úzké pruhy nebo jeden odpovídají tomu, co vidíš, a když to nejde poznat, neber to jako rozdíl).

Výstup: jeden řádek JSON na dvojici, do souboru, který dostaneš:
`{"id": "...", "verdict": "X" | "Y" | "stejne" | "nejasne", "why": "krátce, česky"}`.
Prohlédni vždy ortofoto a aspoň jednu fotku (Read). Bez ortofota dej `nejasne`.
