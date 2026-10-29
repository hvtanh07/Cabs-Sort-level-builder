# Element unlock levels 1–40

The 40 levels from the level list sheet ("Cab 42"). They load into the tool's level list on their own (from `js/levels.js`), and each one is also here as a JSON file.

## How they were checked

Each level was played many times by bots in the tool's play test:

- **Random taps**: sends a random front box whenever a slot is free, with no thought.
- **Careful player**: only sends a box when its colour is on the belt, unless nothing else can move.
- **Casual player**: the careful player, but 3 taps in 10 are random. This is the closest to a real player and the main check for levels 11–14.
- **Belt watcher**: sends the front box whose colour is on the belt, with only 1 tap in 10 random. The main check from level 15.

Every level holds more items than its belt has spots, so once the belt has filled at the start, items are still waiting in the Enter Paths (on Block Door levels they wait behind the shut door). Level 1 leaves 35 rows waiting, and the count builds up from there. The levels use the game's own conveyors, updated on 2026-10-29 (ids unchanged): Rounded square `square_19` 26 rows = 104 spots, Bean `bean_18` 28 rows = 112, Lens `lens_18` 26 rows = 104, Heart `heart_21` 30 rows = 120.

Every level 1–40 is won by the careful player, with boxes picking at the lowest point and picking anywhere. Levels 1–4 win **every time** with random taps (300 runs each, in every pickup mode, with the belt starting full or empty). Level 7, the Hidden Box intro, wins 95 % or more with random taps in every mode. Levels 5 and 6 are the first where the player has to read the belt: random taps win 18–44 % of runs, tapping one queue until it is empty about 1 run in 7 on level 5 and never on level 6 (in any order of the queues), the casual player 92 % / 69 % and the belt watcher 96–100 %. The **Bot ladder** at the end of this page shows every level against seven bots, from blind taps to careful play. Medium levels 8 and 9 keep random taps and tapping one queue until it is empty under 60 % (random 28–41 %, one queue 33 %) while the casual player wins 93–95 %. Level 10, the first hard level, lets random taps win about 1 run in 8, neither blind bot ever wins, and the belt watcher wins 91 %.

Levels 11–14 are longer, so pure random taps jam more often on them. Each one is checked with the casual player instead: it wins nearly every run, and random taps still win most runs. The levels that introduce an element (12, 17, 22, 27, 32) are checked like levels 1–9: random taps win 90 % or more of runs in every pickup mode.

**From level 15 (and on level 10) the player has to watch the belt.** Every level from 15 on, except the element intro levels, is built so that tapping at random loses: random taps win at most about a third of runs (a quarter on hard levels; 200-run figures in the table, mostly 5–35 %), while the belt watcher wins about 9 in 10 (85–100 %) and the careful player wins every level. The rows reach the belt close to box order, each queue sends its boxes in long runs and 7 colours are in play (8 on levels 15, 23 and 25), so a box sent before its colour is on the belt sits in a slot while the belt fills up with items nobody can take. The casual player, with 3 taps in 10 random, now wins about 60–97 %. The last three columns of the table show the bots.

## Design notes

