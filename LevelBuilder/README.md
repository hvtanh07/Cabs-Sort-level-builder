# Cap Sort Level Builder

A level design tool for Caps Sorting. Open `index.html` in Chrome or Edge. No install or build step.

## What it does

- **Level list** (left): new, duplicate, delete, search, drag to reorder, ⧉ copies a level's JSON without opening it. Levels save in the browser automatically.
  **Open folder** (Chrome / Edge) loads every level JSON in a folder and Ctrl+S writes the open level back to it.
- **Board** (centre): the three Enter Paths (left, middle, right) above the conveyor, the slots, and the queues.
  - Paint items into Enter Path rows (Paint tool, drag across cells, right-click clears a cell).
  - Add, recolour, resize, hide, lock, link and drag boxes between queues.
  - The conveyor shows the start state: the items that are already on the belt when the level begins.
- **Inspector** (right): Level settings, the selected object, and a Check tab with errors, colour balance
  and a 20-run bot solvability check.
- **Play test**: plays the level with the GDD rules: sending boxes, Hidden / Locked / Linked Box, Locked Item,
  Block Door, Block Queue, Locked Slot, the fail-safe, win / lose, Revive, RV slots and the Hand, Shuffle and Magnet boosters.
  Auto play, step and speed controls help check a level quickly.
- **Import / Export**: level JSON in formatVersion 5 (older formatVersion 4 files still import). Export all gives a zip (or one bundle JSON when offline).
- **Conveyors**: your six premade conveyors are built in, and more can be imported (see below).

## Bundled levels

The 40 element-unlock levels (`levels/`, notes and checks in `levels/README.md`) load into the level list automatically the first time the tool opens.
If a level of yours already used one of their ids, yours stays in the list under the next free id, and a message says which one moved.
When `js/levels.js` changes, levels you have not edited are updated and your edited ones are kept.
**Reset levels** (top bar) throws away the edits kept in the browser and loads the open level, or all 40, again from `js/levels.js`; it can also remove the levels you made yourself.
`tools/levelgen/` rebuilds the set with Node.

## Design flow

1. **New level** opens a short wizard: name, id, difficulty, slots, conveyor, and empty queues or a random draft.
2. **Add boxes**: pick a colour (keys 1–8) and click **+** under a queue, or right-click a queue → *Type the boxes…*
   and enter codes such as `1 2x2 3h 4L3` (colour, `x` size, `h` hidden, `L` lock turns).
3. **Add items**: press **Fill items from boxes**, paint rows, or type rows in the Selected tab (`5` = four of colour 5, `1122` = one per item).
4. **Balance**: the bar under the toolbar shows every colour. A red chip is off; click it for a one-click fix
   (add or remove items, or add boxes). The guide on the right always says the next step.
5. **Play test** when the guide turns green.

Right-click boxes, rows, slots and queue headers for quick actions. Double-click a level in the list to rename it.
Inspector sections fold away and remember their state. Press **?** for all shortcuts.

## Level JSON

formatVersion 5. Older files (formatVersion 4: `feeders` as a list with `entry`, plus `trayCapacity`) import fine and are saved in the new layout. Notes:

| Field | Meaning in the tool |
| --- | --- |
| `$schema` | Always written first as `../../../../../docs/design/level.schema.json`. |
| `meta` | `name`, `difficulty` and optional `notes`. Older files with `meta.intro` import fine: it becomes `meta.notes`, and `meta.unlock` / `meta.booster` are dropped. |
| `feeders` | Enter Paths, keyed by the conveyor entry they join: `"left"`, `"middle"` or `"right"`. `bottles` is a flat list read in rows of 4. Row 0 enters the conveyor first. |
| `feeders.<entry>.hiddenRows` | Rows whose items show "?" until they reach the conveyor. Left out when empty. |
| `feeders.<entry>.lockedRows` | Locked Items: `{ row, lockTurns }`. Left out when empty. |
| `lanes[][]` | Queues. Box 0 is the front box. `size` sets the items the box holds: 1 = 16, 2 = 24, 3 = 32, 4 = 40 (no `size` = 1). There is no `trayCapacity`. Older files that used `size × trayCapacity` are converted on import. |
| `lanes[][].hidden` / `lockTurns` | Hidden Box / Locked Box. |
| `links` | Linked Boxes: `{ a: { lane, tray }, b: { lane, tray } }`; the two boxes sit in neighbouring queues. Left out when there are none. |
| `slotLocks` | Locked Slot: `{ slot, lockTurns }`. Left out when no slot is locked. |
| `extraSlots` | RV slots the player can unlock with an ad. |
| `colors` | Filled automatically from the colours used. |

