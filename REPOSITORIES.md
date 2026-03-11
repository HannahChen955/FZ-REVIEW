# FDOS Repository Structure

This document explains the repository organization for the FDOS (Factory Delivery Orchestration System) project.

## 📦 Repositories

### 1. Main Repository - FDOS Core System
**Repository URL:** https://github.com/HannahChen955/SCDO---Factory-Execution-Loop.git

**Purpose:** Main codebase and project files

**Content:**
- Core FDOS application code
  - `app_v2.js` - Main application logic
  - `index_v2.html` - Main UI
  - `router.js` - Routing logic
  - Production Plan modules
    - `production_plan_config.js`
    - `production_plan_engine.js`
    - `production_plan_seed_data.js`
  - `simulation_manager.js` - Simulation management
- Documentation
  - Technical specs
  - Implementation guides
  - Testing documentation
- Demos and utilities
  - CTB Demo/
  - Demo Summary/
  - Diagnostic tools (`diagnose_*.html`)
  - `operations_workflow_optimization.html`
- All other project files **EXCEPT** Team-AI-Strategy content

**Update Policy:**
- Push all code changes and documentation updates here
- Do NOT include Team-AI-Strategy folder content

---

### 2. Team AI Strategy Repository
**Repository URL:** https://github.com/HannahChen955/Team-AI-Strategy

**Purpose:** Dedicated repository for Team AI Strategy showcase and documentation

**Content:**
- Team-AI-Strategy/ folder content only
  - AI strategy documentation
  - Best practices
  - Team learning resources
  - AI integration guides

**Update Policy:**
- Push ONLY Team-AI-Strategy related content here
- Separate from main FDOS codebase

---

### 3. FZ-Review Repository
**Repository URL:** https://github.com/HannahChen955/FZ-REVIEW

**Purpose:** Dedicated repository for FZ Review demo branch — experimental UI/presentation changes, SCO KPI alignment, and FDOS briefing document updates.

**Content:**
- Full FDOS codebase on the `FZ-Review` branch
- SCO-aligned KPI framework updates (MO KPIs, Data Foundation)
- FDOS_BRIEFING.md conceptual restructure (v2.0)
- Before/After operating model tables
- Impact Assessment Chain, DRI confirmation loop, Report Center

**Update Policy:**
- Push FZ-Review branch changes here: `git push fz-review FZ-Review`
- Remote name: `fz-review`

---

## 🌿 Active Branches

### `main` — Stable Production Branch
The default branch with all validated, production-ready code.

### `FZ-Review` — Experimental Branch (Created 2026-03-10)
**Purpose:** Experimental UI/presentation changes for FZ Review demo preparation.

**Branch base:** `main` @ commit `040e8a4`

**Changes included at branch creation:**
- Renamed app from "SCDO Control Tower" to "FDOS — Factory Delivery Orchestration System"
- Added demo calendar events for March (China AI Day, FZ Review, NPI Review, Echo's All Hands)
- Swapped To-Do List and Calendar order on Notification page

**Safety:**
- All experimental changes happen here — `main` is unaffected
- Merge back to `main` when satisfied: `git checkout main && git merge FZ-Review`
- Discard if not needed: `git branch -D FZ-Review`

---

## 🔄 Workflow

### When updating FDOS core features:
```bash
# Navigate to FDOS directory
cd /Users/chenhan/Documents/FDOS

# Stage all changes EXCEPT Team-AI-Strategy
git add .
git reset Team-AI-Strategy/  # Unstage Team-AI-Strategy if accidentally added

# Commit and push
git commit -m "Your commit message"
git push origin main
```

### When updating Team AI Strategy content:
```bash
# Navigate to Team-AI-Strategy directory
cd /Users/chenhan/Documents/FDOS/Team-AI-Strategy

# Work with the Team-AI-Strategy repository
# (Assuming it's set up as a separate git repo or submodule)
git add .
git commit -m "Update AI strategy content"
git push origin main
```

---

## 📝 Notes

- **Main repo** = Everything EXCEPT Team-AI-Strategy
- **Team AI Strategy repo** = ONLY Team-AI-Strategy content
- Keep the two repositories separate to maintain clean version control
- This separation allows different audiences to access relevant content independently

---

## 🚀 Local Development Server

### Starting the server:
```bash
# Navigate to FDOS directory
cd /Users/chenhan/Documents/FDOS

# Start HTTP server on port 8000
python3 -m http.server 8000
```

### Access the application:
- **Main Application:** http://localhost:8000/index_v2.html
- **Server Port:** 8000

### Notes:
- The server must be running to access the application
- Use Python's built-in HTTP server for local development
- If you restart your computer, you'll need to start the server again

---

**Last Updated:** 2026-03-11
