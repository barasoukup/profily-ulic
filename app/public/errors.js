// Loaded before everything else as a plain script, so it also works where the app's modules fail
// (an old browser, a failed download): instead of a blank page the visitor gets a short message.
// eslint-disable-next-line no-unused-vars -- not used by the script: tests/i18n.test.js reads the list from the text
var LANGS = "bg cs da de et el en es fr ga hr it lv lt hu mt nl pl pt ro sk sl fi sv";
// The messages in every language of the app (i18n.js LANGS), Czech, Slovak, English and German as in the app, the others machine translations.
var PROFILY_ERROR_TEXTS = {
  bg: { start: "Приложението не можа да се стартира. Опитайте да заредите страницата отново или използвайте по-нов браузър.", again: "Нещо се обърка. Опитайте отново или заредете страницата отново.",
    reload: "Нещо се обърка. Опитайте да заредите страницата отново.", old: "Този браузър е твърде стар за „Уличен профил“. Моля, отворете приложението в актуална версия на Chrome, Firefox, Safari или Edge.",
    stale: "Приложението е обновено. Заредете страницата отново.", button: "Зареждане" },
  cs: { start: "Aplikaci se nepodařilo spustit. Zkuste stránku načíst znovu, případně v novějším prohlížeči.", again: "Něco se nepovedlo. Zkuste akci zopakovat, případně stránku načíst znovu.",
    reload: "Něco se nepovedlo. Zkuste stránku načíst znovu.", old: "Tento prohlížeč je na Profily ulic příliš starý. Otevřete je prosím v aktuálním Chrome, Firefoxu, Safari nebo Edge.",
    stale: "Aplikace se aktualizovala, načtěte stránku znovu.", button: "Načíst znovu" },
  da: { start: "Appen kunne ikke starte. Prøv at genindlæse siden, eller brug en nyere browser.", again: "Noget gik galt. Prøv igen, eller genindlæs siden.",
    reload: "Noget gik galt. Prøv at genindlæse siden.", old: "Denne browser er for gammel til Gadeprofil. Åbn den i en aktuel version af Chrome, Firefox, Safari eller Edge.",
    stale: "Appen er blevet opdateret. Genindlæs siden.", button: "Genindlæs" },
  de: { start: "Die App konnte nicht starten. Laden Sie die Seite neu oder verwenden Sie einen neueren Browser.", again: "Etwas ist schiefgegangen. Versuchen Sie es erneut oder laden Sie die Seite neu.",
    reload: "Etwas ist schiefgegangen. Laden Sie die Seite neu.", old: "Dieser Browser ist für Straßenprofil zu alt. Bitte öffnen Sie es in einer aktuellen Version von Chrome, Firefox, Safari oder Edge.",
    stale: "Die App wurde aktualisiert. Laden Sie die Seite neu.", button: "Neu laden" },
  et: { start: "Rakendust ei õnnestunud käivitada. Proovige lehte uuesti laadida või kasutage uuemat brauserit.", again: "Midagi läks valesti. Proovige uuesti või laadige leht uuesti.",
    reload: "Midagi läks valesti. Proovige lehte uuesti laadida.", old: "See brauser on Tänavaprofiili jaoks liiga vana. Palun avage see Chrome'i, Firefoxi, Safari või Edge'i uusimas versioonis.",
    stale: "Rakendust on uuendatud. Laadige leht uuesti.", button: "Laadi uuesti" },
  el: { start: "Δεν ήταν δυνατή η εκκίνηση της εφαρμογής. Δοκιμάστε να φορτώσετε ξανά τη σελίδα ή χρησιμοποιήστε νεότερο πρόγραμμα περιήγησης.", again: "Κάτι πήγε στραβά. Δοκιμάστε ξανά ή φορτώστε ξανά τη σελίδα.",
    reload: "Κάτι πήγε στραβά. Δοκιμάστε να φορτώσετε ξανά τη σελίδα.", old: "Αυτό το πρόγραμμα περιήγησης είναι πολύ παλιό για τη Διατομή Οδού. Ανοίξτε την σε τρέχουσα έκδοση του Chrome, του Firefox, του Safari ή του Edge.",
    stale: "Η εφαρμογή ενημερώθηκε. Φορτώστε ξανά τη σελίδα.", button: "Επαναφόρτωση" },
  en: { start: "The app could not start. Try reloading the page, or use a newer browser.", again: "Something went wrong. Try again, or reload the page.",
    reload: "Something went wrong. Try reloading the page.", old: "This browser is too old for Street Profile. Please open it in a current version of Chrome, Firefox, Safari or Edge.",
    stale: "The app has been updated. Please reload the page.", button: "Reload" },
  es: { start: "No se ha podido iniciar la aplicación. Vuelva a cargar la página o utilice un navegador más reciente.", again: "Algo ha fallado. Inténtelo de nuevo o vuelva a cargar la página.",
    reload: "Algo ha fallado. Vuelva a cargar la página.", old: "Este navegador es demasiado antiguo para Secciones de calle. Abra la aplicación en una versión actual de Chrome, Firefox, Safari o Edge.",
    stale: "La aplicación se ha actualizado. Vuelva a cargar la página.", button: "Recargar" },
  fr: { start: "L'application n'a pas pu démarrer. Rechargez la page ou utilisez un navigateur plus récent.", again: "Une erreur s'est produite. Réessayez ou rechargez la page.",
    reload: "Une erreur s'est produite. Essayez de recharger la page.", old: "Ce navigateur est trop ancien pour Profil de rue. Veuillez l'ouvrir dans une version récente de Chrome, Firefox, Safari ou Edge.",
    stale: "L'application a été mise à jour. Rechargez la page.", button: "Recharger" },
  ga: { start: "Níorbh fhéidir an aip a thosú. Athlódáil an leathanach, nó úsáid brabhsálaí níos nuaí.", again: "Chuaigh rud éigin amú. Bain triail eile as, nó athlódáil an leathanach.",
    reload: "Chuaigh rud éigin amú. Athlódáil an leathanach.", old: "Tá an brabhsálaí seo rósheanda do Próifíl Sráide. Oscail é i leagan reatha de Chrome, Firefox, Safari nó Edge, le do thoil.",
    stale: "Nuashonraíodh an aip. Athlódáil an leathanach.", button: "Athlódáil" },
  hr: { start: "Aplikacija se nije mogla pokrenuti. Pokušajte ponovno učitati stranicu ili upotrijebite noviji preglednik.", again: "Nešto nije u redu. Pokušajte ponovno ili ponovno učitajte stranicu.",
    reload: "Nešto nije u redu. Pokušajte ponovno učitati stranicu.", old: "Ovaj je preglednik prestar za Profile ulica. Otvorite ih u aktualnoj inačici preglednika Chrome, Firefox, Safari ili Edge.",
    stale: "Aplikacija je ažurirana. Ponovno učitajte stranicu.", button: "Učitaj ponovno" },
  it: { start: "Non è stato possibile avviare l'app. Provi a ricaricare la pagina o a usare un browser più recente.", again: "Qualcosa non ha funzionato. Riprovi o ricarichi la pagina.",
    reload: "Qualcosa non ha funzionato. Provi a ricaricare la pagina.", old: "Questo browser è troppo vecchio per Sezioni stradali. Apra l'app in una versione aggiornata di Chrome, Firefox, Safari o Edge.",
    stale: "L'app è stata aggiornata. Ricarichi la pagina.", button: "Ricarica" },
  lv: { start: "Lietotni neizdevās palaist. Mēģiniet lapu ielādēt vēlreiz vai izmantojiet jaunāku pārlūkprogrammu.", again: "Kaut kas nogāja greizi. Mēģiniet vēlreiz vai ielādējiet lapu no jauna.",
    reload: "Kaut kas nogāja greizi. Mēģiniet lapu ielādēt vēlreiz.", old: "Šī pārlūkprogramma ir pārāk veca lietotnei Ielu profils. Lūdzu, atveriet to jaunākajā Chrome, Firefox, Safari vai Edge versijā.",
    stale: "Lietotne ir atjaunināta. Ielādējiet lapu vēlreiz.", button: "Ielādēt vēlreiz" },
  lt: { start: "Programėlės paleisti nepavyko. Pabandykite įkelti puslapį iš naujo arba naudokite naujesnę naršyklę.", again: "Kažkas nepavyko. Pabandykite dar kartą arba įkelkite puslapį iš naujo.",
    reload: "Kažkas nepavyko. Pabandykite įkelti puslapį iš naujo.", old: "Ši naršyklė per sena programėlei „Gatvės profilis“. Atidarykite ją naujausios versijos Chrome, Firefox, Safari arba Edge naršyklėje.",
    stale: "Programėlė atnaujinta. Įkelkite puslapį iš naujo.", button: "Įkelti iš naujo" },
  hu: { start: "Az alkalmazást nem sikerült elindítani. Próbálja újratölteni az oldalt, vagy használjon újabb böngészőt.", again: "Valami hiba történt. Próbálja újra, vagy töltse újra az oldalt.",
    reload: "Valami hiba történt. Próbálja újratölteni az oldalt.", old: "Ez a böngésző túl régi az Utcaprofil használatához. Kérjük, nyissa meg a Chrome, a Firefox, a Safari vagy az Edge egy friss verziójában.",
    stale: "Az alkalmazás frissült. Töltse újra az oldalt.", button: "Újratöltés" },
  mt: { start: "L-applikazzjoni ma setgħetx tibda. Erġa' għabbi l-paġna, jew uża browser aktar ġdid.", again: "Xi ħaġa marret ħażin. Erġa' pprova, jew erġa' għabbi l-paġna.",
    reload: "Xi ħaġa marret ħażin. Erġa' għabbi l-paġna.", old: "Dan il-browser huwa qadim wisq għal Profil tat-Triq. Jekk jogħġbok iftaħha f'verżjoni attwali ta' Chrome, Firefox, Safari jew Edge.",
    stale: "L-applikazzjoni ġiet aġġornata. Erġa' għabbi l-paġna.", button: "Erġa' għabbi" },
  nl: { start: "De app kon niet starten. Laad de pagina opnieuw of gebruik een nieuwere browser.", again: "Er is iets misgegaan. Probeer het opnieuw of laad de pagina opnieuw.",
    reload: "Er is iets misgegaan. Laad de pagina opnieuw.", old: "Deze browser is te oud voor Straatprofiel. Open de app in een actuele versie van Chrome, Firefox, Safari of Edge.",
    stale: "De app is bijgewerkt. Laad de pagina opnieuw.", button: "Opnieuw laden" },
  pl: { start: "Nie udało się uruchomić aplikacji. Proszę wczytać stronę ponownie lub użyć nowszej przeglądarki.", again: "Coś poszło nie tak. Proszę spróbować ponownie lub wczytać stronę od nowa.",
    reload: "Coś poszło nie tak. Proszę wczytać stronę ponownie.", old: "Ta przeglądarka jest zbyt stara dla aplikacji Przekroje ulic. Proszę otworzyć ją w aktualnej wersji Chrome, Firefoksa, Safari lub Edge.",
    stale: "Aplikacja została zaktualizowana. Proszę wczytać stronę ponownie.", button: "Wczytaj ponownie" },
  pt: { start: "Não foi possível iniciar a aplicação. Tente recarregar a página ou utilize um navegador mais recente.", again: "Algo correu mal. Tente novamente ou recarregue a página.",
    reload: "Algo correu mal. Tente recarregar a página.", old: "Este navegador é demasiado antigo para a aplicação Perfis de Rua. Abra-o numa versão atual do Chrome, Firefox, Safari ou Edge.",
    stale: "A aplicação foi atualizada. Recarregue a página.", button: "Recarregar" },
  ro: { start: "Aplicația nu a putut porni. Reîncărcați pagina sau folosiți un browser mai nou.", again: "Ceva nu a mers. Încercați din nou sau reîncărcați pagina.",
    reload: "Ceva nu a mers. Încercați să reîncărcați pagina.", old: "Acest browser este prea vechi pentru Profil stradal. Deschideți aplicația într-o versiune actuală de Chrome, Firefox, Safari sau Edge.",
    stale: "Aplicația a fost actualizată. Reîncărcați pagina.", button: "Reîncarcă" },
  sk: { start: "Aplikáciu sa nepodarilo spustiť. Skúste stránku načítať znova, prípadne v novšom prehliadači.", again: "Niečo sa nepodarilo. Skúste akciu zopakovať, prípadne stránku načítať znova.",
    reload: "Niečo sa nepodarilo. Skúste stránku načítať znova.", old: "Tento prehliadač je na Profily ulíc príliš starý. Otvorte ich, prosím, v aktuálnom Chrome, Firefoxe, Safari alebo Edge.",
    stale: "Aplikácia sa aktualizovala, načítajte stránku znova.", button: "Načítať znova" },
  sl: { start: "Aplikacije ni bilo mogoče zagnati. Poskusite znova naložiti stran ali uporabite novejši brskalnik.", again: "Nekaj je šlo narobe. Poskusite znova ali znova naložite stran.",
    reload: "Nekaj je šlo narobe. Poskusite znova naložiti stran.", old: "Ta brskalnik je prestar za aplikacijo Profili ulic. Odprite jo v posodobljeni različici brskalnika Chrome, Firefox, Safari ali Edge.",
    stale: "Aplikacija je bila posodobljena. Znova naložite stran.", button: "Znova naloži" },
  fi: { start: "Sovellus ei käynnistynyt. Yritä ladata sivu uudelleen tai käytä uudempaa selainta.", again: "Jokin meni vikaan. Yritä uudelleen tai lataa sivu uudelleen.",
    reload: "Jokin meni vikaan. Yritä ladata sivu uudelleen.", old: "Tämä selain on liian vanha Katuprofiilille. Avaa sovellus Chromen, Firefoxin, Safarin tai Edgen ajantasaisella versiolla.",
    stale: "Sovellus on päivittynyt. Lataa sivu uudelleen.", button: "Lataa uudelleen" },
  sv: { start: "Appen kunde inte starta. Försök ladda om sidan eller använd en nyare webbläsare.", again: "Något gick fel. Försök igen eller ladda om sidan.",
    reload: "Något gick fel. Försök ladda om sidan.", old: "Den här webbläsaren är för gammal för Gatusektion. Öppna appen i en aktuell version av Chrome, Firefox, Safari eller Edge.",
    stale: "Appen har uppdaterats. Ladda om sidan.", button: "Ladda om" },
};
(function () {
  var TEXTS = PROFILY_ERROR_TEXTS;
  // The language as i18n.js picks it (the address, the last choice, the browser), for the few texts here.
  var lang = "cs";
  var known = function (l) { return !!l && TEXTS.hasOwnProperty(l); };
  try {
    var asked = /[?&]lang=([a-z]{2})\b/.exec(location.search);
    var saved = localStorage.getItem("profily-lang");
    var browser = navigator.languages || [navigator.language || ""];
    var first = "";
    for (var i = 0; i < browser.length && !first; i++) { var m = /^([a-z]{2})\b/i.exec(browser[i] || ""); if (m && known(m[1].toLowerCase())) first = m[1].toLowerCase(); }
    lang = asked && known(asked[1]) ? asked[1] : known(saved) ? saved : first || (browser.length ? "en" : "cs");
  } catch (e) {}
  var T = TEXTS[lang] || TEXTS.cs;
  var START = T.start;
  // button: a button "reload" after the text (a module that is gone after a deploy: the page is older than the files).
  function show(text, button) {
    var put = function () {
      var el = document.getElementById("status");
      if (!el) return;
      el.textContent = text;
      el.className = "muted error";
      if (button) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.style.marginLeft = "8px";
        b.textContent = button;
        b.onclick = function () { location.reload(); };
        el.appendChild(b);
      }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", put);
    else put();
  }
  window.addEventListener("error", function (e) {
    var t = e.target;
    // The page's own scripts and styles (a module that did not download, Leaflet blocked) are
    // fatal; a broken map tile or illustration is not.
    if (t && t !== window && !/^(SCRIPT|LINK)$/.test(t.tagName)) return;
    // Web fonts are optional (the app falls back to system fonts): a blocked font server is fine.
    if (t && t.tagName === "LINK" && !/leaflet|style\.css/.test(t.href)) return;
    // Third-party scripts loaded on demand (the Mapy.com panorama) report their own failure.
    if (t && t.tagName === "SCRIPT" && t.src && !t.src.startsWith(location.origin) && !/leaflet/.test(t.src)) return;
    // A module of the page that does not load (after a deploy the files of the old page are gone): reloading the page fetches the new ones.
    if (t && t.tagName === "SCRIPT" && t.type === "module") return show(T.stale, T.button);
    show(window.profilyReady ? T.again : START);
  }, true);
  window.addEventListener("unhandledrejection", function (e) {
    // import() of a module that is gone ("Failed to fetch dynamically imported module", Safari "Importing a module script failed").
    var msg = String((e.reason && e.reason.message) || e.reason || "");
    if (/dynamically imported module|importing a module script failed/i.test(msg)) return show(T.stale, T.button);
    show(window.profilyReady ? T.reload : START);
  });
  if (!("noModule" in HTMLScriptElement.prototype)) {
    show(T.old);
  }
  // Nothing has started after a while (a module that silently failed): say so.
  window.addEventListener("load", function () {
    setTimeout(function () { if (!window.profilyReady) show(START); }, 8000);
  });
})();
