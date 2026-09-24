# Matthew Ferrer — Portfolio resources

Complete portable website, exported September 24, 2026.
Citi experience: October 2025–October 2026.

## Included

- index.html — complete portfolio content
- style.css — responsive layout and animations
- script.js — navigation, filtering, details, scrolling, gallery, and email copy
- favicon.svg
- assets/ — original portrait, Citi career photo, five graduation photos, three Power BI reports,
  two Excel datasets, and one CSV dataset
- REVIEW.md — checks performed and remaining verification limits
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
Edit interface behavior in script.js.

Power BI files are downloads, not embedded browser dashboards. They require
compatible Power BI software to inspect. The large WHO CSV downloads only when
requested; it is not loaded by the page automatically.
