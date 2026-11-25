# EGOLYTICS MASTER PROMPT 09: ISSUE & CHANGE MANAGEMENT REPORT
**Module:** EgoLytics R&D Management Division  
**Requirements Covered:** Client Requirement 34 (Issue Tracking) & Client Requirement 35 (Change Management)  
**Implementation Status:** Production Complete  
**Date:** November 2026  

---

## 1. Executive Summary

This report documents the implementation of Client Requirements 34 and 35:
- **Requirement 34 (Issue Tracking):** Complete issue registration, priority and severity levels, root cause analysis, resolution tracking, discussion threads, and cross-linking to risks, tasks, and experiments.
- **Requirement 35 (Change Management):** Formal change request workflow, multi-dimensional impact assessment (scope, schedule, budget, risk), review and approval governance, and implementation tracking.

---

## 2. Issue Tracking Implementation (Req 34)

### Database Schemas
- `rd_issues`: Stores issue records with code `ISS-YYYY-XXX`, category, priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `BLOCKER`), severity (`MINOR`, `MODERATE`, `MAJOR`, `CRITICAL`), status (`OPEN`, `UNDER_INVESTIGATION`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `WONT_FIX`), `rootCause`, `resolution`, `sourceRiskId`, `linkedTaskId`, `linkedExperimentId`, `resolvedAt`, and `closedAt`.
- `rd_issue_comments`: Threaded comments with `isInternalOnly` privacy toggle.

### Lifecycle Workflow
```
[ OPEN ] ---> [ UNDER_INVESTIGATION ] ---> [ IN_PROGRESS ] ---> [ RESOLVED ] ---> [ CLOSED ]
                                                                       |
                                                                       +---> [ WONT_FIX ]
```
When an issue transitions to `RESOLVED`, the system captures `resolvedAt` and `resolution` narrative. Transitioning to `CLOSED` captures `closedAt`.

---

## 3. Change Management Implementation (Req 35)

### Impact Assessment Architecture
Every change request (`CR-YYYY-XXX`) assesses impact across four dimensions:
1. **Scope Impact:** Narrative describing alterations to features, protocols, or deliverables.
2. **Schedule Impact:** Integer number of days delayed or expedited (`scheduleImpactDays`).
3. **Cost Impact:** Monetary budget variance in USD (`costImpactAmount`).
4. **Risk Impact:** Qualitative analysis of risk profile changes.

### Approval & Implementation Workflow
```
[ DRAFT ] ---> [ SUBMITTED ] ---> [ UNDER_REVIEW ] ---> [ APPROVED ] ---> [ IMPLEMENTED ]
                                                            |
                                                            +---> [ REJECTED ]
```
Only change requests in status `APPROVED` can be transitioned to `IMPLEMENTED` with documented implementation notes.

---

## 4. API Endpoints

### Issues (Req 34)
- `GET /api/rd/governance-ops/issues`: Query issues with filters by priority, severity, category, status.
- `POST /api/rd/governance-ops/issues`: Log an issue with auto-generated code `ISS-YYYY-XXX`.
- `GET /api/rd/governance-ops/issues/:id`: Retrieve issue with discussion comments.
- `PUT /api/rd/governance-ops/issues/:id`: Edit issue details.
- `POST /api/rd/governance-ops/issues/:id/status`: Transition status (`RESOLVED`, `CLOSED`) with resolution notes.
- `POST /api/rd/governance-ops/issues/:id/comments`: Add discussion comments with internal visibility toggle.

### Change Requests (Req 35)
- `GET /api/rd/governance-ops/change-requests`: Query change requests with filters.
- `POST /api/rd/governance-ops/change-requests`: Submit change request with multi-dimensional impact.
- `GET /api/rd/governance-ops/change-requests/:id`: Get change request details.
- `PUT /api/rd/governance-ops/change-requests/:id`: Edit change request.
- `POST /api/rd/governance-ops/change-requests/:id/review`: Approve or Reject change request with reviewer comments.
- `POST /api/rd/governance-ops/change-requests/:id/implement`: Mark as implemented with notes and timestamp.

---

## 5. Verification Results

- **AC-13**: Verified issue creation with code `ISS-YYYY-XXX`.
- **AC-14**: Verified comment creation with internal visibility support.
- **AC-15 & AC-16**: Verified lifecycle status transitions to `RESOLVED` and `CLOSED` recording respective timestamps.
- **AC-17**: Verified issue filtering by project and priority.
- **AC-18 & AC-19**: Verified change request creation with multidimensional impact (7 days, $4,500.00).
- **AC-20**: Verified approval workflow with reviewer comments and reviewed timestamp.
- **AC-21**: Verified rejection workflow.
- **AC-22**: Verified implementation workflow recording `implementedAt` and completion notes.
