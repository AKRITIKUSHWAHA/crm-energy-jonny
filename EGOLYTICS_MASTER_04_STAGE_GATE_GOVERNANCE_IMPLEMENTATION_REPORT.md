# EGOLYTICS MASTER PROMPT 04 — STAGE-GATE GOVERNANCE IMPLEMENTATION REPORT
**Project:** EgoLytics – R&D Management Tool  
**Division:** CRM nErgy AI  
**Roadmap Phase:** Master Prompt 04 of 16  
**Implementation Focus:** Requirement 7 (Stage-Gate Workflows) & Requirement 8 (Decision Checkpoints)  
**Date of Execution:** November 2026  
**Author:** Principal Enterprise Software Architect, Senior Full-Stack Engineer & Governance Specialist

---

## 1. Executive Summary

This report documents the architectural design, database modeling, backend API engineering, and frontend user experience for the **Stage-Gate Governance and Decision Checkpoint Engine** of EgoLytics (CRM nErgy AI).

Covering **Requirement 7 (Stage-Gate Workflows)**, **Requirement 8 (Decision Checkpoints)**, and **Requirement 31 (Decision Logs)** from the authoritative client specification `EgoLytics - R_D Management Tool.docx`, this system provides a formal, evidence-driven governance framework. It ensures that R&D initiatives advance through structured innovation phases only when verified against mandatory entry and exit criteria, evaluated by assigned domain gatekeepers, and authorized through documented decision outcomes (`GO/CONTINUE`, `HOLD`, `REWORK/RECYCLE`, `TERMINATE/KILL`, `REQUEST_MORE_INFO`).

All components are fully database-backed via MySQL and Prisma ORM, non-destructive to existing CRM and ERP data, and cleanly integrated with upstream R&D Project Proposals (Master Prompt 02) and Innovation Ideas (Master Prompt 03).

---

## 2. Requirement Scope & Architectural Boundaries

### 2.1 Scope Inclusions
1. **Configurable Stage Templates (`RdStageTemplate`):** Reusable stage-gate frameworks supporting customizable phase counts, ordering, and activation/deactivation.
2. **Defined Innovation Stages (`RdInnovationStage`):** Sequential research phases with distinct color coding, responsible roles, and expected deliverables.
3. **Stage Entry & Exit Criteria (`RdStageCriterion`):** Mandatory and optional requirements, validation rules, and evidence flags gating each stage.
4. **Decision Gates (`RdDecisionGate`):** Controlled checkpoints linked to stages with configurable approval policies (`ALL_MUST_APPROVE`, `MINIMUM_COUNT`, `SINGLE_GATEKEEPER`).
5. **Project Governance Instances (`RdProjectGovernance`):** Dedicated tracking records binding an `ErpProject` to an active stage template version.
6. **Gate Review Cycles (`RdGateReview`):** Multi-cycle evaluation instances tracking criteria completion, review status, and submissions.
7. **Gatekeeper & Reviewer Management (`RdGateReviewer`, `RdGateSignOff`):** Assignment of specialists and immutable logging of individual recommendations.
8. **Evidence-Based Reviews (`RdGateEvidence`):** Uploading and linking technical documents, datasets, or external links to reviews and criteria.
9. **Authoritative Decision Engine (`RdGateDecision`):** Enforces 5 distinct outcomes with mandatory justification logging.
10. **Progression History (`RdProjectStageHistory`):** Chronological, immutable audit trail of all transitions, holds, reworks, and completions.
11. **Zero-Regression:** 100% preservation of all 14 users, 2 tenants, CRM core tables, and Master Prompts 02 and 03.

### 2.2 Strict Architectural Decoupling
- **Decoupled from Ideation (Master 03):** Stage-Gate operates on formal R&D projects (`ErpProject`). Ideas remain in the upstream ideation incubator and do not enter Stage-Gate until approved and converted into an R&D project.
- **Decoupled from Proposal Screening (Master 02):** Proposal intake evaluates initial project applications; Stage-Gate governs project execution after approval.
- **Decoupled from Future Roadmap Modules:** No premature implementation of Gantt charts, Kanban boards, or Sprint planning (Master Prompt 05).

---

## 3. Database Architecture & Schema Specification

The following 12 additive relational models were deployed to the `crm-db` database without modifying existing tables:

