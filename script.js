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

const projectCards = $$('.proj-card');
const filterAnimations = new Map();
let currentProjectFilter = 'all';

function cancelFilterAnimations() {
  filterAnimations.forEach((animation, card) => {
    animation.cancel();
    card.classList.remove('filter-animating');
  });

  filterAnimations.clear();
}

$$('.filter-btn').forEach(button => {
  button.setAttribute(
    'aria-pressed',
    String(button.classList.contains('active'))
  );

  button.addEventListener('click', () => {
    const nextFilter = button.dataset.filter;

    $$('.filter-btn').forEach(filterButton => {
      const active = filterButton === button;

      filterButton.classList.toggle('active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });

    if (nextFilter === currentProjectFilter) {
      return;
    }

    cancelFilterAnimations();

    const firstPositions = new Map();
    projectCards.forEach(card => {
      if (!card.hidden) {
        firstPositions.set(card, card.getBoundingClientRect());
      }
    });

    projectCards.forEach(card => {
      card.classList.add('filter-animating');
    });

    let count = 0;

    projectCards.forEach(card => {
      card.hidden = nextFilter !== 'all' &&
        !card.dataset.tags.split(' ').includes(nextFilter);

      if (!card.hidden) {
        count++;
        card.classList.add('visible');
      }
    });

    const lastPositions = new Map();
    projectCards.forEach(card => {
      if (!card.hidden) {
        lastPositions.set(card, card.getBoundingClientRect());
      }
    });

    currentProjectFilter = nextFilter;
    $('#filterStatus').textContent = `${count} projects shown`;

    if (reducedMotion.matches || !Element.prototype.animate) {
      projectCards.forEach(card => {
        card.classList.remove('filter-animating');
      });
      return;
    }

    projectCards.forEach(card => {
      const last = lastPositions.get(card);

      if (!last) {
        card.classList.remove('filter-animating');
        return;
      }

      const first = firstPositions.get(card);
      const appearing = !first;
      const deltaX = first ? first.left - last.left : 0;
      const deltaY = first ? first.top - last.top : 18;

      if (!appearing && deltaX === 0 && deltaY === 0) {
        card.classList.remove('filter-animating');
        return;
      }

      const animation = card.animate(
        [
          {
            opacity: appearing ? 0.25 : 1,
            transform: `translate(${deltaX}px, ${deltaY}px)`
          },
          { opacity: 1, transform: 'translate(0, 0)' }
        ],
        {
          duration: 480,
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        }
      );

      filterAnimations.set(card, animation);
      animation.addEventListener('finish', () => {
        if (filterAnimations.get(card) === animation) {
          filterAnimations.delete(card);
          card.classList.remove('filter-animating');
        }
      }, { once: true });
    });
  });

});

window.addEventListener('resize', cancelFilterAnimations, { passive: true });

/* Decorative heading and project-cover drawing animations */

const decorativeAnimations = new Set();
const drawingAnimations = new Map();
const headingAnimations = new Set();
const illustrationEasing = 'cubic-bezier(.33, 0, .2, 1)';

function rememberAnimation(animation, collection) {
  collection.add(animation);
  animation.addEventListener('finish', () => collection.delete(animation), {
    once: true
  });
  animation.addEventListener('cancel', () => collection.delete(animation), {
    once: true
  });
  return animation;
}

function cancelDecorativeAnimations() {
  [...decorativeAnimations].forEach(animation => animation.cancel());
  [...headingAnimations].forEach(animation => animation.cancel());
  decorativeAnimations.clear();
  headingAnimations.clear();
  drawingAnimations.clear();
}

function finishIllustration(svg) {
  svg.querySelectorAll('.draw-line').forEach(path => {
    path.style.strokeDashoffset = '0';
  });
  svg.querySelectorAll('.draw-node').forEach(node => {
    node.style.opacity = '1';
  });
  svg.querySelectorAll('.draw-bar').forEach(bar => {
    bar.style.transform = 'scaleY(1)';
  });
}

function prepareIllustration(svg) {
  svg.querySelectorAll('.draw-line').forEach(path => {
    const length = path.getTotalLength();

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.dataset.drawLength = `${length}`;
  });
  svg.querySelectorAll('.draw-node').forEach(node => {
    node.style.opacity = '0';
  });
  svg.querySelectorAll('.draw-bar').forEach(bar => {
    bar.style.transform = 'scaleY(0)';
  });
}

function playIllustration(svg) {
  drawingAnimations.get(svg)?.forEach(animation => animation.cancel());
  drawingAnimations.delete(svg);

  if (reducedMotion.matches || !svg.animate) {
    finishIllustration(svg);
    return;
  }

  const animations = [];
  svg.querySelectorAll('.draw-line').forEach((path, index) => {
    animations.push(rememberAnimation(
      path.animate(
        [
          { strokeDashoffset: path.dataset.drawLength },
          { strokeDashoffset: '0' }
        ],
        {
          duration: 2500,
          delay: index * 125,
          easing: illustrationEasing,
          fill: 'forwards'
        }
      ),
      decorativeAnimations
    ));
  });
  svg.querySelectorAll('.draw-node').forEach((node, index) => {
    animations.push(rememberAnimation(
      node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 500,
        delay: 650 + index * 125,
        easing: illustrationEasing,
        fill: 'forwards'
      }),
      decorativeAnimations
    ));
  });
  svg.querySelectorAll('.draw-bar').forEach((bar, index) => {
    animations.push(rememberAnimation(
      bar.animate(
        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        {
          duration: 2200,
          delay: index * 125,
          easing: illustrationEasing,
          fill: 'forwards'
        }
      ),
      decorativeAnimations
    ));
  });
  drawingAnimations.set(svg, animations);
}

const coverIllustrations = $$('.cover-illustration');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

if (reducedMotion.matches) {
  coverIllustrations.forEach(svg => {
    prepareIllustration(svg);
    finishIllustration(svg);
  });
} else {
  coverIllustrations.forEach(prepareIllustration);
}

coverIllustrations.forEach(svg => {
  svg.closest('.project-cover').addEventListener('pointerenter', () => {
    if (finePointer.matches) {
      playIllustration(svg);
    }
  });
});

document.addEventListener('focusin', event => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const card = event.target.closest('.proj-card');

  if (
    card &&
    !card.contains(event.relatedTarget) &&
    event.target !== card
  ) {
    const svg = card.querySelector('.cover-illustration');

    if (svg) {
      playIllustration(svg);
    }
  }
});

