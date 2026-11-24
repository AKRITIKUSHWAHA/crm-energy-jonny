const express = require('express');
const router = express.Router();
const rdController = require('../controllers/rdController');
const rdPortfolioController = require('../controllers/rdPortfolioController');
const rdIntakeController = require('../controllers/rdIntakeController');
const rdStrategyController = require('../controllers/rdStrategyController');
const rdPrioritizationController = require('../controllers/rdPrioritizationController');
const rdIdeaController = require('../controllers/rdIdeaController');
const rdScoringController = require('../controllers/rdScoringController');
const rdGovernanceController = require('../controllers/rdGovernanceController');
const rdTaskController = require('../controllers/rdTaskController');
const { authenticateToken } = require('../middleware/auth');
const { validateTenantScope } = require('../middleware/tenantIsolation');

// All EgoLytics R&D endpoints require verified JWT session and strict tenant scoping
router.use(authenticateToken);
router.use(validateTenantScope);

// ==============================================================================
// MASTER PROMPT 01: FOUNDATION & SYSTEM TELEMETRY
// ==============================================================================
router.get('/status', (req, res, next) => rdController.getStatus(req, res, next));
router.get('/modules', (req, res, next) => rdController.getModules(req, res, next));
router.get('/permissions', (req, res, next) => rdController.getPermissions(req, res, next));
router.post('/verify-tenant', (req, res, next) => rdController.verifyTenantBoundary(req, res, next));

// ==============================================================================
// MASTER PROMPT 02: R&D PROJECT PORTFOLIO MANAGEMENT (REQUIREMENT 1)
// ==============================================================================
router.get('/portfolio', (req, res, next) => rdPortfolioController.getPortfolio(req, res, next));
router.post('/portfolio', (req, res, next) => rdPortfolioController.createProject(req, res, next));
router.get('/portfolio/:id', (req, res, next) => rdPortfolioController.getProjectById(req, res, next));
router.put('/portfolio/:id', (req, res, next) => rdPortfolioController.updateProject(req, res, next));

// ==============================================================================
// MASTER PROMPT 02: PROJECT INTAKE & APPLICATION WORKFLOWS (REQUIREMENT 2)
// ==============================================================================
router.get('/intake', (req, res, next) => rdIntakeController.getProposals(req, res, next));
router.post('/intake', (req, res, next) => rdIntakeController.createProposal(req, res, next));
router.get('/intake/:id', (req, res, next) => rdIntakeController.getProposalById(req, res, next));
router.put('/intake/:id', (req, res, next) => rdIntakeController.updateProposal(req, res, next));
router.post('/intake/:id/submit', (req, res, next) => rdIntakeController.submitProposal(req, res, next));
router.post('/intake/:id/review', (req, res, next) => rdIntakeController.reviewProposal(req, res, next));
router.post('/intake/:id/approve', (req, res, next) => rdIntakeController.approveProposal(req, res, next));
router.post('/intake/:id/reject', (req, res, next) => rdIntakeController.rejectProposal(req, res, next));
router.post('/intake/:id/withdraw', (req, res, next) => rdIntakeController.withdrawProposal(req, res, next));

// ==============================================================================
// MASTER PROMPT 02: STRATEGIC ALIGNMENT TRACKING (REQUIREMENT 5)
// ==============================================================================
router.get('/strategy/goals', (req, res, next) => rdStrategyController.getGoals(req, res, next));
router.post('/strategy/goals', (req, res, next) => rdStrategyController.createGoal(req, res, next));
router.get('/strategy/goals/:id', (req, res, next) => rdStrategyController.getGoalById(req, res, next));
router.put('/strategy/goals/:id', (req, res, next) => rdStrategyController.updateGoal(req, res, next));
router.delete('/strategy/goals/:id', (req, res, next) => rdStrategyController.deleteGoal(req, res, next));
router.post('/strategy/align', (req, res, next) => rdStrategyController.alignProject(req, res, next));
router.delete('/strategy/align/:id', (req, res, next) => rdStrategyController.removeAlignment(req, res, next));
router.get('/strategy/matrix', (req, res, next) => rdStrategyController.getStrategyMatrix(req, res, next));

