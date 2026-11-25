# EGOLYTICS – R&D MANAGEMENT TOOL
# MASTER PROMPT 05: SCHEDULING, DEPENDENCIES & CRITICAL PATH METHOD (CPM) REPORT

**Document ID:** EGOLYTICS-MP05-SCHED-CPM-005  
**Project:** EgoLytics – Research & Development Management Tool  
**Platform Host:** CRM nErgy AI Enterprise Suite  
**Module:** Topological Dependencies & Mathematical CPM Engine (`mod-05-tasks`)  
**Implementation Date:** November 2026  
**Status:** Production Verified  
**Classification:** Enterprise Engineering Report  

---

## 1. EXECUTIVE SUMMARY

This report documents the architectural design, algorithmic implementation, mathematical validation, and verification of:
- **Requirement 13:** Interactive Gantt Chart Engine
- **Requirement 14:** Chronological Timeline Views
- **Requirement 17:** Multi-Type Task Dependencies & Cycle Detection
- **Requirement 18:** Mathematical Critical Path Method (CPM) Engine

The scheduling suite implements a deterministic Directed Acyclic Graph (DAG) network solver capable of computing early dates, late dates, total float, and zero-float critical paths in $O(V + E)$ time complexity.

---

## 2. DATABASE ARCHITECTURE (`rd_task_dependencies`)

Predecessor-successor graph edges are persisted in `rd_task_dependencies`:

```sql
CREATE TABLE IF NOT EXISTS rd_task_dependencies (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  tenantId VARCHAR(191) NOT NULL,
  predecessorId VARCHAR(191) NOT NULL,
  successorId VARCHAR(191) NOT NULL,
  dependencyType VARCHAR(16) NOT NULL DEFAULT 'FS',
  lagDays INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_task_dep (predecessorId, successorId),
  INDEX idx_rd_dep_tenant (tenantId),
  INDEX idx_rd_dep_pred (predecessorId),
  INDEX idx_rd_dep_succ (successorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.1 Dependency Types Supported
1. **FS (Finish-to-Start):** Successor cannot start until Predecessor finishes (standard waterfall link).
2. **SS (Start-to-Start):** Successor cannot start until Predecessor starts.
3. **FF (Finish-to-Finish):** Successor cannot finish until Predecessor finishes.
4. **SF (Start-to-Finish):** Successor cannot finish until Predecessor starts.

---

## 3. GRAPH TOPOLOGY & CYCLE DETECTION

### 3.1 Mathematical Cycle Prevention
Before inserting a directed edge $(u, v)$ where $u = \text{predecessor}$ and $v = \text{successor}$:
1. Verify $u \neq v$ (prevents immediate self-loops).
2. Execute a Depth-First Search (DFS) on the existing directed graph starting at node $v$:
   - If node $u$ is reachable from $v$, a directed path $v \rightsquigarrow u$ exists in the graph.
   - Adding $(u, v)$ would complete the directed cycle $u \rightarrow v \rightsquigarrow u$.
3. The engine throws an exception and halts transaction:
   `"Circular dependency detected: task 'v' already has a path leading to 'u'. Adding this dependency creates a cycle."` (HTTP 400).

```javascript
// DFS Cycle Detection Implementation from rdTaskService.js
const adj = new Map();
for (const edge of allEdges) {
  if (!adj.has(edge.predecessorId)) adj.set(edge.predecessorId, []);
  adj.get(edge.predecessorId).push(edge.successorId);
}

const visited = new Set();
const stack = [successorId];
while (stack.length > 0) {
  const curr = stack.pop();
  if (curr === predecessorId) return true; // Cycle detected!
  if (!visited.has(curr)) {
    visited.add(curr);
    for (const next of adj.get(curr) || []) {
      if (!visited.has(next)) stack.push(next);
    }
  }
}
return false;
```

---

## 4. MATHEMATICAL CRITICAL PATH METHOD (CPM) ALGORITHM

### 4.1 Step 1: Topological Sort (Kahn's Algorithm)
Compute in-degrees for all vertices $v \in V$:
$$\text{inDegree}(v) = |\{ u \mid (u, v) \in E \}|$$
Initialize queue $Q$ with all vertices having $\text{inDegree}(v) = 0$. While $Q$ is non-empty, dequeue vertex $u$, append to topological order $L$, and decrement in-degrees of all successors. If $|L| \neq |V|$, a cycle exists.

### 4.2 Step 2: Forward Pass (Early Dates)
Traverse vertices in topological order $L$:
$$ES_i = \begin{cases} 0 & \text{if } \text{Pred}(i) = \emptyset \\ \max_{p \in \text{Pred}(i)} (EF_p + \text{Lag}_{p, i}) & \text{otherwise} \end{cases}$$
$$EF_i = ES_i + D_i$$
Total Project Duration:
$$T_{\text{project}} = \max_{i \in V} (EF_i)$$

### 4.3 Step 3: Backward Pass (Late Dates)
Traverse vertices in reverse topological order $L^R$:
$$LF_i = \begin{cases} T_{\text{project}} & \text{if } \text{Succ}(i) = \emptyset \\ \min_{s \in \text{Succ}(i)} (LS_s - \text{Lag}_{i, s}) & \text{otherwise} \end{cases}$$
$$LS_i = LF_i - D_i$$

### 4.4 Step 4: Floats & Critical Task Identification
- **Total Float ($TF_i$):**
  $$TF_i = LS_i - ES_i = LF_i - EF_i$$
- **Free Float ($FF_i$):**
  $$FF_i = \min_{s \in \text{Succ}(i)} (ES_s) - EF_i$$
- **Critical Task Criterion:**
  $$\text{isCritical}_i \iff TF_i = 0$$

---

## 5. NUMERICAL BENCHMARK PROOF & VERIFICATION

To verify mathematical precision, the automated test suite executes a 6-task project:

```
          [ B (5d) ] --------> [ D (4d) ]
         /                               \
        /                                 v
[ A (3d) ]                                 [ F (2d) ] (Finish: Day 14)
        \                                 ^
         \                               /
          [ C (2d) ] --------> [ E (3d) ]
```

### Calculated Benchmark Results:
| Task | Duration | ES | EF | LS | LF | Total Float | Critical? |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | 3 | 0 | 3 | 0 | 3 | **0** | **YES** |
| **B** | 5 | 3 | 8 | 3 | 8 | **0** | **YES** |
| **C** | 2 | 3 | 5 | 7 | 9 | 4 | NO |
| **D** | 4 | 8 | 12 | 8 | 12 | **0** | **YES** |
| **E** | 3 | 5 | 8 | 9 | 12 | 4 | NO |
| **F** | 2 | 12 | 14 | 12 | 14 | **0** | **YES** |

- **Project Duration:** Exactly 14 days.
- **Critical Path:** $A \rightarrow B \rightarrow D \rightarrow F$.
- **Automated Verification:** Verified in `backend/test_egolytics_master_05.js` checks AC-16 through AC-24 with $100\%$ numerical match.

---

## 6. GANTT & TIMELINE VISUALIZATION

Surfaced within the **Gantt Schedule** and **Critical Path (CPM)** tabs of `frontend/src/pages/rd/RdTasks.jsx`:
- **Gantt Timeline Bars:** Displays start and due dates, estimated duration, and real-time completion fills.
- **Critical Path Table:** Tabular display of duration, ES, EF, LS, LF, total float, and critical badges.
- **Critical Chain Banner:** Visual sequence showing the bottleneck path of the project.

---
*Certified by Principal Scheduling Algorithm Engineer & Senior Enterprise Architect.*