const headingTargets = $$('h1, h2').filter(heading =>
  heading.querySelector('.heading-line')
);

function revealHeading(heading) {
  if (reducedMotion.matches) {
    return;
  }

  [...heading.querySelectorAll('.heading-line')].forEach((line, index) => {
    const mask = line.parentElement;
    const delay = index * 110;

    rememberAnimation(
      mask.animate(
        [
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 -5% 0)' }
        ],
        {
          duration: 850,
          delay,
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        }
      ),
      headingAnimations
    );
    rememberAnimation(
      line.animate(
        [
          { opacity: 0, transform: 'translateY(105%)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 850,
          delay,
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        }
      ),
      headingAnimations
    );
  });
}

if ('IntersectionObserver' in window) {
  const headingObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealHeading(entry.target);
        headingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  headingTargets.forEach(heading => headingObserver.observe(heading));
}

const brand = $('.brand');
const brandDot = $('.brand-dot');

if (!reducedMotion.matches && brand.animate) {
  rememberAnimation(
    brand.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 650,
        easing: 'cubic-bezier(.22, 1, .36, 1)'
      }
    ),
    decorativeAnimations
  );

  if (brandDot.animate) {
    rememberAnimation(
      brandDot.animate(
        [
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(0)' }
        ],
        {
          duration: 430,
          delay: 220,
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        }
      ),
      decorativeAnimations
    );
  }
}

const experienceCards = $$('#experience .exp-card');

function revealTimelineEntry(card) {
  card.classList.add('timeline-visible');
}

if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  experienceCards.forEach(revealTimelineEntry);
} else {
  const timelineObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealTimelineEntry(entry.target);
        timelineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  experienceCards.forEach(card => timelineObserver.observe(card));
}

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

          if (entry.target.matches('.proj-card')) {
            const illustration = entry.target.querySelector(
              '.cover-illustration'
            );

            if (illustration) {
              playIllustration(illustration);
            }
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06 }
  );

  $$(
    '.proj-card, .exp-card, .cert-card, ' +
    '.about-grid > div:not(:first-child), ' +
    '.about-grid > div:first-child > :not(h2), ' +
    '.section-head > .section-label, .section-head > p'
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
} else {
  coverIllustrations.forEach(playIllustration);
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
  if (reducedMotion.matches) {
    cancelFilterAnimations();
    cancelDecorativeAnimations();
    coverIllustrations.forEach(finishIllustration);
    experienceCards.forEach(revealTimelineEntry);
  }

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