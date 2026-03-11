# FDOS 合作团队技术对接文档

# Factory Delivery Orchestration System — Partner Team Briefing

> 本文档面向负责 FDOS 系统开发落地的合作团队。
> 目标：让合作团队理解系统要解决什么问题、核心工作流是什么、数据怎么流动、业务规则是什么，以及分阶段实现路径。

---

## 第一部分：系统受众与使用视角

> FDOS 的设计起点不是"系统有什么功能"，而是**"谁在用这个系统"**以及**"他们的工作流是什么"**。只有理解了用户的日常工作，才能理解系统要做什么。

FDOS 服务两类核心用户群体，他们的需求和使用方式截然不同：

---

### A. MO 执行层（Individual MO）

#### 工作本质

MO（Manufacturing Operations）的日常工作本质上是一个**信息驱动的执行循环**：

```
搜集信息 → 校验信息 → 分析信息 → 得出 signal/action → 执行 → 传递信息
```

这个循环每天重复多次，在 ramp 期间频率更高。FDOS 的核心价值在于**系统化这个循环的每一步**。

#### 信息搜集的两类问题

MO 搜集信息时面临两类根本不同的挑战：

| 问题类型 | 描述 | 痛点 |
|----------|------|------|
| **已有信息**（historical/existing data） | 产出数据、良率趋势、库存记录等——信息本身存在，但没有好的信息管理系统 | 重复造轮子、到处找数据、每次要从头汇总 |
| **新信息**（emerging signals） | 材料短缺、良率突变、需求变更等——需要实时发现和获取的新信号 | 依赖人工查看 chat/邮件/打电话；拿到后还需 validate，标准不一致 |

#### 信息的三个层次

从原始数据到可决策信息，存在三个加工层次（L2 和 L3 层信息统称为 **Operational Intelligence / 运营洞察**）：

| 层次 | 名称 | 说明 | 示例 |
|------|------|------|------|
| **L1** | Raw Data（原始数据） | 直接从系统/工厂采集的原始信号 | 产出数量、良率、UPH、材料库存 |
| **L2** | Validated Data（标准化数据） | 经过校验、对齐口径后的可信数据 | 标准化的 weekly output by line |
| **L3** | Operational Intelligence（运营洞察） | 经过分析和影响评估的决策级信息 | 良率下降对 W04 commit 的影响、材料短缺的 recovery 方案 |

> **L1→L2** 的关键动作：数据清洗、口径对齐、校验规则
> **L2→L3** 的关键动作：影响分析、趋势判断、方案生成
> **AI 的角色**：自动化 L1→L2（采集+标准化）和 L2→L3（分析+影响评估）的过程，前提是定义好标准和规则。

#### 影响评估框架（Impact Assessment Framework）

当任何异常/变化发生时，MO 需要评估其影响。FDOS 应支持以下 **4 个维度**的标准化影响评估：

| # | 维度 | 说明 | 典型问题 |
|---|------|------|---------|
| 1 | **Input Impact（投入影响）** | 对生产投入量的影响 | 材料短缺导致今天能投多少？ |
| 2 | **Output Impact（产出影响）** | 对产出量/良率的影响 | 良率下降导致本周产出减少多少？ |
| 3 | **Shipment Impact（出货影响）** | 对可出货量/时间窗口的影响 | 产出延迟导致哪些订单无法按时出货？ |
| 4 | **Commitment Impact（承诺影响）** | 对 weekly commit / forecast attainment 的影响 | 最终对客户承诺的影响是什么？ |

**使用方式**：
- 用户可以选择评估**单个维度**或**全部维度**
- 系统为每个维度预设**计算模板和逻辑**
- 一个异常事件可能沿链条逐级传导：Input → Output → Shipment → Commitment

#### 跨职能协调也是信息搜集

传统理解中，"跨职能协调"被视为独立环节。实际上，Risk assessment、资源确认等协调活动本质上是 **L3 层信息的构建过程**——MO 通过协调各方获取分析所需的输入，最终产出决策级洞察。

#### 信息传递负担

MO 不仅搜集和分析信息，还要花**大量时间向平行部门和 leader 传递信息**。这是一个被严重低估的时间消耗。

如果信息流顺畅（系统自动完成采集、标准化、分析、分发），MO 可以从"信息枢纽"转型为专注于：
- **评估运营 trade-offs**：在多个约束条件下找到最优解
- **处理模糊执行情况**：系统无法自动判断的灰色地带
- **对齐跨职能决策**：确保各方在同一方向上执行
- **在变化条件下引导工厂执行**：ramp 期间的动态调整

---

### B. 团队 Leader

#### 核心需求

Leader 的核心需求是：**在一个平台上获取所有信息 + 做决定**。

如果 Leader 需要到处找数据（开多个 Excel、看多个群消息、追问多个人），整个团队都会 suffer——因为 Leader 的注意力分散意味着决策延迟，决策延迟意味着执行卡住。

#### 信息类型

Leader 需要的不是 raw data（L1），而是**结果性信息（L3 层）**：
- 项目状况（哪些 program 正常，哪些有风险）
- 问题（什么问题，影响多大）
- 风险（可能发生什么，概率和影响）
- Solution（有哪些选项，trade-off 是什么）

#### Leader 信息流闭环

```
系统自动生成结果性信息（基于 L1→L2→L3 链条）
        ↓
发送给对应 DRI 确认（是否需要补充/修正）
        ↓
DRI 确认后 → Leader 可见
        ↓
Leader 查看 → 可做 comment：
  - 同意（acknowledge）
  - 追问（request clarification）
  - 要求更多信息
        ↓
DRI 收到 Leader feedback → trigger 新一轮信息搜集/更新
        ↓
系统更新 → Leader 看到最新状态
```

> **Phase 1 方案**：DRI 的角色是确认 + 补充评论（不可编辑系统生成内容），确保信息可信度。

#### 固定报告模板

系统支持自动生成预设报告：

| 报告类型 | 内容 | 频率 |
|----------|------|------|
| **Daily Brief** | 当日执行摘要：Output / Quality / Material / Decisions Needed | 每天 |
| **Weekly Summary** | 本周 commit 状态、gap 分析、关键决策、下周风险 | 每周 |
| **Exec Report** | 管理层视角：Program-level status、Health Score、Key Asks | 按需 |

**报告工作流**：
- 系统自动 generate 预设报告
- Generate 后可选择：发邮件 / 发送给某人 / 发送给某些人
- 支持定时任务（scheduled generation + auto-send，如每周一 8:00 自动生成 + 发送）

---

### FDOS 不是 Dashboard，是 Operating System

理解了两类用户的需求后，可以更清晰地定义 FDOS：

| | Dashboard 项目 | FDOS |
|---|---|---|
| 核心逻辑 | 数据 → 可视化 → 完成 | 工作流 → 数据需求 → 系统实现 → 改变工作方式 |
| 成功标准 | 页面好看、数据准确 | **替代了哪个 Excel / 邮件 / 会议** |
| 用户行为 | 打开看一眼 | 每天在系统里完成工作动作 |

**一句话定义：FDOS 把工厂执行信号转化为交付决策。**

---

## 第二部分：信息基础建设

> 在讨论具体场景之前，先明确 FDOS 落地前需要回答的基础问题。没有信息基础，任何系统功能都无法落地。

### 2.1 信息清单：我们到底需要哪些信息？

需要逐项梳理每个模块、每个场景所需的信息项，形成完整的信息清单。清单需要回答：
- 信息项名称
- 属于哪个层次（L1/L2/L3）
- 当前获取方式
- 目标获取方式
- 是否有 gap

### 2.2 现状 Gap 分析：这些信息目前的获取方式是什么？

```
当前状态：
  MES 数据 → 邮件日报 → MO 手动录入 Excel
  材料信息 → Sourcing WeChat/邮件 → MO 手动汇总
  计划数据 → O9/SAP → Planning 导出 Excel → MO 手动对齐

目标状态（分阶段）：
  Phase 1: Excel 上传 → 系统解析（半自动）
  Phase 2: API 对接 MES/MRP → 系统定时拉取（自动）
  Phase 3: 事件驱动 → 变化实时推送（实时）
```

### 2.3 KPI 标准化

运营指标在不同工厂和不同 program 之间定义经常不一致。系统中的每个 KPI 都需要有：

