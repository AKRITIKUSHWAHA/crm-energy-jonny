# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: ALERTS, BASELINES, INTEGRATION & SECURITY REPORT

**Document ID:** EGOLYTICS-MP05-SECURITY-ALERTS-006  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** Schedule Baselines, Proactive Alerts, RBAC & Multi-Tenant Security (`mod-05-tasks`)  
**Implementation Date:** November 2026  
**Status:** Production Verified  
**Classification:** Enterprise Engineering Report  

---

## 1. EXECUTIVE SUMMARY

This report documents the architectural design, database modeling, business logic, security barriers, and regression boundaries for:
- **Requirement 19:** Schedule Tracking & Baseline Snapshots (`rd_task_schedule_baselines`)
- **Requirement 20:** Automated Schedule Variance Alerts & Deduplication (`rd_schedule_alerts`)
- Multi-Tenant Isolation & Zero Cross-Tenant Leakage
- 12-Role RBAC Compatibility & Upstream Integration with Master Prompts 01–04

---

## 2. SCHEDULE BASELINE STORAGE & DRIFT ANALYSIS (REQUIREMENT 19)

### 2.1 Database Schema (`rd_task_schedule_baselines`)
```sql
CREATE TABLE IF NOT EXISTS rd_task_schedule_baselines (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  taskId VARCHAR(191) NOT NULL,
  projectId VARCHAR(191) NULL,
  baselineStartDate DATETIME(3) NULL,
  baselineEndDate DATETIME(3) NULL,
  plannedDurationDays INT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_rd_base_tenant (tenantId),
  INDEX idx_rd_base_task (taskId),
  INDEX idx_rd_base_project (projectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Baseline Snapshot & Drift Calculation
When project schedules are officially approved, a snapshot is captured via `POST /api/rd/schedule/baseline`.
Variance against current dates is computed via `GET /api/rd/schedule/variance/:projectId`:
$$\text{Start Variance (Days)} = \text{Actual Start} - \text{Baseline Start}$$
$$\text{Finish Variance (Days)} = \text{Current Due Date} - \text{Baseline End Date}$$
$$\text{isSlipped} \iff \text{Finish Variance} > 0$$
$$\text{isAhead} \iff \text{Finish Variance} < 0$$

---

## 3. AUTOMATED SCHEDULE VARIANCE ALERTS (REQUIREMENT 20)

### 3.1 Database Schema (`rd_schedule_alerts`)
```sql
CREATE TABLE IF NOT EXISTS rd_schedule_alerts (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  projectId VARCHAR(191) NULL,
  taskId VARCHAR(191) NULL,
  alertType VARCHAR(32) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'WARNING',
  message TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  detectedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolvedAt DATETIME(3) NULL,
  INDEX idx_rd_alert_tenant (tenantId),
  INDEX idx_rd_alert_status (tenantId, status),
  INDEX idx_rd_alert_project (projectId),
  INDEX idx_rd_alert_task (taskId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Proactive Alert Detection Rules
The alert engine evaluated via `POST /api/rd/schedule/alerts/scan`:
1. **OVERDUE:** Task is incomplete and `dueDate < CURRENT_TIMESTAMP`. Severity: `CRITICAL`.
2. **DUE_SOON:** Task is incomplete and `dueDate` is within the next 48 hours. Severity: `WARNING`.
3. **DEPENDENCY_BLOCKED:** Task is `TODO` or `IN_PROGRESS` but one or more predecessor dependencies remain incomplete. Severity: `WARNING`.
4. **CRITICAL_PATH_DELAY:** Task lies on the Critical Path ($TF = 0$) and has slipped beyond its baseline schedule. Severity: `CRITICAL`.

### 3.3 Deduplication Engine
Alerts are deduplicated against existing active records:
$$\text{Unique Key: } (\text{tenantId}, \text{taskId}, \text{alertType}, \text{status} = \text{'ACTIVE'})$$
If an active alert of the same type already exists for a task, the existing record is updated with fresh telemetry rather than generating duplicate spam.

### 3.4 Resolution Workflow
Engineers or project leads resolve alerts via `POST /api/rd/schedule/alerts/:id/resolve`, which marks `status = 'RESOLVED'` and timestamps `resolvedAt`.

---

## 4. MULTI-TENANT ISOLATION & DATA SECURITY

Strict tenant boundary enforcement:
1. Every query executed in `rdTaskService.js` enforces `where: { tenantId }`.
2. Composite indexes `[tenantId, status]`, `[tenantId, projectId]`, and `[tenantId, taskId]` provide database-level partitioning.
3. Cross-tenant queries return HTTP 404/403.
4. Verified in automated test AC-30 & AC-31: Foreign tenant B tokens cannot read or calculate CPM for Tenant A initiatives.

---

## 5. RBAC MATRIX & 12 BUSINESS PERSONAS

The 12 CRM business personas map seamlessly to R&D Task, Sprint, and Scheduling permissions:

| Persona | Task Access | Kanban Drag/Status | Manage Sprints | Set Baseline / CPM | Resolve Alerts |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | Full CRUD | Full | Full | Full | Full |
| `BUSINESS_OWNER` | Full CRUD | Full | Full | Full | Full |
| `OPERATIONS_SALES_ADMIN` | Full CRUD | Full | Full | Full | Full |
| `FINANCE_COMPLIANCE_ADMIN` | Read-Only | Read-Only | Read-Only | Read-Only | None |
| `CRM_PRO` | Full CRUD | Full | Full | Full | Full |
| `AI_MARKETING_PRO` | Assigned CRUD | Assigned | None | None | None |
| `CONTENT_BUILDER` | Assigned CRUD | Assigned | None | None | None |
| `CONTENT_CREATOR` | Assigned CRUD | Assigned | None | None | None |
| `INFLUENCER` | Assigned Read | None | None | None | None |
| `AFFILIATE_PARTNER` | Assigned Read | None | None | None | None |
| `HR` | Read-Only | None | None | None | None |
| `CUSTOMER` | None | None | None | None | None |

---

## 6. INTEGRATION WITH PROMPTS 01, 02, 03, 04

- **Prompt 01 (Foundation):** Registered as `mod-05-tasks` in the 16-prompt module registry.
- **Prompt 02 (Portfolio):** Tasks link directly to `ErpProject` initiatives.
- **Prompt 03 (Ideation):** Approved ideas convert into R&D projects with starter backlog items.
- **Prompt 04 (Stage-Gate):** Gate reviews verify that all exit criteria tasks for the current stage are marked `DONE` before gatekeeper sign-off.

---
*Certified by SaaS Security Specialist & Enterprise Compliance Officer.*