- **Colour unlocks.** Level 1 uses Red, Yellow and Blue; levels 2 and 3 use Red, Blue, Green and Yellow. Pink and Orange join at level 4, Purple and Cyan at level 6; levels 4, 5 and 7 use 6 colours, levels 8 and 9 use 7 and levels 6 and 10 all 8, so there is room for layouts that random taps lose. Levels 11–14 use 6 colours (5 on level 13; level 11 always includes Purple and level 12 Cyan), a level that introduces an element 5, and from level 15 the other levels use 7 or 8, picked from the ones unlocked.
- **Level 1 layout.** Level 1 uses only size 3 and size 4 boxes (32 and 40 items), taking turns: 3, 4, 3, 4, 3, 4. The box colours are Red, Red, Yellow, Yellow, Blue, Blue, so each colour fills a 32-item box and then a 40-item box. The Enter Path rows are grouped by box, each group exactly as many items as its box holds (8 rows for a 32-item box, 10 rows for a 40-item box), but the groups are staggered instead of in queue order: Red 32 enters first, then Yellow 32, Red 40, Blue 32, Yellow 40 and Blue 40. Levels 2 and 3 are built the same way (see below). 32-item boxes next show up at level 11 and 40-item boxes at level 26.
- **Levels 2 and 3 layout.** Both have 2 queues of 6 boxes (12 boxes, 432 items), use only 32- and 40-item boxes, and each queue alternates the two sizes; each of the 4 colours has 3 boxes. Each box's rows are grouped together and the groups are mixed out of queue order (`rowOrder` in specs.js). Level 2 has one middle Enter Path. Level 3 has 2 Enter Paths; whole groups take turns between the paths.
- **Slots on levels 1–3.** 5 slots and no RV slot (`slots: 5`, `extraSlots: 0`). The other levels keep 4 slots and 2 RV slots.
- **Hidden Box patterns.** Level 7 is staggered: queue 1 hides every even box and queue 2 every odd box after the front one, so the Hidden Boxes form a checkerboard. Level 8 hides every even box in every queue, so the queues show rows of Hidden Boxes.
- **Level 9** has 3 queues of 7 boxes and no Hidden Boxes. The colours make a repeating chevron: queues 1 and 3 match box for box (Red, Blue, Green, Yellow, Pink, Orange, Purple) and queue 2 runs one colour ahead; the sizes repeat 16 / 24 / 32 / 40 down queues 1 and 3 and 40 / 32 / 24 / 16 down queue 2. It is medium: the rows come in colour patches and each queue sends its boxes in runs (`atPos` keeps the chevron in place).
- **Level 10** hides every box behind the front row and uses mostly 24-, 32- and 40-item boxes (3 / 6 / 6 / 6 of 16 / 24 / 32 / 40). It is built like the hard levels from 15 on: the rows reach the belt close to box order and each queue sends its boxes in long runs, so a box sent before its colour is on the belt parks in a slot. Its rows come in colour patches of 3 to 6 rows and it uses all 8 colours. Random taps win about 14 % of runs, the casual player 71 % and the belt watcher 91 %; tapping without looking never wins.
- **Levels 6–8** carry on from level 5 and the boxes are mostly 24 and 32 items. Level 6 has 3 queues of 6 boxes with all 8 colours in diagonal stripes (queue 1 starts Red, Blue, Green…, queue 2 one colour on, queue 3 two on) and 24- and 32-item boxes in a checkerboard. Like level 5, its rows come in patches of 3 to 6 rows of one colour, and each queue sends its boxes in runs, so the player has to read the patches coming and find the queue with that colour; the stripes and checkerboard follow each box's place in the queues (`atPos`). Level 7 uses only 32-item boxes; it stays easy, and its rows come in patches of 4 rows of one colour. Level 8 uses all four sizes, mostly 24 and 32 (4 / 7 / 6 / 1 boxes of 16 / 24 / 32 / 40 items); it repeats the Hidden Box lesson with rows of Hidden Boxes and is medium, with colour patches, runs from each queue and 7 colours.
- **One colour per row.** Every Enter Path row holds 4 items of one colour, so each box's items arrive as whole rows (a 16-item box = 4 rows, a 24-item box = 6 rows). A box's `size` sets what it holds: size 1 = 16, 2 = 24, 3 = 32, 4 = 40 items.

- **Difficulty.** In the play test a level is only lost when every slot holds a box that cannot fill. The hard levels are harder through more boxes, colours, items beyond the belt and stacked elements. From level 15 random tapping loses most runs (see above). It's worth playing the levels from 15 on by hand to judge them.

