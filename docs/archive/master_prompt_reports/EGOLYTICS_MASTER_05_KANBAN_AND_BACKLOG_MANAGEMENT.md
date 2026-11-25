# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: KANBAN BOARDS & BACKLOG MANAGEMENT REPORT

**Document ID:** EGOLYTICS-MP05-KANBAN-BACKLOG-003  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** R&D Kanban Boards & Backlog Subsystem (`mod-05-tasks`)  
**Implementation Date:** November 2026  
**Status:** Production Verified  
**Classification:** Enterprise Engineering Report  

---

## 1. EXECUTIVE SUMMARY

This report documents the architectural design, implementation, and verification of:
- **Requirement 12: R&D Kanban Boards**
- **Requirement 16: Backlog Management & Prioritization**

The Kanban and Backlog systems provide interactive, reactive interfaces for orchestrating research and engineering workflows, managing uncommitted work pools, ranking items, and seamlessly transitioning tasks into active sprint iterations.

---

## 2. KANBAN BOARD ARCHITECTURE (REQUIREMENT 12)

### 2.1 Visual Workflow Pipeline
The Kanban board organizes work across 5 operational columns:

```
+-----------------------------------------------------------------------------------------+
|                                    R&D KANBAN BOARD                                     |
+-------------------+-------------------+-------------------+-------------------+---------+
|     TO DO         |    IN PROGRESS    |  IN REVIEW / QA   | BLOCKED / RISK    |  DONE   |
|  (Est: #64748b)   |  (Act: #0284c7)   |  (Rev: #8b5cf6)   |  (Blk: #ef4444)   | (#10b981|
+-------------------+-------------------+-------------------+-------------------+---------+
| [SPIKE] Batch 01  | [TASK] Raman Spec | [STORY] UI Widget | [TASK] Sintering  | [TASK]  |
| 16h • Due 11-28   | 8h  • Due 11-30   | 12h • Due 12-01   | ! Blocked by Mix  | 20h est |
|                   |                   |                   | 24h • Due 12-05   | 100%    |
+-------------------+-------------------+-------------------+-------------------+---------+
```

### 2.2 Drag-and-Drop Implementation Mechanics
The drag-and-drop mechanism uses native HTML5 drag-and-drop APIs:
1. `draggable={true}` on each task card captures `task.id` via `event.dataTransfer.setData('text/plain', taskId)`.
2. Column container handles `onDragOver` with `e.preventDefault()`.
3. Column container handles `onDrop` event:
   - Extracts `taskId` from data transfer.
   - Executes optimistic React state update (`setTasks(prev => prev.map(...))`).
   - Dispatches background asynchronous HTTP request:
     `PATCH /api/rd/tasks/:id/status` with payload `{ rdStatus: targetStatus }`.
   - On network error, rolls back local state and presents a toast notification.

### 2.3 Blocker Indicator Badge
When a task has one or more incomplete predecessor dependencies, the card renders a prominent red alert banner:
$$\text{isBlocked} = \exists \, d \in \text{Predecessors}(i) \text{ such that } d.\text{status} \neq \text{'DONE'}$$
This immediately alerts engineers that attempting to execute this task will encounter an upstream blocker.

---

## 3. BACKLOG MANAGEMENT & REORDERING (REQUIREMENT 16)

### 3.1 Backlog Storage Mechanics
Work items are classified as backlog items when:
$$\text{isBacklog} = \text{true} \quad \lor \quad \text{sprintId} \text{ IS NULL}$$
Backlog items represent uncommitted, prioritized research requirements, future enhancements, or deferred spikes.

### 3.2 Backlog Retrieval & Ordering API
- **Endpoint:** `GET /api/rd/backlog?projectId=:id`
- **Ordering:** Sorted ascending by `sortOrder` ($10, 20, 30, \dots$) then descending by `createdAt`.

### 3.3 Atomic Drag Reordering API
- **Endpoint:** `POST /api/rd/backlog/reorder`
- **Payload:** `{ orderedTaskIds: ["id_1", "id_2", "id_3"] }`
- **Execution:** Wrapped in a Prisma database transaction updating `sortOrder = (index + 1) * 10`:

```javascript
await prisma.$transaction(
  orderedTaskIds.map((taskId, index) =>
    prisma.task.updateMany({
      where: { id: taskId, tenantId },
      data: { sortOrder: (index + 1) * 10 },
    })
  )
);
```

### 3.4 Backlog-to-Sprint Commitment Workflow
- **Endpoint:** `POST /api/rd/backlog/commit`
- **Payload:** `{ sprintId: "sprint_cuid", taskIds: ["task_1", "task_2"] }`
- **Execution:** Atomically assigns tasks to the target sprint, resets `isBacklog = false`, and transitions `rdStatus = 'TODO'`.

---

## 4. MULTI-DIMENSIONAL FILTERING ENGINE

The Kanban and Backlog views support simultaneous multi-dimensional filtering:
- **Project Filter:** Restricts view to tasks belonging to a selected R&D initiative.
- **Sprint Filter:** Restricts view to the active sprint or specific planned sprints.
- **Priority Filter:** `ALL`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **Task Type Filter:** `ALL`, `TASK`, `USER_STORY`, `RESEARCH_SPIKE`, `BUG`, `TECHNICAL_DEBT`, `SUBTASK`.
- **Search Query:** Real-time client-side substring matching on title and description.

---

## 5. VERIFICATION EVIDENCE

Automated tests in `backend/test_egolytics_master_05.js` verified:
- **AC-06:** Dragging card to `IN_PROGRESS` column updates database $\rightarrow$ **PASS**
- **AC-07:** Dragging card to `DONE` column sets `progress = 100` and `status = 'COMPLETED'` $\rightarrow$ **PASS**
- **AC-10:** Committing backlog work items to sprint updates sprint association and status $\rightarrow$ **PASS**
- **AC-15:** Dependent task with incomplete predecessor correctly displays blocker flag $\rightarrow$ **PASS**

---
*Certified by Principal Enterprise Software Architect & UI/UX Specialist.*
