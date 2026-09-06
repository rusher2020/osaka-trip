import { readFileSync, existsSync } from "node:fs";
import { discoverCardFiles } from "./validate-cards.mjs";

const MISMATCH_THRESHOLD_M = 300;
const REQUEST_INTERVAL_MS = 1100; // Nominatim usage policy: 최대 1 req/sec, 여유를 두고 1.1초
const USER_AGENT =
  "osaka-trip-plan-check-coords/1.0 (personal, non-commercial trip-planning project)";

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 오사카 바운딩박스로 검색을 제한한다 (viewbox=left,top,right,bottom, bounded=1).
// 이게 없으면 "텐구"·"텐마사" 같은 흔한 이름이 흑해 연안이나 아이치현의
// 동명 장소로 잘못 매칭되어 가짜 MISMATCH를 만든다. bounded=1이면 범위 밖에는
// 결과가 없다는 뜻이므로 그대로 UNVERIFIED로 분류된다 (실패 아님).
const VIEWBOX = "135.40,34.78,135.60,34.60";

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&viewbox=${VIEWBOX}&bounded=1`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Nominatim 요청 실패: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (!Array.isArray(body) || body.length === 0) return null;
  return { lat: parseFloat(body[0].lat), lng: parseFloat(body[0].lon) };
}

function loadCards(files) {
  const all = [];
  for (const f of files) {
    if (!existsSync(f)) {
      console.error(`파일을 찾을 수 없음: ${f}`);
      continue;
    }
    const parsed = JSON.parse(readFileSync(f, "utf-8"));
    console.log(`${f}: ${parsed.length}장`);
    all.push(...parsed);
  }
  return all;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}

async function main() {
  const argFile = process.argv[2];
  let files;
  if (argFile) {
    if (!existsSync(argFile)) {
      console.error(`파일을 찾을 수 없음: ${argFile}`);
      process.exit(1);
    }
    files = [argFile];
  } else {
    files = discoverCardFiles();
  }

  const cards = loadCards(files);
  console.log(
    `\n검사 대상: ${cards.length}장 (Nominatim 1req/sec 제한, 카드당 ${REQUEST_INTERVAL_MS}ms 대기 — 예상 소요 약 ${Math.ceil((cards.length * REQUEST_INTERVAL_MS) / 1000)}초)\n`,
  );

  const rows = [];
  let mismatch = 0;
  let unverified = 0;
  let ok = 0;

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const query = c.nameJa || c.name;
    let status;
    let detail;

    try {
      const geo = await geocode(query);
      if (!geo) {
        status = "UNVERIFIED";
        detail = "Nominatim 결과 없음";
        unverified++;
      } else {
        const dist = haversineMeters(c.lat, c.lng, geo.lat, geo.lng);
        if (dist > MISMATCH_THRESHOLD_M) {
          status = "MISMATCH";
          detail = `${Math.round(dist)}m 차이 (OSM: ${geo.lat},${geo.lng})`;
          mismatch++;
        } else {
          status = "OK";
          detail = `${Math.round(dist)}m`;
          ok++;
        }
      }
    } catch (err) {
      status = "UNVERIFIED";
      detail = `오류: ${err.message}`;
      unverified++;
    }

    rows.push({ id: c.id ?? "id없음", name: c.name ?? query ?? "", status, detail });

    if (i < cards.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  console.log(pad("id", 8) + pad("name", 22) + pad("status", 12) + "detail");
  console.log("-".repeat(80));
  for (const r of rows) {
    console.log(pad(r.id, 8) + pad(r.name, 22) + pad(r.status, 12) + r.detail);
  }

  console.log("\n요약:");
  console.log(`  OK: ${ok}`);
  console.log(`  MISMATCH: ${mismatch}`);
  console.log(`  UNVERIFIED: ${unverified}`);

  if (mismatch > 0) {
    console.error(`\n좌표 불일치(300m 초과) ${mismatch}건 발견`);
    process.exit(1);
  }
}

main();
