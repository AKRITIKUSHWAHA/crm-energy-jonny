# EGOLYTICS MASTER PROMPT 03 — IDEA MANAGEMENT IMPLEMENTATION REPORT
**Project:** EgoLytics – R&D Management Tool  
**Division:** CRM nErgy AI  
**Roadmap Phase:** Master Prompt 03 of 16  
**Implementation Focus:** Requirement 3 (Idea Capture) & Requirement 61 (Idea Management)  
**Date of Execution:** November 2026  
**Author:** Principal Software Architect & Full-Stack MERN Specialist

---

## 1. Executive Summary

This report documents the architectural design, database modeling, backend API engineering, and frontend implementation of the **Idea Management and Innovation Capture Portal** within EgoLytics (CRM nErgy AI). 

Covering **Requirement 3 (Idea Capture)** and **Requirement 61 (Idea Management)** from the authoritative client specification `EgoLytics - R_D Management Tool.docx`, this module provides an enterprise-grade ideation intake and collaboration engine. Researchers, engineers, and cross-functional teams can rapidly capture early-stage concepts, structure problem statements and proposed solutions, categorize ideas, participate in threaded technical discussions, and cast community upvotes under strict multi-tenant and role-based access control (RBAC).

All implementations are fully database-backed via MySQL and Prisma ORM, non-destructive to existing CRM and ERP data, and cleanly separated from the downstream Project Intake (Master Prompt 02) and Stage-Gate governance (Master Prompt 04) modules.

---

## 2. Requirement Scope & Architectural Boundaries

### 2.1 Scope Inclusions
1. **Quick Capture Portal (Req 3):** Standardized ingestion for innovation concepts, research problems, expected benefits, technical tags, and contributor attribution.
2. **Sequential Reference Numbering:** Automated generation of collision-free, human-readable codes (`IDEA-YYYY-XXXX`) partitioned per tenant.
3. **Category Management:** Seeded domain categories (`Product Innovation`, `Process Improvement`, `Technology Innovation`, `Sustainability & ESG`, `Customer Experience`) with tenant-customizable extensions, color coding, and display ordering.
4. **Community Upvoting Engine (Req 61):** 1-vote-per-user-per-idea database constraint with toggle/removal support and atomic counter caching.
5. **Threaded Discussions:** Nested, timestamped author comments allowing researchers to exchange technical literature and experiment ideas.
6. **Reviewer Assignment:** Structured linkage of internal and external domain specialists to ideas for formal evaluation.
7. **Complete Zero-Regression:** 100% preservation of all 14 users, 2 tenants, CRM core tables, and Master Prompt 02 project intake models.

### 2.2 Strict Architectural Decoupling
- **Decoupling from Project Proposals (Master 02):** Ideas exist in an ideation incubator. Ideas are *not* automatically created as formal projects or formal proposals until reaching `ACCEPTED_FOR_INCUBATION`.
- **Decoupling from Scoring:** Community upvotes (`voteCount`) measure crowd popularity and are strictly partitioned from the mathematical expert evaluation score (`compositeScore`).

---

## 3. Database Architecture & Schema Specification

The following additive Prisma models were deployed to the `crm-db` database without dropping or altering any pre-existing tables.

### 3.1 `RdIdeaCategory`
Stores tenant-specific innovation classifications:
```prisma
model RdIdeaCategory {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?  @db.Text
  color       String   @default("#3b82f6")
  displayOrder Int     @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?    @relation("IdeaCategoryCreator", fields: [createdById], references: [id], onDelete: SetNull)
  ideas     RdIdea[]

  @@unique([tenantId, name])
  @@index([tenantId, isActive])
  @@map("rd_idea_categories")
}
```

