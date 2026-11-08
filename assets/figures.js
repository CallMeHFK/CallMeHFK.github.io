/* ═══════════════════════════════════════════════════════════════
   CallMeHFK / DOSSIER — 图示层（three.js，本地 0.186）
   Fig.1  首页：结构示意图（发丝线框，装饰性，不承载数据）
   Graph  档案页：项目关系图（公开项目连线，未开源节点孤立不连线）
   全部动画在 prefers-reduced-motion / 离屏 / 标签页隐藏时停止或降级。
   ═══════════════════════════════════════════════════════════════ */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const painters = [];

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

function degrade() {
  const box = document.getElementById("fig-box");
  if (box) box.classList.add("no-gl");
  const fb = document.getElementById("graph-fallback");
  if (fb) fb.hidden = false;
}

function circle(radius, segments) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(radius * Math.cos(a), radius * Math.sin(a), 0);
  }
  return pts;
}

/* ── Fig.1 结构示意 ─────────────────────────────────────────── */
function initFigure(THREE, canvas) {
  const host = canvas.closest(".fig") || canvas.parentNode;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 24);
  camera.position.set(0, 0, 4.9);

  const root = new THREE.Group();
  root.rotation.x = -0.16;
  scene.add(root);

  const solid = new THREE.IcosahedronGeometry(1, 1);
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.34 });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(solid), lineMat);
  root.add(wire);

  const verts = solid.attributes.position.array;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
  const pMat = new THREE.PointsMaterial({ size: 0.036, transparent: true, opacity: 0.9, sizeAttenuation: true });
  root.add(new THREE.Points(pGeo, pMat));

  // 外圈轨道：技术制图里的辅助线
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(circle(1.62, 120)), 3));
  const ringMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.28 });
  const ring = new THREE.Line(ringGeo, ringMat);
  ring.rotation.x = 1.16;
  ring.rotation.y = 0.22;
  scene.add(ring);

  const tickGeo = new THREE.BufferGeometry();
  const ticks = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 1.68, r2 = i % 3 === 0 ? 1.78 : 1.72;
    ticks.push(r1 * Math.cos(a), r1 * Math.sin(a), 0, r2 * Math.cos(a), r2 * Math.sin(a), 0);
  }
  tickGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ticks), 3));
  const tickMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22 });
  const tickMarks = new THREE.LineSegments(tickGeo, tickMat);
  tickMarks.rotation.copy(ring.rotation);
  scene.add(tickMarks);

  painters.push(() => {
    lineMat.color.set(cssVar("--ink", "#15140f"));
    pMat.color.set(cssVar("--accent", "#b23a1b"));
    ringMat.color.set(cssVar("--ink-3", "#7b7465"));
    tickMat.color.set(cssVar("--ink-3", "#7b7465"));
  });

  function resize() {
    const w = canvas.clientWidth || (host ? host.clientWidth : 260);
    const h = canvas.clientHeight || 168;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (REDUCED) renderer.render(scene, camera);
  }

  let onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize, { passive: true });

  if (REDUCED) {
    resize();
    renderer.render(scene, camera);
    return;
  }

  const t0 = performance.now();
  (function tick() {
    window.requestAnimationFrame(tick);
    if (!onScreen || document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    root.rotation.y = t * 0.22;
    root.rotation.x = -0.16 + Math.sin(t * 0.34) * 0.07;
    ring.rotation.z = t * 0.06;
    tickMarks.rotation.z = t * 0.06;
    renderer.render(scene, camera);
  })();
}