### 3.1 Template & Stage Models
```prisma
model RdStageTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  code        String
  description String?  @db.Text
  version     Int      @default(1)
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stages      RdInnovationStage[]
  governances RdProjectGovernance[]

  @@unique([tenantId, code])
  @@index([tenantId, isActive])
  @@map("rd_stage_templates")
}

model RdInnovationStage {
  id                   String   @id @default(cuid())
  tenantId             String
  templateId           String
  name                 String
  code                 String
  stageNumber          Int      @default(1)
  description          String?  @db.Text
  expectedDeliverables String?  @db.Text
  responsibleRole      String?  @default("RD_LEAD")
  color                String   @default("#3b82f6")
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  tenant        Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  template      RdStageTemplate         @relation(fields: [templateId], references: [id], onDelete: Cascade)
  criteria      RdStageCriterion[]
  gate          RdDecisionGate?
  governances   RdProjectGovernance[]   @relation("CurrentStageGovernances")
  reviews       RdGateReview[]
  historiesFrom RdProjectStageHistory[] @relation("HistoryFromStage")
  historiesTo   RdProjectStageHistory[] @relation("HistoryToStage")

  @@unique([templateId, stageNumber])
  @@index([tenantId, templateId])
  @@map("rd_innovation_stages")
}
```

### 3.2 Criteria & Gate Models
```prisma
model RdStageCriterion {
  id               String   @id @default(cuid())
  tenantId         String
  stageId          String
  name             String
  description      String?  @db.Text
  type             String   @default("EXIT")
  isMandatory      Boolean  @default(true)
  evidenceRequired Boolean  @default(false)
  sortOrder        Int      @default(1)
  validationRule   String?  @db.Text
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  stage    RdInnovationStage @relation(fields: [stageId], references: [id], onDelete: Cascade)
  evidence RdGateEvidence[]

  @@index([stageId, type])
  @@map("rd_stage_criteria")
}

model RdDecisionGate {
  id                   String   @id @default(cuid())
  tenantId             String
  stageId              String   @unique
  name                 String
  code                 String
  description          String?  @db.Text
  gateOrder            Int      @default(1)
  approvalPolicy       String   @default("ALL_MUST_APPROVE")
  requiredSignOffCount Int      @default(1)
  reviewInstructions   String?  @db.Text
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  tenant      Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stage       RdInnovationStage     @relation(fields: [stageId], references: [id], onDelete: Cascade)
  governances RdProjectGovernance[]  @relation("CurrentGateGovernances")
  reviews     RdGateReview[]
  decisions   RdGateDecision[]

  @@index([tenantId])
  @@map("rd_decision_gates")
}
```

### 3.3 Project Governance & Progression Models
```prisma
model RdProjectGovernance {
  id                String    @id @default(cuid())
  tenantId          String
  projectId         String    @unique
  templateId        String
  templateVersion   Int       @default(1)
  currentStageId    String?
  currentGateId     String?
  governanceStatus  String    @default("ACTIVE")
  holdReason        String?   @db.Text
  terminationReason String?   @db.Text
  originIdeaId      String?
  originProposalId  String?
  startedAt         DateTime  @default(now())
  lastTransitionAt  DateTime  @default(now())
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tenant       Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project      ErpProject              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  template     RdStageTemplate         @relation(fields: [templateId], references: [id], onDelete: Restrict)
  currentStage RdInnovationStage?      @relation("CurrentStageGovernances", fields: [currentStageId], references: [id], onDelete: SetNull)
  currentGate  RdDecisionGate?         @relation("CurrentGateGovernances", fields: [currentGateId], references: [id], onDelete: SetNull)
  reviews      RdGateReview[]
  history      RdProjectStageHistory[]
  decisions    RdGateDecision[]

  @@index([tenantId, governanceStatus])
  @@index([projectId])
  @@map("rd_project_governances")
}

model RdProjectStageHistory {
  id                String   @id @default(cuid())
  tenantId          String
  governanceId      String
  projectId         String
  fromStageId       String?
  toStageId         String?
  fromStageName     String?
  toStageName       String?
  triggerGateId     String?
  triggerDecisionId String?
  eventType         String
  actorId           String?
  actorName         String?
  reason            String?  @db.Text
  notes             String?  @db.Text
  metadata          Json?
  createdAt         DateTime @default(now())

  governance RdProjectGovernance @relation(fields: [governanceId], references: [id], onDelete: Cascade)
  fromStage  RdInnovationStage?  @relation("HistoryFromStage", fields: [fromStageId], references: [id], onDelete: SetNull)
  toStage    RdInnovationStage?  @relation("HistoryToStage", fields: [toStageId], references: [id], onDelete: SetNull)

  @@index([governanceId])
  @@index([projectId])
  @@index([createdAt])
  @@map("rd_project_stage_histories")
}
```

