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
    for (const k of Object.keys(G.MODES)) { const r = G.rate(m, G.MODES[k], 1, S.count ? 300 : 60, S.count ? 7000 : 1000); res['rnd_' + k] = r.rate; if (r.rate < (S.minRandom || 1)) return { ok: false, why: 'random lost ' + k + ' ' + r.rate, res }; }
  } else {
    const a = G.rate(m, G.MODES.low, 1, 60, 1000), b = G.rate(m, G.MODES.zoff, 1, 60, 1000), e = G.rate(m, G.MODES.low, 0.3, 30, 2000);
    res.rnd = [a.rate, b.rate]; res.rndTicks = a.ticks; res.eps = e.rate; res.fs = e.fs;
    if (S.diff === 'normal' && (a.rate < 0.9 || b.rate < (S.door ? 0.6 : 0.9))) return { ok: false, why: 'random ' + res.rnd, res };
    if (S.diff === 'hard' && (a.rate < 0.75 || b.rate < 0.75)) return { ok: false, why: 'random ' + res.rnd, res };
    if (!S.block && (g1.failsafe || g2.failsafe || e.fs > 0.15)) return { ok: false, why: 'failsafe ' + e.fs, res };
  }
  return { ok: true, res, json, m };
}
for (const S of SPECS) {
  if (only && !only.includes(S.n)) continue;
  let best = null, last = null;
  for (let seed = 1; seed <= 300; seed++) {
    let r; try { r = check(S, seed); } catch (e) { r = { ok: false, why: e.message }; }
    last = r;
    if (r.ok) { best = Object.assign(r, { seed }); break; }
  }
  if (best) { out[S.n] = best; console.log(S.n, 'seed', best.seed, JSON.stringify(best.res)); }
  else console.log(S.n, 'FAIL', last.why, JSON.stringify(last.res || {}));
}
module.exports = out;
if (!only) require('fs').writeFileSync(require('path').join(__dirname, 'out.json'), JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { seed: v.seed, res: v.res, json: v.json }]))));
