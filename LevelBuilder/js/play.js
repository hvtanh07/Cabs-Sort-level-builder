/* Cap Sort Level Builder: play test screen */
'use strict';
(function (CS) {
  const $ = CS.$, $$ = CS.$$, esc = CS.esc;
  const TPS = 6;          // conveyor rows per second at 1×

  const P = CS.Play = {
    game: null, view: null, raf: 0, running: true, acc: 0, last: 0,
    tool: null, anims: [], flashes: {}, seenVersion: -1, time: 0, autoN: 0
  };

  P.start = function () {
    const A = CS.App;
    if (!A.m) return;
    A.mode = 'play';
    $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === 'play'));
    $('#editBar').classList.add('hidden'); $('#playBar').classList.remove('hidden');
    $('#board').classList.add('play');
    $('#pPick').value = A.prefs.pick;
    $$('#speedSeg button').forEach(b => b.classList.toggle('on', +b.dataset.speed === A.prefs.speed));
    P.restart();
    cancelAnimationFrame(P.raf);
    P.last = performance.now();
    P.raf = requestAnimationFrame(P.loop);
    A.renderAll();
  };
  P.stop = function () {
    const A = CS.App;
    cancelAnimationFrame(P.raf); P.raf = 0;
    A.mode = 'edit';
    $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === 'edit'));
    $('#editBar').classList.remove('hidden'); $('#playBar').classList.add('hidden');
    $('#board').classList.remove('play', 'mode-hand', 'mode-magnet');
    $('#banner').classList.add('hidden');
    P.game = null;
    P.unlockHeights();
    A.renderAll();
  };
  P.restart = function () {
    const A = CS.App;
    const g = A.geom(A.m.conveyor);
    P.game = new CS.Game(CS.clone(A.m), g, { pickMode: A.prefs.pick });
    P.view = new CS.ConvView($('#convCanvas'), g);
    P.acc = 0; P.anims = []; P.flashes = {}; P.time = 0; P.tool = null; P.seenVersion = -1;
    P.unlockHeights();
    P.setRunning(true);
    $('#banner').classList.add('hidden');
    P.render();
  };
  P.setRunning = function (on) {
    P.running = on;
    $('#pPause').textContent = on ? '❚❚ Pause' : '▶ Resume';
  };
  P.setTool = function (t) {
    P.tool = P.tool === t ? null : t;
    const b = $('#board');
    b.classList.toggle('mode-hand', P.tool === 'hand');
    b.classList.toggle('mode-magnet', P.tool === 'magnet');
    if (P.tool) CS.App.toast(P.tool === 'hand' ? 'Hand: click any box in the queues' : 'Magnet: click a box in the slots');
    P.renderPanel();
  };

  /* ---------- main loop ---------- */
  P.loop = function (ts) {
    const A = CS.App;
    if (A.mode !== 'play' || !P.game) return;
    const dt = Math.min(0.1, (ts - P.last) / 1000); P.last = ts;
    const G = P.game;
    if (P.running && !G.over) {
      P.time += dt;
      P.acc += dt * TPS * A.prefs.speed;
      while (P.acc >= 1 && !G.over) {
        P.acc -= 1;
        G.step();
        if ($('#pAuto').checked && ++P.autoN % 3 === 0) G.botMove();
      }
      if (G.over) P.acc = 0;
    }
    P.drawConveyor();
    P.drainEvents();
    P.drawFx(ts);
    if (G.version !== P.seenVersion) { P.seenVersion = G.version; P.render(); }
    P.raf = requestAnimationFrame(P.loop);
  };
  P.drawConveyor = function () {
    const G = P.game, A = CS.App;
    P.view.draw({ rows: G.rows, shift: G.shift, phase: G.over ? 0 : P.acc }, A.gatesFor(A.m, P.view.g, G), { pickMark: G.pickMode === 'low' });
  };

  /* positions (relative to the board) for animations */
  P.boardRect = () => $('#board').getBoundingClientRect();
  P.posOf = function (src) {
    const br = P.boardRect();
    if (src.kind === 'belt') {
      const G = P.game, R = G.R;
      const cr = $('#convCanvas').getBoundingClientRect();
      const t = (((src.j + G.shift) % R) + P.acc) / R;
      const s = P.view.spot(t, src.k);
      return { x: s.x + cr.left - br.left, y: s.y + cr.top - br.top };
    }
    if (src.kind === 'gate') {
      const cr = $('#convCanvas').getBoundingClientRect();
      const g = P.view.gate(src.entry);
      if (!g) return { x: br.width / 2, y: 0 };
      const d = P.view.beltW * P.view.sc / 2 + 14 + src.r * 8;
      return { x: g.x + g.nx * d + cr.left - br.left, y: g.y + g.ny * d + cr.top - br.top };
    }
    let el = null;
    if (src.kind === 'slot') el = $(`#slots [data-slot="${src.i}"]`);
    if (src.kind === 'lane') el = $(`#queues [data-l="${src.l}"]`);
    if (!el) return { x: br.width / 2, y: br.height / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - br.left, y: (src.kind === 'lane' ? r.top + 30 : r.top + r.height / 2) - br.top };
  };
  P.drainEvents = function () {
    const G = P.game;
    const now = performance.now();
    const dur = 380 / Math.sqrt(CS.App.prefs.speed);
    G.events.splice(0).forEach((ev, i) => {
      if (ev.type === 'fly') P.anims.push({ color: ev.color, a: P.posOf(ev.from), to: ev.to, t0: now + Math.min(i, 12) * 12, dur });
      if (ev.type === 'clear') P.flashes['s' + ev.slot] = now;
      if (ev.type === 'send') P.flashes['n' + ev.slot] = now;
    });
  };
  P.drawFx = function (ts) {
    const fx = $('#fx');
    const { ctx, w, h } = CS.fitCanvas(fx);
    ctx.clearRect(0, 0, w, h);
    const now = performance.now();
    const r = Math.max(4, (P.view.itemR || 6));
    P.anims = P.anims.filter(an => {
      const k = (now - an.t0) / an.dur;
      if (k < 0) { CS.drawCap(ctx, an.a.x, an.a.y, r, an.color); return true; }
      if (k >= 1) return false;
      const b = P.posOf(an.to);
      const e = 1 - Math.pow(1 - k, 3);
      const x = an.a.x + (b.x - an.a.x) * e, y = an.a.y + (b.y - an.a.y) * e - Math.sin(Math.PI * k) * 40;
      CS.drawCap(ctx, x, y, r * (1 - 0.3 * k), an.color);
      return true;
    });
    // slot clear sparkles
    Object.keys(P.flashes).forEach(key => {
      if (key[0] !== 's') return;
      const k = (now - P.flashes[key]) / 450;
      if (k > 1) { delete P.flashes[key]; return; }
      const c = P.posOf({ kind: 'slot', i: +key.slice(1) });
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#FFD84A'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, 20 + k * 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
  };

  /* ---------- DOM ---------- */
  P.render = function () {
    const G = P.game; if (!G) return;
    // feeders
    $('#feeders').innerHTML = CS.ENTRIES.map(entry => {
      const f = G.feeders.find(x => x.entry === entry);
      if (!f) return '<div></div>';
      const items = f.rows.reduce((a, r) => a + r.filter(Boolean).length, 0);
      const rows = f.rows.slice(0, 40).map((r, ri) => {
        const lk = Math.max(0, ...r.map(it => it && it.lock || 0));
        const hid = r.some(it => it && it.hidden);
        return `<div class="frow ${hid ? 'hid' : ''} ${lk ? 'lk' : ''}"><span class="ri">${ri + 1}</span>${r.map(it => `<span class="cell ${it ? (it.hidden ? 'c0' : 'c' + it.color) : 'empty'}"></span>`).join('')}<span class="fb">${lk ? '🔒' + lk : ''}</span></div>`;
      }).join('');
      return `<div class="feeder"><div class="fh">${CS.ENTRY_LABEL[entry]} <small>${f.rows.length} rows · ${items} items</small>
        ${G.doorTurns > 0 ? `<span class="door ${f.shut ? 'shut' : ''}">${f.shut ? 'shut ' + G.doorCount : 'open'}</span>` : ''}</div>
        <div class="frows">${rows || '<div class="hint" style="text-align:center">empty</div>'}${f.rows.length > 40 ? `<div class="hint" style="text-align:center">+${f.rows.length - 40} more rows</div>` : ''}</div></div>`;
    }).join('');
    // slots
    const now = performance.now();
    $('#slots').innerHTML = G.slots.map((s, i) => {
      const fresh = P.flashes['n' + i] && now - P.flashes['n' + i] < 400;
      let inner = '';
      if (s.box) inner = CS.boxHTML(s.box, s.box.cap - s.box.filled, { fill: s.box.filled / s.box.cap, extra: fresh ? 'popin' : '' });
      else if (s.lock > 0) inner = `<span class="lockb">🔒${s.lock}</span>`;
      return `<div class="slot ${s.rv ? 'rv' : ''} ${!s.box && !(s.lock > 0) ? 'free' : ''}" data-slot="${i}">${inner}</div>`;
    }).join('') + (G.rvLeft > 0 && G.slots.length < CS.MAX_SLOTS ? `<button class="slot rv" data-rv="1" title="Watch an ad for an extra slot">+ RV<br><small>${G.rvLeft} left</small></button>` : '');
    // queues
    const letters = {};
    let n = 0;
    G.lanes.forEach(q => q.forEach(b => { if (b.link && !letters[b.uid]) { const L = String.fromCharCode(65 + (n++ % 26)); letters[b.uid] = L; letters[b.link] = L; } }));
    $('#queues').innerHTML = G.lanes.map((q, l) => {
      const blocked = G.isBlocked(l);
      const can = G.canSendLane(l) && G.freeSlot() >= 0;
      return `<div class="lane ${blocked ? 'blocked' : ''}" data-l="${l}">
        <div class="lh">Q${l + 1} · ${q.length}${blocked ? ` <span class="blk">⛔${G.blocked.count}</span>` : ''}</div>
        ${q.map((b, t) => {
          const masked = b.hidden;
          const html = CS.boxHTML(masked ? Object.assign({}, b, { color: 0, hidden: false, size: 1 }) : b, masked ? '?' : b.cap, {
            link: letters[b.uid] && b.link ? letters[b.uid] : '', extra: (t === 0 ? (can ? 'front' : 'cant') : '') + (masked ? ' mask' : ''),
            title: t === 0 ? (G.whyNot(l) || 'Click to send') : ''
          });
          return html;
        }).join('')}</div>`;
    }).join('');
    P.lockHeights();
    P.renderPanel();
    // banner
    const ban = $('#banner');
    if (G.over === 'win') {
      ban.innerHTML = `<h3>🎉 Level complete</h3><div>${G.sends} boxes sent · ${Math.round(P.time)} s` +
        `${G.used.hand + G.used.shuffle + G.used.magnet ? ` · boosters: ${G.used.hand} Hand, ${G.used.shuffle} Shuffle, ${G.used.magnet} Magnet` : ''}` +
        `${G.revives ? ` · ${G.revives} revive` : ''}${G.used.rv ? ` · ${G.used.rv} RV slot` : ''}${G.failsafe ? ' · fail-safe fired' : ''}</div>
        <div class="row"><button data-b="restart" class="primary">Play again</button><button data-b="exit">Back to edit</button></div>`;
      ban.classList.remove('hidden');
    } else if (G.over === 'lose') {
      ban.innerHTML = `<h3>Out of moves</h3><div>Every slot is taken and no box can take another item.</div>
        <div class="row"><button data-b="revive" class="primary">Revive (free Magnet ×3)</button>
        ${G.rvLeft > 0 && G.slots.length < CS.MAX_SLOTS ? '<button data-b="rv">+ RV slot</button>' : ''}
        <button data-b="restart">Restart</button><button data-b="exit">Back to edit</button></div>`;
      ban.classList.remove('hidden');
    } else ban.classList.add('hidden');
  };

  /* Keep the Enter Paths and queues at their tallest height so far, so the
     conveyor and slots stay put as items and boxes run out. */
  P.lockHeights = function () {
    ['#feeders', '#queues'].forEach(sel => {
      const el = $(sel);
      el.style.minHeight = Math.max(parseFloat(el.style.minHeight) || 0, el.offsetHeight) + 'px';
    });
  };
  P.unlockHeights = function () {
    ['#feeders', '#queues'].forEach(sel => { $(sel).style.minHeight = ''; });
  };

  P.renderPanel = function () {
    const G = P.game; if (!G) return;
    const st = G.stats();
    const L = G.anyLocks();
    const counters = [];
    if (G.doorTurns > 0) counters.push(`Block Door switches in <b>${G.doorCount}</b>`);
    if (G.blocked) counters.push(`Queue ${G.blocked.lane + 1} blocked for <b>${G.blocked.count}</b> more`);
    if (L.slots) counters.push('Locked Slot: ' + G.slots.map((s, i) => s.lock > 0 ? `#${i + 1} <b>${s.lock}</b>` : '').filter(Boolean).join(', '));
    if (G.failsafe) counters.push('Fail-safe fired: locks removed');
    $('#inspector').innerHTML = `<div class="tabs"><button class="on">Play test</button></div><div class="pane">
      <div class="stats">
        <div class="stat"><b>${st.boxes}</b><span>boxes left</span></div>
        <div class="stat"><b>${st.sends}</b><span>boxes sent</span></div>
        <div class="stat"><b>${st.belt}</b><span>items on conveyor</span></div>
        <div class="stat"><b>${st.waiting}</b><span>items in Enter Paths</span></div>
        <div class="stat"><b>${G.ticks}</b><span>conveyor steps</span></div>
        <div class="stat"><b>${Math.round(P.time)} s</b><span>play time</span></div>
      </div>
      ${counters.length ? `<h3>Countdowns</h3><div class="hint">${counters.join('<br>')}</div>` : ''}
      <h3>Boosters</h3>
      <div class="boost">
        <button data-p="hand" class="${P.tool === 'hand' ? 'on' : ''}" title="H">✋ Hand<small>clear any box in the queues · used ${G.used.hand}</small></button>
        <button data-p="shuffle" title="S">🔀 Shuffle<small>reorder the queues · used ${G.used.shuffle}</small></button>
        <button data-p="magnet" class="${P.tool === 'magnet' ? 'on' : ''}" title="M">🧲 Magnet<small>clear a box in the slots · used ${G.used.magnet}</small></button>
        <button data-p="rv" ${G.rvLeft > 0 && G.slots.length < CS.MAX_SLOTS ? '' : 'disabled'}>📺 RV slot<small>${G.rvLeft} left · used ${G.used.rv}</small></button>
      </div>
      <div class="hint">Boosters are unlimited in play test. Click a front box (or press 1–6) to send it.</div>
      <h3>Events</h3>
      <ul class="msgs log">${G.log.slice().reverse().map(x => `<li class="${x.kind}">${esc(x.t)}</li>`).join('')}</ul>
    </div>`;
  };

  /* ---------- input ---------- */
  P.bind = function () {
    const A = CS.App;
    // pointerdown, not click: the queues are redrawn many times a second, and a
    // redraw between mouse down and mouse up swallows the click
    $('#board').addEventListener('pointerdown', e => {
      if (A.mode !== 'play' || !P.game || e.button !== 0) return;
      const G = P.game;
      const b = e.target.closest('[data-b]');
      if (b) {
        const k = b.dataset.b;
        if (k === 'restart') P.restart();
        else if (k === 'exit') P.stop();
        else if (k === 'revive') { G.revive(); P.render(); }
        else if (k === 'rv') { G.addRV(); P.render(); }
        return;
      }
      if (e.target.closest('[data-rv]')) { const err = G.addRV(); if (err) A.toast(err); P.render(); return; }
      const box = e.target.closest('.box');
      const lane = e.target.closest('.lane');
      const slot = e.target.closest('.slot');
      if (P.tool === 'hand' && box && lane) {
        const l = +lane.dataset.l, t = G.lanes[l].findIndex(x => x.uid === box.dataset.uid);
        const err = G.hand(l, t); if (err) A.toast(err); P.setTool(null); P.render(); return;
      }
      if (P.tool === 'magnet' && slot) {
        const err = G.magnet(+slot.dataset.slot); if (err) { A.toast(err); return; } P.setTool(null); P.render(); return;
      }
      if (lane && !P.tool) P.send(+lane.dataset.l, box);
    });
    $('#inspector').addEventListener('click', e => {
      if (A.mode !== 'play' || !P.game) return;
      const b = e.target.closest('[data-p]'); if (!b || b.disabled) return;
      P.booster(b.dataset.p);
    });
    $('#pPause').onclick = () => P.setRunning(!P.running);
    $('#pRestart').onclick = () => P.restart();
    $('#pExit').onclick = () => P.stop();
    $('#pStep').onclick = () => { if (P.game && !P.game.over) { P.setRunning(false); P.game.step(); } };
    $('#pPick').onchange = e => {
      A.prefs.pick = e.target.value; A.savePrefs(); P.restart();
      A.toast({ low: 'Boxes pull items only as they pass the lowest point of the conveyor. Restarted.', zone: 'Pickup zone: boxes pull items from the config\'s pickRows rows. Restarted.', any: 'Boxes pull items from anywhere on the conveyor. Restarted.' }[A.prefs.pick]);
    };
    $('#speedSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-speed]'); if (!b) return;
      A.prefs.speed = +b.dataset.speed; A.savePrefs();
      $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b));
    });
  };
  P.send = function (l, el) {
    const G = P.game;
    const err = G.send(l);
    if (err) {
      CS.App.toast(err);
      const front = $(`#queues [data-l="${l}"] .box`);
      if (front) { front.classList.remove('shake'); void front.offsetWidth; front.classList.add('shake'); }
    }
  };
  P.booster = function (k) {
    const G = P.game, A = CS.App;
    if (k === 'hand' || k === 'magnet') { P.setTool(k); return; }
    if (k === 'shuffle') { const err = G.shuffleBooster(); if (err) A.toast(err); P.render(); return; }
    if (k === 'rv') { const err = G.addRV(); if (err) A.toast(err); P.render(); }
  };
  P.key = function (e) {
    const G = P.game; if (!G) return false;
    const k = e.key;
    if (k === ' ') { P.setRunning(!P.running); return true; }
    if (k === 'r' || k === 'R') { P.restart(); return true; }
    if (k === '.') { $('#pStep').click(); return true; }
    if (k === 'Escape') { if (P.tool) P.setTool(null); else P.stop(); return true; }
    if (/^[1-9]$/.test(k)) { if (+k <= G.lanes.length) P.send(+k - 1); return true; }
    if (k === 'h' || k === 'H') { P.booster('hand'); return true; }
    if (k === 'm' || k === 'M') { P.booster('magnet'); return true; }
    if (k === 's' || k === 'S') { P.booster('shuffle'); return true; }
    return false;
  };

})(window.CS);
