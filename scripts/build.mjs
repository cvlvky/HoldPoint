// Builds the web app into www/ for Capacitor: native bridge bundle, fonts, styles, app script, page.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "www");
const JS_ORDER = [
  "data_qcs.js", "data_build.js", "data_news.js", "calc.js",
  "app_core.js", "views_main.js", "views_checks.js", "views_tools.js",
  "views_news.js", "views_report.js", "views_ask.js", "views_more.js", "boot.js"
];
const run = process.env.GITHUB_RUN_NUMBER;
const VERSION = run ? "1.0." + run : "1.0.dev";

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });

// 1. native bridge (Capacitor core + plugins) as one browser script
await build({
  entryPoints: [path.join(SRC, "native.js")],
  bundle: true, format: "iife", minify: true, target: "es2020",
  outfile: path.join(OUT, "native.js"), logLevel: "warning"
});

// 2. fonts bundled with the app so it looks right offline
const FONTS = [
  ["Atkinson Hyperlegible", "atkinson-hyperlegible", [400, 700]],
  ["Big Shoulders Display", "big-shoulders-display", [700, 800]],
  ["IBM Plex Mono", "ibm-plex-mono", [400, 600]]
];
let fontCss = "";
for (const [family, pkg, weights] of FONTS) {
  for (const w of weights) {
    const file = `${pkg}-latin-${w}-normal.woff2`;
    fs.copyFileSync(path.join(ROOT, "node_modules/@fontsource", pkg, "files", file), path.join(OUT, "fonts", file));
    fontCss += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url("${file}") format("woff2")}\n`;
  }
}
fs.writeFileSync(path.join(OUT, "fonts", "fonts.css"), fontCss);

// 3. styles
fs.copyFileSync(path.join(SRC, "style.css"), path.join(OUT, "style.css"));

// 4. app script
const js = '"use strict";\nconst HP_VERSION = ' + JSON.stringify(VERSION) + ";\n" +
  JS_ORDER.map((f) => "/* ---- " + f + " ---- */\n" + fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
fs.writeFileSync(path.join(OUT, "app.js"), js);

// 5. page, with inline icons for the static header and tab bar
const core = fs.readFileSync(path.join(SRC, "app_core.js"), "utf8");
const block = core.slice(core.indexOf("const ICONS = {"), core.indexOf("};", core.indexOf("const ICONS = {")));
const icons = {};
for (const m of block.matchAll(/^\s+(\w+): '(.*?)',?$/gm)) {
  icons[m[1]] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + m[2] + "</svg>";
}
let html = fs.readFileSync(path.join(SRC, "shell.html"), "utf8");
html = html.replace(/\/\*__ICON_(\w+)__\*\//g, (_, n) => {
  if (!icons[n]) throw new Error("Missing icon " + n);
  return icons[n];
});
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log("Built www/ for HoldPoint " + VERSION + " (" + Object.keys(icons).length + " icons, " + Math.round(js.length / 1024) + " KB app script)");
