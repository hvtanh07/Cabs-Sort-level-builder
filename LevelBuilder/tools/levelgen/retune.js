'use strict';
/* Retune search: node retune.js 30 (one level per run; run several in parallel).
   For the level's GDD role (playtest.js `role` / `TARGET`) it tries layouts from specs.js with other settings (`stick`, `window`,
   `colors`) and seeds, keeps those that pass the level checks (no jam, careful player wins with the belt full and empty,
   every Enter Path colour patch 3-6 rows) and whose bots, over the play test's 200 runs without RV slots, land inside every bar
   of the role. Prints the best one (closest to the middle of the bars) as JSON: { n, over, seed, res }. */
const G = require('./gen.js'), SPECS = require('./specs.js'), P = require('./playtest.js');
const CS = G.CS;
const n = +process.argv[2];
const MAXSEED = +(process.env.MAXSEED || 150), WANT = +(process.env.WANT || 3), RUNS = 200, SEED = 7000;
const base = SPECS.find(s => s.n === n);
const role = P.role(n);
// medium and harder levels: random taps and one-queue taps must lose most runs (level design rule, measured without RV)
const T = process.env.TGT ? JSON.parse(process.env.TGT) : P.TARGET[role].slice();
if (['medium', 'pre-hard', 'hard'].includes(role) && !T.some(t => t[0] === 'stay')) T.push(['stay', 0, 0.6]);
const bot = id => P.BOTS.find(b => b.id === id);

function patchesOk(json) {
  return CS.feederList(json).every(f => {
    const b = f.bottles, runs = [];
    for (let k = 0; k < b.length; k += 4) { if (k && b[k] === b[k - 4]) runs[runs.length - 1]++; else runs.push(1); }
    return runs.every(x => x >= 3 && x <= 6);
  });
}
function structural(S, seed) {
  const { m, json } = G.make(S, seed);
  if (CS.validate(m, null).some(x => x.level === 'error')) return null;
  if (S.lockRelay && CS.queueDeadlock(m, true)) return null;
  if (!patchesOk(json)) return null;
  const M2 = S.door ? G.MODES.fly : G.MODES.flyNP;
  const g1 = G.play(m, G.MODES.fly, 'smart', 1), g2 = G.play(m, M2, 'smart', 1);
  if (!g1.win || !g2.win) return null;
  if (S.noFailsafe && (g1.failsafe || g2.failsafe)) return null;
  // ORDERS='[a,b]': a player who taps one queue until it is empty, then the next, in a fixed order, may win in at most a of
  // the queue orders without RV slots and b with them (a player finds a winning order by retrying and keeps it)
  if (ORDERS) { const w = orderWins(m); if (w[0] > ORDERS[0] || w[1] > ORDERS[1]) return null; }
  return { m, json };
}
const RVMAX = process.env.RVMAX ? JSON.parse(process.env.RVMAX) : null;
const ORDERS = process.env.ORDERS ? JSON.parse(process.env.ORDERS) : null;
const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.filter((_, k) => k !== i)).map(p => [x, ...p]));
// wins of the blind one-queue player over every fixed order of the queues: [without RV, with RV]
function orderWins(m) {
  const orig = CS.shuffle, w = [0, 0];
  try {
    for (const o of perms(m.lanes.map((_, i) => i))) {
      CS.shuffle = () => o.slice();
      if (G.play(m, G.MODES.fly, 'stay', 1).win) w[0]++;
      if (G.play(m, G.MODES.fly, 'stay', 1, null, null, true).win) w[1]++;
    }
  } finally { CS.shuffle = orig; }
  return w;
}
// the bars are measured WITH the RV slots (user, 2026-11-05: the user plays with them open); RVALL=0 measures without.
// The careful player must still win without RV (see structural)
const RVALL = process.env.RVALL !== '0';
function rateN(m, id, runs) { let w = 0; for (let s = 0; s < runs; s++) if (P.play(m, bot(id), SEED + s, RVALL).win) w++; return w / runs; }
function score(res) { return T.reduce((a, [id, lo, hi]) => a + Math.abs(res[id] - (lo + hi) / 2), 0); }

