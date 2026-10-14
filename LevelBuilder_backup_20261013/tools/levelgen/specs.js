'use strict';
const LR = ['left', 'right'], LMR = ['left', 'middle', 'right'];
const S = [];
// ---- levels 1-10: hand written from Ethan's brief ----
S.push({ n: 1, name: 'First Sort', diff: 'easy', intro: 'Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only.',
  conveyor: 'square_42', entries: ['middle'], lanes: 1, boxes: 8, colors: 4, window: 0, grouped: true });
S.push({ n: 2, name: 'Two Queues', diff: 'easy', intro: 'A second queue: pick which front box to send.',
  conveyor: 'square_42', entries: ['middle'], lanes: 2, boxes: 12, colors: 4, window: 6 });
S.push({ n: 3, name: 'Round and Round', diff: 'easy', booster: '1st', intro: 'Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up.',
  conveyor: 'square_42', entries: LR, lanes: 1, boxes: 12, colors: 4, window: 0, swap: [0, 11] });
S.push({ n: 4, name: 'Side by Side', diff: 'easy', intro: 'Two queues with two Enter Paths.',
  conveyor: 'square_42', entries: LR, lanes: 2, boxes: 10, colors: 5, window: 4 });
S.push({ n: 5, name: 'Big Box', diff: 'easy', intro: 'First 24-item box. The belt is full, so its last items pour in from the Enter Path later.',
  conveyor: 'triangle_28', entries: LR, lanes: 2, boxes: 21, big2: 9, bigFrom: 1, colors: 5, window: 6, late: { count: 4, unique: true } });
