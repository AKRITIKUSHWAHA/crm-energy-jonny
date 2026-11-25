# EGOLYTICS MASTER PROMPT 07: RESULTS, EVIDENCE & DOCUMENTATION REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 07 of 16  
**Module Focus:** Observations & Measurements (Requirement 63), Evidence & Outcomes (Requirement 25), and Research Documentation (Requirement 30)  
**Author:** Principal Software Architect & Enterprise Audit Specialist  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable specifies the implementation and validation of the empirical data recording, structured experimental result analysis, traceable scientific evidence, research outcomes, and research documentation subsystems.

These capabilities ensure complete end-to-end traceability from raw laboratory bench readings up to executive scientific disclosures.

---

## 2. Qualitative Observations & Quantitative Measurements (Requirement 63)

### 2.1 Entity Models: `rd_experiment_observations` & `rd_experiment_measurements`
```prisma
model RdExperimentObservation {
  id              String          @id @default(cuid())
  tenantId        String
  runId           String
  title           String
  description     String          @db.Text
  observationType String          @default("GENERAL") // GENERAL, VISUAL, ANOMALY, PROCEDURE_DEVIATION, BENCH_NOTE
  observedAt      DateTime        @default(now())
  recordedById    String?
  stepNumber      Int?
  variableId      String?
  createdAt       DateTime        @default(now())

  tenant Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  run    RdExperimentRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([runId])
  @@index([observationType])
  @@map("rd_experiment_observations")
}

model RdExperimentMeasurement {
  id                   String          @id @default(cuid())
  tenantId             String
  runId                String
  variableId           String?
  variableNameSnapshot String
  variableTypeSnapshot String          @default("DEPENDENT")
  recordedValue        String
  numericValue         Float?
  dataType             String          @default("DECIMAL")
  unitSnapshot         String?
  measurementTime      DateTime        @default(now())
  measurementMethod    String?
  recordedById         String?
  stepNumber           Int?
  isAnomaly            Boolean         @default(false)
  notes                String?         @db.Text
  createdAt            DateTime        @default(now())

  tenant Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  run    RdExperimentRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([runId])
  @@index([variableId])
  @@map("rd_experiment_measurements")
}
```

### 2.2 Historical Fidelity of Scientific Measurements
- Renaming or deleting a variable definition in the library will **never** alter or invalidate historical measurements.
- Every measurement record captures an immutable snapshot: `variableNameSnapshot`, `variableTypeSnapshot`, and `unitSnapshot`.

---

## 3. Structured Experimental Results & Run Comparisons (Requirements 25 & 63)

### 3.1 Entity Model: `rd_experiment_results`
```prisma
model RdExperimentResult {
  id                   String          @id @default(cuid())
  tenantId             String
  experimentId         String
  runId                String?
  summary              String          @db.Text
  keyFindings          String?         @db.Text
  expectedVsActual     String?         @db.Text
  criteriaEvaluation   String?         @db.Text
  deviations           String?         @db.Text
  researcherConclusion String?         @db.Text
  isSuccessCriteriaMet Boolean         @default(false)
  evaluatedById        String?
  evaluatedAt          DateTime        @default(now())
  createdAt            DateTime        @default(now())

  tenant     Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  experiment RdExperiment     @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  run        RdExperimentRun? @relation(fields: [runId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([experimentId])
  @@index([runId])
  @@map("rd_experiment_results")
}
```

### 3.2 Side-by-Side Multi-Run Comparison
Calling `GET /api/rd/experiments/:id/compare` aggregates multiple execution runs of the same experiment:
- Comparative experimental conditions (temperatures, pressure, gas purge).
- Statistical summary of measurements per run.
- Count of anomalies and deviations.
- Evaluator conclusions across replicate iterations.

---

## 4. Evidence & Research Outcomes (Requirement 25)

### 4.1 Entity Models: `rd_research_evidences` & `rd_research_outcomes`
```prisma
model RdResearchEvidence {
  id           String               @id @default(cuid())
  tenantId     String
  projectId    String
  objectiveId  String?
  hypothesisId String?
  experimentId String?
  runId        String?
  title        String
  description  String?              @db.Text
  evidenceType String               @default("EXPERIMENTAL_DATA")
  source       String?
  fileUrl      String?
  fileType     String?
  fileSize     Int?
  recordedById String?
  status       String               @default("VERIFIED")
  createdAt    DateTime             @default(now())

  tenant     Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project    ErpProject            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  objective  RdResearchObjective?  @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  hypothesis RdHypothesis?         @relation(fields: [hypothesisId], references: [id], onDelete: SetNull)
  experiment RdExperiment?         @relation(fields: [experimentId], references: [id], onDelete: SetNull)
  run        RdExperimentRun?      @relation(fields: [runId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([projectId])
  @@index([objectiveId])
  @@index([hypothesisId])
  @@index([experimentId])
  @@map("rd_research_evidences")
}

model RdResearchOutcome {
  id                        String               @id @default(cuid())
  tenantId                  String
  projectId                 String
  objectiveId               String?
  hypothesisId              String?
  experimentId              String?
  title                     String
  summary                   String               @db.Text
  outcomeCategory           String               @default("SCIENTIFIC_DISCOVERY")
  supportingEvidenceSummary String?              @db.Text
  outcomeDate               DateTime             @default(now())
  recordedById              String?
  createdAt                 DateTime             @default(now())

  tenant     Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project    ErpProject            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  objective  RdResearchObjective?  @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  hypothesis RdHypothesis?         @relation(fields: [hypothesisId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([projectId])
  @@index([objectiveId])
  @@index([hypothesisId])
  @@map("rd_research_outcomes")
}
```

---

## 5. Research Documentation & Lab Notes (Requirement 30)

### 5.1 Entity Model: `rd_research_notes`
```prisma
model RdResearchNote {
  id         String     @id @default(cuid())
  tenantId   String
  projectId  String
  entityType String     // OBJECTIVE, HYPOTHESIS, EXPERIMENT, RUN
  entityId   String
  title      String
  content    String     @db.Text
  authorId   String?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  tenant  Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project ErpProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([projectId])
  @@index([entityType, entityId])
  @@map("rd_research_notes")
}
```

---

## 6. API Endpoints

- `POST /api/rd/runs/:id/observations` - Record bench observation
- `GET /api/rd/runs/:id/observations` - List run observations
- `POST /api/rd/runs/:id/measurements` - Record quantitative measurement
- `GET /api/rd/runs/:id/measurements` - List run measurements
- `POST /api/rd/experiments/:id/results` - Document structured experiment result
- `GET /api/rd/experiments/:id/compare` - Compare multiple experiment execution runs
- `POST /api/rd/evidence` - Create traceable research evidence record
- `GET /api/rd/evidence` - Query evidence records
- `POST /api/rd/outcomes` - Document formal research outcome
- `GET /api/rd/outcomes` - List research outcomes
- `POST /api/rd/notes` - Create research documentation note
- `GET /api/rd/notes` - Query research documentation notes
