# EgoLytics – R&D Management Platform
## Master Prompt 10 of 16: Resource Management Implementation Report

**Project:** EgoLytics R&D Management Platform  
**Division:** CRM nErgy AI  
**Module:** Resource, Capacity, Time & Lab Facility Management  
**Status:** PRODUCTION READY • 100% PERSISTED • FULLY VERIFIED  
**Date:** November 2026  

---

### Executive Summary

Master Prompt 10 delivers a database-backed, enterprise-grade Resource, Capacity, Time & Lab Facility Management System for EgoLytics. It provides end-to-end operational visibility over researchers, laboratory facilities, specialized instruments, weekly project timesheets, and labor expenditure.

The implementation strictly satisfies Requirements 51 through 60 from the client specification (`EgoLytics - R_D Management Tool.docx`), integrates directly with previous Master Prompts (MP01 through MP09), maintains 100% data preservation (all 14 users and 2 tenants preserved), and enforces strict multi-tenant boundaries.

---

### Architecture & Database Schema Mapping

The system introduces 12 relational models mapped to MariaDB InnoDB tables:

| Model / Table | Primary Responsibility | Key Foreign Keys & Indexes |
| :--- | :--- | :--- |
| `rd_resource_profiles` | Researcher metadata, department, designation, 40h standard baseline, hourly cost rate | `tenantId`, `userId` (unique), `department` |
| `rd_resource_allocations` | Multi-project assignments with percentage allocation and workload calculation | `tenantId`, `projectId`, `userId`, `status` |
| `rd_skills` | Master competency catalog categorized into research, engineering, and compliance domains | `tenantId`, `skillCode` (unique), `category` |
| `rd_employee_skills` | Proficiency assignments (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`) and verified endorsements | `tenantId`, `userId`, `skillId` (unique), `expertiseLevel` |
| `rd_timesheets` | Weekly time submission headers with week boundaries, total hours, and review status | `tenantId`, `userId`, `timesheetCode` (unique), `status` |
| `rd_time_entries` | Granular daily time entries linked to projects, tasks, and lab experiments with calculated cost | `tenantId`, `timesheetId`, `userId`, `projectId`, `taskId` |
| `rd_timesheet_histories` | Immutable audit trail for timesheet state transitions (`CREATED`, `SUBMITTED`, `APPROVED`, `REJECTED`) | `tenantId`, `timesheetId` |
| `rd_facilities` | Physical cleanrooms, testing bays, and wet chemistry laboratories with operating hours | `tenantId`, `facilityCode` (unique), `facilityType` |
| `rd_lab_equipment` | Specialized equipment registry (spectrometers, cyclers, gloveboxes) with hourly usage rate | `tenantId`, `facilityId`, `equipmentCode` (unique), `operationalStatus` |
| `rd_equipment_maintenances` | Preventative maintenance, calibration certificates, and equipment service scheduling | `tenantId`, `equipmentId`, `startDate`, `endDate`, `status` |
| `rd_facility_bookings` | Schedule reservations with strict double-booking overlap conflict prevention | `tenantId`, `bookingCode` (unique), `facilityId`, `equipmentId`, `startDateTime`, `endDateTime` |
| `rd_booking_histories` | Audit log of booking confirmations, modifications, and cancellations | `tenantId`, `bookingId` |

---

### REST API Endpoints Overview

All endpoints are mounted under `/api/rd/resources/*` in `backend/src/routes/rdRoutes.js` and protected by `authenticateToken` and `validateTenantScope`:

- **Overview & KPIs:**
  - `GET /api/rd/resources/overview`
- **Resource Directory & Profiles (Req 51):**
  - `GET /api/rd/resources/profiles`
  - `GET /api/rd/resources/profiles/:id`
  - `PUT /api/rd/resources/profiles/:id`
- **Resource Allocations (Req 51, 53):**
  - `GET /api/rd/resources/allocations`
  - `POST /api/rd/resources/allocations`
  - `PUT /api/rd/resources/allocations/:id`
  - `DELETE /api/rd/resources/allocations/:id`
- **Skill Matrix & Expertise Mapping (Req 52):**
  - `GET /api/rd/resources/skills/matrix`
  - `GET /api/rd/resources/skills/search`
  - `GET /api/rd/resources/skills`
  - `POST /api/rd/resources/skills`
  - `PUT /api/rd/resources/skills/:id`
  - `POST /api/rd/resources/employee-skills`
  - `PUT /api/rd/resources/employee-skills/:id/verify`
  - `DELETE /api/rd/resources/employee-skills/:id`
- **Team Capacity Planning (Req 53):**
  - `GET /api/rd/resources/capacity`
- **Timesheets & Time Tracking (Req 54):**
  - `GET /api/rd/resources/timesheets/weekly`
  - `GET /api/rd/resources/timesheets`
  - `GET /api/rd/resources/timesheets/:id`
  - `POST /api/rd/resources/timesheets/:id/entries`
  - `DELETE /api/rd/resources/time-entries/:entryId`
  - `POST /api/rd/resources/timesheets/:id/submit`
  - `POST /api/rd/resources/timesheets/:id/approve`
  - `POST /api/rd/resources/timesheets/:id/reject`
- **Labor Cost & MP09 Budget Integration (Req 55, 56, 57):**
  - `GET /api/rd/resources/projects/:projectId/labor-costs`
- **Resource Utilization Metrics (Req 58):**
  - `GET /api/rd/resources/utilization`
- **Facilities & Equipment (Req 59):**
  - `GET /api/rd/resources/facilities`
  - `POST /api/rd/resources/facilities`
  - `GET /api/rd/resources/facilities/:id`
  - `PUT /api/rd/resources/facilities/:id`
  - `DELETE /api/rd/resources/facilities/:id`
  - `GET /api/rd/resources/equipment`
  - `POST /api/rd/resources/equipment`
  - `GET /api/rd/resources/equipment/:id`
  - `PUT /api/rd/resources/equipment/:id`
  - `DELETE /api/rd/resources/equipment/:id`
  - `POST /api/rd/resources/equipment/maintenance`
  - `PUT /api/rd/resources/equipment/maintenance/:id/complete`
- **Bookings & Conflict Prevention (Req 59, 60):**
  - `GET /api/rd/resources/bookings`
  - `POST /api/rd/resources/bookings`
  - `GET /api/rd/resources/bookings/:id`
  - `POST /api/rd/resources/bookings/:id/cancel`

---

### Frontend Architecture

The user interface is encapsulated within `frontend/src/pages/rd/RdResourceWorkspace.jsx` and surfaced directly in `frontend/src/pages/rd/EgolyticsHub.jsx` as the primary workspace tab (`/crm/rd/resources`).

Key UI Views:
1. **Overview & KPIs:** Real-time KPI cards for active workforce, capacity utilization %, over-allocated alert badges, and upcoming lab equipment reservations.
2. **Resource Directory:** Searchable table of R&D personnel with department, designation, rate cards, and profile editing modals.
3. **Interactive 2D Skill Matrix:** Grid with researchers as rows and skills as columns, color-coded expertise badges with verified checks, skill coverage summaries, and candidate discovery tools.
4. **Project Allocations:** Allocation slider modal, conflict warnings for assignments exceeding 100%, and multi-project tracking.
5. **Capacity Planning:** Department-level capacity rollups and individual workload progress bars (Optimal, Under-utilized, Over-allocated).
6. **Timesheets & Approvals:** Weekly calendar view, daily entry logging modal, project/task/experiment tags, and manager review modal.
7. **Labor Cost & MP09 Financials:** Project selector showing planned allocation costs vs approved timesheet actual costs, personnel budget comparisons, and variance analytics.
8. **Lab Facilities & Equipment:** Physical lab directories, instrument specifications, calibration due dates, and preventative maintenance logs.
9. **Lab Bookings & Scheduling:** Reservation calendar with automated double-booking rejection and status filters.
