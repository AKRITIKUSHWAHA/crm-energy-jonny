# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: PRE-IMPLEMENTATION ARCHITECTURAL ANALYSIS & AUDIT REPORT

**Document ID:** EGOLYTICS-MP05-ANALYSIS-001  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** R&D Task, Sprint, Backlog & Advanced Scheduling Engine (`mod-05-tasks`)  
**Target Delivery Date:** November 2026  
**Status:** Approved for Implementation  
**Classification:** Confidential / Enterprise Architecture Specification  

---

## EXECUTIVE SUMMARY

This pre-implementation analysis report establishes the technical foundation, mathematical proofs, architectural specifications, database extensions, and security boundaries for **Master Prompt 05 of 16: EgoLytics Advanced Task, Sprint & Backlog Management**.

Following the successful implementation and verification of:
1. **Master Prompt 01:** Foundation, Multi-Tenant Isolation, RBAC Namespaces (`mod-01-foundation`)
2. **Master Prompt 02:** R&D Project Portfolio & Intake Governance (`mod-02-portfolio-intake`)
3. **Master Prompt 03:** Idea Management & Innovation Scoring Engine (`mod-03-ideation`)
4. **Master Prompt 04:** Stage-Gate Governance & Approval Workflow (`mod-04-stagegate`)

Master Prompt 05 bridges the strategic, ideational, and gatekeeping layers with operational work execution. It delivers a database-backed, reactive, and mathematically rigorous scheduling suite covering:
- **Requirement 11:** R&D Task Management & Lifecycle Workflows
- **Requirement 12:** Dynamic Drag-and-Drop Kanban Boards
- **Requirement 13:** Interactive Gantt Chart Engine
- **Requirement 14:** Chronological Timeline Views
- **Requirement 15:** Sprint Planning, Execution & Velocity Management
- **Requirement 16:** Backlog Management & Priority Ranking
- **Requirement 17:** Multi-Type Task Dependencies & Cycle Detection
- **Requirement 18:** Mathematical Critical Path Method (CPM) Engine
- **Requirement 19:** Baseline Schedule Storage & Progress Tracking
- **Requirement 20:** Automated Schedule Variance Alerts & Slippage Detection

---

## 1. ARCHITECTURAL BASELINE & AUDIT

### 1.1 Existing CRM/ERP Infrastructure State
The active platform (`crm-energy-jonny`) runs an enterprise Node.js/Express backend on port `5002` connected to MySQL `crm-db` on port `3307`, backed by a modern React 18 single-page application.

Audited core tables:
- `tasks`: Existing CRM task management table supporting commercial deals, contacts, and leads. Contains 14 columns (`id`, `tenantId`, `assignedUserId`, `leadId`, `contactId`, `dealId`, `title`, `description`, `priority`, `status`, `dueDate`, `reminder`, `createdAt`, `updatedAt`).
- `erp_projects`: Enterprise ERP & R&D projects table (`ErpProject`) containing 142 records, supporting project classification (`projectType = 'RD'`), priority scores, and stage linkage.
- `rd_innovation_stages`: Master Prompt 04 Stage-Gate stages table (`RdInnovationStage`) providing structured stage gates (`DISCOVERY`, `SCOPING`, `FEASIBILITY`, `DEVELOPMENT`, `SCALE_UP`).
- `users`: 14 enterprise users spanning 12 business personas with complete BCrypt authentication.
- `tenants`: 2 active isolated tenant organizations (`TENANT-08492` and `cmunoyqx50000tovon49iw6gx`).

### 1.2 Non-Destructive Extension Philosophy
In adherence to the core enterprise directive, existing CRM tables, foreign keys, and indexes must not be dropped or modified destructively. Existing commercial workflows (sales pipeline tasks, reminder triggers) must continue operating without regression.

