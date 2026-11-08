// Loaded before everything else as a plain script, so it also works where the app's modules fail
// (an old browser, a failed download): instead of a blank page the visitor gets a short message.
(function () {
  var shown = false;
  function show(text) {
    if (shown) return;
    shown = true;
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
    // Only failures of the page's own scripts: a broken map tile or illustration is not fatal.
    if (e.target && e.target !== window) return;
    show(window.profilyReady ? "Něco se nepovedlo. Zkuste akci zopakovat, případně stránku načíst znovu."
      : "Aplikaci se nepodařilo spustit. Zkuste stránku načíst znovu, případně v novějším prohlížeči.");
  });
  window.addEventListener("unhandledrejection", function () {
    show("Něco se nepovedlo. Zkuste stránku načíst znovu.");
  });
  if (!("noModule" in HTMLScriptElement.prototype)) {
    show("Tento prohlížeč je na Profily ulic příliš starý. Otevřete je prosím v aktuálním Chrome, Firefoxu, Safari nebo Edge.");
  }
})();
