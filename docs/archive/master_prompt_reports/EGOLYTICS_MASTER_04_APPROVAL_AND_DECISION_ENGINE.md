# EGOLYTICS MASTER PROMPT 04 — APPROVAL & DECISION ENGINE SPECIFICATION
**Project:** EgoLytics – R&D Management Tool  
**Division:** CRM nErgy AI  
**Roadmap Phase:** Master Prompt 04 of 16  
**Implementation Focus:** Multi-Person Reviews, Approval Policies & The 5 Decision Outcomes  
**Date of Execution:** November 2026  
**Author:** Principal Software Architect & Enterprise Workflow Specialist

---

## 1. Executive Summary

This document provides a technical and operational specification for the **EgoLytics Decision Gate Engine**. Implementing **Requirement 8 (Decision Checkpoints)** and **Requirement 31 (Decision Logs)** from `EgoLytics - R_D Management Tool.docx`, this system replaces ad-hoc sign-offs with an accountable, auditable decision framework.

The engine supports multi-person gatekeeper reviews, configurable consensus policies, individual evaluator recommendations, and five distinct, immutable gate decision outcomes: **`GO_CONTINUE`**, **`HOLD`**, **`REWORK_RECYCLE`**, **`TERMINATE_KILL`**, and **`REQUEST_MORE_INFO`**.

---

## 2. Gatekeeper & Reviewer Responsibilities

In R&D organizations, different stakeholders review different dimensions of a project:
- **`GATEKEEPER`:** Accountable business or technical executive authorized to submit binding sign-offs and execute final gate decisions.
- **`TECHNICAL_REVIEWER`:** Domain specialist evaluating scientific soundness, methodology, and experimental validity.
- **`FINANCIAL_REVIEWER`:** Budget controller assessing burn rate, ROI projection, and capital expenditure needs.
- **`EXECUTIVE`:** Senior leadership reviewing strategic alignment with enterprise goals.

### 2.1 Assignment Architecture (`RdGateReviewer`)
Reviewers are linked to specific review cycles via `POST /api/rd/governance/reviews/:id/reviewers`:
- Each assignment tracks status (`PENDING` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `SIGN_OFF_SUBMITTED`).
- When reviewers are assigned, the parent review status automatically transitions from `SUBMITTED` to `UNDER_REVIEW`.

---

## 3. Configurable Approval Policies

Decision gates support configurable approval policies to accommodate different organizational governance models:

| Policy Code | Rule Description | Enforcement Logic |
| :--- | :--- | :--- |
| **`ALL_MUST_APPROVE`** | Unanimous gatekeeper sign-off required | If any assigned reviewer has submitted a recommendation other than `APPROVE`, `GO_CONTINUE` is blocked. |
| **`MINIMUM_COUNT`** | Requires at least $K$ approval sign-offs | `approveSignOffs.length >= requiredSignOffCount`. Blocks `GO_CONTINUE` if threshold unmet. |
| **`SINGLE_GATEKEEPER`**| Designates one primary gatekeeper | Only the primary gatekeeper's sign-off is required to authorize progression. |

---

## 4. Individual Reviewer Sign-Offs (`RdGateSignOff`)

Reviewers submit recommendations via `POST /api/rd/governance/reviews/:id/sign-off`:
- **Allowed Recommendations:** `APPROVE`, `REJECT`, `REWORK`, `HOLD`, `MORE_INFO`.
- **Comments:** Text field capturing specific feedback or reservations.
- **Immutability:** Sign-off submissions update the evaluator's record and timestamp without erasing prior cycle history.
- **Duplicate Prevention:** A unique compound index `@@unique([reviewId, userId])` prevents duplicate sign-offs within the same review cycle.

---

## 5. The 5 Authoritative Decision Outcomes

Final decisions are executed via `POST /api/rd/governance/reviews/:id/decision` and logged in `RdGateDecision`. A non-empty `decisionReason` is mandatory for all final decisions.

### 5.1 Outcome 1: `GO_CONTINUE` (Advance Project)
- **Condition:** Verified against entry/exit criteria and approval policy compliance.
- **System Actions:**
  1. Current review marked `status = 'APPROVED'`.
  2. Project advanced to the next configured stage ($stageNumber + 1$).
  3. `ErpProject.stage` updated with new stage name.
  4. Next `RdGateReview` cycle created in `READY_FOR_REVIEW` state.
  5. Stage history logged with event `ADVANCED`.
  6. If the final stage has been completed, governance is marked `COMPLETED`.

### 5.2 Outcome 2: `HOLD` (Suspend Progression)
- **Condition:** Project temporarily paused (e.g. pending budget release, equipment delivery, or regulatory clarity).
- **System Actions:**
  1. Current review marked `status = 'ON_HOLD'`.
  2. `RdProjectGovernance.governanceStatus` set to `'ON_HOLD'`.
  3. `RdProjectGovernance.holdReason` populated with mandatory justification.
  4. Stage history logged with event `HELD`.
  5. **Safety Guard:** All subsequent gate submissions and advancement calls are strictly rejected by the backend API until resumed.

### 5.3 Outcome 3: `REWORK_RECYCLE` (Request Corrections)
- **Condition:** Deliverables fail technical benchmarks or require recalibration before a decision can be made.
- **System Actions:**
  1. Current review marked `status = 'REWORK_REQUIRED'`.
  2. `RdProjectGovernance.governanceStatus` set to `'REWORK_REQUIRED'`.
  3. New `RdGateReview` instance automatically generated with `cycleNumber: currentReview.cycleNumber + 1` in `READY_FOR_REVIEW` state.
  4. Previous review cycle remains preserved in database for historical comparison.
  5. Stage history logged with event `REWORK_REQUESTED`.

### 5.4 Outcome 4: `TERMINATE_KILL` (Stop Project Permanently)
- **Condition:** Fundamental scientific road-blocks, loss of market viability, or negative experimental results.
- **System Actions:**
  1. Current review marked `status = 'REJECTED'`.
  2. `RdProjectGovernance.governanceStatus` set to `'TERMINATED'`.
  3. `RdProjectGovernance.terminationReason` populated with mandatory rationale.
  4. Stage history logged with event `TERMINATED`.
  5. **Data Preservation:** Underlying `ErpProject`, its budget, evidence, and historical data are **never deleted**. Negative results are cataloged to avoid duplicating failed research in the future.

### 5.5 Outcome 5: `REQUEST_MORE_INFO` (Clarification Cycle)
- **Condition:** Reviewers require additional laboratory data, test curves, or patent opinions.
- **System Actions:**
  1. Current review marked `status = 'MORE_INFO_REQUIRED'`.
  2. `moreInfoRequestedNotes` stores specific reviewer directives.
  3. Stage history logged with event `MORE_INFO_REQUESTED`.
  4. Project lead can attach additional evidence and re-submit.

---

## 6. Concurrency & Transaction Safeguards

All critical governance actions are wrapped in atomic database transactions (`prisma.$transaction`):
1. **Decision Concurrency:** If two gatekeepers attempt to submit conflicting final decisions simultaneously, the transaction ensures deterministic execution.
2. **Partial Update Prevention:** A stage transition updates the review status, project stage, governance instance, and stage history atomically. If any query fails, all mutations rollback cleanly.
3. **Audit Trail Completeness:** Every decision creates an entry in `rd_gate_decisions`, `rd_project_stage_histories`, and `activities`.