The R&D Task, Sprint, and Scheduling Engine extends the database schema through:
1. **Additive columns on `tasks`**: Adding optional foreign keys (`projectId`, `sprintId`, `stageId`), operational attributes (`taskType`, `rdStatus`, `startDate`, `estimatedHours`, `actualHours`, `progress`, `sortOrder`, `isBacklog`), and supporting indexes.
2. **Four dedicated additive models**:
   - `RdSprint`: Sprint boundaries, capacity, velocity, and execution status.
   - `RdTaskDependency`: Directed predecessor-successor graph edges with dependency types (`FS`, `SS`, `FF`, `SF`) and lag days.
   - `RdTaskScheduleBaseline`: Snapshot of planned schedule versions for variance computation.
   - `RdScheduleAlert`: Automated proactive alerts for overdues, blockers, and critical-path slippages.

---

## 2. REUSABILITY ASSESSMENT

| Existing Module / Entity | Reusability Grade | Reuse Strategy |
| :--- | :---: | :--- |
| `Task` Model (`tasks`) | **High (Direct Extension)** | Reused as core operational work item entity. Additive fields link tasks to R&D Projects, Sprints, and Innovation Stages while leaving CRM fields optional. |
| `ErpProject` (`erp_projects`) | **High (Direct Association)** | Serves as the parent container for all R&D tasks, sprints, baselines, and CPM schedule graphs. |
| `RdInnovationStage` | **High (Direct Association)** | Tasks can optionally link to an Innovation Stage (`stageId`) to track stage-specific deliverables and exit gate criteria. |
| `User` (`users`) | **High (Direct Association)** | Assignees, creators, and reviewers mapped to existing enterprise user accounts. |
| `Tenant` (`tenants`) | **Mandatory (100% Scoped)** | Every new table and task record enforces `tenantId` foreign key and query filtering. |
| `Role` & RBAC Matrix | **High (Direct Mapping)** | 12 personas mapped to R&D Task permissions (`TASK_VIEW`, `TASK_CREATE`, `TASK_EDIT`, `TASK_DELETE`, `SPRINT_MANAGE`, `SCHEDULE_EDIT`). |
| Stage-Gate Governance (`mod-04`) | **High (Integrated)** | Gate reviews check task completion rates in linked innovation stages before approving gate progression. |

---

## 3. R&D TASK LIFECYCLE & TYPES

### 3.1 Task Types (`taskType`)
R&D initiatives require specialized work classification distinct from standard sales tasks:
1. `TASK`: General operational deliverable or development activity.
2. `USER_STORY`: User-centric requirement or feature capability.
3. `RESEARCH_SPIKE`: Time-boxed scientific inquiry, literature survey, or feasibility prototype.
4. `BUG`: Defect, regression, or calculation inaccuracy identified during testing.
5. `TECHNICAL_DEBT`: Architectural refactoring, documentation, or code cleanup.
6. `SUBTASK`: Child component of a larger composite task or user story.

### 3.2 Task Lifecycle Statuses (`rdStatus`)
```
[ BACKLOG ] <---> [ TODO ] ---> [ IN_PROGRESS ] ---> [ IN_REVIEW ] ---> [ DONE ]
                       |              |                     |
                       v              v                     v
                 [ BLOCKED ] <--------+---------------------+
                       |
                       v
                 [ CANCELLED ]
```
- **BACKLOG:** Work item captured in product/project backlog, not yet committed to an active sprint.
- **TODO:** Committed item ready for execution in current iteration or sprint.
- **IN_PROGRESS:** Actively being worked on by assigned researcher or engineer.
- **IN_REVIEW:** Work completed; pending peer review, verification, or QA sign-off.
- **BLOCKED:** Work halted due to an unmet predecessor dependency, resource shortage, or technical blocker.
- **DONE:** Verified and accepted as complete (automatically sets `progress = 100` and `completed = true`).
- **CANCELLED:** Work abandoned or deprioritized.

---

## 4. KANBAN BOARD ARCHITECTURE

