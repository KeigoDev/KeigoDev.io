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

function closeMenu() {
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

/* Project drawing (the PDF converter cover) */

function drawCover(svg) {
  const paths = [...svg.querySelectorAll('.draw-line')];
  if (reducedMotion.matches || !svg.animate) {
    return;
  }
  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.animate(
      [{ strokeDasharray: length, strokeDashoffset: length }, { strokeDasharray: length, strokeDashoffset: 0 }],
      { duration: 1600, delay: index * 110, easing: ease }
    );
  });
}

/* Work: a deck of featured cards and a slider of smaller ones */

const slider = $('.slider');

// The PDF converter's drawing plays once its card is on screen.
if ('IntersectionObserver' in window) {
  const drawObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        drawCover(entry.target);
        drawObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  $$('.cover-illustration').forEach(svg => drawObserver.observe(svg));
}

/* Links to a featured card. On desktop the cards stick and stack, so a plain jump can land
   with a later card on top. Scroll to the point where the chosen card arrives instead. */

function deckScrollY(card) {
  if (getComputedStyle(card).position !== 'sticky') {
    return null;
  }
  const stickTop = parseFloat(getComputedStyle(card).top) || 0;
  // Measure where the card sits in the page flow, as if it did not stick.
  card.style.position = 'static';
  const box = card.getBoundingClientRect();
  card.style.position = '';
  // The last card has no room left in the deck to stick, so it lands just under the menu bar.
  const room = card.parentElement.getBoundingClientRect().bottom - box.bottom;
  const landAt = Math.max(Math.min(stickTop, room), 88);
  return Math.max(0, box.top + window.scrollY - landAt);
}

window.deckScrollY = deckScrollY;

$$('a[href^="#p-"]').forEach(link => {
  link.addEventListener('click', event => {
    const card = document.querySelector(link.hash);
    // With smooth scrolling on, motion.js handles the jump.
    if (!card || document.documentElement.classList.contains('lenis')) {
      return;
    }
    const y = deckScrollY(card);
    if (y !== null) {
      event.preventDefault();
      window.scrollTo({ top: y, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  });
});

/* Arrival: when an in-page link lands, the section's label is underlined and its heading settles
   (a featured card gets a copper edge instead). Focus moves there for keyboard users. */

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

/* Websites: three tabs, one plate */

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
        $$('.nav-links a').forEach(link => {
          link.classList.toggle('active', link.hash === `#${id}`);
        });
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

/* Contact: the one field writes the email for the visitor */

$('#contactForm').addEventListener('submit', event => {
  event.preventDefault();
  const message = $('#contactMessage').value.trim();
  const subject = encodeURIComponent('Hello from your portfolio');
  const body = encodeURIComponent(message ? `${message}\n\n` : '');
  window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  $('#copyStatus').textContent = 'Opening your email app. If nothing opens, use the address below.';
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

/* Hero network: 26 points, one per tool, clustered by tool group
   (engineering, BI, data science, platforms, AI). Fixed positions, the same on every visit; decorative. */

function drawNetwork() {
  const svg = $('.hero-net');
  if (!svg) {
    return;
  }
  const ns = 'http://www.w3.org/2000/svg';
  let seed = 26;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const clusters = [
    { x: 760, y: 120, n: 3, r: 70 },   // data engineering
    { x: 900, y: 330, n: 5, r: 100 },  // BI and visualisation
    { x: 1040, y: 110, n: 3, r: 70 },  // data science
    { x: 860, y: 640, n: 11, r: 150 }, // business platforms
    { x: 1380, y: 700, n: 4, r: 80 }   // AI and automation
  ];
  const nodes = [];
  clusters.forEach((c, ci) => {
    for (let i = 0; i < c.n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * c.r;
      nodes.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, c: ci });
    }
  });
  const lines = [];
  nodes.forEach((p, i) => {
    // Each point links to its two nearest neighbours in the same cluster.
    nodes
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y), same: q.c === p.c }))
      .filter(o => o.j !== i && o.same)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(o => {
        if (!lines.some(l => (l[0] === o.j && l[1] === i))) {
          lines.push([i, o.j]);
        }
      });
  });
  // Bridges between the groups: engineering to BI to science, and on to the platforms and AI.
  [[0, 3], [7, 8], [10, 11], [9, 22]].forEach(pair => lines.push(pair));
  const frag = document.createDocumentFragment();
  lines.forEach(([a, b]) => {
    const l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', nodes[a].x.toFixed(1));
    l.setAttribute('y1', nodes[a].y.toFixed(1));
    l.setAttribute('x2', nodes[b].x.toFixed(1));
    l.setAttribute('y2', nodes[b].y.toFixed(1));
    frag.append(l);
  });
  nodes.forEach(p => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', p.x.toFixed(1));
    c.setAttribute('cy', p.y.toFixed(1));
    c.setAttribute('r', (1.6 + rand() * 2.4).toFixed(1));
    frag.append(c);
  });
  svg.append(frag);
}

drawNetwork();

/* Start */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitDisplayType, 120);
});

fitDisplayType();
onScroll();
document.fonts?.ready.then(fitDisplayType);