### 3.4 Gate Reviews, Reviewers, Sign-Offs & Decisions
```prisma
model RdGateReview {
  id                     String    @id @default(cuid())
  tenantId               String
  governanceId           String
  projectId              String
  gateId                 String
  stageId                String
  cycleNumber            Int       @default(1)
  status                 String    @default("READY_FOR_REVIEW")
  submittedById          String?
  submittedAt            DateTime?
  summary                String?   @db.Text
  notes                  String?   @db.Text
  moreInfoRequestedNotes String?   @db.Text
  moreInfoResponse       String?   @db.Text
  criteriaCompletedCount Int       @default(0)
  criteriaTotalCount     Int       @default(0)
  allCriteriaMet         Boolean   @default(false)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  tenant     Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  governance RdProjectGovernance   @relation(fields: [governanceId], references: [id], onDelete: Cascade)
  gate       RdDecisionGate        @relation(fields: [gateId], references: [id], onDelete: Cascade)
  stage      RdInnovationStage     @relation(fields: [stageId], references: [id], onDelete: Cascade)
  reviewers  RdGateReviewer[]
  signOffs   RdGateSignOff[]
  evidence   RdGateEvidence[]
  decisions  RdGateDecision[]
  comments   RdGateReviewComment[]

  @@index([tenantId, status])
  @@index([governanceId])
  @@index([gateId])
  @@map("rd_gate_reviews")
}

model RdGateReviewer {
  id           String    @id @default(cuid())
  tenantId     String
  reviewId     String
  userId       String
  role         String    @default("GATEKEEPER")
  status       String    @default("PENDING")
  assignedById String?
  assignedAt   DateTime  @default(now())

  review   RdGateReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reviewer User         @relation("AssignedGateReviewers", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId], map: "unique_gate_review_user")
  @@index([reviewId])
  @@index([userId])
  @@map("rd_gate_reviewers")
}

model RdGateSignOff {
  id             String   @id @default(cuid())
  tenantId       String
  reviewId       String
  userId         String
  recommendation String
  comments       String?  @db.Text
  signedOffAt    DateTime @default(now())

  review RdGateReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user   User         @relation("UserGateSignOffs", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId], map: "unique_gate_review_signoff_user")
  @@index([reviewId])
  @@index([userId])
  @@map("rd_gate_sign_offs")
}

model RdGateDecision {
  id               String   @id @default(cuid())
  tenantId         String
  reviewId         String
  governanceId     String
  projectId        String
  gateId           String
  decision         String
  decisionReason   String   @db.Text
  decisionComments String?  @db.Text
  decisionMakerId  String
  decidedAt        DateTime @default(now())

  review     RdGateReview        @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  governance RdProjectGovernance @relation(fields: [governanceId], references: [id], onDelete: Cascade)
  gate       RdDecisionGate      @relation(fields: [gateId], references: [id], onDelete: Cascade)
  maker      User                @relation("UserGateDecisions", fields: [decisionMakerId], references: [id], onDelete: Cascade)

  @@index([governanceId])
  @@index([reviewId])
  @@index([gateId])
  @@map("rd_gate_decisions")
}

model RdGateEvidence {
  id            String   @id @default(cuid())
  tenantId      String
  reviewId      String
  projectId     String
  criterionId   String?
  title         String
  description   String?  @db.Text
  evidenceType  String   @default("DOCUMENT")
  fileUrl       String?
  fileSize      Int?
  uploadedById  String
  uploadedAt    DateTime @default(now())
  status        String   @default("PENDING_REVIEW")
  reviewerNotes String?  @db.Text

  review    RdGateReview      @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  criterion RdStageCriterion? @relation(fields: [criterionId], references: [id], onDelete: SetNull)
  uploader  User              @relation("UserGateEvidence", fields: [uploadedById], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@index([projectId])
  @@map("rd_gate_evidence")
}

model RdGateReviewComment {
  id        String   @id @default(cuid())
  tenantId  String
  reviewId  String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())

  review RdGateReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  author User         @relation("UserGateComments", fields: [userId], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@map("rd_gate_review_comments")
}
```

---

## 4. Backend Service & API Specification

### 4.1 Service Layer Architecture (`rdGovernanceService.js`)
- `ensureDefaultTemplate(tenantId, userId)`: Auto-seeds the standard 5-stage innovation process with 13 criteria and 5 decision gates.
- `getTemplates(tenantId)`: Retrieves all configured templates.
- `createTemplate(tenantId, data, userId)`: Configures custom templates with stages, gates, criteria, and roles.
- `initializeProjectGovernance(tenantId, projectId, data, userId)`: Initializes an R&D project at Stage 1 and spins up the initial Gate 1 review cycle.
- `getProjectGovernance(tenantId, projectId)`: Returns full governance context, current stage, gate review, criteria, and history.
- `submitGateReview(tenantId, reviewId, data, userId)`: Enforces exit criteria and evidence validation, moving review to `SUBMITTED`.
- `assignReviewers(tenantId, reviewId, data, assignedById)`: Assigns gatekeepers and moves review to `UNDER_REVIEW`.
- `submitSignOff(tenantId, reviewId, data, userId)`: Records evaluator recommendation and comments.
- `uploadEvidence(tenantId, reviewId, data, userId)`: Links supporting research documents/datasets to criteria.
- `recordGateDecision(tenantId, reviewId, data, userId)`: Executes atomic state transitions based on outcome:
  - `GO_CONTINUE`: Advances project to next stage, marks review `APPROVED`, creates next review cycle.
  - `HOLD`: Suspends project governance (`ON_HOLD`), stores `holdReason`.
  - `REWORK_RECYCLE`: Marks review `REWORK_REQUIRED`, creates cycle $N+1$ review instance.
  - `TERMINATE_KILL`: Marks governance `TERMINATED`, stores `terminationReason`, preserves data.
  - `REQUEST_MORE_INFO`: Sets `MORE_INFO_REQUIRED` with clarification notes.
