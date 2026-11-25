# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 06: PRE-IMPLEMENTATION ARCHITECTURAL ANALYSIS & AUDIT REPORT

**Document ID:** EGOLYTICS-MP06-ANALYSIS-001  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** Gantt, Dynamic Milestones, Project Roadmap & Timeline Engine (`mod-06-scheduling`)  
**Target Delivery Date:** November 2026  
**Status:** Approved for Implementation  
**Classification:** Enterprise Architecture Specification  

---

## 1. EXECUTIVE SUMMARY

This pre-implementation analysis report establishes the technical foundation, database extensions, component specifications, and mathematical integration rules for **Master Prompt 06 of 16: EgoLytics Gantt, Timeline, Dependencies & Critical Path Engine**.

Master Prompt 06 builds upon the operational foundation established in Master Prompt 05:
- **Master Prompt 01:** Foundation, Multi-Tenant Scoping, RBAC Namespaces (`mod-01-foundation`)
- **Master Prompt 02:** R&D Project Portfolio & Intake Governance (`mod-02-portfolio-intake`)
- **Master Prompt 03:** Idea Management & Innovation Scoring Engine (`mod-03-ideation`)
- **Master Prompt 04:** Stage-Gate Governance & Approval Workflow (`mod-04-stagegate`)
- **Master Prompt 05:** Task Lifecycle, Sprint Management, Backlog, Dependencies, CPM & Baselines (`mod-05-tasks`)

Master Prompt 06 focuses strictly on **Visualization, Milestone Planning, Project Roadmaps, and Interactive Scheduling**, delivering:
- **Requirement 9:** Project Roadmaps (High-level chronological roadmap connecting project, tasks, milestones, progress, and critical path)
- **Requirement 10:** Dynamic Milestone Planning (Replacing static hardcoded milestone timelines with a database-backed milestone entity and lifecycle)
- **Requirement 13:** Interactive Gantt Charts (Multi-timescale canvas, drag-and-drop date rescheduling, task duration resizing, SVG dependency connectors, critical path highlighting, milestone diamonds, and baseline overlay)
- **Requirement 14:** Chronological Timeline Views (Project, Task, Milestone, and Critical Path timelines with real-time filtering)

---

## 2. STRICT REUSE OF MASTER PROMPT 05 INFRASTRUCTURE

In adherence to Section 3 of Master Prompt 06, all scheduling calculations, dependency validations, cycle detections, and alert generations implemented in Master Prompt 05 are **reused directly without duplication**:

| Capability / Entity | Originating Model / Service | Reuse Mechanism in Master Prompt 06 |
| :--- | :--- | :--- |
| **Task Entities** | `Task` model in `schema.prisma` (`tasks` table) | Direct reuse. Tasks contain `projectId`, `startDate`, `dueDate`, `estimatedHours`, `progress`, `priority`, `rdStatus`. Additive `milestoneId` foreign key links tasks to milestones. |
| **Task Dependencies** | `RdTaskDependency` (`rd_task_dependencies`) | Reused as the source of truth for Gantt dependency connectors. All 4 types (`FS`, `SS`, `FF`, `SF`) and lag days are displayed and verified. |
| **Cycle Detection** | `rdTaskService.detectsCycle` (Tarjan/DFS) | Reused. Drag-and-drop or date modifications in Gantt strictly validate through existing cycle detection. |
| **CPM Network Engine** | `rdTaskService.calculateCPM` | Reused directly. Generates topological order, Early Start ($ES$), Early Finish ($EF$), Late Start ($LS$), Late Finish ($LF$), Total Float ($TF$), Free Float ($FF$), and zero-float critical path sequences. |
| **Schedule Baselines** | `RdTaskScheduleBaseline` (`rd_task_schedule_baselines`) | Reused directly. Gantt chart renders baseline snapshot bars beneath current task bars to visualize drift. |
| **Schedule Variance** | `rdTaskService.getScheduleVariance` | Reused directly. Computes start variance, finish variance (slippage in days), and ahead/behind classifications. |
| **Schedule Alerts** | `RdScheduleAlert` (`rd_schedule_alerts`) | Reused directly. Gantt and Timeline views integrate alerts (`OVERDUE`, `DUE_SOON`, `DEPENDENCY_BLOCKED`, `CRITICAL_PATH_DELAY`) with deduplication. |

