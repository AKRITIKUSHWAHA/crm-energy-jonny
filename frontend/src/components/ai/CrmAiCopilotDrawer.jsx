import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const QUICK_PROMPTS = [
  'How many leads do we have?',
  'Show live lead details',
  'Show recent 5 leads',
  'What is our sales pipeline value?',
  'Which tasks are pending?'
];

export function CrmAiCopilotDrawer() {
  const { crmUser, user } = useAuth();
  const currentUser = crmUser || user || {};

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${currentUser.name ? currentUser.name.split(' ')[0] : 'there'}! I am **Zunme AI** — your Virtual Assistant for **CRM nErgy Enterprise**.\n\nI can answer questions using verified CRM documentation and live database records for leads, deals, tasks, and sales metrics. How can I help power your business today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolExecuted: null,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Listen for custom trigger events from Topbar or anywhere in the app
  useEffect(() => {
    const handleOpenEvent = (event) => {
      setIsOpen(true);
      if (event.detail?.initialQuery) {
        handleSend(event.detail.initialQuery);
      }
    };

    window.addEventListener('open-crm-ai-copilot', handleOpenEvent);
    return () => window.removeEventListener('open-crm-ai-copilot', handleOpenEvent);
  }, []);

  const handleCopy = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: `Hello! I am **Zunme AI** — your Virtual Assistant for **CRM nErgy**. What would you like to explore regarding leads, deals, or operations?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecuted: null,
      }
    ]);
    setConversationId(null);
    setErrorMessage(null);
  };

  const handleSend = async (queryText) => {
    const text = (typeof queryText === 'string' ? queryText : inputValue).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputValue('');

    const userMsgId = 'usr_' + Date.now();
    const assistantMsgId = 'ast_' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: timeStr }
    ]);
    setIsLoading(true);

    const token = apiClient.getToken();
    const apiBaseUrl = apiClient.baseUrl;

    try {
      // Primary attempt: /ai/chat, with fallback to /integration/chat
      let response;
      try {
        response = await fetch(`${apiBaseUrl}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: text,
            conversationId,
            stream: true
          })
        });
      } catch (networkErr) {
        // Fallback to /integration/chat if direct /ai/chat failed network
        response = await fetch(`${apiBaseUrl}/integration/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: text,
            conversationId,
            stream: true
          })
        });
      }

      if (!response.ok) {
        let errDesc = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          errDesc = errData.error || errData.message || errDesc;
        } catch {}
        throw new Error(errDesc);
      }

      const contentType = response.headers.get('content-type') || '';

      // Handle Streaming SSE response
      if (contentType.includes('text/event-stream') && response.body) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: timeStr,
            toolExecuted: null,
            isStreaming: true
          }
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulated = '';
        let detectedTool = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const ev of events) {
            const lines = ev.split('\n');
            let eventName = 'message';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventName = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              }
            }

            if (!eventData) continue;

            try {
              const parsed = JSON.parse(eventData);
              if (eventName === 'chunk' && parsed.delta) {
                accumulated += parsed.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulated } : m
                  )
                );
              } else if (eventName === 'done') {
                if (parsed.conversationId) setConversationId(parsed.conversationId);
                if (parsed.toolExecuted) detectedTool = parsed.toolExecuted;
                if (parsed.content) accumulated = parsed.content;
              }
            } catch {}
          }
        }

        // Finalize streaming message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulated || 'I have processed your CRM query.',
                  toolExecuted: detectedTool,
                  isStreaming: false
                }
              : m
          )
        );
      } else {
        // Standard JSON turn fallback
        const result = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: result.content || 'Your request was successfully executed.',
            timestamp: timeStr,
            toolExecuted: result.toolExecuted || null
          }
        ]);
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
      }
    } catch (err) {
      console.error('[ZunmeAi] Chat error:', err);
      setErrorMessage(err.message || 'Failed to communicate with CRM AI backend.');
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'system',
          content: `⚠️ **Error:** ${err.message || 'Unable to connect to AI assistant.'}`,
          timestamp: timeStr,
          isError: true,
          retryText: text
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3: ### Title
      if (trimmed.startsWith('### ')) {
        return (
          <h4
            key={idx}
            style={{
              margin: '8px 0 4px 0',
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)'
            }}
          >
            {trimmed.replace(/^###\s+/, '')}
          </h4>
        );
      }

      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
      const cleanLine = isBullet ? trimmed.replace(/^[•-]\s*/, '') : line;

      // Parse bold **text** and code `code`
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
      const parsed = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} style={{ fontWeight: 700, color: 'inherit' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#4f46e5',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontFamily: 'monospace'
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '2px 0' }}>
            <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '13px' }}>•</span>
            <span style={{ flex: 1, lineHeight: 1.5, color: 'var(--text-primary, #0f172a)' }}>{parsed}</span>
          </div>
        );
      }

      if (!trimmed) {
        return <div key={idx} style={{ height: '5px' }} />;
      }

      return (
        <p key={idx} style={{ margin: '0 0 4px 0', lineHeight: 1.5, color: 'var(--text-primary, #0f172a)' }}>
          {parsed}
        </p>
      );
    });
  };

  // If not open, DO NOT render any floating bottom button!
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="website-modal-backdrop notranslate"
      translate="no"
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="website-modal-window notranslate"
        translate="no"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          height: 'min(640px, 92dvh)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Header - Authentic Zunme AI Style */}
        <div
          className="website-modal-header"
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                flexShrink: 0
              }}
            >
              <Bot size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '15px',
                    color: 'var(--text-primary, #0f172a)'
                  }}
                >
                  Ask Zunme AI — Virtual Assistant
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#4f46e5',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  LIVE AI
                </span>
              </div>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #64748b)',
                  display: 'block',
                  lineHeight: 1.3
                }}
              >
                Instant AI Intelligence for CRM nErgy Enterprise
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Reset Conversation */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset Conversation"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary, #64748b)',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary, #64748b)',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Thread */}
        <div
          className="notranslate"
          translate="no"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isSystem = m.role === 'system';

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '8px'
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isSystem ? '#ef4444' : '#4f46e5',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Sparkles size={14} />
                  </div>
                )}

                <div
                  className="notranslate"
                  translate="no"
                  style={{
                    maxWidth: isUser ? '82%' : '86%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    background: isUser
                      ? '#4f46e5'
                      : isSystem
                      ? '#fee2e2'
                      : 'var(--surface-secondary, #f8fafc)',
                    color: isUser
                      ? '#ffffff'
                      : isSystem
                      ? '#991b1b'
                      : 'var(--text-primary, #0f172a)',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    border: isUser
                      ? 'none'
                      : isSystem
                      ? '1px solid #fecaca'
                      : '1px solid var(--border, #e2e8f0)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    boxShadow: isUser ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none'
                  }}
                >
                  {/* Tool Executed Badge */}
                  {m.toolExecuted && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(79, 70, 229, 0.1)',
                        color: '#4f46e5',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginBottom: '6px'
                      }}
                    >
                      <Database size={11} />
                      <span>Live CRM Tool: {m.toolExecuted}</span>
                    </div>
                  )}

                  {/* USER MESSAGE: Crystal Clear White Text, Guaranteed Visible */}
                  {isUser ? (
                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        lineHeight: 1.45,
                        fontWeight: 500,
                        wordBreak: 'break-word'
                      }}
                    >
                      <span style={{ color: '#ffffff', display: 'block', textShadow: '0 0.5px 1px rgba(0,0,0,0.1)' }}>
                        {m.content}
                      </span>
                    </div>
                  ) : (
                    renderContent(m.content)
                  )}

                  {/* Actions Bar for Assistant Messages */}
                  {!isUser && !isSystem && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        paddingTop: '4px',
                        borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                        fontSize: '10.5px',
                        color: 'var(--text-tertiary, #94a3b8)'
                      }}
                    >
                      <span>{m.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedId === m.id ? '#10b981' : 'var(--text-tertiary, #94a3b8)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10.5px',
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {/* Retry Button for Errors */}
                  {m.isError && m.retryText && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleSend(m.retryText)}
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RefreshCw size={11} />
                        <span>Retry Query</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #64748b)', fontSize: '12px' }}>
              <Sparkles size={14} style={{ color: '#4f46e5', animation: 'spin 2s linear infinite' }} />
              <span>Zunme AI is answering...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar - Default in English */}
        <div
          style={{
            padding: '0.65rem 1rem',
            borderTop: '1px solid var(--border, #e2e8f0)',
            backgroundColor: 'var(--surface-secondary, #f8fafc)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#4f46e5',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '16px',
                padding: '4px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface, #ffffff)';
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface, #ffffff)'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Zunme AI about leads, deals, or CRM..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--surface-secondary, #f8fafc)',
              color: 'var(--text-primary, #0f172a)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              background: inputValue.trim() && !isLoading ? '#4f46e5' : '#a5b4fc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 14px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              transition: 'background 0.2s ease'
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default CrmAiCopilotDrawer;
