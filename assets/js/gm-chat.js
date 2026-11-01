/* 고마움 상조 — 버튼식 안내 (A안)
 *
 * 원칙 세 가지.
 * 1. 첫 질문은 "지금 상을 당하셨습니까?" 하나뿐이다. 급한 분은 세 번 누르기 전에
 *    콜센터 전화로 보낸다.
 * 2. 답은 홈페이지에 적힌 글만 쓴다. 새로 지어내지 않는다. 금액은 홈페이지에 공개한 가격만 말한다.
 * 3. 대화 내용을 저장하지 않는다. 서버로 보내지 않는다. 브라우저 안에서만 돈다.
 *
 * 무엇을 눌렀는지 세는 기능은 gtag가 있을 때만 동작한다. 지금은 없으므로 아무 데도 기록되지 않는다.
 */
(function () {
  "use strict";
  if (window.__gmChat) return;
  window.__gmChat = true;

  var TEL = (window.PHONE || "010-6783-0070").trim();
  var TEL_HREF = "tel:" + TEL.replace(/[^0-9+]/g, "");
  var SMS_BODY = "고마움 상조에 문의드립니다. 편하실 때 연락 주세요.";

  /* ---- 답변. 전부 홈페이지에 있는 문장이다. ---- */
  var NODES = {
    cost: {
      q: "비용이 얼마나 드나요",
      a: [
        "빈소 규모와 조문객 수, 화장인지 매장인지에 따라 크게 달라집니다. 장례비 계산기에 조건을 넣으시면 저희 몫과 시설 몫이 색으로 갈려 대략의 액수가 나옵니다.",
        "빈소 없이 가족끼리 모시는 무빈소 장례는 빈소 사용료와 접객 음식이 빠지기 때문에 비용이 크게 줄어듭니다.",
        "고마움상조 상품은 조용히 119만 원, 가족장 260만 원, 넉넉한 3일장 350만 원, 정성껏 490만 원입니다. 장례식장 사용료·식대, 화장료, 장지 비용은 별도로 각 시설에 직접 내십니다."
      ],
      links: [["상품 안내", "sangpum.html"], ["장례비 가늠", "gaeum.html"]],
      next: ["facility", "extra", "settle"]
    },
    facility: {
      q: "장례식장·화장장 비용도 포함인가요",
      a: [
        "아닙니다. 장례식장 사용료와 식대, 화장료, 봉안이나 매장 비용은 가족이 각 시설에 직접 결제하십니다.",
        "저희 정산서에 들어가지 않고 저희가 마진을 붙이지도 않습니다. 이 구분이 흐릿하면 총액이 부풀어 보이니, 무엇이 저희 몫이고 무엇이 시설 몫인지 미리 나눠 두었습니다."
      ],
      links: [["장례식장·납골당 찾기", "sikjang.html"], ["품목별 단가표", "danga.html"]],
      next: ["cost", "extra"]
    },
    extra: {
      q: "장례 중에 추가 비용이 생기나요",
      a: [
        "홈페이지에 공개한 가격과 안내에 없는 항목은 청구하지 않습니다.",
        "장례 중에 가족이 스스로 고르신 항목, 예를 들어 수의 등급을 올리거나 버스를 한 대 더 부르는 것은 그 자리에서 금액을 말씀드리고 정산서에 그대로 적힙니다. 말씀드리지 않은 돈이 정산서에 나타나는 일은 없습니다."
      ],
      links: [["품목별 단가표", "danga.html"], ["대표의 글", "yaksok.html"]],
      next: ["dirty", "settle"]
    },
    dirty: {
      q: "직원이 노잣돈을 요구하면요",
      a: [
        "그 장례의 저희 몫은 받지 않겠습니다.",
        "노잣돈, 촌지, 수고비, 어떤 이름이든 정산서에 없는 돈을 요구하는 일이 있으면 전화로 알려 주세요. 대표가 직접 확인합니다. 이것은 홍보 문구가 아니라 대표의 글에 적어 둔 약속입니다."
      ],
      links: [["대표의 글", "yaksok.html"]],
      next: ["extra", "settle"]
    },
    settle: {
      q: "정산은 언제, 어떻게 하나요",
      a: [
        "발인 전에 장례식장 정산과 함께 한 번 합니다. 쓰신 항목을 홈페이지에 공개한 가격대로 계산합니다.",
        "카드 결제가 되고 카드 할부는 카드사와 가족 사이의 일입니다. 저희가 대금을 나눠 받는 구조는 만들지 않습니다. 그렇게 하면 선불식 할부계약이 되기 때문입니다."
      ],
      links: [["후불제 장례", "hubul.html"]],
      next: ["prepay", "cost"]
    },
    join: {
      q: "가입 안 했는데 지금 되나요",
      a: [
        "됩니다. 저희에게는 '가입'이라는 것이 없습니다. 콜센터로 전화 주시면 그때부터 장례지도사가 움직입니다.",
        "선불 상조는 가입 고객을 우선하기 때문에 가입하지 않은 분은 현장 가입 상품으로 제한을 두기도 합니다. 후불제는 그 구분이 없습니다. 오시는 모든 가족이 같은 가격을 받습니다."
      ],
      links: [["후불제 장례", "hubul.html"]],
      next: ["prepay", "consult"]
    },
    prepay: {
      q: "미리 내는 돈이 정말 없나요",
      a: [
        "네. 가입비, 예치금, 보증금, 회비, 어느 이름으로도 받지 않습니다.",
        "미리 받는 순간 저희는 선불식 할부거래업 등록 대상이 되고, 가족은 저희 폐업 위험을 떠안게 됩니다. 그 구조를 만들지 않는 것이 저희가 후불제를 하는 이유입니다."
      ],
      links: [["후불제 장례", "hubul.html"], ["선불 상조와 비교", "hubul.html#compare"]],
      next: ["haeyak", "join"]
    },
    haeyak: {
      q: "선불 상조가 있는데요",
      a: [
        "지금 넣고 계신 상조가 있으시면 해약할지 유지할지부터 따져 보셔야 합니다. 해약하면 얼마를 돌려받는지 계산해 보실 수 있게 해 두었습니다.",
        "결합상품으로 가입하신 경우라면 판별해 보는 문항도 있습니다."
      ],
      links: [["내 상조 점검", "jeoul.html"], ["결합상품 판별", "gyeolhap.html"]],
      next: ["prepay", "consult"]
    },
    product: {
      q: "상품이 어떻게 되나요",
      a: [
        "네 가지 상품이 있습니다. 조용히(빈소 없이) 119만 원, 가족장 260만 원, 넉넉한 3일장 350만 원, 정성껏 490만 원입니다.",
        "상품마다 포함 품목을 그대로 적어 두었고, 일정이 길어지거나 거리가 늘 때의 추가 비용도 함께 적었습니다."
      ],
      links: [["상품 안내", "sangpum.html"], ["무빈소 장례", "mubinso.html"]],
      next: ["cost", "mubinso"]
    },
    mubinso: {
      q: "빈소 없이 가족끼리 하고 싶습니다",
      a: [
        "조문객을 받지 않고 가족만 모이는 장례입니다. 안치·염습·입관·화장·봉안까지 꼭 필요한 것만 합니다.",
        "빈소 사용료와 접객 음식이 빠지기 때문에 비용이 크게 줄어듭니다."
      ],
      links: [["무빈소 장례", "mubinso.html"], ["상품 안내", "sangpum.html"]],
      next: ["cost", "procedure"]
    },
    procedure: {
      q: "장례 절차가 궁금합니다",
      a: [
        "임종부터 발인까지 순서대로 정리해 두었습니다. 사망진단서 발급, 장례식장 안치, 가족에게 알릴 순서까지 임종 직후 여섯 시간에 무엇을 해야 하는지 적어 두었습니다.",
        "종교 예식도 같이 진행합니다. 기독교 장례는 임종·입관·발인·하관 네 번의 예배로 흐릅니다."
      ],
      links: [["무엇부터 해야 하나", "jeolcha.html"], ["기독교 장례", "christian.html"], ["부고 쓰는 법", "bugo.html"]],
      next: ["speed", "product"]
    },
    consult: {
      q: "상담만 미리 받아도 되나요",
      a: [
        "됩니다. 상담은 무료이고, 상담을 받았다고 저희에게 맡기실 의무가 생기지 않습니다.",
        "원하시는 장례의 모양과 예산을 미리 정리해 두면 그날 결정할 것이 크게 줄어듭니다. 상담 시점에 어떤 금액도 받지 않습니다."
      ],
      links: [["상품 안내", "sangpum.html"]],
      next: ["prepay", "product"]
    },
    speed: {
      q: "전화하면 몇 시간 안에 오나요",
      a: [
        "콜센터는 24시간 받고, 장례지도사가 24시간 출동 대기합니다. 접수와 동시에 가장 가까운 장례지도사가 출발합니다. 도착까지 걸리는 시간은 지역과 시간대에 따라 다르고, 저희는 확인되지 않은 시간을 약속하지 않습니다.",
        "도착 전에도 전화로 먼저 안내합니다."
      ],
      links: [["무엇부터 해야 하나", "jeolcha.html"]],
      next: ["region", "procedure"]
    },
    region: {
      q: "지방이나 섬에서도 되나요",
      a: [
        "전국 어디서나 모십니다. 콜센터로 연락 주시면 지역과 상관없이 장례지도사가 출동합니다.",
        "먼 거리를 모실 때의 차량 요금은 품목별 단가표의 거리 기준을 따릅니다."
      ],
      links: [["품목별 단가표", "danga.html"], ["후불제 장례", "hubul.html"]],
      next: ["speed"]
    },
    etc: {
      q: "그 밖에 궁금한 것",
      a: [
        "기일 리마인드는 준비 중인 서비스입니다. 기일 전에 먼저 안부를 전하는 것을 생각하고 있고, 제공 범위와 신청 방법은 출시할 때 안내하겠습니다.",
        "화환, 답례품, 영정사진, 유품정리처럼 저희가 직접 하지 않는 일은 소개만 합니다. 소개료가 있으면 있다고 그 자리에 씁니다."
      ],
      links: [["기일 리마인드", "kiil.html"], ["함께하는 곳", "hyeopryeok.html"], ["자주 묻는 질문", "faq.html"]],
      next: ["procedure", "cost"]
    }
  };

  var MENU = ["cost", "product", "join", "prepay", "haeyak", "procedure", "mubinso", "extra", "settle", "etc"];

  /* ---- DOM ---- */
  var root, panel, body, launcher, open = false;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function track(name) {
    if (typeof window.gtag === "function") {
      try { window.gtag("event", "chat_" + name); } catch (e) {}
    }
  }

  function isNight() {
    var h = new Date().getHours();
    return h >= 22 || h < 7;
  }

  function scrollDown() {
    requestAnimationFrame(function () { body.scrollTop = body.scrollHeight; });
  }

  function bot(lines) {
    var wrap = el("div", "gc-row");
    var b = el("div", "gc-bub gc-bot");
    (Array.isArray(lines) ? lines : [lines]).forEach(function (t, i) {
      var p = el("p", null, t);
      if (i === 0) p.className = "gc-first";
      b.appendChild(p);
    });
    wrap.appendChild(b);
    body.appendChild(wrap);
    return b;
  }

  function mine(text) {
    var wrap = el("div", "gc-row gc-me-row");
    wrap.appendChild(el("div", "gc-bub gc-me", text));
    body.appendChild(wrap);
  }

  function links(pairs) {
    if (!pairs || !pairs.length) return;
    var wrap = el("div", "gc-links");
    pairs.forEach(function (p) {
      var a = el("a", "gc-link", p[0]);
      a.href = /^(https?:|\/|#)/.test(p[1]) ? p[1] : "/" + p[1];
      wrap.appendChild(a);
    });
    body.appendChild(wrap);
  }

  function buttons(list) {
    var wrap = el("div", "gc-btns");
    list.forEach(function (item) {
      var b = el("button", "gc-btn" + (item.hot ? " gc-hot" : ""), item.label);
      b.type = "button";
      b.addEventListener("click", function () {
        // 누른 뒤에는 그 줄의 버튼을 지운다. 되돌아가는 길은 아래에 다시 놓는다.
        wrap.remove();
        item.go();
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    scrollDown();
  }

  /* ---- 화면들 ---- */

  function screenStart() {
    body.innerHTML = "";
    bot(["지금 상을 당하셨습니까?"]);
    buttons([
      { label: "예, 지금 급합니다", hot: true, go: screenUrgent },
      { label: "아니요, 알아보는 중입니다", go: screenCalm }
    ]);
  }

  function screenUrgent() {
    track("urgent");
    mine("예, 지금 급합니다");
    bot(["콜센터로 바로 전화 주세요. 무엇부터 해야 하는지 통화하면서 같이 짚어 드리겠습니다.", "먼저 의료진에게 사망진단서를 받아 두시면 됩니다."]);
    var wrap = el("div", "gc-callbox");
    var a = el("a", "gc-callbtn", TEL);
    a.href = TEL_HREF;
    a.addEventListener("click", function () { track("call_urgent"); });
    wrap.appendChild(a);
    body.appendChild(wrap);
    links([["임종 직후 무엇부터 해야 하나", "jeolcha.html"]]);
    buttons([{ label: "먼저 알아보고 싶습니다", go: function () { screenCalm(true); } }]);
  }

  function screenCalm(skipEcho) {
    track("calm");
    if (!skipEcho) mine("아니요, 알아보는 중입니다");
    var lines = ["천천히 보셔도 됩니다. 무엇이 궁금하신가요?"];
    if (isNight()) {
      lines.unshift("지금은 밤입니다. 천천히 보시고, 궁금한 것은 문자로 남겨 두셔도 됩니다.");
    }
    bot(lines);
    menu();
  }

  function menu() {
    var list = MENU.map(function (id) {
      return { label: NODES[id].q, go: function () { answer(id); } };
    });
    list.push({ label: "그냥 통화하고 싶어요", hot: true, go: screenCall });
    buttons(list);
  }

  function answer(id) {
    var n = NODES[id];
    track("q_" + id);
    mine(n.q);
    bot(n.a);
    links(n.links);
    var list = (n.next || []).filter(function (x) { return NODES[x]; }).map(function (x) {
      return { label: NODES[x].q, go: function () { answer(x); } };
    });
    list.push({ label: "다른 것도 볼게요", go: function () { bot(["무엇이 궁금하신가요?"]); menu(); } });
    list.push({ label: "그냥 통화하고 싶어요", hot: true, go: screenCall });
    buttons(list);
  }

  function screenCall() {
    track("call_menu");
    mine("그냥 통화하고 싶어요");
    bot(["고마움상조 콜센터입니다. 24시간 받고, 접수와 상담 모두 이 번호로 받습니다.", "통화가 어려우시면 문자로 남겨 주세요. 확인하는 대로 연락드리겠습니다. 남기신 번호는 연락드리는 데에만 씁니다."]);
    var wrap = el("div", "gc-callbox");
    var a = el("a", "gc-callbtn", TEL);
    a.href = TEL_HREF;
    a.addEventListener("click", function () { track("call_click"); });
    wrap.appendChild(a);
    var s = el("a", "gc-smsbtn", "문자로 남기기");
    s.href = "sms:" + TEL.replace(/[^0-9+]/g, "") + "?body=" + encodeURIComponent(SMS_BODY);
    s.addEventListener("click", function () { track("sms_click"); });
    wrap.appendChild(s);
    body.appendChild(wrap);
    var back = el("div", "gc-btns");
    var b = el("button", "gc-btn gc-quiet", "다시 처음으로");
    b.type = "button";
    b.addEventListener("click", function () { screenStart(); });
    back.appendChild(b);
    body.appendChild(back);
    scrollDown();
  }

  /* ---- 열고 닫기 ---- */

  function build() {
    root = el("div", "gc-root");

    launcher = el("button", "gc-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "궁금한 것 물어보기");
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-4.9A8.3 8.3 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>' +
      "</svg><span>궁금한 것</span>";
    launcher.addEventListener("click", toggle);

    panel = el("div", "gc-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "고마움 상조 안내");
    panel.hidden = true;

    var head = el("div", "gc-head");
    head.appendChild(el("strong", null, "무엇을 도와드릴까요"));
    var x = el("button", "gc-x");
    x.type = "button";
    x.setAttribute("aria-label", "닫기");
    x.textContent = "✕";
    x.addEventListener("click", toggle);
    head.appendChild(x);

    body = el("div", "gc-body");

    var foot = el("p", "gc-foot", "홈페이지에 적어 둔 내용만 안내합니다. 여기 나눈 이야기는 저장하지 않습니다.");

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);
  }

  // 무슨 일이 있어도 빈 창을 보여주지 않는다. 안내가 깨지면 전화번호라도 나와야 한다.
  function fallback() {
    body.innerHTML = "";
    bot(["안내를 불러오지 못했습니다. 전화 주시면 바로 도와드리겠습니다."]);
    var wrap = el("div", "gc-callbox");
    var a = el("a", "gc-callbtn", TEL);
    a.href = TEL_HREF;
    wrap.appendChild(a);
    body.appendChild(wrap);
  }

  var opener = null;
  function toggle() {
    open = !open;
    panel.hidden = !open;
    root.classList.toggle("gc-open", open);
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      try {
        screenStart();
        if (!body.children.length) fallback();
      } catch (e) {
        try { fallback(); } catch (e2) {}
      }
      track("open");
      var x = panel.querySelector(".gc-x");
      if (x) x.focus();
    } else {
      var back = opener && opener.offsetParent !== null ? opener : launcher;
      back.focus();
    }
  }

  // 사이드바 전화 카드 안의 단추로도 열린다. 여는 곳은 화면마다 하나만 보인다.
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-gc-open]") : null;
    if (!t) return;
    e.preventDefault();
    opener = t;
    if (!open) toggle();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) toggle();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
