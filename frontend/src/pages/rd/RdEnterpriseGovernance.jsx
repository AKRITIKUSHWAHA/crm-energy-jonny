/**
 * EgoLytics R&D Management — Enterprise Governance, IP, Compliance & Portability
 * Master Prompt 16: Complete IP Registry, Regulatory SOPs, Audit Trail, API Keys & Universal Exports
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  FileText,
  Key,
  Download,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Lock,
  Globe,
  Award,
  BookOpen,
  Calendar,
  User,
  Hash,
  Layers,
  Sparkles,
  Trash2,
  Eye,
  Check
} from 'lucide-react';
import { rdEnterpriseService } from '../../services/rdEnterpriseService';
import { useToast } from '../../context/ToastContext';

export const RdEnterpriseGovernance = () => {
  const { showToast } = useToast() || { showToast: (msg) => console.log(msg) };

  // Active Tab
  const [activeTab, setActiveTab] = useState('ip'); // 'ip' | 'compliance' | 'audit' | 'apikeys' | 'exports'

  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Telemetry Metrics
  const [ipMetrics, setIpMetrics] = useState(null);
  const [complianceMetrics, setComplianceMetrics] = useState(null);
  const [auditMetrics, setAuditMetrics] = useState(null);

  // IP State
  const [ipAssets, setIpAssets] = useState([]);
  const [ipSearch, setIpSearch] = useState('');
  const [ipCategoryFilter, setIpCategoryFilter] = useState('ALL');
  const [ipStatusFilter, setIpStatusFilter] = useState('ALL');
  const [isNewIpModalOpen, setIsNewIpModalOpen] = useState(false);
  const [newIpForm, setNewIpForm] = useState({
    title: '',
    category: 'PATENT',
    jurisdiction: 'US',
    applicationNumber: '',
    patentNumber: '',
    claimsCount: 1,
    inventors: '',
    description: '',
    notes: ''
  });

  // Compliance State
  const [sops, setSops] = useState([]);
  const [sopCategoryFilter, setSopCategoryFilter] = useState('ALL');
  const [sopStatusFilter, setSopStatusFilter] = useState('ALL');
  const [isNewSopModalOpen, setIsNewSopModalOpen] = useState(false);
  const [newSopForm, setNewSopForm] = useState({
    sopIdentifier: '',
    title: '',
    category: 'LAB_SAFETY',
    regulatoryStandard: 'ISO 9001 / GLP',
    version: '1.0',
    description: ''
  });
  const [selectedSopForDetail, setSelectedSopForDetail] = useState(null);
  const [newChecklistRequirement, setNewChecklistRequirement] = useState('');
  const [incidentForm, setIncidentForm] = useState({ severity: 'MEDIUM', description: '', correctiveAction: '' });
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Audit State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    scopes: ['rd:read', 'rd:export'],
    rateLimitPerMin: 60,
    expiresAtDays: 90
  });
  const [generatedRawKeyBanner, setGeneratedRawKeyBanner] = useState(null);

  // Universal Export State
  const [exportEntity, setExportEntity] = useState('projects');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  // ==========================================
  // DATA LOADERS
  // ==========================================

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ipM, compM, audM] = await Promise.allSettled([
        rdEnterpriseService.getIpMetrics(),
        rdEnterpriseService.getComplianceMetrics(),
        rdEnterpriseService.getAuditMetrics()
      ]);

      if (ipM.status === 'fulfilled') setIpMetrics(ipM.value.data || ipM.value);
      if (compM.status === 'fulfilled') setComplianceMetrics(compM.value.data || compM.value);
      if (audM.status === 'fulfilled') setAuditMetrics(audM.value.data || audM.value);

      // Load active tab's records
      if (activeTab === 'ip') {
        const res = await rdEnterpriseService.listIpAssets({
          search: ipSearch,
          category: ipCategoryFilter,
          status: ipStatusFilter
        });
        setIpAssets(res.data || res.assets || []);
      } else if (activeTab === 'compliance') {
        const res = await rdEnterpriseService.listSops({
          category: sopCategoryFilter,
          approvalStatus: sopStatusFilter
        });
        setSops(res.data || res.sops || []);
      } else if (activeTab === 'audit') {
        const res = await rdEnterpriseService.listAuditLogs({
          action: auditActionFilter
        });
        setAuditLogs(res.data || res.logs || []);
      } else if (activeTab === 'apikeys') {
        const res = await rdEnterpriseService.listApiKeys();
        setApiKeys(res.data || res || []);
      }
    } catch (err) {
      console.error('Failed to load enterprise data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, ipSearch, ipCategoryFilter, ipStatusFilter, sopCategoryFilter, sopStatusFilter, auditActionFilter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==========================================
  // IP ASSET HANDLERS
  // ==========================================

  const handleCreateIp = async (e) => {
    e.preventDefault();
    if (!newIpForm.title.trim()) return;

    try {
      const payload = {
        ...newIpForm,
        inventors: newIpForm.inventors.split(',').map((s) => s.trim()).filter(Boolean)
      };
      await rdEnterpriseService.createIpAsset(payload);
      showToast?.('IP Asset registered successfully!', 'success');
      setIsNewIpModalOpen(false);
      setNewIpForm({
        title: '',
        category: 'PATENT',
        jurisdiction: 'US',
        applicationNumber: '',
        patentNumber: '',
        claimsCount: 1,
        inventors: '',
        description: '',
        notes: ''
      });
      loadAllData();
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Failed to create IP asset', 'error');
    }
  };

  const handleAdvanceIpStatus = async (id, nextStatus) => {
    try {
      await rdEnterpriseService.updateIpAsset(id, { status: nextStatus });
      showToast?.(`IP status advanced to ${nextStatus}`, 'success');
      loadAllData();
    } catch (err) {
      showToast?.('Failed to update IP asset status', 'error');
    }
  };

  const handleDeleteIp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this IP record?')) return;
    try {
      await rdEnterpriseService.deleteIpAsset(id);
      showToast?.('IP Asset deleted successfully', 'success');
      loadAllData();
    } catch (err) {
      showToast?.('Failed to delete IP asset', 'error');
    }
  };

  // ==========================================
  // COMPLIANCE SOP HANDLERS
  // ==========================================

  const handleCreateSop = async (e) => {
    e.preventDefault();
    if (!newSopForm.title.trim()) return;

    try {
      await rdEnterpriseService.createSop(newSopForm);
      showToast?.('Compliance SOP registered successfully!', 'success');
      setIsNewSopModalOpen(false);
      setNewSopForm({
        sopIdentifier: '',
        title: '',
        category: 'LAB_SAFETY',
        regulatoryStandard: 'ISO 9001 / GLP',
        version: '1.0',
        description: ''
      });
      loadAllData();
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Failed to create SOP', 'error');
    }
  };

  const handleApproveSop = async (id, isApproved) => {
    const comments = window.prompt(`Enter ${isApproved ? 'approval' : 'rejection'} comments:`) || '';
    try {
      await rdEnterpriseService.approveSop(id, { isApproved, comments });
      showToast?.(`SOP ${isApproved ? 'Approved' : 'Rejected'} successfully`, 'success');
      loadAllData();
      if (selectedSopForDetail?.id === id) {
        const updated = await rdEnterpriseService.getSopById(id);
        setSelectedSopForDetail(updated.data || updated);
      }
    } catch (err) {
      showToast?.('Failed to update SOP approval state', 'error');
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!selectedSopForDetail || !newChecklistRequirement.trim()) return;

    try {
      await rdEnterpriseService.addChecklistItem(selectedSopForDetail.id, {
        requirement: newChecklistRequirement.trim(),
        mandatory: true,
        verificationMethod: 'Quality Sign-Off'
      });
      showToast?.('Checklist verification step added', 'success');
      setNewChecklistRequirement('');
      const updated = await rdEnterpriseService.getSopById(selectedSopForDetail.id);
      setSelectedSopForDetail(updated.data || updated);
      loadAllData();
    } catch (err) {
      showToast?.('Failed to add checklist item', 'error');
    }
  };

  const handleRecordIncident = async (e) => {
    e.preventDefault();
    if (!selectedSopForDetail || !incidentForm.description.trim()) return;

    try {
      await rdEnterpriseService.recordIncident(selectedSopForDetail.id, incidentForm);
      showToast?.('Non-compliance incident recorded and logged in audit', 'warning');
      setIsIncidentModalOpen(false);
      setIncidentForm({ severity: 'MEDIUM', description: '', correctiveAction: '' });
      const updated = await rdEnterpriseService.getSopById(selectedSopForDetail.id);
      setSelectedSopForDetail(updated.data || updated);
      loadAllData();
    } catch (err) {
      showToast?.('Failed to record incident', 'error');
    }
  };

  // ==========================================
  // API KEY HANDLERS
  // ==========================================

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyForm.name.trim()) return;

    try {
      const res = await rdEnterpriseService.generateApiKey(newKeyForm);
      const generated = res.data || res;
      setGeneratedRawKeyBanner(generated);
      showToast?.('Enterprise API key created! Save the secret key now.', 'success');
      setIsNewKeyModalOpen(false);
      setNewKeyForm({
        name: '',
        scopes: ['rd:read', 'rd:export'],
        rateLimitPerMin: 60,
        expiresAtDays: 90
      });
      loadAllData();
    } catch (err) {
      showToast?.(err.response?.data?.message || err.message || 'Failed to generate API key', 'error');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? External clients using it will lose access immediately.')) return;
    try {
      await rdEnterpriseService.revokeApiKey(id);
      showToast?.('API key revoked successfully', 'success');
      loadAllData();
    } catch (err) {
      showToast?.('Failed to revoke API key', 'error');
    }
  };

  // ==========================================
  // UNIVERSAL EXPORT HANDLER
  // ==========================================

  const handleExecuteExport = async () => {
    setExporting(true);
    try {
      await rdEnterpriseService.downloadExport(exportEntity, exportFormat);
      showToast?.(`Successfully exported ${exportEntity.toUpperCase()} as ${exportFormat.toUpperCase()}`, 'success');
    } catch (err) {
      showToast?.('Failed to generate export file', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Helper status badge styles
  const getStatusBadge = (status) => {
    switch (status) {
      case 'GRANTED':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'EXAMINATION':
      case 'UNDER_REVIEW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'INVENTION_DISCLOSURE':
      case 'INITIAL_REVIEW':
      case 'FILING_PREP':
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'REJECTED':
      case 'REVOKED':
      case 'EXPIRED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <ShieldCheck className="w-4 h-4" />
            EgoLytics Enterprise Governance & Compliance
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
            Intellectual Property, SOPs & Enterprise QA
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Master Prompt 16: Patent registries, regulatory compliance, immutable audit trail, scoped API keys, and universal data portability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); loadAllData(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Total IP Assets
          </div>
          <div className="text-xl font-bold text-white mt-1">{ipMetrics?.totalAssets || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{ipMetrics?.grantedPatents || 0} Granted Patents</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Pending IP Apps
          </div>
          <div className="text-xl font-bold text-white mt-1">{ipMetrics?.pendingApplications || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{ipMetrics?.tradeSecrets || 0} Trade Secrets</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Active SOPs
          </div>
          <div className="text-xl font-bold text-white mt-1">{complianceMetrics?.totalSops || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{complianceMetrics?.approvedSops || 0} Approved / Effective</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Incidents / CAPA
          </div>
          <div className="text-xl font-bold text-white mt-1">{complianceMetrics?.totalIncidents || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{complianceMetrics?.openIncidents || 0} Open Investigations</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Audit Log Entries
          </div>
          <div className="text-xl font-bold text-white mt-1">{auditMetrics?.totalLogs || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immutable records</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <Key className="w-3.5 h-3.5 text-teal-400" /> Scoped API Keys
          </div>
          <div className="text-xl font-bold text-white mt-1">{apiKeys.filter((k) => k.status === 'ACTIVE').length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">SHA-256 Hashed</div>
        </div>
      </div>

      {/* Generated Raw Key Banner (Shown ONCE after key creation) */}
      {generatedRawKeyBanner && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Lock className="w-4 h-4 text-amber-400" />
              API Key Generated: "{generatedRawKeyBanner.name}"
            </div>
            <button
              onClick={() => setGeneratedRawKeyBanner(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-amber-300">
            Copy this secret key immediately. For security, it is hashed with SHA-256 and cannot be displayed again.
          </p>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 rounded-lg p-2.5">
            <code className="text-xs font-mono text-emerald-400 flex-1 select-all break-all">
              {generatedRawKeyBanner.rawKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedRawKeyBanner.rawKey);
                showToast?.('API Key copied to clipboard!', 'success');
              }}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ip')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'ip' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Intellectual Property & Patents
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'compliance' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Regulatory Compliance & SOPs
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'audit' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Enterprise Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'apikeys' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Scoped API Keys
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'exports' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          Universal Data Export
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTELLECTUAL PROPERTY & PATENTS */}
      {/* ========================================================================= */}
      {activeTab === 'ip' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patents, application #, title..."
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={ipCategoryFilter}
                onChange={(e) => setIpCategoryFilter(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Categories</option>
                <option value="PATENT">Patent</option>
                <option value="TRADEMARK">Trademark</option>
                <option value="COPYRIGHT">Copyright</option>
                <option value="INDUSTRIAL_DESIGN">Industrial Design</option>
                <option value="TRADE_SECRET">Trade Secret</option>
              </select>

              <select
                value={ipStatusFilter}
                onChange={(e) => setIpStatusFilter(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="INVENTION_DISCLOSURE">Invention Disclosure</option>
                <option value="INITIAL_REVIEW">Initial Review</option>
                <option value="FILING_PREP">Filing Prep</option>
                <option value="APPLICATION_SUBMITTED">Submitted</option>
                <option value="EXAMINATION">Examination</option>
                <option value="GRANTED">Granted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewIpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" /> Register IP Asset
            </button>
          </div>

          {/* IP Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Jurisdiction</th>
                  <th className="py-3 px-3">App / Patent #</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Inventors</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {ipAssets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No intellectual property assets registered yet. Click "Register IP Asset" to record a patent or trade secret.
                    </td>
                  </tr>
                ) : (
                  ipAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white">{asset.title}</div>
                        {asset.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{asset.description}</div>
                        )}
                        {asset.project && (
                          <div className="text-[10px] text-teal-400 mt-1 font-mono">
                            Project: {asset.project.name} ({asset.project.projectCode})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{asset.jurisdiction || 'US'}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {asset.patentNumber ? (
                          <span className="text-emerald-400">Pat #{asset.patentNumber}</span>
                        ) : asset.applicationNumber ? (
                          <span>App #{asset.applicationNumber}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(asset.status)}`}>
                          {asset.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-[140px] truncate">
                        {Array.isArray(asset.inventors) ? asset.inventors.join(', ') : 'EgoLytics Team'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {asset.status === 'INVENTION_DISCLOSURE' && (
                          <button
                            onClick={() => handleAdvanceIpStatus(asset.id, 'APPLICATION_SUBMITTED')}
                            className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] hover:bg-blue-500/30 transition"
                          >
                            Submit
                          </button>
                        )}
                        {asset.status === 'APPLICATION_SUBMITTED' && (
                          <button
                            onClick={() => handleAdvanceIpStatus(asset.id, 'EXAMINATION')}
                            className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] hover:bg-amber-500/30 transition"
                          >
                            Examine
                          </button>
                        )}
                        {asset.status === 'EXAMINATION' && (
                          <button
                            onClick={() => handleAdvanceIpStatus(asset.id, 'GRANTED')}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] hover:bg-emerald-500/30 transition"
                          >
                            Grant
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteIp(asset.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REGULATORY COMPLIANCE & SOPS */}
      {/* ========================================================================= */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <select
                value={sopCategoryFilter}
                onChange={(e) => setSopCategoryFilter(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All SOP Categories</option>
                <option value="LAB_SAFETY">Lab Safety</option>
                <option value="DATA_INTEGRITY">Data Integrity</option>
                <option value="REGULATORY">Regulatory (GLP/GMP)</option>
                <option value="CLINICAL">Clinical / Bio-Safety</option>
                <option value="QUALITY">Quality Assurance</option>
              </select>

              <select
                value={sopStatusFilter}
                onChange={(e) => setSopStatusFilter(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Approval States</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewSopModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" /> Author New SOP
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* SOP List Column */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 font-semibold text-xs text-slate-300 uppercase tracking-wider">
                Standard Operating Procedures ({sops.length})
              </div>
              <div className="divide-y divide-slate-800/60 max-h-[550px] overflow-y-auto">
                {sops.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No Standard Operating Procedures found. Click "Author New SOP" to establish compliance protocols.
                  </div>
                ) : (
                  sops.map((sop) => (
                    <div
                      key={sop.id}
                      onClick={() => setSelectedSopForDetail(sop)}
                      className={`p-3.5 cursor-pointer hover:bg-slate-850/50 transition flex items-start justify-between gap-3 ${
                        selectedSopForDetail?.id === sop.id ? 'bg-teal-500/10 border-l-2 border-teal-400' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-teal-400">{sop.sopIdentifier}</span>
                          <span className="text-[10px] text-slate-500">v{sop.version}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${getStatusBadge(sop.approvalStatus)}`}>
                            {sop.approvalStatus}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-white">{sop.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{sop.description || 'No description provided.'}</div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>Standard: {sop.regulatoryStandard || 'ISO 9001'}</span>
                          <span>Category: {sop.category}</span>
                          {sop.owner && <span>Author: {sop.owner.name}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end">
                        {sop.approvalStatus !== 'APPROVED' ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApproveSop(sop.id, true); }}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/30 transition flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Effective
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SOP Inspector Panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="font-semibold text-xs text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                SOP Details & Verification Checklists
              </div>

              {selectedSopForDetail ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="text-[10px] font-mono text-teal-400">{selectedSopForDetail.sopIdentifier}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{selectedSopForDetail.title}</div>
                    <div className="text-slate-400 text-xs mt-1">{selectedSopForDetail.description}</div>
                  </div>

                  {/* Verification Checklists */}
                  <div>
                    <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Verification Checklists ({Array.isArray(selectedSopForDetail.checklists) ? selectedSopForDetail.checklists.length : 0})</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto mb-2">
                      {Array.isArray(selectedSopForDetail.checklists) && selectedSopForDetail.checklists.length > 0 ? (
                        selectedSopForDetail.checklists.map((chk, idx) => (
                          <div key={chk.id || idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="text-slate-200 text-xs">{chk.requirement}</div>
                              <div className="text-[10px] text-slate-500">Method: {chk.verificationMethod}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">No checklist items defined yet.</div>
                      )}
                    </div>

                    <form onSubmit={handleAddChecklist} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add verification step..."
                        value={newChecklistRequirement}
                        onChange={(e) => setNewChecklistRequirement(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Non-Compliance & Incidents */}
                  <div className="border-t border-slate-800 pt-3">
                    <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Non-Compliance Incidents ({Array.isArray(selectedSopForDetail.nonComplianceRecords) ? selectedSopForDetail.nonComplianceRecords.length : 0})</span>
                      <button
                        onClick={() => setIsIncidentModalOpen(true)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Report Deviation
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {Array.isArray(selectedSopForDetail.nonComplianceRecords) && selectedSopForDetail.nonComplianceRecords.length > 0 ? (
                        selectedSopForDetail.nonComplianceRecords.map((inc, idx) => (
                          <div key={inc.incidentId || idx} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-200">
                            <div className="flex items-center justify-between text-[10px] font-semibold">
                              <span>{inc.incidentId}</span>
                              <span className="uppercase text-rose-300">{inc.severity}</span>
                            </div>
                            <div className="text-xs text-rose-100 mt-0.5">{inc.description}</div>
                            <div className="text-[10px] text-rose-300/80 mt-1">CAPA: {inc.correctiveAction}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">No non-compliance incidents reported.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Select an SOP from the list to view version history, verification checklists, and deviation reports.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENTERPRISE AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Immutable enterprise event log tracking all lifecycle transitions, permissions, and security actions.
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE_IP_ASSET">Create IP Asset</option>
              <option value="UPDATE_IP_ASSET">Update IP Asset</option>
              <option value="CREATE_SOP">Create SOP</option>
              <option value="APPROVE_SOP">Approve SOP</option>
              <option value="GENERATE_API_KEY">Generate API Key</option>
              <option value="REVOKE_API_KEY">Revoke API Key</option>
              <option value="EXPORT_DATA">Export Data</option>
            </select>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Entity</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-4">Sanitized Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 font-sans">
                      No audit logs captured yet. System activities and security changes will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-2.5 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-sans text-white">{log.actorName || 'System'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{log.entityType}: {log.entityId}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="py-2.5 px-4 font-sans text-xs text-slate-400 max-w-xs truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCOPED API KEYS */}
      {/* ========================================================================= */}
      {activeTab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">External Integration & Scoped API Keys</h2>
              <p className="text-xs text-slate-400">
                Generate cryptographic tokens for external partners, microservices, and scripts. All keys are hashed with SHA-256.
              </p>
            </div>

            <button
              onClick={() => setIsNewKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" /> Generate API Key
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-3">Prefix</th>
                  <th className="py-3 px-3">Scopes Granted</th>
                  <th className="py-3 px-3">Rate Limit</th>
                  <th className="py-3 px-3">Usage Count</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No enterprise API keys created. Click "Generate API Key" to grant external programmatic access.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-4 font-semibold text-white">{key.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{key.keyPrefix}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(key.scopes) && key.scopes.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-teal-300 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{key.rateLimitPerMin} req/min</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{key.usageCount || 0} calls</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(key.status)}`}>
                          {key.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {key.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-semibold transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: UNIVERSAL DATA EXPORT */}
      {/* ========================================================================= */}
      {activeTab === 'exports' && (
        <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-400" />
              Universal Data Portability & Export Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seamlessly export live database records in RFC-4180 compliant CSV, structured JSON, or printable executive summary format.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Select Entity to Export</label>
              <select
                value={exportEntity}
                onChange={(e) => setExportEntity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="projects">R&D Projects Portfolio</option>
                <option value="ideas">Innovation Ideas & Proposals</option>
                <option value="tasks">Project Tasks & Milestones</option>
                <option value="experiments">Research Experiments & Protocols</option>
                <option value="ip_assets">Intellectual Property & Patents</option>
                <option value="compliance_sops">Compliance SOPs & Safety Rules</option>
                <option value="audit_logs">Enterprise Audit Trail</option>
                <option value="diagrams">BFOV Diagrams & Visual Blueprints</option>
                <option value="gis_territories">Maplytics GIS Territories</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-lg border text-center font-medium transition ${
                    exportFormat === 'csv' ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">CSV</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">RFC 4180 Table</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`p-3 rounded-lg border text-center font-medium transition ${
                    exportFormat === 'json' ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">JSON</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Structured Data</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-lg border text-center font-medium transition ${
                    exportFormat === 'pdf' ? 'border-teal-500 bg-teal-500/10 text-teal-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">Summary JSON</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Executive Report</div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExecuteExport}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'Generating Export...' : `Export ${exportEntity.toUpperCase()} (${exportFormat.toUpperCase()})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER IP ASSET */}
      {/* ========================================================================= */}
      {isNewIpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Register Intellectual Property Asset</h3>
              <button onClick={() => setIsNewIpModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleCreateIp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Efficiency Perovskite Solar Cell Formulation"
                  value={newIpForm.title}
                  onChange={(e) => setNewIpForm({ ...newIpForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newIpForm.category}
                    onChange={(e) => setNewIpForm({ ...newIpForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="PATENT">Patent</option>
                    <option value="TRADEMARK">Trademark</option>
                    <option value="COPYRIGHT">Copyright</option>
                    <option value="INDUSTRIAL_DESIGN">Industrial Design</option>
                    <option value="TRADE_SECRET">Trade Secret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jurisdiction</label>
                  <select
                    value={newIpForm.jurisdiction}
                    onChange={(e) => setNewIpForm({ ...newIpForm, jurisdiction: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="US">United States (USPTO)</option>
                    <option value="EP">European Union (EPO)</option>
                    <option value="WO">International (WIPO/PCT)</option>
                    <option value="IN">India (IPO)</option>
                    <option value="JP">Japan (JPO)</option>
                    <option value="CN">China (CNIPA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Application Number</label>
                  <input
                    type="text"
                    placeholder="US17/842,910"
                    value={newIpForm.applicationNumber}
                    onChange={(e) => setNewIpForm({ ...newIpForm, applicationNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Patent / Grant Number</label>
                  <input
                    type="text"
                    placeholder="US11492042B2 (if granted)"
                    value={newIpForm.patentNumber}
                    onChange={(e) => setNewIpForm({ ...newIpForm, patentNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Inventors (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Dr. Sarah Connor, Alex Vance, Dr. Gordon"
                  value={newIpForm.inventors}
                  onChange={(e) => setNewIpForm({ ...newIpForm, inventors: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Technical Summary / Abstract</label>
                <textarea
                  rows="3"
                  placeholder="Summary of novel claims and experimental embodiments..."
                  value={newIpForm.description}
                  onChange={(e) => setNewIpForm({ ...newIpForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewIpModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SOP */}
      {/* ========================================================================= */}
      {isNewSopModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Author Standard Operating Procedure</h3>
              <button onClick={() => setIsNewSopModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleCreateSop} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SOP Identifier</label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. SOP-RD-001)"
                    value={newSopForm.sopIdentifier}
                    onChange={(e) => setNewSopForm({ ...newSopForm, sopIdentifier: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newSopForm.category}
                    onChange={(e) => setNewSopForm({ ...newSopForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="LAB_SAFETY">Lab Safety</option>
                    <option value="DATA_INTEGRITY">Data Integrity</option>
                    <option value="REGULATORY">Regulatory Compliance</option>
                    <option value="CLINICAL">Clinical / Bio-Safety</option>
                    <option value="QUALITY">Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">SOP Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hazardous Chemical Handling & Fume Hood Protocol"
                  value={newSopForm.title}
                  onChange={(e) => setNewSopForm({ ...newSopForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Regulatory Standard</label>
                <input
                  type="text"
                  placeholder="ISO 9001 / GLP / 21 CFR Part 11"
                  value={newSopForm.regulatoryStandard}
                  onChange={(e) => setNewSopForm({ ...newSopForm, regulatoryStandard: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scope & Purpose</label>
                <textarea
                  rows="3"
                  placeholder="Defines standard safety protocols, personal protective equipment requirements..."
                  value={newSopForm.description}
                  onChange={(e) => setNewSopForm({ ...newSopForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSopModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
                >
                  Create SOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GENERATE API KEY */}
      {/* ========================================================================= */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Generate Scoped API Key</h3>
              <button onClick={() => setIsNewKeyModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Application / Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Equipment IoT Ingestion / ERP Sync"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newKeyForm.rateLimitPerMin}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, rateLimitPerMin: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expiry (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newKeyForm.expiresAtDays}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, expiresAtDays: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Authorized Scopes</label>
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {['rd:read', 'rd:write', 'rd:export', 'rd:admin', 'gis:read', 'bfov:read', 'bfov:write'].map((scope) => {
                    const isChecked = newKeyForm.scopes.includes(scope);
                    return (
                      <label key={scope} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyForm({ ...newKeyForm, scopes: [...newKeyForm.scopes, scope] });
                            } else {
                              setNewKeyForm({ ...newKeyForm, scopes: newKeyForm.scopes.filter((s) => s !== scope) });
                            }
                          }}
                          className="rounded border-slate-700 text-teal-500 focus:ring-0"
                        />
                        <span className="font-mono text-[11px]">{scope}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPORT INCIDENT */}
      {/* ========================================================================= */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Report Deviation / Incident
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleRecordIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Severity Level</label>
                <select
                  value={incidentForm.severity}
                  onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="LOW">Low - Minor Observation</option>
                  <option value="MEDIUM">Medium - Procedural Deviation</option>
                  <option value="HIGH">High - Contamination / Safety Violation</option>
                  <option value="CRITICAL">Critical - Facility Halt / Regulatory Breach</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detail what occurred, equipment involved, and immediate findings..."
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Corrective Action Plan (CAPA)</label>
                <textarea
                  rows="2"
                  placeholder="Proposed containment, equipment recalibration, or re-training..."
                  value={incidentForm.correctiveAction}
                  onChange={(e) => setIncidentForm({ ...incidentForm, correctiveAction: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold transition"
                >
                  Log Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RdEnterpriseGovernance;

