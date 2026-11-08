// Loaded before everything else as a plain script, so it also works where the app's modules fail
// (an old browser, a failed download): instead of a blank page the visitor gets a short message.
(function () {
  var START = "Aplikaci se nepodařilo spustit. Zkuste stránku načíst znovu, případně v novějším prohlížeči.";
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
    show(window.profilyReady ? "Něco se nepovedlo. Zkuste akci zopakovat, případně stránku načíst znovu." : START);
  }, true);
  window.addEventListener("unhandledrejection", function () {
    show(window.profilyReady ? "Něco se nepovedlo. Zkuste stránku načíst znovu." : START);
  });
  if (!("noModule" in HTMLScriptElement.prototype)) {
    show("Tento prohlížeč je na Profily ulic příliš starý. Otevřete je prosím v aktuálním Chrome, Firefoxu, Safari nebo Edge.");
  }
  // Nothing has started after a while (a module that silently failed): say so.
  window.addEventListener("load", function () {
    setTimeout(function () { if (!window.profilyReady) show(START); }, 8000);
  });
})();
