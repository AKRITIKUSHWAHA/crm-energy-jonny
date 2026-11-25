# EGOLYTICS MASTER PROMPT 08 — DATASET REGISTRY & KNOWLEDGE REPOSITORY REPORT

**Project:** EgoLytics – R&D Management Tool  
**Platform:** CRM nErgy AI  
**Roadmap Stage:** Master Prompt 08 of 16  
**Document Code:** MP08-DATASET-KB  
**Client Requirements Covered:** Requirement 30 (Research Documentation), Requirement 42 (Document Management)

---

## 1. SCIENTIFIC DATASET REGISTRY (REQUIREMENT 42)

The Research Dataset Registry is distinct from the experimental measurement records implemented in Master Prompt 07. While Master Prompt 07 captures discrete bench data points (e.g. single temperature readings or tensile values), the Dataset Registry organizes structured multi-row tabular files, instrument telemetry streams, and bulk simulation datasets.

### 1.1 Dataset Metadata Specification (`rd_datasets`)
- `id`: CUID primary identifier
- `tenantId`: Organization tenant context
- `projectId`: Associated R&D project
- `notebookId`: Optional bound research notebook
- `noteId`: Optional bound notebook entry
- `experimentId`: Optional bound laboratory experiment
- `runId`: Optional bound execution run
- `datasetCode`: Auto-generated unique identifier (e.g. `DS-2026-001`)
- `title`: Dataset title (e.g. "Thermal Sensor Millisecond Telemetry Dataset")
- `description`: Dataset description, sampling rate, and calibration parameters
- `category`: Classification category
  - `EXPERIMENTAL_DATASET`: Data generated from physical laboratory runs
  - `INSTRUMENT_DATA`: Raw telemetry directly exported from lab instruments
  - `OBSERVATION_DATASET`: Structured behavioral or qualitative survey tables
  - `SIMULATION_DATASET`: Finite element analysis (FEA) or computational fluid dynamics (CFD) outputs
  - `RESEARCH_REFERENCE_DATA`: External benchmark or baseline comparative data
  - `EXTERNAL_DATASET`: Third-party imported datasets
  - `PROCESSED_DATASET`: Cleaned, normalized, or aggregated tables
- `dataFormat`: File structure (`CSV`, `JSON`, `XLSX`, `NETCDF`, `PARQUET`, `MIXED`)
- `dataSource`: Equipment or sensor name (e.g. "Yokogawa DL850E ScopeCorder")
- `collectionDate`: Date and time when the data was acquired
- `tags`: Search and discovery tags
- `status`: `ACTIVE` or `ARCHIVED`
- `ownerId`: Responsible researcher

---

## 2. MULTI-FILE DATASET MANAGEMENT (`rd_dataset_files`)

A registered dataset can contain one or more associated data files. This accommodates multi-sensor recordings, multi-channel streams, or chunked telemetry files:

### Fields of `rd_dataset_files`:
- `id`: CUID identifier
- `tenantId`: Scoped organization tenant ID
- `datasetId`: Foreign key to parent `rd_datasets`
- `fileName`: Original file name (e.g. `sensor_telemetry_run1.csv`)
- `fileExtension`: Extension (`.csv`, `.json`, etc.)
- `mimeType`: MIME type (`text/csv`, `application/json`, etc.)
- `fileSize`: File size in bytes
- `storagePath`: Physical file location in secure storage
- `fileChecksum`: SHA-256 cryptographic integrity hash
- `rowCount`: Number of rows / records in the dataset file
- `columnCount`: Number of features / attributes in the dataset file
- `schemaDescription`: Detailed column dictionary (e.g. "timestamp (s), ch1_temp (C), ch2_temp (C), pressure (bar)")
- `uploadedById`: Uploader user ID
- `createdAt`: Upload timestamp

### File Operations:
- Researchers can attach files via `POST /api/rd/eln/datasets/:id/files` with Base64 payload and schema metadata.
- Files are downloaded via `GET /api/rd/eln/datasets/files/:fileId/download` with strict tenant and permission validation.

---

## 3. RESEARCH KNOWLEDGE REPOSITORY (REQUIREMENT 30)

The Centralized Research Knowledge Repository captures reusable intellectual capital across the organization. It enables discoveries, proven methodologies, and lessons learned from one R&D project to be discovered and leveraged by researchers working on other initiatives.

### 3.1 Knowledge Record Specification (`rd_knowledge_records`)
- `id`: CUID identifier
- `tenantId`: Organization tenant context
- `knowledgeCode`: Auto-generated unique identifier (e.g. `KB-2026-001`)
- `title`: Knowledge article title
- `description`: Executive abstract or summary of the finding
- `content`: Full technical documentation, equations, chemistry guidelines, or SOP markdown
- `category`: Knowledge taxonomy
  - `RESEARCH_FINDING`: Novel discoveries or verified experimental results
  - `TECHNICAL_KNOWLEDGE`: Theoretical derivations, physical constants, or models
  - `SCIENTIFIC_REFERENCE`: Academic citations, benchmarks, and standards
  - `METHODOLOGY`: Proven experimental protocols and laboratory recipes
  - `BEST_PRACTICE`: Operational laboratory guidelines and safety practices
  - `LESSONS_LEARNED`: Analysis of failed experiments or unexpected anomalies
  - `REUSABLE_DOCUMENTATION`: Boilerplate documentation templates
- `tags`: Keywords for search indexing
- `sourceProjectId`: Project where the knowledge originated
- `sourceNotebookId`: Originating notebook
- `sourceExperimentId`: Originating experiment
- `sourceEvidenceId`: Supporting evidence record
- `sourceOutcomeId`: Formal outcome record
- `accessLevel`: Permission scope
  - `TENANT_WIDE`: Accessible to all authorized researchers across all projects
  - `PROJECT_RESTRICTED`: Accessible only to authorized project members
  - `CONFIDENTIAL`: Restricted to directors and assigned reviewers
- `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `authorId`: Author user ID

---

## 4. GLOBAL UNIFIED ELN DISCOVERY SEARCH (AC-20)

EgoLytics provides a centralized discovery endpoint (`GET /api/rd/eln/search?q=<query>`) that searches simultaneously across five distinct scientific asset repositories:

```
                          GLOBAL SEARCH QUERY: "Precipitation"
                                       |
    +-----------------+----------------+----------------+-----------------+
    |                 |                |                |                 |
    v                 v                v                v                 v
Notebooks          Entries         Documents        Datasets          Knowledge
(Title, Code,     (Title, Text,    (Title, Code,    (Title, Code,     (Title, Text,
 Description,      Tags, Ref)       Filename,        Source, Tags)     Tags, Code)
 Tags)                              Tags)
```

### Search Features:
- Case-insensitive substring matching using indexed database queries.
- Aggregated result counts per asset type (`counts: { notebooks, entries, documents, datasets, knowledge, total }`).
- Scoped strictly by `tenantId` to prevent information disclosure.
- Interactive UI search tab displaying categorized match pills and instant preview/view buttons.

---

## 5. ACCESS CONTROL & MULTI-TENANT ISOLATION

- **Project Scoping:** Datasets and knowledge records are bound to authorized R&D projects.
- **Tenant Partitioning:** Tenant A cannot query, view, or download datasets or knowledge records belonging to Tenant B.
- **Access Level Enforcement:** Confidential knowledge records are visible only to users with appropriate supervisory roles.
