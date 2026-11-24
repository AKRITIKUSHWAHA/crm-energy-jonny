# EgoLytics – R&D Management Platform
## Master Prompt 10 of 16: Timesheet and Cost Integration Report

**Focus:** Requirements 54, 55, 56, 57  
**Modules:** Time Tracking, Timesheet Approvals, Resource Cost Rate Cards & MP09 Project Budget Integration  
**Status:** FULLY IMPLEMENTED & MATHEMATICALLY VERIFIED  

---

### 1. Weekly Timesheet Lifecycle & Daily Entries (Requirement 54)

EgoLytics enforces weekly timesheet cycles bound to Monday–Sunday date ranges:

#### State Transition Machine
```
[DRAFT]  ---> (Submit)  --->  [SUBMITTED]  ---> (Approve) ---> [APPROVED]
   ^                                |
   |-------- (Reject Revision) <----|
```

1. **Auto-Initialization (`DRAFT`):** When an employee navigates to timesheets, the system retrieves or creates the user's weekly timesheet with a unique reference code (`TMS-XXXX-XXX`).
2. **Daily Time Entries:** Researchers log granular hours against specific projects, tasks, and lab experiments:
   - `workDate`: Date of scientific activity.
   - `hours`: Decimal duration (e.g. 7.50h).
   - `projectId`: Bound to `erp_projects`.
   - `taskId`: Optional link to Master Prompt 05 `tasks`.
   - `experimentId`: Optional link to Master Prompt 07 `rd_experiments`.
   - `workCategory`: `RESEARCH`, `LAB_EXPERIMENT`, `ANALYSIS`, `DOCUMENTATION`, `MEETING`.
   - `isBillable`: Boolean flag for commercial or internal accounting.
3. **Manager Review (`SUBMITTED`):**
   - Submitting locks the timesheet from further edits by the researcher.
   - An R&D Director or Operations Manager inspects hours, tasks, and project codes.
   - **Approve:** Sets status to `APPROVED`, records `reviewedById`, `reviewedByName`, `reviewedAt`, and approval comments.
   - **Reject:** Sets status to `REJECTED`, records required revision notes, and re-opens the timesheet for correction.
4. **Immutable Audit History:** Every state change generates an append-only entry in `rd_timesheet_histories`.

---

### 2. Resource Rate Cards & Labor Cost Calculations (Requirement 55)

Each researcher profile (`rd_resource_profiles`) defines a specialized hourly rate card based on seniority and functional role:
- Executive R&D Leadership: $150.00 / hr
- Operations & Lab Managers: $110.00 / hr
- Principal Investigators: $95.00 / hr
- Senior Lead Engineers: $90.00 / hr
- Senior Research Scientists: $85.00 / hr
- Research Engineers: $75.00 / hr

#### Dynamic Cost Formula
When a time entry is logged, the backend retrieves the user's active hourly cost rate and stores an immutable calculated cost:

$$\text{Calculated Entry Cost} = \text{Logged Hours} \times \text{Hourly Cost Rate}$$

---

### 3. Financial Integration with Master Prompt 09 (Requirements 56 & 57)

Master Prompt 10 links workforce expenditures directly with the project financial controls established in Master Prompt 09 (`rd_project_budgets` and `rd_budget_allocations` where `category = 'PERSONNEL'`):

#### Actual Labor Expenditure
$$\text{Actual Project Labor Cost} = \sum_{e \in \text{Approved Entries}} e.\text{calculatedCost}$$
$$\text{Actual Approved Hours} = \sum_{e \in \text{Approved Entries}} e.\text{hours}$$

#### Planned Labor Commitment
$$\text{Planned Project Labor Cost} = \sum_{a \in \text{Active Allocations}} (a.\text{expectedWeeklyHours} \times \text{Duration in Weeks} \times a.\text{user.hourlyCostRate})$$

#### Cost Variance & Budget Consumption (Requirement 57)
$$\text{Personnel Budget Variance} = \text{Budgeted Personnel Allocation} - \text{Actual Project Labor Cost}$$
$$\text{Personnel Burn Rate (\%)} = \left(\frac{\text{Actual Project Labor Cost}}{\text{Budgeted Personnel Allocation}}\right) \times 100$$

The endpoint `/api/rd/resources/projects/:projectId/labor-costs` returns these metrics, enabling project managers and finance directors to monitor personnel expenditure in real time.
