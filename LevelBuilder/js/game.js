/* Cap Sort Level Builder: play test simulation, following the GDD rules (sections 1.1 to 1.5) */
'use strict';
(function (CS) {

  function Game(model, geom, opts) {
    this.m = model; this.geom = geom; this.R = geom.rows;
    this.opts = Object.assign({ prefill: true, pickPerTick: 1 }, opts || {});
    // where boxes pull items: 'low' = only as items pass the lowest point of the loop (default),
    // 'zone' = the config's pickRows (older Pickup zone option), 'any' = anywhere on the belt
    this.pickMode = this.opts.pickMode || (this.opts.pickZone === true ? 'zone' : this.opts.pickZone === false ? 'any' : 'low');
    this.reset();
  }
  CS.Game = Game;
  const W = CS.ROW_W;

  Game.prototype.reset = function () {
    const m = this.m, R = this.R;
    let nid = 1;
    this.rows = Array.from({ length: R }, () => new Array(W).fill(null));
    // pickup positions on the loop (null = anywhere)
    this.zone = null;
    if (this.pickMode === 'low') {
      const low = this.geom.lowRow || 0;
      this.zone = Array.from({ length: R }, (_, p) => p === low);
    } else if (this.pickMode === 'zone') {
      const bb = this.geom.bbox;
      // configs with pickRows: the first pickRows rows of the loop as the config draws it (start of the loop, nearest the slots);
      // when the belt was reversed to run counter-clockwise, row p sits where row R - p used to be
      const orig = p => this.geom.reversed ? (R - p) % R : p;
      this.zone = this.geom.pickRows > 0 ? Array.from({ length: R }, (_, p) => orig(p) < this.geom.pickRows)
        : Array.from({ length: R }, (_, p) => this.geom.pointAt(p / R).y >= bb.minY + bb.h * 0.6);
    }
    this.shift = 0;
    this.events = [];
    this.log = [];
    this.version = 0;
    this.feeders = [];
    m.feeders.forEach((f, i) => {
      if (this.geom.entryRow[f.entry] == null) { this.say(`Enter Path ${i + 1} skipped: conveyor has no ${f.entry} entry.`); return; }
      this.feeders.push({
        idx: i, entry: f.entry, pos: this.geom.entryRow[f.entry],
        shut: m.doorTurns > 0 && !!f.doorShut,
        rows: f.rows.map(r => r.cells.map(c => c > 0 ? { id: nid++, color: c, hidden: !!r.hidden, lock: r.lock || 0 } : null))
      });
    });
    this.doorTurns = m.doorTurns; this.doorCount = m.doorTurns;
    // Block Queue: two queues take turns being blocked (`lane` first, then `other`)
    const bq = m.blockedLane;
    this.blocked = bq && m.lanes.length > 1 && bq.lane < m.lanes.length
      ? { lane: bq.lane, other: bq.lane2 != null && bq.lane2 < m.lanes.length ? bq.lane2 : bq.lane, turns: Math.max(1, bq.lockTurns), count: Math.max(1, bq.lockTurns) } : null;
    const link = {};
    m.links.forEach(([a, b]) => { link[a] = b; link[b] = a; });
    this.lanes = m.lanes.map(l => l.map(b => ({
      uid: b.uid, color: b.color, size: b.size, cap: CS.boxItems(b.size), filled: 0,
      hidden: !!b.hidden, lock: b.lock || 0, link: link[b.uid] || null
    })));
    this.slots = Array.from({ length: m.slots }, (_, i) => ({ box: null, lock: m.slotLocks[i] || 0, rv: false }));
    this.rvLeft = m.extraSlots;
    this.sends = 0; this.ticks = 0; this.stall = 0;
    this.over = null; this.failsafe = false; this.revives = 0;
    this.used = { hand: 0, shuffle: 0, magnet: 0, rv: 0 };
    this.updateFront(true);
    if (this.opts.prefill) {
      for (let i = 0; i < R; i++) { this.shift = (this.shift + 1) % R; this.feed(); }
      this.shift = 0;
    }
    this.events = [];
    this.say('Level started. Tap a front-row box to send it up.');
  };

  Game.prototype.say = function (t, kind) { this.log.push({ t, kind: kind || 'info', tick: this.ticks }); if (this.log.length > 200) this.log.shift(); this.version++; };
  Game.prototype.rowAtPos = function (pos) { const R = this.R; return this.rows[(((pos - this.shift) % R) + R) % R]; };
  Game.prototype.rowIndexAtPos = function (pos) { const R = this.R; return (((pos - this.shift) % R) + R) % R; };

  /* ---- items ---- */
  Game.prototype.takeFront = function (f) {
    while (f.rows.length) {
      const fr = f.rows[0];
      const i = fr.findIndex(x => x);
      if (i >= 0) { const it = fr[i]; fr[i] = null; if (!fr.some(x => x)) f.rows.shift(); return it; }
      f.rows.shift();
    }
    return null;
  };
  Game.prototype.feed = function () {
    let entered = false;
    this.feeders.forEach(f => {
      if (f.shut || !f.rows.length) return;
      const row = this.rowAtPos(f.pos);
      for (let k = 0; k < W; k++) {
        if (row[k]) continue;
        const it = this.takeFront(f);
        if (!it) break;
        it.hidden = false;      // hidden items show their colour once they reach the centre conveyor
        row[k] = it; entered = true;
      }
    });
    if (entered) { this.version++; this.clearSpentBlocks(); }
    return entered;
  };
  // Block Door and Block Queue end for the rest of the level once one Enter Path of the door pair runs out of items, or one
  // queue of the blocked pair runs out of boxes
  Game.prototype.clearSpentBlocks = function (silent) {
    if (this.doorTurns > 0 && this.feeders.length > 1 && this.feeders.some(f => !f.rows.length)) {
      this.feeders.forEach(f => { f.shut = false; });
      this.doorTurns = 0;
      if (!silent) this.say('Block Door removed: an Enter Path ran out of items.');
    }
    const B = this.blocked;
    if (B && (!this.lanes[B.lane].length || !this.lanes[B.other].length)) {
      this.blocked = null;
      if (!silent) this.say('Block Queue removed: a queue of the pair ran out of boxes.');
    }
  };
  Game.prototype.forEachItem = function (fn) {
    this.rows.forEach(r => r.forEach(it => { if (it) fn(it); }));
    this.feeders.forEach(f => f.rows.forEach(r => r.forEach(it => { if (it) fn(it); })));
  };

  Game.prototype.pick = function () {
    let picked = false;
    const R = this.R;
    this.slots.forEach((s, si) => {
      const b = s.box;
      if (!b || b.filled >= b.cap) return;
      // at the lowest point a box takes every matching item in the row passing it; elsewhere one item per step
      let n = this.pickMode === 'low' ? Infinity : this.opts.pickPerTick;
      for (let p = 0; p < R && n > 0; p++) {
        if (this.zone && !this.zone[p]) continue;
        const j = this.rowIndexAtPos(p);
        const row = this.rows[j];
        for (let k = 0; k < W && n > 0 && b.filled < b.cap; k++) {
          const it = row[k];
          if (it && it.color === b.color && !(it.lock > 0)) {
            row[k] = null; b.filled++; n--; picked = true;
            this.events.push({ type: 'fly', color: it.color, from: { kind: 'belt', j, k }, to: { kind: 'slot', i: si } });
          }
        }
      }
    });
    if (picked) this.version++;
    return picked;
  };

  Game.prototype.clearFull = function () {
    this.slots.forEach((s, i) => {
      if (s.box && s.box.filled >= s.box.cap) {
        this.events.push({ type: 'clear', slot: i, color: s.box.color });
        s.box = null; this.version++;
      }
    });
  };

  /* ---- boxes ---- */
  Game.prototype.findBox = function (uid) {
    for (let l = 0; l < this.lanes.length; l++) { const t = this.lanes[l].findIndex(b => b.uid === uid); if (t >= 0) return { l, t, b: this.lanes[l][t] }; }
    return null;
  };
  Game.prototype.updateFront = function (silent) {
    this.clearSpentBlocks(silent);
    this.lanes.forEach(l => {
      const b = l[0];
      if (b && b.hidden) { b.hidden = false; if (!silent) this.say(`Hidden Box revealed: ${CS.COLORS[b.color].name} ${b.cap}.`); }
    });
    this.lanes.forEach(l => {
      const b = l[0];
      if (!b || !b.link) return;
      const p = this.findBox(b.link);
      if (!p) { b.link = null; return; }
      if (p.t === 0) { b.link = null; p.b.link = null; if (!silent) this.say('Linked Boxes reached the top: link broken.'); }
    });
    this.version++;
  };
  Game.prototype.canSendLane = function (l) {
    const b = this.lanes[l] && this.lanes[l][0];
    if (!b) return false;
    if (b.lock > 0 || b.link) return false;
    if (this.isBlocked(l)) return false;
    return true;
  };
  // Block Queue: only sends from other queues count the block down. When no other queue can send, the fail-safe in
  // checkState removes every lock and block (GDD 1.4, "Fail-safe for locks and blocks")
  Game.prototype.isBlocked = function (l) {
    return !!(this.blocked && this.blocked.lane === l);
  };
  Game.prototype.freeSlot = function () { return this.slots.findIndex(s => !s.box && !(s.lock > 0)); };
  Game.prototype.whyNot = function (l) {
    const b = this.lanes[l] && this.lanes[l][0];
    if (!b) return 'Queue is empty';
    if (this.isBlocked(l)) return `Queue is blocked (${this.blocked.count} more boxes from other queues)`;
    if (b.lock > 0) return `Locked Box: ${b.lock} more box${b.lock > 1 ? 'es' : ''} to send`;
    if (b.link) return 'Linked Box: its partner must reach the top of its queue';
    if (this.freeSlot() < 0) return 'No free slot';
    return '';
  };

  Game.prototype.send = function (l) {
    if (this.over) return 'Level is over';
    const why = this.whyNot(l);
    if (why) return why;
    const si = this.freeSlot();
    const fronts = this.lanes.map(q => q[0]);   // the front boxes before this send
    const b = this.lanes[l].shift();
    b.hidden = false;
    this.slots[si].box = b;
    this.sends++;
    this.events.push({ type: 'send', lane: l, slot: si, color: b.color });
    // every lock and block counts boxes sent to the slots. A Locked Item only counts once it is on the conveyor, and a
    // Locked Box only while it is at the front of its queue (a box that just moved up starts counting at the next send)
    this.rows.forEach(r => r.forEach(it => { if (it && it.lock > 0) it.lock--; }));
    fronts.forEach(x => { if (x && x !== b && x.lock > 0) x.lock--; });
    this.slots.forEach((s, i) => { if (i !== si && s.lock > 0) { s.lock--; if (!s.lock) this.say(`Slot ${i + 1} unlocked.`); } });
    if (this.doorTurns > 0 && this.feeders.length) {
      this.doorCount--;
      if (this.doorCount <= 0) {
        this.feeders.forEach(f => { f.shut = !f.shut; });
        this.doorCount = this.doorTurns;
        this.say('Block Door: doors switched (' + this.feeders.map(f => CS.ENTRY_LABEL[f.entry] + (f.shut ? ' shut' : ' open')).join(', ') + ').');
      }
    }
    if (this.blocked && l !== this.blocked.lane) {
      this.blocked.count--;
      if (this.blocked.count <= 0) {
        // the block switches to the other queue of the pair (once either queue runs out, clearSpentBlocks removes it)
        const B = this.blocked, o = B.other;
        if (o !== B.lane) { this.say(`Queue ${B.lane + 1} unblocked; queue ${o + 1} is blocked now.`); B.other = B.lane; B.lane = o; }
        else this.say(`Queue ${B.lane + 1} stays blocked.`);
        B.count = B.turns;
      }
    }
    this.updateFront();
    this.stall = 0;
    this.checkState(true);
    return '';
  };

  /* ---- stuck, fail-safe, win and lose ---- */
  Game.prototype.anyLocks = function () {
    let items = false;
    this.forEachItem(it => { if (it.lock > 0) items = true; });
    return {
      items,
      boxes: this.lanes.some(l => l.some(b => b.lock > 0)),
      slots: this.slots.some(s => s.lock > 0),
      door: this.doorTurns > 0 && this.feeders.some(f => f.shut && f.rows.some(r => r.some(x => x))),   // only a shut door with items behind it
      queue: !!this.blocked
    };
  };
  Game.prototype.releaseAll = function (why) {
    this.forEachItem(it => { it.lock = 0; });
    this.lanes.forEach(l => l.forEach(b => { b.lock = 0; }));
    this.slots.forEach(s => { s.lock = 0; });
    this.feeders.forEach(f => { f.shut = false; });
    this.doorTurns = 0; this.blocked = null; this.failsafe = true;
    this.say('Fail-safe: ' + why + ' All locks and blocks removed.', 'warn');
    this.stall = 0;
  };
  Game.prototype.checkState = function (progress) {
    if (this.over) return;
    if (progress) this.stall = 0; else this.stall++;
    const qEmpty = this.lanes.every(l => !l.length);
    const sEmpty = this.slots.every(s => !s.box);
    if (qEmpty && sEmpty) { this.over = 'win'; this.say('Level complete!', 'win'); return; }
    const L = this.anyLocks();
    const stalled = this.stall > this.R + 2;
    if (!qEmpty && !this.lanes.some((_, i) => this.canSendLane(i)) && (L.boxes || L.queue)) {
      this.releaseAll('no front-row box can be sent while a Locked Box or Block Queue is still active.'); return;
    }
    // GDD fail-safe: once every box is sent, Locked Items and shut doors can no longer count down
    if (qEmpty && (L.items || L.door)) {
      this.releaseAll(`every box has been sent but ${L.items ? 'Locked Items remain' : 'a shut door remains'}.`); return;
    }
    const unlockedFull = this.slots.every(s => s.box || s.lock > 0);
    if (unlockedFull && stalled && L.slots) {
      this.releaseAll('every unlocked slot is full and stuck while a Locked Slot is still locked.'); return;
    }
    const canAct = this.freeSlot() >= 0 && this.lanes.some((_, i) => this.canSendLane(i));
    if (stalled && !canAct) {
      this.over = 'lose';
      this.say('Out of moves: every slot is taken and no box can take another item.', 'lose');
    }
  };

  Game.prototype.step = function () {
    if (this.over) return;
    this.ticks++;
    this.shift = (this.shift + 1) % this.R;
    const a = this.feed();
    const b = this.pick();
    this.clearFull();
    this.checkState(a || b);
  };

  /* ---- boosters (GDD 1.5) ---- */
  Game.prototype.collect = function (color, n, to) {
    const take = [];
    const R = this.R;
    const belt = locked => {
      for (let p = 0; p < R && take.length < n; p++) {
        const j = this.rowIndexAtPos(p), row = this.rows[j];
        for (let k = 0; k < W && take.length < n; k++) {
          const it = row[k];
          if (it && it.color === color && (locked ? it.lock > 0 : !(it.lock > 0))) { row[k] = null; take.push({ kind: 'belt', j, k }); }
        }
      }
    };
    const paths = locked => {
      const maxR = Math.max(0, ...this.feeders.map(f => f.rows.length));
      for (let r = 0; r < maxR && take.length < n; r++) {
        this.feeders.forEach((f, fi) => {
          const row = f.rows[r];
          if (!row) return;
          for (let k = 0; k < W && take.length < n; k++) {
            const it = row[k];
            if (it && it.color === color && (locked ? it.lock > 0 : !(it.lock > 0))) { row[k] = null; take.push({ kind: 'gate', entry: f.entry, r, k }); }
          }
        });
      }
    };
    belt(false); paths(false); belt(true); paths(true);
    this.feeders.forEach(f => { f.rows = f.rows.filter(r => r.some(x => x)); });
    take.forEach(from => this.events.push({ type: 'fly', color, from, to }));
    this.version++;
    return take.length;
  };
  Game.prototype.hand = function (l, t) {
    if (this.over === 'win') return 'Level is over';
    const b = this.lanes[l] && this.lanes[l][t];
    if (!b) return 'Pick a box in the queues';
    this.lanes[l].splice(t, 1);
    if (b.link) { const p = this.findBox(b.link); if (p) p.b.link = null; }
    const got = this.collect(b.color, b.cap, { kind: 'lane', l });
    this.used.hand++;
    this.say(`Hand: cleared a ${CS.COLORS[b.color].name} ${b.cap} box from queue ${l + 1}` + (got < b.cap ? ` (only ${got} items found).` : '.'));
    this.over = null; this.stall = 0;
    this.updateFront();
    this.checkState(true);
    return '';
  };
  Game.prototype.magnet = function (si, free) {
    const s = this.slots[si];
    if (!s || !s.box) return 'Pick a box in the slots';
    const b = s.box;
    const need = b.cap - b.filled;
    const got = this.collect(b.color, need, { kind: 'slot', i: si });
    b.filled = b.cap;
    this.events.push({ type: 'clear', slot: si, color: b.color });
    s.box = null;
    if (!free) this.used.magnet++;
    this.say(`Magnet${free ? ' (revive)' : ''}: cleared the ${CS.COLORS[b.color].name} box in slot ${si + 1}` + (got < need ? ` (only ${got} of ${need} items found).` : '.'));
    this.stall = 0;
    return '';
  };
  Game.prototype.shuffleBooster = function () {
    if (this.over === 'win') return 'Level is over';
    // 1. up to 3 colours from the centre conveyor: normal items by count, then Locked Items
    const cnt = {}, lk = {};
    this.rows.forEach(r => r.forEach(it => { if (!it) return; if (it.lock > 0) lk[it.color] = 1; else cnt[it.color] = (cnt[it.color] || 0) + 1; }));
    const cols = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a]);
    Object.keys(lk).map(Number).forEach(c => { if (!cols.includes(c)) cols.push(c); });
    const pickCols = cols.slice(0, 3);
    // 2. best box of each colour: normal > hidden > linked, larger capacity first, ties random
    const rank = b => b.link ? 2 : b.hidden ? 1 : 0;
    const chosen = [];
    pickCols.forEach(c => {
      const cands = [];
      this.lanes.forEach((q, l) => q.forEach((b, t) => { if (b.color === c && !chosen.some(x => x.b === b)) cands.push({ b, l, t, rnd: Math.random() }); }));
      cands.sort((x, y) => rank(x.b) - rank(y.b) || y.b.cap - x.b.cap || x.rnd - y.rnd);
      if (cands[0]) chosen.push(cands[0]);
    });
    // remove chosen boxes, then shuffle everything else that is not linked (Linked Boxes keep their queue and spot)
    chosen.forEach(c => { const q = this.lanes[c.l]; q.splice(q.indexOf(c.b), 1); });
    const pool = [];
    this.lanes.forEach(q => q.forEach(b => { if (!b.link) pool.push(b); }));
    CS.shuffle(pool);
    this.lanes = this.lanes.map(q => q.map(b => b.link ? b : pool.pop()));
    // move chosen boxes to the top of a queue (linked: own queue, link breaks)
    const usedLanes = new Set();
    chosen.forEach(c => {
      if (c.b.link) {
        const p = this.findBox(c.b.link); if (p) p.b.link = null;
        c.b.link = null; this.lanes[c.l].unshift(c.b); usedLanes.add(c.l); return;
      }
    });
    chosen.forEach(c => {
      if (this.lanes.some(q => q.includes(c.b))) return;
      let l = this.lanes.findIndex((q, i) => !usedLanes.has(i) && !(this.blocked && this.blocked.lane === i));
      if (l < 0) l = c.l;
      usedLanes.add(l);
      this.lanes[l].unshift(c.b);
    });
    this.used.shuffle++;
    this.say('Shuffle: ' + (pickCols.length ? 'moved ' + chosen.map(c => CS.COLORS[c.b.color].name).join(', ') + ' to the top and shuffled the rest.' : 'no items on the conveyor, shuffled the queues.'));
    this.updateFront();
    this.stall = 0;
    return '';
  };
  Game.prototype.revive = function () {
    if (this.over !== 'lose') return 'Revive is only offered after a loss';
    this.over = null; this.revives++;
    const idx = this.slots.map((s, i) => i).filter(i => this.slots[i].box)
      .sort((a, b) => this.slots[b].box.cap - this.slots[a].box.cap).slice(0, 3);
    this.say('Revive: free Magnet on the 3 biggest boxes in the slots.');
    idx.forEach(i => this.magnet(i, true));
    this.stall = 0;
    return '';
  };
  Game.prototype.addRV = function () {
    if (this.rvLeft <= 0) return 'No RV slots left in this level';
    if (this.slots.length >= CS.MAX_SLOTS) return 'Already at the maximum of 6 slots';
    this.slots.push({ box: null, lock: 0, rv: true });
    this.rvLeft--; this.used.rv++;
    if (this.over === 'lose') this.over = null;
    this.stall = 0;
    this.say('RV Slot: watched an ad, +1 slot.');
    return '';
  };

  /* ---- simple bot for auto play ---- */
  Game.prototype.botMove = function () {
    if (this.over || this.freeSlot() < 0) return -1;
    const avail = {};
    this.rows.forEach(r => r.forEach(it => { if (it && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + 1; }));
    this.feeders.forEach(f => f.rows.slice(0, 2).forEach(r => r.forEach(it => { if (it && !f.shut) avail[it.color] = (avail[it.color] || 0) + 0.5; })));
    let best = -1, bs = -Infinity;
    this.lanes.forEach((q, l) => {
      if (!this.canSendLane(l)) return;
      const b = q[0];
      const inSlots = this.slots.filter(s => s.box && s.box.color === b.color).reduce((a, s) => a + s.box.cap - s.box.filled, 0);
      const score = (avail[b.color] || 0) - inSlots - b.cap * 0.25 + q.length * 0.05;
      if (score > bs) { bs = score; best = l; }
    });
    if (best >= 0) this.send(best);
    return best;
  };

  /* ---- counters for the UI ---- */
  Game.prototype.stats = function () {
    let belt = 0, waiting = 0;
    this.rows.forEach(r => r.forEach(it => { if (it) belt++; }));
    this.feeders.forEach(f => f.rows.forEach(r => r.forEach(it => { if (it) waiting++; })));
    return {
      belt, waiting, boxes: this.lanes.reduce((a, q) => a + q.length, 0) + this.slots.filter(s => s.box).length,
      sends: this.sends, ticks: this.ticks
    };
  };

})(window.CS);
