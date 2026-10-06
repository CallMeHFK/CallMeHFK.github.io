<div align="center">

<img src="assets/terminal-header.svg" alt="whoami" width="760">

<br>

**`CallMeHFK`** · UTC+8

### Agent 系统工程师 · 过程监督 / 输出路由 / 技能质量

> **5** 个自建 Agent 插件（HEAD CI 全绿） · 上游 PR **2** merged / **3** open · **200** 个已安装 Skill

</div>

---

## 代表作

### [agent-shepherd](https://github.com/CallMeHFK/agent-shepherd) — 智能体过程监督插件

观测 QwenPaw / Claude Code / Codex 的 reasoning 与 tool call 流，偏航时注入纠正。

- Tier 0 确定性检测器：loop、regression、越权编辑、binding drift、context rot，加一路 CUSUM 漂移告警。Tier 1 是 PRM 式 LLM 判定，只在 natural checkpoint 或 CUSUM 逼近告警线时唤醒，常态会话零裁判开销。
- 漂移阈值由蒙特卡洛仿真标定到会话级 FP 预算，判定阈值再由 conformal risk control 按实测结果拟合。工具结局先做结构化证据三态分类（failed / ok / unknown），错误串文法只当 fallback，`grep error logs/` 型误报进不了判定。
- `shepherd eval`：离线反事实基准，单点注故障，按检测器报 precision / recall / detection latency / supervision cost。CI 里以 `--fail-under-f1 0.8` 当门。

169 项测试 · 9,483 行 Python（含测试） · v0.2.1

### [dispatch-guard](https://github.com/CallMeHFK/dispatch-guard) — 编排 Agent 的输出路由中间件

把派发约束从 system prompt 移到 tool seam：`on_acting` 拦截交付物形状的写入并 deny，回填该派给谁。

- 写入判定按交付物目录 / 扩展名 + 白名单。shell 侧默认 warn，`shell_enforce` 才堵重定向旁路。`spawn_subagent` 是 config 层关停之外的兜底 deny。读与基础文件 IO 不拦。
- `routes.json` 按 mtime 热加载，load 时做规则自审：矛盾规则、死规则、未知 mode。无配置时从各 agent 在 `agent.json` 里声明的派发策略草拟 `routes.draft.json`（warn 模式），改名才生效。
- 纯标准库，零 pip 依赖，插件运行时不联网。

65 项测试 · 2,294 行 Python（含测试） · v0.1.7 · release 一行安装

### [qwenpaw-openviking](https://github.com/CallMeHFK/qwenpaw-openviking) — 长期语义记忆接入插件

