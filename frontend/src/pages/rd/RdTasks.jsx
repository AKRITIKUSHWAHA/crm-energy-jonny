import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  GitBranch,
  ShieldAlert,
  Play,
  CheckCircle2,
  Trash2,
  Edit2,
  Layers,
  ChevronRight,
  MoveRight,
  Sparkles,
  Flame,
  Zap,
  BarChart2,
  FolderGit2,
  AlertCircle,
  HelpCircle,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Tabs
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdTasks = () => {
  const { addToast } = useToast();

  // Primary Active Sub-View: 'kanban' | 'backlog' | 'sprints' | 'gantt' | 'cpm' | 'alerts'
  const [activeView, setActiveView] = useState('kanban');

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cpmData, setCpmData] = useState(null);
  const [varianceData, setVarianceData] = useState(null);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showCompleteSprintModal, setShowCompleteSprintModal] = useState(null);

  // Form States
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    sprintId: '',
    priority: 'MEDIUM',
    taskType: 'TASK',
    rdStatus: 'TODO',
    estimatedHours: 8,
    actualHours: 0,
    startDate: '',
    dueDate: '',
    isBacklog: false,
  });

  const [sprintForm, setSprintForm] = useState({
    name: '',
    code: '',
    goal: '',
    projectId: '',
    startDate: '',
    endDate: '',
    capacityHours: 80,
  });

  const [depForm, setDepForm] = useState({
    predecessorId: '',
    successorId: '',
    dependencyType: 'FS',
    lagDays: 0,
  });

  // Fetch initial projects & sprints
  const fetchMetadata = useCallback(async () => {
    try {
      const projRes = await apiClient.get('/rd/portfolio').catch(() => ({ success: false, data: [] }));
      if (projRes.success && projRes.data) {
        setProjects(projRes.data);
        if (projRes.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching project metadata:', err);
    }
  }, [selectedProjectId]);

  // Fetch Tasks & Views Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      if (selectedSprintId) params.sprintId = selectedSprintId;
      if (filterPriority !== 'ALL') params.priority = filterPriority;
      if (filterType !== 'ALL') params.taskType = filterType;

      const [taskRes, sprintRes, backlogRes, depRes, alertRes] = await Promise.all([
        apiClient.get('/rd/tasks', { params }).catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/sprints', { params: selectedProjectId ? { projectId: selectedProjectId } : {} }).catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/backlog', { params: selectedProjectId ? { projectId: selectedProjectId } : {} }).catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/dependencies', { params: selectedProjectId ? { projectId: selectedProjectId } : {} }).catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/schedule/alerts', { params: selectedProjectId ? { projectId: selectedProjectId } : {} }).catch(() => ({ success: false, data: [] })),
      ]);

      if (taskRes.success && taskRes.data) setTasks(taskRes.data);
      if (sprintRes.success && sprintRes.data) setSprints(sprintRes.data);
      if (backlogRes.success && backlogRes.data) setBacklogTasks(backlogRes.data);
      if (depRes.success && depRes.data) setDependencies(depRes.data);
      if (alertRes.success && alertRes.data) setAlerts(alertRes.data);

      // If in CPM view or Project selected, fetch CPM and Variance
      if (selectedProjectId) {
        const [cpmRes, varRes] = await Promise.all([
          apiClient.get(`/rd/cpm/${selectedProjectId}`).catch(() => ({ success: false })),
          apiClient.get(`/rd/schedule/variance/${selectedProjectId}`).catch(() => ({ success: false })),
        ]);
        if (cpmRes.success && cpmRes.data) setCpmData(cpmRes.data);
        if (varRes.success && varRes.data) setVarianceData(varRes.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch task management data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedSprintId, filterPriority, filterType, addToast]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Drag & Drop in Kanban
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, rdStatus: targetStatus, progress: targetStatus === 'DONE' ? 100 : t.progress } : t))
    );

    try {
      const res = await apiClient.patch(`/rd/tasks/${taskId}/status`, { rdStatus: targetStatus });
      if (res.success) {
        addToast(`Task moved to ${targetStatus}`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update task status', 'error');
      fetchData(); // Rollback on error
    }
  };

  // Open Task Modal (Create or Edit)
  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      projectId: selectedProjectId || (projects[0] ? projects[0].id : ''),
      sprintId: selectedSprintId || '',
      priority: 'MEDIUM',
      taskType: 'TASK',
      rdStatus: 'TODO',
      estimatedHours: 8,
      actualHours: 0,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      isBacklog: false,
    });
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId || '',
      sprintId: task.sprintId || '',
      priority: task.priority || 'MEDIUM',
      taskType: task.taskType || 'TASK',
      rdStatus: task.rdStatus || 'TODO',
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      isBacklog: Boolean(task.isBacklog),
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await apiClient.put(`/rd/tasks/${editingTask.id}`, taskForm);
        addToast('Task updated successfully', 'success');
      } else {
        await apiClient.post('/rd/tasks', taskForm);
        addToast('R&D Task created successfully', 'success');
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to save task', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/rd/tasks/${taskId}`);
      addToast('Task deleted successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Sprint Creation & Lifecycle
  const handleSaveSprint = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/rd/sprints', sprintForm);
      addToast('Sprint created successfully', 'success');
      setShowSprintModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to create sprint', 'error');
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      await apiClient.post(`/rd/sprints/${sprintId}/start`);
      addToast('Sprint started successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to start sprint', 'error');
    }
  };

  const handleCompleteSprint = async (sprintId, rolloverAction = 'BACKLOG') => {
    try {
      const res = await apiClient.post(`/rd/sprints/${sprintId}/complete`, { rolloverAction });
      if (res.success) {
        addToast(`Sprint completed! Calculated Velocity: ${res.data.velocity} hrs`, 'success');
        setShowCompleteSprintModal(null);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete sprint', 'error');
    }
  };

  // Commit Backlog to Sprint
  const handleCommitToSprint = async (taskId, targetSprintId) => {
    if (!targetSprintId) {
      addToast('Please select a target sprint', 'warning');
      return;
    }
    try {
      await apiClient.post('/rd/backlog/commit', { sprintId: targetSprintId, taskIds: [taskId] });
      addToast('Task committed to sprint', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to commit task to sprint', 'error');
    }
  };

  // Add Dependency
  const handleSaveDependency = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/rd/dependencies', depForm);
      addToast('Dependency edge established successfully', 'success');
      setShowDepModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to create dependency', 'error');
    }
  };

  const handleDeleteDependency = async (depId) => {
    try {
      await apiClient.delete(`/rd/dependencies/${depId}`);
      addToast('Dependency removed', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to remove dependency', 'error');
    }
  };

  // Baseline Capture
  const handleCaptureBaseline = async () => {
    if (!selectedProjectId) {
      addToast('Select a project first', 'warning');
      return;
    }
    try {
      const res = await apiClient.post('/rd/schedule/baseline', { projectId: selectedProjectId });
      if (res.success) {
        addToast(`Baseline captured: Version ${res.data.version} (${res.data.tasksCaptured} tasks)`, 'success');
        setShowBaselineModal(false);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to capture baseline', 'error');
    }
  };

  // Scan Alerts
  const handleScanAlerts = async () => {
    try {
      const res = await apiClient.post('/rd/schedule/alerts/scan', null, {
        params: selectedProjectId ? { projectId: selectedProjectId } : {},
      });
      if (res.success) {
        addToast(`Evaluated ${res.data.alertsEvaluated} alerts`, 'info');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to scan alerts', 'error');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await apiClient.post(`/rd/schedule/alerts/${alertId}/resolve`);
      addToast('Alert marked resolved', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  // Filtered task subsets
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [tasks, searchQuery]);

  // Kanban Columns Definition
  const kanbanColumns = [
    { id: 'TODO', label: 'To Do', color: '#64748b' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: '#0284c7' },
    { id: 'IN_REVIEW', label: 'In Review / QA', color: '#8b5cf6' },
    { id: 'BLOCKED', label: 'Blocked / At Risk', color: '#ef4444' },
    { id: 'DONE', label: 'Completed', color: '#10b981' },
  ];

  return (
    <div className="flex flex-col gap-6" style={{ minHeight: '600px' }}>
      {/* 1. Header & Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              R&D Tasks, Sprints & Critical-Path Scheduling
            </h2>
            <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
              Master Prompt 05
            </Badge>
          </div>
          <p className="text-xs text-secondary" style={{ margin: '4px 0 0 0' }}>
            Operational work breakdown, agile velocity, topological dependencies & mathematical Critical Path Method (CPM).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={handleScanAlerts} disabled={loading}>
            <AlertTriangle size={14} style={{ marginRight: 4 }} />
            Scan Alerts
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowDepModal(true)}>
            <GitBranch size={14} style={{ marginRight: 4 }} />
            Link Dependencies
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowSprintModal(true)}>
            <Calendar size={14} style={{ marginRight: 4 }} />
            New Sprint
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateTaskModal}>
            <Plus size={14} style={{ marginRight: 4 }} />
            New R&D Task
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Operational Tasks"
          value={tasks.length}
          icon={CheckSquare}
          trend={{ value: `${tasks.filter((t) => t.rdStatus === 'DONE').length} Completed`, isPositive: true }}
        />
        <KPICard
          title="Active Sprints"
          value={sprints.filter((s) => s.status === 'ACTIVE').length}
          icon={Flame}
          trend={{ value: `${sprints.length} Total Iterations`, isNeutral: true }}
        />
        <KPICard
          title="Critical Path Duration"
          value={cpmData ? `${cpmData.projectDurationDays} Days` : 'N/A'}
          icon={Zap}
          trend={{ value: cpmData ? `${cpmData.criticalTaskCount} Critical Tasks` : 'Run CPM', isPositive: false }}
        />
        <KPICard
          title="Schedule Alerts"
          value={alerts.filter((a) => a.status === 'ACTIVE').length}
          icon={ShieldAlert}
          trend={{
            value: alerts.filter((a) => a.severity === 'CRITICAL').length > 0 ? 'Critical Slippages' : 'On Track',
            isPositive: alerts.filter((a) => a.severity === 'CRITICAL').length === 0,
          }}
        />
      </div>

      {/* 3. Sub-Navigation Tabs & Project Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: '10px',
          border: '1px solid var(--border)',
        }}
      >
        {/* Navigation Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'kanban', label: 'Kanban Board', icon: Layers },
            { id: 'backlog', label: `Backlog (${backlogTasks.length})`, icon: FolderGit2 },
            { id: 'sprints', label: `Sprints (${sprints.length})`, icon: Flame },
            { id: 'gantt', label: 'Gantt Schedule', icon: BarChart2 },
            { id: 'cpm', label: 'Critical Path (CPM)', icon: Zap },
            { id: 'alerts', label: `Schedule Alerts (${alerts.filter((a) => a.status === 'ACTIVE').length})`, icon: ShieldAlert },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Project Selector & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DRAG-AND-DROP KANBAN BOARD */}
      {/* ========================================================================= */}
      {activeView === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            alignItems: 'start',
          }}
        >
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.rdStatus === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  minHeight: '450px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `3px solid ${col.color}`,
                    borderRadius: '10px 10px 0 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{col.label}</span>
                    <Badge variant="neutral" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {colTasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={openCreateTaskModal} style={{ padding: 4, height: 24, width: 24 }}>
                    <Plus size={14} />
                  </Button>
                </div>

                {/* Cards Container */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                  {colTasks.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>
                      No tasks in this stage. Drag items here.
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderRadius: '8px',
                          border: task.isBlocked ? '1px solid var(--danger)' : '1px solid var(--border)',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative',
                        }}
                      >
                        {/* Top Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--surface-raised)',
                              color: 'var(--primary)',
                            }}
                          >
                            {task.taskType}
                          </span>

                          <Badge
                            variant={
                              task.priority === 'URGENT'
                                ? 'danger'
                                : task.priority === 'HIGH'
                                ? 'warning'
                                : task.priority === 'MEDIUM'
                                ? 'primary'
                                : 'neutral'
                            }
                            style={{ fontSize: '9px', padding: '1px 5px' }}
                          >
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <p
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                margin: '4px 0 0 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Blocked Alert Banner if Predecessors are Incomplete */}
                        {task.isBlocked && (
                          <div
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '10px',
                              color: 'var(--danger)',
                              fontWeight: 600,
                            }}
                          >
                            <ShieldAlert size={12} />
                            <span>Blocked by {task.blockingPredecessors.length} predecessor(s)</span>
                          </div>
                        )}

                        {/* Card Footer */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '8px',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            <span>{task.estimatedHours}h est</span>
                          </div>

                          {task.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} />
                              <span>{new Date(task.dueDate).toISOString().slice(5, 10)}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => openEditTaskModal(task)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BACKLOG PLANNING */}
      {/* ========================================================================= */}
      {activeView === 'backlog' && (
        <Card>
          <CardHeader
            title="Product & Project Work Backlog"
            subtitle="Prioritized uncommitted work items ready for sprint allocation."
            action={
              <Button variant="primary" size="sm" onClick={openCreateTaskModal}>
                <Plus size={14} style={{ marginRight: 4 }} />
                Add Backlog Item
              </Button>
            }
          />
          <CardBody className="p-0">
            {backlogTasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FolderGit2 size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>The backlog is empty.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Capture requirements or research spikes to prioritize upcoming sprints.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Priority & Type</TableCell>
                    <TableCell isHeader>Work Item Title</TableCell>
                    <TableCell isHeader>Project</TableCell>
                    <TableCell isHeader>Est. Hours</TableCell>
                    <TableCell isHeader>Due Date</TableCell>
                    <TableCell isHeader>Commit to Sprint</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backlogTasks.map((bt) => (
                    <TableRow key={bt.id}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Badge
                            variant={bt.priority === 'URGENT' ? 'danger' : bt.priority === 'HIGH' ? 'warning' : 'neutral'}
                            style={{ fontSize: '10px' }}
                          >
                            {bt.priority}
                          </Badge>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{bt.taskType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{bt.title}</div>
                        {bt.description && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{bt.description}</div>}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{bt.project?.name || 'Unassigned'}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px' }}>{bt.estimatedHours} hrs</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px' }}>{bt.dueDate ? bt.dueDate.slice(0, 10) : '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleCommitToSprint(bt.id, e.target.value);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              fontSize: '11px',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <option value="" disabled>
                              Select Sprint...
                            </option>
                            {sprints
                              .filter((s) => s.status !== 'COMPLETED')
                              .map((sp) => (
                                <option key={sp.id} value={sp.id}>
                                  {sp.name} ({sp.status})
                                </option>
                              ))}
                          </select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button variant="ghost" size="sm" onClick={() => openEditTaskModal(bt)}>
                            <Edit2 size={12} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(bt.id)}>
                            <Trash2 size={12} color="var(--danger)" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SPRINTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeView === 'sprints' && (
        <div className="flex flex-col gap-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Sprint Iterations & Velocity Tracking</h3>
              <p className="text-xs text-secondary" style={{ margin: '2px 0 0 0' }}>
                Manage iteration lifecycles, capacity commitments, and automated rollover upon sprint closure.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowSprintModal(true)}>
              <Plus size={14} style={{ marginRight: 4 }} />
              Create Sprint
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sprints.map((sprint) => (
              <Card key={sprint.id} style={{ borderLeft: sprint.status === 'ACTIVE' ? '4px solid #0284c7' : '1px solid var(--border)' }}>
                <CardHeader
                  title={sprint.name}
                  subtitle={sprint.project?.name || 'Global Sprint'}
                  action={
                    <Badge
                      variant={sprint.status === 'ACTIVE' ? 'primary' : sprint.status === 'COMPLETED' ? 'success' : 'neutral'}
                      style={{ fontSize: '11px', fontWeight: 700 }}
                    >
                      {sprint.status}
                    </Badge>
                  }
                />
                <CardBody className="pt-0 flex flex-col gap-3">
                  {sprint.goal && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--surface-raised)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Goal: </span>
                      {sprint.goal}
                    </div>
                  )}

                  {/* Sprint Metrics Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: 4 }}>
                      <span>Committed Capacity: {sprint.metrics.totalHours} hrs</span>
                      <span>Completed: {sprint.metrics.completedHours} hrs ({sprint.metrics.completionRate}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sprint.metrics.completionRate}%`,
                          height: '100%',
                          backgroundColor: sprint.status === 'COMPLETED' ? '#10b981' : '#0284c7',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Task Counts Summary */}
                  <div style={{ display: 'flex', gap: 12, fontSize: '12px' }}>
                    <div>
                      <span className="text-secondary">Tasks: </span>
                      <span className="font-bold">{sprint.metrics.totalTasks}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Done: </span>
                      <span className="font-bold text-success">{sprint.metrics.completedTasks}</span>
                    </div>
                    <div>
                      <span className="text-secondary">In Progress: </span>
                      <span className="font-bold text-primary">{sprint.metrics.inProgressTasks}</span>
                    </div>
                    {sprint.metrics.blockedTasks > 0 && (
                      <div>
                        <span className="text-secondary">Blocked: </span>
                        <span className="font-bold text-danger">{sprint.metrics.blockedTasks}</span>
                      </div>
                    )}
                  </div>

                  {/* Lifecycle Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    {sprint.status === 'PLANNED' && (
                      <Button variant="primary" size="sm" onClick={() => handleStartSprint(sprint.id)}>
                        <Play size={12} style={{ marginRight: 4 }} />
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === 'ACTIVE' && (
                      <Button variant="success" size="sm" onClick={() => handleCompleteSprint(sprint.id, 'BACKLOG')}>
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        Complete Sprint
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: GANTT SCHEDULE & TIMELINE */}
      {/* ========================================================================= */}
      {activeView === 'gantt' && (
        <Card>
          <CardHeader
            title="Interactive Gantt Schedule"
            subtitle="Chronological timeline with duration bars, completion fills, and milestone markers."
            action={
              <Button variant="secondary" size="sm" onClick={handleCaptureBaseline}>
                <Sparkles size={14} style={{ marginRight: 4 }} />
                Capture Schedule Baseline
              </Button>
            }
          />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No tasks to display on timeline. Create tasks with start and due dates.
                </div>
              ) : (
                tasks.map((task) => {
                  const estDays = Math.max(1, Math.ceil(task.estimatedHours / 8));
                  const progressWidth = `${task.progress || (task.rdStatus === 'DONE' ? 100 : 0)}%`;

                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{task.title}</span>
                          <Badge variant="neutral" style={{ fontSize: '10px' }}>
                            {task.taskType}
                          </Badge>
                          {task.isBlocked && (
                            <Badge variant="danger" style={{ fontSize: '10px' }}>
                              Blocked
                            </Badge>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {task.startDate ? task.startDate.slice(5, 10) : 'TBD'} → {task.dueDate ? task.dueDate.slice(5, 10) : 'TBD'} ({estDays} days)
                        </div>
                      </div>

                      {/* Visual Gantt Bar */}
                      <div
                        style={{
                          height: '14px',
                          backgroundColor: 'rgba(2, 132, 199, 0.15)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: progressWidth,
                            backgroundColor: task.rdStatus === 'DONE' ? '#10b981' : task.isBlocked ? '#ef4444' : '#0284c7',
                            borderRadius: '6px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: MATHEMATICAL CRITICAL PATH METHOD (CPM) */}
      {/* ========================================================================= */}
      {activeView === 'cpm' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Mathematical Critical Path Method (CPM) Engine"
              subtitle="Topological ordering, Forward Pass (ES, EF), Backward Pass (LS, LF), Total Float and zero-float critical path detection."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (selectedProjectId) apiClient.get(`/rd/cpm/${selectedProjectId}`).then((res) => setCpmData(res.data));
                  }}
                >
                  <RefreshCw size={14} style={{ marginRight: 4 }} />
                  Recalculate CPM
                </Button>
              }
            />
            <CardBody>
              {cpmData ? (
                <div className="flex flex-col gap-6">
                  {/* Summary Banner */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ca8a04' }}>
                        Project Duration: {cpmData.projectDurationDays} Days
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Critical Chain: {cpmData.criticalPath.map((cp) => cp.title).join(' → ') || 'No critical path identified'}
                      </div>
                    </div>
                    <Badge variant="warning" style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px' }}>
                      {cpmData.criticalTaskCount} Critical Tasks (Zero Float)
                    </Badge>
                  </div>

                  {/* Mathematical CPM Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>Task Title</TableCell>
                        <TableCell isHeader>Duration (Days)</TableCell>
                        <TableCell isHeader>Early Start (ES)</TableCell>
                        <TableCell isHeader>Early Finish (EF)</TableCell>
                        <TableCell isHeader>Late Start (LS)</TableCell>
                        <TableCell isHeader>Late Finish (LF)</TableCell>
                        <TableCell isHeader>Total Float (TF)</TableCell>
                        <TableCell isHeader>Classification</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cpmData.tasks.map((ct) => (
                        <TableRow
                          key={ct.id}
                          style={{
                            backgroundColor: ct.isCritical ? 'rgba(234, 179, 8, 0.05)' : 'transparent',
                          }}
                        >
                          <TableCell>
                            <span style={{ fontWeight: ct.isCritical ? 800 : 600 }}>{ct.title}</span>
                          </TableCell>
                          <TableCell>{ct.durationDays}d</TableCell>
                          <TableCell>{ct.earlyStart}</TableCell>
                          <TableCell>{ct.earlyFinish}</TableCell>
                          <TableCell>{ct.lateStart}</TableCell>
                          <TableCell>{ct.lateFinish}</TableCell>
                          <TableCell>
                            <span style={{ fontWeight: 700, color: ct.totalFloat === 0 ? '#ca8a04' : 'var(--text-secondary)' }}>
                              {ct.totalFloat}d
                            </span>
                          </TableCell>
                          <TableCell>
                            {ct.isCritical ? (
                              <Badge variant="warning" style={{ fontSize: '10px', fontWeight: 800 }}>
                                CRITICAL (0 Float)
                              </Badge>
                            ) : (
                              <Badge variant="neutral" style={{ fontSize: '10px' }}>
                                Non-Critical
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Zap size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Select an R&D project above to calculate its CPM network schedule.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: SCHEDULE VARIANCE ALERTS */}
      {/* ========================================================================= */}
      {activeView === 'alerts' && (
        <Card>
          <CardHeader
            title="Automated Schedule Variance & Blocker Alerts"
            subtitle="Proactive detection of overdue tasks, upcoming milestones, and unmet predecessor dependencies."
            action={
              <Button variant="primary" size="sm" onClick={handleScanAlerts}>
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                Run Alert Scan
              </Button>
            }
          />
          <CardBody className="p-0">
            {alerts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 12px auto', color: '#10b981' }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No Active Schedule Alerts</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>All task dependencies and milestone commitments are on track.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Severity</TableCell>
                    <TableCell isHeader>Alert Type</TableCell>
                    <TableCell isHeader>Message / Reason</TableCell>
                    <TableCell isHeader>Linked Task</TableCell>
                    <TableCell isHeader>Detected</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Action</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'} style={{ fontSize: '10px', fontWeight: 800 }}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>{alert.alertType}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px' }}>{alert.message}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{alert.task?.title || 'Project Level'}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{alert.detectedAt.slice(0, 10)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.status === 'ACTIVE' ? 'primary' : 'success'} style={{ fontSize: '10px' }}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.status === 'ACTIVE' && (
                          <Button variant="secondary" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT R&D TASK */}
      {/* ========================================================================= */}
      {showTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                {editingTask ? 'Edit R&D Task' : 'Create Operational R&D Task'}
              </h3>
              <button onClick={() => setShowTaskModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Synthesize Polymer Composite Batch 04"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Operational parameters, protocol details, acceptance criteria..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Project</label>
                  <select
                    value={taskForm.projectId}
                    onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="">None / Standalone</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Sprint</label>
                  <select
                    value={taskForm.sprintId}
                    onChange={(e) => setTaskForm({ ...taskForm, sprintId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="">None / Backlog</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Task Type</label>
                  <select
                    value={taskForm.taskType}
                    onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="TASK">Task</option>
                    <option value="USER_STORY">User Story</option>
                    <option value="RESEARCH_SPIKE">Research Spike</option>
                    <option value="BUG">Bug</option>
                    <option value="TECHNICAL_DEBT">Tech Debt</option>
                    <option value="SUBTASK">Subtask</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <Button variant="secondary" type="button" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SPRINT */}
      {/* ========================================================================= */}
      {showSprintModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Plan New Sprint</h3>
              <button onClick={() => setShowSprintModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSprint} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Sprint Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sprint 2026-Q4-02: Synthesis Protocol"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Sprint Goal</label>
                <textarea
                  rows={2}
                  placeholder="Primary objective or hypothesis to validate..."
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Project</label>
                <select
                  value={sprintForm.projectId}
                  onChange={(e) => setSprintForm({ ...sprintForm, projectId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="">Global / Unassigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    value={sprintForm.startDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>End Date</label>
                  <input
                    type="date"
                    value={sprintForm.endDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <Button variant="secondary" type="button" onClick={() => setShowSprintModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create Sprint
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LINK TASK DEPENDENCIES */}
      {/* ========================================================================= */}
      {showDepModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Establish Task Dependency Edge</h3>
              <button onClick={() => setShowDepModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDependency} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Predecessor Task (Must Complete First) *</label>
                <select
                  required
                  value={depForm.predecessorId}
                  onChange={(e) => setDepForm({ ...depForm, predecessorId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="">Select Predecessor...</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.rdStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Successor Task (Dependent) *</label>
                <select
                  required
                  value={depForm.successorId}
                  onChange={(e) => setDepForm({ ...depForm, successorId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="">Select Successor...</option>
                  {tasks
                    .filter((t) => t.id !== depForm.predecessorId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.rdStatus})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Link Type</label>
                  <select
                    value={depForm.dependencyType}
                    onChange={(e) => setDepForm({ ...depForm, dependencyType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="FS">Finish-to-Start (FS)</option>
                    <option value="SS">Start-to-Start (SS)</option>
                    <option value="FF">Finish-to-Finish (FF)</option>
                    <option value="SF">Start-to-Finish (SF)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Lag Days</label>
                  <input
                    type="number"
                    min="0"
                    value={depForm.lagDays}
                    onChange={(e) => setDepForm({ ...depForm, lagDays: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <Button variant="secondary" type="button" onClick={() => setShowDepModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Establish Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
