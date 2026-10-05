<div align="center">

<img src="assets/terminal-header.svg" alt="whoami" width="760">

<br>

**`CallMeHFK`** · UTC+8

### Agent 系统工程师 —— 让多智能体有过程监督、有质量门控，并能下到驱动与固件层

> **5** 个自建 Agent 插件（HEAD 提交 CI 全绿） · **2** 个上游 PR 已合并 + **3** 个待审 · **200** 个已安装 Skill 的蒸馏与评分闭环

</div>

---

## 代表作

### [agent-shepherd](https://github.com/CallMeHFK/agent-shepherd) — 智能体过程监督插件

观测 QwenPaw / Claude Code / Codex 的推理与工具调用，偏航时注入纠正。

- 两层策略：Tier 0 确定性检测器（循环、回归、越权编辑、binding drift、context rot、CUSUM 漂移告警），Tier 1 PRM 式 LLM 打分器——只在自然检查点、或 CUSUM 逼近告警线时唤醒，健康的 agent 不浪费裁判
- 阈值不靠拍：漂移告警由蒙特卡洛仿真标定到**会话级**误报预算，判定阈值由 conformal risk control 按实测结果再拟合；工具结局先按结构化证据三态分类（failed / ok / unknown），所以 `grep error logs/` 不会被当成失败
- `shepherd eval` 是离线反事实基准：单点注入故障，报每个检测器的精确率、召回、检测延迟与监督成本——先回答"到底有没有用"，再回答"准不准"

161 项测试 · 9,483 行 Python · v0.2.1

### [dispatch-guard](https://github.com/CallMeHFK/dispatch-guard) — 编排 Agent 的输出路由中间件

把派发约束从 system prompt 挪进工具接缝：编排者想自己落交付物时直接 deny，并把「该派给谁」回给它。

- 三条拦截规则各有明确边界：写入按交付物目录/扩展名 + 白名单判定；shell 侧默认只 warn，开 `shell_enforce` 才堵重定向旁路；`spawn_subagent` 作为配置层关停之外的兜底——**读操作与基础文件读写永不拦截**
- 路由表 `routes.json` 按文件 mtime 热切，加载时自审矛盾规则、死规则、未知 mode；新装先从各 agent 声明的派发策略草拟一份 warn 模式草稿
- 纯标准库、零 pip 依赖、无遥测

65 项测试 · 2,294 行 Python · v0.1.7 · release 一行安装

### [qwenpaw-openviking](https://github.com/CallMeHFK/qwenpaw-openviking) — 长期语义记忆接入插件

把 [OpenViking](https://github.com/volcengine/OpenViking)（Volcengine 的 Agent 长期语义记忆引擎）上游那套 Node.js stdio MCP 代理移植成 QwenPaw 原生插件。

- 纯 Python：不起 Node 运行时、零第三方依赖；注册 7 个原生工具 + 5 个 Skill，教 agent 走 recall → work → persist 闭环
- 全部 fail-open：服务挂了只降级成告警，不弄坏宿主；工具包装从不把异常抛进运行时，认证失败、超时、不可达一律回结构化错误串交给模型自己处置

40 项测试 · 1,594 行 Python · v0.1.0

---

## 其余项目

- [site-kg](https://github.com/CallMeHFK/site-kg) — 站点 URL → 知识图谱 → MCP。边只从语料推，没有交叉引用就判 `NOT-READY`，不画装饰性线团。12 项测试 / 1,418 行
- [qwenpaw-consensus-rank](https://github.com/CallMeHFK/qwenpaw-consensus-rank) — 多评审 LLM 共识排序：匿名化候选独立打分 → Borda 聚合 + Spearman 与位置稳定性报告。119 项测试 / ⭐2
- [agent-task-callback](https://github.com/CallMeHFK/agent-task-callback) — 补上 QwenPaw `submit_to_agent` 缺的 push 侧：常驻 watcher 轮询子任务，完成后把结果作为新一轮投递回注册方会话。16 项测试 / v0.1.3
- **game-input-mcp** — 游戏输入自动化 MCP Server（stdio）：屏幕截图、精确按压时长、可编排序列，面向低延迟输入注入
- **Audio Driver** — Windows capture APO（WDK `CBaseAudioProcessingObject` + ATL）：AEC 双级链，16k 回声消除 → 因果流式降噪，CPU 用户态 ~0.5% 单核、无需 DSP/NPU
- **ScheduleCopilot** — AgentScope Agent Team 排期风险识别：Leader 编排 6 类 Worker，配 10 个领域 Skill 与多租户隔离
- **ATPO**（[arXiv:2603.02216](https://arxiv.org/abs/2603.02216)） — 精读该树搜索 RL 并走读 VeRL 实现，把「不确定性驱动 rollout 预算分配」迁移进自建 Agent 系统

**上游贡献**是同一条主线：同一套 Skill 不改内容，换清单与路由即可落到 QwenPaw / Claude Code / Codex / Cursor / Qoder / ZCode。已合并 [sepia PR #250](https://github.com/Nanako0129/sepia/pull/250)（2026-09-17，+318/−25，`.qwenpaw-plugin/` 原生插件包）与 [nacos PR #12127](https://github.com/alibaba/nacos/pull/12127)（2024-06-03，Python services sample）；待审 [ResearchStudio #60](https://github.com/microsoft/ResearchStudio/pull/60) · [SemaPLC #6](https://github.com/midea-ai/SemaPLC/pull/6) · [text-to-cad #429](https://github.com/earthtojake/text-to-cad/pull/429)。

---

## 能力与栈

- **第三方宿主接入** — 让同一套 Skill / 插件在六种宿主上跑起来：换清单与路由、不改技能本体。两个上游已合并、三个待审
- **Agent 过程监督与路由约束** — 两层策略引擎（确定性检测 + PRM 式 LLM 判定）与工具接缝层的写入拦截；阈值靠蒙特卡洛与 conformal risk control 标定，用反事实基准验证是否真的有用
- **Agent Skill 工程** — 安装、蒸馏、评分（SkillLens 9 维）、门控优化全链路；200 个已安装 Skill

  <img src="assets/skill-loop.png" alt="Agent Skill 生态闭环：安装 → 运行 → 蒸馏 → 评分（SkillLens 9 维），再由 SkillOpt 门控优化回到安装" width="760">

- **系统级与底层** — Windows APO 驱动全流程（官方 COM 契约 → 构建签名 → 测试机部署 → 验收交付）；Renode 周期精确在环，裸机 Cortex-M4F 固件与 float32 参考实现逐位对齐，仿真器没实现的计数器用差分采样反推
- **数据与校准** — 参数与方案选型按统计口径评估（EMA 回流、ECE、CUSUM、CRC），碰物理上限立即转向

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
