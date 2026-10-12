# Element unlock levels 1–40

The 40 levels from the level list sheet ("Cab 42"). They load into the tool's level list on their own (from `js/levels.js`), and each one is also here as a JSON file.

## How they were checked

Each level was played many times by two bots in the tool's play test:

- **Random taps**: sends a random front box whenever a slot is free, with no thought.
- **Careful player**: only sends a box when its colour is on the belt, unless nothing else can move.

From level 2 on, every level holds more items than its belt has spots, so once the belt has filled at the start, items are still waiting in the Enter Paths (on Block Door levels they wait behind the shut door). Level 1 fills about 86 % of the belt, level 2 leaves 2 rows waiting, level 3 a little more, and the count builds up from there. The levels were rebuilt this way after the switch to a counter-clockwise belt with pickup only at the lowest point.

Every level 1–40 is won by the careful player, with boxes picking at the lowest point and picking anywhere. Levels 1–9 win **every time** with random taps (300 runs each, in every pickup mode, with the belt starting full or empty). Level 10 also won all of its runs. The last column of the table shows random taps on every level.

## Design notes

- **Colour unlocks.** Levels 1–4 use Red, Blue, Green and Yellow. Pink joins at level 5, Orange at level 7, Purple at level 10 and Cyan at level 12; up to level 12 a level uses every colour unlocked so far. From level 13 any of the 8 colours can be mixed in.
- **Level 1 layout.** The items start on the belt in 16-item groups, one group per box, in queue order: the first box's group reaches the pickup point first, then the second box's, and so on.
- **Hidden Box patterns.** Level 7 is staggered: queue 1 hides every even box and queue 2 every odd box after the front one. Level 8 hides every even box in every queue, so the queues show rows of Hidden Boxes.
- **One colour per row.** Every Enter Path row holds 4 items of one colour, so each box's items arrive as whole rows (a 16-item box = 4 rows, a 20-item box = 5 rows). Boxes hold 16, 20, 24 or 32 items, so the queues stay short.

- **Difficulty.** In the play test a level is only lost when every slot holds a box that cannot fill, so random taps still win most hard levels (see the last column). The hard levels are harder through more boxes, colours, items beyond the belt and stacked elements. Block Door levels are the only ones where random taps lose often (down to about two thirds wins on levels 37 and 39 when boxes pick anywhere). It's worth playing the hard levels by hand to judge them.

- **Levels 1–10** follow your brief one by one. Each one adds one thing. Level 1 has 9 boxes (144 items, about 86 % of the 168-spot belt). Levels 2–9 run 11 to 13 boxes and leave 2 to 7 rows in each Enter Path once the belt is full; level 10 has 20 boxes, leaves 21 rows per Enter Path and hides every box behind the front row.
- **Queue counts for levels 2–4.** Your notes say level 2 has 2 queues, but level 4 "adds another queue" and level 6 brings the total to 3. I read this as level 2 = 2 queues, level 3 = back to 1 queue (so the swapped boxes are easy to see), level 4 = 2 queues, level 6 = 3 queues.
- **Level 3.** The first and last boxes in the queue swapped places. The last box's items enter first, so they ride the belt until that box comes up.
- **Level 5** uses the Triangle 28 conveyor (112 spots) with 140 items. Its first 20-item box has a colour no other box uses: most of its items are on the belt at the start and its last row pours in later.
- **Levels 11–40** follow the sheet's elements exactly. 3rd Enter Path from level 15, 4th queue from level 20, both mainly on hard levels. 24-item boxes start at level 11 and 32-item boxes at level 26.
- **Block Door levels** use 2 Enter Paths. The items queued behind each door are the ones needed while that door is open.
- **Booster unlocks** follow the sheet (levels 3, 6, 9), saved as `meta.booster`. The GDD says Hand 5, Shuffle 8, Magnet 10.
- **Conveyors.** "Cab 42" read as the 42-row conveyors (Rounded square, Bean, Lens), with Heart 44 for hard levels 15 and up. Level 5 is the one exception.
- Each level's `meta` also has `intro` (what the level teaches) and `unlock` (the element it introduces), for the tutorial team. Remove them if the game rejects unknown keys.

## Levels

