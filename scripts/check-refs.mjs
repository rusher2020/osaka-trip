import { readFileSync } from "node:fs";
import { discoverCardFiles } from "./validate-cards.mjs";

// data/cards-*.json 전부를 모은다 (하드코딩된 4파일 목록이 아니라 글롭 검색).
// cards-food.json / cards-food-away.json처럼 카테고리 하나가 여러 파일로
// 쪼개져 있어도 discoverCardFiles가 패턴으로 전부 찾아낸다.
const ids = new Set();
for (const f of discoverCardFiles()) {
  for (const c of JSON.parse(readFileSync(f, "utf-8"))) {
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

// transit.json이 참조하는 지역도 taxonomy에 있어야 한다. airport 구간은
// "namba"/"kix"처럼 area가 아닌 공항 접근 지점 키를 쓰므로 "home"과 함께
// 알려진 비-area 키로 허용한다.
const NON_AREA_KEYS = new Set(["home", "namba", "kix"]);
const transit = JSON.parse(readFileSync("data/transit.json", "utf-8"));
for (const leg of [...transit.walk, ...transit.subway, ...transit.airport]) {
  for (const key of [leg.from, leg.to]) {
    if (!NON_AREA_KEYS.has(key) && !(key in tax.areas)) {
      console.error(`✗ transit: 없는 area — ${key}`);
      bad++;
    }
  }
}

console.log(bad === 0 ? "참조 무결성 OK" : `실패 ${bad}건`);
process.exit(bad === 0 ? 0 : 1);
