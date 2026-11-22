<!-- Generated from guide/features.md; edit the source document instead. -->

# Feature modules and ownership

A feature owns its domain model, use cases, persistence adapters, transport routes, UI components and tests. Its `index.ts` is the public entry point.

## Ownership rules

1. One writer per feature directory per implementation task.
2. A feature may not import another feature's implementation details.
3. Shared modules require a stable semantic concept and real consumers.
4. Shared infrastructure changes require coordinator review.
5. Avoid circular dependencies between features.

## Application use case example

```ts
export class CompleteMission {
  constructor(
    private readonly missions: MissionRepository,
    private readonly transactions: TransactionPort,
  ) {}

  async execute(input: { missionId: string; actorId: string }) {
    return this.transactions.run(async (tx) => {
      const mission = await this.missions.getForUpdate(input.missionId, tx)
      mission.complete(input.actorId)
      await this.missions.save(mission, tx)
      return { id: mission.id, status: mission.status }
    })
  }
}
```

The example illustrates a use-case boundary. A real implementation must define error handling, authorization context, transaction semantics and repository contracts for the application's domain.

## Feature completion checklist

- Domain invariants and failures are tested.
- External inputs are validated by transport schemas.
- Use cases own orchestration and transaction boundaries.
- Database rows are mapped to intentional DTOs.
- Permissions are declared and tested.
- Feature public API is intentional.
- Architecture and quality gates pass.
