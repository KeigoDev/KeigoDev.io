# Portfolio review — October 23, 2026

## Experience panel, logos on dark, shorter credit (latest)

- Experience: the tall sticky Citi photo (it outgrew the screen and drifted) is replaced by a panel sized to fit the
  screen that follows the job being read: Astor website, Citi photo, BE3 dashboard, then "2021, first data role",
  each with a one-line fact. Hidden on phones; the pinned dates were dropped.
- Portrait caption: the degree line is replaced by "Open to remote data and BI roles".
- Logos: no white tiles. Certification band in white (SAP in grey so its letters stay readable); tool logos keep
  their colours, the dark ones (AWS, ChatGPT, ETL, Tableau) turn white and Notion is inverted.
- Footer credit shortened to "Built with HTML, CSS and JavaScript."
- "Worked at" now shows each employer's own logo and lettering: Citi (white with red arc), Astor Realty Enterprise
  (gold crest, Cormorant Garamond), BE3 (red square logo from the system's login screen). Sources in assets/logos/SOURCES.md.
- "Certified by" in brand colours without frames, matching the employer row (AWS and Meta in their dark-background
  versions, IBM in IBM blue).

## Reference design, made his own

- Rebuilt in the reference's visual language (valiotti.com): dark throughout, Instrument Serif headlines with an
  italic copper word, IBM Plex Mono labels, outlined cards, numbered service cards, logo badges, tool tiles, an FAQ
  divided by lines, a centred close and a four-column footer. Copy, structure and images are his own.
- Unique: stacking project cards with the live British Airways recording, the browser tour of the client sites, his
  photographs (portrait, Citi, graduation), and a hero network of 26 points, one per tool, clustered by tool group.
- Design rules relaxed on purpose for this look (labels above headings, mono, thin lines, outlined and numbered
  cards, copper accent); recorded as allowed in the inspector run and impeccable config.
- Fixed while building: round portrait stretched into an oval (image height attribute), hover states below 4.5:1.
- Entrances slide in without fading, so content is always at full contrast (Lighthouse accessibility 100).

## Straightforward structure, after valiotti.com

- Borrowed the information structure, not the styling: credibility, then proof, then services, then the call to action.
- First screen: supporting sentence and a numbers row (30–40%, 9 projects, 5 certifications, 26 tools; counts up,
  screen readers get the final figures). The separate "By the numbers" section was removed.
- Trust band under the first screen: AWS, IBM, SAP, Google, Meta, and Citi, Astor Realty Enterprise, BE3.
- What I do: Data engineering, BI & analytics, Data science, each with the problem, the work and a linked proof.
- Project cards lead with a result line. FAQ of five recruiter questions before contact. Contact promise line.
- Fixed: phone top bar sat over the headline without a ground while scrolling the first screen.
- Not added: testimonials (none supplied; real LinkedIn recommendations could go here).

## Full-stack positioning and display fonts

- Title: "Full-stack data analyst. I speak SQL and boardroom." Page title, description, link preview and structured
  data now say full-stack data analyst (data engineering, BI, data science). Tools regrouped into Data engineering,
  BI & visualisation, Data science, Business platforms, AI & automation (26 tools; NumPy/NLTK/Matplotlib added from
  the n-gram project).
- Fonts: Clash Display (name, headings, opening line) and Satoshi (reading), Fontshare, ITF Free Font License,
  self-hosted; chosen from four rendered options. Fixed: the phone Menu button sat 4px past the screen edge.

## Opening line and fonts

- Opening phrase: "Data and BI analyst. I speak SQL and boardroom." (a contrast hook: technical work plus executive
  reporting), with See my work and Email me. Fixed: the name's full-screen box was blocking clicks on these buttons.
- Fonts: Big Shoulders (tall signage capitals) for the name and headings, Public Sans for reading, chosen from four
  rendered options. Both self-hosted; 63 KB together, down from 162 KB. Display headings set a size larger.

## Full-bleed project cards

- Desktop deck cards: the screenshot or recording fills the whole card; title, tools, description, links and
  "How I did it" sit on a solid charcoal panel (bottom left, scrolls inside if long). Disclosure notes are a label in
  the top corner; BE3's extra screens sit bottom right. The small n-gram chart shows sharp on white instead of
  being stretched. Pointer tilt removed (it would show gaps at a full-bleed edge). Phones keep picture-then-text.

## Tool filter removed

- The tool filter (7 buttons for 9 projects, each showing 1–3) was removed: it broke the card stack into single cards,
  and every card already lists its tools. Its code, styles and markup are gone; the stack positions are now fixed.

## Selected work as cards

- Featured projects are a stacking card deck: each card holds near the top while the next slides over it; the card
  beneath eases back to 94% and dims (GSAP ScrollTrigger, scrubbed). Phones get a plain list of cards.
- The four smaller projects sit in a card slider (native scroll-snap, previous/next buttons that switch off at the
  ends, arrow keys and swipe work, no autoplay).
- Dashboards tilt slightly toward the pointer (desktop mice only).
- Footer credit: built by hand with HTML, CSS and JavaScript; GSAP, Lenis, Rokkitt, Literata, Playwright, GitHub Pages.
- Inspector: 0 FAIL with four rules allowed on purpose for the deck and slider (covered-text, pinned-over-picture,
  long-pin, side-scroll); one WARN (several left edges, from the split layout).

## Section rework

- Opening: a large statement plus three facts (now, before, looking for) and two actions.
- How I work: four steps of the working method, each with real evidence and a link to the project; the fixed photo
  changes to a second portrait here (inline photo on phones). The small avatar is gone.
- Selected work: the dashboard stage now takes most of the width (index 5 columns, stage 7).
- Websites I run: full-page captures of the three live sites (taken Oct 23, 2026) in a browser frame that scrolls
  slowly while in view; the visitor can scroll it and takes over at once. No movement under reduced motion.
- Experience: a timeline. Dates stay in view, two achievements show upfront, the rest under "What I do".
- Checks: inspector 0 FAIL / 0 WARN, lint 0, impeccable detector clean, Chrome and WebKit tests pass.

## Colour change

- Blue and teal replaced with charcoal and orange at the owner's request: page #f4f4f2, charcoal #1c1b19,
  orange #c2410c (#a8380a for small text, #ff8c4d on dark sections). All text pairs 4.5:1 or more.
- Logo, favicon, touch icon and link preview recoloured. Inspector 0 FAIL / 0 WARN; Chrome and WebKit click-through pass.

## Audit pass: content, critique, motion

- impeccable critique (two independent reviews: design + detector/browser) scored 26/36 before fixes; snapshot in .impeccable/critique/.
- Repetition removed: the five-person team, "Rizal, Philippines", 30–40%, the certification count, the BE3 capstone and
  the Astor screenshot each now appear where they belong, not three to five times. Salon and Marque have their own lines.
- Hero now says the role sought; the About letter tells the path instead of repeating the hero.
- Moving proof: a 14-second recording of the live British Airways Tableau dashboard (metric switch redraws every chart),
  muted, plays only on screen, pause button, still under reduced motion. British Airways now leads the project list.
- Dashboard tilt on the work stage (desktop mouse only), adapted from React Bits TiltedCard without its glare.
  React Bits itself was not installed: the site is plain HTML and the components need React.
- MF mark in the footer turns in once; footer photo is a graduation picture instead of a fourth portrait.
- Phones: four smaller projects sit behind "Show 4 more projects" (filters show every match).
- Count-up figures: screen readers get the final value only; shorter count.
- Fixed: "Say hello" button stuck 20px up (CSS transition fought GSAP); hover no longer swaps projects.
- Checks: lint 0, design inspector 0 FAIL / 0 WARN, impeccable detector clean; Chrome and WebKit click-through pass;
  Lighthouse mobile 93 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100. Firefox could not be launched here.
- To confirm: the Astor job starts Sep 2026 while Citi runs to Oct 2026 (one month overlap); the bank project's
  "decline in 2016" (its chart shows 2016 highest). No CV file exists to link.

## Redesign

New direction from the design-taste-frontend skill, "The split stage" (seed 914519171), reviewed with ui-ux-pro-max.
- Palette "frost and slate" (replaces greige and brass); Rokkitt + Literata at the time (now Big Shoulders + Public Sans).
- Layout: portrait fixed on the left of the first screen with the name crossing it; a letter-style About;
  full-width project index; websites as one plate with tabs on a dark band; a second split where the photo
  changes with the section (Citi, portrait, graduation); tools as one printed sheet; a one-field contact
  that writes the email; a photograph-and-menu footer. All previous content is kept.
- Logo, favicon, touch icon and link-preview image recoloured to the new palette.
- Checks: design inspector 0 FAIL at 1440, 768 and 390 px (one WARN: no video, by choice); lint 0;
  colour pairs all 4.5:1 or more; Lighthouse 12.2.1 mobile 95 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100
  (local gzip server); click-through of filters, project picker, tabs (mouse and keyboard), photo viewer,
  phone menu, contact field; reduced motion and JavaScript-off pages show all content; no overflow at
  390, 768, 1024, 1440; no console errors.
- Not verified: real phones, Safari/Firefox for this version, the mailto hand-off in every email app.

Live address (GitHub Pages project site): https://keigodev.github.io/KeigoDev.io/
The live site still runs the previous version until these changes are pushed.

## Lighthouse 12.2.1 (local, after changes)

| Run | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile, plain local server (no compression) | 88 | 100 | 100 | 100 |
| Mobile, gzip server (like GitHub Pages) | 97 | 100 | 100 | 100 |
| Desktop, plain local server | 100 | 100 | 100 | 100 |

Before the changes: mobile 84 / 93 / 100 / 100, desktop 97 / 93 / 100 / 100.
Mobile with compression: First Contentful Paint 0.8 s, Largest Contentful Paint 2.6 s,
Cumulative Layout Shift 0. These are lab numbers on simulated slow 4G, not field data.

## Fixed in this pass

- Self-hosted the typefaces (assets/fonts) with a preload; removed the Google Fonts request.
- Responsive images: 480 / 800 px (and 320 px for the small portrait) variants with srcset and sizes.
- Hero name starts at its fitted size, so it no longer jumps when the script measures it (CLS 0).
- About paragraph now animates from grey to black instead of nearly invisible to black (readable at every point).
- Accessible names moved from plain spans to the heading itself (invalid aria-label removed).
- Section headings animate as whole words, so headings stay readable to screen readers and search engines.
- Meta logo text darkened slightly to pass contrast.
- Opening curtain runs on desktop only; phones go straight to content.
- Smooth scrolling (Lenis) re-syncs when anything else moves the page, so it never snaps back.
- Experience and certificate rows no longer flash: they were visible, then vanished and faded back in when
  their animation started. They now start hidden and open smoothly. On desktop the dates stay in view
  beside long open entries.
- CSS smooth scroll is off while Lenis runs. It made ScrollTrigger measure wrongly whenever it
  recalculated mid-page (resize, opening a dropdown), which pushed the Citi photo parallax out of place.
  Opening any dropdown now recalculates the scroll triggers.
- SEO: canonical URL, absolute Open Graph and Twitter image URLs, og:url, a 149-character meta description,
  Person structured data (JSON-LD, validated as JSON) built only from facts on the page, robots.txt and sitemap.xml.

## Weak spots fixed (second pass)

- Power BI projects now show previews rebuilt from each .pbix Report/Layout (same tile positions, chart types,
  titles and fields) with values computed from the bundled datasets. Each carries the caption
  "Preview rebuilt from the report's layout and dataset". Maps are shown as top-10 bar charts (noted in the tile title).
- The previews use corrected aggregations; the .pbix files themselves still need these fixes in Power BI:
  - Beverage and Coca-Cola: price card uses Sum of Price per Unit (1,796 / 4,362.5) → use Average ($0.48 / $0.45).
  - Coca-Cola: margin line uses Sum of Operating Margin (4,081) → use Average (42.3%).
  - WHO: "Active Cases" and "New Cases" cards sum Cumulative_cases across every day (about 995 billion) →
    use the latest date's total (778.5 million); "Death Cases" likewise (latest: 7.1 million).
    "Count of ... by Region" charts use Average, not Count; rename or change the aggregation.
- Projects: five featured (Amazon, British Airways, Coca-Cola, language model, BE3 system), four more below,
  separated by size and space; phones show a "More work" heading. Filters still cover all nine.
- Cross-browser: WebKit (Safari's engine, Playwright 1.64.1) desktop and phone, no errors, no overflow,
  font and motion working. Firefox could not be launched in this environment.

## Checks run

- Design inspector (design-taste-frontend) at 1440, 768 and 390 px: one remaining FAIL is a false positive
  (text inside a closed dropdown is treated as a label above the next heading); two WARNs (font sizes counted
  include the CSS-drawn tool logos; no video, by choice).
- No horizontal overflow at 390, 768, 1024 and 1440 px.
- Clicked through: project index (click, hover, keyboard focus), tool filters on desktop and phone,
  "How I did it" dropdowns, photo viewer open and close, phone menu open and close, copy email.
- Keyboard: tab order runs skip link → logo → navigation → hero buttons → filters → projects, with a visible focus ring
  at every stop.
- Reduced motion: no curtain, no smooth scrolling, no custom cursor; all content visible.
- JavaScript off: all nine projects and every section display.
- No console errors over http. Opened from the folder (file://) the browser logs one harmless message about the
  font preload; the font itself still loads.

## Not verified

- Real phones and tablets (only emulated sizes in Chrome).
- Firefox was not tested (could not launch here). Safari tested via WebKit only, not on a real iPhone or Mac Safari.
- Search indexing. Note: for a GitHub Pages project site, robots.txt only counts at the domain root
  (keigodev.github.io), so submit sitemap.xml in Google Search Console instead of relying on robots.txt.
- Link previews on LinkedIn and chat apps can only be checked after the site is pushed (absolute image URL is set).
- External links (Tableau Public, GitHub, Kaggle, Coursera, client websites) were not re-checked in this pass.
- PBIX files were not opened in Power BI.
- Content accuracy: the bank project says deposits declined in 2016, but its own yearly chart shows 2016 as the
  highest year. Kept as written; please confirm.
