'use strict';

/* Page behaviour that works with or without the motion layer (motion.js). */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 960px)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const ease = 'cubic-bezier(.22, 1, .36, 1)';
const EMAIL = 'matthew.p.ferrer@gmail.com';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

/* The name: one line, as wide as its space allows */

function fitDisplayType() {
  const heading = $('.hero-name');
  const line = $('.hero-name .name-line');

  if (!heading || !line) {
    return;
  }

  heading.style.removeProperty('--name-size');
  const style = getComputedStyle(heading);
  const available = heading.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  // Desktop: the whole name on one line. Phone: each word on its own line.
  const words = [...line.querySelectorAll('.name-word')];
  const used = desktop.matches || !words.length
    ? line.scrollWidth
    : Math.max(...words.map(word => word.scrollWidth));
  const size = parseFloat(style.fontSize);

  if (available > 0 && used > 0) {
    const fitted = size * available / used * 0.995;
    const capped = desktop.matches ? fitted : Math.min(fitted, window.innerWidth * 0.2);
    heading.style.setProperty('--name-size', `${capped.toFixed(2)}px`);
  }
}

window.fitDisplayType = fitDisplayType;

/* Navigation: phone menu, tone after the first screen, hidden while reading down */

const header = $('.site-nav');
const menu = $('#navLinks');
const toggle = $('#navToggle');

const workToggle = $('#workToggle');
const workPanel = $('#workPanel');

function setWork(open) {
  workToggle.setAttribute('aria-expanded', String(open));
  workPanel.classList.toggle('is-open', open);
}

workToggle.addEventListener('click', () => setWork(workToggle.getAttribute('aria-expanded') !== 'true'));

function closeMenu() {
  setWork(false);
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = 'Menu';
}

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close' : 'Menu';
  header.classList.remove('nav-hidden');
});

$$('.nav-links a').forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    // Closing the Work panel hands focus back to its button.
    if (workPanel.contains(document.activeElement)) {
      workToggle.focus();
    }
    closeMenu();
  }
});

document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.site-nav')) {
    closeMenu();
  }
});

desktop.addEventListener('change', closeMenu);

// Keyboard users always see the bar.
header.addEventListener('focusin', () => header.classList.remove('nav-hidden'));

let lastY = window.scrollY;
let scrollQueued = false;

function onScroll() {
  const y = window.scrollY;
  const hero = $('.hero');
  const heroEnd = hero.offsetTop + hero.offsetHeight - 72;

  header.classList.toggle('scrolled', y > heroEnd);
  // Over the dark first screen the bar gets a dark ground as soon as the page moves.
  header.classList.toggle('in-hero', y > 24 && y <= heroEnd);

  if (!menu.classList.contains('open')) {
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > heroEnd + 200) {
      header.classList.add('nav-hidden');
      setWork(false);
    } else if (goingUp || y <= heroEnd) {
      header.classList.remove('nav-hidden');
    }
  }

  lastY = y;
  scrollQueued = false;
}

window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });

/* The stage: the still photograph changes to match the section being read */

function setStage(split, key) {
  split.querySelectorAll('.stage-img').forEach(img => img.classList.toggle('is-on', img.dataset.key === key));
  split.querySelectorAll('.stage-caption').forEach(caption => caption.classList.toggle('is-on', caption.dataset.for === key));
}

const firstStage = $('.split-record');
if (firstStage) {
  setStage(firstStage, 'citi');
}

if ('IntersectionObserver' in window) {
  const stageObserver = new IntersectionObserver(entries => {
    if (!desktop.matches) {
      return;
    }
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setStage(entry.target.closest('.split'), entry.target.dataset.stage);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  $$('[data-stage]').forEach(section => stageObserver.observe(section));
}

/* Experience: the panel shows the role being read */

const expPanel = $('.exp-panel');
if (expPanel && 'IntersectionObserver' in window) {
  const jobs = $$('.jobs .job');
  const showJob = index => {
    expPanel.querySelectorAll('[data-job]').forEach(el => el.classList.toggle('is-on', el.dataset.job === String(index)));
  };
  const jobObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        showJob(jobs.indexOf(entry.target));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  jobs.forEach(job => jobObserver.observe(job));
}

/* Work: a deck of featured cards and a slider of smaller ones */

const slider = $('.slider');

// The PDF converter's terminal replays its run once its card is on screen.
const term = $('.cover-term');
if (term && 'IntersectionObserver' in window && !reducedMotion.matches) {
  term.classList.add('is-waiting');
  const termObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      term.classList.replace('is-waiting', 'is-playing');
      termObserver.disconnect();
    }
  }, { threshold: 0.4 });
  termObserver.observe(term);
}

