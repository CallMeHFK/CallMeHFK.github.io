/* ═══════════════════════════════════════════════════════════════
   CallMeHFK / DOSSIER — 交互层
   阅读进度 · 侧栏索引 · 台账展开 · 系统 tab · 站内检索 · 主题切换
   原则：所有内容在无 JS 时仍可读，脚本只做增强。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var KEEP = (window.__DOSSIER_OBS = window.__DOSSIER_OBS || []);

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ── 1. 滚动揭示 ───────────────────────────────────────── */
  function initReveal() {
    var els = $$(".reveal, .mask");
    if (!els.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    KEEP.push(io);

    els.forEach(function (el) {
      var sibs = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (n) {
        return n.classList && (n.classList.contains("reveal") || n.classList.contains("mask"));
      }) : [];
      var i = sibs.indexOf(el);
      el.style.setProperty("--d", Math.min(i < 0 ? 0 : i, 5) * 0.055 + "s");
      io.observe(el);
    });
  }

  /* ── 2. 阅读进度 ───────────────────────────────────────── */
  function initProgress() {
    var line = $("#progress-line");
    var pct = $("#rail-pct");
    var toTop = $("#to-top");
    var ticking = false;

    function frame() {
      ticking = false;
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.documentElement.scrollTop;
      var k = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
      if (line) line.style.transform = "scaleX(" + k.toFixed(4) + ")";
      if (pct) pct.textContent = Math.round(k * 100) + "%";
      if (toTop) toTop.classList.toggle("on", y > window.innerHeight * 0.9);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(frame);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      });
    }
  }

  /* ── 3. 侧栏索引高亮 ───────────────────────────────────── */
  function initScrollSpy() {
    var nav = $("#rail-nav");
    if (!nav) return;
    var links = $$("a", nav);
    var secs = links.map(function (a) {
      return doc.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);
    if (!secs.length) return;

    function update() {
      var probe = window.innerHeight * 0.32;
      var idx = 0;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].getBoundingClientRect().top <= probe) idx = i;
      }
      links.forEach(function (a, i) {
        var on = i === idx;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ── 4. 台账展开 ───────────────────────────────────────── */
  function initLedger() {
    $$(".lrow-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.closest(".lrow");
        if (!row) return;
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        row.classList.toggle("open", !open);
      });
    });
  }

  /* ── 5. 系统 tab ───────────────────────────────────────── */
  function initTabs() {
    var list = $(".tablist");
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    if (!tabs.length) return;

    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowDown" || k === "ArrowRight") n = (i + 1) % tabs.length;
        else if (k === "ArrowUp" || k === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") n = 0;
        else if (k === "End") n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(n, true);
      });
    });
  }

  /* ── 6. 主题切换（圆形揭示） ───────────────────────────── */
  function initTheme() {
    var btn = $("#theme-toggle");
    var meta = doc.querySelector('meta[name="theme-color"]');
    function paint(t) {
      root.setAttribute("data-theme", t);
      if (meta) meta.setAttribute("content", t === "ink" ? "#131210" : "#f2efe8");
      window.dispatchEvent(new CustomEvent("dossier:theme", { detail: { theme: t } }));
    }

    function apply(next) {
      try { localStorage.setItem("cmk-theme", next); } catch (e) {}
      paint(next);
    }

    if (btn) {
      btn.addEventListener("click", function (ev) {
        var next = root.getAttribute("data-theme") === "ink" ? "paper" : "ink";
        if (!doc.startViewTransition || reduced) { apply(next); return; }
        var x = ev.clientX || window.innerWidth - 44;
        var y = ev.clientY || 40;
        var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        var vt = doc.startViewTransition(function () { apply(next); });
        if (vt && vt.ready) {
          vt.ready.then(function () {
            root.animate(
              { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
              { duration: 560, easing: "cubic-bezier(.22,.72,.24,1)", pseudoElement: "::view-transition-new(root)" }
            );
          }).catch(function () {});
        }
      });
    }
    // 若系统主题变化且用户未手动选择，跟随一次
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        var saved = null;
        try { saved = localStorage.getItem("cmk-theme"); } catch (err) {}
        if (!saved) paint(e.matches ? "ink" : "paper");
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
    }
  }

  /* ── 7. 名录 ticker：复制一份实现无缝循环 ──────────────── */
  function initTicker() {
    var track = $("#ticker-track");
    if (!track || reduced) return;
    var kids = Array.prototype.slice.call(track.children);
    kids.forEach(function (n) {
      var c = n.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.tabIndex = -1;
      track.appendChild(c);
    });
  }

  /* ── 8. 站内检索面板 ───────────────────────────────────── */
  function initPalette() {
    var box = $("#palette");
    var input = $("#palette-input");
    var list = $("#palette-list");
    var empty = $("#palette-empty");
    var openBtn = $("#palette-open");
    if (!box || !input || !list) return;

    var lastFocus = null;
    var items = [];
    var view = [];
    var sel = 0;

    function push(group, title, sub, href, extra) {
      items.push({ g: group, t: title, s: sub || "", h: href, k: (extra || "") });
    }

    $$("section.sec").forEach(function (sec) {
      var h = $(".sec-title", sec);
      var no = $(".sec-no", sec);
      if (!h) return;
      push("章节", h.textContent.trim(), no ? no.textContent.trim() : "", "#" + sec.id, sec.id);
    });

    $$(".lrow").forEach(function (row) {
      var name = $(".lrow-name", row);
      if (!name) return;
      var tag = $(".lrow-tag", row);
      var kind = $(".lrow-kind", row);
      var go = $(".lrow-desc .go", row);
      var n = $(".lrow-n", row);
      push(
        row.classList.contains("is-private") ? "未开源" : "公开项目",
        name.textContent.trim(),
        [tag && tag.textContent.trim(), kind && kind.textContent.trim()].filter(Boolean).join(" · ") || "单个可见组件",
        go ? go.getAttribute("href") : "",
        (n ? n.textContent : "") + " " + (tag ? tag.textContent : "")
      );
    });

    $$(".priv-card").forEach(function (card) {
      var h = $("h4", card);
      var c = $(".priv-comp", card);
      if (!h) return;
      push("未开源", h.textContent.trim(), c ? c.textContent.trim() : "单个可见组件", "#projects", "private " + h.textContent);
    });

    push("页面", "项目档案", "15 条记录 · 可筛选与检索", "projects/", "archive projects");
    push("页面", "信息边界", "公开与未开源的写法对照", "#boundary", "boundary rules");
    push("外部", "GitHub @CallMeHFK", "公开仓库列表", "https://github.com/CallMeHFK", "github repo");

    function render(q) {
      var key = q.trim().toLowerCase();
      view = key
        ? items.filter(function (it) {
            return (it.t + " " + it.s + " " + it.g + " " + it.k).toLowerCase().indexOf(key) > -1;
          })
        : items.slice(0, 9);
      sel = 0;
      list.innerHTML = "";
      var group = null;
      view.forEach(function (it, i) {
        if (it.g !== group) {
          group = it.g;
          var gh = doc.createElement("p");
          gh.className = "pgroup";
          gh.textContent = group;
          list.appendChild(gh);
        }
        var a = doc.createElement("a");
        a.className = "pitem";
        a.href = it.h || "#";
        a.setAttribute("role", "option");
        a.setAttribute("aria-selected", i === 0 ? "true" : "false");
        if (/^https?:/.test(it.h)) { a.target = "_blank"; a.rel = "noopener"; }
        var pn = doc.createElement("span"); pn.className = "pn"; pn.textContent = String(i + 1).padStart(2, "0");
        var pt = doc.createElement("span"); pt.className = "pt"; pt.textContent = it.t;
        var ps = doc.createElement("span"); ps.className = "pk"; ps.textContent = it.s;
        a.appendChild(pn); a.appendChild(pt); a.appendChild(ps);
        a.addEventListener("pointermove", function () { setSel(i, false); });
        a.addEventListener("click", function () { close(); });
        list.appendChild(a);
      });
      if (empty) empty.hidden = view.length > 0;
    }

    function setSel(i, scroll) {
      var nodes = $$(".pitem", list);
      if (!nodes.length) return;
      sel = (i + nodes.length) % nodes.length;
      nodes.forEach(function (n, j) { n.setAttribute("aria-selected", j === sel ? "true" : "false"); });
      if (scroll && nodes[sel]) nodes[sel].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "");
    }

    function open() {
      lastFocus = doc.activeElement;
      box.hidden = false;
      input.value = "";
      render("");
      doc.body.style.overflow = "hidden";
      window.setTimeout(function () { input.focus(); }, 0);
    }

    function close() {
      if (box.hidden) return;
      box.hidden = true;
      doc.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (openBtn) openBtn.addEventListener("click", open);

    doc.addEventListener("keydown", function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (box.hidden) open(); else close();
        return;
      }
      if (e.key === "Escape") { close(); return; }
      if (box.hidden) {
        if (e.key === "/" && !/input|textarea|select/i.test((doc.activeElement.tagName || ""))) {
          e.preventDefault();
          open();
        }
        return;
      }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(sel + 1, true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel(sel - 1, true); }
      else if (e.key === "Enter") {
        var nodes = $$(".pitem", list);
        if (nodes[sel]) { e.preventDefault(); nodes[sel].click(); }
      } else if (e.key === "Tab") {
        var focusables = $$('input, a[href], button', box);
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    input.addEventListener("input", function () { render(input.value); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    render("");
  }

  /* ── 9. 卡片级指针反馈（仅精细指针） ──────────────────── */
  function initPointerAccent() {
    if (!fine || reduced) return;
    $$(".ledger, .focus, .priv-grid").forEach(function (host) {
      host.addEventListener("pointermove", function (e) {
        var row = e.target.closest(".lrow, .frow, .priv-card");
        if (!row) return;
        var r = row.getBoundingClientRect();
        row.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        row.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      }, { passive: true });
    });
  }

  /* ── 10. 档案页：筛选、检索、视图切换 ──────────────────── */
  function initArchive() {
    var ledger = doc.getElementById("arc-ledger");
    if (!ledger) return;

    var rows = $$(".lrow", ledger);
    var count = doc.getElementById("arc-count");
    var empty = doc.getElementById("arc-empty");
    var search = doc.getElementById("arc-search");
    var visBtns = $$("button[data-vis]");
    var cluBtns = $$("button[data-cluster]");
    var state = { vis: "all", cluster: "all", q: "" };

    function sync(btns, attr, val) {
      btns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute(attr) === val ? "true" : "false");
      });
    }

    function apply() {
      var shown = 0;
      rows.forEach(function (row) {
        var v = row.getAttribute("data-vis");
        var c = row.getAttribute("data-cluster");
        var hay = (row.getAttribute("data-name") + " " + (row.getAttribute("data-text") || "") + " " + c).toLowerCase();
        var ok = (state.vis === "all" || v === state.vis) &&
          (state.cluster === "all" || c === state.cluster) &&
          (!state.q || hay.indexOf(state.q) > -1);
        row.hidden = !ok;
        if (ok) { shown++; return; }
        var b = $(".lrow-btn", row);
        if (b) b.setAttribute("aria-expanded", "false");
        row.classList.remove("open");
      });
      if (count) count.textContent = "显示 " + shown + " / " + rows.length + " 条";
      if (empty) empty.hidden = shown > 0;
    }

    visBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.vis = b.getAttribute("data-vis");
        if (state.vis === "private") state.cluster = "all";
        sync(visBtns, "data-vis", state.vis);
        sync(cluBtns, "data-cluster", state.cluster);
        apply();
      });
    });

    cluBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.cluster = b.getAttribute("data-cluster");
        if (state.cluster !== "all") state.vis = "all";
        sync(cluBtns, "data-cluster", state.cluster);
        sync(visBtns, "data-vis", state.vis);
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value.trim().toLowerCase();
        apply();
      });
    }

    var btnTable = doc.getElementById("view-table");
    var btnGraph = doc.getElementById("view-graph");
    var stage = doc.getElementById("graph-stage");
    var wide = window.matchMedia("(min-width: 861px)");

    function setView(graph) {
      if (!stage || !btnTable || !btnGraph) return;
      stage.hidden = !graph;
      ledger.hidden = graph;
      btnGraph.setAttribute("aria-pressed", graph ? "true" : "false");
      btnTable.setAttribute("aria-pressed", graph ? "false" : "true");
      if (graph) {
        doc.dispatchEvent(new CustomEvent("dossier:graph"));
      }
    }

    if (btnGraph) {
      if (!wide.matches) {
        btnGraph.disabled = true;
        btnGraph.title = "关系图需要至少 861px 的视口宽度";
      }
      btnGraph.addEventListener("click", function () { if (!btnGraph.disabled) setView(true); });
    }
    if (btnTable) btnTable.addEventListener("click", function () { setView(false); });

    // 可直接分享的视图链接：projects/?view=graph
    var q = "";
    try { q = new URLSearchParams(window.location.search).get("view") || ""; } catch (err) {}
    if (q === "graph" && btnGraph && !btnGraph.disabled) setView(true);

    apply();
  }

  /* ── 11. 深链接：/projects/#<项目名> 展开对应条目 ───────── */
  function initDeepLink() {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (!id) return;
    var row = null;
    try {
      row = doc.querySelector('.lrow[data-name="' + id.replace(/["\\]/g, "") + '"]');
    } catch (e) {
      return;
    }
    if (!row) return;
    var btn = $(".lrow-btn", row);
    if (btn && btn.getAttribute("aria-expanded") !== "true") {
      btn.setAttribute("aria-expanded", "true");
      row.classList.add("open");
    }
    if (row.hidden) return;
    window.setTimeout(function () {
      row.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    }, 140);
  }

  function boot() {
    initReveal();
    initProgress();
    initScrollSpy();
    initLedger();
    initTabs();
    initTheme();
    initTicker();
    initPalette();
    initArchive();
    initDeepLink();
    initPointerAccent();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
