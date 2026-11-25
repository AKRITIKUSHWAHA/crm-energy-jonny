# EgoLytics – R&D Management Platform
## Master Prompt 10 of 16: Skill Matrix and Capacity Planning Report

**Focus:** Requirements 52 & 53  
**Modules:** Employee Skill Matrix, Expertise Mapping, Team Capacity Planning & Workload Distribution  
**Status:** FULLY IMPLEMENTED & MATHEMATICALLY VERIFIED  

---

### 1. Skill Taxonomy & Competency Architecture (Requirement 52)

EgoLytics classifies enterprise R&D technical competencies into five core operational domains:
- `SCIENTIFIC_RESEARCH`: Electrochemical impedance, solid-state electrolytes, materials synthesis, organic chemistry.
- `ENGINEERING`: Firmware C/RTOS, finite element thermal simulation, SolidWorks packaging, power electronics.
- `LAB_TECHNIQUE`: Mass spectrometry, HPLC, glovebox operation, glovebox argon maintenance, battery cycler calibration.
- `DATA_SCIENCE`: Python scientific modeling, regression algorithms, experimental curve fitting.
- `REGULATORY`: ISO 17025 standard operating procedures, Good Laboratory Practice (GLP), CE/UL compliance.

#### Expertise Level Spectrum
Each employee competency assignment (`rd_employee_skills`) carries an explicit expertise rating:
- **BEGINNER (Level 1):** Foundational knowledge; requires direct supervision.
- **INTERMEDIATE (Level 2):** Autonomous execution of standard experimental protocols.
- **ADVANCED (Level 3):** Deep subject matter expertise; capability to develop new protocols and diagnose anomalies.
- **EXPERT (Level 4):** Industry-recognized technical authority; designs new experimental architectures.

#### Skill Verification Workflow
Skill endorsements require formal verification (`isVerified: true`). The system captures:
- `verifiedById`: User ID of approving technical authority or Lab Manager.
- `verifiedByName`: Full name and title of the evaluator.
- `verifiedAt`: ISO timestamp of verification.
- `certifications`: Textual or credential references (e.g. "ISO 17025 Certified Calorimetry Operator").

---

### 2. Interactive 2D Skill Matrix (Requirement 52)

The 2D Skill Matrix organizes all active personnel along the Y-axis and active technical skills along the X-axis:

$$\text{Matrix Cell}(i, j) = \text{Proficiency of Employee } i \text{ in Skill } j$$

Each cell visualizes:
1. Level badge (`EXPERT`, `ADVANCED`, `INTERMEDIATE`, `BEGINNER`)
2. Verification indicator (`✓`)
3. Quick-action endorsement button for technical managers.

#### Skill Coverage Analytics
The matrix automatically computes aggregate workforce competency coverage:
- Total qualified headcount per skill.
- Distribution count of Experts, Advanced, Intermediate, and Beginners.
- Identifies critical single-point-of-failure skills across R&D programs.

#### Skill-Based Candidate Discovery
The `/api/rd/resources/skills/search` endpoint allows project managers to query researchers matching:
- A set of required `skillIds`.
- A minimum threshold expertise level (e.g., `minLevel = 'ADVANCED'`).
- Availability constraint (e.g., `maxAllocationPct = 80`).

---

### 3. Team Capacity Planning & Workload Distribution (Requirement 53)

Capacity calculations are anchored on standard working hours:

#### Capacity Formulas
$$\text{Standard Weekly Hours} = 40.00 \text{ hrs/week/employee}$$
$$\text{Expected Weekly Workload} = \text{Standard Weekly Hours} \times \left(\frac{\text{Allocation Percentage}}{100}\right)$$
$$\text{Allocated Weekly Hours} = \sum_{a \in \text{Active Allocations}} a.\text{expectedWeeklyHours}$$
$$\text{Remaining Available Capacity} = \max(0, \text{Standard Weekly Hours} - \text{Allocated Weekly Hours})$$
$$\text{Workforce Utilization Rate (\%)} = \left(\frac{\text{Allocated Weekly Hours}}{\text{Standard Weekly Hours}}\right) \times 100$$

#### Workload Status Categorization
The system flags individual and department capacity into three distinct operational states:
- **UNDER_UTILIZED ($< 70\%$):** Available for additional project assignments.
- **OPTIMAL ($70\% - 100\%$):** Balanced productivity and baseline operational focus.
- **OVER_ALLOCATED ($> 100\%$):** Severe overload risk; flags automated warnings to resource managers.

#### Department Rollups
Aggregates metrics by functional department (`Scientific Research`, `Materials & Electrochemistry`, `Software & Embedded Systems`, `Laboratory Operations`, `Executive Leadership`):
- Department Headcount
- Total Standard Weekly Capacity (e.g., $14 \times 40 = 560\text{h}$)
- Total Allocated Workload
- Department Remaining Capacity
- Over-allocated Employee Count