| 标准化维度 | 说明 | 示例 |
|-----------|------|------|
| **统一定义** | KPI 的计算公式必须唯一确定 | 产能利用率 = 实际产出 / 理论最大产能 |
| **统一采集途径** | 数据从哪里来、谁负责输入 | Output 从 MES API 自动拉取 |
| **统一更新频率** | 多久更新一次 | Daily / Weekly / Monthly |
| **统一数据口径** | 计算基准一致 | 排产达成率以 POR 为基准，不是 daily plan |

> **给合作团队：** 系统中的每个 KPI 都需要有明确的计算公式和数据来源定义，不能依赖"大家都知道怎么算"。

### 2.4 影响评估模板

基于第一部分定义的 4 维影响评估框架，需要为每个维度设计：

| 维度 | 计算模板 | 所需输入 | 输出 |
|------|---------|---------|------|
| **Input Impact** | 短缺量 = 需求投入 - 可用材料/产能 | CTB、产能配置 | 投入缺口数量和时间 |
| **Output Impact** | 产出损失 = 投入缺口 × 良率 + 良率变化 × 投入量 | 投入数据、良率数据 | 产出缺口数量 |
| **Shipment Impact** | 出货影响 = 产出缺口 × 出货转化率 + lead time 延迟 | 产出数据、出货规则 | 可出货缺口和延迟天数 |
| **Commitment Impact** | Commit 影响 = Gap / Demand × 100% | 出货数据、需求数据 | Gap% 和受影响的周数 |

---

## 第三部分：系统覆盖范围与 KPI 自动化

> 以下 KPI 框架基于团队已完成的指标对齐工作（SCO Aligned Metrics），包含每个 KPI 的定义、计算公式、数据来源、集成路径和刷新频率。

### 3.1 项目范围

- 哪些项目（products）放进 FDOS
- 每个项目的哪些方面纳入系统管理
- 每个项目涉及哪些 site/line

### 3.2 SCO KPI Framework（统一指标框架）

团队已将 KPI 按 **SCO Topline** 分为五大维度，每个 KPI 有明确的优先级（P0 = Phase 1 必须 / P1 = Phase 1 增强）：

#### Product Availability（产品可用性）

| Priority | Metric Name | Calculation | Target | Frequency | Data Source | Integration | Data DRI | Upload Mode |
|----------|------------|-------------|--------|-----------|-------------|-------------|----------|-------------|
| **P0** | Ex-factory to Supply Commit Attainment % | Weighted (actual ship qty / plan qty) by SKU | Per project matrix | Weekly | CM APS + CM WMS | APS + ASN | CM | System Push / Manual |
| **P0** | Production Schedule Adherence % | Weighted (actual input qty / plan qty) by SKU | Per project matrix | Weekly | CM APS + CM MES | APS + QuatumnBridge | CM | System Push / Manual |
| **P0** | Capacity Utilization | Actual output / Installed output capacity | ≥85% | Weekly | CM APS + CM MES | APS + QuatumnBridge | CM | System Push / Manual |
| **P0** | Capacity Shortage % | (Ex-factory Request - Ungated Capacity) / Ex-factory Request *Ungated capacity = actual output + to-go ungated capacity | <5% | Weekly | CM APS | APS | CM | System Push / Manual |

#### Agility（敏捷性）

| Priority | Metric Name | Calculation | Target | Frequency | Data Source | Integration | Data DRI | Upload Mode |
|----------|------------|-------------|--------|-----------|-------------|-------------|----------|-------------|
| **P1** | Manufacturing Lead Time (Main Line → Ready to Ship) | Median (Shipped date/time - Input date/time) for units shipped this week | Per project matrix | Weekly | CM MES | QuatumnBridge | CM | System Push |
| **P1** | Manufacturing Lead Time Achieve Rate | Units produced within committed lead time / total units produced | Per project matrix | Weekly | CM MES | QuatumnBridge | CM | System Push |

#### Timely Delivery（及时交付）

| Priority | Metric Name | Calculation | Target | Frequency | Data Source | Integration | Data DRI | Upload Mode |
|----------|------------|-------------|--------|-----------|-------------|-------------|----------|-------------|
| **P0** | BTO/CTO Manufacturing Lead Time (MIH → Ready to Ship) | Median (Shipped date/time - Input date/time) for POs shipped this week | Per project matrix | Weekly | CM MES | QuatumnBridge | CM | System Push |
| **P0** | BTO/CTO On-Time Ship % | PO qty shipped within committed lead time / total PO qty | Per project matrix | Weekly | CM MES | QuatumnBridge | CM | System Push |

#### Readiness（就绪度）

| Priority | Metric Name | Calculation | Target | Frequency | Data Source | Integration | Data DRI | Upload Mode |
|----------|------------|-------------|--------|-----------|-------------|-------------|----------|-------------|
| **P0** | Labor Fulfillment % | Labor demand qty / actual onboarded labor qty | 100% | Weekly | CM Labor Tracker | csv to Mulesoft | CM | Manual |
| **P0** | Campus Readiness On-Time % | Ok2use campus space & facility / total campus demands | 100% | Monthly | Campus Database | csv to Mulesoft | MO | Manual |
| **P1** | Campus Utilization % | Line installed space / total reserved space | >80% | Monthly | Campus Database | csv to Mulesoft | MO | Manual |

#### Cost（成本）

| Priority | Metric Name | Calculation | Target | Frequency | Data Source | Integration | Data DRI | Upload Mode |
|----------|------------|-------------|--------|-----------|-------------|-------------|----------|-------------|
| **P1** | FV Negotiation Rate | Cost Reduction through Negotiation / total validated cost | >20% | By need | FV Database | csv to Mulesoft | MO | Manual |
| **P1** | Factory Variance Cost per Unit | Total FV cost (incurred + projected) / ExF | Per project matrix | Monthly | FV Database | csv to Mulesoft | MO | Manual |

### 3.3 KPI 与 FDOS 模块映射

每个 KPI 对应 FDOS 中的具体模块和页面：

| SCO Topline | KPI | FDOS 模块 | 页面 | 信息层次 |
|-------------|-----|----------|------|---------|
| Product Availability | Ex-factory Commit Attainment | Decision Center | Commit 总览 | L3 |
| Product Availability | Schedule Adherence | Production Management | IO Status | L2→L3 |
| Product Availability | Capacity Utilization | Production Management | Line Execution | L2 |
| Product Availability | Capacity Shortage | Production Planning | Simulation | L2→L3 |
| Agility | Manufacturing Lead Time | Production Management | Lead Time 追踪 | L2 |
| Agility | Lead Time Achieve Rate | Production Management | Lead Time 追踪 | L2→L3 |
| Timely Delivery | BTO/CTO Mfg Lead Time | Production Management | BTO/CTO 追踪 | L2 |
| Timely Delivery | BTO/CTO On-Time Ship | Decision Center | Shipment 追踪 | L3 |
| Readiness | Labor Fulfillment | MO KPIs | Resource Metrics | L2 |
| Readiness | Campus Readiness | Campus Planning | Readiness 总览 | L2 |
| Readiness | Campus Utilization | Campus Planning | Building Detail | L2 |
| Cost | FV Negotiation Rate | FV Cost Management | Negotiation 追踪 | L3 |
| Cost | FV Cost per Unit | FV Cost Management | Cost Breakdown | L2→L3 |

### 3.4 模块运营模式转型（FV Cost & Campus Planning）

> 以下两个模块在第四部分没有独立场景，但用户团队已明确了 Before → After 转型期望。

#### FV Cost Management

| 维度 | Current Mode | 2026+ Expectations (FDOS) |
|------|-------------|--------------------------|
| **Tracking System** | Spreadsheet-based：FV cost 数据分散在多个 Excel 中，各 site 各自维护 | Centralized FV Cost Module：统一 cost breakdown（Material + Labor + Overhead + Rework），by program / by site |
| **Connection with Production Data** | 手动关联：成本数据与产出数据分别在不同系统，需要人工 match | Auto-linked：FV Cost per Unit 自动关联 ExF 产出数据，实时计算单位成本 |
| **Decision Lead Time** | Monthly review cycle：月底才发现 cost overrun | Weekly visibility：FV Database → Mulesoft → FDOS 每周更新，Cost Variance 超阈值自动告警 |
| **Reports** | 手动编制月度成本报告，格式不统一 | Auto-generated：预设模板 by program / by cost category，一键生成 + 分发 |
| **Domain Expert Dependence** | Finance 团队是瓶颈，其他人看不懂成本结构 | Self-service with guardrails：标准化 FV Negotiation Rate 和 FV Cost per Unit 定义，MO 可自行查看和追踪 |

#### Campus Planning

