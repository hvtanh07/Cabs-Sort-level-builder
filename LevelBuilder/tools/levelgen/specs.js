'use strict';
const LR = ['left', 'right'], LMR = ['left', 'middle', 'right'];
const S = [];
// ---- levels 1-10: hand written from Ethan's brief ----
S.push({ n: 1, name: 'First Sort', diff: 'easy', intro: 'Tap a box to send it up. One middle Enter Path, 3 colours (two boxes each), 32- and 40-item boxes.',
  conveyor: 'square_19', entries: ['middle'], lanes: 1, boxes: 8, colors: 4, window: 0, count: 6, slots: 5, extraSlots: 0,
  sizeAt: [3, 4, 3, 4, 3, 4], colorAt: [1, 1, 4, 4, 2, 2], rowOrder: [0, 2, 1, 4, 3, 5] });   // `sizeAt` sets each box's size in send order (3 = 32, 4 = 40 items), `colorAt` its colour (1 Red, 2 Blue, 3 Green, 4 Yellow), `rowOrder` the order its row groups enter: Red 32, Yellow 32, Red 40, Blue 32, Yellow 40, Blue 40
// levels 2 and 3 work like level 1: 32- and 40-item boxes, each box's rows grouped together and the groups mixed (`rowOrder`).
// Send order takes turns between the 2 queues, so each queue alternates 32 and 40; 6 boxes per queue, each colour 3 boxes
S.push({ n: 2, name: 'Two Queues', diff: 'easy', intro: 'A second queue: pick which front box to send. 32- and 40-item boxes, row groups mixed.',
  conveyor: 'square_19', entries: ['middle'], lanes: 2, boxes: 12, colors: 4, window: 0, count: 12, slots: 5, extraSlots: 0,
  sizeAt: [3, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3], colorAt: [1, 2, 4, 3, 2, 1, 3, 4, 2, 1, 4, 3], rowOrder: [1, 3, 0, 2, 4, 6, 5, 7, 9, 8, 11, 10] });
S.push({ n: 3, name: 'Round and Round', diff: 'easy', booster: '1st', intro: 'Two queues and two Enter Paths. Whole row groups take turns between the Enter Paths, mixed out of queue order.',
  conveyor: 'square_19', entries: LR, lanes: 2, boxes: 12, colors: 4, window: 0, count: 12, slots: 5, extraSlots: 0, groupPaths: true,
  sizeAt: [3, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3], colorAt: [3, 1, 4, 2, 1, 4, 3, 2, 4, 3, 1, 2], rowOrder: [1, 2, 0, 3, 4, 5, 7, 6, 9, 11, 8, 10] });
// level 4 adds 16- and 24-item boxes (all four sizes, 3 of each) and still groups each box's rows, mixed, one group per Enter Path
// it also brings in 2 new colours (Pink and Orange, 6 in all, two boxes each) to make it a little harder
S.push({ n: 4, name: 'Side by Side', diff: 'easy', intro: 'Two queues with two Enter Paths. All four box sizes (16 to 40 items); each box\'s rows still come as one group. Two new colours.',
  conveyor: 'square_19', entries: LR, lanes: 2, boxes: 12, colors: 6, window: 0, count: 12, groupPaths: true,
  sizeAt: [4, 1, 2, 3, 4, 1, 2, 3, 3, 4, 1, 2], colorAt: [3, 5, 4, 1, 6, 2, 1, 3, 5, 6, 2, 4], rowOrder: [0, 2, 1, 3, 6, 5, 7, 4, 9, 8, 11, 10] });
