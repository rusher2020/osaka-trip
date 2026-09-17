# Osaka trip card coordinate research — evidence report (2026-09-06)

Method: for each flagged card, fetched the card's own cited sources (Tabelog/official
site/gnavi/hotpepper) to find the real street address and the specific branch the card
describes, then geocoded that address (or checked it against an OSM administrative
neighbourhood boundary / a directly name-tagged OSM POI) via Nominatim, bounded to Osaka
(`viewbox=135.40,34.78,135.60,34.60&bounded=1`), 1 req/sec, custom User-Agent. Sanity-checked
against the card's own `area` tag and against `walkFrom` using this dataset's convention
(straight-line distance from Airbnb at 34.6704,135.5085 × 1.3 ÷ 75 m/min).

For every card, I also queried Nominatim directly for the shop's bare name (bounded to
Osaka) to see exactly what the check-coords script itself would have matched — this let me
confirm, node by node, whether the checker's MISMATCH was a false positive (wrong business
matched) or a genuine problem.

---

## f-09 무기×토리 (麦×鶏) — KEPT

- **Address found**: 大阪府大阪市中央区南船場3-1-16 日宝ラッキービル1F (Senba honten /
  船場本店). Source: the card's own Tabelog page (id 27111796) and the official site
  `mugitori.jp`, which lists three branches (船場本店, 天満店, 御殿場店/Shizuoka) — the
  Tabelog ID in the card's sources corresponds to 船場本店, the Shinsaibashi/Minami-Senba
  location, matching the card's `area: shinsaibashi`.
- Nominatim's neighbourhood boundary for 南船場三丁目 is centroid (34.6764785, 135.5018255),
  bbox lat 34.6749–34.6780 / lng 135.5003–135.5034 — the card's stored coordinate
  (34.6779, 135.5025) falls inside this box.
- walkFrom check: distance(Airbnb → stored) = 999 m → 17.3 min via the dataset's formula,
  vs. the card's stated "도보 17분" — near-perfect match.
- Why OSM flagged it (9614 m): querying "麦×鶏" alone in Nominatim (bounded to Osaka) returns
  no useful match — the checker's script actually resolved to a completely unrelated point
  (34.7621919, 135.5259261, a second-hand shop in Suita). Bare-name search on a small chain
  with a same-named branch outside Osaka's core (or in a totally different registry match)
  produced garbage. The card's own coordinate is verified correct.
- **Outcome: KEPT. No edit.**

## f-12 라멘 우로코 난바점 (らーめん鱗 難波店) — KEPT

- **Address found**: 大阪府大阪市浪速区難波中2-7-24 ダイヤマンション1F. Source: card's Tabelog
  page (id 27110154) AND the official site `ramen-uroko.com/shopdetails/namba`, both citing
  the identical address and both explicitly describing "2 min / 250 m from Nankai Namba
  Station" — this is unambiguously the 難波店 branch the card names.
- Nominatim's neighbourhood boundary for 難波中二丁目: centroid (34.6614225, 135.5027072),
  bbox lat 34.6593–34.6636 / lng 135.5002–135.5052 — stored coordinate (34.6617, 135.5036)
  falls inside this box.
- walkFrom check: distance(Airbnb → stored) = 1067 m → 18.5 min, vs. stated "도보 19분" —
  matches closely.
- Why OSM flagged it (7324 m): querying "らーめん鱗 難波" directly, Nominatim's actual
  top-scored match is "らーめん鯖" (a different shop, "ramen Saba" not "Uroko") in Yodogawa-ku
  at 34.7273250, 135.4967038 — precisely accounts for the 7324 m delta. Confirmed wrong-entity
  match, not a card error.
- **Outcome: KEPT. No edit.**

## f-31 텐구 (てんぐ, Shinsekai kushikatsu) — KEPT