| 维度 | Current Mode | 2026+ Expectations (FDOS) |
|------|-------------|--------------------------|
| **Communication Form** | Email/meeting-based：场地需求和进度通过邮件、会议沟通，信息散落 | System-integrated：Campus Readiness 和 Utilization 在 FDOS 中集中展示，状态变更自动通知 |
| **Planning Process** | Offline spreadsheets：场地规划在 Excel 中管理，space demand vs available 手动对比 | Online capacity & space planning：Campus Database → Mulesoft → FDOS，按 building 展示利用率 |
| **Reports** | 手动汇总状态更新，格式和频率不统一 | Auto-generated readiness reports：Monthly 自动生成 Campus Readiness On-Time % 和 Utilization % 报告 |
| **AI Q&A** | N/A | AI-assisted space optimization：基于产能计划和 ramp schedule 预测场地需求 |

### 3.5 KPI Data Pipeline（数据采集到指标的完整路径）

每个 KPI 的自动化取决于其数据管线的成熟度：

```
Data Source (CM/MO 系统)
    ↓
Integration Path (System Push / Manual Upload)
    ↓
    ├─ System Push: CM APS → APS integration → FDOS
    ├─ System Push: CM MES → QuatumnBridge → FDOS
    ├─ Manual: csv → Mulesoft → FDOS
    └─ Manual: Excel upload → FDOS 解析
    ↓
Data Validation (L1 → L2)
    ↓
KPI Calculation Engine (L2 → L3)
    ↓
Dashboard / Alert / Report
```

**按集成路径分类的自动化等级：**

| 集成路径 | 自动化等级 | 涉及 KPI | 当前状态 |
|---------|-----------|---------|---------|
| **CM APS → APS** | Tier 1（系统推送） | Commit Attainment, Schedule Adherence, Capacity Utilization, Capacity Shortage | 已有集成，需要对接 |
| **CM MES → QuatumnBridge** | Tier 1（系统推送） | Mfg Lead Time, LT Achieve Rate, BTO/CTO LT, On-Time Ship | 已有集成，Daily 推送 |
| **CM WMS → ASN** | Tier 1（系统推送） | Ex-factory Shipment Actual | 已有集成 |
| **CM Labor Tracker → Mulesoft** | Tier 2（csv 上传） | Labor Fulfillment | 手动 csv，Weekly |
| **Campus Database → Mulesoft** | Tier 2（csv 上传） | Campus Readiness, Campus Utilization | 手动 csv，Monthly |
| **FV Database → Mulesoft** | Tier 2（csv 上传） | FV Negotiation Rate, FV Cost per Unit | 手动 csv，Weekly-Monthly |

### 3.6 Operational Health Index（综合健康指数）

```
Health Score = Execution × 0.45 + Resources × 0.30 + Cost × 0.25

Execution = Commit Attainment × 0.30
          + Schedule Adherence × 0.25
          + Capacity Utilization × 0.20
          + On-Time Ship × 0.25

Resources = Labor Fulfillment × 0.50
          + Campus Readiness × 0.50

Cost      = 100 - |FV Cost Variance %|

≥ 90 → GOOD (Green) | ≥ 75 → FAIR (Yellow) | < 75 → AT RISK (Red)
```

### 3.7 自动报告系统

| 功能 | 说明 |
|------|------|
| **预设模板** | by site, by program, by SCO Topline category |
| **定时任务** | 如：每周一 8:00 自动生成 Weekly Summary + 发送给指定人 |
| **按需生成** | 用户随时点击生成 + 选择发送渠道（邮件 / Slack / WeChat） |

---

## 第四部分：核心工作流场景

以下是 FDOS 需要支撑的核心场景。**每个场景都描述了：现在怎么做（痛点） → FDOS 之后怎么做（目标态）。**

每个场景标注了涉及的**信息层次（L1/L2/L3）**和**影响评估维度**。

---

### 场景 1：Weekly Commit Tracking（每周交付承诺跟踪）

**这是 FDOS 最核心的工作流。**

**信息层次**：L1（Demand/CTB/Output 原始数据）→ L2（标准化后的周度数据）→ L3（Gap 分析、Limiter 诊断、风险评估）
**影响评估维度**：全部 4 维（Input → Output → Shipment → Commitment）

#### 现状（痛点）

```
周一：MO 从多个系统收集数据 → Excel 汇总
        ↓
周二：手动计算 gap → 判断哪些 program 有风险
        ↓
周三：发邮件给各 owner → 开会讨论 recovery plan
        ↓
周四-五：跟踪执行 → 如果有新变化，重新算一遍
        ↓
周六：出 weekly report → 邮件发给 leadership

问题：
- 周一到周三在"搜集数据"，真正决策时间不到 48h
- 数据口径不统一（不同人算出来的 gap 不一样）
- 变化发生时无法实时反映
- 历史决策没有记录，无法复盘
```

#### 目标态（FDOS）

```
系统自动 / 半自动采集数据：
  Demand (from Planning/O9) + Capacity (from Factory) + CTB (from Sourcing)
        ↓
系统实时计算：
  每个 Program 的 commit status
  Gap = Deliverable Ship - Demand
  Primary Limiter = min(Capacity, CTB, Yield) 中哪个是瓶颈
        ↓
系统自动识别风险：
  Gap% < -5% → 自动生成 MEDIUM alert
  Gap% < -10% → 自动生成 HIGH alert
  推送给 responsible owner（MO / Planning / Sourcing）
        ↓
决策在系统内完成：
  Owner 看到 alert + 上下文 + 选项
  做出决策（approve expedite / reject / defer）
  决策记录在 Decision Ledger
        ↓
系统生成汇报：
  Daily brief / Weekly exec summary 一键生成
  基于实际数据，不需要手动写
```

#### 数据需求

| 数据 | 字段 | 来源 | 刷新频率 |
|------|------|------|---------|
| Demand | `week_id`, `demand_units` | Planning / O9 | Weekly |
| Capacity | `site_id`, `line_id`, `shift_type`, `base_uph`, `shift_hours` | Factory Ops | Weekly (config) |
| CTB | `site_id`, `date`, `ctb_qty` | Sourcing / MPM | Daily |
| Output (Actual) | `site_id`, `date`, `output_units` | MES / Factory report | Daily |
| Shipment (Actual) | `date`, `ship_units` | Logistics | Daily |
| Yield | `site_id`, `line_id`, `fpy_rate` | Quality / MES | Daily |

#### 业务规则

```
RULE-001: Weekly Commit Calculation
  Expected Output = min(Capacity, CTB) × Yield × Output Factor
  Deliverable Ship = Expected Output - Shipment Lag (2 working days)
  Gap = Deliverable Ship - Demand
  Gap% = Gap / Demand × 100

RULE-002: Primary Limiter Detection
  IF CTB < Capacity → Limiter = "Material (CTB)"
  IF Capacity < CTB → Limiter = "Capacity"
  IF Yield < target → Limiter = "Yield"

RULE-003: Alert Generation
  IF Gap% < -5%  → MEDIUM alert → Owner: Operations
  IF Gap% < -10% → HIGH alert → Owner: MO Lead + Program Owner
  SLA: HIGH = 24h, MEDIUM = 48h

RULE-004: Decision Escalation
  IF alert unresolved after SLA → auto-escalate to next level
```

---

### 场景 2：Material Shortage Response（材料短缺应急响应）

**信息层次**：L1（CTB 变化、Supplier ETA）→ L2（标准化影响量）→ L3（决策卡片 + 方案对比）
**影响评估维度**：Input Impact → Commitment Impact

#### 现状（痛点）

```
Sourcing 发邮件："IC-77 供应商 ETA 延迟 2 天"
        ↓
MO 手动评估：这个料影响哪个 program？影响多少 units？
        ↓
打开 Excel 重新算 commit impact → 花 2-4 小时
        ↓
发邮件给 leadership："建议 expedite，费用 $120k"
        ↓
等邮件回复 → 可能 1-2 天才有决定
        ↓
总共 3-4 天过去了，窗口可能已经错过

问题：
- 影响评估是手动的，速度慢
- 决策链太长（邮件 → 开会 → 审批）
- 没有标准化的 cost-benefit 分析
- 事后没有记录
```

#### 目标态（FDOS）

