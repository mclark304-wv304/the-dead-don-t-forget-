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
  var AMB_VOL = 0.28, GROAN_VOL = 0.7;
  var dreadOn = false, noiseBuf = null;

  function getNoise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var ch = noiseBuf.getChannelData(0);
      for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  /* Generative dread layer: sub drone + dissonant shimmer + random
     distant events. Synthesized live — works even if the mp3 is missing. */
  function startDread() {
    if (!ctx || !ambGain || dreadOn) return;
    dreadOn = true;
    var dg = ctx.createGain();
    dg.gain.value = 1;
    dg.connect(ambGain);

    // 1. Deep sub drone with slow beating and breathing.
    var droneG = ctx.createGain();
    droneG.gain.value = 0.05;
    droneG.connect(dg);
    [[45, 'sine', 1], [45.9, 'sine', 1], [90.5, 'triangle', 0.22]].forEach(function (cfg) {
      var o = ctx.createOscillator();
      o.type = cfg[1];
      o.frequency.value = cfg[0];
      var g = ctx.createGain();
      g.gain.value = cfg[2];
      o.connect(g); g.connect(droneG);
      try { o.start(); } catch (e) {}
    });
    var lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.06;
    var lg = ctx.createGain(); lg.gain.value = 0.028;
    lfo.connect(lg); lg.connect(droneG.gain);
    try { lfo.start(); } catch (e) {}

    // 2. Barely-there dissonant shimmer, drifting.
    var shimG = ctx.createGain();
    shimG.gain.value = 0.0065;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 720; lp.Q.value = 2.5;
    shimG.connect(lp); lp.connect(dg);
    [466, 619, 932].forEach(function (f) {
      var o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      var dr = ctx.createOscillator();
      dr.frequency.value = 0.04 + Math.random() * 0.09;
      var drg = ctx.createGain(); drg.gain.value = 7;
      dr.connect(drg); drg.connect(o.frequency);
      o.connect(shimG);
      try { o.start(); dr.start(); } catch (e) {}
    });

    // 3. Random distant events: knocks, whisper swells, low moans.
    function knock() {
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(150 + Math.random() * 70, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.55);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(g); g.connect(dg);
      try { o.start(t); o.stop(t + 1.7); } catch (e) {}
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 300 + Math.random() * 120; bp.Q.value = 9;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.045, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      var nb = ctx.createBufferSource();
      nb.buffer = getNoise(); nb.loop = true;
      nb.connect(bp); bp.connect(ng); ng.connect(dg);
      try { nb.start(t); nb.stop(t + 0.6); } catch (e) {}
    }
    function whisperSwell() {
      var t = ctx.currentTime, dur = 2.5 + Math.random() * 2;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(900 + Math.random() * 600, t);
      bp.frequency.linearRampToValueAtTime(2200 + Math.random() * 800, t + dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.028, t + dur * 0.45);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      var nb = ctx.createBufferSource();
      nb.buffer = getNoise(); nb.loop = true;
      nb.connect(bp); bp.connect(g); g.connect(dg);
      try { nb.start(t); nb.stop(t + dur + 0.1); } catch (e) {}
    }
    function lowMoan() {
      var t = ctx.currentTime, dur = 3 + Math.random() * 2;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(82, t);
      o.frequency.linearRampToValueAtTime(47, t + dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      // vibrato
      var vib = ctx.createOscillator();
      vib.frequency.value = 5.5;
      var vg = ctx.createGain(); vg.gain.value = 2.5;
      vib.connect(vg); vg.connect(o.frequency);
      o.connect(g); g.connect(dg);
      try { o.start(t); vib.start(t); o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1); } catch (e) {}
    }
    function schedule() {
      var wait = 9000 + Math.random() * 17000;
      setTimeout(function () {
        try {
          var r = Math.random();
          if (r < 0.4) knock();
          else if (r < 0.7) whisperSwell();
          else lowMoan();
        } catch (e) {}
        schedule();
      }, wait);
    }
    schedule();
  }

  function ensureCtx() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        ambGain = ctx.createGain();
        ambGain.gain.value = 0;
        ambGain.connect(ctx.destination);
        loadLoop('/audio/ambience.mp3?v=20261014h');
        [1, 2, 3].forEach(function (i) { loadGroan(i); });
        startDread();
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
