# Final Fix Report — Code Review Findings

Status: All 7 findings addressed. `bun test`, `bun run validate`, `bun run check-refs` all green; `bun run gen-docs` regenerated docs with no leftover diff.

## Commits
- `1de5bf6` fix(cards): flag shopping cards' unverified store details
- `419310d` fix(cards): settle seat4 definition and apply it consistently
- `b0b82ff` feat(validate): enforce the 4,000엔 food/drink budget band
- `08c5142` fix(itinerary): give plan C 60 min for the 11/8 hotel move; be honest about plan B's drinking
- `eb29198` fix(transit): add missing legs the itinerary already uses
- `828012c` fix(check-refs): validate transit.airport legs too

## Command results
- `bun test`: 22 pass, 0 fail (42 expect() calls)
- `bun run validate`: 94 cards, 전부 통과 (0 errors, 3 warnings: d-15/d-20/d-22 over 4,000엔 upper bound)
- `bun run check-refs`: 참조 무결성 OK
- `bun run gen-docs`: regenerated cards-food.md / cards-drink.md / cards-shopping.md / cards-stay.md, no post-regen diff

## Per finding
1. Shopping cards' unverified claims: prepended "⚠ 미검증 — ..." to caution on 19/22 shopping cards (all except s-01, s-02 Don Quijote and s-18 551 Horai, which had real page loads per task-6-report.md).
2. No budget-band check: added a food-*/drink-* only check to validate-cards.mjs — fails if lower bound > 4,000엔, warns (doesn't fail) if only upper bound > 4,000엔. Surfaces d-15/d-20/d-22. Added passing + warning tests.
3. seat4 inconsistency: redefined seat4:true as "four can sit together as a group; counter-only fails regardless of seat count unless a source confirms adjacent seating/group booking." Flipped f-31, f-32 (both named in the finding) plus f-18, f-20, d-06 (found by scanning the rest) to seat4:false with matching cautions. Definition recorded in `data/taxonomy.json` (`categories._seat4Definition`) and README.md.
4. Plan C 11/8 timing: gave the checkout->new-hotel move the same 60 min (10:30->11:30) as plans A/B. Swapped the 10:45 f-35 breakfast (set menu ends 11:00, incompatible with 11:30) for f-36 (same card plan A uses here), then shifted the rest of the day +45 min.
5. Missing transit legs: added uranamba<->umeda, dotonbori<->umeda, umeda<->dotonbori, and an umeda<->fukushima JR Osaka Loop Line entry (lineLabel explicitly says JR) to `data/transit.json`.
6. Plan B overstated restraint: reworded `plans.B.desc` and the 17:00 slot note to reflect that d-02 (drink-izakaya, 오토시 410엔) and s-22 follow; kept the accurate "우메다 종일" half.
7. check-refs.mjs skipped transit.airport: added it to the validation loop, allowlisting "namba"/"kix" alongside "home".

## Deliberately deferred (not attempted, per instructions)
- Structured `confidence` field
- Regenerating `sources-*.md` from JSON
- Latent USJ/aquarium coordinate gap
- Four Latin-alphabet `nameJa` values
- Ten single-source cards
