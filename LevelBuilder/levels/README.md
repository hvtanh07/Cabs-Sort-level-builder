# Element unlock levels 1–40

The 40 levels from the level list sheet ("Cab 42"). They load into the tool's level list on their own (from `js/levels.js`), and each one is also here as a JSON file.

## How they were checked

Each level was played many times by two bots in the tool's play test:

- **Random taps**: sends a random front box whenever a slot is free, with no thought.
- **Careful player**: only sends a box when its colour is on the belt, unless nothing else can move.

From level 2 on, every level holds more items than its belt has spots, so once the belt has filled at the start, items are still waiting in the Enter Paths (on Block Door levels they wait behind the shut door). Level 1 fills about 84 % of the belt, level 2 leaves 1 row waiting, level 3 a little more, and the count builds up from there. The levels use the game's own conveyors (Rounded square 19 rows = 76 spots, Bean 18, Lens 18, Heart 30, Triangle 12).

Every level 1–40 is won by the careful player, with boxes picking at the lowest point and picking anywhere. Levels 1–9 win **every time** with random taps (300 runs each, in every pickup mode, with the belt starting full or empty). Level 10, the first hard level, wins about 8 in 10. The last column of the table shows random taps on every level.

## Design notes

- **Colour unlocks.** Levels 1–4 use Red, Blue, Green and Yellow. Pink joins at level 5, Orange at level 7, Purple at level 10 and Cyan at level 12; up to level 12 a level uses every colour unlocked so far. From level 13 any of the 8 colours can be mixed in.
- **Level 1 layout.** The items start on the belt in 16-item groups, one group per box, in queue order: the first box's group reaches the pickup point first, then the second box's, and so on.
- **Hidden Box patterns.** Level 7 is staggered: queue 1 hides every even box and queue 2 every odd box after the front one. Level 8 hides every even box in every queue, so the queues show rows of Hidden Boxes.
- **One colour per row.** Every Enter Path row holds 4 items of one colour, so each box's items arrive as whole rows (a 16-item box = 4 rows, a 24-item box = 6 rows). A box's `size` sets what it holds: size 1 = 16, 2 = 24, 3 = 32, 4 = 40 items.

- **Difficulty.** In the play test a level is only lost when every slot holds a box that cannot fill, so random taps still win most hard levels (see the last column). The hard levels are harder through more boxes, colours, items beyond the belt and stacked elements. On the smaller belts random taps lose more often on busy levels: the lowest are levels 25, 36 and 40 at about three quarters wins. It's worth playing the hard levels by hand to judge them.

- **Levels 1–10** follow your brief one by one. Each one adds one thing. Level 1 has 4 boxes (64 items, about 84 % of the 76-spot belt). Level 2 has 5 boxes and leaves 1 row waiting, level 3 has 6 boxes and leaves 2 to 3 rows per Enter Path. Levels 4–9 build up from 8 to 13 boxes (128 to 224 items); level 10 has 21 boxes, leaves about 36 rows per Enter Path and hides every box behind the front row. Levels 11–40 hold the same number of items as before the conveyors changed.
- **Queue counts for levels 2–4.** Your notes say level 2 has 2 queues, but level 4 "adds another queue" and level 6 brings the total to 3. I read this as level 2 = 2 queues, level 3 = back to 1 queue (so the swapped boxes are easy to see), level 4 = 2 queues, level 6 = 3 queues.
- **Level 3.** The first and last boxes in the queue swapped places. The last box's items enter first, so they ride the belt until that box comes up.
- **Level 5** uses the Triangle 12 conveyor (48 spots) with 152 items. Its first 24-item box has a colour no other box uses: most of its items are on the belt at the start and its last row pours in later.
- **Levels 11–40** follow the sheet's elements exactly. 3rd Enter Path from level 15, 4th queue from level 20, both mainly on hard levels. 32-item boxes start at level 11 and 40-item boxes at level 26.
- **Block Door levels** use 2 Enter Paths. The items queued behind each door are the ones needed while that door is open.
- **Booster unlocks** follow the sheet (levels 3, 6, 9). They are not saved in the level files. The GDD says Hand 5, Shuffle 8, Magnet 10.
- **Conveyors.** The game's own conveyor configs: Rounded square 19, Bean 18 and Lens 18 for most levels, Heart 30 (`heart_21`) for hard levels 15 and up, Triangle 12 for level 5. Level 39 moved from the square to Bean, and level 31 has shorter Locked Item counts, so random taps still win most runs on the smaller belts.
- Every level file starts with `"$schema": "../../../../../docs/design/level.schema.json"`. `links` and `slotLocks` are left out when a level has none. Each level's `meta` has `name`, `difficulty` and `notes` (what the level teaches, shown in the "What it adds" column below).

