import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Plus,
  RefreshCw,
  Search,
  Target,
  Layers,
  FolderGit2,
  DollarSign,
  TrendingUp,
  Link,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';
import {
  Breadcrumb,
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
  Input,
  Select,
  Modal
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdStrategicAlignment = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'

  // Modals
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [alignModalOpen, setAlignModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [goalForm, setGoalForm] = useState({
    code: '',
    title: '',
    category: 'Growth & Innovation',
    targetYear: new Date().getFullYear(),
    targetValue: '',
    description: '',
  });

  const [alignForm, setAlignForm] = useState({
    projectId: '',
    goalId: '',
    alignmentRationale: '',
    impactWeight: 1.0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, matrixRes, projectsRes] = await Promise.all([
        apiClient.get('/rd/strategy/goals'),
        apiClient.get('/rd/strategy/matrix').catch(() => ({ success: false, data: null })),
        apiClient.get('/rd/portfolio', { params: { limit: 100 } }).catch(() => ({ success: false, data: { projects: [] } })),
      ]);

      if (goalsRes.success && Array.isArray(goalsRes.data)) {
        setGoals(goalsRes.data);
      }
      if (matrixRes.success && matrixRes.data) {
        setMatrixData(matrixRes.data);
      }
      if (projectsRes.success && projectsRes.data?.projects) {
        setAvailableProjects(projectsRes.data.projects);
      }
    } catch (err) {
      console.error('[RdStrategicAlignment] Fetch error:', err);
      addToast({
        title: 'Strategy Error',
        message: err.message || 'Failed to fetch strategic alignment data.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.title.trim()) {
      addToast({ title: 'Validation', message: 'Goal title is required.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/rd/strategy/goals', goalForm);
      if (res.success) {
        addToast({ title: 'Goal Created', message: 'Strategic goal registered.', type: 'success' });
        setCreateGoalModalOpen(false);
        setGoalForm({
          code: '',
          title: '',
          category: 'Growth & Innovation',
          targetYear: new Date().getFullYear(),
          targetValue: '',
          description: '',
        });
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlignProject = async (e) => {
    e.preventDefault();
    if (!alignForm.projectId || !alignForm.goalId) {
      addToast({ title: 'Validation', message: 'Please select both project and goal.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/rd/strategy/align', alignForm);
      if (res.success) {
        addToast({ title: 'Aligned', message: 'Project mapped to strategic goal.', type: 'success' });
        setAlignModalOpen(false);
        setAlignForm({ projectId: '', goalId: '', alignmentRationale: '', impactWeight: 1.0 });
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAlignment = async (alignmentId) => {
    if (!window.confirm('Are you sure you want to remove this project-goal alignment?')) return;
    try {
      const res = await apiClient.delete(`/rd/strategy/align/${alignmentId}`);
      if (res.success) {
        addToast({ title: 'Alignment Removed', message: 'Link uncoupled.', type: 'info' });
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Rollups
  const totalAllocated = goals.reduce((sum, g) => sum + (g.metrics?.totalAllocatedBudget || 0), 0);
  const totalLinkedProjects = goals.reduce((sum, g) => sum + (g.metrics?.linkedProjectsCount || 0), 0);

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Strategic Alignment' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Strategic Alignment Tracking
            </h1>
            <Badge variant="success">Req 5 — Innovation Themes</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Connect research initiatives directly to enterprise objectives, innovation themes, and budget allocations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAlignModalOpen(true)} leftIcon={<Link size={14} />}>
            Map Initiative to Goal
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateGoalModalOpen(true)} leftIcon={<Plus size={14} />}>
            New Strategic Goal
          </Button>
        </div>
      </div>

      {/* 2. KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard
          title="Active Strategic Goals"
          value={goals.length}
          change="Enterprise themes"
          trend="neutral"
          icon={<Target size={20} />}
        />
        <KPICard
          title="Aligned Initiatives"
          value={totalLinkedProjects}
          change="R&D projects mapped"
          trend="positive"
          icon={<FolderGit2 size={20} />}
        />
        <KPICard
          title="Budget Committed to Goals"
          value={`$${totalAllocated.toLocaleString()}`}
          change="Strategic funding rollup"
          trend="positive"
          icon={<DollarSign size={20} />}
        />
        <KPICard
          title="Portfolio Coverage"
          value={matrixData ? `${((matrixData.goalContributions?.length || 0) / (goals.length || 1) * 100).toFixed(0)}%` : '100%'}
          change="Active thematic alignment"
          trend="positive"
          icon={<Compass size={20} />}
        />
      </div>

      {/* 3. View Toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          size="sm"
          variant={viewMode === 'list' ? 'primary' : 'outline'}
          onClick={() => setViewMode('list')}
          leftIcon={<Compass size={14} />}
        >
          Goals Directory & Projects
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'matrix' ? 'primary' : 'outline'}
          onClick={() => setViewMode('matrix')}
          leftIcon={<TableIcon size={14} />}
        >
          Strategic Alignment Matrix
        </Button>
      </div>

      {/* 4. Main View Content */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading strategic goals...
            </div>
          ) : goals.length === 0 ? (
            <Card>
              <CardBody style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Target size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>No Strategic Goals Defined</p>
                <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)' }}>
                  Create strategic goals to guide research prioritization and portfolio budgeting.
                </p>
                <Button size="sm" variant="primary" onClick={() => setCreateGoalModalOpen(true)}>
                  Create First Strategic Goal
                </Button>
              </CardBody>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                          {goal.code}
                        </span>
                        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                          {goal.title}
                        </h2>
                        <Badge variant="outline">{goal.category}</Badge>
                        <Badge variant="success">{goal.status}</Badge>
                      </div>
                      {goal.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                        Target: {goal.targetValue || `CY ${goal.targetYear}`}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Allocated: ${(goal.metrics?.totalAllocatedBudget || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody style={{ padding: 0 }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Aligned R&D Initiatives ({goal.projectAlignments?.length || 0})
                  </div>
                  {goal.projectAlignments && goal.projectAlignments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader>Initiative Name</TableCell>
                          <TableCell isHeader>Budget</TableCell>
                          <TableCell isHeader>Progress</TableCell>
                          <TableCell isHeader>Status</TableCell>
                          <TableCell isHeader>Impact Weight</TableCell>
                          <TableCell isHeader>Strategic Rationale</TableCell>
                          <TableCell isHeader style={{ textAlign: 'right' }}>Action</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goal.projectAlignments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell style={{ fontWeight: 600 }}>{a.project?.name || 'Project'}</TableCell>
                            <TableCell>${parseFloat(a.project?.budget || 0).toLocaleString()}</TableCell>
                            <TableCell>{a.project?.progress || 0}%</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{a.project?.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Weight: {a.impactWeight}</Badge>
                            </TableCell>
                            <TableCell style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                              {a.alignmentRationale || 'Direct strategic alignment'}
                            </TableCell>
                            <TableCell style={{ textAlign: 'right' }}>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleRemoveAlignment(a.id)}
                                title="Unlink"
                              >
                                <Trash2 size={12} color="#ef4444" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      No initiatives currently mapped to this goal.{' '}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setAlignForm((prev) => ({ ...prev, goalId: goal.id }));
                          setAlignModalOpen(true);
                        }}
                      >
                        + Map Initiative
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Matrix View */
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                Strategic Goal Contribution & Budget Allocation Matrix
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Rollup Across Portfolio
              </span>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Goal Code</TableCell>
                    <TableCell isHeader>Strategic Theme</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Linked Initiatives</TableCell>
                    <TableCell isHeader>Allocated Budget</TableCell>
                    <TableCell isHeader>Portfolio Share</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData?.goalContributions?.map((gc) => (
                    <TableRow key={gc.goalId}>
                      <TableCell style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {gc.code}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{gc.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{gc.category}</Badge>
                      </TableCell>
                      <TableCell>{gc.linkedProjectCount} projects</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>${(gc.allocatedBudget || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{gc.budgetSharePct}% of total</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 5. Create Goal Modal */}
      <Modal isOpen={createGoalModalOpen} onClose={() => setCreateGoalModalOpen(false)} title="Define Strategic Goal">
        <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Goal Title *
            </label>
            <Input
              required
              placeholder="e.g., Achieve 40% Grid Efficiency via Next-Gen Inverters"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Goal Code (Optional)
              </label>
              <Input
                placeholder="Auto-generated if empty"
                value={goalForm.code}
                onChange={(e) => setGoalForm({ ...goalForm, code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Strategic Category
              </label>
              <Select
                value={goalForm.category}
                onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                options={[
                  { value: 'Growth & Innovation', label: 'Growth & Innovation' },
                  { value: 'Operational Excellence', label: 'Operational Excellence' },
                  { value: 'Sustainability', label: 'Sustainability & ESG' },
                  { value: 'Customer Experience', label: 'Customer Experience' },
                  { value: 'Platform Modernization', label: 'Platform Modernization' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Target Year
              </label>
              <Input
                type="number"
                value={goalForm.targetYear}
                onChange={(e) => setGoalForm({ ...goalForm, targetYear: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Target Metric / Value
              </label>
              <Input
                placeholder="e.g., 25% cost reduction"
                value={goalForm.targetValue}
                onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Strategic Rationale & Description
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                minHeight: 60,
                boxSizing: 'border-box'
              }}
              placeholder="Explain how this goal advances the company's innovation agenda..."
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setCreateGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create Strategic Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Map Initiative to Goal Modal */}
      <Modal isOpen={alignModalOpen} onClose={() => setAlignModalOpen(false)} title="Map Initiative to Strategic Goal">
        <form onSubmit={handleAlignProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Select R&D Initiative *
            </label>
            <Select
              required
              value={alignForm.projectId}
              onChange={(e) => setAlignForm({ ...alignForm, projectId: e.target.value })}
              options={[
                { value: '', label: '-- Select R&D Project --' },
                ...availableProjects.map((p) => ({ value: p.id, label: `${p.name} ($${parseFloat(p.budget || 0).toLocaleString()})` })),
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Select Strategic Goal *
            </label>
            <Select
              required
              value={alignForm.goalId}
              onChange={(e) => setAlignForm({ ...alignForm, goalId: e.target.value })}
              options={[
                { value: '', label: '-- Select Strategic Goal --' },
                ...goals.map((g) => ({ value: g.id, label: `${g.code}: ${g.title}` })),
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Impact Weight (0.1 to 2.0)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="2.0"
              value={alignForm.impactWeight}
              onChange={(e) => setAlignForm({ ...alignForm, impactWeight: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Alignment Explanation / Rationale
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                minHeight: 60,
                boxSizing: 'border-box'
              }}
              placeholder="How does this initiative specifically contribute to achieving the goal?"
              value={alignForm.alignmentRationale}
              onChange={(e) => setAlignForm({ ...alignForm, alignmentRationale: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setAlignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Mapping...' : 'Confirm Alignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RdStrategicAlignment;
