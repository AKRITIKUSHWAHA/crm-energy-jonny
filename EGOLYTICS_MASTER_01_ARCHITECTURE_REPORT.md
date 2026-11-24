# EGOLYTICS – R&D MANAGEMENT TOOL
## Master Prompt 01: Comprehensive Architecture Report

**Document ID:** `EGOLYTICS_MASTER_01_ARCHITECTURE_REPORT.md`  
**Phase:** Master Prompt 01 of 16 (Foundation, Architecture & Existing Module Adaptation)  
**Execution Date:** November 24, 2026  
**Auditor & Author Roles:** Principal Software Architect, Senior Full-Stack Engineer, Multi-Tenant Systems Lead  
**Target Codebase:** `crm-energy-jonny`  
**Product Positioning:** EgoLytics R&D Management Division of CRM nErgy AI  

---

## 1. EXECUTIVE & ARCHITECTURAL SUMMARY

Master Prompt 01 establishes a reliable, secure, scalable, and maintainable architectural foundation for **EgoLytics – R&D Management Tool** by systematically adapting the proven multi-tenant foundations of the existing **CRM nErgy AI** platform.

Rather than building an isolated application or redundantly re-implementing core enterprise primitives (such as authentication, session management, multi-tenant partitioning, dynamic RBAC, real-time messaging, and audit logging), EgoLytics operates as a dedicated, first-class division within the enterprise suite.

### Core Achievements of Master Prompt 01:
1. **Module Reuse & Adaptation Strategy:** Thoroughly investigated 14 existing core modules and classified each into explicit reuse categories to maximize architectural efficiency and avoid duplicate code.
2. **Clear Product & Domain Boundaries:** Delineated clean architectural boundaries separating Commercial CRM, Enterprise ERP, and the EgoLytics R&D Management Subsystem.
3. **EgoLytics R&D Hub & Navigation Foundation:** Built a dedicated workspace entry (`/crm/rd`) in the main sidebar and mobile drawer navigation, fully integrated into the existing design system.
4. **Backend Foundation Services:** Created `/api/rd/status`, `/api/rd/modules`, `/api/rd/permissions`, and `/api/rd/verify-tenant` with strict JWT verification and tenant scoping.
5. **Multi-Tenant Isolation Guard:** Implemented `backend/src/middleware/tenantIsolation.js` providing cryptographic verification against cross-tenant parameter tampering and query injection.
6. **Dynamic RBAC Compatibility:** Integrated the `rd-workspace` permission namespace across default roles (`business_owner`, `super_admin`, `admin_1`, `crm_pro`) without mutating global enums or breaking existing CRM access.
7. **Zero Regression:** Verified that all 14 automated foundation, authentication, security, and CRM regression tests passed with 100% success rate.

---

## 2. VERIFIED TECHNOLOGY STACK

All versions have been verified directly from `package.json` manifests and live runtime environments:

### Frontend Technology Stack
* **Framework:** React 18.3.1
* **Build System:** Vite 5.4.1 (ES Modules, HMR, Production build time: ~2.0s)
* **Routing:** React Router DOM 6.26.1
* **Component Library:** Custom Enterprise UI Kit (`frontend/src/components/ui`)
* **Vector Icons:** Lucide React 0.428.0
* **Real-time Client:** Socket.IO Client 4.8.4
* **State & Contexts:** Modular React Contexts (`AuthContext`, `CrmContext`, `ErpContext`, `ToastContext`, `LanguageContext`, `CurrencyContext`)
* **Styling System:** CSS Variables (`index.css`), responsive layouts (`responsive.css`), utility classes

### Backend Technology Stack
* **Runtime:** Node.js v24.14.1
* **Framework:** Express.js 5.2.1
* **Database ORM:** Prisma Client 6.4.1
* **Authentication:** JSON Web Tokens (`jsonwebtoken` 9.0.3)
* **Password Hashing:** `bcryptjs` 3.0.3
* **CORS Middleware:** `cors` 2.8.6
* **Real-time Engine:** Socket.IO 4.8.4 WebRTC call signaling
* **Environment Configuration:** `dotenv` 18.0.4

