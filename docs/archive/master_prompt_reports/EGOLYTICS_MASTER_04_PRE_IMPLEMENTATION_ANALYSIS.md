# EGOLYTICS MASTER PROMPT 04 — PRE-IMPLEMENTATION AUDIT & ANALYSIS
**Project:** EgoLytics – R&D Management Tool  
**Division:** CRM nErgy AI  
**Roadmap Phase:** Master Prompt 04 of 16  
**Module Focus:** Stage-Gate Governance & Approval Workflow (Requirements 7, 8, 31)  
**Date of Audit:** November 2026  
**Auditor:** Principal Enterprise Software Architect, Senior Full-Stack Engineer & Governance Specialist

---

## 1. Executive Summary

This pre-implementation analysis audits the existing CRM nErgy and EgoLytics codebase prior to implementing **Master Prompt 04: Stage-Gate Governance & Approval Workflow**. 

EgoLytics has successfully delivered:
- **Master Prompt 01:** Foundation architecture, multi-tenant isolation, RBAC namespaces, and telemetry (`mod-01-foundation`).
- **Master Prompt 02:** R&D Project Portfolio, Project Intake application proposals, strategic alignment tracking, and multi-factor prioritization (`mod-02-portfolio-intake`).
- **Master Prompt 03:** Idea Quick-Capture Portal, community upvoting, threaded technical comments, multi-criteria rubrics, directional risk scoring, and innovation pipeline tracking (`mod-03-ideation`).

Master Prompt 04 establishes a formal, evidence-driven **Stage-Gate Governance and Decision Checkpoint Engine** covering **Requirement 7 (Stage-Gate Workflows)** and **Requirement 8 (Decision Checkpoints)**. The goal is to enforce structured progression of R&D projects through configured innovation stages, verified entry/exit criteria, multi-person gatekeeper reviews, and auditable decisions (`GO/CONTINUE`, `HOLD`, `REWORK/RECYCLE`, `TERMINATE/KILL`, `REQUEST_MORE_INFO`).

---

## 2. Existing Codebase Audit & Integration Points

### 2.1 Master Prompt 02 Integration Points
- **Primary Entity (`ErpProject`):** R&D projects converted from formal proposals (`ProjectProposal`) or created directly in R&D Portfolio. Existing fields: `id`, `tenantId`, `name`, `budget`, `spent`, `progress`, `status`, `projectType: "RD"`, `priority`, `priorityScore`, `stage: "IDEA"`, `strategicAlignments`.
- **Intake Proposal (`ProjectProposal`):** Manages project intake applications (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `convertedProjectId`).
- **Integration with Master 04:** When a proposal is approved and converted to an R&D `ErpProject`, Master Prompt 04 initializes a dedicated `RdProjectGovernance` instance linking the project to an active Stage-Gate template.

