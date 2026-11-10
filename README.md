# Matthew Ferrer: portfolio resources

Complete portable website, exported September 24, 2026.
Astor Realty Enterprise (AI Operations Lead): September 2026–now.
Citi experience: October 2025–October 2026.

## Folders

    index.html            the portfolio (home page)
    404.html              shown by GitHub Pages for a missing address (absolute links)
    robots.txt            search engine files; they stay at the top level
    sitemap.xml
    css/style.css         design tokens, responsive layout and states
    js/script.js          navigation, project slider, website tabs, employer logos, photo viewer, contact
    js/motion.js          entrances and scroll motion
    js/vendor/            GSAP, ScrollTrigger and Lenis
    projects/             one folder per interactive project, each with its own address
      ap-reporting-agent-flow/   the AI agent workflow builder and its n8n workflow file
      food-affordability/        backup copy of the Food Affordability PH dashboard (live copy is in its own repo)
    assets/brand/         logo, favicon, home-screen icon, link preview image
    assets/fonts/         web fonts
    assets/logos/         certificate, employer and tool logos (sources in SOURCES.md)
    assets/web/           compressed photos the page uses
    assets/work/          project and website screenshots, and the British Airways dashboard recording
    assets/downloads/     Power BI files, Excel and CSV datasets offered as downloads
    assets/originals/     full-size photos the compressed ones were made from (not loaded by the page)

assets/ap-reporting-agent-flow.html and assets/food-affordability-dashboard.html are only redirects, so
links to the old addresses keep working.

## Open locally

Extract the entire ZIP first. Open index.html in a modern browser.
Keep every folder beside index.html.
For a local web preview, if Python 3 is installed, open a terminal inside this
folder and run:

    python3 -m http.server 8000

Then visit http://localhost:8000. Press Ctrl+C to stop the server.
Clipboard permissions vary by browser; the email-copy button provides a manual
copy fallback. The message pop-up sends through Web3Forms (web3forms.com) to the inbox;
its access key is WEB3FORMS_KEY at the top of the contact section in js/script.js.

## Publish elsewhere

This is a static website with no package installation or build step.
Upload index.html, 404.html, robots.txt, sitemap.xml and the css/, js/, projects/ and assets/
folders to your static host's public directory. Preserve filename capitalization
and relative paths. Do not upload only index.html.

This export does not contain hosting credentials or account-specific configuration.
This README is handoff documentation and does not
need to be published. Working notes (docs/, .impeccable/) stay local and are not committed.

## Editing

Edit career dates, project descriptions, and destination links in index.html.
Edit colors, typography, responsive layouts, and motion in css/style.css.
Colors and type sizes are tokens at the top of css/style.css (--bg, --ink, --accent, --step-*).
Design: dark and information-first, inspired by valiotti.com: serif headlines with one italic violet word,
small mono labels, outlined cards, a numbers row, a trust band, an FAQ and a centred close.
Unique to this site: the live dashboard recording in the project cards, the browser tour of the client
websites, his own photographs, and the hero network drawn as 26 points, one per tool, clustered by tool group.
Palette: near-black #0d0d0c, warm greys, one violet (#7c3aed buttons with white text, #c7a9ff text).
Typefaces: Instrument Serif (headlines) and IBM Plex Mono (labels), SIL Open Font License; Satoshi (reading),
ITF Free Font License. All stored in assets/fonts/, so they work offline too. The Satoshi files are trimmed
to Latin letters, punctuation and arrows to load faster; the stylesheet also sets size-matched stand-ins
(Georgia, Arial) so text does not move when the web fonts arrive.
Edit interface behavior in js/script.js.
Animations live in js/motion.js (GSAP, ScrollTrigger and Lenis, stored in js/vendor/).
If those files are missing, or a visitor has reduced motion turned on, the page still works without animation.
The logo is assets/brand/logo-mark.svg (also assets/brand/favicon.svg); the link preview image is assets/brand/og-image.jpg.

Power BI files are downloads, not embedded browser dashboards. They require
compatible Power BI software to inspect. The WHO CSV stays in assets/downloads/ but is not linked from the page;
the WHO card links to the WHO data source instead.
