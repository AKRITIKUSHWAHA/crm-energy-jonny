# EGOLYTICS MASTER PROMPT 09: RISK MANAGEMENT & 5X5 MATRIX REPORT
**Module:** EgoLytics R&D Management Division  
**Requirements Covered:** Client Requirement 32 (Risk Registers) & Client Requirement 33 (Risk Scoring & 5x5 Matrix)  
**Implementation Status:** Production Complete  
**Date:** November 2026  

---

## 1. Executive Summary

Requirements 32 and 33 require a proactive R&D Risk Management system featuring:
1. Structured risk identification, categorization, ownership, and mitigation action tracking (Req 32).
2. Mathematical risk scoring using the standard formula $\text{Risk Score} = \text{Probability} \times \text{Impact}$ across 1 to 25, classification into Low, Moderate, High, Critical levels, and an interactive 5×5 visual risk matrix (Req 33).

---

## 2. Mathematical Scoring & Classification Engine

The backend service strictly computes risk metrics on the server side to ensure mathematical integrity:

$$\text{Probability} \in [1, 5], \quad \text{Impact} \in [1, 5]$$
$$\text{Risk Score} = \text{Probability} \times \text{Impact} \in [1, 25]$$

### Classification Thresholds:
- **LOW:** $\text{Score} \in [1, 4]$ (Green)
- **MODERATE:** $\text{Score} \in [5, 9]$ (Blue)
- **HIGH:** $\text{Score} \in [10, 16]$ (Amber)
- **CRITICAL:** $\text{Score} \in [17, 25]$ (Red)

Residual risk scores are independently calculated following mitigation assessments:
$$\text{Residual Score} = \text{Residual Probability} \times \text{Residual Impact}$$

---

## 3. Database Schema Architecture

Three dedicated tables implement this requirement:

### `rd_risks`
- `id`, `tenantId`, `projectId`: Keys & scoping.
- `riskCode`: Auto-generated unique identifier (`RSK-YYYY-XXX`).
- `title`, `description`: Risk details.
- `category`: `TECHNICAL`, `SCHEDULE`, `BUDGET`, `RESOURCE`, `REGULATORY`, `SCIENTIFIC`, `OPERATIONAL`, `EXTERNAL`, `MARKET`.
- `probability`: Integer 1 to 5.
- `impact`: Integer 1 to 5.
- `riskScore`: Integer 1 to 25.
- `riskLevel`: `LOW`, `MODERATE`, `HIGH`, `CRITICAL`.
- `status`: `IDENTIFIED`, `ASSESSED`, `MITIGATION_PLANNED`, `MITIGATION_ACTIVE`, `MONITORING`, `RETIRED`, `MATERIALIZED`.
- `strategy`: `MITIGATE`, `AVOID`, `TRANSFER`, `ACCEPT`.
- `ownerId` / `ownerName`: Designated risk owner.
- `contingencyPlan`, `triggerCondition`: Operational action triggers.
- `residualProbability`, `residualImpact`, `residualScore`: Post-mitigation metrics.
- `reviewFrequency`: `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `STAGE_GATE`.
- `lastReviewedAt`, `nextReviewDate`: Cadence timestamps.

### `rd_risk_mitigations`
- `id`, `tenantId`, `riskId`: Foreign keys.
- `actionTitle`, `actionDescription`: Mitigation task.
- `ownerId`, `ownerName`, `dueDate`: Execution metadata.
- `status`: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- `progressPercent`: 0 to 100%.
- `effectiveness`: `HIGH`, `MEDIUM`, `LOW`, `INEFFECTIVE`.
- `completedAt`: Timestamp.

### `rd_risk_review_histories`
- `id`, `tenantId`, `riskId`: Foreign keys.
- `reviewerId`, `reviewerName`: Person conducting review.
- `previousScore`, `newScore`, `previousLevel`, `newLevel`: Score progression.
- `reviewNotes`: Reassessment narrative.
- `createdAt`: Timestamp.

---

## 4. 5×5 Risk Matrix API & Interactive Visualization

Endpoint `GET /api/rd/governance-ops/risks/matrix?projectId=...` generates a 2D matrix structure:
- 25 discrete coordinate cells: `matrix[p][i]` where $p \in [1, 5], i \in [1, 5]$.
- Each cell contains: `score`, `level`, `count`, and `risks[]`.
- High-level distribution summary: `total`, `critical`, `high`, `moderate`, `low`, and `active`.

In the React UI (`RdGovernanceOpsWorkspace.jsx`):
- Engineers can toggle between Table View and **Interactive 5x5 Matrix View**.
- Clicking any grid cell opens a drill-down list displaying the specific risks resident in that probability/impact coordinate.

---

## 5. Verification Results

- **AC-06**: Verified creation with auto-generated code `RSK-YYYY-XXX`.
- **AC-07**: Verified exact mathematical calculation ($4 \times 5 = 20$).
- **AC-08**: Verified classification into `CRITICAL` ($\ge 17$) and `LOW` ($2 \times 2 = 4$).
- **AC-09**: Verified creation and tracking of mitigation action plans.
- **AC-10**: Verified reassessment updates score, level, residual score, and logs review history.
- **AC-11 & AC-12**: Verified 5x5 grid generation with 25 cells and accurate counts.
