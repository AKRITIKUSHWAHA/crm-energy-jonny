import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
  Save,
  Search,
  Lock,
  Layers,
  Sparkles,
  Users,
  Target,
  Kanban,
  CheckSquare,
  MessageSquare,
  Boxes,
  UserCheck,
  LifeBuoy,
  BookOpen,
  MapPin,
  Bot,
  Mic,
  Video,
  Megaphone,
  Grid,
  FileText,
  Settings,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import rolePermissionService from '../../services/rolePermissionService';
import {
  setDynamicRolePermissions,
  getDynamicRolePermissions,
  getDefaultRolePermissionsMatrix
} from '../../utils/rbac';

// 12 Standard Platform Roles
const ROLE_DEFINITIONS = [
  { id: 'business_owner', name: 'Business Owner', subtitle: 'Executive Super Admin', tag: 'Executive', color: 'indigo' },
  { id: 'super_admin', name: 'Super Admin', subtitle: 'Platform Root Governance', tag: 'Root', color: 'purple' },
  { id: 'crm_pro', name: 'CRM Pro', subtitle: 'High-Volume Sales Director', tag: 'Sales', color: 'blue' },
  { id: 'content_creator', name: 'Content Creator', subtitle: 'Creative & Digital Assets', tag: 'Media', color: 'pink' },
  { id: 'influencer', name: 'Influencer', subtitle: 'Brand Partner & Deals', tag: 'Partner', color: 'amber' },
  { id: 'ai_marketing_pro', name: 'AI Marketing Pro', subtitle: 'Growth & Campaigns', tag: 'Marketing', color: 'emerald' },
  { id: 'admin_1', name: 'Admin Level 1', subtitle: 'Operations & Inbound Desk', tag: 'Ops', color: 'cyan' },
  { id: 'admin_2', name: 'Admin Level 2', subtitle: 'Enterprise Operations Desk', tag: 'Ops', color: 'teal' },
  { id: 'customer', name: 'Customer / Client', subtitle: 'Self-Service Vault', tag: 'Portal', color: 'sky' },
  { id: 'content_builder', name: 'Content Builder', subtitle: 'Studio Production Suite', tag: 'Studio', color: 'violet' },
  { id: 'affiliate_partner', name: 'Affiliate Partner', subtitle: 'Referral & Commission Desk', tag: 'Affiliate', color: 'orange' },
  { id: 'hr', name: 'HR Officer', subtitle: 'Talent, Recruiting & Ops', tag: 'HR', color: 'rose' }
];

