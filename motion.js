'use strict';

/* Motion layer: GSAP + ScrollTrigger + Lenis.
   Everything here is an enhancement. Without these libraries, or with
   reduced motion turned on, the page is complete and still. */

(() => {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('has-gsap');

  const q = (selector, root = document) => [...root.querySelectorAll(selector)];
  const ease = 'expo.out';

  // One entrance: the parts rise in turn when their block arrives, once.
  function rise(trigger, targets, vars = {}) {
    const list = typeof targets === 'string' ? q(targets, trigger) : targets;
    if (!trigger || !list.length) {
      return;
    }
    // Apple-style entrance on every screen: rise out of a soft blur.
    gsap.from(list, {
      y: 40,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.08,
      opacity: 0,
      filter: 'blur(10px)',
      clearProps: 'filter',
      ...vars,
      scrollTrigger: { trigger, start: 'top 86%', once: true }
    });
  }

  function open(trigger, target, from = 'inset(100% 0% 0% 0%)') {
    if (!trigger || !target) {
      return;
    }
    gsap.from(target, {
      clipPath: from,
      duration: 1.3,
      ease: 'expo.inOut',
      clearProps: 'clipPath',
      scrollTrigger: { trigger, start: 'top 86%', once: true }
    });
  }

  // Apple-style zoom: large media grows to full size as it scrolls into view.
  function grow(target) {
    if (!target) {
      return;
    }
    gsap.fromTo(target, { scale: 0.9 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: target, start: 'top bottom', end: 'top 40%', scrub: 0.6 }
    });
  }

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {

    /* Smooth scrolling, kept in step with ScrollTrigger */

    let lenis = null;

    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);

      // If something else moved the page (find-in-page, a restored position, a script),
      // re-sync Lenis before it handles the next wheel, so it never snaps back.
      const resync = () => {
        if (Math.abs(window.scrollY - lenis.animatedScroll) > 10) {
          lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        }
      };
      window.addEventListener('scroll', resync, { passive: true });
      window.addEventListener('wheel', resync, { capture: true, passive: true });
      window.addEventListener('touchstart', resync, { capture: true, passive: true });
      const raf = time => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // In-page links: the page travels there (a thin bar fills across the top as it goes),
      // then the arrival cue plays (see arrive in script.js). Longer trips take a little longer.
      const travel = document.createElement('div');
      travel.className = 'travel';
      travel.setAttribute('aria-hidden', 'true');
      document.body.append(travel);
      let trip = null;

      lenis.on('scroll', ({ scroll }) => {
        if (!trip) {
          return;
        }
        const progress = Math.min(1, Math.abs(scroll - trip.from) / Math.max(1, Math.abs(trip.to - trip.from)));
        travel.style.transform = `scaleX(${progress})`;
      });

      const endTrip = () => {
        trip = null;
        travel.classList.remove('is-on');
      };

      q('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
          const id = link.getAttribute('href');
          const element = id === '#top' ? document.querySelector('.hero') : document.querySelector(id);
          if (element === null) {
            return;
          }
          event.preventDefault();
          let to;
          if (id === '#top') {
            to = 0;
          } else {
            // Cards start with their picture, so they land below the menu bar; sections have room above their heading.
            to = element.getBoundingClientRect().top + window.scrollY + (element.closest('.deck') ? -88 : -24);
          }
          to = Math.max(0, Math.min(to, document.documentElement.scrollHeight - window.innerHeight));
          const from = window.scrollY;
          const distance = Math.abs(to - from);
          const duration = Math.min(1.5, Math.max(0.7, 0.5 + distance / 4000));

          if (distance < 2) {
            window.arrive?.(element);
            return;
          }
          trip = { from, to };
          travel.style.transform = 'scaleX(0)';
          travel.classList.toggle('is-on', distance > 40);
          const tripId = trip;
          lenis.scrollTo(to, {
            duration,
            onComplete: () => {
              endTrip();
              window.arrive?.(element);
            }
          });
          // If the visitor takes over mid-trip, the bar still clears.
          setTimeout(() => {
            if (trip === tripId) {
              endTrip();
            }
          }, duration * 1000 + 400);
        });
      });

      // Pause smooth scroll while the photo viewer is open.
      const lightbox = document.querySelector('.lightbox');
      new MutationObserver(() => {
        lightbox.open ? lenis.stop() : lenis.start();
      }).observe(lightbox, { attributes: true, attributeFilter: ['open'] });
    }

    /* First screen: the network draws itself, then the words and the portrait arrive */

    // If the motion layer arrives late (a slow connection) or the visitor has already moved,
    // the first screen stays as it is instead of replaying its entrance.
    const intro = performance.now() < 3000 && window.scrollY < 80;

    const net = document.querySelector('.hero-net');
    if (net && intro) {
      gsap.from(net.querySelectorAll('line'), { opacity: 0, duration: 1.6, stagger: 0.015, ease: 'power2.out' });
      gsap.from(net.querySelectorAll('circle'), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, stagger: 0.02, ease: 'back.out(2)' });
    }
    if (net) {
      // The points drift a little, forever, like live data.
      q('circle', net).forEach(dot => {
        gsap.to(dot, {
          x: gsap.utils.random(-10, 10),
          y: gsap.utils.random(-8, 8),
          duration: gsap.utils.random(4, 7),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true
        });
      });
    }

    if (intro) {
      gsap.timeline({ defaults: { ease } })
        // The words slide only: they are on screen from the first paint, which keeps the page fast to load.
        .from('.hero-copy > *', { y: 28, duration: 0.9, stagger: 0.09 }, 0.15)
        .from('.hero-portrait img', { scale: 0.85, opacity: 0, duration: 1.1 }, 0.3)
        .from('.hero-portrait figcaption > *', { y: 12, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.6)
        // clearProps hands the bar back to the stylesheet; otherwise the phone menu (hidden at load) keeps opacity 0 for good.
        .from('.nav-inner > *', { y: -16, opacity: 0, duration: 0.7, stagger: 0.05, clearProps: 'transform,opacity' }, 0.1);
    }

    // The network eases back as the first screen leaves.
    if (net) {
      gsap.to(net, {
        yPercent: 12,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    // The words and portrait settle back and soften as the first screen leaves, like an Apple product page.
    gsap.to('.hero-copy, .hero-portrait', {
      scale: 0.94,
      opacity: 0.35,
      y: -40,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });

    ['.method-photo', '.clients-plate', '.exp-frame'].forEach(selector => grow(document.querySelector(selector)));
    q('.deck .project-media').forEach(grow);

    /* First screen: the numbers count up once the intro has landed */

    q('.hero-stats > div').filter(() => intro).forEach((row, index) => {
      const dt = row.querySelector('dt');
      const finalText = dt.textContent;
      // Screen readers read the final figure; the counting digits are visual only.
      dt.textContent = '';
      const spoken = document.createElement('span');
      spoken.className = 'sr-only';
      spoken.textContent = finalText;
      const figure = document.createElement('span');
      figure.setAttribute('aria-hidden', 'true');
      figure.textContent = finalText;
      dt.append(spoken, figure);
      const targets = (finalText.match(/[\d,]+/g) || []).map(number => Number(number.replace(/,/g, '')));
      const counter = { progress: 0.4 };
      const render = () => {
        let i = 0;
        figure.textContent = finalText.replace(/[\d,]+/g, () => Math.round(targets[i++] * counter.progress).toLocaleString('en-US'));
      };
      render();
      gsap.to(counter, {
        progress: 1, duration: 1.1, delay: 0.9 + index * 0.08, ease: 'power3.out', onUpdate: render,
        onComplete: () => { figure.textContent = finalText; }
      });
    });

    /* Proof band, What I do, How I work */

    rise(document.querySelector('.trust'), '.label, .trust-logos li, .worked-logos li', { stagger: 0.05 });
    rise(document.querySelector('.services'), '.services .label, .services .title');
    rise(document.querySelector('.services .cards'), '.card-box', { stagger: 0.1 });
    rise(document.querySelector('.method'), '.method .label, .method .title');
    rise(document.querySelector('.method .cards'), '.card-box', { stagger: 0.08 });
    open(document.querySelector('.method'), document.querySelector('.method-photo'));

    /* Work: each featured picture opens from its outer edge, the way the other photos open, then the words rise. */

    rise(document.querySelector('.work'), '.work > .wrap > .label, .work > .wrap > .title, .work > .wrap > .intro');

    // Each card's picture eases in as the card arrives; its words follow once.
    q('.deck .card').forEach((card, index) => {
      // Odd rows have the picture on the left, so it opens rightwards; even rows the reverse.
      open(card, card.querySelector('.project-media'), index % 2 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)');
      const picture = card.querySelector('.project-media img, .project-media video, .project-media svg');
      if (picture) {
        gsap.fromTo(picture, { scale: 1.08 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 30%', scrub: true }
        });
      }
      rise(card, '.card-body > *', { stagger: 0.05, y: 20 });
    });

    rise(document.querySelector('.more-work'), '.more-head > *');
    rise(document.querySelector('.slider'), '.slider .project', { y: 0, x: 48, stagger: 0.08 });

    /* Websites: the plate opens, then the words */

    const clients = document.querySelector('.clients');
    open(clients, document.querySelector('.clients-plate'));
    rise(clients, '.clients-copy .label, .clients-copy .title, .site-tab');

    /* The browser window scrolls slowly through the whole site while in view.
       Any scroll, touch or key from the visitor hands control to them. */

    const view = document.querySelector('.browser-view');
    if (view) {
      let tour = null;
      let handedOver = false;

      const startTour = () => {
        tour?.kill();
        if (handedOver) {
          return;
        }
        const shot = view.querySelector('.site-shot.is-on');
        const run = () => {
          const distance = view.scrollHeight - view.clientHeight;
          if (distance <= 0) {
            return;
          }
          tour = gsap.fromTo(view, { scrollTop: 0 }, {
            scrollTop: distance,
            duration: distance / 70,
            ease: 'none',
            delay: 1.2,
            repeat: -1,
            yoyo: true,
            repeatDelay: 1.5
          });
          if (!ScrollTrigger.isInViewport(view)) {
            tour.pause();
          }
        };
        shot && !shot.complete ? shot.addEventListener('load', run, { once: true }) : run();
      };

      const handOver = () => {
        handedOver = true;
        tour?.kill();
      };
      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => view.addEventListener(type, handOver, { passive: true }));

      ScrollTrigger.create({
        trigger: view,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => (tour ? tour.resume() : startTour()),
        onEnterBack: () => (tour ? tour.resume() : startTour()),
        onLeave: () => tour?.pause(),
        onLeaveBack: () => tour?.pause()
      });

      document.addEventListener('site:change', () => {
        tour?.kill();
        tour = null;
        if (ScrollTrigger.isInViewport(view)) {
          startTour();
        }
      });
    }

    document.addEventListener('site:change', event => {
      const panel = event.detail;
      if (!panel || !ScrollTrigger.isInViewport(clients, 0.1)) {
        return;
      }
      const shot = document.querySelector('.site-shot.is-on');
      gsap.timeline({ defaults: { ease, overwrite: true } })
        .fromTo(shot, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(panel.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, '<0.15');
    });

    /* Experience: each proof panel opens, its text follows */

    rise(document.querySelector('.experience'), '.experience .label, .experience .title');
    open(document.querySelector('.exp-grid'), document.querySelector('.exp-frame'));
    q('.job').forEach(job => {
      rise(job, '.job-dates, .job-main > *', { stagger: 0.06 });
    });

    /* Tools: the heading, then each group's tiles in turn */

    rise(document.querySelector('.skills'), '.skills .label, .skills .title, .skills .intro');
    q('.tool-group').forEach(group => rise(group, 'h3, .tile', { y: 16, stagger: 0.03 }));

    /* Credentials, education, contact */

    const credentials = document.querySelector('.credentials');
    rise(credentials, '.credentials .label, .credentials .title');
    rise(document.querySelector('.certs'), '.cert', { stagger: 0.07 });
    rise(document.querySelector('.education'), '.education > :not(.edu-photos)');
    rise(document.querySelector('.edu-photos'), '.photo-open', { y: 36, stagger: 0.07 });

    rise(document.querySelector('.faq'), '.faq .label, .faq .title, .faq-list details', { stagger: 0.06 });
    rise(document.querySelector('.contact'), '.contact-inner > *', { stagger: 0.07 });

    /* Footer */

    const footer = document.querySelector('.site-footer');
    rise(footer, '.foot-grid > *', { stagger: 0.08 });

    // The name is refit once the font is in, then every trigger is measured again.
    const refit = () => {
      window.fitDisplayType?.();
      ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refit);
    // This layer loads after the first paint, so the page may have finished loading already.
    if (document.readyState === 'complete') {
      ScrollTrigger.refresh();
    } else {
      window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    // Opening a dropdown makes the page taller; move the later triggers with it.
    let refreshTimer;
    const onToggle = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    document.addEventListener('toggle', onToggle, true);

    return () => {
      lenis?.destroy();
      document.removeEventListener('toggle', onToggle, true);
    };
  });
})();
