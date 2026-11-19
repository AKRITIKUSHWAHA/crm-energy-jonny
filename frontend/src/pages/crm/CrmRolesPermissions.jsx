import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, Check, X, RotateCcw, Save, Search, Lock,
  Layers, Sparkles, Users, Target, Kanban, CheckSquare, MessageSquare,
  Boxes, UserCheck, LifeBuoy, BookOpen, MapPin, Bot, Mic, Video,
  Megaphone, Grid, FileText, Settings, LayoutDashboard, CheckCircle2,
  AlertTriangle, Info, Database, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import rolePermissionService from '../../services/rolePermissionService';
import {
  setDynamicRolePermissions,
  getDynamicRolePermissions,
  getDefaultRolePermissionsMatrix
} from '../../utils/rbac';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'business_owner',   name: 'Business Owner',   short: 'B.Owner',   subtitle: 'Executive Super Admin',         emoji: '👑', accent: '#6366f1' },
  { id: 'super_admin',      name: 'Super Admin',       short: 'S.Admin',   subtitle: 'Platform Root Governance',      emoji: '🛡️', accent: '#8b5cf6' },
  { id: 'crm_pro',          name: 'CRM Pro',           short: 'CRM Pro',   subtitle: 'High-Volume Sales Director',    emoji: '💼', accent: '#3b82f6' },
  { id: 'content_creator',  name: 'Content Creator',   short: 'Creator',   subtitle: 'Creative & Digital Assets',     emoji: '🎨', accent: '#ec4899' },
  { id: 'influencer',       name: 'Influencer',        short: 'Influencer',subtitle: 'Brand Partner & Deals',         emoji: '⭐', accent: '#f59e0b' },
  { id: 'ai_marketing_pro', name: 'AI Marketing Pro',  short: 'AI Mktg',  subtitle: 'Growth & Campaigns',            emoji: '🤖', accent: '#10b981' },
  { id: 'admin_1',          name: 'Admin Level 1',     short: 'Admin 1',   subtitle: 'Operations & Inbound Desk',     emoji: '🏢', accent: '#06b6d4' },
  { id: 'admin_2',          name: 'Admin Level 2',     short: 'Admin 2',   subtitle: 'Enterprise Operations Desk',    emoji: '🏛️', accent: '#14b8a6' },
  { id: 'customer',         name: 'Customer / Client', short: 'Customer',  subtitle: 'Self-Service Portal Vault',     emoji: '👤', accent: '#38bdf8' },
  { id: 'content_builder',  name: 'Content Builder',   short: 'Builder',   subtitle: 'Studio Production Suite',       emoji: '🎬', accent: '#a78bfa' },
  { id: 'affiliate_partner',name: 'Affiliate Partner', short: 'Affiliate', subtitle: 'Referral & Commission Desk',    emoji: '🤝', accent: '#fb923c' },
  { id: 'hr',               name: 'HR Officer',        short: 'HR',        subtitle: 'Talent, Recruiting & Ops',      emoji: '👥', accent: '#f43f5e' },
];

