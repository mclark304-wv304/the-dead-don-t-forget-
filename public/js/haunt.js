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

  /* ── Wall of Names ── */
  var NAMES = [
    'ELIAS', 'MARA', 'DANIEL VALE', 'JONAH BELL',
    'RUTH MERCER', 'ELENA MERCER', 'THOMAS REED', 'EVELYN SHAW',
    'MARCUS', 'CLAIRE', 'THOMAS RUSK', 'RICHARD CRANE'
  ];
  var wall = document.getElementById('wall-of-names');
  if (wall) {
    NAMES.forEach(function (name, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wall-name';
      b.setAttribute('role', 'listitem');
      b.textContent = name;
      b.addEventListener('click', function () {
        whisper(0.75 + (i % 6) * 0.12);
        b.classList.remove('heard');
        void b.offsetWidth; /* restart the flash */
        b.classList.add('heard');
      });
      wall.appendChild(b);
    });
  }

  /* ── Candles ── */
  var shrine = document.getElementById('candle-shrine');
  var countEl = document.getElementById('candle-count');
  var myEl = document.getElementById('my-candles');
  var lightBtn = document.getElementById('light-candle');
  var MAX_SHOWN = 48;

  function myLit() {
    try { return parseInt(localStorage.getItem('ddf_my_candles') || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function setMyLit(n) {
    try { localStorage.setItem('ddf_my_candles', String(n)); } catch (e) {}
    if (myEl) myEl.textContent = String(n);
  }
  function renderShrine(total) {
    if (!shrine) return;
    shrine.innerHTML = '';
    var show = Math.min(total, MAX_SHOWN);
    for (var i = 0; i < show; i++) {
      var c = document.createElement('div');
      c.className = 'candle' + (i === show - 1 ? ' newest' : '');
      c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<div class="flame"></div><div class="wick"></div><div class="wax"></div>';
      shrine.appendChild(c);
    }
    if (total > MAX_SHOWN) {
      var more = document.createElement('div');
      more.className = 'candle-more';
      more.textContent = '+' + (total - MAX_SHOWN) + ' more';
      shrine.appendChild(more);
    }
    if (total === 0) {
      var none = document.createElement('p');
      none.className = 'fine';
      none.textContent = 'No candles burn yet. Light the first one.';
      shrine.appendChild(none);
    }
  }
  function setCount(n) { if (countEl) countEl.textContent = String(n); }

  if (shrine) {
    setMyLit(myLit());
    fetch('/api/candles', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) { setCount(d.count || 0); renderShrine(d.count || 0); })
      .catch(function () { setCount('many'); });
    if (lightBtn) {
      lightBtn.addEventListener('click', function () {
        lightBtn.disabled = true;
        whisper(1.25);
        fetch('/api/candles/light', { method: 'POST' })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (res.ok) {
              setCount(res.d.count);
              renderShrine(res.d.count);
              setMyLit(myLit() + 1);
            }
            setTimeout(function () { lightBtn.disabled = false; }, 10000);
          })
          .catch(function () { lightBtn.disabled = false; });
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

  /* ── Sigil hunt ── */
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
          /* The grand whisper. */
          setTimeout(function () { whisper(0.5); }, 600);
        }
      }
      paintSigils();
    });
  });
  paintSigils();
})();