/* Arrival: when an in-page link lands, the section's label is underlined and its heading settles
   (a featured card gets a violet edge instead). Focus moves there for keyboard users. */

function arrive(target) {
  if (!target) {
    return;
  }
  const restart = el => {
    el.classList.remove('is-arriving');
    void el.offsetWidth;
    el.classList.add('is-arriving');
    setTimeout(() => el.classList.remove('is-arriving'), 1900);
  };

  if (target.matches('.card')) {
    // A card in the sideways slider may sit off to the side: bring it into view.
    if (target.matches('.mini')) {
      slider.scrollTo({ left: target.offsetLeft - slider.firstElementChild.offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    restart(target);
  } else {
    const label = target.querySelector('.label');
    if (label) {
      // Underline only the words, also when the label is centred.
      const range = document.createRange();
      range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      const box = label.getBoundingClientRect();
      label.style.setProperty('--arrive-x', `${text.left - box.left}px`);
      label.style.setProperty('--arrive-w', `${text.width}px`);
      restart(label);
    }
    const title = target.querySelector('.title');
    if (title) {
      restart(title);
    }
  }

  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    target.classList.add('is-target');
  }
  target.focus({ preventScroll: true });
}

window.arrive = arrive;

// Without the motion layer (reduced motion, or before it loads) the browser does the jump;
// the arrival cue plays once the page has settled.
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    if (document.documentElement.classList.contains('lenis')) {
      return;
    }
    const target = link.hash === '#top' ? $('.hero') : document.querySelector(link.hash);
    if (!target) {
      return;
    }
    let done = false;
    const land = () => {
      if (!done) {
        done = true;
        arrive(target);
      }
    };
    window.addEventListener('scrollend', land, { once: true });
    setTimeout(land, reducedMotion.matches ? 80 : 900);
  });
});

/* Slider: arrow buttons move one view at a time; they switch off at the ends */

const sliderButtons = $$('.slider-btn');

function updateSlider() {
  if (!slider) {
    return;
  }
  const max = slider.scrollWidth - slider.clientWidth - 2;
  sliderButtons.forEach(button => {
    const forward = button.dataset.dir === '1';
    button.disabled = forward ? slider.scrollLeft >= max : slider.scrollLeft <= 2;
  });
}

sliderButtons.forEach(button => {
  button.addEventListener('click', () => {
    const step = slider.querySelector('.project:not([hidden])')?.getBoundingClientRect().width || slider.clientWidth;
    slider.scrollBy({ left: Number(button.dataset.dir) * (step + 20), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
});

slider?.addEventListener('scroll', () => requestAnimationFrame(updateSlider), { passive: true });
window.addEventListener('resize', updateSlider);
updateSlider();

desktop.addEventListener('change', fitDisplayType);

/* The dashboard recording plays only while on screen, never with reduced motion,
   and the visitor can pause it. */

$$('.has-video').forEach(figure => {
  const video = figure.querySelector('video');
  const button = figure.querySelector('.video-toggle');
  let paused = reducedMotion.matches;

  const sync = visible => {
    if (visible && !paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    button.textContent = paused ? 'Play' : 'Pause';
  };

  button.addEventListener('click', () => {
    paused = !paused;
    sync(true);
  });

  // The still frame loads only as the video nears the screen, so it never slows the first screen.
  const loadPoster = () => {
    if (video.dataset.poster && !video.poster) {
      video.poster = video.dataset.poster;
    }
  };

  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadPoster();
        near.disconnect();
      }
    }, { rootMargin: '1200px 0px' });
    near.observe(video);
    new IntersectionObserver(([entry]) => sync(entry.isIntersecting), { threshold: 0.25 }).observe(video);
  } else {
    loadPoster();
    sync(true);
  }
});

/* Websites: one tab per site, one plate */

const siteTabs = $$('.site-tab');

function showSite(site, focus = false) {
  siteTabs.forEach(tab => {
    const on = tab.dataset.site === site;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) {
      tab.focus();
    }
  });
  $$('.site-panel').forEach(panel => {
    panel.hidden = panel.id !== `site-${site}`;
  });
  $$('.site-shot').forEach(shot => shot.classList.toggle('is-on', shot.dataset.site === site));
  $$('.browser-url').forEach(url => {
    url.hidden = url.dataset.urlFor !== site;
  });
  const view = $('.browser-view');
  if (view) {
    view.scrollTop = 0;
  }
  document.dispatchEvent(new CustomEvent('site:change', { detail: $(`#site-${site}`) }));
}

siteTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showSite(tab.dataset.site));
  tab.addEventListener('keydown', event => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const jump = { Home: 0, End: siteTabs.length - 1 }[event.key];
    if (step || jump !== undefined) {
      event.preventDefault();
      const next = jump !== undefined ? siteTabs[jump] : siteTabs[(index + step + siteTabs.length) % siteTabs.length];
      showSite(next.dataset.site, true);
    }
  });
});

$$('.site-next').forEach(button => {
  button.addEventListener('click', () => {
    const current = siteTabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    showSite(siteTabs[(current + 1) % siteTabs.length].dataset.site);
  });
});

if (siteTabs.length) {
  showSite(siteTabs[0].dataset.site);
}

/* Active section in the navigation */

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id === 'clients' ? 'work' : entry.target.id;
        $$('.nav-links > a').forEach(link => {
          link.classList.toggle('active', link.hash === `#${id}`);
        });
        workToggle.classList.toggle('active', id === 'work');
      }
    });
  }, { rootMargin: '-35% 0px -60% 0px' });

  $$('main section[id]').forEach(section => navObserver.observe(section));
}

/* Photo viewer */

const lightbox = $('.lightbox');
const lightboxImage = document.createElement('img');
lightbox.append(lightboxImage);

$$('.photo-open').forEach(button => {
  button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.full;
    lightboxImage.alt = button.querySelector('img').alt;
    lightbox.showModal();
  });
});

$('.lightbox-close').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

/* Contact: a pop-up form that sends straight to the inbox through Web3Forms (no email app needed) */

// Public by design: Web3Forms keys only allow sending to the owner's inbox.
const WEB3FORMS_KEY = '63737e4c-ef08-4698-8331-9288dce1eff8';

const mailDialog = $('#mailDialog');
const mailForm = $('#mailForm');
const mailStatus = $('#mailStatus');

function openMail() {
  mailStatus.textContent = '';
  mailForm.hidden = false;
  $('#mailDone').hidden = true;
  mailDialog.showModal();
  $('#mailName').focus();
}

$$('.mail-open').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    openMail();
  });
});

$('#mailClose').addEventListener('click', () => mailDialog.close());
$('#mailDoneClose').addEventListener('click', () => mailDialog.close());

mailDialog.addEventListener('click', event => {
  if (event.target === mailDialog) {
    mailDialog.close();
  }
});

// Shake once to point at what went wrong: an empty field on submit, or a failed send.
function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // restart the animation if it is already running
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

mailForm.addEventListener('invalid', event => shake(event.target), true);

mailForm.addEventListener('submit', async event => {
  event.preventDefault();
  const send = mailForm.querySelector('.mail-send');
  const data = new FormData(mailForm);
  data.append('access_key', WEB3FORMS_KEY);
  data.set('subject', `${data.get('subject')} (portfolio message from ${data.get('name')})`);
  data.append('from_name', 'Portfolio contact form');

  send.disabled = true;
  send.classList.add('is-sending');
  send.querySelector('.mail-send-label').textContent = 'Sending…';
  mailStatus.textContent = '';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      // Plain form data skips the browser's CORS preflight, which Web3Forms' firewall can block.
      headers: { Accept: 'application/json' },
      body: data
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Send failed');
    }
    mailForm.reset();
    mailForm.hidden = true;
    $('#mailDone').hidden = false;
    $('#mailDoneTitle').focus();
  } catch {
    // Keep what they typed so nothing is lost.
    mailStatus.textContent = `That did not send. Please try again, or email ${EMAIL} directly.`;
    shake(send);
  } finally {
    send.disabled = false;
    send.classList.remove('is-sending');
    send.querySelector('.mail-send-label').textContent = 'Send message';
  }
});

$('#copyEmail').addEventListener('click', async () => {
  const status = $('#copyStatus');

  try {
    await navigator.clipboard.writeText(EMAIL);
    status.textContent = 'Email copied. Talk soon.';
  } catch {
    status.textContent = `Copy this address: ${EMAIL}`;
  }
});

/* Workflow canvases, after n8n.io: the hero (a typed request becomes a workflow) and How I work. Each is drawn from the data below onto a fixed-size stage that is scaled to its column
   (fitFlows). Decorative: every canvas is aria-hidden; the same facts are in the page's text.
   kind: trigger (rounded on the left), node, agent (wide, tools hang below), tool (round), end (+).
   A node shows a tool logo (logo) or a small drawn icon (glyph). step: How I work reveals nodes by step. */

