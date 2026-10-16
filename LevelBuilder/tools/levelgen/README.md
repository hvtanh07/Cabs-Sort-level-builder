# Level generator

Builds and checks the 40 element-unlock levels in `../../levels/` and `../../js/levels.js`. Needs Node.

```
node run.js        # build every level from specs.js and pick the first seed that passes the checks (writes out.json)
node verify.js     # bot runs on the chosen levels (writes verify.json)
node write.js      # writes levels/level_00NN.json and js/levels.js
```

- `specs.js`: one entry per level. Levels 1–10 are written by hand; 11–40 follow the level list sheet.
  The block at the end sets each level's length: `TOTAL` gives levels 1–10 in items, and levels 11–40 start at 368 items and grow by about 4 a level (hard +25 %, Block Door −10 to −20 %, element intro levels fixed at level 9's length); box counts follow from it.
  Level 13 is tuned by hand at the end of the 11–40 loop: `items` sets its length, `big3Share` its share of 32-item boxes, `tune` values applied after the shared rules (colours, window), `lockFrom` / `lockDepth` / `lockPerLane` / `lockPerDepth` place its Locked Boxes further back in the queues, `minRandom` raises the random-tap bar and `seed` starts the search at a picked seed.
  Hidden Boxes from level 14 use the level 7 and 8 patterns (`HIDDEN_PATTERN`), taking turns: staggered, then every even box, and so on.
  `count` sets a level's box count directly (levels 1, 2, 4, 5, 6, 8, 9), with `bigCount` or `bigAt` for its 24-item boxes; `bigAt` puts them at fixed places in the send order, so level 9 gets one per queue.
  Specs count boxes by tier (small, `big2`, `big3`, `big4`); `SIZE` in `gen.js` turns the tiers into 16 / 24 / 32 / 40-item boxes, saved as box `size` 1 / 2 / 3 / 4.
- `gen.js`: turns a spec into a level, plus the bots: random taps, and a careful player that waits when no box can fill.
- Locked Boxes (`gen.js`): never a front box at the start, never two next to each other in a queue or at the same depth in neighbouring queues, and each count is capped so the lock opens `lockMargin` sends (one per queue) before the box's turn in the send order. `CS.validate` (in `js/data.js`) also tries every order of sends and rejects a level where the queues can jam for good (`CS.queueDeadlock`).
- Checks: levels 1–9 must win with random taps in every play mode (levels with a fixed `count` of boxes are checked over 300 runs; level 9 allows 99 % with `minRandom`); every level must be won by the careful player when boxes pick at the lowest point of the loop (the play test default) and when they pick anywhere.
  Levels 11–40 are longer: the casual player (careful, with 30 % random taps) must win 95 % of a medium level and 85 % of a hard one, and random taps half / a third of runs. A level that introduces an element is checked like levels 1–9 (random taps 90 %). When no seed passes, `run.js` retries with the rows closer to box order (a smaller window), then, for medium Block Door levels only, with a lower bar (casual 80 %).
  From level 15 (except the element intro levels) the player must watch the belt (`watch` in specs.js): random taps may win at most 35 % of a medium level and 25 % of a hard one, and a belt watcher (the casual player with 1 tap in 10 random) must win 90 % / 80 %. `run.js` tries the settings in `watchTries` from gentlest to hardest (7 colours, rows close to box order, long runs from one queue; then 8 colours and tighter settings) and keeps the first seed that passes; `maxSeed` lets a level search further (level 25).
  `OUT=file.json node run.js 11,12` writes the chosen levels to that file, so the levels can be built in a few processes at once and merged into `out.json`.

Running it again with the same specs gives the same levels. Editing a level in the tool and exporting it is fine; the generator is only for rebuilding the set.
