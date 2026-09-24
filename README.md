# Fairly Made — Traceability Tree (take-home)

> Draft skeleton — filled in as we build. Placeholders marked `TODO`.

## How to run it

Requires Node 24 (`nvm use` picks it up from `.nvmrc`).

```bash
npm install
npm run dev      # API on http://localhost:3001/api, web app on http://localhost:3000
```

The web app proxies `/api/**` to the API, so open http://localhost:3000.

| Script                 | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | API (Nest, watch mode) + web (Nuxt) together |
| `npm test`             | Vitest suites (domain + API)                 |
| `npm run lint`         | oxlint (type-aware) over both apps           |
| `npm run format:check` | Prettier                                     |
| `npm run typecheck`    | `tsc` for the API, `nuxt typecheck` for web  |
| `npm run check`        | all of the above — run before every commit   |

The brief this repo answers is in [`BRIEF.md`](./BRIEF.md). The seed data lives in [`data/`](./data)
and is loaded into memory at API boot.

## How I read the problem

A traceability tree is not one document — it's **two layers that change independently and on
different clocks**:

- a **declared layer**, rebuilt wholesale whenever the collection system's refresh arrives
- a **correction layer**, written by a human, that must outlive any number of refreshes

The "working tree" the user sees is never stored directly — it's the declared layer with
corrections overlaid at read time. This is the single decision the rest of the model follows
from.

## Model and architecture

**Entities** (stable identity, guaranteed by the brief to persist across refreshes):
`Product`, `Item` (discriminated union: `ProductItem | ComponentItem | MaterialItem`), `Step`,
`Correction`, `Version`.

**Values and rules** — plain types plus small guard functions in the domain, no value-object
classes (deliberately light for the timebox):

- country codes are ISO-2 or `null` (unknown); supplier ids must exist in the supplier registry
  or be `null`
- a user-authored composition must sum to exactly 100 % — declared data is taken as it comes
- **provenance** is `DECLARED | CORRECTED`, computed per field by the merge, never persisted.
  A corrected field also carries the current declared value, so the screen can show both.

**Backend** — NestJS modules, wired through dependency injection:

- `reference` — the supplier registry and the process / raw-material vocabularies. A read-only
  lookup with no rules of its own, so it stays flat (service + controller).
- `traceability` — declared trees, corrections, refresh. Hexagonal, kept light:

  ```
  traceability/
  ├── domain/          pure types + rules: merge, diff, validation. No framework imports.
  ├── application/
  │   ├── ports/       interfaces the use cases need: ProductRepository, ReferenceCatalog
  │   ├── use-cases/   one class per user action (CorrectStepField, ApplyRefresh, …)
  │   └── shared/      the load → change → save cycle and helpers every use case reuses
  └── infrastructure/  adapters: HTTP controller + request parsing, in-memory repository,
                       seeding and the demo refresh fixtures
  ```

  Dependencies only point inwards: infrastructure → application → domain. Ports are bound to
  adapters in `traceability.module.ts`; swapping the in-memory store for a database is one
  provider line.

- `versions` — publishes and reads versions. It asks `traceability` for the working tree and
  never needs to know how that tree is built.
- `seed-data` — the one place that knows where `data/` lives.

Domain errors are mapped to HTTP by a single filter (`NotFoundError` → 404, any other broken rule
→ 400 with its message), so the domain never imports Nest.

**Tests** — where they earn their place:

- `domain/*.spec.ts` — the merge, diff and validation rules against the real seed data, including
  every refresh scenario from the brief. This is where the design is proven.
- `application/use-cases/*.spec.ts` — one spec next to each use case, run through the real module
  graph (in-memory adapter), which also checks the DI wiring.
- `infrastructure/http/*.spec.ts` — the HTTP adapter on a real port: routes, request parsing,
  error-to-status mapping, the fixture replay.
- No dedicated tests for `reference` and `seed-data`: they only read JSON files and hold no
  rules, and both are exercised by the specs above (supplier/process checks, `GET /reference`,
  seeding). They would earn tests once they gain behaviour — e.g. a supplier registry fed by an
  external system.

**Front**: Nuxt (Vue 3, Composition API, client-side only), talking REST to the API through a
dev proxy.

## How a correction survives a refresh

A `Correction` is a standalone record kept in its own store, never touched by a refresh. Three
shapes:

- `FIELD_OVERRIDE` — `{ stepId, field: 'supplierId' | 'countryCode', value }` (value may be
  `null`, i.e. "unknown")
- `COMPOSITION_OVERRIDE` — `{ itemId, value }`, a component's whole composition array, validated
  to sum to 100
- `ADDED_STEP` — `{ itemId, step }`, a step with no declared counterpart, using our own id space
  (`cor_stp_…`) so it can never collide with a future refresh id

A refresh replaces the declared layer wholesale — it never touches corrections. The working
tree is computed at read time:

- correction's target still exists in the declared tree → **applied**, tagged `CORRECTED`; the
  current declared value is shown next to it, so the user sees when a refresh disagrees and can
  drop the correction to fall back to it
- correction's target no longer exists → **dormant**, kept in storage, not resurrected, not
  deleted
- same refresh applied twice → no-op, since refresh only ever replaces the declared layer

Next step, not built: store the declared value each correction overrode, so the screen can say
"the declaration _changed_ since you corrected it" (`CONFLICTING`) or "now agrees with you"
(`CONFIRMED`), instead of only showing both values.

`TODO`: note what I'd do for the cases not implemented (correction standing for years against a
long-gone branch, concurrent edits, 10x scale).

## How I did versioning

A `Version` is a frozen, fully-materialized snapshot of the working tree at publish time — a
copy, not a reference — so a published version cannot move under a later refresh by
construction. `number` increments per product; "latest" = highest number.

Items and steps keep stable ids, so comparing two trees is a flat, id-keyed diff (added /
removed / changed fields). The same diff powers the "what changed against the previous version"
view and the "working tree has unpublished changes" flag on the product list.

## Notes on the data

- `jacket-denim-brut.json`: the "Denim 12 oz" composition sums to **98 %**. Declared data is kept
  as it arrives; the sum-to-100 rule only applies to compositions the user submits.
- The refresh also changes the sewing thread's `usagePercentage` (8 → 6), which the brief's list
  of refresh changes doesn't mention.

## What I cut, and why

`TODO` — filled in at the end against the actual 4h clock.

Running list, kept as we go:

- **Typed vocabularies.** `process`, `rawMaterial` and `usageCategory` stay plain strings.
  `processes.json` calls itself a controlled vocabulary, "not a hard constraint to enforce", and a
  refresh must not be rejected because the collection system emits a new code. What the user
  submits is checked against the vocabulary instead. If those lists become a hard contract with
  the collection system, they can become union types.

## Where I used AI

`TODO`.