把 [OpenViking](https://github.com/volcengine/OpenViking) 上游那套 Node.js stdio MCP 代理移植成 QwenPaw 原生插件：纯 Python，不起 Node 运行时，`dependencies: []`。

- 7 个原生工具（find / search / read / remember / write / add_skill / health）+ 5 个 Skill，Skill 侧教 agent 走 recall → work → persist。
- hook 与工具包装一律 fail-open：认证失败、超时、不可达返回结构化错误串给模型处置，异常不进 runtime；记忆服务挂掉降级成告警，宿主照常跑。

40 项测试 · 1,594 行 Python（含测试） · v0.1.0

---

## 其余项目

- [site-kg](https://github.com/CallMeHFK/site-kg) — 站点 URL → 知识图谱 → MCP。清单探测按 `objects.inv` → `navtreeindex0.js` → `sitemap.xml` → 同源 BFS 降级；边只从语料链接推，零可解析边判 `NOT-READY`；结构层不需要 LLM，语义层配了 key 才挂。12 项测试 / 1,418 行
- [qwenpaw-consensus-rank](https://github.com/CallMeHFK/qwenpaw-consensus-rank) — 跨家族评审独立打分（候选匿名化，各评审一套 candidate→letter 映射），mean-rank 出共识，报 per-judge Spearman ρ、评审间 pairwise ρ 与位置稳定性。119 项测试 / ⭐2
- [agent-task-callback](https://github.com/CallMeHFK/agent-task-callback) — 补 QwenPaw `submit_to_agent` 缺的 push 侧：常驻 watcher 轮询子任务，完成后把结果作为新一轮投递回注册方会话。含僵尸任务回收测试。16 项测试 / v0.1.3
- **GameForge MCP Server**（闭源）— 截屏与鼠标键盘注入的 MCP 工具集，stdio / HTTP / SSE 三种 transport，`mouse_click` 与 `key_press` 带 duration 参数
- **Windows capture APO**（闭源）— WDK `CBaseAudioProcessingObject` + ATL，iic JAEC 回声消除后接自研因果流式降噪核（DD-Wiener / MCRA，无前瞻）；audiodg 内 CPU 用户态实时运行，不经 DSP/NPU offload
- **ScheduleCopilot**（闭源）— AgentScope Agent Team：Leader 编排多类 Worker，配领域 Skill、长期记忆中间件与多租户隔离
- ATPO（[arXiv:2603.02216](https://arxiv.org/abs/2603.02216)）— 走读其 VeRL 实现；不确定性驱动的 rollout 预算分配用进了自己的采集门控与路由分档

上游 PR 是同一件事：Skill 内容不动，只改 manifest 与路由，把同一批 Skill 装进 QwenPaw / Claude Code / Codex / Cursor / Qoder / ZCode。merged：[sepia #250](https://github.com/Nanako0129/sepia/pull/250)（2026-09-17，+318/−25，`.qwenpaw-plugin/` 插件包 + `/sepia` 斜杠命令）、[nacos #12127](https://github.com/alibaba/nacos/pull/12127)（2024-06-03，Python services sample）。open：[ResearchStudio #60](https://github.com/microsoft/ResearchStudio/pull/60)、[SemaPLC #6](https://github.com/midea-ai/SemaPLC/pull/6)、[text-to-cad #429](https://github.com/earthtojake/text-to-cad/pull/429)。

---

## 能力与栈

两条线。Agent 侧：宿主接入（换 manifest 与路由，不动 Skill 内容）、过程监督与输出路由（两层检测 + 统计标定阈值 + 反事实基准）、技能质量（200 个已安装 Skill，9 维评分与门控优化，评分口径参照 SkillLens 的实证基线）。

系统侧：Windows APO 驱动从官方 COM 契约走到构建签名、测试机部署与验收；嵌入式用 Renode 跑周期精确在环，裸机 Cortex-M4F 固件与 float32 参考实现逐位对齐，仿真器没实现的计数器靠差分采样反推。

<img src="assets/skill-loop.png" alt="Agent Skill 生态闭环：安装 → 运行 → 蒸馏 → 评分（SkillLens 9 维），再由 SkillOpt 门控优化回到安装" width="760">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![C](https://img.shields.io/badge/C-00599C?logo=c&logoColor=white&style=flat-square)
![C++ · ATL](https://img.shields.io/badge/C%2B%2B%20·%20ATL-00599C?logo=cplusplus&logoColor=white&style=flat-square)
![WDK · APO](https://img.shields.io/badge/WDK%20·%20APO-0078D4?logo=windows&logoColor=white&style=flat-square)
![Renode](https://img.shields.io/badge/Renode-5A6B7B?style=flat-square)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black&style=flat-square)
![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white&style=flat-square)
![AgentScope · QwenPaw](https://img.shields.io/badge/AgentScope%20·%20QwenPaw-E06A2D?style=flat-square)
![MCP](https://img.shields.io/badge/MCP-6E7F80?style=flat-square)

---

## 运行原则

用数据与事实做决策，不用感觉。先盘点再行动，确认了快速推进。质量是底线，效率是目标。

<img src="assets/decision-boundary.png" alt="决策边界：参数调优触及物理上限即立即转向；回路由建立基线、改进、对比基线构成" width="760">

```console
CallMeHFK:~$ cat principles.txt
[0] 先盘点，再行动      建立基线 → 改进 → 对比基线，不盲目启动
[1] 数据驱动不迷信      源码 > 配置 > 运行态；禁止口算，工具算完再输出
[2] 逐字保真            源数据神圣不可改；可加标注，禁止「优化」改写
[3] 物理极限即边界      参数调优空间可迭代，碰物理上限立即转向，不死磕
[4] 诚实纠错            新数据推翻旧结论 → 明确记录「上一轮我说 X 是错误的」
[5] 工具链即基础设施    按任务安装不膨胀；必须有退路，否则不上
```

---

<div align="center">

*「写得进去的部分，已经足够强大。」—— 但做不出来，比说不清楚更致命。*

</div>
