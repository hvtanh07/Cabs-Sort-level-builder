# Element unlock levels 1–40

The 40 levels from the level list sheet ("Cab 42"). They load into the tool's level list on their own (from `js/levels.js`), and each one is also here as a JSON file.

## How they were checked

Each level was played many times by bots in the tool's play test:

- **Random taps**: sends a random front box whenever a slot is free, with no thought.
- **Careful player**: only sends a box when its colour is on the belt, unless nothing else can move.
- **Casual player**: the careful player, but 3 taps in 10 are random. This is the closest to a real player and the main check for levels 11–14.
- **Belt watcher**: sends the front box whose colour is on the belt, with only 1 tap in 10 random. The main check from level 15.

Every level holds more items than its belt has spots, so once the belt has filled at the start, items are still waiting in the Enter Paths (on Block Door levels they wait behind the shut door). Level 1 leaves 5 rows waiting, and the count builds up from there. The levels use the game's own conveyors (Rounded square 19 rows = 76 spots, Bean 18, Lens 18, Heart 30, Triangle 12).

Every level 1–40 is won by the careful player, with boxes picking at the lowest point and picking anywhere. Levels 1–8 win **every time** with random taps (300 runs each, in every pickup mode, with the belt starting full or empty), and level 9 wins at least 99 % of runs in every mode. Level 10, the first hard level, wins about 8 in 10.

Levels 11–14 are longer, so pure random taps jam more often on them. Each one is checked with the casual player instead: it wins nearly every run, and random taps still win most runs. The levels that introduce an element (12, 17, 22, 27, 32) are checked like levels 1–9: random taps win 90 % or more of runs in every pickup mode.

**From level 15 the player has to watch the belt.** Every level from 15 on, except the element intro levels, is built so that tapping at random loses: random taps win at most about a third of runs (a quarter on hard levels; 200-run figures in the table, mostly 5–35 %), while the belt watcher wins about 9 in 10 (85–100 %) and the careful player wins every level. The rows reach the belt close to box order, each queue sends its boxes in long runs and 7 colours are in play (8 on levels 15, 23 and 25), so a box sent before its colour is on the belt sits in a slot while the belt fills up with items nobody can take. The casual player, with 3 taps in 10 random, now wins about 60–97 %. The last three columns of the table show the bots.

## Design notes

- **Colour unlocks.** Levels 1–4 use Red, Blue, Green and Yellow. Pink joins at level 5, Orange at level 7, Purple at level 10 and Cyan at level 12; up to level 10 a level uses every colour unlocked so far. Levels 11–14 use 6 colours (5 on level 13), a level that introduces an element 5, and from level 15 the other levels use 7 or 8, picked from the ones unlocked; levels 11 and 12 always include the colour they unlock.
- **Level 1 layout.** The Enter Path rows are grouped by box in queue order: the first box's 4 rows of its colour come first, then the second box's, and so on, so the feeder reads exactly like the queue.
- **Hidden Box patterns.** Level 7 is staggered: queue 1 hides every even box and queue 2 every odd box after the front one. Level 8 hides every even box in every queue, so the queues show rows of Hidden Boxes.
- **One colour per row.** Every Enter Path row holds 4 items of one colour, so each box's items arrive as whole rows (a 16-item box = 4 rows, a 24-item box = 6 rows). A box's `size` sets what it holds: size 1 = 16, 2 = 24, 3 = 32, 4 = 40 items.

- **Difficulty.** In the play test a level is only lost when every slot holds a box that cannot fill. The hard levels are harder through more boxes, colours, items beyond the belt and stacked elements. From level 15 random tapping loses most runs (see above). It's worth playing the levels from 15 on by hand to judge them.