// ==============================================================================
// MASTER PROMPT 02: PROJECT PRIORITIZATION (REQUIREMENT 6)
// ==============================================================================
router.get('/prioritization', (req, res, next) => rdPrioritizationController.getPrioritizedProjects(req, res, next));
router.put('/prioritization/:id', (req, res, next) => rdPrioritizationController.updatePrioritization(req, res, next));
router.post('/prioritization/recalculate', (req, res, next) => rdPrioritizationController.recalculateAll(req, res, next));

// ==============================================================================
// MASTER PROMPT 03: IDEA MANAGEMENT & INNOVATION SCORING ENGINE (REQS 3, 4, 61, 62)
// ==============================================================================
// Dashboard & Pipeline Funnel
router.get('/ideas/metrics', (req, res, next) => rdIdeaController.getDashboardMetrics(req, res, next));
router.get('/ideas/pipeline', (req, res, next) => rdIdeaController.getPipeline(req, res, next));
router.get('/ideas/leaderboard', (req, res, next) => rdScoringController.getLeaderboard(req, res, next));

// Categories & Tags
router.get('/ideas/categories', (req, res, next) => rdIdeaController.getCategories(req, res, next));
router.post('/ideas/categories', (req, res, next) => rdIdeaController.createCategory(req, res, next));
router.put('/ideas/categories/:id', (req, res, next) => rdIdeaController.updateCategory(req, res, next));
router.delete('/ideas/categories/:id', (req, res, next) => rdIdeaController.deleteCategory(req, res, next));
router.get('/ideas/tags', (req, res, next) => rdIdeaController.getTags(req, res, next));

// Rubrics
router.get('/ideas/rubrics/active', (req, res, next) => rdScoringController.getActiveRubric(req, res, next));
router.get('/ideas/rubrics', (req, res, next) => rdScoringController.getRubrics(req, res, next));
router.post('/ideas/rubrics', (req, res, next) => rdScoringController.configureRubric(req, res, next));

// Core Ideas CRUD & Lifecycle
router.get('/ideas', (req, res, next) => rdIdeaController.getIdeas(req, res, next));
router.post('/ideas', (req, res, next) => rdIdeaController.createIdea(req, res, next));
router.get('/ideas/:id', (req, res, next) => rdIdeaController.getIdeaById(req, res, next));
router.put('/ideas/:id', (req, res, next) => rdIdeaController.updateIdea(req, res, next));
router.patch('/ideas/:id', (req, res, next) => rdIdeaController.updateIdea(req, res, next));
router.post('/ideas/:id/submit', (req, res, next) => rdIdeaController.submitIdea(req, res, next));
router.post('/ideas/:id/status', (req, res, next) => rdIdeaController.updateIdeaStatus(req, res, next));
router.patch('/ideas/:id/status', (req, res, next) => rdIdeaController.updateIdeaStatus(req, res, next));
router.put('/ideas/:id/status', (req, res, next) => rdIdeaController.updateIdeaStatus(req, res, next));

// Voting
router.post('/ideas/:id/vote', (req, res, next) => rdIdeaController.voteIdea(req, res, next));
router.delete('/ideas/:id/vote', (req, res, next) => rdIdeaController.unvoteIdea(req, res, next));

// Comments
router.get('/ideas/:id/comments', (req, res, next) => rdIdeaController.getComments(req, res, next));
router.post('/ideas/:id/comments', (req, res, next) => rdIdeaController.addComment(req, res, next));
router.delete('/ideas/comments/:commentId', (req, res, next) => rdIdeaController.deleteComment(req, res, next));

// Reviewer Assignments
router.get('/ideas/:id/reviewers', (req, res, next) => rdIdeaController.getIdeaReviewers(req, res, next));
router.post('/ideas/:id/reviewers', (req, res, next) => rdIdeaController.assignReviewer(req, res, next));
router.delete('/ideas/:id/reviewers/:reviewerId', (req, res, next) => rdIdeaController.removeReviewer(req, res, next));

