# Které další státy (průzkum 22. 11. 2026)

Bára 22. 11. 2026: státy bez otevřeného ortofota odložit (Maďarsko). Rychlé ověření zbylých evropských států (agenti,
1–6 dotazů na stát, Origin streetspace.eu): národní ortofoto v EPSG:3857, CORS, klíč, licence; mapa povrchů hlavního
města jen zběžně (většina „neověřeno“). Tabulky po skupinách v tomto adresáři.

| Pořadí | Stát | Ortofoto | Mapa povrchů hlavního města | Doporučení |
|---|---|---|---|---|
| 1 | **Francie** | IGN Géoplateforme WMTS, CORS `*`, bez klíče (Licence Ouverte) | Paříž: Plan de voirie (vozovka, chodníky, ostrůvky) | **další na řadě** |
| 2 | **Španělsko** | IGN PNOA WMS, CORS `*`, bez klíče (CC BY 4.0) | Madrid nenalezeno | dobré |
| 3 | **Švédsko** | Lantmäteriet (ortofoto 0,5 m), odpověď s CORS | neověřeno | dobré, ověřit licenci a klíč |
| 4 | **Kypr** | DLS 2014, 10 cm, CORS, bez klíče | neověřeno | dobré (malý stát) |
| 5 | Finsko, Dánsko | otevřené, ale jen s bezplatným klíčem (klíč by byl v prohlížeči vidět) | Helsinky: registr veřejných ploch (vozovka, chodníky; CC BY 4.0) | jen s klíčem: rozhodne Bára |
| 6 | Itálie | národní ortofoto z roku 2008 přes http (na https stránce blokováno); regiony (Emilia-Romagna) nejisté | neověřeno | po regionech, později |
| 7 | Estonsko | jen v EPSG:3301 (potřebuje převod souřadnic v aplikaci) | neověřeno | nejisté |
| 8 | Slovinsko, Lotyšsko, Litva, Norsko, Island, Portugalsko | služby neodpověděly nebo jiný formát | neověřeno | zkusit znovu |
| — | Chorvatsko, Malta | bez CORS / bez EPSG:3857 (jen přes proxy) | — | odložit |
| — | Spojené království, Irsko, Řecko, Srbsko, Černá Hora, Severní Makedonie, Monako, San Marino | placené nebo bez veřejné služby | — | odložit |
| — | Rumunsko, Bulharsko, Bosna, Kosovo, Albánie, Andorra | nedostupné, omezený přístup, nebo jen jiné souřadnice | — | odložit, zkusit později |
| — | Maďarsko | placené, služba kreslí prázdné dlaždice | — | odloženo (větev `hungary`) |
