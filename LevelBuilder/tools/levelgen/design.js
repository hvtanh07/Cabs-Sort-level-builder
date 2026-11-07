'use strict';
/* Rule-driven builder for levels 11-40 (user, 2026-11-06). Each level is built around its planned stuck moments
   (GDD page level-difficulty.html, PLAN) and the element rules the user set:
   - every stuck moment has a KEY colour that has exactly one box in the whole level (no other queue has it), placed at the
     planned point of the level (depth ~ p * queue length) in one queue; its rows enter `lead` boxes early, so the colour
     sits on the belt while its box is still buried. Boxes in the other queues around that depth get their rows late
     (`delay`, share `q`), so sending them fills the slots: the obvious tap loses.
   - Hidden Box (`hidden`): the key box is hidden, so the player cannot tell which queue holds the colour; `decoy` more boxes
     around it are hidden too (more on harder levels).
   - Locked Box (`locked`): the key box is locked (`turns`), so when it reaches the front the player must send other,
     unneeded boxes to open it.
   - Linked Box (`linked`): the key box is linked to a box in the next queue (`pd` boxes deeper) whose colour is an extra
     colour with its rows late, so breaking the link brings up a box the player does not need yet.
   - Locked Item (`litem`): the key colour has one 40-item box and its rows come as one patch locked for `turns` sends,
     so a 40 box sent for it waits in its slot until more boxes are sent.
   - Block Door (`door` on the level): the two Enter Paths carry different colours (each colour stays on one side), so a
     box sent for one side waits when the doors switch.
   - Block Queue (`bq` on the level): the two blocked queues have (almost) disjoint colour sets.
   Rows come in patches of 3-6 rows of one colour. */
const G = require('./gen.js'), CS = G.CS;
const ROWS = { 1: 4, 2: 6, 3: 8, 4: 10 };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1)), pk = (r, a) => a[Math.floor(r() * a.length)];
const wpick = (r, w) => { const t = w.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i + 1; return w.length; };
const SPLIT = { 4: [[4]], 6: [[6], [3, 3]], 8: [[4, 4], [3, 5], [5, 3]], 10: [[5, 5], [4, 6], [6, 4]] };

