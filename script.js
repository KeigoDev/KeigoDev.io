'use strict';

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
);

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function motion(element, frames, duration = 350) {
  if (!reducedMotion.matches && element.animate) {
    element.animate(frames, {
      duration,
      easing: 'cubic-bezier(.22,1,.36,1)'
    });
  }
}

/* Mobile navigation */

const menu = $('#navLinks');
const toggle = $('#navToggle');

function closeMenu() {
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

$$('.nav-links a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

/* Expandable project and experience details */

$$('.proj-more').forEach((button, index) => {
  const panel = button.nextElementSibling;

  panel.id = `detail-${index}`;
  panel.hidden = true;

  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panel.id);

  button.addEventListener('click', () => {
    const open = panel.hidden;

    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.firstChild.textContent = open ? 'Hide details ' : 'Details ';

    if (open) {
      motion(panel, [
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ]);
    }
  });
});

/* Project filters */

$$('.filter-btn').forEach(button => {
  button.setAttribute(
    'aria-pressed',
    String(button.classList.contains('active'))
  );

  button.addEventListener('click', () => {
    let count = 0;

    $$('.filter-btn').forEach(filterButton => {
      const active = filterButton === button;

      filterButton.classList.toggle('active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });

    $$('.proj-card').forEach(card => {
      card.hidden =
        button.dataset.filter !== 'all' &&
        !card.dataset.tags.split(' ').includes(button.dataset.filter);

      if (!card.hidden) {
        count++;
        card.classList.add('visible');

        motion(
          card,
          [
            { opacity: 0.3, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          400
        );
      }
    });

    $('#filterStatus').textContent = `${count} projects shown`;
  });
});

/* Graduation gallery */

$('#galleryToggle').addEventListener('click', () => {
  const gallery = $('#educationGallery');
  const button = $('#galleryToggle');

  gallery.hidden = !gallery.hidden;

  button.setAttribute('aria-expanded', String(!gallery.hidden));

  button.innerHTML =
    (gallery.hidden
      ? 'View graduation photos'
      : 'Hide graduation photos') +
    ' <span aria-hidden="true">' +
    (gallery.hidden ? '+' : '−') +
    '</span>';
});

/* Full-size photo viewer */

const dialog = $('.gallery-lightbox');

$$('.gallery-item, .career-photo-trigger').forEach(button => {
  button.addEventListener('click', () => {
    const image = dialog.querySelector('img');

    image.src = button.dataset.full;
    image.alt = button.querySelector('img').alt;

    dialog.showModal();
  });
});

$('.gallery-close').addEventListener('click', () => {
  dialog.close();
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();

    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      dialog.close();
    }
  }
});

/* Copy email */

$('#copyEmail').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('matthew.p.ferrer@gmail.com');
    $('#copyStatus').textContent = 'Email copied.';
  } catch {
    $('#copyStatus').textContent =
      'Copy this address: matthew.p.ferrer@gmail.com';
  }
});

/* Reveal animations and active navigation */

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06 }
  );

  $$(
    '.section-head, .proj-card, .exp-card, .cert-card, .about-grid'
  ).forEach(element => {
    element.classList.add('reveal-ready');

    if (element.parentElement.matches('.proj-grid, .cert-grid')) {
      const index = [...element.parentElement.children].indexOf(element);

      element.style.setProperty(
        '--reveal-delay',
        `${(index % 3) * 70}ms`
      );
    }

    observer.observe(element);
  });

  const navObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.nav-links a').forEach(link => {
            link.classList.toggle(
              'active',
              link.hash === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-15% 0px -60% 0px' }
  );

  $$('section[id]').forEach(section => {
    navObserver.observe(section);
  });
}

/* Scroll progress and animation scheduling */

const progress = $('.reading-progress');
const header = $('.site-nav');

let scrollQueued = false;
let depthItems = [];

