// Loads every page in a headless browser and fails on blocked resources, script errors,
// or HTML injection through an imported workflow.
// Run from the repo root: python3 -m http.server 8765 & node tests/browser.mjs
// Needs Playwright; set PLAYWRIGHT to its index.mjs path if it is installed globally.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
const fails = [];
const browser = await chromium.launch();

async function open(path) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => /Content Security Policy|Refused to/.test(m.text()) && errors.push(m.text()));
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  return { page, check: label => errors.forEach(e => fails.push(`${label}: ${e.slice(0, 160)}`)) };
}

// Home page: the motion scripts load and the contact form reaches Web3Forms.
{
  const { page, check } = await open('/');
  if (!(await page.evaluate(() => !!window.gsap))) fails.push('home: motion scripts did not load');
  // The hero canvas draws every node (2 triggers, 5 steps, 4 agent tools, the end), a wire between each step,
  // the prompt with its request, and every tool logo resolves.
  const flow = await page.evaluate(() => {
    const hero = '.flow-view[data-flow="hero"]';
    return {
      nodes: document.querySelectorAll(hero + ' .flow-node').length,
      wires: document.querySelectorAll(hero + ' .flow-wire').length,
      tools: document.querySelectorAll(hero + ' .flow-tool-wire').length,
      prompt: !!document.querySelector(hero + ' .flow-prompt .flow-typed'),
      logos: [...document.querySelectorAll(hero + ' .flow-node img')].filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src'))
    };
  });
  if (flow.nodes !== 12 || flow.wires !== 7 || flow.tools !== 4 || !flow.prompt) fails.push(`home: hero canvas drew ${JSON.stringify(flow)}`);
  if (flow.logos.length) fails.push(`home: hero canvas logos missing: ${flow.logos.join(', ')}`);
  // Every canvas draws (hero, How I work), and each expand button opens its region.
  const canvases = await page.$$eval('.flow-view', views => views.map(v => `${v.dataset.flow}:${v.querySelectorAll('.flow-node').length}`));
  if (canvases.join() !== 'hero:12,method:7') fails.push(`home: canvases drew ${canvases.join()}`);
  const expands = await page.$$eval('.expand:not(.step-toggle)', buttons => buttons.map(b => {
    b.click();
    const open = b.getAttribute('aria-expanded') === 'true' && document.getElementById(b.getAttribute('aria-controls')).classList.contains('is-open');
    b.click();
    return open;
  }));
  if (!expands.length || expands.includes(false)) fails.push('home: an expand button did not open its region');
  // The hero's + reveals two more chapters (12 + 5 + 5 nodes, the + included), then leaves.
  const reveal = await page.evaluate(() => {
    const more = () => document.querySelector('.flow-more');
    more().click();
    more().click();
    const end = document.querySelector('.flow-view[data-flow="hero"] .is-end');
    return { nodes: document.querySelectorAll('.flow-view[data-flow="hero"] .flow-node').length, gone: end.hidden, note: document.querySelector('.flow-live').textContent };
  });
  if (reveal.nodes !== 22 || !reveal.gone || !reveal.note.includes('Supplier risk view')) fails.push(`home: hero + did not reveal its chapters ${JSON.stringify(reveal)}`);
  // The certifications figure links to the credentials section.
  if (!(await page.$eval('.stat-link a', a => !!document.querySelector(a.getAttribute('href'))))) fails.push('home: certifications figure does not link to its section');
  // The certified row: five issuer marks that load, and a link that lands on the credentials.
  await page.$eval('.certified', el => el.scrollIntoView());
  await page.waitForTimeout(800); // the marks load lazily
  const certified = await page.evaluate(() => ({
    marks: [...document.querySelectorAll('.certified img')].filter(img => img.complete && img.naturalWidth).length,
    target: !!document.querySelector(document.querySelector('.certified-row').getAttribute('href'))
  }));
  if (certified.marks !== 5 || !certified.target) fails.push(`home: certified row ${JSON.stringify(certified)}`);
  // One typeface: Satoshi everywhere, the code font only in the terminal replay and the browser bar,
  // and no section label or headline word in pink (pink is for what can be acted on).
  const type = await page.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const family = el => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim();
    return {
      mono: els.filter(el => family(el) === 'IBM Plex Mono' && !el.closest('.cover-term, .browser-bar')).slice(0, 3).map(el => el.textContent.trim().slice(0, 30)),
      other: [...new Set(els.map(family))].filter(f => !['Satoshi', 'IBM Plex Mono'].includes(f)),
      pink: [...document.querySelectorAll('.label, .title em, .hero-title em')].filter(el => getComputedStyle(el).color === 'rgb(203, 24, 97)').map(el => el.textContent.trim().slice(0, 30))
    };
  });
  if (type.mono.length || type.other.length || type.pink.length) fails.push(`home: type ${JSON.stringify(type)}`);
  await page.click('.step-toggle[aria-controls="step-3"]');
  if (await page.$eval('#step-3', r => !r.classList.contains('is-open'))) fails.push('home: How I work step did not open');
  await page.route('https://api.web3forms.com/**', r => r.fulfill({ json: { success: true } }));
  await page.evaluate(() => Object.entries({ mailName: 'Test', mailEmail: 'test@example.com', mailSubject: 'Test',
    mailMessage: 'Test message' }).forEach(([id, v]) => { document.getElementById(id).value = v; }));
  const sent = page.waitForRequest('https://api.web3forms.com/**', { timeout: 5000 }).catch(() => null);
  await page.$eval('#mailForm', f => f.requestSubmit());
  if (!(await sent)) fails.push('home: contact form did not send');
  check('home');
}

