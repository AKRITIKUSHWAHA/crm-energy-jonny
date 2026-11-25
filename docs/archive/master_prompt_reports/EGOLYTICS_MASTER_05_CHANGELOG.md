# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: SYSTEM CHANGELOG

**Document ID:** EGOLYTICS-MP05-CHANGELOG-008  
**Release Version:** 1.5.0-egolytics  
**Implementation Phase:** Master Prompt 05 of 16  
**Module Name:** Advanced Task, Sprint, Backlog & Critical-Path Scheduling Engine (`mod-05-tasks`)  
**Release Date:** November 2026  

---

## 1. SUMMARY OF CHANGES

Master Prompt 05 introduces operational work assignment, drag-and-drop Kanban boards, sprint lifecycle with velocity tracking, prioritized product backlog, predecessor-successor task dependencies with cycle detection, mathematical Critical Path Method (CPM), schedule baselines, and variance alerts.

---

## 2. DATABASE SCHEMA MODIFICATIONS (NON-DESTRUCTIVE)

### 2.1 Additive Columns on `tasks` Table
- `projectId`: Foreign key linking task to `erp_projects.id` (`ErpProject`).
- `sprintId`: Foreign key linking task to `rd_sprints.id` (`RdSprint`).
- `stageId`: Foreign key linking task to `rd_innovation_stages.id` (`RdInnovationStage`).
- `taskType`: Classification (`TASK`, `USER_STORY`, `RESEARCH_SPIKE`, `BUG`, `TECHNICAL_DEBT`, `SUBTASK`).
- `rdStatus`: R&D lifecycle status (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`, `CANCELLED`).
- `startDate`: Planned or actual start datetime.
- `estimatedHours`: Effort estimation in decimal hours.
- `actualHours`: Logged work effort in decimal hours.
- `progress`: Task completion percentage ($0 - 100\%$).
- `sortOrder`: Priority ranking order index for backlog sequencing.
- `isBacklog`: Boolean flag indicating uncommitted backlog state.

### 2.2 New Database Tables Created
1. `rd_sprints`: Manages sprint cycles, goals, dates, capacity hours, velocity, and statuses (`PLANNED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
2. `rd_task_dependencies`: Manages directed dependency edges with link types (`FS`, `SS`, `FF`, `SF`) and lag days.
3. `rd_task_schedule_baselines`: Stores immutable schedule snapshots for project drift and variance computation.
4. `rd_schedule_alerts`: Stores proactive schedule alerts (`OVERDUE`, `DUE_SOON`, `DEPENDENCY_BLOCKED`, `CRITICAL_PATH_DELAY`) with deduplication.

### 2.3 Prisma Client Generation
- Updated `backend/prisma/schema.prisma` with reverse relations on `Tenant`, `User`, `ErpProject`, and `RdInnovationStage`.
- Executed `npx prisma generate` generating Prisma Client v6.4.1.

---

## 3. BACKEND API EXTENSIONS

### 3.1 New Service: `backend/src/services/rdTaskService.js`
- Task CRUD with dual CRM/R&D status synchronization.
- Blocker calculation checking incomplete predecessor tasks.
- Sprint lifecycle management (create, start, complete, velocity calculation, incomplete task rollover).
- Backlog retrieval, drag reordering, and sprint commitment.
- Task dependency management with Tarjan/DFS circular dependency detection.
- Mathematical Critical Path Method (CPM) using Kahn's topological sort, forward pass ($ES, EF$), backward pass ($LS, LF$), total float, and critical path identification.
- Schedule baseline snapshot capture and variance calculation.
- Automated schedule variance alert detection, deduplication, and resolution.

### 3.2 New Controller: `backend/src/controllers/rdTaskController.js`
- Implemented 18 controller methods covering tasks, sprints, backlog, dependencies, CPM, baselines, and alerts.
- Formatted status codes: HTTP 200/201 on success, HTTP 400 on circular dependencies/validation, HTTP 404 on not found.

### 3.3 New Routes Mounted in `backend/src/routes/rdRoutes.js`
- Tasks: `GET/POST /api/rd/tasks`, `GET/PUT/DELETE /api/rd/tasks/:id`, `PATCH /api/rd/tasks/:id/status`.
- Sprints: `GET/POST /api/rd/sprints`, `PUT /api/rd/sprints/:id`, `POST /api/rd/sprints/:id/start`, `POST /api/rd/sprints/:id/complete`.
- Backlog: `GET /api/rd/backlog`, `POST /api/rd/backlog/reorder`, `POST /api/rd/backlog/commit`.
- Dependencies: `GET/POST /api/rd/dependencies`, `DELETE /api/rd/dependencies/:id`.
- CPM & Baseline: `GET /api/rd/cpm/:projectId`, `POST /api/rd/schedule/baseline`, `GET /api/rd/schedule/variance/:projectId`.
- Alerts: `GET /api/rd/schedule/alerts`, `POST /api/rd/schedule/alerts/scan`, `POST /api/rd/schedule/alerts/:id/resolve`.

### 3.4 Telemetry Update in `backend/src/controllers/rdController.js`
- Telemetry updated to `executionPrompt: 'Master Prompt 05 of 16'`.
- Status updated to `status: 'ACTIVE_TASK_SPRINT_SCHEDULING'`.
- Module `mod-05-tasks` marked `status: 'ACTIVE'` mapping all 10 client requirements.

---

## 4. FRONTEND EXTENSIONS

### 4.1 New Page Component: `frontend/src/pages/rd/RdTasks.jsx`
- Interactive sub-views: Kanban Board, Backlog Planning, Sprints Management, Gantt Schedule, Critical Path (CPM), and Schedule Alerts.
- Native HTML5 drag-and-drop for Kanban workflow stages.
- Modals for Task Creation/Editing, Sprint Creation, Dependency Linking, and Sprint Closure.
- Responsive table for Backlog priority ranking.
- Interactive Gantt timeline bars with progress fill.
- CPM mathematical network table with early/late dates, floats, and zero-float critical chain highlight.

### 4.2 Workspace Navigation in `frontend/src/pages/rd/EgolyticsHub.jsx`
- Imported `RdTasks` and mounted under primary tab `tasks` ("Tasks & Sprints").
- Updated KPI cards and telemetry indicators to Master Prompt 05.
- Synchronized path routing for `/crm/rd/tasks`, `/crm/rd/sprints`, and `/crm/rd/backlog`.

### 4.3 Navigation & RBAC Configuration
- Added `rd-tasks` navigation entry in `frontend/src/data/mockData.js`.
- Configured RBAC mappings in `frontend/src/utils/rbac.js` for 12 business personas.

---

## 5. QUALITY ASSURANCE & VERIFICATION

- **Automated Test Suite:** Created `backend/test_egolytics_master_05.js` with 35 test cases $\rightarrow$ **35/35 PASSED (100%)**.
- **Regression Testing:**
  - Master Prompt 02: 20/20 PASSED (100%).
  - Master Prompt 03: 18/18 PASSED (100%).
  - Master Prompt 04: 19/19 PASSED (100%).
  - Combined Total: **92/92 automated checks passed with zero regressions**.
- **Data Integrity:** All 14 users and 2 tenants preserved without deletion.
- **Frontend Build:** Verified with `vite build` $\rightarrow$ built cleanly in 1.89 seconds.

---
*Changelog certified by Principal Software Architect & Release Engineer.*
