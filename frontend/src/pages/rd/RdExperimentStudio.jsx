import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlaskConical,
  Target,
  Lightbulb,
  TestTube,
  FileCode2,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  ClipboardList,
  Compass,
  ArrowRight,
  TrendingUp,
  FileText,
  Award,
  BookOpen,
  Sliders,
  CheckSquare,
  Activity,
  X
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
  ProgressBar
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdExperimentStudio = () => {
  const { addToast } = useToast();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('objectives'); // 'objectives' | 'hypotheses' | 'variables' | 'protocols' | 'experiments' | 'execution' | 'evidence'

  // Global State
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Domain Data States
  const [objectives, setObjectives] = useState([]);
  const [hypotheses, setHypotheses] = useState([]);
  const [variables, setVariables] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [stats, setStats] = useState(null);

  // Active Execution Run
  const [activeExperimentId, setActiveExperimentId] = useState('');
  const [activeRunId, setActiveRunId] = useState('');
  const [activeRunData, setActiveRunData] = useState(null);

  // Modals
  const [showObjModal, setShowObjModal] = useState(false);
  const [showHypModal, setShowHypModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedHypothesisForEval, setSelectedHypothesisForEval] = useState(null);
  const [showVarModal, setShowVarModal] = useState(false);
  const [showProtoModal, setShowProtoModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Form States
  const [objForm, setObjForm] = useState({
    title: '',
    description: '',
    researchQuestion: '',
    category: 'APPLIED_RESEARCH',
    priority: 'MEDIUM',
    targetDate: '',
    successCriteria: '',
  });

  const [hypForm, setHypForm] = useState({
    objectiveId: '',
    title: '',
    statement: '',
    scientificRationale: '',
    expectedOutcome: '',
    hypothesisType: 'ALTERNATIVE_HYPOTHESIS',
    priority: 'MEDIUM',
  });

  const [evalForm, setEvalForm] = useState({
    decision: 'SUPPORTED',
    evaluationSummary: '',
    supportingEvidence: '',
    contradictoryEvidence: '',
    conclusion: '',
  });

  const [varForm, setVarForm] = useState({
    name: '',
    description: '',
    variableType: 'INDEPENDENT',
    dataType: 'DECIMAL',
    unit: '',
    measurementMethod: '',
    expectedValue: '',
    minValue: '',
    maxValue: '',
    isRequired: true,
  });

  const [protoForm, setProtoForm] = useState({
    title: '',
    methodology: '',
    safetyInstructions: '',
    requiredMaterials: '',
    estimatedDurationMinutes: 60,
    isTemplate: true,
    stepsText: '1. Prepare reagent and sample\n2. Calibrate sensor\n3. Record baseline temperature\n4. Apply stimulus and observe change',
  });

  const [expForm, setExpForm] = useState({
    objectiveId: '',
    hypothesisId: '',
    protocolId: '',
    title: '',
    description: '',
    experimentType: 'LABORATORY',
    priority: 'MEDIUM',
    temperature: '25°C',
    pressure: '1 atm',
    humidity: '45%',
  });

  const [obsForm, setObsForm] = useState({
    title: '',
    description: '',
    observationType: 'GENERAL',
  });

  const [measForm, setMeasForm] = useState({
    variableId: '',
    recordedValue: '',
    measurementMethod: 'Direct Digital Gauge',
    notes: '',
  });

  const [resForm, setResForm] = useState({
    summary: '',
    keyFindings: '',
    expectedVsActual: '',
    researcherConclusion: '',
    isSuccessCriteriaMet: true,
  });

  // 1. Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get('/rd/portfolio');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.projects) ? res.data.projects : []);
        if (list.length > 0) {
          setProjects(list);
          if (!selectedProjectId) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    fetchProjects();
  }, [selectedProjectId]);

  // 2. Fetch Module Data for Selected Project
  const fetchStudioData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const [objRes, hypRes, varRes, protoRes, expRes, statsRes, eviRes, outRes] = await Promise.all([
        apiClient.get(`/rd/objectives?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/hypotheses?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/variables?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/protocols?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/experiments?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/experiments/stats?projectId=${selectedProjectId}`).catch(() => ({ data: null })),
        apiClient.get(`/rd/evidence?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
        apiClient.get(`/rd/outcomes?projectId=${selectedProjectId}`).catch(() => ({ data: [] })),
      ]);

      setObjectives(objRes.data || []);
      setHypotheses(hypRes.data || []);
      setVariables(varRes.data || []);
      setProtocols(protoRes.data || []);
      setExperiments(expRes.data || []);
      setStats(statsRes.data || null);
      setEvidences(eviRes.data || []);
      setOutcomes(outRes.data || []);

      if (expRes.data && expRes.data.length > 0 && !activeExperimentId) {
        setActiveExperimentId(expRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch studio data:', err);
      addToast({ title: 'Error', message: 'Failed to load research data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, activeExperimentId, addToast]);

  useEffect(() => {
    fetchStudioData();
  }, [fetchStudioData]);

  // 3. Fetch Active Run Details
  const fetchActiveRun = useCallback(async (runId) => {
    if (!runId) {
      setActiveRunData(null);
      return;
    }
    try {
      const res = await apiClient.get(`/rd/runs/${runId}`);
      if (res.success && res.data) {
        setActiveRunData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch run details:', err);
    }
  }, []);

  useEffect(() => {
    if (activeRunId) {
      fetchActiveRun(activeRunId);
    }
  }, [activeRunId, fetchActiveRun]);

  // Handler: Create Research Objective
  const handleCreateObjective = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/rd/objectives', {
        projectId: selectedProjectId,
        ...objForm,
      });
      if (res.success) {
        addToast({ title: 'Success', message: 'Research objective defined successfully.', type: 'success' });
        setShowObjModal(false);
        setObjForm({
          title: '',
          description: '',
          researchQuestion: '',
          category: 'APPLIED_RESEARCH',
          priority: 'MEDIUM',
          targetDate: '',
          successCriteria: '',
        });
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to create objective', type: 'error' });
    }
  };

  // Handler: Create Hypothesis
  const handleCreateHypothesis = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/rd/hypotheses', {
        projectId: selectedProjectId,
        ...hypForm,
      });
      if (res.success) {
        addToast({ title: 'Success', message: 'Research hypothesis formulated.', type: 'success' });
        setShowHypModal(false);
        setHypForm({
          objectiveId: '',
          title: '',
          statement: '',
          scientificRationale: '',
          expectedOutcome: '',
          hypothesisType: 'ALTERNATIVE_HYPOTHESIS',
          priority: 'MEDIUM',
        });
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to formulate hypothesis', type: 'error' });
    }
  };

  // Handler: Evaluate Hypothesis
  const handleEvaluateHypothesis = async (e) => {
    e.preventDefault();
    if (!selectedHypothesisForEval) return;
    try {
      const res = await apiClient.post(`/rd/hypotheses/${selectedHypothesisForEval.id}/evaluate`, evalForm);
      if (res.success) {
        addToast({ title: 'Evaluation Recorded', message: `Hypothesis verdict: ${evalForm.decision}`, type: 'success' });
        setShowEvalModal(false);
        setSelectedHypothesisForEval(null);
        setEvalForm({
          decision: 'SUPPORTED',
          evaluationSummary: '',
          supportingEvidence: '',
          contradictoryEvidence: '',
          conclusion: '',
        });
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Evaluation Error', message: err.message, type: 'error' });
    }
  };

  // Handler: Create Variable
  const handleCreateVariable = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/rd/variables', {
        projectId: selectedProjectId,
        ...varForm,
        minValue: varForm.minValue ? parseFloat(varForm.minValue) : null,
        maxValue: varForm.maxValue ? parseFloat(varForm.maxValue) : null,
      });
      if (res.success) {
        addToast({ title: 'Success', message: 'Variable defined in library.', type: 'success' });
        setShowVarModal(false);
        setVarForm({
          name: '',
          description: '',
          variableType: 'INDEPENDENT',
          dataType: 'DECIMAL',
          unit: '',
          measurementMethod: '',
          expectedValue: '',
          minValue: '',
          maxValue: '',
          isRequired: true,
        });
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to define variable', type: 'error' });
    }
  };

  // Handler: Create Protocol
  const handleCreateProtocol = async (e) => {
    e.preventDefault();
    try {
      const rawSteps = protoForm.stepsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line, idx) => ({
          stepNumber: idx + 1,
          title: line.replace(/^[0-9]+\.\s*/, ''),
          instructions: line,
        }));

      const res = await apiClient.post('/rd/protocols', {
        projectId: selectedProjectId,
        title: protoForm.title,
        methodology: protoForm.methodology,
        safetyInstructions: protoForm.safetyInstructions,
        requiredMaterials: protoForm.requiredMaterials,
        estimatedDurationMinutes: parseInt(protoForm.estimatedDurationMinutes, 10),
        isTemplate: protoForm.isTemplate,
        steps: rawSteps,
      });

      if (res.success) {
        addToast({ title: 'Success', message: 'Protocol SOP created with steps.', type: 'success' });
        setShowProtoModal(false);
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to create protocol', type: 'error' });
    }
  };

  // Handler: Plan Experiment
  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    try {
      const conditions = {
        temperature: expForm.temperature,
        pressure: expForm.pressure,
        humidity: expForm.humidity,
      };

      const res = await apiClient.post('/rd/experiments', {
        projectId: selectedProjectId,
        objectiveId: expForm.objectiveId || null,
        hypothesisId: expForm.hypothesisId || null,
        protocolId: expForm.protocolId || null,
        title: expForm.title,
        description: expForm.description,
        experimentType: expForm.experimentType,
        priority: expForm.priority,
        experimentalConditions: conditions,
        status: 'READY',
      });

      if (res.success) {
        addToast({ title: 'Experiment Planned', message: 'Experiment is ready for execution.', type: 'success' });
        setShowExpModal(false);
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to plan experiment', type: 'error' });
    }
  };

  // Handler: Launch Experiment Run
  const handleLaunchRun = async () => {
    if (!activeExperimentId) {
      addToast({ title: 'Notice', message: 'Please select an experiment first.', type: 'warning' });
      return;
    }
    try {
      const res = await apiClient.post(`/rd/experiments/${activeExperimentId}/runs`, {
        status: 'IN_PROGRESS',
        notes: 'Laboratory bench test run initialized',
      });
      if (res.success && res.data) {
        addToast({ title: 'Run Initialized', message: `Launched ${res.data.runCode}`, type: 'success' });
        setActiveRunId(res.data.id);
        fetchStudioData();
      }
    } catch (err) {
      addToast({ title: 'Execution Error', message: err.message, type: 'error' });
    }
  };

  // Handler: Complete Run Step
  const handleCompleteStep = async (stepId) => {
    try {
      const res = await apiClient.post(`/rd/runs/steps/${stepId}/complete`, { notes: 'Step verified on bench' });
      if (res.success) {
        addToast({ title: 'Step Completed', message: 'Protocol step completed successfully.', type: 'success' });
        fetchActiveRun(activeRunId);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Handler: Record Observation
  const handleRecordObservation = async (e) => {
    e.preventDefault();
    if (!activeRunId) return;
    try {
      const res = await apiClient.post(`/rd/runs/${activeRunId}/observations`, obsForm);
      if (res.success) {
        addToast({ title: 'Observation Logged', message: obsForm.title, type: 'success' });
        setShowObsModal(false);
        setObsForm({ title: '', description: '', observationType: 'GENERAL' });
        fetchActiveRun(activeRunId);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Handler: Record Measurement
  const handleRecordMeasurement = async (e) => {
    e.preventDefault();
    if (!activeRunId) return;
    try {
      const res = await apiClient.post(`/rd/runs/${activeRunId}/measurements`, measForm);
      if (res.success) {
        addToast({ title: 'Measurement Logged', message: `Recorded value: ${measForm.recordedValue}`, type: 'success' });
        setShowMeasModal(false);
        setMeasForm({ variableId: '', recordedValue: '', measurementMethod: 'Direct Digital Gauge', notes: '' });
        fetchActiveRun(activeRunId);
      }
    } catch (err) {
      addToast({ title: 'Measurement Validation Failed', message: err.message, type: 'error' });
    }
  };

  // Handler: Record Result
  const handleRecordResult = async (e) => {
    e.preventDefault();
    if (!activeExperimentId) return;
    try {
      const res = await apiClient.post(`/rd/experiments/${activeExperimentId}/results`, {
        runId: activeRunId || null,
        ...resForm,
      });
      if (res.success) {
        addToast({ title: 'Result Documented', message: 'Experimental outcome saved.', type: 'success' });
        setShowResultModal(false);
        setResForm({
          summary: '',
          keyFindings: '',
          expectedVsActual: '',
          researcherConclusion: '',
          isSuccessCriteriaMet: true,
        });
        fetchStudioData();
        if (activeRunId) fetchActiveRun(activeRunId);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Sub-Tab Switcher
  const subTabs = [
    { id: 'objectives', label: `Objectives (${objectives.length})`, icon: Target },
    { id: 'hypotheses', label: `Hypotheses (${hypotheses.length})`, icon: Lightbulb },
    { id: 'variables', label: `Variables (${variables.length})`, icon: Sliders },
    { id: 'protocols', label: `Protocols (${protocols.length})`, icon: FileCode2 },
    { id: 'experiments', label: `Experiments (${experiments.length})`, icon: TestTube },
    { id: 'execution', label: 'Run Execution Bench', icon: Play },
    { id: 'evidence', label: `Evidence & Outcomes (${evidences.length})`, icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Scientific Research & Experiment Studio
            </h2>
            <Badge variant="primary">Master Prompt 07</Badge>
          </div>
          <p className="text-xs text-secondary" style={{ margin: '0.25rem 0 0' }}>
            Empirical scientific lifecycle: Objectives → Hypotheses → Variables → Protocols → Experiment Runs → Measurements → Evidence
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchStudioData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* 2. Scientific Telemetry KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Research Objectives"
          value={objectives.length}
          icon={Target}
          trend={{ value: `${objectives.filter((o) => o.status === 'COMPLETED').length} Completed`, isPositive: true }}
        />
        <KPICard
          title="Hypotheses Evaluated"
          value={hypotheses.filter((h) => ['SUPPORTED', 'NOT_SUPPORTED'].includes(h.status)).length}
          icon={Lightbulb}
          trend={{ value: `${hypotheses.filter((h) => h.status === 'SUPPORTED').length} Supported`, isPositive: true }}
        />
        <KPICard
          title="Experiments Planned"
          value={experiments.length}
          icon={TestTube}
          trend={{ value: `${experiments.filter((e) => e.status === 'COMPLETED').length} Completed`, isPositive: true }}
        />
        <KPICard
          title="Laboratory Runs"
          value={stats?.runs?.total || 0}
          icon={Activity}
          trend={{ value: `${stats?.runs?.completed || 0} Finished`, isPositive: true }}
        />
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 8, overflowX: 'auto' }}>
        {subTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--primary-subtle)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: RESEARCH OBJECTIVES (REQ 26)
         ========================================================================= */}
      {activeTab === 'objectives' && (
        <Card>
          <CardHeader
            title="Research Objectives"
            subtitle="Strategic questions and investigational goals driving the research project"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowObjModal(true)}>
                Define Objective
              </Button>
            }
          />
          <CardBody className="p-0">
            {objectives.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No research objectives defined for this project yet. Click "Define Objective" to establish an investigational target.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Objective & Question</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Target Date</TableCell>
                    <TableCell>Progress Rollup</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objectives.map((obj) => (
                    <TableRow key={obj.id}>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{obj.title}</div>
                        {obj.researchQuestion && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                            Q: {obj.researchQuestion}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: 4 }}>
                          {obj.metrics.totalHypotheses} hypotheses • {obj.metrics.totalExperiments} experiments
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{obj.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={obj.priority === 'HIGH' || obj.priority === 'URGENT' ? 'danger' : 'neutral'}>
                          {obj.priority}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px' }}>
                        {obj.targetDate ? new Date(obj.targetDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ProgressBar value={obj.progress} style={{ flex: 1 }} />
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{obj.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            obj.status === 'COMPLETED'
                              ? 'success'
                              : obj.status === 'ACTIVE'
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {obj.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 2: HYPOTHESES (REQ 27)
         ========================================================================= */}
      {activeTab === 'hypotheses' && (
        <Card>
          <CardHeader
            title="Scientific Hypotheses & Evidence Evaluation"
            subtitle="Formal falsifiable propositions evaluated against empirical observations"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowHypModal(true)}>
                Formulate Hypothesis
              </Button>
            }
          />
          <CardBody className="p-0">
            {hypotheses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hypotheses formulated yet. Click "Formulate Hypothesis" to add a scientific statement.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Hypothesis Code & Title</TableCell>
                    <TableCell>Formal Statement</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status / Verdict</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hypotheses.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell style={{ minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                            {h.hypothesisCode || 'HYP'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{h.title}</div>
                        {h.objective && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>
                            Obj: {h.objective.title}
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ maxWidth: 320, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        "{h.statement}"
                        {h.evaluationSummary && (
                          <div style={{ marginTop: 4, padding: 6, borderRadius: 4, backgroundColor: 'var(--surface-raised)', fontSize: '11px', color: 'var(--text-primary)' }}>
                            <strong>Verdict Summary:</strong> {h.evaluationSummary}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{h.hypothesisType.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            h.status === 'SUPPORTED'
                              ? 'success'
                              : h.status === 'NOT_SUPPORTED'
                              ? 'danger'
                              : h.status === 'INCONCLUSIVE'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Award}
                          onClick={() => {
                            setSelectedHypothesisForEval(h);
                            setEvalForm({
                              decision: ['SUPPORTED', 'NOT_SUPPORTED', 'INCONCLUSIVE'].includes(h.status) ? h.status : 'SUPPORTED',
                              evaluationSummary: h.evaluationSummary || '',
                              supportingEvidence: h.supportingEvidence || '',
                              contradictoryEvidence: h.contradictoryEvidence || '',
                              conclusion: h.conclusion || '',
                            });
                            setShowEvalModal(true);
                          }}
                        >
                          Evaluate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 3: SCIENTIFIC VARIABLES (REQ 28)
         ========================================================================= */}
      {activeTab === 'variables' && (
        <Card>
          <CardHeader
            title="Scientific Variables Library"
            subtitle="Standardized Independent, Dependent, and Controlled parameters with unit bounds"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowVarModal(true)}>
                Define Variable
              </Button>
            }
          />
          <CardBody className="p-0">
            {variables.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No variables registered in the library. Define independent, dependent, and controlled variables for measurement validation.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Variable Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Unit of Measure</TableCell>
                    <TableCell>Validation Range</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variables.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</div>
                        {v.description && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.description}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            v.variableType === 'INDEPENDENT'
                              ? 'primary'
                              : v.variableType === 'DEPENDENT'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {v.variableType}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', fontWeight: 600 }}>{v.dataType}</TableCell>
                      <TableCell style={{ fontSize: '12px' }}>{v.unit || '—'}</TableCell>
                      <TableCell style={{ fontSize: '12px' }}>
                        {v.minValue !== null && v.maxValue !== null ? `[${v.minValue} to ${v.maxValue}]` : 'Any Valid Numeric'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 4: EXPERIMENT PROTOCOLS (REQ 28, 63)
         ========================================================================= */}
      {activeTab === 'protocols' && (
        <Card>
          <CardHeader
            title="Experiment Protocols & Standard Operating Procedures (SOPs)"
            subtitle="Reusable versioned methodologies with ordered step checklists"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowProtoModal(true)}>
                Create Protocol SOP
              </Button>
            }
          />
          <CardBody className="p-0">
            {protocols.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No protocols available. Click "Create Protocol SOP" to define a step-by-step methodology.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {protocols.map((p) => (
                  <Card key={p.id} style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <CardHeader
                      title={p.title}
                      subtitle={`${p.protocolCode || 'PRT'} • Version ${p.version}`}
                      action={<Badge variant={p.isTemplate ? 'primary' : 'neutral'}>{p.isTemplate ? 'Template' : 'Specific'}</Badge>}
                    />
                    <CardBody className="pt-0 flex flex-col gap-2">
                      {p.methodology && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{p.methodology}</p>}
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                        Ordered Protocol Steps ({p.steps ? p.steps.length : 0}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(p.steps || []).map((step) => (
                          <div
                            key={step.id || step.stepNumber}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 8px',
                              borderRadius: 4,
                              backgroundColor: 'var(--surface)',
                              fontSize: '11px',
                            }}
                          >
                            <Badge variant="neutral" style={{ padding: '2px 6px', fontSize: '10px' }}>
                              #{step.stepNumber}
                            </Badge>
                            <span>{step.title}</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 5: EXPERIMENTS & PLANNING (REQ 28, 29)
         ========================================================================= */}
      {activeTab === 'experiments' && (
        <Card>
          <CardHeader
            title="Experiment Plans & Design Configurations"
            subtitle="Hypothesis tests linking variables, protocols, environmental conditions, and run history"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowExpModal(true)}>
                Plan Experiment
              </Button>
            }
          />
          <CardBody className="p-0">
            {experiments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No experiments planned for this project yet. Click "Plan Experiment" to set up an empirical run.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Code & Title</TableCell>
                    <TableCell>Hypothesis Tested</TableCell>
                    <TableCell>Protocol & Type</TableCell>
                    <TableCell>Runs Executed</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                          {exp.experimentCode || 'EXP'}
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exp.title}</div>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px' }}>
                        {exp.hypothesis ? exp.hypothesis.title : '— Independent Exploratory —'}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{exp.protocol ? exp.protocol.title : 'Standard Bench'}</div>
                        <Badge variant="neutral" style={{ marginTop: 2 }}>{exp.experimentType}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px' }}>
                        <span style={{ fontWeight: 700 }}>{exp.runMetrics?.totalRuns || 0}</span> runs ({exp.runMetrics?.completedRuns || 0} completed)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exp.status === 'COMPLETED'
                              ? 'success'
                              : exp.status === 'IN_PROGRESS'
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Play}
                          onClick={() => {
                            setActiveExperimentId(exp.id);
                            setActiveTab('execution');
                          }}
                        >
                          Bench Execute
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          TAB 6: RUN EXECUTION BENCH (REQ 29, 63)
         ========================================================================= */}
      {activeTab === 'execution' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Laboratory Bench Execution"
              subtitle="Live execution checklist, protocol step completion, real-time measurements, and observations"
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" size="sm" icon={Play} onClick={handleLaunchRun}>
                    Launch New Run
                  </Button>
                </div>
              }
            />
            <CardBody>
              {/* Select Active Experiment & Run */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Active Experiment
                  </label>
                  <select
                    value={activeExperimentId}
                    onChange={(e) => {
                      setActiveExperimentId(e.target.value);
                      setActiveRunId('');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface-raised)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {experiments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.experimentCode} - {e.title}
                      </option>
                    ))}
                  </select>
                </div>

                {activeExperimentId && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Select Run
                    </label>
                    <select
                      value={activeRunId}
                      onChange={(e) => setActiveRunId(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-raised)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">-- Choose Run --</option>
                      {(experiments.find((e) => e.id === activeExperimentId)?.runs || []).map((r) => (
                        <option key={r.id} value={r.id}>
                          Run #{r.runNumber} ({r.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Active Run Workspace */}
              {activeRunData ? (
                <div className="flex flex-col gap-6">
                  {/* Status Banner */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 8,
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {activeRunData.runCode} • {activeRunData.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Protocol v{activeRunData.protocolVersion} • Started: {activeRunData.startedAt ? new Date(activeRunData.startedAt).toLocaleTimeString() : 'Not started'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge variant={activeRunData.status === 'COMPLETED' ? 'success' : 'primary'}>
                        {activeRunData.status}
                      </Badge>
                      {activeRunData.status !== 'COMPLETED' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={async () => {
                            await apiClient.post(`/rd/runs/${activeRunData.id}/status`, { status: 'COMPLETED' });
                            fetchActiveRun(activeRunData.id);
                            addToast({ title: 'Run Completed', message: 'Run marked as completed.', type: 'success' });
                          }}
                        >
                          Complete Run
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Pane: Protocol Checklist Steps */}
                    <Card style={{ backgroundColor: 'var(--surface)' }}>
                      <CardHeader title="Protocol Checklist Steps" subtitle="Mark steps as executed on bench" />
                      <CardBody className="flex flex-col gap-2 pt-0">
                        {(activeRunData.runSteps || []).map((step) => (
                          <div
                            key={step.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 6,
                              backgroundColor: step.isCompleted ? 'var(--primary-subtle)' : 'var(--surface-raised)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Badge variant={step.isCompleted ? 'success' : 'neutral'}>
                                #{step.stepNumber}
                              </Badge>
                              <span style={{ fontSize: '12px', fontWeight: step.isCompleted ? 700 : 500 }}>
                                {step.title}
                              </span>
                            </div>
                            {!step.isCompleted ? (
                              <Button variant="outline" size="sm" onClick={() => handleCompleteStep(step.id)}>
                                Complete Step
                              </Button>
                            ) : (
                              <Badge variant="success">Completed</Badge>
                            )}
                          </div>
                        ))}
                      </CardBody>
                    </Card>

                    {/* Right Pane: Observations & Measurements */}
                    <div className="flex flex-col gap-4">
                      {/* Measurements Section */}
                      <Card style={{ backgroundColor: 'var(--surface)' }}>
                        <CardHeader
                          title="Quantitative Measurements"
                          subtitle="Recorded values validated by variable definition"
                          action={
                            <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowMeasModal(true)}>
                              Log Measurement
                            </Button>
                          }
                        />
                        <CardBody className="pt-0">
                          {(activeRunData.measurements || []).length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No measurements recorded yet.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {activeRunData.measurements.map((m) => (
                                <div
                                  key={m.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    backgroundColor: 'var(--surface-raised)',
                                    fontSize: '12px',
                                  }}
                                >
                                  <div>
                                    <strong>{m.variableNameSnapshot}:</strong> {m.recordedValue} {m.unitSnapshot || ''}
                                  </div>
                                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                    {new Date(m.measurementTime).toLocaleTimeString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>

                      {/* Observations Section */}
                      <Card style={{ backgroundColor: 'var(--surface)' }}>
                        <CardHeader
                          title="Qualitative Observations"
                          subtitle="Bench notes and unexpected visual phenomena"
                          action={
                            <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowObsModal(true)}>
                              Log Note
                            </Button>
                          }
                        />
                        <CardBody className="pt-0">
                          {(activeRunData.observations || []).length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No observations recorded.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {activeRunData.observations.map((obs) => (
                                <div
                                  key={obs.id}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: 4,
                                    backgroundColor: 'var(--surface-raised)',
                                    fontSize: '11px',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                    <span>{obs.title}</span>
                                    <Badge variant="neutral" style={{ fontSize: '9px' }}>{obs.observationType}</Badge>
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{obs.description}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>

                      {/* Document Final Results */}
                      <Button variant="primary" icon={Award} onClick={() => setShowResultModal(true)}>
                        Document Experiment Result
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Select an experiment and run above, or click "Launch New Run" to start bench execution.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 7: EVIDENCE & OUTCOMES (REQ 25)
         ========================================================================= */}
      {activeTab === 'evidence' && (
        <Card>
          <CardHeader
            title="Scientific Evidence Vault & Research Outcomes"
            subtitle="Auditable evidence items and formally documented research discoveries"
          />
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
              {/* Evidence Records */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Traceable Evidence Items ({evidences.length})
                </h4>
                {evidences.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No evidence records registered yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {evidences.map((evi) => (
                      <div
                        key={evi.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>{evi.title}</span>
                          <Badge variant="success">{evi.evidenceType}</Badge>
                        </div>
                        {evi.description && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: 2 }}>
                            {evi.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Research Outcomes */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Documented Outcomes ({outcomes.length})
                </h4>
                {outcomes.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No formal outcomes documented yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {outcomes.map((out) => (
                      <div
                        key={out.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>{out.title}</span>
                          <Badge variant="primary">{out.outcomeCategory}</Badge>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: 2 }}>
                          {out.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* =========================================================================
          MODAL: CREATE OBJECTIVE
         ========================================================================= */}
      {showObjModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 480, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Define Research Objective</h3>
              <button onClick={() => setShowObjModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateObjective} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Title *</label>
                <input
                  type="text"
                  required
                  value={objForm.title}
                  onChange={(e) => setObjForm({ ...objForm, title: e.target.value })}
                  placeholder="e.g. Evaluate Ceramic Tensile Failure Modes"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Research Question</label>
                <input
                  type="text"
                  value={objForm.researchQuestion}
                  onChange={(e) => setObjForm({ ...objForm, researchQuestion: e.target.value })}
                  placeholder="What empirical question is being answered?"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Category</label>
                  <select
                    value={objForm.category}
                    onChange={(e) => setObjForm({ ...objForm, category: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="BASIC_RESEARCH">Basic Research</option>
                    <option value="APPLIED_RESEARCH">Applied Research</option>
                    <option value="EXPERIMENTAL_DEVELOPMENT">Experimental Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Priority</label>
                  <select
                    value={objForm.priority}
                    onChange={(e) => setObjForm({ ...objForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Target Date</label>
                <input
                  type="date"
                  value={objForm.targetDate}
                  onChange={(e) => setObjForm({ ...objForm, targetDate: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowObjModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Objective</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EVALUATE HYPOTHESIS
         ========================================================================= */}
      {showEvalModal && selectedHypothesisForEval && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 500, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Formal Hypothesis Evaluation</h3>
              <button onClick={() => setShowEvalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Evaluating: <span style={{ color: 'var(--text-primary)' }}>{selectedHypothesisForEval.title}</span>
            </div>
            <form onSubmit={handleEvaluateHypothesis} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Evaluation Decision *</label>
                <select
                  value={evalForm.decision}
                  onChange={(e) => setEvalForm({ ...evalForm, decision: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  <option value="SUPPORTED">SUPPORTED (Empirical Data Confirms)</option>
                  <option value="NOT_SUPPORTED">NOT SUPPORTED (Data Refutes Statement)</option>
                  <option value="INCONCLUSIVE">INCONCLUSIVE (Insufficient Evidence)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Evaluation Summary *</label>
                <textarea
                  required
                  rows={2}
                  value={evalForm.evaluationSummary}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluationSummary: e.target.value })}
                  placeholder="Summary of experimental findings..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Supporting Evidence</label>
                <input
                  type="text"
                  value={evalForm.supportingEvidence}
                  onChange={(e) => setEvalForm({ ...evalForm, supportingEvidence: e.target.value })}
                  placeholder="Data runs or measurements that support this conclusion"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowEvalModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Record Formal Evaluation</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FORMULATE HYPOTHESIS
         ========================================================================= */}
      {showHypModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 480, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Formulate Hypothesis</h3>
              <button onClick={() => setShowHypModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateHypothesis} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Title *</label>
                <input
                  type="text"
                  required
                  value={hypForm.title}
                  onChange={(e) => setHypForm({ ...hypForm, title: e.target.value })}
                  placeholder="e.g. Sintering Heat Influence on Grain Boundary"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Formal Statement *</label>
                <textarea
                  required
                  rows={2}
                  value={hypForm.statement}
                  onChange={(e) => setHypForm({ ...hypForm, statement: e.target.value })}
                  placeholder="If [Independent Variable] increases, then [Dependent Variable] will..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Hypothesis Type</label>
                  <select
                    value={hypForm.hypothesisType}
                    onChange={(e) => setHypForm({ ...hypForm, hypothesisType: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="ALTERNATIVE_HYPOTHESIS">Alternative Hypothesis</option>
                    <option value="NULL_HYPOTHESIS">Null Hypothesis</option>
                    <option value="DIRECTIONAL_HYPOTHESIS">Directional Hypothesis</option>
                    <option value="NON_DIRECTIONAL_HYPOTHESIS">Non-Directional</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Link to Objective</label>
                  <select
                    value={hypForm.objectiveId}
                    onChange={(e) => setHypForm({ ...hypForm, objectiveId: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- None (General) --</option>
                    {objectives.map((o) => (
                      <option key={o.id} value={o.id}>{o.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowHypModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Formulate Hypothesis</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DEFINE VARIABLE
         ========================================================================= */}
      {showVarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 480, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Register Scientific Variable</h3>
              <button onClick={() => setShowVarModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateVariable} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Variable Name *</label>
                <input
                  type="text"
                  required
                  value={varForm.name}
                  onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                  placeholder="e.g. Sintering Temperature"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Variable Role</label>
                  <select
                    value={varForm.variableType}
                    onChange={(e) => setVarForm({ ...varForm, variableType: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="INDEPENDENT">Independent (Controlled Factor)</option>
                    <option value="DEPENDENT">Dependent (Measured Outcome)</option>
                    <option value="CONTROLLED">Controlled (Held Constant)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Data Type</label>
                  <select
                    value={varForm.dataType}
                    onChange={(e) => setVarForm({ ...varForm, dataType: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="DECIMAL">Decimal Float</option>
                    <option value="INTEGER">Integer</option>
                    <option value="TEXT">Text</option>
                    <option value="BOOLEAN">Boolean</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Unit</label>
                  <input
                    type="text"
                    value={varForm.unit}
                    onChange={(e) => setVarForm({ ...varForm, unit: e.target.value })}
                    placeholder="e.g. °C, MPa, kg"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Min Bound</label>
                  <input
                    type="number"
                    value={varForm.minValue}
                    onChange={(e) => setVarForm({ ...varForm, minValue: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Max Bound</label>
                  <input
                    type="number"
                    value={varForm.maxValue}
                    onChange={(e) => setVarForm({ ...varForm, maxValue: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowVarModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Variable</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LOG MEASUREMENT
         ========================================================================= */}
      {showMeasModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 440, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Log Bench Measurement</h3>
              <button onClick={() => setShowMeasModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleRecordMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Variable</label>
                <select
                  value={measForm.variableId}
                  onChange={(e) => setMeasForm({ ...measForm, variableId: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Custom Metric --</option>
                  {variables.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.unit || v.dataType})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Recorded Value *</label>
                <input
                  type="text"
                  required
                  value={measForm.recordedValue}
                  onChange={(e) => setMeasForm({ ...measForm, recordedValue: e.target.value })}
                  placeholder="e.g. 1420.5"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowMeasModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Record Measurement</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LOG OBSERVATION
         ========================================================================= */}
      {showObsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 440, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Record Qualitative Observation</h3>
              <button onClick={() => setShowObsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleRecordObservation} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Title *</label>
                <input
                  type="text"
                  required
                  value={obsForm.title}
                  onChange={(e) => setObsForm({ ...obsForm, title: e.target.value })}
                  placeholder="e.g. Micro-cracking along boundary"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Description *</label>
                <textarea
                  required
                  rows={3}
                  value={obsForm.description}
                  onChange={(e) => setObsForm({ ...obsForm, description: e.target.value })}
                  placeholder="Detailed visual inspection notes..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowObsModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Note</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DOCUMENT EXPERIMENT RESULT
         ========================================================================= */}
      {showResultModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 8, width: 500, maxWidth: '90%', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Document Experiment Result</h3>
              <button onClick={() => setShowResultModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleRecordResult} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Result Summary *</label>
                <textarea
                  required
                  rows={2}
                  value={resForm.summary}
                  onChange={(e) => setResForm({ ...resForm, summary: e.target.value })}
                  placeholder="Executive result summary..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: 2 }}>Researcher Conclusion</label>
                <input
                  type="text"
                  value={resForm.researcherConclusion}
                  onChange={(e) => setResForm({ ...resForm, researcherConclusion: e.target.value })}
                  placeholder="Empirical scientific conclusion..."
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="chkSuccess"
                  checked={resForm.isSuccessCriteriaMet}
                  onChange={(e) => setResForm({ ...resForm, isSuccessCriteriaMet: e.target.checked })}
                />
                <label htmlFor="chkSuccess" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Pre-defined Success Criteria Met
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="outline" type="button" onClick={() => setShowResultModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Document Result</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