```
系统检测到 CTB 变化（ETA slip / 数量减少）
        ↓
自动计算 commit impact：
  - 哪些 program 受影响
  - 影响 units 数量
  - 影响哪几周的 ship window
        ↓
自动生成决策卡片：
  ┌─────────────────────────────────────────┐
  │ HIGH: IC-77 Shortage — Product A        │
  │                                         │
  │ Impact: 12,400 units at risk for W04    │
  │ Root cause: Supplier ETA slip +2 days   │
  │                                         │
  │ Options:                                │
  │  A: Expedite (air freight) → $120k      │
  │     → Protect W04 commit, 95% conf      │
  │  B: Wait for sea freight → $0           │
  │     → Accept 2-day delay, 62% conf      │
  │  C: Partial expedite → $65k             │
  │     → Medium risk, 78% conf             │
  │                                         │
  │ Owner: Sourcing | SLA: 24h              │
  │                                         │
  │ [Approve A] [Approve B] [Approve C]     │
  └─────────────────────────────────────────┘
        ↓
Owner 在系统内决策 → 记录 → 跟踪执行
```

#### 数据需求

| 数据 | 字段 | 来源 | 触发方式 |
|------|------|------|---------|
| CTB Daily | `site_id`, `date`, `ctb_qty`, `material_id` | Sourcing / MRP | 当 ETA/数量变化时 |
| Commit Snapshot | 同场景 1 | 系统内计算 | 实时 |
| Cost Data | `expedite_cost`, `delay_cost` | Finance / Logistics | 按需 |
| Supplier ETA | `supplier_id`, `material_id`, `original_eta`, `revised_eta` | Sourcing | 事件触发 |

#### 业务规则

```
RULE-010: CTB Change Detection
  IF daily_ctb_new < daily_ctb_previous → trigger impact assessment
  IF supplier_eta_revised > supplier_eta_original → trigger impact assessment

RULE-011: Impact Calculation
  affected_programs = programs WHERE material_id IN shortage_materials
  units_at_risk = sum(expected_output - constrained_output) for affected weeks

RULE-012: Decision Card Generation
  Generate 2-3 options with:
    - Action description
    - Cost estimate
    - Commit confidence impact
    - Timeline
  Route to: Material owner (Sourcing) + Program owner (MO)
  SLA: 24h for HIGH, 48h for MEDIUM
```

---

### 场景 3：Production Plan Simulation（生产计划模拟）

**信息层次**：L1（产能配置、Demand、CTB）→ L2（标准化排产参数）→ L3（Simulation 结果 + 场景对比 + POR 决策）
**影响评估维度**：Output Impact → Shipment Impact → Commitment Impact

#### 运营模式转型（Before → After）

| 维度 | Current Mode | 2026+ Expectations (FDOS) |
|------|-------------|--------------------------|
| **Build System** | Excel-based manual planning; 按 line × shift × day 手动排布产能 | Automated Plan Engine：参数配置 → 一键 Simulation → 多场景对比 |
| **CM/Meta Data Loading** | 手动从 CM 收集产能、良率、UPH 等 meta data | System-integrated：CM APS → APS 自动推送；MES → QuatumnBridge 自动同步 |
| **Actualization** | 手动对比 plan vs actual，Excel 公式计算偏差 | Real-time tracking：系统自动拉取 actual 数据，实时计算 Schedule Adherence |
| **Lead Times** | 静态假设，手动维护在 Excel 中 | Dynamic lead time modeling：基于实际 MES 数据计算 median lead time |
| **Decision Agility** | 改一个参数重算整张表，每次 30-60 分钟 | 分钟级 Simulation：修改参数 → 立即看到 Output/Gap/Attainment 变化 |
| **SKU Proliferation** | 多 SKU 时 Excel 复杂度指数上升，容易出错 | 系统原生支持 multi-program / multi-SKU，统一计算引擎 |
| **Domain Expert Dependence** | 排产逻辑存在个人 Excel 中，人走知识走 | 规则引擎化：UPH ramp curve、yield curve、shipment rules 全部系统配置 |
| **AI Q&A** | N/A | AI 辅助场景分析：自然语言提问 → 系统生成场景建议和影响评估 |

#### 现状（痛点）

```
Planning 在 Excel 里手动排产：
  - 按 line × shift × day 排布产能
  - 考虑节假日、ramp curve、良率
  - 手动算 output、shipment、gap

问题：
- 改一个参数（比如加一个 shift），要重算整张表
- 无法快速比较不同场景
- 没有版本管理（哪个版本是 POR？）
- 和上游 demand 数据经常脱节
```

#### 目标态（FDOS）

```
用户配置计划参数：
  Site → Line → Shift → UPH → Yield Curve → Holiday
  上传 Demand Forecast + CTB Data
        ↓
一键生成 Simulation：
  系统按 daily granularity 计算：
    Input → Output → Shipment → Gap → Binding Constraint
  支持三种模式：
    - Unconstrained: 只看产能，不考虑材料
    - Constrained: 产能 + 材料约束
    - Combined: 两者对比
        ↓
保存到 Simulation Library：
  支持多版本、多项目管理
  可以比较不同 simulation 的结果
        ↓
Promote 为 POR（Plan of Record）：
  正式版本，带版本号（v1.0, v1.1, v2.0）
  自动和上一版 POR 比较差异
```

#### 计算引擎核心逻辑

```
每日每条线的产出计算：

  Daily Input = base_uph × uph_ramp_factor(workday_index) × shift_hours
  Daily Output = Daily Input × yield_ramp_factor(workday_index) × output_factor

  output_factor:
    Day 1 (ramp start): 0.5× (warm-up)
    Day 2+: 1.0× (steady state)

CTB 约束（constrained mode）：

  cumulative_ctb = sum(daily_ctb) up to date
  ctb_remaining = max(0, cumulative_ctb - cumulative_input_consumed)
  input_final = min(unconstrained_input, ctb_remaining)
  output_final = input_final × (yield_rate)

出货计算（5 条规则）：

  Rule 0: 非工作日不出货
  Rule 1: shipment_start_date 之前不出货
  Rule 2: 产出后需等 N 个工作日才可出货（默认 2 天 lag）
  Rule 3: 可出货量 = 累计可出货产出 - 累计已出货
  Rule 4: 每日出货 ≤ max_daily_shipment
  Rule 5: 按 pallet size 向下取整

周度汇总：

  Weekly Gap = Weekly Shipment - Weekly Demand
  Attainment = Weekly Shipment / Weekly Demand × 100%
```

#### 数据 Schema

**输入配置：**

```json
{
  "capacityUnits": [
    {
      "unit_id": "WF-L1-D",
      "site_id": "WF",
      "line_id": "WF-L1",
      "shift_type": "DAY",
      "ramp_start_date": "2025-12-01",
      "base_uph": 500,
      "shift_hours": 8,
      "uph_ramp_curve": {
        "length_workdays": 60,
        "factors": [0.3, 0.5, 0.7, 0.85, 0.92, 0.96, 0.98, 1.0]
      },
      "yield_ramp_curve": {
        "length_workdays": 45,
        "factors": [0.65, 0.72, 0.78, 0.83, 0.88, 0.92, 0.95, 0.97]
      }
    }
  ],
  "weeklyDemand": [
    { "week_id": "2026/02/01", "demand_qty": 80000 }
  ],
  "ctbDaily": [
    { "site_id": "WF", "date": "2026-01-27", "ctb_qty": 5000 }
  ],
  "countryHolidays": {
    "CN": [
      {
        "name": "CNY",
        "start": "2026-01-29",
        "end": "2026-02-05",
        "triple_pay_dates": ["2026-01-29"],
        "eve_night_shift": { "input_hours": 0, "output_hours": 4 }
      }
    ]
  }
}
```

**输出结构：**

```json
{
  "programResults": [
    {
      "date": "2026-01-27",
      "input_final": 12000,
      "output_final": 10800,
      "shipment_final": 9500,
      "cum_input": 120000,
      "cum_output": 108000,
      "cum_shipment": 95000
    }
  ],
  "weeklyMetrics": [
    {
      "week_id": "2026/02/01",
      "input": 84000,
      "output": 75600,
      "shipments": 72000,
      "demand": 80000,
      "gap": -8000,
      "attainment": 0.9
    }
  ]
}
```

---

### 场景 4：Daily Execution Monitoring（每日工厂执行监控）

**信息层次**：L1（产线 Output/Yield/UPH/WIP）→ L2（标准化执行指标）→ L3（异常诊断、Alert、Daily Brief）
**影响评估维度**：Output Impact → Shipment Impact

#### 运营模式转型（Before → After）