## Levels

| # | Name | Difficulty | What it adds | Queues | Enter Paths | Colours | Boxes (16 / 24 / 32 / 40 items) | Items / belt spots | Conveyor | Elements | Random taps win (lowest point / anywhere) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only. | 1 | Middle | 4 | 4 (4 / 0 / 0 / 0) | 64 / 76 | square_19 | none | 100% / 100% |
| 2 | Two Queues | easy | A second queue: pick which front box to send. | 2 | Middle | 4 | 5 (5 / 0 / 0 / 0) | 80 / 76 | square_19 | none | 100% / 100% |
| 3 | Round and Round | easy · 1st booster | Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up. | 1 | Left, Right | 4 | 6 (6 / 0 / 0 / 0) | 96 / 76 | square_19 | none | 100% / 100% |
| 4 | Side by Side | easy | Two queues with two Enter Paths. | 2 | Left, Right | 4 | 8 (8 / 0 / 0 / 0) | 128 / 76 | square_19 | none | 100% / 100% |
| 5 | Big Box | easy | First 24-item box. The belt is full, so its last items pour in from the Enter Path later. | 2 | Left, Right | 5 | 8 (5 / 3 / 0 / 0) | 152 / 48 | triangle_12 | none | 100% / 100% |
| 6 | Three Queues | easy · 2nd booster | A third queue, with a few 24-item boxes. | 3 | Left, Right | 5 | 10 (8 / 2 / 0 / 0) | 176 / 76 | square_19 | none | 100% / 100% |
| 7 | Hidden Box | easy | Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues. | 2 | Left, Right | 6 | 12 (10 / 2 / 0 / 0) | 208 / 76 | square_19 | Hidden ×5 (16/24 items) | 100% / 100% |
| 8 | Hidden Big Box | easy | Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues. | 3 | Left, Right | 6 | 12 (10 / 2 / 0 / 0) | 208 / 76 | square_19 | Hidden ×6 (16/24 items) | 100% / 100% |
| 9 | Long Haul | easy · 3rd booster | No Hidden Box, but a longer level. Three queues, two Enter Paths. | 3 | Left, Right | 6 | 13 (11 / 2 / 0 / 0) | 224 / 76 | square_19 | none | 100% / 100% |
| 10 | First Challenge | hard | First hard level: every box behind the front row is hidden. Longer than level 9. | 3 | Left, Right | 7 | 21 (17 / 4 / 0 / 0) | 368 / 76 | square_19 | Hidden ×18 (16/24 items) | 89% / 79% |
| 11 | Triple Stack | normal | First 32-item box. | 3 | Left, Right | 7 | 12 (9 / 2 / 1 / 0) | 224 / 76 | square_19 | none | 97% / 96% |
| 12 | Locked Box | normal | Introduces Locked Box. | 3 | Left, Right | 8 | 12 (9 / 2 / 1 / 0) | 224 / 72 | bean_18 | Locked Box ×2 | 100% / 100% |
| 13 | Key Count | normal |  | 3 | Left, Right | 6 | 12 (9 / 2 / 1 / 0) | 224 / 72 | lens_18 | Locked Box ×3 | 100% / 100% |
| 14 | Blind Picks | normal |  | 3 | Left, Right | 6 | 13 (9 / 3 / 1 / 0) | 248 / 76 | square_19 | Hidden ×2 (24 items) | 99% / 88% |
| 15 | Three Gates | hard | Third Enter Path. Hard level. | 3 | Left, Middle, Right | 8 | 15 (11 / 3 / 1 / 0) | 280 / 120 | heart_21 | Locked Box ×4 | 84% / 100% |
| 16 | Heavy Load | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 72 | bean_18 | none | 99% / 98% |
| 17 | Linked Box | normal | Introduces Linked Box. | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 76 | square_19 | Linked ×1 | 98% / 93% |
| 18 | Hidden Links | normal |  | 3 | Left, Middle, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 72 | lens_18 | Hidden ×2 (16 items), Linked ×2 | 99% / 88% |
| 19 | Patience | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 72 | bean_18 | Locked Box ×3 | 100% / 100% |
| 20 | Four Queues | hard | Fourth queue. Hard level. | 4 | Left, Middle, Right | 8 | 15 (11 / 3 / 1 / 0) | 280 / 76 | square_19 | Locked Box ×4, Linked ×3 | 91% / 85% |
| 21 | Fog | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 72 | lens_18 | Hidden ×2 (16 items) | 96% / 100% |
| 22 | Block Door | normal | Introduces Block Door. | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 76 | square_19 | Block Door (4) | 91% / 88% |
| 23 | Behind the Door | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 248 / 72 | bean_18 | Hidden ×2 (16 items), Block Door (3) | 84% / 78% |
| 24 | Chain Gang | normal |  | 3 | Left, Middle, Right | 7 | 14 (10 / 3 / 1 / 0) | 264 / 72 | lens_18 | Linked ×2 | 100% / 97% |
| 25 | Door Lock | hard | Hard level. | 3 | Left, Right | 8 | 17 (13 / 3 / 1 / 0) | 312 / 120 | heart_21 | Locked Box ×4, Block Door (3) | 77% / 74% |
| 26 | Swing Doors | normal | First 40-item box. | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 76 | square_19 | Locked Box ×3, Block Door (3) | 100% / 100% |
| 27 | Locked Item | normal | Introduces Locked Item. | 4 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 72 | bean_18 | Linked ×2, Locked Item rows ×2 | 91% / 97% |
| 28 | Secret Cargo | normal |  | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 72 | lens_18 | Hidden ×2 (16 items), Locked Item rows ×3 | 92% / 96% |
| 29 | Rush Hour | normal |  | 3 | Left, Middle, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 76 | square_19 | none | 86% / 96% |
| 30 | Deep Freeze | hard | Hard level. | 4 | Left, Middle, Right | 8 | 17 (11 / 3 / 1 / 2) | 360 / 120 | heart_21 | Hidden ×4 (16/24 items), Locked Box ×4, Locked Item rows ×4 | 95% / 93% |
| 31 | Cold Storage | normal |  | 4 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 72 | bean_18 | Locked Item rows ×3 | 82% / 85% |
| 32 | Block Queue | normal | Introduces Block Queue. | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 76 | square_19 | Block Queue (4) | 90% / 99% |
| 33 | Detour | normal |  | 3 | Left, Middle, Right | 8 | 14 (9 / 3 / 1 / 1) | 288 / 72 | lens_18 | Block Queue (3) | 89% / 94% |
| 34 | Tangled | normal |  | 4 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 304 / 72 | bean_18 | Linked ×2 | 88% / 91% |
| 35 | Gridlock | hard | Hard level. | 4 | Left, Middle, Right | 8 | 17 (11 / 3 / 1 / 2) | 360 / 120 | heart_21 | Hidden ×4 (16/24/32 items), Locked Box ×4, Block Queue (3) | 87% / 92% |
| 36 | Long Belt | normal |  | 3 | Left, Middle, Right | 8 | 15 (10 / 3 / 1 / 1) | 304 / 76 | square_19 | none | 77% / 80% |
| 37 | Night Shift | normal |  | 3 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 304 / 72 | lens_18 | Hidden ×2 (16/24 items), Block Door (3) | 99% / 83% |
| 38 | Roadblock | normal |  | 4 | Left, Middle, Right | 8 | 15 (10 / 3 / 1 / 1) | 304 / 72 | bean_18 | Linked ×2, Block Queue (3) | 87% / 90% |
| 39 | Last Door | normal |  | 3 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 304 / 72 | bean_18 | Hidden ×2 (16 items), Block Door (3) | 93% / 87% |
| 40 | Grand Finale | hard | Hard level. | 4 | Left, Middle, Right | 8 | 18 (11 / 4 / 1 / 2) | 384 / 120 | heart_21 | Hidden ×4 (16/24/32 items), Locked Box ×4, Locked Item rows ×4, Block Queue (3) | 92% / 77% |
