// 일회성 수입 스크립트: 타베로그 百名店 조사 결과(/tmp/osaka_local_candidates.json)와
// 번지 지오코딩 결과(/tmp/cand_geo.json)를 카드로 변환한다.
// why·caution·seat4·cat은 기계가 못 정하므로 아래 DECISIONS에 손으로 적는다.
// 실행 후에는 data/*.json이 진실 소스이고 이 스크립트는 기록용으로만 남는다.
import { readFileSync, writeFileSync } from "node:fs";

const cand = Object.fromEntries(
  JSON.parse(readFileSync("/tmp/osaka_local_candidates.json", "utf-8")).map((x) => [x.nameJa, x]),
);
const geo = JSON.parse(readFileSync("/tmp/cand_geo.json", "utf-8"));

// reserve는 taxonomy가 허용하는 4개 값만 쓴다.
const RESERVE = {
  "Reservations unavailable": "불가·웨이팅",
  None: "워크인",
  null: "워크인",
};
const reserveOf = (s) => (!s ? "워크인" : RESERVE[s] ?? "예약권장");

// "JPY 1,000 - JPY 1,999" -> "1,000~1,999엔"
const budgetOf = (s) => {
  const m = String(s ?? "").match(/JPY\s*([\d,]+)\s*-\s*JPY\s*([\d,]+)/);
  return m ? `${m[1]}~${m[2]}엔` : "가격대 미확인";
};

// 영업시간은 타베로그 영어 표기를 그대로 옮기되 한국어 요일로 줄인다.
const DOW = { Mon: "월", Tue: "화", Wed: "수", Thu: "목", Fri: "금", Sat: "토", Sun: "일" };
const trDow = (s) =>
  String(s ?? "")
    .replace(/Public Holiday/g, "공휴일")
    .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (m) => DOW[m])
    .replace(/\s*(AM|PM)/g, "")
    .replace(/:00\b/g, ":00")
    .trim();
const hoursOf = (s) => {
  const t = trDow(s);
  return t && t !== "None" ? t : "⚠ 미검증 — 영업시간 미확인";
};
const closedOf = (s) => {
  const t = trDew(s);
  return t && t !== "None" ? t : "부정기 또는 미확인";
};
function trDew(s) {
  return trDow(s);
}

// 百名店 문자열("ramen_osaka 2023~2025; ramen_west 2017~2022")에서 가장 최근 수상의
// 장르·연도를 뽑아 수상 페이지 URL을 만든다. 출처로 쓸 수 있는 특정 페이지다.
const awardUrl = (hy) => {
  if (!hy) return null;
  const parts = [...hy.matchAll(/([a-z_]+)\s(\d{4})(?:~(\d{4}))?/g)];
  if (!parts.length) return null;
  let best = null;
  for (const p of parts) {
    const yr = Number(p[3] ?? p[2]);
    if (!best || yr > best.yr) best = { genre: p[1], yr };
  }
  return `https://award.tabelog.com/hyakumeiten/${best.genre}/${best.yr}`;
};

