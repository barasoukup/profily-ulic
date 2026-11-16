// Loaded before everything else as a plain script, so it also works where the app's modules fail
// (an old browser, a failed download): instead of a blank page the visitor gets a short message.
(function () {
  // The language as i18n.js picks it (the address, the last choice, the browser), for the few texts here.
  var lang = "cs";
  try {
    var asked = /[?&]lang=(cs|sk|en|de)\b/.exec(location.search);
    var saved = localStorage.getItem("profily-lang");
    var browser = navigator.languages || [navigator.language || ""];
    var first = "";
    for (var i = 0; i < browser.length && !first; i++) { var m = /^(cs|sk|en|de)\b/i.exec(browser[i] || ""); if (m) first = m[1].toLowerCase(); }
    lang = asked ? asked[1] : /^(cs|sk|en|de)$/.test(saved || "") ? saved : first || (browser.length ? "en" : "cs");
  } catch (e) {}
  var T = function (cs, english, sk, de) { return lang === "en" ? english : lang === "sk" ? sk : lang === "de" ? de : cs; };
  var START = T("Aplikaci se nepodařilo spustit. Zkuste stránku načíst znovu, případně v novějším prohlížeči.",
    "The app could not start. Try reloading the page, or use a newer browser.",
    "Aplikáciu sa nepodarilo spustiť. Skúste stránku načítať znova, prípadne v novšom prehliadači.",
    "Die App konnte nicht starten. Laden Sie die Seite neu oder verwenden Sie einen neueren Browser.");
  function show(text) {
    var put = function () {
      var el = document.getElementById("status");
      if (!el) return;
      el.textContent = text;
      el.className = "muted error";
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
    show(window.profilyReady ? T("Něco se nepovedlo. Zkuste akci zopakovat, případně stránku načíst znovu.", "Something went wrong. Try again, or reload the page.", "Niečo sa nepodarilo. Skúste akciu zopakovať, prípadne stránku načítať znova.", "Etwas ist schiefgegangen. Versuchen Sie es erneut oder laden Sie die Seite neu.") : START);
  }, true);
  window.addEventListener("unhandledrejection", function () {
    show(window.profilyReady ? T("Něco se nepovedlo. Zkuste stránku načíst znovu.", "Something went wrong. Try reloading the page.", "Niečo sa nepodarilo. Skúste stránku načítať znova.", "Etwas ist schiefgegangen. Laden Sie die Seite neu.") : START);
  });
  if (!("noModule" in HTMLScriptElement.prototype)) {
    show(T("Tento prohlížeč je na Profily ulic příliš starý. Otevřete je prosím v aktuálním Chrome, Firefoxu, Safari nebo Edge.", "This browser is too old for Street Profile. Please open it in a current version of Chrome, Firefox, Safari or Edge.",
      "Tento prehliadač je na Profily ulíc príliš starý. Otvorte ich, prosím, v aktuálnom Chrome, Firefoxe, Safari alebo Edge.",
      "Dieser Browser ist für Straßenprofil zu alt. Bitte öffnen Sie es in einer aktuellen Version von Chrome, Firefox, Safari oder Edge."));
  }
  // Nothing has started after a while (a module that silently failed): say so.
  window.addEventListener("load", function () {
    setTimeout(function () { if (!window.profilyReady) show(START); }, 8000);
  });
})();
