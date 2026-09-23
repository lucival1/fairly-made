# Fairly Made — Technical test

Hi, and thanks for taking the time.

This is a **take-home exercise with a live debrief**. It is deliberately open: we are much
more interested in *how you framed the problem and why you made your calls* than in how many
boxes you ticked. There is no hidden "right answer" and no trick.

**Timebox: 4 hours.** We mean it — we would rather read 4 hours of well-reasoned,
well-explained work than 12 hours of features. Stop at 4h and write down what you would have
done next.

---

## At a glance

| | |
|---|---|
| **What** | Design and build a small web app + backend to browse, read, edit and version a product's *traceability tree* |
| **Timebox** | 4 hours of work |
| **Lead time** | a week from when you receive this |
| **Deliverables** | A public GitHub repo on your own account + a written one-pager (or ≤ 5 slides) + a `TIMEBOX.md` with 5 lines on how you managed your time over those 4 hours |
| **Stack** | Imposed: **Nuxt (Vue 3)** front, **NestJS** back, **TypeScript** throughout. See [Stack](#stack) |
| **AI tooling** | Encouraged. See [Using AI](#using-ai) |
| **Debrief** | ~1 hour with the tech team, no code written live |

---

## 1. Who we are, in one minute

**Fairly Made** helps fashion brands understand and prove where their products actually come
from. A brand sends us what it knows about a product, we go and collect the rest from its
suppliers, and out of that we build a trustworthy picture of the supply chain — which we then
turn into an environmental impact score, and the digital product passport a customer scans in
store.

The object that sits in the middle of all of this is the **traceability tree**. Nearly
everything we sell is computed from it. That is the object you are going to work on.

### How the system is laid out

Simplified to the blocks that matter for this exercise:

```
   ┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
   │  Brand app   │        │  Supplier forms  │        │   Public page    │
   │ (what you're │        │  (what suppliers │        │  (what the end   │
   │  building)   │        │   declare to us) │        │  customer scans) │
   └──────┬───────┘        └────────┬─────────┘        └────────▲─────────┘
          │                         │                           │
          ▼                         ▼                           │
   ┌─────────────────────────────────────────┐                  │
   │              Inventory                  │                  │
   │  products, components, suppliers, the   │                  │
   │  raw declared facts                     │                  │
   └────────────────────┬────────────────────┘                  │
                        │                                       │
                        ▼                                       │
   ┌─────────────────────────────────────────┐                  │
   │            Traceability                 │──────────────────┘
   │  assembles the facts into a *tree*,     │
   │  the shareable view of one product      │
   └────────────────────┬────────────────────┘
                        │
            ┌───────────┴────────────┐
            ▼                        ▼
   ┌─────────────────┐      ┌─────────────────┐
   │ Impact / LCA    │      │   Eco-design    │
   │ scores a tree   │      │ simulates edits │
   └─────────────────┘      └─────────────────┘
```

Two things to take away from that diagram:

1. A tree is **read by several consumers that we do not control** — a score, a simulation, a
   public page. What we publish, other people build on.
2. A tree **changes over time**, because supply chain knowledge arrives late and in pieces. A
   supplier answers a form three weeks after the season shipped. An auditor corrects a
   country. The brand realises the lining was re-sourced mid-production.

Those two facts together are the whole point of this exercise.

---

## 2. What a traceability tree is

Take one real product: a long-sleeve striped tee, reference `FM-TS-0142`.

At the top of the tree sits **the product** itself. Below it hang its **components** — the
jersey body fabric, the rib collar, the sewing thread, the woven label. Below a component hang
the **raw materials** it is made of — organic cotton, elastane.

Every item in that tree carries the **production steps** that made it: the tee was *cut* and
*made*; the jersey was *knitted*, then *dyed*, then *finished*; the cotton was *grown*, then
*spun*. Each step names **a process**, and — when we know it — **the supplier facility** that
performed it and **the country** it happened in. Components also carry a **composition**: the
jersey is 95 % organic cotton, 5 % elastane.

Rendered, `FM-TS-0142` looks like this:

```
PRODUCT  Marinière Manches Longues                    FM-TS-0142
│  steps  CUTTING    · Textil Duarte, Lda.   · PT   ✔
│         MAKING     · Textil Duarte, Lda.   · PT   ✔
│         PACKAGING  · supplier unknown      · PT   ✖
│
├─ COMPONENT  Jersey coton bio 180 g/m²        main fabric · 82 %
│  │  composition  95 % organic cotton (IN) · 5 % elastane (—)
│  │  steps  KNITTING   · Malhas do Ave S.A. · PT   ✔
│  │         DYEING     · Tintoria Nord Srl  · IT   ✔
│  │         FINISHING  · supplier unknown   · —    ✖
│  │
│  ├─ MATERIAL  Coton biologique                            IN
│  │     steps  FIBER_PRODUCTION · supplier unknown · IN   ✖
│  │            SPINNING         · Kaveri Spinning  · IN   ✔
│  │
│  └─ MATERIAL  Élasthanne                                   —
│        steps  (none declared yet)
│
├─ COMPONENT  Bord-côte col                          trim · 8 %
├─ COMPONENT  Fil à coudre                         thread · 8 %
└─ COMPONENT  Étiquette tissée                      label · 2 %
```

Notice the `✖`. **A tree is almost never complete**, and the holes are not a bug — they are
the most valuable information on the screen, because they are the brand's to-do list. A
sustainability manager opening this page wants to know, in about two seconds, *what do I still
not know about this product?*

### A tree changes from two directions at once

This is the part that makes the object genuinely hard, and it is where we would like to see you
think.

**From below, the tree rebuilds itself.** It is not typed in by hand — it is *assembled* from
what suppliers declare to us through their forms. When the dyeing house finally answers, our
collection system re-emits the whole tree for that product, with the new facts in it. That
happens on its own schedule, days or weeks after anyone looked at the screen.

**From above, the brand corrects it.** The sustainability manager knows things the forms do not
capture. She knows the dyeing actually moved to Italy last season, whatever the supplier
ticked. She fixes it in the app.

Now put the two together:

```
        brand corrections     ────┐
                                  ├──►   the tree the user reads
   supplier declarations  ────┐   │       and the versions we publish
        (rebuilt, whole)      ────┘
```

A refresh arrives and re-states the entire tree. **The correction the brand made three weeks
ago must still be standing afterwards.** If it is silently overwritten, the user stops trusting
the screen — and they stop correcting anything, which costs us the only high-quality data we
have. If instead the correction blindly freezes that branch, the tree stops learning and goes
stale. Neither is acceptable.

And the refresh does not merely add: it contradicts what the brand typed, it drops a step that
existed last month, it brings in a component nobody had seen. All of that has to land on top of
work a human already did.

**A published version must also hold still.** The one whose score was communicated, the one
behind the QR code on the garment, cannot shift under a refresh either.

---

## 3. The exercise

> Design and build a small web app with its backend that lets a brand user do what the
> scenarios below describe. Model the tree and its versions as you see fit. We care about how
> you structure the domain, the API, and the way you present a tree to a non-technical user.
>
> **Scope is yours** — tell us what you cut and why.

### Stack

This one is not your call — it is ours, and it is our production stack:

| | |
|---|---|
| **Front** | **Nuxt** (Vue 3, Composition API, `<script setup>`) |
| **Back** | **NestJS** |
| **Language** | **TypeScript**, front and back, `strict` on |

Everything else is yours: monorepo or two folders, REST or GraphQL, ORM or none, state
management, styling, test runner. Pick and justify.

We impose the stack for one reason: the debrief is a conversation about *your* architecture
decisions, and that conversation is sharper when we are not also decoding an unfamiliar
framework. It also means the shortcuts NestJS and Nuxt offer you are shortcuts we will
recognise — using a Nest module boundary or a Nuxt server route well tells us something, and so
does using it badly.

Two warnings, since the stack is imposed:

- **Do not fight the timebox with scaffolding.** `nest new` and `nuxi init` plus wiring should
  cost you minutes, not an hour. If you lose time there, cut a feature, not the write-up.
- **Nest gives you DI and modules — that is an invitation, not an obligation.** We would rather
  see three well-chosen modules than a faithful reproduction of a tutorial's folder tree.

If you have never touched one of the two, say so when you hand back and tell us what you would
have done in the stack you know. We would rather read that than watch you lose two of your four
hours to a framework.

```gherkin
Feature: Traceability trees for textile products

  As a brand sustainability manager, I want to view and maintain the
  traceability trees of my products so that I can share a trustworthy
  view of where each product was made, by whom, and from what.

  Background:
    Given I am a brand user
    And my brand has several products, each with a traceability tree
    And typical trees are provided as JSON alongside this brief

  Scenario: Browse my trees
    When I open the traceability section
    Then I see the list of my products
    And for each one I see its latest published version, or that it has never been published
    And I see whether its working tree has changed since that publication
    And I see when its working tree last changed

  Scenario: Edit a tree
    Given I am viewing the working tree of a product
    When I change the supplier of a step, add a step to an item, or edit a component's composition
    Then the change lands on the working tree straight away
    And no new version is created
    And a composition whose percentages do not sum to 100 is rejected with a clear message

  Scenario: Versions
    Given I have changed the working tree
    When I publish
    Then a new version is created from the working tree as it stands
    And it becomes the latest published version
    And every version published before it still reads exactly as it did
    And I can open any past version read-only and see what changed against the one before it

  # --- A refresh arrives from the collection system ------------------------
  # A refresh re-states the WHOLE tree, on its own schedule, long after I made
  # my corrections. My corrections have to survive it — not once, but every
  # time, for as long as they still make sense.

  Scenario: My corrections survive a refresh
    Given I corrected the country of a step and saved it
    When a refreshed tree for that product arrives
    Then my correction is still applied on the tree I open
    And the facts the refresh brings on everything I never touched are taken as they come
    And I can tell, on any value, whether I am looking at a declaration or at my own correction

  Scenario: My corrections survive every later refresh, not just the first
    Given I corrected the supplier of a step
    And a refresh has already been applied since
    When two further refreshes arrive
    Then my correction is still applied after each of them
    And applying the same refresh twice changes nothing

  Scenario: A refresh contradicts one of my corrections
    Given I corrected the supplier of a step
    When a refresh declares a different supplier for that same step
    Then my correction still wins
    And I am shown that the declaration now disagrees with me
    And I can drop my correction and fall back to the declared value

  Scenario: A refresh removes something I had corrected
    Given I corrected a step
    When a refresh no longer contains that step
    Then the step is not resurrected on the tree by my correction alone
    And my correction is not silently destroyed either

  Scenario: A published version does not move
    Given I published a version of a tree
    When a refresh arrives
    Then the published version still reads exactly as it did when I published it
```

### Scope guidance

Four hours will not cover all of this, and that is intentional — **choosing is part of the
exercise.** A defensible "I cut the diff view because X, here is how I would build it" is worth
more to us than a rushed, broken version of everything.

Here is our steer, and we mean it literally:

- *Browse* and *Edit* are the warm-up. Make them work, keep them plain, move on.
- **The refresh scenarios are the heart of the exercise.** They are why we chose this subject.
- *Versions* is the same question seen from the other end — what we freeze, and against what.

We do **not** expect a complete merge engine in four hours. A model that makes one correction
survive one refresh, plus a clear written account of how it generalises to the contradiction,
the removal and the tenth refresh, is a strong answer. **A convincing design beats a
half-working implementation here** — this is the part we will spend the debrief on.

Two simplifications you are allowed to assume, so you do not burn time on the wrong problem:

- **Ids are stable.** An item or step that exists in both the current tree and a refresh keeps
  the same id. You never have to re-identify "the same step" by matching labels.
- **Refreshes arrive whole and in order.** No partial payloads, no out-of-order delivery.

**Explicitly out of scope** — do not spend a minute on these:

- Authentication, users, permissions, multi-tenancy — assume one logged-in brand user.
- Deployment, Docker, CI, observability.
- Pixel-perfect design. Plain and legible beats pretty.
- Any persistence setup that costs you time. In-memory or SQLite is fine if you say so.
- Supplier / product creation flows. The seed data is your whole universe.

---

## 4. The data we give you

Everything is under [`data/`](./data). **These are inputs only** — we deliberately give you no
expected output files, because how you shape the output is the thing we are assessing.

```
data/
├── trees/                                      the current state of three trees
│   ├── tshirt-mariniere.json                   the tree drawn above — the richest one
│   ├── jacket-denim-brut.json                  a tree with many unknowns
│   └── scarf-merinos.json                      a small, shallow tree
├── refreshes/
│   └── tshirt-mariniere.refresh-2026-09-20.json   what the collection system says three
│                                                  months later — feed this to your app
├── suppliers.json                              the brand's supplier facility registry
└── processes.json                              controlled vocabularies: processes, raw
                                                materials, usage categories
```

> We give you **one** refresh. Creating the others, if you need them to show the behaviour,
> is on you.

You may **ignore any field the scenarios do not need**, and you may reshape the data into
whatever model you prefer — nothing obliges you to persist it in the shape we hand it over in.
That reshaping decision is one we will ask you about.

### Field reference

A tree file is one product and its tree:

| Field | Meaning |
|---|---|
| `brand` | The brand that owns the product. |
| `product` | Name, reference, season, category, weight, last modification date. |
| `rootItem` | The root of the tree. Always `kind: "PRODUCT"`. |

Every **item** (`rootItem` and everything under `children`) carries:

| Field | Meaning |
|---|---|
| `id` | Stable identifier of the item within the tree. |
| `kind` | `PRODUCT` \| `COMPONENT` \| `MATERIAL`. |
| `label` | Human-readable name — what the user reads. |
| `steps[]` | The production steps performed on this item. |
| `children[]` | The items below it: components under a product, materials under a component. |

**Steps** (`steps[]`):

| Field | Meaning |
|---|---|
| `id` | Stable identifier of the step. |
| `process` | A code from `processes.json` (`WEAVING`, `DYEING`, `MAKING`, …). |
| `supplierId` | References `suppliers.json` — **or `null` when the facility is still unknown**. |
| `countryCode` | ISO-2 country where the step happened, `null` when unknown. A step can have a known country and an unknown supplier, and vice-versa. |

**Components** additionally carry:

| Field | Meaning |
|---|---|
| `usageCategory` | `MAIN_FABRIC`, `LINING`, `TRIM`, `LABEL`, … |
| `usagePercentage` | Roughly how much of the finished product this component represents, by weight. Indicative — it is *not* the number the "sum to 100" rule in the Gherkin refers to. |
| `composition[]` | `{ rawMaterial, percentage, originCountryCode }`. **This** is the one that must sum to 100. |

**Materials** additionally carry `rawMaterial` and `originCountryCode`.

### The refresh file

`refreshes/tshirt-mariniere.refresh-2026-09-20.json` is what our collection system emits for
`FM-TS-0142` three months after the state in `trees/`. It has the **same shape as a tree file**
— a refresh is always the whole document, never a patch. How you feed it to your app is up to
you: an endpoint, a CLI command, a button labelled "simulate refresh". The cheapest thing that
lets you demonstrate the behaviour is the right thing.

We built it so that it exercises every hard case at once. Against the current tree it:

| | |
|---|---|
| **fills a hole** | the jersey `FINISHING` step gets a supplier and a country; so does the cotton's `FIBER_PRODUCTION` |
| **contradicts a fact** | the jersey `DYEING` step moves from Tintoria Nord (IT) to Malhas do Ave (PT) |
| **changes a composition** | the jersey goes from 95/5 to 92/8 cotton/elastane |
| **adds a step** | the elastane material gets its first step |
| **adds an item** | a new component appears, "Renfort col thermocollant" |
| **removes a step** | the root `PACKAGING` step is gone |
| **renames** | the jersey label goes from 180 to 185 g/m² — same id, different label |

Make a correction on one of those before you apply it, and you will see the whole problem.

> **One heads-up on the data.** It is shaped like real production data, which means it is not
> uniformly clean. If something in it surprises you, that is worth a line in your write-up —
> noticing it, and deciding what your system does about it, is part of the exercise.

---

## 5. What to hand back

### a. A GitHub repository

On **your own GitHub account**, public (or private with `@` — we will send you the handles),
sent to us before the debrief.

It must contain a **README of your own** that lets one of us run it and, more importantly,
understand it. We are explicitly checking that you produce something reusable rather than just
code: the repo should stand on its own for a colleague who joins after you.

We suggest your README covers:

- **How to run it** — the shortest path from `git clone` to a working app.
- **How you read the problem** — what you understood a tree to be, and what you decided it *is*
  in your model.
- **Your model and your architecture** — the domain objects, where the rules live, how the
  front and the back talk to each other, and why those boundaries.
- **How a correction survives a refresh** — what a correction *is* in your model, where it
  lives, and what happens to it when the tree underneath moves. This is the decision we will
  dig into most. Say what you would do about the cases you did not implement.
- **How you did versioning**, and how it relates to the answer above.
- **What you cut, what you would do next, and why** — with the reasoning, not just the list.
- **Where you used AI, and where you deliberately did not.**

Commit as you go rather than in one drop; we like reading a history.

### b. A one-pager (or up to 5 slides)

A short written artifact to anchor the debrief. Not a rewrite of the README — the *system*
view: where a feature like this plugs into the blocks in §1, what it would break, what it would
need from its neighbours, and what you would want to know before building it for real.

---

## 6. The debrief

About an hour with the tech team, a few days after you hand back.

- You walk us through your solution, **without writing code and without AI assistance**. We
  want to hear you explain your own design — the ability to defend and hand over a system
  matters more to us here than typing speed.
- We will ask open questions: what happens when a correction has been standing for two years
  and the branch it points at is long gone, when two users edit at the same time, when this
  tree gets 10× bigger, when a downstream consumer needs to be told a new version was
  published, when the business rule turns out to be wrong.
- We will then move on to a second, unrelated problem from our roadmap and think about it
  together, out loud. Nothing to prepare for that part.

---

## 7. What we are actually assessing

Roughly in the order we weight it:

1. **Problem framing.** Did you understand what a tree is and what it is for, and were you
   able to model one?
2. **Domain and architecture.** Where do the rules live, what are the boundaries, and could a
   colleague extend this in six months without asking you?
3. **Reasoning made visible.** Artifacts, README, commits, the one-pager. An undocumented good
   decision scores like an accidental one.
4. **Systems thinking.** A local fix versus something that holds its place in the diagram in §1.
5. **Code quality.** Clear naming, tests where they earn their place. We are not counting
   coverage points.
6. **Product sense.** Would a non-technical sustainability manager actually get what they need
   from your screen?

Things that **do not** score: number of features shipped, CSS polish, exhaustive use of every
NestJS or Nuxt feature you know.

---

## Using AI

Use it. We use Claude and Cursor daily, and part of this role is pushing our AI practice
forward — we are as interested in *how* you use these tools as in the result.

Two conditions, and they are the whole contract:

- **You own every line.** At the debrief, without the tool in front of you, you should be able
  to explain any decision in the repo and justify it. Generated code you cannot defend counts
  against you more than code you did not write at all.
- **Tell us how you used it** — a short section in your README. Where it accelerated you, where
  it sent you the wrong way, what you rewrote by hand. That section genuinely interests us.

---

## Questions

If something in this brief is ambiguous, you have two options and both are fine:

1. Ask us — write to us, we answer quickly and it costs you nothing.
2. Decide, write down the assumption, and move on.

What we do not want is for you to burn 45 of your 240 minutes guessing what we meant.

Good luck — we are looking forward to reading it.
