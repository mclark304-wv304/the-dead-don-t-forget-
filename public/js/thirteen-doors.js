/* THE THIRTEEN DOORS — banish the risen before they reach the gate.
   Vanilla JS, canvas-rendered. No-ops on pages without #thirteen-doors. */
(() => {
  const root = document.getElementById('thirteen-doors');
  if (!root) return;

  /* ── Door table: name, banish quota, spawn ms, drift px/s, dread per breach,
         hollow chance (2-tap), mourner chance, darkness vignette alpha ── */
  const DOORS = [
    { name: 'The Gate',                quota: 6,  spawn: 2200, speed: 90,  breach: 10, hollow: 0,    mourner: 0,    dark: 0 },
    { name: 'The Ledger',              quota: 8,  spawn: 1900, speed: 100, breach: 10, hollow: 0,    mourner: 0,    dark: 0 },
    { name: 'The Names on the Wall',   quota: 10, spawn: 1700, speed: 115, breach: 12, hollow: 0,    mourner: 0.15, dark: 0 },
    { name: 'The First Wave',          quota: 12, spawn: 1500, speed: 130, breach: 12, hollow: 0.20, mourner: 0.15, dark: 0 },
    { name: 'The Forty-Fourth Door',   quota: 14, spawn: 1350, speed: 145, breach: 13, hollow: 0.25, mourner: 0.18, dark: 0 },
    { name: 'The Vault',               quota: 16, spawn: 1200, speed: 160, breach: 14, hollow: 0.30, mourner: 0.20, dark: 0 },
    { name: "The Man That Wasn't There", quota: 18, spawn: 1100, speed: 175, breach: 14, hollow: 0.30, mourner: 0.22, dark: 0 },
    { name: 'Eleven Minutes',          quota: 20, spawn: 1000, speed: 190, breach: 15, hollow: 0.35, mourner: 0.22, dark: 0 },
    { name: 'The Woman in the Photograph', quota: 22, spawn: 900, speed: 205, breach: 16, hollow: 0.35, mourner: 0.25, dark: 0 },
    { name: 'The Fourth Door',         quota: 24, spawn: 800,  speed: 225, breach: 17, hollow: 0.40, mourner: 0.25, dark: 0.35 },
    { name: 'What We Keep',            quota: 26, spawn: 720,  speed: 245, breach: 18, hollow: 0.40, mourner: 0.28, dark: 0.45 },
    { name: 'The Choice',              quota: 28, spawn: 640,  speed: 265, breach: 19, hollow: 0.45, mourner: 0.28, dark: 0.55 },
    { name: 'The Thirteenth Door',     quota: 30, spawn: 550,  speed: 300, breach: 20, hollow: 0.50, mourner: 0.30, dark: 0.65 },
  ];
  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'];
  const MOURNER_SIN = 30; // dread spike for banishing a mourner
  const SIZE = 1000, CX = 500, CY = 500, GATE_R = 78;

  const ART = [
    '/img/apparitions/elias.jpg', '/img/apparitions/jonah-bell.jpg',
    '/img/apparitions/lena-mercer.jpg', '/img/apparitions/mara.jpg',
    '/img/apparitions/ruth-mercer.jpg', '/img/wall/claire.jpg',
    '/img/wall/daniel-vale.jpg', '/img/wall/evelyn-shaw.jpg',
    '/img/wall/marcus.jpg',
  ];

  /* ── DOM refs ── */
  const board = root.querySelector('#t13-board');
  const overlay = root.querySelector('#t13-overlay');
  const elDoorNum = root.querySelector('#t13-door-num');
  const elDoorName = root.querySelector('#t13-door-name');
  const elQuota = root.querySelector('#t13-quota');
  const elDread = root.querySelector('#t13-dread');
  const elLives = root.querySelector('#t13-lives');
  const elScore = root.querySelector('#t13-score');
  const elBest = root.querySelector('#t13-best');
  const ctx = board.getContext('2d');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── State ── */
  let state = 'idle'; // idle | playing | between | gameover | victory | paused
  let doorIndex = 0, lives = 3, dread = 0, score = 0, banishedDoor = 0;
  let entities = [], particles = [], floaters = [];
  let spawnTimer = 0, shake = 0, gateFlash = 0, time = 0;
  let best = parseInt(localStorage.getItem('t13_best') || '0', 10) || 0;
  let bestDoor = parseInt(localStorage.getItem('t13_best_door') || '0', 10) || 0;
  elBest.textContent = best;

  /* ── Audio (WebAudio oscillators, created on first tap) ── */
  let AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sBanish = () => { tone(520, 140, 0.25, 'sine', 0.10); tone(780, 300, 0.18, 'triangle', 0.05); };
  const sCrack  = () => tone(300, 180, 0.08, 'square', 0.07);
  const sBreach = () => tone(140, 60, 0.4, 'sawtooth', 0.12);
  const sSin    = () => { tone(220, 110, 0.5, 'sawtooth', 0.12); tone(233, 116, 0.5, 'sawtooth', 0.09); };
  const sClear  = () => { tone(392, 392, 0.16, 'triangle', 0.09); tone(523, 523, 0.16, 'triangle', 0.09, 0.12); tone(659, 659, 0.28, 'triangle', 0.09, 0.24); };
  const sLife   = () => tone(90, 40, 0.8, 'sine', 0.18);
  const sOver   = () => tone(110, 45, 1.2, 'sine', 0.16);
  const sWin    = () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.08, i * 0.15)); };

  /* ── Sprite baking (circular portraits + tints + glows, baked once) ── */
  const SPR = 192;
  const variants = { risen: [], hollow: [], mourner: [] }; // baked canvases per art index
  const glows = {};
  let emberSprite = null, darkSprite = null;

  function bakeCircle(img, tint) {
    const c = document.createElement('canvas'); c.width = c.height = SPR;
    const g = c.getContext('2d');
    g.save();
    g.beginPath(); g.arc(SPR/2, SPR/2, SPR/2 - 4, 0, Math.PI * 2); g.clip();
    const s = Math.max(img.width, img.height);
    g.drawImage(img, (SPR - s) / 2, (SPR - s) / 2, SPR, SPR);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = tint; g.fillRect(0, 0, SPR, SPR);
    g.restore();
    // rim
    g.beginPath(); g.arc(SPR/2, SPR/2, SPR/2 - 4, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 6; g.stroke();
    return c;
  }
  function bakeGlow(colorInner, colorOuter) {
    const c = document.createElement('canvas'); c.width = c.height = SPR;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(SPR/2, SPR/2, SPR*0.18, SPR/2, SPR/2, SPR/2);
    gr.addColorStop(0, colorInner); gr.addColorStop(1, colorOuter);
    g.fillStyle = gr; g.fillRect(0, 0, SPR, SPR);
    return c;
  }
  function bakeSprites() {
    glows.risen = bakeGlow('rgba(193,18,31,0.5)', 'rgba(193,18,31,0)');
    glows.hollow = bakeGlow('rgba(90,0,8,0.65)', 'rgba(90,0,8,0)');
    glows.mourner = bakeGlow('rgba(170,190,220,0.45)', 'rgba(170,190,220,0)');
    const e = document.createElement('canvas'); e.width = e.height = 32;
    const eg = e.getContext('2d');
    const gr = eg.createRadialGradient(16, 16, 1, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.5, 'rgba(226,88,34,0.8)'); gr.addColorStop(1, 'rgba(226,88,34,0)');
    eg.fillStyle = gr; eg.fillRect(0, 0, 32, 32);
    emberSprite = e;
    // closing-darkness vignette, baked full-board once
    const d = document.createElement('canvas'); d.width = d.height = SIZE;
    const dg = d.getContext('2d');
    const vg = dg.createRadialGradient(CX, CY, SIZE*0.28, CX, CY, SIZE*0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.92)');
    dg.fillStyle = vg; dg.fillRect(0, 0, SIZE, SIZE);
    darkSprite = d;

    let loaded = 0, failed = 0;
    ART.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        variants.risen[i] = bakeCircle(img, 'rgba(120,10,16,0.22)');
        variants.hollow[i] = bakeCircle(img, 'rgba(8,0,0,0.55)');
        variants.mourner[i] = bakeCircle(img, 'rgba(198,214,236,0.52)');
        if (++loaded + failed === ART.length) startLoop();
      };
      img.onerror = () => { if (++loaded + failed === ART.length) startLoop(); };
      img.src = src;
    });
    // safety: start even if images hang
    setTimeout(() => { if (!loopStarted) startLoop(); }, 4000);
  }
  let loopStarted = false;

  /* ── Canvas sizing (logical 1000x1000, DPR capped at 2) ── */
  function fit() {
    const w = board.clientWidth || 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    board.width = Math.round(w * dpr);
    board.height = Math.round(w * dpr);
    board.style.height = w + 'px';
    ctx.setTransform(board.width / SIZE, 0, 0, board.width / SIZE, 0, 0);
  }
  window.addEventListener('resize', fit);

  /* ── HUD ── */
  function drawLives() {
    elLives.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const f = document.createElement('span');
      f.className = 'life' + (i < lives ? '' : ' lost');
      elLives.appendChild(f);
    }
  }
  function hud() {
    elDoorNum.textContent = ROMAN[doorIndex];
    elDoorName.textContent = DOORS[doorIndex].name;
    elQuota.textContent = banishedDoor + ' / ' + DOORS[doorIndex].quota;
    elDread.style.width = Math.min(dread, 100) + '%';
    elScore.textContent = score;
    drawLives();
  }

  /* ── Overlays ── */
  function showOverlay(html) {
    overlay.innerHTML = html;
    overlay.hidden = false;
    const btn = overlay.querySelector('button');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); overlayAction(); });
  }
  function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ''; }
  let overlayAction = () => {};

  function idleScreen() {
    state = 'idle';
    showOverlay(
      '<div class="t13-card"><h3>THE THIRTEEN DOORS</h3>' +
      '<p>Thirteen doors. Three lives. The risen drift toward the gate &mdash; <b>tap to banish them</b> before they reach it.</p>' +
      '<p class="t13-rule">Pale <b>mourners</b> only weep and pass through. <b>Never banish a mourner</b> &mdash; it is a sin, and the dread will spike.</p>' +
      '<p class="t13-rule">From the fourth door, <b>hollow ones</b> rise &mdash; darker, needing <b>two taps</b>.</p>' +
      (best > 0 ? '<p class="t13-bestline">Best run: ' + best + ' souls &middot; reached door ' + ROMAN[Math.min(bestDoor, 12)] + '</p>' : '') +
      '<button class="btn-blood" type="button">ENTER THE DOORS</button></div>'
    );
    overlayAction = () => startRun();
    hud();
  }

  /* ── Run / door flow ── */
  function startRun() {
    doorIndex = 0; lives = 3; dread = 0; score = 0;
    audio();
    setupDoor();
  }
  function setupDoor() {
    const d = DOORS[doorIndex];
    entities = []; particles = []; floaters = [];
    dread = 0; banishedDoor = 0; spawnTimer = 0.6;
    state = 'playing';
    hideOverlay();
    hud();
  }
  function doorClear() {
    state = 'between';
    sClear();
    bestDoor = Math.max(bestDoor, doorIndex);
    localStorage.setItem('t13_best_door', String(bestDoor));
    const last = doorIndex === DOORS.length - 1;
    showOverlay(
      '<div class="t13-card"><h3>DOOR ' + ROMAN[doorIndex] + ' OPENS</h3>' +
      '<p>' + (last ? 'The thirteenth door swings wide&hellip;' : 'The dead retreat &mdash; for now.') + '</p>' +
      '<button class="btn-blood" type="button">' + (last ? 'FACE WHAT WAITS' : 'STEP THROUGH') + '</button></div>'
    );
    overlayAction = () => {
      if (last) { victory(); } else { doorIndex++; setupDoor(); }
    };
    // auto-advance if the player just keeps watching
    setTimeout(() => { if (state === 'between') overlayAction(); }, 4000);
  }
  function lifeLost() {
    lives--; sLife();
    shake = reduceMotion ? 0 : 26;
    drawLives();
    if (lives <= 0) { gameOver(); return; }
    state = 'between';
    showOverlay(
      '<div class="t13-card"><h3>THE DOOR SLAMS SHUT</h3>' +
      '<p>A life for a life. <b>' + lives + (lives === 1 ? ' life' : ' lives') + '</b> remain' + (lives === 1 ? 's' : '') + '.</p>' +
      '<button class="btn-blood" type="button">RISE AGAIN</button></div>'
    );
    overlayAction = () => setupDoor();
    setTimeout(() => { if (state === 'between' && lives > 0) overlayAction(); }, 4000);
  }
  function gameOver() {
    state = 'gameover';
    sOver();
    best = Math.max(best, score);
    localStorage.setItem('t13_best', String(best));
    elBest.textContent = best;
    showOverlay(
      '<div class="t13-card"><h3>THE DEAD KEEP WHAT THEY CATCH</h3>' +
      '<p>Souls banished: <b>' + score + '</b><br>Best: <b>' + best + '</b> &middot; Reached door ' + ROMAN[doorIndex] + '</p>' +
      '<button class="btn-blood" type="button">TRY AGAIN</button></div>'
    );
    overlayAction = () => startRun();
  }
  function victoryCard(extraHtml) {
    return '<div class="t13-card"><h3>EVERY NAME HAS A DEBT.<br>YOU PAID YOURS.</h3>' +
      '<p>All thirteen doors stand open behind you.<br>Souls banished: <b>' + score + '</b></p>' +
      extraHtml +
      '<button class="btn-blood" type="button">WALK IT AGAIN</button></div>';
  }
  function victory() {
    state = 'victory';
    sWin();
    best = Math.max(best, score);
    bestDoor = 12;
    localStorage.setItem('t13_best', String(best));
    localStorage.setItem('t13_best_door', '12');
    elBest.textContent = best;
    // dramatic beat before the reward reveal
    showOverlay(
      '<div class="t13-card"><h3>EVERY NAME HAS A DEBT.<br>YOU PAID YOURS.</h3>' +
      '<p>All thirteen doors stand open behind you.<br>Souls banished: <b>' + score + '</b></p>' +
      '<p class="t13-beat">The thirteenth door opens onto something unexpected&hellip;</p></div>'
    );
    overlayAction = () => {};
    setTimeout(revealGameEgg, 2200);
  }
  function revealGameEgg() {
    if (state !== 'victory') return;
    if (localStorage.getItem('game-egg-claimed')) {
      showOverlay(victoryCard(
        '<p class="t13-bestline">The dead remember your victory.</p>' +
        '<p><a class="btn-blood t13-watchbtn" href="/watch/ep7">WATCH EPISODE 7</a></p>'));
      overlayAction = () => startRun();
      return;
    }
    fetch('/api/game-egg/claim', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (state !== 'victory') return;
        if (data && data.ok) {
          localStorage.setItem('game-egg-claimed', '1');
          sClear();
          showOverlay(victoryCard(
            '<p class="t13-reward">EPISODE 7 IS YOURS<br><span>The Choice awaits.</span></p>' +
            '<p><a class="btn-blood t13-watchbtn" href="/watch/ep7">WATCH IT NOW</a></p>'));
        } else {
          showOverlay(victoryCard(
            '<p class="t13-rule">The hundred souls have already been freed.<br>Episode 7 waits in the <a href="/bonus">Bonus Store</a>.</p>'));
        }
        overlayAction = () => startRun();
      })
      .catch(() => {
        if (state !== 'victory') return;
        showOverlay(victoryCard(
          '<p class="t13-rule">The dark hiccuped &mdash; your victory stands.<br>Episode 7 waits in the <a href="/bonus">Bonus Store</a>.</p>'));
        overlayAction = () => startRun();
      });
  }

  /* ── Spawning ── */
  function edgePoint() {
    const m = 70, side = Math.floor(Math.random() * 4), t = Math.random() * SIZE;
    if (side === 0) return { x: t, y: -m };
    if (side === 1) return { x: SIZE + m, y: t };
    if (side === 2) return { x: t, y: SIZE + m };
    return { x: -m, y: t };
  }
  function spawn() {
    const d = DOORS[doorIndex];
    const roll = Math.random();
    const ai = Math.floor(Math.random() * ART.length);
    if (roll < d.mourner) {
      // mourner: drifts straight across, harmless unless tapped
      const p = edgePoint();
      const q = { x: SIZE - p.x, y: SIZE - p.y };
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const sp = d.speed * (0.55 + Math.random() * 0.25);
      entities.push({ type: 'mourner', x: p.x, y: p.y, vx: dx / len * sp, vy: dy / len * sp,
        tx: q.x, ty: q.y, ai, r: 56, wob: Math.random() * 6.28, wobA: 14, fade: 1 });
    } else {
      const hollow = Math.random() < d.hollow;
      const p = edgePoint();
      const jx = CX + (Math.random() - 0.5) * 120, jy = CY + (Math.random() - 0.5) * 120;
      const dx = jx - p.x, dy = jy - p.y, len = Math.hypot(dx, dy) || 1;
      const sp = d.speed * (0.9 + Math.random() * 0.35);
      entities.push({ type: hollow ? 'hollow' : 'risen', x: p.x, y: p.y,
        vx: dx / len * sp, vy: dy / len * sp, tx: jx, ty: jy,
        ai, r: hollow ? 52 : 46, hp: hollow ? 2 : 1, wob: Math.random() * 6.28, wobA: 30 });
    }
  }

  /* ── Combat ── */
  function burst(x, y, n, mourner) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 260;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.5, age: 0, s: 10 + Math.random() * 22,
        mourner: !!mourner });
    }
  }
  function floater(x, y, text, color) {
    floaters.push({ x, y, text, color, age: 0, life: 0.9 });
  }
  function banish(e, idx) {
    entities.splice(idx, 1);
    score++; banishedDoor++;
    burst(e.x, e.y, 14, false);
    floater(e.x, e.y - 40, '+1', '#e8e2d9');
    sBanish();
    hud();
    if (banishedDoor >= DOORS[doorIndex].quota) doorClear();
  }
  function tap(e, idx) {
    if (e.type === 'mourner') {
      // sin — the mourner is NOT banished, dread spikes
      entities.splice(idx, 1);
      dread = Math.min(100, dread + MOURNER_SIN);
      burst(e.x, e.y, 10, true);
      floater(e.x, e.y - 40, 'SIN', '#9db8dd');
      sSin();
      shake = reduceMotion ? 0 : 14;
      hud();
      if (dread >= 100) lifeLost();
      return;
    }
    e.hp--;
    if (e.hp <= 0) { banish(e, idx); }
    else { sCrack(); burst(e.x, e.y, 6, false); floater(e.x, e.y - 40, 'CRACKED', '#e25822'); }
  }

  board.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (state !== 'playing') return;
    audio();
    const r = board.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * SIZE;
    const y = (ev.clientY - r.top) / r.width * SIZE;
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (Math.hypot(e.x - x, e.y - y) < e.r + 16) { tap(e, i); return; }
    }
  });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ── Update ── */
  function update(dt) {
    time += dt;
    const d = DOORS[doorIndex];
    // spawn
    spawnTimer -= dt;
    if (spawnTimer <= 0 && state === 'playing') {
      spawn();
      spawnTimer = d.spawn / 1000 * (0.85 + Math.random() * 0.3);
    }
    // entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      e.wob += dt * 3;
      const px = -e.vy, py = e.vx, pl = Math.hypot(px, py) || 1;
      e.x += (e.vx + px / pl * Math.cos(e.wob) * e.wobA) * dt;
      e.y += (e.vy + py / pl * Math.cos(e.wob) * e.wobA) * dt;
      if (e.type === 'mourner') {
        if (Math.hypot(e.x - e.tx, e.y - e.ty) < 60 || e.x < -120 || e.x > SIZE + 120 || e.y < -120 || e.y > SIZE + 120) {
          entities.splice(i, 1); continue;
        }
      } else if (Math.hypot(e.x - CX, e.y - CY) < GATE_R) {
        // breach!
        entities.splice(i, 1);
        dread = Math.min(100, dread + d.breach);
        gateFlash = 1;
        shake = reduceMotion ? 0 : 10;
        burst(CX, CY, 8, false);
        sBreach();
        hud();
        if (dread >= 100) { lifeLost(); return; }
      }
    }
    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt;
    }
    if (particles.length > 220) particles.splice(0, particles.length - 220);
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.age += dt; f.y -= 46 * dt;
      if (f.age >= f.life) floaters.splice(i, 1);
    }
    gateFlash = Math.max(0, gateFlash - dt * 2.2);
    shake = Math.max(0, shake - dt * 60);
  }

  /* ── Draw ── */
  function drawSprite(e) {
    const set = variants[e.type];
    const baked = set && set[e.ai];
    const s = e.r * 2.6;
    const glow = glows[e.type];
    if (glow) ctx.drawImage(glow, e.x - s / 2, e.y - s / 2, s, s);
    const ps = e.r * 2;
    if (baked) {
      ctx.drawImage(baked, e.x - ps / 2, e.y - ps / 2, ps, ps);
    } else {
      // fallback wisp if art failed to load
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.type === 'mourner' ? 'rgba(170,190,220,0.5)' : 'rgba(60,8,12,0.85)';
      ctx.fill();
    }
    if (e.type === 'hollow' && e.hp > 1) {
      // two ember pips = needs two taps
      ctx.fillStyle = '#e25822';
      ctx.beginPath(); ctx.arc(e.x - 10, e.y + e.r + 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x + 10, e.y + e.r + 8, 6, 0, Math.PI * 2); ctx.fill();
    }
    if (e.type === 'mourner') {
      // weeping streaks
      ctx.strokeStyle = 'rgba(200,220,245,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(e.x - e.r * 0.35, e.y + e.r * 0.1); ctx.lineTo(e.x - e.r * 0.35, e.y + e.r * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.x + e.r * 0.35, e.y + e.r * 0.1); ctx.lineTo(e.x + e.r * 0.35, e.y + e.r * 0.55); ctx.stroke();
    }
  }
  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    // backdrop: near-black with faint red murk
    ctx.fillStyle = '#060607';
    ctx.fillRect(-40, -40, SIZE + 80, SIZE + 80);
    const murk = ctx.createRadialGradient(CX, CY, 60, CX, CY, 620);
    murk.addColorStop(0, 'rgba(60,8,12,0.25)');
    murk.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = murk;
    ctx.fillRect(0, 0, SIZE, SIZE);
    // gate: concentric rings + rune
    const pulse = 1 + Math.sin(time * 2.4) * 0.05;
    ctx.strokeStyle = gateFlash > 0 ? 'rgba(255,60,60,' + (0.4 + gateFlash * 0.6) + ')' : 'rgba(193,18,31,0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(CX, CY, 66 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(193,18,31,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, 88 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = gateFlash > 0 ? 'rgba(255,80,80,0.9)' : 'rgba(232,226,217,0.8)';
    ctx.font = '52px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ᛟ', CX, CY + 2);
    // entities
    for (const e of entities) drawSprite(e);
    // particles (ember sprites)
    if (emberSprite) {
      for (const p of particles) {
        const a = 1 - p.age / p.life;
        ctx.globalAlpha = a;
        ctx.drawImage(emberSprite, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
        ctx.globalAlpha = 1;
      }
    }
    // floaters
    ctx.textAlign = 'center';
    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.age / f.life;
      ctx.font = 'bold 34px Georgia, serif';
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    // closing darkness (doors 10+)
    const dk = DOORS[doorIndex].dark;
    if (dk > 0 && darkSprite) { ctx.globalAlpha = dk; ctx.drawImage(darkSprite, 0, 0); ctx.globalAlpha = 1; }
    // dread edge-pulse when high
    if (state === 'playing' && dread > 65) {      const a = (dread - 65) / 35 * (0.35 + 0.25 * Math.sin(time * 6));
      const eg = ctx.createRadialGradient(CX, CY, SIZE * 0.34, CX, CY, SIZE * 0.72);
      eg.addColorStop(0, 'rgba(193,18,31,0)');
      eg.addColorStop(1, 'rgba(193,18,31,' + Math.max(a, 0).toFixed(3) + ')');
      ctx.fillStyle = eg;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    if (state === 'paused') {
      ctx.fillStyle = 'rgba(6,6,7,0.72)';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#e8e2d9';
      ctx.font = '44px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('THE DARK WAITS…', CX, CY - 20);
      ctx.font = '30px Georgia, serif';
      ctx.fillStyle = '#a39a8d';
      ctx.fillText('tap to continue', CX, CY + 40);
    }
    ctx.restore();
  }

  /* ── Main loop ── */
  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min((t - last) / 1000 || 0, 0.05);
    last = t;
    if (state === 'playing') update(dt);
    else time += dt;
    draw();
  }
  function startLoop() {
    if (loopStarted) return;
    loopStarted = true;
    fit();
    idleScreen();
    requestAnimationFrame(frame);
  }

  /* pause when tab hidden */
  let wasPlaying = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') { wasPlaying = true; state = 'paused'; }
    else if (!document.hidden && state === 'paused' && wasPlaying) { state = 'playing'; wasPlaying = false; last = performance.now(); }
  });
  board.addEventListener('pointerdown', () => {
    if (state === 'paused') { state = 'playing'; wasPlaying = false; }
  });

  fit();
  bakeSprites();
})();
