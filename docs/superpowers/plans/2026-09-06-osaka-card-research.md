# 오사카 카드 리서치·데이터 (Plan 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-09 기준으로 검증된 오사카 후보카드 90~100장(음식·술·쇼핑·숙소)과 3.5일 일정 뼈대를, 스키마 검증을 통과하는 JSON 데이터로 만든다.

**Architecture:** 카드는 `data/*.json`이 단일 진실 소스다. `scripts/validate-cards.mjs`가 스키마·좌표·근거·중복을 검사하고, 모든 리서치 태스크는 이 검증을 통과해야 커밋된다. 사람이 읽는 요약(`docs/research/cards-*.md`)은 JSON에서 생성한다. 대시보드(Plan 2)는 이 JSON을 런타임에 fetch한다.

**Tech Stack:** Bun (검증 스크립트·테스트 실행), 순수 ESM JavaScript, 외부 의존성 없음. 리서치는 WebSearch/WebFetch.

## Global Constraints

스펙 `docs/superpowers/specs/2026-09-06-osaka-trip-dashboard-design.md`의 프로젝트 전역 요구사항. 모든 태스크에 암묵적으로 적용된다.

- 대상: 30대 후반 남자 4명, 친구/동료, 달리는 밤 (늦은 아침 시작)
- 여행: 2026-11-06(금) ~ 2026-11-09(월). 실질 가동 3.5일
- 지리 범위: **오사카 시내 한정.** 교토·나라·고베 카드 금지
- 제외 확정: USJ, 해유관
- 예산: 1인 1끼 **2,000~4,000엔** 가성비대 우선. 1만엔대 고급은 넣지 않는다
- 숙소 기준점: Shimanouchi 2-chome-11-30, Chuo-ku (모든 `walkFrom`은 여기 기준)
- 모든 카드 필수: `nameJa`(일본어 원문), `reserve`, `seat4`, `walkFrom`, `checked: "2026-09"`, `sources` 1개 이상
- 근거 규칙: **한국 블로그 단독 근거 금지.** 타베로그/구글맵/공식사이트 중 최소 1개 포함
- 좌표: 오사카 범위 안 (lat 34.60~34.78, lng 135.40~135.60)
- 라이선스: 블로그 이미지 다운로드·재게시 금지. 사진은 Places API 런타임 fetch (Plan 2)

---

## File Structure

| 파일 | 책임 |
|---|---|
| `scripts/validate-cards.mjs` | 카드 스키마·좌표·근거·중복 검증. 실패 시 exit 1 |
| `scripts/validate-cards.test.mjs` | 검증기 자체의 테스트 (bun test) |
| `scripts/gen-research-docs.mjs` | JSON → 사람이 읽는 `docs/research/cards-*.md` 생성 |
| `data/taxonomy.json` | 카테고리·지역 상수, 숙소 기준점 |
| `data/cards-food.json` | 음식 카드 |
| `data/cards-drink.json` | 술 카드 |
| `data/cards-shopping.json` | 쇼핑 카드 |
| `data/cards-stay.json` | 11/8 숙소 후보 |
| `data/itinerary.json` | 3.5일 일정 뼈대 + 플랜 A/B/C |
| `data/transit.json` | 지역 간 도보/지하철 소요시간 테이블 |
| `docs/research/sources.md` | 카드별 근거 URL·확인일 |

---

### Task 1: 카드 스키마 검증기

이 태스크가 이후 모든 리서치 태스크의 게이트다. 검증기가 먼저 존재해야 카드를 신뢰할 수 있다.

**Files:**
- Create: `scripts/validate-cards.mjs`
- Create: `scripts/validate-cards.test.mjs`
- Create: `package.json`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `validateCards(cards, opts) -> {ok: boolean, errors: string[]}` — 이후 태스크는 `bun run validate`로 이 검증을 호출한다

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "osaka-trip-plan",
  "private": true,
  "type": "module",
  "scripts": {
    "validate": "bun run scripts/validate-cards.mjs",
    "gen-docs": "bun run scripts/gen-research-docs.mjs",
    "test": "bun test"
  }
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`scripts/validate-cards.test.mjs`:

```javascript
import { test, expect } from "bun:test";
import { validateCards } from "./validate-cards.mjs";

const VALID = {
  id: "f-01",
  name: "미즈노",
  nameJa: "美津の",
  cat: "food-konamon",
  area: "dotonbori",
  lat: 34.6687,
  lng: 135.5013,
  budget: "1,500~2,500엔",
  hours: "11:00-22:00 (L.O. 21:30)",
  closed: "목",
  reserve: "불가·웨이팅",
  seat4: true,
  why: "오코노미야키 노포, 마죠 야마이모야키",
  caution: "피크 60분 대기",
  walkFrom: "숙소 도보 9분",
  checked: "2026-09",
  sources: ["https://tabelog.com/osaka/A2701/A270101/27000001/"],
};

test("정상 카드는 통과한다", () => {
  const r = validateCards([VALID]);
  expect(r.ok).toBe(true);
  expect(r.errors).toEqual([]);
});

test("필수 필드가 빠지면 실패한다", () => {
  const { nameJa, ...missing } = VALID;
  const r = validateCards([missing]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("nameJa");
});

test("오사카 밖 좌표는 실패한다", () => {
  const kyoto = { ...VALID, lat: 35.0116, lng: 135.7681 };
  const r = validateCards([kyoto]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("좌표");
});

test("id 중복은 실패한다", () => {
  const r = validateCards([VALID, { ...VALID, name: "다른 곳" }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("중복");
});

test("sources가 비면 실패한다", () => {
  const r = validateCards([{ ...VALID, sources: [] }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("sources");
});

test("한국 블로그만 근거면 실패한다", () => {
  const r = validateCards([
    { ...VALID, sources: ["https://blog.naver.com/foo/123"] },
  ]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("1차 출처");
});

test("checked가 2026-09가 아니면 실패한다", () => {
  const r = validateCards([{ ...VALID, checked: "2024-01" }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("checked");
});

test("reserve가 허용값 밖이면 실패한다", () => {
  const r = validateCards([{ ...VALID, reserve: "몰라요" }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("reserve");
});
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: FAIL — `Cannot find module './validate-cards.mjs'`

- [ ] **Step 4: 검증기 구현**

`scripts/validate-cards.mjs`:

```javascript
import { readFileSync, existsSync } from "node:fs";

