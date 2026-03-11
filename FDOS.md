# FDOS — Factory Delivery Orchestration System

> Turning factory execution signals into delivery decisions.

FDOS closes the missing factory link by standardizing execution signals and routing decisions with evidence. In complex manufacturing environments, operational signals often remain fragmented across planning systems, factory reports, and communication channels. FDOS converts these signals into structured insights that enable faster and more reliable operational decisions.

---

## 1. Why This Exists

Factory execution is often the least standardized segment of the end-to-end supply chain. Operational signals originate from multiple sources — factory production reports, material readiness updates, planning systems, engineering change notifications, logistics updates — but when these signals are incomplete or inconsistent, planning assumptions become unreliable and decision-making relies on manual reconciliation and experience-driven interpretation.

**Factory signals often do not travel cleanly across the chain.** FDOS exists to convert factory reality into decision-grade signals that planners and operational leaders can rely on.

### Operational Friction

| Area | Problem |
|------|---------|
| **Metric Inconsistency** | Similar terminology but different definitions across systems, requiring manual reconciliation |
| **Messy Inputs** | Missing fields, inconsistent formats, partial updates — reducing data confidence |
| **High Change Speed** | Factory conditions evolve continuously; dashboards and reports lag behind real conditions |
| **Truth Lives Offline** | Critical context exists in meetings, chat threads, or spreadsheets rather than structured systems |

---

## 2. Manufacturing Operations — The Cross-Constraint Orchestrator

MO operates at the intersection of multiple operational constraints, continuously balancing three shifting forces:

- **Supply Variability** — Material availability, supplier lead times, component readiness
- **Demand Volatility** — Forecast changes, order shifts, commitment adjustments
- **Factory Capacity** — Production throughput, yield rates, resource constraints

MO acts as the coordination layer that translates evolving factory conditions into executable supply outcomes. This orchestration role becomes increasingly critical as product portfolios expand and operational complexity grows.

---

## 3. How FDOS Works — Signal to Decision

FDOS transforms fragmented operational signals into structured decision workflows through four mechanisms:

1. **Standardize** — Operational signals use shared definitions for metrics, data granularity, and refresh cadence. Signals carry consistent meaning across systems and teams.
2. **Validate** — Each signal receives confidence indicators (freshness, completeness, reconciliation status). Decision-makers can distinguish reliable signals from noise.
3. **Route Decisions** — When signals indicate delivery risk, FDOS routes to responsible owner with evidence, context, action options, and response expectations.
4. **Close the Loop** — Decisions and outcomes are recorded for continuous learning. A feedback loop improves decision accuracy over time.

### Operational Rhythm

| Cadence | Purpose |
|---------|---------|
| **Weekly** | Delivery commitments established; FDOS monitors alignment with factory execution signals |
| **Daily** | Material readiness, capacity signals, yield updates continuously refresh execution visibility |
| **48-Hour Window** | Prioritizes limited set of decisions that can still change weekly outcome |

**Closed-loop execution chain:**
```
Plan → Constraints → Inputs → Outputs → Shipment Readiness → Commit → Exceptions → Actions → Learning
```

---

## 4. System Architecture — Pages & Modules

### Page Flow

The seven pages form a complete execution operating system:

```
MO KPIs (monitor)
    ↓ signal detected
Notification (alert)
    ↓ action required
Decision Center (decide)
    ↓ execution
Production Management (execute)
    ↓ planning
Production Planning (plan)
    ↓ cost
FV Cost Management (cost)
    ↓ infrastructure
Campus Planning (site)
```

### 4.1 Overview

**Route:** `#/overview`

System landing page. Presents the FDOS vision, MO's role as cross-constraint orchestrator, the signal-to-decision mechanism, operational rhythm, Future Smart Factory north star, and implementation plan.

### 4.2 Notification (Execution Inbox)

**Route:** `#/notification`

