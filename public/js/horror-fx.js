/* Horror FX — phone-friendly interactions + ambient audio.
   - Floating sound toggle: loops dark ambient drone (off by default; browsers need a tap anyway).
   - Tap the hero: the dead stir — screen flicker + shudder + sting. */
(function () {
  'use strict';

  /* ── Ambient sound toggle ──
     Delegates to ambience.js (Web Audio API, iOS-safe). This button is just
     the visible switch; all audio lives over there. */
  var toggle = document.createElement('button');
  toggle.className = 'sound-toggle';
  toggle.setAttribute('aria-label', 'Toggle ambient sound');
  toggle.innerHTML = '<span class="sound-icon" aria-hidden="true">🔊</span>';
  document.body.appendChild(toggle);

  toggle.addEventListener('click', function () {
    /* Don't let this tap also count as the "first gesture" twice — harmless. */
    if (window.__ddfSetMuted && window.__ddfMuted) {
      window.__ddfSetMuted(!window.__ddfMuted());
    }
  });
  if (window.__ddfPaintToggle) window.__ddfPaintToggle();

  /* ── Tap the hero: disturb the dead ── */
  var hero = document.querySelector('.hero');
  if (hero) {
    var sting = new Audio('/audio/sting.mp3');
    sting.preload = 'auto';
    sting.volume = 0.7;
    var cooling = false;
    hero.addEventListener('click', function (e) {
      /* Don't fire when tapping a link or button inside the hero. */
      if (e.target.closest('a, button')) return;
      if (cooling) return;
      cooling = true;
      document.body.classList.add('disturbed');
      try { sting.currentTime = 0; sting.play().catch(function () {}); } catch (err) {}
      setTimeout(function () {
        document.body.classList.remove('disturbed');
        cooling = false;
      }, 700);
    });
  }

  /* ── The dead pop up and vanish ──
     Actual dead characters from the story fade in, linger, then dissolve.
     Tap one to banish it. Respects reduced-motion. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var DEAD = [
    { img: '/img/apparitions/elias.jpg', name: 'ELIAS' },
    { img: '/img/apparitions/mara.jpg', name: 'MARA' },
    { img: '/img/apparitions/jonah-bell.jpg', name: 'JONAH BELL' },
    { img: '/img/apparitions/ruth-mercer.jpg', name: 'RUTH MERCER' },
    { img: '/img/apparitions/lena-mercer.jpg', name: 'ELENA MERCER' }
  ];
  /* Preload the visages so they pop instantly, even on phones. */
  DEAD.forEach(function (d) { var im = new Image(); im.src = d.img; });

  var apparition = null;
  var apparitionCount = 0; /* cap: max ~4 visitations per page view, then they rest */
  var sting2 = null;
  function getSting() {
    if (!sting2) { sting2 = new Audio('/audio/sting.mp3'); sting2.volume = 0.4; sting2.preload = 'auto'; }
    return sting2;
  }

  function donateOpen() {
    /* Never haunt anyone mid-donation. */
    var f = document.querySelector('[data-donate-form]');
    return !!(f && !f.hidden);
  }

  function spawnApparition() {
    if (apparitionCount >= 4) return; /* rested for this page view */
    if (apparition || document.hidden || donateOpen()) { scheduleNext(); return; }
    apparitionCount++;
    var dead = DEAD[Math.floor(Math.random() * DEAD.length)];
    apparition = document.createElement('div');
    apparition.className = 'apparition dead-visage';
    apparition.innerHTML =
      '<div class="visage-frame"><img src="' + dead.img + '" alt="" aria-hidden="true"></div>' +
      '<div class="visage-name">' + dead.name + '</div>';
    /* Random position: keep clear of edges so it never covers nav/buttons. */
    var x = 8 + Math.random() * 70;   /* vw */
    var y = 18 + Math.random() * 55;  /* vh */
    apparition.style.left = x + 'vw';
    apparition.style.top = y + 'vh';

    apparition.addEventListener('click', function () {
      banish(true);
    });
    /* Also banish on touch — click covers it, but be snappy on phones. */
    apparition.addEventListener('touchstart', function () {
      banish(true);
    }, { passive: true });

    document.body.appendChild(apparition);
    /* Trigger the fade-in on the next frame, with a groan as it rises. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (apparition) {
          apparition.classList.add('risen');
          if (window.__ddfGroan) { try { window.__ddfGroan(); } catch (e) {} }
        }
      });
    });
    /* It dissolves on its own after a few seconds. */
    setTimeout(function () { banish(false); }, 5000 + Math.random() * 3000);
  }

  function banish(tapped) {
    if (!apparition) return;
    var el = apparition;
    apparition = null;
    if (tapped) {
      try { var s = getSting(); s.currentTime = 0; s.play().catch(function () {}); } catch (e) {}
      /* A tapped apparition is released — the haunt layer keeps score. */
      try { document.dispatchEvent(new CustomEvent('ddf:banished')); } catch (e) {}
    }
    el.classList.remove('risen');
    el.classList.add('banished');
    setTimeout(function () { el.remove(); }, 1200);
    scheduleNext();
  }

  function scheduleNext() {
    if (apparitionCount >= 4) return; /* the dead rest */
    /* The dead are patient: every 20–45 seconds. */
    setTimeout(spawnApparition, 20000 + Math.random() * 25000);
  }
  /* First visitation comes a little sooner, once the page has settled. */
  setTimeout(spawnApparition, 9000 + Math.random() * 8000);

  /* ── Blood splatter burst at tap point (max 12 particles, WAAPI transform/opacity) ── */
  document.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest ? e.target.closest('.btn, .btn-blood, .btn-stripe') : null;
    if (!btn) return;
    var n = 8 + Math.floor(Math.random() * 5); /* 8–12 */
    for (var i = 0; i < n; i++) {
      (function () {
        var p = document.createElement('div');
        p.className = 'splatter-bit';
        var size = 5 + Math.random() * 9;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        document.body.appendChild(p);
        var ang = Math.random() * Math.PI * 2;
        var dist = 26 + Math.random() * 58;
        var dx = Math.cos(ang) * dist - size / 2;
        var dy = Math.sin(ang) * dist - size / 2;
        var anim = p.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.95 },
          { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.2)', opacity: 0 }
        ], { duration: 450 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.3,1)' });
        anim.onfinish = function () { p.remove(); };
      })();
    }
  }, { passive: true });

  /* ── Section headers: staggered word-rise with red glow on scroll ── */
  function battleHead(h) {
    var frag = document.createDocumentFragment();
    var idx = 0;
    function addWordEl(el) {
      var wrap = document.createElement('span');
      wrap.className = 'w';
      el.style.transitionDelay = (idx * 70) + 'ms';
      wrap.appendChild(el);
      frag.appendChild(wrap);
      idx++;
    }
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span');
          s.textContent = part;
          addWordEl(s);
        });
      } else if (node.nodeType === 1) {
        addWordEl(node);
      }
    });
    h.textContent = '';
    h.appendChild(frag);
    h.classList.add('battle-head');
  }
  var heads = document.querySelectorAll('main h2');
  if (heads.length && 'IntersectionObserver' in window) {
    var hio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('lit');
          hio.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    heads.forEach(function (h) { battleHead(h); hio.observe(h); });
  }
})();
