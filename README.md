# Matthew Ferrer — Portfolio resources

Complete portable website, exported September 24, 2026.
Citi experience: October 2025–October 2026.

## Included

- index.html — complete portfolio content
- style.css — design tokens, responsive layout and states
- script.js — navigation, the project card slider, website tabs, the photo that changes
  beside each section, photo viewer, contact field and email copy
- motion.js — entrances and scroll motion (GSAP, ScrollTrigger, Lenis)
- favicon.svg
- assets/web/ — compressed photos the page uses (originals stay in assets/)
- assets/work/ — dashboard, chart and client-website screenshots shown on the page, and
  ba-metrics.webm, a short recording of the live British Airways Tableau dashboard
- assets/ — original portrait, Citi career photo, five graduation photos, three Power BI reports,
  two Excel datasets, one CSV dataset, and the Food Affordability PH web dashboard
  (food-affordability-dashboard.html, loads d3 from cdnjs) with its Power BI project zip
- REVIEW.md — checks performed and remaining verification limits
- robots.txt, sitemap.xml — search engine files (see REVIEW.md about GitHub Pages project sites)
- SHA256SUMS.txt — checksums for the website files

## Open locally

Extract the entire ZIP first. Open index.html in a modern browser.
Keep the assets folder beside index.html, style.css, and script.js.
For a local web preview, if Python 3 is installed, open a terminal inside this
folder and run:

    python3 -m http.server 8000

Then visit http://localhost:8000. Press Ctrl+C to stop the server.
Clipboard permissions vary by browser; the email-copy button provides a manual
copy fallback. Say hello uses the visitor's configured email application.

## Publish elsewhere

This is a static website with no package installation or build step.
Upload index.html, style.css, script.js, favicon.svg, and the complete assets/
folder to your static host's public directory. Preserve filename capitalization
and relative paths. Do not upload only index.html.

This export does not contain hosting credentials or account-specific configuration.
REVIEW.md, this README, and SHA256SUMS.txt are handoff documentation and do not
need to be published.

## Editing

Edit career dates, project descriptions, and destination links in index.html.
Edit colors, typography, responsive layouts, and motion in style.css.
Colors and type sizes are tokens at the top of style.css (--bg, --ink, --accent, --step-*).
Design: dark and information-first, inspired by valiotti.com: serif headlines with one italic copper word,
small mono labels, outlined cards, a numbers row, a trust band, an FAQ and a centred close.
Unique to this site: the live dashboard recording in stacking project cards, the browser tour of the client
websites, his own photographs, and the hero network drawn as 26 points, one per tool, clustered by tool group.
Palette: near-black #0d0d0c, warm greys, one copper (#c2501f buttons, #e8814f text).
Typefaces: Instrument Serif (headlines) and IBM Plex Mono (labels), SIL Open Font License; Satoshi (reading),
ITF Free Font License. All stored in assets/fonts/, so they work offline too. The Satoshi files are trimmed
to Latin letters, punctuation and arrows to load faster; the stylesheet also sets size-matched stand-ins
(Georgia, Arial) so text does not move when the web fonts arrive.
Edit interface behavior in script.js.
Animations live in motion.js (GSAP, ScrollTrigger and Lenis, stored in assets/vendor/).
If those files are missing, or a visitor has reduced motion turned on, the page still works without animation.
The logo is assets/brand/logo-mark.svg (also favicon.svg); the link preview image is assets/brand/og-image.jpg.

Power BI files are downloads, not embedded browser dashboards. They require
compatible Power BI software to inspect. The large WHO CSV downloads only when
requested; it is not loaded by the page automatically.
