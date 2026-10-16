# Element unlock levels 1–40

The 40 levels from the level list sheet ("Cab 42"). They load into the tool's level list on their own (from `js/levels.js`), and each one is also here as a JSON file.

## How they were checked

Each level was played many times by two bots in the tool's play test:

- **Random taps**: sends a random front box whenever a slot is free, with no thought.
- **Careful player**: only sends a box when its colour is on the belt, unless nothing else can move.
- **Casual player**: the careful player, but 3 taps in 10 are random. This is the closest to a real player and the main check for levels 11–40.

Every level holds more items than its belt has spots, so once the belt has filled at the start, items are still waiting in the Enter Paths (on Block Door levels they wait behind the shut door). Level 1 leaves 5 rows waiting, and the count builds up from there. The levels use the game's own conveyors (Rounded square 19 rows = 76 spots, Bean 18, Lens 18, Heart 30, Triangle 12).

Every level 1–40 is won by the careful player, with boxes picking at the lowest point and picking anywhere. Levels 1–8 win **every time** with random taps (300 runs each, in every pickup mode, with the belt starting full or empty), and level 9 wins at least 99 % of runs in every mode. Level 10, the first hard level, wins about 8 in 10.

Levels 11–40 are longer, so pure random taps jam more often on them. Each one is checked with the casual player instead: it wins 95 % or more of every medium level except the two Block Door levels with Hidden Boxes (37 and 39, about 70–80 %), and 85 % or more of every hard level. Random taps still win at least half the runs on medium levels without a Block Door, and about a third or more on the door levels. The levels that introduce an element are checked like levels 1–9: random taps win 90 % or more of runs in every pickup mode. The last two columns of the table show both bots.

## Design notes

- **Colour unlocks.** Levels 1–4 use Red, Blue, Green and Yellow. Pink joins at level 5, Orange at level 7, Purple at level 10 and Cyan at level 12; up to level 10 a level uses every colour unlocked so far. From level 11 a level uses 6 colours (7 on hard levels, 5 on a level that introduces an element), picked from the ones unlocked; levels 11 and 12 always include the colour they unlock. With all 8 colours, the longer levels jammed in most runs.
- **Level 1 layout.** The Enter Path rows are grouped by box in queue order: the first box's 4 rows of its colour come first, then the second box's, and so on, so the feeder reads exactly like the queue.
- **Hidden Box patterns.** Level 7 is staggered: queue 1 hides every even box and queue 2 every odd box after the front one. Level 8 hides every even box in every queue, so the queues show rows of Hidden Boxes.
- **One colour per row.** Every Enter Path row holds 4 items of one colour, so each box's items arrive as whole rows (a 16-item box = 4 rows, a 24-item box = 6 rows). A box's `size` sets what it holds: size 1 = 16, 2 = 24, 3 = 32, 4 = 40 items.

- **Difficulty.** In the play test a level is only lost when every slot holds a box that cannot fill. The hard levels are harder through more boxes, colours, items beyond the belt and stacked elements. The Block Door levels with Hidden Boxes (37 and 39) are the toughest medium levels: the casual player wins about 3 to 4 in 5. It's worth playing the hard levels by hand to judge them.

- **Levels 1–10** follow your brief one by one. Each one adds one thing. Level 1 has 6 boxes (96 items on the 76-spot belt). Level 2 has 8 boxes, 4 per queue. Level 3 has 6 boxes and leaves 2 to 3 rows per Enter Path. Levels 4, 5, 6 and 8 have 5 boxes in every queue (10, 10, 15 and 15 boxes). Level 9 has 6 boxes in each of its 3 queues, with one 24-item box per queue (18 boxes, 312 items); level 10 has 21 boxes, leaves about 36 rows per Enter Path and hides every box behind the front row.
- **Queue counts for levels 2–4.** Your notes say level 2 has 2 queues, but level 4 "adds another queue" and level 6 brings the total to 3. I read this as level 2 = 2 queues, level 3 = back to 1 queue (so the swapped boxes are easy to see), level 4 = 2 queues, level 6 = 3 queues.
- **Level 3.** The first and last boxes in the queue swapped places. The last box's items enter first, so they ride the belt until that box comes up.
- **Level 5** uses the Triangle 12 conveyor (48 spots) with 152 items. Its first 24-item box has a colour no other box uses: most of its items are on the belt at the start and its last row pours in later.
- **Level length from 11 on.** Levels 11–40 carry on from level 9 (312 items) and level 10 (368). A medium level starts at 368 items at level 11 and grows by about 4 items a level to about 500 by level 38. Hard levels are about 25 % longer than the medium levels around them (456 items at level 15, 624 at level 40). Block Door levels are 10 % shorter (20 % from level 31), because the shut door holds back half the rows and a long door level jams easily.
- **Element intro levels are very easy.** Levels 12 (Locked Box), 17 (Linked Box), 22 (Block Door), 27 (Locked Item) and 32 (Block Queue) stay at level 9's length (336 items, 18 boxes), use 5 colours, have no 40-item box, keep the rows close to box order and use only the smallest element counts. They are marked easy.
- **Levels 11–40** follow the sheet's elements exactly. 3rd Enter Path from level 15, 4th queue from level 20, both mainly on hard levels. 32-item boxes start at level 11 and 40-item boxes at level 26.
- **Block Door levels** use 2 Enter Paths. The items queued behind each door are the ones needed while that door is open.
- **Booster unlocks** follow the sheet (levels 3, 6, 9). They are not saved in the level files. The GDD says Hand 5, Shuffle 8, Magnet 10.
- **Conveyors.** The game's own conveyor configs: Rounded square 19, Bean 18 and Lens 18 for most levels, Heart 30 (`heart_21`) for hard levels 15 and up, Triangle 12 for level 5. Level 39 moved from the square to Bean, and level 31 has shorter Locked Item counts.
- Every level file starts with `"$schema": "../../../../../docs/design/level.schema.json"`. `links` and `slotLocks` are left out when a level has none. Each level's `meta` has `name`, `difficulty` and `notes` (what the level teaches, shown in the "What it adds" column below).