const FLOWS = {
  // The hero cycles through these, as n8n.io's does: each is typed as a request, built, run, then erased
  // for the next. Each + (with its "Click here") reveals a further chapter; end: where the + moves to.
  hero: [
    // Citi: the weekly APAC run or an ad-hoc ServiceNow request tracked in Jira, then my review of the AI draft, then payment prioritisation and supplier risk.
    {
      w: 1200, h: 470,
      prompt: 'Every Monday, or when an ad-hoc request comes in on ServiceNow, track it in Jira and pull the P2P ledger. Check it for bad rows, refresh the APAC dashboard and send the commentary to the leads on Slack.',
      chips: ['Refresh report', 'Ad-hoc requests', 'AI commentary'],
      nodes: [
        { id: 'monday', kind: 'trigger', logo: 'n8n', label: 'Every Monday, 7:00', x: 90, y: 100 },
        { id: 'request', kind: 'trigger', logo: 'servicenow', label: 'Ad-hoc request in ServiceNow', x: 90, y: 290 },
        { id: 'jira', logo: 'jira', label: 'Track it in Jira', x: 250, y: 290 },
        { id: 'ledger', logo: 'sap', label: 'Pull the P2P ledger', x: 390, y: 190 },
        { id: 'agent', kind: 'agent', label: 'Check the data', x: 610, y: 190 },
        { id: 'tableau', logo: 'tableau', label: 'Refresh the dashboard', x: 830, y: 190 },
        { id: 'slack', logo: 'slack', label: 'Send to the leads', x: 1000, y: 190 },
        { id: 'end', kind: 'end', x: 1130, y: 190 },
        { id: 'claude', kind: 'tool', logo: 'claude', label: 'Claude', x: 440, y: 380 },
        { id: 'sql', kind: 'tool', logo: 'sql', label: 'Validate the rows', x: 610, y: 380 },
        { id: 'python', kind: 'tool', logo: 'python', label: 'Flag outliers', x: 780, y: 380 },
        { id: 'snowflake', kind: 'tool', logo: 'snowflake', label: 'Query last week', x: 950, y: 380 }
      ],
      wires: [['monday', 'ledger'], ['request', 'jira'], ['jira', 'ledger'], ['ledger', 'agent'], ['agent', 'tableau'], ['tableau', 'slack'], ['slack', 'end']],
      tools: [[0, 'claude'], [1, 'sql'], [1, 'python'], [1, 'snowflake']],
      more: [
        {
          nodes: [
            { id: 'review', glyph: 'check', label: 'I review the draft', x: 1140, y: 190 },
            { id: 'approved', glyph: 'branch', label: 'Approved?', x: 1290, y: 190 },
            { id: 'email', logo: 'outlook', label: 'Email the executives', x: 1440, y: 100 },
            { id: 'redraft', logo: 'claude', label: 'Redraft with notes', x: 1440, y: 290 },
            { id: 'log', logo: 'snowflake', label: 'Log the run', x: 1600, y: 190 }
          ],
          wires: [['slack', 'review'], ['review', 'approved'], ['approved', 'email'], ['approved', 'redraft'], ['email', 'log'], ['log', 'end']],
          end: { x: 1740, y: 190 }
        },
        {
          nodes: [
            { id: 'rank', logo: 'python', label: 'Rank payments by risk', x: 1760, y: 190 },
            { id: 'priority', glyph: 'branch', label: 'Priority?', x: 1910, y: 190 },
            { id: 'pay', logo: 'sap', label: 'Queue for payment', x: 2060, y: 100 },
            { id: 'flag', glyph: 'flag', label: 'Flag the supplier', x: 2060, y: 290 },
            { id: 'risk', logo: 'tableau', label: 'Supplier risk view', x: 2220, y: 190 }
          ],
          wires: [['log', 'rank'], ['rank', 'priority'], ['priority', 'pay'], ['priority', 'flag'], ['pay', 'risk'], ['flag', 'risk']]
        }
      ]
    },
    // Astor: the CEO report drafted with AI from SE Ranking and the site analytics.
    {
      w: 1200, h: 470,
      prompt: 'Every Monday at 8:00, pull the SEO and analytics numbers, summarise them with Claude and email the CEO a one-page report.',
      chips: ['CEO report', 'SEO summary', 'Weekly digest'],
      nodes: [
        { id: 'monday', kind: 'trigger', glyph: 'clock', label: 'Every Monday at 8:00', x: 110, y: 200 },
        { id: 'seo', logo: 'seranking', label: 'Pull SEO rankings', x: 300, y: 100 },
        { id: 'traffic', logo: 'lookerstudio', label: 'Pull site analytics', x: 300, y: 300 },
        { id: 'merge', glyph: 'merge', label: 'Merge the numbers', x: 480, y: 200 },
        { id: 'summary', logo: 'claude', label: 'Summarise for the CEO', x: 650, y: 200 },
        { id: 'email', logo: 'outlook', label: 'Email the CEO', x: 830, y: 200 },
        { id: 'end', kind: 'end', x: 980, y: 200 }
      ],
      wires: [['monday', 'seo'], ['monday', 'traffic'], ['seo', 'merge'], ['traffic', 'merge'], ['merge', 'summary'], ['summary', 'email'], ['email', 'end']],
      more: [
        {
          nodes: [
            { id: 'month', glyph: 'branch', label: 'End of the month?', x: 980, y: 200 },
            { id: 'finance', logo: 'excel', label: 'Add the finance summary', x: 1130, y: 110 },
            { id: 'team', logo: 'clickup', label: 'Share with the team', x: 1130, y: 290 }
          ],
          wires: [['email', 'month'], ['month', 'finance'], ['month', 'team']]
        }
      ]
    },
    // Astor: Close CRM call logging and lead status updates, then a follow-up email or a sequence.
    {
      w: 1200, h: 470,
      prompt: 'When a sales call ends in Close CRM, summarise it with Claude, log it and update the lead status. Interested leads get a follow-up email; the rest go into a sequence.',
      chips: ['Call logging', 'Lead status', 'CRM automation'],
      nodes: [
        { id: 'call-end', kind: 'trigger', glyph: 'phone', label: 'Sales call ends in Close', x: 100, y: 200 },
        { id: 'notes', logo: 'claude', label: 'Summarise the call', x: 290, y: 100 },
        { id: 'status', kind: 'agent', glyph: 'agent', label: 'Log it, update the status', x: 520, y: 200, w: 200 },
        { id: 'keen', glyph: 'branch', label: 'Interested?', x: 730, y: 200 },
        { id: 'email', logo: 'outlook', label: 'Send the follow-up email', x: 890, y: 100 },
        { id: 'sequence', glyph: 'mail', label: 'Close CRM sequence', x: 890, y: 300 },
        { id: 'end', kind: 'end', x: 1030, y: 100 }
      ],
      wires: [['call-end', 'notes'], ['notes', 'status'], ['status', 'keen'], ['keen', 'email'], ['keen', 'sequence'], ['email', 'end']],
      more: [
        {
          nodes: [
            { id: 'replied', glyph: 'branch', label: 'Replied?', x: 1040, y: 100 },
            { id: 'call', glyph: 'phone', label: 'Book the next call', x: 1190, y: 44 },
            { id: 'follow', glyph: 'clock', label: 'Follow up in 3 days', x: 1190, y: 190 }
          ],
          wires: [['email', 'replied'], ['replied', 'call'], ['replied', 'follow']]
        }
      ]
    }
  ],
  // How I work: each step adds its part of the workflow.
  method: {
    w: 760, h: 420,
    nodes: [
      { id: 'question', kind: 'trigger', glyph: 'chat', label: 'What must we decide?', x: 70, y: 200, step: 1 },
      { id: 'sql', logo: 'sql', label: 'Validate the rows', x: 210, y: 110, step: 2 },
      { id: 'python', logo: 'python', label: 'Clean and log', x: 210, y: 290, step: 2 },
      { id: 'view', logo: 'tableau', label: 'Build the view', x: 380, y: 200, step: 3 },
      { id: 'filters', glyph: 'filter', label: 'The filters people ask for', x: 530, y: 200, step: 3 },
      { id: 'schedule', kind: 'trigger', logo: 'n8n', label: 'Run every week', x: 380, y: 360, step: 4 },
      { id: 'send', logo: 'slack', label: 'Send it', x: 680, y: 200, step: 4 }
    ],
    wires: [['question', 'sql'], ['question', 'python'], ['sql', 'view'], ['python', 'view'], ['view', 'filters'], ['schedule', 'filters'], ['filters', 'send']]
  }
};