Operational signal aggregation. Surfaces alerts, calendar events, and to-do items across the factory network. Includes AI-generated alert briefs that synthesize active execution risks into structured summaries with severity, impact, and recommended actions.

### 4.3 Decision Center

**Route:** `#/portfolio`

Multi-program aggregation for execution decisions. Portfolio-level view showing program health, commit confidence, gap analysis, and risk drivers across Products A–D. AI-assisted capabilities include executive summaries, commit diagnosis, recovery plans, and leadership asks.

**Key sections:**
- Portfolio Health Overview — program status cards with health indicators
- Weekly Commit Snapshot — demand, capacity, CTB, ship, gap by program
- Commit Confidence Tracker — confidence levels with driver attribution
- Decision Ledger — active decisions requiring attention

### 4.4 MO KPIs (Operational Health Monitor)

**Route:** `#/moKpis`

System health view for MO execution. Restructured around three metric dimensions:

**Sections (top to bottom):**
1. **Operational Health Index** — overall score with sub-scores for Execution, Resources, Cost
2. **Priority Actions** — KPI-driven signals with severity, impact, and "View Signal" links to related pages
3. **Execution Metrics** — Production Output, Shipment, Schedule Adherence (with trend charts and drivers)
4. **Resource Metrics** — Labor Fill, Line Utilization, Material Readiness
5. **Cost Metrics** — Manufacturing Cost (FV) with breakdown (Material, Labor, Overhead, Rework)
6. **Execution by Site** — WF and VN02 side-by-side comparison (Output, Yield, Labor Fill)

Every metric card includes a "View Signal →" link connecting to the relevant execution page, making KPIs function as a signal routing system rather than a passive dashboard.

### 4.5 Production Planning

**Route:** `#/production-plan`

Site-level capacity planning, simulation engine, and plan of record management.

**Tabs:**
1. **Production Planning** — Plan inputs: demand forecast upload, CTB data, capacity configuration (Site → Line → Shift), working parameters, holiday management, output flow-time factors. Simulation engine generates unconstrained/constrained/combined plans.
2. **Simulations** — Latest Simulation results (summary metrics, truth table with daily/weekly/monthly granularity, constraint analysis) + Simulation Library (saved simulations organized by projects, with View Report / Promote to POR / Delete actions). Auto-navigates here after generating a new simulation.
3. **POR (Plan of Record)** — Active plan of record, promoted from simulation library
4. **POR Version History** — Historical POR versions for comparison and audit

**Simulation Engine features:**
- Unconstrained / Constrained / Combined mode
- Daily truth table: Forecast, CTB, Capacity, Input, Output, Ship, Gap, Binding Driver
- Cutoff summaries (this week / year end)
- Primary binding constraint analysis (CTB-limited vs Capacity-limited)
- AI Assistant for natural language plan configuration

### 4.6 Production Management (Factory Execution Control Panel)

**Route:** `#/production-mgmt`

Real-time factory execution monitoring.

**Action bar:**
- Generate Daily Brief — structured BOD/EOD brief (AI drawer)
- Generate Daily Post — short narrative for Slack/WeChat (AI drawer)
- Generate Exec Summary — VP-level weekly summary (AI drawer)
- Export Snapshot — download current state

**Sections:**
1. **Factory Execution Snapshot** — 4 KPI cards: Today's FATP Output, Yield (FPY), Material Readiness, Active Alerts
2. **Production IO Status** — Table with Products A–D: Demand, Capacity, CTB, Expected Output, Ship, Gap, Gap%, Primary Limiter (data from command center)
3. **Line Execution** — Per-line cards (WF-L1, WF-L2, VN02-L1) showing UPH, Yield, WIP, Status
4. **Manufacturing Issue Tracker (MIL)** — Issue table: ID, Issue, Severity, Program, Line, Status, Owner, Days Open

### 4.7 FV Cost Management

**Route:** `#/fv-management`

Factory variance cost tracking and analysis.

### 4.8 Campus Planning

**Route:** `#/campus-readiness`