### 2.2 Master Prompt 03 Integration Points
- **Ideation Models:** `RdIdea`, `RdIdeaCategory`, `RdIdeaVote`, `RdIdeaComment`, `RdIdeaReviewer`, `RdIdeaEvaluationRubric`, `RdIdeaEvaluation`, `RdIdeaEvaluationScore`.
- **Ideation Lifecycle:** Ideas move through `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `ACCEPTED_FOR_INCUBATION`.
- **Integration with Master 04:** High-scoring ideas that advance through incubation can be tracked in governance. Lineage fields (`originIdeaId`, `originProposalId`) preserve traceability without schema coupling.
- **Strict Decoupling:** Idea voting popularity and ideation rubric scoring are completely separate from Stage-Gate gatekeeper sign-offs and checkpoint decisions.

### 2.3 Authentication, RBAC & Multi-Tenancy
- **JWT Context:** Express middleware extracts `req.user.userId`, `req.user.tenantId`, `req.user.role`.
- **Database Partitioning:** All tables enforce `tenantId` foreign keys with cascade/set null rules.
- **Tenant Isolation:** Verified by 18 passing tests in Master 03 and 19 passing tests in Master 02.
- **Audit Logging:** System utilizes `prisma.activity.create` for centralized audit logging.

---

## 3. Gap Analysis: Current vs. Required Stage-Gate Capabilities

| Capability | Current State | Required Master Prompt 04 State |
| :--- | :--- | :--- |
| **Stage Configuration** | Static `stage` string on `ErpProject` (default "IDEA") | Configurable `RdStageTemplate`, `RdInnovationStage` with stage order, descriptions, expected deliverables |
| **Criteria Validation** | None | Configurable `RdStageCriterion` (ENTRY and EXIT criteria, mandatory vs. optional, evidence required) |
| **Decision Gates** | None | Configurable `RdDecisionGate` linked to stages with approval policies (`ALL_MUST_APPROVE`, `MINIMUM_COUNT`, `SINGLE_GATEKEEPER`) |
| **Governance Instance** | None | `RdProjectGovernance` tracking applied template, current stage, current gate, governance status (`ACTIVE`, `ON_HOLD`, `REWORK_REQUIRED`, `TERMINATED`, `COMPLETED`) |
| **Gate Review Cycles** | None | `RdGateReview` supporting multiple review cycles, criteria verification, reviewer assignments, and evidence attachments |
| **Reviewer & Gatekeeper Management** | None | `RdGateReviewer` and `RdGateSignOff` tracking individual sign-offs and recommendations |
| **Evidence Management** | None | `RdGateEvidence` linking files/documents to criteria and reviews with approval status |
| **Decision Engine** | None | `RdGateDecision` supporting GO, HOLD, REWORK, TERMINATE, MORE_INFO with mandatory justifications |
| **Progression History** | None | `RdProjectStageHistory` recording every stage transition, gate event, actor, timestamp, and reason |
| **Governance UI** | None | Interactive Stage-Gate visual pipeline, review inbox, gate decision drawer, and template manager |

---

## 4. Proposed Database Schema Design

All schema updates will be **strictly additive** and non-destructive. No pre-existing tables or fields will be dropped or modified.

### New Relational Models
1. **`RdStageTemplate`**: Configurable stage-gate templates per tenant.
2. **`RdInnovationStage`**: Defined innovation stages within a template with order, responsible role, and color.
3. **`RdStageCriterion`**: Entry and exit criteria attached to a stage with validation rules and evidence flags.
4. **`RdDecisionGate`**: Controlled decision gates between stages with approval policy rules.
5. **`RdProjectGovernance`**: Project-specific governance tracking instance linking `ErpProject` to a template.
6. **`RdProjectStageHistory`**: Immutable chronological history of all stage advancements, holds, reworks, and terminations.
7. **`RdGateReview`**: Specific gate review cycle instance for a project.
8. **`RdGateReviewer`**: Assigned gatekeeper/technical reviewer for a gate review.
9. **`RdGateSignOff`**: Individual evaluator recommendation and formal sign-off.
10. **`RdGateDecision`**: Final authoritative gate decision with outcome justification.
11. **`RdGateEvidence`**: Uploaded / linked evidence documents mapped to review criteria.
12. **`RdGateReviewComment`**: Reviewer discussion thread on the gate review.

---

## 5. Proposed Backend Architecture & API Routes

### 5.1 Service & Controller Layer
- `backend/src/services/rdGovernanceService.js`: Core Stage-Gate progression engine, template management, gate submission, sign-off validation, decision outcomes, and stage transitions.
- `backend/src/controllers/rdGovernanceController.js`: Express controller handling REST endpoints with tenant isolation and error handling.
- `backend/src/routes/rdRoutes.js`: Mounts governance REST routes.
- `backend/src/controllers/rdController.js`: Updates telemetry to `Master Prompt 04 of 16` and registers `mod-04-stagegate` as `ACTIVE`.

### 5.2 API Route Inventory
- `GET/POST /api/rd/governance/templates` (Template management)
- `GET/PUT/DELETE /api/rd/governance/templates/:id`
- `POST /api/rd/governance/projects/:id/initialize` (Initialize governance on an R&D project)
- `GET /api/rd/governance/projects/:id` (Get project governance details and current gate)
- `GET /api/rd/governance/projects/:id/history` (Get stage progression history)
- `POST /api/rd/governance/reviews/:gateId/submit` (Submit stage for gate review)
- `GET /api/rd/governance/reviews/:reviewId` (Get gate review details)
- `POST /api/rd/governance/reviews/:reviewId/reviewers` (Assign gatekeepers / reviewers)
- `POST /api/rd/governance/reviews/:reviewId/sign-off` (Submit individual sign-off)
- `POST /api/rd/governance/reviews/:reviewId/evidence` (Upload / link evidence document)
- `POST /api/rd/governance/reviews/:reviewId/decision` (Record formal gate decision: GO, HOLD, REWORK, TERMINATE, MORE_INFO)
- `GET /api/rd/governance/dashboard` (Governance overview metrics)
- `GET /api/rd/governance/inbox` (Assigned reviews inbox)

---

## 6. Proposed Frontend Architecture

### 6.1 Views & Components
- **`frontend/src/pages/rd/RdStageGate.jsx`**: Main Stage-Gate Governance workspace featuring:
  - KPI metric cards: Total Governed Projects, Active Reviews, Pending Decisions, On Hold, Terminated.
  - Interactive Visual Stage-Gate Pipeline: Displays all configured stages and gates with live project placement and progress states.
  - Reviewer Inbox: Dedicated tab for assigned gatekeepers to review submissions and record sign-offs.
  - Project Governance Table: Filterable listing with search, stage filters, and gate status badges.
  - Gate Review Modal / Drawer: Full review workspace with criteria checklist, evidence viewer, reviewer sign-offs, and final decision form.
  - Stage Template Manager Modal: Administrative interface to create templates, reorder stages, and configure criteria.
- **Integration with `EgolyticsHub.jsx`**: Add `stagegate` tab synchronized with `/crm/rd/stagegate`.
- **Navigation in `mockData.js`**: Add `rd-stagegate` menu item with `Workflow` icon.
- **Permissions in `rbac.js`**: Add route mapping for all authorized roles.

---

## 7. Backward Compatibility & Risk Mitigation

1. **Zero Impact on Existing CRM/ERP:** The existing `ErpProject` table retains all commercial and R&D fields. Adding `RdProjectGovernance` does not alter existing ERP logic.
2. **Zero Impact on Master Prompts 02 & 03:** Proposal conversions and idea scoring engines continue operating independently without regression.
3. **Template Snapshotting:** Changes to a stage template do not mutate or corrupt the historical gate reviews of active or completed projects.
4. **Data Preservation:** Safe additive SQL migration ensures all 14 users and 2 tenants remain untouched.

---

## 8. Unresolved Client Decisions (Handled via Configurable Architecture)

1. **Exact Number of Stages & Naming:** The client document mentions Stage-Gate conceptually without fixing a rigid stage count.
   - *Architectural Solution:* Implement a configurable default template ("Standard 5-Stage R&D Lifecycle": Discovery $\rightarrow$ Feasibility Assessment $\rightarrow$ Research & Development $\rightarrow$ Validation & Testing $\rightarrow$ Commercialization Transfer) while allowing full administrator creation of custom templates with any stage count.
2. **Approval Thresholds:** Some organizations require 100% gatekeeper consensus; others require a majority or single gatekeeper sign-off.
   - *Architectural Solution:* Configurable `approvalPolicy` per gate (`ALL_MUST_APPROVE`, `MINIMUM_COUNT`, `SINGLE_GATEKEEPER`).