// Small line icons for steps that have no product logo, drawn in the node's ink colour.
const GLYPHS = {
  agent: '<rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 7V4M9 13h.01M15 13h.01M2 12v3M22 12v3"/>',
  chat: '<path d="M4.5 6.5a2 2 0 012-2h11a2 2 0 012 2v8a2 2 0 01-2 2H11l-4.5 3.5v-3.5h0a2 2 0 01-2-2z"/>',
  filter: '<path d="M4 5.5h16l-6.2 7.2V19l-3.6-1.8v-4.5z"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.5 2.5 5-5.3"/>',
  branch: '<path d="M3.5 12H8c3 0 3.5-6 7.5-6h3M8 12c3 0 3.5 6 7.5 6h3M17 3.5L19.5 6 17 8.5M17 15.5l2.5 2.5-2.5 2.5"/>',
  mail: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M4 7l8 6 8-6"/>',
  flag: '<path d="M6 21V4M6 4.5h11.5l-2.5 4 2.5 4H6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  merge: '<path d="M4 6h3.5c4 0 4.5 6 8.5 6h4M4 18h3.5c4 0 4.5-6 8.5-6M17 9l3 3-3 3"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 005 5L15.3 12l4 1.5v3A2 2 0 0117 18.5 14 14 0 014.5 6 2 2 0 016.5 4z"/>'
};