// 404 page is styled.
{
  const { page, check } = await open('/404.html');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (bg === 'rgba(0, 0, 0, 0)') fails.push('404: stylesheet did not load');
  check('404');
}

// Food dashboard draws its charts.
{
  const { page, check } = await open('/projects/food-affordability/');
  if (!(await page.$$eval('svg', s => s.length > 2))) fails.push('food: charts did not render');
  check('food');
}

// AP builder: a workflow whose text fields all carry HTML must not run any of it.
{
  const { page, check } = await open('/projects/ap-reporting-agent-flow/');
  await page.locator('.node').first().click({ force: true });
  await page.$eval('#s_name', e => { e.value += ' '; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(600);
  const wf = JSON.parse(await page.evaluate(() => localStorage.getItem('ap-agent-flow.v2')));
  const payload = '"><img src=x onerror="window.__p=1"><b>';
  const keep = new Set(['id', 'uid', 'kind', 'lane', 'color']);
  const poison = o => { for (const k in o) {
    if (typeof o[k] === 'string' && !keep.has(k)) o[k] = payload + o[k];
    else if (o[k] && typeof o[k] === 'object') poison(o[k]);
  } };
  poison(wf);
  await page.evaluate(w => localStorage.setItem('ap-agent-flow.v2', JSON.stringify(w)), wf);
  await page.reload(); await page.waitForTimeout(800);
  await page.click('#runBtn');
  // The run pauses for a person to approve the report.
  await page.waitForSelector('#apOk', { state: 'visible', timeout: 60000 }).then(b => b.click())
    .catch(() => fails.push('ap: approval step never appeared'));
  // The run ends when every node shows a status badge and the button reads Execute again.
  await page.waitForFunction(() => document.querySelector('#runBtn span').textContent.includes('Execute')
    && document.querySelectorAll('.node .badge svg').length >= document.querySelectorAll('.node').length - 1,
    null, { timeout: 120000 }).catch(() => fails.push('ap: run did not finish'));
  const tabs = await page.$$eval('.tabs button', b => b.map(x => x.dataset.tab));
  for (let i = 0; i < await page.locator('.node').count(); i++) {
    await page.locator('.node').nth(i).click({ force: true });
    for (const t of tabs) await page.click(`.tabs button[data-tab="${t}"]`);
  }
  if (await page.evaluate(() => window.__p)) fails.push('ap: imported workflow text ran as HTML');
  // A bad ID must be rejected on load.
  wf.nodes[1].uid = 'x" onmouseover="window.__p=1';
  await page.evaluate(w => localStorage.setItem('ap-agent-flow.v2', JSON.stringify(w)), wf);
  await page.reload(); await page.waitForTimeout(800);
  if (await page.evaluate(() => document.body.innerHTML.includes('onmouseover'))) fails.push('ap: unsafe node ID was accepted');
  check('ap');
}

await browser.close();
console.log(fails.join('\n') || 'All browser checks passed.');
process.exit(fails.length ? 1 : 0);