// id는 아래 순서대로 f-45.., d-29.. 로 붙는다.
const DECISIONS = [
  // ---- 음식 ----
  { n: "三国亭", id: "f-45", cat: "food-chinese", area: "shinsaibashi", seat4: true,
    name: "미쿠니테이",
    why: "숙소에서 걸어 4분. 타베로그 3.73에 중화 西日本 百名店을 2021년부터 6년 연속 받았다. 카운터 14석에 4인 테이블이 하나뿐이라 그 자리를 잡으면 가장 가까운 현지 명점이 된다.",
    caution: "수요일 휴무. 4인 테이블이 1개뿐이라 예약 없이는 넷이 붙어 앉기 어렵다 — 예약 가능하니 미리 잡을 것." },
  { n: "手打ちそば 星", id: "f-46", cat: "food-teishoku", area: "dotonbori", seat4: true,
    name: "테우치소바 호시",
    why: "도톤보리 입구에서 숙소 쪽으로 꺾자마자. 타베로그 3.55, 소바 西日本 百名店 2024. 손으로 뽑는 소바에 텐푸라와 사케를 붙일 수 있어 1차로도 쓰고 해장으로도 쓴다.",
    caution: "15석(카운터 3·테이블 12) 소규모이고 예약을 안 받는다. 피크엔 대기." },
  { n: "麺のようじ", id: "f-47", cat: "food-ramen", area: "nipponbashi", seat4: false,
    name: "멘노요지",
    why: "타베로그 3.70, 라멘 OSAKA 百名店 2023~2025 3년 연속에 라멘 西日本 百名店도 2017~2022까지 받았다. 숙소 도보 8분으로 백명점 라멘 중 가장 가깝다.",
    caution: "8석(카운터 4·테이블 4)뿐이라 4인이 한 번에 붙어 앉기 어렵다. 테이블 4석이 한 탁인지 확인되지 않았다. 예약 불가." },
  { n: "グリルばらの木", id: "f-48", cat: "food-yoshoku", area: "shinsaibashi", seat4: false,
    name: "그릴 바라노키",
    why: "숙소에서 도보 9분. 타베로그 3.69, 양식 百名店 2020~2023에 西日本판 2025까지 받은 노포 그릴. 스테이크·함바그를 3천엔대에 낸다.",
    caution: "월요일 휴무. 저녁엔 8석만 운영하는 초소규모라 4인 동반은 예약이 사실상 필수다. ⚠ 미검증 — 4인 인접 좌석이 있는지는 좌석 표기(점심 10석/저녁 8석)만으로 확인되지 않았다." },
  { n: "純喫茶 アメリカン", id: "f-49", cat: "food-kissa", area: "dotonbori", seat4: true,
    name: "준킷사 아메리칸",
    why: "1946년 도톤보리 킷사텐. 타베로그 3.64에 킷사텐 百名店 2021~2026 6년 연속. 245석 대형이라 늦게 일어난 넷이 자리 걱정 없이 아침 겸 해장을 때릴 수 있다.",
    caution: "예약을 받지 않지만 좌석이 많아 대기는 길지 않은 편이다. 핫케이크·샌드위치 중심이라 식사로는 가볍다." },
  { n: "道頓堀 今井 本店", id: "f-50", cat: "food-teishoku", area: "dotonbori", seat4: true,
    name: "도톤보리 이마이 본점",
    why: "도톤보리 키츠네우동의 기준점. 타베로그 3.58(2,403건)에 우동 百名店 2017~2019·西日本 2020. 구글 4.3(2,660건)인데 타베로그 리뷰가 2,403건이라 손님 비율 1.1배 — 관광지 중심인데도 현지 비중이 유지된다.",
    caution: "수요일 휴무. 138석 대형이고 예약도 되지만 우동스키 같은 전골 코스는 전날까지 예약해야 한다." },
  { n: "明治軒", id: "f-51", cat: "food-yoshoku", area: "shinsaibashi", seat4: true,
    name: "메이지켄",
    why: "숙소 도보 10분. 1925년 창업 오므라이스 노포로 타베로그 3.49(1,720건), 양식 百名店 2020~2022·西日本 2025. 오므라이스에 쿠시카츠를 붙이는 조합이 간판이고 1천엔대다.",
    caution: "수요일 휴무. 예약 불가. 110석이라 회전은 빠르지만 점심 피크엔 줄이 생긴다." },
  { n: "お好み焼だん", id: "f-52", cat: "food-konamon", area: "shinsaibashi", seat4: true,
    name: "오코노미야키 단",
    why: "신사이바시스지 빌딩 3층. 타베로그 3.47에 오코노미야키 百名店 2025 선정. 기존 오코노미야키 카드 중 백명점이면서 예약까지 되는 유일한 곳이고 숙소에서 10분이다.",
    caution: "일요일 휴무. 23석 규모이고 3층이라 간판을 찾기 어렵다. 예약 가능하니 4인은 미리 잡는 편이 안전하다." },
  { n: "法善寺横丁 やき然", id: "f-53", cat: "food-konamon", area: "dotonbori", seat4: true,
    name: "호젠지요코초 야키젠",
    why: "호젠지 요코초 골목의 철판집. 타베로그 3.49에 오코노미야키 百名店 2018~2024 7년 연속. 4인 테이블이 3개라 넷이 붙어 앉기 좋고 테이블마다 환기가 돼 연기가 덜하다.",
    caution: "⚠ 미검증 — 정기 휴무와 예약 가능 여부가 타베로그에 비어 있어 확인하지 못했다. 방문 전 전화 확인 권장." },
  { n: "辛激屋", id: "f-54", cat: "food-curry", area: "shinsaibashi", seat4: false,
    name: "신게키야",
    why: "오사카 스파이스카레의 대표격. 타베로그 3.69에 카레 西日本 百名店을 2019~2026 8년 연속 받았다. 숙소 도보 11분, 1천엔대.",
    caution: "일요일·공휴일 휴무라 11/8(일)엔 못 간다. 카운터 11석 전용이라 4인이 붙어 앉지 못한다. 예약 불가." },
  { n: "中華そばふじい なんば店", id: "f-55", cat: "food-ramen", area: "uranamba", seat4: false,
    name: "추카소바 후지이 난바점",
    why: "타베로그 3.59(1,542건)로 백명점은 아니지만 점수·표본이 모두 두텁다. 숙소 도보 11분에 1천엔대 중화소바와 교자를 낸다.",
    caution: "화요일 휴무. 22석이지만 좌석 구성이 공개되지 않아 4인 인접 착석을 확인하지 못했다 — 보수적으로 불가로 뒀다. 예약 불가." },
  { n: "アラビヤコーヒー", id: "f-56", cat: "food-kissa", area: "uranamba", seat4: true,
    name: "아라비야 커피",
    why: "1951년 난바 킷사텐. 타베로그 3.67에 킷사텐 百名店 2021~2026 6년 연속. 50석 중 43석이 테이블이고 예약도 돼 늦은 아침 집결지로 쓸 수 있다.",
    caution: "샌드위치·커피 중심이라 끼니로는 가볍다. 아침 코스로 넣고 점심은 따로 잡는 게 낫다." },
  { n: "重亭", id: "f-57", cat: "food-yoshoku", area: "uranamba", seat4: true,
    name: "주테이",
    why: "1946년 난바 양식 노포. 타베로그 3.69(1,553건), 양식 百名店 2020~2022·西日本 2025. 함바그와 오므라이스가 1천엔대이고 8인 테이블이 2개라 4인은 자리 문제가 없다.",
    caution: "수요일 휴무. 예약을 받지 않아 점심 피크엔 대기가 생긴다." },
  { n: "大黒", id: "f-58", cat: "food-teishoku", area: "dotonbori", seat4: false,
    name: "다이코쿠",
    why: "1902년 창업한 오사카 가정식 쇼쿠도. 타베로그 3.58에 쇼쿠도 百名店 2024~2026과 정식 百名店 2021. 도톤보리 안쪽에 있는데도 관광객 동선에서 비껴 있다.",
    caution: "월·일·공휴일 휴무라 11/8(일)·11/9(월)엔 못 간다. 14석 소규모이고 예약 불가, 좌석 구성이 공개되지 않아 4인 인접 착석은 확인하지 못했다." },
  { n: "空 道頓堀店", id: "f-59", cat: "food-yakiniku", area: "dotonbori", seat4: true,
    name: "쿠우 도톤보리점",
    why: "타베로그 3.54에 야키니쿠 西日本 百名店 2020~2021. 도톤보리권에서 백명점 야키니쿠는 드물고, 예약이 되는 데다 호르몬까지 다룬다.",
    caution: "예산이 4,000~4,999엔으로 1인 4천엔 상한을 넘긴다 — 주문을 조절할 것. 화·목·토 휴무라 11/6(금)·11/7(토) 중 토요일은 못 간다. 좌석 구성 미공개." },
  { n: "なにわ 麺次郎", id: "f-60", cat: "food-ramen", area: "uranamba", seat4: false,
    name: "나니와 멘지로",
    why: "타베로그 3.71(2,214건), 라멘 OSAKA 百名店 2023~2025. 긴테쓰 오사카난바역 개찰구 안에 있어 원정 다녀오며 들르기 좋다.",
    caution: "역 개찰구 안쪽이라 승차권 없이는 들어갈 수 없다. 카운터 12석 전용이라 4인 인접 착석 불가, 예약 불가." },
  { n: "千とせ 本店", id: "f-61", cat: "food-teishoku", area: "uranamba", seat4: true,
    name: "치토세 본점",
    why: "니쿠스이(고기 넣은 우동 국물)의 발상지. 타베로그 3.72(2,309건)에 우동 西日本 百名店 2022~2024. 4인 테이블이 2개, 6인 테이블이 1개라 넷이 앉기 좋고 1천엔대다.",
    caution: "화요일 휴무. 예약 불가이고 혼잡 시 합석을 받는다. 니쿠스이는 재료가 떨어지면 조기 마감한다는 서술이 흔하니 이른 시간을 노릴 것(⚠ 미검증 — 조기 마감은 출처 확인 못 함)." },
  { n: "麺屋 丈六 なんば店", id: "f-62", cat: "food-ramen", area: "uranamba", seat4: false,
    name: "멘야 조로쿠 난바점",
    why: "이번 조사에서 미나미권 최고점. 타베로그 3.73(2,749건)에 라멘 百名店을 2017년부터 9년 연속(西日本 2017~2022 → OSAKA 2023~2025) 받았다. 조개·간장 중화소바, 1천엔대.",
    caution: "수요일 휴무. 카운터 7석뿐이라 4인은 나눠 앉아야 하고 예약도 안 된다. 대기를 감수할 것." },
  { n: "クリッターズバーガー", id: "f-63", cat: "food-yoshoku", area: "shinsaibashi", seat4: true,
    name: "크리터스 버거",
    why: "타베로그 3.67에 햄버거 百名店 2017~2026 10년 연속. 25석에 야간 예약이 되고 다이닝바를 겸해 술도 붙인다. 2천엔대.",
    caution: "예약은 저녁에만, 그리고 18시 이후 시간대만 받는다. 아메무라 쪽이라 숙소에서 16분." },
  { n: "うさみ亭マツバヤ", id: "f-64", cat: "food-teishoku", area: "shinsaibashi", seat4: true,
    name: "우사미테이 마츠바야",
    why: "키츠네우동의 발상지로 1893년 창업. 타베로그 3.66(901건)에 우동 西日本 百名店 2024. 50석이라 4인도 편하고 1천엔대다.",
    caution: "일요일·공휴일 휴무라 11/8(일)엔 못 간다. 예약 불가." },
  { n: "一芳亭 本店", id: "f-65", cat: "food-chinese", area: "uranamba", seat4: true,
    name: "이치호테이 본점",
    why: "달걀 피로 싸는 오사카식 슈마이의 원조. 타베로그 3.67(2,537건), 중화 西日本 百名店 2021~2026 6년 연속. 48석에 1천엔대.",
    caution: "일요일·공휴일 휴무라 11/8(일)엔 못 간다. 예약 불가. 숙소에서 18분." },
  { n: "麺匠至誠", id: "f-66", cat: "food-ramen", area: "horie", seat4: true,
    name: "멘쇼 시세이",
    why: "타베로그 3.67(1,053건), 라멘 OSAKA 百名店 2023~2025. 4인 테이블이 2개라 라멘집 중 드물게 넷이 붙어 앉을 수 있다.",
    caution: "일요일·공휴일 휴무라 11/8(일)엔 못 간다. 요츠바시 빌딩 지하라 입구를 찾기 어렵다. 숙소에서 20분." },
  { n: "いかれたヌードル フィッシュトンズ", id: "f-67", cat: "food-ramen", area: "horie", seat4: false,
    name: "이카레타 누들 피시톤즈",
    why: "타베로그 3.72(2,220건)에 라멘 百名店 2019~2025(西日本→OSAKA). 생선 육수 츠케멘이 간판이고 1천엔대.",
    caution: "⚠ 미검증 — 정기 휴무와 예약 가능 여부가 타베로그에 비어 있다. 14석(카운터 10·2인 테이블 2)이라 4인 인접 착석 불가. 신마치로 숙소에서 23분이라 이번 일정에서는 후순위." },
  // ---- 술 ----
  { n: "葉花", id: "d-29", cat: "drink-tachinomi", area: "uranamba", seat4: true,
    name: "하바나",
    why: "타베로그 3.66(764건)에 타치노미 百名店 2025. 1층은 서서 마시는 18석, 2층은 앉는 20석이라 넷이 2층으로 올라가면 자리가 된다. 숙소 도보 12분.",
    caution: "예산이 4,000~4,999엔으로 1인 4천엔 상한을 넘긴다. ⚠ 미검증 — 정기 휴무와 예약 가능 여부가 타베로그에 비어 있다." },
  { n: "ダテダチ", id: "d-30", cat: "drink-tachinomi", area: "nipponbashi", seat4: false,
    name: "다테다치",
    why: "타베로그 3.62(711건)에 타치노미 百名店 2025. 야키토리를 내는 서서 마시는 집으로 센니치마에에 있어 숙소에서 11분, 3천엔대.",
    caution: "서서 마시는 집이라 4인이 앉을 자리가 없다. 예약 불가." },
  { n: "ああああ", id: "d-31", cat: "drink-tachinomi", area: "uranamba", seat4: false,
    name: "아아아아",
    why: "타베로그 3.63(552건)에 타치노미 百名店 2025. 우라난바 빌딩 3층의 서서 마시는 집으로 2천엔대라 2차로 쓰기 좋다.",
    caution: "서서 마시는 집이고 좌석 수가 공개되지 않았다. 예약 불가. 3층이라 입구를 찾기 어렵다." },
  { n: "丑寅", id: "d-32", cat: "drink-tachinomi", area: "uranamba", seat4: false,
    name: "우시토라",
    why: "타베로그 3.60(714건)에 타치노미 百名店 2025. d-31과 같은 빌딩(난바센니치마에 15-19)이라 한 건물에서 2차·3차를 이어 붙일 수 있다. 2천엔대.",
    caution: "28석 전부 서서 마시는 자리라 4인이 앉지 못한다. 예약 불가." },
];

