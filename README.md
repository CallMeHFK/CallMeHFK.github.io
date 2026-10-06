<div align="center">

<img src="assets/terminal-header.svg" alt="whoami" width="760">

<br>

**`CallMeHFK`** · UTC+8

### Agent 系统工程师：过程监督、输出路由、技能质量

> **5** 个自建 Agent 插件（HEAD 提交 CI 全绿） · **2** 个上游 PR 已合并，**3** 个在审 · **200** 个已安装 Skill

</div>

---

## 代表作

### [agent-shepherd](https://github.com/CallMeHFK/agent-shepherd) — 智能体过程监督插件

观测 QwenPaw / Claude Code / Codex 的推理与工具调用，agent 偏航时注入纠正。

- Tier 0 是确定性检测器：循环、回归、越权编辑、binding drift、context rot，再加一路 CUSUM 漂移告警。Tier 1 才动用 LLM 打分器，触发条件是自然检查点，或者 CUSUM 逼近告警线；多数会话只跑 Tier 0，裁判不调用。
- 漂移阈值用蒙特卡洛仿真标定到会话级误报预算，判定阈值再由 conformal risk control 按实测结果拟合。工具结局先按结构化证据分成 failed / ok / unknown，所以 `grep error logs/` 匹配到的正常调用不会被判成失败。
- `shepherd eval` 是离线反事实基准：注入单个故障，输出每个检测器的精确率、召回、检测延迟和监督成本。

169 项测试 · 9,483 行 Python（含测试） · v0.2.1

### [dispatch-guard](https://github.com/CallMeHFK/dispatch-guard) — 编排 Agent 的输出路由中间件

把派发约束从 system prompt 挪到工具接缝：编排者想自己写交付物时直接 deny，并把该派给谁回给它。

- 写入按交付物目录和扩展名加白名单判定。shell 侧默认只 warn，开了 `shell_enforce` 才堵重定向旁路。`spawn_subagent` 是配置层关停之外的兜底。读操作和基础文件读写不拦。
- 路由表 `routes.json` 按文件 mtime 热切，加载时自审矛盾规则、死规则和未知 mode。首次安装没有配置时，从各 agent 在 `agent.json` 里声明的派发策略草拟一份 warn 模式的 `routes.draft.json`，改名才生效。
- 只用标准库，无 pip 依赖，不联网。

65 项测试 · 2,294 行 Python（含测试） · v0.1.7 · release 一行安装

### [qwenpaw-openviking](https://github.com/CallMeHFK/qwenpaw-openviking) — 长期语义记忆接入插件

把 [OpenViking](https://github.com/volcengine/OpenViking)（Volcengine 的 Agent 长期语义记忆引擎）上游的 Node.js stdio MCP 代理移植成 QwenPaw 原生插件。

- 纯 Python，不起 Node 运行时，零第三方依赖。7 个原生工具加 5 个 Skill，Skill 教 agent 先 recall、再干活、最后 persist。
- 服务不可达、认证失败、超时都返回结构化错误串交给模型处置。startup / shutdown 钩子各探测一次，记忆服务挂掉只降级成告警，宿主照常跑。

40 项测试 · 1,594 行 Python（含测试） · v0.1.0

---

## 其余项目

- [site-kg](https://github.com/CallMeHFK/site-kg) — 站点 URL → 知识图谱 → MCP。边从语料里的链接推；站点没有交叉引用就判 `NOT-READY`，不编链接。12 项测试 / 1,418 行
- [qwenpaw-consensus-rank](https://github.com/CallMeHFK/qwenpaw-consensus-rank) — 多个 LLM 评审各自对匿名化候选独立打分，位次平均出共识，再报 Spearman 相关与逐评审位置稳定性。119 项测试 / ⭐2
- [agent-task-callback](https://github.com/CallMeHFK/agent-task-callback) — 补 QwenPaw `submit_to_agent` 缺的 push 侧：常驻 watcher 轮询子任务，完成后把结果作为新一轮投递回注册方会话。16 项测试 / v0.1.3
- **GameForge MCP Server**（本地，未开源）— 鼠标键盘与截屏的 MCP 工具集，stdio 和 HTTP 两种传输，点击与按键可指定按住时长
- **Windows capture APO**（本地，未开源）— WDK `CBaseAudioProcessingObject` + ATL，跑 iic JAEC 16k 回声消除，后接自研因果流式降噪核；在 audiodg 用户态 CPU 运行，实测约 0.5% 单核，不经 DSP/NPU
- **ScheduleCopilot**（未开源）— AgentScope Agent Team 排期风险识别：Leader 编排 6 类 Worker，10 个领域 Skill，多租户隔离
- ATPO（[arXiv:2603.02216](https://arxiv.org/abs/2603.02216)）— 精读这篇多轮医疗对话的树搜索 RL 并走读其 VeRL 实现；不确定性驱动的 rollout 预算分配，落到了自己的采集门控与路由分档设计上

上游那几个 PR 是同一件事：同一套 Skill 内容不动，改清单和路由就能装进 QwenPaw / Claude Code / Codex / Cursor / Qoder / ZCode。已合并 [sepia PR #250](https://github.com/Nanako0129/sepia/pull/250)（2026-09-17，+318/−25，加 `.qwenpaw-plugin/` 原生插件包与 `/sepia` 斜杠命令）和 [nacos PR #12127](https://github.com/alibaba/nacos/pull/12127)（2024-06-03，补 Python services sample）；[ResearchStudio #60](https://github.com/microsoft/ResearchStudio/pull/60)、[SemaPLC #6](https://github.com/midea-ai/SemaPLC/pull/6)、[text-to-cad #429](https://github.com/earthtojake/text-to-cad/pull/429) 还在审。

---

## 能力与栈

日常做的是把同一套 Skill 或插件装进别人的宿主，只换清单和路由，不动技能内容。过程监督这块是两层策略引擎加上工具接缝层的写入拦截，阈值走统计标定（蒙特卡洛、conformal risk control、CUSUM），效果用离线反事实基准量。技能侧装了 200 个 Skill，配 9 维评分和门控优化，评分口径参照 SkillLens 的实证基线。

另一半在系统层。Windows APO 驱动从官方 COM 契约走到构建签名、测试机部署、验收交付；嵌入式侧用 Renode 跑周期精确在环，裸机 Cortex-M4F 固件与 float32 参考实现逐位对齐，仿真器没实现的计数器靠差分采样反推。

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