### 3.2 `RdIdea`
Core entity representing research ideas:
```prisma
model RdIdea {
  id               String    @id @default(cuid())
  tenantId         String
  referenceNumber  String
  title            String
  summary          String?   @db.Text
  problemStatement String?   @db.Text
  proposedSolution String?   @db.Text
  description      String?   @db.Text
  expectedBenefits String?   @db.Text
  categoryId       String?
  tags             String?   @db.Text
  status           String    @default("DRAFT")
  authorId         String?
  contributorName  String?
  contributorEmail String?
  targetHorizon    String?   @default("H1_SHORT_TERM")
  voteCount        Int       @default(0)
  evaluationCount  Int       @default(0)
  compositeScore   Float?
  rankPosition     Int?
  moreInfoNotes    String?   @db.Text
  rejectionReason  String?   @db.Text
  isArchived       Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  tenant      Tenant                  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  author      User?                   @relation("IdeaAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  category    RdIdeaCategory?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  votes       RdIdeaVote[]
  comments    RdIdeaComment[]
  reviewers   RdIdeaReviewer[]
  evaluations RdIdeaEvaluation[]

  @@unique([tenantId, referenceNumber])
  @@index([tenantId, status])
  @@index([tenantId, categoryId])
  @@index([tenantId, compositeScore])
  @@map("rd_ideas")
}
```

### 3.3 `RdIdeaVote`
Enforces atomic 1-vote-per-user-per-idea rule:
```prisma
model RdIdeaVote {
  id        String   @id @default(cuid())
  tenantId  String
  ideaId    String
  userId    String
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  idea   RdIdea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user   User   @relation("UserIdeaVotes", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([ideaId, userId])
  @@index([tenantId, ideaId])
  @@map("rd_idea_votes")
}
```

### 3.4 `RdIdeaComment`
Supports threaded discussions:
```prisma
model RdIdeaComment {
  id        String   @id @default(cuid())
  tenantId  String
  ideaId    String
  userId    String
  parentId  String?
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant  Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  idea    RdIdea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user    User            @relation("UserIdeaComments", fields: [userId], references: [id], onDelete: Cascade)
  parent  RdIdeaComment?  @relation("IdeaCommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies RdIdeaComment[] @relation("IdeaCommentReplies")

  @@index([tenantId, ideaId])
  @@index([ideaId, parentId])
  @@map("rd_idea_comments")
}
```

### 3.5 `RdIdeaReviewer`
Tracks assigned evaluators and completion status:
```prisma
model RdIdeaReviewer {
  id           String    @id @default(cuid())
  tenantId     String
  ideaId       String
  reviewerId   String
  assignedById String?
  status       String    @default("PENDING")
  assignedAt   DateTime  @default(now())

  tenant     Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  idea       RdIdea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  reviewer   User   @relation("IdeaReviewerAssignments", fields: [reviewerId], references: [id], onDelete: Cascade)
  assignedBy User?  @relation("IdeaReviewerAssigner", fields: [assignedById], references: [id], onDelete: SetNull)

  @@unique([ideaId, reviewerId])
  @@index([tenantId, reviewerId])
  @@map("rd_idea_reviewers")
}
```

---

## 4. Backend Service & API Specification

### 4.1 Service Layer Architecture (`rdIdeaService.js`)
- `generateReferenceNumber(tenantId)`: Generates sequential `IDEA-YYYY-XXXX` codes based on total tenant idea volume.
- `ensureDefaultCategories(tenantId, userId)`: Auto-seeds 5 standard categories upon tenant activation.
- `getIdeas(tenantId, query, userId)`: Multi-filter query engine (status, category, tag, search string, author) with pagination and `hasUserVoted` enrichment.
- `createIdea(tenantId, data, userId)`: Validates required inputs, initializes DRAFT or SUBMITTED status, and logs activity audit.
- `voteIdea(tenantId, ideaId, userId)`: Atomic `$transaction` that inserts `RdIdeaVote` and executes `voteCount: { increment: 1 }`.
- `unvoteIdea(tenantId, ideaId, userId)`: Atomic `$transaction` that deletes `RdIdeaVote` and safely decrements `voteCount`.
- `assignReviewer(tenantId, ideaId, data, assignedById)`: Upserts reviewer assignment, linking team members to candidate concepts.