| 维度 | Current Mode | 2026+ Expectations (FDOS) |
|------|-------------|--------------------------|
| **Data Collection** | 手动从 5-6 个来源收集（MES 邮件、Excel 日报、WeChat 群消息），每天 30-60 分钟 | Auto-aggregated：MES → QuatumnBridge → FDOS 自动刷新，打开即看 |
| **BOD/EOD Deck** | 手动整合数据 → 写 PowerPoint/Slack post，每次 1-2 小时 | One-click generation：系统基于实时数据自动生成结构化 Brief |
| **Data Timeliness** | T+1 或更晚：依赖 CM 发送报告的时间 | Near real-time (T+0)：系统直接从 MES 拉取，Daily 自动刷新 |
| **Auto Alarms** | 无自动预警；靠 MO 人工发现异常 | Rule-based + AI predictive alerts：良率下降、产出偏差、材料短缺自动触发 |
| **Decision Agility** | 发现问题后需要手动评估影响，打开 Excel 重算 | 分钟级响应：Alert 自带 Impact Assessment Chain（Input→Output→Shipment→Commitment） |

#### 现状（痛点）

```
每天早上 MO 需要：
  1. 收集各产线 output / yield / UPH → 来自 MES 邮件报告 + 工厂日报 Excel
  2. 收集材料到位情况 → 来自 Sourcing 的 WeChat/邮件更新
  3. 收集来料质量信号 → 来自 IQC 报告
  4. 收集产线利用率/停线情况 → 来自 CM 反馈
  5. 手动整合以上信息 → 判断哪些需要 escalation
  6. 写 daily update 发到 Slack/WeChat 群

实际场景（以 ramp 期间为例）：
  06:00  打开 3-4 个邮件/Excel/群消息，逐一看数据
  06:30  发现 WF-L1 良率下降 + IC-77 短缺 + VN02 人力不足
         → 这 3 个问题分别来自不同信息源
         → 需要手动判断它们是否同时影响同一个 program
  07:00  BOD 早会 → MO 口头汇总（而不是看系统）
  07:30  各职能口头分配 action → 没有系统记录

问题：
- 信号散落在 5-6 个来源，手动汇总 30-60 分钟
- 多个 issue 同时发生时，容易遗漏或低估叠加影响
- BOD 讨论基于人工记忆和经验，缺少数据支撑
- Issue 分配靠口头/群消息，无法追踪和度量 SLA
- 每天 1-2 小时在"汇总"而不是"决策"
```

#### 目标态（FDOS）

```
打开 Production Management 页面：
        ↓
Factory Execution Snapshot（一屏看全）：
  - 今日 FATP Output: 2,846 / 3,308 planned (86%) — YELLOW
  - Yield (FPY): 91.2% — GREEN
  - Material Readiness: 2 shortages — YELLOW
  - Active Alerts: 3 — RED
        ↓
Production IO Status：
  每个 Program 的 Demand / Capacity / CTB / Output / Ship / Gap
  一目了然哪里有问题
        ↓
Line Execution：
  每条线的 UPH / Yield / WIP / Status
  快速定位哪条线异常
        ↓
Manufacturing Issue Tracker (MIL)：
  所有未关闭的 issue + severity + owner + days open
        ↓
一键生成 Daily Brief / Daily Post：
  系统基于当天数据自动生成结构化汇报
  直接发到 Slack / WeChat / 邮件
```

#### 数据需求

| 数据 | 粒度 | 来源 | 刷新 |
|------|------|------|------|
| Line Output | 每线每天 | MES | 每天 |
| Line Yield (FPY) | 每线每天 | MES / Quality | 每天 |
| Line UPH | 每线每小时 | MES | 实时 / 每天 |
| WIP | 每线 | MES | 实时 / 每天 |
| Material Shortage | 每料号 | MRP / Sourcing | 每天 |
| Issue Log | 每条 issue | Quality / Ops | 实时 |

---

### 场景 5：Executive Summary Generation（管理层汇报生成）

**信息层次**：L2（各模块标准化数据）→ L3（Health Score、Priority Actions、结构化汇报）
**影响评估维度**：全部 4 维汇总

#### 现状（痛点）

```
每周五 MO 花 2-3 小时手动写 weekly exec summary：
  - 从各个 Excel 拉数据
  - 手动写 narrative
  - 格式化 → 发邮件

Leadership review 时，经常追问：
  "这个 gap 的 root cause 是什么？"
  "有几个 option？trade-off 是什么？"
  → MO 当场回答不了，需要回去再查

问题：
- 汇报准备时间太长
- 汇报内容和实际数据之间有 time lag
- 缺少结构化的 decision context
```

#### 目标态（FDOS）

```
MO KPI 页面：
  Operational Health Index = 综合评分
  Sub-scores: Execution / Resources / Cost
  Priority Actions 直接展示需要关注的 signal
        ↓
一键生成三种汇报：

Daily Brief（BOD/EOD）：
  - 结构化：Output / Quality / Material / Decisions Needed
  - 基于当天实际数据

Daily Post（Slack/WeChat）：
  - 简短 narrative，3-5 句话
  - 适合发到群里

Exec Summary（Weekly VP Brief）：
  - Program-level status（A/B/C/D）
  - Factory health by line
  - Key asks（需要 VP 决定的事）
  - 基于整周数据自动汇总
```

---

### 场景 6：Yield Drop Response（良率异常应急）

**信息层次**：L1（FPY 数据变化）→ L2（3-day 趋势分析）→ L3（影响评估 + Alert + Containment）
**影响评估维度**：Output Impact → Shipment Impact → Commitment Impact

#### 目标态工作流

```
系统检测到 WF-L1 良率从 90% 下降到 70%
        ↓
自动计算影响：
  - 今日产出预计减少 462 units
  - 本周 commit 风险增加：Product A gap 扩大到 -15%
        ↓
生成 alert：
  ┌─────────────────────────────────────────┐
  │ HIGH: Yield Drop — WF-L1               │
  │                                         │
  │ FPY: 90% → 70% (3-day trend)           │
  │ Root cause: Solder joint defect         │
  │ Impact: 12,400 units at risk for W04   │
  │                                         │
  │ Owner: PQE | SLA: 24h                  │
  │ [Assign Containment] [Escalate]        │
  └─────────────────────────────────────────┘
        ↓
PQE 在系统内记录 containment action
MO 看到 MIL tracker 更新
下一天数据刷新后，系统跟踪 yield 是否恢复
```

---

### 场景 7：Production Plan 版本管理与 POR 审批

**信息层次**：L2（Simulation 结果数据）→ L3（版本对比 + 决策建议）
**影响评估维度**：Output Impact → Commitment Impact

#### 目标态工作流

```
Planner 创建多个 simulation：
  Sim A: Baseline (current config)
  Sim B: Add weekend OT for WF-L1
  Sim C: Add night shift for VN02-L1
        ↓
在 Simulation Library 比较：
  | Metric      | Sim A    | Sim B    | Sim C    |
  | Output      | 180k     | 195k     | 210k     |
  | Attainment  | 85%      | 92%      | 99%      |
  | Gap Weeks   | 5        | 2        | 0        |
  | Added Cost  | $0       | +$35k    | +$80k    |
        ↓
选择 Sim B → Promote to POR
  系统自动分配版本号：v2.1
  自动生成和 v2.0 的 diff：
    - Config change: WF-L1 added weekend OT
    - Output: +15k units (+8.3%)
    - Gap weeks: 5 → 2
        ↓
POR 生效 → 成为所有人看到的"官方计划"
旧版本归档到 POR Version History
```

---

### 场景 8：Ramp Execution Coordination（量产爬坡执行协调）

**这是最能体现 FDOS 价值的高压场景。** Ramp 期间产量快速拉升、材料供应尚未稳定、运营波动大、执行条件频繁变化——所有协调摩擦在短时间窗口内集中爆发。

**信息层次**：全部三层（L1 大量原始信号 → L2 快速标准化 → L3 多维影响评估 + 场景模拟）
**影响评估维度**：全部 4 维，且需要支持多 issue 叠加评估

#### 现状（痛点）

