# Corrections that survive refreshes — the system view

**The feature in one line:** Traceability stops storing "the tree" and stores two layers instead —
what suppliers **declared** (replaced by every refresh) and what the brand **corrected** (never
touched by a refresh). The tree people read is computed from both, and what we **publish** is a
frozen copy of that result.

## Where it plugs in (the blocks from the brief's §1)

```
  Brand app                        Supplier forms
      │ corrections                     │ declarations
      │                                 ▼
      │                             Inventory   (raw facts, supplier registry)
      │                                 │ refresh: the whole tree, stable ids
      ▼                                 ▼
  ┌─ Traceability ─────────────────────────────────────────┐
  │  corrections (kept)   +   declared layer (replaced)    │
  │                       │                                │
  │                       ▼  merged at read time           │
  │                 working tree ──publish──► versions     │
  │                 (live)                    (frozen)     │
  └────────────────────┬──────────────────────────┬────────┘
                       ▼                          ▼
                  Eco-design             Impact / LCA · Public page
               (live, what-ifs)          (published versions only)
```

- **Brand app** writes corrections only; it never edits declared data.
- **Inventory / the collection system** keep their contract — a whole tree per refresh — and never
  learn about corrections.
- **Impact / LCA and the public page** read **published versions** only: a communicated score or a
  QR code must point at something that cannot move.
- **Eco-design** is the one consumer that wants the live tree — and "simulate an edit" is the same
  overlay as a correction, just never saved. The merge could serve it as is.

## The decision to defend: corrections live in Traceability, not in Inventory

A correction is stored as an **overlay on the tree**, not written back into Inventory as a new
fact.

- **For:** Inventory stays the record of what suppliers said, untouched; a refresh can never
  overwrite a correction because it never sees one; dropping a correction is exact.
- **Against:** Inventory's other readers never see corrections — if anything besides Traceability
  reads supplier facts directly, it reads the uncorrected version.
- **The alternative:** store corrections in Inventory as brand-sourced facts with their own
  provenance, and let Traceability pick "brand beats supplier" when assembling. Better if many
  systems need corrected facts; heavier, because every reader must then understand provenance.

## What it would break, or change, for the neighbours

- **Consumers that read "the current tree"** must choose: a published version (score, public
  page — reproducible) or the working tree (eco-design simulations — live). Today they may not
  distinguish the two.
- **The tree contract gains provenance** (`DECLARED | CORRECTED` per value). Additive, but a
  public page may want to show it — or must decide not to.
- **Stable ids become load-bearing.** If the collection system ever re-issues ids for the same
  step, corrections silently go dormant; if it reuses an id for a different step, a dormant
  correction silently reattaches to the wrong thing. Both are invisible without monitoring.
- **"Last modified" changes meaning:** a tree can now change without any supplier answering.

## What it needs from its neighbours

- **Collection system:** stable item and step ids, whole trees (never patches), delivered in order
  with a `refreshedAt`, and a heads-up when ids are deliberately changed (a re-identification map).
- **Inventory:** the supplier registry and the process / material vocabularies as the source of
  truth, versioned — corrections are validated against them.
- **Consumers:** subscribe to a `VersionPublished { productId, number }` event (written through an
  outbox with the version) and fetch the snapshot by number.
- **Brand app / identity:** who made each correction, for audit — out of scope here, needed for
  real.

## What I would want to know before building it for real

1. **Should corrections flow back to suppliers?** A brand correction is high-quality data the
   supplier form got wrong. Is the long-term goal to feed it back (and let the correction retire
   once the declaration agrees), or do the two layers live side by side forever?
2. **How stable are ids in production, really?** The whole design leans on the brief's
   assumption. What happens today when a supplier re-submits a form from scratch?
3. **What does a correction need to be trusted?** For a digital product passport, "the brand says
   so" may not be enough: evidence attached, an approver, an expiry?
4. **Who owns dormant corrections?** A correction whose target disappeared needs a lifecycle —
   review, archive — and someone whose job it is.
5. **What are the volumes?** Trees per brand, nodes per tree, refreshes per day, versions kept
   forever? That decides snapshot-per-version versus storing layers and replaying them.
6. **Which consumers need the live tree at all?** If none, the working tree is a brand-app concern
   and everything downstream only ever sees versions — a simpler contract.