---

## 3. AUDIT OF EXISTING MILESTONE IMPLEMENTATION & GAPS

### 3.1 Audit Findings: `frontend/src/pages/crm/erp/ErpProjectDetail.jsx`
Inspection of `ErpProjectDetail.jsx` (lines 155–176) revealed a completely hardcoded milestone timeline:
```javascript
<Timeline
  items={[
    {
      title: 'Project Kickoff & Requirements',
      description: 'SLA parameters baseline approved by client executive committee.',
      time: 'Milestone 1 - Complete',
      color: 'var(--success)',
    },
    {
      title: 'Infrastructure Deployment',
      description: 'Server hardware delivered, configured, and network nodes installed.',
      time: 'Milestone 2 - Complete',
      color: 'var(--success)',
    },
    {
      title: 'User Acceptance Testing (UAT)',
      description: 'Final staging regression testing and end-user onboarding in progress.',
      time: 'Milestone 3 - In Progress',
      color: 'var(--primary)',
    },
  ]}
/>
```
**Identified Gaps:**
1. No database entity existed for project milestones in Prisma schema or MySQL.
2. The UI was static and identical for every project, failing client Requirement 10.
3. No API existed to create, update, or track milestones.
4. No relationship existed linking operational tasks to milestones.
5. No progress calculation linked milestone deliverables to task completion rates.

---

## 4. DATABASE EXTENSION: `RdMilestone` MODEL

To resolve this architectural gap, Master Prompt 06 introduces an additive model: `RdMilestone` (`rd_milestones`).

### 4.1 Schema Definition
```prisma
/// Dynamic Project Milestone
model RdMilestone {
  id                    String    @id @default(cuid())
  tenantId              String
  projectId             String
  title                 String
  description           String?   @db.Text
  milestoneCode         String?   // e.g. "MS-01", "GATE-01"
  milestoneType         String    @default("DELIVERABLE") // DELIVERABLE, STAGE_GATE, REVIEW, DECISION, RELEASE
  plannedStartDate      DateTime?
  plannedEndDate        DateTime?
  actualStartDate       DateTime?
  actualCompletionDate  DateTime?
  status                String    @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, DELAYED, ON_HOLD, CANCELLED
  progress              Int       @default(0) // 0-100%
  priority              String    @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  ownerId               String?
  sortOrder             Int       @default(0)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  tenant  Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project ErpProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner   User?      @relation("OwnedMilestones", fields: [ownerId], references: [id], onDelete: SetNull)
  tasks   Task[]     @relation("MilestoneTasks")

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([projectId])
  @@map("rd_milestones")
}
```

### 4.2 Task Association
The existing `Task` model is extended with an optional foreign key:
```prisma
model Task {
  ...
  milestoneId String?
  milestone   RdMilestone? @relation("MilestoneTasks", fields: [milestoneId], references: [id], onDelete: SetNull)
  ...
}
```

---

## 5. MILESTONE LIFECYCLE & PROGRESS COMPUTATION

