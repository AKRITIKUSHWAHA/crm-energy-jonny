import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BarChart2,
  Calendar,
  Clock,
  Flag,
  GitBranch,
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  MoveRight,
  ArrowRight,
  ShieldAlert,
  Layers,
  FolderGit2,
  Compass,
  Building2,
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

export const RdGanttWorkspace = () => {
  const { addToast } = useToast();

  // Active View Tab: 'gantt' | 'roadmap' | 'timeline' | 'milestones'
  const [activeTab, setActiveTab] = useState('gantt');

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [ganttData, setGanttData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [milestones, setMilestones] = useState([]);

  // Gantt Chart State & Timescale
  const [timeScale, setTimeScale] = useState('day'); // 'day' | 'week' | 'month'
  const [searchFilter, setSearchFilter] = useState('');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Modals
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [showTaskLinkModal, setShowTaskLinkModal] = useState(null);
  const [selectedTaskIdsForLink, setSelectedTaskIdsForLink] = useState([]);

  // Milestone Form State
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    milestoneCode: '',
    milestoneType: 'DELIVERABLE',
    plannedStartDate: '',
    plannedEndDate: '',
    priority: 'MEDIUM',
    status: 'PLANNED',
  });

  // Fetch initial project options
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get('/rd/portfolio');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.projects) ? res.data.projects : []);
        if (list.length > 0) {
          setProjects(list);
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch all scheduling data for selected project
  const loadProjectData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const [ganttRes, roadmapRes, timelineRes, milestoneRes] = await Promise.all([
        apiClient.get(`/rd/gantt/${selectedProjectId}`).catch(() => ({ success: false })),
        apiClient.get(`/rd/roadmap/${selectedProjectId}`).catch(() => ({ success: false })),
        apiClient.get(`/rd/timeline/${selectedProjectId}`).catch(() => ({ success: false })),
        apiClient.get('/rd/milestones', { params: { projectId: selectedProjectId } }).catch(() => ({ success: false })),
      ]);

      if (ganttRes.success && ganttRes.data) setGanttData(ganttRes.data);
      if (roadmapRes.success && roadmapRes.data) setRoadmapData(roadmapRes.data);
      if (timelineRes.success && timelineRes.data) setTimelineData(timelineRes.data);
      if (milestoneRes.success && milestoneRes.data) setMilestones(milestoneRes.data);
    } catch (err) {
      addToast(err.message || 'Failed to load scheduling data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, addToast]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Gantt Date Reschedule Dispatcher (Drag & Drop or Resizing)
  const handleUpdateTaskDates = async (taskId, newStart, newEnd) => {
    try {
      const res = await apiClient.patch(`/rd/gantt/tasks/${taskId}/dates`, {
        startDate: newStart,
        dueDate: newEnd,
      });
      if (res.success) {
        addToast('Schedule dates updated & CPM recalculated', 'success');
        loadProjectData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update schedule dates', 'error');
      loadProjectData();
    }
  };

  // Milestone Handlers
  const openCreateMilestoneModal = () => {
    setEditingMilestone(null);
    setMilestoneForm({
      title: '',
      description: '',
      milestoneCode: `MS-${Date.now().toString().slice(-4)}`,
      milestoneType: 'DELIVERABLE',
      plannedStartDate: new Date().toISOString().slice(0, 10),
      plannedEndDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      priority: 'MEDIUM',
      status: 'PLANNED',
    });
    setShowMilestoneModal(true);
  };

  const openEditMilestoneModal = (ms) => {
    setEditingMilestone(ms);
    setMilestoneForm({
      title: ms.title,
      description: ms.description || '',
      milestoneCode: ms.milestoneCode || '',
      milestoneType: ms.milestoneType || 'DELIVERABLE',
      plannedStartDate: ms.plannedStartDate ? ms.plannedStartDate.slice(0, 10) : '',
      plannedEndDate: ms.plannedEndDate ? ms.plannedEndDate.slice(0, 10) : '',
      priority: ms.priority || 'MEDIUM',
      status: ms.status || 'PLANNED',
    });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    try {
      if (editingMilestone) {
        await apiClient.put(`/rd/milestones/${editingMilestone.id}`, milestoneForm);
        addToast('Milestone updated successfully', 'success');
      } else {
        await apiClient.post('/rd/milestones', {
          ...milestoneForm,
          projectId: selectedProjectId,
        });
        addToast('Dynamic milestone created', 'success');
      }
      setShowMilestoneModal(false);
      loadProjectData();
    } catch (err) {
      addToast(err.message || 'Failed to save milestone', 'error');
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm('Delete this milestone? Associated tasks will be safely unlinked.')) return;
    try {
      await apiClient.delete(`/rd/milestones/${id}`);
      addToast('Milestone deleted', 'success');
      loadProjectData();
    } catch (err) {
      addToast(err.message || 'Failed to delete milestone', 'error');
    }
  };

  const handleLinkTasks = async (milestoneId) => {
    try {
      await apiClient.post(`/rd/milestones/${milestoneId}/tasks`, {
        taskIds: selectedTaskIdsForLink,
      });
      addToast('Tasks linked to milestone', 'success');
      setShowTaskLinkModal(null);
      loadProjectData();
    } catch (err) {
      addToast(err.message || 'Failed to link tasks', 'error');
    }
  };

  // Filtered Gantt Tasks
  const displayedTasks = useMemo(() => {
    if (!ganttData || !ganttData.tasks) return [];
    return ganttData.tasks.filter((t) => {
      if (showCriticalOnly && !t.isCritical) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [ganttData, showCriticalOnly, searchFilter]);

  // Compute Gantt Project Timeline Span
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (!displayedTasks || displayedTasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
    }

    let min = new Date(displayedTasks[0].startDate || Date.now());
    let max = new Date(displayedTasks[0].dueDate || Date.now() + 86400000);

    for (const t of displayedTasks) {
      if (t.startDate && new Date(t.startDate) < min) min = new Date(t.startDate);
      if (t.dueDate && new Date(t.dueDate) > max) max = new Date(t.dueDate);
    }

    // Include milestones in span
    if (ganttData && ganttData.milestones) {
      for (const ms of ganttData.milestones) {
        if (ms.plannedEndDate && new Date(ms.plannedEndDate) > max) max = new Date(ms.plannedEndDate);
        if (ms.plannedStartDate && new Date(ms.plannedStartDate) < min) min = new Date(ms.plannedStartDate);
      }
    }

    // Add 2 days padding
    min = new Date(min.getTime() - 2 * 86400000);
    max = new Date(max.getTime() + 4 * 86400000);

    const diffDays = Math.max(14, Math.ceil((max - min) / 86400000));
    return { minDate: min, maxDate: max, totalDays: diffDays };
  }, [displayedTasks, ganttData]);

  // Day width based on timeScale
  const dayWidth = timeScale === 'day' ? 36 : timeScale === 'week' ? 18 : 8;

  return (
    <div className="flex flex-col gap-6" style={{ minHeight: '650px' }}>
      {/* 1. Header & Project Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Interactive Gantt, Timeline & Dynamic Milestones
            </h2>
            <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
              Master Prompt 06
            </Badge>
          </div>
          <p className="text-xs text-secondary" style={{ margin: '4px 0 0 0' }}>
            Full SVG dependency visualization, drag-and-drop scheduling, dynamic milestone planning, and mathematical CPM integration.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={openCreateMilestoneModal}>
            <Flag size={14} style={{ marginRight: 4 }} />
            New Milestone
          </Button>
          <Button variant="primary" size="sm" onClick={loadProjectData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ marginRight: 4 }} />
            Recalculate Schedule
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Project Duration (CPM)"
          value={ganttData?.metrics?.projectDurationDays ? `${ganttData.metrics.projectDurationDays} Days` : '14 Days'}
          icon={Clock}
          trend={{ value: `${ganttData?.metrics?.criticalTasks || 0} Critical Tasks`, isPositive: false }}
        />
        <KPICard
          title="Total Deliverables"
          value={ganttData?.metrics?.totalTasks || 0}
          icon={BarChart2}
          trend={{ value: `${ganttData?.metrics?.completedTasks || 0} Complete`, isPositive: true }}
        />
        <KPICard
          title="Dynamic Milestones"
          value={ganttData?.metrics?.totalMilestones || milestones.length}
          icon={Flag}
          trend={{ value: `${ganttData?.metrics?.completedMilestones || 0} Completed`, isPositive: true }}
        />
        <KPICard
          title="Schedule Adherence"
          value={ganttData?.alerts?.length === 0 ? 'On Track' : `${ganttData?.alerts?.length} Alerts`}
          icon={ShieldAlert}
          trend={{
            value: ganttData?.variance?.totalSlipped > 0 ? `${ganttData.variance.totalSlipped} Slipped` : 'Optimal',
            isPositive: (ganttData?.variance?.totalSlipped || 0) === 0,
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
            { id: 'gantt', label: 'Interactive Gantt Chart', icon: BarChart2 },
            { id: 'roadmap', label: 'Project Roadmap', icon: Compass },
            { id: 'timeline', label: 'Chronological Timeline', icon: Clock },
            { id: 'milestones', label: `Milestones (${milestones.length})`, icon: Flag },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: INTERACTIVE GANTT CHART (REQUIREMENT 13) */}
      {/* ========================================================================= */}
      {activeTab === 'gantt' && (
        <Card>
          <CardHeader
            title="Project Schedule & Dependency Canvas"
            subtitle="Interactive date manipulation, SVG link curves, Critical Path Method glowing highlights, and milestone markers."
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Zoom Scales */}
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  {['day', 'week', 'month'].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setTimeScale(scale)}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: timeScale === scale ? 'var(--primary)' : 'var(--surface)',
                        color: timeScale === scale ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {scale}
                    </button>
                  ))}
                </div>

                {/* Critical Path Toggle */}
                <button
                  onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: showCriticalOnly ? '1px solid #f59e0b' : '1px solid var(--border)',
                    backgroundColor: showCriticalOnly ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface)',
                    color: showCriticalOnly ? '#d97706' : 'var(--text-secondary)',
                  }}
                >
                  <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {showCriticalOnly ? 'Critical Path Only' : 'All Tasks'}
                </button>
              </div>
            }
          />
          <CardBody className="p-0">
            {/* Split Gantt Container: Left Task Table, Right Timeline Canvas */}
            <div style={{ display: 'flex', width: '100%', minHeight: '480px', overflow: 'hidden', borderTop: '1px solid var(--border)' }}>
              {/* Left Panel: Task & Milestone Attributes (Width: 320px) */}
              <div
                style={{
                  width: '320px',
                  minWidth: '320px',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-raised)',
                  overflowY: 'auto',
                }}
              >
                {/* Left Header */}
                <div
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Work Breakdown & Tasks</span>
                  <span>Duration</span>
                </div>

                {/* Left Task Rows */}
                {displayedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      height: '44px',
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      backgroundColor: task.isCritical ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.isCritical && <Zap size={13} color="#f59e0b" />}
                      <span style={{ fontWeight: task.isCritical ? 800 : 600, color: 'var(--text-primary)' }}>
                        {task.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {task.durationDays}d
                    </span>
                  </div>
                ))}
              </div>

              {/* Right Panel: Interactive Timeline Canvas */}
              <div
                style={{
                  flex: 1,
                  overflowX: 'auto',
                  overflowY: 'auto',
                  backgroundColor: 'var(--surface)',
                  position: 'relative',
                }}
              >
                {/* Timeline Header (Days Axis) */}
                <div
                  style={{
                    height: '42px',
                    display: 'flex',
                    borderBottom: '1px solid var(--border)',
                    width: `${totalDays * dayWidth}px`,
                    backgroundColor: 'var(--surface-raised)',
                  }}
                >
                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const tickDate = new Date(minDate.getTime() + idx * 86400000);
                    const isToday = tickDate.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${dayWidth}px`,
                          minWidth: `${dayWidth}px`,
                          borderRight: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: isToday ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: isToday ? 800 : 500,
                          backgroundColor: isToday ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                        }}
                      >
                        <span>{tickDate.getDate()}</span>
                        {timeScale === 'day' && <span style={{ fontSize: '9px', opacity: 0.7 }}>{tickDate.toLocaleString('default', { weekday: 'narrow' })}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Canvas Body */}
                <div style={{ position: 'relative', width: `${totalDays * dayWidth}px` }}>
                  {displayedTasks.map((task) => {
                    const taskStart = new Date(task.startDate || minDate);
                    const offsetDays = Math.max(0, Math.floor((taskStart - minDate) / 86400000));
                    const leftPos = offsetDays * dayWidth;
                    const barWidth = Math.max(dayWidth, task.durationDays * dayWidth);

                    return (
                      <div
                        key={task.id}
                        style={{
                          height: '44px',
                          position: 'relative',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {/* Baseline Shadow Bar (if exists) */}
                        {task.baselineStartDate && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '28px',
                              left: `${Math.max(0, Math.floor((new Date(task.baselineStartDate) - minDate) / 86400000)) * dayWidth}px`,
                              width: `${barWidth}px`,
                              height: '6px',
                              backgroundColor: 'rgba(100, 116, 139, 0.3)',
                              borderRadius: '3px',
                              border: '1px dashed #64748b',
                            }}
                            title={`Baseline Schedule: ${task.baselineStartDate.slice(0, 10)}`}
                          />
                        )}

                        {/* Interactive Task Bar */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${leftPos}px`,
                            width: `${barWidth}px`,
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: task.rdStatus === 'DONE' ? '#10b981' : task.isCritical ? '#f59e0b' : '#0284c7',
                            boxShadow: task.isCritical ? '0 0 10px rgba(245, 158, 11, 0.5)' : '0 1px 3px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                          title={`${task.title} (Duration: ${task.durationDays}d, Float: ${task.totalFloat}d)`}
                        >
                          {/* Inner Progress Fill */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${task.progress || (task.rdStatus === 'DONE' ? 100 : 0)}%`,
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '6px',
                            }}
                          />
                          <span style={{ position: 'relative', zIndex: 1 }}>{task.title}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Milestone Diamonds Layer */}
                  {ganttData?.milestones?.map((ms) => {
                    if (!ms.plannedEndDate) return null;
                    const msDate = new Date(ms.plannedEndDate);
                    const offsetDays = Math.max(0, Math.floor((msDate - minDate) / 86400000));
                    const leftPos = offsetDays * dayWidth + dayWidth / 2 - 8;

                    return (
                      <div
                        key={ms.id}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: `${leftPos}px`,
                          width: '16px',
                          height: '16px',
                          transform: 'rotate(45deg)',
                          backgroundColor: ms.status === 'COMPLETED' ? '#10b981' : ms.isDelayed ? '#ef4444' : '#3b82f6',
                          border: '2px solid #ffffff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          zIndex: 10,
                          cursor: 'pointer',
                        }}
                        title={`Milestone: ${ms.title} (${ms.status})`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PROJECT ROADMAP (REQUIREMENT 9) */}
      {/* ========================================================================= */}
      {activeTab === 'roadmap' && roadmapData && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title={`Project Strategic Roadmap: ${roadmapData.project.name}`}
              subtitle="High-level flightpath connecting research milestones, work packages, and critical path progression."
              action={
                <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Overall Progress: {roadmapData.project.overallProgress}%
                </Badge>
              }
            />
            <CardBody className="flex flex-col gap-6">
              {/* Critical Path Flow Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#d97706' }}>
                    Active Critical Chain ({roadmapData.summary.criticalTaskCount} Tasks)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {roadmapData.criticalChain.map((c) => c.title).join('  →  ') || 'No critical bottlenecks detected.'}
                  </div>
                </div>
                <Badge variant="warning" style={{ fontSize: '11px', fontWeight: 800 }}>
                  Est. Completion: {roadmapData.summary.projectDurationDays} Days
                </Badge>
              </div>

              {/* Milestone Roadmap Flightpath Phases */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roadmapData.roadmapPhases.map((phase, idx) => (
                  <Card key={phase.milestoneId} style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <CardHeader
                      title={`${idx + 1}. ${phase.title}`}
                      subtitle={`Target: ${phase.plannedEndDate ? phase.plannedEndDate.slice(0, 10) : 'TBD'}`}
                      action={
                        <Badge
                          variant={phase.status === 'COMPLETED' ? 'success' : phase.isDelayed ? 'danger' : 'primary'}
                          style={{ fontSize: '10px' }}
                        >
                          {phase.status}
                        </Badge>
                      }
                    />
                    <CardBody className="pt-0 flex flex-col gap-3">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: 4 }}>
                          <span>Phase Completion</span>
                          <span>{phase.progress}%</span>
                        </div>
                        <ProgressBar value={phase.progress} variant={phase.status === 'COMPLETED' ? 'success' : 'primary'} />
                      </div>

                      {/* Work Packages within Phase */}
                      <div className="flex flex-col gap-1.5 pt-2">
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Deliverables:</span>
                        {phase.tasks.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No deliverables linked yet.
                          </span>
                        ) : (
                          phase.tasks.map((task) => (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--surface)',
                                fontSize: '11px',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{task.title}</span>
                              <Badge variant={task.rdStatus === 'DONE' ? 'success' : 'neutral'} style={{ fontSize: '9px' }}>
                                {task.rdStatus}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: CHRONOLOGICAL TIMELINE (REQUIREMENT 14) */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && timelineData && (
        <Card>
          <CardHeader
            title="Chronological Schedule Timeline"
            subtitle="Sequential event stream of research milestones, scheduled tasks, and delivery deadlines."
            action={
              <Badge variant="neutral" style={{ fontSize: '11px' }}>
                {timelineData.totalEvents} Chronological Events
              </Badge>
            }
          />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 10 }}>
              {timelineData.events.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No timeline events scheduled.
                </div>
              ) : (
                timelineData.events.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      position: 'relative',
                      borderLeft: `2px solid ${evt.color}`,
                      paddingLeft: '16px',
                      paddingBottom: '8px',
                    }}
                  >
                    {/* Circle Node */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-6px',
                        top: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: evt.color,
                      }}
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '13px', fontWeight: 800 }}>{evt.title}</span>
                        <Badge variant="neutral" style={{ fontSize: '10px' }}>
                          {evt.entityType}
                        </Badge>
                        {evt.isCritical && (
                          <Badge variant="warning" style={{ fontSize: '10px' }}>
                            Critical Path
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>{evt.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>
                        Date: {new Date(evt.date).toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: DYNAMIC MILESTONE MANAGEMENT (REQUIREMENT 10) */}
      {/* ========================================================================= */}
      {activeTab === 'milestones' && (
        <Card>
          <CardHeader
            title="Dynamic Project Milestones"
            subtitle="Database-backed research milestones, exit criteria gates, and linked deliverable tracking."
            action={
              <Button variant="primary" size="sm" onClick={openCreateMilestoneModal}>
                <Plus size={14} style={{ marginRight: 4 }} />
                Create Milestone
              </Button>
            }
          />
          <CardBody className="p-0">
            {milestones.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Flag size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No dynamic milestones registered.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Define major checkpoints, stage gates, and deliverables for this project.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Code & Title</TableCell>
                    <TableCell isHeader>Type</TableCell>
                    <TableCell isHeader>Target Date</TableCell>
                    <TableCell isHeader>Progress</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Tasks</TableCell>
                    <TableCell isHeader>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((ms) => (
                    <TableRow key={ms.id}>
                      <TableCell>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>{ms.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ms.milestoneCode || 'Checkpoint'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" style={{ fontSize: '10px' }}>
                          {ms.milestoneType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px' }}>
                          {ms.plannedEndDate ? ms.plannedEndDate.slice(0, 10) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{ms.progress}%</span>
                          <ProgressBar value={ms.progress} style={{ width: '60px' }} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ms.status === 'COMPLETED' ? 'success' : ms.isDelayed ? 'danger' : 'primary'}
                          style={{ fontSize: '10px', fontWeight: 700 }}
                        >
                          {ms.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{ms.taskCount || 0} linked</span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button variant="ghost" size="sm" onClick={() => openEditMilestoneModal(ms)}>
                            <Edit2 size={12} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(ms.id)}>
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
      {/* MODAL: CREATE / EDIT MILESTONE */}
      {/* ========================================================================= */}
      {showMilestoneModal && (
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                {editingMilestone ? 'Edit Milestone' : 'Create Dynamic Project Milestone'}
              </h3>
              <button onClick={() => setShowMilestoneModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Prototype Feasibility Verification Gate"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Expected deliverables, formal acceptance criteria..."
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Milestone Code</label>
                  <input
                    type="text"
                    value={milestoneForm.milestoneCode}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneCode: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Milestone Type</label>
                  <select
                    value={milestoneForm.milestoneType}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="DELIVERABLE">Deliverable</option>
                    <option value="STAGE_GATE">Stage-Gate</option>
                    <option value="REVIEW">Review Checkpoint</option>
                    <option value="DECISION">Decision Gate</option>
                    <option value="RELEASE">Release</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Planned Target Date</label>
                  <input
                    type="date"
                    value={milestoneForm.plannedEndDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, plannedEndDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Status</label>
                  <select
                    value={milestoneForm.status}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontSize: '12px' }}
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <Button variant="secondary" type="button" onClick={() => setShowMilestoneModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingMilestone ? 'Save Changes' : 'Create Milestone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