The R&D Kanban board provides a multi-column visual workflow interface:
- **Columns:** `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`.
- **Drag-and-Drop Interaction:** Native HTML5 drag-and-drop / pointer event handling with optimistic UI update and atomic backend persistence (`PATCH /api/rd/tasks/:id/status`).
- **Multi-Dimensional Filtering:**
  - By Project (`projectId`)
  - By Sprint (`sprintId` or "Active Sprint")
  - By Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - By Task Type (`TASK`, `USER_STORY`, `RESEARCH_SPIKE`, `BUG`, `TECHNICAL_DEBT`)
  - By Assignee (`assignedUserId`)
- **Card Metadata:** Key indicators displayed on cards:
  - Task Type pill with distinct semantic colors.
  - Estimated vs. Actual hours indicator.
  - Dependency badge showing blocked status if any predecessor is incomplete.
  - Critical Path flag (`CRITICAL`) if calculated float is zero.
  - Due date indicator with visual overdue highlight.

---

## 5. GANTT & TIMELINE ENGINE

### 5.1 Gantt Chart Specifications
- **Time Scales:** Day, Week, and Month zoom levels.
- **Visual Elements:**
  - Task bars with start date, duration, and progress fill percentage.
  - Milestone markers (diamond icons for zero-duration tasks or key deliverables).
  - Dependency connector lines (curves linking predecessors to successors).
  - Critical Path highlighting (amber/red glow on zero-float critical tasks).
  - Baseline comparison bars (underlying semi-transparent bars representing the committed schedule).

### 5.2 Chronological Timeline View
- Grouped chronological feed showing milestone target dates, sprint boundaries (Sprint Start, Sprint Freeze, Sprint End), stage review gates, and major task completion events.

---

## 6. SPRINT PLANNING & AGILE VELOCITY

### 6.1 Sprint Lifecycle
```
[ PLANNED ] ----> [ ACTIVE ] ----> [ COMPLETED ]
       |                 |
       v                 v
  [ CANCELLED ]     [ CANCELLED ]
```
1. **PLANNED:** Sprint shell defined with name, goal, dates, and target capacity. Backlog items are assigned to the sprint.
2. **ACTIVE:** Sprint is started. Only one sprint per project can be `ACTIVE` simultaneously.
3. **COMPLETED:** Sprint closed. Incomplete tasks are automatically rolled over to backlog or next sprint. Velocity is computed.
4. **CANCELLED:** Sprint terminated prematurely.

### 6.2 Velocity Calculation
$$\text{Velocity} = \sum_{\text{task} \in \text{Sprint}_{\text{DONE}}} \text{estimatedHours (or story points)}$$
$$\text{Completion Rate (\%)} = \left( \frac{\text{Completed Hours}}{\text{Total Committed Hours}} \right) \times 100$$

---

## 7. BACKLOG MANAGEMENT & PRIORITIZATION

- **Backlog Pool:** Central repository of uncommitted work items (`isBacklog = true` or `sprintId IS NULL`).
- **Ranking / Ordering:** Maintained via `sortOrder` floating-point or integer index allowing drag reordering.
- **Sprint Assignment:** One-click or drag assignment of backlog items into planned sprints with instant capacity recalculation.
- **Bulk Actions:** Bulk sprint assignment, bulk priority assignment, and bulk status update.

---

## 8. TASK DEPENDENCY TOPOLOGY & CYCLE DETECTION

### 8.1 Dependency Types
- **FS (Finish-to-Start):** Successor cannot start until Predecessor finishes (standard waterfall/agile link).
- **SS (Start-to-Start):** Successor cannot start until Predecessor starts.
- **FF (Finish-to-Finish):** Successor cannot finish until Predecessor finishes.
- **SF (Start-to-Finish):** Successor cannot finish until Predecessor starts.

### 8.2 Cycle Detection (Tarjan's / DFS Algorithm)
Before saving any dependency edge $(u, v)$ where $u$ is predecessor and $v$ is successor:
1. Verify $u \neq v$ (self-dependency rejected).
2. Execute a Depth-First Search (DFS) starting from $v$ through all existing directed edges.
3. If $u$ is reachable from $v$, adding $(u, v)$ would introduce a cycle:
   $$\text{Path}(v \rightsquigarrow u) \land (u \rightarrow v) \implies \text{Cycle!}$$
