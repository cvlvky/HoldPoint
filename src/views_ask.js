/* ================= Ask HoldPoint and Defect Doctor (Claude, with your own API key) ================= */
const Chat = { turns: [], busy: false };
const ASK_RULES = "You are HoldPoint, a site assistant for civil and structural engineers in Qatar who work to the Qatar Construction Specifications (QCS 2024).\n" +
  "How to answer:\n" +
  "- Short and practical: under 180 words unless asked for more. Use short bullet points for steps and lists.\n" +
  "- Use the QCS NOTES sent with each question first, and give the clause in brackets, like (S05 P10 §10.2.1).\n" +
  "- If the notes don't cover the question, say it isn't in the app's QCS notes, then give general good practice (ACI, EN or BS) clearly labelled as such. Never invent clause numbers or values.\n" +
  "- When it matters, say that the contract specification and the Engineer's instructions govern, and that QCS 2024 applies only where the contract names it.\n" +
  "- Plain text: no tables or headings. Use **double asterisks** only to bold key numbers.";
const STOPW = new Set("the a an and or of to in on for is are be with what when how do does can i we my our at by from as it this that which should must per vs if any there long much many".split(" "));
const askTokens = (q) => q.toLowerCase().split(/[^a-z0-9°%.]+/).filter((t) => t.length > 1 && !STOPW.has(t));
function retrieve(q) {
  const toks = askTokens(q);
  const rules = RULES.map((r) => {
    const head = (r.title + " " + r.tags + " " + r.topic).toLowerCase(), body = r.pts.join(" ").toLowerCase();
    let s = 0;
    toks.forEach((t) => { if (head.includes(t)) s += 3; if (body.includes(t)) s += 1; });
    return [s, r];
  }).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 6).map((x) => x[1]);
  const stages = STAGES.map((s) => {
    const x = (s.title + " " + s.steps.join(" ")).toLowerCase();
    let k = 0;
    toks.forEach((t) => { if (x.includes(t)) k++; });
    return [k, s];
  }).filter((x) => x[0] >= 2).sort((a, b) => b[0] - a[0]).slice(0, 2).map((x) => x[1]);
  return { rules, stages };
}
function notesFor(q) {
  const { rules, stages } = retrieve(q);
  let s = rules.map((r) => "[" + r.title + " | " + r.ref + "]\n" + r.pts.map((p) => "- " + plain(p)).join("\n")).join("\n\n");
  if (stages.length) s += "\n\n" + stages.map((x) => "[Stage " + x.no + " " + x.title + ": sequence]\n" + x.steps.map((p, i) => i + 1 + ". " + plain(p)).join("\n") + "\nHold points: " + x.holds.map((h) => h[1]).join("; ")).join("\n\n");
  return { text: s || "(No matching notes in the app.)", rules };
}
function fmtAnswer(t) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  let html = "", inList = false;
  String(t).split("\n").forEach((line) => {
    const m = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (m) { if (!inList) { html += '<ul class="pts">'; inList = true; } html += "<li>" + inline(m[1]) + "</li>"; }
    else { if (inList) { html += "</ul>"; inList = false; } if (line.trim()) html += "<p>" + inline(line) + "</p>"; }
  });
  if (inList) html += "</ul>";
  return html;
}
const SUGGEST = ["How long must I cure a raft foundation?", "Slump range for a 100 mm target?", "When can I strike slab soffits?", "What tests do I need for backfill?", "Minimum cover for X4 exposure at C50?", "Can we pour at 11 am in July?"];
function chatHtml() {
  return Chat.turns.map((t) => {
    if (t.role === "user") return '<div class="msg me">' + esc(t.content) + "</div>";
    const refs = (t.refs || []).map((id) => RULE_BY_ID[id]).filter(Boolean);
    return '<div class="msg ai done' + (t.err ? " err" : "") + '">' + fmtAnswer(t.content) + (t.cut ? '<p class="tiny muted">The answer was cut short. Ask for less at a time.</p>' : "") + "</div>" +
      (refs.length ? '<div class="refs small muted">Notes used: ' + refs.map((r) => '<a class="ref" href="#rule-' + r.id + '">' + esc(r.title) + "</a>").join(" ") + "</div>" : "");
  }).join("");
}
const needKey = (what) => '<div class="empty stack" style="gap:10px;text-align:left"><p>' + what + " uses Claude through your own Anthropic API key, so the answers are billed to your account. Add the key once under <b>More → AI assistant</b>; it stays on this phone.</p>" +
  '<a class="btn primary" href="#more">' + ico("key") + "Add API key</a></div>";
