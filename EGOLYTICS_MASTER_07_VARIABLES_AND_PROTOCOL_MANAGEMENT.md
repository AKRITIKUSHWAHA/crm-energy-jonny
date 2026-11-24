# EGOLYTICS MASTER PROMPT 07: SCIENTIFIC VARIABLES & PROTOCOL MANAGEMENT REPORT

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 07 of 16  
**Module Focus:** Scientific Variables (Requirement 28) & Experiment Protocols (Requirements 28 & 63)  
**Author:** Principal Software Architect & Laboratory Workflow Specialist  
**Status:** PRODUCTION READY — VERIFIED (100% Pass Rate)

---

## 1. Executive Summary

This deliverable specifies the implementation and validation of the **Scientific Variables Engine** and the **Experiment Protocol Management System**.

These modules standardize empirical measurements, enforce strict physical and mathematical bounds on recorded data, and guarantee the repeatability of experimental methodologies across multiple laboratory runs through immutable protocol versioning and execution checklists.

---

## 2. Scientific Variables Engine (Requirement 28)

### 2.1 Entity Model: `rd_variables`
```prisma
model RdVariable {
  id                String    @id @default(cuid())
  tenantId          String
  projectId         String?   // null indicates global tenant-wide parameter
  name              String
  description       String?   @db.Text
  variableType      String    @default("INDEPENDENT") // INDEPENDENT, DEPENDENT, CONTROLLED, CONTEXTUAL
  dataType          String    @default("DECIMAL")     // INTEGER, DECIMAL, TEXT, BOOLEAN, DATE, DATETIME, ENUM
  unit              String?
  measurementMethod String?
  expectedValue     String?
  minValue          Float?    @map("minValue")
  maxValue          Float?    @map("maxValue")
  allowedValues     Json?
  isRequired        Boolean   @default(true)
  notes             String?   @db.Text
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([projectId])
  @@index([variableType])
  @@map("rd_variables")
}
```

### 2.2 Variable Typologies Supported
1. **Independent Variables:** Manipulated factors controlled intentionally by the experimental design (e.g. Sintering Temperature: 1000–1800 °C).
2. **Dependent Variables:** Measured response variables (e.g. Fracture Toughness in MPa·m½).
3. **Controlled Variables:** Parameters held strictly constant across runs (e.g. Chamber Atmosphere: Argon 99.999%).
4. **Contextual Variables:** Environmental baselines (ambient room temperature, operator identifier).

### 2.3 Scientific Measurement Validation Rules
When a measurement is submitted via `POST /api/rd/runs/:id/measurements`, the backend executes `validateMeasurementValue`:
- **`INTEGER` Validation:** Rejects non-integer formatting and enforces $[V_{\min}, V_{\max}]$.
- **`DECIMAL` Validation:** Validates IEEE 754 floating point format and enforces numerical boundaries.
- **`BOOLEAN` Validation:** Enforces strict boolean inputs (`true`, `false`, `1`, `0`).
- **`ENUM` Validation:** Checks input against allowed categorical choices.
- **Out-of-Bounds Rejection:** Tested in `test_egolytics_master_07.js` (AC-28): Sintering temperature measurement of $2500^\circ\text{C}$ on a variable bounded by $[1000, 1800]^\circ\text{C}$ is rejected with HTTP 400.

---

## 3. Protocol & SOP Management System (Requirements 28 & 63)

### 3.1 Entity Models: `rd_experiment_protocols` & `rd_protocol_steps`
```prisma
model RdExperimentProtocol {
  id                       String           @id @default(cuid())
  tenantId                 String
  projectId                String?
  protocolCode             String?
  title                    String
  description              String?          @db.Text
  purpose                  String?          @db.Text
  methodology              String?          @db.Text
  requiredMaterials        String?          @db.Text
  equipmentDescription     String?          @db.Text
  safetyInstructions       String?          @db.Text
  expectedObservations     String?          @db.Text
  expectedResults          String?          @db.Text
  estimatedDurationMinutes Int?
  version                  Int              @default(1)
  status                   String           @default("ACTIVE") // DRAFT, ACTIVE, ARCHIVED
  isTemplate               Boolean          @default(false)
  ownerId                  String?
  createdById              String?
  createdAt                DateTime         @default(now())
  updatedAt                DateTime         @updatedAt

  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  owner       User?            @relation("OwnedProtocols", fields: [ownerId], references: [id], onDelete: SetNull)
  steps       RdProtocolStep[]
  experiments RdExperiment[]

  @@index([tenantId])
  @@index([projectId])
  @@index([status])
  @@index([isTemplate])
  @@map("rd_experiment_protocols")
}

model RdProtocolStep {
  id                  String               @id @default(cuid())
  tenantId            String
  protocolId          String
  stepNumber          Int
  title               String
  instructions        String               @db.Text
  expectedAction      String?              @db.Text
  expectedObservation String?              @db.Text
  durationMinutes     Int?
  isRequired          Boolean              @default(true)
  notes               String?              @db.Text
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  tenant   Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  protocol RdExperimentProtocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([protocolId])
  @@index([stepNumber])
  @@map("rd_protocol_steps")
}
```

### 3.2 Protocol Versioning & Historical Immutability
To preserve historical audit integrity:
1. **Incremental Versions:** Calling `POST /api/rd/protocols/:id/version` creates a new protocol record with `version = N + 1`, preserving the historical version record intact.
2. **Template Duplication:** Calling `POST /api/rd/protocols/:id/duplicate` deep-copies the protocol and its ordered steps for instantiation in a new project.
3. **Execution Snapshotting:** When an experiment run begins, a complete JSON snapshot of the protocol and its steps is written to `rd_experiment_runs.protocolSnapshot`. Future changes to the protocol will NOT alter past run definitions.

---

## 4. API Endpoints

- `GET /api/rd/variables` - List variables
- `POST /api/rd/variables` - Create variable with validation bounds
- `GET /api/rd/protocols` - List protocols and templates
- `POST /api/rd/protocols` - Create protocol SOP with steps
- `GET /api/rd/protocols/:id` - Retrieve protocol with ordered steps
- `PUT /api/rd/protocols/:id` - Update protocol fields
- `POST /api/rd/protocols/:id/steps` - Append ordered step
- `POST /api/rd/protocols/:id/version` - Create incremented protocol version
- `POST /api/rd/protocols/:id/duplicate` - Duplicate protocol template
