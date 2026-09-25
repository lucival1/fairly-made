# Timebox

- **1h — reading and planning with AI:** brief and data, the two-layer model (declared + corrections), architecture, then a hand-off reviewed against the brief before writing code.
- **30 min — scaffolding** (10' AI codegen, 20' validation): npm workspace, Nest + Nuxt, shared lint and format.
- **45 min — domain merge** (15' codegen, 30' validation): merge, diff and validation, tested against the seed data.
- **55 min — API** (10' codegen, 20' validation, then 5' + 20' tightening the architecture): traceability use cases, reference data, seeding.
- **55 min — browse and edit UI** (10' codegen, 10' review, 15' atomic refactor and bug fixes, 20' final review) — versions did not fit, so they are designed in the README instead of built.

Validation took longer than generation in every phase, on purpose. What cost the most: AI's architecture assumptions were looser than I expected, so I had to correct the structure on both back and front (I could have been more explicit up front), and I had to narrow the scope early to keep execution simple. Testing ended up light.
