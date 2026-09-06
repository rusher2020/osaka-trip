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