const NAV_CATALOG = [
  // Core CRM
  { id: 'dashboard',      label: 'Dashboard',           icon: LayoutDashboard, path: '/crm/dashboard',      section: 'Core CRM',           description: 'Real-time KPIs, pipeline analytics and activity stream' },
  { id: 'contacts',       label: 'Contacts',             icon: Users,           path: '/crm/contacts',       section: 'Core CRM',           description: 'Unified address book, customer profiles, and notes' },
  { id: 'leads',          label: 'Leads Directory',      icon: Target,          path: '/crm/leads',          section: 'Core CRM',           description: 'Prospect management, scoring, and inbound queue' },
  { id: 'pipeline',       label: 'Sales Pipeline',       icon: Kanban,          path: '/crm/pipeline',       section: 'Core CRM',           description: '8-stage visual deal boards and revenue projections' },
  { id: 'tasks',          label: 'Tasks & Reminders',    icon: CheckSquare,     path: '/crm/tasks',          section: 'Core CRM',           description: 'Task calendar, checklists, and automated reminders' },
  { id: 'communication',  label: 'Communication Hub',    icon: MessageSquare,   path: '/crm/communication',  section: 'Core CRM',           description: 'Central inbox, call context, and unified messaging' },
  { id: 'territory',      label: 'Territory Management', icon: MapPin,          path: '/crm/territory',      section: 'Core CRM',           description: 'Geographic sales quota, zoning, and rep allocation' },
  // Enterprise ERP
  { id: 'erp',            label: 'ERP & Operations',     icon: Boxes,           path: '/crm/erp',            section: 'Enterprise ERP',     description: 'Supply chain, inventory orders, and procurement ledger' },
  // AI SuperHouse
  { id: 'bestie',         label: 'Zunme AI Agent',       icon: Bot,             path: '/crm/bestie',         section: 'AI SuperHouse',      description: 'Natural language CRM intelligence and live assistant' },
  { id: 'ai-voice',       label: 'AI Voice Agent',       icon: Mic,             path: '/crm/ai-voice',       section: 'AI SuperHouse',      description: 'Real-time conversational voice caller and dispatcher' },
  { id: 'ai',             label: 'AI Content Studio',    icon: Sparkles,        path: '/crm/ai-studio',      section: 'AI SuperHouse',      description: 'Generative copywriting, marketing assets, and briefs' },
  { id: 'ai-video',       label: 'AI Video Agent',       icon: Video,           path: '/crm/ai-video',       section: 'AI SuperHouse',      description: 'AI avatar synthesis and personalized video generator' },
  { id: 'marketing',      label: 'AI Marketing Hub',     icon: Megaphone,       path: '/crm/marketing',      section: 'AI SuperHouse',      description: 'Automated multi-channel campaigns and ad spend ROI' },
  // Business Solutions
  { id: 'hr',             label: 'HR & Recruiting',      icon: UserCheck,       path: '/crm/hr',             section: 'Business Solutions', description: 'Hiring pipeline, employee profiles, and leave logs' },
  { id: 'support',        label: 'Customer Support',     icon: LifeBuoy,        path: '/crm/support',        section: 'Business Solutions', description: 'Customer ticketing system and SLA resolution desk' },
  { id: 'knowledge-base', label: 'Knowledge Base',       icon: BookOpen,        path: '/crm/knowledge-base', section: 'Business Solutions', description: 'SOPs, documentation, onboarding and technical articles' },
  { id: 'my-apps',        label: 'My Fav Apps',          icon: Grid,            path: '/crm/my-apps',        section: 'Business Solutions', description: 'Connected tools, third-party integrations and app grid' },
  // Governance & Data
  { id: 'search',            label: 'Internal AI Search',    icon: Search,       path: '/crm/search',            section: 'Governance & Data',  description: 'Fast global search across leads, deals, tickets, messages' },
  { id: 'reports',           label: 'Reports Hub',           icon: FileText,     path: '/crm/reports',           section: 'Governance & Data',  description: 'Executive revenue summaries and audit exports' },
  { id: 'admin',             label: 'Administration',        icon: ShieldCheck,  path: '/crm/admin',             section: 'Governance & Data',  description: 'Tenant provisioning, global defaults and system health' },
  { id: 'roles-permissions', label: 'Roles & Permissions',   icon: ShieldAlert,  path: '/crm/roles-permissions', section: 'Governance & Data',  description: 'Granular menu access control across all 12 platform roles' },
  { id: 'ebox',              label: 'Secured zBox (SEA)',    icon: Lock,         path: '/crm/ebox',              section: 'Governance & Data',  description: 'AES-256 encrypted peer vaults with SWMTP live bridge' },
  { id: 'settings',          label: 'Settings',              icon: Settings,     path: '/crm/settings',          section: 'Governance & Data',  description: 'System preferences, profile defaults, and theme options' },
];

const LOCKED_MODULES = ['dashboard', 'admin', 'roles-permissions', 'settings'];
const TOTAL = NAV_CATALOG.length;