### Database Engine
* **RDBMS:** MySQL 8.x / MariaDB (running via local XAMPP on port `3307`)
* **Database Name:** `crm-db`
* **Schema Definition:** `backend/prisma/schema.prisma` (24 relational tables)
* **Active Data:** 2 corporate tenants (`TENANT-08492`, etc.), 14 provisioned enterprise users

---

## 3. EXISTING MODULE REUSE & ADAPTATION MATRIX

To ensure architectural consistency and prevent code duplication, all existing application modules were evaluated against EgoLytics R&D requirements:

| Existing Module | Existing Files | Existing Database Models | Reuse Classification | Strategic Adaptation Plan |
| :--- | :--- | :--- | :---: | :--- |
| **Authentication & Session** | `/api/auth`, `jwt.js`, `UnifiedLogin.jsx` | `User` (passwordHash) | **REUSE AS-IS** | JWT token generation, bcrypt hashing, and MFA workflows are completely reusable without modification. |
| **User Directory** | `/api/users`, `userController.js` | `User` | **REUSE AS-IS** | User profiles, avatars, and identity references serve directly as research contributors and project managers. |
| **Tenant Boundaries** | `/api/tenants`, `tenantController.js` | `Tenant` | **REUSE AS-IS** | Enterprise organization partitioning, corporate domains, and sub-account hierarchies reused as-is. |
| **Role & Permission Engine** | `/api/roles-permissions`, `rbac.js` | `RolePermission`, `role_permissions` | **REUSE WITH ADAPTATION** | Reused dynamic permission matrix; extended with `rd-workspace` and `rd.*` namespaces without modifying global role enums. |
| **Task Management** | `/api/tasks`, `taskController.js`, `CrmTasks.jsx` | `Task` | **REUSE WITH ADAPTATION** | Operational tasks, priorities, calendar scheduling, and completion states will link to R&D projects in Prompt 06. |
| **Calendar Infrastructure** | `CrmTasks.jsx` (Monthly View) | `Task.dueDate` | **REUSE WITH ADAPTATION** | Monthly date grid and deadline markers adapted for R&D milestone deadlines and experiment scheduling. |
| **Finance & Ledger** | `/api/invoices`, `ErpFinance.jsx` | `LedgerAccount`, `Invoice` | **REUSE WITH ADAPTATION** | General ledger accounting, balance sheets, and invoice tracking adapt for R&D grant tracking and cost accounting in Phase 4. |
| **ERP Project Management** | `/api/erp/projects`, `ErpProjects.jsx` | `ErpProject` | **EXTEND IN FUTURE PROMPTS** | ERP projects manage commercial delivery; R&D projects will connect via dedicated R&D project models in Prompt 05. |
| **Human Resources & Skills** | `/api/hr`, `HrEmployees.jsx`, `HrCandidates.jsx` | `HrEmployee`, `HrCandidate` | **REUSE WITH ADAPTATION** | Employee directories and team profiles adapt for researcher staffing and capacity planning in Prompt 13. |
| **Customer Support Desk** | `/api/support`, `SupportTickets.jsx` | `SupportTicket` | **REUSE WITH ADAPTATION** | Priority queues, categories, and SLA timers adapt for internal project defect, blocker, and issue tracking. |
| **Real-time Call Signaling** | `callSignalingService.js`, Socket.IO | `StaffCallSession` | **REUSE AS-IS** | Peer-to-peer WebRTC video/audio call handshakes available for internal research collaboration. |
| **Activity Stream & Audit Logs**| `/api/activities`, `activityController.js` | `Activity` | **REUSE AS-IS** | Immutable timeline capturing who modified what resource with timestamps and user metadata. |
| **AI SuperHouse & Chat Copilot**| `/api/ai`, `BestieAi.jsx`, `@google/genai` | Vector Cache / Gemini | **REUSE WITH ADAPTATION** | Gemini and Grok integrations adapt for research summarization, hypothesis generation, and protocol drafting. |
| **Territory Management** | `/api/territories`, `TerritoryManagement.jsx` | `Territory` | **BUILD NEW MODULE LATER** | Mock SVG visualizer will be replaced by a real Leaflet/Mapbox GIS spatial engine in Prompt 09 & 10. |
| **BFOV Diagramming** | None | None | **BUILD NEW MODULE LATER** | Complete diagramming workstation (React Flow / Canvas) will be constructed in Prompt 11 & 12. |

