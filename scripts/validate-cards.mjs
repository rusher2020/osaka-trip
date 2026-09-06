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

export function validateCards(cards, taxonomy = null) {
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
