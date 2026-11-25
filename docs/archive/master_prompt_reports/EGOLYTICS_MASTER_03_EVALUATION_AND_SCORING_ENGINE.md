# EGOLYTICS MASTER PROMPT 03 — EVALUATION & INNOVATION SCORING ENGINE
**Project:** EgoLytics – R&D Management Tool  
**Division:** CRM nErgy AI  
**Roadmap Phase:** Master Prompt 03 of 16  
**Implementation Focus:** Requirement 4 (Idea Evaluation & Scoring)  
**Date of Execution:** November 2026  
**Author:** Principal Software Architect & Mathematical Modeling Specialist

---

## 1. Executive Summary

This document provides a comprehensive technical and mathematical specification of the **EgoLytics Idea Evaluation and Innovation Scoring Engine**. Implementing **Requirement 4 (Idea Evaluation and Scoring)** from the client specification `EgoLytics - R_D Management Tool.docx`, this engine replaces subjective review with a rigorous, multi-criteria mathematical scoring framework.

Key highlights include:
1. **Configurable Multi-Criteria Rubrics:** Customizable evaluation dimensions with strict weight validation ($\sum w_i = 1.0$) and automated versioning.
2. **Directional Scoring:** Seamless handling of criteria where higher raw values represent desirable outcomes (Feasibility, Market Impact) versus criteria where lower raw values represent desirable outcomes (Technical & Execution Risk).
3. **Multi-Evaluator Composite Score Aggregation:** Systematic synthesis of multiple independent expert evaluations into a single un-biased composite score.
4. **Ranked Leaderboard Engine:** Dynamic ranking of innovation concepts with strict isolation of unevaluated ideas (`isEvaluated: false`, score: `null`), completely separated from crowd voting metrics.

---

## 2. Multi-Criteria Scoring Architecture

### 2.1 Database Entities
The evaluation engine is backed by four interconnected relational models in `crm-db`:

1. **`RdIdeaEvaluationRubric`**: Stores rubric definitions, active status, scale (e.g. `1_TO_5`), and historical version numbers.
2. **`RdIdeaEvaluationCriterion`**: Stores individual criteria, including weight ($0 < w_i \le 1.0$), directionality (`HIGHER_IS_BETTER` vs `LOWER_IS_BETTER`), and sorting order.
3. **`RdIdeaEvaluation`**: Individual evaluator scorecard for a specific idea, storing evaluator ID, rubric version snapshot, weighted score ($0.0 - 100.0$), general feedback, and status (`DRAFT` or `SUBMITTED`).
4. **`RdIdeaEvaluationScore`**: Granular criterion-level breakdown storing raw score, normalized score ($0.0 - 100.0$), criterion weight, weighted contribution, and specific technical feedback.

### 2.2 Standard Tenant Default Rubric
Upon initialization, each tenant is provisioned with the standard R&D Innovation Evaluation Rubric:

| Criterion Name | Category / Focus | Weight ($w_i$) | Scale | Directionality |
| :--- | :--- | :---: | :---: | :---: |
| **Technical Feasibility** | Soundness, engineering viability, internal skills | **35%** ($0.35$) | 1 to 5 | `HIGHER_IS_BETTER` |
| **Market & Strategic Impact** | Commercial potential, customer demand, ROI | **40%** ($0.40$) | 1 to 5 | `HIGHER_IS_BETTER` |
| **Technical & Execution Risk** | Complexity, unproven physics, roadblocks | **25%** ($0.25$) | 1 to 5 | `LOWER_IS_BETTER` |
| **Total Weight** | | **100%** ($1.00$) | | |

---

## 3. Mathematical Normalization & Directional Scoring

### 3.1 Linear Normalization Model
Evaluators assign raw scores on a 1-to-5 integer or decimal scale ($R \in [1, 5]$). Raw scores are converted to a normalized percentage scale ($N \in [0, 100]$) to allow weighted composite calculation.

For standard criteria where **higher values indicate superior outcomes** (`HIGHER_IS_BETTER`):

$$N_{standard}(R) = \left( \frac{R - R_{min}}{R_{max} - R_{min}} \right) \times 100$$

For a 1-to-5 scale ($R_{min} = 1, R_{max} = 5$):

$$N_{standard}(R) = \left( \frac{R - 1}{4} \right) \times 100$$

- $R = 1 \implies N = 0.0$
- $R = 3 \implies N = 50.0$
- $R = 4 \implies N = 75.0$
- $R = 5 \implies N = 100.0$

### 3.2 Directional Inversion for Technical Risk (`LOWER_IS_BETTER`)
In research and development, high technical risk is an undesirable obstacle. A concept with **low risk (Raw = 1 or 2)** should receive a **high evaluation score**, while a concept with **catastrophic risk (Raw = 5)** must be penalized with a **low score**.

The normalization formula for `LOWER_IS_BETTER` inverts the scale:

$$N_{inverted}(R) = 100 - N_{standard}(R) = 100 - \left( \frac{R - R_{min}}{R_{max} - R_{min}} \times 100 \right)$$

For a 1-to-5 scale:

$$N_{risk}(R) = 100 - \left[ \left( \frac{R - 1}{4} \right) \times 100 \right]$$

- $R = 1$ (Negligible Risk) $\implies N = 100 - 0 = 100.0$
- $R = 2$ (Low-Moderate Risk) $\implies N = 100 - 25 = 75.0$
- $R = 3$ (Moderate Risk) $\implies N = 100 - 50 = 50.0$
- $R = 4$ (High Risk) $\implies N = 100 - 75 = 25.0$
- $R = 5$ (Extreme Risk / Unfeasible) $\implies N = 100 - 100 = 0.0$

