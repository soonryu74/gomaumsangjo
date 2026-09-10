/* 고마움 상조 — 내용 점검
 *
 * node tools/check.mjs
 *
 * 사람이 세어서 적은 숫자와 실제 목록이 어긋나는 일을 막는다.
 * 링크가 없는 파일을 가리키는 것도 잡는다.
 * 운영 정보(개설 여부, 지역, 금액)는 여기서 판단하지 않는다. 그것은 운영자가 정한다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const bad = (m) => { fail++; console.log("  FAIL " + m); };

const KO = ["영", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
  "열한", "열두", "열세", "열네", "열다섯"];

console.log("\n[1] 목록 개수와 본문 표기가 맞는가");

// 대표의 약속: yaksok.html의 <ol class="yk-values"> 항목 수가 원본이다.
const vowHtml = read("yaksok.html");
const vowBlock = vowHtml.match(/<ol class="yk-values">([\s\S]*?)<\/ol>/);
const vowCount = vowBlock ? (vowBlock[1].match(/<li>/g) || []).length : 0;
if (!vowCount) bad("yaksok.html에서 약속 목록을 찾지 못했습니다");
else {
  const want = KO[vowCount] + " 가지";
  const wantTight = KO[vowCount] + "가지";
  const wrong = [];
  for (const f of pages) {
    const s = read(f);
    const NUM = KO.filter(Boolean).join("|");
    const reVow = new RegExp(`(?:지키는 것|약속)\\s?(${NUM})\\s?가지|(${NUM})\\s?가지\\s?약속`, "g");
    for (const m of s.matchAll(reVow)) {
      const word = (m[1] || m[2] || "").trim();
      if (word && word !== KO[vowCount]) wrong.push(`${f}: "${m[0]}"`);
    }
  }
  if (wrong.length) bad(`약속은 실제 ${vowCount}개(${want}). 어긋난 표기: ` + wrong.join(", "));
  else ok(`약속 ${vowCount}개 — 모든 페이지 표기 일치 (${wantTight})`);
}

// 자주 묻는 질문: faq.html의 <summary> 수가 원본이다.
const faqHtml = read("faq.html");
const faqCount = (faqHtml.match(/<summary/g) || []).length;
const jsonQ = (faqHtml.match(/"@type":\s*"Question"/g) || []).length;
if (!faqCount) bad("faq.html에서 질문을 찾지 못했습니다");
else if (jsonQ && jsonQ !== faqCount) bad(`화면 질문 ${faqCount}개인데 검색용 데이터는 ${jsonQ}개입니다`);
else {
  const wrong = [];
  const files = [...pages, "assets/js/gm-menu.js"];
  for (const f of files) {
    const s = read(f);
    for (const m of s.matchAll(/(\S+?)\s?가지(?=\s?답|는 <a href="faq|")/g)) {
      const word = m[1].trim();
      if (KO.includes(word) && word !== KO[faqCount]) wrong.push(`${f}: "${m[0]}"`);
    }
    for (const m of s.matchAll(/묻는 질문 (\S+?)\s?가지/g)) {
      if (m[1].trim() !== KO[faqCount]) wrong.push(`${f}: "${m[0]}"`);
    }
  }
  if (wrong.length) bad(`FAQ는 실제 ${faqCount}개(${KO[faqCount]}가지). 어긋난 표기: ` + wrong.join(", "));
  else ok(`자주 묻는 질문 ${faqCount}개 — 화면·검색데이터·안내 표기 일치`);
}

console.log("\n[2] 내부 링크가 실제 파일을 가리키는가");
const missing = new Set();
let linkCount = 0;
for (const f of [...pages, "assets/js/gm-menu.js", "assets/js/gm-chat.js"]) {
  const s = read(f);
  for (const m of s.matchAll(/(?:href|src)="([^"#?][^"]*?)"/g)) {
    const href = m[1];
    if (/^(https?:|tel:|sms:|mailto:|data:|\/\/)/.test(href)) continue;
    if (/['+`$\\]|\s\+\s/.test(href)) continue; // JS 문자열 조립은 건너뛴다
    linkCount++;
    const clean = href.split("#")[0].split("?")[0];
    if (!clean || clean === "./") continue;
    if (!fs.existsSync(path.join(ROOT, clean))) missing.add(`${f} → ${clean}`);
  }
  // JS 안의 "xxx.html" 문자열도 본다
  for (const m of s.matchAll(/"([a-z0-9_-]+\.html)(?:#[^"]*)?"/g)) {
    linkCount++;
    if (!fs.existsSync(path.join(ROOT, m[1]))) missing.add(`${f} → ${m[1]}`);
  }
}
if (missing.size) bad(`끊어진 링크 ${missing.size}건\n       ` + [...missing].join("\n       "));
else ok(`링크 ${linkCount}개 — 끊어진 곳 없음`);

console.log("\n[3] 전화번호가 한 곳에서 나오는가");
const keys = read("assets/js/site-keys.js").replace(/\/\*[\s\S]*?\*\//g, "");
const tel = (keys.match(/window\.PHONE\s*=\s*"([^"]+)"/) || [])[1];
if (!tel) bad("site-keys.js에서 PHONE을 찾지 못했습니다");
else {
  const hard = [];
  for (const f of pages) {
    const s = read(f);
    // site-keys를 거치지 않고 직접 박아 넣은 번호를 찾는다
    const noPlaceholder = s.replace(/placeholder="[^"]*"/g, "");
    for (const m of noPlaceholder.matchAll(/0\d{1,2}-\d{3,4}-\d{4}/g)) {
      if (m[0] !== tel) hard.push(`${f}: ${m[0]}`);
    }
  }
  if (hard.length) bad(`site-keys.js의 번호(${tel})와 다른 번호: ` + hard.join(", "));
  else ok(`전화번호 ${tel} — 다른 번호 없음`);
}

console.log("\n[4] 참고용 이미지 고지가 붙어 있는가");
// AI로 만든 사진이나 시설·용품 사진을 실은 페이지에는 반드시 고지가 있어야 한다.
{
  const NOTE = "pic-note";
  const missingNote = [];
  for (const f of pages) {
    const s = read(f);
    const hasStockPhoto = /src="assets\/img\/(card-|tier)[^"]*"/.test(s);
    if (hasStockPhoto && !s.includes(NOTE)) missingNote.push(f);
  }
  if (missingNote.length) bad("참고용 이미지 고지가 빠진 페이지: " + missingNote.join(", "));
  else ok("사진을 실은 페이지에 모두 고지가 있습니다");
}

console.log("\n[5] 운영자가 확정해야 하는 문구가 어디에 있는가  (판정하지 않고 세기만 함)");
const WATCH = [
  ["24시간", /24시간(?!이 지난)/g],
  ["개설 준비 중·개설 시점", /개설 (?:준비|시점|을 준비)/g],
  ["비용 절반 아래", /절반 아래/g],
  ["전부 무료", /전부 무료/g],
  ["저희 몫 0원", /저희 몫/g],
];
for (const [label, re] of WATCH) {
  const hits = [];
  for (const f of [...pages, "assets/js/gm-menu.js", "assets/js/gm-chat.js"]) {
    const n = (read(f).match(re) || []).length;
    if (n) hits.push(`${f}(${n})`);
  }
  console.log(`  ??   ${label}: ` + (hits.length ? hits.join(" ") : "없음"));
}

console.log("\n" + (fail ? `실패 ${fail}건` : "모두 통과") + "\n");
process.exit(fail ? 1 : 0);
