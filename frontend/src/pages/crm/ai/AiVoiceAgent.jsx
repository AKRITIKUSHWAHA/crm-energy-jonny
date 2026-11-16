import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ArrowRight,
  Play,
  Square,
  CheckCircle2,
  Clock,
  Cpu,
  Radio,
  Sliders,
  RefreshCw,
  Zap,
  Shield,
  MessageSquare,
  Headphones,
  Settings2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Breadcrumb, Button, Card, Badge } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import './AiVoiceAgent.css';

export const AiVoiceAgent = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();

  // Voice Session State
  const [isCalling, setIsCalling] = useState(false);
  const [pipelineState, setPipelineState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Configuration settings
  const [sttProvider, setSttProvider] = useState('deepgram');
  const [llmProvider, setLlmProvider] = useState('gpt-4o');
  const [ttsProvider, setTtsProvider] = useState('elevenlabs');
  const [voicePersona, setVoicePersona] = useState('sarah');
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'settings'

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: 'Hello! How can I assist you with your sales, deals, or CRM operations today?',
      time: '11:20 AM',
    },
    {
      id: 2,
      sender: 'user',
      text: 'Can you show me the high-priority enterprise deals closing this month?',
      time: '11:21 AM',
    },
    {
      id: 3,
      sender: 'agent',
      text: 'You have 4 enterprise deals in closing stage totaling $840,000, led by Apex Energy Solutions and Global Logistics Corp.',
      time: '11:21 AM',
    },
  ]);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Audio level animation during active listening or speaking
  useEffect(() => {
    if (isCalling && (pipelineState === 'listening' || pipelineState === 'speaking')) {
      const interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 65) + 35);
      }, 120);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isCalling, pipelineState]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Web Speech API initialization (if supported in browser)
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setPipelineState('listening');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcriptText = event.results[i][0].transcript;
            handleUserUtterance(transcriptText);
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        setLiveTranscript(currentInterim);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition notice:', err.error);
      };

      recognitionRef.current = recognition;
    }
  };

  // Start Voice Session
  const startVoiceSession = () => {
    setIsCalling(true);
    setPipelineState('listening');
    addToast({
      title: 'AI Voice Pipeline Active',
      message: 'Streaming audio pipeline engaged: Speech-to-Text is listening.',
      type: 'success',
    });

    initSpeechRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Fallback to interactive mode if recognition is already started or restricted
      }
    }
  };

  // End Voice Session
  const endVoiceSession = () => {
    setIsCalling(false);
    setPipelineState('idle');
    setLiveTranscript('');
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    addToast({
      title: 'Voice Session Ended',
      message: 'Microphone and TTS audio streams disconnected.',
      type: 'info',
    });
  };

  // Process user utterance through the voice pipeline
  const handleUserUtterance = (text) => {
    if (!text || text.trim() === '') return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLiveTranscript('');
    setPipelineState('thinking');

    // Simulate AI response
    timerRef.current = setTimeout(() => {
      let responseText = '';
      const lower = text.toLowerCase();

      if (lower.includes('deal') || lower.includes('sales') || lower.includes('pipeline')) {
        responseText = 'Based on your CRM pipeline, you have $1.42M active in negotiation across 12 qualified accounts. Would you like me to prioritize the highest margin deals?';
      } else if (lower.includes('lead') || lower.includes('contact')) {
        responseText = 'The AI Lead engine captured 18 new inbound leads today with an average quality score of 89. Three leads requested immediate callbacks.';
      } else if (lower.includes('task') || lower.includes('schedule') || lower.includes('today')) {
        responseText = 'You have 5 priority tasks scheduled for today, including follow-up meetings with Apex Logistics and Global Solutions.';
      } else if (lower.includes('perform') || lower.includes('quarter') || lower.includes('report')) {
        responseText = 'Quarterly sales are trending 14% above target, with enterprise renewals performing highest at 94% retention.';
      } else {
        responseText = `Understood. I have logged that into your CRM workspace. Is there anything else you would like to inspect or automate?`;
      }

      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setPipelineState('speaking');

      // Trigger TTS playback via browser synthesis if available
      speakText(responseText, () => {
        if (isCalling) {
          setPipelineState('listening');
        } else {
          setPipelineState('idle');
        }
      });
    }, 1100);
  };

  // Text-To-Speech execution
  const speakText = (text, onComplete) => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speakingSpeed;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira'));
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => {
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer if speech synthesis is disabled or muted
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
    }
  };

  // Trigger sample query for quick testing
  const triggerQuickSample = (sampleText) => {
    if (!isCalling) {
      setIsCalling(true);
    }
    handleUserUtterance(sampleText);
  };

  return (
    <div className="voice-agent-container">
      {/* Top Header & Breadcrumbs */}
      <div>
        <Breadcrumb
          items={[
            { label: 'Dashboard', path: '/crm/dashboard' },
            { label: 'AI SuperHouse', path: '/crm/bestie' },
            { label: 'AI Voice Agent', active: true },
          ]}
        />
        <div className="voice-agent-header">
          <div className="voice-agent-header-info">
            <div className="voice-agent-icon-badge">
              <Mic size={22} color="#ffffff" />
            </div>
            <div className="voice-agent-title-group">
              <div className="voice-agent-title-row">
                <h1 className="voice-agent-title">
                  {t('AI Voice Agent')}
                </h1>
                <span
                  className="voice-agent-status-pill"
                  style={{
                    background: isCalling ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-hover)',
                    color: isCalling ? '#10b981' : 'var(--text-muted)',
                    border: `1px solid ${isCalling ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isCalling ? '#10b981' : '#94a3b8',
                    }}
                  />
                  {isCalling ? t('Active Call') : t('Ready')}
                </span>
              </div>
              <p className="voice-agent-subtitle">
                {t('Real-time conversational voice assistant for your CRM.')}
              </p>
            </div>
          </div>

          {/* Action Call Button */}
          <div className="voice-agent-header-actions">
            <Button
              variant={isCalling ? 'danger' : 'primary'}
              onClick={isCalling ? endVoiceSession : startVoiceSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
              }}
            >
              {isCalling ? (
                <>
                  <Square size={15} /> {t('End Call')}
                </>
              ) : (
                <>
                  <Play size={15} /> {t('Start Voice Call')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="voice-agent-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('interactive')}
          className={`voice-agent-tab-btn ${activeTab === 'interactive' ? 'active' : ''}`}
        >
          <Headphones size={15} /> {t('Voice Studio')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`voice-agent-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings2 size={15} /> {t('Voice Settings')}
        </button>
      </div>

      {/* TAB 1: Live Interactive Voice Agent */}
      {activeTab === 'interactive' && (
        <div className="voice-agent-grid">
          {/* Left Column: Glowing Voice Orb & Call Controls */}
          <div className="voice-orb-card">
            {/* Status Indicator */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor:
                  pipelineState === 'listening'
                    ? 'rgba(14, 165, 233, 0.12)'
                    : pipelineState === 'thinking'
                    ? 'rgba(168, 85, 247, 0.12)'
                    : pipelineState === 'speaking'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'var(--surface-hover)',
                border: `1px solid ${
                  pipelineState === 'listening'
                    ? 'rgba(14, 165, 233, 0.25)'
                    : pipelineState === 'thinking'
                    ? 'rgba(168, 85, 247, 0.25)'
                    : pipelineState === 'speaking'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'var(--border)'
                }`,
              }}
            >
              <Activity
                size={13}
                color={
                  pipelineState === 'listening'
                    ? '#0ea5e9'
                    : pipelineState === 'thinking'
                    ? '#a855f7'
                    : pipelineState === 'speaking'
                    ? '#10b981'
                    : '#94a3b8'
                }
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color:
                    pipelineState === 'listening'
                      ? '#0ea5e9'
                      : pipelineState === 'thinking'
                      ? '#a855f7'
                      : pipelineState === 'speaking'
                      ? '#10b981'
                      : 'var(--text-muted)',
                }}
              >
                {pipelineState === 'listening'
                  ? t('Listening...')
                  : pipelineState === 'thinking'
                  ? t('Thinking...')
                  : pipelineState === 'speaking'
                  ? t('Speaking...')
                  : t('Ready')}
              </span>
            </div>

            {/* Glowing Interactive Voice Orb */}
            <div className="voice-orb-container">
              {/* Outer Pulsing Wave Rings */}
              <div
                className="voice-orb-outer-ring"
                style={{
                  border: `2px dashed ${
                    pipelineState === 'listening'
                      ? 'rgba(14, 165, 233, 0.4)'
                      : pipelineState === 'thinking'
                      ? 'rgba(168, 85, 247, 0.4)'
                      : pipelineState === 'speaking'
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(148, 163, 184, 0.15)'
                  }`,
                  transform: isCalling ? `scale(${1 + audioLevel * 0.003})` : 'scale(1)',
                }}
              />
              <div
                className="voice-orb-glow"
                style={{
                  background:
                    pipelineState === 'listening'
                      ? 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0) 70%)'
                      : pipelineState === 'thinking'
                      ? 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0) 70%)'
                      : pipelineState === 'speaking'
                      ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%)'
                      : 'none',
                }}
              />

              {/* Core Orb */}
              <button
                type="button"
                className="voice-orb-button"
                onClick={isCalling ? endVoiceSession : startVoiceSession}
                style={{
                  background:
                    pipelineState === 'listening'
                      ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)'
                      : pipelineState === 'thinking'
                      ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                      : pipelineState === 'speaking'
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                      : 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                  boxShadow:
                    pipelineState === 'listening'
                      ? '0 0 35px rgba(14, 165, 233, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                      : pipelineState === 'thinking'
                      ? '0 0 35px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                      : pipelineState === 'speaking'
                      ? '0 0 35px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                      : '0 4px 16px rgba(0, 0, 0, 0.15)',
                }}
              >
                {pipelineState === 'thinking' ? (
                  <Sparkles size={38} color="#ffffff" style={{ animation: 'spin 3s linear infinite' }} />
                ) : pipelineState === 'speaking' ? (
                  <Volume2 size={38} color="#ffffff" />
                ) : (
                  <Mic size={38} color="#ffffff" />
                )}
              </button>
            </div>

            {/* Dynamic Equalizer Bar Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, marginBottom: 'var(--spacing-3)' }}>
              {[15, 28, 45, 60, 85, 70, 45, 90, 65, 35, 75, 50, 30].map((baseHeight, idx) => {
                const computedHeight = isCalling && (pipelineState === 'listening' || pipelineState === 'speaking')
                  ? Math.max(5, (baseHeight * (audioLevel / 50)) % 28)
                  : 4;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 3.5,
                      height: `${computedHeight}px`,
                      borderRadius: 3,
                      backgroundColor:
                        pipelineState === 'listening'
                          ? '#38bdf8'
                          : pipelineState === 'thinking'
                          ? '#c084fc'
                          : pipelineState === 'speaking'
                          ? '#34d399'
                          : 'var(--border)',
                      transition: 'height 0.1s ease',
                    }}
                  />
                );
              })}
            </div>

            {/* Live Subtitle / Interim Speech Transcript */}
            <div className="voice-interim-box">
              {liveTranscript
                ? `"${liveTranscript}"`
                : isCalling
                ? pipelineState === 'listening'
                  ? t('Listening... Speak now')
                  : pipelineState === 'thinking'
                  ? t('Thinking...')
                  : t('Speaking...')
                : t('Click the microphone or select a prompt below')}
            </div>

            {/* Call Toolbar Controls (Equal Height, Perfectly Aligned) */}
            <div className="voice-controls-row">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`voice-action-pill ${isMuted ? 'muted' : 'outline'}`}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isMuted ? t('Unmute') : t('Mute Speaker')}</span>
              </button>

              <button
                type="button"
                onClick={isCalling ? endVoiceSession : startVoiceSession}
                className={`voice-action-pill ${isCalling ? 'danger' : 'primary'}`}
              >
                {isCalling ? <Square size={15} /> : <Play size={15} />}
                <span>{isCalling ? t('End Call') : t('Start Call')}</span>
              </button>
            </div>

            {/* Quick Demo Prompts */}
            <div className="voice-prompts-container">
              <div className="voice-prompts-header">
                <span className="voice-prompts-title">{t('Suggested Prompts')}</span>
                <Sparkles size={13} color="#0ea5e9" />
              </div>
              <div className="voice-prompts-list">
                {[
                  'Show me high-priority deals closing this month',
                  'Summarize new inbound leads today',
                  'What tasks are scheduled for today?',
                  'Analyze quarterly sales performance',
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => triggerQuickSample(promptText)}
                    className="voice-prompt-btn"
                  >
                    <span>"{t(promptText)}"</span>
                    <ArrowRight size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Transcript Dialogue Stream */}
          <div className="voice-transcript-card">
            {/* Transcript Card Header */}
            <div className="voice-transcript-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} color="#0ea5e9" />
                <span style={{ fontSize: '13.5px', fontWeight: 700 }}>{t('Voice Transcript')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('Persona')}:</span>
                <select
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '11.5px',
                    outline: 'none',
                  }}
                >
                  <option value="sarah">Sarah (US Executive)</option>
                  <option value="marcus">Marcus (Technical Lead)</option>
                  <option value="elena">Elena (Customer Concierge)</option>
                </select>
              </div>
            </div>

            {/* Transcript Feed Messages */}
            <div className="voice-transcript-feed">
              {messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAgent ? 'flex-start' : 'flex-end',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isAgent ? '#0ea5e9' : 'var(--text-muted)' }}>
                        {isAgent ? t('AI Voice Agent') : t('You')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>
                    <div
                      className="voice-msg-bubble"
                      style={{
                        borderRadius: isAgent ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                        backgroundColor: isAgent ? 'var(--surface-hover)' : '#0ea5e9',
                        border: isAgent ? '1px solid var(--border)' : 'none',
                        color: isAgent ? 'var(--text)' : '#ffffff',
                      }}
                    >
                      {t(msg.text)}
                    </div>
                  </div>
                );
              })}

              {pipelineState === 'thinking' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', color: '#a855f7', fontSize: '12px' }}>
                  <Sparkles size={13} style={{ animation: 'spin 2s linear infinite' }} />
                  <span>{t('AI is thinking...')}</span>
                </div>
              )}
            </div>

            {/* Bottom Input Field */}
            <div className="voice-input-footer">
              <input
                type="text"
                placeholder={t('Type a message or command...')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-hover)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    triggerQuickSample(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                variant="primary"
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling;
                  if (input && input.value.trim()) {
                    triggerQuickSample(input.value);
                    input.value = '';
                  }
                }}
                style={{ flexShrink: 0 }}
              >
                {t('Send')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Voice Settings & Engine Configuration */}
      {activeTab === 'settings' && (
        <div className="voice-settings-wrapper">
          <div className="voice-settings-cards-grid">
            {/* Card 1: Persona & Speech Synthesis */}
            <div className="voice-settings-card">
              <div className="voice-settings-card-header">
                <div className="voice-settings-card-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                  <Volume2 size={18} />
                </div>
                <div>
                  <h3 className="voice-settings-card-title">{t('Persona & Audio Output')}</h3>
                  <p className="voice-settings-card-desc">{t('Configure conversational voice persona and playback')}</p>
                </div>
              </div>

              <div className="voice-settings-card-body">
                {/* Setting 1: Voice Persona */}
                <div className="voice-setting-field">
                  <label className="voice-setting-label">
                    <span>{t('Voice Persona')}</span>
                    <span className="voice-setting-badge">Active</span>
                  </label>
                  <div className="voice-select-wrap">
                    <select
                      value={voicePersona}
                      onChange={(e) => setVoicePersona(e.target.value)}
                      className="voice-setting-select"
                    >
                      <option value="sarah">Sarah (US Executive - Warm & Professional)</option>
                      <option value="marcus">Marcus (Technical Specialist - Direct & Confident)</option>
                      <option value="elena">Elena (Customer Concierge - Friendly & Empathetic)</option>
                    </select>
                  </div>
                  <span className="voice-setting-hint">{t('Defines the conversational tone, vocabulary, and response style.')}</span>
                </div>

                {/* Setting 2: TTS Provider */}
                <div className="voice-setting-field">
                  <label className="voice-setting-label">
                    <span>{t('Voice Synthesis Engine (TTS)')}</span>
                  </label>
                  <div className="voice-select-wrap">
                    <select
                      value={ttsProvider}
                      onChange={(e) => setTtsProvider(e.target.value)}
                      className="voice-setting-select"
                    >
                      <option value="elevenlabs">ElevenLabs Flash v2.5 (Natural Streaming)</option>
                      <option value="cartesia">Cartesia Sonic (Ultra-low Latency 80ms)</option>
                      <option value="openai">OpenAI TTS-1 HD (High Fidelity)</option>
                      <option value="speechsynth">Native Browser SpeechSynthesis (Offline Fallback)</option>
                    </select>
                  </div>
                  <span className="voice-setting-hint">{t('Synthesizes AI responses into human-like audio streams.')}</span>
                </div>

                {/* Setting 3: Speaking Speed */}
                <div className="voice-setting-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="voice-setting-label" style={{ marginBottom: 0 }}>
                      <span>{t('Speaking Rate')}</span>
                    </label>
                    <span className="voice-speed-pill">{speakingSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={speakingSpeed}
                    onChange={(e) => setSpeakingSpeed(parseFloat(e.target.value))}
                    className="voice-speed-slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>0.75x (Slower)</span>
                    <span>1.0x (Standard)</span>
                    <span>1.5x (Fast)</span>
                  </div>
                </div>

                {/* Test Voice Button */}
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const testPhrases = {
                        sarah: "Hello! I'm Sarah, your CRM voice assistant. Your voice settings are working perfectly.",
                        marcus: "Systems online. I'm Marcus, ready to review your sales architecture and pipelines.",
                        elena: "Hi there! I'm Elena, ready to assist your customers and prioritize inbound leads.",
                      };
                      speakText(testPhrases[voicePersona] || testPhrases.sarah, () => {});
                      addToast({
                        title: 'Testing Voice',
                        message: `Playing sample for ${voicePersona.toUpperCase()} at ${speakingSpeed}x speed`,
                        type: 'info',
                      });
                    }}
                    className="voice-test-audio-btn"
                  >
                    <Volume2 size={15} />
                    <span>{t('Test Audio Sample')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: AI Pipeline & Intelligence Engine */}
            <div className="voice-settings-card">
              <div className="voice-settings-card-header">
                <div className="voice-settings-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="voice-settings-card-title">{t('AI Pipeline & Intelligence')}</h3>
                  <p className="voice-settings-card-desc">{t('Configure speech recognition and reasoning models')}</p>
                </div>
              </div>

              <div className="voice-settings-card-body">
                {/* Setting 1: Speech-to-Text */}
                <div className="voice-setting-field">
                  <label className="voice-setting-label">
                    <span>{t('Speech Recognition (STT)')}</span>
                  </label>
                  <div className="voice-select-wrap">
                    <select
                      value={sttProvider}
                      onChange={(e) => setSttProvider(e.target.value)}
                      className="voice-setting-select"
                    >
                      <option value="deepgram">Deepgram Nova-2 (Fast Streaming • 82ms)</option>
                      <option value="whisper">OpenAI Whisper v3 (Maximum Multilingual Accuracy)</option>
                      <option value="google">Google Cloud Speech-to-Text</option>
                      <option value="webspeech">Native Web Speech API (Client-side)</option>
                    </select>
                  </div>
                  <span className="voice-setting-hint">{t('Transcribes user voice into text in real-time.')}</span>
                </div>

                {/* Setting 2: LLM */}
                <div className="voice-setting-field">
                  <label className="voice-setting-label">
                    <span>{t('Reasoning Model (LLM)')}</span>
                  </label>
                  <div className="voice-select-wrap">
                    <select
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value)}
                      className="voice-setting-select"
                    >
                      <option value="gpt-4o">OpenAI GPT-4o Realtime (Recommended)</option>
                      <option value="claude">Anthropic Claude 3.5 Sonnet (Strategic Analysis)</option>
                      <option value="gemini">Google Gemini 1.5 Flash (High Velocity)</option>
                      <option value="llama">Meta LLaMA 3.3 70B (Private Cloud)</option>
                    </select>
                  </div>
                  <span className="voice-setting-hint">{t('Understands CRM context, queries, and business workflows.')}</span>
                </div>

                {/* Pipeline Status Summary */}
                <div className="voice-pipeline-status-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{t('Streaming Pipeline Status: Optimal')}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    STT ({sttProvider}) → LLM ({llmProvider}) → TTS ({ttsProvider}). Ready for zero-delay CRM conversations.
                  </div>
                </div>

                {/* Save / Reset Preferences */}
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('crm_voice_config', JSON.stringify({
                        sttProvider,
                        llmProvider,
                        ttsProvider,
                        voicePersona,
                        speakingSpeed,
                      }));
                      addToast({
                        title: 'Settings Saved',
                        message: 'Voice pipeline preferences saved successfully.',
                        type: 'success',
                      });
                    }}
                    className="voice-save-settings-btn"
                  >
                    <CheckCircle2 size={15} />
                    <span>{t('Save Configuration')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSttProvider('deepgram');
                      setLlmProvider('gpt-4o');
                      setTtsProvider('elevenlabs');
                      setVoicePersona('sarah');
                      setSpeakingSpeed(1.0);
                      addToast({
                        title: 'Settings Reset',
                        message: 'Restored default voice pipeline settings.',
                        type: 'info',
                      });
                    }}
                    className="voice-reset-settings-btn"
                  >
                    <RefreshCw size={14} />
                    <span>{t('Reset')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiVoiceAgent;
