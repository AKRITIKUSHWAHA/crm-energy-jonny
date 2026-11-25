# EGOLYTICS – R&D MANAGEMENT TOOL
## Master Prompt 01: RBAC & Multi-Tenancy Architecture Report

**Document ID:** `EGOLYTICS_MASTER_01_RBAC_AND_MULTITENANCY.md`  
**Phase:** Master Prompt 01 of 16 (Foundation, Architecture & Existing Module Adaptation)  
**Execution Date:** November 24, 2026  
**Auditor & Author Roles:** SaaS Security Specialist, RBAC Architect, Multi-Tenant Systems Lead  

---

## 1. EXISTING ROLE INVENTORY

The platform maintains 12 standardized enterprise persona roles configured in `backend/prisma/schema.prisma` (`enum Role`) and mapped in `frontend/src/utils/rbac.js` (`CRM_ROLE_CONFIG`):

| Role Identifier | Enum Value | Display Title | Default Access Scope |
| :--- | :--- | :--- | :--- |
| **`business_owner`** | `BUSINESS_OWNER` | Business Owner / Executive | Full governance over all enterprise CRM, ERP, and R&D modules. |
| **`super_admin`** | `SUPER_ADMIN` | Master Super Administrator | System-wide administrative governance and root configuration. |
| **`admin_1`** | `OPERATIONS_SALES_ADMIN` | Operations & Sales Administrator | Operations management, leads, pipeline, ERP, and R&D workspace. |
| **`admin_2`** | `FINANCE_COMPLIANCE_ADMIN`| Finance & Compliance Administrator | Financial ledger, invoices, balance sheets, and compliance logs. |
| **`crm_pro`** | `CRM_PRO` | CRM & Pipeline Specialist | Commercial CRM pipeline, customer relations, and R&D workspace. |
| **`hr`** | `HR` | Human Resources Director | Employee directory, candidate recruiting, and interview boards. |
| **`customer`** | `CUSTOMER` | Client & Customer Portal | Self-service ticketing portal, public knowledge base, and profile. |
| **`content_creator`** | `CONTENT_CREATOR` | AI Media & Video Creator | Creative AI studio, video generation, and media asset vault. |
| **`content_builder`** | `CONTENT_BUILDER` | Campaign & Content Builder | AI marketing campaigns, templates, and outbound collateral. |
| **`influencer`** | `INFLUENCER` | Brand Ambassador & Influencer | Social outreach, campaigns, and commercial partnerships. |
| **`affiliate_partner`** | `AFFILIATE_PARTNER` | Affiliate Deal Partner | Deal commissions, referral links, and partner leads. |
| **`ai_marketing_pro`** | `AI_MARKETING_PRO` | AI Marketing Specialist | AI marketing automation, lead scoring, and campaign analytics. |

---

## 2. R&D PERMISSION ARCHITECTURE & NAMESPACES

### 2.1 Foundational Permission Introduced in Master Prompt 01
* **Identifier:** `rd-workspace`
* **Label:** "EgoLytics R&D Hub"
* **Bound Routes:** `['/crm/rd', '/crm/rd/dashboard', '/crm/rd/modules']`
* **Role Ingestion:** Granted by default to `business_owner`, `super_admin`, `admin_1`, and `crm_pro`. Securely restricted from external customer and influencer roles.

### 2.2 Standardized Future R&D Permission Namespaces
The backend route `GET /api/rd/permissions` registers 12 standardized permission namespaces designed for granular action control across the remaining 15 master prompts:

1. `rd.workspace.access`: View EgoLytics R&D workspace hub.
2. `rd.dashboard.view`: View research telemetry and project status.
3. `rd.projects.view`: Browse R&D portfolio and project details.
4. `rd.projects.manage`: Create, update, and manage R&D projects.
5. `rd.tasks.manage`: Schedule tasks, milestones, and assign researchers.
6. `rd.ideas.manage`: Submit, score, and prioritize innovation ideas.
7. `rd.experiments.manage`: Design protocols and log experiment runs.
8. `rd.decisions.manage`: Execute stage-gate sign-offs and decision logs.
9. `rd.reports.view`: Export research audits and executive reports.
10. `rd.compliance.manage`: Manage SOPs, safety logs, and regulatory files.
11. `rd.maplytics.view`: View and align spatial territories on GIS maps.
12. `rd.bfov.manage`: Create and edit architecture diagrams and charts.

---

## 3. MULTI-TENANT ISOLATION ARCHITECTURE

### 3.1 Server-Side Enforcement Layer
Tenant isolation is enforced via dedicated middleware (`backend/src/middleware/tenantIsolation.js`):

```javascript
const validateTenantScope = (req, res, next) => {
  const sessionTenantId = req.user.tenantId;
  const paramTenantId = req.params?.tenantId;
  const queryTenantId = req.query?.tenantId;
  const bodyTenantId = req.body?.tenantId;

  if ((paramTenantId && paramTenantId !== sessionTenantId) ||
      (queryTenantId && queryTenantId !== sessionTenantId) ||
      (bodyTenantId && bodyTenantId !== sessionTenantId)) {
    return res.status(403).json({
      success: false,
      message: 'Cross-tenant access violation: Requested tenant does not match authorized session.',
      code: 'CROSS_TENANT_VIOLATION',
    });
  }
  next();
};
```

### 3.2 Frontend RBAC Enforcement Layer
* **Menu Visibility:** `Sidebar.jsx` and `CrmMobileAppDrawer.jsx` execute `getFilteredNavigation()`, hiding `rd-workspace` from roles lacking authorization.
* **Route Protection:** Direct navigation to `/crm/rd` checks `isRouteAllowed()`. Unauthorized users are bounced to their role's default dashboard route.

---

## 4. CROSS-TENANT SECURITY ATTACK SIMULATION RESULTS

Four automated security test scenarios were executed against live endpoints:

| Scenario ID | Attack Vector | Payload / Request | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Parameter Tampering | `POST /api/rd/verify-tenant` with `{ claimedTenantId: "MALICIOUS_TENANT_X" }` | 403 Forbidden with security error | HTTP 403 Forbidden (`CROSS_TENANT_VIOLATION`) | **PASSED** |
| **SEC-02** | Query String Injection | `GET /api/rd/status?tenantId=FOREIGN_TENANT_999` | 403 Forbidden intercept | HTTP 403 Forbidden (`CROSS_TENANT_VIOLATION`) | **PASSED** |
| **SEC-03** | Missing Token (Unauth) | `GET /api/rd/status` without Authorization header | 401 Unauthorized | HTTP 401 (`Authentication required`) | **PASSED** |
| **SEC-04** | Invalid Token (Forged) | `GET /api/rd/status` with forged Bearer token | 401 Unauthorized | HTTP 401 (`Invalid authentication token`) | **PASSED** |

---

## 5. UNRESOLVED CLIENT CLARIFICATION DECISION

* **Client Question:** The client document mentions research teams and laboratory personnel. Should new global roles (`CHIEF_SCIENTIST`, `LAB_DIRECTOR`, `RESEARCH_ENGINEER`, `IRB_REVIEWER`) be introduced into the Prisma `Role` enum?
* **Architectural Recommendation:** Retain the existing 12 global roles to prevent schema breaking changes. Use the dynamic `role_permissions` table to assign granular `rd.*` permission sets to custom tenant groups. Await client written confirmation before altering the global Prisma enum.
