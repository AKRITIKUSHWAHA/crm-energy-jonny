# EGOLYTICS MASTER PROMPT 07: PRE-IMPLEMENTATION ARCHITECTURE & GAP ANALYSIS
## Research Hypothesis & Experiment Management Engine

**Project:** EgoLytics – R&D Management Tool  
**Division:** Research & Development Division of CRM nErgy AI  
**Roadmap Phase:** Master Prompt 07 of 16  
**Auditor:** Principal Software Architect, Laboratory Workflow Architect & Enterprise Database Specialist  
**Execution Timestamp:** 2026-11-24  
**Status:** COMPLETE & APPROVED FOR IMPLEMENTATION

---

## 1. Executive Summary

Master Prompt 07 establishes the scientific research and experimental execution core of the EgoLytics platform. While Master Prompts 01 through 06 delivered foundational multi-tenant isolation, project portfolio intake, idea management and scoring, Stage-Gate governance, agile sprint scheduling, and CPM Gantt timelines, the platform currently lacks dedicated entities to support empirical scientific workflows.

This pre-implementation analysis audits the existing codebase, verifies database schemas and integration points, maps client requirements, formulates exact architectural boundaries, and specifies the additive database migration and service architecture for Master Prompt 07.

---

## 2. Authoritative Client Requirements Mapping

The client requirement document (`EgoLytics - R_D Management Tool.docx`) and gap analysis designate the following core requirements to Master Prompt 07:

| Requirement ID | Requirement Name | Description & Functional Scope | Implementation Approach |
|:---|:---|:---|:---|
| **Req 25** | **Evidence and Outcomes Tracking** | Traceable evidence records and formal documented research outcomes linked to objectives, hypotheses, and runs. | Dedicated `rd_research_evidences` and `rd_research_outcomes` entities. |
| **Req 26** | **Research Objective Tracking** | Definition, owner assignment, target dates, lifecycle, and progress tracking for scientific research objectives. | Dedicated `rd_research_objectives` linked to `erp_projects`. |
| **Req 27** | **Hypothesis Tracking** | Scientific hypothesis definition, typologies, rationale, expected outcomes, lifecycle, and evidence-based evaluation. | Dedicated `rd_hypotheses` with structured evaluation workflow. |
| **Req 28** | **Experiment Planning** | Experiment designs, variable configuration (independent, dependent, controlled), protocols, conditions, and task links. | Dedicated `rd_experiments`, `rd_variables`, and condition snapshots. |
| **Req 29** | **Experiment Status Tracking** | Live status dashboard, execution progress, run counts, result availability, and multi-factor filtering. | Aggregated run metrics and status lifecycle state machines. |
| **Req 30** | **Research Documentation** | Research-specific documentation, findings, notes, and auditable history across objectives and hypotheses. | Dedicated `rd_research_notes` with author and timestamp audit trails. |
| **Req 63** | **Experiment Documentation** | Protocol execution documentation, run observations, qualitative logs, deviations, and conclusions. | Dedicated `rd_experiment_observations` and `rd_experiment_results`. |

---

## 3. Existing Architecture Audit & Reuse Strategy

### 3.1 Infrastructure to Reuse Without Duplication
1. **Multi-Tenant Isolation (`middleware/tenantIsolation.js`):** Every new table MUST contain `tenantId` indexed and foreign-keyed to `tenants(id)`. All database queries MUST be scoped to `req.user.tenantId`.
2. **Authentication & Session (`middleware/auth.js`):** JWT verification extracts `userId`, `tenantId`, `role`, and `email`.
3. **Role-Based Access Control (`utils/rbac.js` & `RolePermission`):** Research permissions (`rd.objectives.*`, `rd.hypotheses.*`, `rd.experiments.*`, `rd.protocols.*`) mapped across the 12 CRM/ERP roles.
4. **R&D Project Portfolio (`erp_projects`):** All research objectives and experiments MUST belong to an existing R&D project (`projectType = 'RD'`). No separate "Lab Project" entity will be created.
5. **Project Tasks (`tasks`):** Operational experiment work items, bench assignments, and milestones integrate directly with existing tasks via `taskId` / `projectId`.
6. **Dynamic Milestones (`rd_milestones`):** Experiments and objectives can be anchored to project milestones established in Master Prompt 06.
7. **Activity Logging (`activities`):** Significant research events (hypothesis evaluated, experiment run completed, result recorded) emit traceable activity logs.

### 3.2 What Is Currently Missing in the Codebase
1. No entities or tables for Research Objectives, Hypotheses, Variables, Protocols, Protocol Steps, Experiments, Runs, Observations, Measurements, Results, Evidence, or Outcomes.
2. In `backend/src/controllers/rdController.js`, `mod-07-experiments` is currently flagged as `status: 'PLANNED'`.
3. No UI tabs or workspace in `EgolyticsHub.jsx` for Research Objectives, Hypotheses, or Experiment Execution.
4. No scientific measurement validation routines (numeric bounds, units of measure, categorical allowed values).

