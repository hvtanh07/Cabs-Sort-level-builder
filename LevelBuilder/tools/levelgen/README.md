# Level generator

Builds and checks the 40 element-unlock levels in `../../levels/` and `../../js/levels.js`. Needs Node.

```
node run.js        # build every level from specs.js and pick the first seed that passes the checks (writes out.json)
node verify.js     # bot runs on the chosen levels (writes verify.json)
node write.js      # writes levels/level_00NN.json and js/levels.js
```

- `specs.js`: one entry per level. Levels 1–10 are written by hand; 11–40 follow the level list sheet.
  `EXTRA` at the end sets how many items each level has beyond the belt's spots (the items still waiting in the Enter Paths once the belt is full); box counts follow from it.
  `count` sets a level's box count directly (levels 1, 2, 4, 5, 6, 8, 9), with `bigCount` or `bigAt` for its 24-item boxes; `bigAt` puts them at fixed places in the send order, so level 9 gets one per queue.
  Specs count boxes by tier (small, `big2`, `big3`, `big4`); `SIZE` in `gen.js` turns the tiers into 16 / 24 / 32 / 40-item boxes, saved as box `size` 1 / 2 / 3 / 4.
- `gen.js`: turns a spec into a level, plus the bots: random taps, and a careful player that waits when no box can fill.
- Checks: levels 1–9 must win with random taps in every play mode (levels with a fixed `count` of boxes are checked over 300 runs; level 9 allows 99 % with `minRandom`); every level must be won by the careful player when boxes pick at the lowest point of the loop (the play test default) and when they pick anywhere.

Running it again with the same specs gives the same levels. Editing a level in the tool and exporting it is fine; the generator is only for rebuilding the set.