const SECTION_COLORS = {
  'Core CRM':           { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  text: '#6366f1', dot: '#6366f1' },
  'Enterprise ERP':     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  text: '#d97706', dot: '#f59e0b' },
  'AI SuperHouse':      { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',  text: '#7c3aed', dot: '#8b5cf6' },
  'Business Solutions': { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  text: '#059669', dot: '#10b981' },
  'Governance & Data':  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',   text: '#dc2626', dot: '#ef4444' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const CrmRolesPermissions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeRole, setActiveRole] = useState('business_owner');
  const [matrix, setMatrix] = useState(() =>
    getDynamicRolePermissions() || getDefaultRolePermissionsMatrix()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbSynced, setDbSynced] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');

  // Load from MySQL on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await rolePermissionService.getPermissions();
        if (alive && res?.data && typeof res.data === 'object') {
          setMatrix(res.data);
          setDbSynced(!res.fromCache && !res.fromDefaults);
        }
      } catch (_) {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const activeIds = useMemo(() => matrix[activeRole] || [], [matrix, activeRole]);
  const isOn = (id) => activeIds.includes(id);
  const isLocked = (id) => (activeRole === 'business_owner' || activeRole === 'super_admin') && LOCKED_MODULES.includes(id);

  const toggle = (id) => {
    if (isLocked(id)) {
      addToast({ title: 'Safety Lock', message: `'${id}' is mandatory for executive roles.`, type: 'warning' });
      return;
    }
    setMatrix(prev => {
      const cur = prev[activeRole] ? [...prev[activeRole]] : [];
      return { ...prev, [activeRole]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
    });
    setDirty(true);
  };

  const selectAll = () => {
    setMatrix(prev => ({ ...prev, [activeRole]: NAV_CATALOG.map(m => m.id) }));
    setDirty(true);
  };

  const clearAll = () => {
    const keep = (activeRole === 'business_owner' || activeRole === 'super_admin') ? [...LOCKED_MODULES] : [];
    setMatrix(prev => ({ ...prev, [activeRole]: keep }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await rolePermissionService.bulkUpdatePermissions(matrix);
      if (res?.success) {
        setDirty(false);
        setDbSynced(true);
        window.dispatchEvent(new CustomEvent('crm-permissions-updated', { detail: matrix }));
        addToast({ title: 'Saved to MySQL ✓', message: 'Permissions applied live across all sessions.', type: 'success' });
      } else {
        throw new Error(res?.error || 'Save failed');
      }
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const resetDefaults = async () => {
    if (!window.confirm('Reset all 12 roles to enterprise baseline defaults?')) return;
    setSaving(true);
    try {
      const res = await rolePermissionService.resetToDefaults();
      if (res?.success && res?.data) {
        setMatrix(res.data);
        setDirty(false);
        window.dispatchEvent(new CustomEvent('crm-permissions-updated', { detail: res.data }));
        addToast({ title: 'Defaults Restored', message: 'Enterprise baseline applied to all 12 roles.', type: 'info' });
      }
    } catch (err) {
      addToast({ title: 'Reset Failed', message: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return NAV_CATALOG;
    const q = search.toLowerCase();
    return NAV_CATALOG.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.section.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(item => {
      if (!g[item.section]) g[item.section] = [];
      g[item.section].push(item);
    });
    return g;
  }, [filtered]);

  const roleDef = ROLES.find(r => r.id === activeRole) || ROLES[0];

  // ─── Styles (inline, using CSS vars for theme-safety) ────────────────────

  const s = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      width: '100%',
      maxWidth: '100%',
    },
    // Top header
    header: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '16px 20px',
      marginBottom: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    headerTop: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    iconBox: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: 'rgba(99,102,241,0.1)',
      border: '1px solid rgba(99,102,241,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    h1: {
      fontSize: '18px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      margin: 0,
      lineHeight: 1.3,
    },
    subtitle: {
      fontSize: '12px',
      color: 'var(--text-secondary)',
      marginTop: '2px',
    },
    dbBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 600,
      padding: '3px 8px',
      borderRadius: '999px',
      background: dbSynced ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.1)',
      color: dbSynced ? '#059669' : '#6366f1',
      border: `1px solid ${dbSynced ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
      marginTop: '4px',
      width: 'fit-content',
    },
    btnRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    },
    btnReset: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      background: 'var(--surface-secondary)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
      transition: 'all 160ms',
      whiteSpace: 'nowrap',
    },
    btnSave: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 18px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
      background: dirty ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#6366f1',
      color: '#fff',
      border: 'none',
      boxShadow: dirty ? '0 4px 16px rgba(99,102,241,0.4)' : 'none',
      transition: 'all 160ms',
      whiteSpace: 'nowrap',
    },
    // Dirty banner
    dirtyBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '10px',
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      fontSize: '12px',
      color: 'var(--warning, #d97706)',
    },
    // Main layout
    layout: {
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    },
    // Left sidebar
    sidebar: {
      width: '230px',
      minWidth: '230px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: '12px',
    },
    sidebarHeader: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sidebarTitle: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    },
    sidebarScroll: {
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 220px)',
      padding: '8px',
    },
    // Role item in sidebar
    roleItem: (isActive, accent) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '9px 10px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '3px',
      background: isActive ? `${accent}18` : 'transparent',
      border: `1px solid ${isActive ? `${accent}40` : 'transparent'}`,
      transition: 'all 140ms',
    }),
    roleEmoji: {
      fontSize: '16px',
      lineHeight: 1,
      flexShrink: 0,
    },
    roleInfo: {
      flex: 1,
      minWidth: 0,
    },
    roleName: (isActive, accent) => ({
      fontSize: '12.5px',
      fontWeight: isActive ? 700 : 500,
      color: isActive ? accent : 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
    }),
    roleSubtitle: {
      fontSize: '10.5px',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
    },
    countPill: (count, total) => ({
      fontSize: '10px',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '999px',
      flexShrink: 0,
      background: count === total
        ? 'rgba(16,185,129,0.12)' : count > 0
        ? 'rgba(99,102,241,0.1)' : 'var(--surface-secondary)',
      color: count === total
        ? '#059669' : count > 0
        ? '#6366f1' : 'var(--text-tertiary)',
      border: `1px solid ${count === total
        ? 'rgba(16,185,129,0.25)' : count > 0
        ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
      fontFamily: 'var(--font-mono)',
    }),
    // Right content
    right: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    // Role config card
    configCard: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
    },
    configHeader: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    },
    activeRoleChip: (accent) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: '999px',
      background: `${accent}15`,
      color: accent,
      border: `1px solid ${accent}35`,
    }),
    configTitle: {
      fontSize: '15px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      margin: '3px 0 0',
    },
    btnSmall: (danger = false) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: 600,
      cursor: 'pointer',
      background: 'var(--surface-secondary)',
      color: danger ? 'var(--error, #dc2626)' : 'var(--text-primary)',
      border: '1px solid var(--border)',
      transition: 'all 140ms',
      whiteSpace: 'nowrap',
    }),
    // Notice
    notice: (type) => ({
      margin: '12px 16px',
      padding: '10px 12px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '12px',
      lineHeight: '1.5',
      background: type === 'lock' ? 'rgba(99,102,241,0.07)' : 'var(--surface-secondary)',
      color: type === 'lock' ? '#6366f1' : 'var(--text-secondary)',
      border: `1px solid ${type === 'lock' ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
    }),
    // Search
    searchWrap: {
      margin: '0 16px 14px',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      padding: '9px 12px 9px 36px',
      borderRadius: '10px',
      fontSize: '13px',
      background: 'var(--surface-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 160ms',
    },
    searchIcon: {
      position: 'absolute',
      left: '11px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--text-tertiary)',
      pointerEvents: 'none',
    },
    // Section group
    sectionCard: (sectionName) => {
      const sc = SECTION_COLORS[sectionName] || { bg: 'var(--surface-secondary)', border: 'var(--border)', text: 'var(--text-secondary)', dot: 'var(--text-tertiary)' };
      return {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '10px',
      };
    },
    sectionHeader: (sectionName) => {
      const sc = SECTION_COLORS[sectionName] || { bg: 'transparent', border: 'var(--border)', text: 'var(--text-secondary)', dot: 'var(--text-tertiary)' };
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: sc.bg,
        borderBottom: `1px solid ${sc.border}`,
      };
    },
    sectionTitle: (sectionName) => {
      const sc = SECTION_COLORS[sectionName] || { text: 'var(--text-secondary)', dot: 'var(--text-tertiary)' };
      return {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: '12px',
        fontWeight: 700,
        color: sc.text,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      };
    },
    sectionDot: (sectionName) => {
      const sc = SECTION_COLORS[sectionName] || { dot: 'var(--text-tertiary)' };
      return { width: '7px', height: '7px', borderRadius: '50%', background: sc.dot, flexShrink: 0 };
    },
    sectionCount: {
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-mono)',
    },
    // Module grid
    moduleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1px',
      background: 'var(--border)',
    },
    // Module item
    moduleItem: (active, locked) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '11px 14px',
      cursor: locked ? 'not-allowed' : 'pointer',
      background: active ? 'rgba(99,102,241,0.05)' : 'var(--surface)',
      transition: 'background 140ms',
      position: 'relative',
      userSelect: 'none',
    }),
    checkbox: (active, locked) => ({
      width: '18px',
      height: '18px',
      borderRadius: '5px',
      border: `2px solid ${locked ? 'var(--text-tertiary)' : active ? '#6366f1' : 'var(--border-strong)'}`,
      background: active ? '#6366f1' : locked ? 'var(--surface-secondary)' : 'transparent',
      flexShrink: 0,
      marginTop: '1px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 140ms',
    }),
    moduleIcon: (active) => ({
      color: active ? '#6366f1' : 'var(--text-tertiary)',
      flexShrink: 0,
      marginTop: '1px',
      transition: 'color 140ms',
    }),
    moduleBody: {
      flex: 1,
      minWidth: 0,
    },
    moduleName: (active) => ({
      fontSize: '12.5px',
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      flexWrap: 'wrap',
    }),
    moduleDesc: {
      fontSize: '11px',
      color: 'var(--text-tertiary)',
      marginTop: '2px',
      lineHeight: 1.4,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    modulePath: {
      display: 'inline-block',
      marginTop: '5px',
      fontSize: '10px',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-tertiary)',
      background: 'var(--surface-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '5px',
      padding: '2px 6px',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    lockedTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '10px',
      fontWeight: 600,
      padding: '1px 6px',
      borderRadius: '4px',
      background: 'var(--surface-secondary)',
      color: 'var(--text-tertiary)',
      border: '1px solid var(--border)',
    },
    // Bottom bar
    bottomBar: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    },
    summaryText: {
      fontSize: '13px',
      color: 'var(--text-secondary)',
    },
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── TOP HEADER ── */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={s.headerLeft}>
            <div style={s.iconBox}>
              <ShieldAlert size={22} color="#6366f1" />
            </div>
            <div>
              <h1 style={s.h1}>Roles & Permissions Manager</h1>
              <div style={s.dbBadge}>
                <Database size={11} />
                {loading ? 'Syncing with MySQL...' : dbSynced ? 'MySQL Connected & Synced' : 'Live Sync Active'}
              </div>
            </div>
          </div>

          <div style={s.btnRow}>
            <button style={s.btnReset} onClick={resetDefaults} disabled={saving}>
              <RotateCcw size={13} />
              Reset Defaults
            </button>
            <button style={s.btnSave} onClick={save} disabled={saving}>
              <Save size={13} />
              {saving ? 'Saving...' : dirty ? 'Save Changes *' : 'Save Permissions'}
            </button>
          </div>
        </div>

        {/* Unsaved warning */}
        {dirty && (
          <div style={s.dirtyBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <AlertTriangle size={14} />
              <span>Unsaved changes — click <strong>Save Changes</strong> to persist to MySQL database.</span>
            </div>
            <button
              onClick={save}
              style={{ fontWeight: 700, fontSize: '12px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline' }}
            >
              Save Now
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN LAYOUT (Sidebar + Editor) ── */}
      <div style={s.layout}>

        {/* ── LEFT: 12-Role Selector Sidebar ── */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <span style={s.sidebarTitle}>Platform Roles</span>
            <span style={{ ...s.sidebarTitle, color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 'normal' }}>
              {ROLES.length} total
            </span>
          </div>
          <div style={s.sidebarScroll}>
            {ROLES.map(role => {
              const isActive = activeRole === role.id;
              const count = (matrix[role.id] || []).length;
              return (
                <div
                  key={role.id}
                  style={s.roleItem(isActive, role.accent)}
                  onClick={() => setActiveRole(role.id)}
                >
                  <span style={s.roleEmoji}>{role.emoji}</span>
                  <div style={s.roleInfo}>
                    <span style={s.roleName(isActive, role.accent)}>{role.name}</span>
                    <span style={s.roleSubtitle}>{role.subtitle}</span>
                  </div>
                  <span style={s.countPill(count, TOTAL)}>{count}/{TOTAL}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Permission Editor ── */}
        <div style={s.right}>

          {/* Role config header */}
          <div style={s.configCard}>
            <div style={s.configHeader}>
              <div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Configuring: </span>
                  <span style={s.activeRoleChip(roleDef.accent)}>
                    {roleDef.emoji} {roleDef.name} ({roleDef.id})
                  </span>
                </div>
                <div style={s.configTitle}>Navigation Menu Access Permissions</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button style={s.btnSmall(false)} onClick={selectAll}>Enable All ({TOTAL})</button>
                <button style={s.btnSmall(true)} onClick={clearAll}>Clear Optional</button>
              </div>
            </div>

            {/* Executive safety notice */}
            {(activeRole === 'business_owner' || activeRole === 'super_admin') ? (
              <div style={s.notice('lock')}>
                <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Executive Safety Lock Active:</strong> Critical modules (
                  {LOCKED_MODULES.join(', ')}) are permanently locked to prevent accidental platform lockout.
                </div>
              </div>
            ) : (
              <div style={s.notice('info')}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  Toggle which sidebar menus and routes this role can access. Changes apply instantly to the live sidebar and route guards when saved.
                </div>
              </div>
            )}

            {/* Search */}
            <div style={s.searchWrap}>
              <Search size={15} style={s.searchIcon} />
              <input
                type="text"
                placeholder="Search menus — leads, erp, bestie, ebox, pipeline..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={s.searchInput}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Module Sections */}
          {Object.keys(grouped).length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              No menus match "{search}"
            </div>
          ) : (
            Object.entries(grouped).map(([section, modules]) => {
              const activeInSection = modules.filter(m => isOn(m.id)).length;
              return (
                <div key={section} style={s.sectionCard(section)}>
                  {/* Section header */}
                  <div style={s.sectionHeader(section)}>
                    <div style={s.sectionTitle(section)}>
                      <span style={s.sectionDot(section)} />
                      {section}
                    </div>
                    <span style={s.sectionCount}>
                      {activeInSection} / {modules.length} Enabled
                    </span>
                  </div>

                  {/* 2-col module grid */}
                  <div style={s.moduleGrid}>
                    {modules.map(mod => {
                      const Icon = mod.icon;
                      const active = isOn(mod.id);
                      const locked = isLocked(mod.id);
                      return (
                        <div
                          key={mod.id}
                          style={s.moduleItem(active, locked)}
                          onClick={() => toggle(mod.id)}
                        >
                          {/* Checkbox */}
                          <div style={s.checkbox(active, locked)}>
                            {(active || locked) && <Check size={11} strokeWidth={3} color="#fff" />}
                          </div>

                          {/* Icon */}
                          <div style={s.moduleIcon(active)}>
                            <Icon size={15} />
                          </div>

                          {/* Text */}
                          <div style={s.moduleBody}>
                            <div style={s.moduleName(active)}>
                              <span>{mod.label}</span>
                              {locked && (
                                <span style={s.lockedTag}>
                                  <Lock size={9} />
                                  Locked
                                </span>
                              )}
                            </div>
                            <div style={s.moduleDesc}>{mod.description}</div>
                            <span style={s.modulePath}>{mod.path}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom summary bar */}
          <div style={s.bottomBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span style={s.summaryText}>
                <strong style={{ color: 'var(--text-primary)' }}>{activeIds.length} of {TOTAL}</strong> menus enabled for{' '}
                <strong style={{ color: roleDef.accent }}>{roleDef.name}</strong>
              </span>
            </div>
            <button style={s.btnSave} onClick={save} disabled={saving}>
              <Save size={14} />
              {saving ? 'Synchronizing...' : 'Save & Apply Live'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmRolesPermissions;
