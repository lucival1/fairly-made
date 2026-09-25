# Fairly Made — Traceability Tree (take-home)

A small app and API to browse and correct a product's traceability tree, where the brand's
corrections survive the supplier-data refreshes that re-state the whole tree.

- The brief this repo answers: [`BRIEF.md`](./BRIEF.md)
- The system view for the debrief: [`docs/one-pager.md`](./docs/one-pager.md)
- How the 4 hours were spent: [`TIMEBOX.md`](./TIMEBOX.md)

## Where it stands

| Scenario (from the brief)                        | Status                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Browse my trees                                  | **Partly.** Product list with when each working tree last changed. The version columns need versions (below).                        |
| Edit a tree                                      | **Done.** Supplier, country, add a step, composition (rejected with a clear message unless it adds up to 100 %). No version created. |
| Versions                                         | **Designed, not built.** The diff it relies on is built and tested. See [versioning](#versioning--designed-not-built).               |
| My corrections survive a refresh                 | **Done.** Every value shows whether it is declared or corrected.                                                                     |
| …survive every later refresh; same refresh twice | **Done** by construction; proven in the domain and use-case tests.                                                                   |
| A refresh contradicts one of my corrections      | **Done, simply.** The correction wins, the new declared value is shown next to it, "Use declared" drops the correction.              |
| A refresh removes something I had corrected      | **Done.** The correction goes dormant: not applied, not deleted, listed on the screen, applied again if the target comes back.       |
| A published version does not move                | **Not built.** Guaranteed by the design: a version is a frozen copy, never a reference.                                              |

## How to run it

Requires Node 24 (`nvm use` picks it up from `.nvmrc`).

```bash
npm install
npm run dev      # API on http://localhost:3001/api, web app on http://localhost:3000
```

The web app proxies `/api/**` to the API, so open http://localhost:3000. Data lives in memory and
is re-seeded from [`data/`](./data) at every API start.

| Script                 | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | API (Nest, watch mode) + web (Nuxt) together |
| `npm test`             | Vitest suites (domain + API)                 |
| `npm run lint`         | oxlint (type-aware) over both apps           |
| `npm run format:check` | Prettier                                     |
| `npm run typecheck`    | `tsc` for the API, `nuxt typecheck` for web  |
| `npm run check`        | all of the above — run before every commit   |

**Two-minute tour of the refresh problem:**

1. Open **Marinière Manches Longues**.
2. Correct the **Dyeing** supplier: it gets a `Corrected` badge with the declared value next to it.
3. Correct the **Packaging** supplier.
4. Click **Simulate supplier refresh**:
   - the dyeing correction still stands, next to the _new_ declared value (Malhas do Ave S.A.)
   - holes the suppliers filled are taken as they come (finishing, fibre production, 185 g/m²)
   - packaging is gone from the declarations, so its correction is listed as dormant
5. Edit a composition to 98 %: the live total turns red and the API refuses it with its message.

## How I read the problem

A traceability tree is not one document — it's **two layers that change independently and on
different clocks**:

- a **declared layer**, rebuilt wholesale whenever the collection system's refresh arrives
- a **correction layer**, written by a human, that must outlive any number of refreshes

The "working tree" the user sees is never stored — it's the declared layer with corrections
overlaid at read time. This is the single decision the rest of the model follows from.

The holes in a tree are not errors, they are the brand's to-do list, so the screen leads with
them: a count of unknown values at the top and every unknown value marked in red.

## Model and architecture

**Entities** (stable identity, guaranteed by the brief to persist across refreshes): `Product`,
`Item` (discriminated union: `ProductItem | ComponentItem | MaterialItem`), `Step`, `Correction`.
`Version` is designed but not built.

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

- `seed-data` — the one place that knows where `data/` lives.
- `versions` — not built. It would depend on traceability's exported `GetWorkingTreeUseCase` only,
  and never need to know how the working tree is built.

Domain errors are mapped to HTTP by a single filter (`NotFoundError` → 404, any other broken rule
→ 400 with its message), so the domain never imports Nest.

**API** (REST, prefix `/api`). Every write answers with the new `{ tree, dormantCorrections }`, so
the UI re-renders from one response.

| Route                                            | What it does                                            |
| ------------------------------------------------ | ------------------------------------------------------- |
| `GET /products`                                  | Browse list, with `lastChangedAt`                       |
| `GET /products/:id/tree`                         | working tree + dormant corrections                      |
| `PUT /products/:id/steps/:stepId/:field`         | correct a step's supplier or country (`null` = unknown) |
| `PUT /products/:id/items/:itemId/composition`    | replace a composition; must add up to 100               |
| `POST /products/:id/items/:itemId/steps`         | add a step                                              |
| `DELETE /products/:id/corrections/:correctionId` | drop a correction, fall back to the declared value      |
| `POST /products/:id/refresh`                     | body = a full tree; empty body = replay the fixture     |
| `GET /reference`                                 | suppliers and vocabularies, for the pickers             |

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

**Front** — Nuxt (Vue 3, Composition API, client-side only), talking REST to the API through a
dev proxy (`/api/**` → port 3001):

- `pages/` — the product list (Browse) and one product's working tree.
- `services/traceability-api.ts` — the only place that knows the API's URLs and methods.
- `composables/useProductTree` — the tree as screen state (tree, busy, error, notice) and the
  actions on it, calling the service. Each action answers with the new tree, so the page simply
  re-renders. The page shares it with the recursive tree components through `provide` /
  `inject` (`provideProductTree` / `injectProductTree`) instead of passing it down every level.
- `components/` — atomic design, flat names (`pathPrefix: false`):
  - `atoms/` — `ProvenanceBadge` (Declared / Corrected), `UnknownValue`, `SupplierSelect`,
    `ProcessSelect` (only the processes `processes.json` lists for that kind of item),
    `CountryInput`
  - `molecules/` — `StepValue` (one value with its badge, the declared value when corrected,
    edit and "use declared"), `CompositionValue` (live total while editing), `AddStepForm`
  - `organisms/` — `TreeItem` (recursive; product, component and material cards collapse to a
    one-line summary, open by default), `StepCard`, `DormantCorrections`
- The screen leads with what is still unknown (✖, a pastel red row and a count at the top) — the
  brand's to-do list. Steps the user added are pastel yellow.
- Response types are copied by hand in `types/api.ts` for now (a shared package is on the next
  list).

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
tree is computed at read time by one pure function, `mergeTree(declared, corrections)`:

- correction's target still exists in the declared tree → **applied**, tagged `CORRECTED`; the
  current declared value is shown next to it, so the user sees when a refresh disagrees and can
  drop the correction to fall back to it
- correction's target no longer exists → **dormant**, kept in storage, not resurrected, not
  deleted; applied again if a later refresh brings the target back
- same refresh applied twice → no-op, since refresh only ever replaces the declared layer (the
  API doesn't even move `lastChangedAt`)
- the tenth refresh is no different from the first: the merge never looks at history

A composition is corrected as a whole: if the brand fixes 95/5 to 90/10, a refresh that later
fills in the elastane's origin stays hidden behind the correction until it is dropped. That is
coarser than per-line corrections, and deliberate: a composition is only valid as a whole.

### Cases not implemented, and what I would do

- **"The declaration changed since you corrected it."** Today the screen shows both values side
  by side. Storing the declared value each correction overrode (one field, captured when the
  correction is written — it cannot be recovered later) would let the merge tag a value
  `CONFLICTING` (the declaration moved) or `CONFIRMED` (the suppliers now agree, the correction can
  go).
- **A correction standing for two years against a branch that is long gone.** It stays dormant
  forever today. Next: record `dormantSince` when a refresh first misses the target, surface old
  dormant corrections in a review list, and archive (never silently delete) once a human confirms.
  The riskier case is the opposite one: a dormant correction reattaching because an id reappears
  for what is really a different thing — reattachments should be flagged for review too.
- **Two users editing at the same time.** Last write wins today (one in-memory process). Next: a
  version number on each product record, sent back by the client (ETag / If-Match), and a 409 on
  mismatch. Corrections are per field, so most concurrent edits touch different records and can
  be merged instead of refused. Corrections would also carry their author.
- **A tree 10× bigger.** The merge and the diff are linear in the number of nodes, with
  corrections indexed in maps, so 10× is fine for the domain. The cost moves to sending and
  rendering the whole tree on every write: answer with the changed item only, load items lazily,
  keep cards collapsed by default past a certain size.
- **The business rule turns out to be wrong.** It lives in one domain function
  (`assertValidComposition`) and only guards what users submit — declared data is never rejected —
  so changing it breaks nothing stored. Existing corrections that break a new rule are not
  rewritten; they would be flagged on read.

## Versioning — designed, not built

- A `Version` is `{ productId, number, publishedAt, snapshot }`, where the snapshot is a
  **deep copy of the working tree at publish time**, provenance included. It is append-only,
  never updated, so a published version cannot move under a later refresh or correction by
  construction — nothing points into the live layers.
- `number` increments per product; "latest" is the highest number.
- **"Changed since publication"** is `diffTrees(workingTree, latest.snapshot)` being non-empty — not
  a timestamp comparison, which would flag a correction that was made and then reverted, or a
  refresh that changed nothing.
- **"What changed against the one before"** is `diffTrees(previous.snapshot, version.snapshot)`.
  Ids are stable, so the diff is a flat, id-keyed comparison (added / removed / changed fields
  with before and after). **`diffTrees` is built and tested**, including the seeded refresh.
- **How it relates to corrections:** a version freezes the _result_ of the merge, not the two
  layers. Corrections keep living on the working tree after publication; dormant corrections are
  not in the snapshot because they are not applied.
- **Where it plugs in:** a `versions` module with its own repository port, depending only on
  traceability's exported `GetWorkingTreeUseCase`. The Browse list joins product summaries and
  latest versions in that module (or a small read endpoint), so traceability never learns about
  versions.

## Notes on the data

- `jacket-denim-brut.json`: the "Denim 12 oz" composition sums to **98 %**. Declared data is kept
  as it arrives; the sum-to-100 rule only applies to compositions the user submits.
- The refresh also changes the sewing thread's `usagePercentage` (8 → 6), which the brief's list
  of refresh changes doesn't mention.
- A material's origin is stated twice — on the material and on the component's composition line —
  and the refresh updates both. Only the composition is editable here.

## What I cut, and why

The brief puts the weight on the refresh scenarios, so the time went there first, then into
getting the structure right (hexagonal API, atomic front) and reviewing every step before it was
committed. That review cost time; I'd rather hand back less, verified, than more, unchecked.

- **Versions (publish, read-only past versions, the diff view, Browse's version columns).** The
  most visible cut. It's "the same question seen from the other end": the design above is a
  frozen copy plus the diff we already have, so it was the cheapest scenario to describe and the
  most expensive to rush.
- **The "declaration changed" flag** (`CONFLICTING` / `CONFIRMED`). Kept provenance to
  `DECLARED | CORRECTED` for a simple base; the screen shows both values instead.
- **Edge-case testing was relaxed to go faster.** The brief's scenarios are covered at the domain,
  use-case and HTTP levels. Not covered: malformed or partial seed data, deep or large trees,
  concurrent writes, composition rounding beyond one case, and the front end (no UI tests).
- **Typed vocabularies.** `process`, `rawMaterial` and `usageCategory` stay plain strings.
  `processes.json` calls itself a controlled vocabulary, "not a hard constraint to enforce", and a
  refresh must not be rejected because the collection system emits a new code. What the user
  submits is checked against the vocabulary instead. If those lists become a hard contract with
  the collection system, they can become union types.
- **Smaller edits:** a material's origin, removing a declared step, renaming items. Same
  correction mechanism, more shapes.
- **Uploading an arbitrary refresh from the UI.** The API accepts any full tree as the body; the
  button only replays the seeded one.
- **Persistence.** In memory, behind a repository port; a restart re-seeds.
- **A shared types package.** The front copies the API's response types by hand.
- **UI polish:** errors appear in a banner at the top rather than next to the field; dormant
  corrections can only name their step by id (the step is gone from the tree).
- **`GET /products` lives in traceability** until versions exist and take over the Browse list.

**Next, in order:** versions → the "declaration changed" flag → front-end tests and the edge cases
above → a database behind the existing port, with optimistic concurrency and correction authors →
a shared types package → a review flow for old dormant corrections → inline errors.

## Where I used AI, and where I did not

I had used both Nest and Nuxt before.

- **Planning** happened in a Claude.ai chat: reading the brief, the two-layer model, the
  architecture and tooling choices. It ended in a hand-off document, which Claude Code reviewed
  against the brief and the data before any code was written. That review caught real issues: a
  conflict-detection idea that would have flagged every correction as conflicting from day one,
  a port clash between Nest and Nuxt, missing deliverables.
- **Code generation** was done by Claude Code, one phase at a time, and **I reviewed and
  validated every change before it was committed** — that part I did not delegate. The history
  reflects it: small commits per concern, one PR per phase.
- **Where it sent me the wrong way:** the architecture it proposed was looser than I wanted. I
  had to ask for the explicit hexagonal split on the back (ports, one class per use case, adapters,
  one spec per use case) and atomic design on the front. At the start I also had to narrow the
  scope explicitly to keep execution simple. Testing came out light. Early on it committed and
  merged without waiting for my validation; I had that undone and made the rule explicit.
- **What review caught:** the add-step picker listed every process instead of those for the
  item's kind; "Your correction" claimed an author the app doesn't know; collapsing was put on
  steps instead of items; the API calls were inside the composable instead of their own service.
- **Where I did not use it:** deciding scope and what to cut, validating behaviour in the running
  app, and the final say on every commit.
