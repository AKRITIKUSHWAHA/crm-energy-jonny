# EGOLYTICS MASTER PROMPT 08 — VERSION HISTORY & REVISION TRACKING REPORT

**Project:** EgoLytics – R&D Management Tool  
**Platform:** CRM nErgy AI  
**Roadmap Stage:** Master Prompt 08 of 16  
**Document Code:** MP08-VER-CTRL  
**Authoritative Requirement:** Requirement 94 (Version Control) & Requirement 42 (Document Management)

---

## 1. REQUIREMENT 94 SCOPE INTERPRETATION

The initial client requirement audit identified a scope ambiguity regarding Requirement 94 ("Version Control"):
- **Interpretation A (Software Engineering):** External developer source-code Git repository integration (branching, commits, pull requests, merge conflict resolution).
- **Interpretation B (Scientific Laboratory ELN):** Internal document version control and historical revision tracking for laboratory records, research papers, experimental datasets, and scientific documentation.

### Explicit Scope Decision
In direct alignment with the instructions of Master Prompt 08:
1. **Scope Applied:** **Internal Document Version History & Revision Tracking**. This capability is directly essential for scientific reproducibility, audit compliance, and historical traceability in an Electronic Lab Notebook.
2. **Exclusion:** Developer Git repository integration is **NOT** implemented in this prompt. Scientific documentation does not require Git branching mechanics, which would introduce unnecessary complexity and dependencies.
3. **Traceability:** This interpretation is formally documented here. If the client later desires developer Git integration for software repositories, that capability can be evaluated under a separate, dedicated prompt.

---

## 2. DOCUMENT VERSIONING DATA MODEL

Document versioning is implemented through a 1-to-many relationship between `RdResearchDocument` (the logical document entity) and `RdDocumentVersion` (the immutable physical version snapshot):

```
+------------------------------------+
|        RdResearchDocument          |
+------------------------------------+
| id: doc_123                        |
| documentCode: DOC-2026-001         |
| title: "Thermal Degradation Report"|
| currentVersion: 3                  |
+------------------------------------+
                  |
        1 to Many |
                  v
+---------------------------------------------------------------------------------------+
|                                 RdDocumentVersion                                     |
+---------------------------------------------------------------------------------------+
| Version 1: versionNumber=1, label="v1.0", path=".../file_v1.txt", isCurrent=false     |
| Version 2: versionNumber=2, label="v2.0", path=".../file_v2.txt", isCurrent=false     |
| Version 3: versionNumber=3, label="v3.0", path=".../file_v1.txt", isCurrent=true      |
|            (Restored from Version 1 without deleting Version 2)                       |
+---------------------------------------------------------------------------------------+
```

### Fields of `rd_document_versions`:
- `id`: CUID primary key
- `tenantId`: Scoped organization tenant ID
- `documentId`: Foreign key to `rd_research_documents`
- `versionNumber`: Sequential integer ($1, 2, 3\dots$)
- `versionLabel`: Formatted version tag (e.g. `v1.0`, `v2.0`)
- `originalFilename`: Name of the file uploaded for this version
- `fileExtension`: File extension
- `mimeType`: MIME type
- `fileSize`: File size in bytes
- `storagePath`: Physical filesystem location on server disk
- `fileChecksum`: SHA-256 cryptographic hash of this version's content
- `revisionSummary`: Mandatory or optional description of what changed in this revision
- `isCurrent`: Boolean indicator marking the active document version
- `uploadedById`: User who authored or uploaded this revision
- `createdAt`: Immutable timestamp when the version was recorded

---

## 3. VERSIONING LIFECYCLE & WORKFLOW

### 3.1 Initial Document Upload (Version 1.0)
When a document is first uploaded via `POST /api/rd/eln/documents`:
1. The physical file is saved to disk; its SHA-256 hash is computed.
2. An `RdResearchDocument` record is created with `currentVersion = 1`.
3. An initial `RdDocumentVersion` is recorded with `versionNumber = 1`, `versionLabel = "v1.0"`, `isCurrent = true`, and `revisionSummary = "Initial document upload"`.
4. An immutable audit activity record is generated.

### 3.2 Uploading a Replacement Version (v2.0, v3.0...)
When an existing document is updated with a new file via `POST /api/rd/eln/documents/:id/versions`:
1. The new physical file is saved to disk under a new unique timestamped filename.
2. The server queries the latest `currentVersion` $N$.
3. The previous active version record is updated: `isCurrent = false`.
4. A new version record is created:
   - `versionNumber = N + 1`
   - `versionLabel = "v" + (N + 1) + ".0"`
   - `revisionSummary = <user-provided revision summary>`
   - `isCurrent = true`
5. The parent `RdResearchDocument` is updated with `currentVersion = N + 1`, new file metadata, and checksum.
6. **Zero File Overwrite:** The previous version file remains untouched on disk.

### 3.3 Historical Version Download
Researchers can download any historical revision by supplying the optional `?version=<N>` query parameter:
`GET /api/rd/eln/documents/:id/download?version=1`
The server locates the exact version record, retrieves its immutable `storagePath`, and streams the historical file with the filename that was active during that revision.

---

## 4. SAFE VERSION RESTORATION (AC-17)

A critical requirement of scientific data integrity is that **restoring an older version must never delete or overwrite intermediate history**.

If a researcher has Version 1.0, updates to Version 2.0, and later realizes Version 1.0 was preferable:
- **Destructive Systems (Flawed):** Overwrite Version 2.0 with Version 1.0, losing Version 2.0 permanently.
- **EgoLytics Safe Restoration (Implemented):**
  1. The researcher selects "Restore Version 1.0".
  2. The server retrieves the file reference and checksum of Version 1.0.
  3. The server creates **Version 3.0**, pointing to Version 1.0's file content, with `revisionSummary = "Restored from version v1.0 (#1)"`.
  4. Version 2.0 remains completely intact in the historical lineage.
  5. The active version becomes Version 3.0.
  6. The audit log records the restoration actor, source version, and new version number.

This guarantees complete non-destructive audit compliance.

---

## 5. RESEARCH NOTE REVISION TRACKING (AC-18)

In addition to document file versioning, research notebook entries (`rd_research_notes`) also maintain full revision history via `rd_research_note_versions`:

### Workflow:
1. When an entry is first created, it is saved with `version = 1`. An initial snapshot is recorded in `rd_research_note_versions`.
2. Researchers may edit draft entries freely.
3. Once an entry is signed off or finalized (`status = 'FINALIZED'`), any subsequent edits to title or content automatically:
   - Increments the note's `version` ($1 \to 2 \to 3$).
   - Creates a new revision record in `rd_research_note_versions` with the full text content, author ID, timestamp, and `changeSummary`.
4. Researchers can open the **Revision History** modal in the UI to inspect earlier versions side-by-side or review who made what edits and when.

---

## 6. AUDIT HISTORY & REGULATORY PREPARATION

Every version creation, note revision, and document restoration is logged in the centralized `Activity` table:
- Action: `[ELN] Document Version Restored`, `[ELN] New Document Version Uploaded`, `[ELN] Research Entry Updated`.
- Actor: Verified user ID extracted from JWT.
- Tenant: Scoped tenant ID.
- Metadata: Document ID, version numbers, filename, and revision notes.

> [!NOTE]
> EgoLytics implements strong technical controls for immutability, cryptographic checksums, and non-destructive revisions. However, formal compliance with 21 CFR Part 11 or GxP requires additional procedural controls (such as dual digital signature ceremony and hardware security modules) which should be reviewed with the client's compliance auditor if required.
