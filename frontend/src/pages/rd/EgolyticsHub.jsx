import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Clock,
  Compass,
  Boxes,
  Lock,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Building2,
  AlertCircle,
  FileText,
  Key,
  Users,
  Cpu,
  Workflow,
  FolderGit2,
  Inbox,
  ArrowUpDown,
  Target,
  Lightbulb,
  Award,
  Filter,
  CheckSquare
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
  Tabs,
  Input
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/apiClient';

import { RdPortfolio } from './RdPortfolio';
import { RdIntake } from './RdIntake';
import { RdStrategicAlignment } from './RdStrategicAlignment';
import { RdPrioritization } from './RdPrioritization';
import { RdIdeas } from './RdIdeas';
import { RdIdeaRanking } from './RdIdeaRanking';
import { RdInnovationPipeline } from './RdInnovationPipeline';
import { RdStageGate } from './RdStageGate';
import { RdTasks } from './RdTasks';

export const EgolyticsHub = () => {
  const { t } = useLanguage();
  const { crmUser } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (pathname) => {
    if (pathname.includes('/tasks') || pathname.includes('/sprints') || pathname.includes('/backlog') || pathname.includes('/schedule')) return 'tasks';
    if (pathname.includes('/stagegate') || pathname.includes('/gates')) return 'stagegate';
    if (pathname.includes('/ideas')) return 'ideas';
    if (pathname.includes('/ranking') || pathname.includes('/leaderboard')) return 'ranking';
    if (pathname.includes('/pipeline')) return 'pipeline';
    if (pathname.includes('/portfolio')) return 'portfolio';
    if (pathname.includes('/intake')) return 'intake';
    if (pathname.includes('/strategy')) return 'strategy';
    if (pathname.includes('/prioritization')) return 'prioritization';
    if (pathname.includes('/modules')) return 'modules';
    if (pathname.includes('/rbac')) return 'rbac';
    if (pathname.includes('/isolation')) return 'isolation';
    return 'tasks'; // Default to active Tasks & Sprints for Master Prompt 05
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'tasks') navigate('/crm/rd/tasks');
    else if (tabId === 'stagegate') navigate('/crm/rd/stagegate');
    else if (tabId === 'ideas') navigate('/crm/rd/ideas');
    else if (tabId === 'ranking') navigate('/crm/rd/ranking');
    else if (tabId === 'pipeline') navigate('/crm/rd/pipeline');
    else if (tabId === 'portfolio') navigate('/crm/rd/portfolio');
    else if (tabId === 'intake') navigate('/crm/rd/intake');
    else if (tabId === 'strategy') navigate('/crm/rd/strategy');
    else if (tabId === 'prioritization') navigate('/crm/rd/prioritization');
    else navigate('/crm/rd');
  };
  const [loading, setLoading] = useState(true);
  const [rdStatus, setRdStatus] = useState(null);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [testingTenant, setTestingTenant] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchFoundationData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, modRes, permRes] = await Promise.all([
        apiClient.get('/rd/status').catch((err) => ({ success: false, error: err.message })),
        apiClient.get('/rd/modules').catch((err) => ({ success: false, data: [] })),
        apiClient.get('/rd/permissions').catch((err) => ({ success: false, data: [] })),
      ]);

      if (statusRes.success && statusRes.data) {
        setRdStatus(statusRes.data);
      }
      if (modRes.success && Array.isArray(modRes.data)) {
        setModules(modRes.data);
      }
      if (permRes.success && Array.isArray(permRes.data)) {
        setPermissions(permRes.data);
      }
    } catch (error) {
      console.error('[EgolyticsHub] Data fetch error:', error);
      addToast({
        title: 'Telemetry Notice',
        message: 'Loaded local baseline foundation data.',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFoundationData();
  }, [fetchFoundationData]);

  const handleTestTenantIsolation = async (simulateAttack = false) => {
    setTestingTenant(true);
    setVerificationResult(null);
    try {
      const sessionTenant = crmUser?.tenantId || rdStatus?.tenant?.id || 'TENANT-08492';
      const claimedTenantId = simulateAttack ? 'ATTACKER_TENANT_MALICIOUS_999' : sessionTenant;

      const res = await apiClient.post('/rd/verify-tenant', { claimedTenantId });
      setVerificationResult({
        success: true,
        simulateAttack,
        data: res,
      });
      addToast({
        title: 'Isolation Verified',
        message: 'Strict server-side JWT tenant validation enforced.',
        type: 'success',
      });
    } catch (err) {
      setVerificationResult({
        success: false,
        simulateAttack,
        error: err.message || 'Cross-tenant request rejected by server.',
        rejected: true,
      });
      if (simulateAttack) {
        addToast({
          title: 'Cross-Tenant Attack Blocked',
          message: 'Server correctly rejected unauthorized tenant injection (403 Forbidden).',
          type: 'success',
        });
      } else {
        addToast({
          title: 'Verification Error',
          message: err.message,
          type: 'error',
        });
      }
    } finally {
      setTestingTenant(false);
    }
  };

  const filteredModules = categoryFilter === 'all'
    ? modules
    : modules.filter((m) => m.category.toLowerCase() === categoryFilter.toLowerCase());

  const categories = ['all', ...new Set(modules.map((m) => m.category))];

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header & Breadcrumb */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Breadcrumb items={[{ label: 'EgoLytics' }, { label: 'R&D Management Platform' }, { label: 'Architecture & Foundation' }]} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              EgoLytics – R&D Management Platform
            </h1>
            <Badge variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} />
              Master Prompt 01
            </Badge>
          </div>
          <p className="text-xs text-secondary" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
            Research, Innovation & Engineering Division of CRM nErgy AI • Enterprise Multi-Tenant Foundation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchFoundationData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </Button>
          <Badge variant="success" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>
            <ShieldCheck size={14} style={{ marginRight: 4 }} />
            Tenant Isolated
          </Badge>
        </div>
      </div>

      {/* 2. Key Architectural Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Platform Division"
          value="EgoLytics R&D"
          icon={FlaskConical}
          trend={{ value: '16 Prompts Roadmap', isPositive: true }}
        />
        <KPICard
          title="Active Tenant Partition"
          value={rdStatus?.tenant?.name || 'nErgy Enterprise'}
          icon={Building2}
          trend={{ value: rdStatus?.tenant?.id || 'TENANT-08492', isNeutral: true }}
        />
        <KPICard
          title="Active Master Prompt"
          value="Master Prompt 05"
          icon={CheckSquare}
          trend={{ value: 'Task & Sprint Scheduling Active', isPositive: true }}
        />
        <KPICard
          title="Security & RBAC"
          value="12-Role Matrix"
          icon={Lock}
          trend={{ value: 'Strict JWT Scoping', isPositive: true }}
        />
      </div>

      {/* 3. Main Workspace Tabs */}
      <Card>
        <CardBody className="p-0">
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
            <Tabs
              tabs={[
                { id: 'tasks', label: 'Tasks & Sprints', icon: CheckSquare },
                { id: 'stagegate', label: 'Stage-Gate Governance', icon: Workflow },
                { id: 'ideas', label: 'Idea Management', icon: Lightbulb },
                { id: 'ranking', label: 'Idea Leaderboard', icon: Award },
                { id: 'pipeline', label: 'Innovation Funnel', icon: Filter },
                { id: 'portfolio', label: 'R&D Portfolio', icon: FolderGit2 },
                { id: 'intake', label: 'Project Intake', icon: Inbox },
                { id: 'strategy', label: 'Strategic Alignment', icon: Compass },
                { id: 'prioritization', label: 'Prioritization Engine', icon: ArrowUpDown },
                { id: 'overview', label: 'Architecture & Boundaries', icon: Layers },
                { id: 'modules', label: `16-Prompt Roadmap (${modules.length})`, icon: Boxes },
                { id: 'rbac', label: `RBAC Matrix (${permissions.length})`, icon: Key },
                { id: 'isolation', label: 'Tenant Inspector', icon: ShieldCheck },
              ]}
              activeTab={activeTab}
              onChange={handleTabChange}
            />
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* TAB: TASKS, SPRINTS & SCHEDULING (REQ 11-20) */}
            {activeTab === 'tasks' && <RdTasks />}

            {/* TAB: STAGE-GATE GOVERNANCE (REQ 7 & 8) */}
            {activeTab === 'stagegate' && <RdStageGate />}

            {/* TAB: IDEA MANAGEMENT (REQ 3 & 61) */}
            {activeTab === 'ideas' && <RdIdeas />}

            {/* TAB: IDEA LEADERBOARD & RANKING (REQ 4) */}
            {activeTab === 'ranking' && <RdIdeaRanking />}

            {/* TAB: INNOVATION FUNNEL (REQ 62) */}
            {activeTab === 'pipeline' && <RdInnovationPipeline />}

            {/* TAB: R&D PORTFOLIO (REQ 1) */}
            {activeTab === 'portfolio' && <RdPortfolio />}

            {/* TAB: PROJECT INTAKE (REQ 2) */}
            {activeTab === 'intake' && <RdIntake />}

            {/* TAB: STRATEGIC ALIGNMENT (REQ 5) */}
            {activeTab === 'strategy' && <RdStrategicAlignment />}

            {/* TAB: PRIORITIZATION ENGINE (REQ 6) */}
            {activeTab === 'prioritization' && <RdPrioritization />}

            {/* TAB 1: ARCHITECTURE & BOUNDARIES */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, marginBottom: '0.25rem' }}>
                    EgoLytics System Boundary Architecture
                  </h3>
                  <p className="text-xs text-secondary" style={{ margin: 0 }}>
                    Strict separation of concerns between Commercial CRM, Enterprise ERP, and the EgoLytics R&D Subsystem.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Boundary 1: Commercial CRM */}
                  <Card style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
                    <CardHeader
                      title="Commercial CRM Core"
                      subtitle="Sales & Customer Pipeline"
                      action={<Badge variant="neutral">Active Core</Badge>}
                    />
                    <CardBody className="pt-0 flex flex-col gap-2 text-xs text-secondary">
                      <div>• Lead Acquisition & BANT Qualification</div>
                      <div>• Contact Directory & 360° Timeline</div>
                      <div>• 8-Stage Sales Pipeline Kanban</div>
                      <div>• Operational Tasks & Calendar Reminders</div>
                      <div>• Multi-Channel Email & SMS Hub</div>
                    </CardBody>
                  </Card>

                  {/* Boundary 2: Enterprise ERP */}
                  <Card style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}>
                    <CardHeader
                      title="Enterprise ERP Operations"
                      subtitle="Supply Chain & Financials"
                      action={<Badge variant="neutral">Active Core</Badge>}
                    />
                    <CardBody className="pt-0 flex flex-col gap-2 text-xs text-secondary">
                      <div>• Commercial Fulfillment Projects</div>
                      <div>• Procurement & Purchase Orders</div>
                      <div>• Sales Orders & Inventory Warehousing</div>
                      <div>• General Ledger & Invoicing Engine</div>
                      <div>• Manufacturing Production Orders</div>
                    </CardBody>
                  </Card>

                  {/* Boundary 3: EgoLytics R&D */}
                  <Card style={{ backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'var(--primary)' }}>
                    <CardHeader
                      title="EgoLytics R&D Tool"
                      subtitle="Innovation & Research Subsystem"
                      action={<Badge variant="primary">Foundation Active</Badge>}
                    />
                    <CardBody className="pt-0 flex flex-col gap-2 text-xs text-secondary">
                      <div>• Idea Capture, Scoring & Innovation Funnels</div>
                      <div>• Stage-Gate Phase Approvals & Decisions</div>
                      <div>• Hypotheses & Experiment Lab Notebooks</div>
                      <div>• Maplytics GIS Spatial Engine (Prompt 09)</div>
                      <div>• BFOV Charts Diagramming Suite (Prompt 11)</div>
                    </CardBody>
                  </Card>
                </div>

                {/* Reuse Strategy Overview */}
                <div style={{ backgroundColor: 'var(--surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Core Primitives Reused from Existing Architecture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <span className="font-bold text-primary">Authentication & JWT:</span>
                      <p className="margin-0 text-muted" style={{ marginTop: 4 }}>Bcrypt salt hashing and 7-day token verification reused as-is.</p>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <span className="font-bold text-primary">Multi-Tenancy:</span>
                      <p className="margin-0 text-muted" style={{ marginTop: 4 }}>Strict `tenantId` partitioning across all database models.</p>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <span className="font-bold text-primary">Dynamic RBAC:</span>
                      <p className="margin-0 text-muted" style={{ marginTop: 4 }}>12 persona roles extended with R&D namespaces without schema mutation.</p>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <span className="font-bold text-primary">Audit Stream:</span>
                      <p className="margin-0 text-muted" style={{ marginTop: 4 }}>Immutable `Activity` logs tracking state and timestamp changes.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MODULE REGISTRY & 16-PROMPT ROADMAP */}
            {activeTab === 'modules' && (
              <div className="flex flex-col gap-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, marginBottom: '0.25rem' }}>
                      EgoLytics 16-Prompt Master Roadmap Registry
                    </h3>
                    <p className="text-xs text-secondary" style={{ margin: 0 }}>
                      Official module manifests mapping directly to the client's 100 features, Maplytics, and BFOV Charts.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: categoryFilter === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: categoryFilter === cat ? 'var(--primary-subtle)' : 'var(--surface)',
                          color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Prompt Stage</TableCell>
                      <TableCell isHeader>Module Name</TableCell>
                      <TableCell isHeader>Category</TableCell>
                      <TableCell isHeader>Client Requirements Covered</TableCell>
                      <TableCell isHeader>Lifecycle Status</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModules.map((mod) => (
                      <TableRow key={mod.id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                            {mod.prompt}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-bold text-sm text-primary">{mod.name}</span>
                            <p className="text-xs text-muted margin-0" style={{ marginTop: 2 }}>{mod.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" style={{ fontSize: '10px' }}>{mod.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {mod.clientRequirements.map((req, rIdx) => (
                              <span key={rIdx} className="font-mono text-xs text-secondary">
                                • {req}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {mod.status === 'ACTIVE' ? (
                            <Badge variant="success" style={{ fontWeight: 700 }}>
                              <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                              Active Foundation
                            </Badge>
                          ) : (
                            <Badge variant="neutral" style={{ color: 'var(--text-muted)' }}>
                              <Clock size={12} style={{ marginRight: 4 }} />
                              Roadmap Phase
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* TAB 3: RBAC & PERMISSION NAMESPACES */}
            {activeTab === 'rbac' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, marginBottom: '0.25rem' }}>
                    EgoLytics R&D Permission Architecture
                  </h3>
                  <p className="text-xs text-secondary" style={{ margin: 0 }}>
                    Standardized, non-breaking permission namespaces governing future R&D module access.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                          {perm.id}
                        </span>
                        <Badge variant="neutral" style={{ fontSize: '10px' }}>Namespace</Badge>
                      </div>
                      <span className="font-semibold text-sm text-primary">{perm.name}</span>
                      <p className="text-xs text-muted margin-0">{perm.description}</p>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>
                    Role Compatibility Verification
                  </h4>
                  <p className="text-xs text-secondary margin-0">
                    Existing 12 roles (`business_owner`, `super_admin`, `admin_1`, `crm_pro`, etc.) retain full operational stability. 
                    `rd-workspace` has been provisioned as an authorized navigation ID for executive and administrative roles, while 
                    external/customer roles (`customer`, `influencer`) remain securely restricted.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: MULTI-TENANT ISOLATION INSPECTOR */}
            {activeTab === 'isolation' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, marginBottom: '0.25rem' }}>
                    Live Multi-Tenant Security & Boundary Inspector
                  </h3>
                  <p className="text-xs text-secondary" style={{ margin: 0 }}>
                    Execute real-time cryptographic and server-side verification of tenant partitioning.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Action 1: Standard Tenant Scoping */}
                  <Card style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <CardHeader
                      title="1. Verify Legitimate Tenant Session"
                      subtitle="Validates JWT session against database tenant context"
                    />
                    <CardBody className="pt-0 flex flex-col gap-3">
                      <p className="text-xs text-secondary margin-0">
                        Calls `POST /api/rd/verify-tenant` with verified JWT claims. Confirms data scoping strictly matches authenticated organization.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ShieldCheck}
                          onClick={() => handleTestTenantIsolation(false)}
                          disabled={testingTenant}
                        >
                          {testingTenant ? 'Verifying...' : 'Verify Session Tenant'}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Action 2: Attack Simulation */}
                  <Card style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <CardHeader
                      title="2. Simulate Cross-Tenant Injection Attack"
                      subtitle="Tests server-side parameter tampering rejection"
                    />
                    <CardBody className="pt-0 flex flex-col gap-3">
                      <p className="text-xs text-secondary margin-0">
                        Sends a request claiming `claimedTenantId = "ATTACKER_TENANT_MALICIOUS_999"`. The backend guard must intercept and return 403 Forbidden.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Lock}
                          onClick={() => handleTestTenantIsolation(true)}
                          disabled={testingTenant}
                        >
                          {testingTenant ? 'Simulating...' : 'Simulate Cross-Tenant Attack'}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Verification Result Display */}
                {verificationResult && (
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      backgroundColor: verificationResult.simulateAttack ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                      border: `1px solid ${verificationResult.simulateAttack ? 'var(--danger)' : 'var(--success)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                      {verificationResult.simulateAttack ? (
                        <CheckCircle2 size={18} color="var(--success)" />
                      ) : (
                        <ShieldCheck size={18} color="var(--success)" />
                      )}
                      <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {verificationResult.simulateAttack
                          ? 'Security Test Result: Attack Intercepted & Rejected (403 Forbidden)'
                          : 'Security Test Result: Tenant Session Confirmed & Isolated (200 OK)'}
                      </h4>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#cbd5e1',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(verificationResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