Other fields the tool writes when a level uses them:

| Added field | Meaning |
| --- | --- |
| `blockDoor` | Block Door: `{ "turns": 5, "doors": [{ "feeder": "left", "open": false }, { "feeder": "right", "open": true }] }`. `turns` is the countdown (boxes sent); at 0, shut doors open and open doors shut, then it restarts. `doors` lists each Enter Path's door and whether it starts open. Written after `extraSlots`. Older files with `doorTurns` and `feeders.<entry>.doorShut` import fine and are saved in this layout. |
| `blockedLane` | Block Queue: `{ lane, lockTurns }`. At 0 the block moves to the next queue that still has boxes. |

Unknown fields are kept as they are on export.

## Conveyor config

The six game conveyors (Rounded square 19, Large oval 14, Bean 18, Lens 18, Heart 30 rows (`heart_21`), Triangle 12) are built in. Levels that name the larger configs used before (`square_42`, `bean_42`, `lens_42`, `heart_44`, `triangle_28`, `oval_32`) are moved to these when they load.
They live in `conveyors/` and are bundled into `js/conveyors.js` so the page works offline.
Use **Conveyors → Import conveyor JSON** for new ones; imported configs are kept in the browser.

The tool reads the game format (formatVersion 2):

- `loop.nodes`: the belt loop, `x` / `z` in game units (z points up the screen). The belt runs counter-clockwise on screen whichever way the nodes are listed; add `"direction": "cw"` to a config to make it run clockwise.
- `rows`: belt length in rows; `width`: items per row (4).
- `feeders[]`: `side` (left / middle / right), `mergeAt` (the loop row where it joins), `nodes` (the Enter Path track, drawn up to the merge point).
- `pickRows`: rows from the first loop node (in the listed node order) where boxes pick items when **Pickup → Pickup zone** is chosen.
- `scale` is kept but not used for drawing. `meta.name` is the display name.

A level's `conveyor` field must match a config `id`. A simpler shape format (`shape`: roundrect / circle / points / svg plus `entries`) also imports.

To add a new premade conveyor permanently, put its JSON in `conveyors/` and add it to `js/conveyors.js` (or just import it in the tool).

## Rules the GDD leaves open (defaults used in play test)

- Boxes in slots pull items only as they pass the lowest point of the conveyor loop (marked with a yellow dashed line).
  A box takes every matching item in the row passing that point, up to what it still needs; the first slot goes first.
  The **Pickup** menu in play test also offers the older rules: **Pickup zone** (the first `pickRows` rows of the loop)
  and **Anywhere** (one item per box per step from anywhere on the belt).
- The belt runs counter-clockwise.
- Enter Paths join the loop at `mergeAt / rows` of the way around, measured from the first loop node in the listed order.
- The level starts with the conveyor already filled from the Enter Paths (one full loop).
- Hidden Enter Path rows show their colour once the items reach the conveyor.
- Boxes already at the front of a queue when the level starts are revealed.
- Lose = every free slot is taken and nothing has moved for a full loop. Win = every box cleared.
- The "every box sent" fail-safe only counts a shut door if items are still waiting behind it.
- Hand does not count as a box sent, so it does not lower lock counters.
- Shuffle moves at most one box per chosen colour, each to the top of a different queue.
