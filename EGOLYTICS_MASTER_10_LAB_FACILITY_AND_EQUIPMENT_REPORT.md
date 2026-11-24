# EgoLytics – R&D Management Platform
## Master Prompt 10 of 16: Lab Facility and Equipment Management Report

**Focus:** Requirements 59 & 60  
**Modules:** Shared Laboratory Facilities, Scientific Equipment Registry, Maintenance Schedules, Booking & Overlap Conflict Prevention  
**Status:** FULLY IMPLEMENTED & MATHEMATICALLY VERIFIED  

---

### 1. Shared Laboratory Facilities Registry (Requirement 59)

EgoLytics manages physical laboratory rooms and shared specialized working bays (`rd_facilities`):
- **Facility Types:** `CHEMISTRY_LAB`, `CLEANROOM`, `TESTING_FACILITY`, `PROTOTYPING_SHOP`, `COMPUTATIONAL_CLUSTER`.
- **Location Hierarchy:** Campus, Building, Floor, Room Number.
- **Capacity Controls:** Max simultaneous occupancy limit (e.g. 10 or 12 persons).
- **Operating Hours:** Earliest opening time (e.g. `08:00`) and latest closing time (e.g. `20:00` or `22:00`).
- **Availability Status:** `AVAILABLE`, `MAINTENANCE`, `RESTRICTED`.

---

### 2. Scientific Equipment & Instrument Registry (Requirement 59)

High-value R&D instrumentation (`rd_lab_equipment`) is hosted within designated facilities:
- **Equipment Types:** High-Performance Liquid Chromatographs (HPLC), Argon Atmosphere Gloveboxes, Multi-Channel Battery Cyclers, Scanning Electron Microscopes (SEM), High-Temperature Dilatometers.
- **Asset Metadata:** Manufacturer, Model Number, Serial Number, Facility Location.
- **Cost Tracking:** Hourly equipment usage rate card (e.g., $35.00/hr, $50.00/hr) for project billing.
- **Operational Status:**
  - `AVAILABLE`: Ready for operational experiment runs.
  - `IN_USE`: Currently reserved or running active experiments.
  - `UNDER_MAINTENANCE`: Offline for scheduled servicing.
  - `CALIBRATION_DUE`: Quality warning; requires calibration inspection before next run.
  - `OUT_OF_SERVICE`: Hardware fault; bookings strictly blocked.

#### Preventative Maintenance & Metrology Calibration
The table `rd_equipment_maintenances` tracks service lifecycles:
1. **Schedule Service:** Defines maintenance type (`PREVENTATIVE`, `CALIBRATION`, `CORRECTIVE`), date range, and technician. If the maintenance window begins immediately, the instrument's operational status transitions automatically to `UNDER_MAINTENANCE`.
2. **Complete & Certify:** Upon service completion, the technician logs `completedAt`, records the official `calibrationCertificateNumber` (e.g. `CERT-ISO-990182`), and the backend restores the instrument to `AVAILABLE`, resetting calibration due dates forward by 6 months.

---

### 3. Scheduling & Strict Conflict Prevention Engine (Requirement 60)

The reservation engine (`rd_facility_bookings`) enforces dual-layer validation before confirming any reservation:

#### Gating Rule 1: Operational Status Gate
When booking equipment, the system queries the current operational status:
$$\text{If } \text{operationalStatus} \in \{\text{'OUT\_OF\_SERVICE'}, \text{'UNDER\_MAINTENANCE'}\}$$
The booking is immediately rejected with HTTP 400 Bad Request:
> "Booking rejected: Equipment is currently unavailable (Status: UNDER_MAINTENANCE)."

#### Gating Rule 2: Strict Overlap Conflict Prevention
When reserving either a facility or equipment, the engine queries all existing active bookings (`status IN ['CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS']`) where:

$$\text{Requested Start DateTime} < \text{Existing Booking End DateTime} \quad \text{AND} \quad \text{Requested End DateTime} > \text{Existing Booking Start DateTime}$$

If any existing reservation satisfies this condition, the system strictly rejects the request with **HTTP 409 Conflict**:
> "Scheduling Conflict: Resource is already booked from 09:00:00 to 12:00:00 for project 'High-Temperature Solid-State Polymer Interface Research' by Dr. Elena Vance (Booking Code: BK-XXXX)."

This guarantees zero double-booking across all laboratory rooms and instruments.
