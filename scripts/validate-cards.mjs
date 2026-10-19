import { readFileSync, existsSync, readdirSync } from "node:fs";

const REQUIRED = [
  "id", "name", "nameJa", "cat", "area", "lat", "lng",
  "budget", "hours", "reserve", "seat4", "why",
  "walkFrom", "checked", "sources",
];

const RESERVE_VALUES = ["예약필요", "예약권장", "워크인", "불가·웨이팅"];

const OSAKA_BOUNDS = { latMin: 34.60, latMax: 34.78, lngMin: 135.40, lngMax: 135.60 };

// 공식 사이트(돈키·요도바시·551호라이 등)는 호스트를 미리 열거할 수 없어
// 허용목록 방식으로는 걸러낼 수 없다. 대신 2단계 판정으로 바꾼다:
//   (a) 한국 블로그·커뮤니티 등 알려진 저품질 근거 호스트가 아니고
//   (b) 특정 페이지가 아닌 "검색결과" URL이 아니어야 한다.
// 두 조건을 모두 만족하는 출처가 최소 1개 있어야 통과한다.
const DENY_HOSTS = [
  "blog.naver.com", "m.blog.naver.com", "cafe.naver.com", "post.naver.com",
  "blog.daum.net", "cafe.daum.net",
  "tistory.com", "brunch.co.kr",
  "dcinside.com", "clien.net", "ppomppu.co.kr", "ruliweb.com",
  "fmkorea.com", "theqoo.net", "instiz.net", "mlbpark.donga.com", "82cook.com",
  "youtube.com", "youtu.be",
  "blogspot.com", "wordpress.com", "velog.io",
];

const isDenied = (url) => DENY_HOSTS.some((h) => url.includes(h));

// 경로에 /search가 있거나, 쿼리스트링에 q=/query=/keyword=/search= 중 하나라도
// 있으면 "검색결과" URL로 본다 (예: google.com/maps/search/?api=1&query=이름).
// 이름만으로 누구나 만들 수 있어 실제로 열어봤다는 증거가 되지 않는다.
// donki.com/store/shop_detail.php?shop_id=... 처럼 검색용이 아닌 쿼리스트링은
// 통과시킨다.
const isSearchUrl = (url) => {
  try {
    const u = new URL(url);
    if (u.pathname.includes("/search")) return true;
    return ["q", "query", "keyword", "search"].some((p) => u.searchParams.has(p));
  } catch {
    if (/\/search/.test(url)) return true;
    return /[?&](q|query|keyword|search)=/.test(url);
  }
};

const isPrimary = (url) => !isDenied(url) && !isSearchUrl(url);

// "1,500~2,500엔" 같은 문자열에서 하한/상한 숫자를 뽑는다. 매치가 없으면(예: "가격대
// 다양") null을 돌려준다.
const parseBudgetRange = (budget) => {
  if (typeof budget !== "string") return null;
  const m = budget.match(/([\d,]+)\s*~\s*([\d,]+)/);
  if (!m) return null;
  const low = Number(m[1].replace(/,/g, ""));
  const high = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return { low, high };
};

// 스펙 예산 밴드(1인 1끼 2,000~4,000엔)는 food-*/drink-* 카드에만 적용한다.
// 쇼핑·숙소는 성격이 달라(쇼핑은 "가격대 다양", 숙소는 4인 합산 총액) 제외한다.
const BUDGET_CAP = 4000;
const isFoodOrDrink = (cat) => typeof cat === "string" && /^(food|drink)-/.test(cat);
const isShop = (cat) => typeof cat === "string" && /^shop-/.test(cat);

