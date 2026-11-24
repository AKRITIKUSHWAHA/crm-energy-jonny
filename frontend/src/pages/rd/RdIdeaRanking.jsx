import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  ThumbsUp,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Eye,
  Settings,
  HelpCircle
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

export const RdIdeaRanking = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeRubric, setActiveRubric] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);

  // Rubric configuration state
  const [rubricForm, setRubricForm] = useState({
    name: 'Standard Innovation Rubric',
    scale: '1_TO_5',
    criteria: [
      { name: 'Technical Feasibility', weight: 0.35, direction: 'HIGHER_IS_BETTER', description: 'Technical viability' },
      { name: 'Market & Strategic Impact', weight: 0.40, direction: 'HIGHER_IS_BETTER', description: 'Commercial value' },
      { name: 'Technical Risk & Uncertainty', weight: 0.25, direction: 'LOWER_IS_BETTER', description: 'Technical hurdles' },
    ],
  });
  const [savingRubric, setSavingRubric] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
      };

      const [leaderboardRes, catRes, rubricRes] = await Promise.all([
        apiClient.get('/rd/ideas/leaderboard', { params }),
        apiClient.get('/rd/ideas/categories').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/ideas/rubrics/active').catch(() => ({ success: false, data: null })),
      ]);

      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data.leaderboard || []);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (rubricRes.success && rubricRes.data) {
        setActiveRubric(rubricRes.data);
        if (rubricRes.data.criteria) {
          setRubricForm({
            name: rubricRes.data.name,
            scale: rubricRes.data.scale,
            criteria: rubricRes.data.criteria,
          });
        }
      }
    } catch (err) {
      console.error('[RdIdeaRanking] Fetch error:', err);
      addToast({
        title: 'Leaderboard Notice',
        message: err.message || 'Loaded ranking records.',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenBreakdown = (idea) => {
    setSelectedIdea(idea);
    setBreakdownModalOpen(true);
  };

  const handleSaveRubric = async (e) => {
    e.preventDefault();
    setSavingRubric(true);
    try {
      const res = await apiClient.post('/rd/ideas/rubrics', rubricForm);
      if (res.success) {
        addToast({ title: 'Rubric Updated', message: 'Evaluation criteria weights saved.', type: 'success' });
        setRubricModalOpen(false);
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Configuration Error', message: err.message, type: 'error' });
    } finally {
      setSavingRubric(false);
    }
  };

  const evaluatedCount = leaderboard.filter((i) => i.isEvaluated).length;
  const avgCompositeScore =
    evaluatedCount > 0
      ? (
          leaderboard.filter((i) => i.isEvaluated).reduce((sum, i) => sum + (i.compositeScore || 0), 0) /
          evaluatedCount
        ).toFixed(1)
      : '0.0';

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Idea Leaderboard' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Idea Evaluation Leaderboard & Ranking
            </h1>
            <Badge variant="success">Req 4 — Multi-Criteria Scoring</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Scientific ranking based on weighted evaluation rubrics. Popularity votes and expert scores remain independent.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRubricModalOpen(true)} leftIcon={<Settings size={14} />}>
            Configure Scoring Rubric
          </Button>
        </div>
      </div>

      {/* 2. KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard
          title="Ranked Initiatives"
          value={evaluatedCount}
          change={`Out of ${leaderboard.length} registered concepts`}
          trend="positive"
          icon={<Award size={20} />}
        />
        <KPICard
          title="Portfolio Avg Score"
          value={`${avgCompositeScore} / 100`}
          change="Evaluated composite mean"
          trend="neutral"
          icon={<TrendingUp size={20} />}
        />
        <KPICard
          title="Pending Evaluation"
          value={leaderboard.length - evaluatedCount}
          change="Awaiting reviewer scorecards"
          trend="neutral"
          icon={<Lightbulb size={20} />}
        />
        <KPICard
          title="Active Rubric"
          value={activeRubric ? `v${activeRubric.version}` : 'Standard'}
          change={`${activeRubric?.criteria?.length || 3} evaluation criteria`}
          trend="positive"
          icon={<Sliders size={20} />}
        />
      </div>

      {/* 3. Controls */}
      <Card>
        <CardBody style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px' }}>
              <Input
                placeholder="Search reference or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={14} />}
              />
            </div>
            <div style={{ width: 180 }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div style={{ width: 170 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'SUBMITTED', label: 'Submitted' },
                  { value: 'UNDER_REVIEW', label: 'Under Review' },
                  { value: 'ACCEPTED_FOR_INCUBATION', label: 'Incubation Selected' },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Leaderboard Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Innovation Leaderboard ({leaderboard.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Deterministic tie-breaking applied
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Calculating leaderboard rankings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No Ideas Found for Ranking</p>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                Ideas must be captured and evaluated to populate the leaderboard.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Rank</TableCell>
                    <TableCell isHeader>Idea Concept</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Upvotes</TableCell>
                    <TableCell isHeader>Reviews</TableCell>
                    <TableCell isHeader>Composite Score</TableCell>
                    <TableCell isHeader style={{ textAlign: 'right' }}>Score Breakdown</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.isEvaluated ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: item.rank <= 3 ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: item.rank <= 3 ? '#fff' : 'var(--text-primary)',
                              fontWeight: 700,
                              fontSize: 'var(--text-xs)',
                            }}
                          >
                            #{item.rank}
                          </span>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {item.referenceNumber} • Submitter: {item.author?.name || 'Staff'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline" style={{ borderColor: item.category.color, color: item.category.color }}>
                            {item.category.name}
                          </Badge>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600 }}>{item.voteCount}</span>
                      </TableCell>
                      <TableCell>{item.evaluationCount || 0}</TableCell>
                      <TableCell>
                        {item.isEvaluated ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', width: 38 }}>
                              {item.compositeScore.toFixed(1)}
                            </span>
                            <ProgressBar value={item.compositeScore} max={100} style={{ width: 60, height: 6 }} />
                          </div>
                        ) : (
                          <Badge variant="secondary">Not Evaluated</Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        {item.isEvaluated ? (
                          <Button variant="ghost" size="xs" onClick={() => handleOpenBreakdown(item)} leftIcon={<Eye size={12} />}>
                            Breakdown
                          </Button>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Awaiting Score</span>
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

      {/* 5. Score Breakdown Modal */}
      {selectedIdea && (
        <Modal isOpen={breakdownModalOpen} onClose={() => setBreakdownModalOpen(false)} title={`Evaluation Scorecard: ${selectedIdea.referenceNumber}`} size="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Composite Score:</span>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedIdea.compositeScore?.toFixed(1)} / 100
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                Calculated across {selectedIdea.evaluations?.length || 0} completed evaluator submissions.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 8 }}>Submitted Reviews</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedIdea.evaluations?.map((ev) => (
                  <div key={ev.id} style={{ padding: 10, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                      <span>Evaluator: {ev.evaluator?.name}</span>
                      <Badge variant="primary">{ev.weightedScore} / 100</Badge>
                    </div>
                    {ev.comments && <p style={{ margin: '4px 0', color: 'var(--text-primary)' }}>"{ev.comments}"</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6, marginTop: 6 }}>
                      {ev.scores?.map((sc) => (
                        <div key={sc.id} style={{ padding: 4, background: 'var(--bg-primary)', borderRadius: 4 }}>
                          <div style={{ color: 'var(--text-secondary)' }}>{sc.criterion?.name}</div>
                          <div style={{ fontWeight: 700 }}>
                            {sc.rawScore} (W: {(sc.weight * 100).toFixed(0)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setBreakdownModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Configure Rubric Modal */}
      <Modal isOpen={rubricModalOpen} onClose={() => setRubricModalOpen(false)} title="Configure Evaluation Rubric" size="md">
        <form onSubmit={handleSaveRubric} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Rubric Name
            </label>
            <Input
              value={rubricForm.name}
              onChange={(e) => setRubricForm({ ...rubricForm, name: e.target.value })}
            />
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 6 }}>Criteria Weights (Must sum to 100%)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rubricForm.criteria?.map((c, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{c.name}</div>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="1.0"
                    value={c.weight}
                    onChange={(e) => {
                      const newCrit = [...rubricForm.criteria];
                      newCrit[idx].weight = parseFloat(e.target.value) || 0;
                      setRubricForm({ ...rubricForm, criteria: newCrit });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button type="button" variant="outline" onClick={() => setRubricModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingRubric}>
              {savingRubric ? 'Saving...' : 'Save Rubric'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RdIdeaRanking;
