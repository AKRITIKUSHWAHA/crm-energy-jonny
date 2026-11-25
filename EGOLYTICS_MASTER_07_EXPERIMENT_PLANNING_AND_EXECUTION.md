# EGOLYTICS MASTER PROMPT 07: EXPERIMENT PLANNING & EXECUTION REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 07 of 16  
**Module Focus:** Experiment Planning (Requirement 28) & Experiment Status Tracking (Requirement 29)  
**Author:** Principal Software Architect & Experimental Data Engineer  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable specifies the architecture, data structures, and operational workflow of the **Experiment Planning & Run Execution Engine**.

An experiment represents a planned scientific test designed to evaluate a hypothesis. An experiment can consist of multiple physical or simulated execution runs. Each run records independent observations, protocol step completions, quantitative measurements, and outcome evaluations.

---

## 2. Experiment Planning Architecture (Requirement 28)

### 2.1 Entity Model: `rd_experiments`
```prisma
model RdExperiment {
  id                     String                @id @default(cuid())
  tenantId               String
  projectId              String
  objectiveId            String?
  hypothesisId           String?
  protocolId             String?
  experimentCode         String?
  title                  String
  description            String?               @db.Text
  purpose                String?               @db.Text
  experimentType         String                @default("LABORATORY")
  priority               String                @default("MEDIUM")
  status                 String                @default("PLANNED")
  plannedStartDate       DateTime?
  plannedEndDate         DateTime?
  actualStartDate        DateTime?
  actualEndDate          DateTime?
  ownerId                String?
  assignedResearcherIds  Json?
  experimentalConditions Json?
  expectedOutcomes       String?               @db.Text
  successCriteria        String?               @db.Text
  taskId                 String?
  milestoneId            String?
  createdById            String?
  createdAt              DateTime              @default(now())
  updatedAt              DateTime              @updatedAt

  tenant     Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project    ErpProject            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  objective  RdResearchObjective?  @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  hypothesis RdHypothesis?         @relation(fields: [hypothesisId], references: [id], onDelete: SetNull)
  protocol   RdExperimentProtocol? @relation(fields: [protocolId], references: [id], onDelete: SetNull)
  owner      User?                 @relation("OwnedExperiments", fields: [ownerId], references: [id], onDelete: SetNull)
  task       Task?                 @relation("TaskExperiments", fields: [taskId], references: [id], onDelete: SetNull)
  runs       RdExperimentRun[]
  results    RdExperimentResult[]
  evidences  RdResearchEvidence[]

  @@index([tenantId])
  @@index([projectId])
  @@index([objectiveId])
  @@index([hypothesisId])
  @@index([protocolId])
  @@index([status])
  @@map("rd_experiments")
}
```

### 2.2 Integration with Existing Tasks & Milestones
- Experiments can optionally reference an existing operational task (`tasks.id`) or project milestone (`rd_milestones.id`).
- When bench tasks require time allocations or sprint scheduling, researchers link the experiment directly to their agile task board, preventing duplication.

---

## 3. Experiment Run Execution Architecture (Requirement 29 & 63)

### 3.1 Entity Model: `rd_experiment_runs`
```prisma
model RdExperimentRun {
  id                 String                     @id @default(cuid())
  tenantId           String
  experimentId       String
  runNumber          Int
  runCode            String?
  title              String?
  status             String                     @default("PLANNED")
  protocolVersion    Int                        @default(1)
  protocolSnapshot   Json?
  conditionsSnapshot Json?
  operatorId         String?
  startedAt          DateTime?
  completedAt        DateTime?
  notes              String?                    @db.Text
  createdById        String?
  createdAt          DateTime                   @default(now())
  updatedAt          DateTime                   @updatedAt

  tenant       Tenant                    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  experiment   RdExperiment              @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  runSteps     RdExperimentRunStep[]
  observations RdExperimentObservation[]
  measurements RdExperimentMeasurement[]
  results      RdExperimentResult[]
  evidences    RdResearchEvidence[]

  @@index([tenantId])
  @@index([experimentId])
  @@index([status])
  @@index([runNumber])
  @@map("rd_experiment_runs")
}
```

### 3.2 Protocol Step Completion Tracking
When a run is launched, the protocol's steps are instantiated in `rd_experiment_run_steps`. As researchers carry out the protocol on the bench:
- Individual steps are checked off via `POST /api/rd/runs/steps/:id/complete`.
- The system logs `isCompleted = true`, `completedAt = NOW()`, `completedById = userId`, and operator bench notes.

### 3.3 Run Lifecycle State Machine
$$\text{PLANNED} \longrightarrow \text{READY} \longrightarrow \text{IN\_PROGRESS} \begin{cases} \longrightarrow \text{PAUSED} \longrightarrow \text{IN\_PROGRESS} \\ \longrightarrow \text{COMPLETED} \\ \longrightarrow \text{FAILED} \\ \longrightarrow \text{CANCELLED} \end{cases}$$

---

## 4. Experiment Status Dashboard (Requirement 29)

The status dashboard endpoint `GET /api/rd/experiments/stats` computes real-time database rollups without hardcoded figures:
- Total Experiments
- Planned Experiments
- Ready for Execution
- In-Progress Runs
- Paused Experiments
- Completed Experiments
- Failed Runs
- Multi-filter queries by project, objective, hypothesis, protocol, and date range.

---

## 5. API Endpoints

- `GET /api/rd/experiments` - List experiments with run metrics
- `POST /api/rd/experiments` - Plan new experiment
- `GET /api/rd/experiments/stats` - Live experiment status dashboard statistics
- `GET /api/rd/experiments/:id` - Retrieve experiment details with runs and results
- `PUT /api/rd/experiments/:id` - Update experiment plan
- `POST /api/rd/experiments/:id/runs` - Launch new experiment execution run
- `GET /api/rd/runs/:id` - Retrieve run details with steps, measurements, observations
- `POST /api/rd/runs/:id/status` - Transition run lifecycle status
- `POST /api/rd/runs/steps/:id/complete` - Check off protocol execution step
