# 카드 재수집(2026-09-17) 판정 기록

지시서: `docs/superpowers/specs/2026-09-17-card-rescope-addendum.md`
실행: 단일 세션, 순차 실행 (병렬 에이전트 없음). 브라우저 미사용 — WebSearch/WebFetch/curl만.

## 1. 구글 평점 확보 경로 — 판정

구글맵 자체는 이번에도 막혔다. 시도한 순서와 결과:

| 경로 | 결과 |
|---|---|
| `google.com/maps/place/...` WebFetch | JS 셸만 반환, 평점 없음 |
| `google.com/maps/place/...`, `maps?q=` curl(브라우저 UA) | 200이지만 평점 데이터가 HTML에 없음 |
| `google.com/search?q=` | robots.txt로 차단 |
| tabelog.com (일본어) WebFetch/curl | 403 |
| tabelog.com/en WebFetch | **성공** — 타베로그 점수·리뷰수·주소·영업시간·좌석 |
| wanderlog.com 지역·장르별 목록 페이지 | **성공** — 구글 평점·리뷰수를 가게별로 병기 |
| wanderlog.com/place/details/... | 일부 성공 (페이지에 따라 푸터만 반환) |

**결정: 구글 평점·리뷰수의 근거는 Wanderlog(구글맵 데이터를 표시하는 애그리게이터) 목록·상세 페이지로 한다.**
지시서 §A.4 "다른 애그리게이터를 경유"에 해당한다. 한계:

- Wanderlog는 구글맵의 스냅샷이라 실시간 값과 다를 수 있다. 같은 가게가 목록마다 리뷰수가 조금씩 달랐다(예: 아지노야 3,839 고정이지만 카니도라쿠 5,055/5,128). 카드에는 **가장 최근에 본 값**을 넣고 출처 URL을 `sources`에 남겼다.
- 호젠지 산페이(f-02)는 Wanderlog가 4.4(846)인데 Plan 1 근거기록은 4.6(1,615)이다. 주소도 道頓堀1-7-10 vs 1-7-9로 미묘하게 달라 **구글 리스팅이 둘일 가능성**이 있다. URL 근거가 있는 4.4(846)를 싣고 `caution`에 불일치를 적었다. 이 값은 4.5 기준에 못 미치지만 기존 카드는 유지한다(지시서: 기존 카드는 유지, 평점 필드만 채움).
- 金麦 남선바점(f-09, 구 麦×鶏)은 상호가 바뀌어 Wanderlog에서 리스팅을 찾지 못했다. Plan 1의 "4.7(2,123)"은 URL 근거가 없어 **싣지 않았다**. 타베로그 3.56만 채웠다.

## 2. 음식 — 채택/기각

수집 범위: Wanderlog의 난바·닛폰바시·추오구·오코노미야키·쿠시카츠·야키니쿠·스시·우동·라멘·이자카야·캐주얼 목록 17개. 기준: 구글 ≥4.5 **AND** 리뷰 ≥500, 도톤보리 도보 10분권.

### 채택 (신규 f-39~f-44)

| id | 가게 | 구글 | 타베로그 | 비고 |
|---|---|---|---|---|
| f-39 | 牛かつもと村 難波店 | 4.8 (13,643) | 3.07 | 체인이라 타베로그 낮음. 예약 불가 |
| f-40 | お好み焼き酒場 O | 4.7 (1,274) | 3.09 | **2026-09 임시휴업 표시** — 11월 영업 재확인 필요 |
| f-41 | 大衆すき焼き北斗 GEMSなんば店 | 4.7 (1,843) | 3.36 | 온라인 예약 가능 |
| f-42 | 焼肉力丸 心斎橋店 | 4.5 (5,562) | 3.13 | 예산 상한 초과 경고(음료 포함 시) |
| f-43 | まぐろや黒銀 | 4.5 (1,335) | 3.39 | 카운터 6석, seat4=false, 마감시각 미확인 |
| f-44 | 黒門さかえすし | 4.6 (1,808) | 3.24 | 저녁 예산 5~6천엔이라 낮 이용 권장 |

카테고리 `food-beef`(규카츠·스키야키)를 `taxonomy.json`에 추가했다. f-39·f-41이 기존 카테고리 어디에도 맞지 않아서다.

### 기각 (기준은 넘지만 카드로 만들지 않음)

