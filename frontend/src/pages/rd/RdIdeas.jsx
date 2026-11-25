import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  ThumbsUp,
  MessageSquare,
  Award,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Tag,
  User,
  Send,
  Eye,
  Sliders,
  Settings,
  ChevronRight,
  UserCheck,
  FolderPlus
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

export const RdIdeas = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeRubric, setActiveRubric] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [assignReviewerModalOpen, setAssignReviewerModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Idea Form
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    summary: '',
    problemStatement: '',
    proposedSolution: '',
    description: '',
    expectedBenefits: '',
    tags: '',
    isSubmitted: true,
  });

  // Review & Status action
  const [statusAction, setStatusAction] = useState({ status: '', notes: '' });

  // Evaluation form state
  const [evaluationScores, setEvaluationScores] = useState({});
  const [evaluationComments, setEvaluationComments] = useState('');

  // Comment input state
  const [commentInput, setCommentInput] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchTerm || undefined,
        sortBy,
      };

      const [ideasRes, metricsRes, catRes, rubricRes, usersRes] = await Promise.all([
        apiClient.get('/rd/ideas', { params }),
        apiClient.get('/rd/ideas/metrics').catch(() => ({ success: false, data: null })),
        apiClient.get('/rd/ideas/categories').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/ideas/rubrics/active').catch(() => ({ success: false, data: null })),
        apiClient.get('/rd/status').catch(() => ({ success: false, data: null })),
      ]);

      if (ideasRes.success && ideasRes.data) {
        setIdeas(ideasRes.data.ideas || []);
        if (ideasRes.data.pagination) setPagination(ideasRes.data.pagination);
      }
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
      if (rubricRes.success && rubricRes.data) {
        setActiveRubric(rubricRes.data);
      }
    } catch (err) {
      console.error('[RdIdeas] Fetch error:', err);
      addToast({
        title: 'Idea Hub Notice',
        message: err.message || 'Loaded ideation records.',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter, searchTerm, sortBy, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateIdea = async (isDraft = false) => {
    if (!formData.title.trim()) {
      addToast({ title: 'Validation', message: 'Idea title is required.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/rd/ideas', {
        ...formData,
        isSubmitted: !isDraft,
      });

      if (res.success) {
        addToast({
          title: isDraft ? 'Idea Draft Saved' : 'Idea Submitted',
          message: `Idea ${res.data?.referenceNumber || ''} has been registered.`,
          type: 'success',
        });
        setCreateModalOpen(false);
        setFormData({
          title: '',
          categoryId: '',
          summary: '',
          problemStatement: '',
          proposedSolution: '',
          description: '',
          expectedBenefits: '',
          tags: '',
          isSubmitted: true,
        });
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVote = async (idea) => {
    try {
      if (idea.hasUserVoted) {
        const res = await apiClient.delete(`/rd/ideas/${idea.id}/vote`);
        if (res.success) {
          setIdeas((prev) =>
            prev.map((i) =>
              i.id === idea.id ? { ...i, hasUserVoted: false, voteCount: res.voteCount } : i
            )
          );
          if (selectedIdea && selectedIdea.id === idea.id) {
            setSelectedIdea((prev) => ({ ...prev, hasUserVoted: false, voteCount: res.voteCount }));
          }
          addToast({ title: 'Vote Removed', message: 'Your upvote was removed.', type: 'info' });
        }
      } else {
        const res = await apiClient.post(`/rd/ideas/${idea.id}/vote`, {});
        if (res.success) {
          setIdeas((prev) =>
            prev.map((i) =>
              i.id === idea.id ? { ...i, hasUserVoted: true, voteCount: res.voteCount } : i
            )
          );
          if (selectedIdea && selectedIdea.id === idea.id) {
            setSelectedIdea((prev) => ({ ...prev, hasUserVoted: true, voteCount: res.voteCount }));
          }
          addToast({ title: 'Upvoted!', message: 'Your vote has been recorded.', type: 'success' });
        }
      }
    } catch (err) {
      addToast({ title: 'Voting Error', message: err.message, type: 'error' });
    }
  };

  const handleOpenDetail = async (idea) => {
    try {
      const res = await apiClient.get(`/rd/ideas/${idea.id}`);
      if (res.success && res.data) {
        setSelectedIdea(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleStatusTransition = async (newStatus) => {
    if (!selectedIdea) return;
    if (newStatus === 'REJECTED' && !statusAction.notes.trim()) {
      addToast({ title: 'Validation', message: 'Rejection reason is required.', type: 'warning' });
      return;
    }
    if (newStatus === 'MORE_INFO_REQUIRED' && !statusAction.notes.trim()) {
      addToast({ title: 'Validation', message: 'Clarification notes are required.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/rd/ideas/${selectedIdea.id}/status`, {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? statusAction.notes : undefined,
        moreInfoNotes: newStatus === 'MORE_INFO_REQUIRED' ? statusAction.notes : undefined,
      });

      if (res.success) {
        addToast({ title: 'Status Updated', message: `Idea transitioned to ${newStatus}.`, type: 'success' });
        setSelectedIdea(res.data);
        setStatusAction({ status: '', notes: '' });
        fetchData();
      }
    } catch (err) {
      addToast({ title: 'Transition Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedIdea) return;

    try {
      const res = await apiClient.post(`/rd/ideas/${selectedIdea.id}/comments`, { content: commentInput.trim() });
      if (res.success) {
        setSelectedIdea((prev) => ({
          ...prev,
          comments: [res.data, ...(prev.comments || [])],
        }));
        setCommentInput('');
        addToast({ title: 'Comment Posted', message: 'Your comment was added.', type: 'success' });
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleOpenEvaluation = (idea) => {
    setSelectedIdea(idea);
    const initialScores = {};
    if (activeRubric && activeRubric.criteria) {
      activeRubric.criteria.forEach((c) => {
        initialScores[c.id] = activeRubric.scale === '1_TO_5' ? 3 : 70;
      });
    }
    setEvaluationScores(initialScores);
    setEvaluationComments('');
    setEvalModalOpen(true);
  };

  const handleSubmitEvaluation = async (isDraft = false) => {
    if (!selectedIdea || !activeRubric) return;

    const scoresPayload = activeRubric.criteria.map((c) => ({
      criterionId: c.id,
      rawScore: parseFloat(evaluationScores[c.id] || (activeRubric.scale === '1_TO_5' ? 3 : 70)),
    }));

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/rd/ideas/${selectedIdea.id}/evaluation`, {
        scores: scoresPayload,
        comments: evaluationComments,
        isDraft,
      });

      if (res.success) {
        addToast({
          title: isDraft ? 'Draft Saved' : 'Evaluation Submitted',
          message: `Evaluation score calculated: ${res.data?.finalWeightedScore}/100`,
          type: 'success',
        });
        setEvalModalOpen(false);
        fetchData();
        if (detailModalOpen && selectedIdea) {
          handleOpenDetail(selectedIdea);
        }
      }
    } catch (err) {
      addToast({ title: 'Evaluation Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'MORE_INFO_REQUIRED':
        return <Badge variant="outline">Clarifications</Badge>;
      case 'ACCEPTED_FOR_INCUBATION':
        return <Badge variant="success">Incubation Selected</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'ARCHIVED':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Idea Management Hub' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Idea Capture & Innovation Hub
            </h1>
            <Badge variant="success">Reqs 3 & 61 — Live Ideation</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Quick capture portal for innovation concepts, peer upvoting, contributor attribution, and multi-criteria evaluation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={14} />}>
            Submit Innovation Idea
          </Button>
        </div>
      </div>

      {/* 2. KPIs Dashboard */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          <KPICard
            title="Total Innovation Ideas"
            value={metrics.totalIdeas}
            change={`${metrics.activePipelineCount} active in screening`}
            changeType="neutral"
            icon={Lightbulb}
          />
          <KPICard
            title="Community Upvotes"
            value={metrics.totalVotes}
            change="Peer interest signals"
            changeType="positive"
            icon={ThumbsUp}
          />
          <KPICard
            title="Avg Evaluation Score"
            value={metrics.avgEvaluationScore ? `${metrics.avgEvaluationScore} / 100` : 'Not Evaluated'}
            change={`${metrics.evaluatedIdeasCount} evaluated initiatives`}
            changeType="positive"
            icon={Award}
          />
          <KPICard
            title="Incubation Selected"
            value={metrics.statusCounts?.ACCEPTED_FOR_INCUBATION || 0}
            change={`${metrics.acceptanceRate}% acceptance rate`}
            changeType="positive"
            icon={CheckCircle2}
          />
        </div>
      )}

      {/* 3. Filter Controls */}
      <Card>
        <CardBody style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Ideas' },
                { id: 'SUBMITTED', label: 'Submitted' },
                { id: 'UNDER_REVIEW', label: 'Under Review' },
                { id: 'MORE_INFO_REQUIRED', label: 'Clarifications' },
                { id: 'ACCEPTED_FOR_INCUBATION', label: 'Incubation' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'DRAFT', label: 'Drafts' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  size="xs"
                  variant={statusFilter === tab.id ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 220 }}>
                <Input
                  size="sm"
                  placeholder="Search ref, title, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={14} />}
                />
              </div>
              <div style={{ width: 170 }}>
                <Select
                  size="sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              <div style={{ width: 150 }}>
                <Select
                  size="sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'createdAt', label: 'Newest First' },
                    { value: 'voteCount', label: 'Most Upvoted' },
                    { value: 'compositeScore', label: 'Highest Evaluated' },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Ideas Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Ideation Directory ({ideas.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Real-time database records
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading research ideas...
            </div>
          ) : ideas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Lightbulb size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No Ideas Found</p>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Capture an innovation idea or adjust filter criteria.
              </p>
              <Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)}>
                Submit Innovation Idea
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Reference #</TableCell>
                    <TableCell isHeader>Idea Concept</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Contributor</TableCell>
                    <TableCell isHeader>Upvotes</TableCell>
                    <TableCell isHeader>Evaluation Score</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader style={{ textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ideas.map((idea) => (
                    <TableRow key={idea.id}>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {idea.referenceNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{idea.title}</div>
                        {idea.summary && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {idea.summary}
                          </div>
                        )}
                        {idea.tags && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {idea.tags.split(',').map((t, i) => (
                              <span key={i} style={{ fontSize: '10px', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {idea.category ? (
                          <Badge variant="outline" style={{ borderColor: idea.category.color, color: idea.category.color }}>
                            {idea.category.name}
                          </Badge>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>General</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontSize: 'var(--text-sm)' }}>{idea.author?.name || 'Staff Researcher'}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="xs"
                          variant={idea.hasUserVoted ? 'primary' : 'outline'}
                          onClick={() => handleToggleVote(idea)}
                          leftIcon={<ThumbsUp size={12} />}
                        >
                          {idea.voteCount}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {idea.compositeScore !== null && idea.compositeScore !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--primary)' }}>
                              {idea.compositeScore.toFixed(1)}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              ({idea.evaluationCount} reviews)
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary">Not Evaluated</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(idea.status)}</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="xs" onClick={() => handleOpenEvaluation(idea)} leftIcon={<Sliders size={12} />}>
                            Evaluate
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => handleOpenDetail(idea)} leftIcon={<Eye size={12} />}>
                            Details
                          </Button>
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

      {/* 5. Create Idea Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Capture Innovation Idea" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateIdea(false);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Idea Title *
            </label>
            <Input
              required
              placeholder="e.g., Nanostructured Silicon Anode for Grid Batteries"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Innovation Category
              </label>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={[
                  { value: '', label: '-- Select Category --' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Keywords & Tags
              </label>
              <Input
                placeholder="battery, silicon, energy-density"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Problem Statement
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
                minHeight: 50,
                boxSizing: 'border-box'
              }}
              placeholder="What scientific hurdle or commercial bottleneck does this address?"
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Proposed Solution
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
                minHeight: 50,
                boxSizing: 'border-box'
              }}
              placeholder="Explain the proposed technology, mechanism, or research methodology..."
              value={formData.proposedSolution}
              onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Expected Benefits & Impact
            </label>
            <Input
              placeholder="e.g., 35% higher energy density, lower lifecycle costs"
              value={formData.expectedBenefits}
              onChange={(e) => setFormData({ ...formData, expectedBenefits: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleCreateIdea(true)} disabled={submitting}>
              Save Draft
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} leftIcon={<Send size={14} />}>
              {submitting ? 'Submitting...' : 'Submit to Ideation Hub'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Idea Detail Drawer / Modal */}
      {selectedIdea && (
        <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Idea Details: ${selectedIdea.referenceNumber}`} size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedIdea.title}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Category: {selectedIdea.category?.name || 'General'} | Submitted by: {selectedIdea.author?.name || 'Staff'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button
                  size="xs"
                  variant={selectedIdea.hasUserVoted ? 'primary' : 'outline'}
                  onClick={() => handleToggleVote(selectedIdea)}
                  leftIcon={<ThumbsUp size={12} />}
                >
                  {selectedIdea.hasUserVoted ? 'Upvoted' : 'Upvote'} ({selectedIdea.voteCount})
                </Button>
                {getStatusBadge(selectedIdea.status)}
              </div>
            </div>

            {selectedIdea.problemStatement && (
              <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Problem Statement
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{selectedIdea.problemStatement}</div>
              </div>
            )}

            {selectedIdea.proposedSolution && (
              <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Proposed Solution
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{selectedIdea.proposedSolution}</div>
              </div>
            )}

            {/* Lifecycle Decision Desk */}
            {!['ACCEPTED_FOR_INCUBATION', 'REJECTED', 'ARCHIVED'].includes(selectedIdea.status) && (
              <div style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>Reviewer Decision Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      minHeight: 50,
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter decision comments, clarification requests, or rejection rationale..."
                    value={statusAction.notes}
                    onChange={(e) => setStatusAction({ ...statusAction, notes: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusTransition('ACCEPTED_FOR_INCUBATION')}
                      disabled={submitting}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Accept for Incubation
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => handleStatusTransition('MORE_INFO_REQUIRED')}
                      disabled={submitting}
                    >
                      Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusTransition('REJECTED')}
                      disabled={submitting}
                      leftIcon={<XCircle size={14} />}
                    >
                      Reject Idea
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluator Scores Breakdown */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  Evaluation Scorecard ({selectedIdea.evaluations?.length || 0} reviews)
                </div>
                <Button size="xs" variant="primary" onClick={() => handleOpenEvaluation(selectedIdea)} leftIcon={<Sliders size={12} />}>
                  Submit Evaluation
                </Button>
              </div>

              {selectedIdea.evaluations && selectedIdea.evaluations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedIdea.evaluations.map((ev) => (
                    <div key={ev.id} style={{ padding: 10, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          Evaluator: {ev.evaluator?.name}
                        </span>
                        <Badge variant="primary">Weighted: {ev.weightedScore} / 100</Badge>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 8 }}>
                        {ev.scores?.map((sc) => (
                          <div key={sc.id} style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: 6, borderRadius: 4 }}>
                            <div style={{ color: 'var(--text-secondary)' }}>{sc.criterion?.name}</div>
                            <div style={{ fontWeight: 700 }}>Raw: {sc.rawScore} (Norm: {sc.normalizedScore})</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  No expert evaluations submitted yet. Click "Submit Evaluation" to score this initiative.
                </p>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>
                Community Feedback & Discussion ({selectedIdea.comments?.length || 0})
              </div>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Input
                  size="sm"
                  placeholder="Share constructive feedback or research insights..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <Button size="sm" type="submit" variant="primary">
                  Post
                </Button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {selectedIdea.comments?.map((c) => (
                  <div key={c.id} style={{ padding: 8, borderRadius: 6, background: 'var(--bg-secondary)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600 }}>{c.user?.name || 'Staff'}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>{c.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Multi-Criteria Evaluation Modal */}
      {selectedIdea && activeRubric && (
        <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title={`Evaluate: ${selectedIdea.referenceNumber}`} size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitEvaluation(false);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ padding: 10, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: 'var(--text-xs)' }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Rubric: {activeRubric.name} (v{activeRubric.version})</div>
              <div>Scale: {activeRubric.scale === '1_TO_5' ? '1 to 5 (1 = Low, 5 = High)' : '0 to 100'}</div>
            </div>

            {activeRubric.criteria?.map((crit) => (
              <div key={crit.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                    {crit.name} (Weight: {(crit.weight * 100).toFixed(0)}%)
                  </label>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--primary)' }}>
                    {evaluationScores[crit.id] || 3}
                  </span>
                </div>
                {crit.description && (
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {crit.description} {crit.direction === 'LOWER_IS_BETTER' ? '(Note: Lower risk scores more points)' : ''}
                  </p>
                )}
                <input
                  type="range"
                  min={activeRubric.scale === '1_TO_5' ? '1' : '0'}
                  max={activeRubric.scale === '1_TO_5' ? '5' : '100'}
                  step={activeRubric.scale === '1_TO_5' ? '1' : '5'}
                  value={evaluationScores[crit.id] || (activeRubric.scale === '1_TO_5' ? 3 : 70)}
                  onChange={(e) => setEvaluationScores({ ...evaluationScores, [crit.id]: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Evaluation Remarks & Scientific Assessment
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
                  minHeight: 50,
                  boxSizing: 'border-box'
                }}
                placeholder="Explain the scoring rationale, scientific viability, and suggested adjustments..."
                value={evaluationComments}
                onChange={(e) => setEvaluationComments(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => setEvalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleSubmitEvaluation(true)} disabled={submitting}>
                Save Draft
              </Button>
              <Button type="submit" variant="primary" disabled={submitting} leftIcon={<Award size={14} />}>
                {submitting ? 'Submitting...' : 'Submit Final Evaluation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RdIdeas;
