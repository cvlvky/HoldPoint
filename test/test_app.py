"""Phone-sized browser smoke test of the built www/ (run: python3 test/test_app.py). Network calls are mocked."""
import pathlib, sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent / "www"
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{port}/index.html"

GNEWS = """<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>x</title>
<item><title>Ashghal awards new road package in Al Wakrah - The Peninsula</title><link>https://news.google.com/rss/articles/abc1</link><pubDate>Wed, 18 Nov 2026 08:00:00 GMT</pubDate><description>&lt;a href="x"&gt;y&lt;/a&gt;</description><source url="https://thepeninsula.qa">The Peninsula</source></item>
<item><title>Warehouse roof collapse injures three in Dubai - Gulf News</title><link>https://news.google.com/rss/articles/abc2</link><pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate><source url="https://gulfnews.com">Gulf News</source></item>
</channel></rss>"""
WP = """<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Dezeen</title>
<item><title>Timber pavilion &amp;#8216;floats&amp;#8217; over a lake in Norway</title><link>https://www.dezeen.com/2026/11/18/timber-pavilion/</link><pubDate>Wed, 18 Nov 2026 06:00:00 +0000</pubDate><description><![CDATA[<p>A timber <b>pavilion</b> by a Norwegian studio sits on concrete piles.</p>]]></description></item>
<item><title>Ten colourful sofas for small flats</title><link>https://www.dezeen.com/2026/11/18/sofas/</link><pubDate>Wed, 18 Nov 2026 05:00:00 +0000</pubDate><description>Lookbook</description></item>
</channel></rss>"""

