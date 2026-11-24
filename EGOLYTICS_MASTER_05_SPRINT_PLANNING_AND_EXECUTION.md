# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: SPRINT PLANNING & EXECUTION REPORT

**Document ID:** EGOLYTICS-MP05-SPRINT-EXEC-004  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** R&D Sprint Planning & Agile Execution Subsystem (`mod-05-tasks`)  
**Implementation Date:** November 2026  
**Status:** Production Verified  
**Classification:** Enterprise Engineering Report  

---

## 1. EXECUTIVE SUMMARY

This report documents the architectural design, database modeling, business logic, and verification of **Requirement 15: Sprint Planning & Execution**.

The sprint management system provides iterative planning cycles, capacity commitment, velocity calculation, burndown tracking, and automated task rollover upon sprint closure.

---

## 2. DATABASE ARCHITECTURE (`rd_sprints`)

The `rd_sprints` table manages iteration boundaries and capacity metrics:

```sql
CREATE TABLE IF NOT EXISTS rd_sprints (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  projectId VARCHAR(191) NULL,
  name VARCHAR(191) NOT NULL,
  code VARCHAR(64) NULL,
  goal TEXT NULL,
  startDate DATETIME(3) NULL,
  endDate DATETIME(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
  capacityHours DOUBLE NOT NULL DEFAULT 0,
  velocity DOUBLE NOT NULL DEFAULT 0,
  completedAt DATETIME(3) NULL,
  createdById VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_rd_sprints_tenant (tenantId),
  INDEX idx_rd_sprints_tenant_status (tenantId, status),
  INDEX idx_rd_sprints_project (projectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. SPRINT LIFECYCLE & STATE MACHINE

```
               [ POST /api/rd/sprints ]
                          |
                          v
                    +------------+
                    |  PLANNED   |
                    +------------+
                          |
                          | [ POST /api/rd/sprints/:id/start ]
                          v
                    +------------+
                    |   ACTIVE   |
                    +------------+
                          |
                          | [ POST /api/rd/sprints/:id/complete ]
                          v
                    +------------+
                    | COMPLETED  |
                    +------------+
```

### 3.1 Single Active Sprint Boundary Enforcement
To maintain operational focus and avoid resource contention, the backend guarantees that only one sprint per project may be in `ACTIVE` status simultaneously. Attempting to start a second sprint while another is active throws:
`"Project already has an active sprint: 'Sprint A'. Complete or cancel it first."` (HTTP 400).

### 3.2 Automated Velocity Calculation
When closing a sprint via `POST /api/rd/sprints/:id/complete`:
1. The system queries all tasks assigned to the sprint:
   $$\text{Tasks}_{\text{Sprint}} = \{ t \mid t.\text{sprintId} = \text{id} \land t.\text{tenantId} = \text{tenantId} \}$$
2. Completed tasks are filtered where `rdStatus = 'DONE'`.
3. Sprint velocity is calculated as the sum of estimated hours of all accepted deliverables:
   $$\text{Velocity} = \sum_{t \in \text{Tasks}_{\text{DONE}}} t.\text{estimatedHours}$$
4. `velocity` is persisted on the `rd_sprints` record alongside `completedAt = CURRENT_TIMESTAMP`.

### 3.3 Automated Task Rollover Engine
Any incomplete tasks remaining in the sprint (`rdStatus != 'DONE'`) are handled according to the selected rollover action:
- **`BACKLOG` (Default):** Tasks are automatically detached from the sprint (`sprintId = null`), marked `isBacklog = true`, and assigned `rdStatus = 'BACKLOG'`.
- **`NEXT_SPRINT`:** Tasks are immediately reassigned to the specified subsequent sprint shell.

---

## 4. API SPECIFICATION & WORKFLOWS

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rd/sprints?projectId=:id` | Lists all sprints with task counts, completed hours, and progress rollup. |
| `POST` | `/api/rd/sprints` | Creates a new sprint in `PLANNED` status with goal and target capacity. |
| `PUT` | `/api/rd/sprints/:id` | Updates sprint details, goal, or planned dates. |
| `POST` | `/api/rd/sprints/:id/start` | Transitions sprint to `ACTIVE` status and sets start timestamp. |
| `POST` | `/api/rd/sprints/:id/complete` | Calculates velocity, records closure, and executes rollover. |

---

## 5. FRONTEND USER INTERFACE

Surfaced within the **Sprints** tab of `frontend/src/pages/rd/RdTasks.jsx`:
- **Sprint Overview Cards:** Displays sprint name, linked project, goal, status badge, committed vs completed capacity bar, and task breakdown pills.
- **Sprint Creation Wizard:** Form to configure sprint name, goal, dates, and hours capacity.
- **One-Click Actions:** Start Sprint button for `PLANNED` sprints; Complete Sprint button with confirmation dialog for `ACTIVE` sprints.

---

## 6. VERIFICATION EVIDENCE

Automated tests in `backend/test_egolytics_master_05.js` verified:
- **AC-08:** Sprint creation with capacity hours and goal $\rightarrow$ **PASS**
- **AC-09:** Starting sprint updates status to `ACTIVE` $\rightarrow$ **PASS**
- **AC-10:** Committing backlog tasks updates sprint association $\rightarrow$ **PASS**
- **AC-11:** Sprint completion calculates exact velocity (20 hrs) from completed tasks $\rightarrow$ **PASS**

---
*Certified by Principal Enterprise Software Architect & Agile Process Lead.*
