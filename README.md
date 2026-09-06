# Osaka Trip Dashboard

> 2026.11.06 – 11.09 · 성인 4명 · 오사카 시내

## Trip at a Glance

```
GMP ──7C(08:00)──> KIX ──3박 4일──> KIX ──7C(10:45)──> GMP
11/06 08:00        11/06 09:50              11/09 10:45      11/09 12:35
```

숙소: 시마노우치 에어비앤비 (11/6·11/7) + 미나미 1박 (11/8, 미정)

## 진행 상태

Plan 1(리서치)까지 완료됐다. Plan 2(대시보드 웹앱)는 아직 설계만 있고 구현하지
않았다 — 배포된 사이트도, GitHub Pages 링크도 없다. 지금 볼 수 있는 산출물은
아래 문서와 `data/*.json`뿐이다.

## Quick Links

| 문서 | 내용 |
|---|---|
| [설계 스펙](docs/superpowers/specs/2026-09-06-osaka-trip-dashboard-design.md) | 전체 설계 |
| [리서치 계획](docs/superpowers/plans/2026-09-06-osaka-card-research.md) | Plan 1 |
| [음식 카드](docs/research/cards-food.md) | 후보카드 38장 (미나미 + 원정) |
| [술 카드](docs/research/cards-drink.md) | 후보카드 28장 |
| [쇼핑 카드](docs/research/cards-shopping.md) | 후보카드 22장 |
| [숙소 후보](docs/research/cards-stay.md) | 11/8 1박 후보 6곳 |
| [음식 근거 기록 — 미나미](docs/research/sources-food-minami.md) | 카드별 출처·확인일 |
| [음식 근거 기록 — 원정](docs/research/sources-food-away.md) | 카드별 출처·확인일 |
| [술 근거 기록](docs/research/sources-drink.md) | 카드별 출처·확인일 |
| [쇼핑·숙소 근거 기록](docs/research/sources-shopping-stay.md) | 카드별 출처·확인일 |
| [숙소 근거 기록](docs/research/sources-stay.md) | 카드별 출처·확인일 |

`docs/research/cards-*.md`는 사용자가 검토·승인할 대상이고, `docs/research/sources-*.md`는
리서치 과정에서 작성된 손으로 쓴 근거 기록이다 — 성격이 다른 두 문서군이니 혼동하지 말 것.

## 카드 규칙

- **`seat4` 정의**: `seat4: true`는 "4인이 한 그룹으로 붙어 앉을 수 있다"는 뜻이다. 카운터 전용 좌석은
  총 좌석 수가 많아도 이 조건을 만족하지 않는다 — 출처가 4인 인접 좌석이나 단체 예약 가능을 명시적으로
  확인한 경우에만 예외로 `true`를 준다. (같은 정의가 `data/taxonomy.json`의 `categories._seat4Definition`에도
  적혀 있다.)

## 개발

```bash
bun test          # 검증기 테스트
bun run validate  # 카드 데이터 검증
bun run gen-docs  # JSON -> 리서치 문서 생성
bun run check-refs # 일정이 참조하는 카드 id · area 무결성 검사
bun run check-coords # 카드 좌표 검사
```

데이터의 단일 진실 소스는 `data/*.json`이다.

- `docs/research/cards-*.md`는 **생성물**이다 (`bun run gen-docs`). 직접 수정하지 않는다 —
  다시 생성하면 덮어써진다.
- `docs/research/sources-*.md`는 리서치 에이전트가 **손으로 작성**한 출처 기록이다.
  생성기가 건드리지 않으며, 카드별 근거·확인 URL을 남기는 용도다.