```
Ramp 期间一天内的典型工作流：

06:00  MO 手动收集前一天各线 output/yield/UPH、材料到位、来料质量
       → 数据来自 MES 邮件、工厂日报 Excel、Sourcing 群消息
       → 花 30-60 分钟整合成可讨论的信息

07:00  BOD 早会：产出回顾、良率波动、材料短缺、设备异常
       → 发现 WF-L1 良率突然从 90% 降到 72%
       → 同时 IC-77 ETA 延迟，VN02 周末加班人力不够

08:00  MO 开始排查：同时处理 3 个 issue
       → 良率问题联系 PQE
       → 材料问题联系 Sourcing + MPM
       → 人力问题联系 HR + CM
       → 信息来回通过 WeChat / 邮件 / 电话

10:00  初步有了各方反馈，需要评估方案
       → 打开 Excel，手动修改排产参数，重算 output
       → 场景 A: 良率恢复到 85% + 材料 expedite → cost $120k
       → 场景 B: 良率维持 72% + partial build → commit 缺口 15%
       → 场景 C: 加周末班补产 + 材料 partial expedite → cost $65k
       → 每个场景改一堆参数，算一次要 30-60 分钟

12:00  MO 汇总方案发邮件给 leadership + Planning 讨论
       → 等邮件回复，可能下午才有反馈

15:00  下午又有新变化：良率略有恢复到 78%，材料有了新 ETA
       → 之前算的场景作废，需要重新算
       → 又花 1 小时重新做 simulation

17:00  EOD 汇总：手动写 daily update，发到群里和邮件

问题：
- 一天花 3-4 小时在"汇总数据 + 手动计算"，真正决策时间不到 2 小时
- 多个 issue 同时发生，容易遗漏或响应不及时
- 排产场景一天改 3-4 次，每次手动重算
- 跨职能协调全靠人工（邮件/群聊/电话），信息不同步
- 到了写 daily update 时，还要再汇总一遍
```

#### 目标态（FDOS）

```
Ramp 期间一天内的 FDOS 支撑工作流：

06:00  系统自动采集昨日工厂信号
       Production Management 页面自动刷新:
         Output: 2,846 / 3,308 planned (86%) — YELLOW
         Yield: WF-L1 72% ↓ (3-day trend), WF-L2 94%, VN02-L1 92%
         Material: IC-77 shortage detected
         Labor: VN02 weekend OT fill rate 87%

       系统自动生成 Alert:
         ┌─────────────────────────────────────────┐
         │ HIGH: Yield Drop — WF-L1 (90→72%)      │
         │ Impact: 462 units/day, W04 gap +5%      │
         │ Owner: PQE | SLA: 24h                   │
         ├─────────────────────────────────────────┤
         │ HIGH: IC-77 Shortage — Product A        │
         │ Impact: 12,400 units at risk for W04    │
         │ Owner: Sourcing | SLA: 24h              │
         ├─────────────────────────────────────────┤
         │ MEDIUM: Labor Fill — VN02 Weekend       │
         │ Impact: -13% UPH if unfilled            │
         │ Owner: HR/Ops | SLA: 48h                │
         └─────────────────────────────────────────┘

07:00  BOD 早会用 FDOS 投屏
       MO KPIs → Operational Health Index: 71 (AT RISK)
       Priority Actions 直接展示需要关注的 3 个 signal
       → 团队快速对齐，不再花时间回顾数据

08:00  MO 处理 issue → 各 alert 有明确 owner + SLA
       → PQE 在系统内更新良率排查进展
       → Sourcing 在系统内更新材料替代方案
       → HR 在系统内更新加班人力安排

10:00  场景评估 → Production Plan Simulation
       → 修改参数一键重算（不再手动改 Excel）:
         Sim A: 良率恢复 85% + expedite → $120k, W04 gap: -3%
         Sim B: 良率维持 72% + partial build → $0, W04 gap: -15%
         Sim C: 加周末班 + partial expedite → $65k, W04 gap: -7%
       → Simulation Library 自动保存，可对比

       系统自动生成决策卡片:
         推荐 Sim C + 附 cost-benefit 分析
         → Owner 在系统内选择方案 → Decision Ledger 记录

15:00  条件变化（良率恢复到 78%）
       → 系统检测到 yield 变化 → 自动更新 alert severity
       → MO 在 Simulation 中修改良率参数 → 一键重算
       → 新场景 5 分钟出结果（不再花 1 小时）

17:00  EOD 汇总 → 一键生成
       "Generate Daily Post" → Slack/WeChat 直接发
       "Generate Daily Brief" → 结构化 BOD/EOD brief
       基于当天实际数据，不再手动写
```

#### 数据需求（在现有场景基础上新增）

| 数据 | 字段 | Ramp 期间特殊需求 |
|------|------|--------------------|
| Yield Trend | `site_id`, `line_id`, `date`, `fpy_rate` | 需要 3-day moving average 检测趋势下降 |
| UPH Ramp Curve | `line_id`, `workday_index`, `uph_factor` | Ramp 初期 UPH 按曲线爬升，非线性 |
| Yield Ramp Curve | `line_id`, `workday_index`, `yield_factor` | Ramp 初期良率按曲线爬升 |
| OT/Weekend Schedule | `site_id`, `date`, `shift_type`, `labor_fill_rate` | Ramp 期间频繁调整加班 |
| Cross-issue Correlation | issue_id × program_id × line_id | 多个 issue 同时影响同一 program |

#### 业务规则（Ramp 特有）

```
RULE-020: Ramp Yield Monitoring
  Track 3-day moving average of FPY per line
  IF ma3_fpy < target_fpy - 5pp → MEDIUM alert
  IF ma3_fpy < target_fpy - 10pp → HIGH alert
  Context: ramp 初期良率波动大，需要区分"正常爬坡波动"和"真实异常"

RULE-021: Multi-Issue Impact Aggregation
  当同一 program 同时存在 ≥2 个 HIGH alert:
  → 聚合 impact 计算（叠加效应，不是简单相加）
  → 自动提升为 CRITICAL 级别
  → 推送给 MO Lead + Program Director

RULE-022: Ramp Scenario Iteration
  Ramp 期间允许 same-day multiple simulations
  系统保留所有版本 (Sim A/B/C/...)，支持快速对比
  只有 promoted to POR 的版本才更新全局 commit baseline

RULE-023: Ramp Cross-Functional SLA
  Ramp 期间所有 HIGH alert SLA 压缩:
    Normal: 24h → Ramp: 12h
    Escalation: 48h → Ramp: 24h
```

#### 给合作团队的关键点

> **Ramp 是 FDOS 价值最大的场景。** 如果 FDOS 能在 ramp 期间让 MO 把"数据汇总+手动计算"从 3-4 小时压缩到 30 分钟，把"排产重算"从 1 小时压缩到 5 分钟，这个系统就会被天天用。
>
> 实现上的优先级建议：
> 1. Production Plan Simulation 的**一键重算**必须快（< 10 秒）
> 2. Alert 系统必须支持**多 issue 同时处理**和**聚合影响评估**
> 3. Daily Brief/Post 生成必须基于**当天实际数据**，不能是模板填空

---

## 第五部分：系统模块与数据流

### 模块关系图

```
┌──────────────────────────────────────────────────────────┐
│                    FDOS 系统架构                           │
│                                                          │
│  ┌─────────┐    ┌──────────────┐    ┌───────────────┐   │
│  │ 数据源   │───→│  数据标准化层  │───→│  业务逻辑层    │   │
│  │         │    │  (L1 → L2)   │    │  (L2 → L3)   │   │
│  │ MES     │    │ ETL/API      │    │ Commit 计算   │   │
│  │ MRP/SAP │    │ Data Schema  │    │ Alert 引擎    │   │
│  │ O9      │    │ Validation   │    │ Plan Engine   │   │
│  │ Excel   │    │              │    │ KPI 计算      │   │
│  └─────────┘    └──────────────┘    │ Impact Assess │   │
│                                     └───────┬───────┘   │
│                                             │           │
│                                    ┌────────┴────────┐  │
│                                    │    展示与交互层   │  │
│                                    │                 │  │
│                                    │ MO KPIs         │  │
│                                    │ Notification    │  │
│                                    │ Decision Center │  │
│                                    │ Prod Management │  │
│                                    │ Prod Planning   │  │
│                                    │ FV Cost         │  │
│                                    │ Campus Planning │  │
│                                    └─────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    AI 能力层                          │ │
│  │  Brief 生成 | 异常诊断 | Recovery Plan | Exec Email  │ │
│  │  L2→L3 自动化 | Impact Assessment | Primary Driver  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 数据流：从信号到决策

```
外部数据源                  FDOS 内部                    输出
─────────              ─────────────               ──────────
Demand (O9/Excel)  ──→ ┐
                       ├→ Commit Calculator ──→ Gap / Limiter
CTB (Sourcing)     ──→ ┘                              │
                                                       ↓
Capacity Config    ──→ Plan Engine ──→ Simulation ──→ POR
                                                       │
