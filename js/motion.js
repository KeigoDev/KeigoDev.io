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
  const ease = 'power2.out'; // n8n.io's ease-out: quick and plain

  // One entrance: the parts rise in turn when their block arrives, once.
  function rise(trigger, targets, vars = {}) {
    const list = typeof targets === 'string' ? q(targets, trigger) : targets;
    if (!trigger || !list.length) {
      return;
    }
    // n8n.io-style entrance: a short, crisp rise and fade.
    gsap.from(list, {
      y: 16,
      duration: 0.6,
      ease,
      stagger: 0.06,
      opacity: 0,
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

    /* Click: a ping spreads from the point pressed (styles in style.css). Larger on links and buttons. */

    const ping = event => {
      // Keyboard activation has no point to spread from; typing into a field needs no ping.
      if (event.detail === 0 || event.target.closest('input, textarea, select')) {
        return;
      }
      // An open dialog sits above the page, so its pings go inside it. A click on its backdrop
      // (the dialog itself) or one that closed it pings the page instead.
      const dialog = event.target.closest('dialog');
      const host = dialog?.open && dialog !== event.target ? dialog : document.body;
      const box = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect();
      const mark = document.createElement('span');
      mark.className = 'ping';
      mark.setAttribute('aria-hidden', 'true');
      mark.classList.toggle('is-control', Boolean(event.target.closest('a, button, summary, [role="tab"], label')));
      mark.style.left = `${event.clientX - box.left - host.clientLeft + host.scrollLeft}px`;
      mark.style.top = `${event.clientY - box.top - host.clientTop + host.scrollTop}px`;
      host.append(mark);
      setTimeout(() => mark.remove(), 1000);
    };
    document.addEventListener('click', ping);

    // If the motion layer arrives late (a slow connection) or the visitor has already moved,
    // the first screen stays as it is instead of replaying its entrance.
    const intro = performance.now() < 3000 && window.scrollY < 80;

    /* Hero canvas, after n8n.io: the request is typed and sent, the workflow builds itself node by node,
       the run passes through it in pink, then the canvas clears and starts again.
       Transforms, opacity and stroke offsets only, so it stays smooth. */
    /* Hero canvas, after n8n.io: an endless loop through my workflows (script.js FLOWS.hero). Each request
       is typed and sent; its workflow builds in run order (branches together) with labels typing in; the
       pink run passes through; it rests with a "Click here" by the +; then its labels erase and the next
       one builds. The + adds a chapter at any time, and the loop carries on after it.
       Transforms, opacity and stroke offsets only, so it stays smooth. */
    const flowEvents = new AbortController();
    const heroView = document.querySelector('.flow-view[data-flow="hero"]');
    if (heroView) {
      const view = heroView;
      const camera = view.querySelector('.flow-pan');
      const panTo = x => window.flowPan(view, x);
      const pan = (x, duration = 0.8) => ({ x: () => panTo(x), duration, ease: 'power2.inOut', overwrite: 'auto' });
      const at = el => parseFloat(el.style.left);
      const gap = 0.45; // build: time from one step of the run to the next
      const beat = 0.4; // run: the same, for the pink signal
      let cycle = 0;
      let current = null; // what is playing now, so scrolling away can pause it
      let onScreen = true;
      window.flowMotion = true;

      const play = tl => {
        current?.kill();
        current = tl;
        if (!onScreen) tl.pause();
        return tl;
      };
      const parts = () => {
        const stage = view.querySelector('.flow-stage');
        return {
          stage,
          nodes: q('.flow-node', stage),
          links: q('.flow-link', stage),
          end: stage.querySelector('.is-end'),
          hint: stage.querySelector('.flow-hint'),
          hanging: q('.flow-socket, .flow-tool-wire', stage)
        };
      };
      const labelOf = node => node.querySelector('.flow-label, .flow-agent-name');

      // A label typed in, or erased, a letter at a time, as n8n.io's are.
      const typeLabel = (tl, node, show, t) => {
        const label = labelOf(node);
        if (!label) return;
        const text = label.dataset.text ?? (label.dataset.text = label.textContent);
        const count = { n: show ? 0 : text.length };
        if (show) tl.call(() => { label.textContent = ''; }, [], t - 0.01);
        tl.to(count, { n: show ? text.length : 0, duration: 0.35, ease: 'none', onUpdate: () => { label.textContent = text.slice(0, Math.round(count.n)); } }, t);
      };

      const hide = (nodes, links) => {
        gsap.set(nodes, { autoAlpha: 0, scale: 0.85, '--hl': 0 });
        links.forEach(link => {
          gsap.set(link.querySelector('.flow-wire'), { strokeDasharray: 1, strokeDashoffset: 1 });
          gsap.set(link.querySelector('.flow-run'), { strokeDashoffset: 1, opacity: 1 });
          gsap.set(link.querySelectorAll('.flow-port'), { autoAlpha: 0 });
        });
      };

      // Wires draw out of each step and the next steps land on their ends, in run order from `first`.
      // On a narrow screen the camera follows each step as it lands. Returns when the last one lands.
      const addBuild = (tl, nodes, links, start, first) => {
        const rank = el => Number(el.dataset.depth) - first;
        const land = node => Math.max(start, start + (rank(node) - 1) * gap + 0.35);
        const k = parseFloat(getComputedStyle(view).getPropertyValue('--k')) || 1;
        const xs = nodes.map(at);
        const follow = (Math.max(...xs) - Math.min(...xs) + 180) * k > view.clientWidth;
        links.forEach(link => {
          const t = start + rank(link) * gap;
          const [out, into] = link.querySelectorAll('.flow-port');
          tl.to(out, { autoAlpha: 1, duration: 0.2 }, t)
            .to(link.querySelector('.flow-wire'), { strokeDashoffset: 0, duration: gap, ease: 'power2.inOut' }, t);
          if (into) tl.to(into, { autoAlpha: 1, duration: 0.2 }, t + gap - 0.05);
        });
        nodes.forEach(node => {
          tl.to(node, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, land(node));
          typeLabel(tl, node, true, land(node) + 0.1);
          if (follow) tl.to(camera, pan(at(node), 0.6), land(node) - 0.15);
        });
        return Math.max(...nodes.map(land)) + 0.5;
      };

      // Each step lights pink in turn and the signal travels each wire. Returns when it has passed.
      const addRun = (tl, nodes, links, start, first) => {
        const rank = el => Number(el.dataset.depth) - first;
        const lit = nodes.filter(node => !node.classList.contains('is-end'));
        lit.forEach(node => tl.to(node, { '--hl': 1, duration: 0.25, ease: 'power2.out' }, start + rank(node) * beat));
        links.forEach(link => tl.to(link.querySelector('.flow-run'), { strokeDashoffset: 0, duration: beat, ease: 'power1.inOut' }, start + rank(link) * beat + 0.1));
        const done = start + Math.max(...lit.map(rank)) * beat + 0.5;
        tl.to(lit, { '--hl': 0, duration: 0.6, ease: 'power2.out' }, done + 1)
          .to(links.map(link => link.querySelector('.flow-run')), { opacity: 0, duration: 0.6 }, done + 1);
        return done + 1.6;
      };

      // Rest: the "Click here" tag bobs by the + for a few seconds, then the canvas erases.
      const addRest = (tl, hint, at0, hasMore) => {
        if (hasMore && hint) {
          tl.to(hint, { autoAlpha: 1, duration: 0.4 }, at0)
            .to(hint, { y: -4, duration: 0.55, repeat: 7, yoyo: true, ease: 'sine.inOut' }, at0 + 0.4);
        }
        tl.call(erase, [], at0 + (hasMore ? 4.8 : 2.5));
      };

      // Labels erase letter by letter, the steps fade, and the next workflow starts.
      function erase() {
        const { nodes, links, hint, hanging } = parts();
        const tl = gsap.timeline();
        if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.25 }, 0);
        nodes.forEach((node, i) => typeLabel(tl, node, false, i * 0.03));
        tl.to(nodes, { autoAlpha: 0, scale: 0.9, duration: 0.4, stagger: 0.03, ease: 'power2.in' }, 0.3)
          .to([...links, ...hanging], { autoAlpha: 0, duration: 0.4 }, 0.4)
          .call(() => {
            cycle += 1;
            runCycle();
          }, [], '+=0.2');
        play(tl);
      }

      function runCycle(first = false) {
        window.showHeroFlow(view, cycle);
        const { stage, nodes, links, end, hint, hanging } = parts();
        const prompt = stage.querySelector('.flow-prompt');
        const typed = stage.querySelector('.flow-typed');
        const request = typed.textContent;
        const typing = { n: 0 };
        hide(nodes, links);
        gsap.set(hanging, { autoAlpha: 0 });
        gsap.set(hint, { autoAlpha: 0 });
        gsap.set(prompt, { autoAlpha: 0, y: 16, scale: 0.98 });
        gsap.set(stage.querySelectorAll('.flow-chip'), { autoAlpha: 0, y: 6 });
        typed.textContent = '';
        gsap.set(camera, { x: panTo(600) });

        const tl = gsap.timeline({ delay: first ? (intro ? 1.2 : 0.3) : 0, defaults: { ease: 'power3.out' } });
        // 1. The prompt arrives and the request is typed, then sent.
        tl.to(prompt, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 })
          .to(stage.querySelectorAll('.flow-chip'), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.35')
          .to(typing, { n: request.length, duration: request.length * 0.024, ease: 'none', onUpdate: () => { typed.textContent = request.slice(0, Math.round(typing.n)); } }, '+=0.2')
          .to(stage.querySelector('.flow-send'), { scale: 0.86, duration: 0.12, ease: 'power2.in' }, '+=0.35')
          .to(stage.querySelector('.flow-send'), { scale: 1, duration: 0.4, ease: 'back.out(3)' })
          .to(prompt, { autoAlpha: 0, y: -12, scale: 0.97, duration: 0.5, ease: 'power2.in' }, '+=0.1');
        // 2. It builds; an agent's tools hang below it once it lands.
        const start = tl.duration() + 0.1;
        tl.to(camera, pan(at(nodes[0])), start - 0.3);
        const built = addBuild(tl, nodes, links, start, 0);
        const agent = stage.querySelector('.is-agent');
        if (agent && hanging.length) {
          tl.to(hanging, { autoAlpha: 1, duration: 0.4, stagger: 0.05 }, start + Number(agent.dataset.depth) * gap + 0.4);
        }
        // 3. The run, 4. the rest.
        const ran = addRun(tl, nodes, links, built + 0.3, 0);
        addRest(tl, hint, ran, !!end);
        play(tl);
      }

      // The + was clicked (script.js has drawn the chapter): show what was mid-build as built, slide on,
      // build the chapter, run it, rest, and carry on looping.
      document.addEventListener('flow:reveal', ({ detail }) => {
        if (detail.view !== view) return;
        current?.kill();
        const { stage, nodes, links, hint, hanging } = parts();
        const added = new Set(detail.added);
        const old = nodes.filter(node => !added.has(node));
        gsap.set(stage.querySelector('.flow-prompt'), { autoAlpha: 0 });
        gsap.set(old, { autoAlpha: 1, scale: 1, '--hl': 0 });
        old.forEach(node => { const label = labelOf(node); if (label?.dataset.text) label.textContent = label.dataset.text; });
        links.filter(link => !added.has(link)).forEach(link => {
          gsap.set(link, { autoAlpha: 1 });
          gsap.set(link.querySelector('.flow-wire'), { strokeDasharray: 1, strokeDashoffset: 0 });
          gsap.set(link.querySelector('.flow-run'), { strokeDashoffset: 1 });
          gsap.set(link.querySelectorAll('.flow-port'), { autoAlpha: 1 });
        });
        gsap.set(hanging, { autoAlpha: 1 });
        gsap.set(hint, { autoAlpha: 0, y: 0 });

        const newNodes = detail.added.filter(el => el.classList.contains('flow-node'));
        const newLinks = detail.added.filter(el => el.classList.contains('flow-link'));
        hide(newNodes, newLinks);
        gsap.set(detail.end, { autoAlpha: 0 });
        const first = Math.min(...newLinks.map(link => Number(link.dataset.depth)));
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(camera, pan(detail.focus, 1), 0);
        const built = addBuild(tl, newNodes, newLinks, 0.45, first);
        if (!detail.done) tl.to(detail.end, { autoAlpha: 1, duration: 0.4 }, built - 0.2);
        const ran = addRun(tl, newNodes, newLinks, built + 0.3, first);
        addRest(tl, hint, ran, !detail.done);
        play(tl);
      }, { signal: flowEvents.signal });

      // Motion turned off: stop the loop and leave the first workflow drawn, still.
      flowEvents.signal.addEventListener('abort', () => {
        current?.kill();
        cycle = 0;
        window.showHeroFlow(view, 0);
        camera.style.transform = '';
      });

      // Only plays while the canvas is on screen.
      ScrollTrigger.create({
        trigger: view,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: self => {
          onScreen = self.isActive;
          if (current) onScreen ? current.resume() : current.pause();
        }
      });

      // Hide the first draw at once (it would flash fully built), then start the loop.
      hide(q('.flow-node', view), q('.flow-link', view));
      gsap.set(q('.flow-socket, .flow-tool-wire, .flow-hint', view), { autoAlpha: 0 });
      runCycle(true);
    }

    if (intro) {
      gsap.timeline({ defaults: { ease } })
        // The words slide only: they are on screen from the first paint, which keeps the page fast to load.
        .from('.hero-copy > *', { y: 28, duration: 0.9, stagger: 0.09 }, 0.15)
        .from('.hero-portrait img', { scale: 0.85, opacity: 0, duration: 1.1 }, 0.3)
        .from('.hero-portrait figcaption > *', { y: 12, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.6)
        // clearProps hands the bar back to the stylesheet; otherwise the phone menu (hidden at load) keeps opacity 0 for good.
        .from('.nav-inner > *', { y: -16, opacity: 0, duration: 0.7, stagger: 0.05, clearProps: 'transform,opacity' }, 0.1);

      // After n8n.io's hero: the headline's letters light up pink in a wave, then settle back to ink.
      const title = document.querySelector('.hero-title');
      if (title) {
        // Screen readers read the whole line once, not letter by letter.
        title.setAttribute('aria-label', title.textContent.trim());
        const letters = [];
        [...title.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => {
          const run = document.createDocumentFragment();
          [...node.textContent].forEach(character => {
            const letter = document.createElement('span');
            letter.textContent = character;
            letter.setAttribute('aria-hidden', 'true');
            run.append(letter);
            if (character.trim()) letters.push(letter);
          });
          node.replaceWith(run);
        });
        title.querySelector('em')?.setAttribute('aria-hidden', 'true');
        const pink = getComputedStyle(document.documentElement).getPropertyValue('--pink').trim();
        const ink = getComputedStyle(title).color;
        gsap.timeline({ delay: 0.7 })
          .to(letters, { color: pink, duration: 0.2, stagger: 0.045, ease })
          .to(letters, { color: ink, duration: 0.6, stagger: 0.045, ease, clearProps: 'color' }, 0.35);
      }
    }

    // The words and portrait settle back and soften as the first screen leaves, like an Apple product page.
    gsap.to('.hero-copy, .hero-portrait', {
      scale: 0.94,
      opacity: 0.35,
      y: -40,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });

    ['.clients-plate', '.exp-frame'].forEach(selector => grow(document.querySelector(selector)));
    q('.deck .project-media').forEach(grow);

    /* First screen: the numbers count up once the intro has landed */

    if (intro) q('.hero-stats > div').forEach((row, index) => {
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

    // n8n's dark panels arrive: each grows from an inset card to its full size as it scrolls in.
    q('.trust, .contact').forEach(panel => {
      gsap.fromTo(panel, { scale: 0.94 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 60%', scrub: 0.6 }
      });
    });

    rise(document.querySelector('.trust'), '.label, .trust-logos li, .worked-logos li', { stagger: 0.05 });
    rise(document.querySelector('.services'), '.services .label, .services .title');
    rise(document.querySelector('.services .cards'), '.card-box', { stagger: 0.1 });
    rise(document.querySelector('.method'), '.method .label, .method .title');
    rise(document.querySelector('.method .steps'), '.step', { stagger: 0.06 });
    open(document.querySelector('.method'), document.querySelector('.method-canvas'));

    /* Workflow canvas (How I work), after n8n.io: the run lights each step in run order (data-depth,
       so parallel branches move together) and travels each wire. */

    // Lights the steps on show (the later ones are hidden) in run order.
    const flowRun = view => {
      const beat = 0.4;
      const nodes = q('.flow-node:not(.is-later)', view);
      const runs = q('.flow-link:not(.is-later) .flow-run', view);
      const tl = gsap.timeline();
      tl.set(q('.flow-run', view), { strokeDashoffset: 1, opacity: 1 });
      nodes.forEach(node => tl.to(node, { '--hl': 1, duration: 0.25, ease: 'power2.out' }, node.dataset.depth * beat));
      runs.forEach(run => tl.to(run, { strokeDashoffset: 0, duration: beat, ease: 'power1.inOut' }, run.parentNode.dataset.depth * beat + 0.1));
      tl.to(nodes, { '--hl': 0, duration: 0.5, ease: 'power2.out' }, '+=0.9')
        .to(runs, { opacity: 0, duration: 0.5 }, '<');
      return tl;
    };

    /* How I work: the steps open in turn every few seconds while on screen, until the visitor picks one.
       Each opening grows the canvas (CSS) and then runs it in green. */

    const methodView = document.querySelector('.flow-view[data-flow="method"]');
    if (methodView) {
      let step = 1;
      let auto = true;
      let next = null;
      let methodRun = null;
      const runMethod = () => {
        methodRun?.kill();
        methodRun = flowRun(methodView).delay(0.7);
      };
      const queue = () => {
        next?.kill();
        next = auto ? gsap.delayedCall(5.5, () => window.openMethodStep(step % 4)) : null;
      };
      document.addEventListener('method:step', event => {
        step = event.detail.step;
        if (event.detail.byVisitor) auto = false;
        runMethod();
        queue();
      });
      ScrollTrigger.create({
        trigger: methodView,
        start: 'top 80%',
        end: 'bottom top',
        onToggle: self => {
          if (!self.isActive) {
            next?.pause();
            return;
          }
          if (next) {
            next.resume();
          } else if (auto) {
            runMethod();
            queue();
          }
        }
      });
    }

    /* Tools, after n8n.io's integrations: the logos drift in and out at free spots around the band. */

    const cloud = document.querySelector('.tool-cloud');
    if (cloud) {
      cloud.classList.remove('is-still');
      const chips = q('span', cloud);
      const shown = new Set();
      // A free spot clear of every logo on show, or null when the band is full (a phone fills sooner).
      const freeSpot = () => {
        const w = cloud.clientWidth - 56;
        const h = cloud.clientHeight - 56;
        for (let tries = 0; tries < 16; tries++) {
          const spot = [Math.random() * w, Math.random() * h];
          if ([...shown].every(other => Math.hypot(other.spot[0] - spot[0], other.spot[1] - spot[1]) > 84)) return spot;
        }
        return null;
      };
      const appear = () => {
        const idle = chips.filter(chip => !shown.has(chip));
        const spot = idle.length && freeSpot();
        if (!spot) return;
        const chip = idle[Math.floor(Math.random() * idle.length)];
        chip.spot = spot;
        gsap.set(chip, { left: spot[0], top: spot[1] });
        shown.add(chip);
        gsap.timeline({ onComplete: () => shown.delete(chip) })
          .fromTo(chip, { autoAlpha: 0, scale: 0.6, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.7)' })
          .to(chip, { y: -8, duration: 2.6, ease: 'sine.inOut' })
          .to(chip, { autoAlpha: 0, scale: 0.8, duration: 0.6, ease: 'power2.in' });
      };
      const drift = gsap.timeline({ repeat: -1, paused: true }).call(appear).to({}, { duration: 0.45 });
      ScrollTrigger.create({
        trigger: cloud,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: self => (self.isActive ? drift.play() : drift.pause())
      });
    }

    // Opening the full tool list: its tiles rise in turn.
    document.addEventListener('expand:change', event => {
      if (event.detail.open && event.detail.region?.id === 'toolGroups') {
        gsap.from(q('#toolGroups .tool-group h3, #toolGroups .tile'), { y: 14, opacity: 0, duration: 0.5, stagger: 0.015, ease, clearProps: 'transform,opacity' });
      }
    });

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
    // An expand region slides open over .45s; measure once it has finished.
    const onExpand = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 500);
    };
    document.addEventListener('expand:change', onExpand);

    return () => {
      lenis?.destroy();
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('expand:change', onExpand);
      document.removeEventListener('click', ping);
      flowEvents.abort();
      window.flowMotion = false;
      // With motion turned off, the tool logos rest as a still row again.
      document.querySelector('.tool-cloud')?.classList.add('is-still');
    };
  });
})();