// level 5: the rows come in blocks of 3-6 rows of one colour (`chunk`), so the player sees patches of colour coming, and each
// queue sends its boxes in runs (`stick`): random taps park boxes whose colour is far off, so the player has to watch which
// colour is coming and which queue holds that box (checked like the watch-the-belt levels). 3 queues of 6, 6 colours
S.push({ n: 5, name: 'Colour Patches', diff: 'medium', intro: 'A third queue. Rows come in patches of one colour: watch which colour is coming and send the box for it.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 18, colors: 6, window: 4, count: 18, chunk: [3, 6], sizeAt: [3, 4, 3, 2, 3, 2, 4, 3, 2, 3, 4, 3, 2, 3, 4, 2, 3, 2],
  watch: true, casualBar: [0.9, 1], noBlind: true, watchBar: [0.5, 0.85], watchTries: [{ stick: 0.7 }, { stick: 0.8 }, { stick: 0.6 }], maxSeed: 300, seed: 62 });   // the search starts at seed 62 (picked for the old pickup rule); seed 130 passes with the fly rule: random taps win about 53 %, the casual player 95 %
// levels 6-8 carry on from level 5: rows mixed on the Enter Paths, mostly 24- and 32-item boxes, 6 boxes in every queue.
// With 3 queues of 6 and mixed rows, random taps jam now and then: levels 6 and 8 ask random taps to win 80 % in every play
// mode and the casual player (30 % random taps) and the belt watcher 95 %
// Level 6: 3 queues of 6; colours run in diagonal stripes (queue l, box p: colour (p + l) % 8) and the sizes in a 24 / 32 checkerboard
const L6 = Array.from({ length: 18 }, (_, i) => ({ l: i % 3, p: Math.floor(i / 3) }));
// Like level 5, the rows come in patches of 3-6 rows of one colour and each queue sends its boxes in runs, so the player has to
// read the patches coming; `atPos` keeps the colours and sizes tied to the box's place in the queues, so the stripes stay
S.push({ n: 6, name: 'Diagonal Stripes', diff: 'medium', booster: '2nd', intro: 'Box colours in diagonal stripes over all 8 colours; rows come in colour patches, so watch which colour is coming.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 18, colors: 8, window: 4, count: 18, chunk: [3, 6],
  sizeAt: L6.map(x => (x.p + x.l) % 2 ? 3 : 2), atPos: (l, p) => [(p + l) % 8 + 1, (p + l) % 2 ? 3 : 2],
  watch: true, casualBar: [0.9, 1], noBlind: true, watchBar: [0.5, 0.85], watchTries: [{ stick: 0.7 }, { stick: 0.8 }, { stick: 0.6 }, { stick: 0.9 }], maxSeed: 300, seed: 56 });   // the search starts at seed 56; seed 226 passes with the fly rule: random taps win about 7 %, one queue at most 50 %, the casual player 93 %
S.push({ n: 7, name: 'Hidden Box', diff: 'easy', unlock: 'Hidden Box', intro: 'Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Only 32-item boxes.',
  conveyor: 'square_19', entries: LR, lanes: 2, boxes: 12, colors: 6, window: 40, count: 12, sizeAt: new Array(12).fill(3), chunk: [3, 6], minRandom: 0.9,
  hiddenPattern: (l, p) => p > 1 && (l % 2 === 0 ? p % 2 === 0 : p % 2 === 1) });
// level 8: repeats the Hidden Box lesson with another pattern (every even box hidden, so the queues show rows of Hidden Boxes),
// now medium: rows in colour patches, each queue sends its boxes in runs and a 7th colour joins, so random taps and tapping one
// queue until it is empty lose most runs. All four sizes, mostly 24 and 32 (4 / 7 / 6 / 1 boxes of 16 / 24 / 32 / 40 items)
S.push({ n: 8, name: 'Hidden Rows', diff: 'medium', intro: 'Every even box is hidden, so the queues show rows of Hidden Boxes. Rows in colour patches: watch which colour is coming.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 18, colors: 7, window: 4, count: 18, chunk: [3, 6],
  sizeAt: [2, 3, 1, 2, 1, 2, 3, 2, 3, 1, 2, 3, 2, 4, 2, 3, 1, 3],
  hiddenPattern: (l, p) => p % 2 === 0,
  watch: true, casualBar: [0.9, 1], noBlind: true, watchBar: [0.5, 0.85], watchTries: [{ stick: 0.7 }, { stick: 0.8 }, { stick: 0.6 }], maxSeed: 300, seed: 107 });   // the search starts at seed 107; seed 274 passes with the fly rule: random taps win about 23 %, the casual player 93 %
