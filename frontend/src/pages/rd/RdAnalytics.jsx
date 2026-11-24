import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  FileText,
  Layers,
  Filter,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Edit2,
  History,
  Check,
  X
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  KPICard,
  Tabs,
  Modal
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export const RdAnalytics = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  // Active analytics tab: 'executive' | 'portfolio' | 'execution' | 'financial' | 'innovation' | 'kpis' | 'reports'
  const [activeTab, setActiveTab] = useState('executive');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Data States
  const [executiveData, setExecutiveData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [executionData, setExecutionData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [innovationData, setInnovationData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('PORTFOLIO_SUMMARY');

  // Filters
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    category: '',
    search: '',
  });

  // KPI Edit Modal
  const [editingKpi, setEditingKpi] = useState(null);
  const [kpiTargetVal, setKpiTargetVal] = useState('');
  const [kpiHistory, setKpiHistory] = useState([]);
  const [historyModalKpi, setHistoryModalKpi] = useState(null);

  // Dashboard Preferences & Customizer Drawer
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [layoutWidgets, setLayoutWidgets] = useState([]);
  const [isCustomLayout, setIsCustomLayout] = useState(false);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const fetchExecutive = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/analytics/executive');
      if (res.data?.success) setExecutiveData(res.data.data);
    } catch (err) {
      console.error('Error fetching executive metrics:', err);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      const res = await apiClient.get(`/rd/analytics/portfolio?${params.toString()}`);
      if (res.data?.success) setPortfolioData(res.data.data);
    } catch (err) {
      console.error('Error fetching portfolio analytics:', err);
    }
  }, [filters]);

  const fetchExecution = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/analytics/execution');
      if (res.data?.success) setExecutionData(res.data.data);
    } catch (err) {
      console.error('Error fetching execution analytics:', err);
    }
  }, []);

  const fetchFinancialAndResources = useCallback(async () => {
    try {
      const [finRes, resRes] = await Promise.all([
        apiClient.get('/rd/analytics/financial'),
        apiClient.get('/rd/analytics/resources'),
      ]);
      if (finRes.data?.success) setFinancialData(finRes.data.data);
      if (resRes.data?.success) setResourceData(resRes.data.data);
    } catch (err) {
      console.error('Error fetching financial/resource analytics:', err);
    }
  }, []);

  const fetchInnovationAndRisks = useCallback(async () => {
    try {
      const [inRes, rkRes] = await Promise.all([
        apiClient.get('/rd/analytics/innovation'),
        apiClient.get('/rd/analytics/risks-decisions'),
      ]);
      if (inRes.data?.success) setInnovationData(inRes.data.data);
      if (rkRes.data?.success) setRiskData(rkRes.data.data);
    } catch (err) {
      console.error('Error fetching innovation/risk analytics:', err);
    }
  }, []);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/analytics/kpis');
      if (res.data?.success) setKpis(res.data.data);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    }
  }, []);

  const fetchReport = useCallback(async (type) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/rd/analytics/reports?reportType=${type}`);
      if (res.data?.success) setReportData(res.data.data);
    } catch (err) {
      addToast('Failed to generate report preview', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/analytics/preferences?dashboardType=EXECUTIVE');
      if (res.data?.success) {
        setLayoutWidgets(res.data.data.layoutConfig || []);
        setIsCustomLayout(res.data.data.isCustom);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchExecutive(),
      fetchPortfolio(),
      fetchExecution(),
      fetchFinancialAndResources(),
      fetchInnovationAndRisks(),
      fetchKpis(),
      fetchPreferences(),
    ]).finally(() => setLoading(false));
  }, [
    fetchExecutive,
    fetchPortfolio,
    fetchExecution,
    fetchFinancialAndResources,
    fetchInnovationAndRisks,
    fetchKpis,
    fetchPreferences,
  ]);

  // Refetch portfolio when filters change
  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchPortfolio();
    }
  }, [filters, activeTab, fetchPortfolio]);

  // Load report preview when reports tab is opened
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport(selectedReportType);
    }
  }, [activeTab, selectedReportType, fetchReport]);

  // --------------------------------------------------------------------------
  // Recalculate KPIs
  // --------------------------------------------------------------------------
  const handleRecalculateKpis = async () => {
    try {
      setRecalculating(true);
      const res = await apiClient.post('/rd/analytics/kpis/recalculate');
      if (res.data?.success) {
        setKpis(res.data.data);
        addToast('All R&D KPIs recalculated from live database telemetry!', 'success');
        fetchExecutive();
      }
    } catch (err) {
      addToast('Failed to recalculate KPIs', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  // --------------------------------------------------------------------------
  // Update KPI Target
  // --------------------------------------------------------------------------
  const handleSaveKpiTarget = async () => {
    if (!editingKpi) return;
    try {
      const targetValNum = parseFloat(kpiTargetVal);
      if (isNaN(targetValNum)) {
        addToast('Please enter a valid numeric target value', 'warning');
        return;
      }
      const res = await apiClient.put(`/rd/analytics/kpis/${editingKpi.id}/target`, {
        targetValue: targetValNum,
      });
      if (res.data?.success) {
        addToast(`Target for ${editingKpi.code} updated successfully`, 'success');
        setEditingKpi(null);
        fetchKpis();
      }
    } catch (err) {
      addToast('Failed to update KPI target', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // View KPI History
  // --------------------------------------------------------------------------
  const handleViewHistory = async (kpi) => {
    try {
      setHistoryModalKpi(kpi);
      const res = await apiClient.get(`/rd/analytics/kpis/${kpi.id}/history`);
      if (res.data?.success) {
        setKpiHistory(res.data.data);
      }
    } catch (err) {
      addToast('Failed to fetch KPI history', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Export Report CSV
  // --------------------------------------------------------------------------
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await apiClient.get(
        `/rd/analytics/export/csv?reportType=${selectedReportType}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Egolytics_${selectedReportType.toLowerCase()}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('CSV export downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export CSV report', 'error');
    } finally {
      setExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Export Report JSON
  // --------------------------------------------------------------------------
  const handleExportJson = async () => {
    try {
      setExporting(true);
      const res = await apiClient.get(
        `/rd/analytics/export/json?reportType=${selectedReportType}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Egolytics_${selectedReportType.toLowerCase()}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('JSON export downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export JSON report', 'error');
    } finally {
      setExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save Dashboard Layout Preferences
  // --------------------------------------------------------------------------
  const handleToggleWidget = (widgetId) => {
    setLayoutWidgets((prev) =>
      prev.map((w) => (w.widgetId === widgetId ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleSavePreferences = async () => {
    try {
      const res = await apiClient.put('/rd/analytics/preferences', {
        dashboardType: 'EXECUTIVE',
        layoutConfig: layoutWidgets,
      });
      if (res.data?.success) {
        setIsCustomLayout(true);
        setShowCustomizer(false);
        addToast('Dashboard layout saved successfully', 'success');
      }
    } catch (err) {
      addToast('Failed to save layout preferences', 'error');
    }
  };

  const handleResetPreferences = async () => {
    try {
      const res = await apiClient.delete('/rd/analytics/preferences?dashboardType=EXECUTIVE');
      if (res.data?.success) {
        setLayoutWidgets(res.data.data.layoutConfig || []);
        setIsCustomLayout(false);
        setShowCustomizer(false);
        addToast('Dashboard layout restored to system default', 'info');
      }
    } catch (err) {
      addToast('Failed to reset layout preferences', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'ON_TRACK' || s === 'EXCEEDED' || s === 'COMPLETED' || s === 'DONE') {
      return <Badge variant="success">{status}</Badge>;
    }
    if (s === 'AT_RISK' || s === 'WARNING' || s === 'IN_PROGRESS') {
      return <Badge variant="warning">{status}</Badge>;
    }
    if (s === 'CRITICAL' || s === 'BLOCKED' || s === 'DELAYED') {
      return <Badge variant="danger">{status}</Badge>;
    }
    return <Badge variant="neutral">{status}</Badge>;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'UP') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
    if (trend === 'DOWN') return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-neutral-400" />;
  };

  // --------------------------------------------------------------------------
  // Sub-Navigation Tabs Config
  // --------------------------------------------------------------------------
  const analyticsTabs = [
    { id: 'executive', label: 'Executive Overview', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio Analytics', icon: Layers },
    { id: 'execution', label: 'Execution & Sprints', icon: Clock },
    { id: 'financial', label: 'Financials & Resources', icon: DollarSign },
    { id: 'innovation', label: 'Innovation & Decisions', icon: Sparkles },
    { id: 'kpis', label: 'KPI Management', icon: TrendingUp },
    { id: 'reports', label: 'Reporting & Exports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              R&D Analytics, Reporting & Telemetry Engine
            </h1>
            <Badge variant="primary">Master Prompt 12</Badge>
            {isCustomLayout && <Badge variant="info">Customized Layout</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-dimensional operational metrics, capital budgets, schedule float, and configurable KPIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateKpis}
            disabled={recalculating}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating...' : 'Recalculate Telemetry'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomizer(true)}
          >
            <Sliders className="w-4 h-4 mr-1.5" />
            Customize Layout
          </Button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <Tabs
        tabs={analyticsTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ==================================================================== */}
      {/* TAB 1: EXECUTIVE R&D DASHBOARD OVERVIEW */}
      {/* ==================================================================== */}
      {activeTab === 'executive' && (
        <div className="flex flex-col gap-6">
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total R&D Projects"
              value={executiveData?.portfolio?.totalProjects ?? 0}
              subtitle={`${executiveData?.portfolio?.activeProjects ?? 0} Active | ${executiveData?.portfolio?.delayedProjects ?? 0} Delayed`}
              icon={Layers}
              trend={{
                type: (executiveData?.portfolio?.delayedProjects || 0) > 0 ? 'warning' : 'up',
                value: `${executiveData?.portfolio?.averageProgress ?? 0}% avg progress`
              }}
            />

            <KPICard
              title="Approved Capital Budget"
              value={`$${(executiveData?.financial?.totalApprovedBudget ?? 0).toLocaleString()}`}
              subtitle={`Spent: $${(executiveData?.financial?.totalActualSpent ?? 0).toLocaleString()} (${executiveData?.financial?.budgetUtilizationRate ?? 0}%)`}
              icon={DollarSign}
              trend={{
                type: executiveData?.financial?.isOverrun ? 'down' : 'up',
                value: executiveData?.financial?.isOverrun ? 'OVERRUN DETECTED' : 'Within Budget'
              }}
            />

            <KPICard
              title="Task Delivery Adherence"
              value={`${executiveData?.execution?.taskAdherenceRate ?? 100}%`}
              subtitle={`${executiveData?.execution?.completedTasks ?? 0}/${executiveData?.execution?.totalTasks ?? 0} Tasks Done (${executiveData?.execution?.overdueTasks ?? 0} Overdue)`}
              icon={CheckCircle2}
              trend={{
                type: (executiveData?.execution?.overdueTasks || 0) > 0 ? 'warning' : 'up',
                value: `${executiveData?.execution?.taskCompletionRate ?? 0}% completed`
              }}
            />

            <KPICard
              title="Innovation Pipeline"
              value={executiveData?.innovation?.totalIdeas ?? 0}
              subtitle={`${executiveData?.innovation?.approvedIdeas ?? 0} Approved | ${executiveData?.innovation?.totalGateReviews ?? 0} Gate Reviews`}
              icon={Sparkles}
              trend={{
                type: 'up',
                value: `${executiveData?.risks?.highRiskProjectsCount ?? 0} High-Risk Projects`
              }}
            />
          </div>

          {/* Overrun Alert Banner if Any */}
          {executiveData?.financial?.isOverrun && (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Portfolio Capital Budget Overrun Detected: </span>
                Actual aggregate expenditure (${executiveData.financial.totalActualSpent.toLocaleString()}) exceeds total approved capital funding (${executiveData.financial.totalApprovedBudget.toLocaleString()}) by ${Math.abs(executiveData.financial.netVariance).toLocaleString()}. Immediate executive review is recommended.
              </div>
            </div>
          )}

          {/* Quick Portfolio Progress & Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Project Delivery & Status Health"
                subtitle="Live status breakdown of all active R&D initiatives"
              />
              <CardBody className="pt-0 flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Active R&D Projects</span>
                  <span className="font-semibold">{executiveData?.portfolio?.activeProjects ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Completed Initiatives</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {executiveData?.portfolio?.completedProjects ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Delayed Deliverables (Past Deadline)</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {executiveData?.portfolio?.delayedProjects ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Average Portfolio Progress</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${executiveData?.portfolio?.averageProgress ?? 0}%` }}
                      />
                    </div>
                    <span className="font-semibold">{executiveData?.portfolio?.averageProgress ?? 0}%</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Risk & Schedule Float Telemetry"
                subtitle="Critical path blockers, schedule variance and risk indices"
              />
              <CardBody className="pt-0 flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">High Risk Projects (Risk Score ≥ 60)</span>
                  <Badge variant={executiveData?.risks?.highRiskProjectsCount > 0 ? 'danger' : 'success'}>
                    {executiveData?.risks?.highRiskProjectsCount ?? 0} Projects
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Portfolio Average Risk Index</span>
                  <span className="font-semibold">{executiveData?.risks?.averageRiskScore ?? 0} / 100</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Active Schedule Variance Alerts</span>
                  <Badge variant={executiveData?.execution?.activeAlertsCount > 0 ? 'warning' : 'neutral'}>
                    {executiveData?.execution?.activeAlertsCount ?? 0} Alerts
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-muted-foreground">Open Backlog / Active Tasks</span>
                  <span className="font-semibold">{executiveData?.execution?.openTasks ?? 0} Tasks</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PROJECT PORTFOLIO ANALYTICS */}
      {/* ==================================================================== */}
      {activeTab === 'portfolio' && (
        <div className="flex flex-col gap-6">
          {/* Multi-Dimensional Filter Bar */}
          <Card>
            <CardBody className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Priority Filter
                  </label>
                  <select
                    className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground"
                    value={filters.priority}
                    onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Delivery Status
                  </label>
                  <select
                    className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground"
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Strategic Category
                  </label>
                  <select
                    className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground"
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    <option value="Energy Storage">Energy Storage</option>
                    <option value="Materials Science">Materials Science</option>
                    <option value="Grid Automation">Grid Automation</option>
                    <option value="Clean Tech">Clean Tech</option>
                  </select>
                </div>

                <div className="flex items-end h-full pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilters({ priority: '', status: '', category: '', search: '' })}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Distributions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Priority Distribution" />
              <CardBody className="pt-0">
                {portfolioData?.distributions?.byPriority ? (
                  <div className="flex flex-col gap-2">
                    {Object.entries(portfolioData.distributions.byPriority).map(([prio, cnt]) => (
                      <div key={prio} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{prio}</span>
                        <Badge variant={prio === 'CRITICAL' ? 'danger' : prio === 'HIGH' ? 'warning' : 'neutral'}>
                          {cnt}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Stage Progression" />
              <CardBody className="pt-0">
                {portfolioData?.distributions?.byStage ? (
                  <div className="flex flex-col gap-2">
                    {Object.entries(portfolioData.distributions.byStage).map(([stg, cnt]) => (
                      <div key={stg} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stg}</span>
                        <Badge variant="primary">{cnt}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Progress Distribution" />
              <CardBody className="pt-0">
                {portfolioData?.distributions?.byProgress ? (
                  <div className="flex flex-col gap-2">
                    {Object.entries(portfolioData.distributions.byProgress).map(([range, cnt]) => (
                      <div key={range} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{range}</span>
                        <Badge variant="info">{cnt}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Project Comparison Grid */}
          <Card>
            <CardHeader
              title={`Project Comparison Portfolio (${portfolioData?.comparisons?.length || 0} Projects)`}
              subtitle="Side-by-side comparison of budget, actual cost, variance, and delivery status"
            />
            <CardBody className="pt-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Project Name</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Progress</th>
                    <th className="py-2.5 px-3 font-semibold">Approved Budget</th>
                    <th className="py-2.5 px-3 font-semibold">Actual Spent</th>
                    <th className="py-2.5 px-3 font-semibold">Variance</th>
                    <th className="py-2.5 px-3 font-semibold">Delivery State</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData?.comparisons?.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/40">
                      <td className="py-2.5 px-3 font-medium text-foreground">{p.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.strategicCategory}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={p.priority === 'CRITICAL' ? 'danger' : p.priority === 'HIGH' ? 'warning' : 'neutral'}>
                          {p.priority}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">${p.budget.toLocaleString()}</td>
                      <td className="py-2.5 px-3">${p.spent.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 font-medium ${p.variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ${p.variance.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {p.isDelayed ? (
                          <Badge variant="danger">Delayed</Badge>
                        ) : (
                          <Badge variant="success">On Track</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!portfolioData?.comparisons || portfolioData.comparisons.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No projects match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PROJECT EXECUTION & SPRINTS */}
      {/* ==================================================================== */}
      {activeTab === 'execution' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Work Tasks"
              value={executionData?.summary?.totalTasks ?? 0}
              subtitle={`${executionData?.summary?.completedCount ?? 0} Finished | ${executionData?.summary?.inProgressCount ?? 0} In Progress`}
              icon={CheckCircle2}
            />
            <KPICard
              title="Completion Rate"
              value={`${executionData?.summary?.completionRate ?? 0}%`}
              subtitle={`Adherence: ${executionData?.summary?.scheduleAdherence ?? 100}%`}
              icon={TrendingUp}
            />
            <KPICard
              title="Overdue Tasks"
              value={executionData?.summary?.overdueCount ?? 0}
              subtitle="Past target due date"
              icon={AlertTriangle}
              trend={{
                type: (executionData?.summary?.overdueCount || 0) > 0 ? 'down' : 'up',
                value: (executionData?.summary?.overdueCount || 0) > 0 ? 'Requires attention' : 'Clean'
              }}
            />
            <KPICard
              title="Hours Variance"
              value={`${executionData?.summary?.hoursVariance ?? 0} hrs`}
              subtitle={`Est: ${executionData?.summary?.totalEstimatedHours ?? 0}h | Act: ${executionData?.summary?.totalActualHours ?? 0}h`}
              icon={Clock}
            />
          </div>

          {/* Sprints Progress Table */}
          <Card>
            <CardHeader
              title={`Sprint Velocity & Execution Iterations (${executionData?.sprints?.length || 0} Sprints)`}
              subtitle="Sprint capacity allocation, completion status, and velocity metrics"
            />
            <CardBody className="pt-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Sprint Name</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Capacity</th>
                    <th className="py-2.5 px-3 font-semibold">Tasks Completed</th>
                    <th className="py-2.5 px-3 font-semibold">Velocity</th>
                    <th className="py-2.5 px-3 font-semibold">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {executionData?.sprints?.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/40">
                      <td className="py-2.5 px-3 font-medium text-foreground">{s.name}</td>
                      <td className="py-2.5 px-3">{getStatusBadge(s.status)}</td>
                      <td className="py-2.5 px-3">{s.capacityHours} hrs</td>
                      <td className="py-2.5 px-3">{s.completedTasks} / {s.totalTasks}</td>
                      <td className="py-2.5 px-3 font-semibold">{s.velocity} pts</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${s.completionRate}%` }} />
                          </div>
                          <span className="text-xs">{s.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!executionData?.sprints || executionData.sprints.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No active or planned sprint iterations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Schedule Alerts & Dependency Delays */}
          {executionData?.recentAlerts?.length > 0 && (
            <Card>
              <CardHeader
                title="Active Schedule Alerts & Critical-Path Blocker Log"
                subtitle="Automated alerts generated from mathematical critical path variance scans"
              />
              <CardBody className="pt-0">
                <div className="flex flex-col gap-2">
                  {executionData.recentAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 ${alt.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                        <div>
                          <span className="font-semibold">{alt.alertType}</span>: {alt.message}
                        </div>
                      </div>
                      <Badge variant={alt.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                        {alt.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: FINANCIALS & RESOURCE ALLOCATION */}
      {/* ==================================================================== */}
      {activeTab === 'financial' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Approved Budget"
              value={`$${(financialData?.summary?.totalApprovedBudget ?? 0).toLocaleString()}`}
              subtitle="Capital expenditure limit"
              icon={DollarSign}
            />
            <KPICard
              title="Actual Expenditure"
              value={`$${(financialData?.summary?.totalActualSpent ?? 0).toLocaleString()}`}
              subtitle={`Utilization: ${financialData?.summary?.overallUtilization ?? 0}%`}
              icon={TrendingUp}
            />
            <KPICard
              title="Net Budget Variance"
              value={`$${(financialData?.summary?.netVariance ?? 0).toLocaleString()}`}
              subtitle={financialData?.summary?.hasOverrun ? 'Capital Overrun' : 'Capital Surplus'}
              icon={BarChart3}
              trend={{
                type: (financialData?.summary?.netVariance || 0) < 0 ? 'down' : 'up',
                value: (financialData?.summary?.netVariance || 0) < 0 ? 'Deficit' : 'Surplus'
              }}
            />
            <KPICard
              title="Team Allocation Ratio"
              value={`${resourceData?.summary?.overallTeamUtilization ?? 0}%`}
              subtitle={`${resourceData?.summary?.totalTeamMembers ?? 0} Researchers | ${resourceData?.summary?.totalAssignedHours ?? 0}h assigned`}
              icon={Users}
            />
          </div>

          {/* Budget Overrun Warning Table if Any */}
          {financialData?.overrunProjects?.length > 0 && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader
                title="Critical Capital Overrun Notifications"
                subtitle="Projects where actual logged expenditures have exceeded approved caps"
              />
              <CardBody className="pt-0 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rose-500/20 text-rose-600 dark:text-rose-400">
                      <th className="py-2 px-3 font-semibold">Project</th>
                      <th className="py-2 px-3 font-semibold">Approved Budget</th>
                      <th className="py-2 px-3 font-semibold">Actual Spent</th>
                      <th className="py-2 px-3 font-semibold">Overrun Amount</th>
                      <th className="py-2 px-3 font-semibold">Overrun %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.overrunProjects.map((ovr) => (
                      <tr key={ovr.id} className="border-b border-rose-500/10">
                        <td className="py-2 px-3 font-semibold">{ovr.name}</td>
                        <td className="py-2 px-3">${ovr.budget.toLocaleString()}</td>
                        <td className="py-2 px-3">${ovr.spent.toLocaleString()}</td>
                        <td className="py-2 px-3 font-bold text-rose-600 dark:text-rose-400">
                          +${ovr.overrunAmount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="danger">+{ovr.overrunPercent}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {/* Researcher Workload & Capacity Table */}
          <Card>
            <CardHeader
              title={`Researcher Workload & Capacity Distribution (${resourceData?.workloads?.length || 0} Staff)`}
              subtitle="Monthly task hours against standard capacity (160h/month baseline)"
            />
            <CardBody className="pt-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Member</th>
                    <th className="py-2.5 px-3 font-semibold">System Role</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Tasks</th>
                    <th className="py-2.5 px-3 font-semibold">Estimated Work</th>
                    <th className="py-2.5 px-3 font-semibold">Actual Logged</th>
                    <th className="py-2.5 px-3 font-semibold">Capacity Allocation</th>
                    <th className="py-2.5 px-3 font-semibold">Load State</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceData?.workloads?.map((w) => (
                    <tr key={w.userId} className="border-b border-border/50 hover:bg-secondary/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{w.email}</div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{w.role}</td>
                      <td className="py-2.5 px-3">{w.totalTasks} ({w.activeTasks} active)</td>
                      <td className="py-2.5 px-3">{w.estimatedHours} hrs</td>
                      <td className="py-2.5 px-3">{w.actualHours} hrs</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${w.isOverAllocated ? 'bg-rose-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min(100, w.allocationRate)}%` }}
                            />
                          </div>
                          <span className="text-xs">{w.allocationRate}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {w.isOverAllocated ? (
                          <Badge variant="danger">Over-Allocated</Badge>
                        ) : (
                          <Badge variant="success">Available</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: INNOVATION & GOVERNANCE DECISIONS */}
      {/* ==================================================================== */}
      {activeTab === 'innovation' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Research Ideas"
              value={innovationData?.totalIdeas ?? 0}
              subtitle={`${innovationData?.evaluatedIdeasCount ?? 0} ideas scored`}
              icon={Sparkles}
            />
            <KPICard
              title="Average Composite Score"
              value={`${innovationData?.averageCompositeScore ?? 0} / 100`}
              subtitle="Scored via formal rubrics"
              icon={TrendingUp}
            />
            <KPICard
              title="Conversion Rate"
              value={`${innovationData?.funnel?.conversionRate ?? 0}%`}
              subtitle={`${innovationData?.funnel?.convertedToProject ?? 0} converted to projects`}
              icon={CheckCircle2}
            />
            <KPICard
              title="Gate Reviews Conducted"
              value={innovationData?.totalGateReviewsConducted ?? 0}
              subtitle="Formal governance gates"
              icon={ShieldAlert}
            />
          </div>

          {/* Innovation Pipeline Funnel */}
          <Card>
            <CardHeader
              title="Innovation Intake Funnel Progression"
              subtitle="Linear progression from idea submission to formal project intake conversion"
            />
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-foreground">{innovationData?.funnel?.drafts ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">1. Drafts</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-foreground">{innovationData?.funnel?.submitted ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">2. Submitted</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-foreground">{innovationData?.funnel?.inReview ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">3. In Evaluation</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {innovationData?.funnel?.approved ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">4. Approved</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="text-2xl font-bold text-primary">
                    {innovationData?.funnel?.convertedToProject ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-primary mt-1">5. Converted Intake</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Gate Decisions Breakdown */}
          <Card>
            <CardHeader
              title="Stage-Gate Governance Decisions Log"
              subtitle="Distribution of formal committee gate decisions"
            />
            <CardBody className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {innovationData?.distributions?.byGateDecision?.GO_CONTINUE ?? 0}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">GO / CONTINUE</div>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {innovationData?.distributions?.byGateDecision?.HOLD ?? 0}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">HOLD / PAUSE</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {innovationData?.distributions?.byGateDecision?.REWORK_RECYCLE ?? 0}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">REWORK / RECYCLE</div>
                </div>
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {innovationData?.distributions?.byGateDecision?.TERMINATE_KILL ?? 0}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">TERMINATE / KILL</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: CONFIGURABLE KPI MANAGEMENT FRAMEWORK */}
      {/* ==================================================================== */}
      {activeTab === 'kpis' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Standard R&D Key Performance Indicators</h2>
              <p className="text-xs text-muted-foreground">
                Configurable metrics evaluated against actual operational records with historical audit logs
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRecalculateKpis}
              disabled={recalculating}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate All KPIs
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id} className="relative overflow-hidden">
                <CardHeader
                  title={
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">{kpi.code}</span>
                      {getStatusBadge(kpi.status)}
                    </div>
                  }
                  subtitle={kpi.name}
                />
                <CardBody className="pt-0 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {kpi.currentValue}
                        {kpi.unit === 'PERCENT' ? '%' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / Target: {kpi.targetValue}{kpi.unit === 'PERCENT' ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(kpi.trend)}
                      <span className="text-xs font-medium text-muted-foreground">{kpi.trend}</span>
                    </div>
                  </div>

                  {/* Progress bar towards target */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        kpi.status === 'CRITICAL'
                          ? 'bg-rose-500'
                          : kpi.status === 'AT_RISK'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0)}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {kpi.description}
                  </p>

                  <div className="text-[11px] font-mono text-muted-foreground bg-secondary/60 p-2 rounded border border-border/50">
                    Formula: {kpi.calculationFormula}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span>Period: {kpi.measurementPeriod}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleViewHistory(kpi)}
                      >
                        <History className="w-3.5 h-3.5 mr-1" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setEditingKpi(kpi);
                          setKpiTargetVal(String(kpi.targetValue));
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Set Target
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: REPORTING ENGINE & EXPORT CENTER */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Enterprise R&D Reporting Engine"
              subtitle="Generate executive and operational audit reports with RFC-4180 CSV and JSON streaming exports"
            />
            <CardBody className="pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Report Type:
                  </label>
                  <select
                    className="text-sm bg-background border border-border rounded-md px-3 py-1.5 text-foreground"
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                  >
                    <option value="PORTFOLIO_SUMMARY">Project Portfolio & Performance</option>
                    <option value="EXECUTIVE_SUMMARY">Executive Operations Telemetry</option>
                    <option value="EXECUTION_DELIVERY">Task Execution & Sprints Schedule</option>
                    <option value="INNOVATION_FUNNEL">Innovation Pipeline & Gate Decisions</option>
                    <option value="FINANCIAL_PERFORMANCE">Financial Budget & Overrun Analysis</option>
                    <option value="RISK_DECISION_LOG">Risk Register & Governance Log</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                    disabled={exporting}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJson}
                    disabled={exporting}
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Report Preview Table */}
              <div className="mt-4">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {reportData?.title || 'Report Preview'}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Generated: {reportData?.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>

                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-secondary/70 border-b border-border">
                      <tr>
                        {reportData?.columns?.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 font-semibold text-muted-foreground whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.rows?.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/40 hover:bg-secondary/30">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {(!reportData?.rows || reportData.rows.length === 0) && (
                        <tr>
                          <td colSpan={reportData?.columns?.length || 1} className="py-8 text-center text-muted-foreground">
                            No report rows available for selected criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT KPI TARGET */}
      {/* ==================================================================== */}
      {editingKpi && (
        <Modal
          isOpen={true}
          onClose={() => setEditingKpi(null)}
          title={`Configure Target: ${editingKpi.code}`}
        >
          <div className="flex flex-col gap-4 p-4">
            <div>
              <span className="text-sm font-semibold">{editingKpi.name}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{editingKpi.description}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Target Value ({editingKpi.unit})
              </label>
              <Input
                type="number"
                step="0.1"
                value={kpiTargetVal}
                onChange={(e) => setKpiTargetVal(e.target.value)}
                placeholder="e.g. 85.0"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingKpi(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveKpiTarget}>
                Save Target
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VIEW KPI HISTORY */}
      {/* ==================================================================== */}
      {historyModalKpi && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryModalKpi(null)}
          title={`Historical Audit Log: ${historyModalKpi.code}`}
        >
          <div className="flex flex-col gap-4 p-4">
            <p className="text-xs text-muted-foreground">
              Historical track of target adjustments and telemetry snapshots over measurement periods
            </p>

            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-secondary/70 border-b border-border">
                  <tr>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Actual</th>
                    <th className="py-2 px-3">Variance</th>
                    <th className="py-2 px-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiHistory.map((h) => (
                    <tr key={h.id} className="border-b border-border/40">
                      <td className="py-2 px-3 font-semibold">{h.period}</td>
                      <td className="py-2 px-3">{h.targetValue}</td>
                      <td className="py-2 px-3">{h.actualValue}</td>
                      <td className={`py-2 px-3 font-medium ${h.variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {h.variance}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(h.recordedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {kpiHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No historical snapshots recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setHistoryModalKpi(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================================== */}
      {/* MODAL / DRAWER: DASHBOARD CUSTOMIZER */}
      {/* ==================================================================== */}
      {showCustomizer && (
        <Modal
          isOpen={true}
          onClose={() => setShowCustomizer(false)}
          title="Customize Executive Dashboard Widgets"
        >
          <div className="flex flex-col gap-4 p-4">
            <p className="text-xs text-muted-foreground">
              Toggle visibility of widgets for your personal dashboard view. Preferences are securely persisted to your user profile.
            </p>

            <div className="flex flex-col gap-2">
              {layoutWidgets.map((w) => (
                <div
                  key={w.widgetId}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border text-sm"
                >
                  <span className="font-medium text-foreground">{w.title}</span>
                  <Button
                    variant={w.enabled ? 'primary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleToggleWidget(w.widgetId)}
                  >
                    {w.enabled ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                    {w.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleResetPreferences}>
                Reset to Default
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCustomizer(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