### 5.1 Status State Machine
$$\text{PLANNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{COMPLETED}$$
$$\text{PLANNED / IN\_PROGRESS} \longrightarrow \text{DELAYED} \quad (\text{if } \text{now} > \text{plannedEndDate} \land \text{status} \neq \text{COMPLETED})$$
$$\text{ANY} \longrightarrow \text{ON\_HOLD} \mid \text{CANCELLED}$$

### 5.2 Dynamic Progress Calculation
When a milestone has associated tasks ($N > 0$):
$$\text{Progress}_{\text{calculated}} = \text{round}\left( \frac{\sum_{t \in \text{Tasks}} t.\text{progress}}{N} \right)$$
If all associated tasks have `rdStatus = 'DONE'` (or `progress = 100`), the milestone is eligible for completion validation.

---

## 6. INTERACTIVE GANTT CHART SPECIFICATION

### 6.1 Layout & Canvas Architecture
The Gantt chart consists of a synchronized 2-panel architecture:
1. **Left-Side Task & Milestone Grid (Collapsible/Resizable):**
   - Identifier, Name, Type pill (`TASK`, `SPIKE`, `MILESTONE`), Assignee, Status, Start Date, End Date, Duration (days), Progress bar, and Dependency blocker icon.
2. **Right-Side Timeline Canvas:**
   - Multi-scale header: Day (24-hour tick), Week (7-day block), Month (30-day block).
   - "Today" red vertical indicator line.
   - Task bars with interactive duration width, percentage progress fill, and priority color coding.
   - Milestone diamond markers positioned precisely at planned dates.
   - SVG dependency curve connectors ($A \rightarrow B$) with arrowheads.
   - Baseline shadow bars positioned underneath current task bars to display schedule drift.
   - Critical path highlight (amber/red glowing borders) applied strictly to tasks and connectors with $TF = 0$.

### 6.2 Drag-and-Drop Rescheduling & Resizing
- **Drag Movement:** Updates planned `startDate` and `dueDate` while maintaining duration. Dispatches `PATCH /api/rd/gantt/tasks/:id/dates`.
- **Bar Edge Resizing:** Updates `dueDate` (or `startDate`) adjusting duration.
- **Backend Persistence:** Atomic update triggers CPM recalculation and variance alert re-scan.

---

## 7. PROJECT ROADMAP SPECIFICATION

The project roadmap provides an executive chronological flight path:
- **Project Header:** Name, Project Manager, Client, Target Dates, Overall Progress, Total Tasks, Total Milestones, and CPM Projected Finish.
- **Milestone Checkpoints:** Major milestone delivery dates displayed along a progressive timeline.
- **Work Package Groups:** Grouped tasks showing completed vs. active workstreams.
- **Critical Path Highlight:** Unambiguous indication of whether the project delivery date is driven by the active critical chain.

---

## 8. TIMELINE VIEWS SPECIFICATION

Four dedicated chronological timeline perspectives:
1. **Project Timeline:** Comprehensive chronological stream of project kickoff, milestone deadlines, stage-gate reviews, and projected finish.
2. **Task Timeline:** Detailed chronological breakdown of task start dates, due dates, and completion status.
3. **Milestone Timeline:** Chronological progression of milestone checkpoints with phase indicators.
4. **Critical Path Timeline:** Filtered stream displaying only zero-float critical tasks driving project completion.

---

## 9. RBAC & MULTI-TENANT ISOLATION

- **Multi-Tenancy:** Every milestone, task, baseline, and roadmap query enforces `tenantId` scoping.
- **12-Persona RBAC:**
  - `SUPER_ADMIN`, `BUSINESS_OWNER`, `OPERATIONS_SALES_ADMIN`, `CRM_PRO`: Full CRUD on milestones, roadmaps, and Gantt date updates.
  - `AI_MARKETING_PRO`, `CONTENT_BUILDER`, `CONTENT_CREATOR`, `INFLUENCER`: Read access to schedules; edit access restricted to assigned tasks.
  - `FINANCE_COMPLIANCE_ADMIN`, `HR`: Read-only access to Gantt and Roadmap views.
  - `CUSTOMER`: No internal R&D scheduling access.

---

## 10. TEST PLAN & MATHEMATICAL VALIDATION

1. **Milestone CRUD & Lifecycle:** Create, update, list, complete, delete, and progress calculation.
2. **Task-Milestone Association:** Link tasks to milestone and verify progress rollup.
3. **ErpProjectDetail Integration:** Verify hardcoded timeline in `ErpProjectDetail.jsx` is replaced with live milestone API data.
4. **Gantt Rescheduling API:** Drag date modification persisted and validated.
5. **Deterministic CPM Benchmark:** Execute 6-task benchmark ($T = 14$ days, $A \rightarrow B \rightarrow D \rightarrow F$) verifying Gantt critical path highlight matches calculation.
6. **Regression Verification:** Zero regression across Master Prompts 02, 03, 04, and 05.

---
*Report certified by Principal Enterprise Software Architect & Senior QA Lead.*
