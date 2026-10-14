/* Ambient horror audio — Web Audio API (iOS Safari reliable).
   - AudioContext is created/resumed INSIDE the first user-gesture handler
     (iOS locks it otherwise). Web Audio plays even with the iPhone silent
     switch on; the in-site toggle remains the mute control.
   - Ambience fades in to a low volume after first tap/click/keypress.
   - window.__ddfGroan() plays a random zombie groan (called on apparitions).
   - window.__ddfSetMuted(m) / window.__ddfMuted() drive the sound toggle.
   - If files fail to load, everything no-ops silently — zero errors. */
(function () {
  'use strict';

  var KEY = 'ddf-sound-on';
  var muted = false;
  try { muted = localStorage.getItem(KEY) === '0'; } catch (e) {}

  var ctx = null, ambGain = null, faded = false;
  var groanBufs = {};
  var AMB_VOL = 0.15, GROAN_VOL = 0.5;

  function ensureCtx() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        ambGain = ctx.createGain();
        ambGain.gain.value = 0;
        ambGain.connect(ctx.destination);
        loadLoop('/audio/ambience.mp3?v=20261014f');
        [1, 2, 3].forEach(function (i) { loadGroan(i); });
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      return ctx;
    } catch (e) { return null; }
  }

  function loadLoop(url) {
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error('audio 404');
      return r.arrayBuffer();
    }).then(function (ab) {
      return ctx.decodeAudioData(ab);
    }).then(function (buf) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true; /* buffer itself is a seamless crossfaded loop */
      src.connect(ambGain);
      try { src.start(); } catch (e) {}
    }).catch(function () { /* silent: site works without audio */ });
  }

  function loadGroan(i) {
    fetch('/audio/groan-' + i + '.mp3').then(function (r) {
      if (!r.ok) throw new Error('audio 404');
      return r.arrayBuffer();
    }).then(function (ab) {
      return ctx.decodeAudioData(ab);
    }).then(function (buf) {
      groanBufs[i] = buf;
    }).catch(function () {});
  }

  function fadeAmbienceIn() {
    if (!ctx || !ambGain || muted || faded) return;
    faded = true;
    try {
      var t = ctx.currentTime;
      ambGain.gain.cancelScheduledValues(t);
      ambGain.gain.setValueAtTime(0.0001, t);
      ambGain.gain.exponentialRampToValueAtTime(AMB_VOL, t + 4);
    } catch (e) {}
  }

  /* First user gesture anywhere: unlock audio, fade the dread in. */
  function kick() {
    if (ensureCtx()) fadeAmbienceIn();
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
  }
  window.addEventListener('pointerdown', kick, { passive: true });
  window.addEventListener('keydown', kick);

  window.__ddfGroan = function () {
    if (!ctx || muted) return;
    var b = groanBufs[1 + Math.floor(Math.random() * 3)];
    if (!b) return;
    try {
      var s = ctx.createBufferSource();
      s.buffer = b;
      var g = ctx.createGain();
      g.gain.value = GROAN_VOL;
      s.connect(g);
      g.connect(ctx.destination);
      s.start();
    } catch (e) {}
  };

  function paintToggle() {
    var t = document.querySelector('.sound-toggle .sound-icon');
    if (t) t.textContent = muted ? '🔇' : '🔊';
    var btn = document.querySelector('.sound-toggle');
    if (btn) {
      btn.classList.toggle('on', !muted);
      btn.setAttribute('aria-label', muted ? 'Unmute ambient sound' : 'Mute ambient sound');
    }
  }

  window.__ddfSetMuted = function (m) {
    muted = !!m;
    try { localStorage.setItem(KEY, muted ? '0' : '1'); } catch (e) {}
    if (ctx && ambGain) {
      try {
        var t = ctx.currentTime;
        ambGain.gain.cancelScheduledValues(t);
        ambGain.gain.setValueAtTime(Math.max(ambGain.gain.value, 0.0001), t);
        ambGain.gain.exponentialRampToValueAtTime(muted ? 0.0001 : AMB_VOL, t + 1);
      } catch (e) {}
    }
    paintToggle();
  };
  window.__ddfMuted = function () { return muted; };
  window.__ddfPaintToggle = paintToggle;

  /* Paint initial icon state once the toggle exists. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintToggle);
  } else {
    paintToggle();
  }
})();
