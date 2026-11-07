'use strict';
/* Search for levels 11-40 built by design.js: node dscan.js 13 [tries]
   Samples settings and seeds, keeps layouts that pass the checks, and prints the best as JSON {n, S, seed, res, prof}.
   Checks: no jam (CS.validate), Enter Path patches 3-6 rows, the careful player wins without RV and without the fail-safe,
   no fixed queue order wins without RV (medium and harder), the difficulty score (100 - (casual + watcher) / 2, with RV,
   200 runs) inside the role's window, random taps under the role's bar, and stuck moments (choice-width profile) close to
   the planned points. */
const fs = require('fs'), path = require('path');
const G = require('./gen.js'), P = require('./playtest.js'), DZ = require('./design.js'), PR = require('./profile.js'), LI = require('./litem-check.js');
const CS = G.CS;
const DESIGN = require('./design-levels.js');
const n = +process.argv[2], TRIES = +(process.argv[3] || 400), RUNS = 200, SEED = 7000;
const L = DESIGN.levels[n];
const cur = JSON.parse(fs.readFileSync(path.join(__dirname, '../../levels/level_' + String(n).padStart(4, '0') + '.json'), 'utf8'));
const layout = { n, name: cur.meta.name, conveyor: cur.conveyor, entries: Object.keys(cur.feeders), Q: L.Q || cur.lanes.length };
const boxes = L.boxes || cur.lanes.reduce((a, q) => a + q.length, 0);
const T = DESIGN.target(n);
const bot = id => P.BOTS.find(b => b.id === id);
function rateN(m, id, runs, rv) { let w = 0; for (let s = 0; s < runs; s++) if (P.play(m, bot(id), SEED + s, rv).win) w++; return w / runs; }
function patchesOk(json) {
  return CS.feederList(json).every(f => { const b = f.bottles, runs = [];
    for (let k = 0; k < b.length; k += 4) { if (k && b[k] === b[k - 4]) runs[runs.length - 1]++; else runs.push(1); }
    return runs.every(x => x >= 3 && x <= 6); });
}
const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.filter((_, k) => k !== i)).map(p => [x, ...p]));
function orderWins(m) {
  const orig = CS.shuffle; let w = 0;
  try { for (const o of perms(m.lanes.map((_, i) => i))) { CS.shuffle = () => o.slice(); if (G.play(m, G.MODES.fly, 'stay', 1).win) w++; } } finally { CS.shuffle = orig; }
  return w;
}
const r0 = G.rng(n * 1000 + (+process.env.SALT || 0));
const pick = a => a[Math.floor(r0() * a.length)];
function sample() {
  const S = Object.assign({}, layout, { diff: T.diff, notes: L.notes });
  S.D = Math.max(6, Math.round(boxes / layout.Q) + pick(L.dD || [-1, 0, 0, 1]));
  S.nb = pick(L.nb || [5, 6, 7, 8]);
  S.tiers = pick(L.tiers || [[3, 3, 2, 1], [2, 3, 3, 2], [1, 3, 3, 3]]);
  S.window = pick(L.window || [0, 1, 2, 4]);
  const H = { intro: 0, 'post-intro': 1, after: 1, medium: 2, pre: 3, hard: 4 }[DESIGN.ROLE[n]];
  S.delay = pick(L.delay || [[2, 4, 6], [4, 8, 12], [6, 10, 14], [8, 12, 16], [10, 14, 20]][H]);
  S.q = pick(L.q || [0.4, 0.6, 0.8, 1]);
  S.dw = pick(L.dw || [1, 2, 3, 4]);
  S.lateAll = pick([[0, 0.1], [0.1, 0.2, 0.3], [0.2, 0.3, 0.4], [0.3, 0.4, 0.5], [0.4, 0.5, 0.6]][H]);
  S.jit = pick([0, 0.5, 1]);
  S.stick = pick(L.stick || [[0, 0.3, 0.5], [0.6, 0.75, 0.85], [0.75, 0.85, 0.9], [0.85, 0.9, 0.95], [0.9, 0.95, 1]][H]);
  S.spread = pick([0.3, 0.6, 1]);
  if (L.door) S.door = { turns: pick(L.door), open: pick([0, 1]) };
  if (L.bq) S.bq = { turns: pick(L.bq.turns), lanes: pick(L.bq.lanes) };
  if (L.bqMix) S.bqMix = pick(L.bqMix);
  if (L.hideExtra) S.hideExtra = pick(L.hideExtra);
  if (L.hidePattern) S.hidePattern = pick(L.hidePattern);
  if (L.early) S.early = L.early.map(e => { const o = Object.assign({}, e); ['turns', 'lane', 'row'].forEach(k => { if (Array.isArray(e[k])) o[k] = pick(e[k]); }); return o; });
  S.keySide = pick([0, 1]);
  S.ev = L.ev.map(e => {
    const o = Object.assign({}, e);
    ['lead', 'turns', 'decoy', 'pd', 'tier', 'lane', 'depth'].forEach(k => { if (Array.isArray(e[k])) o[k] = pick(e[k]); });
    if (o.lead == null) o.lead = pick([3, 6, 9, 12]);
    return o;
  });
  return S;
}
const WHY = {}; const no = k => { WHY[k] = (WHY[k] || 0) + 1; return null; };
function evaluate(S, seed) {
  let b; try { b = DZ.make(S, seed); } catch (e) { return no('make: ' + e.message.slice(0, 40)); }
  const { m, json } = b;
  if (CS.validate(m, null).some(x => x.level === 'error')) return no('validate');
  if (!patchesOk(json)) return no('patches');
  const g1 = G.play(m, G.MODES.fly, 'smart', 1), g2 = G.play(m, G.MODES.flyNP, 'smart', 1);
  if (!g1.win || !g2.win) return no('careful'); if (g1.failsafe) return no('failsafe');
  if (T.orders != null && orderWins(m) > T.orders) return no('orders');
  // locked items must still be locked while a box of their colour is at a queue front or in a slot (user, 2026-11-06)
  if ((json.feeders && Object.values(json.feeders).some(f => f.lockedRows)) && LI.check(m).share < 0.75) return no('litem');
  const q = { casual: rateN(m, 'casual', 40, true), watcher: rateN(m, 'watcher', 40, true) };
  const sc = 100 - (q.casual + q.watcher) * 50;
  if (sc < T.score[0] - 12 || sc > T.score[1] + 12) { no(sc < T.score[0] ? 'easy' : 'hard'); (WHY.sc = WHY.sc || []).push(Math.round(sc)); return { near: sc }; }
  const res = { casual: rateN(m, 'casual', RUNS, true), watcher: rateN(m, 'watcher', RUNS, true) };
  res.score = Math.round((100 - (res.casual + res.watcher) * 50) * 10) / 10;
  if (res.score < T.score[0] - 6 || res.score > T.score[1] + 6) return { near: res.score };
  res.random = rateN(m, 'random', RUNS, true);
  if (T.random != null && res.random > T.random + 1e-9) return { near: res.score, random: res.random };
  res.glance = rateN(m, 'glance', RUNS, true);
  const pf = PR.profile(m);
  if (!pf.win) return null;
  const N = pf.steps.length, traps = pf.steps.filter(s => s.trap).map(s => s.k / N);
  const ones = pf.steps.filter(s => s.width === 1).length / N;
  // every planned stuck point should have a trap within 0.12 of it
  const miss = DESIGN.stucks(n).reduce((a, p) => { const d = traps.length ? Math.min(...traps.map(t => Math.abs(t - p))) : 1; return a + Math.max(0, d - 0.12); }, 0);
  const off = Math.max(0, T.score[0] - res.score, res.score - T.score[1]);
  // `wide` [from, min]: mean choice width (share of the queues) over the level from point `from` on should reach `min`
  // (user, 2026-11-07: levels 32 and 33 felt too narrow)
  const Q = m.lanes.length, tail = pf.steps.filter(s => s.k / N >= (L.wide ? L.wide[0] : 0)), wAvg = tail.reduce((a, s) => a + s.width, 0) / Math.max(1, tail.length) / Q;
  const wAll = pf.steps.reduce((a, s) => a + s.width, 0) / N / Q;
  const wMiss = L.wide ? Math.max(0, L.wide[1] - wAvg) : 0;
  return { wAvg: +wAvg.toFixed(2), wAll: +wAll.toFixed(2), cost: off / 3 + miss * 10 + wMiss * 20, res, prof: pf.steps.map(s => s.trap ? 'T' + s.width : '' + s.width).join(' '), traps: traps.map(t => +t.toFixed(2)), ones: +ones.toFixed(2), m, json };
}
let best = null, tried = 0, passed = 0; const t0 = Date.now();
const TL = +(process.env.TL || 600) * 1000;
for (let i = 0; i < TRIES && Date.now() - t0 < TL; i++) {
  const S = sample();
  for (let s = 1; s <= 6; s++) {
    tried++;
    const e = evaluate(S, s);
    if (!e || !e.res) continue;
    passed++;
    if (!best || e.cost < best.cost) {
      best = { n, S, seed: s, res: e.res, prof: e.prof, traps: e.traps, ones: e.ones, wAvg: e.wAvg, wAll: e.wAll, cost: +e.cost.toFixed(2) };
      process.stderr.write(`${n} best cost ${best.cost} score ${e.res.score} rnd ${e.res.random} traps ${e.traps} w ${e.wAll}/${e.wAvg} | ${e.prof}\n`);
    }
    break;
  }
  if (best && best.cost === 0 && passed >= +(process.env.WANT || 3)) break;
}
process.stderr.write(JSON.stringify(WHY) + '\n');
console.log(JSON.stringify(best || { n, fail: true, tried }));
