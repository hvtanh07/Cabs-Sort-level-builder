# Cap Sort Level Builder

A level design tool for Caps Sorting. Open `index.html` in Chrome or Edge. No install or build step.

## What it does

- **Level list** (left): new, duplicate, delete, search, drag to reorder. Levels save in the browser automatically.
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
- **Import / Export**: level JSON in the `demo.json` layout. Export all gives a zip (or one bundle JSON when offline).
- **Conveyors**: your six premade conveyors are built in, and more can be imported (see below).

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

Same layout as `demo.json` (formatVersion 4). Notes:

| Field | Meaning in the tool |
| --- | --- |
| `feeders[]` | Enter Paths. `bottles` is a flat list read in rows of 4. Row 0 enters the conveyor first. |
| `feeders[].hiddenRows` | Rows whose items show "?" until they reach the conveyor. |
| `feeders[].lockedRows` | Locked Items: `{ row, lockTurns }`. |
| `lanes[][]` | Queues. Box 0 is the front box. `size × trayCapacity` = items the box holds. |
| `lanes[][].hidden` / `lockTurns` | Hidden Box / Locked Box. |
| `links` | Linked Boxes: `{ a: { lane, tray }, b: { lane, tray } }`. |
| `slotLocks` | Locked Slot: `{ slot, lockTurns }`. |
| `extraSlots` | RV slots the player can unlock with an ad. |
| `colors` | Filled automatically from the colours used. |

Fields the GDD needs that `demo.json` does not show. Rename them if the game uses other names:

| Added field | Meaning |
| --- | --- |
| `feeders[].entry` | `"left"`, `"middle"` or `"right"`: which conveyor entry the Enter Path joins. When missing on import: 1 path = middle, 2 = left + right, 3 = all. |
| `feeders[].doorShut` | Block Door: this door starts shut. |
| `doorTurns` | Block Door countdown. At 0, shut doors open and open doors shut, then it restarts. |
| `blockedLane` | Block Queue: `{ lane, lockTurns }`. At 0 the block moves to the next queue that still has boxes. |

Unknown fields are kept as they are on export.

## Conveyor config

The six premade conveyors (Rounded square 42, Large oval 32, Bean 42, Lens 42, Heart 44, Triangle 28) are built in.
They live in `conveyors/` and are bundled into `js/conveyors.js` so the page works offline.
Use **Conveyors → Import conveyor JSON** for new ones; imported configs are kept in the browser.

The tool reads the game format (formatVersion 2):

- `loop.nodes`: the belt loop in travel order, `x` / `z` in game units (z points up the screen).
- `rows`: belt length in rows; `width`: items per row (4).
- `feeders[]`: `side` (left / middle / right), `mergeAt` (the loop row where it joins), `nodes` (the Enter Path track, drawn up to the merge point).
- `pickRows`: rows from the start of the loop where boxes pick items when **Pickup zone** is ticked.
- `scale` is kept but not used for drawing. `meta.name` is the display name.

A level's `conveyor` field must match a config `id`. A simpler shape format (`shape`: roundrect / circle / points / svg plus `entries`) also imports.

To add a new premade conveyor permanently, put its JSON in `conveyors/` and add it to `js/conveyors.js` (or just import it in the tool).

## Rules the GDD leaves open (defaults used in play test)

- Boxes in slots pull matching items from anywhere on the belt, one item per box per conveyor step.
  Tick **Pickup zone** to only pull from the first `pickRows` rows of the loop.
- Enter Paths join the loop at `mergeAt / rows` of the way around, measured from the first loop node.
- The level starts with the conveyor already filled from the Enter Paths (one full loop).
- Hidden Enter Path rows show their colour once the items reach the conveyor.
- Boxes already at the front of a queue when the level starts are revealed.
- Lose = every free slot is taken and nothing has moved for a full loop. Win = every box cleared.
- Hand does not count as a box sent, so it does not lower lock counters.
- Shuffle moves at most one box per chosen colour, each to the top of a different queue.
