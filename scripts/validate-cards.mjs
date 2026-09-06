import { readFileSync, existsSync, readdirSync } from "node:fs";

const REQUIRED = [
  "id", "name", "nameJa", "cat", "area", "lat", "lng",
  "budget", "hours", "reserve", "seat4", "why",
  "walkFrom", "checked", "sources",
];

const RESERVE_VALUES = ["예약필요", "예약권장", "워크인", "불가·웨이팅"];

const OSAKA_BOUNDS = { latMin: 34.60, latMax: 34.78, lngMin: 135.40, lngMax: 135.60 };

// 허용목록 방식: 타베로그/구글맵(장소 페이지)/공식 채널 등 이 목록에 있는 호스트가
// 최소 1개 있어야 한다 (블랙리스트 우회 방지, 한국 블로그·커뮤니티 단독 근거 금지).
// booking.com 같은 예약 대행 사이트는 실제로 방문/확인했다는 근거가 되지 않으므로
// 허용목록에 넣지 않는다.
const PRIMARY_HOSTS = [
  "tabelog.com",
  "maps.app.goo.gl",
  "goo.gl/maps",
  "instagram.com",
  "gurunavi.com",
  "hotpepper.jp",
  "retty.me",
];

// google.com/maps는 특정 장소를 가리킬 때만 1차 출처로 인정한다.
// "/maps/search/?...&query=이름"처럼 이름만으로 누구나 만들 수 있는 검색 URL은
// 실제로 장소를 열어봤다는 증거가 되지 않으므로 제외한다.
const isGoogleMapsPlace = (url) => {
  if (!url.includes("google.com/maps")) return false;
  if (!url.includes("/maps/place/")) return false;
  if (url.includes("query=") || /[?&]q=/.test(url)) return false;
  return true;
};

const isPrimary = (url) =>
  PRIMARY_HOSTS.some((h) => url.includes(h)) || isGoogleMapsPlace(url);

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
      const hasPrimary = c.sources.some((u) => isPrimary(u));
      if (!hasPrimary) {
        errors.push(`${label}: 1차 출처 없음 — 타베로그/구글맵 등 허용목록 호스트 최소 1개 필요 (한국 블로그 단독 근거 금지)`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
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
  const { ok, errors } = validateCards(all, taxonomy);
  console.log(`\n검사한 카드: ${all.length}장`);
  if (!ok) {
    for (const e of errors) console.error("  ✗ " + e);
    console.error(`\n실패 ${errors.length}건`);
    process.exit(1);
  }
  console.log("전부 통과");
}
