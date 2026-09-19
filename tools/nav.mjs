// 바닥글의 전체 메뉴를 assets/js/gm-menu.js 의 GROUPS 하나에서 다시 써 넣는다.
// 쪽마다 손으로 복사해 두면 언젠가 어긋난다. 고칠 곳은 GROUPS 한 군데뿐이다.
//   node tools/nav.mjs         — 어긋난 쪽이 있으면 알려만 준다
//   node tools/nav.mjs --write — 다시 써 넣는다
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

export function groups() {
  const src = readFileSync(new URL("../assets/js/gm-menu.js", import.meta.url), "utf8");
  const a = src.indexOf("var GROUPS = [");
  const b = src.indexOf("\n  ];", a);
  if (a < 0 || b < 0) throw new Error("gm-menu.js 에서 GROUPS 를 찾지 못했습니다");
  return new Function(src.slice(a, b + 5) + "\nreturn GROUPS;")();
}

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function footerNav() {
  const cols = groups().map(g =>
    `      <div class="fcol">\n        <p class="ft">${esc(g.t)}</p>\n` +
    g.items.map(([h, n]) => `        <a href="${h}">${esc(n)}</a>`).join("\n") +
    `\n      </div>`).join("\n");
  return `<nav class="fnav" aria-label="전체 메뉴">\n${cols}\n    </nav>`;
}

const RE = /<nav class="fnav"[\s\S]*?<\/nav>/;

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes("--write");
  const want = footerNav();
  let same = 0, fixed = [], missing = [];
  for (const f of readdirSync(".").filter(f => f.endsWith(".html"))) {
    const s = readFileSync(f, "utf8");
    if (!RE.test(s)) { missing.push(f); continue; }
    if (s.match(RE)[0] === want) { same++; continue; }
    if (write) { writeFileSync(f, s.replace(RE, want)); fixed.push(f); }
    else fixed.push(f);
  }
  console.log(`같음 ${same}쪽` + (fixed.length ? ` · ${write ? "고침" : "어긋남"} ${fixed.length}쪽: ${fixed.join(" ")}` : "") +
    (missing.length ? ` · 바닥 메뉴 없음: ${missing.join(" ")}` : ""));
  if (!write && fixed.length) process.exitCode = 1;
}