// Evaluation Submission
router.get('/ideas/:id/evaluation', (req, res, next) => rdScoringController.getEvaluation(req, res, next));
router.post('/ideas/:id/evaluation', (req, res, next) => rdScoringController.submitEvaluation(req, res, next));

// ==============================================================================
// MASTER PROMPT 04: STAGE-GATE GOVERNANCE & APPROVAL WORKFLOW
// ==============================================================================
// Templates
router.get('/governance/templates', (req, res, next) => rdGovernanceController.getTemplates(req, res, next));
router.post('/governance/templates', (req, res, next) => rdGovernanceController.createTemplate(req, res, next));
router.get('/governance/templates/:id', (req, res, next) => rdGovernanceController.getTemplateById(req, res, next));

// Dashboard & Inbox
router.get('/governance/dashboard', (req, res, next) => rdGovernanceController.getDashboardMetrics(req, res, next));
router.get('/governance/inbox', (req, res, next) => rdGovernanceController.getReviewerInbox(req, res, next));

// Project Governance
router.get('/governance/projects', (req, res, next) => rdGovernanceController.getGovernedProjects(req, res, next));
router.post('/governance/projects/:projectId/initialize', (req, res, next) => rdGovernanceController.initializeProjectGovernance(req, res, next));
router.get('/governance/projects/:projectId', (req, res, next) => rdGovernanceController.getProjectGovernance(req, res, next));
router.post('/governance/projects/:projectId/resume', (req, res, next) => rdGovernanceController.resumeHeldGovernance(req, res, next));

// Gate Reviews & Decision Engine
router.post('/governance/reviews/:reviewId/submit', (req, res, next) => rdGovernanceController.submitGateReview(req, res, next));
router.post('/governance/reviews/:reviewId/reviewers', (req, res, next) => rdGovernanceController.assignReviewers(req, res, next));
router.post('/governance/reviews/:reviewId/sign-off', (req, res, next) => rdGovernanceController.submitSignOff(req, res, next));
router.post('/governance/reviews/:reviewId/evidence', (req, res, next) => rdGovernanceController.uploadEvidence(req, res, next));
router.post('/governance/reviews/:reviewId/decision', (req, res, next) => rdGovernanceController.recordGateDecision(req, res, next));

// ==============================================================================
// MASTER PROMPT 05: ADVANCED TASK, SPRINT & BACKLOG MANAGEMENT
// ==============================================================================

// R&D Tasks & Kanban Lifecycle (Req 11, 12)
router.get('/tasks', (req, res, next) => rdTaskController.getTasks(req, res, next));
router.post('/tasks', (req, res, next) => rdTaskController.createTask(req, res, next));
router.get('/tasks/:id', (req, res, next) => rdTaskController.getTaskById(req, res, next));
router.put('/tasks/:id', (req, res, next) => rdTaskController.updateTask(req, res, next));
router.patch('/tasks/:id/status', (req, res, next) => rdTaskController.updateTaskStatus(req, res, next));
router.delete('/tasks/:id', (req, res, next) => rdTaskController.deleteTask(req, res, next));

// Also mount under /governance/tasks for nested clients
router.get('/governance/tasks', (req, res, next) => rdTaskController.getTasks(req, res, next));
router.post('/governance/tasks', (req, res, next) => rdTaskController.createTask(req, res, next));
router.get('/governance/tasks/:id', (req, res, next) => rdTaskController.getTaskById(req, res, next));
router.put('/governance/tasks/:id', (req, res, next) => rdTaskController.updateTask(req, res, next));
router.patch('/governance/tasks/:id/status', (req, res, next) => rdTaskController.updateTaskStatus(req, res, next));
router.delete('/governance/tasks/:id', (req, res, next) => rdTaskController.deleteTask(req, res, next));

