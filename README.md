# 오사카 미나미 4인 · 2026.11.06 – 11.09

> 페이지 → **https://rusher2020.github.io/osaka-trip/**
> 성인 4명 · 숙소 시마노우치 2초메 · 먹고 마시는 데 무게를 둔 일정

## 이 저장소가 하는 일

후보 가게를 "카드"로 모아 검증기에 통과시키고, 그 데이터로 단일 HTML 페이지를 만든다.
데이터의 단일 진실 소스는 `data/*.json`이고 `index.html`은 **생성물**이다.

```
data/*.json  ──  bun run build-page  ──▶  index.html  ──▶  GitHub Pages
     │
     └── bun test / validate / check-refs / check-coords
```

## 카드 선별 기준

| 축 | 기준 |
|---|---|
| 음식·술 현지 평가 | **타베로그 점수가 1차 지표.** 3.45 이상이면 현지 평균 상위, 3.5 이상은 상위권, 百名店 선정은 최상위 신호 |
| 관광객 쏠림 | **구글 리뷰 수 ÷ 타베로그 리뷰 수.** 3배 이하 현지 중심 / 3~15배 혼재 / 15배 초과 관광객 중심 |
| 구글 평점 | 병기만 한다. 관광객 비중이 큰 가게가 높게 나오므로 단독 기준으로 쓰지 않는다 |
| 거리 | 숙소(島之内2-11-30) 기준 직선거리 × 1.3 ÷ 75m/분. 기본 정렬이 가까운 순 |
| 지역 우선순위 | 도톤보리·우라난바·신사이바시·니혼바시 = 1순위. 텐마·신세카이·후쿠시마 = 2순위. 우메다 = 후순위 |
| 쇼핑 | 남성 브랜드, 1점 3만엔 이하, 일본 브랜드 또는 일본 한정 라인 |

`seat4`는 "4인이 한 그룹으로 붙어 앉을 수 있다"는 뜻이다. 카운터 전용은 총 좌석 수와 무관하게
해당하지 않으며, 출처가 4인 인접 좌석이나 단체 예약을 명시한 경우에만 예외다
(같은 정의가 `data/taxonomy.json`의 `categories._seat4Definition`에도 있다).

## 개발

```bash
bun test            # 검증기 테스트
bun run validate    # 카드 데이터 검증 (필수 필드·평점 범위·거리 일관성·출처 품질)
bun run check-refs  # 일정이 참조하는 카드 id·area 무결성
bun run check-coords # 좌표를 OpenStreetMap과 대조 (300m 초과는 개별 판정)
bun run build-page  # data/*.json -> index.html
bun run serve       # 빌드 후 localhost:8765
bun run gen-docs    # data/*.json -> docs/research/cards-*.md
```

## 문서

| 문서 | 내용 |
|---|---|
| [판정 기록](docs/research/decisions/) | 자동 검증으로 결론이 안 난 건들의 근거 |
| [음식 카드](docs/research/cards-food.md) | 생성물 |
| [술 카드](docs/research/cards-drink.md) | 생성물 |
| [쇼핑 카드](docs/research/cards-shopping.md) | 생성물 |
| [숙소 후보](docs/research/cards-stay.md) | 생성물 |
| `docs/research/sources-*.md` | 손으로 쓴 카드별 출처 기록 (생성기가 건드리지 않는다) |

## 알아둘 한계

- 구글 평점은 구글맵 직접 조회가 아니라 Wanderlog 스냅샷이다. 실시간 값과 다를 수 있다.
- 카드 사진은 타베로그·핫페퍼·공식 사이트의 og:image와 리뷰 사진을 핫링크한다. 원본이 지워지면 빈다.
- 소규모 일본 식당은 OpenStreetMap에 거의 없어 좌표 자동 대조가 안 되는 카드가 많다.
  그런 카드의 좌표는 국토지리원 주소검색 API의 번지 지오코딩값이다.
- `⚠ 미검증`이 붙은 항목은 출처 페이지로 확인하지 못한 것이다. 출발 1주 전 재확인이 필요하다.
