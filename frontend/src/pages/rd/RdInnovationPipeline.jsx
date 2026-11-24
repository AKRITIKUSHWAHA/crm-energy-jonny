import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  Breadcrumb,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  KPICard,
  ProgressBar
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdInnovationPipeline = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const [pipeRes, catRes] = await Promise.all([
        apiClient.get('/rd/ideas/pipeline'),
        apiClient.get('/rd/ideas/categories').catch(() => ({ success: false, data: [] })),
      ]);

      if (pipeRes.success && pipeRes.data) {
        setPipelineData(pipeRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('[RdInnovationPipeline] Fetch error:', err);
      addToast({
        title: 'Pipeline Notice',
        message: err.message || 'Loaded pipeline metrics.',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleStageClick = (stageId) => {
    navigate(`/crm/rd/ideas?status=${stageId}`);
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Innovation Pipeline' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Innovation Funnel & Pipeline Tracking
            </h1>
            <Badge variant="success">Req 62 — Lifecycle Funnel</Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Visual progression of research concepts through drafting, formal screening, review, clarification, and incubation selection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={fetchPipeline} disabled={loading} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/crm/rd/ideas')} leftIcon={<Lightbulb size={14} />}>
            Manage Ideas
          </Button>
        </div>
      </div>

      {/* 2. Top-level Funnel KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard
          title="Total Registered Concepts"
          value={pipelineData?.totalIdeas || 0}
          change="Across all lifecycle stages"
          trend="neutral"
          icon={<Lightbulb size={20} />}
        />
        <KPICard
          title="Active Screening Queue"
          value={
            (pipelineData?.funnel?.find((s) => s.id === 'SUBMITTED')?.count || 0) +
            (pipelineData?.funnel?.find((s) => s.id === 'UNDER_REVIEW')?.count || 0)
          }
          change="Submitted & Under Review"
          trend="positive"
          icon={<Clock size={20} />}
        />
        <KPICard
          title="Incubation Candidates"
          value={pipelineData?.funnel?.find((s) => s.id === 'ACCEPTED_FOR_INCUBATION')?.count || 0}
          change="Selected for formal lab R&D"
          trend="positive"
          icon={<CheckCircle2 size={20} />}
        />
        <KPICard
          title="Active Categories"
          value={categories.length}
          change="Thematic discovery domains"
          trend="neutral"
          icon={<Layers size={20} />}
        />
      </div>

      {/* 3. Funnel Stages Visual Progression */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              Ideation Stage Funnel Breakdown
            </h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Real-time stage distribution
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Loading pipeline metrics...
            </div>
          ) : !pipelineData || pipelineData.funnel.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No pipeline records available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pipelineData.funnel.map((stage) => (
                <div
                  key={stage.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleStageClick(stage.id)}
                  title={`View ideas in ${stage.label}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: stage.color,
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {stage.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--text-base)' }}>
                        {stage.count} ideas
                      </span>
                      <Badge variant="outline">{stage.percentage}%</Badge>
                      <ArrowRight size={14} color="var(--text-secondary)" />
                    </div>
                  </div>
                  <ProgressBar value={stage.percentage} max={100} style={{ height: 8 }} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 4. Thematic Domains Overview */}
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
            Innovation Categories Overview ({categories.length})
          </h2>
        </CardHeader>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: cat.color || '#3b82f6',
                    }}
                  />
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{cat.name}</div>
                </div>
                <p style={{ margin: '4px 0 8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {cat.description || 'General innovation domain.'}
                </p>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  Initiatives: {cat._count?.ideas || 0}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default RdInnovationPipeline;