// Sprint Planning & Execution (Req 15)
router.get('/sprints', (req, res, next) => rdTaskController.getSprints(req, res, next));
router.post('/sprints', (req, res, next) => rdTaskController.createSprint(req, res, next));
router.put('/sprints/:id', (req, res, next) => rdTaskController.updateSprint(req, res, next));
router.post('/sprints/:id/start', (req, res, next) => rdTaskController.startSprint(req, res, next));
router.post('/sprints/:id/complete', (req, res, next) => rdTaskController.completeSprint(req, res, next));

router.get('/governance/sprints', (req, res, next) => rdTaskController.getSprints(req, res, next));
router.post('/governance/sprints', (req, res, next) => rdTaskController.createSprint(req, res, next));
router.put('/governance/sprints/:id', (req, res, next) => rdTaskController.updateSprint(req, res, next));
router.post('/governance/sprints/:id/start', (req, res, next) => rdTaskController.startSprint(req, res, next));
router.post('/governance/sprints/:id/complete', (req, res, next) => rdTaskController.completeSprint(req, res, next));

// Backlog Management (Req 16)
router.get('/backlog', (req, res, next) => rdTaskController.getBacklog(req, res, next));
router.post('/backlog/reorder', (req, res, next) => rdTaskController.reorderBacklog(req, res, next));
router.post('/backlog/commit', (req, res, next) => rdTaskController.commitBacklogToSprint(req, res, next));

router.get('/governance/backlog', (req, res, next) => rdTaskController.getBacklog(req, res, next));
router.post('/governance/backlog/reorder', (req, res, next) => rdTaskController.reorderBacklog(req, res, next));
router.post('/governance/backlog/commit', (req, res, next) => rdTaskController.commitBacklogToSprint(req, res, next));

// Task Dependencies & Graph (Req 17)
router.get('/dependencies', (req, res, next) => rdTaskController.getDependencies(req, res, next));
router.post('/dependencies', (req, res, next) => rdTaskController.addDependency(req, res, next));
router.delete('/dependencies/:id', (req, res, next) => rdTaskController.deleteDependency(req, res, next));

router.get('/governance/dependencies', (req, res, next) => rdTaskController.getDependencies(req, res, next));
router.post('/governance/dependencies', (req, res, next) => rdTaskController.addDependency(req, res, next));
router.delete('/governance/dependencies/:id', (req, res, next) => rdTaskController.deleteDependency(req, res, next));

// Critical Path Method (CPM) (Req 18)
router.get('/cpm/:projectId', (req, res, next) => rdTaskController.calculateCPM(req, res, next));
router.get('/governance/cpm/:projectId', (req, res, next) => rdTaskController.calculateCPM(req, res, next));

// Baseline Schedule & Variance (Req 19)
router.post('/schedule/baseline', (req, res, next) => rdTaskController.createBaseline(req, res, next));
router.get('/schedule/variance/:projectId', (req, res, next) => rdTaskController.getScheduleVariance(req, res, next));

router.post('/governance/schedule/baseline', (req, res, next) => rdTaskController.createBaseline(req, res, next));
router.get('/governance/schedule/variance/:projectId', (req, res, next) => rdTaskController.getScheduleVariance(req, res, next));

// Automated Schedule Alerts (Req 20)
router.get('/schedule/alerts', (req, res, next) => rdTaskController.getAlerts(req, res, next));
router.post('/schedule/alerts/scan', (req, res, next) => rdTaskController.scanAlerts(req, res, next));
router.post('/schedule/alerts/:id/resolve', (req, res, next) => rdTaskController.resolveAlert(req, res, next));

router.get('/governance/schedule/alerts', (req, res, next) => rdTaskController.getAlerts(req, res, next));
router.post('/governance/schedule/alerts/scan', (req, res, next) => rdTaskController.scanAlerts(req, res, next));
router.post('/governance/schedule/alerts/:id/resolve', (req, res, next) => rdTaskController.resolveAlert(req, res, next));

module.exports = router;