// settings to try: the level's own first, then stick / window / colour changes
// WIDE=1 (levels that pass nothing with the normal grid): longer runs from one queue, rows further from box order
const WIDE = !!process.env.WIDE;
const sticks = WIDE ? [0.85, 0.9, 0.95, 1] : [undefined, 0.5, 0.6, 0.7, 0.8, 0.9];
const windows = WIDE ? [undefined, 20, 30, 40, 60] : [undefined, 4, 6, 12, 20];
const colors = (WIDE ? [undefined, 6, 7, 8] : [undefined, 5, 6, 7, 8]).filter(c => c == null || (c >= 4 && c <= 8));
// GRID='{"stick":[..],"window":[..],"colors":[..]}' sets the grid by hand
const GR = process.env.GRID ? JSON.parse(process.env.GRID) : null;
const grid = [];
if (GR) GR.stick.forEach(st => GR.window.forEach(w => GR.colors.forEach(c => grid.push({ stick: st, window: w, colors: c }))));
else sticks.forEach(st => windows.forEach(w => colors.forEach(c => {
  const o = {};
  if (st !== undefined) o.stick = st;
  if (w !== undefined) o.window = w;
  if (c !== undefined) o.colors = c;
  grid.push(o);
})));
// easier roles start from gentler settings, harder ones from the harsh end
if (!GR && ['hard', 'pre-hard'].includes(role)) grid.reverse();

const found = [];
let tried = 0, near = null;
outer:
for (const o of grid) {
  // OVER='{...}': extra spec values for every try (e.g. {"atPos": null} drops level 9's fixed chevron)
  if (process.env.OVER) Object.assign(o, JSON.parse(process.env.OVER));
  const S = Object.assign({}, base, base.watchTries ? base.watchTries[0] : {}, o);
  delete S.keep; delete S.seed;
  for (let seed = +(process.env.SEED0 || 1); seed <= MAXSEED; seed++) {
    tried++;
    let st; try { st = structural(S, seed); } catch (e) { st = null; }
    if (!st) continue;
    // quick screen over 40 runs, then the full 200
    const quick = {}; let ok = true;
    for (const [id, lo, hi] of T) { if (id === 'careful') continue; quick[id] = rateN(st.m, id, 40); if (quick[id] < lo - 0.15 || quick[id] > hi + 0.15) { ok = false; break; } }
    if (!ok) {
      // remember the closest miss (40 runs per bot), to say how far a level that passes nothing is from its bars
      if (process.env.NEAR) { const q = {}; T.forEach(([id]) => { if (id !== 'careful') q[id] = quick[id] != null ? quick[id] : rateN(st.m, id, 40); });
        const d = T.reduce((a, [id, lo, hi]) => id === 'careful' ? a : a + Math.max(0, lo - q[id], q[id] - hi), 0);
        if (!near || d < near.d) near = { d, over: o, seed, q }; }
      continue;
    }
    const res = {};
    for (const [id, lo, hi] of T) { res[id] = id === 'careful' ? 1 : rateN(st.m, id, RUNS); if (res[id] < lo - 1e-9 || res[id] > hi + 1e-9) { ok = false; break; } }
    if (!ok) continue;
    // RVMAX='{"random":0.05}': these bots may win at most this share WITH the RV slots too (user, 2026-11-05: level 29 played
    // with the RV slots could be won without looking at the belt)
    if (RVMAX) {
      const rv = {};
      for (const [id, hi] of Object.entries(RVMAX)) { let w = 0; for (let s = 0; s < RUNS; s++) if (P.play(st.m, bot(id), SEED + s, true).win) w++; rv[id] = w / RUNS; if (rv[id] > hi + 1e-9) ok = false; }
      res.rv = rv;
      if (!ok) { process.stderr.write(`${n} rv miss ${JSON.stringify(o)} seed ${seed} ${JSON.stringify(rv)}\n`); continue; }
    }
    found.push({ n, over: o, seed, res, score: score(res) });
    process.stderr.write(`${n} found ${JSON.stringify(o)} seed ${seed} ${JSON.stringify(res)}\n`);
    if (found.length >= WANT) break outer;
    break;   // one per setting, then try the next setting
  }
}
found.sort((a, b) => a.score - b.score);
if (found[0]) found[0].orders = orderWins(structural(Object.assign({}, base, base.watchTries ? base.watchTries[0] : {}, found[0].over), found[0].seed).m);
console.log(JSON.stringify(found[0] || { n, fail: true, role, tried, near }));
