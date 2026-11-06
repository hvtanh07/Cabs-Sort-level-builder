'use strict';
/* Design of levels 11-40 for design.js / dscan.js (user, 2026-11-06): role, planned stuck points (GDD page
   level-difficulty.html, PLAN) and the element each stuck moment uses.
   Difficulty score = 100 - (casual + watcher) / 2, measured with the RV slots. Windows, from the user's anchors:
   intro ~ level 7, the Medium level right after an intro ~ level 8 (user, 2026-11-06), after-Hard ~ level 8,
   other Medium ~ level 6, Pre-Hard >= level 29, Hard >= level 10. */
const ROLE = {};
[12, 17, 22, 27, 32].forEach(n => { ROLE[n] = 'intro'; });
[13, 18, 23, 28, 33].forEach(n => { ROLE[n] = 'post-intro'; });
[11, 16, 21, 31, 36].forEach(n => { ROLE[n] = 'after'; });
[26, 37, 38].forEach(n => { ROLE[n] = 'medium'; });
[14, 19, 24, 29, 34, 39].forEach(n => { ROLE[n] = 'pre'; });
[15, 20, 25, 30, 35, 40].forEach(n => { ROLE[n] = 'hard'; });
const WIN = {
  intro: { score: [8, 20], random: null, orders: 1, diff: 'easy' },
  'post-intro': { score: [25, 35], random: 0.4, orders: 0, diff: 'medium' },
  after: { score: [25, 35], random: 0.4, orders: 0, diff: 'easy' },
  medium: { score: [40, 55], random: 0.3, orders: 0, diff: 'medium' },
  pre: { score: [50, 65], random: 0.15, orders: 0, diff: 'medium' },
  hard: { score: [72, 90], random: 0.05, orders: 0, diff: 'hard' }
};
const STUCK = { intro: [0.43], 'post-intro': [0.53], after: [0.58], medium: [0.53], pre: [0.33, 0.68], hard: [0.23, 0.43, 0.68] };
const at = (n, i) => (n === 40 ? [0.23, 0.43, 0.68, 0.83] : STUCK[ROLE[n]])[i];
const E = (n, list) => list.map((e, i) => Object.assign({ p: at(n, i) }, e));
const LK = { lead: [2, 3, 4, 5] };
const levels = {
  11: { ev: E(11, [{ t: 'buried' }]), notes: 'After Hard: one buried lone box at about 55%.' },
  // user (2026-11-06): one locked box already at the front of a queue at the start, so the player sees how it opens, and
  // one more locked box 2nd in queue 2, so the player sees that a lock only counts down once its box is at the front
  12: { ev: [{ t: 'locked', lane: [0, 2], depth: 0, turns: [2, 3], lead: [0, 2, 4] }, { t: 'locked', lane: 1, depth: 1, turns: [2, 3], lead: [2, 4, 6] }], stucks: [],
    notes: 'Introduces Locked Box: one locked box is at the front of a queue from the start, a second locked box is 2nd in queue 2 and only counts down once it reaches the front. Each holds the only box of its colour.' },
  // user (2026-11-06): the locked boxes were too deep, so the player met the element only late; now two locked boxes in
  // the first rows (2nd-3rd and 4th-5th in their queues)
  13: { ev: [{ t: 'locked', depth: [1, 2], turns: [2, 3], lead: [3, 6, 9] }, { t: 'locked', depth: [3, 4], turns: [3], lead: [3, 6, 9] }], stucks: [0.15, 0.4],
    notes: 'Locked Box: two colours are each only in one locked box near the top of its queue; send other boxes to open them.' },
  14: { ev: E(14, [{ t: 'hidden', decoy: [0] }, { t: 'hidden', decoy: [0, 1] }]), notes: 'Hidden Box: two colours are only inside hidden boxes.' },
  15: { ev: E(15, [{ t: 'buried' }, { t: 'locked', turns: [2, 3] }, { t: 'buried' }]), notes: 'Hard, three Enter Paths: buried box, locked box, buried box.' },
  16: { ev: E(16, [{ t: 'buried' }]), notes: 'After Hard: one buried lone box at about 55%.' },
  17: { ev: E(17, [{ t: 'linked', pd: [0, 1], depth: [2, 3, 4] }]), notes: 'Introduces Linked Box: the needed colour is linked to an extra box in the next queue.' },
  18: { ev: E(18, [{ t: 'linked', pd: [1, 2], hide: true }]), notes: 'Linked Box: the needed colour is only in one hidden box, linked to an extra box.' },
  19: { ev: E(19, [{ t: 'locked', turns: [3] }, { t: 'locked', turns: [2, 3] }]), notes: 'Pre-Hard: two locked lone boxes.' },
  20: { ev: E(20, [{ t: 'linked', pd: [1, 2] }, { t: 'locked', turns: [3] }, { t: 'buried' }]), notes: 'Hard, four queues: linked, locked, buried.' },
  21: { ev: E(21, [{ t: 'buried' }]), notes: 'After Hard, no elements: one buried lone box.' },
  22: { ev: E(22, [{ t: 'buried' }]), door: [3, 4], notes: 'Introduces Block Door: each Enter Path carries its own colours.' },
  23: { ev: E(23, [{ t: 'hidden', decoy: [0] }]), door: [3, 4], notes: 'Block Door with a colour only in a hidden box.' },
  24: { ev: E(24, [{ t: 'linked', pd: [1, 2] }, { t: 'linked', pd: [1, 2] }]), notes: 'Pre-Hard, four queues: two linked lone boxes.' },
  25: { ev: E(25, [{ t: 'buried' }, { t: 'locked', turns: [2, 3] }, { t: 'buried' }]), door: [3], notes: 'Hard: Block Door with different colours per side, plus a locked lone box.' },
  26: { ev: E(26, [{ t: 'linked', pd: [1, 2] }]), door: [3], notes: 'Linked Box behind switching doors.' },
  27: { ev: E(27, [{ t: 'litem', turns: [3, 4] }]), notes: 'Introduces Locked Item: one colour patch is locked, its 40 box waits.' },
  28: { ev: E(28, [{ t: 'litem', turns: [3, 4], hide: true }]), notes: 'Locked Items of a colour whose box is hidden.' },
  29: { ev: E(29, [{ t: 'buried' }, { t: 'buried' }]), notes: 'Pre-Hard, three Enter Paths, no elements: two buried lone boxes.' },
  30: { ev: E(30, [{ t: 'litem', turns: [4, 5] }, { t: 'locked', turns: [2, 3], hide: true }, { t: 'buried' }]), notes: 'Hard: locked items, a hidden locked box, a buried box.' },
  31: { ev: E(31, [{ t: 'litem', turns: [2, 3] }]), notes: 'After Hard: one locked colour patch.' },
  32: { ev: E(32, [{ t: 'bq' }]), bq: { turns: [3, 4], lanes: [[1, 2], [2, 1], [0, 1]] }, notes: 'Introduces Block Queue: the two blocked queues have different colours.' },
  33: { ev: E(33, [{ t: 'bq' }]), bq: { turns: [3], lanes: [[2, 1], [1, 0], [0, 2]] }, notes: 'Block Queue: get the lone box before its queue is blocked.' },
  34: { ev: E(34, [{ t: 'linked', pd: [1, 2] }, { t: 'linked', pd: [1, 2] }]), notes: 'Pre-Hard, four queues: two linked lone boxes.' },
  35: { ev: E(35, [{ t: 'bq' }, { t: 'locked', turns: [2, 3], hide: true }, { t: 'buried' }]), bq: { turns: [3], lanes: [[2, 3], [1, 2], [0, 1]] }, notes: 'Hard: Block Queue, a hidden locked box, a buried box.' },
  36: { ev: E(36, [{ t: 'buried' }]), notes: 'After Hard, three Enter Paths: one buried lone box.' },
  37: { ev: [{ t: 'hidden', p: 0.5, decoy: [0] }, { t: 'hidden', p: 0.6, decoy: [0, 1] }], door: [3], notes: 'Block Door with two colours that are only in hidden boxes.' },
  38: { ev: E(38, [{ t: 'linked', pd: [1, 2] }]), bq: { turns: [3], lanes: [[3, 2], [2, 1], [0, 1]] }, notes: 'Linked Box with a Block Queue.' },
  39: { ev: E(39, [{ t: 'linked', pd: [1, 2] }, { t: 'litem', turns: [3, 4] }]), notes: 'Pre-Hard: linked lone box, then locked colour patch.' },
  40: { ev: E(40, [{ t: 'bq' }, { t: 'locked', turns: [2, 3], hide: true }, { t: 'litem', turns: [3, 4] }, { t: 'buried' }]), bq: { turns: [3], lanes: [[0, 1], [2, 3], [1, 2]] }, notes: 'Grand Finale: Block Queue, hidden locked box, locked items, buried box.' }
};
// user (2026-11-06): every level with Locked Box, Hidden Box, Locked Item or Linked Box shows at least one of them from the
// start of the level (box near the top of a queue, or locked rows among the first rows)
const EARLY = { 14: 'hidden', 15: 'lock', 17: 'link', 18: 'link', 19: 'lock', 25: 'lock', 26: 'link', 27: 'litem', 28: 'litem',
  31: 'litem', 35: 'lock', 37: 'hidden', 38: 'link', 39: 'litem' };
Object.keys(EARLY).forEach(n => { levels[n].early = [{ t: EARLY[n], turns: EARLY[n] === 'litem' ? [2, 3] : [2, 3] }]; });
// user (2026-11-06): levels with Hidden Boxes hide them in a pattern (every other box, or every even box of each queue),
// like levels 7 and 8, instead of a few single boxes
[14, 18, 23, 28, 30, 35, 37, 40].forEach(n => { levels[n].hidePattern = ['checker', 'checker2', 'even']; if (levels[n].early && levels[n].early[0].t === 'hidden') delete levels[n].early; });
// wider search for the Hard levels that found nothing in the first pass
[15, 20, 25].forEach(n => Object.assign(levels[n], { stick: [0.7, 0.8, 0.9, 0.95], delay: [6, 10, 14, 20], nb: [6, 7, 8] }));
module.exports = { levels, ROLE, target: n => WIN[ROLE[n]], stucks: n => levels[n].stucks || (n === 40 ? [0.23, 0.43, 0.68, 0.83] : STUCK[ROLE[n]]) };
