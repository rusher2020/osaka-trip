import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const taxonomy = JSON.parse(readFileSync("data/taxonomy.json", "utf-8"));

const GROUPS = [
  { prefix: "food", title: "음식" },
  { prefix: "drink", title: "술" },
  { prefix: "shopping", title: "쇼핑" },
  { prefix: "stay", title: "11/8 숙소 후보" },
];

// data/cards-*.json 전부를 정렬된 목록으로 모은다. cards-food.json과
// cards-food-away.json처럼 카테고리 하나가 여러 파일로 나뉘어 있어도
// "cards-<prefix>"로 시작하는 파일을 접두어 매칭으로 전부 모으므로
// 하드코딩된 파일명 목록에 기대지 않는다 — 파일이 몇 개로 쪼개지든 안전하다.
const allCardFiles = existsSync("data")
  ? readdirSync("data")
      .filter((f) => f.startsWith("cards-") && f.endsWith(".json"))
      .sort()
  : [];

for (const g of GROUPS) {
  const files = allCardFiles.filter((f) => f.startsWith(`cards-${g.prefix}`));
  if (files.length === 0) continue;

  const cards = files.flatMap((f) =>
    JSON.parse(readFileSync(`data/${f}`, "utf-8")),
  );

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
  if (files.length > 1) {
    lines.push(`원본 파일: ${files.map((f) => `\`data/${f}\``).join(", ")}`, "");
  }

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
        `| ${c.id} | **${c.name}** (${c.nameJa}) | ${area} | ${c.budget} | ${c.hours} | ${c.closed ?? "-"} | ${c.reserve} | ${seat} | ${c.walkFrom} | ${c.why} |`,
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

  const out = `docs/research/cards-${g.prefix}.md`;
  writeFileSync(out, lines.join("\n"), "utf-8");
  console.log(`생성: ${out} (${cards.length}장)`);
}
