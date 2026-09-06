# Shopping card verification-marker fix — report

Ground truth: `docs/research/sources-shopping-stay.md`. Derived per-card status independently
(not just the two reviewer bullets), cross-checked each `sources` array in
`data/cards-shopping.json` against the doc's evidence rule (per-shop path = fetch evidence;
bare domain root or `google.com/maps/...` = not evidence).

## Full 22-card mapping

| id | status | evidence |
|---|---|---|
| s-01 | unverified | doc: "⚠ 학습 지식 기반"; sources = donki.com root + maps only |
| s-02 | unverified | doc: "⚠ 학습 지식 기반"; sources = donki.com root + maps only |
| s-03 | unverified | doc: "⚠ 학습 지식 기반"; sources = daikokudrug.com root + maps |
| s-04 | unverified | doc: "⚠ 학습 지식 기반"; sources = matsukiyo.co.jp root + maps |
| s-05 | unverified | doc: "⚠ 학습 지식 기반, WebFetch 접속 실패"; sources = yodobashi.com root |
| s-06 | unverified | doc: "⚠ 학습 지식 기반"; sources = biccamera.com root |
| s-07 | unverified | doc: "⚠ 학습 지식 기반"; sources = joshin.co.jp root |
| s-08 | unverified | doc: "⚠ 학습 지식 기반"; sources = sofmap.com root |
| s-09 | unverified | doc: "⚠ 학습 지식 기반"; sources = beams.co.jp root |
| s-10 | unverified | doc: "⚠ 학습 지식 기반"; sources = store.united-arrows.co.jp root |
| s-11 | unverified | doc: "⚠ 학습 지식 기반"; sources = shinsaibashi.parco.jp root |
| s-12 | unverified | doc: "⚠ 학습 지식 기반"; sources = ragtag.jp root |
| s-13 | unverified | doc: "⚠ 저신뢰도 — WebFetch 대부분 차단"; sources = maps + Instagram |
| s-14 | unverified | doc: "⚠ 학습 지식 기반"; sources = 2ndstreet.jp root |
| s-15 | unverified | doc: "⚠ 학습 지식 기반"; sources = uniqlo.com root |
| s-16 | unverified (ambiguous, see below) | doc "✅ fetch 확인" covers only market-level facts (existence, ~580m arcade, ~150 stalls, post-2024 price-gouging controversy) via Wikipedia; it explicitly does NOT cover per-stall closing times or tax-counter process, which is what the card's caution states as fact |
| s-17 | unverified | doc: "⚠ 체인·지점 존재는 fetch로 확인, 정확한 영업시간·휴무일은 학습 지식 기반" |
| s-18 | unverified | doc: "⚠ 체인 존재·본점 주소는 위키백과로 확인, 정확한 영업시간은 학습 지식 기반" |
| s-19 | verified | doc: "✅ fetch 확인"; sources = ichibirian.com (shop's own single-location domain, not a shared chain root) |
| s-20 | verified | doc: "✅ fetch 확인"; sources = pablo3.com/shop/shinsaibashi/ (per-shop path) |
| s-21 | verified | doc: "✅ fetch 확인"; sources = mon-cher.com/shoplist/ (doc confirms specific address/hours/phone/holiday were read from this page for this shop) |
| s-22 | verified | doc: "✅ fetch 확인"; sources = likaman.co.jp/shop/area/osaka/ (per-shop-area path, address/hours/phone/tax-free status confirmed) |

## Ambiguous card: s-16

The reviewer's bullet grouped s-16 with s-19/s-20/s-21/s-22 as "✅ fetch 확인, remove warning."
On reading the full doc entry, s-16's ✅ rating is scoped narrowly: Wikipedia fetch confirmed
the market's existence, arcade length, stall count, and the 2024+ high-price-gouging
controversy (which the card's caution does correctly restate as a confirmed warning). But the
card's caution ALSO asserts specific operational facts — stall-by-stall closing times
("17:30~18:00 이후 문 닫는 곳이 많음") and tax-counter timing — that the doc gives no fetch
evidence for (a general Wikipedia market article does not carry per-vendor hours). The doc's
own parenthetical ("개별 점포 실재 여부 미검증이라 과대 특정 회피") signals the compilers
already knew per-stall specifics weren't confirmed. Per the instruction to err toward
"unverified" on ambiguity, s-16 was left as unverified (its existing "⚠ 미검증" prefix was
kept, not removed).

## Changes made

Added "⚠ 미검증 — ..." prefix (was missing, should have had it): s-01, s-02, s-18
Removed "⚠ 미검증 — ..." prefix (was wrongly added): s-19, s-20, s-21, s-22
No change (already correct): s-03 through s-17 except s-16 explained above, s-22 category baseline

Nothing else in any card was touched — `sources`, `hours`, `budget`, `seat4`, `why`, etc. are
byte-identical to before this fix.

## Verification

- `bun test` — 22 pass, 0 fail
- `bun run validate` — 전부 통과 (3 pre-existing budget-range warnings, unrelated to this fix)
- `bun run check-refs` — 참조 무결성 OK
- `bun run gen-docs` — regenerated docs/research/cards-shopping.md (and the other 3 doc files, unchanged in content since only shopping cards were edited)
