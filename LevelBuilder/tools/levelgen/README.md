# Level generator

Builds and checks the 40 element-unlock levels in `../../levels/` and `../../js/levels.js`. Needs Node.

```
node run.js        # build every level from specs.js and pick the first seed that passes the checks (writes out.json)
node verify.js     # bot runs on the chosen levels (writes verify.json)
node write.js      # writes levels/level_00NN.json and js/levels.js
```

- `specs.js`: one entry per level. Levels 1–10 are written by hand; 11–40 follow the level list sheet.
  The block at the end sets each level's length: `TOTAL` gives levels 1–10 in items, and levels 11–40 start at 368 items and grow by about 4 a level (hard +25 %, Block Door −10 to −20 %, element intro levels fixed at level 9's length); box counts follow from it.
  Level 13 is tuned by hand at the end of the 11–40 loop: `items` sets its length, `big3Share` its share of 32-item boxes, `tune` values applied after the shared rules (colours, window), `lockFrom` / `lockDepth` / `lockPerLane` place its Locked Boxes further back in the queues, `minRandom` raises the random-tap bar and `seed` starts the search at a picked seed.
  Level 17 sets `linkAt` to put its first link at fixed spots (queue 1's front box with queue 2's third box) and picks 1 more link from the 4th box back (`linkFrom`).
  Level 27 sets `dropLinks` (no Linked Boxes) and `lockedRowAt` to lock the first row in from the left for 5 sends, plus 1 more locked row picked at random; seed 63 makes that first row the colour of queue 1's front box.
  Hidden Boxes from level 14 use the level 7 and 8 patterns (`HIDDEN_PATTERN`), taking turns: staggered, then every even box, and so on.
  `count` sets a level's box count directly (levels 1, 2, 4, 5, 6, 8, 9), with `bigCount` or `bigAt` for its 24-item boxes; `bigAt` puts them at fixed places in the send order, so level 9 gets one per queue.
  `sizeAt` sets every box's tier in send order instead (level 1: `[3, 4, 3, 4, 3, 4]`, only 32- and 40-item boxes).
  Specs count boxes by tier (small, `big2`, `big3`, `big4`); `SIZE` in `gen.js` turns the tiers into 16 / 24 / 32 / 40-item boxes, saved as box `size` 1 / 2 / 3 / 4.
- `gen.js`: turns a spec into a level, plus the bots: random taps, and a careful player that waits when no box can fill.
- Locked Boxes (`gen.js`): a lock counts down only while its box is at the front of its queue, so each count is just `lockRange` sends (2 to 3, up to 4 on hard levels). `lockAt` puts some at fixed spots (level 12: queue 1's front box and queue 2's third box, both 2). The others are never a front box at the start, never two next to each other in a queue or at the same depth in neighbouring queues. In the game, the GDD fail-safe removes every lock and block when no queue can send while a Locked Box or Block Queue is active, and when every box is sent while Locked Items (which count only once on the conveyor) remain, so locks cannot jam a level. `CS.validate` (in `js/data.js`) still tries every order of sends and rejects a level where the queues can jam for good (`CS.queueDeadlock`), which now only Linked Boxes can cause.
- `lockRelay` (level 15): `run.js` rejects a layout where any order of sends locks the front boxes of two or more queues at once (`CS.queueDeadlock(m, true)`). Level 15's relay was picked with a search over seeds, watch settings and lock spots.
- Level 18 skips the watch-the-belt rule (it came out too hard) and is checked like levels 11–14, with `maxRandom` (random taps win at most 75 %) so it does not get too easy.
- Level 21 (Clear Skies) is a breather after hard level 20: no elements, 6 colours, checked like an easy level (random taps win 90 % in every play mode). `FEAT` still lists it as a Hidden Box level so the later levels keep their hidden patterns.
- Level 22 (Block Door intro) has 2 queues. Level 23 keeps 3 queues, its Hidden Boxes and Block Door, but is checked like an easy level with 6 colours (random taps win 70 % in every play mode, and `minCasual` makes the casual player and the belt watcher win 90 %). Both use `noFailsafe`: the careful player must win without the play test's fail-safe. `maxSeed` now also lets a level that is not a watch-the-belt level search further.
- Level 26 is a breather after hard level 25: Linked Box and Block Door (no Locked Box), checked like level 23.
- Locked Items (`lockRun`, 3 on every Locked Item level): each lock covers the run of next-to-each-other rows of the same colour around the picked row, up to 3 rows. Level 27's random-tap bar is 80 % because the runs hold back more items.
- Level 28 (after the Locked Item intro) is checked like level 23 with 5 colours, and `lockRunOnly` puts its locks only on runs of 2 or more same-colour rows; level 34 has 4 Linked Box pairs.
- Level 39 (Cold Links) has Linked Boxes and Locked Items instead of Hidden Boxes and Block Door; `FEAT` still lists it as a Hidden Box level so level 40 keeps its hidden pattern. Level 40 locks 5 blocks of 3 to 4 same-colour rows (`lockRun` 4, `lockRunMin` 3).
- `KEEP` in specs.js: the seed each Locked Box / Locked Item level was built from before those rules changed. `run.js` tries it first, so a level keeps its boxes and rows and only its locks move when it still passes the checks; otherwise it searches as usual.
- Checks: levels 1–9 must win with random taps in every play mode (levels with a fixed `count` of boxes are checked over 300 runs; level 9 allows 99 % with `minRandom`); every level must be won by the careful player when boxes pick at the lowest point of the loop (the play test default) and when they pick anywhere.
  Levels 11–40 are longer: the casual player (careful, with 30 % random taps) must win 95 % of a medium level and 85 % of a hard one, and random taps half / a third of runs. A level that introduces an element is checked like levels 1–9 (random taps 90 %). When no seed passes, `run.js` retries with the rows closer to box order (a smaller window), then, for medium Block Door levels only, with a lower bar (casual 80 %).
  From level 15 (except the element intro levels) the player must watch the belt (`watch` in specs.js): random taps may win at most 35 % of a medium level and 25 % of a hard one, and a belt watcher (the casual player with 1 tap in 10 random) must win 90 % / 80 %. `run.js` tries the settings in `watchTries` from gentlest to hardest (7 colours, rows close to box order, long runs from one queue; then 8 colours and tighter settings) and keeps the first seed that passes; `maxSeed` lets a level search further (level 25).
  `OUT=file.json node run.js 11,12` writes the chosen levels to that file, so the levels can be built in a few processes at once and merged into `out.json`.

Running it again with the same specs gives the same levels. Editing a level in the tool and exporting it is fine; the generator is only for rebuilding the set.