/* ── 关系图 ─────────────────────────────────────────────────── */
function initGraph(THREE, canvas) {
  const stage = canvas.closest(".graph-stage");
  const ledger = document.getElementById("arc-ledger");
  if (!stage || !ledger) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  camera.position.set(0, 0, 5.15);

  const root = new THREE.Group();
  root.rotation.x = 0.16;
  scene.add(root);

  const CLUSTERS = [
    { key: "governance", label: "工具接缝", dir: [-0.66, 0.42, 0.62] },
    { key: "memory", label: "记忆接缝", dir: [0.58, 0.66, 0.08] },
    { key: "boundary", label: "网络接缝", dir: [0.78, -0.4, -0.3] },
    { key: "runtime", label: "会话接缝", dir: [-0.48, -0.62, -0.42] },
  ];

  const hubs = {};
  const hubGeo = new THREE.SphereGeometry(0.052, 16, 12);
  const clusterLabelEls = {};

  CLUSTERS.forEach((c) => {
    const len = Math.hypot(c.dir[0], c.dir[1], c.dir[2]) || 1;
    const pos = new THREE.Vector3(c.dir[0] / len, c.dir[1] / len, c.dir[2] / len).multiplyScalar(1.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(hubGeo, mat);
    mesh.position.copy(pos);
    root.add(mesh);
    hubs[c.key] = { pos, mesh, mat, label: c.label };

    const el = document.createElement("span");
    el.className = "graph-label cluster";
    el.textContent = c.label;
    stage.appendChild(el);
    clusterLabelEls[c.key] = el;
  });

  // 簇间关系线
  const hubLineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.18 });
  const hubPts = [];
  CLUSTERS.forEach((a, i) => {
    CLUSTERS.forEach((b, j) => {
      if (j <= i) return;
      const p = hubs[a.key].pos, q = hubs[b.key].pos;
      hubPts.push(p.x, p.y, p.z, q.x, q.y, q.z);
    });
  });
  const hubLineGeo = new THREE.BufferGeometry();
  hubLineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(hubPts), 3));
  root.add(new THREE.LineSegments(hubLineGeo, hubLineMat));

  // 从台账读取条目，保持单一数据源
  const rows = Array.from(ledger.querySelectorAll(".lrow"));
  const nodeGeo = new THREE.SphereGeometry(0.038, 14, 10);
  const ringGeo = new THREE.RingGeometry(0.042, 0.062, 20);
  const nodes = [];
  const edgePts = [];
  const counters = {};
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xcc4422 });
  const privateMat = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.26 });

  rows.forEach((row, index) => {
    const name = row.getAttribute("data-name") || "";
    const cluster = row.getAttribute("data-cluster");
    const isPrivate = row.getAttribute("data-vis") === "private";
    const link = row.querySelector(".lrow-desc .go");
    const href = link ? link.getAttribute("href") : "";

    if (isPrivate) {
      const a = (index / rows.length) * Math.PI * 2 + 0.6;
      const pos = new THREE.Vector3(Math.cos(a) * 2.15, 0.62 + Math.sin(a * 1.7) * 0.28, Math.sin(a) * 2.15);
      const mesh = new THREE.Mesh(ringGeo, privateMat);
      mesh.position.copy(pos);
      mesh.lookAt(camera.position);
      root.add(mesh);
      nodes.push({ mesh, name, href: "", isPrivate: true, base: 1 });
      return;
    }

    const hub = hubs[cluster];
    if (!hub) return;
    counters[cluster] = (counters[cluster] || 0) + 1;
    const n = counters[cluster];
    const phi = n * 2.399963;
    const rr = 0.46 + (n % 3) * 0.1;
    const pos = new THREE.Vector3(
      hub.pos.x + Math.cos(phi) * rr,
      hub.pos.y + Math.sin(phi * 1.3) * rr * 0.72,
      hub.pos.z + Math.sin(phi) * rr * 0.7
    );
    const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
    mesh.position.copy(pos);
    root.add(mesh);
    edgePts.push(hub.pos.x, hub.pos.y, hub.pos.z, pos.x, pos.y, pos.z);
    nodes.push({ mesh, name, href, isPrivate: false, base: 1 });
  });

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgePts), 3));
  root.add(new THREE.LineSegments(edgeGeo, edgeMat));

  const hoverEl = document.createElement("span");
  hoverEl.className = "graph-label";
  stage.appendChild(hoverEl);

  painters.push(() => {
    nodeMat.color.set(cssVar("--accent", "#b23a1b"));
    privateMat.color.set(cssVar("--ink-3", "#7b7465"));
    edgeMat.color.set(cssVar("--ink", "#15140f"));
    hubLineMat.color.set(cssVar("--ink-3", "#7b7465"));
    Object.keys(hubs).forEach((k) => hubs[k].mat.color.set(cssVar("--ink-2", "#443f35")));
  });

  let width = 0, height = 0;
  function resize() {
    width = canvas.clientWidth || stage.clientWidth;
    height = canvas.clientHeight || 420;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (REDUCED) renderer.render(scene, camera);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize, { passive: true });
  resize();

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-9, -9);
  let hovered = null;
  let dragging = false;
  let moved = 0;
  let last = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0 };

  function pick() {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(nodes.map((n) => n.mesh), false);
    return hits.length ? nodes.find((n) => n.mesh === hits[0].object) : null;
  }

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;

    if (dragging) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      root.rotation.y += dx * 0.0055;
      root.rotation.x = Math.max(-0.9, Math.min(0.9, root.rotation.x + dy * 0.004));
      velocity = { x: dx * 0.0055, y: dy * 0.004 };
      last = { x: e.clientX, y: e.clientY };
      return;
    }

    const hit = pick();
    if (hit !== hovered) {
      if (hovered) hovered.mesh.scale.setScalar(hovered.base);
      hovered = hit;
      if (hovered) hovered.mesh.scale.setScalar(1.9);
      canvas.style.cursor = hovered ? "pointer" : "";
    }
    if (hovered && !hovered.isPrivate) {
      hoverEl.textContent = hovered.name;
      hoverEl.classList.add("on");
    } else {
      hoverEl.classList.remove("on");
    }
  });

  canvas.addEventListener("pointerleave", () => {
    hoverEl.classList.remove("on");
    if (hovered) { hovered.mesh.scale.setScalar(hovered.base); hovered = null; }
    dragging = false;
    canvas.style.cursor = "";
  });

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    last = { x: e.clientX, y: e.clientY };
    velocity = { x: 0, y: 0 };
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 6) {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      const hit = pick();
      if (hit && hit.href) window.open(hit.href, "_blank", "noopener");
    }
    if (canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  });

  const v = new THREE.Vector3();
  function placeLabels() {
    if (!width || !height) return;
    Object.keys(hubs).forEach((k) => {
      const el = clusterLabelEls[k];
      const mesh = hubs[k].mesh;
      v.setFromMatrixPosition(mesh.matrixWorld).project(camera);
      if (v.z > 1) { el.style.opacity = "0"; return; }
      el.style.opacity = "";
      el.style.left = (v.x * 0.5 + 0.5) * width + "px";
      el.style.top = (-v.y * 0.5 + 0.5) * height + "px";
    });
    if (hovered) {
      v.setFromMatrixPosition(hovered.mesh.matrixWorld).project(camera);
      hoverEl.style.left = (v.x * 0.5 + 0.5) * width + "px";
      hoverEl.style.top = (-v.y * 0.5 + 0.5) * height + "px";
    }
  }

  let onScreen = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }

  void stage.offsetWidth;
  resize();

  if (REDUCED) {
    placeLabels();
    renderer.render(scene, camera);
    return;
  }

  (function tick() {
    window.requestAnimationFrame(tick);
    if (document.hidden) return;
    if (!onScreen) return;
    if (!dragging) {
      if (Math.abs(velocity.x) > 0.0004 || Math.abs(velocity.y) > 0.0004) {
        root.rotation.y += velocity.x;
        root.rotation.x = Math.max(-0.9, Math.min(0.9, root.rotation.x + velocity.y));
        velocity.x *= 0.94;
        velocity.y *= 0.94;
      } else {
        root.rotation.y += 0.0016;
      }
    }
    renderer.render(scene, camera);
    placeLabels();
  })();
}

/* ── 启动 ───────────────────────────────────────────────────── */
let graphStarted = false;
let graphWanted = false;
let graphStarter = null;

document.addEventListener("dossier:graph", () => {
  graphWanted = true;
  if (graphStarter) graphStarter();
});

async function boot() {
  const figCanvas = document.getElementById("fig-canvas");
  const graphCanvas = document.getElementById("graph-canvas");
  if (!figCanvas && !graphCanvas) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    degrade();
    return;
  }
  if (!hasWebGL()) {
    degrade();
    return;
  }

  if (figCanvas) {
    try {
      initFigure(THREE, figCanvas);
      painters.forEach((fn) => fn());
    } catch (e) { degrade(); }
  }

  graphStarter = () => {
    if (graphStarted || !graphCanvas) return;
    graphStarted = true;
    try {
      initGraph(THREE, graphCanvas);
      painters.forEach((fn) => fn());
    } catch (e) {
      degrade();
    }
  };

  if (graphWanted) graphStarter();
}

document.addEventListener("dossier:theme", () => painters.forEach((fn) => fn()));
boot();