// level 9: 3 queues of 7, no Hidden Boxes. Colours in a repeating chevron: queues 1 and 3 match box for box and queue 2 runs one
// colour ahead (queue l, box p: colour (p + (l === 1)) % 7); sizes repeat 16 / 24 / 32 / 40 down the outer queues and 40 / 32 /
// 24 / 16 down the middle one. Medium: rows in colour patches and each queue sends in runs (`atPos` keeps the chevron in place)
const L9 = Array.from({ length: 21 }, (_, i) => ({ l: i % 3, p: Math.floor(i / 3) }));
const L9AT = (l, p) => [(p + (l === 1 ? 1 : 0)) % 7 + 1, l === 1 ? 4 - p % 4 : 1 + p % 4];
S.push({ n: 9, name: 'Long Haul', diff: 'medium', booster: '3rd', intro: 'Longer queues (7 boxes each). Box colours in a repeating chevron, boxes from 16 to 40 items; rows in colour patches.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 21, colors: 7, window: 4, count: 21, chunk: [3, 6],
  sizeAt: L9.map(x => L9AT(x.l, x.p)[1]), atPos: L9AT,
  watch: true, casualBar: [0.9, 1], noBlind: true, watchBar: [0.5, 0.85], watchTries: [{ stick: 0.8 }, { stick: 0.9 }, { stick: 0.7 }, { stick: 0.9, window: 0 }], maxSeed: 300 });
// level 10: every box behind the front row is hidden; mostly 24 / 32 / 40-item boxes with only 3 of 16 items (3 / 6 / 6 / 6).
// Rows come close to box order and each queue sends its boxes in long runs, so a box sent before its colour is on the belt parks in a slot
S.push({ n: 10, name: 'First Challenge', diff: 'hard', unlock: 'Hidden Box', intro: 'First hard level: every box behind the front row is hidden. Mostly 24- to 40-item boxes, only 3 of 16.',
  conveyor: 'square_19', entries: LR, lanes: 3, boxes: 21, colors: 8, window: 20, count: 21, chunk: [3, 6],
  // the player has to watch the belt, like the hard levels from 15 on: random taps and the blind bots may win at most 25 %, the belt watcher must win 80 %
  watch: true, casualBar: [0, 0.85], watchBar: [0.25, 0.9], noBlind: true, watchTries: [{ window: 8, stick: 0.7 }, { window: 6, stick: 0.9 }], maxSeed: 300, seed: 75,   // the search starts at seed 75; seed 234 passes with the fly rule: random taps win about 3 %, the casual player 65 %, the belt watcher 94 %
  sizeAt: [2, 3, 4, 3, 1, 2, 4, 2, 3, 4, 2, 1, 3, 4, 2, 3, 4, 1, 2, 3, 4],
  hiddenPattern: (l, p) => p > 1 });