4. Reject the operation with HTTP 400 Bad Request and error message:
   `"Circular dependency detected: adding this link creates a dependency cycle."`

---

## 9. MATHEMATICAL CRITICAL PATH METHOD (CPM) SPECIFICATION

The Critical Path Method (CPM) is a deterministic mathematical network algorithm used to calculate the minimum project duration and determine scheduling flexibility (float) for each task.

### 9.1 Network Graph Representation
Let the project schedule be represented as a Directed Acyclic Graph (DAG) $G = (V, E)$, where:
- Each vertex $v_i \in V$ represents a task with duration $D_i \ge 0$.
- Each directed edge $(u, v) \in E$ represents a finish-to-start dependency where $u = \text{Pred}(v)$ and $v = \text{Succ}(u)$.

### 9.2 Topological Sort
A topological ordering of $V$ is computed such that for every directed edge $(u, v)$, $u$ precedes $v$. If no topological ordering exists, a cycle is detected and the calculation terminates with an error.

### 9.3 Forward Pass (Early Dates Calculation)
For each task $i \in V$ in topological order:
1. **Early Start ($ES_i$):**
   $$ES_i = \begin{cases} 0 & \text{if } \text{Pred}(i) = \emptyset \\ \max_{p \in \text{Pred}(i)} (EF_p + \text{Lag}_{p, i}) & \text{otherwise} \end{cases}$$
2. **Early Finish ($EF_i$):**
   $$EF_i = ES_i + D_i$$

Project Completion Duration $T_{\text{project}}$ is defined as:
$$T_{\text{project}} = \max_{i \in V} (EF_i)$$

### 9.4 Backward Pass (Late Dates Calculation)
For each task $i \in V$ in reverse topological order:
1. **Late Finish ($LF_i$):**
   $$LF_i = \begin{cases} T_{\text{project}} & \text{if } \text{Succ}(i) = \emptyset \\ \min_{s \in \text{Succ}(i)} (LS_s - \text{Lag}_{i, s}) & \text{otherwise} \end{cases}$$
2. **Late Start ($LS_i$):**
   $$LS_i = LF_i - D_i$$

### 9.5 Float & Critical Path Identification
- **Total Float ($TF_i$):** The amount of time task $i$ can be delayed without delaying the project finish date:
  $$TF_i = LS_i - ES_i = LF_i - EF_i$$
- **Free Float ($FF_i$):** The amount of time task $i$ can be delayed without delaying the early start of any successor:
  $$FF_i = \min_{s \in \text{Succ}(i)} (ES_s) - EF_i$$
- **Critical Tasks:** Any task where:
  $$TF_i = 0$$
- **Critical Path:** The continuous directed path of critical tasks from project start to project finish having total duration equal to $T_{\text{project}}$.

---

### 9.6 Numerical Verification Example

Consider an R&D project consisting of 6 tasks with specified durations and dependencies:

| Task ID | Task Name | Duration ($D_i$) | Predecessors |
| :---: | :--- | :---: | :---: |
| **A** | Literature Review & Formulation | 3 days | None |
| **B** | Lab Bench Synthesis | 5 days | A |
| **C** | Theoretical Modeling | 2 days | A |
| **D** | Material Testing & Characterization | 4 days | B |
| **E** | Model Validation & Simulation | 3 days | C |
| **F** | Final Stage Gate Report | 2 days | D, E |

#### Forward Pass Computation:
- Task A: $ES_A = 0$, $EF_A = 0 + 3 = 3$
- Task B: $ES_B = EF_A = 3$, $EF_B = 3 + 5 = 8$
- Task C: $ES_C = EF_A = 3$, $EF_C = 3 + 2 = 5$
- Task D: $ES_D = EF_B = 8$, $EF_D = 8 + 4 = 12$
- Task E: $ES_E = EF_C = 5$, $EF_E = 5 + 3 = 8$
- Task F: $ES_F = \max(EF_D, EF_E) = \max(12, 8) = 12$, $EF_F = 12 + 2 = 14$