const svgIcon = name => `<svg class="flow-glyph" viewBox="0 0 24 24">${GLYPHS[name]}</svg>`;

// A soft S between two points, sideways along a line or downwards to a tool, like n8n's wires.
function flowCurve([sx, sy], [ex, ey], down = false) {
  if (down) {
    const bend = (ey - sy) / 2;
    return `M${sx} ${sy} C${sx} ${sy + bend} ${ex} ${ey - bend} ${ex} ${ey}`;
  }
  const bend = Math.max(36, (ex - sx) / 2);
  return `M${sx} ${sy} C${sx + bend} ${sy} ${ex - bend} ${ey} ${ex} ${ey}`;
}

const halfWidth = node => (node.kind === 'agent' ? (node.w || 220) / 2 : node.kind === 'end' ? 12 : 32);

// How far along the run each node sits: 0 for a trigger, one more than the furthest node feeding it.
// The motion layer builds and runs the canvas in this order, so parallel branches move together.
function flowDepths(flow) {
  const depth = {};
  const visit = id => {
    if (depth[id] !== undefined) return depth[id];
    const feeds = flow.wires.filter(([, to]) => to === id).map(([from]) => visit(from));
    depth[id] = feeds.length ? Math.max(...feeds) + 1 : 0;
    return depth[id];
  };
  flow.nodes.forEach(n => visit(n.id));
  const agent = flow.nodes.find(n => n.kind === 'agent');
  // Tools hang off the agent and arrive just after it.
  (flow.tools || []).forEach(([, id]) => { depth[id] = depth[agent.id] + 0.5; });
  return depth;
}

const NS = 'http://www.w3.org/2000/svg';
const makeHtml = (tag, className, parent, text) => {
  const el = document.createElement(tag);
  el.className = className;
  if (text) el.textContent = text;
  parent.append(el);
  return el;
};
const makeSvg = (tag, attrs, parent) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  parent.append(el);
  return el;
};

// Adds nodes and the wires between them to a canvas, and returns what it added. The first draw and
// every chapter the + reveals go through here, so depths (run order) always cover the whole workflow.
function addToFlow(view, nodes, wires) {
  const flow = view.flow;
  const stage = view.querySelector('.flow-stage');
  const svg = stage.querySelector('.flow-wires');
  const byId = view.flowNodes;
  nodes.forEach(node => { byId[node.id] = node; });
  view.flowWires.push(...wires);
  const depth = flowDepths({ nodes: Object.values(byId), wires: view.flowWires, tools: flow.tools });
  const stepOf = id => byId[id].step || 1;
  const added = [];

  wires.forEach(([from, to]) => {
    const a = byId[from];
    const b = byId[to];
    const start = [a.x + halfWidth(a), a.y];
    const end = [b.x - halfWidth(b), b.y];
    const d = flowCurve(start, end);
    const group = makeSvg('g', { class: 'flow-link', 'data-to': to, 'data-depth': depth[from], 'data-step': Math.max(stepOf(from), stepOf(to)) }, svg);
    makeSvg('path', { class: 'flow-wire', d, pathLength: 1 }, group);
    makeSvg('path', { class: 'flow-run', d, pathLength: 1 }, group);
    makeSvg('circle', { class: 'flow-port', cx: start[0], cy: start[1], r: 4 }, group);
    if (b.kind !== 'end') makeSvg('circle', { class: 'flow-port', cx: end[0], cy: end[1], r: 4 }, group);
    added.push(group);
  });

  nodes.forEach(node => {
    const el = makeHtml('div', `flow-node is-${node.kind || 'node'}`, stage);
    Object.assign(el.dataset, { id: node.id, depth: depth[node.id], step: stepOf(node.id) });
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    if (node.kind === 'end' && flow.more) {
      // The + is a real control, as on n8n.io: it reveals the next chapter of the workflow.
      const button = makeHtml('button', 'flow-card flow-more', el, '+');
      button.type = 'button';
      button.setAttribute('aria-label', 'Reveal more of the workflow');
      button.addEventListener('click', () => revealMore(view));
      // n8n.io's pink "Click here" tag beside the +, pointing visitors at it.
      makeHtml('span', 'flow-hint', el, 'Click here').setAttribute('aria-hidden', 'true');
      added.push(el);
      return;
    }
    el.setAttribute('aria-hidden', 'true');
    const card = makeHtml('div', 'flow-card', el);
    if (node.kind === 'agent') {
      card.style.width = `${node.w || 220}px`;
      card.innerHTML = svgIcon(node.glyph || 'agent');
      makeHtml('span', 'flow-agent-name', card, node.label);
    } else if (node.kind === 'end') {
      card.textContent = '+';
    } else {
      if (node.logo) {
        const logo = makeHtml('img', '', card);
        logo.src = `assets/logos/${node.logo}.svg`;
        logo.alt = '';
      } else {
        card.innerHTML = svgIcon(node.glyph);
      }
      makeHtml('span', 'flow-label', el, node.label);
    }
    added.push(el);
  });
  // How far right the workflow now reaches, for the camera.
  view.dataset.extent = Math.max(flow.w, ...Object.values(byId).map(n => n.x + 120));
  return added;
}

