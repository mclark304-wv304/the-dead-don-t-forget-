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
     A shadowy figure fades in at a random spot, lingers, then dissolves.
     Tap it to banish it (with a sting). Respects reduced-motion. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GHOST_SVGS = [
    /* Tall shadow figure with hollow eyes */
    '<svg viewBox="0 0 100 220" aria-hidden="true"><ellipse cx="50" cy="200" rx="34" ry="14" fill="rgba(0,0,0,.5)"/><path d="M50 10 C30 10 24 40 26 80 L20 200 L38 200 L44 120 L56 120 L62 200 L80 200 L74 80 C76 40 70 10 50 10 Z" fill="rgba(8,8,12,.92)"/><circle cx="40" cy="52" r="6" fill="#c1121f" opacity=".85"/><circle cx="60" cy="52" r="6" fill="#c1121f" opacity=".85"/><ellipse cx="50" cy="78" rx="5" ry="9" fill="rgba(0,0,0,.9)"/></svg>',
    /* Pale face in the dark */
    '<svg viewBox="0 0 120 150" aria-hidden="true"><ellipse cx="60" cy="75" rx="42" ry="58" fill="rgba(210,205,195,.16)"/><ellipse cx="44" cy="62" rx="10" ry="14" fill="rgba(0,0,0,.85)"/><ellipse cx="76" cy="62" rx="10" ry="14" fill="rgba(0,0,0,.85)"/><ellipse cx="60" cy="105" rx="9" ry="13" fill="rgba(0,0,0,.85)"/><ellipse cx="60" cy="75" rx="42" ry="58" fill="none" stroke="rgba(210,205,195,.25)" stroke-width="2"/></svg>',
    /* Reaching hand */
    '<svg viewBox="0 0 120 160" aria-hidden="true"><g fill="rgba(15,15,20,.92)"><ellipse cx="60" cy="130" rx="26" ry="22"/><rect x="42" y="60" width="12" height="70" rx="6" transform="rotate(-8 48 95)"/><rect x="56" y="50" width="12" height="80" rx="6"/><rect x="70" y="58" width="12" height="72" rx="6" transform="rotate(8 76 94)"/><rect x="30" y="95" width="11" height="45" rx="5" transform="rotate(-28 35 117)"/><rect x="82" y="95" width="11" height="45" rx="5" transform="rotate(28 87 117)"/></g><circle cx="62" cy="52" r="4" fill="#c1121f" opacity=".7"/></svg>'
  ];

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
    var kind = Math.floor(Math.random() * GHOST_SVGS.length);
    apparition = document.createElement('div');
    apparition.className = 'apparition kind-' + kind;
    apparition.innerHTML = GHOST_SVGS[kind];
    /* Random position: keep clear of edges so it never covers nav/buttons. */
    var x = 8 + Math.random() * 70;   /* vw */
    var y = 18 + Math.random() * 55;  /* vh */
    apparition.style.left = x + 'vw';
    apparition.style.top = y + 'vh';
    var size = 90 + Math.random() * 90; /* px */
    apparition.style.width = size + 'px';

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