**Project Duration $T_{\text{project}} = 14$ days.**

#### Backward Pass Computation:
- Task F: $LF_F = 14$, $LS_F = 14 - 2 = 12$
- Task D: $LF_D = LS_F = 12$, $LS_D = 12 - 4 = 8$
- Task E: $LF_E = LS_F = 12$, $LS_E = 12 - 3 = 9$
- Task B: $LF_B = LS_D = 8$, $LS_B = 8 - 5 = 3$
- Task C: $LF_C = LS_E = 9$, $LS_C = 9 - 2 = 7$
- Task A: $LF_A = \min(LS_B, LS_C) = \min(3, 7) = 3$, $LS_A = 3 - 3 = 0$

#### Float Calculation Table:

| Task | Duration | ES | EF | LS | LF | Total Float ($LF - EF$) | Critical? |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | 3 | 0 | 3 | 0 | 3 | **0** | **YES** |
| **B** | 5 | 3 | 8 | 3 | 8 | **0** | **YES** |
| **C** | 2 | 3 | 5 | 7 | 9 | 4 | NO |
| **D** | 4 | 8 | 12 | 8 | 12 | **0** | **YES** |
| **E** | 3 | 5 | 8 | 9 | 12 | 4 | NO |
| **F** | 2 | 12 | 14 | 12 | 14 | **0** | **YES** |

#### Result:
- **Critical Path:** $A \rightarrow B \rightarrow D \rightarrow F$
- **Critical Path Duration:** $3 + 5 + 4 + 2 = 14$ days.
- **Non-Critical Path:** $A \rightarrow C \rightarrow E \rightarrow F$ (Duration: $3 + 2 + 3 + 2 = 10$ days, Float = 4 days).

This numerical proof guarantees that the CPM calculation service in `rdTaskService.js` operates with mathematical precision.

---

## 10. BASELINE SCHEDULE STORAGE & VARIANCE TRACKING

To measure schedule adherence, projects capture formal baselines:
- **Baseline Capture:** When project plans are locked, a snapshot of all current task dates ($ES_i, EF_i$, duration) is saved into `RdTaskScheduleBaseline` with a version index (`v1`, `v2`, etc.).
- **Variance Formulas:**
  $$\text{Start Variance (days)} = \text{Actual / Planned Start} - \text{Baseline Start}$$
  $$\text{Finish Variance (days)} = \text{Actual / Projected Finish} - \text{Baseline Finish}$$
  $$\text{Schedule Variance Percentage} = \left( \frac{\text{Projected Finish} - \text{Baseline Finish}}{\text{Baseline Duration}} \right) \times 100$$
- If Finish Variance $> 0$, the task has slipped. If Finish Variance $< 0$, the task is ahead of schedule.

---

## 11. AUTOMATED ALERT SYSTEM

The automated alert engine proactively evaluates the schedule:
1. **OVERDUE:** Task status $\neq$ `DONE` and `dueDate < CURRENT_TIMESTAMP`. Severity: `CRITICAL`.
2. **DUE_SOON:** Task status $\neq$ `DONE` and `dueDate` is within the next 48 hours. Severity: `WARNING`.
3. **CRITICAL_PATH_DELAY:** Task lies on the Critical Path ($TF = 0$) and its projected finish exceeds its baseline or milestone date. Severity: `CRITICAL`.
4. **DEPENDENCY_BLOCKED:** Task is marked `TODO` or `IN_PROGRESS` but one or more predecessor tasks are incomplete (`status != 'DONE'`). Severity: `WARNING`.

**Duplicate Prevention:** Alerts are deduplicated by `(tenantId, taskId, alertType, status = 'ACTIVE')`. If an active alert already exists, it is updated rather than duplicated.

---

## 12. DATABASE SCHEMA EXTENSION PLAN