const REQUIRED = [
  "id", "name", "nameJa", "cat", "area", "lat", "lng",
  "budget", "hours", "reserve", "seat4", "why",
  "walkFrom", "checked", "sources",
];

const RESERVE_VALUES = ["예약필요", "예약권장", "워크인", "불가·웨이팅"];

const OSAKA_BOUNDS = { latMin: 34.60, latMax: 34.78, lngMin: 135.40, lngMax: 135.60 };

// 한국 블로그·커뮤니티 단독 근거를 막는다. 1차 출처가 최소 1개 있어야 한다.
const PRIMARY_HOSTS = [
  "tabelog.com",
  "google.com/maps",
  "maps.app.goo.gl",
  "goo.gl/maps",
  "instagram.com",
  "gurunavi.com",
  "hotpepper.jp",
  "retty.me",
];

const isPrimary = (url) => PRIMARY_HOSTS.some((h) => url.includes(h));

// 공식 사이트는 호스트를 열거할 수 없으므로, 알려진 블로그·커뮤니티 호스트가
// 아니면 1차 출처로 인정한다.
const SECONDARY_HOSTS = [
  "blog.naver.com", "m.blog.naver.com", "brunch.co.kr",
  "tistory.com", "cafe.naver.com", "post.naver.com",
  "youtube.com", "youtu.be",
];
const isSecondary = (url) => SECONDARY_HOSTS.some((h) => url.includes(h));

