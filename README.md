# HoldPoint: QCS 2024 site companion

An Android app for civil and structural site engineers in Qatar. It puts the QCS 2024 work sequence, ITP checklists, site calculators, a daily manpower report and live engineering news in one place, and works offline once installed.

## Install on your phone

1. Open **Releases** in this repository on your phone and tap the newest **HoldPoint-1.0.x.apk**.
2. Open the downloaded file. If Android asks, allow your browser or Files app to install apps.
3. New versions install over the old one and keep your records. Every push to `main` builds a new release automatically.

## What's inside

- **Today**: live Doha weather (Open-Meteo), an estimated WBGT, a check on whether the QCS hot-weather period is likely in force, and a GO/HOLD pour check against QCS S05 Parts 08 and 15 and the Ministry of Labour heat rules.
- **Build**: 19 stages in order, from mobilisation to roof plus substation civil works. Each stage has its steps, hold and witness points, tests, acceptance, common defects, safety and QCS clauses.
- **QCS**: 46 rule cards with clause references and links to the PDFs in your Google Drive, plus tables for grades, cover, slump, striking times and mortar.
- **Checks**: 14 ITP checklists with truck and field-density logs that flag rejects. Close, send to WhatsApp, or save a printable report or CSV.
- **Tools**: 18 calculators, including pour planner, cube acceptance, cube plan with test-day reminders, striking dates with reminders, FDT, blockwork, tests owed and a unit converter. The **Daily report** covers manpower present and absent (own and hire), work done with output per man, and one-tap WhatsApp text.
- **News**: live stories from Google News searches and publisher feeds (Dezeen, designboom, ArchDaily, Construction Dive, Global Construction Review and New Civil Engineer), refreshed every 2 hours while you use the app. Also curated picks with site lessons, must-know history and a source directory.
- **Ask HoldPoint** and **Defect Doctor** (optional): Claude answers site questions from the QCS notes and reviews defect photos. Add your own Anthropic API key under **More → AI assistant**. The key stays on the phone and usage is billed to your Anthropic account.

## Your data

Records are stored on the phone and mirrored to the app's private storage. Use **More → Back up** to save a `.json` file before changing phones, and **Restore** to load it back.

## Build it yourself

```bash
npm ci
node test/test_calc.js        # calculator checks
node scripts/build.mjs        # builds www/
npx cap sync android
cd android && ./gradlew assembleDebug
```

The GitHub Actions workflow in `.github/workflows/build-apk.yml` does the same on every push. The first run creates a signing key and keeps it in the Actions cache (never published). For a permanent key, add it as the repository secret `HOLDPOINT_KEYSTORE_B64` (base64 of a .jks with alias `holdpoint`) and its password as `HOLDPOINT_KEYSTORE_PASSWORD`.

## Layout

- `src/`: app source: QCS data, calculators, screens and styles
- `scripts/build.mjs`: builds `www/` (native bridge bundle, fonts, app script)
- `android/`: Capacitor Android project
- `test/`: calculator tests and a browser smoke test

## Please note

The rule cards paraphrase QCS 2024 (QS 27/2024), which is a voluntary standard unless your contract names it. Your contract specification, approved method statements and the Engineer's instructions always govern. Figures marked **verify** were read from scanned tables, so check them against the PDF.
