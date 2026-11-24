import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpDown,
  RefreshCw,
  Search,
  Target,
  ShieldAlert,
  TrendingUp,
  Cpu,
  Sliders,
  CheckCircle2,
  Award,
  Zap,
  HelpCircle,
  FolderGit2
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

export const RdPrioritization = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [formula, setFormula] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Score Tuner Modal
  const [tunerModalOpen, setTunerModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tuningData, setTuningData] = useState({
    roiScore: 70,
    riskScore: 30,
    feasibilityScore: 70,
    priority: 'MEDIUM',
  });
  const [savingTuner, setSavingTuner] = useState(false);

  const fetchPrioritization = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: searchTerm || undefined,
      };

      const res = await apiClient.get('/rd/prioritization', { params });
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setFormula(res.data.formula || '');
      }
    } catch (err) {
      console.error('[RdPrioritization] Fetch error:', err);
      addToast({
        title: 'Prioritization Error',
        message: err.message || 'Failed to fetch prioritization matrix.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchPrioritization();
  }, [fetchPrioritization]);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      const res = await apiClient.post('/rd/prioritization/recalculate', {});
      if (res.success) {
        addToast({
          title: 'Prioritization Recalculated',
          message: res.message || 'All project priority scores have been recomputed.',
          type: 'success',
        });
        fetchPrioritization();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setRecalculating(false);
    }
  };

  const handleQuickPriorityChange = async (projectId, newPriority) => {
    try {
      const res = await apiClient.put(`/rd/prioritization/${projectId}`, { priority: newPriority });
      if (res.success) {
        addToast({ title: 'Priority Updated', message: `Priority set to ${newPriority}.`, type: 'success' });
        fetchPrioritization();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleOpenTuner = (project) => {
    setSelectedProject(project);
    setTuningData({
      roiScore: project.roiScore || 70,
      riskScore: project.riskScore || 30,
      feasibilityScore: project.feasibilityScore || 70,
      priority: project.priority || 'MEDIUM',
    });
    setTunerModalOpen(true);
  };

  const calculateLivePreview = () => {
    const roi = parseFloat(tuningData.roiScore || 0);
    const risk = parseFloat(tuningData.riskScore || 0);
    const feasibility = parseFloat(tuningData.feasibilityScore || 0);
    const strategic = selectedProject?.strategicAlignments?.length > 0 ? 80.0 : 40.0;

    const score = roi * 0.35 + strategic * 0.25 + feasibility * 0.2 + (100 - risk) * 0.2;
    return Math.min(100, Math.max(0, score)).toFixed(1);
  };

  const handleSaveTuner = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    setSavingTuner(true);
    try {
      const res = await apiClient.put(`/rd/prioritization/${selectedProject.id}`, tuningData);
      if (res.success) {
        addToast({ title: 'Scores Saved', message: 'Project scores and composite rank updated.', type: 'success' });
        setTunerModalOpen(false);
        fetchPrioritization();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSavingTuner(false);
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

  const criticalCount = projects.filter((p) => p.priority === 'CRITICAL').length;
  const highCount = projects.filter((p) => p.priority === 'HIGH').length;
  const avgScore =
    projects.length > 0
      ? (projects.reduce((sum, p) => sum + (p.priorityScore || 0), 0) / projects.length).toFixed(1)
      : 0;

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Prioritization Engine' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Project Prioritization Engine
            </h1>
            <Badge variant="success">Req 6 — Algorithmic Ranking</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Transparent multi-factor ranking combining ROI, strategic alignment weight, technical feasibility, and risk discount.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchPrioritization} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRecalculateAll}
            disabled={recalculating}
            leftIcon={<Zap size={14} className={recalculating ? 'animate-spin' : ''} />}
          >
            {recalculating ? 'Recalculating...' : 'Recalculate All Scores'}
          </Button>
        </div>
      </div>

      {/* 2. Formula Banner */}
      <Card style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-secondary)' }}>
        <CardBody style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={20} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Active Evaluation Algorithm
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                Score = (ROI × 35%) + (Strategic Alignment × 25%) + (Feasibility × 20%) + ((100 − Risk) × 20%)
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard
          title="Ranked Initiatives"
          value={projects.length}
          change="Prioritized research"
          trend="neutral"
          icon={<FolderGit2 size={20} />}
        />
        <KPICard
          title="Critical Tier Initiatives"
          value={criticalCount}
          change="Top strategic allocation"
          trend="positive"
          icon={<Award size={20} />}
        />
        <KPICard
          title="High Tier Initiatives"
          value={highCount}
          change="Secondary priority queue"
          trend="neutral"
          icon={<TrendingUp size={20} />}
        />
        <KPICard
          title="Portfolio Avg Score"
          value={`${avgScore} / 100`}
          change="Composite baseline"
          trend="positive"
          icon={<Target size={20} />}
        />
      </div>

      {/* 4. Controls */}
      <Card>
        <CardBody style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px' }}>
              <Input
                placeholder="Search initiative or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
            <div style={{ width: 180 }}>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Priority Tiers' },
                  { value: 'CRITICAL', label: 'Critical Tier (>= 75)' },
                  { value: 'HIGH', label: 'High Tier (60-74)' },
                  { value: 'MEDIUM', label: 'Medium Tier (36-59)' },
                  { value: 'LOW', label: 'Low Tier (<= 35)' },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 5. Prioritization Leaderboard Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Research Prioritization Leaderboard ({projects.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Ranked dynamically by Composite Score
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Calculating priority rankings...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ArrowUpDown size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No Projects Available for Prioritization</p>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Add initiatives in the R&D Portfolio to enable multi-factor ranking.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Rank</TableCell>
                    <TableCell isHeader>Initiative Name</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Priority Tier</TableCell>
                    <TableCell isHeader>Composite Score</TableCell>
                    <TableCell isHeader>Expected ROI (35%)</TableCell>
                    <TableCell isHeader>Strategic (25%)</TableCell>
                    <TableCell isHeader>Feasibility (20%)</TableCell>
                    <TableCell isHeader>Risk (20%)</TableCell>
                    <TableCell isHeader style={{ textAlign: 'right' }}>Score Tuner</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: p.rank <= 3 ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: p.rank <= 3 ? '#fff' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: 'var(--text-xs)',
                          }}
                        >
                          #{p.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Budget: ${parseFloat(p.budget || 0).toLocaleString()} • {p.manager || 'R&D Team'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.strategicCategory || 'General'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          size="xs"
                          value={p.priority}
                          onChange={(e) => handleQuickPriorityChange(p.id, e.target.value)}
                          options={[
                            { value: 'CRITICAL', label: 'CRITICAL' },
                            { value: 'HIGH', label: 'HIGH' },
                            { value: 'MEDIUM', label: 'MEDIUM' },
                            { value: 'LOW', label: 'LOW' },
                          ]}
                        />
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', width: 34 }}>
                            {p.computedScore}
                          </span>
                          <ProgressBar value={p.computedScore} max={100} style={{ width: 60, height: 6 }} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600 }}>{p.scoreBreakdown?.roi?.value}%</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          +{p.scoreBreakdown?.roi?.component} pts
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600 }}>{p.scoreBreakdown?.strategic?.value}</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          +{p.scoreBreakdown?.strategic?.component} pts
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600 }}>{p.scoreBreakdown?.feasibility?.value}%</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          +{p.scoreBreakdown?.feasibility?.component} pts
                        </div>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600, color: p.scoreBreakdown?.risk?.value > 50 ? '#ef4444' : 'inherit' }}>
                          {p.scoreBreakdown?.risk?.value}%
                        </span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          +{p.scoreBreakdown?.risk?.component} pts
                        </div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenTuner(p)}
                          leftIcon={<Sliders size={12} />}
                        >
                          Tune
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

      {/* 6. Score Tuner Modal */}
      {selectedProject && (
        <Modal isOpen={tunerModalOpen} onClose={() => setTunerModalOpen(false)} title={`Prioritization Tuner: ${selectedProject.name}`} size="md">
          <form onSubmit={handleSaveTuner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Live Computed Priority Score:</span>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--primary)' }}>
                  {calculateLivePreview()} / 100
                </span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Expected ROI (Weight: 35%)</label>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{tuningData.roiScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                style={{ width: '100%' }}
                value={tuningData.roiScore}
                onChange={(e) => setTuningData({ ...tuningData, roiScore: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Technical Feasibility (Weight: 20%)</label>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{tuningData.feasibilityScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                style={{ width: '100%' }}
                value={tuningData.feasibilityScore}
                onChange={(e) => setTuningData({ ...tuningData, feasibilityScore: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Risk Assessment (Weight: -20%)</label>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: tuningData.riskScore > 50 ? '#ef4444' : 'inherit' }}>
                  {tuningData.riskScore}% Risk
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                style={{ width: '100%' }}
                value={tuningData.riskScore}
                onChange={(e) => setTuningData({ ...tuningData, riskScore: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Priority Tier Override
              </label>
              <Select
                value={tuningData.priority}
                onChange={(e) => setTuningData({ ...tuningData, priority: e.target.value })}
                options={[
                  { value: 'CRITICAL', label: 'CRITICAL' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'LOW', label: 'LOW' },
                ]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button type="button" variant="outline" onClick={() => setTunerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingTuner}>
                {savingTuner ? 'Saving...' : 'Save Prioritization'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RdPrioritization;