function make(S, seed) {
  const r = G.rng(seed * 7919 + S.n * 104729);
  const Q = S.Q, D = S.D, EV = S.ev || [];
  const pal = CS.shuffle([1, 2, 3, 4, 5, 6, 7, 8], r);
  const keys = EV.map((_, i) => pal[i]);
  const base = pal.slice(EV.length, EV.length + Math.min(S.nb, 8 - EV.length));
  // Block Door: each colour stays on one side; Block Queue: the two blocked queues get different colour sets
  const side = {};
  base.forEach((c, i) => { side[c] = i % 2; }); keys.forEach((c, i) => { side[c] = (i + (S.keySide || 0)) % 2; });
  const half = [base.filter((c, i) => i % 2 === 0), base.filter((c, i) => i % 2 === 1)];
  const bqL = S.bq ? S.bq.lanes : null;
  const allowed = l => bqL && bqL[0] === l ? half[0] : bqL && bqL[1] === l ? half[1] : base;
  // queues
  const lanes = Array.from({ length: Q }, () => []);
  for (let d = 0; d < D; d++) for (let l = 0; l < Q; l++) {
    const prev = lanes[l][d - 1], nb = l > 0 ? lanes[l - 1][d] : null;
    let cand = allowed(l).filter(c => (!prev || prev.c !== c) && (!nb || nb.c !== c));
    if (!cand.length) cand = allowed(l);
    lanes[l].push({ c: pk(r, cand), t: wpick(r, S.tiers || [3, 3, 2, 1]), l, d });
  }
  // send order of the intended line: depth by depth, queues in a random order at each depth
  // `stick`: the intended line sends runs from one queue (continue the same queue with this chance), so its rows come for
  // boxes deep in one queue while the other queues' fronts wait
  let idx = 0;
  if (S.stick) {
    const top = new Array(Q).fill(0); let cur = ri(r, 0, Q - 1);
    for (let k = 0; k < Q * D; k++) {
      if (!(top[cur] < D && r() < S.stick)) {
        const opts = [...Array(Q).keys()].filter(l => top[l] < D && l !== cur);
        if (opts.length) { const tot = opts.reduce((a, l) => a + D - top[l], 0); let x = r() * tot; cur = opts.find(l => (x -= D - top[l]) < 0); if (cur == null) cur = opts[opts.length - 1]; }
      }
      lanes[cur][top[cur]++].i = idx++ + (r() - 0.5) * (S.jit || 0);
    }
  } else for (let d = 0; d < D; d++) CS.shuffle([...Array(Q).keys()], r).forEach(l => { lanes[l][d].i = idx++ + (r() - 0.5) * (S.jit || 0); });
  // `hidePattern` (user, 2026-11-06, like levels 7 and 8): boxes are hidden in a pattern, not one by one.
  // checker / checker2: every other box, alternating between queues; even: every 2nd, 4th, 6th... box of every queue.
  // The front box is never hidden (it would be revealed at once).
  const inPat = x => x.d >= 1 && (S.hidePattern === 'even' ? x.d % 2 === 1 : (x.l + x.d) % 2 === (S.hidePattern === 'checker' ? 1 : 0));
  // events
  const usedLane = [];
  const info = [];
  EV.forEach((e, k) => {
    // the key box is the box the intended line sends at about point p of the level (not a front box, not used yet)
    const want = e.p * Q * D + ri(r, -1, 1);
    let lanesOk = [...Array(Q).keys()];
    if (e.lane != null) lanesOk = [e.lane];
    if (S.bq && e.t === 'bq') lanesOk = [bqL[1]];
    // `depth`: an exact place in the queue (0 = front), used by intro levels that show a box from the start
    const dOk = x => e.depth != null ? x.d === e.depth : x.d >= 1 && x.d <= D - 2;
    // a hidden key box must sit on a cell of the level's hidden pattern (`hidePattern`)
    const pOk = x => !S.hidePattern || !(e.t === 'hidden' || e.hide) || inPat(x);
    const cand = lanes.flat().filter(x => lanesOk.includes(x.l) && dOk(x) && pOk(x) && x.key == null && !x.partner && !usedLane.some(u => u.l === x.l && Math.abs(u.d - x.d) <= 1));
    if (!cand.length) throw new Error('no key spot');
    const b = cand.sort((x, y) => Math.abs(x.i - want) - Math.abs(y.i - want))[0];
    const le = b.l, de = b.d;
    usedLane.push({ l: le, d: de });
    b.c = keys[k]; b.t = e.tier || pk(r, [3, 4]); b.key = k;
    if (e.t === 'hidden' || e.hide) b.hidden = true;
    if (e.t === 'locked') b.lock = e.turns || 2;
    if (e.t === 'litem') b.t = 4;
    if (e.t === 'linked') {
      const ln = le === 0 ? 1 : le === Q - 1 ? Q - 2 : pk(r, [le - 1, le + 1]);
      const dp = Math.min(D - 1, de + (e.pd != null ? e.pd : ri(r, 0, 2)));
      const p = lanes[ln][dp];
      p.partner = true; p.late = true;
      if (e.hidePartner) p.hidden = true;
      b.link = { lane: ln, tray: dp };
    }
    // the boxes in front of the key box are colours whose rows come on time; boxes in other queues around this depth
    // get their rows late (surplus), so sending them fills the slots
    lanes.flat().forEach(x => { if (x.l !== le && x.key == null && x.i <= b.i && x.i >= b.i - (S.dw || 2) * Q && r() < (S.q != null ? S.q : 0.5)) x.late = true; });
    info.push({ k, t: e.t, lane: le, depth: de, color: keys[k] });
    // hidden decoys: other boxes around the key depth are hidden too
    if (e.t === 'hidden') {
      const c = CS.shuffle(lanes.flat().filter(x => x.key == null && x.d >= 1 && Math.abs(x.d - de) <= 2 && x.l !== le && !x.partner), r).slice(0, e.decoy || 0);
      c.forEach(x => { x.hidden = true; });
    }
  });
  // `early` (user, 2026-11-06: every element level shows an element from the start): extra element boxes near the top of
  // the queues, not key boxes. lock: a locked box at depth 0-1; hidden: a hidden box at depth 1-2 (a front box is revealed);
  // link: two linked boxes at the front of next queues; litem is handled after the rows are dealt.
  (S.early || []).forEach(e => {
    const free = x => x.key == null && !x.partner && !x.hidden && !x.lock && !x.link && !x.linked;
    if (e.t === 'lock' || e.t === 'hidden') {
      const ds = e.t === 'lock' ? [0, 1] : [1, 2];
      const c = CS.shuffle(lanes.flat().filter(x => ds.includes(x.d) && free(x) && (e.lane == null || x.l === e.lane)), r)[0];
      if (!c) throw new Error('no early spot');
      if (e.t === 'lock') c.lock = e.turns || 2; else c.hidden = true;
    } else if (e.t === 'link') {
      const pairs = [];
      for (let l = 0; l + 1 < Q; l++) for (const d of [0, 1]) for (const d2 of [0, 1]) { const a = lanes[l][d], b = lanes[l + 1][d2]; if (free(a) && free(b) && a.c !== b.c) pairs.push([a, b]); }
      const pr = pk(r, pairs); if (!pr) throw new Error('no early link');
      pr[0].link = { lane: pr[1].l, tray: pr[1].d }; pr[1].linked = true;
    }
  });
  // background tension: any other box may get its rows late too (`lateAll` share)
  if (S.lateAll) lanes.flat().forEach(b => { if (b.key == null && r() < S.lateAll) b.late = true; });
  if (S.hidePattern) lanes.flat().forEach(x => { if (inPat(x) && !x.partner && !x.lock && !x.link && !x.linked) x.hidden = true; else if (x.key == null || !(EV[x.key].t === 'hidden' || EV[x.key].hide)) x.hidden = false; });
  if (S.hideExtra && !S.hidePattern) CS.shuffle(lanes.flat().filter(x => x.key == null && x.d >= 1 && !x.hidden && !x.partner), r).slice(0, S.hideExtra).forEach(x => { x.hidden = true; });
  // rows: each box brings ROWS[tier] rows of its colour, split into patches of 3-6 rows, keyed by its place in the send order
  const chunks = [];
  lanes.flat().forEach(b => {
    let key = b.i + r() * (S.window || 0);
    if (b.key != null) key -= EV[b.key].lead != null ? EV[b.key].lead : 3;
    if (b.late) key += S.delay != null ? S.delay : 4;
    const parts = pk(r, SPLIT[ROWS[b.t]]);
    parts.forEach((n, j) => chunks.push({ c: b.c, n, key: key + j * (S.spread != null ? S.spread : 0.6) + r() * 0.01, box: b }));
  });
  chunks.sort((a, b) => a.key - b.key);
  const F = S.entries.length;
  const paths = Array.from({ length: F }, () => []);
  // deal the patches in key order; a patch that would make a run of its colour longer than 6 rows on every path it may use
  // waits for one of the next few patches to go first
  const fit = ch => {
    const opts = S.door ? [side[ch.c] % F] : [...Array(F).keys()];
    const runOf = p => { let n = 0; for (let k = p.length - 1; k >= 0 && p[k].c === ch.c; k--) n++; return n; };
    return opts.filter(f => runOf(paths[f]) + ch.n <= 6).sort((a, b) => paths[a].length - paths[b].length)[0];
  };
  const todo = chunks.slice();
  while (todo.length) {
    let k = 0, f;
    for (; k < Math.min(4, todo.length); k++) { f = fit(todo[k]); if (f != null) break; }
    if (f == null) { k = 0; const opts = S.door ? [side[todo[0].c] % F] : [...Array(F).keys()]; f = opts.sort((a, b) => paths[a].length - paths[b].length)[0]; }
    const ch = todo.splice(k, 1)[0];
    for (let j = 0; j < ch.n; j++) paths[f].push({ c: ch.c, ch });
  }
  // Locked Items: the key colour's rows are locked as whole patches
  const lockedRows = paths.map(() => []);
  EV.forEach((e, k) => {
    if (e.t !== 'litem') return;
    paths.forEach((p, f) => p.forEach((x, i) => { if (x.c === keys[k] && (e.share == null || x.ch.box.key === k)) lockedRows[f].push({ row: i, lockTurns: e.turns || 4 }); }));
  });
  (S.early || []).filter(e => e.t === 'litem').forEach(e => {
    // the first patch of 3+ rows of one colour that starts in the first rows of a path is locked
    // (user, 2026-11-06: only a colour whose box is at the front of a queue, so the locked items hold up that box)
    const fronts = lanes.map(q => q[0].c);
    let done = false;
    paths.forEach((p, f) => { if (done) return; for (let i = 0; i < Math.min(p.length, e.row || 10); i++) {
      if (i && p[i - 1].c === p[i].c) continue;
      let k = i; while (k < p.length && p[k].c === p[i].c) k++;
      if (k - i >= 3 && !keys.includes(p[i].c) && fronts.includes(p[i].c) && !lockedRows[f].some(x => x.row === i) && !(e.other && lockedRows.some(L => L.length && L.some(x => paths[lockedRows.indexOf(L)][x.row].c === p[i].c)))) { for (let q = i; q < k; q++) lockedRows[f].push({ row: q, lockTurns: e.turns || 3 }); done = true; return; }
    } });
    if (!done) throw new Error('no early litem');
  });
  const j = {
    $schema: CS.LEVEL_SCHEMA, formatVersion: CS.FORMAT_VERSION, id: 'level_' + String(S.n).padStart(4, '0'), conveyor: S.conveyor,
    slots: S.slots || 4, extraSlots: S.extraSlots != null ? S.extraSlots : 2, slotLocks: [],
    feeders: paths.map((p, f) => {
      const o = { bottles: [].concat(...p.map(x => [x.c, x.c, x.c, x.c])), hiddenRows: [], entry: S.entries[f] };
      if (lockedRows[f].length) o.lockedRows = lockedRows[f];
      return o;
    }),
    lanes: lanes.map(q => q.map(b => { const t = { color: b.c }; if (b.t > 1) t.size = b.t; if (b.hidden) t.hidden = true; if (b.lock) t.lockTurns = b.lock; return t; })),
    links: lanes.flat().filter(b => b.link).map(b => ({ a: { lane: b.l, tray: b.d }, b: b.link })),
    view: { cameraPreset: 'default' }, meta: { name: S.name, difficulty: S.diff }
  };
  if (S.door) j.blockDoor = { turns: S.door.turns, doors: S.entries.map((e, f) => ({ feeder: e, open: f === (S.door.open || 0) })) };
  if (S.bq) j.blockQueue = { turns: S.bq.turns, lanes: bqL };
  if (S.notes) j.meta.notes = S.notes;
  const m = CS.fromJSON(j);
  return { m, json: CS.toJSON(m), info };
}
module.exports = { make };
