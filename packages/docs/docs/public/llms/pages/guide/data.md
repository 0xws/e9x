<!-- Generated from guide/data.md; edit the source document instead. -->

# Data ownership, transactions and migrations

PostgreSQL is the default transactional source of truth. Drizzle is an infrastructure adapter. Feature modules own schema definitions; a central schema aggregator feeds a centrally ordered migration history.

## Rules

- Use database constraints for uniqueness, references and invariants that must survive concurrent requests.
- Use explicit transaction boundaries in application use cases.
- Use optimistic concurrency/version columns where lost updates are unacceptable.
- Index measured query patterns; inspect expensive query plans.
- Bound result sets and prevent N+1 access patterns.
- Parameterize SQL and review raw SQL.
- Run migrations as a controlled release step, not from every application replica at startup.
- Rehearse backups and restores.

## Expand-contract migration lifecycle

1. Expand the schema compatibly.
2. Deploy code that tolerates old and new schema versions.
3. Backfill in bounded, observable batches.
4. Switch reads and writes.
5. Verify data and telemetry.
6. Remove obsolete schema in a later release.

A rollback is not always a safe inverse migration. Document forward recovery and data-loss risks.

## Transactional outbox

When a committed database change must publish an event, insert the business change and outbox record in the same transaction. A worker publishes pending records and marks delivery. Assume at-least-once delivery and make consumers idempotent; do not casually claim exactly-once behavior.

## Do not over-engineer

Do not introduce a message broker, event sourcing, CQRS read database or Redis without a real requirement.