VIEWS.ask = {
  tab: "", back: "today", title: "Ask HoldPoint",
  render() {
    const head = '<div><div class="eyebrow">Ask HoldPoint · answers by Claude</div><h2 class="sec" style="margin-top:6px">Site questions</h2></div>';
    if (!AI.ready()) return '<div class="stack">' + head + needKey("Ask HoldPoint") + "</div>";
    return '<div class="stack">' + head +
      '<p class="lede">Claude answers from this app\'s QCS notes and says when it goes beyond them. Check the clause before you act.</p>' +
      '<div class="chat" id="chat">' + chatHtml() + "</div>" +
      (Chat.turns.length ? "" : '<div class="chips wrap" id="sugg">' + SUGGEST.map((s) => '<button class="chip" data-act="askSuggest" data-q="' + esc(s) + '">' + esc(s) + "</button>").join("") + "</div>") +
      '<div class="askbar"><textarea class="in" id="askIn" rows="2" placeholder="Ask about a clause, a check, a test or a limit" aria-label="Your question"></textarea>' +
      '<div class="row"><button class="btn primary" id="askGo"' + (Chat.busy ? " disabled" : "") + ">" + ico("send") + "Ask</button>" +
      (Chat.turns.length ? '<button class="btn ghost" data-act="askClear">New chat</button>' : "") + "</div></div>" +
      '<a class="item" href="#doctor"><div class="row" style="flex-wrap:nowrap;gap:10px">' + ico("camera") + '<div><div class="t">Defect Doctor</div><div class="small muted">Send a photo of a defect for causes and repairs</div></div></div></a>' +
      "</div>";
  },
  mount() {
    const go = $("#askGo");
    if (!go) return;
    const box = $("#askIn");
    go.addEventListener("click", () => { const q = box.value.trim(); if (q) { box.value = ""; askSend(q); } });
  }
};
ACTIONS.askSuggest = (el) => askSend(el.dataset.q);
ACTIONS.askClear = () => { Chat.turns = []; route(); };
async function askSend(q) {
  if (Chat.busy || !q.trim() || !AI.ready()) return;
  Chat.busy = true;
  const { text: notes, rules } = notesFor(q);
  const hist = Chat.turns.filter((t) => !t.err).slice(-8).map((t) => ({ role: t.role, content: t.content }));
  while (hist.length && hist[0].role !== "user") hist.shift();
  Chat.turns.push({ role: "user", content: q });
  const sug = $("#sugg"); if (sug) sug.remove();
  $("#chat").insertAdjacentHTML("beforeend", '<div class="msg me">' + esc(q) + '</div><div class="msg ai think" id="pending">Thinking…</div>');
  $("#askGo").disabled = true;
  $("#pending").scrollIntoView({ block: "center", behavior: "smooth" });
  try {
    const msgs = [];
    hist.concat([{ role: "user", content: "QCS NOTES:\n" + notes + "\n\nQUESTION: " + q }]).forEach((m) => {
      const last = msgs[msgs.length - 1];
      if (last && last.role === m.role) last.content += "\n\n" + m.content; else msgs.push({ role: m.role, content: m.content });
    });
    const r = await AI.call(ASK_RULES, msgs, 1200);
    Chat.turns.push({ role: "assistant", content: r.text, refs: rules.slice(0, 4).map((x) => x.id), cut: r.cut });
  } catch (e) {
    Chat.turns.push({ role: "assistant", content: AI.msg(e), err: true });
  } finally {
    Chat.busy = false;
    if (State.route === "ask") {
      const draft = $("#askIn") ? $("#askIn").value : "";
      route(true);
      if (draft && $("#askIn")) $("#askIn").value = draft;
      const msgs = $$("#chat .msg.me");
      if (msgs.length) msgs[msgs.length - 1].scrollIntoView({ block: "start" });
    }
  }
}

