/* ================= More: settings, AI key, reminders, backup, about ================= */
VIEWS.more = {
  tab: "", title: "More",
  render() {
    const nI = Store.list("insp").length, nR = Store.list("rep").length;
    const th = Store.prefs.theme || "auto";
    const place = Weather.place()[0];
    const rem = Reminders.list();
    const key = AI.key();
    return '<div class="stack"><div><div class="eyebrow">HoldPoint ' + esc(APP_VERSION) + ' · QCS site companion</div><h2 class="sec" style="margin-top:6px">More</h2></div>' +
      '<div class="grid3">' + tile("report", "report", "Daily report", "Manpower and output", "accent") +
        tile("ask", "ask", "Ask HoldPoint", "Questions answered by Claude") + tile("doctor", "camera", "Defect Doctor", "Photo of a defect") +
        tile("tables", "table", "QCS tables", "Grades, cover, slump") + tile("glossary", "qcs", "Glossary", GLOSSARY.length + " site terms") +
        tile("history", "history", "History", "Landmarks and failures") + tile("sources", "news", "Sources", "Live feeds and links") + tile("", "search", "Search", "Everything in the app", "", "search") + "</div>" +

      '<section class="card stack" style="gap:10px"><h3 class="card-t">Your details</h3><p class="small muted">Filled in on new reports and inspection records.</p>' +
        '<div class="grid2"><label class="f">Your name<input class="in" data-p="name" value="' + esc(Store.prefs.name) + '" autocomplete="name"></label><label class="f">Project or site<input class="in" data-p="project" value="' + esc(Store.prefs.project) + '" placeholder="e.g. 400KV substation"></label></div>' +
        '<label class="f">Site location for live weather<select class="in" id="placeSel">' + optsHtml(PLACES.map((p) => [p[0], p[1]]), place) + "</select></label></section>" +

      '<section class="card stack" style="gap:10px"><h3 class="card-t">AI assistant</h3>' +
        '<p class="small">Ask HoldPoint, Defect Doctor and the news briefing use Claude with your own Anthropic API key, so usage is billed to your Anthropic account. Create a key at console.anthropic.com. It is stored only on this phone.</p>' +
        '<label class="f">Anthropic API key<input class="in" id="aiKey" type="password" autocomplete="off" placeholder="sk-ant-…" value="' + esc(key) + '"></label>' +
        '<label class="f">Model<select class="in" id="aiModel">' + optsHtml(AI_MODELS, AI.model()) + "</select></label>" +
        '<div class="row"><button class="btn" data-act="aiTest">' + ico("check") + "Test the key</button>" + (key ? '<button class="btn ghost danger" data-act="aiClear">Remove key</button>' : "") + "</div></section>" +

      '<section class="card stack" style="gap:10px"><h3 class="card-t">Reminders</h3>' +
        (rem.length ? '<div class="list">' + rem.map((r) => '<div class="row" style="justify-content:space-between;flex-wrap:nowrap;gap:10px;padding:6px 0;border-bottom:1px dashed var(--line)"><span class="small"><b>' + esc(r.title) + '</b><br><span class="muted">' + esc(fmtDate(isoInQatar(r.at), { weekday: "short" })) + " " + esc(fmtTime(r.at)) + "</span></span>" +
          '<button class="btn sm ghost" data-act="remCancel" data-id="' + r.id + '" aria-label="Cancel reminder">' + ico("trash") + "</button></div>").join("") + "</div>"
          : '<p class="small muted">None set. The cube sampling plan and striking dates tools can remind you on the day.</p>') + "</section>" +

      '<section class="card stack" style="gap:10px"><h3 class="card-t">Appearance</h3><div class="seg" role="group" aria-label="Theme">' +
        [["auto", "Match phone"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => '<button data-act="theme" data-v="' + v + '" aria-pressed="' + (th === v) + '">' + l + "</button>").join("") + "</div></section>" +

      '<section class="card stack" style="gap:10px"><h3 class="card-t">Your records</h3><p class="small">' + plural(nI, "inspection") + " and " + plural(nR, "daily report") + ' are saved on this phone.</p>' +
        '<p class="small muted">Back up before you change phones or reinstall. The backup is a .json file you can keep in Drive or send to yourself.</p>' +
        '<div class="row"><button class="btn" data-act="exportAll">' + ico("dl") + 'Back up</button><label class="btn file">' + ico("plus") + 'Restore<input type="file" id="impFile" hidden></label></div></section>' +

      '<section class="card stack small" style="gap:8px"><h3 class="card-t">About HoldPoint</h3>' +
        "<p>HoldPoint turns QCS 2024 into a work sequence, ITP checklists, calculators and a daily report for site engineers. The rule cards paraphrase the QCS parts in your Google Drive, and every card carries its clause number so you can check the source.</p>" +
        "<p>QCS 2024 is a voluntary standard unless your contract names it. The contract specification, approved method statements and the Engineer's instructions always govern. Figures marked <span class=\"tag warn\">verify</span> were read from scanned tables.</p>" +
        "<p>News comes live from Google News and publisher feeds, plus curated picks with site lessons. Weather comes from Open-Meteo.</p>" +
        '<div class="row"><a class="btn" href="' + REPO_URL + '/releases/latest">' + ico("dl") + "Get the latest version</a></div>" +
      "</section></div>";
  },
  mount() {
    let t;
    $$("[data-p]").forEach((el) => el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => Store.pref(el.dataset.p, el.value.trim()), 500); }));
    $("#placeSel").addEventListener("change", (e) => { Local.set("place", e.target.value); Local.set("wx", null); toast("Weather will show " + Weather.place()[1] + "."); Weather.refresh(true).catch(() => {}); });
    $("#aiKey").addEventListener("change", (e) => { Local.set("ai.key", e.target.value.trim()); updateFab(); toast(e.target.value.trim() ? "Key saved on this phone." : "Key removed."); });
    $("#aiModel").addEventListener("change", (e) => { Local.set("ai.model", e.target.value); toast("Model saved."); });
    const imp = $("#impFile");
    imp.addEventListener("change", () => {
      const f = imp.files && imp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const o = JSON.parse(rd.result);
          const recs = Array.isArray(o.records) ? o.records : o.recs && typeof o.recs === "object" ? Object.values(o.recs) : [];
          let n = 0;
          recs.forEach((r) => {
            if (!r || typeof r !== "object" || !/^[A-Za-z0-9_-]{3,64}$/.test(String(r.id || "")) || !["insp", "rep"].includes(r.kind)) return;
            const cur = Store.recs[r.id];
            if (cur && (cur.updatedAt || 0) >= (r.updatedAt || 0)) return;
            Store.recs[r.id] = r;
            n++;
          });
          if (o.prefs && typeof o.prefs === "object") {
            ["name", "project"].forEach((k) => { if (!Store.prefs[k] && typeof o.prefs[k] === "string") Store.prefs[k] = o.prefs[k]; });
            if (o.prefs.stageStatus && typeof o.prefs.stageStatus === "object" && !Object.keys(Store.prefs.stageStatus || {}).length) Store.prefs.stageStatus = o.prefs.stageStatus;
          }
          Store.saveLocal();
          toast(n ? "Restored " + plural(n, "record") + "." : "Nothing new to restore.");
          route(true);
        } catch (e) { toast("That file isn't a HoldPoint backup."); }
      };
      rd.readAsText(f);
    });
  }
};
ACTIONS.theme = (el) => { Store.pref("theme", el.dataset.v); applyTheme(); route(true); };
ACTIONS.exportAll = () => {
  const data = { app: "HoldPoint", version: 1, exported: new Date().toISOString(), prefs: Store.prefs, records: Object.values(Store.recs) };
  shareFile("holdpoint-backup-" + qNow().date + ".json", JSON.stringify(data, null, 1));
};
ACTIONS.remCancel = async (el) => { await Reminders.cancel(+el.dataset.id); route(true); toast("Reminder cancelled."); };
ACTIONS.aiClear = () => { Local.set("ai.key", ""); updateFab(); route(true); toast("Key removed."); };
ACTIONS.aiTest = async (el) => {
  const k = $("#aiKey").value.trim();
  if (!k) { toast("Paste your API key first."); return; }
  Local.set("ai.key", k);
  el.disabled = true;
  try { await AI.call("Reply with the single word OK.", [{ role: "user", content: "Test" }], 10); toast("The key works."); updateFab(); }
  catch (e) { toast(AI.msg(e)); }
  el.disabled = false;
};