errors = []
def visit(page, h):
    page.evaluate("h => { location.hash = h; }", h)
    page.wait_for_timeout(50)
    txt = page.inner_text("#main")
    if "could not be shown" in txt or len(txt.strip()) < 20:
        errors.append(f"route {h}: empty or failed ({txt[:80]!r})")
    return txt

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" and "ERR_" not in m.text and "Failed to load" not in m.text else None)
    # mock the network layer before the app starts using it
    page.add_init_script("""
      window.__mock = true;
      window.addEventListener('DOMContentLoaded', () => {});
    """)
    page.goto(URL)
    page.wait_for_timeout(300)
    page.evaluate("""([g, w]) => {
      Net.get = async (url, type) => {
        if (type === 'json') return { current: { temperature_2m: 33.4, relative_humidity_2m: 41, wind_speed_10m: 17 },
          hourly: { time: Array.from({length: 120}, (_, i) => { const d = new Date(Date.UTC(2026,10,16,0) + i*3600e3); return d.toISOString().slice(0,13) + ':00'; }), temperature_2m: Array(120).fill(31), relative_humidity_2m: Array(120).fill(45), wind_speed_10m: Array(120).fill(12) },
          daily: { time: ['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20'], temperature_2m_max: [36.1, 36.4, 35.9, 34, 33], temperature_2m_min: [24,24,23,23,22] } };
        if (url.includes('dezeen') || url.includes('designboom')) return w;
        if (url.includes('news.google.com')) return g;
        throw new Error('HTTP 404');
      };
      Net.postJSON = async (url, body) => {
        const last = body.messages[body.messages.length - 1];
        const isImg = Array.isArray(last.content);
        const text = isImg ? '{"defect":"Honeycombing","confidence":"medium","severity":"moderate","seen":"Voids at the base of the wall.","causes":["Poor compaction"],"actions":["Stop and inform the Engineer"],"repairs":["Cut back and repair with approved mortar"],"tests":["Cores if extensive"],"ncr":true,"rule_ids":["conc-compaction"]}'
          : '- Cure for at least **7 days** and until 70 % strength (S05 P10 §10.2.1).\\n- Keep it wet 24 h a day.';
        return { status: 200, data: { content: [{ type: 'text', text }], stop_reason: 'end_turn' } };
      };
    }""", [GNEWS, WP])

    # weather + today
    page.evaluate("() => { localStorage.removeItem('hp.today'); localStorage.removeItem('hp.wx'); }")
    visit(page, "build"); visit(page, "today")
    page.click('[data-act="wxRefresh"]')
    page.wait_for_timeout(300)
    t = page.inner_text("#main")
    print("weather card:", "33.4" in t, "Hot-weather period likely" in t)
    if "33.4" not in t:
        errors.append("weather not shown")
    page.click('[data-act="wxFill"]')
    page.wait_for_timeout(100)
    vals = page.evaluate("() => [document.querySelector('[data-t=shadeT]').value, document.querySelector('[data-t=rh]').value, document.querySelector('[data-t=wind]').value, document.querySelector('[data-t=hot]').checked]")
    print("filled:", vals)
    if vals[0] != "33.4" or vals[3] is not True:
        errors.append(f"weather fill wrong {vals}")
    page.screenshot(path="/tmp/app_today.png")

    # news refresh with mocked feeds
    page.evaluate("() => { Local.set('ai.key', 'sk-test'); }")
    visit(page, "news")
    page.click('[data-act="newsRefresh"]')
    page.wait_for_timeout(600)
    nt = page.inner_text("#main")
    live = page.evaluate("() => News.live().items.map(n => [n.cat, n.q, n.t, n.src])")
    print("live items:", live)
    cats = {x[2]: x for x in live}
    if not any("Ashghal awards new road package" in x[2] and x[1] == 1 and x[3] == "The Peninsula" for x in live):
        errors.append("google item parse failed")
    if not any("roof collapse" in x[2] and x[0] == "failure" for x in live):
        errors.append("failure classification failed")
    if any("sofas" in x[2] for x in live):
        errors.append("design filter failed")
    if not any("‘floats’" in x[2] or "'floats'" in x[2] or "floats" in x[2] for x in live):
        errors.append("wordpress item missing")
    page.click('[data-act="newsBrief"]')
    page.wait_for_timeout(300)
    if "Cure for at least" not in page.inner_text("#brief"):
        errors.append("briefing not rendered")
    visit(page, "sources")

    # all static routes
    data = page.evaluate("() => ({stages: STAGES.map(s=>s.id), rules: RULES.map(r=>r.id), tools: TOOLS.map(t=>t.id), checks: CHECKLISTS.map(c=>c.id)})")
    for h in ["today", "build", "qcs", "tables", "glossary", "checks", "tools", "news", "history", "sources", "report", "more", "ask", "doctor"] + ["stage-" + s for s in data["stages"]] + ["rule-" + r for r in data["rules"]]:
        visit(page, h)
    for tid in data["tools"]:
        visit(page, "tool-" + tid)
        if not page.inner_text("#toolOut").strip():
            errors.append("tool " + tid + " no output")

    # inspections
    for c in data["checks"]:
        visit(page, "new-" + c)
        page.click('[data-act="setItem"][data-i="0"][data-v="ok"]')
        page.click('[data-act="setItem"][data-i="1"][data-v="nc"]')
        page.fill('[data-note="1"]', "Spacers missing")
        page.click('[data-act="inspStatus"][data-v="closed"]')
    n = page.evaluate("() => Store.list('insp').length")
    print("inspections:", n)
    if n != len(data["checks"]):
        errors.append("inspection count")

    # report
    visit(page, "newrep")
    page.fill('[data-g="present"][data-t="Mason"]', "12")
    page.click('[data-act="addWork"]')
    page.fill('[data-w="men"]', "6"); page.fill('[data-w="qty"]', "48")
    page.wait_for_timeout(500)
    if page.inner_text("#totP") != "12":
        errors.append("report total")

    # AI: key, ask, doctor
    page.evaluate("() => { Local.set('ai.key', 'sk-test'); }")
    visit(page, "ask")
    page.click('[data-act="askSuggest"]')
    page.wait_for_timeout(300)
    if "Cure for at least" not in page.inner_text("#chat"):
        errors.append("ask answer missing")
    visit(page, "doctor")
    page.set_input_files("#docFile", files=[{"name": "d.png", "mimeType": "image/png", "buffer": open("/home/claude/HoldPoint/scripts/icon-512.png", "rb").read()}])
    page.wait_for_timeout(400)
    page.click("#docGo")
    page.wait_for_timeout(400)
    if "Honeycombing" not in page.inner_text("#main"):
        errors.append("doctor result missing")

    # reminders in browser mode just toast; tool remind button exists
    visit(page, "tool-cubeplan")
    if not page.query_selector('[data-act="toolRemind"]'):
        errors.append("remind button missing")

    # storage survives reload
    page.reload(); page.wait_for_timeout(300)
    n2 = page.evaluate("() => Store.list('insp').length + Store.list('rep').length")
    print("after reload records:", n2)
    if n2 != len(data["checks"]) + 1:
        errors.append("records lost on reload")
    visit(page, "news")
    page.screenshot(path="/tmp/app_news.png")
    b.close()
httpd.shutdown()
print("\n".join(errors) if errors else "NO ERRORS")
sys.exit(1 if errors else 0)
