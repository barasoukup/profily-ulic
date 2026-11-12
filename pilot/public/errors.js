// Loaded before everything else as a plain script, so it also works where the app's modules fail
// (an old browser, a failed download): instead of a blank page the visitor gets a short message.
(function () {
  // The language as i18n.js picks it (the address, the last choice, the browser), for the few texts here.
  var en = false;
  try {
    var asked = /[?&]lang=(cs|en)\b/.exec(location.search);
    var saved = localStorage.getItem("profily-lang");
    var browser = navigator.languages || [navigator.language || ""];
    en = asked ? asked[1] === "en" : saved ? saved === "en" : !browser.some(function (l) { return /^(cs|sk)\b/i.test(l || ""); });
  } catch (e) {}
  var T = function (cs, english) { return en ? english : cs; };
  var START = T("Aplikaci se nepodařilo spustit. Zkuste stránku načíst znovu, případně v novějším prohlížeči.",
    "The app could not start. Try reloading the page, or use a newer browser.");
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
    show(window.profilyReady ? T("Něco se nepovedlo. Zkuste akci zopakovat, případně stránku načíst znovu.", "Something went wrong. Try again, or reload the page.") : START);
  }, true);
  window.addEventListener("unhandledrejection", function () {
    show(window.profilyReady ? T("Něco se nepovedlo. Zkuste stránku načíst znovu.", "Something went wrong. Try reloading the page.") : START);
  });
  if (!("noModule" in HTMLScriptElement.prototype)) {
    show(T("Tento prohlížeč je na Profily ulic příliš starý. Otevřete je prosím v aktuálním Chrome, Firefoxu, Safari nebo Edge.", "This browser is too old for Street Profile. Please open it in a current version of Chrome, Firefox, Safari or Edge."));
  }
  // Nothing has started after a while (a module that silently failed): say so.
  window.addEventListener("load", function () {
    setTimeout(function () { if (!window.profilyReady) show(START); }, 8000);
  });
})();
