'use strict';
/* Locked Item check (user, 2026-11-06: in level 27 the locked items unlocked on the belt before any box of their colour
   showed up, so they never held anything up). Plays the level with the careful bot and, for every locked item, notes
   whether it was still locked at some moment when a box of its colour was at the front of a queue or in a slot.
   node litem-check.js 27,28  ->  { good, wasted, share } per level (share = good / all locked items). */
const fs = require('fs'), path = require('path');
const G = require('./gen.js'), CS = G.CS;
function check(m) {
  const g = new CS.Game(m, G.GEOM[m.conveyor], { pickMode: 'fly' });
  const seen = {}; let good = 0, wasted = 0, guard = 0;
  const vis = c => g.slots.some(s => s.box && s.box.color === c) || g.lanes.some(q => q[0] && q[0].color === c);
  while (guard++ < 40000 && !g.over) {
    for (let s = 0; s < 6; s++) { if (g.over || g.freeSlot() < 0) break; if (G.smart(g) < 0) break; }
    g.step();
    g.rows.forEach(row => row.forEach(it => {
      if (!it) return;
      if (it.lock > 0 && !(it.id in seen)) seen[it.id] = { met: false };
      const z = seen[it.id]; if (!z || z.done) return;
      if (it.lock > 0 && vis(it.color)) z.met = true;
      if (!(it.lock > 0)) { z.done = true; if (z.met) good++; else wasted++; }
    }));
  }
  Object.values(seen).forEach(z => { if (!z.done) { if (z.met) good++; else wasted++; } });
  return { good, wasted, share: good + wasted ? +(good / (good + wasted)).toFixed(2) : 1 };
}
module.exports = { check };
if (require.main === module) for (const n of process.argv[2].split(',')) {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, '../../levels/level_' + String(n).padStart(4, '0') + '.json'), 'utf8'));
  console.log(n, JSON.stringify(check(CS.fromJSON(j))));
}
