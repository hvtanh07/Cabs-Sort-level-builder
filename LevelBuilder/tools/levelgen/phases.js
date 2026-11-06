'use strict';
/* Level in three phases (level 6, user ask 2026-11-06), used by gen.js make() when a spec has `phases`:
   1. the first `d1` boxes of each queue are only colours A, B, C, and the first rows bring exactly their items;
   2. the next `d2` boxes are mostly A and B, plus one C box and the ONE D box (the level's only box of colour D), buried
      at depth d1 + dmin or deeper in two different queues. Phase 2 rows bring the C and D items (first, with `cdFirst`)
      and only a share `q` of those A / B boxes' items, so there are more A / B boxes than A / B items: sending them too
      early fills the slots while the C and D items wait on the belt;
   3. the last `d3` boxes (A, B, C) and the remaining items: once C and D are out, every colour has a box and the level
      gets easier.
   Rows come in patches of 3-6 rows of one colour (`big`: smallest patch when a colour has more than 6 rows).
   phases: { cols: [A, B, C, D], d1, d2, dmin, d3, t1, t2, tC, tD, t3 (box tiers to pick from), fD (share of the D items in
   phase 2), q, big, cdFirst, c1 / c3 (colours of the phase 1 / phase 3 boxes, default A, B, C) } */
const CS = global.CS;
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1)), pk = (r, a) => a[Math.floor(r() * a.length)];
const ROWS = { 1: 4, 2: 6, 3: 8, 4: 10 };
function make(S, seed, rng) {
  const P = S.phases, r = rng(seed), [A, B, C, D] = P.cols;
  const lanes = [[], [], []];   // each box {c, t, ph}
  // phase 1: depth 0..P.d1-1
  const c1 = P.c1 || [A, B, C];
  const p1 = CS.shuffle([].concat(...Array.from({ length: Math.ceil(3 * P.d1 / c1.length) }, () => c1)).slice(0, 3 * P.d1), r);
  let k = 0; for (let d = 0; d < P.d1; d++) for (let l = 0; l < 3; l++) lanes[l].push({ c: p1[k++], t: pk(r, P.t1), ph: 1 });
  // phase 2: depth d1 .. d1+P.d2-1
  const lc = ri(r, 0, 2); let ld = ri(r, 0, 1); if (ld >= lc) ld++;
  const dC = P.d1 + ri(r, P.dmin, P.d2 - 1), dD = P.d1 + ri(r, P.dmin, P.d2 - 1);
  for (let d = P.d1; d < P.d1 + P.d2; d++) for (let l = 0; l < 3; l++) {
    if (l === lc && d === dC) lanes[l].push({ c: C, t: pk(r, P.tC), ph: 2 });
    else if (l === ld && d === dD) lanes[l].push({ c: D, t: P.tD, ph: 2, split: P.fD });
    else lanes[l].push({ c: r() < .5 ? A : B, t: pk(r, P.t2), ph: r() < P.q ? 2 : 3 });
  }
  for (let d = P.d1 + P.d2; d < P.d1 + P.d2 + P.d3; d++) for (let l = 0; l < 3; l++) lanes[l].push({ c: pk(r, P.c3 || [A, B, C]), t: pk(r, P.t3), ph: 3 });
  // rows per phase per colour
  const need = [null, {}, {}, {}];
  lanes.flat().forEach(b => { const n = ROWS[b.t];
    if (b.split != null) { const a = Math.round(n * b.split); need[2][b.c] = (need[2][b.c] || 0) + a; if (n - a) need[3][b.c] = (need[3][b.c] || 0) + n - a; }
    else need[b.ph][b.c] = (need[b.ph][b.c] || 0) + n; });
  const paths = [[], []];
  for (let ph = 1; ph <= 3; ph++) {
    const patches = [];
    Object.keys(need[ph]).forEach(c => { let n = need[ph][c]; while (n > 0) { let s = n <= 6 ? n : n - 6 < 3 ? n - 3 : ri(r, Math.max(3, P.big || 3), 6); if (n < 3 && patches.length) { s = n; } patches.push({ c: +c, n: s }); n -= s; } });
    CS.shuffle(patches, r);
    if (ph === 2 && P.cdFirst) patches.sort((x, y) => ([C, D].includes(y.c) ? 1 : 0) - ([C, D].includes(x.c) ? 1 : 0));
    while (patches.length) {
      const ord = [0, 1].sort((x, y) => paths[x].length - paths[y].length);
      let done = false;
      for (const i of ord) { const last = paths[i][paths[i].length - 1]; const rem = {}; patches.forEach(pt => { rem[pt.c] = (rem[pt.c] || 0) + pt.n; });
        let pi = -1; patches.forEach((pt, x) => { if (pt.c !== last && (pi < 0 || rem[pt.c] > rem[patches[pi].c])) pi = x; });
        if (ph === 2 && P.cdFirst) { const x = patches.findIndex(pt => pt.c !== last && [C, D].includes(pt.c)); if (x >= 0) pi = x; }
        if (pi >= 0) { const pt = patches.splice(pi, 1)[0]; for (let j = 0; j < pt.n; j++) paths[i].push(pt.c); done = true; break; } }
      if (!done) { const pt = patches.shift(); for (let j = 0; j < pt.n; j++) paths[ord[0]].push(pt.c); }
    }
  }
  const j = { $schema: CS.LEVEL_SCHEMA, formatVersion: CS.FORMAT_VERSION, id: 'level_' + String(S.n).padStart(4, '0'), conveyor: S.conveyor, slots: S.slots || 4, extraSlots: S.extraSlots != null ? S.extraSlots : 2, slotLocks: [],
    feeders: paths.map((p, i) => ({ bottles: [].concat(...p.map(c => [c, c, c, c])), hiddenRows: [], entry: ['left', 'right'][i] })),
    lanes: lanes.map(q => q.map(b => { const t = { color: b.c }; if (b.t > 1) t.size = b.t; return t; })), links: [],
    view: { cameraPreset: 'default' }, meta: { name: S.name, difficulty: S.diff } };
  if (S.intro) j.meta.notes = S.intro;
  const m = CS.fromJSON(j);
  return { m, json: CS.toJSON(m), lanes, paths };
}
module.exports = { make };
