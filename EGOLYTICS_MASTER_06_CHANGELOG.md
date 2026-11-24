# EGOLYTICS MASTER PROMPT 06: CHANGELOG & INVENTORY

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 06 of 16  
**Scope:** Gantt, Timeline, Dependencies & Critical Path Engine  
**Date:** 2026-11-24  

---

## 1. Summary of Changes

Master Prompt 06 delivers an interactive, database-driven Gantt Chart, Project Roadmap, and Chronological Timeline engine by extending the CRM nErgy platform and integrating with Master Prompt 05 dependency and Critical Path Method (CPM) services.

---

## 2. Database Modifications

### 2.1 New Table: `rd_milestones`
- Columns: `id`, `tenantId`, `projectId`, `title`, `description`, `milestoneCode`, `milestoneType`, `plannedStartDate`, `plannedEndDate`, `actualStartDate`, `actualCompletionDate`, `status`, `progress`, `priority`, `ownerId`, `sortOrder`, `createdAt`, `updatedAt`.
- Foreign Keys: `tenantId` $\rightarrow$ `tenants(id)`, `projectId` $\rightarrow$ `erp_projects(id)`, `ownerId` $\rightarrow$ `users(id)`.
- Indexes: `tenantId`, `projectId`, `status`, `ownerId`.

### 2.2 Table Extension: `tasks`
- Added column: `milestoneId VARCHAR(191) NULL`.
- Added foreign key: `milestoneId` $\rightarrow$ `rd_milestones(id) ON DELETE SET NULL`.
- Added index: `idx_tasks_milestoneId`.

### 2.3 Migration Scripts & Schema Update:
- `backend/scripts/migrate_master_06.js` (Executed non-destructive additive migration).
- `backend/prisma/schema.prisma` (Added `RdMilestone` model, updated relations on `Tenant`, `User`, `ErpProject`, and `Task`).
- Generated updated Prisma Client v6.4.1.

---

## 3. Backend Services & Controllers Added / Modified

### 3.1 New Backend Services:
- **`backend/src/services/rdMilestoneService.js`:**
  - `getMilestones(tenantId, filters)`: Retrieves project milestones with dynamic task progress rollups and delayed status calculation.
  - `getMilestoneById(tenantId, id)`: Detailed single milestone retrieval.
  - `createMilestone(tenantId, data, userId)`: Validated milestone creation with code generation and initial task linking.
  - `updateMilestone(tenantId, id, data)`: Field update with validation.
  - `updateMilestoneStatus(tenantId, id, status, note, userId)`: Lifecycle state transitions.
  - `deleteMilestone(tenantId, id)`: Safe deletion (unlinking tasks).
  - `linkTasksToMilestone(tenantId, milestoneId, taskIds)`: Task association and progress recalculation.
- **`backend/src/services/rdGanttService.js`:**
  - `getProjectGanttData(tenantId, projectId)`: Synthesizes tasks, milestones, SVG connectors, CPM metrics, baselines, and alerts.
  - `updateTaskScheduleDates(tenantId, taskId, data, userId)`: Drag-and-drop date rescheduling with automatic CPM and alert recalculation.
  - `getProjectRoadmap(tenantId, projectId)`: Flightpath phases, milestone deliverables, and critical chain.
  - `getProjectTimeline(tenantId, projectId, filters)`: Chronologically sorted unified event stream with real-time filtering.

### 3.2 New Backend Controllers:
- **`backend/src/controllers/rdMilestoneController.js`:** REST endpoints for milestone CRUD.
- **`backend/src/controllers/rdGanttController.js`:** REST endpoints for Gantt dataset, date patching, roadmap, and timeline.

### 3.3 Route & Telemetry Updates:
- **`backend/src/routes/rdRoutes.js`:**
  - Mounted `/milestones` (GET, POST)
  - Mounted `/milestones/:id` (GET, PUT, DELETE)
  - Mounted `/milestones/:id/status` (POST)
  - Mounted `/milestones/:id/tasks` (POST)
  - Mounted `/gantt/:projectId` (GET)
  - Mounted `/gantt/tasks/:id/dates` (PATCH)
  - Mounted `/roadmap/:projectId` (GET)
  - Mounted `/timeline/:projectId` (GET)
- **`backend/src/controllers/rdController.js`:**
  - Updated status telemetry: `executionPrompt: 'Master Prompt 06 of 16'`, `status: 'ACTIVE_GANTT_TIMELINE_SCHEDULING'`, `mod-06-scheduling: ACTIVE`.

---

## 4. Frontend Components Added / Modified

### 4.1 New Pages:
- **`frontend/src/pages/rd/RdGanttWorkspace.jsx`:**
  - Interactive multi-timescale Gantt chart (Day, Week, Month).
  - SVG orthogonal cubic Bezier dependency connectors (FS, SS, FF, SF).
  - Critical path glow highlighting ($T_{\text{float}} = 0$).
  - Baseline comparison overlay with schedule variance drift.
  - Drag-and-drop date rescheduling with API persistence.
  - Project Roadmap flightpath view.
  - Chronological timeline event stream view.
  - Milestone management modal and CRUD table.

### 4.2 Updated Pages:
- **`frontend/src/pages/crm/erp/ErpProjectDetail.jsx`:**
  - Eliminated static hardcoded milestone array.
  - Added live API fetch from `/api/rd/milestones?projectId=${id}`.
  - Added dynamic phase count and "+ Add Milestone" dialog.
  - Added direct navigation button to the Gantt & Roadmap workspace.
- **`frontend/src/pages/rd/EgolyticsHub.jsx`:**
  - Added `Gantt & Roadmap` tab.
  - Updated `getTabFromPath` for `/gantt`, `/roadmap`, `/timeline`, and `/milestones`.
  - Integrated `RdGanttWorkspace`.
  - Updated active Master Prompt KPICard to Master Prompt 06.
- **`frontend/src/data/mockData.js`:**
  - Registered `rd-gantt` navigation item (`/crm/rd/gantt`) in EgoLytics R&D section.
- **`frontend/src/utils/rbac.js`:**
  - Added `rd-gantt` and routes to `business_owner`, `admin_1`, `super_admin`, and `NAV_TO_ROUTES_MAP`.

---

## 5. Test Suites Added

- **`backend/test_egolytics_master_06.js`:**
  - 35 automated checks covering telemetry, dynamic milestone lifecycle, progress rollup, Gantt dataset, CPM mathematical verification ($T = 14$ days, $A \rightarrow B \rightarrow D \rightarrow F$), interactive date rescheduling, roadmap synthesis, chronological timeline ordering, multi-tenant isolation, and prior prompt regressions.
  - 100% pass rate achieved.