Location and space utilization planning.

### 4.9 Program Workspace (per-product deep dive)

Accessible via product selection. Includes:
- **Delivery Command Center** (`#/home`) — Weekly commit tracking, demand attainment, gap analysis
- **Manufacturing Lead-time** (`#/mfg-leadtime`) — End-to-end process timeline
- **BTO/CTO Lead-time** (`#/bto-cto-leadtime`) — Standard vs actual performance
- **Labor Fulfillment** (`#/labor-fulfillment`) — Weekly headcount status
- **Signals** (`#/signals`) — Program-specific operational signals
- **Risk Radar** (`#/radar`) — Risk visualization and scoring
- **Actions/Orchestration** (`#/actions`) — Playbook generation, action drafting
- **Reports** (`#/reports`) — Configurable reports and exec email drafts

---

## 5. AI Integration

AI is embedded as a system capability across FDOS, not a standalone feature. It uses the existing AI drawer pattern (slide-in panel with loading state → formatted response).

### AI-Powered Actions by Page

| Page | AI Actions |
|------|-----------|
| **Decision Center** | Exec summary, commit diagnosis, recovery plan, leadership ask draft |
| **Notification** | Alert brief generation (synthesizes active alerts into structured brief) |
| **Production Management** | Daily brief, daily post (Slack/WeChat), exec summary |
| **Production Planning** | AI Assistant for natural language plan configuration |
| **Delivery Command Center** | Commit diagnosis, recovery plan, leadership ask |
| **Signals** | Signal ingestion and interpretation |
| **Risk Radar** | Risk score interpretation, scenario explanation |
| **Actions** | Playbook generation, action message drafting |
| **Reports** | Report customization, exec email drafts |

### AI Response System

- Mock AI system (`ai_system.js`) provides structured responses per action type
- Supports future migration to real API (OpenAI/Claude) via `AI_CONFIG.useRealAPI` toggle
- Responses include: summary, drivers, actions, asks, evidence, drafts, explanations
- AI drawer (`index_v2.html`) is a shared UI component across all pages

---

## 6. Data Sources

| Source | Purpose |
|--------|---------|
| `command_center_data.js` | Weekly commit data by product (A–D): demand, capacity, CTB, output, ship, gap, limiter |
| `production_plan_engine.js` | Simulation engine: generates daily/weekly plans from capacity config |
| `production_plan_config.js` | Capacity configuration: sites, lines, shifts, UPH, yield curves |
| `production_plan_seed_data.js` | Demo data for simulation scenarios |
| `simulation_manager.js` | Simulation CRUD: create, save, promote to POR, version management |
| `forecast_ctb_manager.js` | Demand forecast and CTB data upload/versioning |
| `ai_system.js` | AI response system (mock + real API support) |
| Inline seed data | KPI data (`getKPIDataByProduct`), line execution, MIL tracker, notification alerts |

---

## 7. North Star — Future Smart Factory

FDOS represents an important step toward a future operating model in which manufacturing execution becomes increasingly autonomous.

### Operating Model Evolution

| Stage | Model | Description |
|-------|-------|-------------|
| **Stage 1** | Manual Stabilization | Operational teams manually detect and resolve issues as they arise |
| **Stage 2** | System-Enabled Orchestration | FDOS consolidates operational signals and coordinates execution decisions across factory network *(current)* |
| **Stage 3** | AI-Driven Execution | AI agents manage routine operational decisions using predefined guardrails; human operators oversee strategic decisions and exceptions |

### Human Role Evolution

```
Manual Operator → Execution Coordinator → System Orchestrator
```

Teams evolve to focus on:
- Evaluating operational trade-offs
- Resolving ambiguous situations
- Guiding factory execution under changing conditions

---

## 8. Implementation Plan

### Functional Modules

