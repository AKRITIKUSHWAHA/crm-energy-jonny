import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  ArrowLeft,
  CheckCircle2,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  Layers,
  Plus,
  RefreshCw,
  Flag,
  AlertTriangle,
  X
} from 'lucide-react';
import { Breadcrumb, Button, Card, Badge, ProgressBar, Timeline } from '../../../components/ui';
import { useErp } from '../../../context/ErpContext';
import { apiClient } from '../../../services/apiClient';

export const ErpProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useErp();

  const project = projects.find((p) => p.id === id) || projects[0] || { name: 'ERP Project', client: 'Enterprise' };

  // Dynamic Milestones State
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchMilestones = useCallback(async () => {
    if (!id) return;
    setLoadingMilestones(true);
    try {
      const res = await apiClient.get('/rd/milestones', { params: { projectId: id } });
      if (res.success && res.data && res.data.length > 0) {
        setMilestones(res.data);
      } else {
        // Fallback default phases if none yet created
        setMilestones([
          {
            id: 'fallback-1',
            title: 'Project Kickoff & Requirements',
            description: 'SLA parameters baseline approved by client executive committee.',
            milestoneCode: 'MS-01',
            status: 'COMPLETED',
            progress: 100,
            plannedEndDate: '2026-06-15',
          },
          {
            id: 'fallback-2',
            title: 'Infrastructure & System Deployment',
            description: 'Hardware nodes configured, database schema verified, APIs deployed.',
            milestoneCode: 'MS-02',
            status: 'COMPLETED',
            progress: 100,
            plannedEndDate: '2026-07-20',
          },
          {
            id: 'fallback-3',
            title: 'User Acceptance Testing (UAT) & Verification',
            description: 'Staging regression testing, security auditing, and end-user onboarding.',
            milestoneCode: 'MS-03',
            status: 'IN_PROGRESS',
            progress: 65,
            plannedEndDate: '2026-08-30',
          },
        ]);
      }
    } catch (err) {
      console.warn('Milestones fetch error:', err);
    } finally {
      setLoadingMilestones(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await apiClient.post('/rd/milestones', {
        projectId: id || project.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        plannedEndDate: newDueDate || null,
        status: 'PLANNED',
      });
      if (res.success) {
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
        fetchMilestones();
      }
    } catch (err) {
      console.error('Failed to create milestone:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div className="page-header-row">
        <div>
          <Breadcrumb items={[{ label: 'ERP' }, { label: 'Projects', href: '/crm/erp/projects' }, { label: project.name }]} />
          <h1 style={{ fontSize: 'var(--text-2xl)', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
            {project.name}
          </h1>
          <p className="text-xs text-secondary margin-0">
            ERP Project dynamic milestones tracking, financial metrics, and delivery timeline status
          </p>
        </div>
        <div className="header-actions-right" style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/rd/gantt')}
            style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
          >
            Open in Gantt & Roadmap
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/crm/erp/projects')}
            style={{ borderRadius: '8px', padding: '0.5rem 1rem' }}
          >
            Back to Projects
          </Button>
        </div>
      </div>

      {/* 2. Main 2-Column Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Project Overview & Key Financial Metrics */}
        <Card className="p-6 flex flex-col gap-6" style={{ borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(29, 78, 216, 0.1)',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Project Overview
              </h3>
            </div>

            <Badge variant="primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
              {project.status || 'In Progress'}
            </Badge>
          </div>

          {/* Box-Free Key-Value Details */}
          <div className="flex flex-col gap-3">
            {/* Detail 1: Client */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-tertiary font-semibold flex items-center gap-2">
                <Building2 size={15} className="text-primary" /> Client Enterprise:
              </span>
              <span className="text-sm font-bold text-primary">{project.client}</span>
            </div>

            {/* Detail 2: Budget */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-tertiary font-semibold flex items-center gap-2">
                <DollarSign size={15} className="text-success" /> Total Allocated Budget:
              </span>
              <span className="text-sm font-extrabold text-success">{project.budget || '$500,000'}</span>
            </div>

            {/* Detail 3: Capital Spent */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-tertiary font-semibold flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" /> Capital Disbursed / Spent:
              </span>
              <span className="text-sm font-bold text-secondary">{project.spent || '$180,000'}</span>
            </div>

            {/* Detail 4: Target Deadline */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-tertiary font-semibold flex items-center gap-2">
                <Calendar size={15} className="text-tertiary" /> Target Delivery Deadline:
              </span>
              <span className="text-sm font-bold text-primary">{project.deadline ? String(project.deadline).slice(0, 10) : '2026-08-30'}</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-secondary uppercase tracking-wider">Overall Completion Progress</span>
              <span className="font-extrabold text-primary" style={{ fontSize: '13px' }}>
                {project.progress || 0}% Complete
              </span>
            </div>
            <ProgressBar value={project.progress || 0} variant="success" />
          </div>
        </Card>

        {/* Right Card: Dynamic Milestone Timeline */}
        <Card className="p-6 flex flex-col gap-6" style={{ borderRadius: '16px', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live Milestone Timeline
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-xs text-tertiary font-semibold">{milestones.length} Phases</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
              >
                <Plus size={12} style={{ marginRight: 2 }} />
                Add
              </Button>
            </div>
          </div>

          {/* Dynamic Database-Driven Timeline Rendering */}
          <div className="pt-1">
            <Timeline
              items={milestones.map((ms) => ({
                title: ms.title,
                description: ms.description || 'Milestone deliverable phase.',
                time: `${ms.milestoneCode || 'Checkpoint'} — ${ms.status} (${ms.progress}%)`,
                color: ms.status === 'COMPLETED' ? 'var(--success)' : ms.isDelayed ? 'var(--danger)' : 'var(--primary)',
              }))}
            />
          </div>
        </Card>

      </div>

      {/* Modal: Quick Add Milestone */}
      {showAddModal && (
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
              maxWidth: '460px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Add Project Milestone</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pilot Production Readiness Gate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Exit criteria, deliverables..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Planned Target Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Milestone
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
