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

// up: 하위 폴더(girok/, sosik/)의 쪽은 주소를 한 단계 올려야 한다
export function footerNav(up = "") {
  const cols = groups().map(g =>
    `      <div class="fcol">\n        <p class="ft">${esc(g.t)}</p>\n` +
    g.items.map(([h, n]) => `        <a href="${up}${h}">${esc(n)}</a>`).join("\n") +
    `\n      </div>`).join("\n");
  return `<nav class="fnav" aria-label="전체 메뉴">\n${cols}\n    </nav>`;
}

// 뒤져야 할 쪽들: 뿌리와 글 폴더
export function allPages() {
  const out = readdirSync(".").filter((f) => f.endsWith(".html")).map((f) => ({ f, up: "" }));
  for (const d of ["girok", "sosik"]) {
    let fs2 = [];
    try { fs2 = readdirSync(d); } catch (e) { continue; }
    for (const f of fs2.filter((f) => f.endsWith(".html"))) out.push({ f: `${d}/${f}`, up: "../" });
  }
  return out;
}

const RE = /<nav class="fnav"[\s\S]*?<\/nav>/;

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes("--write");
  let same = 0, fixed = [], missing = [];
  for (const { f, up } of allPages()) {
    const want = footerNav(up);
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
