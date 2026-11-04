'use strict';
/* Play test report: plays levels 1–40 (or node playtest.js 5,6) with a wide range of player bots, from blind taps to the
   careful player, with and without the RV slots, and checks each level against its GDD role (section 7, Level config).
   Writes playtest.json and playtest.md next to this file.

   The bots in the ladder (gen.js BOTS) differ only by how many taps are random. This file adds play styles on top:
   - Belt glancer: sends a box when its colour is anywhere on the belt, without counting how many items are there.
   - Patient casual: the casual player (3 taps in 10 random) who keeps the last free slot for a box whose items are on the belt.
   - Sharp, impatient: never taps at random but fills every free slot at once (it never waits).
   The new bots only read what a player can see: items still hidden on an Enter Path ("?") are not counted. */
const fs = require('fs'), path = require('path');
const G = require('./gen.js');
const CS = G.CS;
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const RUNS = +(process.env.RUNS || 200), SEED = 7000;
global.window = global; eval(fs.readFileSync(path.join(__dirname, '../../js/levels.js'), 'utf8'));
const levels = window.CS_BUNDLED_LEVELS.levels;

function rng(seed) { return G.rng(seed); }
const pickR = (r, a) => a[Math.floor(r() * a.length)];

// what a player can see: unlocked items on the belt, plus the first rows of each open Enter Path that are not hidden
function seen(g, enterRows, enterWeight) {
  const avail = {};
  g.rows.forEach(row => row.forEach(it => { if (it && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + 1; }));
  if (enterRows) g.feeders.forEach(f => { if (!f.shut) f.rows.slice(0, enterRows).forEach(row => row.forEach(it => { if (it && !it.hidden && !(it.lock > 0)) avail[it.color] = (avail[it.color] || 0) + enterWeight; })); });
  return avail;
}
function needOf(g) { const need = {}; g.slots.forEach(s => { if (s.box) need[s.box.color] = (need[s.box.color] || 0) + s.box.cap - s.box.filled; }); return need; }
function freeCount(g) { return g.slots.filter(s => !s.box && !(s.lock > 0)).length; }
// the best front box by what is on the belt (fair-information version of the game's auto-play bot)
function bestLane(g, can) {
  const avail = seen(g, 2, 0.5), need = needOf(g);
  let best = -1, bs = -Infinity;
  can.forEach(l => { const b = g.lanes[l][0]; const s = (avail[b.color] || 0) - (need[b.color] || 0) - b.cap * 0.25 + g.lanes[l].length * 0.05; if (s > bs) { bs = s; best = l; } });
  return { lane: best, left: best < 0 ? 0 : (avail[g.lanes[best][0].color] || 0) - (need[g.lanes[best][0].color] || 0) };
}

/* Each bot: decide(g, r, can) returns a queue to tap, or -1 to wait this step. */
const BOTS = [
  { id: 'stay', tier: 'Rất kém', name: 'Blind, one queue', note: 'không nhìn băng chuyền, bấm 1 hàng tới khi hết rồi sang hàng khác (thứ tự hàng ngẫu nhiên mỗi lần)', policy: 'stay' },
  { id: 'turns', tier: 'Rất kém', name: 'Blind, in turn', note: 'không nhìn, bấm lần lượt hàng 1, 2, 3, 1…', policy: 'turns' },
  { id: 'random', tier: 'Rất kém', name: 'Random tap', note: 'bấm ngẫu nhiên, lấp mọi slot trống ngay', policy: 1 },
  { id: 'glance', tier: 'Kém', name: 'Belt glancer', note: 'thấy màu hộp có trên băng chuyền là gửi, không đếm số lượng; không có thì bấm bừa', decide(g, r, can) {
    const on = seen(g, 0, 0); const m = can.filter(l => on[g.lanes[l][0].color]); return pickR(r, m.length ? m : can);
  } },
  { id: 'novice', tier: 'Kém', name: 'Beginner', note: '50% bấm bừa, 50% chọn theo màu trên băng', policy: 0.5 },
  { id: 'casual', tier: 'Trung bình', name: 'Casual', note: '30% bấm bừa, lấp mọi slot trống', policy: 0.3 },
  { id: 'pcasual', tier: 'Trung bình', name: 'Patient casual', note: 'như Casual nhưng giữ slot trống cuối cho hộp có màu đang trên băng', decide(g, r, can) {
    const pick = r() < 0.3 ? { lane: pickR(r, can), left: 1 } : bestLane(g, can);
    if (freeCount(g) <= 1 && pick.left <= 0 && g.stall <= g.R) { const b = bestLane(g, can); if (b.left <= 0) return -1; return b.lane; }
    return pick.lane;
  } },
  { id: 'watcher', tier: 'Khá', name: 'Belt watcher', note: '10% bấm bừa, còn lại chọn theo màu trên băng', policy: 0.1 },
  { id: 'sharp', tier: 'Khá', name: 'Sharp, impatient', note: 'không bấm bừa nhưng không bao giờ chờ: lấp slot ngay bằng hộp tốt nhất', decide(g, r, can) { return bestLane(g, can).lane; } },
  { id: 'careful', tier: 'Giỏi', name: 'Careful', note: 'đếm item sắp tới, chờ thay vì gửi hộp chưa thể lấp; không may rủi', policy: 'smart' }
];

function play(m, bot, seed, rv) {
  if (!bot.decide) return G.play(m, G.MODES.fly, bot.policy, seed, null, null, rv);
  const g = new CS.Game(m, G.GEOM[m.conveyor], { pickMode: 'fly', prefill: true });
  const r = rng(seed);
  let guard = 0;
  while (guard++ < 40000) {
    if (g.over === 'lose' && rv && !g.addRV()) continue;
    if (g.over) break;
    for (let s = 0; s < 6; s++) {
      if (g.over || g.freeSlot() < 0) break;
      const can = g.lanes.map((_, l) => l).filter(l => g.canSendLane(l));
      if (!can.length) break;
      const l = bot.decide(g, r, can);
      if (l < 0) break;
      g.send(l);
    }
    g.step();
  }
  return { win: g.over === 'win' };
}
function rate(m, bot, rv) {
  let w = 0;
  for (let s = 0; s < RUNS; s++) if (play(m, bot, SEED + s, rv).win) w++;
  return w / RUNS;
}

/* GDD section 7 roles: Hard every 5 levels from 10, element intro levels (Hidden Box 7, Locked Box 12, Linked Box 17,
   Block Door 22, Locked Item 27, Block Queue 32) and the level after a Hard level are easy, the level before a Hard level
   is a step up from medium, levels 1–4 teach the basics. */
const INTRO = { 7: 'Hidden Box', 12: 'Locked Box', 17: 'Linked Box', 22: 'Block Door', 27: 'Locked Item', 32: 'Block Queue' };
function role(n) {
  if (n >= 10 && n % 5 === 0) return 'hard';
  if (n <= 4) return 'tutorial';
  if (INTRO[n]) return 'intro';
  if (n > 10 && n % 5 === 1) return 'after-hard';
  if (INTRO[n - 1]) return 'after-intro';
  if (n >= 9 && n % 5 === 4) return 'pre-hard';
  return 'medium';
}
// targets (measured without RV slots): [bot, min, max]
const TARGET = {
  tutorial: [['random', 0.9, 1]],
  intro: [['casual', 0.9, 1], ['novice', 0.8, 1]],
  'after-hard': [['casual', 0.9, 1], ['novice', 0.8, 1]],
  // the level right after an element intro is only a little harder than the intro
  'after-intro': [['casual', 0.8, 0.9], ['watcher', 0.9, 1]],
  medium: [['casual', 0.6, 0.8], ['watcher', 0.85, 1], ['random', 0, 0.6], ['stay', 0, 0.6]],
  'pre-hard': [['casual', 0.4, 0.6], ['watcher', 0.7, 0.85], ['random', 0, 0.6], ['stay', 0, 0.6]],
  hard: [['watcher', 0.4, 0.6], ['casual', 0, 0.3], ['random', 0, 0.1], ['careful', 1, 1]]
};

module.exports = { BOTS, play, role, TARGET, INTRO };
if (require.main !== module) return;

const out = [];
levels.forEach((j, i) => {
  const n = i + 1;
  if (only && !only.includes(n)) return;
  const m = CS.fromJSON(j);
  const res = {}, resRV = {};
  BOTS.forEach(b => { res[b.id] = rate(m, b, false); resRV[b.id] = b.id === 'careful' ? res[b.id] : rate(m, b, true); });
  const rl = role(n);
  const misses = TARGET[rl].filter(([id, lo, hi]) => res[id] < lo - 1e-9 || res[id] > hi + 1e-9).map(([id, lo, hi]) => ({ bot: id, got: res[id], lo, hi }));
  const row = { n, name: j.meta.name, metaDiff: j.meta.difficulty, role: rl, intro: INTRO[n] || null, res, resRV, misses };
  out.push(row);
  console.log(n, rl, BOTS.map(b => b.id + ' ' + Math.round(res[b.id] * 100)).join(' '), misses.length ? 'OFF ' + misses.map(x => x.bot + ' ' + Math.round(x.got * 100)).join(', ') : 'ok');
});
fs.writeFileSync(path.join(__dirname, 'playtest.json'), JSON.stringify({ runs: RUNS, bots: BOTS.map(b => ({ id: b.id, name: b.name, tier: b.tier, note: b.note })), targets: TARGET, levels: out }, null, 1));
