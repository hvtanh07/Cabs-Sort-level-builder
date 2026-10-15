'use strict';
const G = require('./gen.js'), SPECS = require('./specs.js');
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const out = {};
function check(S, seed) {
  const { m, json } = G.make(S, seed);
  const v = G.CS.validate(m, null).filter(x => x.level === 'error');
  if (v.length) return { ok: false, why: v.map(x => x.msg).join('; ') };
  const res = { items: G.CS.feederList(json).reduce((a, f) => a + f.bottles.length, 0), cap: G.GEOM[S.conveyor].rows * 4, boxes: json.lanes.flat().length };
  const g1 = G.play(m, G.MODES.low, 'smart', 1), g2 = G.play(m, G.MODES.zoff, 'smart', 1);
  res.greedy = [g1.win, g2.win]; res.ticks = g1.ticks; res.gfs = [g1.failsafe, g2.failsafe];
  if (!g1.win || !g2.win) return { ok: false, why: 'smart lost', res };
  if (S.diff === 'easy') {
    // a Block Door level is only checked with the belt starting full: with an empty belt and one door shut, random taps
    // park boxes before any of their items can arrive
    for (const k of Object.keys(G.MODES).filter(k => !(S.door && k.endsWith('NP')))) { const r = G.rate(m, G.MODES[k], 1, S.count ? 300 : 60, S.count ? 7000 : 1000); res['rnd_' + k] = r.rate; if (r.rate < (S.minRandom || 1)) return { ok: false, why: 'random lost ' + k + ' ' + r.rate, res }; }
  } else {
    const a = G.rate(m, G.MODES.low, 1, 60, 1000), b = G.rate(m, G.MODES.zoff, 1, 60, 1000), e = G.rate(m, G.MODES.low, 0.3, 30, 2000);
    res.rnd = [a.rate, b.rate]; res.rndTicks = a.ticks; res.eps = e.rate; res.fs = e.fs;
    if (S.n <= 10) {
      if (S.diff === 'medium' && (a.rate < 0.9 || b.rate < (S.door ? 0.6 : 0.9))) return { ok: false, why: 'random ' + res.rnd, res };
      if (S.diff === 'hard' && (a.rate < 0.75 || b.rate < 0.75)) return { ok: false, why: 'random ' + res.rnd, res };
    } else {
      // levels 11-40 are long, so pure random taps jam more often; the casual player (careful, with 30 % random taps) must win
      // nearly every medium level and most hard ones, and random taps must still win a fair share
      const [minE, minR] = S.diff === 'hard' ? [0.85, 0.3] : S.relaxed ? [0.8, 0.25] : [0.95, S.door ? 0.4 : 0.5];
      if (e.rate < minE) return { ok: false, why: 'casual ' + e.rate, res };
      if (a.rate < minR || b.rate < minR) return { ok: false, why: 'random ' + res.rnd, res };
      if (S.minRandom && (a.rate < S.minRandom || b.rate < S.minRandom)) return { ok: false, why: 'random ' + res.rnd, res };
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
  [false, true].forEach(rx => { if (!rx || (S.door && S.diff === 'medium')) scales.forEach(sc => tries.push([sc, rx])); });
  for (const [sc, rx] of tries) {
    const T = Object.assign({}, S, sc === 1 ? {} : { window: Math.round(S.window * sc) }, rx ? { relaxed: true } : {});
    for (let seed = S.seed || 1; seed <= (S.n <= 10 ? 300 : 80); seed++) {   // `seed` starts the search at a hand-picked seed
      let r; try { r = check(T, seed); } catch (e) { r = { ok: false, why: e.message }; }
      last = r;
      if (r.ok) { best = Object.assign(r, { seed, windowScale: sc, relaxed: rx }); break; }
    }
    if (best) break;
  }
  if (best) { out[S.n] = best; console.log(S.n, 'seed', best.seed, 'scale', best.windowScale, best.relaxed ? 'relaxed' : '', JSON.stringify(best.res)); }
  else console.log(S.n, 'FAIL', last.why, JSON.stringify(last.res || {}));
}
module.exports = out;
if (!only || process.env.OUT) require('fs').writeFileSync((process.env.OUT || require('path').join(__dirname, 'out.json')), JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { seed: v.seed, res: v.res, json: v.json }]))));