### 12.1 Additive Tables
1. `rd_sprints`: Manages project sprints and iterative planning cycles.
2. `rd_task_dependencies`: Manages directed graph edges between predecessor and successor tasks.
3. `rd_task_schedule_baselines`: Stores immutable baseline snapshots for schedule variance analysis.
4. `rd_schedule_alerts`: Stores active and historical scheduling alerts with deduplication.

### 12.2 Additive Columns on `tasks` Table
- `projectId` VARCHAR(191) NULL (Foreign key to `erp_projects.id`)
- `sprintId` VARCHAR(191) NULL (Foreign key to `rd_sprints.id`)
- `stageId` VARCHAR(191) NULL (Foreign key to `rd_innovation_stages.id`)
- `taskType` VARCHAR(32) DEFAULT 'TASK'
- `rdStatus` VARCHAR(32) DEFAULT 'TODO'
- `startDate` DATETIME NULL
- `estimatedHours` FLOAT DEFAULT 0
- `actualHours` FLOAT DEFAULT 0
- `progress` INT DEFAULT 0
- `sortOrder` INT DEFAULT 0
- `isBacklog` TINYINT(1) DEFAULT 0

---

## 13. BACKEND SERVICE & API SPECIFICATION

All endpoints are mounted under `/api/rd/governance/` and require verified JWT session and tenant scoping:

### 13.1 Task Operations
- `GET /api/rd/governance/tasks`: Query tasks with multi-field filters (`projectId`, `sprintId`, `rdStatus`, `priority`, `assignee`, `isBacklog`).
- `POST /api/rd/governance/tasks`: Create an R&D work item.
- `GET /api/rd/governance/tasks/:id`: Retrieve single task with dependencies, baseline, and assignees.
- `PUT /api/rd/governance/tasks/:id`: Update task attributes.
- `PATCH /api/rd/governance/tasks/:id/status`: Update status (Kanban column drop).
- `DELETE /api/rd/governance/tasks/:id`: Delete task and cascade dependency cleanup.

### 13.2 Backlog & Sprint Operations
- `GET /api/rd/governance/backlog`: Retrieve ordered uncommitted backlog items.
- `POST /api/rd/governance/backlog/reorder`: Persist updated backlog rank order.
- `POST /api/rd/governance/backlog/commit`: Commit backlog items to a target sprint.
- `GET /api/rd/governance/sprints`: List sprints for a project.
- `POST /api/rd/governance/sprints`: Create a new sprint.
- `PUT /api/rd/governance/sprints/:id`: Update sprint details.
- `POST /api/rd/governance/sprints/:id/start`: Start sprint (transition to `ACTIVE`).
- `POST /api/rd/governance/sprints/:id/complete`: Complete sprint, compute velocity, rollover incomplete items.

### 13.3 Dependency & CPM Scheduling Operations
- `GET /api/rd/governance/dependencies`: List task dependency edges.
- `POST /api/rd/governance/dependencies`: Add dependency with cycle detection.
- `DELETE /api/rd/governance/dependencies/:id`: Remove dependency edge.
- `GET /api/rd/governance/cpm/:projectId`: Calculate CPM metrics (ES, EF, LS, LF, Float, Critical Path).
- `POST /api/rd/governance/schedule/baseline`: Capture baseline schedule snapshot.
- `GET /api/rd/governance/schedule/variance/:projectId`: Get schedule variance against baseline.
- `GET /api/rd/governance/schedule/alerts`: Get active schedule alerts.
- `POST /api/rd/governance/schedule/alerts/:id/resolve`: Acknowledge or resolve an alert.

---

## 14. FRONTEND ARCHITECTURE & VIEWS

