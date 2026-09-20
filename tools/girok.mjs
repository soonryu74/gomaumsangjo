// 장례 기록 목록을 girok/ 안의 기록 파일들에서 다시 써 넣는다.
// 기록 하나 = 파일 하나. 목록은 손으로 고치지 않는다.
//
//   node tools/girok.mjs          — 어긋난 곳이 있으면 알려만 준다
//   node tools/girok.mjs --write  — girok.html 의 목록과 sitemap 을 다시 쓴다
//
// 기록 파일은 <head> 안에 이런 덩어리를 가져야 한다.
//   <script type="application/json" id="gm-girok">
//   { "date": "2026-02", "place": "…장례식장", "days": "3일장",
//     "summary": "한 줄 요약", "consent": "2026-02" }
//   </script>
// consent(유족 동의를 받은 달)가 없으면 목록에 올리지 않고 거부한다.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const DIR = path.join(ROOT, "girok");
const LIST = path.join(ROOT, "girok.html");
const BEGIN = "<!-- 기록 목록 시작 · tools/girok.mjs 가 씁니다. 손으로 고치지 마세요 -->";
const END = "<!-- 기록 목록 끝 -->";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ymLabel = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  return m ? `${m[1]}년 ${+m[2]}월` : ym;
};

export function records() {
  if (!existsSync(DIR)) return [];
  const out = [], bad = [];
  for (const f of readdirSync(DIR).filter((f) => f.endsWith(".html")).sort().reverse()) {
    const s = readFileSync(path.join(DIR, f), "utf8");
    const m = s.match(/<script type="application\/json" id="gm-girok">([\s\S]*?)<\/script>/);
    if (!m) { bad.push(`${f}: 정보 덩어리(gm-girok)가 없습니다`); continue; }
    let d;
    try { d = JSON.parse(m[1]); } catch (e) { bad.push(`${f}: 정보 덩어리를 읽을 수 없습니다 — ${e.message}`); continue; }
    for (const k of ["date", "place", "days", "summary"]) if (!d[k]) bad.push(`${f}: ${k} 가 비어 있습니다`);
    // 동의 없는 기록은 올리지 않는다. 사이트가 한 약속이다.
    if (!d.consent) { bad.push(`${f}: 유족 동의(consent)가 없어 목록에 올리지 않습니다`); continue; }
    const t = s.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!t) { bad.push(`${f}: 제목(h1)이 없습니다`); continue; }
    out.push({ file: f, slug: f.replace(/\.html$/, ""), title: t[1].replace(/<[^>]+>/g, "").trim(), ...d });
  }
  if (bad.length) { const e = new Error("기록 파일에 문제가 있습니다:\n  - " + bad.join("\n  - ")); e.bad = bad; throw e; }
  return out;
}

export function listHtml(recs) {
  if (!recs.length) return BEGIN + "\n    <p>아직 올린 기록이 없습니다.</p>\n    " + END;
  const items = recs.map((r) =>
    `      <a class="rec-card" href="girok/${r.slug}.html">\n` +
    `        <p class="rec-meta"><span class="d">${esc(ymLabel(r.date))}</span><span class="p">${esc(r.place)}</span><span class="t">${esc(r.days)}</span></p>\n` +
    `        <h3>${esc(r.title)}</h3>\n` +
    `        <p class="rec-sum">${esc(r.summary)}</p>\n` +
    `      </a>`).join("\n");
  return `${BEGIN}\n    <div class="rec-list">\n${items}\n    </div>\n    ${END}`;
}

function sitemap(recs, write) {
  const f = path.join(ROOT, "sitemap.xml");
  let s = readFileSync(f, "utf8");
  s = s.replace(/\s*<url><loc>https:\/\/gomaumsangjo\.com\/girok\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
  const rows = recs.map((r) =>
    `  <url><loc>https://gomaumsangjo.com/girok/${r.slug}.html</loc><changefreq>yearly</changefreq><priority>0.6</priority></url>`).join("\n");
  const want = s.replace("</urlset>", (rows ? rows + "\n" : "") + "</urlset>");
  const cur = readFileSync(f, "utf8");
  if (want !== cur && write) writeFileSync(f, want);
  return want === cur;
}

// 새 기록 틀 만들기: 가장 최근 기록을 본떠 껍데기만 남긴다.
// 머리글·바닥글이 바뀌어도 늘 최신 것을 따라간다.
function scaffold(slug) {
  if (!/^\d{4}-\d{2}-[a-z0-9-]+$/.test(slug))
    throw new Error("이름은 2026-09-anyang-metro 꼴로 지어 주세요 (연-월-영문)");
  const target = path.join(DIR, slug + ".html");
  if (existsSync(target)) throw new Error(slug + ".html 이 이미 있습니다");
  const base = readdirSync(DIR).filter((f) => f.endsWith(".html")).sort().pop();
  if (!base) throw new Error("본뜰 기록이 없습니다");
  let s = readFileSync(path.join(DIR, base), "utf8");
  const ym = slug.slice(0, 7);
  s = s.replace(/<script type="application\/json" id="gm-girok">[\s\S]*?<\/script>/,
    `<script type="application/json" id="gm-girok">\n{\n  "date": "${ym}",\n  "place": "○○장례식장",\n  "days": "3일장",\n  "summary": "한 줄 요약. 목록 카드에 이 문장이 보입니다.",\n  "consent": ""\n}\n</script>`);
  s = s.replace(/<article class="rec">[\s\S]*?<\/article>/,
    `<article class="rec">\n    <p class="rec-meta"><span class="d">${ym.slice(0,4)}년 ${+ym.slice(5)}월</span><span class="p">○○장례식장</span><span class="t">3일장</span></p>\n    <h1>제목을 적으세요</h1>\n    <p>본문을 적으세요. 이름, 나이, 직업, 빈소 호실, 선영 위치는 적지 않습니다.</p>\n    <blockquote class="rec-q">"가족의 말씀은 동의를 받은 것만, 그대로 옮깁니다."<cite>— 상주께서</cite></blockquote>\n  </article>`);
  s = s.replace(/<title>[^<]*<\/title>/, "<title>제목을 적으세요 — 장례 기록 — 고마움 상조</title>");
  s = s.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://gomaumsangjo.com/girok/${slug}.html">`);
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
      console.log("  2. consent 에 유족 동의를 받은 달을 적습니다 (비면 목록에 오르지 않습니다)");
      console.log("  3. node tools/girok.mjs --write");
    } catch (e) { console.error(e.message); process.exitCode = 1; }
    process.exit(process.exitCode || 0);
  }
  let recs;
  try { recs = records(); }
  catch (e) { console.error(e.message); process.exit(1); }

  const page = readFileSync(LIST, "utf8");
  const re = new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!re.test(page)) { console.error("girok.html 에 목록 자리 표시가 없습니다. 아래 두 줄을 넣어 주세요.\n" + BEGIN + "\n" + END); process.exit(1); }
  const want = page.replace(re, listHtml(recs));
  const listSame = want === page;
  if (!listSame && write) writeFileSync(LIST, want);
  const mapSame = sitemap(recs, write);

  console.log(`기록 ${recs.length}건 · 목록 ${listSame ? "같음" : (write ? "고침" : "어긋남")} · 사이트맵 ${mapSame ? "같음" : (write ? "고침" : "어긋남")}`);
  recs.forEach((r) => console.log(`  ${r.date}  ${r.place}  ${r.title}`));
  if (!write && (!listSame || !mapSame)) process.exitCode = 1;
}
