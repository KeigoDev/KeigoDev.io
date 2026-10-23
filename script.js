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

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => sync(entry.isIntersecting), { threshold: 0.25 }).observe(video);
  } else {
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

/* Start */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitDisplayType, 120);
});

fitDisplayType();
onScroll();
document.fonts?.ready.then(fitDisplayType);
