**English** | [Italiano](legacy-save-format.it.md)

# Local saves and the `gng32.save` format

[Index](README.md) · [Account database](authentication.md)

## Where missions live

The game serializes its mutable JavaScript state to JSON under `localStorage['gng32.save']`. The reference implementation is [`public/game/07-main.js`](../public/game/07-main.js), particularly `newG()`, `save()`, and `load()`.

This document retains its historical filename, but the format described is still in current use. PostgreSQL exists for accounts; **the DB does not hold a copy of the game**.

`localStorage` belongs to an origin and browser profile. `http://localhost:5173`, `http://localhost:8080`, and an HTTPS domain have separate storage. Different browsers and profiles also separate saves. Persistence under `file://` is browser-dependent and is not a synchronization mechanism.

## Storage keys

| Key | Contents |
| --- | --- |
| `gng32.save` | Main game state |
| `gngLang` | Selected language, `it` or `en` |
| `gngQ` | Last graphics quality level |
| `gngPrev` | Temporary prior-game snapshot when entering the tutorial from an existing game |

These are not credentials. The account session token uses the `gng_session` cookie instead.

## Version and structure

`newG()` initializes `v: 32`. `load()` returns data only when JSON parsing succeeds and `v === 32`; otherwise it returns `null`. The version check does not validate every nested property.

| Initial fields | Meaning |
| --- | --- |
| `v` | Save version, 32 |
| `co`, `flag`, `cedit`, `myBoard` | Agency name, customization, and UI state |
| `money`, `xp`, `sciTotal`, `staff` | Economy, experience, science, and staff |
| `missions`, `cur` | Mission collection and selected index |
| `world`, `plots`, `pad` | Campus, placements, and infrastructure |
| `lab`, `labPos`, `rooms` | Labs, positions, and rooms |
| `recruited`, `fresh` | Recruited organizations and unlock state |
| `tut`, `tutDone` | Active tutorial and completion |
| `speed`, `vt`, `lastReal` | Simulation speed, virtual time, and real-time reference |

Other properties, including sandbox, difficulty, avatar, crew, and music, are added by UI flows during gameplay. They are not all present in the initial object.

Missions are mutable objects with optional requirements, stakeholders, component placements, orbit, launcher, tests, operational phase, and reports. GMAT results may also be stored in a mission. This guide is not an exhaustive nested schema: inspect both readers and writers before changing a field.

## Writing, loading, and recovery

`save()` calls `payPhase()` before serializing all of `G`. It is therefore not a pure copy operation: economic phase logic runs before the write.

Each write replaces the previous key value. There is no history, multiple-save system, or shared transaction with PostgreSQL. Serialization and storage errors are caught silently; quota exhaustion or blocked storage can prevent persistence.

Unreadable JSON and other versions are ignored by `load()`. If startup later fails, a recovery screen offers to restart: that path removes keys beginning with `gng` and clears `sessionStorage`. Main-menu deletion behaves differently and retains `gngLang`.

There is no general cross-version migrator. Do not assume every historical save is compatible simply because its version number matches.

## Manual backup before changes

In browser developer tools, **on the origin where you play**, read:

```javascript
localStorage.getItem('gng32.save')
```

Copy the resulting JSON into a text file. To restore a trusted, inspected v32 backup:

```javascript
const backup = /* paste your backup JSON object here */;
if (backup?.v !== 32) throw new Error('Unsupported save version');
localStorage.setItem('gng32.save', JSON.stringify(backup));
location.reload();
```

Restoring replaces that origin's current game; first back up the existing value too. Do not paste scripts from untrusted sources into developer tools.

## Relationship to accounts

Sign-in is required before game startup, but the v32 format is unchanged. First-time agencies use the username; existing saves are preserved. [Entry and accounts](entry-flow.md).


Login, logout, and account switching neither transfer nor erase the save. Two accounts on the same profile and origin use the same local game. Removing cookies does not necessarily remove saves; clearing site data can remove both.

A PostgreSQL backup preserves accounts, not missions. Cloud saves require new implementation: user association, protected APIs, conflict handling, and local-data migration.
