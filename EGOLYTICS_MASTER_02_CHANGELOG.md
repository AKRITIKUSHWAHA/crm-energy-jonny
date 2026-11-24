# EGOLYTICS MASTER PROMPT 02: CHANGELOG & ARTIFACT INVENTORY
**Platform:** EgoLytics – Research & Development Management Tool  
**Parent Ecosystem:** CRM nErgy Enterprise AI Platform  
**Phase:** Master Prompt 02 of 16  
**Implementation Date:** 2026-11-24  

---

## 1. Summary of Changes

Master Prompt 02 implements the complete, database-backed **R&D Project Portfolio Management (Requirement 1)**, **Project Intake & Application Workflows (Requirement 2)**, **Strategic Alignment Tracking (Requirement 5)**, and **Project Prioritization Engine (Requirement 6)** without modifying or disrupting existing commercial CRM and ERP data.

---

## 2. File Inventory

### 2.1 New Backend Services & Controllers (`backend/src/`)
1. `backend/src/services/rdPortfolioService.js`  
   *Handles multi-project R&D portfolio querying, budget rollups, status tracking, initiative creation, and updates.*
2. `backend/src/controllers/rdPortfolioController.js`  
   *Express controller exposing portfolio listing, rollups, initiative detail, creation, and modification endpoints.*
3. `backend/src/services/rdIntakeService.js`  
   *Manages research proposal lifecycle: sequential reference number generation (`PROP-YYYY-XXXX`), draft saving, formal submission, reviewer screening, clarification requests, atomic approval/project conversion, and formal rejection.*
4. `backend/src/controllers/rdIntakeController.js`  
   *Controller for proposal intake, submit, review, approve, reject, and withdraw operations.*
5. `backend/src/services/rdStrategyService.js`  
   *Manages strategic enterprise goals, goal code generation (`GOAL-YYYY-XX`), project-to-goal alignment mapping with weights, and strategic contribution matrix.*
6. `backend/src/controllers/rdStrategyController.js`  
   *Controller for strategic goals CRUD, project mapping, unlinking, and matrix rollups.*
7. `backend/src/services/rdPrioritizationService.js`  
   *Implements algorithmic prioritization rubric: Score = (ROI × 35%) + (Strategic × 25%) + (Feasibility × 20%) + ((100 - Risk) × 20%), manual tier assignment, and batch portfolio recalculation.*
8. `backend/src/controllers/rdPrioritizationController.js`  
   *Controller for prioritization leaderboard, individual project tuning, and batch recalculation.*

### 2.2 Modified Backend Files
1. `backend/prisma/schema.prisma`  
   *Added additive models: `ProjectProposal`, `StrategicGoal`, `ProjectStrategicAlignment`. Extended `ErpProject` with `projectType`, `priority`, `priorityScore`, `riskScore`, `roiScore`, `feasibilityScore`, `strategicCategory`, `stage`, `startDate`, `isArchived`, and relations.*
2. `backend/src/routes/rdRoutes.js`  
   *Mounted all Master Prompt 02 routes under `/api/rd/portfolio`, `/api/rd/intake`, `/api/rd/strategy`, and `/api/rd/prioritization` with JWT authentication and tenant scoping.*
3. `backend/src/controllers/rdController.js`  
   *Updated module catalog to reflect `mod-02-portfolio-intake` as `ACTIVE` and system status to `ACTIVE_PORTFOLIO_INTAKE`.*

### 2.3 New Frontend Pages (`frontend/src/pages/rd/`)
1. `frontend/src/pages/rd/RdPortfolio.jsx`  
   *Interactive R&D portfolio management dashboard with executive rollups (total projects, active count, budget, spent, variance, avg progress, avg priority), multi-filters, project data table, and initiative creation/detail modals.*
2. `frontend/src/pages/rd/RdIntake.jsx`  
   *Research proposal intake desk with pipeline KPIs, workflow state filter tabs, proposal submission form, and reviewer decision desk (screen, request info, approve & convert, reject).*
3. `frontend/src/pages/rd/RdStrategicAlignment.jsx`  
   *Strategic alignment dashboard with dual-view mode: Goals Directory with aligned initiatives, and Strategic Alignment Matrix with budget contribution share rollups.*
4. `frontend/src/pages/rd/RdPrioritization.jsx`  
   *Algorithmic prioritization leaderboard table with formula banner, priority tier quick-toggles, score breakdown columns, and interactive Score Tuner modal with live score preview.*

### 2.4 Modified Frontend Files
1. `frontend/src/pages/rd/EgolyticsHub.jsx`  
   *Integrated sub-tabs for R&D Portfolio, Project Intake, Strategic Alignment, and Prioritization Engine. Wired URL path synchronization with `react-router-dom`.*
2. `frontend/src/data/mockData.js`  
   *Registered `rd-portfolio`, `rd-intake`, `rd-strategy`, and `rd-prioritization` under the `EgoLytics R&D` navigation section.*
3. `frontend/src/utils/rbac.js`  
   *Updated `CRM_ROLE_CONFIG` (all R&D-authorized roles) and `NAV_ID_TO_ROUTES_MAP` to include the new navigation IDs and routes.*

