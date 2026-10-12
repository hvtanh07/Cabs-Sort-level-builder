'use strict';
const LR = ['left', 'right'], LMR = ['left', 'middle', 'right'];
const S = [];
// ---- levels 1-10: hand written from Ethan's brief ----
S.push({ n: 1, name: 'First Sort', diff: 'easy', intro: 'Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only.',
  conveyor: 'square_42', entries: ['middle'], lanes: 1, boxes: 8, colors: 4, window: 4 });
S.push({ n: 2, name: 'Two Queues', diff: 'easy', intro: 'A second queue: pick which front box to send.',
  conveyor: 'square_42', entries: ['middle'], lanes: 2, boxes: 12, colors: 4, window: 6 });
S.push({ n: 3, name: 'Round and Round', diff: 'easy', booster: '1st', intro: 'Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up.',
  conveyor: 'square_42', entries: LR, lanes: 1, boxes: 12, colors: 4, window: 0, swap: [0, 11] });
S.push({ n: 4, name: 'Side by Side', diff: 'easy', intro: 'Two queues with two Enter Paths. A short level.',
  conveyor: 'square_42', entries: LR, lanes: 2, boxes: 10, colors: 5, window: 4 });
S.push({ n: 5, name: 'Big Box', diff: 'easy', intro: 'First 8-item box. The belt is full, so its last items pour in from the Enter Path later.',
  conveyor: 'triangle_28', entries: LR, lanes: 2, boxes: 21, big2: 9, bigFrom: 1, colors: 5, window: 6, late: { count: 4, unique: true } });
S.push({ n: 6, name: 'Three Queues', diff: 'easy', booster: '2nd', intro: 'A third queue, with a few 8-item boxes.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 18, big2: 3, colors: 5, window: 8 });
S.push({ n: 7, name: 'Hidden Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Hidden Box on 4-item boxes only. Two Enter Paths, two queues.',
  conveyor: 'square_42', entries: LR, lanes: 2, boxes: 16, big2: 2, hidden: 3, hiddenSizes: [1], colors: 5, window: 8 });
S.push({ n: 8, name: 'Hidden Big Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Hidden Box on 4- and 8-item boxes, three queues.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 20, big2: 4, hidden: 4, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 10 });
S.push({ n: 9, name: 'Long Haul', diff: 'easy', booster: '3rd', intro: 'No Hidden Box, but a longer level. Three queues, two Enter Paths.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 30, big2: 5, colors: 6, window: 12 });
S.push({ n: 10, name: 'First Challenge', diff: 'hard', unlock: 'Hidden Box', intro: 'First hard level: Hidden Boxes of every size, longer than level 9, more items than the belt holds.',
  conveyor: 'square_42', entries: LR, lanes: 3, boxes: 36, big2: 7, hidden: 7, hiddenSizes: [1, 2], needHiddenSize: 2, colors: 6, window: 40, stick: 0.7 });

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
  if (n === 11) intro.push('First 12-item box.');
  if (n === 26) intro.push('First 16-item box.');
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
module.exports = S;