/* ---------- Defect Doctor: photo analysis ---------- */
const Doc = { file: null, busy: false, result: null };
function docPrompt(note) {
  return "You are a senior QA/QC civil engineer on a building or substation site in Qatar. Look at the attached site photo and assess any visible defect in concrete, reinforcement, formwork, blockwork, waterproofing or earthworks.\n" +
    "Reply with only a JSON object in this shape:\n" +
    '{"defect":"Honeycombing","confidence":"medium","severity":"moderate","seen":"one or two sentences on what is visible","causes":["..."],"actions":["immediate steps on site"],"repairs":["repair options, each subject to the Engineer\'s approval"],"tests":["checks or tests to confirm"],"ncr":true,"rule_ids":["conc-compaction"]}\n' +
    "confidence is low, medium or high; severity is minor, moderate or major. At most 4 short items per list. ncr is true when a non-conformance report should be raised.\n" +
    "rule_ids: up to 3 relevant ids from this list: " + RULES.map((r) => r.id + " (" + r.title + ")").join("; ") + ".\n" +
    'If the photo does not show construction work, set defect to "Not a construction photo", confidence to "high" and leave the lists empty.\n' +
    "The engineer's note about the photo: " + (note || "none");
}
function docText(d) {
  const L = [(d.defect || "Defect") + " (" + (d.severity || "?") + ", " + (d.confidence || "?") + " confidence)", d.seen || ""];
  [["Likely causes", d.causes], ["Do now", d.actions], ["Repair options", d.repairs], ["Confirm with", d.tests]].forEach(([k, a]) => { if (Array.isArray(a) && a.length) L.push("", k + ":", ...a.map((x) => "• " + x)); });
  if (d.ncr) L.push("", "Raise an NCR.");
  L.push("", "AI opinion from one photo; confirm on site.");
  return L.join("\n");
}
function docResult(d) {
  const L = (a) => (Array.isArray(a) && a.length ? '<ul class="pts">' + a.slice(0, 6).map((x) => "<li>" + esc(String(x)) + "</li>").join("") + "</ul>" : '<p class="small muted">–</p>');
  const sev = String(d.severity || "").toLowerCase();
  const rules = (Array.isArray(d.rule_ids) ? d.rule_ids : []).map((id) => RULE_BY_ID[String(id)]).filter(Boolean).slice(0, 3);
  return '<section class="card stack" style="gap:10px" id="docCard" data-text="' + esc(docText(d)) + '">' +
    '<div class="meta row" style="gap:6px"><span class="tag ' + (sev === "major" ? "bad" : sev === "moderate" ? "warn" : "ok") + '">' + esc(sev || "unrated") + '</span><span class="tag neutral">' + esc(String(d.confidence || "")) + " confidence</span>" + (d.ncr ? '<span class="tag bad">Raise an NCR</span>' : "") + "</div>" +
    '<h3 class="card-t" style="font-size:22px">' + esc(String(d.defect || "Unclear")) + "</h3><p>" + esc(String(d.seen || "")) + "</p>" +
    "<div><b>Likely causes</b>" + L(d.causes) + "</div><div><b>Do now</b>" + L(d.actions) + "</div><div><b>Repair options</b>" + L(d.repairs) + "</div><div><b>Confirm with</b>" + L(d.tests) + "</div>" +
    (rules.length ? '<div class="list">' + rules.map(ruleItem).join("") + "</div>" : "") +
    '<div class="row"><button class="btn sm" data-act="shareText" data-src="docCard">' + ico("send") + 'Send</button><button class="btn sm" data-act="copy" data-src="docCard">' + ico("copy") + "Copy</button></div></section>";
}
function shrinkImage(file, maxSide) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onerror = () => reject(new Error("read"));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}
function parseJSONLoose(t) {
  const s = String(t || "");
  try { return JSON.parse(s); } catch (e) { /* try the braces */ }
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { /* give up */ } }
  return null;
}
VIEWS.doctor = {
  tab: "", back: "tools", title: "Defect Doctor",
  render() {
    const head = '<div><div class="eyebrow">Defect Doctor · photo check by Claude</div><h2 class="sec" style="margin-top:6px">What\'s wrong here?</h2></div>';
    if (!AI.ready()) return '<div class="stack">' + head + needKey("Defect Doctor") + "</div>";
    return '<div class="stack">' + head +
      '<p class="lede">Photograph a defect such as honeycombing, cracks, low cover, rusty steel, open blockwork joints or membrane damage. Claude names it and gives likely causes, what to do now and repair options, linked to the QCS cards.</p>' +
      '<section class="card stack" style="gap:10px"><label class="btn primary file">' + ico("camera") + 'Take or choose a photo<input type="file" id="docFile" accept="image/*" hidden></label>' +
      '<img id="docPrev" alt="Selected photo"' + (Doc.preview ? ' src="' + Doc.preview + '"' : " hidden") + ">" +
      '<label class="f">What and where (optional)<input class="in" id="docNote" placeholder="e.g. raft edge, poured 3 days ago, C40"></label>' +
      '<button class="btn dark" id="docGo"' + (Doc.file && !Doc.busy ? "" : " disabled") + ">" + (Doc.busy ? "Analysing…" : "Analyse photo") + "</button></section>" +
      '<div id="docOut" aria-live="polite">' + (Doc.result ? docResult(Doc.result) : "") + "</div>" +
      '<p class="small muted">An AI opinion from a single photo. Confirm on site, and send structural concerns to the designer.</p></div>';
  },
  mount() {
    const fi = $("#docFile");
    if (!fi) return;
    fi.addEventListener("change", async () => {
      const f = fi.files && fi.files[0];
      if (!f) return;
      Doc.file = f; Doc.result = null;
      try { Doc.preview = await shrinkImage(f, 1280); } catch (e) { Doc.preview = ""; toast("That photo couldn't be read. Try another."); Doc.file = null; }
      route(true);
    });
    $("#docGo").addEventListener("click", async () => {
      if (!Doc.preview || Doc.busy) return;
      Doc.busy = true;
      const note = $("#docNote").value.trim();
      $("#docGo").disabled = true; $("#docGo").textContent = "Analysing…";
      $("#docOut").innerHTML = '<div class="msg ai think">Looking at the photo… this can take up to a minute.</div>';
      try {
        const r = await AI.call("You are a careful QA/QC civil engineer. Reply with JSON only.", [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Doc.preview.split(",")[1] } },
          { type: "text", text: docPrompt(note) }] }], 1200);
        const d = parseJSONLoose(r.text);
        if (!d) throw { code: "empty", message: "The answer wasn't in the expected format." };
        Doc.result = d;
      } catch (e) { Doc.result = null; toast(AI.msg(e)); }
      Doc.busy = false;
      if (State.route === "doctor") route(true);
    });
  }
};