| 가게 | 구글 | 기각 사유 |
|---|---|---|
| 松阪牛焼肉M 法善寺横丁店 / はなれ / 難波店 | 4.8~4.9 (2,800~2,900) | 타베로그 예산 1만~1.5만엔. 4천엔 상한의 2.5배 |
| 神戸牛 和ノ宮 道頓堀本店 | 4.8 (4,768) | 저녁 1.5만~2만엔 |
| Kobe Beef Steak Ken / Steakhouse Kozai | 4.7~4.8 | 고베규 스테이크, 상한 초과. Kozai는 리뷰 497건으로 500 미달이기도 |
| RAMEN CHORO | 4.8 (2,097) | Wanderlog는 "Dotonbori"로 표시하나 타베로그 확인 결과 나카츠→**타니마치4초메로 이전**. 범위 밖 |
| Maidreamin 難波 | 4.9 (10,294) | 메이드카페 — 식사 카드 아님 |
| LiLo Coffee Roasters | 4.8 (2,461) | 커피 전문점 — 식사 카드 아님 (아침 커피용으로는 참고) |
| wad omotenashi cafe | 4.5 (767) | 차·화과자 카페 — 식사 카드 아님 |
| Shimanouchi Ichiyo | 4.6 (237) | 리뷰 500 미달. 숙소 바로 옆(시마노우치 2-11-20)이라 아깝지만 기준 미달 |
| Sandaime Dotombori-ikkyu | 4.7 (155) | 리뷰 500 미달 |
| Umeda Okonomiyaki Izakaya Fuwatoro, Yakiniku Rikimaru Umeda, Chitose 등 | 4.7~4.8 | 우메다·니시나리 — 도톤보리 10분권 밖 |

### 기존 카드에 채운 값

f-01, f-03, f-04, f-05, f-07, f-36, f-37: Wanderlog 목록의 구글 값 + Plan 1 근거기록의 타베로그 값(f-36·f-37은 타베로그 미기록이라 생략).
f-10: Wanderlog 상세 페이지 4.5(2,810) + 타베로그 3.55, 타베로그 페이지 URL을 sources에 추가(기존은 matome 링크뿐이었다).

기존 미나미 카드 중 **4.5+/500+를 만족하는 것은 f-10 하나**뿐이다. f-09는 확인 불가, f-02는 4.4.

## 3. 쇼핑 — 채택/기각

### 채택 (신규 s-23~s-34)

| id | 매장 | 지역 | japanOnly | 근거 상태 |
|---|---|---|---|---|
| s-23 | HUMAN MADE 心斎橋PARCO | shinsaibashi | false | ✅ 파르코 매장 페이지 fetch. **한국에 직영 3곳** 확인 → whyCheaper 비움 |
| s-24 | PORTER EXCHANGE OSAKA | shinsaibashi | true | ✅ 요시다카반 공식 페이지 fetch. PX 한정품 명시. 탱커 슬링백 38,500엔으로 상한 초과 품목 많음 |
| s-25 | KURA CHIKA by PORTER NAMBA | uranamba | false | ⚠ 공식·난바파크스 페이지 404. 服DB(4F)만 |
| s-26 | Strato | shinsaibashi | true | ✅ fashion-press fetch (13-19시, 수·목 휴무). 퍼플라벨·nanamica·orSlow 취급 |
| s-27 | TNF PURPLE LABEL 阪急うめだ | umeda | true | ⚠ fashion-press에 8F만, 영업시간은 백화점 기준. 좌표는 GSI 지오코딩(角田町8-7) |
| s-28 | BEAMS PLUS 大阪 | shinsaibashi | true | ✅ hypebeast JP 기사 fetch. 2025-12 오픈 |
| s-29 | HOODS OSAKA | horie | false | ⚠ 영업시간·휴무 미확인. wtaps 스토키스트 페이지 404 |
| s-30 | master-piece FLAGSHIP OSAKA | horie | false | ⚠ 공식 페이지 403. 정휴일 미확인 |
| s-31 | 桃太郎ジーンズ 大阪店 | horie | false | ⚠ 공식 403/404. fashion-press는 그랜드프론트 취급점만 등재하지만 Yelp(2026-06 갱신)·NAVITIME·LINE이 기타호리에 직영점을 등재 → 직영점 카드로 채택 |
| s-32 | モンベル なんばCITY店 | uranamba | true | ✅ 공식 매장 페이지 fetch, 免税:可 |
| s-33 | G-SHOCK STORE NAMBA | uranamba | false | ✅ 난바파크스 매장 페이지 fetch |
| s-34 | Snow Peak Store 난바파크스 | uranamba | false | ✅ 공식 인숍 페이지 fetch |

`horie` 지역 키를 `taxonomy.json`에 추가했다(호리에 오렌지스트리트).

### whyCheaper 판정 원칙