Output (MES)       ──→ ┐                               ↓
Yield (Quality)    ──→ ├→ Execution Monitor ──→ Alert Engine
Labor (HR)         ──→ ┘         │                     │
                                 ↓                     ↓
                     Impact Assessment          Decision Card
                      (4 维评估)                       │
                                 │                     ↓
                          KPI Calculator         Notification
                                 │                     │
                                 ↓                     ↓
                          Health Score          Action Tracking
                                 │                     │
                                 ↓                     ↓
                          Exec Summary        Leader 信息流闭环
                                                  (DRI 确认→
                                                   Leader 查看→
                                                   Comment)
```

### 页面 × 数据源 矩阵

| 页面 | Demand | CTB | Capacity | Output | Yield | Shipment | Labor | Cost |
|------|--------|-----|----------|--------|-------|----------|-------|------|
| **MO KPIs** | | | | ● | ● | ● | ● | ● |
| **Notification** | ● | ● | ● | ● | ● | ● | | |
| **Decision Center** | ● | ● | ● | ● | ● | ● | | |
| **Production Planning** | ● | ● | ● | | | | | |
| **Production Management** | ● | ● | ● | ● | ● | ● | | |
| **FV Cost** | | | | | | | | ● |
| **Campus Planning** | | | ● | | | | ● | |

---

## 第六部分：数据源清单与对接方案

> 以下数据源清单基于团队已完成的 Data Foundation 工作，明确了每个指标所需的输入参数、数据源系统、集成路径和责任方。

### KPI 数据管线详细清单

下表按 KPI 展开，列出每个指标所需的全部输入参数及其数据管线：

| Metric | Input Parameter | Data Source | Integration Source | Data DRI | Upload Mode | Refresh Freq |
|--------|----------------|-------------|-------------------|----------|-------------|-------------|
| **Ex-factory Commit Attainment %** | Supply Plan | CM APS / Manual | Meta owned | CM | System Push / Manual | Weekly |
| | Actual Ex-factory Shipment | CM WMS / Manual | ASN | CM | System Push / Manual | Daily |
| **Production Schedule Adherence %** | Production Plan | CM APS / Manual | APS | CM | System Push / Manual | Weekly |
| | Actual Production Input | CM MES | QuatumnBridge | CM | System Push / Manual | Daily |
| **Capacity Utilization** | Capacity Plan by Line | CM APS / Manual | APS | CM | System Push / Manual | Weekly |
| | Actual Production Input | CM MES | QuatumnBridge | CM | System Push / Manual | Daily |
| | Actual Production Output | CM MES | QuatumnBridge | CM | System Push / Manual | Daily |
| **Capacity Shortage %** | Ungated Capacity Plan | CM APS / Manual | APS | CM | System Push / Manual | Weekly |
| | ExF / Forecast | CM APS | APS | CM | System Push / Manual | Daily |
| **Manufacturing Lead Time** | Timeslot for Key Stations | CM MES | QuatumnBridge | CM | System Push | Daily |
| **Mfg Lead Time Achieve Rate** | Timeslot for Key Stations | CM MES | QuatumnBridge | CM | System Push | Daily |
| **BTO/CTO Mfg Lead Time** | Timeslot for Key Stations | CM MES | QuatumnBridge | CM | System Push | Daily |
| **BTO/CTO On-Time Ship %** | Timeslot for Key Stations | CM MES | QuatumnBridge | CM | System Push | Daily |
| **Labor Fulfillment %** | Labor Demand | CM Labor Tracker | csv to Mulesoft | CM | Manual | Weekly |
| | Labor Onboarded | CM Labor Tracker | csv to Mulesoft | CM | Manual | Weekly |
| **Campus Readiness On-Time %** | Campus Space Demand | Campus Database | csv to Mulesoft | MO | Manual | Monthly |
| | Campus Space Available | Campus Database | csv to Mulesoft | MO | Manual | Monthly |
| **Campus Utilization %** | Campus Space Used | Campus Database | csv to Mulesoft | MO | Manual | Monthly |
| | Campus Space Available | Campus Database | csv to Mulesoft | MO | Manual | Monthly |
| **FV Negotiation Rate** | Incurred FV Cost | FV Database | csv to Mulesoft | MO | Manual | Weekly |
| | Negotiated FV Cost | FV Database | csv to Mulesoft | MO | Manual | Weekly |
| **FV Cost per Unit** | Incurred FV Cost | FV Database | csv to Mulesoft | MO | Manual | Weekly |
| | Projected FV Cost | FV Database | csv to Mulesoft | MO | Manual | Weekly |
| | UDP Forecast | FV Database | - | MO | Manual | Weekly |

### 数据源系统汇总

| # | 数据源系统 | 类型 | 集成路径 | 自动化等级 | 涉及 KPI |
|---|-----------|------|---------|-----------|---------|
| S1 | **CM APS** | 排产/计划系统 | APS integration → FDOS | Tier 1（System Push） | Commit Attainment, Schedule Adherence, Capacity Utilization, Capacity Shortage |
| S2 | **CM MES** | 制造执行系统 | QuatumnBridge → FDOS | Tier 1（System Push） | All Lead Time metrics, On-Time Ship, Production actuals |
| S3 | **CM WMS** | 仓储管理系统 | ASN → FDOS | Tier 1（System Push） | Ex-factory Shipment Actual |
| S4 | **CM Labor Tracker** | 人力追踪 | csv → Mulesoft → FDOS | Tier 2（Manual csv） | Labor Fulfillment |
| S5 | **Campus Database** | 场地管理 | csv → Mulesoft → FDOS | Tier 2（Manual csv） | Campus Readiness, Campus Utilization |
| S6 | **FV Database** | 成本管理 | csv → Mulesoft → FDOS | Tier 2（Manual csv） | FV Negotiation Rate, FV Cost per Unit |
| S7 | **O9 / Excel** | 需求预测 | Excel upload → FDOS 解析 | Tier 2（半自动） | Demand Forecast (Simulation 输入) |
| S8 | **Manual Config** | 系统配置 | FDOS 内配置界面 | Tier 3（手动） | Holiday Calendar, Capacity Config, Ramp Curves |

**自动化等级定义：**
- **Tier 1（System Push）**：CM 系统已有集成通道（APS / QuatumnBridge / ASN），数据自动推送
- **Tier 2（csv/Excel 上传）**：通过 Mulesoft 或 FDOS 上传界面，系统解析
- **Tier 3（手动配置）**：FDOS 内配置界面，人工录入

### Simulation 引擎数据 Schema

Simulation 引擎使用的数据结构（独立于 KPI 管线，用于排产模拟）：

**Demand Forecast**
```
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| week_id | string | 周标识 (ISO week 起始日) | "2026/02/01" |
| program_id | string | 产品标识 | "product_a" |
| weekly_forecast | number | 本周需求量 | 95000 |
| cum_forecast | number | 累计需求量 | 285000 |
```

**CTB Data**
```
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| site_id | string | 站点 | "WF" |
| program_id | string | 产品 | "product_a" |
| date | string | 日期 | "2026-01-27" |
| ctb_qty | number | 当日可用材料量 | 5000 |
```

**Production Output**
```
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| site_id | string | 站点 | "WF" |
| line_id | string | 产线 | "WF-L1" |
| date | string | 日期 | "2026-01-27" |
| output_units | number | 产出数量 | 4200 |
| fpy_rate | number | 首次通过率 | 0.912 |
| uph_actual | number | 实际每小时产出 | 42 |
```

---

## 第七部分：业务规则汇总

### Alert 规则

| ID | 规则名称 | 触发条件 | 级别 | Owner | SLA |
|----|---------|---------|------|-------|-----|
| RULE-001 | Weekly Commit Gap | Gap% < -5% | MEDIUM | Operations | 48h |
| RULE-002 | Weekly Commit Critical | Gap% < -10% | HIGH | MO Lead + Program | 24h |
| RULE-003 | Yield Drop | FPY drop > 5pp in 3 days | HIGH | PQE | 24h |
| RULE-004 | Material Shortage | CTB coverage < 90% | MEDIUM | Sourcing | 48h |
| RULE-005 | Material Critical | CTB coverage < 80% | HIGH | Sourcing + MO | 24h |
| RULE-006 | Line Down | UPH = 0 for > 4h | HIGH | Factory Ops | 12h |
| RULE-007 | Cost Overrun | FV Cost > target + 3% | MEDIUM | Finance | 48h |
| RULE-008 | Labor Shortage | Fill rate < 95% | MEDIUM | HR / Ops | 72h |

### Simulation Version 规则

```
POR 版本号格式: vX.Y (Major.Minor)