| Module | Type | Resources | Dev Plan |
|--------|------|-----------|----------|
| Overall Framework | New System Architecture | BET / MO | Under discussion |
| Data Integration | Platform Integration | BET / MO | Phase I: Apr-26 |
| APR System (Production Planning) | System Upgrade | BET / O9 | Under discussion |
| Campus Planning System | New System | MO | Phase I: Apr-26 |
| Production Dashboard System | System Upgrade | MO | Phase I: Apr-26 |
| FV Cost Management System | New System | MO | Phase I: May-26 |
| KPIs Dashboards | System Upgrade | MO / BET | Phase I: Apr-26 |

### Development Phases

**Phase 1: Foundation & Core Capabilities** (Q1 2026: Jan–Mar)
- System architecture, data models, core operational modules
- Manual data input with standardized templates and calculation engines
- Deliverables: Delivery Command Center, Production Plan Engine, Decision Center, Data Foundation

**Phase 2: External Integration & Automation** (Q2–Q3 2026: Apr–Sep)
- API integrations with contract manufacturers, suppliers, logistics providers
- Automated data collection, validation, alert & notification system

**Phase 3: Intelligence & Advanced Analytics** (Q4 2026: Oct–Dec)
- AI chatbot assistant, predictive analytics, automated recommendations
- Knowledge base for organizational learning

**Phase 4: Ecosystem Expansion & Optimization** (2027+)
- Upstream planning integration, quality & yield analytics
- Advanced simulation, collaboration platform

### Timeline

| Quarter | Milestone |
|---------|-----------|
| Q1 2026 | Foundation Launch — Phase 1 complete with manual data input |
| Q2 2026 | Integration Pilot — Begin Phase 2 with 1-2 CM integrations |
| Q3 2026 | Integration Expansion — Scale across all major suppliers |
| Q4 2026 | AI Foundation — Chatbot and initial predictive analytics |
| 2027 | Intelligence & Ecosystem — Complete Phase 3, initiate Phase 4 |

---

## 9. Key Success Metrics

| Metric | Description |
|--------|-------------|
| **Manual Work Reduction** | Reduction in repetitive data collection and reporting |
| **Data Accuracy** | Improved data integrity through standardized processes |
| **Decision Speed** | Accelerated decision-making through real-time visibility |
| **Process Standardization** | Adoption of unified metrics across programs and sites |
| **Data Visibility** | Transition from periodic reports to continuous monitoring |
| **Knowledge Access** | Usage of on-demand information retrieval via AI assistant |

---

## 10. Technical Architecture

### File Structure

```
FDOS/
├── index_v2.html           # Main UI shell, AI drawer, navigation
├── app_v2.js               # All page rendering logic (~15k lines)
├── router.js               # URL hash routing
├── ai_system.js            # AI response system (mock + real API)
├── command_center_data.js   # Weekly commit data by product
├── production_plan_engine.js # Simulation engine
├── production_plan_config.js # Capacity configuration
├── production_plan_seed_data.js # Demo scenarios
├── simulation_manager.js    # Simulation CRUD + POR management
├── forecast_ctb_manager.js  # Demand forecast & CTB upload
└── docs/                    # Technical documentation
```

### Key Patterns

- **Single-page application** with hash-based routing (`router.js`)
- **String concatenation** for complex HTML (avoids nested template literal issues)
- **Global state** via `window.productionPlanState`, `STATE` object
- **AI drawer** shared component: loading spinner → formatted response
- **Notification toast** system via `showNotification()`
- **Product filter** system: Products A–D with per-product data throughout
- **localStorage** for persistence: forecast versions, CTB versions, simulation data, tab state

### Local Development

```bash
cd /Users/chenhan/Documents/FDOS
python3 -m http.server 8000
# Open http://localhost:8000/index_v2.html
```

---

## 11. Repository

**Main:** https://github.com/HannahChen955/SCDO---Factory-Execution-Loop.git

**Branches:**
- `main` — Stable production branch
- `FZ-Review` — Experimental branch for UI/presentation changes

---

*Last Updated: 2026-03-11*