S.push({ n: 6, name: 'Three Queues', diff: 'easy', booster: '2nd', intro: 'A third queue, with a few 24-item boxes.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 18, big2: 3, colors: 5, window: 8 });
S.push({ n: 7, name: 'Hidden Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues.',
  conveyor: 'square_42', entries: LR, lanes: 2, boxes: 16, big2: 2, hidden: 3, hiddenSizes: [1], colors: 5, window: 8,
  hiddenPattern: (l, p) => p > 1 && (l % 2 === 0 ? p % 2 === 0 : p % 2 === 1) });
S.push({ n: 8, name: 'Hidden Big Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 20, big2: 4, hidden: 4, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 10,
  hiddenPattern: (l, p) => p % 2 === 0 });
S.push({ n: 9, name: 'Long Haul', diff: 'easy', booster: '3rd', intro: 'No Hidden Box, but a longer level. Three queues, two Enter Paths.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 30, big2: 5, colors: 6, window: 12 });
S.push({ n: 10, name: 'First Challenge', diff: 'hard', unlock: 'Hidden Box', intro: 'First hard level: every box behind the front row is hidden. Longer than level 9.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 36, big2: 7, hidden: 7, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 40, stick: 0.7,
  hiddenPattern: (l, p) => p > 1 });

// ---- levels 11-40: from the level list sheet ----
const FEAT = {
  11: [], 12: ['LB'], 13: ['LB'], 14: ['H'], 15: ['LB'], 16: [], 17: ['LK'], 18: ['H', 'LK'], 19: ['LB'], 20: ['LB', 'LK'],
  21: ['H'], 22: ['D'], 23: ['H', 'D'], 24: ['LK'], 25: ['LB', 'D'], 26: ['LB', 'D'], 27: ['LK', 'LI'], 28: ['H', 'LI'], 29: [], 30: ['H', 'LB', 'LI'],
  31: ['LI'], 32: ['BQ'], 33: ['BQ'], 34: ['LK'], 35: ['H', 'LB', 'BQ'], 36: [], 37: ['H', 'D'], 38: ['LK', 'BQ'], 39: ['H', 'D'], 40: ['H', 'LB', 'LI', 'BQ']
};
const FIRST = { LB: 12, LK: 17, D: 22, LI: 27, BQ: 32 };
const FNAME = { H: 'Hidden Box', LB: 'Locked Box', LK: 'Linked Box', D: 'Block Door', LI: 'Locked Item', BQ: 'Block Queue' };
const NAMES = {
  11: 'Triple Stack', 12: 'Locked Box', 13: 'Key Count', 14: 'Blind Picks', 15: 'Three Gates', 16: 'Heavy Load', 17: 'Linked Box', 18: 'Hidden Links',
  19: 'Patience', 20: 'Four Queues', 21: 'Fog', 22: 'Block Door', 23: 'Behind the Door', 24: 'Chain Gang', 25: 'Door Lock', 26: 'Swing Doors',
  27: 'Locked Item', 28: 'Secret Cargo', 29: 'Rush Hour', 30: 'Deep Freeze', 31: 'Cold Storage', 32: 'Block Queue', 33: 'Detour', 34: 'Tangled',
  35: 'Gridlock', 36: 'Long Belt', 37: 'Night Shift', 38: 'Roadblock', 39: 'Last Door', 40: 'Grand Finale'
};
const PATHS3 = new Set([15, 18, 20, 24, 29, 30, 33, 35, 36, 38, 40]);   // 3rd Enter Path from 15
const LANES4 = new Set([20, 27, 30, 31, 34, 35, 38, 40]);              // 4th queue from 20
const CONV = { 11: 'square_42', 12: 'bean_42', 13: 'lens_42', 14: 'square_42', 15: 'heart_44', 16: 'bean_42', 17: 'square_42', 18: 'lens_42', 19: 'bean_42',
  20: 'square_42', 21: 'lens_42', 22: 'square_42', 23: 'bean_42', 24: 'lens_42', 25: 'heart_44', 26: 'square_42', 27: 'bean_42', 28: 'lens_42', 29: 'square_42',
  30: 'heart_44', 31: 'bean_42', 32: 'square_42', 33: 'lens_42', 34: 'bean_42', 35: 'heart_44', 36: 'square_42', 37: 'lens_42', 38: 'bean_42', 39: 'square_42', 40: 'heart_44' };
for (let n = 11; n <= 40; n++) {
  const hard = n % 5 === 0;
  const f = FEAT[n];
  const x = n - 11;
  let boxes = Math.round(26 + x * 0.5), colors = n < 15 ? 6 : n < 25 ? 7 : 8;
  if (hard) { boxes = Math.round(boxes * 1.2); colors = Math.min(8, colors + 1); }
  const lanes = LANES4.has(n) ? 4 : 3;
  let entries = PATHS3.has(n) ? LMR : LR;
  if (f.includes('D')) entries = LR;
  const s = {
    n, name: NAMES[n], diff: hard ? 'hard' : 'normal', conveyor: CONV[n], entries, lanes, boxes, colors,
    big2: Math.round(boxes * 0.2), big3: n === 11 ? 3 : Math.round(boxes * (n < 20 ? 0.05 : 0.08)), big4: n >= 26 ? (hard ? 2 : 1) : 0,
    window: Math.round((10 + x * 0.6) * (hard ? 2.2 : 1)), stick: hard ? 0.8 : 0.5
  };
  const intro = [];
  if (n === 11) intro.push('First 32-item box.');
  if (n === 26) intro.push('First 40-item box.');
  f.forEach(k => {
    if (FIRST[k] === n) { s.unlock = FNAME[k]; intro.push('Introduces ' + FNAME[k] + '.'); }
    if (k === 'H') { s.hidden = Math.round(boxes * (hard ? 0.22 : 0.16)); s.hiddenSizes = n < 20 ? [1, 2] : [1, 2, 3]; }
    if (k === 'LB') { s.locks = FIRST.LB === n ? 2 : hard ? 4 : 3; s.lockRange = FIRST.LB === n ? [2, 3] : [3, hard ? 6 : 5]; }
    if (k === 'LK') { s.links = FIRST.LK === n ? 1 : hard ? 3 : 2; s.linkSpread = FIRST.LK === n ? 0 : 1; }
    if (k === 'D') { s.door = FIRST.D === n ? 4 : 3; if (n > 30) s.doorTail = 0.25; }
    if (k === 'LI') { s.lockedRows = FIRST.LI === n ? 2 : hard ? 4 : 3; s.rowLockRange = FIRST.LI === n ? [3, 4] : [3, hard ? 8 : 6]; }
    if (k === 'BQ') { s.block = FIRST.BQ === n ? 4 : 3; }
  });
  if (n === 15) intro.push('Third Enter Path.');
  if (n === 20) intro.push('Fourth queue.');
  if (hard) intro.push('Hard level.');
  if (intro.length) s.intro = intro.join(' ');
  S.push(s);
}
// ---- level length: from level 2 on, every level holds more items than the belt, so items are still waiting in the Enter Paths
// once the belt is full. EXTRA = items beyond the belt's spots (rows x 4). Box counts are worked out from it.
const BELT = { square_42: 42, bean_42: 42, lens_42: 42, heart_44: 44, triangle_28: 28, oval_32: 32 };
// levels 1-3 are lighter: level 1 fills about 90 % of the belt, level 2 leaves 3 rows waiting, level 3 a little more;
// from level 4 the count builds up to the normal amount
const EXTRA = { 1: -24, 2: 12, 3: 24, 4: 28, 5: 32, 6: 36, 7: 40, 8: 48, 9: 56, 10: 160 };
// colours unlock one by one: Red, Blue, Green and Yellow first, then Pink at level 5, Orange at 7, Purple at 10 and Cyan at 12.
// Up to level 12 a level uses every unlocked colour; after that any of the 8 can be mixed in.
const UNLOCKED = n => n < 5 ? 4 : n < 7 ? 5 : n < 10 ? 6 : n < 12 ? 7 : 8;
S.forEach(s => {
  const k = UNLOCKED(s.n);
  if (s.n <= 12) { s.palette = [1, 2, 3, 4, 5, 6, 7, 8].slice(0, k); s.colors = k; }
  else s.colors = Math.min(k, s.colors);
});
S.forEach(s => {
  const x = s.n - 11;
  const extra = EXTRA[s.n] || Math.round((48 + x * 2) * (s.diff === 'hard' ? 1.6 : 1) / 4) * 4;
  const units = Math.ceil((BELT[s.conveyor] * 4 + extra) / 4);   // one unit = 4 items = one Enter Path row
  // boxes come in four tiers: 16 / 24 / 32 / 40 items = 4 / 6 / 8 / 10 rows (SIZE in gen.js)
  const rowsOf = N => 4 * (N - (s.big2 || 0) - (s.big3 || 0) - (s.big4 || 0)) + 5 * (s.big2 || 0) + 6 * (s.big3 || 0) + 8 * (s.big4 || 0);
  if (s.n <= 10) {
    // keep the hand-written mix: the same share of the next size up, the rest are 16-item boxes
    const share2 = (s.big2 || 0) / s.boxes, shareH = (s.hidden || 0) / s.boxes;
    let N = Math.max(1, Math.round(units / (4 + share2)));
    if (s.big2) s.big2 = Math.max(1, Math.round(N * share2));
    if (s.hidden) s.hidden = Math.max(1, Math.round(N * shareH));
    if (s.window) s.window = Math.round(s.window * units / (s.boxes + (s.big2 || 0)));
    s.boxes = N;
  } else {
    // same tier mix as before: 20 % 24-item, 5-8 % 32-item, 1-2 40-item boxes
    const r3 = s.n === 11 ? 3 / 26 : s.n < 20 ? 0.05 : 0.08;
    let N = Math.round(units / 4.5);
    for (let k = 0; k < 30; k++) {
      s.big2 = Math.round(N * 0.2); s.big3 = Math.round(N * r3);
      const d = units - rowsOf(N);
      if (Math.abs(d) < 4) break;
      N += d > 0 ? 1 : -1;
    }
    s.boxes = N;
    if (s.hidden) s.hidden = Math.round(N * (s.diff === 'hard' ? 0.22 : 0.16));
    s.window = Math.round(s.window * 1.6);
  }
});
module.exports = S;
