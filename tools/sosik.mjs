// 소식 목록을 sosik/ 안의 소식 파일들에서 다시 써 넣는다.
// 소식 하나 = 파일 하나. 목록은 손으로 고치지 않는다.
//
//   node tools/sosik.mjs          — 어긋난 곳이 있으면 알려만 준다
//   node tools/sosik.mjs --write  — sosik.html 의 목록과 sitemap 을 다시 쓴다
//
// 소식 파일은 <head> 안에 이런 덩어리를 가져야 한다.
//   <script type="application/json" id="gm-sosik">
//   { "date": "2026-09-25", "reader": "미리 알아보는 분께",
//     "summary": "한 줄 요약. 목록 카드에 이 문장이 보입니다." }
//   </script>
// reader 는 이 글을 누구에게 썼는지다. 목록에서 딱지로 보인다.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const DIR = path.join(ROOT, "sosik");
const LIST = path.join(ROOT, "sosik.html");
const BEGIN = "<!-- 소식 목록 시작 · tools/sosik.mjs 가 씁니다. 손으로 고치지 마세요 -->";
const END = "<!-- 소식 목록 끝 -->";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dayLabel = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[1]}. ${m[2]}. ${m[3]}.` : d;
};

export function records() {
  if (!existsSync(DIR)) return [];
  const out = [], bad = [];
  for (const f of readdirSync(DIR).filter((f) => f.endsWith(".html")).sort()) {
    const s = readFileSync(path.join(DIR, f), "utf8");
    const m = s.match(/<script type="application\/json" id="gm-sosik">([\s\S]*?)<\/script>/);
    if (!m) { bad.push(`${f}: 정보 덩어리(gm-sosik)가 없습니다`); continue; }
    let d;
    try { d = JSON.parse(m[1]); } catch (e) { bad.push(`${f}: 정보 덩어리를 읽을 수 없습니다 — ${e.message}`); continue; }
    for (const k of ["date", "reader", "summary"]) if (!d[k]) bad.push(`${f}: ${k} 가 비어 있습니다`);
    const t = s.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!t) { bad.push(`${f}: 제목(h1)이 없습니다`); continue; }
    out.push({ file: f, slug: f.replace(/\.html$/, ""), title: t[1].replace(/<[^>]+>/g, "").trim(), ...d });
  }
  if (bad.length) { const e = new Error("소식 파일에 문제가 있습니다:\n  - " + bad.join("\n  - ")); e.bad = bad; throw e; }
  // 새 글이 위로 온다. 날짜가 같으면 파일이름 역순으로 갈라 늘 같은 차례가 되게 한다.
  out.sort((a, b) => (a.date === b.date ? b.file.localeCompare(a.file) : b.date.localeCompare(a.date)));
  return out;
}

// 틀을 본뜰 파일: 날짜가 가장 늦은 소식. 날짜를 읽을 수 없으면 파일이름 마지막.
function newestFile() {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".html")).sort();
  let best = null, bestDate = "";
  for (const f of files) {
    const m = readFileSync(path.join(DIR, f), "utf8")
      .match(/<script type="application\/json" id="gm-sosik">([\s\S]*?)<\/script>/);
    let d = "";
    try { d = m ? (JSON.parse(m[1]).date || "") : ""; } catch { d = ""; }
    if (d >= bestDate) { bestDate = d; best = f; }
  }
  return best || files[files.length - 1];
}

export function listHtml(recs) {
  if (!recs.length) return BEGIN + "\n    <p>아직 올린 소식이 없습니다.</p>\n    " + END;
  const items = recs.map((r) =>
    `      <a class="rec-card" href="sosik/${r.slug}.html">\n` +
    `        <p class="rec-meta"><span class="d">${esc(dayLabel(r.date))}</span><span class="t">${esc(r.reader)}</span></p>\n` +
    `        <h3>${esc(r.title)}</h3>\n` +
    `        <p class="rec-sum">${esc(r.summary)}</p>\n` +
    `      </a>`).join("\n");
  return `${BEGIN}\n    <div class="rec-list">\n${items}\n    </div>\n    ${END}`;
}

function sitemap(recs, write) {
  const f = path.join(ROOT, "sitemap.xml");
  let s = readFileSync(f, "utf8");
  s = s.replace(/\s*<url><loc>https:\/\/gomaumsangjo\.com\/sosik\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
  const rows = recs.map((r) =>
    `  <url><loc>https://gomaumsangjo.com/sosik/${r.slug}.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
  const want = s.replace("</urlset>", (rows ? rows + "\n" : "") + "</urlset>");
  const cur = readFileSync(f, "utf8");
  if (want !== cur && write) writeFileSync(f, want);
  return want === cur;
}

