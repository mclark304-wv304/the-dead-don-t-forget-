/* THE DEAD DON'T FORGET — haunt.js
   Site-wide drifting embers + homepage haunting grounds:
   Wall of Names (click → whisper), lightable candles (global count),
   souls-released score for banished apparitions, hidden sigil hunt.
   All animation is transform/opacity/canvas-only. No blur filters (phone GPUs).
   Everything stands down under prefers-reduced-motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ── Shared whisper synth (Web Audio, no files) ──
     Filtered noise with a falling bandpass = a breathy "shhh".
     pitch shifts it per name so each whisper feels different. */
  var actx = null;
  function whisper(pitch) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var dur = 1.0, rate = actx.sampleRate;
      var buf = actx.createBuffer(1, Math.floor(rate * dur), rate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = actx.createBufferSource(); src.buffer = buf;
      var bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      var p = pitch || 1;
      bp.frequency.setValueAtTime(2600 * p, actx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(650 * p, actx.currentTime + dur);
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.32, actx.currentTime + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      src.connect(bp); bp.connect(g); g.connect(actx.destination);
      src.start(); src.stop(actx.currentTime + dur + 0.05);
    } catch (e) { /* audio unavailable — the visual still answers */ }
  }
  window.__ddfWhisper = whisper;

  /* ── Drifting embers (site-wide canvas) ── */
  (function embers() {
    if (reduceMotion) return;
    var cv = document.createElement('canvas');
    cv.className = 'embers';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var W, H, parts = [];
    var N = isMobile ? 14 : 36;

    /* Pre-rendered glow sprite — no per-frame shadowBlur. */
    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    var sctx = sprite.getContext('2d');
    var grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,170,80,1)');
    grad.addColorStop(0.35, 'rgba(255,110,40,0.55)');
    grad.addColorStop(1, 'rgba(255,80,20,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);

    function size() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    }
    size();
    window.addEventListener('resize', size);

    function spawn(anyY) {
      return {
        x: Math.random() * W,
        y: anyY ? Math.random() * H : H + 20,
        r: 2 + Math.random() * 5,
        vy: 0.35 + Math.random() * 0.9,
        sway: Math.random() * Math.PI * 2,
        swaySpd: 0.008 + Math.random() * 0.02,
        swayAmp: 12 + Math.random() * 26,
        a: 0.25 + Math.random() * 0.55,
        fade: 0.0015 + Math.random() * 0.003
      };
    }
    for (var i = 0; i < N; i++) parts.push(spawn(true));

    var last = 0;
    function tick(t) {
      requestAnimationFrame(tick);
      if (t - last < 33) return; /* ~30fps is plenty for embers */
      last = t;
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.sway += p.swaySpd;
        p.y -= p.vy;
        p.x += Math.sin(p.sway) * 0.6;
        p.a -= p.fade * 0.4;
        if (p.y < -24 || p.a <= 0.02) { parts[i] = spawn(false); continue; }
        ctx.globalAlpha = Math.max(0, Math.min(0.8, p.a));
        var s = p.r * 2 + Math.sin(p.sway * 2) * 1.5;
        ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(tick);
  })();

  /* ── Wall of Names (faces underneath) ──
     Click a name → they whisper one of their own quotes from the chapters.
     Three quotes per soul; each tap speaks the next one. */
  var IMG_V = '?v=20261016q';
  var CHARACTER_QUOTES = {
    'ELIAS': [
      { text: "Is there anything I can do?", ep: "Ep1" },
      { text: "If you're hearing this, Daniel Vale was wrong.", ep: "Ep2" },
      { text: "I want him to remember.", ep: "Ep4" }
    ],
    'MARA': [
      { text: "There's someone at the gate.", ep: "Ep1" },
      { text: "That's exactly what we're going to find out.", ep: "Ep14" },
      { text: "Nobody moves.", ep: "Ep15" }
    ],
    'DANIEL VALE': [
      { text: "Elias.", ep: "Ep1" },
      { text: "I did those things.", ep: "Ep16" },
      { text: "You already were.", ep: "Ep18" }
    ],
    'JONAH BELL': [
      { text: "You were supposed to burn these.", ep: "Ep3" },
      { text: "Three thousand, two hundred and nineteen.", ep: "Ep4" },
      { text: "The people who started this.", ep: "Ep5" }
    ],
    'RUTH MERCER': [
      { text: "Basement.", ep: "Ep3" },
      { text: "Is he dead?", ep: "Ep5" },
      { text: "Let the rest of us survive without being punished for your past.", ep: "Ep6" }
    ],
    'ELENA MERCER': [
      { text: "My father believed the outbreak isn't creating memories.", ep: "Ep2" },
      { text: "Sometimes the dead come for the person who caused the pain.", ep: "Ep13" },
      { text: "That's what makes him human.", ep: "Ep18" }
    ],
    'THOMAS REED': [
      { text: "Not him.", ep: "Ep13" },
      { text: "You.", ep: "Ep13" },
      { text: "You knew.", ep: "Ep13" }
    ],
    'EVELYN SHAW': [
      { text: "Maybe they're wrong.", ep: "Ep5" },
      { text: "I never forgot.", ep: "Ep7" },
      { text: "But you remember my childhood.", ep: "Ep16" }
    ],
    'MARCUS': [
      { text: "Someone studied them.", ep: "Ep8" },
      { text: "They know you.", ep: "Ep10" },
      { text: "We're losing the upper level!", ep: "Ep13" }
    ],
    'CLAIRE': [
      { text: "You were the man who opened the door.", ep: "Ep5" },
      { text: "They found another one.", ep: "Ep8" },
      { text: "Because the procedure didn't stop with death.", ep: "Ep9" }
    ],
    'THOMAS RUSK': [
      { text: "I was the man your father called when he wanted unpleasant things handled without leaving fingerprints.", ep: "Ep5" },
      { text: "You sent me.", ep: "Ep5" },
      { text: "To be remembered.", ep: "Ep5" }
    ],
    'RICHARD CRANE': [
      { text: "Because you were there at the beginning.", ep: "Ep9" },
      { text: "If you shoot me, you'll lose the only person who can explain what happened.", ep: "Ep10" },
      { text: "You remember consequences. That's different.", ep: "Ep10" }
    ]
  };
  var quoteIdx = {};
  var NAMES = [
    { name: 'ELIAS',        img: '/img/apparitions/elias.jpg' + IMG_V },
    { name: 'MARA',         img: '/img/apparitions/mara.jpg' + IMG_V },
    { name: 'DANIEL VALE',  img: '/img/wall/daniel-vale.jpg' + IMG_V },
    { name: 'JONAH BELL',   img: '/img/apparitions/jonah-bell.jpg' + IMG_V },
    { name: 'RUTH MERCER',  img: '/img/apparitions/ruth-mercer.jpg' + IMG_V },
    { name: 'ELENA MERCER', img: '/img/apparitions/lena-mercer.jpg' + IMG_V },
    { name: 'THOMAS REED',  img: null }, /* face still lost to the dark */
    { name: 'EVELYN SHAW',  img: '/img/wall/evelyn-shaw.jpg' + IMG_V },
    { name: 'MARCUS',       img: '/img/wall/marcus.jpg' + IMG_V },
    { name: 'CLAIRE',       img: '/img/wall/claire.jpg' + IMG_V },
    { name: 'THOMAS RUSK',  img: null }, /* face still lost to the dark */
    { name: 'RICHARD CRANE', img: null } /* face still lost to the dark */
  ];
  var wall = document.getElementById('wall-of-names');
  if (wall) {
    NAMES.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wall-name';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', 'Hear ' + n.name + ' whisper');
      if (n.img) {
        var face = document.createElement('img');
        face.className = 'wall-face';
        face.src = n.img;
        face.alt = '';
        face.loading = 'lazy';
        b.appendChild(face);
      } else {
        var veil = document.createElement('span');
        veil.className = 'wall-face wall-veiled';
        veil.setAttribute('aria-hidden', 'true');
        veil.textContent = '?';
        b.appendChild(veil);
      }
      var label = document.createElement('span');
      label.className = 'wall-label';
      label.textContent = n.name;
      b.appendChild(label);
      b.addEventListener('click', function () {
        whisper(0.75 + (i % 6) * 0.12);
        b.classList.remove('heard');
        void b.offsetWidth; /* restart the flash */
        b.classList.add('heard');
        /* they speak: one of their three chapter quotes, cycling */
        var quotes = CHARACTER_QUOTES[n.name];
        if (quotes && quotes.length) {
          var qi = quoteIdx[n.name] || 0;
          var q = quotes[qi % quotes.length];
          quoteIdx[n.name] = qi + 1;
          var qb = b.querySelector('.wall-quote');
          if (!qb) {
            qb = document.createElement('div');
            qb.className = 'wall-quote';
            qb.setAttribute('aria-live', 'polite');
            b.appendChild(qb);
          }
          while (qb.firstChild) qb.removeChild(qb.firstChild);
          var qt = document.createElement('span');
          qt.className = 'q-text';
          qt.textContent = '\u201C' + q.text + '\u201D';
          qb.appendChild(qt);
          var qe = document.createElement('span');
          qe.className = 'q-ep';
          qe.textContent = '— ' + q.ep;
          qb.appendChild(qe);
          qb.style.animation = 'none';
          void qb.offsetWidth; /* restart the fade */
          qb.style.animation = '';
        }
      });
      wall.appendChild(b);
    });
  }

  /* ── Candles: thirteen, tap each to light ──
     Light all 13 and the candle Easter egg wakes: a free episode. */
  var CANDLE_TOTAL = 13;
  var CANDLE_NAMES = ['Elias', 'Mara', 'Daniel', 'Jonah', 'Ruth', 'Elena',
    'Reed', 'Evelyn', 'Marcus', 'Claire', 'Rusk', 'Richard', 'the nameless one'];
  var LIT_KEY = 'ddf_candles_lit_v2';
  var CANDLE_EGG_KEY = 'ddf_candle_egg_claimed';
  var shrine = document.getElementById('candle-shrine');
  var countEl = document.getElementById('candle-count');
  var myEl = document.getElementById('my-candles');

  function litIdx() {
    try {
      var a = JSON.parse(localStorage.getItem(LIT_KEY) || '[]');
      return Array.isArray(a) ? a.filter(function (x) {
        return x >= 0 && x < CANDLE_TOTAL;
      }) : [];
    } catch (e) { return []; }
  }
  function saveLit(a) {
    try { localStorage.setItem(LIT_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function paintCandleCount() {
    var n = litIdx().length;
    if (myEl) myEl.textContent = n + '/' + CANDLE_TOTAL;
  }
  function setGlobalCount(n) {
    if (countEl) countEl.textContent = String(n);
    var w = document.getElementById('candle-word');
    if (w) w.textContent = (n === 1) ? 'candle' : 'candles';
  }

  function renderCandles() {
    if (!shrine) return;
    var lit = litIdx();
    shrine.innerHTML = '';
    for (var i = 0; i < CANDLE_TOTAL; i++) {
      (function (idx) {
        var isLit = lit.indexOf(idx) !== -1;
        var wrap = document.createElement('div');
        wrap.className = 'candle-wrap';
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'candle' + (isLit ? ' lit' : '');
        c.setAttribute('aria-label', isLit ? 'Candle for ' + CANDLE_NAMES[idx] + ' is lit' : 'Light a candle for ' + CANDLE_NAMES[idx]);
        c.innerHTML = '<span class="flame"></span><span class="wick"></span><span class="wax"></span>';
        if (!isLit) {
          c.addEventListener('click', function () { lightCandle(idx, c); });
        }
        var lab = document.createElement('span');
        lab.className = 'candle-label';
        lab.textContent = 'For ' + CANDLE_NAMES[idx];
        wrap.appendChild(c);
        wrap.appendChild(lab);
        shrine.appendChild(wrap);
      })(i);
    }
    paintCandleCount();
  }

  function lightCandle(idx, el) {
    var lit = litIdx();
    if (lit.indexOf(idx) !== -1) return;
    lit.push(idx); saveLit(lit);
    el.classList.add('lit');
    el.setAttribute('aria-label', 'Candle ' + (idx + 1) + ' is lit');
    whisper(1.25);
    paintCandleCount();
    fetch('/api/candles/light', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && typeof d.count === 'number') setGlobalCount(d.count); })
      .catch(function () {});
    if (lit.length >= CANDLE_TOTAL) {
      setTimeout(wakeCandleEgg, 900);
    }
  }

  /* ── Candle Easter egg: all 13 lit → free Episode 5 ── */
  var candleOverlay = null;
  function candleEggClaimed() {
    try { return localStorage.getItem(CANDLE_EGG_KEY) === '1'; } catch (e) { return false; }
  }
  function candleEggEl(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function closeCandleEgg() {
    if (candleOverlay && candleOverlay.parentNode) candleOverlay.parentNode.removeChild(candleOverlay);
    candleOverlay = null;
  }
  function renderCandleEgg(state, wickNumber) {
    var modal = candleEggEl('div', 'egg-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (state === 'offer') {
      modal.appendChild(candleEggEl('div', 'egg-kicker', 'thirteen flames&hellip;'));
      modal.appendChild(candleEggEl('h2', null, 'The dead <span>accept</span> your light.'));
      modal.appendChild(candleEggEl('p', null,
        'You lit all thirteen candles. Take your reward &mdash; Episode 5 Early Access, free. ' +
        'Only 13 wicks will ever burn this bright.'));
      var claim = candleEggEl('button', 'btn', 'Claim your episode');
      claim.type = 'button';
      claim.addEventListener('click', doCandleClaim);
      modal.appendChild(claim);
      modal.appendChild(candleEggEl('br'));
    } else if (state === 'already') {
      modal.appendChild(candleEggEl('div', 'egg-kicker', 'the wax remembers'));
      modal.appendChild(candleEggEl('h2', null, 'You already <span>claimed</span> this light.'));
      modal.appendChild(candleEggEl('p', null, 'One wick, one claim. Your Episode 5 Early Access is waiting.'));
      var watch1 = candleEggEl('a', 'btn', 'Watch Episode 5');
      watch1.href = '/watch/ep5';
      modal.appendChild(watch1);
      modal.appendChild(candleEggEl('br'));
    } else if (state === 'success') {
      modal.appendChild(candleEggEl('div', 'egg-kicker', 'it is written'));
      modal.appendChild(candleEggEl('h2', null, 'Wick <span>claimed</span>.'));
      modal.appendChild(candleEggEl('div', 'egg-soul', '#' + wickNumber));
      modal.appendChild(candleEggEl('p', null,
        'You are wick ' + wickNumber + ' of 13. Episode 5 Early Access is yours &mdash; no payment, no questions.'));
      var watch2 = candleEggEl('a', 'btn', 'Watch Episode 5');
      watch2.href = '/watch/ep5';
      modal.appendChild(watch2);
      modal.appendChild(candleEggEl('br'));
    } else if (state === 'closed') {
      modal.appendChild(candleEggEl('div', 'egg-kicker', 'snuffed out'));
      modal.appendChild(candleEggEl('h2', null, 'The <span>thirteen</span> are taken.'));
      modal.appendChild(candleEggEl('p', null, 'All thirteen wicks are claimed. The dead have what they need &mdash; for now.'));
    } else {
      modal.appendChild(candleEggEl('div', 'egg-kicker', 'static'));
      modal.appendChild(candleEggEl('h2', null, 'The flame <span>flickered</span> out.'));
      modal.appendChild(candleEggEl('p', null, 'Something went wrong on our end. Try again in a moment.'));
    }
    var close = candleEggEl('button', 'egg-close', 'Slip back into the dark');
    close.type = 'button';
    close.addEventListener('click', closeCandleEgg);
    modal.appendChild(close);
    candleOverlay.innerHTML = '';
    candleOverlay.appendChild(modal);
  }
  function doCandleClaim() {
    var modal = candleOverlay.firstChild;
    var btn = modal.querySelector('.btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Listening\u2026'; }
    fetch('/api/candle-egg/claim', { method: 'POST', credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok) {
          try { localStorage.setItem(CANDLE_EGG_KEY, '1'); } catch (e) {}
          renderCandleEgg('success', data.wickNumber);
        } else if (data && data.reason === 'closed') {
          renderCandleEgg('closed', null);
        } else {
          renderCandleEgg('error', null);
        }
      })
      .catch(function () { renderCandleEgg('error', null); });
  }
  function wakeCandleEgg() {
    if (candleOverlay) return;
    candleOverlay = candleEggEl('div', 'egg-overlay');
    candleOverlay.addEventListener('click', function (e) {
      if (e.target === candleOverlay) closeCandleEgg();
    });
    document.body.appendChild(candleOverlay);
    whisper(0.5);
    setTimeout(function () { whisper(0.7); }, 500);
    renderCandleEgg(candleEggClaimed() ? 'already' : 'offer', null);
  }

  if (shrine) {
    renderCandles();
    fetch('/api/candles', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) { setGlobalCount(d.count || 0); })
      .catch(function () { setGlobalCount('many'); });
    var lightAll = document.getElementById('light-all');
    if (lightAll) {
      lightAll.addEventListener('click', function () {
        var lit = litIdx();
        var unlit = [];
        for (var i = 0; i < CANDLE_TOTAL; i++) {
          if (lit.indexOf(i) === -1) unlit.push(i);
        }
        if (!unlit.length) return;
        whisper(1.25);
        fetch('/api/candles/light-many', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n: unlit.length })
        })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d && typeof d.count === 'number') setGlobalCount(d.count); })
          .catch(function () {});
        saveLit(unlit.concat(lit));
        renderCandles();
        setTimeout(wakeCandleEgg, 900);
      });
    }
    var snuffAll = document.getElementById('snuff-all');
    if (snuffAll) {
      snuffAll.addEventListener('click', function () {
        saveLit([]);
        renderCandles();
        toast('The flames die. The dark leans closer.');
      });
    }
  }

  /* ── Souls released (banished apparitions) ── */
  var SOUL_KEY = 'ddf_souls';
  function souls() {
    try { return parseInt(localStorage.getItem(SOUL_KEY) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  var chip = document.createElement('div');
  chip.className = 'soul-chip';
  chip.setAttribute('aria-live', 'polite');
  document.body.appendChild(chip);
  function paintSouls(pulse) {
    var n = souls();
    chip.innerHTML = '&#128128; Souls released: <b>' + n + '</b>';
    chip.style.display = n > 0 ? 'block' : 'none';
    var sc = document.getElementById('souls-count');
    if (sc) sc.textContent = String(n);
    if (pulse) {
      chip.classList.remove('pulse');
      void chip.offsetWidth;
      chip.classList.add('pulse');
    }
  }
  paintSouls(false);
  document.addEventListener('ddf:banished', function () {
    try { localStorage.setItem(SOUL_KEY, String(souls() + 1)); } catch (e) {}
    whisper(0.6);
    paintSouls(true);
  });

  /* ── Sigil hunt: find all 5 → the ELIAS Easter egg wakes ── */
  var SIGIL_TOTAL = 5;
  var sigilCount = document.getElementById('sigil-count');
  var reward = document.getElementById('sigil-reward');
  var foundKey = 'ddf_sigils';
  function foundSigils() {
    try { return JSON.parse(localStorage.getItem(foundKey) || '[]'); }
    catch (e) { return []; }
  }
  function saveSigils(a) {
    try { localStorage.setItem(foundKey, JSON.stringify(a)); } catch (e) {}
  }
  function paintSigils() {
    var f = foundSigils();
    if (sigilCount) sigilCount.textContent = String(Math.min(f.length, SIGIL_TOTAL));
    var dots = document.querySelectorAll('#sigil-dots span');
    dots.forEach(function (dt, i) {
      dt.classList.toggle('on', i < f.length);
    });
    document.querySelectorAll('.sigil').forEach(function (s) {
      if (f.indexOf(s.getAttribute('data-sigil')) !== -1) s.classList.add('found');
    });
    if (f.length >= SIGIL_TOTAL && reward) {
      reward.hidden = false;
      reward.classList.add('revealed');
    }
  }
  document.querySelectorAll('.sigil').forEach(function (s) {
    s.addEventListener('click', function () {
      var id = s.getAttribute('data-sigil');
      var f = foundSigils();
      if (f.indexOf(id) === -1) {
        f.push(id); saveSigils(f);
        whisper(1.5);
        if (f.length === SIGIL_TOTAL) {
          /* The grand whisper — then the real Easter egg opens. */
          setTimeout(function () { whisper(0.5); }, 600);
          setTimeout(function () {
            if (typeof window.__ddfOpenElias === 'function') window.__ddfOpenElias();
          }, 1600);
        }
      }
      paintSigils();
    });
  });
  paintSigils();
})();
