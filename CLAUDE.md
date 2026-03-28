# Dataverhaal — Dataviz Tool

## Project
Client-side datavisualisatie-tool voor dataverhaal.nl. Geen framework, geen backend — puur HTML/CSS/vanilla JS.

## Bestanden
- `index.html` — UI structuur, laadt `style.css` en JS-modules
- `style.css` — Dark-theme styling
- `js/core.js` — Constants (PAL, FMT, LAY), state (S), chart registry (CHARTS)
- `js/helpers.js` — Canvas helpers (rrect, rbar), text (wrap, trunc, shortLabel), numbers (fmtN, niceTicks)
- `js/parse.js` — Data parsing (HTML-tabellen, CSV, XLSX), kolom selectie
- `js/render.js` — Gedeelde render helpers (drawGrid, drawLegend), main draw()
- `js/charts/*.js` — Elk grafiektype in eigen bestand, registreert zichzelf via `registerChart(id, {label, draw})`
- `js/ui.js` — UI setters, config opslaan/laden, export, init()
- `dataviz.html` — **NIET GEBRUIKEN**. Verouderd.
- `app.js` — **NIET GEBRUIKEN**. Vervangen door modulaire structuur in `js/`.

## Nieuw grafiektype toevoegen
1. Maak `js/charts/<naam>.js`
2. Roep `registerChart('<id>', {label:'Label', draw:function(ctx,data,x,y,w,h,O){...}})` aan
3. Voeg `<script src="js/charts/<naam>.js"></script>` toe in `index.html` vóór `js/ui.js`
4. Het type verschijnt automatisch als knop in het panel

## Hosting
- GitHub Pages op `main` branch: https://maxverb.github.io/dataverhaal/
- **Let op**: GitHub CDN cachet `app.js` en `style.css` agressief. Bij grote wijzigingen kan een cache-bust nodig zijn (`?v=X` op de src/href).

## Git workflow
- Altijd werken op een feature branch, nooit direct op `main`
- Wijzigingen via PR, merge via squash
- PR's mag je direct mergen na aanmaken (gebruiker wil geen review-wachttijd)
- Timestamp in topbar update automatisch via `document.lastModified`

## Actieve features
- **Data-invoer**: plak tab/komma-gescheiden data, HTML-tabellen (`<table>`, losse `<tr>`/`<td>`), CSV/XLSX upload
- **Slimme datumlabels**: `01/03/2026` → `1 mrt`, `2026-03-01` → `1 mrt` (alle grafiektypen)
- **Grafiektypen**: bar, horizontale bar, lijn (rechte segmenten, geen curves), donut
- **Multi-kolom**: kolomnamen uit headers, checkboxes per kolom, gegroepeerde bars, multi-line, legenda
- **Stijl**: 6 kleurpaletten, 5 layouts (klassiek/kader/lijn/omgekeerd/strak)
- **Formaten**: Twitter/X, IG Post, IG Vierkant, Story, TikTok, Slide
- **Kleinere koptekst**: schaalfactor 0.64 voor 16:9 formaten (Twitter, Slide)
- **Auto-timestamp**: topbar toont "Bijgewerkt:" via `document.lastModified`
- **Filters**: rasterlijnen, waarden, x-as labels, branding aan/uit
- **Configuraties**: opslaan/laden via localStorage
- **Export**: PNG download

## Code conventies
- Compact, geminimaliseerde stijl (korte variabelenamen, weinig whitespace)
- Canvas rendering via 2D context, geen chart library
- Tekst-sizing als percentage van canvas breedte (`W * 0.052` etc.)
- Nederlandse UI, Nederlandse maandnamen in code