// ---- levels 11-40: from the level list sheet ----
const FEAT = {
  11: [], 12: ['LB'], 13: ['LB'], 14: ['H'], 15: ['LB'], 16: [], 17: ['LK'], 18: ['H', 'LK'], 19: ['LB'], 20: ['LB', 'LK'],
  21: ['H'], 22: ['D'], 23: ['H', 'D'], 24: ['LK'], 25: ['LB', 'D'], 26: ['LK', 'D'], 27: ['LK', 'LI'], 28: ['H', 'LI'], 29: [], 30: ['H', 'LB', 'LI'],
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
// Hidden Boxes from level 14 follow the patterns of levels 7 and 8 instead of random boxes, taking turns level by level:
// staggered (level 7: queue 1 hides every even box, queue 2 every odd box after the front, and so on) and rows (level 8: every even box)
const HIDDEN_PATTERN = {
  staggered: { fn: (l, p) => p > 1 && (l % 2 === 0 ? p % 2 === 0 : p % 2 === 1), note: 'Hidden Boxes in a staggered pattern, like level 7.' },
  rows: { fn: (l, p) => p % 2 === 0, note: 'Every even box is hidden, like level 8.' }
};
const HIDDEN_LEVELS = Object.keys(FEAT).map(Number).filter(n => FEAT[n].includes('H'));
const PATHS3 =new Set([15, 18, 20, 24, 29, 30, 33, 35, 36, 38, 40]);   // 3rd Enter Path from 15
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
    if (k === 'H') {
      const hp = HIDDEN_PATTERN[HIDDEN_LEVELS.indexOf(n) % 2 ? 'rows' : 'staggered'];
      s.hiddenPattern = hp.fn; intro.push(hp.note);
    }
    if (k === 'LB') { s.locks = FIRST.LB === n ? 2 : hard ? 4 : 3; s.lockRange = FIRST.LB === n ? [2, 2] : [2, hard ? 4 : 3]; }
    if (k === 'LK') { s.links = FIRST.LK === n ? 1 : hard ? 3 : 2; s.linkSpread = FIRST.LK === n ? 0 : 1; }
    if (k === 'D') { s.door = FIRST.D === n ? 4 : 3; if (n > 30) s.doorTail = 0.25; }
    if (k === 'LI') { s.lockRun = 3; s.lockedRows = FIRST.LI === n ? 2 : hard ? 4 : 3; s.rowLockRange = FIRST.LI === n ? [3, 4] : [3, hard ? 8 : 6]; }
    if (k === 'BQ') { s.block = FIRST.BQ === n ? 4 : 3; }
  });
  // the level that introduces an element is very easy: random taps must win it, like levels 1-9
  if (s.unlock) { s.tutorial = true; s.diff = 'easy'; s.minRandom = s.door ? 0.85 : 0.9; s.stick = 0; s.big4 = 0; }
  if (n === 31) s.rowLockRange = [3, 4];   // shorter Locked Item counts: the 18-row Bean belt fills fast
  if (n === 13) {
    // the first level after Locked Box is introduced: longer but gentler, with more Locked Boxes further back in the queues
    // (none in the first two boxes of a queue), 5 colours, no 32-item box and rows close to box order.
    // The search starts at seed 35 (picked for the older lock rules); seed 39 passes now: random taps win about 97 % / 93 %
    Object.assign(s, { items: 432, big3Share: 0, locks: 5, lockFrom: 2, lockDepth: 6, lockPerLane: 2, lockRange: [2, 3], stick: 0, minRandom: 0.9, seed: 35 });
    s.tune = { colors: 5, window: 8 };
  }
  if (n === 17) {
    // Linked Box intro: Q1's front box is linked to the third box of Q2, so 2 sends from Q2 show the link breaking;
    // a second link further back shows it again
    Object.assign(s, { linkAt: [[[0, 0], [1, 2]]], links: 1, linkFrom: 3, linkSpread: 1 });
  }
  if (n === 27) {
    // Locked Item intro: no Linked Boxes (`dropLinks`). The first row in from the left (the colour of queue 1's front box)
    // is locked for 5 sends, so it still shows if other boxes go first: send that box and the rest, and its last items move
    // in. One more locked row comes later. Seed 63 gives that first row the front box's colour, and random taps win at
    // least 92 % in every play mode
    s.dropLinks = true; s.seed = 63;
    Object.assign(s, { lockedRowAt: [['left', 0, 5]], lockedRows: 1, minRandom: 0.8 });   // 80 %: the locked runs hold back more items
  }
  if (n === 12) {
    // Locked Box intro: queue 1's front box is locked for 2 and the third box of queue 2 for 2, so the player sees that only
    // a box at the front counts down
    Object.assign(s, { lockAt: [[0, 0, 2], [1, 2, 2]] });
  }
  if (n === 15) {
    // Lock relay: one queue at a time holds a Locked Box with a high count, so the player works the other two. Queue 3's front
    // box starts locked for 7; queue 1's third box, queue 2's sixth and queue 3's seventh follow, each reaching the front
    // about when the one before opens. `lockRelay` rejects a layout where two or more queues can be locked at once
    Object.assign(s, { lockAt: [[2, 0, 7], [0, 2, 7], [1, 5, 7], [2, 6, 7]], locks: 4, lockRelay: true });
  }
  if (n === 15) intro.push('Third Enter Path.');
  if (n === 20) intro.push('Fourth queue.');
  if (hard) intro.push('Hard level.');
  if (intro.length) s.intro = intro.join(' ');
  S.push(s);
}
// ---- level length: from level 2 on, every level holds more items than the belt, so items are still waiting in the Enter Paths
// once the belt is full. The belts are the game's conveyors (updated 2026-10-29: Rounded square 26 rows = 104 spots, Bean 28, Lens 26, Heart 30, Triangle 20, Oval 22).
// Levels 1-3 are sized to the belt: level 1 fills about 85 % of it, level 2 leaves 1 row waiting, level 3 a few rows per Enter Path.
// From level 4 the item count builds up to the normal amount: TOTAL gives levels 1-10 in items; levels 11-40 hold
// 168 items (176 on Heart) plus EXTRA, the same amounts as before the conveyors changed.
const BELT = { square_19: 26, bean_18: 28, lens_18: 26, heart_21: 30, triangle_12: 20, oval_14: 22 };   // belt rows of each conveyor
const TOTAL = { 1: 64, 2: 80, 3: 96, 4: 128, 5: 136, 6: 160, 7: 192, 8: 208, 9: 224, 10: 352 };
// colours unlock one by one: Red, Blue, Green and Yellow first, then Pink at level 5, Orange at 7, Purple at 10 and Cyan at 12.
// Up to level 12 a level uses every unlocked colour; after that any of the 8 can be mixed in.
const UNLOCKED = n => n < 5 ? 4 : n < 7 ? 5 : n < 10 ? 6 : n < 12 ? 7 : 8;
S.forEach(s => {
  const k = UNLOCKED(s.n);
  // levels 4-10 add colours early (6 on levels 4 and 5, all 8 on levels 6 and 10, 7 on levels 8 and 9), so there is room for
  // layouts that random taps and one-queue taps lose (with 7 colours no level 6 layout beat every one-queue order)
  if (s.n <= 10) { const k2 = s.n === 10 || s.n === 6 ? 8 : s.n >= 8 ? 7 : s.n === 4 || s.n === 5 ? 6 : k; s.palette = [1, 2, 3, 4, 5, 6, 7, 8].slice(0, k2); s.colors = k2; }
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
  // levels 11-20 were made 25 % longer and use bigger boxes (BIG below), so they do not end too fast
  const big = s.n >= 11 && s.n <= 20;
  const items = TOTAL[s.n] || Math.round((s.items || len) * (big ? 1.25 : 1) / 4) * 4;
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
  } else if (big) {
    // levels 11-20: 30 % 24-item, 25 % 32-item and 10 % 40-item boxes (no 40-item box on a level that introduces an element or on levels 13 and 20),
    // the rest 16-item; the box count is set from the rows each tier really takes (4 / 6 / 8 / 10)
    const sh4 = s.tutorial || s.n === 13 || s.n === 20 ? 0 : 0.1;   // levels 13 and 20 have no 40-item box: 13 stays gentle, 20 already adds a fourth queue
    const rows = N => 4 * N + 2 * Math.round(N * 0.3) + 4 * Math.round(N * 0.25) + 6 * Math.round(N * sh4);
    let N = Math.round(units / 6);
    for (let k = 0; k < 30 && Math.abs(units - rows(N)) >= 4; k++) N += units > rows(N) ? 1 : -1;
    Object.assign(s, { boxes: N, big2: Math.round(N * 0.3), big3: Math.round(N * 0.25), big4: Math.round(N * sh4) });
    if (s.n === 11 || s.n === 14) s.minRandom = 0.8;   // random taps won ~90 % of these before the bigger boxes: keep them near that
    s.window = s.tutorial ? 12 : Math.round(s.window * 1.6);
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
    s.window = s.tutorial ? 12 : Math.round(s.window * 1.6);
  }
  if (s.tune) { Object.assign(s, s.tune); delete s.tune; }   // per-level values set after the shared rules above
  // from level 15 (except the levels that introduce an element) the player must watch the belt and send the box whose colour is
  // on it: rows come close to box order, each queue sends its boxes in long runs and more colours are in play, so a box sent
  // at random parks in a slot while its items are still far away. run.js tries these from gentlest to hardest and keeps the first
  // that random taps mostly lose and a belt-watching player wins
  if (s.n >= 15 && !s.tutorial) {
    s.watch = true;
    s.watchTries = [
      { colors: 7, window: 6, stick: 0.9 },
      { colors: 8, window: 6, stick: 0.9 },
      { colors: 8, window: 8, stick: 0.95, colorGap: 4 },
      { colors: 8, window: 4, stick: 0.95, colorGap: 5 }
    ];
    if (s.n === 25) s.maxSeed = 500;   // Block Door with Locked Boxes: the fail-safe often frees random taps, so few seeds pass
  }
});
// Levels with Locked Boxes or Locked Items: the seed (and the index into watchTries) each was built from before a Locked Box
// counted only at the front of its queue and a Locked Item only on the conveyor. run.js tries it first (see `keep`)
// level 18 (Hidden Links) came out too hard: it skips the watch-the-belt rule, so it is checked like levels 11-14
// (the casual player wins 95 %, random taps half the runs) with 6 colours; `maxRandom` keeps it from being too easy
S.forEach(s => { if (s.n === 18) { delete s.watch; delete s.watchTries; s.maxRandom = 0.75; } });
// level 21 is a breather after hard level 20: no Hidden Boxes (FEAT keeps 'H' so the later levels keep their hidden
// patterns), 6 colours and checked like an easy level (random taps win 90 % in every play mode)
S.forEach(s => {
  if (s.n !== 21) return;
  delete s.hiddenPattern; delete s.watch; delete s.watchTries;
  Object.assign(s, { name: 'Clear Skies', diff: 'easy', intro: 'Breather after a hard level: no elements.', colors: 6, minRandom: 0.9 });
});
// level 22 (Block Door intro) has 2 queues; level 23 comes right after it, so it keeps 3 queues, its Hidden Boxes and
// Block Door but is checked like an easy level with 6 colours: random taps win 70 % in every play mode, the casual player and
// the belt watcher 90 %, without the fail-safe (seed 36 is the first that passes)
S.forEach(s => {
  if (s.n === 22) Object.assign(s, { lanes: 2, noFailsafe: true });
  // level 28 follows the Locked Item intro: easy, checked like level 23 but with 5 colours; its locks only go on runs of 2+ same-colour rows.
  // Level 34 has 4 Linked Box pairs instead of 2
  if (s.n === 28) {
    delete s.watch; delete s.watchTries;
    Object.assign(s, { diff: 'easy', colors: 5, minRandom: 0.7, minCasual: 0.9, noFailsafe: true, lockRunOnly: true });
  }
  if (s.n === 34) s.links = 4;
  // level 39: Linked Box and Locked Item instead of Hidden Box and Block Door (FEAT keeps 'H' so level 40 keeps its hidden
  // pattern). Level 40: 5 locked blocks of up to 4 same-colour rows
  if (s.n === 39) {
    delete s.hiddenPattern; delete s.door; s.intro = 'Linked Box with Locked Items.';
    Object.assign(s, { name: 'Cold Links', links: 2, linkSpread: 1, lockRun: 3, lockedRows: 3, rowLockRange: [3, 6] });
  }
  if (s.n === 40) Object.assign(s, { lockRun: 4, lockRunOnly: true, lockRunMin: 3, lockedRows: 5 });
  // level 26 is a breather after hard level 25: Linked Box and Block Door, checked like level 23
  if (s.n === 26) {
    delete s.watch; delete s.watchTries;
    Object.assign(s, { diff: 'easy', colors: 6, minRandom: 0.7, minCasual: 0.9, noFailsafe: true });
  }
  if (s.n !== 23) return;
  delete s.watch; delete s.watchTries;
  Object.assign(s, { diff: 'easy', colors: 6, minRandom: 0.7, minCasual: 0.9, noFailsafe: true, seed: 36 });
});
const KEEP = {
  12: { seed: 2 }, 13: { seed: 39 }, 15: { seed: 13, try: 2 }, 19: { seed: 3, try: 0 }, 20: { seed: 4, try: 0 },
  25: { seed: 295, try: 1 }, 27: { seed: 63 }, 30: { seed: 54, try: 0 },
  31: { seed: 1, try: 0 }, 35: { seed: 26, try: 0 }, 40: { seed: 28, try: 0 }
};
S.forEach(s => { if (KEEP[s.n]) s.keep = KEEP[s.n]; });
// levels 11-20 rebuilt (2026-10-29) for the bigger conveyors and the fly pickup rule (items fly to any matching box):
// every Enter Path patch is 3-6 rows of one colour (`chunk`), and every level that is not an element intro is a
// watch-the-belt level checked like levels 5-10: random taps and tapping one queue (or the queues in turn) win at most
// 50 % (25 % on hard), the casual player (30 % random taps) wins 90 % or more of a medium level and under 85 % of a hard
// one, and the belt watcher wins 85 % (90 % on hard). The old seeds (`keep`) and random-tap bars no longer apply
// Levels 21-40 were rebuilt the same way (2026-10-30); the easy levels there (element intros and the breathers 21, 23, 26
// and 28) keep their easy checks, now with colour patches too
S.forEach(s => {
  if (s.n < 11 || s.n > 40) return;
  s.chunk = [3, 6];
  delete s.keep;
  if (s.tutorial || s.diff === 'easy') return;
  delete s.minRandom; delete s.maxRandom;
  const hard = s.diff === 'hard';
  Object.assign(s, {
    watch: true, noBlind: true, maxSeed: s.n === 25 ? 500 : 300,
    watchBar: hard ? [0.25, 0.9] : [0.5, 0.85], casualBar: hard ? [0, 0.85] : [0.9, 1],
    watchTries: [{ stick: 0.7 }, { stick: 0.8 }, { stick: 0.9 }, { stick: 0.9, window: 6 }, { colors: 7, stick: 0.9, window: 6 }]
  });
  // levels 15 and 19 (Locked Box on the big Heart and Bean belts): with items flying to any box, random taps win most runs of
  // nearly every layout, or the belt fills with colours whose boxes are deep in the queues and even the careful player jams.
  // They keep the user's bar (random and one-queue taps win under 60 %) with a looser casual / watcher bar, from a seed search:
  // level 15 seed 138 (random 25 %, one queue 0 %, casual 60 %, watcher 86 %), level 19 seed 47 with 8 colours (random 51 %,
  // one queue 42 %, casual 99 %)
  if (s.n === 15) Object.assign(s, { watchBar: [0.4, 0.85], casualBar: [0, 0.9], blindMax: 0.4, seed: 138, watchTries: [{ stick: 0.9, window: 6 }] });
  if (s.n === 19) Object.assign(s, { watchBar: [0.55, 0.85], casualBar: [0.85, 1], seed: 47, watchTries: [{ colors: 8, stick: 0.9, window: 6 }] });
  // level 25 (Block Door with Locked Boxes): the fail-safe frees random taps in most layouts; seed 101 has random taps at 10 %
  // but one queue / the queues in turn at 30-34 %, so its blind bars are 35-40 % (still under the user's 60 %)
  if (s.n === 25) Object.assign(s, { blindMax: 0.4, watchBar: [0.35, 0.9], seed: 101, watchTries: [{ stick: 0.8 }] });
});
module.exports = S;
