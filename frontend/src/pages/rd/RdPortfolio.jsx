import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Compass,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Shield,
  Target
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
  ProgressBar,
  Input,
  Select,
  Modal
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdPortfolio = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [rollups, setRollups] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Project Form State
  const [formData, setFormData] = useState({
    name: '',
    client: 'Internal R&D Initiative',
    budget: '',
    manager: crmUser?.name || 'R&D Lead',
    priority: 'MEDIUM',
    strategicCategory: 'Core Innovation',
    deadline: '',
    startDate: new Date().toISOString().split('T')[0],
    roiScore: 70,
    riskScore: 30,
    feasibilityScore: 75,
  });

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        strategicCategory: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      };

      const res = await apiClient.get('/rd/portfolio', { params });
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setRollups(res.data.rollups || null);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('[RdPortfolio] Fetch error:', err);
      addToast({
        title: 'Portfolio Error',
        message: err.message || 'Failed to fetch R&D portfolio data.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, priorityFilter, categoryFilter, addToast]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({ title: 'Validation', message: 'Project name is required.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/rd/portfolio', formData);
      if (res.success) {
        addToast({ title: 'Project Created', message: 'R&D Project successfully initialized.', type: 'success' });
        setCreateModalOpen(false);
        setFormData({
          name: '',
          client: 'Internal R&D Initiative',
          budget: '',
          manager: crmUser?.name || 'R&D Lead',
          priority: 'MEDIUM',
          strategicCategory: 'Core Innovation',
          deadline: '',
          startDate: new Date().toISOString().split('T')[0],
          roiScore: 70,
          riskScore: 30,
          feasibilityScore: 75,
        });
        fetchPortfolio();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to create project.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (project) => {
    setSelectedProject(project);
    setDetailModalOpen(true);
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const res = await apiClient.put(`/rd/portfolio/${projectId}`, { status: newStatus });
      if (res.success) {
        addToast({ title: 'Updated', message: `Status changed to ${newStatus}`, type: 'success' });
        setSelectedProject((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchPortfolio();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      case 'LOW':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Planning':
        return 'info';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Project Portfolio' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              R&D Project Portfolio Management
            </h1>
            <Badge variant="success">Req 1 — Live Database</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            High-level research portfolio rollups, multi-project status tracking, budget governance, and strategic alignment.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchPortfolio} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={14} />}>
            New R&D Project
          </Button>
        </div>
      </div>

      {/* 2. Portfolio KPI Summary Rollups */}
      {rollups && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <KPICard
            title="Total R&D Initiatives"
            value={rollups.totalProjects}
            change={`${rollups.activeProjects} active execution`}
            trend="neutral"
            icon={<FolderGit2 size={20} />}
          />
          <KPICard
            title="Total R&D Budget"
            value={`$${(rollups.totalBudget || 0).toLocaleString()}`}
            change={`Spent: $${(rollups.totalSpent || 0).toLocaleString()} (${rollups.budgetUtilization}%)`}
            trend="positive"
            icon={<DollarSign size={20} />}
          />
          <KPICard
            title="Portfolio Avg Progress"
            value={`${rollups.avgProgress}%`}
            change={`${rollups.completedProjects} projects delivered`}
            trend="positive"
            icon={<TrendingUp size={20} />}
          />
          <KPICard
            title="Avg Priority Score"
            value={`${rollups.avgPriorityScore} / 100`}
            change={`ROI: ${rollups.avgRoiScore} | Risk: ${rollups.avgRiskScore}`}
            trend="neutral"
            icon={<Target size={20} />}
          />
        </div>
      )}

      {/* 3. Filters and Search */}
      <Card>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px' }}>
              <Input
                placeholder="Search by project name, sponsor, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
            <div style={{ width: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'Planning', label: 'Planning' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'On Hold', label: 'On Hold' },
                ]}
              />
            </div>
            <div style={{ width: 150 }}>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Priorities' },
                  { value: 'CRITICAL', label: 'Critical Tier' },
                  { value: 'HIGH', label: 'High Tier' },
                  { value: 'MEDIUM', label: 'Medium Tier' },
                  { value: 'LOW', label: 'Low Tier' },
                ]}
              />
            </div>
            <div style={{ width: 180 }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'Core Innovation', label: 'Core Innovation' },
                  { value: 'Breakthrough Research', label: 'Breakthrough Research' },
                  { value: 'Platform/Architecture', label: 'Platform Architecture' },
                  { value: 'Process Improvement', label: 'Process Improvement' },
                  { value: 'Sustainability', label: 'Sustainability' },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Portfolio Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Active Research Initiatives ({projects.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Database-backed rollups
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading R&D portfolio records...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FolderGit2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>No R&D Projects Found</p>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)' }}>
                Create a project directly or approve an intake proposal to populate the portfolio.
              </p>
              <Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)}>
                Create First R&D Project
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Project Initiative</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Priority</TableCell>
                    <TableCell isHeader>Budget / Spent</TableCell>
                    <TableCell isHeader>Progress</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Lead / Manager</TableCell>
                    <TableCell isHeader>Strategic Goals</TableCell>
                    <TableCell isHeader style={{ textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {p.client} {p.intakeProposal ? `• Ref: ${p.intakeProposal.referenceNumber}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.strategicCategory || 'General R&D'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(p.priority)}>
                          {p.priority} ({p.priorityScore})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          ${parseFloat(p.budget || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Spent: ${parseFloat(p.spent || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ProgressBar value={p.progress || 0} max={100} style={{ flex: 1, height: 6 }} />
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{p.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(p.status)}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: 'var(--text-sm)' }}>{p.manager || 'Unassigned'}</div>
                      </TableCell>
                      <TableCell>
                        {p.strategicAlignments && p.strategicAlignments.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.strategicAlignments.map((a) => (
                              <Badge key={a.id} variant="secondary" title={a.goal?.title}>
                                {a.goal?.code || 'Goal'}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>None</span>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button variant="ghost" size="xs" onClick={() => handleOpenDetail(p)}>
                          Details
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

      {/* 5. Create Project Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Initialize New R&D Project">
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Initiative Name *
            </label>
            <Input
              required
              placeholder="e.g., Next-Gen Battery Thermal Management"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Sponsoring Entity / Client
              </label>
              <Input
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Strategic Category
              </label>
              <Select
                value={formData.strategicCategory}
                onChange={(e) => setFormData({ ...formData, strategicCategory: e.target.value })}
                options={[
                  { value: 'Core Innovation', label: 'Core Innovation' },
                  { value: 'Breakthrough Research', label: 'Breakthrough Research' },
                  { value: 'Platform/Architecture', label: 'Platform Architecture' },
                  { value: 'Process Improvement', label: 'Process Improvement' },
                  { value: 'Sustainability', label: 'Sustainability' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Estimated Budget ($)
              </label>
              <Input
                type="number"
                placeholder="50000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Priority Tier
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { value: 'CRITICAL', label: 'Critical Tier' },
                  { value: 'HIGH', label: 'High Tier' },
                  { value: 'MEDIUM', label: 'Medium Tier' },
                  { value: 'LOW', label: 'Low Tier' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                R&D Project Lead
              </label>
              <Input
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Target Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Initializing...' : 'Create Initiative'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Project Detail Modal */}
      {selectedProject && (
        <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Initiative: ${selectedProject.name}`} size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge variant={getPriorityBadgeVariant(selectedProject.priority)}>Priority: {selectedProject.priority}</Badge>
                <Badge variant="outline">{selectedProject.strategicCategory || 'General R&D'}</Badge>
                <Badge variant={getStatusBadgeVariant(selectedProject.status)}>{selectedProject.status}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Planning', 'In Progress', 'Completed', 'On Hold'].map((st) => (
                  <Button
                    key={st}
                    size="xs"
                    variant={selectedProject.status === st ? 'primary' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedProject.id, st)}
                  >
                    {st}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Card>
                <CardBody style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Budget Allocated</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>${parseFloat(selectedProject.budget || 0).toLocaleString()}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Total Spent</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>${parseFloat(selectedProject.spent || 0).toLocaleString()}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Priority Score</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedProject.priorityScore || 50} / 100</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Completion Progress</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedProject.progress || 0}%</div>
                </CardBody>
              </Card>
            </div>

            {selectedProject.intakeProposal && (
              <Card>
                <CardBody style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                    Originated from Proposal: {selectedProject.intakeProposal.referenceNumber}
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Title: {selectedProject.intakeProposal.title} | Expected ROI: {selectedProject.intakeProposal.expectedRoi}%
                  </p>
                </CardBody>
              </Card>
            )}

            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 8px' }}>
                Aligned Strategic Goals
              </h3>
              {selectedProject.strategicAlignments && selectedProject.strategicAlignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedProject.strategicAlignments.map((a) => (
                    <div key={a.id} style={{ padding: 10, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {a.goal?.code}: {a.goal?.title}
                        </span>
                        <Badge variant="outline">Weight: {a.impactWeight}</Badge>
                      </div>
                      {a.alignmentRationale && (
                        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {a.alignmentRationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  No strategic goals linked yet. Use the Strategic Alignment module to map this initiative.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RdPortfolio;