- **채운 것**: 한국 정식 전개 여부를 특정 페이지로 확인한 경우만.
  - TNF Purple Label: 한국 정식 매장 없음(커뮤니티·하입비스트KR — 일본 내수 라이선스 라인).
  - BEAMS PLUS: 한국 정식 매장 없음, 편집숍 병행(무신사 기사 "2024 팝업이 첫 상륙").
  - 몽벨: 한국은 별도 법인 별도 라인업(위키백과). 가격 차이 20%는 커뮤니티 서술이라 확정치 아님으로 명시.
  - PORTER PX: PX 한정품은 PX 매장 전용(공식). 일반 라인은 한국 공식 매장 있음.
- **비운 것**: HUMAN MADE(한국 직영 3곳 있음), KURA CHIKA, HOODS, master-piece, 모모타로, G-SHOCK, Snow Peak — 한국 전개 여부나 가격 차이를 확인하지 못했거나 이점이 없다.

### priceBand 한계

humanmade.jp, nanamica.com, beams.co.jp, mspc.jp 상품 페이지, momotarojeans.com 모두 403/404/타임아웃. **priceBand는 브랜드 통상 가격대이며 이번 세션에서 품목별 가격을 확인한 것은 PORTER 탱커 2점(38,500 / 48,400엔)뿐이다.** 모든 카드 `caution`에 `⚠ 미검증` 표시.

환율: 2026-09-10 기준 100엔 ≈ 871원(검색 결과) → 30만원 ≈ 3.44만엔. 지시서의 3만엔 상한을 그대로 썼다.

### 기각

| 후보 | 사유 |
|---|---|
| KAPITAL | 오사카 매장이 한큐 멘즈 5F(우메다)뿐이고 데님·아우터가 3만엔을 넘는 품목이 많음 |
| Studio D'Artisan, orSlow, FreshService | 미나미권 단독 매장 실재 확인 못 함 (orSlow는 s-26 Strato 취급으로 흡수) |
| BIOTOP OSAKA | 오렌지스트리트 대표 셀렉트숍이지만 취급 브랜드(Auralee·Comoli·The Row)가 상한 초과 |
| SEIKO 일본한정 | 미조사 (시간 부족) |
| 기존 s-09~s-15 | 범용 패션 카드는 **그대로 두고 우선순위만 낮춤**(지시서 B.5). 재검증하지 않아 `⚠ 미검증` 유지 |

## 4. 좌표 — 판정

- 신규 좌표는 전부 **국토지리원 주소검색 API**(`msearch.gsi.go.jp`)로 번지 단위 지오코딩했다. 타베로그가 curl을 403으로 막아 페이지 내장 좌표를 쓸 수 없었다.
- 파르코 입점 2곳(s-23·s-24), 난바파크스 입점 3곳(s-25·s-33·s-34)은 건물 대표 좌표를 공유한다.
- `bun run check-coords` 결과: OK 18 / MISMATCH 5 / UNVERIFIED 89.
- **MISMATCH 5건(d-05, f-12, f-31, f-38, s-07)은 2026-09-06 판정과 동일한 건**이다. 전부 OSM 동명 오탐(텐구·텐마사·우로코 등 흔한 이름이 다른 구의 가게로 매칭)으로 그때 판정돼 유지 결정됐고, 이번에 좌표를 건드리지 않았다. 근거: `2026-09-06-coordinate-adjudication.md`.
- 신규 카드 중 OSM에 등재된 것은 s-29 HOODS OSAKA뿐(8m 차이, OK). 나머지 신규 18장은 UNVERIFIED — GSI 지오코딩값에 의존한다.

## 5. seat4

- f-43 まぐろや黒銀: 카운터 6석 → false.
- f-40 お好み焼き酒場 O: 테이블 4석(1탁) 있음 → true, 단 `caution`에 "테이블 하나가 비어야" 명시.
- f-39 (4인 테이블 2개), f-41 (62석·예약), f-42 (110석·예약), f-44 (카운터+테이블 28석·예약): true.
- 쇼핑 카드는 seat4 무의미하지만 필수 필드라 기존 관행대로 true.

## 6. 남긴 숙제

- f-40 9월 임시휴업 → 10월 말 영업 재개 확인.
- f-09 새 상호(金麦 南船場店)의 구글 리스팅 확인.
- 쇼핑 신규 12장 중 ⚠ 6장(s-25·s-27·s-29·s-30·s-31 + priceBand 전체)은 출발 전 매장 페이지 재확인.
- 일정(`itinerary.json`)에는 신규 카드를 반영하지 않았다 — 지시서 범위 밖.
