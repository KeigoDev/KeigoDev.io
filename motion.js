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
  // On small screens content only slides in; it is never invisible while it waits.
  const wide = window.matchMedia('(min-width: 960px)').matches;

  // One entrance: the parts rise in turn when their block arrives, once.
  function rise(trigger, targets, vars = {}) {
    const list = typeof targets === 'string' ? q(targets, trigger) : targets;
    if (!trigger || !list.length) {
      return;
    }
    // Entrances slide only: content is at full contrast from the start, even if the animation never runs.
    gsap.from(list, {
      y: 28,
      duration: 1,
      ease,
      stagger: 0.08,
      ...vars,
      scrollTrigger: { trigger, start: 'top 86%', once: true }
    });
  }

  function open(trigger, target, from = 'inset(100% 0% 0% 0%)') {
    if (!trigger || !target) {
      return;
    }
    gsap.from(target, {
      clipPath: wide ? from : 'inset(6% 6% 6% 6%)',
      duration: 1.3,
      ease: 'expo.inOut',
      clearProps: 'clipPath',
      scrollTrigger: { trigger, start: 'top 86%', once: true }
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

      q('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
          const id = link.getAttribute('href');
          const target = id === '#top' ? 0 : document.querySelector(id);
          if (target === null) {
            return;
          }
          event.preventDefault();
          lenis.scrollTo(target, { offset: id === '#top' ? 0 : -24, duration: 1.4 });
        });
      });

      // Pause smooth scroll while the photo viewer is open.
      const lightbox = document.querySelector('.lightbox');
      new MutationObserver(() => {
        lightbox.open ? lenis.stop() : lenis.start();
      }).observe(lightbox, { attributes: true, attributeFilter: ['open'] });
    }

    /* First screen: the network draws itself, then the words and the portrait arrive */

    const net = document.querySelector('.hero-net');
    if (net) {
      gsap.from(net.querySelectorAll('line'), { opacity: 0, duration: 1.6, stagger: 0.015, ease: 'power2.out' });
      gsap.from(net.querySelectorAll('circle'), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, stagger: 0.02, ease: 'back.out(2)' });
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

    gsap.timeline({ defaults: { ease } })
      .from('.hero-copy > *', { y: 28, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.15)
      .from('.hero-portrait img', { scale: 0.85, opacity: 0, duration: 1.1 }, 0.3)
      .from('.hero-portrait figcaption > *', { y: 12, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.6)
      .from('.nav-inner > *', { y: -16, opacity: 0, duration: 0.7, stagger: 0.05 }, 0.1);

    // The network eases back as the first screen leaves.
    if (net) {
      gsap.to(net, {
        yPercent: 12,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    /* First screen: the numbers count up once the intro has landed */

    q('.hero-stats > div').forEach((row, index) => {
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

    rise(document.querySelector('.trust'), '.label, .trust-logos li, .trust-worked', { stagger: 0.05 });
    rise(document.querySelector('.services'), '.services .label, .services .title');
    rise(document.querySelector('.services .cards'), '.card-box', { stagger: 0.1 });
    rise(document.querySelector('.method'), '.method .label, .method .title');
    rise(document.querySelector('.method .cards'), '.card-box', { stagger: 0.08 });
    open(document.querySelector('.method'), document.querySelector('.method-photo'));

    /* Work: the featured cards stack. As each card arrives, the one beneath settles back and dims. */

    rise(document.querySelector('.work'), '.work > .wrap > .label, .work > .wrap > .title, .work > .wrap > .intro');

    let deckTriggers = [];
    const buildDeck = () => {
      deckTriggers.forEach(trigger => trigger.kill());
      deckTriggers = [];
      if (!wide) {
        return;
      }
      const visible = q('.deck .card');
      visible.forEach((card, index) => {
        let shade = card.querySelector('.card-shade');
        if (!shade) {
          shade = document.createElement('span');
          shade.className = 'card-shade';
          shade.setAttribute('aria-hidden', 'true');
          card.append(shade);
        }
        gsap.set(card, { scale: 1, transformOrigin: '50% 0%' });
        gsap.set(shade, { opacity: 0 });
        const next = visible[index + 1];
        if (!next) {
          return;
        }
        const settle = gsap.timeline({
          scrollTrigger: {
            trigger: next,
            start: 'top bottom',
            end: () => `top ${88 + (index + 1) * 14}px`,
            scrub: true,
            invalidateOnRefresh: true
          }
        });
        settle.to(card, { scale: 0.94, ease: 'none' }, 0).to(shade, { opacity: 0.35, ease: 'none' }, 0);
        deckTriggers.push(settle.scrollTrigger);
      });
    };
    buildDeck();

    // Each card's picture eases in as the card arrives; its words follow once.
    q('.deck .card').forEach(card => {
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
    window.addEventListener('load', () => ScrollTrigger.refresh());

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