// Draws a canvas's workflow; the hero has several and draws the one at view.flowIndex.
function drawFlow(view) {
  const set = FLOWS[view.dataset.flow];
  const flow = Array.isArray(set) ? set[(view.flowIndex || 0) % set.length] : set;
  const stage = view.querySelector('.flow-stage');
  if (!flow || !stage) {
    return;
  }
  view.flow = flow;
  stage.replaceChildren();
  view.style.setProperty('--w', `${flow.w}px`);
  view.style.setProperty('--h', `${flow.h}px`);
  view.flowNodes = {};
  view.flowWires = [];
  view.revealed = 0;
  // Wires first, so the nodes sit on top of them.
  makeSvg('svg', { class: 'flow-wires', viewBox: `0 0 ${flow.w} ${flow.h}`, 'aria-hidden': 'true' }, stage);
  addToFlow(view, flow.nodes, flow.wires);

  const agent = flow.nodes.find(n => n.kind === 'agent');
  if (agent && flow.tools) {
    const svg = stage.querySelector('.flow-wires');
    const sockets = [-halfWidth(agent) + 50, -halfWidth(agent) + 110];
    sockets.slice(0, Math.max(...flow.tools.map(([socket]) => socket)) + 1).forEach(dx => {
      const [x, y] = [agent.x + dx, agent.y + 32];
      makeSvg('rect', { class: 'flow-socket', x: x - 4.5, y: y - 4.5, width: 9, height: 9, transform: `rotate(45 ${x} ${y})` }, svg);
    });
    flow.tools.forEach(([socket, id]) => {
      const tool = view.flowNodes[id];
      const d = flowCurve([agent.x + sockets[socket], agent.y + 37], [tool.x, tool.y - 32], true);
      makeSvg('path', { class: 'flow-tool-wire', d }, svg);
    });
  }

  if (flow.prompt) {
    const prompt = makeHtml('div', 'flow-prompt', stage);
    prompt.setAttribute('aria-hidden', 'true');
    const box = makeHtml('div', 'flow-box', prompt);
    const line = makeHtml('p', 'flow-text', box);
    makeHtml('span', 'flow-typed', line, flow.prompt);
    makeHtml('span', 'flow-caret', line);
    box.insertAdjacentHTML('beforeend', '<div class="flow-tools"><svg viewBox="0 0 24 24"><path d="M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.3 3.3 0 014.7 4.7L10.2 17a1.7 1.7 0 01-2.4-2.4L15.5 7"/></svg><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg><span class="flow-send"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span></div>');
    const chips = makeHtml('div', 'flow-chips', prompt);
    flow.chips.forEach(chip => makeHtml('span', 'flow-chip', chips, chip));
  }
}

// Where the camera sits (in screen px) to put stage x in the middle of the column, kept inside the workflow.
function flowPan(view, x) {
  const k = parseFloat(getComputedStyle(view).getPropertyValue('--k')) || 1;
  const w = view.clientWidth;
  const extent = Number(view.dataset.extent) || view.flow.w;
  return Math.min(0, Math.max(Math.min(0, w - extent * k), w / 2 - x * k));
}
window.flowPan = flowPan;