function updateScroll() {
  const range =
    document.documentElement.scrollHeight - window.innerHeight;

  progress.style.transform = `scaleX(${
    range > 0
      ? Math.min(1, Math.max(0, window.scrollY / range))
      : 0
  })`;

  header.classList.toggle('scrolled', window.scrollY > 24);

  updateDepth();
  updateHeroZoom();

  scrollQueued = false;
}

function queueScroll() {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }
}

window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', queueScroll, { passive: true });

if ('ResizeObserver' in window) {
  new ResizeObserver(queueScroll).observe(document.body);
}

updateScroll();

/* Responsive menu dismissal */

window.matchMedia('(min-width: 781px)').addEventListener(
  'change',
  event => {
    if (event.matches) {
      closeMenu();
    }
  }
);

document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.site-nav')) {
    closeMenu();
  }
});

menu.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
    if (!header.contains(document.activeElement)) {
      closeMenu();
    }
  });
});

/* Reveal keyboard-focused content immediately */

document.addEventListener('focusin', event => {
  const item = event.target.closest('.reveal-ready');

  if (item) {
    item.classList.add('visible');
  }
});

/* Reversible 3D scroll zoom */

function depthValues(center, viewport, compact) {
  const position = Math.max(
    -1,
    Math.min(1, (center - viewport * 0.5) / (viewport * 0.65))
  );

  const distance = Math.abs(position);
  const depth = distance * distance * (3 - 2 * distance);

  return {
    tilt: -position * (compact ? 1.5 : 3),
    scale: 1 - depth * (compact ? 0.075 : 0.18),
    z: -depth * (compact ? 25 : 85)
  };
}

function updateDepth() {
  if (!depthItems.length) {
    return;
  }

  const viewport = window.innerHeight;
  const compact = window.innerWidth <= 780;

  const poses = depthItems.map(({ surface, anchor }) => {
    if (surface.closest('[hidden]')) {
      return null;
    }

    const rect = anchor.getBoundingClientRect();

    if (rect.top > viewport + 250 || rect.bottom < -250) {
      return null;
    }

    return {
      surface,
      ...depthValues(
        rect.top + surface.offsetHeight / 2,
        viewport,
        compact
      )
    };
  });

  poses.forEach(pose => {
    if (!pose) {
      return;
    }

    const { surface, tilt, scale, z } = pose;

    const calm =
      reducedMotion.matches ||
      surface.contains(document.activeElement);

    surface.style.setProperty(
      '--depth-tilt',
      calm ? '0deg' : `${tilt.toFixed(3)}deg`
    );

    surface.style.setProperty(
      '--depth-scale',
      calm ? '1' : scale.toFixed(4)
    );

    surface.style.setProperty(
      '--depth-z',
      calm ? '0px' : `${z.toFixed(2)}px`
    );
  });
}

depthItems = $$(
  '.project-cover, .career-photo-trigger, .gallery-item'
).map(surface => {
  const anchor = document.createElement('div');

  anchor.className = 'depth-anchor';

  surface.before(anchor);
  anchor.append(surface);
  surface.classList.add('depth-surface');

  return { surface, anchor };
});

reducedMotion.addEventListener('change', () => {
  depthItems.forEach(({ surface }) => {
    surface.style.removeProperty('--depth-tilt');
    surface.style.removeProperty('--depth-scale');
    surface.style.removeProperty('--depth-z');
  });

  queueScroll();
});

document.addEventListener('focusin', queueScroll);
document.addEventListener('focusout', queueScroll);

queueScroll();

/* Main portrait scroll zoom */

function updateHeroZoom() {
  const hero = document.querySelector('.hero');

  if (!hero) {
    return;
  }

  const rect = hero.getBoundingClientRect();

  const progress = Math.max(
    0,
    Math.min(1, -rect.top / Math.max(1, rect.height))
  );

  const amount = window.innerWidth <= 780 ? 0.08 : 0.16;

  hero.style.setProperty(
    '--hero-zoom',
    reducedMotion.matches
      ? '1'
      : (1 + progress * amount).toFixed(4)
  );
}