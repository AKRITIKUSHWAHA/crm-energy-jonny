# EGOLYTICS MASTER PROMPT 03: PRE-IMPLEMENTATION ANALYSIS REPORT
**Platform:** EgoLytics – Research & Development Management Tool  
**Parent Ecosystem:** CRM nErgy Enterprise AI Platform  
**Phase:** Master Prompt 03 of 16  
**Module:** Idea Management & Innovation Scoring Engine  
**Execution Date:** 2026-11-24  

---

## 1. Executive Context & Objective

As mandated by **Master Prompt 03**, this document establishes the pre-implementation baseline, architectural assessment, reusable infrastructure, and integration roadmap for the **Idea Management & Innovation Scoring Engine**.

EgoLytics is an enterprise R&D Management platform extending the CRM nErgy AI SaaS ecosystem. Following the successful completion and verification of Master Prompt 01 (Foundation & Architecture) and Master Prompt 02 (R&D Project Portfolio & Intake Management), Master Prompt 03 focuses on early-stage innovation capture, collaborative evaluation, and mathematical scoring.

---

## 2. Authoritative Requirements & Scope Confirmation

Based on `EgoLytics - R_D Management Tool.docx` and `EGOLYTICS_CLIENT_REQUIREMENT_VERIFICATION_AND_GAP_ANALYSIS.md`:

### In-Scope Requirements:
1. **Requirement 3 – Idea Capture:**
   - Quick capture portal for innovation concepts, research problems, and suggestions.
   - Tagging, problem statements, proposed solutions, expected impact, and contributor attribution.
   - Draft vs. Submitted state management.
2. **Requirement 4 – Idea Evaluation and Scoring:**
   - Multi-criteria scoring rubrics: Technical Feasibility, Market Impact, and Technical Risk.
   - Configurable evaluation criteria with customizable weights summing to exactly 100%.
   - Support for directional scoring: *Higher-is-better* (e.g. Feasibility, Impact) and *Lower-is-better* (e.g. Technical Risk inverted score).
   - Reviewer assignment, individual evaluator score submission, and multi-evaluator score aggregation.
   - Immutable rubric versioning preserving historical evaluation context.
3. **Requirement 61 – Idea Management:**
   - Ideation Hub with database-backed upvoting (strict 1 vote per user constraint).
   - Community/team feedback and threaded comments.
   - Categorization (Product Innovation, Process Improvement, Sustainability, etc.).
   - Idea lifecycle state machine (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `MORE_INFO_REQUIRED` $\rightarrow$ `ACCEPTED_FOR_INCUBATION` / `REJECTED` / `ARCHIVED`).
4. **Requirement 62 – Innovation Pipeline Tracking (Basic Funnel):**
   - Stage-wise idea counts and distribution percentages.
   - Pipeline funnel view visualizing idea progression through lifecycle stages.

### Explicit Out-of-Scope Boundaries:
- **Project Intake & Proposals:** Already implemented in Master Prompt 02 (`ProjectProposal` entity); must not be duplicated or modified.
- **R&D Project Portfolio & Project Prioritization:** Master Prompt 02's `ErpProject` prioritization remains distinct from early-stage idea evaluation scores.
- **Stage-Gate Governance Engine:** Tollgates, Go/Kill/Hold/Recycle decisions, and gatekeeper committees belong strictly to Master Prompt 04.
- **Hypothesis & Lab Notebooks:** Belongs to Master Prompts 07 & 08.
- **GIS Maplytics & BFOV Charts:** Belongs to Master Prompts 09-12.

---

## 3. Existing Codebase Inspection & Reusable Assets

### 3.1 Backend Architecture
- **Framework:** Express 5 on Node.js v24.
- **Active Backend Port:** `5002` (configured in `backend/.env`).
- **Database:** MySQL on port `3307` (`crm-db`). Current live state: 14 users, 2 tenants, 27 tables.
- **Prisma Client:** v6.4.1.
- **Authentication & Security Middleware:**
  - `backend/src/middleware/auth.js`: Verifies signed JWT Bearer tokens and extracts `req.user` (`userId`, `tenantId`, `role`, `email`).
  - `backend/src/middleware/tenantIsolation.js`: Enforces strict tenant scoping (`validateTenantScope`).
- **Audit Logging:** Existing `activities` table captures immutable user events.
- **R&D Routing Hub:** `backend/src/routes/rdRoutes.js` already hosts Master 01 and Master 02 routes.