export function validateCards(cards, taxonomy = null) {
  const errors = [];
  const warnings = [];
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

    if (taxonomy) {
      if (c.cat && !(c.cat in taxonomy.categories)) {
        errors.push(`${label}: taxonomy에 없는 cat — ${c.cat}`);
      }
      if (c.area && !(c.area in taxonomy.areas)) {
        errors.push(`${label}: taxonomy에 없는 area — ${c.area}`);
      }
    }

    if (typeof c.seat4 !== "boolean") {
      errors.push(`${label}: seat4는 boolean이어야 함`);
    }

    if (Array.isArray(c.sources) && c.sources.length > 0) {
      const hasPrimary = c.sources.some((u) => isPrimary(u));
      if (!hasPrimary) {
        errors.push(`${label}: 1차 출처 없음 — 특정 페이지 URL(검색결과 아님)이면서 한국 블로그·커뮤니티가 아닌 출처가 최소 1개 필요`);
      }
    }


    // ---- 평점 필드: 음식·술 카드 전용 ----
    const hasG = c.googleRating !== undefined;
    const hasR = c.reviewCount !== undefined;
    const hasT = c.tabelogRating !== undefined;
    if ((hasG || hasR || hasT) && !isFoodOrDrink(c.cat)) {
      errors.push(`${label}: googleRating/reviewCount/tabelogRating은 음식·술 카드에만 허용`);
    }
    if (hasG && !(typeof c.googleRating === "number" && c.googleRating >= 0 && c.googleRating <= 5)) {
      errors.push(`${label}: googleRating은 0.0~5.0 숫자여야 함 — ${c.googleRating}`);
    }
    if (hasR && !(Number.isInteger(c.reviewCount) && c.reviewCount > 0)) {
      errors.push(`${label}: reviewCount는 양의 정수여야 함 — ${c.reviewCount}`);
    }
    if (hasG !== hasR) {
      errors.push(`${label}: googleRating과 reviewCount는 함께 있어야 함 (${hasG ? "reviewCount" : "googleRating"} 누락)`);
    }
    if (hasT && !(typeof c.tabelogRating === "number" && c.tabelogRating >= 0 && c.tabelogRating <= 5)) {
      errors.push(`${label}: tabelogRating은 0.0~5.0 숫자여야 함 — ${c.tabelogRating}`);
    }

    // ---- 현지 인기 지표: 음식·술 카드 전용 ----
    const hasTR = c.tabelogReviews !== undefined;
    const hasHy = c.hyakumeiten !== undefined;
    if ((hasTR || hasHy) && !isFoodOrDrink(c.cat)) {
      errors.push(`${label}: tabelogReviews/hyakumeiten은 음식·술 카드에만 허용`);
    }
    if (hasTR && !(Number.isInteger(c.tabelogReviews) && c.tabelogReviews > 0)) {
      errors.push(`${label}: tabelogReviews는 양의 정수여야 함 — ${c.tabelogReviews}`);
    }
    if (hasTR && !hasT) {
      errors.push(`${label}: tabelogReviews가 있으면 tabelogRating도 있어야 함`);
    }
    if (hasHy && !(typeof c.hyakumeiten === "string" && c.hyakumeiten.trim())) {
      errors.push(`${label}: hyakumeiten은 비지 않은 문자열이어야 함 (예: "okonomiyaki 2018~2025")`);
    }

    // ---- 거리: 숙소(taxonomy.home)로부터의 직선거리와 도보 분 ----
    // walkMin은 distM × 1.3(시가지 우회계수) ÷ 75m/분을 올림한 값이어야 한다.
    // 둘을 따로 손으로 고치다 어긋나는 걸 막는다.
    const hasD = c.distM !== undefined;
    const hasW = c.walkMin !== undefined;
    if (hasD && !(typeof c.distM === "number" && c.distM > 0)) {
      errors.push(`${label}: distM은 양수여야 함 — ${c.distM}`);
    }
    if (hasW && !(Number.isInteger(c.walkMin) && c.walkMin > 0)) {
      errors.push(`${label}: walkMin은 양의 정수여야 함 — ${c.walkMin}`);
    }
    if (hasD !== hasW) {
      errors.push(`${label}: distM과 walkMin은 함께 있어야 함 (${hasD ? "walkMin" : "distM"} 누락)`);
    }
    if (hasD && hasW && typeof c.distM === "number" && Number.isInteger(c.walkMin)) {
      const expected = Math.ceil((c.distM * 1.3) / 75);
      if (c.walkMin !== expected) {
        errors.push(`${label}: walkMin이 distM과 어긋남 — distM ${c.distM}m면 ${expected}분이어야 하는데 ${c.walkMin}분`);
      }
    }

    // ---- 브랜드 쇼핑 필드: 쇼핑 카드 전용 ----
    const shopKeys = ["brands", "priceBand", "japanOnly", "whyCheaper"];
    const present = shopKeys.filter((k) => c[k] !== undefined);
    if (present.length > 0) {
      if (!isShop(c.cat)) {
        errors.push(`${label}: ${present.join("/")}은 쇼핑 카드에만 허용`);
      } else {
        for (const k of ["brands", "priceBand", "japanOnly"]) {
          if (c[k] === undefined) errors.push(`${label}: 브랜드 필드 누락 — ${k} (brands·priceBand·japanOnly는 함께 있어야 함)`);
        }
        if (c.brands !== undefined && !(Array.isArray(c.brands) && c.brands.length > 0 && c.brands.every((b) => typeof b === "string" && b.trim()))) {
          errors.push(`${label}: brands는 비지 않은 문자열 배열이어야 함`);
        }
        if (c.priceBand !== undefined && !(typeof c.priceBand === "string" && c.priceBand.trim())) {
          errors.push(`${label}: priceBand는 비지 않은 문자열이어야 함`);
        }
        if (c.japanOnly !== undefined && typeof c.japanOnly !== "boolean") {
          errors.push(`${label}: japanOnly는 boolean이어야 함`);
        }
        if (c.whyCheaper !== undefined && typeof c.whyCheaper !== "string") {
          errors.push(`${label}: whyCheaper는 문자열이어야 함 (근거 없으면 빈 문자열)`);
        }
      }
    }

    if (isFoodOrDrink(c.cat)) {
      const range = parseBudgetRange(c.budget);
      if (range) {
        if (range.low > BUDGET_CAP) {
          errors.push(`${label}: 예산 하한이 ${BUDGET_CAP.toLocaleString()}엔 초과 — ${c.budget}`);
        } else if (range.high > BUDGET_CAP) {
          warnings.push(`${label}: 예산 상한이 ${BUDGET_CAP.toLocaleString()}엔 초과 — ${c.budget}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

// data/cards-*.json 전부를 정렬된 경로 목록으로 찾는다 (taxonomy.json은 패턴에
// 안 걸리므로 자연히 제외된다). Bun/Node 버전에 따라 node:fs의 globSync가 없을 수
// 있으므로 의존성 추가 없이 readdirSync + 필터로 구현한다.
export function discoverCardFiles(dir = "data") {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith("cards-") && f.endsWith(".json"))
    .map((f) => `${dir}/${f}`)
    .sort();
}

// CLI: 존재하는 데이터 파일을 전부 모아 한 번에 검증한다 (파일 간 id 중복도 잡힌다).
if (import.meta.main) {
  const taxonomy = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));
  const files = discoverCardFiles();
  const all = [];
  for (const f of files) {
    const parsed = JSON.parse(readFileSync(f, "utf-8"));
    console.log(`${f}: ${parsed.length}장`);
    all.push(...parsed);
  }
  const { ok, errors, warnings } = validateCards(all, taxonomy);
  console.log(`\n검사한 카드: ${all.length}장`);
  if (warnings.length) {
    console.log(`\n경고 ${warnings.length}건 (실패 아님 — 예산 상한 4,000엔 초과):`);
    for (const w of warnings) console.log("  ⚠ " + w);
  }
  if (!ok) {
    for (const e of errors) console.error("  ✗ " + e);
    console.error(`\n실패 ${errors.length}건`);
    process.exit(1);
  }
  console.log("전부 통과");
}