### 3.3 Individual Evaluator Weighted Score
An evaluator's total scorecard score $S_k$ is the sum of weighted normalized contributions:

$$S_k = \sum_{i=1}^{m} \left( N_i \times w_i \right)$$

where $\sum_{i=1}^{m} w_i = 1.0$.

#### Numerical Proof (Evaluator 1 Test Case TC-12)
Given the following raw inputs from Evaluator 1:
- Technical Feasibility ($w_1 = 0.35$, `HIGHER_IS_BETTER`): Raw $R_1 = 4$
  $$N_1 = \left(\frac{4 - 1}{4}\right) \times 100 = 75.0 \implies \text{Contribution}_1 = 75.0 \times 0.35 = 26.25$$
- Market Impact ($w_2 = 0.40$, `HIGHER_IS_BETTER`): Raw $R_2 = 5$
  $$N_2 = \left(\frac{5 - 1}{4}\right) \times 100 = 100.0 \implies \text{Contribution}_2 = 100.0 \times 0.40 = 40.00$$
- Technical Risk ($w_3 = 0.25$, `LOWER_IS_BETTER`): Raw $R_3 = 2$ (Low Risk)
  $$N_3 = 100 - \left(\frac{2 - 1}{4}\right) \times 100 = 100 - 25.0 = 75.0 \implies \text{Contribution}_3 = 75.0 \times 0.25 = 18.75$$

**Evaluator 1 Total Score ($S_1$):**
$$S_1 = 26.25 + 40.00 + 18.75 = \mathbf{85.00} \text{ points}$$

---

## 4. Multi-Evaluator Composite Score Aggregation

When multiple designated reviewers evaluate the same research idea, EgoLytics aggregates individual scorecards into an un-biased composite score $C_{idea}$ using the arithmetic mean:

$$C_{idea} = \frac{1}{K} \sum_{k=1}^{K} S_k$$

where $K$ is the number of submitted evaluator scorecards ($status = \text{'SUBMITTED'}$).

#### Numerical Verification (Multi-Evaluator Test Case TC-13)
Assume Evaluator 2 submits a second scorecard for the same idea:
- Feasibility: Raw $R = 3 \implies N = 50.0 \times 0.35 = 17.50$
- Market Impact: Raw $R = 4 \implies N = 75.0 \times 0.40 = 30.00$
- Technical Risk: Raw $R = 1$ (Zero Risk) $\implies N = 100.0 \times 0.25 = 25.00$
- **Evaluator 2 Total Score ($S_2$):**
  $$S_2 = 17.50 + 30.00 + 25.00 = 72.50 \text{ points}$$

**Composite Score ($C_{idea}$):**
$$C_{idea} = \frac{S_1 + S_2}{2} = \frac{85.00 + 72.50}{2} = \mathbf{78.75} \text{ points}$$

The database atomically updates:
- `RdIdea.compositeScore = 78.75`
- `RdIdea.evaluationCount = 2`
- `RdIdeaReviewer.status = 'COMPLETED'` for both reviewers.

---

## 5. Rubric Configuration & Immutability Versioning

To preserve historical scientific integrity, modifications to evaluation criteria must never alter or invalidate completed past evaluations.

### 5.1 Strict Weight Validation Rule
When configuring a rubric via `POST /api/rd/ideas/rubrics`:
1. Every criterion must have $w_i > 0$.
2. The total sum of weights must strictly equal $1.0$ (with a $0.005$ floating-point tolerance):
   $$| \sum w_i - 1.0 | \le 0.005$$
3. Payloads violating this condition are immediately rejected with `400 Bad Request`.

### 5.2 Transactional Immutability Versioning
When an active rubric is modified:
1. The transaction deactivates the existing rubric (`isActive: false`).
2. A new rubric record is inserted with `version: currentActive.version + 1` and `isActive: true`.
3. Pre-existing `RdIdeaEvaluation` records retain their pointer to the exact `rubricId` and `rubricVersion` under which they were scored. Historical evaluations remain mathematically immutable.

---

## 6. Ranked Leaderboard Architecture

The Leaderboard (`GET /api/rd/ideas/leaderboard` & `frontend/src/pages/rd/RdIdeaRanking.jsx`) ranks innovation concepts to facilitate evidence-driven incubation decisions.

### 6.1 Ranking Rules & Partitioning
1. **Partitioning Evaluated vs. Unevaluated Ideas:**
   - Evaluated concepts ($compositeScore \neq null$) are sorted descending by $compositeScore$.
   - Unevaluated concepts ($compositeScore = null$) are partitioned to the bottom of the board and explicitly flagged with `isEvaluated: false` and `compositeScore: null`. They are **never** assigned a synthetic zero score.
2. **Deterministic Tie-Breaking:**
   - Primary: `compositeScore DESC`
   - Secondary: `createdAt ASC` (earlier submission prioritized)
   - Tertiary: `referenceNumber ASC`
3. **Rank Numbering:**
   - Numerical ranks ($1, 2, 3, \dots$) are strictly assigned to evaluated ideas. Unevaluated ideas display a dash (`—`) indicating pending review.

### 6.2 Decoupling from Community Voting
Crowd upvotes (`voteCount`) measure engagement and popular interest. They are displayed as an independent column on the leaderboard but are strictly excluded from the mathematical composite score formula. This guarantees that technical rigor is never compromised by popularity campaigns.
