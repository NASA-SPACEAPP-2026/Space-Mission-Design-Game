# Legacy save format (`gng32.save`)

## Storage locations

No SQL database, ORM, or backend model is present in the current repository. The legacy browser application persists its complete mutable game object as JSON at `localStorage['gng32.save']`. The root object is initialized with `v: 32`; the legacy loader accepts a value only when parsed JSON has `v === 32`.

The PlayCanvas shell does not deserialize the game object. It checks whether the key exists to enable/disable “Load Game”; the actual load happens inside `Go-No-Go.html`. Thus key presence is not proof that the value is parseable or loadable.

Separate browser keys:

- `gng32.save` — legacy game state.
- `gngLang` — legacy language selection (`it` or `en`).
- `space-mission-settings` — PlayCanvas shell settings (`sensitivity`, `walkSpeed`).

## Root game-state fields observed

The initial legacy object created by `newG()` contains:

| Field | Current meaning inferred from initialization/use |
|---|---|
| `v` | Save format/version (`32`) |
| `co` | Agency name |
| `money`, `xp`, `sciTotal` | Credits, progression experience, cumulative science |
| `staff`, `recruited` | Staff count and recruited organizations/sponsors |
| `missions`, `cur` | Mission collection and selected mission index |
| `world`, `plots`, `pad`, `lab`, `labPos`, `rooms` | Campus/building/lab/test facilities and placement state |
| `tut`, `tutDone`, `sandbox`, `diff` | Tutorial, completion, sandbox, and difficulty state |
| `speed`, `vt`, `lastReal` | Simulation speed and simulation-clock bookkeeping |
| `myBoard`, `flag`, `cedit`, `fresh` | Additional board/customization/unlock state |

Mission entries are nested objects extended as the game progresses, including mission requirements, stakeholder/support state, satellite component placements, launch/orbit configuration, phase/test/flight status, and reports. The exact nested field set is not declared as a schema; source code uses mutable objects with optional fields.

The persisted key is written by `save()` at `Go-No-Go.html:3354`; `render()` calls `save()` at `Go-No-Go.html:5731`. The entire `G` object is serialized, with no server transaction, schema validation at write time, or cross-device synchronization.

## Relationships and transaction boundaries

- `G.missions[]` is embedded in the single root object; `G.cur` selects an entry by array index.
- Campus, facilities, staff, budget, unlocks, and all missions are serialized together; there are no relational foreign keys or normalized tables.
- Writes replace the whole localStorage value. No database transaction boundary exists.
- Corrupt/unsupported JSON is caught by `load()` and treated as unavailable; unsupported-version recovery is handled in the startup path.

The game source is `app/frontend/public/legacy-game.html`.