The frontend implementation lives in `frontend/src/pages/rd/RdTasks.jsx` and is embedded within `EgolyticsHub.jsx`. It offers 6 purpose-built views:
1. **Task Board (Kanban):** Drag-and-drop workflow columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`) with real-time status update.
2. **Backlog Planning:** Backlog list with priority drag ordering and sprint assignment drawer.
3. **Sprint Management:** Active sprint dashboard with burndown/velocity KPIs and sprint completion wizard.
4. **Gantt Chart:** Interactive timeline bars, progress fills, and dependency links.
5. **Critical Path View:** Graphical and tabular visualization of the calculated Critical Path ($TF = 0$).
6. **Schedule Alerts:** Alert inbox showing overdue tasks, blocked dependencies, and slippages with one-click resolution.

---

## 15. MULTI-TENANT SCOPING & DATA ISOLATION

Strict multi-tenant security is enforced at every layer:
1. Every query in `rdTaskService.js` enforces `where: { tenantId }`.
2. Composite indexes `[tenantId, status]`, `[tenantId, projectId]`, and `[tenantId, taskId]` ensure high-performance tenant-isolated queries.
3. Cross-tenant access attempts return HTTP 404 or 403.
4. Automated tests verify zero cross-tenant leakage between `TENANT-08492` and `cmunoyqx50000tovon49iw6gx`.

---

## 16. RBAC MATRIX COMPATIBILITY (12 PERSONAS)

| Role / Persona | View Tasks | Create / Edit Tasks | Manage Sprints | Set Baseline / CPM | Resolve Alerts |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | YES | YES | YES | YES | YES |
| `BUSINESS_OWNER` | YES | YES | YES | YES | YES |
| `OPERATIONS_SALES_ADMIN` | YES | YES | YES | YES | YES |
| `FINANCE_COMPLIANCE_ADMIN` | YES | READ-ONLY | READ-ONLY | READ-ONLY | NO |
| `CRM_PRO` | YES | YES | YES | YES | YES |
| `AI_MARKETING_PRO` | YES | YES (Assigned) | NO | NO | NO |
| `CONTENT_BUILDER` | YES | YES (Assigned) | NO | NO | NO |
| `CONTENT_CREATOR` | YES | YES (Assigned) | NO | NO | NO |
| `INFLUENCER` | YES (Assigned) | NO | NO | NO | NO |
| `AFFILIATE_PARTNER` | YES (Assigned) | NO | NO | NO | NO |
| `HR` | YES | NO | NO | NO | NO |
| `CUSTOMER` | NO | NO | NO | NO | NO |

---

## 17. INTEGRATION POINTS WITH PROMPTS 01, 02, 03, 04

- **Prompt 01 (Foundation):** Registered as `mod-05-tasks` in the 16-prompt registry with status `ACTIVE`.
- **Prompt 02 (Portfolio):** Tasks link directly to `ErpProject` records created in Prompt 02. Project detail views aggregate task completion percentages and sprint progress.
- **Prompt 03 (Ideation):** Approved ideas converted into R&D projects inherit starter backlog items created from idea evaluation criteria.
- **Prompt 04 (Stage-Gate):** Stage gate reviews inspect whether all mandatory tasks in the current `RdInnovationStage` are marked `DONE` before enabling the Gatekeeper `GO_CONTINUE` sign-off.

---

## 18. RISK ASSESSMENT & ROLLBACK STRATEGY

| Risk | Likelihood | Impact | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| Schema conflict with existing CRM tasks | LOW | HIGH | Strictly additive columns with safe defaults; existing columns untouched. |
| Circular dependency recursion crash | LOW | HIGH | DFS cycle validation on every dependency insert; limits recursion depth. |
| Inaccurate CPM calculations | LOW | HIGH | Validated against deterministic numerical benchmark ($T = 14$ days, $TF = 0$ on critical chain). |
| Performance degradation on large task sets | LOW | MEDIUM | Indexed queries on `(tenantId, projectId)` and topological sort executed in $O(V + E)$ time. |
| MariaDB schema diff introspection error | HIGH | LOW | Additive migration executed via raw SQL script (`migrate_master_05.js`) followed by `prisma generate`. |

**Rollback Procedure:** If needed, dropping the additive tables `rd_sprints`, `rd_task_dependencies`, `rd_task_schedule_baselines`, and `rd_schedule_alerts` completely isolates the extension without altering CRM core tables.

---
*Report authored and certified by Principal Software Architect & QA Automation Lead.*