// All 23 Business Owner Navigation Menus Grouped by Section
const CRM_NAV_CATALOG = [
  // Core CRM
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/crm/dashboard', section: 'Core CRM', description: 'Real-time KPIs, pipeline analytics and activity stream' },
  { id: 'contacts', label: 'Contacts', icon: Users, path: '/crm/contacts', section: 'Core CRM', description: 'Unified address book, customer profiles, and notes' },
  { id: 'leads', label: 'Leads Directory', icon: Target, path: '/crm/leads', section: 'Core CRM', description: 'Prospect management, scoring, and inbound queue' },
  { id: 'pipeline', label: 'Sales Pipeline', icon: Kanban, path: '/crm/pipeline', section: 'Core CRM', description: '8-stage visual deal boards and revenue projections' },
  { id: 'tasks', label: 'Tasks & Reminders', icon: CheckSquare, path: '/crm/tasks', section: 'Core CRM', description: 'Task calendar, checklists, and automated reminders' },
  { id: 'communication', label: 'Communication Hub', icon: MessageSquare, path: '/crm/communication', section: 'Core CRM', description: 'Central inbox, call context, and unified messaging' },
  { id: 'territory', label: 'Territory Management', icon: MapPin, path: '/crm/territory', section: 'Core CRM', description: 'Geographic sales quota, zoning, and rep allocation' },

  // Enterprise ERP
  { id: 'erp', label: 'ERP & Operations', icon: Boxes, path: '/crm/erp', section: 'Enterprise ERP', description: 'Supply chain, inventory orders, and procurement ledger' },

  // AI SuperHouse
  { id: 'bestie', label: 'Zunme AI Agent', icon: Bot, path: '/crm/bestie', section: 'AI SuperHouse', description: 'Natural language CRM intelligence and live assistant' },
  { id: 'ai-voice', label: 'AI Voice Agent', icon: Mic, path: '/crm/ai-voice', section: 'AI SuperHouse', description: 'Real-time conversational voice caller and dispatcher' },
  { id: 'ai', label: 'AI Content Studio', icon: Sparkles, path: '/crm/ai-studio', section: 'AI SuperHouse', description: 'Generative copywriting, marketing assets, and briefs' },
  { id: 'ai-video', label: 'AI Video Agent', icon: Video, path: '/crm/ai-video', section: 'AI SuperHouse', description: 'AI avatar synthesis and personalized video generator' },
  { id: 'marketing', label: 'AI Marketing Hub', icon: Megaphone, path: '/crm/marketing', section: 'AI SuperHouse', description: 'Automated multi-channel campaigns and ad spend ROI' },

  // Business Solutions
  { id: 'hr', label: 'HR & Recruiting', icon: UserCheck, path: '/crm/hr', section: 'Business Solutions', description: 'Hiring pipeline, employee profiles, and leave logs' },
  { id: 'support', label: 'Customer Support', icon: LifeBuoy, path: '/crm/support', section: 'Business Solutions', description: 'Customer ticketing system and SLA resolution desk' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, path: '/crm/knowledge-base', section: 'Business Solutions', description: 'SOPs, documentation, onboarding and technical articles' },
  { id: 'my-apps', label: 'My Fav Apps', icon: Grid, path: '/crm/my-apps', section: 'Business Solutions', description: 'Connected tools, third-party integrations and app grid' },

  // Governance & Data
  { id: 'search', label: 'Internal AI Search', icon: Search, path: '/crm/search', section: 'Governance & Data', description: 'Fast search across leads, deals, tickets and messages' },
  { id: 'reports', label: 'Reports Hub', icon: FileText, path: '/crm/reports', section: 'Governance & Data', description: 'Executive revenue summaries and audit exports' },
  { id: 'admin', label: 'Administration', icon: ShieldCheck, path: '/crm/admin', section: 'Governance & Data', description: 'Tenant provisioning, global defaults and system health' },
  { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldAlert, path: '/crm/roles-permissions', section: 'Governance & Data', description: 'Granular menu access control across all 12 platform roles' },
  { id: 'ebox', label: 'Secured zBox (SEA)', icon: Lock, path: '/crm/ebox', section: 'Governance & Data', description: 'AES-256 encrypted peer vaults with SWMTP live bridge' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/crm/settings', section: 'Governance & Data', description: 'System preferences, profile defaults, and theme options' }
];

// Safety locked modules for executive accounts to avoid accidental lockout
const MANDATORY_EXECUTIVE_MODULES = ['dashboard', 'admin', 'roles-permissions', 'settings'];

export const CrmRolesPermissions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeRole, setActiveRole] = useState('business_owner');
  // Initialize immediately from cached permissions or computed defaults (Zero Delay)
  const [permissionsMatrix, setPermissionsMatrix] = useState(() => {
    return getDynamicRolePermissions() || getDefaultRolePermissionsMatrix();
  });

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with MySQL on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMatrix = async () => {
      setLoading(true);
      try {
        const res = await rolePermissionService.getPermissions();
        if (isMounted && res?.data && typeof res.data === 'object') {
          setPermissionsMatrix(res.data);
          setIsDbConnected(true);
        }
      } catch (err) {
        console.warn('[CrmRolesPermissions] Syncing with local cache:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatrix();
    return () => {
      isMounted = false;
    };
  }, []);

  // Allowed nav IDs for active role
  const activeNavIds = useMemo(() => {
    return permissionsMatrix[activeRole] || [];
  }, [permissionsMatrix, activeRole]);

  // Is module toggled
  const isModuleActive = (navId) => {
    return activeNavIds.includes(navId);
  };

  // Is module locked/mandatory for this role
  const isModuleLocked = (navId) => {
    if (activeRole === 'business_owner' || activeRole === 'super_admin') {
      return MANDATORY_EXECUTIVE_MODULES.includes(navId);
    }
    return false;
  };

  // Toggle individual module permission
  const handleToggleModule = (navId) => {
    if (isModuleLocked(navId)) {
      addToast({
        title: 'Safety Lock Active',
        message: `The '${navId}' module is mandatory for ${activeRole} to prevent accidental platform lockout.`,
        type: 'warning'
      });
      return;
    }

    setPermissionsMatrix((prev) => {
      const currentList = prev[activeRole] ? [...prev[activeRole]] : [];
      let updated;
      if (currentList.includes(navId)) {
        updated = currentList.filter((id) => id !== navId);
      } else {
        updated = [...currentList, navId];
      }
      return {
        ...prev,
        [activeRole]: updated
      };
    });
    setHasUnsavedChanges(true);
  };

  // Select all modules for active role
  const handleSelectAll = () => {
    const allIds = CRM_NAV_CATALOG.map((m) => m.id);
    setPermissionsMatrix((prev) => ({
      ...prev,
      [activeRole]: allIds
    }));
    setHasUnsavedChanges(true);
    addToast({
      title: 'All Menus Enabled',
      message: `Enabled all 23 navigation modules for ${activeRole}.`,
      type: 'info'
    });
  };

  // Deselect all non-mandatory modules
  const handleDeselectAll = () => {
    let remaining = [];
    if (activeRole === 'business_owner' || activeRole === 'super_admin') {
      remaining = [...MANDATORY_EXECUTIVE_MODULES];
    }
    setPermissionsMatrix((prev) => ({
      ...prev,
      [activeRole]: remaining
    }));
    setHasUnsavedChanges(true);
    addToast({
      title: 'Menus Cleared',
      message: `Cleared selectable menu access for ${activeRole}.`,
      type: 'info'
    });
  };

  // Save changes to MySQL Database and broadcast to sidebar
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await rolePermissionService.bulkUpdatePermissions(permissionsMatrix);
      if (res?.success) {
        setHasUnsavedChanges(false);
        setIsDbConnected(true);
        // Dispatch instant event to update live Sidebar and Drawer without browser reload
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm-permissions-updated', { detail: permissionsMatrix }));
        }
        addToast({
          title: 'Permissions Synchronized',
          message: 'Saved updated role permissions to MySQL and refreshed active session in real-time.',
          type: 'success'
        });
      } else {
        throw new Error(res?.error || res?.message || 'Failed to persist changes');
      }
    } catch (err) {
      addToast({
        title: 'Save Failed',
        message: err.message || 'Error communicating with backend database.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to system baseline defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to restore baseline enterprise role permissions for all 12 roles? Custom changes will be reset.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await rolePermissionService.resetToDefaults();
      if (res?.success && res?.data) {
        setPermissionsMatrix(res.data);
        setHasUnsavedChanges(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm-permissions-updated', { detail: res.data }));
        }
        addToast({
          title: 'Defaults Restored',
          message: 'Restored baseline enterprise permission matrix across all 12 roles.',
          type: 'info'
        });
      }
    } catch (err) {
      addToast({
        title: 'Reset Failed',
        message: err.message || 'Could not reset default permissions.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter modules based on search input
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return CRM_NAV_CATALOG;
    const q = searchQuery.toLowerCase();
    return CRM_NAV_CATALOG.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.section.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group filtered modules by section
  const groupedModules = useMemo(() => {
    const groups = {};
    filteredCatalog.forEach((item) => {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    });
    return groups;
  }, [filteredCatalog]);

  const activeRoleDef = ROLE_DEFINITIONS.find((r) => r.id === activeRole) || ROLE_DEFINITIONS[0];

  return (
    <div className="flex flex-col gap-5 w-full max-w-full pb-16">
      {/* Breadcrumb & Navigation Path */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>CRM nErgy AI</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>Governance & Data</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-200 font-semibold">Roles & Permissions Hub</span>
      </div>

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Roles & Permissions Manager
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium">
                  <Database className="w-3 h-3" />
                  {isDbConnected ? 'MySQL Connected' : 'Live Sync Active'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Configure menu visibility for all 12 platform login roles. Permissions apply instantly to the sidebar, mobile drawer, and route guards.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <button
              onClick={handleResetDefaults}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Reset Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving to Database...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Permissions'}
            </button>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>You have unsaved changes in the permission matrix. Click "Save Permissions" to persist to MySQL database.</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-bold underline text-amber-900 dark:text-amber-300 hover:text-amber-700"
            >
              Save Now
            </button>
          </div>
        )}
      </div>

      {/* Mobile / Tablet Horizontal Role Swipeable Bar (< 1024px) */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Role (12 Roles)
          </span>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 font-mono">
            {activeRoleDef.name} ({activeNavIds.length}/23)
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {ROLE_DEFINITIONS.map((role) => {
            const isSelected = activeRole === role.id;
            const count = (permissionsMatrix[role.id] || []).length;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>{role.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 12 Roles Selector Rail (Desktop >= 1024px) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Platform Login Roles
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">12 Total</span>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {ROLE_DEFINITIONS.map((role) => {
                const isSelected = activeRole === role.id;
                const count = (permissionsMatrix[role.id] || []).length;
                const total = CRM_NAV_CATALOG.length;

                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/50 shadow-xs ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-indigo-950 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {role.name}
                        </span>
                        {role.id === 'business_owner' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {role.subtitle}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium border ${
                          count === total
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : count > 0
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {count}/{total}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Role Menu Permission Editor */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Role Control & Search Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                    Configuring:
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                    {activeRoleDef.name} ({activeRoleDef.id})
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Navigation Menu Access Permissions
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                >
                  Enable All (23)
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                >
                  Clear Optional
                </button>
              </div>
            </div>

            {/* Role Notice / Safety Lock Info */}
            {activeRole === 'business_owner' || activeRole === 'super_admin' ? (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-300 text-xs">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                    Executive Safety Protocol Active:
                  </span>{' '}
                  Critical governance modules ({MANDATORY_EXECUTIVE_MODULES.join(', ')}) are permanently locked to ensure executive accounts cannot be locked out of platform administration.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs">
                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  Select which sidebar menus and platform routes this role can access. Menus toggled off here are immediately hidden from the sidebar and blocked by route guards.
                </div>
              </div>
            )}

            {/* Search Filter Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menus (e.g. leads, erp, bestie, ebox, hr, pipeline)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grouped Modules Checklists */}
          <div className="space-y-4">
            {Object.keys(groupedModules).length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">No menus match your search query: "{searchQuery}"</p>
              </div>
            ) : (
              Object.entries(groupedModules).map(([sectionName, modules]) => {
                const sectionActiveCount = modules.filter((m) => isModuleActive(m.id)).length;
                return (
                  <div
                    key={sectionName}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                          {sectionName}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                        {sectionActiveCount} of {modules.length} Enabled
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {modules.map((mod) => {
                        const IconComponent = mod.icon;
                        const active = isModuleActive(mod.id);
                        const locked = isModuleLocked(mod.id);

                        return (
                          <div
                            key={mod.id}
                            onClick={() => !locked && handleToggleModule(mod.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 relative ${
                              active
                                ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 shadow-xs'
                                : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                            } ${locked ? 'cursor-not-allowed opacity-90' : ''}`}
                          >
                            {/* Checkbox Icon */}
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition-colors flex-shrink-0 ${
                                active
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent'
                              } ${locked ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300' : ''}`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>

                            {/* Module Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <IconComponent
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    active
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                />
                                <span
                                  className={`text-xs sm:text-sm font-semibold truncate ${
                                    active
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {mod.label}
                                </span>
                                {locked && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1 font-mono">
                                    <Lock className="w-2.5 h-2.5" /> Locked
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {mod.description}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                  {mod.path}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Summary & Save Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                <strong className="text-slate-900 dark:text-white">{activeNavIds.length} of {CRM_NAV_CATALOG.length}</strong> menus enabled for{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">{activeRoleDef.name}</strong>.
              </span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Synchronizing with MySQL...' : 'Save & Apply Live'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmRolesPermissions;