- **Levels 1–10** follow your brief one by one. Each one adds one thing. Level 1 has 6 boxes, all big: 32-, 40-, 32-, 40-, 32- and 40-item boxes (216 items on the 76-spot belt). Levels 2 and 3 have 12 boxes, 6 per queue (432 items). Level 4 has 12 boxes, 6 per queue (336 items). Levels 5, 6 and 8 have 3 queues of 6 boxes (18 boxes) and level 7 has 2 queues of 6 (12 boxes). Level 9 has 3 queues of 7 boxes (21 boxes, 576 items); level 10 has 3 queues of 7 (21 boxes, 624 items) and hides every box behind the front row.
- **Queue counts for levels 2–4.** Your notes say level 2 has 2 queues, but level 4 "adds another queue" and level 6 brings the total to 3. Levels 2, 3 and 4 have 2 queues and level 5 brings the total to 3.
- **Level 4** brings back 16- and 24-item boxes: all four sizes, 3 boxes of each, 4 colours with 3 boxes each. Each box's rows still come as one group, mixed out of queue order, one group per Enter Path (like level 3).
- **Level 5** brings the rows in patches: each box's rows are split into blocks of 3 to 6 rows of one colour, and the blocks take turns between the two Enter Paths, so the player sees patches of colour coming. It brings a third queue: 3 queues of 6 boxes (24-, 32- and 40-item boxes, 560 items, 6 colours), and each queue sends its boxes in runs, so a box sent at random often parks in a slot while its colour is still far off. The player has to look at which colour is coming and which queue holds the box for it. It is checked like the watch-the-belt levels with a looser random bar (`watchBar`) and the blind bots (`noBlind`): random taps win about 1 in 3 runs, tapping one queue until it is empty about 1 in 3, the casual player 92 % and the belt watcher every run.
- **Level length from 11 on.** Levels 11–40 were built to carry on from the earlier level 9 (312 items) and level 10 (368); levels 9 and 10 are now longer (576 and 624). A medium level starts at 368 items at level 11 and grows by about 4 items a level to about 500 by level 38. Hard levels are about 25 % longer than the medium levels around them (456 items at level 15, 624 at level 40). Block Door levels are 10 % shorter (20 % from level 31), because the shut door holds back half the rows and a long door level jams easily.
- **Levels 11–20 use bigger boxes and are 25 % longer.** About 30 % of their boxes hold 24 items, 25 % hold 32 and 10 % hold 40 (no 40-item box on the intro levels 12 and 17, on level 13 or on level 20, which already adds a fourth queue); the rest hold 16. They have 408 to 592 items, so a level does not end too fast. Each level was built again until its bots came out close to the old figures (levels 11 and 14 must still let random taps win 80 % or more). Linked Boxes always join boxes in two neighbouring queues: the generator has always enforced this.
- **Element intro levels are very easy.** Levels 12 (Locked Box), 17 (Linked Box), 22 (Block Door), 27 (Locked Item) and 32 (Block Queue) have 18 boxes (336 items; 408 on levels 12 and 17, which use the bigger boxes of levels 11–20), use 5 colours, have no 40-item box, keep the rows close to box order and use only the smallest element counts. They are marked easy. Level 17 links the front box of queue 1 to the third box of queue 2, so the link breaks after 2 sends from queue 2, then shows a second link further back. Level 27 has no Linked Boxes: the first row in from the left and the row after it are the colour of queue 1's front box and are locked for 5 sends, so the lock still shows if other boxes go first; once the count runs out, its items move into that box. One more locked row comes later.
- **Levels 11–40** follow the sheet's elements exactly. 3rd Enter Path from level 15, 4th queue from level 20, both mainly on hard levels. 32- and 40-item boxes start at level 11 (40-item boxes then skip levels 21–25 and come back at level 26).
- **Locked Box and Locked Item countdown.** A Locked Box counts down 1 for each box sent only while it is at the front of its queue (a box that just moved up starts at the next send), and a Locked Item only once it is on the conveyor. Each Locked Item spot locks a run of up to 3 rows of the same colour next to each other, so a whole block of one colour is held back (level 27: the first 2 rows in from the left). Since the player picks the send order, they can always empty the other queues first, so the GDD fail-safe keeps a level from jamming for good: when no queue has a front box that can be sent while a Locked Box is still locked or a queue is still blocked, or once every box is sent while Locked Items remain or a door is still shut, every lock and block is removed for the rest of the level. Locked Box counts are short (2 to 3, up to 4 on hard levels). A Locked Box is never a front box at the start (except level 12), never next to another Locked Box in its queue and never at the same depth as one in a neighbouring queue. The tool and the generator still check every order of sends for a jam (Linked Boxes can still cause one). The levels with Locked Boxes or Locked Items were rebuilt for these rules: 12, 13, 27, 28, 30 and 31 keep their boxes and rows with new locks; 15, 19, 20, 25, 35 and 40 got new layouts (level 26 has since become a Linked Box and Block Door breather level). Level 12 locks queue 1's front box for 2 and the third box of queue 2 for 2, so the player sees that only a front box counts down. Level 15 is a lock relay: queue 3's front box starts locked for 7, and queue 1's third box, queue 2's sixth and queue 3's seventh (each 7) reach the front about when the one before opens, so the player works two queues at a time; no order of sends can lock two or more queues at once.
- **Block Queue** uses two neighbouring queues that take turns being blocked (`blockQueue: { turns, lanes: [a, b] }`): queue a starts blocked, and after `turns` boxes sent from the other queues the block switches to queue b, then back. The other queues are never blocked. When no other queue can send a box (all empty, locked or waiting for a linked partner), the GDD fail-safe removes every lock and block for the rest of the level, since only sends from other queues count the block down. On a level with Linked Boxes, neither queue of the pair holds one. Once either queue of the pair runs out of boxes, the block is removed for the rest of the level.
- **Block Door levels** use 2 Enter Paths. The items queued behind each door are the ones needed while that door is open. Once either Enter Path runs out of items, every door opens and the Block Door is removed for the rest of the level. The win rates for levels 22–40 with Block Door or Block Queue were measured again with this rule.
- **Booster unlocks** follow the sheet (levels 3, 6, 9). They are not saved in the level files. The GDD says Hand 5, Shuffle 8, Magnet 10.
- **New pickup rule and conveyors (2026-10-29).** Items no longer wait for the lowest point of the belt: every item on the belt flies straight to a box of its colour in the slots, shared evenly between same-colour boxes. With that rule and the bigger belts, levels 4–10 were built again (levels 4 and 7 came out the same as before): random taps and tapping one queue win under 60 % of the medium levels 5, 6, 8 and 9 and of hard level 10 (without RV slots), the casual player wins 90 % or more of the medium levels and the belt watcher 90 % or more of level 10 while the casual player wins under 85 % of it (`casualBar` and `watchBar` in specs.js, checked over 100 runs). Every Enter Path colour patch is 3 rows or more. Levels 11–40 are not rebuilt yet: their win figures in the Levels table are from the old rule.
- **Conveyors.** The game's own conveyor configs: Rounded square 19, Bean 18 and Lens 18 for most levels, Heart 30 (`heart_21`) for hard levels 15 and up. Level 39 moved from the square to Bean, and level 31 has shorter Locked Item counts.
- Every level file starts with `"$schema": "../../../../../docs/design/level.schema.json"`. `links` and `slotLocks` are left out when a level has none. Each level's `meta` has `name`, `difficulty` and `notes` (what the level teaches, shown in the "What it adds" column below).

