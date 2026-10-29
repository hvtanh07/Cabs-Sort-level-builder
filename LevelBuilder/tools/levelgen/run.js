'use strict';
const G = require('./gen.js'), SPECS = require('./specs.js');
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const out = {};
function check(S, seed) {
  const { m, json } = G.make(S, seed);
  const v = G.CS.validate(m, null).filter(x => x.level === 'error');
  if (v.length) return { ok: false, why: v.map(x => x.msg).join('; ') };
  // `lockRelay`: no order of sends may lock every queue's front box at once (they would only open by the no-send rule)
  if (S.lockRelay && G.CS.queueDeadlock(m, true)) return { ok: false, why: 'every queue locked at once' };
  // `chunk`: no colour patch on an Enter Path may run past chunk[1] rows (two blocks of one colour back to back)
  if (S.chunk && G.CS.feederList(json).some(f => { let n = 0; for (let i = 0; i < f.bottles.length; i += 4) { n = i && f.bottles[i] === f.bottles[i - 4] ? n + 1 : 1; if (n > S.chunk[1]) return true; } return false; })) return { ok: false, why: 'patch too long' };
  const res = { items: G.CS.feederList(json).reduce((a, f) => a + f.bottles.length, 0), cap: G.GEOM[S.conveyor].rows * 4, boxes: json.lanes.flat().length };
  const g1 = G.play(m, G.MODES.fly, 'smart', 1), g2 = G.play(m, G.MODES.zoff, 'smart', 1);
  res.greedy = [g1.win, g2.win]; res.ticks = g1.ticks; res.gfs = [g1.failsafe, g2.failsafe];
  if (!g1.win || !g2.win) return { ok: false, why: 'smart lost', res };
  // `noFailsafe`: the careful player must win without the play test's fail-safe (e.g. items still behind a shut door at the end)
  if (S.noFailsafe && (g1.failsafe || g2.failsafe)) return { ok: false, why: 'failsafe', res };
  if (S.diff === 'easy') {
    // a Block Door level is only checked with the belt starting full: with an empty belt and one door shut, random taps
    // park boxes before any of their items can arrive
    // `minCasual`: the casual player (careful, 30 % random taps) and the belt watcher (10 %) must also win that share
    if (S.minCasual) for (const eps of [0.3, 0.1]) { const c = G.rate(m, G.MODES.fly, eps, 60, 7000); res['eps' + eps] = c.rate; if (c.rate < S.minCasual) return { ok: false, why: 'casual ' + eps + ' ' + c.rate, res }; }
    for (const k of Object.keys(G.MODES).filter(k => !(S.door && k.endsWith('NP')))) { const r = G.rate(m, G.MODES[k], 1, S.count ? 300 : 60, S.count ? 7000 : 1000); res['rnd_' + k] = r.rate; if (r.rate < (S.minRandom || 1)) return { ok: false, why: 'random lost ' + k + ' ' + r.rate, res }; }
  } else {
    const a = G.rate(m, G.MODES.fly, 1, 60, 1000), b = G.rate(m, G.MODES.zoff, 1, 60, 1000), e = G.rate(m, G.MODES.fly, 0.3, 30, 2000);
    res.rnd = [a.rate, b.rate]; res.rndTicks = a.ticks; res.eps = e.rate; res.fs = e.fs;
    if (S.watch) {
      // from level 15 the player has to watch the belt: random taps must lose most runs, while a player who sends the box
      // matching the belt (1 tap in 10 random) still wins nearly every run
      const w = G.rate(m, G.MODES.fly, 0.1, 30, 3000); res.watch = w.rate;
      // `watchBar` [max random, min watcher] sets the bar for one level (levels 5 and 6 keep 4 slots, so random taps win more)
      const [maxR, minW] = S.watchBar || (S.diff === 'hard' ? [0.25, 0.8] : [0.35, 0.9]);
      if (Math.max(a.rate, b.rate) > maxR) return { ok: false, why: 'random wins ' + res.rnd, res };
      if (w.rate < minW) return { ok: false, why: 'watching ' + w.rate, res };
      // `noBlind`: tapping without looking (one queue until it is empty, or the queues in turn) must lose as often as random taps
      if (S.noBlind) for (const p of ['stay', 'turns']) { const x = G.rate(m, G.MODES.fly, p, 30, 5000).rate; res[p] = x; if (x > maxR) return { ok: false, why: 'blind ' + p + ' ' + x, res }; }
    } else if (S.n <= 10) {
      if (S.diff === 'medium' && (a.rate < 0.9 || b.rate < (S.door ? 0.6 : 0.9))) return { ok: false, why: 'random ' + res.rnd, res };
      // `hardBar` [casual, random]: level 10 is long with big boxes, so it is checked like the hard levels from 11 on
      const [minE, minR] = S.hardBar || [0, 0.75];
      if (S.diff === 'hard' && (e.rate < minE || a.rate < minR || b.rate < minR)) return { ok: false, why: 'random ' + res.rnd + ' casual ' + e.rate, res };
    } else {
      // levels 11-40 are long, so pure random taps jam more often; the casual player (careful, with 30 % random taps) must win
      // nearly every medium level and most hard ones, and random taps must still win a fair share
      const [minE, minR] = S.diff === 'hard' ? [0.85, 0.3] : S.relaxed ? [0.8, 0.25] : [0.95, S.door ? 0.4 : 0.5];
      if (e.rate < minE) return { ok: false, why: 'casual ' + e.rate, res };
      if (a.rate < minR || b.rate < minR) return { ok: false, why: 'random ' + res.rnd, res };
      if (S.minRandom && (a.rate < S.minRandom || b.rate < S.minRandom)) return { ok: false, why: 'random ' + res.rnd, res };
      if (S.maxRandom && Math.max(a.rate, b.rate) > S.maxRandom) return { ok: false, why: 'random wins ' + res.rnd, res };
    }
  if (!S.block && (g1.failsafe || g2.failsafe || e.fs > 0.15)) return { ok: false, why: 'failsafe ' + e.fs, res };
  }
  return { ok: true, res, json, m };
}
for (const S of SPECS) {
  if (only && !only.includes(S.n)) continue;
  let best = null, last = null;
  // levels 11-40 are long: if no seed passes, the rows arrive closer to box order (a smaller window) and it tries again
  const scales = S.n <= 10 ? [1] : [1, 0.6, 0.35, 0.2, 0.1];
  // a medium Block Door level that passes nothing is checked again with a lower bar (it jams more under random taps)
  const tries = [];
  if (S.watch) S.watchTries.forEach(o => tries.push([1, false, o]));   // watch-the-belt levels: settings from gentlest to hardest
  else [false, true].forEach(rx => { if (!rx || (S.door && S.diff === 'medium')) scales.forEach(sc => tries.push([sc, rx])); });
  // `keep`: the seed (and watch setting) the level was built from before the Locked Box / Locked Item rules changed. It is
  // tried first, so the boxes and rows stay the same and only the locks move, when that still passes the checks
  if (S.keep) {
    const over = S.keep.try != null ? S.watchTries[S.keep.try] : undefined;
    let r; try { r = check(Object.assign({}, S, over || {}), S.keep.seed); } catch (e) { r = { ok: false, why: e.message }; }
    if (r.ok) best = Object.assign(r, { seed: S.keep.seed, windowScale: 1, relaxed: false, over, kept: true });
    else console.log(S.n, 'kept seed fails:', r.why);
  }
  if (!best) for (const [sc, rx, over] of tries) {
    const T = Object.assign({}, S, sc === 1 ? {} : { window: Math.round(S.window * sc) }, rx ? { relaxed: true } : {}, over || {});
    for (let seed = S.seed || 1; seed <= (S.n <= 10 ? 300 : S.maxSeed || (S.watch ? 120 : 80)); seed++) {   // `seed` starts the search at a hand-picked seed
      let r; try { r = check(T, seed); } catch (e) { r = { ok: false, why: e.message }; }
      last = r;
      if (r.ok) { best = Object.assign(r, { seed, windowScale: sc, relaxed: rx, over }); break; }
    }
    if (best) break;
  }
  if (best) { out[S.n] = best; console.log(S.n, 'seed', best.seed, 'scale', best.windowScale, best.relaxed ? 'relaxed' : '', best.over ? JSON.stringify(best.over) : '', JSON.stringify(best.res)); }
  else console.log(S.n, 'FAIL', last.why, JSON.stringify(last.res || {}));
}
module.exports = out;
Object.defineProperty(out, 'check', { value: check });
if (!only || process.env.OUT) require('fs').writeFileSync((process.env.OUT || require('path').join(__dirname, 'out.json')), JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { seed: v.seed, res: v.res, json: v.json }]))));
