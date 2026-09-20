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

console.log("\n[5] 쪽 이름이 한 가지로 불리는가");
{
  const { groups, footerNav } = await import("./nav.mjs");
  const G = groups();
  const flat = G.flatMap((g) => g.items);
  // 5-1 바닥 메뉴가 GROUPS 와 같은가
  const want = footerNav();
  const drift = pages.filter((f) => f !== "404.html")
    .filter((f) => (read(f).match(/<nav class="fnav"[\s\S]*?<\/nav>/) || [""])[0] !== want);
  drift.length
    ? bad(`바닥 메뉴가 차림표와 다름: ${drift.join(" ")} — node tools/nav.mjs --write`)
    : ok(`바닥 메뉴 ${pages.length - 1}쪽 — 차림표 한 곳에서 나옴 (묶음 ${G.length}, 쪽 ${flat.length})`);
  // 5-2 쪽 제목이 그 이름으로 시작하는가
  const off = flat.filter(([href, name]) => {
    const t = (read(href).match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    return !t.startsWith(name);
  }).map(([href, name]) => `${href}(${name})`);
  off.length ? bad("쪽 제목이 이름으로 시작하지 않음: " + off.join(" "))
             : ok(`쪽 제목 ${flat.length}개 — 모두 차림표 이름으로 시작`);
  // 5-3 홈 카드가 차림표와 같은 이름·같은 차례인가
  const home = read("index.html");
  const cards = [...home.matchAll(/<a class="card[^"]*" href="([^"]+)"[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)]
    .map((m) => [m[1], m[2].replace(/<[^>]+>/g, "").trim()]);
  const wantCards = flat.map(([h, n]) => `${h}|${n}`).join(" ");
  const gotCards = cards.map(([h, n]) => `${h}|${n}`).join(" ");
  // 5-4 줄임 표시는 머리 차림표에만 있어야 한다 (쪽마다 세 군데)
  const restOff = pages.filter((f) => f !== "404.html")
    .filter((f) => (read(f).match(/class="rest"/g) || []).length !== 3);
  restOff.length ? bad("줄임 표시가 머리 차림표 밖에 새어 나감: " + restOff.join(" "))
                 : ok("줄임 표시 — 머리 차림표에만, 쪽마다 세 군데");
  gotCards === wantCards
    ? ok(`홈 카드 ${cards.length}장 — 차림표와 같은 이름, 같은 차례`)
    : bad(`홈 카드가 차림표와 어긋남\n       차림표: ${wantCards}\n       홈    : ${gotCards}`);
}

console.log("\n[6] 장례 기록이 목록과 맞는가");
{
  const g = await import("./girok.mjs");
  let recs = null;
  try { recs = g.records(); } catch (e) { bad(e.message.split("\n")[0]); }
  if (recs) {
    const page = read("girok.html");
    const m = page.match(/<!-- 기록 목록 시작[\s\S]*?<!-- 기록 목록 끝 -->/);
    if (!m) bad("girok.html 에 목록 자리 표시가 없습니다");
    else if (m[0] !== g.listHtml(recs)) bad("목록이 기록 파일과 다릅니다 — node tools/girok.mjs --write");
    else ok(`장례 기록 ${recs.length}건 — 파일과 목록이 같고, 모두 유족 동의가 적혀 있습니다`);
    const map = read("sitemap.xml");
    const miss = recs.filter((r) => !map.includes(`/girok/${r.slug}.html`)).map((r) => r.slug);
    miss.length ? bad("사이트맵에 빠진 기록: " + miss.join(" ")) : ok("사이트맵 — 기록이 모두 실려 있습니다");
  }
}

console.log("\n[7] 운영자가 확정해야 하는 문구가 어디에 있는가  (판정하지 않고 세기만 함)");
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