## Levels

| # | Name | Difficulty | What it adds | Queues | Enter Paths | Colours | Boxes (16 / 24 / 32 / 40 items) | Items / belt spots | Conveyor | Elements | Random taps win (1–10: new fly rule, belt starts full / empty; 11–40: old rule, lowest point / anywhere) | Casual player wins | Belt watcher wins |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | Tap a box to send it up. One middle Enter Path, 3 colours (two boxes each), 32- and 40-item boxes. | 1 | Middle | 3 | 6 (0 / 0 / 3 / 3) | 216 / 104 | square_19 | none | 100% / 100% | 100% | 100% |
| 2 | Two Queues | easy | A second queue: pick which front box to send. 32- and 40-item boxes, row groups mixed. | 2 | Middle | 4 | 12 (0 / 0 / 6 / 6) | 432 / 104 | square_19 | none | 100% / 100% | 100% | 100% |
| 3 | Round and Round | easy · 1st booster | Two queues and two Enter Paths. Whole row groups take turns between the Enter Paths, mixed out of queue order. | 2 | Left, Right | 4 | 12 (0 / 0 / 6 / 6) | 432 / 104 | square_19 | none | 100% / 100% | 100% | 100% |
| 4 | Side by Side | easy | Two queues with two Enter Paths. All four box sizes (16 to 40 items); each box's rows still come as one group. Two new colours. | 2 | Left, Right | 6 | 12 (3 / 3 / 3 / 3) | 336 / 104 | square_19 | none | 100% / 100% | 100% | 100% |
| 5 | Colour Patches | medium | A third queue. Rows come in patches of one colour: watch which colour is coming and send the box for it. | 3 | Left, Right | 6 | 18 (0 / 6 / 8 / 4) | 560 / 104 | square_19 | none | 53% / 56% | 95% | 100% |
| 6 | Diagonal Stripes | medium · 2nd booster | Box colours in diagonal stripes over all 8 colours; rows come in colour patches, so watch which colour is coming. | 3 | Left, Right | 8 | 18 (0 / 9 / 9 / 0) | 504 / 104 | square_19 | none | 7% / 8% | 93% | 100% |
| 7 | Hidden Box | easy | Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Only 32-item boxes. | 2 | Left, Right | 6 | 12 (0 / 0 / 12 / 0) | 384 / 104 | square_19 | Hidden ×5 (32 items) | 100% / 100% | 100% | 100% |
| 8 | Hidden Rows | medium | Every even box is hidden, so the queues show rows of Hidden Boxes. Rows in colour patches: watch which colour is coming. | 3 | Left, Right | 7 | 18 (4 / 7 / 6 / 1) | 464 / 104 | square_19 | Hidden ×9 (24/32/40 items) | 23% / 23% | 93% | 99% |
| 9 | Long Haul | medium · 3rd booster | Longer queues (7 boxes each). Box colours in a repeating chevron, boxes from 16 to 40 items; rows in colour patches. | 3 | Left, Right | 7 | 21 (5 / 6 / 6 / 4) | 576 / 104 | square_19 | none | 35% / 30% | 93% | 100% |
| 10 | First Challenge | hard | First hard level: every box behind the front row is hidden. Mostly 24- to 40-item boxes, only 3 of 16. | 3 | Left, Right | 8 | 21 (3 / 6 / 6 / 6) | 624 / 104 | square_19 | Hidden ×18 (16/24/32/40 items) | 3% / 9% | 65% | 94% |
| 11 | Triple Stack | medium | First 32-item box. | 3 | Left, Right | 6 | 17 (6 / 5 / 4 / 2) | 424 / 104 | square_19 | none | 76% / 90% | 97% | 100% |
| 12 | Locked Box | easy | Introduces Locked Box. | 3 | Left, Right | 5 | 18 (8 / 5 / 5 / 0) | 408 / 112 | bean_18 | Locked Box ×2 (one at the front) | 92% / 94% | 100% | 100% |
| 13 | Key Count | medium |  | 3 | Left, Right | 5 | 24 (11 / 7 / 6 / 0) | 536 / 104 | lens_18 | Locked Box ×5 (from the 3rd box of a queue back) | 96% / 96% | 100% | 100% |
| 14 | Blind Picks | medium | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 6 | 17 (6 / 5 / 4 / 2) | 424 / 104 | square_19 | Hidden ×7 (16/24/32/40 items) | 83% / 89% | 98% | 100% |
| 15 | Three Gates | hard | Third Enter Path. Hard level. | 3 | Left, Middle, Right | 8 | 22 (7 / 7 / 6 / 2) | 552 / 120 | heart_21 | Locked Box ×4 (a relay, each locked 7) | 14% / 2% | 70% | 95% |
| 16 | Heavy Load | medium |  | 3 | Left, Right | 7 | 18 (6 / 5 / 5 / 2) | 456 / 112 | bean_18 | none | 26% / 15% | 90% | 99% |
| 17 | Linked Box | easy | Introduces Linked Box. | 3 | Left, Right | 5 | 18 (8 / 5 / 5 / 0) | 408 / 104 | square_19 | Linked ×2 (one at the front) | 97% / 98% | 100% | 100% |
| 18 | Hidden Links | medium | Every even box is hidden, like level 8. | 3 | Left, Middle, Right | 6 | 18 (6 / 5 / 5 / 2) | 456 / 104 | lens_18 | Hidden ×9 (16/24/32 items), Linked ×2 | 70% / 60% | 94% | 99% |
| 19 | Patience | medium |  | 3 | Left, Right | 7 | 18 (6 / 5 / 5 / 2) | 456 / 112 | bean_18 | Locked Box ×3 | 21% / 16% | 79% | 97% |
| 20 | Four Queues | hard | Fourth queue. Hard level. | 4 | Left, Middle, Right | 7 | 26 (11 / 8 / 7 / 0) | 592 / 104 | square_19 | Locked Box ×4, Linked ×3 | 27% / 14% | 78% | 96% |
| 21 | Clear Skies | easy | Breather after a hard level: no elements. | 3 | Left, Right | 6 | 21 (15 / 4 / 2 / 0) | 400 / 104 | lens_18 | none | 96% / 86% | 100% | 100% |
| 22 | Block Door | easy | Introduces Block Door. | 2 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 104 | square_19 | Block Door (4) | 98% / 98% | 100% | 100% |
| 23 | Behind the Door | easy | Every even box is hidden, like level 8. | 3 | Left, Right | 6 | 19 (13 / 4 / 2 / 0) | 368 / 112 | bean_18 | Hidden ×9 (16/24/32 items), Block Door (3) | 96% / 89% | 100% | 100% |
| 24 | Chain Gang | medium |  | 3 | Left, Middle, Right | 7 | 22 (16 / 4 / 2 / 0) | 416 / 104 | lens_18 | Linked ×2 | 26% / 10% | 85% | 100% |
| 25 | Door Lock | hard | Hard level. | 3 | Left, Right | 8 | 25 (18 / 5 / 2 / 0) | 472 / 120 | heart_21 | Locked Box ×4, Block Door (3) | 48% / 18% | 82% | 95% |
| 26 | Swing Doors | easy | First 40-item box. | 3 | Left, Right | 6 | 20 (13 / 4 / 2 / 1) | 408 / 104 | square_19 | Linked ×2, Block Door (3) | 86% / 80% | 92% | 98% |
| 27 | Locked Item | easy | Introduces Locked Item. | 4 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 112 | bean_18 | Locked Item rows ×4 (one at the start) | 98% / 90% | 100% | 100% |
| 28 | Secret Cargo | easy | Hidden Boxes in a staggered pattern, like level 7. | 3 | Left, Right | 5 | 22 (15 / 4 / 2 / 1) | 440 / 104 | lens_18 | Hidden ×10 (16/24/32 items), Locked Item rows ×7 | 89% / 83% | 99% | 100% |
| 29 | Rush Hour | medium |  | 3 | Left, Middle, Right | 7 | 23 (15 / 5 / 2 / 1) | 464 / 104 | square_19 | none | 28% / 24% | 88% | 100% |
| 30 | Deep Freeze | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 28 (18 / 6 / 2 / 2) | 576 / 120 | heart_21 | Hidden ×12 (16/24/40 items), Locked Box ×4, Locked Item rows ×9 | 14% / 12% | 87% | 96% |
| 31 | Cold Storage | medium |  | 4 | Left, Right | 7 | 23 (15 / 5 / 2 / 1) | 464 / 112 | bean_18 | Locked Item rows ×9 | 17% / 16% | 76% | 97% |
| 32 | Block Queue | easy | Introduces Block Queue. | 3 | Left, Right | 5 | 18 (13 / 4 / 1 / 0) | 336 / 104 | square_19 | Block Queue (4) | 100% / 100% | 100% | 100% |
| 33 | Detour | medium |  | 3 | Left, Middle, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 104 | lens_18 | Block Queue (3) | 15% / 15% | 84% | 97% |
| 34 | Tangled | medium |  | 4 | Left, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 112 | bean_18 | Linked ×4 | 26% / 14% | 85% | 94% |
| 35 | Gridlock | hard | Hidden Boxes in a staggered pattern, like level 7. Hard level. | 4 | Left, Middle, Right | 7 | 30 (20 / 6 / 2 / 2) | 608 / 120 | heart_21 | Hidden ×13 (16/24/32/40 items), Locked Box ×4, Block Queue (3) | 19% / 11% | 81% | 92% |
| 36 | Long Belt | medium |  | 3 | Left, Middle, Right | 7 | 24 (16 / 5 / 2 / 1) | 480 / 104 | square_19 | none | 18% / 14% | 79% | 91% |
| 37 | Night Shift | medium | Every even box is hidden, like level 8. | 3 | Left, Right | 7 | 19 (12 / 4 / 2 / 1) | 392 / 104 | lens_18 | Hidden ×9 (16/24/32/40 items), Block Door (3) | 39% / 13% | 80% | 91% |
| 38 | Roadblock | medium |  | 4 | Left, Middle, Right | 7 | 25 (17 / 5 / 2 / 1) | 496 / 112 | bean_18 | Linked ×2, Block Queue (3) | 11% / 3% | 68% | 79% |
| 39 | Cold Links | medium | Linked Box with Locked Items. | 3 | Left, Right | 7 | 20 (13 / 4 / 2 / 1) | 408 / 112 | bean_18 | Linked ×2, Locked Item rows ×8 | 20% / 20% | 71% | 92% |
| 40 | Grand Finale | hard | Every even box is hidden, like level 8. Hard level. | 4 | Left, Middle, Right | 7 | 31 (21 / 6 / 2 / 2) | 624 / 120 | heart_21 | Hidden ×15 (16/24/32/40 items), Locked Box ×4, Locked Item rows ×16, Block Queue (3) | 14% / 17% | 67% | 93% |

