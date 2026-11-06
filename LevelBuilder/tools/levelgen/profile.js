// Choice-width profile of a level, measured along the careful bot's line (no RV):
// at each send the careful bot makes, try every queue it could send instead, let the careful bot finish, and count the
// queues that still win. "obvious" = the queue the belt-watching game bot would pick. trap = obvious queue loses.
const dir = __dirname + '/';
const G = require(dir + 'gen.js'), CS = G.CS;
const GEOM = G.GEOM;

function obvious(g) {
  const avail = {};
  g.rows.forEach(r => r.forEach(it => { if (it && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + 1; }));
  g.feeders.forEach(f => f.rows.slice(0, 2).forEach(r => r.forEach(it => { if (it && !f.shut) avail[it.color] = (avail[it.color] || 0) + 0.5; })));
  let best = -1, bs = -Infinity;
  g.lanes.forEach((q, l) => {
    if (!g.canSendLane(l)) return;
    const b = q[0];
    const inSlots = g.slots.filter(s => s.box && s.box.color === b.color).reduce((a, s) => a + s.box.cap - s.box.filled, 0);
    const score = (avail[b.color] || 0) - inSlots - b.cap * 0.25 + q.length * 0.05;
    if (score > bs) { bs = score; best = l; }
  });
  return best;
}

function feats(g) {
  const belt = {}; let n = 0;
  g.rows.forEach(r => r.forEach(it => { if (it) { belt[it.color] = (belt[it.color] || 0) + 1; n++; } }));
  const top = Object.keys(belt).map(Number).sort((a, b) => belt[b] - belt[a])[0];
  const free = g.slots.filter(s => !s.box && !(s.lock > 0)).length;
  const fronts = g.lanes.map(q => q[0] ? (q[0].hidden ? -1 : q[0].color) : null);
  // depth of the top belt colour among the queues (0 = at a front), -1 if only hidden / none visible
  let depth = 99, hiddenOnly = true;
  g.lanes.forEach(q => q.forEach((b, t) => { if (b.color === top) { if (!b.hidden || t === 0) { hiddenOnly = false; depth = Math.min(depth, t); } } }));
  const inSlot = g.slots.some(s => s.box && s.box.color === top);
  return { n, R: g.R, topShare: top ? belt[top] / Math.max(1, n) : 0, top, depth, hiddenOnly: hiddenOnly && !inSlot, inSlot, free, fronts };
}

// runs the careful line; at decision index k sends lane `alt` instead. Returns {win, decisions:[...]} (decisions only when record)
function run(m, k, alt, record) {
  const g = new CS.Game(m, GEOM[m.conveyor], { pickMode: 'fly', prefill: true });
  let guard = 0, d = 0; const dec = [];
  while (guard++ < 40000) {
    if (g.over) break;
    for (let s = 0; s < 6; s++) {
      if (g.over || g.freeSlot() < 0) break;
      const can = g.lanes.map((_, l) => l).filter(l => g.canSendLane(l));
      if (!can.length) break;
      if (d === k) {
        if (!g.canSendLane(alt)) return { win: false, bad: true };
        g.send(alt); d++; continue;
      }
      if (record) {
        // peek what smart would do without committing: smartMove sends, so record before/after
        const ob = obvious(g), f = feats(g);
        const l = G.smart(g);
        if (l < 0) break;
        dec.push({ can, ob, smart: l, f, tick: g.ticks });
        d++;
      } else {
        const l = G.smart(g); if (l < 0) break; d++;
      }
    }
    g.step();
  }
  return { win: g.over === 'win', decisions: dec };
}

function profile(m) {
  const base = run(m, -1, -1, true);
  const steps = base.decisions.map((x, k) => {
    const wins = x.can.map(l => l === x.smart ? base.win : run(m, k, l, false).win);
    const width = wins.filter(Boolean).length;
    const obWin = wins[x.can.indexOf(x.ob)];
    return { k, smart: x.smart, width, can: x.can.length, trap: base.win && !obWin && width >= 1, ob: x.ob, win: x.can.filter((l, i) => wins[i]), f: x.f };
  });
  return { win: base.win, steps };
}
module.exports = { profile, run, feats };

if (require.main === module) {
  global.window = global; eval(require('fs').readFileSync(dir + '../../js/levels.js', 'utf8'));
  const levels = window.CS_BUNDLED_LEVELS.levels;
  for (const n of (process.argv[2] || '5,6,7,8,9,10').split(',').map(Number)) {
    const m = CS.fromJSON(levels[n - 1]);
    const t = Date.now(); const p = profile(m);
    console.log(n, 'win', p.win, 'ms', Date.now() - t, p.steps.map(s => s.trap ? 'T' + s.width : s.width).join(' '));
  }
}
