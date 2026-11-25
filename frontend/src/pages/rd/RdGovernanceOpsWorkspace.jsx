import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitPullRequest,
  CheckSquare,
  FileCheck,
  ListTree,
  DollarSign,
  TrendingUp,
  PieChart,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronRight,
  ChevronDown,
  Calendar,
  User,
  ArrowUpRight,
  Folder,
  Layers,
  Lock,
  Edit3,
  Trash2,
  HelpCircle,
  MessageSquare,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Input,
  KPICard
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdGovernanceOpsWorkspace = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview | decisions | risks | issues | changes | requirements | scope_wbs | deliverables | quality | budgets
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Overview / Dashboard KPIs
  const [overviewKpis, setOverviewKpis] = useState(null);

  // 1. Decisions State
  const [decisions, setDecisions] = useState([]);
  const [decisionSearch, setDecisionSearch] = useState('');
  const [decisionCategoryFilter, setDecisionCategoryFilter] = useState('ALL');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    title: '',
    category: 'ARCHITECTURE',
    rationale: '',
    alternativesConsidered: '',
    tradeOffs: '',
    impactSummary: '',
    status: 'PROPOSED',
  });

  // 2. Risks & 5x5 Matrix State
  const [risks, setRisks] = useState([]);
  const [riskMatrix, setRiskMatrix] = useState(null);
  const [riskViewMode, setRiskViewMode] = useState('table'); // table | matrix
  const [selectedRiskCell, setSelectedRiskCell] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [riskForm, setRiskForm] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL',
    probability: 3,
    impact: 3,
    strategy: 'MITIGATE',
    contingencyPlan: '',
    triggerCondition: '',
    reviewFrequency: 'MONTHLY',
  });
  const [showMitigationModal, setShowMitigationModal] = useState(false);
  const [mitigationForm, setMitigationForm] = useState({
    actionTitle: '',
    actionDescription: '',
    ownerName: '',
    status: 'PLANNED',
    progressPercent: 0,
    effectiveness: 'HIGH',
  });

  // 3. Issues State
  const [issues, setIssues] = useState([]);
  const [issueSearch, setIssueSearch] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    rootCause: '',
    status: 'OPEN',
  });
  const [newCommentText, setNewCommentText] = useState('');

  // 4. Change Requests State
  const [changeRequests, setChangeRequests] = useState([]);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeForm, setChangeForm] = useState({
    title: '',
    reasonForChange: '',
    changeType: 'SCOPE',
    scopeImpact: '',
    scheduleImpactDays: 0,
    costImpactAmount: 0,
    riskImpact: '',
    priority: 'MEDIUM',
  });

  // 5. Requirements State
  const [requirements, setRequirements] = useState([]);
  const [reqViewMode, setReqViewMode] = useState('list'); // list | traceability
  const [traceabilityMatrix, setTraceabilityMatrix] = useState([]);
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    title: '',
    description: '',
    category: 'FUNCTIONAL',
    priority: 'HIGH',
    verificationMethod: 'TEST',
    complianceStatus: 'NON_COMPLIANT',
  });
  const [newCriterionText, setNewCriterionText] = useState('');

  // 6. Scope & WBS State
  const [scopeBaselines, setScopeBaselines] = useState([]);
  const [wbsTree, setWbsTree] = useState([]);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [baselineForm, setBaselineForm] = useState({
    title: '',
    baselineVersion: '1.0',
    inScopeSummary: '',
    outOfScopeSummary: '',
    assumptions: '',
    constraints: '',
  });
  const [showWbsModal, setShowWbsModal] = useState(false);
  const [wbsForm, setWbsForm] = useState({
    parentItemId: '',
    wbsCode: '',
    title: '',
    description: '',
    itemType: 'WORK_PACKAGE',
    completionPercent: 0,
  });

  // 7. Deliverables State
  const [deliverables, setDeliverables] = useState([]);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL_REPORT',
    dueDate: '',
    acceptanceCriteria: '',
  });

  // 8. Quality Checkpoints State
  const [qualityCheckpoints, setQualityCheckpoints] = useState([]);
  const [showQcModal, setShowQcModal] = useState(false);
  const [qcForm, setQcForm] = useState({
    title: '',
    description: '',
    checkpointType: 'STAGE_GATE',
    plannedDate: '',
  });

  // 9. Budgets State
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    fiscalYear: new Date().getFullYear(),
    currency: 'USD',
    totalAllocated: 100000,
    contingencyPercentage: 10,
  });
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    category: 'PERSONNEL',
    subcategory: '',
    plannedAmount: 0,
    notes: '',
  });
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    newTotal: '',
    reason: '',
  });

  // Fetch Projects List
  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/portfolio/projects');
      const list = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.projects || []);
      if (list.length > 0) {
        setProjects(list);
        if (!selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch R&D projects:', err.message);
    }
  }, [selectedProjectId]);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId
        ? `/rd/governance-ops/overview?projectId=${selectedProjectId}`
        : '/rd/governance-ops/overview';
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setOverviewKpis(res.data.data?.kpis);
      }
    } catch (err) {
      console.warn('Failed to load overview:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Decisions
  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/rd/governance-ops/decisions';
      const params = [];
      if (selectedProjectId) params.push(`projectId=${selectedProjectId}`);
      if (decisionCategoryFilter !== 'ALL') params.push(`category=${decisionCategoryFilter}`);
      if (decisionSearch) params.push(`search=${encodeURIComponent(decisionSearch)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await apiClient.get(url);
      if (res.data?.success) {
        setDecisions(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load decisions:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, decisionCategoryFilter, decisionSearch]);

  // Fetch Risks & Matrix
  const fetchRisks = useCallback(async () => {
    try {
      setLoading(true);
      const [risksRes, matrixRes] = await Promise.all([
        apiClient.get(selectedProjectId ? `/rd/governance-ops/risks?projectId=${selectedProjectId}` : '/rd/governance-ops/risks'),
        apiClient.get(selectedProjectId ? `/rd/governance-ops/risks/matrix?projectId=${selectedProjectId}` : '/rd/governance-ops/risks/matrix'),
      ]);
      if (risksRes.data?.success) setRisks(risksRes.data.data || []);
      if (matrixRes.data?.success) setRiskMatrix(matrixRes.data.data || null);
    } catch (err) {
      console.warn('Failed to load risks:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Issues
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId ? `/rd/governance-ops/issues?projectId=${selectedProjectId}` : '/rd/governance-ops/issues';
      const res = await apiClient.get(url);
      if (res.data?.success) setIssues(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load issues:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Change Requests
  const fetchChangeRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId ? `/rd/governance-ops/change-requests?projectId=${selectedProjectId}` : '/rd/governance-ops/change-requests';
      const res = await apiClient.get(url);
      if (res.data?.success) setChangeRequests(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load changes:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Requirements & Traceability
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, traceRes] = await Promise.all([
        apiClient.get(selectedProjectId ? `/rd/governance-ops/requirements?projectId=${selectedProjectId}` : '/rd/governance-ops/requirements'),
        apiClient.get(selectedProjectId ? `/rd/governance-ops/requirements/traceability?projectId=${selectedProjectId}` : '/rd/governance-ops/requirements/traceability'),
      ]);
      if (reqRes.data?.success) setRequirements(reqRes.data.data || []);
      if (traceRes.data?.success) setTraceabilityMatrix(traceRes.data.data || []);
    } catch (err) {
      console.warn('Failed to load requirements:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Scope & WBS
  const fetchScopeWbs = useCallback(async () => {
    try {
      setLoading(true);
      const [baseRes, wbsRes] = await Promise.all([
        apiClient.get(selectedProjectId ? `/rd/governance-ops/scope/baselines?projectId=${selectedProjectId}` : '/rd/governance-ops/scope/baselines'),
        apiClient.get(selectedProjectId ? `/rd/governance-ops/scope/wbs?projectId=${selectedProjectId}` : '/rd/governance-ops/scope/wbs'),
      ]);
      if (baseRes.data?.success) setScopeBaselines(baseRes.data.data || []);
      if (wbsRes.data?.success) setWbsTree(wbsRes.data.data?.tree || []);
    } catch (err) {
      console.warn('Failed to load scope/WBS:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Deliverables
  const fetchDeliverables = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId ? `/rd/governance-ops/deliverables?projectId=${selectedProjectId}` : '/rd/governance-ops/deliverables';
      const res = await apiClient.get(url);
      if (res.data?.success) setDeliverables(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load deliverables:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Quality Checkpoints
  const fetchQuality = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId ? `/rd/governance-ops/quality-checkpoints?projectId=${selectedProjectId}` : '/rd/governance-ops/quality-checkpoints';
      const res = await apiClient.get(url);
      if (res.data?.success) setQualityCheckpoints(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load quality checkpoints:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch Budgets
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId ? `/rd/governance-ops/budgets?projectId=${selectedProjectId}` : '/rd/governance-ops/budgets';
      const res = await apiClient.get(url);
      if (res.data?.success) {
        const list = res.data.data || [];
        setBudgets(list);
        if (list.length > 0 && !selectedBudget) {
          setSelectedBudget(list[0]);
          fetchBudgetSummary(list[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load budgets:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedBudget]);

  const fetchBudgetSummary = async (budgetId) => {
    try {
      const res = await apiClient.get(`/rd/governance-ops/budgets/${budgetId}/summary`);
      if (res.data?.success) {
        setBudgetSummary(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load budget summary:', err.message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    else if (activeTab === 'decisions') fetchDecisions();
    else if (activeTab === 'risks') fetchRisks();
    else if (activeTab === 'issues') fetchIssues();
    else if (activeTab === 'changes') fetchChangeRequests();
    else if (activeTab === 'requirements') fetchRequirements();
    else if (activeTab === 'scope_wbs') fetchScopeWbs();
    else if (activeTab === 'deliverables') fetchDeliverables();
    else if (activeTab === 'quality') fetchQuality();
    else if (activeTab === 'budgets') fetchBudgets();
  }, [
    activeTab,
    selectedProjectId,
    fetchOverview,
    fetchDecisions,
    fetchRisks,
    fetchIssues,
    fetchChangeRequests,
    fetchRequirements,
    fetchScopeWbs,
    fetchDeliverables,
    fetchQuality,
    fetchBudgets,
  ]);

  // Handlers for Decisions
  const handleCreateDecision = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/decisions', {
        ...decisionForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Decision Logged', message: `Decision ${res.data.data.decisionCode} recorded.`, type: 'success' });
        setShowDecisionModal(false);
        setDecisionForm({
          title: '',
          category: 'ARCHITECTURE',
          rationale: '',
          alternativesConsidered: '',
          tradeOffs: '',
          impactSummary: '',
          status: 'PROPOSED',
        });
        fetchDecisions();
      }
    } catch (err) {
      addToast({ title: 'Failed to create decision', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleUpdateDecisionStatus = async (decisionId, status) => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/decisions/${decisionId}/status`, {
        status,
        comment: `Decision transitioned to ${status}`,
      });
      if (res.data?.success) {
        addToast({ title: 'Status Updated', message: `Decision marked as ${status}.`, type: 'success' });
        fetchDecisions();
      }
    } catch (err) {
      addToast({ title: 'Failed to update status', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Risks
  const handleCreateRisk = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/risks', {
        ...riskForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Risk Registered', message: `Risk ${res.data.data.riskCode} assessed at level ${res.data.data.riskLevel}.`, type: 'success' });
        setShowRiskModal(false);
        fetchRisks();
      }
    } catch (err) {
      addToast({ title: 'Failed to create risk', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleAddMitigation = async (e) => {
    e.preventDefault();
    try {
      if (!selectedRisk) return;
      const res = await apiClient.post(`/rd/governance-ops/risks/${selectedRisk.id}/mitigations`, mitigationForm);
      if (res.data?.success) {
        addToast({ title: 'Mitigation Added', message: 'Risk action plan recorded.', type: 'success' });
        setShowMitigationModal(false);
        fetchRisks();
      }
    } catch (err) {
      addToast({ title: 'Failed to add mitigation', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Issues
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/issues', {
        ...issueForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Issue Registered', message: `Issue ${res.data.data.issueCode} logged.`, type: 'success' });
        setShowIssueModal(false);
        fetchIssues();
      }
    } catch (err) {
      addToast({ title: 'Failed to create issue', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleUpdateIssueStatus = async (issueId, status, resolution = '') => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/issues/${issueId}/status`, {
        status,
        resolution,
      });
      if (res.data?.success) {
        addToast({ title: 'Status Updated', message: `Issue marked as ${status}.`, type: 'success' });
        fetchIssues();
      }
    } catch (err) {
      addToast({ title: 'Failed to update issue', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Changes
  const handleCreateChange = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/change-requests', {
        ...changeForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Change Request Submitted', message: `CR ${res.data.data.changeCode} queued for review.`, type: 'success' });
        setShowChangeModal(false);
        fetchChangeRequests();
      }
    } catch (err) {
      addToast({ title: 'Failed to submit change', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleReviewChange = async (crId, decision) => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/change-requests/${crId}/review`, {
        decision,
        comments: `Formal review decision: ${decision}`,
      });
      if (res.data?.success) {
        addToast({ title: 'CR Reviewed', message: `Change request marked as ${decision}.`, type: 'success' });
        fetchChangeRequests();
      }
    } catch (err) {
      addToast({ title: 'Review Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Requirements
  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/requirements', {
        ...reqForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Requirement Added', message: `Requirement ${res.data.data.reqCode} logged.`, type: 'success' });
        setShowReqModal(false);
        fetchRequirements();
      }
    } catch (err) {
      addToast({ title: 'Failed to create requirement', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleVerifyCriterion = async (criterionId, isMet) => {
    try {
      const res = await apiClient.put(`/rd/governance-ops/criteria/${criterionId}/verify`, {
        isMet,
      });
      if (res.data?.success) {
        addToast({ title: 'Criterion Updated', message: isMet ? 'Criterion marked as PASSED' : 'Criterion marked as UNMET', type: 'info' });
        fetchRequirements();
      }
    } catch (err) {
      addToast({ title: 'Verification Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Scope & WBS
  const handleCreateWbsItem = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/scope/wbs', {
        ...wbsForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'WBS Item Added', message: `WBS node ${res.data.data.wbsCode} created.`, type: 'success' });
        setShowWbsModal(false);
        fetchScopeWbs();
      }
    } catch (err) {
      addToast({ title: 'Failed to create WBS item', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Deliverables
  const handleCreateDeliverable = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/deliverables', {
        ...deliverableForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Deliverable Registered', message: `Deliverable ${res.data.data.deliverableCode} logged.`, type: 'success' });
        setShowDeliverableModal(false);
        fetchDeliverables();
      }
    } catch (err) {
      addToast({ title: 'Failed to create deliverable', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleReviewDeliverable = async (delId, decision) => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/deliverables/${delId}/review`, {
        decision,
        notes: `Review acceptance: ${decision}`,
      });
      if (res.data?.success) {
        addToast({ title: 'Deliverable Reviewed', message: `Deliverable ${decision}.`, type: 'success' });
        fetchDeliverables();
      }
    } catch (err) {
      addToast({ title: 'Review Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Quality Checkpoints
  const handleCreateQc = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/quality-checkpoints', {
        ...qcForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Quality Checkpoint Set', message: `Inspection ${res.data.data.checkpointCode} planned.`, type: 'success' });
        setShowQcModal(false);
        fetchQuality();
      }
    } catch (err) {
      addToast({ title: 'Failed to create QC', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleConductQc = async (qcId, overallResult) => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/quality-checkpoints/${qcId}/conduct`, {
        overallResult,
        summaryFindings: `Inspection result evaluated as ${overallResult}.`,
        spawnIssueIfFail: true,
      });
      if (res.data?.success) {
        addToast({
          title: 'Inspection Conducted',
          message: overallResult === 'FAIL' ? 'Quality checkpoint failed. Automated issue logged.' : `Audit passed (${overallResult}).`,
          type: overallResult === 'FAIL' ? 'warning' : 'success',
        });
        fetchQuality();
      }
    } catch (err) {
      addToast({ title: 'Conduct Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Handlers for Budgets
  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      if (!selectedProjectId) {
        addToast({ title: 'Validation Error', message: 'Please select a project first.', type: 'warning' });
        return;
      }
      const res = await apiClient.post('/rd/governance-ops/budgets', {
        ...budgetForm,
        projectId: selectedProjectId,
      });
      if (res.data?.success) {
        addToast({ title: 'Budget Setup', message: `FY${budgetForm.fiscalYear} budget allocated.`, type: 'success' });
        setShowBudgetModal(false);
        fetchBudgets();
      }
    } catch (err) {
      addToast({ title: 'Failed to setup budget', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleApproveBudget = async (budgetId) => {
    try {
      const res = await apiClient.post(`/rd/governance-ops/budgets/${budgetId}/approve`, {
        approvalNotes: 'Formally approved project budget',
      });
      if (res.data?.success) {
        addToast({ title: 'Budget Approved', message: 'Project budget approved by authorized authority.', type: 'success' });
        fetchBudgets();
      }
    } catch (err) {
      addToast({ title: 'Approval Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleAddAllocation = async (e) => {
    e.preventDefault();
    try {
      if (!selectedBudget) return;
      const res = await apiClient.post(`/rd/governance-ops/budgets/${selectedBudget.id}/allocations`, allocationForm);
      if (res.data?.success) {
        addToast({ title: 'Allocation Added', message: `Category ${allocationForm.category} allocated.`, type: 'success' });
        setShowAllocationModal(false);
        fetchBudgets();
        fetchBudgetSummary(selectedBudget.id);
      }
    } catch (err) {
      addToast({ title: 'Allocation Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    try {
      if (!selectedBudget) return;
      const res = await apiClient.post(`/rd/governance-ops/budgets/${selectedBudget.id}/revisions`, revisionForm);
      if (res.data?.success) {
        addToast({ title: 'Revision Requested', message: 'Budget revision submitted for executive sign-off.', type: 'success' });
        setShowRevisionModal(false);
        fetchBudgets();
        fetchBudgetSummary(selectedBudget.id);
      }
    } catch (err) {
      addToast({ title: 'Revision Failed', message: err.response?.data?.message || err.message, type: 'error' });
    }
  };

  // Helper badge color
  const getRiskLevelBadge = (level) => {
    switch (level) {
      case 'CRITICAL': return <Badge variant="danger" className="bg-red-500/20 text-red-500 border border-red-500/30">CRITICAL</Badge>;
      case 'HIGH': return <Badge variant="warning" className="bg-amber-500/20 text-amber-500 border border-amber-500/30">HIGH</Badge>;
      case 'MODERATE': return <Badge variant="info" className="bg-blue-500/20 text-blue-500 border border-blue-500/30">MODERATE</Badge>;
      default: return <Badge variant="success" className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">LOW</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'PASSED':
      case 'ACCEPTED':
      case 'COMPLETED':
      case 'RESOLVED':
        return <Badge variant="success" className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">{status}</Badge>;
      case 'REJECTED':
      case 'FAILED':
      case 'BLOCKER':
        return <Badge variant="danger" className="bg-red-500/20 text-red-500 border border-red-500/30">{status}</Badge>;
      case 'UNDER_REVIEW':
      case 'IN_PROGRESS':
      case 'SUBMITTED':
      case 'VERIFICATION_IN_PROGRESS':
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-500 border border-amber-500/30">{status}</Badge>;
      default:
        return <Badge variant="neutral" className="bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Project Scope Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Decision, Risk, Issue & Financial Management</h2>
            <Badge variant="primary" className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Master Prompt 09
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise R&D governance, risk scoring & 5x5 matrix, issues, change impact analysis, requirements traceability, scope WBS & financial controls (Req 31–40).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Filter:</label>
          <select
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">All R&D Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'overview') fetchOverview();
              else if (activeTab === 'decisions') fetchDecisions();
              else if (activeTab === 'risks') fetchRisks();
              else if (activeTab === 'issues') fetchIssues();
              else if (activeTab === 'changes') fetchChangeRequests();
              else if (activeTab === 'requirements') fetchRequirements();
              else if (activeTab === 'scope_wbs') fetchScopeWbs();
              else if (activeTab === 'deliverables') fetchDeliverables();
              else if (activeTab === 'quality') fetchQuality();
              else if (activeTab === 'budgets') fetchBudgets();
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: Activity },
          { id: 'decisions', label: 'Decisions Log (Req 31)', icon: Scale },
          { id: 'risks', label: 'Risks & 5x5 Matrix (Req 32-33)', icon: AlertTriangle },
          { id: 'issues', label: 'Issue Tracker (Req 34)', icon: AlertOctagon },
          { id: 'changes', label: 'Change Management (Req 35)', icon: GitPullRequest },
          { id: 'requirements', label: 'Requirements & Traceability (Req 36)', icon: CheckSquare },
          { id: 'scope_wbs', label: 'Scope Baseline & WBS (Req 37)', icon: ListTree },
          { id: 'deliverables', label: 'Deliverables (Req 38)', icon: FileCheck },
          { id: 'quality', label: 'Quality Checkpoints (Req 39)', icon: Award },
          { id: 'budgets', label: 'Budget & Financials (Req 40)', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Decisions Approved"
              value={`${overviewKpis?.approvedDecisions || 0} / ${overviewKpis?.totalDecisions || 0}`}
              change="Architecture & Strategic"
              trend="neutral"
              icon={Scale}
            />
            <KPICard
              title="Active Risks"
              value={overviewKpis?.activeRisksCount || 0}
              change={`${overviewKpis?.criticalRisks || 0} Critical / ${overviewKpis?.highRisks || 0} High`}
              trend={overviewKpis?.criticalRisks > 0 ? 'down' : 'up'}
              icon={AlertTriangle}
            />
            <KPICard
              title="Open Issues"
              value={overviewKpis?.openIssuesCount || 0}
              change={`${overviewKpis?.blockerIssuesCount || 0} Blocker / Critical`}
              trend={overviewKpis?.blockerIssuesCount > 0 ? 'down' : 'neutral'}
              icon={AlertOctagon}
            />
            <KPICard
              title="Budget Utilization"
              value={`${overviewKpis?.budgetBurnRate || 0}%`}
              change={`$${(overviewKpis?.totalBudgetSpent || 0).toLocaleString()} / $${(overviewKpis?.totalBudgetAllocated || 0).toLocaleString()}`}
              trend="up"
              icon={DollarSign}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Requirements Verification Rate
              </h3>
              <div className="text-3xl font-bold text-emerald-400">
                {overviewKpis?.reqVerificationRate || 0}%
              </div>
              <p className="text-xs text-slate-400">
                Percentage of total scientific & engineering requirements verified through empirical test criteria.
              </p>
            </Card>

            <Card className="p-5 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <ListTree className="w-4 h-4 text-indigo-400" />
                Work Breakdown Structure (WBS)
              </h3>
              <div className="text-3xl font-bold text-indigo-400">
                {overviewKpis?.wbsAvgProgress || 0}%
              </div>
              <p className="text-xs text-slate-400">
                Average progress calculated across all project work packages and deliverables in the WBS tree.
              </p>
            </Card>

            <Card className="p-5 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Quality Checkpoints Pass Rate
              </h3>
              <div className="text-3xl font-bold text-amber-400">
                {overviewKpis?.qualityCheckpointsCount > 0
                  ? Math.round((overviewKpis.passedCheckpoints / overviewKpis.qualityCheckpointsCount) * 100)
                  : 100}%
              </div>
              <p className="text-xs text-slate-400">
                {overviewKpis?.passedCheckpoints || 0} passed of {overviewKpis?.qualityCheckpointsCount || 0} formal stage-gate audits.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DECISIONS LOG (REQ 31) */}
      {/* ========================================================================= */}
      {activeTab === 'decisions' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                R&D Architecture & Strategic Decision Registry
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Formal record of architectural choices, trade-offs, alternatives considered, and governance approvals (Req 31).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search decisions..."
                  value={decisionSearch}
                  onChange={(e) => setDecisionSearch(e.target.value)}
                  className="bg-slate-800 text-slate-200 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button onClick={() => setShowDecisionModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Log Decision
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {decisions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Scale className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No decisions logged for this project yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowDecisionModal(true)}>
                  Create Initial Decision Proposal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-300">Code</TableCell>
                      <TableCell className="font-semibold text-slate-300">Title</TableCell>
                      <TableCell className="font-semibold text-slate-300">Category</TableCell>
                      <TableCell className="font-semibold text-slate-300">Rationale</TableCell>
                      <TableCell className="font-semibold text-slate-300">Status</TableCell>
                      <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decisions.map((d) => (
                      <TableRow key={d.id} className="hover:bg-slate-800/40">
                        <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{d.decisionCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{d.title}</TableCell>
                        <TableCell><Badge variant="neutral">{d.category}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-xs truncate">{d.rationale}</TableCell>
                        <TableCell>{getStatusBadge(d.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {d.status === 'PROPOSED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateDecisionStatus(d.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                            )}
                            {d.status === 'PROPOSED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400"
                                onClick={() => handleUpdateDecisionStatus(d.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. RISKS & 5X5 MATRIX (REQ 32 & 33) */}
      {/* ========================================================================= */}
      {activeTab === 'risks' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Risk Register & 5x5 Probability-Impact Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Risk Score = Probability (1–5) × Impact (1–5). Mapped to Low (1–4), Moderate (5–9), High (10–16), Critical (17–25).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setRiskViewMode('table')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    riskViewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setRiskViewMode('matrix')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    riskViewMode === 'matrix' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Interactive 5x5 Matrix
                </button>
              </div>
              <Button onClick={() => setShowRiskModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Identify Risk
              </Button>
            </div>
          </div>

          {/* Interactive 5x5 Matrix View */}
          {riskViewMode === 'matrix' && riskMatrix && (
            <Card className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-300">5×5 Risk Exposure Grid</h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600"></span> Critical (17-25)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> High (10-16)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500"></span> Moderate (5-9)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600"></span> Low (1-4)</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-1 text-xs font-bold text-slate-400 flex items-center justify-center">
                    Probability ↓ / Impact →
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="text-center font-bold text-xs text-slate-300 py-1 bg-slate-800 rounded">
                      Impact {i}
                    </div>
                  ))}

                  {[5, 4, 3, 2, 1].map((p) => (
                    <React.Fragment key={p}>
                      <div className="font-bold text-xs text-slate-300 flex items-center justify-center bg-slate-800 rounded px-2">
                        Prob {p}
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => {
                        const cellKey = `${p}_${i}`;
                        const cell = riskMatrix.grid[cellKey];
                        const count = cell ? cell.count : 0;
                        const score = p * i;
                        let cellBg = 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300';
                        if (score >= 17) cellBg = 'bg-red-950/60 border-red-700/60 text-red-300';
                        else if (score >= 10) cellBg = 'bg-amber-950/60 border-amber-700/60 text-amber-300';
                        else if (score >= 5) cellBg = 'bg-blue-950/60 border-blue-700/60 text-blue-300';

                        return (
                          <div
                            key={cellKey}
                            onClick={() => setSelectedRiskCell(cell)}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition hover:scale-105 ${cellBg}`}
                          >
                            <span className="text-xs font-mono font-semibold text-slate-400">Score {score}</span>
                            <span className="text-lg font-black">{count}</span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {selectedRiskCell && (
                  <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-semibold text-slate-200">
                      Risks at Probability {selectedRiskCell.probability} × Impact {selectedRiskCell.impact} (Score: {selectedRiskCell.score} - {selectedRiskCell.level}):
                    </h5>
                    {selectedRiskCell.risks.length === 0 ? (
                      <p className="text-xs text-slate-400 mt-2">No active risks mapped in this cell.</p>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        {selectedRiskCell.risks.map((r) => (
                          <div key={r.id} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 text-xs">
                            <span className="font-mono text-indigo-400">{r.riskCode}</span>
                            <span className="font-medium text-slate-200">{r.title}</span>
                            <span>{getRiskLevelBadge(r.riskLevel)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Table View */}
          {riskViewMode === 'table' && (
            <Card>
              <CardBody>
                {risks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <AlertTriangle className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                    <p>No risks identified for this project.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowRiskModal(true)}>
                      Identify Initial Risk
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="font-semibold text-slate-300">Code</TableCell>
                          <TableCell className="font-semibold text-slate-300">Title</TableCell>
                          <TableCell className="font-semibold text-slate-300">Category</TableCell>
                          <TableCell className="font-semibold text-slate-300">Prob × Imp</TableCell>
                          <TableCell className="font-semibold text-slate-300">Score & Level</TableCell>
                          <TableCell className="font-semibold text-slate-300">Strategy</TableCell>
                          <TableCell className="font-semibold text-slate-300">Status</TableCell>
                          <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {risks.map((r) => (
                          <TableRow key={r.id} className="hover:bg-slate-800/40">
                            <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{r.riskCode}</TableCell>
                            <TableCell className="font-medium text-slate-200">{r.title}</TableCell>
                            <TableCell><Badge variant="neutral">{r.category}</Badge></TableCell>
                            <TableCell className="text-xs font-mono">{r.probability} × {r.impact}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{r.riskScore}</span>
                                {getRiskLevelBadge(r.riskLevel)}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-300">{r.strategy}</TableCell>
                            <TableCell>{getStatusBadge(r.status)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRisk(r);
                                  setShowMitigationModal(true);
                                }}
                              >
                                + Mitigation
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ISSUE TRACKING (REQ 34) */}
      {/* ========================================================================= */}
      {activeTab === 'issues' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                Issue Tracking & Root Cause Lifecycle
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Track blockers, technical impediments, and material risks with resolution tracking (Req 34).
              </p>
            </div>
            <Button onClick={() => setShowIssueModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Log Issue
            </Button>
          </CardHeader>
          <CardBody>
            {issues.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                <p>No active issues reported. Project is running smoothly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-300">Code</TableCell>
                      <TableCell className="font-semibold text-slate-300">Title</TableCell>
                      <TableCell className="font-semibold text-slate-300">Priority</TableCell>
                      <TableCell className="font-semibold text-slate-300">Severity</TableCell>
                      <TableCell className="font-semibold text-slate-300">Root Cause</TableCell>
                      <TableCell className="font-semibold text-slate-300">Status</TableCell>
                      <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((i) => (
                      <TableRow key={i.id} className="hover:bg-slate-800/40">
                        <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{i.issueCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{i.title}</TableCell>
                        <TableCell>{getRiskLevelBadge(i.priority)}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-300">{i.severity}</TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-xs truncate">{i.rootCause || 'Under investigation'}</TableCell>
                        <TableCell>{getStatusBadge(i.status)}</TableCell>
                        <TableCell>
                          {i.status !== 'RESOLVED' && i.status !== 'CLOSED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateIssueStatus(i.id, 'RESOLVED', 'Issue resolved by engineering team.')}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. CHANGE MANAGEMENT (REQ 35) */}
      {/* ========================================================================= */}
      {activeTab === 'changes' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-indigo-400" />
                Change Management & Impact Assessment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Formal review of changes to scope, schedule, budget, and technical specifications (Req 35).
              </p>
            </div>
            <Button onClick={() => setShowChangeModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Request Change
            </Button>
          </CardHeader>
          <CardBody>
            {changeRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <GitPullRequest className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No change requests submitted.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-300">CR Code</TableCell>
                      <TableCell className="font-semibold text-slate-300">Title</TableCell>
                      <TableCell className="font-semibold text-slate-300">Type</TableCell>
                      <TableCell className="font-semibold text-slate-300">Schedule Impact</TableCell>
                      <TableCell className="font-semibold text-slate-300">Cost Impact</TableCell>
                      <TableCell className="font-semibold text-slate-300">Status</TableCell>
                      <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeRequests.map((cr) => (
                      <TableRow key={cr.id} className="hover:bg-slate-800/40">
                        <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{cr.changeCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{cr.title}</TableCell>
                        <TableCell><Badge variant="neutral">{cr.changeType}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-300">+{cr.scheduleImpactDays} days</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-emerald-400">${Number(cr.costImpactAmount).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(cr.status)}</TableCell>
                        <TableCell>
                          {['SUBMITTED', 'UNDER_REVIEW'].includes(cr.status) && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleReviewChange(cr.id, 'APPROVED')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400" onClick={() => handleReviewChange(cr.id, 'REJECTED')}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 6. REQUIREMENTS & TRACEABILITY (REQ 36) */}
      {/* ========================================================================= */}
      {activeTab === 'requirements' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Requirements Registry & Traceability Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Functional and compliance requirements with testable acceptance criteria (Req 36).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowReqModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Requirement
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {requirements.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckSquare className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No requirements recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {requirements.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-indigo-400">{r.reqCode}</span>
                        <h4 className="font-semibold text-slate-200">{r.title}</h4>
                        <Badge variant="neutral">{r.category}</Badge>
                        <Badge variant="primary">{r.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Method: {r.verificationMethod}</span>
                        {getStatusBadge(r.verificationStatus)}
                      </div>
                    </div>
                    {r.description && <p className="text-xs text-slate-400">{r.description}</p>}

                    {/* Criteria Checklist */}
                    {r.criteria && r.criteria.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Acceptance Criteria:</span>
                        {r.criteria.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded border border-slate-800">
                            <span className="text-slate-300">{c.criterionDescription}</span>
                            <button
                              onClick={() => handleVerifyCriterion(c.id, !c.isMet)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                                c.isMet ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {c.isMet ? '✓ PASSED' : 'Mark Passed'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 7. SCOPE BASELINE & WBS (REQ 37) */}
      {/* ========================================================================= */}
      {activeTab === 'scope_wbs' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <ListTree className="w-5 h-5 text-indigo-400" />
                Scope Baseline & Work Breakdown Structure (WBS)
              </h3>
              <p className="text-xs text-slate-400">
                Hierarchical parent-child decomposition of project scope into work packages (Req 37).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBaselineModal(true)}>
                + Establish Baseline
              </Button>
              <Button size="sm" onClick={() => setShowWbsModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add WBS Node
              </Button>
            </div>
          </div>

          <Card className="p-5">
            {wbsTree.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ListTree className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No WBS nodes defined for this project yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowWbsModal(true)}>
                  Create Top-Level Project Phase
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {wbsTree.map((node) => (
                  <div key={node.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-indigo-400">{node.wbsCode}</span>
                        <span className="font-semibold text-slate-200">{node.title}</span>
                        <Badge variant="neutral">{node.itemType}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">{node.completionPercent}% complete</span>
                        {getStatusBadge(node.status)}
                      </div>
                    </div>

                    {/* Child items */}
                    {node.children && node.children.length > 0 && (
                      <div className="pl-6 border-l-2 border-indigo-500/30 flex flex-col gap-2 mt-2">
                        {node.children.map((child) => (
                          <div key={child.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-indigo-400 font-semibold">{child.wbsCode}</span>
                              <span className="text-slate-200">{child.title}</span>
                              <Badge variant="neutral">{child.itemType}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400">{child.completionPercent}%</span>
                              {getStatusBadge(child.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELIVERABLES (REQ 38) */}
      {/* ========================================================================= */}
      {activeTab === 'deliverables' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Project Deliverables & ELN Document Acceptance
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Formal deliverable milestones with bound research documents and sign-off workflows (Req 38).
              </p>
            </div>
            <Button onClick={() => setShowDeliverableModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Register Deliverable
            </Button>
          </CardHeader>
          <CardBody>
            {deliverables.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileCheck className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No deliverables recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-300">Code</TableCell>
                      <TableCell className="font-semibold text-slate-300">Title</TableCell>
                      <TableCell className="font-semibold text-slate-300">Category</TableCell>
                      <TableCell className="font-semibold text-slate-300">Due Date</TableCell>
                      <TableCell className="font-semibold text-slate-300">Status</TableCell>
                      <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverables.map((del) => (
                      <TableRow key={del.id} className="hover:bg-slate-800/40">
                        <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{del.deliverableCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{del.title}</TableCell>
                        <TableCell><Badge variant="neutral">{del.category}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-400">{del.dueDate ? new Date(del.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(del.status)}</TableCell>
                        <TableCell>
                          {del.status !== 'ACCEPTED' && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleReviewDeliverable(del.id, 'ACCEPTED')}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400" onClick={() => handleReviewDeliverable(del.id, 'REJECTED')}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 9. QUALITY CHECKPOINTS (REQ 39) */}
      {/* ========================================================================= */}
      {activeTab === 'quality' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Quality Checkpoints & Formal Stage Audits
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Quality criteria evaluations; failures automatically raise high-priority issues (Req 39).
              </p>
            </div>
            <Button onClick={() => setShowQcModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Plan Checkpoint
            </Button>
          </CardHeader>
          <CardBody>
            {qualityCheckpoints.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Award className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p>No quality checkpoints scheduled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-300">Code</TableCell>
                      <TableCell className="font-semibold text-slate-300">Title</TableCell>
                      <TableCell className="font-semibold text-slate-300">Type</TableCell>
                      <TableCell className="font-semibold text-slate-300">Planned Date</TableCell>
                      <TableCell className="font-semibold text-slate-300">Status</TableCell>
                      <TableCell className="font-semibold text-slate-300">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityCheckpoints.map((qc) => (
                      <TableRow key={qc.id} className="hover:bg-slate-800/40">
                        <TableCell className="font-mono text-xs text-indigo-400 font-semibold">{qc.checkpointCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{qc.title}</TableCell>
                        <TableCell><Badge variant="neutral">{qc.checkpointType}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-400">{qc.plannedDate ? new Date(qc.plannedDate).toLocaleDateString() : 'TBD'}</TableCell>
                        <TableCell>{getStatusBadge(qc.status)}</TableCell>
                        <TableCell>
                          {qc.status === 'PLANNED' && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleConductQc(qc.id, 'PASS')}>
                                Pass
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400" onClick={() => handleConductQc(qc.id, 'FAIL')}>
                                Fail & Issue
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 10. BUDGETS & FINANCIAL CONTROLS (REQ 40) */}
      {/* ========================================================================= */}
      {activeTab === 'budgets' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Project Budget Planning & Category Allocations
              </h3>
              <p className="text-xs text-slate-400">
                Category allocation breakdowns, contingency controls, and executive revisions (Req 40).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowBudgetModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Setup FY Budget
              </Button>
            </div>
          </div>

          {budgets.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p>No budget records established for this project.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowBudgetModal(true)}>
                Initialize Project Budget
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Budget List */}
              <div className="flex flex-col gap-3">
                {budgets.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBudget(b);
                      fetchBudgetSummary(b.id);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedBudget?.id === b.id
                        ? 'bg-indigo-950/40 border-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100">FY {b.fiscalYear}</span>
                      {getStatusBadge(b.status)}
                    </div>
                    <div className="text-xl font-black text-emerald-400 mt-2">
                      ${Number(b.totalAllocated).toLocaleString()}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Spent: ${Number(b.totalSpent).toLocaleString()}</span>
                      <span>Contingency: {b.contingencyPercentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Detailed Allocations & Financial Summary */}
              {selectedBudget && (
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <Card className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-100">FY{selectedBudget.fiscalYear} Allocation Details</h4>
                        <span className="text-xs text-slate-400">Total Approved: ${Number(selectedBudget.totalAllocated).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedBudget.status === 'DRAFT' && (
                          <Button size="sm" onClick={() => handleApproveBudget(selectedBudget.id)}>
                            Approve Budget
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setShowAllocationModal(true)}>
                          + Category
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowRevisionModal(true)}>
                          Request Revision
                        </Button>
                      </div>
                    </div>

                    {/* Category Allocations Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableCell className="font-semibold text-slate-300">Category</TableCell>
                            <TableCell className="font-semibold text-slate-300">Planned</TableCell>
                            <TableCell className="font-semibold text-slate-300">Actual Spent</TableCell>
                            <TableCell className="font-semibold text-slate-300">Committed</TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBudget.allocations?.map((a) => (
                            <TableRow key={a.id} className="hover:bg-slate-800/40">
                              <TableCell className="font-medium text-slate-200">{a.category}</TableCell>
                              <TableCell className="font-mono text-emerald-400">${Number(a.plannedAmount).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-slate-300">${Number(a.actualAmount).toLocaleString()}</TableCell>
                              <TableCell className="font-mono text-slate-400">${Number(a.committedAmount).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" /> Log Decision
            </h3>
            <form onSubmit={handleCreateDecision} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Decision Title *</label>
                <Input
                  required
                  value={decisionForm.title}
                  onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })}
                  placeholder="e.g. Adopt Microservices Architecture for Telemetry"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={decisionForm.category}
                  onChange={(e) => setDecisionForm({ ...decisionForm, category: e.target.value })}
                >
                  <option value="ARCHITECTURE">ARCHITECTURE</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="STRATEGIC">STRATEGIC</option>
                  <option value="SCOPE">SCOPE</option>
                  <option value="QUALITY">QUALITY</option>
                  <option value="BUDGET">BUDGET</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Rationale *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={decisionForm.rationale}
                  onChange={(e) => setDecisionForm({ ...decisionForm, rationale: e.target.value })}
                  placeholder="Explain why this decision was taken..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Alternatives Considered</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={decisionForm.alternativesConsidered}
                  onChange={(e) => setDecisionForm({ ...decisionForm, alternativesConsidered: e.target.value })}
                  placeholder="Other options evaluated..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowDecisionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Decision</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Identify & Score Risk
            </h3>
            <form onSubmit={handleCreateRisk} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Risk Title *</label>
                <Input
                  required
                  value={riskForm.title}
                  onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
                  placeholder="e.g. Thermal runaway during high-load experiment"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Probability (1–5)</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={riskForm.probability}
                    onChange={(e) => setRiskForm({ ...riskForm, probability: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>Level {v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Impact (1–5)</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={riskForm.impact}
                    onChange={(e) => setRiskForm({ ...riskForm, impact: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>Level {v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Strategy</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={riskForm.strategy}
                  onChange={(e) => setRiskForm({ ...riskForm, strategy: e.target.value })}
                >
                  <option value="MITIGATE">MITIGATE</option>
                  <option value="AVOID">AVOID</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="ACCEPT">ACCEPT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Contingency Plan</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={riskForm.contingencyPlan}
                  onChange={(e) => setRiskForm({ ...riskForm, contingencyPlan: e.target.value })}
                  placeholder="Action to take if risk materializes..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowRiskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Register Risk</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mitigation Modal */}
      {showMitigationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100">Add Mitigation Action</h3>
            <form onSubmit={handleAddMitigation} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Action Title *</label>
                <Input
                  required
                  value={mitigationForm.actionTitle}
                  onChange={(e) => setMitigationForm({ ...mitigationForm, actionTitle: e.target.value })}
                  placeholder="e.g. Install dual sensor cut-off circuit"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Action Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={mitigationForm.actionDescription}
                  onChange={(e) => setMitigationForm({ ...mitigationForm, actionDescription: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowMitigationModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Action</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-400" /> Log Issue
            </h3>
            <form onSubmit={handleCreateIssue} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Issue Title *</label>
                <Input
                  required
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  placeholder="e.g. Reagent batch purity failed spectroscopy test"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={issueForm.priority}
                    onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="BLOCKER">BLOCKER</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Severity</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={issueForm.severity}
                    onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                  >
                    <option value="MINOR">MINOR</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Root Cause (if known)</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={issueForm.rootCause}
                  onChange={(e) => setIssueForm({ ...issueForm, rootCause: e.target.value })}
                  placeholder="Primary underlying factor..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowIssueModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Issue</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-indigo-400" /> Request Project Change
            </h3>
            <form onSubmit={handleCreateChange} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Change Request Title *</label>
                <Input
                  required
                  value={changeForm.title}
                  onChange={(e) => setChangeForm({ ...changeForm, title: e.target.value })}
                  placeholder="e.g. Extend sprint duration by 10 days for extra test cycles"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Change Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={changeForm.changeType}
                    onChange={(e) => setChangeForm({ ...changeForm, changeType: e.target.value })}
                  >
                    <option value="SCOPE">SCOPE</option>
                    <option value="SCHEDULE">SCHEDULE</option>
                    <option value="BUDGET">BUDGET</option>
                    <option value="SPECIFICATION">SPECIFICATION</option>
                    <option value="RESOURCE">RESOURCE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Schedule Impact (Days)</label>
                  <Input
                    type="number"
                    value={changeForm.scheduleImpactDays}
                    onChange={(e) => setChangeForm({ ...changeForm, scheduleImpactDays: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Cost Impact Amount ($)</label>
                <Input
                  type="number"
                  value={changeForm.costImpactAmount}
                  onChange={(e) => setChangeForm({ ...changeForm, costImpactAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Reason for Change *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={changeForm.reasonForChange}
                  onChange={(e) => setChangeForm({ ...changeForm, reasonForChange: e.target.value })}
                  placeholder="Justification and impact analysis..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowChangeModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" /> Register Requirement
            </h3>
            <form onSubmit={handleCreateRequirement} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Requirement Title *</label>
                <Input
                  required
                  value={reqForm.title}
                  onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                  placeholder="e.g. Sensor sampling rate must exceed 1000 Hz"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={reqForm.category}
                    onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}
                  >
                    <option value="FUNCTIONAL">FUNCTIONAL</option>
                    <option value="NON_FUNCTIONAL">NON_FUNCTIONAL</option>
                    <option value="PERFORMANCE">PERFORMANCE</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="SAFETY">SAFETY</option>
                    <option value="SCIENTIFIC">SCIENTIFIC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Verification Method</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={reqForm.verificationMethod}
                    onChange={(e) => setReqForm({ ...reqForm, verificationMethod: e.target.value })}
                  >
                    <option value="TEST">TEST</option>
                    <option value="DEMONSTRATION">DEMONSTRATION</option>
                    <option value="INSPECTION">INSPECTION</option>
                    <option value="ANALYSIS">ANALYSIS</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowReqModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Requirement</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WBS Item Modal */}
      {showWbsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ListTree className="w-5 h-5 text-indigo-400" /> Add Work Breakdown Structure (WBS) Node
            </h3>
            <form onSubmit={handleCreateWbsItem} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">WBS Code *</label>
                  <Input
                    required
                    value={wbsForm.wbsCode}
                    onChange={(e) => setWbsForm({ ...wbsForm, wbsCode: e.target.value })}
                    placeholder="e.g. 1.1 or 2.3.1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={wbsForm.itemType}
                    onChange={(e) => setWbsForm({ ...wbsForm, itemType: e.target.value })}
                  >
                    <option value="PHASE">PHASE</option>
                    <option value="SUB_PHASE">SUB_PHASE</option>
                    <option value="WORK_PACKAGE">WORK_PACKAGE</option>
                    <option value="DELIVERABLE">DELIVERABLE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Node Title *</label>
                <Input
                  required
                  value={wbsForm.title}
                  onChange={(e) => setWbsForm({ ...wbsForm, title: e.target.value })}
                  placeholder="e.g. Prototype Assembly & Initial Bench Testing"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowWbsModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Node</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliverable Modal */}
      {showDeliverableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" /> Register Deliverable
            </h3>
            <form onSubmit={handleCreateDeliverable} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Deliverable Title *</label>
                <Input
                  required
                  value={deliverableForm.title}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                  placeholder="e.g. Preliminary Engineering Design Report"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={deliverableForm.category}
                    onChange={(e) => setDeliverableForm({ ...deliverableForm, category: e.target.value })}
                  >
                    <option value="TECHNICAL_REPORT">TECHNICAL_REPORT</option>
                    <option value="PROTOTYPE">PROTOTYPE</option>
                    <option value="SPECIFICATION_SHEET">SPECIFICATION_SHEET</option>
                    <option value="TEST_DATASET">TEST_DATASET</option>
                    <option value="SOFTWARE_RELEASE">SOFTWARE_RELEASE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <Input
                    type="date"
                    value={deliverableForm.dueDate}
                    onChange={(e) => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowDeliverableModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Register Deliverable</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quality Checkpoint Modal */}
      {showQcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Plan Quality Checkpoint
            </h3>
            <form onSubmit={handleCreateQc} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Checkpoint Title *</label>
                <Input
                  required
                  value={qcForm.title}
                  onChange={(e) => setQcForm({ ...qcForm, title: e.target.value })}
                  placeholder="e.g. Gate 3 Technical Readiness & Safety Inspection"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                    value={qcForm.checkpointType}
                    onChange={(e) => setQcForm({ ...qcForm, checkpointType: e.target.value })}
                  >
                    <option value="STAGE_GATE">STAGE_GATE</option>
                    <option value="MILESTONE">MILESTONE</option>
                    <option value="PEER_REVIEW">PEER_REVIEW</option>
                    <option value="AUDIT">AUDIT</option>
                    <option value="COMPLIANCE_CHECK">COMPLIANCE_CHECK</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Planned Inspection Date</label>
                  <Input
                    type="date"
                    value={qcForm.plannedDate}
                    onChange={(e) => setQcForm({ ...qcForm, plannedDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowQcModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Plan Checkpoint</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Setup Fiscal Year Budget
            </h3>
            <form onSubmit={handleCreateBudget} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Fiscal Year</label>
                  <Input
                    type="number"
                    value={budgetForm.fiscalYear}
                    onChange={(e) => setBudgetForm({ ...budgetForm, fiscalYear: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Currency</label>
                  <Input
                    value={budgetForm.currency}
                    onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Total Allocated Budget ($) *</label>
                <Input
                  type="number"
                  required
                  value={budgetForm.totalAllocated}
                  onChange={(e) => setBudgetForm({ ...budgetForm, totalAllocated: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Contingency %</label>
                <Input
                  type="number"
                  value={budgetForm.contingencyPercentage}
                  onChange={(e) => setBudgetForm({ ...budgetForm, contingencyPercentage: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowBudgetModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Establish Budget</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100">Add Category Allocation</h3>
            <form onSubmit={handleAddAllocation} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={allocationForm.category}
                  onChange={(e) => setAllocationForm({ ...allocationForm, category: e.target.value })}
                >
                  <option value="PERSONNEL">PERSONNEL</option>
                  <option value="LAB_EQUIPMENT">LAB_EQUIPMENT</option>
                  <option value="MATERIALS_CONSUMABLES">MATERIALS_CONSUMABLES</option>
                  <option value="THIRD_PARTY_SERVICES">THIRD_PARTY_SERVICES</option>
                  <option value="SOFTWARE_LICENSES">SOFTWARE_LICENSES</option>
                  <option value="TRAVEL_FIELDWORK">TRAVEL_FIELDWORK</option>
                  <option value="OVERHEAD_FACILITIES">OVERHEAD_FACILITIES</option>
                  <option value="CONTINGENCY">CONTINGENCY</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Planned Allocation Amount ($) *</label>
                <Input
                  type="number"
                  required
                  value={allocationForm.plannedAmount}
                  onChange={(e) => setAllocationForm({ ...allocationForm, plannedAmount: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowAllocationModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Allocation</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-100">Request Budget Revision</h3>
            <form onSubmit={handleRequestRevision} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">New Total Budget ($) *</label>
                <Input
                  type="number"
                  required
                  value={revisionForm.newTotal}
                  onChange={(e) => setRevisionForm({ ...revisionForm, newTotal: e.target.value })}
                  placeholder="e.g. 150000"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Reason for Revision *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  value={revisionForm.reason}
                  onChange={(e) => setRevisionForm({ ...revisionForm, reason: e.target.value })}
                  placeholder="Detailed justification for budget expansion or reduction..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowRevisionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RdGovernanceOpsWorkspace;
