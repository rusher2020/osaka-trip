import { test, expect } from "bun:test";
import { validateCards, discoverCardFiles } from "./validate-cards.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

test("한국 커뮤니티(clien.net)만 근거면 실패한다 (확장된 denylist)", () => {
  const r = validateCards([
    { ...VALID, sources: ["https://clien.net/service/board/park/123"] },
  ]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("1차 출처");
});

test("denylist에도 없고 검색 URL도 아닌 임의 호스트는 통과한다 (허용목록 방식에서 denylist 방식으로 전환)", () => {
  const r = validateCards([
    { ...VALID, sources: ["https://www.somerandomsite.example/reviews/mizuno"] },
  ]);
  expect(r.ok).toBe(true);
});

test("공식 사이트 URL에 검색용이 아닌 쿼리스트링이 있어도 1차 출처로 인정한다", () => {
  const r = validateCards([
    {
      ...VALID,
      sources: ["https://donki.com/store/shop_detail.php?shop_id=1234"],
    },
  ]);
  expect(r.ok).toBe(true);
});

test("구글맵 검색 URL(query=)은 1차 출처로 인정하지 않는다", () => {
  const r = validateCards([
    {
      ...VALID,
      sources: [
        "https://www.google.com/maps/search/?api=1&query=%E3%83%9F%E3%82%BA%E3%83%8E",
      ],
    },
  ]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("1차 출처");
});

test("구글맵 place URL은 1차 출처로 인정한다", () => {
  const r = validateCards([
    {
      ...VALID,
      sources: [
        "https://www.google.com/maps/place/%E7%BE%8E%E6%B4%A5%E3%81%AE/@34.6687,135.5013,17z",
      ],
    },
  ]);
  expect(r.ok).toBe(true);
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

test("커스텀 taxonomy로 cat/area가 없으면 정상 카드도 실패한다 (실제로 인자를 사용하는지 검증)", () => {
  const customTaxonomy = {
    categories: { "drink-bar": "바" },
    areas: { "umeda": "우메다" },
  };
  const r = validateCards([VALID], customTaxonomy);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("cat");
  expect(r.errors.join()).toContain("area");
});

test("여러 파일을 합친 배열에서도 파일 간 id 중복은 실패한다 (CLI의 다중 파일 병합 흉내)", () => {
  const fileA = [{ ...VALID, id: "f-01" }];
  const fileB = [{ ...VALID, id: "f-01", name: "다른 파일의 카드" }];
  const merged = [...fileA, ...fileB];
  const r = validateCards(merged);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("중복");
});

test("discoverCardFiles는 data/cards-*.json만 정렬된 배열로 찾는다 (taxonomy.json·다른 파일은 제외)", () => {
  const dir = mkdtempSync(join(tmpdir(), "cards-test-"));
  try {
    writeFileSync(join(dir, "cards-b.json"), "[]");
    writeFileSync(join(dir, "cards-a.json"), "[]");
    writeFileSync(join(dir, "cards-food-away.json"), "[]");
    writeFileSync(join(dir, "taxonomy.json"), "{}");
    writeFileSync(join(dir, "notes.txt"), "");

    const found = discoverCardFiles(dir);

    expect(found).toEqual([
      `${dir}/cards-a.json`,
      `${dir}/cards-b.json`,
      `${dir}/cards-food-away.json`,
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("discoverCardFiles는 존재하지 않는 디렉토리에는 빈 배열을 반환한다", () => {
  expect(discoverCardFiles("data/no-such-dir-xyz")).toEqual([]);
});

test("food/drink 카드는 예산 하한이 4,000엔을 넘으면 실패한다", () => {
  const r = validateCards([
    { ...VALID, cat: "food-yakiniku", budget: "4,500~6,000엔" },
  ]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("예산");
});

test("food/drink 카드는 예산 상한만 4,000엔을 넘으면 실패하지 않고 경고만 남긴다", () => {
  const r = validateCards([
    { ...VALID, cat: "drink-craftbeer", budget: "3,500~4,500엔" },
  ]);
  expect(r.ok).toBe(true);
  expect(r.errors).toEqual([]);
  expect(r.warnings.join()).toContain("예산");
  expect(r.warnings.join()).toContain("3,500~4,500엔");
});

test("shop-/stay 카드는 예산이 4,000엔을 넘어도 검사 대상이 아니다", () => {
  const r = validateCards([
    { ...VALID, cat: "shop-fashion", area: "shinsaibashi", budget: "15,000~50,000엔" },
  ]);
  expect(r.ok).toBe(true);
  expect(r.warnings).toEqual([]);
});

// ---- 평점 필드 (googleRating / reviewCount / tabelogRating) ----

test("googleRating+reviewCount+tabelogRating이 정상 범위면 통과한다", () => {
  const r = validateCards([{ ...VALID, googleRating: 4.6, reviewCount: 1240, tabelogRating: 3.62 }]);
  expect(r.ok).toBe(true);
});

test("googleRating이 0~5 밖이면 실패한다", () => {
  const r = validateCards([{ ...VALID, googleRating: 5.3, reviewCount: 100 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("googleRating");
});

test("reviewCount가 양의 정수가 아니면 실패한다", () => {
  const r = validateCards([{ ...VALID, googleRating: 4.5, reviewCount: 12.5 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("reviewCount");
});

test("googleRating만 있고 reviewCount가 없으면 실패한다 (둘은 쌍)", () => {
  const r = validateCards([{ ...VALID, googleRating: 4.5 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("reviewCount");
});

test("reviewCount만 있고 googleRating이 없으면 실패한다 (둘은 쌍)", () => {
  const r = validateCards([{ ...VALID, reviewCount: 800 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("googleRating");
});

test("tabelogRating은 단독으로 있어도 되고, 0~5 밖이면 실패한다", () => {
  expect(validateCards([{ ...VALID, tabelogRating: 3.5 }]).ok).toBe(true);
  const r = validateCards([{ ...VALID, tabelogRating: 6 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("tabelogRating");
});

test("쇼핑·숙소 카드에 평점 필드가 있으면 실패한다", () => {
  const shop = { ...VALID, id: "s-99", cat: "shop-fashion", googleRating: 4.5, reviewCount: 600 };
  const r = validateCards([shop]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("음식·술");
});

// ---- 쇼핑 브랜드 필드 (brands / priceBand / japanOnly / whyCheaper) ----

const SHOP = {
  ...VALID, id: "s-99", cat: "shop-fashion", area: "horie", reserve: "워크인",
  brands: ["PORTER"], priceBand: "1.5만~3만엔", japanOnly: true, whyCheaper: "한국 미전개",
};

test("쇼핑 브랜드 필드가 정상이면 통과한다 (빈 whyCheaper 허용)", () => {
  expect(validateCards([SHOP]).ok).toBe(true);
  expect(validateCards([{ ...SHOP, whyCheaper: "" }]).ok).toBe(true);
});

test("brands는 비지 않은 문자열 배열, japanOnly는 boolean이어야 한다", () => {
  expect(validateCards([{ ...SHOP, brands: [] }]).errors.join()).toContain("brands");
  expect(validateCards([{ ...SHOP, brands: "PORTER" }]).errors.join()).toContain("brands");
  expect(validateCards([{ ...SHOP, japanOnly: "yes" }]).errors.join()).toContain("japanOnly");
});

test("brands·priceBand·japanOnly는 함께 있어야 하고, 쇼핑 외 카드에 있으면 실패한다", () => {
  const { japanOnly, ...partial } = SHOP;
  expect(validateCards([partial]).errors.join()).toContain("japanOnly");
  const r = validateCards([{ ...VALID, brands: ["X"], priceBand: "1만엔", japanOnly: false }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("쇼핑 카드");
});

test("taxonomy areas에 horie가 있다", () => {
  expect(taxonomy.areas.horie).toBeDefined();
});

// ---- 현지 인기 지표 (tabelogReviews / hyakumeiten) + 거리 (distM / walkMin) ----

test("tabelogReviews·hyakumeiten이 정상이면 통과한다", () => {
  const r = validateCards([{ ...VALID, tabelogRating: 3.71, tabelogReviews: 2793, hyakumeiten: "okonomiyaki 2018~2025" }]);
  expect(r.ok).toBe(true);
});

test("tabelogReviews는 양의 정수여야 한다", () => {
  const r = validateCards([{ ...VALID, tabelogRating: 3.5, tabelogReviews: 0 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("tabelogReviews");
});

test("tabelogReviews만 있고 tabelogRating이 없으면 실패한다", () => {
  const r = validateCards([{ ...VALID, tabelogReviews: 300 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("tabelogRating");
});

test("tabelogReviews·hyakumeiten은 음식·술 카드 전용이다", () => {
  const shop = { ...VALID, id: "s-98", cat: "shop-fashion", hyakumeiten: "x 2025" };
  expect(validateCards([shop]).errors.join()).toContain("음식·술");
});

test("distM·walkMin이 서로 맞으면 통과하고, 어긋나면 실패한다", () => {
  expect(validateCards([{ ...VALID, distM: 500, walkMin: 9 }]).ok).toBe(true);
  const r = validateCards([{ ...VALID, distM: 500, walkMin: 3 }]);
  expect(r.ok).toBe(false);
  expect(r.errors.join()).toContain("walkMin");
});

test("distM은 양수여야 하고 walkMin과 함께 있어야 한다", () => {
  expect(validateCards([{ ...VALID, distM: -5, walkMin: 1 }]).errors.join()).toContain("distM");
  expect(validateCards([{ ...VALID, distM: 500 }]).errors.join()).toContain("walkMin");
});
