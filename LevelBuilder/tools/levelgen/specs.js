'use strict';
const LR = ['left', 'right'], LMR = ['left', 'middle', 'right'];
const S = [];
// ---- levels 1-10: hand written from Ethan's brief ----
S.push({ n: 1, name: 'First Sort', diff: 'easy', intro: 'Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only.',
  conveyor: 'square_19', entries: ['middle'], lanes: 1, boxes: 8, colors: 4, window: 0, count: 6 });   // Enter Path rows in queue order, one box after another
S.push({ n: 2, name: 'Two Queues', diff: 'easy', intro: 'A second queue: pick which front box to send.',
  conveyor: 'square_19', entries: ['middle'], lanes: 2, boxes: 12, colors: 4, window: 6, count: 8 });
S.push({ n: 3, name: 'Round and Round', diff: 'easy', booster: '1st', intro: 'Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up.',
  conveyor: 'square_19', entries: LR, lanes: 1, boxes: 12, colors: 4, window: 0, swap: [0, -1] });
S.push({ n: 4, name: 'Side by Side', diff: 'easy', intro: 'Two queues with two Enter Paths.',
  conveyor: 'square_19', entries: LR, lanes: 2, boxes: 10, colors: 5, window: 4, count: 10 });
S.push({ n: 5, name: 'Big Box', diff: 'easy', intro: 'First 24-item box. The belt is full, so its last items pour in from the Enter Path later.',
  conveyor: 'triangle_12', entries: LR, lanes: 2, boxes: 21, big2: 9, bigFrom: 1, colors: 5, window: 6, late: { count: 4, unique: true }, count: 10, bigCount: 3 });