### 3.2 Frontend Architecture
- **Framework:** React 18 with Vite 5.4.
- **R&D Hub:** `frontend/src/pages/rd/EgolyticsHub.jsx` mounted at `/crm/rd` and `/crm/rd/*`.
- **UI Component System:** `frontend/src/components/ui/` provides standard design tokens: `Button`, `Input`, `Select`, `Card`, `Badge`, `KPICard`, `Table`, `ProgressBar`, `Modal`, `Tabs`, `Breadcrumb`.
- **RBAC & Navigation:** `frontend/src/utils/rbac.js` and `frontend/src/data/mockData.js`.

### 3.3 Assessment of Existing Idea Functionality
Independent repository inspection confirmed that **zero idea management files or database tables currently exist**. All idea features are completely missing from the existing codebase and will be implemented cleanly and additively.

---

## 4. Database Architecture & Additive Schema Plan

To avoid any disruption to existing CRM, ERP, or Master 02 data, the following 9 additive models will be created in `backend/prisma/schema.prisma`:

1. `RdIdea`: Core research idea record with reference code (`IDEA-2026-XXXX`), title, problem statement, solution, status, vote count, evaluation count, and composite score.
2. `RdIdeaCategory`: Database-backed category management with tenant scoping and display order.
3. `RdIdeaVote`: Atomic upvoting with unique composite key `@@unique([ideaId, userId])` to prevent duplicate votes.
4. `RdIdeaComment`: Discussion comments and feedback linked to ideas.
5. `RdIdeaReviewer`: Reviewer assignment records tracking evaluator assignments and completion status.
6. `RdIdeaEvaluationRubric`: Tenant-specific scoring rubric definitions with active status and version numbering.
7. `RdIdeaEvaluationCriterion`: Individual criteria under a rubric (`weight`, `direction: HIGHER_IS_BETTER | LOWER_IS_BETTER`).
8. `RdIdeaEvaluation`: An evaluator's submitted score card capturing rubric version, composite weighted score, and comments.
9. `RdIdeaEvaluationScore`: Individual criterion scores (`rawScore`, `normalizedScore`, `weightedContribution`).

---

## 5. Implementation Roadmap & File Changes

### Files to be Created:
- **Database / Schema:**
  - `backend/prisma/schema.prisma` (additive updates)
- **Backend Services & Controllers:**
  - `backend/src/services/rdIdeaService.js`
  - `backend/src/controllers/rdIdeaController.js`
  - `backend/src/services/rdScoringService.js`
  - `backend/src/controllers/rdScoringController.js`
- **Frontend Pages & Components:**
  - `frontend/src/pages/rd/RdIdeas.jsx` (Idea Management Hub)
  - `frontend/src/pages/rd/RdIdeaRanking.jsx` (Leaderboard & Scoring breakdown)
  - `frontend/src/pages/rd/RdInnovationPipeline.jsx` (Funnel visualization)
- **Automated Test Suite:**
  - `backend/test_egolytics_master_03.js`

### Files to be Modified:
- `backend/src/routes/rdRoutes.js` (mounting `/api/rd/ideas/*`)
- `backend/src/controllers/rdController.js` (registering `mod-03-ideation` as `ACTIVE`)
- `frontend/src/pages/rd/EgolyticsHub.jsx` (adding tabs for Ideas, Ranking, and Pipeline)
- `frontend/src/data/mockData.js` (navigation registry)
- `frontend/src/utils/rbac.js` (role permissions & route mappings)

---

## 6. Mathematical Evaluation & Technical Risk Formula

The weighted evaluation calculation is formalized as follows:

$$\text{Normalized Score} = 
\begin{cases} 
\left(\frac{\text{Raw} - \text{Min}}{\text{Max} - \text{Min}}\right) \times 100, & \text{if Direction} = \text{HIGHER\_IS\_BETTER} \\
100 - \left[\left(\frac{\text{Raw} - \text{Min}}{\text{Max} - \text{Min}}\right) \times 100\right], & \text{if Direction} = \text{LOWER\_IS\_BETTER (e.g. Risk)}
\end{cases}$$

$$\text{Evaluator Weighted Score} = \sum_{i=1}^{n} \left(\text{Normalized Score}_i \times \text{Weight}_i\right)$$

$$\text{Idea Composite Score} = \frac{1}{m} \sum_{j=1}^{m} \text{Evaluator Weighted Score}_j$$

Where:
- $\sum \text{Weight}_i = 1.0$ (100%).
- Ideas with no completed evaluations display as **`Not Evaluated`** (never defaulting to 0).
- Vote totals remain completely distinct from official expert evaluation scores.

---

## 7. Pre-Implementation Sign-Off

The requirements have been analyzed and verified against the authoritative client specification. Implementation will proceed with additive database changes, strict multi-tenant scoping, and zero regression to existing systems.
