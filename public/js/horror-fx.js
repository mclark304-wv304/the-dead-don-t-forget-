/* Horror FX — phone-friendly interactions + ambient audio.
   - Floating sound toggle: loops dark ambient drone (off by default; browsers need a tap anyway).
   - Tap the hero: the dead stir — screen flicker + shudder + sting. */
(function () {
  'use strict';

  /* ── Ambient sound toggle ── */
  var SOUND_KEY = 'ddf-sound-on';
  var ambient = null;
  var soundOn = false;
  try { soundOn = localStorage.getItem(SOUND_KEY) === '1'; } catch (e) {}

  var toggle = document.createElement('button');
  toggle.className = 'sound-toggle';
  toggle.setAttribute('aria-label', 'Toggle ambient sound');
  toggle.innerHTML = '<span class="sound-icon" aria-hidden="true">♪</span>';
  document.body.appendChild(toggle);

  function setIcon() {
    toggle.classList.toggle('on', soundOn);
    toggle.setAttribute('aria-label', soundOn ? 'Mute ambient sound' : 'Play ambient sound');
  }

  function ensureAmbient() {
    if (!ambient) {
      ambient = new Audio('/audio/ambient.mp3');
      ambient.loop = true;
      ambient.volume = 0.5;
      ambient.preload = 'auto';
    }
    return ambient;
  }

  function applySound() {
    setIcon();
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) {}
    if (soundOn) {
      ensureAmbient().play().catch(function () {
        /* autoplay blocked — user can tap again */
        soundOn = false;
        applySound();
      });
    } else if (ambient) {
      ambient.pause();
    }
  }

  toggle.addEventListener('click', function () {
    soundOn = !soundOn;
    applySound();
  });
  setIcon();
  /* Don't autoplay on load — but if they left it on, start on first touch. */
  if (soundOn) {
    var kickstart = function () {
      applySound();
      window.removeEventListener('touchstart', kickstart);
      window.removeEventListener('click', kickstart);
    };
    window.addEventListener('touchstart', kickstart, { passive: true });
    window.addEventListener('click', kickstart);
  }

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
  var sting2 = null;
  function getSting() {
    if (!sting2) { sting2 = new Audio('/audio/sting.mp3'); sting2.volume = 0.4; sting2.preload = 'auto'; }
    return sting2;
  }

  function spawnApparition() {
    if (apparition || document.hidden) { scheduleNext(); return; }
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
    /* Trigger the fade-in on the next frame. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (apparition) apparition.classList.add('risen');
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
    /* The dead are patient: every 20–45 seconds. */
    setTimeout(spawnApparition, 20000 + Math.random() * 25000);
  }
  /* First visitation comes a little sooner, once the page has settled. */
  setTimeout(spawnApparition, 9000 + Math.random() * 8000);
})();
