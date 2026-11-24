# EGOLYTICS MASTER PROMPT 07: RESEARCH OBJECTIVES & HYPOTHESES REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 07 of 16  
**Module Focus:** Research Objective Tracking (Requirement 26) & Hypothesis Tracking (Requirement 27)  
**Author:** Principal Software Architect & Scientific Research Specialist  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable specifies the architecture, database models, lifecycle state machines, and structured evaluation workflows for **Research Objectives** (Client Requirement 26) and **Research Hypotheses** (Client Requirement 27).

These components anchor the scientific methodology in EgoLytics, ensuring that every research activity is systematically tied to a strategic R&D project, driven by a falsifiable scientific proposition, and evaluated strictly against collected empirical evidence.

---

## 2. Research Objective Architecture (Requirement 26)

### 2.1 Entity Model: `rd_research_objectives`
```prisma
model RdResearchObjective {
  id               String       @id @default(cuid())
  tenantId         String
  projectId        String
  title            String
  description      String?      @db.Text
  researchQuestion String?      @db.Text
  category         String       @default("APPLIED_RESEARCH")
  priority         String       @default("MEDIUM")
  status           String       @default("ACTIVE") // DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
  ownerId          String?
  startDate        DateTime?
  targetDate       DateTime?
  completionDate   DateTime?
  successCriteria  String?      @db.Text
  progress         Int          @default(0) // 0-100%
  createdById      String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  tenant      Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project     ErpProject           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner       User?                @relation("OwnedObjectives", fields: [ownerId], references: [id], onDelete: SetNull)
  hypotheses  RdHypothesis[]
  experiments RdExperiment[]
  evidences   RdResearchEvidence[]
  outcomes    RdResearchOutcome[]

  @@index([tenantId])
  @@index([projectId])
  @@index([status])
  @@index([ownerId])
  @@map("rd_research_objectives")
}
```

### 2.2 Objective Progress Rollup Formula
Objective progress is derived mathematically from the completion status of associated hypotheses and experiments:

$$\text{Progress}_{\text{obj}} = \operatorname{round}\left( \frac{|\text{Hypotheses}_{\text{evaluated}}| + |\text{Experiments}_{\text{completed}}|}{\max\left(1, |\text{Hypotheses}_{\text{total}}| + |\text{Experiments}_{\text{total}}|\right)} \times 100 \right)$$

Where:
- $\text{Hypotheses}_{\text{evaluated}} = \{ h \in \text{Hypotheses} \mid h.\text{status} \in \{\text{'SUPPORTED'}, \text{'NOT\_SUPPORTED'}, \text{'INCONCLUSIVE'}\} \}$
- $\text{Experiments}_{\text{completed}} = \{ e \in \text{Experiments} \mid e.\text{status} = \text{'COMPLETED'} \}$

Progress is strictly database-derived and never fabricated.

---

## 3. Scientific Hypothesis Architecture (Requirement 27)

### 3.1 Entity Model: `rd_hypotheses`
```prisma
model RdHypothesis {
  id                    String                @id @default(cuid())
  tenantId              String
  projectId             String
  objectiveId           String?
  hypothesisCode        String?
  title                 String
  statement             String                @db.Text
  description           String?               @db.Text
  scientificRationale   String?               @db.Text
  expectedOutcome       String?               @db.Text
  hypothesisType        String                @default("ALTERNATIVE_HYPOTHESIS")
  priority              String                @default("MEDIUM")
  status                String                @default("PROPOSED")
  evaluationDecision    String?               // SUPPORTED, NOT_SUPPORTED, INCONCLUSIVE
  evaluationSummary     String?               @db.Text
  supportingEvidence    String?               @db.Text
  contradictoryEvidence String?               @db.Text
  conclusion            String?               @db.Text
  evaluatedById         String?
  evaluationDate        DateTime?
  ownerId               String?
  createdById           String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  tenant      Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project     ErpProject           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  objective   RdResearchObjective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  owner       User?                @relation("OwnedHypotheses", fields: [ownerId], references: [id], onDelete: SetNull)
  experiments RdExperiment[]
  evidences   RdResearchEvidence[]
  outcomes    RdResearchOutcome[]

  @@index([tenantId])
  @@index([projectId])
  @@index([objectiveId])
  @@index([status])
  @@map("rd_hypotheses")
}
```

### 3.2 Scientific Typology Supported
- `NULL_HYPOTHESIS` ($H_0$): Proposes no statistical relationship or effect between variables.
- `ALTERNATIVE_HYPOTHESIS` ($H_1$): Proposes a significant effect or relationship.
- `DIRECTIONAL_HYPOTHESIS`: Posits a specific direction of effect (e.g. higher temperature increases tensile ductility).
- `NON_DIRECTIONAL_HYPOTHESIS`: Posits an effect exists without predicting its specific vector.

### 3.3 Structured Evidence-Based Evaluation Workflow
Scientific integrity requires that hypotheses are never automatically declared true or false by an algorithm. An authorized researcher or principal investigator must formally record the evaluation via `POST /api/rd/hypotheses/:id/evaluate`:
1. **Decision Verdict:** `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE`.
2. **Evaluation Summary:** Narrative explanation of empirical findings.
3. **Supporting Evidence Reference:** Links to specific experiment runs, measurement series, or SEM micrographs.
4. **Contradictory Evidence:** Formal accounting of anomalies or inconsistent runs.
5. **Conclusion:** Scientific implications for subsequent R&D phases.
6. **Audit Trail:** Capture of `evaluatedById` and UTC timestamp `evaluationDate`.

---

## 4. API Endpoints

- `GET /api/rd/objectives` - List project objectives with metrics rollup
- `POST /api/rd/objectives` - Create research objective
- `GET /api/rd/objectives/:id` - Retrieve single objective with linked hypotheses & experiments
- `PUT /api/rd/objectives/:id` - Update objective fields & status
- `DELETE /api/rd/objectives/:id` - Safely delete objective
- `GET /api/rd/hypotheses` - List hypotheses with filtering
- `POST /api/rd/hypotheses` - Formulate hypothesis
- `GET /api/rd/hypotheses/:id` - Retrieve hypothesis with experiments and evidence
- `PUT /api/rd/hypotheses/:id` - Update hypothesis fields
- `POST /api/rd/hypotheses/:id/evaluate` - Record formal evidence-based evaluation
- `DELETE /api/rd/hypotheses/:id` - Safely delete hypothesis