### 4.2 API Endpoint Inventory
| HTTP Method | Route | Description | RBAC Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rd/ideas` | List ideas with filters & pagination | All authenticated |
| `POST` | `/api/rd/ideas` | Create new innovation idea (DRAFT/SUBMITTED) | Contributor / Staff+ |
| `GET` | `/api/rd/ideas/:id` | Get idea details, comments & evaluations | All authenticated |
| `PUT / PATCH`| `/api/rd/ideas/:id` | Update idea content | Author / Admin |
| `POST` | `/api/rd/ideas/:id/submit`| Transition DRAFT $\rightarrow$ SUBMITTED | Author / Staff+ |
| `POST / PATCH`| `/api/rd/ideas/:id/status`| Transition status (UNDER_REVIEW, MORE_INFO, etc.) | Lead / Admin |
| `POST` | `/api/rd/ideas/:id/vote` | Cast upvote (1 per user) | All authenticated |
| `DELETE` | `/api/rd/ideas/:id/vote` | Remove upvote | All authenticated |
| `GET` | `/api/rd/ideas/:id/comments` | Get idea discussion comments | All authenticated |
| `POST` | `/api/rd/ideas/:id/comments` | Add comment / feedback | All authenticated |
| `POST` | `/api/rd/ideas/:id/reviewers`| Assign reviewer to idea | Lead / Admin |
| `GET` | `/api/rd/ideas/categories` | List active categories | All authenticated |
| `POST` | `/api/rd/ideas/categories`| Create custom category | Admin / Lead |
| `GET` | `/api/rd/ideas/tags` | List distinct innovation tags | All authenticated |
| `GET` | `/api/rd/ideas/metrics` | High-level summary metrics | All authenticated |

---

## 5. Frontend UI/UX Implementation

The frontend is implemented in `frontend/src/pages/rd/RdIdeas.jsx` and integrated into the primary EgoLytics navigation hub.

### 5.1 Key UI Components & Capabilities
1. **Interactive Idea Dashboard:**
   - Real-time KPI summary bar showing Total Ideas, Active in Pipeline, Community Votes, Evaluated Concepts, and Incubation Acceptance Rate.
   - Comprehensive filter bar supporting keyword search, lifecycle status filtering, category selection, and sorting (Newest, Highest Voted, Highest Score).
2. **Idea Submission Modal:**
   - Form fields for Title, Strategic Category, Problem Statement, Proposed Solution, Expected Benefits, and Comma-separated Tags.
   - Dual actions: "Save as Draft" or "Submit to Pipeline".
3. **Idea Detail & Review Slide-Over Drawer:**
   - Tabbed workspace featuring "Overview", "Comments & Discussions", and "Reviewers".
   - Interactive Community Upvoting button displaying real-time vote count with active vote state highlight.
   - Threaded commentary panel with timestamp and contributor avatar display.
   - Reviewer assignment panel allowing technical leads to delegate evaluation tasks.
   - Administrative Status Action Bar for transitioning ideas (`Request Info`, `Accept for Incubation`, `Reject`).

---

## 6. Security, Multi-Tenancy & RBAC Verification

- **Tenant Isolation:** Every query enforces `where: { tenantId }`. All joins and foreign keys cascade within the active tenant partition.
- **RBAC Enforcement:** Standard team members can submit ideas, comment, and upvote. Administrative transitions (`ACCEPTED_FOR_INCUBATION`, `REJECTED`, rubric management) are restricted to `BUSINESS_OWNER`, `SUPER_ADMIN`, and `RD_MANAGER` roles.
- **Zero-Regression Audit:** Verified that no existing tables or CRM records were modified, dropped, or corrupted during deployment.