---

## 4. TARGET EGOLYTICS SYSTEM ARCHITECTURE

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       ENTERPRISE CLIENT APPLICATION                       │
│                           (React 18.3.1 + Vite)                           │
├─────────────────────────────────────┬─────────────────────────────────────┤
│        COMMERCIAL SUITE             │         EGOLYTICS R&D SUITE         │
│  - CRM Leads & Pipeline Kanban      │  - EgoLytics R&D Hub (/crm/rd)      │
│  - Contact Directory & 360° Timeline│  - R&D Architecture & Boundaries    │
│  - ERP Logistics, Inventory & POs   │  - 16-Prompt Master Roadmap Catalog │
│  - HR Employees & Recruiting ATS    │  - R&D Permission Namespace Matrix  │
│  - Customer Support Helpdesk        │  - Live Tenant Isolation Inspector  │
└─────────────────────────────────────┴─────────────────────────────────────┘
                                  │
                                  ▼ HTTPS / REST JSON (Port 5002)
┌───────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS 5 APPLICATION LAYER                          │
│                                                                           │
│  [ Authentication Middleware: verifyToken (HMAC-SHA256) ]                 │
│  [ Tenant Isolation Guard: validateTenantScope (Anti-Tampering) ]         │
│  [ Dynamic RBAC Guard: authorizeRoles & allowedNavIds ]                   │
├─────────────────────────────────────┬─────────────────────────────────────┤
│        COMMERCIAL ROUTERS           │         EGOLYTICS R&D ROUTERS       │
│  - /api/auth, /api/leads, /api/deals│  - GET  /api/rd/status              │
│  - /api/contacts, /api/tasks        │  - GET  /api/rd/modules             │
│  - /api/erp/*, /api/hr/*            │  - GET  /api/rd/permissions         │
│  - /api/support/*, /api/ebox/*      │  - POST /api/rd/verify-tenant       │
└─────────────────────────────────────┴─────────────────────────────────────┘
                                  │
                                  ▼ Prisma Client Queries (Port 3307)
┌───────────────────────────────────────────────────────────────────────────┐
│                  MYSQL RELATIONAL DATABASE (crm-db)                       │
│                                                                           │
│  - 24 Partitioned Multi-Tenant Tables (tenantId indexed)                  │
│  - Preserved Users (14 accounts), Tenants (2 accounts)                    │
│  - Dynamic Role Permissions (role_permissions table)                      │
│  - Shared Audit Stream (activities table)                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5. FRONTEND & BACKEND BOUNDARIES

### 5.1 Frontend Boundary
* **Workspace Entry Point:** `frontend/src/pages/rd/EgolyticsHub.jsx` mounted at `/crm/rd` and `/crm/rd/*`.
* **Sidebar Integration:** Registered in `frontend/src/data/mockData.js` as:
  ```javascript
  { id: 'rd-workspace', label: 'EgoLytics R&D Hub', icon: FlaskConical, path: '/crm/rd', section: 'EgoLytics R&D' }
  ```
* **Routing Guard:** Protected by `<ProtectedRoute product="crm">` inside `<CrmLayout>`.
* **RBAC Resolution:** Permitted for roles with `'rd-workspace'` in `getFilteredNavigation()`.

### 5.2 Backend Boundary
* **Controller:** `backend/src/controllers/rdController.js`
* **Router:** `backend/src/routes/rdRoutes.js` mounted at `/api/rd` and `/rd` in `backend/src/app.js`.
* **Guards:** All routes enforce `authenticateToken` followed by `validateTenantScope`.

---

## 6. MULTI-TENANT ISOLATION ARCHITECTURE

Multi-tenancy is enforced strictly at the server boundary:
1. **Server-Side Context:** The tenant ID is derived exclusively from the verified cryptographic payload of the JWT (`req.user.tenantId`).
2. **Anti-Tampering Middleware:** `validateTenantScope` actively inspects `req.params.tenantId`, `req.query.tenantId`, and `req.body.tenantId`. If any parameter specifies a tenant different from `req.user.tenantId`, the request is immediately aborted with a **403 Forbidden** (`CROSS_TENANT_VIOLATION`).
3. **Query Scoping:** Database operations append `where: { tenantId }` ensuring zero cross-tenant data exposure.

---

## 7. 16-PROMPT MASTER ROADMAP BOUNDARY INTEGRATION

Master Prompt 01 establishes the foundational registry for the subsequent 15 implementation prompts:

* **Prompt 01 (Foundation):** Completed. Architecture, RBAC, Multi-tenancy, R&D Hub.
* **Prompt 02 (Ideation):** Idea Capture, Categories, and Innovation Pipeline.
* **Prompt 03 (Scoring):** Weighted Multi-Criteria Scoring Rubrics & Prioritization.
* **Prompt 04 (Stage-Gate):** Phase-Gate Governance & Decision Logs.
* **Prompt 05 (Projects):** R&D Project Portfolio & Strategic Alignment.
* **Prompt 06 (Scheduling):** Milestones, Interactive Gantt & Critical Path Engine.
* **Prompt 07 (Experiments):** Research Hypotheses & Experiment Protocol Studio.
* **Prompt 08 (Lab Notebook):** Electronic Lab Notebook (ELN) & Raw Evidence Logs.
* **Prompt 09 (Maplytics Core):** Real Leaflet/Mapbox GIS Engine replacing mock SVG.
* **Prompt 10 (Maplytics Advanced):** 7 Search Options, Shapefiles & Realignment.
* **Prompt 11 (BFOV Core):** React Flow Multi-page Diagramming Workstation.
* **Prompt 12 (BFOV Advanced):** Stencil Packs, Mermaid Import & AI Diagramming.
* **Prompt 13 (Resources):** Capacity Planning, Timesheets & Lab Equipment Booking.
* **Prompt 14 (IP & Patents):** Patent Register, Claims & Trademark Catalog.
* **Prompt 15 (Compliance):** Regulatory Documentation, SOPs & Lab Safety Audits.
* **Prompt 16 (Analytics & Final):** Executive R&D Telemetry & Final Certification.

---

## 8. ARCHITECTURAL DECISION RECORDS (ADRs)

* **ADR-01: Shared Process Monolith vs Microservices**  
  *Decision:* Deploy EgoLytics within the existing Express/React monolithic workspace rather than spawning a separate microservice.  
  *Rationale:* Shared database connection pooling, shared authentication, zero network latency between modules, and instant RBAC compatibility.
* **ADR-02: Dynamic RBAC vs Schema Role Enum Mutation**  
  *Decision:* Do not add new global roles to the Prisma `Role` enum in this phase; utilize the dynamic `role_permissions` table and `rd.*` permission namespaces.  
  *Rationale:* Prevents breaking existing database records or causing schema migration rollbacks while giving administrators dynamic control over permissions.
* **ADR-03: Server-Enforced Tenant Validation**  
  *Decision:* Implement `validateTenantScope` middleware intercepting all R&D routes.  
  *Rationale:* Guarantees that client-side tampering cannot compromise tenant boundaries.