| # | Name | Difficulty | What it adds | Queues | Enter Paths | Colours | Boxes (16 / 20 / 24 / 32 items) | Items / belt spots | Conveyor | Elements | Random taps win (lowest point / anywhere) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | First Sort | easy | Tap a box to send it up. One middle Enter Path, 4 colours, small boxes only. | 1 | Middle | 4 | 9 (9 / 0 / 0 / 0) | 144 / 168 | square_42 | none | 100% / 100% |
| 2 | Two Queues | easy | A second queue: pick which front box to send. | 2 | Middle | 4 | 11 (11 / 0 / 0 / 0) | 176 / 168 | square_42 | none | 100% / 100% |
| 3 | Round and Round | easy · 1st booster | Two Enter Paths. Two boxes swapped places, so one colour rides the belt until its box comes up. | 1 | Left, Right | 4 | 12 (12 / 0 / 0 / 0) | 192 / 168 | square_42 | none | 100% / 100% |
| 4 | Side by Side | easy | Two queues with two Enter Paths. | 2 | Left, Right | 4 | 12 (12 / 0 / 0 / 0) | 192 / 168 | square_42 | none | 100% / 100% |
| 5 | Big Box | easy | First 20-item box. The belt is full, so its last items pour in from the Enter Path later. | 2 | Left, Right | 5 | 8 (5 / 3 / 0 / 0) | 140 / 112 | triangle_28 | none | 100% / 100% |
| 6 | Three Queues | easy · 2nd booster | A third queue, with a few 20-item boxes. | 3 | Left, Right | 5 | 12 (10 / 2 / 0 / 0) | 200 / 168 | square_42 | none | 100% / 100% |
| 7 | Hidden Box | easy | Hidden Box in a staggered pattern: queue 1 hides every even box, queue 2 every odd box after the front. Two Enter Paths, two queues. | 2 | Left, Right | 6 | 13 (11 / 2 / 0 / 0) | 216 / 168 | square_42 | Hidden ×5 (16/20 items) | 100% / 100% |
| 8 | Hidden Big Box | easy | Every even box is hidden, so the queues show rows of Hidden Boxes. Three queues. | 3 | Left, Right | 6 | 13 (10 / 3 / 0 / 0) | 220 / 168 | square_42 | Hidden ×6 (16/20 items) | 100% / 100% |
| 9 | Long Haul | easy · 3rd booster | No Hidden Box, but a longer level. Three queues, two Enter Paths. | 3 | Left, Right | 6 | 13 (11 / 2 / 0 / 0) | 216 / 168 | square_42 | none | 100% / 100% |
| 10 | First Challenge | hard | First hard level: every box behind the front row is hidden. Longer than level 9. | 3 | Left, Right | 7 | 20 (16 / 4 / 0 / 0) | 336 / 168 | square_42 | Hidden ×17 (16/20 items) | 100% / 100% |
| 11 | Triple Stack | normal | First 24-item box. | 3 | Left, Right | 7 | 12 (9 / 2 / 1 / 0) | 208 / 168 | square_42 | none | 100% / 100% |
| 12 | Locked Box | normal | Introduces Locked Box. | 3 | Left, Right | 8 | 12 (9 / 2 / 1 / 0) | 208 / 168 | bean_42 | Locked Box ×2 | 100% / 100% |
| 13 | Key Count | normal |  | 3 | Left, Right | 6 | 12 (9 / 2 / 1 / 0) | 208 / 168 | lens_42 | Locked Box ×3 | 100% / 100% |
| 14 | Blind Picks | normal |  | 3 | Left, Right | 6 | 13 (9 / 3 / 1 / 0) | 228 / 168 | square_42 | Hidden ×2 (16/20 items) | 100% / 100% |
| 15 | Three Gates | hard | Third Enter Path. Hard level. | 3 | Left, Middle, Right | 8 | 15 (11 / 3 / 1 / 0) | 260 / 176 | heart_44 | Locked Box ×4 | 100% / 100% |
| 16 | Heavy Load | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | bean_42 | none | 100% / 100% |
| 17 | Linked Box | normal | Introduces Linked Box. | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | square_42 | Linked ×1 | 100% / 100% |
| 18 | Hidden Links | normal |  | 3 | Left, Middle, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | lens_42 | Hidden ×2 (16/20 items), Linked ×2 | 100% / 100% |
| 19 | Patience | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | bean_42 | Locked Box ×3 | 100% / 100% |
| 20 | Four Queues | hard | Fourth queue. Hard level. | 4 | Left, Middle, Right | 8 | 15 (11 / 3 / 1 / 0) | 260 / 168 | square_42 | Locked Box ×4, Linked ×3 | 100% / 100% |
| 21 | Fog | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | lens_42 | Hidden ×2 (16/20 items) | 100% / 100% |
| 22 | Block Door | normal | Introduces Block Door. | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | square_42 | Block Door (4) | 100% / 72% |
| 23 | Behind the Door | normal |  | 3 | Left, Right | 7 | 13 (9 / 3 / 1 / 0) | 228 / 168 | bean_42 | Hidden ×2 (16 items), Block Door (3) | 100% / 86% |
| 24 | Chain Gang | normal |  | 3 | Left, Middle, Right | 7 | 14 (10 / 3 / 1 / 0) | 244 / 168 | lens_42 | Linked ×2 | 100% / 100% |
| 25 | Door Lock | hard | Hard level. | 3 | Left, Right | 8 | 17 (13 / 3 / 1 / 0) | 292 / 176 | heart_44 | Locked Box ×4, Block Door (3) | 100% / 77% |
| 26 | Swing Doors | normal | First 32-item box. | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | square_42 | Locked Box ×3, Block Door (3) | 91% / 90% |
| 27 | Locked Item | normal | Introduces Locked Item. | 4 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | bean_42 | Linked ×2, Locked Item rows ×2 | 100% / 100% |
| 28 | Secret Cargo | normal |  | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | lens_42 | Hidden ×2 (16 items), Locked Item rows ×3 | 100% / 100% |
| 29 | Rush Hour | normal |  | 3 | Left, Middle, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | square_42 | none | 100% / 100% |
| 30 | Deep Freeze | hard | Hard level. | 4 | Left, Middle, Right | 8 | 17 (11 / 3 / 1 / 2) | 324 / 176 | heart_44 | Hidden ×4 (16 items), Locked Box ×4, Locked Item rows ×4 | 100% / 100% |
| 31 | Cold Storage | normal |  | 4 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | bean_42 | Locked Item rows ×3 | 100% / 100% |
| 32 | Block Queue | normal | Introduces Block Queue. | 3 | Left, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | square_42 | Block Queue (4) | 100% / 100% |
| 33 | Detour | normal |  | 3 | Left, Middle, Right | 8 | 14 (9 / 3 / 1 / 1) | 260 / 168 | lens_42 | Block Queue (3) | 100% / 100% |
| 34 | Tangled | normal |  | 4 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 276 / 168 | bean_42 | Linked ×2 | 100% / 100% |
| 35 | Gridlock | hard | Hard level. | 4 | Left, Middle, Right | 8 | 17 (11 / 3 / 1 / 2) | 324 / 176 | heart_44 | Hidden ×4 (16/20 items), Locked Box ×4, Block Queue (3) | 100% / 100% |
| 36 | Long Belt | normal |  | 3 | Left, Middle, Right | 8 | 15 (10 / 3 / 1 / 1) | 276 / 168 | square_42 | none | 100% / 100% |
| 37 | Night Shift | normal |  | 3 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 276 / 168 | lens_42 | Hidden ×2 (16 items), Block Door (3) | 94% / 71% |
| 38 | Roadblock | normal |  | 4 | Left, Middle, Right | 8 | 15 (10 / 3 / 1 / 1) | 276 / 168 | bean_42 | Linked ×2, Block Queue (3) | 100% / 100% |
| 39 | Last Door | normal |  | 3 | Left, Right | 8 | 15 (10 / 3 / 1 / 1) | 276 / 168 | square_42 | Hidden ×2 (16/20 items), Block Door (3) | 100% / 90% |
| 40 | Grand Finale | hard | Hard level. | 4 | Left, Middle, Right | 8 | 18 (11 / 4 / 1 / 2) | 344 / 176 | heart_44 | Hidden ×4 (16/24 items), Locked Box ×4, Locked Item rows ×4, Block Queue (3) | 100% / 100% |