S.push({ n: 6, name: 'Three Queues', diff: 'easy', booster: '2nd', intro: 'A third queue, with a few 24-item boxes.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 18, big2: 3, colors: 5, window: 8, count: 15, bigCount: 3 });
S.push({ n: 7, name: 'Hidden Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues.',
  conveyor: 'square_19', entries: LR, lanes: 2, boxes: 16, big2: 2, hidden: 3, hiddenSizes: [1], colors: 5, window: 8,
  hiddenPattern: (l, p) => p > 1 && (l % 2 === 0 ? p % 2 === 0 : p % 2 === 1) });
S.push({ n: 8, name: 'Hidden Big Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 20, big2: 4, hidden: 4, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 10, count: 15, bigCount: 3,
  hiddenPattern: (l, p) => p % 2 === 0 });
S.push({ n: 9, name: 'Long Haul', diff: 'easy', booster: '3rd', intro: 'No Hidden Box, but a longer level. Three queues, two Enter Paths.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 30, big2: 5, colors: 6, window: 5, count: 18, bigAt: [4, 9, 14], minRandom: 0.99 });
S.push({ n: 10, name: 'First Challenge', diff: 'hard', unlock: 'Hidden Box', intro: 'First hard level: every box behind the front row is hidden. Longer than level 9.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 36, big2: 7, hidden: 7, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 40, stick: 0.7,
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
const CONV = { 11: 'square_19', 12: 'bean_18', 13: 'lens_18', 14: 'square_19', 15: 'heart_21', 16: 'bean_18', 17: 'square_19', 18: 'lens_18', 19: 'bean_18',
  20: 'square_19', 21: 'lens_18', 22: 'square_19', 23: 'bean_18', 24: 'lens_18', 25: 'heart_21', 26: 'square_19', 27: 'bean_18', 28: 'lens_18', 29: 'square_19',
  30: 'heart_21', 31: 'bean_18', 32: 'square_19', 33: 'lens_18', 34: 'bean_18', 35: 'heart_21', 36: 'square_19', 37: 'lens_18', 38: 'bean_18', 39: 'bean_18', 40: 'heart_21' };   // 39 on Bean: on the 19-row square its doors blocked random play too often
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
    n, name: NAMES[n], diff: hard ? 'hard' : 'medium', conveyor: CONV[n], entries, lanes, boxes, colors,
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
  // the level that introduces an element is very easy: random taps must win it, like levels 1-9
  if (s.unlock) { s.tutorial = true; s.diff = 'easy'; s.minRandom = s.door ? 0.85 : 0.9; s.stick = 0; s.big4 = 0; }
  if (n === 31) s.rowLockRange = [3, 4];   // shorter Locked Item counts: the 18-row Bean belt fills fast
  if (n === 13) {
    // the first level after Locked Box is introduced: longer but gentler, with more Locked Boxes further back in the queues
    // (none in the first two boxes of a queue), 5 colours, no 32-item box and rows close to box order.
    // Seed 35 was picked over 200 runs: random taps win about 97 % (the old level 13 about 92 %)
    Object.assign(s, { items: 432, big3Share: 0, locks: 5, lockFrom: 2, lockDepth: 6, lockPerLane: 2, lockRange: [2, 4], lockPerDepth: 2, stick: 0, minRandom: 0.9, seed: 35 });
    s.tune = { colors: 5, window: 8 };
  }
  if (n === 15) intro.push('Third Enter Path.');
  if (n === 20) intro.push('Fourth queue.');
  if (hard) intro.push('Hard level.');
  if (intro.length) s.intro = intro.join(' ');
  S.push(s);
}
// ---- level length: from level 2 on, every level holds more items than the belt, so items are still waiting in the Enter Paths
// once the belt is full. The belts are the game's conveyors (Rounded square 19 rows = 76 spots, Triangle 12 = 48, Heart 30 = 120).
// Levels 1-3 are sized to the belt: level 1 fills about 85 % of it, level 2 leaves 1 row waiting, level 3 a few rows per Enter Path.
// From level 4 the item count builds up to the normal amount: TOTAL gives levels 1-10 in items; levels 11-40 hold
// 168 items (176 on Heart) plus EXTRA, the same amounts as before the conveyors changed.
const BELT = { square_19: 19, bean_18: 18, lens_18: 18, heart_21: 30, triangle_12: 12, oval_14: 14 };   // belt rows of each conveyor
const TOTAL = { 1: 64, 2: 80, 3: 96, 4: 128, 5: 136, 6: 160, 7: 192, 8: 208, 9: 224, 10: 352 };
// colours unlock one by one: Red, Blue, Green and Yellow first, then Pink at level 5, Orange at 7, Purple at 10 and Cyan at 12.
// Up to level 12 a level uses every unlocked colour; after that any of the 8 can be mixed in.
const UNLOCKED = n => n < 5 ? 4 : n < 7 ? 5 : n < 10 ? 6 : n < 12 ? 7 : 8;
S.forEach(s => {
  const k = UNLOCKED(s.n);
  if (s.n <= 10) { s.palette = [1, 2, 3, 4, 5, 6, 7, 8].slice(0, k); s.colors = k; }
  else {
    // long levels: 6 colours per level (7 on hard, 5 when a level introduces an element), so the belt does not jam;
    // levels 11 and 12 always include the colour they unlock
    s.palette = [1, 2, 3, 4, 5, 6, 7, 8].slice(0, k);
    s.colors = Math.min(k, s.tutorial ? 5 : s.diff === 'hard' ? 7 : 6);
    if (s.n === 11 || s.n === 12) s.mustColor = k;
  }
});
S.forEach(s => {
  const x = s.n - 11;
  // levels 11-40 carry on from level 9 (312 items) and level 10 (368): medium levels start at 336 items and add 4 a level,
  // hard levels are 25 % longer, and a level that introduces an element stays at level 9's length (see `tutorial`)
  // Block Door levels are 10 % shorter (20 % from level 31, where a quarter of the rows come at the end): the shut door holds back half the rows, so a long door level jams easily
  const len = s.tutorial ? 312 : Math.round((336 + x * 4) * (s.diff === 'hard' ? 1.25 : 1) * (s.door ? (s.doorTail ? 0.8 : 0.9) : 1) / 4) * 4;
  const items = TOTAL[s.n] || s.items || len;
  const units = Math.ceil(items / 4);   // one unit = 4 items = one Enter Path row
  // boxes come in four tiers: 16 / 24 / 32 / 40 items = 4 / 6 / 8 / 10 rows (SIZE in gen.js)
  const rowsOf = N => 4 * (N - (s.big2 || 0) - (s.big3 || 0) - (s.big4 || 0)) + 5 * (s.big2 || 0) + 6 * (s.big3 || 0) + 8 * (s.big4 || 0);
  if (s.n <= 10) {
    // keep the hand-written mix: the same share of the next size up, the rest are 16-item boxes
    const share2 = (s.big2 || 0) / s.boxes, shareH = (s.hidden || 0) / s.boxes;
    let N = Math.max(1, Math.round(units / (4 + share2)));
    let big = s.big2 ? Math.max(1, Math.round(N * share2)) : 0;
    // `count` sets the box count directly (Ethan's minimums per queue); `bigCount` / `bigAt` set the 24-item boxes
    if (s.count) { N = s.count; big = s.bigAt ? s.bigAt.length : s.bigCount != null ? s.bigCount : 0; }
    const u = s.count ? 4 * N + 2 * big : units;
    if (s.big2 || s.bigAt) s.big2 = big;
    if (s.window) s.window = Math.round(s.window * u / (s.boxes + (s.big2 || 0)));
    if (s.hidden) s.hidden = Math.max(1, Math.round(N * shareH));
    s.boxes = N;
  } else {
    // same tier mix as before: 20 % 24-item, 5-8 % 32-item, 1-2 40-item boxes
    const r3 = s.big3Share != null ? s.big3Share : s.n === 11 ? 3 / 26 : s.n < 20 ? 0.05 : 0.08;
    let N = Math.round(units / 4.5);
    for (let k = 0; k < 30; k++) {
      s.big2 = Math.round(N * 0.2); s.big3 = Math.round(N * r3);
      const d = units - rowsOf(N);
      if (Math.abs(d) < 4) break;
      N += d > 0 ? 1 : -1;
    }
    s.boxes = N;
    if (s.hidden) s.hidden = Math.round(N * (s.diff === 'hard' ? 0.22 : 0.16));
    s.window = s.tutorial ? 12 : Math.round(s.window * 1.6);
  }
  if (s.tune) { Object.assign(s, s.tune); delete s.tune; }   // per-level values set after the shared rules above
});
module.exports = S;