- **Address found**: 大阪市浪速区恵美須東3-4-12 (Janjan Yokocho, Shinsekai). Source:
  `goodlife-info.net/visit/shinsekai-tengu/` (via cache, direct fetch was 403'd) — matches
  the card's `area: shinsekai` and its "지하철 사카이스지선 에비스초역" reference.
- Nominatim's neighbourhood boundary for 恵美須東三丁目: centroid (34.6499664, 135.5055664),
  bbox lat 34.6487–34.6515 / lng 135.5037–135.5072 — stored coordinate (34.6518, 135.506) sits
  right at (~30 m beyond) the northern edge of this box — effectively the same location; chome
  boundary polygons don't align exactly with a shop's actual doorway.
- walkFrom for this card is transit-based ("에비스초역 하차, 도보 3분"), not an
  Airbnb-straight-line claim, so the Airbnb formula doesn't apply here as a check.
- Why OSM flagged it (6615 m): "てんぐ 新世界" bare-name search actually resolves (per the
  check-coords run) to 34.7109932, 135.4987571 — a different location entirely, consistent
  with "てんぐ" being a very common izakaya/kushikatsu name across Osaka.
- **Outcome: KEPT. No edit.**

## f-38 텐마사 (天政, uranamba udon) — KEPT

- **Address found**: 大阪府大阪市中央区難波3-3-3. Source: confirmed identically by TWO
  independent sources — `r.gnavi.co.jp/rhmng2mb0000/` and `namalog.jeez.jp/namalog/tenmasa/`
  — and matches the card's own third source, a Google Maps query for exactly this address.
- **Precise verification**: querying Nominatim for "天政 難波" (bounded to Osaka) returns a
  directly name-tagged OSM POI: `amenity=restaurant, name="天政", house_number=3,
  難波三丁目, 中央区` at **34.6664459, 135.5019783** — an exact match to the address, not just
  an administrative centroid. Distance from this precise POI to the card's stored coordinate
  (34.6645, 135.501) is **234 m — inside the 300 m threshold.**
- walkFrom check: distance(Airbnb → stored) = 949 m → 16.5 min vs. stated "도보 12분"; using
  the precise POI instead gives 797 m → 13.8 min — both are in the right neighborhood of the
  claim, and well within the slack expected from a straight-line-times-1.3 approximation vs.
  an actual street route.
- Why OSM flagged it (5596 m): the same Nominatim query for bare "天政" (no "難波" qualifier)
  also returns a second, unrelated "天政" restaurant node in Higashi-Osaka at 34.6653858,
  135.5621763 — the distance from this to the stored coordinate is ~5589 m, which is exactly
  the reported 5596 m delta. Confirmed: checker matched the wrong, same-named restaurant in a
  different city.
- **Outcome: KEPT. No edit.**

## d-05 텐마사카구라 (天満酒蔵, Tenma izakaya) — KEPT

- **Address found**: 大阪府大阪市北区天神橋5-7-28. Source: `hotpepper.jp/strJ000449169/`,
  which explicitly names 天満駅 (JR Tenma Station) as the nearest station (Tabelog page
  403'd on fetch).
- **Precise verification**: JR Tenma Station's OSM node is at 34.7049249, 135.5123175. The
  card's stored coordinate (34.7046, 135.5117) is only **~67 m** from this station — a very
  tight match to hotpepper's stated nearest-station claim, and consistent with the card's
  `area: tenma`.
- Why OSM flagged it (1632 m): querying "天満酒蔵" directly in Nominatim, the actual matched
  node is `amenity=pub, name="酒蔵 多気"` ("Sakagura Taki") at 34.6900039, 135.5136095, in
  北浜東, Chuo-ku — a completely different izakaya near Kitahama that superficially matches on
  the "酒蔵" substring. Confirmed wrong-entity match.
- **Outcome: KEPT. No edit.**

## s-07 조신 니혼바시본점 (ジョーシン日本橋本店, Joshin Denki) — FLAGGED (caution added)

- This one could not be resolved with confidence, and the reason is structural: per the
  Japanese Wikipedia article on 上新電機/ジョーシン, the original "日本橋本店" building (in
  難波橋三丁目/四丁目) was converted around 2006 into "日本橋5ばん館" and later became a
  **スーパーキッズランド (Super Kids Land) toy store** — i.e. the literal "Honten" by that
  name has not been a Joshin store for two decades. Multiple Joshin branch numbers
  (1ばん館, 2ばん館, 3ばん館, 5ばん館, 7ばん館, 8ばん館) all closed between 2003–2020, and
  were consolidated into a single rebuilt "日本橋店" that reopened November 2022 on the
  former ディスクピア日本橋店 site.
- Confirmed the checker's own MISMATCH (367 m, at 34.6592857, 135.5056097) is exactly the
  Super Kids Land node — literally a different, non-Joshin business — via a direct Nominatim
  name query. So the checker's flag is not evidence the card is right OR wrong; it's evidence
  the old honten address is now someone else's shop.
- Conflicting signals on where the *current* store actually is:
  - Two independent, specifically-named OSM entities (a `shop=electronics, name="ジョーシン"`
    node with house_number 5 in 日本橋五丁目, and a bike-share dock named
    "ジョーシン日本橋店") converge within ~50 m of each other around 34.658, 135.506 —
    suggesting a real, still-open Joshin branch there, ~466 m from the card's stored
    coordinate.
  - But the card's stated `walkFrom: "숙소 도보 16분"` matches the Airbnb-distance formula
    almost exactly for the STORED coordinate (897 m → 15.6 min) and is off by ~8 minutes for
    the 日本橋五丁目 candidate (1360 m → 23.6 min).
  - Joshin's official site (`joshin.co.jp`, `shop.joshin.co.jp`, `store.joshin.co.jp`) does
    not expose a fetchable per-store address page (redirects to a JS-driven store locator;
    every guessed direct URL 404'd), and the WebSearch tool ran out of budget mid-task, so I
    could not independently confirm which of these is the current "日本橋店"/flagship branch,
    or whether the 日本橋五丁目 OSM node is that flagship or one of Joshin's smaller specialty
    sub-shops.
- Given genuinely conflicting evidence and no way to pin down the post-2022-rebuild address
  from the tools available, I left the coordinate unchanged and appended a caution sentence
  rather than either fixing it to an uncertain point or asserting it's confirmed correct.
- **Outcome: FLAGGED. Added to `caution`: "조신 니혼바시본점은 2020~2022년 사이 매장이
  통폐합·재건축되어 정확한 현재 위치를 소스에서 확정하지 못했다. 좌표는 근사치이므로 현지
  도착 후 지도로 재확인 권장." (lat/lng/walkFrom unchanged)**

## d-15 크래프트비어 걸프 (Craft Beer GULP) — FIXED

- **Address found**: 大阪府大阪市中央区難波2-4-6. Confirmed identically by TWO independent
  sources: the card's own Tabelog page (id 27097023) and `hitosara.com/0032030648/map.html`.
  Both also state the shop is ~1–2 min / "72 m from Osaka Namba [Kintetsu/Hanshin] Station."
- **Precise verification**: Nominatim resolves "Craft Beer GULP" directly to a name-tagged OSM
  POI, `amenity=bar, name="Craft beer gulp"`, at **34.6678683, 135.4991329**, in 難波二丁目,
  Chuo-ku — exactly the chome the address points to.
- Cross-checked against 大阪難波駅 (Kintetsu/Hanshin Osaka-Namba Station), OSM node at
  34.6671813, 135.4977756: distance to this POI ≈ 150 m, in the right ballpark for the "72 m"
  claim (station-node imprecision plus different exit). Distance from the card's OLD stored
  coordinate (34.6671, 135.5023) to the same station is **411 m** — nowhere near "72 m," which
  is strong independent confirmation the old coordinate was wrong, not just flagged by a bad
  OSM match.
- walkFrom recomputed: distance(Airbnb → new coord) = 902 m → 15.6 min ≈ 16 min (old value was
  "도보 10분," a >5 minute change, so per instructions I updated it).
- **Outcome: FIXED.**
  - `lat`: 34.6671 → **34.6679**
  - `lng`: 135.5023 → **135.4991**
  - `walkFrom`: "숙소 도보 10분" → **"숙소 도보 16분"**

---

## Files touched

- `data/cards-drink.json` — d-15 (`lat`, `lng`, `walkFrom`)
- `data/cards-shopping.json` — s-07 (`caution` only)
- No other fields, and no other cards, were modified in any file.

## Verification run

- `bun run validate` → **전부 통과 (all 94 cards pass)**
- `bun run check-coords data/cards-food.json` → f-09 and f-12 still report MISMATCH (expected,
  explained above; both are false positives from bad OSM name-matches, and the card
  coordinates were independently confirmed correct)
- `bun run check-coords data/cards-food-away.json` → f-31 and f-38 still report MISMATCH
  (expected, explained above; same reasoning)
- `bun run check-coords data/cards-drink.json` → d-05 still reports MISMATCH (expected,
  explained above); **d-15 now reports OK (5 m)**
- `bun run check-coords data/cards-shopping.json` → s-07 still reports MISMATCH (expected —
  left FLAGGED with a caution note per the task's third outcome, since the true current
  address could not be confirmed)
