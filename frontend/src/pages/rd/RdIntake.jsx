import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  DollarSign,
  FileText,
  UserCheck,
  Send,
  Eye,
  TrendingUp,
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
  Input,
  Select,
  Modal
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdIntake = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [strategicGoals, setStrategicGoals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [statusTab, setStatusTab] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Review action inputs
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Proposal Creation Form
  const [formData, setFormData] = useState({
    title: '',
    category: 'Product Innovation',
    summary: '',
    problemStatement: '',
    expectedOutcomes: '',
    estimatedBudget: '',
    estimatedDurationMonths: 6,
    proposedStartDate: new Date().toISOString().split('T')[0],
    strategicGoalId: '',
    expectedRoi: 65,
    riskAssessment: 'MEDIUM',
    feasibilityScore: 75,
    isSubmitted: true,
  });

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusTab !== 'ALL' ? statusTab : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchTerm || undefined,
      };

      const [res, goalsRes] = await Promise.all([
        apiClient.get('/rd/intake', { params }),
        apiClient.get('/rd/strategy/goals').catch(() => ({ success: false, data: [] })),
      ]);

      if (res.success && res.data) {
        setProposals(res.data.proposals || []);
        setMetrics(res.data.metrics || null);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
      if (goalsRes.success && Array.isArray(goalsRes.data)) {
        setStrategicGoals(goalsRes.data);
      }
    } catch (err) {
      console.error('[RdIntake] Fetch error:', err);
      addToast({
        title: 'Intake Error',
        message: err.message || 'Failed to fetch proposal intake records.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusTab, categoryFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleCreateProposal = async (isDraft = false) => {
    if (!formData.title.trim()) {
      addToast({ title: 'Validation', message: 'Proposal title is required.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        isSubmitted: !isDraft,
      };

      const res = await apiClient.post('/rd/intake', payload);
      if (res.success) {
        addToast({
          title: isDraft ? 'Draft Saved' : 'Proposal Submitted',
          message: `Proposal ${res.data?.referenceNumber || ''} has been registered.`,
          type: 'success',
        });
        setCreateModalOpen(false);
        setFormData({
          title: '',
          category: 'Product Innovation',
          summary: '',
          problemStatement: '',
          expectedOutcomes: '',
          estimatedBudget: '',
          estimatedDurationMonths: 6,
          proposedStartDate: new Date().toISOString().split('T')[0],
          strategicGoalId: '',
          expectedRoi: 65,
          riskAssessment: 'MEDIUM',
          feasibilityScore: 75,
          isSubmitted: true,
        });
        fetchProposals();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message || 'Failed to submit proposal.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = (proposal) => {
    setSelectedProposal(proposal);
    setReviewAction('');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleExecuteReviewAction = async (actionType) => {
    if (!selectedProposal) return;
    setSubmitting(true);

    try {
      if (actionType === 'START_REVIEW') {
        const res = await apiClient.post(`/rd/intake/${selectedProposal.id}/review`, { action: 'START_REVIEW' });
        if (res.success) {
          addToast({ title: 'Review Started', message: 'Proposal is now UNDER_REVIEW.', type: 'info' });
          setSelectedProposal((prev) => ({ ...prev, status: 'UNDER_REVIEW' }));
          fetchProposals();
        }
      } else if (actionType === 'REQUEST_INFO') {
        if (!reviewNotes.trim()) {
          addToast({ title: 'Validation', message: 'Clarification notes are required.', type: 'warning' });
          setSubmitting(false);
          return;
        }
        const res = await apiClient.post(`/rd/intake/${selectedProposal.id}/review`, {
          action: 'REQUEST_INFO',
          notes: reviewNotes,
        });
        if (res.success) {
          addToast({ title: 'Info Requested', message: 'Status updated to MORE_INFO_REQUIRED.', type: 'warning' });
          setReviewModalOpen(false);
          fetchProposals();
        }
      } else if (actionType === 'APPROVE') {
        const res = await apiClient.post(`/rd/intake/${selectedProposal.id}/approve`, {
          reviewComments: reviewNotes || 'Approved and converted to active R&D initiative.',
        });
        if (res.success) {
          addToast({
            title: 'Proposal Approved & Converted',
            message: res.message || 'Successfully converted proposal into active R&D Project.',
            type: 'success',
          });
          setReviewModalOpen(false);
          fetchProposals();
        }
      } else if (actionType === 'REJECT') {
        if (!reviewNotes.trim()) {
          addToast({ title: 'Validation', message: 'Rejection reason is required.', type: 'warning' });
          setSubmitting(false);
          return;
        }
        const res = await apiClient.post(`/rd/intake/${selectedProposal.id}/reject`, {
          rejectionReason: reviewNotes,
        });
        if (res.success) {
          addToast({ title: 'Proposal Rejected', message: 'Proposal has been rejected.', type: 'error' });
          setReviewModalOpen(false);
          fetchProposals();
        }
      }
    } catch (err) {
      addToast({ title: 'Review Error', message: err.message, type: 'error' });
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
        return <Badge variant="outline">Clarification Needed</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved & Converted</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="default">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Project Intake' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Project Intake & Application Workflows
            </h1>
            <Badge variant="success">Req 2 — Production Lifecycle</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Formal research proposals, screening checkpoints, clarification requests, and atomic project conversion.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchProposals} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={14} />}>
            Submit Research Proposal
          </Button>
        </div>
      </div>

      {/* 2. Intake Metrics KPIs */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <KPICard
            title="Total Proposals"
            value={metrics.total}
            change={`${metrics.pendingReviewCount} in review queue`}
            trend="neutral"
            icon={<Inbox size={20} />}
          />
          <KPICard
            title="Proposed Pipeline Budget"
            value={`$${(metrics.pipelineBudget || 0).toLocaleString()}`}
            change="Active intake requests"
            trend="positive"
            icon={<DollarSign size={20} />}
          />
          <KPICard
            title="Under Screening"
            value={metrics.statusBreakdown?.UNDER_REVIEW || 0}
            change={`${metrics.statusBreakdown?.MORE_INFO_REQUIRED || 0} more info requested`}
            trend="neutral"
            icon={<Clock size={20} />}
          />
          <KPICard
            title="Intake Approval Rate"
            value={`${metrics.approvalRate}%`}
            change={`${metrics.statusBreakdown?.APPROVED || 0} approved & converted`}
            trend="positive"
            icon={<CheckCircle size={20} />}
          />
        </div>
      )}

      {/* 3. Filter Bar & Status Tabs */}
      <Card>
        <CardBody style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Proposals' },
                { id: 'SUBMITTED', label: 'Submitted' },
                { id: 'UNDER_REVIEW', label: 'Under Review' },
                { id: 'MORE_INFO_REQUIRED', label: 'Clarifications' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'DRAFT', label: 'Drafts' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  size="xs"
                  variant={statusTab === tab.id ? 'primary' : 'outline'}
                  onClick={() => setStatusTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 200 }}>
                <Input
                  size="sm"
                  placeholder="Search ref or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={14} />}
                />
              </div>
              <div style={{ width: 160 }}>
                <Select
                  size="sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'Product Innovation', label: 'Product Innovation' },
                    { value: 'Breakthrough Research', label: 'Breakthrough Research' },
                    { value: 'Platform/Architecture', label: 'Platform/Architecture' },
                    { value: 'Process Improvement', label: 'Process Improvement' },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Proposals Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Proposal Intake Pipeline ({proposals.length})
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Server-side atomic review workflow
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading proposals...
            </div>
          ) : proposals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Inbox size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No Proposals in this View</p>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Create a new research proposal to start the screening workflow.
              </p>
              <Button size="sm" variant="primary" onClick={() => setCreateModalOpen(true)}>
                Submit Research Proposal
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Reference #</TableCell>
                    <TableCell isHeader>Proposal Title</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Estimated Budget</TableCell>
                    <TableCell isHeader>Duration</TableCell>
                    <TableCell isHeader>Submitter</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Converted Project</TableCell>
                    <TableCell isHeader style={{ textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {p.referenceNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div>
                        {p.summary && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {p.summary}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600 }}>${parseFloat(p.estimatedBudget || 0).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>{p.estimatedDurationMonths} mo</TableCell>
                      <TableCell>
                        <span style={{ fontSize: 'var(--text-sm)' }}>{p.submittingUser?.name || 'Researcher'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        {p.convertedProject ? (
                          <Badge variant="success">
                            {p.convertedProject.name} ({p.convertedProject.status})
                          </Badge>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button variant="ghost" size="xs" onClick={() => handleOpenReview(p)} leftIcon={<Eye size={12} />}>
                          Review
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

      {/* 5. Create Proposal Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Submit New Research Proposal" size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateProposal(false);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Proposal Title *
            </label>
            <Input
              required
              placeholder="e.g., Solid-State Electrolyte Synthesis for Grid Storage"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Research Category
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'Product Innovation', label: 'Product Innovation' },
                  { value: 'Breakthrough Research', label: 'Breakthrough Research' },
                  { value: 'Platform/Architecture', label: 'Platform Architecture' },
                  { value: 'Process Improvement', label: 'Process Improvement' },
                  { value: 'Sustainability', label: 'Sustainability' },
                ]}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Target Strategic Goal
              </label>
              <Select
                value={formData.strategicGoalId}
                onChange={(e) => setFormData({ ...formData, strategicGoalId: e.target.value })}
                options={[
                  { value: '', label: '-- None / Standalone R&D --' },
                  ...strategicGoals.map((g) => ({ value: g.id, label: `${g.code}: ${g.title}` })),
                ]}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Executive Summary
            </label>
            <Input
              placeholder="Brief summary of the research proposal..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
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
                minHeight: 60,
                boxSizing: 'border-box'
              }}
              placeholder="What scientific or commercial bottleneck does this research address?"
              value={formData.problemStatement}
              onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Estimated Budget ($)
              </label>
              <Input
                type="number"
                placeholder="75000"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Duration (Months)
              </label>
              <Input
                type="number"
                value={formData.estimatedDurationMonths}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMonths: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Expected ROI (%)
              </label>
              <Input
                type="number"
                value={formData.expectedRoi}
                onChange={(e) => setFormData({ ...formData, expectedRoi: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleCreateProposal(true)} disabled={submitting}>
              Save Draft
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} leftIcon={<Send size={14} />}>
              {submitting ? 'Submitting...' : 'Submit for Screening'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Review & Approval Modal */}
      {selectedProposal && (
        <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`Screen Proposal: ${selectedProposal.referenceNumber}`} size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedProposal.title}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Category: {selectedProposal.category} | Submitter: {selectedProposal.submittingUser?.name || 'Staff'}
                </span>
              </div>
              {getStatusBadge(selectedProposal.status)}
            </div>

            {selectedProposal.convertedProject && (
              <div style={{ padding: 12, borderRadius: 6, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600 }}>
                  <CheckCircle size={18} />
                  Converted to Active R&D Initiative
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Project Name: {selectedProposal.convertedProject.name} (Status: {selectedProposal.convertedProject.status})
                </p>
              </div>
            )}

            {selectedProposal.rejectionReason && (
              <div style={{ padding: 12, borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600 }}>
                  <XCircle size={18} />
                  Proposal Rejected
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Reason: {selectedProposal.rejectionReason}
                </p>
              </div>
            )}

            {selectedProposal.moreInfoNotes && (
              <div style={{ padding: 12, borderRadius: 6, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ca8a04', fontWeight: 600 }}>
                  <AlertCircle size={18} />
                  Clarifications Requested
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Notes: {selectedProposal.moreInfoNotes}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Estimated Budget</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>${parseFloat(selectedProposal.estimatedBudget || 0).toLocaleString()}</div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Target Duration</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{selectedProposal.estimatedDurationMonths} Months</div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Expected ROI</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{selectedProposal.expectedRoi}%</div>
              </div>
            </div>

            {selectedProposal.problemStatement && (
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>Problem Statement</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{selectedProposal.problemStatement}</p>
              </div>
            )}

            {/* Reviewer Action Desk */}
            {!['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(selectedProposal.status) && (
              <div style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', fontWeight: 700 }}>Reviewer Decision Actions</h4>

                {selectedProposal.status === 'SUBMITTED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteReviewAction('START_REVIEW')}
                    disabled={submitting}
                  >
                    Start Formal Screening (Move to Under Review)
                  </Button>
                )}

                {(selectedProposal.status === 'UNDER_REVIEW' || selectedProposal.status === 'MORE_INFO_REQUIRED') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Reviewer Notes / Rejection Reason / Approval Comments
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
                        placeholder="Enter evaluation remarks, clarification points, or decision rationale..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        variant="success"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleExecuteReviewAction('APPROVE')}
                        leftIcon={<FolderPlus size={14} />}
                      >
                        Approve & Convert to Project
                      </Button>

                      <Button
                        variant="warning"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleExecuteReviewAction('REQUEST_INFO')}
                      >
                        Request More Info
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        disabled={submitting}
                        onClick={() => handleExecuteReviewAction('REJECT')}
                        leftIcon={<XCircle size={14} />}
                      >
                        Reject Proposal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RdIntake;
