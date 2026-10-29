/* Build + verify the 40 element-unlock levels. node gen.js [only=N,...] */
'use strict';
global.window = global;
const L = require('path').join(__dirname, '../../js/') ;
require(L + 'conveyors.js'); require(L + 'data.js'); require(L + 'game.js');
const CS = global.CS;
const GEOM = {};
CS.PRESET_CONVEYORS.forEach(r => { const c = CS.normConveyor(r); GEOM[c.id] = CS.buildGeom(c); });

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

/* ---------- level construction ---------- */
const SIZE = { 1: 4, 2: 6, 3: 8, 4: 10 };   // rows of 4 items per box tier: 16 / 24 / 32 / 40 items
const TIER = { 4: 1, 6: 2, 8: 3, 10: 4 };   // rows back to the box `size` saved in the level file
function make(S, seed) {
  const r = rng(seed * 7919 + S.n * 104729);
  const N = S.boxes, lanesN = S.lanes;
  // sizes: specs count boxes by tier (1 = small, big2 / big3 / big4 = the next tiers up); SIZE turns a tier into the
  // box size in rows of 4 items (16 / 24 / 32 / 40 items)
  const SZ = S.sizeMap || SIZE;
  const sizes = new Array(N).fill(1);
  const free = [...Array(N).keys()].filter(i => i >= (S.bigFrom != null ? S.bigFrom : 0));
  CS.shuffle(free, r);
  let k = 0;
  if (S.sizeAt) S.sizeAt.forEach((z, i) => { sizes[i] = z; });   // every box's tier in send order, e.g. level 1: 32 / 40 items
  else if (S.bigAt) S.bigAt.forEach(i => { sizes[i] = 2; });   // fixed spots in send order, e.g. one 24-item box per queue
  else [[2, S.big2 || 0], [3, S.big3 || 0], [4, S.big4 || 0]].forEach(([sz, cnt]) => { for (let i = 0; i < cnt; i++) sizes[free[k++]] = sz; });
  for (let i = 0; i < N; i++) sizes[i] = SZ[sizes[i]];
  // colours: in send order, cycle a shuffled palette, no colour twice within the last few boxes
  const pal = CS.shuffle(S.palette ? S.palette.slice() : [1, 2, 3, 4, 5, 6, 7, 8], r).slice(0, S.colors);
  if (S.mustColor && !pal.includes(S.mustColor)) pal[0] = S.mustColor;   // the colour this level unlocks
  const cols = [];
  const gap = Math.min(S.colors - 1, S.colorGap != null ? S.colorGap : 2);
  const used = {}; pal.forEach(c => used[c] = 0);
  for (let i = 0; i < N; i++) {
    const recent = cols.slice(Math.max(0, i - gap));
    // colour phases: only a sliding window of the palette is active, so far-off boxes need colours that are not on the belt yet
    const act = S.phase ? pal.filter((c, ci) => { const st = Math.floor(i / S.phaseLen); return ((ci - st) % pal.length + pal.length) % pal.length < S.phase; }) : pal;
    let cand = act.filter(c => !recent.includes(c));
    if (!cand.length) cand = act.slice();
    const mn = Math.min(...cand.map(c => used[c]));
    cand = cand.filter(c => used[c] <= mn + (S.colorSlack || 0));
    const c = pick(r, cand);
    cols.push(c); used[c] += sizes[i];
  }
  if (S.colorAt) S.colorAt.forEach((c, i) => { cols[i] = c; });   // every box's colour in send order, e.g. level 1: Red, Red, Yellow, Yellow, Blue, Blue
  if (S.late && S.late.unique) {
    // the first big box gets a colour of its own, so the belt cannot fill it from other boxes' items
    const bi = sizes.findIndex(z => z > SZ[1]), own = cols[bi], rest = pal.filter(c => c !== own);
    let k2 = 0;
    for (let i = 0; i < N; i++) if (i !== bi && cols[i] === own) {
      const near = [cols[i - 1], cols[i - 2], cols[i + 1], cols[i + 2], cols[i - lanesN], cols[i + lanesN]];
      const ok = rest.filter(c => !near.includes(c));
      cols[i] = ok.length ? ok[k2++ % ok.length] : rest[k2++ % rest.length];
    }
  }
  // send order -> lanes (round robin by depth)
  const order = [];
  for (let i = 0; i < N; i++) order.push({ i, color: cols[i], size: sizes[i], lane: i % lanesN, depth: Math.floor(i / lanesN) });
  if (S.stick) {
    // solution order sends runs from one queue: wrong picks fill slots with boxes whose items are still far away
    const left = Array.from({ length: lanesN }, (_, l) => Math.floor(N / lanesN) + (l < N % lanesN ? 1 : 0));
    const depth = new Array(lanesN).fill(0);
    let cur = ri(r, 0, lanesN - 1);
    order.forEach(b => {
      if (!(left[cur] > 0 && r() < S.stick)) {
        const opts = [...Array(lanesN).keys()].filter(l => left[l] > 0 && l !== cur);
        const tot = opts.reduce((a, l) => a + left[l], 0);
        if (opts.length) { let x = r() * tot; cur = opts.find(l => (x -= left[l]) < 0); if (cur == null) cur = opts[opts.length - 1]; }
      }
      b.lane = cur; b.depth = depth[cur]++; left[cur]--;
    });
  }
  // `atPos(lane, depth)` -> [colour, tier]: colour and size follow the box's place in the queues, not the send order (level 6
  // keeps its diagonal colour stripes and 24 / 32 checkerboard while `stick` makes each queue send in runs)
  if (S.atPos) order.forEach(b => { const [c, z] = S.atPos(b.lane, b.depth); b.color = c; b.size = SZ[z]; });
  // items in send order, one colour per Enter Path row: each box brings `size` rows of 4 of its colour
  const units = [];
  order.forEach(b => { for (let j = 0; j < b.size; j++) units.push({ c: b.color, b: b.i, key: units.length }); });
  if (S.swap) {   // swap where two boxes sit in the queues, but keep their items where they were
    const a = S.swap[0], b = S.swap[1] < 0 ? order.length + S.swap[1] : S.swap[1]; const A = order[a], B = order[b];
    [A.lane, B.lane] = [B.lane, A.lane]; [A.depth, B.depth] = [B.depth, A.depth];
  }
  const w = (S.window || 0) / 4;   // spec windows are in items
  units.forEach(x => { x.key += r() * w; });
  if (S.late) {  // L5: the last rows of the first big box go to the very end
    const lb = order.find(b => b.size > SZ[1]);
    const idx = units.map((x, i) => i).filter(i => units[i].b === lb.i);
    idx.slice(-Math.ceil(S.late.count / 4)).forEach(i => { units[i].key = 1e9 + i; });
  }
  if (S.chunk) {
    // `chunk` [min, max]: each box's rows split into blocks of min-max rows that stay together (one Enter Path each), so the
    // paths show blocks of one colour; each block keeps the key of its first row
    const [lo, hi] = S.chunk;
    let c = -1;
    order.forEach(bx => {
      const own = units.filter(x => x.b === bx.i);
      const k = ri(r, Math.ceil(own.length / hi), Math.max(Math.ceil(own.length / hi), Math.floor(own.length / lo)));
      const len = new Array(k).fill(Math.floor(own.length / k));
      for (let j = 0; j < own.length % k; j++) len[j]++;
      let at = 0;
      CS.shuffle(len, r).forEach(n => { c++; own.slice(at, at + n).forEach((x, j) => { x.chunk = c; x.key = own[at].key + j * 1e-6; }); at += n; });
    });
  }
  if (S.rowOrder) units.forEach(x => { x.key += 1e6 * S.rowOrder.indexOf(x.b); });   // box groups enter in this order (box indices in send order)
  units.sort((a, b) => a.key - b.key);
  const rows = units.map(x => [x.c, x.c, x.c, x.c]);
  // lanes
  const lanes = Array.from({ length: lanesN }, () => []);
  order.slice().sort((a, b) => a.depth - b.depth || a.lane - b.lane).forEach(b => {
    lanes[b.lane].push({ color: b.color, size: b.size, _o: b.i });
  });
  // feeders
  const F = S.entries.length;
  const feeders = S.entries.map(e => ({ rows: [], entry: e }));
  if (S.door) {
    // Block Door: items for the boxes sent while a door is open queue behind that door
    units.forEach(x => {
      const ph = Math.floor((x.b + (S.doorLead || 0)) / S.door);
      feeders[x.b >= N * (1 - (S.doorTail || 0)) ? 0 : ph % 2].rows.push({ cells: [x.c, x.c, x.c, x.c], hidden: false, lock: 0 });
    });
  } else if (S.chunk) {
    // row blocks take turns between the Enter Paths, in entry order. A block that would land right behind one of its own colour
    // and make the patch longer than `chunk[1]` rows goes to another path (run.js rejects a level where no path is free)
    const blocks = [];
    units.forEach((x, i) => { if (i === 0 || x.chunk !== units[i - 1].chunk) blocks.push([]); blocks[blocks.length - 1].push(i); });
    const last = new Array(F).fill(0), run = new Array(F).fill(0);
    let g = 0;
    for (let bi = 0; bi < blocks.length; bi++) {
      const pathFor = blk => { const c = units[blk[0]].c; return [...Array(F).keys()].map(d => (g + d) % F).find(k => last[k] !== c || run[k] + blk.length <= S.chunk[1]); };
      let f = pathFor(blocks[bi]);
      if (f == null) f = g % F;
      blocks[bi].forEach(i => feeders[f].rows.push({ cells: rows[i], hidden: false, lock: 0 }));
      const c = units[blocks[bi][0]].c; run[f] = last[f] === c ? run[f] + blocks[bi].length : blocks[bi].length; last[f] = c; g = f + 1;
    }
  } else if (S.groupPaths) {
    // keep each box's rows together: whole row groups take turns between the Enter Paths, in entry order
    let g = -1;
    units.forEach((x, i) => { if (i === 0 || x.b !== units[i - 1].b) g++; feeders[g % F].rows.push({ cells: rows[i], hidden: false, lock: 0 }); });
  } else {
    // share the rows so every Enter Path still has about the same number of rows waiting once the belt is full:
    // each path first gets the rows it feeds while the belt fills, plus an equal share of the rest
    const take = prefillRows(S.conveyor, S.entries);
    const spare = Math.max(0, rows.length - take.reduce((a, b) => a + b, 0));
    const want = take.map(t => t + spare / F);
    const tot = want.reduce((a, b) => a + b, 0) || 1;
    const got = new Array(F).fill(0);
    rows.forEach((row, i) => {
      // smooth weighted round robin: the path furthest behind its share takes the next row
      let k = 0, best = -Infinity;
      for (let f = 0; f < F; f++) { const d = want[f] / tot * (i + 1) - got[f]; if (d > best + 1e-9) { best = d; k = f; } }
      got[k]++;
      feeders[k].rows.push({ cells: row, hidden: false, lock: 0 });
    });
  }

  // ---- elements ----
  const boxes = []; lanes.forEach((q, l) => q.forEach((b, t) => boxes.push({ b, l, t })));
  const taken = new Set();
  const choose = (n, filt) => {
    const c = CS.shuffle(boxes.filter(x => !taken.has(x.b) && filt(x)), r).slice(0, n);
    c.forEach(x => taken.add(x.b)); return c;
  };
  const maxDepth = Math.max(...lanes.map(q => q.length));
  if (S.hiddenPattern) {
    // fixed pattern by queue and position (1 = front box, never hidden)
    boxes.forEach(x => { if (x.t >= 1 && S.hiddenPattern(x.l, x.t + 1)) { x.b.hidden = true; taken.add(x.b); } });
  } else if (S.hidden) {
    const hs = (S.hiddenSizes || [1]).map(t => SZ[t]);
    const c = S.needHiddenSize ? choose(1, x => x.t >= 1 && x.b.size === SZ[S.needHiddenSize]) : [];
    c.push(...choose(S.hidden - c.length, x => x.t >= 1 && hs.includes(x.b.size)));
    c.forEach(x => { x.b.hidden = true; });
    if (c.length < S.hidden) throw new Error('not enough hidden candidates');
  }
  if (S.locks) {
    // Locked Boxes: a lock counts down one per box sent while the box is at the front of its queue, so each count is just
    // `lockRange` sends. `lockAt` places some at fixed spots ([lane, tray, turns], e.g. a front box locked at the start).
    // The others are never a front box at the start, never two in a row in a queue, and never two at the same depth in
    // neighbouring queues, so a row of locks rarely reaches the front of every queue at once (CS.queueDeadlock checks it).
    // `lockFrom` / `lockDepth` set the depths
    const [a, b] = S.lockRange || [2, 3];
    const from = S.lockFrom != null ? S.lockFrom : 1;
    let depth = S.lockDepth != null ? S.lockDepth : Math.max(2, S.locks + 1);
    const fixed = (S.lockAt || []).map(([l, t, turns]) => {
      const x = boxes.find(z => z.l === l && z.t === t);
      if (!x || taken.has(x.b)) throw new Error('bad lockAt');
      x.turns = turns; return x;
    });
    fixed.forEach(x => taken.add(x.b));
    const pickLocks = (depth, loose) => {
      const perLane = {}, c = fixed.slice();
      fixed.forEach(x => { perLane[x.l] = (perLane[x.l] || 0) + 1; });
      for (const x of CS.shuffle(boxes.filter(x => !taken.has(x.b) && x.t >= from && x.t <= depth), r)) {
        if (c.length >= S.locks) break;
        const turns = ri(r, a, b);
        if ((perLane[x.l] || 0) >= (S.lockPerLane || 99)) continue;
        // `loose`: two locks may share a depth when their queues are not next to each other
        if (c.some(y => (y.l === x.l && Math.abs(y.t - x.t) <= 1) || (y.l !== x.l && y.t === x.t && (!loose || Math.abs(y.l - x.l) < 2)))) continue;
        perLane[x.l] = (perLane[x.l] || 0) + 1; x.turns = turns; c.push(x);
      }
      return c;
    };
    // when the depths do not hold enough candidates (e.g. a hidden pattern takes every other box), look one box further back
    let c = pickLocks(depth);
    while (c.length < S.locks && depth < maxDepth) c = pickLocks(++depth);
    if (c.length < S.locks) c = pickLocks(maxDepth, true);
    if (c.length < S.locks) throw new Error('not enough lock candidates');
    c.forEach(x => { taken.add(x.b); x.b.lockTurns = x.turns; });
  }
  const links = [];
  // Block Queue: the queue that starts blocked and its neighbour (the next one, or the one before for the last queue) take
  // turns being blocked. With Linked Boxes the pair is picked first and holds none: a partner waiting behind the block can
  // jam both queues
  const blockFirst = S.block && S.links ? (S.blockLane != null ? S.blockLane : ri(r, 0, lanesN - 1)) : null;
  const blockPair = l => [l, l < lanesN - 1 ? l + 1 : l - 1];
  const noLink = blockFirst != null ? blockPair(blockFirst) : [];
  // `linkAt` places links at fixed spots ([[lane, tray], [lane, tray]] pairs, e.g. a front box linked to one 2 boxes back),
  // then `links` more are picked at random from tray `linkFrom` back
  (S.linkAt || []).forEach(([[la, ta], [lb, tb]]) => {
    const x = boxes.find(z => z.l === la && z.t === ta), y = boxes.find(z => z.l === lb && z.t === tb);
    if (!x || !y || taken.has(x.b) || taken.has(y.b) || Math.abs(la - lb) !== 1) throw new Error('bad linkAt');
    taken.add(x.b); taken.add(y.b); links.push({ a: { lane: la, tray: ta }, b: { lane: lb, tray: tb } });
  });
  if (S.links) {
    for (let n = 0; n < S.links; n++) {
      const c = CS.shuffle(boxes.filter(x => !taken.has(x.b) && x.t >= (S.linkFrom || 1) && !x.b.hidden && !noLink.includes(x.l)), r);
      let done = false;
      for (const x of c) {
        // partners sit in neighbouring queues, so no other queue lies between them
        const y = c.find(z => z !== x && Math.abs(z.l - x.l) === 1 && Math.abs(z.t - x.t) <= (S.linkSpread || 1) && !taken.has(z.b));
        if (y && !taken.has(x.b)) { taken.add(x.b); taken.add(y.b); links.push({ a: { lane: x.l, tray: x.t }, b: { lane: y.l, tray: y.t } }); done = true; break; }
      }
      if (!done) throw new Error('no link pair');
    }
  }
  if (S.dropLinks) links.length = 0;
  // `lockedRowAt` locks fixed rows ([entry, row, lock] triples, e.g. the first row in so the lock shows at the start),
  // then `lockedRows` more are picked at random
  // `lockRun`: a lock covers the run of next-to-each-other rows of the same colour around the picked row (up to that many
  // rows, the following rows first), so a whole block of one colour is held back
  const one = row => row.cells.every(c => c === row.cells[0]) ? row.cells[0] : 0;
  const lockRows = (f, i, lock) => {
    const c = one(f.rows[i]), run = [i], max = S.lockRun || 1;
    for (let k = i + 1; c && run.length < max && f.rows[k] && !f.rows[k].lock && one(f.rows[k]) === c; k++) run.push(k);
    for (let k = i - 1; c && run.length < max && k >= 0 && !f.rows[k].lock && one(f.rows[k]) === c; k--) run.push(k);
    run.forEach(k => { f.rows[k].lock = lock; });
  };
  (S.lockedRowAt || []).forEach(([entry, ri2, lock]) => {
    const f = feeders.find(x => x.entry === entry);
    if (!f || !f.rows[ri2]) throw new Error('bad lockedRowAt');
    lockRows(f, ri2, lock);
  });
  if (S.lockedRows) {
    const [a, b] = S.rowLockRange || [3, 6];
    const cand = [];
    feeders.forEach((f, fi) => f.rows.forEach((row, ri2) => { if (ri2 >= 1 && ri2 <= Math.max(2, Math.floor(f.rows.length * 0.5)) && !row.lock) cand.push({ f, i: ri2 }); }));
    // `lockRunOnly`: only rows that start a run of at least `lockRunMin` (default 2) rows of the same colour
    const runAt = x => { const c = one(x.f.rows[x.i]); let k = x.i; while (c && x.f.rows[k] && one(x.f.rows[k]) === c) k++; return k - x.i; };
    if (S.lockRunOnly) cand.splice(0, cand.length, ...cand.filter(x => runAt(x) >= (S.lockRunMin || 2)));
    let n = 0;
    for (const x of CS.shuffle(cand, r)) {
      if (n >= S.lockedRows) break;
      if (x.f.rows[x.i].lock) continue;   // already in an earlier run
      lockRows(x.f, x.i, ri(r, a, b)); n++;
    }
  }
  if (S.hiddenRows) {
    const cand = [];
    feeders.forEach(f => f.rows.forEach((row, i) => { if (i >= 2 && !row.lock) cand.push(row); }));
    CS.shuffle(cand, r).slice(0, S.hiddenRows).forEach(row => { row.hidden = true; });
  }
  const j = {
    $schema: CS.LEVEL_SCHEMA, formatVersion: CS.FORMAT_VERSION, id: 'level_' + String(S.n).padStart(4, '0'), conveyor: S.conveyor,
    slots: S.slots || 4, extraSlots: S.extraSlots != null ? S.extraSlots : 2, slotLocks: [],
    feeders: feeders.map((f, fi) => {
      const o = { bottles: [].concat(...f.rows.map(x => x.cells)), hiddenRows: f.rows.map((x, i) => x.hidden ? i : -1).filter(i => i >= 0) };
      const lk = f.rows.map((x, i) => x.lock ? { row: i, lockTurns: x.lock } : null).filter(Boolean);
      if (lk.length) o.lockedRows = lk;
      o.entry = f.entry;
      if (S.door && fi === (S.doorShut != null ? S.doorShut : 1)) o.doorShut = true;
      return o;
    }),
    lanes: lanes.map(q => q.map(b => { const t = { color: b.color }; if (b.hidden) t.hidden = true; if (TIER[b.size] > 1) t.size = TIER[b.size]; if (b.lockTurns) t.lockTurns = b.lockTurns; return t; })),
    links,
    view: { cameraPreset: 'default' },
    meta: { name: S.name, difficulty: S.diff }
  };
  if (S.door) j.doorTurns = S.door;
  if (S.block) j.blockQueue = { turns: S.block, lanes: blockPair(blockFirst != null ? blockFirst : S.blockLane != null ? S.blockLane : ri(r, 0, lanesN - 1)) };
  if (S.intro) j.meta.notes = S.intro;
  if (S.grouped) groupByBox(j, units);
  // go through the tool's own model so the export matches the tool exactly
  const m = CS.fromJSON(j);
  return { m, json: CS.toJSON(m) };
}

