import {
  LayoutDashboard,
  Users,
  Target,
  Kanban,
  CheckSquare,
  MessageSquare,
  Boxes,
  UserCheck,
  LifeBuoy,
  Sparkles,
  ShieldCheck,
  Settings,
  DollarSign,
  Landmark,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  History,
  BookOpen,
  MapPin,
  Bot,
  Mic,
  Video,
  Megaphone,
  Grid,
  Search,
  Car,
  Lock,
  ShieldAlert,
  FlaskConical,
  Layers,
  Compass,
  Lightbulb,
  Award,
  Workflow
} from 'lucide-react';

export const crmNavigation = [
  // Core Modules
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/crm/dashboard', section: 'Core CRM' },
  { id: 'contacts', label: 'Contacts', icon: Users, path: '/crm/contacts', section: 'Core CRM' },
  { id: 'leads', label: 'Leads Directory', icon: Target, path: '/crm/leads', section: 'Core CRM' },
  { id: 'pipeline', label: 'Sales Pipeline', icon: Kanban, path: '/crm/pipeline', section: 'Core CRM' },
  { id: 'tasks', label: 'Tasks & Reminders', icon: CheckSquare, path: '/crm/tasks', section: 'Core CRM' },
  { id: 'communication', label: 'Communication Hub', icon: MessageSquare, path: '/crm/communication', section: 'Core CRM' },
  { id: 'territory', label: 'Territory Management', icon: MapPin, path: '/crm/territory', section: 'Core CRM' },

  // Enterprise ERP
  { id: 'erp', label: 'ERP & Operations', icon: Boxes, path: '/crm/erp', section: 'Enterprise ERP' },

  // EgoLytics R&D Management Division
  { id: 'rd-workspace', label: 'EgoLytics R&D Hub', icon: FlaskConical, path: '/crm/rd', section: 'EgoLytics R&D' },
  { id: 'rd-tasks', label: 'R&D Tasks & Sprints', icon: CheckSquare, path: '/crm/rd/tasks', section: 'EgoLytics R&D' },
  { id: 'rd-stagegate', label: 'Stage-Gate Governance', icon: Workflow, path: '/crm/rd/stagegate', section: 'EgoLytics R&D' },
  { id: 'rd-ideas', label: 'Idea Management', icon: Lightbulb, path: '/crm/rd/ideas', section: 'EgoLytics R&D' },
  { id: 'rd-ranking', label: 'Idea Leaderboard', icon: Award, path: '/crm/rd/ranking', section: 'EgoLytics R&D' },
  { id: 'rd-pipeline', label: 'Innovation Pipeline', icon: TrendingUp, path: '/crm/rd/pipeline', section: 'EgoLytics R&D' },
  { id: 'rd-portfolio', label: 'R&D Portfolio', icon: Layers, path: '/crm/rd/portfolio', section: 'EgoLytics R&D' },
  { id: 'rd-intake', label: 'Project Intake', icon: Boxes, path: '/crm/rd/intake', section: 'EgoLytics R&D' },
  { id: 'rd-strategy', label: 'Strategic Alignment', icon: Compass, path: '/crm/rd/strategy', section: 'EgoLytics R&D' },
  { id: 'rd-prioritization', label: 'Prioritization Engine', icon: Sparkles, path: '/crm/rd/prioritization', section: 'EgoLytics R&D' },

  // AI SuperHouse
  { id: 'bestie', label: 'Zunme AI Agent', icon: Bot, path: '/crm/bestie', section: 'AI SuperHouse' },
  { id: 'ai-voice', label: 'AI Voice Agent', icon: Mic, path: '/crm/ai-voice', section: 'AI SuperHouse' },
  { id: 'ai', label: 'AI Content Studio', icon: Sparkles, path: '/crm/ai-studio', section: 'AI SuperHouse' },
  { id: 'ai-video', label: 'AI Video Agent', icon: Video, path: '/crm/ai-video', section: 'AI SuperHouse' },
  { id: 'marketing', label: 'AI Marketing Hub', icon: Megaphone, path: '/crm/marketing', section: 'AI SuperHouse' },


  // Business Solutions
  { id: 'hr', label: 'HR & Recruiting', icon: UserCheck, path: '/crm/hr', section: 'Business Solutions' },
  { id: 'support', label: 'Customer Support', icon: LifeBuoy, path: '/crm/support', section: 'Business Solutions' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, path: '/crm/knowledge-base', section: 'Business Solutions' },
  { id: 'my-apps', label: 'My Fav Apps', icon: Grid, path: '/crm/my-apps', section: 'Business Solutions' },

  // Governance & Intelligence
  { id: 'search', label: 'Internal AI Search', icon: Search, path: '/crm/search', section: 'Governance & Data' },
  { id: 'reports', label: 'Reports Hub', icon: FileText, path: '/crm/reports', section: 'Governance & Data' },
  { id: 'admin', label: 'Administration', icon: ShieldCheck, path: '/crm/admin', section: 'Governance & Data' },
  { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldAlert, path: '/crm/roles-permissions', section: 'Governance & Data' },
  { id: 'ebox', label: 'Secured zBox (SEA)', icon: Lock, path: '/crm/ebox', section: 'Governance & Data' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/crm/settings', section: 'Governance & Data' },
];

export const oalNavigation = [
  // Borrower Persona Links
  { id: 'borrower-dashboard', label: 'Borrower Overview', icon: LayoutDashboard, path: '/oal/borrower/dashboard', section: 'Borrower Portal' },
  { id: 'borrower-kyc', label: 'KYC Vault', icon: ShieldCheck, path: '/oal/borrower/kyc', section: 'Borrower Portal' },
  { id: 'borrower-app', label: 'Loan Application', icon: FileText, path: '/oal/borrower/application', section: 'Borrower Portal' },
  { id: 'borrower-offers', label: 'Lender Offers', icon: CreditCard, path: '/oal/borrower/offers', section: 'Borrower Portal' },
  { id: 'borrower-score', label: 'AI Risk Rating', icon: Sparkles, path: '/oal/borrower/score', section: 'Borrower Portal' },
  { id: 'borrower-messages', label: 'Messages & Agent Chat', icon: MessageSquare, path: '/oal/borrower/messages', section: 'Borrower Portal' },

  // Lender Persona Links
  { id: 'lender-dashboard', label: 'Lender Portal', icon: Landmark, path: '/oal/lender/dashboard', section: 'Institutional Lender' },
  { id: 'lender-leads', label: 'Qualified Leads Pool', icon: Target, path: '/oal/lender/leads', section: 'Institutional Lender' },
  { id: 'lender-applications', label: 'Active Underwriting', icon: FileText, path: '/oal/lender/applications', section: 'Institutional Lender' },
  { id: 'lender-offers', label: 'Term Sheets Manager', icon: CreditCard, path: '/oal/lender/offers', section: 'Institutional Lender' },

  // OAL Rep Persona Links
  { id: 'rep-dashboard', label: 'OAL Agent Desk', icon: UserCheck, path: '/oal/rep/dashboard', section: 'OAL Licensed Agent' },
  { id: 'rep-borrowers', label: 'Borrower Queue', icon: Users, path: '/oal/rep/borrowers', section: 'OAL Licensed Agent' },

  // Master Admin Links
  { id: 'admin-dashboard', label: 'Platform Admin', icon: ShieldCheck, path: '/oal/admin/dashboard', section: 'Master Governance' },
  { id: 'admin-lenders', label: 'Lender Governance', icon: Building2, path: '/oal/admin/lenders', section: 'Master Governance' },
  { id: 'admin-scoring', label: 'AI Scoring Config', icon: TrendingUp, path: '/oal/admin/scoring', section: 'Master Governance' },
  { id: 'admin-support', label: 'AI Support Desk', icon: LifeBuoy, path: '/oal/admin/support', section: 'Master Governance' },
  { id: 'admin-audit', label: 'Audit Log Feed', icon: History, path: '/oal/admin/audit', section: 'Master Governance' },
];