const files = { food: "data/cards-food.json", drink: "data/cards-drink.json" };
const loaded = Object.fromEntries(
  Object.entries(files).map(([k, p]) => [k, JSON.parse(readFileSync(p, "utf-8"))]),
);

const added = [];
for (const d of DECISIONS) {
  const src = cand[d.n];
  const g = geo[d.n];
  if (!src) throw new Error(`후보 데이터 없음: ${d.n}`);
  if (!g) throw new Error(`좌표 없음: ${d.n}`);
  const walkMin = Math.ceil((g.distM * 1.3) / 75);
  const sources = [src.tabelogUrl];
  const au = awardUrl(src.hyakumeiten);
  if (au) sources.push(au);
  const card = {
    id: d.id,
    name: d.name,
    nameJa: d.n,
    cat: d.cat,
    area: d.area,
    lat: g.lat,
    lng: g.lng,
    budget: budgetOf(src.budgetDinner),
    hours: hoursOf(src.hours),
    closed: closedOf(src.closed),
    reserve: reserveOf(src.reservation),
    seat4: d.seat4,
    tabelogRating: src.tabelogRating,
    ...(src.tabelogReviews ? { tabelogReviews: src.tabelogReviews } : {}),
    ...(src.hyakumeiten ? { hyakumeiten: src.hyakumeiten } : {}),
    why: d.why,
    caution: d.caution,
    walkFrom: `숙소 도보 ${walkMin}분`,
    distM: g.distM,
    walkMin,
    checked: "2026-09",
    sources,
  };
  const group = d.id.startsWith("d-") ? "drink" : "food";
  loaded[group].push(card);
  added.push(`${d.id} ${d.name} — 타베로그 ${src.tabelogRating} · 도보 ${walkMin}분`);
}

for (const [k, p] of Object.entries(files)) {
  writeFileSync(p, JSON.stringify(loaded[k], null, 2) + "\n", "utf-8");
}
console.log(added.join("\n"));
console.log(`\n추가 ${added.length}장`);
