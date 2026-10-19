import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { discoverCardFiles } from "./validate-cards.mjs";

// data/*.json + page/template.html -> index.html (GitHub Pages용 단일 파일).
// 데이터의 단일 진실 소스는 data/*.json이므로 index.html은 생성물이다.
const taxonomy = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));
const itinerary = JSON.parse(readFileSync("data/itinerary.json", "utf-8"));
const transit = JSON.parse(readFileSync("data/transit.json", "utf-8"));
const photos = existsSync("data/photos.json")
  ? JSON.parse(readFileSync("data/photos.json", "utf-8"))
  : {};
const flight = JSON.parse(readFileSync("data/flight.json", "utf-8"));

// cards-food.json / cards-food-away.json처럼 한 분류가 여러 파일로 쪼개져 있어도
// "cards-<group>" 접두어로 합친다.
const cards = {};
for (const f of discoverCardFiles()) {
  const group = f.replace(/^data\/cards-/, "").replace(/\.json$/, "").split("-")[0];
  (cards[group] ??= []).push(...JSON.parse(readFileSync(f, "utf-8")));
}

const payload = JSON.stringify({ taxonomy, cards, photos, itinerary, transit, flight })
  .replace(/<\//g, "<\\/");
const tpl = readFileSync("page/template.html", "utf-8");
if (!tpl.includes("__DATA__")) throw new Error("page/template.html에 __DATA__ 자리표시자가 없다");
writeFileSync("index.html", tpl.replace("__DATA__", payload), "utf-8");

const total = Object.values(cards).flat().length;
const kb = (Buffer.byteLength(payload) / 1024).toFixed(0);
console.log(`생성: index.html (카드 ${total}장, 데이터 ${kb}KB)`);