- `resumeHeldGovernance(tenantId, projectId, data, userId)`: Resumes held project to `ACTIVE`.
- `getDashboardMetrics(tenantId)`: Computes stage distribution, active reviews, pending sign-offs.
- `getReviewerInbox(tenantId, userId)`: Returns assigned reviews for the authenticated user.

### 4.2 REST API Endpoint Inventory
| HTTP Method | Route | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rd/governance/templates` | List stage templates | All authenticated |
| `POST` | `/api/rd/governance/templates` | Create custom template | Admin / Lead |
| `GET` | `/api/rd/governance/templates/:id` | Get template detail | All authenticated |
| `GET` | `/api/rd/governance/dashboard` | Dashboard KPI metrics | All authenticated |
| `GET` | `/api/rd/governance/inbox` | Assigned reviewer inbox | All authenticated |
| `GET` | `/api/rd/governance/projects` | Governed projects table | All authenticated |
| `POST` | `/api/rd/governance/projects/:id/initialize` | Initialize project | Lead / Admin |
| `GET` | `/api/rd/governance/projects/:id` | Project governance detail | All authenticated |
| `POST` | `/api/rd/governance/projects/:id/resume` | Resume held project | Lead / Admin |
| `POST` | `/api/rd/governance/reviews/:id/submit` | Submit gate for review | Lead / Author |
| `POST` | `/api/rd/governance/reviews/:id/reviewers` | Assign gatekeepers | Lead / Admin |
| `POST` | `/api/rd/governance/reviews/:id/sign-off` | Submit evaluator sign-off | Assigned Reviewer |
| `POST` | `/api/rd/governance/reviews/:id/evidence` | Attach evidence document | Lead / Author |
| `POST` | `/api/rd/governance/reviews/:id/decision` | Record authoritative decision | Gatekeeper / Admin |

---

## 5. Frontend User Experience (`RdStageGate.jsx`)

The frontend is implemented in `frontend/src/pages/rd/RdStageGate.jsx` and mounted into `EgolyticsHub.jsx`.

### Key UX Capabilities
1. **Interactive Visual Stage-Gate Pipeline:**
   - Displays all stages horizontally in sequential order with status flags (Passed, Active, Upcoming).
   - Embedded Gate Cards beneath each stage showing policy, review status, and one-click "Open Review" action.
2. **Project Detail & Criteria Checklist:**
   - Real-time breakdown of entry and exit requirements with mandatory flags and evidence indicators.
   - Stage progression history log showing who authorized each step and why.
3. **Gate Review & Decision Workspace Modal:**
   - Review overview, attached evidence documents viewer with "Attach Evidence" dialog.
   - Assigned reviewers checklist and formal sign-offs list showing recommendations (`APPROVE`, `REJECT`, `REWORK`, `HOLD`).
   - Evaluator Sign-Off Form with recommendation picker and comments.
   - Authoritative Decision Form with outcome dropdown (`GO_CONTINUE`, `HOLD`, `REWORK_RECYCLE`, `TERMINATE_KILL`, `REQUEST_MORE_INFO`) and mandatory justification text area.
4. **Governed Projects Table:** Filterable, paginated project overview showing stage health, budgets, and gate statuses.
5. **Reviewer Inbox:** Dedicated view for domain specialists to review pending gates.
6. **Project Initialization Modal:** Assigns stage templates to ungoverned R&D initiatives.

---

## 6. Security, Multi-Tenancy & Zero Regression Verification

- **Multi-Tenant Isolation:** Enforced via `req.user.tenantId` in all service operations. Cross-tenant access is blocked with HTTP 404/403.
- **RBAC Security:** Configuration and authoritative decisions are gated to authorized roles (`BUSINESS_OWNER`, `SUPER_ADMIN`, `RD_MANAGER`).
- **Data Preservation:** Zero existing tables or records were modified or dropped. All 14 users and 2 tenants remain 100% intact.