- **Levels 1–10** follow your brief one by one. Each one adds one thing. Level 1 has 6 boxes (96 items on the 76-spot belt). Level 2 has 8 boxes, 4 per queue. Level 3 has 6 boxes and leaves 2 to 3 rows per Enter Path. Levels 4, 5, 6 and 8 have 5 boxes in every queue (10, 10, 15 and 15 boxes). Level 9 has 6 boxes in each of its 3 queues, with one 24-item box per queue (18 boxes, 312 items); level 10 has 21 boxes, leaves about 36 rows per Enter Path and hides every box behind the front row.
- **Queue counts for levels 2–4.** Your notes say level 2 has 2 queues, but level 4 "adds another queue" and level 6 brings the total to 3. I read this as level 2 = 2 queues, level 3 = back to 1 queue (so the swapped boxes are easy to see), level 4 = 2 queues, level 6 = 3 queues.
- **Level 3.** The first and last boxes in the queue swapped places. The last box's items enter first, so they ride the belt until that box comes up.
- **Level 5** uses the Triangle 12 conveyor (48 spots) with 152 items. Its first 24-item box has a colour no other box uses: most of its items are on the belt at the start and its last row pours in later.
- **Level length from 11 on.** Levels 11–40 carry on from level 9 (312 items) and level 10 (368). A medium level starts at 368 items at level 11 and grows by about 4 items a level to about 500 by level 38. Hard levels are about 25 % longer than the medium levels around them (456 items at level 15, 624 at level 40). Block Door levels are 10 % shorter (20 % from level 31), because the shut door holds back half the rows and a long door level jams easily.
- **Element intro levels are very easy.** Levels 12 (Locked Box), 17 (Linked Box), 22 (Block Door), 27 (Locked Item) and 32 (Block Queue) stay at level 9's length (336 items, 18 boxes), use 5 colours, have no 40-item box, keep the rows close to box order and use only the smallest element counts. They are marked easy. Level 17 links the front box of queue 1 to the third box of queue 2, so the link breaks after 2 sends from queue 2, then shows a second link further back. Level 27 has no Linked Boxes: the first row in from the left is the colour of queue 1's front box and is locked for 5 sends, so the lock still shows if other boxes go first; once the count runs out, its items move into that box. One more locked row comes later.
- **Levels 11–40** follow the sheet's elements exactly. 3rd Enter Path from level 15, 4th queue from level 20, both mainly on hard levels. 32-item boxes start at level 11 and 40-item boxes at level 26.
- **Locked Box and Locked Item countdown.** A Locked Box counts down 1 for each box sent only while it is at the front of its queue (a box that just moved up starts at the next send), and a Locked Item only once it is on the conveyor. Since the player picks the send order, they can always empty the other queues first, so two rules keep a level from jamming for good: when no queue has a front box that can be sent, the front Locked Boxes open (like Block Queue), and once every box is sent, the Locked Items open. Locked Box counts are short (2 to 3, up to 4 on hard levels). A Locked Box is never a front box at the start (except level 12), never next to another Locked Box in its queue and never at the same depth as one in a neighbouring queue. The tool and the generator still check every order of sends for a jam (Linked Boxes can still cause one). The levels with Locked Boxes or Locked Items were rebuilt for these rules: 12, 13, 27, 28, 30 and 31 keep their boxes and rows with new locks; 15, 19, 20, 25, 26, 35 and 40 got new layouts. Level 12 locks queue 1's front box for 2 and the third box of queue 2 for 2, so the player sees that only a front box counts down. Level 15 is a lock relay: queue 3's front box starts locked for 7, and queue 1's third box, queue 2's sixth and queue 3's seventh (each 7) reach the front about when the one before opens, so the player works two queues at a time; no order of sends can lock two or more queues at once.
- **Block Queue** uses two neighbouring queues that take turns being blocked (`blockQueue: { turns, lanes: [a, b] }`): queue a starts blocked, and after `turns` boxes sent from the other queues the block switches to queue b, then back. The other queues are never blocked. A blocked queue also opens while no other queue can send a box (all empty, locked or waiting for a linked partner), since only sends from other queues count it down. On a level with Linked Boxes, neither queue of the pair holds one.
- **Block Door levels** use 2 Enter Paths. The items queued behind each door are the ones needed while that door is open.
- **Booster unlocks** follow the sheet (levels 3, 6, 9). They are not saved in the level files. The GDD says Hand 5, Shuffle 8, Magnet 10.
- **Conveyors.** The game's own conveyor configs: Rounded square 19, Bean 18 and Lens 18 for most levels, Heart 30 (`heart_21`) for hard levels 15 and up, Triangle 12 for level 5. Level 39 moved from the square to Bean, and level 31 has shorter Locked Item counts.
- Every level file starts with `"$schema": "../../../../../docs/design/level.schema.json"`. `links` and `slotLocks` are left out when a level has none. Each level's `meta` has `name`, `difficulty` and `notes` (what the level teaches, shown in the "What it adds" column below).

## Levels

