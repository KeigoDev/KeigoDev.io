// Mobile nav toggle
document.documentElement.classList.add('js');

// Keep the navigation progress indicator synced with document scroll
const scrollProgress = document.getElementById('scrollProgress');
const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${progress / 100})`;
};

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });
}

// Make snapshot metrics jump to their related portfolio sections
document.querySelectorAll('.kpi-cell[data-target]').forEach(cell => {
  cell.addEventListener('click', () => {
    document.getElementById(cell.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
    navLinks?.classList.remove('open');
  });
});

// Let keyboard and pointer users focus one career milestone at a time
document.querySelectorAll('.selectable').forEach(item => {
  const selectItem = () => {
    document.querySelectorAll('.selectable').forEach(entry => entry.classList.remove('selected'));
    item.classList.add('selected');
  };

  item.addEventListener('click', selectItem);
  item.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectItem();
    }
  });
});

// Highlight a selected skill without changing the page layout
document.querySelectorAll('.skill-row').forEach(skill => {
  skill.addEventListener('click', () => {
    document.querySelectorAll('.skill-row').forEach(row => row.classList.remove('selected'));
    skill.classList.add('selected');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('main section[id]');
const navA = document.querySelectorAll('.nav-links a');

const setActive = () => {
  let current = '';
  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= 120 && rect.bottom >= 120) current = sec.id;
  });
  navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
};

window.addEventListener('scroll', setActive);
setActive();

// KPI count-up + sparkline, triggered once hero is visible
const counted = { done: false };

function runHeroAnimation() {
  if (counted.done) return;
  counted.done = true;

  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });

  const spark = document.getElementById('sparkline');
  if (spark) {
    spark.style.transition = 'stroke-dashoffset 1.3s ease';
    requestAnimationFrame(() => {
      spark.style.strokeDashoffset = '0';
    });
  }
}

const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) runHeroAnimation();
  });
}, { threshold: 0.3 });

const heroPanel = document.querySelector('.kpi-panel');
if (heroPanel) {
  heroObserver.observe(heroPanel);
}

// Reveal content as it enters the viewport
const revealTargets = document.querySelectorAll(
  '.section-head, .about-grid, .exp-card, .proj-card, .skills-grid, .cert-card, .edu-card, .contact-grid'
);

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

revealTargets.forEach(target => {
  target.classList.add('scroll-reveal');
  revealObserver.observe(target);
});

// Project filters
const filterBtns = document.querySelectorAll('.filter-btn');
const projCards = document.querySelectorAll('.proj-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    projCards.forEach(card => {
      const tags = card.dataset.tags.split(' ');
      card.style.display = filter === 'all' || tags.includes(filter) ? '' : 'none';
    });
  });
});

// Project detail expand/collapse
document.querySelectorAll('.proj-more').forEach(btn => {
  btn.addEventListener('click', () => {
    const detail = btn.nextElementSibling;
    const isOpen = btn.classList.toggle('open');
    detail.style.maxHeight = isOpen ? detail.scrollHeight + 'px' : '0px';
    btn.firstChild.textContent = isOpen ? 'Hide details ' : 'Details ';
  });
});

// Copy email to clipboard
const copyBtn = document.getElementById('copyEmail');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('matthew.p.ferrer@gmail.com').then(() => {
      copyBtn.classList.add('copied');
      setTimeout(() => copyBtn.classList.remove('copied'), 1600);
    });
  });
}

// Terminal typing effect
const fullCmd = 'SELECT role, focus FROM career WHERE impact > 0;';
const typedEl = document.getElementById('typedLine');
const typedOut = document.getElementById('typedOut');
let typedRan = false;
function typeStep(index) {
  if (!typedEl) return;
  typedEl.textContent = fullCmd.slice(0, index);
  if (index <= fullCmd.length) setTimeout(() => typeStep(index + 1), 22);
  else {
    typedEl.classList.add('done');
    if (typedOut) { typedOut.style.transition = 'opacity .5s ease'; typedOut.style.opacity = '1'; }
  }
}
const terminal = document.querySelector('.terminal');
if (terminal) new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting && !typedRan) { typedRan = true; setTimeout(() => typeStep(0), 300); }
}), { threshold: .3 }).observe(terminal);

// Fill skill meters as they enter view.
const meterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    const fill = entry.target.querySelector('.meter-fill');
    if (fill) fill.style.width = `${entry.target.dataset.level}%`;
    meterObserver.unobserve(entry.target);
  }
}), { threshold: .4 });
document.querySelectorAll('.skill-row[data-level]').forEach(row => meterObserver.observe(row));

// Keep the spotlight centered on the pointer for tactile data cards.
document.querySelectorAll('.proj-card, .cert-card').forEach(card => card.addEventListener('mousemove', event => {
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  card.style.setProperty('--my', `${event.clientY - rect.top}px`);
}));

// Graduation gallery lightbox
const galleryItems = document.querySelectorAll('.gallery-item');
const galleryToggle = document.getElementById('galleryToggle');
const educationGallery = document.getElementById('educationGallery');
if (galleryToggle && educationGallery) {
  galleryToggle.addEventListener('click', () => {
    const isOpen = galleryToggle.getAttribute('aria-expanded') === 'true';
    galleryToggle.setAttribute('aria-expanded', String(!isOpen));
    educationGallery.hidden = isOpen;
    galleryToggle.innerHTML = isOpen
      ? 'View Graduation Photos <span aria-hidden="true">+</span>'
      : 'Hide Graduation Photos <span aria-hidden="true">−</span>';
  });
}

if (galleryItems.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Graduation photo viewer');
  lightbox.innerHTML = '<button class="gallery-close" type="button" aria-label="Close photo viewer">&times;</button><img alt="Expanded graduation photo">';
  document.body.appendChild(lightbox);
  const lightboxImage = lightbox.querySelector('img');
  const closeLightbox = () => { lightbox.classList.remove('open'); document.body.classList.remove('menu-open'); };

  galleryItems.forEach(item => item.addEventListener('click', () => {
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = item.querySelector('img').alt;
    lightbox.classList.add('open');
  }));
  lightbox.addEventListener('click', event => { if (event.target === lightbox || event.target.closest('.gallery-close')) closeLightbox(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLightbox(); });
}

// Animated connected-node network behind the hero.
const netCanvas = document.getElementById('netcanvas');
if (netCanvas) {
  const context = netCanvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nodes = [];
  const resize = () => { const rect = netCanvas.getBoundingClientRect(); netCanvas.width = rect.width; netCanvas.height = rect.height; };
  const seed = () => { nodes = Array.from({ length: Math.min(34, Math.floor(netCanvas.width / 34)) }, () => ({ x: Math.random() * netCanvas.width, y: Math.random() * netCanvas.height, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 })); };
  const draw = () => {
    context.clearRect(0, 0, netCanvas.width, netCanvas.height);
    nodes.forEach(node => { node.x += node.vx; node.y += node.vy; if (node.x < 0 || node.x > netCanvas.width) node.vx *= -1; if (node.y < 0 || node.y > netCanvas.height) node.vy *= -1; });
    nodes.forEach((node, index) => nodes.slice(index + 1).forEach(other => { const distance = Math.hypot(node.x - other.x, node.y - other.y); if (distance < 130) { context.strokeStyle = `rgba(63,220,200,${.16 * (1 - distance / 130)})`; context.beginPath(); context.moveTo(node.x, node.y); context.lineTo(other.x, other.y); context.stroke(); } }));
    nodes.forEach(node => { context.fillStyle = 'rgba(63,220,200,.55)'; context.beginPath(); context.arc(node.x, node.y, 1.6, 0, Math.PI * 2); context.fill(); });
    if (!reduceMotion) requestAnimationFrame(draw);
  };
  resize(); seed(); draw();
  window.addEventListener('resize', () => { resize(); seed(); });
}