---

## 4. Scientific Workflow & Entity Relationship Design

The scientific research flow represents a deterministic, auditable chain:

$$\begin{aligned}
\text{ErpProject} &\longrightarrow \text{RdResearchObjective} \longrightarrow \text{RdHypothesis} \\
&\longrightarrow \text{RdExperiment} \begin{cases} \text{RdVariable (Independent, Dependent, Controlled)} \\ \text{RdExperimentProtocol (Steps \& Versioning)} \end{cases} \\
&\longrightarrow \text{RdExperimentRun} \begin{cases} \text{RdExperimentRunStep (Execution checklist)} \\ \text{RdExperimentObservation (Qualitative notes)} \\ \text{RdExperimentMeasurement (Quantitative data points)} \end{cases} \\
&\longrightarrow \text{RdExperimentResult} \longrightarrow \text{RdResearchEvidence} \\
&\longrightarrow \text{Hypothesis Evaluation} \longrightarrow \text{RdResearchOutcome}
\end{aligned}$$

### 4.1 Proposed Database Tables (Additive Non-Destructive Migration)
1. **`rd_research_objectives`**: Project-linked scientific objectives with title, description, research question, target dates, lifecycle, progress rollup.
2. **`rd_hypotheses`**: Formal scientific hypotheses with statement, scientific rationale, expected outcome, hypothesis type (`NULL_HYPOTHESIS`, `ALTERNATIVE_HYPOTHESIS`, `DIRECTIONAL_HYPOTHESIS`, `NON_DIRECTIONAL_HYPOTHESIS`), lifecycle status, and evaluation verdict (`SUPPORTED`, `NOT_SUPPORTED`, `INCONCLUSIVE`).
3. **`rd_variables`**: Scientific variable library (`INDEPENDENT`, `DEPENDENT`, `CONTROLLED`) with data types (`INTEGER`, `DECIMAL`, `TEXT`, `BOOLEAN`, `ENUM`), measurement units, minimum/maximum bounds, and allowed values.
4. **`rd_experiment_protocols`**: Standard operating procedures and methodologies with code, methodology description, materials, safety instructions, version number, and template flag.
5. **`rd_protocol_steps`**: Ordered protocol instructions with step number, title, instructions, expected action, expected observation, duration minutes, and required flag.
6. **`rd_experiments`**: Experiment plans linking Project, Objective, Hypothesis, and Protocol with experimental conditions, assigned researchers, schedule, and status.
7. **`rd_experiment_runs`**: Discrete experimental execution instances capturing protocol version snapshot, condition parameters, execution timestamps, and run status.
8. **`rd_experiment_run_steps`**: Protocol step completion tracking per run with completion timestamp and operator ID.
9. **`rd_experiment_observations`**: Qualitative bench notes, visual findings, anomalies, and logs recorded during run execution.
10. **`rd_experiment_measurements`**: Structured quantitative data points with variable snapshot, recorded value, numeric value, unit snapshot, and timestamp.
11. **`rd_experiment_results`**: Structured synthesis of run outcomes, key findings, criteria evaluations, deviations, and researcher conclusions.
12. **`rd_research_evidences`**: Traceable research evidence items (data tables, images, reports, raw files) linked to objectives, hypotheses, or runs.
13. **`rd_research_outcomes`**: Documented R&D deliverables, scientific breakthroughs, or validated findings.
14. **`rd_research_notes`**: Contextual research documentation and lab notebook annotations.

---

## 5. Architectural Safeguards & Historical Data Integrity

1. **Protocol Snapshotting:** When an experiment run begins, it snapshots the protocol version and steps used. Subsequent edits to the protocol template will NOT modify past run definitions.
2. **Measurement Snapshotting:** Every measurement record preserves the variable name, unit, and validation bounds at the moment of recording. Renaming or editing a variable definition cannot corrupt historical laboratory data.
3. **No Automatic Truth Generation:** Scientific conclusions are never fabricated. A hypothesis is only marked `SUPPORTED` or `NOT_SUPPORTED` when a qualified researcher explicitly records an evidence-backed evaluation.
4. **Multi-Tenant Boundary:** Strict database foreign keys and query filters ensure no cross-tenant leakage between `TENANT-08492` and foreign tenants.

---

## 6. Implementation Roadmap for Master Prompt 07

1. **Phase 2 & 12:** Database migration script `migrate_master_07.js`, Prisma schema update, and Prisma Client generation.
2. **Phase 3 – 11 & 13:** Backend service `rdResearchService.js`, controller `rdResearchController.js`, and route mounting in `rdRoutes.js`.
3. **Phase 14:** Frontend scientific workspace `RdExperimentStudio.jsx` integrated into `EgolyticsHub.jsx`, `mockData.js`, and `rbac.js`.
4. **Phase 15 – 17:** Automated verification test suite `test_egolytics_master_07.js` (testing AC-01 through AC-41) and regression verification.
5. **Phase 18 – 22:** Authoring all mandatory documentation deliverables.