| # | Name | Difficulty | What it adds | Queues | Enter Paths | Colours | Boxes (16 / 24 / 32 / 40 items) | Items / belt spots | Conveyor | Elements | Random taps win (lowest point / anywhere) | Casual player wins | Belt watcher wins |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only. | 1 | Middle | 4 | 6 (6 / 0 / 0 / 0) | 96 / 76 | square_19 | none | 100% / 100% | 100% | 100% |
| 2 | Two Queues | easy | A second queue: pick which front box to send. | 2 | Middle | 4 | 8 (8 / 0 / 0 / 0) | 128 / 76 | square_19 | none | 100% / 100% | 100% | 100% |
| 3 | Round and Round | easy · 1st booster | Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up. | 1 | Left, Right | 4 | 6 (6 / 0 / 0 / 0) | 96 / 76 | square_19 | none | 100% / 100% | 100% | 100% |
| 4 | Side by Side | easy | Two queues with two Enter Paths. | 2 | Left, Right | 4 | 10 (10 / 0 / 0 / 0) | 160 / 76 | square_19 | none | 100% / 100% | 100% | 100% |
| 5 | Big Box | easy | First 24-item box. The belt is full, so its last items pour in from the Enter Path later. | 2 | Left, Right | 5 | 10 (7 / 3 / 0 / 0) | 184 / 48 | triangle_12 | none | 100% / 100% | 100% | 100% |
| 6 | Three Queues | easy · 2nd booster | A third queue, with a few 24-item boxes. | 3 | Left, Right | 5 | 15 (12 / 3 / 0 / 0) | 264 / 76 | square_19 | none | 100% / 100% | 100% | 100% |
| 7 | Hidden Box | easy | Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues. | 2 | Left, Right | 6 | 12 (10 / 2 / 0 / 0) | 208 / 76 | square_19 | Hidden ×5 (16/24 items) | 100% / 100% | 100% | 100% |
| 8 | Hidden Big Box | easy | Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues. | 3 | Left, Right | 6 | 15 (12 / 3 / 0 / 0) | 264 / 76 | square_19 | Hidden ×6 (16/24 items) | 100% / 100% | 100% | 100% |
| 9 | Long Haul | easy · 3rd booster | No Hidden Box, but a longer level. Three queues, two Enter Paths. | 3 | Left, Right | 6 | 18 (15 / 3 / 0 / 0) | 312 / 76 | square_19 | none | 100% / 99% | 100% | 100% |
| 10 | First Challenge | hard | First hard level: every box behind the front row is hidden. Longer than level 9. | 3 | Left, Right | 7 | 21 (17 / 4 / 0 / 0) | 368 / 76 | square_19 | Hidden ×18 (16/24 items) | 89% / 79% | 93% | 89% |
| 11 | Triple Stack | medium | First 32-item box. | 3 | Left, Right | 6 | 19 (13 / 4 / 2 / 0) | 368 / 76 | square_19 | none | 94% / 83% | 100% | 100% |
| 12 | Locked Box | easy | Introduces Locked Box. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 72 | bean_18 | Locked Box ×2 (one at the front) | 99% / 93% | 100% | 100% |
| 13 | Key Count | medium |  | 3 | Left, Right | 5 | 25 (20 / 5 / 0 / 0) | 440 / 72 | lens_18 | Locked Box ×5 (from the 3rd box of a queue back) | 96% / 91% | 100% | 100% |
| 14 | Blind Picks | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 20 (15 / 4 / 1 / 0) | 368 / 76 | square_19 | Hidden ×9 (16/24 items) | 87% / 92% | 100% | 100% |
| 15 | Three Gates | hard | Third Enter Path. Hard level. | 3 | Left, Middle, Right | 8 | 25 (19 / 5 / 1 / 0) | 456 / 120 | heart_21 | Locked Box ×4 (a relay, each locked 7) | 24% / 23% | 74% | 91% |
| 16 | Heavy Load | medium |  | 3 | Left, Right | 7 | 20 (15 / 4 / 1 / 0) | 368 / 72 | bean_18 | none | 54% / 32% | 97% | 100% |
| 17 | Linked Box | easy | Introduces Linked Box. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Linked ×2 (one at the front) | 100% / 100% | 100% | 100% |
| 18 | Hidden Links | medium | Every even box is hidden, like level 8. | 3 | Left, Middle, Right | 6 | 21 (16 / 4 / 1 / 0) | 384 / 72 | lens_18 | Hidden ×9 (16/24/32 items), Linked ×2 | 78% / 49% | 100% | 100% |
| 19 | Patience | medium |  | 3 | Left, Right | 7 | 21 (16 / 4 / 1 / 0) | 384 / 72 | bean_18 | Locked Box ×3 | 19% / 21% | 74% | 91% |
| 20 | Four Queues | hard | Fourth queue. Hard level. | 4 | Left, Middle, Right | 7 | 26 (19 / 5 / 2 / 0) | 488 / 76 | square_19 | Locked Box ×4, Linked ×3 | 32% / 20% | 83% | 95% |
| 21 | Clear Skies | easy | Breather after a hard level: no elements. | 3 | Left, Right | 6 | 21 (15 / 4 / 2 / 0) | 400 / 72 | lens_18 | none | 96% / 86% | 100% | 100% |
| 22 | Block Door | easy | Introduces Block Door. | 2 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Block Door (4) | 96% / 90% | 100% | 100% |
| 23 | Behind the Door | easy | Every even box is hidden, like level 8. | 3 | Left, Right | 6 | 19 (13 / 4 / 2 / 0) | 368 / 72 | bean_18 | Hidden ×9 (16/24/32 items), Block Door (3) | 95% / 80% | 100% | 100% |
| 24 | Chain Gang | medium |  | 3 | Left, Middle, Right | 7 | 22 (16 / 4 / 2 / 0) | 416 / 72 | lens_18 | Linked ×2 | 26% / 10% | 85% | 100% |
| 25 | Door Lock | hard | Hard level. | 3 | Left, Right | 8 | 25 (18 / 5 / 2 / 0) | 472 / 120 | heart_21 | Locked Box ×4, Block Door (3) | 39% / 14% | 72% | 94% |
| 26 | Swing Doors | medium | First 40-item box. | 3 | Left, Right | 8 | 20 (13 / 4 / 2 / 1) | 408 / 76 | square_19 | Locked Box ×3, Block Door (3) | 13% / 9% | 76% | 95% |
| 27 | Locked Item | easy | Introduces Locked Item. | 4 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 72 | bean_18 | Locked Item rows ×2 (one at the start) | 98% / 89% | 100% | 100% |
| 28 | Secret Cargo | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 7 | 22 (15 / 4 / 2 / 1) | 440 / 72 | lens_18 | Hidden ×10 (16/24/32 items), Locked Item rows ×3 | 33% / 10% | 77% | 96% |
| 29 | Rush Hour | medium |  | 3 | Left, Middle, Right | 7 | 23 (15 / 5 / 2 / 1) | 464 / 76 | square_19 | none | 28% / 24% | 88% | 100% |
| 30 | Deep Freeze | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 28 (18 / 6 / 2 / 2) | 576 / 120 | heart_21 | Hidden ×12 (16/24/40 items), Locked Box ×4, Locked Item rows ×4 | 24% / 21% | 94% | 97% |
| 31 | Cold Storage | medium |  | 4 | Left, Right | 7 | 23 (15 / 5 / 2 / 1) | 464 / 72 | bean_18 | Locked Item rows ×3 | 29% / 28% | 80% | 95% |
| 32 | Block Queue | easy | Introduces Block Queue. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Block Queue (4) | 100% / 99% | 100% | 100% |
| 33 | Detour | medium |  | 3 | Left, Middle, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 72 | lens_18 | Block Queue (3) | 17% / 16% | 85% | 99% |
| 34 | Tangled | medium |  | 4 | Left, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 72 | bean_18 | Linked ×2 | 23% / 14% | 81% | 92% |
| 35 | Gridlock | hard | Hidden Boxes in a staggered pattern, like level 7. Hard level. | 4 | Left, Middle, Right | 7 | 30 (20 / 6 / 2 / 2) | 608 / 120 | heart_21 | Hidden ×13 (16/24/32/40 items), Locked Box ×4, Block Queue (3) | 19% / 11% | 80% | 92% |
| 36 | Long Belt | medium |  | 3 | Left, Middle, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 76 | square_19 | none | 18% / 14% | 79% | 91% |
| 37 | Night Shift | medium | Every even box is hidden, like level 8. | 3 | Left, Right | 7 | 19 (12 / 4 / 2 / 1) | 392 / 72 | lens_18 | Hidden ×9 (16/24/32/40 items), Block Door (3) | 34% / 11% | 65% | 90% |
| 38 | Roadblock | medium |  | 4 | Left, Middle, Right | 7 | 25 (17 / 5 / 2 / 1) | 496 / 72 | bean_18 | Linked ×2, Block Queue (3) | 10% / 4% | 65% | 84% |
| 39 | Last Door | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 7 | 20 (13 / 4 / 2 / 1) | 408 / 72 | bean_18 | Hidden ×9 (16/24/32 items), Block Door (3) | 28% / 12% | 68% | 87% |
| 40 | Grand Finale | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 31 (21 / 6 / 2 / 2) | 624 / 120 | heart_21 | Hidden ×15 (16/24/32/40 items), Locked Box ×4, Locked Item rows ×4, Block Queue (3) | 14% / 3% | 68% | 87% |