// rows each Enter Path feeds while the belt fills at the start (Game.reset prefill), with every path open
function prefillRows(conveyor, entries) {
  const g = GEOM[conveyor], R = g.rows, belt = new Array(R).fill(false), n = entries.map(() => 0);
  for (let shift = 1; shift <= R; shift++) {
    entries.forEach((e, k) => {
      const j = (((g.entryRow[e] - shift) % R) + R) % R;
      if (!belt[j]) { belt[j] = true; n[k]++; }
    });
  }
  return n;
}

// Level 1: lay the rows out so that, once the belt has filled, each box's rows sit together and reach the pickup point
// in queue order. Rows are labelled, the start fill is played, and the order they pass the lowest point is read back.
function groupByBox(j, units) {
  const f = j.feeders[0], n = f.bottles.length / 4;
  const probe = CS.fromJSON(Object.assign({}, j, { feeders: [Object.assign({}, f)] }));
  const g = new CS.Game(probe, GEOM[j.conveyor], { pickMode: 'low' });
  const seen = [], step = [], R = g.R;
  for (let s = 0; s < R * 2 && seen.length < n; s++) {
    g.shift = (g.shift + 1) % R;
    const row = g.rowAtPos(GEOM[j.conveyor].lowRow);
    const it = row.find(Boolean);
    if (it) { const r = Math.floor((it.id - 1) / 4); if (!seen.includes(r)) { seen.push(r); step.push(s); } }
  }
  // rows that do not fit on the belt at the start wait in the Enter Path and pass the pickup point after the rest, in order
  for (let r = 0; r < n; r++) if (!seen.includes(r)) seen.push(r);
  // units are in send order (box by box, since the window is 0 for this level)
  const order = units.slice().sort((a, b) => a.b - b.b || a.key - b.key);
  const out = new Array(n * 4);
  // where the belt has an empty stretch, start the box groups so that no box is split across it
  const gap = step.findIndex((s, k) => k > 0 && s - step[k - 1] > 1);
  const off = gap > 0 ? gap % 4 : 0;
  seen.forEach((r, k) => { const u = order[(k - off + n) % n]; for (let c = 0; c < 4; c++) out[r * 4 + c] = u.c; });
  f.bottles = out;
}