Major version bump (X+1):
  - mode 变化 (unconstrained → constrained)
  - sites 变化 (增减站点)
  - date range 移动 > 7 天

Minor version bump (Y+1):
  - 其他配置变更 (UPH、良率曲线、节假日等)
```

---

## 第八部分：落地优先级与分阶段实现

### Priority 0：信息基础建设（立即开始）

**目标：想清楚"做什么"，定义好标准**

| 任务 | 说明 | 产出 |
|------|------|------|
| 信息清单定义 | 梳理所有模块所需数据项 | 完整信息清单（L1/L2/L3 分层） |
| KPI 标准化 | 每个 KPI 的定义 + 口径 + 来源 + 频率 | KPI 定义文档 |
| 影响评估模板设计 | 4 维 framework 的计算模板和逻辑 | Impact Assessment 设计文档 |

### Priority 1 — Phase 1 核心（月 1-2）

**目标：替代 weekly commit tracking 的 Excel 流程**

| 优先级 | 模块 | 功能 | 价值 |
|--------|------|------|------|
| P0 | 数据上传 | Demand Forecast + CTB Excel 上传 + 解析 | 数据入口 |
| P0 | Commit Calculator | 自动计算 gap / limiter / commit status | 核心计算 |
| P0 | Decision Center | 多 program commit 总览 | 替代 Excel |
| P1 | Production Planning | Simulation engine + POR management | 排产核心 |
| P1 | Alert Engine | 基于规则自动生成 alert + 4 维影响评估 | 替代邮件 |
| P2 | MO KPIs | Health score + metric cards | 管理层视图 |

**Phase 1 验收标准：**
- MO 团队每周用 FDOS 跟踪 commit，不再用 Excel
- Planning 用 FDOS 跑 simulation，不再手动计算
- Alert 替代部分邮件 escalation

### Priority 2 — Phase 1 增强（月 2-3）

**目标：信息流闭环 + 汇报自动化**

| 优先级 | 模块 | 功能 | 价值 |
|--------|------|------|------|
| P0 | MO KPI Dashboard | Health Score + KPI Item 级别展示 | 一屏看全 |
| P0 | Leader 信息流闭环 | DRI 确认 → Leader 查看 → Comment | Leader 不再到处找数据 |
| P1 | Daily Brief / Weekly Summary | AI 自动生成结构化汇报 | 替代手写汇报 |

### Priority 3 — Phase 2（月 3-4）

**目标：接入工厂数据 + 自动化升级**

| 优先级 | 模块 | 功能 | 价值 |
|--------|------|------|------|
| P0 | MES API | 自动采集 output / yield / UPH（L1→L2 自动化） | 消除手动数据搜集 |
| P0 | Production Management | 工厂执行控制面板 | Daily monitoring |
| P1 | 定时报告 + 自动分发 | scheduled generation + auto-send | 减少手动操作 |
| P1 | Decision Ledger | 决策记录 + 跟踪 + 闭环 | 积累决策数据 |

### Priority 4 — Phase 3（月 5-6）

**目标：AI 辅助决策 + 预测分析**

| 优先级 | 模块 | 功能 | 价值 |
|--------|------|------|------|
| P0 | AI 辅助影响评估 | 自动化 L2→L3（分析+影响评估） | 加速决策 |
| P0 | 预测性 Alert | 基于趋势预测未来风险 | 提前预警 |
| P1 | 跨场景 AI 诊断 | 多 issue 关联分析 + root cause | 全局视角 |
| P1 | AI Chatbot | 自然语言查询系统数据 | 降低使用门槛 |
| P2 | Decision Learning | 分析历史决策效果 | 持续优化 |

---

## 第九部分：权限模型（建议）

| 角色 | 查看 | 操作 | 审批 |
|------|------|------|------|
| **MO Admin** | All | All | POR promote, Config change |
| **MO User** | All | Create simulation, Generate brief | — |
| **Planning** | All | Upload forecast, Create simulation | — |
| **Sourcing** | Commit + Alert | Update CTB, Respond to alert | — |
| **Factory Ops** | Production Mgmt | Update line status, Respond to alert | — |
| **VP/Director** | KPI + Decision Center | — | Expedite, OT approval |
| **DRI** | Assigned items | Confirm + comment on system-generated content | — |
| **Viewer** | All (read-only) | — | — |

---

## 第十部分：验收与成功标准

### 量化指标

| 指标 | Baseline (现在) | Phase 1 目标 | Phase 2 目标 |
|------|----------------|-------------|-------------|
| Weekly commit 数据准备时间 | 1-2 天 | < 2 小时 | < 30 分钟 |
| 异常发现到决策时间 | 2-3 天 | < 24 小时 | < 12 小时 |
| Weekly report 撰写时间 | 2-3 小时 | < 30 分钟 | < 5 分钟（一键） |
| 排产模拟（改参数+重算） | 2-4 小时 | < 10 分钟 | < 5 分钟 |
| Commit 数据口径一致性 | 人工对齐 | 系统统一计算 | 系统统一计算 |
| Leader 获取信息耗时 | 多系统/多群/多人追问 | 一个平台 | 一个平台 + 自动推送 |

### 定性标准

- MO 团队每天主动打开 FDOS，而不是被提醒
- Weekly commit review 会议用 FDOS 投屏，不再用 Excel
- 异常处理在 FDOS 内闭环，不再用邮件来回
- Leadership 能在 FDOS 上看到实时 health score，不再等 weekly report
- Leader 通过 DRI 确认流程获取可信的 L3 信息，不再到处找人问

---

## 附录

### A. Prototype 演示环境

```bash
cd /path/to/FDOS
python3 -m http.server 8000
# 访问 http://localhost:8000/index_v2.html
```

Prototype 展示了目标态的 UI 和交互设计，合作团队可以直接参考 prototype 理解每个页面的布局、数据结构和用户操作流程。

### B. 相关文档

| 文档 | 内容 |
|------|------|
| `FDOS.md` | 系统完整架构和模块说明 |
| `REPOSITORIES.md` | 代码仓库和分支管理 |
| `PRODUCTION_PLAN_GENERATION_LOGIC.md` | 排产引擎详细计算逻辑 |
| `docs/PRODUCTION_CAPACITY_PLANNING_RULES.md` | 产能规划规则 |
| `docs/SIMULATION_VERSION_MANAGEMENT.md` | Simulation 版本管理规范 |
| `SHIPMENT_LOGIC_WITH_LEAD_TIME.md` | 出货逻辑和 lead time 规则 |

### C. 关键术语

| 术语 | 定义 |
|------|------|
| **Commit** | 本周承诺可交付的数量 |
| **CTB (Clear to Build)** | 材料齐套量，决定实际可投入生产的上限 |
| **Gap** | 可交付量 - 需求量（负数 = 缺口） |
| **FPY (First Pass Yield)** | 首次通过率，直接影响产出效率 |
| **UPH (Units Per Hour)** | 每小时产出量，衡量产线效率 |
| **POR (Plan of Record)** | 正式生产计划版本，所有人以此为准 |
| **Primary Limiter** | 约束产出的主要瓶颈（Capacity / CTB / Yield） |
| **WIP (Work in Process)** | 在制品，已投入但尚未完成的产品 |
| **MIL (Manufacturing Issue Log)** | 制造问题台账 |
| **FATP** | Final Assembly, Test & Pack（最终组装、测试和包装） |
| **DRI (Directly Responsible Individual)** | 直接负责人，对信息准确性和行动负责 |
| **Operational Intelligence** | 运营洞察——经过分析和影响评估的 L3 层决策级信息 |
| **Impact Assessment** | 影响评估——4 维框架（Input/Output/Shipment/Commitment） |

### D. 设计决策记录

| # | 决策 | 方案 | 状态 |
|---|------|------|------|
| 1 | L3 层命名 | Operational Intelligence（运营洞察） | ✓ 已确认 |
| 2 | DRI 角色权限 | 确认 + 补充评论（不可编辑系统生成内容）— Phase 1 方案 | ✓ 已确认 |
| 3 | KPI 细化程度 | 细化到每个具体 KPI item 级别（计算公式、数据源、更新频率） | ✓ 已确认 |

---

*文档版本：v2.0*
*最后更新：2026-03-11*
*v2.0 更新：重大概念重构——从"系统功能导向"转为"用户工作流导向"；新增信息三层模型（L1/L2/L3）、4 维影响评估框架、KPI Item 级别自动化细节、Leader 信息流闭环、落地优先级重排（Priority 0-4）*