// The hero's next workflow (motion.js calls this as it cycles).
window.showHeroFlow = (view, index) => {
  view.flowIndex = index;
  drawFlow(view);
  fitFlows();
};

// The + adds the next chapter: its wire into the old + is redrawn to the new nodes, the + moves to the
// new end (or leaves when the run is complete), and screen readers hear which steps were added.
function revealMore(view) {
  const flow = view.flow;
  const chapter = flow.more?.[view.revealed];
  if (!chapter) {
    return;
  }
  view.revealed += 1;
  const stage = view.querySelector('.flow-stage');
  const end = stage.querySelector('.flow-node.is-end');
  stage.querySelector('.flow-link[data-to="end"]')?.remove();
  view.flowWires = view.flowWires.filter(([, to]) => to !== 'end');
  if (chapter.end) {
    Object.assign(view.flowNodes.end, chapter.end);
    end.style.left = `${chapter.end.x}px`;
    end.style.top = `${chapter.end.y}px`;
  }
  const added = addToFlow(view, chapter.nodes, chapter.wires);
  const done = !chapter.end;
  const xs = chapter.nodes.map(n => n.x);
  const focus = (Math.min(...xs) + Math.max(...xs)) / 2;
  const note = view.parentElement.querySelector('.flow-live');
  if (note) note.textContent = `Added to the workflow: ${chapter.nodes.map(n => n.label).join(', ')}.`;
  if (done) {
    // A keyboard user on the + would lose their place when it goes, so focus moves to the button below the canvas.
    if (end.contains(document.activeElement)) view.parentElement.querySelector('.flow-actions .expand')?.focus();
    end.hidden = true;
  }
  if (window.flowMotion) {
    document.dispatchEvent(new CustomEvent('flow:reveal', { detail: { view, added, end, done, focus } }));
  } else {
    view.querySelector('.flow-pan').style.transform = `translateX(${flowPan(view, focus)}px)`;
  }
}

// Each stage is laid out at its own size and scaled to its column. The hero keeps a floor (data-min)
// so it stays legible on a phone and pans instead; How I work simply shrinks to fit.
function fitFlows() {
  $$('.flow-view').forEach(view => {
    const flow = view.flow;
    if (!flow) return;
    const floor = Number(view.dataset.min || 0);
    const scale = Math.min(1, Math.max(floor, view.clientWidth / flow.w));
    view.style.setProperty('--k', scale.toFixed(4));
  });
}

/* How I work: the canvas shows the steps up to the open one (see the step list below). */
function showMethodStep(step) {
  $$('.flow-view[data-flow="method"] [data-step]').forEach(el => {
    el.classList.toggle('is-later', Number(el.dataset.step) > step);
  });
}

/* Expand buttons ("See how I did it +"): each opens the region it controls, in place.
   Without JavaScript the regions are simply open. */
function setExpanded(button, open) {
  const region = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', String(open));
  region?.classList.toggle('is-open', open);
  button.dispatchEvent(new CustomEvent('expand:change', { bubbles: true, detail: { open, region } }));
}

// The How I work steps open one at a time, so they have their own handler below.
$$('.expand:not(.step-toggle)').forEach(button => {
  button.addEventListener('click', () => setExpanded(button, button.getAttribute('aria-expanded') !== 'true'));
});

/* How I work: one step open at a time; opening one shows its part of the canvas. */
const methodSteps = $$('.step-toggle');
function openMethodStep(index, byVisitor = false) {
  methodSteps.forEach((other, i) => setExpanded(other, i === index));
  showMethodStep(index + 1);
  document.dispatchEvent(new CustomEvent('method:step', { detail: { step: index + 1, byVisitor } }));
}
methodSteps.forEach((button, index) => button.addEventListener('click', () => openMethodStep(index, true)));
window.openMethodStep = openMethodStep;


$$('.flow-view').forEach(drawFlow);
fitFlows();
showMethodStep(1);

/* Tools cloud: one chip per logo in the tool list. It rests as a row; motion.js sets the chips drifting. */
const cloud = $('.tool-cloud');
if (cloud) {
  const seen = new Set();
  $$('#toolGroups .skill-logo img').forEach(img => {
    if (seen.has(img.src)) return;
    seen.add(img.src);
    const chip = document.createElement('span');
    chip.append(img.cloneNode());
    cloud.append(chip);
  });
  cloud.classList.add('is-still');
}

/* Start */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    fitDisplayType();
    fitFlows();
  }, 120);
});

fitDisplayType();
onScroll();
document.fonts?.ready.then(fitDisplayType);
