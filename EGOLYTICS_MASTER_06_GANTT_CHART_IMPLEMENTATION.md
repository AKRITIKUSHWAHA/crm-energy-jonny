# EGOLYTICS MASTER PROMPT 06: GANTT CHART ENGINE IMPLEMENTATION REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 06 of 16  
**Module Focus:** Interactive Gantt Chart Engine (Requirement 13) & CPM Integration  
**Author:** Principal Software Architect & Mathematical Scheduling Engineer  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable documents the architecture, mathematical integration, and user experience implementation of the **Interactive Gantt Chart Engine** (Client Requirement 13).

The Gantt engine provides a unified, interactive workspace for scheduling, tracking dependencies, visualizing the critical path, and comparing actual progress against baseline snapshots without rebuilding existing dependencies or Critical Path Method (CPM) services from Master Prompt 05.

---

## 2. Architecture & Design Principles

```
+-----------------------------------------------------------------------------------+
|                        FRONTEND: RdGanttWorkspace.jsx                             |
|  [Timescale Selector: Day/Week/Month] [Critical Path Toggle] [Baseline Overlay]   |
+-----------------------------------------------------------------------------------+
|  TASK TREE GRID (Left Pane)        |  TIMELINE CANVAS & SVG OVERLAY (Right Pane)  |
|  - Task Name & Status              |  - Dynamic Day/Week/Month Header Columns    |
|  - Start Date & Due Date Picker    |  - Draggable & Resizable Task Bars          |
|  - Estimated / Actual Hours        |  - Critical Path Red/Amber Glow Borders     |
|  - Milestone Association           |  - Milestone Diamond Indicators             |
|  - Dependency Badges (Pred/Succ)   |  - Ghost Baseline Comparison Bars           |
|  - Total Float / Free Float Metric |  - SVG Dependency Connector Beziers (FS, SS)|
+-----------------------------------------------------------------------------------+
                                         │
                    RESTful API: GET /api/rd/gantt/:projectId
                    PATCH /api/rd/gantt/tasks/:id/dates
                                         ▼
+-----------------------------------------------------------------------------------+
|                         BACKEND: rdGanttService.js                                |
|  - Merges Tasks, Milestones, and SVG Connector Coordinates                        |
|  - Reuses Master 05 CPM Engine (calculateCPM) as Single Source of Truth           |
|  - Reuses Master 05 Baseline & Variance Engine (getScheduleVariance)              |
|  - Reuses Master 05 Alert Scanner (scanAndGenerateAlerts)                         |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        DATABASE: MySQL / MariaDB (crm-db)                         |
|  - tasks (with milestoneId & start/due dates)                                      |
|  - rd_milestones (dynamic deliverables)                                           |
|  - rd_task_dependencies (FS, SS, FF, SF relationships)                            |
|  - rd_task_schedule_baselines (snapshots)                                         |
|  - rd_schedule_alerts (variance notices)                                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Timescale Rendering Engine (Day, Week, Month)

The Gantt chart dynamically computes cell widths and column coordinates based on the selected timescale:
1. **Day View:** 42px per day column with calendar dates and weekend shading.
2. **Week View:** 84px per 7-day week column showing `Week N (Start Date)`.
3. **Month View:** 160px per month column showing `MMM YYYY`.

Task bar positioning is calculated via deterministic pixel offset formulas:
$$\text{PixelOffset}(d) = \left( \frac{\text{Date}(d) - \text{TimelineStartDate}}{1000 \times 60 \times 60 \times 24} \right) \times \text{PixelsPerDay}$$
$$\text{BarWidth}(t) = \max\left( \text{DurationDays}(t) \times \text{PixelsPerDay}, 24\text{px} \right)$$

---

## 4. SVG Dependency Connectors & Routing

Predecessor-successor relationships (`rd_task_dependencies`) are rendered dynamically via an SVG overlay spanning the timeline canvas:
- **Finish-to-Start (FS):** Line leaves the right edge of Predecessor $A$ and enters the left edge of Successor $B$.
- **Start-to-Start (SS):** Line leaves the left edge of Predecessor $A$ and enters the left edge of Successor $B$.
- **Finish-to-Finish (FF):** Line leaves the right edge of Predecessor $A$ and enters the right edge of Successor $B$.
- **Start-to-Finish (SF):** Line leaves the left edge of Predecessor $A$ and enters the right edge of Successor $B$.

### Bezier Routing:
Curved orthogonal cubic Beziers are calculated for clean visual flow:
$$M(x_1, y_1) \rightarrow C(x_1 + \delta, y_1, x_2 - \delta, y_2, x_2, y_2)$$
Where $\delta = 16\text{px}$. If both tasks are critical ($T_{\text{float}} = 0$), the connector stroke is highlighted with vibrant Crimson Red (`#ef4444`) and arrowhead markers.

---

## 5. Critical Path Highlighting & Mathematical Integration

The Gantt engine integrates directly with `rdTaskService.calculateCPM` from Master Prompt 05:
- **Zero Duplication:** The Gantt view does not re-implement CPM in JavaScript on the client. It displays the authoritative topological order, forward pass ($ES, EF$), backward pass ($LS, LF$), total float ($TF$), and free float ($FF$) computed by the backend.
- **Visual Highlighting:** Critical tasks are styled with an illuminated red perimeter border, bold title formatting, and zero float badges.
- **Critical Path Toggle:** Users can toggle "Show Critical Path Only" to dim non-critical tasks and focus attention on the driving schedule sequence.

---

## 6. Drag-and-Drop Rescheduling & Backend Persistence

Users can adjust dates interactively by dragging task bars or adjusting date pickers in the task tree:
- **Endpoint:** `PATCH /api/rd/gantt/tasks/:id/dates`
- **Request Body:**
  ```json
  {
    "startDate": "2026-11-28T00:00:00.000Z",
    "dueDate": "2026-12-05T00:00:00.000Z"
  }
  ```
- **Automated Recalculation:** Upon date modification, the backend immediately executes:
  1. `prisma.task.update`
  2. `rdTaskService.calculateCPM(tenantId, projectId)`
  3. `rdTaskService.scanAndGenerateAlerts(tenantId, projectId)`
- **Immediate Response:** Returns updated task dates alongside newly computed CPM metrics.

---

## 7. Baseline Schedule Overlay & Variance Visualization

When a project baseline snapshot exists (`rd_task_schedule_baselines`):
- A semi-transparent "ghost" bar is rendered underneath the active task bar showing the planned baseline dates.
- If the current task due date slips beyond the baseline due date ($V_{\text{finish}} > 0$), the slippage is visually highlighted in Amber/Red with a `+N days` drift badge.
- Verified in `backend/test_egolytics_master_06.js` (AC-17): A 2-day baseline variance accurately rendered and persisted.