## Bot ladder

<!-- ladder -->
Win rate of each bot over 200 runs (items fly straight to any matching box, belt starting full). Built by `tools/levelgen/ladder.js`.

- **Blind, one queue**: never looks: keeps tapping one queue until it is empty or stuck, then the next.
- **Blind, in turn**: never looks: taps the queues in turn (1, 2, 3, 1…).
- **Random tap**: taps a random queue as fast as slots free up.
- **Beginner**: half the taps random, half for the colour on the belt.
- **Casual**: 3 taps in 10 random.
- **Belt watcher**: 1 tap in 10 random.
- **Careful**: counts the items coming and waits instead of parking a box that cannot fill.
- **Blind, one queue + RV**: blind, one queue, but takes the RV slots when about to lose (not used for the rating).

"Needs" is the first bot that wins 90 % or more of runs, and "Ladder rating" turns it into a difficulty: either Blind bot or Random tap = Very easy, Beginner = Easy, Casual = Medium, Belt watcher = Hard, Careful = Very hard. The careful bot plays without luck, so it always shows 0 % or 100 %. The blind bots try a random order of the queues each run; a level that "Blind, in turn" wins can be cleared by tapping the queues in turn without looking.

| # | Name | Difficulty | Blind, one queue | Blind, in turn | Random tap | Beginner | Casual | Belt watcher | Careful | Blind, one queue + RV | Needs | Ladder rating |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 2 | Two Queues | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 3 | Round and Round | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 4 | Side by Side | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 5 | Colour Patches | medium | 0% | 0% | 53% | 85% | 95% | 100% | 100% | 50% | Casual | Medium |
| 6 | Diagonal Stripes | medium | 50% | 0% | 7% | 74% | 93% | 100% | 100% | 86% | Casual | Medium |
| 7 | Hidden Box | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 8 | Hidden Rows | medium | 34% | 0% | 23% | 74% | 93% | 99% | 100% | 83% | Casual | Medium |
| 9 | Long Haul | medium | 36% | 0% | 35% | 77% | 93% | 100% | 100% | 100% | Casual | Medium |
| 10 | First Challenge | hard | 0% | 0% | 3% | 36% | 65% | 94% | 100% | 68% | Belt watcher | Hard |
| 11 | Triple Stack | medium | 66% | 100% | 98% | 100% | 100% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 12 | Locked Box | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 13 | Key Count | medium | 70% | 100% | 99% | 100% | 100% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 14 | Blind Picks | medium | 48% | 100% | 97% | 100% | 100% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 15 | Three Gates | hard | 33% | 0% | 3% | 26% | 46% | 78% | 100% | 100% | Careful | Very hard |
| 16 | Heavy Load | medium | 18% | 100% | 78% | 94% | 97% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 17 | Linked Box | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 18 | Hidden Links | medium | 100% | 100% | 88% | 97% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 19 | Patience | medium | 67% | 100% | 94% | 97% | 99% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 20 | Four Queues | hard | 39% | 76% | 56% | 87% | 93% | 98% | 100% | 97% | Casual | Medium |
| 21 | Clear Skies | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 22 | Block Door | easy | 53% | 100% | 99% | 100% | 100% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 23 | Behind the Door | easy | 82% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 24 | Chain Gang | medium | 69% | 0% | 39% | 83% | 94% | 99% | 100% | 83% | Casual | Medium |
| 25 | Door Lock | hard | 48% | 0% | 21% | 59% | 80% | 95% | 100% | 83% | Belt watcher | Hard |
| 26 | Swing Doors | easy | 84% | 67% | 89% | 97% | 98% | 99% | 100% | 100% | Beginner | Easy |
| 27 | Locked Item | easy | 94% | 100% | 99% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 28 | Secret Cargo | easy | 100% | 100% | 99% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 29 | Rush Hour | medium | 100% | 33% | 64% | 84% | 98% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 30 | Deep Freeze | hard | 57% | 0% | 8% | 43% | 74% | 94% | 100% | 100% | Belt watcher | Hard |
| 31 | Cold Storage | medium | 62% | 53% | 75% | 94% | 98% | 100% | 100% | 91% | Beginner | Easy |
| 32 | Block Queue | easy | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 33 | Detour | medium | 17% | 67% | 43% | 85% | 96% | 100% | 100% | 100% | Casual | Medium |
| 34 | Tangled | medium | 70% | 100% | 73% | 96% | 99% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 35 | Gridlock | hard | 40% | 0% | 10% | 52% | 77% | 97% | 100% | 82% | Belt watcher | Hard |
| 36 | Long Belt | medium | 84% | 100% | 67% | 94% | 98% | 100% | 100% | 100% | Blind, in turn | Very easy |
| 37 | Night Shift | medium | 100% | 36% | 79% | 90% | 91% | 97% | 100% | 100% | Blind, one queue | Very easy |
| 38 | Roadblock | medium | 47% | 24% | 50% | 89% | 93% | 99% | 100% | 100% | Casual | Medium |
| 39 | Cold Links | medium | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | Blind, one queue | Very easy |
| 40 | Grand Finale | hard | 27% | 0% | 18% | 32% | 40% | 31% | 0% | 96% | none | Unwinnable |
<!-- /ladder -->
