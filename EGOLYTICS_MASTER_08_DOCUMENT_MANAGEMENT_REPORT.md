# EGOLYTICS MASTER PROMPT 08 — DOCUMENT MANAGEMENT REPORT

**Project:** EgoLytics – R&D Management Tool  
**Platform:** CRM nErgy AI  
**Roadmap Stage:** Master Prompt 08 of 16  
**Document Code:** MP08-DOC-MGMT  
**Client Requirements Covered:** Requirement 42 (Document Management), Requirement 63 (Experiment Documentation Integration)

---

## 1. DOCUMENT REPOSITORY ARCHITECTURE

In compliance with client Requirement 42, EgoLytics provides a centralized scientific document repository designed specifically for research and engineering artifacts rather than treating documents as generic CRM file attachments.

Documents in EgoLytics represent managed scientific intellectual property, technical reports, experimental protocols, and literature references with full lifecycle traceability.

```
+-----------------------------------------------------------------------------------+
|                        CENTRALIZED DOCUMENT VAULT                                 |
+-----------------------------------------------------------------------------------+
|  Storage Base: backend/storage/research_docs/<tenantId>/                          |
|  - Outside public webroot (blocks direct URL harvesting)                          |
|  - Cryptographic naming: <timestamp>_<uuid>.<ext>                                 |
|  - Tenant-isolated subdirectories                                                 |
+-----------------------------------------------------------------------------------+
        |                                   |                                   |
        v                                   v                                   v
+-------------------+             +-------------------+             +-------------------+
|   Document Record |             | Version Lineage   |             | Entity Linkages   |
| (rd_research_docs)|             | (rd_doc_versions) |             | (rd_doc_links)    |
+-------------------+             +-------------------+             +-------------------+
| - documentCode    |             | - versionNumber   |             | - EXPERIMENT      |
| - category        |             | - versionLabel    |             | - RUN             |
| - checksum        |             | - fileChecksum    |             | - NOTE            |
| - currentVersion  |             | - isCurrent       |             | - HYPOTHESIS      |
| - status          |             | - revisionSummary |             | - OBJECTIVE       |
+-------------------+             +-------------------+             +-------------------+
```

---

## 2. DOCUMENT METADATA SPECIFICATION

Every managed research document in `rd_research_documents` captures comprehensive persisted metadata:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(191) | Primary key (CUID) |
| `tenantId` | VARCHAR(191) | Scoped organization tenant ID |
| `projectId` | VARCHAR(191) | Associated R&D project |
| `notebookId` | VARCHAR(191) | Optional target research notebook |
| `noteId` | VARCHAR(191) | Optional bound notebook entry |
| `experimentId` | VARCHAR(191) | Optional bound scientific experiment |
| `documentCode` | VARCHAR(191) | Auto-generated unique reference (e.g. `DOC-2026-001`) |
| `title` | VARCHAR(255) | Official scientific document title |
| `description` | TEXT | Detailed abstract, methodology summary, or findings |
| `category` | VARCHAR(100) | Document classification category |
| `tags` | TEXT | Comma-delimited discovery keywords |
| `originalFilename` | VARCHAR(255) | Original file name as uploaded by researcher |
| `fileExtension` | VARCHAR(50) | Normalized file extension (`.pdf`, `.txt`, `.csv`, etc.) |
| `mimeType` | VARCHAR(100) | MIME type for HTTP content headers |
| `fileSize` | INT | File size in bytes |
| `storagePath` | VARCHAR(500) | Server-side filesystem path (masked from clients) |
| `fileChecksum` | VARCHAR(128) | Cryptographic SHA-256 integrity hash |
| `currentVersion` | INT | Active version number (starts at 1) |
| `status` | VARCHAR(50) | Document status (`ACTIVE`, `ARCHIVED`, `DRAFT`) |
| `uploadedById` | VARCHAR(191) | User ID of the uploader |
| `createdAt` | DATETIME(3) | Initial upload timestamp |
| `updatedAt` | DATETIME(3) | Latest modification timestamp |

---

## 3. DOCUMENT CATEGORIES

The repository enforces standardized research document categories:

1. **`RESEARCH_REPORT`:** Comprehensive laboratory reports, stage completion summaries, and synthesized experimental conclusions.
2. **`TECHNICAL_DOCUMENT`:** Engineering specifications, hardware schematics, and manufacturing tolerance tolerances.
3. **`SCIENTIFIC_PAPER`:** Peer-reviewed publications, academic pre-prints, and formal scientific manuscripts.
4. **`EXPERIMENTAL_REPORT`:** Run-level execution reports containing raw observations, measurement charts, and calibration parameters.
5. **`LITERATURE_REFERENCE`:** Third-party patents, journal articles, and academic references cited during discovery.
6. **`METHODOLOGY`:** Standard Operating Procedures (SOPs), chemical recipes, and testing protocols.
7. **`DATASET_DOCUMENTATION`:** Schema definitions, variable codebooks, and instrument calibration logs.
8. **`RESEARCH_EVIDENCE`:** Traceable proof documents attached to Gate reviews or hypothesis evaluations.
9. **`DIAGRAM`:** Molecular structures, electrical topologies, process flowcharts, and technical drawings.
10. **`GENERAL_ATTACHMENT`:** Meeting notes, conference presentations, and general scientific correspondence.

---

## 4. SECURE FILE STORAGE & UPLOAD PIPELINE

### 4.1 Storage Abstraction
Files are stored securely in `backend/storage/research_docs/<tenantId>/`. This location sits outside the public web server directory, preventing direct static URL access, directory traversal, and unauthenticated scraping.

### 4.2 Upload Protocol & Base64 Ingestion
Because external heavy multipart libraries were not installed in the baseline dependencies, EgoLytics uses native standard JSON Base64 ingestion:
1. Client selects a file; the browser's native `FileReader` converts the binary stream into a Base64 string.
2. The payload is validated client-side and sent via `POST /api/rd/eln/documents` with `{ filePayload: { fileName, fileSize, mimeType, base64Content }, ...metadata }`.
3. The server decodes the Base64 buffer, performs extension and size validation, sanitizes the filename, saves the file to the tenant storage directory, and calculates the SHA-256 hash.

### 4.3 Validation & Security Controls
- **File Size Limit:** Enforces a 25MB maximum upload limit per file. Uploads exceeding 25MB are rejected with HTTP 400.
- **Disallowed Executable File Formats:** Strictly rejects dangerous file extensions:
  `.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.js`, `.mjs`, `.com`, `.msi`, `.dll`, `.bin`, `.scr`, `.jar`, `.py`, `.app`.
- **Directory Traversal Defense:** Sanitizes filenames using `path.basename` and strips path manipulation sequences (`..`, `/`, `\`). Verifies that the resolved storage path starts strictly with the tenant directory.
- **Cryptographic SHA-256 Checksum:** Generated upon disk write using Node.js `crypto.createHash('sha256')`. Persisted in both `rd_research_documents` and `rd_document_versions` to detect accidental corruption or bit-rot.

---

## 5. DOWNLOAD & PREVIEW CAPABILITIES

### 5.1 Permission-Controlled Downloads
Downloads are served through `GET /api/rd/eln/documents/:id/download?version=<N>`.
- Requires valid JWT authentication and matching `tenantId`.
- Verifies user has access to the parent project or notebook.
- Sets HTTP headers:
  `Content-Type: <mimeType>`
  `Content-Disposition: attachment; filename="<sanitized_filename>"`
  `Content-Length: <fileSize>`
- Streams binary buffer directly from disk; internal storage paths are never revealed to the browser.

### 5.2 Document Preview
Served through `GET /api/rd/eln/documents/:id/preview?version=<N>`.
- Sets `Content-Disposition: inline`.
- For images (`image/png`, `image/jpeg`, `image/gif`, `image/svg+xml`), browsers render directly.
- For PDFs, browsers render inside an embedded sandbox iframe.
- For plain text, CSV, and JSON, content is streamed directly for instant rendering.
- For unsupported binary formats, the UI gracefully informs the researcher and provides an instant one-click download button.

---

## 6. DOCUMENT RELATIONSHIPS & LINKING (AC-21)

Documents can be linked to any scientific entity in the EgoLytics platform via `rd_document_links`:
- **Supported Entity Types:** `PROJECT`, `NOTEBOOK`, `NOTE`, `EXPERIMENT`, `RUN`, `HYPOTHESIS`, `OBJECTIVE`, `EVIDENCE`, `OUTCOME`, `KNOWLEDGE`.
- **Supported Link Types:** `SUPPORTING_DOCUMENT`, `SPECIFICATION`, `PROTOCOL_ATTACHMENT`, `REPORT`, `RAW_DATA`.
- **Bidirectional Discoverability:** Opening an experiment displays all linked documents; opening a document displays all linked research entities.
