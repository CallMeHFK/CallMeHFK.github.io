/* ══════════════════════════════════════════════════════════
   PROJECT LAB — 动效引擎（原生 JS，零依赖）
   粒子星座 · 3D 倾斜 · 磁性按钮 · 打字机终端 · 滚动揭示 · 计数器
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // 保留观察器引用，防止被 GC 回收后回调不再触发
  var KEEP_ALIVE = (window.__PLAB_OBSERVERS = window.__PLAB_OBSERVERS || []);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function accentRGB() {
    var v = getComputedStyle(document.body).getPropertyValue("--p-rgb").trim();
    return v || "224,106,45";
  }

  /* ── 粒子星座 canvas ─────────────────────────────────── */
  function initParticles() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas || reduced) return;
    var ctx = canvas.getContext("2d");
    var W, H, DPR, particles = [], mouse = { x: -9e4, y: -9e4 };
    var rgb = accentRGB();
    var COUNT = Math.min(110, Math.floor(window.innerWidth / 12));
    var LINK = 130;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * (window.innerWidth),
        y: Math.random() * (window.innerHeight),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      });
    }

    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    });
    window.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9e4; });

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dpr = DPR;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        // 鼠标斥力
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var md = Math.sqrt(dx * dx + dy * dy);
        if (md < 130 && md > 0.01) {
          var f = (130 - md) / 130 * 0.6;
          p.vx += (dx / md) * f * 0.12;
          p.vy += (dy / md) * f * 0.12;
        }
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = window.innerWidth + 20;
        if (p.x > window.innerWidth + 20) p.x = -20;
        if (p.y < -20) p.y = window.innerHeight + 20;
        if (p.y > window.innerHeight + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb + ",0.55)";
        ctx.fill();
      }
      // 连线
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var ddx = particles[a].x - particles[b].x;
          var ddy = particles[a].y - particles[b].y;
          var d = ddx * ddx + ddy * ddy;
          if (d < LINK * LINK) {
            var o = (1 - Math.sqrt(d) / LINK) * 0.22;
            ctx.strokeStyle = "rgba(" + rgb + "," + o.toFixed(3) + ")";
            ctx.lineWidth = dpr * 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[a].x * dpr, particles[a].y * dpr);
            ctx.lineTo(particles[b].x * dpr, particles[b].y * dpr);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ── 滚动揭示（交错延迟） ────────────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    KEEP_ALIVE.push(io);
    els.forEach(function (el, i) {
      if (!el.style.getPropertyValue("--d")) {
        el.style.setProperty("--d", (i % 6) * 0.08 + "s");
      }
      io.observe(el);
    });
  }

  /* ── 3D 倾斜 + 眩光跟踪 ─────────────────────────────── */
  function initTilt() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".tilt").forEach(function (card) {
      var rect = null;
      card.addEventListener("pointerenter", function () {
        rect = card.getBoundingClientRect();
        card.style.transition = "transform 0.12s ease-out, border-color 0.35s ease";
      });
      card.addEventListener("pointermove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        var rx = (0.5 - y) * 9, ry = (x - 0.5) * 11;
        card.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" +
          ry.toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.35s ease";
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
        rect = null;
      });
    });
  }

  /* ── 磁性按钮 ───────────────────────────────────────── */
  function initMagnetic() {
    if (!finePointer || reduced) return;
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.22 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ── 打字机终端 ─────────────────────────────────────── */
  function initTyper() {
    var host = document.querySelector("[data-typer]");
    if (!host) return;
    var lines;
    try { lines = JSON.parse(host.getAttribute("data-typer")); }
    catch (e) { return; }
    if (reduced) {
      host.innerHTML = lines.map(function (l) {
        return '<span class="ln ' + (l.cls || "") + '">' + l.text + "</span>";
      }).join("");
      return;
    }
    var li = 0, ci = 0, out = "";
    var cursor = '<span class="caret"></span>';
    function step() {
      if (li >= lines.length) { host.innerHTML = out + cursor; return; }
      var line = lines[li];
      if (ci <= line.text.length) {
        var html = out +
          '<span class="ln ' + (line.cls || "") + '">' +
          line.text.slice(0, ci) + "</span>";
        host.innerHTML = html + cursor;
        ci++;
        setTimeout(step, line.speed || 34);
      } else {
        out += '<span class="ln ' + (line.cls || "") + '">' + line.text + "</span>";
        li++; ci = 0;
        setTimeout(step, line.pause || 320);
      }
    }
    // 进入视口才开始
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { step(); io.disconnect(); }
    }, { threshold: 0.3 });
    KEEP_ALIVE.push(io);
    io.observe(host);
  }

  /* ── 数字滚动 ───────────────────────────────────────── */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduced) { el.textContent = target + suffix; return; }
        var t0 = performance.now(), dur = 1400;
        (function frame(t) {
          var k = Math.min((t - t0) / dur, 1);
          var e = 1 - Math.pow(1 - k, 4);
          el.innerHTML = Math.round(target * e) +
            (suffix ? '<span class="suffix">' + suffix + "</span>" : "");
          if (k < 1) requestAnimationFrame(frame);
        })(t0);
      });
    }, { threshold: 0.4 });
    KEEP_ALIVE.push(io);
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ── 导航 + 进度条 + 光标 ────────────────────────────── */
  function initChrome() {
    var nav = document.querySelector(".nav");
    var prog = document.getElementById("progress");
    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle("scrolled", y > 40);
      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (finePointer && !reduced) {
      var glow = document.getElementById("cursor-glow");
      if (glow) {
        glow.classList.add("on");
        var gx = -999, gy = -999, tx = gx, ty = gy;
        window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; });
        (function follow() {
          gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
          glow.style.left = gx + "px"; glow.style.top = gy + "px";
          requestAnimationFrame(follow);
        })();
      }
    }
  }

  /* ── hero 视差 ──────────────────────────────────────── */
  function initParallax() {
    if (reduced) return;
    var hero = document.querySelector(".hero-inner");
    if (!hero) return;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        hero.style.transform = "translateY(" + y * 0.28 + "px)";
        hero.style.opacity = String(1 - (y / window.innerHeight) * 0.9);
      }
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initParticles();
    initReveal();
    initTilt();
    initMagnetic();
    initTyper();
    initCounters();
    initChrome();
    initParallax();
  });
})();
