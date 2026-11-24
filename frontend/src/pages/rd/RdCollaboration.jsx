import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  Calendar,
  Bell,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Pin,
  Edit2,
  Trash2,
  Paperclip,
  Smile,
  Hash,
  User,
  Shield,
  Link as LinkIcon,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox,
  CornerDownRight,
  Video,
  MapPin,
  Check,
  X,
  Radio,
  FileText,
  Sliders,
  CheckSquare
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  KPICard,
  Tabs,
  Modal
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { ContextCommentPanel } from './components/ContextCommentPanel';

export const RdCollaboration = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  // Active top-level sub-view: 'discussions' | 'comments' | 'calendar' | 'notifications' | 'integrations'
  const [activeTab, setActiveTab] = useState('discussions');

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeThreadParent, setActiveThreadParent] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [threadInput, setThreadInput] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [conversationFilter, setConversationFilter] = useState('ALL'); // 'ALL' | 'CHANNELS' | 'DIRECT'

  // Users Directory & Projects for Pickers
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Modals
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvData, setNewConvData] = useState({
    type: 'PROJECT_CHANNEL',
    title: '',
    topic: '',
    projectId: '',
    isPrivate: false,
    participantUserIds: [],
  });

  // Calendar States
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'agenda'
  const [calendarFilter, setCalendarFilter] = useState('ALL');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    eventType: 'PROJECT_MEETING',
    projectId: '',
    location: '',
    meetingUrl: '',
    startTime: '',
    endTime: '',
    participantUserIds: [],
  });
  const [detectedConflicts, setDetectedConflicts] = useState([]);

  // Notifications States
  const [notifications, setNotifications] = useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'MENTIONS'
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    mentionNotifications: true,
    calendarNotifications: true,
    slackSync: false,
    teamsSync: false,
  });

  // Integrations States
  const [integrations, setIntegrations] = useState([]);
  const [integrationLogs, setIntegrationLogs] = useState([]);
  const [activeConfigModal, setActiveConfigModal] = useState(null); // 'SLACK' | 'TEAMS' | null
  const [configForm, setConfigForm] = useState({
    name: '',
    webhookUrl: '',
    channel: '#rd-general',
    events: {
      PROJECT_CREATED: true,
      STAGE_GATE_SUBMITTED: true,
      TASK_OVERDUE: true,
      DECISION_RECORDED: true,
    },
  });

  // Contextual Comments Tab States
  const [contextRecordType, setContextRecordType] = useState('TASK');
  const [contextRecordId, setContextRecordId] = useState('task-sample-01');

  // ----------------------------------------------------------------------------
  // INITIAL FETCHES
  // ----------------------------------------------------------------------------

  const fetchBaselineDirectory = useCallback(async () => {
    try {
      const [usersRes, projRes, notifRes, intgRes] = await Promise.all([
        apiClient.get('/users').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/portfolio').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/collaboration/notifications').catch(() => ({ success: false, data: [] })),
        apiClient.get('/rd/collaboration/integrations').catch(() => ({ success: false, data: [] })),
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setDirectoryUsers(usersRes.data);
      }
      if (projRes.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);
      }
      if (notifRes.success) {
        setNotifications(notifRes.items || notifRes.data || []);
        setNotifUnreadCount(notifRes.pagination?.unreadCount || 0);
      }
      if (intgRes.success && Array.isArray(intgRes.data)) {
        setIntegrations(intgRes.data);
      }
    } catch (err) {
      console.error('[RdCollaboration] Baseline fetch error:', err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/rd/collaboration/conversations', {
        search: messageSearch || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
        // Automatically select first conversation if none selected
        if (!activeConversation && res.data.length > 0) {
          setActiveConversation(res.data[0]);
        }
      }
    } catch (err) {
      console.error('[RdCollaboration] Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  }, [messageSearch, activeConversation]);

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const res = await apiClient.get(`/rd/collaboration/conversations/${convId}/messages`);
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('[RdCollaboration] Fetch messages error:', err);
    }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const res = await apiClient.get('/rd/collaboration/calendar/events', {
        eventType: calendarFilter !== 'ALL' ? calendarFilter : undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setCalendarEvents(res.data);
      }
    } catch (err) {
      console.error('[RdCollaboration] Fetch calendar error:', err);
    }
  }, [calendarFilter]);

  const fetchIntegrationData = useCallback(async () => {
    try {
      const [intgRes, logsRes] = await Promise.all([
        apiClient.get('/rd/collaboration/integrations'),
        apiClient.get('/rd/collaboration/integrations/logs'),
      ]);
      if (intgRes.success && Array.isArray(intgRes.data)) setIntegrations(intgRes.data);
      if (logsRes.success && Array.isArray(logsRes.data)) setIntegrationLogs(logsRes.data);
    } catch (err) {
      console.error('[RdCollaboration] Fetch integrations error:', err);
    }
  }, []);

  useEffect(() => {
    fetchBaselineDirectory();
    fetchConversations();
  }, [fetchBaselineDirectory, fetchConversations]);

  useEffect(() => {
    if (activeConversation?.id) {
      fetchMessages(activeConversation.id);
      setActiveThreadParent(null);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    if (activeTab === 'calendar') fetchCalendarEvents();
    if (activeTab === 'integrations') fetchIntegrationData();
  }, [activeTab, fetchCalendarEvents, fetchIntegrationData]);

  // ----------------------------------------------------------------------------
  // CONVERSATION ACTIONS
  // ----------------------------------------------------------------------------

  const handleCreateConversation = async () => {
    if (!newConvData.title.trim()) {
      addToast({ title: 'Validation Error', message: 'Channel or discussion title is required.', type: 'warning' });
      return;
    }

    try {
      const res = await apiClient.post('/rd/collaboration/conversations', newConvData);
      if (res.success) {
        addToast({ title: 'Conversation Created', message: `${res.data.title} is now active.`, type: 'success' });
        setShowNewConvModal(false);
        setNewConvData({
          type: 'PROJECT_CHANNEL',
          title: '',
          topic: '',
          projectId: '',
          isPrivate: false,
          participantUserIds: [],
        });
        await fetchConversations();
        setActiveConversation(res.data);
      }
    } catch (err) {
      addToast({ title: 'Creation Failed', message: err.message, type: 'error' });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    const payload = {
      content: messageInput.trim(),
      messageType: 'TEXT',
    };

    try {
      const res = await apiClient.post(`/rd/collaboration/conversations/${activeConversation.id}/messages`, payload);
      if (res.success) {
        setMessageInput('');
        fetchMessages(activeConversation.id);
      }
    } catch (err) {
      addToast({ title: 'Message Failed', message: err.message, type: 'error' });
    }
  };

  const handleSendThreadReply = async () => {
    if (!threadInput.trim() || !activeConversation || !activeThreadParent) return;

    try {
      const res = await apiClient.post(`/rd/collaboration/conversations/${activeConversation.id}/messages`, {
        content: threadInput.trim(),
        parentMessageId: activeThreadParent.id,
      });
      if (res.success) {
        setThreadInput('');
        fetchMessages(activeConversation.id);
        // Refresh replies
        const replyRes = await apiClient.get(`/rd/collaboration/conversations/${activeConversation.id}/messages`, {
          parentMessageId: activeThreadParent.id,
        });
        if (replyRes.success && Array.isArray(replyRes.messages)) {
          setThreadReplies(replyRes.messages);
        }
      }
    } catch (err) {
      addToast({ title: 'Reply Failed', message: err.message, type: 'error' });
    }
  };

  const openThread = async (msg) => {
    setActiveThreadParent(msg);
    try {
      const res = await apiClient.get(`/rd/collaboration/conversations/${activeConversation.id}/messages`, {
        parentMessageId: msg.id,
      });
      if (res.success && Array.isArray(res.messages)) {
        setThreadReplies(res.messages);
      }
    } catch {
      setThreadReplies([]);
    }
  };

  const handlePinMessage = async (msgId, isPinned) => {
    try {
      const res = await apiClient.post(`/rd/collaboration/messages/${msgId}/pin`, { isPinned: !isPinned });
      if (res.success) {
        addToast({ title: isPinned ? 'Unpinned' : 'Pinned', message: 'Message updated.', type: 'info' });
        fetchMessages(activeConversation.id);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      const res = await apiClient.delete(`/rd/collaboration/messages/${msgId}`);
      if (res.success) {
        addToast({ title: 'Deleted', message: 'Message deleted.', type: 'info' });
        fetchMessages(activeConversation.id);
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ----------------------------------------------------------------------------
  // CALENDAR ACTIONS
  // ----------------------------------------------------------------------------

  const handleCreateEvent = async () => {
    if (!newEventData.title || !newEventData.startTime || !newEventData.endTime) {
      addToast({ title: 'Validation Error', message: 'Title, start time, and end time are required.', type: 'warning' });
      return;
    }

    try {
      const res = await apiClient.post('/rd/collaboration/calendar/events', newEventData);
      if (res.success) {
        if (res.conflicts && res.conflicts.length > 0) {
          addToast({
            title: 'Event Scheduled (Notice)',
            message: `Event saved with ${res.conflicts.length} overlapping schedule conflict(s).`,
            type: 'warning',
          });
        } else {
          addToast({ title: 'Meeting Scheduled', message: `${res.data.title} is confirmed.`, type: 'success' });
        }
        setShowNewEventModal(false);
        setNewEventData({
          title: '',
          description: '',
          eventType: 'PROJECT_MEETING',
          projectId: '',
          location: '',
          meetingUrl: '',
          startTime: '',
          endTime: '',
          participantUserIds: [],
        });
        setDetectedConflicts([]);
        fetchCalendarEvents();
      }
    } catch (err) {
      addToast({ title: 'Schedule Failed', message: err.message, type: 'error' });
    }
  };

  const handleCheckConflictPreview = async () => {
    if (!newEventData.startTime || !newEventData.endTime) return;
    try {
      const res = await apiClient.post('/rd/collaboration/calendar/conflicts', {
        userIds: [crmUser?.id, ...newEventData.participantUserIds].filter(Boolean),
        startTime: newEventData.startTime,
        endTime: newEventData.endTime,
      });
      if (res.success) {
        setDetectedConflicts(res.conflicts || []);
      }
    } catch {
      setDetectedConflicts([]);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      const res = await apiClient.post(`/rd/collaboration/calendar/events/${eventId}/respond`, { status });
      if (res.success) {
        addToast({ title: 'RSVP Saved', message: `Marked as ${status}.`, type: 'success' });
        fetchCalendarEvents();
      }
    } catch (err) {
      addToast({ title: 'RSVP Failed', message: err.message, type: 'error' });
    }
  };

  // ----------------------------------------------------------------------------
  // NOTIFICATIONS ACTIONS
  // ----------------------------------------------------------------------------

  const handleMarkNotifRead = async (notifId) => {
    try {
      await apiClient.post(`/rd/collaboration/notifications/${notifId}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)));
      setNotifUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await apiClient.post('/rd/collaboration/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotifUnreadCount(0);
      addToast({ title: 'Notifications Cleared', message: 'All marked as read.', type: 'info' });
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ----------------------------------------------------------------------------
  // INTEGRATIONS ACTIONS
  // ----------------------------------------------------------------------------

  const handleSaveIntegration = async () => {
    if (!activeConfigModal) return;
    try {
      const res = await apiClient.post(`/rd/collaboration/integrations/${activeConfigModal}`, {
        name: configForm.name || `${activeConfigModal} Integration`,
        webhookUrl: configForm.webhookUrl,
        channelMapping: { general: configForm.channel },
        eventsConfig: configForm.events,
      });
      if (res.success) {
        addToast({
          title: 'Configuration Saved',
          message: `${activeConfigModal} credentials stored safely. Masked webhook active.`,
          type: 'success',
        });
        setActiveConfigModal(null);
        fetchIntegrationData();
      }
    } catch (err) {
      addToast({ title: 'Save Failed', message: err.message, type: 'error' });
    }
  };

  const handleTestIntegration = async (configId, providerName) => {
    try {
      const res = await apiClient.post(`/rd/collaboration/integrations/${configId}/test`);
      if (res.success) {
        addToast({
          title: 'Connection Verified',
          message: `${providerName} integration is active and verified!`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Connection Test Failed',
          message: res.message || 'Webhook unreachable or rejected.',
          type: 'warning',
        });
      }
      fetchIntegrationData();
    } catch (err) {
      addToast({ title: 'Test Failed', message: err.message, type: 'error' });
    }
  };

  const handleDisconnectIntegration = async (configId, providerName) => {
    if (!window.confirm(`Disconnect ${providerName} integration? Notifications will stop.`)) return;
    try {
      const res = await apiClient.post(`/rd/collaboration/integrations/${configId}/disconnect`);
      if (res.success) {
        addToast({ title: 'Disconnected', message: `${providerName} is now offline.`, type: 'info' });
        fetchIntegrationData();
      }
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Filtered lists
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (conversationFilter === 'CHANNELS') return c.type === 'PROJECT_CHANNEL';
      if (conversationFilter === 'DIRECT') return c.type === 'DIRECT_MESSAGE' || c.type === 'GROUP_CHAT';
      return true;
    });
  }, [conversations, conversationFilter]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (notifFilter === 'UNREAD') return !n.isRead;
      if (notifFilter === 'MENTIONS') return n.type === 'MENTION';
      return true;
    });
  }, [notifications, notifFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header & Telemetry Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Collaboration, Communication & External Integrations
            </h2>
            <Badge variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> Master Prompt 11
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Unified real-time project spaces, threaded discussions, direct chats, contextual comments, shared calendars & Slack/Teams integration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              fetchConversations();
              fetchCalendarEvents();
              fetchIntegrationData();
            }}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowNewConvModal(true)}
          >
            New Channel / Direct Chat
          </Button>
        </div>
      </div>

      {/* 2. KPI Telemetry Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Channels & Chats"
          value={conversations.length}
          icon={MessageSquare}
          trend={{ value: `${conversations.filter(c => c.type === 'PROJECT_CHANNEL').length} Project Channels`, isPositive: true }}
        />
        <KPICard
          title="Unread In-App Notifications"
          value={notifUnreadCount}
          icon={Bell}
          trend={{ value: notifUnreadCount > 0 ? 'Requires attention' : 'All clear', isPositive: notifUnreadCount === 0 }}
        />
        <KPICard
          title="Collaborative Events & Reviews"
          value={calendarEvents.length}
          icon={Calendar}
          trend={{ value: `${calendarEvents.filter(e => e.eventType === 'STAGE_GATE_MEETING').length} Gate Reviews`, isPositive: true }}
        />
        <KPICard
          title="Slack / Teams Integrations"
          value={integrations.filter(i => i.status === 'ACTIVE').length + ' Active'}
          icon={Shield}
          trend={{ value: 'Multi-Tenant Encrypted', isPositive: true }}
        />
      </div>

      {/* 3. Main Navigation Tabs */}
      <Card>
        <CardBody className="p-0">
          <div style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
            <Tabs
              tabs={[
                { id: 'discussions', label: 'Discussions & Messaging', icon: MessageSquare },
                { id: 'comments', label: 'Contextual Record Comments', icon: Hash },
                { id: 'calendar', label: 'Shared R&D Calendar', icon: Calendar },
                { id: 'notifications', label: `Notifications (${notifUnreadCount})`, icon: Bell },
                { id: 'integrations', label: 'External Integrations (Slack/Teams)', icon: Sliders },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          <div style={{ padding: '1rem' }}>
            {/* ========================================================================= */}
            {/* SUB-VIEW 1: DISCUSSIONS & MESSAGING                                       */}
            {/* ========================================================================= */}
            {activeTab === 'discussions' && (
              <div style={{ display: 'grid', gridTemplateColumns: activeThreadParent ? '260px 1fr 340px' : '260px 1fr', height: '620px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Left Column: Channels & Direct Messages */}
                <div style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-secondary, rgba(248, 250, 252, 0.4))', display: 'flex', flexDirection: 'column' }}>
                  {/* Filter / Search header */}
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setConversationFilter('ALL')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: conversationFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                          color: conversationFilter === 'ALL' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setConversationFilter('CHANNELS')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: conversationFilter === 'CHANNELS' ? 'var(--primary)' : 'transparent',
                          color: conversationFilter === 'CHANNELS' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        Channels
                      </button>
                      <button
                        onClick={() => setConversationFilter('DIRECT')}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: conversationFilter === 'DIRECT' ? 'var(--primary)' : 'transparent',
                          color: conversationFilter === 'DIRECT' ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        Direct
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Search channels..."
                        value={messageSearch}
                        onChange={(e) => setMessageSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px 4px 26px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                          background: 'var(--surface)',
                          color: 'var(--text-primary)',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Channel List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredConversations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        No conversations found. Click "New Channel / Direct Chat" above!
                      </div>
                    ) : (
                      filteredConversations.map((conv) => {
                        const isSelected = activeConversation?.id === conv.id;
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                              borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                              {conv.type === 'PROJECT_CHANNEL' ? (
                                <Hash size={15} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                              ) : (
                                <User size={15} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                              )}
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {conv.title}
                                </div>
                                {conv.projectName && (
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    📁 {conv.projectName}
                                  </div>
                                )}
                              </div>
                            </div>
                            {conv.hasUnread && (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Center Column: Active Conversation Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                  {activeConversation ? (
                    <>
                      {/* Active Conv Header */}
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--surface-secondary, rgba(248, 250, 252, 0.5))'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {activeConversation.title}
                            </span>
                            <Badge variant="primary" size="sm">
                              {activeConversation.type === 'PROJECT_CHANNEL' ? 'Channel' : 'Direct Message'}
                            </Badge>
                            {activeConversation.projectName && (
                              <Badge variant="outline" size="sm">
                                📁 {activeConversation.projectName}
                              </Badge>
                            )}
                          </div>
                          {activeConversation.topic && (
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {activeConversation.topic}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            👥 {activeConversation.participantsCount || activeConversation.participants?.length || 1} members
                          </span>
                        </div>
                      </div>

                      {/* Messages Stream */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            No messages yet in this discussion space. Start by saying hello or sharing an R&D milestone!
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isMine = msg.senderId === crmUser?.id;
                            return (
                              <div
                                key={msg.id}
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: msg.isPinned ? 'rgba(234, 179, 8, 0.08)' : 'transparent',
                                  borderLeft: msg.isPinned ? '3px solid #eab308' : '3px solid transparent'
                                }}
                              >
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  backgroundColor: isMine ? 'var(--primary)' : '#64748b',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  {msg.sender?.name ? msg.sender.name.charAt(0).toUpperCase() : 'U'}
                                </div>

                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {msg.sender?.name || 'Researcher'}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.isPinned && (
                                      <Badge variant="warning" size="sm" style={{ padding: '1px 4px', fontSize: '9px' }}>
                                        <Pin size={9} /> Pinned
                                      </Badge>
                                    )}
                                    {msg.isEdited && (
                                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        (edited)
                                      </span>
                                    )}
                                  </div>

                                  {/* Linked Record Chip */}
                                  {msg.linkedRecordType && (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: 'var(--surface-secondary, rgba(248, 250, 252, 0.8))',
                                      border: '1px solid var(--border)',
                                      fontSize: '10px',
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                      marginBottom: 4
                                    }}>
                                      <LinkIcon size={10} /> Linked {msg.linkedRecordType}: {msg.linkedRecordId}
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div style={{
                                    fontSize: '13px',
                                    color: msg.isDeleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                    fontStyle: msg.isDeleted ? 'italic' : 'normal',
                                    lineHeight: '1.45'
                                  }}>
                                    {msg.content}
                                  </div>

                                  {/* Attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                      {msg.attachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'var(--surface-secondary)',
                                            border: '1px solid var(--border)',
                                            fontSize: '11px',
                                            color: 'var(--text-primary)',
                                            textDecoration: 'none'
                                          }}
                                        >
                                          <Paperclip size={11} color="var(--primary)" /> {att.fileName}
                                        </a>
                                      ))}
                                    </div>
                                  )}

                                  {/* Bottom Actions Row */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <button
                                      onClick={() => openThread(msg)}
                                      style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        padding: 0
                                      }}
                                    >
                                      <CornerDownRight size={11} />
                                      {msg._count?.replies > 0 ? `${msg._count.replies} Replies` : 'Reply in thread'}
                                    </button>

                                    <button
                                      onClick={() => handlePinMessage(msg.id, msg.isPinned)}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', padding: 0 }}
                                      title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                                    >
                                      <Pin size={11} />
                                    </button>

                                    {isMine && !msg.isDeleted && (
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '11px', color: '#ef4444', padding: 0 }}
                                        title="Delete message"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Compose Box */}
                      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder={`Message #${activeConversation.title} (@mention to notify teammate)...`}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '13px',
                            background: 'var(--surface)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Send}
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
                      Select a channel or direct message to start collaborating.
                    </div>
                  )}
                </div>

                {/* Right Column: Thread Panel */}
                {activeThreadParent && (
                  <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface-secondary, rgba(248, 250, 252, 0.4))' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Thread Discussion
                      </span>
                      <button
                        onClick={() => setActiveThreadParent(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Parent preview */}
                      <div style={{ padding: '8px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>{activeThreadParent.sender?.name}</div>
                        <div>{activeThreadParent.content}</div>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Replies ({threadReplies.length})
                      </div>

                      {threadReplies.map((reply) => (
                        <div key={reply.id} style={{ padding: '6px 8px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '11px', marginBottom: 2 }}>
                            <span>{reply.sender?.name}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                              {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>{reply.content}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        placeholder="Reply to thread..."
                        value={threadInput}
                        onChange={(e) => setThreadInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendThreadReply()}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                          background: 'var(--surface)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <Button size="sm" variant="primary" onClick={handleSendThreadReply}>Reply</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 2: CONTEXTUAL RECORD COMMENTS                                    */}
            {/* ========================================================================= */}
            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Record Picker Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  background: 'var(--surface-secondary, rgba(248, 250, 252, 0.4))'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={16} color="var(--primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Select Record:</span>
                  </div>

                  <select
                    value={contextRecordType}
                    onChange={(e) => setContextRecordType(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="TASK">Task Record</option>
                    <option value="PROJECT">R&D Project</option>
                    <option value="MILESTONE">Milestone</option>
                    <option value="EXPERIMENT">Experiment Record</option>
                    <option value="DECISION">Gate Decision</option>
                    <option value="RISK">Risk & Issue</option>
                    <option value="DOCUMENT">Document Record</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Enter Record ID (e.g. task-01, proj-01)..."
                    value={contextRecordId}
                    onChange={(e) => setContextRecordId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Embedded Comment Panel */}
                <div style={{ height: '520px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <ContextCommentPanel
                    recordType={contextRecordType}
                    recordId={contextRecordId}
                    recordTitle={`${contextRecordType} #${contextRecordId}`}
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 3: SHARED R&D CALENDAR                                          */}
            {/* ========================================================================= */}
            {activeTab === 'calendar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} color="var(--primary)" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Collaborative Schedule ({calendarEvents.length} Events)
                    </span>

                    <select
                      value={calendarFilter}
                      onChange={(e) => setCalendarFilter(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="ALL">All Event Types</option>
                      <option value="STAGE_GATE_MEETING">Stage-Gate Reviews</option>
                      <option value="PROJECT_MEETING">Project Meetings</option>
                      <option value="RESEARCH_REVIEW">Research Reviews</option>
                      <option value="TASK_DEADLINE">Task Deadlines</option>
                      <option value="PROJECT_MILESTONE">Milestones</option>
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setShowNewEventModal(true)}
                  >
                    Schedule Meeting / Review
                  </Button>
                </div>

                {/* Events Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {calendarEvents.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                      No events scheduled in this period. Click "Schedule Meeting / Review" to create one.
                    </div>
                  ) : (
                    calendarEvents.map((ev) => {
                      const isCreator = ev.createdById === crmUser?.id;
                      const myStatus = ev.participants?.find((p) => p.userId === crmUser?.id)?.status || 'PENDING';
                      return (
                        <div
                          key={ev.id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '1rem',
                            backgroundColor: 'var(--surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                              <Badge variant="primary" size="sm" style={{ marginBottom: 4 }}>
                                {ev.eventType.replace(/_/g, ' ')}
                              </Badge>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {ev.title}
                              </div>
                            </div>
                            <Badge variant={ev.status === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                              {ev.status}
                            </Badge>
                          </div>

                          {ev.description && (
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {ev.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={12} color="var(--primary)" />
                              <span>{new Date(ev.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                            {ev.location && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <MapPin size={12} /> <span>{ev.location}</span>
                              </div>
                            )}
                            {ev.meetingUrl && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Video size={12} color="var(--primary)" />
                                <a href={ev.meetingUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                  Join Video Call
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Participants & RSVP */}
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              👥 {ev.participants?.length || 1} Invited
                            </span>

                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => handleRsvp(ev.id, 'ACCEPTED')}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)',
                                  background: myStatus === 'ACCEPTED' ? '#22c55e' : 'transparent',
                                  color: myStatus === 'ACCEPTED' ? '#fff' : 'var(--text-secondary)',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRsvp(ev.id, 'DECLINED')}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)',
                                  background: myStatus === 'DECLINED' ? '#ef4444' : 'transparent',
                                  color: myStatus === 'DECLINED' ? '#fff' : 'var(--text-secondary)',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 4: NOTIFICATIONS & MENTIONS                                      */}
            {/* ========================================================================= */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button
                      variant={notifFilter === 'ALL' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setNotifFilter('ALL')}
                    >
                      All ({notifications.length})
                    </Button>
                    <Button
                      variant={notifFilter === 'UNREAD' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setNotifFilter('UNREAD')}
                    >
                      Unread ({notifUnreadCount})
                    </Button>
                    <Button
                      variant={notifFilter === 'MENTIONS' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setNotifFilter('MENTIONS')}
                    >
                      @Mentions
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Check}
                      onClick={handleMarkAllNotifsRead}
                      disabled={notifUnreadCount === 0}
                    >
                      Mark All as Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Settings}
                      onClick={() => setShowPrefModal(true)}
                    >
                      Preferences
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                      No notifications matching your filter.
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          backgroundColor: notif.isRead ? 'var(--surface)' : 'rgba(59, 130, 246, 0.05)',
                          borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: notif.type === 'MENTION' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {notif.type === 'MENTION' ? <Hash size={14} color="var(--primary)" /> : <Bell size={14} color="#eab308" />}
                          </div>

                          <div>
                            <div style={{ fontSize: '13px', fontWeight: notif.isRead ? 600 : 800, color: 'var(--text-primary)' }}>
                              {notif.title}
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {notif.message}
                            </p>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!notif.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkNotifRead(notif.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          {notif.linkUrl && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={ExternalLink}
                              onClick={() => {
                                handleMarkNotifRead(notif.id);
                                if (notif.linkUrl.includes('conversationId')) {
                                  setActiveTab('discussions');
                                }
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-VIEW 5: EXTERNAL INTEGRATIONS (SLACK / TEAMS)                         */}
            {/* ========================================================================= */}
            {activeTab === 'integrations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Enterprise External Relays & Notification Hub
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Configure webhooks for Slack and Microsoft Teams to stream R&D milestone approvals, gate submissions, and urgent schedule alerts.
                  </p>
                </div>

                {/* Integration Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                  {integrations.map((intg) => {
                    const isConnected = intg.status === 'ACTIVE';
                    return (
                      <div
                        key={intg.provider}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          backgroundColor: 'var(--surface)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '8px',
                              backgroundColor: intg.provider === 'SLACK' ? '#4a154b' : '#464eb8',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px'
                            }}>
                              {intg.provider === 'SLACK' ? 'S' : 'T'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {intg.name}
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {intg.provider} Channel Relay
                              </span>
                            </div>
                          </div>

                          <Badge variant={isConnected ? 'success' : intg.status === 'ERROR' ? 'danger' : 'outline'}>
                            {intg.status}
                          </Badge>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {intg.isConfigured ? (
                            <div>
                              <div>Webhook: <code style={{ fontSize: '11px' }}>{intg.maskedWebhookUrl}</code></div>
                              <div style={{ marginTop: 4 }}>
                                Last Sync: {intg.lastSyncAt ? new Date(intg.lastSyncAt).toLocaleString() : 'Never tested'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>Not configured. Add your webhook URL to enable notifications.</span>
                          )}
                        </div>

                        {intg.errorMessage && (
                          <div style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontSize: '11px' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {intg.errorMessage}
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Settings}
                            onClick={() => {
                              setActiveConfigModal(intg.provider);
                              setConfigForm({
                                name: intg.name,
                                webhookUrl: '',
                                channel: intg.channelMapping?.general || '#general',
                                events: intg.eventsConfig || {},
                              });
                            }}
                          >
                            Configure
                          </Button>

                          {intg.id && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleTestIntegration(intg.id, intg.name)}
                              >
                                Test Ping
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDisconnectIntegration(intg.id, intg.name)}
                              >
                                Disconnect
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Audit Logs Table */}
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                    Integration Event Delivery & Audit Trail ({integrationLogs.length})
                  </h4>

                  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: 'var(--surface-secondary, rgba(248, 250, 252, 0.6))', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Time</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Provider</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Event</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Summary / Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {integrationLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              No integration events logged yet.
                            </td>
                          </tr>
                        ) : (
                          integrationLogs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{log.provider}</td>
                              <td style={{ padding: '8px 12px' }}>{log.event}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'} size="sm">
                                  {log.status}
                                </Badge>
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                {log.payloadSummary || log.errorDetails || 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: NEW CHANNEL / DIRECT CHAT                                         */}
      {/* ========================================================================= */}
      {showNewConvModal && (
        <Modal
          isOpen={showNewConvModal}
          onClose={() => setShowNewConvModal(false)}
          title="Create Collaboration Space"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Space Type</label>
              <select
                value={newConvData.type}
                onChange={(e) => setNewConvData({ ...newConvData, type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <option value="PROJECT_CHANNEL">Project Discussion Channel</option>
                <option value="DIRECT_MESSAGE">1-on-1 Direct Message</option>
                <option value="GROUP_CHAT">Ad-Hoc Group Conversation</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Title / Channel Name</label>
              <input
                type="text"
                placeholder="e.g. Battery Chemistry Squad or Direct Discussion"
                value={newConvData.title}
                onChange={(e) => setNewConvData({ ...newConvData, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            {newConvData.type === 'PROJECT_CHANNEL' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Link to R&D Project</label>
                <select
                  value={newConvData.projectId}
                  onChange={(e) => setNewConvData({ ...newConvData, projectId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- No project link --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Topic / Description</label>
              <input
                type="text"
                placeholder="What is the goal of this discussion space?"
                value={newConvData.topic}
                onChange={(e) => setNewConvData({ ...newConvData, topic: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Invite Teammates</label>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px' }}>
                {directoryUsers.map((u) => {
                  const isChecked = newConvData.participantUserIds.includes(u.id);
                  return (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', padding: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? newConvData.participantUserIds.filter(id => id !== u.id)
                            : [...newConvData.participantUserIds, u.id];
                          setNewConvData({ ...newConvData, participantUserIds: next });
                        }}
                      />
                      <span>{u.name} ({u.email})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="outline" onClick={() => setShowNewConvModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateConversation}>Create Channel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW CALENDAR EVENT                                                 */}
      {/* ========================================================================= */}
      {showNewEventModal && (
        <Modal
          isOpen={showNewEventModal}
          onClose={() => setShowNewEventModal(false)}
          title="Schedule Collaborative Event / Review"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Meeting Title</label>
              <input
                type="text"
                placeholder="e.g. Stage-Gate 3 Review / Battery Architecture"
                value={newEventData.title}
                onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Event Type</label>
                <select
                  value={newEventData.eventType}
                  onChange={(e) => setNewEventData({ ...newEventData, eventType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  <option value="PROJECT_MEETING">Project Meeting</option>
                  <option value="STAGE_GATE_MEETING">Stage-Gate Review</option>
                  <option value="RESEARCH_REVIEW">Research Review</option>
                  <option value="TASK_DEADLINE">Task Deadline</option>
                  <option value="PROJECT_MILESTONE">Project Milestone</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Link to Project</label>
                <select
                  value={newEventData.projectId}
                  onChange={(e) => setNewEventData({ ...newEventData, projectId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- No project link --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Start Time</label>
                <input
                  type="datetime-local"
                  value={newEventData.startTime}
                  onChange={(e) => {
                    setNewEventData({ ...newEventData, startTime: e.target.value });
                  }}
                  onBlur={handleCheckConflictPreview}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>End Time</label>
                <input
                  type="datetime-local"
                  value={newEventData.endTime}
                  onChange={(e) => {
                    setNewEventData({ ...newEventData, endTime: e.target.value });
                  }}
                  onBlur={handleCheckConflictPreview}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Conflict Detection Alert */}
            {detectedConflicts.length > 0 && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', color: '#b45309', fontSize: '12px' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                <strong>Schedule Conflict Detected:</strong> {detectedConflicts.length} attendee(s) already have overlapping meetings in this window.
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Location / Room</label>
              <input
                type="text"
                placeholder="e.g. Lab Room 302 or Virtual"
                value={newEventData.location}
                onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Invite Team Members</label>
              <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px' }}>
                {directoryUsers.map((u) => {
                  const isChecked = newEventData.participantUserIds.includes(u.id);
                  return (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', padding: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? newEventData.participantUserIds.filter(id => id !== u.id)
                            : [...newEventData.participantUserIds, u.id];
                          setNewEventData({ ...newEventData, participantUserIds: next });
                        }}
                      />
                      <span>{u.name} ({u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="outline" onClick={() => setShowNewEventModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateEvent}>Schedule Event</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE SLACK / TEAMS                                            */}
      {/* ========================================================================= */}
      {activeConfigModal && (
        <Modal
          isOpen={Boolean(activeConfigModal)}
          onClose={() => setActiveConfigModal(null)}
          title={`Configure ${activeConfigModal} Relay`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Integration Name</label>
              <input
                type="text"
                value={configForm.name}
                onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Incoming Webhook URL (Encrypted & Masked)
              </label>
              <input
                type="password"
                placeholder={activeConfigModal === 'SLACK' ? 'https://hooks.slack.com/services/...' : 'https://outlook.office.com/webhook/...'}
                value={configForm.webhookUrl}
                onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 2, display: 'block' }}>
                Credentials are saved encrypted on the server and never returned in plain text to the browser.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Default Notification Channel</label>
              <input
                type="text"
                placeholder="#rd-milestones"
                value={configForm.channel}
                onChange={(e) => setConfigForm({ ...configForm, channel: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: 4 }}>Events to Relay</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={configForm.events.STAGE_GATE_SUBMITTED}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      events: { ...configForm.events, STAGE_GATE_SUBMITTED: e.target.checked }
                    })}
                  />
                  <span>Stage-Gate Reviews & Decision Sign-Offs</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={configForm.events.TASK_OVERDUE}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      events: { ...configForm.events, TASK_OVERDUE: e.target.checked }
                    })}
                  />
                  <span>Critical Path Task Delays & Overdue Alerts</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={configForm.events.PROJECT_CREATED}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      events: { ...configForm.events, PROJECT_CREATED: e.target.checked }
                    })}
                  />
                  <span>New R&D Projects Approved</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <Button variant="outline" onClick={() => setActiveConfigModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveIntegration}>Save Integration</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