export function validateCards(cards) {
  const errors = [];
  const seen = new Set();

  for (const [i, c] of cards.entries()) {
    const label = `[${i}] ${c?.id ?? "id없음"} ${c?.name ?? ""}`.trim();

    if (!c || typeof c !== "object") {
      errors.push(`${label}: 카드가 객체가 아님`);
      continue;
    }

    for (const f of REQUIRED) {
      const v = c[f];
      const empty =
        v === undefined || v === null || v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (empty) errors.push(`${label}: 필수 필드 누락 — ${f}`);
    }

    if (c.id) {
      if (seen.has(c.id)) errors.push(`${label}: id 중복 — ${c.id}`);
      seen.add(c.id);
    }

    if (typeof c.lat === "number" && typeof c.lng === "number") {
      const inBox =
        c.lat >= OSAKA_BOUNDS.latMin && c.lat <= OSAKA_BOUNDS.latMax &&
        c.lng >= OSAKA_BOUNDS.lngMin && c.lng <= OSAKA_BOUNDS.lngMax;
      if (!inBox) errors.push(`${label}: 좌표가 오사카 범위 밖 — ${c.lat},${c.lng}`);
    }

    if (c.checked !== "2026-09") {
      errors.push(`${label}: checked 값이 "2026-09"가 아님 — ${c.checked}`);
    }

    if (c.reserve && !RESERVE_VALUES.includes(c.reserve)) {
      errors.push(`${label}: reserve 허용값 밖 — ${c.reserve}`);
    }

    if (typeof c.seat4 !== "boolean") {
      errors.push(`${label}: seat4는 boolean이어야 함`);
    }

    if (Array.isArray(c.sources) && c.sources.length > 0) {
      const hasPrimary = c.sources.some((u) => isPrimary(u) || !isSecondary(u));
      if (!hasPrimary) {
        errors.push(`${label}: 1차 출처 없음 (한국 블로그 단독 근거 금지)`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

const FILES = [
  "data/cards-food.json",
  "data/cards-drink.json",
  "data/cards-shopping.json",
  "data/cards-stay.json",
];

// CLI: 존재하는 데이터 파일을 전부 모아 한 번에 검증한다 (파일 간 id 중복도 잡힌다).
if (import.meta.main) {
  const all = [];
  for (const f of FILES) {
    if (!existsSync(f)) continue;
    const parsed = JSON.parse(readFileSync(f, "utf-8"));
    all.push(...parsed);
  }
  const { ok, errors } = validateCards(all);
  console.log(`검사한 카드: ${all.length}장`);
  if (!ok) {
    for (const e of errors) console.error("  ✗ " + e);
    console.error(`\n실패 ${errors.length}건`);
    process.exit(1);
  }
  console.log("전부 통과");
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: PASS — 8 tests

- [ ] **Step 6: 커밋**

```bash
git add package.json scripts/validate-cards.mjs scripts/validate-cards.test.mjs
git commit -m "feat(validate): 카드 스키마 검증기 + 테스트"
```

---

### Task 2: 분류 체계와 숙소 기준점

**Files:**
- Create: `data/taxonomy.json`
- Modify: `scripts/validate-cards.mjs` (cat/area 값을 taxonomy와 대조)
- Modify: `scripts/validate-cards.test.mjs` (대조 테스트 추가)

**Interfaces:**
- Consumes: Task 1의 `validateCards(cards)`
- Produces: `validateCards(cards, taxonomy)` — 두 번째 인자가 있으면 `cat`/`area` 값을 taxonomy에 대조한다. Task 3~6은 여기 정의된 `cat`/`area` 키만 쓴다

- [ ] **Step 1: taxonomy.json 작성**

`data/taxonomy.json`:

```json
{
  "home": {
    "label": "숙소 (시마노우치)",
    "address": "2-chome-11-30 Shimanouchi, Chuo-ku, Osaka",
    "lat": 34.6726,
    "lng": 135.5039,
    "note": "좌표는 Task 2에서 구글맵으로 재확인한 값"
  },
  "categories": {
    "food-konamon": "코나몬 (오코노미야키·타코야키)",
    "food-kushikatsu": "쿠시카츠",
    "food-ramen": "라멘",
    "food-yakiniku": "야키니쿠·호르몬",
    "food-kaisen": "카이센·스시",
    "food-teishoku": "우동·소바·정식",
    "food-morning": "해장·아침",
    "drink-izakaya": "이자카야",
    "drink-tachinomi": "타치노미 (서서마시기)",
    "drink-craftbeer": "크래프트비어",
    "drink-bar": "바·위스키",
    "drink-yokocho": "요코초 골목",
    "drink-late": "심야 2차·마무리",
    "shop-donki": "돈키·드럭스토어",
    "shop-electronics": "전자",
    "shop-fashion": "패션·빈티지",
    "shop-souvenir": "기념품·식품",
    "stay": "숙소 후보 (11/8)"
  },
  "areas": {
    "dotonbori": "도톤보리",
    "uranamba": "우라난바",
    "shinsaibashi": "신사이바시·아메무라",
    "nipponbashi": "니혼바시·구로몬",
    "tenma": "텐마·텐진바시스지",
    "umeda": "우메다",
    "shinsekai": "신세카이",
    "fukushima": "후쿠시마"
  }
}
```

- [ ] **Step 2: 숙소 좌표 확인**

구글맵에서 `2-chome-11-30 Shimanouchi, Chuo-ku, Osaka`를 조회해 실제 좌표를 확인하고, 위 `home.lat`/`home.lng`를 실측값으로 교체한다. 확인 후 `note` 필드는 삭제한다.
이 좌표가 이후 모든 카드의 `walkFrom` 계산 기준이 되므로 반드시 먼저 확정한다.

- [ ] **Step 3: 실패하는 테스트 추가**

`scripts/validate-cards.test.mjs` 끝에 추가:

```javascript
import taxonomy from "../data/taxonomy.json";

test("taxonomy에 없는 cat은 실패한다", () => {
  const r = validateCards([{ ...VALID, cat: "food-없는카테고리" }], taxonomy);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("cat");
});

test("taxonomy에 없는 area는 실패한다", () => {
  const r = validateCards([{ ...VALID, area: "kyoto" }], taxonomy);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("area");
});

test("taxonomy를 넘겨도 정상 카드는 통과한다", () => {
  const r = validateCards([VALID], taxonomy);
  expect(r.ok).toBe(true);
});
```

- [ ] **Step 4: 테스트 실행해서 실패 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: FAIL — taxonomy 대조 테스트 3개가 실패 (검증기가 두 번째 인자를 무시하므로 `ok`가 true로 나온다)

- [ ] **Step 5: 검증기에 taxonomy 대조 추가**

`scripts/validate-cards.mjs`의 함수 시그니처와 루프 안을 수정한다:

```javascript
export function validateCards(cards, taxonomy = null) {
```

`reserve` 검사 블록 바로 아래에 추가:

```javascript
    if (taxonomy) {
      if (c.cat && !(c.cat in taxonomy.categories)) {
        errors.push(`${label}: taxonomy에 없는 cat — ${c.cat}`);
      }
      if (c.area && !(c.area in taxonomy.areas)) {
        errors.push(`${label}: taxonomy에 없는 area — ${c.area}`);
      }
    }
```

CLI 블록도 taxonomy를 넘기도록 수정한다:

```javascript
if (import.meta.main) {
  const taxonomy = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));
  const all = [];
  for (const f of FILES) {
    if (!existsSync(f)) continue;
    const parsed = JSON.parse(readFileSync(f, "utf-8"));
    all.push(...parsed);
  }
  const { ok, errors } = validateCards(all, taxonomy);
  console.log(`검사한 카드: ${all.length}장`);
  if (!ok) {
    for (const e of errors) console.error("  ✗ " + e);
    console.error(`\n실패 ${errors.length}건`);
    process.exit(1);
  }
  console.log("전부 통과");
}
```

- [ ] **Step 6: 테스트 실행해서 통과 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: PASS — 11 tests

- [ ] **Step 7: 커밋**

```bash
git add data/taxonomy.json scripts/validate-cards.mjs scripts/validate-cards.test.mjs
git commit -m "feat(taxonomy): 카테고리·지역 상수 + 검증기 대조"
```

---

### Task 3: 음식 카드 — 미나미 권 (20장)

리서치 태스크는 코드가 아니라 데이터를 만든다. 검증기 통과가 테스트다.

**Files:**
- Create: `data/cards-food.json`
- Create: `docs/research/sources.md`

**Interfaces:**
- Consumes: Task 2의 `data/taxonomy.json` (`cat`/`area` 키), `home` 좌표
- Produces: `data/cards-food.json` — id 접두사 `f-`. Task 4~6은 다른 접두사를 쓴다 (`d-`, `s-`, `h-`)

- [ ] **Step 1: 리서치 — 미나미 권 음식점 조사**

대상 지역: `dotonbori`, `uranamba`, `shinsaibashi`, `nipponbashi`
대상 카테고리: `food-konamon` 4~5장, `food-kushikatsu` 3장, `food-ramen` 3~4장, `food-yakiniku` 3~4장, `food-kaisen` 3장, `food-teishoku` 2~3장

각 후보마다 스펙 §6의 4단계 검증을 수행한다:

1. **존재 확인** — 구글맵/타베로그에서 2026년 현재 영업 중인지. 폐업·이전·장기휴업이면 탈락
2. **영업정보** — 영업시간·정기휴무·라스트오더를 2026년 기준으로 확인
3. **평판 교차** — 타베로그 점수와 구글 평점을 모두 확인. 최근 6개월 리뷰가 있는지 확인
4. **4인 실전성** — 4명 동시 착석 가능 여부. 카운터만 있는 소형 노포는 `seat4: false`로 명시하거나 탈락

WebSearch/WebFetch로 조사하고, 확인한 URL은 전부 `sources`에 기록한다.

- [ ] **Step 2: cards-food.json 작성**

배열 형식. 각 원소는 Task 1의 `VALID` 형태를 따른다. 예:

```json
[
  {
    "id": "f-01",
    "name": "미즈노",
    "nameJa": "美津の",
    "cat": "food-konamon",
    "area": "dotonbori",
    "lat": 34.6687,
    "lng": 135.5013,
    "budget": "1,500~2,500엔",
    "hours": "11:00-22:00 (L.O. 21:00)",
    "closed": "목",
    "reserve": "불가·웨이팅",
    "seat4": true,
    "why": "도톤보리 오코노미야키 노포. 마죠야키가 간판",
    "caution": "피크 60~90분 대기. 개점 직후 또는 15시대 권장",
    "walkFrom": "숙소 도보 9분",
    "checked": "2026-09",
    "sources": [
      "https://tabelog.com/osaka/A2701/A270101/27000860/",
      "https://maps.app.goo.gl/..."
    ]
  }
]
```

주의: 위 미즈노 항목의 좌표·영업시간·타베로그 URL은 **예시일 뿐이므로 실제 조사값으로 교체한다.** 조사 없이 그대로 커밋하지 않는다.

`walkFrom`은 `data/taxonomy.json`의 `home` 좌표에서 구글맵 도보 경로로 계산한다. 도보 20분을 넘으면 `"지하철 <노선> <역> 하차, 도보 N분"` 형식으로 적는다.

- [ ] **Step 3: 검증 실행**

Run: `bun run validate`
Expected: `검사한 카드: 20장` / `전부 통과`

실패하면 오류 메시지가 가리키는 필드를 고치고 다시 실행한다.

- [ ] **Step 4: sources.md 초안 작성**

`docs/research/sources.md`:

```markdown
# 카드 근거 기록

확인 시점: 2026-09
검증 기준: 스펙 §6 (존재 확인 / 영업정보 / 평판 교차 / 4인 실전성)

## 음식

| id | 이름 | 근거 URL | 확인 내용 |
|---|---|---|---|
| f-01 | 미즈노 | https://tabelog.com/... | 2026-09 영업 확인, 타베로그 3.6, 목 휴무 |
```

조사한 카드를 전부 표에 채운다.

- [ ] **Step 5: 커밋**

```bash
git add data/cards-food.json docs/research/sources.md
git commit -m "feat(cards): 음식 카드 미나미 권 20장"
```

---

### Task 4: 음식 카드 — 원정 권 + 해장·아침 (15~20장)

**Files:**
- Modify: `data/cards-food.json` (배열에 추가)
- Modify: `docs/research/sources.md`

**Interfaces:**
- Consumes: Task 3의 `data/cards-food.json` (기존 id `f-01`~`f-20`)
- Produces: id `f-21` 이후를 이어서 부여한다

- [ ] **Step 1: 리서치 — 원정 권 + 아침**

대상 지역: `tenma`, `umeda`, `shinsekai`, `fukushima`
- `tenma` — 텐진바시스지 상점가 일대 가성비 식당 4~5장
- `umeda` — 쇼핑 동선 중 식사 3~4장
- `shinsekai` — 쿠시카츠 본진 2~3장
- `fukushima` — 야키니쿠·호르몬 2장
- `food-morning` — **숙소 도보권 해장·아침 4~5장.** 달리는 밤 다음날 10~11시에 여는 곳 위주. 이 카테고리는 지역이 미나미여도 된다

검증은 Task 3 Step 1과 동일한 4단계를 적용한다.

- [ ] **Step 2: 카드 추가**

`data/cards-food.json` 배열 끝에 이어 붙인다. 형식은 Task 3 Step 2와 동일하다.

`food-morning` 카드에는 `hours` 필드에 **개점 시각**이 명확히 드러나야 한다 (예: `"07:00-15:00"`). 11시 이후 개점이면 `caution`에 `"11시 개점 — 늦은 아침에 적합"`처럼 적는다.

- [ ] **Step 3: 검증 실행**

Run: `bun run validate`
Expected: `검사한 카드: 35~40장` / `전부 통과`

- [ ] **Step 4: sources.md 갱신**

Task 3에서 만든 음식 표에 새 카드 행을 추가한다.

- [ ] **Step 5: 커밋**

```bash
git add data/cards-food.json docs/research/sources.md
git commit -m "feat(cards): 음식 카드 원정 권·해장 15~20장"
```

---

### Task 5: 술 카드 (25~30장)

**Files:**
- Create: `data/cards-drink.json`
- Modify: `docs/research/sources.md`

**Interfaces:**
- Consumes: `data/taxonomy.json`
- Produces: `data/cards-drink.json` — id 접두사 `d-`

- [ ] **Step 1: 리서치 — 술집 조사**

카테고리 배분:
- `drink-izakaya` 6~7장 — 4인 착석 가능한 곳 우선. `seat4: true`가 특히 중요하다
- `drink-tachinomi` 4~5장 — 서서 마시는 곳. 4인이 붙어 설 수 있는지 확인
- `drink-craftbeer` 3~4장
- `drink-bar` 3~4장 — 2차용. 위스키·하이볼
- `drink-yokocho` 4~5장 — 우라난바 골목, 호젠지요코초, 텐마 일대. 골목 자체를 카드로 만들어도 되고 개별 점포로 만들어도 된다. 골목 카드면 `seat4`는 `true`, `reserve`는 `"워크인"`으로 둔다
- `drink-late` 4~5장 — **새벽 2시 이후까지 여는 곳.** `hours`에 마감 시각을 반드시 적는다

검증은 Task 3 Step 1의 4단계를 적용하되, 술집은 **마감 시각**과 **차지(자릿세) 유무**를 추가로 확인한다. 차지가 있으면 `caution`에 `"차지 <금액>엔"`으로 명시한다.

- [ ] **Step 2: cards-drink.json 작성**

배열 형식. `budget`은 1인 음주 기준 금액대로 적는다 (예: `"3,000~4,500엔"`).

- [ ] **Step 3: 검증 실행**

Run: `bun run validate`
Expected: `검사한 카드: 60~70장` / `전부 통과`

- [ ] **Step 4: sources.md에 술 섹션 추가**

```markdown
## 술

| id | 이름 | 근거 URL | 확인 내용 |
|---|---|---|---|
```

- [ ] **Step 5: 커밋**

```bash
git add data/cards-drink.json docs/research/sources.md
git commit -m "feat(cards): 술 카드 25~30장"
```

---

### Task 6: 쇼핑 카드 + 11/8 숙소 후보 (25~33장)

**Files:**
- Create: `data/cards-shopping.json`
- Create: `data/cards-stay.json`
- Modify: `docs/research/sources.md`

**Interfaces:**
- Consumes: `data/taxonomy.json`
- Produces: `data/cards-shopping.json` (id 접두사 `s-`), `data/cards-stay.json` (id 접두사 `h-`)

- [ ] **Step 1: 리서치 — 쇼핑 20~25장**

- `shop-donki` 3~4장 — 돈키호테 지점, 드럭스토어. 24시간 영업 여부 확인
- `shop-electronics` 3~4장 — 요도바시 우메다, 빅카메라, 닛폰바시 덴덴타운
- `shop-fashion` 6~8장 — 신사이바시스지, 아메리카무라, 빈티지숍. 30대 후반 남성 기준
- `shop-souvenir` 6~8장 — 구로몬 시장, 식품·주류·과자

쇼핑 카드의 필드 해석:
- `budget` — 1인 예상 지출대 또는 `"가격대 다양"`
- `reserve` — 전부 `"워크인"`
- `seat4` — 매장이 4명이 함께 다닐 만한 규모면 `true`. 협소한 빈티지숍은 `false`
- `caution` — **면세 카운터 위치와 마감 시각**, 여권 필요 여부

- [ ] **Step 2: cards-shopping.json 작성 후 검증**

Run: `bun run validate`
Expected: `전부 통과`

- [ ] **Step 3: 리서치 — 11/8 숙소 후보 5~8장**

스펙 §5.1 조건:
- 미나미 권(신사이바시·난바·니혼바시). 시마노우치에서 **짐 들고 도보 이동 가능한 거리** (도보 15분 이내)
- 성인 4명: 1실 4인 또는 2인 2실
- 2026-11-08(일) 1박 가능 여부
- 11/9 06:45 출발 기준 난바역 접근성
- 조식 불필요 (새벽 출발)

숙소 카드의 필드 해석:
- `cat` — `"stay"`
- `budget` — **4인 총액 1박 기준** (예: `"4인 1박 22,000~28,000엔"`)
- `hours` — 체크인/체크아웃 시각 (예: `"IN 15:00 / OUT 11:00"`)
- `closed` — `"-"`
- `reserve` — `"예약필요"`
- `seat4` — 4인 수용 가능하면 `true`
- `caution` — 4인 1실 가능 여부, 프런트 운영 시간(새벽 체크아웃 가능한지), 짐 보관 가능 여부
- `walkFrom` — 시마노우치 에어비앤비에서의 도보 시간

- [ ] **Step 4: cards-stay.json 작성 후 검증**

Run: `bun run validate`
Expected: `검사한 카드: 90~100장` / `전부 통과`

- [ ] **Step 5: sources.md에 쇼핑·숙소 섹션 추가**

- [ ] **Step 6: 커밋**

```bash
git add data/cards-shopping.json data/cards-stay.json docs/research/sources.md
git commit -m "feat(cards): 쇼핑 카드 + 11/8 숙소 후보"
```

---

### Task 7: Google Place ID 수집

사진(Plan 2 §7)은 `placeId`가 있어야 동작한다. 런타임 검색을 없애기 위해 여기서 하드코딩한다.

**Files:**
- Modify: `data/cards-food.json`, `data/cards-drink.json`, `data/cards-shopping.json`, `data/cards-stay.json`
- Modify: `scripts/validate-cards.mjs`
- Modify: `scripts/validate-cards.test.mjs`

**Interfaces:**
- Consumes: Task 3~6의 카드 4파일 (`nameJa` 필드)
- Produces: 모든 카드에 `placeId` 필드. Plan 2의 사진 fetch가 이 값을 쓴다

- [ ] **Step 1: 실패하는 테스트 추가**

`scripts/validate-cards.test.mjs` 끝에 추가:

```javascript
test("placeId가 있으면 형식을 검사한다", () => {
  const r = validateCards([{ ...VALID, placeId: "잘못된값" }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("placeId");
});

test("정상 placeId는 통과한다", () => {
  const r = validateCards([
    { ...VALID, placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4" },
  ]);
  expect(r.ok).toBe(true);
});

test("placeId가 없어도 통과한다 (선택 필드)", () => {
  const r = validateCards([VALID]);
  expect(r.ok).toBe(true);
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: FAIL — `placeId가 있으면 형식을 검사한다`가 실패

- [ ] **Step 3: 검증기에 placeId 검사 추가**

`scripts/validate-cards.mjs`의 taxonomy 대조 블록 아래에 추가:

```javascript
    // placeId는 선택 필드지만, 있으면 Google Place ID 형식이어야 한다.
    if (c.placeId !== undefined) {
      if (typeof c.placeId !== "string" || !/^ChI[A-Za-z0-9_-]{20,}$/.test(c.placeId)) {
        errors.push(`${label}: placeId 형식 오류 — ${c.placeId}`);
      }
    }
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `bun test scripts/validate-cards.test.mjs`
Expected: PASS — 14 tests

- [ ] **Step 5: placeId 수집**

각 카드의 `nameJa` + 주소로 Google Maps에서 장소를 찾아 Place ID를 얻는다. 수단 두 가지 중 하나:

- Google의 Place ID Finder (`https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder`)에 `nameJa`를 입력해 조회
- 또는 구글맵 공유 URL에서 추출

찾지 못한 카드는 `placeId`를 넣지 않고 넘어간다 (선택 필드). Plan 2에서 사진 없이 렌더링된다.

수집률이 80% 미만이면 그 사실을 커밋 메시지에 적는다 — Plan 2의 사진 커버리지 기대치가 달라진다.

- [ ] **Step 6: 검증 실행**

Run: `bun run validate`
Expected: `전부 통과`

- [ ] **Step 7: 커밋**

```bash
git add data/cards-*.json scripts/validate-cards.mjs scripts/validate-cards.test.mjs
git commit -m "feat(cards): Google Place ID 수집 + 형식 검증"
```

---

### Task 8: 일정 뼈대와 이동시간 테이블

**Files:**
- Create: `data/itinerary.json`
- Create: `data/transit.json`

**Interfaces:**
- Consumes: `data/taxonomy.json`의 `areas` 키, Task 3~6의 카드 id
- Produces: `data/itinerary.json` (플랜 A/B/C의 일자별 슬롯), `data/transit.json` (지역 간 이동시간). Plan 2의 타임라인과 지도 라우팅이 이 둘을 쓴다

- [ ] **Step 1: itinerary.json 작성**

스펙 §8의 뼈대를 데이터로 옮긴다. `cardId`는 Task 3~6에서 실제로 만든 카드의 id를 쓴다 (존재하지 않는 id를 쓰면 Step 3 검사에서 걸린다).

```json
{
  "tripDays": [
    { "date": "2026-11-06", "dow": "금", "label": "도착·워밍업" },
    { "date": "2026-11-07", "dow": "토", "label": "원정·쇼핑" },
    { "date": "2026-11-08", "dow": "일", "label": "숙소 이동·마지막 밤" },
    { "date": "2026-11-09", "dow": "월", "label": "귀국" }
  ],
  "plans": {
    "A": { "label": "미식 집중", "desc": "기본안. 먹고 마시는 데 시간을 몰아준다" },
    "B": { "label": "쇼핑 강화", "desc": "11/7 우메다 종일, 술은 1차만" },
    "C": { "label": "관광 곁들임", "desc": "오사카성·우메다스카이·신세카이 각 1개 삽입" }
  },
  "itineraries": {
    "A": [
      {
        "date": "2026-11-06",
        "slots": [
          { "time": "09:50", "title": "KIX 도착", "area": null, "cardId": null, "note": "입국심사 후 난카이 승강장" },
          { "time": "10:20", "title": "난카이 공항급행 → 난바", "area": null, "cardId": null, "note": "약 45분" },
          { "time": "11:15", "title": "숙소 짐 보관", "area": "shinsaibashi", "cardId": null, "note": "체크인 15:00, 짐만 맡긴다" },
          { "time": "12:00", "title": "점심 — 코나몬", "area": "dotonbori", "cardId": "f-01", "note": "" }
        ]
      }
    ]
  }
}
```

세 플랜 모두 4일치를 채운다. 11/9는 `06:45 숙소 출발` / `07:00 난바` / `08:00 KIX` / `10:45 이륙` 4개 슬롯만 두고, 세 플랜이 동일하다.

- [ ] **Step 2: transit.json 작성**

지역 간 이동시간 테이블. 스펙 §10의 하이브리드 방식을 데이터로 표현한다.

```json
{
  "home": { "lat": 34.6726, "lng": 135.5039 },
  "walk": [
    { "from": "home", "to": "dotonbori", "min": 9 },
    { "from": "home", "to": "shinsaibashi", "min": 6 },
    { "from": "home", "to": "uranamba", "min": 11 },
    { "from": "home", "to": "nipponbashi", "min": 12 }
  ],
  "subway": [
    {
      "from": "shinsaibashi",
      "to": "umeda",
      "line": "midosuji",
      "lineLabel": "미도스지선",
      "color": "#e5171f",
      "min": 8,
      "transfers": 0,
      "fare": 240
    },
    {
      "from": "nipponbashi",
      "to": "tenma",
      "line": "sakaisuji",
      "lineLabel": "사카이스지선",
      "color": "#814721",
      "min": 10,
      "transfers": 0,
      "fare": 240
    }
  ],
  "airport": [
    { "from": "namba", "to": "kix", "mode": "난카이 공항급행", "min": 45, "fare": 970 },
    { "from": "namba", "to": "kix", "mode": "난카이 라피트", "min": 38, "fare": 1490 }
  ]
}
```

`walk`는 `home`에서 8개 지역 전부에 대해, `subway`는 스펙 §8 동선에 실제로 등장하는 조합에 대해 채운다. 소요시간과 요금은 2026-09 기준으로 확인한다.

- [ ] **Step 3: 참조 무결성 검사기 작성**

`scripts/check-refs.mjs`:

```javascript
import { readFileSync } from "node:fs";

const ids = new Set();
for (const f of ["food", "drink", "shopping", "stay"]) {
  for (const c of JSON.parse(readFileSync(`data/cards-${f}.json`, "utf-8"))) {
    ids.add(c.id);
  }
}

const tax = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));
const it = JSON.parse(readFileSync("data/itinerary.json", "utf-8"));

let bad = 0;
for (const [plan, days] of Object.entries(it.itineraries)) {
  for (const d of days) {
    for (const s of d.slots) {
      if (s.cardId && !ids.has(s.cardId)) {
        console.error(`✗ ${plan} ${d.date} ${s.time}: 없는 cardId — ${s.cardId}`);
        bad++;
      }
      if (s.area && !(s.area in tax.areas)) {
        console.error(`✗ ${plan} ${d.date} ${s.time}: 없는 area — ${s.area}`);
        bad++;
      }
    }
  }
}

// transit.json이 참조하는 지역도 taxonomy에 있어야 한다.
const transit = JSON.parse(readFileSync("data/transit.json", "utf-8"));
for (const leg of [...transit.walk, ...transit.subway]) {
  for (const key of [leg.from, leg.to]) {
    if (key !== "home" && !(key in tax.areas)) {
      console.error(`✗ transit: 없는 area — ${key}`);
      bad++;
    }
  }
}

console.log(bad === 0 ? "참조 무결성 OK" : `실패 ${bad}건`);
process.exit(bad === 0 ? 0 : 1);
```

`package.json`의 `scripts`에 추가한다:

```json
"check-refs": "bun run scripts/check-refs.mjs"
```

- [ ] **Step 4: 참조 무결성 실행**

Run: `bun run check-refs`
Expected: `참조 무결성 OK`

실패하면 `itinerary.json`의 `cardId`를 Task 3~6에서 실제로 만든 id로 고친다.

- [ ] **Step 5: 커밋**

```bash
git add data/itinerary.json data/transit.json scripts/check-refs.mjs package.json
git commit -m "feat(itinerary): 3.5일 일정 뼈대 + 이동시간 테이블 + 참조 검사기"
```

---

### Task 9: 리서치 문서 생성기 + 최종 산출물

사용자가 카드를 검토하려면 JSON이 아니라 읽을 수 있는 문서가 필요하다. 이 태스크가 Plan 1의 승인 게이트 산출물을 만든다.

**Files:**
- Create: `scripts/gen-research-docs.mjs`
- Create: `docs/research/cards-food.md`, `cards-drink.md`, `cards-shopping.md`, `cards-stay.md` (생성물)
- Create: `README.md`

**Interfaces:**
- Consumes: Task 3~7의 카드 4파일, Task 2의 `data/taxonomy.json`
- Produces: `docs/research/cards-*.md` — 사용자 검토용. Plan 2 시작 전 승인 대상

- [ ] **Step 1: 생성기 작성**

`scripts/gen-research-docs.mjs`:

```javascript
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const taxonomy = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));

const GROUPS = [
  { file: "food", title: "음식" },
  { file: "drink", title: "술" },
  { file: "shopping", title: "쇼핑" },
  { file: "stay", title: "11/8 숙소 후보" },
];

for (const g of GROUPS) {
  const src = `data/cards-${g.file}.json`;
  if (!existsSync(src)) continue;
  const cards = JSON.parse(readFileSync(src, "utf-8"));

  // 카테고리별로 묶어 출력한다. taxonomy 순서를 따른다.
  const byCat = new Map();
  for (const c of cards) {
    if (!byCat.has(c.cat)) byCat.set(c.cat, []);
    byCat.get(c.cat).push(c);
  }

  const lines = [
    `# ${g.title} 후보카드`,
    "",
    `총 ${cards.length}장 · 확인 시점 2026-09`,
    "",
  ];

  for (const catKey of Object.keys(taxonomy.categories)) {
    const group = byCat.get(catKey);
    if (!group) continue;
    lines.push(`## ${taxonomy.categories[catKey]} (${group.length})`, "");
    lines.push("| id | 이름 | 지역 | 예산 | 영업 | 휴무 | 예약 | 4인 | 숙소에서 | 왜 |");
    lines.push("|---|---|---|---|---|---|---|---|---|---|");
    for (const c of group) {
      const area = taxonomy.areas[c.area] ?? c.area;
      const seat = c.seat4 ? "○" : "✕";
      lines.push(
        `| ${c.id} | **${c.name}** (${c.nameJa}) | ${area} | ${c.budget} | ${c.hours} | ${c.closed ?? "-"} | ${c.reserve} | ${seat} | ${c.walkFrom} | ${c.why} |`
      );
    }
    lines.push("");

    // 주의사항이 있는 카드만 따로 모아 보여준다.
    const cautions = group.filter((c) => c.caution);
    if (cautions.length) {
      lines.push("**주의**", "");
      for (const c of cautions) lines.push(`- \`${c.id}\` ${c.name} — ${c.caution}`);
      lines.push("");
    }
  }

  const out = `docs/research/cards-${g.file}.md`;
  writeFileSync(out, lines.join("\n"), "utf-8");
  console.log(`생성: ${out} (${cards.length}장)`);
}
```

- [ ] **Step 2: 생성 실행**

Run: `bun run gen-docs`
Expected: `생성: docs/research/cards-food.md (35~40장)` 등 4줄

- [ ] **Step 3: 생성 결과 확인**

Run: `head -30 docs/research/cards-food.md`
Expected: 제목, 총 장수, 카테고리별 표가 보인다. 표의 셀이 비어 있거나 `undefined`가 있으면 해당 카드의 필드를 고친 뒤 Step 2를 다시 실행한다.

- [ ] **Step 4: README 작성**

`README.md`:

````markdown
# Osaka Trip Dashboard

> 2026.11.06 – 11.09 · 성인 4명 · 오사카 시내

## Trip at a Glance

```
GMP ──7C(08:00)──> KIX ──3박 4일──> KIX ──7C(10:45)──> GMP
11/06 08:00        11/06 09:50              11/09 10:45      11/09 12:35
```

숙소: 시마노우치 에어비앤비 (11/6·11/7) + 미나미 1박 (11/8, 미정)

## 문서

| 문서 | 내용 |
|---|---|
| [설계 스펙](docs/superpowers/specs/2026-09-06-osaka-trip-dashboard-design.md) | 전체 설계 |
| [리서치 계획](docs/superpowers/plans/2026-09-06-osaka-card-research.md) | Plan 1 |
| [음식 카드](docs/research/cards-food.md) | 후보카드 |
| [술 카드](docs/research/cards-drink.md) | 후보카드 |
| [쇼핑 카드](docs/research/cards-shopping.md) | 후보카드 |
| [숙소 후보](docs/research/cards-stay.md) | 11/8 1박 |
| [근거 기록](docs/research/sources.md) | 카드별 출처·확인일 |

## 개발

```bash
bun test          # 검증기 테스트
bun run validate  # 카드 데이터 검증
bun run gen-docs  # JSON -> 리서치 문서 생성
bun run check-refs # 일정이 참조하는 카드 id 무결성 검사
```

데이터의 단일 진실 소스는 `data/*.json`이다. `docs/research/cards-*.md`는 생성물이므로
직접 수정하지 않는다.
````

- [ ] **Step 5: 전체 검증 재실행**

Run: `bun test && bun run validate && bun run gen-docs`
Expected: 테스트 14개 PASS, 카드 전부 통과, 문서 4개 생성

- [ ] **Step 6: 커밋**

```bash
git add scripts/gen-research-docs.mjs docs/research/cards-*.md README.md
git commit -m "feat(docs): 리서치 문서 생성기 + README"
```

---

## Plan 1 완료 조건

- `bun test` 통과 (14 tests)
- `bun run validate` 통과, 카드 90~100장
- `docs/research/cards-*.md` 4개 생성됨
- `docs/research/sources.md`에 전 카드 근거 기록됨
- `bun run check-refs` 통과 (일정이 참조하는 cardId·area 무결성)

**승인 게이트**: 사용자가 `docs/research/cards-*.md`를 검토하고 승인해야 Plan 2(대시보드 구현)를 작성한다.