### 2.5 Test & Verification Artifacts
1. `backend/test_egolytics_master_02.js`  
   *Comprehensive automated test suite covering 20 test cases (`TC-01` through `TC-18b`).*

### 2.6 Root Deliverables & Reports
1. `EGOLYTICS_MASTER_02_PORTFOLIO_IMPLEMENTATION_REPORT.md`  
   *Requirement 1: Project Portfolio Management implementation report.*
2. `EGOLYTICS_MASTER_02_PROJECT_INTAKE_WORKFLOW.md`  
   *Requirement 2: Project Intake and Application Workflows documentation.*
3. `EGOLYTICS_MASTER_02_STRATEGIC_ALIGNMENT_AND_PRIORITIZATION.md`  
   *Requirements 5 & 6: Strategic Alignment and Prioritization Engine documentation.*
4. `EGOLYTICS_MASTER_02_TEST_REPORT.md`  
   *Complete test results and execution sign-off report.*
5. `EGOLYTICS_MASTER_02_CHANGELOG.md`  
   *Comprehensive changes and artifact inventory (this document).*

---

## 3. Database Migration Summary

Applied via safe, non-destructive SQL commands directly on MySQL (`crm-db`):

```sql
-- 1. Additive attributes on erp_projects
ALTER TABLE erp_projects ADD COLUMN projectType VARCHAR(50) NOT NULL DEFAULT 'COMMERCIAL';
ALTER TABLE erp_projects ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE erp_projects ADD COLUMN priorityScore DOUBLE NOT NULL DEFAULT 50.0;
ALTER TABLE erp_projects ADD COLUMN riskScore DOUBLE NOT NULL DEFAULT 30.0;
ALTER TABLE erp_projects ADD COLUMN roiScore DOUBLE NOT NULL DEFAULT 70.0;
ALTER TABLE erp_projects ADD COLUMN feasibilityScore DOUBLE NOT NULL DEFAULT 70.0;
ALTER TABLE erp_projects ADD COLUMN strategicCategory VARCHAR(100) NULL;
ALTER TABLE erp_projects ADD COLUMN stage VARCHAR(50) NULL DEFAULT 'IDEA';
ALTER TABLE erp_projects ADD COLUMN startDate DATETIME NULL;
ALTER TABLE erp_projects ADD COLUMN isArchived BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. New Table: strategic_goals
CREATE TABLE IF NOT EXISTS strategic_goals (
  id VARCHAR(191) PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Growth & Innovation',
  targetYear INT NOT NULL DEFAULT 2026,
  targetValue VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  ownerId VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_strategic_goals_tenant (tenantId),
  INDEX idx_strategic_goals_status (status),
  INDEX idx_strategic_goals_owner (ownerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. New Table: project_proposals
CREATE TABLE IF NOT EXISTS project_proposals (
  id VARCHAR(191) PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  referenceNumber VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NULL,
  description LONGTEXT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Product Innovation',
  problemStatement TEXT NULL,
  expectedOutcomes TEXT NULL,
  estimatedBudget DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  estimatedDurationMonths INT NOT NULL DEFAULT 6,
  proposedStartDate DATETIME NULL,
  expectedCompletionDate DATETIME NULL,
  submittingUserId VARCHAR(191) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  reviewerId VARCHAR(191) NULL,
  reviewComments TEXT NULL,
  rejectionReason TEXT NULL,
  moreInfoNotes TEXT NULL,
  convertedProjectId VARCHAR(191) NULL UNIQUE,
  strategicGoalId VARCHAR(191) NULL,
  expectedRoi DOUBLE NOT NULL DEFAULT 50.0,
  riskAssessment VARCHAR(50) NULL DEFAULT 'MEDIUM',
  feasibilityScore DOUBLE NOT NULL DEFAULT 70.0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_proposals_tenant (tenantId),
  INDEX idx_proposals_status (status),
  INDEX idx_proposals_submitter (submittingUserId),
  INDEX idx_proposals_reviewer (reviewerId),
  INDEX idx_proposals_goal (strategicGoalId),
  INDEX idx_proposals_tenant_ref (tenantId, referenceNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. New Table: project_strategic_alignments
CREATE TABLE IF NOT EXISTS project_strategic_alignments (
  id VARCHAR(191) PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  projectId VARCHAR(191) NOT NULL,
  goalId VARCHAR(191) NOT NULL,
  alignmentRationale TEXT NULL,
  impactWeight DOUBLE NOT NULL DEFAULT 1.0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY unique_project_goal (projectId, goalId),
  INDEX idx_psa_tenant (tenantId),
  INDEX idx_psa_project (projectId),
  INDEX idx_psa_goal (goalId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Preservation & Non-Regression Verification

- **Users Preserved:** 14 of 14 users intact.
- **Tenants Preserved:** 2 of 2 tenants intact.
- **CRM Leads & Deals:** 100% preserved.
- **Commercial ERP Projects:** Untouched (filtered cleanly via `projectType = 'COMMERCIAL'`).
