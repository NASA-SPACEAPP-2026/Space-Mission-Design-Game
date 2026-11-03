# Modular Game API Contracts

Use one transactional modular API for a single-player game until independent deployment or scaling needs justify splitting services.

## What Happened

In Space-Mission-Design-Game task t3, the approved architecture had several game subsystems but all mission commands shared ownership, phase, resource, and test-readiness invariants. Separately deployed services would introduce consistency and deployment overhead without an evidence-backed need.

## Takeaway

Keep bounded application/domain modules behind a versioned HTTP DTO boundary and DAO/repository layer. Use server-authoritative commands, ETags/`If-Match` for stale-write detection, and idempotency keys for retryable writes. For consent-gated legacy imports, key-name detection may precede consent, but reading the stored value must wait for affirmative user action; retain the original value regardless of the import outcome.

## Example

`PUT /api/v1/missions/{id}/spacecraft/design` carries `If-Match` and a request DTO; the service validates domain rules and commits mission state plus the event record in one transaction.

## History
- 2026-11-03 (Space-Mission-Design-Game/t3): initial