## Levels

| # | Name | Difficulty | What it adds | Queues | Enter Paths | Colours | Boxes (16 / 24 / 32 / 40 items) | Items / belt spots | Conveyor | Elements | Random taps win (lowest point / anywhere) | Casual player wins |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only. | 1 | Middle | 4 | 6 (6 / 0 / 0 / 0) | 96 / 76 | square_19 | none | 100% / 100% | 100% |
| 2 | Two Queues | easy | A second queue: pick which front box to send. | 2 | Middle | 4 | 8 (8 / 0 / 0 / 0) | 128 / 76 | square_19 | none | 100% / 100% | 100% |
| 3 | Round and Round | easy · 1st booster | Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up. | 1 | Left, Right | 4 | 6 (6 / 0 / 0 / 0) | 96 / 76 | square_19 | none | 100% / 100% | 100% |
| 4 | Side by Side | easy | Two queues with two Enter Paths. | 2 | Left, Right | 4 | 10 (10 / 0 / 0 / 0) | 160 / 76 | square_19 | none | 100% / 100% | 100% |
| 5 | Big Box | easy | First 24-item box. The belt is full, so its last items pour in from the Enter Path later. | 2 | Left, Right | 5 | 10 (7 / 3 / 0 / 0) | 184 / 48 | triangle_12 | none | 100% / 100% | 100% |
| 6 | Three Queues | easy · 2nd booster | A third queue, with a few 24-item boxes. | 3 | Left, Right | 5 | 15 (12 / 3 / 0 / 0) | 264 / 76 | square_19 | none | 100% / 100% | 100% |
| 7 | Hidden Box | easy | Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues. | 2 | Left, Right | 6 | 12 (10 / 2 / 0 / 0) | 208 / 76 | square_19 | Hidden ×5 (16/24 items) | 100% / 100% | 100% |
| 8 | Hidden Big Box | easy | Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues. | 3 | Left, Right | 6 | 15 (12 / 3 / 0 / 0) | 264 / 76 | square_19 | Hidden ×6 (16/24 items) | 100% / 100% | 100% |
| 9 | Long Haul | easy · 3rd booster | No Hidden Box, but a longer level. Three queues, two Enter Paths. | 3 | Left, Right | 6 | 18 (15 / 3 / 0 / 0) | 312 / 76 | square_19 | none | 100% / 99% | 100% |
| 10 | First Challenge | hard | First hard level: every box behind the front row is hidden. Longer than level 9. | 3 | Left, Right | 7 | 21 (17 / 4 / 0 / 0) | 368 / 76 | square_19 | Hidden ×18 (16/24 items) | 89% / 79% | 93% |
| 11 | Triple Stack | medium | First 32-item box. | 3 | Left, Right | 6 | 19 (13 / 4 / 2 / 0) | 368 / 76 | square_19 | none | 94% / 83% | 100% |
| 12 | Locked Box | easy | Introduces Locked Box. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 72 | bean_18 | Locked Box ×2 | 99% / 94% | 100% |
| 13 | Key Count | medium |  | 3 | Left, Right | 5 | 25 (20 / 5 / 0 / 0) | 440 / 72 | lens_18 | Locked Box ×5 (from the 4th box of a queue back) | 97% / 96% | 100% |
| 14 | Blind Picks | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 20 (15 / 4 / 1 / 0) | 368 / 76 | square_19 | Hidden ×9 (16/24 items) | 87% / 92% | 100% |
| 15 | Three Gates | hard | Third Enter Path. Hard level. | 3 | Left, Middle, Right | 7 | 25 (19 / 5 / 1 / 0) | 456 / 120 | heart_21 | Locked Box ×4 | 90% / 98% | 93% |
| 16 | Heavy Load | medium |  | 3 | Left, Right | 6 | 20 (15 / 4 / 1 / 0) | 368 / 72 | bean_18 | none | 83% / 70% | 98% |
| 17 | Linked Box | easy | Introduces Linked Box. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Linked ×1 | 100% / 99% | 100% |
| 18 | Hidden Links | medium | Every even box is hidden, like level 8. | 3 | Left, Middle, Right | 6 | 21 (16 / 4 / 1 / 0) | 384 / 72 | lens_18 | Hidden ×9 (16 items), Linked ×2 | 95% / 93% | 99% |
| 19 | Patience | medium |  | 3 | Left, Right | 6 | 21 (16 / 4 / 1 / 0) | 384 / 72 | bean_18 | Locked Box ×3 | 94% / 66% | 98% |
| 20 | Four Queues | hard | Fourth queue. Hard level. | 4 | Left, Middle, Right | 7 | 26 (19 / 5 / 2 / 0) | 488 / 76 | square_19 | Locked Box ×4, Linked ×3 | 76% / 69% | 96% |
| 21 | Fog | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 21 (15 / 4 / 2 / 0) | 400 / 72 | lens_18 | Hidden ×9 (16/24/32 items) | 90% / 81% | 99% |
| 22 | Block Door | easy | Introduces Block Door. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Block Door (4) | 99% / 90% | 100% |
| 23 | Behind the Door | medium | Every even box is hidden, like level 8. | 3 | Left, Right | 6 | 19 (13 / 4 / 2 / 0) | 368 / 72 | bean_18 | Hidden ×9 (16/24/32 items), Block Door (3) | 66% / 36% | 95% |
| 24 | Chain Gang | medium |  | 3 | Left, Middle, Right | 6 | 22 (16 / 4 / 2 / 0) | 416 / 72 | lens_18 | Linked ×2 | 76% / 77% | 98% |
| 25 | Door Lock | hard | Hard level. | 3 | Left, Right | 7 | 25 (18 / 5 / 2 / 0) | 472 / 120 | heart_21 | Locked Box ×4, Block Door (3) | 88% / 50% | 88% |
| 26 | Swing Doors | medium | First 40-item box. | 3 | Left, Right | 6 | 20 (13 / 4 / 2 / 1) | 408 / 76 | square_19 | Locked Box ×3, Block Door (3) | 88% / 83% | 100% |
| 27 | Locked Item | easy | Introduces Locked Item. | 4 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 72 | bean_18 | Linked ×2, Locked Item rows ×2 | 97% / 91% | 100% |
| 28 | Secret Cargo | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 22 (15 / 4 / 2 / 1) | 440 / 72 | lens_18 | Hidden ×10 (16/24/32 items), Locked Item rows ×3 | 71% / 65% | 98% |
| 29 | Rush Hour | medium |  | 3 | Left, Middle, Right | 6 | 23 (15 / 5 / 2 / 1) | 464 / 76 | square_19 | none | 76% / 70% | 98% |
| 30 | Deep Freeze | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 28 (18 / 6 / 2 / 2) | 576 / 120 | heart_21 | Hidden ×12 (16/24/32/40 items), Locked Box ×4, Locked Item rows ×4 | 73% / 86% | 98% |
| 31 | Cold Storage | medium |  | 4 | Left, Right | 6 | 23 (15 / 5 / 2 / 1) | 464 / 72 | bean_18 | Locked Item rows ×3 | 62% / 60% | 98% |
| 32 | Block Queue | easy | Introduces Block Queue. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 76 | square_19 | Block Queue (4) | 100% / 96% | 100% |
| 33 | Detour | medium |  | 3 | Left, Middle, Right | 6 | 24 (16 / 5 / 2 / 1) | 480 / 72 | lens_18 | Block Queue (3) | 63% / 60% | 95% |
| 34 | Tangled | medium |  | 4 | Left, Right | 6 | 24 (16 / 5 / 2 / 1) | 480 / 72 | bean_18 | Linked ×2 | 72% / 52% | 97% |
| 35 | Gridlock | hard | Hidden Boxes in a staggered pattern, like level 7. Hard level. | 4 | Left, Middle, Right | 7 | 30 (20 / 6 / 2 / 2) | 608 / 120 | heart_21 | Hidden ×13 (16/24/32/40 items), Locked Box ×4, Block Queue (3) | 94% / 87% | 100% |
| 36 | Long Belt | medium |  | 3 | Left, Middle, Right | 6 | 24 (16 / 5 / 2 / 1) | 480 / 76 | square_19 | none | 86% / 76% | 100% |
| 37 | Night Shift | medium | Every even box is hidden, like level 8. | 3 | Left, Right | 6 | 19 (12 / 4 / 2 / 1) | 392 / 72 | lens_18 | Hidden ×9 (16/24 items), Block Door (3) | 50% / 51% | 70% |
| 38 | Roadblock | medium |  | 4 | Left, Middle, Right | 6 | 25 (17 / 5 / 2 / 1) | 496 / 72 | bean_18 | Linked ×2, Block Queue (3) | 86% / 72% | 97% |
| 39 | Last Door | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 20 (13 / 4 / 2 / 1) | 408 / 72 | bean_18 | Hidden ×9 (16 items), Block Door (3) | 68% / 54% | 79% |
| 40 | Grand Finale | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 31 (21 / 6 / 2 / 2) | 624 / 120 | heart_21 | Hidden ×15 (16/24/40 items), Locked Box ×4, Locked Item rows ×4, Block Queue (3) | 74% / 50% | 97% |
