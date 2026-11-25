# EGOLYTICS MASTER PROMPT 06: TIMELINE & SCHEDULE TRACKING REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 06 of 16  
**Module Focus:** Chronological Timeline Views (Requirement 14) & Schedule Variance Integration (Requirements 19 & 20)  
**Author:** Principal Software Architect & QA Automation Engineer  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable specifies the implementation and mathematical verification of the **Chronological Timeline Engine** (Client Requirement 14) and its integration with existing Schedule Tracking (Requirement 19) and Schedule Variance Alerts (Requirement 20).

The timeline engine synthesizes milestone target dates, task execution intervals, critical path deliverables, and schedule baseline deviations into a chronological event stream with real-time filtering capabilities.

---

## 2. Event Model & Normalization Architecture

The backend timeline service (`backend/src/services/rdGanttService.js` $\rightarrow$ `getProjectTimeline`) queries three primary entities and normalizes them into a unified chronological event stream:

### 2.1 Event Schema:
```typescript
interface TimelineEvent {
  id: string;
  entityType: 'MILESTONE' | 'TASK_START' | 'TASK_DUE' | 'BASELINE_SLIPPAGE';
  title: string;
  date: string; // ISO-8601 UTC date string
  status: string;
  priority: string;
  isCritical: boolean;
  progress: number;
  metadata: {
    durationDays?: number;
    varianceDays?: number;
    milestoneId?: string;
    assignedUser?: { name: string; email: string };
  };
}
```

### 2.2 Event Generation Rules:
1. **Milestones:** Emitted as milestone checkpoint events at `plannedEndDate` or `actualCompletionDate`.
2. **Tasks (Start Event):** Emitted at `startDate` representing work kickoff.
3. **Tasks (Due Event):** Emitted at `dueDate` representing target completion.
4. **Baseline Drift:** Emitted when `dueDate > baselineEndDate` indicating schedule variance slippage.

---

## 3. Strict Chronological Ordering & Filtering

All events are sorted chronologically by timestamp:
$$\text{SortComparator}(E_a, E_b) = \text{new Date}(E_a.\text{date}).\text{getTime}() - \text{new Date}(E_b.\text{date}).\text{getTime}()$$

### Dynamic Filter Modes:
- **`ALL`:** Full project narrative combining all milestones, task kickoffs, deadlines, and slippages.
- **`MILESTONES`:** Executive view filtering exclusively for milestone governance checkpoints.
- **`TASKS`:** Operational view focusing on task start and completion boundaries.
- **`CRITICAL`:** High-priority view isolating only critical path items ($T_{\text{float}} = 0$).

### Verification Proof (AC-27):
In the automated verification test suite (`backend/test_egolytics_master_06.js`):
- 10+ events generated across milestones, tasks, and baselines.
- Chronological monotonicity strictly validated: $\forall i \in [1, N-1], \text{Date}(E_i) \ge \text{Date}(E_{i-1})$.

---

## 4. Integration with Schedule Tracking & Variance Alerts

Rather than duplicating schedule variance logic, Master Prompt 06 directly consumes the existing Master Prompt 05 services:
1. **`rdTaskService.getScheduleVariance(tenantId, projectId)`:** Computes start variance ($\Delta S$) and finish variance ($\Delta F$) in days:
   $$\Delta F = \operatorname{round}\left( \frac{\text{task.dueDate} - \text{baseline.baselineEndDate}}{86400000} \right)$$
2. **`rdTaskService.scanAndGenerateAlerts(tenantId, projectId)`:** Scans for schedule slips, impending deadlines, and critical path delays, emitting deduplicated alerts into `rd_schedule_alerts`.
3. **Automated Alert Generation:** Whenever dates are rescheduled via the Gantt or Timeline view (`PATCH /api/rd/gantt/tasks/:id/dates`), the alert scanner runs automatically.

---

## 5. UI Presentation & Interaction

The timeline view is embedded as a dedicated sub-view in `frontend/src/pages/rd/RdGanttWorkspace.jsx`:
- **Vertical Visual Spine:** Styled chronological spine with category icons (Diamonds for milestones, checkmarks for tasks, alert triangles for slips).
- **Date Sticky Headers:** Events grouped by calendar day and week for quick scanning.
- **Quick Actions:** Click-through to view task details, update milestone status, or acknowledge schedule alerts.
