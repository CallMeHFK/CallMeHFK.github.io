/* ══════════════════════════════════════════════════════════
   PROJECT LAB — 3D 星座视图（three.js r186，本地 vendor，零构建）
   每个项目 = 一个发光节点，按主题分四簇；边表示真实的依赖或同一机制
   数据全部来自 .hub-grid 里的卡片 DOM，HTML 仍是唯一事实源
   簇名与成员数由 CLUSTERS 直接生成图例，不另立一份可漂移的副本
   ══════════════════════════════════════════════════════════ */
import * as THREE from "./vendor/three/186/three.module.min.js";

(function () {
  "use strict";

  var stage = document.getElementById("lab3d");
  var canvas = document.getElementById("lab3d-canvas");
  var labelLayer = document.getElementById("lab3d-labels");
  var grid = document.getElementById("grid");
  var btn3d = document.getElementById("view-3d");
  var btnList = document.getElementById("view-list");
  if (!stage || !canvas || !labelLayer || !grid || !btn3d || !btnList) return;

  // 保留观察器引用，防止被 GC 回收后回调不再触发
  var KEEP_ALIVE = (window.__PLAB_OBSERVERS = window.__PLAB_OBSERVERS || []);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STORE_KEY = "lab3d-view";

  function accentRGB() {
    var v = getComputedStyle(document.body).getPropertyValue("--p-rgb").trim();
    return v || "224,106,45";
  }

  function webglOK() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  /* ── 是否启用 3D：粗指针 + 宽屏 + WebGL 可用 ───────────── */
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var wide = window.innerWidth >= 900;
  var lowPower = !finePointer ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    window.innerWidth < 1200;

  if (!webglOK() || !finePointer || !wide) {
    stage.parentNode.removeChild(stage);
    btn3d.disabled = true;
    btnList.disabled = true;
    btn3d.title = "此设备未启用 3D（需要 WebGL + 桌面视口）";
    return;
  }

  /* ── 从现有卡片抓数据 ────────────────────────────────── */
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".hub-grid .proj"));
  if (!cards.length) return;

  /* 边 = 仓库自己声明的依赖，或两个仓库实现的同一个机制。
     不为了好看连边：每条都能指到一句文档。 */
  var EDGES = [
    ["dispatch-guard", "jev-kernel"],
    ["dispatch-guard", "agent-shepherd"],
    ["agent-task-callback", "agent-shepherd"],
    ["agent-task-callback", "dispatch-guard"],
    ["qwenpaw-openviking", "site-kg"],
    ["qwenpaw-consensus-rank", "site-kg"],
    ["qwenpaw-openviking", "qwenpaw-consensus-rank"],
    ["site-kg", "jev-kernel"],
    ["niclane", "sovereign-echo"],
    ["sovereign-echo", "dispatch-guard"],
    // tool seam 上的同一件事：调用前后插一道闸
    ["qwenpaw-secret-input", "dispatch-guard"],
    ["qwenpaw-secret-input", "jev-kernel"],
    // 「运行中途问人，答案回流给该 agent」的两种实现
    ["qwenpaw-secret-input", "agent-chatroom"],
    ["agent-task-callback", "agent-chatroom"],
    // 回复路由由策略层决定，不在 prompt 里
    ["agent-chatroom", "dispatch-guard"],
    // 文档语料 → 可旋转的 3D 引用网络，两代实现
    ["driveos-atlas", "site-kg"],
    // agent-chatroom 作为子项目住在 raspberry-pi 仓库里（其 README 子项目表明示）
    ["agent-chatroom", "raspberry-pi"],
    // 让包按预期的那条路出去：一个管网卡，一个管到家庭 LAN 的转发
    ["raspberry-pi", "niclane"]
  ];

  // 四簇：tool seam 治理 / 记忆与知识 / 边界与主权 / 运行时与端侧
  // 簇心在 x 上拉开、在 y 上压扁：舞台约 1.95:1，竖着摆会把两侧留白
  var CLUSTERS = [
    { name: "tool seam 治理", center: [-6.2, 1.15, 0.35], members: ["dispatch-guard", "jev-kernel", "agent-shepherd", "agent-task-callback", "qwenpaw-secret-input"], r: 2.25, squash: 0.62, phase: 0.4 },
    { name: "记忆与知识", center: [6.2, 0.95, -0.55], members: ["qwenpaw-openviking", "site-kg", "driveos-atlas", "qwenpaw-consensus-rank"], r: 2.0, squash: 0.6, phase: 1.9 },
    { name: "边界与主权", center: [-3.4, -2.7, 1.0], members: ["niclane", "sovereign-echo"], r: 1.45, squash: 0.5, phase: 0.9 },
    { name: "运行时与端侧", center: [3.4, -2.7, -0.85], members: ["agent-chatroom", "raspberry-pi"], r: 1.45, squash: 0.5, phase: 2.6 }
  ];

  var projects = cards.map(function (card) {
    var href = card.getAttribute("href") || "";
    var slug = href.replace(/\/$/, "").split("/").pop();
    var name = (card.querySelector(".pname") || {}).textContent || slug;
    var rgb = (card.style.getPropertyValue("--c-rgb") || "224,106,45").trim();
    var tags = Array.prototype.slice.call(card.querySelectorAll(".pmeta .tagx"))
      .map(function (t) { return t.textContent.trim(); }).join(" · ");
    return {
      slug: slug, name: name.trim(), href: href, rgb: rgb,
      sub: tags, color: new THREE.Color().setStyle("rgb(" + rgb + ")", THREE.SRGBColorSpace)
    };
  });

  var bySlug = {};
  projects.forEach(function (p) { bySlug[p.slug] = p; });

  /* ── 图例：直接从 CLUSTERS 生成，不另存一份会漂移的副本 ── */
  (function buildLegend() {
    var old = document.getElementById("lab3d-legend");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var box = document.createElement("div");
    box.className = "lab3d-legend";
    box.id = "lab3d-legend";
    var cap = document.createElement("div");
    cap.className = "lg-cap";
    cap.textContent = "四簇 · " + projects.length + " 节点 · " + EDGES.length + " 边";
    box.appendChild(cap);
    CLUSTERS.forEach(function (cl) {
      var present = cl.members.filter(function (m) { return bySlug[m]; });
      if (!present.length) return;
      var row = document.createElement("div");
      row.className = "lg-row";
      var t = document.createElement("span");
      t.className = "lg-name";
      t.textContent = cl.name;
      var n = document.createElement("b");
      n.textContent = present.length;
      row.appendChild(t); row.appendChild(n);
      box.appendChild(row);
    });
    stage.appendChild(box);
  })();

  /* ── 布局：簇心 + 局部椭圆轨道 ────────────────────────── */
  projects.forEach(function (p) {
    for (var c = 0; c < CLUSTERS.length; c++) {
      var cl = CLUSTERS[c];
      var i = cl.members.indexOf(p.slug);
      if (i < 0) continue;
      var n = cl.members.length;
      var a = (i / n) * Math.PI * 2 + cl.phase;
      p.pos = new THREE.Vector3(
        cl.center[0] + Math.cos(a) * cl.r,
        cl.center[1] + Math.sin(a) * cl.r * cl.squash,
        cl.center[2] + Math.sin(a) * cl.r * 0.5 - i * 0.35
      );
      return;
    }
    p.pos = new THREE.Vector3(
      (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 6
    );
  });

  /* ── 场景 ────────────────────────────────────────────── */
  var renderer, scene, camera, nodeGroup, dust, packets, edgeLines, edgeHi, raycaster;
  var nodes = [], edgeList = [], packetData = [];
  var v3 = new THREE.Vector3(), v3b = new THREE.Vector3();
  var running = false, visible = true, active = false;
  var hovered = -1;
  var yawT = 0, pitchT = 0, yaw = 0, pitch = 0, dist = 12.8;
  var pointerNDC = new THREE.Vector2(-2, -2);
  var pointerIn = false, dragging = false, dragMoved = 0, lastX = 0, lastY = 0;
  var touchSelected = -1;
  var clock = null;

  function initOnce() {
    if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: !lowPower, powerPreference: "high-performance"
      });
    } catch (e) { return false; }
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.75));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);

    nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    // 光晕贴图（一次生成，按节点着色）
    var haloCanvas = document.createElement("canvas");
    haloCanvas.width = haloCanvas.height = 128;
    var hctx = haloCanvas.getContext("2d");
    var grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.32)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 128, 128);
    var haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;

    var coreGeo = new THREE.IcosahedronGeometry(0.34, 1);
    var shellGeo = new THREE.IcosahedronGeometry(0.66, 1);

    projects.forEach(function (p, idx) {
      var g = new THREE.Group();
      g.position.copy(p.pos);
      nodeGroup.add(g);

      var core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({
        color: p.color, transparent: true, opacity: 0.95
      }));
      var shell = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({
        color: p.color, wireframe: true, transparent: true, opacity: 0.32
      }));
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTex, color: p.color, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.scale.setScalar(2.6);
      g.add(core); g.add(shell); g.add(halo);

      // HTML 投影标签：真链接，可键盘 focus、可被抓取
      var label = document.createElement("a");
      label.className = "lab3d-label";
      label.href = p.href;
      label.innerHTML = '<span class="lname"></span><span class="lsub"></span>';
      label.querySelector(".lname").textContent = p.name;
      label.querySelector(".lsub").textContent = p.sub;
      labelLayer.appendChild(label);

      var node = {
        p: p, group: g, core: core, shell: shell, halo: halo,
        label: label, index: idx, phase: Math.random() * Math.PI * 2, scale: 1
      };
      core.userData.node = node; shell.userData.node = node; halo.userData.node = node;
      nodes.push(node);
    });

    // 边（普通态）
    var pts = [];
    EDGES.forEach(function (pair) {
      var a = bySlug[pair[0]], b = bySlug[pair[1]];
      if (!a || !b) return;
      pts.push(a.pos.x, a.pos.y, a.pos.z, b.pos.x, b.pos.y, b.pos.z);
      edgeList.push([a, b]);
    });
    var edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    edgeLines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
      color: new THREE.Color().setStyle("rgb(" + accentRGB() + ")", THREE.SRGBColorSpace),
      transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    nodeGroup.add(edgeLines);

    // 边（高亮态：只画 hover 节点相连的边）
    var hiGeo = new THREE.BufferGeometry();
    hiGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(EDGES.length * 6), 3));
    hiGeo.setDrawRange(0, 0);
    edgeHi = new THREE.LineSegments(hiGeo, new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    nodeGroup.add(edgeHi);

    // 沿边流动的数据包
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(edgeList.length * 3), 3));
    packets = new THREE.Points(pg, new THREE.PointsMaterial({
      size: lowPower ? 0.16 : 0.2, sizeAttenuation: true, color: 0xffffff,
      transparent: true, opacity: lowPower ? 0.0 : 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    nodeGroup.add(packets);
    edgeList.forEach(function (e, i) { packetData.push({ off: Math.random(), speed: 0.12 + (i % 5) * 0.035 }); });

    // 尘埃
    var dustCount = lowPower ? 260 : 900;
    var dp = new Float32Array(dustCount * 3);
    for (var i = 0; i < dustCount; i++) {
      var r = 7 + Math.random() * 16;
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      dp[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
      dp[i * 3 + 2] = r * Math.cos(ph) * 0.7;
    }
    var dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
    dust = new THREE.Points(dg, new THREE.PointsMaterial({
      size: 0.045, sizeAttenuation: true,
      color: new THREE.Color().setStyle("rgb(" + accentRGB() + ")", THREE.SRGBColorSpace),
      transparent: true, opacity: 0.5, depthWrite: false
    }));
    scene.add(dust);

    raycaster = new THREE.Raycaster();
    clock = new THREE.Clock();

    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
    canvas.addEventListener("webglcontextrestored", function () { if (active) start(); });

    resize();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { if (active) resize(); });
      KEEP_ALIVE.push(ro);
      ro.observe(stage);
    } else {
      window.addEventListener("resize", function () { if (active) resize(); });
    }
    return true;
  }

  function resize() {
    if (!renderer) return;
    var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── 交互 ────────────────────────────────────────────── */
  function bindPointer() {
    canvas.addEventListener("pointerenter", function () { pointerIn = true; });
    canvas.addEventListener("pointerleave", function () {
      pointerIn = false; setHover(-1);
      dragging = false;
    });
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; dragMoved = 0; lastX = e.clientX; lastY = e.clientY;
      if (canvas.setPointerCapture && e.pointerId != null) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (dragging) {
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        yawT += dx * 0.005;
        pitchT = Math.max(-0.62, Math.min(0.62, pitchT + dy * 0.004));
        canvas.classList.add("grabbing");
      }
      if (reduced) { setHover(hitNode()); draw(); }
    });
    canvas.addEventListener("pointerup", function () {
      dragging = false;
      canvas.classList.remove("grabbing");
    });
    canvas.addEventListener("click", function () {
      if (dragMoved > 6) return;
      var idx = touchSelected >= 0 ? touchSelected : hovered;
      if (idx >= 0) window.location.href = nodes[idx].p.href;
    });
    // 聚焦键盘可达：左右/上下转视角，Enter 打开当前选中
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "application");
    canvas.setAttribute("aria-label", "项目 3D 星座视图，拖拽或用方向键旋转；列表视图在下方按钮切换");
    canvas.addEventListener("keydown", function (e) {
      var step = 0.08;
      if (e.key === "Tab") { if (reduced) { cycleSelect(e.shiftKey ? -1 : 1); } e.preventDefault(); return; }
      if (e.key === "ArrowLeft") { yawT -= step; }
      else if (e.key === "ArrowRight") { yawT += step; }
      else if (e.key === "ArrowUp") { pitchT = Math.max(-0.62, pitchT - step); }
      else if (e.key === "ArrowDown") { pitchT = Math.min(0.62, pitchT + step); }
      else if (e.key === "Enter" && touchSelected >= 0) { window.location.href = nodes[touchSelected].p.href; }
      else return;
      e.preventDefault();
      if (reduced) draw();
    });
  }

  function cycleSelect(dir) {
    touchSelected = (touchSelected + dir + nodes.length) % nodes.length;
    setHover(touchSelected);
    if (reduced) draw();
  }

  function hitNode() {
    if (!pointerIn || !raycaster) return -1;
    raycaster.setFromCamera(pointerNDC, camera);
    var targets = [];
    nodes.forEach(function (n) { targets.push(n.core, n.shell); });
    var hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return -1;
    var owner = hits[0].object.userData.node;
    return owner ? owner.index : -1;
  }

  function setHover(idx) {
    if (idx === hovered) return;
    hovered = idx;
    nodes.forEach(function (n) {
      var on = n.index === idx;
      n.label.classList.toggle("on", on);
      n.targetScale = on ? 1.38 : 1;
      n.targetHalo = on ? 1.0 : 0.4;
      n.targetShell = on ? 0.75 : 0.32;
    });
    updateHighlight();
    if (idx >= 0) touchSelected = idx;
  }

  function updateHighlight() {
    if (!edgeHi) return;
    var arr = edgeHi.geometry.attributes.position.array;
    var k = 0;
    if (hovered >= 0) {
      var p = nodes[hovered].p;
      edgeList.forEach(function (e) {
        if (e[0].slug !== p.slug && e[1].slug !== p.slug) return;
        arr[k++] = e[0].pos.x; arr[k++] = e[0].pos.y; arr[k++] = e[0].pos.z;
        arr[k++] = e[1].pos.x; arr[k++] = e[1].pos.y; arr[k++] = e[1].pos.z;
      });
    }
    edgeHi.geometry.setDrawRange(0, k / 3);
    edgeHi.geometry.attributes.position.needsUpdate = true;
  }

  function updateLabels() {
    var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      v3.copy(n.p.pos);
      nodeGroup.localToWorld(v3);
      v3.project(camera);
      var behind = v3.z > 1;
      var x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h;
      n.label.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) translate(-50%,calc(-100% - 16px))";
      n.label.style.opacity = behind ? "0" : String((0.55 + (1 - Math.min(v3.z, 1)) * 0.45).toFixed(2));
      n.label.style.zIndex = String(Math.round((1 - Math.min(Math.max(v3.z, 0), 1)) * 100));
      n.label.style.pointerEvents = behind ? "none" : "auto";
    }
  }

  /* ── 渲染 ────────────────────────────────────────────── */
  function animate(t) {
    var dt = Math.min(clock.getDelta(), 0.05);

    // 相机绕原点：yaw 转方位，pitch 抬升（均带阻尼）
    yaw += (yawT - yaw) * 0.08;
    pitch += (pitchT - pitch) * 0.08;
    if (!reduced && !dragging) nodeGroup.rotation.y += dt * 0.06;
    nodeGroup.rotation.x = pitch * 0.45;
    camera.position.set(
      Math.sin(yaw) * dist * Math.cos(pitch * 0.6),
      Math.sin(pitch) * dist * 0.75,
      Math.cos(yaw) * dist * Math.cos(pitch * 0.6)
    );
    camera.lookAt(0, 0, 0);

    if (dust) dust.rotation.y += dt * 0.012;

    // 节点呼吸 + hover 缓动
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.targetScale == null) { n.targetScale = 1; n.targetHalo = 0.4; n.targetShell = 0.32; }
      var breathe = reduced ? 1 : 1 + Math.sin(t * 0.0011 + n.phase) * 0.05;
      n.scale += ((n.targetScale * breathe) - n.scale) * 0.12;
      n.group.scale.setScalar(n.scale);
      n.halo.material.opacity += (n.targetHalo - n.halo.material.opacity) * 0.12;
      n.shell.material.opacity += (n.targetShell - n.shell.material.opacity) * 0.12;
      if (!reduced) {
        n.core.rotation.y += dt * 0.5;
        n.shell.rotation.y -= dt * 0.22;
        n.shell.rotation.x += dt * 0.12;
      }
    }

    // 数据包沿边流动
    if (packets && edgeList.length) {
      var arr = packets.geometry.attributes.position.array;
      for (var e = 0; e < edgeList.length; e++) {
        var d = packetData[e];
        d.off = (d.off + dt * d.speed) % 1;
        v3b.copy(edgeList[e][0].pos).lerp(edgeList[e][1].pos, d.off);
        arr[e * 3] = v3b.x; arr[e * 3 + 1] = v3b.y; arr[e * 3 + 2] = v3b.z;
      }
      packets.geometry.attributes.position.needsUpdate = true;
    }

    updateLabels();
    renderer.render(scene, camera);
  }

  function draw() {
    if (!renderer) return;
    renderer.setAnimationLoop(null);
    clock.getDelta();
    animate(performance.now());
    updateLabels();
    renderer.render(scene, camera);
  }

  function loop(t) {
    setHover(hitNode());
    animate(t);
  }

  function start() {
    if (!renderer || running) return;
    if (reduced) { draw(); return; }
    running = true;
    renderer.setAnimationLoop(loop);
  }

  function stop() {
    if (!renderer) return;
    renderer.setAnimationLoop(null);
    running = false;
  }

  /* ── 视图切换 ────────────────────────────────────────── */
  function setView(view, persist) {
    active = view === "3d";
    grid.classList.toggle("lab3d-active", active);
    document.body.classList.toggle("lab3d-on", active);
    btn3d.setAttribute("aria-pressed", String(active));
    btnList.setAttribute("aria-pressed", String(!active));
    if (active) {
      if (!initOnce()) { setView("list", false); return; }
      resize(); start();
    } else {
      setHover(-1);
      stop();
    }
    if (persist) {
      try { window.localStorage.setItem(STORE_KEY, view); } catch (e) { /* noop */ }
    }
  }

  btn3d.addEventListener("click", function () { if (!btn3d.disabled) setView("3d", true); });
  btnList.addEventListener("click", function () { setView("list", true); });

  /* ── 可见性：离屏或切标签页就停 ───────────────────────── */
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (!active || reduced) return;
    if (visible && !document.hidden) start(); else stop();
  }, { threshold: 0.01 });
  KEEP_ALIVE.push(io);
  io.observe(stage);

  document.addEventListener("visibilitychange", function () {
    if (!active || reduced) return;
    if (document.hidden) stop(); else if (visible) start();
  });

  bindPointer();

  /* ── 初始视图 ────────────────────────────────────────── */
  var stored = null;
  try { stored = window.localStorage.getItem(STORE_KEY); } catch (e) { /* noop */ }
  setView(stored === "list" ? "list" : "3d", false);
})();
