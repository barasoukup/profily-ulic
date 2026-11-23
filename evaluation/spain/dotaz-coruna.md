# Dotaz na město A Coruña: licence mapy povrchů ulic (koncept, 23. 11. 2026)

Komu: Ayuntamiento de A Coruña, Servizo de Información Territorial (SIT) / IDE da Coruña (ide.coruna.gal). Adresu na
SIT najít na stránce ide.coruna.gal (kontakt), dopis posílá Bára ze své adresy.

Česky pro kontrolu: Ptám se, jestli smíme v otevřené webové aplikaci Profily ulic (příčné profily ulic, MIT, bez
reklamy) číst při kliknutí plochy vozovek, chodníků, cyklostezek a stání ze služby `Intranet/INFRA_BTUC_VIARIO`
a pod jakou licencí a s jakým uvedením zdroje. A jestli je pro tyto účely jiná, veřejná služba nebo novější data než
z roku 2014.

---

**Asunto:** Licencia de uso de la cartografía viaria (INFRA_BTUC_VIARIO) en una aplicación web abierta

Estimados/as señores/as:

Desarrollo «Street Profile / Profily ulic», una aplicación web gratuita y de código abierto (licencia MIT, sin
publicidad) que dibuja secciones transversales de calles de fachada a fachada: al hacer clic en una calle, la aplicación
compone el perfil (aceras, calzada, carriles bici, aparcamiento) a partir de datos abiertos y permite editarlo y
exportarlo como imagen. Funciona con los datos abiertos de Praga y de otras ciudades checas y eslovacas, y estamos
preparando su ampliación a otros países europeos, entre ellos España.

Hemos visto que el servicio ArcGIS del Ayuntamiento
`https://ide.coruna.gal/server/rest/services/Intranet/INFRA_BTUC_VIARIO/MapServer` contiene las superficies de aceras,
calzadas, carriles bici y aparcamiento a escala 1:500. Nos gustaría utilizarlo de la siguiente forma: la aplicación
consultaría únicamente las superficies de un rectángulo de unos 100 m alrededor de la calle en la que hace clic el
usuario (una consulta por clic, sin descargas masivas) y citaría la fuente como «© Ayuntamiento de A Coruña (SIT)».

Antes de hacerlo, querríamos preguntarles:

1. ¿Podemos utilizar estos datos de esta manera? ¿Bajo qué licencia (por ejemplo, CC BY 4.0) y con qué atribución?
2. Puesto que el servicio se encuentra en la carpeta «Intranet», ¿existe otro servicio público o un conjunto de datos
   abiertos equivalente que debamos utilizar en su lugar?
3. ¿Hay una versión más reciente que la «Actualización 2014» que figura en los datos?

Muchas gracias por su atención. Quedamos a su disposición para cualquier aclaración.

Atentamente,

Bára Soukupová
Street Profile / Profily ulic — https://streetspace.eu/profily/