// 새 소식 틀 만들기: 가장 최근 소식을 본떠 껍데기만 남긴다.
// 머리글·바닥글이 바뀌어도 늘 최신 것을 따라간다.
function scaffold(slug) {
  if (!/^\d{4}-\d{2}-[a-z0-9-]+$/.test(slug))
    throw new Error("이름은 2026-09-sangjo-garip 꼴로 지어 주세요 (연-월-영문)");
  const target = path.join(DIR, slug + ".html");
  if (existsSync(target)) throw new Error(slug + ".html 이 이미 있습니다");
  const base = newestFile();
  if (!base) throw new Error("본뜰 소식이 없습니다");
  let s = readFileSync(path.join(DIR, base), "utf8");
  const today = new Date().toISOString().slice(0, 10);
  s = s.replace(/<script type="application\/json" id="gm-sosik">[\s\S]*?<\/script>/,
    `<script type="application/json" id="gm-sosik">\n{\n  "date": "${today}",\n  "reader": "미리 알아보는 분께",\n  "summary": "한 줄 요약. 목록 카드에 이 문장이 보입니다."\n}\n</script>`);
  s = s.replace(/<article class="rec">[\s\S]*?<\/article>/,
    `<article class="rec">\n    <p class="rec-meta"><span class="d">${today.replace(/-/g, ". ")}.</span><span class="t">미리 알아보는 분께</span></p>\n    <h1>제목을 적으세요</h1>\n    <p>본문을 적으세요. 값은 지어내지 않습니다. 사이트에 근거가 있는 숫자만 씁니다.</p>\n  </article>`);
  s = s.replace(/<title>[^<]*<\/title>/, "<title>제목을 적으세요 — 소식 — 고마움 상조</title>");
  s = s.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://gomaumsangjo.com/sosik/${slug}.html">`);
  writeFileSync(target, s);
  return target;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes("--write");
  const ni = process.argv.indexOf("--new");
  if (ni > -1) {
    try {
      const f = scaffold(process.argv[ni + 1] || "");
      console.log("만들었습니다: " + path.relative(ROOT, f));
      console.log("  1. 파일을 열어 정보 덩어리와 본문을 채웁니다");
      console.log("  2. reader 에 누구에게 쓴 글인지 적습니다");
      console.log("  3. node tools/sosik.mjs --write");
    } catch (e) { console.error(e.message); process.exitCode = 1; }
    process.exit(process.exitCode || 0);
  }
  let recs;
  try { recs = records(); }
  catch (e) { console.error(e.message); process.exit(1); }

  const page = readFileSync(LIST, "utf8");
  const re = new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!re.test(page)) { console.error("sosik.html 에 목록 자리 표시가 없습니다. 아래 두 줄을 넣어 주세요.\n" + BEGIN + "\n" + END); process.exit(1); }
  const want = page.replace(re, listHtml(recs));
  const listSame = want === page;
  if (!listSame && write) writeFileSync(LIST, want);
  const mapSame = sitemap(recs, write);

  console.log(`소식 ${recs.length}건 · 목록 ${listSame ? "같음" : (write ? "고침" : "어긋남")} · 사이트맵 ${mapSame ? "같음" : (write ? "고침" : "어긋남")}`);
  recs.forEach((r) => console.log(`  ${r.date}  ${r.reader}  ${r.title}`));
  if (!write && (!listSame || !mapSame)) process.exitCode = 1;
}
