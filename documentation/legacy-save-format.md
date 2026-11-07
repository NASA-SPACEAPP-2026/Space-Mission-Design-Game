# Save format (`gng32.save`)

## Storage

The game is client-side only. There is no SQL database, ORM or backend model. The complete
mutable game object is stored as JSON at `localStorage['gng32.save']`. The root object is
initialized with `v: 32`; the loader accepts a parsed object only when `v === 32`.

Separate browser keys:

- `gng32.save` — game state.
- `gngLang` — language selection (`it` or `en`).

There is no server-side save, account or cross-device synchronization. Clearing site data
removes the game.

## Root fields

The initial object created by `newG()` contains:

| Field | Meaning |
|---|---|
| `v` | Save format/version (`32`) |
| `co` | Agency name |
| `money`, `xp`, `sciTotal` | Credits, progression experience, cumulative science |
| `staff`, `recruited` | Staff count and recruited organizations/sponsors |
| `missions`, `cur` | Mission collection and selected mission index |
| `world`, `plots`, `pad`, `lab`, `labPos`, `rooms` | Campus, buildings, lab, test facilities and placement state |
| `tut`, `tutDone`, `sandbox`, `diff` | Tutorial, completion, sandbox and difficulty state |
| `speed`, `vt`, `lastReal` | Simulation speed and clock bookkeeping |
| `myBoard`, `flag`, `cedit`, `fresh` | Board, customization and unlock state |

Mission entries are nested objects extended as the game progresses: requirements, stakeholder
support, satellite component placements, launch/orbit configuration, phase/test/flight status
and reports. The nested shape is not a declared schema; the source uses mutable objects with
optional fields.

## Write and recovery

- The `save()` function serializes the whole `G` object into the single key.
- Every write replaces the previous value; there is no transaction boundary.
- Unsupported or corrupt JSON is caught by `load()` and treated as unavailable.
- If the saved object cannot be opened, the startup screen offers to clear the `gng*` keys and
  start again.
- The save is compatible with the previous single-file `Go-No-Go_beta.html` game. The current
  shell is `index.html` and the save code lives in `public/game/07-main.js`; the old
  `app/frontend/public/legacy-game.html` copy was removed.
