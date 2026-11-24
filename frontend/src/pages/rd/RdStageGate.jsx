import React, { useState, useEffect, useCallback } from 'react';
import {
  Workflow,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  FileText,
  FileCheck,
  ChevronRight,
  UserCheck,
  Layers,
  PauseCircle,
  RotateCcw,
  Ban,
  HelpCircle,
  Inbox,
  Settings,
  FolderGit2,
  ExternalLink,
  Upload
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  ProgressBar,
  Input,
  Select,
  Modal
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdStageGate = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('pipeline'); // pipeline, projects, inbox, templates
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [governedProjects, setGovernedProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedGovernance, setSelectedGovernance] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [reviewerInbox, setReviewerInbox] = useState([]);

  // Modals & Drawers
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [eligibleProjects, setEligibleProjects] = useState([]);

  // Form states
  const [decisionOutcome, setDecisionOutcome] = useState('GO_CONTINUE');
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionComments, setDecisionComments] = useState('');
  const [signOffRecommendation, setSignOffRecommendation] = useState('APPROVE');
  const [signOffComments, setSignOffComments] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('DOCUMENT');
  const [selectedCriterionId, setSelectedCriterionId] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [initProjectId, setInitProjectId] = useState('');
  const [initTemplateId, setInitTemplateId] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Dashboard & General Data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, projRes, tmplRes, inboxRes] = await Promise.all([
        apiClient.get('/rd/governance/dashboard').catch(() => ({ success: false })),
        apiClient.get('/rd/governance/projects').catch(() => ({ success: false, data: { projects: [] } })),
        apiClient.get('/rd/governance/templates').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/governance/inbox').catch(() => ({ success: false, data: [] })),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardMetrics(dashRes.data);
      }
      if (projRes.success && projRes.data?.projects) {
        setGovernedProjects(projRes.data.projects);
        if (!selectedProjectId && projRes.data.projects.length > 0) {
          setSelectedProjectId(projRes.data.projects[0].projectId);
        }
      }
      if (tmplRes.success && Array.isArray(tmplRes.data)) {
        setTemplates(tmplRes.data);
      }
      if (inboxRes.success && Array.isArray(inboxRes.data)) {
        setReviewerInbox(inboxRes.data);
      }
    } catch (err) {
      console.error('[RdStageGate] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Fetch specific selected project governance
  const fetchSelectedProjectGovernance = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const res = await apiClient.get(`/rd/governance/projects/${projectId}`);
      if (res.success && res.data) {
        setSelectedGovernance(res.data);
      }
    } catch (err) {
      console.error('[RdStageGate] Project governance fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSelectedProjectGovernance(selectedProjectId);
    }
  }, [selectedProjectId, fetchSelectedProjectGovernance]);

  // Open Gate Review Modal
  const handleOpenReview = (review) => {
    setActiveReview(review);
    setIsReviewModalOpen(true);
  };

  // Submit Sign-Off
  const handleSubmitSignOff = async (e) => {
    e.preventDefault();
    if (!activeReview) return;
    setSubmittingAction(true);
    try {
      const res = await apiClient.post(`/rd/governance/reviews/${activeReview.id}/sign-off`, {
        recommendation: signOffRecommendation,
        comments: signOffComments,
      });

      if (res.success) {
        addToast({
          title: 'Sign-Off Recorded',
          message: `Your recommendation (${signOffRecommendation}) has been logged.`,
          type: 'success',
        });
        setSignOffComments('');
        // Refresh governance
        if (selectedProjectId) fetchSelectedProjectGovernance(selectedProjectId);
        fetchDashboardData();
        setIsReviewModalOpen(false);
      }
    } catch (err) {
      addToast({
        title: 'Sign-Off Error',
        message: err.message || 'Failed to submit sign-off.',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Evidence
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!activeReview || !evidenceTitle.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await apiClient.post(`/rd/governance/reviews/${activeReview.id}/evidence`, {
        title: evidenceTitle.trim(),
        description: evidenceDesc,
        evidenceType,
        criterionId: selectedCriterionId || null,
      });

      if (res.success) {
        addToast({
          title: 'Evidence Attached',
          message: `Evidence "${evidenceTitle}" successfully linked.`,
          type: 'success',
        });
        setEvidenceTitle('');
        setEvidenceDesc('');
        setIsEvidenceModalOpen(false);
        if (selectedProjectId) fetchSelectedProjectGovernance(selectedProjectId);
      }
    } catch (err) {
      addToast({
        title: 'Evidence Error',
        message: err.message || 'Failed to upload evidence.',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Record Gate Decision
  const handleRecordDecision = async (e) => {
    e.preventDefault();
    if (!activeReview || !decisionReason.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'A documented decision justification is mandatory.',
        type: 'warning',
      });
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await apiClient.post(`/rd/governance/reviews/${activeReview.id}/decision`, {
        decision: decisionOutcome,
        decisionReason: decisionReason.trim(),
        decisionComments,
      });

      if (res.success) {
        addToast({
          title: 'Decision Recorded',
          message: `Gate decision (${decisionOutcome}) executed successfully.`,
          type: 'success',
        });
        setDecisionReason('');
        setDecisionComments('');
        setIsDecisionModalOpen(false);
        setIsReviewModalOpen(false);
        if (selectedProjectId) fetchSelectedProjectGovernance(selectedProjectId);
        fetchDashboardData();
      }
    } catch (err) {
      addToast({
        title: 'Decision Failed',
        message: err.message || 'Error recording gate decision.',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resume Held Project
  const handleResumeProject = async (projectId) => {
    try {
      const res = await apiClient.post(`/rd/governance/projects/${projectId}/resume`, {
        reason: 'Authorized management resumption.',
      });
      if (res.success) {
        addToast({
          title: 'Project Resumed',
          message: 'Project governance returned to active state.',
          type: 'success',
        });
        if (selectedProjectId) fetchSelectedProjectGovernance(selectedProjectId);
        fetchDashboardData();
      }
    } catch (err) {
      addToast({
        title: 'Action Error',
        message: err.message || 'Failed to resume project.',
        type: 'error',
      });
    }
  };

  // Open Initialize Governance Modal
  const handleOpenInitModal = async () => {
    try {
      // Fetch available ERP projects
      const res = await apiClient.get('/rd/portfolio');
      if (res.success && res.data?.projects) {
        const governedIds = new Set(governedProjects.map((g) => g.projectId));
        const eligible = res.data.projects.filter((p) => !governedIds.has(p.id));
        setEligibleProjects(eligible);
        if (eligible.length > 0) setInitProjectId(eligible[0].id);
      }
      if (templates.length > 0) setInitTemplateId(templates[0].id);
      setIsInitModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Initialize Governance
  const handleInitGovernance = async (e) => {
    e.preventDefault();
    if (!initProjectId) return;
    setSubmittingAction(true);
    try {
      const res = await apiClient.post(`/rd/governance/projects/${initProjectId}/initialize`, {
        templateId: initTemplateId || null,
      });

      if (res.success) {
        addToast({
          title: 'Governance Initialized',
          message: 'Project is now actively governed by the Stage-Gate framework.',
          type: 'success',
        });
        setIsInitModalOpen(false);
        setSelectedProjectId(initProjectId);
        fetchDashboardData();
      }
    } catch (err) {
      addToast({
        title: 'Initialization Failed',
        message: err.message || 'Error initializing governance.',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helpers for Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active Governance</Badge>;
      case 'ON_HOLD':
        return <Badge variant="warning">On Hold</Badge>;
      case 'REWORK_REQUIRED':
        return <Badge variant="warning">Rework Required</Badge>;
      case 'TERMINATED':
        return <Badge variant="danger">Terminated / Killed</Badge>;
      case 'COMPLETED':
        return <Badge variant="primary">Completed / Transferred</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Gate Approved</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">Submitted</Badge>;
      case 'READY_FOR_REVIEW':
        return <Badge variant="default">Ready for Review</Badge>;
      case 'MORE_INFO_REQUIRED':
        return <Badge variant="warning">Clarifications Requested</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Stage-Gate Governance & Decision Checkpoints
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enforce evidence-based progression, multi-person gatekeeper reviews, and auditable go/hold/terminate decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenInitModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Initialize Project
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Governed Projects"
          value={dashboardMetrics?.totalGovernedProjects || 0}
          icon={Layers}
          variant="primary"
        />
        <KPICard
          title="Active Progression"
          value={dashboardMetrics?.activeProjects || 0}
          icon={Workflow}
          variant="success"
        />
        <KPICard
          title="Active Gate Reviews"
          value={dashboardMetrics?.activeReviews || 0}
          icon={Clock}
          variant="info"
        />
        <KPICard
          title="Pending Sign-Offs"
          value={dashboardMetrics?.pendingSignOffs || 0}
          icon={FileCheck}
          variant="warning"
        />
        <KPICard
          title="On Hold / Rework"
          value={(dashboardMetrics?.heldProjects || 0) + (dashboardMetrics?.reworkProjects || 0)}
          icon={PauseCircle}
          variant="warning"
        />
        <KPICard
          title="Terminated / Killed"
          value={dashboardMetrics?.terminatedProjects || 0}
          icon={Ban}
          variant="danger"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pipeline'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Stage-Gate Pipeline & Roadmap
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Governed Projects ({governedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inbox'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Reviewer Inbox ({reviewerInbox.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          Stage Templates ({templates.length})
        </button>
      </div>

      {/* TAB 1: STAGE-GATE PIPELINE & VISUAL ROADMAP */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Viewing Initiative:
              </span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm px-3 py-1.5 font-medium text-gray-900 dark:text-white"
              >
                {governedProjects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.project.name} [{p.currentStage?.name || 'Initiated'}]
                  </option>
                ))}
              </select>
            </div>
            {selectedGovernance && (
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedGovernance.governanceStatus)}
                <span className="text-xs text-gray-500">
                  Template: {selectedGovernance.template?.name} (v{selectedGovernance.templateVersion})
                </span>
                {selectedGovernance.governanceStatus === 'ON_HOLD' && (
                  <Button
                    size="xs"
                    variant="warning"
                    onClick={() => handleResumeProject(selectedGovernance.projectId)}
                  >
                    Resume from Hold
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Visual Stage-Gate Pipeline */}
          {selectedGovernance ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Stage Progression & Decision Checkpoints
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sequential progression through formal innovation gates
                    </p>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    Current Stage: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedGovernance.currentStage?.name}</span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* Horizontal Flow */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex items-stretch gap-4 min-w-[900px]">
                    {selectedGovernance.template?.stages?.map((stage, idx) => {
                      const isCurrent = stage.id === selectedGovernance.currentStageId;
                      const isPast =
                        stage.stageNumber < (selectedGovernance.currentStage?.stageNumber || 1);
                      const isUpcoming =
                        stage.stageNumber > (selectedGovernance.currentStage?.stageNumber || 1);
                      const stageReview = selectedGovernance.reviews?.find(
                        (r) => r.stageId === stage.id
                      );

                      return (
                        <div key={stage.id} className="flex-1 flex flex-col items-center">
                          {/* Stage Card */}
                          <div
                            className={`w-full p-4 rounded-xl border transition-all ${
                              isCurrent
                                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ring-2 ring-indigo-500/20'
                                : isPast
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-75'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: stage.color || '#3b82f6' }}
                              >
                                {stage.stageNumber}
                              </span>
                              {isPast && (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Active
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="text-xs text-gray-400">Upcoming</span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {stage.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 min-h-[32px]">
                              {stage.description}
                            </p>

                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                              <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Role: {stage.responsibleRole}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Criteria: {stage.criteria?.length || 0} items
                              </div>
                            </div>
                          </div>

                          {/* Connected Gate Card */}
                          {stage.gate && (
                            <div className="w-full mt-3 flex flex-col items-center">
                              <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
                              <div
                                className={`w-full p-3 rounded-lg border text-center transition-all ${
                                  isCurrent
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                                    : isPast
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span className="truncate">{stage.gate.name}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">
                                  Policy: {stage.gate.approvalPolicy}
                                </div>

                                {stageReview && (
                                  <div className="mt-2">
                                    {getStatusBadge(stageReview.status)}
                                    <div className="mt-2">
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        className="w-full text-xs"
                                        onClick={() => handleOpenReview(stageReview)}
                                      >
                                        Open Review
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Stage Criteria Breakdown */}
                {selectedGovernance.currentStage && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Stage Entry & Exit Requirements ({selectedGovernance.currentStage.name})
                      </h4>
                      <div className="space-y-2">
                        {selectedGovernance.currentStage.criteria?.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                  {c.name}
                                </span>
                                {c.isMandatory && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold">
                                    Mandatory
                                  </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                  {c.type}
                                </span>
                              </div>
                              {c.description && (
                                <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                              )}
                            </div>
                            {c.evidenceRequired && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium whitespace-nowrap">
                                <FileText className="w-3.5 h-3.5" /> Evidence Required
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Historical Progression Timeline */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Governance Transition History
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {selectedGovernance.history?.map((h) => (
                          <div
                            key={h.id}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs"
                          >
                            <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200">
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {h.eventType}
                              </span>
                              <span className="text-gray-400 font-normal">
                                {new Date(h.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              {h.reason || h.notes || 'Stage event logged.'}
                            </div>
                            {h.toStageName && (
                              <div className="text-[11px] text-gray-500 mt-1">
                                State: {h.fromStageName || 'Initial'} &rarr; {h.toStageName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-12 text-gray-500">
                  <Workflow className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    No Governed Projects Found
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Initialize an R&D initiative to begin Stage-Gate governance.
                  </p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={handleOpenInitModal}>
                    Initialize First Project
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: GOVERNED PROJECTS TABLE */}
      {activeTab === 'projects' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  All Governed R&D Projects
                </h3>
                <p className="text-xs text-gray-500">
                  Track stage health, budget allocations, and decision gate statuses
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Project Name</TableCell>
                    <TableCell isHeader>Current Stage</TableCell>
                    <TableCell isHeader>Decision Gate</TableCell>
                    <TableCell isHeader>Governance Status</TableCell>
                    <TableCell isHeader>Budget / Progress</TableCell>
                    <TableCell isHeader>Last Transition</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {governedProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {p.project.name}
                        </div>
                        <div className="text-xs text-gray-500">Lead: {p.project.manager || 'Unassigned'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{p.currentStage?.name || 'Stage 1'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {p.currentGate?.name || 'Gate Pending'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(p.governanceStatus)}</TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          ${Number(p.project.budget || 0).toLocaleString()}
                        </div>
                        <div className="w-24 mt-1">
                          <ProgressBar value={p.project.progress || 0} size="sm" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {new Date(p.lastTransitionAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedProjectId(p.projectId);
                              setActiveTab('pipeline');
                            }}
                          >
                            View Pipeline
                          </Button>
                          {p.reviews?.[0] && (
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => handleOpenReview(p.reviews[0])}
                            >
                              Review Gate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 3: REVIEWER INBOX */}
      {activeTab === 'inbox' && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Gatekeeper & Reviewer Inbox
            </h3>
            <p className="text-xs text-gray-500">
              Assigned gate reviews requiring evaluation and formal sign-offs
            </p>
          </CardHeader>
          <CardBody>
            {reviewerInbox.length > 0 ? (
              <div className="space-y-4">
                {reviewerInbox.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.review?.governance?.project?.name}
                        </span>
                        <Badge variant="warning">{item.role}</Badge>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Gate: {item.review?.gate?.name} &bull; Stage: {item.review?.stage?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Assigned: {new Date(item.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenReview(item.review)}
                    >
                      Conduct Evaluation
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Inbox className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Your Gatekeeper Inbox is Clear
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You have no pending decision gate reviews assigned to your profile.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 4: STAGE TEMPLATES */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Configured Stage-Gate Innovation Templates
            </h3>
            <p className="text-xs text-gray-500">
              Manage phase counts, gate definitions, and approval policies
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {tmpl.name}
                        </h4>
                        {tmpl.isDefault && <Badge variant="primary">Default Template</Badge>}
                        <span className="text-xs text-gray-400">v{tmpl.version}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{tmpl.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {tmpl.stages?.length || 0} Stages Configured
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {tmpl.stages?.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                        style={{ backgroundColor: `${s.color}20`, color: s.color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.stageNumber}. {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* MODAL: GATE REVIEW & EVALUATION DRAWER */}
      {isReviewModalOpen && activeReview && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Gate Review: ${activeReview.gate?.name || 'Decision Gate'}`}
          size="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Status */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">Stage:</span>{' '}
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {activeReview.stage?.name}
                </span>
              </div>
              <div>{getStatusBadge(activeReview.status)}</div>
            </div>

            {/* Evidence Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                  Supporting Research Evidence
                </h4>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsEvidenceModalOpen(true)}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Attach Evidence
                </Button>
              </div>

              {activeReview.evidence?.length > 0 ? (
                <div className="space-y-2">
                  {activeReview.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <div>
                          <div className="text-xs font-semibold text-gray-900 dark:text-white">
                            {ev.title}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {ev.evidenceType} &bull; {new Date(ev.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success">Verified</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic py-2">
                  No evidence documents attached to this review cycle yet.
                </div>
              )}
            </div>

            {/* Individual Reviewer Sign-Offs */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-2">
                Recorded Reviewer Sign-Offs ({activeReview.signOffs?.length || 0})
              </h4>
              {activeReview.signOffs?.length > 0 ? (
                <div className="space-y-2">
                  {activeReview.signOffs.map((so) => (
                    <div
                      key={so.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700 flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {so.user?.name || 'Reviewer'}
                          </span>
                          <Badge
                            variant={
                              so.recommendation === 'APPROVE'
                                ? 'success'
                                : so.recommendation === 'REJECT'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {so.recommendation}
                          </Badge>
                        </div>
                        {so.comments && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                            "{so.comments}"
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(so.signedOffAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic py-2">
                  No evaluator sign-offs submitted for this gate yet.
                </div>
              )}
            </div>

            {/* Action 1: Submit Evaluator Sign-Off Form */}
            <form onSubmit={handleSubmitSignOff} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <h5 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                Submit Your Evaluator Recommendation
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Recommendation
                  </label>
                  <select
                    value={signOffRecommendation}
                    onChange={(e) => setSignOffRecommendation(e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-gray-800 border rounded"
                  >
                    <option value="APPROVE">APPROVE (Recommend GO)</option>
                    <option value="HOLD">HOLD (Recommend Pause)</option>
                    <option value="REWORK">REWORK (Recommend Corrections)</option>
                    <option value="REJECT">REJECT (Recommend Terminate)</option>
                    <option value="MORE_INFO">REQUEST MORE INFO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Comments / Feedback
                  </label>
                  <input
                    type="text"
                    value={signOffComments}
                    onChange={(e) => setSignOffComments(e.target.value)}
                    placeholder="Technical comments or observations..."
                    className="w-full text-xs p-2 bg-white dark:bg-gray-800 border rounded"
                  />
                </div>
              </div>
              <Button size="xs" variant="primary" type="submit" disabled={submittingAction}>
                Record My Sign-Off
              </Button>
            </form>

            {/* Action 2: Authoritative Final Decision Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Authoritative Gatekeeper Actions (Role-gated)
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDecisionModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Record Authoritative Gate Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: FINAL AUTHORITATIVE DECISION */}
      {isDecisionModalOpen && activeReview && (
        <Modal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          title="Authoritative Gate Decision"
          size="md"
        >
          <form onSubmit={handleRecordGateDecision} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Final Decision Outcome *
              </label>
              <select
                value={decisionOutcome}
                onChange={(e) => setDecisionOutcome(e.target.value)}
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="GO_CONTINUE">GO / CONTINUE &mdash; Advance to Next Stage</option>
                <option value="HOLD">HOLD &mdash; Suspend Progression Pending Resources</option>
                <option value="REWORK_RECYCLE">REWORK / RECYCLE &mdash; Return for Modifications</option>
                <option value="TERMINATE_KILL">TERMINATE / KILL &mdash; Stop Research Permanently</option>
                <option value="REQUEST_MORE_INFO">REQUEST MORE INFORMATION &mdash; Clarifications</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Mandatory Justification / Reason *
              </label>
              <textarea
                rows={3}
                required
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Document the technical rationale, experimental evidence, or business justification..."
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Additional Comments
              </label>
              <input
                type="text"
                value={decisionComments}
                onChange={(e) => setDecisionComments(e.target.value)}
                placeholder="Directives for project team..."
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingAction}>
                Commit Authoritative Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ATTACH EVIDENCE */}
      {isEvidenceModalOpen && activeReview && (
        <Modal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          title="Attach Research Evidence"
          size="md"
        >
          <form onSubmit={handleUploadEvidence} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Evidence Title *
              </label>
              <input
                type="text"
                required
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                placeholder="e.g. Lab XRD Diffraction Report v2"
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Evidence Type
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="DOCUMENT">Technical Document / PDF</option>
                  <option value="DATASET">Experimental Dataset</option>
                  <option value="REPORT">Test Summary Report</option>
                  <option value="URL">External Lab System Link</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Linked Criterion
                </label>
                <select
                  value={selectedCriterionId}
                  onChange={(e) => setSelectedCriterionId(e.target.value)}
                  className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">General Stage Evidence</option>
                  {activeReview.stage?.criteria?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Description / Abstract
              </label>
              <textarea
                rows={2}
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                placeholder="Summary of findings or lab test parameters..."
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsEvidenceModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingAction}>
                Attach Evidence
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: INITIALIZE PROJECT GOVERNANCE */}
      {isInitModalOpen && (
        <Modal
          isOpen={isInitModalOpen}
          onClose={() => setIsInitModalOpen(false)}
          title="Initialize Stage-Gate Governance"
          size="md"
        >
          <form onSubmit={handleInitGovernance} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Select R&D Project *
              </label>
              <select
                required
                value={initProjectId}
                onChange={(e) => setInitProjectId(e.target.value)}
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {eligibleProjects.length > 0 ? (
                  eligibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.budget || 0).toLocaleString()})
                    </option>
                  ))
                ) : (
                  <option value="">No ungoverned R&D projects found</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Stage-Gate Template
              </label>
              <select
                value={initTemplateId}
                onChange={(e) => setInitTemplateId(e.target.value)}
                className="w-full text-sm p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.stages?.length || 0} stages)
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500">
              The project will enter Stage 1 of the chosen template. An initial review cycle for Gate 1 will be generated automatically.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsInitModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={submittingAction || !initProjectId}
              >
                Start Stage-Gate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
