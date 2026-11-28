# Export

Export do Streetmixu a další výstupy.

## Tlačítko Do Streetmixu (dříve CLAUDE.md)

- Tlačítko „Do Streetmixu“ je vyndané (Bára 8. 11. 2026), protože na Pages nefunguje (API Streetmixu
  nemá CORS). Převod `streetmix.js` zůstává s testy. Dotaz:
  https://github.com/streetmix/streetmix/issues/3828. Proxy přes Cloudflare je odložená do odpovědi.

## Export do Streetmixu

Převod profilu na ulici Streetmixu (schéma 35, metrické jednotky) je v `public/streetmix.js` a má testy. Tlačítko
v aplikaci není: API Streetmixu nemá CORS, takže ze statického webu nefunguje.
