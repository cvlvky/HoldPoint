/* ================= boot ================= */
(function boot() {
  Store.load();
  applyTheme();
  window.addEventListener("hashchange", () => route());
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
  route();
  if (isApp()) {
    Native.App.addListener("backButton", () => {
      if (!$("#sheet").hidden) { closeSheet(); return; }
      const to = backTarget();
      if (to) go(to); else Native.App.exitApp();
    });
    Native.App.addListener("resume", () => { News.autoRefresh(); if (State.route === "today" || State.route === "news") refreshView(); });
    Store.restoreFromFile().then((ok) => { if (ok) { toast("Your records were restored from app storage."); refreshView(); } });
  }
  setTimeout(() => News.autoRefresh(), 1200);
  window.addEventListener("online", () => News.autoRefresh());
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) { /* old WebView */ }
})();
