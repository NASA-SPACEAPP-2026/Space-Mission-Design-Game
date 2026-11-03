# MySQL Game State and Consent Import

Use owner-scoped relational rows for identity/lifecycle and versioned JSON aggregates for evolving game state; never inspect a legacy browser save before explicit consent.

## What Happened
For Space-Mission-Design-Game task t4, the v32 legacy `gng32.save` was a single mutable object with `missions[]` and a `cur` array index, while the target requires account-owned MySQL state. A relational projection plus versioned agency/mission JSON preserves the deep and unknown game fields without making every optional legacy field a table column. Keep decisions/events, test attempts, and final reports as transactionally consistent records alongside the current mission snapshot. The importer must read only after consent, validate the full nested DTO, map mission indexes to new IDs, and commit agency, missions, and one-time import ledger atomically.

## Takeaway
Use an explicit consent version and idempotency key; lock the account and reject overwrites; use canonical source digests for replay detection; preserve extension fields, and keep the original browser key unchanged on every result. Keep mission state snapshots and append-only decision/test records synchronized in one transaction. MySQL DDL implicitly commits, so migration runners need resumable, postcondition-checked migrations rather than pretending DDL is rollbackable.

## History
- 2026-11-03 (Space-Mission-Design-Game/t4): initial