/* ---------- bots ---------- */
// careful player: sends a box only when its colour is on the belt (or about to enter), unless nothing else can move
function smartMove(g) {
  if (g.over || g.freeSlot() < 0) return -1;
  const avail = {};
  g.rows.forEach(r => r.forEach(it => { if (it && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + 1; }));
  g.feeders.forEach(f => { if (!f.shut) f.rows.slice(0, 3).forEach(r => r.forEach(it => { if (it && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + 1; })); });
  const need = {}; g.slots.forEach(s => { if (s.box) need[s.box.color] = (need[s.box.color] || 0) + s.box.cap - s.box.filled; });
  let best = -1, bs = -Infinity;
  g.lanes.forEach((q, l) => {
    if (!g.canSendLane(l)) return;
    const b = q[0];
    const left = (avail[b.color] || 0) - (need[b.color] || 0);
    const score = Math.min(left, b.cap) / b.cap * 10 + q.length * 0.05 + (left >= b.cap ? 2 : 0);
    if (score > bs) { bs = score; best = l; }
  });
  if (best < 0) return -1;
  const b = g.lanes[best][0];
  const left = (avail[b.color] || 0) - (need[b.color] || 0);
  const moving = g.slots.some(s => s.box && (avail[s.box.color] || 0) > 0);
  if (left <= 0 && moving) return -1;   // wait for the belt instead of parking a box that cannot fill
  g.send(best);
  return best;
}
// `rv`: when the bot is about to lose it takes an RV slot (up to the level's extraSlots), like a player watching an ad
function play(m, mode, policy, seed, track, stat, rv) {
  const g = new CS.Game(m, GEOM[m.conveyor], { pickMode: mode.pick, prefill: mode.prefill });
  const r = rng(seed);
  let guard = 0;
  const tr = track ? { entered: null, sent: null } : null;
  while (guard++ < 40000) {
    if (g.over === 'lose' && rv && !g.addRV()) continue;
    if (g.over) break;
    for (let s = 0; s < 6; s++) {
      if (g.over || g.freeSlot() < 0) break;
      const can = g.lanes.map((_, l) => l).filter(l => g.canSendLane(l));
      if (!can.length) break;
      let l;
      if (policy === 'smart') { l = smartMove(g); if (l < 0) break; }
      else if (policy === 'turns' || policy === 'stay') {
        // blind taps, never looking at the belt: 'turns' taps the queues in turn from a random queue; 'stay' picks a random
        // order of the queues and keeps tapping the first one in that order that can send (one queue until it is empty or
        // stuck, then the next), so every order a player might pick gets tried
        if (policy === 'stay') {
          if (!g._ord) g._ord = CS.shuffle(g.lanes.map((_, i) => i), r);
          l = g._ord.find(x => can.includes(x)); g.send(l);
        } else {
          if (g._at == null) g._at = ri(r, 0, g.lanes.length - 1);
          l = can.find(x => x >= g._at); if (l == null) l = can[0];
          g._at = l + 1; g.send(l);
        }
      }
      else if (policy === 'greedy' || (policy > 0 && r() >= policy)) { l = g.botMove(); if (l < 0) break; }
      else { l = pick(r, can); g.send(l); }
      if (tr && tr.sent == null && g.slots.some(x => x.box && x.box.uid === track)) tr.sent = g.ticks;
    }
    g.step();
    if (stat) {
      const on = {}; g.rows.forEach(row => row.forEach(it => { if (it && !(it.lock > 0)) on[it.color] = 1; }));
      g.slots.forEach(x => { if (x.box) { stat.busy++; if (!on[x.box.color]) stat.wait++; } stat.all++; });
      if (g.slots.every(x => x.box || x.lock > 0)) stat.full++;
      stat.t++;
    }
    if (tr && tr.entered == null) {
      const box = g.lanes.flat().find(b => b.uid === track) || g.slots.map(x => x.box).find(b => b && b.uid === track);
      if (box) { let on = false; g.rows.forEach(row => row.forEach(it => { if (it && it.color === box.color) on = true; })); if (on) tr.entered = g.ticks; }
    }
  }
  return { win: g.over === 'win', ticks: g.ticks, sends: g.sends, failsafe: g.failsafe, tr };
}
// pick: 'low' = lowest point of the loop (the play test default), 'zone' = the config's pickRows, 'any' = anywhere; NP = no prefill
const MODES = {
  low: { pick: 'low', prefill: true }, zon: { pick: 'zone', prefill: true }, zoff: { pick: 'any', prefill: true },
  lowNP: { pick: 'low', prefill: false }, zonNP: { pick: 'zone', prefill: false }, zoffNP: { pick: 'any', prefill: false }
};
// the bot ladder, from no skill to careful play: each bot is a play() policy (a number = the share of random taps, the rest
// picked by the game's belt-watching bot). A level's difficulty is the first rung that wins most runs (see ladder.js)
const BOTS = [
  { id: 'stay', name: 'Blind, one queue', policy: 'stay', note: 'never looks: keeps tapping one queue until it is empty or stuck, then the next' },
  { id: 'turns', name: 'Blind, in turn', policy: 'turns', note: 'never looks: taps the queues in turn (1, 2, 3, 1…)' },
  { id: 'random', name: 'Random tap', policy: 1, note: 'taps a random queue as fast as slots free up' },
  { id: 'novice', name: 'Beginner', policy: 0.5, note: 'half the taps random, half for the colour on the belt' },
  { id: 'casual', name: 'Casual', policy: 0.3, note: '3 taps in 10 random' },
  { id: 'watcher', name: 'Belt watcher', policy: 0.1, note: '1 tap in 10 random' },
  { id: 'careful', name: 'Careful', policy: 'smart', note: 'counts the items coming and waits instead of parking a box that cannot fill' },
  // not part of the rating: the one-queue blind tap again, taking the level's RV slots when it is about to lose
  { id: 'stayRV', name: 'Blind, one queue + RV', policy: 'stay', rv: true, extra: true, note: 'blind, one queue, but takes the RV slots when about to lose (not used for the rating)' }
];
function ladder(m, mode, runs, seed0) {
  return BOTS.map(b => {
    if (b.policy === 'smart') { let w = 0; for (let s = 0; s < runs; s++) if (play(m, mode, 'smart', seed0 + s).win) w++; return w / runs; }
    return rate(m, mode, b.policy, runs, seed0, b.rv).rate;
  });
}
function rate(m, mode, eps, runs, seed0, rv) {
  let w = 0, t = 0; const st = { busy: 0, wait: 0, full: 0, all: 0, t: 0 }; let fs = 0;
  for (let s = 0; s < runs; s++) { const x = play(m, mode, eps, seed0 + s, null, st, rv); if (x.win) w++; if (x.failsafe) fs++; t += x.ticks; }
  return { rate: w / runs, ticks: Math.round(t / runs), wait: +(st.wait / st.all).toFixed(3), full: +(st.full / st.t).toFixed(3), fs: fs / runs };
}

module.exports = { SIZE, smart: smartMove, make, play, rate, ladder, BOTS, MODES, GEOM, CS, rng };
